import { useState, useCallback } from "react";
import { SEED_PATIENTS, Patient } from "@/pages/QueuePageLayout";

const STORAGE_KEY = "ehr-patients-v1";

function loadPatients(): Patient[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Patient[];
      const seedIds = new Set(SEED_PATIENTS.map(p => p.id));
      const newOnes = parsed.filter(p => !seedIds.has(p.id));
      return [...SEED_PATIENTS, ...newOnes];
    }
  } catch {}
  return [...SEED_PATIENTS];
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>(loadPatients);

  const addPatient = useCallback((patient: Patient) => {
    setPatients(prev => {
      if (prev.find(p => p.id === patient.id)) return prev;
      const next = [...prev, patient];
      const toStore = next.filter(p => !SEED_PATIENTS.find(s => s.id === p.id));
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore)); } catch {}
      return next;
    });
  }, []);

  return { patients, addPatient };
}
