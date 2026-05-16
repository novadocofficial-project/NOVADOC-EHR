import { useMemo } from "react";
import { SEED_PATIENTS } from "@/pages/QueuePageLayout";
import type { Patient } from "@/pages/QueuePageLayout";
import type { Appointment } from "@/hooks/useAppointments";

const PATIENTS_KEY = "ehr-patients-v1";
const QUEUE_KEY    = "ehr-queue-v2";
const APPTS_KEY    = "ehr-appointments-v1";
const INVOICES_KEY = "ehr-appt-invoices";
const SIGNED_PFX   = "soap_signed_";

function loadAllPatients(): Patient[] {
  try {
    const stored = localStorage.getItem(PATIENTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Patient[];
      const storedIds = new Set(parsed.map(p => p.id));
      const missing   = SEED_PATIENTS.filter(s => !storedIds.has(s.id));
      return [...parsed, ...missing];
    }
  } catch { /* ignore */ }
  return [...SEED_PATIENTS];
}

export interface VisitRecord {
  entryId:       string;
  signedRecords: { date: string; day: string; time: string; type: string; doctor: string }[];
}

export interface PatientProfileData {
  patient:      Patient | null;
  appointments: Appointment[];
  invoices:     Record<string, unknown>;
  visits:       VisitRecord[];
}

export function usePatientProfile(mrn: string): PatientProfileData {
  return useMemo(() => {
    const patient = loadAllPatients().find(p => p.mrn === mrn) ?? null;

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
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (raw) {
        const queue = JSON.parse(raw) as { id: string; patient?: { mrn?: string } }[];
        visits = queue
          .filter(e => e.patient?.mrn === mrn)
          .map(e => {
            let signedRecords: VisitRecord["signedRecords"] = [];
            try {
              const sr = localStorage.getItem(`${SIGNED_PFX}${e.id}`);
              if (sr) signedRecords = JSON.parse(sr);
            } catch { /* ignore */ }
            return { entryId: e.id, signedRecords };
          });
      }
    } catch { /* ignore */ }

    return { patient, appointments, invoices, visits };
  }, [mrn]);
}
