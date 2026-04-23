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

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SURGICAL HISTORY ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const SURGERY_PROCEDURES = [
  "Appendectomy", "Cholecystectomy (Gallbladder removal)",
  "Caesarean Section (C-section)", "Coronary Artery Bypass Graft (CABG)",
  "Cataract Surgery", "Hip Replacement", "Knee Replacement",
  "Hysterectomy", "Tonsillectomy", "Hernia Repair (Inguinal)",
  "Hernia Repair (Umbilical)", "Prostatectomy", "Thyroidectomy",
  "Spinal Fusion / Laminectomy", "Mastectomy", "Colostomy",
  "Bowel Resection", "Nephrectomy (Kidney removal)",
  "Liver Transplant", "Kidney Transplant",
  "Gastric Bypass / Bariatric Surgery", "ERCP", "Laparoscopic Exploration",
  "Angioplasty / Stenting", "Pacemaker Insertion", "Tracheotomy",
  "Tympanoplasty", "Skin Graft", "Wound Debridement", "Varicocelectomy",
  "Orchidopexy", "Circumcision", "Fistulotomy", "Hemorrhoidectomy",
  "Pilonidal Sinus Excision", "Cataract + IOL Implant",
];

const SURGERY_COMPLICATIONS = [
  "None", "Wound Infection", "Bleeding / Haemorrhage",
  "Anastomotic Leak", "Adhesions / Bowel Obstruction",
  "Post-op Pneumonia", "DVT / Pulmonary Embolism",
  "Urinary Retention", "Nerve Damage", "Seroma / Haematoma",
  "Incisional Hernia", "Keloid / Hypertrophic Scar",
  "Re-operation Required", "ICU Admission Required",
  "Prolonged Wound Healing", "Anaesthesia Reaction",
];

export interface SurgicalEntry {
  id: string;
  procedure: string;
  date: string;
  complications: string;
}

// ─── Surgical row ─────────────────────────────────────────────────────────────

