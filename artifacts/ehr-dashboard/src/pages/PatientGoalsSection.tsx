import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, X, Plus, Star, CheckCircle2, Target,
  Calendar, AlertCircle, ChevronDown, Trash2, BookmarkPlus,
  Bookmark, Search, GripVertical,
} from "lucide-react";

// ─── localStorage keys ────────────────────────────────────────────────────────

const CUSTOM_TPLS_KEY = "patient_goals_custom_templates";

// ─── Template system ──────────────────────────────────────────────────────────

interface GoalTemplate {
  id:      string;
  title:   string;
  actions: string[];
  custom?: boolean;
}

const BUILTIN_TEMPLATES: GoalTemplate[] = [
  {
    id: "weight-loss",
    title: "Lose weight by 5 kg",
    actions: ["Walk 30 minutes daily", "Avoid sugary drinks", "Track meals in a diary"],
  },
  {
    id: "blood-sugar",
    title: "Control blood sugar levels",
    actions: ["Take medication regularly", "Monitor blood glucose daily", "Follow diabetic diet plan"],
  },
  {
    id: "mobility",
    title: "Improve mobility",
    actions: ["Attend physiotherapy sessions", "Do prescribed exercises daily", "Reduce prolonged sitting"],
  },
  {
    id: "blood-pressure",
    title: "Reduce blood pressure",
    actions: ["Take antihypertensive medication", "Reduce salt intake", "Walk 20 minutes daily", "Monitor BP at home"],
  },
  {
    id: "med-adherence",
    title: "Improve medication adherence",
    actions: ["Set daily medication reminders", "Use pill organiser", "Follow up with pharmacy"],
  },
  {
    id: "quit-smoking",
    title: "Quit smoking",
    actions: ["Join smoking cessation programme", "Use nicotine replacement therapy", "Identify and avoid triggers"],
  },
  {
    id: "sleep",
    title: "Improve sleep quality",
    actions: ["Maintain consistent sleep schedule", "Avoid screens 1 hour before bed", "Limit caffeine after noon"],
  },
  {
    id: "stress",
    title: "Reduce stress",
    actions: ["Practice deep breathing daily", "Take breaks between tasks", "Try mindfulness or meditation"],
  },
  {
    id: "activity",
    title: "Increase physical activity",
    actions: ["Walk 10,000 steps daily", "Start 3× weekly exercise routine", "Take stairs instead of lift"],
  },
  {
    id: "diet",
    title: "Improve diet",
    actions: ["Eat 5 portions of vegetables daily", "Reduce processed food intake", "Drink 8 glasses of water daily"],
  },
  {
    id: "cholesterol",
    title: "Lower cholesterol",
    actions: ["Follow low-fat diet", "Exercise at least 30 minutes 5× per week", "Take prescribed statin medication"],
  },
  {
    id: "kidney",
    title: "Protect kidney function",
    actions: ["Limit protein intake as advised", "Monitor fluid intake daily", "Avoid NSAIDs and nephrotoxic agents"],
  },
];

