import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ReferenceArea, ResponsiveContainer, Dot,
} from "recharts";
import {
  PhoneCall, SkipForward, RotateCcw,
  ChevronUp, ChevronDown, Clock, AlertCircle, X,
  CheckCircle2, FlaskConical, User, Heart,
  ChevronRight, Maximize2, Minimize2, TestTube2,
  AlertTriangle, FileText, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueueAppHeader, timeAgo } from "@/pages/QueuePageLayout";
import { useMultiStepQueue, MultiEntry } from "@/hooks/useMultiStepQueue";
import { readActiveLabOrder } from "@/hooks/useSoapNoteDraft";

// ─── Constants ────────────────────────────────────────────────────────────────

const LAB_ACCENT = "#4982CF";
const CALL_WINDOW_SECS = 30;
const MAX_CALLS        = 3;

function getSecsLeft(ts: number | null): number {
  if (!ts) return 0;
  return Math.max(0, CALL_WINDOW_SECS - Math.floor((Date.now() - ts) / 1000));
}

// ─── Seed lab orders ──────────────────────────────────────────────────────────

interface LabTest {
  id: string;
  serial: number;
  name: string;
  lab: string;
  status: "pending" | "completed";
  updatedAt: string;
}

interface LabOrder {
  id: string;
  orderedBy: string;
  orderDate: string;
  tests: LabTest[];
}

const SEED_LAB_ORDERS: LabOrder[] = [
  {
    id: "lo-1",
    orderedBy: "Dr. Asif Imam",
    orderDate: "10 Dec 2024",
    tests: [
      { id: "lt1", serial: 1, name: "Complete Blood Count (CBC)",        lab: "CityPath Diagnostics", status: "pending",   updatedAt: "" },
      { id: "lt2", serial: 2, name: "C-Reactive Protein (CRP)",          lab: "CityPath Diagnostics", status: "pending",   updatedAt: "" },
      { id: "lt3", serial: 3, name: "Throat Swab Culture & Sensitivity", lab: "ABC Lab",              status: "pending",   updatedAt: "" },
    ],
  },
  {
    id: "lo-2",
    orderedBy: "Dr. Emily Wong",
    orderDate: "09 Dec 2024",
    tests: [
      { id: "lt4", serial: 1, name: "Fasting Blood Sugar", lab: "Hashmani Laboratories", status: "completed", updatedAt: "09 Dec 2024, 10:30 AM" },
      { id: "lt5", serial: 2, name: "Lipid Profile",       lab: "Hashmani Laboratories", status: "completed", updatedAt: "09 Dec 2024, 11:00 AM" },
    ],
  },
];

// ─── Collapsible ─────────────────────────────────────────────────────────────

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

// ─── Result field templates ───────────────────────────────────────────────────

interface ResultField {
  label: string;
  key: string;
  unit?: string;
  multiline?: boolean;
  normalRange?: string;
  min?: number;
  max?: number;
}

const GENERIC_RESULT_FIELDS: ResultField[] = [
  { label: "Result",       key: "result",    multiline: true },
  { label: "Collected At", key: "collected" },
  { label: "Notes",        key: "notes",     multiline: true },
];

