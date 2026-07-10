import { useState, useCallback } from "react";
import { SEED_PATIENTS, Patient } from "@/pages/QueuePageLayout";

const STORAGE_KEY = "ehr-patients-v1";

function loadPatients(): Patient[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed    = JSON.parse(stored) as Patient[];
      const storedIds = new Set(parsed.map(p => p.id));
      // Append any seed patients added after the user's first run (code updates).
      const missing   = SEED_PATIENTS.filter(p => !storedIds.has(p.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    }
  } catch { /* ignore */ }
  return [...SEED_PATIENTS];
}

/** Synchronous utility — safe to call in event handlers (e.g. onClick navigation). */
export function getPatientIdByMrn(mrn: string): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const list = JSON.parse(stored) as Patient[];
      const found = list.find(p => p.mrn === mrn);
      if (found) return found.id;
    }
  } catch { /* ignore */ }
  const seed = SEED_PATIENTS.find(p => p.mrn === mrn);
  return seed?.id ?? mrn;
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>(loadPatients);

  const addPatient = useCallback((patient: Patient) => {
    setPatients(prev => {
      if (prev.find(p => p.id === patient.id)) return prev;
      const next = [...prev, patient];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const updatePatient = useCallback((id: string, patch: Partial<Patient>) => {
    setPatients(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...patch } : p);
      // Persist the full list (including edited seed patients) so edits survive refresh.
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const deletePatient = useCallback((id: string) => {
    setPatients(prev => {
      const next = prev.filter(p => p.id !== id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { patients, addPatient, updatePatient, deletePatient };
}
