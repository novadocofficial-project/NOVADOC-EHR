import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, X, Search, CheckCircle2, ClipboardCheck,
  Plus, AlertTriangle, Pill, Pencil, ChevronDown, ChevronUp, Star, BookOpen,
} from "lucide-react";
import { loadEnabledBundles } from "@/pages/formularyBundleUtils";
import type { FormularyBundle } from "@/pages/formularyBundleUtils";
import type { AllergyEntry } from "@/pages/AllergySelector";

// ─── Medicine Database (Generic → Brands + Strengths) ─────────────────────────

export interface BrandOption {
  id:       string;
  brand:    string;
  strength: string;
}

export interface MedicineDef {
  id:              string;
  generic:         string;
  category:        string;
  allergyKeywords: string[];
  brands:          BrandOption[];
}

export const MEDICINES: MedicineDef[] = [
  // Analgesics & Antipyretics
  { id: "paracetamol", generic: "Paracetamol", category: "Analgesics & Antipyretics", allergyKeywords: ["Paracetamol", "Acetaminophen"], brands: [
    { id: "panadol-500",  brand: "Panadol",  strength: "500mg"             },
    { id: "panadol-250",  brand: "Panadol",  strength: "250mg"             },
    { id: "tylenol-500",  brand: "Tylenol",  strength: "500mg"             },
    { id: "calpol-120",   brand: "Calpol",   strength: "120mg/5ml (Syrup)" },
  ]},
  { id: "tramadol", generic: "Tramadol", category: "Analgesics & Antipyretics", allergyKeywords: ["Tramadol"], brands: [
    { id: "tramal-50",    brand: "Tramal",   strength: "50mg"  },
    { id: "tramal-100",   brand: "Tramal",   strength: "100mg" },
    { id: "ultram-50",    brand: "Ultram",   strength: "50mg"  },
  ]},
  // NSAIDs
  { id: "ibuprofen", generic: "Ibuprofen", category: "NSAIDs", allergyKeywords: ["Ibuprofen", "Aspirin"], brands: [
    { id: "brufen-200",   brand: "Brufen",   strength: "200mg" },
    { id: "brufen-400",   brand: "Brufen",   strength: "400mg" },
    { id: "advil-200",    brand: "Advil",    strength: "200mg" },
    { id: "nurofen-400",  brand: "Nurofen",  strength: "400mg" },
  ]},
  { id: "diclofenac", generic: "Diclofenac", category: "NSAIDs", allergyKeywords: ["Diclofenac", "Aspirin"], brands: [
    { id: "voltaren-25",  brand: "Voltaren", strength: "25mg" },
    { id: "voltaren-50",  brand: "Voltaren", strength: "50mg" },
    { id: "cataflam-50",  brand: "Cataflam", strength: "50mg" },
  ]},
  { id: "aspirin", generic: "Aspirin (ASA)", category: "NSAIDs", allergyKeywords: ["Aspirin"], brands: [
    { id: "disprin-300",  brand: "Disprin",  strength: "300mg"      },
    { id: "ecotrin-75",   brand: "Ecotrin",  strength: "75mg (EC)"  },
    { id: "ecotrin-325",  brand: "Ecotrin",  strength: "325mg (EC)" },
  ]},
  // Antibiotics
  { id: "amoxicillin", generic: "Amoxicillin", category: "Antibiotics", allergyKeywords: ["Penicillin", "Amoxicillin"], brands: [
    { id: "amoxil-250",   brand: "Amoxil",   strength: "250mg" },
    { id: "amoxil-500",   brand: "Amoxil",   strength: "500mg" },
    { id: "trimox-500",   brand: "Trimox",   strength: "500mg" },
  ]},
  { id: "augmentin", generic: "Amoxicillin + Clavulanate", category: "Antibiotics", allergyKeywords: ["Penicillin", "Amoxicillin"], brands: [
    { id: "augmentin-375",   brand: "Augmentin", strength: "375mg"        },
    { id: "augmentin-625",   brand: "Augmentin", strength: "625mg"        },
    { id: "augmentin-1g-iv", brand: "Augmentin", strength: "1g/200ml (IV)"},
  ]},
  { id: "azithromycin", generic: "Azithromycin", category: "Antibiotics", allergyKeywords: ["Azithromycin"], brands: [
    { id: "zithromax-250",  brand: "Zithromax",  strength: "250mg" },
    { id: "zithromax-500",  brand: "Zithromax",  strength: "500mg" },
    { id: "azithral-500",   brand: "Azithral",   strength: "500mg" },
  ]},
  { id: "ciprofloxacin", generic: "Ciprofloxacin", category: "Antibiotics", allergyKeywords: ["Ciprofloxacin"], brands: [
    { id: "cipro-250",   brand: "Cipro",   strength: "250mg" },
    { id: "cipro-500",   brand: "Cipro",   strength: "500mg" },
    { id: "ciflox-500",  brand: "Ciflox",  strength: "500mg" },
  ]},
  { id: "metronidazole", generic: "Metronidazole", category: "Antibiotics", allergyKeywords: ["Metronidazole"], brands: [
    { id: "flagyl-200",     brand: "Flagyl", strength: "200mg"           },
    { id: "flagyl-400",     brand: "Flagyl", strength: "400mg"           },
    { id: "flagyl-500-iv",  brand: "Flagyl", strength: "500mg/100ml (IV)"},
  ]},
  { id: "doxycycline", generic: "Doxycycline", category: "Antibiotics", allergyKeywords: ["Doxycycline"], brands: [
    { id: "vibramycin-100", brand: "Vibramycin", strength: "100mg" },
    { id: "doxylin-100",    brand: "Doxylin",    strength: "100mg" },
  ]},
  // Antidiabetics
  { id: "metformin", generic: "Metformin", category: "Antidiabetics", allergyKeywords: ["Metformin"], brands: [
    { id: "glucophage-500",     brand: "Glucophage",    strength: "500mg"       },
    { id: "glucophage-850",     brand: "Glucophage",    strength: "850mg"       },
    { id: "glucophage-1000",    brand: "Glucophage",    strength: "1000mg"      },
    { id: "glucophage-xr-500",  brand: "Glucophage XR", strength: "500mg (SR)"  },
  ]},
  { id: "glibenclamide", generic: "Glibenclamide (Glyburide)", category: "Antidiabetics", allergyKeywords: ["Glibenclamide"], brands: [
    { id: "daonil-2.5", brand: "Daonil", strength: "2.5mg" },
    { id: "daonil-5",   brand: "Daonil", strength: "5mg"   },
  ]},
  // Cardiovascular
  { id: "amlodipine", generic: "Amlodipine", category: "Cardiovascular", allergyKeywords: ["Amlodipine"], brands: [
    { id: "norvasc-5",  brand: "Norvasc", strength: "5mg"  },
    { id: "norvasc-10", brand: "Norvasc", strength: "10mg" },
    { id: "amlor-5",    brand: "Amlor",   strength: "5mg"  },
  ]},
  { id: "atorvastatin", generic: "Atorvastatin", category: "Cardiovascular", allergyKeywords: ["Atorvastatin"], brands: [
    { id: "lipitor-10", brand: "Lipitor", strength: "10mg" },
    { id: "lipitor-20", brand: "Lipitor", strength: "20mg" },
    { id: "lipitor-40", brand: "Lipitor", strength: "40mg" },
    { id: "sortis-20",  brand: "Sortis",  strength: "20mg" },
  ]},
  { id: "metoprolol", generic: "Metoprolol", category: "Cardiovascular", allergyKeywords: ["Metoprolol"], brands: [
    { id: "lopressor-25",  brand: "Lopressor", strength: "25mg"  },
    { id: "lopressor-50",  brand: "Lopressor", strength: "50mg"  },
    { id: "betaloc-100",   brand: "Betaloc",   strength: "100mg" },
  ]},
  { id: "lisinopril", generic: "Lisinopril", category: "Cardiovascular", allergyKeywords: ["Lisinopril"], brands: [
    { id: "zestril-5",  brand: "Zestril", strength: "5mg"  },
    { id: "zestril-10", brand: "Zestril", strength: "10mg" },
    { id: "zestril-20", brand: "Zestril", strength: "20mg" },
  ]},
  { id: "furosemide", generic: "Furosemide", category: "Cardiovascular", allergyKeywords: ["Furosemide"], brands: [
    { id: "lasix-20", brand: "Lasix", strength: "20mg" },
    { id: "lasix-40", brand: "Lasix", strength: "40mg" },
    { id: "lasix-80", brand: "Lasix", strength: "80mg" },
  ]},
  // Respiratory
  { id: "salbutamol", generic: "Salbutamol (Albuterol)", category: "Respiratory", allergyKeywords: ["Salbutamol"], brands: [
    { id: "ventolin-2",   brand: "Ventolin",          strength: "2mg"           },
    { id: "ventolin-4",   brand: "Ventolin",          strength: "4mg"           },
    { id: "ventolin-inh", brand: "Ventolin Inhaler",  strength: "100mcg/dose"   },
  ]},
  { id: "prednisolone", generic: "Prednisolone", category: "Respiratory", allergyKeywords: ["Prednisolone"], brands: [
    { id: "prelone-5",         brand: "Prelone",       strength: "5mg"  },
    { id: "prelone-25",        brand: "Prelone",       strength: "25mg" },
    { id: "deltacortril-5",    brand: "Deltacortril",  strength: "5mg"  },
  ]},
  { id: "cetirizine", generic: "Cetirizine", category: "Respiratory", allergyKeywords: ["Cetirizine"], brands: [
    { id: "zyrtec-5",     brand: "Zyrtec",    strength: "5mg"  },
    { id: "zyrtec-10",    brand: "Zyrtec",    strength: "10mg" },
    { id: "reactine-10",  brand: "Reactine",  strength: "10mg" },
  ]},
  // GI
  { id: "omeprazole", generic: "Omeprazole", category: "GI / Gastroprotective", allergyKeywords: ["Omeprazole"], brands: [
    { id: "losec-20",     brand: "Losec",    strength: "20mg" },
    { id: "losec-40",     brand: "Losec",    strength: "40mg" },
    { id: "prilosec-20",  brand: "Prilosec", strength: "20mg" },
  ]},
  { id: "pantoprazole", generic: "Pantoprazole", category: "GI / Gastroprotective", allergyKeywords: ["Pantoprazole"], brands: [
    { id: "protonix-20",  brand: "Protonix",  strength: "20mg" },
    { id: "protonix-40",  brand: "Protonix",  strength: "40mg" },
    { id: "pantoloc-40",  brand: "Pantoloc",  strength: "40mg" },
  ]},
  { id: "ondansetron", generic: "Ondansetron", category: "GI / Gastroprotective", allergyKeywords: ["Ondansetron"], brands: [
    { id: "zofran-4",  brand: "Zofran",  strength: "4mg" },
    { id: "zofran-8",  brand: "Zofran",  strength: "8mg" },
    { id: "onday-4",   brand: "Onday",   strength: "4mg" },
  ]},
];

