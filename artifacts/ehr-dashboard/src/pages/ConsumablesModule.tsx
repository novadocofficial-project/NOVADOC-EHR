import { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit2, X, Search, ChevronDown, ChevronRight,
  CheckCircle2, FileText, RotateCcw, EyeOff, Eye,
  Save, Upload, AlertCircle, Package, Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ACCENT         = "#4982CF";
const CATALOGUE_KEY  = "ehr-consumables-catalogue-v1";
const PROVIDERS_KEY  = "ehr-consumables-providers-v1";

function uid() { return `con-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ConsumableItem {
  id:       string;
  name:     string;
  category: string;
  unit:     string;
  enabled:  boolean;
  deleted:  boolean;
}

export type ConsumableProviderType = "In-House Store" | "External Supplier";

export interface ConsumableProvider {
  id:            string;
  name:          string;
  type:          ConsumableProviderType;
  contact:       string;
  active:        boolean;
  selectedItems: string[];
  costPrice:     Record<string, string>;
  sellingPrice:  Record<string, string>;
}

// ─── Seed data ──────────────────────────────────────────────────────────────────

const KNOWN_CATEGORIES = [
  "Wound Care",
  "Syringes & Needles",
  "Gloves & PPE",
  "IV Supplies",
  "Dressings",
  "Diagnostic Supplies",
];

const KNOWN_UNITS = ["piece", "box", "pack", "ml", "roll", "pair", "set", "vial"];

const SEED_ITEMS: Omit<ConsumableItem, "enabled" | "deleted">[] = [
  // Wound Care
  { id: "con-wc1",  name: "Gauze Swabs 4x4",            category: "Wound Care",         unit: "pack"  },
  { id: "con-wc2",  name: "Cotton Roll",                 category: "Wound Care",         unit: "roll"  },
  { id: "con-wc3",  name: "Adhesive Tape (2.5cm)",       category: "Wound Care",         unit: "roll"  },
  { id: "con-wc4",  name: "Suture Material (Vicryl 2-0)",category: "Wound Care",         unit: "box"   },
  { id: "con-wc5",  name: "Suture Material (Nylon 3-0)", category: "Wound Care",         unit: "box"   },
  // Syringes & Needles
  { id: "con-sn1",  name: "5ml Syringe",                 category: "Syringes & Needles", unit: "box"   },
  { id: "con-sn2",  name: "10ml Syringe",                category: "Syringes & Needles", unit: "box"   },
  { id: "con-sn3",  name: "20ml Syringe",                category: "Syringes & Needles", unit: "box"   },
  { id: "con-sn4",  name: "Needle 18G",                  category: "Syringes & Needles", unit: "box"   },
  { id: "con-sn5",  name: "Needle 22G",                  category: "Syringes & Needles", unit: "box"   },
  { id: "con-sn6",  name: "IV Cannula 18G",              category: "Syringes & Needles", unit: "piece" },
  { id: "con-sn7",  name: "IV Cannula 20G",              category: "Syringes & Needles", unit: "piece" },
  // Gloves & PPE
  { id: "con-ppe1", name: "Examination Gloves Small",    category: "Gloves & PPE",       unit: "box"   },
  { id: "con-ppe2", name: "Examination Gloves Medium",   category: "Gloves & PPE",       unit: "box"   },
  { id: "con-ppe3", name: "Examination Gloves Large",    category: "Gloves & PPE",       unit: "box"   },
  { id: "con-ppe4", name: "Surgical Mask",               category: "Gloves & PPE",       unit: "box"   },
  { id: "con-ppe5", name: "N95 Respirator",              category: "Gloves & PPE",       unit: "piece" },
  { id: "con-ppe6", name: "Face Shield",                 category: "Gloves & PPE",       unit: "piece" },
  // IV Supplies
  { id: "con-iv1",  name: "IV Administration Set",       category: "IV Supplies",        unit: "piece" },
  { id: "con-iv2",  name: "Blood Transfusion Set",       category: "IV Supplies",        unit: "piece" },
  { id: "con-iv3",  name: "Scalp Vein Set (21G)",        category: "IV Supplies",        unit: "piece" },
  { id: "con-iv4",  name: "3-Way Stopcock",              category: "IV Supplies",        unit: "piece" },
  // Dressings
  { id: "con-dr1",  name: "Non-Adherent Dressing",       category: "Dressings",          unit: "pack"  },
  { id: "con-dr2",  name: "Transparent Film Dressing",   category: "Dressings",          unit: "pack"  },
  { id: "con-dr3",  name: "Hydrocolloid Dressing",       category: "Dressings",          unit: "piece" },
  // Diagnostic Supplies
  { id: "con-dx1",  name: "Blood Collection Tube (EDTA)","category": "Diagnostic Supplies", unit: "box" },
  { id: "con-dx2",  name: "Blood Collection Tube (Plain)","category": "Diagnostic Supplies", unit: "box" },
  { id: "con-dx3",  name: "Urine Collection Cup",        category: "Diagnostic Supplies", unit: "piece" },
  { id: "con-dx4",  name: "Lancets",                     category: "Diagnostic Supplies", unit: "box"   },
  { id: "con-dx5",  name: "Tongue Depressor",            category: "Diagnostic Supplies", unit: "pack"  },
];

const SEED_PROVIDERS: ConsumableProvider[] = [
  {
    id: "cprov-1", name: "Central Store", type: "In-House Store",
    contact: "", active: true,
    selectedItems: ["con-wc1","con-wc2","con-wc3","con-sn1","con-sn2","con-sn6","con-ppe1","con-ppe2","con-iv1"],
    costPrice:    { "con-wc1": "150", "con-wc2": "80",  "con-wc3": "60",  "con-sn1": "200", "con-sn2": "250", "con-sn6": "45", "con-ppe1": "600", "con-ppe2": "600", "con-iv1": "80" },
    sellingPrice: { "con-wc1": "200", "con-wc2": "100", "con-wc3": "80",  "con-sn1": "280", "con-sn2": "320", "con-sn6": "60", "con-ppe1": "750", "con-ppe2": "750", "con-iv1": "100" },
  },
  {
    id: "cprov-2", name: "MedSupply Co.", type: "External Supplier",
    contact: "0321-5556677", active: true,
    selectedItems: ["con-sn3","con-sn4","con-sn5","con-sn7","con-ppe4","con-ppe5","con-iv2","con-iv3","con-dx1","con-dx2"],
    costPrice:    { "con-sn3": "300", "con-sn4": "180", "con-sn5": "180", "con-sn7": "40",  "con-ppe4": "400", "con-ppe5": "120", "con-iv2": "150", "con-iv3": "30", "con-dx1": "350", "con-dx2": "320" },
    sellingPrice: { "con-sn3": "380", "con-sn4": "240", "con-sn5": "240", "con-sn7": "55",  "con-ppe4": "500", "con-ppe5": "160", "con-iv2": "200", "con-iv3": "45", "con-dx1": "450", "con-dx2": "420" },
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Wound Care":          "#f97316",
  "Syringes & Needles":  "#8b5cf6",
  "Gloves & PPE":        "#10b981",
  "IV Supplies":         "#0ea5e9",
  "Dressings":           "#f59e0b",
  "Diagnostic Supplies": "#6366f1",
};

function seedItems(): ConsumableItem[] {
  try {
    const raw = localStorage.getItem(CATALOGUE_KEY);
    if (raw) return JSON.parse(raw) as ConsumableItem[];
  } catch { /**/ }
  return SEED_ITEMS.map(i => ({ ...i, enabled: true, deleted: false }));
}

function seedProviders(): ConsumableProvider[] {
  try {
    const raw = localStorage.getItem(PROVIDERS_KEY);
    if (raw) return JSON.parse(raw) as ConsumableProvider[];
  } catch { /**/ }
  return [...SEED_PROVIDERS];
}

// ─── Tab 1: Consumable Items ────────────────────────────────────────────────────

interface InlineEdit { name: string; category: string; customCat: string; unit: string; }

function ConsumableItemsTab({
  items, setItems,
}: {
  items:    ConsumableItem[];
  setItems: React.Dispatch<React.SetStateAction<ConsumableItem[]>>;
}) {
  const [search,       setSearch]       = useState("");
  const [filterCat,    setFilterCat]    = useState("All");
  const [showInactive, setShowInactive] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const [editId,   setEditId]   = useState<string | null>(null);
  const [editData, setEditData] = useState<InlineEdit>({ name: "", category: KNOWN_CATEGORIES[0], customCat: "", unit: KNOWN_UNITS[0] });

  const [addOpen,   setAddOpen]   = useState(false);
  const [addName,   setAddName]   = useState("");
  const [addCatVal, setAddCatVal] = useState(KNOWN_CATEGORIES[0]);
  const [addCustom, setAddCustom] = useState("");
  const [addUnit,   setAddUnit]   = useState(KNOWN_UNITS[0]);

  const categories    = Array.from(new Set(items.map(i => i.category))).sort();
  const allCatOptions = [...new Set([...KNOWN_CATEGORIES, ...categories])];

  function isVisible(i: ConsumableItem) {
    if (i.deleted   && !showInactive) return false;
    if (!i.enabled  && !showInactive) return false;
    if (filterCat !== "All" && i.category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.unit.toLowerCase().includes(q);
    }
    return true;
  }

  const visible = items.filter(isVisible);
  const grouped: { cat: string; items: ConsumableItem[] }[] = [];
  const seen = new Set<string>();
  for (const i of visible) {
    if (!seen.has(i.category)) { seen.add(i.category); grouped.push({ cat: i.category, items: [] }); }
    grouped.find(g => g.cat === i.category)!.items.push(i);
  }

  function isCatExpanded(cat: string) { return expandedCats[cat] !== false; }
  function toggleCat(cat: string) { setExpandedCats(p => ({ ...p, [cat]: !isCatExpanded(cat) })); }

  function softDelete(id: string) {
    setItems(p => p.map(i => i.id === id ? { ...i, deleted: true, enabled: false } : i));
    if (editId === id) setEditId(null);
  }
  function restore(id: string) {
    setItems(p => p.map(i => i.id === id ? { ...i, deleted: false, enabled: true } : i));
  }
  function toggleEnabled(id: string) {
    setItems(p => p.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  }

  function startEdit(i: ConsumableItem) {
    const knownCat = KNOWN_CATEGORIES.includes(i.category) || categories.includes(i.category);
    setEditId(i.id);
    setEditData({ name: i.name, category: knownCat ? i.category : "__custom__", customCat: knownCat ? "" : i.category, unit: i.unit });
  }

  function saveEdit(id: string) {
    const name = editData.name.trim();
    const cat  = editData.category === "__custom__" ? editData.customCat.trim() : editData.category;
    if (!name || !cat) return;
    setItems(p => p.map(i => i.id === id ? { ...i, name, category: cat, unit: editData.unit } : i));
    setEditId(null);
  }

  function addItem() {
    const name = addName.trim();
    const cat  = addCatVal === "__custom__" ? addCustom.trim() : addCatVal;
    if (!name || !cat) return;
    setItems(p => [...p, { id: uid(), name, category: cat, unit: addUnit, enabled: true, deleted: false }]);
    setAddName(""); setAddCustom(""); setAddOpen(false);
  }

  function exportCSV() {
    const rows = [["Category", "Item Name", "Unit", "Enabled"]];
    items.filter(i => i.enabled && !i.deleted).forEach(i => rows.push([i.category, i.name, i.unit, "Yes"]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "consumables-catalogue.csv";
    a.click();
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search item name, category, unit…" className="pl-8 h-8 text-xs" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["All", ...categories].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterCat === c ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
              style={filterCat === c ? { background: CATEGORY_COLORS[c] ?? ACCENT } : {}}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <button onClick={() => setShowInactive(s => !s)}
            className={`flex items-center gap-1 text-xs border px-2.5 py-1 rounded-full transition-colors ${
              showInactive ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}>
            {showInactive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {showInactive ? "Hide Inactive" : "Include Inactive"}
          </button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="h-8 text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => { setAddOpen(true); setAddName(""); setAddCatVal(KNOWN_CATEGORIES[0]); setAddCustom(""); setAddUnit(KNOWN_UNITS[0]); }}
            style={{ background: ACCENT }} className="text-white text-xs gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" /> Add Item
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Global inline add row */}
        {addOpen && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-[#4982CF]/50 bg-[#4982CF]/5 flex-wrap">
            <Package className="h-3.5 w-3.5 text-[#4982CF] flex-shrink-0" />
            <Input value={addName} onChange={e => setAddName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addItem()}
              placeholder="Item name…" className="h-7 text-xs flex-1 min-w-32 max-w-xs" autoFocus />
            <select value={addCatVal} onChange={e => setAddCatVal(e.target.value)}
              className="h-7 text-xs rounded-md border border-slate-200 bg-white px-2 outline-none focus:ring-1 focus:ring-[#4982CF]/40">
              {allCatOptions.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__custom__">+ Custom…</option>
            </select>
            {addCatVal === "__custom__" && (
              <Input value={addCustom} onChange={e => setAddCustom(e.target.value)}
                placeholder="Category name" className="h-7 text-xs w-32" />
            )}
            <select value={addUnit} onChange={e => setAddUnit(e.target.value)}
              className="h-7 text-xs rounded-md border border-slate-200 bg-white px-2 outline-none focus:ring-1 focus:ring-[#4982CF]/40">
              {KNOWN_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <button onClick={addItem}
              className="p-1.5 rounded hover:bg-[#4982CF] hover:text-white text-[#4982CF] transition-colors" title="Save item">
              <CheckCircle2 className="h-4 w-4" />
            </button>
            <button onClick={() => setAddOpen(false)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {visible.length === 0 && !addOpen && (
          <div className="text-center py-16 text-slate-400 text-sm">No items match your filter.</div>
        )}

        {grouped.map(({ cat, items: catItems }) => {
          const color    = CATEGORY_COLORS[cat] ?? "#64748b";
          const expanded = isCatExpanded(cat);
          return (
            <div key={cat}>
              <button className="flex items-center gap-2 w-full text-left mb-2 group" onClick={() => toggleCat(cat)}>
                <span className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{cat}</span>
                <span className="text-[10px] text-slate-400 ml-1">{catItems.length} item{catItems.length !== 1 ? "s" : ""}</span>
                <span className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors">
                  {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              </button>

              {expanded && (
                <div className="space-y-1 pl-4 border-l-2" style={{ borderColor: `${color}40` }}>
                  {catItems.map(i => {
                    const isEditing  = editId === i.id;
                    const isDisabled = !i.enabled || i.deleted;

                    if (isEditing) {
                      return (
                        <div key={i.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#4982CF]/40 bg-[#4982CF]/5 flex-wrap">
                          <Package className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
                          <Input
                            value={editData.name}
                            onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && saveEdit(i.id)}
                            className="h-7 text-xs flex-1 min-w-28 max-w-xs" autoFocus
                          />
                          <select
                            value={editData.category}
                            onChange={e => setEditData(d => ({ ...d, category: e.target.value, customCat: "" }))}
                            className="h-7 text-xs rounded-md border border-slate-200 bg-white px-2 outline-none focus:ring-1 focus:ring-[#4982CF]/40">
                            {allCatOptions.map(c => <option key={c} value={c}>{c}</option>)}
                            <option value="__custom__">+ Custom…</option>
                          </select>
                          {editData.category === "__custom__" && (
                            <Input
                              value={editData.customCat}
                              onChange={e => setEditData(d => ({ ...d, customCat: e.target.value }))}
                              placeholder="Category…" className="h-7 text-xs w-28"
                            />
                          )}
                          <select
                            value={editData.unit}
                            onChange={e => setEditData(d => ({ ...d, unit: e.target.value }))}
                            className="h-7 text-xs rounded-md border border-slate-200 bg-white px-2 outline-none focus:ring-1 focus:ring-[#4982CF]/40">
                            {KNOWN_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <button onClick={() => saveEdit(i.id)} title="Save"
                            className="p-1.5 rounded hover:bg-[#4982CF] hover:text-white text-[#4982CF] transition-colors">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditId(null)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div key={i.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border bg-white group transition-all ${
                          i.deleted  ? "border-dashed border-red-200 opacity-60"
                          : !i.enabled ? "border-slate-100 opacity-60"
                          : "border-slate-200 hover:border-slate-300"
                        }`}>
                        <Package className="h-3.5 w-3.5 flex-shrink-0" style={{ color: isDisabled ? "#cbd5e1" : color }} />
                        <span className={`flex-1 text-sm font-medium ${isDisabled ? "text-slate-400" : "text-slate-800"}`}>
                          {i.name}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded font-mono">
                          {i.unit}
                        </span>
                        {i.deleted && (
                          <span className="text-[10px] font-semibold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0 rounded">Deleted</span>
                        )}
                        {!i.deleted && !i.enabled && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0 rounded">Disabled</span>
                        )}
                        {i.deleted ? (
                          <button onClick={() => restore(i.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors">
                            <RotateCcw className="h-3 w-3" /> Restore
                          </button>
                        ) : (
                          <>
                            <Switch checked={i.enabled} onCheckedChange={() => toggleEnabled(i.id)}
                              className="data-[state=checked]:bg-[#4982CF]" />
                            <button onClick={() => startEdit(i)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-all">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => softDelete(i.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab 2: Consumable Providers ────────────────────────────────────────────────

const PROVIDER_TYPE_COLORS: Record<ConsumableProviderType, string> = {
  "In-House Store":   "bg-blue-50 text-blue-600 border-blue-200",
  "External Supplier":"bg-amber-50 text-amber-600 border-amber-200",
};

function ConsumableProvidersTab({
  providers, setProviders, items,
}: {
  providers:    ConsumableProvider[];
  setProviders: React.Dispatch<React.SetStateAction<ConsumableProvider[]>>;
  items:        ConsumableItem[];
}) {
  const [step,      setStep]      = useState<1 | 2>(1);
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; type: ConsumableProviderType; contact: string }>({
    name: "", type: "In-House Store", contact: "",
  });
  const [selected,     setSelected]     = useState<string[]>([]);
  const [costPrice,    setCostPrice]    = useState<Record<string, string>>({});
  const [sellingPrice, setSellingPrice] = useState<Record<string, string>>({});
  const [deleteId,     setDeleteId]     = useState<string | null>(null);
  const [expandId,     setExpandId]     = useState<string | null>(null);
  const [importProviderId, setImportProviderId] = useState<string | null>(null);
  const [importText,       setImportText]       = useState("");
  const [importResult,     setImportResult]     = useState<{ matched: number; unmatched: string[] } | null>(null);
  const [modalSearch,      setModalSearch]      = useState("");

  const activeItems    = items.filter(i => i.enabled && !i.deleted);
  const itemCategories = Array.from(new Set(activeItems.map(i => i.category))).sort();

  const filteredModalItems = modalSearch
    ? activeItems.filter(i =>
        i.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
        i.category.toLowerCase().includes(modalSearch.toLowerCase())
      )
    : activeItems;

  const modalCategories = Array.from(new Set(filteredModalItems.map(i => i.category))).sort();

  function openNew() {
    setForm({ name: "", type: "In-House Store", contact: "" });
    setSelected([]); setCostPrice({}); setSellingPrice({});
    setEditId(null); setStep(1); setModalSearch(""); setShowModal(true);
  }

  function openEdit(p: ConsumableProvider) {
    setForm({ name: p.name, type: p.type, contact: p.contact });
    setSelected([...p.selectedItems]);
    setCostPrice({ ...p.costPrice });
    setSellingPrice({ ...p.sellingPrice });
    setEditId(p.id); setStep(1); setModalSearch(""); setShowModal(true);
  }

  function save() {
    const data: ConsumableProvider = {
      id:            editId ?? uid(),
      name:          form.name.trim(),
      type:          form.type,
      contact:       form.contact,
      active:        editId ? (providers.find(p => p.id === editId)?.active ?? true) : true,
      selectedItems: selected,
      costPrice,
      sellingPrice,
    };
    if (editId) setProviders(ps => ps.map(p => p.id === editId ? data : p));
    else        setProviders(ps => [...ps, data]);
    setShowModal(false);
  }

  function importPricing(providerId: string) {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return;
    const lines = importText.trim().split("\n").map(l =>
      l.split(",").map(s => s.trim().replace(/^"|"$/g, ""))
    );
    const newCP  = { ...provider.costPrice };
    const newSP  = { ...provider.sellingPrice };
    const matched: string[] = [];
    const unmatched: string[] = [];
    lines.forEach(([name, cp, sp]) => {
      const item = activeItems.find(i => i.name.toLowerCase() === name?.toLowerCase());
      if (item && cp) {
        newCP[item.id] = cp;
        if (sp) newSP[item.id] = sp;
        matched.push(name);
      } else if (name) {
        unmatched.push(name);
      }
    });
    setProviders(ps => ps.map(p =>
      p.id === providerId ? { ...p, costPrice: newCP, sellingPrice: newSP } : p
    ));
    setImportResult({ matched: matched.length, unmatched });
    setImportText("");
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Manage internal stores and external suppliers — configure cost and selling price per item.
        </p>
        <Button onClick={openNew} className="h-8 text-xs gap-1.5 text-white" style={{ background: ACCENT }}>
          <Plus className="h-3.5 w-3.5" /> New Provider
        </Button>
      </div>

      {/* Provider cards */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {providers.length === 0 && (
          <div className="text-center py-16 text-slate-300">
            <Truck className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm font-semibold">No providers yet</p>
            <p className="text-xs mt-1">Add your first store or supplier above</p>
          </div>
        )}

        {providers.map(p => {
          const isExpanded  = expandId === p.id;
          const itemCount   = p.selectedItems.filter(id => activeItems.some(i => i.id === id)).length;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Truck className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-800">{p.name}</p>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${PROVIDER_TYPE_COLORS[p.type]}`}>{p.type}</Badge>
                    {!p.active && <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-slate-50 text-slate-400 border-slate-200">Inactive</Badge>}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {p.contact || "No contact"} · {itemCount} item{itemCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <Switch
                  checked={p.active}
                  onCheckedChange={v => setProviders(ps => ps.map(x => x.id === p.id ? { ...x, active: v } : x))}
                  className="data-[state=checked]:bg-[#4982CF]"
                />
                <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF]">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setExpandId(isExpanded ? null : p.id)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Expanded pricing panel */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex-1">Item Pricing</p>
                    <button
                      onClick={() => { setImportProviderId(importProviderId === p.id ? null : p.id); setImportResult(null); setImportText(""); }}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#4982CF] hover:opacity-80">
                      <Upload className="h-3 w-3" /> Import CSV
                    </button>
                  </div>

                  {importProviderId === p.id && (
                    <div className="px-4 py-3 bg-blue-50/40 border-b border-[#4982CF]/20 space-y-2">
                      <p className="text-[10px] text-slate-500">
                        Paste CSV: <span className="font-mono">Item Name, Cost Price (PKR), Selling Price (PKR)</span> (one per line)
                      </p>
                      <textarea
                        value={importText} onChange={e => setImportText(e.target.value)} rows={4}
                        className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#4982CF] resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <Button onClick={() => importPricing(p.id)} className="h-7 text-xs text-white px-3" style={{ background: ACCENT }}>Apply</Button>
                        <Button variant="outline" onClick={() => { setImportProviderId(null); setImportResult(null); }} className="h-7 text-xs px-3">Cancel</Button>
                        {importResult && (
                          <span className="text-[10px] text-slate-500">
                            {importResult.matched} matched{importResult.unmatched.length > 0 && `, ${importResult.unmatched.length} unmatched`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="max-h-72 overflow-y-auto">
                    {p.selectedItems.length === 0 ? (
                      <p className="px-4 py-6 text-center text-slate-300 text-xs">No items selected for this provider</p>
                    ) : (
                      itemCategories.map(cat => {
                        const catItems = activeItems.filter(i => i.category === cat && p.selectedItems.includes(i.id));
                        if (catItems.length === 0) return null;
                        const color = CATEGORY_COLORS[cat] ?? "#64748b";
                        return (
                          <div key={cat}>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0">
                              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{cat}</p>
                            </div>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-50">
                                  <th className="text-left px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">Item</th>
                                  <th className="text-left px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 w-16">Unit</th>
                                  <th className="text-right px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 w-32">Cost Price (PKR)</th>
                                  <th className="text-right px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 w-32">Selling Price (PKR)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {catItems.map(i => (
                                  <tr key={i.id} className="border-b border-slate-50 last:border-0">
                                    <td className="px-4 py-1.5 text-slate-700">{i.name}</td>
                                    <td className="px-4 py-1.5 text-slate-400 text-[10px] font-mono">{i.unit}</td>
                                    <td className="px-4 py-1.5 text-right">
                                      <Input
                                        value={p.costPrice[i.id] ?? ""}
                                        onChange={e => setProviders(ps => ps.map(x =>
                                          x.id === p.id ? { ...x, costPrice: { ...x.costPrice, [i.id]: e.target.value } } : x
                                        ))}
                                        placeholder="0.00" className="h-6 text-xs text-right w-28 ml-auto"
                                      />
                                    </td>
                                    <td className="px-4 py-1.5 text-right">
                                      <Input
                                        value={p.sellingPrice[i.id] ?? ""}
                                        onChange={e => setProviders(ps => ps.map(x =>
                                          x.id === p.id ? { ...x, sellingPrice: { ...x.sellingPrice, [i.id]: e.target.value } } : x
                                        ))}
                                        placeholder="0.00" className="h-6 text-xs text-right w-28 ml-auto"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={showModal} onOpenChange={v => !v && setShowModal(false)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editId ? "Edit Provider" : "New Consumable Provider"}
              <span className="ml-auto text-xs font-normal text-slate-400">Step {step} of 2</span>
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2].map(s => (
              <div key={s} className={`flex items-center gap-2 ${s < 2 ? "flex-1" : ""}`}>
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black ${step >= s ? "text-white" : "bg-slate-100 text-slate-400"}`}
                  style={step >= s ? { background: ACCENT } : {}}
                >{s}</div>
                <span className={`text-xs font-medium ${step === s ? "text-[#4982CF]" : "text-slate-400"}`}>
                  {s === 1 ? "Provider Details" : "Item Selection & Pricing"}
                </span>
                {s < 2 && <div className="flex-1 h-px bg-slate-200" />}
              </div>
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600">Provider Name <span className="text-red-400">*</span></label>
                  <Input
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Central Store" className="h-9 text-sm mt-1" autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Type</label>
                  <select
                    value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ConsumableProviderType }))}
                    className="w-full h-9 text-sm border border-slate-200 rounded-lg px-3 focus:outline-none mt-1 bg-white">
                    <option>In-House Store</option>
                    <option>External Supplier</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600">
                    Contact Info{" "}
                    {form.type === "External Supplier" && <span className="text-slate-400 font-normal">(recommended for external)</span>}
                  </label>
                  <Input
                    value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                    placeholder="Phone / email / contract ref" className="h-9 text-sm mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowModal(false)} className="h-9 text-sm">Cancel</Button>
                <Button
                  disabled={!form.name.trim()} onClick={() => setStep(2)}
                  className="h-9 text-sm text-white" style={{ background: ACCENT }}>
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-3 overflow-hidden flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input value={modalSearch} onChange={e => setModalSearch(e.target.value)}
                    placeholder="Search items…" className="pl-8 h-8 text-xs" />
                </div>
                <p className="text-xs text-slate-500 whitespace-nowrap">{selected.length} of {activeItems.length} selected</p>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(activeItems.map(i => i.id))} className="text-xs font-bold" style={{ color: ACCENT }}>Select All</button>
                  <button onClick={() => setSelected([])} className="text-xs font-bold text-slate-400">Clear</button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 border border-slate-100 rounded-xl">
                {modalCategories.map(cat => {
                  const catItems = filteredModalItems.filter(i => i.category === cat);
                  const color    = CATEGORY_COLORS[cat] ?? "#64748b";
                  return (
                    <div key={cat}>
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0 z-10 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{cat}</p>
                      </div>
                      {catItems.map(i => (
                        <div key={i.id} className="flex items-center gap-3 px-4 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                          <input
                            type="checkbox" checked={selected.includes(i.id)}
                            onChange={() => setSelected(ss => ss.includes(i.id) ? ss.filter(x => x !== i.id) : [...ss, i.id])}
                            className="accent-[#4982CF]"
                          />
                          <span className="flex-1 text-xs text-slate-700">{i.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-50 border border-slate-100 px-1.5 rounded">{i.unit}</span>
                          {selected.includes(i.id) && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">Cost</span>
                                <Input value={costPrice[i.id] ?? ""}
                                  onChange={e => setCostPrice(prev => ({ ...prev, [i.id]: e.target.value }))}
                                  placeholder="0.00" className="h-6 w-20 text-xs text-right" />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">Sell</span>
                                <Input value={sellingPrice[i.id] ?? ""}
                                  onChange={e => setSellingPrice(prev => ({ ...prev, [i.id]: e.target.value }))}
                                  placeholder="0.00" className="h-6 w-20 text-xs text-right" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
                {filteredModalItems.length === 0 && (
                  <p className="text-center text-xs text-slate-300 py-8">No items match your search</p>
                )}
              </div>

              <div className="flex justify-between gap-2 pt-1">
                <Button variant="outline" onClick={() => setStep(1)} className="h-9 text-sm">← Back</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowModal(false)} className="h-9 text-sm">Cancel</Button>
                  <Button onClick={save} className="h-9 text-sm text-white gap-1.5" style={{ background: ACCENT }}>
                    <Save className="h-3.5 w-3.5" /> Save Provider
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" /> Remove Provider
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Remove <strong>{providers.find(p => p.id === deleteId)?.name}</strong>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="h-8 text-sm">Cancel</Button>
            <Button
              onClick={() => { setProviders(ps => ps.filter(p => p.id !== deleteId)); setDeleteId(null); }}
              className="bg-rose-500 text-white h-8 text-sm">Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Module ────────────────────────────────────────────────────────────────

type TabKey = "items" | "providers";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "items",     label: "Consumable Items",     icon: <Package className="h-3.5 w-3.5" /> },
  { key: "providers", label: "Consumable Providers", icon: <Truck className="h-3.5 w-3.5" /> },
];

interface Props { initialTab?: TabKey; }

export function ConsumablesModule({ initialTab = "items" }: Props) {
  const [tab,       setTab]       = useState<TabKey>(initialTab);
  const [items,     setItems]     = useState<ConsumableItem[]>(seedItems);
  const [providers, setProviders] = useState<ConsumableProvider[]>(seedProviders);

  useEffect(() => { setTab(initialTab); }, [initialTab]);

  useEffect(() => {
    try { localStorage.setItem(CATALOGUE_KEY, JSON.stringify(items)); } catch { /**/ }
  }, [items]);

  useEffect(() => {
    try { localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers)); } catch { /**/ }
  }, [providers]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}18` }}>
            <Package className="h-4 w-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Consumables</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage consumable items, categories, and supplier pricing</p>
          </div>
        </div>
        <div className="flex gap-0.5 mt-4 bg-slate-100 rounded-lg p-0.5 w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === "items"     && <ConsumableItemsTab     items={items} setItems={setItems} />}
        {tab === "providers" && <ConsumableProvidersTab providers={providers} setProviders={setProviders} items={items} />}
      </div>
    </div>
  );
}

export { SEED_ITEMS as CONSUMABLE_SEED_ITEMS };
