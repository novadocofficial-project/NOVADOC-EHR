import { useState } from "react";
import {
  ArrowLeft, RefreshCw, ChevronDown, MoreHorizontal, ChevronRight,
  AlertTriangle, Activity, Heart, Thermometer, User, Ruler, Zap,
  Edit3, FileText, CheckCircle2, Clock, X, Maximize2, Minimize2,
  BarChart2, Calendar, Pill, FlaskConical, Stethoscope,
  ClipboardList, Users, FileBarChart, ScanLine, TrendingUp,
} from "lucide-react";
import { MultiEntry } from "@/hooks/useMultiStepQueue";
import { Button } from "@/components/ui/button";
import { ClinicalNoteDrawer } from "@/pages/ClinicalNoteDrawer";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#4982CF";

// ─── Static mock data ─────────────────────────────────────────────────────────

const VITALS = [
  { label: "BP",     value: "121/77", unit: "mmHg",  Icon: Activity,    color: "#4982CF" },
  { label: "Pulse",  value: "76",     unit: "bpm",   Icon: Heart,       color: "#ef4444" },
  { label: "Temp",   value: "37.0",   unit: "°C",    Icon: Thermometer, color: "#f59e0b" },
  { label: "Weight", value: "72",     unit: "kg",    Icon: User,        color: "#8b5cf6" },
  { label: "Height", value: "168",    unit: "cm",    Icon: Ruler,       color: "#10b981" },
  { label: "Pain",   value: "5/10",   unit: "score", Icon: Zap,         color: "#ec4899" },
];

const CONDITIONS = [
  { name: "Hypertension",    code: "I10",   color: "#f97316" },
  { name: "Type 2 Diabetes", code: "E11.9", color: "#ef4444" },
];

const ALLERGIES_LIST = [
  { name: "Penicillin",   severity: "Severe"   },
  { name: "Sulfonamides", severity: "Moderate" },
  { name: "Aspirin",      severity: "Moderate" },
];

const NAV_TABS: { label: string; Icon: React.ElementType }[] = [
  { label: "360 View",          Icon: BarChart2     },
  { label: "Visits",            Icon: Calendar      },
  { label: "Medicines",         Icon: Pill          },
  { label: "Diagnostics",       Icon: FlaskConical  },
  { label: "Nursing",           Icon: Stethoscope   },
  { label: "Prescription",      Icon: ClipboardList },
  { label: "Staff",             Icon: Users         },
  { label: "Reports",           Icon: FileBarChart  },
  { label: "Scanned Documents", Icon: ScanLine      },
  { label: "Data Analytics",    Icon: TrendingUp    },
];