// ─── Admin Catalogue Integration ──────────────────────────────────────────────

const CATALOGUE_KEY   = "ehr-formulary-catalogue-v1";
const DEFAULTS_KEY    = "ehr-formulary-defaults-v1";

interface AdminGeneric {
  id: string; generic: string; category: string; allergyKeywords: string[];
  brands: { id: string; brand: string; strength: string }[];
  enabled: boolean; deleted: boolean;
}

/** Returns active (enabled & non-deleted) medicines from admin catalogue, falling back to MEDICINES. */
function getActiveMedicines(): MedicineDef[] {
  try {
    const raw = localStorage.getItem(CATALOGUE_KEY);
    if (raw) {
      const cat: AdminGeneric[] = JSON.parse(raw);
      return cat.filter(g => g.enabled && !g.deleted).map(g => ({
        id: g.id, generic: g.generic, category: g.category,
        allergyKeywords: g.allergyKeywords, brands: g.brands,
      }));
    }
  } catch { /**/ }
  return MEDICINES;
}

/** Returns all medicines from admin catalogue (inc. disabled), used for editing existing prescriptions. */
function getAllAdminMedicines(): MedicineDef[] {
  try {
    const raw = localStorage.getItem(CATALOGUE_KEY);
    if (raw) {
      const cat: AdminGeneric[] = JSON.parse(raw);
      return cat.map(g => ({
        id: g.id, generic: g.generic, category: g.category,
        allergyKeywords: g.allergyKeywords, brands: g.brands,
      }));
    }
  } catch { /**/ }
  return MEDICINES;
}

