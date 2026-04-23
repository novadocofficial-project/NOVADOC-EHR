import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, X, Search, CheckCircle2, ClipboardCheck,
  Plus, AlertTriangle, Pill, Pencil, ChevronDown,
} from "lucide-react";
import type { AllergyEntry } from "@/pages/AllergySelector";

// ─── Medicine Database (mock – brand + generic) ──────────────────────────────

interface MedicineDef {
  id:              string;
  brand:           string;
  generic:         string;
  category:        string;
  allergyKeywords: string[];
}

const MEDICINES: MedicineDef[] = [
  // Analgesics & Antipyretics
  { id: "paracetamol",    brand: "Panadol / Tylenol",   generic: "Paracetamol (Acetaminophen)", category: "Analgesics & Antipyretics",  allergyKeywords: ["Paracetamol", "Acetaminophen"] },
  { id: "tramadol",       brand: "Ultram / Tramal",     generic: "Tramadol",                    category: "Analgesics & Antipyretics",  allergyKeywords: ["Tramadol"] },
  { id: "codeine",        brand: "Tylenol + Codeine",   generic: "Codeine",                     category: "Analgesics & Antipyretics",  allergyKeywords: ["Codeine"] },
  // NSAIDs
  { id: "ibuprofen",      brand: "Brufen / Advil",      generic: "Ibuprofen",                   category: "NSAIDs",                     allergyKeywords: ["Ibuprofen", "Aspirin"] },
  { id: "diclofenac",     brand: "Voltaren",            generic: "Diclofenac",                  category: "NSAIDs",                     allergyKeywords: ["Diclofenac", "Aspirin"] },
  { id: "aspirin",        brand: "Ecotrin / Disprin",   generic: "Aspirin (ASA)",               category: "NSAIDs",                     allergyKeywords: ["Aspirin"] },
  { id: "naproxen",       brand: "Naprosyn / Aleve",    generic: "Naproxen",                    category: "NSAIDs",                     allergyKeywords: ["Naproxen", "Aspirin"] },
  // Antibiotics
  { id: "amoxicillin",    brand: "Amoxil",              generic: "Amoxicillin",                 category: "Antibiotics",                allergyKeywords: ["Penicillin", "Amoxicillin"] },
  { id: "azithromycin",   brand: "Zithromax",           generic: "Azithromycin",                category: "Antibiotics",                allergyKeywords: ["Azithromycin"] },
  { id: "ciprofloxacin",  brand: "Cipro",               generic: "Ciprofloxacin",               category: "Antibiotics",                allergyKeywords: ["Ciprofloxacin"] },
  { id: "doxycycline",    brand: "Vibramycin",          generic: "Doxycycline",                 category: "Antibiotics",                allergyKeywords: ["Doxycycline"] },
  { id: "metronidazole",  brand: "Flagyl",              generic: "Metronidazole",               category: "Antibiotics",                allergyKeywords: ["Metronidazole"] },
  { id: "clindamycin",    brand: "Cleocin",             generic: "Clindamycin",                 category: "Antibiotics",                allergyKeywords: ["Clindamycin"] },
  { id: "cephalexin",     brand: "Keflex",              generic: "Cephalexin",                  category: "Antibiotics",                allergyKeywords: ["Cephalexin", "Penicillin"] },
  // Antidiabetics
  { id: "metformin",      brand: "Glucophage",          generic: "Metformin",                   category: "Antidiabetics",              allergyKeywords: ["Metformin"] },
  { id: "insulin-r",      brand: "Humulin R",           generic: "Insulin Regular",             category: "Antidiabetics",              allergyKeywords: ["Insulin"] },
  { id: "glibenclamide",  brand: "Daonil",              generic: "Glibenclamide (Glyburide)",   category: "Antidiabetics",              allergyKeywords: ["Glibenclamide"] },
  { id: "sitagliptin",    brand: "Januvia",             generic: "Sitagliptin",                 category: "Antidiabetics",              allergyKeywords: ["Sitagliptin"] },
  // Cardiovascular
  { id: "amlodipine",     brand: "Norvasc",             generic: "Amlodipine",                  category: "Cardiovascular",             allergyKeywords: ["Amlodipine"] },
  { id: "metoprolol",     brand: "Lopressor",           generic: "Metoprolol",                  category: "Cardiovascular",             allergyKeywords: ["Metoprolol"] },
  { id: "lisinopril",     brand: "Prinivil / Zestril",  generic: "Lisinopril",                  category: "Cardiovascular",             allergyKeywords: ["Lisinopril"] },
  { id: "losartan",       brand: "Cozaar",              generic: "Losartan",                    category: "Cardiovascular",             allergyKeywords: ["Losartan"] },
  { id: "atorvastatin",   brand: "Lipitor",             generic: "Atorvastatin",                category: "Cardiovascular",             allergyKeywords: ["Atorvastatin"] },
  { id: "furosemide",     brand: "Lasix",               generic: "Furosemide",                  category: "Cardiovascular",             allergyKeywords: ["Furosemide"] },
  { id: "clopidogrel",    brand: "Plavix",              generic: "Clopidogrel",                 category: "Cardiovascular",             allergyKeywords: ["Clopidogrel", "Aspirin"] },
  { id: "warfarin",       brand: "Coumadin",            generic: "Warfarin",                    category: "Cardiovascular",             allergyKeywords: ["Warfarin"] },
  // Respiratory
  { id: "salbutamol",     brand: "Ventolin",            generic: "Salbutamol (Albuterol)",      category: "Respiratory",                allergyKeywords: ["Salbutamol"] },
  { id: "prednisolone",   brand: "Prelone / Deltasone", generic: "Prednisolone",                category: "Respiratory",                allergyKeywords: ["Prednisolone"] },
  { id: "cetirizine",     brand: "Zyrtec",              generic: "Cetirizine",                  category: "Respiratory",                allergyKeywords: ["Cetirizine"] },
  { id: "loratadine",     brand: "Claritin",            generic: "Loratadine",                  category: "Respiratory",                allergyKeywords: ["Loratadine"] },
  { id: "montelukast",    brand: "Singulair",           generic: "Montelukast",                 category: "Respiratory",                allergyKeywords: ["Montelukast"] },
  // GI
  { id: "omeprazole",     brand: "Prilosec / Losec",    generic: "Omeprazole",                  category: "GI / Gastroprotective",      allergyKeywords: ["Omeprazole"] },
  { id: "pantoprazole",   brand: "Protonix",            generic: "Pantoprazole",                category: "GI / Gastroprotective",      allergyKeywords: ["Pantoprazole"] },
  { id: "domperidone",    brand: "Motilium",            generic: "Domperidone",                 category: "GI / Gastroprotective",      allergyKeywords: ["Domperidone"] },
  { id: "ondansetron",    brand: "Zofran",              generic: "Ondansetron",                 category: "GI / Gastroprotective",      allergyKeywords: ["Ondansetron"] },
  // Psychiatry
  { id: "sertraline",     brand: "Zoloft",              generic: "Sertraline",                  category: "Psychiatry & Neurology",     allergyKeywords: ["Sertraline"] },
  { id: "diazepam",       brand: "Valium",              generic: "Diazepam",                    category: "Psychiatry & Neurology",     allergyKeywords: ["Diazepam", "Benzodiazepine"] },
  { id: "amitriptyline",  brand: "Elavil",              generic: "Amitriptyline",               category: "Psychiatry & Neurology",     allergyKeywords: ["Amitriptyline"] },
];

