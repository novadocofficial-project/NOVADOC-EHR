import { useState, useEffect, useMemo, useRef } from "react";
import {
  X, ChevronRight, ChevronLeft, ChevronDown, AlertCircle, Heart, Activity,
  ClipboardList, Stethoscope, Target, CheckCircle2, Check, FileText,
  Maximize2, Minimize2, Plus, Trash2, Pill, Receipt, ShieldCheck,
  DollarSign, Layers, SkipForward, RotateCcw,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Appointment } from "@/hooks/useAppointments";
import { loadVitalsConfig, type VitalConfig } from "@/pages/SoapConfigModule";
import {
  useNursingConfig,
  SYSTEM_COMPONENTS,
  PROCEDURE_SYSTEM_COMPONENTS,
  type NursingField,
  type NursingComponent,
  type NursingProcedureTemplate,
  type ProcedureSystemComponentKey,
  type ConditionalRule,
} from "@/hooks/useNursingConfig";
import { TriageRunner, loadSessionsFromKey, APPT_SESSIONS_KEY, OUTCOME_CFG, type StepAnswer, type TriageSession } from "@/pages/TriageRunner";
import { SOAP_DUMMY } from "@/data/soapDummy";
import type { SignedRecord } from "@/pages/SoapNotePage";
import { getHealthEdDocs } from "@/pages/HealthEdSection";

// ─── Category types ───────────────────────────────────────────────────────────

export type NurseCategory = "triage" | "history" | "vitals" | "care-plan" | "procedures" | "goals";

