import { useState } from "react";
import {
  CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronRight,
  RotateCcw, SkipForward, Target, ClipboardList, User,
  Calendar, FileText, Play, ListChecks,
} from "lucide-react";
import type { CarePlanTaskRef, PatientGoalRef, TaskExec, GoalNote, TaskExecStatus } from "@/hooks/useNursingCareTasks";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTs(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ─── Status chip styles ───────────────────────────────────────────────────────

const STATUS_META: Record<TaskExecStatus, { label: string; chip: string; dot: string }> = {
  "pending":     { label: "Pending",     chip: "bg-slate-100 text-slate-500 border-slate-200",            dot: "bg-slate-300"  },
  "in-progress": { label: "In Progress", chip: "bg-amber-50 text-amber-700 border-amber-200",             dot: "bg-amber-400"  },
  "done":        { label: "Done",        chip: "bg-emerald-50 text-emerald-700 border-emerald-200",        dot: "bg-emerald-500"},
  "skipped":     { label: "Skipped",     chip: "bg-rose-50 text-rose-600 border-rose-200",                dot: "bg-rose-400"   },
};

const NEXT_ACTION: Partial<Record<TaskExecStatus, string>> = {
  "pending":     "Start",
  "in-progress": "Mark Done",
};

// ─── Priority badge ───────────────────────────────────────────────────────────

function PriBadge({ p }: { p: "Normal" | "Urgent" }) {
  return (
    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border flex-shrink-0 ${
      p === "Urgent" ? "bg-red-50 text-red-600 border-red-200" : "bg-slate-100 text-slate-500 border-slate-200"
    }`}>{p}</span>
  );
}

function GoalPriBadge({ p }: { p: "Low" | "Normal" | "High" }) {
  const cls = p === "High"
    ? "bg-red-50 text-red-600 border-red-200"
    : p === "Normal"
    ? "bg-blue-50 text-blue-600 border-blue-200"
    : "bg-green-50 text-green-600 border-green-200";
  return (
    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border flex-shrink-0 ${cls}`}>{p}</span>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task, exec,
  onAdvance, onSkip, onReset, onNoteChange,
}: {
  task:         CarePlanTaskRef;
  exec:         TaskExec;
  onAdvance:    () => void;
  onSkip:       (reason: string) => void;
  onReset:      () => void;
  onNoteChange: (note: string) => void;
}) {
  const [expanded,   setExpanded]   = useState(false);
  const [skipMode,   setSkipMode]   = useState(false);
  const [skipReason, setSkipReason] = useState("");

  const meta    = STATUS_META[exec.status];
  const isDone  = exec.status === "done" || exec.status === "skipped";
  const nextAct = NEXT_ACTION[exec.status];

  function handleSkipConfirm() {
    onSkip(skipReason.trim() || "No reason given");
    setSkipMode(false);
    setSkipReason("");
  }

  return (
    <div className={`rounded-xl border bg-white transition-all ${
      exec.status === "done"    ? "border-emerald-200 opacity-80" :
      exec.status === "skipped" ? "border-rose-200 opacity-70"   :
      exec.status === "in-progress" ? "border-amber-300 shadow-sm ring-1 ring-amber-200/50" :
      task.priority === "Urgent" ? "border-red-200 shadow-sm"    : "border-slate-200"
    }`}>

      {/* ── Card header ── */}
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Status dot */}
        <span className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <p className={`text-[12px] font-black text-slate-800 leading-tight ${isDone ? "line-through text-slate-400" : ""}`}>
              {task.title}
            </p>
            <PriBadge p={task.priority} />
          </div>
          <div className="flex items-center gap-3 flex-wrap text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />{task.assignee}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />{fmtDate(task.dueDate)}
            </span>
            <span className={`flex items-center gap-1 font-bold border rounded-full px-1.5 py-0.5 ${meta.chip}`}>
              {meta.label}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
          {nextAct && !skipMode && (
            <button
              onClick={onAdvance}
              className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg border transition-all ${
                exec.status === "pending"
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              }`}>
              {exec.status === "pending"
                ? <><Play className="h-3 w-3" /> Start</>
                : <><CheckCircle2 className="h-3 w-3" /> Mark Done</>
              }
            </button>
          )}
          {exec.status === "pending" && !skipMode && (
            <button
              onClick={() => setSkipMode(true)}
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500 transition-all">
              <SkipForward className="h-3 w-3" />
            </button>
          )}
          {isDone && (
            <button onClick={onReset} title="Reset to pending"
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-slate-200 text-slate-300 hover:text-slate-500 hover:border-slate-300 transition-all">
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
          <button onClick={() => setExpanded(v => !v)}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Skip reason input ── */}
      {skipMode && (
        <div className="px-4 pb-3 pt-0">
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
            <input
              value={skipReason}
              onChange={e => setSkipReason(e.target.value)}
              placeholder="Reason for skipping (optional)…"
              className="flex-1 text-xs text-slate-700 bg-transparent outline-none placeholder:text-rose-300"
              autoFocus
            />
            <button onClick={handleSkipConfirm}
              className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-rose-500 text-white hover:bg-rose-400 transition-colors flex-shrink-0">
              Confirm Skip
            </button>
            <button onClick={() => setSkipMode(false)}
              className="text-[10px] font-bold px-2 py-1 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-100 transition-colors flex-shrink-0">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-slate-100 mt-0 pt-3">
          {task.notes && (
            <div className="flex items-start gap-2">
              <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 italic leading-relaxed">{task.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-4 text-[10px] text-slate-400">
            {exec.startedAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Started: {fmtTs(exec.startedAt)}
              </span>
            )}
            {exec.completedAt && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Completed: {fmtTs(exec.completedAt)}
              </span>
            )}
            {exec.completedBy && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> By: {exec.completedBy}
              </span>
            )}
            {exec.status === "skipped" && exec.skipReason && (
              <span className="text-rose-400 italic">Skipped: {exec.skipReason}</span>
            )}
          </div>

          {/* Nurse notes */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Nurse Notes
            </label>
            <textarea
              value={exec.nurseNote}
              onChange={e => onNoteChange(e.target.value)}
              rows={2}
              placeholder="Add observations, instructions given, patient response…"
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 resize-none transition-all placeholder:text-slate-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal, note, onNoteChange,
}: {
  goal:         PatientGoalRef;
  note:         GoalNote;
  onNoteChange: (n: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-start gap-3 px-4 py-3">
        <Target className="h-4 w-4 text-pink-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <p className="text-[12px] font-black text-slate-800">{goal.title}</p>
            <GoalPriBadge p={goal.priority} />
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Target: {fmtDate(goal.targetDate)}
            </span>
            {goal.actions.length > 0 && (
              <span className="flex items-center gap-1">
                <ListChecks className="h-3 w-3" /> {goal.actions.length} action{goal.actions.length !== 1 ? "s" : ""}
              </span>
            )}
            {note.nurseNote && (
              <span className="text-[#4982CF] font-bold flex items-center gap-1">
                <FileText className="h-3 w-3" /> Note added
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setExpanded(v => !v)}
          className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors flex-shrink-0">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-slate-100 pt-3">
          {goal.actions.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Recommended Actions</p>
              <ul className="space-y-1">
                {goal.actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600">
                    <span className="h-4 w-4 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[8px] font-black flex-shrink-0 mt-px">{i + 1}</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Nurse Progress Note
            </label>
            <textarea
              value={note.nurseNote}
              onChange={e => onNoteChange(e.target.value)}
              rows={2}
              placeholder="Add progress observations for this goal…"
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 resize-none transition-all placeholder:text-slate-300"
            />
            {note.updatedAt > 0 && (
              <p className="text-[9px] text-slate-400 mt-1">Last updated {fmtTs(note.updatedAt)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Summary bar ──────────────────────────────────────────────────────────────

function SummaryBar({ tasks, execs }: { tasks: CarePlanTaskRef[]; execs: TaskExec[] }) {
  const total     = tasks.length;
  const done      = execs.filter(e => e.status === "done").length;
  const inProg    = execs.filter(e => e.status === "in-progress").length;
  const skipped   = execs.filter(e => e.status === "skipped").length;
  const urgent    = tasks.filter((t, i) => t.priority === "Urgent" && execs[i]?.status === "pending").length;
  const pct       = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-wrap">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black text-slate-500">{done} of {total} tasks complete</span>
          {urgent > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
              <AlertCircle className="h-2.5 w-2.5" /> {urgent} urgent pending
            </span>
          )}
          {inProg > 0 && (
            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
              {inProg} in progress
            </span>
          )}
          {skipped > 0 && (
            <span className="text-[9px] font-bold text-slate-400">{skipped} skipped</span>
          )}
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "#4982CF" }}
          />
        </div>
      </div>
      <span className="text-sm font-black text-slate-600 flex-shrink-0">{pct}%</span>
    </div>
  );
}

// ─── Care Tasks Tab ───────────────────────────────────────────────────────────

interface CareTasksTabProps {
  tasks:          CarePlanTaskRef[];
  execs:          TaskExec[];
  onAdvance:      (uid: string) => void;
  onSkip:         (uid: string, reason: string) => void;
  onReset:        (uid: string) => void;
  onNoteChange:   (uid: string, note: string) => void;
}

export function CareTasksTab({ tasks, execs, onAdvance, onSkip, onReset, onNoteChange }: CareTasksTabProps) {
  const getExec = (uid: string): TaskExec => execs.find(e => e.uid === uid) ?? {
    uid, status: "pending", nurseNote: "", completedBy: "", skipReason: "", startedAt: null, completedAt: null,
  };

  const sorted = [...tasks].sort((a, b) => {
    const order: Record<TaskExecStatus, number> = { "in-progress": 0, "pending": 1, "done": 2, "skipped": 3 };
    const ae = getExec(a.uid), be = getExec(b.uid);
    if (ae.status === be.status) {
      if (a.priority === "Urgent" && b.priority !== "Urgent") return -1;
      if (b.priority === "Urgent" && a.priority !== "Urgent") return 1;
    }
    return order[ae.status] - order[be.status];
  });

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-10">
        <div>
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="h-7 w-7 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">No care tasks assigned</p>
          <p className="text-xs text-slate-400 mt-1">Tasks assigned by the doctor will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SummaryBar tasks={tasks} execs={execs} />
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {sorted.map(task => (
          <TaskCard
            key={task.uid}
            task={task}
            exec={getExec(task.uid)}
            onAdvance={() => onAdvance(task.uid)}
            onSkip={reason => onSkip(task.uid, reason)}
            onReset={() => onReset(task.uid)}
            onNoteChange={note => onNoteChange(task.uid, note)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Patient Goals Tab ────────────────────────────────────────────────────────

interface PatientGoalsTabProps {
  goals:        PatientGoalRef[];
  goalNotes:    GoalNote[];
  onNoteChange: (uid: string, note: string) => void;
}

export function PatientGoalsTab({ goals, goalNotes, onNoteChange }: PatientGoalsTabProps) {
  const getNote = (uid: string): GoalNote =>
    goalNotes.find(n => n.uid === uid) ?? { uid, nurseNote: "", updatedAt: 0 };

  if (goals.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-10">
        <div>
          <div className="h-14 w-14 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
            <Target className="h-7 w-7 text-pink-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">No patient goals set</p>
          <p className="text-xs text-slate-400 mt-1">Goals set by the doctor will appear here.</p>
        </div>
      </div>
    );
  }

  const withNotes = goals.filter(g => getNote(g.uid).nurseNote).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <span className="text-[10px] font-black text-slate-500">{goals.length} patient goal{goals.length !== 1 ? "s" : ""}</span>
        {withNotes > 0 && (
          <span className="text-[9px] font-bold text-[#4982CF] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
            {withNotes} note{withNotes !== 1 ? "s" : ""} added
          </span>
        )}
        <span className="ml-auto text-[9px] text-slate-400 italic">Read-only — set by doctor</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {goals.map(goal => (
          <GoalCard
            key={goal.uid}
            goal={goal}
            note={getNote(goal.uid)}
            onNoteChange={note => onNoteChange(goal.uid, note)}
          />
        ))}
      </div>
    </div>
  );
}
