import { useState, useCallback } from "react";
import type { AllergyEntry } from "@/pages/AllergySelector";
import type { MedicineEntry } from "@/pages/FormularySection";
import type { LabOrder } from "@/pages/LabDrawer";
import type { ImagingOrder } from "@/pages/ImagingSection";
import type { DiagnosisEntry } from "@/pages/DiagnosisDrawer";
import type { SurgicalEntry, FamilyRow, SocAnswers } from "@/pages/MedicalHistorySection";
import type { PocTestResult } from "@/pages/PocLabsSection";
import type { NoteState } from "@/pages/ClinicalNoteDrawer";

const REPO_KEY = "ehr-soap-data-v1";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatientSoapRepo {
  chiefComplaints: string[];
  hpi:             string[];
  allergies:       AllergyEntry[];
  pmhActive:       string[];
  pmhResolved:     string[];
  surgicalRows:    SurgicalEntry[];
  fhRows:          FamilyRow[];
  socialHistory:   SocAnswers;
  ros:             Record<string, string[]>;
  peSystems:       string[];
  pocTests:        PocTestResult[];
  diagnoses:       DiagnosisEntry[];
  labOrders:       LabOrder[];
  imagingOrders:   ImagingOrder[];
  medicines:       MedicineEntry[];
  carePlan:        unknown;
  referrals:       unknown;
  procedureOrders: unknown;
  patientGoals:    unknown;
  healthEd:        unknown;
}

export const EMPTY_SOAP_REPO: PatientSoapRepo = {
  chiefComplaints: [], hpi: [], allergies: [],
  pmhActive: [], pmhResolved: [], surgicalRows: [], fhRows: [],
  socialHistory: {},
  ros: {}, peSystems: [], pocTests: [], diagnoses: [],
  labOrders: [], imagingOrders: [], medicines: [],
  carePlan: null, referrals: null, procedureOrders: null,
  patientGoals: null, healthEd: null,
};

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadAll(): Record<string, PatientSoapRepo> {
  try {
    const raw = localStorage.getItem(REPO_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PatientSoapRepo>) : {};
  } catch {
    return {};
  }
}

function saveAll(all: Record<string, PatientSoapRepo>): void {
  try {
    localStorage.setItem(REPO_KEY, JSON.stringify(all));
  } catch { /* storage quota */ }
}

// ─── Merge helpers ────────────────────────────────────────────────────────────

function mergeArr<T extends Record<string, unknown>>(
  existing: T[],
  incoming: T[],
  key: (item: T) => string | undefined,
): T[] {
  const map = new Map<string, T>(
    existing.map(x => {
      const k = key(x);
      return [k ?? Math.random().toString(), x];
    }),
  );
  for (const x of incoming) {
    const k = key(x);
    if (k) map.set(k, x);
  }
  return Array.from(map.values());
}

function mergeStrSet(existing: string[], incoming: string[]): string[] {
  const set = new Set(existing);
  for (const s of incoming) if (s?.trim()) set.add(s.trim());
  return Array.from(set);
}

// ─── Standalone merge util ────────────────────────────────────────────────────

/**
 * Merge a partial patch into the repo for the given MRN.
 * Dedup rules per field:
 *   - allergies       → by name.toLowerCase()
 *   - diagnoses       → by code
 *   - labOrders       → by id (voided entries are filtered out)
 *   - imagingOrders   → by uid
 *   - medicines       → by medicineId
 *   - surgicalRows    → by id
 *   - fhRows          → by id
 *   - pocTests        → by id
 *   - chiefComplaints / pmhActive / pmhResolved / peSystems → Set dedup
 *   - ros             → merge per system key, Set dedup per finding
 *   - hpi             → last non-empty string wins
 *   - complex sections → last-write-wins (null/undefined skipped)
 */
