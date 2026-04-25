import { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit2, X, GripVertical, Search, ChevronDown,
  ChevronRight, CheckCircle2, FileText, RotateCcw, EyeOff, Eye,
  ScanLine, Save, Upload, AlertCircle, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ACCENT = "#4982CF";
const CATALOGUE_KEY = "ehr-imaging-catalogue-v1";
const REASONS_KEY   = "ehr-imaging-reasons-v1";
const PARTNERS_KEY  = "ehr-imaging-partners-v1";

function uid() { return `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }
function reorder<T>(arr: T[], from: number, to: number) {
  const next = [...arr];
  const [mv] = next.splice(from, 1);
  next.splice(to, 0, mv);
  return next;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ImagingTest {
  id:       string;
  name:     string;
  category: string;
  enabled:  boolean;
  deleted:  boolean;
}

export type ImagingPartnerType = "Internal Radiology" | "External Centre";

export interface ImagingPartner {
  id:            string;
  name:          string;
  type:          ImagingPartnerType;
  contact:       string;
  active:        boolean;
  selectedTests: string[];
  pricing:       Record<string, string>;
  doctorRate:    Record<string, string>;
}

// ─── Seed data (mirrors ImagingSection.tsx IMAGING_TESTS / REASON_TEMPLATES) ───

const SEED_TESTS: Omit<ImagingTest, "enabled" | "deleted">[] = [
  { id: "xray-chest",         name: "X-Ray Chest",                   category: "X-Ray"           },
  { id: "xray-abdomen",       name: "X-Ray Abdomen",                 category: "X-Ray"           },
  { id: "xray-knee",          name: "X-Ray Knee",                    category: "X-Ray"           },
  { id: "xray-spine-ls",      name: "X-Ray Spine (LS)",              category: "X-Ray"           },
  { id: "xray-spine-cx",      name: "X-Ray Spine (Cervical)",        category: "X-Ray"           },
  { id: "xray-pelvis",        name: "X-Ray Pelvis",                  category: "X-Ray"           },
  { id: "xray-shoulder",      name: "X-Ray Shoulder",                category: "X-Ray"           },
  { id: "xray-ankle",         name: "X-Ray Ankle",                   category: "X-Ray"           },
  { id: "xray-wrist",         name: "X-Ray Wrist",                   category: "X-Ray"           },
  { id: "xray-hand",          name: "X-Ray Hand",                    category: "X-Ray"           },
  { id: "ct-brain",           name: "CT Brain",                      category: "CT Scan"         },
  { id: "ct-chest",           name: "CT Chest",                      category: "CT Scan"         },
  { id: "ct-abdo-pelvis",     name: "CT Abdomen & Pelvis",           category: "CT Scan"         },
  { id: "ct-angio",           name: "CT Angiography",                category: "CT Scan"         },
  { id: "ct-kub",             name: "CT KUB",                        category: "CT Scan"         },
  { id: "ct-coronary",        name: "CT Coronary Angiography",       category: "CT Scan"         },
  { id: "ct-spine",           name: "CT Spine",                      category: "CT Scan"         },
  { id: "mri-brain",          name: "MRI Brain",                     category: "MRI"             },
  { id: "mri-spine-ls",       name: "MRI Spine (LS)",                category: "MRI"             },
  { id: "mri-spine-cx",       name: "MRI Spine (Cervical)",          category: "MRI"             },
  { id: "mri-knee",           name: "MRI Knee",                      category: "MRI"             },
  { id: "mri-shoulder",       name: "MRI Shoulder",                  category: "MRI"             },
  { id: "mri-abdomen",        name: "MRI Abdomen",                   category: "MRI"             },
  { id: "mri-pelvis",         name: "MRI Pelvis",                    category: "MRI"             },
  { id: "mri-whole-body",     name: "MRI Whole Body",                category: "MRI"             },
  { id: "us-abdomen",         name: "Ultrasound Abdomen",            category: "Ultrasound"      },
  { id: "us-pelvis",          name: "Ultrasound Pelvis",             category: "Ultrasound"      },
  { id: "us-thyroid",         name: "Ultrasound Thyroid",            category: "Ultrasound"      },
  { id: "us-renal",           name: "Ultrasound Renal",              category: "Ultrasound"      },
  { id: "us-scrotal",         name: "Ultrasound Scrotal",            category: "Ultrasound"      },
  { id: "us-breast",          name: "Ultrasound Breast",             category: "Ultrasound"      },
  { id: "us-doppler-carotid", name: "Doppler Carotid",               category: "Ultrasound"      },
  { id: "us-doppler-le",      name: "Doppler Lower Limbs",           category: "Ultrasound"      },
  { id: "echo-2d",            name: "2D Echocardiography",           category: "Echocardiography"},
  { id: "echo-stress",        name: "Stress Echocardiography",       category: "Echocardiography"},
  { id: "echo-tee",           name: "Trans-Esophageal Echo (TEE)",   category: "Echocardiography"},
  { id: "nuc-bone-scan",      name: "Bone Scan",                     category: "Nuclear Medicine"},
  { id: "nuc-pet-ct",         name: "PET-CT Scan",                   category: "Nuclear Medicine"},
  { id: "nuc-thyroid-scan",   name: "Thyroid Scan",                  category: "Nuclear Medicine"},
  { id: "fluoro-barium",      name: "Barium Swallow",                category: "Fluoroscopy"     },
  { id: "fluoro-hsg",         name: "Hysterosalpingography (HSG)",   category: "Fluoroscopy"     },
  { id: "fluoro-ercp",        name: "ERCP",                          category: "Fluoroscopy"     },
  { id: "mammo",              name: "Mammography",                   category: "Mammography"     },
  { id: "mammo-bilateral",    name: "Bilateral Mammography",         category: "Mammography"     },
];

const SEED_REASONS = [
  "Rule out infection",
  "Trauma evaluation",
  "Chronic pain assessment",
  "Rule out malignancy",
  "Post-operative follow-up",
  "Rule out fracture",
  "Monitoring disease progression",
  "Pre-operative assessment",
  "Rule out pulmonary embolism",
  "Evaluate soft tissue injury",
  "Rule out intracranial pathology",
  "Assess joint pathology",
  "Rule out renal calculi",
  "Cardiac evaluation",
  "Routine follow-up",
];

const SEED_PARTNERS: ImagingPartner[] = [
  {
    id: "ip1", name: "In-House Radiology", type: "Internal Radiology", contact: "", active: true,
    selectedTests: ["xray-chest","xray-abdomen","xray-knee","us-abdomen","us-thyroid","echo-2d"],
    pricing:    { "xray-chest": "800", "xray-abdomen": "900", "xray-knee": "700", "us-abdomen": "1500", "us-thyroid": "1200", "echo-2d": "3500" },
    doctorRate: { "xray-chest": "0",   "xray-abdomen": "0",   "xray-knee": "0",   "us-abdomen": "400",  "us-thyroid": "350",  "echo-2d": "1000" },
  },
  {
    id: "ip2", name: "City Diagnostics Centre", type: "External Centre", contact: "0300-9876543", active: true,
    selectedTests: ["ct-brain","ct-chest","ct-abdo-pelvis","mri-brain","mri-knee","nuc-pet-ct"],
    pricing:    { "ct-brain": "7000", "ct-chest": "8000", "ct-abdo-pelvis": "9000", "mri-brain": "12000", "mri-knee": "10000", "nuc-pet-ct": "35000" },
    doctorRate: { "ct-brain": "1500", "ct-chest": "1500", "ct-abdo-pelvis": "2000", "mri-brain": "2500",  "mri-knee": "2000",  "nuc-pet-ct": "5000"  },
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "X-Ray":             "#0ea5e9",
  "CT Scan":           "#8b5cf6",
  "MRI":               "#6366f1",
  "Ultrasound":        "#10b981",
  "Echocardiography":  "#f59e0b",
  "Nuclear Medicine":  "#ef4444",
  "Fluoroscopy":       "#f97316",
  "Mammography":       "#ec4899",
};

const KNOWN_CATS = [
  "X-Ray", "CT Scan", "MRI", "Ultrasound",
  "Echocardiography", "Nuclear Medicine", "Fluoroscopy", "Mammography",
];

function seedTests(): ImagingTest[] {
  try {
    const raw = localStorage.getItem(CATALOGUE_KEY);
    if (raw) return JSON.parse(raw) as ImagingTest[];
  } catch { /**/ }
  return SEED_TESTS.map(t => ({ ...t, enabled: true, deleted: false }));
}

function seedReasons(): string[] {
  try {
    const raw = localStorage.getItem(REASONS_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch { /**/ }
  return [...SEED_REASONS];
}

function seedPartners(): ImagingPartner[] {
  try {
    const raw = localStorage.getItem(PARTNERS_KEY);
    if (raw) return JSON.parse(raw) as ImagingPartner[];
  } catch { /**/ }
  return [...SEED_PARTNERS];
}

// ─── Tab 1: Imaging Test List (inline add + inline edit) ───────────────────────

interface InlineEdit { name: string; category: string; customCat: string; }

function ImagingTestListTab({
  tests, setTests,
}: {
  tests: ImagingTest[];
  setTests: React.Dispatch<React.SetStateAction<ImagingTest[]>>;
}) {
  const [search,       setSearch]       = useState("");
  const [filterCat,    setFilterCat]    = useState("All");
  const [showInactive, setShowInactive] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // Inline editing
  const [editId,   setEditId]   = useState<string | null>(null);
  const [editData, setEditData] = useState<InlineEdit>({ name: "", category: "X-Ray", customCat: "" });

  // Inline add (shown at bottom of a category or global)
  const [addCat,    setAddCat]    = useState<string | null>(null);
  const [addName,   setAddName]   = useState("");
  const [addCatVal, setAddCatVal] = useState(KNOWN_CATS[0]);
  const [addCustom, setAddCustom] = useState("");

  const categories = Array.from(new Set(tests.map(t => t.category))).sort();

  function isVisible(t: ImagingTest) {
    if (t.deleted && !showInactive) return false;
    if (!t.enabled && !showInactive) return false;
    if (filterCat !== "All" && t.category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    }
    return true;
  }

  const visible = tests.filter(isVisible);

  const grouped: { cat: string; items: ImagingTest[] }[] = [];
  const seen = new Set<string>();
  for (const t of visible) {
    if (!seen.has(t.category)) { seen.add(t.category); grouped.push({ cat: t.category, items: [] }); }
    grouped.find(g => g.cat === t.category)!.items.push(t);
  }

  function isCatExpanded(cat: string) { return expandedCats[cat] !== false; }
  function toggleCat(cat: string) { setExpandedCats(p => ({ ...p, [cat]: !isCatExpanded(cat) })); }

  function softDelete(id: string) {
    setTests(p => p.map(t => t.id === id ? { ...t, deleted: true, enabled: false } : t));
    if (editId === id) setEditId(null);
  }
  function restore(id: string) {
    setTests(p => p.map(t => t.id === id ? { ...t, deleted: false, enabled: true } : t));
  }
  function toggleEnabled(id: string) {
    setTests(p => p.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  }

  function startEdit(t: ImagingTest) {
    const known = KNOWN_CATS.includes(t.category) || categories.includes(t.category);
    setEditId(t.id);
    setEditData({
      name:      t.name,
      category:  known ? t.category : "__custom__",
      customCat: known ? "" : t.category,
    });
  }

  function saveEdit(id: string) {
    const name = editData.name.trim();
    const cat  = editData.category === "__custom__" ? editData.customCat.trim() : editData.category;
    if (!name || !cat) return;
    setTests(p => p.map(t => t.id === id ? { ...t, name, category: cat } : t));
    setEditId(null);
  }

  function addTest() {
    const name = addName.trim();
    const cat  = addCatVal === "__custom__" ? addCustom.trim() : addCatVal;
    if (!name || !cat) return;
    setTests(p => [...p, { id: uid(), name, category: cat, enabled: true, deleted: false }]);
    setAddName("");
    setAddCustom("");
    setAddCat(null);
  }

  function exportCSV() {
    const rows = [["Category", "Test Name", "Enabled"]];
    tests.filter(t => t.enabled && !t.deleted).forEach(t => rows.push([t.category, t.name, "Yes"]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "imaging-test-catalogue.csv";
    a.click();
  }

  const allCatOptions = [...new Set([...KNOWN_CATS, ...categories])];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search test name or category…" className="pl-8 h-8 text-xs" />
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
          <Button size="sm" onClick={() => { setAddCat("__new__"); setAddCatVal(KNOWN_CATS[0]); setAddName(""); setAddCustom(""); }}
            style={{ background: ACCENT }} className="text-white text-xs gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" /> Add Test
          </Button>
        </div>
      </div>

      {/* Grouped list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Global inline add row (when not adding within a specific category) */}
        {addCat === "__new__" && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-[#4982CF]/50 bg-[#4982CF]/5">
            <ScanLine className="h-3.5 w-3.5 text-[#4982CF] flex-shrink-0" />
            <Input value={addName} onChange={e => setAddName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTest()}
              placeholder="Test name…" className="h-7 text-xs flex-1 max-w-xs" autoFocus />
            <select value={addCatVal} onChange={e => setAddCatVal(e.target.value)}
              className="h-7 text-xs rounded-md border border-slate-200 bg-white px-2 outline-none focus:ring-1 focus:ring-[#4982CF]/40">
              {allCatOptions.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__custom__">+ Custom…</option>
            </select>
            {addCatVal === "__custom__" && (
              <Input value={addCustom} onChange={e => setAddCustom(e.target.value)}
                placeholder="Category name" className="h-7 text-xs w-32" />
            )}
            <button onClick={addTest}
              className="p-1.5 rounded hover:bg-[#4982CF] hover:text-white text-[#4982CF] transition-colors"
              title="Save test">
              <CheckCircle2 className="h-4 w-4" />
            </button>
            <button onClick={() => setAddCat(null)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {visible.length === 0 && addCat !== "__new__" && (
          <div className="text-center py-16 text-slate-400 text-sm">No tests match your filter.</div>
        )}

        {grouped.map(({ cat, items }) => {
          const color   = CATEGORY_COLORS[cat] ?? "#64748b";
          const expanded = isCatExpanded(cat);
          return (
            <div key={cat}>
              <button className="flex items-center gap-2 w-full text-left mb-2 group" onClick={() => toggleCat(cat)}>
                <span className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{cat}</span>
                <span className="text-[10px] text-slate-400 ml-1">{items.length} test{items.length !== 1 ? "s" : ""}</span>
                <span className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors">
                  {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              </button>

              {expanded && (
                <div className="space-y-1 pl-4 border-l-2" style={{ borderColor: `${color}40` }}>
                  {items.map(t => {
                    const isEditing  = editId === t.id;
                    const isDisabled = !t.enabled || t.deleted;

                    if (isEditing) {
                      return (
                        <div key={t.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#4982CF]/40 bg-[#4982CF]/5">
                          <ScanLine className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
                          <Input
                            value={editData.name}
                            onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && saveEdit(t.id)}
                            className="h-7 text-xs flex-1 max-w-xs"
                            autoFocus
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
                              placeholder="Category…"
                              className="h-7 text-xs w-28"
                            />
                          )}
                          <button onClick={() => saveEdit(t.id)} title="Save"
                            className="p-1.5 rounded hover:bg-[#4982CF] hover:text-white text-[#4982CF] transition-colors">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditId(null)} title="Cancel"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div key={t.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border bg-white group transition-all ${
                          t.deleted ? "border-dashed border-red-200 opacity-60"
                          : !t.enabled ? "border-slate-100 opacity-60"
                          : "border-slate-200 hover:border-slate-300"
                        }`}>
                        <ScanLine className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
                        <span className={`flex-1 text-sm font-medium ${isDisabled ? "text-slate-400" : "text-slate-800"}`}>
                          {t.name}
                        </span>
                        {t.deleted && (
                          <span className="text-[10px] font-semibold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0 rounded">
                            Deleted
                          </span>
                        )}
                        {!t.deleted && !t.enabled && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0 rounded">
                            Disabled
                          </span>
                        )}
                        {t.deleted ? (
                          <button onClick={() => restore(t.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors">
                            <RotateCcw className="h-3 w-3" /> Restore
                          </button>
                        ) : (
                          <>
                            <Switch checked={t.enabled} onCheckedChange={() => toggleEnabled(t.id)}
                              className="data-[state=checked]:bg-[#4982CF]" />
                            <button onClick={() => startEdit(t)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-all">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => softDelete(t.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              title="Remove from catalogue">
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

// ─── Tab 2: Reason Templates ───────────────────────────────────────────────────

function ReasonTemplatesTab() {
  const [items,   setItems]   = useState<string[]>(seedReasons);
  const [saved,   setSaved]   = useState(true);
  const [newText, setNewText] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  // Auto-persist every change so data is never lost on refresh
  useEffect(() => {
    try { localStorage.setItem(REASONS_KEY, JSON.stringify(items)); } catch { /**/ }
    setSaved(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  function confirmSave() { setSaved(true); }

  function addReason() {
    const v = newText.trim();
    if (!v || items.includes(v)) return;
    setItems(p => [...p, v]);
    setNewText("");
  }

  function deleteReason(idx: number) {
    setItems(p => p.filter((_, i) => i !== idx));
    if (editIdx === idx) setEditIdx(null);
  }

  function startEdit(idx: number) {
    setEditIdx(idx);
    setEditVal(items[idx]);
  }

  function saveEdit(idx: number) {
    const v = editVal.trim();
    if (!v) return;
    setItems(p => p.map((x, i) => i === idx ? v : x));
    setEditIdx(null);
  }

  function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDropIdx(null); return; }
    setItems(p => reorder(p, dragIdx, toIdx));
    setDragIdx(null);
    setDropIdx(null);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
        <p className="text-xs text-slate-500 flex-1">
          Manage indication templates available when ordering imaging tests. Drag to reorder.
        </p>
        <Button size="sm" onClick={confirmSave} disabled={saved}
          className={`h-8 text-xs gap-1.5 transition-all ${!saved ? "text-white" : "bg-white text-slate-400 border border-slate-200 cursor-default"}`}
          style={!saved ? { background: ACCENT } : {}}>
          <Save className="h-3.5 w-3.5" />
          {!saved ? "Save" : "Up to date"}
        </Button>
      </div>

      {/* Add new reason */}
      <div className="px-6 py-3 border-b border-slate-100 flex gap-2">
        <Input
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addReason()}
          placeholder="Add a new reason template…"
          className="h-8 text-xs flex-1"
        />
        <Button onClick={addReason} className="h-8 text-xs text-white gap-1.5 px-3" style={{ background: ACCENT }}
          disabled={!newText.trim()}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {/* Reason list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-1.5">
          {items.map((reason, idx) => (
            <div key={idx} draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={e => { e.preventDefault(); setDropIdx(idx); }}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-white group transition-all ${
                dropIdx === idx && dragIdx !== idx
                  ? "border-[#4982CF] border-dashed bg-[#4982CF]/5"
                  : "border-slate-200 hover:border-slate-300"
              } ${dragIdx === idx ? "opacity-50" : ""}`}>
              <GripVertical className="h-4 w-4 text-slate-300 cursor-grab flex-shrink-0" />
              <span className="text-[10px] font-bold text-slate-400 w-5 shrink-0 text-right">{idx + 1}.</span>
              {editIdx === idx ? (
                <>
                  <Input
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveEdit(idx); if (e.key === "Escape") setEditIdx(null); }}
                    className="h-7 text-xs flex-1"
                    autoFocus
                  />
                  <button onClick={() => saveEdit(idx)} className="text-emerald-500 hover:text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditIdx(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-700">{reason}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(idx)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteReason(idx)}
                      className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">No reason templates yet. Add one above.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: Imaging Partners ────────────────────────────────────────────────────

const PARTNER_TYPE_COLORS: Record<ImagingPartnerType, string> = {
  "Internal Radiology": "bg-blue-50 text-blue-600 border-blue-200",
  "External Centre":    "bg-amber-50 text-amber-600 border-amber-200",
};

function ImagingPartnersTab({
  partners, setPartners, tests,
}: {
  partners:    ImagingPartner[];
  setPartners: React.Dispatch<React.SetStateAction<ImagingPartner[]>>;
  tests:       ImagingTest[];
}) {
  const [step, setStep]           = useState<1 | 2>(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState<{ name: string; type: ImagingPartnerType; contact: string }>({
    name: "", type: "Internal Radiology", contact: "",
  });
  const [selected,   setSelected]   = useState<string[]>([]);
  const [pricing,    setPricing]    = useState<Record<string, string>>({});
  const [doctorRate, setDoctorRate] = useState<Record<string, string>>({});
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [expandId,   setExpandId]   = useState<string | null>(null);
  const [importPartnerId, setImportPartnerId] = useState<string | null>(null);
  const [importText,   setImportText]   = useState("");
  const [importResult, setImportResult] = useState<{ matched: number; unmatched: string[] } | null>(null);
  const [modalSearch,  setModalSearch]  = useState("");

  const activeTests = tests.filter(t => t.enabled && !t.deleted);
  const categories  = Array.from(new Set(activeTests.map(t => t.category))).sort();

  function openNew() {
    setForm({ name: "", type: "Internal Radiology", contact: "" });
    setSelected([]); setPricing({}); setDoctorRate({}); setEditId(null); setStep(1); setModalSearch(""); setShowModal(true);
  }

  function openEdit(p: ImagingPartner) {
    setForm({ name: p.name, type: p.type, contact: p.contact });
    setSelected([...p.selectedTests]); setPricing({ ...p.pricing }); setDoctorRate({ ...p.doctorRate });
    setEditId(p.id); setStep(1); setModalSearch(""); setShowModal(true);
  }

  function save() {
    const data: ImagingPartner = {
      id: editId ?? uid(), name: form.name.trim(), type: form.type, contact: form.contact,
      active: editId ? (partners.find(p => p.id === editId)?.active ?? true) : true,
      selectedTests: selected, pricing, doctorRate,
    };
    if (editId) setPartners(ps => ps.map(p => p.id === editId ? data : p));
    else setPartners(ps => [...ps, data]);
    setShowModal(false);
  }

  function importPricing(partnerId: string) {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;
    const lines = importText.trim().split("\n").map(l => l.split(",").map(s => s.trim().replace(/^"|"$/g, "")));
    const newPricing = { ...partner.pricing };
    const newDr      = { ...partner.doctorRate };
    const matched: string[] = [];
    const unmatched: string[] = [];
    lines.forEach(([name, price, dr]) => {
      const test = activeTests.find(t => t.name.toLowerCase() === name?.toLowerCase());
      if (test && price) { newPricing[test.id] = price; if (dr) newDr[test.id] = dr; matched.push(name); }
      else if (name) unmatched.push(name);
    });
    setPartners(ps => ps.map(p => p.id === partnerId ? { ...p, pricing: newPricing, doctorRate: newDr } : p));
    setImportResult({ matched: matched.length, unmatched });
    setImportText("");
  }

  const filteredModalTests = modalSearch
    ? activeTests.filter(t => t.name.toLowerCase().includes(modalSearch.toLowerCase()) || t.category.toLowerCase().includes(modalSearch.toLowerCase()))
    : activeTests;

  const modalCategories = Array.from(new Set(filteredModalTests.map(t => t.category))).sort();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Manage radiology centers and their per-test pricing.
        </p>
        <Button onClick={openNew} className="h-8 text-xs gap-1.5 text-white" style={{ background: ACCENT }}>
          <Plus className="h-3.5 w-3.5" /> New Partner
        </Button>
      </div>

      {/* Partner list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {partners.length === 0 && (
          <div className="text-center py-16 text-slate-300">
            <Building2 className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm font-semibold">No imaging partners yet</p>
            <p className="text-xs mt-1">Add your first radiology center or imaging partner above</p>
          </div>
        )}

        {partners.map(p => {
          const isExpanded = expandId === p.id;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <ScanLine className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-800">{p.name}</p>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${PARTNER_TYPE_COLORS[p.type]}`}>{p.type}</Badge>
                    {!p.active && <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-slate-50 text-slate-400 border-slate-200">Inactive</Badge>}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{p.contact || "No contact"} · {p.selectedTests.length} test{p.selectedTests.length !== 1 ? "s" : ""}</p>
                </div>
                <Switch checked={p.active} onCheckedChange={v => setPartners(ps => ps.map(x => x.id === p.id ? { ...x, active: v } : x))}
                  className="data-[state=checked]:bg-[#4982CF]" />
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex-1">Test Pricing</p>
                    <button
                      onClick={() => { setImportPartnerId(importPartnerId === p.id ? null : p.id); setImportResult(null); setImportText(""); }}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#4982CF] hover:opacity-80">
                      <Upload className="h-3 w-3" /> Import Pricing
                    </button>
                  </div>
                  {importPartnerId === p.id && (
                    <div className="px-4 py-3 bg-blue-50/40 border-b border-[#4982CF]/20 space-y-2">
                      <p className="text-[10px] text-slate-500">Paste CSV: <span className="font-mono">Test Name, Price, Doctor Rate</span> (one per line)</p>
                      <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={4}
                        className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#4982CF] resize-none" />
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
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 sticky top-0">
                          <th className="text-left px-4 py-2 font-black text-[10px] uppercase tracking-widest text-slate-400">Test</th>
                          <th className="text-left px-4 py-2 font-black text-[10px] uppercase tracking-widest text-slate-400">Category</th>
                          <th className="text-right px-4 py-2 font-black text-[10px] uppercase tracking-widest text-slate-400 w-32">Price (PKR)</th>
                          <th className="text-right px-4 py-2 font-black text-[10px] uppercase tracking-widest text-slate-400 w-32">Doctor Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeTests.filter(t => p.selectedTests.includes(t.id)).map(t => (
                          <tr key={t.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-4 py-1.5 text-slate-700">{t.name}</td>
                            <td className="px-4 py-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${CATEGORY_COLORS[t.category] ?? "#64748b"}18`, color: CATEGORY_COLORS[t.category] ?? "#64748b" }}>
                                {t.category}
                              </span>
                            </td>
                            <td className="px-4 py-1.5 text-right">
                              <Input
                                value={p.pricing[t.id] ?? ""}
                                onChange={e => setPartners(ps => ps.map(x => x.id === p.id ? { ...x, pricing: { ...x.pricing, [t.id]: e.target.value } } : x))}
                                placeholder="0.00" className="h-6 text-xs text-right w-28 ml-auto"
                              />
                            </td>
                            <td className="px-4 py-1.5 text-right">
                              <Input
                                value={p.doctorRate[t.id] ?? ""}
                                onChange={e => setPartners(ps => ps.map(x => x.id === p.id ? { ...x, doctorRate: { ...x.doctorRate, [t.id]: e.target.value } } : x))}
                                placeholder="0.00" className="h-6 text-xs text-right w-28 ml-auto"
                              />
                            </td>
                          </tr>
                        ))}
                        {p.selectedTests.length === 0 && (
                          <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-300 text-xs">No tests selected for this partner</td></tr>
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
              {editId ? "Edit Imaging Partner" : "New Imaging Partner"}
              <span className="ml-auto text-xs font-normal text-slate-400">Step {step} of 2</span>
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2].map(s => (
              <div key={s} className={`flex items-center gap-2 ${s < 2 ? "flex-1" : ""}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black ${step >= s ? "text-white" : "bg-slate-100 text-slate-400"}`}
                  style={step >= s ? { background: ACCENT } : {}}>
                  {s}
                </div>
                <span className={`text-xs font-medium ${step === s ? "text-[#4982CF]" : "text-slate-400"}`}>
                  {s === 1 ? "Partner Details" : "Test Selection & Pricing"}
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
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. City Diagnostics Centre" className="h-9 text-sm mt-1" autoFocus />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ImagingPartnerType }))}
                    className="w-full h-9 text-sm border border-slate-200 rounded-lg px-3 focus:outline-none mt-1 bg-white">
                    <option>Internal Radiology</option>
                    <option>External Centre</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600">
                    Contact Info {form.type === "External Centre" && <span className="text-slate-400 font-normal">(recommended for external)</span>}
                  </label>
                  <Input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                    placeholder="Phone / email / contract ref" className="h-9 text-sm mt-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowModal(false)} className="h-9 text-sm">Cancel</Button>
                <Button disabled={!form.name.trim()} onClick={() => setStep(2)} className="h-9 text-sm text-white" style={{ background: ACCENT }}>Next →</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3 overflow-hidden flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input value={modalSearch} onChange={e => setModalSearch(e.target.value)}
                    placeholder="Search tests…" className="pl-8 h-8 text-xs" />
                </div>
                <p className="text-xs text-slate-500 whitespace-nowrap">{selected.length} of {activeTests.length} selected</p>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(activeTests.map(t => t.id))} className="text-xs font-bold" style={{ color: ACCENT }}>Select All</button>
                  <button onClick={() => setSelected([])} className="text-xs font-bold text-slate-400">Clear</button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1 border border-slate-100 rounded-xl">
                {modalCategories.map(cat => {
                  const color = CATEGORY_COLORS[cat] ?? "#64748b";
                  const testsInCat = filteredModalTests.filter(t => t.category === cat);
                  return (
                    <div key={cat}>
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{cat}</p>
                      </div>
                      {testsInCat.map(t => (
                        <div key={t.id} className="flex items-center gap-3 px-4 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                          <input type="checkbox" checked={selected.includes(t.id)}
                            onChange={() => setSelected(ss => ss.includes(t.id) ? ss.filter(x => x !== t.id) : [...ss, t.id])}
                            className="accent-[#4982CF]" />
                          <span className="flex-1 text-xs text-slate-700">{t.name}</span>
                          {selected.includes(t.id) && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">PKR</span>
                                <Input value={pricing[t.id] ?? ""} onChange={e => setPricing(p => ({ ...p, [t.id]: e.target.value }))}
                                  placeholder="Price" className="h-6 w-20 text-xs text-right" />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">Dr.</span>
                                <Input value={doctorRate[t.id] ?? ""} onChange={e => setDoctorRate(p => ({ ...p, [t.id]: e.target.value }))}
                                  placeholder="Rate" className="h-6 w-20 text-xs text-right" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
                {filteredModalTests.length === 0 && (
                  <p className="text-center text-xs text-slate-300 py-8">No tests match your search</p>
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
          <p className="text-sm text-slate-600">Remove <strong>{partners.find(p => p.id === deleteId)?.name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="h-8 text-sm">Cancel</Button>
            <Button onClick={() => { setPartners(ps => ps.filter(p => p.id !== deleteId)); setDeleteId(null); }}
              className="bg-rose-500 text-white h-8 text-sm">Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Module ───────────────────────────────────────────────────────────────

type TabKey = "tests" | "reasons" | "partners";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "tests",    label: "Imaging Test List",  icon: <ScanLine className="h-3.5 w-3.5" /> },
  { key: "reasons",  label: "Reason Templates",   icon: <FileText className="h-3.5 w-3.5" /> },
  { key: "partners", label: "Imaging Partners",   icon: <Building2 className="h-3.5 w-3.5" /> },
];

interface Props { initialTab?: TabKey; }

export function ImagingCatalogModule({ initialTab = "tests" }: Props) {
  const [tab, setTab]             = useState<TabKey>(initialTab);
  const [tests, setTests]         = useState<ImagingTest[]>(seedTests);
  const [partners, setPartners]   = useState<ImagingPartner[]>(seedPartners);

  useEffect(() => { setTab(initialTab); }, [initialTab]);

  // Persist tests to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(CATALOGUE_KEY, JSON.stringify(tests)); } catch { /**/ }
  }, [tests]);

  // Persist partners to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(PARTNERS_KEY, JSON.stringify(partners)); } catch { /**/ }
  }, [partners]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}18` }}>
            <ScanLine className="h-4 w-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Imaging Catalog</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage imaging tests, reason templates, and radiology partners</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 mt-4 bg-slate-100 rounded-lg p-0.5 w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === t.key
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === "tests"    && <ImagingTestListTab tests={tests} setTests={setTests} />}
        {tab === "reasons"  && <ReasonTemplatesTab />}
        {tab === "partners" && <ImagingPartnersTab partners={partners} setPartners={setPartners} tests={tests} />}
      </div>
    </div>
  );
}
