import { useState, useRef } from "react";
import {
  ChevronLeft, X, Search, Star, CheckCircle2,
  Tag, ClipboardCheck, Plus,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT_DX = "#6366f1";

export const ICD10_CATALOGUE_KEY = "ehr-icd10-catalogue-v1";

// ─── Admin catalogue types (shared with ClinicalLibrariesModule) ──────────────

interface AdminBundle { id: string; name: string; }
interface AdminCode   { id: string; code: string; description: string; bundleId: string; favourite: boolean; }
interface AdminCatalogue { codes: AdminCode[]; bundles: AdminBundle[]; }

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiagnosisEntry {
  code:          string;
  name:          string;
  specialty:     string;
  isProvisional: boolean;
  isFinal:       boolean;
}

interface IcdCode {
  code:      string;
  name:      string;
  specialty: string;
}

// ─── Specialty list ───────────────────────────────────────────────────────────

export const DX_SPECIALTIES = [
  "Favorites",
  "General / Primary Care",
  "Cardiology",
  "Endocrinology",
  "Respiratory",
  "Gastroenterology",
  "Neurology",
  "Musculoskeletal",
  "Mental Health",
  "Nephrology",
  "Infections",
  "Dermatology",
  "Hematology",
];

// ─── ICD-10 Code Database ─────────────────────────────────────────────────────

export const ICD_CODES: IcdCode[] = [
  // General / Primary Care
  { code: "J06.9",  name: "Acute upper respiratory infection, unspecified",          specialty: "General / Primary Care" },
  { code: "R05.9",  name: "Cough, unspecified",                                      specialty: "General / Primary Care" },
  { code: "R50.9",  name: "Fever, unspecified",                                      specialty: "General / Primary Care" },
  { code: "R51.9",  name: "Headache, unspecified",                                   specialty: "General / Primary Care" },
  { code: "R10.9",  name: "Unspecified abdominal pain",                              specialty: "General / Primary Care" },
  { code: "R00.0",  name: "Tachycardia, unspecified",                                specialty: "General / Primary Care" },
  { code: "Z00.00", name: "Encounter for general adult medical examination",          specialty: "General / Primary Care" },
  { code: "R53.83", name: "Fatigue",                                                  specialty: "General / Primary Care" },
  { code: "R06.00", name: "Dyspnea, unspecified",                                    specialty: "General / Primary Care" },
  { code: "J11.1",  name: "Influenza with other respiratory manifestations",         specialty: "General / Primary Care" },
  { code: "J18.9",  name: "Pneumonia, unspecified organism",                         specialty: "General / Primary Care" },
  { code: "B34.9",  name: "Viral infection, unspecified",                            specialty: "General / Primary Care" },
  { code: "N39.0",  name: "Urinary tract infection, site not specified",             specialty: "General / Primary Care" },

  // Cardiology
  { code: "I10",    name: "Essential (primary) hypertension",                        specialty: "Cardiology" },
  { code: "I20.9",  name: "Angina pectoris, unspecified",                            specialty: "Cardiology" },
  { code: "I21.9",  name: "Acute myocardial infarction, unspecified",                specialty: "Cardiology" },
  { code: "I25.10", name: "Atherosclerotic heart disease of native coronary artery", specialty: "Cardiology" },
  { code: "I48.91", name: "Atrial fibrillation, unspecified",                        specialty: "Cardiology" },
  { code: "I50.9",  name: "Heart failure, unspecified",                              specialty: "Cardiology" },
  { code: "I63.9",  name: "Cerebral infarction, unspecified",                        specialty: "Cardiology" },
  { code: "I83.90", name: "Varicose veins of unspecified lower extremity",           specialty: "Cardiology" },
  { code: "I73.9",  name: "Peripheral vascular disease, unspecified",                specialty: "Cardiology" },
  { code: "I27.0",  name: "Primary pulmonary hypertension",                          specialty: "Cardiology" },

  // Endocrinology
  { code: "E11.9",  name: "Type 2 diabetes mellitus without complications",          specialty: "Endocrinology" },
  { code: "E10.9",  name: "Type 1 diabetes mellitus without complications",          specialty: "Endocrinology" },
  { code: "E11.65", name: "Type 2 diabetes mellitus with hyperglycemia",             specialty: "Endocrinology" },
  { code: "E11.40", name: "Type 2 DM with diabetic neuropathy, unspecified",        specialty: "Endocrinology" },
  { code: "E78.5",  name: "Hyperlipidemia, unspecified",                             specialty: "Endocrinology" },
  { code: "E03.9",  name: "Hypothyroidism, unspecified",                             specialty: "Endocrinology" },
  { code: "E05.90", name: "Thyrotoxicosis, unspecified, without thyrotoxic crisis",  specialty: "Endocrinology" },
  { code: "E66.9",  name: "Obesity, unspecified",                                    specialty: "Endocrinology" },
  { code: "E27.49", name: "Other adrenocortical insufficiency",                      specialty: "Endocrinology" },
  { code: "E23.0",  name: "Hypopituitarism",                                         specialty: "Endocrinology" },

  // Respiratory
  { code: "J45.909",name: "Unspecified asthma, uncomplicated",                      specialty: "Respiratory" },
  { code: "J45.901",name: "Unspecified asthma with acute exacerbation",             specialty: "Respiratory" },
  { code: "J44.1",  name: "COPD with acute exacerbation",                           specialty: "Respiratory" },
  { code: "J44.0",  name: "COPD with acute lower respiratory infection",            specialty: "Respiratory" },
  { code: "J44.9",  name: "Chronic obstructive pulmonary disease, unspecified",     specialty: "Respiratory" },
  { code: "J47.9",  name: "Bronchiectasis, uncomplicated",                          specialty: "Respiratory" },
  { code: "J93.9",  name: "Pneumothorax, unspecified",                              specialty: "Respiratory" },
  { code: "J98.01", name: "Acute bronchospasm",                                      specialty: "Respiratory" },
  { code: "J30.9",  name: "Allergic rhinitis, unspecified",                         specialty: "Respiratory" },
  { code: "J33.9",  name: "Nasal polyp, unspecified",                               specialty: "Respiratory" },

  // Gastroenterology
  { code: "K21.0",  name: "Gastroesophageal reflux disease with esophagitis",       specialty: "Gastroenterology" },
  { code: "K21.9",  name: "Gastroesophageal reflux disease without esophagitis",    specialty: "Gastroenterology" },
  { code: "K29.70", name: "Gastritis, unspecified, without bleeding",               specialty: "Gastroenterology" },
  { code: "K57.30", name: "Diverticulosis of large intestine without perforation",  specialty: "Gastroenterology" },
  { code: "K80.20", name: "Calculus of gallbladder without cholecystitis",          specialty: "Gastroenterology" },
  { code: "K85.9",  name: "Acute pancreatitis, unspecified",                        specialty: "Gastroenterology" },
  { code: "K51.90", name: "Ulcerative colitis, unspecified, without complications", specialty: "Gastroenterology" },
  { code: "K50.90", name: "Crohn's disease of small intestine, unspecified",        specialty: "Gastroenterology" },
  { code: "K92.1",  name: "Melena",                                                  specialty: "Gastroenterology" },
  { code: "K74.60", name: "Unspecified cirrhosis of liver",                         specialty: "Gastroenterology" },

  // Neurology
  { code: "G43.909",name: "Migraine, unspecified, not intractable",                 specialty: "Neurology" },
  { code: "G35",    name: "Multiple sclerosis",                                      specialty: "Neurology" },
  { code: "G20",    name: "Parkinson's disease",                                     specialty: "Neurology" },
  { code: "G40.909",name: "Epilepsy, unspecified, not intractable",                 specialty: "Neurology" },
  { code: "G89.29", name: "Other chronic pain",                                      specialty: "Neurology" },
  { code: "G62.9",  name: "Polyneuropathy, unspecified",                             specialty: "Neurology" },
  { code: "G45.9",  name: "Transient cerebral ischaemic attack, unspecified",       specialty: "Neurology" },
  { code: "G47.00", name: "Insomnia, unspecified",                                   specialty: "Neurology" },
  { code: "G25.0",  name: "Essential tremor",                                        specialty: "Neurology" },

  // Musculoskeletal
  { code: "M54.5",  name: "Low back pain",                                           specialty: "Musculoskeletal" },
  { code: "M54.2",  name: "Cervicalgia (neck pain)",                                 specialty: "Musculoskeletal" },
  { code: "M17.11", name: "Primary osteoarthritis, right knee",                     specialty: "Musculoskeletal" },
  { code: "M17.12", name: "Primary osteoarthritis, left knee",                      specialty: "Musculoskeletal" },
  { code: "M05.79", name: "Rheumatoid arthritis with rheumatoid factor, unspec.",   specialty: "Musculoskeletal" },
  { code: "M10.9",  name: "Gout, unspecified",                                       specialty: "Musculoskeletal" },
  { code: "M79.3",  name: "Panniculitis, unspecified",                               specialty: "Musculoskeletal" },
  { code: "M25.561",name: "Pain in right knee",                                      specialty: "Musculoskeletal" },
  { code: "M06.9",  name: "Rheumatoid arthritis, unspecified",                      specialty: "Musculoskeletal" },

  // Mental Health
  { code: "F32.9",  name: "Major depressive disorder, single episode, unspec.",     specialty: "Mental Health" },
  { code: "F33.9",  name: "Major depressive disorder, recurrent, unspecified",      specialty: "Mental Health" },
  { code: "F41.1",  name: "Generalized anxiety disorder",                           specialty: "Mental Health" },
  { code: "F41.9",  name: "Anxiety disorder, unspecified",                          specialty: "Mental Health" },
  { code: "F20.9",  name: "Schizophrenia, unspecified",                             specialty: "Mental Health" },
  { code: "F31.9",  name: "Bipolar disorder, unspecified",                          specialty: "Mental Health" },
  { code: "F43.10", name: "Post-traumatic stress disorder, unspecified",            specialty: "Mental Health" },
  { code: "F90.9",  name: "Attention-deficit hyperactivity disorder, unspecified",  specialty: "Mental Health" },
  { code: "F50.00", name: "Anorexia nervosa, unspecified",                          specialty: "Mental Health" },

  // Nephrology
  { code: "N18.9",  name: "Chronic kidney disease, unspecified",                    specialty: "Nephrology" },
  { code: "N18.3",  name: "Chronic kidney disease, stage 3 (moderate)",            specialty: "Nephrology" },
  { code: "N18.4",  name: "Chronic kidney disease, stage 4 (severe)",              specialty: "Nephrology" },
  { code: "N17.9",  name: "Acute kidney failure, unspecified",                      specialty: "Nephrology" },
  { code: "N04.9",  name: "Nephrotic syndrome with unspecified morphologic changes",specialty: "Nephrology" },
  { code: "N20.0",  name: "Calculus of kidney (nephrolithiasis)",                  specialty: "Nephrology" },

  // Infections
  { code: "A09",    name: "Infectious gastroenteritis and colitis, unspecified",    specialty: "Infections" },
  { code: "A41.9",  name: "Sepsis, unspecified organism",                           specialty: "Infections" },
  { code: "A41.51", name: "Sepsis due to Escherichia coli [E. coli]",               specialty: "Infections" },
  { code: "B02.9",  name: "Zoster without complications (Shingles)",                specialty: "Infections" },
  { code: "B37.0",  name: "Candidal stomatitis (oral thrush)",                      specialty: "Infections" },
  { code: "A49.9",  name: "Bacterial infection, unspecified",                       specialty: "Infections" },
  { code: "J02.0",  name: "Streptococcal pharyngitis",                              specialty: "Infections" },
  { code: "A01.00", name: "Typhoid fever, unspecified",                             specialty: "Infections" },

  // Dermatology
  { code: "L30.9",  name: "Dermatitis, unspecified",                                specialty: "Dermatology" },
  { code: "L20.9",  name: "Atopic dermatitis, unspecified",                         specialty: "Dermatology" },
  { code: "L40.9",  name: "Psoriasis, unspecified",                                 specialty: "Dermatology" },
  { code: "L60.0",  name: "Ingrowing nail",                                          specialty: "Dermatology" },
  { code: "L03.90", name: "Cellulitis, unspecified",                                 specialty: "Dermatology" },
  { code: "L50.9",  name: "Urticaria, unspecified",                                  specialty: "Dermatology" },
  { code: "B35.9",  name: "Dermatophytosis, unspecified",                            specialty: "Dermatology" },

  // Hematology
  { code: "D64.9",  name: "Anaemia, unspecified",                                   specialty: "Hematology" },
  { code: "D50.9",  name: "Iron deficiency anaemia, unspecified",                   specialty: "Hematology" },
  { code: "D51.0",  name: "Vitamin B12 deficiency anaemia",                         specialty: "Hematology" },
  { code: "D69.6",  name: "Thrombocytopenia, unspecified",                          specialty: "Hematology" },
  { code: "D47.9",  name: "Neoplasm of uncertain behaviour of lymphoid tissue",     specialty: "Hematology" },
  { code: "C91.00", name: "Acute lymphoblastic leukaemia",                          specialty: "Hematology" },
];

// ─── Doctor Favorites ─────────────────────────────────────────────────────────

export const DX_FAVORITES = [
  "I10", "E11.9", "J06.9", "K21.9", "E78.5",
  "R05.9", "J45.909", "M54.5", "N39.0", "F41.1",
  "J18.9", "E03.9", "I25.10", "F32.9", "G43.909",
];

// ─── Diagnosis Chips Panel ────────────────────────────────────────────────────

export function DiagnosisChipsPanel({
  diagnoses,
  onOpen,
}: {
  diagnoses: DiagnosisEntry[];
  onOpen: () => void;
}) {
  if (diagnoses.length === 0) {
    return (
      <button
        onClick={onOpen}
        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl bg-indigo-50/60 border-2 border-dashed border-indigo-200 text-indigo-500 font-bold text-xs hover:border-indigo-400 hover:bg-indigo-50 transition-all">
        <Plus className="h-4 w-4 flex-shrink-0" />
        Search and add ICD-10 diagnosis codes…
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {diagnoses.map(dx => (
        <div
          key={dx.code}
          className="flex items-start gap-3 px-3.5 py-3 rounded-xl border border-indigo-100 bg-indigo-50/30"
          style={{ borderLeftWidth: 3, borderLeftColor: ACCENT_DX }}>
          {/* Code badge */}
          <div
            className="flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-black tracking-wider text-white"
            style={{ backgroundColor: ACCENT_DX }}>
            {dx.code}
          </div>
          {/* Name + tags */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 leading-snug">{dx.name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{dx.specialty}</p>
            <div className="flex gap-1.5 mt-1.5">
              {dx.isProvisional && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  Provisional
                </span>
              )}
              {dx.isFinal && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Final
                </span>
              )}
              {!dx.isProvisional && !dx.isFinal && (
                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                  Unclassified
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Edit button */}
      <button
        onClick={onOpen}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 text-indigo-500 text-xs font-bold hover:bg-indigo-50 transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Edit diagnoses ({diagnoses.length})
      </button>
    </div>
  );
}

// ─── Diagnosis Drawer ─────────────────────────────────────────────────────────

interface DiagnosisDrawerProps {
  isDone:    boolean;
  savedData: DiagnosisEntry[];
  onSave:    (entries: DiagnosisEntry[]) => void;
  onClose:   () => void;
}

export function DiagnosisDrawer({ isDone, savedData, onSave, onClose }: DiagnosisDrawerProps) {
  // ── Load admin-managed catalogue from localStorage (fallback to built-ins) ──
  const [{ effectiveCodes, favSet, specTabs }] = useState(() => {
    try {
      const raw = localStorage.getItem(ICD10_CATALOGUE_KEY);
      if (raw) {
        const cat = JSON.parse(raw) as AdminCatalogue;
        const bundleMap = new Map(cat.bundles.map(b => [b.id, b.name]));
        return {
          effectiveCodes: cat.codes.map(c => ({
            code:      c.code,
            name:      c.description,
            specialty: bundleMap.get(c.bundleId) ?? "General / Primary Care",
          })),
          favSet:   new Set(cat.codes.filter(c => c.favourite).map(c => c.code)),
          specTabs: ["Favorites", ...cat.bundles.map(b => b.name)],
        };
      }
    } catch { /* fall through */ }
    return {
      effectiveCodes: ICD_CODES,
      favSet:         new Set(DX_FAVORITES),
      specTabs:       DX_SPECIALTIES,
    };
  });

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("Favorites");
  const [search,            setSearch]            = useState("");
  const [selections,        setSelections]        = useState<DiagnosisEntry[]>(savedData);
  const tabsRef = useRef<HTMLDivElement>(null);

  const isDirty = isDone && JSON.stringify(selections) !== JSON.stringify(savedData);

  // ── Filtered ICD list ──────────────────────────────────────────────────────

  function getFilteredCodes(): IcdCode[] {
    const q = search.toLowerCase();

    if (selectedSpecialty === "Favorites") {
      const favCodes = effectiveCodes.filter(c => favSet.has(c.code));
      return q
        ? favCodes.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
        : favCodes;
    }

    const bySpec = effectiveCodes.filter(c => c.specialty === selectedSpecialty);
    return q
      ? bySpec.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      : bySpec;
  }

  // If searching, search across all specialties
  function getAllFiltered(): IcdCode[] {
    const q = search.toLowerCase();
    if (!q) return getFilteredCodes();
    return effectiveCodes.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }

  const displayCodes = search.trim() ? getAllFiltered() : getFilteredCodes();
  const isSearching  = search.trim().length > 0;

  // ── Selection helpers ──────────────────────────────────────────────────────

  function isSelected(code: string) { return selections.some(s => s.code === code); }

  function toggleIcd(icd: IcdCode) {
    if (isSelected(icd.code)) {
      setSelections(prev => prev.filter(s => s.code !== icd.code));
    } else {
      setSelections(prev => [...prev, {
        code:          icd.code,
        name:          icd.name,
        specialty:     icd.specialty,
        isProvisional: false,
        isFinal:       false,
      }]);
    }
  }

  function toggleFlag(code: string, flag: "isProvisional" | "isFinal") {
    setSelections(prev => prev.map(s => s.code === code ? { ...s, [flag]: !s[flag] } : s));
  }

  function removeSelection(code: string) {
    setSelections(prev => prev.filter(s => s.code !== code));
  }

  function handleSave() { onSave(selections); }

  const isFavorite = (code: string) => favSet.has(code);

  return (
    <div className="absolute inset-y-0 right-0 w-[68%] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-20">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Assessment &amp; Plan</p>
          <p className="text-sm font-black text-slate-800">Diagnosis — ICD-10 Selection</p>
        </div>

        {/* Done / Update / Mark Done */}
        {isDone && !isDirty ? (
          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        ) : isDirty ? (
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg text-white flex-shrink-0"
            style={{ backgroundColor: "#f59e0b" }}>
            <ClipboardCheck className="h-3.5 w-3.5" /> Update
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg text-white flex-shrink-0"
            style={{ backgroundColor: ACCENT_DX }}>
            <ClipboardCheck className="h-3.5 w-3.5" /> Mark Done
          </button>
        )}

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Search ── */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by diagnosis name or ICD code…"
            className="flex-1 text-xs text-slate-700 placeholder-slate-300 bg-transparent outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Specialty Tabs ── */}
      {!isSearching && (
        <div
          ref={tabsRef}
          className="flex gap-1 px-4 pb-2 overflow-x-auto flex-shrink-0 scrollbar-none"
          style={{ scrollbarWidth: "none" }}>
          {specTabs.map(spec => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={[
                "flex items-center gap-1.5 flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all",
                selectedSpecialty === spec
                  ? "text-white border-transparent"
                  : "text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600",
              ].join(" ")}
              style={selectedSpecialty === spec ? { backgroundColor: ACCENT_DX } : {}}>
              {spec === "Favorites" && <Star className="h-2.5 w-2.5" />}
              {spec}
            </button>
          ))}
        </div>
      )}

      {/* Search mode label */}
      {isSearching && (
        <div className="px-4 pb-1.5 flex-shrink-0">
          <p className="text-[10px] text-slate-400 font-medium">
            Searching all specialties for &ldquo;{search}&rdquo;
          </p>
        </div>
      )}

      {/* ── ICD Code List ── */}
      <div className="flex-1 overflow-y-auto border-t border-slate-100 min-h-0">
        {displayCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Search className="h-7 w-7 mb-2 opacity-30" />
            <p className="text-xs font-bold">No codes found</p>
            <p className="text-[10px] mt-1">Try a different search term</p>
          </div>
        ) : (
          displayCodes.map(icd => {
            const selected = isSelected(icd.code);
            const fav      = isFavorite(icd.code);
            return (
              <button
                key={icd.code}
                onClick={() => toggleIcd(icd)}
                className={[
                  "w-full text-left px-4 py-3 flex items-center gap-3 border-b border-slate-50 transition-colors last:border-0",
                  selected ? "bg-indigo-50" : "hover:bg-slate-50",
                ].join(" ")}>
                {/* Checkbox */}
                <div className={[
                  "h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  selected ? "border-indigo-500 bg-indigo-500" : "border-slate-300",
                ].join(" ")}>
                  {selected && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                {/* Code badge */}
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    backgroundColor: selected ? `${ACCENT_DX}18` : "#f1f5f9",
                    color:           selected ? ACCENT_DX        : "#64748b",
                  }}>
                  {icd.code}
                </span>
                {/* Name */}
                <span className={[
                  "text-xs flex-1 text-left leading-snug",
                  selected ? "font-bold text-indigo-800" : "text-slate-700",
                ].join(" ")}>
                  {icd.name}
                </span>
                {/* Specialty tag (shown when searching) */}
                {isSearching && (
                  <span className="text-[9px] text-slate-400 font-medium flex-shrink-0">{icd.specialty}</span>
                )}
                {/* Favorite star */}
                {fav && !isSearching && (
                  <Star className="h-3 w-3 text-amber-400 fill-amber-300 flex-shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* ── Selected Diagnoses Panel ── */}
      {selections.length > 0 && (
        <div className="flex-shrink-0 border-t-2 border-indigo-100 bg-indigo-50/40 max-h-60 overflow-y-auto">
          <div className="px-4 py-2.5 flex items-center justify-between sticky top-0 bg-indigo-50/90 backdrop-blur-sm border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-indigo-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                Selected Diagnoses ({selections.length})
              </p>
            </div>
            <p className="text-[9px] text-slate-400">Toggle Provisional / Final per diagnosis</p>
          </div>

          <div className="px-4 py-3 space-y-2">
            {selections.map(dx => (
              <div
                key={dx.code}
                className="flex items-start gap-2 py-2 px-3 rounded-xl bg-white border border-indigo-100 shadow-sm">
                {/* Code badge */}
                <span
                  className="flex-shrink-0 mt-0.5 text-[9px] font-black px-1.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: ACCENT_DX }}>
                  {dx.code}
                </span>
                {/* Name */}
                <p className="flex-1 text-[11px] font-bold text-slate-700 leading-snug">{dx.name}</p>

                {/* Provisional / Final checkboxes */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <label className="flex items-center gap-1 cursor-pointer select-none group">
                    <div
                      onClick={() => toggleFlag(dx.code, "isProvisional")}
                      className={[
                        "h-4 w-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
                        dx.isProvisional
                          ? "bg-amber-500 border-amber-500"
                          : "border-slate-300 group-hover:border-amber-400",
                      ].join(" ")}>
                      {dx.isProvisional && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <span
                      onClick={() => toggleFlag(dx.code, "isProvisional")}
                      className={[
                        "text-[9px] font-black cursor-pointer",
                        dx.isProvisional ? "text-amber-700" : "text-slate-400",
                      ].join(" ")}>
                      Provisional
                    </span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer select-none group">
                    <div
                      onClick={() => toggleFlag(dx.code, "isFinal")}
                      className={[
                        "h-4 w-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
                        dx.isFinal
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-slate-300 group-hover:border-emerald-400",
                      ].join(" ")}>
                      {dx.isFinal && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <span
                      onClick={() => toggleFlag(dx.code, "isFinal")}
                      className={[
                        "text-[9px] font-black cursor-pointer",
                        dx.isFinal ? "text-emerald-700" : "text-slate-400",
                      ].join(" ")}>
                      Final
                    </span>
                  </label>

                  <button
                    onClick={() => removeSelection(dx.code)}
                    className="p-0.5 text-slate-300 hover:text-red-400 transition-colors ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
