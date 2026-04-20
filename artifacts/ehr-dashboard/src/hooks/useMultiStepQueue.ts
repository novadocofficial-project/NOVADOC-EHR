import { useState, useEffect, useCallback } from "react";
import { QueueEntry, Patient, SEED_PATIENTS, SEED_VISIT_TYPES } from "@/pages/QueuePageLayout";

// ─── Extended Entry Type ───────────────────────────────────────────────────────

export type MultiEntry = QueueEntry & {
  patient: Patient | null;
  visitTypeId: string;
  callCount: number;
  skipped: boolean;
  billingCompleted: boolean;
  callTimestamp: number | null;
};

// ─── Seed Data ─────────────────────────────────────────────────────────────────

const now = new Date();

export const INITIAL_QUEUE: MultiEntry[] = [
  {
    id: "m-1", tokenNumber: "C103", displayNum: 103, status: "completed",
    step: 5, totalSteps: 5, stepLabel: "Pharmacy",
    patient: SEED_PATIENTS[4], visitTypeId: "vt-1",
    createdAt: new Date(now.getTime() - 90 * 60000),
    callCount: 1, skipped: false, billingCompleted: true, callTimestamp: null,
  },
  {
    id: "m-2", tokenNumber: "C104", displayNum: 104, status: "completed",
    step: 4, totalSteps: 5, stepLabel: "Lab / Sample",
    patient: SEED_PATIENTS[5], visitTypeId: "vt-1",
    createdAt: new Date(now.getTime() - 55 * 60000),
    callCount: 1, skipped: false, billingCompleted: true, callTimestamp: null,
  },
  {
    id: "m-3", tokenNumber: "C105", displayNum: 105, status: "called",
    step: 3, totalSteps: 5, stepLabel: "Doctor Consultation",
    patient: SEED_PATIENTS[0], visitTypeId: "vt-1",
    createdAt: new Date(now.getTime() - 30 * 60000),
    callCount: 1, skipped: false, billingCompleted: true, callTimestamp: null,
  },
  {
    id: "m-4", tokenNumber: "C106", displayNum: 106, status: "waiting",
    step: 1, totalSteps: 5, stepLabel: "Registration",
    patient: SEED_PATIENTS[1], visitTypeId: "vt-1",
    createdAt: new Date(now.getTime() - 12 * 60000),
    callCount: 0, skipped: false, billingCompleted: false, callTimestamp: null,
  },
  {
    id: "m-5", tokenNumber: "C107", displayNum: 107, status: "waiting",
    step: 1, totalSteps: 5, stepLabel: "Registration",
    patient: SEED_PATIENTS[2], visitTypeId: "vt-1",
    createdAt: new Date(now.getTime() - 6 * 60000),
    callCount: 0, skipped: false, billingCompleted: false, callTimestamp: null,
  },
  {
    id: "m-6", tokenNumber: "U001", displayNum: 1, status: "waiting",
    step: 1, totalSteps: 2, stepLabel: "Triage & Registration",
    patient: SEED_PATIENTS[3], visitTypeId: "vt-2",
    createdAt: new Date(now.getTime() - 8 * 60000),
    callCount: 0, skipped: false, billingCompleted: false, callTimestamp: null,
  },
  {
    id: "m-7", tokenNumber: "C108", displayNum: 108, status: "waiting",
    step: 1, totalSteps: 5, stepLabel: "Registration",
    patient: null,
    visitTypeId: "vt-1",
    createdAt: new Date(now.getTime() - 3 * 60000),
    callCount: 0, skipped: false, billingCompleted: false, callTimestamp: null,
  },
  {
    id: "m-8", tokenNumber: "C109", displayNum: 109, status: "waiting",
    step: 2, totalSteps: 5, stepLabel: "Vitals",
    patient: SEED_PATIENTS[3], visitTypeId: "vt-1",
    createdAt: new Date(now.getTime() - 22 * 60000),
    callCount: 0, skipped: false, billingCompleted: true, callTimestamp: null,
  },
  {
    id: "m-9", tokenNumber: "C110", displayNum: 110, status: "waiting",
    step: 2, totalSteps: 5, stepLabel: "Vitals",
    patient: SEED_PATIENTS[6], visitTypeId: "vt-1",
    createdAt: new Date(now.getTime() - 11 * 60000),
    callCount: 0, skipped: false, billingCompleted: true, callTimestamp: null,
  },
  {
    id: "m-10", tokenNumber: "C111", displayNum: 111, status: "waiting",
    step: 2, totalSteps: 5, stepLabel: "Vitals",
    patient: SEED_PATIENTS[0], visitTypeId: "vt-1",
    createdAt: new Date(now.getTime() - 5 * 60000),
    callCount: 0, skipped: false, billingCompleted: true, callTimestamp: null,
  },
];

