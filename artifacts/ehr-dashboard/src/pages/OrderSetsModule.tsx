import { useState, useMemo } from "react";
import {
  Plus, Trash2, Edit2, Search, ChevronDown, ChevronRight,
  FlaskConical, ScanLine, Stethoscope, FileText, Copy,
  CheckCircle2, X, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { LabSection } from "@/pages/LabCatalogModule";
import type { ProcedureSection } from "@/pages/ProcedureCatalogModule";

function uid() { return Math.random().toString(36).slice(2, 10); }

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderItemType = "lab" | "imaging" | "procedure";

export interface OrderSetItem {
  id: string;
  type: OrderItemType;
  itemId: string;
  name: string;
  note?: string;
}

export interface OrderSet {
  id: string;
  name: string;
  category: string;
  description: string;
  items: OrderSetItem[];
  active: boolean;
  createdAt: string;
  setType: "lab" | "imaging";
}

// ─── Static imaging tests catalogue (mirrors ImagingCatalogModule seed) ───────

const IMAGING_CATALOG: { id: string; name: string; category: string }[] = [
  { id: "xray-chest",       name: "X-Ray Chest (PA)",          category: "X-Ray" },
  { id: "xray-abdomen",     name: "X-Ray Abdomen",             category: "X-Ray" },
  { id: "xray-knee",        name: "X-Ray Knee (AP/Lat)",       category: "X-Ray" },
  { id: "us-abdomen",       name: "Ultrasound Abdomen",        category: "Ultrasound" },
  { id: "us-thyroid",       name: "Ultrasound Thyroid",        category: "Ultrasound" },
  { id: "us-pelvis",        name: "Ultrasound Pelvis",         category: "Ultrasound" },
  { id: "echo-2d",          name: "2D Echocardiography",       category: "Ultrasound" },
  { id: "ct-brain",         name: "CT Brain (Plain)",          category: "CT Scan" },
  { id: "ct-chest",         name: "CT Chest",                  category: "CT Scan" },
  { id: "ct-abdo-pelvis",   name: "CT Abdomen & Pelvis",       category: "CT Scan" },
  { id: "mri-brain",        name: "MRI Brain",                 category: "MRI" },
  { id: "mri-knee",         name: "MRI Knee",                  category: "MRI" },
  { id: "mri-spine",        name: "MRI Spine (L/S)",           category: "MRI" },
  { id: "nuc-bone-scan",    name: "Nuclear: Bone Scan",        category: "Nuclear Medicine" },
  { id: "nuc-pet-ct",       name: "Nuclear: PET-CT",           category: "Nuclear Medicine" },
  { id: "dexa-scan",        name: "DEXA Scan",                 category: "Bone Densitometry" },
];

// ─── Order Set categories ──────────────────────────────────────────────────────

const ORDER_SET_CATEGORIES = [
  "Routine Workup", "Cardiac Panel", "Pre-operative",
  "Emergency / Acute", "Diabetes Screen", "Thyroid Panel",
  "Liver Screen", "Renal Screen", "Infection / Sepsis",
  "Oncology Panel", "Paediatric", "Custom",
];

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_ORDER_SETS: OrderSet[] = [
  // ── Lab Order Sets ──────────────────────────────────────────────────────────
  {
    id: "os1", name: "General Wellness Panel", category: "Routine Workup", setType: "lab",
    description: "Standard annual workup for healthy adults. Covers blood count, metabolic panel, and hormone screen.",
    active: true, createdAt: "2024-01-10",
    items: [
      { id: "oi1", type: "lab", itemId: "t1",  name: "Complete Blood Count (CBC)" },
      { id: "oi2", type: "lab", itemId: "t6",  name: "Fasting Blood Sugar" },
      { id: "oi3", type: "lab", itemId: "t8",  name: "Lipid Profile" },
      { id: "oi4", type: "lab", itemId: "t9",  name: "Liver Function Tests" },
      { id: "oi5", type: "lab", itemId: "t10", name: "Kidney Function Tests" },
      { id: "oi6", type: "lab", itemId: "t18", name: "TSH" },
    ],
  },
  {
    id: "os3", name: "Pre-Operative Workup", category: "Pre-operative", setType: "lab",
    description: "Standard pre-op assessment for elective surgery. Blood work and coagulation screen.",
    active: true, createdAt: "2024-03-05",
    items: [
      { id: "oi11", type: "lab", itemId: "t1",  name: "Complete Blood Count (CBC)" },
      { id: "oi12", type: "lab", itemId: "t5",  name: "Coagulation Profile (PT/APTT)" },
      { id: "oi13", type: "lab", itemId: "t9",  name: "Liver Function Tests" },
      { id: "oi14", type: "lab", itemId: "t10", name: "Kidney Function Tests" },
    ],
  },
  {
    id: "os6", name: "Cardiac Lab Panel", category: "Cardiac Panel", setType: "lab",
    description: "Lab component of the cardiac evaluation. Lipid profile and full blood count.",
    active: true, createdAt: "2024-02-14",
    items: [
      { id: "oi7", type: "lab", itemId: "t8", name: "Lipid Profile" },
      { id: "oi8", type: "lab", itemId: "t1", name: "Complete Blood Count (CBC)" },
    ],
  },
  {
    id: "os4", name: "Diabetes Follow-up", category: "Diabetes Screen", setType: "lab",
    description: "Quarterly diabetes monitoring panel. HbA1c, renal function, urine protein, and lipids.",
    active: true, createdAt: "2024-04-01",
    items: [
      { id: "oi16", type: "lab", itemId: "t6",  name: "Fasting Blood Sugar" },
      { id: "oi17", type: "lab", itemId: "t7",  name: "HbA1c" },
      { id: "oi18", type: "lab", itemId: "t10", name: "Kidney Function Tests" },
      { id: "oi19", type: "lab", itemId: "t17", name: "24-hr Urine Protein" },
      { id: "oi20", type: "lab", itemId: "t8",  name: "Lipid Profile" },
    ],
  },
  // ── Imaging Order Sets ──────────────────────────────────────────────────────
  {
    id: "os2", name: "Cardiac Imaging Panel", category: "Cardiac Panel", setType: "imaging",
    description: "Cardiac imaging evaluation including echocardiography and chest X-ray.",
    active: true, createdAt: "2024-02-14",
    items: [
      { id: "oi9",  type: "imaging", itemId: "echo-2d",    name: "2D Echocardiography" },
      { id: "oi10", type: "imaging", itemId: "xray-chest", name: "X-Ray Chest (PA)" },
    ],
  },
  {
    id: "os5", name: "Pre-Op Imaging", category: "Pre-operative", setType: "imaging",
    description: "Chest and abdominal imaging for pre-operative clearance.",
    active: true, createdAt: "2024-03-05",
    items: [
      { id: "oi21", type: "imaging", itemId: "xray-chest",      name: "X-Ray Chest (PA)" },
      { id: "oi22", type: "imaging", itemId: "us-abdomen",      name: "Ultrasound Abdomen" },
    ],
  },
];

// ─── Category colour map ──────────────────────────────────────────────────────

const CAT_COLOURS: Record<string, string> = {
  "Routine Workup":    "bg-sky-50 text-sky-700 border-sky-200",
  "Cardiac Panel":     "bg-rose-50 text-rose-700 border-rose-200",
  "Pre-operative":     "bg-violet-50 text-violet-700 border-violet-200",
  "Emergency / Acute": "bg-red-50 text-red-700 border-red-200",
  "Diabetes Screen":   "bg-amber-50 text-amber-700 border-amber-200",
  "Thyroid Panel":     "bg-teal-50 text-teal-700 border-teal-200",
  "Liver Screen":      "bg-orange-50 text-orange-700 border-orange-200",
  "Renal Screen":      "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Infection / Sepsis":"bg-green-50 text-green-700 border-green-200",
  "Oncology Panel":    "bg-purple-50 text-purple-700 border-purple-200",
  "Paediatric":        "bg-pink-50 text-pink-700 border-pink-200",
  "Custom":            "bg-slate-50 text-slate-700 border-slate-200",
};
function catColour(cat: string) {
  return CAT_COLOURS[cat] ?? "bg-slate-50 text-slate-600 border-slate-200";
}

const TYPE_ICON: Record<OrderItemType, React.ReactNode> = {
  lab:       <FlaskConical className="h-3 w-3" />,
  imaging:   <ScanLine className="h-3 w-3" />,
  procedure: <Stethoscope className="h-3 w-3" />,
};
const TYPE_LABEL: Record<OrderItemType, string> = {
  lab: "Lab", imaging: "Imaging", procedure: "Procedure",
};

// ─── Main module ──────────────────────────────────────────────────────────────

export function OrderSetsModule({
  labSections,
  procSections,
  setType,
}: {
  labSections: LabSection[];
  procSections: ProcedureSection[];
  setType: "lab" | "imaging";
}) {
  const [orderSets, setOrderSets] = useState<OrderSet[]>(() =>
    SEED_ORDER_SETS.filter(s => s.setType === setType)
  );
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState<string>("All");
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formName, setFormName]     = useState("");
  const [formCat, setFormCat]       = useState(ORDER_SET_CATEGORIES[0]);
  const [formDesc, setFormDesc]     = useState("");
  const [formCustomCat, setFormCustomCat] = useState("");
  const [formItems, setFormItems]   = useState<OrderSetItem[]>([]);
  const [itemSearch, setItemSearch] = useState("");

  // Flat lists for lookup
  const allLabTests = useMemo(() => labSections.flatMap(s => s.tests.map(t => ({ ...t, section: s.name }))), [labSections]);

  // ── Filtered order sets ─────────────────────────────────────────────────────
  const visible = orderSets.filter(os =>
    (catFilter === "All" || os.category === catFilter) &&
    (!search || os.name.toLowerCase().includes(search.toLowerCase()) || os.description.toLowerCase().includes(search.toLowerCase()))
  );

  const allCategories = ["All", ...Array.from(new Set(orderSets.map(os => os.category)))];

  // ── Open form ───────────────────────────────────────────────────────────────
  function openNew() {
    setFormName(""); setFormCat(ORDER_SET_CATEGORIES[0]); setFormDesc(""); setFormCustomCat("");
    setFormItems([]); setItemSearch(""); setEditingId(null); setShowForm(true);
  }

  function openEdit(os: OrderSet) {
    setFormName(os.name); setFormCat(os.category); setFormDesc(os.description); setFormCustomCat("");
    setFormItems([...os.items]); setItemSearch(""); setEditingId(os.id); setShowForm(true);
  }

  function duplicate(os: OrderSet) {
    const newSet: OrderSet = {
      ...os, id: uid(),
      name: `${os.name} (Copy)`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setOrderSets(prev => [...prev, newSet]);
  }

  function saveForm() {
    const name = formName.trim();
    if (!name) return;
    const category = formCat === "Custom" && formCustomCat.trim() ? formCustomCat.trim() : formCat;
    if (editingId) {
      setOrderSets(prev => prev.map(os => os.id === editingId ? { ...os, name, category, description: formDesc.trim(), items: formItems } : os));
    } else {
      setOrderSets(prev => [...prev, {
        id: uid(), name, category, description: formDesc.trim(),
        items: formItems, active: true, createdAt: new Date().toISOString().slice(0, 10),
        setType,
      }]);
    }
    setShowForm(false);
  }

  // ── Item management ─────────────────────────────────────────────────────────
  function isItemAdded(type: OrderItemType, itemId: string) {
    return formItems.some(i => i.type === type && i.itemId === itemId);
  }

  function toggleItem(type: OrderItemType, itemId: string, name: string) {
    if (isItemAdded(type, itemId)) {
      setFormItems(prev => prev.filter(i => !(i.type === type && i.itemId === itemId)));
    } else {
      setFormItems(prev => [...prev, { id: uid(), type, itemId, name }]);
    }
  }

  function removeItem(id: string) {
    setFormItems(prev => prev.filter(i => i.id !== id));
  }

  function exportCSV() {
    const rows = [["Order Set", "Category", "Description", "Item Type", "Item Name", "Active"]];
    orderSets.forEach(os =>
      os.items.length > 0
        ? os.items.forEach(item => rows.push([os.name, os.category, os.description, TYPE_LABEL[item.type], item.name, os.active ? "Yes" : "No"]))
        : rows.push([os.name, os.category, os.description, "", "", os.active ? "Yes" : "No"])
    );
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = setType === "lab" ? "lab-order-sets.csv" : "imaging-order-sets.csv";
    a.click();
  }

  // ── Item catalogue rows ─────────────────────────────────────────────────────
  const currentCatRows: { id: string; name: string }[] =
    setType === "lab"
      ? allLabTests.filter(t => !itemSearch || t.name.toLowerCase().includes(itemSearch.toLowerCase()))
      : IMAGING_CATALOG.filter(t => !itemSearch || t.name.toLowerCase().includes(itemSearch.toLowerCase()));

  const addedCount = formItems.length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {setType === "lab" ? "Lab Order Sets" : "Imaging Order Sets"}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {setType === "lab"
                ? "Design reusable bundles of lab test orders for the doctor panel."
                : "Design reusable bundles of imaging orders for the doctor panel."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCSV} className="h-8 text-xs gap-1.5 text-slate-600">
              <FileText className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button onClick={openNew} className="h-8 text-xs bg-[#4982CF] hover:bg-[#3b6bb5] text-white gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New Order Set
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order sets…" className="h-8 pl-8 text-xs w-56" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {allCategories.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className={`h-7 rounded-full px-3 text-xs font-medium border transition-colors ${catFilter === cat ? "bg-[#4982CF] text-white border-[#4982CF]" : "bg-white text-slate-600 border-slate-200 hover:border-[#4982CF]/50"}`}>
                {cat}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-slate-400">{visible.length} set{visible.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Order Set Cards */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
            {setType === "lab"
              ? <FlaskConical className="h-12 w-12 text-slate-200 mb-3" />
              : <ScanLine className="h-12 w-12 text-slate-200 mb-3" />}
            <p className="font-semibold text-slate-500">No order sets found</p>
            <p className="text-sm text-slate-400 mt-1">{search ? "Try a different search" : "Click 'New Order Set' to create your first one"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible.map(os => (
              <OrderSetCard
                key={os.id}
                os={os}
                onEdit={() => openEdit(os)}
                onDelete={() => setDeleteId(os.id)}
                onDuplicate={() => duplicate(os)}
                onToggleActive={() => setOrderSets(prev => prev.map(x => x.id === os.id ? { ...x, active: !x.active } : x))}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Builder Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={open => !open && setShowForm(false)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="flex-none border-b border-slate-100 px-6 py-4">
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingId ? "Edit Order Set" : "New Order Set"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Left: meta + item list */}
            <div className="w-72 flex-none border-r border-slate-100 flex flex-col bg-slate-50/50 overflow-hidden">
              <div className="flex-none px-4 py-3 space-y-3 border-b border-slate-100 bg-white">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Name <span className="text-rose-500">*</span></label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Cardiac Panel…" className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</label>
                  <select value={formCat} onChange={e => setFormCat(e.target.value)}
                    className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4982CF]">
                    {ORDER_SET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {formCat === "Custom" && (
                    <Input value={formCustomCat} onChange={e => setFormCustomCat(e.target.value)} placeholder="Custom category name…" className="h-8 text-xs mt-1.5" />
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</label>
                  <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} placeholder="Brief description…"
                    className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#4982CF] resize-none" />
                </div>
              </div>

              {/* Items in this set */}
              <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 bg-slate-50/90 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Items Added</span>
                  <span className="text-[10px] font-bold text-[#4982CF]">{formItems.length}</span>
                </div>
                {formItems.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-300">
                    Select items from the catalogue on the right
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {(["lab", "imaging", "procedure"] as OrderItemType[]).map(type => {
                      const group = formItems.filter(i => i.type === type);
                      if (!group.length) return null;
                      return (
                        <div key={type}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-1">{TYPE_LABEL[type]}</p>
                          {group.map(item => (
                            <div key={item.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white group">
                              <span className="text-[#4982CF] flex-shrink-0">{TYPE_ICON[item.type]}</span>
                              <span className="text-xs text-slate-700 flex-1 leading-tight">{item.name}</span>
                              <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-none border-t border-slate-100 p-3 bg-white flex gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 h-8 text-xs">Cancel</Button>
                <Button onClick={saveForm} disabled={!formName.trim()} className="flex-1 h-8 text-xs bg-[#4982CF] hover:bg-[#3b6bb5] text-white">
                  {editingId ? "Save Changes" : "Create"}
                </Button>
              </div>
            </div>

            {/* Right: catalogue browser */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tab header — single type, no switcher needed */}
              <div className="flex-none border-b border-slate-100 flex items-center gap-2 px-4 py-2.5 bg-white">
                <span className="text-[#4982CF]">{TYPE_ICON[setType]}</span>
                <span className="text-xs font-semibold text-[#4982CF]">{TYPE_LABEL[setType]} Catalogue</span>
                {addedCount > 0 && (
                  <span className="ml-1 rounded-full bg-[#4982CF] text-white text-[9px] px-1.5 py-0.5">{addedCount}</span>
                )}
              </div>

              {/* Search */}
              <div className="flex-none px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <Input value={itemSearch} onChange={e => setItemSearch(e.target.value)} placeholder={`Search ${TYPE_LABEL[setType].toLowerCase()} tests…`} className="h-7 pl-8 text-xs" />
                </div>
              </div>

              {/* Catalogue list */}
              <div className="flex-1 overflow-y-auto">
                {setType === "lab" && (
                  labSections.map(sec => {
                    const tests = sec.tests.filter(t => !itemSearch || t.name.toLowerCase().includes(itemSearch.toLowerCase()));
                    if (!tests.length) return null;
                    return (
                      <div key={sec.id}>
                        <div className="sticky top-0 bg-slate-50/95 px-4 py-1.5 border-b border-slate-100">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{sec.name}</span>
                        </div>
                        {tests.map(t => {
                          const added = isItemAdded("lab", t.id);
                          return (
                            <label key={t.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors ${added ? "bg-[#4982CF]/5" : ""}`}>
                              <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${added ? "bg-[#4982CF] border-[#4982CF]" : "border-slate-300"}`}
                                onClick={() => toggleItem("lab", t.id, t.name)}>
                                {added && <CheckCircle2 className="h-3 w-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0" onClick={() => toggleItem("lab", t.id, t.name)}>
                                <p className="text-xs font-medium text-slate-700">{t.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {t.sampleType && <span className="text-[10px] text-[#4982CF]">{t.sampleType}</span>}
                                  {t.fastingRequired && <span className="text-[10px] text-amber-600 font-semibold">· Fasting</span>}
                                  {t.description && <span className="text-[10px] text-slate-400">{t.sampleType || t.fastingRequired ? "· " : ""}{t.description}</span>}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    );
                  })
                )}

                {setType === "imaging" && (() => {
                  const byCat = IMAGING_CATALOG.reduce((acc, t) => {
                    if (itemSearch && !t.name.toLowerCase().includes(itemSearch.toLowerCase())) return acc;
                    if (!acc[t.category]) acc[t.category] = [];
                    acc[t.category].push(t);
                    return acc;
                  }, {} as Record<string, typeof IMAGING_CATALOG>);
                  return Object.entries(byCat).map(([cat, tests]) => (
                    <div key={cat}>
                      <div className="sticky top-0 bg-slate-50/95 px-4 py-1.5 border-b border-slate-100">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{cat}</span>
                      </div>
                      {tests.map(t => {
                        const added = isItemAdded("imaging", t.id);
                        return (
                          <label key={t.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors ${added ? "bg-[#4982CF]/5" : ""}`}>
                            <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${added ? "bg-[#4982CF] border-[#4982CF]" : "border-slate-300"}`}
                              onClick={() => toggleItem("imaging", t.id, t.name)}>
                              {added && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <p className="text-xs font-medium text-slate-700 flex-1 cursor-pointer" onClick={() => toggleItem("imaging", t.id, t.name)}>{t.name}</p>
                          </label>
                        );
                      })}
                    </div>
                  ));
                })()}

                {currentCatRows.length === 0 && itemSearch && (
                  <div className="text-center py-12 text-xs text-slate-300">No matches for "{itemSearch}"</div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Delete Order Set?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 mb-4">This cannot be undone. The order set will be permanently removed.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button className="bg-rose-500 hover:bg-rose-600 text-white" onClick={() => { setOrderSets(prev => prev.filter(os => os.id !== deleteId)); setDeleteId(null); }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Order Set Card ───────────────────────────────────────────────────────────

function OrderSetCard({
  os, onEdit, onDelete, onDuplicate, onToggleActive,
}: {
  os: OrderSet;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const labItems  = os.items.filter(i => i.type === "lab");
  const imgItems  = os.items.filter(i => i.type === "imaging");
  const procItems = os.items.filter(i => i.type === "procedure");

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${os.active ? "border-slate-200" : "border-slate-200 opacity-60"}`}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Layers className="h-4 w-4 text-[#4982CF]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-800">{os.name}</p>
              <Badge variant="outline" className={`text-[10px] font-semibold border ${catColour(os.category)}`}>{os.category}</Badge>
            </div>
            {os.description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{os.description}</p>}
          </div>
        </div>

        {/* Item count pills */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {labItems.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 px-2 py-0.5 text-[10px] font-semibold">
              <FlaskConical className="h-2.5 w-2.5" /> {labItems.length} Lab
            </span>
          )}
          {imgItems.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 px-2 py-0.5 text-[10px] font-semibold">
              <ScanLine className="h-2.5 w-2.5" /> {imgItems.length} Imaging
            </span>
          )}
          {procItems.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 text-[10px] font-semibold">
              <Stethoscope className="h-2.5 w-2.5" /> {procItems.length} Procedure
            </span>
          )}
          {os.items.length === 0 && <span className="text-[10px] text-slate-300 italic">No items yet</span>}
          {os.items.length > 0 && (
            <button onClick={() => setExpanded(e => !e)} className="ml-auto flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-[#4982CF]">
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {expanded ? "Hide" : "View"}
            </button>
          )}
        </div>

        {/* Expanded item list */}
        {expanded && (
          <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/50 divide-y divide-slate-100">
            {os.items.map(item => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-1.5">
                <span className="text-slate-400">{TYPE_ICON[item.type]}</span>
                <span className="text-xs text-slate-600">{item.name}</span>
                <Badge variant="outline" className="ml-auto text-[9px] text-slate-400 border-slate-200">{TYPE_LABEL[item.type]}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/60 border-t border-slate-100">
        <Switch checked={os.active} onCheckedChange={onToggleActive} className="data-[state=checked]:bg-[#4982CF] scale-75" />
        <span className="text-[10px] text-slate-400">{os.active ? "Active" : "Inactive"}</span>
        <span className="ml-auto text-[10px] text-slate-300">{os.createdAt}</span>
        <button onClick={onDuplicate} title="Duplicate" className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-[#4982CF]"><Copy className="h-3 w-3" /></button>
        <button onClick={onEdit} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button>
      </div>
    </div>
  );
}
