import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, Maximize2, Minimize2, FileText,
  StopCircle, PauseCircle, PlayCircle, ChevronDown, ChevronUp,
  Download, PenLine, FlaskConical, Scan, HeartPulse,
  Users, BookOpen, Stethoscope, ClipboardList, CalendarDays,
  CheckCircle2, AlertCircle, Printer, Trash2, Tag,
  GripVertical, Check, Search, Plus, Send,
  ArrowRight, ClipboardCheck, ChevronLeft, Pill, ScanLine,
  BookmarkPlus, RotateCcw, AlertTriangle,
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
import { saveActiveLabOrder, readActiveLabOrder } from "@/hooks/useSoapNoteDraft";
import { PocLabsChipsPanel, PocLabsDrawer } from "@/pages/PocLabsSection";
import type { PocTestResult } from "@/pages/PocLabsSection";
import { FormularyChipsPanel, FormularyDrawer, EMPTY_FORMULARY } from "@/pages/FormularySection";
import type { FormularyData } from "@/pages/FormularySection";
import { ImagingChipsPanel, ImagingDrawer, EMPTY_IMAGING } from "@/pages/ImagingSection";
import type { ImagingData } from "@/pages/ImagingSection";
import { CarePlanChipsPanel, CarePlanDrawer, EMPTY_CARE_PLAN } from "@/pages/CarePlanSection";
import type { CarePlanData } from "@/pages/CarePlanSection";
import { HealthEdChipsPanel, HealthEdDrawer, EMPTY_HEALTH_ED } from "@/pages/HealthEdSection";
import type { HealthEdSelection } from "@/pages/HealthEdSection";
import { ReferralChipsPanel, ReferralDrawer, EMPTY_REFERRAL_DATA } from "@/pages/ReferralSection";
import type { ReferralData, ReferralMed } from "@/pages/ReferralSection";
import { ProcedureOrdersChipsPanel, ProcedureOrdersDrawer, EMPTY_PROCEDURE_ORDERS } from "@/pages/ProcedureOrdersSection";
import type { ProcedureOrdersData } from "@/pages/ProcedureOrdersSection";
import { PatientGoalsChipsPanel, PatientGoalsDrawer, EMPTY_PATIENT_GOALS } from "@/pages/PatientGoalsSection";
import type { PatientGoalsData } from "@/pages/PatientGoalsSection";
import { TemplateDrawer } from "@/pages/SoapNoteTemplates";
import {
  PastHistoryPanel, FamilyHistoryPanel,
  SurgicalHistoryPanel, SocialHistoryPanel,
  EMPTY_SOCIAL_HISTORY,
} from "@/pages/MedicalHistorySection";
import type { FamilyRow, SurgicalEntry, SocialHistory } from "@/pages/MedicalHistorySection";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#4982CF";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NoteState {
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
  formulary:       FormularyData;
  imaging:         ImagingData;
  carePlan:        CarePlanData;
  healthEd:        HealthEdSelection;
  referrals:       ReferralData;
  procedureOrders: ProcedureOrdersData;
  patientGoals:    PatientGoalsData;
  otherOrders:     string;
  visitNote:       string;
  followUpDate:    string;
  planTags:        string[];
  // Lab orders and diagnosis captured outside the note module sections
  labOrders:       LabOrder[];
  labOrderDone:    boolean;
  diagnoses:       DiagnosisEntry[];
  diagnosisDone:   boolean;
  // HPI and Physical Exam drawer-state persisted so they survive refresh
  hpiSavedData:       Record<string, CoughState>;
  hpiDoneComplaints:  string[];
  peSavedData:        Record<string, Record<string, string>>;
  peDoneSystemIds:    string[];
}

