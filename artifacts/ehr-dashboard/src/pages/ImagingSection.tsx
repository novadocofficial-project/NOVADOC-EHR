import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, X, Search, CheckCircle2, ClipboardCheck,
  Plus, Star, Pencil, ChevronDown, ScanLine,
} from "lucide-react";

// ─── Imaging Test Database ────────────────────────────────────────────────────

interface ImagingTestDef {
  id:       string;
  name:     string;
  category: string;
}

const IMAGING_TESTS: ImagingTestDef[] = [
  // X-Ray
  { id: "xray-chest",         name: "X-Ray Chest",               category: "X-Ray"           },
  { id: "xray-abdomen",       name: "X-Ray Abdomen",             category: "X-Ray"           },
  { id: "xray-knee",          name: "X-Ray Knee",                category: "X-Ray"           },
  { id: "xray-spine-ls",      name: "X-Ray Spine (LS)",          category: "X-Ray"           },
  { id: "xray-spine-cx",      name: "X-Ray Spine (Cervical)",    category: "X-Ray"           },
  { id: "xray-pelvis",        name: "X-Ray Pelvis",              category: "X-Ray"           },
  { id: "xray-shoulder",      name: "X-Ray Shoulder",            category: "X-Ray"           },
  { id: "xray-ankle",         name: "X-Ray Ankle",               category: "X-Ray"           },
  { id: "xray-wrist",         name: "X-Ray Wrist",               category: "X-Ray"           },
  { id: "xray-hand",          name: "X-Ray Hand",                category: "X-Ray"           },
  // CT Scan
  { id: "ct-brain",           name: "CT Brain",                  category: "CT Scan"         },
  { id: "ct-chest",           name: "CT Chest",                  category: "CT Scan"         },
  { id: "ct-abdo-pelvis",     name: "CT Abdomen & Pelvis",       category: "CT Scan"         },
  { id: "ct-angio",           name: "CT Angiography",            category: "CT Scan"         },
  { id: "ct-kub",             name: "CT KUB",                    category: "CT Scan"         },
  { id: "ct-coronary",        name: "CT Coronary Angiography",   category: "CT Scan"         },
  { id: "ct-spine",           name: "CT Spine",                  category: "CT Scan"         },
  // MRI
  { id: "mri-brain",          name: "MRI Brain",                 category: "MRI"             },
  { id: "mri-spine-ls",       name: "MRI Spine (LS)",            category: "MRI"             },
  { id: "mri-spine-cx",       name: "MRI Spine (Cervical)",      category: "MRI"             },
  { id: "mri-knee",           name: "MRI Knee",                  category: "MRI"             },
  { id: "mri-shoulder",       name: "MRI Shoulder",              category: "MRI"             },
  { id: "mri-abdomen",        name: "MRI Abdomen",               category: "MRI"             },
  { id: "mri-pelvis",         name: "MRI Pelvis",                category: "MRI"             },
  { id: "mri-whole-body",     name: "MRI Whole Body",            category: "MRI"             },
  // Ultrasound
  { id: "us-abdomen",         name: "Ultrasound Abdomen",        category: "Ultrasound"      },
  { id: "us-pelvis",          name: "Ultrasound Pelvis",         category: "Ultrasound"      },
  { id: "us-thyroid",         name: "Ultrasound Thyroid",        category: "Ultrasound"      },
  { id: "us-renal",           name: "Ultrasound Renal",          category: "Ultrasound"      },
  { id: "us-scrotal",         name: "Ultrasound Scrotal",        category: "Ultrasound"      },
  { id: "us-breast",          name: "Ultrasound Breast",         category: "Ultrasound"      },
  { id: "us-doppler-carotid", name: "Doppler Carotid",           category: "Ultrasound"      },
  { id: "us-doppler-le",      name: "Doppler Lower Limbs",       category: "Ultrasound"      },
  // Echocardiography
  { id: "echo-2d",            name: "2D Echocardiography",       category: "Echocardiography"},
  { id: "echo-stress",        name: "Stress Echocardiography",   category: "Echocardiography"},
  { id: "echo-tee",           name: "Trans-Esophageal Echo (TEE)",category:"Echocardiography"},
  // Nuclear Medicine
  { id: "nuc-bone-scan",      name: "Bone Scan",                 category: "Nuclear Medicine"},
  { id: "nuc-pet-ct",         name: "PET-CT Scan",               category: "Nuclear Medicine"},
  { id: "nuc-thyroid-scan",   name: "Thyroid Scan",              category: "Nuclear Medicine"},
  // Fluoroscopy
  { id: "fluoro-barium",      name: "Barium Swallow",            category: "Fluoroscopy"     },
  { id: "fluoro-hsg",         name: "Hysterosalpingography (HSG)",category:"Fluoroscopy"     },
  { id: "fluoro-ercp",        name: "ERCP",                      category: "Fluoroscopy"     },
  // Mammography
  { id: "mammo",              name: "Mammography",               category: "Mammography"     },
  { id: "mammo-bilateral",    name: "Bilateral Mammography",     category: "Mammography"     },
];

