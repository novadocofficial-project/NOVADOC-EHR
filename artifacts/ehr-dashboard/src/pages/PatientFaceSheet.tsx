import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft, FileEdit, AlertTriangle, Eye,
  Activity, Heart, Thermometer, Droplets, User, Phone, MapPin,
  CalendarDays, Stethoscope, Pill, FlaskConical, FileText,
  FolderOpen, ClipboardList, CheckCircle2, Syringe, Zap, Brain,
  ArrowUpRight, Scissors, ShieldCheck, ExternalLink, X, Clock,
  Maximize2, Minimize2, ChevronDown,
} from "lucide-react";
import { SOAP_DUMMY } from "@/data/soapDummy";
import { Button } from "@/components/ui/button";
import { MultiEntry } from "@/hooks/useMultiStepQueue";
import { SoapNotePage } from "@/pages/SoapNotePage";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from "recharts";

// ─── Accent ───────────────────────────────────────────────────────────────────

const ACCENT = "#4982CF";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBP(bp: string): { systolic: number; diastolic: number } {
  const [s, d] = bp.split("/").map(Number);
  return { systolic: s || 0, diastolic: d || 0 };
}
function longDate(signedAt: string)  { return signedAt.split(",")[0]; }
function shortDate(signedAt: string) { return signedAt.split(",")[0].split(" ").slice(0, 2).join(" "); }
function visitTime(signedAt: string) { return signedAt.split(", ")[1] ?? ""; }

// ─── All clinical data derived from SOAP_DUMMY ────────────────────────────────

// Vitals Trend — 3 real visits in chronological order (oldest → newest)
const VITALS_TREND = [...SOAP_DUMMY].reverse().map(r => {
  const { systolic, diastolic } = parseBP(r.vitals.bp);
  return { date: shortDate(r.signedAt), systolic, diastolic, pulse: Number(r.vitals.pulse), o2: Number(r.vitals.spo2) };
});

// Today's Vitals — from most recent SOAP record (SOAP_DUMMY[0] = Dec 10)
const _v = SOAP_DUMMY[0].vitals;
const VITALS_TODAY = [
  { label: "BP",     value: _v.bp,               unit: "mmHg", icon: <Activity className="h-4 w-4" />,   color: "#4982CF" },
  { label: "Pulse",  value: _v.pulse,             unit: "bpm",  icon: <Heart className="h-4 w-4" />,       color: "#ef4444" },
  { label: "Temp",   value: _v.temp,              unit: "°C",   icon: <Thermometer className="h-4 w-4" />, color: "#f59e0b" },
  { label: "O₂ Sat", value: _v.spo2 + "%",        unit: "SpO₂", icon: <Droplets className="h-4 w-4" />,   color: "#10b981" },
  { label: "Weight", value: _v.weight.replace(" kg",""), unit: "kg", icon: <User className="h-4 w-4" />,   color: "#8b5cf6" },
];

// Critical Conditions — High-severity diagnoses, deduplicated, across all records
const CRITICAL_CONDITIONS = SOAP_DUMMY
  .flatMap(r => r.diagnoses)
  .filter(d => d.severity === "High")
  .filter((d, i, arr) => arr.findIndex(x => x.code === d.code) === i)
  .map(d => ({ name: d.name.replace(/ —.*$/, ""), code: d.code, severity: "Chronic", color: "bg-red-600" }));

// Allergies — consolidated from all records, NKDA excluded, deduplicated
const ALLERGIES = SOAP_DUMMY
  .flatMap(r => r.allergies)
  .filter(a => !a.name.toLowerCase().startsWith("no known"))
  .filter((a, i, arr) => arr.findIndex(x => x.name === a.name) === i)
  .map(a => ({ name: a.name, reaction: a.reaction, severity: a.severity }));

// Previous Visits — one row per SOAP record
const PREVIOUS_VISITS = SOAP_DUMMY.map(r => ({
  type: r.cc.slice(0, 2).join(", "),
  doctor: r.signedBy,
  date: longDate(r.signedAt),
}));

// Physical Exams — first PE finding per record
const PHYSICAL_EXAMS = SOAP_DUMMY.map(r => ({
  date: longDate(r.signedAt),
  time: visitTime(r.signedAt),
  doctor: r.signedBy,
  notes: r.pe[0] ?? "",
}));

