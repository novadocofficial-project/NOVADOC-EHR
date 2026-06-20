import { useState, useEffect } from "react";
import {
  Edit2, FileMinus, Plus, Save, Trash2, X, ChevronRight, ChevronDown, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  loadNFSettings, saveNFSettings,
  loadNFCatalogue, saveNFCatalogue,
} from "@/pages/nonFormularyUtils";
import type { NonFormularySettings, NFDrug, NFBrandOption } from "@/pages/nonFormularyUtils";

const ACCENT = "#4982CF";

// ─── Settings Panel ────────────────────────────────────────────────────────────

function SettingsPanel({ settings, onChange }: {
  settings: NonFormularySettings;
  onChange: (s: NonFormularySettings) => void;
}) {
  const [newReason, setNewReason] = useState("");
  const [editIdx,   setEditIdx]   = useState<number | null>(null);
  const [editVal,   setEditVal]   = useState("");

  function patch(p: Partial<NonFormularySettings>) { onChange({ ...settings, ...p }); }

  function addReason() {
    const v = newReason.trim(); if (!v) return;
    patch({ presetReasons: [...settings.presetReasons, v] });
    setNewReason("");
  }
  function deleteReason(i: number) {
    patch({ presetReasons: settings.presetReasons.filter((_, j) => j !== i) });
    if (editIdx === i) setEditIdx(null);
  }
  function saveEdit(i: number) {
    const v = editVal.trim(); if (!v) return;
    patch({ presetReasons: settings.presetReasons.map((r, j) => j === i ? v : r) });
    setEditIdx(null);
  }

  return (
    <div className="space-y-5">
      {/* Enable / require */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
        <h3 className="text-sm font-black text-slate-800 mb-3">Prescribing Settings</h3>

        <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-700">Allow non-formulary prescriptions</p>
            <p className="text-xs text-slate-400">Clinicians can prescribe drugs outside the formulary catalogue</p>
          </div>
          <Switch checked={settings.enabled} onCheckedChange={v => patch({ enabled: v })} />
        </div>

        {settings.enabled && (
          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Require justification</p>
              <p className="text-xs text-slate-400">A reason must be entered before adding an NF prescription</p>
            </div>
            <Switch checked={settings.requireJustification} onCheckedChange={v => patch({ requireJustification: v })} />
          </div>
        )}
      </div>

      {/* Preset reasons */}
      {settings.enabled && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div>
            <h3 className="text-sm font-black text-slate-800">Preset Justification Reasons</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clinicians can pick from these options (or type freely) when adding a justification.
            </p>
          </div>

          <div className="space-y-2">
            {settings.presetReasons.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-3">No preset reasons yet.</p>
            )}
            {settings.presetReasons.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                {editIdx === i ? (
                  <>
                    <input value={editVal} onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(i); if (e.key === "Escape") setEditIdx(null); }}
                      autoFocus
                      className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-[#4982CF]/50" />
                    <button onClick={() => saveEdit(i)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-blue-50 text-blue-500"><Save className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditIdx(null)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400"><X className="h-3.5 w-3.5" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">{r}</span>
                    <button onClick={() => { setEditIdx(i); setEditVal(r); }} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteReason(i)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <input value={newReason} onChange={e => setNewReason(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addReason(); }}
              placeholder="Add a preset reason…"
              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#4982CF]/50 placeholder:text-slate-300" />
            <Button size="sm" onClick={addReason} disabled={!newReason.trim()}
              style={newReason.trim() ? { background: ACCENT } : {}}
              className="text-white text-xs gap-1.5 h-8 disabled:opacity-40">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Catalogue Panel ───────────────────────────────────────────────────────────

type RightView =
  | { type: "none" }
  | { type: "drug"; drug: NFDrug }
  | { type: "addDrug" }
  | { type: "addBrand"; drug: NFDrug };

function CataloguePanel({ catalogue, onChange }: {
  catalogue: NFDrug[];
  onChange:  (c: NFDrug[]) => void;
}) {
  const [search,    setSearch]    = useState("");
  const [right,     setRight]     = useState<RightView>({ type: "none" });
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set());

  // ── new drug form state ──
  const [newGeneric,  setNewGeneric]  = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newBrand,    setNewBrand]    = useState("");
  const [newStrength, setNewStrength] = useState("");

  // ── add brand form state ──
  const [addBrandName, setAddBrandName]     = useState("");
  const [addBrandStrength, setAddBrandStrength] = useState("");

  // ── edit brand state ──
  const [editBrandId, setEditBrandId] = useState<string | null>(null);
  const [editBrandName, setEditBrandName]     = useState("");
  const [editBrandStrength, setEditBrandStrength] = useState("");

  const q = search.toLowerCase().trim();
  const filtered = q
    ? catalogue.filter(d =>
        d.generic.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.brands.some(b => b.brand.toLowerCase().includes(q) || b.strength.toLowerCase().includes(q))
      )
    : catalogue;

  const grouped = filtered.reduce<Record<string, NFDrug[]>>((acc, d) => {
    (acc[d.category] ??= []).push(d); return acc;
  }, {});

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function deleteDrug(id: string) {
    onChange(catalogue.filter(d => d.id !== id));
    if (right.type === "drug" && right.drug.id === id) setRight({ type: "none" });
  }

  function addNewDrug() {
    const generic = newGeneric.trim();
    const category = newCategory.trim() || "Other";
    if (!generic) return;
    const id = `nf-${generic.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const brands: NFBrandOption[] = newBrand.trim()
      ? [{ id: `${id}-b1`, brand: newBrand.trim(), strength: newStrength.trim() }]
      : [];
    const drug: NFDrug = { id, generic, category, brands };
    const updated = [...catalogue, drug];
    onChange(updated);
    setNewGeneric(""); setNewCategory(""); setNewBrand(""); setNewStrength("");
    setRight({ type: "drug", drug });
    setExpanded(prev => new Set([...prev, id]));
  }

  function addBrand(drug: NFDrug) {
    const brand = addBrandName.trim(); if (!brand) return;
    const bid = `${drug.id}-b${Date.now()}`;
    const newB: NFBrandOption = { id: bid, brand, strength: addBrandStrength.trim() };
    const updated = catalogue.map(d => d.id === drug.id ? { ...d, brands: [...d.brands, newB] } : d);
    onChange(updated);
    const updatedDrug = updated.find(d => d.id === drug.id)!;
    setRight({ type: "drug", drug: updatedDrug });
    setAddBrandName(""); setAddBrandStrength("");
  }

  function deleteBrand(drug: NFDrug, brandId: string) {
    const updated = catalogue.map(d => d.id === drug.id ? { ...d, brands: d.brands.filter(b => b.id !== brandId) } : d);
    onChange(updated);
    const updatedDrug = updated.find(d => d.id === drug.id)!;
    setRight({ type: "drug", drug: updatedDrug });
  }

  function saveBrandEdit(drug: NFDrug) {
    const updated = catalogue.map(d =>
      d.id === drug.id
        ? { ...d, brands: d.brands.map(b => b.id === editBrandId ? { ...b, brand: editBrandName.trim() || b.brand, strength: editBrandStrength.trim() } : b) }
        : d
    );
    onChange(updated);
    const updatedDrug = updated.find(d => d.id === drug.id)!;
    setRight({ type: "drug", drug: updatedDrug });
    setEditBrandId(null);
  }

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* ── Left: drug list ── */}
      <div className="w-64 flex-shrink-0 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* search */}
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search NF catalogue…"
              className="flex-1 text-xs text-slate-700 bg-transparent outline-none placeholder:text-slate-400" />
          </div>
        </div>
        {/* list */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(grouped).map(([cat, drugs]) => (
            <div key={cat}>
              <p className="px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest text-amber-600">{cat}</p>
              {drugs.map(drug => {
                const sel = right.type === "drug" && right.drug.id === drug.id;
                const exp = expanded.has(drug.id);
                return (
                  <div key={drug.id}>
                    <div
                      className={`flex items-center gap-1 px-3 py-1.5 cursor-pointer transition-colors ${sel ? "bg-amber-50" : "hover:bg-slate-50"}`}
                      onClick={() => { setRight({ type: "drug", drug }); setExpanded(prev => new Set([...prev, drug.id])); }}>
                      <button onClick={e => { e.stopPropagation(); toggleExpand(drug.id); }}
                        className="h-4 w-4 flex items-center justify-center flex-shrink-0 text-slate-400">
                        {exp ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </button>
                      <span className={`flex-1 text-xs truncate ${sel ? "font-bold text-amber-800" : "text-slate-700"}`}>{drug.generic}</span>
                      <span className="text-[9px] text-slate-400">{drug.brands.length}</span>
                    </div>
                    {exp && (
                      <div className="pl-8 pb-1">
                        {drug.brands.map(b => (
                          <p key={b.id} className="text-[10px] text-slate-500 py-0.5 pr-3 truncate">
                            {b.brand} · {b.strength}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6 italic">No drugs found</p>
          )}
        </div>
        {/* add drug button */}
        <div className="p-3 border-t border-slate-100">
          <button onClick={() => setRight({ type: "addDrug" })}
            className="w-full flex items-center justify-center gap-1.5 text-[10px] font-black py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Drug
          </button>
        </div>
      </div>

      {/* ── Right: detail / form ── */}
      <div className="flex-1 overflow-y-auto">
        {right.type === "none" && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <FileMinus className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-xs">Select a drug to view or edit</p>
          </div>
        )}

        {right.type === "addDrug" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-black text-slate-800">Add New NF Drug</h3>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Generic Name <span className="text-red-400">*</span></label>
              <input value={newGeneric} onChange={e => setNewGeneric(e.target.value)}
                placeholder="e.g. Bevacizumab"
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-amber-400/60" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Category</label>
              <input value={newCategory} onChange={e => setNewCategory(e.target.value)}
                placeholder="e.g. Oncology"
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-amber-400/60" />
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide mb-2">First Brand (optional)</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={newBrand} onChange={e => setNewBrand(e.target.value)}
                  placeholder="Brand name"
                  className="text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-amber-400/60" />
                <input value={newStrength} onChange={e => setNewStrength(e.target.value)}
                  placeholder="Strength"
                  className="text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-amber-400/60" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={addNewDrug} disabled={!newGeneric.trim()}
                style={newGeneric.trim() ? { background: "#f59e0b" } : {}}
                className="text-white text-xs gap-1.5 h-8 disabled:opacity-40">
                <Plus className="h-3.5 w-3.5" /> Add Drug
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRight({ type: "none" })} className="h-8 text-xs">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {right.type === "drug" && (() => {
          const drug = catalogue.find(d => d.id === right.drug.id) ?? right.drug;
          return (
            <div className="space-y-4">
              {/* Drug header */}
              <div className="bg-white rounded-2xl border border-amber-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">NF</span>
                      <p className="text-sm font-black text-slate-800">{drug.generic}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{drug.category} · {drug.brands.length} brand{drug.brands.length !== 1 ? "s" : ""}</p>
                  </div>
                  <button onClick={() => deleteDrug(drug.id)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Brands list */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <p className="text-xs font-black text-slate-700">Brands & Strengths</p>

                {drug.brands.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-2">No brands yet. Add one below.</p>
                )}

                <div className="space-y-2">
                  {drug.brands.map(b => (
                    <div key={b.id} className="flex items-center gap-2">
                      {editBrandId === b.id ? (
                        <>
                          <input value={editBrandName} onChange={e => setEditBrandName(e.target.value)}
                            className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-400/60" />
                          <input value={editBrandStrength} onChange={e => setEditBrandStrength(e.target.value)}
                            className="w-24 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-400/60" />
                          <button onClick={() => saveBrandEdit(drug)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-blue-50 text-blue-500"><Save className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setEditBrandId(null)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400"><X className="h-3.5 w-3.5" /></button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">{b.brand}</span>
                          <span className="w-24 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 truncate">{b.strength || "—"}</span>
                          <button onClick={() => { setEditBrandId(b.id); setEditBrandName(b.brand); setEditBrandStrength(b.strength); }}
                            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => deleteBrand(drug, b.id)}
                            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add brand form */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <input value={addBrandName} onChange={e => setAddBrandName(e.target.value)}
                    placeholder="Brand name"
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-400/60 placeholder:text-slate-300" />
                  <input value={addBrandStrength} onChange={e => setAddBrandStrength(e.target.value)}
                    placeholder="Strength"
                    className="w-24 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-400/60 placeholder:text-slate-300" />
                  <Button size="sm" onClick={() => addBrand(drug)} disabled={!addBrandName.trim()}
                    style={addBrandName.trim() ? { background: "#f59e0b" } : {}}
                    className="text-white text-xs gap-1 h-8 disabled:opacity-40 flex-shrink-0">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Main Tab ──────────────────────────────────────────────────────────────────

type TabKey = "settings" | "catalogue";

export function NonFormularyTab() {
  const [tab,      setTab]      = useState<TabKey>("catalogue");
  const [settings, setSettings] = useState<NonFormularySettings>(loadNFSettings);
  const [catalogue, setCatalogue] = useState<NFDrug[]>(loadNFCatalogue);

  useEffect(() => { saveNFSettings(settings); }, [settings]);
  useEffect(() => { saveNFCatalogue(catalogue); }, [catalogue]);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex-shrink-0 flex gap-1 px-5 pt-4 pb-0 border-b border-slate-200">
        {(["catalogue", "settings"] as TabKey[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 -mb-px ${tab === t ? "border-amber-500 text-amber-700 bg-amber-50/50" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {t === "catalogue" ? "NF Drug Catalogue" : "Settings & Justifications"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
        {tab === "settings"   && <SettingsPanel   settings={settings}  onChange={setSettings} />}
        {tab === "catalogue"  && <CataloguePanel  catalogue={catalogue} onChange={setCatalogue} />}
      </div>
    </div>
  );
}
