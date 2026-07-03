import { useState, useEffect } from "react";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Check, AlertCircle,
  Edit2, X, CheckCircle2, Layers, Heart, Activity,
  Target, Stethoscope, Info, RotateCcw, Pill, Receipt, ShieldCheck,
} from "lucide-react";
import { TriageAlgorithmBuilder } from "@/pages/TriageAlgorithmBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useNursingConfig,
  SYSTEM_COMPONENTS,
  PROCEDURE_SYSTEM_COMPONENTS,
  type NursingComponent,
  type NursingHistoryTemplate,
  type NursingProcedureTemplate,
  type NursingField,
  type NursingFieldType,
  type SystemComponentKey,
  type ProcedureSystemComponentKey,
  type ConditionalRule,
} from "@/hooks/useNursingConfig";
import { VitalsConfigPanel } from "@/pages/SoapConfigModule";
import { SEED_VISIT_TYPES, VISIT_TYPES_STORAGE_KEY, type VisitType } from "@/pages/QueueModule";

function loadVisitTypes(): VisitType[] {
  try {
    const stored = localStorage.getItem(VISIT_TYPES_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as VisitType[];
  } catch { /* ignore */ }
  return SEED_VISIT_TYPES;
}

function useVisitTypes(): VisitType[] {
  const [visitTypes, setVisitTypes] = useState<VisitType[]>(loadVisitTypes);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === VISIT_TYPES_STORAGE_KEY) setVisitTypes(loadVisitTypes());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return visitTypes;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type NursingSectionId =
  | "nursing-triage" | "nursing-history" | "nursing-vitals"
  | "nursing-procedures";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function uid() { return `nf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

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

function PageHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  );
}

// ─── Nursing Field type labels / colors ───────────────────────────────────────

const NURSING_FIELD_TYPE_LABELS: Record<NursingFieldType, string> = {
  text: "Text", number: "Number", dropdown: "Dropdown",
  "multi-select": "Multi-Select", checkbox: "Checkbox",
  date: "Date", textarea: "Textarea", toggle: "Toggle",
};

const NURSING_FIELD_TYPE_COLORS: Record<NursingFieldType, string> = {
  text: "bg-blue-50 text-blue-700", number: "bg-purple-50 text-purple-700",
  dropdown: "bg-amber-50 text-amber-700", "multi-select": "bg-teal-50 text-teal-700",
  checkbox: "bg-green-50 text-green-700", date: "bg-cyan-50 text-cyan-700",
  textarea: "bg-slate-100 text-slate-600", toggle: "bg-rose-50 text-rose-700",
};

function NursingFieldTypeBadge({ type }: { type: NursingFieldType }) {
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${NURSING_FIELD_TYPE_COLORS[type]}`}>
      {NURSING_FIELD_TYPE_LABELS[type]}
    </span>
  );
}

// ─── Add / Edit Nursing Field Dialog ──────────────────────────────────────────

interface AddNursingFieldDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (f: NursingField) => void;
  editField?: NursingField | null;
}

