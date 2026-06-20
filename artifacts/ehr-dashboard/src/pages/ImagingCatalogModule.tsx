import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Edit2, X, GripVertical, Search, ChevronDown,
  ChevronRight, CheckCircle2, FileText, ScanLine, Save, Upload,
  AlertCircle, Building2, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  type CatalogModality,
  type CatalogBodyPart,
  IMAGING_CATALOG_KEY,
  loadImagingCatalog,
} from "@/pages/ImagingSection";

const ACCENT       = "#4982CF";
const CATALOGUE_KEY = "ehr-imaging-catalogue-v1"; // kept for Partners tab
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
    pricing: { "xray-chest": "800", "xray-abdomen": "900", "xray-knee": "700", "us-abdomen": "1500", "us-thyroid": "1200", "echo-2d": "3500" },
  },
  {
    id: "ip2", name: "City Diagnostics Centre", type: "External Centre", contact: "0300-9876543", active: true,
    selectedTests: ["ct-brain","ct-chest","ct-abdo-pelvis","mri-brain","mri-knee","nuc-pet-ct"],
    pricing: { "ct-brain": "7000", "ct-chest": "8000", "ct-abdo-pelvis": "9000", "mri-brain": "12000", "mri-knee": "10000", "nuc-pet-ct": "35000" },
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

const MODALITY_ACCENT_COLORS: Record<string, string> = {
  "X-Ray":            "#0ea5e9",
  "CT":               "#8b5cf6",
  "MRI":              "#6366f1",
  "Ultrasound":       "#10b981",
  "Mammography":      "#ec4899",
  "Echocardiography": "#f59e0b",
  "Nuclear Medicine": "#ef4444",
  "Fluoroscopy":      "#f97316",
};

function modalityColor(name: string): string {
  return MODALITY_ACCENT_COLORS[name] ?? ACCENT;
}

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

// ─── Tab 1: Hierarchical Catalog Editor ────────────────────────────────────────

function CatalogEditorTab() {
  const [catalog, setCatalog] = useState<CatalogModality[]>(() => loadImagingCatalog());

  // keys: "m:i", "b:i:j", "p:i:j:k"
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  // keys: "m" (add modality), "b:i" (add body part to i), "p:i:j" (add protocol to i,j)
  const [addKey, setAddKey] = useState<string | null>(null);
  const [addVal, setAddVal] = useState("");

  // keys: "m:i", "b:i:j", "p:i:j:k" — pending delete waiting for confirmation
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  // expand state
  const [expandM,  setExpandM]  = useState<Record<number, boolean>>(() =>
    Object.fromEntries(loadImagingCatalog().map((_, i) => [i, true]))
  );
  const [expandBP, setExpandBP] = useState<Record<string, boolean>>({});

  const addInputRef = useRef<HTMLInputElement | null>(null);

  function persist(next: CatalogModality[]) {
    setCatalog(next);
    try { localStorage.setItem(IMAGING_CATALOG_KEY, JSON.stringify(next)); } catch { /**/ }
  }

  // ── helpers ──

  function isExpandedM(i: number)        { return expandM[i]  !== false; }
  function isExpandedBP(i: number, j: number) { return expandBP[`${i}:${j}`] !== false; }

  function toggleExpandM(i: number)  { setExpandM(s  => ({ ...s, [i]: !isExpandedM(i)  })); }
  function toggleExpandBP(i: number, j: number) { setExpandBP(s => ({ ...s, [`${i}:${j}`]: !isExpandedBP(i, j) })); }

  function startEdit(key: string, val: string) {
    setAddKey(null); setAddVal("");
    setConfirmKey(null);
    setEditKey(key);
    setEditVal(val);
  }

  function cancelEdit() { setEditKey(null); setEditVal(""); }

  function commitEdit() {
    if (!editKey || !editVal.trim()) { cancelEdit(); return; }
    const v = editVal.trim();
    const parts = editKey.split(":").map(Number);
    const next = catalog.map((m, mi) => {
      if (parts[0] !== mi && editKey.startsWith("m:") && parts[1] !== mi) return m;
      return m;
    });

    // rebuild
    const c = catalog.map((m, mi) => ({ ...m, bodyParts: m.bodyParts.map((bp, bi) => ({ ...bp })) }));
    if (editKey === `m:${parts[1]}`) {
      c[parts[1]] = { ...c[parts[1]], name: v };
    } else if (editKey === `b:${parts[1]}:${parts[2]}`) {
      c[parts[1]].bodyParts[parts[2]] = { ...c[parts[1]].bodyParts[parts[2]], name: v };
    } else if (editKey === `p:${parts[1]}:${parts[2]}:${parts[3]}`) {
      const protos = [...c[parts[1]].bodyParts[parts[2]].protocols];
      protos[parts[3]] = v;
      c[parts[1]].bodyParts[parts[2]] = { ...c[parts[1]].bodyParts[parts[2]], protocols: protos };
    }
    persist(c);
    cancelEdit();
  }

  function startAdd(key: string) {
    setEditKey(null); setEditVal("");
    setConfirmKey(null);
    setAddKey(key);
    setAddVal("");
    setTimeout(() => addInputRef.current?.focus(), 50);
  }

  function cancelAdd() { setAddKey(null); setAddVal(""); }

  function commitAdd() {
    if (!addKey || !addVal.trim()) { cancelAdd(); return; }
    const v = addVal.trim();
    const parts = addKey.split(":").map(Number);
    const c: CatalogModality[] = catalog.map(m => ({
      ...m,
      bodyParts: m.bodyParts.map(bp => ({ ...bp, protocols: [...bp.protocols] })),
    }));

    if (addKey === "m") {
      const newMod: CatalogModality = { name: v, enabled: true, bodyParts: [] };
      c.push(newMod);
      setExpandM(s => ({ ...s, [c.length - 1]: true }));
    } else if (addKey === `b:${parts[1]}`) {
      const newBP: CatalogBodyPart = { name: v, enabled: true, protocols: [] };
      c[parts[1]].bodyParts.push(newBP);
      const bi = c[parts[1]].bodyParts.length - 1;
      setExpandBP(s => ({ ...s, [`${parts[1]}:${bi}`]: true }));
    } else if (addKey === `p:${parts[1]}:${parts[2]}`) {
      c[parts[1]].bodyParts[parts[2]].protocols.push(v);
    }
    persist(c);
    cancelAdd();
  }

  function toggleModalityEnabled(i: number) {
    const c = catalog.map((m, mi) => mi === i ? { ...m, enabled: !(m.enabled !== false) } : m);
    persist(c);
  }

  function toggleBodyPartEnabled(i: number, j: number) {
    const c = catalog.map((m, mi) => mi !== i ? m : {
      ...m,
      bodyParts: m.bodyParts.map((bp, bi) => bi === j ? { ...bp, enabled: !(bp.enabled !== false) } : bp),
    });
    persist(c);
  }

  function deleteModality(i: number) {
    persist(catalog.filter((_, mi) => mi !== i));
    setExpandM(s => {
      const n: Record<number, boolean> = {};
      Object.entries(s).forEach(([k, v]) => { const ki = Number(k); if (ki !== i) n[ki > i ? ki - 1 : ki] = v; });
      return n;
    });
  }

  function deleteBodyPart(i: number, j: number) {
    const c = catalog.map((m, mi) => mi !== i ? m : {
      ...m, bodyParts: m.bodyParts.filter((_, bi) => bi !== j),
    });
    persist(c);
  }

  function deleteProtocol(i: number, j: number, k: number) {
    const c = catalog.map((m, mi) => mi !== i ? m : {
      ...m,
      bodyParts: m.bodyParts.map((bp, bi) => bi !== j ? bp : {
        ...bp, protocols: bp.protocols.filter((_, pi) => pi !== k),
      }),
    });
    persist(c);
  }

  const enabledCount   = catalog.filter(m => m.enabled !== false).length;
  const totalBodyParts = catalog.reduce((s, m) => s + m.bodyParts.length, 0);
  const totalProtocols = catalog.reduce((s, m) => s + m.bodyParts.reduce((ss, bp) => ss + bp.protocols.length, 0), 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{catalog.length}</span> modalities ·{" "}
          <span className="font-semibold text-slate-700">{totalBodyParts}</span> body parts ·{" "}
          <span className="font-semibold text-slate-700">{totalProtocols}</span> protocols
          {catalog.length !== enabledCount && (
            <span className="text-amber-600 font-semibold ml-1">({catalog.length - enabledCount} disabled)</span>
          )}
        </div>
        <div className="ml-auto">
          <Button size="sm"
            onClick={() => startAdd("m")}
            style={{ background: ACCENT }} className="text-white text-xs gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" /> Add Modality
          </Button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">

        {/* Add-modality inline row */}
        {addKey === "m" && (
          <InlineAddRow
            placeholder="Modality name (e.g. Fluoroscopy)…"
            value={addVal}
            onChange={setAddVal}
            onCommit={commitAdd}
            onCancel={cancelAdd}
            inputRef={addInputRef}
            indent={0}
          />
        )}

        {catalog.length === 0 && addKey !== "m" && (
          <div className="text-center py-16 text-slate-400 text-sm">
            No modalities yet. Click <strong>Add Modality</strong> above.
          </div>
        )}

        {catalog.map((modality, mi) => {
          const mColor    = modalityColor(modality.name);
          const mEnabled  = modality.enabled !== false;
          const mExpanded = isExpandedM(mi);

          return (
            <div key={mi} className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Modality row */}
              <div
                className={`flex items-center gap-2 px-3 py-2.5 ${mEnabled ? "bg-white" : "bg-slate-50"}`}
              >
                <button onClick={() => toggleExpandM(mi)} className="p-0.5 text-slate-400 hover:text-slate-600 flex-shrink-0">
                  {mExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: mColor }} />

                {editKey === `m:${mi}` ? (
                  <InlineEditRow
                    value={editVal}
                    onChange={setEditVal}
                    onCommit={commitEdit}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <span
                    className={`flex-1 text-sm font-bold ${mEnabled ? "text-slate-800" : "text-slate-400"}`}
                    onDoubleClick={() => startEdit(`m:${mi}`, modality.name)}
                  >
                    {modality.name}
                  </span>
                )}

                <span className="text-[10px] text-slate-400 mr-1">{modality.bodyParts.length} body parts</span>

                <Switch
                  checked={mEnabled}
                  onCheckedChange={() => toggleModalityEnabled(mi)}
                  className="data-[state=checked]:bg-[#4982CF] flex-shrink-0"
                />
                {editKey !== `m:${mi}` && (
                  <>
                    <button
                      onClick={() => startEdit(`m:${mi}`, modality.name)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors"
                      title="Rename modality"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { setEditKey(null); setAddKey(null); setConfirmKey(`m:${mi}`); }}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                      title="Delete modality"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Modality delete confirmation bar */}
              {confirmKey === `m:${mi}` && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-t border-red-100">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                  <p className="flex-1 text-xs text-red-700 font-semibold">
                    Remove <em>{modality.name}</em> and all its body parts? This cannot be undone.
                  </p>
                  <button
                    onClick={() => { deleteModality(mi); setConfirmKey(null); }}
                    className="px-3 py-1 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setConfirmKey(null)}
                    className="px-3 py-1 text-xs font-bold bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Body Parts */}
              {mExpanded && (
                <div className="border-t border-slate-100">
                  {modality.bodyParts.map((bp, bi) => {
                    const bpEnabled  = bp.enabled !== false;
                    const bpExpanded = isExpandedBP(mi, bi);

                    return (
                      <div key={bi} className={`border-b border-slate-50 last:border-0 ${bpEnabled ? "bg-white" : "bg-slate-50/60"}`}>
                        {/* Body Part row */}
                        <div className="flex items-center gap-2 pl-8 pr-3 py-2">
                          <button onClick={() => toggleExpandBP(mi, bi)} className="p-0.5 text-slate-300 hover:text-slate-500 flex-shrink-0">
                            {bpExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </button>

                          {editKey === `b:${mi}:${bi}` ? (
                            <InlineEditRow
                              value={editVal}
                              onChange={setEditVal}
                              onCommit={commitEdit}
                              onCancel={cancelEdit}
                            />
                          ) : (
                            <span
                              className={`flex-1 text-xs font-semibold ${bpEnabled ? "text-slate-700" : "text-slate-400"}`}
                              onDoubleClick={() => startEdit(`b:${mi}:${bi}`, bp.name)}
                            >
                              {bp.name}
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 mr-1">{bp.protocols.length}</span>

                          <Switch
                            checked={bpEnabled}
                            onCheckedChange={() => toggleBodyPartEnabled(mi, bi)}
                            className="data-[state=checked]:bg-[#4982CF] scale-75 flex-shrink-0"
                          />
                          {editKey !== `b:${mi}:${bi}` && (
                            <>
                              <button
                                onClick={() => startEdit(`b:${mi}:${bi}`, bp.name)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors"
                                title="Rename body part"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => { setEditKey(null); setAddKey(null); setConfirmKey(`b:${mi}:${bi}`); }}
                                className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                                title="Delete body part"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Body-part delete confirmation bar */}
                        {confirmKey === `b:${mi}:${bi}` && (
                          <div className="flex items-center gap-2 pl-8 pr-3 py-2 bg-red-50 border-t border-red-100">
                            <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                            <p className="flex-1 text-xs text-red-700 font-semibold">
                              Remove <em>{bp.name}</em> and its protocols?
                            </p>
                            <button
                              onClick={() => { deleteBodyPart(mi, bi); setConfirmKey(null); }}
                              className="px-2.5 py-1 text-[11px] font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Remove
                            </button>
                            <button
                              onClick={() => setConfirmKey(null)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Protocols */}
                        {bpExpanded && (
                          <div className="pl-16 pr-3 pb-2 space-y-0.5">
                            {bp.protocols.map((proto, pi) => {
                              const isPendingDelete = confirmKey === `p:${mi}:${bi}:${pi}`;
                              if (isPendingDelete) {
                                return (
                                  <div key={pi} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red-50 border border-red-100">
                                    <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                                    <p className="flex-1 text-[11px] text-red-700 font-semibold truncate">Remove <em>"{proto}"</em>?</p>
                                    <button
                                      onClick={() => { deleteProtocol(mi, bi, pi); setConfirmKey(null); }}
                                      className="px-2 py-0.5 text-[11px] font-bold bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex-shrink-0"
                                    >
                                      Remove
                                    </button>
                                    <button
                                      onClick={() => setConfirmKey(null)}
                                      className="px-2 py-0.5 text-[11px] font-bold bg-white text-slate-600 border border-slate-200 rounded hover:bg-slate-50 transition-colors flex-shrink-0"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                );
                              }
                              return (
                                <div key={pi} className="flex items-center gap-2 group px-2 py-1 rounded-lg hover:bg-slate-50">
                                  <span className="h-1 w-1 rounded-full bg-slate-300 flex-shrink-0" />
                                  {editKey === `p:${mi}:${bi}:${pi}` ? (
                                    <InlineEditRow
                                      value={editVal}
                                      onChange={setEditVal}
                                      onCommit={commitEdit}
                                      onCancel={cancelEdit}
                                    />
                                  ) : (
                                    <span
                                      className="flex-1 text-xs text-slate-600"
                                      onDoubleClick={() => startEdit(`p:${mi}:${bi}:${pi}`, proto)}
                                    >
                                      {proto}
                                    </span>
                                  )}
                                  {editKey !== `p:${mi}:${bi}:${pi}` && (
                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => startEdit(`p:${mi}:${bi}:${pi}`, proto)}
                                        className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-600"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => { setEditKey(null); setAddKey(null); setConfirmKey(`p:${mi}:${bi}:${pi}`); }}
                                        className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Add protocol row */}
                            {addKey === `p:${mi}:${bi}` && (
                              <InlineAddRow
                                placeholder="Protocol name (e.g. Without Contrast)…"
                                value={addVal}
                                onChange={setAddVal}
                                onCommit={commitAdd}
                                onCancel={cancelAdd}
                                inputRef={addInputRef}
                                indent={0}
                              />
                            )}

                            <button
                              onClick={() => { setExpandBP(s => ({ ...s, [`${mi}:${bi}`]: true })); startAdd(`p:${mi}:${bi}`); }}
                              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-[#4982CF] px-2 py-1 transition-colors"
                            >
                              <Plus className="h-3 w-3" /> Add Protocol
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add body part row inside modality */}
                  {addKey === `b:${mi}` && (
                    <div className="pl-8 pr-3 py-1.5 border-t border-slate-50">
                      <InlineAddRow
                        placeholder="Body part name (e.g. Lumbar Spine)…"
                        value={addVal}
                        onChange={setAddVal}
                        onCommit={commitAdd}
                        onCancel={cancelAdd}
                        inputRef={addInputRef}
                        indent={0}
                      />
                    </div>
                  )}

                  <div className="pl-8 pr-3 py-2 border-t border-slate-50">
                    <button
                      onClick={() => { setExpandM(s => ({ ...s, [mi]: true })); startAdd(`b:${mi}`); }}
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-[#4982CF] transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add Body Part
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Bottom "Add Modality" shortcut */}
        {catalog.length > 0 && addKey !== "m" && (
          <button
            onClick={() => startAdd("m")}
            className="flex items-center gap-1.5 w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#4982CF]/40 hover:text-[#4982CF] text-xs font-bold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Modality
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Shared inline editing UI ──────────────────────────────────────────────────

function InlineEditRow({
  value, onChange, onCommit, onCancel,
}: {
  value:    string;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-1">
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") onCommit(); if (e.key === "Escape") onCancel(); }}
        className="h-7 text-xs flex-1"
        autoFocus
      />
      <button onClick={onCommit} className="p-1 rounded hover:bg-[#4982CF] hover:text-white text-[#4982CF] transition-colors">
        <CheckCircle2 className="h-4 w-4" />
      </button>
      <button onClick={onCancel} className="p-1 rounded hover:bg-slate-100 text-slate-400">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function InlineAddRow({
  placeholder, value, onChange, onCommit, onCancel, inputRef, indent,
}: {
  placeholder: string;
  value:       string;
  onChange:    (v: string) => void;
  onCommit:    () => void;
  onCancel:    () => void;
  inputRef:    React.RefObject<HTMLInputElement | null>;
  indent:      number;
}) {
  return (
    <div className={`flex items-center gap-1.5 py-1`} style={{ paddingLeft: indent }}>
      <Plus className="h-3.5 w-3.5 text-[#4982CF] flex-shrink-0" />
      <Input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") onCommit(); if (e.key === "Escape") onCancel(); }}
        placeholder={placeholder}
        className="h-7 text-xs flex-1"
        autoFocus
      />
      <button onClick={onCommit} className="p-1 rounded hover:bg-[#4982CF] hover:text-white text-[#4982CF] transition-colors">
        <CheckCircle2 className="h-4 w-4" />
      </button>
      <button onClick={onCancel} className="p-1 rounded hover:bg-slate-100 text-slate-400">
        <X className="h-4 w-4" />
      </button>
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

  useEffect(() => {
    try { localStorage.setItem(REASONS_KEY, JSON.stringify(items)); } catch { /**/ }
    setSaved(false);
  }, [items]);

  function addReason() {
    const t = newText.trim();
    if (!t) return;
    setItems(p => [...p, t]);
    setNewText("");
  }

  function deleteReason(idx: number) {
    setItems(p => p.filter((_, i) => i !== idx));
    if (editIdx === idx) setEditIdx(null);
  }

  function startEdit(idx: number) { setEditIdx(idx); setEditVal(items[idx]); }
  function saveEdit(idx: number) {
    if (!editVal.trim()) return;
    setItems(p => p.map((s, i) => i === idx ? editVal.trim() : s));
    setEditIdx(null);
  }

  function confirmSave() {
    try { localStorage.setItem(REASONS_KEY, JSON.stringify(items)); } catch { /**/ }
    setSaved(true);
  }

  function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) return;
    setItems(p => reorder(p, dragIdx, toIdx));
    setDragIdx(null);
    setDropIdx(null);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
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
    setSelected([]); setPricing({}); setEditId(null); setStep(1); setModalSearch(""); setShowModal(true);
  }

  function openEdit(p: ImagingPartner) {
    setForm({ name: p.name, type: p.type, contact: p.contact });
    setSelected([...p.selectedTests]); setPricing({ ...p.pricing });
    setEditId(p.id); setStep(1); setModalSearch(""); setShowModal(true);
  }

  function save() {
    const data: ImagingPartner = {
      id: editId ?? uid(), name: form.name.trim(), type: form.type, contact: form.contact,
      active: editId ? (partners.find(p => p.id === editId)?.active ?? true) : true,
      selectedTests: selected, pricing,
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
    const matched: string[] = [];
    const unmatched: string[] = [];
    lines.forEach(([name, price]) => {
      const test = activeTests.find(t => t.name.toLowerCase() === name?.toLowerCase());
      if (test && price) { newPricing[test.id] = price; matched.push(name); }
      else if (name) unmatched.push(name);
    });
    setPartners(ps => ps.map(p => p.id === partnerId ? { ...p, pricing: newPricing } : p));
    setImportResult({ matched: matched.length, unmatched });
    setImportText("");
  }

  const filteredModalTests = modalSearch
    ? activeTests.filter(t => t.name.toLowerCase().includes(modalSearch.toLowerCase()) || t.category.toLowerCase().includes(modalSearch.toLowerCase()))
    : activeTests;

  const modalCategories = Array.from(new Set(filteredModalTests.map(t => t.category))).sort();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Manage radiology centers and their per-test pricing.
        </p>
        <Button onClick={openNew} className="h-8 text-xs gap-1.5 text-white" style={{ background: ACCENT }}>
          <Plus className="h-3.5 w-3.5" /> New Partner
        </Button>
      </div>

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
                      <p className="text-[10px] text-slate-500">Paste CSV: <span className="font-mono">Test Name, Price</span> (one per line)</p>
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
                          </tr>
                        ))}
                        {p.selectedTests.length === 0 && (
                          <tr><td colSpan={3} className="px-4 py-4 text-center text-slate-300 text-xs">No tests selected for this partner</td></tr>
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
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">PKR</span>
                              <Input value={pricing[t.id] ?? ""} onChange={e => setPricing(p => ({ ...p, [t.id]: e.target.value }))}
                                placeholder="Price" className="h-6 w-20 text-xs text-right" />
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

type TabKey = "catalog" | "reasons" | "partners";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "catalog",  label: "Catalog",          icon: <Layers className="h-3.5 w-3.5" /> },
  { key: "reasons",  label: "Reason Templates", icon: <FileText className="h-3.5 w-3.5" /> },
  { key: "partners", label: "Imaging Partners", icon: <Building2 className="h-3.5 w-3.5" /> },
];

interface Props { initialTab?: TabKey | "tests"; }

export function ImagingCatalogModule({ initialTab = "catalog" }: Props) {
  // map legacy "tests" → "catalog"
  const resolvedInitial: TabKey = initialTab === "tests" ? "catalog" : (initialTab as TabKey);
  const [tab, setTab]         = useState<TabKey>(resolvedInitial);
  const [tests, setTests]     = useState<ImagingTest[]>(seedTests);
  const [partners, setPartners] = useState<ImagingPartner[]>(seedPartners);

  useEffect(() => {
    setTab(initialTab === "tests" ? "catalog" : (initialTab as TabKey));
  }, [initialTab]);

  useEffect(() => {
    try { localStorage.setItem(CATALOGUE_KEY, JSON.stringify(tests)); } catch { /**/ }
  }, [tests]);

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
            <p className="text-xs text-slate-500 mt-0.5">Manage the imaging catalog, reason templates, and radiology partners</p>
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
        {tab === "catalog"  && <CatalogEditorTab />}
        {tab === "reasons"  && <ReasonTemplatesTab />}
        {tab === "partners" && <ImagingPartnersTab partners={partners} setPartners={setPartners} tests={tests} />}
      </div>
    </div>
  );
}

export { SEED_TESTS as IMAGING_SEED_TESTS };