// ─── Options ──────────────────────────────────────────────────────────────────

const FACTORY_ROUTES      = ["Oral", "IV", "IM", "SC", "Inhaled", "Topical", "Sublingual", "Rectal"];
const FACTORY_FREQUENCIES = [
  "Once daily (OD)", "Twice daily (BID)", "Three times daily (TID)", "Four times daily (QID)",
  "Every 6 hours (q6h)", "Every 8 hours (q8h)", "Every 12 hours (q12h)", "As needed (PRN)", "Weekly", "Monthly",
];
const FACTORY_DURATIONS   = ["1 day", "3 days", "5 days", "7 days", "10 days", "14 days", "21 days", "30 days", "3 months", "6 months", "Ongoing"];
const FACTORY_UNITS       = ["tablet(s)", "capsule(s)", "ml", "dose(s)", "drop(s)", "puff(s)", "sachet(s)"];

export function getFormularyOptions() {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY);
    if (raw) {
      const d = JSON.parse(raw) as { routes: string[]; frequencies: string[]; durations: string[]; units: string[] };
      return { routes: d.routes ?? FACTORY_ROUTES, frequencies: d.frequencies ?? FACTORY_FREQUENCIES, durations: d.durations ?? FACTORY_DURATIONS, units: d.units ?? FACTORY_UNITS };
    }
  } catch { /**/ }
  return { routes: FACTORY_ROUTES, frequencies: FACTORY_FREQUENCIES, durations: FACTORY_DURATIONS, units: FACTORY_UNITS };
}

