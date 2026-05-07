import { useState, useEffect } from "react";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Check, AlertCircle,
  Edit2, User, Users, Heart, Globe, Layers, GitMerge, Zap,
  FileText, X, CheckCircle2, Shield, Banknote, Building2,
  Info, ArrowRight, ToggleLeft, Workflow, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useRegConfig,
  type RegField, type RegSection, type FieldType,
  type WelfareFormTemplate, type QuickRegProfile, type QuickRegField, type ConditionalRule,
} from "@/hooks/useRegConfig";
import { SEED_VISIT_TYPES } from "@/pages/QueueModule";

// ─── Section Prop Type ────────────────────────────────────────────────────────

export type PatRegSection =
  | "reg-basic-info"
  | "reg-patient-types"
  | "reg-welfare-forms"
  | "reg-demographics"
  | "reg-custom-sections"
  | "reg-workflow"
  | "reg-quick";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PageHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  );
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Text", number: "Number", dropdown: "Dropdown", checkbox: "Checkbox",
  radio: "Radio", date: "Date", textarea: "Textarea", file: "File Upload", signature: "Signature",
};

const FIELD_TYPE_COLORS: Record<FieldType, string> = {
  text: "bg-blue-50 text-blue-700", number: "bg-purple-50 text-purple-700",
  dropdown: "bg-amber-50 text-amber-700", checkbox: "bg-green-50 text-green-700",
  radio: "bg-teal-50 text-teal-700", date: "bg-cyan-50 text-cyan-700",
  textarea: "bg-slate-100 text-slate-600", file: "bg-orange-50 text-orange-700",
  signature: "bg-rose-50 text-rose-700",
};

