import { useState, useCallback } from "react";
import { SEED_PATIENTS, Patient } from "@/pages/QueuePageLayout";

const STORAGE_KEY   = "ehr-patients-v1";
const OVERRIDES_KEY = "ehr-patient-overrides";

function loadPatients(): Patient[] {
  const overrides: Record<string, Partial<Patient>> = {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (raw) Object.assign(overrides, JSON.parse(raw));
  } catch { /* ignore */ }

  const seeds = SEED_PATIENTS.map(p => ({ ...p, ...overrides[p.id] }));

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed  = JSON.parse(stored) as Patient[];
      const seedIds = new Set(SEED_PATIENTS.map(p => p.id));
      const newOnes = parsed
        .filter(p => !seedIds.has(p.id))
        .map(p => ({ ...p, ...overrides[p.id] }));
      return [...seeds, ...newOnes];
    }
  } catch { /* ignore */ }

  return seeds;
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>(loadPatients);

  const addPatient = useCallback((patient: Patient) => {
    setPatients(prev => {
      if (prev.find(p => p.id === patient.id)) return prev;
      const next    = [...prev, patient];
      const toStore = next.filter(p => !SEED_PATIENTS.find(s => s.id === p.id));
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const updatePatient = useCallback((id: string, patch: Partial<Patient>) => {
    try {
      const raw       = localStorage.getItem(OVERRIDES_KEY);
      const overrides: Record<string, Partial<Patient>> = raw ? JSON.parse(raw) : {};
      overrides[id]   = { ...(overrides[id] ?? {}), ...patch };
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    } catch { /* ignore */ }
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }, []);

  return { patients, addPatient, updatePatient };
}