export const EMPTY_NOTE: NoteState = {
  chiefComplaints: [], hpi: "", allergies: [],
  pmhActive: [], pmhResolved: [], surgicalRows: [], fhRows: [], fhGenetic: [], socialHistory: EMPTY_SOCIAL_HISTORY,
  ros: [], pocTests: [], formulary: EMPTY_FORMULARY, imaging: EMPTY_IMAGING, carePlan: EMPTY_CARE_PLAN, healthEd: EMPTY_HEALTH_ED, referrals: EMPTY_REFERRAL_DATA, procedureOrders: EMPTY_PROCEDURE_ORDERS, patientGoals: EMPTY_PATIENT_GOALS,
  otherOrders: "", visitNote: "", followUpDate: "",
  planTags: [],
  labOrders: [], labOrderDone: false, diagnoses: [], diagnosisDone: false,
  hpiSavedData: {}, hpiDoneComplaints: [], peSavedData: {}, peDoneSystemIds: [],
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
  entryId?: string;
  patientName: string;
  faceSheetOpenedAt?: number;
  awaitingLab?: boolean;
  labResultsReady?: boolean;
  signed?: boolean;
  onSendToLab?: () => void;
  onDiscardLab?: () => void;
  onDoctorSign?: () => void;
  onSaveAndClose?: () => void;
  onClose: () => void;
  initialNote?: NoteState;
  onNoteChange?: (note: NoteState) => void;
  isAddendumMode?: boolean;
  onAddendum?: (note: NoteState) => void;
  onCancel?: () => void;
}

