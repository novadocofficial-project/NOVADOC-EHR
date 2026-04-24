import { useState } from "react";
import type { NoteState } from "@/pages/ClinicalNoteDrawer";
import type { FormularyData } from "@/pages/FormularySection";
import type { ImagingData }   from "@/pages/ImagingSection";
import type { CarePlanData }  from "@/pages/CarePlanSection";
import type { HealthEdSelection } from "@/pages/HealthEdSection";
import type { ReferralData }      from "@/pages/ReferralSection";
import type { ProcedureOrdersData } from "@/pages/ProcedureOrdersSection";
import type { PatientGoalsData }    from "@/pages/PatientGoalsSection";
import {
  FileText, ChevronLeft, X, Eye, Check, Plus, Trash2,
  BookmarkPlus, Layers, PenLine, Star, AlertCircle,
  ChevronDown, ChevronUp, Shield, User,
} from "lucide-react";

// ─── Section meta ─────────────────────────────────────────────────────────────

export type TemplateSectionKey =
  | "chiefComplaints" | "hpi" | "ros"
  | "formulary" | "imaging" | "carePlan" | "procedureOrders"
  | "healthEd" | "patientGoals" | "referrals"
  | "otherOrders" | "visitNote";

const ALL_SECTIONS: TemplateSectionKey[] = [
  "chiefComplaints","hpi","ros","formulary","imaging",
  "carePlan","procedureOrders","healthEd","patientGoals",
  "referrals","otherOrders","visitNote",
];

const SECTION_META: Record<TemplateSectionKey, { label: string; tag: string; color: string }> = {
  chiefComplaints: { label: "Chief Complaint",    tag: "CC",       color: "#4982CF" },
  hpi:             { label: "HPI",                 tag: "HPI",      color: "#8b5cf6" },
  ros:             { label: "Review of Systems",   tag: "ROS",      color: "#0ea5e9" },
  formulary:       { label: "Medications",         tag: "Meds",     color: "#7c3aed" },
  imaging:         { label: "Imaging",             tag: "Imaging",  color: "#0369a1" },
  carePlan:        { label: "Care Plan",           tag: "Care",     color: "#10b981" },
  procedureOrders: { label: "Procedures",          tag: "Proc",     color: "#0d9488" },
  healthEd:        { label: "Health Education",    tag: "HealthEd", color: "#f97316" },
  patientGoals:    { label: "Patient Goals",       tag: "Goals",    color: "#ec4899" },
  referrals:       { label: "Referrals",           tag: "Ref",      color: "#6366f1" },
  otherOrders:     { label: "Other Orders",        tag: "Orders",   color: "#f59e0b" },
  visitNote:       { label: "Visit Note",          tag: "Note",     color: "#64748b" },
};

// ─── Template type ────────────────────────────────────────────────────────────

export interface SoapTemplate {
  id:          string;
  name:        string;
  description: string;
  isSystem:    boolean;
  sections:    TemplateSectionKey[];
  data:        Partial<NoteState>;
  createdAt:   string;
}

// ─── System templates ─────────────────────────────────────────────────────────

