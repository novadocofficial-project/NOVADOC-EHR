import { useState, useEffect } from "react";
import { INITIAL_DOCTORS } from "@/pages/DoctorsModule";
import type { Doctor } from "@/pages/DoctorsModule";
import type { FeeRow } from "@/pages/FeesModule";
import { SEED_SECTIONS as LAB_SEED_SECTIONS, SEED_PROVIDERS as LAB_SEED_PROVIDERS } from "@/pages/LabCatalogModule";
import type { LabSection, LabProvider } from "@/pages/LabCatalogModule";
import { INITIAL_PROC_SECTIONS, INITIAL_PROC_PARTNERS } from "@/pages/ProcedureCatalogModule";
import type { ProcedureSection, ProcedurePartner } from "@/pages/ProcedureCatalogModule";
import type { ImagingPartner } from "@/pages/ImagingCatalogModule";
import type { FormularyPartner } from "@/pages/FormularyPartnersModule";
import { INITIAL_DEPARTMENTS } from "@/pages/AdminSettings";
import type { Department } from "@/pages/AdminSettings";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BillCatItem = {
  id:        string;
  name:      string;
  price:     number;
  subLabel?: string;
};

export type BillCatProvider = {
  id:   string;
  name: string;
};

export type BillCategory = {
  id:                "consultation" | "lab" | "imaging" | "pharmacy" | "procedures";
  label:             string;
  providers:         BillCatProvider[];
  defaultProviderId: string | null;
  getItems:          (providerId: string | null) => BillCatItem[];
};

export type BillPackage = {
  id:          string;
  name:        string;
  description: string;
  price:       number;
};

/**
 * Optional appointment context — when provided, the consultation category
 * is filtered to show only the relevant doctor and the department-specific
 * fee that matches the appointment's specialty.
 */
export type ApptFilter = {
  doctorId:  string;
  specialty: string;
  apptType:  string;
};

// ─── Local types mirroring Admin modules (avoid circular imports) ─────────────

interface ImagingTest { id: string; name: string; category: string; enabled: boolean; deleted: boolean; }

interface FormBrand  { id: string; brand: string; strength: string; }
interface FormGeneric { id: string; generic: string; category: string; brands: FormBrand[]; enabled: boolean; deleted: boolean; }

interface PkgBundle { id: string; name: string; description: string; active: boolean; pricingModel: "manual" | "auto"; manualPrice: string; }

// ─── Read helper ──────────────────────────────────────────────────────────────

function ls<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /**/ }
  return fallback;
}

// ─── Consultation service → FeeRow field mapping ──────────────────────────────

const CONSULT_SERVICES = ["Consultation", "FollowUp", "Emergency", "Tele-consultation"];

type FeeField = "consultationFee" | "followUpFee" | "emergencyFee" | "teleFee";
const SVC_TO_FEE: Record<string, FeeField> = {
  "Consultation":      "consultationFee",
  "FollowUp":          "followUpFee",
  "Emergency":         "emergencyFee",
  "Tele-consultation": "teleFee",
};

// ─── Resolve specialty name → department ID ───────────────────────────────────

function resolveDeptId(specialty: string, departments: Department[]): string | null {
  for (const dept of departments) {
    if (dept.specialties.some(s => s.name === specialty)) return dept.id;
    for (const sub of dept.subDepartments) {
      if (sub.specialties.some(s => s.name === specialty)) return dept.id;
    }
  }
  return null;
}

// ─── Core builder (pure, no hooks) ───────────────────────────────────────────

