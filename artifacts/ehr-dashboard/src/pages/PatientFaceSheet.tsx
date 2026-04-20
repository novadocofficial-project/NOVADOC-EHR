import { useState, useRef } from "react";
import {
  ArrowLeft, FileEdit, AlertTriangle, Eye, ChevronRight,
  Activity, Heart, Thermometer, Droplets, User, Phone, MapPin,
  CalendarDays, Stethoscope, Pill, FlaskConical, FileText,
  FolderOpen, ClipboardList, CheckCircle2, Syringe, Zap,
  ArrowUpRight, Scissors, ShieldCheck, ExternalLink, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiEntry } from "@/hooks/useMultiStepQueue";
import { SoapNotePage } from "@/pages/SoapNotePage";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from "recharts";

// ─── Accent ───────────────────────────────────────────────────────────────────

const ACCENT = "#4982CF";

// ─── Mock Clinical Data ───────────────────────────────────────────────────────

const VITALS_TREND = [
  { date: "12 Jan", systolic: 135, diastolic: 88, pulse: 82, o2: 96 },
  { date: "29 Jan", systolic: 128, diastolic: 84, pulse: 78, o2: 97 },
  { date: "10 Feb", systolic: 122, diastolic: 80, pulse: 76, o2: 97 },
  { date: "21 Feb", systolic: 118, diastolic: 78, pulse: 74, o2: 98 },
  { date: "Today",  systolic: 121, diastolic: 77, pulse: 76, o2: 97 },
];

const VITALS_TODAY = [
  { label: "BP",      value: "121/77",  unit: "mmHg",  icon: <Activity className="h-4 w-4" />,    color: "#4982CF" },
  { label: "Pulse",   value: "76",      unit: "bpm",   icon: <Heart className="h-4 w-4" />,        color: "#ef4444" },
  { label: "Temp",    value: "37.0",    unit: "°C",    icon: <Thermometer className="h-4 w-4" />,  color: "#f59e0b" },
  { label: "O₂ Sat",  value: "97%",     unit: "SpO₂",  icon: <Droplets className="h-4 w-4" />,    color: "#10b981" },
  { label: "Weight",  value: "72",      unit: "kg",    icon: <User className="h-4 w-4" />,         color: "#8b5cf6" },
];

const CRITICAL_CONDITIONS = [
  { name: "Hypertension", code: "I10", severity: "Chronic", color: "bg-orange-500" },
  { name: "Type 2 Diabetes", code: "E11.9", severity: "Chronic", color: "bg-red-600" },
];

const ALLERGIES = [
  { name: "Penicillin", reaction: "Anaphylaxis", severity: "Severe" },
  { name: "Sulfonamides", reaction: "Rash", severity: "Moderate" },
  { name: "Aspirin", reaction: "GI bleeding", severity: "Moderate" },
];

const PREVIOUS_VISITS = [
  { type: "OPD Consultation", doctor: "Dr. James Wilson", date: "21 Feb 2025" },
  { type: "Nutrition Clinic", doctor: "Dr. Sarah Connor",  date: "10 Feb 2025" },
  { type: "Cardiology Review", doctor: "Dr. Emily Wong",   date: "29 Jan 2025" },
];

const PHYSICAL_EXAMS = [
  { date: "21 Feb 2025", time: "10:15 AM", doctor: "Dr. James Wilson",    notes: "General examination normal" },
  { date: "10 Feb 2025", time: "09:30 AM", doctor: "Dr. Sarah Connor",    notes: "Abdomen soft, non-tender" },
  { date: "29 Jan 2025", time: "11:00 AM", doctor: "Dr. Emily Wong",      notes: "Cardiovascular exam unremarkable" },
];

const MEDICATIONS = [
  { name: "Metformin 500mg",   desc: "Type 2 Diabetes management",  start: "12 Jan 2025" },
  { name: "Amlodipine 5mg",    desc: "Hypertension control",         start: "29 Jan 2025" },
  { name: "Atorvastatin 10mg", desc: "Cholesterol management",        start: "10 Feb 2025" },
];

const PRESENTING_COMPLAINTS = [
  { date: "21 Feb 2025", time: "09:45 AM", complaint: "Persistent headache, mild dizziness", by: "Nurse Amina" },
  { date: "10 Feb 2025", time: "09:10 AM", complaint: "Fatigue and increased thirst",         by: "Nurse Sara" },
  { date: "29 Jan 2025", time: "10:50 AM", complaint: "Occasional chest tightness",            by: "Nurse Amina" },
];