function FieldTypeBadge({ type }: { type: FieldType }) {
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${FIELD_TYPE_COLORS[type]}`}>
      {FIELD_TYPE_LABELS[type]}
    </span>
  );
}

function SavedBanner({ savedAt }: { savedAt: number | null }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!savedAt) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(t);
  }, [savedAt]);
  if (!visible) return null;
  return (
    <div className="fixed top-4 right-6 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
      <CheckCircle2 className="h-3.5 w-3.5" /> Saved
    </div>
  );
}

// ─── Add Field Dialog ─────────────────────────────────────────────────────────

interface AddFieldDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (field: RegField) => void;
  editField?: RegField | null;
}

function AddFieldDialog({ open, onClose, onSave, editField }: AddFieldDialogProps) {
  const blank: RegField = { id: "", label: "", type: "text", required: false, enabled: true, options: [], placeholder: "" };
  const [form, setForm] = useState<RegField>(editField ?? blank);
  const [optionsRaw, setOptionsRaw] = useState((editField?.options ?? []).join("\n"));

  useEffect(() => {
    if (open) {
      const f = editField ?? blank;
      setForm(f);
      setOptionsRaw((f.options ?? []).join("\n"));
    }
  }, [open, editField]);

  function save() {
    if (!form.label.trim()) return;
    const opts = ["dropdown", "radio", "checkbox"].includes(form.type)
      ? optionsRaw.split("\n").map(o => o.trim()).filter(Boolean)
      : [];
    onSave({ ...form, id: form.id || `cf-${Date.now()}`, options: opts });
    onClose();
  }

  const needsOptions = ["dropdown", "radio", "checkbox"].includes(form.type);
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <FileText className="h-4 w-4 text-[#4982CF]" />
            {editField ? "Edit Field" : "Add Field"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Label *</label>
            <Input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder="Field label..." />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
            <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as FieldType }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map(t => (
                  <SelectItem key={t} value={t}>{FIELD_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Placeholder</label>
            <Input value={form.placeholder} onChange={e => setForm(p => ({ ...p, placeholder: e.target.value }))} placeholder="Placeholder text..." />
          </div>
          {needsOptions && (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Options (one per line)</label>
              <textarea
                className="w-full px-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-ring h-24"
                value={optionsRaw}
                onChange={e => setOptionsRaw(e.target.value)}
                placeholder={"Option A\nOption B\nOption C"}
              />
            </div>
          )}
          <div className="flex items-center gap-3">
            <Switch checked={form.required} onCheckedChange={v => setForm(p => ({ ...p, required: v }))} className="data-[state=checked]:bg-[#4982CF]" />
            <span className="text-sm text-slate-600">Required field</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9 text-sm">Cancel</Button>
          <Button onClick={save} disabled={!form.label.trim()} className="flex-1 h-9 text-sm bg-[#4982CF] hover:bg-[#3D73BC] text-white">
            <Check className="h-3.5 w-3.5 mr-1" />{editField ? "Save Changes" : "Add Field"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Field List Editor ────────────────────────────────────────────────────────

interface FieldListEditorProps {
  fields: RegField[];
  onChange: (fields: RegField[]) => void;
  allowAdd?: boolean;
  conditionalFieldIds?: string[];
}

function FieldListEditor({ fields, onChange, allowAdd = true, conditionalFieldIds = [] }: FieldListEditorProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editField, setEditField] = useState<RegField | null>(null);

  function moveField(index: number, dir: -1 | 1) {
    const next = [...fields];
    const swap = next[index + dir];
    if (!swap) return;
    next[index + dir] = next[index];
    next[index] = swap;
    onChange(next);
  }

  function toggleEnabled(id: string) {
    onChange(fields.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  }
  function toggleRequired(id: string) {
    onChange(fields.map(f => f.id === id ? { ...f, required: !f.required } : f));
  }
  function deleteField(id: string) {
    onChange(fields.filter(f => f.id !== id));
  }
  function addOrEditField(field: RegField) {
    if (editField) {
      onChange(fields.map(f => f.id === editField.id ? field : f));
    } else {
      onChange([...fields, field]);
    }
    setEditField(null);
  }

  return (
    <div className="space-y-1.5">
      {fields.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
          No fields yet. Click "Add Field" to get started.
        </div>
      )}
      {fields.map((field, i) => {
        const isConditional = conditionalFieldIds.includes(field.id);
        return (
          <div
            key={field.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-all ${field.enabled ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60"} ${isConditional ? "ml-4 border-dashed" : ""}`}
          >
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveField(i, -1)} disabled={i === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronUp className="h-3 w-3" /></button>
              <button onClick={() => moveField(i, 1)} disabled={i === fields.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronDown className="h-3 w-3" /></button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                <FieldTypeBadge type={field.type} />
                {isConditional && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase">Conditional</span>
                )}
                {field.isBuiltIn && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 uppercase">Built-in</span>
                )}
              </div>
              {field.placeholder && <p className="text-[11px] text-slate-400 mt-0.5">Placeholder: {field.placeholder}</p>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <label className="flex items-center gap-1.5 cursor-pointer" title="Required">
                <Switch checked={field.required} onCheckedChange={() => toggleRequired(field.id)}
                  className="h-4 w-7 data-[state=checked]:bg-rose-500" />
                <span className={`text-[10px] font-bold w-12 ${field.required ? "text-rose-500" : "text-slate-300"}`}>Req'd</span>
              </label>
              <Switch checked={field.enabled} onCheckedChange={() => toggleEnabled(field.id)}
                className="data-[state=checked]:bg-[#4982CF]" />
              {!field.isBuiltIn && (
                <>
                  <button onClick={() => { setEditField(field); setShowAdd(true); }} className="text-slate-400 hover:text-[#4982CF]">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteField(field.id)} className="text-slate-300 hover:text-rose-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
      {allowAdd && (
        <button
          onClick={() => { setEditField(null); setShowAdd(true); }}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#4982CF]/40 py-2.5 text-xs font-bold text-[#4982CF] hover:bg-[#4982CF]/5 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add Field
        </button>
      )}
      <AddFieldDialog
        open={showAdd}
        onClose={() => { setShowAdd(false); setEditField(null); }}
        onSave={addOrEditField}
        editField={editField}
      />
    </div>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteDialog({ open, name, onClose, onConfirm }: { open: boolean; name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <AlertCircle className="h-5 w-5" /> Delete
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600 mt-1">Delete <strong>{name}</strong>? This cannot be undone.</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="h-8 text-sm">Cancel</Button>
          <Button onClick={onConfirm} className="bg-rose-500 hover:bg-rose-600 text-white h-8 text-sm gap-2">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab: Basic Information ────────────────────────────────────────────────────

function BasicInfoTab() {
  const { config, updateConfig, savedAt } = useRegConfig();
  const section = config.sections.find(s => s.sectionType === "basic-info");
  if (!section) return <div className="p-6 text-slate-400">Basic info section not found.</div>;

  const conditionalFieldIds = section.conditionalRules.flatMap(r => r.showFieldIds);
  const regularFields = section.fields.filter(f => !conditionalFieldIds.includes(f.id));
  const conditionalFields = section.fields.filter(f => conditionalFieldIds.includes(f.id));

  const sectionId = section.id;

  function updateSectionFields(fields: RegField[]) {
    updateConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, fields } : s),
    }));
  }

  function updateConditionalFields(newCondFields: RegField[]) {
    const merged = [...regularFields.filter(f => !conditionalFieldIds.includes(f.id)), ...newCondFields];
    updateSectionFields(merged);
  }

  const rule = section.conditionalRules[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SavedBanner savedAt={savedAt} />
      <PageHeader title="Basic Information" desc="Configure the core patient identity fields shown in the registration form." />

      {/* Regular fields */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">Core Fields</p>
          <span className="text-xs text-slate-400">{regularFields.filter(f => f.enabled).length} of {regularFields.length} enabled</span>
        </div>
        <FieldListEditor
          fields={regularFields}
          onChange={newRegular => updateSectionFields([...newRegular, ...conditionalFields])}
          allowAdd={false}
        />
      </div>

      {/* Conditional rule info */}
      {rule && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">Conditional Rule</p>
              <p className="text-xs text-amber-700 mt-0.5">
                When <strong>Relationship Type</strong> is <strong>{rule.triggerValues.join(" / ")}</strong>, the fields below are shown to collect details about the related person.
              </p>
            </div>
          </div>
          <FieldListEditor
            fields={conditionalFields}
            onChange={updateConditionalFields}
            allowAdd={false}
            conditionalFieldIds={conditionalFieldIds}
          />
        </div>
      )}
    </div>
  );
}

// ─── Tab: Patient Types ────────────────────────────────────────────────────────

const PT_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-5 w-5" />,
  insurance: <Shield className="h-5 w-5" />,
  corporate: <Building2 className="h-5 w-5" />,
  welfare: <Heart className="h-5 w-5" />,
};

