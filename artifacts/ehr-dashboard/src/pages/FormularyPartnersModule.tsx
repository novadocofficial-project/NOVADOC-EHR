import { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit2, Save, X, Search, ChevronDown,
  ChevronRight, AlertCircle, Upload, Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MEDICINES } from "@/pages/FormularySection";

const ACCENT          = "#4982CF";
const CATALOGUE_KEY   = "ehr-formulary-catalogue-v1";
const PARTNERS_KEY    = "ehr-formulary-partners-v1";

function uid() { return `fp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Types ─────────────────────────────────────────────────────────────────────

export type FormularyPartnerType = "In-Clinic Dispensary" | "External Pharmacy";

interface Generic {
  id:       string;
  generic:  string;
  category: string;
  enabled:  boolean;
  deleted:  boolean;
}

export interface FormularyPartner {
  id:               string;
  name:             string;
  type:             FormularyPartnerType;
  contact:          string;
  active:           boolean;
  selectedGenerics: string[];
  sellingPrice:     Record<string, string>;
  dispensingFee:    Record<string, string>;
}

// ─── Seed helpers ──────────────────────────────────────────────────────────────

function loadGenerics(): Generic[] {
  try {
    const raw = localStorage.getItem(CATALOGUE_KEY);
    if (raw) return JSON.parse(raw) as Generic[];
  } catch { /**/ }
  return MEDICINES.map(m => ({
    id:      m.id,
    generic: m.generic,
    category: m.category,
    enabled: true,
    deleted: false,
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

// ─── Colors ───────────────────────────────────────────────────────────────────

const PARTNER_TYPE_COLORS: Record<FormularyPartnerType, string> = {
  "In-Clinic Dispensary": "bg-blue-50 text-blue-600 border-blue-200",
  "External Pharmacy":    "bg-amber-50 text-amber-600 border-amber-200",
};

// ─── FormularyPartnersModule ───────────────────────────────────────────────────

export function FormularyPartnersModule() {
  const [generics,  setGenerics]  = useState<Generic[]>(loadGenerics);
  const [partners,  setPartners]  = useState<FormularyPartner[]>(loadPartners);

  const [step,       setStep]       = useState<1 | 2>(1);
  const [showModal,  setShowModal]  = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [form,       setForm]       = useState<{ name: string; type: FormularyPartnerType; contact: string }>({
    name: "", type: "In-Clinic Dispensary", contact: "",
  });
  const [selected,      setSelected]      = useState<string[]>([]);
  const [sellingPrice,  setSellingPrice]  = useState<Record<string, string>>({});
  const [dispensingFee, setDispensingFee] = useState<Record<string, string>>({});
  const [deleteId,      setDeleteId]      = useState<string | null>(null);
  const [expandId,      setExpandId]      = useState<string | null>(null);
  const [importPartnerId, setImportPartnerId] = useState<string | null>(null);
  const [importText,      setImportText]      = useState("");
  const [importResult,    setImportResult]    = useState<{ matched: number; unmatched: string[] } | null>(null);
  const [modalSearch,     setModalSearch]     = useState("");

  // Persist partners
  useEffect(() => {
    localStorage.setItem(PARTNERS_KEY, JSON.stringify(partners));
  }, [partners]);

  // Re-sync generics if catalogue changes (e.g. user edits Medicine Catalogue first)
  useEffect(() => {
    setGenerics(loadGenerics());
  }, []);

  const activeGenerics = generics.filter(g => g.enabled && !g.deleted);
  const categories     = Array.from(new Set(activeGenerics.map(g => g.category))).sort();

  const filteredModalGenerics = modalSearch
    ? activeGenerics.filter(g =>
        g.generic.toLowerCase().includes(modalSearch.toLowerCase()) ||
        g.category.toLowerCase().includes(modalSearch.toLowerCase())
      )
    : activeGenerics;

  const modalCategories = Array.from(new Set(filteredModalGenerics.map(g => g.category))).sort();

  function openNew() {
    setForm({ name: "", type: "In-Clinic Dispensary", contact: "" });
    setSelected([]); setSellingPrice({}); setDispensingFee({});
    setEditId(null); setStep(1); setModalSearch(""); setShowModal(true);
  }

  function openEdit(p: FormularyPartner) {
    setForm({ name: p.name, type: p.type, contact: p.contact });
    setSelected([...p.selectedGenerics]);
    setSellingPrice({ ...p.sellingPrice });
    setDispensingFee({ ...p.dispensingFee });
    setEditId(p.id); setStep(1); setModalSearch(""); setShowModal(true);
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
    const newSP  = { ...partner.sellingPrice };
    const newDF  = { ...partner.dispensingFee };
    const matched: string[] = [];
    const unmatched: string[] = [];
    lines.forEach(([name, sp, df]) => {
      const gen = activeGenerics.find(g => g.generic.toLowerCase() === name?.toLowerCase());
      if (gen && sp) {
        newSP[gen.id] = sp;
        if (df) newDF[gen.id] = df;
        matched.push(name);
      } else if (name) {
        unmatched.push(name);
      }
    });
    setPartners(ps => ps.map(p => p.id === partnerId
      ? { ...p, sellingPrice: newSP, dispensingFee: newDF }
      : p
    ));
    setImportResult({ matched: matched.length, unmatched });
    setImportText("");
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Manage dispensaries and pharmacies, assign generics, and configure pricing.
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
          const selectedInActive = p.selectedGenerics.filter(id =>
            activeGenerics.some(g => g.id === id)
          );
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
                    {p.contact || "No contact"} · {selectedInActive.length} generic{selectedInActive.length !== 1 ? "s" : ""}
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

              {isExpanded && (
                <div className="border-t border-slate-100">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex-1">Generic Pricing</p>
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
                        Paste CSV: <span className="font-mono">Generic Name, Selling Price (PKR), Dispensing Fee</span> (one per line)
                      </p>
                      <textarea
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        rows={4}
                        className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#4982CF] resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <Button onClick={() => importPricing(p.id)} className="h-7 text-xs text-white px-3" style={{ background: ACCENT }}>
                          Apply
                        </Button>
                        <Button variant="outline" onClick={() => { setImportPartnerId(null); setImportResult(null); }} className="h-7 text-xs px-3">
                          Cancel
                        </Button>
                        {importResult && (
                          <span className="text-[10px] text-slate-500">
                            {importResult.matched} matched{importResult.unmatched.length > 0 && `, ${importResult.unmatched.length} unmatched`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 sticky top-0">
                          <th className="text-left px-4 py-2 font-black text-[10px] uppercase tracking-widest text-slate-400">Generic</th>
                          <th className="text-left px-4 py-2 font-black text-[10px] uppercase tracking-widest text-slate-400">Category</th>
                          <th className="text-right px-4 py-2 font-black text-[10px] uppercase tracking-widest text-slate-400 w-32">Selling Price (PKR)</th>
                          <th className="text-right px-4 py-2 font-black text-[10px] uppercase tracking-widest text-slate-400 w-32">Dispensing Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeGenerics.filter(g => p.selectedGenerics.includes(g.id)).map(g => (
                          <tr key={g.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-4 py-1.5 text-slate-700">{g.generic}</td>
                            <td className="px-4 py-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{g.category}</span>
                            </td>
                            <td className="px-4 py-1.5 text-right">
                              <Input
                                value={p.sellingPrice[g.id] ?? ""}
                                onChange={e => setPartners(ps => ps.map(x =>
                                  x.id === p.id ? { ...x, sellingPrice: { ...x.sellingPrice, [g.id]: e.target.value } } : x
                                ))}
                                placeholder="0.00"
                                className="h-6 text-xs text-right w-28 ml-auto"
                              />
                            </td>
                            <td className="px-4 py-1.5 text-right">
                              <Input
                                value={p.dispensingFee[g.id] ?? ""}
                                onChange={e => setPartners(ps => ps.map(x =>
                                  x.id === p.id ? { ...x, dispensingFee: { ...x.dispensingFee, [g.id]: e.target.value } } : x
                                ))}
                                placeholder="0.00"
                                className="h-6 text-xs text-right w-28 ml-auto"
                              />
                            </td>
                          </tr>
                        ))}
                        {p.selectedGenerics.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-slate-300 text-xs">
                              No generics selected for this partner
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
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
                  {s === 1 ? "Partner Details" : "Generic Selection & Pricing"}
                </span>
                {s < 2 && <div className="flex-1 h-px bg-slate-200" />}
              </div>
            ))}
          </div>

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

          {step === 2 && (
            <div className="flex flex-col gap-3 overflow-hidden flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    placeholder="Search generics…"
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <p className="text-xs text-slate-500 whitespace-nowrap">
                  {selected.length} of {activeGenerics.length} selected
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelected(activeGenerics.map(g => g.id))}
                    className="text-xs font-bold"
                    style={{ color: ACCENT }}
                  >
                    Select All
                  </button>
                  <button onClick={() => setSelected([])} className="text-xs font-bold text-slate-400">Clear</button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 border border-slate-100 rounded-xl">
                {modalCategories.map(cat => {
                  const genericsInCat = filteredModalGenerics.filter(g => g.category === cat);
                  return (
                    <div key={cat}>
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{cat}</p>
                      </div>
                      {genericsInCat.map(g => (
                        <div key={g.id} className="flex items-center gap-3 px-4 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                          <input
                            type="checkbox"
                            checked={selected.includes(g.id)}
                            onChange={() => setSelected(ss =>
                              ss.includes(g.id) ? ss.filter(x => x !== g.id) : [...ss, g.id]
                            )}
                            className="accent-[#4982CF]"
                          />
                          <span className="flex-1 text-xs text-slate-700">{g.generic}</span>
                          {selected.includes(g.id) && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">PKR</span>
                                <Input
                                  value={sellingPrice[g.id] ?? ""}
                                  onChange={e => setSellingPrice(p => ({ ...p, [g.id]: e.target.value }))}
                                  placeholder="Selling"
                                  className="h-6 w-20 text-xs text-right"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">Fee</span>
                                <Input
                                  value={dispensingFee[g.id] ?? ""}
                                  onChange={e => setDispensingFee(p => ({ ...p, [g.id]: e.target.value }))}
                                  placeholder="0.00"
                                  className="h-6 w-20 text-xs text-right"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
                {filteredModalGenerics.length === 0 && (
                  <p className="text-center text-xs text-slate-300 py-8">No generics match your search</p>
                )}
                {activeGenerics.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-8">
                    No generics found in the Medicine Catalogue. Add generics there first.
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