const CATEGORY_NAV_LABELS: { id: NurseCategory; label: string }[] = [
  { id: "triage", label: "Triage" }, { id: "history", label: "History" },
  { id: "vitals", label: "Vital Signs" }, { id: "care-plan", label: "Care Plan" },
  { id: "procedures", label: "Nursing Procedures" }, { id: "goals", label: "Goals" },
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

// ─── localStorage key constants (appt- namespace) ─────────────────────────────

const APPT_VITALS_DRAFTS_KEY   = "appt-vitals-drafts";
const APPT_VITALS_RECORDS_KEY  = "appt-vitals-records";
const APPT_HISTORY_DRAFTS_KEY  = "appt-history-drafts";
const APPT_HISTORY_RECORDS_KEY = "appt-history-records";
const APPT_PROC_DRAFTS_KEY     = "appt-proc-drafts-v1";
const APPT_PROC_RECORDS_KEY    = "appt-proc-records-v1";
const APPT_CAREPLAN_RECORDS_KEY = "appt-careplan-records";
const APPT_CP_EXEC_KEY         = "appt-cp-exec-v2";
const APPT_GOAL_DRAFTS_KEY     = "appt-goal-drafts-v1";
const APPT_TRIAGE_DRAFTS_KEY   = "appt-triage-drafts";
const SOAP_SIGNED_PREFIX       = "soap_signed_";

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

// ─── Conditional field visibility ─────────────────────────────────────────────

function isFieldVisible(fieldId: string, rules: ConditionalRule[], values: Record<string, string>): boolean {
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
  field: NursingField; value: string; onChange: (v: string) => void;
}) {
  const { type, label, placeholder, options, required } = field;
  const labelEl = (
    <label className="block text-xs font-semibold text-slate-600 mb-1">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}:
    </label>
  );

  if (type === "text" || type === "number") {
    return (
      <div>{labelEl}
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || `Enter ${label}`} type={type} className="h-8 text-sm" />
      </div>
    );
  }
  if (type === "date") {
    return <div>{labelEl}<Input type="date" value={value} onChange={e => onChange(e.target.value)} className="h-8 text-sm" /></div>;
  }
  if (type === "textarea") {
    return (
      <div>{labelEl}
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || `Enter ${label}`}
          className="w-full px-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-ring h-20" />
      </div>
    );
  }
  if (type === "dropdown") {
    return (
      <div>{labelEl}
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={placeholder || `Select ${label}`} /></SelectTrigger>
          <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
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
      <div>{labelEl}
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

// ─── Custom component form ────────────────────────────────────────────────────

function CustomComponentForm({ component, values, onChange, entryLayout, columns }: {
  component: NursingComponent; values: Record<string, string>; onChange: (v: Record<string, string>) => void;
  entryLayout?: "vertical" | "horizontal"; columns?: 1 | 2 | 3 | 4;
}) {
  const enabledFields = component.fields.filter(f => f.enabled);
  const isHoriz = entryLayout === "horizontal";
  const cols = columns ?? 2;
  return (
    <div className={isHoriz ? "grid gap-3 items-start" : "space-y-3"} style={isHoriz ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}>
      {enabledFields.map(field => {
        if (!isFieldVisible(field.id, component.conditionalRules, values)) return null;
        return <NursingFieldInput key={field.id} field={field} value={values[field.id] ?? ""} onChange={v => onChange({ ...values, [field.id]: v })} />;
      })}
      {enabledFields.length === 0 && <p className="text-xs text-slate-400 italic col-span-full">No fields configured for this component.</p>}
    </div>
  );
}

// ─── System component view (history) ─────────────────────────────────────────

function SystemComponentView({ systemKey, value, onChange }: { systemKey?: string; value: string; onChange: (v: string) => void }) {
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
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={`Enter ${def?.name ?? "notes"} here…`}
        className="w-full px-3 py-2 text-sm rounded-lg border border-blue-100 bg-white resize-none focus:outline-none focus:ring-1 focus:ring-[#4982CF] h-20" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VITALS SECTION
// ══════════════════════════════════════════════════════════════════════════════

interface VitalsDraft {
  draftId: string; vitalValues: Record<string, string>; painScore: number;
  mentalAnswers: number[]; vitalsTab: "vitals" | "pain" | "mental" | "trends";
  patientRef: string | null; patientName: string | null; startedAt: number; updatedAt: number;
}
interface VitalsRecord {
  recordId: string; vitalValues: Record<string, string>; painScore: number;
  mentalAnswers: number[]; patientRef: string | null; patientName: string | null; completedAt: number;
  apptId?: string;
}

function blankVitalValues(): Record<string, string> { return { _date: new Date().toISOString().slice(0, 10) }; }
function isVitalsDraftBlank(d: VitalsDraft): boolean {
  const vals = { ...d.vitalValues }; delete vals._date;
  return Object.values(vals).every(v => !v.trim()) && d.painScore < 0 && d.mentalAnswers.every(a => a === 0);
}
function loadApptVitalsDrafts(): VitalsDraft[] {
  try { const raw = localStorage.getItem(APPT_VITALS_DRAFTS_KEY); if (raw) return JSON.parse(raw) as VitalsDraft[]; } catch { /**/ }
  return [];
}
function persistApptVitalsDrafts(drafts: VitalsDraft[]): void {
  try { localStorage.setItem(APPT_VITALS_DRAFTS_KEY, JSON.stringify(drafts)); } catch { /**/ }
}
function loadApptVitalsRecords(): VitalsRecord[] {
  try { const raw = localStorage.getItem(APPT_VITALS_RECORDS_KEY); if (raw) return JSON.parse(raw) as VitalsRecord[]; } catch { /**/ }
  return [];
}
function persistApptVitalsRecords(records: VitalsRecord[]): void {
  try { localStorage.setItem(APPT_VITALS_RECORDS_KEY, JSON.stringify(records)); } catch { /**/ }
}
function genApptVitalsDraftId(): string { return `avd-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }

function VitalsLeftPanel({ drafts, records, activeDraftId, configuredVitals, onResumeDraft, onDiscardDraft }: {
  drafts: VitalsDraft[]; records: VitalsRecord[]; activeDraftId: string | null;
  configuredVitals: VitalConfig[]; onResumeDraft: (draftId: string) => void; onDiscardDraft: (draftId: string) => void;
}) {
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  type VitalsRow = { label: string; value: string; refMin: string; refMax: string };
  function vitalsRowsFromValues(vitalValues: Record<string, string>): VitalsRow[] {
    return configuredVitals.filter(v => v.opd !== "skip").flatMap(v => {
      if (v.id === "bp") {
        const sys = vitalValues["bp_sys"] ?? ""; const dia = vitalValues["bp_dia"] ?? "";
        if (!sys && !dia) return [];
        return [{ label: v.name, value: `${sys || "—"}/${dia || "—"} ${v.unit}`, refMin: v.refMin, refMax: v.refMax }];
      }
      const val = vitalValues[v.id] ?? "";
      if (!val.trim()) return [];
      return [{ label: `${v.name}${v.unit ? ` (${v.unit})` : ""}`, value: val, refMin: v.refMin, refMax: v.refMax }];
    });
  }
  function vitalStatus(row: VitalsRow): "low" | "normal" | "high" | "none" {
    if (!row.refMin && !row.refMax) return "none";
    if (row.refMin.includes("/") || row.value.includes("/")) {
      const rawNum = row.value.split(" ")[0];
      const [sysVal, diaVal] = rawNum.split("/").map(Number);
      const [sysMin, diaMin] = row.refMin.split("/").map(Number);
      const [sysMax, diaMax] = row.refMax.split("/").map(Number);
      if (isNaN(sysVal) || isNaN(diaVal)) return "none";
      if (sysVal < sysMin || diaVal < diaMin) return "low";
      if (sysVal > sysMax || diaVal > diaMax) return "high";
      return "normal";
    }
    const val = parseFloat(row.value);
    if (isNaN(val)) return "none";
    const min = row.refMin ? parseFloat(row.refMin) : NaN;
    const max = row.refMax ? parseFloat(row.refMax) : NaN;
    if (!isNaN(min) && val < min) return "low";
    if (!isNaN(max) && val > max) return "high";
    return "normal";
  }
  const STATUS_VALUE_CLS: Record<ReturnType<typeof vitalStatus>, string> = {
    normal: "text-green-600",
    low:    "text-amber-600",
    high:   "text-red-600",
    none:   "text-slate-800",
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-2">
        <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-700 flex-1">Required Actions</span>
        {drafts.length > 0 && <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5 leading-none">{drafts.length}</span>}
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
          const ageLabel = age < 60_000 ? "just now" : age < 3_600_000 ? `${Math.floor(age / 60_000)}m ago` : `${Math.floor(age / 3_600_000)}h ago`;
          return (
            <div key={d.draftId} className={`rounded-xl border transition-all ${active ? "bg-amber-50/60 border-amber-300/60 shadow-sm ring-1 ring-amber-200/60" : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"}`}>
              <button onClick={() => onResumeDraft(d.draftId)} className="w-full text-left p-3.5 pr-2">
                <div className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-blue-100" : "bg-blue-50"}`}>
                    <Activity className={`h-4 w-4 ${active ? "text-[#4982CF]" : "text-blue-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{d.patientName ?? "Walk-in"} — Vital Signs</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{d.patientRef ?? "No MRN"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{ageLabel}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); onDiscardDraft(d.draftId); }}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0 mt-0.5">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </button>
            </div>
          );
        })}
      </div>
      <div className="sticky top-0 z-10 bg-white border-t border-b border-slate-100 px-4 py-3 flex items-center gap-2 mt-1">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-700 flex-1">All Records</span>
        {records.length > 0 && <span className="text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 rounded-full px-2 py-0.5 leading-none">{records.length}</span>}
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
              <button onClick={() => setExpandedRecord(expanded ? null : r.recordId)}
                className="w-full text-left p-3.5 flex items-start gap-3 hover:bg-white transition-colors">
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{r.patientName ?? "Walk-in"} — Vital Signs</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{r.patientRef ?? "No MRN"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(r.completedAt).toLocaleDateString()} · {vitalsRows.length} reading{vitalsRows.length !== 1 ? "s" : ""}</p>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded && (
                <div className="border-t border-slate-200 bg-white px-4 py-3 space-y-3">
                  {vitalsRows.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Vital Signs</p>
                      <div className="rounded-lg overflow-hidden border border-slate-100">
                        {vitalsRows.map((row, i) => {
                          const status = vitalStatus(row);
                          const rangeParts: string[] = [];
                          if (row.refMin) rangeParts.push(`Low < ${row.refMin}`);
                          if (row.refMin && row.refMax) rangeParts.push(`Normal ${row.refMin}–${row.refMax}`);
                          if (row.refMax) rangeParts.push(`High > ${row.refMax}`);
                          return (
                            <div key={row.label} className={`px-2.5 py-1.5 ${i % 2 === 0 ? "bg-blue-50" : "bg-white"}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">{row.label}</span>
                                <span className={`text-xs font-semibold ${STATUS_VALUE_CLS[status]}`}>{row.value}</span>
                              </div>
                              {rangeParts.length > 0 && (
                                <p className="text-[10px] text-slate-400 mt-0.5">{rangeParts.join(" · ")}</p>
                              )}
                            </div>
                          );
                        })}
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

function VitalsFormVitalsOnly({ vitalValues, setVitalValues, configuredVitals }:
  { vitalValues: Record<string, string>; setVitalValues: (v: Record<string, string>) => void; configuredVitals: VitalConfig[] }) {
  const displayVitals = configuredVitals.filter(v => v.opd !== "skip" && v.id !== "pain");
  function setV(key: string, val: string) { setVitalValues({ ...vitalValues, [key]: val }); }

  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("ft");

  // Auto-calculate BMI whenever weight or height changes
  useEffect(() => {
    const w = parseFloat(vitalValues["weight"] ?? "");
    const h = parseFloat(vitalValues["height"] ?? "");
    const newBmi = (!isNaN(w) && !isNaN(h) && h > 0)
      ? (w / ((h / 100) ** 2)).toFixed(1)
      : "";
    if ((vitalValues["bmi"] ?? "") !== newBmi) {
      setVitalValues({ ...vitalValues, bmi: newBmi });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vitalValues["weight"], vitalValues["height"]]);

  function numericOnly(val: string): string {
    return val.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
  }

  function getStatus(val: string, min: string, max: string): "normal" | "low" | "high" | "none" {
    const n = parseFloat(val);
    if (!val || isNaN(n)) return "none";
    const lo = parseFloat(min);
    const hi = parseFloat(max);
    if (!isNaN(lo) && n < lo) return "low";
    if (!isNaN(hi) && n > hi) return "high";
    if (!isNaN(lo) || !isNaN(hi)) return "normal";
    return "none";
  }

  const STATUS_CFG = {
    normal: { cls: "text-emerald-600 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", label: "Normal", border: "border-emerald-400" },
    low:    { cls: "text-amber-600  bg-amber-50  border-amber-200",     dot: "bg-amber-500",   label: "Low",    border: "border-amber-400"   },
    high:   { cls: "text-red-600    bg-red-50    border-red-200",        dot: "bg-red-500",     label: "High",   border: "border-red-400"     },
  } as const;

  function renderStatus(status: "normal" | "low" | "high" | "none", refMin: string, refMax: string, unit: string) {
    const refText = (refMin || refMax) ? `Ref: ${refMin || "—"} – ${refMax || "—"} ${unit}` : "";
    if (status === "none") return refText ? <p className="text-[10px] text-slate-400 mt-0.5">{refText}</p> : null;
    const c = STATUS_CFG[status];
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${c.cls}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />{c.label}
        </span>
        {refText && <span className="text-[10px] text-slate-400">{refText}</span>}
      </div>
    );
  }

  function inputBorder(status: "normal" | "low" | "high" | "none"): string {
    return status !== "none" ? STATUS_CFG[status].border : "";
  }

  // Height ft/in conversion helpers
  function cmToFtIn(cm: string): { ft: string; inches: string } {
    const v = parseFloat(cm);
    if (isNaN(v) || v <= 0) return { ft: "", inches: "" };
    const totalIn = v / 2.54;
    const ft = Math.floor(totalIn / 12);
    const inches = parseFloat((totalIn % 12).toFixed(1));
    return { ft: String(ft), inches: String(inches) };
  }
  function ftInToCm(ft: string, inches: string): string {
    const ftN = parseFloat(ft) || 0;
    const inN = parseFloat(inches) || 0;
    if (ftN === 0 && inN === 0) return "";
    return (ftN * 30.48 + inN * 2.54).toFixed(1);
  }
  const { ft: dispFt, inches: dispIn } = cmToFtIn(vitalValues["height"] ?? "");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <Collapsible title="Patient Vitals" accent defaultOpen>
          <div className="space-y-3 pb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date:</label>
              <Input type="date" value={vitalValues["_date"] ?? ""} onChange={e => setV("_date", e.target.value)} className="h-8 text-sm" />
            </div>
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
                  const sysVal = vitalValues["bp_sys"] ?? "";
                  const diaVal = vitalValues["bp_dia"] ?? "";
                  const sysMin = v.refMin.split("/")[0] ?? "";
                  const sysMax = v.refMax.split("/")[0] ?? "";
                  const diaMin = v.refMin.split("/")[1] ?? "";
                  const diaMax = v.refMax.split("/")[1] ?? "";
                  const sysSt  = getStatus(sysVal, sysMin, sysMax);
                  const diaSt  = getStatus(diaVal, diaMin, diaMax);
                  const combined: "normal" | "low" | "high" | "none" =
                    sysSt === "high" || diaSt === "high" ? "high"
                    : sysSt === "low"  || diaSt === "low"  ? "low"
                    : sysSt === "normal" || diaSt === "normal" ? "normal" : "none";
                  rows.push(
                    <div key="bp">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Blood Pressure {v.unit ? `(${v.unit})` : ""}:</label>
                      <div className="flex items-center gap-2">
                        <Input value={sysVal} inputMode="decimal"
                          onChange={e => setV("bp_sys", numericOnly(e.target.value))}
                          placeholder="Systolic"
                          className={`h-8 text-sm flex-1 min-w-0 ${inputBorder(sysSt)}`} />
                        <span className="text-slate-400 font-bold flex-shrink-0">/</span>
                        <Input value={diaVal} inputMode="decimal"
                          onChange={e => setV("bp_dia", numericOnly(e.target.value))}
                          placeholder="Diastolic"
                          className={`h-8 text-sm flex-1 min-w-0 ${inputBorder(diaSt)}`} />
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
                      {renderStatus(combined, v.refMin, v.refMax, v.unit)}
                    </div>
                  );
                } else if (v.id === "height") {
                  flush();
                  rows.push(
                    <div key="height">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-600">Height:</label>
                        <div className="flex items-center rounded border border-slate-200 overflow-hidden">
                          {(["cm", "ft"] as const).map(u => (
                            <button key={u} type="button" onClick={() => setHeightUnit(u)}
                              className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${heightUnit === u ? "bg-[#4982CF] text-white" : "bg-white text-slate-400 hover:bg-slate-50"}`}>
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>
                      {heightUnit === "cm" ? (
                        <Input value={vitalValues["height"] ?? ""} inputMode="decimal"
                          onChange={e => setV("height", numericOnly(e.target.value))}
                          placeholder="Enter Height (cm)" className="h-8 text-sm" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Input value={dispFt} inputMode="numeric" placeholder="Feet"
                              onChange={e => setV("height", ftInToCm(numericOnly(e.target.value), dispIn))}
                              className="h-8 text-sm" />
                            <p className="text-[10px] text-slate-400 mt-0.5">ft</p>
                          </div>
                          <div className="flex-1">
                            <Input value={dispIn} inputMode="decimal" placeholder="Inches"
                              onChange={e => setV("height", ftInToCm(dispFt, numericOnly(e.target.value)))}
                              className="h-8 text-sm" />
                            <p className="text-[10px] text-slate-400 mt-0.5">in</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else if (v.id === "bmi") {
                  const bmiVal = vitalValues["bmi"] ?? "";
                  const bmiSt  = getStatus(bmiVal, v.refMin, v.refMax);
                  buffer.push(
                    <div key="bmi">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">BMI (kg/m²):</label>
                      <Input value={bmiVal} readOnly disabled placeholder="Auto-calculated"
                        className={`h-8 text-sm bg-slate-50 cursor-not-allowed ${inputBorder(bmiSt)}`} />
                      {renderStatus(bmiSt, v.refMin, v.refMax, v.unit)}
                    </div>
                  );
                  if (buffer.length === 2) flush();
                } else {
                  const label = `${v.name}${v.unit ? ` (${v.unit})` : ""}`;
                  const isRequired = v.opd === "required";
                  const val = vitalValues[v.id] ?? "";
                  const status = getStatus(val, v.refMin, v.refMax);
                  buffer.push(
                    <div key={v.id}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        {label}{isRequired && <span className="text-rose-500 ml-0.5">*</span>}:
                      </label>
                      <Input value={val} inputMode="decimal"
                        onChange={e => setV(v.id, numericOnly(e.target.value))}
                        placeholder={`Enter ${v.name}`}
                        className={`h-8 text-sm ${inputBorder(status)}`} />
                      {renderStatus(status, v.refMin, v.refMax, v.unit)}
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

function VitalsPainTab({ painScore, setPainScore, painConfig }:
  { painScore: number; setPainScore: (n: number) => void; painConfig: VitalConfig | undefined }) {
  if (painConfig?.opd === "skip") {
    return <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Pain Score is not configured for this visit type.</div>;
  }
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Pain Score</p>
      <div className="space-y-0">
        {PAIN_LEVELS.map(pl => (
          <label key={pl.level} className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-slate-50 rounded-lg px-1 -mx-1">
            <input type="radio" name="appt-pain-tab" checked={painScore === pl.level} onChange={() => setPainScore(pl.level)} className="mt-0.5 flex-shrink-0 accent-[#4982CF]" />
            <span className="text-sm text-slate-700 leading-snug"><span className="font-semibold text-slate-800">{pl.label}</span> ({pl.desc})</span>
          </label>
        ))}
      </div>
    </div>
  );
}

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
                    <input type="radio" name={`appt-mental-${qi}`} checked={mentalAnswers[qi] === score} onChange={() => setMentalAnswer(qi, score)} className="accent-[#4982CF]" />
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

function ApptVitalsSection({ appt }: { appt: Appointment }) {
  const configuredVitals = useMemo(() => loadVitalsConfig(), []);

  const patientRef = appt.patientMrn || null;
  const [vitalsDrafts, setVitalsDrafts] = useState<VitalsDraft[]>(() => {
    const all = loadApptVitalsDrafts();
    const real = all.filter(d => !isVitalsDraftBlank(d));
    if (real.length !== all.length) persistApptVitalsDrafts(real);
    return real.filter(d => d.patientRef === patientRef);
  });
  const [activeDraftId, setActiveDraftId] = useState<string | null>(() => {
    const real = loadApptVitalsDrafts().filter(d => !isVitalsDraftBlank(d) && d.patientRef === (appt.patientMrn || null));
    if (real.length === 0) return null;
    return [...real].sort((a, b) => b.updatedAt - a.updatedAt)[0].draftId;
  });
  const [vitalsRecords, setVitalsRecords] = useState<VitalsRecord[]>(() =>
    loadApptVitalsRecords().filter(r =>
      r.apptId === appt.id || r.patientRef === patientRef
    )
  );

  const activeDraft = vitalsDrafts.find(d => d.draftId === activeDraftId) ?? null;

  const [vitalsTab, setVitalsTab]         = useState<"vitals" | "pain" | "mental" | "trends">(activeDraft?.vitalsTab ?? "vitals");
  const [vitalValues, setVitalValues]     = useState<Record<string, string>>(activeDraft?.vitalValues ?? blankVitalValues());
  const [painScore, setPainScore]         = useState<number>(activeDraft?.painScore ?? -1);
  const [mentalAnswers, setMentalAnswers] = useState<number[]>(activeDraft?.mentalAnswers ?? [0, 0, 0, 0]);

  const activeDraftIdRef    = useRef<string | null>(activeDraftId);
  activeDraftIdRef.current  = activeDraftId;
  const creatingDraftRef    = useRef(false);

  useEffect(() => { if (activeDraftId) creatingDraftRef.current = false; }, [activeDraftId]);

  function mutateDrafts(fn: (prev: VitalsDraft[]) => VitalsDraft[]) {
    setVitalsDrafts(prev => { const next = fn(prev); persistApptVitalsDrafts(next); return next; });
  }

  useEffect(() => {
    const draftId = activeDraftIdRef.current;
    if (!draftId) {
      const vals = { ...vitalValues }; delete vals._date;
      const hasFilled = Object.values(vals).some(v => v.trim() !== "") || painScore >= 0 || mentalAnswers.some(a => a > 0);
      if (!hasFilled) return;
      if (creatingDraftRef.current) return;
      creatingDraftRef.current = true;
      const id = genApptVitalsDraftId();
      const draft: VitalsDraft = {
        draftId: id, vitalValues, painScore, mentalAnswers, vitalsTab,
        patientRef: appt.patientMrn || null, patientName: appt.patientName || null,
        startedAt: Date.now(), updatedAt: Date.now(),
      };
      mutateDrafts(prev => [...prev, draft]);
      setActiveDraftId(id);
      return;
    }
    mutateDrafts(prev => prev.map(d =>
      d.draftId === draftId ? { ...d, vitalValues, painScore, mentalAnswers, vitalsTab, updatedAt: Date.now() } : d
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
    const vals = { ...vitalValues }; delete vals._date;
    const hasData = Object.values(vals).some(v => v.trim() !== "") || painScore >= 0 || mentalAnswers.some(a => a > 0);
    if (!hasData) return;
    const record: VitalsRecord = {
      recordId: `avr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      vitalValues, painScore, mentalAnswers,
      patientRef: appt.patientMrn || null, patientName: appt.patientName || null,
      completedAt: Date.now(),
      apptId: appt.id,
    };
    setVitalsRecords(prev => { const allStored = loadApptVitalsRecords(); const next = [...allStored, record]; persistApptVitalsRecords(next); return [...prev, record]; });
    if (activeDraftId) mutateDrafts(prev => prev.filter(d => d.draftId !== activeDraftId));
    setActiveDraftId(null);
    setVitalValues(blankVitalValues());
    setPainScore(-1);
    setMentalAnswers([0, 0, 0, 0]);
    setVitalsTab("vitals");
    creatingDraftRef.current = false;
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-1/2 flex-shrink-0 border-r border-slate-200 overflow-hidden">
        <VitalsLeftPanel
          drafts={vitalsDrafts} records={vitalsRecords} activeDraftId={activeDraftId}
          configuredVitals={configuredVitals} onResumeDraft={resumeDraft} onDiscardDraft={discardVitalsDraft}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="h-4 w-4 text-[#4982CF] flex-shrink-0" />
            <span className="text-xs text-slate-600 font-medium">Patient Vitals</span>
          </div>
          {(activeDraftId !== null || vitalsDrafts.length === 0) && (
            <button
              onClick={() => { setActiveDraftId(null); setVitalValues(blankVitalValues()); setPainScore(-1); setMentalAnswers([0, 0, 0, 0]); setVitalsTab("vitals"); creatingDraftRef.current = false; }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#4982CF] hover:text-[#3a6fb8] transition-colors flex-shrink-0 ml-3">
              <Plus className="h-3 w-3" /> New Vitals Entry
            </button>
          )}
        </div>
        {/* ── Step indicator ── */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-slate-100 bg-white">
          <div className="flex items-center">
            {([
              { key: "vitals" as const, label: "Vitals",        num: 1 },
              { key: "pain"   as const, label: "Pain Score",    num: 2 },
              { key: "mental" as const, label: "Mental Health", num: 3 },
            ]).map((step, i) => {
              const stepKeys = ["vitals", "pain", "mental"];
              const activeIdx = stepKeys.indexOf(vitalsTab === "trends" ? "vitals" : vitalsTab);
              const isDone   = i < activeIdx;
              const isActive = i === activeIdx;
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <button onClick={() => setVitalsTab(step.key)} className="flex flex-col items-center gap-1 group">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isDone ? "bg-emerald-500 text-white" : isActive ? "bg-[#4982CF] text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"}`}>
                      {isDone ? "✓" : step.num}
                    </span>
                    <span className={`text-[10px] font-semibold whitespace-nowrap ${isActive ? "text-[#4982CF]" : isDone ? "text-emerald-600" : "text-slate-400"}`}>{step.label}</span>
                  </button>
                  {i < 2 && <div className={`flex-1 h-px mx-2 mb-4 ${i < activeIdx ? "bg-emerald-400" : "bg-slate-200"}`} />}
                </div>
              );
            })}
            <button
              onClick={() => setVitalsTab("trends")}
              className={`ml-4 mb-3 text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${vitalsTab === "trends" ? "border-[#4982CF] text-[#4982CF] bg-blue-50" : "border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300"}`}>
              Trends
            </button>
          </div>
        </div>
        {vitalsTab === "vitals"  && <VitalsFormVitalsOnly vitalValues={vitalValues} setVitalValues={setVitalValues} configuredVitals={configuredVitals} />}
        {vitalsTab === "pain"    && <VitalsPainTab painScore={painScore} setPainScore={setPainScore} painConfig={configuredVitals.find(v => v.id === "pain")} />}
        {vitalsTab === "mental"  && <VitalsMentalTab mentalAnswers={mentalAnswers} setMentalAnswers={setMentalAnswers} />}
        {vitalsTab === "trends"  && <VitalsTrends />}
        <div className="flex-shrink-0 border-t border-slate-200 px-5 py-3 bg-white">
          {vitalsTab === "vitals" && (
            <button onClick={() => setVitalsTab("pain")}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[#4982CF] hover:bg-[#3a6fb8] text-white text-sm font-bold transition-colors">
              Next: Pain Score <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {vitalsTab === "pain" && (
            <div className="flex gap-2">
              <button onClick={() => setVitalsTab("vitals")}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button onClick={() => setVitalsTab("mental")}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-[#4982CF] hover:bg-[#3a6fb8] text-white text-sm font-bold transition-colors">
                Next: Mental Health <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          {vitalsTab === "mental" && (
            <div className="flex gap-2">
              <button onClick={() => setVitalsTab("pain")}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button onClick={handleVitalsComplete}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-[#4982CF] hover:bg-[#3a6fb8] text-white text-sm font-bold transition-colors">
                <CheckCircle2 className="h-4 w-4" /> Save &amp; Complete
              </button>
            </div>
          )}
          {vitalsTab === "trends" && (
            <button onClick={() => setVitalsTab("vitals")}
              className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back to Vitals
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HISTORY SECTION
// ══════════════════════════════════════════════════════════════════════════════

type HistoryEntryMap = Record<string, Record<string, string>[]>;

interface HistoryDraft {
  draftId: string; templateId: string | null; templateName: string | null;
  patientRef: string | null; patientName: string | null;
  data: HistoryEntryMap; systemValues: Record<string, string>;
  startedAt: number; updatedAt: number;
}
interface HistoryRecord {
  recordId: string; templateId: string; templateName: string;
  patientRef: string | null; patientName: string | null;
  sections: { name: string; lines: string[] }[]; completedAt: number;
}

function isHistoryDraftBlank(d: HistoryDraft): boolean {
  const dataFilled = Object.values(d.data).some(entries => entries.some(entry => Object.values(entry).some(v => v.trim() !== "")));
  return !dataFilled && !Object.values(d.systemValues).some(v => v.trim() !== "");
}
function loadApptHistoryDrafts(): HistoryDraft[] {
  try { const raw = localStorage.getItem(APPT_HISTORY_DRAFTS_KEY); if (raw) return JSON.parse(raw) as HistoryDraft[]; } catch { /**/ }
  return [];
}
function persistApptHistoryDrafts(d: HistoryDraft[]): void {
  try { localStorage.setItem(APPT_HISTORY_DRAFTS_KEY, JSON.stringify(d)); } catch { /**/ }
}
function loadApptHistoryRecords(): HistoryRecord[] {
  try { const raw = localStorage.getItem(APPT_HISTORY_RECORDS_KEY); if (raw) return JSON.parse(raw) as HistoryRecord[]; } catch { /**/ }
  return [];
}
function persistApptHistoryRecords(r: HistoryRecord[]): void {
  try { localStorage.setItem(APPT_HISTORY_RECORDS_KEY, JSON.stringify(r)); } catch { /**/ }
}
function genApptHistoryDraftId() { return `ahd-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }

function HistoryTabContent({ initialTemplateId, initialData, initialSystemValues, onStateChange, onComplete }: {
  initialTemplateId?: string; initialData?: HistoryEntryMap; initialSystemValues?: Record<string, string>;
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
    const dataFilled = Object.values(data).some(entries => entries.some(entry => Object.values(entry).some(v => v.trim() !== "")));
    return dataFilled || Object.values(systemValues).some(v => v.trim() !== "");
  }, [data, systemValues]);

  function getEntries(compId: string): Record<string, string>[] { return data[compId] ?? [{}]; }
  function setEntry(compId: string, idx: number, values: Record<string, string>) {
    setData(prev => { const entries = [...(prev[compId] ?? [{}])]; entries[idx] = values; return { ...prev, [compId]: entries }; });
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
      if (comp.type === "system") { const val = systemValues[comp.id] ?? ""; return { name: comp.name, lines: val.trim() ? [val] : [] }; }
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
                  <SystemComponentView systemKey={comp.systemKey} value={systemValues[comp.id] ?? ""} onChange={v => setSystemValues(prev => ({ ...prev, [comp.id]: v }))} />
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
                                    <button onClick={() => removeEntry(comp.id, idx)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                  </div>
                                )}
                                <CustomComponentForm component={comp} values={entryVals} onChange={v => setEntry(comp.id, idx, v)} entryLayout={comp.entryLayout} columns={comp.columns} />
                              </div>
                            ))}
                          </div>
                          {comp.repeatable && (
                            <button onClick={() => addEntry(comp.id, comp.repeatLimit)}
                              disabled={comp.repeatLimit !== null && entries.length >= comp.repeatLimit}
                              className="flex items-center gap-1.5 text-xs font-bold text-[#4982CF] hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity mt-3">
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
          </div>
        )}
      </div>
      {onComplete && (
        <div className="flex-shrink-0 border-t border-slate-100 px-5 py-3">
          <button disabled={!hasContent} onClick={handleComplete}
            className="w-full py-2 rounded-xl bg-[#4982CF] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#3a6fb8] transition-colors">
            Save &amp; Complete
          </button>
        </div>
      )}
    </div>
  );
}

function ApptHistorySplitPanel({ appt }: { appt: Appointment }) {
  const { config } = useNursingConfig();
  const enabledTemplates = useMemo(() => config.templates.filter(t => t.enabled), [config.templates]);

  const patientRef = appt.patientMrn || null;
  const [drafts, setDrafts] = useState<HistoryDraft[]>(() => {
    const all = loadApptHistoryDrafts();
    const real = all.filter(d => !isHistoryDraftBlank(d));
    if (real.length !== all.length) persistApptHistoryDrafts(real);
    return real.filter(d => d.patientRef === patientRef);
  });
  const [activeDraftId, setActiveDraftId] = useState<string | null>(() => {
    const real = loadApptHistoryDrafts().filter(d => !isHistoryDraftBlank(d) && d.patientRef === (appt.patientMrn || null));
    if (real.length === 0) return null;
    return [...real].sort((a, b) => b.updatedAt - a.updatedAt)[0].draftId;
  });
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(() => {
    const realDrafts = loadApptHistoryDrafts().filter(d => !isHistoryDraftBlank(d) && d.patientRef === (appt.patientMrn || null));
    if (realDrafts.length > 0) return null;
    const templates = config.templates.filter(t => t.enabled);
    if (templates.length === 1) return templates[0].id;
    return null;
  });
  const [records, setRecords] = useState<HistoryRecord[]>(() =>
    loadApptHistoryRecords().filter(r => r.patientRef === patientRef)
  );
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const activeDraft = drafts.find(d => d.draftId === activeDraftId) ?? null;

  function computeDefaultTemplateId(): string | null {
    if (enabledTemplates.length === 1) return enabledTemplates[0].id;
    return null;
  }
  function mutateDrafts(fn: (prev: HistoryDraft[]) => HistoryDraft[]) {
    setDrafts(prev => { const next = fn(prev); persistApptHistoryDrafts(next); return next; });
  }
  const creatingDraftRef = useRef(false);
  useEffect(() => { if (activeDraftId) creatingDraftRef.current = false; }, [activeDraftId]);

  function handleStateChange(templateId: string | null, templateName: string | null, data: HistoryEntryMap, systemValues: Record<string, string>) {
    const currentId = activeDraftId;
    if (!currentId) {
      const dataFilled = Object.values(data).some(entries => entries.some(entry => Object.values(entry).some(v => v.trim() !== "")));
      const sysFilled  = Object.values(systemValues).some(v => v.trim() !== "");
      if (!dataFilled && !sysFilled) return;
      if (creatingDraftRef.current) return;
      creatingDraftRef.current = true;
      const draftId = genApptHistoryDraftId();
      const draft: HistoryDraft = {
        draftId, templateId, templateName,
        patientRef: appt.patientMrn || null, patientName: appt.patientName || null,
        data, systemValues, startedAt: Date.now(), updatedAt: Date.now(),
      };
      mutateDrafts(prev => [...prev, draft]);
      setActiveDraftId(draftId);
      setPendingTemplateId(null);
      return;
    }
    mutateDrafts(prev => prev.map(d =>
      d.draftId === currentId ? { ...d, templateId, templateName, data, systemValues, updatedAt: Date.now() } : d
    ));
  }

  function handleComplete(snapshot: { templateId: string; templateName: string; sections: { name: string; lines: string[] }[] }) {
    const record: HistoryRecord = {
      recordId: `ahr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      templateId: snapshot.templateId, templateName: snapshot.templateName,
      patientRef: appt.patientMrn || null, patientName: appt.patientName || null,
      sections: snapshot.sections, completedAt: Date.now(),
    };
    setRecords(prev => { const next = [...prev, record]; persistApptHistoryRecords(next); return next; });
    if (activeDraftId) mutateDrafts(prev => prev.filter(d => d.draftId !== activeDraftId));
    setActiveDraftId(null);
    setPendingTemplateId(computeDefaultTemplateId());
  }

  function discardDraft(draftId: string) {
    mutateDrafts(prev => prev.filter(d => d.draftId !== draftId));
    if (activeDraftId === draftId) { setActiveDraftId(null); setPendingTemplateId(computeDefaultTemplateId()); }
  }

  const resolvedTemplateId = activeDraft?.templateId ?? pendingTemplateId ?? null;
  const showPicker = resolvedTemplateId === null;

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-1/2 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto bg-white">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 flex-1">Required Actions</span>
          {drafts.length > 0 && <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5 leading-none">{drafts.length}</span>}
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
            const ageLabel = age < 60_000 ? "just now" : age < 3_600_000 ? `${Math.floor(age / 60_000)}m ago` : `${Math.floor(age / 3_600_000)}h ago`;
            return (
              <div key={d.draftId} className={`rounded-xl border transition-all ${active ? "bg-amber-50/60 border-amber-300/60 shadow-sm ring-1 ring-amber-200/60" : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"}`}>
                <button onClick={() => { setActiveDraftId(d.draftId); setPendingTemplateId(null); }} className="w-full text-left p-3.5 pr-2">
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-amber-100" : "bg-amber-50"}`}>
                      <ClipboardList className={`h-4 w-4 ${active ? "text-amber-600" : "text-amber-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{d.templateName ?? "History Draft"}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{d.patientName ?? "Walk-in"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{ageLabel}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); discardDraft(d.draftId); }}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0 mt-0.5">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
        <div className="sticky top-0 z-10 bg-white border-t border-b border-slate-100 px-4 py-3 flex items-center gap-2 mt-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 flex-1">All Records</span>
          {records.length > 0 && <span className="text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 rounded-full px-2 py-0.5 leading-none">{records.length}</span>}
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
                <button onClick={() => setExpandedRecord(expanded ? null : r.recordId)}
                  className="w-full text-left p-3.5 flex items-start gap-3 hover:bg-white transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{r.templateName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{r.patientName ?? "Walk-in"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(r.completedAt).toLocaleDateString()} · {filledSections.length} section{filledSections.length !== 1 ? "s" : ""}</p>
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
                        {s.lines.map((line, i) => <p key={i} className="text-xs text-slate-700 mt-0.5">{line}</p>)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="w-1/2 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardList className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-xs text-slate-600 font-medium truncate">
              {activeDraft ? (activeDraft.templateName ?? "History Draft") : pendingTemplateId ? (enabledTemplates.find(t => t.id === pendingTemplateId)?.name ?? "New Record") : "Select Template"}
            </span>
          </div>
          {(activeDraftId || pendingTemplateId) && (
            <button onClick={() => { setActiveDraftId(null); setPendingTemplateId(computeDefaultTemplateId()); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#4982CF] hover:text-[#3a6fb8] transition-colors flex-shrink-0 ml-3">
              <Plus className="h-3 w-3" /> New Record
            </button>
          )}
        </div>
        {showPicker ? (
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
                    <button key={t.id} onClick={() => setPendingTemplateId(t.id)}
                      className="w-full text-left rounded-xl border-2 p-4 transition-all hover:border-[#4982CF] hover:bg-[#4982CF]/5 hover:shadow-sm group border-slate-200 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-50 group-hover:bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
                          <ClipboardList className="h-5 w-5 text-amber-500 group-hover:text-[#4982CF]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{t.components.length} section{t.components.length !== 1 ? "s" : ""}</p>
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
          <HistoryTabContent
            key={activeDraftId ?? pendingTemplateId ?? "new"}
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

// ══════════════════════════════════════════════════════════════════════════════
// PROCEDURE SECTION
// ══════════════════════════════════════════════════════════════════════════════

interface MedRow    { id: string; drug: string; dose: string; route: string; notes: string; }
type ConsentStatus = "obtained" | "pending" | "declined";
interface ConsentData { status: ConsentStatus | ""; witness: string; date: string; notes: string; }
interface BillingRow { id: string; name: string; qty: number; unitFee: number; }

interface ProcDraft {
  draftId: string; templateId: string; templateName: string;
  startedAt: number; updatedAt: number;
  apptId?: string; patientRef?: string | null;
  vitalsValues: Record<string, string>; medRows: MedRow[];
  consentData: ConsentData; billingRows: BillingRow[];
  customValues: Record<string, Record<string, string>[]>;
}
interface ProcRecord {
  recordId: string; templateId: string; templateName: string;
  completedAt: number; componentNames: string[];
  apptId?: string; patientRef?: string | null;
  vitalsValues: Record<string, string>; medRows: MedRow[];
  consentData: ConsentData; billingRows: BillingRow[];
  customValues: Record<string, Record<string, string>[]>;
}

function loadApptProcDrafts(): ProcDraft[] {
  try { const r = localStorage.getItem(APPT_PROC_DRAFTS_KEY); if (r) return JSON.parse(r) as ProcDraft[]; } catch { /**/ }
  return [];
}
function persistApptProcDrafts(d: ProcDraft[]) { try { localStorage.setItem(APPT_PROC_DRAFTS_KEY, JSON.stringify(d)); } catch { /**/ } }
function loadApptProcRecords(): ProcRecord[] {
  try { const r = localStorage.getItem(APPT_PROC_RECORDS_KEY); if (r) return JSON.parse(r) as ProcRecord[]; } catch { /**/ }
  return [];
}
function persistApptProcRecords(r: ProcRecord[]) { try { localStorage.setItem(APPT_PROC_RECORDS_KEY, JSON.stringify(r)); } catch { /**/ } }
function genApptProcDraftId() { return `apd-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }

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
        return (
          <div key={v.id}>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{v.name}{v.unit ? ` (${v.unit})` : ""}{v.opd === "required" && <span className="text-rose-500 ml-0.5">*</span>}:</label>
            <Input value={values[v.id] ?? ""} onChange={e => setV(v.id, e.target.value)} placeholder={`Enter ${v.name}`}
              className="h-8 text-sm" style={v.refMin || v.refMax ? { borderColor: `${v.color}40` } : undefined} />
            {(v.refMin || v.refMax) && <p className="text-[10px] text-slate-400 mt-0.5">Ref: {v.refMin || "—"} – {v.refMax || "—"} {v.unit}</p>}
          </div>
        );
      })}
      {displayVitals.length === 0 && <p className="text-xs text-slate-400 italic">No vitals configured.</p>}
    </div>
  );
}

function ProcedureMedicationsForm({ rows, onChange }: { rows: MedRow[]; onChange: (r: MedRow[]) => void }) {
  const ROUTES = ["IV","IM","SC","PO","SL","Topical","Inhalation","Intradermal","Other"];
  function addRow() { onChange([...rows, { id: `m-${Date.now()}`, drug: "", dose: "", route: "", notes: "" }]); }
  function removeRow(id: string) { onChange(rows.filter(r => r.id !== id)); }
  function updateRow(id: string, patch: Partial<MedRow>) { onChange(rows.map(r => r.id === id ? { ...r, ...patch } : r)); }
  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">No medications added yet.</p>}
      {rows.map((row, i) => (
        <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2.5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Medication {i + 1}</span>
            <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] font-semibold text-slate-500 mb-1">Drug Name *</label><Input value={row.drug} onChange={e => updateRow(row.id, { drug: e.target.value })} placeholder="e.g. Metformin" className="h-8 text-sm" /></div>
            <div><label className="block text-[10px] font-semibold text-slate-500 mb-1">Dose</label><Input value={row.dose} onChange={e => updateRow(row.id, { dose: e.target.value })} placeholder="e.g. 500 mg" className="h-8 text-sm" /></div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Route</label>
            <Select value={row.route} onValueChange={v => updateRow(row.id, { route: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select route…" /></SelectTrigger>
              <SelectContent>{ROUTES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="block text-[10px] font-semibold text-slate-500 mb-1">Notes</label><Input value={row.notes} onChange={e => updateRow(row.id, { notes: e.target.value })} placeholder="Optional notes…" className="h-8 text-sm" /></div>
        </div>
      ))}
      <button onClick={addRow} className="flex items-center gap-1.5 text-xs font-bold text-[#4982CF] hover:opacity-70 transition-opacity">
        <Plus className="h-3.5 w-3.5" /> Add Medication
      </button>
    </div>
  );
}

function ProcedureConsentForm({ data, onChange }: { data: ConsentData; onChange: (d: ConsentData) => void }) {
  const STATUSES: { key: ConsentStatus; label: string; color: string }[] = [
    { key: "obtained", label: "Obtained", color: "bg-green-600 border-green-600 text-white" },
    { key: "pending",  label: "Pending",  color: "bg-amber-500 border-amber-500 text-white" },
    { key: "declined", label: "Declined", color: "bg-rose-500 border-rose-500 text-white" },
  ];
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">Consent Status *</label>
        <div className="flex gap-2">
          {STATUSES.map(s => (
            <button key={s.key} onClick={() => onChange({ ...data, status: s.key })}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${data.status === s.key ? s.color : "border-slate-200 text-slate-500 bg-white hover:border-slate-300"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div><label className="block text-xs font-semibold text-slate-600 mb-1">Witness Name</label><Input value={data.witness} onChange={e => onChange({ ...data, witness: e.target.value })} placeholder="Enter witness name…" className="h-8 text-sm" /></div>
      <div><label className="block text-xs font-semibold text-slate-600 mb-1">Consent Date</label><Input type="date" value={data.date} onChange={e => onChange({ ...data, date: e.target.value })} className="h-8 text-sm" /></div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Additional Notes</label>
        <textarea value={data.notes} onChange={e => onChange({ ...data, notes: e.target.value })} placeholder="Any relevant consent notes…"
          className="w-full px-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-ring h-16" />
      </div>
    </div>
  );
}

function ProcedureBillingForm({ rows, onChange }: { rows: BillingRow[]; onChange: (r: BillingRow[]) => void }) {
  function addRow() { onChange([...rows, { id: `b-${Date.now()}`, name: "", qty: 1, unitFee: 0 }]); }
  function removeRow(id: string) { onChange(rows.filter(r => r.id !== id)); }
  function updateRow(id: string, patch: Partial<BillingRow>) { onChange(rows.map(r => r.id === id ? { ...r, ...patch } : r)); }
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
                  <td className="px-3 py-2"><Input value={row.name} onChange={e => updateRow(row.id, { name: e.target.value })} placeholder="Item name…" className="h-7 text-xs border-0 p-0 focus-visible:ring-0 shadow-none bg-transparent" /></td>
                  <td className="px-3 py-2"><Input type="number" min={1} value={row.qty} onChange={e => updateRow(row.id, { qty: Math.max(1, parseInt(e.target.value) || 1) })} className="h-7 text-xs text-center border-0 p-0 focus-visible:ring-0 shadow-none bg-transparent w-full" /></td>
                  <td className="px-3 py-2"><Input type="number" min={0} value={row.unitFee} onChange={e => updateRow(row.id, { unitFee: parseFloat(e.target.value) || 0 })} className="h-7 text-xs text-right border-0 p-0 focus-visible:ring-0 shadow-none bg-transparent w-full" /></td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-700">{(row.qty * row.unitFee).toLocaleString()}</td>
                  <td className="px-2 py-2 text-right"><button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td colSpan={3} className="px-3 py-2 text-xs font-bold text-slate-600 text-right">Grand Total</td>
                <td className="px-3 py-2 text-right"><span className="text-sm font-black text-[#4982CF]">PKR {grandTotal.toLocaleString()}</span></td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {rows.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-4 text-xs text-slate-400">
          <DollarSign className="h-4 w-4 text-slate-300" /> No billing items added yet.
        </div>
      )}
      <button onClick={addRow} className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:opacity-70 transition-opacity">
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

function ProcedureSystemComponentView({ systemKey, vitalsValues, onVitalsChange, medRows, onMedChange, consentData, onConsentChange, billingRows, onBillingChange }: {
  systemKey?: string; vitalsValues: Record<string, string>; onVitalsChange: (v: Record<string, string>) => void;
  medRows: MedRow[]; onMedChange: (r: MedRow[]) => void; consentData: ConsentData; onConsentChange: (d: ConsentData) => void;
  billingRows: BillingRow[]; onBillingChange: (r: BillingRow[]) => void;
}) {
  if (systemKey === "vitals")      return <ProcedureVitalsForm values={vitalsValues} onChange={onVitalsChange} />;
  if (systemKey === "medications") return <ProcedureMedicationsForm rows={medRows} onChange={onMedChange} />;
  if (systemKey === "consent")     return <ProcedureConsentForm data={consentData} onChange={onConsentChange} />;
  if (systemKey === "billing")     return <ProcedureBillingForm rows={billingRows} onChange={onBillingChange} />;
  const def = PROCEDURE_SYSTEM_COMPONENTS.find(c => c.key === systemKey);
  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3">
      <p className="text-xs font-semibold text-violet-600">{def?.name ?? "System Component"}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{def?.desc ?? "Module not yet available."}</p>
    </div>
  );
}

function ProcedureLeftPanel({ drafts, records, activeDraftId, onSelectDraft, onDiscardDraft }: {
  drafts: ProcDraft[]; records: ProcRecord[]; activeDraftId: string | null;
  onSelectDraft: (id: string) => void; onDiscardDraft: (draftId: string) => void;
}) {
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const configuredVitals = useMemo(() => loadVitalsConfig(), []);
  function vitalsRowsFromRecord(v: Record<string, string>): [string, string][] {
    return configuredVitals.filter(vit => vit.opd !== "skip").flatMap(vit => {
      if (vit.id === "bp") {
        const sys = v["bp_sys"] ?? ""; const dia = v["bp_dia"] ?? "";
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
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-2 flex-shrink-0">
        <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-700 flex-1">Required Actions</span>
        {drafts.length > 0 && <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5 leading-none">{drafts.length}</span>}
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
          const ageLabel = age < 60_000 ? "just now" : age < 3_600_000 ? `${Math.floor(age / 60_000)}m ago` : `${Math.floor(age / 3_600_000)}h ago`;
          return (
            <div key={d.draftId} className={`rounded-xl border transition-all ${active ? "bg-teal-50/60 border-teal-300/60 shadow-sm ring-1 ring-teal-200/60" : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"}`}>
              <button onClick={() => onSelectDraft(d.draftId)} className="w-full text-left p-3.5 pr-2">
                <div className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-teal-100" : "bg-teal-50"}`}>
                    <Stethoscope className={`h-4 w-4 ${active ? "text-teal-600" : "text-teal-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{d.templateName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Started {new Date(d.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">In Progress</span>
                      <span className="text-[10px] text-slate-400">saved {ageLabel}</span>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); onDiscardDraft(d.draftId); }}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0 mt-0.5">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </button>
            </div>
          );
        })}
      </div>
      <div className="bg-white border-t border-b border-slate-100 px-4 py-3 flex items-center gap-2">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-700 flex-1">All Records</span>
        {records.length > 0 && <span className="text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 rounded-full px-2 py-0.5 leading-none">{records.length}</span>}
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
          const hasCustom     = Object.values(r.customValues).some(entries => entries.some(e => Object.values(e).some(v => v.trim())));
          const hasAnyData    = vitalsRows.length > 0 || filledMeds.length > 0 || !!r.consentData.status || filledBilling.length > 0 || hasCustom;
          return (
            <div key={r.recordId} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
              <button onClick={() => setExpandedRecord(exp ? null : r.recordId)} className="w-full text-left p-3.5 flex items-start gap-3 hover:bg-white transition-colors">
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{r.templateName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(r.completedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-1 transition-transform ${exp ? "rotate-180" : ""}`} />
              </button>
              {exp && (
                <div className="border-t border-slate-200 bg-white px-4 py-3 space-y-3">
                  {!hasAnyData && <p className="text-xs text-slate-400 italic">No data recorded.</p>}
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
                  {filledMeds.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Medications Given</p>
                      <div className="rounded-lg overflow-hidden border border-slate-100">
                        {filledMeds.map((m, i) => (
                          <div key={m.id} className={`px-2.5 py-1.5 ${i % 2 === 0 ? "bg-violet-50" : "bg-white"}`}>
                            <span className="text-[11px] font-semibold text-slate-700">{m.drug}</span>
                            {(m.dose || m.route) && <span className="text-[10px] text-slate-400 ml-1.5">{[m.dose, m.route].filter(Boolean).join(" · ")}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {r.consentData.status && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Consent</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.consentData.status === "obtained" ? "bg-green-100 text-green-700" : r.consentData.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                        {r.consentData.status.charAt(0).toUpperCase() + r.consentData.status.slice(1)}
                      </span>
                    </div>
                  )}
                  {filledBilling.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Billing Items</p>
                      <div className="rounded-lg overflow-hidden border border-slate-100">
                        {filledBilling.map((b, i) => (
                          <div key={b.id} className={`flex items-center justify-between px-2.5 py-1.5 ${i % 2 === 0 ? "bg-slate-50" : "bg-white"}`}>
                            <span className="text-[11px] text-slate-600">{b.name} × {b.qty}</span>
                            <span className="text-[11px] font-semibold text-slate-700">{(b.qty * b.unitFee).toLocaleString()}</span>
                          </div>
                        ))}
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

function ProcedureWorkspace({ activeDraft, activeTemplate, templates, showGateway, onStartNew, onSelectTemplate, onVitalsChange, onMedChange, onConsentChange, onBillingChange, onCustomChange, onAddCustomEntry, onRemoveCustomEntry, onComplete }: {
  activeDraft: ProcDraft | null; activeTemplate: NursingProcedureTemplate | null;
  templates: NursingProcedureTemplate[]; showGateway: boolean;
  onStartNew: () => void; onSelectTemplate: (id: string) => void;
  onVitalsChange: (v: Record<string, string>) => void; onMedChange: (r: MedRow[]) => void;
  onConsentChange: (d: ConsentData) => void; onBillingChange: (r: BillingRow[]) => void;
  onCustomChange: (compId: string, idx: number, vals: Record<string, string>) => void;
  onAddCustomEntry: (compId: string, limit: number | null) => void;
  onRemoveCustomEntry: (compId: string, idx: number) => void;
  onComplete: () => void;
}) {
  const headerLabel = activeDraft && activeTemplate && !showGateway ? activeTemplate.name : showGateway ? "Select Template" : "Nursing Procedures";
  const draft = activeDraft; const template = activeTemplate;
  function getEntries(compId: string): Record<string, string>[] { return draft!.customValues[compId] ?? [{}]; }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 min-w-0">
          <Stethoscope className="h-4 w-4 text-teal-600 flex-shrink-0" />
          <span className="text-xs text-slate-600 font-medium truncate">{headerLabel}</span>
        </div>
        <button onClick={onStartNew} className="flex items-center gap-1.5 text-xs font-semibold text-[#4982CF] hover:text-[#3a6fb8] transition-colors flex-shrink-0 ml-3">
          <Plus className="h-3 w-3" /> New Record
        </button>
      </div>
      {templates.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Stethoscope className="h-10 w-10 opacity-30" />
          <p className="text-sm font-semibold text-slate-500">No procedure templates configured</p>
          <p className="text-xs text-center">An admin can set up templates in Admin → Nursing Procedures.</p>
        </div>
      ) : showGateway ? (
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
          <p className="text-xs text-slate-400 mb-2">Choose a template to start a new nursing procedure.</p>
          {templates.map(t => (
            <button key={t.id} onClick={() => onSelectTemplate(t.id)} className="w-full text-left rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30 hover:shadow-sm transition-all p-4 group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                  <Stethoscope className="h-5 w-5 text-teal-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t.components.length} component{t.components.length !== 1 ? "s" : ""}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      ) : !draft || !template ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-teal-50 flex items-center justify-center"><Stethoscope className="h-8 w-8 text-teal-300" /></div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">No active procedure</p>
            <p className="text-xs text-slate-400 mt-1">Select a draft from the left or click <span className="font-semibold text-[#4982CF]">+ New Record</span> to begin.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {template.components.map(comp => (
              <Collapsible key={comp.id} title={comp.name} defaultOpen>
                {comp.type === "system" ? (
                  <ProcedureSystemComponentView systemKey={comp.systemKey as string}
                    vitalsValues={draft.vitalsValues} onVitalsChange={onVitalsChange}
                    medRows={draft.medRows} onMedChange={onMedChange}
                    consentData={draft.consentData} onConsentChange={onConsentChange}
                    billingRows={draft.billingRows} onBillingChange={onBillingChange} />
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
                                    <button onClick={() => onRemoveCustomEntry(comp.id, idx)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                  </div>
                                )}
                                <CustomComponentForm component={comp} values={entryVals} onChange={v => onCustomChange(comp.id, idx, v)} entryLayout={comp.entryLayout} columns={comp.columns} />
                              </div>
                            ))}
                          </div>
                          {comp.repeatable && (
                            <button onClick={() => onAddCustomEntry(comp.id, comp.repeatLimit)}
                              disabled={comp.repeatLimit !== null && entries.length >= comp.repeatLimit}
                              className="flex items-center gap-1.5 text-xs font-bold text-[#4982CF] hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity mt-3">
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
            {template.components.length === 0 && <p className="text-xs text-slate-400 italic px-1">No components in this template.</p>}
          </div>
          <div className="flex-shrink-0 border-t border-slate-200 px-5 py-3 bg-white">
            <button onClick={onComplete} className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-bold transition-colors cursor-pointer">
              <CheckCircle2 className="h-4 w-4" /> Save &amp; Complete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ApptProcedureSection({ appt }: { appt: Appointment }) {
  const { config } = useNursingConfig();
  const enabledTemplates = useMemo(() => config.procedureTemplates.filter(t => t.enabled), [config.procedureTemplates]);

  const patientRef = appt.patientMrn || null;
  const [drafts,        setDrafts]        = useState<ProcDraft[]>(() =>
    loadApptProcDrafts().filter(d => d.apptId === appt.id || (!d.apptId && d.patientRef === patientRef))
  );
  const [records,       setRecords]       = useState<ProcRecord[]>(() =>
    loadApptProcRecords().filter(r => r.apptId === appt.id || (!r.apptId && r.patientRef === patientRef))
  );
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [showGateway,   setShowGateway]   = useState(true);

  const activeDraft    = drafts.find(d => d.draftId === activeDraftId) ?? null;
  const activeTemplate = activeDraft ? (enabledTemplates.find(t => t.id === activeDraft.templateId) ?? null) : null;

  function patchDraft(draftId: string, patches: Partial<ProcDraft>) {
    setDrafts(prev => { const next = prev.map(d => d.draftId === draftId ? { ...d, ...patches, updatedAt: Date.now() } : d); persistApptProcDrafts(next); return next; });
  }
  function startNewProcedure(templateId: string) {
    const tmpl = enabledTemplates.find(t => t.id === templateId);
    if (!tmpl) return;
    const draft: ProcDraft = {
      draftId: genApptProcDraftId(), templateId, templateName: tmpl.name,
      startedAt: Date.now(), updatedAt: Date.now(),
      apptId: appt.id, patientRef: appt.patientMrn || null,
      vitalsValues: { _date: new Date().toISOString().slice(0, 10) },
      medRows: [], consentData: { status: "", witness: "", date: new Date().toISOString().slice(0, 10), notes: "" },
      billingRows: [], customValues: {},
    };
    setDrafts(prev => { const next = [...prev, draft]; persistApptProcDrafts(next); return next; });
    setActiveDraftId(draft.draftId);
    setShowGateway(false);
  }
  function discardDraft(draftId: string) {
    setDrafts(prev => { const next = prev.filter(d => d.draftId !== draftId); persistApptProcDrafts(next); return next; });
    if (activeDraftId === draftId) { setActiveDraftId(null); setShowGateway(true); }
  }
  function completeDraft(draftId: string) {
    const draft = drafts.find(d => d.draftId === draftId);
    if (!draft) return;
    const tmpl = enabledTemplates.find(t => t.id === draft.templateId);
    const record: ProcRecord = {
      recordId: `apr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      templateId: draft.templateId, templateName: draft.templateName, completedAt: Date.now(),
      componentNames: tmpl?.components.map(c => c.name) ?? [],
      apptId: draft.apptId, patientRef: draft.patientRef,
      vitalsValues: draft.vitalsValues, medRows: draft.medRows,
      consentData: draft.consentData, billingRows: draft.billingRows, customValues: draft.customValues,
    };
    setDrafts(prev  => { const next = prev.filter(d => d.draftId !== draftId); persistApptProcDrafts(next);  return next; });
    setRecords(prev => { const next = [...prev, record];                        persistApptProcRecords(next); return next; });
    setActiveDraftId(null);
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-1/2 flex-shrink-0 border-r border-slate-200 overflow-hidden">
        <ProcedureLeftPanel drafts={drafts} records={records} activeDraftId={activeDraftId}
          onSelectDraft={id => { setActiveDraftId(id); setShowGateway(false); }} onDiscardDraft={discardDraft} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <ProcedureWorkspace
          activeDraft={activeDraft} activeTemplate={activeTemplate} templates={enabledTemplates}
          showGateway={showGateway} onStartNew={() => setShowGateway(true)} onSelectTemplate={startNewProcedure}
          onVitalsChange={v  => activeDraftId && patchDraft(activeDraftId, { vitalsValues: v })}
          onMedChange={r     => activeDraftId && patchDraft(activeDraftId, { medRows: r })}
          onConsentChange={d => activeDraftId && patchDraft(activeDraftId, { consentData: d })}
          onBillingChange={r => activeDraftId && patchDraft(activeDraftId, { billingRows: r })}
          onCustomChange={(compId, idx, vals) => {
            if (!activeDraftId || !activeDraft) return;
            const entries = [...(activeDraft.customValues[compId] ?? [{}])]; entries[idx] = vals;
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
            if (entries.length <= 1) return; entries.splice(idx, 1);
            patchDraft(activeDraftId, { customValues: { ...activeDraft.customValues, [compId]: entries } });
          }}
          onComplete={() => activeDraftId && completeDraft(activeDraftId)}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CARE PLAN SECTION  (8-section SOAP-sourced view)
// ══════════════════════════════════════════════════════════════════════════════

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiagItem { uid: string; code: string; name: string; severity: string; }
interface SectionItem { uid: string; label: string; }

interface SectionSource {
  id:                   string;
  doctorName:           string;
  signedAt:             string;
  presentingComplaints: string[];
  diagnoses:            DiagItem[];
  labOrders:            SectionItem[];
  prescriptions:        SectionItem[];
  imaging:              SectionItem[];
  procedureOrders:      SectionItem[];
  referrals:            SectionItem[];
  healthEd:             SectionItem[];
  carePlan:             SectionItem[];
}

type InteractiveSectionKey = "labOrders" | "prescriptions" | "imaging" | "procedureOrders" | "referrals" | "healthEd";
interface SectionItemStatus { status: "done" | "skipped"; reason?: string; }
type SectionItemStatuses = Record<string, SectionItemStatus | undefined>;
type SourceExec = Partial<Record<InteractiveSectionKey, SectionItemStatuses>>;
type SectionExecStore = Record<string, SourceExec>;

const APPT_SECTION_EXEC_KEY = "appt-section-exec-v1";
function loadSectionExecStore(): SectionExecStore {
  try { return JSON.parse(localStorage.getItem(APPT_SECTION_EXEC_KEY) ?? "{}"); } catch { return {}; }
}
function saveSectionExecStore(s: SectionExecStore) {
  try { localStorage.setItem(APPT_SECTION_EXEC_KEY, JSON.stringify(s)); } catch { /**/ }
}

// ─── Section definitions ──────────────────────────────────────────────────────

interface SectionDef {
  key:         string;
  label:       string;
  tag:         string;
  color:       string;
  interactive: boolean;
  actionLabel?: string;
}

const SECTION_DEFS: SectionDef[] = [
  { key: "carePlan",        label: "Care Plan",        tag: "Care", color: "#10b981", interactive: false },
  { key: "diagnoses",       label: "Diagnosis",        tag: "Dx",   color: "#ef4444", interactive: false },
  { key: "labOrders",       label: "Lab Orders",       tag: "Lab",  color: "#f59e0b", interactive: true,  actionLabel: "Done" },
  { key: "prescriptions",   label: "Prescriptions",    tag: "Rx",   color: "#8b5cf6", interactive: true,  actionLabel: "Done" },
  { key: "imaging",         label: "Imaging",          tag: "Img",  color: "#0ea5e9", interactive: true,  actionLabel: "Done" },
  { key: "procedureOrders", label: "Procedure Orders", tag: "Proc", color: "#0d9488", interactive: true,  actionLabel: "Done" },
  { key: "referrals",       label: "Patient Referral", tag: "Ref",  color: "#6366f1", interactive: true,  actionLabel: "Done" },
  { key: "healthEd",        label: "Health Education", tag: "Ed",   color: "#f97316", interactive: true,  actionLabel: "Done" },
];

function computeSourceProgress(src: SectionSource, exec: SourceExec): { done: number; total: number } {
  let total = 0; let done = 0;
  for (const def of SECTION_DEFS) {
    if (!def.interactive) continue;
    const key = def.key as InteractiveSectionKey;
    const items = (src as unknown as Record<string, SectionItem[]>)[key] ?? [];
    total += items.length;
    const statuses = exec[key] ?? {};
    done += items.filter(it => statuses[it.uid]?.status === "done" || statuses[it.uid]?.status === "skipped").length;
  }
  return { done, total };
}

// ─── Data scanner ─────────────────────────────────────────────────────────────

function normItems(arr: string[], prefix: string): SectionItem[] {
  return arr.map((label, i) => ({ uid: `${prefix}-${i}`, label }));
}

function scanApptSectionSources(apptId: string, patientMrn: string | null): SectionSource[] {
  const allDocs = getHealthEdDocs();
  const docMap  = Object.fromEntries(allDocs.map(d => [d.id, d.title]));

  const seedSources: SectionSource[] = SOAP_DUMMY.map((note, i) => ({
    id:                   `sec-seed-${i}`,
    doctorName:           note.signedBy,
    signedAt:             note.signedAt,
    presentingComplaints: note.cc ?? [],
    diagnoses:      note.diagnoses.map((d, j) => ({ uid: `sec-seed-${i}-dx-${j}`, code: d.code, name: d.name, severity: d.severity })),
    labOrders:      normItems(note.labs, `sec-seed-${i}-lo`),
    prescriptions:  note.prescriptions.map((p, j) => ({ uid: `sec-seed-${i}-rx-${j}`, label: `${p.drug} — ${p.sig}` })),
    imaging:        normItems(note.imaging, `sec-seed-${i}-im`),
    procedureOrders:normItems(note.procedureOrders, `sec-seed-${i}-po`),
    referrals:      note.referrals.map((r, j) => ({ uid: `sec-seed-${i}-ref-${j}`, label: `${r.specialty}: ${r.reason}` })),
    healthEd:       normItems(note.healthEducation, `sec-seed-${i}-he`),
    carePlan:       note.carePlan?.trim() ? [{ uid: `sec-seed-${i}-cp`, label: note.carePlan.trim() }] : [],
  }));

  if (!patientMrn) return seedSources;

  const lsSources: SectionSource[] = [];

  function extractSource(raw: string, tag: string): SectionSource | null {
    try {
      const records = JSON.parse(raw) as SignedRecord[];
      const signed  = [...records].reverse().find(r => r.signed && r.noteState);
      if (!signed?.noteState) return null;
      const ns = signed.noteState as any;
      return {
        id:                   `sec-ls-${tag}`,
        doctorName:           signed.doctor ?? "Unknown Doctor",
        signedAt:             `${signed.date ?? ""}${signed.time ? ", " + signed.time : ""}`,
        presentingComplaints: ns.chiefComplaints ?? [],
        diagnoses:       (ns.diagnoses ?? []).map((d: any, di: number) => ({ uid: `sec-ls-${tag}-dx-${di}`, code: d.code ?? "", name: d.name ?? "", severity: d.severity ?? "" })),
        labOrders:       (ns.labOrders ?? []).flatMap((lo: any, oi: number) =>
          (lo.tests ?? []).map((t: any, ti: number) => ({ uid: `sec-ls-${tag}-lo-${oi}-${ti}`, label: t.name ?? `Lab test ${ti + 1}` }))),
        prescriptions:   (ns.formulary?.medicines ?? []).map((m: any, mi: number) => ({
          uid: `sec-ls-${tag}-rx-${mi}`, label: `${m.brand} ${m.strength} — ${m.frequency}${m.duration ? " × " + m.duration : ""}`,
        })),
        imaging:         (ns.imaging?.orders ?? []).map((o: any, oi: number) => ({ uid: `sec-ls-${tag}-im-${oi}`, label: `${o.modality} → ${o.bodyPart} → ${o.protocol}` })),
        procedureOrders: (ns.procedureOrders?.orders ?? []).map((o: any, oi: number) => ({ uid: `sec-ls-${tag}-po-${oi}`, label: `${o.name}${o.priority === "Urgent" ? " (Urgent)" : ""}` })),
        referrals:       (ns.referrals?.referrals ?? []).map((r: any, ri: number) => ({ uid: `sec-ls-${tag}-ref-${ri}`, label: r.speciality ? `${r.speciality}: ${r.reason}` : (r.reason ?? "Referral") })),
        healthEd:        (ns.healthEd?.docIds ?? []).map((id: string, hi: number) => ({ uid: `sec-ls-${tag}-he-${hi}`, label: docMap[id] ?? id })),
        carePlan:        ns.carePlan?.instructions?.trim() ? [{ uid: `sec-ls-${tag}-cp`, label: ns.carePlan.instructions.trim() }] : [],
      };
    } catch { return null; }
  }

  const prefix = `${SOAP_SIGNED_PREFIX}${apptId}_n`;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const src = extractSource(raw, key.slice(SOAP_SIGNED_PREFIX.length));
      if (src) lsSources.push(src);
    }
  } catch { /**/ }
  const mainRaw = localStorage.getItem(`${SOAP_SIGNED_PREFIX}${apptId}`);
  if (mainRaw) { const src = extractSource(mainRaw, apptId); if (src) lsSources.push(src); }

  return [...seedSources, ...lsSources];
}

// ─── Left panel ───────────────────────────────────────────────────────────────

function SectionLeftPanel({ sources, selectedId, execStore, onSelect }: {
  sources: SectionSource[]; selectedId: string | null;
  execStore: SectionExecStore; onSelect: (id: string) => void;
}) {
  const pending   = sources.filter(src => { const { done, total } = computeSourceProgress(src, execStore[src.id] ?? {}); return total === 0 || done < total; });
  const completed = sources.filter(src => { const { done, total } = computeSourceProgress(src, execStore[src.id] ?? {}); return total > 0 && done >= total; });

  function SourceCard({ src, isRecord }: { src: SectionSource; isRecord: boolean }) {
    const isSelected = src.id === selectedId;
    const exec = execStore[src.id] ?? {};
    const { done, total } = computeSourceProgress(src, exec);
    const pct = total ? Math.round((done / total) * 100) : 0;
    return (
      <button onClick={() => onSelect(src.id)}
        className={`w-full text-left rounded-xl border p-3.5 transition-all ${
          isSelected
            ? "bg-blue-50/60 border-[#4982CF]/60 shadow-sm ring-1 ring-[#4982CF]/30"
            : isRecord
              ? "bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
              : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
        }`}>
        <div className="flex items-start gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isSelected ? "bg-blue-100" : isRecord ? "bg-emerald-100" : "bg-slate-100"
          }`}>
            {isRecord
              ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              : <FileText className={`h-4 w-4 ${isSelected ? "text-[#4982CF]" : "text-slate-400"}`} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{src.doctorName}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{src.signedAt}</p>

            {/* Presenting complaints */}
            {src.presentingComplaints.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {src.presentingComplaints.slice(0, 3).map((c, ci) => (
                  <span key={ci} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 leading-none">{c}</span>
                ))}
                {src.presentingComplaints.length > 3 && (
                  <span className="text-[9px] text-slate-400">+{src.presentingComplaints.length - 3} more</span>
                )}
              </div>
            )}

            {/* Progress bar */}
            {total > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{done}/{total} done</span>
                  <span className="text-[10px] font-bold" style={{ color: pct === 100 ? "#10b981" : "#4982CF" }}>{pct}%</span>
                </div>
                <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "#4982CF" }} />
                </div>
              </div>
            )}
          </div>
          <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 mt-1 transition-transform ${isSelected ? "rotate-90 text-[#4982CF]" : "text-slate-300"}`} />
        </div>
      </button>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto">

        {/* ── Required Actions ── */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-2.5 flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 flex-1">Required Actions</span>
          {pending.length > 0 && <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5 leading-none">{pending.length}</span>}
        </div>
        <div className="px-3 py-3 space-y-2">
          {pending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-6 flex flex-col items-center gap-1.5 text-center">
              <Heart className="h-4 w-4 text-slate-300" />
              <p className="text-xs text-slate-400">All actions completed</p>
            </div>
          ) : pending.map(src => <SourceCard key={src.id} src={src} isRecord={false} />)}
        </div>

        {/* ── All Records ── */}
        <div className="border-t border-b border-slate-100 bg-white px-4 py-2.5 flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 flex-1">All Records</span>
          {completed.length > 0 && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-2 py-0.5 leading-none">{completed.length}</span>}
        </div>
        <div className="px-3 py-3 space-y-2">
          {completed.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-6 flex flex-col items-center gap-1.5 text-center">
              <CheckCircle2 className="h-4 w-4 text-slate-300" />
              <p className="text-xs text-slate-400">No completed records yet</p>
            </div>
          ) : completed.map(src => <SourceCard key={src.id} src={src} isRecord={true} />)}
        </div>

      </div>
    </div>
  );
}

// ─── Severity badge (Diagnosis) ───────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const s = (severity ?? "").toLowerCase();
  const cls = s === "severe" || s === "critical" ? "bg-red-50 text-red-600 border-red-200"
    : s === "moderate" ? "bg-amber-50 text-amber-700 border-amber-200"
    : s === "mild"     ? "bg-green-50 text-green-700 border-green-200"
    : "bg-slate-100 text-slate-500 border-slate-200";
  return severity ? <span className={`text-[9px] font-bold border rounded-full px-1.5 py-0.5 ${cls}`}>{severity}</span> : null;
}

// ─── Right panel ──────────────────────────────────────────────────────────────

function SectionRightPanel({ source, execStore, onSetStatus }: {
  source: SectionSource | null;
  execStore: SectionExecStore;
  onSetStatus: (srcId: string, key: InteractiveSectionKey, uid: string, status: "done" | "skipped" | "pending", reason?: string) => void;
}) {
  const [activeTab,   setActiveTab]   = useState<string>("carePlan");
  const [skipMode,    setSkipMode]    = useState<string | null>(null);
  const [skipReason,  setSkipReason]  = useState("");

  useEffect(() => { setActiveTab("carePlan"); }, [source?.id]);

  if (!source) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-10">
        <div>
          <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-blue-200" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Select a SOAP note</p>
          <p className="text-xs text-slate-400 mt-1">Choose a signed note from the left to review its sections.</p>
        </div>
      </div>
    );
  }

  const srcExec = execStore[source.id] ?? {};
  const activeDef = SECTION_DEFS.find(d => d.key === activeTab) ?? SECTION_DEFS[0];

  function getSectionItems(def: SectionDef): SectionItem[] {
    return (source as unknown as Record<string, SectionItem[]>)[def.key] ?? [];
  }
  function getDoneCount(def: SectionDef): number {
    if (!def.interactive) return 0;
    const items = getSectionItems(def);
    const statuses = srcExec[def.key as InteractiveSectionKey] ?? {};
    return items.filter(it => statuses[it.uid]).length;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-50/50 border-b border-slate-100 px-5 py-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <FileText className="h-4 w-4 text-[#4982CF]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{source.doctorName}</p>
          <p className="text-[11px] text-slate-500">{source.signedAt}</p>
        </div>
      </div>

      {/* Section tab strip */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white overflow-x-auto">
        <div className="flex min-w-max">
          {SECTION_DEFS.map(def => {
            const items   = getSectionItems(def);
            const done    = getDoneCount(def);
            const isActive = activeTab === def.key;
            return (
              <button key={def.key} onClick={() => setActiveTab(def.key)}
                className={`relative flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-2.5 text-[10px] font-bold transition-colors border-b-2 ${isActive ? "border-b-2 text-slate-800" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                style={{ borderBottomColor: isActive ? def.color : "transparent" }}>
                <span>{def.label}</span>
                {items.length > 0 && (
                  <span className="text-[9px] font-black rounded-full px-1.5 py-0.5 leading-none"
                    style={{ background: isActive ? def.color + "20" : "#f1f5f9", color: isActive ? def.color : "#94a3b8" }}>
                    {def.interactive ? `${done}/${items.length}` : items.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Care Plan tab — read-only prose */}
        {activeTab === "carePlan" && (() => {
          const text = source.carePlan[0]?.label ?? "";
          return text ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-md bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-black text-emerald-600">CP</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Care Plan</span>
              </div>
              <p className="text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap select-text">{text}</p>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">No care plan recorded</div>
          );
        })()}

        {/* Diagnosis tab — read-only */}
        {activeTab === "diagnoses" && (
          <div className="space-y-2">
            {source.diagnoses.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No diagnoses recorded</div>
            ) : source.diagnoses.map(dx => (
              <div key={dx.uid} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50">
                  <span className="text-[9px] font-black text-red-500">Dx</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-800 leading-snug">{dx.name}</p>
                  {dx.code && <p className="text-[10px] text-slate-400 mt-0.5">Code: {dx.code}</p>}
                </div>
                <SeverityBadge severity={dx.severity} />
              </div>
            ))}
          </div>
        )}

        {/* Interactive sections */}
        {activeTab !== "diagnoses" && activeTab !== "carePlan" && (() => {
          const def      = activeDef;
          const items    = getSectionItems(def);
          const statuses = srcExec[def.key as InteractiveSectionKey] ?? {};
          const sectionKey = def.key as InteractiveSectionKey;

          if (items.length === 0) {
            return <div className="text-center py-8 text-xs text-slate-400">No items in this section</div>;
          }
          return (
            <div className="space-y-2">
              {items.map(item => {
                const entry   = statuses[item.uid];
                const isDone  = entry?.status === "done";
                const isSkipped = entry?.status === "skipped";
                const isPending = !entry;
                const inSkipMode = skipMode === item.uid;

                return (
                  <div key={item.uid} className="rounded-xl border overflow-hidden transition-all"
                    style={{ borderColor: isDone ? def.color + "60" : isSkipped ? "#fca5a5" : "#e2e8f0", background: isDone ? def.color + "08" : isSkipped ? "#fff5f5" : "#fff" }}>

                    {/* Main row */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Checkbox — click toggles pending ↔ done */}
                      <button
                        onClick={() => onSetStatus(source.id, sectionKey, item.uid, isDone ? "pending" : "done")}
                        className="h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ borderColor: isDone ? def.color : isSkipped ? "#f87171" : "#cbd5e1", background: isDone ? def.color : "transparent" }}>
                        {isDone    && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                        {isSkipped && <X className="h-3 w-3 text-red-400" strokeWidth={3} />}
                      </button>

                      {/* Label — strikethrough only when skipped */}
                      <span className={`flex-1 text-[12px] leading-snug ${isSkipped ? "line-through text-slate-400" : "text-slate-700 font-medium"}`}>
                        {item.label}
                      </span>

                      {/* Done badge */}
                      {isDone && (
                        <span className="text-[9px] font-black rounded-full px-1.5 py-0.5 flex-shrink-0"
                          style={{ background: def.color + "20", color: def.color }}>
                          {def.actionLabel}
                        </span>
                      )}

                      {/* Skipped badge */}
                      {isSkipped && (
                        <span className="text-[9px] font-black rounded-full px-1.5 py-0.5 flex-shrink-0 bg-red-50 text-red-500 border border-red-200">
                          Skipped
                        </span>
                      )}

                      {/* Skip button (pending only) */}
                      {isPending && !inSkipMode && (
                        <button
                          onClick={() => { setSkipMode(item.uid); setSkipReason(""); }}
                          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 transition-all flex-shrink-0">
                          <SkipForward className="h-3 w-3" /> Skip
                        </button>
                      )}

                      {/* Undo button (done or skipped) */}
                      {(isDone || isSkipped) && (
                        <button
                          onClick={() => onSetStatus(source.id, sectionKey, item.uid, "pending")}
                          className="h-6 w-6 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300 hover:text-slate-500 hover:border-slate-300 transition-all flex-shrink-0">
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Skip reason row (shown when skipped and has reason) */}
                    {isSkipped && entry?.reason && (
                      <div className="px-4 pb-2.5 -mt-1">
                        <p className="text-[10px] text-red-400 italic">Reason: {entry.reason}</p>
                      </div>
                    )}

                    {/* Inline skip input */}
                    {inSkipMode && (
                      <div className="px-4 pb-3 pt-0">
                        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                          <input
                            autoFocus
                            value={skipReason}
                            onChange={e => setSkipReason(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") { onSetStatus(source.id, sectionKey, item.uid, "skipped", skipReason.trim() || undefined); setSkipMode(null); }
                              if (e.key === "Escape") setSkipMode(null);
                            }}
                            placeholder="Reason for skipping (optional)…"
                            className="flex-1 text-xs text-slate-700 bg-transparent outline-none placeholder:text-red-300" />
                          <button
                            onClick={() => { onSetStatus(source.id, sectionKey, item.uid, "skipped", skipReason.trim() || undefined); setSkipMode(null); }}
                            className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-red-500 text-white hover:bg-red-400 transition-colors flex-shrink-0">
                            Confirm
                          </button>
                          <button
                            onClick={() => setSkipMode(null)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-100 transition-colors flex-shrink-0">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

function ApptCarePlanSection({ appt }: { appt: Appointment }) {
  const patientMrn = appt.patientMrn || null;
  const [sources,   setSources]   = useState<SectionSource[]>(() => scanApptSectionSources(appt.id, patientMrn));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [execStore,  setExecStore]  = useState<SectionExecStore>(loadSectionExecStore);

  useEffect(() => {
    setSources(scanApptSectionSources(appt.id, patientMrn));
    setSelectedId(null);
  }, [appt.id, patientMrn]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === `${SOAP_SIGNED_PREFIX}${appt.id}` || e.key?.startsWith(`${SOAP_SIGNED_PREFIX}${appt.id}_n`)) {
        setSources(scanApptSectionSources(appt.id, patientMrn));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [appt.id, patientMrn]);

  function handleSetStatus(srcId: string, key: InteractiveSectionKey, uid: string, status: "done" | "skipped" | "pending", reason?: string) {
    setExecStore(prev => {
      const srcExec: SourceExec = { ...(prev[srcId] ?? {}) };
      const sectionMap: SectionItemStatuses = { ...(srcExec[key] ?? {}) };
      if (status === "pending") {
        delete sectionMap[uid];
      } else {
        sectionMap[uid] = { status, ...(reason ? { reason } : {}) };
      }
      srcExec[key] = sectionMap;
      const next = { ...prev, [srcId]: srcExec };
      saveSectionExecStore(next);
      return next;
    });
  }

  const selectedSource = selectedId ? (sources.find(s => s.id === selectedId) ?? null) : null;

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-[42%] flex-shrink-0 border-r border-slate-200 overflow-hidden">
        <SectionLeftPanel sources={sources} selectedId={selectedId} execStore={execStore} onSelect={setSelectedId} />
      </div>
      <SectionRightPanel source={selectedSource} execStore={execStore} onSetStatus={handleSetStatus} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GOALS SECTION
// ══════════════════════════════════════════════════════════════════════════════

interface GoalItem {
  goalUid: string; title: string; priority: "Low" | "Normal" | "High";
  targetDate: string; diagnoses: { code: string; name: string; severity: string }[];
  carePlanSteps: string[]; visitDescription: string;
}
interface GoalDraft {
  draftId: string; goalUid: string; nurseNote: string;
  status: "in-progress" | "partially-completed" | "completed";
  startedAt: number; updatedAt: number;
}
interface SoapNoteGroup { groupId: string; doctorName: string; noteDate: string; firstDiagnosis: string; goals: GoalItem[]; }

function loadApptGoalDrafts(): GoalDraft[] {
  try { return JSON.parse(localStorage.getItem(APPT_GOAL_DRAFTS_KEY) ?? "[]"); } catch { return []; }
}
function persistApptGoalDrafts(d: GoalDraft[]): void {
  try { localStorage.setItem(APPT_GOAL_DRAFTS_KEY, JSON.stringify(d)); } catch { /**/ }
}

function loadApptGoalGroups(apptId: string): SoapNoteGroup[] {
  const groups: SoapNoteGroup[] = [];
  SOAP_DUMMY.forEach((note, ni) => {
    if (note.patientGoals.length === 0) return;
    groups.push({
      groupId: `seed-${ni}`, doctorName: note.signedBy, noteDate: note.signedAt,
      firstDiagnosis: note.diagnoses[0]?.name ?? "",
      goals: note.patientGoals.map((title, gi) => ({
        goalUid: `seed-${ni}-${gi}`, title, priority: "Normal" as const, targetDate: "",
        diagnoses: note.diagnoses, carePlanSteps: note.carePlan.trim() ? [note.carePlan] : [], visitDescription: note.visitDescription,
      })),
    });
  });
  const apptDraftPrefix = `soap_draft_${apptId}_n`;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(apptDraftPrefix)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const ns = JSON.parse(raw) as { patientGoals?: { goals?: Array<{ uid: string; title: string; priority?: "Low" | "Normal" | "High"; targetDate?: string }> }; diagnoses?: { code: string; name: string; severity: string }[]; carePlan?: string[]; visitDescription?: string };
      const goals = ns?.patientGoals?.goals ?? [];
      if (goals.length === 0) continue;
      const sessionId = key.replace("soap_draft_", "");
      groups.push({
        groupId: `draft-${sessionId}`, doctorName: sessionId, noteDate: "", firstDiagnosis: ns.diagnoses?.[0]?.name ?? "",
        goals: goals.map(g => ({ goalUid: g.uid, title: g.title, priority: g.priority ?? "Normal", targetDate: g.targetDate ?? "", diagnoses: ns.diagnoses ?? [], carePlanSteps: ns.carePlan ?? [], visitDescription: ns.visitDescription ?? "" })),
      });
    }
  } catch { /**/ }
  return groups;
}

function goalPriCls(priority: "Low" | "Normal" | "High"): string {
  return priority === "High" ? "bg-red-50 text-red-600 border-red-200" : priority === "Low" ? "bg-green-50 text-green-600 border-green-200" : "bg-blue-50 text-blue-600 border-blue-200";
}
function goalStatusChip(status: GoalDraft["status"] | "pending") {
  if (status === "completed") return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">Completed</span>;
  if (status === "partially-completed") return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-orange-50 text-orange-700 border-orange-200">Partially Done</span>;
  if (status === "in-progress") return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">In Progress</span>;
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-slate-100 text-slate-500 border-slate-200">Pending</span>;
}

function GoalsLeftPanel({ requiredGroups, recordGroups, drafts, activeGoalUid, activeRecordUid, onSelectGoal, onViewRecord }: {
  requiredGroups: SoapNoteGroup[]; recordGroups: SoapNoteGroup[]; drafts: GoalDraft[];
  activeGoalUid: string | null; activeRecordUid: string | null;
  onSelectGoal: (uid: string) => void; onViewRecord: (uid: string) => void;
}) {
  const [collapsedRequired, setCollapsedRequired] = useState<Set<string>>(new Set());
  const [openRecords, setOpenRecords] = useState<Set<string>>(new Set());

  function getDraft(uid: string) { return drafts.find(d => d.goalUid === uid); }
  function getStatus(uid: string): GoalDraft["status"] | "pending" { return getDraft(uid)?.status ?? "pending"; }
  function pendingCount(group: SoapNoteGroup) {
    return group.goals.filter(g => { const s = getStatus(g.goalUid); return s === "pending" || s === "in-progress"; }).length;
  }

  function GroupHeader({ group, isOpen, onToggle, badge }: { group: SoapNoteGroup; isOpen: boolean; onToggle: () => void; badge?: number }) {
    return (
      <div className="px-3 py-2.5 bg-slate-50/80 border-b border-slate-100 cursor-pointer hover:bg-slate-100/60 transition-colors flex items-center gap-2" onClick={onToggle}>
        <div className="h-6 w-6 rounded-md bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
          <ChevronRight className={`h-3 w-3 text-slate-500 transition-transform ${isOpen ? "rotate-90" : ""}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-700 truncate">{group.doctorName}{group.noteDate ? ` · ${group.noteDate}` : ""}</p>
          {group.firstDiagnosis && <p className="text-[9px] text-slate-400 truncate">{group.firstDiagnosis}</p>}
        </div>
        {badge !== undefined && badge > 0 && <span className="text-[9px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-1.5 py-0.5 leading-none flex-shrink-0">{badge}</span>}
      </div>
    );
  }

  function GoalRow({ goal, isFinalized, viewOnly = false }: { goal: GoalItem; isFinalized: boolean; viewOnly?: boolean }) {
    const active  = !viewOnly && activeGoalUid === goal.goalUid;
    const viewing = viewOnly  && activeRecordUid === goal.goalUid;
    const status  = getStatus(goal.goalUid);
    return (
      <div className={`mx-3 mb-1.5 rounded-xl border transition-all ${isFinalized ? "opacity-55" : ""} ${active ? "bg-green-50/70 border-green-300/60 shadow-sm ring-1 ring-green-200/60" : viewing ? "bg-emerald-50/60 border-emerald-300/60 shadow-sm ring-1 ring-emerald-200/60" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"}`}>
        <button onClick={() => viewOnly ? onViewRecord(goal.goalUid) : onSelectGoal(goal.goalUid)} className="w-full text-left px-3 py-2.5">
          <div className="flex items-start gap-2">
            <div className={`h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${active || viewing ? "bg-emerald-100" : "bg-green-50"}`}>
              <Target className={`h-3 w-3 ${active || viewing ? "text-emerald-600" : "text-green-400"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-slate-800 leading-snug">{goal.title}</p>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${goalPriCls(goal.priority)}`}>{goal.priority}</span>
                {goalStatusChip(status)}
              </div>
            </div>
          </div>
        </button>
      </div>
    );
  }

  const totalPending = requiredGroups.reduce((s, g) => s + pendingCount(g), 0);

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-2 flex-shrink-0">
        <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-700 flex-1">Required Actions</span>
        {totalPending > 0 && <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5 leading-none">{totalPending}</span>}
      </div>
      {requiredGroups.length === 0 ? (
        <div className="px-3 py-6 flex flex-col items-center gap-1.5 text-center">
          <Target className="h-4 w-4 text-slate-300" />
          <p className="text-xs text-slate-400">No pending goals</p>
        </div>
      ) : requiredGroups.map(group => {
        const isOpen = !collapsedRequired.has(group.groupId);
        return (
          <div key={group.groupId} className="border-b border-slate-100">
            <GroupHeader group={group} isOpen={isOpen}
              onToggle={() => setCollapsedRequired(prev => { const n = new Set(prev); isOpen ? n.add(group.groupId) : n.delete(group.groupId); return n; })}
              badge={pendingCount(group)} />
            {isOpen && <div className="pt-2 pb-1">{group.goals.map(goal => <GoalRow key={goal.goalUid} goal={goal} isFinalized={["completed","partially-completed"].includes(getStatus(goal.goalUid))} />)}</div>}
          </div>
        );
      })}
      <div className="bg-white border-y border-slate-100 px-4 py-3 flex items-center gap-2 flex-shrink-0 mt-2">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-700 flex-1">All Records</span>
        {recordGroups.length > 0 && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-2 py-0.5 leading-none">{recordGroups.length}</span>}
      </div>
      {recordGroups.length === 0 ? (
        <div className="px-3 py-5 pb-6 flex flex-col items-center gap-1.5 text-center">
          <CheckCircle2 className="h-4 w-4 text-slate-300" />
          <p className="text-xs text-slate-400">Groups move here when all goals are finalized</p>
        </div>
      ) : (
        <div className="pb-6">
          {recordGroups.map(group => {
            const isOpen = openRecords.has(group.groupId);
            return (
              <div key={group.groupId} className="border-b border-slate-100">
                <GroupHeader group={group} isOpen={isOpen}
                  onToggle={() => setOpenRecords(prev => { const n = new Set(prev); isOpen ? n.delete(group.groupId) : n.add(group.groupId); return n; })} />
                {isOpen && <div className="pt-2 pb-1">{group.goals.map(goal => <GoalRow key={goal.goalUid} goal={goal} isFinalized={false} viewOnly />)}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const GOAL_STATUS_OPTIONS: { value: GoalDraft["status"]; label: string; activeCls: string }[] = [
  { value: "in-progress",         label: "In Progress", activeCls: "bg-amber-50 text-amber-700 border-amber-300"    },
  { value: "partially-completed", label: "Partial",     activeCls: "bg-orange-50 text-orange-700 border-orange-300" },
  { value: "completed",           label: "Completed",   activeCls: "bg-emerald-50 text-emerald-700 border-emerald-300" },
];

function GoalsWorkspace({ goalItem, goalDraft, readOnly = false, onSave, onDiscard }: {
  goalItem: GoalItem | null; goalDraft: GoalDraft | null; readOnly?: boolean;
  onSave: (goalUid: string, note: string, status: GoalDraft["status"]) => void; onDiscard: () => void;
}) {
  const [noteText,       setNoteText]       = useState(goalDraft?.nurseNote ?? "");
  const [selectedStatus, setSelectedStatus] = useState<GoalDraft["status"]>(goalDraft?.status ?? "in-progress");
  const [soapOpen,       setSoapOpen]       = useState(false);

  useEffect(() => {
    setNoteText(goalDraft?.nurseNote ?? "");
    setSelectedStatus(goalDraft?.status ?? "in-progress");
    setSoapOpen(false);
  }, [goalItem?.goalUid]);

  function SoapContextCard() {
    return (
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <button onClick={() => setSoapOpen(o => !o)} className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100/60 transition-colors text-left">
          <ClipboardList className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex-1">SOAP Note Context</span>
          <ChevronRight className={`h-3.5 w-3.5 text-slate-400 transition-transform ${soapOpen ? "rotate-90" : ""}`} />
        </button>
        {soapOpen && goalItem && (
          <div className="px-4 py-3 space-y-3 bg-white border-t border-slate-100">
            {goalItem.diagnoses.length > 0 && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Diagnoses</p>
                <div className="space-y-1.5">
                  {goalItem.diagnoses.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px]">
                      <span className="font-mono text-slate-400 flex-shrink-0 mt-px">{d.code}</span>
                      <span className="text-slate-700 flex-1 leading-snug">{d.name}</span>
                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${d.severity === "High" ? "bg-red-50 text-red-600" : d.severity === "Moderate" ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}>{d.severity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {goalItem.carePlanSteps.length > 0 && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Care Plan</p>
                <ul className="space-y-1">
                  {goalItem.carePlanSteps.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[10px] text-slate-600">
                      <span className="h-3.5 w-3.5 rounded-full bg-[#4982CF]/10 text-[#4982CF] flex items-center justify-center text-[8px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {goalItem.visitDescription && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Visit Summary</p>
                <p className="text-[10px] text-slate-600 leading-relaxed">{goalItem.visitDescription}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center px-5 py-2.5 border-b border-slate-100 bg-slate-50/50 gap-2">
        <Target className="h-4 w-4 text-green-600 flex-shrink-0" />
        <span className="text-xs text-slate-600 font-medium truncate flex-1">{goalItem ? goalItem.title : "Goals"}</span>
        {readOnly && <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0"><CheckCircle2 className="h-2.5 w-2.5" /> Finalized</span>}
      </div>
      {!goalItem ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-green-50 flex items-center justify-center"><Target className="h-8 w-8 text-green-300" /></div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">Select a goal to begin</p>
            <p className="text-xs text-slate-400 mt-1">Click any goal from the list to review and document.</p>
          </div>
        </div>
      ) : readOnly ? (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <SoapContextCard />
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
            <div className="flex items-start gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-800 flex-1 leading-snug">{goalItem.title}</p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${goalPriCls(goalItem.priority)}`}>{goalItem.priority}</span>
            </div>
            {goalItem.targetDate && <p className="text-[10px] text-slate-500">Target: <span className="font-semibold text-slate-700">{goalItem.targetDate}</span></p>}
            {goalDraft?.status && <div className="flex items-center gap-1.5"><span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Final status:</span>{goalStatusChip(goalDraft.status)}</div>}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Progress Note</p>
            {goalDraft?.nurseNote ? (
              <div className="text-xs text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 leading-relaxed whitespace-pre-wrap">{goalDraft.nurseNote}</div>
            ) : (
              <div className="text-xs text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 rounded-xl px-3 py-4 text-center">No progress note was recorded for this goal.</div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <SoapContextCard />
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
              <div className="flex items-start gap-2 flex-wrap">
                <p className="text-sm font-bold text-slate-800 flex-1 leading-snug">{goalItem.title}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${goalPriCls(goalItem.priority)}`}>{goalItem.priority}</span>
              </div>
              {goalItem.targetDate && <p className="text-[10px] text-slate-500 mt-1.5">Target: <span className="font-semibold text-slate-700">{goalItem.targetDate}</span></p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Progress Note</label>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={5} placeholder="Add progress observations for this goal…"
                className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 resize-none transition-all placeholder:text-slate-300" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Status</label>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                {GOAL_STATUS_OPTIONS.map((opt, i) => (
                  <button key={opt.value} onClick={() => setSelectedStatus(opt.value)}
                    className={`flex-1 text-[10px] font-bold py-2.5 transition-all cursor-pointer ${selectedStatus === opt.value ? opt.activeCls : "bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600"} ${i > 0 ? "border-l border-slate-200" : ""}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 border-t border-slate-200 px-5 py-3 bg-white flex gap-3">
            <button onClick={onDiscard} className="flex-1 h-9 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer">Discard</button>
            <button onClick={() => goalItem && onSave(goalItem.goalUid, noteText, selectedStatus)}
              className="flex-[2] flex items-center justify-center gap-2 h-9 rounded-xl bg-[#4982CF] hover:bg-[#3a6eb5] text-white text-xs font-bold transition-colors cursor-pointer">
              <CheckCircle2 className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ApptGoalsSection({ appt }: { appt: Appointment }) {
  const [drafts,        setDrafts]        = useState<GoalDraft[]>(loadApptGoalDrafts);
  const [activeGoalUid, setActiveGoalUid] = useState<string | null>(null);
  const [viewOnly,      setViewOnly]      = useState(false);

  const groups = useMemo(() => loadApptGoalGroups(appt.id), [appt.id]);

  function getStatus(goalUid: string): GoalDraft["status"] | "pending" { return drafts.find(d => d.goalUid === goalUid)?.status ?? "pending"; }
  function isGroupFinalized(group: SoapNoteGroup): boolean {
    return group.goals.every(g => { const s = getStatus(g.goalUid); return s === "completed" || s === "partially-completed"; });
  }

  const requiredGroups = groups.filter(g => !isGroupFinalized(g));
  const recordGroups   = groups.filter(g =>  isGroupFinalized(g));
  const allGoals       = groups.flatMap(g => g.goals);
  const activeItem     = allGoals.find(g => g.goalUid === activeGoalUid) ?? null;
  const activeDraft    = drafts.find(d => d.goalUid === activeGoalUid) ?? null;

  function selectGoal(goalUid: string) {
    setViewOnly(false);
    setActiveGoalUid(goalUid);
    setDrafts(prev => {
      if (prev.find(d => d.goalUid === goalUid)) return prev;
      const next = [...prev, { draftId: goalUid, goalUid, nurseNote: "", status: "in-progress" as const, startedAt: Date.now(), updatedAt: Date.now() }];
      persistApptGoalDrafts(next);
      return next;
    });
  }
  function viewRecord(goalUid: string) { setViewOnly(true); setActiveGoalUid(goalUid); }
  function saveGoal(goalUid: string, nurseNote: string, status: GoalDraft["status"]) {
    setDrafts(prev => {
      const exists = prev.find(d => d.goalUid === goalUid);
      const next = exists
        ? prev.map(d => d.goalUid === goalUid ? { ...d, nurseNote, status, updatedAt: Date.now() } : d)
        : [...prev, { draftId: goalUid, goalUid, nurseNote, status, startedAt: Date.now(), updatedAt: Date.now() }];
      persistApptGoalDrafts(next);
      return next;
    });
    setActiveGoalUid(null);
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-1/2 flex-shrink-0 border-r border-slate-200 overflow-hidden">
        <GoalsLeftPanel requiredGroups={requiredGroups} recordGroups={recordGroups} drafts={drafts}
          activeGoalUid={viewOnly ? null : activeGoalUid} activeRecordUid={viewOnly ? activeGoalUid : null}
          onSelectGoal={selectGoal} onViewRecord={viewRecord} />
      </div>
      <GoalsWorkspace goalItem={activeItem} goalDraft={activeDraft} readOnly={viewOnly}
        onSave={saveGoal} onDiscard={() => setActiveGoalUid(null)} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TRIAGE SECTION
// ══════════════════════════════════════════════════════════════════════════════

interface TriageDraft {
  draftId: string; algoId: string; algoName: string;
  patientRef: string | null; patientName: string | null;
  totalSteps: number; stepIndex: number; answers: Record<string, StepAnswer>;
  startedAt: number; updatedAt: number;
}

function loadApptTriageDrafts(): TriageDraft[] {
  try { const raw = localStorage.getItem(APPT_TRIAGE_DRAFTS_KEY); if (raw) return JSON.parse(raw) as TriageDraft[]; } catch { /**/ }
  return [];
}
function persistApptTriageDrafts(drafts: TriageDraft[]): void {
  try { localStorage.setItem(APPT_TRIAGE_DRAFTS_KEY, JSON.stringify(drafts)); } catch { /**/ }
}
function genApptTriageDraftId() { return `atd-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }

function ApptTriageSplitPanel({ appt }: { appt: Appointment }) {
  const patient = appt.patientMrn
    ? ({ id: appt.patientMrn, mrn: appt.patientMrn, name: appt.patientName, dob: "", gender: "M" as const, phone: appt.patientPhone ?? "" })
    : null;

  const [drafts, setDrafts] = useState<TriageDraft[]>(() => {
    const all = loadApptTriageDrafts();
    const real = all.filter(d => d.stepIndex > 0 || Object.keys(d.answers).length > 0);
    if (real.length !== all.length) persistApptTriageDrafts(real);
    return real;
  });
  const [activeDraftId, setActiveDraftId] = useState<string | null>(() => {
    const all = loadApptTriageDrafts().filter(d => d.stepIndex > 0 || Object.keys(d.answers).length > 0);
    if (all.length === 0) return null;
    return [...all].sort((a, b) => b.updatedAt - a.updatedAt)[0].draftId;
  });
  const [completedSessions, setCompletedSessions] = useState<TriageSession[]>(() => loadSessionsFromKey(APPT_SESSIONS_KEY));
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const activeDraft = drafts.find(d => d.draftId === activeDraftId) ?? null;

  const patientMrn = appt.patientMrn || null;
  const visibleSessions = patientMrn
    ? completedSessions.filter(s => s.patientRef === patientMrn)
    : completedSessions;

  function mutateDrafts(fn: (prev: TriageDraft[]) => TriageDraft[]) {
    setDrafts(prev => { const next = fn(prev); persistApptTriageDrafts(next); return next; });
  }
  function handleAlgoSelected(algoId: string, algoName: string, totalSteps: number) {
    const draftId = genApptTriageDraftId();
    mutateDrafts(prev => [...prev, {
      draftId, algoId, algoName, patientRef: appt.patientMrn || null, patientName: appt.patientName || null,
      totalSteps, stepIndex: 0, answers: {}, startedAt: Date.now(), updatedAt: Date.now(),
    }]);
    setActiveDraftId(draftId);
  }
  function handleDraftChange(algoId: string, stepIndex: number, answers: Record<string, StepAnswer>) {
    if (!activeDraftId) return;
    mutateDrafts(prev => prev.map(d => d.draftId === activeDraftId ? { ...d, algoId, stepIndex, answers, updatedAt: Date.now() } : d));
  }
  function discardDraft(draftId: string) {
    mutateDrafts(prev => prev.filter(d => d.draftId !== draftId));
    if (activeDraftId === draftId) setActiveDraftId(null);
  }
  function handleFinishTriage() {
    if (activeDraftId) mutateDrafts(prev => prev.filter(d => d.draftId !== activeDraftId));
    setActiveDraftId(null);
    setCompletedSessions(loadSessionsFromKey(APPT_SESSIONS_KEY));
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-1/2 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto bg-white">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 flex-1">Required Actions</span>
          {drafts.length > 0 && <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5 leading-none">{drafts.length}</span>}
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
              <div key={d.draftId} className={`rounded-xl border transition-all ${active ? "bg-[#4982CF]/8 border-[#4982CF]/40 shadow-sm ring-1 ring-[#4982CF]/20" : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"}`}>
                <button onClick={() => setActiveDraftId(d.draftId)} className="w-full text-left p-3.5 pr-2">
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
                        <span className="text-[10px] text-slate-400 tabular-nums flex-shrink-0">Step {d.stepIndex + 1}/{d.totalSteps}</span>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); discardDraft(d.draftId); }}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0 mt-0.5">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
        <div className="sticky top-0 z-10 bg-white border-t border-b border-slate-100 px-4 py-3 flex items-center gap-2 mt-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 flex-1">All Records</span>
          {completedSessions.length > 0 && <span className="text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 rounded-full px-2 py-0.5 leading-none">{completedSessions.length}</span>}
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
                <button onClick={() => setExpandedRecord(expanded ? null : s.id)} className="w-full text-left p-3.5 flex items-start gap-3 hover:bg-white transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="h-4 w-4 text-green-500" /></div>
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
      <div className="w-1/2 flex flex-col overflow-hidden">
        {activeDraftId && (
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium truncate">{activeDraft?.algoName}</span>
            <button onClick={() => setActiveDraftId(null)} className="flex items-center gap-1.5 text-xs font-semibold text-[#4982CF] hover:text-[#3a6fb8] transition-colors flex-shrink-0 ml-3">
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
          sessionsKey={APPT_SESSIONS_KEY}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — ApptNursingDrawer
// ══════════════════════════════════════════════════════════════════════════════

export function ApptNursingDrawer({ appt, onClose, initialCategory }: { appt: Appointment; onClose: () => void; initialCategory?: NurseCategory }) {
  const [activeCategory, setActiveCategory] = useState<NurseCategory>(initialCategory ?? "vitals");
  const [fullscreen, setFullscreen]         = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col transition-all duration-300 ease-in-out border-l border-slate-200 ${fullscreen ? "w-full" : "w-[80%]"}`}>

        {/* ── HEADER ── */}
        <div className="flex-shrink-0 flex items-center border-b border-slate-200 bg-white">
          <div className="px-5 py-3 border-r border-slate-100 flex-shrink-0">
            <p className="text-sm font-bold text-slate-900 leading-tight">{appt.patientName || "Patient"}</p>
            {appt.patientMrn && <p className="text-[11px] text-slate-400 font-mono mt-0.5">{appt.patientMrn}</p>}
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

        {/* ── BODY ── */}
        {activeCategory === "vitals"     && <ApptVitalsSection    appt={appt} />}
        {activeCategory === "history"    && <ApptHistorySplitPanel appt={appt} />}
        {activeCategory === "procedures" && <ApptProcedureSection appt={appt} />}
        {activeCategory === "care-plan"  && <ApptCarePlanSection   appt={appt} />}
        {activeCategory === "goals"      && <ApptGoalsSection appt={appt} />}
        {activeCategory === "triage"     && <ApptTriageSplitPanel  appt={appt} />}

      </div>

      {/* ── Confirm save modal ── */}
      {showConfirm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => setShowConfirm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-white rounded-2xl shadow-2xl p-6 w-80">
            <p className="text-sm font-bold text-slate-800 mb-1">Save Nursing Record</p>
            <p className="text-xs text-slate-500 mb-4">All data is auto-saved as drafts. Use the <span className="font-semibold">Save &amp; Complete</span> button within each section to finalize a record.</p>
            <button onClick={() => setShowConfirm(false)}
              className="w-full h-9 rounded-xl bg-[#4982CF] text-white text-sm font-bold hover:bg-[#3a6fb8] transition-colors">
              Got it
            </button>
          </div>
        </>
      )}
    </>
  );
}