const SYSTEM_TEMPLATES: SoapTemplate[] = [
  {
    id: "sys-urti",
    name: "URTI Standard",
    description: "Upper respiratory tract infection — sore throat, cough, fever",
    isSystem: true,
    sections: ["chiefComplaints", "hpi", "ros", "carePlan"],
    createdAt: "",
    data: {
      chiefComplaints: ["Sore Throat", "Cough", "Fever"],
      hpi: "Patient presents with sore throat, productive cough, and fever for [X] days. Onset was gradual. No known sick contacts reported. Symptoms not improving with home remedies. No difficulty breathing or swallowing.",
      ros: [
        "Sore throat — present", "Cough (productive) — present", "Fever / chills — present",
        "Nasal congestion — present", "Loss of appetite — present",
        "Shortness of breath — absent", "Ear pain — absent",
      ],
      carePlan: {
        tasks: [
          { uid: "sys-urti-cp1", taskId: "med-adherence",   title: "Medication adherence counseling",         assignee: "", dueDate: "", priority: "Normal", notes: "Explain antibiotic course completion." },
          { uid: "sys-urti-cp2", taskId: "followup-call",   title: "Telephone follow-up call in 3–5 days",    assignee: "", dueDate: "", priority: "Normal", notes: "" },
          { uid: "sys-urti-cp3", taskId: "next-visit-sched",title: "Schedule follow-up if no improvement",    assignee: "", dueDate: "", priority: "Normal", notes: "" },
        ],
      } as CarePlanData,
    },
  },
  {
    id: "sys-htn",
    name: "Hypertension Follow-up",
    description: "Routine hypertension review — BP monitoring, medication check",
    isSystem: true,
    sections: ["chiefComplaints", "hpi", "ros", "carePlan"],
    createdAt: "",
    data: {
      chiefComplaints: ["Headache", "Dizziness"],
      hpi: "Patient presents for routine hypertension follow-up. Blood pressure has been [controlled / uncontrolled] on current medication. Reports [headache / dizziness / no symptoms]. Compliance with antihypertensive medication and dietary salt restriction discussed at last visit.",
      ros: [
        "Headache — [present/absent]", "Dizziness — [present/absent]",
        "Palpitations — absent", "Chest pain — absent",
        "Shortness of breath — absent", "Visual disturbance — absent",
        "Ankle swelling — [present/absent]",
      ],
      carePlan: {
        tasks: [
          { uid: "sys-htn-cp1", taskId: "bp-monitoring",  title: "Home blood pressure monitoring guidance",  assignee: "", dueDate: "", priority: "Normal", notes: "Target: <130/80 mmHg" },
          { uid: "sys-htn-cp2", taskId: "med-adherence",  title: "Medication adherence counseling",          assignee: "", dueDate: "", priority: "Normal", notes: "" },
          { uid: "sys-htn-cp3", taskId: "diet-counseling",title: "Dietary counseling — low sodium diet",     assignee: "", dueDate: "", priority: "Normal", notes: "" },
        ],
      } as CarePlanData,
    },
  },
  {
    id: "sys-dm",
    name: "Diabetes Review",
    description: "Routine diabetes management — glucose, HbA1c, lifestyle review",
    isSystem: true,
    sections: ["chiefComplaints", "hpi", "ros", "carePlan"],
    createdAt: "",
    data: {
      chiefComplaints: ["Fatigue", "Diabetes review"],
      hpi: "Patient presents for routine diabetes review. Blood glucose levels have been [well / poorly] controlled. Last HbA1c: [result]. Reports [fatigue / polyuria / polydipsia / blurred vision / no symptoms]. Dietary compliance and exercise habits assessed.",
      ros: [
        "Fatigue — present", "Excessive thirst (polydipsia) — [present/absent]",
        "Frequent urination (polyuria) — [present/absent]",
        "Blurred vision — absent", "Foot numbness or tingling — [present/absent]",
        "Slow wound healing — absent",
      ],
      carePlan: {
        tasks: [
          { uid: "sys-dm-cp1", taskId: "glucose-monitoring",title: "Blood glucose monitoring schedule",       assignee: "", dueDate: "", priority: "Normal", notes: "Fasting + post-meal readings" },
          { uid: "sys-dm-cp2", taskId: "diet-counseling",   title: "Dietary counseling — diabetic diet",     assignee: "", dueDate: "", priority: "Normal", notes: "" },
          { uid: "sys-dm-cp3", taskId: "med-adherence",     title: "Medication adherence counseling",        assignee: "", dueDate: "", priority: "Normal", notes: "" },
          { uid: "sys-dm-cp4", taskId: "next-visit-sched",  title: "Schedule HbA1c review in 3 months",     assignee: "", dueDate: "", priority: "Normal", notes: "" },
        ],
      } as CarePlanData,
    },
  },
  {
    id: "sys-fever",
    name: "Fever / Acute Illness",
    description: "Acute febrile illness — fever, malaise, body aches",
    isSystem: true,
    sections: ["chiefComplaints", "hpi", "ros"],
    createdAt: "",
    data: {
      chiefComplaints: ["Fever", "Fatigue", "Muscle Aches"],
      hpi: "Patient presents with fever and malaise for [X] days. Temperature recorded at [X]°C. Associated symptoms include fatigue and body aches. No localising signs of infection identified on initial assessment. No recent travel or sick contacts reported.",
      ros: [
        "Fever / chills — present", "Fatigue / malaise — present",
        "Muscle aches — present", "Headache — [present/absent]",
        "Loss of appetite — present", "Nausea — [present/absent]",
        "Cough — absent", "Rash — absent", "Joint pain — absent",
      ],
    },
  },
  {
    id: "sys-asthma",
    name: "Asthma / Respiratory",
    description: "Acute asthma or respiratory distress — wheeze, dyspnoea, cough",
    isSystem: true,
    sections: ["chiefComplaints", "hpi", "ros", "carePlan", "procedureOrders"],
    createdAt: "",
    data: {
      chiefComplaints: ["Shortness of Breath", "Cough"],
      hpi: "Patient presents with acute shortness of breath and wheeze. Episode onset [X hours / days] ago. Known asthmatic on [medication]. Trigger identified: [exercise / allergen / URTI / cold air / unknown]. Peak flow reading: [value] L/min ([%] predicted).",
      ros: [
        "Shortness of breath — present", "Wheeze — present",
        "Cough — present", "Chest tightness — present",
        "Exercise intolerance — [present/absent]",
        "Fever — absent", "Sputum production — [present/absent]",
      ],
      carePlan: {
        tasks: [
          { uid: "sys-ast-cp1", taskId: "inhaler-technique",   title: "Inhaler technique demonstration",      assignee: "", dueDate: "", priority: "Normal", notes: "Check spacer use" },
          { uid: "sys-ast-cp2", taskId: "respiratory-rehab",   title: "Respiratory rehabilitation exercises", assignee: "", dueDate: "", priority: "Normal", notes: "" },
          { uid: "sys-ast-cp3", taskId: "followup-call",       title: "Telephone follow-up in 24–48 hours",   assignee: "", dueDate: "", priority: "Urgent", notes: "" },
        ],
      } as CarePlanData,
      procedureOrders: {
        orders: [
          { uid: "sys-ast-po1", procId: "nebulization", name: "Nebulization Therapy", cpt: "94640", isCustom: false, indication: "Acute bronchoconstriction", priority: "Urgent", timing: "Immediate", scheduledAt: "", repeat: false, instructions: "Salbutamol 2.5 mg in 2.5 mL NS", assignedTo: "" },
          { uid: "sys-ast-po2", procId: "peak-flow",    name: "Peak Flow Measurement",cpt: "94150", isCustom: false, indication: "Assess airflow obstruction", priority: "Normal",timing: "Immediate", scheduledAt: "", repeat: true, instructions: "Pre- and post-bronchodilator", assignedTo: "" },
        ],
      } as ProcedureOrdersData,
    },
  },
];