const NOTE_HISTORY = [
  {
    date: "Dec 10, 2024", day: "Tuesday",   time: "10:55",
    type: "Comprehensive Note", doctor: "Dr. Asif Imam", selected: false,
  },
  {
    date: "Nov 10, 2024", day: "Monday",    time: "08:10",
    type: "Comprehensive Note", doctor: "Dr. Abc",       selected: true,
  },
  {
    date: "Sep 25, 2024", day: "Wednesday", time: "05:20",
    type: "Comprehensive Note", doctor: "Dr. Xyz",       selected: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatToday(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Module Drawer ────────────────────────────────────────────────────────────

interface DrawerProps {
  label: string;
  Icon: React.ElementType;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

function ModuleDrawer({ label, Icon, fullscreen, onToggleFullscreen, onClose }: DrawerProps) {
  return (
    <>
      {/* Backdrop — only when NOT fullscreen so background is still visible */}
      {!fullscreen && (
        <div
          className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-30"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={[
          "absolute top-0 right-0 h-full bg-white shadow-2xl flex flex-col z-40 transition-all duration-300",
          fullscreen ? "inset-0 w-full" : "w-[480px] border-l border-slate-200",
        ].join(" ")}>

        {/* Drawer header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${ACCENT}15` }}>
            <Icon className="h-4 w-4" style={{ color: ACCENT }} />
          </div>
          <p className="text-sm font-black text-slate-800 flex-1">{label}</p>

          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen
              ? <Minimize2 className="h-4 w-4" />
              : <Maximize2 className="h-4 w-4" />
            }
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer body — placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${ACCENT}10` }}>
            <Icon className="h-7 w-7" style={{ color: ACCENT }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <p className="text-xs text-slate-400 mt-1">Module coming soon</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SoapNotePageProps {
  entry: MultiEntry;
  onBack: () => void;
  faceSheetOpenedAt?: number;
  onSendToLab?: () => void;
  onSaveAndClose?: () => void;
}

export function SoapNotePage({ entry, onBack, faceSheetOpenedAt, onSendToLab, onSaveAndClose }: SoapNotePageProps) {
  const [openDrawer, setOpenDrawer]             = useState<string | null>(null);
  const [drawerFullscreen, setDrawerFullscreen] = useState(false);
  const [showNoteDrawer, setShowNoteDrawer]     = useState(false);

  const p       = entry.patient;
  const name    = p?.name  ?? "Walk-in Patient";
  const mrn     = p?.mrn   ?? "—";
  const dob     = p?.dob   ?? "—";
  const phone   = p?.phone ?? "—";
  const gender  = p?.gender === "F" ? "Female" : "Male";
  const address = "House 14, Street 7, DHA Phase 3, Lahore";
  const today   = formatToday();

  function openModule(label: string) {
    setOpenDrawer(label);
    setDrawerFullscreen(false);
  }

  function closeDrawer() {
    setOpenDrawer(null);
    setDrawerFullscreen(false);
  }

  const activeTabMeta = NAV_TABS.find(t => t.label === openDrawer);

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden relative">

      {/* ═══════════════════════════════════════════════════════════════════════
          FIXED HEADER
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 bg-white shadow-sm z-10">

        {/* ── Row 1: Breadcrumb nav ────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-100">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Face Sheet
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            SOAP Notes — Consultation
          </span>
          <div className="flex-1" />
          <Button
            className="h-8 px-4 text-xs font-bold gap-1.5 text-white"
            style={{ backgroundColor: ACCENT }}
            onClick={() => onSaveAndClose ? onSaveAndClose() : onBack()}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Save & Close
          </Button>
        </div>

        {/* ── Row 2: Patient info bar ─────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100">
          <div
            className="h-11 w-11 rounded-xl flex-shrink-0 flex items-center justify-center text-lg font-black text-white shadow"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #2d5fa8)` }}>
            {name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-0.5">
              <p className="text-base font-black text-slate-900 leading-tight">{name}</p>
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: ACCENT }}>
                {mrn}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 px-2.5 py-0.5 rounded-full bg-slate-100">
                {gender}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-slate-400">
              <span>DOB: <strong className="text-slate-600">{dob}</strong></span>
              <span>Last Visit: <strong className="text-slate-600">21 Feb 2025</strong></span>
              <span>{phone}</span>
              <span>{address}</span>
            </div>
          </div>
        </div>

        {/* ── Row 3: Alerts strip ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-2 border-b border-red-100 bg-red-50">
          <div className="flex items-center gap-1.5 mr-1">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Conditions</span>
          </div>
          {CONDITIONS.map(c => (
            <span
              key={c.code}
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: c.color }}>
              {c.name}
              <span className="opacity-80">({c.code})</span>
            </span>
          ))}
          <div className="w-px h-4 bg-red-200 mx-1" />
          <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 mr-1">Allergies</span>
          {ALLERGIES_LIST.map(a => (
            <span
              key={a.name}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              {a.name} · {a.severity}
            </span>
          ))}
        </div>

        {/* ── Row 4: Vitals strip ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 overflow-x-auto">
          {VITALS.map(v => (
            <div
              key={v.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0">
              <span style={{ color: v.color }}>
                <v.Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{v.label}</p>
                <p className="text-sm font-black text-slate-800 leading-tight">
                  {v.value}&thinsp;
                  <span className="text-[9px] font-medium text-slate-400">{v.unit}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Row 5: Module nav tabs (open drawer on click) ───────────────── */}
        <div className="flex items-center overflow-x-auto scrollbar-none border-b border-slate-100">
          {NAV_TABS.map(({ label, Icon }) => {
            const active = openDrawer === label;
            return (
              <button
                key={label}
                onClick={() => active ? closeDrawer() : openModule(label)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold whitespace-nowrap border-b-2 transition-all flex-shrink-0"
                style={active
                  ? { borderBottomColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}08` }
                  : { borderBottomColor: "transparent", color: "#94a3b8" }}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN SCROLLABLE CONTENT — always visible (SOAP notes)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col gap-5">

          {/* ─── New Notes Panel ────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-slate-800">New Notes</p>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: ACCENT }}>
                  1
                </span>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-5">
              <div
                className="flex items-start justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-4"
                style={{ borderLeftWidth: 4, borderLeftColor: ACCENT }}>
                <div className="flex items-start gap-4">
                  <div
                    className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow"
                    style={{ backgroundColor: ACCENT }}>
                    <Edit3 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-black text-slate-900">{today}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        In Progress
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700">Comprehensive Note</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Auto-created on entry · By Dr. James Wilson
                    </p>
                  </div>
                </div>
                <button
                  className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                  onClick={() => setShowNoteDrawer(true)}>
                  <FileText className="h-3.5 w-3.5" /> Open Note
                </button>
              </div>
            </div>
          </div>

          {/* ─── All Records Section ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-slate-800">All Records</p>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {NOTE_HISTORY.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                  Order by Patient Event Date
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div>
              {NOTE_HISTORY.map((note, i) => (
                <div
                  key={i}
                  className={`flex items-stretch transition-colors ${
                    note.selected ? "bg-blue-50" : "hover:bg-slate-50"
                  } ${i < NOTE_HISTORY.length - 1 ? "border-b border-slate-50" : ""}`}>

                  <div
                    className="w-1 flex-shrink-0"
                    style={{ backgroundColor: note.selected ? ACCENT : "transparent" }}
                  />

                  <div className="flex items-center gap-5 px-5 py-4 flex-1 min-w-0">
                    <div className="w-28 flex-shrink-0">
                      <p className="text-xs font-black text-slate-800 leading-tight">
                        {note.date.split(" ").slice(0, 2).join(" ")}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {note.date.split(" ").slice(2).join(" ")}
                      </p>
                    </div>

                    <div className="w-px self-stretch bg-slate-200 flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-black text-slate-800">{note.day}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {note.time}
                        </span>
                        {note.selected && (
                          <span
                            className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: ACCENT }}>
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-600">{note.type}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">By {note.doctor}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800 transition-colors bg-white">
                        <ChevronRight className="h-3 w-3" /> Expand
                      </button>
                      <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white transition-colors">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CLINICAL NOTE DRAWER (Open Note)
      ═══════════════════════════════════════════════════════════════════════ */}
      {showNoteDrawer && (
        <ClinicalNoteDrawer
          patientName={name}
          faceSheetOpenedAt={faceSheetOpenedAt}
          awaitingLab={entry.pendingLab}
          onSendToLab={onSendToLab}
          onSaveAndClose={onSaveAndClose}
          onClose={() => setShowNoteDrawer(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODULE DRAWER (right-side overlay)
      ═══════════════════════════════════════════════════════════════════════ */}
      {!showNoteDrawer && openDrawer && activeTabMeta && (
        <ModuleDrawer
          label={openDrawer}
          Icon={activeTabMeta.Icon}
          fullscreen={drawerFullscreen}
          onToggleFullscreen={() => setDrawerFullscreen(f => !f)}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}