function buildCatalogue(apptFilter?: ApptFilter): { categories: BillCategory[]; packages: BillPackage[] } {

  // ── Consultation ──────────────────────────────────────────────────────────
  const doctors      = ls<Doctor[]>("ehr-doctors-v1", INITIAL_DOCTORS);
  const feesMap      = ls<Record<string, FeeRow[]>>("ehr-doctor-fees-v1", {});
  const departments  = ls<Department[]>("ehr-departments-v1", INITIAL_DEPARTMENTS);

  // When an appointment filter is provided, scope to that doctor only;
  // otherwise show all active doctors.
  const activeDocs = apptFilter
    ? doctors.filter(d => d.id === apptFilter.doctorId && d.status === "active")
    : doctors.filter(d => d.status === "active");

  // Resolve the department ID from the appointment's specialty.
  const filteredDeptId = apptFilter
    ? resolveDeptId(apptFilter.specialty, departments)
    : null;

  const consultationCat: BillCategory = {
    id: "consultation", label: "Consultation",
    providers: [], defaultProviderId: null,
    getItems: () => {
      const items: BillCatItem[] = [];

      for (const doc of activeDocs) {
        const rows = feesMap[doc.id] ?? [];

        if (apptFilter) {
          // ── Filtered mode: show only services that doctor offers ──────────
          // If the appointment type is a consultation service, only show that
          // specific service; otherwise show all the doctor's services.
          const svcsToShow = CONSULT_SERVICES.includes(apptFilter.apptType)
            ? [apptFilter.apptType]
            : doc.services.filter(s => CONSULT_SERVICES.includes(s));

          for (const svc of svcsToShow) {
            if (!doc.services.includes(svc)) continue;
            const feeKey = SVC_TO_FEE[svc];
            if (!feeKey) continue;

            // Prefer the fee row matching the appointment's department;
            // fall back to the first non-zero row if none is found.
            let price = 0;
            if (filteredDeptId) {
              const deptRow = rows.find(r => r.deptId === filteredDeptId);
              price = deptRow
                ? (parseFloat((deptRow[feeKey] as string | undefined) ?? "") || 0)
                : 0;
            }
            if (price === 0) {
              price = rows.reduce<number>((best, row) => {
                if (best > 0) return best;
                return parseFloat((row[feeKey] as string | undefined) ?? "") || 0;
              }, 0);
            }

            items.push({ id: `${doc.id}::${svc}`, name: svc, price, subLabel: doc.name });
          }
        } else {
          // ── Unfiltered mode (original): all doctors, all services ─────────
          for (const svc of doc.services) {
            if (!CONSULT_SERVICES.includes(svc)) continue;
            const feeKey = SVC_TO_FEE[svc];
            const price = rows.reduce<number>((best, row) => {
              if (best > 0) return best;
              return parseFloat((row[feeKey] as string | undefined) ?? "") || 0;
            }, 0);
            items.push({ id: `${doc.id}::${svc}`, name: svc, price, subLabel: doc.name });
          }
        }
      }

      return items;
    },
  };

  // ── Lab ───────────────────────────────────────────────────────────────────
  const labSections  = ls<LabSection[]>("ehr-lab-sections-v1",  LAB_SEED_SECTIONS);
  const labProviders = ls<LabProvider[]>("ehr-lab-providers-v1", LAB_SEED_PROVIDERS);
  const activeLabProvs = labProviders.filter(p => p.active);
  const allLabTests    = labSections.flatMap(s => s.tests);

  const labCat: BillCategory = {
    id: "lab", label: "Lab / Pathology",
    providers:         activeLabProvs.map(p => ({ id: p.id, name: p.name })),
    defaultProviderId: activeLabProvs[0]?.id ?? null,
    getItems: (provId) => {
      const prov = activeLabProvs.find(p => p.id === provId) ?? activeLabProvs[0];
      return allLabTests.map(t => ({
        id: t.id, name: t.name,
        price: prov ? (parseFloat(prov.pricing[t.id] ?? "") || 0) : 0,
      }));
    },
  };

  // ── Imaging ───────────────────────────────────────────────────────────────
  const imagingTests    = ls<ImagingTest[]>("ehr-imaging-catalogue-v1", []).filter(t => t.enabled && !t.deleted);
  const imagingPartners = ls<ImagingPartner[]>("ehr-imaging-partners-v1", []);
  const activeImgProvs  = imagingPartners.filter(p => p.active);

  const imagingCat: BillCategory = {
    id: "imaging", label: "Radiology / Imaging",
    providers:         activeImgProvs.map(p => ({ id: p.id, name: p.name })),
    defaultProviderId: activeImgProvs[0]?.id ?? null,
    getItems: (provId) => {
      const prov = activeImgProvs.find(p => p.id === provId) ?? activeImgProvs[0];
      return imagingTests.map(t => ({
        id: t.id, name: t.name,
        price: prov ? (parseFloat(prov.pricing[t.id] ?? "") || 0) : 0,
      }));
    },
  };

  // ── Pharmacy ──────────────────────────────────────────────────────────────
  const generics       = ls<FormGeneric[]>("ehr-formulary-catalogue-v1", []).filter(g => g.enabled && !g.deleted);
  const pharmPartners  = ls<FormularyPartner[]>("ehr-formulary-partners-v1", []);
  const activePharmProvs = pharmPartners.filter(p => p.active);
  const allBrands = generics.flatMap(g => g.brands.map(b => ({ genericName: g.generic, brand: b })));

  const pharmacyCat: BillCategory = {
    id: "pharmacy", label: "Pharmacy",
    providers:         activePharmProvs.map(p => ({ id: p.id, name: p.name })),
    defaultProviderId: activePharmProvs[0]?.id ?? null,
    getItems: (provId) => {
      const prov = activePharmProvs.find(p => p.id === provId) ?? activePharmProvs[0];
      return allBrands.map(({ genericName, brand }) => ({
        id:   brand.id,
        name: `${genericName} — ${brand.brand}${brand.strength ? ` ${brand.strength}` : ""}`,
        price: prov ? (parseFloat(prov.sellingPrice[brand.id] ?? "") || 0) : 0,
        subLabel: genericName,
      }));
    },
  };

  // ── Procedures ────────────────────────────────────────────────────────────
  const procSections = ls<ProcedureSection[]>("ehr-procedure-sections-v1", INITIAL_PROC_SECTIONS);
  const procPartners = ls<ProcedurePartner[]>("ehr-procedure-partners-v1", INITIAL_PROC_PARTNERS);
  const activeProcProvs = procPartners.filter(p => p.active);
  const allProcs        = procSections.flatMap(s => s.procedures);

  const proceduresCat: BillCategory = {
    id: "procedures", label: "Procedures",
    providers:         activeProcProvs.map(p => ({ id: p.id, name: p.name })),
    defaultProviderId: activeProcProvs[0]?.id ?? null,
    getItems: (provId) => {
      const prov = activeProcProvs.find(p => p.id === provId) ?? activeProcProvs[0];
      return allProcs.map(item => ({
        id:    item.id,
        name:  item.name,
        price: prov ? (parseFloat(prov.pricing[item.id] ?? "") || 0) : 0,
      }));
    },
  };

  // ── Packages ──────────────────────────────────────────────────────────────
  const bundles = ls<PkgBundle[]>("ehr-packages-v1", []);
  const packages: BillPackage[] = bundles
    .filter(b => b.active)
    .map(b => ({
      id:          b.id,
      name:        b.name,
      description: b.description,
      price:       b.pricingModel === "manual" ? (parseFloat(b.manualPrice) || 0) : 0,
    }));

  return {
    categories: [consultationCat, labCat, imagingCat, pharmacyCat, proceduresCat],
    packages,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBillingCatalogue(apptFilter?: ApptFilter): { categories: BillCategory[]; packages: BillPackage[] } {
  const [catalogue, setCatalogue] = useState(() => buildCatalogue(apptFilter));

  useEffect(() => {
    function onStorage() { setCatalogue(buildCatalogue(apptFilter)); }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return catalogue;
}
