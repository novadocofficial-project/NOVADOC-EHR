import { useState, useRef } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown, X, Search,
  CheckCircle2, ClipboardCheck, Stethoscope, Plus,
} from "lucide-react";

// ─── Accent ───────────────────────────────────────────────────────────────────

const ACCENT = "#0d9488";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProcedureOrder {
  uid:  string;
  id:   string;
  name: string;
  cpt:  string;
}

export interface ProcedureOrdersData {
  orders:       ProcedureOrder[];
  instructions: string;
}

export const EMPTY_PROCEDURE_ORDERS: ProcedureOrdersData = { orders: [], instructions: "" };

// ─── Built-in catalogue (fallback) ────────────────────────────────────────────

interface ProcEntry { id: string; name: string; cpt: string; category: string; }

const PROC_DEFS: ProcEntry[] = [
  { id: "nebulization",    name: "Nebulization",                        cpt: "94640", category: "Respiratory"     },
  { id: "oxygen-therapy",  name: "Oxygen Therapy",                      cpt: "94002", category: "Respiratory"     },
  { id: "peak-flow",       name: "Peak Flow Measurement",               cpt: "94150", category: "Respiratory"     },
  { id: "suction",         name: "Airway Suctioning",                   cpt: "31500", category: "Respiratory"     },
  { id: "iv-cannulation",  name: "IV Cannulation",                      cpt: "36000", category: "Vascular Access" },
  { id: "iv-drip",         name: "IV Drip Setup & Administration",      cpt: "96360", category: "Vascular Access" },
  { id: "iv-push",         name: "IV Push Injection",                   cpt: "96374", category: "Vascular Access" },
  { id: "im-injection",    name: "Intramuscular Injection",             cpt: "96372", category: "Vascular Access" },
  { id: "blood-draw",      name: "Blood Draw / Venipuncture",           cpt: "36415", category: "Vascular Access" },
  { id: "central-line",    name: "Central Line Care & Flush",           cpt: "36556", category: "Vascular Access" },
  { id: "wound-dressing",  name: "Wound Dressing & Care",               cpt: "97602", category: "Wound Care"      },
  { id: "suturing",        name: "Wound Suturing / Laceration Repair",  cpt: "12001", category: "Wound Care"      },
  { id: "staple-removal",  name: "Staple Removal",                      cpt: "99024", category: "Wound Care"      },
  { id: "suture-removal",  name: "Suture Removal",                      cpt: "99024", category: "Wound Care"      },
  { id: "debridement",     name: "Wound Debridement",                   cpt: "97597", category: "Wound Care"      },
  { id: "packing",         name: "Wound Packing",                       cpt: "10160", category: "Wound Care"      },
  { id: "catheterization", name: "Urinary Catheterization",             cpt: "51701", category: "Urinary"         },
  { id: "catheter-care",   name: "Catheter Care & Irrigation",          cpt: "51700", category: "Urinary"         },
  { id: "catheter-removal",name: "Urinary Catheter Removal",            cpt: "51702", category: "Urinary"         },
  { id: "bladder-scan",    name: "Bladder Scan (Ultrasound)",           cpt: "51798", category: "Urinary"         },
  { id: "ng-tube",         name: "Nasogastric Tube Insertion",          cpt: "43752", category: "GI / Enteral"    },
  { id: "ng-feeding",      name: "Nasogastric Tube Feeding",            cpt: "43753", category: "GI / Enteral"    },
  { id: "enema",           name: "Enema Administration",                cpt: "45399", category: "GI / Enteral"    },
  { id: "ecg",             name: "12-Lead ECG",                         cpt: "93000", category: "Monitoring"      },
  { id: "vitals",          name: "Vital Signs Monitoring",              cpt: "99213", category: "Monitoring"      },
  { id: "blood-glucose",   name: "Blood Glucose Monitoring",            cpt: "82947", category: "Monitoring"      },
  { id: "orthostatic-bp",  name: "Orthostatic Blood Pressure",          cpt: "93784", category: "Monitoring"      },
  { id: "spo2",            name: "Oxygen Saturation (SpO₂) Monitoring", cpt: "94760", category: "Monitoring"      },
  { id: "splinting",       name: "Splinting / Immobilisation",          cpt: "29125", category: "Orthopaedic"     },
  { id: "plaster",         name: "Plaster Cast Application",            cpt: "29405", category: "Orthopaedic"     },
  { id: "cast-removal",    name: "Cast Removal",                        cpt: "29700", category: "Orthopaedic"     },
  { id: "ear-syringing",   name: "Ear Syringing / Irrigation",          cpt: "69209", category: "ENT"             },
  { id: "nasal-packing",   name: "Nasal Packing",                       cpt: "30901", category: "ENT"             },
  { id: "sc-injection",    name: "Subcutaneous Injection",              cpt: "96372", category: "Other"           },
  { id: "id-injection",    name: "Intradermal Injection",               cpt: "96372", category: "Other"           },
  { id: "proctoscopy",     name: "Proctoscopy",                         cpt: "46600", category: "Other"           },
];