const ROUTES      = ["Oral", "IV", "IM", "SC", "Topical", "Sublingual", "Inhaled", "Rectal", "Transdermal"];
const FREQUENCIES = [
  "Once daily (OD)", "Twice daily (BID)", "Three times daily (TID)", "Four times daily (QID)",
  "Every 6 hours (q6h)", "Every 8 hours (q8h)", "Every 12 hours (q12h)", "As needed (PRN)", "Weekly", "Monthly",
];
const DURATIONS   = ["1 day", "3 days", "5 days", "7 days", "10 days", "14 days", "21 days", "30 days", "3 months", "6 months", "Ongoing"];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MedicineEntry {
  uid:                 string;
  medicineId:          string;
  name:                string;
  genericName:         string;
  dosage:              string;
  route:               string;
  frequency:           string;
  duration:            string;
  specialInstructions: string;
}

// ─── Allergy check ────────────────────────────────────────────────────────────

function getAllergyWarning(med: MedicineDef, allergies: AllergyEntry[]): string | null {
  for (const a of allergies) {
    for (const kw of med.allergyKeywords) {
      if (a.name.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(a.name.toLowerCase())) {
        return `Patient is allergic to ${a.name} — ${med.generic} may cause a reaction`;
      }
    }
  }
  return null;
}

