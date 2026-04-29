import { useState, useEffect, useCallback } from "react";
import { QueueEntry, Patient, SEED_VISIT_TYPES } from "@/pages/QueuePageLayout";
import { clearActiveLabOrder, clearPendingLabOrders } from "@/hooks/useSoapNoteDraft";

// ─── Extended Entry Type ───────────────────────────────────────────────────────

export type MultiEntry = QueueEntry & {
  patient: Patient | null;
  visitTypeId: string;
  callCount: number;
  skipped: boolean;
  billingCompleted: boolean;
  callTimestamp: number | null;
  pendingLab: boolean;
  pendingPharmacy: boolean; // true only when hasUnsentLabOrders path needs pharmacy after lab (hasPrescription=true)
  labResultsReady: boolean;
  labReturnedAt?: number; // epoch ms — set when lab marks patient done and returns them to the doctor
  labRoundCount: number; // incremented each time docSendToLab() is called; 0 = never sent to lab, 1 = first dispatch, 2+ = returning visit
};

export const INITIAL_QUEUE: MultiEntry[] = [];

// ─── Sync Utilities ────────────────────────────────────────────────────────────

const CHANNEL_NAME = "ehr-multistep-queue-v2";
const LS_QUEUE_KEY = "ehr-queue-v2";
const LS_NUMS_KEY  = "ehr-queue-nums-v2";
const LS_VER_KEY   = "ehr-queue-ver";
const QUEUE_VER    = "11"; // bump when seed schema changes

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
    return (JSON.parse(raw) as any[]).map(e => ({ labRoundCount: 0, pendingPharmacy: false, ...e, createdAt: new Date(e.createdAt) }));
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

  function docCompleteConsultation(id: string, opts?: { hasPrescription?: boolean; hasUnsentLabOrders?: boolean }) {
    const { hasPrescription = false, hasUnsentLabOrders = false } = opts ?? {};
    setQueue(prev => prev.map(e => {
      if (e.id !== id) return e;
      const vt = SEED_VISIT_TYPES.find(v => v.id === e.visitTypeId) ?? SEED_VISIT_TYPES[0];

      // Priority 1: unsent lab orders → route to lab and continue forward.
      // pendingLab=false so labComplete() advances to the next step instead of
      // returning to the doctor. Only the explicit "Send to Lab" button sets
      // pendingLab=true (doctor wants results back).
      // pendingPharmacy carries hasPrescription so labComplete() knows whether
      // to land in pharmacy or skip straight to completed.
      if (hasUnsentLabOrders) {
        const labStepIdx = vt.steps.findIndex(s => s.toLowerCase().includes("lab"));
        const labStep = labStepIdx >= 0 ? labStepIdx + 1 : e.step + 1;
        return {
          ...e,
          step: labStep,
          stepLabel: vt.steps[labStep - 1] ?? "Lab / Sample",
          status: "waiting",
          callCount: 0,
          callTimestamp: null,
          pendingLab: false,
          pendingPharmacy: hasPrescription, // only land in pharmacy if a prescription exists
          labResultsReady: false,
        };
      }

      // Priority 2: prescriptions exist → route to pharmacy
      if (hasPrescription) {
        const pharmStepIdx = vt.steps.findIndex(s => s.toLowerCase().includes("pharm"));
        const pharmStep = pharmStepIdx >= 0 ? pharmStepIdx + 1 : e.step + (e.labResultsReady ? 2 : 1);
        if (pharmStep > e.totalSteps) return { ...e, status: "completed", labResultsReady: false };
        return { ...e, step: pharmStep, stepLabel: vt.steps[pharmStep - 1], status: "waiting", callCount: 0, callTimestamp: null, labResultsReady: false };
      }

      // Priority 3: neither → mark complete
      return { ...e, status: "completed", labResultsReady: false };
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
    clearActiveLabOrder(id);
    clearPendingLabOrders(id); // also clear unsent-orders stored for the lab panel
    setQueue(prev => prev.map(e => {
      if (e.id !== id) return e;
      const vt = SEED_VISIT_TYPES.find(v => v.id === e.visitTypeId) ?? SEED_VISIT_TYPES[0];
      // Only return to doctor if the doctor explicitly dispatched this patient to the lab (pendingLab=true).
      // Step-number-based routing is intentionally avoided — the flag is the source of truth.
      if (e.pendingLab) {
        const docStepIdx = vt.steps.findIndex(s => s.toLowerCase().includes("doctor"));
        const docStep = docStepIdx >= 0 ? docStepIdx + 1 : Math.max(1, e.step - 1);
        return {
          ...e,
          step: docStep,
          stepLabel: vt.steps[docStep - 1] ?? "Doctor Consultation",
          status: "waiting",
          callCount: 0,
          callTimestamp: null,
          pendingLab: false,
          labResultsReady: true,
          labReturnedAt: Date.now(), // for FIFO ordering among concurrent lab-return patients
        };
      }
      // Not dispatched by doctor (pendingLab=false) — advance through the workflow.
      // If the next step is pharmacy and pendingPharmacy=false (no prescription),
      // skip pharmacy entirely. This prevents patients without a prescription from
      // landing in the pharmacy queue just because they had unsent lab orders.
      let nextStep = e.step + 1;
      if (
        nextStep <= e.totalSteps &&
        vt.steps[nextStep - 1]?.toLowerCase().includes("pharm") &&
        !e.pendingPharmacy
      ) {
        nextStep++; // skip pharmacy — no prescription required
      }
      if (nextStep > e.totalSteps) return { ...e, status: "completed", pendingPharmacy: false };
      return { ...e, step: nextStep, stepLabel: vt.steps[nextStep - 1], status: "waiting", callCount: 0, callTimestamp: null, pendingPharmacy: false };
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
      const nextRound = (e.labRoundCount ?? 0) + 1;
      if (labStepIdx >= 0) {
        return {
          ...e,
          step: labStepIdx + 1,
          stepLabel: vt.steps[labStepIdx],
          status: "waiting",
          callCount: 0,
          callTimestamp: null,
          pendingLab: true,
          labResultsReady: false, // clear previous results flag when dispatching to lab again
          labRoundCount: nextRound,
        };
      }
      return { ...e, pendingLab: true, status: "waiting", callTimestamp: null, labResultsReady: false, labRoundCount: nextRound };
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
