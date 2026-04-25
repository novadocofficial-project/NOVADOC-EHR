import { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit2, X, GripVertical, Search, ChevronDown,
  ChevronRight, CheckCircle2, FileText, RotateCcw, EyeOff, Eye,
  ScanLine, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const ACCENT = "#4982CF";
const CATALOGUE_KEY = "ehr-imaging-catalogue-v1";
const REASONS_KEY   = "ehr-imaging-reasons-v1";

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

// ─── Tab 1: Imaging Test List (inline add + inline edit) ───────────────────────

interface InlineEdit { name: string; category: string; customCat: string; }

function ImagingTestListTab() {
  const [tests,        setTests]        = useState<ImagingTest[]>(seedTests);
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

  // Persist to localStorage whenever tests change
  useEffect(() => {
    try { localStorage.setItem(CATALOGUE_KEY, JSON.stringify(tests)); } catch { /**/ }
  }, [tests]);

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
        <Button size="sm" onClick={confirmSave}
          className={`h-8 text-xs gap-1.5 transition-all ${!saved ? "text-white" : "bg-white text-slate-400 border border-slate-200"}`}
          style={!saved ? { background: ACCENT } : {}}>
          <Save className="h-3.5 w-3.5" />
          {!saved ? "Saved" : "Up to date"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Add new reason */}
        <div className="flex gap-2 mb-5">
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

// ─── Main Module ───────────────────────────────────────────────────────────────

type TabKey = "tests" | "reasons";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "tests",   label: "Imaging Test List",  icon: <ScanLine className="h-3.5 w-3.5" /> },
  { key: "reasons", label: "Reason Templates",   icon: <FileText className="h-3.5 w-3.5" /> },
];

interface Props { initialTab?: TabKey; }

export function ImagingCatalogModule({ initialTab = "tests" }: Props) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  useEffect(() => { setTab(initialTab); }, [initialTab]);

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
            <p className="text-xs text-slate-500 mt-0.5">Manage imaging tests and indication reason templates</p>
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
        {tab === "tests"   && <ImagingTestListTab />}
        {tab === "reasons" && <ReasonTemplatesTab />}
      </div>
    </div>
  );
}