// ─── Section shape ────────────────────────────────────────────────────────────

interface CatSection {
  id:         string;
  name:       string;
  procedures: { id: string; name: string; cpt: string }[];
}

// ─── Admin catalogue loader ────────────────────────────────────────────────────

function buildSections(): CatSection[] {
  try {
    const raw = localStorage.getItem("ehr-procedure-sections-v1");
    if (raw) {
      const sections = JSON.parse(raw) as {
        id: string; name: string;
        procedures: { id: string; name: string; code?: string }[];
      }[];
      if (sections.length) {
        return sections.map(s => ({
          id: s.id,
          name: s.name,
          procedures: s.procedures.map(p => ({ id: p.id, name: p.name, cpt: p.code ?? "" })),
        }));
      }
    }
  } catch { /**/ }
  const map = new Map<string, CatSection>();
  for (const p of PROC_DEFS) {
    if (!map.has(p.category)) map.set(p.category, { id: p.category, name: p.category, procedures: [] });
    map.get(p.category)!.procedures.push({ id: p.id, name: p.name, cpt: p.cpt });
  }
  return [...map.values()];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function mkUid() { return Math.random().toString(36).slice(2, 9); }

// ─── Drawer ───────────────────────────────────────────────────────────────────

interface ProcedureOrdersDrawerProps {
  savedData: ProcedureOrdersData;
  onSave:    (d: ProcedureOrdersData) => void;
  onClose:   () => void;
}

export function ProcedureOrdersDrawer({ savedData, onSave, onClose }: ProcedureOrdersDrawerProps) {
  const [sections]  = useState<CatSection[]>(buildSections);
  const categories  = sections.map(s => s.name);

  const [selectedIds,      setSelectedIds]      = useState<string[]>(() => savedData.orders.map(o => o.id));
  const [instructions,     setInstructions]      = useState(savedData.instructions ?? "");
  const [search,           setSearch]            = useState("");
  const [selectedCategory, setSelectedCategory]  = useState(() => categories[0] ?? "");
  const [collapsed,        setCollapsed]         = useState<Record<string, boolean>>({});
  const catTabsRef = useRef<HTMLDivElement>(null);

  const isSearching = search.trim().length > 0;

  const displaySections: CatSection[] = isSearching
    ? sections.map(s => ({
        ...s,
        procedures: s.procedures.filter(p =>
          p.name.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(s => s.procedures.length > 0)
    : sections.filter(s => s.name === selectedCategory);

  function toggleId(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function handleCommit() {
    const allProcs = sections.flatMap(s => s.procedures);
    const orders: ProcedureOrder[] = selectedIds.map(id => {
      const existing = savedData.orders.find(o => o.id === id);
      if (existing) return existing;
      const def = allProcs.find(p => p.id === id);
      return { uid: mkUid(), id, name: def?.name ?? id, cpt: def?.cpt ?? "" };
    });
    onSave({ orders, instructions });
    onClose();
  }

  const selectedCount = selectedIds.length;
  const isDirty = JSON.stringify([...selectedIds].sort()) !== JSON.stringify([...savedData.orders.map(o => o.id)].sort()) || instructions !== (savedData.instructions ?? "");

  return (
    <div className="absolute inset-y-0 right-0 w-[68%] z-20 flex flex-col bg-white border-l border-slate-200 shadow-2xl">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#0d948812 0%,#10b98112 100%)" }}>
        <button className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0" onClick={onClose}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: ACCENT }}>
          <Stethoscope className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-800">Procedure Orders</p>
          <p className="text-[10px] text-slate-500">
            {selectedCount > 0 ? `${selectedCount} procedure${selectedCount !== 1 ? "s" : ""} selected` : "Select procedures to order"}
          </p>
        </div>
        <button
          onClick={handleCommit}
          disabled={!isDirty}
          className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl text-white flex-shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40"
          style={{ backgroundColor: ACCENT }}>
          <ClipboardCheck className="h-3.5 w-3.5" />
          {savedData.orders.length > 0 ? "Update" : "Mark Done"}
        </button>
      </div>

      {/* ── Search bar ── */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl focus-within:ring-1 focus-within:ring-teal-300 focus-within:border-teal-300 transition-all">
          <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400"
            placeholder="Search procedures…"
            value={search}
            onChange={e => setSearch(e.target.value)} />
          {search && (
            <button className="text-slate-300 hover:text-slate-500" onClick={() => setSearch("")}>
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Category tabs ── */}
      {!isSearching && (
        <div className="flex items-center gap-1 px-2 pb-2 flex-shrink-0">
          <button
            onClick={() => catTabsRef.current?.scrollBy({ left: -160, behavior: "smooth" })}
            className="flex-shrink-0 p-1.5 rounded-full border border-slate-200 bg-white shadow-sm text-slate-500 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div
            ref={catTabsRef}
            className="flex gap-1 overflow-x-auto flex-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
            {categories.map(cat => {
              const selInCat = sections.find(s => s.name === cat)?.procedures.filter(p => selectedIds.includes(p.id)).length ?? 0;
              const active   = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={[
                    "flex items-center gap-1 flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all",
                    active
                      ? "text-white border-transparent"
                      : "text-slate-500 border-slate-200 hover:border-teal-200 hover:text-teal-600",
                  ].join(" ")}
                  style={active ? { backgroundColor: ACCENT } : {}}>
                  {cat}
                  {selInCat > 0 && (
                    <span className={`text-[9px] font-black px-1 rounded-full leading-none py-0.5 ${active ? "bg-white/30 text-white" : "bg-teal-100 text-teal-700"}`}>
                      {selInCat}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => catTabsRef.current?.scrollBy({ left: 160, behavior: "smooth" })}
            className="flex-shrink-0 p-1.5 rounded-full border border-slate-200 bg-white shadow-sm text-slate-500 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 transition-colors">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Procedure list ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        {displaySections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Stethoscope className="h-8 w-8 text-slate-200 mb-2" />
            <p className="text-sm font-bold text-slate-400">No procedures found</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {displaySections.map(section => {
              const isOpen  = isSearching || !collapsed[section.name];
              const selCount = section.procedures.filter(p => selectedIds.includes(p.id)).length;
              return (
                <div key={section.id}>
                  {isSearching ? (
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1 pt-3 pb-1.5">
                      {section.name}
                    </p>
                  ) : (
                    <button
                      onClick={() => setCollapsed(prev => ({ ...prev, [section.name]: !collapsed[section.name] }))}
                      className="w-full flex items-center gap-2 px-2 py-2 text-left hover:bg-slate-50 rounded-lg transition-colors">
                      {isOpen
                        ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        : <ChevronRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />}
                      <span className="text-xs font-bold text-slate-600 flex-1">{section.name}</span>
                      {selCount > 0 && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700">
                          {selCount} selected
                        </span>
                      )}
                    </button>
                  )}

                  {isOpen && section.procedures.map(proc => {
                    const isSelected = selectedIds.includes(proc.id);
                    return (
                      <button
                        key={proc.id}
                        onClick={() => toggleId(proc.id)}
                        className={[
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border mb-0.5",
                          isSelected
                            ? "border-teal-200 bg-teal-50"
                            : "border-transparent hover:border-slate-200 hover:bg-slate-50",
                        ].join(" ")}>
                        <div
                          className="h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={isSelected
                            ? { backgroundColor: ACCENT, borderColor: ACCENT }
                            : { borderColor: "#cbd5e1" }}>
                          {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                        <span className="flex-1 text-xs font-medium text-slate-700">{proc.name}</span>
                        {proc.cpt && (
                          <span className="text-[9px] font-mono text-teal-500 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded flex-shrink-0">
                            CPT {proc.cpt}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Special Instructions ── */}
      <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0 bg-slate-50/60">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Special Instructions</p>
        <textarea
          rows={2}
          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-teal-300 resize-none"
          placeholder="Applies to all selected procedures…"
          value={instructions}
          onChange={e => setInstructions(e.target.value)} />
      </div>

    </div>
  );
}

// ─── Chips Panel ──────────────────────────────────────────────────────────────

interface ProcedureOrdersChipsPanelProps {
  data:   ProcedureOrdersData;
  onOpen: () => void;
}

export function ProcedureOrdersChipsPanel({ data, onOpen }: ProcedureOrdersChipsPanelProps) {
  if (data.orders.length === 0 && !data.instructions) {
    return (
      <button onClick={onOpen}
        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl bg-teal-50/60 border-2 border-dashed border-teal-200 text-teal-500 font-bold text-xs hover:border-teal-400 hover:bg-teal-50 transition-all">
        <Plus className="h-4 w-4 flex-shrink-0" />
        Order a procedure…
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {data.orders.map(o => (
        <div key={o.uid} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-teal-100 bg-teal-50/40">
          <Stethoscope className="h-3.5 w-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black text-teal-800">{o.name}</p>
            {o.cpt && (
              <p className="text-[10px] font-mono text-teal-500 mt-0.5">CPT {o.cpt}</p>
            )}
          </div>
        </div>
      ))}
      {data.instructions && (
        <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
          <p className="text-[9px] font-black text-amber-600 uppercase tracking-wide">Special Instructions</p>
          <p className="text-[10px] text-amber-700 mt-0.5">{data.instructions}</p>
        </div>
      )}
      <button onClick={onOpen}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl border border-teal-200 text-teal-500 text-xs font-bold hover:bg-teal-50 transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Edit procedure orders ({data.orders.length})
      </button>
    </div>
  );
}
