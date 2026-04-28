import { useState, useEffect, useCallback } from "react";
import { QueueEntry, Patient, SEED_VISIT_TYPES } from "@/pages/QueuePageLayout";

// ─── Extended Entry Type ───────────────────────────────────────────────────────

export type MultiEntry = QueueEntry & {
  patient: Patient | null;
  visitTypeId: string;
  callCount: number;
  skipped: boolean;
  billingCompleted: boolean;
  callTimestamp: number | null;
  pendingLab: boolean;
  labResultsReady: boolean;
};

export const INITIAL_QUEUE: MultiEntry[] = [];

// ─── Sync Utilities ────────────────────────────────────────────────────────────

const CHANNEL_NAME = "ehr-multistep-queue-v2";
const LS_QUEUE_KEY = "ehr-queue-v2";
const LS_NUMS_KEY  = "ehr-queue-nums-v2";
const LS_VER_KEY   = "ehr-queue-ver";
const QUEUE_VER    = "9"; // bump when seed schema changes

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
    return raw ? JSON.parse(raw) : { "vt-1": 100, "vt-2": 0, "vt-3": 0 };
  } catch { return { "vt-1": 100, "vt-2": 0, "vt-3": 0 }; }
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
      // If lab results are already ready, skip the lab step and go straight to pharmacy
      if (e.labResultsReady) {
        const pharmStep = e.step + 2; // skip lab (step 4) → go to step 5
        if (pharmStep > e.totalSteps) return { ...e, status: "completed", labResultsReady: false };
        return { ...e, step: pharmStep, stepLabel: vt.steps[pharmStep - 1], status: "waiting", callCount: 0, callTimestamp: null, labResultsReady: false };
      }
      const nextStep = e.step + 1;
      if (nextStep > e.totalSteps) return { ...e, status: "completed" };
      return { ...e, step: nextStep, stepLabel: vt.steps[nextStep - 1], status: "waiting", callCount: 0, callTimestamp: null };
    }));
  }

  function docMarkComplete(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, status: "completed", callTimestamp: null }
    ));
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

  // ── Lab mutations ────────────────────────────────────────────────────────────

  function labCall(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, callCount: e.callCount + 1, callTimestamp: Date.now() }
    ));
  }

  function labTimerExpire(id: string) {
    setQueue(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (e.callCount >= 3) return { ...e, skipped: true, callTimestamp: null };
      return { ...e, callTimestamp: null };
    }));
  }

  function labAtCounter(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, status: "called", callTimestamp: null }
    ));
  }

  function labComplete(id: string) {
    setQueue(prev => prev.map(e => {
      if (e.id !== id) return e;
      const vt = SEED_VISIT_TYPES.find(v => v.id === e.visitTypeId) ?? SEED_VISIT_TYPES[0];
      // If patient came through Doctor Consultation (step 3 in visit type), return them there with a "lab ready" flag
      const cameFromDoctor = e.step === 4 && vt.steps[2]?.toLowerCase().includes("doctor");
      if (cameFromDoctor) {
        return {
          ...e,
          step: 3,
          stepLabel: vt.steps[2],
          status: "waiting",
          callCount: 0,
          callTimestamp: null,
          pendingLab: false,
          labResultsReady: true,
        };
      }
      const nextStep = e.step + 1;
      if (nextStep > e.totalSteps) return { ...e, status: "completed" };
      return { ...e, step: nextStep, stepLabel: vt.steps[nextStep - 1], status: "waiting", callCount: 0, callTimestamp: null };
    }));
  }

  function labSkip(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, skipped: true, callTimestamp: null, status: "waiting" }
    ));
  }

  function labRecall(id: string) {
    setQueue(prev => prev.map(e =>
      e.id !== id ? e : { ...e, skipped: false, callCount: 0, callTimestamp: null }
    ));
  }

  function docSendToLab(id: string) {
    setQueue(prev => prev.map(e => {
      if (e.id !== id) return e;
      const vt = SEED_VISIT_TYPES.find(v => v.id === e.visitTypeId) ?? SEED_VISIT_TYPES[0];
      const labStepIdx = vt.steps.findIndex(s => s.toLowerCase().includes("lab"));
      if (labStepIdx >= 0) {
        return {
          ...e,
          step: labStepIdx + 1,
          stepLabel: vt.steps[labStepIdx],
          status: "waiting",
          callCount: 0,
          callTimestamp: null,
          pendingLab: true,
        };
      }
      return { ...e, pendingLab: true, status: "waiting", callTimestamp: null };
    }));
  }

  function docCancelLab(id: string) {
    setQueue(prev => prev.map(e => {
      if (e.id !== id) return e;
      const vt = SEED_VISIT_TYPES.find(v => v.id === e.visitTypeId) ?? SEED_VISIT_TYPES[0];
      const docStepIdx = vt.steps.findIndex(s => s.toLowerCase().includes("doctor"));
      if (docStepIdx >= 0 && e.pendingLab) {
        return {
          ...e,
          step: docStepIdx + 1,
          stepLabel: vt.steps[docStepIdx],
          status: "called",
          callCount: 0,
          callTimestamp: null,
          pendingLab: false,
        };
      }
      return { ...e, pendingLab: false, status: "called" };
    }));
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
    docCall, docTimerExpire, docAtCounter, docCompleteConsultation, docMarkComplete, docSkip, docRecall, docSendToLab, docCancelLab,
    // lab
    labCall, labTimerExpire, labAtCounter, labComplete, labSkip, labRecall,
    addEntry,
  };
}
