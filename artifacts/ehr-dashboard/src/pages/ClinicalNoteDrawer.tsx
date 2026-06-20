import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { VitalEntry } from "@/types/vitals";

import {
  X, Maximize2, Minimize2, FileText,
  StopCircle, PauseCircle, PlayCircle, ChevronDown, ChevronUp,
  Download, PenLine, FlaskConical, Scan, HeartPulse,
  Users, BookOpen, Stethoscope, ClipboardList, CalendarDays,
  CheckCircle2, AlertCircle, Printer, Trash2, Tag,
  GripVertical, Check, Search, Plus, Send,
  ArrowRight, ClipboardCheck, ChevronLeft, Pill, ScanLine,
  BookmarkPlus, RotateCcw, AlertTriangle, Layers,
  Mic, Sparkles, Radio, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadForms } from "@/pages/SpecialtyFormsModule";
import type { SpecialtyForm } from "@/pages/SpecialtyFormsModule";
import { printHealthRecord } from "@/lib/printHealthRecord";
import { CoughHistoryTemplate, CoughSummary, COUGH_EMPTY } from "@/pages/CoughHistoryTemplate";
import type { CoughState } from "@/pages/CoughHistoryTemplate";
import { AllergySelector } from "@/pages/AllergySelector";
import type { AllergyEntry } from "@/pages/AllergySelector";
import { RosSummary, RosDrawer, PeSystemSelector, PeChipsPanel, PeSystemDrawer } from "@/pages/RosPeSection";
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
import { EMPTY_CARE_PLAN } from "@/pages/CarePlanSection";
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
  ros:             Record<string, string[]>;
  peSystems:       string[];
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
  /** Vital signs captured during this consultation (BP, pulse, SpO₂, temp). */
  vitals?:            VitalEntry[];
  /** Field responses when documenting via a Specialty Form. Keyed by FormField.id. */
  specialtyFormData?: Record<string, unknown>;
  /** ID of the SpecialtyForm used for this note — stamped when activeMode is "specialty". */
  specialtyFormId?: string;
}

export const EMPTY_NOTE: NoteState = {
  chiefComplaints: [], hpi: "", allergies: [],
  pmhActive: [], pmhResolved: [], surgicalRows: [], fhRows: [], fhGenetic: [], socialHistory: EMPTY_SOCIAL_HISTORY,
  ros: {}, peSystems: [], pocTests: [], formulary: EMPTY_FORMULARY, imaging: EMPTY_IMAGING, carePlan: EMPTY_CARE_PLAN, healthEd: EMPTY_HEALTH_ED, referrals: EMPTY_REFERRAL_DATA, procedureOrders: EMPTY_PROCEDURE_ORDERS, patientGoals: EMPTY_PATIENT_GOALS,
  otherOrders: "", visitNote: "", followUpDate: "",
  planTags: [],
  labOrders: [], labOrderDone: false, diagnoses: [], diagnosisDone: false,
  hpiSavedData: {}, hpiDoneComplaints: [], peSavedData: {}, peDoneSystemIds: [],
  vitals: [], specialtyFormData: {}, specialtyFormId: undefined,
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

  function updatePos() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 6, left: r.left, width: r.width });
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      const insideTrigger  = triggerRef.current?.contains(t);
      const insideDropdown = dropdownRef.current?.contains(t);
      if (!insideTrigger && !insideDropdown) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

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
        onClick={() => { if (open) { setOpen(false); } else { updatePos(); setOpen(true); } }}
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

      {/* Dropdown — portal with fixed position, repositioned on scroll */}
      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
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
    note.pmhActive,
    note.planTags, note.visitNote, note.followUpDate,
  ];
  const rosHasData = Object.values(note.ros).some(arr => (arr?.length ?? 0) > 0);
  const filled = fields.filter(f => (Array.isArray(f) ? f.length > 0 : (f ?? "").trim() !== "")).length
    + (rosHasData ? 1 : 0);
  return Math.round((filled / (fields.length + 1)) * 100);
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

// ─── Specialty Form Renderer ──────────────────────────────────────────────────