// Medications — ongoing only (exclude acute meds from URTI visit)
const ACUTE_KEYWORDS = ["Azithromycin", "Paracetamol", "Salbutamol"];
const MEDICATIONS = SOAP_DUMMY
  .flatMap(r => r.prescriptions.map(rx => ({ name: rx.drug, desc: rx.sig, start: longDate(r.signedAt) })))
  .filter(m => !ACUTE_KEYWORDS.some(kw => m.name.startsWith(kw)))
  .filter((m, i, arr) => arr.findIndex(x => x.name === m.name) === i);

// Presenting Complaints — cc array joined per record
const PRESENTING_COMPLAINTS = SOAP_DUMMY.map(r => ({
  date: longDate(r.signedAt),
  time: visitTime(r.signedAt),
  complaint: r.cc.join(", "),
  by: r.signedBy,
}));

// Investigations — first lab order per record
const INVESTIGATIONS = SOAP_DUMMY
  .filter(r => r.labs.length > 0)
  .map(r => ({ date: longDate(r.signedAt), type: r.labs[0], advisor: r.signedBy }));

// Diagnoses — most significant (first) diagnosis per record
const DIAGNOSES = SOAP_DUMMY.map(r => {
  const top = r.diagnoses[0];
  const parts = longDate(r.signedAt).split(" ");
  return { date: longDate(r.signedAt), code: top.code, problem: top.name.replace(/ —.*$/, ""), start: parts.slice(1).join(" ") };
});

// Documents — no SOAP source; kept as static (document management module data)
const DOCUMENTS = [
  { date: longDate(SOAP_DUMMY[0].signedAt), folder: "Lab Results",  desc: "CBC, CRP/ESR, Throat swab C&S" },
  { date: longDate(SOAP_DUMMY[1].signedAt), folder: "Cardiology",   desc: "ECG strip & ABPM report" },
  { date: longDate(SOAP_DUMMY[2].signedAt), folder: "Ophthalmology", desc: "Fundus photography report" },
];

// Patient History Q&A — social / family / medical history from SOAP records
const HISTORY_RECORDS = [
  { date: longDate(SOAP_DUMMY[0].signedAt), by: SOAP_DUMMY[0].signedBy, question: "Social History",  answer: SOAP_DUMMY[0].socialHistory.join("; ") },
  { date: longDate(SOAP_DUMMY[0].signedAt), by: SOAP_DUMMY[0].signedBy, question: "Family History",  answer: SOAP_DUMMY[0].familyHistory.join("; ") },
  { date: longDate(SOAP_DUMMY[2].signedAt), by: SOAP_DUMMY[2].signedBy, question: "Medical History", answer: SOAP_DUMMY[2].medicalHistory.join("; ") },
];

// Referrals — all referrals from all records with status by visit recency
const REFERRALS = SOAP_DUMMY
  .flatMap((r, ri) => r.referrals.map(ref => ({
    date: longDate(r.signedAt),
    type: ref.specialty,
    location: "—",
    status: (ri === 0 ? "Pending" : ri === 1 ? "Scheduled" : "Completed") as "Pending" | "Scheduled" | "Completed",
  })))
  .slice(0, 4);

// Surgical Procedures — parsed from surgicalHistory strings
const SURGICAL_PROCEDURES = SOAP_DUMMY
  .flatMap(r => r.surgicalHistory
    .filter(h => !h.toLowerCase().includes("no prior"))
    .map(h => {
      const [proc, rest] = h.split(/\s*—\s*/);
      const yearMatch = rest?.match(/\d{4}/);
      const parens = rest?.match(/\(([^)]+)\)/)?.[1];
      return {
        date: yearMatch ? yearMatch[0] : "—",
        diagnosis: "",
        procedure: parens ? `${proc.trim()} (${parens})` : proc.trim(),
        status: "Completed" as const,
      };
    })
  );

// Vaccinations — no SOAP source; kept as static (vaccination registry data)
const VACCINATIONS = [
  { schedule: "Annual",    vaccine: "Influenza (Flu) Vaccine",         administeredOn: "01 Oct 2024", administeredBy: "Nurse Amina" },
  { schedule: "Booster",   vaccine: "COVID-19 (Moderna XBB.1.5)",      administeredOn: "14 Mar 2024", administeredBy: "Nurse Sara"  },
  { schedule: "Decennial", vaccine: "Tetanus-Diphtheria (Td) Booster", administeredOn: "22 Jan 2022", administeredBy: "Nurse Amina" },
];

