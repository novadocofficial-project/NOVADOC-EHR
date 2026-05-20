import { useState, useEffect, useRef } from "react";
import {
  AlertCircle, ChevronRight, RotateCcw, CheckCircle2, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useTriageConfig,
  type TriageAlgorithm, type TriageStep, type TriageOutcome, type TriageOutcomeType,
} from "@/hooks/useTriageConfig";
import type { Patient } from "@/pages/QueuePageLayout";

// ─── Session persistence ──────────────────────────────────────────────────────

export const SESSIONS_KEY = "ehr-triage-sessions";

export interface TriageSession {
  id: string;
  algoId: string;
  algoName: string;
  patientRef: string | null;
  patientName: string | null;
  startedAt: number;
  finishedAt: number;
  outcomeType: TriageOutcomeType;
  outcomeLabel: string;
  adviceItems: string[];
  routedBy: string | null;
  severityBandLabel?: string;
  severityBandColor?: string;
  stepAnswers: { stepId: string; stepTitle: string; summary: string }[];
}

function saveSession(session: TriageSession): void {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    const existing: TriageSession[] = raw ? (JSON.parse(raw) as TriageSession[]) : [];
    existing.push(session);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(existing));
  } catch { /* ignore */ }
}

export function loadSessions(): TriageSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (raw) return JSON.parse(raw) as TriageSession[];
  } catch { /* ignore */ }
  return [];
}