export function mergePatientSoapSection(mrn: string, patch: Partial<PatientSoapRepo>): void {
  if (!mrn) return;
  const all = loadAll();
  const prior: PatientSoapRepo = all[mrn] ?? { ...EMPTY_SOAP_REPO };

  if (patch.chiefComplaints?.length)
    prior.chiefComplaints = mergeStrSet(prior.chiefComplaints, patch.chiefComplaints);

  if (Array.isArray(patch.hpi)) {
    const existing = prior.hpi ?? [];
    for (const entry of patch.hpi) {
      const trimmed = entry?.trim();
      if (trimmed && !existing.includes(trimmed))
        existing.push(trimmed);
    }
    prior.hpi = existing;
  }

  if (patch.allergies?.length)
    prior.allergies = mergeArr(
      prior.allergies as unknown as Record<string, unknown>[],
      patch.allergies as unknown as Record<string, unknown>[],
      a => (a as unknown as AllergyEntry).name?.toLowerCase(),
    ) as unknown as AllergyEntry[];

  if (patch.pmhActive?.length)
    prior.pmhActive = mergeStrSet(prior.pmhActive, patch.pmhActive);

  if (patch.pmhResolved?.length)
    prior.pmhResolved = mergeStrSet(prior.pmhResolved, patch.pmhResolved);

  if (patch.surgicalRows?.length)
    prior.surgicalRows = mergeArr(
      prior.surgicalRows as unknown as Record<string, unknown>[],
      patch.surgicalRows as unknown as Record<string, unknown>[],
      r => (r as unknown as SurgicalEntry).id,
    ) as unknown as SurgicalEntry[];

  if (patch.fhRows?.length)
    prior.fhRows = mergeArr(
      prior.fhRows as unknown as Record<string, unknown>[],
      patch.fhRows as unknown as Record<string, unknown>[],
      r => (r as unknown as FamilyRow).id,
    ) as unknown as FamilyRow[];

  if (patch.socialHistory && Object.keys(patch.socialHistory).length)
    prior.socialHistory = { ...(prior.socialHistory ?? {}), ...patch.socialHistory };

  if (patch.ros && Object.keys(patch.ros).length) {
    const merged = { ...prior.ros };
    for (const [sys, findings] of Object.entries(patch.ros)) {
      if (findings?.length) merged[sys] = mergeStrSet(merged[sys] ?? [], findings);
    }
    prior.ros = merged;
  }

  if (patch.peSystems?.length)
    prior.peSystems = mergeStrSet(prior.peSystems, patch.peSystems);

  if (patch.pocTests?.length)
    prior.pocTests = mergeArr(
      prior.pocTests as unknown as Record<string, unknown>[],
      patch.pocTests as unknown as Record<string, unknown>[],
      t => (t as unknown as PocTestResult).id,
    ) as unknown as PocTestResult[];

  if (patch.diagnoses?.length)
    prior.diagnoses = mergeArr(
      prior.diagnoses as unknown as Record<string, unknown>[],
      patch.diagnoses as unknown as Record<string, unknown>[],
      d => (d as unknown as DiagnosisEntry).code,
    ) as unknown as DiagnosisEntry[];

  if (patch.labOrders?.length) {
    const incoming = (patch.labOrders as LabOrder[]).filter(lo => !lo.voided);
    if (incoming.length)
      prior.labOrders = mergeArr(
        prior.labOrders as unknown as Record<string, unknown>[],
        incoming as unknown as Record<string, unknown>[],
        lo => (lo as unknown as LabOrder).id,
      ) as unknown as LabOrder[];
  }

  if (patch.imagingOrders?.length)
    prior.imagingOrders = mergeArr(
      prior.imagingOrders as unknown as Record<string, unknown>[],
      patch.imagingOrders as unknown as Record<string, unknown>[],
      io => (io as unknown as ImagingOrder).uid,
    ) as unknown as ImagingOrder[];

  if (patch.medicines?.length)
    prior.medicines = mergeArr(
      prior.medicines as unknown as Record<string, unknown>[],
      patch.medicines as unknown as Record<string, unknown>[],
      m => (m as unknown as MedicineEntry).medicineId,
    ) as unknown as MedicineEntry[];

  if (patch.carePlan        != null) prior.carePlan        = patch.carePlan;
  if (patch.referrals       != null) prior.referrals       = patch.referrals;
  if (patch.procedureOrders != null) prior.procedureOrders = patch.procedureOrders;
  if (patch.patientGoals    != null) prior.patientGoals    = patch.patientGoals;
  if (patch.healthEd        != null) prior.healthEd        = patch.healthEd;

  all[mrn] = prior;
  saveAll(all);
}