// Medication Donut — derived from ongoing medication categories
const MED_CATEGORY_DATA = [
  { name: "Hypertension", value: 2, color: "#4982CF" },
  { name: "Diabetes",     value: 2, color: "#ef4444" },
  { name: "Supplements",  value: 1, color: "#10b981" },
];

// Pain score radial — from nursing vitals assessment (5/10)
const PAIN_DATA = [{ name: "Pain", value: 50, fill: "#f59e0b" }];

// ─── Presenting Complaints Drawer data ────────────────────────────────────────

interface VisitComplaintRecord {
  date:       string;
  time:       string;
  doctor:     string;
  visitType:  string;
  hpi:        string;
  complaints: { name: string; priority: number }[];
}

const VISIT_COMPLAINTS: VisitComplaintRecord[] = SOAP_DUMMY.map(r => {
  const [datePart, timePart] = r.signedAt.split(", ");
  return {
    date:       datePart ?? "",
    time:       timePart ?? "",
    doctor:     r.signedBy,
    visitType:  "OPD",
    hpi:        r.hpi,
    complaints: r.cc.map((name, i) => ({ name, priority: i + 1 })),
  };
});

// ─── Presenting Complaints Drawer ─────────────────────────────────────────────

function PresentingComplaintsDrawer({ onClose }: { onClose: () => void }) {
  const [fullscreen,   setFullscreen]   = useState(false);
  const [expandedIdx,  setExpandedIdx]  = useState<number | null>(null);

  return createPortal(
    <>
      {/* Backdrop */}
      {!fullscreen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[9000]"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div className={[
        "fixed top-0 right-0 h-full bg-white shadow-2xl flex flex-col z-[9001] transition-all duration-300",
        fullscreen ? "w-full" : "w-1/2 border-l border-slate-200",
      ].join(" ")}>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#f59e0b18" }}>
            <ClipboardList className="h-4 w-4" style={{ color: "#f59e0b" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Record</p>
            <p className="text-sm font-black text-slate-800">Presenting Complaints</p>
          </div>
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full text-white flex-shrink-0"
            style={{ backgroundColor: "#f59e0b" }}>
            {VISIT_COMPLAINTS.length} visits
          </span>
          <button
            onClick={() => setFullscreen(f => !f)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Sub-header ── */}
        <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 flex-shrink-0">
          <p className="text-[10px] text-amber-700 font-semibold">
            Sorted most recent first · Priority order preserved per visit · Click a visit to expand
          </p>
        </div>

        {/* ── Visit cards ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {VISIT_COMPLAINTS.map((visit, i) => {
            const isExpanded  = expandedIdx === i;
            const extraCount  = visit.complaints.length - 1;
            const primary     = visit.complaints[0];
            const [day, month, year] = visit.date.split(" ");

            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Card header — always visible, click to expand */}
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">

                  {/* Date block */}
                  <div className="w-16 flex-shrink-0 text-center">
                    <p className="text-xs font-black text-slate-800 leading-tight">{day} {month}</p>
                    <p className="text-[10px] text-slate-400">{year}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{visit.time}</p>
                  </div>

                  <div className="w-px self-stretch bg-slate-200 flex-shrink-0" />

                  {/* Visit info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: "#f59e0b" }}>
                        {visit.visitType}
                      </span>
                      <span className="text-[10px] text-slate-500">{visit.doctor}</span>
                    </div>
                    {/* Collapsed summary */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {primary && (
                        <span className="text-xs font-bold text-slate-800">{primary.name}</span>
                      )}
                      {!isExpanded && extraCount > 0 && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                          +{extraCount} more
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {visit.complaints.length} complaint{visit.complaints.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Chevron */}
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-4 space-y-4">

                    {/* HPI block */}
                    <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1.5">
                        History of Present Illness
                      </p>
                      <p className="text-[11px] text-blue-800 leading-relaxed">{visit.hpi}</p>
                    </div>

                    {/* Numbered complaints */}
                    <div className="space-y-2.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        Complaint Priority
                      </p>
                      {visit.complaints.map((c, j) => (
                        <div key={j} className="flex items-start gap-3 bg-white rounded-xl border border-slate-100 px-3.5 py-3 shadow-sm">
                          {/* Priority number */}
                          <span
                            className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: j === 0 ? "#f59e0b" : "#94a3b8" }}>
                            {c.priority}
                          </span>

                          {/* Complaint detail */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800">{c.name}</p>
                            {j === 0 ? (
                              <p className="text-[10px] text-slate-500 mt-0.5 italic">
                                Primary complaint — detailed in HPI above
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 mt-0.5 italic">
                                Associated presenting complaint
                              </p>
                            )}
                          </div>

                          {/* Primary badge */}
                          {j === 0 && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0 self-start">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title, icon, badge, children, accentColor = ACCENT, onViewAll,
}: {
  title: string; icon: React.ReactNode; badge?: number;
  children: React.ReactNode; accentColor?: string; onViewAll?: () => void;
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
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
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
      {right}
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
  /** True when the patient is in the lab journey (pendingLab OR labResultsReady),
   *  has an unsigned draft, and has not yet been signed by the doctor.
   *  Drives the amber "SOAP Note · In Progress" badge and disables Complete Consultation. */
  soapNoteInProgress?: boolean;
  onBack: () => void;
  onSoapNoteClick: (id: string) => void;
  onCompleteConsultation: (id: string) => void;
  onCompleteWithoutSoap: (id: string, reason: string, nextAppt: string) => void;
  onSendToLab?: (id: string) => void;
  onDiscardLab?: (id: string) => void;
  onSaveAndClose?: () => void;
  doctorSigned?: boolean;
  onDoctorSign?: (noteState: import("@/pages/ClinicalNoteDrawer").NoteState | null) => void;
  signedRecords?: import("@/pages/SoapNotePage").SignedRecord[];
}

export function PatientFaceSheet({
  entry, soapNoteCreated, soapNoteInProgress = false, onBack,
  onSoapNoteClick, onCompleteConsultation, onCompleteWithoutSoap, onSendToLab, onDiscardLab, onSaveAndClose,
  doctorSigned = false, onDoctorSign, signedRecords = [],
}: PatientFaceSheetProps) {
  const p = entry.patient;
  const name    = p?.name  ?? "Walk-in Patient";
  const mrn     = p?.mrn   ?? "—";
  const dob     = p?.dob   ?? "—";
  const phone   = p?.phone ?? "—";
  const gender  = p?.gender === "F" ? "Female" : p?.gender === "O" ? "Other" : "Male";
  const address = "House 14, Street 7, DHA Phase 3, Lahore";

  // ── SOAP Note page navigation ─────────────────────────────────────────────
  const [showSoapPage,          setShowSoapPage]          = useState(false);
  const faceSheetOpenedAt                                 = useRef(Date.now());

  // ── Presenting Complaints drawer ───────────────────────────────────────────
  const [showComplaintsDrawer,  setShowComplaintsDrawer]  = useState(false);

  // ── Back-to-queue prompt (shown when signed & soapNoteCreated) ─────────────
  const [showBackPrompt, setShowBackPrompt] = useState(false);

  function handleBackClick() {
    if (soapNoteCreated && doctorSigned) {
      setShowBackPrompt(true);
    } else {
      onBack();
    }
  }

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
    // Safety guard — button is visually disabled, but guard defensively too.
    if (soapNoteInProgress) return;
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
        onDiscardLab={onDiscardLab ? () => onDiscardLab(entry.id) : undefined}
        onSaveAndClose={onSaveAndClose}
        onDoctorSign={onDoctorSign}
        signedRecords={signedRecords}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">

      {/* ── FIXED HEADER ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm">

        {/* Top bar */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100">
          <button onClick={handleBackClick}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Doctor Queue
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient Consultation Face Sheet</span>
          <div className="flex-1" />
          {/* SOAP Note Button — 3 states in priority order:
               1. soapNoteInProgress (opened/saved, not yet signed) → amber
               2. soapNoteCreated + doctorSigned                    → emerald Signed
               3. not yet opened                                    → blue Start */}
          {soapNoteInProgress ? (
            <button
              className="flex items-center gap-2 h-9 px-4 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold hover:bg-amber-100 transition-colors"
              onClick={() => setShowSoapPage(true)}>
              <Clock className="h-4 w-4" /> SOAP Note · In Progress
            </button>
          ) : soapNoteCreated ? (
            <button
              className="flex items-center gap-2 h-9 px-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold hover:bg-emerald-100 transition-colors"
              onClick={() => setShowSoapPage(true)}>
              <CheckCircle2 className="h-4 w-4" /> SOAP Note · Signed
            </button>
          ) : (
            <Button
              variant="outline"
              className="h-9 px-4 text-sm font-bold gap-2 border-[#4982CF] text-[#4982CF] hover:bg-blue-50"
              onClick={() => { onSoapNoteClick(entry.id); setShowSoapPage(true); }}>
              <FileEdit className="h-4 w-4" /> SOAP Note
            </Button>
          )}
          {(() => {
            // isBlocked: any patient with an in-progress note must sign before
            // completing. pendingLab is a separate hard block (patient in lab).
            const isBlocked = entry.pendingLab || soapNoteInProgress;
            const blockTitle = entry.pendingLab
              ? "Patient is in the lab — complete consultation after results are reviewed."
              : soapNoteInProgress
              ? "Sign the SOAP note before completing the consultation."
              : undefined;
            return (
              <span title={blockTitle} className={isBlocked ? "cursor-not-allowed" : undefined}>
                <Button
                  className="h-9 px-4 text-sm font-bold gap-2 text-white"
                  style={{ backgroundColor: isBlocked ? "#94a3b8" : ACCENT }}
                  disabled={isBlocked}
                  onClick={!isBlocked ? handleCompleteClick : undefined}>
                  <CheckCircle2 className="h-4 w-4" /> Complete Consultation
                </Button>
              </span>
            );
          })()}
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

          {/* Pain Score — 3 cols */}
          <div className="col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100" style={{ borderLeftColor: "#f59e0b", borderLeftWidth: 3 }}>
              <Zap className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-bold text-slate-800">Pain Score</p>
            </div>
            <div className="flex flex-col items-center justify-center p-3">
              <ResponsiveContainer width="100%" height={120}>
                <RadialBarChart cx="50%" cy="65%" innerRadius="50%" outerRadius="85%" startAngle={180} endAngle={0} data={PAIN_DATA}>
                  <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "#f1f5f9" }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center -mt-3">
                <p className="text-3xl font-black text-amber-600">5</p>
                <p className="text-[10px] text-slate-400 font-semibold">out of 10</p>
                <p className="text-[10px] font-bold text-amber-600 mt-0.5">Moderate</p>
              </div>
            </div>
          </div>

          {/* Mental Health Score — 2 cols */}
          <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100" style={{ borderLeftColor: "#8b5cf6", borderLeftWidth: 3 }}>
              <Brain className="h-4 w-4 text-violet-500" />
              <p className="text-sm font-bold text-slate-800">Mental Health</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 gap-1">
              <p className="text-3xl font-black text-violet-600">8</p>
              <p className="text-[10px] text-slate-400 font-semibold">out of 16</p>
              <p className="text-[10px] font-bold text-violet-600 mt-0.5">Mild</p>
              <p className="text-[9px] text-slate-400 mt-1 text-center leading-tight">PHQ-4 Screen</p>
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
          <SectionCard
            title="Presenting Complaint"
            icon={<ClipboardList className="h-4 w-4" />}
            badge={3}
            accentColor="#f59e0b"
            onViewAll={() => setShowComplaintsDrawer(true)}>
            {PRESENTING_COMPLAINTS.map((pc, i) => (
              <ActionRow key={i}
                label={pc.complaint}
                sub={`${pc.date} · ${pc.time} · ${pc.by}`}
              />
            ))}
          </SectionCard>

          {showComplaintsDrawer && (
            <PresentingComplaintsDrawer onClose={() => setShowComplaintsDrawer(false)} />
          )}

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

      {/* ── Back-to-Queue Confirmation Modal ─────────────────────────────── */}
      {showBackPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[340px] max-w-[92vw]">
            {/* Icon + title row */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: `${ACCENT}15` }}>
                <CheckCircle2 className="h-5 w-5" style={{ color: ACCENT }} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">Mark consultation as complete?</p>
                <p className="text-xs text-slate-400 mt-0.5">The SOAP note has been signed by the doctor.</p>
              </div>
            </div>
            {/* Body — indented to align with title text (icon 40px + gap 12px = 52px) */}
            <p className="text-xs text-slate-500 leading-relaxed mt-3 mb-5" style={{ paddingLeft: 52 }}>
              Would you like to complete this consultation and move the patient out of the queue?
              Selecting <strong className="text-slate-700 font-semibold">No</strong> keeps the patient
              in the queue with the facesheet accessible.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-9 text-sm"
                onClick={() => { setShowBackPrompt(false); onBack(); }}>
                No, Keep in Queue
              </Button>
              <Button
                className="flex-1 h-9 text-sm font-bold text-white gap-1.5"
                style={{ backgroundColor: ACCENT }}
                onClick={() => { setShowBackPrompt(false); onCompleteConsultation(entry.id); }}>
                <CheckCircle2 className="h-4 w-4" /> Yes, Complete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
