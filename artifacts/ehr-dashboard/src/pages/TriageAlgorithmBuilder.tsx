import { useState } from "react";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Edit2, Check, X, Copy, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useTriageConfig,
  SINGLETON_STEP_TYPES,
  type TriageAlgorithm, type TriageStep, type TriageStepType,
  type TriageOutcome, type TriageOutcomeType, type TriageItem, type SeverityBand,
} from "@/hooks/useTriageConfig";

function uid() { return `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_TYPE_META: Record<TriageStepType, { label: string; color: string; bg: string }> = {
  "patient-details":      { label: "Patient Details",  color: "text-sky-700",    bg: "bg-sky-50 border-sky-200"     },
  "presenting-complaint": { label: "Complaint",        color: "text-slate-700",  bg: "bg-slate-100 border-slate-200" },
  "question-group":       { label: "Question Group",   color: "text-amber-700",  bg: "bg-amber-50 border-amber-200"  },
  "flag-checklist":       { label: "Flag Checklist",   color: "text-rose-700",   bg: "bg-rose-50 border-rose-200"    },
  "severity-scale":       { label: "Severity Scale",   color: "text-purple-700", bg: "bg-purple-50 border-purple-200"},
  "character-checklist":  { label: "Character Check",  color: "text-teal-700",   bg: "bg-teal-50 border-teal-200"    },
  "outcome":              { label: "Outcome",           color: "text-green-700",  bg: "bg-green-50 border-green-200"  },
};

const STEP_TYPE_OPTIONS: { type: TriageStepType; desc: string }[] = [
  { type: "patient-details",      desc: "Name, age, gender, phone, address" },
  { type: "presenting-complaint", desc: "Display the complaint label" },
  { type: "question-group",       desc: "Yes/No questions with routing" },
  { type: "flag-checklist",       desc: "Risk / red / yellow flag items" },
  { type: "severity-scale",       desc: "Numeric scale with grade bands" },
  { type: "character-checklist",  desc: "Descriptive yes/no checklist" },
  { type: "outcome",              desc: "Terminal routing outcome" },
];

const OUTCOME_LABELS: Record<TriageOutcomeType, string> = {
  ambulance:        "Call Ambulance",
  teleconsultation: "Teleconsultation",
  "doctor-visit":   "Nearby Doctor Visit",
  advice:           "Custom Advice",
};

const OUTCOME_CHIP: Record<TriageOutcomeType, string> = {
  ambulance:        "text-red-700 bg-red-50 border-red-200",
  teleconsultation: "text-blue-700 bg-blue-50 border-blue-200",
  "doctor-visit":   "text-orange-700 bg-orange-50 border-orange-200",
  advice:           "text-green-700 bg-green-50 border-green-200",
};

// ─── AdviceItemsEditor ────────────────────────────────────────────────────────

function AdviceItemsEditor({
  items, onChange,
}: { items: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim();
    if (!t) return;
    onChange([...items, t]);
    setDraft("");
  }

  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 mt-2 space-y-1.5">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Advice Items</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="flex-1 text-xs text-slate-700 leading-relaxed">• {item}</span>
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-slate-300 hover:text-rose-500 transition-colors mt-0.5 flex-shrink-0"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div className="flex gap-1.5 pt-1">
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add advice item…"
          className="h-7 text-xs flex-1"
        />
        <button
          onClick={add}
          disabled={!draft.trim()}
          className="h-7 w-7 flex items-center justify-center rounded bg-[#4982CF] text-white hover:bg-[#3a6bb5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── OutcomePicker ────────────────────────────────────────────────────────────

function OutcomePicker({
  label, value, onChange,
}: {
  label: string;
  value?: TriageOutcome;
  onChange: (v?: TriageOutcome) => void;
}) {
  const typeVal = value?.type ?? "__continue";

  return (
    <div className="space-y-2">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <Select
        value={typeVal}
        onValueChange={v => {
          if (v === "__continue") { onChange(undefined); return; }
          const t = v as TriageOutcomeType;
          const prev = value?.type === "advice" ? value.adviceItems : [];
          onChange({ type: t, adviceItems: t === "advice" ? prev : [] });
        }}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__continue">Continue to next step</SelectItem>
          <SelectItem value="ambulance">Call Ambulance</SelectItem>
          <SelectItem value="teleconsultation">Teleconsultation</SelectItem>
          <SelectItem value="doctor-visit">Nearby Doctor Visit</SelectItem>
          <SelectItem value="advice">Custom Advice</SelectItem>
        </SelectContent>
      </Select>
      {value?.type && (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${OUTCOME_CHIP[value.type]}`}>
          {OUTCOME_LABELS[value.type]}
        </span>
      )}
      {value?.type === "advice" && (
        <AdviceItemsEditor
          items={value.adviceItems}
          onChange={items => onChange({ type: "advice", adviceItems: items })}
        />
      )}
    </div>
  );
}