function MultiSelectFieldInput({
  options, allowOther, placeholder, selectionStyle = "ranked", selected, onChange,
}: {
  options: string[];
  allowOther?: boolean;
  placeholder?: string;
  selectionStyle?: "ranked" | "simple";
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open,    setOpen]    = useState(false);
  const [search,  setSearch]  = useState("");
  const [custom,  setCustom]  = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef  = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function updatePos() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 6, left: r.left, width: r.width });
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

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

  const allOptions = [...options.filter(Boolean), ...selected.filter(s => !options.includes(s))];
  const filtered   = allOptions.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => { if (open) { setOpen(false); } else { updatePos(); setOpen(true); } }}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#4982CF]/50 transition-colors text-left">
        {selected.length === 0 ? (
          <span className="text-xs text-slate-300 flex-1">{placeholder || "Select options…"}</span>
        ) : (
          <span className="text-xs font-semibold flex-1" style={{ color: "#4982CF" }}>
            {selected.length} option{selected.length > 1 ? "s" : ""} selected
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100">
            <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="flex-1 text-xs outline-none text-slate-700 placeholder-slate-300 bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

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
                    style={checked ? { backgroundColor: "#4982CF", borderColor: "#4982CF" } : { borderColor: "#cbd5e1" }}>
                    {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-xs text-slate-700 flex-1">{opt}</span>
                  {checked && (
                    <span
                      className="text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: "#4982CF" }}>
                      {rank}
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-4 py-4 text-xs text-center text-slate-400">
                {allowOther ? "No matches — add as custom below" : "No matches"}
              </p>
            )}
          </div>

          {allowOther && (
            <div className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-100 bg-slate-50/50">
              <Plus className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <input
                value={custom}
                onChange={e => setCustom(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                placeholder="Add custom…"
                className="flex-1 text-xs outline-none text-slate-700 placeholder-slate-300 bg-transparent"
              />
              <button
                onClick={addCustom}
                disabled={!custom.trim()}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white transition-opacity disabled:opacity-30"
                style={{ backgroundColor: "#4982CF" }}>
                Add
              </button>
            </div>
          )}
        </div>,
        document.body
      )}

      {selected.length > 0 && selectionStyle === "simple" && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {selected.map(item => (
            <span
              key={item}
              className="flex items-center gap-1.5 rounded-full border border-[#4982CF]/30 bg-blue-50 px-2.5 py-1 text-xs font-medium text-[#4982CF]">
              {item}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); remove(item); }}
                className="text-[#4982CF]/50 hover:text-[#4982CF] transition-colors">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      {selected.length > 0 && selectionStyle === "ranked" && (
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
                  isPrimary  ? "bg-[#4982CF] text-white border-[#4982CF] shadow-sm" : "bg-blue-50 text-blue-800 border-blue-200",
                ].join(" ")}>
                <GripVertical className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
                <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isPrimary ? "bg-white/25 text-white" : "bg-[#4982CF] text-white"}`}>
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold flex-1">{item}</span>
                {isPrimary && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/20 text-white/90 flex-shrink-0">Primary</span>
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
            Drag to reorder · <span className="font-semibold text-slate-500">Position 1 = Primary</span>
          </p>
        </div>
      )}
    </div>
  );
}

function SpecialtyFormPanel({
  form,
  data,
  onChange,
  renderSystemComponent,
}: {
  form: SpecialtyForm;
  data: Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
  renderSystemComponent: (id: string) => React.ReactNode;
}) {
  function update(fieldId: string, value: unknown) {
    onChange({ ...data, [fieldId]: value });
  }
  const unified = [
    ...form.sections.map(s => ({ type: "section" as const, item: s, pos: s.globalOrder ?? 0 })),
    ...(form.systemComponents ?? []).map(sc => ({ type: "sc" as const, item: sc, pos: sc.order })),
  ].sort((a, b) => a.pos - b.pos);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#4982CF18" }}>
          <FileText className="h-4 w-4" style={{ color: "#4982CF" }} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Specialty Form</p>
          <p className="text-sm font-black text-slate-800 leading-tight">{form.name}</p>
        </div>
      </div>
      {unified.map(entry => {
        if (entry.type === "sc") return renderSystemComponent(entry.item.id);
        const section = entry.item;
        return (
          <div key={section.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
            <p className="text-xs font-black text-slate-700">{section.title}</p>
            {section.description && (
              <p className="text-[11px] text-slate-500 mt-0.5">{section.description}</p>
            )}
          </div>
          <div className="px-4 py-3 space-y-3">
            {section.fields.map(field => (
              <div key={field.id}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">{field.label}</p>
                {field.type === "textarea" && (
                  <textarea
                    value={(data[field.id] as string) ?? ""}
                    onChange={e => update(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:outline-none focus:border-[#4982CF] focus:bg-white resize-none transition-colors"
                  />
                )}
                {(field.type === "text" || field.type === "number" || field.type === "date") && (
                  <input
                    type={field.type}
                    value={(data[field.id] as string) ?? ""}
                    onChange={e => update(field.id, e.target.value)}
                    placeholder={field.type !== "date" ? field.placeholder : undefined}
                    className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#4982CF] focus:bg-white transition-colors"
                  />
                )}
                {field.type === "checkbox-group" && (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {field.options.map(opt => {
                        const checked = ((data[field.id] as string[]) ?? []).includes(opt);
                        return (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer" onClick={() => {
                            const current = (data[field.id] as string[]) ?? [];
                            update(field.id, checked ? current.filter(x => x !== opt) : [...current, opt]);
                          }}>
                            <div className={`h-3.5 w-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? "bg-[#4982CF] border-[#4982CF]" : "border-slate-300 hover:border-[#4982CF]"}`}>
                              {checked && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <span className={`text-[11px] select-none ${checked ? "font-semibold text-[#4982CF]" : "text-slate-600"}`}>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                    {field.allowOther && (
                      <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => {
                          const current = (data[field.id] as string[]) ?? [];
                          const hasOther = current.includes("__other__");
                          update(field.id, hasOther ? current.filter(x => x !== "__other__") : [...current, "__other__"]);
                        }}>
                          <div className={`h-3.5 w-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${((data[field.id] as string[]) ?? []).includes("__other__") ? "bg-[#4982CF] border-[#4982CF]" : "border-slate-300 hover:border-[#4982CF]"}`}>
                            {((data[field.id] as string[]) ?? []).includes("__other__") && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <span className="text-[11px] italic text-slate-500 select-none">Other</span>
                        </label>
                        {((data[field.id] as string[]) ?? []).includes("__other__") && (
                          <input
                            value={(data[`${field.id}__other`] as string) ?? ""}
                            onChange={e => update(`${field.id}__other`, e.target.value)}
                            placeholder="Specify…"
                            className="ml-6 w-[calc(100%-1.5rem)] text-xs text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:outline-none focus:border-[#4982CF] focus:bg-white transition-colors"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
                {field.type === "radio-group" && (
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {field.options.map(opt => {
                      const selected = (data[field.id] as string) === opt;
                      return (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer" onClick={() => update(field.id, opt)}>
                          <div className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? "border-[#4982CF]" : "border-slate-300 hover:border-[#4982CF]"}`}>
                            {selected && <div className="h-2 w-2 rounded-full bg-[#4982CF]" />}
                          </div>
                          <span className={`text-[11px] select-none ${selected ? "font-semibold text-[#4982CF]" : "text-slate-600"}`}>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {field.type === "multiselect" && (
                  <MultiSelectFieldInput
                    options={field.options}
                    allowOther={field.allowOther}
                    placeholder={field.placeholder}
                    selectionStyle={field.selectionStyle}
                    selected={(data[field.id] as string[]) ?? []}
                    onChange={v => update(field.id, v)}
                  />
                )}
                {field.type === "dropdown" && (
                  <div className="relative">
                    <select
                      value={(data[field.id] as string) ?? ""}
                      onChange={e => update(field.id, e.target.value)}
                      className="w-full appearance-none text-xs text-slate-700 border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-slate-50 focus:outline-none focus:border-[#4982CF] focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="">{field.placeholder || "Select an option…"}</option>
                      {field.options.filter(Boolean).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                )}
                {field.type === "rating" && (() => {
                  const min = field.ratingMin ?? 1;
                  const max = field.ratingMax ?? 10;
                  const current = (data[field.id] as number) ?? null;
                  return (
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: Math.max(1, max - min + 1) }, (_, i) => min + i).map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => update(field.id, current === n ? null : n)}
                            className={`h-8 w-8 rounded-md border text-xs font-semibold transition-all ${current === n ? "bg-[#4982CF] border-[#4982CF] text-white shadow-sm" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-[#4982CF] hover:text-[#4982CF]"}`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      {current !== null && (
                        <p className="text-[10px] text-[#4982CF] font-semibold">Selected: {current}</p>
                      )}
                    </div>
                  );
                })()}
                {field.type === "yes-no" && (() => {
                  const current = data[field.id] as string | undefined;
                  return (
                    <div className="flex gap-2">
                      {(["Yes", "No"] as const).map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => update(field.id, current === opt ? undefined : opt)}
                          className={`flex items-center gap-1.5 rounded-full border px-5 py-1.5 text-xs font-semibold transition-all ${current === opt ? (opt === "Yes" ? "bg-[#4982CF] border-[#4982CF] text-white" : "bg-rose-500 border-rose-500 text-white") : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"}`}
                        >
                          {opt === "Yes" ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          {opt}
                        </button>
                      ))}
                    </div>
                  );
                })()}
                {field.type === "time" && (
                  <input
                    type="time"
                    value={(data[field.id] as string) ?? ""}
                    onChange={e => update(field.id, e.target.value)}
                    className="text-xs text-slate-700 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#4982CF] focus:bg-white transition-colors"
                  />
                )}
              </div>
            ))}
          </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface ClinicalNoteDrawerProps {
  entryId?: string;
  patientName: string;
  doctorId?: string;
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
  /** Label shown in the header when this is a follow-up note, e.g. "Note #2". */
  noteLabel?: string;
}

