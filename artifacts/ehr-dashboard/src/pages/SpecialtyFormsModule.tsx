import { useState, useEffect } from "react";
import {
  Plus, Edit2, Trash2, Copy, Eye,
  ChevronLeft, FileText, GripVertical,
  AlignLeft, CheckSquare, ToggleLeft, Hash, Calendar,
  Layers, Users, X, Check, BookOpen, Send, ArrowUp, ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Doctor } from "@/pages/DoctorsModule";

const ACCENT = "#4982CF";
const LS_KEY = "ehr-specialty-forms-v1";

// ── Types ─────────────────────────────────────────────────────────────────────

export type FieldType =
  | "textarea" | "text" | "checkbox-group" | "radio-group" | "number" | "date";

export type FormField = {
  id: string;
  label: string;
  type: FieldType;
  placeholder: string;
  options: string[];
};

export type FormSection = {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
};

export type SpecialtyForm = {
  id: string;
  name: string;
  status: "draft" | "published";
  sections: FormSection[];
  assignedDoctorIds: string[];
  createdAt: string;
  updatedAt: string;
};

// ── Storage helpers ───────────────────────────────────────────────────────────

function loadForms(): SpecialtyForm[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as SpecialtyForm[];
  } catch { /**/ }
  return SEED_FORMS;
}

function saveForms(forms: SpecialtyForm[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(forms)); } catch { /**/ }
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_FORMS: SpecialtyForm[] = [
  {
    id: "sf-asif-immuno",
    name: "Dr. Asif Imam — Immunology Consultation",
    status: "published",
    assignedDoctorIds: ["doc-asif"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: "s1", title: "Chief Complaint", description: "",
        fields: [{ id: "f1", label: "Chief Complaint", type: "textarea", placeholder: "Describe the patient's main complaint...", options: [] }],
      },
      {
        id: "s2", title: "History 1", description: "",
        fields: [{ id: "f2", label: "History of Present Illness", type: "textarea", placeholder: "Onset, duration, severity, alleviating/aggravating factors...", options: [] }],
      },
      {
        id: "s3", title: "History 2", description: "",
        fields: [{ id: "f3", label: "Past Medical History", type: "textarea", placeholder: "Relevant past conditions, hospitalisations, surgeries...", options: [] }],
      },
      {
        id: "s4", title: "Current Medicine", description: "",
        fields: [{ id: "f4", label: "Current Medications", type: "textarea", placeholder: "List all current medications with dosages and frequency...", options: [] }],
      },
      {
        id: "s5", title: "Physical Examination", description: "",
        fields: [
          { id: "f5", label: "General Appearance", type: "text", placeholder: "Alert, oriented, well-nourished...", options: [] },
          { id: "f6", label: "Examination Findings", type: "textarea", placeholder: "Systemic examination findings...", options: [] },
        ],
      },
      {
        id: "s6", title: "Red Flags", description: "Check all red flag signs that are present",
        fields: [{
          id: "f7", label: "Red Flag Signs", type: "checkbox-group", placeholder: "",
          options: ["Anaphylaxis", "Severe dyspnea", "Angioedema", "Hypotension", "Loss of consciousness", "High-grade fever (> 39°C)"],
        }],
      },
      {
        id: "s7", title: "Provisional Diagnosis", description: "",
        fields: [{ id: "f8", label: "Diagnosis", type: "textarea", placeholder: "Provisional diagnosis with ICD code if available...", options: [] }],
      },
      {
        id: "s8", title: "Investigations", description: "",
        fields: [{ id: "f9", label: "Investigations Required", type: "textarea", placeholder: "List required lab, imaging, or other investigations...", options: [] }],
      },
      {
        id: "s9", title: "General Measures", description: "",
        fields: [{ id: "f10", label: "General Management", type: "textarea", placeholder: "Diet, lifestyle modifications, allergen avoidance...", options: [] }],
      },
      {
        id: "s10", title: "Care Management", description: "",
        fields: [{ id: "f11", label: "Treatment Plan", type: "textarea", placeholder: "Pharmacological and non-pharmacological management plan...", options: [] }],
      },
      {
        id: "s11", title: "Specialist Referrals", description: "",
        fields: [{ id: "f12", label: "Referral Details", type: "textarea", placeholder: "Refer to specialist / department / facility...", options: [] }],
      },
      {
        id: "s12", title: "Others", description: "",
        fields: [{ id: "f13", label: "Additional Notes", type: "textarea", placeholder: "Any other observations, instructions, or follow-up plan...", options: [] }],
      },
    ],
  },
];

