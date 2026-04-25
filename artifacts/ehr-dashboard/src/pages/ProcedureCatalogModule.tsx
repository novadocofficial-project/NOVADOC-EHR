import { useState } from "react";
import {
  Plus, Trash2, Edit2, Save, X, GripVertical, Search, ChevronDown,
  ChevronRight, AlertCircle, Stethoscope, FileText, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function uid() { return Math.random().toString(36).slice(2, 10); }
function reorder<T>(arr: T[], from: number, to: number) {
  const next = [...arr]; const [mv] = next.splice(from, 1); next.splice(to, 0, mv); return next;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProcedureItem {
  id: string;
  name: string;
  cptCode: string;
  autoGenCpt: boolean;
  description: string;
}

export interface ProcedureSection {
  id: string;
  name: string;
  procedures: ProcedureItem[];
  expanded: boolean;
}

export type PartnerType = "Internal Clinic" | "External Provider";

export interface ProcedurePartner {
  id: string;
  name: string;
  type: PartnerType;
  contact: string;
  active: boolean;
  selectedProcedures: string[];
  pricing: Record<string, string>;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_PROC_SECTIONS: ProcedureSection[] = [
  {
    id: "ps1", name: "Respiratory", expanded: true, procedures: [
      { id: "pr1",  name: "Spirometry",           cptCode: "94010", autoGenCpt: false, description: "Pulmonary function test" },
      { id: "pr2",  name: "Nebulisation",          cptCode: "94640", autoGenCpt: false, description: "" },
      { id: "pr3",  name: "Peak Flow Measurement", cptCode: "94150", autoGenCpt: false, description: "" },
    ],
  },
  {
    id: "ps2", name: "Wound Care", expanded: false, procedures: [
      { id: "pr4",  name: "Wound Dressing (Simple)",    cptCode: "97602", autoGenCpt: false, description: "" },
      { id: "pr5",  name: "Wound Debridement",          cptCode: "97597", autoGenCpt: false, description: "" },
      { id: "pr6",  name: "Suture Removal",             cptCode: "99211", autoGenCpt: false, description: "" },
    ],
  },
  {
    id: "ps3", name: "Minor Surgery", expanded: false, procedures: [
      { id: "pr7",  name: "Incision & Drainage",        cptCode: "10060", autoGenCpt: false, description: "Abscess I&D" },
      { id: "pr8",  name: "Lipoma Excision",            cptCode: "21931", autoGenCpt: false, description: "" },
      { id: "pr9",  name: "Nail Avulsion",              cptCode: "11730", autoGenCpt: false, description: "" },
    ],
  },
  {
    id: "ps4", name: "Urinary", expanded: false, procedures: [
      { id: "pr10", name: "Catheterisation",            cptCode: "51702", autoGenCpt: false, description: "" },
      { id: "pr11", name: "Bladder Irrigation",         cptCode: "51700", autoGenCpt: false, description: "" },
    ],
  },
];

const SEED_PARTNERS: ProcedurePartner[] = [
  {
    id: "pp1", name: "In-Clinic (Main)", type: "Internal Clinic", contact: "", active: true,
    selectedProcedures: ["pr1","pr2","pr4","pr5","pr6","pr7"],
    pricing: { pr1: "1500", pr2: "500", pr4: "800", pr5: "1200", pr6: "400", pr7: "1800" },
  },
  {
    id: "pp2", name: "Surgical Associates", type: "External Provider", contact: "0300-1234567", active: true,
    selectedProcedures: ["pr7","pr8","pr9"],
    pricing: { pr7: "2000", pr8: "3500", pr9: "1200" },
  },
];

function autoGenCode() {
  return `CPT-${Math.floor(10000 + Math.random() * 89999)}`;
}

// ─── Procedure Master List ────────────────────────────────────────────────────

function ProcedureMasterList({
  sections, setSections,
}: {
  sections: ProcedureSection[];
  setSections: (fn: (prev: ProcedureSection[]) => ProcedureSection[]) => void;
}) {
  const [search, setSearch]             = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [editSectionId, setEditSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState("");
  const [addProcSectionId, setAddProcSectionId] = useState<string | null>(null);
  const [draft, setDraft]               = useState<Omit<ProcedureItem,"id">>({ name: "", cptCode: "", autoGenCpt: false, description: "" });
  const [editProcId, setEditProcId]     = useState<string | null>(null);
  const [editProcData, setEditProcData] = useState<Omit<ProcedureItem,"id">>({ name: "", cptCode: "", autoGenCpt: false, description: "" });
  const [dragSecIdx, setDragSecIdx]     = useState<number | null>(null);
  const [dropSecIdx, setDropSecIdx]     = useState<number | null>(null);

  function addSection() {
    if (!newSectionName.trim()) return;
    setSections(ss => [...ss, { id: uid(), name: newSectionName.trim(), procedures: [], expanded: true }]);
    setNewSectionName("");
  }

  function addProc(sectionId: string) {
    if (!draft.name.trim()) return;
    const cpt = draft.autoGenCpt ? autoGenCode() : draft.cptCode.trim();
    setSections(ss => ss.map(s => s.id === sectionId
      ? { ...s, procedures: [...s.procedures, { id: uid(), ...draft, cptCode: cpt }] }
      : s));
    setDraft({ name: "", cptCode: "", autoGenCpt: false, description: "" });
    setAddProcSectionId(null);
  }

  function saveEditProc(sectionId: string, procId: string) {
    const cpt = editProcData.autoGenCpt ? autoGenCode() : editProcData.cptCode.trim();
    setSections(ss => ss.map(s => s.id === sectionId
      ? { ...s, procedures: s.procedures.map(p => p.id === procId ? { id: procId, ...editProcData, cptCode: cpt } : p) }
      : s));
    setEditProcId(null);
  }

  function exportCSV() {
    const rows = [["Section","Procedure Name","CPT Code","Description"]];
    sections.forEach(s => s.procedures.forEach(p => rows.push([s.name, p.name, p.cptCode, p.description])));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "procedure-master-list.csv";
    a.click();
  }

  const matchSearch = (p: ProcedureItem) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.cptCode.toLowerCase().includes(search.toLowerCase());

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-between flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search procedures / CPT…" className="h-8 pl-8 text-xs w-64" />
        </div>
        <Button variant="outline" onClick={exportCSV} className="h-8 text-xs gap-1.5"><FileText className="h-3.5 w-3.5" /> Export CSV</Button>
      </div>

      <div className="flex gap-2">
        <Input value={newSectionName} onChange={e => setNewSectionName(e.target.value)} onKeyDown={e => e.key === "Enter" && addSection()} placeholder="New section name…" className="h-8 text-xs flex-1" />
        <Button onClick={addSection} className="h-8 text-xs bg-[#4982CF] text-white gap-1.5 px-3"><Plus className="h-3.5 w-3.5" /> Add Section</Button>
      </div>

      <div className="space-y-3">
        {sections.map((sec, si) => (
          <div key={sec.id} draggable
            onDragStart={() => setDragSecIdx(si)}
            onDragOver={e => { e.preventDefault(); setDropSecIdx(si); }}
            onDrop={() => { if (dragSecIdx !== null && dragSecIdx !== si) setSections(ss => reorder(ss, dragSecIdx, si)); setDragSecIdx(null); setDropSecIdx(null); }}
            onDragEnd={() => { setDragSecIdx(null); setDropSecIdx(null); }}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${dropSecIdx === si && dragSecIdx !== si ? "border-[#4982CF] border-dashed" : "border-slate-100"}`}>

            {/* Section header */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              <GripVertical className="h-4 w-4 text-slate-300 cursor-grab flex-shrink-0" />
              {editSectionId === sec.id ? (
                <Input value={editSectionName} onChange={e => setEditSectionName(e.target.value)} className="h-7 text-xs font-bold flex-1" autoFocus />
              ) : (
                <button onClick={() => setSections(ss => ss.map(s => s.id === sec.id ? { ...s, expanded: !s.expanded } : s))}
                  className="flex items-center gap-2 flex-1 text-left">
                  {sec.expanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                  <span className="text-xs font-black text-slate-700">{sec.name}</span>
                  <span className="text-[10px] text-slate-400">{sec.procedures.filter(matchSearch).length} procedures</span>
                </button>
              )}
              <div className="flex gap-1 ml-auto">
                {editSectionId === sec.id ? (
                  <>
                    <Button onClick={() => { setSections(ss => ss.map(s => s.id === sec.id ? { ...s, name: editSectionName } : s)); setEditSectionId(null); }} className="h-6 text-[10px] bg-[#4982CF] text-white px-2">Save</Button>
                    <Button variant="outline" onClick={() => setEditSectionId(null)} className="h-6 text-[10px] px-2">Cancel</Button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setAddProcSectionId(sec.id); setSections(ss => ss.map(s => s.id === sec.id ? { ...s, expanded: true } : s)); }} className="text-[10px] font-bold text-[#4982CF] flex items-center gap-0.5 hover:opacity-80"><Plus className="h-3 w-3" /> Procedure</button>
                    <button onClick={() => { setEditSectionId(sec.id); setEditSectionName(sec.name); }} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
                    <button onClick={() => setSections(ss => ss.filter(s => s.id !== sec.id))} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button>
                  </>
                )}
              </div>
            </div>

            {sec.expanded && (
              <div>
                {/* Add procedure inline */}
                {addProcSectionId === sec.id && (
                  <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-blue-50/50 border-b border-[#4982CF]/20 items-center">
                    <Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Procedure name…" className="h-7 text-xs col-span-2" autoFocus />
                    <div className="flex items-center gap-1.5">
                      <Input value={draft.cptCode} onChange={e => setDraft(d => ({ ...d, cptCode: e.target.value }))} disabled={draft.autoGenCpt} placeholder="CPT code" className="h-7 text-xs flex-1 font-mono" />
                      <label className="flex items-center gap-1 text-[10px] text-slate-500 whitespace-nowrap cursor-pointer">
                        <input type="checkbox" checked={draft.autoGenCpt} onChange={e => setDraft(d => ({ ...d, autoGenCpt: e.target.checked }))} className="accent-[#4982CF]" /> Auto
                      </label>
                    </div>
                    <div className="flex gap-1.5">
                      <Button onClick={() => addProc(sec.id)} className="h-7 text-xs bg-[#4982CF] text-white px-2">Add</Button>
                      <Button variant="outline" onClick={() => { setAddProcSectionId(null); setDraft({ name: "", cptCode: "", autoGenCpt: false, description: "" }); }} className="h-7 text-xs px-2">Cancel</Button>
                    </div>
                  </div>
                )}

                {sec.procedures.filter(matchSearch).map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 group">
                    <GripVertical className="h-3.5 w-3.5 text-slate-200 cursor-grab flex-shrink-0" />
                    {editProcId === p.id ? (
                      <>
                        <Input value={editProcData.name} onChange={e => setEditProcData(d => ({ ...d, name: e.target.value }))} className="h-6 text-xs flex-1" autoFocus />
                        <div className="flex items-center gap-1.5">
                          <Input value={editProcData.cptCode} disabled={editProcData.autoGenCpt} onChange={e => setEditProcData(d => ({ ...d, cptCode: e.target.value }))} placeholder="CPT" className="h-6 text-xs w-24 font-mono" />
                          <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer"><input type="checkbox" checked={editProcData.autoGenCpt} onChange={e => setEditProcData(d => ({ ...d, autoGenCpt: e.target.checked }))} className="accent-[#4982CF]" /> Auto</label>
                        </div>
                        <Button onClick={() => saveEditProc(sec.id, p.id)} className="h-6 text-[10px] bg-[#4982CF] text-white px-2">Save</Button>
                        <Button variant="outline" onClick={() => setEditProcId(null)} className="h-6 text-[10px] px-2">×</Button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-slate-700 flex-1">{p.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">{p.cptCode || "—"}</span>
                        {p.description && <span className="text-[10px] text-slate-400">{p.description}</span>}
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                          <button onClick={() => { setEditProcId(p.id); setEditProcData({ name: p.name, cptCode: p.cptCode, autoGenCpt: p.autoGenCpt, description: p.description }); }} className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
                          <button onClick={() => setSections(ss => ss.map(s => s.id === sec.id ? { ...s, procedures: s.procedures.filter(x => x.id !== p.id) } : s))} className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {sec.procedures.filter(matchSearch).length === 0 && (
                  <p className="text-center text-xs text-slate-300 py-4">{search ? "No matching procedures" : "No procedures — click + Procedure above"}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Procedure Partners ───────────────────────────────────────────────────────

function ProcedurePartners({
  partners, setPartners, sections,
}: {
  partners: ProcedurePartner[];
  setPartners: (fn: (prev: ProcedurePartner[]) => ProcedurePartner[]) => void;
  sections: ProcedureSection[];
}) {
  const [step, setStep]           = useState<1 | 2>(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState<{ name: string; type: PartnerType; contact: string }>({ name: "", type: "Internal Clinic", contact: "" });
  const [selected, setSelected]   = useState<string[]>([]);
  const [pricing, setPricing]     = useState<Record<string, string>>({});
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [expandId, setExpandId]   = useState<string | null>(null);
  const [importPartnerId, setImportPartnerId] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<{ matched: number; unmatched: string[] } | null>(null);

  const allProcs = sections.flatMap(s => s.procedures);

  function openNew() {
    setForm({ name: "", type: "Internal Clinic", contact: "" }); setSelected([]); setPricing({}); setEditId(null); setStep(1); setShowModal(true);
  }

  function openEdit(p: ProcedurePartner) {
    setForm({ name: p.name, type: p.type, contact: p.contact }); setSelected([...p.selectedProcedures]); setPricing({ ...p.pricing }); setEditId(p.id); setStep(1); setShowModal(true);
  }

  function save() {
    const data: ProcedurePartner = { id: editId ?? uid(), name: form.name.trim(), type: form.type, contact: form.contact, active: true, selectedProcedures: selected, pricing };
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
      const proc = allProcs.find(p => p.name.toLowerCase() === name?.toLowerCase());
      if (proc && price) { newPricing[proc.id] = price; matched.push(name); }
      else if (name) unmatched.push(name);
    });
    setPartners(ps => ps.map(p => p.id === partnerId ? { ...p, pricing: newPricing } : p));
    setImportResult({ matched: matched.length, unmatched });
    setImportText("");
  }

  const TYPE_COLORS: Record<PartnerType, string> = {
    "Internal Clinic":  "bg-blue-50 text-blue-600 border-blue-200",
    "External Provider":"bg-amber-50 text-amber-600 border-amber-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} className="bg-[#4982CF] hover:bg-[#3b6bb5] text-white h-8 text-xs gap-1.5"><Plus className="h-3.5 w-3.5" /> New Partner</Button>
      </div>

      {partners.map(p => {
        const isExpanded = expandId === p.id;
        return (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800">{p.name}</p>
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${TYPE_COLORS[p.type]}`}>{p.type}</Badge>
                </div>
                <p className="text-[10px] text-slate-400">{p.contact || "No contact"} · {p.selectedProcedures.length} procedures</p>
              </div>
              <Switch checked={p.active} onCheckedChange={v => setPartners(ps => ps.map(x => x.id === p.id ? { ...x, active: v } : x))} className="data-[state=checked]:bg-[#4982CF]" />
              <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => setExpandId(isExpanded ? null : p.id)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            </div>

            {isExpanded && (
              <div className="border-t border-slate-100">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex-1">Procedure Pricing</p>
                  <button onClick={() => setImportPartnerId(importPartnerId === p.id ? null : p.id)}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#4982CF] hover:opacity-80"><Upload className="h-3 w-3" /> Import Pricing</button>
                </div>
                {importPartnerId === p.id && (
                  <div className="px-4 py-3 bg-blue-50/40 border-b border-[#4982CF]/20 space-y-2">
                    <p className="text-[10px] text-slate-500">Paste CSV: <span className="font-mono">Procedure Name, Price</span> (one per line)</p>
                    <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={4}
                      className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#4982CF] resize-none" />
                    <div className="flex items-center gap-2">
                      <Button onClick={() => importPricing(p.id)} className="h-7 text-xs bg-[#4982CF] text-white px-3">Apply</Button>
                      <Button variant="outline" onClick={() => { setImportPartnerId(null); setImportResult(null); }} className="h-7 text-xs px-3">Cancel</Button>
                      {importResult && <span className="text-[10px] text-slate-500">{importResult.matched} matched{importResult.unmatched.length > 0 && `, ${importResult.unmatched.length} unmatched`}</span>}
                    </div>
                  </div>
                )}
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-slate-50 border-b border-slate-100 sticky top-0">
                      <th className="text-left px-4 py-2 font-black text-[10px] uppercase tracking-widest text-slate-400">Procedure</th>
                      <th className="text-right px-4 py-2 font-black text-[10px] uppercase tracking-widest text-slate-400 w-32">Price (PKR)</th>
                    </tr></thead>
                    <tbody>
                      {sections.flatMap(s => s.procedures.filter(pr => p.selectedProcedures.includes(pr.id)).map(pr => (
                        <tr key={pr.id} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-1.5 text-slate-700">{pr.name}</td>
                          <td className="px-4 py-1.5 text-right">
                            <Input value={p.pricing[pr.id] ?? ""} onChange={e => setPartners(ps => ps.map(x => x.id === p.id ? { ...x, pricing: { ...x.pricing, [pr.id]: e.target.value } } : x))}
                              placeholder="0.00" className="h-6 text-xs text-right w-28 ml-auto" />
                          </td>
                        </tr>
                      )))}
                      {p.selectedProcedures.length === 0 && <tr><td colSpan={2} className="px-4 py-4 text-center text-slate-300 text-xs">No procedures selected</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {!partners.length && (
        <div className="text-center py-16 text-slate-300">
          <Stethoscope className="h-12 w-12 mx-auto mb-3" />
          <p className="text-sm font-semibold">No procedure partners yet</p>
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={v => !v && setShowModal(false)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editId ? "Edit Partner" : "New Procedure Partner"}
              <span className="ml-auto text-xs font-normal text-slate-400">Step {step} of 2</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 mb-4">
            {[1,2].map(s => (
              <div key={s} className={`flex items-center gap-2 ${s < 2 ? "flex-1" : ""}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black ${step >= s ? "bg-[#4982CF] text-white" : "bg-slate-100 text-slate-400"}`}>{s}</div>
                <span className={`text-xs font-medium ${step === s ? "text-[#4982CF]" : "text-slate-400"}`}>{s === 1 ? "Partner Details" : "Procedure Selection & Pricing"}</span>
                {s < 2 && <div className="flex-1 h-px bg-slate-200" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600">Partner Name <span className="text-red-400">*</span></label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. In-Clinic (Main)" className="h-9 text-sm mt-1" autoFocus />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PartnerType }))}
                    className="w-full h-9 text-sm border border-slate-200 rounded-lg px-3 focus:outline-none mt-1 bg-white">
                    <option>Internal Clinic</option>
                    <option>External Provider</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600">Contact Info {form.type === "External Provider" && <span className="text-slate-400 font-normal">(required for external)</span>}</label>
                  <Input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Phone / email / contract ref" className="h-9 text-sm mt-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowModal(false)} className="h-9 text-sm">Cancel</Button>
                <Button disabled={!form.name.trim()} onClick={() => setStep(2)} className="bg-[#4982CF] text-white h-9 text-sm">Next →</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3 overflow-hidden flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">{selected.length} of {allProcs.length} procedures selected</p>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(allProcs.map(p => p.id))} className="text-xs text-[#4982CF] font-bold">Select All</button>
                  <button onClick={() => setSelected([])} className="text-xs text-slate-400 font-bold">Clear</button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1 border border-slate-100 rounded-xl">
                {sections.map(sec => (
                  <div key={sec.id}>
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{sec.name}</p>
                    </div>
                    {sec.procedures.map(pr => (
                      <div key={pr.id} className="flex items-center gap-3 px-4 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <input type="checkbox" checked={selected.includes(pr.id)} onChange={() => setSelected(ss => ss.includes(pr.id) ? ss.filter(x => x !== pr.id) : [...ss, pr.id])} className="accent-[#4982CF]" />
                        <span className="flex-1 text-xs text-slate-700">{pr.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{pr.cptCode}</span>
                        {selected.includes(pr.id) && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">PKR</span>
                            <Input value={pricing[pr.id] ?? ""} onChange={e => setPricing(p => ({ ...p, [pr.id]: e.target.value }))} placeholder="Price" className="h-6 w-20 text-xs text-right" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex justify-between gap-2 pt-1">
                <Button variant="outline" onClick={() => setStep(1)} className="h-9 text-sm">← Back</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowModal(false)} className="h-9 text-sm">Cancel</Button>
                  <Button onClick={save} className="bg-[#4982CF] text-white h-9 text-sm gap-1.5"><Save className="h-3.5 w-3.5" /> Save Partner</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-rose-600"><AlertCircle className="h-5 w-5" />Remove Partner</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Remove <strong>{partners.find(p => p.id === deleteId)?.name}</strong>?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="h-8 text-sm">Cancel</Button>
            <Button onClick={() => { setPartners(ps => ps.filter(p => p.id !== deleteId)); setDeleteId(null); }} className="bg-rose-500 text-white h-8 text-sm">Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ProcedureCatalogModule ───────────────────────────────────────────────────

type ProcView = "master" | "partners";

interface ProcedureCatalogModuleProps {
  sections: ProcedureSection[];
  setSections: (fn: (prev: ProcedureSection[]) => ProcedureSection[]) => void;
  partners: ProcedurePartner[];
  setPartners: (fn: (prev: ProcedurePartner[]) => ProcedurePartner[]) => void;
  initialView?: ProcView;
}

export function ProcedureCatalogModule({ sections, setSections, partners, setPartners, initialView }: ProcedureCatalogModuleProps) {
  const [view, setView] = useState<ProcView>(initialView ?? "master");

  const NAV: { key: ProcView; label: string; sub: string }[] = [
    { key: "master",   label: "Procedure Master List", sub: "Manage sections, procedures, and CPT codes." },
    { key: "partners", label: "Procedure Partners",    sub: "Add partners, assign procedures, and configure pricing." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        {NAV.map(n => (
          <button key={n.key} onClick={() => setView(n.key)}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${view === n.key ? "bg-white text-[#4982CF] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {n.label}
          </button>
        ))}
      </div>
      <div>
        <h2 className="text-lg font-black text-slate-800">{NAV.find(n => n.key === view)!.label}</h2>
        <p className="text-sm text-slate-400 mt-0.5">{NAV.find(n => n.key === view)!.sub}</p>
      </div>
      {view === "master"   && <ProcedureMasterList sections={sections} setSections={setSections} />}
      {view === "partners" && <ProcedurePartners   partners={partners} setPartners={setPartners} sections={sections} />}
    </div>
  );
}

export { SEED_PROC_SECTIONS as INITIAL_PROC_SECTIONS, SEED_PARTNERS as INITIAL_PROC_PARTNERS };