export function ClinicalNoteDrawer({ entryId, patientName, doctorId, faceSheetOpenedAt, awaitingLab = false, labResultsReady = false, signed = false, onSendToLab, onDiscardLab, onDoctorSign, onSaveAndClose, onClose, initialNote, onNoteChange, isAddendumMode = false, onAddendum, onCancel, noteLabel }: ClinicalNoteDrawerProps) {
  const [fullscreen,        setFullscreen]        = useState(false);
  const [isPrinting,        setIsPrinting]        = useState(false);
  const [note,              setNote]              = useState<NoteState>(() => initialNote ?? EMPTY_NOTE);
  const [_sfInit] = useState<{ forms: SpecialtyForm[]; activeFormId: string | null; mode: "soap" | "specialty" }>(() => {
    if (!doctorId) return { forms: [], activeFormId: null, mode: "soap" };
    const forms = loadForms().filter(f => f.status === "published" && f.assignedDoctorIds.includes(doctorId));
    const first = forms[0] ?? null;
    return { forms, activeFormId: first?.id ?? null, mode: forms.length > 0 ? "specialty" : "soap" };
  });
  const assignedForms = _sfInit.forms;
  const [activeFormId,      setActiveFormId]      = useState<string | null>(_sfInit.activeFormId);
  const assignedForm = activeFormId ? (assignedForms.find(f => f.id === activeFormId) ?? null) : null;
  const [activeMode,        setActiveMode]        = useState<"soap" | "specialty">(_sfInit.mode);
  const [hpiOpenComplaint,  setHpiOpenComplaint]  = useState<string | null>(null);
  const [hpiDoneComplaints, setHpiDoneComplaints] = useState<string[]>(() => initialNote?.hpiDoneComplaints ?? []);
  const [hpiSavedData,      setHpiSavedData]      = useState<Record<string, CoughState>>(() => initialNote?.hpiSavedData ?? {});
  const [rosDrawerOpen,     setRosDrawerOpen]     = useState(false);
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
  // ── Drawer stack: last entry is the top-most visible drawer ──────────────
  const [drawerStack,       setDrawerStack]       = useState<string[]>([]);
  function openDrawer(id: string) {
    setDrawerStack(s => [...s.filter(x => x !== id), id]);
  }
  function closeDrawer(id: string) {
    setDrawerStack(s => s.filter(x => x !== id));
  }
  function isOpen(id: string) { return drawerStack.includes(id); }
  const [templateOpen,      setTemplateOpen]      = useState(false);
  const [templateMode,      setTemplateMode]      = useState<"browse" | "save">("browse");
  const [discardConfirm,    setDiscardConfirm]    = useState(false);
  const [formDropOpen,      setFormDropOpen]      = useState(false);
  const formDropRef = useRef<HTMLDivElement>(null);
  const [aiScribeOpen,     setAiScribeOpen]      = useState(false);
  const [micCheckDone,     setMicCheckDone]      = useState(false);
  const [selectedMic,      setSelectedMic]       = useState("default");
  const [isTranscribing,   setIsTranscribing]    = useState(false);
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

  // Stamp the specialty form ID onto the note so the signed-visit summary can
  // look up the form structure (sections/field labels) from the form registry.
  useEffect(() => {
    if (assignedForm && activeMode === "specialty") {
      setNote(prev =>
        prev.specialtyFormId === assignedForm.id
          ? prev
          : { ...prev, specialtyFormId: assignedForm.id }
      );
    }
  }, [assignedForm, activeMode]);

  useEffect(() => {
    if (!formDropOpen) return;
    function handleClick(e: MouseEvent) {
      if (!formDropRef.current?.contains(e.target as Node)) setFormDropOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [formDropOpen]);


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
    setDiscardConfirm(false);

    // Find the most recent dispatched order (has sentAt). Auto-void it if not already
    // voided, and tag it returnedFromLab so the full order history is preserved.
    const lastSentIdx = [...labOrders].reverse().findIndex(o => !!o.sentAt);
    if (lastSentIdx !== -1) {
      const realIdx = labOrders.length - 1 - lastSentIdx;
      const target = labOrders[realIdx];
      const nextOrders = labOrders.map((o, i) => {
        if (i !== realIdx) return o;
        if (!o.voided) {
          // Auto-void: order was still in an active "Sent to Lab" state when cancelled
          return {
            ...o,
            voided: true,
            voidedAt: new Date().toISOString(),
            voidReason: "Ordered with error",
            returnedFromLab: true,
          };
        }
        // Already manually voided by doctor — only add the tag
        return { ...o, returnedFromLab: true };
      });
      setLabOrders(nextOrders);
      setNote(prev => ({ ...prev, labOrders: nextOrders }));

      // Propagate to Lab Panel localStorage so lab staff see the VOIDED state
      if (entryId && !target.voided) {
        const stored = readActiveLabOrder(entryId);
        const updated = nextOrders[realIdx];
        if (stored && updated?.sentAt && stored.sentAt === updated.sentAt) {
          saveActiveLabOrder(entryId, updated);
        }
      }
    }
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
    closeDrawer("diagnosis");
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
    closeDrawer("lab");
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

  // ── System component renderer ─────────────────────────────────────────────
  // Renders a single standard SOAP component section by ID, reusing all state
  // and handlers already present in this component. Used in specialty mode when
  // the form has system components enabled.

  function renderSystemComponent(id: string): React.ReactNode {
    switch (id) {
      case "chief-complaint":
        return (
          <Section key="sc-cc" title="Chief Complaint" icon={PenLine} color="#4982CF" required filled={note.chiefComplaints.length > 0}>
            <ChiefComplaintSelector
              selected={note.chiefComplaints}
              onChange={items => set("chiefComplaints", items)}
            />
          </Section>
        );

      case "hpi":
        return (
          <Section key="sc-hpi" title="History of Present Illness" icon={ClipboardList} color="#8b5cf6" filled={hpiDoneComplaints.length > 0}>
            {note.chiefComplaints.length === 0 ? (
              <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100">
                <ClipboardList className="h-4 w-4 text-slate-300 flex-shrink-0" />
                <p className="text-xs text-slate-400">Select Chief Complaints above — each will appear here as an HPI entry button.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Click a complaint to open its history template</p>
                <div className="flex flex-wrap gap-2">
                  {note.chiefComplaints.map((complaint, idx) => {
                    const isDone = hpiDoneComplaints.includes(complaint);
                    const isOpen = hpiOpenComplaint === complaint;
                    return (
                      <button
                        key={complaint}
                        onClick={() => setHpiOpenComplaint(isOpen ? null : complaint)}
                        className={["flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-all", isOpen ? "text-white border-[#8b5cf6] bg-[#8b5cf6] shadow-md" : isDone ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-slate-600 border-slate-200 bg-white hover:border-[#8b5cf6]/50"].join(" ")}>
                        <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isOpen ? "bg-white/25 text-white" : isDone ? "bg-emerald-200 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{idx + 1}</span>
                        {complaint}
                        {isDone ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> : <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />}
                      </button>
                    );
                  })}
                </div>
                {note.chiefComplaints.map(complaint => {
                  const isDone = hpiDoneComplaints.includes(complaint);
                  const saved  = hpiSavedData[complaint];
                  if (!isDone || !saved) return null;
                  return (
                    <div key={`summary-${complaint}`}>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-3 mb-1">{complaint} — History Summary</p>
                      <CoughSummary state={saved} />
                    </div>
                  );
                })}
                {hpiDoneComplaints.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1">{hpiDoneComplaints.length}/{note.chiefComplaints.length} complaints documented</p>
                )}
              </div>
            )}
          </Section>
        );

      case "allergies":
        return (
          <Section key="sc-allg" title="Allergies" icon={AlertCircle} color="#ef4444" required filled={note.allergies.length > 0}>
            <AllergySelector entries={note.allergies} onChange={entries => set("allergies", entries)} />
          </Section>
        );

      case "medical-history":
        return (
          <Section key="sc-mhx" title="Medical, Surgical, Family & Social History" icon={Users} color="#10b981" defaultOpen={false}
            filled={(note.pmhActive ?? []).length > 0 || (note.pmhResolved ?? []).length > 0 || (note.surgicalRows ?? []).length > 0 || (note.fhRows ?? []).length > 0}>
            <div className="mb-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />Past Medical History
              </p>
              <PastHistoryPanel active={note.pmhActive ?? []} resolved={note.pmhResolved ?? []} onActiveChange={v => set("pmhActive", v)} onResolvedChange={v => set("pmhResolved", v)} />
            </div>
            <div className="mb-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />Surgical History
              </p>
              <SurgicalHistoryPanel rows={note.surgicalRows ?? []} onChange={v => set("surgicalRows", v)} />
            </div>
            <div className="mb-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />Family History
              </p>
              <FamilyHistoryPanel rows={note.fhRows ?? []} genetic={note.fhGenetic ?? []} onRowsChange={v => set("fhRows", v)} onGeneticChange={v => set("fhGenetic", v)} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />Social History
              </p>
              <SocialHistoryPanel value={note.socialHistory ?? EMPTY_SOCIAL_HISTORY} onChange={v => set("socialHistory", v)} />
            </div>
          </Section>
        );

      case "ros":
        return (
          <Section key="sc-ros" title="Review of Systems" icon={Stethoscope} color="#0ea5e9" filled={Object.values(note.ros).some(arr => (arr?.length ?? 0) > 0)}>
            <RosSummary checked={note.ros} onEdit={() => setRosDrawerOpen(true)} />
          </Section>
        );

      case "physical-exam":
        return (
          <Section key="sc-pe" title="Physical Examination" icon={Stethoscope} color="#06b6d4" filled={peDoneSystemIds.length > 0}>
            <PeSystemSelector selected={note.peSystems} onChange={systems => set("peSystems", systems)} />
            <div className="mt-3">
              <PeChipsPanel
                systems={note.peSystems}
                doneSystemIds={peDoneSystemIds}
                savedDataMap={peSavedData}
                onOpenSystem={id => setPeOpenSystem(prev => prev === id ? null : id)}
                openSystemId={peOpenSystem}
              />
            </div>
          </Section>
        );

      case "poc-labs":
        return (
          <Section key="sc-poc" title="Point of Care Labs" icon={FlaskConical} color="#f59e0b" defaultOpen={false} filled={(note.pocTests ?? []).length > 0}>
            <PocLabsChipsPanel tests={note.pocTests ?? []} onOpen={() => setPocOpen(true)} />
          </Section>
        );

      case "diagnosis":
        return (
          <Section key="sc-dx" title="Diagnosis" icon={Tag} color="#6366f1" required filled={diagnosisDone}>
            {diagnosisDone && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center gap-1 mb-2 w-fit">
                <CheckCircle2 className="h-2.5 w-2.5" /> {diagnosisSaved.length} code{diagnosisSaved.length !== 1 ? "s" : ""}
              </span>
            )}
            <DiagnosisChipsPanel diagnoses={diagnosisSaved} onOpen={() => openDrawer("diagnosis")} />
          </Section>
        );

      case "lab-orders": {
        const hasActiveSent = awaitingLab && !activeOrderIsVoided;
        return (
          <Section key="sc-lab" title="Lab Orders" icon={FlaskConical} color="#f59e0b" filled={labDone}>
            {labOrders.length === 0 ? (
              <button
                onClick={() => { setLabDrawerMode("add"); openDrawer("lab"); setEditingOrderId(null); }}
                className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl bg-amber-50/60 border-2 border-dashed border-amber-200 text-amber-600 font-bold text-xs hover:border-amber-400 hover:bg-amber-50 transition-all">
                <Plus className="h-4 w-4 flex-shrink-0" />Order Lab Tests…
              </button>
            ) : (
              <div className="space-y-3">
                {labOrders.map((order, idx) => {
                  const isSent   = !!order.sentAt && !order.voided;
                  const isVoided = !!order.voided;
                  const isUnsent = !order.sentAt && !isVoided;
                  const isCurrentlyInLab = awaitingLab && !!activeLabSentAt && order.sentAt === activeLabSentAt;
                  return (
                    <div key={order.id ?? idx} className={["rounded-xl border px-3 py-2.5", isVoided ? "border-rose-100 bg-rose-50/40 opacity-70" : isSent ? "border-sky-200 bg-sky-50/40" : "border-slate-200 bg-white"].join(" ")}>
                      <div className="flex items-center justify-between mb-1.5 gap-1 flex-wrap">
                        <p className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isVoided ? "text-rose-400 line-through" : isSent ? "text-sky-600" : "text-slate-400"}`}>
                          Order {idx + 1}{idx === 0 ? " · Original" : " · Follow-up"}
                          {order.sentAt && <span className="normal-case font-medium tracking-normal" style={{ textDecoration: "none" }}>· {new Date(order.sentAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
                          {isVoided && <span className="ml-1 normal-case font-semibold tracking-normal text-rose-500" style={{ textDecoration: "none" }}>· VOIDED</span>}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                          {isSent && <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-600 border border-sky-200"><Send className="h-2.5 w-2.5" /> Sent to Lab</span>}
                          {isSent && (!isCurrentlyInLab || labResultsReady) && !order.returnedFromLab && (
                            <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300"><CheckCircle2 className="h-2.5 w-2.5" /> Results Complete</span>
                          )}
                          {order.returnedFromLab && <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300"><RotateCcw className="h-2.5 w-2.5" /> Returned from Lab</span>}
                          {isVoided && order.voidReason && <p className="text-[9px] text-rose-400 italic">Reason: {order.voidReason}</p>}
                          {isSent && isCurrentlyInLab && !labResultsReady && (
                            <button onClick={() => openVoidModal(order.id)} className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-100"><Trash2 className="h-2.5 w-2.5" /> Void</button>
                          )}
                          {isUnsent && !hasActiveSent && (
                            <button onClick={() => handleSendToLab(order.id)} className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-md bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100"><Send className="h-2.5 w-2.5" /> Send to Lab</button>
                          )}
                          {isUnsent && <button onClick={() => { setEditingOrderId(order.id); setLabDrawerMode("edit"); openDrawer("lab"); }} className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md text-amber-600 hover:text-amber-800 hover:bg-amber-50"><PenLine className="h-2.5 w-2.5" /> Edit</button>}
                          {isUnsent && <button onClick={() => handleRemoveOrder(order.id)} className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-2.5 w-2.5" /> Remove</button>}
                        </div>
                      </div>
                      <div className={isVoided ? "opacity-50 pointer-events-none" : ""}><LabChipsPanel order={order} /></div>
                    </div>
                  );
                })}
                <button onClick={() => { setLabDrawerMode("add"); openDrawer("lab"); setEditingOrderId(null); }} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-amber-200 text-amber-600 text-xs font-bold hover:border-amber-400 hover:bg-amber-50/40 transition-all">
                  <Plus className="h-3.5 w-3.5" /> Add Lab Order
                </button>
              </div>
            )}
          </Section>
        );
      }

      case "formulary":
        return (
          <Section key="sc-rx" title="Prescriptions / Formulary" icon={Pill} color="#8b5cf6" filled={(note.formulary?.medicines?.length ?? 0) > 0}>
            <FormularyChipsPanel data={note.formulary ?? EMPTY_FORMULARY} onOpen={() => openDrawer("formulary")} />
          </Section>
        );

      case "imaging":
        return (
          <Section key="sc-img" title="Imaging" icon={Scan} color="#0ea5e9" filled={(note.imaging?.orders?.length ?? 0) > 0}>
            <ImagingChipsPanel data={note.imaging ?? EMPTY_IMAGING} onOpen={() => openDrawer("imaging")} />
          </Section>
        );

      case "care-plan":
        return (
          <Section key="sc-cp" title="Care Plan" icon={ClipboardList} color="#10b981" filled={!!note.carePlan?.instructions?.trim()}>
            {note.carePlan?.instructions?.trim() ? (
              <p className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 leading-relaxed whitespace-pre-wrap select-text">
                {note.carePlan.instructions}
              </p>
            ) : (
              <p className="w-full text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl px-3 py-2.5 italic">
                No care plan recorded.
              </p>
            )}
          </Section>
        );

      case "referrals":
        return (
          <Section key="sc-ref" title="Referrals" icon={Users} color="#6366f1" filled={(note.referrals?.referrals?.length ?? 0) > 0}>
            <ReferralChipsPanel data={note.referrals ?? EMPTY_REFERRAL_DATA} onOpen={() => openDrawer("referral")} />
          </Section>
        );

      case "patient-goals":
        return (
          <Section key="sc-pg" title="Patient Goals" icon={CheckCircle2} color="#ec4899" filled={(note.patientGoals?.goals?.length ?? 0) > 0}>
            <PatientGoalsChipsPanel data={note.patientGoals ?? EMPTY_PATIENT_GOALS} onOpen={() => openDrawer("patientGoals")} />
          </Section>
        );

      default:
        return null;
    }
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

          {/* Left: AI Scribing + Template */}
          <button
            onClick={() => {
              if (isTranscribing) return;
              setAiScribeOpen(true);
            }}
            className={[
              "group relative flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-colors flex-shrink-0",
              isTranscribing
                ? "border-violet-300 bg-violet-50 text-violet-600"
                : "border-slate-200 text-slate-400 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-500",
            ].join(" ")}>
            <Mic className="h-3.5 w-3.5" />
            <Sparkles className={`h-2.5 w-2.5 ${isTranscribing ? "text-violet-500" : "text-violet-400"}`} />
            {isTranscribing && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            )}
            <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[10px] font-semibold text-white shadow-lg z-50">
              {isTranscribing ? "Already transcribing" : "AI Scribing"}
            </span>
          </button>

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

          {/* Form selector dropdown — shown when ≥1 specialty form is assigned */}
          {assignedForms.length > 0 && (
            <div ref={formDropRef} className="relative flex-shrink-0">
              <button
                onClick={() => setFormDropOpen(o => !o)}
                className="flex items-center gap-1.5 text-[11px] font-bold pl-2.5 pr-2.5 py-1.5 rounded-lg border transition-all"
                style={activeMode === "specialty"
                  ? { backgroundColor: "#4982CF15", borderColor: "#4982CF50", color: "#4982CF" }
                  : { backgroundColor: "white", borderColor: "#e2e8f0", color: "#64748b" }}>
                {activeMode === "specialty" && assignedForm
                  ? (assignedForm.name.length > 22 ? assignedForm.name.slice(0, 20) + "…" : assignedForm.name)
                  : "SOAP Note"}
                <ChevronDown
                  className={`h-3 w-3 flex-shrink-0 transition-transform duration-150 ${formDropOpen ? "rotate-180" : ""}`}
                />
              </button>
              {formDropOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden min-w-[160px]">
                  <button
                    onClick={() => { setActiveMode("soap"); setFormDropOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-[11px] font-bold transition-colors ${
                      activeMode === "soap" ? "bg-slate-50 text-slate-800" : "text-slate-600 hover:bg-slate-50"
                    }`}>
                    SOAP Note
                  </button>
                  {assignedForms.map(f => (
                    <button
                      key={f.id}
                      onClick={() => { setActiveFormId(f.id); setActiveMode("specialty"); setFormDropOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-[11px] font-bold transition-colors ${
                        activeMode === "specialty" && activeFormId === f.id
                          ? "bg-blue-50 text-[#4982CF]"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}>
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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
          {noteLabel && (
            <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black text-white" style={{ backgroundColor: "#4982CF" }}>
              {noteLabel}
            </span>
          )}
        </div>

        {/* ── AI transcription indicator ─────────────────────────────────── */}
        {isTranscribing && (
          <div className="flex items-center gap-2.5 px-4 py-2 bg-violet-50 border-b border-violet-200 flex-shrink-0">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <Sparkles className="h-3 w-3 text-violet-500 flex-shrink-0" />
            <p className="text-[11px] font-bold text-violet-700 flex-1">AI is listening and transcribing…</p>
            <button
              onClick={() => setIsTranscribing(false)}
              className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-white border border-violet-200 text-violet-600 hover:bg-violet-100 transition-colors flex-shrink-0">
              <StopCircle className="h-3 w-3" /> Stop
            </button>
          </div>
        )}

        {/* ── Scrollable content ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

          {activeMode === "specialty" && assignedForm && (
            <SpecialtyFormPanel
              form={assignedForm}
              data={note.specialtyFormData ?? {}}
              onChange={data => set("specialtyFormData", data)}
              renderSystemComponent={renderSystemComponent}
            />
          )}

          <div className={activeMode === "specialty" && assignedForm ? "hidden" : ""}>
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
            filled={Object.values(note.ros).some(arr => (arr?.length ?? 0) > 0)}>
            <RosSummary
              checked={note.ros}
              onEdit={() => setRosDrawerOpen(true)}
            />
          </Section>

          {/* 5b. Physical Examination (independent from ROS) */}
          <Section
            title="Physical Examination"
            icon={Stethoscope} color="#06b6d4"
            filled={peDoneSystemIds.length > 0}>
            <PeSystemSelector
              selected={note.peSystems}
              onChange={systems => set("peSystems", systems)}
            />
            <div className="mt-3">
              <PeChipsPanel
                systems={note.peSystems}
                doneSystemIds={peDoneSystemIds}
                savedDataMap={peSavedData}
                onOpenSystem={id => setPeOpenSystem(prev => prev === id ? null : id)}
                openSystemId={peOpenSystem}
              />
            </div>
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
                onOpen={() => openDrawer("diagnosis")}
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
                  onClick={() => { setLabDrawerMode("add"); openDrawer("lab"); setEditingOrderId(null); }}
                  className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl bg-amber-50/60 border-2 border-dashed border-amber-200 text-amber-600 font-bold text-xs hover:border-amber-400 hover:bg-amber-50 transition-all">
                  <Plus className="h-4 w-4 flex-shrink-0" />
                  Order Lab Tests…
                </button>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    // An order is blocked from sending only while the patient is actively in the lab
                    // AND the active order has not been voided. Voiding the in-flight order
                    // (activeOrderIsVoided=true) re-enables sending a new order immediately.
                    const hasActiveSent = awaitingLab && !activeOrderIsVoided;
                    return labOrders.map((order, idx) => {
                      const isSent   = !!order.sentAt && !order.voided;
                      const isVoided = !!order.voided;
                      const isUnsent = !order.sentAt && !isVoided;
                      // True only for the specific order currently being processed at the lab.
                      // Older sent orders from prior rounds have a different sentAt value.
                      const isCurrentlyInLab = awaitingLab && !!activeLabSentAt && order.sentAt === activeLabSentAt;
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
                              {/* Results Complete badge — shown when this specific order's round is done.
                                  Uses isCurrentlyInLab to avoid clearing the badge on prior-round orders
                                  when a second order is dispatched (labResultsReady would be false then). */}
                              {isSent && (!isCurrentlyInLab || labResultsReady) && !order.returnedFromLab && (
                                <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Results Complete
                                </span>
                              )}
                              {/* Returned from Lab badge — shown when Cancel Lab Queue was used */}
                              {order.returnedFromLab && (
                                <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
                                  <RotateCcw className="h-2.5 w-2.5" /> Returned from Lab
                                </span>
                              )}
                              {/* Void reason text */}
                              {isVoided && order.voidReason && (
                                <p className="text-[9px] text-rose-400 italic">Reason: {order.voidReason}</p>
                              )}
                              {/* Void button — only for the order currently in-flight at the lab, not prior completed orders */}
                              {isSent && isCurrentlyInLab && !labResultsReady && (
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
                                  onClick={() => { setEditingOrderId(order.id); setLabDrawerMode("edit"); openDrawer("lab"); }}
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
                    onClick={() => { setLabDrawerMode("add"); openDrawer("lab"); setEditingOrderId(null); }}
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
                onOpen={() => openDrawer("formulary")}
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
                onOpen={() => openDrawer("imaging")}
              />
            </div>

            {/* 7e. Procedure Orders */}
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
                onOpen={() => openDrawer("procOrders")}
              />
            </div>

            {/* 7f. Referrals */}
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
                onOpen={() => openDrawer("referral")}
              />
            </div>

            {/* 7g. Patient Goals */}
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
                onOpen={() => openDrawer("patientGoals")}
              />
            </div>

            {/* 7h. Health Education */}
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
                onOpen={() => openDrawer("healthEd")}
              />
            </div>

            {/* 7i. Care Plan */}
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <ClipboardList className="h-3 w-3 text-emerald-500" />
                Care Plan
              </p>
              {note.carePlan?.instructions?.trim() ? (
                <p className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 leading-relaxed whitespace-pre-wrap select-text">
                  {note.carePlan.instructions}
                </p>
              ) : (
                <p className="w-full text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl px-3 py-2.5 italic">
                  No care plan recorded.
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

          </div>{/* ─ end SOAP sections ─ */}

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
            disabled={isPrinting}
            onClick={() => {
              const ts = faceSheetOpenedAt ? new Date(faceSheetOpenedAt) : new Date();
              setIsPrinting(true);
              void printHealthRecord({
                patient: { name: patientName },
                noteRow: {
                  date: ts.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                  time: ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
                  type: noteLabel ?? (assignedForm ? assignedForm.name : "Consultation Note"),
                  doctor: doctorId ?? "",
                },
                visitType: noteLabel ?? (assignedForm ? assignedForm.name : "Consultation Note"),
                noteKind: assignedForm
                  ? { kind: "live", noteState: note, form: assignedForm }
                  : { kind: "live", noteState: note },
              }).finally(() => setIsPrinting(false));
            }}
            className="h-9 px-4 text-xs font-bold gap-2 border-slate-200 text-slate-500 hover:bg-slate-50 flex-shrink-0">
            <Printer className="h-3.5 w-3.5" />
            {isPrinting ? "Generating…" : "Print to Review"}
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

        {/* ── ROS Drawer (slides in from right within the panel) ── */}
        {rosDrawerOpen && (
          <RosDrawer
            checked={note.ros}
            onChange={v => set("ros", v)}
            onClose={() => setRosDrawerOpen(false)}
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

        {/* ── Stacked A&P Drawers ── rendered in stack order; last = on top ── */}
        {drawerStack.map(id => {
          switch (id) {
            case "diagnosis": return (
              <DiagnosisDrawer key="diagnosis"
                isDone={diagnosisDone}
                savedData={diagnosisSaved}
                onSave={handleDiagnosisSave}
                onClose={() => closeDrawer("diagnosis")}
              />
            );
            case "formulary": return (
              <FormularyDrawer key="formulary"
                savedData={note.formulary ?? EMPTY_FORMULARY}
                patientAllergies={note.allergies ?? []}
                onSave={v => set("formulary", v)}
                onClose={() => closeDrawer("formulary")}
              />
            );
            case "imaging": return (
              <ImagingDrawer key="imaging"
                savedData={note.imaging ?? EMPTY_IMAGING}
                onSave={v => set("imaging", v)}
                onClose={() => closeDrawer("imaging")}
              />
            );
            case "healthEd": return (
              <HealthEdDrawer key="healthEd"
                savedData={note.healthEd ?? EMPTY_HEALTH_ED}
                onSave={v => set("healthEd", v)}
                onClose={() => closeDrawer("healthEd")}
              />
            );
            case "patientGoals": return (
              <PatientGoalsDrawer key="patientGoals"
                savedData={note.patientGoals ?? EMPTY_PATIENT_GOALS}
                onSave={v => set("patientGoals", v)}
                onClose={() => closeDrawer("patientGoals")}
              />
            );
            case "procOrders": return (
              <ProcedureOrdersDrawer key="procOrders"
                savedData={note.procedureOrders ?? EMPTY_PROCEDURE_ORDERS}
                onSave={v => set("procedureOrders", v)}
                onClose={() => closeDrawer("procOrders")}
              />
            );
            case "referral": return (
              <ReferralDrawer key="referral"
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
                onClose={() => closeDrawer("referral")}
              />
            );
            case "lab": return labDrawerMode ? (
              <LabDrawer key="lab"
                mode={labDrawerMode}
                savedData={
                  labDrawerMode === "edit"
                    ? (labOrders.find(o => o.id === editingOrderId) ?? null)
                    : (labOrders.find(o => !!o.sentAt && !o.voided) ?? null)
                }
                awaitingLab={awaitingLab && !activeOrderIsVoided}
                labResultsReady={labResultsReady && !activeOrderIsVoided}
                onSave={handleLabSave}
                onClose={() => { setLabDrawerMode(null); closeDrawer("lab"); setEditingOrderId(null); }}
              />
            ) : null;
            default: return null;
          }
        })}


        {/* ── POC Labs Drawer ── */}
        {pocOpen && (
          <PocLabsDrawer
            savedTests={note.pocTests ?? []}
            onSave={v => set("pocTests", v)}
            onClose={() => setPocOpen(false)}
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

        {/* ── Care Plan Drawer ── (temporarily hidden) */}

        {/* ── AI Scribing Drawer ── */}
        {aiScribeOpen && (
          <div className="absolute inset-y-0 right-0 w-[68%] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-20">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
              <button
                onClick={() => { setAiScribeOpen(false); setMicCheckDone(false); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">SOAP Note</p>
                <p className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" /> AI Scribing
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">

              {/* Welcome hero */}
              <div className="flex flex-col items-center text-center pt-2 pb-2">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                  <Mic className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-base font-black text-slate-800 mb-1.5">Welcome to AI Scribing</h2>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-[240px]">
                  Speak naturally during your consultation. The AI will transcribe and structure your clinical note in real time.
                </p>
              </div>

              {/* Microphone Check */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">Microphone Check</p>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    micCheckDone ? "bg-emerald-100" : "bg-white border border-slate-200"
                  }`}>
                    {micCheckDone
                      ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                      : <Radio className="h-4 w-4 text-slate-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-700">
                      {micCheckDone ? "Microphone ready" : "Test your microphone"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {micCheckDone ? "Input detected successfully" : "Run a quick check before starting"}
                    </p>
                  </div>
                  {micCheckDone ? (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex-shrink-0">
                      ✓ Ready
                    </span>
                  ) : (
                    <button
                      onClick={() => setMicCheckDone(true)}
                      className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors flex-shrink-0">
                      Test
                    </button>
                  )}
                </div>
              </div>

              {/* Microphone Selection */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">Select Microphone</p>
                <div className="relative">
                  <select
                    value={selectedMic}
                    onChange={e => setSelectedMic(e.target.value)}
                    className="w-full appearance-none text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 pr-8 outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20 transition-all">
                    <option value="default">Default — System Microphone</option>
                    <option value="builtin">Built-in Microphone</option>
                    <option value="external">External Microphone</option>
                    <option value="headset">Headset Microphone</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Start Listening */}
              <button
                onClick={() => { setIsTranscribing(true); setAiScribeOpen(false); }}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-black text-sm text-white shadow-md transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-400" />
                </span>
                Start Listening
              </button>

            </div>
          </div>
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
                  <p className="text-sm font-bold text-slate-800">
                    {awaitingLab && !labResultsReady ? "What would you like to discard?" : "Discard this SOAP note?"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {awaitingLab && !labResultsReady
                      ? "Select an option below — this cannot be undone."
                      : "This will clear HPI, PE, and diagnoses — this cannot be undone."}
                  </p>
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
                      Clears HPI, PE, and diagnoses — lab orders are not affected.
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
                        Removes the patient from the lab queue — SOAP note content is preserved.
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
