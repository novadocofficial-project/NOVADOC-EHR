import { useState, useRef, useEffect } from "react";
import {
  Plus, Edit2, Trash2, Copy, GripVertical, X, ChevronRight, Save,
  CheckCircle2, Eye, FileText, ChevronDown, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FieldType = "free-text" | "multi-select" | "radio" | "number";

export interface HpiField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
  placeholder: string;
}

export interface HpiTemplate {
  id: string;
  name: string;
  complaintId: string;
  complaintName: string;
  fields: HpiField[];
  active: boolean;
  builtIn?: boolean;
}

export const HPI_TEMPLATES_KEY = "ehr-hpi-templates-v1";

// ─── Seed data ────────────────────────────────────────────────────────────────

const SAMPLE_COMPLAINTS = [
  "Chest Pain", "Shortness of Breath", "Headache", "Abdominal Pain",
  "Fever", "Cough", "Back Pain", "Dizziness", "Fatigue", "Palpitations",
  "Joint Pain", "Skin Rash", "Nausea / Vomiting", "Sore Throat",
  "Ear Pain", "Eye Redness", "Urinary Complaint", "Weight Loss",
];

function uid() { return Math.random().toString(36).slice(2, 10); }

const SEED_TEMPLATES: HpiTemplate[] = [
  {
    id: "t1", name: "Chest Pain Assessment", complaintId: "cp", complaintName: "Chest Pain", active: true,
    fields: [
      { id: "f1", label: "Onset", type: "radio", required: true, options: ["Sudden", "Gradual", "Unknown"], placeholder: "" },
      { id: "f2", label: "Character", type: "multi-select", required: true, options: ["Crushing", "Sharp", "Burning", "Pressure", "Stabbing", "Dull"], placeholder: "" },
      { id: "f3", label: "Radiation", type: "multi-select", required: false, options: ["Left arm", "Jaw", "Back", "Shoulder", "None"], placeholder: "" },
      { id: "f4", label: "Severity (1–10)", type: "number", required: true, options: [], placeholder: "e.g. 7" },
      { id: "f5", label: "Associated Symptoms", type: "free-text", required: false, options: [], placeholder: "Describe any other symptoms…" },
    ],
  },
  {
    id: "t2", name: "Headache Workup", complaintId: "ha", complaintName: "Headache", active: true,
    fields: [
      { id: "f6", label: "Location", type: "multi-select", required: true, options: ["Frontal", "Temporal", "Occipital", "Vertex", "Periorbital", "Global"], placeholder: "" },
      { id: "f7", label: "Quality", type: "radio", required: true, options: ["Throbbing", "Pressure", "Stabbing", "Band-like"], placeholder: "" },
      { id: "f8", label: "Duration", type: "free-text", required: true, options: [], placeholder: "e.g. 2 hours, started yesterday" },
      { id: "f9", label: "Aggravating Factors", type: "multi-select", required: false, options: ["Light", "Sound", "Movement", "Smell", "Stress"], placeholder: "" },
    ],
  },
  {
    id: "t3", name: "Abdominal Pain HPI", complaintId: "ap", complaintName: "Abdominal Pain", active: true, builtIn: true,
    fields: [
      { id: "fa1", label: "Quality", type: "multi-select", required: true, options: ["Aching", "Burning", "Colicky", "Cramping", "Dull", "Hot", "Pressure-like", "Sharp", "Shooting", "Stabbing", "Tingling", "None"], placeholder: "" },
      { id: "fa2", label: "Pain Score (0–10)", type: "number", required: true, options: [], placeholder: "0–10" },
      { id: "fa3", label: "Location", type: "multi-select", required: true, options: ["RUQ", "LUQ", "Epigastric", "Periumbilical", "LLQ", "RLQ", "Suprapubic", "Diffusively", "CVA"], placeholder: "" },
      { id: "fa4", label: "Radiation", type: "radio", required: false, options: ["Without radiation", "With radiation"], placeholder: "" },
      { id: "fa5", label: "Onset", type: "free-text", required: true, options: [], placeholder: "e.g. 3 days" },
      { id: "fa6", label: "Course", type: "radio", required: true, options: ["Stable", "Unchanged", "Gradually worsening", "Rapidly worsening", "Gradually improving", "Rapidly improving", "Completely resolved", "Controlled"], placeholder: "" },
      { id: "fa7", label: "Aggravating Factors", type: "multi-select", required: false, options: ["Eating", "Fatty foods", "Spicy foods", "Alcohol", "Stress", "Movement", "Deep breathing", "Defecation", "Urination", "Hunger", "None"], placeholder: "" },
      { id: "fa8", label: "Alleviating Factors", type: "multi-select", required: false, options: ["Eating", "Antacids", "Recumbency", "Sitting forward", "Defecation", "Passing flatus", "Vomiting", "Analgesics", "Heat", "None"], placeholder: "" },
      { id: "fa9", label: "Associated Symptoms", type: "multi-select", required: false, options: ["Nausea", "Vomiting", "Fever", "Diarrhea", "Constipation", "Bloating", "Loss of appetite", "Weight loss", "Jaundice", "Blood in stool", "Heartburn", "Flatulence"], placeholder: "" },
      { id: "fa10", label: "Patient Denies", type: "multi-select", required: false, options: ["Fever", "Nausea", "Vomiting", "Diarrhea", "Constipation", "Blood in stool", "Weight loss", "Jaundice", "Heartburn", "Flatulence"], placeholder: "" },
    ],
  },
  {
    id: "t4", name: "Cough Assessment", complaintId: "cough", complaintName: "Cough", active: true,
    fields: [
      { id: "fc1", label: "Duration", type: "radio", required: true, options: ["Acute (< 2 weeks)", "Subacute (3–8 weeks)", "Chronic (> 8 weeks)"], placeholder: "" },
      { id: "fc2", label: "Character", type: "multi-select", required: false, options: ["Dry", "Productive", "Constant", "Early Morning", "Worse at night", "Only in Daytime", "All Day"], placeholder: "" },
      { id: "fc3", label: "Cough Origin", type: "multi-select", required: false, options: ["Due to Throat Irritation", "PostNasal", "From the Chest", "Associated with Wheezing"], placeholder: "" },
      { id: "fc4", label: "Sputum Amount", type: "radio", required: false, options: ["Scanty", "Copious"], placeholder: "" },
      { id: "fc5", label: "Sputum Color", type: "multi-select", required: false, options: ["Clear", "White", "Yellow", "Green", "Rusty", "Tinged", "Associated with Blood"], placeholder: "" },
      { id: "fc6", label: "Associated Symptoms", type: "multi-select", required: false, options: ["Wheezing", "SOB when lying flat", "Acid Reflux", "Wake up at Night due to SOB", "Ankle / Leg Edema", "Regurgitation", "Weight Loss", "Fever"], placeholder: "" },
      { id: "fc7", label: "Symptoms in Children", type: "multi-select", required: false, options: ["Lethargic", "Irritable", "Refusal to Eat", "Stridor", "Very Rapid Breathing", "Spitting Up after Feedings"], placeholder: "" },
      { id: "fc8", label: "Triggered By", type: "multi-select", required: false, options: ["Dust", "Allergens", "Cold Air", "Wood Burning Stove"], placeholder: "" },
      { id: "fc9", label: "Other Trigger", type: "free-text", required: false, options: [], placeholder: "Enter text here…" },
      { id: "fc10", label: "Hx of Contact", type: "multi-select", required: false, options: ["Person with Respiratory Infection", "Tuberculosis"], placeholder: "" },
      { id: "fc11", label: "Other", type: "free-text", required: false, options: [], placeholder: "Enter text here…" },
    ],
  },
];