function genId() { return `ts-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

function calcAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ─── Outcome UI config ────────────────────────────────────────────────────────

export const OUTCOME_CFG: Record<TriageOutcomeType, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  ambulance:        { label: "Emergency — Call Ambulance",   color: "text-red-700",    bg: "bg-red-50",    border: "border-red-300",    emoji: "🚑" },
  teleconsultation: { label: "Teleconsultation Recommended", color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-300",   emoji: "📞" },
  "doctor-visit":   { label: "Visit a Nearby Doctor",        color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-300",  emoji: "🏥" },
  advice:           { label: "Clinical Advice",              color: "text-green-700",  bg: "bg-green-50",  border: "border-green-300",   emoji: "📋" },
};

// ─── Step answer model ────────────────────────────────────────────────────────

export interface StepAnswer {
  text?: string;
  selected?: Record<string, boolean>;
  value?: number;
}

function summarizeAnswer(step: TriageStep, ans: StepAnswer | undefined): string {
  if (!ans) return "—";
  if (step.type === "patient-details") return "Reviewed";
  if (step.type === "presenting-complaint") return ans.text || "(no notes)";
  if (step.type === "question-group" || step.type === "flag-checklist") {
    const sel = ans.selected ?? {};
    const yes = step.items.filter(it => sel[it.id] === true).map(it => it.label);
    return yes.length > 0 ? `Yes: ${yes.join(", ")}` : "All No";
  }
  if (step.type === "severity-scale") return `Score: ${ans.value ?? "—"}`;
  if (step.type === "character-checklist") {
    const sel = ans.selected ?? {};
    const picked = step.items.filter(it => sel[it.id]).map(it => it.label);
    return picked.length > 0 ? picked.join(", ") : "None selected";
  }
  return "—";
}

// ─── Header with progress bar ────────────────────────────────────────────────

function RunnerHeader({ algo, stepIndex, totalSteps, progress, onRestart }: {
  algo: TriageAlgorithm; stepIndex: number; totalSteps: number; progress: number; onRestart: () => void;
}) {
  return (
    <div className="flex-shrink-0">
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
        <span className="text-sm font-bold text-slate-700 flex-1 truncate min-w-0">{algo.name}</span>
        <button
          onClick={onRestart}
          className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
        >
          <RotateCcw className="h-3 w-3" /> Restart
        </button>
      </div>
      <div className="px-5 py-2.5 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-slate-500">
            {progress >= 100 ? "Complete" : `Step ${stepIndex + 1} of ${totalSteps}`}
          </span>
          <span className="text-[10px] font-bold text-[#4982CF]">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#4982CF] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step renderers ───────────────────────────────────────────────────────────

function PatientDetailsStep({ patient }: { patient: Patient | null }) {
  const age = patient?.dob ? calcAge(patient.dob) : null;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start gap-4 mb-4">
        <div className="h-14 w-14 rounded-2xl bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
          <User className="h-7 w-7 text-[#4982CF]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-slate-900 leading-tight">
            {patient?.name ?? "Walk-in Patient"}
          </p>
          {patient && <p className="text-sm text-[#4982CF] font-semibold mt-0.5">{patient.mrn}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          ["Age", age !== null ? `${age} yrs` : "—"],
          ["Gender", patient?.gender === "M" ? "Male" : patient?.gender === "F" ? "Female" : "—"],
          ["Phone", patient?.phone ?? "—"],
          ["Date of Birth", patient?.dob ?? "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-white border border-slate-200 px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <p className="text-sm font-semibold text-slate-800">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PresentingComplaintStep({
  complaintLabel, value, onChange,
}: { complaintLabel: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3.5 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-blue-500 mb-0.5">Chief Complaint</p>
          <p className="text-sm font-bold text-blue-900">{complaintLabel}</p>
        </div>
      </div>
      <div>
        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
          Additional Notes (optional)
        </label>
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Onset, duration, character, associated symptoms…"
          className="min-h-[100px] text-sm resize-none"
        />
      </div>
    </div>
  );
}

function QuestionGroupStep({
  step, answers, onChange,
}: { step: TriageStep; answers: Record<string, boolean>; onChange: (v: Record<string, boolean>) => void }) {
  return (
    <div className="space-y-2.5">
      {step.items.map(item => {
        const val = answers[item.id];
        return (
          <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-sm text-slate-700 flex-1 leading-snug">{item.label}</p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => onChange({ ...answers, [item.id]: true })}
                className={`h-8 w-14 rounded-lg text-xs font-bold border transition-all ${
                  val === true
                    ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-600"
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => onChange({ ...answers, [item.id]: false })}
                className={`h-8 w-14 rounded-lg text-xs font-bold border transition-all ${
                  val === false
                    ? "bg-slate-700 border-slate-700 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700"
                }`}
              >
                No
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FlagChecklistStep({
  step, answers, onChange,
}: { step: TriageStep; answers: Record<string, boolean>; onChange: (v: Record<string, boolean>) => void }) {
  return (
    <div className="space-y-2">
      {step.items.map(item => {
        const checked = answers[item.id] ?? false;
        return (
          <label
            key={item.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 cursor-pointer transition-all shadow-sm ${
              checked ? "bg-rose-50 border-rose-300" : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={e => onChange({ ...answers, [item.id]: e.target.checked })}
              className="h-4 w-4 rounded flex-shrink-0 accent-rose-500"
            />
            <span className={`text-sm leading-snug ${checked ? "text-rose-800 font-semibold" : "text-slate-700"}`}>
              {item.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function SeverityScaleStep({
  step, value, onChange,
}: { step: TriageStep; value: number; onChange: (v: number) => void }) {
  const band = step.bands.find(b => value >= b.from && value <= b.to);
  return (
    <div className="space-y-6">
      <div className="text-center py-2">
        <div
          className="inline-flex items-center justify-center h-24 w-24 rounded-full border-4 mx-auto transition-all"
          style={{ borderColor: band?.color ?? "#94a3b8", background: `${band?.color ?? "#94a3b8"}1a` }}
        >
          <span className="text-4xl font-black" style={{ color: band?.color ?? "#94a3b8" }}>{value}</span>
        </div>
        {band && (
          <div className="mt-3">
            <span
              className="text-sm font-bold px-4 py-1.5 rounded-full"
              style={{ background: `${band.color}22`, color: band.color }}
            >
              {band.label}
            </span>
          </div>
        )}
      </div>
      <div className="px-2">
        <input
          type="range"
          min={1}
          max={step.scaleMax}
          value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: band?.color ?? "#4982CF" }}
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-slate-400 font-semibold">1 — Least</span>
          <span className="text-[10px] text-slate-400 font-semibold">{step.scaleMax} — Highest</span>
        </div>
      </div>
      {step.bands.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {step.bands.map(b => (
            <div
              key={b.id}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1"
              style={{ borderColor: `${b.color}55`, background: `${b.color}11` }}
            >
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
              <span className="text-[10px] font-semibold" style={{ color: b.color }}>
                {b.from}–{b.to}: {b.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CharacterCheckStep({
  step, selected, onChange,
}: { step: TriageStep; selected: Record<string, boolean>; onChange: (v: Record<string, boolean>) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {step.items.map(item => {
        const on = selected[item.id] ?? false;
        return (
          <button
            key={item.id}
            onClick={() => onChange({ ...selected, [item.id]: !on })}
            className={`px-4 py-2.5 rounded-full border text-sm font-semibold transition-all ${
              on
                ? "bg-teal-500 border-teal-500 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function OutcomeDisplay({
  outcome, routedBy, severityBand, onFinish,
}: { outcome: TriageOutcome; routedBy: string | null; severityBand?: { label: string; color: string }; onFinish: () => void }) {
  const cfg = OUTCOME_CFG[outcome.type];
  return (
    <div className="space-y-4">
      {routedBy && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 flex items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
          <p className="text-xs font-semibold text-amber-800">Routed by: <span className="italic">{routedBy}</span></p>
        </div>
      )}
      {severityBand && (
        <div
          className="flex items-center justify-center gap-2.5 rounded-xl border px-4 py-2.5"
          style={{ borderColor: `${severityBand.color}55`, background: `${severityBand.color}11` }}
        >
          <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: severityBand.color }} />
          <span className="text-sm font-bold" style={{ color: severityBand.color }}>
            Severity: {severityBand.label}
          </span>
        </div>
      )}
      <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-6 text-center`}>
        <div className="text-5xl mb-3">{cfg.emoji}</div>
        <p className={`text-xl font-black ${cfg.color}`}>{cfg.label}</p>
      </div>
      {outcome.adviceItems.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Clinical Advice</p>
          <ul className="space-y-2">
            {outcome.adviceItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-snug">
                <span className="text-[#4982CF] mt-0.5 flex-shrink-0 font-bold">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Button
        onClick={onFinish}
        className="w-full h-12 bg-[#4982CF] hover:bg-[#3a6fb8] text-white font-bold text-sm gap-2"
      >
        <CheckCircle2 className="h-5 w-5" /> Finish Triage
      </Button>
    </div>
  );
}

// ─── Routing logic ────────────────────────────────────────────────────────────

function evalRouting(step: TriageStep, ans: StepAnswer | undefined): TriageOutcome | null {
  if (step.type === "question-group" || step.type === "flag-checklist") {
    const sel = ans?.selected ?? {};
    if (step.ifAnyYes && Object.values(sel).some(v => v === true)) return step.ifAnyYes;
    // Treat undefined (untouched) items as "No" so an all-unchecked checklist triggers ifAllNo
    if (step.ifAllNo && step.items.length > 0 && step.items.every(it => sel[it.id] !== true)) return step.ifAllNo;
  }
  if (step.type === "severity-scale") {
    const val = ans?.value ?? 1;
    const band = step.bands.find(b => val >= b.from && val <= b.to);
    if (step.ifAnyYes && band) return step.ifAnyYes;
  }
  return null;
}

// ─── Main runner component ────────────────────────────────────────────────────

export function TriageRunner({
  patient, onFinishTriage,
  initialAlgoId, initialStepIndex, initialAnswers,
  onDraftChange, onAlgoSelected,
}: {
  patient: Patient | null;
  onFinishTriage?: () => void;
  initialAlgoId?: string;
  initialStepIndex?: number;
  initialAnswers?: Record<string, StepAnswer>;
  onDraftChange?: (algoId: string, stepIndex: number, answers: Record<string, StepAnswer>) => void;
  onAlgoSelected?: (algoId: string, algoName: string, totalSteps: number) => void;
}) {
  const { algorithms } = useTriageConfig();
  const enabled = algorithms.filter(a => a.enabled);

  const [algoId, setAlgoId] = useState<string | null>(() => initialAlgoId ?? (enabled.length === 1 ? enabled[0].id : null));
  const [stepIndex, setStepIndex] = useState(initialStepIndex ?? 0);
  const [answers, setAnswers] = useState<Record<string, StepAnswer>>(initialAnswers ?? {});
  const [routed, setRouted] = useState<{ outcome: TriageOutcome; by: string; severityBand?: { label: string; color: string } } | null>(null);
  const [done, setDone] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  const onDraftChangeRef = useRef(onDraftChange);
  useEffect(() => { onDraftChangeRef.current = onDraftChange; });
  useEffect(() => {
    if (algoId && onDraftChangeRef.current) {
      onDraftChangeRef.current(algoId, stepIndex, answers);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algoId, stepIndex, answers]);

  // When a single algorithm is enabled, the state initialiser auto-selects it
  // without going through the picker click path. Notify the parent once on mount
  // so it can create a draft (mirrors the onAlgoSelected call in the picker).
  const autoAlgoNotifiedRef = useRef(false);
  useEffect(() => {
    if (algoId && !initialAlgoId && !autoAlgoNotifiedRef.current && onAlgoSelected) {
      autoAlgoNotifiedRef.current = true;
      const a = enabled.find(x => x.id === algoId);
      if (a) onAlgoSelected(a.id, a.name, a.steps.length);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs only once on mount

  const algo = enabled.find(a => a.id === algoId) ?? null;

  function restart() {
    setAlgoId(enabled.length === 1 ? enabled[0].id : null);
    setStepIndex(0);
    setAnswers({});
    setRouted(null);
    setDone(false);
    setStartedAt(Date.now());
  }

  function setAnswer(id: string, ans: StepAnswer) {
    setAnswers(prev => ({ ...prev, [id]: ans }));
  }

  // ── No enabled algorithms ──────────────────────────────────────────────────

  if (enabled.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No triage algorithms configured</p>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
            Ask an administrator to create an algorithm under Admin › Nursing › Triage.
          </p>
        </div>
      </div>
    );
  }

  // ── Algorithm picker ───────────────────────────────────────────────────────

  if (!algo) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-bold text-slate-700">Select Triage Algorithm</span>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {enabled.map(a => (
            <button
              key={a.id}
              onClick={() => { setAlgoId(a.id); setStepIndex(0); setAnswers({}); setRouted(null); setDone(false); setStartedAt(Date.now()); onAlgoSelected?.(a.id, a.name, a.steps.length); }}
              className="w-full rounded-xl border border-slate-200 bg-white hover:border-[#4982CF]/50 hover:shadow-sm p-4 text-left transition-all group flex items-center gap-4"
            >
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">{a.name}</p>
                <p className="text-xs text-[#4982CF] font-medium mt-0.5">{a.complaintLabel}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{a.steps.length} steps</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#4982CF] transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const totalSteps = algo.steps.length;
  const progress = routed || done ? 100 : Math.round(((stepIndex + 1) / totalSteps) * 100);
  const step = algo.steps[stepIndex] ?? null;
  const currentAnswer = step ? answers[step.id] : undefined;

  function canProceed(): boolean {
    if (!step) return true;
    if (step.type === "question-group") {
      const sel = currentAnswer?.selected ?? {};
      return step.items.every(it => it.id in sel);
    }
    return true;
  }

  function handleFinish(outcome: TriageOutcome) {
    const session: TriageSession = {
      id: genId(),
      algoId: algo!.id,
      algoName: algo!.name,
      patientRef: patient?.mrn ?? null,
      patientName: patient?.name ?? null,
      startedAt,
      finishedAt: Date.now(),
      outcomeType: outcome.type,
      outcomeLabel: OUTCOME_CFG[outcome.type].label,
      adviceItems: outcome.adviceItems,
      routedBy: routed?.by ?? null,
      severityBandLabel: routed?.severityBand?.label,
      severityBandColor: routed?.severityBand?.color,
      stepAnswers: algo!.steps.slice(0, stepIndex + 1).map(s => ({
        stepId: s.id,
        stepTitle: s.title,
        summary: summarizeAnswer(s, answers[s.id]),
      })),
    };
    saveSession(session);
    setDone(true);
    onFinishTriage?.();
  }

  function handleNext() {
    if (!step || !algo) return;
    const routing = evalRouting(step, currentAnswer);
    if (routing) {
      let severityBand: { label: string; color: string } | undefined;
      if (step.type === "severity-scale") {
        const val = currentAnswer?.value ?? 1;
        const b = step.bands.find(bd => val >= bd.from && val <= bd.to);
        if (b) severityBand = { label: b.label, color: b.color };
      }
      setRouted({ outcome: routing, by: step.title, severityBand });
      return;
    }
    if (stepIndex + 1 >= totalSteps) {
      // No routing fired — fall through with a default clinical-advice outcome
      handleFinish({ type: "advice", adviceItems: [] });
    } else {
      setStepIndex(i => i + 1);
    }
  }

  // ── Main step view ─────────────────────────────────────────────────────────

  const isOutcomeStep = step?.type === "outcome";
  const stepOutcome: TriageOutcome = step?.type === "outcome"
    ? (step.ifAnyYes ?? { type: "advice" as TriageOutcomeType, adviceItems: [] })
    : { type: "advice" as TriageOutcomeType, adviceItems: [] };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <RunnerHeader
        algo={algo}
        stepIndex={routed ? totalSteps - 1 : stepIndex}
        totalSteps={totalSteps}
        progress={progress}
        onRestart={restart}
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Step title */}
        {!routed && step && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Step {stepIndex + 1} of {totalSteps}
            </p>
            <h2 className="text-base font-black text-slate-900">{step.title}</h2>
          </div>
        )}

        {/* Content */}
        {routed ? (
          <OutcomeDisplay
            outcome={routed.outcome}
            routedBy={routed.by}
            severityBand={routed.severityBand}
            onFinish={() => handleFinish(routed.outcome)}
          />
        ) : isOutcomeStep ? (
          <OutcomeDisplay
            outcome={stepOutcome}
            routedBy={null}
            onFinish={() => handleFinish(stepOutcome)}
          />
        ) : step?.type === "patient-details" ? (
          <PatientDetailsStep patient={patient} />
        ) : step?.type === "presenting-complaint" ? (
          <PresentingComplaintStep
            complaintLabel={algo.complaintLabel}
            value={currentAnswer?.text ?? algo.complaintLabel}
            onChange={text => setAnswer(step.id, { text })}
          />
        ) : step?.type === "question-group" ? (
          <QuestionGroupStep
            step={step}
            answers={currentAnswer?.selected ?? {}}
            onChange={selected => {
              setAnswer(step.id, { selected });
              if (step.ifAnyYes && Object.values(selected).some(v => v === true)) {
                setRouted({ outcome: step.ifAnyYes, by: step.title });
              }
            }}
          />
        ) : step?.type === "flag-checklist" ? (
          <FlagChecklistStep
            step={step}
            answers={currentAnswer?.selected ?? {}}
            onChange={selected => {
              setAnswer(step.id, { selected });
              if (step.ifAnyYes && Object.values(selected).some(v => v === true)) {
                setRouted({ outcome: step.ifAnyYes, by: step.title });
              }
            }}
          />
        ) : step?.type === "severity-scale" ? (
          <SeverityScaleStep
            step={step}
            value={currentAnswer?.value ?? 1}
            onChange={value => setAnswer(step.id, { value })}
          />
        ) : step?.type === "character-checklist" ? (
          <CharacterCheckStep
            step={step}
            selected={currentAnswer?.selected ?? {}}
            onChange={selected => setAnswer(step.id, { selected })}
          />
        ) : null}
      </div>

      {/* Footer nav — only for non-terminal steps when not routed */}
      {!routed && step && !isOutcomeStep && (
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-white">
          <button
            onClick={() => stepIndex > 0 && setStepIndex(i => i - 1)}
            disabled={stepIndex === 0}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Back
          </button>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="h-9 px-5 bg-[#4982CF] hover:bg-[#3a6fb8] text-white text-xs font-bold gap-2 disabled:opacity-50"
          >
            {stepIndex + 1 >= totalSteps ? "Complete" : "Next Step"}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Done banner after finish */}
      {done && routed && (
        <div className="flex-shrink-0 px-5 py-3 border-t border-slate-200 bg-green-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-xs font-bold text-green-800">Triage session saved</span>
          </div>
          <button
            onClick={restart}
            className="text-xs font-semibold text-green-700 hover:text-green-900 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> New Session
          </button>
        </div>
      )}
    </div>
  );
}
