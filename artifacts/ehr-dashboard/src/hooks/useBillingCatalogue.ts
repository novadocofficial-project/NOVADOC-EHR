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

// ─── Core builder (pure, no hooks) ───────────────────────────────────────────

function buildCatalogue(): { categories: BillCategory[]; packages: BillPackage[] } {

  // ── Consultation ──────────────────────────────────────────────────────────
  const doctors  = ls<Doctor[]>("ehr-doctors-v1", INITIAL_DOCTORS);
  const feesMap  = ls<Record<string, FeeRow[]>>("ehr-doctor-fees-v1", {});
  const activeDocs = doctors.filter(d => d.status === "active");

  const consultationCat: BillCategory = {
    id: "consultation", label: "Consultation",
    providers: [], defaultProviderId: null,
    getItems: () => {
      const items: BillCatItem[] = [];
      for (const doc of activeDocs) {
        const firstRow: FeeRow | undefined = (feesMap[doc.id] ?? [])[0];
        for (const svc of doc.services) {
          if (!CONSULT_SERVICES.includes(svc)) continue;
          const feeKey = SVC_TO_FEE[svc];
          const price  = parseFloat((firstRow?.[feeKey] as string | undefined) ?? "") || 0;
          items.push({ id: `${doc.id}::${svc}`, name: svc, price, subLabel: doc.name });
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

export function useBillingCatalogue(): { categories: BillCategory[]; packages: BillPackage[] } {
  const [catalogue, setCatalogue] = useState(() => buildCatalogue());

  useEffect(() => {
    function onStorage() { setCatalogue(buildCatalogue()); }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return catalogue;
}
