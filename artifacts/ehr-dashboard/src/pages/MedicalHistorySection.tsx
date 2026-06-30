import { useState, useRef, useEffect, useMemo } from "react";
import { X, Plus, Search, ChevronDown, Check } from "lucide-react";
import { loadSocConfig } from "@/pages/ClinicalLibrariesModule";
import type { SocQuestion, SocFollowUp } from "@/pages/ClinicalLibrariesModule";

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

function useAdminFamilyConditions(): string[] {
  return useMemo(() => {
    try {
      const raw = localStorage.getItem("ehr-family-conditions-v1");
      if (raw) {
        const parsed = JSON.parse(raw) as { name: string }[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(c => c.name);
      }
    } catch { /**/ }
    return ALL_CONDITIONS;
  }, []);
}

function useAdminFamilyRelationMap(): Record<string, string[]> {
  return useMemo(() => {
    try {
      const raw = localStorage.getItem("ehr-family-conditions-v1");
      if (raw) {
        const parsed = JSON.parse(raw) as { name: string; relationships: string }[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map: Record<string, string[]> = {};
          for (const c of parsed) {
            if (c.relationships?.trim()) {
              map[c.name] = c.relationships.split(",").map(r => r.trim()).filter(Boolean);
            }
          }
          return map;
        }
      }
    } catch { /**/ }
    return {};
  }, []);
}

function useAdminGeneticDiseases(): string[] {
  return useMemo(() => {
    try {
      const raw = localStorage.getItem("ehr-genetic-diseases-v1");
      if (raw) {
        const parsed = JSON.parse(raw) as { name: string }[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(g => g.name);
      }
    } catch { /**/ }
    return GENETIC_DISEASES;
  }, []);
}

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
  row, onUpdate, onRemove, conditions, relationMap,
}: {
  row: FamilyRow;
  onUpdate: (id: string, field: "condition" | "relation", val: string) => void;
  onRemove: (id: string) => void;
  conditions: string[];
  relationMap: Record<string, string[]>;
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

  const filteredConds = conditions.filter(c =>
    c.toLowerCase().includes(condSearch.toLowerCase()),
  );
  const canCustom =
    condSearch.trim() !== "" &&
    !conditions.some(c => c.toLowerCase() === condSearch.trim().toLowerCase());

  const activeRelations: string[] =
    row.condition && relationMap[row.condition]?.length
      ? relationMap[row.condition]
      : FAMILY_RELATIONS;

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
              {activeRelations.map(r => (
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

function useAdminComorbidities(): string[] {
  return useMemo(() => {
    try {
      const raw = localStorage.getItem("ehr-comorbidities-v1");
      if (raw) {
        const parsed = JSON.parse(raw) as { name: string }[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(c => c.name);
        }
      }
    } catch { /**/ }
    return CHRONIC_CONDITIONS;
  }, []);
}

export function PastHistoryPanel({
  active, resolved, onActiveChange, onResolvedChange,
}: PastHistoryPanelProps) {
  const chronicOptions = useAdminComorbidities();
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
          Active Chronic Conditions
        </p>
        <ChipSelector
          options={chronicOptions}
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
          options={chronicOptions}
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
  const adminConditions    = useAdminFamilyConditions();
  const adminRelationMap   = useAdminFamilyRelationMap();
  const adminGeneticList   = useAdminGeneticDiseases();

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
            <FamilyRowEntry key={row.id} row={row} onUpdate={updateRow} onRemove={removeRow} conditions={adminConditions} relationMap={adminRelationMap} />
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
          options={adminGeneticList}
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

function useAdminSurgicalProcedures(): string[] {
  return useMemo(() => {
    try {
      const raw = localStorage.getItem("ehr-surgical-procedures-v1");
      if (raw) {
        const parsed = JSON.parse(raw) as { name: string }[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(p => p.name);
      }
    } catch { /**/ }
    return SURGERY_PROCEDURES;
  }, []);
}

function useAdminSurgicalComplications(): string[] {
  return useMemo(() => {
    try {
      const raw = localStorage.getItem("ehr-surgical-complications-v1");
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /**/ }
    return SURGERY_COMPLICATIONS;
  }, []);
}

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
  entry, onUpdate, onRemove, procedures, complications,
}: {
  entry: SurgicalEntry;
  onUpdate: (id: string, field: keyof SurgicalEntry, val: string) => void;
  onRemove: (id: string) => void;
  procedures: string[];
  complications: string[];
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

  const filteredProcs = procedures.filter(p =>
    p.toLowerCase().includes(procSearch.toLowerCase()),
  );
  const canCustomProc =
    procSearch.trim() !== "" &&
    !procedures.some(p => p.toLowerCase() === procSearch.trim().toLowerCase());

  const filteredComps = complications.filter(c =>
    c.toLowerCase().includes(compSearch.toLowerCase()),
  );
  const canCustomComp =
    compSearch.trim() !== "" &&
    !complications.some(c => c.toLowerCase() === compSearch.trim().toLowerCase());

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

      {/* Remove */}
      <button
        onClick={() => onRemove(entry.id)}
        className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-xl border border-transparent hover:border-red-100 hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
        <X className="h-3.5 w-3.5" />
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
  const adminProcedures    = useAdminSurgicalProcedures();
  const adminComplications = useAdminSurgicalComplications();

  function addRow() {
    onChange([...rows, { id: `surg-${Date.now()}`, procedure: "", date: "", complications: "" }]);
  }
  function removeRow(id: string) {
    onChange(rows.filter(r => r.id !== id));
  }
  function updateRow(id: string, field: keyof SurgicalEntry, val: string) {
    onChange(rows.map(r => r.id === id ? { ...r, [field]: val } : r));
  }

  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="flex items-center gap-2 px-1">
            <p className="flex-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Procedure</p>
            <p className="w-36 flex-shrink-0 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</p>
            <p className="flex-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Complications</p>
            <div className="w-8 flex-shrink-0" />
          </div>
          {rows.map(row => (
            <SurgicalRow key={row.id} entry={row} onUpdate={updateRow} onRemove={removeRow} procedures={adminProcedures} complications={adminComplications} />
          ))}
        </div>
      )}

      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#4982CF] hover:text-blue-700 transition-colors px-2 py-1.5 rounded-lg hover:bg-blue-50">
        <Plus className="h-3.5 w-3.5" /> Add Surgical History
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SOCIAL HISTORY ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export type SocAnswers = Record<string, { main: string | string[]; followUps: Record<string, string | string[]> }>;
export type SocialHistory = SocAnswers;
export const EMPTY_SOCIAL_HISTORY: SocAnswers = {};
export const EMPTY_SOC_ANSWERS = EMPTY_SOCIAL_HISTORY;

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

// ─── Social History Panel ─────────────────────────────────────────────────────

export function SocialHistoryPanel({ value, onChange }: { value: SocAnswers; onChange: (v: SocAnswers) => void }) {
  const questions = useMemo(() => loadSocConfig().filter(q => q.active), []);

  function getAns(qId: string) {
    return value[qId] ?? { main: "", followUps: {} };
  }
  function setMain(qId: string, val: string | string[]) {
    const prev = getAns(qId);
    onChange({ ...value, [qId]: { ...prev, main: val } });
  }
  function setFollowUp(qId: string, fuId: string, val: string | string[]) {
    const prev = getAns(qId);
    onChange({ ...value, [qId]: { ...prev, followUps: { ...prev.followUps, [fuId]: val } } });
  }

  if (questions.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic">
        No social history questions configured. Add them in Admin → Soap Note → Social History.
      </p>
    );
  }

  const rowCls   = "flex items-start gap-3";
  const labelCls = "w-[140px] flex-shrink-0 text-[11px] font-semibold text-slate-500 pt-1.5";

  function renderFollowUpWidget(q: SocQuestion, fu: SocFollowUp) {
    const raw    = getAns(q.id).followUps[fu.id] ?? "";
    const strVal = Array.isArray(raw) ? "" : (raw as string);
    const arrVal = Array.isArray(raw) ? (raw as string[]) : [];
    if (fu.type === "Text Input")
      return <input value={strVal} onChange={e => setFollowUp(q.id, fu.id, e.target.value)} placeholder={fu.placeholder || "Type…"} className="flex-1 h-8 text-xs border border-slate-200 rounded-xl bg-white px-3 focus:outline-none focus:border-[#4982CF]/50 transition-colors" />;
    if (fu.type === "Number Input")
      return <input type="number" value={strVal} onChange={e => setFollowUp(q.id, fu.id, e.target.value)} placeholder={fu.placeholder || "0"} className="w-24 h-8 text-xs border border-slate-200 rounded-xl bg-white px-3 focus:outline-none focus:border-[#4982CF]/50 transition-colors" />;
    if (fu.type === "Single Dropdown")
      return <SSelect value={strVal} onChange={v => setFollowUp(q.id, fu.id, v)} placeholder={fu.placeholder || "Select…"} options={fu.options.map(o => o.value)} className="flex-1" />;
    if (fu.type === "Multi Dropdown")
      return (
        <div className="flex flex-wrap gap-1.5">
          {fu.options.map(o => {
            const on = arrVal.includes(o.value);
            return (
              <button key={o.id} type="button"
                onClick={() => setFollowUp(q.id, fu.id, on ? arrVal.filter(x => x !== o.value) : [...arrVal, o.value])}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${on ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
                style={on ? { background: "#4982CF" } : {}}>
                {o.value}
              </button>
            );
          })}
        </div>
      );
    return null;
  }

  function renderMainWidget(q: SocQuestion) {
    const raw    = getAns(q.id).main;
    const strVal = Array.isArray(raw) ? "" : (raw as string);
    const arrVal = Array.isArray(raw) ? (raw as string[]) : [];
    if (q.displayType === "Yes/No Radio")
      return <RadioYesNo value={strVal === "Yes"} onChange={v => setMain(q.id, v ? "Yes" : "No")} />;
    if (q.displayType === "Text Input")
      return <input value={strVal} onChange={e => setMain(q.id, e.target.value)} placeholder={q.placeholder || "Type…"} className="flex-1 h-8 text-xs border border-slate-200 rounded-xl bg-white px-3 focus:outline-none focus:border-[#4982CF]/50 transition-colors" />;
    if (q.displayType === "Number Input")
      return <input type="number" value={strVal} onChange={e => setMain(q.id, e.target.value)} placeholder={q.placeholder || "0"} className="w-24 h-8 text-xs border border-slate-200 rounded-xl bg-white px-3 focus:outline-none focus:border-[#4982CF]/50 transition-colors" />;
    if (q.displayType === "Single Dropdown")
      return <SSelect value={strVal} onChange={v => setMain(q.id, v)} placeholder={q.placeholder || "Select…"} options={q.options.map(o => o.value)} className="flex-1" />;
    if (q.displayType === "Multi Dropdown")
      return (
        <div className="flex flex-wrap gap-1.5">
          {q.options.map(o => {
            const on = arrVal.includes(o.value);
            return (
              <button key={o.id} type="button"
                onClick={() => setMain(q.id, on ? arrVal.filter(x => x !== o.value) : [...arrVal, o.value])}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${on ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
                style={on ? { background: "#4982CF" } : {}}>
                {o.value}
              </button>
            );
          })}
        </div>
      );
    return null;
  }

  return (
    <div className="space-y-2">
      {questions.map(q => {
        const raw     = getAns(q.id).main;
        const showFu  = q.displayType === "Yes/No Radio" && raw === "Yes" && q.followUps.length > 0;
        return (
          <div key={q.id}>
            <div className={rowCls}>
              <span className={labelCls}>{q.name}</span>
              <div className="flex-1">{renderMainWidget(q)}</div>
            </div>
            {showFu && (
              <div className="mt-1.5 ml-[152px] space-y-1.5 pl-3 border-l-2 border-slate-100">
                {q.followUps.map(fu => (
                  <div key={fu.id} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 w-28 flex-shrink-0">{fu.label}</span>
                    {renderFollowUpWidget(q, fu)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