// ─── localStorage ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "soap_doctor_templates";

function loadDoctorTemplates(): SoapTemplate[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveDoctorTemplates(tpls: SoapTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tpls));
}

// ─── Merge & Replace logic ────────────────────────────────────────────────────

function uid() { return `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function mergeStringArr(existing: string[], incoming: string[]): string[] {
  const result = [...existing];
  for (const v of incoming) { if (!result.includes(v)) result.push(v); }
  return result;
}

function mergeText(existing: string, incoming: string): string {
  if (!incoming.trim()) return existing;
  if (!existing.trim()) return incoming;
  return `${existing}\n---\n${incoming}`;
}

function mergeCarePlan(a: CarePlanData, b: CarePlanData): CarePlanData {
  return { tasks: [...a.tasks, ...b.tasks.map(t => ({ ...t, uid: uid() }))] };
}

function mergeProcOrders(a: ProcedureOrdersData, b: ProcedureOrdersData): ProcedureOrdersData {
  return { orders: [...a.orders, ...b.orders.map(o => ({ ...o, uid: uid() }))] };
}

function mergeFormulary(a: FormularyData, b: FormularyData): FormularyData {
  const ids = new Set(a.medicines.map((m: any) => m.id));
  const fresh = b.medicines.filter((m: any) => !ids.has(m.id)).map((m: any) => ({ ...m, uid: uid() }));
  return { ...a, medicines: [...a.medicines, ...fresh] };
}

function mergeImaging(a: ImagingData, b: ImagingData): ImagingData {
  const aa = a as any;
  const bb = b as any;
  const combined: any = { ...a };
  if (bb.studies && aa.studies) combined.studies = [...aa.studies, ...bb.studies.map((s: any) => ({ ...s, uid: uid() }))];
  if (bb.orders && aa.orders) combined.orders = [...aa.orders, ...bb.orders.map((s: any) => ({ ...s, uid: uid() }))];
  return combined;
}

function mergeHealthEd(a: HealthEdSelection, b: HealthEdSelection): HealthEdSelection {
  return { ...a, docIds: mergeStringArr(a.docIds ?? [], b.docIds ?? []) };
}

function mergeReferrals(a: ReferralData, b: ReferralData): ReferralData {
  return { referrals: [...(a.referrals ?? []), ...(b.referrals ?? []).map((r: any) => ({ ...r, uid: uid() }))] };
}

function mergePatientGoals(a: PatientGoalsData, b: PatientGoalsData): PatientGoalsData {
  return { goals: [...a.goals, ...b.goals.map(g => ({ ...g, uid: uid() }))] };
}

export function applyTemplate(
  current: NoteState,
  template: SoapTemplate,
  mode: "replace" | "merge",
): NoteState {
  const result: NoteState = { ...current };
  const d = template.data;

  for (const key of template.sections) {
    const tVal = (d as any)[key];
    if (tVal === undefined) continue;

    if (mode === "replace") {
      (result as any)[key] = key === "carePlan"
        ? { tasks: ((tVal as CarePlanData).tasks ?? []).map((t: any) => ({ ...t, uid: uid() })) }
        : key === "procedureOrders"
        ? { orders: ((tVal as ProcedureOrdersData).orders ?? []).map((o: any) => ({ ...o, uid: uid() })) }
        : key === "patientGoals"
        ? { goals: ((tVal as PatientGoalsData).goals ?? []).map((g: any) => ({ ...g, uid: uid() })) }
        : tVal;
      continue;
    }

    // merge
    switch (key) {
      case "chiefComplaints":
      case "ros":
        (result as any)[key] = mergeStringArr((current as any)[key], tVal); break;
      case "hpi":
      case "otherOrders":
      case "visitNote":
        (result as any)[key] = mergeText((current as any)[key], tVal); break;
      case "carePlan":       result.carePlan       = mergeCarePlan(current.carePlan, tVal); break;
      case "procedureOrders":result.procedureOrders= mergeProcOrders(current.procedureOrders, tVal); break;
      case "formulary":      result.formulary      = mergeFormulary(current.formulary, tVal); break;
      case "imaging":        result.imaging        = mergeImaging(current.imaging, tVal); break;
      case "healthEd":       result.healthEd       = mergeHealthEd(current.healthEd, tVal); break;
      case "referrals":      result.referrals      = mergeReferrals(current.referrals, tVal); break;
      case "patientGoals":   result.patientGoals   = mergePatientGoals(current.patientGoals, tVal); break;
    }
  }
  return result;
}

// ─── Helper: section has data in note ────────────────────────────────────────

function sectionHasData(note: NoteState, key: TemplateSectionKey): boolean {
  const v = (note as any)[key];
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") {
    const arr = v.tasks ?? v.orders ?? v.goals ?? v.referrals ?? v.medicines ?? v.studies ?? v.docIds;
    if (Array.isArray(arr)) return arr.length > 0;
    const vals = Object.values(v).filter(Boolean);
    return vals.length > 0;
  }
  return false;
}

// ─── SectionTag ───────────────────────────────────────────────────────────────

function SectionTag({ k }: { k: TemplateSectionKey }) {
  const m = SECTION_META[k];
  return (
    <span className="inline-flex items-center text-[8.5px] font-black px-1.5 py-0.5 rounded"
      style={{ background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}30` }}>
      {m.tag}
    </span>
  );
}

