import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, Maximize2, Minimize2, Copy, ClipboardPaste, FileText,
  StopCircle, PauseCircle, PlayCircle, ChevronDown, ChevronUp,
  Download, PenLine, FlaskConical, Scan, HeartPulse,
  Users, BookOpen, Stethoscope, ClipboardList, CalendarDays,
  CheckCircle2, AlertCircle, Printer, Trash2, Tag,
  GripVertical, Check, Search, Plus,
  ArrowRight, ClipboardCheck, ChevronLeft, Pill,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoughHistoryTemplate, CoughSummary, COUGH_EMPTY } from "@/pages/CoughHistoryTemplate";
import type { CoughState } from "@/pages/CoughHistoryTemplate";
import { AllergySelector } from "@/pages/AllergySelector";
import type { AllergyEntry } from "@/pages/AllergySelector";
import { RosSystemSelector, PeChipsPanel, PeSystemDrawer } from "@/pages/RosPeSection";
import { DiagnosisDrawer, DiagnosisChipsPanel } from "@/pages/DiagnosisDrawer";
import type { DiagnosisEntry } from "@/pages/DiagnosisDrawer";
import { LabDrawer, LabChipsPanel } from "@/pages/LabDrawer";
import type { LabOrder } from "@/pages/LabDrawer";
import { PocLabsChipsPanel, PocLabsDrawer } from "@/pages/PocLabsSection";
import type { PocTestResult } from "@/pages/PocLabsSection";
import { FormularyChipsPanel, FormularyDrawer } from "@/pages/FormularySection";
import type { MedicineEntry } from "@/pages/FormularySection";
import {
  PastHistoryPanel, FamilyHistoryPanel,
  SurgicalHistoryPanel, SocialHistoryPanel,
  EMPTY_SOCIAL_HISTORY,
} from "@/pages/MedicalHistorySection";
import type { FamilyRow, SurgicalEntry, SocialHistory } from "@/pages/MedicalHistorySection";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#4982CF";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NoteState {
  chiefComplaints: string[];
  hpi:             string;
  allergies:       AllergyEntry[];
  pmhActive:       string[];
  pmhResolved:     string[];
  surgicalRows:    SurgicalEntry[];
  fhRows:          FamilyRow[];
  fhGenetic:       string[];
  socialHistory:   SocialHistory;
  ros:             string[];
  pocTests:        PocTestResult[];
  medicines:       MedicineEntry[];
  otherOrders:     string;
  visitNote:       string;
  followUpDate:    string;
  planTags:        string[];
}

const EMPTY_NOTE: NoteState = {
  chiefComplaints: [], hpi: "", allergies: [],
  pmhActive: [], pmhResolved: [], surgicalRows: [], fhRows: [], fhGenetic: [], socialHistory: EMPTY_SOCIAL_HISTORY,
  ros: [], pocTests: [], medicines: [],
  otherOrders: "", visitNote: "", followUpDate: "",
  planTags: [],
};

const PLAN_TAGS = [
  { label: "Diagnosis",       color: "#ef4444", Icon: Tag          },
  { label: "Formulary",       color: "#8b5cf6", Icon: FlaskConical },
  { label: "Lab",             color: "#f59e0b", Icon: FlaskConical },
  { label: "Imaging",         color: "#0ea5e9", Icon: Scan         },
  { label: "Care Manager",    color: "#10b981", Icon: HeartPulse   },
  { label: "Health Education",color: "#f97316", Icon: BookOpen     },
  { label: "Referrals",       color: "#6366f1", Icon: Users        },
  { label: "Procedures",      color: "#14b8a6", Icon: Stethoscope  },
  { label: "Patient Goals",   color: "#ec4899", Icon: CheckCircle2 },
];


// ─── Complaint options ─────────────────────────────────────────────────────────

const COMPLAINT_OPTIONS = [
  "Fever", "Cough", "Sore Throat", "Headache", "Fatigue",
  "Shortness of Breath", "Chest Pain", "Nausea / Vomiting",
  "Abdominal Pain", "Back Pain", "Dizziness", "Rash",
  "Joint Pain", "Loss of Appetite", "Diarrhea", "Constipation",
  "Ear Pain / Earache", "Eye Redness / Pain", "Urinary Symptoms",
  "Runny Nose / Congestion", "Muscle Aches", "Swelling / Edema",
  "Palpitations", "Anxiety / Stress",
];

