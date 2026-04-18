import { useState, useEffect } from "react";
import {
  PhoneCall, X, ChevronDown, ChevronUp, ChevronRight,
  Maximize2, Minimize2, Clock, User, AlertCircle, Heart,
  SkipForward, RotateCcw, Activity, Thermometer, Droplets,
  Scale, Ruler, Wind, FlaskConical, ClipboardList, Stethoscope,
  Camera, Target, TrendingUp, CheckCircle2, Plus,
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

const TREND_PAIN = [
  { date: "Jan 15", score: 2 },
  { date: "Feb 10", score: 3 },
  { date: "Feb 17", score: 5 },
  { date: "Feb 24", score: 4 },
  { date: "Mar 03", score: 6 },
  { date: "Mar 10", score: 5 },
  { date: "Today",  score: 5 },
];

const TREND_MENTAL = [
  { date: "Jan 15", total: 2 },
  { date: "Feb 10", total: 3 },
  { date: "Feb 17", total: 5 },
  { date: "Feb 24", total: 4 },
  { date: "Mar 03", total: 6 },
  { date: "Mar 10", total: 4 },
  { date: "Today",  total: 4 },
];

// ─── Pain levels ──────────────────────────────────────────────────────────────

const PAIN_LEVELS = [
  { level: 0,  label: "No Pain",               desc: "No discomfort or pain is present. Complete at ease" },
  { level: 1,  label: "Very Mild Pain",         desc: "Barely noticeable pain. No interference with daily activities" },
  { level: 2,  label: "Mild Pain",              desc: "Minor discomfort. It can be easily ignored during daily activities" },
  { level: 3,  label: "Moderate Pain",          desc: "Uncomfortable pain that may cause some distraction. Can still perform most daily activities but with some difficulty" },
  { level: 4,  label: "Moderate to Severe Pain",desc: "Pain that starts to interfere with daily activities" },
  { level: 5,  label: "Severe Pain",            desc: "Pain that significantly impacts daily activities" },
  { level: 6,  label: "Intense Pain",           desc: "Very strong pain that may cause an inability to concentrate on tasks" },
  { level: 7,  label: "Very Intense Pain",      desc: "Pain that is nearly unbearable" },
  { level: 8,  label: "Excruciating Pain",      desc: "Pain is so intense that it is difficult to think or communicate" },
  { level: 9,  label: "Unbearable Pain",        desc: "Pain that feels all-consuming and impossible to tolerate" },
  { level: 10, label: "Worst Possible Pain",    desc: "Pain that is beyond imagination" },
];

// ─── Mental health questions ──────────────────────────────────────────────────

const MENTAL_QUESTIONS = [
  "Feeling nervous, anxious or on edge:",
  "Not being able to stop or control worrying:",
  "Feeling down, depressed or hopeless:",
  "Little interest or pleasure in doing things:",
];

// ─── Category definitions ─────────────────────────────────────────────────────

type NurseCategory = "triage" | "history" | "vitals" | "care-plan" | "procedures" | "lab" | "imaging" | "goals";

const CATEGORIES: { id: NurseCategory; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: "triage",     label: "Triage",              icon: <AlertCircle className="h-5 w-5" />, color: "text-red-600",    bg: "bg-red-50 border-red-200" },
  { id: "history",    label: "History",             icon: <ClipboardList className="h-5 w-5"/>, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  { id: "vitals",     label: "Vital Signs",         icon: <Activity className="h-5 w-5" />,    color: "text-[#4982CF]", bg: "bg-blue-50 border-blue-200" },
  { id: "care-plan",  label: "Care Plan",           icon: <Heart className="h-5 w-5" />,       color: "text-rose-600",  bg: "bg-rose-50 border-rose-200" },
  { id: "procedures", label: "Nursing Procedures",  icon: <Stethoscope className="h-5 w-5" />, color: "text-teal-700",  bg: "bg-teal-50 border-teal-200" },
  { id: "lab",        label: "Lab",                 icon: <FlaskConical className="h-5 w-5" />,color: "text-purple-700",bg: "bg-purple-50 border-purple-200" },
  { id: "imaging",    label: "Imaging",             icon: <Camera className="h-5 w-5" />,      color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
  { id: "goals",      label: "Goals",               icon: <Target className="h-5 w-5" />,      color: "text-green-700", bg: "bg-green-50 border-green-200" },
];

const CATEGORY_NAV_LABELS: { id: NurseCategory; label: string }[] = [
  { id: "triage",     label: "Triage" },
  { id: "history",    label: "History" },
  { id: "vitals",     label: "Vital Signs" },
  { id: "care-plan",  label: "Care Plan" },
  { id: "procedures", label: "Nursing Procedures" },
  { id: "lab",        label: "Lab" },
  { id: "imaging",    label: "Imaging" },
  { id: "goals",      label: "Goals" },
];

// ─── Collapsible section helper ───────────────────────────────────────────────

function Collapsible({ title, badge, defaultOpen = true, accent, children }:
  { title: string; badge?: number; defaultOpen?: boolean; accent?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        className="w-full flex items-center justify-between py-2 group"
        onClick={() => setOpen(o => !o)}
      >
        <span className={`text-sm font-bold ${accent ? "text-[#4982CF]" : "text-slate-700"}`}>
          {title}
          {badge !== undefined && (
            <span className="ml-1.5 text-[11px] font-bold text-slate-500">({badge})</span>
          )}
        </span>
        {open
          ? <ChevronDown className="h-4 w-4 text-slate-400" />
          : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ─── Left panel ───────────────────────────────────────────────────────────────

function VitalsLeftPanel({ entry, showTrends, onToggleTrends }:
  { entry: MultiEntry; showTrends: boolean; onToggleTrends: () => void }) {
  const p = entry.patient;

  const mockRecord = {
    date: "21 Feb 2025",
    status: "In progress",
    type: "Vitals Sign",
    doctor: "Dr. Asif Imam",
    summary: "Vitals: Normal, Pain Score: 5, Mental Score: 4",
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4 border-r border-slate-200 bg-white">

      <Collapsible title="Patient Info" defaultOpen={false}>
        {p ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Name</span>
              <span className="font-semibold text-slate-800">{p.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">MRN</span>
              <span className="font-mono font-bold text-slate-700">{p.mrn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gender</span>
              <span className="font-semibold text-slate-800">{p.gender === "M" ? "Male" : "Female"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DOB</span>
              <span className="font-semibold text-slate-800">{p.dob}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Phone</span>
              <span className="font-semibold text-slate-800">{p.phone}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No patient on file</p>
        )}
      </Collapsible>

      <Collapsible title="Required Actions" badge={1} accent defaultOpen>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 space-y-1.5 text-xs mb-2">
          <p className="font-semibold text-slate-800 leading-tight">{mockRecord.summary}</p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-3.5 w-3.5 rounded-sm bg-slate-200 inline-block" />
              {mockRecord.date}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
              {mockRecord.status}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {mockRecord.type}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {mockRecord.doctor}
            </span>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="All Records" badge={1} defaultOpen>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 space-y-1.5 text-xs mb-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-800 leading-tight flex-1">{mockRecord.summary}</p>
            <div className="flex gap-1 flex-shrink-0">
              <button className="text-[10px] font-bold text-[#4982CF] hover:underline">Expand</button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 justify-between">
            <span>{mockRecord.date} · Tuesday, 26 Feb 2025</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" /> {mockRecord.type}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {mockRecord.doctor}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">Active</span>
            </div>
          </div>
        </div>
      </Collapsible>

      {/* Form / Trends toggle */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">View Mode</p>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            onClick={() => showTrends && onToggleTrends()}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              !showTrends
                ? "bg-[#4982CF] text-white"
                : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            Form
          </button>
          <button
            onClick={() => !showTrends && onToggleTrends()}
            className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              showTrends
                ? "bg-[#4982CF] text-white"
                : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Trends
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Vitals form ──────────────────────────────────────────────────────────────

interface VitalsFormState {
  date: string;
  pulseHR: string;
  tempC: string;
  bpSystolic: string;
  bpDiastolic: string;
  bpPosition: string;
  bpOrthostatic: string;
  respiratory: string;
  bloodSugar: string;
  weightKg: string;
  heightCm: string;
  bmi: string;
  o2Sat: string;
  bsa: string;
}

function VitalsForm({ form, setForm, painScore, setPainScore, mentalAnswers, setMentalAnswers, onSubmit, onPrint, onDraft, onDiscard }:
  {
    form: VitalsFormState;
    setForm: (f: VitalsFormState) => void;
    painScore: number;
    setPainScore: (n: number) => void;
    mentalAnswers: number[];
    setMentalAnswers: (a: number[]) => void;
    onSubmit: () => void;
    onPrint: () => void;
    onDraft: () => void;
    onDiscard: () => void;
  }) {

  function field(label: string, key: keyof VitalsFormState, placeholder: string) {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">{label}:</label>
        <Input
          value={form[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className="h-8 text-sm"
        />
      </div>
    );
  }

  const mentalTotal = mentalAnswers.reduce((s, v) => s + v, 0);

  function setMentalAnswer(qi: number, val: number) {
    const next = [...mentalAnswers];
    next[qi] = val;
    setMentalAnswers(next);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0">

        {/* Patient Vitals */}
        <Collapsible title="Patient Vitals" accent defaultOpen>
          <div className="space-y-3 pb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date:</label>
              <div className="relative">
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="h-8 text-sm pr-8" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {field("Pulse Heart Rate", "pulseHR", "Enter Pulse Heart Rate")}
              {field("Temperature C", "tempC", "Enter Temperature")}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Blood Pressure:</label>
              <div className="flex items-center gap-2">
                <Input value={form.bpSystolic} onChange={e => setForm({ ...form, bpSystolic: e.target.value })}
                  placeholder="Systolic" className="h-8 text-sm flex-1 min-w-0" />
                <span className="text-slate-400 font-bold flex-shrink-0">/</span>
                <Input value={form.bpDiastolic} onChange={e => setForm({ ...form, bpDiastolic: e.target.value })}
                  placeholder="Diasto" className="h-8 text-sm flex-1 min-w-0" />
                <Select value={form.bpPosition} onValueChange={v => setForm({ ...form, bpPosition: v })}>
                  <SelectTrigger className="h-8 text-sm w-28 flex-shrink-0">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sitting">Sitting</SelectItem>
                    <SelectItem value="standing">Standing</SelectItem>
                    <SelectItem value="supine">Supine</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.bpOrthostatic} onValueChange={v => setForm({ ...form, bpOrthostatic: v })}>
                  <SelectTrigger className="h-8 text-sm w-28 flex-shrink-0">
                    <SelectValue placeholder="Orthostatic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                <button className="h-8 w-8 rounded-lg bg-[#4982CF] text-white flex items-center justify-center flex-shrink-0 hover:bg-[#3a6fb8] transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {field("Respiratory", "respiratory", "Enter Respiratory")}
              {field("Blood Sugar", "bloodSugar", "Enter Blood Sugar")}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {field("Weight (kg)", "weightKg", "Enter Weight")}
              {field("Height (cm)", "heightCm", "Enter Height")}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {field("Body Mass Index", "bmi", "Enter Body Mass Index")}
              {field("Oxygen Saturation", "o2Sat", "Enter Oxygen Saturation")}
            </div>

            {field("Body Surface Area", "bsa", "Enter Body Surface Area")}
          </div>
        </Collapsible>

        {/* Pain Score */}
        <div className="border-t border-slate-100 pt-4">
          <Collapsible title="Pain Score" accent defaultOpen>
            <div className="space-y-0 pb-4">
              {PAIN_LEVELS.map(pl => (
                <label key={pl.level}
                  className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-slate-50 rounded-lg px-1 -mx-1 group">
                  <input
                    type="radio"
                    name="pain"
                    checked={painScore === pl.level}
                    onChange={() => setPainScore(pl.level)}
                    className="mt-0.5 flex-shrink-0 accent-[#4982CF]"
                  />
                  <span className="text-sm text-slate-700 leading-snug">
                    <span className="font-semibold text-slate-800">{pl.label}</span>
                    {" "}({pl.desc})
                  </span>
                </label>
              ))}
            </div>
          </Collapsible>
        </div>

        {/* Mental Health Screen */}
        <div className="border-t border-slate-100 pt-4">
          <Collapsible title="Mental Health Screen" accent defaultOpen>
            <div className="pb-4">
              <p className="text-xs text-slate-600 mb-3">
                Over the last two weeks, how often have you been bothered by the following problems?
              </p>
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
                      {[1, 2, 3, 4].map(n => (
                        <td key={n} className="text-center py-1.5 px-2 font-bold text-slate-700">{n}</td>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MENTAL_QUESTIONS.map((q, qi) => (
                      <tr key={qi} className="hover:bg-slate-50/70">
                        <td className="text-right py-3 px-3 text-slate-600 leading-snug">{q}</td>
                        {[1, 2, 3, 4].map(score => (
                          <td key={score} className="text-center py-3 px-2">
                            <input
                              type="radio"
                              name={`mental-${qi}`}
                              checked={mentalAnswers[qi] === score}
                              onChange={() => setMentalAnswer(qi, score)}
                              className="accent-[#4982CF]"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td className="text-right py-2 px-3 font-bold text-slate-600">Total:</td>
                      <td className="text-center py-2 px-2 font-bold text-[#4982CF] text-sm" colSpan={4}>
                        {mentalTotal || "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Collapsible>
        </div>

      </div>

      {/* Action bar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-5 py-3 border-t border-slate-200 bg-white">
        <Button onClick={onSubmit}
          className="flex-1 bg-[#4982CF] hover:bg-[#3a6fb8] text-white h-9 text-sm font-semibold">
          Submit &amp; Save
        </Button>
        <Button onClick={onPrint} variant="secondary"
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-9 text-sm font-semibold">
          Submit &amp; Print
        </Button>
        <Button onClick={onDraft} variant="secondary"
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white h-9 text-sm font-semibold">
          Save Draft &amp; Close
        </Button>
        <Button onClick={onDiscard} variant="secondary"
          className="flex-1 bg-slate-900 hover:bg-black text-white h-9 text-sm font-semibold">
          Discard
        </Button>
      </div>
    </div>
  );
}

// ─── Vitals Trends ────────────────────────────────────────────────────────────

function VitalsTrends() {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-slate-50/40">

      {/* Chart 1: Patient Vitals */}
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

      {/* Chart 2: Pain Score */}
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

      {/* Chart 3: Mental Health Score */}
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

// ─── Vitals split panel ───────────────────────────────────────────────────────

function VitalsPanel({ entry, onClose }: { entry: MultiEntry; onClose: () => void }) {
  const [showTrends, setShowTrends] = useState(false);
  const [vitalsForm, setVitalsForm] = useState<VitalsFormState>({
    date: "", pulseHR: "", tempC: "", bpSystolic: "", bpDiastolic: "",
    bpPosition: "", bpOrthostatic: "", respiratory: "", bloodSugar: "",
    weightKg: "", heightCm: "", bmi: "", o2Sat: "", bsa: "",
  });
  const [painScore, setPainScore] = useState(-1);
  const [mentalAnswers, setMentalAnswers] = useState([0, 0, 0, 0]);
  const [fullscreen, setFullscreen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<NurseCategory>("vitals");

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col transition-all duration-300 ease-in-out border-l border-slate-200 ${fullscreen ? "w-full" : "w-[85%]"}`}>

        {/* Top bar: title + category nav + fullscreen + close */}
        <div className="flex-shrink-0 flex items-center border-b border-slate-200 bg-white">
          <div className="px-5 py-3 border-r border-slate-100 flex-shrink-0">
            <p className="text-sm font-bold text-slate-900">Patient Vitals</p>
          </div>
          <div className="flex-1 flex items-center overflow-x-auto px-2 gap-0.5">
            {CATEGORY_NAV_LABELS.map(cat => (
              <button key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeCategory === cat.id
                    ? "border-[#4982CF] text-[#4982CF]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 px-3 flex-shrink-0">
            <button
              onClick={() => setFullscreen(f => !f)}
              className="flex items-center gap-1.5 h-8 px-2.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span>{fullscreen ? "Exit Full" : "Full Screen"}</span>
            </button>
            <button onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {activeCategory === "vitals" ? (
          /* Split layout for Vital Signs */
          <div className="flex-1 flex overflow-hidden">
            {/* Left panel */}
            <div className="w-64 flex-shrink-0 overflow-hidden">
              <VitalsLeftPanel
                entry={entry}
                showTrends={showTrends}
                onToggleTrends={() => setShowTrends(t => !t)}
              />
            </div>

            {/* Right panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {showTrends ? (
                <VitalsTrends />
              ) : (
                <VitalsForm
                  form={vitalsForm}
                  setForm={setVitalsForm}
                  painScore={painScore}
                  setPainScore={setPainScore}
                  mentalAnswers={mentalAnswers}
                  setMentalAnswers={setMentalAnswers}
                  onSubmit={onClose}
                  onPrint={onClose}
                  onDraft={onClose}
                  onDiscard={onClose}
                />
              )}
            </div>
          </div>
        ) : (
          /* Empty placeholder for other categories */
          <div className="flex-1 flex items-center justify-center text-center p-10">
            <div>
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
                {CATEGORIES.find(c => c.id === activeCategory)?.icon}
              </div>
              <p className="text-sm font-semibold text-slate-600">
                {CATEGORIES.find(c => c.id === activeCategory)?.label}
              </p>
              <p className="text-xs text-slate-400 mt-1">This section is not yet configured.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Nursing drawer (overview: patient info + category cards) ─────────────────

function NursingDrawer({ entry, onClose }: { entry: MultiEntry; onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState<NurseCategory | null>(null);
  const p = entry.patient;

  if (activeCategory) {
    return <VitalsPanel entry={entry} onClose={onClose} />;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col w-[40%] min-w-[480px] border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900">Patient Details</p>
            <p className="text-xs text-slate-400 mt-0.5">Nursing Station · Vitals Desk 1</p>
          </div>
          <button onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Patient info band */}
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
                  <>
                    <p className="text-sm font-bold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.mrn} · {p.gender === "M" ? "Male" : "Female"}</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 italic">Walk-in / No MR</p>
                )}
              </div>
            </div>

            {p && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: "Height", value: "168 cm" },
                  { label: "Weight", value: "72 kg" },
                  { label: "Last Visit", value: "Feb 2025" },
                ].map(item => (
                  <div key={item.label} className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-400">{item.label}</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alerts & Allergies */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-3">
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs font-bold text-amber-800">Alerts</p>
              </div>
              <p className="text-xs text-amber-700">Diabetic patient — check blood sugar before vitals recording.</p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-rose-600 flex-shrink-0" />
                <p className="text-xs font-bold text-rose-800">Allergies</p>
              </div>
              <p className="text-xs text-rose-700">Penicillin · Sulfa drugs</p>
            </div>
          </div>

          {/* Category cards */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Assessment Categories</p>
            <div className="grid grid-cols-2 gap-2.5">
              {CATEGORIES.map(cat => (
                <button key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
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

// ─── Token card ───────────────────────────────────────────────────────────────

function NurseTokenCard({ entry, onCall, onNursingConfirm, onSkip, onRecall }:
  {
    entry: MultiEntry;
    onCall: () => void;
    onNursingConfirm: () => void;
    onSkip: () => void;
    onRecall: () => void;
  }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const secsLeft = getSecsLeft(entry.callTimestamp);
  const inWindow  = entry.callTimestamp !== null && secsLeft > 0;
  const called    = entry.status === "called";
  const canCallMore = entry.callCount < MAX_CALLS && !entry.skipped;

  const statusColor = entry.skipped
    ? "border-slate-200 bg-slate-50"
    : called
      ? "border-[#4982CF]/40 bg-blue-50/60"
      : "border-slate-200 bg-white";

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-4 transition-all ${statusColor}`}>
      {/* Token badge */}
      <div className="flex-shrink-0">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-sm font-mono shadow-sm ${
          entry.skipped ? "bg-slate-200 text-slate-400" :
          called ? "bg-[#4982CF] text-white" :
          "bg-[#4982CF]/10 text-[#4982CF]"
        }`}>
          {entry.tokenNumber}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {entry.patient
            ? <p className="text-sm font-bold text-slate-900 leading-tight">{entry.patient.name}</p>
            : <p className="text-sm text-slate-400 italic leading-tight">Walk-in patient</p>}
          {entry.skipped && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500 font-bold">Skipped</span>
          )}
          {called && !entry.skipped && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#4982CF]/15 text-[#4982CF] font-bold">At Counter</span>
          )}
        </div>
        {entry.patient && (
          <p className="text-xs text-slate-400">{entry.patient.mrn}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo(entry.createdAt)} ago
          </span>
          {entry.callCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <PhoneCall className="h-3 w-3" /> Called {entry.callCount}×
            </span>
          )}
          {inWindow && (
            <span className="flex items-center gap-1 font-mono text-[#4982CF] font-bold">
              {secsLeft}s
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {entry.skipped ? (
          <Button onClick={onRecall} variant="outline" size="sm"
            className="h-8 gap-1.5 text-xs border-slate-300 hover:border-[#4982CF] hover:text-[#4982CF]">
            <RotateCcw className="h-3.5 w-3.5" /> Recall
          </Button>
        ) : called ? (
          <Button onClick={onNursingConfirm} size="sm"
            className="h-8 gap-1.5 text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold">
            <Heart className="h-3.5 w-3.5" /> Nursing
          </Button>
        ) : inWindow ? (
          <>
            <Button onClick={onNursingConfirm} size="sm"
              className="h-8 gap-1.5 text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold">
              <Heart className="h-3.5 w-3.5" /> Nursing
            </Button>
            <Button onClick={onSkip} variant="ghost" size="sm"
              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500">
              <SkipForward className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            {canCallMore && (
              <Button onClick={onCall} size="sm"
                className="h-8 gap-1.5 text-xs bg-[#4982CF] hover:bg-[#3a6fb8] text-white">
                <PhoneCall className="h-3.5 w-3.5" />
                {entry.callCount === 0 ? "Call" : "Recall"}
              </Button>
            )}
            {entry.callCount > 0 && !canCallMore && (
              <Button onClick={onSkip} variant="outline" size="sm"
                className="h-8 gap-1.5 text-xs border-rose-300 text-rose-500 hover:bg-rose-50">
                <SkipForward className="h-3.5 w-3.5" /> Skip
              </Button>
            )}
            {entry.callCount > 0 && (
              <Button onClick={onSkip} variant="ghost" size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500">
                <SkipForward className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function NursingUser() {
  const {
    queue,
    nurseCall, nurseTimerExpire, nurseAtCounter, nurseSkip, nurseRecall,
  } = useMultiStepQueue();

  const [drawerEntry, setDrawerEntry] = useState<MultiEntry | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-expire call windows
  useEffect(() => {
    queue.forEach(e => {
      if (e.callTimestamp && getSecsLeft(e.callTimestamp) === 0) {
        nurseTimerExpire(e.id);
      }
    });
  }, [tick]);

  const nursingQueue = queue.filter(e => e.step === 2 && e.visitTypeId === "vt-1");
  const waiting   = nursingQueue.filter(e => !e.skipped && e.status === "waiting");
  const atCounter = nursingQueue.filter(e => e.status === "called");
  const skipped   = nursingQueue.filter(e => e.skipped);

  function handleNursingConfirm(entry: MultiEntry) {
    nurseAtCounter(entry.id);
    setDrawerEntry({ ...entry, status: "called" });
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <QueueAppHeader />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

          {/* Page header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-rose-600" />
                </div>
                <h1 className="text-xl font-black text-slate-900">Nursing Station</h1>
              </div>
              <p className="text-sm text-slate-400 ml-10">Vitals Desk 1 · Nursing Counter</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Step 2 of 5</p>
              <p className="text-sm font-bold text-slate-700">Vitals Recording</p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Waiting",    value: waiting.length,   color: "text-slate-900",   bg: "bg-white" },
              { label: "At Counter", value: atCounter.length, color: "text-[#4982CF]",   bg: "bg-blue-50" },
              { label: "Skipped",    value: skipped.length,   color: "text-rose-600",    bg: "bg-rose-50" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border border-slate-200 ${s.bg} px-4 py-3 text-center shadow-sm`}>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Queue list */}
          {nursingQueue.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <CheckCircle2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">No patients in vitals queue</p>
              <p className="text-xs text-slate-400 mt-1">Patients will appear here after Front Desk registration and billing.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Waiting */}
              {waiting.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">Waiting</p>
                  <div className="space-y-2">
                    {waiting.map(e => (
                      <NurseTokenCard key={e.id} entry={e}
                        onCall={() => nurseCall(e.id)}
                        onNursingConfirm={() => handleNursingConfirm(e)}
                        onSkip={() => nurseSkip(e.id)}
                        onRecall={() => nurseRecall(e.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* At counter */}
              {atCounter.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1 mt-4">At Counter</p>
                  <div className="space-y-2">
                    {atCounter.map(e => (
                      <NurseTokenCard key={e.id} entry={e}
                        onCall={() => nurseCall(e.id)}
                        onNursingConfirm={() => handleNursingConfirm(e)}
                        onSkip={() => nurseSkip(e.id)}
                        onRecall={() => nurseRecall(e.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Skipped */}
              {skipped.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1 mt-4">Skipped</p>
                  <div className="space-y-2">
                    {skipped.map(e => (
                      <NurseTokenCard key={e.id} entry={e}
                        onCall={() => nurseCall(e.id)}
                        onNursingConfirm={() => handleNursingConfirm(e)}
                        onSkip={() => nurseSkip(e.id)}
                        onRecall={() => nurseRecall(e.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nursing drawer */}
      {drawerEntry && (
        <NursingDrawer entry={drawerEntry} onClose={() => setDrawerEntry(null)} />
      )}
    </div>
  );
}
