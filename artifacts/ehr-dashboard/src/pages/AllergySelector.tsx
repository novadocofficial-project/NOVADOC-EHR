import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, X, AlertCircle, Pencil } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AllergenSeverity = "severe" | "moderate" | "mild" | "very_mild";

export interface AllergyEntry {
  id:           string;
  name:         string;
  allergenType: string;
  date:         string;
  reaction:     string;
  onset:        string;
  severity:     AllergenSeverity;
}

// ─── Config ───────────────────────────────────────────────────────────────────

export const SEVERITY_CONFIG: Record<AllergenSeverity, { label: string; color: string; order: number }> = {
  severe:    { label: "Severe",    color: "#ef4444", order: 3 },
  moderate:  { label: "Moderate",  color: "#f97316", order: 2 },
  mild:      { label: "Mild",      color: "#eab308", order: 1 },
  very_mild: { label: "Very Mild", color: "#22c55e", order: 0 },
};

const SEVERITIES: AllergenSeverity[] = ["severe", "moderate", "mild", "very_mild"];

const ALLERGEN_OPTIONS = [
  "Dustmite", "Paracetamol", "Cockroach", "Penicillin", "Sulfonamides",
  "Aspirin", "Ibuprofen", "Latex", "Pollen", "Peanuts", "Shellfish",
  "Dairy", "Eggs", "Wheat", "Soy", "Contrast Dye", "Bee Sting",
  "Cat Dander", "Dog Dander", "Mold",
];

const ALLERGEN_TYPES  = ["Environmental", "Drug", "Food", "Insect", "Contact", "Other"];
const REACTIONS       = ["Rash/Hives", "Anaphylaxis", "Angioedema", "Bronchospasm",
                          "Nausea/Vomiting", "Rhinitis", "Conjunctivitis", "Skin Irritation", "Other"];
const ONSET_OPTIONS   = ["Immediate (< 1 hour)", "Delayed (1-24 hours)", "Late (> 24 hours)"];

// ─── Inline detail form ────────────────────────────────────────────────────────

interface DetailFormProps {
  title:     string;
  form:      Partial<AllergyEntry>;
  isEdit:    boolean;
  onChange:  (f: Partial<AllergyEntry>) => void;
  onConfirm: () => void;
  onCancel:  () => void;
}