// ─── Favourites (localStorage persisted) ─────────────────────────────────────

const FAVS_KEY = "formulary_fav_brandIds";
function loadFavs(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(FAVS_KEY) ?? "[]")); } catch { return new Set(); }
}
function persistFavs(s: Set<string>) {
  localStorage.setItem(FAVS_KEY, JSON.stringify([...s]));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MedicineEntry {
  uid:                 string;
  medicineId:          string;
  brandId:             string;
  brand:               string;
  strength:            string;
  genericName:         string;
  dose:                string;
  unit:                string;
  route:               string;
  frequency:           string;
  duration:            string;
}

export interface FormularyData {
  medicines:               MedicineEntry[];
  pharmacistInstructions:  string;
}

export const EMPTY_FORMULARY: FormularyData = { medicines: [], pharmacistInstructions: "" };

// ─── Allergy check ────────────────────────────────────────────────────────────

function getAllergyWarning(med: MedicineDef, allergies: AllergyEntry[]): string | null {
  for (const a of allergies) {
    for (const kw of med.allergyKeywords) {
      if (a.name.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(a.name.toLowerCase())) {
        return `Allergy conflict: patient is allergic to ${a.name} — ${med.generic} may cause a reaction`;
      }
    }
  }
  return null;
}

// ─── Small Select ─────────────────────────────────────────────────────────────

export function Sel({ value, options, onChange, placeholder }: {
  value: string; options: string[]; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 pr-7 outline-none focus:border-[#6366f1]/50 focus:ring-1 focus:ring-[#6366f1]/20 transition-colors">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ─── Medicine Search Dropdown ─────────────────────────────────────────────────

export function MedicineSearch({
  favs, onToggleFav, onSelect,
}: {
  favs: Set<string>;
  onToggleFav: (brandId: string, fav: boolean) => void;
  onSelect: (med: MedicineDef, brand: BrandOption) => void;
}) {
  const [query, setQuery]   = useState("");
  const [open, setOpen]     = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const q = query.toLowerCase().trim();

  const activeMeds = getActiveMedicines();

  // Favourited brand options with their parent medicine
  const favList = activeMeds.flatMap(m =>
    m.brands.filter(b => favs.has(b.id)).map(b => ({ med: m, brand: b }))
  );

  // Filter medicines by query
  const matchedMeds = q
    ? activeMeds.filter(m =>
        m.generic.toLowerCase().includes(q) ||
        m.brands.some(b => b.brand.toLowerCase().includes(q) || b.strength.toLowerCase().includes(q))
      )
    : activeMeds;

  // Group by category
  const grouped = matchedMeds.reduce<Record<string, MedicineDef[]>>((acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  }, {});

  function pick(med: MedicineDef, brand: BrandOption) {
    onSelect(med, brand);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl focus-within:border-[#6366f1]/50 focus-within:ring-1 focus-within:ring-[#6366f1]/20 transition-all">
        <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search by brand or generic name…"
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

          {/* Favourites section */}
          {!q && favList.length > 0 && (
            <div>
              <p className="px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Favourites
              </p>
              {favList.map(({ med, brand }) => (
                <BrandRow key={brand.id} med={med} brand={brand} isFav favs={favs} onToggleFav={onToggleFav} onPick={() => pick(med, brand)} />
              ))}
              <div className="border-t border-slate-100 mx-3 my-1" />
            </div>
          )}

          {/* Grouped by category */}
          {Object.entries(grouped).map(([cat, meds]) => (
            <div key={cat}>
              <p className="px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest text-indigo-400">{cat}</p>
              {meds.map(med => {
                // Filter brands by query if present
                const brands = q
                  ? med.brands.filter(b => b.brand.toLowerCase().includes(q) || b.strength.toLowerCase().includes(q) || med.generic.toLowerCase().includes(q))
                  : med.brands;
                return (
                  <div key={med.id}>
                    <p className="px-4 py-1 text-[10px] font-bold text-slate-600 bg-slate-50/50">{med.generic}</p>
                    {brands.map(brand => (
                      <BrandRow key={brand.id} med={med} brand={brand} isFav={false} favs={favs} onToggleFav={onToggleFav} onPick={() => pick(med, brand)} />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}

          {Object.keys(grouped).length === 0 && (
            <p className="px-4 py-4 text-xs text-slate-400 italic text-center">No medicine found</p>
          )}
        </div>
      )}
    </div>
  );
}

function BrandRow({ med, brand, favs, onToggleFav, onPick }: {
  med: MedicineDef; brand: BrandOption; isFav: boolean;
  favs: Set<string>;
  onToggleFav: (id: string, fav: boolean) => void;
  onPick: () => void;
}) {
  const isFav = favs.has(brand.id);
  return (
    <div className="flex items-center gap-1 px-5 hover:bg-indigo-50 transition-colors group border-b border-slate-50 last:border-0">
      {/* Star toggle */}
      <button
        onClick={e => { e.stopPropagation(); onToggleFav(brand.id, !isFav); }}
        className="p-1 flex-shrink-0">
        <Star
          className={`h-3 w-3 transition-colors ${isFav ? "fill-amber-400 text-amber-400" : "text-slate-200 group-hover:text-slate-300"}`}
        />
      </button>
      {/* Brand + strength */}
      <button onClick={onPick} className="flex-1 flex items-center justify-between py-2 text-left">
        <span className="text-xs font-bold text-slate-800">{brand.brand}</span>
        <span className="text-[10px] text-slate-500 font-medium">{brand.strength}</span>
      </button>
    </div>
  );
}

// ─── Formulary Chips Panel ────────────────────────────────────────────────────

export function FormularyChipsPanel({
  data,
  onOpen,
}: {
  data: FormularyData;
  onOpen: () => void;
}) {
  if (data.medicines.length === 0 && !data.pharmacistInstructions) {
    return (
      <button
        onClick={onOpen}
        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl bg-indigo-50/60 border-2 border-dashed border-indigo-200 text-indigo-500 font-bold text-xs hover:border-indigo-400 hover:bg-indigo-50 transition-all">
        <Plus className="h-4 w-4 flex-shrink-0" />
        Add prescription…
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {data.medicines.map(m => (
        <div key={m.uid} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40">
          <Pill className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black text-indigo-800">{m.brand} {m.strength}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {m.dose} {m.unit} · {m.route} · {m.frequency} · {m.duration}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5 italic">{m.genericName}</p>
          </div>
        </div>
      ))}
      {data.pharmacistInstructions && (
        <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
          <p className="text-[9px] font-black text-amber-600 uppercase tracking-wide">Pharmacist Note</p>
          <p className="text-[10px] text-amber-700 mt-0.5">{data.pharmacistInstructions}</p>
        </div>
      )}
      <button
        onClick={onOpen}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl border border-indigo-200 text-indigo-500 text-xs font-bold hover:bg-indigo-50 transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Edit prescriptions ({data.medicines.length})
      </button>
    </div>
  );
}

// ─── Bundles Collapsible Section (inside Formulary Drawer) ───────────────────

function BundlesSection({ onApply }: { onApply: (b: FormularyBundle) => void }) {
  const [open, setOpen]       = useState(false);
  const [bundles, setBundles] = useState<FormularyBundle[]>([]);

  useEffect(() => {
    setBundles(loadEnabledBundles());
  }, []);

  if (bundles.length === 0) return null;

  return (
    <div className="border-b border-slate-100 mx-0">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-slate-50 transition-colors">
        <BookOpen className="h-3.5 w-3.5 text-[#4982CF] flex-shrink-0" />
        <p className="text-[10px] font-black text-[#4982CF] uppercase tracking-wide flex-1 text-left">
          Bundles ({bundles.length})
        </p>
        {open
          ? <ChevronUp   className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {bundles.map(b => (
            <div key={b.id}
              className="flex items-start gap-3 px-3 py-2.5 rounded-xl border border-[#4982CF]/20 bg-[#4982CF]/5">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-slate-800">{b.name}</p>
                {b.description && <p className="text-[10px] text-slate-500 mt-0.5">{b.description}</p>}
                <p className="text-[9px] text-slate-400 mt-0.5">{b.items.length} medicine{b.items.length !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={() => { onApply(b); setOpen(false); }}
                className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg bg-[#4982CF] text-white hover:bg-[#3a73c0] transition-colors flex-shrink-0">
                <Plus className="h-3 w-3" />
                Apply
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Formulary Drawer ─────────────────────────────────────────────────────────

export const EMPTY_FORM = { dose: "1", unit: "tablet(s)", route: "Oral", frequency: "Once daily (OD)", duration: "5 days" };

interface FormularyDrawerProps {
  savedData:        FormularyData;
  patientAllergies: AllergyEntry[];
  onSave:           (data: FormularyData) => void;
  onClose:          () => void;
}

export function FormularyDrawer({ savedData, patientAllergies, onSave, onClose }: FormularyDrawerProps) {
  const [medicines,   setMedicines]   = useState<MedicineEntry[]>(savedData.medicines);
  const [pharmNote,   setPharmNote]   = useState(savedData.pharmacistInstructions);
  const [favs,        setFavs]        = useState<Set<string>>(loadFavs);
  const [selMed,      setSelMed]      = useState<MedicineDef | null>(null);
  const [selBrand,    setSelBrand]    = useState<BrandOption | null>(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editingUid,     setEditingUid]     = useState<string | null>(null);
  const [bundleWarnings, setBundleWarnings] = useState<string[]>([]);

  const allMeds = getAllAdminMedicines();
  const opts    = getFormularyOptions();
  const drugAllergies = patientAllergies.filter(a => a.allergenType === "Drug" || allMeds.some(m =>
    m.allergyKeywords.some(kw => a.name.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(a.name.toLowerCase()))
  ));

  const allergyWarning = selMed ? getAllergyWarning(selMed, patientAllergies) : null;
  const canAdd = selMed !== null && selBrand !== null && form.dose.trim() !== "";

  function setF<K extends keyof typeof EMPTY_FORM>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function toggleFav(brandId: string, fav: boolean) {
    setFavs(prev => {
      const next = new Set(prev);
      fav ? next.add(brandId) : next.delete(brandId);
      persistFavs(next);
      return next;
    });
  }

  function selectBrand(med: MedicineDef, brand: BrandOption) {
    setSelMed(med);
    setSelBrand(brand);
    setForm(EMPTY_FORM);
    setEditingUid(null);
  }

  function handleAdd() {
    if (!selMed || !selBrand || !canAdd) return;
    const entry: MedicineEntry = {
      uid:         editingUid ?? `med-${Date.now()}`,
      medicineId:  selMed.id,
      brandId:     selBrand.id,
      brand:       selBrand.brand,
      strength:    selBrand.strength,
      genericName: selMed.generic,
      dose:        form.dose.trim(),
      unit:        form.unit,
      route:       form.route,
      frequency:   form.frequency,
      duration:    form.duration,
    };
    setMedicines(prev => {
      if (editingUid) return prev.map(m => m.uid === editingUid ? entry : m);
      const existing = prev.find(m => m.brandId === entry.brandId);
      if (existing) return prev.map(m => m.brandId === entry.brandId ? { ...entry, uid: m.uid } : m);
      return [...prev, entry];
    });
    setSelMed(null); setSelBrand(null); setForm(EMPTY_FORM); setEditingUid(null);
  }

  function startEdit(m: MedicineEntry) {
    const def   = allMeds.find(d => d.id === m.medicineId) ?? null;
    const brand = def?.brands.find(b => b.id === m.brandId) ?? null;
    setSelMed(def); setSelBrand(brand);
    setForm({ dose: m.dose, unit: m.unit, route: m.route, frequency: m.frequency, duration: m.duration });
    setEditingUid(m.uid);
  }

  function removeEntry(uid: string) {
    setMedicines(prev => prev.filter(m => m.uid !== uid));
    if (editingUid === uid) { setSelMed(null); setSelBrand(null); setForm(EMPTY_FORM); setEditingUid(null); }
  }

  function applyBundle(bundle: FormularyBundle) {
    const warnings: string[] = [];
    setMedicines(prev => {
      const next = [...prev];
      for (const item of bundle.items) {
        if (!next.some(m => m.brandId === item.brandId)) {
          const def = allMeds.find(m => m.id === item.medicineId);
          if (def) {
            const warn = getAllergyWarning(def, patientAllergies);
            if (warn) warnings.push(warn);
          }
          next.push({
            uid:         `med-${Date.now()}-${item.brandId}`,
            medicineId:  item.medicineId,
            brandId:     item.brandId,
            brand:       item.brand,
            strength:    item.strength,
            genericName: item.genericName,
            dose:        item.dose,
            unit:        item.unit,
            route:       item.route,
            frequency:   item.frequency,
            duration:    item.duration,
          });
        }
      }
      return next;
    });
    setBundleWarnings(warnings);
  }

  function saveAndClose() {
    onSave({ medicines, pharmacistInstructions: pharmNote });
    onClose();
  }

  return (
    <div className="absolute inset-y-0 right-0 w-[68%] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-20">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button onClick={saveAndClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Assessment &amp; Plan</p>
          <p className="text-sm font-black text-slate-800">Formulary</p>
        </div>
        {medicines.length > 0 ? (
          <button onClick={saveAndClose}
            className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0 hover:bg-emerald-100 transition-colors">
            <CheckCircle2 className="h-3 w-3" /> Done
          </button>
        ) : (
          <button onClick={saveAndClose}
            className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg bg-[#6366f1] text-white hover:bg-indigo-500 transition-colors flex-shrink-0">
            <ClipboardCheck className="h-3.5 w-3.5" /> Save
          </button>
        )}
      </div>

      {/* ── Drug Allergy Banner ── */}
      {drugAllergies.length > 0 && (
        <div className="flex items-start gap-2.5 px-4 py-2.5 bg-red-50 border-b border-red-100 flex-shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black text-red-600 uppercase tracking-wide">Patient Drug Allergies</p>
            <p className="text-[11px] text-red-500 mt-0.5">{drugAllergies.map(a => a.name).join(" · ")}</p>
          </div>
        </div>
      )}

      {/* ── Bundle Allergy Warnings ── */}
      {bundleWarnings.length > 0 && (
        <div className="flex items-start gap-2.5 px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex-shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide">Bundle Allergy Conflict</p>
            {bundleWarnings.map((w, i) => (
              <p key={i} className="text-[11px] text-amber-600 mt-0.5">{w}</p>
            ))}
          </div>
          <button onClick={() => setBundleWarnings([])}
            className="h-5 w-5 flex items-center justify-center text-amber-400 hover:text-amber-600 flex-shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Bundles Section ── */}
        <BundlesSection onApply={applyBundle} />

        {/* ── Add / Edit form ── */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5">
            {editingUid ? "Edit Prescription" : "Add Prescription"}
          </p>

          <MedicineSearch favs={favs} onToggleFav={toggleFav} onSelect={selectBrand} />

          {selMed && selBrand && (
            <div className="mt-3 border border-indigo-100 rounded-xl bg-indigo-50/30 p-3 space-y-3">
              {/* Selected medicine header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-slate-800">{selBrand.brand}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600">{selBrand.strength}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{selMed.generic}</p>
                </div>
                <button onClick={() => { setSelMed(null); setSelBrand(null); setForm(EMPTY_FORM); setEditingUid(null); }}
                  className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Allergy warning */}
              {allergyWarning && (
                <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-red-50 border border-red-100">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-600 font-medium">⚠ {allergyWarning}</p>
                </div>
              )}

              {/* Row 1: Dose + Unit + Route */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Dose</label>
                  <input
                    type="number" min="0.5" step="0.5"
                    value={form.dose}
                    onChange={e => setF("dose", e.target.value)}
                    placeholder="1"
                    className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-[#6366f1]/50 focus:ring-1 focus:ring-[#6366f1]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Unit</label>
                  <Sel value={form.unit} options={opts.units} onChange={v => setF("unit", v)} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Route</label>
                  <Sel value={form.route} options={opts.routes} onChange={v => setF("route", v)} />
                </div>
              </div>

              {/* Row 2: Frequency + Duration */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Frequency</label>
                  <Sel value={form.frequency} options={opts.frequencies} onChange={v => setF("frequency", v)} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Duration</label>
                  <Sel value={form.duration} options={opts.durations} onChange={v => setF("duration", v)} />
                </div>
              </div>

              {/* Add button */}
              <div className="flex justify-end">
                <button onClick={handleAdd} disabled={!canAdd}
                  className="flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl bg-[#6366f1] text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                  {editingUid ? "Update Prescription" : "Add Prescription"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Prescriptions list ── */}
        {medicines.length > 0 && (
          <>
            <div className="border-t border-slate-100 mx-4" />
            <div className="px-4 pt-3 pb-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5">
                Prescriptions ({medicines.length})
              </p>
              <div className="space-y-2">
                {medicines.map(m => {
                  const isEditing = editingUid === m.uid;
                  return (
                    <div key={m.uid}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all"
                      style={{ borderColor: isEditing ? "#a5b4fc" : "#e0e7ff", backgroundColor: isEditing ? "#eef2ff" : "#f5f7ff" }}>
                      <Pill className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-black text-slate-800">{m.brand}</p>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 flex-shrink-0">{m.strength}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{m.dose} {m.unit} · {m.route} · {m.frequency} · {m.duration}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 italic">{m.genericName}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => startEdit(m)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg border border-transparent hover:border-indigo-100 hover:bg-indigo-50 text-slate-300 hover:text-indigo-500 transition-colors">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button onClick={() => removeEntry(m.uid)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg border border-transparent hover:border-red-100 hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Pharmacist Instructions ── */}
        <div className="border-t border-slate-100 mx-4" />
        <div className="px-4 pt-3 pb-5">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">
            Pharmacist Instructions
          </label>
          <textarea
            value={pharmNote}
            onChange={e => setPharmNote(e.target.value)}
            rows={2}
            placeholder="e.g. Dispense after food · Substitute allowed · Avoid NSAIDs…"
            className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#6366f1]/50 focus:ring-1 focus:ring-[#6366f1]/20 transition-all resize-none placeholder:text-slate-300"
          />
        </div>
      </div>
    </div>
  );
}
