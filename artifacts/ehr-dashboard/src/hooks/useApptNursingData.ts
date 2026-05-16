import { useState, useCallback } from "react";

export interface ApptNursingRecord {
  vitalValues:    Record<string, string>;
  painScore:      number;
  mentalAnswers:  number[];
  savedAt:        number | null;
}

type ApptNursingStore = Record<string, ApptNursingRecord>;

const STORAGE_KEY = "ehr-appt-nursing-v1";

function makeDefaultRecord(): ApptNursingRecord {
  return {
    vitalValues: {
      bp_sys: "121", bp_dia: "77", bp_pos: "sitting", bp_orth: "no",
      pulse: "76", temp: "37.0", spo2: "97", weight: "72", height: "168", bmi: "25.5",
      _date: new Date().toISOString().slice(0, 10),
    },
    painScore: 5,
    mentalAnswers: [1, 1, 2, 1],
    savedAt: null,
  };
}

function loadStore(): ApptNursingStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ApptNursingStore;
  } catch { /**/ }
  return {};
}

function saveStore(store: ApptNursingStore) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /**/ }
}

export function useApptNursingData(appointmentId: string) {
  const [record, setRecord] = useState<ApptNursingRecord>(() => {
    const store = loadStore();
    return store[appointmentId] ?? makeDefaultRecord();
  });

  const save = useCallback((patch: Partial<ApptNursingRecord>) => {
    setRecord(prev => {
      const next = { ...prev, ...patch, savedAt: Date.now() };
      const store = loadStore();
      store[appointmentId] = next;
      saveStore(store);
      return next;
    });
  }, [appointmentId]);

  return { record, save };
}
