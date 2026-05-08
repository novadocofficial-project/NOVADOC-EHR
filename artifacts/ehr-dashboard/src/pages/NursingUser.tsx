import { useState, useEffect, useMemo } from "react";
import {
  PhoneCall, X, ChevronUp, ChevronDown, ChevronRight,
  Maximize2, Minimize2, Clock, User, AlertCircle, Heart,
  SkipForward, RotateCcw, Activity, FlaskConical, ClipboardList,
  Stethoscope, Camera, Target, TrendingUp, CheckCircle2, Plus,
  Layers, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { QueueAppHeader, timeAgo } from "@/pages/QueuePageLayout";
import { useMultiStepQueue, MultiEntry } from "@/hooks/useMultiStepQueue";
import {
  useNursingConfig,
  SYSTEM_COMPONENTS,
  type NursingField,
  type NursingComponent,
  type NursingHistoryTemplate,
  type ConditionalRule,
} from "@/hooks/useNursingConfig";
import { loadVitalsConfig, type VitalConfig } from "@/pages/SoapConfigModule";

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

type NurseCategory = "triage" | "history" | "vitals" | "care-plan" | "procedures" | "lab" | "imaging" | "goals";

const CATEGORIES: { id: NurseCategory; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: "triage",     label: "Triage",             icon: <AlertCircle className="h-5 w-5" />, color: "text-red-600",    bg: "bg-red-50 border-red-200"     },
  { id: "history",    label: "History",            icon: <ClipboardList className="h-5 w-5"/>, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  { id: "vitals",     label: "Vital Signs",        icon: <Activity className="h-5 w-5" />,    color: "text-[#4982CF]", bg: "bg-blue-50 border-blue-200"   },
  { id: "care-plan",  label: "Care Plan",          icon: <Heart className="h-5 w-5" />,       color: "text-rose-600",  bg: "bg-rose-50 border-rose-200"   },
  { id: "procedures", label: "Nursing Procedures", icon: <Stethoscope className="h-5 w-5" />, color: "text-teal-700",  bg: "bg-teal-50 border-teal-200"   },
  { id: "lab",        label: "Lab",                icon: <FlaskConical className="h-5 w-5" />,color: "text-purple-700",bg: "bg-purple-50 border-purple-200"},
  { id: "imaging",    label: "Imaging",            icon: <Camera className="h-5 w-5" />,      color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
  { id: "goals",      label: "Goals",              icon: <Target className="h-5 w-5" />,      color: "text-green-700", bg: "bg-green-50 border-green-200" },
];

const CATEGORY_NAV_LABELS: { id: NurseCategory; label: string }[] = [
  { id: "triage", label: "Triage" }, { id: "history", label: "History" },
  { id: "vitals", label: "Vital Signs" }, { id: "care-plan", label: "Care Plan" },
  { id: "procedures", label: "Nursing Procedures" }, { id: "lab", label: "Lab" },
  { id: "imaging", label: "Imaging" }, { id: "goals", label: "Goals" },
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

function VitalsLeftPanel({ entry, vitalValues, configuredVitals, painScore, mentalAnswers }:
  { entry: MultiEntry; vitalValues: Record<string, string>; configuredVitals: VitalConfig[]; painScore: number; mentalAnswers: number[] }) {
  const p = entry.patient;
  const [recordExpanded, setRecordExpanded] = useState(false);
  const mockRecord = { date: "21 Feb 2025", status: "In progress", type: "Vitals Sign", doctor: "Dr. Asif Imam" };

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

      <Collapsible title="Required Actions" badge={1} accent defaultOpen>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 space-y-1.5 text-xs mb-2">
          <p className="font-semibold text-slate-800 leading-tight">Vitals: Normal, Pain Score: 5, Mental Score: 4</p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span>{mockRecord.date}</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />{mockRecord.status}</span>
            <span className="flex items-center gap-1"><Activity className="h-3 w-3" />{mockRecord.type}</span>
            <span className="flex items-center gap-1"><User className="h-3 w-3" />{mockRecord.doctor}</span>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="All Records" badge={1} defaultOpen>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs mb-2">
          {/* Record header row */}
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
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 justify-between mt-1.5">
            <span>{mockRecord.date} · Tuesday, 26 Feb 2025</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1"><Activity className="h-3 w-3" />{mockRecord.type}</span>
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{mockRecord.doctor}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">Active</span>
            </div>
          </div>

          {/* Expanded detail */}
          {recordExpanded && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
              {vitalsRows.length > 0 && (
                <div>
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
              {painScore >= 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Pain Score</p>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Level {painScore}/10</span>
                    <span className="font-bold text-slate-800">{PAIN_LEVELS[painScore]?.label ?? "—"}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(painScore / 10) * 100}%`, backgroundColor: painScore <= 3 ? "#22c55e" : painScore <= 6 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                </div>
              )}
              {mentalTotal > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Mental Health (PHQ-4)</p>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total Score</span>
                    <span className={`font-bold text-sm ${mentalTotal <= 2 ? "text-green-600" : mentalTotal <= 5 ? "text-amber-600" : "text-red-600"}`}>{mentalTotal} / 16</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(mentalTotal / 16) * 100}%`, backgroundColor: mentalTotal <= 2 ? "#22c55e" : mentalTotal <= 5 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                </div>
              )}
              {!hasData && (
                <p className="text-[11px] text-slate-400 italic text-center py-2">No data entered yet. Fill the form on the right to see it here.</p>
              )}
            </div>
          )}
        </div>
      </Collapsible>

      </div>
    </div>
  );
}

// ─── Config-driven vitals form ────────────────────────────────────────────────

function VitalsForm({ vitalValues, setVitalValues, configuredVitals, painScore, setPainScore, mentalAnswers, setMentalAnswers }:
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

        {showPainSection && (
          <div className="border-t border-slate-100 pt-4">
            <Collapsible title={`Pain Score${painConfig?.opd === "required" ? " *" : ""}`} accent defaultOpen>
              <div className="space-y-0 pb-4">
                {PAIN_LEVELS.map(pl => (
                  <label key={pl.level} className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-slate-50 rounded-lg px-1 -mx-1">
                    <input type="radio" name="pain" checked={painScore === pl.level} onChange={() => setPainScore(pl.level)} className="mt-0.5 flex-shrink-0 accent-[#4982CF]" />
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
          </Collapsible>
        </div>
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

function CustomComponentForm({ component, values, onChange }: {
  component: NursingComponent;
  values: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const enabledFields = component.fields.filter(f => f.enabled);
  return (
    <div className="space-y-3">
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
        <p className="text-xs text-slate-400 italic">No fields configured for this component.</p>
      )}
    </div>
  );
}

// ─── History tab content ──────────────────────────────────────────────────────

function HistoryTabContent() {
  const { config } = useNursingConfig();
  const enabledTemplates = useMemo(() => config.templates.filter(t => t.enabled), [config.templates]);

  const HISTORY_TEMPLATE_KEY = "ehr-nursing-history-template-sel";

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(() => {
    try { return sessionStorage.getItem(HISTORY_TEMPLATE_KEY) ?? null; } catch { return null; }
  });

  function selectTemplate(id: string) {
    setSelectedTemplateId(id);
    try { sessionStorage.setItem(HISTORY_TEMPLATE_KEY, id); } catch { /**/ }
  }

  const activeTemplate = useMemo(() => {
    if (enabledTemplates.length === 0) return null;
    if (enabledTemplates.length === 1) return enabledTemplates[0];
    const found = enabledTemplates.find(t => t.id === selectedTemplateId);
    return found ?? enabledTemplates[0];
  }, [enabledTemplates, selectedTemplateId]);

  type EntryMap = Record<string, Record<string, string>[]>;
  const [data, setData] = useState<EntryMap>({});
  const [systemValues, setSystemValues] = useState<Record<string, string>>({});

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

  if (enabledTemplates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 text-slate-400 gap-3">
        <ClipboardList className="h-10 w-10 opacity-30" />
        <p className="text-sm font-semibold">No history templates configured</p>
        <p className="text-xs">An admin can set up templates in Admin → Nursing History.</p>
      </div>
    );
  }

  const currentId = activeTemplate?.id ?? "";

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      {enabledTemplates.length > 1 && (
        <div className="mb-5 pb-4 border-b border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">Select Template</p>
          <div className="flex flex-wrap gap-2">
            {enabledTemplates.map(t => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  currentId === t.id
                    ? "bg-[#4982CF] border-[#4982CF] text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-[#4982CF] hover:text-[#4982CF]"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

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
                <div className="space-y-4 pb-2">
                  {getEntries(comp.id).map((entryVals, idx) => (
                    <div key={idx} className={comp.repeatable && getEntries(comp.id).length > 1 ? "rounded-xl border border-slate-200 bg-slate-50/50 p-3 relative" : ""}>
                      {comp.repeatable && getEntries(comp.id).length > 1 && (
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
                      />
                    </div>
                  ))}
                  {comp.repeatable && (
                    <button
                      onClick={() => addEntry(comp.id, comp.repeatLimit)}
                      disabled={comp.repeatLimit !== null && getEntries(comp.id).length >= comp.repeatLimit}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#4982CF] hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Entry{comp.repeatLimit !== null ? ` (${getEntries(comp.id).length}/${comp.repeatLimit})` : ""}
                    </button>
                  )}
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

// ─── Vitals split panel (fullscreen drawer) ───────────────────────────────────

function VitalsPanel({ entry, onClose, onSave }: { entry: MultiEntry; onClose: () => void; onSave: () => void }) {
  const [showTrends, setShowTrends] = useState(false);
  const configuredVitals = useMemo(() => loadVitalsConfig(), []);
  const [vitalValues, setVitalValues] = useState<Record<string, string>>({
    bp_sys: "121", bp_dia: "77", bp_pos: "sitting", bp_orth: "no",
    pulse: "76", temp: "37.0", spo2: "97", weight: "72", height: "168", bmi: "25.5",
    _date: new Date().toISOString().slice(0, 10),
  });
  const [painScore, setPainScore]         = useState(5);
  const [mentalAnswers, setMentalAnswers] = useState([1, 1, 2, 1]);
  const [fullscreen, setFullscreen]       = useState(false);
  const [activeCategory, setActiveCategory] = useState<NurseCategory>("vitals");
  const [showConfirm, setShowConfirm]     = useState(false);

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
              <VitalsLeftPanel entry={entry} vitalValues={vitalValues} configuredVitals={configuredVitals} painScore={painScore} mentalAnswers={mentalAnswers} />
            </div>
            {/* Right panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Right panel toolbar */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#4982CF]" />
                  <span className="text-sm font-bold text-slate-700">
                    {showTrends ? "Vitals Trends" : "Vitals Entry"}
                  </span>
                </div>
                <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => setShowTrends(false)}
                    className={`px-4 py-1.5 text-xs font-semibold transition-colors ${!showTrends ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                    Form
                  </button>
                  <button
                    onClick={() => setShowTrends(true)}
                    className={`px-4 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${showTrends ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                    <TrendingUp className="h-3 w-3" /> Trends
                  </button>
                </div>
              </div>
              {showTrends ? <VitalsTrends /> : (
                <VitalsForm
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
            <HistoryTabContent />
          </div>
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

  if (activeCategory) return <VitalsPanel entry={entry} onClose={onClose} onSave={onSave} />;

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
