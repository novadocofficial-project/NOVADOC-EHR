import { useMemo } from "react";
import type { Appointment } from "@/hooks/useAppointments";
import { readSoapDraft } from "@/hooks/useSoapNoteDraft";
import type { AllergyEntry } from "@/pages/AllergySelector";
import type { FamilyRow } from "@/pages/MedicalHistorySection";
import type { MedicineEntry } from "@/pages/FormularySection";
import type { LabOrder } from "@/pages/LabDrawer";
import type { ImagingOrder } from "@/pages/ImagingSection";
import type { DiagnosisEntry } from "@/pages/DiagnosisDrawer";

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
  // Clinical aggregates read from in-progress SOAP drafts (soap_draft_[entryId])
  allergies:     AllergyEntry[];
  medicines:     MedicineEntry[];
  labOrders:     LabOrder[];
  imagingOrders: ImagingOrder[];
  fhRows:        FamilyRow[];
  diagnoses:     DiagnosisEntry[];
}

export function usePatientProfile(mrn: string): PatientProfileData {
  return useMemo(() => {
    let appointments: Appointment[] = [];
    try {
      const raw = localStorage.getItem(APPTS_KEY);
      if (raw) {
        appointments = (JSON.parse(raw) as Appointment[])
          .filter(a => a.patientMrn === mrn)
          .sort((a, b) => b.date.localeCompare(a.date));
      }
    } catch { /* ignore */ }

    let invoices: Record<string, unknown> = {};
    try {
      const raw = localStorage.getItem(INVOICES_KEY);
      if (raw) invoices = JSON.parse(raw);
    } catch { /* ignore */ }

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

    // Aggregate clinical data from SOAP drafts (soap_draft_[entryId]).
    // Drafts contain the full NoteState with allergies, formulary, lab orders,
    // imaging, family history, and diagnoses — the real clinical content
    // entered during a consultation.
    const allergyMap    = new Map<string, AllergyEntry>();
    const medicineMap   = new Map<string, MedicineEntry>();
    const labOrderMap   = new Map<string, LabOrder>();
    const imagingMap    = new Map<string, ImagingOrder>();
    const fhMap         = new Map<string, FamilyRow>();
    const diagnosisMap  = new Map<string, DiagnosisEntry>();

    for (const id of entryIds) {
      const draft = readSoapDraft(id);
      if (!draft) continue;

      for (const a of draft.allergies ?? []) {
        if (a.name) allergyMap.set(a.name.toLowerCase(), a);
      }
      for (const m of draft.formulary?.medicines ?? []) {
        if (m.uid) medicineMap.set(m.medicineId ?? m.uid, m);
      }
      for (const lo of draft.labOrders ?? []) {
        if (!lo.voided) labOrderMap.set(lo.id, lo);
      }
      for (const io of draft.imaging?.orders ?? []) {
        if (io.uid) imagingMap.set(io.uid, io);
      }
      for (const row of draft.fhRows ?? []) {
        if (row.id) fhMap.set(row.id, row);
      }
      for (const dx of draft.diagnoses ?? []) {
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
    };
  }, [mrn]);
}
