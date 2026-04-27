import { useState, useRef } from "react";
import {
  Plus, Trash2, Edit2, Save, X, GripVertical, Search, ChevronDown,
  ChevronRight, CheckCircle2, AlertCircle, Package, FileText,
  Upload, FlaskConical,
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

export interface LabTest {
  id: string;
  name: string;
  description: string;
  sampleType?: string;
  fastingRequired?: boolean;
}

const DEFAULT_SAMPLE_TYPES = [
  "Blood (Venous)", "Blood (Capillary)", "Serum / Plasma",
  "Urine (Spot)", "Urine (24-hr)", "Stool / Feces",
  "Sputum", "Throat Swab", "Wound Swab",
  "CSF", "Pleural Fluid", "Ascitic Fluid",
  "Tissue / Biopsy", "N/A",
];

export interface LabSection {
  id: string;
  name: string;
  tests: LabTest[];
  expanded: boolean;
}

export interface LabProvider {
  id: string;
  name: string;
  contact: string;
  active: boolean;
  selectedTests: string[];
  pricing: Record<string, string>;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_SECTIONS: LabSection[] = [
  {
    id: "ls1", name: "Haematology", expanded: true, tests: [
      { id: "t1",  name: "Complete Blood Count (CBC)",      description: "WBC, RBC, Haemoglobin, Platelets", sampleType: "Blood (Venous)", fastingRequired: false },
      { id: "t2",  name: "ESR",                             description: "Erythrocyte Sedimentation Rate",   sampleType: "Blood (Venous)", fastingRequired: false },
      { id: "t3",  name: "Peripheral Blood Film",           description: "",                                 sampleType: "Blood (Venous)", fastingRequired: false },
      { id: "t4",  name: "Reticulocyte Count",              description: "",                                 sampleType: "Blood (Venous)", fastingRequired: false },
      { id: "t5",  name: "Coagulation Profile (PT/APTT)",  description: "",                                 sampleType: "Blood (Venous)", fastingRequired: false },
    ],
  },
  {
    id: "ls2", name: "Blood Chemistry", expanded: false, tests: [
      { id: "t6",  name: "Fasting Blood Sugar",  description: "",                                            sampleType: "Blood (Venous)", fastingRequired: true },
      { id: "t7",  name: "HbA1c",               description: "",                                             sampleType: "Blood (Venous)", fastingRequired: false },
      { id: "t8",  name: "Lipid Profile",        description: "Cholesterol, Triglycerides, HDL, LDL",       sampleType: "Serum / Plasma", fastingRequired: true },
      { id: "t9",  name: "Liver Function Tests", description: "ALT, AST, ALP, Bilirubin",                   sampleType: "Serum / Plasma", fastingRequired: false },
      { id: "t10", name: "Kidney Function Tests",description: "Urea, Creatinine, eGFR",                     sampleType: "Serum / Plasma", fastingRequired: false },
      { id: "t11", name: "Uric Acid",            description: "",                                            sampleType: "Serum / Plasma", fastingRequired: false },
    ],
  },
  {
    id: "ls3", name: "Microbiology", expanded: false, tests: [
      { id: "t12", name: "Culture & Sensitivity (Urine)", description: "",  sampleType: "Urine (Spot)", fastingRequired: false },
      { id: "t13", name: "Culture & Sensitivity (Sputum)",description: "",  sampleType: "Sputum",       fastingRequired: false },
      { id: "t14", name: "Mantoux / TB Screen",           description: "",  sampleType: "N/A",          fastingRequired: false },
    ],
  },
  {
    id: "ls4", name: "Urinalysis", expanded: false, tests: [
      { id: "t15", name: "Urine R/E",           description: "Routine examination",  sampleType: "Urine (Spot)", fastingRequired: false },
      { id: "t16", name: "Urine C/S",           description: "Culture & Sensitivity", sampleType: "Urine (Spot)", fastingRequired: false },
      { id: "t17", name: "24-hr Urine Protein", description: "",                      sampleType: "Urine (24-hr)", fastingRequired: false },
    ],
  },
  {
    id: "ls5", name: "Hormones", expanded: false, tests: [
      { id: "t18", name: "TSH",               description: "Thyroid Stimulating Hormone", sampleType: "Serum / Plasma", fastingRequired: false },
      { id: "t19", name: "T3 / T4",          description: "",                              sampleType: "Serum / Plasma", fastingRequired: false },
      { id: "t20", name: "FSH / LH",         description: "",                              sampleType: "Serum / Plasma", fastingRequired: false },
      { id: "t21", name: "Testosterone",     description: "",                              sampleType: "Serum / Plasma", fastingRequired: false },
      { id: "t22", name: "Cortisol (morning)",description: "",                             sampleType: "Serum / Plasma", fastingRequired: false },
    ],
  },
];

const SEED_PROVIDERS: LabProvider[] = [
  {
    id: "prov1", name: "Hashmani Laboratories", contact: "021-35893416", active: true,
    selectedTests: ["t1","t2","t6","t7","t8","t9","t10","t15","t18","t19"],
    pricing: { t1: "850", t2: "250", t6: "150", t7: "600", t8: "950", t9: "1100", t10: "750", t15: "200", t18: "550", t19: "800" },
  },
  {
    id: "prov2", name: "Chughtai Lab", contact: "042-111-456-789", active: true,
    selectedTests: ["t1","t3","t6","t7","t8","t11","t12","t18"],
    pricing: { t1: "800", t3: "350", t6: "130", t7: "580", t8: "900", t11: "300", t12: "1200", t18: "520" },
  },
];

// ─── Lab Test Master List ─────────────────────────────────────────────────────

function LabMasterList({
  sections, setSections,
}: {
  sections: LabSection[];
  setSections: (fn: (prev: LabSection[]) => LabSection[]) => void;
}) {
  const [search, setSearch]       = useState("");
  const [editSectionId, setEditSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState("");
  const [newSectionName, setNewSectionName]   = useState("");
  const [addTestSectionId, setAddTestSectionId] = useState<string | null>(null);
  const [newTestName, setNewTestName]           = useState("");
  const [newTestDesc, setNewTestDesc]           = useState("");
  const [newTestSampleType, setNewTestSampleType] = useState("");
  const [newTestFasting, setNewTestFasting]       = useState(false);
  const [newCustomSampleType, setNewCustomSampleType] = useState("");
  const [showNewCustomInput, setShowNewCustomInput]   = useState(false);
  const [customSampleTypes, setCustomSampleTypes]     = useState<string[]>([]);
  const [editTestId, setEditTestId]     = useState<string | null>(null);
  const [editTestName, setEditTestName] = useState("");
  const [editTestDesc, setEditTestDesc] = useState("");
  const [editTestSampleType, setEditTestSampleType] = useState("");
  const [editTestFasting, setEditTestFasting]       = useState(false);
  const [showEditCustomInput, setShowEditCustomInput] = useState(false);
  const [editCustomSampleType, setEditCustomSampleType] = useState("");
  const [dragSecIdx, setDragSecIdx]     = useState<number | null>(null);
  const [dropSecIdx, setDropSecIdx]     = useState<number | null>(null);
  const [dragTestSec, setDragTestSec]   = useState<string | null>(null);
  const [dragTestIdx, setDragTestIdx]   = useState<number | null>(null);
  const [dropTestIdx, setDropTestIdx]   = useState<number | null>(null);

  const allTests = sections.flatMap(s => s.tests);
  const matchSearch = (t: LabTest) => !search || t.name.toLowerCase().includes(search.toLowerCase());

  function toggleExpand(id: string) {
    setSections(ss => ss.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s));
  }

  function addSection() {
    if (!newSectionName.trim()) return;
    setSections(ss => [...ss, { id: uid(), name: newSectionName.trim(), tests: [], expanded: true }]);
    setNewSectionName("");
  }

  function addTest(sectionId: string) {
    if (!newTestName.trim()) return;
    setSections(ss => ss.map(s => s.id === sectionId
      ? { ...s, tests: [...s.tests, { id: uid(), name: newTestName.trim(), description: newTestDesc.trim(), sampleType: newTestSampleType || undefined, fastingRequired: newTestFasting }] }
      : s));
    setNewTestName(""); setNewTestDesc(""); setNewTestSampleType(""); setNewTestFasting(false);
    setShowNewCustomInput(false); setNewCustomSampleType("");
    setAddTestSectionId(null);
  }

  function saveEditSection(id: string) {
    if (!editSectionName.trim()) return;
    setSections(ss => ss.map(s => s.id === id ? { ...s, name: editSectionName } : s));
    setEditSectionId(null);
  }

  function saveEditTest(sectionId: string, testId: string) {
    setSections(ss => ss.map(s => s.id === sectionId
      ? { ...s, tests: s.tests.map(t => t.id === testId ? { ...t, name: editTestName, description: editTestDesc, sampleType: editTestSampleType || undefined, fastingRequired: editTestFasting } : t) }
      : s));
    setEditTestId(null);
    setShowEditCustomInput(false); setEditCustomSampleType("");
  }

  function openEditTest(t: LabTest) {
    setEditTestId(t.id);
    setEditTestName(t.name);
    setEditTestDesc(t.description);
    setEditTestSampleType(t.sampleType ?? "");
    setEditTestFasting(t.fastingRequired ?? false);
    setShowEditCustomInput(false); setEditCustomSampleType("");
  }

  const allSampleTypes = [...DEFAULT_SAMPLE_TYPES, ...customSampleTypes];

  function commitNewCustom() {
    const v = newCustomSampleType.trim();
    if (!v) return;
    if (!customSampleTypes.includes(v)) setCustomSampleTypes(cs => [...cs, v]);
    setNewTestSampleType(v);
    setNewCustomSampleType(""); setShowNewCustomInput(false);
  }

  function commitEditCustom() {
    const v = editCustomSampleType.trim();
    if (!v) return;
    if (!customSampleTypes.includes(v)) setCustomSampleTypes(cs => [...cs, v]);
    setEditTestSampleType(v);
    setEditCustomSampleType(""); setShowEditCustomInput(false);
  }

  function exportCSV() {
    const rows = [["Section", "Test Name", "Description", "Sample Type", "Fasting Required"]];
    sections.forEach(s => s.tests.forEach(t => rows.push([s.name, t.name, t.description, t.sampleType ?? "", t.fastingRequired ? "Yes" : "No"])));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "lab-test-master-list.csv";
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tests…" className="h-8 pl-8 text-xs w-56" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="h-8 text-xs gap-1.5"><FileText className="h-3.5 w-3.5" /> Export CSV</Button>
        </div>
      </div>

      {/* Add section row */}
      <div className="flex gap-2">
        <Input value={newSectionName} onChange={e => setNewSectionName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addSection()}
          placeholder="New section name (e.g. Immunology)…" className="h-8 text-xs flex-1" />
        <Button onClick={addSection} className="h-8 text-xs bg-[#4982CF] text-white gap-1.5 px-3"><Plus className="h-3.5 w-3.5" /> Add Section</Button>
      </div>

      {/* Section list */}
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
                <Input value={editSectionName} onChange={e => setEditSectionName(e.target.value)} className="h-7 text-xs font-bold flex-1" autoFocus
                  onKeyDown={e => e.key === "Enter" && saveEditSection(sec.id)} />
              ) : (
                <button onClick={() => toggleExpand(sec.id)} className="flex items-center gap-2 flex-1 text-left">
                  {sec.expanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                  <span className="text-xs font-black text-slate-700">{sec.name}</span>
                  <span className="text-[10px] text-slate-400">{sec.tests.filter(matchSearch).length} tests</span>
                </button>
              )}
              <div className="flex gap-1 ml-auto">
                {editSectionId === sec.id ? (
                  <>
                    <Button onClick={() => saveEditSection(sec.id)} className="h-6 text-[10px] bg-[#4982CF] text-white px-2">Save</Button>
                    <Button variant="outline" onClick={() => setEditSectionId(null)} className="h-6 text-[10px] px-2">Cancel</Button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setAddTestSectionId(sec.id); setSections(ss => ss.map(s => s.id === sec.id ? { ...s, expanded: true } : s)); }} className="text-[10px] font-bold text-[#4982CF] flex items-center gap-0.5 hover:opacity-80"><Plus className="h-3 w-3" /> Test</button>
                    <button onClick={() => { setEditSectionId(sec.id); setEditSectionName(sec.name); }} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
                    <button onClick={() => setSections(ss => ss.filter(s => s.id !== sec.id))} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button>
                  </>
                )}
              </div>
            </div>

            {sec.expanded && (
              <div>
                {/* Add test inline */}
                {addTestSectionId === sec.id && (
                  <div className="flex flex-col gap-1.5 px-4 py-3 bg-blue-50/40 border-b border-[#4982CF]/20">
                    <div className="flex gap-2">
                      <Input value={newTestName} onChange={e => setNewTestName(e.target.value)} placeholder="Test name…" className="h-7 text-xs flex-1" autoFocus />
                      <Input value={newTestDesc} onChange={e => setNewTestDesc(e.target.value)} placeholder="Description (optional)…" className="h-7 text-xs flex-1" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Sample type selector */}
                      <div className="flex items-center gap-1">
                        <select
                          value={newTestSampleType}
                          onChange={e => setNewTestSampleType(e.target.value)}
                          className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4982CF]"
                        >
                          <option value="">Sample type…</option>
                          {allSampleTypes.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                        {!showNewCustomInput ? (
                          <button onClick={() => setShowNewCustomInput(true)} className="flex items-center gap-0.5 h-7 px-1.5 rounded border border-dashed border-[#4982CF]/40 text-[10px] font-bold text-[#4982CF] hover:bg-[#4982CF]/5">
                            <Plus className="h-3 w-3" /> Custom
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Input value={newCustomSampleType} onChange={e => setNewCustomSampleType(e.target.value)} placeholder="Type name…" className="h-7 text-xs w-32"
                              onKeyDown={e => e.key === "Enter" && commitNewCustom()} autoFocus />
                            <Button onClick={commitNewCustom} className="h-7 text-[10px] bg-[#4982CF] text-white px-2">Add</Button>
                            <Button variant="outline" onClick={() => { setShowNewCustomInput(false); setNewCustomSampleType(""); }} className="h-7 text-[10px] px-2">×</Button>
                          </div>
                        )}
                      </div>
                      {/* Fasting toggle */}
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                        <Switch checked={newTestFasting} onCheckedChange={setNewTestFasting} className="data-[state=checked]:bg-amber-500 scale-90" />
                        <span className={newTestFasting ? "font-semibold text-amber-600" : ""}>Fasting Required</span>
                      </label>
                      <div className="flex gap-1 ml-auto">
                        <Button onClick={() => addTest(sec.id)} className="h-7 text-xs bg-[#4982CF] text-white px-3">Add</Button>
                        <Button variant="outline" onClick={() => { setAddTestSectionId(null); setNewTestName(""); setNewTestDesc(""); setNewTestSampleType(""); setNewTestFasting(false); setShowNewCustomInput(false); }} className="h-7 text-xs px-2">Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Tests */}
                {sec.tests.filter(matchSearch).map((t, ti) => (
                  <div key={t.id} draggable
                    onDragStart={() => { setDragTestSec(sec.id); setDragTestIdx(ti); }}
                    onDragOver={e => { e.preventDefault(); if (dragTestSec === sec.id) setDropTestIdx(ti); }}
                    onDrop={() => {
                      if (dragTestSec === sec.id && dragTestIdx !== null && dragTestIdx !== ti) {
                        setSections(ss => ss.map(s => s.id === sec.id ? { ...s, tests: reorder(s.tests, dragTestIdx, ti) } : s));
                      }
                      setDragTestSec(null); setDragTestIdx(null); setDropTestIdx(null);
                    }}
                    onDragEnd={() => { setDragTestSec(null); setDragTestIdx(null); setDropTestIdx(null); }}
                    className={`flex items-center gap-3 px-4 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 group ${dropTestIdx === ti && dragTestSec === sec.id ? "border-t-2 border-[#4982CF]" : ""}`}>
                    <GripVertical className="h-3.5 w-3.5 text-slate-200 cursor-grab flex-shrink-0" />
                    {editTestId === t.id ? (
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex gap-2">
                          <Input value={editTestName} onChange={e => setEditTestName(e.target.value)} className="h-6 text-xs flex-1" autoFocus />
                          <Input value={editTestDesc} onChange={e => setEditTestDesc(e.target.value)} placeholder="Description…" className="h-6 text-xs flex-1" />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1">
                            <select value={editTestSampleType} onChange={e => setEditTestSampleType(e.target.value)}
                              className="h-6 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4982CF]">
                              <option value="">Sample type…</option>
                              {allSampleTypes.map(st => <option key={st} value={st}>{st}</option>)}
                            </select>
                            {!showEditCustomInput ? (
                              <button onClick={() => setShowEditCustomInput(true)} className="flex items-center gap-0.5 h-6 px-1.5 rounded border border-dashed border-[#4982CF]/40 text-[10px] font-bold text-[#4982CF] hover:bg-[#4982CF]/5">
                                <Plus className="h-3 w-3" /> Custom
                              </button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Input value={editCustomSampleType} onChange={e => setEditCustomSampleType(e.target.value)} placeholder="Type name…" className="h-6 text-xs w-28"
                                  onKeyDown={e => e.key === "Enter" && commitEditCustom()} autoFocus />
                                <Button onClick={commitEditCustom} className="h-6 text-[10px] bg-[#4982CF] text-white px-1.5">Add</Button>
                                <Button variant="outline" onClick={() => { setShowEditCustomInput(false); setEditCustomSampleType(""); }} className="h-6 text-[10px] px-1.5">×</Button>
                              </div>
                            )}
                          </div>
                          <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer select-none">
                            <Switch checked={editTestFasting} onCheckedChange={setEditTestFasting} className="data-[state=checked]:bg-amber-500 scale-75" />
                            <span className={editTestFasting ? "font-semibold text-amber-600" : ""}>Fasting</span>
                          </label>
                          <Button onClick={() => saveEditTest(sec.id, t.id)} className="h-6 text-[10px] bg-[#4982CF] text-white px-2 ml-auto">Save</Button>
                          <Button variant="outline" onClick={() => setEditTestId(null)} className="h-6 text-[10px] px-2">×</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-slate-700">{t.name}</span>
                            {t.sampleType && (
                              <span className="inline-flex items-center rounded-full border border-[#4982CF]/30 bg-[#4982CF]/10 px-1.5 py-0 text-[10px] font-medium text-[#4982CF]">
                                {t.sampleType}
                              </span>
                            )}
                            {t.fastingRequired && (
                              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-semibold text-amber-700">
                                Fasting
                              </span>
                            )}
                          </div>
                          {t.description && <p className="text-[10px] text-slate-400 mt-0.5">{t.description}</p>}
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                          <button onClick={() => openEditTest(t)} className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
                          <button onClick={() => setSections(ss => ss.map(s => s.id === sec.id ? { ...s, tests: s.tests.filter(x => x.id !== t.id) } : s))} className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {sec.tests.filter(matchSearch).length === 0 && (
                  <p className="text-center text-xs text-slate-300 py-4">{search ? "No matching tests" : "No tests — click + Test above"}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Lab Providers ────────────────────────────────────────────────────────────

function LabProviders({
  providers, setProviders, sections,
}: {
  providers: LabProvider[];
  setProviders: (fn: (prev: LabProvider[]) => LabProvider[]) => void;
  sections: LabSection[];
}) {
  const [step, setStep]       = useState<1 | 2>(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]   = useState<string | null>(null);
  const [form, setForm]       = useState({ name: "", contact: "" });
  const [selected, setSelected] = useState<string[]>([]);
  const [pricing, setPricing]   = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandProviderId, setExpandProviderId] = useState<string | null>(null);
  const [importProviderId, setImportProviderId] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<{ matched: number; unmatched: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const allTests = sections.flatMap(s => s.tests);

  function openNew() {
    setForm({ name: "", contact: "" }); setSelected([]); setPricing({}); setEditId(null); setStep(1); setShowModal(true);
  }

  function openEdit(p: LabProvider) {
    setForm({ name: p.name, contact: p.contact }); setSelected([...p.selectedTests]); setPricing({ ...p.pricing }); setEditId(p.id); setStep(1); setShowModal(true);
  }

  function saveProvider() {
    if (editId) {
      setProviders(ps => ps.map(p => p.id === editId ? { ...p, name: form.name, contact: form.contact, selectedTests: selected, pricing } : p));
    } else {
      setProviders(ps => [...ps, { id: uid(), name: form.name.trim(), contact: form.contact.trim(), active: true, selectedTests: selected, pricing }]);
    }
    setShowModal(false);
  }

  function toggleTest(id: string) {
    setSelected(ss => ss.includes(id) ? ss.filter(x => x !== id) : [...ss, id]);
  }

  function importPricing(providerId: string) {
    const prov = providers.find(p => p.id === providerId);
    if (!prov) return;
    const lines = importText.trim().split("\n").map(l => l.split(",").map(s => s.trim().replace(/^"|"$/g, "")));
    const newPricing = { ...prov.pricing };
    const matched: string[] = [];
    const unmatched: string[] = [];
    lines.forEach(([name, price]) => {
      const test = allTests.find(t => t.name.toLowerCase() === name?.toLowerCase());
      if (test && price) { newPricing[test.id] = price; matched.push(name); }
      else if (name) unmatched.push(name);
    });
    setProviders(ps => ps.map(p => p.id === providerId ? { ...p, pricing: newPricing } : p));
    setImportResult({ matched: matched.length, unmatched });
    setImportText("");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} className="bg-[#4982CF] hover:bg-[#3b6bb5] text-white h-8 text-xs gap-1.5"><Plus className="h-3.5 w-3.5" /> New Provider</Button>
      </div>

      {/* Provider list */}
      <div className="space-y-3">
        {providers.map(p => {
          const testCount = p.selectedTests.length;
          const pricedCount = Object.keys(p.pricing).length;
          const isExpanded = expandProviderId === p.id;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-xl bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
                  <FlaskConical className="h-4.5 w-4.5 text-[#4982CF]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.contact || "No contact"} · {testCount} tests · {pricedCount} priced</p>
                </div>
                <Switch checked={p.active} onCheckedChange={v => setProviders(ps => ps.map(x => x.id === p.id ? { ...x, active: v } : x))} className="data-[state=checked]:bg-[#4982CF]" />
                <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => setExpandProviderId(isExpanded ? null : p.id)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100">
                  {/* Import section */}
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex-1">Test Pricing</p>
                    <button onClick={() => setImportProviderId(importProviderId === p.id ? null : p.id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#4982CF] hover:opacity-80"><Upload className="h-3 w-3" /> Import Pricing</button>
                  </div>
                  {importProviderId === p.id && (
                    <div className="px-4 py-3 bg-blue-50/40 border-b border-[#4982CF]/20 space-y-2">
                      <p className="text-[10px] text-slate-500">Paste CSV rows: <span className="font-mono">Test Name, Price</span> (one per line)</p>
                      <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={4}
                        className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#4982CF] resize-none" />
                      <div className="flex items-center gap-2">
                        <Button onClick={() => importPricing(p.id)} className="h-7 text-xs bg-[#4982CF] text-white px-3">Apply</Button>
                        <Button variant="outline" onClick={() => { setImportProviderId(null); setImportResult(null); }} className="h-7 text-xs px-3">Cancel</Button>
                        {importResult && (
                          <span className="text-[10px] text-slate-500">
                            {importResult.matched} matched{importResult.unmatched.length > 0 && ` · ${importResult.unmatched.length} unmatched: ${importResult.unmatched.join(", ")}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Test list */}
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-slate-50 border-b border-slate-100 sticky top-0">
                        <th className="text-left px-4 py-2 font-black text-[10px] uppercase tracking-widest text-slate-400">Test</th>
                        <th className="text-right px-4 py-2 font-black text-[10px] uppercase tracking-widest text-slate-400 w-32">Price (PKR)</th>
                      </tr></thead>
                      <tbody>
                        {sections.flatMap(s => s.tests.filter(t => p.selectedTests.includes(t.id)).map(t => (
                          <tr key={t.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-4 py-1.5 text-slate-700">{t.name}</td>
                            <td className="px-4 py-1.5 text-right">
                              <Input value={p.pricing[t.id] ?? ""} onChange={e => setProviders(ps => ps.map(x => x.id === p.id ? { ...x, pricing: { ...x.pricing, [t.id]: e.target.value } } : x))}
                                placeholder="0.00" className="h-6 text-xs text-right w-28 ml-auto" />
                            </td>
                          </tr>
                        )))}
                        {p.selectedTests.length === 0 && <tr><td colSpan={2} className="px-4 py-4 text-center text-slate-300 text-xs">No tests selected — edit provider to select tests</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!providers.length && (
          <div className="text-center py-16 text-slate-300">
            <FlaskConical className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm font-semibold">No lab providers yet</p>
            <p className="text-xs mt-1">Add a provider to configure test pricing</p>
          </div>
        )}
      </div>

      {/* Modal: 2-step */}
      <Dialog open={showModal} onOpenChange={v => !v && setShowModal(false)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editId ? "Edit Provider" : "New Lab Provider"}
              <span className="ml-auto text-xs font-normal text-slate-400">Step {step} of 2</span>
            </DialogTitle>
          </DialogHeader>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            {[1,2].map(s => (
              <div key={s} className={`flex items-center gap-2 ${s < 2 ? "flex-1" : ""}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black ${step >= s ? "bg-[#4982CF] text-white" : "bg-slate-100 text-slate-400"}`}>{s}</div>
                <span className={`text-xs font-medium ${step === s ? "text-[#4982CF]" : "text-slate-400"}`}>{s === 1 ? "Provider Details" : "Test Selection & Pricing"}</span>
                {s < 2 && <div className="flex-1 h-px bg-slate-200" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600">Provider Name <span className="text-red-400">*</span></label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Hashmani Laboratories" className="h-9 text-sm mt-1" autoFocus />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Contact Info</label>
                <Input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Phone / email" className="h-9 text-sm mt-1" />
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
                <p className="text-xs text-slate-500">{selected.length} of {allTests.length} tests selected</p>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(allTests.map(t => t.id))} className="text-xs text-[#4982CF] font-bold hover:opacity-80">Select All</button>
                  <button onClick={() => setSelected([])} className="text-xs text-slate-400 font-bold hover:opacity-80">Clear</button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1 border border-slate-100 rounded-xl">
                {sections.map(sec => (
                  <div key={sec.id}>
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{sec.name}</p>
                    </div>
                    {sec.tests.map(t => (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggleTest(t.id)} className="accent-[#4982CF]" />
                        <span className="flex-1 text-xs text-slate-700">{t.name}</span>
                        {selected.includes(t.id) && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">PKR</span>
                            <Input value={pricing[t.id] ?? ""} onChange={e => setPricing(p => ({ ...p, [t.id]: e.target.value }))}
                              placeholder="0.00" className="h-6 w-24 text-xs text-right" />
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
                  <Button onClick={saveProvider} className="bg-[#4982CF] text-white h-9 text-sm gap-1.5"><Save className="h-3.5 w-3.5" /> Save Provider</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-rose-600"><AlertCircle className="h-5 w-5" />Remove Provider</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Remove <strong>{providers.find(p => p.id === deleteId)?.name}</strong>? Pricing data will be lost.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="h-8 text-sm">Cancel</Button>
            <Button onClick={() => { setProviders(ps => ps.filter(p => p.id !== deleteId)); setDeleteId(null); }} className="bg-rose-500 text-white h-8 text-sm">Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── LabCatalogModule ─────────────────────────────────────────────────────────

type LabView = "master" | "providers";

interface LabCatalogModuleProps {
  sections: LabSection[];
  setSections: (fn: (prev: LabSection[]) => LabSection[]) => void;
  providers: LabProvider[];
  setProviders: (fn: (prev: LabProvider[]) => LabProvider[]) => void;
  initialView?: LabView;
}

export { SEED_SECTIONS, SEED_PROVIDERS };

export function LabCatalogModule({ sections, setSections, providers, setProviders, initialView }: LabCatalogModuleProps) {
  const [view, setView] = useState<LabView>(initialView ?? "master");

  const NAV: { key: LabView; label: string; sub: string }[] = [
    { key: "master",    label: "Lab Test Master List", sub: "Manage sections and test names used across all providers." },
    { key: "providers", label: "Lab Providers",        sub: "Add providers, select their tests, and set per-test pricing." },
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
      {view === "master"    && <LabMasterList sections={sections} setSections={setSections} />}
      {view === "providers" && <LabProviders  providers={providers} setProviders={setProviders} sections={sections} />}
    </div>
  );
}