// ─── Chief Complaint Selector ──────────────────────────────────────────────────

function ChiefComplaintSelector({
  selected, onChange,
}: {
  selected: string[]; onChange: (items: string[]) => void;
}) {
  const [open,     setOpen]     = useState(false);
  const [search,   setSearch]   = useState("");
  const [custom,   setCustom]   = useState("");
  const [dragIdx,  setDragIdx]  = useState<number | null>(null);
  const [overIdx,  setOverIdx]  = useState<number | null>(null);
  const [dropPos,  setDropPos]  = useState({ top: 0, left: 0, width: 0 });
  const triggerRef              = useRef<HTMLButtonElement>(null);
  const dropdownRef             = useRef<HTMLDivElement>(null);

  // Close on outside click (both trigger area and portal dropdown)
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      const insideTrigger  = triggerRef.current?.contains(t);
      const insideDropdown = dropdownRef.current?.contains(t);
      if (!insideTrigger && !insideDropdown) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function openDropdown() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    setOpen(true);
  }

  function toggle(item: string) {
    onChange(selected.includes(item) ? selected.filter(s => s !== item) : [...selected, item]);
  }

  function remove(item: string) { onChange(selected.filter(s => s !== item)); }

  function addCustom() {
    const val = custom.trim();
    if (val && !selected.includes(val)) onChange([...selected, val]);
    setCustom("");
  }

  function onDragStart(idx: number) { setDragIdx(idx); }
  function onDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setOverIdx(idx); }
  function onDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...selected];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    onChange(next);
    setDragIdx(null); setOverIdx(null);
  }
  function onDragEnd() { setDragIdx(null); setOverIdx(null); }

  const filtered = COMPLAINT_OPTIONS.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      {/* Trigger bar */}
      <button
        ref={triggerRef}
        onClick={() => open ? setOpen(false) : openDropdown()}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#4982CF]/50 transition-colors text-left">
        {selected.length === 0 ? (
          <span className="text-xs text-slate-300 flex-1">Select chief complaints…</span>
        ) : (
          <span className="text-xs font-semibold flex-1" style={{ color: ACCENT }}>
            {selected.length} complaint{selected.length > 1 ? "s" : ""} selected
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel — rendered in a portal so it escapes overflow:hidden containers */}
      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">

          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100">
            <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search complaints…"
              className="flex-1 text-xs outline-none text-slate-700 placeholder-slate-300 bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.map(opt => {
              const checked = selected.includes(opt);
              const rank    = selected.indexOf(opt) + 1;
              return (
                <button
                  key={opt}
                  onClick={() => toggle(opt)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${checked ? "bg-blue-50/60" : "hover:bg-slate-50"}`}>
                  <div
                    className="h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={checked ? { backgroundColor: ACCENT, borderColor: ACCENT } : { borderColor: "#cbd5e1" }}>
                    {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-xs text-slate-700 flex-1">{opt}</span>
                  {checked && (
                    <span
                      className="text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: ACCENT }}>
                      {rank}
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-4 py-4 text-xs text-center text-slate-400">No matches — add as custom below</p>
            )}
          </div>

          {/* Custom complaint */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-100 bg-slate-50/50">
            <Plus className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <input
              value={custom}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
              placeholder="Add custom complaint…"
              className="flex-1 text-xs outline-none text-slate-700 placeholder-slate-300 bg-transparent"
            />
            <button
              onClick={addCustom}
              disabled={!custom.trim()}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white transition-opacity disabled:opacity-30"
              style={{ backgroundColor: ACCENT }}>
              Add
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Selected chips — drag-and-drop priority */}
      {selected.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {selected.map((item, idx) => {
            const isPrimary  = idx === 0;
            const isDragging = dragIdx === idx;
            const isOver     = overIdx === idx && dragIdx !== idx;
            return (
              <div
                key={item}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={e => onDragOver(e, idx)}
                onDrop={() => onDrop(idx)}
                onDragEnd={onDragEnd}
                className={[
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 cursor-grab active:cursor-grabbing select-none transition-all duration-150",
                  isDragging ? "opacity-40 scale-[0.97]" : "",
                  isOver     ? "border-[#4982CF] shadow-md scale-[1.02]" : "",
                  isPrimary
                    ? "bg-[#4982CF] text-white border-[#4982CF] shadow-sm"
                    : "bg-blue-50 text-blue-800 border-blue-200",
                ].join(" ")}>
                <GripVertical className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
                <span
                  className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isPrimary ? "bg-white/25 text-white" : "bg-[#4982CF] text-white"
                  }`}>
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold flex-1">{item}</span>
                {isPrimary && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/20 text-white/90 flex-shrink-0">
                    Primary
                  </span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); remove(item); }}
                  className={`hover:opacity-70 transition-opacity flex-shrink-0 ${isPrimary ? "text-white/70" : "text-blue-400"}`}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
          <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
            <GripVertical className="h-3 w-3" />
            Drag to reorder priority · <span className="font-semibold text-slate-500">Position 1 = Primary Complaint</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── HPI Template Drawer ──────────────────────────────────────────────────────

