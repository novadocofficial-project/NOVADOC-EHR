import { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronRight,
  Search, Eye, FileText, FlaskConical, Copy, ChevronUp,
  ArrowUp, ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─── Accent ────────────────────────────────────────────────────────────────────
const ACCENT = "#4982CF";
function uid() { return Math.random().toString(36).slice(2, 10); }

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TemplateParameter {
  id: string;
  name: string;
  unit: string;
  reference: string;
}

export interface TemplateSection {
  id: string;
  name: string;
  parameters: TemplateParameter[];
  expanded: boolean;
}

export interface LabResultTemplate {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published";
  sections: TemplateSection[];
  createdAt: string;
  updatedAt: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_TEMPLATES: LabResultTemplate[] = [
  {
    id: "tpl-cbc",
    name: "Complete Blood Count (CBC)",
    description: "Standard haematology panel covering RBCs, WBCs, platelets and differential.",
    status: "published",
    createdAt: "2025-01-10",
    updatedAt: "2025-01-10",
    sections: [
      {
        id: "sec-cbc-1",
        name: "CBC Parameters",
        expanded: true,
        parameters: [
          { id: "p1", name: "Haemoglobin",  unit: "g/dL",    reference: "13.0 – 17.0" },
          { id: "p2", name: "WBC",          unit: "×10³/µL", reference: "4.5 – 11.0"  },
          { id: "p3", name: "Platelets",    unit: "×10³/µL", reference: "150 – 400"   },
          { id: "p4", name: "Neutrophils",  unit: "%",        reference: "40 – 70"     },
          { id: "p5", name: "Lymphocytes",  unit: "%",        reference: "20 – 40"     },
          { id: "p6", name: "MCV",          unit: "fL",       reference: "80 – 100"    },
        ],
      },
    ],
  },
  {
    id: "tpl-lft",
    name: "Liver Function Tests (LFTs)",
    description: "Comprehensive liver panel including transaminases, bilirubin and proteins.",
    status: "draft",
    createdAt: "2025-02-14",
    updatedAt: "2025-02-14",
    sections: [
      {
        id: "sec-lft-1",
        name: "Enzymes",
        expanded: true,
        parameters: [
          { id: "p7",  name: "ALT (SGPT)", unit: "U/L", reference: "7 – 56"  },
          { id: "p8",  name: "AST (SGOT)", unit: "U/L", reference: "10 – 40" },
          { id: "p9",  name: "ALP",        unit: "U/L", reference: "44 – 147" },
          { id: "p10", name: "GGT",        unit: "U/L", reference: "9 – 48"  },
        ],
      },
      {
        id: "sec-lft-2",
        name: "Bilirubin & Proteins",
        expanded: true,
        parameters: [
          { id: "p11", name: "Total Bilirubin",  unit: "mg/dL", reference: "0.1 – 1.2" },
          { id: "p12", name: "Direct Bilirubin", unit: "mg/dL", reference: "0.0 – 0.3" },
          { id: "p13", name: "Total Protein",    unit: "g/dL",  reference: "6.0 – 8.3"  },
          { id: "p14", name: "Albumin",          unit: "g/dL",  reference: "3.5 – 5.0"  },
        ],
      },
    ],
  },
];

const LS_KEY = "ehr-lab-result-templates";

function loadTemplates(): LabResultTemplate[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as LabResultTemplate[];
  } catch { /* ignore */ }
  return SEED_TEMPLATES;
}

function saveTemplates(templates: LabResultTemplate[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(templates));
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ template, onClose }: { template: LabResultTemplate; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4 text-[#4982CF]" />
            Preview — {template.name}
          </DialogTitle>
        </DialogHeader>

        {template.description && (
          <p className="text-xs text-slate-500 -mt-1">{template.description}</p>
        )}

        <div className="space-y-5 mt-2">
          {template.sections.map(sec => (
            <div key={sec.id}>
              <div className="text-xs font-black uppercase tracking-wide text-[#4982CF] mb-2 border-b border-[#4982CF]/20 pb-1">
                {sec.name}
              </div>
              {sec.parameters.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No parameters in this section.</p>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500">
                      <th className="text-left font-semibold px-3 py-1.5 border border-slate-100 w-[40%]">Parameter</th>
                      <th className="text-left font-semibold px-3 py-1.5 border border-slate-100 w-[20%]">Value</th>
                      <th className="text-left font-semibold px-3 py-1.5 border border-slate-100 w-[15%]">Unit</th>
                      <th className="text-left font-semibold px-3 py-1.5 border border-slate-100 w-[25%]">Reference Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.parameters.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-1.5 border border-slate-100 font-medium text-slate-700">{p.name}</td>
                        <td className="px-3 py-1.5 border border-slate-100">
                          <input
                            type="text"
                            readOnly
                            placeholder="—"
                            className="w-full bg-blue-50/60 border border-[#4982CF]/20 rounded px-1.5 py-0.5 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none cursor-default"
                          />
                        </td>
                        <td className="px-3 py-1.5 border border-slate-100 text-slate-500">{p.unit}</td>
                        <td className="px-3 py-1.5 border border-slate-100 text-slate-500">{p.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
          {template.sections.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6 italic">No sections defined.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Template Builder ─────────────────────────────────────────────────────────

function TemplateBuilder({
  initial,
  onSave,
  onCancel,
}: {
  initial: LabResultTemplate | null;
  onSave: (tpl: LabResultTemplate, status: "draft" | "published") => void;
  onCancel: () => void;
}) {
  const isNew = initial === null;
  const [name, setName]           = useState(initial?.name ?? "");
  const [description, setDesc]    = useState(initial?.description ?? "");
  const [sections, setSections]   = useState<TemplateSection[]>(
    initial?.sections ?? []
  );
  const [newSecName, setNewSecName]       = useState("");
  const [editSecId, setEditSecId]         = useState<string | null>(null);
  const [editSecName, setEditSecName]     = useState("");
  const [newParamSec, setNewParamSec]     = useState<string | null>(null);
  const [newParam, setNewParam]           = useState({ name: "", unit: "", reference: "" });
  const [editParamId, setEditParamId]     = useState<string | null>(null);
  const [editParam, setEditParam]         = useState({ name: "", unit: "", reference: "" });
  const [previewOpen, setPreviewOpen]     = useState(false);

  const draftTemplate = (): LabResultTemplate => ({
    id: initial?.id ?? uid(),
    name: name.trim() || "Untitled Template",
    description: description.trim(),
    status: initial?.status ?? "draft",
    sections,
    createdAt: initial?.createdAt ?? new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  });

  // ── Sections ──
  function addSection() {
    const n = newSecName.trim();
    if (!n) return;
    setSections(ss => [...ss, { id: uid(), name: n, parameters: [], expanded: true }]);
    setNewSecName("");
  }

  function deleteSection(id: string) {
    setSections(ss => ss.filter(s => s.id !== id));
  }

  function toggleSection(id: string) {
    setSections(ss => ss.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s));
  }

  function moveSec(idx: number, dir: -1 | 1) {
    const next = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSections(next);
  }

  function saveEditSec(id: string) {
    if (!editSecName.trim()) return;
    setSections(ss => ss.map(s => s.id === id ? { ...s, name: editSecName.trim() } : s));
    setEditSecId(null);
  }

  // ── Parameters ──
  function addParam(secId: string) {
    if (!newParam.name.trim()) return;
    setSections(ss => ss.map(s => s.id === secId
      ? { ...s, parameters: [...s.parameters, { id: uid(), name: newParam.name.trim(), unit: newParam.unit.trim(), reference: newParam.reference.trim() }] }
      : s
    ));
    setNewParam({ name: "", unit: "", reference: "" });
    setNewParamSec(null);
  }

  function deleteParam(secId: string, paramId: string) {
    setSections(ss => ss.map(s => s.id === secId
      ? { ...s, parameters: s.parameters.filter(p => p.id !== paramId) }
      : s
    ));
  }

  function moveParam(secId: string, idx: number, dir: -1 | 1) {
    setSections(ss => ss.map(s => {
      if (s.id !== secId) return s;
      const ps = [...s.parameters];
      const target = idx + dir;
      if (target < 0 || target >= ps.length) return s;
      [ps[idx], ps[target]] = [ps[target], ps[idx]];
      return { ...s, parameters: ps };
    }));
  }

  function openEditParam(secId: string, p: TemplateParameter) {
    setEditParamId(`${secId}::${p.id}`);
    setEditParam({ name: p.name, unit: p.unit, reference: p.reference });
  }

  function saveEditParam(secId: string, paramId: string) {
    setSections(ss => ss.map(s => s.id === secId
      ? { ...s, parameters: s.parameters.map(p => p.id === paramId
          ? { ...p, name: editParam.name.trim(), unit: editParam.unit.trim(), reference: editParam.reference.trim() }
          : p
        ) }
      : s
    ));
    setEditParamId(null);
  }

  const totalParams = sections.reduce((acc, s) => acc + s.parameters.length, 0);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-white flex-shrink-0 flex-wrap">
        <button onClick={onCancel} className="p-1 rounded hover:bg-slate-100 text-slate-500">
          <X className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
            {isNew ? "New Template" : "Edit Template"}
          </p>
          <p className="text-sm font-bold text-slate-700 truncate">{name || "Untitled Template"}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setPreviewOpen(true)} className="h-8 text-xs gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => onSave(draftTemplate(), "draft")}
            className="h-8 text-xs gap-1.5 border-slate-300"
          >
            <Save className="h-3.5 w-3.5" /> Save as Draft
          </Button>
          <Button
            onClick={() => onSave(draftTemplate(), "published")}
            className="h-8 text-xs gap-1.5 text-white"
            style={{ background: ACCENT }}
          >
            <FlaskConical className="h-3.5 w-3.5" /> Publish
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {/* Name + Description */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Template Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Complete Blood Count (CBC)" className="h-8 text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Description</label>
            <Input value={description} onChange={e => setDesc(e.target.value)} placeholder="Brief description of what this template covers…" className="h-8 text-sm" />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {sections.map((sec, si) => (
            <div key={sec.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Section header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <button onClick={() => toggleSection(sec.id)} className="text-slate-400 hover:text-slate-600">
                  {sec.expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>

                {editSecId === sec.id ? (
                  <Input
                    value={editSecName}
                    onChange={e => setEditSecName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveEditSec(sec.id)}
                    className="h-6 text-xs font-bold flex-1"
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 text-xs font-black text-slate-700">{sec.name}</span>
                )}

                <span className="text-[10px] text-slate-400 mr-1">{sec.parameters.length} param{sec.parameters.length !== 1 ? "s" : ""}</span>

                <div className="flex items-center gap-0.5">
                  <button onClick={() => moveSec(si, -1)} disabled={si === 0} className="p-1 rounded hover:bg-slate-200 text-slate-300 disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                  <button onClick={() => moveSec(si, 1)} disabled={si === sections.length - 1} className="p-1 rounded hover:bg-slate-200 text-slate-300 disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                  {editSecId === sec.id ? (
                    <>
                      <Button onClick={() => saveEditSec(sec.id)} className="h-6 text-[10px] px-2" style={{ background: ACCENT, color: "#fff" }}>Save</Button>
                      <Button variant="outline" onClick={() => setEditSecId(null)} className="h-6 text-[10px] px-2">×</Button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditSecId(sec.id); setEditSecName(sec.name); }} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
                      <button onClick={() => deleteSection(sec.id)} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button>
                    </>
                  )}
                </div>
              </div>

              {sec.expanded && (
                <div>
                  {/* Column headers */}
                  {sec.parameters.length > 0 && (
                    <div className="grid grid-cols-[1fr_auto_1fr_1fr_1fr_auto] gap-0 px-4 py-1.5 bg-slate-50/50 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <span>Parameter Name</span>
                      <span className="w-20 text-center">Move</span>
                      <span className="text-slate-300 italic normal-case font-normal">Value (filled at entry)</span>
                      <span>Unit</span>
                      <span>Reference Range</span>
                      <span className="w-14" />
                    </div>
                  )}

                  {/* Parameter rows */}
                  {sec.parameters.map((p, pi) => {
                    const editKey = `${sec.id}::${p.id}`;
                    const isEditing = editParamId === editKey;
                    return (
                      <div key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 group">
                        {isEditing ? (
                          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-4 py-2 items-center">
                            <Input value={editParam.name} onChange={e => setEditParam(v => ({ ...v, name: e.target.value }))} placeholder="Parameter name" className="h-6 text-xs" autoFocus />
                            <Input value={editParam.unit} onChange={e => setEditParam(v => ({ ...v, unit: e.target.value }))} placeholder="Unit" className="h-6 text-xs" />
                            <Input value={editParam.reference} onChange={e => setEditParam(v => ({ ...v, reference: e.target.value }))} placeholder="Reference range" className="h-6 text-xs" />
                            <div className="flex gap-1">
                              <Button onClick={() => saveEditParam(sec.id, p.id)} className="h-6 text-[10px] px-2" style={{ background: ACCENT, color: "#fff" }}>Save</Button>
                              <Button variant="outline" onClick={() => setEditParamId(null)} className="h-6 text-[10px] px-2">×</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-[1fr_auto_1fr_1fr_1fr_auto] gap-0 px-4 py-2 items-center">
                            <span className="text-xs font-medium text-slate-700">{p.name}</span>
                            <div className="w-20 flex justify-center gap-0.5">
                              <button onClick={() => moveParam(sec.id, pi, -1)} disabled={pi === 0} className="p-0.5 rounded hover:bg-slate-200 text-slate-300 disabled:opacity-30"><ArrowUp className="h-2.5 w-2.5" /></button>
                              <button onClick={() => moveParam(sec.id, pi, 1)} disabled={pi === sec.parameters.length - 1} className="p-0.5 rounded hover:bg-slate-200 text-slate-300 disabled:opacity-30"><ArrowDown className="h-2.5 w-2.5" /></button>
                            </div>
                            <span className="text-xs text-slate-300 italic">—</span>
                            <span className="text-xs text-slate-500">{p.unit || <span className="text-slate-300">—</span>}</span>
                            <span className="text-xs text-slate-500">{p.reference || <span className="text-slate-300">—</span>}</span>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity w-14 justify-end">
                              <button onClick={() => openEditParam(sec.id, p)} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
                              <button onClick={() => deleteParam(sec.id, p.id)} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add parameter inline */}
                  {newParamSec === sec.id ? (
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-4 py-2.5 bg-blue-50/40 border-t border-[#4982CF]/10 items-center">
                      <Input value={newParam.name} onChange={e => setNewParam(v => ({ ...v, name: e.target.value }))} placeholder="Parameter name *" className="h-7 text-xs" autoFocus />
                      <Input value={newParam.unit} onChange={e => setNewParam(v => ({ ...v, unit: e.target.value }))} placeholder="Unit (e.g. g/dL)" className="h-7 text-xs" />
                      <Input value={newParam.reference} onChange={e => setNewParam(v => ({ ...v, reference: e.target.value }))} placeholder="Reference range" className="h-7 text-xs"
                        onKeyDown={e => e.key === "Enter" && addParam(sec.id)} />
                      <div className="flex gap-1">
                        <Button onClick={() => addParam(sec.id)} className="h-7 text-xs px-3" style={{ background: ACCENT, color: "#fff" }}>Add</Button>
                        <Button variant="outline" onClick={() => { setNewParamSec(null); setNewParam({ name: "", unit: "", reference: "" }); }} className="h-7 text-xs px-2">×</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-2 border-t border-slate-50">
                      <button
                        onClick={() => { setNewParamSec(sec.id); setSections(ss => ss.map(s => s.id === sec.id ? { ...s, expanded: true } : s)); }}
                        className="flex items-center gap-1 text-[10px] font-bold hover:opacity-80"
                        style={{ color: ACCENT }}
                      >
                        <Plus className="h-3 w-3" /> Add Parameter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Section */}
        <div className="flex gap-2">
          <Input
            value={newSecName}
            onChange={e => setNewSecName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addSection()}
            placeholder="New section name (e.g. Differential Count)…"
            className="h-8 text-xs flex-1"
          />
          <Button onClick={addSection} className="h-8 text-xs gap-1.5 text-white flex-shrink-0" style={{ background: ACCENT }}>
            <Plus className="h-3.5 w-3.5" /> Add Section
          </Button>
        </div>

        {sections.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No sections yet</p>
            <p className="text-xs mt-1">Add a section above to start building your template.</p>
          </div>
        )}

        <div className="text-[10px] text-slate-400 text-right">
          {sections.length} section{sections.length !== 1 ? "s" : ""} · {totalParams} parameter{totalParams !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Preview */}
      {previewOpen && (
        <PreviewModal template={draftTemplate()} onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
}

// ─── Template List ────────────────────────────────────────────────────────────

function TemplateList({
  templates,
  onNew,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus,
  onPreview,
}: {
  templates: LabResultTemplate[];
  onNew: () => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onPreview: (id: string) => void;
}) {
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<"all" | "draft" | "published">("all");

  const visible = templates.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || t.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…" className="h-8 pl-8 text-xs w-52" />
          </div>
          {(["all", "draft", "published"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-colors capitalize ${filter === f ? "border-[#4982CF] bg-[#4982CF]/10 text-[#4982CF]" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              {f === "all" ? "All" : f === "draft" ? "Draft" : "Published"}
              <span className="ml-1 text-[10px] opacity-60">
                ({f === "all" ? templates.length : templates.filter(t => t.status === f).length})
              </span>
            </button>
          ))}
        </div>
        <Button onClick={onNew} className="h-8 text-xs gap-1.5 text-white" style={{ background: ACCENT }}>
          <Plus className="h-3.5 w-3.5" /> New Template
        </Button>
      </div>

      {/* Cards */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">No templates found</p>
          <p className="text-xs mt-1">{search ? "Try a different search term." : "Create your first template to get started."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(tpl => {
            const totalParams = tpl.sections.reduce((a, s) => a + s.parameters.length, 0);
            return (
              <div key={tpl.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-start gap-4 hover:shadow-md transition-shadow group">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}18` }}>
                    <FlaskConical className="h-4.5 w-4.5" style={{ color: ACCENT }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">{tpl.name}</span>
                    {tpl.status === "published" ? (
                      <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold">Published</Badge>
                    ) : (
                      <Badge className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-500 border-slate-200 font-semibold">Draft</Badge>
                    )}
                  </div>
                  {tpl.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{tpl.description}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {tpl.sections.length} section{tpl.sections.length !== 1 ? "s" : ""} · {totalParams} parameter{totalParams !== 1 ? "s" : ""} · updated {tpl.updatedAt}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                  <button onClick={() => onPreview(tpl.id)} title="Preview" className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-[#4982CF] border border-slate-200">
                    <Eye className="h-3 w-3" /> Preview
                  </button>
                  <button onClick={() => onEdit(tpl.id)} title="Edit" className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-[#4982CF] border border-slate-200">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                  <button onClick={() => onDuplicate(tpl.id)} title="Duplicate" className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-500 hover:bg-slate-100 border border-slate-200">
                    <Copy className="h-3 w-3" /> Duplicate
                  </button>
                  <button
                    onClick={() => onToggleStatus(tpl.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border ${tpl.status === "published" ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`}
                  >
                    {tpl.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => onDelete(tpl.id)} title="Delete" className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 hover:bg-rose-50 hover:text-rose-500 border border-slate-200">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────

export function LabResultTemplatesModule() {
  const [templates, setTemplates] = useState<LabResultTemplate[]>(() => loadTemplates());
  const [view, setView]           = useState<"list" | "builder">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => { saveTemplates(templates); }, [templates]);

  const editingTemplate = editingId ? (templates.find(t => t.id === editingId) ?? null) : null;

  function handleSave(tpl: LabResultTemplate, status: "draft" | "published") {
    const final = { ...tpl, status };
    setTemplates(ts => {
      const exists = ts.some(t => t.id === final.id);
      return exists ? ts.map(t => t.id === final.id ? final : t) : [...ts, final];
    });
    setView("list");
    setEditingId(null);
  }

  function handleEdit(id: string) {
    setEditingId(id);
    setView("builder");
  }

  function handleNew() {
    setEditingId(null);
    setView("builder");
  }

  function handleDuplicate(id: string) {
    const src = templates.find(t => t.id === id);
    if (!src) return;
    const copy: LabResultTemplate = {
      ...src,
      id: uid(),
      name: `${src.name} (Copy)`,
      status: "draft",
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      sections: src.sections.map(s => ({
        ...s,
        id: uid(),
        parameters: s.parameters.map(p => ({ ...p, id: uid() })),
      })),
    };
    setTemplates(ts => [...ts, copy]);
  }

  function handleDelete(id: string) {
    setTemplates(ts => ts.filter(t => t.id !== id));
  }

  function handleToggleStatus(id: string) {
    setTemplates(ts => ts.map(t => t.id === id
      ? { ...t, status: t.status === "published" ? "draft" : "published", updatedAt: new Date().toISOString().slice(0, 10) }
      : t
    ));
  }

  const previewTemplate = previewId ? templates.find(t => t.id === previewId) : null;

  if (view === "builder") {
    return (
      <div className="h-full flex flex-col min-h-0">
        <TemplateBuilder
          initial={editingTemplate}
          onSave={handleSave}
          onCancel={() => { setView("list"); setEditingId(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-5">
        <FlaskConical className="h-5 w-5" style={{ color: ACCENT }} />
        <div>
          <h2 className="text-base font-black text-slate-800">Lab Result Templates</h2>
          <p className="text-xs text-slate-500">Build and manage reusable result report formats for lab tests.</p>
        </div>
      </div>
      <TemplateList
        templates={templates}
        onNew={handleNew}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onPreview={id => setPreviewId(id)}
      />
      {previewTemplate && (
        <PreviewModal template={previewTemplate} onClose={() => setPreviewId(null)} />
      )}
    </div>
  );
}
