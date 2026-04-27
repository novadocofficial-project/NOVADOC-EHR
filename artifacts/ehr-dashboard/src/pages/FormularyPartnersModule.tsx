import { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit2, Save, X, Search, ChevronDown,
  ChevronRight, AlertCircle, Upload, Store, Pill,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MEDICINES } from "@/pages/FormularySection";

const ACCENT        = "#4982CF";
const CATALOGUE_KEY = "ehr-formulary-catalogue-v1";
const PARTNERS_KEY  = "ehr-formulary-partners-v1";

function uid() { return `fp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Types ─────────────────────────────────────────────────────────────────────

export type FormularyPartnerType = "In-Clinic Dispensary" | "External Pharmacy";

interface Brand {
  id:       string;
  brand:    string;
  strength: string;
}

interface Generic {
  id:       string;
  generic:  string;
  category: string;
  brands:   Brand[];
  enabled:  boolean;
  deleted:  boolean;
}

// Pricing is keyed by brand ID (not generic ID)
export interface FormularyPartner {
  id:               string;
  name:             string;
  type:             FormularyPartnerType;
  contact:          string;
  active:           boolean;
  selectedGenerics: string[];          // genericIds
  sellingPrice:     Record<string, string>; // brandId → price
  dispensingFee:    Record<string, string>; // brandId → fee
}

// ─── Seed helpers ──────────────────────────────────────────────────────────────

function loadGenerics(): Generic[] {
  try {
    const raw = localStorage.getItem(CATALOGUE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Generic[];
      return parsed;
    }
  } catch { /**/ }
  return MEDICINES.map(m => ({
    id:       m.id,
    generic:  m.generic,
    category: m.category,
    brands:   (m.brands ?? []).map((b: Brand) => ({ id: b.id, brand: b.brand, strength: b.strength })),
    enabled:  true,
    deleted:  false,
  }));
}

const SEED_PARTNERS: FormularyPartner[] = [
  {
    id: "fpart-1", name: "In-House Dispensary", type: "In-Clinic Dispensary",
    contact: "", active: true, selectedGenerics: [], sellingPrice: {}, dispensingFee: {},
  },
  {
    id: "fpart-2", name: "Al-Shifa Pharmacy", type: "External Pharmacy",
    contact: "0300-1234567", active: true, selectedGenerics: [], sellingPrice: {}, dispensingFee: {},
  },
];

function loadPartners(): FormularyPartner[] {
  try {
    const raw = localStorage.getItem(PARTNERS_KEY);
    if (raw) return JSON.parse(raw) as FormularyPartner[];
  } catch { /**/ }
  return [...SEED_PARTNERS];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const PARTNER_TYPE_COLORS: Record<FormularyPartnerType, string> = {
  "In-Clinic Dispensary": "bg-blue-50 text-blue-600 border-blue-200",
  "External Pharmacy":    "bg-amber-50 text-amber-600 border-amber-200",
};

// Count how many brands are priced for a partner
function brandCount(partner: FormularyPartner, activeGenerics: Generic[]): number {
  let total = 0;
  for (const gId of partner.selectedGenerics) {
    const gen = activeGenerics.find(g => g.id === gId);
    if (gen) total += gen.brands.length;
  }
  return total;
}

// ─── FormularyPartnersModule ───────────────────────────────────────────────────

export { SEED_PARTNERS as FORMULARY_SEED_PARTNERS };

export function FormularyPartnersModule() {
  const [generics, setGenerics] = useState<Generic[]>(loadGenerics);
  const [partners, setPartners] = useState<FormularyPartner[]>(loadPartners);

  const [step,      setStep]      = useState<1 | 2>(1);
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; type: FormularyPartnerType; contact: string }>({
    name: "", type: "In-Clinic Dispensary", contact: "",
  });
  const [selected,      setSelected]      = useState<string[]>([]); // genericIds
  const [sellingPrice,  setSellingPrice]  = useState<Record<string, string>>({});
  const [dispensingFee, setDispensingFee] = useState<Record<string, string>>({});
  const [deleteId,      setDeleteId]      = useState<string | null>(null);
  const [expandId,      setExpandId]      = useState<string | null>(null);
  const [importPartnerId, setImportPartnerId] = useState<string | null>(null);
  const [importText,      setImportText]      = useState("");
  const [importResult,    setImportResult]    = useState<{ matched: number; unmatched: string[] } | null>(null);
  const [modalSearch,     setModalSearch]     = useState("");
  // Which generics are expanded in the modal to show brands
  const [expandedGenerics, setExpandedGenerics] = useState<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem(PARTNERS_KEY, JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    setGenerics(loadGenerics());
  }, []);

  const activeGenerics   = generics.filter(g => g.enabled && !g.deleted);
  const categories       = Array.from(new Set(activeGenerics.map(g => g.category))).sort();

  // All brands across all active generics (for CSV import lookup)
  const allBrands = activeGenerics.flatMap(g => g.brands.map(b => ({ ...b, genericId: g.id, genericName: g.generic })));

  const filteredModalGenerics = modalSearch
    ? activeGenerics.filter(g =>
        g.generic.toLowerCase().includes(modalSearch.toLowerCase()) ||
        g.category.toLowerCase().includes(modalSearch.toLowerCase()) ||
        g.brands.some(b => b.brand.toLowerCase().includes(modalSearch.toLowerCase()))
      )
    : activeGenerics;

  const modalCategories = Array.from(new Set(filteredModalGenerics.map(g => g.category))).sort();

  function toggleGenericExpand(gId: string) {
    setExpandedGenerics(prev => {
      const next = new Set(prev);
      if (next.has(gId)) next.delete(gId); else next.add(gId);
      return next;
    });
  }

  function openNew() {
    setForm({ name: "", type: "In-Clinic Dispensary", contact: "" });
    setSelected([]); setSellingPrice({}); setDispensingFee({});
    setEditId(null); setStep(1); setModalSearch(""); setExpandedGenerics(new Set()); setShowModal(true);
  }

  function openEdit(p: FormularyPartner) {
    setForm({ name: p.name, type: p.type, contact: p.contact });
    setSelected([...p.selectedGenerics]);
    setSellingPrice({ ...p.sellingPrice });
    setDispensingFee({ ...p.dispensingFee });
    // Auto-expand generics that are already selected
    setExpandedGenerics(new Set(p.selectedGenerics));
    setEditId(p.id); setStep(1); setModalSearch(""); setShowModal(true);
  }

  function toggleGenericSelection(gId: string) {
    setSelected(ss => {
      const next = ss.includes(gId) ? ss.filter(x => x !== gId) : [...ss, gId];
      // Auto-expand when selecting
      if (!ss.includes(gId)) {
        setExpandedGenerics(prev => new Set([...prev, gId]));
      }
      return next;
    });
  }

  function save() {
    const data: FormularyPartner = {
      id:               editId ?? uid(),
      name:             form.name.trim(),
      type:             form.type,
      contact:          form.contact,
      active:           editId ? (partners.find(p => p.id === editId)?.active ?? true) : true,
      selectedGenerics: selected,
      sellingPrice,
      dispensingFee,
    };
    if (editId) setPartners(ps => ps.map(p => p.id === editId ? data : p));
    else        setPartners(ps => [...ps, data]);
    setShowModal(false);
  }

  function importPricing(partnerId: string) {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;
    const lines = importText.trim().split("\n").map(l =>
      l.split(",").map(s => s.trim().replace(/^"|"$/g, ""))
    );
    const newSP = { ...partner.sellingPrice };
    const newDF = { ...partner.dispensingFee };
    const matched: string[] = [];
    const unmatched: string[] = [];
    lines.forEach(([name, sp, df]) => {
      const brand = allBrands.find(b => b.brand.toLowerCase() === name?.toLowerCase());
      if (brand && sp) {
        newSP[brand.id] = sp;
        if (df) newDF[brand.id] = df;
        matched.push(name);
      } else if (name) {
        unmatched.push(name);
      }
    });
    setPartners(ps => ps.map(p =>
      p.id === partnerId ? { ...p, sellingPrice: newSP, dispensingFee: newDF } : p
    ));
    setImportResult({ matched: matched.length, unmatched });
    setImportText("");
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Manage dispensaries and pharmacies — configure selling price and dispensing fee per brand.
        </p>
        <Button onClick={openNew} className="h-8 text-xs gap-1.5 text-white" style={{ background: ACCENT }}>
          <Plus className="h-3.5 w-3.5" /> New Partner
        </Button>
      </div>

      {/* Partner list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {partners.length === 0 && (
          <div className="text-center py-16 text-slate-300">
            <Store className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm font-semibold">No formulary partners yet</p>
            <p className="text-xs mt-1">Add your first dispensary or pharmacy above</p>
          </div>
        )}

        {partners.map(p => {
          const isExpanded = expandId === p.id;
          const numGenerics = p.selectedGenerics.filter(id => activeGenerics.some(g => g.id === id)).length;
          const numBrands   = brandCount(p, activeGenerics);
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Store className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-800">{p.name}</p>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${PARTNER_TYPE_COLORS[p.type]}`}>{p.type}</Badge>
                    {!p.active && <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-slate-50 text-slate-400 border-slate-200">Inactive</Badge>}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {p.contact || "No contact"} · {numGenerics} generic{numGenerics !== 1 ? "s" : ""} · {numBrands} brand{numBrands !== 1 ? "s" : ""}
                  </p>
                </div>
                <Switch
                  checked={p.active}
                  onCheckedChange={v => setPartners(ps => ps.map(x => x.id === p.id ? { ...x, active: v } : x))}
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

              {/* Expanded pricing table — grouped by generic → brands */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex-1">Brand Pricing</p>
                    <button
                      onClick={() => {
                        setImportPartnerId(importPartnerId === p.id ? null : p.id);
                        setImportResult(null);
                        setImportText("");
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#4982CF] hover:opacity-80"
                    >
                      <Upload className="h-3 w-3" /> Import CSV
                    </button>
                  </div>

                  {importPartnerId === p.id && (
                    <div className="px-4 py-3 bg-blue-50/40 border-b border-[#4982CF]/20 space-y-2">
                      <p className="text-[10px] text-slate-500">
                        Paste CSV: <span className="font-mono">Brand Name, Selling Price (PKR), Dispensing Fee</span> (one per line)
                      </p>
                      <textarea
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        rows={4}
                        className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#4982CF] resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <Button onClick={() => importPricing(p.id)} className="h-7 text-xs text-white px-3" style={{ background: ACCENT }}>Apply</Button>
                        <Button variant="outline" onClick={() => { setImportPartnerId(null); setImportResult(null); }} className="h-7 text-xs px-3">Cancel</Button>
                        {importResult && (
                          <span className="text-[10px] text-slate-500">
                            {importResult.matched} matched{importResult.unmatched.length > 0 && `, ${importResult.unmatched.length} unmatched`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="max-h-80 overflow-y-auto">
                    {p.selectedGenerics.length === 0 ? (
                      <p className="px-4 py-6 text-center text-slate-300 text-xs">No generics selected for this partner</p>
                    ) : (
                      activeGenerics
                        .filter(g => p.selectedGenerics.includes(g.id))
                        .map(g => (
                          <div key={g.id}>
                            {/* Generic header */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0">
                              <Pill className="h-3 w-3 text-slate-400 flex-shrink-0" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex-1">{g.generic}</p>
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">{g.category}</span>
                            </div>
                            {/* Brand rows */}
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-50">
                                  <th className="text-left px-6 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 w-40">Brand</th>
                                  <th className="text-left px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">Strength</th>
                                  <th className="text-right px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 w-36">Selling Price (PKR)</th>
                                  <th className="text-right px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 w-32">Dispensing Fee</th>
                                </tr>
                              </thead>
                              <tbody>
                                {g.brands.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="px-6 py-2 text-slate-300 text-[10px] italic">No brands configured</td>
                                  </tr>
                                ) : (
                                  g.brands.map(b => (
                                    <tr key={b.id} className="border-b border-slate-50 last:border-0">
                                      <td className="px-6 py-1.5 text-slate-700 font-medium">{b.brand}</td>
                                      <td className="px-4 py-1.5 text-slate-400 text-[10px]">{b.strength || "—"}</td>
                                      <td className="px-4 py-1.5 text-right">
                                        <Input
                                          value={p.sellingPrice[b.id] ?? ""}
                                          onChange={e => setPartners(ps => ps.map(x =>
                                            x.id === p.id ? { ...x, sellingPrice: { ...x.sellingPrice, [b.id]: e.target.value } } : x
                                          ))}
                                          placeholder="0.00"
                                          className="h-6 text-xs text-right w-28 ml-auto"
                                        />
                                      </td>
                                      <td className="px-4 py-1.5 text-right">
                                        <Input
                                          value={p.dispensingFee[b.id] ?? ""}
                                          onChange={e => setPartners(ps => ps.map(x =>
                                            x.id === p.id ? { ...x, dispensingFee: { ...x.dispensingFee, [b.id]: e.target.value } } : x
                                          ))}
                                          placeholder="0.00"
                                          className="h-6 text-xs text-right w-28 ml-auto"
                                        />
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Dialog open={showModal} onOpenChange={v => !v && setShowModal(false)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editId ? "Edit Formulary Partner" : "New Formulary Partner"}
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
                >
                  {s}
                </div>
                <span className={`text-xs font-medium ${step === s ? "text-[#4982CF]" : "text-slate-400"}`}>
                  {s === 1 ? "Partner Details" : "Generics & Brand Pricing"}
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
                  <label className="text-xs font-bold text-slate-600">Partner Name <span className="text-red-400">*</span></label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. In-House Dispensary"
                    className="h-9 text-sm mt-1"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as FormularyPartnerType }))}
                    className="w-full h-9 text-sm border border-slate-200 rounded-lg px-3 focus:outline-none mt-1 bg-white"
                  >
                    <option>In-Clinic Dispensary</option>
                    <option>External Pharmacy</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600">
                    Contact Info{" "}
                    {form.type === "External Pharmacy" && (
                      <span className="text-slate-400 font-normal">(recommended for external)</span>
                    )}
                  </label>
                  <Input
                    value={form.contact}
                    onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                    placeholder="Phone / email / contract ref"
                    className="h-9 text-sm mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowModal(false)} className="h-9 text-sm">Cancel</Button>
                <Button
                  disabled={!form.name.trim()}
                  onClick={() => setStep(2)}
                  className="h-9 text-sm text-white"
                  style={{ background: ACCENT }}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — Generic selection + per-brand pricing */}
          {step === 2 && (
            <div className="flex flex-col gap-3 overflow-hidden flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    placeholder="Search generics or brands…"
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <p className="text-xs text-slate-500 whitespace-nowrap">
                  {selected.length} of {activeGenerics.length} selected
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelected(activeGenerics.map(g => g.id));
                      setExpandedGenerics(new Set(activeGenerics.map(g => g.id)));
                    }}
                    className="text-xs font-bold"
                    style={{ color: ACCENT }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => { setSelected([]); setExpandedGenerics(new Set()); }}
                    className="text-xs font-bold text-slate-400"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 border border-slate-100 rounded-xl">
                {modalCategories.map(cat => {
                  const genericsInCat = filteredModalGenerics.filter(g => g.category === cat);
                  return (
                    <div key={cat}>
                      {/* Category header */}
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{cat}</p>
                      </div>

                      {genericsInCat.map(g => {
                        const isSelected = selected.includes(g.id);
                        const isExpanded = expandedGenerics.has(g.id);
                        return (
                          <div key={g.id}>
                            {/* Generic row */}
                            <div className={`flex items-center gap-3 px-4 py-2 border-b border-slate-50 ${isSelected ? "bg-blue-50/30" : "hover:bg-slate-50/50"}`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleGenericSelection(g.id)}
                                className="accent-[#4982CF]"
                              />
                              <button
                                className="flex-1 text-left"
                                onClick={() => { if (!isSelected) toggleGenericSelection(g.id); else toggleGenericExpand(g.id); }}
                              >
                                <span className={`text-xs font-medium ${isSelected ? "text-slate-800" : "text-slate-600"}`}>{g.generic}</span>
                                <span className="ml-2 text-[9px] text-slate-400">{g.brands.length} brand{g.brands.length !== 1 ? "s" : ""}</span>
                              </button>
                              {isSelected && (
                                <button
                                  onClick={() => toggleGenericExpand(g.id)}
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400"
                                >
                                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                </button>
                              )}
                            </div>

                            {/* Brand rows — shown when generic is selected + expanded */}
                            {isSelected && isExpanded && (
                              <div className="border-b border-slate-100 bg-white">
                                {g.brands.length === 0 ? (
                                  <p className="px-8 py-2 text-[10px] text-slate-300 italic">No brands configured for this generic</p>
                                ) : (
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-50">
                                        <th className="text-left pl-8 pr-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">Brand</th>
                                        <th className="text-left px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">Strength</th>
                                        <th className="text-right px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 w-32">Selling Price (PKR)</th>
                                        <th className="text-right px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 w-28">Dispensing Fee</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {g.brands.map(b => (
                                        <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                          <td className="pl-8 pr-4 py-1.5 text-slate-700 font-medium">{b.brand}</td>
                                          <td className="px-4 py-1.5 text-slate-400 text-[10px]">{b.strength || "—"}</td>
                                          <td className="px-4 py-1.5 text-right">
                                            <Input
                                              value={sellingPrice[b.id] ?? ""}
                                              onChange={e => setSellingPrice(prev => ({ ...prev, [b.id]: e.target.value }))}
                                              placeholder="0.00"
                                              className="h-6 w-24 text-xs text-right ml-auto"
                                            />
                                          </td>
                                          <td className="px-4 py-1.5 text-right">
                                            <Input
                                              value={dispensingFee[b.id] ?? ""}
                                              onChange={e => setDispensingFee(prev => ({ ...prev, [b.id]: e.target.value }))}
                                              placeholder="0.00"
                                              className="h-6 w-24 text-xs text-right ml-auto"
                                            />
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {filteredModalGenerics.length === 0 && (
                  <p className="text-center text-xs text-slate-300 py-8">No generics match your search</p>
                )}
                {activeGenerics.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-8">
                    No generics found. Add them in the Medicine Catalogue first.
                  </p>
                )}
              </div>

              <div className="flex justify-between gap-2 pt-1">
                <Button variant="outline" onClick={() => setStep(1)} className="h-9 text-sm">← Back</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowModal(false)} className="h-9 text-sm">Cancel</Button>
                  <Button onClick={save} className="h-9 text-sm text-white gap-1.5" style={{ background: ACCENT }}>
                    <Save className="h-3.5 w-3.5" /> Save Partner
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
              <AlertCircle className="h-5 w-5" /> Remove Partner
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Remove <strong>{partners.find(p => p.id === deleteId)?.name}</strong>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="h-8 text-sm">Cancel</Button>
            <Button
              onClick={() => { setPartners(ps => ps.filter(p => p.id !== deleteId)); setDeleteId(null); }}
              className="bg-rose-500 text-white h-8 text-sm"
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
