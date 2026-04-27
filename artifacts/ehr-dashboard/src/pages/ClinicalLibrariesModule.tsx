import { useState } from "react";
import {
  Plus, Trash2, Edit2, Save, X, GripVertical, Search, Star,
  ChevronDown, CheckCircle2, AlertCircle, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function uid() { return Math.random().toString(36).slice(2, 10); }

// ─── Shared drag helpers ──────────────────────────────────────────────────────

function reorder<T>(arr: T[], from: number, to: number) {
  const next = [...arr];
  const [mv] = next.splice(from, 1);
  next.splice(to, 0, mv);
  return next;
}

// ─── ① Chief Complaint Library ───────────────────────────────────────────────

const SPECIALTIES = ["General", "Cardiology", "Respiratory", "Neurology", "Orthopedics", "Gastroenterology", "Endocrine", "ENT", "Ophthalmology", "Dermatology", "Urology", "Pediatrics"];

interface Complaint { id: string; name: string; specialties: string[]; active: boolean; }

const SEED_COMPLAINTS: Complaint[] = [
  { id: "c1", name: "Chest Pain",           specialties: ["General","Cardiology"], active: true  },
  { id: "c2", name: "Shortness of Breath",  specialties: ["General","Respiratory","Cardiology"], active: true  },
  { id: "c3", name: "Headache",             specialties: ["General","Neurology"], active: true  },
  { id: "c4", name: "Abdominal Pain",       specialties: ["General","Gastroenterology"], active: true  },
  { id: "c5", name: "Fever",               specialties: ["General","Pediatrics"], active: true  },
  { id: "c6", name: "Cough",               specialties: ["General","Respiratory"], active: true  },
  { id: "c7", name: "Back Pain",           specialties: ["General","Orthopedics"], active: true  },
  { id: "c8", name: "Dizziness",           specialties: ["General","Neurology","ENT"], active: true  },
  { id: "c9", name: "Palpitations",        specialties: ["Cardiology"], active: true  },
  { id: "c10", name: "Joint Pain",         specialties: ["Orthopedics","General"], active: false },
];

function ChiefComplaintLibrary() {
  const [complaints, setComplaints] = useState<Complaint[]>(SEED_COMPLAINTS);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ name: string; specialties: string[] }>({ name: "", specialties: [] });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = complaints.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  function startAdd() { setDraft({ name: "", specialties: [] }); setAdding(true); setEditingId(null); }
  function startEdit(c: Complaint) { setDraft({ name: c.name, specialties: c.specialties }); setEditingId(c.id); setAdding(false); }
  function cancelEdit() { setAdding(false); setEditingId(null); }

  function saveItem() {
    if (!draft.name.trim()) return;
    if (adding) {
      setComplaints(cs => [...cs, { id: uid(), name: draft.name.trim(), specialties: draft.specialties, active: true }]);
      setAdding(false);
    } else if (editingId) {
      setComplaints(cs => cs.map(c => c.id === editingId ? { ...c, ...draft } : c));
      setEditingId(null);
    }
  }

  function toggleSpec(s: string) {
    setDraft(d => ({ ...d, specialties: d.specialties.includes(s) ? d.specialties.filter(x => x !== s) : [...d.specialties, s] }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search complaints…" className="h-8 pl-8 text-xs w-56" />
        </div>
        <Button onClick={startAdd} className="bg-[#4982CF] hover:bg-[#3b6bb5] text-white h-8 text-xs gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Complaint</Button>
      </div>

      {/* Inline add/edit row */}
      {(adding || editingId) && (
        <div className="bg-blue-50 border border-[#4982CF]/30 rounded-xl p-3 space-y-3">
          <Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            placeholder="Complaint name…" className="h-8 text-sm font-semibold" autoFocus />
          <div>
            <p className="text-[10px] font-bold text-slate-500 mb-1.5">Specialties</p>
            <div className="flex flex-wrap gap-1.5">
              {SPECIALTIES.map(s => (
                <button key={s} onClick={() => toggleSpec(s)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${draft.specialties.includes(s) ? "bg-[#4982CF] text-white border-[#4982CF]" : "bg-white text-slate-500 border-slate-200 hover:border-[#4982CF]"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveItem} className="h-7 text-xs bg-[#4982CF] hover:bg-[#3b6bb5] text-white gap-1"><Save className="h-3 w-3" /> Save</Button>
            <Button variant="outline" onClick={cancelEdit} className="h-7 text-xs">Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Complaint</th>
              <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Specialties</th>
              <th className="text-center px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Active</th>
              <th className="w-16 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 group">
                <td className="px-4 py-2.5 font-semibold text-slate-800">{c.name}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {c.specialties.map(s => <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0 text-slate-500 border-slate-200">{s}</Badge>)}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <Switch checked={c.active} onCheckedChange={v => setComplaints(cs => cs.map(x => x.id === c.id ? { ...x, active: v } : x))} className="data-[state=checked]:bg-[#4982CF]" />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(c)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteId(c.id)} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-rose-600"><AlertCircle className="h-5 w-5" />Delete Complaint</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Remove <strong>{complaints.find(c => c.id === deleteId)?.name}</strong>?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="h-8 text-sm">Cancel</Button>
            <Button onClick={() => { setComplaints(cs => cs.filter(c => c.id !== deleteId)); setDeleteId(null); }} className="bg-rose-500 hover:bg-rose-600 text-white h-8 text-sm">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ② ICD-10 Catalogue ──────────────────────────────────────────────────────

interface Icd10Code { id: string; code: string; description: string; bundleId: string; favourite: boolean; }
interface Icd10Bundle { id: string; name: string; }

const SEED_BUNDLES: Icd10Bundle[] = [
  { id: "b0", name: "General" },
  { id: "b1", name: "Cardiology Bundle" },
  { id: "b2", name: "Respiratory Bundle" },
  { id: "b3", name: "Endocrine Bundle" },
];

const SEED_CODES: Icd10Code[] = [
  { id: "i1",  code: "I10",   description: "Essential (primary) hypertension",               bundleId: "b1", favourite: true  },
  { id: "i2",  code: "I21.9", description: "Acute myocardial infarction, unspecified",        bundleId: "b1", favourite: false },
  { id: "i3",  code: "I48.0", description: "Paroxysmal atrial fibrillation",                  bundleId: "b1", favourite: false },
  { id: "i4",  code: "J18.9", description: "Pneumonia, unspecified organism",                 bundleId: "b2", favourite: true  },
  { id: "i5",  code: "J45.9", description: "Asthma, unspecified",                             bundleId: "b2", favourite: false },
  { id: "i6",  code: "J44.1", description: "Chronic obstructive pulmonary disease with AE",  bundleId: "b2", favourite: false },
  { id: "i7",  code: "E11.9", description: "Type 2 diabetes mellitus without complications",  bundleId: "b3", favourite: true  },
  { id: "i8",  code: "E05.9", description: "Thyrotoxicosis, unspecified",                     bundleId: "b3", favourite: false },
  { id: "i9",  code: "E78.5", description: "Hyperlipidaemia, unspecified",                    bundleId: "b3", favourite: false },
  { id: "i10", code: "R51",   description: "Headache",                                        bundleId: "b0", favourite: false },
  { id: "i11", code: "R05",   description: "Cough",                                           bundleId: "b0", favourite: false },
  { id: "i12", code: "R07.9", description: "Chest pain, unspecified",                         bundleId: "b0", favourite: true  },
];

function Icd10Catalogue() {
  const [codes, setCodes]     = useState<Icd10Code[]>(SEED_CODES);
  const [bundles, setBundles] = useState<Icd10Bundle[]>(SEED_BUNDLES);
  const [search, setSearch]   = useState("");
  const [selectedBundle, setSelectedBundle] = useState("all");
  const [addCode, setAddCode] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addBundle, setAddBundle] = useState("b0");
  const [editBundleId, setEditBundleId] = useState<string | null>(null);
  const [editBundleName, setEditBundleName] = useState("");
  const [newBundleName, setNewBundleName] = useState("");
  const [showBundles, setShowBundles] = useState(false);

  const filtered = codes.filter(c => {
    const matchSearch = !search || c.code.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchBundle = selectedBundle === "all" || c.bundleId === selectedBundle;
    return matchSearch && matchBundle;
  }).sort((a, b) => (b.favourite ? 1 : 0) - (a.favourite ? 1 : 0));

  function addCustomCode() {
    if (!addCode.trim() || !addDesc.trim()) return;
    setCodes(cs => [...cs, { id: uid(), code: addCode.trim().toUpperCase(), description: addDesc.trim(), bundleId: addBundle, favourite: false }]);
    setAddCode(""); setAddDesc("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ICD-10…" className="h-8 pl-8 text-xs w-56" />
          </div>
          <select value={selectedBundle} onChange={e => setSelectedBundle(e.target.value)}
            className="h-8 text-xs border border-slate-200 rounded-lg px-2 focus:outline-none text-slate-700 bg-white">
            <option value="all">All Bundles</option>
            {bundles.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <Button variant="outline" onClick={() => setShowBundles(s => !s)} className="h-8 text-xs gap-1.5">Manage Bundles</Button>
      </div>

      {/* Bundle manager */}
      {showBundles && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bundles</p>
          {bundles.map(b => (
            <div key={b.id} className="flex items-center gap-2">
              {editBundleId === b.id ? (
                <>
                  <Input value={editBundleName} onChange={e => setEditBundleName(e.target.value)} className="h-7 text-xs flex-1" autoFocus />
                  <Button onClick={() => { setBundles(bs => bs.map(x => x.id === b.id ? { ...x, name: editBundleName } : x)); setEditBundleId(null); }} className="h-7 text-xs bg-[#4982CF] text-white px-2">Save</Button>
                  <Button variant="outline" onClick={() => setEditBundleId(null)} className="h-7 text-xs px-2">Cancel</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-xs font-semibold text-slate-700">{b.name}</span>
                  <span className="text-[10px] text-slate-400">{codes.filter(c => c.bundleId === b.id).length} codes</span>
                  <button onClick={() => { setEditBundleId(b.id); setEditBundleName(b.name); }} className="p-1 rounded hover:bg-slate-200 text-slate-400"><Edit2 className="h-3 w-3" /></button>
                  {b.id !== "b0" && <button onClick={() => { setBundles(bs => bs.filter(x => x.id !== b.id)); setCodes(cs => cs.map(c => c.bundleId === b.id ? { ...c, bundleId: "b0" } : c)); }} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button>}
                </>
              )}
            </div>
          ))}
          <div className="flex gap-2 mt-2 pt-2 border-t border-slate-200">
            <Input value={newBundleName} onChange={e => setNewBundleName(e.target.value)} placeholder="New bundle name…" className="h-7 text-xs flex-1" />
            <Button onClick={() => { if (newBundleName.trim()) { setBundles(bs => [...bs, { id: uid(), name: newBundleName.trim() }]); setNewBundleName(""); } }} className="h-7 text-xs bg-[#4982CF] text-white px-3">Add</Button>
          </div>
        </div>
      )}

      {/* Code table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="w-8 px-3 py-3"></th>
              <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400 w-24">Code</th>
              <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Description</th>
              <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Bundle</th>
              <th className="w-8 px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {/* Inline add row */}
            <tr className="border-b border-[#4982CF]/20 bg-blue-50/40">
              <td className="px-3 py-2"><Plus className="h-3.5 w-3.5 text-slate-400" /></td>
              <td className="px-4 py-2"><Input value={addCode} onChange={e => setAddCode(e.target.value)} placeholder="A00.0" className="h-7 text-xs font-mono" /></td>
              <td className="px-4 py-2"><Input value={addDesc} onChange={e => setAddDesc(e.target.value)} placeholder="Description…" className="h-7 text-xs" onKeyDown={e => e.key === "Enter" && addCustomCode()} /></td>
              <td className="px-4 py-2">
                <select value={addBundle} onChange={e => setAddBundle(e.target.value)} className="h-7 text-xs border border-slate-200 rounded px-1.5 focus:outline-none text-slate-700 w-full">
                  {bundles.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </td>
              <td className="px-3 py-2"><button onClick={addCustomCode} className="text-[10px] font-bold text-[#4982CF] hover:text-[#3b6bb5] px-2 py-1 rounded bg-[#4982CF]/10">Add</button></td>
            </tr>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 group">
                <td className="px-3 py-2.5">
                  <button onClick={() => setCodes(cs => cs.map(x => x.id === c.id ? { ...x, favourite: !x.favourite } : x))}
                    className="text-slate-300 hover:text-amber-400 transition-colors">
                    <Star className={`h-3.5 w-3.5 ${c.favourite ? "text-amber-400 fill-amber-400" : ""}`} />
                  </button>
                </td>
                <td className="px-4 py-2.5 font-mono font-bold text-[#4982CF]">{c.code}</td>
                <td className="px-4 py-2.5 text-slate-700">{c.description}</td>
                <td className="px-4 py-2.5">
                  <select value={c.bundleId} onChange={e => setCodes(cs => cs.map(x => x.id === c.id ? { ...x, bundleId: e.target.value } : x))}
                    className="text-[10px] border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none text-slate-600">
                    {bundles.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setCodes(cs => cs.filter(x => x.id !== c.id))} className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ③ POC Test Configuration ────────────────────────────────────────────────

type PocResultType = "Positive/Negative" | "Numeric";
interface PocTest { id: string; name: string; resultType: PocResultType; unit: string; normalMin: string; normalMax: string; active: boolean; }

const SEED_POC: PocTest[] = [
  { id: "p1", name: "Blood Glucose",      resultType: "Numeric",           unit: "mg/dL", normalMin: "70", normalMax: "100", active: true  },
  { id: "p2", name: "Urine Protein",      resultType: "Positive/Negative", unit: "",      normalMin: "",   normalMax: "",   active: true  },
  { id: "p3", name: "Urine Glucose",      resultType: "Positive/Negative", unit: "",      normalMin: "",   normalMax: "",   active: true  },
  { id: "p4", name: "Malaria (RDT)",      resultType: "Positive/Negative", unit: "",      normalMin: "",   normalMax: "",   active: true  },
  { id: "p5", name: "Haemoglobin",        resultType: "Numeric",           unit: "g/dL",  normalMin: "12", normalMax: "17", active: true  },
  { id: "p6", name: "INR",               resultType: "Numeric",           unit: "",      normalMin: "0.8",normalMax: "1.2",active: false },
];

const BLANK_POC = (): PocTest => ({ id: uid(), name: "", resultType: "Positive/Negative", unit: "", normalMin: "", normalMax: "", active: true });

function PocTestConfig() {
  const [tests, setTests] = useState<PocTest[]>(SEED_POC);
  const [editId, setEditId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<PocTest>(BLANK_POC());
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  function startAdd() { setDraft(BLANK_POC()); setAdding(true); setEditId(null); }
  function startEdit(t: PocTest) { setDraft({ ...t }); setEditId(t.id); setAdding(false); }
  function cancel() { setAdding(false); setEditId(null); }
  function save() {
    if (!draft.name.trim()) return;
    if (adding) { setTests(ts => [...ts, { ...draft, id: uid() }]); setAdding(false); }
    else { setTests(ts => ts.map(t => t.id === editId ? draft : t)); setEditId(null); }
  }

  const EDIT_ROW = (
    <div className="bg-blue-50/60 border border-[#4982CF]/30 rounded-xl p-3 space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-500">Test Name</label>
          <Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Blood Glucose" className="h-8 text-xs mt-1" autoFocus />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500">Result Type</label>
          <select value={draft.resultType} onChange={e => setDraft(d => ({ ...d, resultType: e.target.value as PocResultType }))}
            className="w-full h-8 text-xs border border-slate-200 rounded-lg px-2 focus:outline-none mt-1 bg-white">
            <option>Positive/Negative</option>
            <option>Numeric</option>
          </select>
        </div>
        {draft.resultType === "Numeric" && (
          <>
            <div>
              <label className="text-[10px] font-bold text-slate-500">Unit</label>
              <Input value={draft.unit} onChange={e => setDraft(d => ({ ...d, unit: e.target.value }))} placeholder="e.g. mg/dL" className="h-8 text-xs mt-1" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500">Normal Min</label>
                <Input value={draft.normalMin} onChange={e => setDraft(d => ({ ...d, normalMin: e.target.value }))} placeholder="70" className="h-8 text-xs mt-1" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500">Normal Max</label>
                <Input value={draft.normalMax} onChange={e => setDraft(d => ({ ...d, normalMax: e.target.value }))} placeholder="100" className="h-8 text-xs mt-1" />
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={save} className="h-7 text-xs bg-[#4982CF] text-white gap-1"><Save className="h-3 w-3" /> Save</Button>
        <Button variant="outline" onClick={cancel} className="h-7 text-xs">Cancel</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={startAdd} className="bg-[#4982CF] hover:bg-[#3b6bb5] text-white h-8 text-xs gap-1.5"><Plus className="h-3.5 w-3.5" /> Add POC Test</Button>
      </div>
      {adding && EDIT_ROW}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="w-8 px-3 py-3"></th>
              <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Test Name</th>
              <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Result Type</th>
              <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Unit / Range</th>
              <th className="text-center px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Active</th>
              <th className="w-16 px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t, i) => (
              editId === t.id ? (
                <tr key={t.id}><td colSpan={6} className="px-4 py-2">{EDIT_ROW}</td></tr>
              ) : (
                <tr key={t.id} draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={e => { e.preventDefault(); setDropIdx(i); }}
                  onDrop={() => { if (dragIdx !== null && dragIdx !== i) { setTests(ts => reorder(ts, dragIdx, i)); } setDragIdx(null); setDropIdx(null); }}
                  onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
                  className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 group ${dropIdx === i && dragIdx !== i ? "border-t-2 border-[#4982CF]" : ""}`}>
                  <td className="px-3 py-2.5"><GripVertical className="h-3.5 w-3.5 text-slate-300 cursor-grab" /></td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{t.name}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={`text-[9px] ${t.resultType === "Numeric" ? "border-blue-200 text-blue-600" : "border-slate-200 text-slate-500"}`}>{t.resultType}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {t.resultType === "Numeric" ? `${t.unit}${t.normalMin || t.normalMax ? ` · ${t.normalMin}–${t.normalMax}` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center"><Switch checked={t.active} onCheckedChange={v => setTests(ts => ts.map(x => x.id === t.id ? { ...x, active: v } : x))} className="data-[state=checked]:bg-[#4982CF]" /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(t)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
                      <button onClick={() => setTests(ts => ts.filter(x => x.id !== t.id))} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ④ ROS System Configuration ──────────────────────────────────────────────

interface RosSystem { id: string; name: string; abbr: string; active: boolean; }

const SEED_ROS: RosSystem[] = [
  { id: "r1",  name: "General",              abbr: "GEN",   active: true  },
  { id: "r2",  name: "Head, Eyes, Ears, Nose & Throat", abbr: "HEENT", active: true  },
  { id: "r3",  name: "Cardiovascular System",abbr: "CVS",   active: true  },
  { id: "r4",  name: "Respiratory System",   abbr: "RESP",  active: true  },
  { id: "r5",  name: "Gastrointestinal",     abbr: "GIT",   active: true  },
  { id: "r6",  name: "Genitourinary",        abbr: "GU",    active: true  },
  { id: "r7",  name: "Musculoskeletal",      abbr: "MSK",   active: true  },
  { id: "r8",  name: "Neurological",         abbr: "NEURO", active: true  },
  { id: "r9",  name: "Psychiatric",          abbr: "PSY",   active: true  },
  { id: "r10", name: "Integumentary (Skin)", abbr: "SKIN",  active: true  },
  { id: "r11", name: "Endocrine",            abbr: "ENDO",  active: false },
  { id: "r12", name: "Haematologic/Lymphatic",abbr: "HAEM", active: true  },
  { id: "r13", name: "Allergic / Immunologic",abbr: "ALLG", active: false },
];

function autoAbbr(name: string) {
  const words = name.trim().split(/\s+/);
  return words.slice(0, 4).map(w => w[0] || "").join("").toUpperCase().slice(0, 6);
}

function RosConfig() {
  const [systems, setSystems] = useState<RosSystem[]>(SEED_ROS);
  const [adding, setAdding]   = useState(false);
  const [draft, setDraft]     = useState<{ name: string; abbr: string }>({ name: "", abbr: "" });
  const [editId, setEditId]   = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  function startAdd() { setDraft({ name: "", abbr: "" }); setAdding(true); setEditId(null); }
  function saveAdd() {
    if (!draft.name.trim()) return;
    const abbr = draft.abbr.trim() || autoAbbr(draft.name);
    setSystems(ss => [...ss, { id: uid(), name: draft.name.trim(), abbr, active: true }]);
    setAdding(false);
  }
  function saveEdit(id: string) {
    const abbr = draft.abbr.trim() || autoAbbr(draft.name);
    setSystems(ss => ss.map(s => s.id === id ? { ...s, name: draft.name.trim(), abbr } : s));
    setEditId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={startAdd} className="bg-[#4982CF] hover:bg-[#3b6bb5] text-white h-8 text-xs gap-1.5"><Plus className="h-3.5 w-3.5" /> Add System</Button>
      </div>

      {adding && (
        <div className="bg-blue-50/60 border border-[#4982CF]/30 rounded-xl p-3 flex items-center gap-3">
          <Input value={draft.name} onChange={e => { const n = e.target.value; setDraft(d => ({ name: n, abbr: d.abbr || autoAbbr(n) })); }} placeholder="System name…" className="h-8 text-xs flex-1" autoFocus />
          <Input value={draft.abbr} onChange={e => setDraft(d => ({ ...d, abbr: e.target.value.slice(0, 6).toUpperCase() }))} placeholder="ABBR" className="h-8 text-xs w-24 font-mono" />
          <Button onClick={saveAdd} className="h-8 text-xs bg-[#4982CF] text-white px-3">Save</Button>
          <Button variant="outline" onClick={() => setAdding(false)} className="h-8 text-xs px-3">Cancel</Button>
        </div>
      )}

      <div className="space-y-1.5">
        {systems.map((s, i) => (
          <div key={s.id} draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={e => { e.preventDefault(); setDropIdx(i); }}
            onDrop={() => { if (dragIdx !== null && dragIdx !== i) setSystems(ss => reorder(ss, dragIdx, i)); setDragIdx(null); setDropIdx(null); }}
            onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
            className={`flex items-center gap-3 bg-white border rounded-xl px-3 py-2 shadow-sm transition-all group ${dropIdx === i && dragIdx !== i ? "border-[#4982CF] border-dashed" : "border-slate-100"}`}>
            <GripVertical className="h-4 w-4 text-slate-300 cursor-grab flex-shrink-0" />
            {editId === s.id ? (
              <>
                <Input value={draft.name} onChange={e => { const n = e.target.value; setDraft(d => ({ name: n, abbr: d.abbr || autoAbbr(n) })); }} className="h-7 text-xs flex-1" autoFocus />
                <Input value={draft.abbr} onChange={e => setDraft(d => ({ ...d, abbr: e.target.value.slice(0, 6).toUpperCase() }))} className="h-7 text-xs w-20 font-mono" />
                <Button onClick={() => saveEdit(s.id)} className="h-7 text-xs bg-[#4982CF] text-white px-2">Save</Button>
                <Button variant="outline" onClick={() => setEditId(null)} className="h-7 text-xs px-2">Cancel</Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-xs font-semibold text-slate-800">{s.name}</span>
                <span className="font-mono text-[10px] font-bold text-[#4982CF] bg-[#4982CF]/8 px-2 py-0.5 rounded">{s.abbr}</span>
                <Switch checked={s.active} onCheckedChange={v => setSystems(ss => ss.map(x => x.id === s.id ? { ...x, active: v } : x))} className="data-[state=checked]:bg-[#4982CF]" />
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setDraft({ name: s.name, abbr: s.abbr }); setEditId(s.id); }} className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
                  <button onClick={() => setSystems(ss => ss.filter(x => x.id !== s.id))} className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ⑤ Allergy Management ────────────────────────────────────────────────────

type AllergenType = "Drug" | "Food" | "Environmental" | "Other";
interface Allergen { id: string; name: string; type: AllergenType; }
interface SimpleItem { id: string; name: string; }

function SimpleList({ items, setItems, placeholder }: { items: SimpleItem[]; setItems: (fn: (prev: SimpleItem[]) => SimpleItem[]) => void; placeholder: string; }) {
  const [draft, setDraft] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder} className="h-8 text-xs flex-1"
          onKeyDown={e => { if (e.key === "Enter" && draft.trim()) { setItems(i => [...i, { id: uid(), name: draft.trim() }]); setDraft(""); } }} />
        <Button onClick={() => { if (draft.trim()) { setItems(i => [...i, { id: uid(), name: draft.trim() }]); setDraft(""); } }} className="h-8 text-xs bg-[#4982CF] text-white px-3">Add</Button>
      </div>
      <div className="space-y-1">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-1.5 group">
            {editId === item.id ? (
              <>
                <Input value={editVal} onChange={e => setEditVal(e.target.value)} className="h-6 text-xs flex-1" autoFocus />
                <button onClick={() => { setItems(i => i.map(x => x.id === item.id ? { ...x, name: editVal } : x)); setEditId(null); }} className="p-0.5 text-[#4982CF]"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => setEditId(null)} className="p-0.5 text-slate-400"><X className="h-3.5 w-3.5" /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-xs text-slate-700">{item.name}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditId(item.id); setEditVal(item.name); }} className="p-0.5 text-slate-300 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
                  <button onClick={() => setItems(i => i.filter(x => x.id !== item.id))} className="p-0.5 text-slate-300 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AllergyManagement() {
  const [allergenTab, setAllergenTab] = useState<"allergens" | "reactions" | "onset">("allergens");
  const [allergens, setAllergens] = useState<Allergen[]>([
    { id: "a1", name: "Penicillin",   type: "Drug" },
    { id: "a2", name: "Amoxicillin",  type: "Drug" },
    { id: "a3", name: "Peanuts",      type: "Food" },
    { id: "a4", name: "Shellfish",    type: "Food" },
    { id: "a5", name: "Dust Mites",   type: "Environmental" },
    { id: "a6", name: "Pollen",       type: "Environmental" },
  ]);
  const [reactions, setReactions] = useState<SimpleItem[]>([
    { id: "r1", name: "Urticaria / Hives" },
    { id: "r2", name: "Anaphylaxis" },
    { id: "r3", name: "Angioedema" },
    { id: "r4", name: "Rash / Erythema" },
    { id: "r5", name: "Bronchospasm" },
    { id: "r6", name: "Gastrointestinal upset" },
  ]);
  const [onset, setOnset] = useState<SimpleItem[]>([
    { id: "o1", name: "Immediate (< 1 hr)" },
    { id: "o2", name: "Delayed (1–24 hrs)" },
    { id: "o3", name: "Late (> 24 hrs)" },
  ]);
  const [draftName, setDraftName] = useState("");
  const [draftType, setDraftType] = useState<AllergenType>("Drug");

  const TABS = [
    { key: "allergens" as const, label: "Allergens" },
    { key: "reactions" as const, label: "Reactions" },
    { key: "onset" as const,     label: "Onset Options" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setAllergenTab(t.key)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${allergenTab === t.key ? "bg-white text-[#4982CF] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {allergenTab === "allergens" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="Allergen name…" className="h-8 text-xs flex-1" />
            <select value={draftType} onChange={e => setDraftType(e.target.value as AllergenType)}
              className="h-8 text-xs border border-slate-200 rounded-lg px-2 focus:outline-none text-slate-700 bg-white">
              {["Drug","Food","Environmental","Other"].map(t => <option key={t}>{t}</option>)}
            </select>
            <Button onClick={() => { if (draftName.trim()) { setAllergens(as => [...as, { id: uid(), name: draftName.trim(), type: draftType }]); setDraftName(""); } }} className="h-8 text-xs bg-[#4982CF] text-white px-3">Add</Button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-400">Name</th>
                <th className="text-left px-4 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-400">Type</th>
                <th className="w-12 px-3"></th>
              </tr></thead>
              <tbody>
                {allergens.map(a => (
                  <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 group">
                    <td className="px-4 py-2 font-medium text-slate-700">{a.name}</td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className="text-[9px] text-slate-500 border-slate-200">{a.type}</Badge>
                    </td>
                    <td className="px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setAllergens(as => as.filter(x => x.id !== a.id))} className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {allergenTab === "reactions" && <SimpleList items={reactions} setItems={setReactions} placeholder="Add reaction…" />}
      {allergenTab === "onset"    && <SimpleList items={onset}     setItems={setOnset}     placeholder="Add onset option…" />}
    </div>
  );
}

// ─── ⑥ Medical & Surgical History ────────────────────────────────────────────

const MED_CATEGORIES = ["Cardiovascular","Endocrine","Respiratory","Neurological","Gastrointestinal","Musculoskeletal","Renal","Psychiatric","Other"];

interface PmhCondition { id: string; name: string; category: string; active: boolean; }
interface SurgicalProc  { id: string; name: string; complications: string; }

function MedicalSurgicalHistory() {
  const [tab, setTab] = useState<"pmh" | "surgical">("pmh");
  const [pmh, setPmh] = useState<PmhCondition[]>([
    { id: "m1", name: "Hypertension",        category: "Cardiovascular",  active: true  },
    { id: "m2", name: "Type 2 Diabetes",     category: "Endocrine",       active: true  },
    { id: "m3", name: "Asthma",              category: "Respiratory",     active: true  },
    { id: "m4", name: "Epilepsy",            category: "Neurological",    active: false },
    { id: "m5", name: "GERD",               category: "Gastrointestinal", active: true  },
  ]);
  const [surgical, setSurgical] = useState<SurgicalProc[]>([
    { id: "s1", name: "Appendectomy",         complications: "Wound infection, ileus" },
    { id: "s2", name: "Caesarean Section",    complications: "Haemorrhage, infection" },
    { id: "s3", name: "Cholecystectomy",      complications: "Bile leak, bleeding"    },
  ]);
  const [draftPmh, setDraftPmh]   = useState<{ name: string; category: string }>({ name: "", category: "Cardiovascular" });
  const [bulkPaste, setBulkPaste] = useState("");
  const [draftSurg, setDraftSurg] = useState<{ name: string; complications: string }>({ name: "", complications: "" });

  function addPmh() {
    if (!draftPmh.name.trim()) return;
    setPmh(ps => [...ps, { id: uid(), name: draftPmh.name.trim(), category: draftPmh.category, active: true }]);
    setDraftPmh(d => ({ ...d, name: "" }));
  }

  function bulkAdd() {
    const names = bulkPaste.split(",").map(s => s.trim()).filter(Boolean);
    setPmh(ps => [...ps, ...names.map(n => ({ id: uid(), name: n, category: "Other", active: true }))]);
    setBulkPaste("");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[{ key: "pmh" as const, label: "Past Medical History" }, { key: "surgical" as const, label: "Surgical Procedures" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${tab === t.key ? "bg-white text-[#4982CF] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pmh" && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Input value={draftPmh.name} onChange={e => setDraftPmh(d => ({ ...d, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && addPmh()} placeholder="Condition name…" className="h-8 text-xs flex-1 min-w-40" />
            <select value={draftPmh.category} onChange={e => setDraftPmh(d => ({ ...d, category: e.target.value }))}
              className="h-8 text-xs border border-slate-200 rounded-lg px-2 focus:outline-none text-slate-700 bg-white">
              {MED_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <Button onClick={addPmh} className="h-8 text-xs bg-[#4982CF] text-white px-3">Add</Button>
          </div>
          <div className="flex gap-2">
            <Input value={bulkPaste} onChange={e => setBulkPaste(e.target.value)} placeholder="Bulk import — paste comma-separated conditions…" className="h-8 text-xs flex-1" />
            <Button onClick={bulkAdd} variant="outline" className="h-8 text-xs px-3">Bulk Add</Button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-400">Condition</th>
                <th className="text-left px-4 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-400">Category</th>
                <th className="text-center px-4 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-400">Active</th>
                <th className="w-8 px-3"></th>
              </tr></thead>
              <tbody>
                {pmh.map(c => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 group">
                    <td className="px-4 py-2 font-medium text-slate-700">{c.name}</td>
                    <td className="px-4 py-2"><Badge variant="outline" className="text-[9px] text-slate-500 border-slate-200">{c.category}</Badge></td>
                    <td className="px-4 py-2 text-center"><Switch checked={c.active} onCheckedChange={v => setPmh(ps => ps.map(x => x.id === c.id ? { ...x, active: v } : x))} className="data-[state=checked]:bg-[#4982CF]" /></td>
                    <td className="px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setPmh(ps => ps.filter(x => x.id !== c.id))} className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "surgical" && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Input value={draftSurg.name} onChange={e => setDraftSurg(d => ({ ...d, name: e.target.value }))} placeholder="Procedure name…" className="h-8 text-xs flex-1" />
            <Input value={draftSurg.complications} onChange={e => setDraftSurg(d => ({ ...d, complications: e.target.value }))} placeholder="Possible complications (comma-separated)…" className="h-8 text-xs flex-1" />
            <Button onClick={() => { if (draftSurg.name.trim()) { setSurgical(ss => [...ss, { id: uid(), ...draftSurg }]); setDraftSurg({ name: "", complications: "" }); } }} className="h-8 text-xs bg-[#4982CF] text-white px-3">Add</Button>
          </div>
          <div className="space-y-1.5">
            {surgical.map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-3 py-2.5 group">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-800">{s.name}</p>
                  {s.complications && <p className="text-[10px] text-slate-400 mt-0.5">{s.complications}</p>}
                </div>
                <button onClick={() => setSurgical(ss => ss.filter(x => x.id !== s.id))} className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ⑦ Family History ────────────────────────────────────────────────────────

interface FamilyCondition { id: string; name: string; relationships: string; }
interface GeneticDisease  { id: string; name: string; }

const DEFAULT_RELATIONSHIPS = "Father, Mother, Sibling, Grandparent";

function FamilyHistory() {
  const [tab, setTab] = useState<"conditions" | "genetic">("conditions");
  const [conditions, setConditions] = useState<FamilyCondition[]>([
    { id: "fc1", name: "Hypertension",    relationships: DEFAULT_RELATIONSHIPS },
    { id: "fc2", name: "Diabetes",        relationships: DEFAULT_RELATIONSHIPS },
    { id: "fc3", name: "Heart Disease",   relationships: DEFAULT_RELATIONSHIPS },
    { id: "fc4", name: "Cancer",          relationships: DEFAULT_RELATIONSHIPS },
    { id: "fc5", name: "Stroke",          relationships: DEFAULT_RELATIONSHIPS },
  ]);
  const [genetic, setGenetic] = useState<GeneticDisease[]>([
    { id: "gd1", name: "Sickle Cell Disease" },
    { id: "gd2", name: "Thalassaemia"        },
    { id: "gd3", name: "Cystic Fibrosis"     },
    { id: "gd4", name: "Haemophilia"         },
  ]);
  const [draftFc, setDraftFc] = useState<{ name: string; relationships: string }>({ name: "", relationships: DEFAULT_RELATIONSHIPS });
  const [draftGd, setDraftGd] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[{ key: "conditions" as const, label: "Conditions" }, { key: "genetic" as const, label: "Genetic Diseases" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${tab === t.key ? "bg-white text-[#4982CF] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "conditions" && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Input value={draftFc.name} onChange={e => setDraftFc(d => ({ ...d, name: e.target.value }))} placeholder="Condition name…" className="h-8 text-xs flex-1" />
            <Input value={draftFc.relationships} onChange={e => setDraftFc(d => ({ ...d, relationships: e.target.value }))} placeholder="Applicable relationships…" className="h-8 text-xs flex-1" />
            <Button onClick={() => { if (draftFc.name.trim()) { setConditions(cs => [...cs, { id: uid(), ...draftFc }]); setDraftFc(d => ({ ...d, name: "" })); } }} className="h-8 text-xs bg-[#4982CF] text-white px-3">Add</Button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-400">Condition</th>
                <th className="text-left px-4 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-400">Default Relationships</th>
                <th className="w-8 px-3"></th>
              </tr></thead>
              <tbody>
                {conditions.map(c => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 group">
                    <td className="px-4 py-2 font-medium text-slate-700">{c.name}</td>
                    <td className="px-4 py-2 text-slate-500 text-[10px]">{c.relationships}</td>
                    <td className="px-3 py-2 opacity-0 group-hover:opacity-100"><button onClick={() => setConditions(cs => cs.filter(x => x.id !== c.id))} className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "genetic" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input value={draftGd} onChange={e => setDraftGd(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && draftGd.trim()) { setGenetic(gs => [...gs, { id: uid(), name: draftGd.trim() }]); setDraftGd(""); } }} placeholder="Genetic disease name…" className="h-8 text-xs flex-1" />
            <Button onClick={() => { if (draftGd.trim()) { setGenetic(gs => [...gs, { id: uid(), name: draftGd.trim() }]); setDraftGd(""); } }} className="h-8 text-xs bg-[#4982CF] text-white px-3">Add</Button>
          </div>
          <div className="space-y-1.5">
            {genetic.map(g => (
              <div key={g.id} className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2 group">
                <span className="flex-1 text-xs text-slate-700">{g.name}</span>
                <button onClick={() => setGenetic(gs => gs.filter(x => x.id !== g.id))} className="p-0.5 text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ⑧ Social History Dynamic Builder ────────────────────────────────────────

type SocDisplayType = "Yes/No Radio" | "Single Dropdown" | "Multi Dropdown" | "Number Input" | "Text Input";

interface SocOption   { id: string; value: string; }
interface SocFollowUp { id: string; label: string; type: Exclude<SocDisplayType, "Yes/No Radio">; options: SocOption[]; placeholder: string; }
interface SocQuestion {
  id: string;
  name: string;
  displayType: SocDisplayType;
  placeholder: string;
  options: SocOption[];
  followUps: SocFollowUp[];
  active: boolean;
}

const SEED_SOC: SocQuestion[] = [
  { id: "sq1", name: "Tobacco / Smoking", displayType: "Yes/No Radio", placeholder: "", options: [], active: true,
    followUps: [
      { id: "sf1", label: "Type", type: "Single Dropdown", placeholder: "", options: [{ id: "o1", value: "Cigarettes" }, { id: "o2", value: "Hookah" }, { id: "o3", value: "Vape" }] },
      { id: "sf2", label: "Packs per day", type: "Number Input", placeholder: "e.g. 1", options: [] },
    ],
  },
  { id: "sq2", name: "Alcohol Consumption", displayType: "Yes/No Radio", placeholder: "", options: [], active: true,
    followUps: [
      { id: "sf3", label: "Frequency", type: "Single Dropdown", placeholder: "", options: [{ id: "o4", value: "Daily" }, { id: "o5", value: "Weekly" }, { id: "o6", value: "Occasionally" }] },
    ],
  },
  { id: "sq3", name: "Occupation", displayType: "Text Input", placeholder: "e.g. Teacher, Engineer…", options: [], followUps: [], active: true },
  { id: "sq4", name: "Marital Status", displayType: "Single Dropdown", placeholder: "Select…", active: true, followUps: [],
    options: [{ id: "o7", value: "Single" }, { id: "o8", value: "Married" }, { id: "o9", value: "Divorced" }, { id: "o10", value: "Widowed" }],
  },
  { id: "sq5", name: "Exercise", displayType: "Single Dropdown", placeholder: "", active: false, followUps: [],
    options: [{ id: "o11", value: "None" }, { id: "o12", value: "Occasional" }, { id: "o13", value: "Regular" }],
  },
];

function SocOptionList({ options, onChange }: { options: SocOption[]; onChange: (opts: SocOption[]) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-1">
      {options.map((o, i) => (
        <div key={o.id} className="flex gap-1.5 items-center">
          <input type="text" value={o.value} onChange={e => onChange(options.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
            className="flex-1 text-[10px] border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none bg-slate-50" />
          <button onClick={() => onChange(options.filter((_, j) => j !== i))} className="p-0.5 text-slate-300 hover:text-rose-400"><X className="h-3 w-3" /></button>
        </div>
      ))}
      <div className="flex gap-1.5">
        <input type="text" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && draft.trim()) { onChange([...options, { id: uid(), value: draft.trim() }]); setDraft(""); } }}
          placeholder="Add option…" className="flex-1 text-[10px] border border-dashed border-slate-300 rounded px-1.5 py-0.5 focus:outline-none" />
        <button onClick={() => { if (draft.trim()) { onChange([...options, { id: uid(), value: draft.trim() }]); setDraft(""); } }}
          className="text-[10px] font-bold text-[#4982CF] px-2">+</button>
      </div>
    </div>
  );
}

function SocPreviewQuestion({ q }: { q: SocQuestion }) {
  const needsOpts = q.displayType === "Single Dropdown" || q.displayType === "Multi Dropdown";
  return (
    <div className="mb-4">
      <p className="text-xs font-bold text-slate-700">{q.name || "Untitled Question"}</p>
      {q.displayType === "Yes/No Radio" && (
        <div className="flex gap-4 mt-1">
          {["Yes","No"].map(v => <label key={v} className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer"><input type="radio" name={q.id} disabled className="accent-[#4982CF]" /> {v}</label>)}
        </div>
      )}
      {q.displayType === "Text Input" && <input disabled placeholder={q.placeholder || "Type…"} className="mt-1 w-full h-7 border border-slate-200 rounded bg-slate-50 px-2 text-xs block" />}
      {q.displayType === "Number Input" && <input disabled placeholder={q.placeholder || "0"} className="mt-1 h-7 border border-slate-200 rounded bg-slate-50 px-2 text-xs w-24 block" />}
      {needsOpts && (
        q.displayType === "Single Dropdown"
          ? <select disabled className="mt-1 h-7 border border-slate-200 rounded bg-slate-50 px-2 text-xs w-full"><option>{q.placeholder || "Select…"}</option>{q.options.map(o => <option key={o.id}>{o.value}</option>)}</select>
          : <div className="mt-1 flex flex-wrap gap-1">{q.options.map(o => <label key={o.id} className="flex items-center gap-1 text-[10px] bg-slate-50 border border-slate-100 rounded px-2 py-0.5 cursor-pointer"><input type="checkbox" disabled className="accent-[#4982CF]" /> {o.value}</label>)}</div>
      )}
      {q.displayType === "Yes/No Radio" && q.followUps.length > 0 && (
        <div className="ml-4 mt-2 border-l-2 border-slate-200 pl-3 space-y-2">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">If Yes…</p>
          {q.followUps.map(fu => (
            <div key={fu.id}>
              <p className="text-[10px] font-bold text-slate-600">{fu.label}</p>
              {fu.type === "Number Input" && <input disabled placeholder={fu.placeholder || "0"} className="mt-0.5 h-6 border border-slate-200 rounded bg-slate-50 px-2 text-[10px] w-24 block" />}
              {fu.type === "Text Input"   && <input disabled placeholder={fu.placeholder || "Type…"} className="mt-0.5 h-6 border border-slate-200 rounded bg-slate-50 px-2 text-[10px] w-full block" />}
              {(fu.type === "Single Dropdown" || fu.type === "Multi Dropdown") && (
                <select disabled className="mt-0.5 h-6 border border-slate-200 rounded bg-slate-50 px-1.5 text-[10px] w-full">
                  {fu.options.map(o => <option key={o.id}>{o.value}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SocialHistoryBuilder() {
  const [questions, setQuestions] = useState<SocQuestion[]>(SEED_SOC);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const selected = questions.find(q => q.id === selectedId);

  function addQuestion() {
    const nq: SocQuestion = { id: uid(), name: "", displayType: "Yes/No Radio", placeholder: "", options: [], followUps: [], active: true };
    setQuestions(qs => [...qs, nq]);
    setSelectedId(nq.id);
  }

  function updateQ(patch: Partial<SocQuestion>) {
    setQuestions(qs => qs.map(q => q.id === selectedId ? { ...q, ...patch } : q));
  }

  function addFollowUp() {
    const fu: SocFollowUp = { id: uid(), label: "", type: "Text Input", placeholder: "", options: [] };
    updateQ({ followUps: [...(selected?.followUps ?? []), fu] });
  }

  function updateFollowUp(fuId: string, patch: Partial<SocFollowUp>) {
    updateQ({ followUps: selected?.followUps.map(fu => fu.id === fuId ? { ...fu, ...patch } : fu) ?? [] });
  }

  const DISPLAY_TYPES: SocDisplayType[] = ["Yes/No Radio","Single Dropdown","Multi Dropdown","Number Input","Text Input"];

  return (
    <div className="flex gap-4 min-h-0">
      {/* Left: question list */}
      <div className="w-60 flex-shrink-0 space-y-2">
        <button onClick={addQuestion} className="w-full flex items-center gap-1.5 text-xs font-bold text-[#4982CF] hover:text-[#3b6bb5] transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Question
        </button>
        {questions.map((q, i) => (
          <div key={q.id} draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={e => { e.preventDefault(); setDropIdx(i); }}
            onDrop={() => { if (dragIdx !== null && dragIdx !== i) setQuestions(qs => reorder(qs, dragIdx, i)); setDragIdx(null); setDropIdx(null); }}
            onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
            onClick={() => setSelectedId(q.id)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition-all ${selectedId === q.id ? "border-[#4982CF] bg-[#4982CF]/5" : "border-slate-100 bg-white hover:border-[#4982CF]/30"} ${dropIdx === i && dragIdx !== i ? "border-t-2 border-[#4982CF]" : ""}`}>
            <GripVertical className="h-3.5 w-3.5 text-slate-300 cursor-grab flex-shrink-0" />
            <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{q.name || <span className="text-slate-300">Untitled</span>}</span>
            <Switch checked={q.active} onCheckedChange={v => { setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, active: v } : x)); }} className="data-[state=checked]:bg-[#4982CF] scale-75 flex-shrink-0" onClick={e => e.stopPropagation()} />
          </div>
        ))}
      </div>

      {/* Center: editor */}
      <div className="flex-1 min-w-0 space-y-4">
        {selected ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Question Settings</p>
              <button onClick={() => { setQuestions(qs => qs.filter(q => q.id !== selectedId)); setSelectedId(null); }} className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500">Question / Label</label>
                <Input value={selected.name} onChange={e => updateQ({ name: e.target.value })} placeholder="e.g. Tobacco / Smoking" className="h-8 text-xs mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500">Display Type</label>
                <select value={selected.displayType} onChange={e => updateQ({ displayType: e.target.value as SocDisplayType, options: [], followUps: [] })}
                  className="w-full h-8 text-xs border border-slate-200 rounded-lg px-2 focus:outline-none mt-1 bg-white">
                  {DISPLAY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {(selected.displayType === "Text Input" || selected.displayType === "Number Input") && (
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500">Placeholder</label>
                  <Input value={selected.placeholder} onChange={e => updateQ({ placeholder: e.target.value })} placeholder="Placeholder text…" className="h-8 text-xs mt-1" />
                </div>
              )}
              {(selected.displayType === "Single Dropdown" || selected.displayType === "Multi Dropdown") && (
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Options</label>
                  <SocOptionList options={selected.options} onChange={opts => updateQ({ options: opts })} />
                </div>
              )}
            </div>
            {selected.displayType === "Yes/No Radio" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">If Yes → Follow-up Fields</p>
                  <button onClick={addFollowUp} className="text-[10px] font-bold text-[#4982CF] flex items-center gap-1"><Plus className="h-3 w-3" /> Add Follow-up</button>
                </div>
                {selected.followUps.map(fu => (
                  <div key={fu.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-2 space-y-2">
                    <div className="flex gap-2">
                      <Input value={fu.label} onChange={e => updateFollowUp(fu.id, { label: e.target.value })} placeholder="Field label…" className="h-7 text-xs flex-1" />
                      <select value={fu.type} onChange={e => updateFollowUp(fu.id, { type: e.target.value as SocFollowUp["type"], options: [] })}
                        className="h-7 text-xs border border-slate-200 rounded-lg px-2 focus:outline-none bg-white">
                        {(["Single Dropdown","Multi Dropdown","Number Input","Text Input"] as const).map(t => <option key={t}>{t}</option>)}
                      </select>
                      <button onClick={() => updateQ({ followUps: selected.followUps.filter(x => x.id !== fu.id) })} className="p-0.5 text-slate-300 hover:text-rose-400"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    {(fu.type === "Single Dropdown" || fu.type === "Multi Dropdown") && (
                      <SocOptionList options={fu.options} onChange={opts => updateFollowUp(fu.id, { options: opts })} />
                    )}
                    {(fu.type === "Text Input" || fu.type === "Number Input") && (
                      <Input value={fu.placeholder} onChange={e => updateFollowUp(fu.id, { placeholder: e.target.value })} placeholder="Placeholder…" className="h-7 text-xs" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-300 py-20">
            <div className="text-center">
              <Eye className="h-10 w-10 mx-auto mb-2" />
              <p className="text-sm">Select a question to edit</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: preview */}
      <div className="w-56 flex-shrink-0">
        <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
            <Eye className="h-3.5 w-3.5 text-[#4982CF]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preview</span>
          </div>
          {questions.filter(q => q.active).map(q => <SocPreviewQuestion key={q.id} q={q} />)}
        </div>
      </div>
    </div>
  );
}

// ─── ClinicalLibrariesModule ──────────────────────────────────────────────────

type ClinTab =
  | "complaints" | "icd10" | "poc" | "ros"
  | "allergies" | "med-surgical" | "family-history" | "social-history";

const TABS: { key: ClinTab; label: string; group: "clinical" | "history" }[] = [
  { key: "complaints",    label: "Chief Complaints",  group: "clinical" },
  { key: "icd10",         label: "ICD-10 Catalogue",  group: "clinical" },
  { key: "poc",           label: "POC Tests",          group: "clinical" },
  { key: "ros",           label: "ROS Systems",        group: "clinical" },
  { key: "allergies",     label: "Allergies",          group: "history"  },
  { key: "med-surgical",  label: "Medical & Surgical", group: "history"  },
  { key: "family-history",label: "Family History",     group: "history"  },
  { key: "social-history",label: "Social History",     group: "history"  },
];

const TAB_META: Record<ClinTab, { title: string; sub: string }> = {
  "complaints":     { title: "Chief Complaint Library",     sub: "Manage the pick-list of chief complaints doctors use in the SOAP note." },
  "icd10":          { title: "ICD-10 Catalogue",            sub: "Manage ICD-10 codes, group them into specialty bundles, and star favourites." },
  "poc":            { title: "POC Test Configuration",      sub: "Configure point-of-care tests available in the note, including result types and normal ranges." },
  "ros":            { title: "ROS System Configuration",    sub: "Manage the Review of Systems categories shown in the note." },
  "allergies":      { title: "Allergy Management",          sub: "Manage allergen names, reaction types, and onset option lists." },
  "med-surgical":   { title: "Medical & Surgical History",  sub: "Manage past medical conditions and surgical procedures shown in the history section." },
  "family-history": { title: "Family History",              sub: "Manage family history conditions and genetic disease lists." },
  "social-history": { title: "Social History Builder",      sub: "Design dynamic social history questions with conditional logic and live preview." },
};

export function ClinicalLibrariesModule({ initialTab, standalone }: { initialTab?: ClinTab; standalone?: boolean }) {
  const [activeTab, setActiveTab] = useState<ClinTab>(initialTab ?? "complaints");
  const meta = TAB_META[activeTab];

  const content = (
    <>
      {activeTab === "complaints"     && <ChiefComplaintLibrary />}
      {activeTab === "icd10"          && <Icd10Catalogue />}
      {activeTab === "poc"            && <PocTestConfig />}
      {activeTab === "ros"            && <RosConfig />}
      {activeTab === "allergies"      && <AllergyManagement />}
      {activeTab === "med-surgical"   && <MedicalSurgicalHistory />}
      {activeTab === "family-history" && <FamilyHistory />}
      {activeTab === "social-history" && <SocialHistoryBuilder />}
    </>
  );

  if (standalone) {
    return (
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        <div className="mb-5">
          <h2 className="text-lg font-black text-slate-800">{meta.title}</h2>
          <p className="text-sm text-slate-400 mt-0.5">{meta.sub}</p>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="flex gap-0 -ml-6 -mr-6 -mt-6 h-full min-h-0">
      {/* Left sub-nav */}
      <div className="w-52 flex-shrink-0 border-r border-slate-100 bg-white pt-5 overflow-y-auto">
        <div className="px-4 mb-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Clinical Libraries</p>
        </div>
        {TABS.filter(t => t.group === "clinical").map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${activeTab === t.key ? "text-[#4982CF] bg-[#4982CF]/5 border-r-2 border-[#4982CF]" : "text-slate-600 hover:bg-slate-50"}`}>
            {t.label}
          </button>
        ))}
        <div className="px-4 mb-2 mt-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">History Libraries</p>
        </div>
        {TABS.filter(t => t.group === "history").map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${activeTab === t.key ? "text-[#4982CF] bg-[#4982CF]/5 border-r-2 border-[#4982CF]" : "text-slate-600 hover:bg-slate-50"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        <div className="mb-5">
          <h2 className="text-lg font-black text-slate-800">{meta.title}</h2>
          <p className="text-sm text-slate-400 mt-0.5">{meta.sub}</p>
        </div>
        {content}
      </div>
    </div>
  );
}
