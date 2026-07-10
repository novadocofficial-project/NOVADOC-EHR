import { useState, useCallback } from "react";
import { SEED_HEALTH_RECORDS, HealthRecordEntry } from "@/data/healthRecordsSeed";

const STORAGE_KEY = "ehr-health-records-v1";

function loadHealthRecords(): HealthRecordEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed    = JSON.parse(stored) as HealthRecordEntry[];
      const storedIds = new Set(parsed.map(r => r.id));
      const missing   = SEED_HEALTH_RECORDS.filter(r => !storedIds.has(r.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    }
  } catch { /* ignore */ }
  return [...SEED_HEALTH_RECORDS];
}

export function useHealthRecords() {
  const [records, setRecords] = useState<HealthRecordEntry[]>(loadHealthRecords);

  const deleteHealthRecord = useCallback((id: string) => {
    setRecords(prev => {
      const next = prev.filter(r => r.id !== id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { records, deleteHealthRecord };
}