// ─── Sync Utilities ────────────────────────────────────────────────────────────

const CHANNEL_NAME = "ehr-multistep-queue-v2";
const LS_QUEUE_KEY = "ehr-queue-v2";
const LS_NUMS_KEY  = "ehr-queue-nums-v2";
const LS_VER_KEY   = "ehr-queue-ver";
const QUEUE_VER    = "5"; // bump when seed schema changes

function loadQueue(): MultiEntry[] {
  try {
    // If stored version doesn't match, reset to fresh seed
    if (localStorage.getItem(LS_VER_KEY) !== QUEUE_VER) {
      localStorage.removeItem(LS_QUEUE_KEY);
      localStorage.removeItem(LS_NUMS_KEY);
      localStorage.setItem(LS_VER_KEY, QUEUE_VER);
      return INITIAL_QUEUE;
    }
    const raw = localStorage.getItem(LS_QUEUE_KEY);
    if (!raw) return INITIAL_QUEUE;
    return (JSON.parse(raw) as any[]).map(e => ({ ...e, createdAt: new Date(e.createdAt) }));
  } catch { return INITIAL_QUEUE; }
}

function saveQueue(q: MultiEntry[]) {
  localStorage.setItem(LS_QUEUE_KEY, JSON.stringify(q));
}

function loadNums(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_NUMS_KEY);
    return raw ? JSON.parse(raw) : { "vt-1": 109, "vt-2": 2, "vt-3": 1 };
  } catch { return { "vt-1": 109, "vt-2": 2, "vt-3": 1 }; }
}