function SurgicalRow({
  entry, onUpdate, onRemove, onAdd,
}: {
  entry: SurgicalEntry;
  onUpdate: (id: string, field: keyof SurgicalEntry, val: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const [procOpen, setProcOpen]     = useState(false);
  const [compOpen, setCompOpen]     = useState(false);
  const [procSearch, setProcSearch] = useState("");
  const [compSearch, setCompSearch] = useState("");
  const procRef                     = useRef<HTMLDivElement>(null);
  const compRef                     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (!procRef.current?.contains(e.target as Node)) setProcOpen(false);
      if (!compRef.current?.contains(e.target as Node)) setCompOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filteredProcs = SURGERY_PROCEDURES.filter(p =>
    p.toLowerCase().includes(procSearch.toLowerCase()),
  );
  const canCustomProc =
    procSearch.trim() !== "" &&
    !SURGERY_PROCEDURES.some(p => p.toLowerCase() === procSearch.trim().toLowerCase());

  const filteredComps = SURGERY_COMPLICATIONS.filter(c =>
    c.toLowerCase().includes(compSearch.toLowerCase()),
  );
  const canCustomComp =
    compSearch.trim() !== "" &&
    !SURGERY_COMPLICATIONS.some(c => c.toLowerCase() === compSearch.trim().toLowerCase());

  function pickProc(val: string) {
    onUpdate(entry.id, "procedure", val);
    setProcOpen(false);
    setProcSearch("");
  }
  function pickComp(val: string) {
    onUpdate(entry.id, "complications", val);
    setCompOpen(false);
    setCompSearch("");
  }

  return (
    <div className="flex items-center gap-2">
      {/* Procedure */}
      <div ref={procRef} className="relative flex-1">
        <button
          onClick={() => { setProcOpen(v => !v); setCompOpen(false); }}
          className="w-full flex items-center justify-between px-3 h-8 text-xs border rounded-xl bg-white hover:border-slate-300 transition-colors"
          style={{ borderColor: entry.procedure ? "#4982CF60" : "#e2e8f0" }}>
          <span className={entry.procedure ? "text-slate-800 font-medium truncate" : "text-slate-400"}>
            {entry.procedure || "Select Surgery Procedure"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 ml-1" />
        </button>
        {procOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
              <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                value={procSearch}
                onChange={e => setProcSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canCustomProc && pickProc(procSearch.trim())}
                placeholder="Search procedure…"
                className="flex-1 text-xs outline-none text-slate-700"
              />
            </div>
            <div className="max-h-44 overflow-y-auto">
              {filteredProcs.slice(0, 30).map(p => (
                <button
                  key={p}
                  onClick={() => pickProc(p)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 flex items-center justify-between">
                  {p}
                  {entry.procedure === p && <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />}
                </button>
              ))}
              {canCustomProc && (
                <button
                  onClick={() => pickProc(procSearch.trim())}
                  className="w-full text-left px-3 py-2 text-xs text-[#4982CF] hover:bg-blue-50 flex items-center gap-2 border-t border-slate-100 font-semibold">
                  <Plus className="h-3 w-3" /> Add &ldquo;{procSearch.trim()}&rdquo;
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Date */}
      <div className="relative flex-shrink-0">
        <input
          type="date"
          value={entry.date}
          onChange={e => onUpdate(entry.id, "date", e.target.value)}
          className="h-8 w-36 pl-3 pr-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 transition-colors cursor-pointer"
          style={{ colorScheme: "light" }}
        />
      </div>

      {/* Complications */}
      <div ref={compRef} className="relative flex-1">
        <button
          onClick={() => { setCompOpen(v => !v); setProcOpen(false); }}
          className="w-full flex items-center justify-between px-3 h-8 text-xs border rounded-xl bg-white hover:border-slate-300 transition-colors"
          style={{ borderColor: entry.complications ? "#4982CF60" : "#e2e8f0" }}>
          <span className={entry.complications ? "text-slate-800 font-medium truncate" : "text-slate-400"}>
            {entry.complications || "Select Complications"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 ml-1" />
        </button>
        {compOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
              <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                value={compSearch}
                onChange={e => setCompSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canCustomComp && pickComp(compSearch.trim())}
                placeholder="Search complication…"
                className="flex-1 text-xs outline-none text-slate-700"
              />
            </div>
            <div className="max-h-44 overflow-y-auto">
              {filteredComps.slice(0, 20).map(c => (
                <button
                  key={c}
                  onClick={() => pickComp(c)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 flex items-center justify-between">
                  {c}
                  {entry.complications === c && <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />}
                </button>
              ))}
              {canCustomComp && (
                <button
                  onClick={() => pickComp(compSearch.trim())}
                  className="w-full text-left px-3 py-2 text-xs text-[#4982CF] hover:bg-blue-50 flex items-center gap-2 border-t border-slate-100 font-semibold">
                  <Plus className="h-3 w-3" /> Add &ldquo;{compSearch.trim()}&rdquo;
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Remove (subtle) */}
      <button
        onClick={() => onRemove(entry.id)}
        className="h-8 w-7 flex-shrink-0 flex items-center justify-center rounded-xl border border-transparent hover:border-red-100 hover:bg-red-50 text-slate-200 hover:text-red-400 transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Add row */}
      <button
        onClick={onAdd}
        className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full bg-[#4982CF] hover:bg-[#3a6bb5] text-white transition-colors shadow-sm">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Surgical History Panel ───────────────────────────────────────────────────

interface SurgicalHistoryPanelProps {
  rows: SurgicalEntry[];
  onChange: (rows: SurgicalEntry[]) => void;
}

export function SurgicalHistoryPanel({ rows, onChange }: SurgicalHistoryPanelProps) {
  const displayRows = rows.length === 0
    ? [{ id: `surg-${Date.now()}`, procedure: "", date: "", complications: "" }]
    : rows;

  function addRow() {
    const newEntry: SurgicalEntry = { id: `surg-${Date.now()}`, procedure: "", date: "", complications: "" };
    onChange([...(rows.length === 0 ? displayRows : rows), newEntry]);
  }
  function removeRow(id: string) {
    const next = rows.filter(r => r.id !== id);
    onChange(next);
  }
  function updateRow(id: string, field: keyof SurgicalEntry, val: string) {
    const base = rows.length === 0 ? displayRows : rows;
    onChange(base.map(r => r.id === id ? { ...r, [field]: val } : r));
  }

  return (
    <div className="space-y-2">
      {/* Header labels */}
      <div className="flex items-center gap-2 px-1">
        <p className="flex-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Procedure</p>
        <p className="w-36 flex-shrink-0 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</p>
        <p className="flex-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Complications</p>
        <div className="w-7 flex-shrink-0" />
        <div className="w-8 flex-shrink-0" />
      </div>
      {displayRows.map(row => (
        <SurgicalRow
          key={row.id}
          entry={row}
          onUpdate={updateRow}
          onRemove={removeRow}
          onAdd={addRow}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SOCIAL HISTORY ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const DAILY_INTAKE_OPTS = [
  "Occasional (social)", "1–5/day", "Half pack/day",
  "1 pack/day", "1.5 packs/day", "2 packs/day", "Heavy (3+ packs/day)",
];
const YEARS_OPTS = [
  "< 1 year", "1–2 years", "3–5 years",
  "5–10 years", "10–15 years", "15–20 years", "20+ years",
];
const QUIT_WHEN_OPTS = [
  "Currently using", "< 6 months ago", "6–12 months ago",
  "1–2 years ago", "3–5 years ago", "5–10 years ago", "10+ years ago",
];
const CAGE_OPTS = ["0 (No concern)", "1", "2", "3", "4 (Likely dependent)"];
const ALCOHOL_UNITS_OPTS = ["Units/week", "Standard drinks/day", "Standard drinks/week", "Glasses/week"];
const ALCOHOL_FREQ_OPTS = ["Daily", "5–6 days/week", "3–4 days/week", "1–2 days/week", "Weekends only", "Monthly", "Occasionally"];
const ORAL_TYPE_OPTS = ["Naswar", "Gutka", "Paan (betel leaf)", "Paan Masala", "Tobacco chewing", "Betel nut (plain)", "Mawa", "Khaini"];
const ORAL_OTHER_OPTS = ["With tobacco", "Without tobacco", "Plain betel leaf", "Flavoured", "Other"];
const ACTIVITY_OPTS = [
  "Sedentary (no exercise)", "Minimal (light walking)", "Light (1–2 days/week)",
  "Moderate (3–4 days/week)", "Active (5–6 days/week)", "Athlete (daily intense training)",
];
const SLEEP_OPTS = [
  "< 4 hours", "4–5 hours", "5–6 hours", "6–7 hours",
  "7–8 hours (recommended)", "8–9 hours", "9+ hours", "Irregular / Shift work",
];

// ─── Social History Types ─────────────────────────────────────────────────────

export interface SocialHistory {
  tobacco:  { active: boolean; intake: string; years: string; quitWhen: string };
  vaping:   { active: boolean; intake: string; years: string; quitWhen: string };
  alcohol:  { active: boolean; cage: string;   units: string; frequency: string };
  oral:     { active: boolean; type: string;   other: string };
  activity: string;
  sleep:    string;
}

export const EMPTY_SOCIAL_HISTORY: SocialHistory = {
  tobacco:  { active: false, intake: "", years: "", quitWhen: "" },
  vaping:   { active: false, intake: "", years: "", quitWhen: "" },
  alcohol:  { active: false, cage: "",   units: "", frequency: "" },
  oral:     { active: false, type: "",   other: "" },
  activity: "",
  sleep:    "",
};

// ─── Inline styled select ─────────────────────────────────────────────────────

function SSelect({
  value, onChange, placeholder, options, className = "",
}: {
  value: string; onChange: (v: string) => void;
  placeholder: string; options: string[]; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-8 pl-3 pr-7 text-xs border border-slate-200 rounded-xl bg-white appearance-none cursor-pointer focus:outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 transition-colors"
        style={{ color: value ? "#1e293b" : "#94a3b8" }}>
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ─── Radio No / Yes ───────────────────────────────────────────────────────────

function RadioYesNo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      {([false, true] as const).map(opt => (
        <label key={String(opt)} className="flex items-center gap-1.5 cursor-pointer select-none">
          <button
            type="button"
            onClick={() => onChange(opt)}
            className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
            style={{
              borderColor: value === opt ? "#4982CF" : "#cbd5e1",
              backgroundColor: value === opt ? "#4982CF" : "white",
            }}>
            {value === opt && <span className="block w-1.5 h-1.5 rounded-full bg-white" />}
          </button>
          <span className="text-xs text-slate-600">{opt ? "Yes" : "No"}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Social section row ───────────────────────────────────────────────────────

function SocialRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-1.5">{label}:</p>
      <div className="flex items-center gap-2 flex-wrap">
        {children}
      </div>
    </div>
  );
}

// ─── Social History Panel ─────────────────────────────────────────────────────

interface SocialHistoryPanelProps {
  value: SocialHistory;
  onChange: (v: SocialHistory) => void;
}

export function SocialHistoryPanel({ value, onChange }: SocialHistoryPanelProps) {
  function setTobacco(patch: Partial<SocialHistory["tobacco"]>) {
    onChange({ ...value, tobacco: { ...value.tobacco, ...patch } });
  }
  function setVaping(patch: Partial<SocialHistory["vaping"]>) {
    onChange({ ...value, vaping: { ...value.vaping, ...patch } });
  }
  function setAlcohol(patch: Partial<SocialHistory["alcohol"]>) {
    onChange({ ...value, alcohol: { ...value.alcohol, ...patch } });
  }
  function setOral(patch: Partial<SocialHistory["oral"]>) {
    onChange({ ...value, oral: { ...value.oral, ...patch } });
  }

  return (
    <div className="space-y-4">
      {/* Tobacco */}
      <SocialRow label="Tobacco Intake">
        <RadioYesNo value={value.tobacco.active} onChange={v => setTobacco({ active: v })} />
        {value.tobacco.active && (
          <>
            <SSelect
              value={value.tobacco.intake}
              onChange={v => setTobacco({ intake: v })}
              placeholder="Select Daily Intake"
              options={DAILY_INTAKE_OPTS}
              className="flex-1 min-w-[120px]"
            />
            <SSelect
              value={value.tobacco.years}
              onChange={v => setTobacco({ years: v })}
              placeholder="Select Years"
              options={YEARS_OPTS}
              className="w-32"
            />
            <SSelect
              value={value.tobacco.quitWhen}
              onChange={v => setTobacco({ quitWhen: v })}
              placeholder="Select Quit When"
              options={QUIT_WHEN_OPTS}
              className="w-36"
            />
          </>
        )}
      </SocialRow>

      {/* Vaping */}
      <SocialRow label="Vaping Intake">
        <RadioYesNo value={value.vaping.active} onChange={v => setVaping({ active: v })} />
        {value.vaping.active && (
          <>
            <SSelect
              value={value.vaping.intake}
              onChange={v => setVaping({ intake: v })}
              placeholder="Select Daily Intake"
              options={DAILY_INTAKE_OPTS}
              className="flex-1 min-w-[120px]"
            />
            <SSelect
              value={value.vaping.years}
              onChange={v => setVaping({ years: v })}
              placeholder="Select Years"
              options={YEARS_OPTS}
              className="w-32"
            />
            <SSelect
              value={value.vaping.quitWhen}
              onChange={v => setVaping({ quitWhen: v })}
              placeholder="Select Quit When"
              options={QUIT_WHEN_OPTS}
              className="w-36"
            />
          </>
        )}
      </SocialRow>

      {/* Alcohol */}
      <SocialRow label="Alcohol Use">
        <RadioYesNo value={value.alcohol.active} onChange={v => setAlcohol({ active: v })} />
        {value.alcohol.active && (
          <>
            <SSelect
              value={value.alcohol.cage}
              onChange={v => setAlcohol({ cage: v })}
              placeholder="Select Cage Score"
              options={CAGE_OPTS}
              className="flex-1 min-w-[120px]"
            />
            <SSelect
              value={value.alcohol.units}
              onChange={v => setAlcohol({ units: v })}
              placeholder="Select Units"
              options={ALCOHOL_UNITS_OPTS}
              className="w-40"
            />
            <SSelect
              value={value.alcohol.frequency}
              onChange={v => setAlcohol({ frequency: v })}
              placeholder="Frequency"
              options={ALCOHOL_FREQ_OPTS}
              className="w-32"
            />
          </>
        )}
      </SocialRow>

      {/* Oral Intake */}
      <SocialRow label="Oral Intake">
        <RadioYesNo value={value.oral.active} onChange={v => setOral({ active: v })} />
        {value.oral.active && (
          <>
            <SSelect
              value={value.oral.type}
              onChange={v => setOral({ type: v })}
              placeholder="Select Type"
              options={ORAL_TYPE_OPTS}
              className="flex-1 min-w-[120px]"
            />
            <SSelect
              value={value.oral.other}
              onChange={v => setOral({ other: v })}
              placeholder="Other Mention Here"
              options={ORAL_OTHER_OPTS}
              className="w-40"
            />
          </>
        )}
      </SocialRow>

      {/* Physical Activity */}
      <SocialRow label="Physical Activity">
        <SSelect
          value={value.activity}
          onChange={v => onChange({ ...value, activity: v })}
          placeholder="Select Physical Activity"
          options={ACTIVITY_OPTS}
          className="flex-1"
        />
      </SocialRow>

      {/* Sleep */}
      <SocialRow label="Sleep">
        <SSelect
          value={value.sleep}
          onChange={v => onChange({ ...value, sleep: v })}
          placeholder="Select Sleep"
          options={SLEEP_OPTS}
          className="flex-1"
        />
      </SocialRow>
    </div>
  );
}
