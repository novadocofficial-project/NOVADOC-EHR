import { useState, useRef, useEffect } from "react";
import { X, Plus, Search, ChevronDown, Check } from "lucide-react";

// ─── Data Lists ───────────────────────────────────────────────────────────────

export const CHRONIC_CONDITIONS = [
  "Hypertension", "Type 2 Diabetes Mellitus", "Type 1 Diabetes Mellitus",
  "Asthma", "COPD", "Chronic Kidney Disease", "Heart Failure",
  "Coronary Artery Disease", "Atrial Fibrillation", "Hypothyroidism",
  "Hyperthyroidism", "Hyperlipidemia", "Obesity", "Iron Deficiency Anemia",
  "Rheumatoid Arthritis", "Osteoarthritis", "Osteoporosis",
  "Epilepsy / Seizure Disorder", "Migraine", "Depression",
  "Anxiety Disorder", "Schizophrenia", "Bipolar Disorder",
  "Chronic Hepatitis B", "Chronic Hepatitis C", "Liver Cirrhosis",
  "Inflammatory Bowel Disease", "Irritable Bowel Syndrome",
  "GERD / Acid Reflux", "Peptic Ulcer Disease", "Psoriasis",
  "Systemic Lupus Erythematosus", "Multiple Sclerosis",
  "Parkinson's Disease", "Alzheimer's Disease", "HIV/AIDS",
  "Tuberculosis (Active)", "Chronic Back Pain", "Fibromyalgia",
  "Polycystic Ovary Syndrome (PCOS)", "Sleep Apnea", "Gout",
];

export const RESOLVED_CONDITIONS = [
  "Pneumonia", "Typhoid Fever", "Malaria", "Dengue Fever",
  "Hepatitis A", "Hepatitis E", "Appendicitis (post-op)", "Cholecystitis",
  "Kidney Stones", "UTI (Urinary Tract Infection)", "Cellulitis",
  "Sepsis (resolved)", "Pulmonary Embolism", "Deep Vein Thrombosis",
  "Stroke / CVA", "Myocardial Infarction", "Pancreatitis",
  "Peritonitis", "Meningitis", "Encephalitis",
  "Chickenpox", "Measles", "Mumps", "Rubella",
  "COVID-19 (recovered)", "Influenza", "Pleuritis", "Pericarditis",
  "Fracture (healed)", "Gastroenteritis", "Tuberculosis (cured)",
  "Iron Deficiency Anemia (corrected)", "Vitamin D Deficiency (corrected)",
];

export const FAMILY_RELATIONS = [
  "Father", "Mother", "Brother", "Sister",
  "Paternal Grandfather", "Paternal Grandmother",
  "Maternal Grandfather", "Maternal Grandmother",
  "Son", "Daughter", "Uncle", "Aunt", "Cousin",
];

export const GENETIC_DISEASES = [
  "Thalassemia", "Sickle Cell Disease", "G6PD Deficiency",
  "Haemophilia A", "Haemophilia B", "Cystic Fibrosis",
  "Phenylketonuria (PKU)", "Marfan Syndrome", "Huntington's Disease",
  "Down Syndrome", "Turner Syndrome", "Klinefelter Syndrome",
  "Familial Hypercholesterolemia", "BRCA1 / BRCA2 (Cancer Risk)",
  "Neurofibromatosis", "Wilson's Disease",
];