// ─── Small Select ─────────────────────────────────────────────────────────────

function Select({ value, options, onChange, placeholder }: {
  value: string; options: string[]; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 pr-7 outline-none focus:border-[#6366f1]/50 focus:ring-1 focus:ring-[#6366f1]/20 transition-colors">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ─── Medicine Search Input ────────────────────────────────────────────────────

function MedicineSearch({
  onSelect,
}: {
  onSelect: (med: MedicineDef) => void;
}) {
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const q = query.toLowerCase().trim();
  const grouped = MEDICINES.reduce<Record<string, MedicineDef[]>>((acc, m) => {
    if (!q || m.brand.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q)) {
      (acc[m.category] ??= []).push(m);
    }
    return acc;
  }, {});

  const hasResults = Object.keys(grouped).length > 0;

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
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
          {hasResults ? Object.entries(grouped).map(([cat, meds]) => (
            <div key={cat}>
              <p className="px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest text-indigo-400">{cat}</p>
              {meds.map(m => (
                <button
                  key={m.id}
                  onClick={() => { onSelect(m); setQuery(""); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0">
                  <p className="text-xs font-bold text-slate-800">{m.generic}</p>
                  <p className="text-[10px] text-slate-400">{m.brand}</p>
                </button>
              ))}
            </div>
          )) : (
            <p className="px-4 py-4 text-xs text-slate-400 italic text-center">No medicine found</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Formulary Chips Panel (shown in SOAP section) ────────────────────────────

export function FormularyChipsPanel({
  medicines,
  onOpen,
}: {
  medicines: MedicineEntry[];
  onOpen: () => void;
}) {
  if (medicines.length === 0) {
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
      <div className="space-y-1.5">
        {medicines.map(m => (
          <div
            key={m.uid}
            className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40">
            <Pill className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-indigo-800">{m.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {m.dosage} · {m.route} · {m.frequency} · {m.duration}
              </p>
              {m.specialInstructions && (
                <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">✦ {m.specialInstructions}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onOpen}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl border border-indigo-200 text-indigo-500 text-xs font-bold hover:bg-indigo-50 transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Edit prescriptions ({medicines.length})
      </button>
    </div>
  );
}

// ─── Formulary Drawer ─────────────────────────────────────────────────────────

const EMPTY_FORM = { dosage: "", route: "Oral", frequency: "Once daily (OD)", duration: "5 days", specialInstructions: "" };

interface FormularyDrawerProps {
  savedMedicines:  MedicineEntry[];
  patientAllergies: AllergyEntry[];
  onSave:          (medicines: MedicineEntry[]) => void;
  onClose:         () => void;
}

export function FormularyDrawer({ savedMedicines, patientAllergies, onSave, onClose }: FormularyDrawerProps) {
  const [medicines,    setMedicines]    = useState<MedicineEntry[]>(savedMedicines);
  const [selMed,       setSelMed]       = useState<MedicineDef | null>(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [editingUid,   setEditingUid]   = useState<string | null>(null);

  const drugAllergies = patientAllergies.filter(a =>
    a.allergenType === "Drug" || MEDICINES.some(m => m.allergyKeywords.some(kw =>
      a.name.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(a.name.toLowerCase())
    ))
  );

  const allergyWarning = selMed ? getAllergyWarning(selMed, patientAllergies) : null;
  const canAdd = selMed !== null && form.dosage.trim() !== "" && form.route !== "" && form.frequency !== "" && form.duration !== "";

  function setF<K extends keyof typeof EMPTY_FORM>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function selectMedicine(med: MedicineDef) {
    setSelMed(med);
    setForm(EMPTY_FORM);
    setEditingUid(null);
  }

  function handleAdd() {
    if (!selMed || !canAdd) return;
    const entry: MedicineEntry = {
      uid:                 editingUid ?? `med-${Date.now()}`,
      medicineId:          selMed.id,
      name:                selMed.generic,
      genericName:         selMed.generic,
      dosage:              form.dosage.trim(),
      route:               form.route,
      frequency:           form.frequency,
      duration:            form.duration,
      specialInstructions: form.specialInstructions.trim(),
    };
    setMedicines(prev =>
      editingUid
        ? prev.map(m => m.uid === editingUid ? entry : m)
        : [...prev, entry]
    );
    setSelMed(null);
    setForm(EMPTY_FORM);
    setEditingUid(null);
  }

  function startEdit(m: MedicineEntry) {
    const def = MEDICINES.find(d => d.id === m.medicineId) ?? null;
    setSelMed(def);
    setForm({
      dosage:              m.dosage,
      route:               m.route,
      frequency:           m.frequency,
      duration:            m.duration,
      specialInstructions: m.specialInstructions,
    });
    setEditingUid(m.uid);
  }

  function removeMedicine(uid: string) {
    setMedicines(prev => prev.filter(m => m.uid !== uid));
    if (editingUid === uid) { setSelMed(null); setForm(EMPTY_FORM); setEditingUid(null); }
  }

  function saveAndClose() { onSave(medicines); onClose(); }

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
            <p className="text-[11px] text-red-500 mt-0.5">
              {drugAllergies.map(a => a.name).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Add / Edit form */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5">
            {editingUid ? "Edit Prescription" : "Add Prescription"}
          </p>

          {/* Medicine search */}
          <MedicineSearch onSelect={selectMedicine} />

          {/* Selected medicine + form */}
          {selMed && (
            <div className="mt-3 border border-indigo-100 rounded-xl bg-indigo-50/30 p-3 space-y-3">
              {/* Medicine header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-black text-slate-800">{selMed.generic}</p>
                  <p className="text-[10px] text-slate-400">{selMed.brand}</p>
                </div>
                <button onClick={() => { setSelMed(null); setForm(EMPTY_FORM); setEditingUid(null); }}
                  className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Allergy conflict warning */}
              {allergyWarning && (
                <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-red-50 border border-red-100">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-600 font-medium">{allergyWarning}</p>
                </div>
              )}

              {/* Row 1: Dosage + Route + Frequency */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Dosage</label>
                  <input
                    value={form.dosage}
                    onChange={e => setF("dosage", e.target.value)}
                    placeholder="e.g. 500mg"
                    className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-[#6366f1]/50 focus:ring-1 focus:ring-[#6366f1]/20 transition-all placeholder:text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Route</label>
                  <Select value={form.route} options={ROUTES} onChange={v => setF("route", v)} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Frequency</label>
                  <Select value={form.frequency} options={FREQUENCIES} onChange={v => setF("frequency", v)} />
                </div>
              </div>

              {/* Row 2: Duration + Special Instructions */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Duration</label>
                  <Select value={form.duration} options={DURATIONS} onChange={v => setF("duration", v)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Special Instructions</label>
                  <input
                    value={form.specialInstructions}
                    onChange={e => setF("specialInstructions", e.target.value)}
                    placeholder="e.g. Take with food, avoid sunlight…"
                    className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-[#6366f1]/50 focus:ring-1 focus:ring-[#6366f1]/20 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Add button */}
              <div className="flex justify-end">
                <button
                  onClick={handleAdd}
                  disabled={!canAdd}
                  className="flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl bg-[#6366f1] text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                  {editingUid ? "Update Prescription" : "Add Prescription"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        {medicines.length > 0 && (
          <div className="border-t border-slate-100 mx-4" />
        )}

        {/* Prescriptions list */}
        {medicines.length > 0 && (
          <div className="px-4 pt-3 pb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5">
              Prescriptions ({medicines.length})
            </p>
            <div className="space-y-2">
              {medicines.map(m => {
                const isEditing = editingUid === m.uid;
                return (
                  <div
                    key={m.uid}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all"
                    style={{ borderColor: isEditing ? "#a5b4fc" : "#e0e7ff", backgroundColor: isEditing ? "#eef2ff" : "#f5f7ff" }}>
                    <Pill className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-slate-800">{m.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {m.dosage} · {m.route} · {m.frequency} · {m.duration}
                      </p>
                      {m.specialInstructions && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">✦ {m.specialInstructions}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEdit(m)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg border border-transparent hover:border-indigo-100 hover:bg-indigo-50 text-slate-300 hover:text-indigo-500 transition-colors">
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeMedicine(m.uid)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg border border-transparent hover:border-red-100 hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