function saveNums(n: Record<string, number>) {
  localStorage.setItem(LS_NUMS_KEY, JSON.stringify(n));
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useMultiStepQueue() {
  const [queue, setQueueRaw]   = useState<MultiEntry[]>(loadQueue);
  const [nextNums, setNumsRaw] = useState<Record<string, number>>(loadNums);

  // Listen for cross-tab broadcasts
  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.onmessage = ({ data }) => {
      if (data?.type === "QUEUE") {
        setQueueRaw((data.payload as any[]).map(e => ({ ...e, createdAt: new Date(e.createdAt) })));
      }
      if (data?.type === "NUMS") {
        setNumsRaw(data.payload);
      }
    };
    return () => ch.close();
  }, []);

  const broadcast = useCallback((type: string, payload: unknown) => {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.postMessage({ type, payload });
    ch.close();
  }, []);

  const setQueue = useCallback((updater: MultiEntry[] | ((prev: MultiEntry[]) => MultiEntry[])) => {
    setQueueRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveQueue(next);
      broadcast("QUEUE", next);
      return next;
    });
  }, [broadcast]);

  const setNextNums = useCallback((updater: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => {
    setNumsRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveNums(next);
      broadcast("NUMS", next);
      return next;
    });
  }, [broadcast]);

  // ── Shared mutations ─────────────────────────────────────────────────────────

  function callEntry(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id || e.status !== "waiting" ? e : { ...e, status: "called", callTimestamp: null }
    ));
  }

  function completeStep(id: string) {
    setQueue(prev => prev.map(e => {
      if (e.id !== id || e.status !== "called") return e;
      const vt = SEED_VISIT_TYPES.find(v => v.id === e.visitTypeId) ?? SEED_VISIT_TYPES[0];
      const nextStep = e.step + 1;
      if (nextStep > e.totalSteps) return { ...e, status: "completed" };
      return { ...e, step: nextStep, stepLabel: vt.steps[nextStep - 1], status: "waiting", billingCompleted: false, callCount: 0, callTimestamp: null };
    }));
  }

  // ── Front desk mutations ─────────────────────────────────────────────────────

  function fdCall(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, callCount: e.callCount + 1, callTimestamp: Date.now() }
    ));
  }

  function fdTimerExpire(id: string) {
    setQueue(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (e.callCount >= 3) return { ...e, skipped: true, callTimestamp: null };
      return { ...e, callTimestamp: null };
    }));
  }

  function fdRegisterStart(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, status: "called", callTimestamp: null }
    ));
  }

  function fdRegisterComplete(id: string, patient: Patient) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, patient }
    ));
  }

  function fdBilling(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, status: "called", callTimestamp: null }
    ));
  }

  function fdCompleteBilling(id: string) {
    setQueue(prev => prev.map(e => {
      if (e.id !== id) return e;
      const vt = SEED_VISIT_TYPES.find(v => v.id === e.visitTypeId) ?? SEED_VISIT_TYPES[0];
      const nextStep = e.step + 1;
      if (nextStep > e.totalSteps) return { ...e, billingCompleted: true, status: "completed" };
      return { ...e, billingCompleted: true, step: nextStep, stepLabel: vt.steps[nextStep - 1], status: "waiting", callCount: 0, callTimestamp: null };
    }));
  }

  function fdSkip(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, skipped: true, callTimestamp: null, status: "waiting" }
    ));
  }

  function fdRecall(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, skipped: false, callCount: 0, callTimestamp: null }
    ));
  }

  // ── Nursing mutations ────────────────────────────────────────────────────────

  function nurseCall(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, callCount: e.callCount + 1, callTimestamp: Date.now() }
    ));
  }

  function nurseTimerExpire(id: string) {
    setQueue(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (e.callCount >= 3) return { ...e, skipped: true, callTimestamp: null };
      return { ...e, callTimestamp: null };
    }));
  }

  function nurseAtCounter(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, status: "called", callTimestamp: null }
    ));
  }

  function nurseCompleteVitals(id: string) {
    setQueue(prev => prev.map(e => {
      if (e.id !== id) return e;
      const vt = SEED_VISIT_TYPES.find(v => v.id === e.visitTypeId) ?? SEED_VISIT_TYPES[0];
      const nextStep = e.step + 1;
      if (nextStep > e.totalSteps) return { ...e, status: "completed" };
      return { ...e, step: nextStep, stepLabel: vt.steps[nextStep - 1], status: "waiting", callCount: 0, callTimestamp: null };
    }));
  }

  function nurseSkip(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, skipped: true, callTimestamp: null, status: "waiting" }
    ));
  }

  function nurseRecall(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, skipped: false, callCount: 0, callTimestamp: null }
    ));
  }

  // ── Doctor mutations ─────────────────────────────────────────────────────────

  function docCall(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, callCount: e.callCount + 1, callTimestamp: Date.now() }
    ));
  }

  function docTimerExpire(id: string) {
    setQueue(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (e.callCount >= 3) return { ...e, skipped: true, callTimestamp: null };
      return { ...e, callTimestamp: null };
    }));
  }

  function docAtCounter(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, status: "called", callTimestamp: null }
    ));
  }

  function docCompleteConsultation(id: string) {
    setQueue(prev => prev.map(e => {
      if (e.id !== id) return e;
      const vt = SEED_VISIT_TYPES.find(v => v.id === e.visitTypeId) ?? SEED_VISIT_TYPES[0];
      const nextStep = e.step + 1;
      if (nextStep > e.totalSteps) return { ...e, status: "completed" };
      return { ...e, step: nextStep, stepLabel: vt.steps[nextStep - 1], status: "waiting", callCount: 0, callTimestamp: null };
    }));
  }

  function docSkip(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, skipped: true, callTimestamp: null, status: "waiting" }
    ));
  }

  function docRecall(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, skipped: false, callCount: 0, callTimestamp: null }
    ));
  }

  function addEntry(entry: MultiEntry) {
    setQueue(prev => [...prev, entry]);
  }

  return {
    queue, setQueue,
    nextNums, setNextNums,
    // shared
    callEntry, completeStep,
    // front desk
    fdCall, fdTimerExpire, fdRegisterStart, fdRegisterComplete,
    fdBilling, fdCompleteBilling, fdSkip, fdRecall,
    // nursing
    nurseCall, nurseTimerExpire, nurseAtCounter, nurseCompleteVitals, nurseSkip, nurseRecall,
    // doctor
    docCall, docTimerExpire, docAtCounter, docCompleteConsultation, docSkip, docRecall,
    addEntry,
  };
}