const ALL_CONDITIONS = [...CHRONIC_CONDITIONS, ...RESOLVED_CONDITIONS].filter(
  (v, i, a) => a.indexOf(v) === i,
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FamilyRow {
  id: string;
  condition: string;
  relation: string;
}

// ─── ChipSelector ─────────────────────────────────────────────────────────────

interface ChipSelectorProps {
  options: string[];
  selected: string[];
  chipColor: string;
  placeholder?: string;
  onChange: (items: string[]) => void;
}

export function ChipSelector({
  options, selected, chipColor, placeholder = "Search or add…", onChange,
}: ChipSelectorProps) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const filtered = options.filter(
    o => o.toLowerCase().includes(search.toLowerCase()) && !selected.includes(o),
  );
  const canCustom =
    search.trim() !== "" &&
    !options.some(o => o.toLowerCase() === search.trim().toLowerCase()) &&
    !selected.includes(search.trim());

  function toggle(item: string) {
    onChange(selected.includes(item) ? selected.filter(s => s !== item) : [...selected, item]);
  }
  function addCustom() {
    const v = search.trim();
    if (!v || selected.includes(v)) return;
    onChange([...selected, v]);
    setSearch("");
  }

  return (
    <div ref={ref} className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(item => (
            <span
              key={item}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border"
              style={{
                backgroundColor: `${chipColor}18`,
                color: chipColor,
                borderColor: `${chipColor}45`,
              }}>
              {item}
              <button
                onClick={() => toggle(item)}
                className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white hover:border-slate-300 text-slate-500 transition-colors">
        <span>{selected.length === 0 ? placeholder : "+ Add more"}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
            <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && canCustom && addCustom()}
              placeholder="Type to search…"
              className="flex-1 text-xs outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.slice(0, 35).map(opt => (
              <button
                key={opt}
                onClick={() => { toggle(opt); setSearch(""); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 flex items-center justify-between transition-colors">
                {opt}
                {selected.includes(opt) && <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />}
              </button>
            ))}
            {canCustom && (
              <button
                onClick={addCustom}
                className="w-full text-left px-3 py-2 text-xs text-[#4982CF] hover:bg-blue-50 flex items-center gap-2 border-t border-slate-100 font-semibold">
                <Plus className="h-3 w-3" /> Add &ldquo;{search.trim()}&rdquo;
              </button>
            )}
            {filtered.length === 0 && !canCustom && (
              <p className="px-3 py-3 text-xs text-slate-400 italic">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Family Row Entry ─────────────────────────────────────────────────────────

function FamilyRowEntry({
  row, onUpdate, onRemove,
}: {
  row: FamilyRow;
  onUpdate: (id: string, field: "condition" | "relation", val: string) => void;
  onRemove: (id: string) => void;
}) {
  const [condOpen, setCondOpen]     = useState(false);
  const [relOpen, setRelOpen]       = useState(false);
  const [condSearch, setCondSearch] = useState("");
  const condRef                     = useRef<HTMLDivElement>(null);
  const relRef                      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (!condRef.current?.contains(e.target as Node)) setCondOpen(false);
      if (!relRef.current?.contains(e.target as Node)) setRelOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filteredConds = ALL_CONDITIONS.filter(c =>
    c.toLowerCase().includes(condSearch.toLowerCase()),
  );
  const canCustom =
    condSearch.trim() !== "" &&
    !ALL_CONDITIONS.some(c => c.toLowerCase() === condSearch.trim().toLowerCase());

  function pickCond(val: string) {
    onUpdate(row.id, "condition", val);
    setCondOpen(false);
    setCondSearch("");
  }

  return (
    <div className="flex items-center gap-2">
      {/* Condition */}
      <div ref={condRef} className="relative flex-1">
        <button
          onClick={() => { setCondOpen(v => !v); setRelOpen(false); }}
          className="w-full flex items-center justify-between px-3 py-2 text-xs border rounded-xl bg-white hover:border-slate-300 transition-colors"
          style={{ borderColor: row.condition ? "#4982CF60" : "#e2e8f0" }}>
          <span className={row.condition ? "text-slate-800 font-medium" : "text-slate-400"}>
            {row.condition || "Select condition"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        </button>
        {condOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
              <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                value={condSearch}
                onChange={e => setCondSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canCustom && pickCond(condSearch.trim())}
                placeholder="Search condition…"
                className="flex-1 text-xs outline-none text-slate-700"
              />
            </div>
            <div className="max-h-40 overflow-y-auto">
              {filteredConds.slice(0, 30).map(c => (
                <button
                  key={c}
                  onClick={() => pickCond(c)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 flex items-center justify-between">
                  {c}
                  {row.condition === c && <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />}
                </button>
              ))}
              {canCustom && (
                <button
                  onClick={() => pickCond(condSearch.trim())}
                  className="w-full text-left px-3 py-2 text-xs text-[#4982CF] hover:bg-blue-50 flex items-center gap-2 border-t border-slate-100 font-semibold">
                  <Plus className="h-3 w-3" /> Add &ldquo;{condSearch.trim()}&rdquo;
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Relation */}
      <div ref={relRef} className="relative w-36 flex-shrink-0">
        <button
          onClick={() => { setRelOpen(v => !v); setCondOpen(false); }}
          className="w-full flex items-center justify-between px-3 py-2 text-xs border rounded-xl bg-white hover:border-slate-300 transition-colors"
          style={{ borderColor: row.relation ? "#4982CF60" : "#e2e8f0" }}>
          <span className={row.relation ? "text-slate-800 font-medium" : "text-slate-400"}>
            {row.relation || "Relation"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        </button>
        {relOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
            <div className="max-h-44 overflow-y-auto">
              {FAMILY_RELATIONS.map(r => (
                <button
                  key={r}
                  onClick={() => { onUpdate(row.id, "relation", r); setRelOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 flex items-center justify-between">
                  {r}
                  {row.relation === r && <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(row.id)}
        className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-xl border border-transparent hover:border-red-100 hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Past History Panel ───────────────────────────────────────────────────────

interface PastHistoryPanelProps {
  active: string[];
  resolved: string[];
  onActiveChange: (items: string[]) => void;
  onResolvedChange: (items: string[]) => void;
}

export function PastHistoryPanel({
  active, resolved, onActiveChange, onResolvedChange,
}: PastHistoryPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
          Active Chronic Conditions
        </p>
        <ChipSelector
          options={CHRONIC_CONDITIONS}
          selected={active}
          chipColor="#ef4444"
          placeholder="Select active chronic illness…"
          onChange={onActiveChange}
        />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
          Resolved Illnesses
        </p>
        <ChipSelector
          options={RESOLVED_CONDITIONS}
          selected={resolved}
          chipColor="#64748b"
          placeholder="Select resolved illness…"
          onChange={onResolvedChange}
        />
      </div>
    </div>
  );
}

// ─── Family History Panel ─────────────────────────────────────────────────────

interface FamilyHistoryPanelProps {
  rows: FamilyRow[];
  genetic: string[];
  onRowsChange: (rows: FamilyRow[]) => void;
  onGeneticChange: (items: string[]) => void;
}

export function FamilyHistoryPanel({
  rows, genetic, onRowsChange, onGeneticChange,
}: FamilyHistoryPanelProps) {
  function addRow() {
    onRowsChange([...rows, { id: `fhr-${Date.now()}`, condition: "", relation: "" }]);
  }
  function removeRow(id: string) {
    onRowsChange(rows.filter(r => r.id !== id));
  }
  function updateRow(id: string, field: "condition" | "relation", val: string) {
    onRowsChange(rows.map(r => r.id === id ? { ...r, [field]: val } : r));
  }

  return (
    <div className="space-y-2">
      {/* Condition + Relation rows */}
      {rows.length > 0 && (
        <div className="space-y-2">
          {/* Header labels */}
          <div className="flex items-center gap-2 px-1">
            <p className="flex-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Condition</p>
            <p className="w-36 flex-shrink-0 text-[9px] font-black text-slate-400 uppercase tracking-widest">Relation</p>
            <div className="w-8 flex-shrink-0" />
          </div>
          {rows.map(row => (
            <FamilyRowEntry key={row.id} row={row} onUpdate={updateRow} onRemove={removeRow} />
          ))}
        </div>
      )}

      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#4982CF] hover:text-blue-700 transition-colors px-2 py-1.5 rounded-lg hover:bg-blue-50">
        <Plus className="h-3.5 w-3.5" /> Add Family Member
      </button>

      {/* Genetic Diseases */}
      <div className="pt-3 border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
          Genetic Diseases
        </p>
        <ChipSelector
          options={GENETIC_DISEASES}
          selected={genetic}
          chipColor="#7c3aed"
          placeholder="Select genetic disease…"
          onChange={onGeneticChange}
        />
      </div>
    </div>
  );
}