const INVESTIGATIONS = [
  { date: "21 Feb 2025", type: "HbA1c",                   advisor: "Dr. James Wilson" },
  { date: "10 Feb 2025", type: "CBC + Lipid Profile",      advisor: "Dr. Sarah Connor" },
  { date: "29 Jan 2025", type: "ECG (12-lead)",             advisor: "Dr. Emily Wong" },
];

const DIAGNOSES = [
  { date: "21 Feb 2025", code: "I10",   problem: "Essential Hypertension",   start: "Jan 2024" },
  { date: "10 Feb 2025", code: "E11.9", problem: "Type 2 Diabetes Mellitus", start: "Mar 2023" },
  { date: "29 Jan 2025", code: "E78.5", problem: "Hyperlipidemia",            start: "Jan 2025" },
];

const DOCUMENTS = [
  { date: "21 Feb 2025", folder: "Lab Results",  desc: "HbA1c & CBC report" },
  { date: "10 Feb 2025", folder: "Radiology",    desc: "Chest X-Ray PA view" },
  { date: "29 Jan 2025", folder: "Cardiology",   desc: "ECG strip & report" },
];

const HISTORY_RECORDS = [
  { date: "21 Feb 2025", by: "Nurse Amina", question: "Current medications compliance?", answer: "Taking regularly, no missed doses" },
  { date: "10 Feb 2025", by: "Nurse Sara",  question: "Family history of diabetes?",     answer: "Father and paternal uncle both diabetic" },
  { date: "29 Jan 2025", by: "Nurse Amina", question: "Alcohol / smoking history?",      answer: "Non-smoker, no alcohol" },
];

const REFERRALS = [
  { date: "15 Mar 2025", type: "Cardiology",    location: "Punjab Cardiac Centre",       status: "Pending" },
  { date: "10 Feb 2025", type: "Ophthalmology", location: "Al-Shifa Eye Trust",          status: "Completed" },
  { date: "05 Jan 2025", type: "Nephrology",    location: "SIMS / Services Hospital",    status: "Scheduled" },
];

const SURGICAL_PROCEDURES = [
  { date: "12 Jun 2023", diagnosis: "Cholelithiasis",       procedure: "Laparoscopic Cholecystectomy", status: "Completed" },
  { date: "20 Sep 2021", diagnosis: "Appendicitis (acute)", procedure: "Appendectomy",                 status: "Completed" },
  { date: "08 Mar 2019", diagnosis: "Deviated Nasal Septum", procedure: "Septoplasty",                status: "Completed" },
];

const VACCINATIONS = [
  { schedule: "Annual",    vaccine: "Influenza (Flu) Vaccine",        administeredOn: "01 Oct 2024", administeredBy: "Nurse Amina" },
  { schedule: "Booster",   vaccine: "COVID-19 (Moderna XBB.1.5)",     administeredOn: "14 Mar 2024", administeredBy: "Nurse Sara"  },
  { schedule: "Decennial", vaccine: "Tetanus-Diphtheria (Td) Booster", administeredOn: "22 Jan 2022", administeredBy: "Nurse Amina" },
];

// Donut chart data — medication categories
const MED_CATEGORY_DATA = [
  { name: "Diabetes",     value: 2, color: "#4982CF" },
  { name: "Cardiac",      value: 2, color: "#ef4444" },
  { name: "Cholesterol",  value: 1, color: "#10b981" },
  { name: "Other",        value: 1, color: "#f59e0b" },
];