// ─── ItemListEditor ───────────────────────────────────────────────────────────

function ItemListEditor({
  items, onChange, placeholder = "Add item… (Enter to add)",
}: {
  items: TriageItem[];
  onChange: (v: TriageItem[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  function add() {
    const t = draft.trim();
    if (!t) return;
    onChange([...items, { id: uid(), label: t }]);
    setDraft("");
  }

  function saveEdit(id: string) {
    const t = editVal.trim();
    if (t) onChange(items.map(it => it.id === id ? { ...it, label: t } : it));
    setEditId(null);
  }

  function move(id: string, dir: -1 | 1) {
    const i = items.findIndex(it => it.id === id);
    if (i + dir < 0 || i + dir >= items.length) return;
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-1.5 group">
          {editId === item.id ? (
            <>
              <Input
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") saveEdit(item.id);
                  if (e.key === "Escape") setEditId(null);
                }}
                className="h-7 text-xs flex-1"
                autoFocus
              />
              <button onClick={() => saveEdit(item.id)} className="text-[#4982CF] hover:opacity-70">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => move(item.id, -1)}
                  disabled={i === 0}
                  className="text-slate-300 hover:text-slate-600 disabled:opacity-0 leading-none"
                >
                  <ChevronUp className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={() => move(item.id, 1)}
                  disabled={i === items.length - 1}
                  className="text-slate-300 hover:text-slate-600 disabled:opacity-0 leading-none"
                >
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
              </div>
              <span className="flex-1 text-xs text-slate-700 py-1.5 px-2.5 rounded-md bg-white border border-slate-200 truncate min-w-0">
                {item.label}
              </span>
              <button
                onClick={() => { setEditId(item.id); setEditVal(item.label); }}
                className="text-slate-300 hover:text-[#4982CF] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              <button
                onClick={() => onChange(items.filter(it => it.id !== item.id))}
                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      ))}
      <div className="flex gap-1.5 pt-1">
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="h-7 text-xs flex-1"
        />
        <button
          onClick={add}
          disabled={!draft.trim()}
          className="h-7 w-7 flex items-center justify-center rounded bg-[#4982CF] text-white hover:bg-[#3a6bb5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── BandListEditor ───────────────────────────────────────────────────────────

function BandListEditor({
  bands, onChange,
}: { bands: SeverityBand[]; onChange: (v: SeverityBand[]) => void }) {
  function upd(id: string, field: keyof SeverityBand, val: string | number) {
    onChange(bands.map(b => b.id === id ? { ...b, [field]: val } : b));
  }

  return (
    <div className="space-y-2">
      {bands.length === 0 && (
        <p className="text-xs text-slate-400 italic">No bands defined yet.</p>
      )}
      {bands.map(band => (
        <div key={band.id} className="flex items-center gap-2 group">
          <input
            type="color"
            value={band.color}
            onChange={e => upd(band.id, "color", e.target.value)}
            className="h-7 w-8 rounded cursor-pointer border border-slate-200 p-0.5 flex-shrink-0"
            title="Band color"
          />
          <Input
            value={band.label}
            onChange={e => upd(band.id, "label", e.target.value)}
            placeholder="Band label"
            className="h-7 text-xs flex-1 min-w-0"
          />
          <span className="text-[10px] text-slate-400 flex-shrink-0">From</span>
          <Input
            type="number"
            value={band.from}
            min={1}
            onChange={e => upd(band.id, "from", Math.max(1, parseInt(e.target.value) || 1))}
            className="h-7 text-xs w-14 flex-shrink-0"
          />
          <span className="text-[10px] text-slate-400 flex-shrink-0">To</span>
          <Input
            type="number"
            value={band.to}
            min={1}
            onChange={e => upd(band.id, "to", Math.max(1, parseInt(e.target.value) || 1))}
            className="h-7 text-xs w-14 flex-shrink-0"
          />
          <button
            onClick={() => onChange(bands.filter(b => b.id !== band.id))}
            className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...bands, { id: uid(), from: 1, to: 5, label: "New Band", color: "#94a3b8" }])}
        className="h-7 text-xs gap-1"
      >
        <Plus className="h-3 w-3" /> Add Band
      </Button>
    </div>
  );
}

// ─── StepEditor (type-specific content) ──────────────────────────────────────

function StepEditor({
  step, onUpdate,
}: {
  step: TriageStep;
  onUpdate: (updater: (s: TriageStep) => TriageStep) => void;
}) {
  if (step.type === "patient-details") {
    return (
      <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Fixed Built-in Fields</p>
        <div className="flex flex-wrap gap-1.5">
          {["Patient Name", "Age", "Gender", "Phone No.", "Address"].map(f => (
            <span key={f} className="text-xs text-slate-600 bg-white border border-slate-200 rounded-full px-2.5 py-1">
              {f}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-2">These fields are always collected in the patient details step.</p>
      </div>
    );
  }

  if (step.type === "presenting-complaint") {
    return (
      <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">About this step</p>
        <p className="text-xs text-slate-500">
          This step displays the algorithm's presenting complaint to the responder.
          The step title above is used as the display label.
        </p>
      </div>
    );
  }

  // Both question-group and flag-checklist expose the same two routing pickers:
  //   "If any = YES →"  (ifAnyYes)
  //   "If all = NO  →"  (ifAllNo)
  // This lets admins configure non-continue outcomes for either branch on
  // both step types. Leaving a picker on "Continue to next step" (undefined)
  // is always valid — that is the implicit default.
  if (step.type === "question-group" || step.type === "flag-checklist") {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            {step.type === "question-group" ? "Questions (Yes / No)" : "Flag Items (Yes / No)"}
          </p>
          <ItemListEditor
            items={step.items}
            onChange={items => onUpdate(s => ({ ...s, items }))}
            placeholder={step.type === "question-group" ? "Add question…" : "Add flag item…"}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <OutcomePicker
            label="If any = YES →"
            value={step.ifAnyYes}
            onChange={v => onUpdate(s => ({ ...s, ifAnyYes: v }))}
          />
          <OutcomePicker
            label="If all = NO →"
            value={step.ifAllNo}
            onChange={v => onUpdate(s => ({ ...s, ifAllNo: v }))}
          />
        </div>
      </div>
    );
  }

  if (step.type === "severity-scale") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Scale Maximum</p>
          <Input
            type="number"
            value={step.scaleMax}
            min={2}
            max={100}
            onChange={e => onUpdate(s => ({ ...s, scaleMax: Math.max(2, parseInt(e.target.value) || 10) }))}
            className="h-7 text-xs w-16"
          />
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Grade Bands</p>
          <BandListEditor
            bands={step.bands}
            onChange={bands => onUpdate(s => ({ ...s, bands }))}
          />
        </div>
      </div>
    );
  }

  if (step.type === "character-checklist") {
    return (
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          Checklist Items (descriptive — no routing)
        </p>
        <ItemListEditor
          items={step.items}
          onChange={items => onUpdate(s => ({ ...s, items }))}
          placeholder="Add characteristic…"
        />
      </div>
    );
  }

  if (step.type === "outcome") {
    return (
      <OutcomePicker
        label="Outcome Action"
        value={step.ifAnyYes}
        onChange={v => onUpdate(s => ({ ...s, ifAnyYes: v }))}
      />
    );
  }

  return null;
}

// ─── StepCard ─────────────────────────────────────────────────────────────────

function StepCard({
  step, index, totalSteps, expanded,
  onToggle, onMove, onDelete, onUpdate,
}: {
  step: TriageStep;
  index: number;
  totalSteps: number;
  expanded: boolean;
  onToggle: () => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onUpdate: (updater: (s: TriageStep) => TriageStep) => void;
}) {
  const meta = STEP_TYPE_META[step.type];
  const [editTitle, setEditTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(step.title);

  function saveTitle() {
    if (titleDraft.trim()) onUpdate(s => ({ ...s, title: titleDraft.trim() }));
    setEditTitle(false);
  }

  return (
    <div className={`rounded-xl border bg-white transition-all ${
      expanded ? "border-[#4982CF]/30 shadow-md" : "border-slate-200 hover:border-slate-300 shadow-sm"
    }`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-slate-600">{index + 1}</span>
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border flex-shrink-0 ${meta.bg} ${meta.color}`}>
          {meta.label}
        </span>
        <div className="flex-1 min-w-0">
          {editTitle ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") { setEditTitle(false); setTitleDraft(step.title); }
                }}
                className="h-7 text-sm flex-1"
                autoFocus
              />
              <button onClick={saveTitle} className="text-[#4982CF] hover:opacity-70">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => { setEditTitle(false); setTitleDraft(step.title); }} className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group/title">
              <span className="text-sm font-semibold text-slate-800 truncate">{step.title}</span>
              <button
                onClick={() => { setEditTitle(true); setTitleDraft(step.title); }}
                className="text-slate-300 hover:text-[#4982CF] opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={index === totalSteps - 1}
            className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-slate-300 hover:text-rose-500 transition-colors ml-0.5"
            title="Delete step"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onToggle}
            className="ml-2 text-xs font-semibold text-[#4982CF] hover:opacity-70 flex items-center gap-1 transition-opacity"
          >
            {expanded ? "Collapse" : "Configure"}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      {/* Routing summary shown in collapsed view for question-group and flag-checklist */}
      {!expanded && (step.type === "question-group" || step.type === "flag-checklist") && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          <span className="text-[9px] text-slate-400 self-center">Routes:</span>
          <RoutingChip label="any YES" outcome={step.ifAnyYes} />
          <RoutingChip label="all NO" outcome={step.ifAllNo} />
        </div>
      )}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100">
          <StepEditor step={step} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

// ─── RoutingChip ──────────────────────────────────────────────────────────────
// Small inline chip used in the collapsed StepCard to summarise routing for
// question-group and flag-checklist steps.  Shows the configured outcome type
// or a neutral "Continue" badge when no outcome is set (i.e. ifAllNo / ifAnyYes
// is undefined — the implicit default).

function RoutingChip({ label, outcome }: { label: string; outcome?: TriageOutcome }) {
  if (!outcome) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-semibold rounded-full border px-2 py-0.5 text-slate-400 bg-slate-50 border-slate-200">
        <span className="opacity-60">{label} →</span> Continue
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold rounded-full border px-2 py-0.5 ${OUTCOME_CHIP[outcome.type]}`}>
      <span className="opacity-70">{label} →</span> {OUTCOME_LABELS[outcome.type]}
    </span>
  );
}

// ─── AlgorithmListPanel ───────────────────────────────────────────────────────

function AlgorithmListPanel({
  algorithms, selectedId, onSelect, onCreate, onDuplicate, onDelete, onToggle,
}: {
  algorithms: TriageAlgorithm[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => string;
  onDuplicate: (id: string) => string;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  function create() {
    const id = onCreate();
    onSelect(id);
  }

  function duplicate(algo: TriageAlgorithm) {
    const id = onDuplicate(algo.id);
    onSelect(id);
  }

  function remove(id: string) {
    if (id === selectedId) {
      const next = algorithms.find(a => a.id !== id);
      if (next) onSelect(next.id);
    }
    onDelete(id);
  }

  function toggle(id: string) {
    onToggle(id);
  }

  return (
    <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-slate-50/60 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Triage Algorithms</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {algorithms.length} algorithm{algorithms.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={create}
          className="h-7 px-2.5 rounded-lg bg-[#4982CF] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#3a6bb5] transition-colors"
        >
          <Plus className="h-3 w-3" /> New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {algorithms.map(algo => {
          const sel = selectedId === algo.id;
          return (
            <div
              key={algo.id}
              onClick={() => onSelect(algo.id)}
              className={`rounded-lg p-3 cursor-pointer transition-all group ${
                sel
                  ? "bg-[#4982CF]/10 border border-[#4982CF]/30"
                  : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{algo.name}</p>
                  <p className="text-[11px] text-[#4982CF] font-medium mt-0.5 truncate">
                    {algo.complaintLabel}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {algo.steps.length} step{algo.steps.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Switch
                  checked={algo.enabled}
                  onCheckedChange={() => toggle(algo.id)}
                  onClick={e => e.stopPropagation()}
                  className="flex-shrink-0 scale-[0.75] mt-0.5 origin-right"
                />
              </div>
              <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => { e.stopPropagation(); duplicate(algo); }}
                  className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-[#4982CF] transition-colors"
                >
                  <Copy className="h-3 w-3" /> Duplicate
                </button>
                <span className="text-slate-200 text-xs">·</span>
                <button
                  onClick={e => { e.stopPropagation(); remove(algo.id); }}
                  className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TriageAlgorithmBuilder ───────────────────────────────────────────────────

export function TriageAlgorithmBuilder() {
  const {
    algorithms, mutate,
    createAlgorithm, updateAlgorithm, deleteAlgorithm, duplicateAlgorithm,
  } = useTriageConfig();
  const [selectedId, setSelectedId] = useState<string | null>(() => algorithms[0]?.id ?? null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showAddStep, setShowAddStep] = useState(false);

  const selected = algorithms.find(a => a.id === selectedId) ?? null;

  function handleSelect(id: string) {
    setSelectedId(id);
    setExpandedSteps(new Set());
    setShowAddStep(false);
  }

  function toggleExpand(id: string) {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function updateStep(stepId: string, updater: (s: TriageStep) => TriageStep) {
    mutate(prev => prev.map(a =>
      a.id !== selectedId ? a : { ...a, steps: a.steps.map(s => s.id === stepId ? updater(s) : s) }
    ));
  }

  function moveStep(stepId: string, dir: -1 | 1) {
    mutate(prev => prev.map(a => {
      if (a.id !== selectedId) return a;
      const i = a.steps.findIndex(s => s.id === stepId);
      if (i + dir < 0 || i + dir >= a.steps.length) return a;
      const steps = [...a.steps];
      [steps[i], steps[i + dir]] = [steps[i + dir], steps[i]];
      return { ...a, steps };
    }));
  }

  function deleteStep(stepId: string) {
    mutate(prev => prev.map(a =>
      a.id !== selectedId ? a : { ...a, steps: a.steps.filter(s => s.id !== stepId) }
    ));
  }

  function addStep(type: TriageStepType) {
    if (!selected) return;
    if (SINGLETON_STEP_TYPES.has(type) && selected.steps.some(s => s.type === type)) return;
    const id = uid();
    const newStep: TriageStep = {
      id, type,
      title: STEP_TYPE_META[type].label,
      items: [],
      scaleMax: 10,
      bands: type === "severity-scale" ? [
        { id: uid(), from: 1, to: 3,  label: "Mild",     color: "#22c55e" },
        { id: uid(), from: 4, to: 7,  label: "Moderate", color: "#f59e0b" },
        { id: uid(), from: 8, to: 10, label: "Severe",   color: "#ef4444" },
      ] : [],
    };
    mutate(prev => prev.map(a =>
      a.id !== selectedId ? a : { ...a, steps: [...a.steps, newStep] }
    ));
    setShowAddStep(false);
    setExpandedSteps(prev => new Set([...prev, id]));
  }

  function updateAlgoField(field: "name" | "complaintLabel", value: string) {
    if (!selectedId) return;
    updateAlgorithm(selectedId, { [field]: value });
  }

  return (
    <div className="flex h-full overflow-hidden">
      <AlgorithmListPanel
        algorithms={algorithms}
        selectedId={selectedId}
        onSelect={handleSelect}
        onCreate={createAlgorithm}
        onDuplicate={duplicateAlgorithm}
        onDelete={deleteAlgorithm}
        onToggle={id => updateAlgorithm(id, { enabled: !algorithms.find(a => a.id === id)?.enabled })}
      />

      {selected ? (
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Algorithm header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0">
            <div className="flex flex-wrap gap-4 max-w-2xl">
              <div className="flex-1 min-w-48">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Algorithm Name
                </label>
                <Input
                  value={selected.name}
                  onChange={e => updateAlgoField("name", e.target.value)}
                  className="h-8 text-sm font-semibold"
                />
              </div>
              <div className="w-52 flex-shrink-0">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Presenting Complaint
                </label>
                <Input
                  value={selected.complaintLabel}
                  onChange={e => updateAlgoField("complaintLabel", e.target.value)}
                  placeholder="e.g. Back Pain, Fever…"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Step list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {selected.steps.length === 0 && !showAddStep && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="h-10 w-10 text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-400">No steps yet</p>
                <p className="text-xs text-slate-300 mt-1">Add steps using the button below</p>
              </div>
            )}

            {selected.steps.map((step, i) => (
              <StepCard
                key={step.id}
                step={step}
                index={i}
                totalSteps={selected.steps.length}
                expanded={expandedSteps.has(step.id)}
                onToggle={() => toggleExpand(step.id)}
                onMove={dir => moveStep(step.id, dir)}
                onDelete={() => deleteStep(step.id)}
                onUpdate={updater => updateStep(step.id, updater)}
              />
            ))}

            {/* Add step */}
            {showAddStep ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Select Step Type
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                  {STEP_TYPE_OPTIONS.map(opt => {
                    const meta = STEP_TYPE_META[opt.type];
                    const alreadyExists =
                      SINGLETON_STEP_TYPES.has(opt.type) &&
                      (selected?.steps.some(s => s.type === opt.type) ?? false);
                    return (
                      <button
                        key={opt.type}
                        onClick={() => !alreadyExists && addStep(opt.type)}
                        disabled={alreadyExists}
                        title={alreadyExists ? "Only one step of this type allowed per algorithm" : undefined}
                        className={`flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-shadow ${
                          alreadyExists
                            ? "opacity-40 cursor-not-allowed bg-slate-50 border-slate-200"
                            : `hover:shadow-sm ${meta.bg}`
                        }`}
                      >
                        <span className={`text-xs font-bold ${alreadyExists ? "text-slate-400" : meta.color}`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-slate-400 leading-snug">
                          {alreadyExists ? "Already added (1 per algorithm)" : opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end mt-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowAddStep(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddStep(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-4 text-sm font-semibold text-slate-400 hover:border-[#4982CF]/40 hover:text-[#4982CF] transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Step
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-8">
          <AlertCircle className="h-10 w-10 text-slate-200" />
          <p className="text-sm font-semibold text-slate-400">Select an algorithm to edit</p>
          <p className="text-xs text-slate-300">Or create a new one using the New button</p>
        </div>
      )}
    </div>
  );
}