function AllergyDetailForm({ title, form, isEdit, onChange, onConfirm, onCancel }: DetailFormProps) {
  return (
    <div className="rounded-xl border-2 border-red-100 bg-red-50/30 px-3 py-3 space-y-3 mt-1">

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-lg flex items-center justify-center bg-red-100 flex-shrink-0">
          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
        </div>
        <p className="text-xs font-black text-slate-800">
          {isEdit ? "Edit" : "Add"}: <span className="text-red-600">{title}</span>
        </p>
      </div>

      {/* Severity row */}
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Severity</p>
        <div className="grid grid-cols-4 gap-1.5">
          {SEVERITIES.map(sev => {
            const cfg    = SEVERITY_CONFIG[sev];
            const active = form.severity === sev;
            return (
              <button
                key={sev}
                onClick={() => onChange({ ...form, severity: sev })}
                className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg border-2 transition-all"
                style={active
                  ? { backgroundColor: cfg.color, borderColor: cfg.color }
                  : { borderColor: `${cfg.color}40`, backgroundColor: `${cfg.color}08` }}>
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: active ? "white" : cfg.color }} />
                <span
                  className="text-[9px] font-black leading-none"
                  style={{ color: active ? "white" : cfg.color }}>
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Allergen Type + Onset */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Allergen Type</p>
          <select
            value={form.allergenType ?? ""}
            onChange={e => onChange({ ...form, allergenType: e.target.value })}
            className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300">
            <option value="">Select type…</option>
            {ALLERGEN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Onset</p>
          <select
            value={form.onset ?? ""}
            onChange={e => onChange({ ...form, onset: e.target.value })}
            className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300">
            <option value="">Select onset…</option>
            {ONSET_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Reaction + Date */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Reaction</p>
          <select
            value={form.reaction ?? ""}
            onChange={e => onChange({ ...form, reaction: e.target.value })}
            className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300">
            <option value="">Select reaction…</option>
            {REACTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Date Noted</p>
          <input
            type="date"
            value={form.date ?? ""}
            onChange={e => onChange({ ...form, date: e.target.value })}
            className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-0.5">
        <button
          onClick={onCancel}
          className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#ef4444" }}>
          {isEdit ? "Save Changes" : "Add Allergy"}
        </button>
      </div>
    </div>
  );
}

// ─── Main AllergySelector ──────────────────────────────────────────────────────

interface AllergySelectorProps {
  entries:  AllergyEntry[];
  onChange: (entries: AllergyEntry[]) => void;
}

export function AllergySelector({ entries, onChange }: AllergySelectorProps) {
  const [dropOpen,     setDropOpen]     = useState(false);
  const [search,       setSearch]       = useState("");
  const [customText,   setCustomText]   = useState("");
  const [pendingName,  setPendingName]  = useState<string | null>(null);
  const [editId,       setEditId]       = useState<string | null>(null);
  const [form,         setForm]         = useState<Partial<AllergyEntry>>({});
  const [dropPos,      setDropPos]      = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const sorted = [...entries].sort(
    (a, b) => SEVERITY_CONFIG[b.severity].order - SEVERITY_CONFIG[a.severity].order
  );

  function openDrop() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 260) });
    }
    setDropOpen(true);
    setSearch("");
    setCustomText("");
  }

  function selectAllergy(name: string) {
    setDropOpen(false);
    setPendingName(name);
    setEditId(null);
    setForm({ allergenType: "", date: "", reaction: "", onset: "", severity: "moderate" });
  }

  function confirmAdd() {
    if (!pendingName) return;
    const entry: AllergyEntry = {
      id:           Date.now().toString(),
      name:         pendingName,
      allergenType: form.allergenType ?? "",
      date:         form.date ?? "",
      reaction:     form.reaction ?? "",
      onset:        form.onset ?? "",
      severity:     form.severity ?? "moderate",
    };
    onChange([...entries, entry]);
    setPendingName(null);
    setForm({});
  }

  function startEdit(entry: AllergyEntry) {
    setEditId(entry.id);
    setPendingName(null);
    setForm({ ...entry });
  }

  function confirmEdit() {
    if (!editId) return;
    onChange(entries.map(e => e.id === editId ? ({ ...e, ...form } as AllergyEntry) : e));
    setEditId(null);
    setForm({});
  }

  function remove(id: string) {
    onChange(entries.filter(e => e.id !== id));
    if (editId === id) { setEditId(null); setForm({}); }
  }

  const alreadySelected = entries.map(e => e.name);
  const filtered = ALLERGEN_OPTIONS.filter(
    o => !alreadySelected.includes(o) && o.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">

      {/* ── Severity-sorted chips ──────────────────────────────────────────── */}
      {sorted.length > 0 && (
        <div className="space-y-1.5">
          {sorted.map((entry, idx) => {
            const sev    = SEVERITY_CONFIG[entry.severity];
            const isEdit = editId === entry.id;
            return (
              <div key={entry.id}>
                <div className={[
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 transition-all",
                  isEdit ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-white shadow-sm",
                ].join(" ")}>
                  {/* Severity dot */}
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: sev.color }} />
                  {/* Number */}
                  <span className="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100 text-slate-600">
                    {idx + 1}
                  </span>
                  {/* Name */}
                  <span className="text-xs font-bold text-slate-800 flex-1 min-w-0 truncate">
                    {entry.name}
                  </span>
                  {/* Severity badge */}
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0"
                    style={{ color: sev.color, backgroundColor: `${sev.color}12`, borderColor: `${sev.color}35` }}>
                    {sev.label}
                  </span>
                  {/* Reaction */}
                  {entry.reaction && (
                    <span className="text-[10px] text-slate-400 font-medium flex-shrink-0 max-w-[72px] truncate">
                      {entry.reaction}
                    </span>
                  )}
                  {/* Onset badge */}
                  {entry.onset && (
                    <span className="text-[9px] text-slate-400 hidden sm:block flex-shrink-0">
                      {entry.onset.split(" ")[0]}
                    </span>
                  )}
                  {/* Edit */}
                  <button
                    onClick={() => isEdit ? (setEditId(null), setForm({})) : startEdit(entry)}
                    className={`p-1 rounded-lg transition-colors flex-shrink-0 ${isEdit ? "text-red-400 bg-red-100" : "text-slate-300 hover:text-blue-500 hover:bg-blue-50"}`}>
                    <Pencil className="h-3 w-3" />
                  </button>
                  {/* Remove */}
                  <button
                    onClick={() => remove(entry.id)}
                    className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {/* Inline edit form */}
                {isEdit && (
                  <AllergyDetailForm
                    title={entry.name}
                    form={form}
                    isEdit
                    onChange={setForm}
                    onConfirm={confirmEdit}
                    onCancel={() => { setEditId(null); setForm({}); }}
                  />
                )}
              </div>
            );
          })}

          {/* Severity legend */}
          <div className="flex items-center gap-3 pt-0.5">
            {SEVERITIES.map(sev => (
              <div key={sev} className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_CONFIG[sev].color }} />
                <span className="text-[9px] text-slate-400">{SEVERITY_CONFIG[sev].label}</span>
              </div>
            ))}
            <span className="text-[9px] text-slate-300 ml-auto">Sorted: Severe → Very Mild</span>
          </div>
        </div>
      )}

      {/* ── Add Allergy button ─────────────────────────────────────────────── */}
      <button
        ref={triggerRef}
        onClick={openDrop}
        className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50/50 transition-all w-full justify-center">
        <Plus className="h-3.5 w-3.5" /> Add Allergy
      </button>

      {/* ── New allergy detail form ────────────────────────────────────────── */}
      {pendingName && (
        <AllergyDetailForm
          title={pendingName}
          form={form}
          isEdit={false}
          onChange={setForm}
          onConfirm={confirmAdd}
          onCancel={() => { setPendingName(null); setForm({}); }}
        />
      )}

      {/* ── Dropdown portal ────────────────────────────────────────────────── */}
      {dropOpen && dropPos && createPortal(
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setDropOpen(false)} />
          <div
            className="fixed z-[999] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width, maxHeight: 280 }}>

            {/* Search bar */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 flex-shrink-0">
              <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search allergies…"
                className="flex-1 text-xs outline-none text-slate-700 placeholder-slate-300"
              />
            </div>

            {/* Options */}
            <div className="overflow-y-auto flex-1">
              {filtered.map(opt => (
                <button
                  key={opt}
                  onClick={() => selectAllergy(opt)}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors border-b border-slate-50 last:border-0">
                  {opt}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-4 py-4 text-xs text-center text-slate-400">
                  No matches — add custom below
                </p>
              )}
            </div>

            {/* Custom input */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-100 bg-slate-50/60 flex-shrink-0">
              <Plus className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <input
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && customText.trim()) {
                    e.preventDefault();
                    selectAllergy(customText.trim());
                    setCustomText("");
                  }
                }}
                placeholder="Add custom allergy…"
                className="flex-1 text-xs outline-none text-slate-700 placeholder-slate-300 bg-transparent"
              />
              <button
                onClick={() => { if (customText.trim()) { selectAllergy(customText.trim()); setCustomText(""); } }}
                disabled={!customText.trim()}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white disabled:opacity-30 transition-opacity"
                style={{ backgroundColor: "#ef4444" }}>
                Add
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
