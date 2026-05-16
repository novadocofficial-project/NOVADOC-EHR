import { useState, useMemo } from "react";
import {
  X, ChevronRight, User, AlertCircle, Heart, Activity,
  ClipboardList, Stethoscope, Target, TrendingUp, CheckCircle2,
  Maximize2, Minimize2, ChevronUp, ChevronDown,
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
import { useNursingConfig } from "@/hooks/useNursingConfig";
import { useNursingCareTasks } from "@/hooks/useNursingCareTasks";
import { useApptNursingData } from "@/hooks/useApptNursingData";
import { CareTasksTab, PatientGoalsTab } from "@/pages/NursingCareTasksTab";
import { useToast } from "@/hooks/use-toast";

// ─── Category types ───────────────────────────────────────────────────────────

type NurseCategory = "triage" | "history" | "vitals" | "care-plan" | "procedures" | "goals";

const CATEGORIES: { id: NurseCategory; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: "triage",     label: "Triage",             icon: <AlertCircle className="h-5 w-5" />,  color: "text-red-600",    bg: "bg-red-50 border-red-200"     },
  { id: "history",    label: "History",            icon: <ClipboardList className="h-5 w-5" />, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  { id: "vitals",     label: "Vital Signs",        icon: <Activity className="h-5 w-5" />,      color: "text-[#4982CF]", bg: "bg-blue-50 border-blue-200"   },
  { id: "care-plan",  label: "Care Plan",          icon: <Heart className="h-5 w-5" />,         color: "text-rose-600",  bg: "bg-rose-50 border-rose-200"   },
  { id: "procedures", label: "Nursing Procedures", icon: <Stethoscope className="h-5 w-5" />,   color: "text-teal-700",  bg: "bg-teal-50 border-teal-200"   },
  { id: "goals",      label: "Goals",              icon: <Target className="h-5 w-5" />,        color: "text-green-700", bg: "bg-green-50 border-green-200" },
];

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
  { level: 3,  label: "Moderate Pain",           desc: "Uncomfortable pain that may cause some distraction" },
  { level: 4,  label: "Moderate to Severe Pain", desc: "Pain that starts to interfere with daily activities" },
  { level: 5,  label: "Severe Pain",             desc: "Pain that significantly impacts daily activities" },
  { level: 6,  label: "Intense Pain",            desc: "Very strong pain that may cause an inability to concentrate" },
  { level: 7,  label: "Very Intense Pain",       desc: "Pain that is nearly unbearable" },
  { level: 8,  label: "Excruciating Pain",       desc: "Pain is so intense that it is difficult to think" },
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
  { date: "Jan 15", pulse: 68, systolic: 115, diastolic: 72, temp: 36.5 },
  { date: "Feb 10", pulse: 72, systolic: 118, diastolic: 75, temp: 36.8 },
  { date: "Feb 17", pulse: 78, systolic: 124, diastolic: 79, temp: 37.1 },
  { date: "Feb 24", pulse: 75, systolic: 120, diastolic: 76, temp: 36.6 },
  { date: "Mar 03", pulse: 80, systolic: 128, diastolic: 82, temp: 37.3 },
  { date: "Today",  pulse: 76, systolic: 121, diastolic: 77, temp: 37.0 },
];
const TREND_PAIN = [
  { date: "Jan 15", score: 2 }, { date: "Feb 10", score: 3 },
  { date: "Feb 17", score: 5 }, { date: "Feb 24", score: 4 },
  { date: "Mar 03", score: 6 }, { date: "Today",  score: 5 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

// ─── Left panel — Patient info for Vitals ────────────────────────────────────

function ApptVitalsLeftPanel({ appt, vitalValues, configuredVitals, painScore, mentalAnswers }:
  { appt: Appointment; vitalValues: Record<string, string>; configuredVitals: VitalConfig[]; painScore: number; mentalAnswers: number[] }) {
  const [recordExpanded, setRecordExpanded] = useState(false);
  const mentalTotal = mentalAnswers.reduce((s, v) => s + v, 0);

  const vitalsRows: [string, string][] = configuredVitals
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

  const hasData = vitalsRows.length > 0 || painScore >= 0 || mentalTotal > 0;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient Record</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <Collapsible title="Patient Info" defaultOpen={false}>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5 text-xs">
            {[
              ["Name", appt.patientName],
              ["MRN", appt.patientMrn || "—"],
              ["Phone", appt.patientPhone || "—"],
              ["Type", appt.type || "—"],
              ["Specialty", appt.specialty || "—"],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between">
                <span className="text-slate-400">{l}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Required Actions" badge={1} accent defaultOpen>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 space-y-1.5 text-xs mb-2">
            <p className="font-semibold text-slate-800 leading-tight">
              {hasData
                ? [vitalsRows.length > 0 && "Vitals recorded", painScore >= 0 && `Pain: ${painScore}`, mentalTotal > 0 && `Mental: ${mentalTotal}`].filter(Boolean).join(" · ")
                : "Vitals: Normal, Pain Score: 5, Mental Score: 4"}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />In progress</span>
              <span className="flex items-center gap-1"><Activity className="h-3 w-3" />Vitals Sign</span>
            </div>
          </div>
        </Collapsible>

        <Collapsible title="All Records" badge={1} defaultOpen>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs mb-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-slate-800 leading-tight flex-1">
                {hasData
                  ? [vitalsRows.length > 0 && "Vitals recorded", painScore >= 0 && `Pain: ${painScore}`, mentalTotal > 0 && `Mental: ${mentalTotal}`].filter(Boolean).join(" · ")
                  : "Vitals: Normal, Pain Score: 5, Mental Score: 4"}
              </p>
              <button
                onClick={() => setRecordExpanded(e => !e)}
                className="text-[10px] font-bold text-[#4982CF] hover:underline flex-shrink-0 flex items-center gap-1">
                {recordExpanded ? <><ChevronUp className="h-3 w-3" /> Collapse</> : <><Maximize2 className="h-3 w-3" /> Expand</>}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1.5">
              <span>{formatDate(appt.date)} · {appt.slotStart}–{appt.slotEnd}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">Active</span>
            </div>
            {recordExpanded && vitalsRows.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Patient Vitals</p>
                <div className="rounded-lg overflow-hidden border border-slate-100">
                  {vitalsRows.map(([label, value], i) => (
                    <div key={label} className={`flex items-center justify-between px-2.5 py-1.5 ${i % 2 === 0 ? "bg-blue-50" : "bg-white"}`}>
                      <span className="text-slate-500">{label}</span>
                      <span className="font-semibold text-slate-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Collapsible>
      </div>
    </div>
  );
}

// ─── Left panel — Care Plan ───────────────────────────────────────────────────

function ApptCareLeftPanel({ appt, tasks, execs }: {
  appt: Appointment;
  tasks: import("@/hooks/useNursingCareTasks").CarePlanTaskRef[];
  execs: import("@/hooks/useNursingCareTasks").TaskExec[];
}) {
  const urgentPending = tasks.filter(t => {
    const exec = execs.find(e => e.uid === t.uid);
    return t.priority === "Urgent" && (!exec || exec.status === "pending");
  }).length;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient Record</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <Collapsible title="Patient Info" defaultOpen={false}>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5 text-xs">
            {[["Name", appt.patientName], ["MRN", appt.patientMrn || "—"], ["Specialty", appt.specialty || "—"]].map(([l, v]) => (
              <div key={l} className="flex justify-between">
                <span className="text-slate-400">{l}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
        </Collapsible>
        <Collapsible title="Required Actions" badge={urgentPending} accent defaultOpen>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 space-y-1.5 text-xs mb-2">
            {urgentPending > 0 ? (
              <>
                <p className="font-semibold text-slate-800 leading-tight">
                  {urgentPending} urgent task{urgentPending !== 1 ? "s" : ""} pending — action required
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />Urgent</span>
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" />Care Plan</span>
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{appt.patientName}</span>
                </div>
              </>
            ) : (
              <p className="text-slate-400 italic text-[11px]">No urgent actions — all tasks on track.</p>
            )}
          </div>
        </Collapsible>
      </div>
    </div>
  );
}

// ─── Left panel — Goals ───────────────────────────────────────────────────────

function ApptGoalsLeftPanel({ appt }: { appt: Appointment }) {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient Record</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <Collapsible title="Patient Info" defaultOpen={false}>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5 text-xs">
            {[["Name", appt.patientName], ["MRN", appt.patientMrn || "—"], ["Specialty", appt.specialty || "—"]].map(([l, v]) => (
              <div key={l} className="flex justify-between">
                <span className="text-slate-400">{l}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
        </Collapsible>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs">
          <p className="text-slate-400 italic">Goals are set by the doctor and reviewed here.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Left panel — Procedures ──────────────────────────────────────────────────

function ApptProcedureLeftPanel({ appt }: { appt: Appointment }) {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient Record</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <Collapsible title="Patient Info" defaultOpen={false}>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5 text-xs">
            {[["Name", appt.patientName], ["MRN", appt.patientMrn || "—"], ["Type", appt.type || "—"]].map(([l, v]) => (
              <div key={l} className="flex justify-between">
                <span className="text-slate-400">{l}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
        </Collapsible>
        <Collapsible title="Required Actions" badge={1} accent defaultOpen>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 space-y-1.5 text-xs mb-2">
            <p className="font-semibold text-slate-800 leading-tight">Procedure pending review</p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />Pending</span>
              <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" />Nursing Procedure</span>
            </div>
          </div>
        </Collapsible>
      </div>
    </div>
  );
}

// ─── Vitals form ──────────────────────────────────────────────────────────────

function ApptVitalsForm({ vitalValues, setVitalValues, configuredVitals, painScore, setPainScore, mentalAnswers, setMentalAnswers }:
  { vitalValues: Record<string, string>; setVitalValues: (v: Record<string, string>) => void; configuredVitals: VitalConfig[]; painScore: number; setPainScore: (n: number) => void; mentalAnswers: number[]; setMentalAnswers: (a: number[]) => void }) {

  const displayVitals = configuredVitals.filter(v => v.opd !== "skip" && v.id !== "pain");
  const painConfig = configuredVitals.find(v => v.id === "pain");
  const showPainSection = !painConfig || painConfig.opd !== "skip";
  const mentalTotal = mentalAnswers.reduce((s, v) => s + v, 0);
  function setMentalAnswer(qi: number, val: number) { const next = [...mentalAnswers]; next[qi] = val; setMentalAnswers(next); }
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
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Blood Pressure{v.unit ? ` (${v.unit})` : ""}:</label>
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
                        <p className="text-[10px] text-slate-400 mt-0.5">Ref: {v.refMin || "—"} – {v.refMax || "—"} {v.unit}</p>
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

        {showPainSection && (
          <div className="border-t border-slate-100 pt-4">
            <Collapsible title="Pain Score" accent defaultOpen>
              <div className="space-y-0 pb-4">
                {PAIN_LEVELS.map(pl => (
                  <label key={pl.level} className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-slate-50 rounded-lg px-1 -mx-1">
                    <input type="radio" name="appt-pain" checked={painScore === pl.level} onChange={() => setPainScore(pl.level)} className="mt-0.5 flex-shrink-0 accent-[#4982CF]" />
                    <span className="text-sm text-slate-700 leading-snug">
                      <span className="font-semibold text-slate-800">{pl.label}</span> ({pl.desc})
                    </span>
                  </label>
                ))}
              </div>
            </Collapsible>
          </div>
        )}

        <div className="border-t border-slate-100 pt-4">
          <Collapsible title="Mental Health Screen" accent defaultOpen>
            <div className="pb-4">
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
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

// ─── Vitals Trends ────────────────────────────────────────────────────────────

function ApptVitalsTrends() {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-slate-50/40">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p className="text-sm font-bold text-slate-800 mb-1">Patient Vitals</p>
        <p className="text-xs text-slate-400 mb-4">Pulse HR · Systolic BP · Temperature (last visits)</p>
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
    </div>
  );
}

// ─── History tab content ──────────────────────────────────────────────────────

function ApptHistoryTab() {
  const { config } = useNursingConfig();
  const enabledTemplates = useMemo(() => config.templates.filter(t => t.enabled), [config.templates]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const activeTemplate = useMemo(() => {
    if (enabledTemplates.length === 0) return null;
    const found = enabledTemplates.find(t => t.id === selectedTemplateId);
    return found ?? enabledTemplates[0];
  }, [enabledTemplates, selectedTemplateId]);

  const [data, setData] = useState<Record<string, Record<string, string>>>({});

  if (!activeTemplate) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-10">
        <p className="text-sm text-slate-400">No history templates configured.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {enabledTemplates.length > 1 && (
        <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-500">Template:</span>
          <div className="flex gap-1 flex-wrap">
            {enabledTemplates.map(t => (
              <button key={t.id} onClick={() => setSelectedTemplateId(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${activeTemplate.id === t.id ? "bg-[#4982CF] text-white border-[#4982CF]" : "border-slate-200 text-slate-600 hover:border-[#4982CF]"}`}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {activeTemplate.components.map(comp => (
          <div key={comp.id}>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{comp.name}</p>
            {comp.type === "system" ? (
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-400 italic">
                {comp.name} — system data (linked from clinical libraries)
              </div>
            ) : (
              <div className={`grid gap-3 ${comp.columns > 1 ? `grid-cols-${comp.columns}` : ""}`}>
                {comp.fields.filter(f => f.enabled).map(field => (
                  <div key={field.id}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {field.label}{field.required && <span className="text-rose-500 ml-0.5">*</span>}:
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        value={data[comp.id]?.[field.id] ?? ""}
                        onChange={e => setData(prev => ({ ...prev, [comp.id]: { ...(prev[comp.id] ?? {}), [field.id]: e.target.value } }))}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-ring h-20"
                      />
                    ) : (
                      <Input
                        value={data[comp.id]?.[field.id] ?? ""}
                        onChange={e => setData(prev => ({ ...prev, [comp.id]: { ...(prev[comp.id] ?? {}), [field.id]: e.target.value } }))}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        className="h-8 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Procedures tab content ───────────────────────────────────────────────────

function ApptProcedureTab() {
  const { config } = useNursingConfig();
  const enabledTemplates = useMemo(() => config.procedureTemplates.filter(t => t.enabled), [config.procedureTemplates]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, Record<string, string>>>({});

  const active = useMemo(() => {
    const found = enabledTemplates.find(t => t.id === selectedId);
    return found ?? enabledTemplates[0] ?? null;
  }, [enabledTemplates, selectedId]);

  if (!active) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-10">
        <p className="text-sm text-slate-400">No procedure templates configured.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {enabledTemplates.length > 1 && (
        <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-500">Procedure:</span>
          <div className="flex gap-1 flex-wrap">
            {enabledTemplates.map(t => (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${active.id === t.id ? "bg-[#4982CF] text-white border-[#4982CF]" : "border-slate-200 text-slate-600 hover:border-[#4982CF]"}`}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {active.components.map(comp => (
          <div key={comp.id}>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{comp.name}</p>
            {comp.type === "system" ? (
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-400 italic">
                {comp.name} — system component (linked from clinical module)
              </div>
            ) : (
              <div className={`grid gap-3 ${comp.columns > 1 ? `grid-cols-${comp.columns}` : ""}`}>
                {comp.fields.filter(f => f.enabled).map(field => (
                  <div key={field.id}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {field.label}{field.required && <span className="text-rose-500 ml-0.5">*</span>}:
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        value={data[comp.id]?.[field.id] ?? ""}
                        onChange={e => setData(prev => ({ ...prev, [comp.id]: { ...(prev[comp.id] ?? {}), [field.id]: e.target.value } }))}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-ring h-20"
                      />
                    ) : (
                      <Input
                        value={data[comp.id]?.[field.id] ?? ""}
                        onChange={e => setData(prev => ({ ...prev, [comp.id]: { ...(prev[comp.id] ?? {}), [field.id]: e.target.value } }))}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        className="h-8 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ApptVitalsPanel — full-screen assessment panel ───────────────────────────

export function ApptVitalsPanel({ appt, initialCategory = "vitals", onClose, onSave }: {
  appt: Appointment;
  initialCategory?: NurseCategory;
  onClose: () => void;
  onSave: () => void;
}) {
  const configuredVitals = useMemo(() => loadVitalsConfig(), []);
  const { record, save } = useApptNursingData(appt.id);
  const { toast } = useToast();

  const [vitalValues, setVitalValues]     = useState<Record<string, string>>(record.vitalValues);
  const [painScore, setPainScore]         = useState(record.painScore);
  const [mentalAnswers, setMentalAnswers] = useState(record.mentalAnswers);
  const [showTrends, setShowTrends]       = useState(false);
  const [fullscreen, setFullscreen]       = useState(false);
  const [activeCategory, setActiveCategory] = useState<NurseCategory>(initialCategory);
  const [showConfirm, setShowConfirm]     = useState(false);

  const {
    tasks, goals, execState,
    advanceTask, skipTask, resetTask, updateTaskNote, updateGoalNote,
  } = useNursingCareTasks(appt.id);

  function handleSave() {
    save({ vitalValues, painScore, mentalAnswers });
    toast({ title: "Nursing record saved", description: appt.patientName });
    onSave();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col transition-all duration-300 ease-in-out border-l border-slate-200 ${fullscreen ? "w-full" : "w-[80%]"}`}>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center border-b border-slate-200 bg-white">
          <div className="px-5 py-3 border-r border-slate-100 flex-shrink-0">
            <p className="text-sm font-bold text-slate-900">Patient Assessment</p>
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

        {/* Body */}
        {activeCategory === "vitals" ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/2 flex-shrink-0 border-r border-slate-200 overflow-hidden">
              <ApptVitalsLeftPanel appt={appt} vitalValues={vitalValues} configuredVitals={configuredVitals} painScore={painScore} mentalAnswers={mentalAnswers} />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#4982CF]" />
                  <span className="text-sm font-bold text-slate-700">{showTrends ? "Vitals Trends" : "Vitals Entry"}</span>
                </div>
                <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <button onClick={() => setShowTrends(false)}
                    className={`px-4 py-1.5 text-xs font-semibold transition-colors ${!showTrends ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                    Form
                  </button>
                  <button onClick={() => setShowTrends(true)}
                    className={`px-4 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${showTrends ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                    <TrendingUp className="h-3 w-3" /> Trends
                  </button>
                </div>
              </div>
              {showTrends ? <ApptVitalsTrends /> : (
                <ApptVitalsForm
                  vitalValues={vitalValues}
                  setVitalValues={setVitalValues}
                  configuredVitals={configuredVitals}
                  painScore={painScore}
                  setPainScore={setPainScore}
                  mentalAnswers={mentalAnswers}
                  setMentalAnswers={setMentalAnswers}
                />
              )}
            </div>
          </div>
        ) : activeCategory === "history" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
              <ClipboardList className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-bold text-slate-700">Patient History</span>
            </div>
            <ApptHistoryTab />
          </div>
        ) : activeCategory === "procedures" ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/2 flex-shrink-0 border-r border-slate-200 overflow-hidden">
              <ApptProcedureLeftPanel appt={appt} />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <Stethoscope className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-bold text-slate-700">Nursing Procedures</span>
              </div>
              <ApptProcedureTab />
            </div>
          </div>
        ) : activeCategory === "care-plan" ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/2 flex-shrink-0 border-r border-slate-200 overflow-hidden">
              <ApptCareLeftPanel appt={appt} tasks={tasks} execs={execState.tasks} />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <Heart className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-bold text-slate-700">Care Plan</span>
              </div>
              <CareTasksTab
                tasks={tasks}
                execs={execState.tasks}
                onAdvance={advanceTask}
                onSkip={skipTask}
                onReset={resetTask}
                onNoteChange={updateTaskNote}
              />
            </div>
          </div>
        ) : activeCategory === "goals" ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/2 flex-shrink-0 border-r border-slate-200 overflow-hidden">
              <ApptGoalsLeftPanel appt={appt} />
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
          <div className="flex-1 flex items-center justify-center text-center p-10">
            <div>
              <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-300">
                <AlertCircle className="h-8 w-8" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Triage</p>
              <p className="text-xs text-slate-400 mt-1">Triage assessment is not configured for appointments.</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Confirm save dialog */}
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
                    <p className="text-xs text-slate-500 mt-0.5">{appt.patientName}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  All recorded information will be saved for this appointment.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => { setShowConfirm(false); handleSave(); }}
                    className="flex-1 bg-[#4982CF] hover:bg-[#3a6fb8] text-white font-bold h-10">
                    Yes, Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 border-slate-200 text-slate-600 font-semibold h-10">
                    Go Back
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

// ─── ApptNursingDrawer — overview drawer ──────────────────────────────────────

export function ApptNursingDrawer({ appt, onClose }: {
  appt: Appointment;
  onClose: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<NurseCategory | null>(null);

  if (activeCategory) {
    return (
      <ApptVitalsPanel
        appt={appt}
        initialCategory={activeCategory}
        onClose={onClose}
        onSave={onClose}
      />
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col w-[40%] min-w-[480px] border-l border-slate-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900">Nursing Assessment</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatDate(appt.date)} · {appt.slotStart}–{appt.slotEnd}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Patient info section */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-[#4982CF]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  {appt.priority !== "normal" && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${
                      appt.priority === "emergency" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                    }`}>
                      {appt.priority}
                    </span>
                  )}
                  {appt.contagious && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold flex items-center gap-0.5">
                      <AlertCircle className="h-3 w-3" /> Contagious
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-900">{appt.patientName}</p>
                <p className="text-xs text-slate-500">
                  {[appt.patientMrn, appt.patientPhone].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["Type", appt.type || "—"],
                ["Specialty", appt.specialty || "—"],
                ["Date", formatDate(appt.date).split(",")[0]],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-center">
                  <p className="text-[10px] text-slate-400">{label}</p>
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {(appt.contagious || appt.priority !== "normal") && (
            <div className="px-5 py-4 border-b border-slate-100 space-y-3">
              {appt.priority === "emergency" && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1"><AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" /><p className="text-xs font-bold text-red-800">Emergency</p></div>
                  <p className="text-xs text-red-700">This patient is marked as emergency — prioritize immediately.</p>
                </div>
              )}
              {appt.priority === "urgent" && (
                <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1"><AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" /><p className="text-xs font-bold text-orange-800">Urgent</p></div>
                  <p className="text-xs text-orange-700">This patient has been marked as urgent priority.</p>
                </div>
              )}
              {appt.contagious && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1"><AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" /><p className="text-xs font-bold text-rose-800">Contagious</p></div>
                  <p className="text-xs text-rose-700">{appt.contagiousNote || "Infection precautions required."}</p>
                </div>
              )}
            </div>
          )}

          {/* Category cards */}
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
