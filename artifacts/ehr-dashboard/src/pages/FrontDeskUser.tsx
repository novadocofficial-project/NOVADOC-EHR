import React, { useState, useEffect, useRef } from "react";
import {
  PhoneCall, UserCheck, CreditCard, SkipForward, RotateCcw,
  ChevronUp, ChevronLeft, Clock, User, AlertCircle, CheckCircle2, X,
  Fingerprint, CreditCard as CardIcon, Search,
  Building2, Shield, Heart, FileSignature, Phone, MapPin,
  CalendarDays, Hash, UserPlus, Banknote, RefreshCw,
  Maximize2, Minimize2, Pencil, Check, Eye,
  Stethoscope, TestTube2, Scan, Pill, Package,
  Plus, Minus, Trash2, Receipt, Printer, ArrowRight, Percent, ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueueAppHeader, SEED_PATIENTS, timeAgo, Patient, uid } from "@/pages/QueuePageLayout";
import { useMultiStepQueue, MultiEntry } from "@/hooks/useMultiStepQueue";
import { useRegConfig, type RegField } from "@/hooks/useRegConfig";
import { usePatients } from "@/hooks/usePatients";
import { useBillingCatalogue } from "@/hooks/useBillingCatalogue";
import type { BillCatItem, BillPackage } from "@/hooks/useBillingCatalogue";

// ─── Constants ────────────────────────────────────────────────────────────────

const CALL_WINDOW_SECS = 30;
const MAX_CALLS = 3;

function getSecsLeft(callTimestamp: number | null): number {
  if (!callTimestamp) return 0;
  return Math.max(0, CALL_WINDOW_SECS - Math.floor((Date.now() - callTimestamp) / 1000));
}

function fmt(n: number) { return "Rs. " + n.toLocaleString("en-PK"); }

// ─── Billing Category Styles ──────────────────────────────────────────────────

const CAT_STYLE: Record<string, { color: string; bg: string }> = {
  consultation: { color: "text-[#4982CF]",  bg: "bg-blue-50   border-blue-200"   },
  lab:          { color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  imaging:      { color: "text-teal-700",   bg: "bg-teal-50   border-teal-200"   },
  pharmacy:     { color: "text-green-700",  bg: "bg-green-50  border-green-200"  },
  procedures:   { color: "text-rose-700",   bg: "bg-rose-50   border-rose-200"   },
};

function catIcon(id: string, cls = "h-5 w-5") {
  if (id === "consultation") return <Stethoscope className={cls} />;
  if (id === "lab")          return <TestTube2   className={cls} />;
  if (id === "imaging")      return <Scan        className={cls} />;
  if (id === "pharmacy")     return <Pill        className={cls} />;
  return                            <Heart       className={cls} />;
}

// ─── Right Drawer ─────────────────────────────────────────────────────────────

interface RightDrawerProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  onFullscreenChange?: (fs: boolean) => void;
}

function RightDrawer({ title, subtitle, onClose, children, onFullscreenChange }: RightDrawerProps) {
  const [fullscreen, setFullscreen] = useState(false);
  function toggleFullscreen() {
    const next = !fullscreen;
    setFullscreen(next);
    onFullscreenChange?.(next);
  }
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col transition-all duration-300 ease-in-out border-l border-slate-200 ${fullscreen ? "w-full" : "w-[40%] min-w-[520px]"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900">{title}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleFullscreen}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
      </div>
    </>
  );
}

// ─── Registration Content ─────────────────────────────────────────────────────

type RegMode = "search" | "new";

interface RegistrationContentProps {
  onRegister: (patient: Patient) => void;
  isReassign?: boolean;
  patients: Patient[];
}

// ─── Dynamic New Registration Form ───────────────────────────────────────────

// ─── Step definition ──────────────────────────────────────────────────────────
interface RegStepDef {
  id: string;
  name: string;
  sectionType: "basic-info" | "demographics" | "custom";
  sectionId: string;
}

const REG_DRAFT_KEY = "ehr-reg-form-draft";