interface HpiTemplateDrawerProps {
  complaint: string;
  isDone: boolean;
  savedData?: CoughState;
  onSave: (state: CoughState) => void;
  onClose: () => void;
}

function HpiTemplateDrawer({ complaint, isDone, savedData, onSave, onClose }: HpiTemplateDrawerProps) {
  const [localState, setLocalState] = useState<CoughState>(savedData ?? COUGH_EMPTY);

  const isDirty = isDone && JSON.stringify(localState) !== JSON.stringify(savedData ?? COUGH_EMPTY);

  function handleSave() {
    onSave(localState);
  }

  return (
    <div className="absolute inset-y-0 right-0 w-[65%] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-20">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">History Taking Template</p>
          <p className="text-sm font-black text-slate-800 truncate">{complaint}</p>
        </div>

        {/* Action button: Done badge / Update / Mark Done */}
        {isDone && !isDirty ? (
          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        ) : isDirty ? (
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90 flex-shrink-0"
            style={{ backgroundColor: "#f59e0b" }}>
            <ClipboardCheck className="h-3.5 w-3.5" /> Update
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90 flex-shrink-0"
            style={{ backgroundColor: ACCENT }}>
            <ClipboardCheck className="h-3.5 w-3.5" /> Mark Done
          </button>
        )}

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Complaint badge */}
      <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
            <ClipboardList className="h-3.5 w-3.5" style={{ color: ACCENT }} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">Chief Complaint</p>
            <p className="text-xs font-black text-slate-800">{complaint}</p>
          </div>
          {isDirty && (
            <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      {/* Template body — dynamic per complaint */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {complaint === "Cough" ? (
          <CoughHistoryTemplate state={localState} onChange={setLocalState} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${ACCENT}10` }}>
              <ClipboardList className="h-7 w-7" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-700">History Template</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xs">
                The structured HPI template for <strong className="text-slate-600">{complaint}</strong> will load here.
                <br />
                Dynamic templates can be mapped per complaint type.
              </p>
            </div>
            <div className="mt-2 w-full max-w-xs space-y-2">
              {["Onset & Duration", "Location & Radiation", "Quality & Severity", "Modifying Factors", "Associated Symptoms"].map(field => (
                <div key={field} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-left">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                  <span className="text-xs text-slate-400 flex-1">{field}</span>
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wide">Coming soon</span>
                </div>
              ))}
            </div>
            {!isDone && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90 mt-2"
                style={{ backgroundColor: ACCENT }}>
                <ClipboardCheck className="h-3.5 w-3.5" /> Mark Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Timer hook ────────────────────────────────────────────────────────────────

function useTimer(initialSeconds = 0) {
  const [seconds,  setSeconds]  = useState(initialSeconds);
  const [running,  setRunning]  = useState(true);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  function fmt(s: number) {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${ss}`;
  }

  return { display: fmt(seconds), running, toggle: () => setRunning(r => !r), reset: () => { setSeconds(0); setRunning(false); } };
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function calcProgress(note: NoteState): number {
  const fields: (string | string[] | AllergyEntry[] | FamilyRow[])[] = [
    note.chiefComplaints, note.hpi, note.allergies,
    note.pmhActive, note.ros,
    note.planTags, note.visitNote, note.followUpDate,
  ];
  const filled = fields.filter(f => (Array.isArray(f) ? f.length > 0 : (f ?? "").trim() !== "")).length;
  return Math.round((filled / fields.length) * 100);
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function Section({
  title, icon: Icon, color, required, filled, children, defaultOpen = true,
  onImport,
}: {
  title: string; icon: React.ElementType; color: string;
  required?: boolean; filled?: boolean; children: React.ReactNode;
  defaultOpen?: boolean; onImport?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-xs font-black text-slate-700 flex-1">{title}</span>
        {required && !filled && (
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-50 text-red-500 border border-red-100">Required</span>
        )}
        {filled && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
        {onImport && (
          <button
            onClick={e => { e.stopPropagation(); onImport(); }}
            className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors mr-1 flex-shrink-0">
            <Download className="h-2.5 w-2.5" /> Import
          </button>
        )}
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-50">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Textarea field ───────────────────────────────────────────────────────────

function NoteField({
  value, onChange, placeholder, rows = 3,
}: {
  value: string; onChange: (v: string) => void; placeholder: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full text-xs text-slate-700 placeholder-slate-300 border border-slate-150 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:border-transparent bg-slate-50 leading-relaxed transition-all"
      style={{ "--tw-ring-color": ACCENT } as React.CSSProperties}
    />
  );
}

// ─── Timer pill ───────────────────────────────────────────────────────────────

function TimerPill({ label, timer }: { label: string; timer: ReturnType<typeof useTimer> }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 rounded-xl px-3 py-2">
      <div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-black text-slate-800 font-mono">{timer.display}</p>
      </div>
      <div className="flex items-center gap-1 ml-1">
        <button
          onClick={timer.toggle}
          className="p-1 rounded-lg hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600">
          {timer.running
            ? <PauseCircle className="h-4 w-4" />
            : <PlayCircle className="h-4 w-4 text-emerald-500" />
          }
        </button>
        <button
          onClick={timer.reset}
          className="p-1 rounded-lg hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600">
          <StopCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface ClinicalNoteDrawerProps {
  patientName: string;
  faceSheetOpenedAt?: number;
  awaitingLab?: boolean;
  onSendToLab?: () => void;
  onSaveAndClose?: () => void;
  onClose: () => void;
}

export function ClinicalNoteDrawer({ patientName, faceSheetOpenedAt, awaitingLab = false, onSendToLab, onSaveAndClose, onClose }: ClinicalNoteDrawerProps) {
  const [fullscreen,        setFullscreen]        = useState(false);
  const [note,              setNote]              = useState<NoteState>(EMPTY_NOTE);
  const [hpiOpenComplaint,  setHpiOpenComplaint]  = useState<string | null>(null);
  const [hpiDoneComplaints, setHpiDoneComplaints] = useState<string[]>([]);
  const [hpiSavedData,      setHpiSavedData]      = useState<Record<string, CoughState>>({});
  const [peOpenSystem,      setPeOpenSystem]      = useState<string | null>(null);
  const [peDoneSystemIds,   setPeDoneSystemIds]   = useState<string[]>([]);
  const [peSavedData,       setPeSavedData]       = useState<Record<string, Record<string, string>>>({});
  const [diagnosisDone,     setDiagnosisDone]     = useState(false);
  const [diagnosisSaved,    setDiagnosisSaved]    = useState<DiagnosisEntry[]>([]);
  const [diagnosisOpen,     setDiagnosisOpen]     = useState(false);
  const [labDone,           setLabDone]           = useState(false);
  const [labSaved,          setLabSaved]          = useState<LabOrder | null>(null);
  const [labOpen,           setLabOpen]           = useState(false);
  const [pocOpen,           setPocOpen]           = useState(false);
  const [formularyOpen,     setFormularyOpen]     = useState(false);
  const elapsedOnOpen  = faceSheetOpenedAt ? Math.floor((Date.now() - faceSheetOpenedAt) / 1000) : 0;
  const patientTimer   = useTimer(elapsedOnOpen);
  const documentTimer  = useTimer();
  const progress = calcProgress(note);

  function set<K extends keyof NoteState>(key: K, val: NoteState[K]) {
    setNote(prev => ({ ...prev, [key]: val }));
  }

  function togglePlanTag(tag: string) {
    set("planTags", note.planTags.includes(tag)
      ? note.planTags.filter(t => t !== tag)
      : [...note.planTags, tag]);
  }

  function handleHpiSave(complaint: string, state: CoughState) {
    setHpiSavedData(prev => ({ ...prev, [complaint]: state }));
    setHpiDoneComplaints(prev => prev.includes(complaint) ? prev : [...prev, complaint]);
    setHpiOpenComplaint(null);
  }

  function handlePeSave(systemId: string, findings: Record<string, string>) {
    setPeSavedData(prev => ({ ...prev, [systemId]: findings }));
    setPeDoneSystemIds(prev => prev.includes(systemId) ? prev : [...prev, systemId]);
    setPeOpenSystem(null);
  }

  function handleDiagnosisSave(entries: DiagnosisEntry[]) {
    setDiagnosisSaved(entries);
    setDiagnosisDone(true);
    setDiagnosisOpen(false);
  }

  function handleLabSave(order: LabOrder) {
    setLabSaved(order);
    setLabDone(true);
    setLabOpen(false);
  }

  function handleSendToLab(order: LabOrder) {
    setLabSaved(order);
    setLabDone(true);
    setLabOpen(false);
    onSendToLab?.();
  }

  function handleImport(key: keyof NoteState, value: string) {
    set(key, value);
  }

  const progressColor = progress < 33 ? "#ef4444" : progress < 66 ? "#f59e0b" : "#10b981";

  return (
    <>
      {/* Backdrop */}
      {!fullscreen && (
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-30"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={[
          "absolute top-0 right-0 h-full bg-white flex flex-col z-40 shadow-2xl transition-all duration-300",
          fullscreen ? "inset-0 w-full" : "w-[55%] border-l border-slate-200",
        ].join(" ")}>

        {/* ── Top action bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 flex-shrink-0 bg-white">

          {/* Left: Template + Copy/Paste */}
          <button className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors flex-shrink-0">
            <FileText className="h-3.5 w-3.5" style={{ color: ACCENT }} /> Add Template
          </button>
          <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors" title="Copy">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors" title="Paste">
            <ClipboardPaste className="h-3.5 w-3.5" />
          </button>

          {/* Center: Timers */}
          <div className="flex-1 flex items-center justify-center gap-3">
            <TimerPill label="Time with Patient"   timer={patientTimer}  />
            <TimerPill label="Time Documenting"    timer={documentTimer} />
          </div>

          {/* Right: Fullscreen + Close */}
          <button
            onClick={() => setFullscreen(f => !f)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
            title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Progress bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0">
            Note Completion
          </span>
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: progressColor }}
            />
          </div>
          <span className="text-[11px] font-black flex-shrink-0" style={{ color: progressColor }}>
            {progress}%
          </span>
          <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">
            Consultation Note · {patientName}
          </span>
        </div>

        {/* ── Scrollable content ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

          {/* 1. Chief Complaint */}
          <Section title="Chief Complaint" icon={PenLine} color="#4982CF" required filled={note.chiefComplaints.length > 0}>
            <ChiefComplaintSelector
              selected={note.chiefComplaints}
              onChange={items => set("chiefComplaints", items)}
            />
          </Section>

          {/* 2. HPI — driven by Chief Complaints */}
          <Section
            title="History of Present Illness"
            icon={ClipboardList}
            color="#8b5cf6"
            filled={hpiDoneComplaints.length > 0}>
            {note.chiefComplaints.length === 0 ? (
              <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100">
                <ClipboardList className="h-4 w-4 text-slate-300 flex-shrink-0" />
                <p className="text-xs text-slate-400">
                  Select Chief Complaints above — each will appear here as an HPI entry button.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Click a complaint to open its history template
                </p>

                {/* Chips row */}
                <div className="flex flex-wrap gap-2">
                  {note.chiefComplaints.map((complaint, idx) => {
                    const isDone = hpiDoneComplaints.includes(complaint);
                    const isOpen = hpiOpenComplaint === complaint;
                    return (
                      <button
                        key={complaint}
                        onClick={() => setHpiOpenComplaint(isOpen ? null : complaint)}
                        className={[
                          "flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-all",
                          isOpen
                            ? "text-white border-[#8b5cf6] bg-[#8b5cf6] shadow-md"
                            : isDone
                              ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                              : "text-slate-600 border-slate-200 bg-white hover:border-[#8b5cf6]/50 hover:bg-purple-50/40",
                        ].join(" ")}>
                        <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isOpen ? "bg-white/25 text-white" : isDone ? "bg-emerald-200 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {idx + 1}
                        </span>
                        {complaint}
                        {isDone
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                          : <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                        }
                      </button>
                    );
                  })}
                </div>

                {/* Summary cards per done complaint */}
                {note.chiefComplaints.map(complaint => {
                  const isDone = hpiDoneComplaints.includes(complaint);
                  const saved  = hpiSavedData[complaint];
                  if (!isDone || !saved) return null;
                  return (
                    <div key={`summary-${complaint}`}>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-3 mb-1">
                        {complaint} — History Summary
                      </p>
                      <CoughSummary state={saved} />
                    </div>
                  );
                })}

                {hpiDoneComplaints.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {hpiDoneComplaints.length}/{note.chiefComplaints.length} complaints documented
                  </p>
                )}
              </div>
            )}
          </Section>

          {/* 3. Allergies */}
          <Section
            title="Allergies" icon={AlertCircle} color="#ef4444"
            required filled={note.allergies.length > 0}>
            <AllergySelector
              entries={note.allergies}
              onChange={entries => set("allergies", entries)}
            />
          </Section>

          {/* 4. History group */}
          <Section
            title="Medical, Surgical, Family & Social History"
            icon={Users} color="#10b981" defaultOpen={false}
            filled={(note.pmhActive ?? []).length > 0 || (note.pmhResolved ?? []).length > 0 || (note.surgicalRows ?? []).length > 0 || (note.fhRows ?? []).length > 0}
            onImport={() => {
              set("pmhActive",   ["Hypertension", "Type 2 Diabetes Mellitus"]);
              set("pmhResolved", ["Typhoid Fever", "Hepatitis A"]);
              set("surgicalRows", [
                { id: "surg-imp-1", procedure: "Appendectomy", date: "2015-06-10", complications: "None" },
              ]);
              set("fhRows", [
                { id: "fhr-imp-1", condition: "Hypertension",             relation: "Father" },
                { id: "fhr-imp-2", condition: "Type 2 Diabetes Mellitus", relation: "Mother" },
              ]);
              set("fhGenetic",  ["Thalassemia"]);
              set("socialHistory", {
                tobacco:  { active: false, intake: "",   years: "",          quitWhen: "" },
                vaping:   { active: false, intake: "",   years: "",          quitWhen: "" },
                alcohol:  { active: true,  cage: "1",   units: "Units/week", frequency: "Occasionally" },
                oral:     { active: false, type: "",     other: "" },
                activity: "Light (1–2 days/week)",
                sleep:    "6–7 hours",
              });
            }}>

            {/* Past Medical History */}
            <div className="mb-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                Past Medical History
              </p>
              <PastHistoryPanel
                active={note.pmhActive ?? []}
                resolved={note.pmhResolved ?? []}
                onActiveChange={v => set("pmhActive", v)}
                onResolvedChange={v => set("pmhResolved", v)}
              />
            </div>

            {/* Surgical History */}
            <div className="mb-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                Surgical History
              </p>
              <SurgicalHistoryPanel
                rows={note.surgicalRows ?? []}
                onChange={v => set("surgicalRows", v)}
              />
            </div>

            {/* Family History */}
            <div className="mb-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                Family History
              </p>
              <FamilyHistoryPanel
                rows={note.fhRows ?? []}
                genetic={note.fhGenetic ?? []}
                onRowsChange={v => set("fhRows", v)}
                onGeneticChange={v => set("fhGenetic", v)}
              />
            </div>

            {/* Social History */}
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                Social History
              </p>
              <SocialHistoryPanel
                value={note.socialHistory ?? EMPTY_SOCIAL_HISTORY}
                onChange={v => set("socialHistory", v)}
              />
            </div>
          </Section>

          {/* 5. ROS */}
          <Section
            title="Review of Systems"
            icon={Stethoscope} color="#0ea5e9"
            filled={note.ros.length > 0}>
            <RosSystemSelector
              selected={note.ros}
              onChange={systems => {
                set("ros", systems);
                if (peOpenSystem && !systems.includes(peOpenSystem)) setPeOpenSystem(null);
              }}
            />
          </Section>

          {/* 5b. Physical Examination (auto-synced from ROS) */}
          <Section
            title="Physical Examination"
            icon={Stethoscope} color="#06b6d4"
            filled={peDoneSystemIds.length > 0}>
            <PeChipsPanel
              systems={note.ros}
              doneSystemIds={peDoneSystemIds}
              savedDataMap={peSavedData}
              onOpenSystem={id => setPeOpenSystem(prev => prev === id ? null : id)}
              openSystemId={peOpenSystem}
            />
          </Section>

          {/* 6. Point of Care Labs */}
          <Section title="Point of Care Labs" icon={FlaskConical} color="#f59e0b" defaultOpen={false}
            filled={(note.pocTests ?? []).length > 0}>
            <PocLabsChipsPanel
              tests={note.pocTests ?? []}
              onOpen={() => setPocOpen(true)}
            />
          </Section>

          {/* 7. Assessment / Plan */}
          <Section title="Assessment & Plan" icon={Tag} color="#6366f1" required
            filled={diagnosisDone || note.planTags.length > 0}>

            {/* 7a. Diagnosis (ICD Selection) */}
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Tag className="h-3 w-3 text-indigo-500" />
                Diagnosis
                {diagnosisDone && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> {diagnosisSaved.length} code{diagnosisSaved.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
              <DiagnosisChipsPanel
                diagnoses={diagnosisSaved}
                onOpen={() => setDiagnosisOpen(true)}
              />
            </div>

            {/* 7b. Lab Orders */}
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <FlaskConical className="h-3 w-3 text-amber-500" />
                Lab Orders
                {labDone && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> {labSaved?.tests.length ?? 0} test{(labSaved?.tests.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                )}
                {awaitingLab && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-600 border border-sky-200 flex items-center gap-1">
                    Sent to Lab
                  </span>
                )}
              </p>
              <LabChipsPanel order={labSaved} onOpen={() => setLabOpen(true)} />
            </div>

            {/* 7c. Formulary / Prescriptions */}
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Pill className="h-3 w-3 text-indigo-400" />
                Prescriptions
                {(note.medicines ?? []).length > 0 && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> {note.medicines.length} med{note.medicines.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
              <FormularyChipsPanel
                medicines={note.medicines ?? []}
                onOpen={() => setFormularyOpen(true)}
              />
            </div>

            {/* 7d. Other plan action tags */}
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Plan Actions</p>
              <div className="flex flex-wrap gap-2">
                {PLAN_TAGS.filter(t => t.label !== "Diagnosis" && t.label !== "Lab").map(({ label, color, Icon }) => {
                  const active = note.planTags.includes(label);
                  return (
                    <button
                      key={label}
                      onClick={() => togglePlanTag(label)}
                      className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border-2 transition-all"
                      style={active
                        ? { backgroundColor: color, color: "white", borderColor: color }
                        : { backgroundColor: `${color}10`, color, borderColor: `${color}30` }}>
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  );
                })}
              </div>
              {note.planTags.length > 0 && (
                <p className="text-[11px] text-slate-400 mt-2 italic">
                  Active: {note.planTags.join(" · ")}
                </p>
              )}
            </div>
          </Section>

          {/* 8. Other Orders + Visit Note (2-col) */}
          <Section title="Other Orders & Visit Description" icon={FileText} color="#f97316" defaultOpen={false}
            filled={note.otherOrders.trim() !== "" || note.visitNote.trim() !== ""}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Other Orders</p>
                <NoteField value={note.otherOrders} onChange={v => set("otherOrders", v)} placeholder="Additional orders…" rows={3} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Visit Description Note</p>
                <NoteField value={note.visitNote} onChange={v => set("visitNote", v)} placeholder="Summary of this visit…" rows={3} />
              </div>
            </div>
          </Section>

          {/* 9. Follow-up */}
          <Section title="Follow-Up Visit" icon={CalendarDays} color="#ec4899" filled={note.followUpDate !== ""}>
            <div className="flex flex-wrap gap-2 mb-2">
              {[
                { label: "1 Week",  days: 7  },
                { label: "2 Weeks", days: 14 },
                { label: "1 Month", days: 30 },
                { label: "3 Months",days: 90 },
              ].map(({ label, days }) => {
                const d = new Date(); d.setDate(d.getDate() + days);
                const val = d.toISOString().slice(0, 10);
                return (
                  <button
                    key={label}
                    onClick={() => set("followUpDate", val)}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all"
                    style={note.followUpDate === val
                      ? { backgroundColor: "#ec4899", color: "white", borderColor: "#ec4899" }
                      : { borderColor: "#e2e8f0", color: "#64748b" }}>
                    {label}
                  </button>
                );
              })}
            </div>
            <input
              type="date"
              value={note.followUpDate}
              onChange={e => set("followUpDate", e.target.value)}
              className="text-xs text-slate-700 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 transition-all"
              style={{ "--tw-ring-color": "#ec4899" } as React.CSSProperties}
            />
          </Section>

        </div>

        {/* ── Bottom action bar ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 bg-white flex-shrink-0">
          {awaitingLab ? (
            <Button
              disabled
              className="h-9 px-5 text-xs font-black gap-2 text-white flex-shrink-0 opacity-80 cursor-not-allowed"
              style={{ backgroundColor: "#0ea5e9" }}>
              <FlaskConical className="h-3.5 w-3.5" /> Awaiting Lab Results
            </Button>
          ) : (
            <Button
              className="h-9 px-5 text-xs font-black gap-2 text-white flex-shrink-0"
              style={{ backgroundColor: ACCENT }}>
              <PenLine className="h-3.5 w-3.5" /> Doctor's Sign
            </Button>
          )}
          <Button
            variant="outline"
            className="h-9 px-4 text-xs font-bold gap-2 border-slate-200 text-slate-500 hover:bg-slate-50 flex-shrink-0">
            <Printer className="h-3.5 w-3.5" /> Print to Review
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            className="h-9 px-4 text-xs font-bold gap-2 text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
            <Trash2 className="h-3.5 w-3.5" /> Discard
          </Button>
        </div>

        {/* ── HPI Template Drawer (slides in from right within the panel) ── */}
        {hpiOpenComplaint && (
          <HpiTemplateDrawer
            key={hpiOpenComplaint}
            complaint={hpiOpenComplaint}
            isDone={hpiDoneComplaints.includes(hpiOpenComplaint)}
            savedData={hpiSavedData[hpiOpenComplaint]}
            onSave={state => handleHpiSave(hpiOpenComplaint, state)}
            onClose={() => setHpiOpenComplaint(null)}
          />
        )}

        {/* ── PE System Drawer (slides in from right within the panel) ── */}
        {peOpenSystem && (
          <PeSystemDrawer
            key={peOpenSystem}
            systemId={peOpenSystem}
            isDone={peDoneSystemIds.includes(peOpenSystem)}
            savedData={peSavedData[peOpenSystem] ?? {}}
            onSave={findings => handlePeSave(peOpenSystem, findings)}
            onClose={() => setPeOpenSystem(null)}
          />
        )}

        {/* ── Diagnosis ICD Drawer ── */}
        {diagnosisOpen && (
          <DiagnosisDrawer
            isDone={diagnosisDone}
            savedData={diagnosisSaved}
            onSave={handleDiagnosisSave}
            onClose={() => setDiagnosisOpen(false)}
          />
        )}

        {/* ── Lab Order Drawer ── */}
        {labOpen && (
          <LabDrawer
            isDone={labDone}
            savedData={labSaved}
            onSave={handleLabSave}
            onSendToLab={handleSendToLab}
            onClose={() => setLabOpen(false)}
          />
        )}

        {/* ── POC Labs Drawer ── */}
        {pocOpen && (
          <PocLabsDrawer
            savedTests={note.pocTests ?? []}
            onSave={v => set("pocTests", v)}
            onClose={() => setPocOpen(false)}
          />
        )}

        {/* ── Formulary Drawer ── */}
        {formularyOpen && (
          <FormularyDrawer
            savedMedicines={note.medicines ?? []}
            patientAllergies={note.allergies ?? []}
            onSave={v => set("medicines", v)}
            onClose={() => setFormularyOpen(false)}
          />
        )}

      </div>
    </>
  );
}
