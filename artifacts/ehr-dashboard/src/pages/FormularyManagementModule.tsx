import { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit2, Save, X, GripVertical, Search, ChevronDown,
  ChevronRight, CheckCircle2, Star, Pill, FileText, RotateCcw,
  EyeOff, Eye, Tag, AlertTriangle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MEDICINES } from "@/pages/FormularySection";

const ACCENT = "#4982CF";

// Shared localStorage keys — must match FormularySection.tsx
const FAVS_KEY      = "formulary_fav_brandIds";
const CATALOGUE_KEY = "ehr-formulary-catalogue-v1";

function uid() { return `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

function loadFavs(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(FAVS_KEY) ?? "[]")); } catch { return new Set(); }
}
function persistFavs(s: Set<string>) {
  localStorage.setItem(FAVS_KEY, JSON.stringify([...s]));
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Brand {
  id:       string;
  brand:    string;
  strength: string;
}

interface Generic {
  id:              string;
  generic:         string;
  category:        string;
  allergyKeywords: string[];
  brands:          Brand[];
  enabled:         boolean;
  deleted:         boolean;   // soft-delete flag
}

// ─── Default lists (mirroring FormularySection constants) ─────────────────────

const DEFAULT_ROUTES     = ["Oral","IV","IM","SC","Inhaled","Topical","Sublingual","Rectal"];
const DEFAULT_FREQUENCIES = [
  "Once daily (OD)","Twice daily (BID)","Three times daily (TID)","Four times daily (QID)",
  "Every 6 hours (q6h)","Every 8 hours (q8h)","Every 12 hours (q12h)","As needed (PRN)","Weekly","Monthly",
];
const DEFAULT_DURATIONS  = ["1 day","3 days","5 days","7 days","10 days","14 days","21 days","30 days","3 months","6 months","Ongoing"];
const DEFAULT_UNITS      = ["tablet(s)","capsule(s)","ml","dose(s)","drop(s)","puff(s)","sachet(s)"];

const LS_DEFAULTS_KEY = "ehr-formulary-defaults-v1";

function loadDefaults() {
  try {
    const raw = localStorage.getItem(LS_DEFAULTS_KEY);
    if (raw) return JSON.parse(raw) as { routes: string[]; frequencies: string[]; durations: string[]; units: string[] };
  } catch { /**/ }
  return { routes: DEFAULT_ROUTES, frequencies: DEFAULT_FREQUENCIES, durations: DEFAULT_DURATIONS, units: DEFAULT_UNITS };
}
function saveDefaults(data: { routes: string[]; frequencies: string[]; durations: string[]; units: string[] }) {
  localStorage.setItem(LS_DEFAULTS_KEY, JSON.stringify(data));
}

// ─── Seed generics from MEDICINES ─────────────────────────────────────────────

function seedGenerics(): Generic[] {
  try {
    const raw = localStorage.getItem(CATALOGUE_KEY);
    if (raw) return JSON.parse(raw) as Generic[];
  } catch { /**/ }
  return MEDICINES.map(m => ({
    id:              m.id,
    generic:         m.generic,
    category:        m.category,
    allergyKeywords: [...m.allergyKeywords],
    brands:          m.brands.map(b => ({ id: b.id, brand: b.brand, strength: b.strength })),
    enabled:         true,
    deleted:         false,
  }));
}

const CATEGORY_COLORS: Record<string, string> = {
  "Analgesics & Antipyretics": "#f97316",
  "NSAIDs":                    "#ef4444",
  "Antibiotics":               "#8b5cf6",
  "Antidiabetics":             "#10b981",
  "Cardiovascular":            "#4982CF",
  "Respiratory":               "#0ea5e9",
  "GI / Gastroprotective":     "#f59e0b",
};

// ─── Medicine Catalogue Tab ───────────────────────────────────────────────────

function MedicineCatalogueTab() {
  const [generics, setGenerics]       = useState<Generic[]>(seedGenerics);
  // Favourites — loaded from & saved to same key as the doctor drawer
  const [favs, setFavsState]          = useState<Set<string>>(() => loadFavs());
  const [search, setSearch]           = useState("");
  const [filterCat, setFilterCat]     = useState("All");
  const [showInactive, setShowInactive] = useState(false);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // Add/Edit generic drawer
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [draftName, setDraftName]     = useState("");
  const [draftCat, setDraftCat]       = useState("");
  const [draftCustomCat, setDraftCustomCat] = useState("");
  const [draftKeywords, setDraftKeywords]   = useState<string[]>([]);
  const [kwInput, setKwInput]         = useState("");

  // Brand inline editing
  const [brandEdit, setBrandEdit] = useState<{ genId: string; brandId: string; brand: string; strength: string } | null>(null);
  const [newBrand, setNewBrand]   = useState<Record<string, { brand: string; strength: string }>>({});

  // Persist catalogue to shared localStorage key whenever generics changes
  useEffect(() => {
    try { localStorage.setItem(CATALOGUE_KEY, JSON.stringify(generics)); } catch { /**/ }
  }, [generics]);

  const categories = Array.from(new Set(generics.map(g => g.category))).sort();

  function updateFavs(updated: Set<string>) {
    setFavsState(updated);
    persistFavs(updated);
  }

  function toggleBrandFav(brandId: string) {
    const next = new Set(favs);
    next.has(brandId) ? next.delete(brandId) : next.add(brandId);
    updateFavs(next);
  }

  // Determine if a generic is visible given current filters
  function isVisible(g: Generic) {
    if (g.deleted && !showInactive) return false;
    if (!g.enabled && !showInactive) return false;
    if (filterCat !== "All" && g.category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        g.generic.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.brands.some(b => b.brand.toLowerCase().includes(q) || b.strength.toLowerCase().includes(q))
      );
    }
    return true;
  }

  const visibleGenerics = generics.filter(isVisible);

  // Group visible generics by category (preserving order)
  const grouped: { cat: string; items: Generic[] }[] = [];
  const seen = new Set<string>();
  for (const g of visibleGenerics) {
    if (!seen.has(g.category)) { seen.add(g.category); grouped.push({ cat: g.category, items: [] }); }
    grouped.find(gr => gr.cat === g.category)!.items.push(g);
  }

  function toggleCat(cat: string) {
    setExpandedCats(prev => ({ ...prev, [cat]: prev[cat] === false ? true : false }));
  }
  function isCatExpanded(cat: string) { return expandedCats[cat] !== false; }

  // Soft-delete (trash icon): sets deleted=true, also disables
  function softDelete(id: string) {
    setGenerics(prev => prev.map(g => g.id === id ? { ...g, deleted: true, enabled: false } : g));
    if (expandedId === id) setExpandedId(null);
  }

  // Restore: clears deleted flag, re-enables
  function restoreGeneric(id: string) {
    setGenerics(prev => prev.map(g => g.id === id ? { ...g, deleted: false, enabled: true } : g));
  }

  function toggleEnabled(id: string) {
    setGenerics(prev => prev.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g));
  }

  function openAdd() {
    setEditingId(null); setDraftName(""); setDraftCat(categories[0] ?? ""); setDraftCustomCat("");
    setDraftKeywords([]); setKwInput(""); setDrawerOpen(true);
  }
  function openEdit(g: Generic, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(g.id); setDraftName(g.generic);
    setDraftCat(categories.includes(g.category) ? g.category : "__custom__");
    setDraftCustomCat(categories.includes(g.category) ? "" : g.category);
    setDraftKeywords([...g.allergyKeywords]); setKwInput(""); setDrawerOpen(true);
  }
  function addKeyword() {
    const kw = kwInput.trim();
    if (!kw || draftKeywords.includes(kw)) return;
    setDraftKeywords(prev => [...prev, kw]); setKwInput("");
  }
  function saveDrawer() {
    const name = draftName.trim();
    const cat  = draftCat === "__custom__" ? draftCustomCat.trim() : draftCat;
    if (!name || !cat) return;
    if (editingId) {
      setGenerics(prev => prev.map(g => g.id === editingId ? { ...g, generic: name, category: cat, allergyKeywords: draftKeywords } : g));
    } else {
      setGenerics(prev => [...prev, { id: uid(), generic: name, category: cat, allergyKeywords: draftKeywords, brands: [], enabled: true, deleted: false }]);
    }
    setDrawerOpen(false);
  }

  function startBrandEdit(genId: string, b: Brand) { setBrandEdit({ genId, brandId: b.id, brand: b.brand, strength: b.strength }); }
  function saveBrandEdit() {
    if (!brandEdit) return;
    setGenerics(prev => prev.map(g => g.id === brandEdit.genId
      ? { ...g, brands: g.brands.map(b => b.id === brandEdit.brandId ? { ...b, brand: brandEdit.brand, strength: brandEdit.strength } : b) }
      : g
    ));
    setBrandEdit(null);
  }
  function deleteBrand(genId: string, brandId: string) {
    setGenerics(prev => prev.map(g => g.id === genId ? { ...g, brands: g.brands.filter(b => b.id !== brandId) } : g));
    const next = new Set(favs); next.delete(brandId); updateFavs(next);
  }
  function addBrand(genId: string) {
    const nb = newBrand[genId];
    if (!nb?.brand?.trim()) return;
    setGenerics(prev => prev.map(g => g.id === genId
      ? { ...g, brands: [...g.brands, { id: uid(), brand: nb.brand.trim(), strength: nb.strength.trim() }] }
      : g
    ));
    setNewBrand(prev => ({ ...prev, [genId]: { brand: "", strength: "" } }));
  }

  function exportCSV() {
    const rows = [["Generic","Category","Allergy Keywords","Brand","Strength","Favourite","Enabled"]];
    generics.filter(g => g.enabled && !g.deleted).forEach(g => {
      if (g.brands.length === 0) {
        rows.push([g.generic, g.category, g.allergyKeywords.join("; "), "", "", "", g.enabled ? "Yes" : "No"]);
      } else {
        g.brands.forEach(b => {
          rows.push([g.generic, g.category, g.allergyKeywords.join("; "), b.brand, b.strength, favs.has(b.id) ? "Yes" : "No", g.enabled ? "Yes" : "No"]);
        });
      }
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "formulary-catalogue.csv"; a.click();
  }

  const GenericRow = ({ g }: { g: Generic }) => {
    const isExpanded = expandedId === g.id;
    const catColor = CATEGORY_COLORS[g.category] ?? "#64748b";
    const favCount = g.brands.filter(b => favs.has(b.id)).length;
    const isDisabled = !g.enabled || g.deleted;

    return (
      <div className={`border rounded-lg overflow-hidden bg-white transition-colors ${isDisabled ? "opacity-60" : "border-slate-200"} ${g.deleted ? "border-dashed border-red-200" : ""}`}>
        {/* Generic header row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button className="flex items-center gap-2 text-left flex-none" onClick={() => setExpandedId(isExpanded ? null : g.id)}>
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
          </button>
          <button className="flex-1 flex items-center gap-2.5 text-left" onClick={() => setExpandedId(isExpanded ? null : g.id)}>
            <span className="font-medium text-sm text-slate-800">{g.generic}</span>
            {g.deleted && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Deleted</Badge>}
            {!g.deleted && !g.enabled && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Disabled</Badge>}
            <span className="text-xs text-slate-400">
              {g.brands.length} brand{g.brands.length !== 1 ? "s" : ""}
              {favCount > 0 && <span className="ml-1 text-amber-500">· {favCount} ★</span>}
            </span>
          </button>
          {/* Actions */}
          {g.deleted ? (
            <button onClick={() => restoreGeneric(g.id)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors">
              <RefreshCw className="h-3 w-3" /> Restore
            </button>
          ) : (
            <>
              <Switch checked={g.enabled} onCheckedChange={() => toggleEnabled(g.id)} />
              <button onClick={e => openEdit(g, e)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => softDelete(g.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Remove from formulary">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Allergy keywords when expanded */}
        {isExpanded && g.allergyKeywords.length > 0 && (
          <div className="px-4 pb-1.5 flex flex-wrap gap-1.5">
            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5 text-amber-500" /> Allergy keywords:
            </span>
            {g.allergyKeywords.map(kw => (
              <span key={kw} className="px-1.5 py-0 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700">{kw}</span>
            ))}
          </div>
        )}

        {/* Brands sub-table */}
        {isExpanded && (
          <div className="border-t border-slate-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Brand Name</th>
                  <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Strength / Form</th>
                  <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide w-16">Fav</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {/* Sort: favourites first */}
                {[...g.brands].sort((a, b) => (favs.has(b.id) ? 1 : 0) - (favs.has(a.id) ? 1 : 0)).map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 group">
                    <td className="px-4 py-2">
                      {brandEdit?.brandId === b.id ? (
                        <Input value={brandEdit.brand} onChange={e => setBrandEdit(prev => prev ? { ...prev, brand: e.target.value } : prev)}
                          className="h-6 text-xs w-32" autoFocus />
                      ) : (
                        <span className="font-medium text-slate-700 flex items-center gap-1">
                          <Pill className="h-3 w-3 text-slate-300 shrink-0" /> {b.brand}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {brandEdit?.brandId === b.id ? (
                        <div className="flex items-center gap-1">
                          <Input value={brandEdit.strength}
                            onChange={e => setBrandEdit(prev => prev ? { ...prev, strength: e.target.value } : prev)}
                            onKeyDown={e => e.key === "Enter" && saveBrandEdit()}
                            className="h-6 text-xs w-28" />
                          <button onClick={saveBrandEdit}><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /></button>
                          <button onClick={() => setBrandEdit(null)}><X className="h-3.5 w-3.5 text-slate-400" /></button>
                        </div>
                      ) : (
                        <span className="text-slate-500">{b.strength}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <button onClick={() => toggleBrandFav(b.id)}
                        title={favs.has(b.id) ? "Remove favourite (hides from top of doctor's list)" : "Mark as favourite (surfaces to top of doctor's list)"}
                        className={favs.has(b.id) ? "text-amber-400" : "text-slate-200 hover:text-amber-300 transition-colors"}>
                        <Star className="h-4 w-4 fill-current" />
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      {(!brandEdit || brandEdit.brandId !== b.id) && (
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startBrandEdit(g.id, b)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button onClick={() => deleteBrand(g.id, b.id)}
                            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Add brand row */}
                <tr className="bg-slate-50/50">
                  <td className="px-4 py-2">
                    <Input value={newBrand[g.id]?.brand ?? ""}
                      onChange={e => setNewBrand(prev => ({ ...prev, [g.id]: { brand: e.target.value, strength: prev[g.id]?.strength ?? "" } }))}
                      placeholder="Brand name" className="h-6 text-xs w-32" />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <Input value={newBrand[g.id]?.strength ?? ""}
                        onChange={e => setNewBrand(prev => ({ ...prev, [g.id]: { brand: prev[g.id]?.brand ?? "", strength: e.target.value } }))}
                        onKeyDown={e => e.key === "Enter" && addBrand(g.id)}
                        placeholder="e.g. 500mg" className="h-6 text-xs w-28" />
                      <Button size="sm" className="h-6 text-[10px] px-2 text-white" style={{ background: ACCENT }} onClick={() => addBrand(g.id)}>
                        Add
                      </Button>
                    </div>
                  </td>
                  <td colSpan={2}><Plus className="h-3.5 w-3.5 text-slate-300 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main List */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search generic, brand, category…" className="pl-8 h-8 text-xs" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["All", ...categories].map(c => (
              <button key={c} onClick={() => setFilterCat(c)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filterCat === c ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
                style={filterCat === c ? { background: ACCENT } : {}}>
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
            <Button size="sm" onClick={openAdd} style={{ background: ACCENT }} className="text-white text-xs gap-1.5 h-8">
              <Plus className="h-3.5 w-3.5" /> Add Generic
            </Button>
          </div>
        </div>

        {/* Grouped list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {visibleGenerics.length === 0 && (
            <div className="text-center py-16 text-slate-400 text-sm">No medicines match your filter.</div>
          )}
          {grouped.map(({ cat, items }) => {
            const catColor = CATEGORY_COLORS[cat] ?? "#64748b";
            const expanded = isCatExpanded(cat);
            return (
              <div key={cat}>
                {/* Category header */}
                <button
                  className="flex items-center gap-2 w-full text-left mb-2 group"
                  onClick={() => toggleCat(cat)}>
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ background: catColor }} />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{cat}</span>
                  <span className="text-[10px] text-slate-400 ml-1">{items.length} generic{items.length !== 1 ? "s" : ""}</span>
                  <span className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors">
                    {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </span>
                </button>
                {expanded && (
                  <div className="space-y-2 pl-4 border-l-2" style={{ borderColor: `${catColor}40` }}>
                    {items.map(g => <GenericRow key={g.id} g={g} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-in Drawer for Add / Edit Generic */}
      {drawerOpen && (
        <div className="w-80 border-l border-slate-200 bg-white flex flex-col shrink-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-sm text-slate-800">{editingId ? "Edit Generic" : "Add Generic"}</h3>
            <button onClick={() => setDrawerOpen(false)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Generic / INN Name *</label>
              <Input value={draftName} onChange={e => setDraftName(e.target.value)}
                placeholder="e.g. Amoxicillin" className="h-8 text-xs" autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Category *</label>
              <select value={draftCat} onChange={e => setDraftCat(e.target.value)}
                className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__custom__">+ New category…</option>
              </select>
              {draftCat === "__custom__" && (
                <Input value={draftCustomCat} onChange={e => setDraftCustomCat(e.target.value)}
                  placeholder="Category name" className="h-7 text-xs mt-1" />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Allergy Keywords</label>
              <p className="text-[10px] text-slate-400">Used to warn doctors when a patient is allergic.</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {draftKeywords.map(kw => (
                  <span key={kw} className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 text-xs text-amber-700">
                    {kw}
                    <button onClick={() => setDraftKeywords(prev => prev.filter(k => k !== kw))}>
                      <X className="h-2.5 w-2.5 hover:text-red-500" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={kwInput} onChange={e => setKwInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addKeyword()}
                  placeholder="Add keyword…" className="h-7 text-xs flex-1" />
                <Button size="sm" className="h-7 text-xs text-white" style={{ background: ACCENT }} onClick={addKeyword}>Add</Button>
              </div>
            </div>
          </div>
          <div className="px-5 py-4 border-t border-slate-200">
            <Button onClick={saveDrawer} size="sm" className="w-full text-xs text-white gap-1.5"
              style={{ background: ACCENT }}
              disabled={!draftName.trim() || !(draftCat && draftCat !== "__custom__" || draftCustomCat.trim())}>
              <Save className="h-3.5 w-3.5" />
              {editingId ? "Save Changes" : "Add to Formulary"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Prescription Defaults Tab ────────────────────────────────────────────────

type ListKey = "routes" | "frequencies" | "durations" | "units";
interface ListItem { id: string; value: string; }
function toItems(arr: string[]): ListItem[] { return arr.map((v, i) => ({ id: `item-${i}-${v}`, value: v })); }

function PrescriptionDefaultsTab() {
  const loaded = loadDefaults();
  const [routes,      setRoutes]      = useState<ListItem[]>(() => toItems(loaded.routes));
  const [frequencies, setFrequencies] = useState<ListItem[]>(() => toItems(loaded.frequencies));
  const [durations,   setDurations]   = useState<ListItem[]>(() => toItems(loaded.durations));
  const [units,       setUnits]       = useState<ListItem[]>(() => toItems(loaded.units));
  const [saved, setSaved]             = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const lists: { key: ListKey; label: string; state: ListItem[]; setter: React.Dispatch<React.SetStateAction<ListItem[]>> }[] = [
    { key: "routes",      label: "Routes",      state: routes,      setter: setRoutes },
    { key: "frequencies", label: "Frequencies", state: frequencies, setter: setFrequencies },
    { key: "durations",   label: "Durations",   state: durations,   setter: setDurations },
    { key: "units",       label: "Units",       state: units,       setter: setUnits },
  ];

  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editValue,  setEditValue]  = useState("");
  const [newItems,   setNewItems]   = useState<Record<ListKey, string>>({ routes: "", frequencies: "", durations: "", units: "" });
  const [dragging,   setDragging]   = useState<{ key: ListKey; idx: number } | null>(null);
  const [dropIdx,    setDropIdx]    = useState<{ key: ListKey; idx: number } | null>(null);

  function addItem(key: ListKey, setter: typeof lists[0]["setter"]) {
    const v = newItems[key].trim();
    if (!v) return;
    setter(prev => [...prev, { id: `item-${Date.now()}`, value: v }]);
    setNewItems(prev => ({ ...prev, [key]: "" }));
  }
  function removeItem(key: ListKey, setter: typeof lists[0]["setter"], id: string) {
    setter(prev => prev.filter(i => i.id !== id));
  }
  function startEdit(item: ListItem) { setEditItemId(item.id); setEditValue(item.value); }
  function saveEdit(setter: typeof lists[0]["setter"]) {
    setter(prev => prev.map(i => i.id === editItemId ? { ...i, value: editValue.trim() || i.value } : i));
    setEditItemId(null); setEditValue("");
  }
  function handleDrop(targetKey: ListKey, targetIdx: number, setter: typeof lists[0]["setter"]) {
    if (!dragging || dragging.key !== targetKey || dragging.idx === targetIdx) return;
    setter(prev => {
      const next = [...prev]; const [mv] = next.splice(dragging.idx, 1); next.splice(targetIdx, 0, mv); return next;
    });
    setDragging(null); setDropIdx(null);
  }
  function handleSave() {
    saveDefaults({
      routes:      routes.map(i => i.value),
      frequencies: frequencies.map(i => i.value),
      durations:   durations.map(i => i.value),
      units:       units.map(i => i.value),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  function handleReset() {
    setRoutes(toItems(DEFAULT_ROUTES)); setFrequencies(toItems(DEFAULT_FREQUENCIES));
    setDurations(toItems(DEFAULT_DURATIONS)); setUnits(toItems(DEFAULT_UNITS));
    setConfirmReset(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-xs text-slate-500">
          These lists power the prescription drawer dropdowns. Drag to reorder; changes take effect after Save.
        </p>
        <div className="flex items-center gap-2">
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Reset to factory defaults?</span>
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleReset}>Yes, Reset</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmReset(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
            </Button>
          )}
          <Button size="sm" onClick={handleSave} style={{ background: ACCENT }} className="text-white text-xs gap-1.5 h-8">
            {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          {lists.map(({ key, label, state, setter }) => (
            <div key={key} className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400" /> {label}
                </span>
                <span className="text-[10px] text-slate-400">{state.length} items</span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-64">
                {state.map((item, idx) => (
                  <div key={item.id} draggable
                    onDragStart={() => setDragging({ key, idx })}
                    onDragOver={e => { e.preventDefault(); setDropIdx({ key, idx }); }}
                    onDrop={() => handleDrop(key, idx, setter)}
                    onDragEnd={() => { setDragging(null); setDropIdx(null); }}
                    className={`flex items-center gap-2 px-3 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 group transition-colors ${
                      dropIdx?.key === key && dropIdx?.idx === idx && dragging?.key === key ? "border-t-2 border-blue-400" : ""
                    }`}>
                    <GripVertical className="h-3.5 w-3.5 text-slate-200 cursor-grab shrink-0 group-hover:text-slate-400" />
                    {editItemId === item.id ? (
                      <>
                        <Input value={editValue} onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && saveEdit(setter)}
                          className="h-6 text-xs flex-1" autoFocus />
                        <button onClick={() => saveEdit(setter)}><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /></button>
                        <button onClick={() => setEditItemId(null)}><X className="h-3 w-3 text-slate-400" /></button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-slate-700 flex-1">{item.value}</span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(item)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button onClick={() => removeItem(key, setter, item.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-3 py-2 border-t border-slate-100 flex gap-1.5">
                <Input value={newItems[key]}
                  onChange={e => setNewItems(prev => ({ ...prev, [key]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addItem(key, setter)}
                  placeholder={`Add ${label.toLowerCase().slice(0, -1)}…`}
                  className="h-7 text-xs flex-1" />
                <Button size="sm" className="h-7 text-[10px] px-2 text-white shrink-0" style={{ background: ACCENT }}
                  onClick={() => addItem(key, setter)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────

type TabKey = "catalogue" | "defaults";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "catalogue", label: "Medicine Catalogue",    icon: <Pill className="h-3.5 w-3.5" /> },
  { key: "defaults",  label: "Prescription Defaults", icon: <Tag className="h-3.5 w-3.5" /> },
];

interface Props { initialTab?: TabKey; }

export function FormularyManagementModule({ initialTab = "catalogue" }: Props) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  useEffect(() => { setTab(initialTab); }, [initialTab]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Pill className="h-5 w-5" style={{ color: ACCENT }} />
          Formulary Management
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage the medicine catalogue and prescription dropdown defaults</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t.key ? "" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
            style={tab === t.key ? { borderColor: ACCENT, color: ACCENT } : {}}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === "catalogue" && <MedicineCatalogueTab />}
        {tab === "defaults"  && <PrescriptionDefaultsTab />}
      </div>
    </div>
  );
}