const BLANK_FIELD = (): HpiField => ({ id: uid(), label: "", type: "free-text", required: false, options: [], placeholder: "" });
const BLANK_TEMPLATE = (): Omit<HpiTemplate, "id"> => ({ name: "", complaintId: "", complaintName: "", fields: [BLANK_FIELD()], active: true });

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  "free-text":   "Free Text",
  "multi-select":"Multi-select",
  "radio":       "Radio",
  "number":      "Number",
};

// ─── Option Editor ────────────────────────────────────────────────────────────

function OptionEditor({ options, onChange }: { options: string[]; onChange: (opts: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  function addOpt() {
    const val = draft.trim();
    if (!val || options.includes(val)) return;
    onChange([...options, val]);
    setDraft("");
  }

  return (
    <div className="ml-4 mt-2 space-y-1">
      {options.map((opt, i) => (
        <div
          key={i} draggable
          onDragStart={() => setDragIdx(i)}
          onDragOver={e => { e.preventDefault(); setDropIdx(i); }}
          onDrop={() => {
            if (dragIdx === null || dragIdx === i) return;
            const next = [...options];
            const [mv] = next.splice(dragIdx, 1);
            next.splice(i, 0, mv);
            onChange(next); setDragIdx(null); setDropIdx(null);
          }}
          onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
          className={`flex items-center gap-1.5 text-xs ${dropIdx === i && dragIdx !== i ? "border-t-2 border-[#4982CF]" : ""}`}>
          <GripVertical className="h-3 w-3 text-slate-300 cursor-grab" />
          <span className="flex-1 bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-slate-700">{opt}</span>
          <button onClick={() => onChange(options.filter((_, j) => j !== i))} className="p-0.5 text-slate-300 hover:text-red-400 transition-colors"><X className="h-3 w-3" /></button>
        </div>
      ))}
      <div className="flex gap-1.5 mt-1.5">
        <Input
          value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addOpt()}
          placeholder="Add option…" className="h-7 text-xs flex-1" />
        <Button type="button" onClick={addOpt} size="sm" className="h-7 px-2 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200">Add</Button>
      </div>
    </div>
  );
}

// ─── Field Row (in editor) ────────────────────────────────────────────────────

function FieldRow({
  field, onUpdate, onRemove,
  dragIdx, dropIdx, onDragStart, onDragOver, onDrop, onDragEnd,
}: {
  field: HpiField; onUpdate: (patch: Partial<HpiField>) => void; onRemove: () => void;
  dragIdx: number | null; dropIdx: number | null;
  onDragStart: () => void; onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void; onDragEnd: () => void;
}) {
  const needsOpts = field.type === "multi-select" || field.type === "radio";
  return (
    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
      className={`bg-white border rounded-xl p-3 space-y-2 ${dropIdx !== null ? "border-[#4982CF] border-dashed" : "border-slate-100"}`}>
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-slate-300 cursor-grab flex-shrink-0" />
        <input
          type="text" value={field.label}
          onChange={e => onUpdate({ label: e.target.value })}
          placeholder="Field label…"
          className="flex-1 text-xs font-semibold text-slate-800 bg-transparent border-b border-slate-200 focus:border-[#4982CF] focus:outline-none py-0.5" />
        <select
          value={field.type}
          onChange={e => onUpdate({ type: e.target.value as FieldType, options: [] })}
          className="text-[10px] border border-slate-200 rounded-lg px-2 py-1 focus:outline-none text-slate-600 bg-white">
          {Object.entries(FIELD_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Switch checked={field.required} onCheckedChange={v => onUpdate({ required: v })}
            className="data-[state=checked]:bg-[#4982CF] scale-75" />
          Req.
        </div>
        <button onClick={onRemove} className="p-1 text-slate-300 hover:text-red-400 transition-colors"><X className="h-3.5 w-3.5" /></button>
      </div>
      {field.type === "free-text" && (
        <input type="text" value={field.placeholder}
          onChange={e => onUpdate({ placeholder: e.target.value })}
          placeholder="Placeholder text (optional)…"
          className="w-full text-[10px] text-slate-500 bg-slate-50 border border-slate-100 rounded px-2 py-1 focus:outline-none" />
      )}
      {field.type === "number" && (
        <input type="text" value={field.placeholder}
          onChange={e => onUpdate({ placeholder: e.target.value })}
          placeholder="Placeholder (e.g. 1–10)…"
          className="w-full text-[10px] text-slate-500 bg-slate-50 border border-slate-100 rounded px-2 py-1 focus:outline-none" />
      )}
      {needsOpts && (
        <OptionEditor options={field.options} onChange={opts => onUpdate({ options: opts })} />
      )}
    </div>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────

function LivePreview({ fields, name, complaintName }: { fields: HpiField[]; name: string; complaintName: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Eye className="h-4 w-4 text-[#4982CF]" />
        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Preview</span>
      </div>
      {!name && !complaintName ? (
        <p className="text-xs text-slate-400 text-center py-6">Fill in template details to see preview</p>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Chief Complaint</p>
            <p className="text-sm font-semibold text-slate-700">{complaintName || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">HPI — {name || "Untitled"}</p>
            {fields.filter(f => f.label).map(f => (
              <div key={f.id} className="mb-3">
                <label className="text-xs font-bold text-slate-700">
                  {f.label}
                  {f.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                {f.type === "free-text" && (
                  <div className="mt-1 h-16 border border-slate-200 rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] text-slate-300">{f.placeholder || "Type here…"}</div>
                )}
                {f.type === "number" && (
                  <input disabled placeholder={f.placeholder || "0"} className="mt-1 h-7 border border-slate-200 rounded-lg bg-slate-50 px-2 text-xs w-24 block" />
                )}
                {f.type === "radio" && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {f.options.map(opt => (
                      <label key={opt} className="flex items-center gap-1.5 text-[10px] text-slate-600 cursor-pointer">
                        <input type="radio" name={f.id} disabled className="accent-[#4982CF]" /> {opt}
                      </label>
                    ))}
                    {!f.options.length && <span className="text-[10px] text-slate-300">Add options above</span>}
                  </div>
                )}
                {f.type === "multi-select" && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {f.options.map(opt => (
                      <label key={opt} className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 border border-slate-100 rounded px-2 py-0.5 cursor-pointer">
                        <input type="checkbox" disabled className="accent-[#4982CF]" /> {opt}
                      </label>
                    ))}
                    {!f.options.length && <span className="text-[10px] text-slate-300">Add options above</span>}
                  </div>
                )}
              </div>
            ))}
            {!fields.filter(f => f.label).length && (
              <p className="text-[10px] text-slate-300">Add fields to see them here</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Template Editor Panel ────────────────────────────────────────────────────

function TemplateEditor({
  initial, onSave, onCancel,
}: {
  initial: Omit<HpiTemplate, "id"> | HpiTemplate;
  onSave: (t: Omit<HpiTemplate, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName]             = useState(initial.name);
  const [complaint, setComplaint]   = useState(initial.complaintName);
  const [fields, setFields]         = useState<HpiField[]>(initial.fields);
  const [active, setActive]         = useState(initial.active);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintSearch, setComplaintSearch] = useState("");
  const [dragIdx, setDragIdx]       = useState<number | null>(null);
  const [dropIdx, setDropIdx]       = useState<number | null>(null);
  const [saved, setSaved]           = useState(false);

  const filteredComplaints = SAMPLE_COMPLAINTS.filter(c =>
    !complaintSearch || c.toLowerCase().includes(complaintSearch.toLowerCase())
  );

  function updateField(idx: number, patch: Partial<HpiField>) {
    setFields(fs => fs.map((f, i) => i === idx ? { ...f, ...patch } : f));
  }

  function addField() { setFields(fs => [...fs, BLANK_FIELD()]); }
  function removeField(idx: number) { setFields(fs => fs.filter((_, i) => i !== idx)); }

  function handleDrop(from: number, to: number) {
    if (from === to) return;
    const next = [...fields];
    const [mv] = next.splice(from, 1);
    next.splice(to, 0, mv);
    setFields(next);
  }

  function handleSave() {
    onSave({ name: name || "Untitled", complaintId: complaint.toLowerCase().replace(/\s/g, "-"), complaintName: complaint, fields, active });
    setSaved(true);
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Left: editor */}
      <div className="flex-1 min-w-0 space-y-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-4">
          {/* Complaint selector */}
          <div className="relative col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Chief Complaint <span className="text-red-400">*</span></label>
            <button
              type="button"
              onClick={() => setComplaintOpen(o => !o)}
              className="w-full flex items-center justify-between text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white hover:border-[#4982CF] focus:outline-none transition-colors">
              <span className={complaint ? "text-slate-800 font-semibold" : "text-slate-400"}>{complaint || "Select complaint…"}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {complaintOpen && (
              <div className="absolute z-50 left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                <div className="p-2 border-b border-slate-100">
                  <Input value={complaintSearch} onChange={e => setComplaintSearch(e.target.value)}
                    placeholder="Search…" className="h-7 text-xs" autoFocus />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredComplaints.map(c => (
                    <button key={c} onClick={() => { setComplaint(c); setComplaintOpen(false); setComplaintSearch(""); }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors ${c === complaint ? "font-bold text-[#4982CF]" : "text-slate-700"}`}>
                      {c}
                    </button>
                  ))}
                  {!filteredComplaints.length && (
                    <button onClick={() => { setComplaint(complaintSearch.trim()); setComplaintOpen(false); setComplaintSearch(""); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#4982CF] font-bold">
                      + Create "{complaintSearch.trim()}"
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Template name */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Template Name <span className="text-red-400">*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Chest Pain Assessment"
              className="h-9 text-sm font-semibold" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={setActive} className="data-[state=checked]:bg-[#4982CF]" />
          <span className="text-xs text-slate-600 font-medium">Active</span>
        </div>

        {/* Fields */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Fields</p>
          <div className="space-y-2">
            {fields.map((f, i) => (
              <FieldRow
                key={f.id} field={f}
                onUpdate={p => updateField(i, p)}
                onRemove={() => removeField(i)}
                dragIdx={dragIdx} dropIdx={dropIdx === i ? i : null}
                onDragStart={() => setDragIdx(i)}
                onDragOver={e => { e.preventDefault(); setDropIdx(i); }}
                onDrop={() => { if (dragIdx !== null) handleDrop(dragIdx, i); setDragIdx(null); setDropIdx(null); }}
                onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
              />
            ))}
          </div>
          <button onClick={addField}
            className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#4982CF] hover:text-[#3b6bb5] transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Field
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Button variant="outline" onClick={onCancel} className="h-9 text-sm">Cancel</Button>
          <div className="flex items-center gap-3">
            {saved && <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</span>}
            <Button onClick={handleSave} className="bg-[#4982CF] hover:bg-[#3b6bb5] text-white h-9 text-sm gap-1.5">
              <Save className="h-3.5 w-3.5" /> Save Template
            </Button>
          </div>
        </div>
      </div>

      {/* Right: live preview */}
      <div className="w-72 flex-shrink-0">
        <LivePreview fields={fields} name={name} complaintName={complaint} />
      </div>
    </div>
  );
}

// ─── HpiTemplatesModule ───────────────────────────────────────────────────────

export function HpiTemplatesModule() {
  const [templates, setTemplates] = useState<HpiTemplate[]>(() => {
    try {
      const raw = localStorage.getItem(HPI_TEMPLATES_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as HpiTemplate[];
        const builtInIds = SEED_TEMPLATES.filter(s => s.builtIn).map(s => s.id);
        // Remove stale built-ins, keep user templates and non-builtIn seeds
        const pruned = stored.filter(t => !t.builtIn || builtInIds.includes(t.id));
        // Auto-inject any seed (builtIn or not) that isn't already stored
        const missing = SEED_TEMPLATES.filter(s => !pruned.some(t => t.id === s.id));
        return missing.length > 0 ? [...pruned, ...missing] : pruned;
      }
    } catch { /**/ }
    return SEED_TEMPLATES;
  });
  useEffect(() => {
    try { localStorage.setItem(HPI_TEMPLATES_KEY, JSON.stringify(templates)); } catch { /**/ }
  }, [templates]);
  const [editing, setEditing] = useState<HpiTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = templates.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.complaintName.toLowerCase().includes(search.toLowerCase())
  );

  function handleSave(data: Omit<HpiTemplate, "id">) {
    if (editing) {
      setTemplates(ts => ts.map(t => t.id === editing.id ? { ...data, id: editing.id } : t));
      setEditing(null);
    } else {
      setTemplates(ts => [...ts, { ...data, id: uid() }]);
      setCreating(false);
    }
  }

  function cloneTemplate(t: HpiTemplate) {
    setTemplates(ts => [...ts, { ...t, id: uid(), name: `${t.name} (copy)` }]);
  }

  if (creating || editing) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setCreating(false); setEditing(null); }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors">
          <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Back to templates
        </button>
        <h3 className="text-base font-black text-slate-800">{editing ? "Edit Template" : "New HPI Template"}</h3>
        <TemplateEditor
          initial={editing ?? BLANK_TEMPLATE()}
          onSave={handleSave}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative">
          <FileText className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="h-8 pl-8 text-xs w-56" />
        </div>
        <Button onClick={() => setCreating(true)}
          className="bg-[#4982CF] hover:bg-[#3b6bb5] text-white h-8 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New Template
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Template Name</th>
              <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Chief Complaint</th>
              <th className="text-center px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Fields</th>
              <th className="text-center px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
              <th className="text-right px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{t.name}</span>
                    {t.builtIn && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 leading-none">
                        Built-in
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-200">{t.complaintName}</Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  {t.builtIn ? (
                    <span className="text-[10px] font-bold text-violet-500">Custom UI</span>
                  ) : (
                    <span className="text-xs font-bold text-slate-500">{t.fields.length}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <Switch checked={t.active}
                    onCheckedChange={v => setTemplates(ts => ts.map(x => x.id === t.id ? { ...x, active: v } : x))}
                    className="data-[state=checked]:bg-[#4982CF]" />
                </td>
                <td className="px-4 py-3 text-right">
                  {t.builtIn ? (
                    <span className="text-[10px] text-slate-300 font-medium pr-1">Read-only</span>
                  ) : (
                    <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditing(t)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF] transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => cloneTemplate(t)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Copy className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm font-semibold">No templates yet</p>
                  <p className="text-xs mt-0.5">Create your first HPI template to get started</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-rose-600"><AlertCircle className="h-5 w-5" />Delete Template</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 mt-1">Are you sure you want to delete <strong>{templates.find(t => t.id === deleteId)?.name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="h-8 text-sm">Cancel</Button>
            <Button onClick={() => { setTemplates(ts => ts.filter(t => t.id !== deleteId)); setDeleteId(null); }}
              className="bg-rose-500 hover:bg-rose-600 text-white h-8 text-sm gap-1.5"><Trash2 className="h-3.5 w-3.5" />Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