// ─── Preview panel (read-only) ────────────────────────────────────────────────

function TemplatePreview({ tpl, onBack }: { tpl: SoapTemplate; onBack: () => void }) {
  const d = tpl.data;

  function renderSection(key: TemplateSectionKey) {
    const v = (d as any)[key];
    if (!v) return null;
    const m = SECTION_META[key];

    let body: React.ReactNode = null;
    if (key === "chiefComplaints" || key === "ros") {
      body = (
        <ul className="list-disc list-inside space-y-0.5">
          {(v as string[]).map((s, i) => <li key={i} className="text-xs text-slate-700">{s}</li>)}
        </ul>
      );
    } else if (key === "hpi" || key === "otherOrders" || key === "visitNote") {
      body = <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{v as string}</p>;
    } else if (key === "carePlan") {
      const tasks = (v as CarePlanData).tasks ?? [];
      body = (
        <ul className="space-y-1">
          {tasks.map((t: any, i: number) => (
            <li key={i} className="text-xs text-slate-700 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              {t.title}
              {t.priority === "Urgent" && <span className="text-[9px] font-black text-red-500">URGENT</span>}
            </li>
          ))}
        </ul>
      );
    } else if (key === "procedureOrders") {
      const orders = (v as ProcedureOrdersData).orders ?? [];
      body = (
        <ul className="space-y-1">
          {orders.map((o: any, i: number) => (
            <li key={i} className="text-xs text-slate-700 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 flex-shrink-0" />
              {o.name}
              {o.cpt && <span className="font-mono text-[9px] text-teal-600 bg-teal-50 px-1 py-0.5 rounded">CPT {o.cpt}</span>}
              {o.priority === "Urgent" && <span className="text-[9px] font-black text-red-500">URGENT</span>}
            </li>
          ))}
        </ul>
      );
    } else {
      body = <p className="text-xs text-slate-400 italic">Section data present</p>;
    }

    return (
      <div key={key} className="mb-3">
        <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: m.color }}>
          {m.label}
        </p>
        {body}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-white z-10 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button onClick={onBack} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Preview</p>
          <p className="text-sm font-black text-slate-800 truncate">{tpl.name}</p>
        </div>
        {tpl.isSystem && (
          <span className="flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full bg-blue-50 text-blue-500 border border-blue-100">
            <Shield className="h-2.5 w-2.5" /> System
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tpl.description && (
          <p className="text-xs text-slate-500 italic mb-4 pb-3 border-b border-slate-100">{tpl.description}</p>
        )}
        {tpl.sections.map(k => renderSection(k))}
      </div>
    </div>
  );
}

// ─── Import confirm dialog ────────────────────────────────────────────────────

