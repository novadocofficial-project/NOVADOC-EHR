import { useState, useEffect } from "react";
import { BookOpen, Edit2, Package, Pill, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Sel, EMPTY_FORM, getFormularyOptions, MedicineSearch,
} from "@/pages/FormularySection";
import type { BrandOption, MedicineDef } from "@/pages/FormularySection";
import {
  type BundleItem, type FormularyBundle,
  loadBundles, saveBundles,
} from "@/pages/formularyBundleUtils";

export type { BundleItem, FormularyBundle };

const ACCENT = "#4982CF";

export function FormularyBundlesTab() {
  const [bundles, setBundles] = useState<FormularyBundle[]>(loadBundles);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [draftName, setDraftName] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftItems, setDraftItems] = useState<BundleItem[]>([]);

  const [selMed, setSelMed]   = useState<MedicineDef | null>(null);
  const [selBrand, setSelBrand] = useState<BrandOption | null>(null);
  const [form, setForm]       = useState(EMPTY_FORM);
  const favs = new Set<string>();

  useEffect(() => { saveBundles(bundles); }, [bundles]);

  const opts = getFormularyOptions();

  function clearPicker() {
    setSelMed(null); setSelBrand(null); setForm(EMPTY_FORM);
  }

  function openAdd() {
    setEditingId(null);
    setDraftName(""); setDraftDesc(""); setDraftItems([]);
    clearPicker();
    setEditorOpen(true);
  }

  function openEdit(b: FormularyBundle) {
    setEditingId(b.id);
    setDraftName(b.name);
    setDraftDesc(b.description);
    setDraftItems([...b.items]);
    clearPicker();
    setEditorOpen(true);
  }

  function handleSelect(med: MedicineDef, brand: BrandOption) {
    setSelMed(med); setSelBrand(brand); setForm(EMPTY_FORM);
  }

  function addItemToBundle() {
    if (!selMed || !selBrand || !form.dose.trim()) return;
    const item: BundleItem = {
      medicineId: selMed.id,
      brandId:    selBrand.id,
      brand:      selBrand.brand,
      strength:   selBrand.strength,
      genericName: selMed.generic,
      dose:       form.dose.trim(),
      unit:       form.unit,
      route:      form.route,
      frequency:  form.frequency,
      duration:   form.duration,
    };
    setDraftItems(prev =>
      prev.some(i => i.brandId === item.brandId)
        ? prev.map(i => i.brandId === item.brandId ? item : i)
        : [...prev, item]
    );
    clearPicker();
  }

  function saveBundle() {
    if (!draftName.trim() || draftItems.length === 0) return;
    if (editingId) {
      setBundles(prev => prev.map(b =>
        b.id === editingId
          ? { ...b, name: draftName.trim(), description: draftDesc.trim(), items: draftItems }
          : b
      ));
    } else {
      const newBundle: FormularyBundle = {
        id:          `bundle-${Date.now()}`,
        name:        draftName.trim(),
        description: draftDesc.trim(),
        enabled:     true,
        items:       draftItems,
      };
      setBundles(prev => [...prev, newBundle]);
    }
    setEditorOpen(false);
  }

  function toggleEnabled(id: string) {
    setBundles(prev => prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  }

  function deleteBundle(id: string) {
    setBundles(prev => prev.filter(b => b.id !== id));
    setDeleteConfirm(null);
    if (editingId === id) setEditorOpen(false);
  }

  const canAddItem = selMed !== null && selBrand !== null && form.dose.trim() !== "";
  const canSave    = draftName.trim() !== "" && draftItems.length > 0;

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Bundle List ── */}
      <div className={`flex flex-col border-r border-slate-200 bg-white overflow-hidden transition-all duration-200 ${editorOpen ? "w-[42%]" : "w-full"}`}>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <p className="text-xs text-slate-500">{bundles.length} bundle{bundles.length !== 1 ? "s" : ""}</p>
          <Button size="sm" onClick={openAdd} style={{ background: ACCENT }}
            className="text-white text-xs gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" /> New Bundle
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {bundles.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
              <Package className="h-8 w-8 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-400">No bundles yet</p>
              <p className="text-xs text-slate-400 mt-1">Create a bundle to pre-load common prescription sets</p>
            </div>
          )}
          {bundles.map(b => (
            <div key={b.id}
              className={`px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${editingId === b.id && editorOpen ? "bg-blue-50/60" : ""}`}>

              {deleteConfirm === b.id ? (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-700 flex-1">Remove <strong>{b.name}</strong>?</p>
                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => deleteBundle(b.id)}>Remove</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <Switch checked={b.enabled} onCheckedChange={() => toggleEnabled(b.id)} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{b.name}</p>
                    {b.description && <p className="text-xs text-slate-500 mt-0.5">{b.description}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {b.items.length} medicine{b.items.length !== 1 ? "s" : ""}
                      {!b.enabled && <span className="ml-2 text-amber-500 font-medium">Disabled</span>}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(b)}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(b.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Editor Panel ── */}
      {editorOpen && (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">

          {/* Editor header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex-shrink-0">
            <button onClick={() => setEditorOpen(false)}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors">
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-slate-800 flex-1">
              {editingId ? "Edit Bundle" : "New Bundle"}
            </p>
            <Button size="sm" onClick={saveBundle} disabled={!canSave}
              style={canSave ? { background: ACCENT } : {}}
              className="text-white text-xs gap-1.5 h-8 disabled:opacity-40">
              <Save className="h-3.5 w-3.5" />
              {editingId ? "Save Changes" : "Create Bundle"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* Name */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Bundle Name *</label>
              <Input value={draftName} onChange={e => setDraftName(e.target.value)}
                placeholder="e.g. Hypertension Bundle" className="text-sm" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
              <Input value={draftDesc} onChange={e => setDraftDesc(e.target.value)}
                placeholder="Optional — when to use this bundle" className="text-sm" />
            </div>

            {/* Medicine list */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">
                Medicines ({draftItems.length})
                {draftItems.length === 0 && <span className="ml-2 text-red-400 normal-case font-normal">required</span>}
              </label>

              {draftItems.length > 0 && (
                <div className="space-y-2 mb-3">
                  {draftItems.map((item, idx) => (
                    <div key={`${item.brandId}-${idx}`}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40">
                      <Pill className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-black text-slate-800">{item.brand}</p>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600">{item.strength}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.dose} {item.unit} · {item.route} · {item.frequency} · {item.duration}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 italic">{item.genericName}</p>
                      </div>
                      <button
                        onClick={() => setDraftItems(prev => prev.filter((_, i) => i !== idx))}
                        className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Medicine picker */}
              <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-3 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Plus className="h-3 w-3" /> Add Medicine
                </p>
                <MedicineSearch favs={favs} onToggleFav={() => {}} onSelect={handleSelect} />

                {selMed && selBrand && (
                  <div className="border border-indigo-100 rounded-xl bg-indigo-50/30 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-slate-800">{selBrand.brand}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600">{selBrand.strength}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{selMed.generic}</p>
                      </div>
                      <button onClick={clearPicker}
                        className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Dose</label>
                        <input type="number" min="0.5" step="0.5" value={form.dose}
                          onChange={e => setForm(p => ({ ...p, dose: e.target.value }))}
                          className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-[#6366f1]/50 focus:ring-1 focus:ring-[#6366f1]/20 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Unit</label>
                        <Sel value={form.unit} options={opts.units} onChange={v => setForm(p => ({ ...p, unit: v }))} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Route</label>
                        <Sel value={form.route} options={opts.routes} onChange={v => setForm(p => ({ ...p, route: v }))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Frequency</label>
                        <Sel value={form.frequency} options={opts.frequencies} onChange={v => setForm(p => ({ ...p, frequency: v }))} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Duration</label>
                        <Sel value={form.duration} options={opts.durations} onChange={v => setForm(p => ({ ...p, duration: v }))} />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button onClick={addItemToBundle} disabled={!canAddItem}
                        className="flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl bg-[#6366f1] text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <Plus className="h-3.5 w-3.5" />
                        Add to Bundle
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bundle preview */}
            {draftItems.length > 0 && (
              <div className="pb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3" /> Preview — what doctors will see
                </p>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <p className="text-[11px] font-black text-slate-700 mb-1">{draftName || "Unnamed Bundle"}</p>
                  {draftDesc && <p className="text-[10px] text-slate-500 mb-2">{draftDesc}</p>}
                  <p className="text-[10px] text-slate-400">{draftItems.length} medicine{draftItems.length !== 1 ? "s" : ""} will be applied</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
