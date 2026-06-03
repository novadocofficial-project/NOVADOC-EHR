import React, { useState, useMemo, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Calendar, ChevronLeft, ChevronRight, ChevronDown, Plus, Printer,
  Maximize2, Minimize2, X, Search, User, Phone, AlertCircle,
  BookOpen, CheckCircle2, Clock, Edit2, Eye, FileText, Stethoscope,
  Repeat, AlertTriangle, LayoutGrid, Columns2, RefreshCw,
  Hash, Check, ArrowRight, Pencil, CalendarDays, UserPlus,
  Banknote, Shield, Building2, Heart, FileSignature, Receipt, Activity,
  ClipboardList, PenLine, Minus,
} from "lucide-react";
import { ApptFaceSheet } from "@/pages/ApptFaceSheet";
import { ApptNursingDrawer, type NurseCategory } from "@/pages/ApptNursingDrawer";
import { BillingContent, ReceiptInfo, printThermalReceipt } from "@/pages/FrontDeskUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { QueueAppHeader } from "@/pages/QueuePageLayout";
import { useAppointmentDoctors } from "@/hooks/useAppointmentDoctors";
import { hasSoapDraft, readSignedRecords } from "@/hooks/useSoapNoteDraft";
import { useAppointments, type Appointment, type ApptStatus } from "@/hooks/useAppointments";
import { useApptInvoices } from "@/hooks/useApptInvoices";
import { usePatients, getPatientIdByMrn } from "@/hooks/usePatients";
import { useRegConfig, type RegField } from "@/hooks/useRegConfig";
import { useToast } from "@/hooks/use-toast";
import type { Doctor } from "@/pages/DoctorsModule";
import type { Patient } from "@/pages/QueuePageLayout";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

function todayStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function getDayName(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
}

function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateFull(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function getWeekDays(dateStr: string): string[] {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = dt.getDay(); // 0 = Sun
  const monday = new Date(y, m - 1, d - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  });
}

function getMonthDays(dateStr: string): string[] {
  const [y, m] = dateStr.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const last  = new Date(y, m, 0).getDate();
  const startDow = first.getDay(); // 0=Sun, need Mon-start grid
  const offset = startDow === 0 ? 6 : startDow - 1;
  const cells: string[] = [];
  for (let i = -offset; i < last; i++) {
    const dt = new Date(y, m - 1, 1 + i);
    cells.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    cells.push(addDays(last, 1));
  }
  return cells;
}

interface SlotBlock {
  timingId: string;
  start: string;
  end: string;
  allowMultiple: boolean;
}