function ImportConfirmDialog({ tpl, onConfirm, onCancel }: {
  tpl: SoapTemplate;
  onConfirm: (mode: "replace" | "merge") => void;
  onCancel: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[320px] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <p className="text-sm font-black text-slate-800">Apply Template</p>
        </div>
        <p className="text-xs text-slate-600 mb-1">
          <span className="font-bold">{tpl.name}</span> includes:
        </p>
        <div className="flex flex-wrap gap-1 mb-4">
          {tpl.sections.map(k => <SectionTag key={k} k={k} />)}
        </div>
        <p className="text-xs text-slate-500 mb-4">
          How should this template be applied to your current note?
        </p>
        <div className="space-y-2 mb-4">
          <button onClick={() => onConfirm("merge")}
            className="w-full flex items-start gap-3 px-3 py-3 rounded-xl border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors text-left">
            <Check className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-blue-700">Merge</p>
              <p className="text-[10px] text-blue-500">Add template data alongside existing note content. Text is appended; lists are combined.</p>
            </div>
          </button>
          <button onClick={() => onConfirm("replace")}
            className="w-full flex items-start gap-3 px-3 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-red-50 hover:border-red-200 transition-colors text-left group">
            <AlertCircle className="h-4 w-4 text-slate-400 group-hover:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-slate-600 group-hover:text-red-600">Replace</p>
              <p className="text-[10px] text-slate-400 group-hover:text-red-400">Overwrite existing data in the template's sections only.</p>
            </div>
          </button>
        </div>
        <button onClick={onCancel}
          className="w-full text-xs font-bold py-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Save as template dialog ──────────────────────────────────────────────────

function SaveTemplateDialog({ note, onSave, onClose }: {
  note: NoteState;
  onSave: (tpl: SoapTemplate) => void;
  onClose: () => void;
}) {
  const filledSections = ALL_SECTIONS.filter(k => sectionHasData(note, k));
  const [name,     setName]     = useState("");
  const [desc,     setDesc]     = useState("");
  const [selected, setSelected] = useState<Set<TemplateSectionKey>>(new Set(filledSections));

  function toggleSection(k: TemplateSectionKey) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  }

  function handleSave() {
    if (!name.trim() || selected.size === 0) return;
    const sections = ALL_SECTIONS.filter(k => selected.has(k));
    const data: Partial<NoteState> = {};
    for (const k of sections) (data as any)[k] = (note as any)[k];
    const tpl: SoapTemplate = {
      id: `doc-${Date.now()}`,
      name: name.trim(),
      description: desc.trim(),
      isSystem: false,
      sections,
      data,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onSave(tpl);
  }

  const canSave = name.trim() !== "" && selected.size > 0;

  return (
    <div className="absolute inset-0 bg-white z-10 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Templates</p>
          <p className="text-sm font-black text-slate-800">Save Current Note as Template</p>
        </div>
        <button onClick={handleSave} disabled={!canSave}
          className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0">
          <BookmarkPlus className="h-3.5 w-3.5" /> Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">
            Template Name <span className="text-red-400">*</span>
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. URTI + Asthma combo"
            className="w-full text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Description (optional)</label>
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Short description of this template…"
            className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all"
          />
        </div>

        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide mb-2">
            Sections to include <span className="text-red-400">*</span>
          </p>
          {filledSections.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No data in current note to save.</p>
          ) : (
            <div className="space-y-1">
              {filledSections.map(k => {
                const m = SECTION_META[k];
                const on = selected.has(k);
                return (
                  <label key={k} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 transition-colors border-2 ${on ? "border-blue-500 bg-blue-500" : "border-slate-200"}`}
                      onClick={() => toggleSection(k)}>
                      {on && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <span className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleSection(k)}>
                      <span className="text-xs font-semibold text-slate-700">{m.label}</span>
                      <span className="inline-block text-[8px] font-black px-1 py-0.5 rounded"
                        style={{ background: `${m.color}18`, color: m.color }}>{m.tag}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section-specific editors ─────────────────────────────────────────────────

function StringArrayEditor({ label, value, onChange, placeholder, color }: {
  label: string; value: string[]; onChange: (v: string[]) => void;
  placeholder: string; color: string;
}) {
  const [input, setInput] = useState("");
  function add() {
    const v = input.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setInput("");
  }
  function remove(i: number) { onChange(value.filter((_, idx) => idx !== i)); }
  return (
    <div className="space-y-2">
      {value.map((v, i) => (
        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-100 bg-slate-50 group">
          <span className="flex-1 text-xs text-slate-700">{v}</span>
          <button onClick={() => remove(i)}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none transition-all"
          style={{ "--tw-ring-color": `${color}30` } as React.CSSProperties}
        />
        <button onClick={add} disabled={!input.trim()}
          className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg text-white disabled:opacity-40 transition-colors"
          style={{ background: input.trim() ? color : undefined, backgroundColor: !input.trim() ? "#e2e8f0" : undefined }}>
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function CarePlanEditor({ value, onChange }: { value: CarePlanData; onChange: (v: CarePlanData) => void }) {
  const [newTitle, setNewTitle] = useState("");
  function addTask() {
    const t = newTitle.trim();
    if (!t) return;
    onChange({ tasks: [...value.tasks, { uid: uid(), taskId: "custom", title: t, assignee: "", dueDate: "", priority: "Normal", notes: "" }] });
    setNewTitle("");
  }
  function removeTask(i: number) { onChange({ tasks: value.tasks.filter((_, idx) => idx !== i) }); }
  function editTitle(i: number, title: string) {
    onChange({ tasks: value.tasks.map((t, idx) => idx === i ? { ...t, title } : t) });
  }
  function togglePriority(i: number) {
    onChange({ tasks: value.tasks.map((t, idx) => idx === i ? { ...t, priority: t.priority === "Urgent" ? "Normal" : "Urgent" } : t) });
  }
  return (
    <div className="space-y-2">
      {value.tasks.map((t, i) => (
        <div key={t.uid} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-100 bg-emerald-50/30 group">
          <button onClick={() => togglePriority(i)}
            className={`text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${t.priority === "Urgent" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"}`}>
            {t.priority === "Urgent" ? "URG" : "NRM"}
          </button>
          <input value={t.title} onChange={e => editTitle(i, e.target.value)}
            className="flex-1 text-xs text-slate-700 bg-transparent outline-none border-b border-transparent focus:border-emerald-300 transition-colors" />
          <button onClick={() => removeTask(i)}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTask(); } }}
          placeholder="Add task title…"
          className="flex-1 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none" />
        <button onClick={addTask} disabled={!newTitle.trim()}
          className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500 text-white disabled:opacity-40">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function ProcedureOrdersEditor({ value, onChange }: { value: ProcedureOrdersData; onChange: (v: ProcedureOrdersData) => void }) {
  const [newName, setNewName] = useState("");
  function addOrder() {
    const n = newName.trim();
    if (!n) return;
    onChange({ orders: [...value.orders, { uid: uid(), procId: "custom", name: n, cpt: "", isCustom: true, indication: "", priority: "Normal", timing: "Immediate", scheduledAt: "", repeat: false, instructions: "", assignedTo: "" }] });
    setNewName("");
  }
  function removeOrder(i: number) { onChange({ orders: value.orders.filter((_, idx) => idx !== i) }); }
  function editField(i: number, field: string, val: string) {
    onChange({ orders: value.orders.map((o, idx) => idx === i ? { ...o, [field]: val } : o) });
  }
  function togglePriority(i: number) {
    onChange({ orders: value.orders.map((o, idx) => idx === i ? { ...o, priority: o.priority === "Urgent" ? "Normal" : "Urgent" } : o) });
  }
  return (
    <div className="space-y-2">
      {value.orders.map((o, i) => (
        <div key={o.uid} className="rounded-lg border border-teal-100 bg-teal-50/20 overflow-hidden group">
          <div className="flex items-center gap-2 px-2.5 py-1.5">
            <button onClick={() => togglePriority(i)}
              className={`text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${o.priority === "Urgent" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"}`}>
              {o.priority === "Urgent" ? "URG" : "NRM"}
            </button>
            <input value={o.name} onChange={e => editField(i, "name", e.target.value)}
              className="flex-1 text-xs font-semibold text-slate-700 bg-transparent outline-none border-b border-transparent focus:border-teal-300 transition-colors" />
            {o.cpt && (
              <span className="font-mono text-[9px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 flex-shrink-0">
                CPT {o.cpt}
              </span>
            )}
            <button onClick={() => removeOrder(i)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="px-2.5 pb-1.5">
            <input value={o.indication} onChange={e => editField(i, "indication", e.target.value)}
              placeholder="Indication / reason…"
              className="w-full text-[10px] text-slate-500 bg-transparent outline-none placeholder:text-slate-300 border-b border-transparent focus:border-teal-200 transition-colors" />
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOrder(); } }}
          placeholder="Add procedure name…"
          className="flex-1 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none" />
        <button onClick={addOrder} disabled={!newName.trim()}
          className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-teal-500 text-white disabled:opacity-40">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function PatientGoalsEditor({ value, onChange }: { value: PatientGoalsData; onChange: (v: PatientGoalsData) => void }) {
  const [newTitle, setNewTitle] = useState("");
  function addGoal() {
    const t = newTitle.trim();
    if (!t) return;
    onChange({ goals: [...value.goals, { uid: uid(), title: t, startDate: "", targetDate: "", priority: "Normal", actions: [] }] });
    setNewTitle("");
  }
  function removeGoal(i: number) { onChange({ goals: value.goals.filter((_, idx) => idx !== i) }); }
  function editTitle(i: number, title: string) {
    onChange({ goals: value.goals.map((g, idx) => idx === i ? { ...g, title } : g) });
  }
  function addAction(i: number, action: string) {
    onChange({ goals: value.goals.map((g, idx) => idx === i ? { ...g, actions: [...g.actions, action] } : g) });
  }
  function removeAction(gi: number, ai: number) {
    onChange({ goals: value.goals.map((g, idx) => idx === gi ? { ...g, actions: g.actions.filter((_, aidx) => aidx !== ai) } : g) });
  }
  return (
    <div className="space-y-3">
      {value.goals.map((g, i) => (
        <GoalEditCard key={g.uid} goal={g} onEditTitle={t => editTitle(i, t)}
          onRemove={() => removeGoal(i)} onAddAction={a => addAction(i, a)}
          onRemoveAction={ai => removeAction(i, ai)} />
      ))}
      <div className="flex gap-2">
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addGoal(); } }}
          placeholder="Add goal title…"
          className="flex-1 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none" />
        <button onClick={addGoal} disabled={!newTitle.trim()}
          className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-pink-500 text-white disabled:opacity-40">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function GoalEditCard({ goal, onEditTitle, onRemove, onAddAction, onRemoveAction }: {
  goal: { uid: string; title: string; actions: string[] };
  onEditTitle: (t: string) => void;
  onRemove: () => void;
  onAddAction: (a: string) => void;
  onRemoveAction: (i: number) => void;
}) {
  const [newAction, setNewAction] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-pink-100 bg-pink-50/20 overflow-hidden">
      <div className="flex items-center gap-2 px-2.5 py-1.5 group">
        <input value={goal.title} onChange={e => onEditTitle(e.target.value)}
          className="flex-1 text-xs font-semibold text-slate-700 bg-transparent outline-none border-b border-transparent focus:border-pink-300 transition-colors" />
        <button onClick={() => setOpen(o => !o)}
          className="p-0.5 rounded text-slate-300 hover:text-pink-400 transition-colors flex-shrink-0 text-[9px] font-bold">
          {goal.actions.length} step{goal.actions.length !== 1 ? "s" : ""}
          {open ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />}
        </button>
        <button onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
          <X className="h-3 w-3" />
        </button>
      </div>
      {open && (
        <div className="px-2.5 pb-2 border-t border-pink-100 pt-1.5 space-y-1">
          {goal.actions.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 group/action">
              <span className="text-[10px] font-black text-pink-400 flex-shrink-0">{i + 1}.</span>
              <span className="flex-1 text-[10px] text-slate-600">{a}</span>
              <button onClick={() => onRemoveAction(i)}
                className="opacity-0 group-hover/action:opacity-100 p-0.5 rounded text-slate-200 hover:text-red-400 transition-colors flex-shrink-0">
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-1.5 mt-1">
            <input value={newAction} onChange={e => setNewAction(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newAction.trim()) { e.preventDefault(); onAddAction(newAction.trim()); setNewAction(""); } }}
              placeholder="Add action step…"
              className="flex-1 text-[10px] text-slate-600 bg-white border border-pink-100 rounded px-2 py-1 outline-none" />
            <button onClick={() => { if (newAction.trim()) { onAddAction(newAction.trim()); setNewAction(""); } }}
              className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded bg-pink-400 text-white disabled:opacity-40">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionContentEditor({ sectionKey, value, onChange }: {
  sectionKey: TemplateSectionKey;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const m = SECTION_META[sectionKey];

  if (sectionKey === "hpi" || sectionKey === "otherOrders" || sectionKey === "visitNote") {
    return (
      <textarea
        value={(value as string) ?? ""}
        onChange={e => onChange(e.target.value)}
        rows={4}
        className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none resize-none leading-relaxed"
      />
    );
  }
  if (sectionKey === "chiefComplaints") {
    return <StringArrayEditor label="CC" value={(value as string[]) ?? []} onChange={onChange as (v: string[]) => void}
      placeholder="Add complaint and press Enter…" color={m.color} />;
  }
  if (sectionKey === "ros") {
    return <StringArrayEditor label="ROS" value={(value as string[]) ?? []} onChange={onChange as (v: string[]) => void}
      placeholder="Add system finding and press Enter…" color={m.color} />;
  }
  if (sectionKey === "carePlan") {
    return <CarePlanEditor value={(value as CarePlanData) ?? { tasks: [] }} onChange={onChange as (v: CarePlanData) => void} />;
  }
  if (sectionKey === "procedureOrders") {
    return <ProcedureOrdersEditor value={(value as ProcedureOrdersData) ?? { orders: [] }} onChange={onChange as (v: ProcedureOrdersData) => void} />;
  }
  if (sectionKey === "patientGoals") {
    return <PatientGoalsEditor value={(value as PatientGoalsData) ?? { goals: [] }} onChange={onChange as (v: PatientGoalsData) => void} />;
  }
  // Complex sections: formulary, imaging, healthEd, referrals — show read-only summary
  return (
    <div className="px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-100">
      <p className="text-[10px] text-amber-700 font-medium">
        This section contains structured data that can't be edited here directly.
        To modify it, apply this template to your note, edit the section there, and save it as a new template.
      </p>
    </div>
  );
}

// ─── Edit template dialog (doctor templates) ──────────────────────────────────

function EditTemplateDialog({ tpl, onSave, onClose }: {
  tpl: SoapTemplate;
  onSave: (updated: SoapTemplate) => void;
  onClose: () => void;
}) {
  const [name,      setName]      = useState(tpl.name);
  const [desc,      setDesc]      = useState(tpl.description);
  const [localData, setLocalData] = useState<Partial<NoteState>>({ ...tpl.data });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function setSection(key: TemplateSectionKey, val: unknown) {
    setLocalData(prev => ({ ...prev, [key]: val }));
  }

  function toggleCollapse(key: string) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({ ...tpl, name: name.trim(), description: desc.trim(), data: localData });
  }

  return (
    <div className="absolute inset-0 bg-white z-10 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">My Templates</p>
          <p className="text-sm font-black text-slate-800 truncate">Edit: {tpl.name}</p>
        </div>
        <button onClick={handleSave} disabled={!name.trim()}
          className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-40 transition-colors flex-shrink-0">
          <Check className="h-3.5 w-3.5" /> Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Name + description */}
        <div className="space-y-2 pb-3 border-b border-slate-100">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Template Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Optional short description…"
              className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all" />
          </div>
        </div>

        {/* Section editors */}
        {tpl.sections.map(key => {
          const m = SECTION_META[key];
          const isOpen = !collapsed[key];
          return (
            <div key={key} className="border border-slate-100 rounded-xl overflow-hidden">
              <button onClick={() => toggleCollapse(key)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                <span className="inline-block text-[8.5px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}30` }}>
                  {m.tag}
                </span>
                <span className="flex-1 text-xs font-black text-slate-700">{m.label}</span>
                {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-3 py-3">
                  <SectionContentEditor
                    sectionKey={key}
                    value={(localData as any)[key]}
                    onChange={val => setSection(key, val)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({ tpl, onPreview, onUse, onEdit, onDelete, onCopyAndEdit }: {
  tpl: SoapTemplate;
  onPreview: () => void;
  onUse: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopyAndEdit?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden hover:border-slate-300 transition-colors">
      <div className="px-3 py-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <p className="text-xs font-black text-slate-800">{tpl.name}</p>
              {tpl.isSystem
                ? <span className="flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100"><Shield className="h-2 w-2" /> System</span>
                : <span className="flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100"><User className="h-2 w-2" /> My Template</span>
              }
            </div>
            {tpl.description && (
              <p className="text-[10px] text-slate-500 mb-1.5 line-clamp-2">{tpl.description}</p>
            )}
            <div className="flex flex-wrap gap-1">
              {tpl.sections.map(k => <SectionTag key={k} k={k} />)}
            </div>
          </div>
          <button onClick={() => setExpanded(e => !e)} className="p-1 text-slate-300 hover:text-slate-500 flex-shrink-0">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-slate-100 pt-2.5 flex flex-wrap gap-1.5">
          <button onClick={onPreview}
            className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            <Eye className="h-3 w-3" /> Preview
          </button>
          <button onClick={onUse}
            className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-400 transition-colors">
            <Check className="h-3 w-3" /> Use
          </button>
          {tpl.isSystem ? (
            <button onClick={onCopyAndEdit}
              className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors">
              <Plus className="h-3 w-3" /> Copy & Edit
            </button>
          ) : (
            <>
              <button onClick={onEdit}
                className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                <PenLine className="h-3 w-3" /> Edit
              </button>
              <button onClick={onDelete}
                className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-red-100 text-red-400 bg-red-50 hover:bg-red-100 transition-colors">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main TemplateDrawer (exported) ───────────────────────────────────────────

type DrawerView =
  | { kind: "browse" }
  | { kind: "preview"; tpl: SoapTemplate }
  | { kind: "save" }
  | { kind: "edit"; tpl: SoapTemplate }
  | { kind: "confirm"; tpl: SoapTemplate };

interface TemplateDrawerProps {
  note:            NoteState;
  initialMode?:    "browse" | "save";
  onImport:        (newNote: NoteState) => void;
  onClose:         () => void;
}

export function TemplateDrawer({ note, initialMode = "browse", onImport, onClose }: TemplateDrawerProps) {
  const [view, setView] = useState<DrawerView>(
    initialMode === "save" ? { kind: "save" } : { kind: "browse" }
  );
  const [tab, setTab] = useState<"system" | "mine">("system");
  const [doctorTpls, setDoctorTpls] = useState<SoapTemplate[]>(loadDoctorTemplates);

  function saveDoctorTpl(tpl: SoapTemplate) {
    const next = [tpl, ...doctorTpls];
    setDoctorTpls(next);
    saveDoctorTemplates(next);
    setView({ kind: "browse" });
    setTab("mine");
  }

  function updateDoctorTpl(updated: SoapTemplate) {
    const next = doctorTpls.map(t => t.id === updated.id ? updated : t);
    setDoctorTpls(next);
    saveDoctorTemplates(next);
    setView({ kind: "browse" });
  }

  function deleteDoctorTpl(id: string) {
    const next = doctorTpls.filter(t => t.id !== id);
    setDoctorTpls(next);
    saveDoctorTemplates(next);
  }

  function copySystemTpl(tpl: SoapTemplate) {
    const copy: SoapTemplate = {
      ...tpl,
      id: `doc-${Date.now()}`,
      name: `${tpl.name} (copy)`,
      isSystem: false,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const next = [copy, ...doctorTpls];
    setDoctorTpls(next);
    saveDoctorTemplates(next);
    setView({ kind: "edit", tpl: copy });
    setTab("mine");
  }

  function handleConfirm(mode: "replace" | "merge") {
    if (view.kind !== "confirm") return;
    const newNote = applyTemplate(note, view.tpl, mode);
    onImport(newNote);
    onClose();
  }

  const displayedTpls = tab === "system" ? SYSTEM_TEMPLATES : doctorTpls;

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">SOAP Note</p>
          <p className="text-sm font-black text-slate-800 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-blue-500" /> Templates
          </p>
        </div>
        <button onClick={() => setView({ kind: "save" })}
          className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors flex-shrink-0">
          <BookmarkPlus className="h-3.5 w-3.5 text-blue-500" /> Save as Template
        </button>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 flex-shrink-0">
        {(["system", "mine"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-black transition-colors ${tab === t
              ? "text-blue-600 border-b-2 border-blue-500"
              : "text-slate-400 hover:text-slate-600"
            }`}>
            {t === "system"
              ? <span className="flex items-center justify-center gap-1.5"><Shield className="h-3 w-3" /> System Templates</span>
              : <span className="flex items-center justify-center gap-1.5"><Star className="h-3 w-3" /> My Templates {doctorTpls.length > 0 && `(${doctorTpls.length})`}</span>
            }
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 relative">

        {/* Overlay views */}
        {view.kind === "preview" && (
          <TemplatePreview tpl={view.tpl} onBack={() => setView({ kind: "browse" })} />
        )}
        {view.kind === "save" && (
          <SaveTemplateDialog note={note} onSave={saveDoctorTpl} onClose={() => setView({ kind: "browse" })} />
        )}
        {view.kind === "edit" && (
          <EditTemplateDialog tpl={view.tpl} onSave={updateDoctorTpl} onClose={() => setView({ kind: "browse" })} />
        )}
        {view.kind === "confirm" && (
          <ImportConfirmDialog tpl={view.tpl} onConfirm={handleConfirm} onCancel={() => setView({ kind: "browse" })} />
        )}

        {/* Template list (shown in browse mode) */}
        {view.kind === "browse" && (
          <>
            {displayedTpls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Star className="h-10 w-10 text-slate-200 mb-3" />
                <p className="text-sm font-black text-slate-400">No templates yet</p>
                <p className="text-xs text-slate-400 mt-1">Save your current note as a template to reuse it later.</p>
                <button onClick={() => setView({ kind: "save" })}
                  className="mt-4 flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-400 transition-colors">
                  <BookmarkPlus className="h-3.5 w-3.5" /> Save as Template
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedTpls.map(tpl => (
                  <TemplateCard
                    key={tpl.id}
                    tpl={tpl}
                    onPreview={() => setView({ kind: "preview", tpl })}
                    onUse={() => setView({ kind: "confirm", tpl })}
                    onEdit={tpl.isSystem ? undefined : () => setView({ kind: "edit", tpl })}
                    onDelete={tpl.isSystem ? undefined : () => deleteDoctorTpl(tpl.id)}
                    onCopyAndEdit={tpl.isSystem ? () => copySystemTpl(tpl) : undefined}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