function PatientTypesTab() {
  const { config, updateConfig, savedAt } = useRegConfig();
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggleType(id: string) {
    updateConfig(prev => ({
      ...prev,
      patientTypes: prev.patientTypes.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t),
    }));
  }

  function updateExtraFields(typeId: string, fields: RegField[]) {
    updateConfig(prev => ({
      ...prev,
      patientTypes: prev.patientTypes.map(t => t.id === typeId ? { ...t, extraFields: fields } : t),
    }));
  }

  function setWelfareForm(typeId: string, welfareFormId: string | null) {
    updateConfig(prev => ({
      ...prev,
      patientTypes: prev.patientTypes.map(t => t.id === typeId ? { ...t, welfareFormId } : t),
    }));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SavedBanner savedAt={savedAt} />
      <PageHeader title="Patient Types" desc="Enable or disable patient categories and configure type-specific fields." />
      <div className="space-y-3">
        {config.patientTypes.map(pt => {
          const isExpanded = expanded === pt.id;
          return (
            <div key={pt.id} className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${pt.enabled ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: pt.enabled ? pt.color : "#cbd5e1" }}>
                  {PT_ICONS[pt.id] ?? <User className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${pt.enabled ? "text-slate-900" : "text-slate-400"}`}>{pt.label}</p>
                  <p className="text-[11px] text-slate-400">
                    {pt.extraFields.filter(f => f.enabled).length} extra field{pt.extraFields.filter(f => f.enabled).length !== 1 ? "s" : ""}
                    {pt.welfareFormId ? " · Welfare form linked" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {(pt.extraFields.length > 0 || pt.id === "welfare") && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : pt.id)}
                      className="text-xs font-semibold text-[#4982CF] hover:opacity-70 flex items-center gap-1"
                    >
                      Configure
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  )}
                  <Switch
                    checked={pt.enabled}
                    onCheckedChange={() => toggleType(pt.id)}
                    className="data-[state=checked]:bg-[#4982CF]"
                  />
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-4 space-y-4">
                  {pt.id === "welfare" ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">Linked Welfare Form</p>
                      <Select
                        value={pt.welfareFormId ?? "none"}
                        onValueChange={v => setWelfareForm(pt.id, v === "none" ? null : v)}
                      >
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select welfare form..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (no welfare form)</SelectItem>
                          {config.welfareForms.map(wf => (
                            <SelectItem key={wf.id} value={wf.id}>{wf.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-slate-400 mt-1.5">When a patient selects Welfare type, this form is presented for them to complete.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">Type-Specific Fields</p>
                      <FieldListEditor
                        fields={pt.extraFields}
                        onChange={fields => updateExtraFields(pt.id, fields)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Welfare Forms ────────────────────────────────────────────────────────

function WelfareFormsTab() {
  const { config, updateConfig, savedAt } = useRegConfig();
  const [expanded, setExpanded] = useState<string | null>(config.welfareForms[0]?.id ?? null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [addingName, setAddingName] = useState(false);
  const [newName, setNewName] = useState("");

  function addForm() {
    if (!newName.trim()) return;
    const id = `wf-${Date.now()}`;
    updateConfig(prev => ({
      ...prev,
      welfareForms: [...prev.welfareForms, { id, name: newName.trim(), fields: [] }],
    }));
    setExpanded(id);
    setNewName("");
    setAddingName(false);
  }

  function deleteForm(id: string) {
    updateConfig(prev => ({
      ...prev,
      welfareForms: prev.welfareForms.filter(f => f.id !== id),
    }));
    setDeleteTarget(null);
  }

  function updateFormFields(formId: string, fields: RegField[]) {
    updateConfig(prev => ({
      ...prev,
      welfareForms: prev.welfareForms.map(f => f.id === formId ? { ...f, fields } : f),
    }));
  }

  function renameForm(formId: string, name: string) {
    updateConfig(prev => ({
      ...prev,
      welfareForms: prev.welfareForms.map(f => f.id === formId ? { ...f, name } : f),
    }));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SavedBanner savedAt={savedAt} />
      <div className="flex items-start justify-between">
        <PageHeader title="Welfare Form Builder" desc="Design forms that welfare patients must complete during registration." />
        <Button size="sm" className="bg-[#4982CF] hover:bg-[#3D73BC] text-white h-9 gap-2 flex-shrink-0" onClick={() => setAddingName(true)}>
          <Plus className="h-4 w-4" /> New Form
        </Button>
      </div>
      {addingName && (
        <div className="rounded-xl border border-[#4982CF]/30 bg-[#4982CF]/5 p-4 flex items-center gap-3">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Form name..." className="h-9 flex-1" autoFocus onKeyDown={e => { if (e.key === "Enter") addForm(); if (e.key === "Escape") setAddingName(false); }} />
          <Button size="sm" onClick={addForm} className="bg-[#4982CF] hover:bg-[#3D73BC] text-white h-9"><Check className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setAddingName(false)} className="h-9"><X className="h-4 w-4" /></Button>
        </div>
      )}
      {config.welfareForms.length === 0 && !addingName && (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-400 space-y-2">
          <Heart className="h-8 w-8 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No welfare forms yet</p>
          <p className="text-xs">Click "New Form" to create one.</p>
        </div>
      )}
      <div className="space-y-3">
        {config.welfareForms.map(form => {
          const isExpanded = expanded === form.id;
          return (
            <div key={form.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <Heart className="h-4 w-4 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{form.name}</p>
                  <p className="text-[11px] text-slate-400">{form.fields.filter(f => f.enabled).length} field{form.fields.filter(f => f.enabled).length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setExpanded(isExpanded ? null : form.id)} className="text-xs font-semibold text-[#4982CF] hover:opacity-70 flex items-center gap-1">
                    {isExpanded ? "Collapse" : "Edit Fields"}
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => setDeleteTarget({ id: form.id, name: form.name })} className="text-slate-300 hover:text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-4 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Form Name</label>
                    <Input value={form.name} onChange={e => renameForm(form.id, e.target.value)} className="h-9 max-w-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Fields</label>
                    <FieldListEditor fields={form.fields} onChange={fields => updateFormFields(form.id, fields)} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <DeleteDialog
        open={!!deleteTarget}
        name={deleteTarget?.name ?? ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteForm(deleteTarget.id)}
      />
    </div>
  );
}

// ─── Tab: Demographics ────────────────────────────────────────────────────────

function DemographicsTab() {
  const { config, updateConfig, savedAt } = useRegConfig();
  const section = config.sections.find(s => s.sectionType === "demographics");
  if (!section) return <div className="p-6 text-slate-400">Demographics section not found.</div>;

  function toggleSection() {
    updateConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.sectionType === "demographics" ? { ...s, enabled: !s.enabled } : s),
    }));
  }

  function updateFields(fields: RegField[]) {
    updateConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.sectionType === "demographics" ? { ...s, fields } : s),
    }));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SavedBanner savedAt={savedAt} />
      <PageHeader title="Demographics" desc="Optional social and demographic data collected during registration." />
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Show Demographics Section</p>
          <p className="text-xs text-slate-400 mt-0.5">When enabled, the demographics block appears after basic info in the registration form.</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={section.enabled} onCheckedChange={toggleSection} className="data-[state=checked]:bg-[#4982CF]" />
          <span className={`text-xs font-bold w-8 ${section.enabled ? "text-[#4982CF]" : "text-slate-400"}`}>{section.enabled ? "On" : "Off"}</span>
        </div>
      </div>
      {section.enabled && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Demographics Fields</p>
          <FieldListEditor fields={section.fields} onChange={updateFields} />
        </div>
      )}
      {!section.enabled && (
        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-slate-400 space-y-1">
          <Globe className="h-8 w-8 mx-auto text-slate-300" />
          <p className="text-sm">Demographics section is currently <strong>disabled</strong>.</p>
          <p className="text-xs">Enable it above to configure its fields.</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Custom Sections ─────────────────────────────────────────────────────

function CustomSectionsTab() {
  const { config, updateConfig, savedAt } = useRegConfig();
  const customSections = config.sections.filter(s => s.sectionType === "custom");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [addingName, setAddingName] = useState(false);
  const [newName, setNewName] = useState("");

  function addSection() {
    if (!newName.trim()) return;
    const maxOrder = Math.max(0, ...config.sections.map(s => s.workflowOrder));
    const id = `sec-${Date.now()}`;
    const newSection: RegSection = {
      id,
      name: newName.trim(),
      description: "",
      enabled: true,
      signatureRequired: false,
      fields: [],
      conditionalRules: [],
      workflowOrder: maxOrder + 1,
      isBuiltIn: false,
      sectionType: "custom",
    };
    updateConfig(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
    setExpanded(id);
    setNewName("");
    setAddingName(false);
  }

  function deleteSection(id: string) {
    updateConfig(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== id) }));
    setDeleteTarget(null);
  }

  function updateSection(id: string, patch: Partial<RegSection>) {
    updateConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, ...patch } : s),
    }));
  }

  function addConditionalRule(sectionId: string) {
    const rule: ConditionalRule = {
      id: `rule-${Date.now()}`,
      triggerFieldId: "",
      triggerValues: [],
      showFieldIds: [],
    };
    updateConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, conditionalRules: [...s.conditionalRules, rule] } : s
      ),
    }));
  }

  function removeConditionalRule(sectionId: string, ruleId: string) {
    updateConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, conditionalRules: s.conditionalRules.filter(r => r.id !== ruleId) } : s
      ),
    }));
  }

  function updateConditionalRule(sectionId: string, ruleId: string, patch: Partial<ConditionalRule>) {
    updateConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? { ...s, conditionalRules: s.conditionalRules.map(r => r.id === ruleId ? { ...r, ...patch } : r) }
          : s
      ),
    }));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SavedBanner savedAt={savedAt} />
      <div className="flex items-start justify-between">
        <PageHeader title="Custom Sections" desc="Add custom data-capture sections to the registration form." />
        <Button size="sm" className="bg-[#4982CF] hover:bg-[#3D73BC] text-white h-9 gap-2 flex-shrink-0" onClick={() => setAddingName(true)}>
          <Plus className="h-4 w-4" /> New Section
        </Button>
      </div>
      {addingName && (
        <div className="rounded-xl border border-[#4982CF]/30 bg-[#4982CF]/5 p-4 flex items-center gap-3">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Section name..." className="h-9 flex-1" autoFocus
            onKeyDown={e => { if (e.key === "Enter") addSection(); if (e.key === "Escape") setAddingName(false); }} />
          <Button size="sm" onClick={addSection} className="bg-[#4982CF] hover:bg-[#3D73BC] text-white h-9"><Check className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setAddingName(false)} className="h-9"><X className="h-4 w-4" /></Button>
        </div>
      )}
      {customSections.length === 0 && !addingName && (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-400 space-y-2">
          <Layers className="h-8 w-8 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No custom sections yet</p>
          <p className="text-xs">Click "New Section" to add additional data blocks.</p>
        </div>
      )}
      <div className="space-y-3">
        {customSections.map(sec => {
          const isExpanded = expanded === sec.id;
          return (
            <div key={sec.id} className={`rounded-2xl border shadow-sm overflow-hidden ${sec.enabled ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-xl bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
                  <Layers className="h-4 w-4 text-[#4982CF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${sec.enabled ? "text-slate-900" : "text-slate-400"}`}>{sec.name}</p>
                  <p className="text-[11px] text-slate-400">{sec.fields.filter(f => f.enabled).length} field{sec.fields.filter(f => f.enabled).length !== 1 ? "s" : ""}{sec.signatureRequired ? " · Signature required" : ""}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => setExpanded(isExpanded ? null : sec.id)} className="text-xs font-semibold text-[#4982CF] hover:opacity-70 flex items-center gap-1">
                    {isExpanded ? "Collapse" : "Edit"}
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  <Switch checked={sec.enabled} onCheckedChange={() => updateSection(sec.id, { enabled: !sec.enabled })} className="data-[state=checked]:bg-[#4982CF]" />
                  <button onClick={() => setDeleteTarget({ id: sec.id, name: sec.name })} className="text-slate-300 hover:text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-4 space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Section Name</label>
                      <Input value={sec.name} onChange={e => updateSection(sec.id, { name: e.target.value })} className="h-9" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Description (optional)</label>
                      <Input value={sec.description} onChange={e => updateSection(sec.id, { description: e.target.value })} className="h-9" placeholder="Brief description..." />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Require Signature</p>
                      <p className="text-xs text-slate-400">Patient must sign at the end of this section.</p>
                    </div>
                    <Switch checked={sec.signatureRequired} onCheckedChange={v => updateSection(sec.id, { signatureRequired: v })} className="data-[state=checked]:bg-[#4982CF]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Fields</label>
                    <FieldListEditor fields={sec.fields} onChange={fields => updateSection(sec.id, { fields })} />
                  </div>
                  <div className="border-t border-slate-100 pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Conditional Rules</label>
                      <button onClick={() => addConditionalRule(sec.id)} className="text-xs text-[#4982CF] font-semibold hover:opacity-70 flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Add Rule
                      </button>
                    </div>
                    {sec.conditionalRules.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-200 rounded-lg">
                        No rules — all fields shown unconditionally.
                      </p>
                    )}
                    {sec.conditionalRules.map(rule => (
                      <div key={rule.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">When field value matches…</span>
                          <button onClick={() => removeConditionalRule(sec.id, rule.id)} className="text-slate-300 hover:text-rose-400">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 block">Trigger Field</label>
                            <Select value={rule.triggerFieldId || ""} onValueChange={v => updateConditionalRule(sec.id, rule.id, { triggerFieldId: v })}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select field…" /></SelectTrigger>
                              <SelectContent>
                                {sec.fields.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 block">Trigger Value(s)</label>
                            <Input
                              className="h-8 text-xs"
                              placeholder="val1, val2…"
                              value={rule.triggerValues.join(", ")}
                              onChange={e => updateConditionalRule(sec.id, rule.id, {
                                triggerValues: e.target.value.split(",").map(v => v.trim()).filter(Boolean),
                              })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-slate-400 mb-2 block">Then show these fields</label>
                          {sec.fields.filter(f => f.id !== rule.triggerFieldId).length === 0 ? (
                            <p className="text-xs text-slate-400">Add other fields first.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {sec.fields.filter(f => f.id !== rule.triggerFieldId).map(f => {
                                const selected = rule.showFieldIds.includes(f.id);
                                return (
                                  <button key={f.id}
                                    onClick={() => updateConditionalRule(sec.id, rule.id, {
                                      showFieldIds: selected
                                        ? rule.showFieldIds.filter(id => id !== f.id)
                                        : [...rule.showFieldIds, f.id],
                                    })}
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${selected ? "bg-[#4982CF] text-white border-[#4982CF]" : "border-slate-200 text-slate-600 hover:border-[#4982CF]"}`}>
                                    {f.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <DeleteDialog
        open={!!deleteTarget}
        name={deleteTarget?.name ?? ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteSection(deleteTarget.id)}
      />
    </div>
  );
}

// ─── Tab: Workflow Builder ────────────────────────────────────────────────────

function WorkflowBuilderTab() {
  const { config, updateConfig, savedAt } = useRegConfig();
  const sorted = [...config.sections].sort((a, b) => a.workflowOrder - b.workflowOrder);

  function moveSection(id: string, dir: -1 | 1) {
    updateConfig(prev => {
      const sections = [...prev.sections].sort((a, b) => a.workflowOrder - b.workflowOrder);
      const idx = sections.findIndex(s => s.id === id);
      const swap = sections[idx + dir];
      if (!swap) return prev;
      const aOrder = sections[idx].workflowOrder;
      const bOrder = swap.workflowOrder;
      return {
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id === id) return { ...s, workflowOrder: bOrder };
          if (s.id === swap.id) return { ...s, workflowOrder: aOrder };
          return s;
        }),
      };
    });
  }

  function toggleSection(id: string) {
    updateConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s),
    }));
  }

  const SECTION_ICONS: Record<string, React.ReactNode> = {
    "basic-info": <User className="h-4 w-4" />,
    "demographics": <Globe className="h-4 w-4" />,
    "custom": <Layers className="h-4 w-4" />,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SavedBanner savedAt={savedAt} />
      <PageHeader title="Workflow Builder" desc="Define the order in which sections appear during patient registration." />
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-[32px_1fr_80px_60px_80px] text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
          <span>Step</span><span>Section</span><span>Type</span><span className="text-center">Active</span><span className="text-center">Reorder</span>
        </div>
        {sorted.map((sec, i) => (
          <div key={sec.id} className={`grid grid-cols-[32px_1fr_80px_60px_80px] items-center px-4 py-3 border-b border-slate-50 last:border-0 ${sec.enabled ? "bg-white" : "bg-slate-50 opacity-60"}`}>
            <span className="text-sm font-bold text-slate-400 font-mono">{i + 1}</span>
            <div>
              <p className={`text-sm font-semibold ${sec.enabled ? "text-slate-800" : "text-slate-400"}`}>{sec.name}</p>
              {sec.description && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sec.description}</p>}
            </div>
            <div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{sec.sectionType}</span>
            </div>
            <div className="flex justify-center">
              <Switch checked={sec.enabled} onCheckedChange={() => toggleSection(sec.id)} className="data-[state=checked]:bg-[#4982CF]" />
            </div>
            <div className="flex justify-center gap-1">
              <button disabled={i === 0} onClick={() => moveSection(sec.id, -1)} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronUp className="h-4 w-4" /></button>
              <button disabled={i === sorted.length - 1} onClick={() => moveSection(sec.id, 1)} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronDown className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[#4982CF]/20 bg-[#4982CF]/5 px-5 py-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-[#4982CF] mt-0.5 flex-shrink-0" />
        <div className="text-xs text-[#4982CF]">
          <p className="font-bold mb-0.5">How workflow order works</p>
          <p>Sections are presented top-to-bottom in the registration drawer. Built-in sections (Basic Info, Demographics) can be reordered but not deleted. Disabled sections are hidden from the form entirely.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Quick Registration ──────────────────────────────────────────────────

// Field types allowed in quick registration (no file/signature — not suitable for fast intake)
const QUICK_FIELD_TYPES: FieldType[] = ["text", "number", "date", "dropdown", "textarea"];

function QuickRegistrationTab() {
  const { config, updateConfig, savedAt } = useRegConfig();
  const [selectedProfile, setSelectedProfile] = useState(config.quickProfiles[0]?.id ?? "");
  const [addingProfile, setAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Custom field add form state
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const profile = config.quickProfiles.find(p => p.id === selectedProfile);

  function addProfile() {
    if (!newProfileName.trim()) return;
    const id = `qp-${Date.now()}`;
    const newProfile: QuickRegProfile = {
      id,
      name: newProfileName.trim(),
      fields: [
        { fieldId: "name",  label: "Name",          visible: true,  required: true,  isBuiltIn: true, fieldType: "text", placeholder: "Full name" },
        { fieldId: "phone", label: "Phone",          visible: true,  required: true,  isBuiltIn: true, fieldType: "text", placeholder: "+92 …" },
        { fieldId: "cnic",  label: "CNIC",           visible: false, required: false, isBuiltIn: true, fieldType: "text", placeholder: "00000-0000000-0" },
        { fieldId: "dob",   label: "Date of Birth",  visible: false, required: false, isBuiltIn: true, fieldType: "date" },
      ],
    };
    updateConfig(prev => ({ ...prev, quickProfiles: [...prev.quickProfiles, newProfile] }));
    setSelectedProfile(id);
    setNewProfileName("");
    setAddingProfile(false);
  }

  function deleteProfile(id: string) {
    updateConfig(prev => {
      const profiles = prev.quickProfiles.filter(p => p.id !== id);
      return { ...prev, quickProfiles: profiles };
    });
    setSelectedProfile(config.quickProfiles.find(p => p.id !== id)?.id ?? "");
    setDeleteTarget(null);
  }

  function updateProfileField(profileId: string, fieldId: string, patch: Partial<{ visible: boolean; required: boolean }>) {
    updateConfig(prev => ({
      ...prev,
      quickProfiles: prev.quickProfiles.map(p =>
        p.id === profileId
          ? { ...p, fields: p.fields.map(f => f.fieldId === fieldId ? { ...f, ...patch } : f) }
          : p
      ),
    }));
  }

  function renameProfile(profileId: string, name: string) {
    updateConfig(prev => ({
      ...prev,
      quickProfiles: prev.quickProfiles.map(p => p.id === profileId ? { ...p, name } : p),
    }));
  }

  function addCustomQuickField(profileId: string) {
    if (!newFieldLabel.trim()) return;
    const parsedOptions = newFieldType === "dropdown"
      ? newFieldOptions.split("\n").map(o => o.trim()).filter(Boolean)
      : [];
    if (newFieldType === "dropdown" && parsedOptions.length === 0) return;
    const newField: QuickRegField = {
      fieldId: `qf-${Date.now()}`,
      label: newFieldLabel.trim(),
      visible: true,
      required: newFieldRequired,
      isBuiltIn: false,
      fieldType: newFieldType,
      options: parsedOptions,
      placeholder: newFieldPlaceholder.trim() || undefined,
    };
    updateConfig(prev => ({
      ...prev,
      quickProfiles: prev.quickProfiles.map(p =>
        p.id === profileId ? { ...p, fields: [...p.fields, newField] } : p
      ),
    }));
    setShowAddField(false);
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldOptions("");
    setNewFieldPlaceholder("");
    setNewFieldRequired(false);
  }

  function deleteCustomQuickField(profileId: string, fieldId: string) {
    updateConfig(prev => ({
      ...prev,
      quickProfiles: prev.quickProfiles.map(p =>
        p.id === profileId ? { ...p, fields: p.fields.filter(f => f.fieldId !== fieldId) } : p
      ),
    }));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SavedBanner savedAt={savedAt} />
      <PageHeader title="Quick Registration" desc="Configure abbreviated registration profiles for fast patient intake." />

      {/* Profile Selector */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-900">Profiles</p>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-[#4982CF] border-[#4982CF]/30" onClick={() => setAddingProfile(true)}>
            <Plus className="h-3.5 w-3.5" /> New Profile
          </Button>
        </div>
        {addingProfile && (
          <div className="flex items-center gap-2 mb-3">
            <Input value={newProfileName} onChange={e => setNewProfileName(e.target.value)} placeholder="Profile name..." className="h-9 flex-1" autoFocus
              onKeyDown={e => { if (e.key === "Enter") addProfile(); if (e.key === "Escape") setAddingProfile(false); }} />
            <Button size="sm" onClick={addProfile} className="bg-[#4982CF] text-white h-9"><Check className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => setAddingProfile(false)} className="h-9"><X className="h-4 w-4" /></Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {config.quickProfiles.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProfile(p.id)}
              className={`h-8 px-4 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${selectedProfile === p.id ? "bg-[#4982CF] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              <Zap className="h-3 w-3" />
              {p.name}
            </button>
          ))}
          {config.quickProfiles.length === 0 && <p className="text-sm text-slate-400">No profiles. Add one above.</p>}
        </div>
      </div>

      {/* Profile Editor */}
      {profile && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900">Profile: {profile.name}</p>
              {!profile.name.includes("Default") && (
                <button onClick={() => setDeleteTarget({ id: profile.id, name: profile.name })} className="text-slate-300 hover:text-rose-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Profile Name</label>
              <Input value={profile.name} onChange={e => renameProfile(profile.id, e.target.value)} className="h-9 max-w-xs" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_72px_72px_32px] text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              <span>Field</span><span className="text-center">Visible</span><span className="text-center">Required</span><span />
            </div>

            {/* Built-in fields */}
            {profile.fields.filter(f => f.isBuiltIn !== false).map(f => (
              <div key={f.fieldId} className="grid grid-cols-[1fr_72px_72px_32px] items-center px-4 py-3 border-b border-slate-50">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-semibold text-slate-700">{f.label}</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 uppercase tracking-wide flex-shrink-0">built-in</span>
                </div>
                <div className="flex justify-center">
                  <Switch checked={f.visible} onCheckedChange={v => updateProfileField(profile.id, f.fieldId, { visible: v, required: v ? f.required : false })} className="data-[state=checked]:bg-[#4982CF]" />
                </div>
                <div className="flex justify-center">
                  <Switch checked={f.required && f.visible} disabled={!f.visible} onCheckedChange={v => updateProfileField(profile.id, f.fieldId, { required: v })} className="data-[state=checked]:bg-rose-500 disabled:opacity-30" />
                </div>
                <div />
              </div>
            ))}

            {/* Custom fields */}
            {profile.fields.filter(f => f.isBuiltIn === false).map(f => (
              <div key={f.fieldId} className="grid grid-cols-[1fr_72px_72px_32px] items-center px-4 py-3 border-b border-slate-50">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{f.label}</p>
                  <FieldTypeBadge type={f.fieldType ?? "text"} />
                </div>
                <div className="flex justify-center">
                  <Switch checked={f.visible} onCheckedChange={v => updateProfileField(profile.id, f.fieldId, { visible: v, required: v ? f.required : false })} className="data-[state=checked]:bg-[#4982CF]" />
                </div>
                <div className="flex justify-center">
                  <Switch checked={f.required && f.visible} disabled={!f.visible} onCheckedChange={v => updateProfileField(profile.id, f.fieldId, { required: v })} className="data-[state=checked]:bg-rose-500 disabled:opacity-30" />
                </div>
                <div className="flex justify-center">
                  <button onClick={() => deleteCustomQuickField(profile.id, f.fieldId)} className="text-slate-300 hover:text-rose-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add custom field */}
            {showAddField ? (
              <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/70">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Label *</label>
                    <Input value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} placeholder="e.g. Guardian Name"
                      className="h-8 text-sm" autoFocus
                      onKeyDown={e => { if (e.key === "Enter") addCustomQuickField(profile.id); if (e.key === "Escape") setShowAddField(false); }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Type</label>
                    <Select value={newFieldType} onValueChange={v => setNewFieldType(v as FieldType)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {QUICK_FIELD_TYPES.map(t => <SelectItem key={t} value={t}>{FIELD_TYPE_LABELS[t]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Placeholder</label>
                  <Input value={newFieldPlaceholder} onChange={e => setNewFieldPlaceholder(e.target.value)} placeholder="Hint text shown inside the field..." className="h-8 text-sm" />
                </div>
                {newFieldType === "dropdown" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Options (one per line)</label>
                    <textarea
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-ring h-20"
                      value={newFieldOptions} onChange={e => setNewFieldOptions(e.target.value)} placeholder={"Option A\nOption B\nOption C"} />
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Switch checked={newFieldRequired} onCheckedChange={setNewFieldRequired} className="data-[state=checked]:bg-rose-500" />
                    <span className="text-xs text-slate-600">Required</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setShowAddField(false); setNewFieldLabel(""); setNewFieldType("text"); setNewFieldOptions(""); setNewFieldPlaceholder(""); setNewFieldRequired(false); }}>
                      Cancel
                    </Button>
                    <Button size="sm" className="h-7 text-xs bg-[#4982CF] text-white hover:bg-[#3D73BC]"
                      disabled={!newFieldLabel.trim() || (newFieldType === "dropdown" && !newFieldOptions.trim())}
                      onClick={() => addCustomQuickField(profile.id)}>
                      <Check className="h-3 w-3 mr-1" /> Add Field
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddField(true)}
                className="flex w-full items-center justify-center gap-1.5 py-3 text-xs font-bold text-[#4982CF] hover:bg-[#4982CF]/5 transition-colors border-t border-dashed border-[#4982CF]/30"
              >
                <Plus className="h-3.5 w-3.5" /> Add Custom Field
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
            <p className="text-sm font-bold text-slate-900 mb-1">Queue Assignment</p>
            <p className="text-xs text-slate-400 mb-4">
              Assign this profile to a queue or visit type. When staff add a new patient in that queue, this profile's fields are automatically shown.
            </p>

            {/* Single & Partitioned queues */}
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">General Queues</p>
            <div className="space-y-2 mb-4">
              {[
                { key: "single",      label: "Single Queue",      sub: "Walk-in, auto-increment tokens" },
                { key: "partitioned", label: "Partitioned Queue",  sub: "Per-doctor, multi-partition" },
              ].map(q => {
                const currentProfileId = config.queueProfileMap[q.key];
                const isAssigned = currentProfileId === profile.id;
                const alreadyAssignedProfile = !isAssigned && currentProfileId
                  ? config.quickProfiles.find(p => p.id === currentProfileId)?.name
                  : null;
                return (
                  <div key={q.key} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{q.label}</p>
                      <p className="text-[10px] text-slate-400">
                        {q.sub}
                        {alreadyAssignedProfile ? ` · using "${alreadyAssignedProfile}"` : !isAssigned ? " · no profile assigned" : ""}
                      </p>
                    </div>
                    <Switch
                      checked={isAssigned}
                      onCheckedChange={v => {
                        updateConfig(prev => ({
                          ...prev,
                          queueProfileMap: v
                            ? { ...prev.queueProfileMap, [q.key]: profile.id }
                            : Object.fromEntries(Object.entries(prev.queueProfileMap).filter(([k]) => k !== q.key)),
                        }));
                      }}
                      className="data-[state=checked]:bg-[#4982CF]"
                    />
                  </div>
                );
              })}
            </div>

            {/* Multi-step visit types */}
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Multi-Step Visit Types</p>
            <div className="space-y-2">
              {SEED_VISIT_TYPES.filter(vt => vt.queueMode === "multi-step").map(vt => {
                const qKey = `multi-step:${vt.id}`;
                const currentProfileId = config.queueProfileMap[qKey];
                const isAssigned = currentProfileId === profile.id;
                const alreadyAssignedProfile = !isAssigned && currentProfileId
                  ? config.quickProfiles.find(p => p.id === currentProfileId)?.name
                  : null;
                return (
                  <div key={qKey} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: vt.color }} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{vt.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {vt.code} · {vt.queueMode}
                          {alreadyAssignedProfile ? ` · using "${alreadyAssignedProfile}"` : !isAssigned ? " · no profile assigned" : ""}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isAssigned}
                      onCheckedChange={v => {
                        updateConfig(prev => ({
                          ...prev,
                          queueProfileMap: v
                            ? { ...prev.queueProfileMap, [qKey]: profile.id }
                            : Object.fromEntries(Object.entries(prev.queueProfileMap).filter(([k]) => k !== qKey)),
                        }));
                      }}
                      className="data-[state=checked]:bg-[#4982CF]"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <DeleteDialog
        open={!!deleteTarget}
        name={deleteTarget?.name ?? ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteProfile(deleteTarget.id)}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PatientRegistrationModule({ section }: { section: PatRegSection }) {
  switch (section) {
    case "reg-basic-info":     return <BasicInfoTab />;
    case "reg-patient-types":  return <PatientTypesTab />;
    case "reg-welfare-forms":  return <WelfareFormsTab />;
    case "reg-demographics":   return <DemographicsTab />;
    case "reg-custom-sections":return <CustomSectionsTab />;
    case "reg-workflow":       return <WorkflowBuilderTab />;
    case "reg-quick":          return <QuickRegistrationTab />;
    default:                   return null;
  }
}
