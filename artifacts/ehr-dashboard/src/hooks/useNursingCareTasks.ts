import { useState, useEffect, useCallback, useRef } from "react";

// ─── Status lifecycle ──────────────────────────────────────────────────────────

export type TaskExecStatus = "pending" | "in-progress" | "done" | "skipped";

// ─── Execution state (nurse-side overlay) ─────────────────────────────────────

export interface TaskExec {
  uid:         string;
  status:      TaskExecStatus;
  nurseNote:   string;
  completedBy: string;
  skipReason:  string;
  startedAt:   number | null;
  completedAt: number | null;
}

export interface GoalNote {
  uid:       string;
  nurseNote: string;
  updatedAt: number;
}

export interface NursingExecState {
  tasks:     TaskExec[];
  goals:     GoalNote[];
  updatedAt: number;
}

// ─── References (mirrors doctor-side types) ───────────────────────────────────

export interface CarePlanTaskRef {
  uid:      string;
  taskId:   string;
  title:    string;
  assignee: string;
  dueDate:  string;
  priority: "Normal" | "Urgent";
  notes:    string;
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

// ─── Seed demo data ───────────────────────────────────────────────────────────

export const SEED_TASKS: CarePlanTaskRef[] = [
  {
    uid: "t1", taskId: "wound-dressing",
    title: "Wound dressing instructions",
    assignee: "Emily Rodriguez", dueDate: "2026-05-10", priority: "Urgent",
    notes: "Change dressing every 24 h. Observe for erythema, exudate, or odour.",
  },
  {
    uid: "t2", taskId: "bp-monitoring",
    title: "Home blood pressure monitoring guidance",
    assignee: "Michael Chen", dueDate: "2026-05-10", priority: "Normal",
    notes: "",
  },
  {
    uid: "t3", taskId: "insulin-teaching",
    title: "Insulin injection teaching",
    assignee: "Emily Rodriguez", dueDate: "2026-05-11", priority: "Normal",
    notes: "Patient is new to insulin — first session today.",
  },
  {
    uid: "t4", taskId: "diet-counseling",
    title: "Dietary counseling session",
    assignee: "Fatima Al-Hassan", dueDate: "2026-05-10", priority: "Normal",
    notes: "Focus on low-glycaemic diet and carbohydrate counting.",
  },
  {
    uid: "t5", taskId: "vitals-check",
    title: "Vital signs monitoring",
    assignee: "Michael Chen", dueDate: "2026-05-08", priority: "Urgent",
    notes: "Monitor every 2 hours — BP was elevated in last session.",
  },
];

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

// ─── Seed exec state (some tasks pre-progressed for demo realism) ─────────────

function makeSeedExec(tasks: CarePlanTaskRef[], goals: PatientGoalRef[]): NursingExecState {
  const now = Date.now();
  return {
    updatedAt: now,
    goals: goals.map(g => ({ uid: g.uid, nurseNote: "", updatedAt: 0 })),
    tasks: tasks.map((t, i) => ({
      uid:         t.uid,
      status:      (i === 4 ? "done" : i === 1 ? "in-progress" : "pending") as TaskExecStatus,
      nurseNote:   i === 4 ? "Patient demonstrated correct BP cuff technique. Repeat session scheduled in 1 week." : "",
      completedBy: i === 4 ? "Michael Chen" : "",
      skipReason:  "",
      startedAt:   (i === 1 || i === 4) ? now - 1_200_000 : null,
      completedAt: i === 4 ? now - 600_000 : null,
    })),
  };
}

// ─── Persistence ─────────────────────────────────────────────────────────────

type ExecStore   = Record<string, NursingExecState>;
type BridgeStore = Record<string, { tasks: CarePlanTaskRef[]; goals: PatientGoalRef[]; updatedAt: number }>;

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
  tasks:          CarePlanTaskRef[];
  goals:          PatientGoalRef[];
  execState:      NursingExecState;
  advanceTask:    (uid: string) => void;
  skipTask:       (uid: string, reason: string) => void;
  resetTask:      (uid: string) => void;
  updateTaskNote: (uid: string, note: string) => void;
  updateGoalNote: (uid: string, note: string) => void;
}

export function useNursingCareTasks(visitKey: string): UseNursingCareTasksReturn {
  const bridgeData = readBridge(visitKey);
  const tasks      = bridgeData?.tasks ?? SEED_TASKS;
  const goals      = bridgeData?.goals ?? SEED_GOALS;

  const [execState, setExecState] = useState<NursingExecState>(() => {
    const store = loadExecStore();
    return store[visitKey] ?? makeSeedExec(tasks, goals);
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

  function patchTask(uid: string, patch: Partial<TaskExec>) {
    persist({
      ...execState,
      updatedAt: Date.now(),
      tasks: execState.tasks.map(t => t.uid === uid ? { ...t, ...patch } : t),
    });
  }

  function advanceTask(uid: string) {
    const task = execState.tasks.find(t => t.uid === uid);
    if (!task) return;
    const now = Date.now();
    if (task.status === "pending")          patchTask(uid, { status: "in-progress", startedAt: now });
    else if (task.status === "in-progress") patchTask(uid, { status: "done", completedAt: now });
  }

  function skipTask(uid: string, reason: string) {
    patchTask(uid, { status: "skipped", skipReason: reason, completedAt: Date.now() });
  }

  function resetTask(uid: string) {
    patchTask(uid, { status: "pending", nurseNote: "", skipReason: "", startedAt: null, completedAt: null, completedBy: "" });
  }

  function updateTaskNote(uid: string, note: string) {
    patchTask(uid, { nurseNote: note });
  }

  function updateGoalNote(uid: string, note: string) {
    persist({
      ...execState,
      updatedAt: Date.now(),
      goals: execState.goals.map(g =>
        g.uid === uid ? { ...g, nurseNote: note, updatedAt: Date.now() } : g,
      ),
    });
  }

  return { tasks, goals, execState, advanceTask, skipTask, resetTask, updateTaskNote, updateGoalNote };
}
