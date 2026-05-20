import { useState } from "react";
import {
  ChevronDown, ChevronRight, Target, Calendar, FileText, ListChecks,
} from "lucide-react";
import type { PatientGoalRef, GoalNote } from "@/hooks/useNursingCareTasks";

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

// ─── Priority badge ───────────────────────────────────────────────────────────

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
        <div className="px-4 pb-4 pt-3 space-y-3 border-t border-slate-100">
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