function loadCustomTemplates(): GoalTemplate[] {
  try { return JSON.parse(localStorage.getItem(CUSTOM_TPLS_KEY) ?? "[]"); } catch { return []; }
}
function saveCustomTemplates(tpls: GoalTemplate[]) {
  localStorage.setItem(CUSTOM_TPLS_KEY, JSON.stringify(tpls));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatientGoal {
  uid:        string;
  title:      string;
  startDate:  string;
  targetDate: string;
  priority:   "Low" | "Normal" | "High";
  actions:    string[];
}

export interface PatientGoalsData {
  goals: PatientGoal[];
}

export const EMPTY_PATIENT_GOALS: PatientGoalsData = { goals: [] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<PatientGoal["priority"], { bg: string; text: string; border: string }> = {
  Low:    { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  Normal: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  High:   { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
};

function PriorityBadge({ p }: { p: PatientGoal["priority"] }) {
  const s = PRIORITY_STYLES[p];
  return (
    <span className="text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {p}
    </span>
  );
}

function Sel({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 pr-7 outline-none focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/20 transition-colors">
        {children}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ─── Template Picker ──────────────────────────────────────────────────────────

function TemplatePicker({ onSelect }: { onSelect: (tpl: GoalTemplate | null) => void }) {
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const [customTpls, setCustomTpls] = useState<GoalTemplate[]>(loadCustomTemplates);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const all = [...BUILTIN_TEMPLATES, ...customTpls];
  const q   = query.toLowerCase().trim();
  const filtered = q ? all.filter(t => t.title.toLowerCase().includes(q)) : all;
  const builtins  = filtered.filter(t => !t.custom);
  const customs   = filtered.filter(t => t.custom);

  function pick(tpl: GoalTemplate) {
    onSelect(tpl);
    setQuery(""); setOpen(false);
  }

  function pickCustomEntry() {
    onSelect({ id: "custom-new", title: query.trim(), actions: [] });
    setQuery(""); setOpen(false);
  }

  function deleteCustomTpl(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = customTpls.filter(t => t.id !== id);
    setCustomTpls(next);
    saveCustomTemplates(next);
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus-within:border-pink-400/50 focus-within:ring-1 focus-within:ring-pink-400/20 transition-all">
        <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search template or type a custom goal…"
          className="flex-1 text-xs text-slate-700 outline-none placeholder:text-slate-400"
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }} className="text-slate-300 hover:text-slate-500">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto">

          {/* Add custom entry */}
          {q && (
            <button onClick={pickCustomEntry}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-pink-50 transition-colors border-b border-slate-100 text-left">
              <Plus className="h-3.5 w-3.5 text-pink-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-black text-pink-600 uppercase tracking-wide">Add custom goal</p>
                <p className="text-xs font-semibold text-slate-700">"{query.trim()}"</p>
              </div>
            </button>
          )}

          {/* Custom templates */}
          {customs.length > 0 && (
            <div>
              <p className="px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1">
                <Bookmark className="h-3 w-3 fill-amber-400 text-amber-400" /> My Templates
              </p>
              {customs.map(t => (
                <div key={t.id} className="flex items-center gap-1 px-3 hover:bg-pink-50 transition-colors group border-b border-slate-50">
                  <button onClick={() => pick(t)} className="flex-1 py-2.5 text-left">
                    <p className="text-xs font-semibold text-slate-800">{t.title}</p>
                    {t.actions.length > 0 && (
                      <p className="text-[9px] text-slate-400 mt-0.5">{t.actions.length} step{t.actions.length !== 1 ? "s" : ""}</p>
                    )}
                  </button>
                  <button onClick={e => deleteCustomTpl(t.id, e)}
                    className="p-1.5 rounded hover:bg-red-50 text-slate-200 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {builtins.length > 0 && <div className="border-t border-slate-100 mx-3 my-1" />}
            </div>
          )}

          {/* Built-in templates */}
          {builtins.length > 0 && (
            <div>
              {!q && <p className="px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest text-pink-500">Templates</p>}
              {builtins.map(t => (
                <button key={t.id} onClick={() => pick(t)}
                  className="w-full flex items-start gap-2.5 px-4 py-2.5 hover:bg-pink-50 transition-colors border-b border-slate-50 last:border-0 text-left">
                  <Target className="h-3.5 w-3.5 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{t.title}</p>
                    {t.actions.length > 0 && (
                      <p className="text-[9px] text-slate-400 mt-0.5">{t.actions.length} suggested step{t.actions.length !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 && !q && (
            <p className="px-4 py-4 text-xs text-slate-400 italic text-center">No templates found</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Goal Form ─────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_GOAL_FORM = {
  title:      "",
  startDate:  todayStr(),
  targetDate: "",
  priority:   "Normal" as PatientGoal["priority"],
  actions:    [] as string[],
};

function GoalForm({
  initial,
  onSave,
  onCancel,
  onSaveAsTemplate,
}: {
  initial?: typeof EMPTY_GOAL_FORM;
  onSave: (g: typeof EMPTY_GOAL_FORM) => void;
  onCancel: () => void;
  onSaveAsTemplate: (title: string, actions: string[]) => void;
}) {
  const [form, setForm] = useState<typeof EMPTY_GOAL_FORM>(initial ?? EMPTY_GOAL_FORM);
  const [newAction, setNewAction] = useState("");
  const [tplSaved, setTplSaved]   = useState(false);

  function setF<K extends keyof typeof EMPTY_GOAL_FORM>(k: K, v: (typeof EMPTY_GOAL_FORM)[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function addAction() {
    const a = newAction.trim();
    if (!a) return;
    setF("actions", [...form.actions, a]);
    setNewAction("");
  }

  function removeAction(i: number) {
    setF("actions", form.actions.filter((_, idx) => idx !== i));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); addAction(); }
  }

  function handleSaveAsTpl() {
    if (!form.title.trim()) return;
    onSaveAsTemplate(form.title.trim(), form.actions);
    setTplSaved(true);
    setTimeout(() => setTplSaved(false), 2000);
  }

  const canSave = form.title.trim() !== "" && form.targetDate !== "";

  return (
    <div className="border border-pink-100 rounded-xl bg-pink-50/20 p-3 space-y-3">

      {/* Title */}
      <div>
        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">
          Goal Title <span className="text-red-400">*</span>
        </label>
        <input
          value={form.title}
          onChange={e => setF("title", e.target.value)}
          placeholder="Describe the health goal…"
          className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/20 transition-all"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" /> Start Date
          </label>
          <input
            type="date"
            value={form.startDate}
            onChange={e => setF("startDate", e.target.value)}
            className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" /> Target Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={form.targetDate}
            onChange={e => setF("targetDate", e.target.value)}
            className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/20 transition-all"
          />
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Priority</label>
        <div className="flex gap-2">
          {(["Low", "Normal", "High"] as const).map(p => {
            const s = PRIORITY_STYLES[p];
            const active = form.priority === p;
            return (
              <button key={p} onClick={() => setF("priority", p)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all"
                style={active
                  ? { background: s.text, color: "#fff", borderColor: s.text }
                  : { background: s.bg, color: s.text, borderColor: s.border }
                }>
                {p === "High" && <AlertCircle className="h-3 w-3" />}
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div>
        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1.5">
          Recommended Actions
        </label>

        {form.actions.length > 0 && (
          <div className="mb-2 space-y-1">
            {form.actions.map((a, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-100 rounded-lg group">
                <GripVertical className="h-3 w-3 text-slate-200 flex-shrink-0" />
                <p className="flex-1 text-xs text-slate-700">{a}</p>
                <button onClick={() => removeAction(i)}
                  className="p-0.5 rounded text-slate-200 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            value={newAction}
            onChange={e => setNewAction(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type an action step and press Enter…"
            className="flex-1 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/20 transition-all"
          />
          <button onClick={addAction}
            className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-pink-500 text-white hover:bg-pink-400 transition-colors disabled:opacity-40"
            disabled={!newAction.trim()}>
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-between pt-1">
        <button onClick={handleSaveAsTpl}
          disabled={!form.title.trim()}
          className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 hover:text-amber-700 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors">
          {tplSaved
            ? <><CheckCircle2 className="h-3 w-3 text-green-500" /> Saved!</>
            : <><BookmarkPlus className="h-3 w-3" /> Save as template</>
          }
        </button>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => canSave && onSave(form)} disabled={!canSave}
            className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg bg-pink-500 text-white hover:bg-pink-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <CheckCircle2 className="h-3 w-3" />
            {initial ? "Update Goal" : "Add Goal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Chips Panel ──────────────────────────────────────────────────────────────

export function PatientGoalsChipsPanel({ data, onOpen }: { data: PatientGoalsData; onOpen: () => void }) {
  if (data.goals.length === 0) {
    return (
      <button onClick={onOpen}
        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl bg-pink-50/60 border-2 border-dashed border-pink-200 text-pink-600 font-bold text-xs hover:border-pink-400 hover:bg-pink-50 transition-all">
        <Plus className="h-4 w-4 flex-shrink-0" />
        Set patient goals…
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {data.goals.map(g => (
        <div key={g.uid} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-pink-100 bg-pink-50/30">
          <Target className="h-3.5 w-3.5 text-pink-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[11px] font-black text-pink-800">{g.title}</p>
              <PriorityBadge p={g.priority} />
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {g.targetDate
                ? <>Target: <span className="font-medium">{g.targetDate}</span></>
                : "No target date"
              }
              {g.actions.length > 0 && <> · {g.actions.length} step{g.actions.length !== 1 ? "s" : ""}</>}
            </p>
          </div>
        </div>
      ))}
      <button onClick={onOpen}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl border border-pink-200 text-pink-600 text-xs font-bold hover:bg-pink-50 transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Edit goals ({data.goals.length} goal{data.goals.length !== 1 ? "s" : ""})
      </button>
    </div>
  );
}

// ─── Patient Goals Drawer ──────────────────────────────────────────────────────

interface PatientGoalsDrawerProps {
  savedData: PatientGoalsData;
  onSave:   (data: PatientGoalsData) => void;
  onClose:  () => void;
}

export function PatientGoalsDrawer({ savedData, onSave, onClose }: PatientGoalsDrawerProps) {
  const [goals,       setGoals]       = useState<PatientGoal[]>(savedData.goals);
  const [showForm,    setShowForm]    = useState(false);
  const [editingUid,  setEditingUid]  = useState<string | null>(null);
  const [pickedTpl,   setPickedTpl]   = useState<{ title: string; actions: string[] } | null>(null);
  const [customTpls,  setCustomTpls]  = useState<GoalTemplate[]>(loadCustomTemplates);

  function handleTemplateSelect(tpl: GoalTemplate | null) {
    if (!tpl) return;
    setPickedTpl({ title: tpl.title, actions: [...tpl.actions] });
    setEditingUid(null);
    setShowForm(true);
  }

  function handleSaveGoal(form: typeof EMPTY_GOAL_FORM) {
    const uid = editingUid ?? `pg-${Date.now()}`;
    const goal: PatientGoal = { uid, title: form.title, startDate: form.startDate, targetDate: form.targetDate, priority: form.priority, actions: form.actions };
    setGoals(prev => editingUid ? prev.map(g => g.uid === editingUid ? goal : g) : [...prev, goal]);
    setShowForm(false);
    setEditingUid(null);
    setPickedTpl(null);
  }

  function startEdit(g: PatientGoal) {
    setPickedTpl({ title: g.title, actions: [...g.actions] });
    setEditingUid(g.uid);
    setShowForm(true);
  }

  function removeGoal(uid: string) {
    setGoals(prev => prev.filter(g => g.uid !== uid));
    if (editingUid === uid) { setShowForm(false); setEditingUid(null); setPickedTpl(null); }
  }

  function saveAsTpl(title: string, actions: string[]) {
    const tpl: GoalTemplate = { id: `custom-${Date.now()}`, title, actions, custom: true };
    const next = [...customTpls, tpl];
    setCustomTpls(next);
    saveCustomTemplates(next);
  }

  function saveAndClose() {
    onSave({ goals });
    onClose();
  }

  const editingGoal = editingUid ? goals.find(g => g.uid === editingUid) : null;
  const formInitial = pickedTpl
    ? {
        title:      editingGoal?.title      ?? pickedTpl.title,
        startDate:  editingGoal?.startDate  ?? todayStr(),
        targetDate: editingGoal?.targetDate ?? "",
        priority:   editingGoal?.priority   ?? "Normal" as const,
        actions:    editingGoal?.actions    ?? pickedTpl.actions,
      }
    : undefined;

  return (
    <div className="absolute inset-y-0 right-0 w-[68%] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-20">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button onClick={saveAndClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Assessment &amp; Plan</p>
          <p className="text-sm font-black text-slate-800 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-pink-500" /> Patient Goals
          </p>
        </div>
        {goals.length > 0 ? (
          <button onClick={saveAndClose}
            className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-pink-50 text-pink-600 border border-pink-200 flex-shrink-0 hover:bg-pink-100 transition-colors">
            <CheckCircle2 className="h-3 w-3" /> Done ({goals.length})
          </button>
        ) : (
          <button onClick={saveAndClose}
            className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg bg-pink-500 text-white hover:bg-pink-400 transition-colors flex-shrink-0">
            <Star className="h-3.5 w-3.5" /> Save
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">

        {/* Template picker + new goal button */}
        {!showForm && (
          <div className="px-4 pt-4 pb-3 space-y-3">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Add a Goal</p>
              <TemplatePicker onSelect={handleTemplateSelect} />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-slate-100" />
              <span className="text-[9px] font-black text-slate-300 uppercase">or</span>
              <div className="flex-1 border-t border-slate-100" />
            </div>
            <button
              onClick={() => { setPickedTpl({ title: "", actions: [] }); setEditingUid(null); setShowForm(true); }}
              className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl bg-pink-50/60 border-2 border-dashed border-pink-200 text-pink-600 font-bold text-xs hover:border-pink-400 hover:bg-pink-50 transition-all">
              <Plus className="h-4 w-4 flex-shrink-0" />
              Start from scratch
            </button>
          </div>
        )}

        {/* Goal form */}
        {showForm && (
          <div className="px-4 pt-4 pb-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5">
              {editingUid ? "Edit Goal" : "New Goal"}
            </p>
            <GoalForm
              initial={formInitial}
              onSave={handleSaveGoal}
              onCancel={() => { setShowForm(false); setEditingUid(null); setPickedTpl(null); }}
              onSaveAsTemplate={saveAsTpl}
            />
          </div>
        )}

        {/* Saved goals list */}
        {goals.length > 0 && (
          <div className="px-4 pb-4">
            {!showForm && <div className="border-t border-slate-100 mb-3" />}
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">
              Goals ({goals.length})
            </p>
            <div className="space-y-2">
              {goals.map(g => (
                <GoalCard key={g.uid} goal={g} onEdit={() => startEdit(g)} onRemove={() => removeGoal(g.uid)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Goal Card ─────────────────────────────────────────────────────────────────

function GoalCard({ goal, onEdit, onRemove }: { goal: PatientGoal; onEdit: () => void; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const s = PRIORITY_STYLES[goal.priority];

  return (
    <div className="border border-pink-100 rounded-xl overflow-hidden bg-white">
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <Target className="h-3.5 w-3.5 text-pink-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[11px] font-black text-slate-800">{goal.title}</p>
            <PriorityBadge p={goal.priority} />
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {goal.targetDate && (
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                Target: <span className="font-semibold">{goal.targetDate}</span>
              </p>
            )}
            {goal.actions.length > 0 && (
              <button onClick={() => setExpanded(e => !e)}
                className="text-[10px] text-pink-500 font-semibold flex items-center gap-0.5 hover:text-pink-700 transition-colors">
                {goal.actions.length} step{goal.actions.length !== 1 ? "s" : ""}
                <ChevronDown className={`h-2.5 w-2.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit}
            className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-pink-500 hover:bg-pink-50 transition-colors">
            <Star className="h-3 w-3" />
          </button>
          <button onClick={onRemove}
            className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {expanded && goal.actions.length > 0 && (
        <div className="px-3 pb-2.5 border-t border-slate-50">
          <div className="mt-2 space-y-1">
            {goal.actions.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-slate-600">
                <span className="font-black text-pink-400 flex-shrink-0">{i + 1}.</span>
                {a}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