const RESULT_FIELDS: Record<string, ResultField[]> = {
  // Hematology
  cbc: [
    { label: "WBC Count",    key: "wbc",  unit: "×10³/µL", normalRange: "4.0–11.0",  min: 4.0,  max: 11.0 },
    { label: "RBC Count",    key: "rbc",  unit: "×10⁶/µL", normalRange: "4.0–5.5",   min: 4.0,  max: 5.5  },
    { label: "Haemoglobin",  key: "hgb",  unit: "g/dL",    normalRange: "12.0–17.5", min: 12.0, max: 17.5 },
    { label: "Haematocrit",  key: "hct",  unit: "%",        normalRange: "36–50",     min: 36,   max: 50   },
    { label: "Platelets",    key: "plt",  unit: "×10³/µL", normalRange: "150–400",   min: 150,  max: 400  },
    { label: "Collected At", key: "collected" },
    { label: "Notes",        key: "notes", multiline: true },
  ],
  esr: [
    { label: "ESR",          key: "esr",  unit: "mm/hr", normalRange: "0–20", min: 0, max: 20 },
    { label: "Collected At", key: "collected" },
    { label: "Notes",        key: "notes", multiline: true },
  ],
  // Inflammatory markers
  crp: [
    { label: "CRP Value",    key: "crp",  unit: "mg/L", normalRange: "< 10", max: 10 },
    { label: "Collected At", key: "collected" },
    { label: "Notes",        key: "notes", multiline: true },
  ],
  crp_hs: [
    { label: "hsCRP",        key: "hscrp", unit: "mg/L", normalRange: "< 3", max: 3 },
    { label: "Collected At", key: "collected" },
    { label: "Notes",        key: "notes", multiline: true },
  ],
  // Microbiology
  throat_sw: [
    { label: "Organism",     key: "organism" },
    { label: "Sensitivity",  key: "sensitivity" },
    { label: "Result",       key: "result" },
    { label: "Collected At", key: "collected" },
    { label: "Notes",        key: "notes", multiline: true },
  ],
  urine_cx: [
    { label: "Organism",     key: "organism" },
    { label: "Sensitivity",  key: "sensitivity" },
    { label: "Colony Count", key: "colony_count" },
    { label: "Collected At", key: "collected" },
    { label: "Notes",        key: "notes", multiline: true },
  ],
  blood_cx: [
    { label: "Organism",     key: "organism" },
    { label: "Sensitivity",  key: "sensitivity" },
    { label: "Result",       key: "result" },
    { label: "Collected At", key: "collected" },
    { label: "Notes",        key: "notes", multiline: true },
  ],
  sputum_cs: [
    { label: "Organism",     key: "organism" },
    { label: "Sensitivity",  key: "sensitivity" },
    { label: "Result",       key: "result" },
    { label: "Collected At", key: "collected" },
    { label: "Notes",        key: "notes", multiline: true },
  ],
  stool_cs: [
    { label: "Organism",     key: "organism" },
    { label: "Result",       key: "result" },
    { label: "Collected At", key: "collected" },
    { label: "Notes",        key: "notes", multiline: true },
  ],
  // Blood Chemistry
  glucose_f: [
    { label: "Fasting Blood Sugar", key: "fbs", unit: "mmol/L", normalRange: "3.9–5.5", min: 3.9, max: 5.5 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  glucose_r: [
    { label: "Random Blood Sugar",  key: "rbs", unit: "mmol/L", normalRange: "< 7.8", max: 7.8 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  glucose_2h: [
    { label: "2-hr Post-Prandial",  key: "ppbs", unit: "mmol/L", normalRange: "< 7.8", max: 7.8 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  hba1c: [
    { label: "HbA1c",               key: "hba1c", unit: "%", normalRange: "< 5.7", max: 5.7 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  bun: [
    { label: "BUN",                 key: "bun",  unit: "mmol/L", normalRange: "2.5–6.4", min: 2.5, max: 6.4 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  creatinine: [
    { label: "Creatinine (Serum)",  key: "cr",   unit: "µmol/L", normalRange: "44–106", min: 44, max: 106 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  uric_acid: [
    { label: "Uric Acid",           key: "ua",   unit: "mmol/L", normalRange: "0.18–0.42", min: 0.18, max: 0.42 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  // Liver Function
  alt: [
    { label: "ALT",                 key: "alt",  unit: "U/L", normalRange: "7–56", min: 7, max: 56 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  ast: [
    { label: "AST",                 key: "ast",  unit: "U/L", normalRange: "10–40", min: 10, max: 40 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  alp: [
    { label: "ALP",                 key: "alp",  unit: "U/L", normalRange: "44–147", min: 44, max: 147 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  bilirubin_t: [
    { label: "Total Bilirubin",     key: "tbil", unit: "µmol/L", normalRange: "3.4–20.5", min: 3.4, max: 20.5 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  bilirubin_d: [
    { label: "Direct Bilirubin",    key: "dbil", unit: "µmol/L", normalRange: "0–5.1", min: 0, max: 5.1 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  albumin: [
    { label: "Albumin",             key: "alb",  unit: "g/L", normalRange: "35–50", min: 35, max: 50 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  // Lipids — individual tests
  cholesterol: [
    { label: "Total Cholesterol",   key: "total_chol", unit: "mmol/L", normalRange: "< 5.2",  max: 5.2 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  ldl: [
    { label: "LDL Cholesterol",     key: "ldl",        unit: "mmol/L", normalRange: "< 3.4",  max: 3.4 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  hdl: [
    { label: "HDL Cholesterol",     key: "hdl",        unit: "mmol/L", normalRange: "> 1.0",  min: 1.0 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  tg: [
    { label: "Triglycerides",       key: "trig",       unit: "mmol/L", normalRange: "< 1.7",  max: 1.7 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  // Cardiac
  troponin_i: [
    { label: "Troponin I (hs)",     key: "trop",  unit: "ng/L", normalRange: "< 26", max: 26 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  bnp: [
    { label: "BNP",                 key: "bnp",   unit: "pg/mL", normalRange: "< 100", max: 100 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
  // Ferritin
  ferritin: [
    { label: "Ferritin",            key: "ferritin", unit: "ng/mL", normalRange: "12–300", min: 12, max: 300 },
    { label: "Collected At",        key: "collected" },
    { label: "Notes",               key: "notes", multiline: true },
  ],
};

function getFlag(value: string, field: ResultField): "H" | "L" | "N" | "—" {
  if (!field.normalRange) return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  if (field.max !== undefined && num > field.max) return "H";
  if (field.min !== undefined && num < field.min) return "L";
  return "N";
}

function isOutOfRange(value: string, field: ResultField): boolean {
  const f = getFlag(value, field);
  return f === "H" || f === "L";
}

// ─── Seed past lab records ────────────────────────────────────────────────────

interface PastLabRecord {
  id: string;
  date: string;
  dateRange: string;
  orderedBy: string;
  tests: { name: string; result: string; unit: string; ref: string; flag?: "H" | "L" | "N" }[];
}

const SEED_PAST_LAB_RECORDS: PastLabRecord[] = [
  {
    id: "pr-1",
    date: "21 Feb 2025",
    dateRange: "21 Feb 2025 · Reported 23 Feb 2025",
    orderedBy: "Dr. Emily Wong",
    tests: [
      { name: "WBC Count",             result: "7.2",  unit: "×10³/µL", ref: "4.0–11.0",       flag: "N" },
      { name: "Haemoglobin",           result: "13.8", unit: "g/dL",    ref: "12.0–17.5",       flag: "N" },
      { name: "Platelets",             result: "290",  unit: "×10³/µL", ref: "150–400",         flag: "N" },
      { name: "Total Cholesterol",     result: "4.2",  unit: "mmol/L",  ref: "< 5.2",           flag: "N" },
      { name: "LDL",                   result: "2.9",  unit: "mmol/L",  ref: "< 3.4",           flag: "N" },
      { name: "Fasting Blood Sugar",   result: "5.8",  unit: "mmol/L",  ref: "3.9–5.5",         flag: "H" },
    ],
  },
  {
    id: "pr-2",
    date: "14 Jan 2025",
    dateRange: "14 Jan 2025 · Reported 15 Jan 2025",
    orderedBy: "Dr. Asif Imam",
    tests: [
      { name: "CRP",         result: "12",               unit: "mg/L", ref: "< 10",    flag: "H" },
      { name: "Organism",    result: "Strep A positive", unit: "—",    ref: "Negative"           },
      { name: "Sensitivity", result: "Penicillin",       unit: "—",    ref: "—"                  },
    ],
  },
];

// ─── Trend seed data ──────────────────────────────────────────────────────────

interface TrendSeries {
  param: string;
  unit: string;
  normalRange: string;
  min?: number;
  max?: number;
  points: { date: string; value: number }[];
}

const TREND_DATA: TrendSeries[] = [
  {
    param: "WBC Count", unit: "×10³/µL", normalRange: "4.0–11.0", min: 4.0, max: 11.0,
    points: [
      { date: "Apr '24", value: 8.1 },
      { date: "Jul '24", value: 9.4 },
      { date: "Oct '24", value: 11.6 },
      { date: "Jan '25", value: 10.2 },
      { date: "Feb '25", value: 7.2 },
    ],
  },
  {
    param: "Haemoglobin", unit: "g/dL", normalRange: "12.0–17.5", min: 12.0, max: 17.5,
    points: [
      { date: "Apr '24", value: 15.1 },
      { date: "Jul '24", value: 14.6 },
      { date: "Oct '24", value: 13.2 },
      { date: "Jan '25", value: 11.8 },
      { date: "Feb '25", value: 13.8 },
    ],
  },
  {
    param: "Platelets", unit: "×10³/µL", normalRange: "150–400", min: 150, max: 400,
    points: [
      { date: "Apr '24", value: 320 },
      { date: "Jul '24", value: 345 },
      { date: "Oct '24", value: 410 },
      { date: "Jan '25", value: 380 },
      { date: "Feb '25", value: 290 },
    ],
  },
  {
    param: "Fasting Blood Sugar", unit: "mmol/L", normalRange: "3.9–5.5", min: 3.9, max: 5.5,
    points: [
      { date: "Apr '24", value: 5.1 },
      { date: "Jul '24", value: 5.4 },
      { date: "Oct '24", value: 5.7 },
      { date: "Jan '25", value: 6.0 },
      { date: "Feb '25", value: 5.8 },
    ],
  },
  {
    param: "CRP", unit: "mg/L", normalRange: "< 10", max: 10,
    points: [
      { date: "Apr '24", value: 3.2 },
      { date: "Jul '24", value: 5.8 },
      { date: "Oct '24", value: 8.4 },
      { date: "Jan '25", value: 12.0 },
    ],
  },
  {
    param: "Total Cholesterol", unit: "mmol/L", normalRange: "< 5.2", max: 5.2,
    points: [
      { date: "Apr '24", value: 4.8 },
      { date: "Jul '24", value: 5.0 },
      { date: "Oct '24", value: 5.5 },
      { date: "Feb '25", value: 4.2 },
    ],
  },
  {
    param: "LDL", unit: "mmol/L", normalRange: "< 3.4", max: 3.4,
    points: [
      { date: "Apr '24", value: 2.6 },
      { date: "Jul '24", value: 2.9 },
      { date: "Oct '24", value: 3.7 },
      { date: "Feb '25", value: 2.9 },
    ],
  },
];

function SparkFlag({ value, min, max }: { value: number; min?: number; max?: number }) {
  if (max !== undefined && value > max) return <span className="inline-block px-1 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-700">H</span>;
  if (min !== undefined && value < min) return <span className="inline-block px-1 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-700">L</span>;
  return <span className="inline-block px-1 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-700">N</span>;
}

// ─── Lab Panel (fullscreen slide-over) ───────────────────────────────────────

function LabPanel({ entry, onClose, onComplete }: {
  entry: MultiEntry; onClose: () => void; onComplete: () => void;
}) {
  const p = entry.patient;
  const [fullscreen, setFullscreen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Read the doctor's dispatched lab order from localStorage (raw LabOrder | null)
  const activeOrder = readActiveLabOrder(entry.id);
  const activeOrderTests: LabTest[] = activeOrder
    ? activeOrder.tests.map((t, i) => ({
        id: t.id,
        serial: i + 1,
        name: t.name,
        lab: t.category,
        status: "pending" as const,
        updatedAt: "",
      }))
    : [];

  // Local test state so Save Result updates the pill reactively
  const [localTests, setLocalTests] = useState<LabTest[]>(activeOrderTests);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"form" | "preview" | "trends">("form");
  const [resultValues, setResultValues] = useState<Record<string, Record<string, string>>>({});
  const [savedSnapshots, setSavedSnapshots] = useState<Record<string, Record<string, string>>>({});
  const [expandedRecords, setExpandedRecords] = useState<Record<string, boolean>>({});

  const pendingCount = localTests.filter(t => t.status === "pending").length;
  const selectedTest = localTests.find(t => t.id === selectedTestId) ?? null;
  const selectedFields = selectedTestId ? (RESULT_FIELDS[selectedTestId] ?? GENERIC_RESULT_FIELDS) : [];
  const selectedValues = selectedTestId ? (resultValues[selectedTestId] ?? {}) : {};

  // Detect unsaved changes: test already saved but current values differ from snapshot
  const hasUnsavedChanges = !!(
    selectedTestId &&
    selectedTest?.status === "completed" &&
    savedSnapshots[selectedTestId] &&
    JSON.stringify(selectedValues) !== JSON.stringify(savedSnapshots[selectedTestId])
  );

  // Rebuild current order with live local test statuses
  const orderDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const currentOrder = activeOrder
    ? {
        id: entry.id,
        orderedBy: "Doctor",
        orderDate,
        tests: activeOrderTests.map(t => localTests.find(lt => lt.id === t.id) ?? t),
      }
    : null;

  function setFieldValue(key: string, value: string) {
    if (!selectedTestId) return;
    setResultValues(rv => ({ ...rv, [selectedTestId]: { ...(rv[selectedTestId] ?? {}), [key]: value } }));
  }

  function saveResult() {
    if (!selectedTestId) return;
    const now = new Date();
    const formatted =
      now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + ", " +
      now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const snapshot = { ...(resultValues[selectedTestId] ?? {}) };
    setLocalTests(ts => ts.map(t => t.id === selectedTestId ? { ...t, status: "completed", updatedAt: formatted } : t));
    setSavedSnapshots(ss => ({ ...ss, [selectedTestId]: snapshot }));
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col border-l border-slate-200 transition-all duration-200 ${fullscreen ? "w-full" : "w-[85%]"}`}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FlaskConical className="h-4 w-4 text-[#4982CF]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-[#4982CF] leading-none">{entry.tokenNumber}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#4982CF] font-bold">Lab / Sample</span>
              </div>
              {p && <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{p.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-1 justify-center">
            <button className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: LAB_ACCENT }}>Lab Orders</button>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setFullscreen(f => !f)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors" title={fullscreen ? "Minimise" : "Full Screen"}>
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <Button onClick={() => setShowConfirm(true)} className="h-8 text-xs gap-1.5 text-white" style={{ background: LAB_ACCENT }}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
            </Button>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Two-column body ─────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT: Patient Record */}
          <div className="w-1/2 border-r border-slate-200 flex flex-col flex-shrink-0">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient Record</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">

              {/* Patient Info */}
              <Collapsible title="Patient Info" defaultOpen={false}>
                {p ? (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5 text-xs">
                    {([["Name", p.name], ["MRN", p.mrn], ["Gender", p.gender === "M" ? "Male" : "Female"], ["DOB", p.dob], ["Phone", p.phone]] as [string, string][]).map(([l, v]) => (
                      <div key={l} className="flex justify-between">
                        <span className="text-slate-400">{l}</span>
                        <span className="font-semibold text-slate-800">{v}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-400 italic">No patient on file</p>}
              </Collapsible>

              {/* Required Actions */}
              <Collapsible title="Required Actions" badge={currentOrder && !activeOrder?.voided ? 1 : 0} accent defaultOpen>
                {activeOrder?.voided ? (
                  /* ── Voided order banner ── */
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center flex-shrink-0">
                        <Ban className="h-4 w-4 text-rose-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-rose-700 uppercase tracking-wide">Order Voided by Doctor</p>
                        <p className="text-xs text-rose-600 mt-1">This lab order has been cancelled. Do not collect samples or enter results for this order.</p>
                        {activeOrder.voidReason && (
                          <p className="text-[11px] text-rose-500 mt-1.5 italic">Reason: {activeOrder.voidReason}</p>
                        )}
                        {activeOrder.voidedAt && (
                          <p className="text-[10px] text-rose-400 mt-1">
                            Voided {new Date(activeOrder.voidedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Dimmed test list for reference only */}
                    {currentOrder && (
                      <div className="mt-3 space-y-1 opacity-40 pointer-events-none select-none">
                        {currentOrder.tests.map(test => (
                          <div key={test.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rose-100 bg-white/60">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-600 leading-tight line-through">{test.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{test.lab}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : currentOrder ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 mb-2">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-xs font-bold text-slate-700">Order · {currentOrder.orderDate}</p>
                      <p className="text-[10px] text-slate-400">{currentOrder.orderedBy}</p>
                    </div>
                    {activeOrder?.patientCondition && activeOrder.patientCondition !== "Random" && (
                      <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-300 px-3 py-2 mb-2.5">
                        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-amber-800">{activeOrder.patientCondition} required before collection.</p>
                      </div>
                    )}
                    {activeOrder?.instructions && (
                      <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 mb-2.5">
                        <FileText className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-700">{activeOrder.instructions}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      {currentOrder.tests.map(test => (
                        <button
                          key={test.id}
                          onClick={() => { setSelectedTestId(test.id); setRightTab("form"); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${selectedTestId === test.id ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50 border border-transparent"}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 leading-tight">{test.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{test.lab}</p>
                          </div>
                          {test.status === "completed" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 flex-shrink-0">
                              <CheckCircle2 className="h-3 w-3" /> Done
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700 flex-shrink-0">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" /> In progress</span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1"><FlaskConical className="h-3 w-3" /> Lab / Sample</span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {currentOrder.orderedBy}</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 mb-2 text-center">
                    <FlaskConical className="h-5 w-5 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-400 font-medium">No lab order details available</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">The doctor's order will appear here once dispatched</p>
                  </div>
                )}
              </Collapsible>

              {/* All Records */}
              <Collapsible title="All Records" badge={SEED_PAST_LAB_RECORDS.length} defaultOpen>
                {SEED_PAST_LAB_RECORDS.map(rec => (
                  <div key={rec.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs mb-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-800 leading-tight flex-1">
                        {rec.tests.map(t => t.name).join(" · ")} · {rec.tests.length} test{rec.tests.length !== 1 ? "s" : ""}
                      </p>
                      <button
                        onClick={() => setExpandedRecords(er => ({ ...er, [rec.id]: !er[rec.id] }))}
                        className="text-[10px] font-bold text-[#4982CF] hover:underline flex-shrink-0 flex items-center gap-1"
                      >
                        {expandedRecords[rec.id] ? <><ChevronUp className="h-3 w-3" /> Collapse</> : <><Maximize2 className="h-3 w-3" /> Expand</>}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 justify-between mt-1.5">
                      <span>{rec.dateRange}</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{rec.orderedBy}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">Completed</span>
                      </div>
                    </div>
                    {expandedRecords[rec.id] && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="rounded-lg overflow-hidden border border-slate-200 bg-white">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200">
                                <th className="px-2.5 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Parameter</th>
                                <th className="px-2.5 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Value</th>
                                <th className="px-2.5 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Unit</th>
                                <th className="px-2.5 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ref Range</th>
                                <th className="px-2.5 py-2 text-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">Flag</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rec.tests.map((t, i) => (
                                <tr key={t.name} className={i % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                                  <td className="px-2.5 py-2 font-semibold text-slate-800">{t.name}</td>
                                  <td className={`px-2.5 py-2 text-right font-bold ${t.flag === "H" || t.flag === "L" ? "text-red-600" : "text-slate-800"}`}>{t.result}</td>
                                  <td className="px-2.5 py-2 text-right text-slate-400">{t.unit}</td>
                                  <td className="px-2.5 py-2 text-right text-slate-500">{t.ref}</td>
                                  <td className="px-2.5 py-2 text-center">
                                    {t.flag === "H" ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">H</span>
                                    ) : t.flag === "L" ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">L</span>
                                    ) : t.flag === "N" ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">N</span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </Collapsible>

            </div>
          </div>

          {/* RIGHT: Result Entry */}
          <div className="flex-1 flex flex-col bg-slate-50/40 min-w-0">
            <div className="px-5 py-3 border-b border-slate-100 bg-white flex-shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TestTube2 className="h-4 w-4 text-[#4982CF]" />
                <p className="text-sm font-bold text-slate-800">Result Entry</p>
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setRightTab("form")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${rightTab === "form" ? "bg-white shadow-sm text-[#4982CF]" : "text-slate-500 hover:text-slate-700"}`}
                >Form</button>
                <button
                  onClick={() => setRightTab("preview")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${rightTab === "preview" ? "bg-white shadow-sm text-[#4982CF]" : "text-slate-500 hover:text-slate-700"}`}
                >Preview</button>
                <button
                  onClick={() => setRightTab("trends")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${rightTab === "trends" ? "bg-white shadow-sm text-[#4982CF]" : "text-slate-500 hover:text-slate-700"}`}
                >Trends</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {rightTab === "trends" ? (
                /* ── Trends tab ─────────────────────────────────── */
                <div className="w-full">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Parameter Trends · Raj Sharma · MR-43001</p>
                  <div className="grid grid-cols-2 gap-4">
                    {TREND_DATA.map(series => {
                      const latest = series.points[series.points.length - 1];
                      const yMin = Math.min(...series.points.map(p => p.value));
                      const yMax = Math.max(...series.points.map(p => p.value));
                      const pad = (yMax - yMin) * 0.3 || 1;
                      const domainMin = Math.max(0, parseFloat((yMin - pad).toFixed(1)));
                      const domainMax = parseFloat((yMax + pad).toFixed(1));
                      return (
                        <div key={series.param} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{series.param}</p>
                              <p className="text-[10px] text-slate-400">{series.unit} · Normal: {series.normalRange}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <p className={`text-sm font-black ${(series.max !== undefined && latest.value > series.max) || (series.min !== undefined && latest.value < series.min) ? "text-red-600" : "text-emerald-600"}`}>
                                {latest.value}
                              </p>
                              <SparkFlag value={latest.value} min={series.min} max={series.max} />
                            </div>
                          </div>
                          <ResponsiveContainer width="100%" height={90}>
                            <LineChart data={series.points} margin={{ top: 6, right: 4, left: -28, bottom: 0 }}>
                              {series.min !== undefined && series.max !== undefined && (
                                <ReferenceArea y1={series.min} y2={series.max} fill="#dcfce7" fillOpacity={0.5} />
                              )}
                              {series.max !== undefined && series.min === undefined && (
                                <ReferenceArea y1={0} y2={series.max} fill="#dcfce7" fillOpacity={0.5} />
                              )}
                              {series.min !== undefined && series.max === undefined && (
                                <ReferenceArea y1={series.min} y2={domainMax} fill="#dcfce7" fillOpacity={0.5} />
                              )}
                              {series.max !== undefined && (
                                <ReferenceLine y={series.max} stroke="#f87171" strokeDasharray="3 3" strokeWidth={1} />
                              )}
                              {series.min !== undefined && (
                                <ReferenceLine y={series.min} stroke="#f87171" strokeDasharray="3 3" strokeWidth={1} />
                              )}
                              <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                              <YAxis domain={[domainMin, domainMax]} tick={{ fontSize: 8, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickCount={4} />
                              <Tooltip
                                contentStyle={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0" }}
                                labelStyle={{ fontWeight: 700, color: "#334155" }}
                                formatter={(v: number) => [`${v} ${series.unit}`, series.param]}
                              />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke={LAB_ACCENT}
                                strokeWidth={2}
                                dot={(props: { cx: number; cy: number; payload: { value: number } }) => {
                                  const oor = (series.max !== undefined && props.payload.value > series.max) ||
                                              (series.min !== undefined && props.payload.value < series.min);
                                  return <Dot key={`dot-${props.cx}-${props.cy}`} {...props} r={3} fill={oor ? "#ef4444" : LAB_ACCENT} stroke="white" strokeWidth={1.5} />;
                                }}
                                activeDot={{ r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : !selectedTest ? (
                <div className="flex flex-col items-center justify-center h-full text-center pb-16">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                    <FlaskConical className="h-7 w-7 text-[#4982CF]" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Select a test to enter results</p>
                  <p className="text-xs text-slate-400 mt-1">Click a test from Required Actions on the left</p>
                </div>
              ) : rightTab === "form" ? (
                <div className="max-w-lg">
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <FlaskConical className="h-4 w-4 text-[#4982CF]" />
                      <p className="text-sm font-bold text-slate-800">{selectedTest.name}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 ml-6">{selectedTest.lab}</p>
                  </div>
                  <div className="space-y-4">
                    {selectedFields.map(field => {
                      const val = selectedValues[field.key] ?? "";
                      const oor = val !== "" && !field.multiline ? isOutOfRange(val, field) : false;
                      return (
                        <div key={field.key}>
                          <div className="flex items-baseline justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-600">
                              {field.label}{field.unit && <span className="font-normal text-slate-400"> ({field.unit})</span>}
                            </label>
                            {field.normalRange && (
                              <span className="text-[10px] text-slate-400">Normal: {field.normalRange}{field.unit ? ` ${field.unit}` : ""}</span>
                            )}
                          </div>
                          {field.multiline ? (
                            <textarea
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#4982CF]/30 focus:border-[#4982CF] resize-none"
                              rows={2}
                              placeholder="Enter notes..."
                              value={val}
                              onChange={e => setFieldValue(field.key, e.target.value)}
                            />
                          ) : (
                            <input
                              type="text"
                              className={`w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 transition-colors ${
                                oor
                                  ? "border-red-400 text-red-700 bg-red-50 focus:ring-red-200 focus:border-red-500"
                                  : "border-slate-200 text-slate-800 focus:ring-[#4982CF]/30 focus:border-[#4982CF]"
                              }`}
                              placeholder={`Enter ${field.label.toLowerCase()}...`}
                              value={val}
                              onChange={e => setFieldValue(field.key, e.target.value)}
                            />
                          )}
                          {oor && (
                            <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                              ⚠ Value out of normal range — please reverify before saving
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Preview tab */
                <div className="w-full">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800 mb-0.5">{selectedTest.name}</p>
                      <p className="text-[10px] text-slate-400">{selectedTest.lab}</p>
                    </div>
                    {selectedTest.updatedAt && (
                      <span className="text-[10px] text-emerald-600 flex items-center gap-1 flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3" /> Saved: {selectedTest.updatedAt}
                      </span>
                    )}
                  </div>

                  {/* Main result table */}
                  {selectedFields.filter(f => f.normalRange && selectedValues[f.key]).length === 0 &&
                   selectedFields.filter(f => !f.normalRange && !f.multiline && f.key !== "notes" && selectedValues[f.key]).length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                      <p className="text-sm text-slate-400 italic">No result entered yet</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-4">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200">
                            <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Parameter</th>
                            <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Value</th>
                            <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unit</th>
                            <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reference Range</th>
                            <th className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Flag</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedFields
                            .filter(f => !f.multiline && f.key !== "notes" && f.key !== "collected" && selectedValues[f.key])
                            .map((field, i) => {
                              const val = selectedValues[field.key] ?? "";
                              const flag = getFlag(val, field);
                              return (
                                <tr key={field.key} className={i % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                                  <td className="px-3 py-2.5 font-semibold text-slate-800">{field.label}</td>
                                  <td className={`px-3 py-2.5 text-right font-bold ${flag === "H" || flag === "L" ? "text-red-600" : "text-slate-800"}`}>{val}</td>
                                  <td className="px-3 py-2.5 text-right text-slate-400">{field.unit ?? "—"}</td>
                                  <td className="px-3 py-2.5 text-right text-slate-500">{field.normalRange ?? "—"}</td>
                                  <td className="px-3 py-2.5 text-center">
                                    {flag === "H" ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">H</span>
                                    ) : flag === "L" ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">L</span>
                                    ) : flag === "N" ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">N</span>
                                    ) : (
                                      <span className="text-slate-300 text-xs">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Collected At + Notes shown below the table */}
                  {(selectedValues["collected"] || selectedValues["notes"]) && (
                    <div className="space-y-2">
                      {selectedValues["collected"] && (
                        <div className="flex gap-2 text-xs">
                          <span className="text-slate-400 w-24 flex-shrink-0">Collected At</span>
                          <span className="font-semibold text-slate-700">{selectedValues["collected"]}</span>
                        </div>
                      )}
                      {selectedValues["notes"] && (
                        <div className="flex gap-2 text-xs">
                          <span className="text-slate-400 w-24 flex-shrink-0">Notes</span>
                          <span className="text-slate-700">{selectedValues["notes"]}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fixed footer — Save Result button, only on form tab with a test selected */}
            {selectedTest && rightTab === "form" && (
              <div className="flex-shrink-0 border-t border-slate-200 bg-white px-6 py-4 flex items-center gap-3">
                <Button
                  onClick={saveResult}
                  className="h-9 px-6 text-sm font-semibold text-white gap-1.5"
                  style={{ backgroundColor: hasUnsavedChanges ? "#b45309" : LAB_ACCENT }}
                  disabled={selectedTest.status === "completed" && !hasUnsavedChanges}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {selectedTest.status === "completed" && !hasUnsavedChanges
                    ? "Result Saved"
                    : hasUnsavedChanges
                    ? "Update Result"
                    : "Save Result"}
                </Button>
                {selectedTest.status === "completed" && !hasUnsavedChanges && (
                  <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Saved at {selectedTest.updatedAt}
                  </p>
                )}
                {hasUnsavedChanges && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    ● Unsaved changes
                  </p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* ── Confirm modal ───────────────────────────────────────────────────── */}
        {showConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirm(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-80 z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-[#4982CF]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Mark Lab Complete?</p>
                  <p className="text-xs text-slate-500 mt-0.5">Token {entry.tokenNumber} will advance to the next step.</p>
                </div>
              </div>
              {pendingCount > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-3">
                  <p className="text-xs font-semibold text-amber-800">{pendingCount} test{pendingCount !== 1 ? "s" : ""} still pending</p>
                  <p className="text-[10px] text-amber-700 mt-0.5">Results can be entered after this step.</p>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Button onClick={() => setShowConfirm(false)} variant="outline" className="flex-1 h-9 text-sm">Cancel</Button>
                <Button onClick={() => { onComplete(); setShowConfirm(false); }} className="flex-1 h-9 text-sm text-white" style={{ background: LAB_ACCENT }}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Lab Drawer (patient summary) ─────────────────────────────────────────────

function LabDrawer({ entry, onClose, onComplete }: {
  entry: MultiEntry; onClose: () => void; onComplete: () => void;
}) {
  const [showPanel, setShowPanel] = useState(false);
  const p = entry.patient;

  if (showPanel) {
    return <LabPanel entry={entry} onClose={onClose} onComplete={onComplete} />;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col w-[40%] min-w-[480px] border-l border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900">Patient Details</p>
            <p className="text-xs text-slate-400 mt-0.5">Lab Station · Sample Counter</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-[#4982CF]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-mono text-lg font-black text-[#4982CF] leading-none">{entry.tokenNumber}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#4982CF] font-bold">{entry.stepLabel}</span>
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
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs font-bold text-amber-800">Alerts</p>
              </div>
              <p className="text-xs text-amber-700">Diabetic patient — check blood sugar before sample collection.</p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-rose-600 flex-shrink-0" />
                <p className="text-xs font-bold text-rose-800">Allergies</p>
              </div>
              <p className="text-xs text-rose-700">Penicillin · Sulfa drugs</p>
            </div>
          </div>
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Categories</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setShowPanel(true)}
                className="rounded-xl border bg-blue-50 border-blue-200 px-4 py-3.5 text-left flex items-center gap-3 hover:shadow-sm transition-all group"
              >
                <FlaskConical className="h-5 w-5 text-[#4982CF] flex-shrink-0" />
                <span className="text-sm font-semibold text-[#4982CF] leading-tight">Lab</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 ml-auto group-hover:text-slate-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LabUser() {
  const {
    queue,
    labCall, labTimerExpire, labAtCounter, labComplete, labSkip, labRecall,
  } = useMultiStepQueue();

  const [tick, setTick]               = useState(0);
  const [drawerEntry, setDrawerEntry] = useState<MultiEntry | null>(null);
  const [showSkipped, setShowSkipped] = useState(false);
  const [toast, setToast]             = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    queue.forEach(e => {
      if (!e.callTimestamp) return;
      if (Date.now() - e.callTimestamp >= CALL_WINDOW_SECS * 1000) {
        labTimerExpire(e.id);
        if (e.callCount >= MAX_CALLS) showToastMsg(`Token ${e.tokenNumber} auto-skipped after ${MAX_CALLS} calls`);
      }
    });
  }, [tick]);

  function showToastMsg(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500); }

  // ── Derived state (mirrors Doctor/Nursing pattern exactly) ─────────────────
  const labQueue       = queue
    .filter(e => e.step === 4 && !e.skipped && e.status !== "completed")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const skippedQueue   = queue.filter(e => e.step === 4 && e.skipped);
  const completedQueue = queue.filter(e => e.step === 4 && e.status === "completed");

  const atCounterEntry  = labQueue.find(e => e.status === "called") ?? null;
  const activeCallEntry = labQueue.find(e => e.callTimestamp !== null && getSecsLeft(e.callTimestamp) > 0) ?? null;
  const waitingTokens   = labQueue.filter(e => e.status === "waiting" && !e.callTimestamp && e.id !== atCounterEntry?.id);

  const secsLeft = getSecsLeft(activeCallEntry?.callTimestamp ?? null);
  const timerPct = (secsLeft / CALL_WINDOW_SECS) * 100;

  function handleCall(id: string) { labCall(id); showToastMsg("Token called — 30 second window started"); }
  function handleLabOrders(entry: MultiEntry) { labAtCounter(entry.id); setDrawerEntry({ ...entry, status: "called" }); }
  function handleComplete(id: string) { labComplete(id); setDrawerEntry(null); }
  function handleSkip(id: string) { labSkip(id); showToastMsg("Token skipped"); }
  function handleRecall(id: string, tokenNum: string) { labRecall(id); showToastMsg(`Token ${tokenNum} recalled to queue`); }

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      <QueueAppHeader />

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 shadow-lg">
          {toast}
        </div>
      )}

      {/* Purple status bar */}
      <div className="flex items-center gap-3 px-6 py-2.5 flex-shrink-0" style={{ backgroundColor: LAB_ACCENT }}>
        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
        <p className="text-xs font-bold text-white/90 uppercase tracking-widest">Lab Counter · Main Branch — Lahore</p>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-white/70">Step:</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">Lab / Sample · 4 of 5</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Queue Stats</p>
            {[
              { label: "At Counter", value: atCounterEntry ? 1 : 0,  style: { color: LAB_ACCENT }, bg: "bg-blue-50 border-blue-200" },
              { label: "Waiting",    value: waitingTokens.length,     style: { color: "#b45309" },  bg: "bg-amber-50 border-amber-200"  },
              { label: "Skipped",    value: skippedQueue.length,      style: { color: "#dc2626" },  bg: "bg-red-50 border-red-200"      },
            ].map(s => (
              <div key={s.label} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 mb-2 ${s.bg}`}>
                <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                <span className="text-lg font-black" style={s.style}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Assigned Queues</p>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="h-4 w-4 text-[#4982CF]" />
                <p className="text-sm font-bold text-[#4982CF]">Lab Queue</p>
              </div>
              <p className="text-xs text-slate-500">Step 4 tokens · No billing</p>
            </div>
          </div>
        </div>

        {/* ── MAIN AREA ─────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* AT COUNTER */}
            {atCounterEntry && !activeCallEntry && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: LAB_ACCENT }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: LAB_ACCENT }}>Now at Lab Counter</p>
                </div>
                <div className="rounded-2xl border-2 bg-white shadow-sm overflow-hidden" style={{ borderColor: `${LAB_ACCENT}4D` }}>
                  <div className="h-1 w-full" style={{ backgroundColor: LAB_ACCENT }} />
                  <div className="flex items-center gap-5 px-6 py-5">
                    <div className="flex-shrink-0 text-center">
                      <div className="rounded-2xl border-2 px-6 py-3" style={{ borderColor: `${LAB_ACCENT}80`, backgroundColor: `${LAB_ACCENT}0D` }}>
                        <p className="font-mono font-black text-2xl" style={{ color: LAB_ACCENT }}>{atCounterEntry.tokenNumber}</p>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">Call #{atCounterEntry.callCount}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      {atCounterEntry.patient ? (
                        <>
                          <p className="text-base font-black text-slate-900 leading-tight">{atCounterEntry.patient.name}</p>
                          <p className="text-xs text-slate-400">{atCounterEntry.patient.mrn} · {atCounterEntry.patient.phone}</p>
                        </>
                      ) : (
                        <p className="text-base font-black text-slate-500">Walk-in Patient</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: LAB_ACCENT }} />
                        <span className="text-xs font-semibold" style={{ color: LAB_ACCENT }}>At Lab Counter</span>
                        <span className="text-slate-300">·</span>
                        <Clock className="h-3 w-3 text-slate-300" />
                        <span className="text-xs text-slate-400">{timeAgo(atCounterEntry.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        className="h-10 px-5 text-sm font-bold gap-2 text-white"
                        style={{ backgroundColor: LAB_ACCENT }}
                        onClick={() => setDrawerEntry(atCounterEntry)}
                      >
                        <FlaskConical className="h-4 w-4" /> Lab Orders
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CALL WINDOW ACTIVE */}
            {activeCallEntry && !atCounterEntry && (
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
                      {activeCallEntry.patient ? (
                        <>
                          <p className="text-base font-black text-slate-900 leading-tight">{activeCallEntry.patient.name}</p>
                          <p className="text-xs text-slate-400">{activeCallEntry.patient.mrn}</p>
                        </>
                      ) : (
                        <p className="text-base font-black text-slate-500">Walk-in Patient</p>
                      )}
                      <p className="text-sm font-semibold text-amber-600 mt-1">Window expires in {secsLeft}s</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        className="h-10 px-5 text-sm font-bold gap-2 text-white"
                        style={{ backgroundColor: LAB_ACCENT }}
                        onClick={() => handleLabOrders(activeCallEntry)}
                      >
                        <FlaskConical className="h-4 w-4" /> Lab Orders
                      </Button>
                      <Button variant="outline" size="sm" className="border-red-200 text-red-500 hover:bg-red-50 text-xs" onClick={() => handleSkip(activeCallEntry.id)}>
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
                  <FlaskConical className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">Queue is empty</p>
                  <p className="text-xs">Patients will appear here after they reach Step 4.</p>
                </div>
              )}
              <div className="space-y-2">
                {waitingTokens.map((entry, idx) => {
                  const isFirst = idx === 0 && !atCounterEntry && !activeCallEntry;
                  return (
                    <div key={entry.id} className={`flex items-center gap-4 rounded-xl border px-4 py-3 bg-white transition-all ${isFirst ? "border-slate-300 shadow-sm" : "border-slate-100 opacity-70"}`}>
                      <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-black bg-slate-100 text-slate-500">{idx + 1}</div>
                      <div className="font-mono font-black text-sm text-slate-700 flex-shrink-0">{entry.tokenNumber}</div>
                      <div className="flex-1 min-w-0">
                        {entry.patient
                          ? <p className="text-sm font-bold text-slate-800 truncate">{entry.patient.name}<span className="ml-2 text-xs font-normal text-slate-400">{entry.patient.mrn}</span></p>
                          : <p className="text-sm font-bold text-slate-500">Walk-in Patient</p>}
                        {entry.callCount > 0 && (
                          <p className="text-[10px] text-amber-600 font-semibold">Called {entry.callCount}× — {MAX_CALLS - entry.callCount} attempt{MAX_CALLS - entry.callCount !== 1 ? "s" : ""} left</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(entry.createdAt)}</span>
                      {isFirst ? (
                        <Button size="sm" className="h-8 px-4 text-xs font-bold flex-shrink-0 gap-1.5 text-white" style={{ backgroundColor: LAB_ACCENT }} onClick={() => handleCall(entry.id)}>
                          <PhoneCall className="h-3.5 w-3.5" /> Call
                        </Button>
                      ) : (
                        <div className="h-8 px-4 flex items-center text-[10px] font-semibold text-slate-400 flex-shrink-0">Locked</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COMPLETED TODAY (compact) */}
            {completedQueue.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Completed Today</p>
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-100 rounded-full px-2 py-0.5">{completedQueue.length}</span>
                </div>
                <div className="space-y-1.5">
                  {completedQueue.map(e => (
                    <div key={e.id} className="bg-white rounded-xl border border-slate-100 px-4 py-2.5 flex items-center gap-3 opacity-60">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="font-mono text-xs font-bold text-slate-500">{e.tokenNumber}</span>
                      <span className="text-xs text-slate-500">{e.patient?.name ?? "Walk-in"}</span>
                      <span className="ml-auto text-[10px] text-emerald-600 font-bold">Done</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SKIPPED PANEL (floating at bottom — same as Doctor/Nursing) */}
          {skippedQueue.length > 0 && (
            <>
              <button
                onClick={() => setShowSkipped(v => !v)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-red-200 bg-white shadow-lg px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-all z-10"
              >
                <AlertCircle className="h-3.5 w-3.5" /> Skipped Tokens ({skippedQueue.length})
                <ChevronUp className={`h-3.5 w-3.5 transition-transform ${showSkipped ? "rotate-180" : ""}`} />
              </button>
              {showSkipped && (
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-red-200 rounded-t-3xl shadow-2xl z-20 max-h-72 flex flex-col">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-sm font-bold text-slate-900">Skipped Tokens</p>
                    </div>
                    <button onClick={() => setShowSkipped(false)} className="h-7 w-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200">
                      <X className="h-3.5 w-3.5" />
                    </button>
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
                        <Button variant="outline" size="sm" className="h-7 px-3 text-xs border-red-300 text-red-600 hover:bg-red-100 flex-shrink-0" onClick={() => handleRecall(entry.id, entry.tokenNumber)}>
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

      {/* Drawer */}
      {drawerEntry && (
        <LabDrawer
          entry={drawerEntry}
          onClose={() => setDrawerEntry(null)}
          onComplete={() => handleComplete(drawerEntry.id)}
        />
      )}
    </div>
  );
}