/**
 * Merge all populated sections from a NoteState into the repo for the given MRN.
 * Call this at SOAP-note sign time and (debounced) on draft saves.
 */
export function mergePatientSoapNote(mrn: string, note: NoteState): void {
  if (!mrn) return;
  const patch: Partial<PatientSoapRepo> = {};

  if (note.chiefComplaints?.length)              patch.chiefComplaints = note.chiefComplaints;
  if (note.hpi?.trim())                          patch.hpi             = [note.hpi];
  if (note.allergies?.length)                    patch.allergies       = note.allergies;
  if (note.pmhActive?.length)                    patch.pmhActive       = note.pmhActive;
  if (note.pmhResolved?.length)                  patch.pmhResolved     = note.pmhResolved;
  if (note.surgicalRows?.length)                 patch.surgicalRows    = note.surgicalRows;
  if (note.fhRows?.length)                       patch.fhRows          = note.fhRows;
  if (note.socialHistory && Object.keys(note.socialHistory).length)
                                                 patch.socialHistory   = note.socialHistory as SocAnswers;
  if (note.ros && Object.keys(note.ros).length)  patch.ros             = note.ros;
  if (note.peSystems?.length)                    patch.peSystems       = note.peSystems;
  if (note.pocTests?.length)                     patch.pocTests        = note.pocTests;
  if (note.diagnoses?.length)                    patch.diagnoses       = note.diagnoses;

  const nonVoidedLabs = (note.labOrders ?? []).filter(lo => !lo.voided);
  if (nonVoidedLabs.length)                      patch.labOrders       = nonVoidedLabs;

  if (note.imaging?.orders?.length)              patch.imagingOrders   = note.imaging.orders;
  if (note.formulary?.medicines?.length)         patch.medicines       = note.formulary.medicines;
  if ((note.carePlan?.tasks?.length ?? 0) > 0)   patch.carePlan        = note.carePlan;
  if ((note.referrals?.referrals?.length ?? 0) > 0) patch.referrals    = note.referrals;
  if ((note.procedureOrders?.orders?.length ?? 0) > 0) patch.procedureOrders = note.procedureOrders;
  if ((note.patientGoals?.goals?.length ?? 0) > 0)    patch.patientGoals    = note.patientGoals;
  if ((note.healthEd?.docIds?.length ?? 0) > 0)       patch.healthEd        = note.healthEd;

  if (Object.keys(patch).length === 0) return;
  mergePatientSoapSection(mrn, patch);
}

// ─── React hook ───────────────────────────────────────────────────────────────

/**
 * React hook — reads ehr-soap-data-v1 for this patient and exposes mergeSection / getSection.
 * The `data` object is the latest stored repo for this MRN.
 */
export function usePatientSoapData(mrn: string): {
  data: PatientSoapRepo;
  mergeSection: (patch: Partial<PatientSoapRepo>) => void;
  getSection: <K extends keyof PatientSoapRepo>(id: K) => PatientSoapRepo[K];
} {
  const [data, setData] = useState<PatientSoapRepo>(() => {
    if (!mrn) return { ...EMPTY_SOAP_REPO };
    const all = loadAll();
    return all[mrn] ?? { ...EMPTY_SOAP_REPO };
  });

  const mergeSection = useCallback((patch: Partial<PatientSoapRepo>) => {
    if (!mrn) return;
    mergePatientSoapSection(mrn, patch);
    const all = loadAll();
    setData(all[mrn] ?? { ...EMPTY_SOAP_REPO });
  }, [mrn]);

  const getSection = useCallback(<K extends keyof PatientSoapRepo>(id: K): PatientSoapRepo[K] => {
    return data[id];
  }, [data]);

  return { data, mergeSection, getSection };
}
