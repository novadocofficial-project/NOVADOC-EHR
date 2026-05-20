import { useState, useEffect, useMemo, useRef } from "react";
import {
  PhoneCall, X, ChevronUp, ChevronDown, ChevronRight,
  Maximize2, Minimize2, Clock, User, AlertCircle, Heart,
  SkipForward, RotateCcw, Activity, ClipboardList,
  Stethoscope, Target, TrendingUp, CheckCircle2, Plus,
  Layers, Trash2, Pill, Receipt, ShieldCheck, DollarSign, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { QueueAppHeader, timeAgo, type Patient } from "@/pages/QueuePageLayout";
import { useMultiStepQueue, MultiEntry } from "@/hooks/useMultiStepQueue";
import {
  useNursingConfig,
  SYSTEM_COMPONENTS,
  PROCEDURE_SYSTEM_COMPONENTS,
  type NursingField,
  type NursingComponent,
  type NursingHistoryTemplate,
  type NursingProcedureTemplate,
  type ProcedureSystemComponentKey,
  type ConditionalRule,
} from "@/hooks/useNursingConfig";
import { loadVitalsConfig, type VitalConfig } from "@/pages/SoapConfigModule";
import { useNursingCareTasks } from "@/hooks/useNursingCareTasks";
import { PatientGoalsTab } from "@/pages/NursingCareTasksTab";
import { TriageRunner, loadSessions, OUTCOME_CFG, type StepAnswer, type TriageSession } from "@/pages/TriageRunner";
import { SOAP_DUMMY } from "@/data/soapDummy";
import type { CarePlanData } from "@/pages/CarePlanSection";
import type { SignedRecord } from "@/pages/SoapNotePage";

// ─── Constants ────────────────────────────────────────────────────────────────

const CALL_WINDOW_SECS = 30;
const MAX_CALLS = 3;

function getSecsLeft(ts: number | null): number {
  if (!ts) return 0;
  return Math.max(0, CALL_WINDOW_SECS - Math.floor((Date.now() - ts) / 1000));
}

// ─── Trend mock data ──────────────────────────────────────────────────────────

const TREND_VITALS = [
  { date: "Jan 15", pulse: 68, systolic: 115, diastolic: 72, temp: 36.5, o2: 98 },
  { date: "Feb 10", pulse: 72, systolic: 118, diastolic: 75, temp: 36.8, o2: 98 },
  { date: "Feb 17", pulse: 78, systolic: 124, diastolic: 79, temp: 37.1, o2: 97 },
  { date: "Feb 24", pulse: 75, systolic: 120, diastolic: 76, temp: 36.6, o2: 99 },
  { date: "Mar 03", pulse: 80, systolic: 128, diastolic: 82, temp: 37.3, o2: 96 },
  { date: "Mar 10", pulse: 74, systolic: 119, diastolic: 74, temp: 36.9, o2: 98 },
  { date: "Today",  pulse: 76, systolic: 121, diastolic: 77, temp: 37.0, o2: 97 },
];
const TREND_PAIN   = [
  { date: "Jan 15", score: 2 }, { date: "Feb 10", score: 3 }, { date: "Feb 17", score: 5 },
  { date: "Feb 24", score: 4 }, { date: "Mar 03", score: 6 }, { date: "Mar 10", score: 5 }, { date: "Today", score: 5 },
];
const TREND_MENTAL = [
  { date: "Jan 15", total: 2 }, { date: "Feb 10", total: 3 }, { date: "Feb 17", total: 5 },
  { date: "Feb 24", total: 4 }, { date: "Mar 03", total: 6 }, { date: "Mar 10", total: 4 }, { date: "Today", total: 4 },
];

// ─── Pain levels ──────────────────────────────────────────────────────────────

const PAIN_LEVELS = [
  { level: 0,  label: "No Pain",                desc: "No discomfort or pain is present. Complete at ease" },
  { level: 1,  label: "Very Mild Pain",          desc: "Barely noticeable pain. No interference with daily activities" },
  { level: 2,  label: "Mild Pain",               desc: "Minor discomfort. It can be easily ignored during daily activities" },
  { level: 3,  label: "Moderate Pain",           desc: "Uncomfortable pain that may cause some distraction. Can still perform most daily activities but with some difficulty" },
  { level: 4,  label: "Moderate to Severe Pain", desc: "Pain that starts to interfere with daily activities" },
  { level: 5,  label: "Severe Pain",             desc: "Pain that significantly impacts daily activities" },
  { level: 6,  label: "Intense Pain",            desc: "Very strong pain that may cause an inability to concentrate on tasks" },
  { level: 7,  label: "Very Intense Pain",       desc: "Pain that is nearly unbearable" },
  { level: 8,  label: "Excruciating Pain",       desc: "Pain is so intense that it is difficult to think or communicate" },
  { level: 9,  label: "Unbearable Pain",         desc: "Pain that feels all-consuming and impossible to tolerate" },
  { level: 10, label: "Worst Possible Pain",     desc: "Pain that is beyond imagination" },
];

const MENTAL_QUESTIONS = [
  "Feeling nervous, anxious or on edge:",
  "Not being able to stop or control worrying:",
  "Feeling down, depressed or hopeless:",
  "Little interest or pleasure in doing things:",
];

// ─── Category definitions ─────────────────────────────────────────────────────

type NurseCategory = "triage" | "history" | "vitals" | "care-plan" | "procedures" | "goals";

const CATEGORIES: { id: NurseCategory; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: "triage",     label: "Triage",             icon: <AlertCircle className="h-5 w-5" />, color: "text-red-600",    bg: "bg-red-50 border-red-200"     },
  { id: "history",    label: "History",            icon: <ClipboardList className="h-5 w-5"/>, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  { id: "vitals",     label: "Vital Signs",        icon: <Activity className="h-5 w-5" />,    color: "text-[#4982CF]", bg: "bg-blue-50 border-blue-200"   },
  { id: "care-plan",  label: "Care Plan",          icon: <Heart className="h-5 w-5" />,       color: "text-rose-600",  bg: "bg-rose-50 border-rose-200"   },
  { id: "procedures", label: "Nursing Procedures", icon: <Stethoscope className="h-5 w-5" />, color: "text-teal-700",  bg: "bg-teal-50 border-teal-200"   },
  { id: "goals",      label: "Goals",              icon: <Target className="h-5 w-5" />,      color: "text-green-700", bg: "bg-green-50 border-green-200" },
];

const CATEGORY_NAV_LABELS: { id: NurseCategory; label: string }[] = [
  { id: "triage", label: "Triage" }, { id: "history", label: "History" },
  { id: "vitals", label: "Vital Signs" }, { id: "care-plan", label: "Care Plan" },
  { id: "procedures", label: "Nursing Procedures" }, { id: "goals", label: "Goals" },
];

// ─── Collapsible helper ───────────────────────────────────────────────────────

function Collapsible({ title, badge, defaultOpen = true, accent, children }:
  { title: string; badge?: number; defaultOpen?: boolean; accent?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button className="w-full flex items-center justify-between py-2" onClick={() => setOpen(o => !o)}>
        <span className={`text-sm font-bold ${accent ? "text-[#4982CF]" : "text-slate-700"}`}>
          {title}{badge !== undefined && <span className="ml-1.5 text-[11px] font-bold text-slate-500">({badge})</span>}
        </span>
        {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ─── Left panel (vitals section) ─────────────────────────────────────────────

function VitalsLeftPanel({ drafts, records, activeDraftId, configuredVitals, onResumeDraft, onDiscardDraft }: {
  drafts: VitalsDraft[];
  records: VitalsRecord[];
  activeDraftId: string | null;
  configuredVitals: VitalConfig[];
  onResumeDraft: (draftId: string) => void;
  onDiscardDraft: (draftId: string) => void;
}) {
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  function vitalsRowsFromValues(vitalValues: Record<string, string>): [string, string][] {
    return configuredVitals
      .filter(v => v.opd !== "skip")
      .flatMap(v => {
        if (v.id === "bp") {
          const sys = vitalValues["bp_sys"] ?? "";
          const dia = vitalValues["bp_dia"] ?? "";
          if (!sys && !dia) return [];
          return [[v.name, `${sys || "—"}/${dia || "—"} ${v.unit}`]] as [string, string][];
        }
        const val = vitalValues[v.id] ?? "";
        if (!val.trim()) return [];
        return [[`${v.name}${v.unit ? ` (${v.unit})` : ""}`, val]] as [string, string][];
      });
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-white">

      {/* Required Actions header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-2">
        <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-700 flex-1">Required Actions</span>
        {drafts.length > 0 && (
          <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5 leading-none">
            {drafts.length}
          </span>
        )}
      </div>

      <div className="px-3 py-3 space-y-2">
        {drafts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-6 flex flex-col items-center gap-1.5 text-center">
            <Activity className="h-4 w-4 text-slate-300" />
            <p className="text-xs text-slate-400">No active vitals entries</p>
          </div>
        ) : drafts.map(d => {
          const active = activeDraftId === d.draftId;
          const age = Date.now() - d.updatedAt;
          const ageLabel = age < 60_000
            ? "just now"
            : age < 3_600_000
              ? `${Math.floor(age / 60_000)}m ago`
              : `${Math.floor(age / 3_600_000)}h ago`;
          return (
            <div
              key={d.draftId}
              className={`rounded-xl border transition-all ${
                active
                  ? "bg-amber-50/60 border-amber-300/60 shadow-sm ring-1 ring-amber-200/60"
                  : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <button onClick={() => onResumeDraft(d.draftId)} className="w-full text-left p-3.5 pr-2">
                <div className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-blue-100" : "bg-blue-50"}`}>
                    <Activity className={`h-4 w-4 ${active ? "text-[#4982CF]" : "text-blue-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug truncate">
                      {d.patientName ?? "Walk-in"} — Vital Signs
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{d.patientRef ?? "No MRN"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{ageLabel}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onDiscardDraft(d.draftId); }}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0 mt-0.5"
                    title="Discard draft"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* All Records header */}
      <div className="sticky top-0 z-10 bg-white border-t border-b border-slate-100 px-4 py-3 flex items-center gap-2 mt-1">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-700 flex-1">All Records</span>
        {records.length > 0 && (
          <span className="text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 rounded-full px-2 py-0.5 leading-none">
            {records.length}
          </span>
        )}
      </div>

      <div className="px-3 py-3 space-y-2">
        {records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-6 flex flex-col items-center gap-1.5 text-center">
            <CheckCircle2 className="h-4 w-4 text-slate-300" />
            <p className="text-xs text-slate-400">No completed records</p>
          </div>
        ) : [...records].reverse().map(r => {
          const expanded = expandedRecord === r.recordId;
          const vitalsRows = vitalsRowsFromValues(r.vitalValues);
          const mentalTotal = r.mentalAnswers.reduce((s, v) => s + v, 0);
          return (
            <div key={r.recordId} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
              <button
                onClick={() => setExpandedRecord(expanded ? null : r.recordId)}
                className="w-full text-left p-3.5 flex items-start gap-3 hover:bg-white transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-snug truncate">
                    {r.patientName ?? "Walk-in"} — Vital Signs
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{r.patientRef ?? "No MRN"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(r.completedAt).toLocaleDateString()} · {vitalsRows.length} reading{vitalsRows.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded && (
                <div className="border-t border-slate-200 bg-white px-4 py-3 space-y-3">
                  {vitalsRows.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Vital Signs</p>
                      <div className="rounded-lg overflow-hidden border border-slate-100">
                        {vitalsRows.map(([label, value], i) => (
                          <div key={label} className={`flex items-center justify-between px-2.5 py-1.5 ${i % 2 === 0 ? "bg-blue-50" : "bg-white"}`}>
                            <span className="text-xs text-slate-500">{label}</span>
                            <span className="text-xs font-semibold text-slate-800">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {r.painScore >= 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Pain Score</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Level {r.painScore}/10</span>
                        <span className="text-xs font-bold text-slate-800">{PAIN_LEVELS[r.painScore]?.label ?? "—"}</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(r.painScore / 10) * 100}%`, backgroundColor: r.painScore <= 3 ? "#22c55e" : r.painScore <= 6 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                    </div>
                  )}
                  {mentalTotal > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Mental Health (PHQ-4)</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Total Score</span>
                        <span className={`text-xs font-bold ${mentalTotal <= 2 ? "text-green-600" : mentalTotal <= 5 ? "text-amber-600" : "text-red-600"}`}>{mentalTotal} / 16</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(mentalTotal / 16) * 100}%`, backgroundColor: mentalTotal <= 2 ? "#22c55e" : mentalTotal <= 5 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                    </div>
                  )}
                  {vitalsRows.length === 0 && r.painScore < 0 && mentalTotal === 0 && (
                    <p className="text-xs text-slate-400 italic">No data recorded.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Left panel — Nursing Procedures ─────────────────────────────────────────

function ProcedureLeftPanel({
  drafts, records, activeDraftId, onSelectDraft,
}: {
  drafts:         ProcDraft[];
  records:        ProcRecord[];
  activeDraftId:  string | null;
  onSelectDraft:  (id: string) => void;
}) {
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const configuredVitals = useMemo(() => loadVitalsConfig(), []);

  function vitalsRowsFromRecord(v: Record<string, string>): [string, string][] {
    return configuredVitals
      .filter(vit => vit.opd !== "skip")
      .flatMap(vit => {
        if (vit.id === "bp") {
          const sys = v["bp_sys"] ?? "";
          const dia = v["bp_dia"] ?? "";
          if (!sys && !dia) return [];
          return [[vit.name, `${sys || "—"}/${dia || "—"} ${vit.unit}`]] as [string, string][];
        }
        const val = v[vit.id] ?? "";
        if (!val.trim()) return [];
        return [[`${vit.name}${vit.unit ? ` (${vit.unit})` : ""}`, val]] as [string, string][];
      });
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-white">

      {/* ── Required Actions ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-2 flex-shrink-0">
        <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-700 flex-1">Required Actions</span>
        {drafts.length > 0 && (
          <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5 leading-none">
            {drafts.length}
          </span>
        )}
      </div>

      <div className="px-3 py-3 space-y-2">
        {drafts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-6 flex flex-col items-center gap-1.5 text-center">
            <Stethoscope className="h-4 w-4 text-slate-300" />
            <p className="text-xs text-slate-400">No active procedures</p>
          </div>
        ) : drafts.map(d => {
          const active = activeDraftId === d.draftId;
          const age = Date.now() - d.updatedAt;
          const ageLabel = age < 60_000 ? "just now"
            : age < 3_600_000 ? `${Math.floor(age / 60_000)}m ago`
            : `${Math.floor(age / 3_600_000)}h ago`;
          return (
            <button
              key={d.draftId}
              onClick={() => onSelectDraft(d.draftId)}
              className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                active
                  ? "bg-teal-50/60 border-teal-300/60 shadow-sm ring-1 ring-teal-200/60"
                  : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-teal-100" : "bg-teal-50"}`}>
                  <Stethoscope className={`h-4 w-4 ${active ? "text-teal-600" : "text-teal-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{d.templateName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Started {new Date(d.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">In Progress</span>
                    <span className="text-[10px] text-slate-400">saved {ageLabel}</span>
                  </div>
                </div>
                <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 mt-1 transition-transform ${active ? "rotate-90 text-teal-600" : "text-slate-300"}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── All Records ── */}
      <div className="bg-white border-t border-b border-slate-100 px-4 py-3 flex items-center gap-2">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-700 flex-1">All Records</span>
        {records.length > 0 && (
          <span className="text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 rounded-full px-2 py-0.5 leading-none">
            {records.length}
          </span>
        )}
      </div>

      <div className="px-3 py-3 space-y-2">
        {records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-6 flex flex-col items-center gap-1.5 text-center">
            <CheckCircle2 className="h-4 w-4 text-slate-300" />
            <p className="text-xs text-slate-400">No completed records</p>
          </div>
        ) : [...records].reverse().map(r => {
          const exp = expandedRecord === r.recordId;
          const vitalsRows    = vitalsRowsFromRecord(r.vitalsValues);
          const filledMeds    = r.medRows.filter(m => m.drug.trim());
          const filledBilling = r.billingRows.filter(b => b.name.trim());
          const hasCustom     = Object.values(r.customValues).some(entries =>
            entries.some(e => Object.values(e).some(v => v.trim())),
          );
          const hasAnyData = vitalsRows.length > 0 || filledMeds.length > 0
            || !!r.consentData.status || filledBilling.length > 0 || hasCustom;
          return (
            <div key={r.recordId} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
              <button
                onClick={() => setExpandedRecord(exp ? null : r.recordId)}
                className="w-full text-left p-3.5 flex items-start gap-3 hover:bg-white transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{r.templateName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(r.completedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-1 transition-transform ${exp ? "rotate-180" : ""}`} />
              </button>
              {exp && (
                <div className="border-t border-slate-200 bg-white px-4 py-3 space-y-3">
                  {!hasAnyData && (
                    <p className="text-xs text-slate-400 italic">No data recorded.</p>
                  )}

                  {/* Vitals */}
                  {vitalsRows.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Vital Signs</p>
                      <div className="rounded-lg overflow-hidden border border-slate-100">
                        {vitalsRows.map(([label, value], i) => (
                          <div key={label} className={`flex items-center justify-between px-2.5 py-1.5 ${i % 2 === 0 ? "bg-blue-50" : "bg-white"}`}>
                            <span className="text-[11px] text-slate-500">{label}</span>
                            <span className="text-[11px] font-semibold text-slate-800">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medications */}
                  {filledMeds.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Medications Given</p>
                      <div className="rounded-lg overflow-hidden border border-slate-100">
                        {filledMeds.map((m, i) => (
                          <div key={m.id} className={`px-2.5 py-1.5 ${i % 2 === 0 ? "bg-violet-50" : "bg-white"}`}>
                            <span className="text-[11px] font-semibold text-slate-700">{m.drug}</span>
                            {(m.dose || m.route) && (
                              <span className="text-[10px] text-slate-400 ml-1.5">
                                {[m.dose, m.route].filter(Boolean).join(" · ")}
                              </span>
                            )}
                            {m.notes && <p className="text-[10px] text-slate-400 mt-0.5">{m.notes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Consent */}
                  {r.consentData.status && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Consent</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          r.consentData.status === "obtained" ? "bg-green-100 text-green-700"
                          : r.consentData.status === "pending"  ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                        }`}>
                          {r.consentData.status.charAt(0).toUpperCase() + r.consentData.status.slice(1)}
                        </span>
                        {r.consentData.witness && (
                          <span className="text-[11px] text-slate-500">Witness: {r.consentData.witness}</span>
                        )}
                      </div>
                      {r.consentData.notes && (
                        <p className="text-[10px] text-slate-400 mt-1">{r.consentData.notes}</p>
                      )}
                    </div>
                  )}

                  {/* Billing */}
                  {filledBilling.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Billing Items</p>
                      <div className="rounded-lg overflow-hidden border border-slate-100">
                        {filledBilling.map((b, i) => (
                          <div key={b.id} className={`flex items-center justify-between px-2.5 py-1.5 ${i % 2 === 0 ? "bg-slate-50" : "bg-white"}`}>
                            <span className="text-[11px] text-slate-600">{b.name} × {b.qty}</span>
                            <span className="text-[11px] font-semibold text-slate-700">
                              {(b.qty * b.unitFee).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom fields */}
                  {hasCustom && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Additional Fields</p>
                      <div className="space-y-0.5">
                        {Object.entries(r.customValues).flatMap(([, entries]) =>
                          entries.flatMap((entry, eIdx) =>
                            Object.entries(entry)
                              .filter(([, v]) => v.trim())
                              .map(([key, val]) => (
                                <div key={`${eIdx}-${key}`} className="flex items-start justify-between gap-2 text-[11px]">
                                  <span className="text-slate-400 truncate">{key}</span>
                                  <span className="text-slate-700 font-medium text-right">{val}</span>
                                </div>
                              )),
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Care Plan — types, localStorage helpers, scanner ────────────────────────

const CAREPLAN_RECORDS_KEY  = "ehr-careplan-records";
const SOAP_SIGNED_PREFIX    = "soap_signed_";
const CP_EXEC_KEY           = "ehr-cp-exec-v2";

interface CarePlanSource {
  id:            string;
  doctorName:    string;
  signedAt:      string;
  carePlanItems: string[];
  /** "seed" for seed notes; patient MRN for localStorage-sourced notes (empty string = unknown) */
  patientRef:    string;
}

// ── Per-task execution state for the Care Plan workspace ──────────────────────

type CpTaskStatus = "pending" | "in-progress" | "done" | "skipped";

interface CpTaskExec {
  uid:         string;
  title:       string;
  status:      CpTaskStatus;
  nurseNote:   string;
  startedAt:   number | null;
  completedAt: number | null;
  skipReason:  string;
}

type CpExecStore = Record<string, CpTaskExec[]>; // sourceId → tasks

interface CarePlanRecord {
  recordId:    string;
  source:      CarePlanSource;
  staffNotes:  string;
  completedAt: number;
  taskExecs?:  CpTaskExec[];
}

function loadCarePlanRecords(): CarePlanRecord[] {
  try { const raw = localStorage.getItem(CAREPLAN_RECORDS_KEY); return raw ? JSON.parse(raw) as CarePlanRecord[] : []; } catch { return []; }
}
function saveCarePlanRecords(recs: CarePlanRecord[]): void {
  try { localStorage.setItem(CAREPLAN_RECORDS_KEY, JSON.stringify(recs)); } catch { /**/ }
}
function loadCpExecStore(): CpExecStore {
  try { return JSON.parse(localStorage.getItem(CP_EXEC_KEY) ?? "{}") as CpExecStore; } catch { return {}; }
}
function saveCpExecStore(store: CpExecStore): void {
  try { localStorage.setItem(CP_EXEC_KEY, JSON.stringify(store)); } catch { /**/ }
}
function buildCpTasks(sourceId: string, items: string[]): CpTaskExec[] {
  return items.map((title, i) => ({
    uid:         `${sourceId}-${i}`,
    title,
    status:      "pending" as CpTaskStatus,
    nurseNote:   "",
    startedAt:   null,
    completedAt: null,
    skipReason:  "",
  }));
}

/** Build a map of queue-entry-id → patient MRN by reading the persisted queue state. */
function buildEntryMrnMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem("ehr-queue-v2");
    if (!raw) return {};
    const queue = JSON.parse(raw) as Array<{ id: string; patient?: { mrn?: string } }>;
    const map: Record<string, string> = {};
    for (const entry of queue) {
      if (entry.id && entry.patient?.mrn) map[entry.id] = entry.patient.mrn;
    }
    return map;
  } catch { return {}; }
}

/** Extract care plan items from a NoteState's carePlan field.
 *  Handles both CarePlanData { tasks: CarePlanTask[] } and legacy string[] shapes. */
function extractCarePlanItems(carePlan: unknown): string[] {
  if (!carePlan) return [];
  // CarePlanData shape: { tasks: CarePlanTask[] }
  if (typeof carePlan === "object" && !Array.isArray(carePlan)) {
    const tasks = (carePlan as CarePlanData).tasks;
    if (Array.isArray(tasks) && tasks.length > 0) return tasks.map(t => t.title).filter(Boolean);
  }
  // Legacy / seed shape: string[]
  if (Array.isArray(carePlan)) {
    const strs = (carePlan as unknown[]).filter(x => typeof x === "string") as string[];
    if (strs.length > 0) return strs;
  }
  return [];
}

/** Return care plan sources to display in Required Actions.
 *  - Seed SOAP notes: always visible (patientRef = "seed").
 *  - localStorage signed notes: filtered to patientMrn when known; shown unfiltered
 *    when patientMrn is null (walk-in / unknown patient). */
function scanCarePlanSources(patientMrn: string | null): CarePlanSource[] {
  const seedSources: CarePlanSource[] = SOAP_DUMMY.map((note, i) => ({
    id:            `seed-${i}`,
    doctorName:    note.signedBy,
    signedAt:      note.signedAt,
    carePlanItems: note.carePlan,
    patientRef:    "seed",
  }));

  // If no patient is identified, show only seed sources — never expose signed records from storage
  // to an unknown/walk-in patient context.
  if (!patientMrn) return seedSources;

  const entryMrnMap = buildEntryMrnMap();
  const lsSources: CarePlanSource[] = [];
  try {
    const signedKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(SOAP_SIGNED_PREFIX)) signedKeys.push(k);
    }
    for (const key of signedKeys) {
      const entryId = key.slice(SOAP_SIGNED_PREFIX.length);
      const mrnForEntry = entryMrnMap[entryId] ?? "";
      // Exclude records whose MRN differs OR is unknown (cannot confirm patient ownership).
      if (mrnForEntry !== patientMrn) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const records = JSON.parse(raw) as SignedRecord[];
      records.forEach((rec, idx) => {
        if (!rec.signed || !rec.noteState) return;
        const items = extractCarePlanItems(rec.noteState.carePlan as unknown);
        if (items.length === 0) return;
        lsSources.push({
          id:            `ls-${entryId}-${idx}`,
          doctorName:    rec.doctor ?? "Unknown Doctor",
          signedAt:      `${rec.date}${rec.time ? ", " + rec.time : ""}`,
          carePlanItems: items,
          patientRef:    mrnForEntry,
        });
      });
    }
  } catch { /**/ }

  return [...seedSources, ...lsSources];
}

// ─── Left panel — Care Plan ───────────────────────────────────────────────────

interface CareLeftPanelProps {
  sources:     CarePlanSource[];
  records:     CarePlanRecord[];
  selectedId:  string | null;
  cpExecStore: CpExecStore;
  patientMrn:  string | null;
  onSelect:    (id: string) => void;
}

function CareLeftPanel({ sources, records, selectedId, cpExecStore, patientMrn, onSelect }: CareLeftPanelProps) {
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const completedIds = new Set(records.map(r => r.source.id));
  const pendingSources = sources.filter(s => !completedIds.has(s.id));

  const visibleRecords = records.filter(r =>
    r.source.patientRef === "seed" ||
    !patientMrn ||
    r.source.patientRef === patientMrn
  );

  function getStatusBadge(srcId: string) {
    const tasks = cpExecStore[srcId] ?? [];
    if (tasks.length === 0) return { label: "Pending", cls: "bg-slate-100 text-slate-500 border-slate-200" };
    if (tasks.every(t => t.status === "done" || t.status === "skipped")) {
      return { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (tasks.some(t => t.status === "in-progress" || t.status === "done")) {
      return { label: "In Progress", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    return { label: "Pending", cls: "bg-slate-100 text-slate-500 border-slate-200" };
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">

      {/* ── Required Actions header ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-2 flex-shrink-0">
        <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-700 flex-1">Required Actions</span>
        {pendingSources.length > 0 && (
          <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5 leading-none">
            {pendingSources.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-3 space-y-2">
          {pendingSources.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-6 flex flex-col items-center gap-1.5 text-center">
              <Heart className="h-4 w-4 text-slate-300" />
              <p className="text-xs text-slate-400">No pending care plans</p>
            </div>
          ) : pendingSources.map(src => {
            const isSelected = src.id === selectedId;
            const tasks      = cpExecStore[src.id] ?? [];
            const done       = tasks.filter(t => t.status === "done").length;
            const skippedC   = tasks.filter(t => t.status === "skipped").length;
            const total      = tasks.length || src.carePlanItems.length;
            const badge      = getStatusBadge(src.id);

            return (
              <button
                key={src.id}
                onClick={() => onSelect(src.id)}
                className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? "bg-blue-50/60 border-[#4982CF]/60 shadow-sm ring-1 ring-[#4982CF]/30"
                    : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-blue-100" : "bg-rose-50"}`}>
                    <Heart className={`h-4 w-4 ${isSelected ? "text-[#4982CF]" : "text-rose-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{src.doctorName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{src.signedAt}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {done + skippedC}/{total} done{skippedC > 0 ? ` · ${skippedC} skipped` : ""}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 mt-1 transition-transform ${isSelected ? "rotate-90 text-[#4982CF]" : "text-slate-300"}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* ── All Records ── */}
        <div className="bg-white border-t border-b border-slate-100 px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 flex-1">All Records</span>
          {visibleRecords.length > 0 && (
            <span className="text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 rounded-full px-2 py-0.5 leading-none">
              {visibleRecords.length}
            </span>
          )}
        </div>

        <div className="px-3 py-3 space-y-2">
          {visibleRecords.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-6 flex flex-col items-center gap-1.5 text-center">
              <CheckCircle2 className="h-4 w-4 text-slate-300" />
              <p className="text-xs text-slate-400">No completed records</p>
            </div>
          ) : [...visibleRecords].reverse().map(r => {
            const exp       = expandedRecord === r.recordId;
            const taskExecs = r.taskExecs ?? [];
            const doneCount    = taskExecs.filter(t => t.status === "done").length;
            const skippedCount = taskExecs.filter(t => t.status === "skipped").length;
            return (
              <div key={r.recordId} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                <button
                  onClick={() => setExpandedRecord(exp ? null : r.recordId)}
                  className="w-full text-left p-3.5 flex items-start gap-3 hover:bg-white transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{r.source.doctorName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{r.source.signedAt}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Completed {new Date(r.completedAt).toLocaleDateString()}
                      {taskExecs.length > 0
                        ? ` · ${doneCount + skippedCount}/${taskExecs.length} done${skippedCount > 0 ? ` · ${skippedCount} skipped` : ""}`
                        : ` · ${r.source.carePlanItems.length} item${r.source.carePlanItems.length !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-1 transition-transform ${exp ? "rotate-180" : ""}`} />
                </button>
                {exp && (
                  <div className="border-t border-slate-200 bg-white px-4 py-3 space-y-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Tasks</p>
                    {(taskExecs.length > 0
                      ? taskExecs
                      : r.source.carePlanItems.map((title, i) => ({
                          uid: `${r.source.id}-${i}`, title,
                          status: "done" as CpTaskStatus,
                          nurseNote: "", startedAt: null, completedAt: null, skipReason: "",
                        }))
                    ).map((t, i) => (
                      <div key={t.uid ?? i} className="flex items-start gap-2 text-[11px]">
                        <span className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                          t.status === "done" ? "bg-emerald-500" :
                          t.status === "skipped" ? "bg-rose-400" : "bg-slate-300"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-1">
                            <span className={`flex-1 ${t.status === "skipped" ? "line-through text-slate-400" : "text-slate-600"}`}>
                              {t.title}
                            </span>
                            <span className="text-[10px] text-slate-400 flex-shrink-0 capitalize ml-1">{t.status}</span>
                          </div>
                          {t.status === "skipped" && t.skipReason && (
                            <p className="text-[10px] text-rose-400 italic mt-0.5">Reason: {t.skipReason}</p>
                          )}
                          {t.nurseNote && (
                            <p className="text-[10px] text-slate-400 italic mt-0.5">{t.nurseNote}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Care Plan workspace task card ────────────────────────────────────────────

function CpWorkspaceTaskCard({
  task, onAdvance, onSkip, onReset, onNoteChange,
}: {
  task:         CpTaskExec;
  onAdvance:    () => void;
  onSkip:       (reason: string) => void;
  onReset:      () => void;
  onNoteChange: (note: string) => void;
}) {
  const [expanded,   setExpanded]   = useState(false);
  const [skipMode,   setSkipMode]   = useState(false);
  const [skipReason, setSkipReason] = useState("");

  const STATUS_STYLES: Record<CpTaskStatus, { dot: string; chip: string; label: string }> = {
    "pending":     { dot: "bg-slate-300",   chip: "bg-slate-100 text-slate-500 border-slate-200",        label: "Pending"     },
    "in-progress": { dot: "bg-amber-400",   chip: "bg-amber-50 text-amber-700 border-amber-200",          label: "In Progress" },
    "done":        { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200",    label: "Done"        },
    "skipped":     { dot: "bg-rose-400",    chip: "bg-rose-50 text-rose-600 border-rose-200",             label: "Skipped"     },
  };

  const s     = STATUS_STYLES[task.status];
  const isDone = task.status === "done" || task.status === "skipped";

  return (
    <div className={`rounded-xl border bg-white transition-all ${
      task.status === "done"        ? "border-emerald-200 opacity-80" :
      task.status === "skipped"     ? "border-rose-200 opacity-70"    :
      task.status === "in-progress" ? "border-amber-300 shadow-sm ring-1 ring-amber-200/50" :
      "border-slate-200"
    }`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <span className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${s.dot}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-[12px] font-semibold leading-snug ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
            {task.title}
          </p>
          <span className={`inline-flex items-center text-[9px] font-bold border rounded-full px-1.5 py-0.5 mt-1 ${s.chip}`}>
            {s.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
          {task.status === "pending" && !skipMode && (
            <button onClick={onAdvance}
              className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-all">
              <Play className="h-3 w-3" /> Start
            </button>
          )}
          {task.status === "in-progress" && !skipMode && (
            <button onClick={onAdvance}
              className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-all">
              <CheckCircle2 className="h-3 w-3" /> Mark Done
            </button>
          )}
          {task.status === "pending" && !skipMode && (
            <button onClick={() => setSkipMode(true)}
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
            <button
              onClick={() => { onSkip(skipReason.trim() || "No reason given"); setSkipMode(false); setSkipReason(""); }}
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

      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-3 border-t border-slate-100">
          {task.status === "skipped" && task.skipReason && (
            <p className="text-[11px] text-rose-500 italic">Skipped: {task.skipReason}</p>
          )}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Nurse Notes
            </label>
            <textarea
              value={task.nurseNote}
              onChange={e => onNoteChange(e.target.value)}
              rows={2}
              placeholder="Add observations, patient response…"
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 resize-none transition-all placeholder:text-slate-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Care Plan right panel workspace ─────────────────────────────────────────

function CarePlanWorkspace({
  source, tasks, onAdvance, onSkip, onReset, onNoteChange, onSaveComplete,
}: {
  source:         CarePlanSource | null;
  tasks:          CpTaskExec[];
  onAdvance:      (uid: string) => void;
  onSkip:         (uid: string, reason: string) => void;
  onReset:        (uid: string) => void;
  onNoteChange:   (uid: string, note: string) => void;
  onSaveComplete: () => void;
}) {
  if (!source) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-10">
        <div>
          <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-rose-300" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Select a Care Plan to begin</p>
          <p className="text-xs text-slate-400 mt-1">Choose a plan from the left panel to start working on it.</p>
        </div>
      </div>
    );
  }

  const total      = tasks.length;
  const done       = tasks.filter(t => t.status === "done").length;
  const inProgress = tasks.filter(t => t.status === "in-progress").length;
  const skipped    = tasks.filter(t => t.status === "skipped").length;
  const pct        = total ? Math.round(((done + skipped) / total) * 100) : 0;
  const canComplete = total > 0 && tasks.every(t => t.status === "done" || t.status === "skipped");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-50/50 border-b border-slate-100 px-5 py-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
            <Heart className="h-4 w-4 text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{source.doctorName}</p>
            <p className="text-[11px] text-slate-500">{source.signedAt}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xs font-bold text-slate-700">{done + skipped}/{total} done</p>
            <p className="text-[10px] text-slate-400">
              {inProgress > 0 && <span className="text-amber-600 mr-1">{inProgress} active</span>}
              {skipped > 0 && <span className="text-rose-400">{skipped} skipped</span>}
            </p>
          </div>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "#4982CF" }}
          />
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {tasks.map(task => (
          <CpWorkspaceTaskCard
            key={task.uid}
            task={task}
            onAdvance={() => onAdvance(task.uid)}
            onSkip={reason => onSkip(task.uid, reason)}
            onReset={() => onReset(task.uid)}
            onNoteChange={note => onNoteChange(task.uid, note)}
          />
        ))}
      </div>

      {/* Save & Complete */}
      <div className="flex-shrink-0 border-t border-slate-200 px-5 py-3 bg-white">
        <button
          onClick={onSaveComplete}
          disabled={!canComplete}
          className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold transition-colors ${
            canComplete
              ? "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          {canComplete
            ? "Save & Complete"
            : `${total - done - skipped} task${total - done - skipped !== 1 ? "s" : ""} remaining`}
        </button>
      </div>
    </div>
  );
}

// ─── Care Plan section — owns both left list and right workspace ───────────────

function CarePlanSection({ patientMrn }: { patientMrn: string | null }) {
  const [sources,     setSources]     = useState<CarePlanSource[]>(() => scanCarePlanSources(patientMrn));
  const [records,     setRecords]     = useState<CarePlanRecord[]>(loadCarePlanRecords);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [cpExecStore, setCpExecStore] = useState<CpExecStore>(loadCpExecStore);

  useEffect(() => {
    setSources(scanCarePlanSources(patientMrn));
    setSelectedId(null);
  }, [patientMrn]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key?.startsWith(SOAP_SIGNED_PREFIX)) setSources(scanCarePlanSources(patientMrn));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [patientMrn]);

  function handleSelect(id: string) {
    setSelectedId(id);
    setCpExecStore(prev => {
      if (prev[id]) return prev;
      const src = sources.find(s => s.id === id);
      if (!src) return prev;
      const next = { ...prev, [id]: buildCpTasks(id, src.carePlanItems) };
      saveCpExecStore(next);
      return next;
    });
  }

  function patchTask(uid: string, patch: Partial<CpTaskExec>) {
    if (!selectedId) return;
    setCpExecStore(prev => {
      const tasks = (prev[selectedId] ?? []).map(t => t.uid === uid ? { ...t, ...patch } : t);
      const next  = { ...prev, [selectedId]: tasks };
      saveCpExecStore(next);
      return next;
    });
  }

  function handleAdvance(uid: string) {
    if (!selectedId) return;
    setCpExecStore(prev => {
      const tasks = (prev[selectedId] ?? []).map(t => {
        if (t.uid !== uid) return t;
        const now = Date.now();
        if (t.status === "pending")          return { ...t, status: "in-progress" as CpTaskStatus, startedAt: now };
        if (t.status === "in-progress")      return { ...t, status: "done" as CpTaskStatus, completedAt: now };
        return t;
      });
      const next = { ...prev, [selectedId]: tasks };
      saveCpExecStore(next);
      return next;
    });
  }

  function handleSkip(uid: string, reason: string) {
    patchTask(uid, { status: "skipped", skipReason: reason, completedAt: Date.now() });
  }

  function handleReset(uid: string) {
    patchTask(uid, { status: "pending", nurseNote: "", skipReason: "", startedAt: null, completedAt: null });
  }

  function handleNoteChange(uid: string, note: string) {
    patchTask(uid, { nurseNote: note });
  }

  function handleSaveComplete() {
    if (!selectedId) return;
    const src = sources.find(s => s.id === selectedId);
    if (!src) return;
    const taskExecs  = cpExecStore[selectedId] ?? [];
    const staffNotes = taskExecs.map(t => t.nurseNote).filter(Boolean).join("\n");
    const record: CarePlanRecord = {
      recordId:    `cp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      source:      src,
      staffNotes,
      completedAt: Date.now(),
      taskExecs,
    };
    setRecords(prev => { const next = [...prev, record]; saveCarePlanRecords(next); return next; });
    setCpExecStore(prev => {
      const next = { ...prev };
      delete next[selectedId];
      saveCpExecStore(next);
      return next;
    });
    setSelectedId(null);
  }

  const completedIds    = new Set(records.map(r => r.source.id));
  const selectedSource  = (selectedId && !completedIds.has(selectedId))
    ? (sources.find(s => s.id === selectedId) ?? null)
    : null;
  const selectedTasks   = selectedId ? (cpExecStore[selectedId] ?? []) : [];

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-1/2 flex-shrink-0 border-r border-slate-200 overflow-hidden">
        <CareLeftPanel
          sources={sources}
          records={records}
          selectedId={selectedId}
          cpExecStore={cpExecStore}
          patientMrn={patientMrn}
          onSelect={handleSelect}
        />
      </div>
      <CarePlanWorkspace
        source={selectedSource}
        tasks={selectedTasks}
        onAdvance={handleAdvance}
        onSkip={handleSkip}
        onReset={handleReset}
        onNoteChange={handleNoteChange}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
}

// ─── Left panel — Goals ───────────────────────────────────────────────────────

function GoalsLeftPanel({ entry }: { entry: MultiEntry }) {
  const p = entry.patient;
  const [exp0, setExp0] = useState(false);
  const [exp1, setExp1] = useState(false);

  const mockRecords = [
    {
      date: "21 Feb 2025", range: "01 Jul 2025", doctor: "Dr. Asif Imam",
      goalCount: 3, notesCount: 2,
      titles: ["Control blood sugar levels", "Reduce blood pressure", "Improve medication adherence"],
    },
    {
      date: "14 Jan 2025", range: "01 Apr 2025", doctor: "Dr. Fatima Zahra",
      goalCount: 2, notesCount: 2,
      titles: ["Improve mobility post-surgery", "Achieve healthy weight range"],
    },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient Record</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <Collapsible title="Patient Info" defaultOpen={false}>
          {p ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5 text-xs">
              {[["Name", p.name], ["MRN", p.mrn], ["Gender", p.gender === "M" ? "Male" : "Female"], ["DOB", p.dob], ["Phone", p.phone]].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-slate-400">{l}</span>
                  <span className="font-semibold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-slate-400 italic">No patient on file</p>}
        </Collapsible>

        <Collapsible title="All Records" badge={mockRecords.length} defaultOpen>
          {mockRecords.map((rec, idx) => {
            const expanded = idx === 0 ? exp0 : exp1;
            const setExpanded = idx === 0 ? setExp0 : setExp1;
            return (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs mb-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-800 leading-tight flex-1">
                    {rec.goalCount} goal{rec.goalCount !== 1 ? "s" : ""} · {rec.notesCount} nurse note{rec.notesCount !== 1 ? "s" : ""}
                  </p>
                  <button
                    onClick={() => setExpanded(e => !e)}
                    className="text-[10px] font-bold text-[#4982CF] hover:underline flex-shrink-0 flex items-center gap-1">
                    {expanded ? <><ChevronUp className="h-3 w-3" /> Collapse</> : <><Maximize2 className="h-3 w-3" /> Expand</>}
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 justify-between mt-1.5">
                  <span>{rec.date} · Target: {rec.range}</span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><Target className="h-3 w-3" />Goals</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{rec.doctor}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">Active</span>
                  </div>
                </div>
                {expanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Goals</p>
                    {rec.titles.map((title, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600">
                        <Target className="h-3 w-3 text-pink-400 flex-shrink-0" />
                        {title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </Collapsible>
      </div>
    </div>
  );
}

// ─── Config-driven vitals form ────────────────────────────────────────────────

function VitalsFormVitalsOnly({ vitalValues, setVitalValues, configuredVitals }:
  { vitalValues: Record<string, string>; setVitalValues: (v: Record<string, string>) => void; configuredVitals: VitalConfig[] }) {

  const displayVitals = configuredVitals.filter(v => v.opd !== "skip" && v.id !== "pain");
  function setV(key: string, val: string) { setVitalValues({ ...vitalValues, [key]: val }); }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <Collapsible title="Patient Vitals" accent defaultOpen>
          <div className="space-y-3 pb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date:</label>
              <Input type="date" value={vitalValues["_date"] ?? ""} onChange={e => setV("_date", e.target.value)} className="h-8 text-sm" />
            </div>

            {/* Grid for pairs of non-BP vitals; BP gets full-width special row */}
            {(() => {
              const rows: React.ReactNode[] = [];
              let buffer: React.ReactNode[] = [];

              function flush() {
                if (buffer.length === 1) rows.push(<div key={rows.length}>{buffer[0]}</div>);
                else if (buffer.length === 2) rows.push(<div key={rows.length} className="grid grid-cols-2 gap-3">{buffer[0]}{buffer[1]}</div>);
                buffer = [];
              }

              displayVitals.forEach(v => {
                if (v.id === "bp") {
                  flush();
                  rows.push(
                    <div key="bp">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Blood Pressure {v.unit ? `(${v.unit})` : ""}:
                      </label>
                      <div className="flex items-center gap-2">
                        <Input value={vitalValues["bp_sys"] ?? ""} onChange={e => setV("bp_sys", e.target.value)} placeholder="Systolic" className="h-8 text-sm flex-1 min-w-0" />
                        <span className="text-slate-400 font-bold flex-shrink-0">/</span>
                        <Input value={vitalValues["bp_dia"] ?? ""} onChange={e => setV("bp_dia", e.target.value)} placeholder="Diastolic" className="h-8 text-sm flex-1 min-w-0" />
                        <Select value={vitalValues["bp_pos"] ?? ""} onValueChange={val => setV("bp_pos", val)}>
                          <SelectTrigger className="h-8 text-sm w-28 flex-shrink-0"><SelectValue placeholder="Position" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sitting">Sitting</SelectItem>
                            <SelectItem value="standing">Standing</SelectItem>
                            <SelectItem value="supine">Supine</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={vitalValues["bp_orth"] ?? ""} onValueChange={val => setV("bp_orth", val)}>
                          <SelectTrigger className="h-8 text-sm w-28 flex-shrink-0"><SelectValue placeholder="Orthostatic" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                } else {
                  const label = `${v.name}${v.unit ? ` (${v.unit})` : ""}`;
                  const isRequired = v.opd === "required";
                  buffer.push(
                    <div key={v.id}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        {label}{isRequired && <span className="text-rose-500 ml-0.5">*</span>}:
                      </label>
                      <Input
                        value={vitalValues[v.id] ?? ""}
                        onChange={e => setV(v.id, e.target.value)}
                        placeholder={`Enter ${v.name}`}
                        className="h-8 text-sm"
                        style={v.refMin || v.refMax ? { borderColor: `${v.color}40` } : undefined}
                      />
                      {(v.refMin || v.refMax) && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Ref: {v.refMin || "—"} – {v.refMax || "—"} {v.unit}
                        </p>
                      )}
                    </div>
                  );
                  if (buffer.length === 2) flush();
                }
              });
              flush();
              return rows;
            })()}
          </div>
        </Collapsible>

      </div>
    </div>
  );
}

// ─── Pain Score tab ────────────────────────────────────────────────────────────

function VitalsPainTab({ painScore, setPainScore, painConfig }:
  { painScore: number; setPainScore: (n: number) => void; painConfig: VitalConfig | undefined }) {
  const hidden = painConfig?.opd === "skip";
  if (hidden) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Pain Score is not configured for this visit type.
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
        Pain Score{painConfig?.opd === "required" ? <span className="text-rose-500 ml-0.5 normal-case tracking-normal font-normal"> *</span> : ""}
      </p>
      <div className="space-y-0">
        {PAIN_LEVELS.map(pl => (
          <label key={pl.level} className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-slate-50 rounded-lg px-1 -mx-1">
            <input type="radio" name="pain" checked={painScore === pl.level} onChange={() => setPainScore(pl.level)} className="mt-0.5 flex-shrink-0 accent-[#4982CF]" />
            <span className="text-sm text-slate-700 leading-snug">
              <span className="font-semibold text-slate-800">{pl.label}</span> ({pl.desc})
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Mental Health tab ─────────────────────────────────────────────────────────

function VitalsMentalTab({ mentalAnswers, setMentalAnswers }:
  { mentalAnswers: number[]; setMentalAnswers: (a: number[]) => void }) {
  const mentalTotal = mentalAnswers.reduce((s, v) => s + v, 0);
  function setMentalAnswer(qi: number, val: number) { const next = [...mentalAnswers]; next[qi] = val; setMentalAnswers(next); }
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Mental Health Screen (PHQ-4)</p>
      <p className="text-xs text-slate-600 mb-3">Over the last two weeks, how often have you been bothered by the following problems?</p>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-right py-2 px-3 font-medium text-slate-500 w-48"></th>
              {["Not at All", "Several Days", "More than half the days", "Nearly Every Day"].map(h => (
                <th key={h} className="py-2 px-2 font-semibold text-slate-600 text-center w-20 leading-tight">{h}</th>
              ))}
            </tr>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td className="text-right py-1.5 px-3 font-bold text-slate-600">Score:</td>
              {[1, 2, 3, 4].map(n => <td key={n} className="text-center py-1.5 px-2 font-bold text-slate-700">{n}</td>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MENTAL_QUESTIONS.map((q, qi) => (
              <tr key={qi} className="hover:bg-slate-50/70">
                <td className="text-right py-3 px-3 text-slate-600 leading-snug">{q}</td>
                {[1, 2, 3, 4].map(score => (
                  <td key={score} className="text-center py-3 px-2">
                    <input type="radio" name={`mental-${qi}`} checked={mentalAnswers[qi] === score} onChange={() => setMentalAnswer(qi, score)} className="accent-[#4982CF]" />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-slate-50 border-t border-slate-200">
              <td className="text-right py-2 px-3 font-bold text-slate-600">Total:</td>
              <td className="text-center py-2 px-2 font-bold text-[#4982CF] text-sm" colSpan={4}>{mentalTotal || "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Vitals Trends ────────────────────────────────────────────────────────────

function VitalsTrends() {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-slate-50/40">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p className="text-sm font-bold text-slate-800 mb-1">Patient Vitals</p>
        <p className="text-xs text-slate-400 mb-4">Pulse HR · Systolic BP · Temperature (last 7 visits)</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={TREND_VITALS} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="pulse" name="Pulse HR" stroke="#4982CF" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="systolic" name="Systolic BP" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="temp" name="Temp °C" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p className="text-sm font-bold text-slate-800 mb-1">Pain Score</p>
        <p className="text-xs text-slate-400 mb-4">Reported pain level (0 = No Pain, 10 = Worst)</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={TREND_PAIN} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} />
            <Line type="monotone" dataKey="score" name="Pain Score" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p className="text-sm font-bold text-slate-800 mb-1">Mental Health Screen</p>
        <p className="text-xs text-slate-400 mb-4">PHQ-4 total score over time (max 16)</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={TREND_MENTAL} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <YAxis domain={[0, 16]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} />
            <Line type="monotone" dataKey="total" name="Mental Health Score" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Conditional field visibility helper ─────────────────────────────────────

function isFieldVisible(
  fieldId: string,
  rules: ConditionalRule[],
  values: Record<string, string>,
): boolean {
  const controllingRules = rules.filter(r => r.showFieldIds.includes(fieldId));
  if (controllingRules.length === 0) return true;
  return controllingRules.some(rule => {
    if (!rule.triggerFieldId) return false;
    const val = values[rule.triggerFieldId] ?? "";
    return rule.triggerValues.length === 0 || rule.triggerValues.includes(val);
  });
}

// ─── Custom field renderer ────────────────────────────────────────────────────

function NursingFieldInput({ field, value, onChange }: {
  field: NursingField;
  value: string;
  onChange: (v: string) => void;
}) {
  const { type, label, placeholder, options, required } = field;
  const labelEl = (
    <label className="block text-xs font-semibold text-slate-600 mb-1">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}:
    </label>
  );

  if (type === "text" || type === "number") {
    return (
      <div>
        {labelEl}
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || `Enter ${label}`} type={type} className="h-8 text-sm" />
      </div>
    );
  }
  if (type === "date") {
    return (
      <div>
        {labelEl}
        <Input type="date" value={value} onChange={e => onChange(e.target.value)} className="h-8 text-sm" />
      </div>
    );
  }
  if (type === "textarea") {
    return (
      <div>
        {labelEl}
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${label}`}
          className="w-full px-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-ring h-20"
        />
      </div>
    );
  }
  if (type === "dropdown") {
    return (
      <div>
        {labelEl}
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
          <SelectContent>
            {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (type === "toggle" || type === "checkbox") {
    return (
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={value === "true"} onChange={e => onChange(e.target.checked ? "true" : "false")} className="h-4 w-4 accent-[#4982CF]" id={field.id} />
        <label htmlFor={field.id} className="text-sm text-slate-700 cursor-pointer">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
      </div>
    );
  }
  if (type === "multi-select") {
    const selected = value ? value.split(",").filter(Boolean) : [];
    function toggle(opt: string) {
      const next = selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt];
      onChange(next.join(","));
    }
    return (
      <div>
        {labelEl}
        <div className="flex flex-wrap gap-1.5">
          {options.map(opt => {
            const on = selected.includes(opt);
            return (
              <button key={opt} type="button" onClick={() => toggle(opt)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${on ? "bg-[#4982CF] text-white border-[#4982CF]" : "border-slate-200 text-slate-600 hover:border-[#4982CF]"}`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}

// ─── Custom component form entry ─────────────────────────────────────────────

function CustomComponentForm({ component, values, onChange, entryLayout, columns }: {
  component: NursingComponent;
  values: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  entryLayout?: "vertical" | "horizontal";
  columns?: 1 | 2 | 3 | 4;
}) {
  const enabledFields = component.fields.filter(f => f.enabled);
  const isHoriz = entryLayout === "horizontal";
  const cols = columns ?? 2;
  return (
    <div
      className={isHoriz ? "grid gap-3 items-start" : "space-y-3"}
      style={isHoriz ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}
    >
      {enabledFields.map(field => {
        if (!isFieldVisible(field.id, component.conditionalRules, values)) return null;
        return (
          <NursingFieldInput
            key={field.id}
            field={field}
            value={values[field.id] ?? ""}
            onChange={v => onChange({ ...values, [field.id]: v })}
          />
        );
      })}
      {enabledFields.length === 0 && (
        <p className="text-xs text-slate-400 italic col-span-full">No fields configured for this component.</p>
      )}
    </div>
  );
}

// ─── History tab content ──────────────────────────────────────────────────────

type HistoryEntryMap = Record<string, Record<string, string>[]>;

function HistoryTabContent({
  visitTypeId,
  initialTemplateId,
  initialData,
  initialSystemValues,
  onStateChange,
  onComplete,
}: {
  visitTypeId?: string;
  initialTemplateId?: string;
  initialData?: HistoryEntryMap;
  initialSystemValues?: Record<string, string>;
  onStateChange?: (templateId: string | null, templateName: string | null, data: HistoryEntryMap, systemValues: Record<string, string>) => void;
  onComplete?: (snapshot: { templateId: string; templateName: string; sections: { name: string; lines: string[] }[] }) => void;
}) {
  const { config } = useNursingConfig();
  const enabledTemplates = useMemo(() => config.templates.filter(t => t.enabled), [config.templates]);

  const activeTemplate = useMemo(() => {
    if (enabledTemplates.length === 0) return null;
    return enabledTemplates.find(t => t.id === initialTemplateId) ?? enabledTemplates[0];
  }, [enabledTemplates, initialTemplateId]);

  const [data, setData] = useState<HistoryEntryMap>(initialData ?? {});
  const [systemValues, setSystemValues] = useState<Record<string, string>>(initialSystemValues ?? {});

  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onStateChangeRef.current = onStateChange; });
  useEffect(() => {
    onStateChangeRef.current?.(activeTemplate?.id ?? null, activeTemplate?.name ?? null, data, systemValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTemplate?.id, data, systemValues]);

  const hasContent = useMemo(() => {
    const dataFilled = Object.values(data).some(entries =>
      entries.some(entry => Object.values(entry).some(v => v.trim() !== ""))
    );
    const sysFilled = Object.values(systemValues).some(v => v.trim() !== "");
    return dataFilled || sysFilled;
  }, [data, systemValues]);

  function getEntries(compId: string): Record<string, string>[] {
    return data[compId] ?? [{}];
  }
  function setEntry(compId: string, idx: number, values: Record<string, string>) {
    setData(prev => {
      const entries = [...(prev[compId] ?? [{}])];
      entries[idx] = values;
      return { ...prev, [compId]: entries };
    });
  }
  function addEntry(compId: string, limit: number | null) {
    setData(prev => {
      const entries = prev[compId] ?? [{}];
      if (limit !== null && entries.length >= limit) return prev;
      return { ...prev, [compId]: [...entries, {}] };
    });
  }
  function removeEntry(compId: string, idx: number) {
    setData(prev => {
      const entries = [...(prev[compId] ?? [{}])];
      if (entries.length <= 1) return prev;
      entries.splice(idx, 1);
      return { ...prev, [compId]: entries };
    });
  }

  function handleComplete() {
    if (!activeTemplate || !onComplete) return;
    const sections = activeTemplate.components.map(comp => {
      if (comp.type === "system") {
        const val = systemValues[comp.id] ?? "";
        return { name: comp.name, lines: val.trim() ? [val] : [] };
      }
      const entries = data[comp.id] ?? [{}];
      const lines: string[] = [];
      for (const entry of entries) {
        for (const field of comp.fields.filter(f => f.enabled)) {
          const val = entry[field.id];
          if (val && val.trim()) lines.push(`${field.label}: ${val}`);
        }
      }
      return { name: comp.name, lines };
    });
    onComplete({ templateId: activeTemplate.id, templateName: activeTemplate.name, sections });
  }

  if (enabledTemplates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 text-slate-400 gap-3">
        <ClipboardList className="h-10 w-10 opacity-30" />
        <p className="text-sm font-semibold">No history templates configured</p>
        <p className="text-xs">An admin can set up templates in Admin → Nursing History.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {activeTemplate && (
          <div className="space-y-3">
            {activeTemplate.components.map(comp => (
              <Collapsible key={comp.id} title={comp.name} defaultOpen>
                {comp.type === "system" ? (
                  <SystemComponentView
                    systemKey={comp.systemKey}
                    value={systemValues[comp.id] ?? ""}
                    onChange={v => setSystemValues(prev => ({ ...prev, [comp.id]: v }))}
                  />
                ) : (
                  <div className="pb-2">
                    {(() => {
                      const entries = getEntries(comp.id);
                      return (
                        <>
                          <div className="space-y-4">
                            {entries.map((entryVals, idx) => (
                              <div key={idx} className={comp.repeatable && entries.length > 1 ? "rounded-xl border border-slate-200 bg-slate-50/50 p-3 relative" : ""}>
                                {comp.repeatable && entries.length > 1 && (
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Entry {idx + 1}</span>
                                    <button onClick={() => removeEntry(comp.id, idx)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                                <CustomComponentForm
                                  component={comp}
                                  values={entryVals}
                                  onChange={v => setEntry(comp.id, idx, v)}
                                  entryLayout={comp.entryLayout}
                                  columns={comp.columns}
                                />
                              </div>
                            ))}
                          </div>
                          {comp.repeatable && (
                            <button
                              onClick={() => addEntry(comp.id, comp.repeatLimit)}
                              disabled={comp.repeatLimit !== null && entries.length >= comp.repeatLimit}
                              className="flex items-center gap-1.5 text-xs font-bold text-[#4982CF] hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity mt-3"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Entry{comp.repeatLimit !== null ? ` (${entries.length}/${comp.repeatLimit})` : ""}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </Collapsible>
            ))}
            {activeTemplate.components.length === 0 && (
              <p className="text-xs text-slate-400 italic px-1">No components in this template.</p>
            )}
          </div>
        )}
      </div>

      {onComplete && (
        <div className="flex-shrink-0 border-t border-slate-100 px-5 py-3">
          <button
            disabled={!hasContent}
            onClick={handleComplete}
            className="w-full py-2 rounded-xl bg-[#4982CF] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#3a6fb8] transition-colors"
          >
            Save &amp; Complete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── System component view ────────────────────────────────────────────────────

function SystemComponentView({ systemKey, value, onChange }: {
  systemKey?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const def = SYSTEM_COMPONENTS.find(c => c.key === systemKey);
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 mb-2">
      <div className="flex items-start gap-2 mb-2">
        <Activity className="h-3.5 w-3.5 text-[#4982CF] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-[#4982CF]">{def?.name ?? "System Component"}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{def?.desc ?? "Shared library data"}</p>
        </div>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`Enter ${def?.name ?? "notes"} here…`}
        className="w-full px-3 py-2 text-sm rounded-lg border border-blue-100 bg-white resize-none focus:outline-none focus:ring-1 focus:ring-[#4982CF] h-20"
      />
    </div>
  );
}

// ─── Procedure: Vitals Form ───────────────────────────────────────────────────

function ProcedureVitalsForm({ values, onChange }: { values: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const configuredVitals = useMemo(() => loadVitalsConfig(), []);
  const displayVitals = configuredVitals.filter(v => v.opd !== "skip" && v.id !== "pain");
  function setV(key: string, val: string) { onChange({ ...values, [key]: val }); }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Date:</label>
        <Input type="date" value={values["_date"] ?? ""} onChange={e => setV("_date", e.target.value)} className="h-8 text-sm" />
      </div>
      {displayVitals.map(v => {
        if (v.id === "bp") {
          return (
            <div key="bp">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Blood Pressure {v.unit ? `(${v.unit})` : ""}:</label>
              <div className="flex items-center gap-2">
                <Input value={values["bp_sys"] ?? ""} onChange={e => setV("bp_sys", e.target.value)} placeholder="Systolic" className="h-8 text-sm flex-1 min-w-0" />
                <span className="text-slate-400 font-bold flex-shrink-0">/</span>
                <Input value={values["bp_dia"] ?? ""} onChange={e => setV("bp_dia", e.target.value)} placeholder="Diastolic" className="h-8 text-sm flex-1 min-w-0" />
              </div>
            </div>
          );
        }
        const label = `${v.name}${v.unit ? ` (${v.unit})` : ""}`;
        return (
          <div key={v.id}>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {label}{v.opd === "required" && <span className="text-rose-500 ml-0.5">*</span>}:
            </label>
            <Input
              value={values[v.id] ?? ""}
              onChange={e => setV(v.id, e.target.value)}
              placeholder={`Enter ${v.name}`}
              className="h-8 text-sm"
              style={v.refMin || v.refMax ? { borderColor: `${v.color}40` } : undefined}
            />
            {(v.refMin || v.refMax) && (
              <p className="text-[10px] text-slate-400 mt-0.5">Ref: {v.refMin || "—"} – {v.refMax || "—"} {v.unit}</p>
            )}
          </div>
        );
      })}
      {displayVitals.length === 0 && (
        <p className="text-xs text-slate-400 italic">No vitals configured. Set up vitals in Admin → Nursing Vitals.</p>
      )}
    </div>
  );
}

// ─── Procedure: Medications Form ──────────────────────────────────────────────

interface MedRow { id: string; drug: string; dose: string; route: string; notes: string; }

function ProcedureMedicationsForm({ rows, onChange }: { rows: MedRow[]; onChange: (r: MedRow[]) => void }) {
  const ROUTES = ["IV","IM","SC","PO","SL","Topical","Inhalation","Intradermal","Other"];

  function addRow() {
    onChange([...rows, { id: `m-${Date.now()}`, drug: "", dose: "", route: "", notes: "" }]);
  }
  function removeRow(id: string) { onChange(rows.filter(r => r.id !== id)); }
  function updateRow(id: string, patch: Partial<MedRow>) {
    onChange(rows.map(r => r.id === id ? { ...r, ...patch } : r));
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-xs text-slate-400 italic text-center py-2">No medications added yet.</p>
      )}
      {rows.map((row, i) => (
        <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2.5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Medication {i + 1}</span>
            <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Drug Name *</label>
              <Input value={row.drug} onChange={e => updateRow(row.id, { drug: e.target.value })} placeholder="e.g. Metformin" className="h-8 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Dose</label>
              <Input value={row.dose} onChange={e => updateRow(row.id, { dose: e.target.value })} placeholder="e.g. 500 mg" className="h-8 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Route</label>
            <Select value={row.route} onValueChange={v => updateRow(row.id, { route: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select route…" /></SelectTrigger>
              <SelectContent>{ROUTES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Notes</label>
            <Input value={row.notes} onChange={e => updateRow(row.id, { notes: e.target.value })} placeholder="Optional notes…" className="h-8 text-sm" />
          </div>
        </div>
      ))}
      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs font-bold text-[#4982CF] hover:opacity-70 transition-opacity"
      >
        <Plus className="h-3.5 w-3.5" /> Add Medication
      </button>
    </div>
  );
}

// ─── Procedure: Consent Form ──────────────────────────────────────────────────

type ConsentStatus = "obtained" | "pending" | "declined";

interface ConsentData { status: ConsentStatus | ""; witness: string; date: string; notes: string; }

function ProcedureConsentForm({ data, onChange }: { data: ConsentData; onChange: (d: ConsentData) => void }) {
  const STATUSES: { key: ConsentStatus; label: string; color: string }[] = [
    { key: "obtained", label: "Obtained",  color: "bg-green-600 border-green-600 text-white" },
    { key: "pending",  label: "Pending",   color: "bg-amber-500 border-amber-500 text-white" },
    { key: "declined", label: "Declined",  color: "bg-rose-500 border-rose-500 text-white" },
  ];
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">Consent Status *</label>
        <div className="flex gap-2">
          {STATUSES.map(s => (
            <button
              key={s.key}
              onClick={() => onChange({ ...data, status: s.key })}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${
                data.status === s.key ? s.color : "border-slate-200 text-slate-500 bg-white hover:border-slate-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Witness Name</label>
        <Input value={data.witness} onChange={e => onChange({ ...data, witness: e.target.value })} placeholder="Enter witness name…" className="h-8 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Consent Date</label>
        <Input type="date" value={data.date} onChange={e => onChange({ ...data, date: e.target.value })} className="h-8 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Additional Notes</label>
        <textarea
          value={data.notes}
          onChange={e => onChange({ ...data, notes: e.target.value })}
          placeholder="Any relevant consent notes…"
          className="w-full px-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-ring h-16"
        />
      </div>
    </div>
  );
}

// ─── Procedure: Billing Form ──────────────────────────────────────────────────

interface BillingRow { id: string; name: string; qty: number; unitFee: number; }

function ProcedureBillingForm({ rows, onChange }: { rows: BillingRow[]; onChange: (r: BillingRow[]) => void }) {
  function addRow() {
    onChange([...rows, { id: `b-${Date.now()}`, name: "", qty: 1, unitFee: 0 }]);
  }
  function removeRow(id: string) { onChange(rows.filter(r => r.id !== id)); }
  function updateRow(id: string, patch: Partial<BillingRow>) {
    onChange(rows.map(r => r.id === id ? { ...r, ...patch } : r));
  }
  const grandTotal = rows.reduce((sum, r) => sum + r.qty * r.unitFee, 0);

  return (
    <div className="space-y-3">
      {rows.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-2 font-semibold text-slate-500">Procedure / Item</th>
                <th className="text-center px-3 py-2 font-semibold text-slate-500 w-16">Qty</th>
                <th className="text-right px-3 py-2 font-semibold text-slate-500 w-24">Unit Fee</th>
                <th className="text-right px-3 py-2 font-semibold text-slate-500 w-20">Total</th>
                <th className="w-8 px-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(row => (
                <tr key={row.id} className="bg-white">
                  <td className="px-3 py-2">
                    <Input value={row.name} onChange={e => updateRow(row.id, { name: e.target.value })} placeholder="Item name…" className="h-7 text-xs border-0 p-0 focus-visible:ring-0 shadow-none bg-transparent" />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number" min={1}
                      value={row.qty}
                      onChange={e => updateRow(row.id, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="h-7 text-xs text-center border-0 p-0 focus-visible:ring-0 shadow-none bg-transparent w-full"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number" min={0}
                      value={row.unitFee}
                      onChange={e => updateRow(row.id, { unitFee: parseFloat(e.target.value) || 0 })}
                      className="h-7 text-xs text-right border-0 p-0 focus-visible:ring-0 shadow-none bg-transparent w-full"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-700">
                    {(row.qty * row.unitFee).toLocaleString()}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td colSpan={3} className="px-3 py-2 text-xs font-bold text-slate-600 text-right">Grand Total</td>
                <td className="px-3 py-2 text-right">
                  <span className="text-sm font-black text-[#4982CF]">PKR {grandTotal.toLocaleString()}</span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {rows.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-4 text-xs text-slate-400">
          <DollarSign className="h-4 w-4 text-slate-300" />
          No billing items added yet.
        </div>
      )}
      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:opacity-70 transition-opacity"
      >
        <Plus className="h-3.5 w-3.5" /> Add Billing Item
      </button>
      {rows.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-[11px] text-amber-700">
          <Receipt className="h-3.5 w-3.5 flex-shrink-0" />
          Billing summary will be forwarded to the front desk after the procedure is saved.
        </div>
      )}
    </div>
  );
}

// ─── Procedure: System Component View ─────────────────────────────────────────

function ProcedureSystemComponentView({
  systemKey,
  vitalsValues, onVitalsChange,
  medRows, onMedChange,
  consentData, onConsentChange,
  billingRows, onBillingChange,
}: {
  systemKey?: string;
  vitalsValues: Record<string, string>;  onVitalsChange: (v: Record<string, string>) => void;
  medRows: MedRow[];                     onMedChange: (r: MedRow[]) => void;
  consentData: ConsentData;              onConsentChange: (d: ConsentData) => void;
  billingRows: BillingRow[];             onBillingChange: (r: BillingRow[]) => void;
}) {
  if (systemKey === "vitals") {
    return <ProcedureVitalsForm values={vitalsValues} onChange={onVitalsChange} />;
  }
  if (systemKey === "medications") {
    return <ProcedureMedicationsForm rows={medRows} onChange={onMedChange} />;
  }
  if (systemKey === "consent") {
    return <ProcedureConsentForm data={consentData} onChange={onConsentChange} />;
  }
  if (systemKey === "billing") {
    return <ProcedureBillingForm rows={billingRows} onChange={onBillingChange} />;
  }
  const def = PROCEDURE_SYSTEM_COMPONENTS.find(c => c.key === systemKey);
  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3">
      <p className="text-xs font-semibold text-violet-600">{def?.name ?? "System Component"}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{def?.desc ?? "Module not yet available."}</p>
    </div>
  );
}

// ─── Nursing Procedures — types & localStorage helpers ───────────────────────

const PROC_DRAFTS_KEY  = "ehr-proc-drafts-v1";
const PROC_RECORDS_KEY = "ehr-proc-records-v1";

interface ProcDraft {
  draftId:      string;
  templateId:   string;
  templateName: string;
  startedAt:    number;
  updatedAt:    number;
  vitalsValues: Record<string, string>;
  medRows:      MedRow[];
  consentData:  ConsentData;
  billingRows:  BillingRow[];
  customValues: Record<string, Record<string, string>[]>;
}

interface ProcRecord {
  recordId:       string;
  templateId:     string;
  templateName:   string;
  completedAt:    number;
  componentNames: string[];
  vitalsValues:   Record<string, string>;
  medRows:        MedRow[];
  consentData:    ConsentData;
  billingRows:    BillingRow[];
  customValues:   Record<string, Record<string, string>[]>;
}

function loadProcDrafts(): ProcDraft[] {
  try { const r = localStorage.getItem(PROC_DRAFTS_KEY); if (r) return JSON.parse(r) as ProcDraft[]; } catch { /**/ }
  return [];
}
function persistProcDrafts(d: ProcDraft[]) {
  try { localStorage.setItem(PROC_DRAFTS_KEY, JSON.stringify(d)); } catch { /**/ }
}
function loadProcRecords(): ProcRecord[] {
  try { const r = localStorage.getItem(PROC_RECORDS_KEY); if (r) return JSON.parse(r) as ProcRecord[]; } catch { /**/ }
  return [];
}
function persistProcRecords(r: ProcRecord[]) {
  try { localStorage.setItem(PROC_RECORDS_KEY, JSON.stringify(r)); } catch { /**/ }
}
function genProcDraftId() { return `pd-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }

// ─── Procedure Workspace ──────────────────────────────────────────────────────

function ProcedureWorkspace({
  activeDraft, activeTemplate, templates, showGateway,
  onStartNew, onSelectTemplate, onCancelGateway,
  onVitalsChange, onMedChange, onConsentChange, onBillingChange,
  onCustomChange, onAddCustomEntry, onRemoveCustomEntry, onComplete, onBackToDrafts,
}: {
  activeDraft:        ProcDraft | null;
  activeTemplate:     NursingProcedureTemplate | null;
  templates:          NursingProcedureTemplate[];
  showGateway:        boolean;
  onStartNew:         () => void;
  onSelectTemplate:   (id: string) => void;
  onCancelGateway:    () => void;
  onVitalsChange:     (v: Record<string, string>) => void;
  onMedChange:        (r: MedRow[]) => void;
  onConsentChange:    (d: ConsentData) => void;
  onBillingChange:    (r: BillingRow[]) => void;
  onCustomChange:     (compId: string, idx: number, vals: Record<string, string>) => void;
  onAddCustomEntry:   (compId: string, limit: number | null) => void;
  onRemoveCustomEntry:(compId: string, idx: number) => void;
  onComplete:         () => void;
  onBackToDrafts?:    () => void;
}) {
  if (templates.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Stethoscope className="h-10 w-10 opacity-30" />
        <p className="text-sm font-semibold text-slate-500">No procedure templates configured</p>
        <p className="text-xs text-center">An admin can set up templates in Admin → Nursing Procedures.</p>
      </div>
    );
  }

  if (showGateway) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
          <Stethoscope className="h-4 w-4 text-teal-600" />
          <span className="text-sm font-bold text-slate-700 flex-1">Select Procedure Template</span>
          {activeDraft && (
            <button
              onClick={onCancelGateway}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
          <p className="text-xs text-slate-400 mb-2">Choose a template to start a new nursing procedure. Progress auto-saves as you work.</p>
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => onSelectTemplate(t.id)}
              className="w-full text-left rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30 hover:shadow-sm transition-all p-4 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                  <Stethoscope className="h-5 w-5 text-teal-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t.components.length} component{t.components.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!activeDraft || !activeTemplate) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-16 w-16 rounded-2xl bg-teal-50 flex items-center justify-center">
          <Stethoscope className="h-8 w-8 text-teal-300" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-600">No active procedure</p>
          <p className="text-xs text-slate-400 mt-1">Start a new procedure or select one from the left panel.</p>
        </div>
        <button
          onClick={onStartNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Start New Procedure
        </button>
      </div>
    );
  }

  const draft    = activeDraft;
  const template = activeTemplate;

  function getEntries(compId: string): Record<string, string>[] {
    return draft.customValues[compId] ?? [{}];
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-100 bg-slate-50/50">
        {onBackToDrafts && (
          <button
            onClick={onBackToDrafts}
            className="flex items-center gap-1 px-5 pt-2 pb-0 text-[11px] font-semibold text-[#4982CF] hover:opacity-70 transition-opacity"
          >
            <ChevronDown className="h-3 w-3 rotate-90" />
            Back to drafts
          </button>
        )}
        <div className="flex items-center gap-3 px-5 py-2.5">
          <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{template.name}</p>
            <p className="text-[11px] text-slate-400">
              Started {new Date(draft.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Auto-saving
            </p>
          </div>
          <button
            onClick={onStartNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 text-xs font-bold hover:bg-teal-100 transition-colors flex-shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>
      </div>

      {/* Components */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {template.components.map(comp => (
          <Collapsible key={comp.id} title={comp.name} defaultOpen>
            {comp.type === "system" ? (
              <ProcedureSystemComponentView
                systemKey={comp.systemKey as string}
                vitalsValues={draft.vitalsValues}  onVitalsChange={onVitalsChange}
                medRows={draft.medRows}            onMedChange={onMedChange}
                consentData={draft.consentData}    onConsentChange={onConsentChange}
                billingRows={draft.billingRows}    onBillingChange={onBillingChange}
              />
            ) : (
              <div className="pb-2">
                {(() => {
                  const entries = getEntries(comp.id);
                  return (
                    <>
                      <div className="space-y-4">
                        {entries.map((entryVals, idx) => (
                          <div key={idx} className={comp.repeatable && entries.length > 1 ? "rounded-xl border border-slate-200 bg-slate-50/50 p-3 relative" : ""}>
                            {comp.repeatable && entries.length > 1 && (
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Entry {idx + 1}</span>
                                <button onClick={() => onRemoveCustomEntry(comp.id, idx)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                            <CustomComponentForm
                              component={comp}
                              values={entryVals}
                              onChange={v => onCustomChange(comp.id, idx, v)}
                              entryLayout={comp.entryLayout}
                              columns={comp.columns}
                            />
                          </div>
                        ))}
                      </div>
                      {comp.repeatable && (
                        <button
                          onClick={() => onAddCustomEntry(comp.id, comp.repeatLimit)}
                          disabled={comp.repeatLimit !== null && entries.length >= comp.repeatLimit}
                          className="flex items-center gap-1.5 text-xs font-bold text-[#4982CF] hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity mt-3"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Entry{comp.repeatLimit !== null ? ` (${entries.length}/${comp.repeatLimit})` : ""}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </Collapsible>
        ))}
        {template.components.length === 0 && (
          <p className="text-xs text-slate-400 italic px-1">No components in this template.</p>
        )}
      </div>

      {/* Save & Complete */}
      <div className="flex-shrink-0 border-t border-slate-200 px-5 py-3 bg-white">
        <button
          onClick={onComplete}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-bold transition-colors cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4" />
          Save &amp; Complete
        </button>
      </div>
    </div>
  );
}

// ─── Procedure Section — owns state, composes left + right ────────────────────

function ProcedureSection() {
  const { config } = useNursingConfig();
  const enabledTemplates = useMemo(
    () => config.procedureTemplates.filter(t => t.enabled),
    [config.procedureTemplates],
  );

  const [drafts,        setDrafts]        = useState<ProcDraft[]>(loadProcDrafts);
  const [records,       setRecords]       = useState<ProcRecord[]>(loadProcRecords);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [showGateway,   setShowGateway]   = useState(false);

  const activeDraft    = drafts.find(d => d.draftId === activeDraftId) ?? null;
  const activeTemplate = activeDraft
    ? (enabledTemplates.find(t => t.id === activeDraft.templateId) ?? null)
    : null;

  function patchDraft(draftId: string, patches: Partial<ProcDraft>) {
    setDrafts(prev => {
      const next = prev.map(d =>
        d.draftId === draftId ? { ...d, ...patches, updatedAt: Date.now() } : d,
      );
      persistProcDrafts(next);
      return next;
    });
  }

  function startNewProcedure(templateId: string) {
    const tmpl = enabledTemplates.find(t => t.id === templateId);
    if (!tmpl) return;
    const draft: ProcDraft = {
      draftId:      genProcDraftId(),
      templateId,
      templateName: tmpl.name,
      startedAt:    Date.now(),
      updatedAt:    Date.now(),
      vitalsValues: { _date: new Date().toISOString().slice(0, 10) },
      medRows:      [],
      consentData:  { status: "", witness: "", date: new Date().toISOString().slice(0, 10), notes: "" },
      billingRows:  [],
      customValues: {},
    };
    setDrafts(prev => { const next = [...prev, draft]; persistProcDrafts(next); return next; });
    setActiveDraftId(draft.draftId);
    setShowGateway(false);
  }

  function completeDraft(draftId: string) {
    const draft = drafts.find(d => d.draftId === draftId);
    if (!draft) return;
    const tmpl = enabledTemplates.find(t => t.id === draft.templateId);
    const record: ProcRecord = {
      recordId:       `pr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      templateId:     draft.templateId,
      templateName:   draft.templateName,
      completedAt:    Date.now(),
      componentNames: tmpl?.components.map(c => c.name) ?? [],
      vitalsValues:   draft.vitalsValues,
      medRows:        draft.medRows,
      consentData:    draft.consentData,
      billingRows:    draft.billingRows,
      customValues:   draft.customValues,
    };
    setDrafts(prev  => { const next = prev.filter(d => d.draftId !== draftId); persistProcDrafts(next);  return next; });
    setRecords(prev => { const next = [...prev, record];                        persistProcRecords(next); return next; });
    setActiveDraftId(null);
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-1/2 flex-shrink-0 border-r border-slate-200 overflow-hidden">
        <ProcedureLeftPanel
          drafts={drafts}
          records={records}
          activeDraftId={activeDraftId}
          onSelectDraft={id => { setActiveDraftId(id); setShowGateway(false); }}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <ProcedureWorkspace
          activeDraft={activeDraft}
          activeTemplate={activeTemplate}
          templates={enabledTemplates}
          showGateway={showGateway}
          onStartNew={() => setShowGateway(true)}
          onSelectTemplate={startNewProcedure}
          onCancelGateway={() => setShowGateway(false)}
          onVitalsChange={v  => activeDraftId && patchDraft(activeDraftId, { vitalsValues: v })}
          onMedChange={r     => activeDraftId && patchDraft(activeDraftId, { medRows: r })}
          onConsentChange={d => activeDraftId && patchDraft(activeDraftId, { consentData: d })}
          onBillingChange={r => activeDraftId && patchDraft(activeDraftId, { billingRows: r })}
          onCustomChange={(compId, idx, vals) => {
            if (!activeDraftId || !activeDraft) return;
            const entries = [...(activeDraft.customValues[compId] ?? [{}])];
            entries[idx] = vals;
            patchDraft(activeDraftId, { customValues: { ...activeDraft.customValues, [compId]: entries } });
          }}
          onAddCustomEntry={(compId, limit) => {
            if (!activeDraftId || !activeDraft) return;
            const entries = activeDraft.customValues[compId] ?? [{}];
            if (limit !== null && entries.length >= limit) return;
            patchDraft(activeDraftId, { customValues: { ...activeDraft.customValues, [compId]: [...entries, {}] } });
          }}
          onRemoveCustomEntry={(compId, idx) => {
            if (!activeDraftId || !activeDraft) return;
            const entries = [...(activeDraft.customValues[compId] ?? [{}])];
            if (entries.length <= 1) return;
            entries.splice(idx, 1);
            patchDraft(activeDraftId, { customValues: { ...activeDraft.customValues, [compId]: entries } });
          }}
          onComplete={() => activeDraftId && completeDraft(activeDraftId)}
          onBackToDrafts={activeDraftId ? () => setActiveDraftId(null) : undefined}
        />
      </div>
    </div>
  );
}

// ─── Triage draft persistence ─────────────────────────────────────────────────

const TRIAGE_DRAFTS_KEY = "ehr-triage-drafts";

interface TriageDraft {
  draftId: string;
  algoId: string;
  algoName: string;
  patientRef: string | null;
  patientName: string | null;
  totalSteps: number;
  stepIndex: number;
  answers: Record<string, StepAnswer>;
  startedAt: number;
  updatedAt: number;
}

function loadTriageDrafts(): TriageDraft[] {
  try {
    const raw = localStorage.getItem(TRIAGE_DRAFTS_KEY);
    if (raw) return JSON.parse(raw) as TriageDraft[];
  } catch { /* ignore */ }
  return [];
}

function persistTriageDrafts(drafts: TriageDraft[]): void {
  try { localStorage.setItem(TRIAGE_DRAFTS_KEY, JSON.stringify(drafts)); } catch { /* ignore */ }
}

function genTriageDraftId() { return `td-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }

// ─── Triage split panel ────────────────────────────────────────────────────────

function TriageSplitPanel({ patient }: { patient: Patient | null }) {
  // On mount: purge blank untouched drafts, then auto-resume the most recent real one
  const [drafts, setDrafts] = useState<TriageDraft[]>(() => {
    const all = loadTriageDrafts();
    const real = all.filter(d => d.stepIndex > 0 || Object.keys(d.answers).length > 0);
    if (real.length !== all.length) persistTriageDrafts(real);
    return real;
  });
  const [activeDraftId, setActiveDraftId] = useState<string | null>(() => {
    const all = loadTriageDrafts().filter(d => d.stepIndex > 0 || Object.keys(d.answers).length > 0);
    if (all.length === 0) return null;
    return [...all].sort((a, b) => b.updatedAt - a.updatedAt)[0].draftId;
  });
  const [completedSessions, setCompletedSessions] = useState<TriageSession[]>(loadSessions);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const activeDraft = drafts.find(d => d.draftId === activeDraftId) ?? null;

  function mutateDrafts(fn: (prev: TriageDraft[]) => TriageDraft[]) {
    setDrafts(prev => {
      const next = fn(prev);
      persistTriageDrafts(next);
      return next;
    });
  }

  function handleAlgoSelected(algoId: string, algoName: string, totalSteps: number) {
    const draftId = genTriageDraftId();
    const draft: TriageDraft = {
      draftId, algoId, algoName,
      patientRef: patient?.mrn ?? null,
      patientName: patient?.name ?? null,
      totalSteps, stepIndex: 0, answers: {},
      startedAt: Date.now(), updatedAt: Date.now(),
    };
    mutateDrafts(prev => [...prev, draft]);
    setActiveDraftId(draftId);
  }

  function handleDraftChange(algoId: string, stepIndex: number, answers: Record<string, StepAnswer>) {
    if (!activeDraftId) return;
    mutateDrafts(prev => prev.map(d =>
      d.draftId === activeDraftId
        ? { ...d, algoId, stepIndex, answers, updatedAt: Date.now() }
        : d
    ));
  }

  function discardDraft(draftId: string) {
    mutateDrafts(prev => prev.filter(d => d.draftId !== draftId));
    if (activeDraftId === draftId) setActiveDraftId(null);
  }

  function handleFinishTriage() {
    if (activeDraftId) {
      mutateDrafts(prev => prev.filter(d => d.draftId !== activeDraftId));
    }
    setActiveDraftId(null);
    setCompletedSessions(loadSessions());
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Left panel ── */}
      <div className="w-1/2 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto bg-white">

        {/* Required Actions header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 flex-1">Required Actions</span>
          {drafts.length > 0 && (
            <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5 leading-none">
              {drafts.length}
            </span>
          )}
        </div>

        <div className="px-3 py-3 space-y-2">
          {drafts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-6 flex flex-col items-center gap-1.5 text-center">
              <AlertCircle className="h-4 w-4 text-slate-300" />
              <p className="text-xs text-slate-400">No active triage sessions</p>
            </div>
          ) : drafts.map(d => {
            const pct = d.totalSteps > 1 ? Math.round((d.stepIndex / (d.totalSteps - 1)) * 100) : 0;
            const active = activeDraftId === d.draftId;
            return (
              <div
                key={d.draftId}
                className={`rounded-xl border transition-all ${
                  active
                    ? "bg-[#4982CF]/8 border-[#4982CF]/40 shadow-sm ring-1 ring-[#4982CF]/20"
                    : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <button
                  onClick={() => setActiveDraftId(d.draftId)}
                  className="w-full text-left p-3.5 pr-2"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-[#4982CF]/15" : "bg-red-50"}`}>
                      <AlertCircle className={`h-4 w-4 ${active ? "text-[#4982CF]" : "text-red-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{d.algoName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{d.patientName ?? "Walk-in"}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#4982CF] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 tabular-nums flex-shrink-0">
                          Step {d.stepIndex + 1}/{d.totalSteps}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); discardDraft(d.draftId); }}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0 mt-0.5"
                      title="Discard draft"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* All Records header */}
        <div className="sticky top-0 z-10 bg-white border-t border-b border-slate-100 px-4 py-3 flex items-center gap-2 mt-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 flex-1">All Records</span>
          {completedSessions.length > 0 && (
            <span className="text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 rounded-full px-2 py-0.5 leading-none">
              {completedSessions.length}
            </span>
          )}
        </div>

        <div className="px-3 py-3 space-y-2">
          {completedSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-6 flex flex-col items-center gap-1.5 text-center">
              <CheckCircle2 className="h-4 w-4 text-slate-300" />
              <p className="text-xs text-slate-400">No completed sessions</p>
            </div>
          ) : [...completedSessions].reverse().map(s => {
            const cfg = OUTCOME_CFG[s.outcomeType];
            const expanded = expandedRecord === s.id;
            return (
              <div key={s.id} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                <button
                  onClick={() => setExpandedRecord(expanded ? null : s.id)}
                  className="w-full text-left p-3.5 flex items-start gap-3 hover:bg-white transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{s.algoName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{s.patientName ?? "Walk-in"}</p>
                    <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold rounded-full px-2 py-0.5 ${cfg.bg} ${cfg.color}`}>
                      <span>{cfg.emoji}</span><span>{cfg.label}</span>
                    </span>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
                {expanded && (
                  <div className="border-t border-slate-200 bg-white px-4 py-3 space-y-3">
                    {s.stepAnswers.map(sa => (
                      <div key={sa.stepId}>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{sa.stepTitle}</p>
                        <p className="text-xs text-slate-700 mt-0.5">{sa.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        {activeDraftId && (
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium truncate">{activeDraft?.algoName}</span>
            <button
              onClick={() => setActiveDraftId(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#4982CF] hover:text-[#3a6fb8] transition-colors flex-shrink-0 ml-3"
            >
              <Plus className="h-3 w-3" /> New Triage
            </button>
          </div>
        )}
        <TriageRunner
          key={activeDraftId ?? "picker"}
          patient={patient}
          initialAlgoId={activeDraft?.algoId}
          initialStepIndex={activeDraft?.stepIndex}
          initialAnswers={activeDraft?.answers}
          onAlgoSelected={handleAlgoSelected}
          onDraftChange={handleDraftChange}
          onFinishTriage={handleFinishTriage}
        />
      </div>
    </div>
  );
}

// ─── History draft persistence ────────────────────────────────────────────────

const HISTORY_DRAFTS_KEY = "ehr-history-drafts";
const HISTORY_RECORDS_KEY = "ehr-history-records";

interface HistoryDraft {
  draftId: string;
  templateId: string | null;
  templateName: string | null;
  patientRef: string | null;
  patientName: string | null;
  data: HistoryEntryMap;
  systemValues: Record<string, string>;
  startedAt: number;
  updatedAt: number;
}

interface HistoryRecord {
  recordId: string;
  templateId: string;
  templateName: string;
  patientRef: string | null;
  patientName: string | null;
  sections: { name: string; lines: string[] }[];
  completedAt: number;
}

function isHistoryDraftBlank(d: HistoryDraft): boolean {
  const dataFilled = Object.values(d.data).some(entries =>
    entries.some(entry => Object.values(entry).some(v => v.trim() !== ""))
  );
  const sysFilled = Object.values(d.systemValues).some(v => v.trim() !== "");
  return !dataFilled && !sysFilled;
}

function loadHistoryDrafts(): HistoryDraft[] {
  try {
    const raw = localStorage.getItem(HISTORY_DRAFTS_KEY);
    if (raw) return JSON.parse(raw) as HistoryDraft[];
  } catch { /* ignore */ }
  return [];
}

function persistHistoryDrafts(drafts: HistoryDraft[]): void {
  try { localStorage.setItem(HISTORY_DRAFTS_KEY, JSON.stringify(drafts)); } catch { /* ignore */ }
}

function loadHistoryRecords(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_RECORDS_KEY);
    if (raw) return JSON.parse(raw) as HistoryRecord[];
  } catch { /* ignore */ }
  return [];
}

function persistHistoryRecords(records: HistoryRecord[]): void {
  try { localStorage.setItem(HISTORY_RECORDS_KEY, JSON.stringify(records)); } catch { /* ignore */ }
}

function genHistoryDraftId() { return `hd-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }

// ─── History split panel ──────────────────────────────────────────────────────

function HistorySplitPanel({ patient, visitTypeId }: { patient: Patient | null; visitTypeId?: string }) {
  const { config } = useNursingConfig();
  const enabledTemplates = useMemo(() => config.templates.filter(t => t.enabled), [config.templates]);

  const autoMappedTemplateId = useMemo(() => {
    if (!visitTypeId) return null;
    const mappedId = config.visitTypeMappings?.[visitTypeId];
    if (!mappedId) return null;
    return enabledTemplates.find(t => t.id === mappedId) ? mappedId : null;
  }, [visitTypeId, config.visitTypeMappings, enabledTemplates]);

  const [drafts, setDrafts] = useState<HistoryDraft[]>(() => {
    const all = loadHistoryDrafts();
    const real = all.filter(d => !isHistoryDraftBlank(d));
    if (real.length !== all.length) persistHistoryDrafts(real);
    return real;
  });

  const [activeDraftId, setActiveDraftId] = useState<string | null>(() => {
    const real = loadHistoryDrafts().filter(d => !isHistoryDraftBlank(d));
    if (real.length === 0) return null;
    return [...real].sort((a, b) => b.updatedAt - a.updatedAt)[0].draftId;
  });

  // pendingTemplateId: set when the user has picked a template from the picker
  // but hasn't yet created a draft (no content typed). null = show picker.
  // Auto-skip picker when only 1 template or visitTypeId maps to one.
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(() => {
    const realDrafts = loadHistoryDrafts().filter(d => !isHistoryDraftBlank(d));
    if (realDrafts.length > 0) return null; // will resume a draft, no picker needed
    const templates = config.templates.filter(t => t.enabled);
    if (templates.length === 1) return templates[0].id;
    if (visitTypeId) {
      const mappedId = config.visitTypeMappings?.[visitTypeId];
      if (mappedId && templates.find(t => t.id === mappedId)) return mappedId;
    }
    return null;
  });

  const [records, setRecords] = useState<HistoryRecord[]>(loadHistoryRecords);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const activeDraft = drafts.find(d => d.draftId === activeDraftId) ?? null;

  // Returns the template that should be pre-selected when returning to the picker,
  // skipping the picker entirely when there is only one choice.
  function computeDefaultTemplateId(): string | null {
    if (enabledTemplates.length === 1) return enabledTemplates[0].id;
    if (autoMappedTemplateId) return autoMappedTemplateId;
    return null;
  }

  function mutateDrafts(fn: (prev: HistoryDraft[]) => HistoryDraft[]) {
    setDrafts(prev => {
      const next = fn(prev);
      persistHistoryDrafts(next);
      return next;
    });
  }

  const creatingDraftRef = useRef(false);

  useEffect(() => {
    if (activeDraftId) creatingDraftRef.current = false;
  }, [activeDraftId]);

  function handleStateChange(
    templateId: string | null,
    templateName: string | null,
    data: HistoryEntryMap,
    systemValues: Record<string, string>,
  ) {
    const currentId = activeDraftId;

    if (!currentId) {
      // Only create a new draft when at least one field has content
      const dataFilled = Object.values(data).some(entries =>
        entries.some(entry => Object.values(entry).some(v => v.trim() !== ""))
      );
      const sysFilled = Object.values(systemValues).some(v => v.trim() !== "");
      if (!dataFilled && !sysFilled) return;

      if (creatingDraftRef.current) return;
      creatingDraftRef.current = true;
      const draftId = genHistoryDraftId();
      const draft: HistoryDraft = {
        draftId, templateId, templateName,
        patientRef: patient?.mrn ?? null,
        patientName: patient?.name ?? null,
        data, systemValues,
        startedAt: Date.now(), updatedAt: Date.now(),
      };
      mutateDrafts(prev => [...prev, draft]);
      setActiveDraftId(draftId);
      setPendingTemplateId(null);
      return;
    }

    // Always persist every change to an existing draft, even if fields are cleared
    mutateDrafts(prev => prev.map(d =>
      d.draftId === currentId
        ? { ...d, templateId, templateName, data, systemValues, updatedAt: Date.now() }
        : d
    ));
  }

  function handleComplete(snapshot: { templateId: string; templateName: string; sections: { name: string; lines: string[] }[] }) {
    const record: HistoryRecord = {
      recordId: `hr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      templateId: snapshot.templateId,
      templateName: snapshot.templateName,
      patientRef: patient?.mrn ?? null,
      patientName: patient?.name ?? null,
      sections: snapshot.sections,
      completedAt: Date.now(),
    };
    setRecords(prev => {
      const next = [...prev, record];
      persistHistoryRecords(next);
      return next;
    });
    if (activeDraftId) {
      mutateDrafts(prev => prev.filter(d => d.draftId !== activeDraftId));
    }
    setActiveDraftId(null);
    setPendingTemplateId(computeDefaultTemplateId());
  }

  function discardDraft(draftId: string) {
    mutateDrafts(prev => prev.filter(d => d.draftId !== draftId));
    if (activeDraftId === draftId) {
      setActiveDraftId(null);
      setPendingTemplateId(computeDefaultTemplateId());
    }
  }

  // Resolved template id for the right panel (draft takes priority over pending)
  const resolvedTemplateId = activeDraft?.templateId ?? pendingTemplateId ?? null;
  const showPicker = resolvedTemplateId === null;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Left panel ── */}
      <div className="w-1/2 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto bg-white">

        {/* Required Actions header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 flex-1">Required Actions</span>
          {drafts.length > 0 && (
            <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5 leading-none">
              {drafts.length}
            </span>
          )}
        </div>

        <div className="px-3 py-3 space-y-2">
          {drafts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-6 flex flex-col items-center gap-1.5 text-center">
              <ClipboardList className="h-4 w-4 text-slate-300" />
              <p className="text-xs text-slate-400">No active history records</p>
            </div>
          ) : drafts.map(d => {
            const active = activeDraftId === d.draftId;
            const age = Date.now() - d.updatedAt;
            const ageLabel = age < 60_000
              ? "just now"
              : age < 3_600_000
                ? `${Math.floor(age / 60_000)}m ago`
                : `${Math.floor(age / 3_600_000)}h ago`;
            return (
              <div
                key={d.draftId}
                className={`rounded-xl border transition-all ${
                  active
                    ? "bg-amber-50/60 border-amber-300/60 shadow-sm ring-1 ring-amber-200/60"
                    : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <button
                  onClick={() => { setActiveDraftId(d.draftId); setPendingTemplateId(null); }}
                  className="w-full text-left p-3.5 pr-2"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-amber-100" : "bg-amber-50"}`}>
                      <ClipboardList className={`h-4 w-4 ${active ? "text-amber-600" : "text-amber-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-snug truncate">
                        {d.templateName ?? "History Draft"}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{d.patientName ?? "Walk-in"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{ageLabel}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); discardDraft(d.draftId); }}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0 mt-0.5"
                      title="Discard draft"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* All Records header */}
        <div className="sticky top-0 z-10 bg-white border-t border-b border-slate-100 px-4 py-3 flex items-center gap-2 mt-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 flex-1">All Records</span>
          {records.length > 0 && (
            <span className="text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 rounded-full px-2 py-0.5 leading-none">
              {records.length}
            </span>
          )}
        </div>

        <div className="px-3 py-3 space-y-2">
          {records.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-6 flex flex-col items-center gap-1.5 text-center">
              <CheckCircle2 className="h-4 w-4 text-slate-300" />
              <p className="text-xs text-slate-400">No completed records</p>
            </div>
          ) : [...records].reverse().map(r => {
            const expanded = expandedRecord === r.recordId;
            const filledSections = r.sections.filter(s => s.lines.length > 0);
            return (
              <div key={r.recordId} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                <button
                  onClick={() => setExpandedRecord(expanded ? null : r.recordId)}
                  className="w-full text-left p-3.5 flex items-start gap-3 hover:bg-white transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{r.templateName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{r.patientName ?? "Walk-in"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(r.completedAt).toLocaleDateString()} · {filledSections.length} section{filledSections.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
                {expanded && (
                  <div className="border-t border-slate-200 bg-white px-4 py-3 space-y-3">
                    {filledSections.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No content recorded.</p>
                    ) : filledSections.map(s => (
                      <div key={s.name}>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{s.name}</p>
                        {s.lines.map((line, i) => (
                          <p key={i} className="text-xs text-slate-700 mt-0.5">{line}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardList className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-xs text-slate-600 font-medium truncate">
              {activeDraft
                ? (activeDraft.templateName ?? "History Draft")
                : pendingTemplateId
                  ? (enabledTemplates.find(t => t.id === pendingTemplateId)?.name ?? "New Record")
                  : "Select Template"}
            </span>
          </div>
          {(activeDraftId || pendingTemplateId) && (
            <button
              onClick={() => { setActiveDraftId(null); setPendingTemplateId(computeDefaultTemplateId()); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#4982CF] hover:text-[#3a6fb8] transition-colors flex-shrink-0 ml-3"
            >
              <Plus className="h-3 w-3" /> New Record
            </button>
          )}
        </div>

        {showPicker ? (
          /* ── Template picker ── */
          <div className="flex-1 overflow-y-auto px-5 py-6">
            {enabledTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <ClipboardList className="h-10 w-10 opacity-30" />
                <p className="text-sm font-semibold">No history templates configured</p>
                <p className="text-xs">An admin can set up templates in Admin → Nursing History.</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-700 mb-1">Select a template to begin</p>
                <p className="text-xs text-slate-400 mb-5">Choose the type of history record you want to document.</p>
                <div className="space-y-3">
                  {enabledTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setPendingTemplateId(t.id)}
                      className={`w-full text-left rounded-xl border-2 p-4 transition-all hover:border-[#4982CF] hover:bg-[#4982CF]/5 hover:shadow-sm group ${
                        t.id === autoMappedTemplateId
                          ? "border-[#4982CF] bg-[#4982CF]/5"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          t.id === autoMappedTemplateId ? "bg-[#4982CF]/15" : "bg-amber-50 group-hover:bg-[#4982CF]/10"
                        }`}>
                          <ClipboardList className={`h-5 w-5 ${
                            t.id === autoMappedTemplateId ? "text-[#4982CF]" : "text-amber-500 group-hover:text-[#4982CF]"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                            {t.id === autoMappedTemplateId && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#4982CF]/10 text-[#4982CF]">Auto</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {t.components.length} section{t.components.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-[#4982CF] -rotate-90 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          /* ── History form ── */
          <HistoryTabContent
            key={activeDraftId ?? pendingTemplateId ?? "new"}
            visitTypeId={visitTypeId}
            initialTemplateId={resolvedTemplateId ?? undefined}
            initialData={activeDraft?.data}
            initialSystemValues={activeDraft?.systemValues}
            onStateChange={handleStateChange}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}

// ─── Vitals draft / record persistence ────────────────────────────────────────

interface VitalsDraft {
  draftId: string;
  vitalValues: Record<string, string>;
  painScore: number;
  mentalAnswers: number[];
  vitalsTab: "vitals" | "pain" | "mental";
  patientRef: string | null;
  patientName: string | null;
  startedAt: number;
  updatedAt: number;
}

interface VitalsRecord {
  recordId: string;
  vitalValues: Record<string, string>;
  painScore: number;
  mentalAnswers: number[];
  patientRef: string | null;
  patientName: string | null;
  completedAt: number;
}

function blankVitalValues(): Record<string, string> {
  return { _date: new Date().toISOString().slice(0, 10) };
}

function isVitalsDraftBlank(d: VitalsDraft): boolean {
  const vals = { ...d.vitalValues };
  delete vals._date;
  return Object.values(vals).every(v => !v.trim()) && d.painScore < 0 && d.mentalAnswers.every(a => a === 0);
}

function loadVitalsDrafts(): VitalsDraft[] {
  try { const raw = localStorage.getItem("ehr-vitals-drafts"); if (raw) return JSON.parse(raw) as VitalsDraft[]; } catch { /**/ }
  return [];
}
function persistVitalsDrafts(drafts: VitalsDraft[]): void {
  try { localStorage.setItem("ehr-vitals-drafts", JSON.stringify(drafts)); } catch { /**/ }
}
function loadVitalsRecords(): VitalsRecord[] {
  try { const raw = localStorage.getItem("ehr-vitals-records"); if (raw) return JSON.parse(raw) as VitalsRecord[]; } catch { /**/ }
  return [];
}
function persistVitalsRecords(records: VitalsRecord[]): void {
  try { localStorage.setItem("ehr-vitals-records", JSON.stringify(records)); } catch { /**/ }
}
function genVitalsDraftId(): string { return `vd-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }

// ─── Vitals split panel (fullscreen drawer) ───────────────────────────────────

function VitalsPanel({ entry, onClose, onSave, initialCategory = "vitals" }: { entry: MultiEntry; onClose: () => void; onSave: () => void; initialCategory?: NurseCategory }) {
  const [showTrends, setShowTrends] = useState(false);
  const configuredVitals = useMemo(() => loadVitalsConfig(), []);
  const [fullscreen, setFullscreen]       = useState(false);
  const [activeCategory, setActiveCategory] = useState<NurseCategory>(initialCategory);
  const [showConfirm, setShowConfirm]     = useState(false);

  // ── Vitals draft state ──────────────────────────────────────────────────────
  const [vitalsDrafts, setVitalsDrafts] = useState<VitalsDraft[]>(() => {
    const all = loadVitalsDrafts();
    const real = all.filter(d => !isVitalsDraftBlank(d));
    if (real.length !== all.length) persistVitalsDrafts(real);
    return real;
  });
  const [activeDraftId, setActiveDraftId] = useState<string | null>(() => {
    const real = loadVitalsDrafts().filter(d => !isVitalsDraftBlank(d));
    if (real.length === 0) return null;
    return [...real].sort((a, b) => b.updatedAt - a.updatedAt)[0].draftId;
  });
  const [vitalsRecords, setVitalsRecords] = useState<VitalsRecord[]>(loadVitalsRecords);

  const activeDraft = vitalsDrafts.find(d => d.draftId === activeDraftId) ?? null;

  // Form state — initialised from most-recent draft on mount, or blank
  const [vitalsTab, setVitalsTab]         = useState<"vitals" | "pain" | "mental">(activeDraft?.vitalsTab ?? "vitals");
  const [vitalValues, setVitalValues]     = useState<Record<string, string>>(activeDraft?.vitalValues ?? blankVitalValues());
  const [painScore, setPainScore]         = useState<number>(activeDraft?.painScore ?? -1);
  const [mentalAnswers, setMentalAnswers] = useState<number[]>(activeDraft?.mentalAnswers ?? [0, 0, 0, 0]);

  // Keep a ref so the auto-save effect always sees the current activeDraftId
  const activeDraftIdRef = useRef<string | null>(activeDraftId);
  activeDraftIdRef.current = activeDraftId;
  const creatingDraftRef = useRef(false);

  useEffect(() => {
    if (activeDraftId) creatingDraftRef.current = false;
  }, [activeDraftId]);

  function mutateDrafts(fn: (prev: VitalsDraft[]) => VitalsDraft[]) {
    setVitalsDrafts(prev => {
      const next = fn(prev);
      persistVitalsDrafts(next);
      return next;
    });
  }

  // Auto-save: create or update the active draft whenever any form value changes
  useEffect(() => {
    const draftId = activeDraftIdRef.current;
    if (!draftId) {
      // Only create a draft once there is at least one filled value
      const vals = { ...vitalValues };
      delete vals._date;
      const hasFilled = Object.values(vals).some(v => v.trim() !== "") || painScore >= 0 || mentalAnswers.some(a => a > 0);
      if (!hasFilled) return;
      if (creatingDraftRef.current) return;
      creatingDraftRef.current = true;
      const id = genVitalsDraftId();
      const draft: VitalsDraft = {
        draftId: id, vitalValues, painScore, mentalAnswers, vitalsTab,
        patientRef: entry.patient?.mrn ?? null,
        patientName: entry.patient?.name ?? null,
        startedAt: Date.now(), updatedAt: Date.now(),
      };
      mutateDrafts(prev => [...prev, draft]);
      setActiveDraftId(id);
      return;
    }
    mutateDrafts(prev => prev.map(d =>
      d.draftId === draftId
        ? { ...d, vitalValues, painScore, mentalAnswers, vitalsTab, updatedAt: Date.now() }
        : d
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vitalValues, painScore, mentalAnswers, vitalsTab]);

  function resumeDraft(draftId: string) {
    const draft = vitalsDrafts.find(d => d.draftId === draftId);
    if (!draft) return;
    setActiveDraftId(draftId);
    setVitalValues(draft.vitalValues);
    setPainScore(draft.painScore);
    setMentalAnswers(draft.mentalAnswers);
    setVitalsTab(draft.vitalsTab);
  }

  function discardVitalsDraft(draftId: string) {
    mutateDrafts(prev => prev.filter(d => d.draftId !== draftId));
    if (activeDraftId === draftId) {
      setActiveDraftId(null);
      setVitalValues(blankVitalValues());
      setPainScore(-1);
      setMentalAnswers([0, 0, 0, 0]);
      setVitalsTab("vitals");
      creatingDraftRef.current = false;
    }
  }

  function handleVitalsComplete() {
    // Guard: only complete if at least one value has been entered
    const vals = { ...vitalValues };
    delete vals._date;
    const hasData = Object.values(vals).some(v => v.trim() !== "") || painScore >= 0 || mentalAnswers.some(a => a > 0);
    if (!hasData) return;

    const record: VitalsRecord = {
      recordId: `vr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      vitalValues, painScore, mentalAnswers,
      patientRef: entry.patient?.mrn ?? null,
      patientName: entry.patient?.name ?? null,
      completedAt: Date.now(),
    };
    setVitalsRecords(prev => {
      const next = [...prev, record];
      persistVitalsRecords(next);
      return next;
    });
    if (activeDraftId) {
      mutateDrafts(prev => prev.filter(d => d.draftId !== activeDraftId));
    }
    setActiveDraftId(null);
    setVitalValues(blankVitalValues());
    setPainScore(-1);
    setMentalAnswers([0, 0, 0, 0]);
    setVitalsTab("vitals");
    creatingDraftRef.current = false;
  }
  // ── End vitals draft state ──────────────────────────────────────────────────

  const { goals, execState, updateGoalNote } = useNursingCareTasks(entry.id);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col transition-all duration-300 ease-in-out border-l border-slate-200 ${fullscreen ? "w-full" : "w-[80%]"}`}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex items-center border-b border-slate-200 bg-white">
          <div className="px-5 py-3 border-r border-slate-100 flex-shrink-0">
            <p className="text-sm font-bold text-slate-900">Patient Vitals</p>
          </div>
          <div className="flex-1 flex items-center overflow-x-auto px-2 gap-0.5">
            {CATEGORY_NAV_LABELS.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeCategory === cat.id ? "border-[#4982CF] text-[#4982CF]" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 flex-shrink-0">
            <Button
              onClick={() => setShowConfirm(true)}
              className="h-8 px-4 text-xs font-bold bg-[#4982CF] hover:bg-[#3a6fb8] text-white gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Save
            </Button>
            <div className="w-px h-5 bg-slate-200" />
            <button onClick={() => setFullscreen(f => !f)}
              className="flex items-center gap-1.5 h-8 px-2.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span>{fullscreen ? "Exit Full" : "Full Screen"}</span>
            </button>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── BODY ───────────────────────────────────────────────────────── */}
        {activeCategory === "vitals" ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Left panel */}
            <div className="w-1/2 flex-shrink-0 border-r border-slate-200 overflow-hidden">
              <VitalsLeftPanel
                drafts={vitalsDrafts}
                records={vitalsRecords}
                activeDraftId={activeDraftId}
                configuredVitals={configuredVitals}
                onResumeDraft={resumeDraft}
                onDiscardDraft={discardVitalsDraft}
              />
            </div>
            {/* Right panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Sub-header */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 min-w-0">
                  <Activity className="h-4 w-4 text-[#4982CF] flex-shrink-0" />
                  <span className="text-xs text-slate-600 font-medium">Patient Vitals</span>
                </div>
                {(activeDraftId !== null || vitalsDrafts.length === 0) && (
                  <button
                    onClick={() => {
                      setActiveDraftId(null);
                      setVitalValues(blankVitalValues());
                      setPainScore(-1);
                      setMentalAnswers([0, 0, 0, 0]);
                      setVitalsTab("vitals");
                      creatingDraftRef.current = false;
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#4982CF] hover:text-[#3a6fb8] transition-colors flex-shrink-0 ml-3"
                  >
                    <Plus className="h-3 w-3" /> New Vitals Entry
                  </button>
                )}
              </div>
              {/* Tab toolbar */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-2 border-b border-slate-100 bg-white">
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shadow-sm flex-shrink-0">
                  {(["vitals", "pain", "mental"] as const).map((tab, i) => {
                    const labels = { vitals: "Vitals", pain: "Pain Score", mental: "Mental Health" };
                    return (
                      <button
                        key={tab}
                        onClick={() => { setVitalsTab(tab); if (tab !== "vitals") setShowTrends(false); }}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${i > 0 ? "border-l border-slate-200" : ""} ${vitalsTab === tab ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>
                {vitalsTab === "vitals" && (
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shadow-sm flex-shrink-0">
                    <button
                      onClick={() => setShowTrends(false)}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors ${!showTrends ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                      Form
                    </button>
                    <button
                      onClick={() => setShowTrends(true)}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${showTrends ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                      <TrendingUp className="h-3 w-3" /> Trends
                    </button>
                  </div>
                )}
              </div>
              {vitalsTab === "vitals" && showTrends && <VitalsTrends />}
              {vitalsTab === "vitals" && !showTrends && (
                <VitalsFormVitalsOnly
                  vitalValues={vitalValues}
                  setVitalValues={setVitalValues}
                  configuredVitals={configuredVitals}
                />
              )}
              {vitalsTab === "pain" && (
                <VitalsPainTab
                  painScore={painScore}
                  setPainScore={setPainScore}
                  painConfig={configuredVitals.find(v => v.id === "pain")}
                />
              )}
              {vitalsTab === "mental" && (
                <VitalsMentalTab
                  mentalAnswers={mentalAnswers}
                  setMentalAnswers={setMentalAnswers}
                />
              )}
              {/* Bottom action bar */}
              <div className="flex-shrink-0 border-t border-slate-200 px-5 py-3 bg-white">
                <button
                  onClick={handleVitalsComplete}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[#4982CF] hover:bg-[#3a6fb8] text-white text-sm font-bold transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" /> Save &amp; Complete
                </button>
              </div>
            </div>
          </div>
        ) : activeCategory === "history" ? (
          <HistorySplitPanel patient={entry.patient} visitTypeId={entry.visitTypeId} />
        ) : activeCategory === "procedures" ? (
          <ProcedureSection />
        ) : activeCategory === "care-plan" ? (
          <CarePlanSection patientMrn={entry.patient?.mrn ?? null} />
        ) : activeCategory === "goals" ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/2 flex-shrink-0 border-r border-slate-200 overflow-hidden">
              <GoalsLeftPanel entry={entry} />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-sm font-bold text-slate-700">Patient Goals</span>
              </div>
              <PatientGoalsTab
                goals={goals}
                goalNotes={execState.goals}
                onNoteChange={updateGoalNote}
              />
            </div>
          </div>
        ) : activeCategory === "triage" ? (
          <TriageSplitPanel patient={entry.patient} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-10">
            <div>
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
                {CATEGORIES.find(c => c.id === activeCategory)?.icon}
              </div>
              <p className="text-sm font-semibold text-slate-600">{CATEGORIES.find(c => c.id === activeCategory)?.label}</p>
              <p className="text-xs text-slate-400 mt-1">This section is not yet configured.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── CONFIRM DIALOG ─────────────────────────────────────────────── */}
      {showConfirm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="h-1.5 w-full bg-[#4982CF]" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-[#4982CF]" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Save Records?</p>
                    <p className="text-xs text-slate-500 mt-0.5">Token {entry.tokenNumber}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  All recorded information will be saved and the patient will be moved to the <span className="font-semibold text-slate-800">next step</span> in the queue.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => { setShowConfirm(false); onSave(); }}
                    className="flex-1 bg-[#4982CF] hover:bg-[#3a6fb8] text-white font-bold h-10">
                    Yes, Save &amp; Move
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 border-slate-200 text-slate-600 font-semibold h-10">
                    No, Go Back
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Nursing overview drawer (patient info + category cards) ──────────────────

function NursingDrawer({ entry, onClose, onSave }: { entry: MultiEntry; onClose: () => void; onSave: () => void }) {
  const [activeCategory, setActiveCategory] = useState<NurseCategory | null>(null);
  const p = entry.patient;

  if (activeCategory) return <VitalsPanel entry={entry} onClose={onClose} onSave={onSave} initialCategory={activeCategory} />;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col w-[40%] min-w-[480px] border-l border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900">Patient Details</p>
            <p className="text-xs text-slate-400 mt-0.5">Nursing Station · Vitals Desk 1</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-[#4982CF]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-lg font-black text-[#4982CF] leading-none">{entry.tokenNumber}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#4982CF] font-bold">Vitals Step</span>
                </div>
                {p ? (
                  <><p className="text-sm font-bold text-slate-900">{p.name}</p><p className="text-xs text-slate-500">{p.mrn} · {p.gender === "M" ? "Male" : "Female"}</p></>
                ) : <p className="text-sm text-slate-400 italic">Walk-in / No MR</p>}
              </div>
            </div>
            {p && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[["Height", "168 cm"], ["Weight", "72 kg"], ["Last Visit", "Feb 2025"]].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-400">{label}</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-5 py-4 border-b border-slate-100 space-y-3">
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <div className="flex items-center gap-2 mb-1"><AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" /><p className="text-xs font-bold text-amber-800">Alerts</p></div>
              <p className="text-xs text-amber-700">Diabetic patient — check blood sugar before vitals recording.</p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
              <div className="flex items-center gap-2 mb-1"><Heart className="h-4 w-4 text-rose-600 flex-shrink-0" /><p className="text-xs font-bold text-rose-800">Allergies</p></div>
              <p className="text-xs text-rose-700">Penicillin · Sulfa drugs</p>
            </div>
          </div>
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Assessment Categories</p>
            <div className="grid grid-cols-2 gap-2.5">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-xl border ${cat.bg} px-4 py-3.5 text-left flex items-center gap-3 hover:shadow-sm transition-all group`}>
                  <span className={`flex-shrink-0 ${cat.color}`}>{cat.icon}</span>
                  <span className={`text-sm font-semibold ${cat.color} leading-tight`}>{cat.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 ml-auto group-hover:text-slate-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function NursingUser() {
  const { queue, nurseCall, nurseTimerExpire, nurseAtCounter, nurseCompleteVitals, nurseSkip, nurseRecall } = useMultiStepQueue();
  const [tick, setTick]             = useState(0);
  const [drawerEntry, setDrawerEntry] = useState<MultiEntry | null>(null);
  const [showSkipped, setShowSkipped] = useState(false);
  const [toast, setToast]           = useState<string | null>(null);

  useEffect(() => { const t = setInterval(() => setTick(p => p + 1), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    queue.forEach(e => {
      if (!e.callTimestamp) return;
      if (Date.now() - e.callTimestamp >= CALL_WINDOW_SECS * 1000) {
        nurseTimerExpire(e.id);
        if (e.callCount >= MAX_CALLS) showToastMsg(`Token ${e.tokenNumber} auto-skipped after ${MAX_CALLS} calls`);
      }
    });
  }, [tick]);

  function showToastMsg(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500); }

  const nurseQueue     = queue.filter(e => e.step === 2 && e.visitTypeId === "vt-1" && e.status !== "completed" && !e.skipped).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const skippedQueue   = queue.filter(e => e.step === 2 && e.visitTypeId === "vt-1" && e.skipped);
  const atCounterEntry = nurseQueue.find(e => e.status === "called") ?? null;
  const activeCallEntry = nurseQueue.find(e => e.callTimestamp !== null && getSecsLeft(e.callTimestamp) > 0) ?? null;
  const [fifoLock] = useState<boolean>(() => { try { const v = localStorage.getItem("ehr-fifo-lock"); return v === null ? true : (JSON.parse(v) as boolean); } catch { return true; } });
  const baseCanCall    = !atCounterEntry && !activeCallEntry;
  const waitingTokens  = nurseQueue.filter(e => e.status === "waiting" && !e.callTimestamp && e.id !== atCounterEntry?.id);

  const secsLeft  = getSecsLeft(activeCallEntry?.callTimestamp ?? null);
  const timerPct  = (secsLeft / CALL_WINDOW_SECS) * 100;

  function handleCall(id: string) { nurseCall(id); showToastMsg("Token called — 30 second window started"); }
  function handleNursingConfirm(entry: MultiEntry) {
    nurseAtCounter(entry.id);
    setDrawerEntry({ ...entry, status: "called" });
  }
  function handleSkip(id: string) { nurseSkip(id); showToastMsg("Token skipped"); }
  function handleRecall(id: string, tokenNum: string) { nurseRecall(id); showToastMsg(`Token ${tokenNum} recalled to queue`); }

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      <QueueAppHeader />

      {/* Blue counter bar */}
      <div className="flex items-center gap-3 bg-[#4982CF] px-6 py-2.5 flex-shrink-0">
        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
        <p className="text-xs font-bold text-white/90 uppercase tracking-widest">Nursing Counter · Main Branch — Lahore</p>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-white/70">Step:</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">Vitals · 2 of 5</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Queue Stats</p>
            {[
              { label: "At Counter", value: nurseQueue.filter(e => e.status === "called").length, color: "text-[#4982CF]", bg: "bg-blue-50 border-blue-200"   },
              { label: "Waiting",    value: waitingTokens.length,                                 color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
              { label: "Skipped",    value: skippedQueue.length,                                  color: "text-red-600",   bg: "bg-red-50 border-red-200"     },
            ].map(s => (
              <div key={s.label} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 mb-2 ${s.bg}`}>
                <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Assigned Queues</p>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-sm font-bold text-rose-700">Vitals Queue</p>
              <p className="text-xs text-slate-500 mt-0.5">Step 2 tokens · No billing</p>
            </div>
          </div>
        </div>

        {/* ── MAIN AREA ──────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* AT COUNTER */}
            {atCounterEntry && !activeCallEntry && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-[#4982CF] animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#4982CF]">Now At Counter</p>
                </div>
                <div className="rounded-2xl border-2 border-[#4982CF]/30 bg-white shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-[#4982CF]" />
                  <div className="flex items-center gap-5 px-6 py-5">
                    <div className="flex-shrink-0 text-center">
                      <div className="rounded-2xl border-2 border-[#4982CF]/50 bg-blue-50 px-6 py-3">
                        <p className="font-mono font-black text-2xl text-[#4982CF]">{atCounterEntry.tokenNumber}</p>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">Call #{atCounterEntry.callCount}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      {atCounterEntry.patient
                        ? <><p className="text-base font-black text-slate-900 leading-tight">{atCounterEntry.patient.name}</p><p className="text-xs text-slate-400">{atCounterEntry.patient.mrn} · {atCounterEntry.patient.phone}</p></>
                        : <p className="text-base font-black text-slate-500">Walk-in Patient</p>}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs font-semibold text-rose-600">At Nursing Counter</span>
                        <span className="text-slate-300">·</span>
                        <Clock className="h-3 w-3 text-slate-300" />
                        <span className="text-xs text-slate-400">{timeAgo(atCounterEntry.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button className="h-10 px-5 text-sm font-bold gap-2 bg-rose-500 hover:bg-rose-600 text-white"
                        onClick={() => handleNursingConfirm(atCounterEntry)}>
                        <Heart className="h-4 w-4" /> Nursing
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CALL WINDOW ACTIVE */}
            {activeCallEntry && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Call Window Active</p>
                </div>
                <div className="rounded-2xl border-2 border-amber-200 bg-white shadow-sm overflow-hidden">
                  <div className="h-1.5 w-full bg-slate-100 relative">
                    <div className="h-full transition-all duration-1000" style={{ width: `${timerPct}%`, backgroundColor: secsLeft < 10 ? "#ef4444" : "#f59e0b" }} />
                  </div>
                  <div className="flex items-center gap-5 px-6 py-5">
                    <div className="flex-shrink-0 text-center">
                      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-6 py-3">
                        <p className="font-mono font-black text-2xl text-amber-700">{activeCallEntry.tokenNumber}</p>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">Attempt {activeCallEntry.callCount}/{MAX_CALLS}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      {activeCallEntry.patient
                        ? <><p className="text-base font-black text-slate-900 leading-tight">{activeCallEntry.patient.name}</p><p className="text-xs text-slate-400">{activeCallEntry.patient.mrn}</p></>
                        : <p className="text-base font-black text-slate-500">Walk-in Patient</p>}
                      <p className="text-sm font-semibold text-amber-600 mt-1">Window expires in {secsLeft}s</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button className="h-10 px-5 text-sm font-bold gap-2 bg-rose-500 hover:bg-rose-600 text-white"
                        onClick={() => handleNursingConfirm(activeCallEntry)}>
                        <Heart className="h-4 w-4" /> Nursing
                      </Button>
                      <Button variant="outline" size="sm" className="border-red-200 text-red-500 hover:bg-red-50 text-xs"
                        onClick={() => handleSkip(activeCallEntry.id)}>
                        <SkipForward className="h-3 w-3 mr-1" /> Skip Token
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WAITING QUEUE */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                  Waiting in Queue · {waitingTokens.length}
                </p>
              </div>
              {waitingTokens.length === 0 && !atCounterEntry && !activeCallEntry && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <CheckCircle2 className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">Queue is empty</p>
                  <p className="text-xs">Patients will appear here after Front Desk registration.</p>
                </div>
              )}
              <div className="space-y-2">
                {waitingTokens.map((entry, idx) => {
                  const canCall = fifoLock ? idx === 0 && baseCanCall : baseCanCall;
                  return (
                    <div key={entry.id} className={`flex items-center gap-4 rounded-xl border px-4 py-3 bg-white transition-all ${canCall ? "border-slate-300 shadow-sm" : "border-slate-100 opacity-70"}`}>
                      <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-black bg-slate-100 text-slate-500">{idx + 1}</div>
                      <div className="font-mono font-black text-sm text-slate-700 flex-shrink-0">{entry.tokenNumber}</div>
                      <div className="flex-1 min-w-0">
                        {entry.patient
                          ? <p className="text-sm font-bold text-slate-800 truncate">{entry.patient.name}<span className="ml-2 text-xs font-normal text-slate-400">{entry.patient.mrn}</span></p>
                          : <p className="text-sm font-bold text-slate-500">Walk-in Patient</p>}
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(entry.createdAt)}</span>
                      {canCall ? (
                        <Button size="sm" className="h-8 px-4 text-xs font-bold flex-shrink-0 gap-1.5" style={{ backgroundColor: "#4982CF" }}
                          onClick={() => handleCall(entry.id)}>
                          <PhoneCall className="h-3.5 w-3.5" /> Call
                        </Button>
                      ) : (
                        <div className="h-8 px-4 flex items-center text-[10px] font-semibold text-slate-400 flex-shrink-0">{fifoLock ? "Locked" : "Busy"}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SKIPPED PANEL */}
          {skippedQueue.length > 0 && (
            <>
              <button onClick={() => setShowSkipped(v => !v)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-red-200 bg-white shadow-lg px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-all z-10">
                <AlertCircle className="h-3.5 w-3.5" /> Skipped Tokens ({skippedQueue.length})
                <ChevronUp className={`h-3.5 w-3.5 transition-transform ${showSkipped ? "rotate-180" : ""}`} />
              </button>
              {showSkipped && (
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-red-200 rounded-t-3xl shadow-2xl z-20 max-h-72 flex flex-col">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-500" /><p className="text-sm font-bold text-slate-900">Skipped Tokens</p></div>
                    <button onClick={() => setShowSkipped(false)} className="h-7 w-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {skippedQueue.map(entry => (
                      <div key={entry.id} className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                        <div className="font-mono font-black text-sm text-red-700 flex-shrink-0">{entry.tokenNumber}</div>
                        <div className="flex-1 min-w-0">
                          {entry.patient ? <p className="text-sm font-semibold text-slate-800">{entry.patient.name}</p> : <p className="text-sm font-semibold text-slate-500">Walk-in</p>}
                          <p className="text-[10px] text-slate-400">{timeAgo(entry.createdAt)}</p>
                        </div>
                        <span className="text-xs font-bold text-red-500 flex-shrink-0">{entry.callCount}/{MAX_CALLS} calls</span>
                        <Button variant="outline" size="sm" className="h-7 px-3 text-xs border-red-300 text-red-600 hover:bg-red-100 flex-shrink-0"
                          onClick={() => handleRecall(entry.id, entry.tokenNumber)}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Recall
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* NURSING DRAWER */}
      {drawerEntry && (
        <NursingDrawer
          entry={drawerEntry}
          onClose={() => setDrawerEntry(null)}
          onSave={() => {
            nurseCompleteVitals(drawerEntry.id);
            setDrawerEntry(null);
            showToastMsg(`${drawerEntry.tokenNumber} vitals saved — advanced to next step`);
          }}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold shadow-xl animate-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}
