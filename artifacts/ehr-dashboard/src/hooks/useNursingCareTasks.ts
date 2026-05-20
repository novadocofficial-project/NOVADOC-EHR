import { useState, useEffect, useCallback, useRef } from "react";

// ─── Goal-related types ───────────────────────────────────────────────────────

export interface GoalNote {
  uid:       string;
  nurseNote: string;
  updatedAt: number;
}

export interface NursingExecState {
  goals:     GoalNote[];
  updatedAt: number;
}

export interface PatientGoalRef {
  uid:        string;
  title:      string;
  startDate:  string;
  targetDate: string;
  priority:   "Low" | "Normal" | "High";
  actions:    string[];
}

// ─── localStorage / broadcast keys ───────────────────────────────────────────

const EXEC_KEY     = "ehr-nursing-task-exec-v1";
const BRIDGE_KEY   = "ehr-careplan-bridge-v1";
const CHANNEL_NAME = "ehr-nursing-tasks-v1";

// ─── Seed goals ───────────────────────────────────────────────────────────────

export const SEED_GOALS: PatientGoalRef[] = [
  {
    uid: "g1", title: "Control blood sugar levels",
    startDate: "2026-05-01", targetDate: "2026-07-01", priority: "High",
    actions: ["Take medication regularly", "Monitor blood glucose daily", "Follow diabetic diet plan"],
  },
  {
    uid: "g2", title: "Reduce blood pressure",
    startDate: "2026-05-01", targetDate: "2026-06-15", priority: "High",
    actions: ["Take antihypertensive medication", "Reduce salt intake", "Walk 20 minutes daily", "Monitor BP at home"],
  },
  {
    uid: "g3", title: "Improve medication adherence",
    startDate: "2026-05-01", targetDate: "2026-06-01", priority: "Normal",
    actions: ["Set daily medication reminders", "Use pill organiser", "Follow up with pharmacy"],
  },
];

// ─── Seed exec state ──────────────────────────────────────────────────────────

function makeSeedExec(goals: PatientGoalRef[]): NursingExecState {
  return {
    updatedAt: Date.now(),
    goals: goals.map(g => ({ uid: g.uid, nurseNote: "", updatedAt: 0 })),
  };
}

// ─── Persistence ─────────────────────────────────────────────────────────────

type ExecStore   = Record<string, NursingExecState>;
type BridgeStore = Record<string, { goals: PatientGoalRef[]; updatedAt: number }>;

function loadExecStore(): ExecStore {
  try { return JSON.parse(localStorage.getItem(EXEC_KEY) ?? "{}") as ExecStore; } catch { return {}; }
}
function saveExecStore(store: ExecStore) {
  try { localStorage.setItem(EXEC_KEY, JSON.stringify(store)); } catch { /**/ }
}
function readBridge(visitKey: string) {
  try {
    const store = JSON.parse(localStorage.getItem(BRIDGE_KEY) ?? "{}") as BridgeStore;
    return store[visitKey] ?? null;
  } catch { return null; }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseNursingCareTasksReturn {
  goals:          PatientGoalRef[];
  execState:      NursingExecState;
  updateGoalNote: (uid: string, note: string) => void;
}

export function useNursingCareTasks(visitKey: string): UseNursingCareTasksReturn {
  const bridgeData = readBridge(visitKey);
  const goals      = bridgeData?.goals ?? SEED_GOALS;

  const [execState, setExecState] = useState<NursingExecState>(() => {
    const store = loadExecStore();
    return store[visitKey] ?? makeSeedExec(goals);
  });

  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try { channelRef.current = new BroadcastChannel(CHANNEL_NAME); } catch { /**/ }
    const ch = channelRef.current;
    if (!ch) return;
    ch.onmessage = (e: MessageEvent) => {
      const msg = e.data as { visitKey: string; state: NursingExecState };
      if (msg.visitKey === visitKey) setExecState(msg.state);
    };
    return () => { ch.close(); };
  }, [visitKey]);

  const persist = useCallback((next: NursingExecState) => {
    const store = loadExecStore();
    store[visitKey] = next;
    saveExecStore(store);
    try { channelRef.current?.postMessage({ visitKey, state: next }); } catch { /**/ }
    setExecState(next);
  }, [visitKey]);

  function updateGoalNote(uid: string, note: string) {
    persist({
      ...execState,
      updatedAt: Date.now(),
      goals: execState.goals.map(g =>
        g.uid === uid ? { ...g, nurseNote: note, updatedAt: Date.now() } : g,
      ),
    });
  }

  return { goals, execState, updateGoalNote };
}