const REASON_TEMPLATES = [
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

// ─── Favourites (localStorage) ────────────────────────────────────────────────

const FAVS_KEY = "imaging_fav_testIds";
function loadFavs(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(FAVS_KEY) ?? "[]")); } catch { return new Set(); }
}
function persistFavs(s: Set<string>) {
  localStorage.setItem(FAVS_KEY, JSON.stringify([...s]));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImagingOrder {
  uid:      string;
  testId:   string;
  testName: string;
  category: string;
  reason:   string;
}

export interface ImagingData {
  orders:       ImagingOrder[];
  instructions: string;
}

export const EMPTY_IMAGING: ImagingData = { orders: [], instructions: "" };

// ─── Category colour chips ────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  "X-Ray":            "bg-sky-100 text-sky-600",
  "CT Scan":          "bg-purple-100 text-purple-600",
  "MRI":              "bg-indigo-100 text-indigo-600",
  "Ultrasound":       "bg-teal-100 text-teal-600",
  "Echocardiography": "bg-rose-100 text-rose-600",
  "Nuclear Medicine": "bg-orange-100 text-orange-600",
  "Fluoroscopy":      "bg-amber-100 text-amber-700",
  "Mammography":      "bg-pink-100 text-pink-600",
};

function CatBadge({ cat }: { cat: string }) {
  return (
    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${CAT_COLORS[cat] ?? "bg-slate-100 text-slate-500"}`}>
      {cat}
    </span>
  );
}

// ─── Search Dropdown ──────────────────────────────────────────────────────────

function TestSearch({
  favs, onToggleFav, onSelect,
}: {
  favs: Set<string>;
  onToggleFav: (id: string, fav: boolean) => void;
  onSelect: (t: ImagingTestDef) => void;
}) {
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const q = query.toLowerCase().trim();

  const favTests = IMAGING_TESTS.filter(t => favs.has(t.id));
  const matched  = q ? IMAGING_TESTS.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)) : IMAGING_TESTS;

  const grouped = matched.reduce<Record<string, ImagingTestDef[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  function pick(t: ImagingTestDef) {
    onSelect(t);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl focus-within:border-cyan-400/50 focus-within:ring-1 focus-within:ring-cyan-400/20 transition-all">
        <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search imaging test…"
          className="flex-1 text-xs text-slate-700 outline-none placeholder:text-slate-400"
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }} className="text-slate-300 hover:text-slate-500">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">

          {/* Favourites */}
          {!q && favTests.length > 0 && (
            <div>
              <p className="px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Favourites
              </p>
              {favTests.map(t => (
                <TestRow key={t.id} test={t} favs={favs} onToggleFav={onToggleFav} onPick={() => pick(t)} />
              ))}
              <div className="border-t border-slate-100 mx-3 my-1" />
            </div>
          )}

          {/* Grouped by category */}
          {Object.entries(grouped).map(([cat, tests]) => (
            <div key={cat}>
              <p className="px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest text-cyan-500">{cat}</p>
              {tests.map(t => (
                <TestRow key={t.id} test={t} favs={favs} onToggleFav={onToggleFav} onPick={() => pick(t)} />
              ))}
            </div>
          ))}

          {Object.keys(grouped).length === 0 && (
            <p className="px-4 py-4 text-xs text-slate-400 italic text-center">No test found</p>
          )}
        </div>
      )}
    </div>
  );
}

function TestRow({ test, favs, onToggleFav, onPick }: {
  test: ImagingTestDef;
  favs: Set<string>;
  onToggleFav: (id: string, fav: boolean) => void;
  onPick: () => void;
}) {
  const isFav = favs.has(test.id);
  return (
    <div className="flex items-center gap-1 px-3 hover:bg-cyan-50 transition-colors group border-b border-slate-50 last:border-0">
      <button onClick={e => { e.stopPropagation(); onToggleFav(test.id, !isFav); }} className="p-1 flex-shrink-0">
        <Star className={`h-3 w-3 transition-colors ${isFav ? "fill-amber-400 text-amber-400" : "text-slate-200 group-hover:text-slate-300"}`} />
      </button>
      <button onClick={onPick} className="flex-1 flex items-center justify-between py-2 text-left gap-2">
        <span className="text-xs font-semibold text-slate-800">{test.name}</span>
        <CatBadge cat={test.category} />
      </button>
    </div>
  );
}

// ─── Chips Panel ──────────────────────────────────────────────────────────────

export function ImagingChipsPanel({ data, onOpen }: { data: ImagingData; onOpen: () => void }) {
  if (data.orders.length === 0 && !data.instructions) {
    return (
      <button onClick={onOpen}
        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl bg-cyan-50/60 border-2 border-dashed border-cyan-200 text-cyan-500 font-bold text-xs hover:border-cyan-400 hover:bg-cyan-50 transition-all">
        <Plus className="h-4 w-4 flex-shrink-0" />
        Order imaging…
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {data.orders.map(o => (
        <div key={o.uid} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-cyan-100 bg-cyan-50/40">
          <ScanLine className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[11px] font-black text-cyan-800">{o.testName}</p>
              <CatBadge cat={o.category} />
            </div>
            {o.reason && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{o.reason}</p>}
          </div>
        </div>
      ))}
      {data.instructions && (
        <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
          <p className="text-[9px] font-black text-amber-600 uppercase tracking-wide">Instructions</p>
          <p className="text-[10px] text-amber-700 mt-0.5">{data.instructions}</p>
        </div>
      )}
      <button onClick={onOpen}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl border border-cyan-200 text-cyan-500 text-xs font-bold hover:bg-cyan-50 transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Edit imaging orders ({data.orders.length})
      </button>
    </div>
  );
}

// ─── Imaging Drawer ───────────────────────────────────────────────────────────

interface ImagingDrawerProps {
  savedData:  ImagingData;
  onSave:     (data: ImagingData) => void;
  onClose:    () => void;
}

export function ImagingDrawer({ savedData, onSave, onClose }: ImagingDrawerProps) {
  const [orders,       setOrders]       = useState<ImagingOrder[]>(savedData.orders);
  const [instructions, setInstructions] = useState(savedData.instructions);
  const [favs,         setFavs]         = useState<Set<string>>(loadFavs);
  const [selTest,      setSelTest]      = useState<ImagingTestDef | null>(null);
  const [reason,       setReason]       = useState("");
  const [showTemplates,setShowTemplates]= useState(false);
  const [editingUid,   setEditingUid]   = useState<string | null>(null);

  const canAdd = selTest !== null && reason.trim() !== "";

  function toggleFav(id: string, fav: boolean) {
    setFavs(prev => {
      const next = new Set(prev);
      fav ? next.add(id) : next.delete(id);
      persistFavs(next);
      return next;
    });
  }

  function selectTest(t: ImagingTestDef) {
    setSelTest(t);
    setReason("");
    setEditingUid(null);
    setShowTemplates(false);
  }

  function handleAdd() {
    if (!selTest || !canAdd) return;
    const entry: ImagingOrder = {
      uid:      editingUid ?? `img-${Date.now()}`,
      testId:   selTest.id,
      testName: selTest.name,
      category: selTest.category,
      reason:   reason.trim(),
    };
    setOrders(prev => editingUid ? prev.map(o => o.uid === editingUid ? entry : o) : [...prev, entry]);
    setSelTest(null); setReason(""); setEditingUid(null); setShowTemplates(false);
  }

  function startEdit(o: ImagingOrder) {
    const def = IMAGING_TESTS.find(t => t.id === o.testId) ?? { id: o.testId, name: o.testName, category: o.category };
    setSelTest(def);
    setReason(o.reason);
    setEditingUid(o.uid);
    setShowTemplates(false);
  }

  function removeOrder(uid: string) {
    setOrders(prev => prev.filter(o => o.uid !== uid));
    if (editingUid === uid) { setSelTest(null); setReason(""); setEditingUid(null); }
  }

  function saveAndClose() {
    onSave({ orders, instructions });
    onClose();
  }

  return (
    <div className="absolute inset-y-0 right-0 w-[68%] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-20">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button onClick={saveAndClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Assessment &amp; Plan</p>
          <p className="text-sm font-black text-slate-800">Imaging Requisition</p>
        </div>
        {orders.length > 0 ? (
          <button onClick={saveAndClose}
            className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0 hover:bg-emerald-100 transition-colors">
            <CheckCircle2 className="h-3 w-3" /> Done
          </button>
        ) : (
          <button onClick={saveAndClose}
            className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg bg-cyan-500 text-white hover:bg-cyan-400 transition-colors flex-shrink-0">
            <ClipboardCheck className="h-3.5 w-3.5" /> Save
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Add/Edit form */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5">
            {editingUid ? "Edit Order" : "Add Imaging Test"}
          </p>

          <TestSearch favs={favs} onToggleFav={toggleFav} onSelect={selectTest} />

          {selTest && (
            <div className="mt-3 border border-cyan-100 rounded-xl bg-cyan-50/30 p-3 space-y-3">
              {/* Selected test header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-black text-slate-800">{selTest.name}</p>
                  <CatBadge cat={selTest.category} />
                </div>
                <button onClick={() => { setSelTest(null); setReason(""); setEditingUid(null); }}
                  className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Reason field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide">
                    Reason for Ordering <span className="text-red-400">*</span>
                  </label>
                  <button onClick={() => setShowTemplates(v => !v)}
                    className="flex items-center gap-1 text-[9px] font-bold text-cyan-500 hover:text-cyan-600 transition-colors">
                    <ChevronDown className={`h-3 w-3 transition-transform ${showTemplates ? "rotate-180" : ""}`} />
                    Templates
                  </button>
                </div>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={2}
                  placeholder="Why is this test being ordered?"
                  className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all resize-none placeholder:text-slate-300"
                />
                {showTemplates && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {REASON_TEMPLATES.map(t => (
                      <button key={t} onClick={() => { setReason(t); setShowTemplates(false); }}
                        className="text-[9px] px-2 py-1 rounded-full bg-slate-100 text-slate-500 hover:bg-cyan-50 hover:text-cyan-600 border border-slate-200 hover:border-cyan-200 transition-colors font-medium">
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add button */}
              <div className="flex justify-end">
                <button onClick={handleAdd} disabled={!canAdd}
                  className="flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl bg-cyan-500 text-white hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                  {editingUid ? "Update Order" : "Add to Requisition"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Orders list */}
        {orders.length > 0 && (
          <>
            <div className="border-t border-slate-100 mx-4" />
            <div className="px-4 pt-3 pb-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5">
                Imaging Orders ({orders.length})
              </p>
              <div className="space-y-2">
                {orders.map(o => {
                  const isEditing = editingUid === o.uid;
                  return (
                    <div key={o.uid}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all"
                      style={{ borderColor: isEditing ? "#67e8f9" : "#cffafe", backgroundColor: isEditing ? "#ecfeff" : "#f0fdfe" }}>
                      <ScanLine className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[11px] font-black text-slate-800">{o.testName}</p>
                          <CatBadge cat={o.category} />
                        </div>
                        {o.reason && <p className="text-[10px] text-slate-500 mt-0.5">{o.reason}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => startEdit(o)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg border border-transparent hover:border-cyan-100 hover:bg-cyan-50 text-slate-300 hover:text-cyan-500 transition-colors">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button onClick={() => removeOrder(o.uid)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg border border-transparent hover:border-red-100 hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Global Instructions */}
        <div className="border-t border-slate-100 mx-4" />
        <div className="px-4 pt-3 pb-5">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">
            Instructions <span className="font-normal text-slate-400 normal-case tracking-normal">(applies to entire requisition)</span>
          </label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={2}
            placeholder="e.g. Patient fasting for 6 hours · With contrast · Urgent…"
            className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all resize-none placeholder:text-slate-300"
          />
        </div>
      </div>
    </div>
  );
}