function loadRegDraft(): { values: Record<string, string>; step: number } | null {
  try {
    const raw = sessionStorage.getItem(REG_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { values: Record<string, string>; step: number };
  } catch { return null; }
}

function saveRegDraft(values: Record<string, string>, step: number) {
  try { sessionStorage.setItem(REG_DRAFT_KEY, JSON.stringify({ values, step })); } catch { /* noop */ }
}

function clearRegDraft() {
  try { sessionStorage.removeItem(REG_DRAFT_KEY); } catch { /* noop */ }
}

function DynamicRegNewForm({ onRegister, isReassign }: { onRegister: (p: Patient) => void; isReassign: boolean }) {
  const { config } = useRegConfig();
  const draft = loadRegDraft();
  const [values, setValues] = useState<Record<string, string>>(draft?.values ?? {});
  const [drawing, setDrawing] = useState(false);
  const [currentStep, setCurrentStep] = useState(draft?.step ?? 0);
  const [showReview, setShowReview] = useState(false);
  const [showRestoredBanner, setShowRestoredBanner] = useState(!!draft);
  const sigRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  useEffect(() => {
    const hasData = Object.keys(values).some(k => values[k]);
    if (hasData || currentStep > 0) {
      saveRegDraft(values, currentStep);
    }
  }, [values, currentStep]);

  const basicSection = config.sections.find(s => s.sectionType === "basic-info");
  const patientType  = values["_patient_type"] ?? (config.patientTypes.find(t => t.enabled)?.id ?? "cash");
  const activeType   = config.patientTypes.find(t => t.id === patientType && t.enabled);
  const welfareForm  = activeType?.welfareFormId
    ? config.welfareForms.find(f => f.id === activeType.welfareFormId)
    : null;

  const conditionalFieldIds = basicSection?.conditionalRules.flatMap(r => r.showFieldIds) ?? [];
  const enabledTypes = config.patientTypes.filter(t => t.enabled);

  const orderedSections = [...config.sections]
    .filter(s => s.enabled)
    .sort((a, b) => a.workflowOrder - b.workflowOrder);

  // ─── Build step list ───────────────────────────────────────────────────────
  const steps: RegStepDef[] = [];

  // Step 1: Basic Information (always present — includes patient type + extras + welfare)
  const basicInfoSec = orderedSections.find(s => s.sectionType === "basic-info");
  steps.push({
    id: "basic-info",
    name: "Basic Info",
    sectionType: "basic-info",
    sectionId: basicInfoSec?.id ?? "",
  });

  // One step per demographics section (if it has enabled fields)
  for (const sec of orderedSections) {
    if (sec.sectionType === "demographics" && sec.fields.some(f => f.enabled)) {
      steps.push({ id: sec.id, name: sec.name, sectionType: "demographics", sectionId: sec.id });
    }
  }

  // One step per enabled custom section (if it has at least one enabled field or signature)
  for (const sec of orderedSections) {
    if (sec.sectionType === "custom" && (sec.fields.some(f => f.enabled) || sec.signatureRequired)) {
      steps.push({ id: sec.id, name: sec.name, sectionType: "custom", sectionId: sec.id });
    }
  }

  const safeStep   = Math.min(currentStep, steps.length - 1);
  const isLastStep = safeStep === steps.length - 1;
  const stepDef    = steps[safeStep];

  // ─── canSubmit: all steps (gates the final Register button) ───────────────
  const canSubmit = (() => {
    const required: string[] = [];
    if (basicSection) {
      basicSection.fields
        .filter(f => f.enabled && f.required && !conditionalFieldIds.includes(f.id))
        .forEach(f => required.push(f.id));
      basicSection.conditionalRules.forEach(rule => {
        if (rule.triggerValues.includes(values[rule.triggerFieldId] ?? "")) {
          basicSection.fields
            .filter(f => rule.showFieldIds.includes(f.id) && f.enabled && f.required)
            .forEach(f => required.push(f.id));
        }
      });
    }
    (activeType?.extraFields ?? []).filter(f => f.enabled && f.required).forEach(f => required.push(f.id));
    if (patientType === "welfare" && welfareForm) {
      const wfCondIds = (welfareForm.conditionalRules ?? []).flatMap(r => r.showFieldIds);
      const wfVisIds  = (welfareForm.conditionalRules ?? []).flatMap(rule =>
        rule.triggerValues.includes(values[rule.triggerFieldId] ?? "") ? rule.showFieldIds : []
      );
      welfareForm.fields
        .filter(f => f.enabled && f.required && f.type !== "signature" && f.type !== "file" &&
          (!wfCondIds.includes(f.id) || wfVisIds.includes(f.id)))
        .forEach(f => required.push(f.id));
    }
    // Demographics sections
    config.sections.filter(s => s.sectionType === "demographics" && s.enabled).forEach(sec => {
      sec.fields
        .filter(f => f.enabled && f.required && f.type !== "signature" && f.type !== "file")
        .forEach(f => required.push(f.id));
    });
    // Custom sections
    config.sections.filter(s => s.sectionType === "custom" && s.enabled).forEach(sec => {
      const condIds = sec.conditionalRules.flatMap(r => r.showFieldIds);
      const visIds  = sec.conditionalRules.flatMap(rule =>
        rule.triggerValues.includes(values[rule.triggerFieldId] ?? "") ? rule.showFieldIds : []
      );
      sec.fields
        .filter(f => f.enabled && f.required && f.type !== "signature" && f.type !== "file" &&
          (!condIds.includes(f.id) || visIds.includes(f.id)))
        .forEach(f => required.push(f.id));
    });
    return required.every(id => !!(values[id]));
  })();

  // ─── canAdvance: current step only (gates the Next button) ────────────────
  function canAdvance(stepIdx: number): boolean {
    const step = steps[stepIdx];
    if (!step) return true;
    const required: string[] = [];

    if (step.sectionType === "basic-info") {
      if (basicSection) {
        basicSection.fields
          .filter(f => f.enabled && f.required && !conditionalFieldIds.includes(f.id))
          .forEach(f => required.push(f.id));
        basicSection.conditionalRules.forEach(rule => {
          if (rule.triggerValues.includes(values[rule.triggerFieldId] ?? "")) {
            basicSection.fields
              .filter(f => rule.showFieldIds.includes(f.id) && f.enabled && f.required)
              .forEach(f => required.push(f.id));
          }
        });
      }
      (activeType?.extraFields ?? []).filter(f => f.enabled && f.required).forEach(f => required.push(f.id));
      if (patientType === "welfare" && welfareForm) {
        const wfCondIds = (welfareForm.conditionalRules ?? []).flatMap(r => r.showFieldIds);
        const wfVisIds  = (welfareForm.conditionalRules ?? []).flatMap(rule =>
          rule.triggerValues.includes(values[rule.triggerFieldId] ?? "") ? rule.showFieldIds : []
        );
        welfareForm.fields
          .filter(f => f.enabled && f.required && f.type !== "signature" && f.type !== "file" &&
            (!wfCondIds.includes(f.id) || wfVisIds.includes(f.id)))
          .forEach(f => required.push(f.id));
      }
    } else {
      const sec = config.sections.find(s => s.id === step.sectionId);
      if (sec) {
        const condIds = sec.conditionalRules.flatMap(r => r.showFieldIds);
        const visIds  = sec.conditionalRules.flatMap(rule =>
          rule.triggerValues.includes(values[rule.triggerFieldId] ?? "") ? rule.showFieldIds : []
        );
        sec.fields
          .filter(f => f.enabled && f.required && f.type !== "signature" && f.type !== "file" &&
            (!condIds.includes(f.id) || visIds.includes(f.id)))
          .forEach(f => required.push(f.id));
      }
    }
    return required.every(id => !!(values[id]));
  }

  function setVal(id: string, v: string) { setValues(p => ({ ...p, [id]: v })); }

  function handleSubmit() {
    const firstName = values["first_name"] ?? "";
    const lastName  = values["last_name"]  ?? "";
    clearRegDraft();
    onRegister({
      id: uid(),
      mrn: "MR-" + Math.floor(45000 + Math.random() * 5000),
      name: `${firstName} ${lastName}`.trim() || "Patient",
      phone: values["phone"] ?? "",
      dob:   values["dob"]   ?? "",
      gender: values["gender"] === "Female" ? "F" : values["gender"] === "Other" ? "O" : "M",
    });
  }

  function handleStartOver() {
    clearRegDraft();
    setValues({});
    setCurrentStep(0);
    setShowReview(false);
    setShowRestoredBanner(false);
  }

  // ─── Field renderer ────────────────────────────────────────────────────────
  function renderField(field: RegField): React.ReactNode {
    const val = values[field.id] ?? "";
    const lbl = (
      <label className="text-xs font-semibold text-slate-600 mb-1 block">
        {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    );
    if (field.id === "gender") {
      return (
        <div key={field.id}>
          {lbl}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm font-semibold">
            {(["Male", "Female", "Other"] as const).map(opt => (
              <button key={opt} type="button" onClick={() => setVal(field.id, opt)}
                className={`flex-1 py-2 transition-colors ${val === opt ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    }

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
  const canPair = (f: RegField) => SHORT_TYPES.has(f.type) && f.id !== "gender";
  function renderFieldsInGrid(fields: RegField[], keyPrefix = ""): React.ReactNode[] {
    const rows: React.ReactNode[] = [];
    let i = 0;
    while (i < fields.length) {
      const f = fields[i], next = fields[i + 1];
      if (canPair(f) && next && canPair(next)) {
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

  // ─── Render current step content ──────────────────────────────────────────
  function renderStepContent(): React.ReactNode {
    if (!stepDef) return null;

    if (stepDef.sectionType === "basic-info") {
      const blocks: React.ReactNode[] = [];
      if (basicInfoSec) {
        const condIds    = basicInfoSec.conditionalRules.flatMap(r => r.showFieldIds);
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
        const wfCondIds   = (welfareForm.conditionalRules ?? []).flatMap(r => r.showFieldIds);
        const wfNormFlds  = welfareForm.fields.filter(f => f.enabled && !wfCondIds.includes(f.id));
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
      const visIds  = sec.conditionalRules.flatMap(rule =>
        rule.triggerValues.includes(values[rule.triggerFieldId] ?? "") ? rule.showFieldIds : []
      );
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

  // ─── Review summary (read-only, all filled fields grouped by section) ────────
  function renderReviewSummary(): React.ReactNode {
    type SummarySection = { title: string; items: { label: string; value: string }[] };
    const sections: SummarySection[] = [];

    // Basic Info
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

    // Welfare form (respect conditional visibility)
    if (patientType === "welfare" && welfareForm) {
      const wfCondIds = (welfareForm.conditionalRules ?? []).flatMap(r => r.showFieldIds);
      const wfVisIds  = (welfareForm.conditionalRules ?? []).flatMap(rule =>
        rule.triggerValues.includes(values[rule.triggerFieldId] ?? "") ? rule.showFieldIds : []
      );
      const items: { label: string; value: string }[] = [];
      for (const f of welfareForm.fields.filter(f =>
        f.enabled && f.type !== "signature" && f.type !== "file" &&
        (!wfCondIds.includes(f.id) || wfVisIds.includes(f.id))
      )) {
        const v = values[f.id]; if (v) items.push({ label: f.label, value: v });
      }
      if (items.length > 0) sections.push({ title: welfareForm.name, items });
    }

    // Demographics sections
    for (const sec of orderedSections.filter(s => s.sectionType === "demographics")) {
      const items: { label: string; value: string }[] = [];
      for (const f of sec.fields.filter(f => f.enabled && f.type !== "signature" && f.type !== "file")) {
        const v = values[f.id]; if (v) items.push({ label: f.label, value: v });
      }
      if (items.length > 0) sections.push({ title: sec.name, items });
    }

    // Custom sections
    for (const sec of orderedSections.filter(s => s.sectionType === "custom")) {
      const condIds = sec.conditionalRules.flatMap(r => r.showFieldIds);
      const visIds  = sec.conditionalRules.flatMap(rule =>
        rule.triggerValues.includes(values[rule.triggerFieldId] ?? "") ? rule.showFieldIds : []
      );
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

  const multiStep = steps.length > 1;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">

          {/* Step progress indicator — only when there are multiple steps */}
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

          {/* Draft restored banner */}
          {showRestoredBanner && !showReview && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
              <RefreshCw className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              <p className="text-xs font-semibold text-amber-700 flex-1 leading-snug">Draft restored — continue where you left off.</p>
              <button onClick={handleStartOver} className="text-[11px] font-bold text-amber-600 hover:text-amber-800 underline underline-offset-2 flex-shrink-0">
                Start Over
              </button>
            </div>
          )}

          {/* MR number banner */}
          {!showReview && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <Hash className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient ID / MR No</p>
                <p className="text-sm font-mono font-bold text-slate-700">MR-{Math.floor(45100 + Math.random() * 900)} (auto-generated)</p>
              </div>
            </div>
          )}

          {/* Active step fields — hidden when review panel is open */}
          {showReview ? renderReviewSummary() : renderStepContent()}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="flex-shrink-0 border-t border-slate-100 bg-white px-5 py-4">
        {multiStep ? (
          showReview ? (
            /* Review mode footer: Back to Edit + Register */
            <div className="flex gap-3">
              <Button variant="outline" className="h-11 px-5 text-sm font-bold"
                onClick={() => setShowReview(false)}>
                <Pencil className="h-4 w-4 mr-1.5" /> Back to Edit
              </Button>
              <Button className="flex-1 h-11 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }}
                disabled={!canSubmit} onClick={handleSubmit}>
                <UserPlus className="h-4 w-4" />{isReassign ? "Register & Reassign" : "Register Patient"}
              </Button>
            </div>
          ) : (
            /* Normal multi-step footer */
            <div className="flex gap-3">
              <Button variant="outline" className="h-11 px-5 text-sm font-bold"
                onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                disabled={safeStep === 0}>
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
                    <UserPlus className="h-4 w-4" />{isReassign ? "Register & Reassign" : "Register Patient"}
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
            <UserPlus className="h-4 w-4" />{isReassign ? "Register & Reassign" : "Register Patient"}
          </Button>
        )}
      </div>
    </div>
  );
}

function RegistrationContent({ onRegister, isReassign = false, patients }: RegistrationContentProps) {
  const [mode, setMode] = useState<RegMode>("search");
  const [searchQ, setSearchQ] = useState("");
  const [found, setFound] = useState<Patient | null>(null);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchQ.toLowerCase()) ||
    p.phone.includes(searchQ) ||
    (searchQ.length > 3 && p.dob.includes(searchQ))
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 px-5 pt-4 pb-3 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
        {(["search", "new"] as RegMode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`h-8 px-5 rounded-full text-xs font-bold transition-all ${mode === m ? "bg-[#4982CF] text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
            {m === "search" ? "Search Existing" : "Register New"}
          </button>
        ))}
      </div>
      {mode === "search" && (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input className="pl-9" placeholder="Search by name, MRN, phone, or CNIC..." value={searchQ} onChange={e => setSearchQ(e.target.value)} autoFocus />
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:border-[#4982CF] hover:text-[#4982CF] transition-colors flex-1 justify-center">
                  <CardIcon className="h-4 w-4" /> Scan Card
                </button>
                <button className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:border-[#4982CF] hover:text-[#4982CF] transition-colors flex-1 justify-center">
                  <Fingerprint className="h-4 w-4" /> Scan Thumb
                </button>
              </div>
              {searchQ.length > 0 && (
                <div className="space-y-2">
                  {filtered.length === 0 && <p className="text-center text-sm text-slate-400 py-6">No patients found</p>}
                  {filtered.map(p => (
                    <button key={p.id} onClick={() => setFound(p === found ? null : p)}
                      className={`w-full flex items-center gap-4 rounded-xl border px-4 py-3 text-left transition-all ${found?.id === p.id ? "border-[#4982CF] bg-blue-50" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-slate-400" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 leading-tight">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.mrn} · {p.phone}</p>
                      </div>
                      {found?.id === p.id && <CheckCircle2 className="h-5 w-5 text-[#4982CF] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 border-t border-slate-100 bg-white px-5 py-4">
            {found ? (
              <Button className="w-full h-11 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }} onClick={() => onRegister(found)}>
                <UserCheck className="h-4 w-4" />{isReassign ? `Reassign to ${found.name}` : `Confirm — ${found.name}`}
              </Button>
            ) : (
              <Button className="w-full h-11 text-sm font-bold gap-2 opacity-40 cursor-not-allowed" disabled style={{ backgroundColor: "#4982CF" }}>
                <Search className="h-4 w-4" /> Search and select a patient above
              </Button>
            )}
          </div>
        </>
      )}
      {mode === "new" && (
        <DynamicRegNewForm onRegister={onRegister} isReassign={isReassign} />
      )}
    </div>
  );
}

// ─── Billing Content ───────────────────────────────────────────────────────────

type BillingStep = "cart" | "payment";
type BillingMode = "services" | "packages";
type PayType = "cash" | "card" | "corporate" | "insurance" | "welfare";

type DiscountMode   = "percent" | "amount";
type DiscountSource = "doctor" | "hospital" | "both";

interface CartLine {
  uid: string;
  itemId: string;
  name: string;
  catName: string;
  providerName?: string;
  price: number;
  qty: number;
  discount: number;
  discountMode:   DiscountMode;
  discountSource: DiscountSource;
}

export interface ReceiptInfo {
  tokenNumber: string;
  patientName: string;
  total: number;
  payType: PayType;
  items: CartLine[];
  invNo: string;
  refNum: string;
  cashReceived: number;
  coPay: number;
  cartDisc: number;
  cartDiscMode: DiscountMode;
  cartDiscSource: DiscountSource;
  cartDiscAmt: number;
}

export interface BillingEntry {
  tokenLabel: string;
  patient: { name: string; mrn?: string; phone?: string } | null;
}

interface BillingContentProps {
  entry: BillingEntry;
  onComplete: (receipt: ReceiptInfo) => void;
  isFullscreen: boolean;
  apptContext?: import("@/hooks/useBillingCatalogue").ApptFilter;
}

function BillingStepBar({ step }: { step: BillingStep }) {
  const steps = [
    { id: "cart",    label: "Services" },
    { id: "payment", label: "Payment"  },
  ] as const;
  const cur = steps.findIndex(s => s.id === step);
  return (
    <div className="flex items-center px-5 py-3 bg-slate-50 border-b border-slate-100 flex-shrink-0">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i < cur ? "bg-[#4982CF] text-white" : i === cur ? "border-2 border-[#4982CF] text-[#4982CF]" : "border-2 border-slate-200 text-slate-300"}`}>
              {i < cur ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-bold ${i <= cur ? "text-[#4982CF]" : "text-slate-400"}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-px mx-3 ${i < cur ? "bg-[#4982CF]" : "bg-slate-200"}`} />}
        </div>
      ))}
    </div>
  );
}

export function BillingContent({ entry, onComplete, isFullscreen, apptContext }: BillingContentProps) {
  const [step, setStep]         = useState<BillingStep>("cart");
  const [mode, setMode]         = useState<BillingMode>("services");
  const [catId, setCatId]       = useState<string | null>(null);
  const [cart, setCart]         = useState<CartLine[]>([]);
  const [showDiscFor, setShowDiscFor]       = useState<string | null>(null);
  const [cartDisc, setCartDisc]             = useState(0);
  const [cartDiscMode, setCartDiscMode]     = useState<DiscountMode>("percent");
  const [cartDiscSource, setCartDiscSource] = useState<DiscountSource>("both");
  const [showCartDisc, setShowCartDisc]     = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<Record<string, string | null>>({});
  const [catSearch, setCatSearch] = useState("");

  const { categories, packages: billPackages } = useBillingCatalogue(apptContext);

  // Reset search whenever the user enters or leaves a category
  useEffect(() => { setCatSearch(""); }, [catId]);

  // Payment state
  const [payType, setPayType]     = useState<PayType | null>(null);
  const [cashRx, setCashRx]       = useState("");
  const [coPayAmt, setCoPayAmt]   = useState("");
  const [refNum, setRefNum]       = useState("");

  const invNo = useRef("INV-" + Math.random().toString(36).substr(2, 6).toUpperCase()).current;

  // ── Cart helpers ─────────────────────────────────────────────────
  const lineDiscount = (l: CartLine) => {
    const gross = l.price * l.qty;
    if (l.discountMode === "amount") return Math.min(l.discount, gross);
    return gross * l.discount / 100;
  };
  const lineTotal      = (l: CartLine) => Math.round(l.price * l.qty - lineDiscount(l));
  const grossTotal     = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const itemsSubtotal  = cart.reduce((s, l) => s + lineTotal(l), 0);
  const totalDiscount  = cart.reduce((s, l) => s + lineDiscount(l), 0);
  const cartDiscAmt    = cartDiscMode === "amount"
    ? Math.min(cartDisc, itemsSubtotal)
    : Math.round(itemsSubtotal * cartDisc / 100);
  const grandTotal     = itemsSubtotal - cartDiscAmt;
  const totalSaved     = totalDiscount + cartDiscAmt;
  const discountPct    = grossTotal > 0 ? Math.round((totalSaved / grossTotal) * 100) : 0;

  function addService(item: BillCatItem) {
    const cat = catId ? categories.find(c => c.id === catId) ?? null : null;
    const catLabel = cat?.label ?? "";
    // Consultation has no external providers — use the doctor name (item.subLabel) instead.
    const providerName = catId === "consultation"
      ? (item.subLabel ?? undefined)
      : currentProviderId
        ? (cat?.providers.find(p => p.id === currentProviderId)?.name ?? undefined)
        : undefined;
    setCart(prev => {
      const match = (c: CartLine) => c.itemId === item.id && c.providerName === providerName;
      const existing = prev.find(match);
      if (existing) return prev.map(c => match(c) ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { uid: uid(), itemId: item.id, name: item.name, catName: catLabel, providerName, price: item.price, qty: 1, discount: 0, discountMode: "percent", discountSource: "both" }];
    });
  }

  function addBillPackage(pkg: BillPackage) {
    setCart(prev => {
      if (prev.find(c => c.itemId === pkg.id)) return prev;
      return [...prev, { uid: uid(), itemId: pkg.id, name: pkg.name, catName: "Package", price: pkg.price, qty: 1, discount: 0, discountMode: "percent", discountSource: "both" }];
    });
  }

  function updateQty(uid: string, delta: number) {
    setCart(prev => prev.map(c => c.uid === uid ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  }

  function updateDiscount(uid: string, val: string) {
    const n = Math.min(100, Math.max(0, Number(val) || 0));
    setCart(prev => prev.map(c => c.uid === uid ? { ...c, discount: n } : c));
  }

  function removeItem(uid: string) {
    setCart(prev => prev.filter(c => c.uid !== uid));
    setShowDiscFor(null);
  }

  // ── Payment helpers ──────────────────────────────────────────────
  const cashReceived   = Number(cashRx) || 0;
  const change         = Math.max(0, cashReceived - grandTotal);
  const coPay          = Number(coPayAmt) || 0;
  const welfareCovered = Math.max(0, grandTotal - coPay);

  function canProceed(): boolean {
    if (!payType) return false;
    if (payType === "cash") return cashReceived >= grandTotal;
    if (payType === "welfare") return coPay >= 0 && coPay <= grandTotal;
    return true;
  }

  const currentCat        = catId ? (categories.find(c => c.id === catId) ?? null) : null;
  const currentProviderId = catId ? (selectedProviders[catId] ?? currentCat?.defaultProviderId ?? null) : null;
  const currentCatItems   = currentCat ? currentCat.getItems(currentProviderId) : [];

  // ─────────────────────────────────────────────────────────────────
  // STEP: CART
  // ─────────────────────────────────────────────────────────────────
  if (step === "cart") return (
    <div className={`flex flex-col h-full transition-all duration-200 ${isFullscreen && cart.length > 0 ? "pl-[344px]" : ""}`}>
      <BillingStepBar step="cart" />

      {/* Mode toggle + patient info */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{entry.patient?.name ?? "Walk-in Patient"}</p>
            {entry.patient && <p className="text-xs text-slate-400">{entry.patient.mrn}</p>}
          </div>
          <span className="font-mono font-black text-[#4982CF] text-sm">{entry.tokenLabel}</span>
        </div>
        <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 gap-1">
          <button onClick={() => { setMode("services"); setCatId(null); }}
            className={`flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-xs font-bold transition-all ${mode === "services" ? "bg-white shadow-sm text-[#4982CF] border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
            <Stethoscope className="h-3.5 w-3.5" /> Services
          </button>
          <button onClick={() => { setMode("packages"); setCatId(null); }}
            className={`flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-xs font-bold transition-all ${mode === "packages" ? "bg-white shadow-sm text-[#4982CF] border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
            <Package className="h-3.5 w-3.5" /> Packages
          </button>
        </div>
      </div>

      {/* Scrollable selection + cart */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* ── SERVICES — category grid ──────────────────────────────── */}
        {mode === "services" && !catId && (
          <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => {
                const style  = CAT_STYLE[cat.id] ?? { color: "text-slate-700", bg: "bg-slate-50 border-slate-200" };
                const provId = selectedProviders[cat.id] ?? cat.defaultProviderId ?? null;
                const count  = cat.getItems(provId).length;
                const added  = cart.filter(c => c.catName === cat.label).length;
                return (
                  <button key={cat.id} onClick={() => setCatId(cat.id)}
                    className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all hover:shadow-sm ${style.bg} relative`}>
                    <div className={style.color}>{catIcon(cat.id)}</div>
                    <div>
                      <p className={`text-sm font-bold ${style.color}`}>{cat.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{count} services</p>
                    </div>
                    {added > 0 && (
                      <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#4982CF] text-white text-[10px] font-black flex items-center justify-center">{added}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SERVICES — category drill-down ────────────────────────── */}
        {mode === "services" && catId && currentCat && (() => {
          const style = CAT_STYLE[catId] ?? { color: "text-slate-700", bg: "bg-slate-50 border-slate-200" };
          // Categories that group items by their subLabel
          const isGrouped = catId === "consultation" || catId === "pharmacy";

          // Apply search filter
          const q = catSearch.trim().toLowerCase();
          const filteredItems = q
            ? currentCatItems.filter(i =>
                i.name.toLowerCase().includes(q) ||
                (i.subLabel ?? "").toLowerCase().includes(q)
              )
            : currentCatItems;

          // Group by subLabel when applicable (doctor for consult, modality for imaging, generic for pharmacy)
          const subLabelGroups: Record<string, BillCatItem[]> = {};
          if (isGrouped) {
            for (const item of filteredItems) {
              const key = item.subLabel ?? "Other";
              (subLabelGroups[key] ??= []).push(item);
            }
          }

          function ServiceRow({ item }: { item: BillCatItem }) {
            const inCart = cart.find(c => c.itemId === item.id);
            return (
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 hover:border-slate-200 transition-all">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">{item.name}</p>
                  <p className="text-xs font-bold text-[#4982CF] mt-0.5">{item.price > 0 ? fmt(item.price) : <span className="text-slate-400 font-normal">—</span>}</p>
                </div>
                {inCart ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 rounded-lg border border-[#4982CF]/30 bg-blue-50 px-2 py-1">
                      <button onClick={() => updateQty(inCart.uid, -1)} className="text-[#4982CF] hover:text-blue-700"><Minus className="h-3 w-3" /></button>
                      <span className="text-xs font-black text-[#4982CF] w-4 text-center">{inCart.qty}</span>
                      <button onClick={() => updateQty(inCart.uid, 1)} className="text-[#4982CF] hover:text-blue-700"><Plus className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => removeItem(inCart.uid)} className="text-slate-300 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <button onClick={() => addService(item)}
                    className="flex items-center gap-1 h-8 px-3 rounded-lg bg-[#4982CF] text-white text-xs font-bold hover:bg-blue-600 transition-colors flex-shrink-0">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                )}
              </div>
            );
          }

          return (
            <div className="flex flex-col flex-1 min-h-0">
              {/* ── Sticky header ─────────────────────────────────────── */}
              <div className="flex-shrink-0 bg-white border-b border-slate-100 px-5 pt-3 pb-3 space-y-2.5">
                {/* Row: back + category label */}
                <div className="flex items-center justify-between">
                  <button onClick={() => setCatId(null)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#4982CF] transition-colors">
                    <ChevronLeft className="h-3.5 w-3.5" /> Back to categories
                  </button>
                  <div className={`flex items-center gap-1.5 ${style.color}`}>
                    {catIcon(catId, "h-3.5 w-3.5")}
                    <span className="text-xs font-bold">{currentCat.label}</span>
                  </div>
                </div>

                {/* Search bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={catSearch}
                    onChange={e => setCatSearch(e.target.value)}
                    placeholder={`Search ${currentCat.label}...`}
                    className="w-full h-9 pl-9 pr-8 rounded-lg border border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4982CF]/30 focus:border-[#4982CF] transition-colors"
                  />
                  {catSearch && (
                    <button onClick={() => setCatSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Provider picker — single provider pill or multi-provider tabs */}
                {currentCat.providers.length === 1 && (
                  <p className="text-[10px] text-slate-400 font-medium">{currentCat.providers[0].name}</p>
                )}
                {currentCat.providers.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {currentCat.providers.map(p => (
                      <button key={p.id}
                        onClick={() => setSelectedProviders(prev => ({ ...prev, [catId]: p.id }))}
                        className={`h-7 px-3 rounded-full text-xs font-bold border transition-all ${
                          currentProviderId === p.id
                            ? "bg-[#4982CF] text-white border-[#4982CF]"
                            : "bg-white text-slate-600 border-slate-200 hover:border-[#4982CF]/50"
                        }`}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Scrollable items ───────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-5 py-3">
                {/* Empty state */}
                {filteredItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-sm font-medium text-slate-400">
                      {catSearch ? "No matches found" : "No items configured"}
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      {catSearch ? "Try a different search term" : "Set up items in Admin Settings"}
                    </p>
                  </div>
                )}

                {/* Items — grouped by subLabel (doctor / modality / generic) or flat */}
                {filteredItems.length > 0 && isGrouped && (
                  <div className="space-y-1 pb-4">
                    {Object.entries(subLabelGroups).map(([groupName, items]) => (
                      <div key={groupName} className="mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 mt-3 first:mt-0 px-1">{groupName}</p>
                        <div className="space-y-2">
                          {items.map(item => <ServiceRow key={item.id} item={item} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {filteredItems.length > 0 && !isGrouped && (
                  <div className="space-y-2 pb-4">
                    {filteredItems.map(item => <ServiceRow key={item.id} item={item} />)}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── PACKAGES ──────────────────────────────────────────────── */}
        {mode === "packages" && (
          <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
          <div className="space-y-3">
            {billPackages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm font-medium text-slate-400">No packages configured</p>
                <p className="text-xs text-slate-300 mt-1">Create packages in Admin → Packages</p>
              </div>
            )}
            {billPackages.map(pkg => {
              const inCart = cart.find(c => c.itemId === pkg.id);
              return (
                <div key={pkg.id} className={`rounded-xl border p-4 transition-all ${inCart ? "border-[#4982CF]/40 bg-blue-50/60" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-[#4982CF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{pkg.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{pkg.description}</p>
                      <p className="text-sm font-black text-[#4982CF] mt-1.5">{pkg.price > 0 ? fmt(pkg.price) : <span className="text-slate-400 font-normal text-xs">Auto-priced on cart</span>}</p>
                    </div>
                    {inCart ? (
                      <button onClick={() => removeItem(inCart.uid)} className="text-xs font-bold text-red-400 hover:text-red-600 flex-shrink-0 mt-0.5">Remove</button>
                    ) : (
                      <button onClick={() => addBillPackage(pkg)}
                        className="flex items-center gap-1 h-8 px-3 rounded-lg bg-[#4982CF] text-white text-xs font-bold hover:bg-blue-600 transition-colors flex-shrink-0 mt-0.5">
                        <Plus className="h-3.5 w-3.5" /> Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}

      </div>

      {/* Footer hint — shown only when cart is empty */}
      {cart.length === 0 && (
        <div className="flex-shrink-0 border-t border-slate-100 bg-white px-5 py-4">
          <div className="flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-50 border border-slate-200 border-dashed">
            <ShoppingCart className="h-4 w-4 text-slate-300" />
            <span className="text-sm text-slate-400 font-medium">Add services to build your cart</span>
          </div>
        </div>
      )}

      {/* ── CART SUB-PANEL — auto-shows when cart has items ──────────── */}
      {cart.length > 0 && (
        <div
          className={`fixed top-0 h-full z-[51] flex flex-col
            bg-slate-900/97 backdrop-blur-sm shadow-2xl
            border-white/10 animate-in duration-200
            ${isFullscreen
              ? "left-0 w-[344px] border-r slide-in-from-left-2"
              : "w-[308px] border-r slide-in-from-right-2"
            }`}
          style={isFullscreen ? undefined : { right: "max(40%, 520px)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 pt-5 pb-3 border-b border-white/10 flex-shrink-0">
            <ShoppingCart className="h-4 w-4 text-[#4982CF] flex-shrink-0" />
            <p className="text-xs font-black text-white flex-1 uppercase tracking-wide">Cart</p>
            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#4982CF] text-white text-[10px] font-black flex items-center justify-center">
              {cart.length}
            </span>
          </div>

          {/* Cart lines */}
          <div className="flex-1 overflow-y-auto py-2 px-3 space-y-2">
            {cart.map(line => (
              <div key={line.uid} className="rounded-xl bg-white/8 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white leading-tight">{line.name}</p>
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full bg-white/10 text-[9px] font-bold text-slate-400">
                      {line.catName}{line.providerName ? ` · ${line.providerName}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1">
                      <button onClick={() => updateQty(line.uid, -1)} className="text-slate-400 hover:text-white transition-colors"><Minus className="h-3 w-3" /></button>
                      <span className="text-xs font-black text-white w-4 text-center">{line.qty}</span>
                      <button onClick={() => updateQty(line.uid, 1)} className="text-slate-400 hover:text-white transition-colors"><Plus className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => removeItem(line.uid)} className="text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[10px] text-white/35">{fmt(line.price)} × {line.qty}{line.discount > 0 ? ` − ${line.discount}%` : ""}</span>
                  <span className="text-xs font-black text-white">{fmt(lineTotal(line))}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals + proceed button */}
          <div className="flex-shrink-0 border-t border-white/10 px-4 py-4 space-y-2">
            {totalDiscount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-amber-400 font-semibold">Discount</span>
                <span className="text-amber-400 font-bold">−{fmt(Math.round(totalDiscount))}</span>
              </div>
            )}
            <div className="flex justify-between items-center pb-1">
              <span className="text-sm font-bold text-slate-300">Total</span>
              <span className="text-xl font-black text-[#4982CF]">{fmt(grandTotal)}</span>
            </div>
            <Button className="w-full h-10 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }}
              onClick={() => setStep("payment")}>
              <ArrowRight className="h-4 w-4" /> Proceed to Payment
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  // STEP: PAYMENT  (step is narrowed to "payment" here)
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <BillingStepBar step="payment" />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* Cart items summary */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Items ({cart.length})</p>
          </div>
          <div className="divide-y divide-slate-50">
            {cart.map(line => (
              <div key={line.uid} className="px-4 py-2.5">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">{line.name}</p>
                    {line.providerName && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{line.providerName}</p>
                    )}
                    <p className="text-[10px] text-slate-400">{fmt(line.price)} × {line.qty}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    <p className="text-xs font-bold text-slate-800">{fmt(lineTotal(line))}</p>
                    <button
                      onClick={() => setShowDiscFor(showDiscFor === line.uid ? null : line.uid)}
                      className={`transition-colors ${line.discount > 0 ? "text-amber-500" : "text-slate-300 hover:text-amber-500"}`}
                      title="Apply discount">
                      <Percent className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeItem(line.uid)}
                      className="text-slate-300 hover:text-red-400 transition-colors"
                      title="Remove item">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {showDiscFor === line.uid && (
                  <div className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-2.5">
                    {/* Mode toggle + value input */}
                    <div className="flex items-center gap-2">
                      <div className="flex rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                        {(["percent", "amount"] as DiscountMode[]).map(m => (
                          <button key={m}
                            onClick={() => setCart(prev => prev.map(c => c.uid === line.uid ? { ...c, discountMode: m, discount: 0 } : c))}
                            className={`px-2.5 py-1 text-[10px] font-bold transition-colors ${line.discountMode === m ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                            {m === "percent" ? "%" : "Rs."}
                          </button>
                        ))}
                      </div>
                      <Input
                        type="number" min={0}
                        max={line.discountMode === "percent" ? 100 : line.price * line.qty}
                        value={line.discount === 0 ? "" : line.discount}
                        onChange={e => setCart(prev => prev.map(c => c.uid === line.uid ? {
                          ...c,
                          discount: c.discountMode === "percent"
                            ? Math.min(100, Math.max(0, Number(e.target.value) || 0))
                            : Math.min(c.price * c.qty, Math.max(0, Number(e.target.value) || 0))
                        } : c))}
                        className="h-7 w-24 text-xs text-center py-0 px-2"
                        placeholder="0"
                        autoFocus
                      />
                      <span className="text-[10px] text-slate-400">{line.discountMode === "percent" ? "%" : "PKR"}</span>
                      {line.discount > 0 && (
                        <span className="text-[10px] text-amber-600 font-bold ml-auto">
                          -{fmt(Math.round(lineDiscount(line)))}
                        </span>
                      )}
                    </div>
                    {/* Deduction source */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold flex-shrink-0">Deduct from:</span>
                      {(["doctor", "hospital", "both"] as DiscountSource[]).map(src => (
                        <button key={src}
                          onClick={() => setCart(prev => prev.map(c => c.uid === line.uid ? { ...c, discountSource: src } : c))}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                            line.discountSource === src
                              ? "bg-[#4982CF] text-white border-[#4982CF]"
                              : "text-slate-500 border-slate-200 hover:border-[#4982CF]/50"
                          }`}>
                          {src === "doctor" ? "Doctor Share" : src === "hospital" ? "Clinic Share" : "Both"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Savings summary — only when any discount is applied */}
          {totalSaved > 0 && (
            <div className="px-4 py-2.5 bg-amber-50/70 border-t border-amber-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Original amount</p>
                <p className="text-xs font-bold text-slate-400 line-through">{fmt(Math.round(grossTotal))}</p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">You save</p>
                <p className="text-xs font-black text-amber-600">
                  -{fmt(Math.round(totalSaved))}
                  <span className="ml-1 font-semibold text-amber-500">({discountPct}%)</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cart-wide discount — collapsed by default */}
        <div>
          {/* Toggle button row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowCartDisc(v => !v)}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                cartDiscAmt > 0
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-slate-200 text-slate-400 hover:border-[#4982CF]/40 hover:text-[#4982CF]"
              }`}>
              <Percent className="h-3 w-3" />
              {cartDiscAmt > 0 ? `Cart disc: -${fmt(cartDiscAmt)}` : "Add cart discount"}
            </button>
            {cartDiscAmt > 0 && !showCartDisc && (
              <button
                onClick={() => { setCartDisc(0); }}
                className="text-[10px] text-slate-400 hover:text-red-400 transition-colors">
                Remove
              </button>
            )}
          </div>

          {/* Inline panel — shown when toggled */}
          {showCartDisc && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-2.5">
              {/* Mode toggle + value */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                  {(["percent", "amount"] as DiscountMode[]).map(m => (
                    <button key={m}
                      onClick={() => { setCartDiscMode(m); setCartDisc(0); }}
                      className={`px-2.5 py-1 text-[10px] font-bold transition-colors ${cartDiscMode === m ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                      {m === "percent" ? "%" : "Rs."}
                    </button>
                  ))}
                </div>
                <input
                  type="number" min={0}
                  max={cartDiscMode === "percent" ? 100 : itemsSubtotal}
                  value={cartDisc === 0 ? "" : cartDisc}
                  onChange={e => {
                    const v = Math.max(0, Number(e.target.value) || 0);
                    setCartDisc(cartDiscMode === "percent" ? Math.min(100, v) : Math.min(itemsSubtotal, v));
                  }}
                  className="h-7 w-24 rounded-md border border-slate-200 text-xs text-center px-2 focus:outline-none focus:ring-1 focus:ring-[#4982CF]"
                  placeholder="0"
                  autoFocus
                />
                <span className="text-[10px] text-slate-400">{cartDiscMode === "percent" ? "%" : "PKR"}</span>
                {cartDiscAmt > 0 && (
                  <span className="ml-auto text-[10px] font-black text-amber-600">-{fmt(cartDiscAmt)}</span>
                )}
              </div>
              {/* Deduction source */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-semibold flex-shrink-0">Deduct from:</span>
                {(["doctor", "hospital", "both"] as DiscountSource[]).map(src => (
                  <button key={src}
                    onClick={() => setCartDiscSource(src)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                      cartDiscSource === src
                        ? "bg-[#4982CF] text-white border-[#4982CF]"
                        : "text-slate-500 border-slate-200 hover:border-[#4982CF]/50"
                    }`}>
                    {src === "doctor" ? "Doctor Share" : src === "hospital" ? "Clinic Share" : "Both"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Invoice total summary */}
        <div className="rounded-xl border border-[#4982CF]/20 bg-blue-50/40 px-4 py-3 flex items-center gap-3">
          <Receipt className="h-4 w-4 text-[#4982CF] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500">Total Invoice Amount</p>
            <p className="text-lg font-black text-[#4982CF]">{fmt(grandTotal)}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-slate-400">{cart.length} {cart.length === 1 ? "item" : "items"}</p>
            <button onClick={() => setStep("cart")} className="text-[10px] font-bold text-[#4982CF] hover:underline mt-0.5">Edit cart</button>
          </div>
        </div>

        {/* Payment type */}
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">Payment Type</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { v: "cash",      label: "Cash",      icon: <Banknote   className="h-4 w-4" />, color: "#10b981", desc: "Collected at counter"   },
              { v: "card",      label: "Card / Transfer", icon: <CreditCard className="h-4 w-4" />, color: "#4982CF", desc: "POS or bank transfer"   },
              { v: "corporate", label: "Corporate", icon: <Building2  className="h-4 w-4" />, color: "#f59e0b", desc: "Billed to company"      },
              { v: "insurance", label: "Insurance", icon: <Shield     className="h-4 w-4" />, color: "#6366f1", desc: "Insurance claim"        },
              { v: "welfare",   label: "Welfare",   icon: <Heart      className="h-4 w-4" />, color: "#ef4444", desc: "Govt. welfare scheme"   },
            ] as const).map(t => (
              <button key={t.v} onClick={() => setPayType(t.v as PayType)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${payType === t.v ? "border-current text-white shadow-sm" : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"}`}
                style={payType === t.v ? { borderColor: t.color, backgroundColor: t.color } : undefined}>
                <div>{t.icon}</div>
                <div>
                  <p className="text-xs font-bold leading-tight">{t.label}</p>
                  <p className={`text-[10px] mt-0.5 ${payType === t.v ? "opacity-80" : "text-slate-400"}`}>{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Payment details by type ────────────────────────────── */}
        {payType === "cash" && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Cash Payment</p>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Cash Received (PKR)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
                <Input className="pl-8 h-11 text-base font-bold" type="number" value={cashRx}
                  onChange={e => setCashRx(e.target.value)} placeholder="0" autoFocus />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[grandTotal, grandTotal + 100, grandTotal + 500, Math.ceil(grandTotal / 1000) * 1000].filter((v, i, a) => a.indexOf(v) === i).map(v => (
                <button key={v} onClick={() => setCashRx(String(v))}
                  className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${Number(cashRx) === v ? "border-[#4982CF] bg-[#4982CF]/10 text-[#4982CF]" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                  {fmt(v)}
                </button>
              ))}
            </div>
            {cashReceived > 0 && (
              <div className={`rounded-xl border p-3 flex items-center justify-between ${cashReceived >= grandTotal ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <span className={`text-xs font-semibold ${cashReceived >= grandTotal ? "text-green-700" : "text-red-600"}`}>
                  {cashReceived >= grandTotal ? `Change to return` : `Short by`}
                </span>
                <span className={`text-sm font-black ${cashReceived >= grandTotal ? "text-green-700" : "text-red-600"}`}>
                  {fmt(Math.abs(cashReceived - grandTotal))}
                </span>
              </div>
            )}
          </div>
        )}

        {payType === "card" && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
            <p className="text-xs font-bold text-slate-600">Card / Bank Transfer</p>
            <p className="text-sm font-black text-[#4982CF]">{fmt(grandTotal)}</p>
            <p className="text-xs text-slate-400">Confirm that POS / transfer has been completed for the above amount.</p>
          </div>
        )}

        {(payType === "corporate" || payType === "insurance") && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{payType === "insurance" ? "Insurance Details" : "Corporate Details"}</p>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{payType === "insurance" ? "Policy / Authorization No." : "Reference / PO No."}</label>
              <Input value={refNum} onChange={e => setRefNum(e.target.value)} placeholder="Enter reference number" autoFocus />
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Amount Billed</span>
              <span className="text-sm font-black text-[#4982CF]">{fmt(grandTotal)}</span>
            </div>
          </div>
        )}

        {payType === "welfare" && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Welfare / Co-Pay</p>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Patient Co-Pay Amount (PKR)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
                <Input className="pl-8 h-10 font-bold" type="number" value={coPayAmt}
                  onChange={e => setCoPayAmt(e.target.value)} placeholder="0" autoFocus />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                <p className="text-[10px] text-slate-500 font-semibold">Co-Pay</p>
                <p className="text-sm font-black text-red-600">{fmt(coPay)}</p>
              </div>
              <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-2">
                <p className="text-[10px] text-slate-500 font-semibold">Welfare Covers</p>
                <p className="text-sm font-black text-green-700">{fmt(welfareCovered)}</p>
              </div>
              <div className="rounded-xl border border-[#4982CF]/20 bg-blue-50 px-3 py-2">
                <p className="text-[10px] text-slate-500 font-semibold">Total</p>
                <p className="text-sm font-black text-[#4982CF]">{fmt(grandTotal)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-slate-100 bg-white px-5 py-4">
        <Button className="w-full h-11 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }}
          disabled={!canProceed()}
          onClick={() => onComplete({
            tokenNumber: entry.tokenLabel,
            patientName: entry.patient?.name ?? "Walk-in Patient",
            total: grandTotal,
            payType: payType!,
            items: cart,
            invNo,
            refNum,
            cashReceived: Number(cashRx) || 0,
            coPay: Number(coPayAmt) || 0,
            cartDisc,
            cartDiscMode,
            cartDiscSource,
            cartDiscAmt,
          })}>
          <CheckCircle2 className="h-4 w-4" /> Generate Invoice &amp; Advance to Vitals
        </Button>
      </div>
    </div>
  );
}

// ─── Thermal Receipt Printer (module-level so it can be reused) ───────────────

export function printThermalReceipt(r: ReceiptInfo) {
  const now = new Date();
  const dt = now.toLocaleString("en-PK", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const payLabel: Record<string, string> = { cash: "Cash", card: "Card / Transfer", corporate: "Corporate", insurance: "Insurance", welfare: "Welfare" };
  const lines = r.items.map(l => {
    const gross = l.price * l.qty;
    const disc  = l.discountMode === "amount" ? Math.min(l.discount, gross) : gross * l.discount / 100;
    const sub   = Math.round(gross - disc);
    const nameLine = l.name.padEnd(28).slice(0, 28);
    const mainLine = `${nameLine}  x${l.qty}  Rs.${sub.toLocaleString("en-PK")}`;
    const provLine = l.providerName ? `\n  ${l.providerName}` : "";
    const discLine = disc > 0
      ? `\n  Disc (${l.discountMode === "percent" ? `${l.discount}%` : `Rs.${l.discount.toLocaleString("en-PK")}`}, ${l.discountSource === "doctor" ? "Dr." : l.discountSource === "hospital" ? "Clinic" : "Both"}): -Rs.${Math.round(disc).toLocaleString("en-PK")}`
      : "";
    return `${mainLine}${provLine}${discLine}`;
  }).join("\n");
  const html = `<!DOCTYPE html><html><head><title>Receipt ${r.invNo}</title><style>
    @page { size: 80mm auto; margin: 3mm; }
    body { font-family: 'Courier New', monospace; font-size: 13px; width: 72mm; margin: 0 auto; padding: 2mm; }
    .center { text-align: center; } .bold { font-weight: bold; }
    .sep { border-top: 1px dashed #000; margin: 4px 0; }
    .logo { font-size: 22px; font-weight: 900; letter-spacing: 1px; }
    .total { font-size: 16px; font-weight: 900; }
    pre { font-size: 13px; white-space: pre-wrap; word-break: break-word; margin: 2px 0; }
  </style></head><body>
    <div class="center logo">NovaDoc</div>
    <div class="center" style="font-size:11px">EHR · Billing Receipt</div>
    <div class="sep"></div>
    <div>Invoice: <span class="bold">${r.invNo}</span></div>
    <div class="center" style="font-size:42px;font-weight:900;letter-spacing:2px;margin:6px 0 2px">${r.tokenNumber}</div>
    <div>Patient: <span class="bold">${r.patientName}</span></div>
    <div>${dt}</div>
    <div class="sep"></div>
    <pre>${lines}</pre>
    <div class="sep"></div>
    ${r.items.reduce((s, l) => { const g = l.price * l.qty; return s + (l.discountMode === "amount" ? Math.min(l.discount, g) : g * l.discount / 100); }, 0) > 0 ? `<div>Item Discounts: -Rs.${Math.round(r.items.reduce((s,l)=>{ const g=l.price*l.qty; return s+(l.discountMode==="amount"?Math.min(l.discount,g):g*l.discount/100); },0)).toLocaleString("en-PK")}</div>` : ""}
    ${r.cartDiscAmt > 0 ? `<div>Cart Disc (${r.cartDiscMode === "percent" ? `${r.cartDisc}%` : `Rs.${r.cartDisc.toLocaleString("en-PK")}`}, ${r.cartDiscSource === "doctor" ? "Dr." : r.cartDiscSource === "hospital" ? "Clinic" : "Both"}): -Rs.${r.cartDiscAmt.toLocaleString("en-PK")}</div>` : ""}
    <div class="total">TOTAL: Rs.${r.total.toLocaleString("en-PK")}</div>
    <div>Payment: <span class="bold">${payLabel[r.payType] ?? r.payType}</span></div>
    ${r.payType === "cash" && r.cashReceived > r.total ? `<div>Cash Rcvd: Rs.${r.cashReceived.toLocaleString("en-PK")}</div><div>Change: Rs.${(r.cashReceived - r.total).toLocaleString("en-PK")}</div>` : ""}
    ${r.payType === "welfare" ? `<div>Co-Pay: Rs.${r.coPay.toLocaleString("en-PK")}</div><div>Welfare: Rs.${(r.total - r.coPay).toLocaleString("en-PK")}</div>` : ""}
    ${r.refNum ? `<div>Ref: ${r.refNum}</div>` : ""}
    <div class="sep"></div>
    <div class="center" style="font-size:11px">Thank you · Please proceed to Vitals</div>
    <div class="center" style="font-size:11px">novadoc.health</div>
    <script>window.onload=function(){ window.print(); window.close(); }</script>
  </body></html>`;
  const w = window.open("", "_blank", "width=900,height=720");
  if (w) { w.document.write(html); w.document.close(); }
}

// ─── Front Desk User Page ─────────────────────────────────────────────────────

type DrawerType = "registration" | "reassign" | "billing" | null;

export function FrontDeskUser() {
  const {
    queue,
    fdCall, fdTimerExpire, fdRegisterStart, fdRegisterComplete,
    fdBilling, fdCompleteBilling, fdSkip, fdRecall,
  } = useMultiStepQueue();
  const { patients, addPatient } = usePatients();

  const [tick, setTick]               = useState(0);
  const [showSkipped, setShowSkipped] = useState(false);
  const [drawerType, setDrawerType]   = useState<DrawerType>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [toast, setToast]             = useState<string | null>(null);
  const [receipt, setReceipt]         = useState<ReceiptInfo | null>(null);
  const [billingFullscreen, setBillingFullscreen] = useState(false);

  const billingEnabled = (() => {
    try {
      const stored = localStorage.getItem("ehr-billing-counters");
      if (stored) { const map = JSON.parse(stored) as Record<string, boolean>; return map["ctr-1"] ?? true; }
      return JSON.parse(localStorage.getItem("ehr-billing-reg") ?? "true");
    } catch { return true; }
  })();

  useEffect(() => { const t = setInterval(() => setTick(p => p + 1), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    queue.forEach(e => {
      if (!e.callTimestamp) return;
      if (Date.now() - e.callTimestamp >= CALL_WINDOW_SECS * 1000) {
        fdTimerExpire(e.id);
        if (e.callCount >= MAX_CALLS) showToastMsg(`Token ${e.tokenNumber} auto-skipped after ${MAX_CALLS} calls`);
      }
    });
  }, [tick]);

  function showToastMsg(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500); }
  function closeDrawer() { setDrawerType(null); setActiveEntryId(null); setBillingFullscreen(false); }

  const fdQueue = queue.filter(e => e.step === 1 && e.status !== "completed" && !e.skipped).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const skippedQueue    = queue.filter(e => e.step === 1 && e.skipped);
  const atCounterEntry  = fdQueue.find(e => e.status === "called") ?? null;
  const activeCallEntry = fdQueue.find(e => e.callTimestamp !== null && getSecsLeft(e.callTimestamp) > 0) ?? null;
  const [fifoLock] = useState<boolean>(() => { try { const v = localStorage.getItem("ehr-fifo-lock"); return v === null ? true : (JSON.parse(v) as boolean); } catch { return true; } });
  const baseCanCall     = !atCounterEntry && !activeCallEntry;
  const waitingTokens   = fdQueue.filter(e => e.status === "waiting" && !e.callTimestamp && e.id !== atCounterEntry?.id);
  const activeDrawerEntry = queue.find(e => e.id === activeEntryId) ?? atCounterEntry ?? null;

  function handleCall(id: string) { fdCall(id); showToastMsg("Token called — 30 second window started"); }
  function handleRegisterClick(entry: MultiEntry) { fdRegisterStart(entry.id); setActiveEntryId(entry.id); setDrawerType("registration"); }
  function handleReassignClick(entry: MultiEntry) { setActiveEntryId(entry.id); setDrawerType("reassign"); }
  function handleBillingClick(entry: MultiEntry) { fdBilling(entry.id); setActiveEntryId(entry.id); setDrawerType("billing"); showToastMsg(`${entry.tokenNumber} is now At Counter`); }
  function handleOpenBillingDrawer(entry: MultiEntry) { setActiveEntryId(entry.id); setDrawerType("billing"); }
  function handleRegComplete(patient: Patient) {
    if (!activeEntryId) return;
    addPatient(patient);
    fdRegisterComplete(activeEntryId, patient);
    closeDrawer();
    showToastMsg(`Patient ${drawerType === "reassign" ? "reassigned" : "registered"} — ${patient.name}`);
  }
  function handleBillingComplete(r: ReceiptInfo) {
    if (!activeEntryId) return;
    fdCompleteBilling(activeEntryId);
    closeDrawer();
    setReceipt(r);
  }

  function handleSkip(id: string) { fdSkip(id); closeDrawer(); showToastMsg("Token skipped"); }
  function handleRecall(id: string, tokenNum: string) { fdRecall(id); showToastMsg(`Token ${tokenNum} recalled to queue`); }

  const secsLeft = getSecsLeft(activeCallEntry?.callTimestamp ?? null);
  const timerPct = (secsLeft / CALL_WINDOW_SECS) * 100;

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      <QueueAppHeader />

      <div className="flex items-center gap-3 bg-[#4982CF] px-6 py-2.5 flex-shrink-0">
        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
        <p className="text-xs font-bold text-white/90 uppercase tracking-widest">Registration Counter · Main Branch — Lahore</p>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-white/70">Billing:</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${billingEnabled ? "bg-white/20 text-white" : "bg-white/10 text-white/50"}`}>
            {billingEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Queue Stats</p>
            {[
              { label: "At Counter", value: fdQueue.filter(e => e.status === "called").length, color: "text-[#4982CF]", bg: "bg-blue-50 border-blue-200" },
              { label: "Waiting",    value: waitingTokens.length,  color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
              { label: "Skipped",    value: skippedQueue.length,   color: "text-red-600",   bg: "bg-red-50 border-red-200"     },
            ].map(s => (
              <div key={s.label} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 mb-2 ${s.bg}`}>
                <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Assigned Queues</p>
            <div className="rounded-xl border border-[#4982CF]/30 bg-blue-50 px-4 py-3">
              <p className="text-sm font-bold text-[#4982CF]">Registration Queue</p>
              <p className="text-xs text-slate-500 mt-0.5">Step 1 tokens · Billing enabled</p>
            </div>
          </div>
        </div>

        {/* ── MAIN AREA ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* AT COUNTER */}
            {atCounterEntry && (
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
                      {atCounterEntry.patient ? (
                        <><p className="text-base font-black text-slate-900 leading-tight">{atCounterEntry.patient.name}</p><p className="text-xs text-slate-400">{atCounterEntry.patient.mrn} · {atCounterEntry.patient.phone}</p></>
                      ) : (
                        <p className="text-base font-black text-slate-500">Walk-in Patient</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#4982CF] animate-pulse" />
                        <span className="text-xs font-semibold text-[#4982CF]">At Counter</span>
                        <span className="text-slate-300">·</span>
                        <Clock className="h-3 w-3 text-slate-300" />
                        <span className="text-xs text-slate-400">{timeAgo(atCounterEntry.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {billingEnabled ? (
                        <Button className="h-10 px-5 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }}
                          onClick={() => handleOpenBillingDrawer(atCounterEntry)}>
                          <CreditCard className="h-4 w-4" /> Billing
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="border-red-200 text-red-500 hover:bg-red-50"
                          onClick={() => handleSkip(atCounterEntry.id)}>
                          <SkipForward className="h-3.5 w-3.5 mr-1" /> Skip
                        </Button>
                      )}
                      <Button variant="outline" size="sm"
                        className="h-8 px-3 text-xs border-slate-200 text-slate-500 hover:border-[#4982CF] hover:text-[#4982CF] gap-1.5"
                        onClick={() => handleReassignClick(atCounterEntry)}>
                        <Pencil className="h-3 w-3" />
                        {atCounterEntry.patient ? "Reassign Patient" : "Assign Patient"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVE CALL WINDOW */}
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
                        <><p className="text-base font-black text-slate-900 leading-tight">{activeCallEntry.patient.name}</p><p className="text-xs text-slate-400">{activeCallEntry.patient.mrn}</p></>
                      ) : (
                        <p className="text-base font-black text-slate-500">Walk-in Patient</p>
                      )}
                      <p className="text-sm font-semibold text-amber-600 mt-1">Window expires in {secsLeft}s</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {activeCallEntry.patient ? (
                        <>
                          <Button className="h-10 px-5 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }} onClick={() => handleBillingClick(activeCallEntry)}>
                            <CreditCard className="h-4 w-4" /> Billing
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 px-3 text-xs border-slate-200 text-slate-500 hover:border-[#4982CF] hover:text-[#4982CF] gap-1.5" onClick={() => handleReassignClick(activeCallEntry)}>
                            <Pencil className="h-3 w-3" /> Reassign
                          </Button>
                        </>
                      ) : (
                        <Button className="h-11 px-6 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }} onClick={() => handleRegisterClick(activeCallEntry)}>
                          <UserCheck className="h-4 w-4" /> Register
                        </Button>
                      )}
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
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Waiting in Queue · {waitingTokens.length}</p>
              </div>
              {waitingTokens.length === 0 && !atCounterEntry && !activeCallEntry && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <UserCheck className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">Queue is empty</p>
                  <p className="text-xs">No tokens waiting at registration</p>
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
                        {entry.patient ? <p className="text-sm font-bold text-slate-800 truncate">{entry.patient.name}<span className="ml-2 text-xs font-normal text-slate-400">{entry.patient.mrn}</span></p>
                          : <p className="text-sm font-bold text-slate-500">Walk-in Patient</p>}
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(entry.createdAt)}</span>
                      {canCall ? (
                        <Button size="sm" className="h-8 px-4 text-xs font-bold flex-shrink-0 gap-1.5" style={{ backgroundColor: "#4982CF" }} onClick={() => handleCall(entry.id)}>
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

      {/* RIGHT DRAWERS */}
      {drawerType === "registration" && activeEntryId && (
        <RightDrawer title="Patient Registration" subtitle="Link a patient record to this token" onClose={closeDrawer}>
          <RegistrationContent onRegister={handleRegComplete} patients={patients} />
        </RightDrawer>
      )}
      {drawerType === "reassign" && activeEntryId && (
        <RightDrawer title="Reassign Patient" subtitle={`Correct the patient for ${activeDrawerEntry?.tokenNumber ?? "this token"}`} onClose={closeDrawer}>
          <RegistrationContent onRegister={handleRegComplete} isReassign patients={patients} />
        </RightDrawer>
      )}
      {drawerType === "billing" && activeDrawerEntry && (
        <RightDrawer title="Billing" subtitle={activeDrawerEntry.patient?.name ?? "Walk-in Patient"} onClose={closeDrawer}
          onFullscreenChange={setBillingFullscreen}>
          <BillingContent
            entry={{ tokenLabel: activeDrawerEntry.tokenNumber, patient: activeDrawerEntry.patient ?? null }}
            onComplete={handleBillingComplete}
            isFullscreen={billingFullscreen}
          />
        </RightDrawer>
      )}

      {/* RECEIPT TOAST CARD */}
      {receipt && (
        <div className="fixed bottom-6 right-6 z-[60] w-80 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-3">
          {/* Green header bar */}
          <div className="h-1.5 w-full bg-green-500" />

          {/* Dismiss button */}
          <div className="flex justify-end px-3 pt-3">
            <button onClick={() => setReceipt(null)}
              className="h-6 w-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <X className="h-3 w-3 text-slate-500" />
            </button>
          </div>

          {/* Hero — logo + centered token */}
          <div className="flex flex-col items-center pb-4 px-4 -mt-1">
            <div className="h-10 w-10 rounded-xl bg-[#4982CF] flex items-center justify-center mb-2 shadow-md">
              <span className="text-white font-black text-sm">N</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">NovaDoc · Invoice Finalized</p>
            <p className="font-mono font-black text-[#4982CF] text-5xl leading-none tracking-tight">{receipt.tokenNumber}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <p className="text-[10px] font-semibold text-green-600">Advanced to Vitals queue</p>
            </div>
          </div>

          <div className="px-4 pb-4 space-y-3">
            {/* Patient + total info */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900">{receipt.patientName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{receipt.invNo}</p>
                </div>
                <p className="text-base font-black text-slate-900">{fmt(receipt.total)}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => printThermalReceipt(receipt)}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#4982CF] text-white text-xs font-bold hover:bg-blue-600 transition-colors">
                <Printer className="h-3.5 w-3.5" /> Print Receipt
              </button>
              <button
                onClick={() => printThermalReceipt(receipt)}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
                <Receipt className="h-3.5 w-3.5" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMPLE TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold shadow-xl animate-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}