function generateSlots(timing: Doctor["timings"][number], dateStr: string): SlotBlock[] {
  if (getDayName(dateStr) !== timing.day) return [];
  const slots: SlotBlock[] = [];
  const [eh, em] = timing.endTime.split(":").map(Number);
  const endTotal = eh * 60 + em;
  let curr = timing.startTime.split(":").map(Number).reduce((a, b, i) => i === 0 ? b * 60 : a + b, 0);
  while (curr < endTotal) {
    const slotEnd = Math.min(curr + timing.slotDuration, endTotal);
    slots.push({
      timingId: timing.id,
      start: `${String(Math.floor(curr / 60)).padStart(2, "0")}:${String(curr % 60).padStart(2, "0")}`,
      end:   `${String(Math.floor(slotEnd / 60)).padStart(2, "0")}:${String(slotEnd % 60).padStart(2, "0")}`,
      allowMultiple: timing.allowMultiple,
    });
    curr += timing.slotDuration;
  }
  return slots;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ApptStatus, { label: string; text: string; bg: string; dot: string }> = {
  booked:      { label: "Booked",      text: "text-slate-700",   bg: "bg-slate-100 border-slate-400",    dot: "bg-slate-500"    },
  confirmed:   { label: "Confirmed",   text: "text-emerald-800", bg: "bg-emerald-100 border-emerald-500", dot: "bg-emerald-500"  },
  checked_in:  { label: "Checked In",  text: "text-blue-800",    bg: "bg-blue-100 border-blue-500",      dot: "bg-blue-500"     },
  cancelled:   { label: "Cancelled",   text: "text-red-700",     bg: "bg-red-100 border-red-500",        dot: "bg-red-500"      },
  no_show:     { label: "No Show",     text: "text-orange-700",  bg: "bg-orange-100 border-orange-500",  dot: "bg-orange-500"   },
  rescheduled: { label: "Rescheduled", text: "text-purple-800",  bg: "bg-purple-100 border-purple-500",  dot: "bg-purple-500"   },
  checked_out: { label: "Checked Out", text: "text-slate-800",   bg: "bg-slate-200 border-slate-500",    dot: "bg-slate-600"    },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as ApptStatus[];

const PRIORITY_CONFIG = {
  normal:    { label: "Normal",    text: "text-slate-600",  bg: "bg-slate-100"   },
  urgent:    { label: "Urgent",    text: "text-amber-700",  bg: "bg-amber-50"    },
  emergency: { label: "Emergency", text: "text-red-700",    bg: "bg-red-50"      },
};

// ─── Right Drawer Shell ───────────────────────────────────────────────────────

interface RightDrawerProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function RightDrawer({ title, subtitle, onClose, children, footer }: RightDrawerProps) {
  const [fs, setFs] = useState(false);
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col border-l border-slate-200 transition-all duration-300 ${fs ? "w-full" : "w-[42%] min-w-[520px]"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900">{title}</p>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setFs(p => !p)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
              {fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex-shrink-0 border-t border-slate-100 px-5 py-4">{footer}</div>}
      </div>
    </>
  );
}

// ─── Booking Form State ───────────────────────────────────────────────────────

interface BookingForm {
  doctorId: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  patientName: string;
  patientMrn: string;
  patientPhone: string;
  type: string;
  specialty: string;
  priority: "normal" | "urgent" | "emergency";
  contagious: boolean;
  contagiousNote: string;
  repeat: boolean;
  repeatType: "daily" | "weekly" | "monthly" | "custom";
  repeatNote: string;
  comments: string;
  referralProvider?: string;
}

function emptyForm(init?: Partial<BookingForm>): BookingForm {
  return {
    doctorId: "", date: todayStr(), slotStart: "", slotEnd: "",
    patientName: "", patientMrn: "", patientPhone: "",
    type: "", specialty: "", priority: "normal",
    contagious: false, contagiousNote: "",
    repeat: false, repeatType: "weekly", repeatNote: "",
    comments: "", ...init,
  };
}

// ─── Appointment Registration Sub-Drawer ─────────────────────────────────────

interface ApptRegDrawerProps {
  onRegister: (patient: Patient) => void;
  onClose: () => void;
}

function ApptRegDrawer({ onRegister, onClose }: ApptRegDrawerProps) {
  const { config } = useRegConfig();
  const [values, setValues] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const sigRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const mrBanner = useRef("MR-" + Math.floor(45100 + Math.random() * 900)).current;

  function setVal(id: string, v: string) { setValues(p => ({ ...p, [id]: v })); }

  const orderedSections = [...config.sections]
    .filter(s => s.enabled)
    .sort((a, b) => a.workflowOrder - b.workflowOrder);

  interface RegStepDef { id: string; name: string; sectionType: string; sectionId: string; }
  const steps: RegStepDef[] = [];
  const basicInfoSec = orderedSections.find(s => s.sectionType === "basic-info");
  steps.push({ id: "basic-info", name: "Basic Info", sectionType: "basic-info", sectionId: basicInfoSec?.id ?? "" });
  for (const sec of orderedSections) {
    if (sec.sectionType === "demographics" && sec.fields.some(f => f.enabled))
      steps.push({ id: sec.id, name: sec.name, sectionType: "demographics", sectionId: sec.id });
  }
  for (const sec of orderedSections) {
    if (sec.sectionType === "custom" && (sec.fields.some(f => f.enabled) || sec.signatureRequired))
      steps.push({ id: sec.id, name: sec.name, sectionType: "custom", sectionId: sec.id });
  }

  const safeStep = Math.min(currentStep, steps.length - 1);
  const isLastStep = safeStep === steps.length - 1;
  const stepDef = steps[safeStep];
  const multiStep = steps.length > 1;

  const patientType = values["_patient_type"] ?? (config.patientTypes.find(t => t.enabled)?.id ?? "cash");
  const activeType = config.patientTypes.find(t => t.id === patientType && t.enabled);
  const welfareForm = activeType?.welfareFormId ? config.welfareForms.find(f => f.id === activeType.welfareFormId) : null;
  const conditionalFieldIds = basicInfoSec?.conditionalRules.flatMap(r => r.showFieldIds) ?? [];
  const enabledTypes = config.patientTypes.filter(t => t.enabled);

  function canAdvance(stepIdx: number): boolean {
    const step = steps[stepIdx];
    if (!step) return true;
    const required: string[] = [];
    if (step.sectionType === "basic-info") {
      if (basicInfoSec) {
        basicInfoSec.fields.filter(f => f.enabled && f.required && !conditionalFieldIds.includes(f.id)).forEach(f => required.push(f.id));
        basicInfoSec.conditionalRules.forEach(rule => {
          if (rule.triggerValues.includes(values[rule.triggerFieldId] ?? ""))
            basicInfoSec.fields.filter(f => rule.showFieldIds.includes(f.id) && f.enabled && f.required).forEach(f => required.push(f.id));
        });
      }
      (activeType?.extraFields ?? []).filter(f => f.enabled && f.required).forEach(f => required.push(f.id));
    } else {
      const sec = config.sections.find(s => s.id === step.sectionId);
      if (sec) {
        const condIds = sec.conditionalRules.flatMap(r => r.showFieldIds);
        const visIds = sec.conditionalRules.flatMap(rule => rule.triggerValues.includes(values[rule.triggerFieldId] ?? "") ? rule.showFieldIds : []);
        sec.fields.filter(f => f.enabled && f.required && f.type !== "signature" && f.type !== "file" && (!condIds.includes(f.id) || visIds.includes(f.id))).forEach(f => required.push(f.id));
      }
    }
    return required.every(id => !!(values[id]));
  }

  const canSubmit = (() => {
    const required: string[] = [];
    if (basicInfoSec) {
      basicInfoSec.fields.filter(f => f.enabled && f.required && !conditionalFieldIds.includes(f.id)).forEach(f => required.push(f.id));
      basicInfoSec.conditionalRules.forEach(rule => {
        if (rule.triggerValues.includes(values[rule.triggerFieldId] ?? ""))
          basicInfoSec.fields.filter(f => rule.showFieldIds.includes(f.id) && f.enabled && f.required).forEach(f => required.push(f.id));
      });
    }
    (activeType?.extraFields ?? []).filter(f => f.enabled && f.required).forEach(f => required.push(f.id));
    config.sections.filter(s => s.sectionType === "demographics" && s.enabled).forEach(sec =>
      sec.fields.filter(f => f.enabled && f.required && f.type !== "signature" && f.type !== "file").forEach(f => required.push(f.id))
    );
    config.sections.filter(s => s.sectionType === "custom" && s.enabled).forEach(sec => {
      const condIds = sec.conditionalRules.flatMap(r => r.showFieldIds);
      const visIds = sec.conditionalRules.flatMap(rule => rule.triggerValues.includes(values[rule.triggerFieldId] ?? "") ? rule.showFieldIds : []);
      sec.fields.filter(f => f.enabled && f.required && f.type !== "signature" && f.type !== "file" && (!condIds.includes(f.id) || visIds.includes(f.id))).forEach(f => required.push(f.id));
    });
    return required.every(id => !!(values[id]));
  })();

  function renderField(field: RegField): React.ReactNode {
    const val = values[field.id] ?? "";
    const lbl = (
      <label className="text-xs font-semibold text-slate-600 mb-1 block">
        {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    );
    if (field.type === "text" || field.type === "number") {
      return <div key={field.id}>{lbl}<Input type={field.type === "number" ? "number" : "text"} placeholder={field.placeholder} value={val} onChange={e => setVal(field.id, e.target.value)} /></div>;
    }
    if (field.type === "date") {
      return <div key={field.id}>{lbl}<div className="relative"><CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" /><Input className="pl-8" type="date" value={val} onChange={e => setVal(field.id, e.target.value)} /></div></div>;
    }
    if (field.type === "textarea") {
      return <div key={field.id}>{lbl}<textarea className="w-full px-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-ring h-16" placeholder={field.placeholder} value={val} onChange={e => setVal(field.id, e.target.value)} /></div>;
    }
    if (field.type === "dropdown") {
      return <div key={field.id}>{lbl}<Select value={val || ""} onValueChange={v => setVal(field.id, v)}><SelectTrigger><SelectValue placeholder={field.placeholder || "Select..."} /></SelectTrigger><SelectContent>{(field.options ?? []).map(opt => <SelectItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</SelectItem>)}</SelectContent></Select></div>;
    }
    if (field.type === "signature") {
      return (
        <div key={field.id}>
          {lbl}
          <div className="rounded-xl border-2 border-dashed border-red-200 bg-white overflow-hidden">
            <canvas
              ref={el => { sigRefs.current[field.id] = el; }}
              width={560} height={100}
              className="w-full touch-none cursor-crosshair"
              onMouseDown={e => {
                const cv = sigRefs.current[field.id]; if (!cv) return;
                setDrawing(true);
                const r = cv.getBoundingClientRect();
                const ctx = cv.getContext("2d")!;
                ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
              }}
              onMouseMove={e => {
                if (!drawing) return;
                const cv = sigRefs.current[field.id]; if (!cv) return;
                const r = cv.getBoundingClientRect();
                const ctx = cv.getContext("2d")!;
                ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2; ctx.lineCap = "round";
                ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.stroke();
              }}
              onMouseUp={() => setDrawing(false)}
              onMouseLeave={() => setDrawing(false)}
            />
          </div>
          <button onClick={() => { const cv = sigRefs.current[field.id]; if (cv) cv.getContext("2d")!.clearRect(0, 0, cv.width, cv.height); }}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1 mt-1">
            <RefreshCw className="h-3 w-3" /> Clear
          </button>
        </div>
      );
    }
    if (field.type === "checkbox") {
      const checked = (val || "").split(",").filter(Boolean);
      return (
        <div key={field.id}>
          {lbl}
          <div className="space-y-1.5">
            {(field.options ?? []).map(opt => (
              <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                <input type="checkbox" checked={checked.includes(opt)}
                  onChange={e => { const next = e.target.checked ? [...checked, opt] : checked.filter(x => x !== opt); setVal(field.id, next.join(",")); }}
                  className="h-4 w-4 rounded border-slate-300 accent-[#4982CF]" />
                {opt}
              </label>
            ))}
          </div>
        </div>
      );
    }
    if (field.type === "radio") {
      return (
        <div key={field.id}>
          {lbl}
          <div className="space-y-1.5">
            {(field.options ?? []).map(opt => (
              <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                <input type="radio" name={field.id} value={opt} checked={val === opt}
                  onChange={() => setVal(field.id, opt)} className="h-4 w-4 border-slate-300 accent-[#4982CF]" />
                {opt}
              </label>
            ))}
          </div>
        </div>
      );
    }
    if (field.type === "file") {
      return <div key={field.id}>{lbl}<input type="file" className="w-full text-sm cursor-pointer file:h-9 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold" /></div>;
    }
    return null;
  }

  const SHORT_TYPES = new Set<string>(["text", "number", "date", "dropdown"]);
  function renderFieldsInGrid(fields: RegField[], keyPrefix = ""): React.ReactNode[] {
    const rows: React.ReactNode[] = [];
    let i = 0;
    while (i < fields.length) {
      const f = fields[i], next = fields[i + 1];
      if (SHORT_TYPES.has(f.type) && next && SHORT_TYPES.has(next.type)) {
        rows.push(<div key={`${keyPrefix}g-${i}`} className="grid grid-cols-2 gap-3">{renderField(f)}{renderField(next)}</div>);
        i += 2;
      } else {
        rows.push(<div key={`${keyPrefix}s-${i}`}>{renderField(f)}</div>);
        i++;
      }
    }
    return rows;
  }

  const PT_ICONS: Record<string, React.ReactNode> = {
    cash: <Banknote className="h-4 w-4" />,
    insurance: <Shield className="h-4 w-4" />,
    corporate: <Building2 className="h-4 w-4" />,
    welfare: <Heart className="h-4 w-4" />,
  };

  function renderStepContent(): React.ReactNode {
    if (!stepDef) return null;
    if (stepDef.sectionType === "basic-info") {
      const blocks: React.ReactNode[] = [];
      if (basicInfoSec) {
        const condIds = basicInfoSec.conditionalRules.flatMap(r => r.showFieldIds);
        const normalFlds = basicInfoSec.fields.filter(f => f.enabled && !condIds.includes(f.id));
        blocks.push(
          <React.Fragment key="bi-fields">
            {renderFieldsInGrid(normalFlds, basicInfoSec.id)}
            {basicInfoSec.conditionalRules.map(rule => {
              const tv = values[rule.triggerFieldId] ?? "";
              if (!rule.triggerValues.includes(tv)) return null;
              const condFlds = basicInfoSec.fields.filter(f => rule.showFieldIds.includes(f.id) && f.enabled);
              if (!condFlds.length) return null;
              return (
                <div key={rule.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{tv} Details</p>
                  <div className="grid grid-cols-2 gap-3">{condFlds.map(f => renderField(f))}</div>
                </div>
              );
            })}
          </React.Fragment>
        );
      }
      if (enabledTypes.length > 0) {
        blocks.push(
          <div key="__pt__">
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Type of Patient</label>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${enabledTypes.length}, 1fr)` }}>
              {enabledTypes.map(t => (
                <button key={t.id} onClick={() => setVal("_patient_type", t.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-bold transition-all ${patientType === t.id ? "text-white" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  style={patientType === t.id ? { borderColor: t.color, backgroundColor: t.color } : undefined}>
                  {PT_ICONS[t.id] ?? <User className="h-4 w-4" />}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        );
      }
      if (activeType && activeType.extraFields.filter(f => f.enabled).length > 0) {
        blocks.push(
          <div key="__te__" className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{activeType.label} Details</p>
            {renderFieldsInGrid(activeType.extraFields.filter(f => f.enabled), "te-")}
          </div>
        );
      }
      if (patientType === "welfare" && welfareForm) {
        const wfCondIds = (welfareForm.conditionalRules ?? []).flatMap(r => r.showFieldIds);
        const wfNormFlds = welfareForm.fields.filter(f => f.enabled && !wfCondIds.includes(f.id));
        blocks.push(
          <div key="__wf__" className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-red-500" />
              <p className="text-sm font-bold text-red-700">Welfare Form — {welfareForm.name}</p>
            </div>
            {wfNormFlds.map(f => renderField(f))}
            {(welfareForm.conditionalRules ?? []).map(rule => {
              const tv = values[rule.triggerFieldId] ?? "";
              if (!rule.triggerValues.includes(tv)) return null;
              const condFlds = welfareForm.fields.filter(f => rule.showFieldIds.includes(f.id) && f.enabled);
              if (!condFlds.length) return null;
              return (
                <div key={rule.id} className="rounded-xl border border-red-200 bg-white/60 p-3 space-y-3">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wide">{tv} Details</p>
                  <div className="space-y-3">{condFlds.map(f => renderField(f))}</div>
                </div>
              );
            })}
          </div>
        );
      }
      return <>{blocks}</>;
    }
    if (stepDef.sectionType === "demographics") {
      const sec = config.sections.find(s => s.id === stepDef.sectionId);
      if (!sec) return null;
      return <div className="space-y-4">{renderFieldsInGrid(sec.fields.filter(f => f.enabled), sec.id)}</div>;
    }
    if (stepDef.sectionType === "custom") {
      const sec = config.sections.find(s => s.id === stepDef.sectionId);
      if (!sec) return null;
      const condIds = sec.conditionalRules.flatMap(r => r.showFieldIds);
      const visIds = sec.conditionalRules.flatMap(rule => rule.triggerValues.includes(values[rule.triggerFieldId] ?? "") ? rule.showFieldIds : []);
      const visFields = sec.fields.filter(f => f.enabled && (!condIds.includes(f.id) || visIds.includes(f.id)));
      const hasContent = visFields.length > 0 || sec.signatureRequired;
      return (
        <div className="space-y-4">
          {sec.description && <p className="text-xs text-slate-400 -mt-1">{sec.description}</p>}
          {hasContent ? (
            <>
              {renderFieldsInGrid(visFields, sec.id)}
              {sec.signatureRequired && renderField({ id: `${sec.id}_sig`, label: "Section Signature", type: "signature", required: true, enabled: true, options: [], placeholder: "" })}
            </>
          ) : (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-6 text-center">
              <p className="text-sm text-slate-400">No fields to fill in for this section.</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  }

  function renderReviewSummary(): React.ReactNode {
    type SummarySection = { title: string; items: { label: string; value: string }[] };
    const sections: SummarySection[] = [];
    if (basicInfoSec) {
      const items: { label: string; value: string }[] = [];
      const condIds = basicInfoSec.conditionalRules.flatMap(r => r.showFieldIds);
      const normalFlds = basicInfoSec.fields.filter(f => f.enabled && !condIds.includes(f.id) && f.type !== "signature" && f.type !== "file");
      for (const f of normalFlds) { const v = values[f.id]; if (v) items.push({ label: f.label, value: v }); }
      for (const rule of basicInfoSec.conditionalRules) {
        const tv = values[rule.triggerFieldId] ?? "";
        if (rule.triggerValues.includes(tv)) {
          const condFlds = basicInfoSec.fields.filter(f => rule.showFieldIds.includes(f.id) && f.enabled && f.type !== "signature" && f.type !== "file");
          for (const f of condFlds) { const v = values[f.id]; if (v) items.push({ label: f.label, value: v }); }
        }
      }
      const pt = config.patientTypes.find(t => t.id === patientType);
      if (pt) items.push({ label: "Patient Type", value: pt.label });
      if (activeType) {
        for (const f of activeType.extraFields.filter(ef => ef.enabled && ef.type !== "signature" && ef.type !== "file")) {
          const v = values[f.id]; if (v) items.push({ label: f.label, value: v });
        }
      }
      if (items.length > 0) sections.push({ title: "Basic Info", items });
    }
    for (const sec of orderedSections.filter(s => s.sectionType === "demographics")) {
      const items: { label: string; value: string }[] = [];
      for (const f of sec.fields.filter(f => f.enabled && f.type !== "signature" && f.type !== "file")) {
        const v = values[f.id]; if (v) items.push({ label: f.label, value: v });
      }
      if (items.length > 0) sections.push({ title: sec.name, items });
    }
    for (const sec of orderedSections.filter(s => s.sectionType === "custom")) {
      const condIds = sec.conditionalRules.flatMap(r => r.showFieldIds);
      const visIds = sec.conditionalRules.flatMap(rule => rule.triggerValues.includes(values[rule.triggerFieldId] ?? "") ? rule.showFieldIds : []);
      const items: { label: string; value: string }[] = [];
      for (const f of sec.fields.filter(f => f.enabled && f.type !== "signature" && f.type !== "file" && (!condIds.includes(f.id) || visIds.includes(f.id)))) {
        const v = values[f.id]; if (v) items.push({ label: f.label, value: v });
      }
      if (items.length > 0) sections.push({ title: sec.name, items });
    }
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[#4982CF]/30 bg-blue-50/70 px-4 py-3 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-[#4982CF] flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-[#4982CF] leading-snug">Review all information below before registering. Tap <span className="font-bold">Back to Edit</span> to make changes.</p>
        </div>
        {sections.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-400">No information filled in yet.</p>
          </div>
        ) : (
          sections.map((sec, si) => (
            <div key={si} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{sec.title}</p>
              </div>
              <div className="divide-y divide-slate-50">
                {sec.items.map((item, ii) => (
                  <div key={ii} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="text-[11px] text-slate-400 w-28 flex-shrink-0 pt-px">{item.label}</span>
                    <span className="text-[11px] font-semibold text-slate-700 flex-1">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  function handleSubmit() {
    const firstName = values["first_name"] ?? "";
    const lastName  = values["last_name"]  ?? "";
    onRegister({
      id:     uid(),
      mrn:    "MR-" + Math.floor(45000 + Math.random() * 5000),
      name:   `${firstName} ${lastName}`.trim() || "Patient",
      phone:  values["phone"] ?? "",
      dob:    values["dob"]   ?? "",
      gender: "M",
    });
  }

  return (
    <div className="fixed top-0 right-0 h-full z-[60] w-[42%] min-w-[520px] bg-white flex flex-col shadow-2xl border-l border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
        <button onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex-shrink-0 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">Register Patient</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Fill in details — patient will be added to the appointment</p>
        </div>
        <button onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">

          {/* Step progress indicator */}
          {multiStep && (
            <div className="flex items-start gap-0">
              {steps.map((step, idx) => {
                const isActive = idx === safeStep;
                const isDone   = idx < safeStep;
                return (
                  <React.Fragment key={step.id}>
                    {idx > 0 && (
                      <div className={`flex-1 h-0.5 mt-3.5 transition-colors ${isDone ? "bg-green-400" : "bg-slate-200"}`} />
                    )}
                    <div className="flex flex-col items-center flex-shrink-0 w-14">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive ? "bg-[#4982CF] text-white ring-4 ring-[#4982CF]/20" :
                        isDone   ? "bg-green-500 text-white" :
                                   "bg-slate-100 text-slate-400"
                      }`}>
                        {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wide mt-1 text-center leading-tight ${
                        isActive ? "text-[#4982CF]" : isDone ? "text-green-600" : "text-slate-400"
                      }`}>{step.name}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* MR number banner */}
          {!showReview && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <Hash className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient ID / MR No</p>
                <p className="text-sm font-mono font-bold text-slate-700">{mrBanner} (auto-generated)</p>
              </div>
            </div>
          )}

          {/* Step content or review */}
          {showReview ? renderReviewSummary() : renderStepContent()}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="flex-shrink-0 border-t border-slate-100 bg-white px-5 py-4">
        {multiStep ? (
          showReview ? (
            <div className="flex gap-3">
              <Button variant="outline" className="h-11 px-5 text-sm font-bold"
                onClick={() => setShowReview(false)}>
                <Pencil className="h-4 w-4 mr-1.5" /> Back to Edit
              </Button>
              <Button className="flex-1 h-11 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }}
                disabled={!canSubmit} onClick={handleSubmit}>
                <UserPlus className="h-4 w-4" /> Register Patient
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" className="h-11 px-5 text-sm font-bold"
                onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={safeStep === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              {isLastStep ? (
                <>
                  <Button variant="outline" className="h-11 px-4 text-sm font-bold text-[#4982CF] border-[#4982CF]/40 hover:bg-blue-50"
                    onClick={() => setShowReview(true)}>
                    <Eye className="h-4 w-4 mr-1.5" /> Review
                  </Button>
                  <Button className="flex-1 h-11 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }}
                    disabled={!canSubmit} onClick={handleSubmit}>
                    <UserPlus className="h-4 w-4" /> Register Patient
                  </Button>
                </>
              ) : (
                <Button className="flex-1 h-11 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }}
                  disabled={!canAdvance(safeStep)}
                  onClick={() => setCurrentStep(s => Math.min(steps.length - 1, s + 1))}>
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        ) : (
          <Button className="w-full h-11 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }}
            disabled={!canSubmit} onClick={handleSubmit}>
            <UserPlus className="h-4 w-4" /> Register Patient
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Booking Drawer ───────────────────────────────────────────────────────────

interface BookingDrawerProps {
  doctors: Doctor[];
  init: Partial<BookingForm>;
  editAppt?: Appointment | null;
  onSave: (form: BookingForm) => void;
  onClose: () => void;
}

function BookingDrawer({ doctors, init, editAppt, onSave, onClose }: BookingDrawerProps) {
  const { patients, addPatient } = usePatients();
  const [showRegDrawer, setShowRegDrawer] = useState(false);
  const [form, setForm] = useState<BookingForm>(() => emptyForm(editAppt ? {
    doctorId: editAppt.doctorId, date: editAppt.date,
    slotStart: editAppt.slotStart, slotEnd: editAppt.slotEnd,
    patientName: editAppt.patientName, patientMrn: editAppt.patientMrn,
    patientPhone: editAppt.patientPhone, type: editAppt.type,
    specialty: editAppt.specialty, priority: editAppt.priority,
    contagious: editAppt.contagious, contagiousNote: editAppt.contagiousNote,
    repeat: editAppt.repeat, repeatType: editAppt.repeatType || "weekly",
    repeatNote: editAppt.repeatNote, comments: editAppt.comments,
  } : init));
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const set = (k: keyof BookingForm, v: BookingForm[typeof k]) =>
    setForm(p => ({ ...p, [k]: v }));

  const doctor = doctors.find(d => d.id === form.doctorId);

  const slotsForDay = useMemo(() => {
    if (!doctor || !form.date) return [];
    return doctor.timings.flatMap(t => generateSlots(t, form.date));
  }, [doctor, form.date]);

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.phone.includes(q)
    ).slice(0, 6);
  }, [patients, search]);

  function selectPatient(p: (typeof patients)[number]) {
    set("patientName", p.name);
    set("patientMrn", p.mrn);
    set("patientPhone", p.phone);
    setSearch(p.name);
    setSearchFocused(false);
  }

  const canSave = form.doctorId && form.date && form.slotStart && form.patientName;

  const title = editAppt ? "Edit Appointment" : "Book Appointment";
  const subtitle = editAppt ? `Editing ${editAppt.patientName}` : "Fill in the details below";

  return (
    <>
    <RightDrawer
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancel</Button>
          <Button
            disabled={!canSave}
            onClick={() => onSave(form)}
            className="flex-1 h-9 bg-[#4982CF] hover:bg-[#3D73BC] text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {editAppt ? "Save Changes" : "Book Appointment"}
          </Button>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-5">

        {/* Patient Search */}
        <section>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Patient</label>
          <div className="flex gap-2 items-start">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search by name, MRN, or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                className="pl-9 h-9 text-sm"
              />
              {searchFocused && filteredPatients.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {filteredPatients.map(p => (
                    <button
                      key={p.id}
                      onMouseDown={() => selectPatient(p)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                    >
                      <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.mrn} · {p.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="button"
              onClick={() => setShowRegDrawer(true)}
              className="h-9 px-3 text-xs font-bold gap-1.5 flex-shrink-0 bg-[#4982CF] hover:bg-[#3D73BC] text-white"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Register Patient
            </Button>
          </div>
          {(form.patientName || form.patientMrn || form.patientPhone) && (
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#4982CF]/30 bg-[#4982CF]/5 px-3 py-2.5">
              <div className="h-9 w-9 rounded-full bg-[#4982CF] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-black text-white">
                  {form.patientName.trim().split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 leading-tight truncate">{form.patientName.trim()}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {[form.patientMrn, form.patientPhone].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                onClick={() => { set("patientName", ""); set("patientMrn", ""); set("patientPhone", ""); setSearch(""); }}
                className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors"
                title="Clear patient">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>

        <div className="h-px bg-slate-100" />

        {/* Doctor, Date, Slot */}
        <section>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Appointment Details</label>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Doctor</label>
              <Select value={form.doctorId} onValueChange={v => { set("doctorId", v); set("slotStart", ""); set("slotEnd", ""); const doc = doctors.find(d => d.id === v); set("specialty", doc?.specialties[0] ?? ""); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select doctor..." /></SelectTrigger>
                <SelectContent>
                  {doctors.filter(d => d.doctorType === "appointment" && d.status === "active").map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Date</label>
                <Input type="date" value={form.date} onChange={e => { set("date", e.target.value); set("slotStart", ""); set("slotEnd", ""); }} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Specialty</label>
                <Input value={form.specialty} onChange={e => set("specialty", e.target.value)} className="h-9 text-sm" placeholder="Specialty..." />
              </div>
            </div>

            {/* Time Slot blocks */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Time Slot</label>
              {slotsForDay.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No slots configured for {getDayName(form.date)}.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {slotsForDay.map(slot => {
                    const active = form.slotStart === slot.start;
                    return (
                      <button
                        key={slot.start}
                        onClick={() => { set("slotStart", slot.start); set("slotEnd", slot.end); }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${active ? "bg-[#4982CF] text-white border-[#4982CF]" : "bg-white text-slate-600 border-slate-200 hover:border-[#4982CF] hover:text-[#4982CF]"}`}
                      >
                        {slot.start}
                        {slot.allowMultiple && <span className="ml-1 opacity-60">+</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Appointment Type */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Appointment Type</label>
              <Select value={form.type} onValueChange={v => set("type", v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {(doctor?.services ?? ["Consultation", "FollowUp", "Emergency", "Tele-consultation"]).map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <div className="h-px bg-slate-100" />

        {/* Priority */}
        <section>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Priority</label>
          <div className="flex gap-2">
            {(["normal", "urgent", "emergency"] as const).map(p => (
              <button
                key={p}
                onClick={() => set("priority", p)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${form.priority === p ? (p === "normal" ? "bg-slate-600 text-white border-slate-600" : p === "urgent" ? "bg-amber-500 text-white border-amber-500" : "bg-red-500 text-white border-red-500") : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
              >
                {p === "emergency" && <AlertCircle className="h-3 w-3 inline mr-1" />}
                {p === "urgent" && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                {PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>
        </section>

        {/* Contagious Disease */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contagious Disease</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{form.contagious ? "Yes" : "No"}</span>
              <Switch
                checked={form.contagious}
                onCheckedChange={v => { set("contagious", v); if (!v) set("contagiousNote", ""); }}
                className="data-[state=checked]:bg-red-500"
              />
            </div>
          </div>
          {form.contagious && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 font-semibold">Select disease(s):</p>
              <div className="flex flex-wrap gap-1.5">
                {CONTAGIOUS_OPTIONS.map(opt => {
                  const notes = form.contagiousNote.split(",").map(s => s.trim()).filter(Boolean);
                  const isOther = opt === "Other";
                  const selected = isOther
                    ? notes.some(n => !CONTAGIOUS_OPTIONS.slice(0, -1).includes(n))
                    : notes.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const current = form.contagiousNote.split(",").map(s => s.trim()).filter(Boolean);
                        if (isOther) return;
                        const next = selected ? current.filter(n => n !== opt) : [...current, opt];
                        set("contagiousNote", next.join(", "));
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${selected ? "bg-red-500 text-white border-red-500" : "bg-white text-slate-500 border-slate-200 hover:border-red-300"}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <Input
                value={(() => {
                  const known = new Set(CONTAGIOUS_OPTIONS.slice(0, -1));
                  return form.contagiousNote.split(",").map(s => s.trim()).filter(n => n && !known.has(n)).join(", ");
                })()}
                onChange={e => {
                  const known = new Set(CONTAGIOUS_OPTIONS.slice(0, -1));
                  const chips = form.contagiousNote.split(",").map(s => s.trim()).filter(n => n && known.has(n));
                  const custom = e.target.value.trim();
                  set("contagiousNote", [...chips, ...(custom ? [custom] : [])].join(", "));
                }}
                placeholder='Other (specify)...'
                className="h-8 text-xs"
              />
            </div>
          )}
        </section>

        {/* Repeat Appointment */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Repeat Appointment</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{form.repeat ? "Yes" : "No"}</span>
              <Switch
                checked={form.repeat}
                onCheckedChange={v => set("repeat", v)}
                className="data-[state=checked]:bg-[#4982CF]"
              />
            </div>
          </div>
          {form.repeat && (
            <div className="space-y-2">
              <div className="flex gap-1.5">
                {(["daily", "weekly", "monthly", "custom"] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => set("repeatType", r)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${form.repeatType === r ? "bg-[#4982CF] text-white border-[#4982CF]" : "bg-white text-slate-500 border-slate-200 hover:border-[#4982CF]"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {form.repeatType === "custom" && (
                <Input
                  value={form.repeatNote}
                  onChange={e => set("repeatNote", e.target.value)}
                  placeholder="Describe repeat schedule..."
                  className="h-9 text-sm"
                />
              )}
            </div>
          )}
        </section>

        {/* Comments */}
        <section>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Comments</label>
          <textarea
            value={form.comments}
            onChange={e => set("comments", e.target.value)}
            placeholder="Any additional notes..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-[#4982CF]"
          />
        </section>
      </div>
    </RightDrawer>
    {showRegDrawer && (
      <ApptRegDrawer
        onRegister={patient => {
          addPatient(patient);
          selectPatient(patient);
          setShowRegDrawer(false);
        }}
        onClose={() => setShowRegDrawer(false)}
      />
    )}
    </>
  );
}

// ─── Contagious Disease Options ───────────────────────────────────────────────

const CONTAGIOUS_OPTIONS = [
  "COVID-19", "Tuberculosis (TB)", "Influenza", "Hepatitis A/B/C",
  "MRSA", "Chickenpox", "Measles", "Other",
];

// ─── View Drawer (read-only appointment details) ──────────────────────────────

interface ViewDrawerProps {
  appt: Appointment;
  doctorName: string;
  role: Role;
  onClose: () => void;
  onEdit: () => void;
}

function ViewDrawer({ appt, doctorName, role, onClose, onEdit }: ViewDrawerProps) {
  const [, navTo] = useLocation();
  const sc = STATUS_CONFIG[appt.status];
  const pc = PRIORITY_CONFIG[appt.priority];

  function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0 gap-4">
        <span className="text-xs font-semibold text-slate-400 flex-shrink-0 w-28">{label}</span>
        <span className="text-xs text-slate-800 text-right flex-1 min-w-0">{children}</span>
      </div>
    );
  }

  return (
    <RightDrawer
      title="Appointment Details"
      subtitle={`${appt.patientName} — ${formatDateShort(appt.date)}`}
      onClose={onClose}
      footer={
        role === "frontdesk" ? (
          <Button
            onClick={onEdit}
            className="w-full h-9 bg-[#4982CF] hover:bg-[#3D73BC] text-white gap-2"
          >
            <Edit2 className="h-4 w-4" /> Edit Appointment
          </Button>
        ) : undefined
      }
    >
      <div className="px-5 py-4">
        {/* Status badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-5 ${sc.bg} ${sc.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
          {sc.label}
        </div>

        {/* Patient */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Patient</p>
          <button
            onClick={() => navTo(`/patients/${getPatientIdByMrn(appt.patientMrn)}`)}
            className="font-bold text-slate-900 hover:text-[#4982CF] hover:underline transition-colors text-left"
          >
            {appt.patientName}
          </button>
          {appt.patientMrn && <p className="text-xs text-slate-500 mt-0.5">{appt.patientMrn}</p>}
          {appt.patientPhone && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Phone className="h-3 w-3" /> {appt.patientPhone}
            </p>
          )}
        </div>

        {/* Details */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-1 mb-4">
          <Row label="Doctor">{doctorName}</Row>
          <Row label="Date">{formatDateFull(appt.date)}</Row>
          <Row label="Time Slot">{appt.slotStart} – {appt.slotEnd}</Row>
          {appt.type && <Row label="Type">{appt.type}</Row>}
          {appt.specialty && <Row label="Specialty">{appt.specialty}</Row>}
          <Row label="Priority">
            <span className={`font-bold capitalize ${pc.text}`}>{appt.priority}</span>
          </Row>
        </div>

        {/* Flags */}
        {(appt.contagious || appt.repeat) && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-1 mb-4">
            {appt.contagious && (
              <Row label="Contagious Disease">
                <span className="text-red-600 font-semibold">
                  Yes{appt.contagiousNote ? ` — ${appt.contagiousNote}` : ""}
                </span>
              </Row>
            )}
            {appt.repeat && (
              <Row label="Repeat">
                <span className="text-[#4982CF] font-semibold capitalize">
                  {appt.repeatType}{appt.repeatNote ? ` — ${appt.repeatNote}` : ""}
                </span>
              </Row>
            )}
          </div>
        )}

        {/* Comments */}
        {appt.comments && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Comments</p>
            <p className="text-sm text-slate-700 italic">"{appt.comments}"</p>
          </div>
        )}

        {/* Meta */}
        <p className="text-[10px] text-slate-300 text-center mt-2">
          Booked {new Date(appt.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>
    </RightDrawer>
  );
}

// ─── Appointment Chip ─────────────────────────────────────────────────────────

interface ChipProps {
  appt: Appointment;
  isPaid: boolean;
  onClick: (appt: Appointment, e: React.MouseEvent) => void;
}

function ApptChip({ appt, isPaid, onClick }: ChipProps) {
  const [, navTo] = useLocation();
  const sc = STATUS_CONFIG[appt.status];
  const pc = PRIORITY_CONFIG[appt.priority];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={e => onClick(appt, e)}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}
      className={`w-full text-left px-3 py-2 rounded-lg border-2 mb-1.5 hover:brightness-95 transition-all cursor-pointer ${sc.bg}`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${sc.dot}`} />
        <button
          onClick={e => { e.stopPropagation(); navTo(`/patients/${getPatientIdByMrn(appt.patientMrn)}`); }}
          className={`text-sm font-bold truncate leading-tight ${sc.text} hover:underline text-left`}
        >
          {appt.patientName}
        </button>
        {appt.priority !== "normal" && (
          <span className={`ml-auto text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${pc.bg} ${pc.text}`}>
            {appt.priority === "urgent" ? "URG" : "EMR"}
          </span>
        )}
        {isPaid && (
          <span className="ml-auto text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0 bg-green-100 text-green-700">
            ✓ PAID
          </span>
        )}
      </div>
      <div className="ml-4 mt-0.5 flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-mono font-semibold ${sc.text} opacity-75`}>{appt.slotStart}</span>
        {appt.patientMrn && <span className={`text-xs font-medium ${sc.text} opacity-60`}>{appt.patientMrn}</span>}
        {appt.patientPhone && <span className={`text-xs ${sc.text} opacity-50`}>{appt.patientPhone}</span>}
      </div>
    </div>
  );
}

// ─── Appointment Card Popup ───────────────────────────────────────────────────

interface CardState {
  appt: Appointment;
  x: number;
  y: number;
}

interface ApptCardProps {
  state: CardState;
  isPaid: boolean;
  role: Role;
  onClose: () => void;
  onView: (appt: Appointment) => void;
  onEdit: (appt: Appointment) => void;
  onStatusChange: (id: string, status: ApptStatus) => void;
  onInvoice: (appt: Appointment) => void;
  onNursing: (appt: Appointment) => void;
}

function AppointmentCard({ state, isPaid, role, onClose, onView, onEdit, onStatusChange, onInvoice: onInvoiceRaw, onNursing }: ApptCardProps) {
  const [, navTo] = useLocation();
  function onInvoice() { onInvoiceRaw(state.appt); }
  const { appt, x, y } = state;
  const sc = STATUS_CONFIG[appt.status];

  const nextStatuses: ApptStatus[] = (() => {
    if (appt.status === "booked")      return ["confirmed", "checked_in", "rescheduled", "cancelled", "no_show"];
    if (appt.status === "confirmed")   return ["checked_in", "rescheduled", "cancelled", "no_show"];
    if (appt.status === "checked_in")  return ["checked_out"];
    if (appt.status === "rescheduled") return ["booked", "confirmed", "cancelled"];
    return [];
  })();

  const adjustedX = Math.min(x, window.innerWidth - 340);
  const adjustedY = Math.min(y, window.innerHeight - 380);

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div
        className="fixed z-[70] w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
        style={{ left: adjustedX, top: adjustedY }}
      >
        {/* Header */}
        <div className={`px-4 py-3 border-b border-slate-100 ${sc.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${sc.text}`}>{sc.label}</span>
              {isPaid && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-green-100 text-green-700">✓ Paid</span>
              )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <button
            onClick={() => navTo(`/patients/${getPatientIdByMrn(appt.patientMrn)}`)}
            className="font-bold text-slate-900 mt-1 hover:text-[#4982CF] hover:underline transition-colors text-left block"
          >
            {appt.patientName}
          </button>
          <p className="text-xs text-slate-500">{appt.patientMrn} {appt.patientPhone && `· ${appt.patientPhone}`}</p>
        </div>

        {/* Info */}
        <div className="px-4 py-3 space-y-1.5 border-b border-slate-100">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Date & Time</span>
            <span className="text-slate-700 font-semibold">{formatDateShort(appt.date)} · {appt.slotStart}–{appt.slotEnd}</span>
          </div>
          {appt.type && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Type</span>
              <span className="text-slate-700 font-semibold">{appt.type}</span>
            </div>
          )}
          {appt.specialty && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Specialty</span>
              <span className="text-slate-700 font-semibold">{appt.specialty}</span>
            </div>
          )}
          {appt.priority !== "normal" && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Priority</span>
              <span className={`font-bold capitalize ${PRIORITY_CONFIG[appt.priority].text}`}>{appt.priority}</span>
            </div>
          )}
          {appt.contagious && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Contagious</span>
              <span className="text-red-600 font-semibold">Yes {appt.contagiousNote && `— ${appt.contagiousNote}`}</span>
            </div>
          )}
          {appt.repeat && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Repeat</span>
              <span className="text-[#4982CF] font-semibold capitalize">{appt.repeatType}</span>
            </div>
          )}
          {appt.comments && (
            <div className="text-xs text-slate-500 pt-1 italic">"{appt.comments}"</div>
          )}
        </div>

        {/* Status change — front desk only */}
        {role === "frontdesk" && nextStatuses.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Change Status</p>
            <div className="flex flex-wrap gap-1.5">
              {nextStatuses.map(s => {
                const c = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(appt.id, s); onClose(); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${c.bg} ${c.text} hover:opacity-80`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { navTo(`/patients/${getPatientIdByMrn(appt.patientMrn)}`); onClose(); }} className="flex-1 h-8 text-xs gap-1.5">
            <Eye className="h-3 w-3" /> View Profile
          </Button>
          {role === "doctor" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { onView(appt); onClose(); }}
              className="flex-1 h-8 text-xs gap-1.5 border-[#4982CF]/40 text-[#4982CF] hover:bg-blue-50"
            >
              <BookOpen className="h-3 w-3" /> Open Facesheet
            </Button>
          ) : role === "nursing" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { onNursing(appt); onClose(); }}
              className="flex-1 h-8 text-xs gap-1.5 border-[#4982CF]/40 text-[#4982CF] hover:bg-blue-50"
            >
              <Activity className="h-3 w-3" /> Nursing
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => { onEdit(appt); onClose(); }} className="flex-1 h-8 text-xs gap-1.5">
                <Edit2 className="h-3 w-3" /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onInvoice}
                className={`flex-1 h-8 text-xs gap-1.5 ${isPaid ? "border-green-200 text-green-700 hover:bg-green-50" : ""}`}
              >
                {isPaid ? <><CheckCircle2 className="h-3 w-3" /> Receipt</> : <><FileText className="h-3 w-3" /> Invoice</>}
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Slot Row (Day / Doctor View) ─────────────────────────────────────────────

interface SlotRowProps {
  slot: SlotBlock;
  appts: Appointment[];
  filterTypes: string[];
  paidIds: Set<string>;
  onClickEmpty: () => void;
  onClickAppt: (appt: Appointment, e: React.MouseEvent) => void;
}

function SlotRow({ slot, appts, filterTypes, paidIds, onClickEmpty, onClickAppt }: SlotRowProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = filterTypes.length > 0 ? appts.filter(a => filterTypes.includes(a.type)) : appts;
  const shown = expanded ? visible : visible.slice(0, 2);
  // Use ALL appts (not filtered) for booking eligibility so type filters can't bypass capacity
  const canBook = appts.length === 0 || slot.allowMultiple;

  return (
    <div className="flex items-start gap-3 px-4 py-4 border-b border-slate-200 group hover:bg-slate-50 transition-colors">
      <div className="w-24 flex-shrink-0 text-sm font-mono text-slate-600 font-semibold pt-1">
        {slot.start}
        <div className="text-xs text-slate-400 font-normal">{slot.end}</div>
        {slot.allowMultiple && <span className="text-[10px] text-indigo-500 font-bold">MULTI</span>}
      </div>
      <div className="flex-1 min-w-0">
        {shown.map(a => <ApptChip key={a.id} appt={a} isPaid={paidIds.has(a.id)} onClick={onClickAppt} />)}
        {visible.length > 2 && (
          <button onClick={() => setExpanded(p => !p)} className="text-[11px] text-[#4982CF] font-semibold flex items-center gap-0.5 mb-1">
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Show less" : `+${visible.length - 2} more`}
          </button>
        )}
        {canBook && (
          <button
            onClick={onClickEmpty}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-[#4982CF] font-semibold hover:bg-[#4982CF]/8 px-2 py-1 rounded-lg mt-0.5"
          >
            <Plus className="h-3 w-3" /> Book Slot
          </button>
        )}
        {!canBook && visible.length > 0 && (
          <p className="text-[10px] text-slate-300 mt-0.5 px-0.5">Single booking only</p>
        )}
      </div>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────

interface DayViewProps {
  doctor: Doctor;
  date: string;
  appointments: Appointment[];
  filterTypes: string[];
  paidIds: Set<string>;
  onClickSlot: (slot: SlotBlock) => void;
  onClickAppt: (appt: Appointment, e: React.MouseEvent) => void;
}

function DayView({ doctor, date, appointments, filterTypes, paidIds, onClickSlot, onClickAppt }: DayViewProps) {
  const slots = useMemo(
    () => doctor.timings.flatMap(t => generateSlots(t, date)),
    [doctor, date]
  );

  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{doctor.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{formatDateFull(date)}</p>
        </div>
        <div className="py-20 text-center">
          <Calendar className="h-8 w-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-medium">No schedule on {getDayName(date)}</p>
          <p className="text-xs text-slate-300 mt-1">This doctor has no timings configured for this day.</p>
        </div>
      </div>
    );
  }

  const dayAppts = appointments.filter(a => a.doctorId === doctor.id && a.date === date);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">{doctor.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{formatDateFull(date)}</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-lg font-bold text-slate-700">{slots.length}</p>
            <p className="text-[10px] text-slate-400">total</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[#4982CF]">{dayAppts.length}</p>
            <p className="text-[10px] text-slate-400">booked</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-600">{Math.max(0, slots.length - dayAppts.length)}</p>
            <p className="text-[10px] text-slate-400">free</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {slots.map(slot => {
          const slotAppts = dayAppts.filter(a => a.slotStart === slot.start);
          return (
            <SlotRow
              key={slot.timingId + slot.start}
              slot={slot}
              appts={slotAppts}
              filterTypes={filterTypes}
              paidIds={paidIds}
              onClickEmpty={() => onClickSlot(slot)}
              onClickAppt={onClickAppt}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

interface WeekSlotCellProps {
  date: string;
  slot: SlotBlock;
  appointments: Appointment[];
  filterTypes: string[];
  doctorId: string;
  paidIds: Set<string>;
  onClickSlot: (date: string, slot: SlotBlock) => void;
  onClickAppt: (appt: Appointment, e: React.MouseEvent) => void;
}

function WeekSlotCell({ date, slot, appointments, filterTypes, doctorId, paidIds, onClickSlot, onClickAppt }: WeekSlotCellProps) {
  const [expanded, setExpanded] = useState(false);
  const slotAppts = appointments.filter(
    a => a.doctorId === doctorId && a.date === date && a.slotStart === slot.start,
  );
  const visible = filterTypes.length > 0 ? slotAppts.filter(a => filterTypes.includes(a.type)) : slotAppts;
  const shown = expanded ? visible : visible.slice(0, 2);
  // capacity check uses ALL slot appts, not filtered subset
  const canBook = slotAppts.length === 0 || slot.allowMultiple;

  return (
    <div className="group h-full px-2 py-3 hover:bg-slate-50 transition-colors">
      {shown.map(a => <ApptChip key={a.id} appt={a} isPaid={paidIds.has(a.id)} onClick={onClickAppt} />)}
      {visible.length > 2 && (
        <button
          onClick={() => setExpanded(p => !p)}
          className="text-xs text-[#4982CF] font-semibold block mt-0.5"
        >
          {expanded ? "▲ less" : `+${visible.length - 2} more`}
        </button>
      )}
      {canBook && (
        <button
          onClick={() => onClickSlot(date, slot)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#4982CF] font-semibold flex items-center gap-0.5 mt-1 hover:underline"
        >
          <Plus className="h-3 w-3" /> Book
        </button>
      )}
      {!canBook && slotAppts.length > 0 && (
        <p className="text-[10px] text-slate-400 mt-0.5">Single booking only</p>
      )}
    </div>
  );
}

interface WeekViewProps {
  doctor: Doctor;
  weekDays: string[];
  appointments: Appointment[];
  filterTypes: string[];
  paidIds: Set<string>;
  onClickSlot: (date: string, slot: SlotBlock) => void;
  onClickAppt: (appt: Appointment, e: React.MouseEvent) => void;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function WeekView({ doctor, weekDays, appointments, filterTypes, paidIds, onClickSlot, onClickAppt }: WeekViewProps) {
  const today = todayStr();

  const dayData = weekDays.map(d => ({
    date: d,
    slots: doctor.timings.flatMap(t => generateSlots(t, d)),
    isToday: d === today,
  }));

  // Union of all slot start times across the week, sorted — forms the time-axis rows
  const allTimes = Array.from(
    new Set(dayData.flatMap(({ slots }) => slots.map(s => s.start))),
  ).sort();

  // Current-time indicator: static at mount (no live tick needed for v1)
  const nowMinutes = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);
  const isCurrentWeek = weekDays.includes(today);

  // Find the row whose time slot straddles "now": rowStart <= now < nextRowStart
  const currentTimeRow = useMemo(() => {
    if (!isCurrentWeek) return null;
    for (let i = 0; i < allTimes.length; i++) {
      const rowStart = timeToMinutes(allTimes[i]);
      const rowEnd = i + 1 < allTimes.length ? timeToMinutes(allTimes[i + 1]) : rowStart + 30;
      if (nowMinutes >= rowStart && nowMinutes < rowEnd) return allTimes[i];
    }
    return null;
  }, [allTimes, nowMinutes, isCurrentWeek]);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* ── Single scroll container — header is sticky inside so widths always match ── */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* ── Header row (sticky inside scroll — same width as rows below) ── */}
        <div className="flex border-b border-slate-300 bg-slate-50 sticky top-0 z-10">
          {/* Ruler stub — same width as the time-label column below */}
          <div className="w-16 flex-shrink-0 border-r border-slate-200" />
          {dayData.map(({ date, slots, isToday }) => {
            const dateNum = parseInt(date.split("-")[2]);
            const dayName = getDayName(date).slice(0, 3).toUpperCase();
            const hasSlots = slots.length > 0;
            const booked = appointments.filter(a => a.doctorId === doctor.id && a.date === date).length;
            const available = Math.max(0, slots.length - booked);
            return (
              <div
                key={date}
                className={`flex-1 min-w-0 border-r border-slate-200 last:border-0 px-2 py-3 text-center ${isToday ? "border-t-2 border-t-[#4982CF] bg-[#4982CF]/5" : ""}`}
              >
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dayName}</p>
                <p className={`text-2xl font-bold mt-0.5 leading-none ${isToday ? "text-[#4982CF]" : hasSlots ? "text-slate-800" : "text-slate-300"}`}>
                  {dateNum}
                </p>
                <p className="text-[10px] mt-1 leading-snug">
                  {hasSlots ? (
                    <span className="text-slate-400">
                      <span className="font-bold text-slate-600">{slots.length}</span> total
                      {" · "}
                      <span className="font-bold text-[#4982CF]">{booked}</span> booked
                      {" · "}
                      <span className="font-bold text-emerald-600">{available}</span> free
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-400">Off</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Time-aligned grid rows ─────────────────────────────────────── */}
        {allTimes.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">No slots this week</p>
            <p className="text-xs text-slate-300 mt-1">This doctor has no timings configured for any day this week.</p>
          </div>
        ) : (
          allTimes.map(time => {
            const isNowRow = currentTimeRow === time;
            return (
              <div key={time} className={`flex border-b border-slate-200 last:border-0 relative ${isNowRow ? "z-[1]" : ""}`}>
                {/* Current-time indicator — red bar across full row width */}
                {isNowRow && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-red-500 z-10 pointer-events-none" />
                )}

                {/* ── Time-axis label ── */}
                <div className={`w-16 flex-shrink-0 border-r border-slate-200 px-2 py-3 flex items-center justify-end ${isNowRow ? "bg-red-50" : ""}`}>
                  <span className={`text-xs font-semibold font-mono leading-none ${isNowRow ? "text-red-500" : "text-slate-500"}`}>{time}</span>
                </div>

                {/* ── Day cells for this time row ── */}
                {dayData.map(({ date, slots, isToday }) => {
                  const slot = slots.find(s => s.start === time);
                  if (!slot) {
                    // This day has no slot at this time — grey band (off / outside schedule)
                    return (
                      <div
                        key={date}
                        className={`flex-1 min-w-0 min-h-[68px] border-r border-slate-200 last:border-0 ${isToday ? "bg-[#4982CF]/[0.04]" : "bg-slate-100/60"}`}
                      />
                    );
                  }
                  return (
                    <div
                      key={date}
                      className={`flex-1 min-w-0 border-r border-slate-200 last:border-0 min-h-[68px] ${isToday ? "bg-[#4982CF]/[0.05]" : ""}`}
                    >
                      <WeekSlotCell
                        date={date}
                        slot={slot}
                        appointments={appointments}
                        filterTypes={filterTypes}
                        doctorId={doctor.id}
                        paidIds={paidIds}
                        onClickSlot={onClickSlot}
                        onClickAppt={onClickAppt}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

interface MonthViewProps {
  date: string;
  doctor: Doctor;
  appointments: Appointment[];
  filterTypes: string[];
  selectedDate: string;
  onSelectDate: (d: string) => void;
  onClickAppt: (appt: Appointment, e: React.MouseEvent) => void;
  onBookDate: (date: string) => void;
  onClickMore: (date: string) => void;
}

function MonthView({ date, doctor, appointments, filterTypes, selectedDate, onSelectDate, onClickAppt, onBookDate, onClickMore }: MonthViewProps) {
  const [, navTo] = useLocation();
  const cells = useMemo(() => getMonthDays(date), [date]);
  const [, m] = date.split("-").map(Number);
  const today = todayStr();
  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex-shrink-0 grid grid-cols-7 border-b border-slate-300 bg-slate-50 rounded-t-2xl overflow-hidden">
        {DAY_LABELS.map(l => (
          <div key={l} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-0">{l}</div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 grid grid-cols-7 auto-rows-min">
        {cells.map((d, i) => {
          const inMonth = parseInt(d.split("-")[1]) === m;
          const isToday = d === today;
          const isSelected = d === selectedDate;
          const dayAppts = appointments.filter(a =>
            a.doctorId === doctor.id && a.date === d &&
            (filterTypes.length === 0 || filterTypes.includes(a.type))
          );
          const hasSlots = doctor.timings.some(t => getDayName(d) === t.day);
          return (
            <div
              key={i}
              onClick={() => { if (inMonth && hasSlots) { onSelectDate(d); onBookDate(d); } }}
              className={`min-h-[100px] border-r border-b border-slate-200 px-2 py-2 transition-colors relative
                ${!inMonth ? "bg-slate-100/50" : hasSlots ? "cursor-pointer hover:bg-slate-50" : ""}
                ${isToday && !isSelected ? "bg-[#4982CF]/[0.04]" : ""}
                ${isSelected ? "bg-[#4982CF]/[0.08] ring-1 ring-inset ring-[#4982CF]/30" : ""}`}
            >
              <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1.5
                ${isToday ? "bg-[#4982CF] text-white shadow-sm" : inMonth ? "text-slate-800" : "text-slate-300"}`}>
                {parseInt(d.split("-")[2])}
              </div>
              {inMonth && dayAppts.slice(0, 2).map(a => {
                const sc = STATUS_CONFIG[a.status];
                return (
                  <div
                    key={a.id}
                    role="button"
                    tabIndex={0}
                    onClick={e => { e.stopPropagation(); onClickAppt(a, e); }}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}
                    className={`w-full text-left text-[11px] font-semibold px-1.5 py-0.5 rounded border mb-0.5 leading-tight hover:brightness-95 transition-all cursor-pointer flex items-center gap-1 ${sc.bg} ${sc.text}`}
                  >
                    <span className="font-mono opacity-75 flex-shrink-0">{a.slotStart}</span>
                    <button
                      onClick={e => { e.stopPropagation(); navTo(`/patients/${getPatientIdByMrn(a.patientMrn)}`); }}
                      className="truncate hover:underline text-left flex-1"
                    >
                      {a.patientName}
                    </button>
                  </div>
                );
              })}
              {inMonth && dayAppts.length > 2 && (
                <button
                  onClick={e => { e.stopPropagation(); onClickMore(d); }}
                  className="text-xs text-[#4982CF] font-bold mt-0.5 hover:underline block"
                >
                  +{dayAppts.length - 2} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Month Day Overlay ────────────────────────────────────────────────────────

interface MonthDayOverlayProps {
  date: string;
  doctor: Doctor;
  appointments: Appointment[];
  filterTypes: string[];
  paidIds: Set<string>;
  onClickAppt: (appt: Appointment, e: React.MouseEvent) => void;
  onBook: () => void;
  onClose: () => void;
}

function MonthDayOverlay({ date, doctor, appointments, filterTypes, paidIds, onClickAppt, onBook, onClose }: MonthDayOverlayProps) {
  const dayAppts = appointments.filter(a =>
    a.doctorId === doctor.id && a.date === date &&
    (filterTypes.length === 0 || filterTypes.includes(a.type))
  );
  const dayLabel = new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900">{dayLabel}</p>
            <p className="text-xs text-slate-400 mt-0.5">{dayAppts.length} appointment{dayAppts.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Appointment list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {dayAppts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No appointments for this day.</p>
          ) : (
            dayAppts
              .slice()
              .sort((a, b) => a.slotStart.localeCompare(b.slotStart))
              .map(a => <ApptChip key={a.id} appt={a} isPaid={paidIds.has(a.id)} onClick={(appt, e) => { onClickAppt(appt, e); }} />)
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3">
          <button
            onClick={() => { onBook(); onClose(); }}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#4982CF] text-white text-sm font-bold hover:bg-[#3a6db5] transition-colors"
          >
            <Plus className="h-4 w-4" /> Book Appointment
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Month Slot Picker ────────────────────────────────────────────────────────

interface MonthSlotPickerProps {
  date: string;
  doctor: Doctor;
  appointments: Appointment[];
  onSelectSlot: (slot: SlotBlock) => void;
  onAnyTime: () => void;
  onClose: () => void;
}

function MonthSlotPicker({ date, doctor, appointments, onSelectSlot, onAnyTime, onClose }: MonthSlotPickerProps) {
  const slots = useMemo(() => doctor.timings.flatMap(t => generateSlots(t, date)), [doctor, date]);
  const dayLabel = new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[72vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900">Pick a time slot</p>
            <p className="text-xs text-slate-400 mt-0.5">{dayLabel}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Slot list */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {slots.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No slots available for this day.</p>
          ) : (
            slots.map(slot => {
              const booked = appointments.filter(a =>
                a.doctorId === doctor.id &&
                a.date === date &&
                a.slotStart === slot.start &&
                a.status !== "cancelled" &&
                a.status !== "no_show"
              ).length;
              const isFull = !slot.allowMultiple && booked > 0;
              return (
                <button
                  key={slot.timingId + slot.start}
                  onClick={() => { if (!isFull) onSelectSlot(slot); }}
                  disabled={isFull}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl mb-1 text-left transition-colors
                    ${isFull ? "opacity-50 cursor-not-allowed" : "hover:bg-[#4982CF]/[0.06] cursor-pointer"}`}
                >
                  <span className={`text-sm font-semibold font-mono ${isFull ? "text-slate-400" : "text-slate-800"}`}>
                    {slot.start}
                    <span className="text-xs font-normal text-slate-400 ml-1.5">→ {slot.end}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {booked > 0 && (
                      <span className="text-[10px] font-semibold text-slate-400">{booked} booked</span>
                    )}
                    {isFull ? (
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Full</span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Open</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer — any time option */}
        <div className="flex-shrink-0 border-t border-slate-100 px-3 py-2.5">
          <button
            onClick={onAnyTime}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Book at any time
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Doctor View (multi-column) ───────────────────────────────────────────────

interface DoctorViewProps {
  doctors: Doctor[];
  date: string;
  appointments: Appointment[];
  filterTypes: string[];
  paidIds: Set<string>;
  onClickSlot: (doctorId: string, slot: SlotBlock) => void;
  onClickAppt: (appt: Appointment, e: React.MouseEvent) => void;
}

function DoctorViewPanel({ doctors, date, appointments, filterTypes, paidIds, onClickSlot, onClickAppt }: DoctorViewProps) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0 grid gap-4 auto-rows-min" style={{ gridTemplateColumns: `repeat(${Math.min(doctors.length, 4)}, minmax(0, 1fr))` }}>
      {doctors.map(doc => {
        const slots = doc.timings.flatMap(t => generateSlots(t, date));
        const docAppts = appointments.filter(a => a.doctorId === doc.id && a.date === date);
        return (
          <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="font-bold text-slate-900 text-sm">{doc.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{doc.specialties[0] ?? "—"}</p>
              <p className="text-[10px] font-bold text-[#4982CF] mt-0.5">{docAppts.length} booked · {slots.length} slots</p>
            </div>
            {slots.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-300">No schedule today</div>
            ) : (
              slots.map(slot => {
                const slotAppts = docAppts.filter(a => a.slotStart === slot.start);
                return (
                  <SlotRow
                    key={slot.timingId + slot.start}
                    slot={slot}
                    appts={slotAppts}
                    filterTypes={filterTypes}
                    paidIds={paidIds}
                    onClickEmpty={() => onClickSlot(doc.id, slot)}
                    onClickAppt={onClickAppt}
                  />
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Counselling View ─────────────────────────────────────────────────────────

function getHealthRecordStatus(apptId: string): "not-started" | "in-progress" | "completed" {
  const signed = readSignedRecords(apptId);
  let sessionIdx = signed.length;
  try {
    const stored = localStorage.getItem(`appt_note_session_${apptId}`);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (Number.isFinite(parsed) && parsed >= 0) sessionIdx = parsed;
    }
  } catch { /**/ }
  if (hasSoapDraft(`${apptId}_n${sessionIdx}`)) return "in-progress";
  if (signed.length > 0) return "completed";
  return "not-started";
}

const HEALTH_RECORD_STATUS_CONFIG = {
  "not-started": { label: "Not Started", cls: "bg-slate-100 text-slate-500 border-slate-200",  Icon: Minus         },
  "in-progress":  { label: "In Progress", cls: "bg-amber-50  text-amber-700  border-amber-200",  Icon: PenLine       },
  "completed":    { label: "Completed",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
} as const;

const COUNSELLING_STATUS_CONFIG: Record<ApptStatus, { label: string; cls: string }> = {
  booked:      { label: "Booked",      cls: "bg-blue-50    text-blue-700    border-blue-200"    },
  confirmed:   { label: "Confirmed",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  checked_in:  { label: "Checked In",  cls: "bg-teal-50    text-teal-700    border-teal-200"    },
  cancelled:   { label: "Cancelled",   cls: "bg-slate-100  text-slate-500   border-slate-200"   },
  no_show:     { label: "No Show",     cls: "bg-red-50     text-red-600     border-red-200"     },
  rescheduled: { label: "Rescheduled", cls: "bg-amber-50   text-amber-700   border-amber-200"   },
  checked_out: { label: "Checked Out", cls: "bg-violet-50  text-violet-700  border-violet-200"  },
};

const COUNSELLING_PRIORITY_CONFIG: Record<"normal" | "urgent" | "emergency", { label: string; cls: string }> = {
  normal:    { label: "Normal",    cls: "bg-slate-100 text-slate-500 border-slate-200" },
  urgent:    { label: "Urgent",    cls: "bg-amber-50  text-amber-700 border-amber-200" },
  emergency: { label: "Emergency", cls: "bg-red-50    text-red-600   border-red-200"   },
};

const WAIT_STOPPED_KEY = "appt-vitals-wait-stopped";

function getVitalsCompletedAt(apptId: string): number | null {
  try {
    const raw = localStorage.getItem("appt-vitals-records");
    if (!raw) return null;
    const records = JSON.parse(raw) as Array<{ apptId?: string; completedAt: number }>;
    const matches = records.filter(r => r.apptId === apptId);
    if (matches.length === 0) return null;
    return Math.max(...matches.map(r => r.completedAt));
  } catch { return null; }
}

function readWaitStopTimes(): Record<string, number> {
  try {
    const raw = localStorage.getItem(WAIT_STOPPED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeWaitStopTime(apptId: string, ts: number): void {
  try {
    const map = readWaitStopTimes();
    if (map[apptId]) return;
    map[apptId] = ts;
    localStorage.setItem(WAIT_STOPPED_KEY, JSON.stringify(map));
  } catch { /**/ }
}

function resolveStopTime(apptId: string): number | null {
  const status = getHealthRecordStatus(apptId);
  if (status === "not-started") return null;
  if (status === "completed") {
    const signed = readSignedRecords(apptId);
    const timestamps = signed
      .map(r => (r as { signedAt?: number }).signedAt)
      .filter((t): t is number => typeof t === "number");
    if (timestamps.length > 0) return Math.min(...timestamps);
  }
  return Date.now();
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function CounsellingView({ appointments, onOpenFacesheet }: { appointments: Appointment[]; onOpenFacesheet: (appt: Appointment) => void }) {
  const sorted = [...appointments].sort((a, b) => a.slotStart.localeCompare(b.slotStart));
  const [now, setNow] = useState(() => Date.now());
  const [stopTimes, setStopTimes] = useState<Record<string, number>>(readWaitStopTimes);

  useEffect(() => {
    setStopTimes(prev => {
      let changed = false;
      const next = { ...prev };
      for (const appt of sorted) {
        if (next[appt.id]) continue;
        const vitalsAt = getVitalsCompletedAt(appt.id);
        if (!vitalsAt) continue;
        const stopAt = resolveStopTime(appt.id);
        if (stopAt !== null) {
          next[appt.id] = stopAt;
          writeWaitStopTime(appt.id, stopAt);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setStopTimes(prev => {
        let changed = false;
        const next = { ...prev };
        for (const appt of sorted) {
          if (next[appt.id]) continue;
          const vitalsAt = getVitalsCompletedAt(appt.id);
          if (!vitalsAt) continue;
          const stopAt = resolveStopTime(appt.id);
          if (stopAt !== null) {
            next[appt.id] = stopAt;
            writeWaitStopTime(appt.id, stopAt);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted.map(a => a.id).join(",")]);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <ClipboardList className="h-12 w-12 text-slate-200 mb-4" />
        <p className="text-lg font-bold text-slate-400">No appointments today</p>
        <p className="text-sm text-slate-300 mt-1">No patients are scheduled for today's consultations.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">Slot / Time</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Patient Name</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">Appointment ID</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">Appointment Type</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Priority</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">Waiting Time</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">Patient Status</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">Health Record</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Action</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((appt, idx) => {
            const statusCfg   = COUNSELLING_STATUS_CONFIG[appt.status];
            const priorityCfg = COUNSELLING_PRIORITY_CONFIG[appt.priority];
            return (
              <tr
                key={appt.id}
                className={`border-b border-slate-100 transition-colors hover:bg-slate-50/60 ${idx % 2 !== 0 ? "bg-slate-50/30" : ""}`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-semibold text-slate-700">{appt.slotStart}</span>
                  <span className="text-slate-400 mx-1">–</span>
                  <span className="text-slate-500">{appt.slotEnd}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800 leading-tight">{appt.patientName}</p>
                  {appt.patientMrn && (
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">{appt.patientMrn}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-slate-500">APT-{appt.id.slice(-5).toUpperCase()}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {appt.type || <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${priorityCfg.cls}`}>
                    {priorityCfg.label}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {(() => {
                    const vitalsAt = getVitalsCompletedAt(appt.id);
                    if (!vitalsAt) return <span className="text-slate-300">—</span>;
                    const stopAt = stopTimes[appt.id] ?? null;
                    const hrDone = stopAt !== null;
                    const effectiveEnd = stopAt ?? now;
                    const ms = effectiveEnd - vitalsAt;
                    const activeColor = ms > 30 * 60 * 1000 ? "text-red-600" : ms > 15 * 60 * 1000 ? "text-amber-600" : "text-emerald-600";
                    return (
                      <span className={`flex items-center gap-1 text-xs font-semibold ${hrDone ? "text-slate-400" : activeColor}`}>
                        <Clock className="h-3 w-3 flex-none" />
                        {formatElapsed(ms)}
                        {hrDone && <span className="text-[10px] font-normal text-slate-400 ml-0.5">(final)</span>}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.cls}`}>
                    {statusCfg.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const hrStatus = getHealthRecordStatus(appt.id);
                    const { label, cls, Icon } = HEALTH_RECORD_STATUS_CONFIG[hrStatus];
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
                        <Icon className="h-3 w-3" />{label}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onOpenFacesheet(appt)}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-[#4982CF]/40 bg-white text-[#4982CF] hover:bg-blue-50 hover:border-[#4982CF] text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    <BookOpen className="h-3.5 w-3.5" /> Open Facesheet
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Nursing Priority View ────────────────────────────────────────────────────

const NURSING_MAX_QUEUE = 10;
const NURSING_QUEUE_WEIGHT = 5;
const NURSING_TIME_WEIGHT = 1;
const NURSING_MAX_WAIT_MIN = 120;

const PRIORITY_BONUS: Record<Appointment["priority"], number> = {
  emergency: 30,
  urgent: 15,
  normal: 0,
};

function computeNursingPriority(
  appt: Appointment,
  doctorQueueCount: number,
  nowMs: number,
): number | null {
  if (getVitalsCompletedAt(appt.id) !== null) return null;
  const waitMs = appt.checkedInAt ? Math.max(0, nowMs - appt.checkedInAt) : 0;
  const waitMin = Math.min(waitMs / 60_000, NURSING_MAX_WAIT_MIN);
  const queueUrgency = (NURSING_MAX_QUEUE - Math.min(doctorQueueCount, NURSING_MAX_QUEUE)) * NURSING_QUEUE_WEIGHT;
  return queueUrgency + waitMin * NURSING_TIME_WEIGHT + PRIORITY_BONUS[appt.priority];
}

const NURSING_PRIORITY_CFG: Record<Appointment["priority"], { label: string; cls: string }> = {
  emergency: { label: "Emergency", cls: "bg-red-50 text-red-700 border-red-300" },
  urgent:    { label: "Urgent",    cls: "bg-amber-50 text-amber-700 border-amber-300" },
  normal:    { label: "Normal",    cls: "bg-slate-50 text-slate-500 border-slate-200" },
};

function NursingView({
  appointments,
  doctors,
  onOpenVitals,
}: {
  appointments: Appointment[];
  doctors: Doctor[];
  onOpenVitals: (appt: Appointment) => void;
}) {
  const todayCheckedIn = useMemo(
    () => appointments.filter(a => a.date === todayStr() && a.status === "checked_in"),
    [appointments],
  );

  const [now, setNow] = useState(() => Date.now());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const secId = setInterval(() => setNow(Date.now()), 1000);
    const sortId = setInterval(() => setTick(t => t + 1), 30_000);
    return () => { clearInterval(secId); clearInterval(sortId); };
  }, []);

  const doctorMap = useMemo(
    () => Object.fromEntries(doctors.map(d => [d.id, d.name])),
    [doctors],
  );

  const { ranked, done } = useMemo(() => {
    const vitalsSet = new Set(
      todayCheckedIn.filter(a => getVitalsCompletedAt(a.id) !== null).map(a => a.id),
    );
    const queueCount: Record<string, number> = {};
    for (const a of todayCheckedIn) {
      if (!vitalsSet.has(a.id)) {
        queueCount[a.doctorId] = (queueCount[a.doctorId] ?? 0) + 1;
      }
    }
    const pending: Array<{ appt: Appointment; score: number }> = [];
    const completed: Appointment[] = [];
    for (const appt of todayCheckedIn) {
      const score = computeNursingPriority(appt, queueCount[appt.doctorId] ?? 0, now);
      if (score === null) { completed.push(appt); }
      else { pending.push({ appt, score }); }
    }
    pending.sort((a, b) => b.score - a.score);
    return { ranked: pending, done: completed };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayCheckedIn, tick, now]);

  const [doneOpen, setDoneOpen] = useState(false);

  if (todayCheckedIn.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <Activity className="h-12 w-12 text-slate-200 mb-4" />
        <p className="text-lg font-bold text-slate-400">No checked-in patients</p>
        <p className="text-sm text-slate-300 mt-1">Patients will appear here once they check in.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-auto">
      {/* Ranked table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#4982CF]" />
          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Vitals Queue — Priority Order</span>
          <span className="ml-auto text-xs text-slate-400">{ranked.length} waiting</span>
        </div>
        {ranked.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">All checked-in patients have vitals recorded.</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 w-10">#</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Patient</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Doctor</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">Appt ID</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">Appt Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">Waiting</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">Dr Queue</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Score</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ appt, score }, idx) => {
                const waitMs = appt.checkedInAt ? Math.max(0, now - appt.checkedInAt) : null;
                const waitMin = waitMs !== null ? waitMs / 60_000 : null;
                const waitColor = waitMin === null ? "text-slate-300"
                  : waitMin > 45 ? "text-red-600 font-semibold"
                  : waitMin > 20 ? "text-amber-600 font-semibold"
                  : "text-emerald-600";
                const pCfg = NURSING_PRIORITY_CFG[appt.priority];
                return (
                  <tr
                    key={appt.id}
                    className={`border-b border-slate-100 transition-colors hover:bg-slate-50/60 ${idx % 2 !== 0 ? "bg-slate-50/30" : ""}`}
                  >
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? "bg-[#4982CF] text-white" : "bg-slate-100 text-slate-500"}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 leading-tight">{appt.patientName}</p>
                      {appt.patientMrn && <p className="text-xs text-slate-400 mt-0.5 font-mono">{appt.patientMrn}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {doctorMap[appt.doctorId] ?? appt.doctorId}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-slate-500">APT-{appt.id.slice(-5).toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {appt.type || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${pCfg.cls}`}>
                        {pCfg.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-xs ${waitColor}`}>
                      {waitMs !== null ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-none" />
                          {formatElapsed(waitMs)}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-600">
                      {(() => {
                        const count = ranked.filter(r => r.appt.doctorId === appt.doctorId).length;
                        return (
                          <span className={`font-semibold ${count >= 5 ? "text-red-500" : count >= 3 ? "text-amber-500" : "text-slate-600"}`}>
                            {count}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{score.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onOpenVitals(appt)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-[#4982CF]/40 bg-white text-[#4982CF] hover:bg-blue-50 hover:border-[#4982CF] text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        <Heart className="h-3.5 w-3.5" /> Call for Vitals
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Vitals Complete accordion */}
      {done.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <button
            onClick={() => setDoneOpen(o => !o)}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-left"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Vitals Complete</span>
            <span className="ml-1 text-xs text-slate-400">{done.length} patient{done.length !== 1 ? "s" : ""}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 ml-auto transition-transform ${doneOpen ? "rotate-180" : ""}`} />
          </button>
          {doneOpen && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400">Patient</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400">Doctor</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 whitespace-nowrap">Appt ID</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400">Priority</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 whitespace-nowrap">Vitals At</th>
                </tr>
              </thead>
              <tbody>
                {done.map((appt, idx) => {
                  const vitalsAt = getVitalsCompletedAt(appt.id);
                  const pCfg = NURSING_PRIORITY_CFG[appt.priority];
                  return (
                    <tr key={appt.id} className={`border-b border-slate-100 ${idx % 2 !== 0 ? "bg-slate-50/30" : ""}`}>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-slate-700 leading-tight">{appt.patientName}</p>
                        {appt.patientMrn && <p className="text-xs text-slate-400 font-mono">{appt.patientMrn}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap text-xs">{doctorMap[appt.doctorId] ?? appt.doctorId}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-mono text-slate-400">APT-{appt.id.slice(-5).toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${pCfg.cls}`}>
                          {pCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                        {vitalsAt ? new Date(vitalsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ViewMode = "day" | "week" | "month";
type LayoutMode = "calendar" | "doctor" | "counselling" | "nursing";
type Role = "frontdesk" | "nursing" | "doctor";

interface ApptUiState {
  selectedDoctorId: string;
  selectedDate: string;
  viewMode: ViewMode;
}

function loadUiState(role: Role, fallbackDoctorId: string): ApptUiState {
  try {
    const raw = localStorage.getItem(`ehr-appt-ui-${role}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ApptUiState>;
      return {
        selectedDoctorId: parsed.selectedDoctorId ?? fallbackDoctorId,
        selectedDate: parsed.selectedDate ?? todayStr(),
        viewMode: (parsed.viewMode as ViewMode | undefined) ?? "week",
      };
    }
  } catch {}
  return { selectedDoctorId: fallbackDoctorId, selectedDate: todayStr(), viewMode: "week" };
}

function saveUiState(role: Role, state: ApptUiState) {
  try { localStorage.setItem(`ehr-appt-ui-${role}`, JSON.stringify(state)); } catch {}
}

export function AppointmentFrontDesk({ role, lockedDoctorId }: { role: Role; lockedDoctorId?: string }) {
  const { appointmentDoctors } = useAppointmentDoctors();
  const { appointments, addAppointment, updateAppointment } = useAppointments();
  const { invoices, saveInvoice, paidIds } = useApptInvoices();
  const { toast } = useToast();

  const initialUi = loadUiState(role, appointmentDoctors[0]?.id ?? "");
  // When a doctor is locked, always start from that ID — skip the persisted selection
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    lockedDoctorId !== undefined ? lockedDoctorId : initialUi.selectedDoctorId
  );
  const [selectedDate, setSelectedDate] = useState<string>(initialUi.selectedDate);
  const [viewMode, setViewMode] = useState<ViewMode>(initialUi.viewMode);

  // Re-lock if lockedDoctorId reference changes (e.g. route swap)
  useEffect(() => {
    if (lockedDoctorId !== undefined) setSelectedDoctorId(lockedDoctorId);
  }, [lockedDoctorId]);

  useEffect(() => {
    saveUiState(role, { selectedDoctorId, selectedDate, viewMode });
  }, [role, selectedDoctorId, selectedDate, viewMode]);

  const [layoutMode, setLayoutMode] = useState<LayoutMode>(role === "nursing" ? "nursing" : "calendar");
  const [filterTypes, setFilterTypes] = useState<string[]>([]);

  // Booking drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInitForm, setDrawerInitForm] = useState<Partial<BookingForm>>({});
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);

  // Appointment card
  const [cardState, setCardState] = useState<CardState | null>(null);

  // View drawer (read-only)
  const [viewAppt, setViewAppt] = useState<Appointment | null>(null);

  // Appointment Facesheet (page-replacement, counselling view only)
  const [facesheetAppt, setFacesheetAppt] = useState<Appointment | null>(null);
  // Incremented each time the doctor closes a facesheet so CounsellingView
  // re-mounts and re-reads localStorage, picking up the latest HR status.
  const [counsellingKey, setCounsellingKey] = useState(0);

  // Nursing drawer (nursing role only)
  const [nursingAppt, setNursingAppt] = useState<Appointment | null>(null);
  const autoOpenedRef = useRef(false);

  // Auto-open nursing drawer when URL has ?section= (e.g. from Care Manager card)
  useEffect(() => {
    if (role !== "nursing") return;
    if (autoOpenedRef.current) return;
    const section = new URLSearchParams(window.location.search).get("section");
    if (!section) return;
    if (appointments.length === 0) return;
    autoOpenedRef.current = true;
    const today = todayStr();
    const todayAppts = appointments
      .filter(a => a.date === today && a.status !== "cancelled")
      .sort((a, b) => a.slotStart.localeCompare(b.slotStart));
    const pick = todayAppts[0] ?? appointments.sort((a, b) => a.slotStart.localeCompare(b.slotStart))[0];
    if (pick) setNursingAppt(pick);
  }, [role, appointments]);

  // Invoice billing drawer
  const [invoiceAppt, setInvoiceAppt] = useState<Appointment | null>(null);
  const [invoiceFullscreen, setInvoiceFullscreen] = useState(false);
  const [invoiceReceipt, setInvoiceReceipt] = useState<ReceiptInfo | null>(null);

  // Month View day-detail overlay
  const [monthOverlayDate, setMonthOverlayDate] = useState<string | null>(null);

  // Month View slot picker
  const [monthSlotPickerDate, setMonthSlotPickerDate] = useState<string | null>(null);

  const selectedDoctor = appointmentDoctors.find(d => d.id === selectedDoctorId) ?? appointmentDoctors[0] ?? null;

  // Appointment type filter chips — scoped to the active doctor in calendar mode,
  // or the union of all doctors' services in doctor-layout mode.
  const allTypes = useMemo(() => {
    const types = new Set<string>();
    if (layoutMode === "doctor") {
      appointmentDoctors.forEach(d => d.services.forEach(s => types.add(s)));
    } else {
      const activeDoc = appointmentDoctors.find(d => d.id === selectedDoctorId);
      (activeDoc?.services ?? []).forEach(s => types.add(s));
    }
    return Array.from(types);
  }, [appointmentDoctors, layoutMode, selectedDoctorId]);

  // Doctors grouped by primary (first) specialty for the dropdown.
  // Each doctor appears exactly once, under their primary specialty.
  // Doctors with multiple specialties show the extra ones as a subtitle inside the item.
  const doctorsByPrimarySpecialty = useMemo(() => {
    const map = new Map<string, typeof appointmentDoctors>();
    for (const doc of appointmentDoctors) {
      const primary = doc.specialties[0] ?? "General / Other";
      if (!map.has(primary)) map.set(primary, []);
      map.get(primary)!.push(doc);
    }
    // Sort doctors within each group alphabetically by name
    for (const docs of map.values()) {
      docs.sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === "General / Other") return 1;
      if (b === "General / Other") return -1;
      return a.localeCompare(b);
    });
  }, [appointmentDoctors]);

  // Stats — counselling mode is today-locked; doctor mode shows all doctors for selected date
  const stats = useMemo(() => {
    const statsDate = layoutMode === "counselling" ? todayStr() : selectedDate;
    const dayAppts = appointments.filter(a =>
      (layoutMode === "doctor" || a.doctorId === selectedDoctorId) &&
      a.date === statsDate
    );
    const counts: Record<ApptStatus, number> = {
      booked: 0, confirmed: 0, checked_in: 0, cancelled: 0,
      no_show: 0, rescheduled: 0, checked_out: 0,
    };
    dayAppts.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return { total: dayAppts.length, counts };
  }, [appointments, selectedDoctorId, selectedDate, layoutMode]);

  // Week days (for week view)
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  function navigate(dir: -1 | 1) {
    if (viewMode === "day")   setSelectedDate(d => addDays(d, dir));
    if (viewMode === "week")  setSelectedDate(d => addDays(d, dir * 7));
    if (viewMode === "month") {
      const [y, m] = selectedDate.split("-").map(Number);
      const next = new Date(y, m - 1 + dir, 1);
      setSelectedDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`);
    }
  }

  function openBooking(init: Partial<BookingForm>, edit?: Appointment) {
    setDrawerInitForm(init);
    setEditAppt(edit ?? null);
    setDrawerOpen(true);
  }

  function handleSave(form: BookingForm) {
    // ── Slot-capacity enforcement ──────────────────────────────────────────────
    // Look up allowMultiple from the doctor's timing configuration (source of truth).
    const doctor = appointmentDoctors.find(d => d.id === form.doctorId);
    if (doctor) {
      const slots = doctor.timings.flatMap(t => generateSlots(t, form.date));
      const matchSlot = slots.find(s => s.start === form.slotStart);
      if (matchSlot && !matchSlot.allowMultiple) {
        // Count existing, non-cancelled appointments in this slot (exclude the one being edited).
        const conflict = appointments.filter(a =>
          a.doctorId === form.doctorId &&
          a.date     === form.date &&
          a.slotStart === form.slotStart &&
          a.status !== "cancelled" &&
          a.status !== "no_show" &&
          (!editAppt || a.id !== editAppt.id)
        );
        if (conflict.length > 0) {
          toast({
            title: "Slot unavailable",
            description: "This slot only allows one booking. Please choose a different time.",
            variant: "destructive",
          });
          return;
        }
      }
    }
    // ── Persist ───────────────────────────────────────────────────────────────
    if (editAppt) {
      updateAppointment(editAppt.id, { ...form });
      toast({ title: "Appointment updated", description: `${form.patientName} — ${form.slotStart}` });
    } else {
      const appt: Appointment = {
        id: uid(),
        ...form,
        status: "booked",
        createdAt: new Date().toISOString(),
      };
      addAppointment(appt);
      toast({ title: "Appointment booked", description: `${form.patientName} — ${form.slotStart}` });
    }
    setDrawerOpen(false);
    setEditAppt(null);
  }

  function handleApptClick(appt: Appointment, e: React.MouseEvent) {
    e.stopPropagation();
    setCardState({ appt, x: e.clientX + 10, y: e.clientY - 10 });
  }

  function dateLabel() {
    if (viewMode === "day")   return formatDateFull(selectedDate);
    if (viewMode === "week") {
      const [first, last] = [weekDays[0], weekDays[6]];
      return `${formatDateShort(first)} – ${formatDateShort(last)}`;
    }
    const [y, m] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function toggleType(t: string) {
    setFilterTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  const STAT_ITEMS: { key: ApptStatus; short: string }[] = [
    { key: "booked",      short: "Booked"      },
    { key: "confirmed",   short: "Confirmed"   },
    { key: "checked_in",  short: "Checked In"  },
    { key: "cancelled",   short: "Cancelled"   },
    { key: "no_show",     short: "No Show"     },
    { key: "checked_out", short: "Checked Out" },
  ];

  // ── Facesheet page-replacement (counselling view) ──────────────────────────
  if (facesheetAppt) {
    const doctorName = appointmentDoctors.find(d => d.id === facesheetAppt.doctorId)?.name ?? "Doctor";
    return (
      <ApptFaceSheet
        appt={facesheetAppt}
        doctorName={doctorName}
        onBack={() => { setFacesheetAppt(null); setCounsellingKey(k => k + 1); }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <QueueAppHeader />

      {/* Control Bar */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3 shadow-sm">
        {/* Role badge */}
        {role === "frontdesk" ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex-shrink-0 select-none">
            <Calendar className="h-3 w-3" />
            Front Desk
          </span>
        ) : role === "nursing" ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-600 text-xs font-semibold flex-shrink-0 select-none">
            <Heart className="h-3 w-3" />
            Nursing
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold flex-shrink-0 select-none">
            <Stethoscope className="h-3 w-3" />
            Doctor
          </span>
        )}
        {/* Doctor selector (only in calendar mode) */}
        {layoutMode === "calendar" && (
          role === "doctor" ? (
            <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-700 font-medium flex-shrink-0 select-none">
              <Stethoscope className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
              {appointmentDoctors.find(d => d.id === selectedDoctorId)?.name ?? selectedDoctorId}
            </span>
          ) : (
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
              <SelectTrigger className="h-9 w-60 text-sm border-slate-200 flex-shrink-0">
                <Stethoscope className="h-3.5 w-3.5 text-[#4982CF] mr-1.5 flex-shrink-0" />
                <SelectValue placeholder="Select doctor..." />
              </SelectTrigger>
              <SelectContent>
                {appointmentDoctors.length === 0 && (
                  <SelectItem value="__none" disabled>No appointment doctors</SelectItem>
                )}
                {doctorsByPrimarySpecialty.map(([specialty, docs], idx) => (
                  <React.Fragment key={specialty}>
                    {idx > 0 && <SelectSeparator />}
                    <SelectGroup>
                      <SelectLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-1.5">
                        {specialty}
                      </SelectLabel>
                      {docs.map(d => (
                        <SelectItem
                          key={d.id}
                          value={d.id}
                          textValue={d.name}
                          subtitle={d.specialties.length > 1 ? d.specialties.slice(1).join(" · ") : undefined}
                        >
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          )
        )}

        {/* Status badges — right of Doctor selector */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4982CF]/10 text-xs font-bold text-[#4982CF]">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            {stats.total}
          </div>
          {STAT_ITEMS.filter(({ key }) => stats.counts[key] > 0).length === 0 ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 flex-shrink-0" />
              No appointments
            </div>
          ) : (
            STAT_ITEMS.filter(({ key }) => stats.counts[key] > 0).map(({ key, short }) => {
              const sc = STATUS_CONFIG[key];
              return (
                <div key={key} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${sc.bg} ${sc.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                  {stats.counts[key]} {short}
                </div>
              );
            })
          )}
        </div>

        {/* Layout mode + Print + Quick Add — pushed to far right */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {/* Calendar / Doctor / Counselling View toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setLayoutMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-r border-slate-200 transition-colors ${layoutMode === "calendar" ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Calendar className="h-3.5 w-3.5" /> Calendar
            </button>
            {role === "frontdesk" && (
              <button
                onClick={() => setLayoutMode("doctor")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors border-r border-slate-200 ${layoutMode === "doctor" ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <Columns2 className="h-3.5 w-3.5" /> Doctor
              </button>
            )}
            {role === "doctor" && (
              <button
                onClick={() => setLayoutMode("counselling")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${layoutMode === "counselling" ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <ClipboardList className="h-3.5 w-3.5" /> Counselling View
              </button>
            )}
            {role === "nursing" && (
              <button
                onClick={() => setLayoutMode("nursing")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${layoutMode === "nursing" ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <Activity className="h-3.5 w-3.5" /> Priority View
              </button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-slate-500 hover:text-slate-700"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            className="h-9 bg-[#4982CF] hover:bg-[#3D73BC] text-white text-sm gap-2"
            onClick={() => openBooking({ doctorId: selectedDoctorId, date: selectedDate })}
          >
            <Plus className="h-4 w-4" /> Quick Add
          </Button>
        </div>
      </div>

      {/* Sub-bar: Type filters (left) + Date/View nav (right) — hidden in Counselling View */}
      {layoutMode !== "counselling" && layoutMode !== "nursing" && <div className="bg-white border-b border-slate-100 px-5 py-0 flex items-center gap-2 min-h-[40px]">
        {/* Type filter chips — left side */}
        {allTypes.length > 0 ? (
          <div className="flex items-center gap-1.5 py-2 flex-shrink-0">
            {allTypes.map(t => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${filterTypes.includes(t) ? "bg-[#4982CF] text-white border-[#4982CF]" : "bg-white text-slate-500 border-slate-200 hover:border-[#4982CF]"}`}
              >
                {t}
              </button>
            ))}
            {filterTypes.length > 0 && (
              <button onClick={() => setFilterTypes([])} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5 ml-1">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        ) : (
          <div />
        )}

        {/* Date nav + View mode — right side */}
        <div className="ml-auto flex items-center gap-2 py-1 flex-shrink-0">
          {/* Date navigation */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="px-3 text-sm font-semibold text-slate-700 min-w-[200px] text-center">
              {dateLabel()}
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200" onClick={() => navigate(1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs font-semibold text-slate-500 hover:text-slate-700"
              onClick={() => setSelectedDate(todayStr())}
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Today
            </Button>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Day / Week / Month toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(["day", "week", "month"] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1 text-xs font-bold capitalize transition-colors border-r border-slate-200 last:border-0
                  ${viewMode === v ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>}

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-4 pt-3 pb-3">
        {appointmentDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Stethoscope className="h-12 w-12 text-slate-200 mb-4" />
            <p className="text-lg font-bold text-slate-400">No appointment doctors configured</p>
            <p className="text-sm text-slate-300 mt-1">Go to Admin → Doctors and add doctors with type "Appointment".</p>
          </div>
        ) : layoutMode === "doctor" ? (
          <DoctorViewPanel
            doctors={lockedDoctorId ? appointmentDoctors.filter(d => d.id === lockedDoctorId) : appointmentDoctors}
            date={selectedDate}
            appointments={appointments}
            filterTypes={filterTypes}
            paidIds={paidIds}
            onClickSlot={(doctorId, slot) => openBooking({ doctorId, date: selectedDate, slotStart: slot.start, slotEnd: slot.end })}
            onClickAppt={handleApptClick}
          />
        ) : layoutMode === "counselling" && role === "doctor" ? (
          <CounsellingView
            key={counsellingKey}
            appointments={appointments.filter(a =>
              a.date === todayStr() && a.doctorId === selectedDoctorId
            )}
            onOpenFacesheet={setFacesheetAppt}
          />
        ) : layoutMode === "nursing" && role === "nursing" ? (
          <NursingView
            appointments={appointments}
            doctors={appointmentDoctors}
            onOpenVitals={setNursingAppt}
          />
        ) : !selectedDoctor ? (
          <div className="text-center py-20 text-slate-400">Select a doctor to view their calendar.</div>
        ) : viewMode === "day" ? (
          <DayView
            doctor={selectedDoctor}
            date={selectedDate}
            appointments={appointments}
            filterTypes={filterTypes}
            paidIds={paidIds}
            onClickSlot={slot => openBooking({ doctorId: selectedDoctor.id, date: selectedDate, slotStart: slot.start, slotEnd: slot.end })}
            onClickAppt={handleApptClick}
          />
        ) : viewMode === "week" ? (
          <WeekView
            doctor={selectedDoctor}
            weekDays={weekDays}
            appointments={appointments}
            filterTypes={filterTypes}
            paidIds={paidIds}
            onClickSlot={(date, slot) => {
              setSelectedDate(date);
              openBooking({ doctorId: selectedDoctor.id, date, slotStart: slot.start, slotEnd: slot.end });
            }}
            onClickAppt={handleApptClick}
          />
        ) : (
          <MonthView
            date={selectedDate}
            doctor={selectedDoctor}
            appointments={appointments}
            filterTypes={filterTypes}
            selectedDate={selectedDate}
            onSelectDate={d => setSelectedDate(d)}
            onClickAppt={handleApptClick}
            onBookDate={d => { setSelectedDate(d); setMonthSlotPickerDate(d); }}
            onClickMore={d => { setSelectedDate(d); setMonthOverlayDate(d); }}
          />
        )}
      </div>

      {/* Booking Drawer */}
      {drawerOpen && (
        <BookingDrawer
          doctors={appointmentDoctors}
          init={drawerInitForm}
          editAppt={editAppt}
          onSave={handleSave}
          onClose={() => { setDrawerOpen(false); setEditAppt(null); }}
        />
      )}

      {/* Appointment Card */}
      {cardState && (
        <AppointmentCard
          state={cardState}
          isPaid={paidIds.has(cardState.appt.id)}
          role={role}
          onClose={() => setCardState(null)}
          onView={appt => setFacesheetAppt(appt)}
          onEdit={appt => openBooking({}, appt)}
          onStatusChange={(id, status) => {
            updateAppointment(id, { status, ...(status === "checked_in" ? { checkedInAt: Date.now() } : {}) });
            toast({ title: "Status updated", description: STATUS_CONFIG[status].label });
          }}
          onInvoice={appt => {
            setCardState(null);
            const existing = invoices[appt.id];
            if (existing) {
              setInvoiceAppt(appt);
              setInvoiceReceipt(existing);
            } else {
              setInvoiceAppt(appt);
              setInvoiceFullscreen(false);
              setInvoiceReceipt(null);
            }
          }}
          onNursing={appt => setNursingAppt(appt)}
        />
      )}

      {/* Nursing Drawer (nursing role only) */}
      {role === "nursing" && nursingAppt && (
        <ApptNursingDrawer
          appt={nursingAppt}
          onClose={() => setNursingAppt(null)}
          initialCategory={(() => {
            const s = new URLSearchParams(window.location.search).get("section");
            const valid: NurseCategory[] = ["vitals", "history", "procedures", "care-plan", "goals", "triage"];
            return (valid.includes(s as NurseCategory) ? s as NurseCategory : undefined);
          })()}
        />
      )}

      {/* Invoice Billing Drawer */}
      {invoiceAppt && !invoiceReceipt && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setInvoiceAppt(null)} />
          <div className={`relative flex flex-col bg-white shadow-2xl border-l border-slate-200 transition-all duration-300 ${invoiceFullscreen ? "w-full" : "w-[40%] min-w-[520px]"}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white flex-shrink-0">
              <div>
                <p className="text-sm font-bold text-slate-900">{invoiceAppt.patientName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{invoiceAppt.patientMrn || invoiceAppt.patientPhone || ""}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setInvoiceFullscreen(f => !f)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                  {invoiceFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button onClick={() => setInvoiceAppt(null)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <BillingContent
                entry={{
                  tokenLabel: `APT-${invoiceAppt.id.slice(-5).toUpperCase()}`,
                  patient: {
                    name: invoiceAppt.patientName,
                    mrn: invoiceAppt.patientMrn || undefined,
                    phone: invoiceAppt.patientPhone || undefined,
                  },
                }}
                onComplete={r => {
                  setInvoiceReceipt(r);
                  if (invoiceAppt) {
                    saveInvoice(invoiceAppt.id, r);
                    if (invoiceAppt.status === "booked" || invoiceAppt.status === "confirmed") {
                      updateAppointment(invoiceAppt.id, { status: "checked_in", checkedInAt: Date.now() });
                    }
                  }
                }}
                isFullscreen={invoiceFullscreen}
              />
            </div>
          </div>
        </div>
      )}

      {/* Invoice Receipt Card */}
      {invoiceReceipt && invoiceAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => { setInvoiceReceipt(null); setInvoiceAppt(null); }} />
          <div className="relative z-10 w-80 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-3">
            <div className="h-1.5 w-full bg-green-500" />
            <div className="flex justify-end px-3 pt-3">
              <button onClick={() => { setInvoiceReceipt(null); setInvoiceAppt(null); }}
                className="h-6 w-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X className="h-3 w-3 text-slate-500" />
              </button>
            </div>
            <div className="flex flex-col items-center pb-4 px-4 -mt-1">
              <div className="h-10 w-10 rounded-xl bg-[#4982CF] flex items-center justify-center mb-2 shadow-md">
                <span className="text-white font-black text-sm">N</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">NovaDoc · Invoice Finalized</p>
              <p className="font-mono font-black text-[#4982CF] text-4xl leading-none tracking-tight">{invoiceReceipt.tokenNumber}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <p className="text-[10px] font-semibold text-green-600">Payment collected successfully</p>
              </div>
            </div>
            <div className="px-4 pb-4 space-y-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-900">{invoiceReceipt.patientName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{invoiceReceipt.invNo}</p>
                  </div>
                  <p className="text-base font-black text-slate-900">Rs. {invoiceReceipt.total.toLocaleString("en-PK")}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => printThermalReceipt(invoiceReceipt)}
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#4982CF] text-white text-xs font-bold hover:bg-blue-600 transition-colors">
                  <Printer className="h-3.5 w-3.5" /> Print Receipt
                </button>
                <button onClick={() => printThermalReceipt(invoiceReceipt)}
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
                  <Receipt className="h-3.5 w-3.5" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Drawer (read-only) */}
      {viewAppt && (
        <ViewDrawer
          appt={viewAppt}
          doctorName={appointmentDoctors.find(d => d.id === viewAppt.doctorId)?.name ?? "Unknown Doctor"}
          role={role}
          onClose={() => setViewAppt(null)}
          onEdit={() => { openBooking({}, viewAppt); setViewAppt(null); }}
        />
      )}

      {/* Month View Slot Picker */}
      {monthSlotPickerDate && selectedDoctor && (
        <MonthSlotPicker
          date={monthSlotPickerDate}
          doctor={selectedDoctor}
          appointments={appointments}
          onSelectSlot={slot => {
            openBooking({ doctorId: selectedDoctor.id, date: monthSlotPickerDate, slotStart: slot.start, slotEnd: slot.end });
            setMonthSlotPickerDate(null);
          }}
          onAnyTime={() => {
            openBooking({ doctorId: selectedDoctor.id, date: monthSlotPickerDate });
            setMonthSlotPickerDate(null);
          }}
          onClose={() => setMonthSlotPickerDate(null)}
        />
      )}

      {/* Month View Day Detail Overlay */}
      {monthOverlayDate && selectedDoctor && (
        <MonthDayOverlay
          date={monthOverlayDate}
          doctor={selectedDoctor}
          appointments={appointments}
          filterTypes={filterTypes}
          paidIds={paidIds}
          onClickAppt={(appt, e) => { setMonthOverlayDate(null); handleApptClick(appt, e); }}
          onBook={() => openBooking({ doctorId: selectedDoctor.id, date: monthOverlayDate })}
          onClose={() => setMonthOverlayDate(null)}
        />
      )}
    </div>
  );
}