// ── Field type metadata ───────────────────────────────────────────────────────

const FIELD_TYPES: { value: FieldType; label: string; icon: React.ReactNode }[] = [
  { value: "textarea",       label: "Text Area",      icon: <AlignLeft   className="h-3.5 w-3.5" /> },
  { value: "text",           label: "Text Input",     icon: <FileText    className="h-3.5 w-3.5" /> },
  { value: "checkbox-group", label: "Checkbox Group", icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { value: "radio-group",    label: "Radio Group",    icon: <ToggleLeft  className="h-3.5 w-3.5" /> },
  { value: "number",         label: "Number",         icon: <Hash        className="h-3.5 w-3.5" /> },
  { value: "date",           label: "Date",           icon: <Calendar    className="h-3.5 w-3.5" /> },
];

function fieldTypeLabel(t: FieldType) {
  return FIELD_TYPES.find(f => f.value === t)?.label ?? t;
}

// ── Factory helpers ───────────────────────────────────────────────────────────

function makeForm(): SpecialtyForm {
  return {
    id: `sf-${Date.now()}`,
    name: "Untitled Form",
    status: "draft",
    sections: [],
    assignedDoctorIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeSection(): FormSection {
  return { id: `sec-${Date.now()}`, title: "New Section", description: "", fields: [] };
}

function makeField(): FormField {
  return { id: `fld-${Date.now()}`, label: "New Field", type: "textarea", placeholder: "", options: [] };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Module
// ═══════════════════════════════════════════════════════════════════════════════

export function SpecialtyFormsModule({ doctors }: { doctors: Doctor[] }) {
  const [forms, setForms] = useState<SpecialtyForm[]>(loadForms);
  const [view, setView]   = useState<"listing" | "builder">("listing");
  const [editingForm, setEditingForm] = useState<SpecialtyForm | null>(null);
  const [deleteId, setDeleteId]       = useState<string | null>(null);

  useEffect(() => { saveForms(forms); }, [forms]);

  const openCreate = () => {
    setEditingForm(makeForm());
    setView("builder");
  };

  const openEdit = (form: SpecialtyForm) => {
    setEditingForm(JSON.parse(JSON.stringify(form)) as SpecialtyForm);
    setView("builder");
  };

  const duplicate = (form: SpecialtyForm) => {
    const copy: SpecialtyForm = {
      ...(JSON.parse(JSON.stringify(form)) as SpecialtyForm),
      id:               `sf-${Date.now()}`,
      name:             `${form.name} (Copy)`,
      status:           "draft",
      assignedDoctorIds: [],
      createdAt:        new Date().toISOString(),
      updatedAt:        new Date().toISOString(),
    };
    setForms(prev => [...prev, copy]);
  };

  const handleSave = (updated: SpecialtyForm) => {
    const stamped = { ...updated, updatedAt: new Date().toISOString() };
    setForms(prev => {
      const idx = prev.findIndex(f => f.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = stamped;
        return next;
      }
      return [...prev, stamped];
    });
    setView("listing");
    setEditingForm(null);
  };

  const confirmDelete = () => {
    if (deleteId) setForms(prev => prev.filter(f => f.id !== deleteId));
    setDeleteId(null);
  };

  // ── Builder view ────────────────────────────────────────────────────────────

  if (view === "builder" && editingForm) {
    return (
      <FormBuilder
        form={editingForm}
        doctors={doctors}
        onSave={handleSave}
        onBack={() => { setView("listing"); setEditingForm(null); }}
      />
    );
  }

  // ── Listing view ────────────────────────────────────────────────────────────

  const published = forms.filter(f => f.status === "published").length;
  const drafts    = forms.filter(f => f.status === "draft").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Specialty Forms</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create custom clinical forms for doctors as an alternative to the standard SOAP Note.
          </p>
        </div>
        <Button className="bg-[#4982CF] text-white hover:bg-[#3D73BC]" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />New Form
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Forms", value: forms.length, color: "text-slate-700" },
          { label: "Published",   value: published,    color: "text-emerald-700" },
          { label: "Drafts",      value: drafts,       color: "text-amber-700" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={`mt-1 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Form list */}
      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-slate-400">
          <Layers className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">No specialty forms yet</p>
          <p className="mt-1 text-xs">Click "New Form" to create your first custom clinical form</p>
          <Button className="mt-4 bg-[#4982CF] text-white hover:bg-[#3D73BC]" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />New Form
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map(form => {
            const assignedDoctors = doctors.filter(d => form.assignedDoctorIds.includes(d.id));
            const totalFields     = form.sections.reduce((a, s) => a + s.fields.length, 0);
            return (
              <div
                key={form.id}
                className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm hover:border-[#4982CF]/30 transition-colors"
              >
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[#4982CF]/10">
                  <BookOpen className="h-5 w-5 text-[#4982CF]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800 truncate">{form.name}</p>
                    <Badge className={
                      form.status === "published"
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20"
                        : "bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20"
                    }>
                      {form.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span>{form.sections.length} section{form.sections.length !== 1 ? "s" : ""}</span>
                    <span className="text-slate-300">·</span>
                    <span>{totalFields} field{totalFields !== 1 ? "s" : ""}</span>
                    <span className="text-slate-300">·</span>
                    {assignedDoctors.length > 0 ? (
                      <span className="font-medium" style={{ color: ACCENT }}>
                        {assignedDoctors.slice(0, 2).map(d => d.name).join(", ")}
                        {assignedDoctors.length > 2 && ` +${assignedDoctors.length - 2} more`}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">No doctors assigned</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-none items-center gap-1">
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-slate-400 hover:bg-[#4982CF]/10 hover:text-[#4982CF]"
                    onClick={() => openEdit(form)} title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-slate-400 hover:bg-slate-100"
                    onClick={() => duplicate(form)} title="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => setDeleteId(form.id)} title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the specialty form, all its sections and fields, and its
              doctor assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              Delete Form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Form Builder
// ═══════════════════════════════════════════════════════════════════════════════

function FormBuilder({
  form: initialForm,
  doctors,
  onSave,
  onBack,
}: {
  form: SpecialtyForm;
  doctors: Doctor[];
  onSave: (form: SpecialtyForm) => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState<SpecialtyForm>(initialForm);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialForm.sections[0]?.id ?? null,
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"fields" | "assignments">("fields");

  const selectedSection = form.sections.find(s => s.id === selectedSectionId) ?? null;

  // ── Section mutations ──────────────────────────────────────────────────────

  const addSection = () => {
    const sec = makeSection();
    setForm(f => ({ ...f, sections: [...f.sections, sec] }));
    setSelectedSectionId(sec.id);
    setActiveTab("fields");
  };

  const updateSectionTitle = (id: string, title: string) =>
    setForm(f => ({ ...f, sections: f.sections.map(s => s.id === id ? { ...s, title } : s) }));

  const updateSectionDesc = (id: string, description: string) =>
    setForm(f => ({ ...f, sections: f.sections.map(s => s.id === id ? { ...s, description } : s) }));

  const deleteSection = (id: string) => {
    const remaining = form.sections.filter(s => s.id !== id);
    setForm(f => ({ ...f, sections: remaining }));
    if (selectedSectionId === id) setSelectedSectionId(remaining[0]?.id ?? null);
  };

  const moveSection = (id: string, dir: -1 | 1) => {
    setForm(f => {
      const arr = [...f.sections];
      const idx = arr.findIndex(s => s.id === id);
      const to  = idx + dir;
      if (idx < 0 || to < 0 || to >= arr.length) return f;
      [arr[idx], arr[to]] = [arr[to], arr[idx]];
      return { ...f, sections: arr };
    });
  };

  // ── Field mutations ────────────────────────────────────────────────────────

  const addField = (sectionId: string) => {
    const fld = makeField();
    setForm(f => ({
      ...f,
      sections: f.sections.map(s =>
        s.id === sectionId ? { ...s, fields: [...s.fields, fld] } : s,
      ),
    }));
  };

  const updateField = (sectionId: string, fieldId: string, patch: Partial<FormField>) =>
    setForm(f => ({
      ...f,
      sections: f.sections.map(s =>
        s.id !== sectionId ? s
          : { ...s, fields: s.fields.map(fld => fld.id === fieldId ? { ...fld, ...patch } : fld) },
      ),
    }));

  const deleteField = (sectionId: string, fieldId: string) =>
    setForm(f => ({
      ...f,
      sections: f.sections.map(s =>
        s.id !== sectionId ? s : { ...s, fields: s.fields.filter(fld => fld.id !== fieldId) },
      ),
    }));

  const duplicateField = (sectionId: string, fieldId: string) =>
    setForm(f => ({
      ...f,
      sections: f.sections.map(s => {
        if (s.id !== sectionId) return s;
        const idx = s.fields.findIndex(fld => fld.id === fieldId);
        if (idx < 0) return s;
        const copy = { ...s.fields[idx], id: `fld-${Date.now()}` };
        const arr  = [...s.fields];
        arr.splice(idx + 1, 0, copy);
        return { ...s, fields: arr };
      }),
    }));

  const moveField = (sectionId: string, fieldId: string, dir: -1 | 1) =>
    setForm(f => ({
      ...f,
      sections: f.sections.map(s => {
        if (s.id !== sectionId) return s;
        const arr = [...s.fields];
        const idx = arr.findIndex(fld => fld.id === fieldId);
        const to  = idx + dir;
        if (idx < 0 || to < 0 || to >= arr.length) return s;
        [arr[idx], arr[to]] = [arr[to], arr[idx]];
        return { ...s, fields: arr };
      }),
    }));

  // ── Doctor assignment ──────────────────────────────────────────────────────

  const toggleDoctor = (docId: string) =>
    setForm(f => ({
      ...f,
      assignedDoctorIds: f.assignedDoctorIds.includes(docId)
        ? f.assignedDoctorIds.filter(id => id !== docId)
        : [...f.assignedDoctorIds, docId],
    }));

  // ── Preview ────────────────────────────────────────────────────────────────

  if (previewMode) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex flex-none items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
          <Button variant="ghost" size="sm" onClick={() => setPreviewMode(false)} className="text-slate-600">
            <ChevronLeft className="mr-1 h-4 w-4" />Back to Builder
          </Button>
          <div className="w-px h-4 bg-slate-200" />
          <span className="text-sm font-bold text-slate-800 truncate">{form.name || "Untitled Form"}</span>
          <Badge className="bg-[#4982CF]/10 border-[#4982CF]/20 text-[#4982CF]">Preview</Badge>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl space-y-5">
            <h1 className="text-xl font-bold text-slate-900">{form.name || "Untitled Form"}</h1>
            {form.sections.length === 0 ? (
              <p className="text-sm italic text-slate-400">No sections added yet.</p>
            ) : form.sections.map((sec, idx) => (
              <div key={sec.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <p className="font-bold text-slate-800">{idx + 1}. {sec.title}</p>
                  {sec.description && <p className="mt-0.5 text-xs text-slate-500">{sec.description}</p>}
                </div>
                <div className="space-y-4 px-5 py-4">
                  {sec.fields.length === 0 ? (
                    <p className="text-xs italic text-slate-400">No fields in this section.</p>
                  ) : sec.fields.map(fld => (
                    <PreviewField key={fld.id} field={fld} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Builder ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-none items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 text-slate-600">
          <ChevronLeft className="mr-1 h-4 w-4" />Forms
        </Button>
        <div className="w-px h-4 shrink-0 bg-slate-200" />
        <Input
          className="h-8 max-w-xs border-0 bg-transparent px-0 text-sm font-bold text-slate-800 focus-visible:ring-0 placeholder:font-normal placeholder:text-slate-400"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Form name..."
        />
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => setPreviewMode(true)}>
          <Eye className="mr-1.5 h-3.5 w-3.5" />Preview
        </Button>
        <Button
          variant="outline" size="sm" className="shrink-0"
          onClick={() => onSave({ ...form, status: "draft" })}
        >
          Save Draft
        </Button>
        <Button
          size="sm"
          className="shrink-0 text-white hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
          onClick={() => onSave({ ...form, status: "published" })}
        >
          <Send className="mr-1.5 h-3.5 w-3.5" />Publish
        </Button>
      </div>

      {/* Body: three-panel layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Section list ── */}
        <div className="flex w-52 flex-none flex-col border-r border-slate-200 bg-slate-50 overflow-hidden">
          <div className="flex flex-none items-center justify-between border-b border-slate-200 px-3 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sections</span>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 hover:bg-[#4982CF]/10"
              style={{ color: ACCENT }}
              onClick={addSection}
              title="Add section"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {form.sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <p className="text-center text-[11px]">No sections yet.<br />Click + to add one.</p>
              </div>
            ) : form.sections.map((sec, idx) => (
              <div
                key={sec.id}
                onClick={() => { setSelectedSectionId(sec.id); setActiveTab("fields"); }}
                className={`group flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-2 transition-colors ${selectedSectionId === sec.id ? "border-[#4982CF]/25 bg-[#4982CF]/10" : "border-transparent hover:border-slate-200 hover:bg-white"}`}
              >
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                <span className={`flex-1 truncate text-xs font-medium ${selectedSectionId === sec.id ? "text-[#4982CF]" : "text-slate-700"}`}>
                  {idx + 1}. {sec.title}
                </span>
                <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                  <button
                    onClick={e => { e.stopPropagation(); moveSection(sec.id, -1); }}
                    className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    disabled={idx === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); moveSection(sec.id, 1); }}
                    className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    disabled={idx === form.sections.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deleteSection(sec.id); }}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-none border-t border-slate-200 p-2">
            <Button
              variant="outline" size="sm"
              className="w-full border-dashed border-slate-300 text-xs text-slate-500 hover:border-[#4982CF]/50 hover:text-[#4982CF]"
              onClick={addSection}
            >
              <Plus className="mr-1 h-3 w-3" />Add Section
            </Button>
          </div>
        </div>

        {/* ── Center/Right: Fields + Assignments ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tab strip */}
          <div className="flex flex-none border-b border-slate-200 bg-white">
            <button
              onClick={() => setActiveTab("fields")}
              className={`flex items-center gap-1.5 border-b-2 px-5 py-2.5 text-xs font-semibold transition-colors ${activeTab === "fields" ? "border-[#4982CF] text-[#4982CF]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              <Layers className="h-3.5 w-3.5" />Fields
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`flex items-center gap-1.5 border-b-2 px-5 py-2.5 text-xs font-semibold transition-colors ${activeTab === "assignments" ? "border-[#4982CF] text-[#4982CF]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              <Users className="h-3.5 w-3.5" />Doctor Assignments
              {form.assignedDoctorIds.length > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {form.assignedDoctorIds.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "fields" ? (
            <div className="flex-1 overflow-y-auto p-5">
              {!selectedSection ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-400">
                  <Layers className="mb-3 h-8 w-8 opacity-30" />
                  <p className="text-sm">
                    {form.sections.length === 0
                      ? "Add a section from the left panel to start building."
                      : "Select a section from the left to edit its fields."}
                  </p>
                </div>
              ) : (
                <div className="max-w-2xl space-y-5">
                  {/* Section meta */}
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Section Details</p>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Section Title</Label>
                      <Input
                        className="h-9"
                        value={selectedSection.title}
                        onChange={e => updateSectionTitle(selectedSection.id, e.target.value)}
                        placeholder="Section title..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">
                        Description / Instructions{" "}
                        <span className="font-normal text-slate-400">(optional)</span>
                      </Label>
                      <Textarea
                        className="min-h-[52px] resize-none text-sm"
                        value={selectedSection.description}
                        onChange={e => updateSectionDesc(selectedSection.id, e.target.value)}
                        placeholder="Instructions visible to the doctor during consultation..."
                      />
                    </div>
                  </div>

                  {/* Fields header */}
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Fields{" "}
                      <span className="text-slate-300">({selectedSection.fields.length})</span>
                    </p>
                    <Button
                      size="sm" variant="outline"
                      className="h-7 border-dashed border-[#4982CF]/40 text-xs text-[#4982CF] hover:bg-[#4982CF]/5"
                      onClick={() => addField(selectedSection.id)}
                    >
                      <Plus className="mr-1 h-3 w-3" />Add Field
                    </Button>
                  </div>

                  {/* Fields list */}
                  {selectedSection.fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-10 text-slate-400">
                      <p className="text-sm">No fields in this section</p>
                      <Button
                        size="sm"
                        className="mt-3 text-white hover:opacity-90"
                        style={{ backgroundColor: ACCENT }}
                        onClick={() => addField(selectedSection.id)}
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />Add First Field
                      </Button>
                    </div>
                  ) : selectedSection.fields.map((fld, fIdx) => (
                    <FieldEditor
                      key={fld.id}
                      field={fld}
                      index={fIdx}
                      total={selectedSection.fields.length}
                      onChange={patch => updateField(selectedSection.id, fld.id, patch)}
                      onDelete={()    => deleteField(selectedSection.id, fld.id)}
                      onDuplicate={()  => duplicateField(selectedSection.id, fld.id)}
                      onMoveUp={()    => moveField(selectedSection.id, fld.id, -1)}
                      onMoveDown={()  => moveField(selectedSection.id, fld.id, 1)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5">
              <DoctorAssignmentPanel
                doctors={doctors}
                assignedIds={form.assignedDoctorIds}
                onToggle={toggleDoctor}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Field Editor
// ═══════════════════════════════════════════════════════════════════════════════

function FieldEditor({
  field, index, total, onChange, onDelete, onDuplicate, onMoveUp, onMoveDown,
}: {
  field: FormField;
  index: number;
  total: number;
  onChange: (patch: Partial<FormField>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const needsOptions = field.type === "checkbox-group" || field.type === "radio-group";

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#4982CF]/25">
      {/* Row header */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400">#{index + 1}</span>
        <GripVertical className="h-3.5 w-3.5 text-slate-300" />
        <span className="flex-1 truncate text-xs font-semibold text-slate-600">
          {field.label || "Untitled Field"}
        </span>
        <Badge variant="outline" className="shrink-0 border-slate-200 text-[10px] text-slate-500">
          {fieldTypeLabel(field.type)}
        </Badge>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={onMoveUp}    disabled={index === 0}><ArrowUp    className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={onMoveDown}  disabled={index === total - 1}><ArrowDown  className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={onDuplicate}><Copy      className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-rose-600"  onClick={onDelete}   ><Trash2    className="h-3 w-3" /></Button>
        </div>
      </div>

      {/* Row body */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-slate-500">Label</Label>
          <Input
            className="h-8 text-sm"
            value={field.label}
            onChange={e => onChange({ label: e.target.value })}
            placeholder="Field label..."
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-slate-500">Field Type</Label>
          <Select value={field.type} onValueChange={v => onChange({ type: v as FieldType, options: [] })}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map(ft => (
                <SelectItem key={ft.value} value={ft.value}>
                  <div className="flex items-center gap-2">{ft.icon}<span>{ft.label}</span></div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!needsOptions && (
          <div className="col-span-2 space-y-1.5">
            <Label className="text-[11px] font-semibold text-slate-500">
              Placeholder / Hint{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </Label>
            <Input
              className="h-8 text-sm"
              value={field.placeholder}
              onChange={e => onChange({ placeholder: e.target.value })}
              placeholder="Hint text shown inside the field..."
            />
          </div>
        )}

        {needsOptions && (
          <div className="col-span-2 space-y-1.5">
            <Label className="text-[11px] font-semibold text-slate-500">
              Options{" "}
              <span className="font-normal text-slate-400">(one per line)</span>
            </Label>
            <Textarea
              className="min-h-[80px] resize-none font-mono text-sm"
              value={field.options.join("\n")}
              onChange={e => onChange({ options: e.target.value.split("\n") })}
              placeholder={"Option 1\nOption 2\nOption 3"}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Preview Field (read-only render)
// ═══════════════════════════════════════════════════════════════════════════════

function PreviewField({ field }: { field: FormField }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-slate-700">{field.label}</Label>
      {field.type === "textarea" && (
        <Textarea disabled className="min-h-[72px] bg-slate-50 text-sm" placeholder={field.placeholder || "—"} />
      )}
      {field.type === "text" && (
        <Input disabled className="h-9 bg-slate-50 text-sm" placeholder={field.placeholder || "—"} />
      )}
      {field.type === "number" && (
        <Input type="number" disabled className="h-9 w-40 bg-slate-50 text-sm" placeholder={field.placeholder || "0"} />
      )}
      {field.type === "date" && (
        <Input type="date" disabled className="h-9 w-48 bg-slate-50 text-sm" />
      )}
      {field.type === "checkbox-group" && (
        <div className="space-y-1.5">
          {(field.options.filter(Boolean).length ? field.options.filter(Boolean) : ["Option 1", "Option 2"]).map(opt => (
            <label key={opt} className="flex cursor-not-allowed items-center gap-2 text-sm text-slate-600">
              <Checkbox disabled />
              {opt}
            </label>
          ))}
        </div>
      )}
      {field.type === "radio-group" && (
        <div className="space-y-1.5">
          {(field.options.filter(Boolean).length ? field.options.filter(Boolean) : ["Option 1", "Option 2"]).map(opt => (
            <label key={opt} className="flex cursor-not-allowed items-center gap-2 text-sm text-slate-600">
              <input type="radio" disabled className="accent-[#4982CF]" readOnly />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Doctor Assignment Panel
// ═══════════════════════════════════════════════════════════════════════════════

function DoctorAssignmentPanel({
  doctors,
  assignedIds,
  onToggle,
}: {
  doctors: Doctor[];
  assignedIds: string[];
  onToggle: (id: string) => void;
}) {
  const activeDocs   = doctors.filter(d => d.status === "active");
  const inactiveDocs = doctors.filter(d => d.status !== "active");

  function DoctorRow({ doc }: { doc: Doctor }) {
    const assigned = assignedIds.includes(doc.id);
    return (
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${assigned ? "border-[#4982CF]/30 bg-[#4982CF]/5" : "border-transparent hover:bg-slate-50"}`}
      >
        <Checkbox
          checked={assigned}
          onCheckedChange={() => onToggle(doc.id)}
          className="data-[state=checked]:border-[#4982CF] data-[state=checked]:bg-[#4982CF]"
        />
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
          style={{ background: `${ACCENT}18`, color: ACCENT }}
        >
          {doc.name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("")}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-medium ${assigned ? "text-[#4982CF]" : "text-slate-700"}`}>
            {doc.name}
          </p>
          <p className="truncate text-[10px] text-slate-400">
            {doc.specialties.slice(0, 2).join(", ") || "No specialties assigned"}
          </p>
        </div>
        {assigned && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />}
      </label>
    );
  }

  return (
    <div className="max-w-md space-y-5">
      <div>
        <h3 className="font-bold text-slate-800">Doctor Assignment</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Select which doctors will have access to this specialty form during consultations.
        </p>
      </div>

      {assignedIds.length > 0 && (
        <div className="rounded-lg border px-4 py-3" style={{ borderColor: `${ACCENT}33`, background: `${ACCENT}0D` }}>
          <p className="text-xs font-semibold" style={{ color: ACCENT }}>
            {assignedIds.length} doctor{assignedIds.length !== 1 ? "s" : ""} assigned to this form
          </p>
        </div>
      )}

      {activeDocs.length > 0 && (
        <div className="space-y-1">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Doctors</p>
          <div className="space-y-1">
            {activeDocs.map(doc => <DoctorRow key={doc.id} doc={doc} />)}
          </div>
        </div>
      )}

      {inactiveDocs.length > 0 && (
        <div className="space-y-1 opacity-60">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Inactive Doctors</p>
          <div className="space-y-1">
            {inactiveDocs.map(doc => <DoctorRow key={doc.id} doc={doc} />)}
          </div>
        </div>
      )}

      {doctors.length === 0 && (
        <p className="text-sm italic text-slate-400">
          No doctors found. Add doctors in the Doctors module first.
        </p>
      )}
    </div>
  );
}