export function ClinicalNoteDrawer({ entryId, patientName, faceSheetOpenedAt, awaitingLab = false, labResultsReady = false, signed = false, onSendToLab, onDiscardLab, onDoctorSign, onSaveAndClose, onClose, initialNote, onNoteChange, isAddendumMode = false, onAddendum, onCancel }: ClinicalNoteDrawerProps) {
  const [fullscreen,        setFullscreen]        = useState(false);
  const [note,              setNote]              = useState<NoteState>(() => initialNote ?? EMPTY_NOTE);
  const [hpiOpenComplaint,  setHpiOpenComplaint]  = useState<string | null>(null);
  const [hpiDoneComplaints, setHpiDoneComplaints] = useState<string[]>(() => initialNote?.hpiDoneComplaints ?? []);
  const [hpiSavedData,      setHpiSavedData]      = useState<Record<string, CoughState>>(() => initialNote?.hpiSavedData ?? {});
  const [peOpenSystem,      setPeOpenSystem]      = useState<string | null>(null);
  const [peDoneSystemIds,   setPeDoneSystemIds]   = useState<string[]>(() => initialNote?.peDoneSystemIds ?? []);
  const [peSavedData,       setPeSavedData]       = useState<Record<string, Record<string, string>>>(() => initialNote?.peSavedData ?? {});
  const [diagnosisDone,     setDiagnosisDone]     = useState(() => initialNote?.diagnosisDone ?? false);
  const [diagnosisSaved,    setDiagnosisSaved]    = useState<DiagnosisEntry[]>(() => initialNote?.diagnoses ?? []);
  const [diagnosisOpen,     setDiagnosisOpen]     = useState(false);
  const [labDone,           setLabDone]           = useState(() => (initialNote?.labOrders?.length ?? 0) > 0 || (initialNote?.labOrderDone ?? false));
  const [labOrders,         setLabOrders]         = useState<LabOrder[]>(() => {
    let orders: LabOrder[];
    if (initialNote?.labOrders?.length) {
      orders = initialNote.labOrders;
    } else {
      // backward-compat: old drafts stored a single labOrder field
      const legacy = (initialNote as (NoteState & { labOrder?: LabOrder | null }) | undefined)?.labOrder;
      orders = legacy ? [legacy] : [];
    }
    // Migrate: assign a stable id to any order that predates the multi-order redesign.
    // Use ?? so this is also safe against undefined at runtime (old localStorage data).
    return orders.map(o => ({ ...o, id: o.id ?? crypto.randomUUID() }));
  });
  // sentAt of the order currently being processed at the lab (null when not awaiting)
  const activeLabSentAt: string | null = awaitingLab && entryId
    ? readActiveLabOrder(entryId)?.sentAt ?? null
    : null;

  // true when the dispatched lab order has been voided — unlocks "Send to Lab" again
  const activeOrderIsVoided = awaitingLab
    ? labOrders.some(o => o.sentAt === activeLabSentAt && o.voided)
    : false;

  const [voidPending,       setVoidPending]       = useState<{ id: string } | null>(null);
  const [voidReasonInput,   setVoidReasonInput]   = useState("");
  // labDrawerMode: null = closed; "add" = new order; "edit" = editing existing order
  const [labDrawerMode,     setLabDrawerMode]     = useState<"add" | "edit" | null>(null);
  const [editingOrderId,    setEditingOrderId]    = useState<string | null>(null);
  const [pocOpen,           setPocOpen]           = useState(false);
  const [formularyOpen,     setFormularyOpen]     = useState(false);
  const [imagingOpen,       setImagingOpen]       = useState(false);
  const [carePlanOpen,      setCarePlanOpen]      = useState(false);
  const [healthEdOpen,      setHealthEdOpen]      = useState(false);
  const [referralOpen,      setReferralOpen]      = useState(false);
  const [procOrdersOpen,    setProcOrdersOpen]    = useState(false);
  const [patientGoalsOpen,  setPatientGoalsOpen]  = useState(false);
  const [templateOpen,      setTemplateOpen]      = useState(false);
  const [templateMode,      setTemplateMode]      = useState<"browse" | "save">("browse");
  const [discardConfirm,    setDiscardConfirm]    = useState(false);
  const elapsedOnOpen  = faceSheetOpenedAt ? Math.floor((Date.now() - faceSheetOpenedAt) / 1000) : 0;
  const patientTimer   = useTimer(elapsedOnOpen);
  const documentTimer  = useTimer();
  const progress = calcProgress(note);

  function set<K extends keyof NoteState>(key: K, val: NoteState[K]) {
    setNote(prev => ({ ...prev, [key]: val }));
  }

  // Notify parent of every note change so it can persist the draft.
  // Use a ref so the callback is always current without it being a dep.
  const onNoteChangeRef = useRef(onNoteChange);
  useEffect(() => { onNoteChangeRef.current = onNoteChange; });
  useEffect(() => {
    onNoteChangeRef.current?.(note);
  }, [note]);

  function togglePlanTag(tag: string) {
    set("planTags", note.planTags.includes(tag)
      ? note.planTags.filter(t => t !== tag)
      : [...note.planTags, tag]);
  }

  function eraseNoteFields() {
    setNote(EMPTY_NOTE);
    setHpiDoneComplaints([]);
    setHpiSavedData({});
    setPeDoneSystemIds([]);
    setPeSavedData({});
    setDiagnosisDone(false);
    setDiagnosisSaved([]);
  }

  function handleEraseSoapNote() {
    eraseNoteFields();
    // lab orders and labDone intentionally preserved
    setDiscardConfirm(false);
  }

  function handleCancelLabQueue() {
    if (labDone || awaitingLab) onDiscardLab?.();
    setLabDone(false);
    setLabOrders([]);
    setDiscardConfirm(false);
  }

  function handleHpiSave(complaint: string, state: CoughState) {
    const nextSavedData = { ...hpiSavedData, [complaint]: state };
    const nextDone = hpiDoneComplaints.includes(complaint) ? hpiDoneComplaints : [...hpiDoneComplaints, complaint];
    setHpiSavedData(nextSavedData);
    setHpiDoneComplaints(nextDone);
    setHpiOpenComplaint(null);
    setNote(prev => ({ ...prev, hpiSavedData: nextSavedData, hpiDoneComplaints: nextDone }));
  }

  function handlePeSave(systemId: string, findings: Record<string, string>) {
    const nextPeData = { ...peSavedData, [systemId]: findings };
    const nextDoneIds = peDoneSystemIds.includes(systemId) ? peDoneSystemIds : [...peDoneSystemIds, systemId];
    setPeSavedData(nextPeData);
    setPeDoneSystemIds(nextDoneIds);
    setPeOpenSystem(null);
    setNote(prev => ({ ...prev, peSavedData: nextPeData, peDoneSystemIds: nextDoneIds }));
  }

  function handleDiagnosisSave(entries: DiagnosisEntry[]) {
    setDiagnosisSaved(entries);
    setDiagnosisDone(true);
    setDiagnosisOpen(false);
    setNote(prev => ({ ...prev, diagnoses: entries, diagnosisDone: true }));
  }

  function handleLabSave(order: Omit<LabOrder, "id">) {
    let nextOrders: LabOrder[];
    if (labDrawerMode === "edit" && editingOrderId) {
      // Replace the existing order in-place — preserve id and any sent/void metadata
      nextOrders = labOrders.map(o =>
        o.id === editingOrderId ? { ...o, ...order, id: editingOrderId } : o
      );
    } else {
      // Add a new order with a fresh id (covers add mode and second-order mode)
      const newOrder: LabOrder = { ...order, id: crypto.randomUUID() };
      nextOrders = [...labOrders, newOrder];
    }
    setLabOrders(nextOrders);
    setLabDone(true);
    setLabDrawerMode(null);
    setEditingOrderId(null);
    setNote(prev => ({ ...prev, labOrders: nextOrders, labOrderDone: true }));
  }

  function handleSendToLab(orderId: string) {
    const order = labOrders.find(o => o.id === orderId);
    if (!order) return;
    const stamped = { ...order, sentAt: new Date().toISOString() };
    const nextOrders = labOrders.map(o => o.id === orderId ? stamped : o);
    setLabOrders(nextOrders);
    setLabDone(true);
    setNote(prev => ({ ...prev, labOrders: nextOrders, labOrderDone: true }));
    if (entryId) saveActiveLabOrder(entryId, stamped);
    onSendToLab?.();
  }

  function handleVoidOrder(orderId: string, reason: string) {
    const nextOrders = labOrders.map(o =>
      o.id === orderId
        ? { ...o, voided: true, voidedAt: new Date().toISOString(), voidReason: reason }
        : o
    );
    setLabOrders(nextOrders);
    setNote(prev => ({ ...prev, labOrders: nextOrders }));

    // Propagate void to the Lab Panel localStorage so lab staff see the updated state
    if (entryId) {
      const stored = readActiveLabOrder(entryId);
      const updated = nextOrders.find(o => o.id === orderId);
      // Match by sentAt — only update if this is the order currently dispatched to the lab
      if (stored && updated?.sentAt && stored.sentAt === updated.sentAt) {
        saveActiveLabOrder(entryId, updated);
      }
    }
  }

  function openVoidModal(orderId: string) {
    setVoidPending({ id: orderId });
    setVoidReasonInput("");
  }

  function confirmVoid() {
    if (!voidPending) return;
    const reason = voidReasonInput.trim();
    if (!reason) return;
    handleVoidOrder(voidPending.id, reason);
    setVoidPending(null);
    setVoidReasonInput("");
  }

  function handleRemoveOrder(orderId: string) {
    const nextOrders = labOrders.filter(o => o.id !== orderId);
    setLabOrders(nextOrders);
    setNote(prev => ({ ...prev, labOrders: nextOrders, labOrderDone: nextOrders.length > 0 }));
    if (nextOrders.length === 0) setLabDone(false);
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

          {/* Left: Template */}
          <button
            onClick={() => { setTemplateMode("browse"); setTemplateOpen(true); }}
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors flex-shrink-0">
            <FileText className="h-3.5 w-3.5" style={{ color: ACCENT }} /> Add Template
          </button>
          <button
            onClick={() => { setTemplateMode("save"); setTemplateOpen(true); }}
            className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors flex-shrink-0"
            title="Save current note as template">
            <BookmarkPlus className="h-3.5 w-3.5 text-blue-400" /> Save Template
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
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {(() => {
                      const active = labOrders.filter(o => !o.voided);
                      if (active.length === 0) return "all voided";
                      if (active.length > 1)
                        return `${active.length} orders · ${active.reduce((s, o) => s + o.tests.length, 0)} tests`;
                      return `${active[0].tests.length} test${active[0].tests.length !== 1 ? "s" : ""}`;
                    })()}
                  </span>
                )}
              </p>

              {labOrders.length === 0 ? (
                /* Empty state — "Order Lab Tests" trigger */
                <button
                  onClick={() => { setLabDrawerMode("add"); setEditingOrderId(null); }}
                  className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl bg-amber-50/60 border-2 border-dashed border-amber-200 text-amber-600 font-bold text-xs hover:border-amber-400 hover:bg-amber-50 transition-all">
                  <Plus className="h-4 w-4 flex-shrink-0" />
                  Order Lab Tests…
                </button>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    // true while exactly one sent+un-voided order exists
                    const hasActiveSent = labOrders.some(o => !!o.sentAt && !o.voided);
                    return labOrders.map((order, idx) => {
                      const isSent   = !!order.sentAt && !order.voided;
                      const isVoided = !!order.voided;
                      const isUnsent = !order.sentAt && !isVoided;
                      return (
                        <div
                          key={order.id ?? idx}
                          className={[
                            "rounded-xl border px-3 py-2.5",
                            isVoided ? "border-rose-100 bg-rose-50/40 opacity-70"
                              : isSent ? "border-sky-200 bg-sky-50/40"
                              : "border-slate-200 bg-white",
                          ].join(" ")}>

                          {/* Order header row */}
                          <div className="flex items-center justify-between mb-1.5 gap-1 flex-wrap">
                            <p className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isVoided ? "text-rose-400 line-through" : isSent ? "text-sky-600" : "text-slate-400"}`}>
                              Order {idx + 1}{idx === 0 ? " · Original" : " · Follow-up"}
                              {order.sentAt && (
                                <span className="normal-case font-medium tracking-normal" style={{ textDecoration: "none" }}>
                                  · {new Date(order.sentAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                </span>
                              )}
                              {isVoided && (
                                <span className="ml-1 normal-case font-semibold tracking-normal text-rose-500" style={{ textDecoration: "none" }}>· VOIDED</span>
                              )}
                            </p>

                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                              {/* Sent to Lab chip */}
                              {isSent && (
                                <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-600 border border-sky-200">
                                  <Send className="h-2.5 w-2.5" /> Sent to Lab
                                </span>
                              )}
                              {/* Results Complete badge — shown when lab results have been returned */}
                              {isSent && labResultsReady && (
                                <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Results Complete
                                </span>
                              )}
                              {/* Void reason text */}
                              {isVoided && order.voidReason && (
                                <p className="text-[9px] text-rose-400 italic">Reason: {order.voidReason}</p>
                              )}
                              {/* Void button — only for sent, un-voided orders that are not yet result-complete */}
                              {isSent && !labResultsReady && (
                                <button
                                  onClick={() => openVoidModal(order.id)}
                                  title="Void this order"
                                  className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md transition-colors text-rose-500 hover:text-rose-700 hover:bg-rose-100">
                                  <Trash2 className="h-2.5 w-2.5" /> Void
                                </button>
                              )}
                              {/* Send to Lab — only for unsent orders when no active sent order exists */}
                              {isUnsent && !hasActiveSent && (
                                <button
                                  onClick={() => handleSendToLab(order.id)}
                                  title="Send this order to the lab"
                                  className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-md transition-colors bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100">
                                  <Send className="h-2.5 w-2.5" /> Send to Lab
                                </button>
                              )}
                              {/* Edit — only for unsent orders */}
                              {isUnsent && (
                                <button
                                  onClick={() => { setEditingOrderId(order.id); setLabDrawerMode("edit"); }}
                                  title="Edit this order"
                                  className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md transition-colors text-amber-600 hover:text-amber-800 hover:bg-amber-50">
                                  <PenLine className="h-2.5 w-2.5" /> Edit
                                </button>
                              )}
                              {/* Remove — only for unsent orders */}
                              {isUnsent && (
                                <button
                                  onClick={() => handleRemoveOrder(order.id)}
                                  title="Remove this order"
                                  className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md transition-colors text-slate-400 hover:text-red-500 hover:bg-red-50">
                                  <Trash2 className="h-2.5 w-2.5" /> Remove
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Chips panel — read-only, action buttons are handled above */}
                          <div className={isVoided ? "opacity-50 pointer-events-none" : ""}>
                            <LabChipsPanel order={order} />
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Add Lab Order button — always shown once at least one order exists */}
                  <button
                    onClick={() => { setLabDrawerMode("add"); setEditingOrderId(null); }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-amber-200 text-amber-600 text-xs font-bold hover:border-amber-400 hover:bg-amber-50/40 transition-all">
                    <Plus className="h-3.5 w-3.5" /> Add Lab Order
                  </button>
                </div>
              )}
            </div>

            {/* 7c. Formulary / Prescriptions */}
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Pill className="h-3 w-3 text-indigo-400" />
                Prescriptions
                {(note.formulary?.medicines?.length ?? 0) > 0 && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> {note.formulary.medicines.length} med{note.formulary.medicines.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
              <FormularyChipsPanel
                data={note.formulary ?? EMPTY_FORMULARY}
                onOpen={() => setFormularyOpen(true)}
              />
            </div>

            {/* 7d. Imaging */}
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <ScanLine className="h-3 w-3 text-cyan-500" />
                Imaging
                {(note.imaging?.orders?.length ?? 0) > 0 && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> {note.imaging.orders.length} order{note.imaging.orders.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
              <ImagingChipsPanel
                data={note.imaging ?? EMPTY_IMAGING}
                onOpen={() => setImagingOpen(true)}
              />
            </div>

            {/* 7e. Care Plan */}
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <ClipboardList className="h-3 w-3 text-emerald-500" />
                Care Plan
                {(note.carePlan?.tasks?.length ?? 0) > 0 && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> {note.carePlan.tasks.length} task{note.carePlan.tasks.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
              <CarePlanChipsPanel
                data={note.carePlan ?? EMPTY_CARE_PLAN}
                onOpen={() => setCarePlanOpen(true)}
              />
            </div>

            {/* 7f. Procedure Orders */}
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Stethoscope className="h-3 w-3 text-teal-500" />
                Procedure Orders
                {(note.procedureOrders?.orders?.length ?? 0) > 0 && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-600 border border-teal-200 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> {note.procedureOrders.orders.length} order{note.procedureOrders.orders.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
              <ProcedureOrdersChipsPanel
                data={note.procedureOrders ?? EMPTY_PROCEDURE_ORDERS}
                onOpen={() => setProcOrdersOpen(true)}
              />
            </div>

            {/* 7g. Referrals */}
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Users className="h-3 w-3 text-indigo-500" />
                Referrals
                {(note.referrals?.referrals?.length ?? 0) > 0 && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 border border-indigo-200 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> {note.referrals.referrals.length} referral{note.referrals.referrals.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
              <ReferralChipsPanel
                data={note.referrals ?? EMPTY_REFERRAL_DATA}
                onOpen={() => setReferralOpen(true)}
              />
            </div>

            {/* 7h. Patient Goals */}
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-pink-500" />
                Patient Goals
                {(note.patientGoals?.goals?.length ?? 0) > 0 && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 border border-pink-200 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> {note.patientGoals.goals.length} goal{note.patientGoals.goals.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
              <PatientGoalsChipsPanel
                data={note.patientGoals ?? EMPTY_PATIENT_GOALS}
                onOpen={() => setPatientGoalsOpen(true)}
              />
            </div>

            {/* 7i. Health Education */}
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <BookOpen className="h-3 w-3 text-violet-500" />
                Health Education
                {(note.healthEd?.docIds?.length ?? 0) > 0 && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> {note.healthEd.docIds.length} doc{note.healthEd.docIds.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
              <HealthEdChipsPanel
                data={note.healthEd ?? EMPTY_HEALTH_ED}
                onOpen={() => setHealthEdOpen(true)}
              />
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
          {isAddendumMode ? (
            <>
              <Button
                onClick={() => { onAddendum?.(note); }}
                className="h-9 px-5 text-xs font-black gap-2 text-white flex-shrink-0"
                style={{ backgroundColor: "#f59e0b" }}>
                <PenLine className="h-3.5 w-3.5" /> Addendum
              </Button>
              <Button
                variant="outline"
                onClick={() => { onCancel?.(); }}
                className="h-9 px-4 text-xs font-bold gap-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 flex-shrink-0">
                <X className="h-3.5 w-3.5" /> Cancel Addendum
              </Button>
            </>
          ) : awaitingLab ? (
            <Button
              disabled
              className="h-9 px-5 text-xs font-black gap-2 text-white flex-shrink-0 opacity-80 cursor-not-allowed"
              style={{ backgroundColor: "#0ea5e9" }}>
              <FlaskConical className="h-3.5 w-3.5" /> Awaiting Lab Results
            </Button>
          ) : signed ? (
            <Button
              disabled
              className="h-9 px-5 text-xs font-black gap-2 flex-shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed opacity-90">
              <CheckCircle2 className="h-3.5 w-3.5" /> Note Signed
            </Button>
          ) : (
            <Button
              onClick={() => {
                onDoctorSign?.();
                setNote(EMPTY_NOTE);
                setHpiDoneComplaints([]);
                setHpiSavedData({});
                setPeDoneSystemIds([]);
                setPeSavedData({});
                setDiagnosisDone(false);
                setDiagnosisSaved([]);
                setLabDone(false);
                setLabOrders([]);
              }}
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
          {!signed && (
            <Button
              variant="ghost"
              onClick={() => setDiscardConfirm(true)}
              className="h-9 px-4 text-xs font-bold gap-2 text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
              <RotateCcw className="h-3.5 w-3.5" /> Discard
            </Button>
          )}
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
        {labDrawerMode && (
          <LabDrawer
            mode={labDrawerMode}
            savedData={
              labDrawerMode === "edit"
                // edit mode: pre-populate the drawer with the order being edited
                ? (labOrders.find(o => o.id === editingOrderId) ?? null)
                // add/second-order mode: pass the last sent order so LabDrawer can
                // compute previousTestIds and show completed-badge locks
                : (labOrders.find(o => !!o.sentAt && !o.voided) ?? null)
            }
            awaitingLab={awaitingLab && !activeOrderIsVoided}
            labResultsReady={labResultsReady && !activeOrderIsVoided}
            onSave={handleLabSave}
            onClose={() => { setLabDrawerMode(null); setEditingOrderId(null); }}
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
            savedData={note.formulary ?? EMPTY_FORMULARY}
            patientAllergies={note.allergies ?? []}
            onSave={v => set("formulary", v)}
            onClose={() => setFormularyOpen(false)}
          />
        )}

        {/* ── Imaging Drawer ── */}
        {imagingOpen && (
          <ImagingDrawer
            savedData={note.imaging ?? EMPTY_IMAGING}
            onSave={v => set("imaging", v)}
            onClose={() => setImagingOpen(false)}
          />
        )}

        {/* ── Care Plan Drawer ── */}
        {carePlanOpen && (
          <CarePlanDrawer
            savedData={note.carePlan ?? EMPTY_CARE_PLAN}
            onSave={v => set("carePlan", v)}
            onClose={() => setCarePlanOpen(false)}
          />
        )}

        {/* ── Health Education Drawer ── */}
        {healthEdOpen && (
          <HealthEdDrawer
            savedData={note.healthEd ?? EMPTY_HEALTH_ED}
            onSave={v => set("healthEd", v)}
            onClose={() => setHealthEdOpen(false)}
          />
        )}

        {/* ── Template Drawer ── */}
        {templateOpen && (
          <TemplateDrawer
            note={note}
            initialMode={templateMode}
            onImport={newNote => setNote(newNote)}
            onClose={() => setTemplateOpen(false)}
          />
        )}

        {/* ── Patient Goals Drawer ── */}
        {patientGoalsOpen && (
          <PatientGoalsDrawer
            savedData={note.patientGoals ?? EMPTY_PATIENT_GOALS}
            onSave={v => set("patientGoals", v)}
            onClose={() => setPatientGoalsOpen(false)}
          />
        )}

        {/* ── Procedure Orders Drawer ── */}
        {procOrdersOpen && (
          <ProcedureOrdersDrawer
            savedData={note.procedureOrders ?? EMPTY_PROCEDURE_ORDERS}
            onSave={v => set("procedureOrders", v)}
            onClose={() => setProcOrdersOpen(false)}
          />
        )}

        {/* ── Referral Drawer ── */}
        {referralOpen && (
          <ReferralDrawer
            savedData={note.referrals ?? EMPTY_REFERRAL_DATA}
            patientAllergies={note.allergies ?? []}
            patientMeds={(note.formulary?.medicines ?? []).map(m => ({
              id:        m.brandId,
              brand:     m.brand,
              generic:   m.genericName,
              strength:  m.strength,
              frequency: m.frequency,
              duration:  m.duration,
              qty:       1,
            } as ReferralMed))}
            onSave={v => set("referrals", v)}
            onClose={() => setReferralOpen(false)}
          />
        )}

        {/* ── Void Reason Modal ── */}
        {voidPending && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <div className="bg-white rounded-xl shadow-2xl w-[360px] mx-4 overflow-hidden">
              <div className="flex items-start gap-3 p-5 border-b border-slate-100">
                <div className="flex-shrink-0 mt-0.5 h-9 w-9 rounded-full bg-rose-50 flex items-center justify-center">
                  <Trash2 className="h-4.5 w-4.5 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Void this lab order?</p>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">Please select or enter a reason for voiding this order.</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {["Ordered in error", "Patient declined", "Duplicate order", "Test not available", "Patient not fasting"].map(preset => (
                    <button
                      key={preset}
                      onClick={() => setVoidReasonInput(preset)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                        voidReasonInput === preset
                          ? "bg-rose-100 text-rose-700 border-rose-300"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={voidReasonInput}
                  onChange={e => setVoidReasonInput(e.target.value)}
                  placeholder="Or type a custom reason…"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-300 placeholder:text-slate-400"
                />
              </div>
              {!voidReasonInput.trim() && (
                <p className="px-5 pb-2 text-[10px] text-rose-400 italic">A reason is required to void this order.</p>
              )}
              <div className="flex justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setVoidPending(null); setVoidReasonInput(""); }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={confirmVoid}
                  disabled={!voidReasonInput.trim()}
                  className="text-xs bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Void Order
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Discard Options Overlay ── */}
        {discardConfirm && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <div className="bg-white rounded-2xl shadow-2xl w-[400px] mx-4 overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">What would you like to reset?</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Choose an action — this cannot be undone.</p>
                </div>
              </div>

              {/* Options */}
              <div className="p-4 space-y-2.5">
                {/* Option 1: Erase SOAP Note only */}
                <button
                  onClick={handleEraseSoapNote}
                  className="w-full text-left flex items-start gap-3.5 px-4 py-3.5 rounded-xl border border-amber-100 bg-amber-50/60 hover:bg-amber-100/70 transition-colors group"
                >
                  <div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-full bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                    <RotateCcw className="h-4 w-4 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-800">Erase SOAP Note</p>
                    <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
                      Clear HPI, PE, and diagnoses only — lab orders remain untouched.
                    </p>
                  </div>
                </button>

                {/* Option 3: Cancel Lab Queue — only shown when patient is in lab queue AND results are not yet complete */}
                {awaitingLab && !labResultsReady && (
                  <button
                    onClick={handleCancelLabQueue}
                    className="w-full text-left flex items-start gap-3.5 px-4 py-3.5 rounded-xl border border-sky-100 bg-sky-50/60 hover:bg-sky-100/70 transition-colors group"
                  >
                    <div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-full bg-sky-100 group-hover:bg-sky-200 flex items-center justify-center transition-colors">
                      <FlaskConical className="h-4 w-4 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-sky-700">Cancel the Lab Queue</p>
                      <p className="text-[11px] text-sky-500 mt-0.5 leading-relaxed">
                        Remove the patient from the lab queue only — SOAP note content is kept.
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Go Back */}
              <div className="px-4 pb-4">
                <button
                  onClick={() => setDiscardConfirm(false)}
                  className="w-full text-xs font-semibold text-slate-500 hover:text-slate-700 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
