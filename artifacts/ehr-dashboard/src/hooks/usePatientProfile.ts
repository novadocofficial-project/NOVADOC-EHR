import { useMemo } from "react";
import type { Appointment } from "@/hooks/useAppointments";
import { readPatientClinicalSnapshot } from "@/hooks/useSoapNoteDraft";
import type { VitalEntry } from "@/types/vitals";
import type { AllergyEntry } from "@/pages/AllergySelector";
import type { FamilyRow } from "@/pages/MedicalHistorySection";
import type { MedicineEntry } from "@/pages/FormularySection";
import type { LabOrder } from "@/pages/LabDrawer";
import type { ImagingOrder } from "@/pages/ImagingSection";
import type { DiagnosisEntry } from "@/pages/DiagnosisDrawer";

export type { VitalEntry };

const QUEUE_KEY    = "ehr-queue-v2";
const APPTS_KEY    = "ehr-appointments-v1";
const INVOICES_KEY = "ehr-appt-invoices";
const SIGNED_PFX   = "soap_signed_";

export interface VisitRecord {
  entryId:       string;
  signedRecords: { date: string; day: string; time: string; type: string; doctor: string }[];
}

export interface PatientProfileData {
  appointments:  Appointment[];
  invoices:      Record<string, unknown>;
  visits:        VisitRecord[];
  /**
   * Clinical data sourced from the per-patient signed-note snapshot
   * (soap_clinical_{mrn}) written at sign time, with in-progress SOAP drafts
   * merged on top so active consultations are reflected immediately.
   */
  allergies:     AllergyEntry[];
  medicines:     MedicineEntry[];
  labOrders:     LabOrder[];
  imagingOrders: ImagingOrder[];
  fhRows:        FamilyRow[];
  diagnoses:     DiagnosisEntry[];
  /** Vital readings accumulated across signed consultations. */
  vitals:        VitalEntry[];
}

export function usePatientProfile(mrn: string): PatientProfileData {
  return useMemo(() => {
    if (!mrn) {
      return {
        appointments: [], invoices: {}, visits: [],
        allergies: [], medicines: [], labOrders: [],
        imagingOrders: [], fhRows: [], diagnoses: [], vitals: [],
      };
    }

    // ── Appointments ──────────────────────────────────────────────────────────
    let appointments: Appointment[] = [];
    try {
      const raw = localStorage.getItem(APPTS_KEY);
      if (raw) {
        appointments = (JSON.parse(raw) as Appointment[])
          .filter(a => a.patientMrn === mrn)
          .sort((a, b) => b.date.localeCompare(a.date));
      }
    } catch { /* ignore */ }

    // ── Invoices ──────────────────────────────────────────────────────────────
    let invoices: Record<string, unknown> = {};
    try {
      const raw = localStorage.getItem(INVOICES_KEY);
      if (raw) invoices = JSON.parse(raw);
    } catch { /* ignore */ }

    // ── Queue visits + signed records ─────────────────────────────────────────
    let visits: VisitRecord[] = [];
    const entryIds: string[] = [];
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (raw) {
        const queue = JSON.parse(raw) as { id: string; patient?: { mrn?: string } }[];
        visits = queue
          .filter(e => e.patient?.mrn === mrn)
          .map(e => {
            entryIds.push(e.id);
            let signedRecords: VisitRecord["signedRecords"] = [];
            try {
              const sr = localStorage.getItem(`${SIGNED_PFX}${e.id}`);
              if (sr) signedRecords = JSON.parse(sr);
            } catch { /* ignore */ }
            return { entryId: e.id, signedRecords };
          });
      }
    } catch { /* ignore */ }

    // ── Clinical aggregation ──────────────────────────────────────────────────
    // Primary: signed-note clinical snapshot (soap_clinical_{mrn})
    // Secondary: in-progress drafts (soap_draft_{entryId}) merged on top
    const allergyMap   = new Map<string, AllergyEntry>();
    const medicineMap  = new Map<string, MedicineEntry>();
    const labOrderMap  = new Map<string, LabOrder>();
    const imagingMap   = new Map<string, ImagingOrder>();
    const fhMap        = new Map<string, FamilyRow>();
    const diagnosisMap = new Map<string, DiagnosisEntry>();

    // 1. Seed from signed-note clinical snapshot (accumulated across all signed visits)
    const snapshot = readPatientClinicalSnapshot(mrn);
    if (snapshot) {
      for (const a of snapshot.allergies as AllergyEntry[]) {
        if (a.name) allergyMap.set(a.name.toLowerCase(), a);
      }
      for (const m of snapshot.medicines as MedicineEntry[]) {
        const k = m.medicineId ?? m.uid;
        if (k) medicineMap.set(k, m);
      }
      for (const lo of snapshot.labOrders as LabOrder[]) {
        if (lo.id) labOrderMap.set(lo.id, lo);
      }
      for (const io of snapshot.imagingOrders as ImagingOrder[]) {
        if (io.uid) imagingMap.set(io.uid, io);
      }
      for (const row of snapshot.fhRows as FamilyRow[]) {
        if ((row as { id?: string }).id) fhMap.set((row as { id?: string }).id!, row);
      }
      for (const dx of snapshot.diagnoses as DiagnosisEntry[]) {
        if (dx.code) diagnosisMap.set(dx.code, dx);
      }
    }

    return {
      appointments,
      invoices,
      visits,
      allergies:     Array.from(allergyMap.values()),
      medicines:     Array.from(medicineMap.values()),
      labOrders:     Array.from(labOrderMap.values()),
      imagingOrders: Array.from(imagingMap.values()),
      fhRows:        Array.from(fhMap.values()),
      diagnoses:     Array.from(diagnosisMap.values()),
      vitals:        snapshot?.vitals ?? [],
    };
  }, [mrn]);
}