// Pain score radial (seed — pain 5/10)
const PAIN_DATA = [{ name: "Pain", value: 50, fill: "#f59e0b" }];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title, icon, badge, children, accentColor = ACCENT,
}: {
  title: string; icon: React.ReactNode; badge?: number;
  children: React.ReactNode; accentColor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100" style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}>
        <div className="flex items-center gap-2">
          <span style={{ color: accentColor }}>{icon}</span>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          {badge !== undefined && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: accentColor }}>{badge}</span>
          )}
        </div>
        <button className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
          <Eye className="h-3 w-3" /> View All
        </button>
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    Severe: "bg-red-100 text-red-700", Moderate: "bg-orange-100 text-orange-700",
    Mild: "bg-yellow-100 text-yellow-700", Chronic: "bg-purple-100 text-purple-700",
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[severity] ?? "bg-slate-100 text-slate-500"}`}>{severity}</span>;
}

function ActionRow({ label, sub, right }: { label: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 leading-tight truncate">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 leading-tight">{sub}</p>}
      </div>
      {right ?? <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Pending:   "bg-amber-50  text-amber-700  border-amber-100",
    Scheduled: "bg-blue-50   text-blue-700   border-blue-100",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {status}
    </span>
  );
}

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div className="grid gap-1 pb-1.5 border-b border-slate-100 mb-1" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
      {cols.map(c => (
        <p key={c} className="text-[9px] font-black uppercase tracking-wider text-slate-400">{c}</p>
      ))}
    </div>
  );
}

function TableRow({ cells, last = false, action }: { cells: (string | React.ReactNode)[]; last?: boolean; action?: React.ReactNode }) {
  return (
    <div className={`grid gap-1 py-2 items-center ${!last ? "border-b border-slate-50" : ""}`}
      style={{ gridTemplateColumns: action ? `repeat(${cells.length}, minmax(0, 1fr)) auto` : `repeat(${cells.length}, minmax(0, 1fr))` }}>
      {cells.map((c, i) => (
        typeof c === "string"
          ? <p key={i} className="text-[11px] text-slate-700 font-medium leading-tight truncate">{c}</p>
          : <div key={i}>{c}</div>
      ))}
      {action && <div className="flex justify-end">{action}</div>}
    </div>
  );
}

// ─── Custom Tooltip for Vitals Chart ─────────────────────────────────────────

function VitalsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800">{p.value}{p.dataKey === "o2" ? "%" : ""}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Face Sheet ──────────────────────────────────────────────────────────

const NO_SOAP_REASONS = [
  "Patient came without any complaint",
  "Follow-up visit, no new findings",
  "Patient refused consultation",
  "Other",
] as const;

const NEXT_APPT_OPTIONS = ["1 Day", "3 Days", "1 Week", "1 Month", "Custom date"] as const;

interface PatientFaceSheetProps {
  entry: MultiEntry;
  soapNoteCreated: boolean;
  onBack: () => void;
  onSoapNoteClick: (id: string) => void;
  onCompleteConsultation: (id: string) => void;
  onCompleteWithoutSoap: (id: string, reason: string, nextAppt: string) => void;
  onSendToLab?: (id: string) => void;
}

export function PatientFaceSheet({
  entry, soapNoteCreated, onBack,
  onSoapNoteClick, onCompleteConsultation, onCompleteWithoutSoap, onSendToLab,
}: PatientFaceSheetProps) {
  const p = entry.patient;
  const name    = p?.name  ?? "Walk-in Patient";
  const mrn     = p?.mrn   ?? "—";
  const dob     = p?.dob   ?? "—";
  const phone   = p?.phone ?? "—";
  const gender  = p?.gender === "F" ? "Female" : "Male";
  const address = "House 14, Street 7, DHA Phase 3, Lahore";

  // ── SOAP Note page navigation ─────────────────────────────────────────────
  const [showSoapPage, setShowSoapPage]   = useState(false);
  const faceSheetOpenedAt                 = useRef(Date.now());

  // ── No-SOAP modal state ────────────────────────────────────────────────────
  const [showNoSoapModal, setShowNoSoapModal] = useState(false);
  const [noSoapReason,    setNoSoapReason]    = useState("");
  const [noSoapOtherText, setNoSoapOtherText] = useState("");
  const [noSoapNextAppt,  setNoSoapNextAppt]  = useState("");
  const [noSoapCustomDate, setNoSoapCustomDate] = useState("");

  const noSoapReasonFilled =
    noSoapReason !== "" &&
    (noSoapReason !== "Other" || noSoapOtherText.trim() !== "") &&
    (noSoapNextAppt !== "" && (noSoapNextAppt !== "Custom date" || noSoapCustomDate !== ""));

  function handleCompleteClick() {
    if (soapNoteCreated) {
      onCompleteConsultation(entry.id);
    } else {
      setNoSoapReason("");
      setNoSoapOtherText("");
      setNoSoapNextAppt("");
      setNoSoapCustomDate("");
      setShowNoSoapModal(true);
    }
  }

  function confirmNoSoap() {
    if (!noSoapReasonFilled) return;
    const reason = noSoapReason === "Other" ? noSoapOtherText.trim() : noSoapReason;
    const appt   = noSoapNextAppt === "Custom date" ? noSoapCustomDate : noSoapNextAppt;
    setShowNoSoapModal(false);
    onCompleteWithoutSoap(entry.id, reason, appt);
  }

  // ── SOAP Note full-page view ──────────────────────────────────────────────
  if (showSoapPage) {
    return (
      <SoapNotePage
        entry={entry}
        onBack={() => setShowSoapPage(false)}
        faceSheetOpenedAt={faceSheetOpenedAt.current}
        onSendToLab={onSendToLab ? () => onSendToLab(entry.id) : undefined}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">

      {/* ── FIXED HEADER ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm">

        {/* Top bar */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Doctor Queue
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient Consultation Face Sheet</span>
          <div className="flex-1" />
          {/* SOAP Note Button */}
          {soapNoteCreated ? (
            <button
              className="flex items-center gap-2 h-9 px-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold hover:bg-emerald-100 transition-colors"
              onClick={() => setShowSoapPage(true)}>
              <CheckCircle2 className="h-4 w-4" /> SOAP Note Created
            </button>
          ) : (
            <Button
              variant="outline"
              className="h-9 px-4 text-sm font-bold gap-2 border-[#4982CF] text-[#4982CF] hover:bg-blue-50"
              onClick={() => { onSoapNoteClick(entry.id); setShowSoapPage(true); }}>
              <FileEdit className="h-4 w-4" /> SOAP Note
            </Button>
          )}
          <Button
            className="h-9 px-4 text-sm font-bold gap-2 text-white"
            style={{ backgroundColor: ACCENT }}
            onClick={handleCompleteClick}>
            <CheckCircle2 className="h-4 w-4" /> Complete Consultation
          </Button>
        </div>

        {/* Patient info row */}
        <div className="flex items-center gap-5 px-5 py-4">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl font-black text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #2d5fa8)` }}>
            {name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <p className="text-xl font-black text-slate-900 leading-tight">{name}</p>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: ACCENT }}>{mrn}</span>
              <span className="text-xs font-semibold text-slate-500 px-2.5 py-1 rounded-full bg-slate-100">{gender}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> DOB: {dob}</span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {phone}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {address}</span>
              <span className="text-slate-300">·</span>
              <span className="text-[10px] text-slate-400">History by: <strong className="text-slate-600">Nurse Amina</strong> · 09:45 AM</span>
            </div>
          </div>

          {/* Today's Vitals quick view */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {VITALS_TODAY.map(v => (
              <div key={v.label} className="flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 min-w-[60px]">
                <span style={{ color: v.color }}>{v.icon}</span>
                <p className="text-sm font-black text-slate-800 mt-1 leading-tight">{v.value}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-wide leading-tight">{v.unit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Critical Conditions Alert */}
        {CRITICAL_CONDITIONS.length > 0 && (
          <div className="rounded-2xl border-2 border-red-300 bg-red-50 px-5 py-3.5 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="h-8 w-8 rounded-xl bg-red-500 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-red-700">Critical / Chronic Conditions</p>
                <p className="text-[10px] text-red-500">Always review before prescribing</p>
              </div>
            </div>
            <div className="w-px h-8 bg-red-200 flex-shrink-0" />
            <div className="flex items-center gap-3 flex-wrap">
              {CRITICAL_CONDITIONS.map(c => (
                <div key={c.code} className="flex items-center gap-2 rounded-xl bg-white border border-red-200 px-3 py-1.5">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${c.color}`} />
                  <span className="text-xs font-bold text-slate-800">{c.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{c.code}</span>
                  <SeverityBadge severity={c.severity} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ROW 1: Vitals Chart + Donut + Pain ──────────────────────────── */}
        <div className="grid grid-cols-12 gap-4">

          {/* Vitals Trend Chart — 7 cols */}
          <div className="col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100" style={{ borderLeftColor: ACCENT, borderLeftWidth: 3 }}>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" style={{ color: ACCENT }} />
                <p className="text-sm font-bold text-slate-800">Vitals Trend</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-[#4982CF]">5 visits</span>
              </div>
              <button className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
                <Eye className="h-3 w-3" /> View All
              </button>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={VITALS_TREND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[60, 145]} />
                  <Tooltip content={<VitalsTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line name="Systolic" type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line name="Diastolic" type="monotone" dataKey="diastolic" stroke="#4982CF" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line name="Pulse" type="monotone" dataKey="pulse" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line name="O₂%" type="monotone" dataKey="o2" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Medication Donut — 3 cols */}
          <div className="col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100" style={{ borderLeftColor: "#10b981", borderLeftWidth: 3 }}>
              <Pill className="h-4 w-4 text-emerald-500" />
              <p className="text-sm font-bold text-slate-800">Medications</p>
            </div>
            <div className="p-3 flex flex-col items-center">
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={MED_CATEGORY_DATA} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                    {MED_CATEGORY_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [v, n]} contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-1 mt-1">
                {MED_CATEGORY_DATA.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-600 font-semibold">{d.name}</span>
                    </div>
                    <span className="font-black text-slate-700">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pain Score Radial — 2 cols */}
          <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100" style={{ borderLeftColor: "#f59e0b", borderLeftWidth: 3 }}>
              <Zap className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-bold text-slate-800">Pain</p>
            </div>
            <div className="flex flex-col items-center justify-center p-3">
              <ResponsiveContainer width="100%" height={100}>
                <RadialBarChart cx="50%" cy="60%" innerRadius="55%" outerRadius="90%" startAngle={180} endAngle={0} data={PAIN_DATA}>
                  <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "#f1f5f9" }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center -mt-2">
                <p className="text-2xl font-black text-amber-600">5</p>
                <p className="text-[10px] text-slate-400 font-semibold">out of 10</p>
                <p className="text-[10px] font-bold text-amber-600 mt-0.5">Moderate</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 1: Allergies + Patient History + Current Medications ─────── */}
        <div className="grid grid-cols-3 gap-4">
          <SectionCard title="Allergies" icon={<Syringe className="h-4 w-4" />} badge={ALLERGIES.length} accentColor="#ef4444">
            <div className="space-y-2">
              {ALLERGIES.map(a => (
                <div key={a.name} className="flex items-center justify-between rounded-xl bg-red-50 border border-red-100 px-3 py-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{a.name}</p>
                    <p className="text-[10px] text-slate-400">{a.reaction}</p>
                  </div>
                  <SeverityBadge severity={a.severity} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Patient History" icon={<ClipboardList className="h-4 w-4" />} badge={3} accentColor="#8b5cf6">
            {HISTORY_RECORDS.map((h, i) => (
              <ActionRow key={i}
                label={h.question}
                sub={`${h.answer} · ${h.by} · ${h.date}`}
              />
            ))}
          </SectionCard>

          <SectionCard title="Current Medications" icon={<Pill className="h-4 w-4" />} badge={3} accentColor="#10b981">
            {MEDICATIONS.map((m, i) => (
              <ActionRow key={i}
                label={m.name}
                sub={`${m.desc} · Since ${m.start}`}
              />
            ))}
          </SectionCard>
        </div>

        {/* ── ROW 2: Presenting Complaint + Physical Examination + Diagnosis ── */}
        <div className="grid grid-cols-3 gap-4">
          <SectionCard title="Presenting Complaint" icon={<ClipboardList className="h-4 w-4" />} badge={3} accentColor="#f59e0b">
            {PRESENTING_COMPLAINTS.map((pc, i) => (
              <ActionRow key={i}
                label={pc.complaint}
                sub={`${pc.date} · ${pc.time} · ${pc.by}`}
              />
            ))}
          </SectionCard>

          <SectionCard title="Physical Examination" icon={<Stethoscope className="h-4 w-4" />} badge={3}>
            {PHYSICAL_EXAMS.map((pe, i) => (
              <ActionRow key={i}
                label={pe.doctor}
                sub={`${pe.date} · ${pe.time} · ${pe.notes}`}
              />
            ))}
          </SectionCard>

          <SectionCard title="Diagnosis" icon={<FileText className="h-4 w-4" />} badge={3} accentColor="#ef4444">
            {DIAGNOSES.map((d, i) => (
              <ActionRow key={i}
                label={`${d.problem}`}
                sub={`${d.code} · Since ${d.start} · ${d.date}`}
              />
            ))}
          </SectionCard>
        </div>

        {/* ── ROW 3: Investigations + Documents + Previous Visits ───────────── */}
        <div className="grid grid-cols-3 gap-4">
          <SectionCard title="Investigations" icon={<FlaskConical className="h-4 w-4" />} badge={3} accentColor="#06b6d4">
            {INVESTIGATIONS.map((inv, i) => (
              <ActionRow key={i}
                label={inv.type}
                sub={`${inv.date} · Advised by ${inv.advisor}`}
              />
            ))}
          </SectionCard>

          <SectionCard title="Documents" icon={<FolderOpen className="h-4 w-4" />} badge={3} accentColor="#f59e0b">
            {DOCUMENTS.map((d, i) => (
              <ActionRow key={i}
                label={d.folder}
                sub={`${d.desc} · ${d.date}`}
              />
            ))}
          </SectionCard>

          <SectionCard title="Previous Visits" icon={<CalendarDays className="h-4 w-4" />} badge={3} accentColor="#8b5cf6">
            {PREVIOUS_VISITS.map((v, i) => (
              <ActionRow key={i}
                label={v.type}
                sub={`${v.doctor} · ${v.date}`}
              />
            ))}
          </SectionCard>
        </div>

        {/* ── ROW 4: Referrals + Surgical Procedures + Vaccination ─────────── */}
        <div className="grid grid-cols-3 gap-4 pb-6">

          {/* Referrals */}
          <SectionCard title="Referrals" icon={<ArrowUpRight className="h-4 w-4" />} badge={REFERRALS.length} accentColor="#6366f1">
            <TableHeader cols={["Date", "Type", "Location", "Status"]} />
            {REFERRALS.map((r, i) => (
              <TableRow
                key={i}
                last={i === REFERRALS.length - 1}
                cells={[r.date, r.type, r.location, <StatusPill status={r.status} />]}
                action={
                  <button className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors whitespace-nowrap">
                    <ExternalLink className="h-3 w-3" /> View
                  </button>
                }
              />
            ))}
          </SectionCard>

          {/* Surgical Procedures */}
          <SectionCard title="Surgical Procedures" icon={<Scissors className="h-4 w-4" />} badge={SURGICAL_PROCEDURES.length} accentColor="#ec4899">
            <TableHeader cols={["Date", "Diagnosis", "Procedure", "Status"]} />
            {SURGICAL_PROCEDURES.map((s, i) => (
              <TableRow
                key={i}
                last={i === SURGICAL_PROCEDURES.length - 1}
                cells={[s.date, s.diagnosis, s.procedure, <StatusPill status={s.status} />]}
              />
            ))}
          </SectionCard>

          {/* Vaccination */}
          <SectionCard title="Vaccination" icon={<ShieldCheck className="h-4 w-4" />} badge={VACCINATIONS.length} accentColor="#10b981">
            <TableHeader cols={["Schedule", "Vaccine", "Administered On", "By"]} />
            {VACCINATIONS.map((v, i) => (
              <TableRow
                key={i}
                last={i === VACCINATIONS.length - 1}
                cells={[v.schedule, v.vaccine, v.administeredOn, v.administeredBy]}
              />
            ))}
          </SectionCard>

        </div>
      </div>

      {/* ── No SOAP Note Modal ───────────────────────────────────────────────── */}
      {showNoSoapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <p className="text-base font-black text-slate-900">No SOAP Note Created</p>
                <p className="text-xs text-slate-400 mt-0.5">Please provide a reason before completing the consultation.</p>
              </div>
              <button onClick={() => setShowNoSoapModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={noSoapReason}
                  onChange={e => { setNoSoapReason(e.target.value); setNoSoapOtherText(""); }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ ["--tw-ring-color" as any]: ACCENT }}>
                  <option value="">Select a reason…</option>
                  {NO_SOAP_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {noSoapReason === "Other" && (
                  <textarea
                    value={noSoapOtherText}
                    onChange={e => setNoSoapOtherText(e.target.value)}
                    placeholder="Describe the reason…"
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ ["--tw-ring-color" as any]: ACCENT }}
                  />
                )}
              </div>

              {/* Next appointment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Schedule Next Appointment <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {NEXT_APPT_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setNoSoapNextAppt(opt); setNoSoapCustomDate(""); }}
                      className="px-3 py-1.5 rounded-full text-xs font-bold border transition-colors"
                      style={noSoapNextAppt === opt
                        ? { backgroundColor: ACCENT, borderColor: ACCENT, color: "#fff" }
                        : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#475569" }}>
                      {opt}
                    </button>
                  ))}
                </div>
                {noSoapNextAppt === "Custom date" && (
                  <input
                    type="date"
                    value={noSoapCustomDate}
                    onChange={e => setNoSoapCustomDate(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ ["--tw-ring-color" as any]: ACCENT }}
                  />
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <Button variant="outline" className="h-9 px-4 text-sm" onClick={() => setShowNoSoapModal(false)}>
                Cancel
              </Button>
              <Button
                disabled={!noSoapReasonFilled}
                className="h-9 px-5 text-sm font-bold text-white gap-2 disabled:opacity-40"
                style={{ backgroundColor: ACCENT }}
                onClick={confirmNoSoap}>
                <CheckCircle2 className="h-4 w-4" /> Confirm & Complete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