function AddNursingFieldDialog({ open, onClose, onSave, editField }: AddNursingFieldDialogProps) {
  const blank: NursingField = { id: "", label: "", type: "text", required: false, enabled: true, options: [], placeholder: "" };
  const [form, setForm] = useState<NursingField>(editField ?? blank);
  const [optionsRaw, setOptionsRaw] = useState((editField?.options ?? []).join("\n"));

  useEffect(() => {
    if (open) {
      const f = editField ?? blank;
      setForm(f);
      setOptionsRaw((f.options ?? []).join("\n"));
    }
  }, [open, editField]);

  const needsOptions = ["dropdown", "multi-select", "checkbox"].includes(form.type);

  function save() {
    if (!form.label.trim()) return;
    const opts = needsOptions ? optionsRaw.split("\n").map(o => o.trim()).filter(Boolean) : [];
    onSave({ ...form, id: form.id || uid(), options: opts });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Layers className="h-4 w-4 text-[#4982CF]" />
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
            <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as NursingFieldType }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(NURSING_FIELD_TYPE_LABELS) as NursingFieldType[]).map(t => (
                  <SelectItem key={t} value={t}>{NURSING_FIELD_TYPE_LABELS[t]}</SelectItem>
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

// ─── Nursing Field List Editor ────────────────────────────────────────────────

function NursingFieldListEditor({ fields, onChange }: { fields: NursingField[]; onChange: (f: NursingField[]) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editField, setEditField] = useState<NursingField | null>(null);

  function move(i: number, dir: -1 | 1) {
    const next = [...fields];
    const swap = next[i + dir];
    if (!swap) return;
    next[i + dir] = next[i];
    next[i] = swap;
    onChange(next);
  }

  function toggle(id: string) { onChange(fields.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f)); }
  function toggleReq(id: string) { onChange(fields.map(f => f.id === id ? { ...f, required: !f.required } : f)); }
  function del(id: string) { onChange(fields.filter(f => f.id !== id)); }

  function addOrEdit(field: NursingField) {
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
        <div className="rounded-xl border border-dashed border-slate-200 py-5 text-center text-sm text-slate-400">
          No fields yet. Click "Add Field" to get started.
        </div>
      )}
      {fields.map((field, i) => (
        <div
          key={field.id}
          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-all ${field.enabled ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60"}`}
        >
          <div className="flex flex-col gap-0.5">
            <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronUp className="h-3 w-3" /></button>
            <button onClick={() => move(i, 1)} disabled={i === fields.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronDown className="h-3 w-3" /></button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-800">{field.label}</span>
              <NursingFieldTypeBadge type={field.type} />
            </div>
            {field.placeholder && <p className="text-[11px] text-slate-400 mt-0.5">Placeholder: {field.placeholder}</p>}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <label className="flex items-center gap-1.5 cursor-pointer" title="Required">
              <Switch checked={field.required} onCheckedChange={() => toggleReq(field.id)}
                className="h-4 w-7 data-[state=checked]:bg-rose-500" />
              <span className={`text-[10px] font-bold w-12 ${field.required ? "text-rose-500" : "text-slate-300"}`}>Req'd</span>
            </label>
            <Switch checked={field.enabled} onCheckedChange={() => toggle(field.id)} className="data-[state=checked]:bg-[#4982CF]" />
            <button onClick={() => { setEditField(field); setShowAdd(true); }} className="text-slate-400 hover:text-[#4982CF]">
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => del(field.id)} className="text-slate-300 hover:text-rose-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() => { setEditField(null); setShowAdd(true); }}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#4982CF]/40 py-2.5 text-xs font-bold text-[#4982CF] hover:bg-[#4982CF]/5 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Add Field
      </button>
      <AddNursingFieldDialog
        open={showAdd}
        onClose={() => { setShowAdd(false); setEditField(null); }}
        onSave={addOrEdit}
        editField={editField}
      />
    </div>
  );
}

// ─── Conditional Rule Builder ─────────────────────────────────────────────────

function ConditionalRuleBuilder({
  rules, fields, onAddRule, onRemoveRule, onUpdateRule,
}: {
  rules: ConditionalRule[];
  fields: NursingField[];
  onAddRule: () => void;
  onRemoveRule: (ruleId: string) => void;
  onUpdateRule: (ruleId: string, patch: Partial<ConditionalRule>) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Conditional Rules</label>
        <button onClick={onAddRule} className="text-xs text-[#4982CF] font-semibold hover:opacity-70 flex items-center gap-1">
          <Plus className="h-3 w-3" /> Add Rule
        </button>
      </div>
      {rules.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-200 rounded-lg">
          No rules — all fields shown unconditionally.
        </p>
      )}
      {rules.map(rule => (
        <div key={rule.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">When field value matches…</span>
            <button onClick={() => onRemoveRule(rule.id)} className="text-slate-300 hover:text-rose-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 block">Trigger Field</label>
              <Select value={rule.triggerFieldId || ""} onValueChange={v => onUpdateRule(rule.id, { triggerFieldId: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select field…" /></SelectTrigger>
                <SelectContent>
                  {fields.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 block">Trigger Value(s)</label>
              <Input
                className="h-8 text-xs"
                placeholder="val1, val2…"
                value={rule.triggerValues.join(", ")}
                onChange={e => onUpdateRule(rule.id, {
                  triggerValues: e.target.value.split(",").map(v => v.trim()).filter(Boolean),
                })}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 mb-2 block">Then show these fields</label>
            {fields.filter(f => f.id !== rule.triggerFieldId).length === 0 ? (
              <p className="text-xs text-slate-400">Add other fields first.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {fields.filter(f => f.id !== rule.triggerFieldId).map(f => {
                  const selected = rule.showFieldIds.includes(f.id);
                  return (
                    <button key={f.id}
                      onClick={() => onUpdateRule(rule.id, {
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
  );
}

// ─── Custom Component Editor ──────────────────────────────────────────────────

function CustomComponentEditor({
  component,
  onUpdate,
  onRemove,
  templateId,
}: {
  component: NursingComponent;
  onUpdate: (patch: Partial<NursingComponent>) => void;
  onRemove: () => void;
  templateId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(component.name);

  function saveName() {
    if (nameDraft.trim()) onUpdate({ name: nameDraft.trim() });
    setEditingName(false);
  }

  function addRule() {
    const rule: ConditionalRule = {
      id: `nr-${Date.now()}`,
      triggerFieldId: "",
      triggerValues: [],
      showFieldIds: [],
    };
    onUpdate({ conditionalRules: [...component.conditionalRules, rule] });
  }

  function removeRule(ruleId: string) {
    onUpdate({ conditionalRules: component.conditionalRules.filter(r => r.id !== ruleId) });
  }

  function updateRule(ruleId: string, patch: Partial<ConditionalRule>) {
    onUpdate({ conditionalRules: component.conditionalRules.map(r => r.id === ruleId ? { ...r, ...patch } : r) });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-7 w-7 rounded-lg bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
          <Layers className="h-3.5 w-3.5 text-[#4982CF]" />
        </div>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setEditingName(false); setNameDraft(component.name); } }}
                className="h-7 text-sm font-semibold flex-1"
                autoFocus
              />
              <button onClick={saveName} className="text-[#4982CF] hover:opacity-70"><Check className="h-4 w-4" /></button>
              <button onClick={() => { setEditingName(false); setNameDraft(component.name); }} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">{component.name}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#4982CF]/10 text-[#4982CF] uppercase">Custom</span>
              {component.repeatable && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 uppercase">Repeater</span>}
              <button onClick={() => setEditingName(true)} className="text-slate-300 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-0.5">
            {component.fields.length} field{component.fields.length !== 1 ? "s" : ""}
            {component.conditionalRules.length > 0 ? ` · ${component.conditionalRules.length} rule${component.conditionalRules.length !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs font-semibold text-[#4982CF] hover:opacity-70 flex items-center gap-1"
          >
            {expanded ? "Collapse" : "Configure"}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button onClick={onRemove} className="text-slate-300 hover:text-rose-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-5 bg-slate-50/40">
          {/* Repeatable toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-700">Repeatable Entry Group</p>
              <p className="text-[11px] text-slate-400">Allow staff to add multiple records of this section (e.g. multiple procedures).</p>
            </div>
            <Switch
              checked={component.repeatable}
              onCheckedChange={v => onUpdate({ repeatable: v, repeatLimit: v ? component.repeatLimit : null })}
              className="data-[state=checked]:bg-[#4982CF]"
            />
          </div>
          {component.repeatable && (
            <div className="space-y-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-3">
              {/* Repeat limit */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-600 w-44 shrink-0">Repeat limit (blank = unlimited)</label>
                <Input
                  type="number"
                  min={1}
                  className="h-8 w-24 text-sm"
                  value={component.repeatLimit ?? ""}
                  placeholder="Unlimited"
                  onChange={e => onUpdate({ repeatLimit: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>
              {/* Entry layout */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-600 w-44 shrink-0">Field layout</label>
                <div className="flex gap-1.5">
                  {(["vertical", "horizontal"] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => onUpdate({ entryLayout: opt })}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        component.entryLayout === opt
                          ? "bg-[#4982CF] text-white border-[#4982CF]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-[#4982CF]/50"
                      }`}
                    >
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {/* Columns (only when horizontal) */}
              {component.entryLayout === "horizontal" && (
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-600 w-44 shrink-0">Columns per row</label>
                  <div className="flex gap-1.5">
                    {([1, 2, 3, 4] as const).map(n => (
                      <button
                        key={n}
                        onClick={() => onUpdate({ columns: n })}
                        className={`h-7 w-7 rounded-lg text-xs font-bold border transition-colors ${
                          component.columns === n
                            ? "bg-[#4982CF] text-white border-[#4982CF]"
                            : "bg-white text-slate-600 border-slate-200 hover:border-[#4982CF]/50"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <span className="text-[10px] text-slate-400 self-center ml-1">max 4</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fields */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Fields</p>
            <NursingFieldListEditor fields={component.fields} onChange={fields => onUpdate({ fields })} />
          </div>

          {/* Conditional Rules */}
          {component.fields.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <ConditionalRuleBuilder
                rules={component.conditionalRules}
                fields={component.fields}
                onAddRule={addRule}
                onRemoveRule={removeRule}
                onUpdateRule={updateRule}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── System Component Picker ──────────────────────────────────────────────────

function SystemComponentPicker({
  usedKeys,
  onAdd,
  onClose,
}: {
  usedKeys: SystemComponentKey[];
  onAdd: (keys: SystemComponentKey[]) => void;
  onClose: () => void;
}) {
  const available = SYSTEM_COMPONENTS.filter(c => !usedKeys.includes(c.key));
  const [selected, setSelected] = useState<SystemComponentKey[]>([]);

  function toggle(key: SystemComponentKey) {
    setSelected(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key]);
  }

  function confirm() {
    if (selected.length > 0) onAdd(selected);
    onClose();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg p-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select system components</p>
      {available.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">All system components have been added.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {available.map(c => {
            const on = selected.includes(c.key);
            return (
              <button
                key={c.key}
                onClick={() => toggle(c.key)}
                title={c.desc}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                  on
                    ? "bg-[#4982CF] text-white border-[#4982CF]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-[#4982CF]/50 hover:text-[#4982CF]"
                }`}
              >
                {on && <Check className="h-2.5 w-2.5 flex-shrink-0" />}
                {c.name}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex gap-2 pt-1 border-t border-slate-100">
        <button
          onClick={confirm}
          disabled={selected.length === 0}
          className="flex-1 rounded-lg py-1.5 text-xs font-bold bg-[#4982CF] text-white hover:bg-[#3a6bb5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {selected.length === 0 ? "Select components" : `Add ${selected.length} component${selected.length > 1 ? "s" : ""}`}
        </button>
        <button onClick={onClose} className="px-3 rounded-lg py-1.5 text-xs text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ─── Template Editor ──────────────────────────────────────────────────────────

function TemplateEditor({
  template,
  onUpdate,
  onRemove,
}: {
  template: NursingHistoryTemplate;
  onUpdate: (patch: Partial<NursingHistoryTemplate>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(template.name);
  const [showSystemPicker, setShowSystemPicker] = useState(false);
  const [addingCustomName, setAddingCustomName] = useState(false);
  const [customName, setCustomName] = useState("");

  function saveName() {
    if (nameDraft.trim()) onUpdate({ name: nameDraft.trim() });
    setEditingName(false);
  }

  const usedSystemKeys = template.components
    .filter(c => c.type === "system" && c.systemKey)
    .map(c => c.systemKey as SystemComponentKey);

  function addSystemComponent(keys: SystemComponentKey[]) {
    const newComps: NursingComponent[] = keys.map(key => {
      const def = SYSTEM_COMPONENTS.find(c => c.key === key)!;
      return {
        id: uid(),
        type: "system",
        systemKey: key,
        name: def.name,
        fields: [],
        repeatable: false,
        repeatLimit: null,
        entryLayout: "vertical",
        columns: 2,
        conditionalRules: [],
      };
    });
    onUpdate({ components: [...template.components, ...newComps] });
  }

  function addCustomComponent() {
    if (!customName.trim()) return;
    const newComp: NursingComponent = {
      id: uid(),
      type: "custom",
      name: customName.trim(),
      fields: [],
      repeatable: false,
      repeatLimit: null,
      entryLayout: "vertical",
      columns: 2,
      conditionalRules: [],
    };
    onUpdate({ components: [...template.components, newComp] });
    setCustomName("");
    setAddingCustomName(false);
  }

  function updateComponent(compId: string, patch: Partial<NursingComponent>) {
    onUpdate({ components: template.components.map(c => c.id === compId ? { ...c, ...patch } : c) });
  }

  function removeComponent(compId: string) {
    onUpdate({ components: template.components.filter(c => c.id !== compId) });
  }

  function moveComponent(i: number, dir: -1 | 1) {
    const next = [...template.components];
    const swap = next[i + dir];
    if (!swap) return;
    next[i + dir] = next[i];
    next[i] = swap;
    onUpdate({ components: next });
  }

  return (
    <div className={`rounded-2xl border shadow-sm ${template.enabled ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
          <Heart className="h-4 w-4 text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setEditingName(false); setNameDraft(template.name); } }}
                className="h-8 text-sm font-bold flex-1"
                autoFocus
              />
              <button onClick={saveName} className="text-[#4982CF]"><Check className="h-4 w-4" /></button>
              <button onClick={() => { setEditingName(false); setNameDraft(template.name); }} className="text-slate-400"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className={`text-sm font-bold ${template.enabled ? "text-slate-900" : "text-slate-400"}`}>{template.name}</p>
              <button onClick={() => setEditingName(true)} className="text-slate-300 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-0.5">
            {template.components.length} component{template.components.length !== 1 ? "s" : ""}
            {" · "}
            {template.components.filter(c => c.type === "system").length} system, {template.components.filter(c => c.type === "custom").length} custom
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setExpanded(e => !e)} className="text-xs font-semibold text-[#4982CF] hover:opacity-70 flex items-center gap-1">
            {expanded ? "Collapse" : "Edit"}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <Switch checked={template.enabled} onCheckedChange={v => onUpdate({ enabled: v })} className="data-[state=checked]:bg-[#4982CF]" />
          <button onClick={onRemove} className="text-slate-300 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-3">
          {/* Component list */}
          <div className="space-y-2">
            {template.components.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                No components yet. Add a system or custom component below.
              </div>
            )}
            {template.components.map((comp, i) => (
              <div key={comp.id} className="flex gap-2">
                {/* Move buttons */}
                <div className="flex flex-col justify-center gap-0.5 pt-1 flex-shrink-0">
                  <button onClick={() => moveComponent(i, -1)} disabled={i === 0} className="text-slate-300 hover:text-slate-500 disabled:opacity-20"><ChevronUp className="h-3 w-3" /></button>
                  <button onClick={() => moveComponent(i, 1)} disabled={i === template.components.length - 1} className="text-slate-300 hover:text-slate-500 disabled:opacity-20"><ChevronDown className="h-3 w-3" /></button>
                </div>
                <div className="flex-1 min-w-0">
                  {comp.type === "system" ? (
                    // System component — read-only badge
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center gap-3">
                      <div className="h-6 w-6 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Activity className="h-3 w-3 text-[#4982CF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-700">{comp.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">System</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {SYSTEM_COMPONENTS.find(s => s.key === comp.systemKey)?.desc ?? "Shared system component"}
                        </p>
                      </div>
                      <button onClick={() => removeComponent(comp.id)} className="text-slate-300 hover:text-rose-500 flex-shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <CustomComponentEditor
                      key={comp.id}
                      component={comp}
                      onUpdate={patch => updateComponent(comp.id, patch)}
                      onRemove={() => removeComponent(comp.id)}
                      templateId={template.id}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add component buttons */}
          <div className="flex gap-2 pt-1 relative">
            <div className="relative flex-1">
              <button
                onClick={() => setShowSystemPicker(s => !s)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-300 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Activity className="h-3.5 w-3.5" /> Add System Component
              </button>
              {showSystemPicker && (
                <div className="absolute top-full left-0 mt-1 z-50 w-72">
                  <SystemComponentPicker
                    usedKeys={usedSystemKeys}
                    onAdd={addSystemComponent}
                    onClose={() => setShowSystemPicker(false)}
                  />
                </div>
              )}
            </div>
            <div className="flex-1">
              {addingCustomName ? (
                <div className="flex items-center gap-2 rounded-xl border border-[#4982CF]/30 bg-[#4982CF]/5 px-3 py-2">
                  <Input
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addCustomComponent(); if (e.key === "Escape") { setAddingCustomName(false); setCustomName(""); } }}
                    placeholder="Component name…"
                    className="h-7 text-xs flex-1"
                    autoFocus
                  />
                  <button onClick={addCustomComponent} className="text-[#4982CF] hover:opacity-70"><Check className="h-4 w-4" /></button>
                  <button onClick={() => { setAddingCustomName(false); setCustomName(""); }} className="text-slate-400"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingCustomName(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#4982CF]/40 py-2.5 text-xs font-bold text-[#4982CF] hover:bg-[#4982CF]/5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Custom Component
                </button>
              )}
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-[11px] text-blue-700">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            System components reference centralized library data. Custom components are nursing-specific and configured here.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── History Template Builder ─────────────────────────────────────────────────

function HistoryTemplateBuilder() {
  const { config, updateConfig, savedAt } = useNursingConfig();
  const visitTypes = useVisitTypes();
  const [addingName, setAddingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  function addTemplate() {
    if (!newName.trim()) return;
    const id = `nt-${Date.now()}`;
    updateConfig(prev => ({
      ...prev,
      templates: [...prev.templates, { id, name: newName.trim(), enabled: true, components: [] }],
    }));
    setNewName("");
    setAddingName(false);
  }

  function updateTemplate(id: string, patch: Partial<NursingHistoryTemplate>) {
    updateConfig(prev => ({
      ...prev,
      templates: prev.templates.map(t => t.id === id ? { ...t, ...patch } : t),
    }));
  }

  function deleteTemplate(id: string) {
    updateConfig(prev => ({ ...prev, templates: prev.templates.filter(t => t.id !== id) }));
    setDeleteTarget(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SavedBanner savedAt={savedAt} />
      <div className="flex items-start justify-between">
        <PageHeader title="History Template Builder" desc="Design reusable nursing history templates with system and custom components." />
        <Button size="sm" className="bg-[#4982CF] hover:bg-[#3D73BC] text-white h-9 gap-2 flex-shrink-0" onClick={() => setAddingName(true)}>
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      {addingName && (
        <div className="rounded-xl border border-[#4982CF]/30 bg-[#4982CF]/5 p-4 flex items-center gap-3">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Template name…"
            className="h-9 flex-1"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") addTemplate(); if (e.key === "Escape") setAddingName(false); }}
          />
          <Button size="sm" onClick={addTemplate} className="bg-[#4982CF] hover:bg-[#3D73BC] text-white h-9"><Check className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setAddingName(false)} className="h-9"><X className="h-4 w-4" /></Button>
        </div>
      )}

      {config.templates.length === 0 && !addingName && (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-400 space-y-2">
          <Heart className="h-8 w-8 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No history templates yet</p>
          <p className="text-xs">Click "New Template" to create one.</p>
        </div>
      )}

      <div className="space-y-3">
        {config.templates.map(template => (
          <TemplateEditor
            key={template.id}
            template={template}
            onUpdate={patch => updateTemplate(template.id, patch)}
            onRemove={() => setDeleteTarget({ id: template.id, name: template.name })}
          />
        ))}
      </div>

      {/* ── Visit Type → Template Mapping ─────────────────────────────── */}
      {config.templates.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="h-8 w-8 rounded-lg bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="h-4 w-4 text-[#4982CF]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Visit Type → Template Mapping</p>
              <p className="text-xs text-slate-400 mt-0.5">Assign a default template to each visit type so it is pre-selected when the nursing drawer opens.</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {visitTypes.filter(vt => vt.status === "active").map(vt => {
              const currentMappedId = config.visitTypeMappings?.[vt.id] ?? "";
              const enabledTemplates = config.templates.filter(t => t.enabled);
              return (
                <div key={vt.id} className="flex items-center gap-4 px-5 py-3">
                  <span
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                    style={{ backgroundColor: vt.color }}
                  >
                    {vt.tokenPrefix}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{vt.name}</p>
                    <p className="text-[11px] text-slate-400">{vt.code} · {vt.queueMode === "single" ? "Single Queue" : vt.queueMode === "partitioned" ? "Partitioned" : "Multi-Step"}</p>
                  </div>
                  <div className="w-52 flex-shrink-0">
                    <Select
                      value={currentMappedId || "__none__"}
                      onValueChange={val => {
                        updateConfig(prev => {
                          const next = { ...prev.visitTypeMappings };
                          if (val === "__none__") {
                            delete next[vt.id];
                          } else {
                            next[vt.id] = val;
                          }
                          return { ...prev, visitTypeMappings: next };
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="No default template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          <span className="text-slate-400 italic">No default</span>
                        </SelectItem>
                        {enabledTemplates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                        {enabledTemplates.length === 0 && (
                          <SelectItem value="__no_templates__" disabled>No enabled templates</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
          {visitTypes.filter(vt => vt.status === "active").length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-5">No active visit types defined in Queue Setup.</p>
          )}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" /> Delete Template
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-1">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-8 text-sm">Cancel</Button>
            <Button onClick={() => deleteTarget && deleteTemplate(deleteTarget.id)} className="bg-rose-500 hover:bg-rose-600 text-white h-8 text-sm gap-2">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Procedure System Component Icons ────────────────────────────────────────

function ProcedureSystemIcon({ k }: { k: ProcedureSystemComponentKey }) {
  if (k === "vitals")      return <Activity className="h-3 w-3 text-[#4982CF]" />;
  if (k === "medications") return <Pill className="h-3 w-3 text-violet-500" />;
  if (k === "consent")     return <ShieldCheck className="h-3 w-3 text-teal-600" />;
  if (k === "billing")     return <Receipt className="h-3 w-3 text-amber-600" />;
  return <Activity className="h-3 w-3 text-slate-400" />;
}

// ─── Procedure System Component Picker ────────────────────────────────────────

function ProcedureSystemComponentPicker({
  usedKeys,
  onAdd,
  onClose,
}: {
  usedKeys: ProcedureSystemComponentKey[];
  onAdd: (keys: ProcedureSystemComponentKey[]) => void;
  onClose: () => void;
}) {
  const available = PROCEDURE_SYSTEM_COMPONENTS.filter(c => !usedKeys.includes(c.key));
  const [selected, setSelected] = useState<ProcedureSystemComponentKey[]>([]);

  function toggle(key: ProcedureSystemComponentKey) {
    setSelected(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key]);
  }

  function confirm() {
    if (selected.length > 0) onAdd(selected);
    onClose();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg p-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select procedure system components</p>
      {available.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">All system components have been added.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {available.map(c => {
            const on = selected.includes(c.key);
            return (
              <button
                key={c.key}
                onClick={() => toggle(c.key)}
                title={c.desc}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                  on
                    ? "bg-[#4982CF] text-white border-[#4982CF]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-[#4982CF]/50 hover:text-[#4982CF]"
                }`}
              >
                {on && <Check className="h-2.5 w-2.5 flex-shrink-0" />}
                {c.name}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex gap-2 pt-1 border-t border-slate-100">
        <button
          onClick={confirm}
          disabled={selected.length === 0}
          className="flex-1 rounded-lg py-1.5 text-xs font-bold bg-[#4982CF] text-white hover:bg-[#3a6bb5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {selected.length === 0 ? "Select components" : `Add ${selected.length} component${selected.length > 1 ? "s" : ""}`}
        </button>
        <button onClick={onClose} className="px-3 rounded-lg py-1.5 text-xs text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ─── Procedure Template Editor ────────────────────────────────────────────────

function ProcedureTemplateEditor({
  template,
  onUpdate,
  onRemove,
}: {
  template: NursingProcedureTemplate;
  onUpdate: (patch: Partial<NursingProcedureTemplate>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(template.name);
  const [showSystemPicker, setShowSystemPicker] = useState(false);
  const [addingCustomName, setAddingCustomName] = useState(false);
  const [customName, setCustomName] = useState("");

  function saveName() {
    if (nameDraft.trim()) onUpdate({ name: nameDraft.trim() });
    setEditingName(false);
  }

  const usedSystemKeys = template.components
    .filter(c => c.type === "system" && c.systemKey)
    .map(c => c.systemKey as ProcedureSystemComponentKey);

  function addSystemComponent(keys: ProcedureSystemComponentKey[]) {
    const newComps: NursingComponent[] = keys.map(key => {
      const def = PROCEDURE_SYSTEM_COMPONENTS.find(c => c.key === key)!;
      return {
        id: `npc-${Date.now()}-${key}`,
        type: "system",
        systemKey: key,
        name: def.name,
        fields: [],
        repeatable: false,
        repeatLimit: null,
        entryLayout: "vertical",
        columns: 2,
        conditionalRules: [],
      };
    });
    onUpdate({ components: [...template.components, ...newComps] });
  }

  function addCustomComponent() {
    if (!customName.trim()) return;
    const newComp: NursingComponent = {
      id: `npc-custom-${Date.now()}`,
      type: "custom",
      name: customName.trim(),
      fields: [],
      repeatable: false,
      repeatLimit: null,
      entryLayout: "vertical",
      columns: 2,
      conditionalRules: [],
    };
    onUpdate({ components: [...template.components, newComp] });
    setCustomName("");
    setAddingCustomName(false);
  }

  function updateComponent(compId: string, patch: Partial<NursingComponent>) {
    onUpdate({ components: template.components.map(c => c.id === compId ? { ...c, ...patch } : c) });
  }

  function removeComponent(compId: string) {
    onUpdate({ components: template.components.filter(c => c.id !== compId) });
  }

  function moveComponent(i: number, dir: -1 | 1) {
    const next = [...template.components];
    const swap = next[i + dir];
    if (!swap) return;
    next[i + dir] = next[i];
    next[i] = swap;
    onUpdate({ components: next });
  }

  return (
    <div className={`rounded-2xl border shadow-sm ${template.enabled ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="h-4 w-4 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setEditingName(false); setNameDraft(template.name); } }}
                className="h-8 text-sm font-bold flex-1"
                autoFocus
              />
              <button onClick={saveName} className="text-[#4982CF]"><Check className="h-4 w-4" /></button>
              <button onClick={() => { setEditingName(false); setNameDraft(template.name); }} className="text-slate-400"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className={`text-sm font-bold ${template.enabled ? "text-slate-900" : "text-slate-400"}`}>{template.name}</p>
              <button onClick={() => setEditingName(true)} className="text-slate-300 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-0.5">
            {template.components.length} component{template.components.length !== 1 ? "s" : ""}
            {" · "}
            {template.components.filter(c => c.type === "system").length} system, {template.components.filter(c => c.type === "custom").length} custom
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setExpanded(e => !e)} className="text-xs font-semibold text-[#4982CF] hover:opacity-70 flex items-center gap-1">
            {expanded ? "Collapse" : "Edit"}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <Switch checked={template.enabled} onCheckedChange={v => onUpdate({ enabled: v })} className="data-[state=checked]:bg-[#4982CF]" />
          <button onClick={onRemove} className="text-slate-300 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-3">
          <div className="space-y-2">
            {template.components.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                No components yet. Add a system or custom component below.
              </div>
            )}
            {template.components.map((comp, i) => (
              <div key={comp.id} className="flex gap-2">
                <div className="flex flex-col justify-center gap-0.5 pt-1 flex-shrink-0">
                  <button onClick={() => moveComponent(i, -1)} disabled={i === 0} className="text-slate-300 hover:text-slate-500 disabled:opacity-20"><ChevronUp className="h-3 w-3" /></button>
                  <button onClick={() => moveComponent(i, 1)} disabled={i === template.components.length - 1} className="text-slate-300 hover:text-slate-500 disabled:opacity-20"><ChevronDown className="h-3 w-3" /></button>
                </div>
                <div className="flex-1 min-w-0">
                  {comp.type === "system" ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center gap-3">
                      <div className="h-6 w-6 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <ProcedureSystemIcon k={comp.systemKey as ProcedureSystemComponentKey} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-700">{comp.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">System</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {PROCEDURE_SYSTEM_COMPONENTS.find(s => s.key === comp.systemKey)?.desc ?? "Shared procedure component"}
                        </p>
                      </div>
                      <button onClick={() => removeComponent(comp.id)} className="text-slate-300 hover:text-rose-500 flex-shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <CustomComponentEditor
                      key={comp.id}
                      component={comp}
                      onUpdate={patch => updateComponent(comp.id, patch)}
                      onRemove={() => removeComponent(comp.id)}
                      templateId={template.id}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add component buttons */}
          <div className="flex gap-2 pt-1 relative">
            <div className="relative flex-1">
              <button
                onClick={() => setShowSystemPicker(s => !s)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-300 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Activity className="h-3.5 w-3.5" /> Add System Component
              </button>
              {showSystemPicker && (
                <div className="absolute top-full left-0 mt-1 z-50 w-72">
                  <ProcedureSystemComponentPicker
                    usedKeys={usedSystemKeys}
                    onAdd={addSystemComponent}
                    onClose={() => setShowSystemPicker(false)}
                  />
                </div>
              )}
            </div>
            <div className="flex-1">
              {addingCustomName ? (
                <div className="flex items-center gap-2 rounded-xl border border-[#4982CF]/30 bg-[#4982CF]/5 px-3 py-2">
                  <Input
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addCustomComponent(); if (e.key === "Escape") { setAddingCustomName(false); setCustomName(""); } }}
                    placeholder="Component name…"
                    className="h-7 text-xs flex-1"
                    autoFocus
                  />
                  <button onClick={addCustomComponent} className="text-[#4982CF] hover:opacity-70"><Check className="h-4 w-4" /></button>
                  <button onClick={() => { setAddingCustomName(false); setCustomName(""); }} className="text-slate-400"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingCustomName(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#4982CF]/40 py-2.5 text-xs font-bold text-[#4982CF] hover:bg-[#4982CF]/5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Custom Component
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-violet-50 border border-violet-100 px-3 py-2.5 text-[11px] text-violet-700">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            System components are built-in procedure modules (vitals, medications, consent, billing). Custom components add nursing-specific fields.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Procedure Template Builder ───────────────────────────────────────────────

function ProcedureTemplateBuilder() {
  const { config, updateConfig, savedAt } = useNursingConfig();
  const [addingName, setAddingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  function addTemplate() {
    if (!newName.trim()) return;
    const id = `np-${Date.now()}`;
    updateConfig(prev => ({
      ...prev,
      procedureTemplates: [...prev.procedureTemplates, { id, name: newName.trim(), enabled: true, components: [] }],
    }));
    setNewName("");
    setAddingName(false);
  }

  function updateTemplate(id: string, patch: Partial<NursingProcedureTemplate>) {
    updateConfig(prev => ({
      ...prev,
      procedureTemplates: prev.procedureTemplates.map(t => t.id === id ? { ...t, ...patch } : t),
    }));
  }

  function deleteTemplate(id: string) {
    updateConfig(prev => ({ ...prev, procedureTemplates: prev.procedureTemplates.filter(t => t.id !== id) }));
    setDeleteTarget(null);
  }

  function moveTemplate(i: number, dir: -1 | 1) {
    updateConfig(prev => {
      const next = [...prev.procedureTemplates];
      const swap = next[i + dir];
      if (!swap) return prev;
      next[i + dir] = next[i];
      next[i] = swap;
      return { ...prev, procedureTemplates: next };
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SavedBanner savedAt={savedAt} />
      <div className="flex items-start justify-between">
        <PageHeader
          title="Procedure Template Builder"
          desc="Design reusable nursing procedure templates combining built-in modules (vitals, medications, consent, billing) with custom components."
        />
        <Button size="sm" className="bg-[#4982CF] hover:bg-[#3D73BC] text-white h-9 gap-2 flex-shrink-0" onClick={() => setAddingName(true)}>
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      {addingName && (
        <div className="rounded-xl border border-[#4982CF]/30 bg-[#4982CF]/5 p-4 flex items-center gap-3">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Template name…"
            className="h-9 flex-1"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") addTemplate(); if (e.key === "Escape") setAddingName(false); }}
          />
          <Button size="sm" onClick={addTemplate} className="bg-[#4982CF] hover:bg-[#3D73BC] text-white h-9"><Check className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setAddingName(false)} className="h-9"><X className="h-4 w-4" /></Button>
        </div>
      )}

      {config.procedureTemplates.length === 0 && !addingName && (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-400 space-y-2">
          <Stethoscope className="h-8 w-8 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No procedure templates yet</p>
          <p className="text-xs">Click "New Template" to create one.</p>
        </div>
      )}

      <div className="space-y-3">
        {config.procedureTemplates.map((template, i) => (
          <div key={template.id} className="flex gap-2">
            <div className="flex flex-col justify-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => moveTemplate(i, -1)}
                disabled={i === 0}
                className="text-slate-300 hover:text-slate-500 disabled:opacity-20 transition-colors"
                title="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveTemplate(i, 1)}
                disabled={i === config.procedureTemplates.length - 1}
                className="text-slate-300 hover:text-slate-500 disabled:opacity-20 transition-colors"
                title="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <ProcedureTemplateEditor
                template={template}
                onUpdate={patch => updateTemplate(template.id, patch)}
                onRemove={() => setDeleteTarget({ id: template.id, name: template.name })}
              />
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" /> Delete Template
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-1">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-8 text-sm">Cancel</Button>
            <Button onClick={() => deleteTarget && deleteTemplate(deleteTarget.id)} className="bg-rose-500 hover:bg-rose-600 text-white h-8 text-sm gap-2">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Placeholder Section ──────────────────────────────────────────────────────

function PlaceholderSection({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={title} desc="" />
      <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center text-slate-400 space-y-3">
        <div className="flex items-center justify-center text-slate-300">{icon}</div>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}

// ─── Module Root ──────────────────────────────────────────────────────────────

interface NursingConfigModuleProps {
  section: NursingSectionId;
}

export function NursingConfigModule({ section }: NursingConfigModuleProps) {
  return (
    <>
      {section === "nursing-triage" && <TriageAlgorithmBuilder />}
      {section === "nursing-history" && <HistoryTemplateBuilder />}
      {section === "nursing-vitals" && (
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vital Signs Configuration</h1>
            <p className="mt-1 text-sm text-slate-500">Set which vitals are required per visit type and configure normal reference ranges.</p>
          </div>
          <VitalsConfigPanel />
        </div>
      )}
      {section === "nursing-procedures" && <ProcedureTemplateBuilder />}
    </>
  );
}
