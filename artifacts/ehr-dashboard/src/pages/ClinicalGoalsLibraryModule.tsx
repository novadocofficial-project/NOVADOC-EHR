import { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit2, Save, X, CheckCircle2, Search, Scissors, AlertTriangle,
  ClipboardCheck, Target, MapPin, Heart, ChevronDown, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const ACCENT = "#4982CF";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatientGoal {
  id:      string;
  title:   string;
  actions: string[];
}

interface ReferralDest {
  id:       string;
  name:     string;
  category: "Hospital" | "Clinic" | "Diagnostic Lab" | "Pharmacy" | "Rehab Centre" | "Other";
  services: string[];
  active:   boolean;
}

interface Comorbidity {
  id:       string;
  name:     string;
  icd10:    string;
  category: string;
}

// ─── Seeds ────────────────────────────────────────────────────────────────────

const GOAL_SEED: PatientGoal[] = [
  { id: "g1", title: "Achieve target HbA1c < 7%", actions: ["Daily glucose logging","Monthly lab review","Dietary adherence"] },
  { id: "g2", title: "Reduce blood pressure to < 130/80", actions: ["Reduce sodium intake","Daily walking 30 min","Medication compliance"] },
  { id: "g3", title: "Maintain healthy weight (BMI 18.5–24.9)", actions: ["Caloric deficit diet","Weekly weigh-in","Exercise 150 min/week"] },
  { id: "g4", title: "Smoking cessation within 3 months", actions: ["Nicotine replacement","Counseling sessions","Set quit date"] },
];

const DEST_SEED: ReferralDest[] = [
  { id: "d1", name: "Agha Khan University Hospital",  category: "Hospital",         services: ["Cardiology","Neurology","Oncology"], active: true  },
  { id: "d2", name: "Liaquat National Hospital",      category: "Hospital",         services: ["Emergency","Orthopaedics","Surgery"], active: true  },
  { id: "d3", name: "Essa Lab",                        category: "Diagnostic Lab",   services: ["Haematology","Biochemistry","Microbiology"], active: true },
  { id: "d4", name: "Umair Physiotherapy Centre",     category: "Rehab Centre",     services: ["Physiotherapy","Occupational Therapy"], active: true  },
];

const COMORBIDITY_SEED: Comorbidity[] = [
  { id: "c1",  name: "Type 2 Diabetes Mellitus",   icd10: "E11",  category: "Endocrine"       },
  { id: "c2",  name: "Essential Hypertension",      icd10: "I10",  category: "Cardiovascular"  },
  { id: "c3",  name: "Ischaemic Heart Disease",     icd10: "I25",  category: "Cardiovascular"  },
  { id: "c4",  name: "Chronic Kidney Disease",      icd10: "N18",  category: "Renal"           },
  { id: "c5",  name: "Bronchial Asthma",            icd10: "J45",  category: "Respiratory"     },
  { id: "c6",  name: "COPD",                         icd10: "J44",  category: "Respiratory"     },
  { id: "c7",  name: "Hypothyroidism",              icd10: "E03",  category: "Endocrine"       },
  { id: "c8",  name: "Rheumatoid Arthritis",        icd10: "M06",  category: "Musculoskeletal" },
];

const DEST_CATEGORIES: ReferralDest["category"][] = ["Hospital","Clinic","Diagnostic Lab","Pharmacy","Rehab Centre","Other"];
const COMORBIDITY_CATEGORIES = ["Cardiovascular","Endocrine","Respiratory","Renal","Neurological","Musculoskeletal","Gastroenterology","Haematology","Other"];

type TabKey = "goals" | "referral-dest" | "comorbidities" | "surgical-procedures";

function uid() { return `x-${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }

// ─── Patient Goals Tab ────────────────────────────────────────────────────────

function GoalsTab() {
  const [goals, setGoals]   = useState<PatientGoal[]>(GOAL_SEED);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft]   = useState<PatientGoal | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newActions, setNewActions] = useState<string[]>([""]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function startEdit(g: PatientGoal) { setEditId(g.id); setDraft({ ...g, actions: [...g.actions] }); }
  function cancelEdit() { setEditId(null); setDraft(null); }
  function saveEdit() {
    if (!draft?.title.trim()) return;
    setGoals(prev => prev.map(g => g.id === draft.id ? draft : g));
    setEditId(null); setDraft(null);
  }
  function remove(id: string) { setGoals(prev => prev.filter(g => g.id !== id)); }

  function addGoal() {
    if (!newTitle.trim()) return;
    setGoals(prev => [...prev, { id: uid(), title: newTitle.trim(), actions: newActions.filter(a => a.trim()) }]);
    setNewTitle(""); setNewActions([""]); setAdding(false);
  }

  function updateAction(list: string[], idx: number, val: string): string[] {
    const next = [...list]; next[idx] = val; return next;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-xs text-slate-500">{goals.length} patient goal templates</p>
        <Button size="sm" onClick={() => setAdding(true)} style={{ background: ACCENT }} className="text-white text-xs gap-1">
          <Plus className="h-3.5 w-3.5" /> New Goal
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {adding && (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Goal title" className="h-8 text-xs" autoFocus />
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Recommended Actions</label>
              {newActions.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={a} onChange={e => setNewActions(prev => updateAction(prev, i, e.target.value))}
                    placeholder={`Action ${i + 1}`} className="h-7 text-xs flex-1" />
                  {newActions.length > 1 && (
                    <button onClick={() => setNewActions(prev => prev.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" /></button>
                  )}
                </div>
              ))}
              <button onClick={() => setNewActions(prev => [...prev, ""])}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add action
              </button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs text-white" style={{ background: ACCENT }} onClick={addGoal}>Save Goal</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </div>
        )}
        {goals.map(g => (
          <div key={g.id} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            {editId === g.id && draft ? (
              <div className="p-4 space-y-3">
                <Input value={draft.title} onChange={e => setDraft(d => d ? { ...d, title: e.target.value } : d)}
                  placeholder="Goal title" className="h-8 text-xs" />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Recommended Actions</label>
                  {draft.actions.map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input value={a} onChange={e => setDraft(d => d ? { ...d, actions: updateAction(d.actions, i, e.target.value) } : d)}
                        className="h-7 text-xs flex-1" />
                      {draft.actions.length > 1 && (
                        <button onClick={() => setDraft(d => d ? { ...d, actions: d.actions.filter((_, j) => j !== i) } : d)}>
                          <X className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setDraft(d => d ? { ...d, actions: [...d.actions, ""] } : d)}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add action
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs text-white" style={{ background: ACCENT }} onClick={saveEdit}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Target className="h-4 w-4 shrink-0" style={{ color: ACCENT }} />
                  <button className="flex-1 text-left text-sm font-medium text-slate-700"
                    onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}>
                    {g.title}
                  </button>
                  <span className="text-xs text-slate-400">{g.actions.length} action{g.actions.length !== 1 ? "s" : ""}</span>
                  {expandedId === g.id ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                  <button onClick={() => startEdit(g)} className="text-slate-400 hover:text-slate-700"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => remove(g.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                {expandedId === g.id && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-1">
                    {g.actions.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-500 shrink-0">{i+1}</span>
                        {a}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {goals.length === 0 && !adding && (
          <div className="text-center py-16 text-slate-400 text-sm">No goal templates.</div>
        )}
      </div>
    </div>
  );
}

// ─── Referral Destinations Tab ────────────────────────────────────────────────

const REFERRAL_DEST_KEY = "ehr-referral-destinations-v1";

function loadDestSeed(): ReferralDest[] {
  try {
    const raw = localStorage.getItem(REFERRAL_DEST_KEY);
    if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length) return parsed; }
  } catch { /**/ }
  return DEST_SEED;
}

function saveDestToStorage(items: ReferralDest[]) {
  try { localStorage.setItem(REFERRAL_DEST_KEY, JSON.stringify(items)); } catch { /**/ }
}

function ReferralDestTab() {
  const [dests, setDests]   = useState<ReferralDest[]>(loadDestSeed);
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<ReferralDest | null>(null);
  const [isNew, setIsNew]   = useState(false);
  const [serviceInput, setServiceInput] = useState("");

  const visible = dests.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.services.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  function openNew() {
    setDrawer({ id: uid(), name: "", category: "Hospital", services: [], active: true });
    setIsNew(true); setServiceInput("");
  }

  function openEdit(d: ReferralDest) { setDrawer({ ...d }); setIsNew(false); setServiceInput(""); }

  function save() {
    if (!drawer?.name.trim()) return;
    const next = isNew
      ? [...dests, drawer]
      : dests.map(d => d.id === drawer!.id ? drawer! : d);
    setDests(next);
    saveDestToStorage(next);
    setDrawer(null);
  }

  function addService() {
    const s = serviceInput.trim();
    if (!s || !drawer) return;
    setDrawer(d => d ? { ...d, services: [...d.services, s] } : d);
    setServiceInput("");
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search destinations…" className="pl-8 h-8 text-xs" />
          </div>
          <Button size="sm" onClick={openNew} style={{ background: ACCENT }} className="text-white text-xs gap-1">
            <Plus className="h-3.5 w-3.5" /> Add Destination
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {visible.map(d => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-slate-800">{d.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{d.category}</Badge>
                  {!d.active && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inactive</Badge>}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {d.services.map(s => (
                    <span key={s} className="px-1.5 py-0 bg-slate-100 rounded text-[10px] text-slate-600">{s}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => openEdit(d)} className="text-slate-400 hover:text-slate-700 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => { const next = dests.filter(x => x.id !== d.id); setDests(next); saveDestToStorage(next); }}
                className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {visible.length === 0 && <div className="text-center py-16 text-slate-400 text-sm">No destinations found.</div>}
        </div>
      </div>

      {drawer && (
        <div className="w-80 border-l border-slate-200 bg-white flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-sm text-slate-800">{isNew ? "Add Destination" : "Edit Destination"}</h3>
            <button onClick={() => setDrawer(null)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Facility Name *</label>
              <Input value={drawer.name} onChange={e => setDrawer(d => d ? { ...d, name: e.target.value } : d)}
                placeholder="e.g. Agha Khan Hospital" className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Category</label>
              <select value={drawer.category} onChange={e => setDrawer(d => d ? { ...d, category: e.target.value as ReferralDest["category"] } : d)}
                className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white">
                {DEST_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Services Offered</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {drawer.services.map(s => (
                  <span key={s} className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5 text-xs text-slate-700">
                    {s}
                    <button onClick={() => setDrawer(d => d ? { ...d, services: d.services.filter(x => x !== s) } : d)}>
                      <X className="h-2.5 w-2.5 text-slate-400 hover:text-red-500" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={serviceInput} onChange={e => setServiceInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addService()}
                  placeholder="Add service…" className="h-7 text-xs flex-1" />
                <Button size="sm" className="h-7 text-xs text-white" style={{ background: ACCENT }} onClick={addService}>Add</Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="destActive" checked={drawer.active}
                onChange={e => setDrawer(d => d ? { ...d, active: e.target.checked } : d)} />
              <label htmlFor="destActive" className="text-xs text-slate-600">Active</label>
            </div>
          </div>
          <div className="px-5 py-4 border-t border-slate-200">
            <Button onClick={save} size="sm" className="w-full text-xs text-white gap-1.5" style={{ background: ACCENT }}
              disabled={!drawer.name.trim()}>
              <Save className="h-3.5 w-3.5" /> {isNew ? "Add Destination" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Comorbidities Tab ────────────────────────────────────────────────────────

const COMORBIDITIES_KEY = "ehr-comorbidities-v1";

function loadComorbidities(): Comorbidity[] {
  try {
    const raw = localStorage.getItem(COMORBIDITIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Comorbidity[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /**/ }
  return COMORBIDITY_SEED;
}

function ComorbiditiesTab() {
  const [items, setItems]   = useState<Comorbidity[]>(loadComorbidities);

  useEffect(() => {
    try { localStorage.setItem(COMORBIDITIES_KEY, JSON.stringify(items)); } catch { /**/ }
  }, [items]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName]   = useState("");
  const [editIcd, setEditIcd]     = useState("");
  const [editCat, setEditCat]     = useState("");
  const [adding, setAdding]       = useState(false);
  const [newName, setNewName]     = useState("");
  const [newIcd, setNewIcd]       = useState("");
  const [newCat, setNewCat]       = useState(COMORBIDITY_CATEGORIES[0]);

  const cats = ["All", ...Array.from(new Set(items.map(i => i.category))).sort()];

  const visible = items.filter(i =>
    (filterCat === "All" || i.category === filterCat) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.icd10.toLowerCase().includes(search.toLowerCase()))
  );

  function startEdit(c: Comorbidity) { setEditId(c.id); setEditName(c.name); setEditIcd(c.icd10); setEditCat(c.category); }
  function cancelEdit() { setEditId(null); }
  function saveEdit(id: string) {
    if (!editName.trim()) return;
    setItems(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim(), icd10: editIcd.trim(), category: editCat } : c));
    setEditId(null);
  }
  function remove(id: string) { setItems(prev => prev.filter(c => c.id !== id)); }
  function addItem() {
    if (!newName.trim()) return;
    setItems(prev => [...prev, { id: uid(), name: newName.trim(), icd10: newIcd.trim(), category: newCat }]);
    setNewName(""); setNewIcd(""); setAdding(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search comorbidities…" className="pl-8 h-8 text-xs" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterCat === c ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
              style={filterCat === c ? { background: ACCENT } : {}}>
              {c}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setAdding(true)} style={{ background: ACCENT }} className="text-white text-xs gap-1 ml-auto">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5">
        {adding && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Condition name" className="h-7 text-xs flex-1" autoFocus />
            <Input value={newIcd} onChange={e => setNewIcd(e.target.value)} placeholder="ICD-10" className="h-7 text-xs w-24" />
            <select value={newCat} onChange={e => setNewCat(e.target.value)}
              className="h-7 text-xs border border-slate-200 rounded px-1.5 bg-white">
              {COMORBIDITY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <Button size="sm" className="h-7 text-xs text-white" style={{ background: ACCENT }} onClick={addItem}>Add</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /></Button>
          </div>
        )}
        {visible.map(c => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
            <Heart className="h-4 w-4 shrink-0 text-rose-400" />
            {editId === c.id ? (
              <>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-xs flex-1" autoFocus />
                <Input value={editIcd} onChange={e => setEditIcd(e.target.value)} placeholder="ICD-10" className="h-7 text-xs w-20" />
                <select value={editCat} onChange={e => setEditCat(e.target.value)}
                  className="h-7 text-xs border border-slate-200 rounded px-1.5 bg-white">
                  {COMORBIDITY_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                </select>
                <Button size="sm" className="h-7 text-xs text-white" style={{ background: ACCENT }} onClick={() => saveEdit(c.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}><X className="h-3.5 w-3.5" /></Button>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-700">{c.name}</span>
                  {c.icd10 && <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 font-mono">{c.icd10}</Badge>}
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{c.category}</Badge>
                </div>
                <button onClick={() => startEdit(c)} className="text-slate-400 hover:text-slate-700"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(c.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </>
            )}
          </div>
        ))}
        {visible.length === 0 && !adding && (
          <div className="text-center py-16 text-slate-400 text-sm">No comorbidities found.</div>
        )}
      </div>
    </div>
  );
}

// ─── Surgical Procedures Tab ──────────────────────────────────────────────────

interface SurgicalProcedure {
  id:       string;
  name:     string;
  category: string;
}

const SURGICAL_PROC_CATEGORIES = [
  "General Surgery", "Orthopaedics", "Cardiothoracic", "Neurosurgery",
  "Urology", "Gynaecology", "ENT", "Ophthalmology", "Vascular",
  "Plastic Surgery", "Other",
];

const SURGICAL_PROC_SEED: SurgicalProcedure[] = [
  { id: "sp1",  name: "Appendectomy",                        category: "General Surgery"  },
  { id: "sp2",  name: "Cholecystectomy",                     category: "General Surgery"  },
  { id: "sp3",  name: "Hernia Repair (Inguinal)",            category: "General Surgery"  },
  { id: "sp4",  name: "Hernia Repair (Umbilical)",           category: "General Surgery"  },
  { id: "sp5",  name: "Bowel Resection",                     category: "General Surgery"  },
  { id: "sp6",  name: "Colostomy",                           category: "General Surgery"  },
  { id: "sp7",  name: "Mastectomy",                          category: "General Surgery"  },
  { id: "sp8",  name: "Thyroidectomy",                       category: "General Surgery"  },
  { id: "sp9",  name: "Haemorrhoidectomy",                   category: "General Surgery"  },
  { id: "sp10", name: "Gastric Bypass / Bariatric Surgery",  category: "General Surgery"  },
  { id: "sp11", name: "Fistulotomy",                         category: "General Surgery"  },
  { id: "sp12", name: "Wound Debridement",                   category: "General Surgery"  },
  { id: "sp13", name: "Hip Replacement",                     category: "Orthopaedics"     },
  { id: "sp14", name: "Knee Replacement",                    category: "Orthopaedics"     },
  { id: "sp15", name: "Spinal Fusion / Laminectomy",         category: "Orthopaedics"     },
  { id: "sp16", name: "CABG (Coronary Artery Bypass Graft)", category: "Cardiothoracic"   },
  { id: "sp17", name: "Angioplasty / Stenting",              category: "Cardiothoracic"   },
  { id: "sp18", name: "Pacemaker Insertion",                 category: "Cardiothoracic"   },
  { id: "sp19", name: "Caesarean Section (C-section)",       category: "Gynaecology"      },
  { id: "sp20", name: "Hysterectomy",                        category: "Gynaecology"      },
  { id: "sp21", name: "Prostatectomy",                       category: "Urology"          },
  { id: "sp22", name: "Nephrectomy",                         category: "Urology"          },
  { id: "sp23", name: "Varicocelectomy",                     category: "Urology"          },
  { id: "sp24", name: "Circumcision",                        category: "Urology"          },
  { id: "sp25", name: "Tonsillectomy",                       category: "ENT"              },
  { id: "sp26", name: "Tympanoplasty",                       category: "ENT"              },
  { id: "sp27", name: "Cataract Surgery",                    category: "Ophthalmology"    },
  { id: "sp28", name: "Skin Graft",                          category: "Plastic Surgery"  },
];

const SURGICAL_PROC_KEY = "ehr-surgical-procedures-v1";
const SURGICAL_COMP_KEY = "ehr-surgical-complications-v1";

function loadSurgicalProcedures(): SurgicalProcedure[] {
  try {
    const raw = localStorage.getItem(SURGICAL_PROC_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SurgicalProcedure[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /**/ }
  return SURGICAL_PROC_SEED;
}

const SURGICAL_COMP_SEED = [
  "None", "Wound Infection", "Bleeding / Haemorrhage",
  "Anastomotic Leak", "Adhesions / Bowel Obstruction",
  "Post-op Pneumonia", "DVT / Pulmonary Embolism",
  "Urinary Retention", "Nerve Damage", "Seroma / Haematoma",
  "Incisional Hernia", "Keloid / Hypertrophic Scar",
  "Re-operation Required", "ICU Admission Required",
  "Prolonged Wound Healing", "Anaesthesia Reaction",
];

function loadSurgicalComplications(): string[] {
  try {
    const raw = localStorage.getItem(SURGICAL_COMP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /**/ }
  return SURGICAL_COMP_SEED;
}

function SurgicalProceduresTab() {
  const [subTab, setSubTab] = useState<"procedures" | "complications">("procedures");

  // ── Procedures state ──────────────────────────────────────────────────────
  const [procs, setProcs]         = useState<SurgicalProcedure[]>(loadSurgicalProcedures);
  const [pSearch, setPSearch]     = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [editId, setEditId]       = useState<string | null>(null);
  const [editName, setEditName]   = useState("");
  const [editCat, setEditCat]     = useState("");
  const [pAdding, setPAdding]     = useState(false);
  const [newName, setNewName]     = useState("");
  const [newCat, setNewCat]       = useState(SURGICAL_PROC_CATEGORIES[0]);

  useEffect(() => {
    try { localStorage.setItem(SURGICAL_PROC_KEY, JSON.stringify(procs)); } catch { /**/ }
  }, [procs]);

  // ── Complications state ───────────────────────────────────────────────────
  const [comps, setComps]         = useState<string[]>(loadSurgicalComplications);
  const [cSearch, setCSearch]     = useState("");
  const [cAdding, setCAdding]     = useState(false);
  const [newComp, setNewComp]     = useState("");
  const [editCId, setEditCId]     = useState<number | null>(null);
  const [editCName, setEditCName] = useState("");

  useEffect(() => {
    try { localStorage.setItem(SURGICAL_COMP_KEY, JSON.stringify(comps)); } catch { /**/ }
  }, [comps]);

  // ── Procedures helpers ────────────────────────────────────────────────────
  const cats = ["All", ...Array.from(new Set(procs.map(i => i.category))).sort()];
  const visibleProcs = procs.filter(i =>
    (filterCat === "All" || i.category === filterCat) &&
    i.name.toLowerCase().includes(pSearch.toLowerCase())
  );
  function startEdit(p: SurgicalProcedure) { setEditId(p.id); setEditName(p.name); setEditCat(p.category); }
  function cancelPEdit() { setEditId(null); }
  function savePEdit(id: string) {
    if (!editName.trim()) return;
    setProcs(prev => prev.map(p => p.id === id ? { ...p, name: editName.trim(), category: editCat } : p));
    setEditId(null);
  }
  function removeProc(id: string) { setProcs(prev => prev.filter(p => p.id !== id)); }
  function addProc() {
    if (!newName.trim()) return;
    setProcs(prev => [...prev, { id: uid(), name: newName.trim(), category: newCat }]);
    setNewName(""); setPAdding(false);
  }

  // ── Complications helpers ─────────────────────────────────────────────────
  const visibleComps = comps.filter(c => c.toLowerCase().includes(cSearch.toLowerCase()));
  function addComp() {
    if (!newComp.trim() || comps.includes(newComp.trim())) return;
    setComps(prev => [...prev, newComp.trim()]);
    setNewComp(""); setCAdding(false);
  }
  function saveCompEdit(idx: number) {
    if (!editCName.trim()) return;
    setComps(prev => prev.map((c, i) => i === idx ? editCName.trim() : c));
    setEditCId(null);
  }
  function removeComp(idx: number) { setComps(prev => prev.filter((_, i) => i !== idx)); }

  // ── Sub-tab bar ───────────────────────────────────────────────────────────
  const subTabClass = (key: string) =>
    `px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
      subTab === key
        ? "border-[#4982CF] text-[#4982CF]"
        : "border-transparent text-slate-500 hover:text-slate-700"
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Internal sub-tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 flex-shrink-0">
        <button className={subTabClass("procedures")} onClick={() => setSubTab("procedures")}>Procedures</button>
        <button className={subTabClass("complications")} onClick={() => setSubTab("complications")}>Complications</button>
      </div>

      {/* ── Procedures panel ── */}
      {subTab === "procedures" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input value={pSearch} onChange={e => setPSearch(e.target.value)} placeholder="Search procedures…" className="pl-8 h-8 text-xs" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cats.map(c => (
                <button key={c} onClick={() => setFilterCat(c)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    filterCat === c ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                  style={filterCat === c ? { background: ACCENT } : {}}>
                  {c}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => setPAdding(true)} style={{ background: ACCENT }} className="text-white text-xs gap-1 ml-auto">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5">
            {pAdding && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Procedure name" className="h-7 text-xs flex-1" autoFocus />
                <select value={newCat} onChange={e => setNewCat(e.target.value)}
                  className="h-7 text-xs border border-slate-200 rounded px-1.5 bg-white">
                  {SURGICAL_PROC_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <Button size="sm" className="h-7 text-xs text-white" style={{ background: ACCENT }} onClick={addProc}>Add</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setPAdding(false)}><X className="h-3.5 w-3.5" /></Button>
              </div>
            )}
            {visibleProcs.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                <Scissors className="h-4 w-4 shrink-0 text-blue-400" />
                {editId === p.id ? (
                  <>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-xs flex-1" autoFocus />
                    <select value={editCat} onChange={e => setEditCat(e.target.value)}
                      className="h-7 text-xs border border-slate-200 rounded px-1.5 bg-white">
                      {SURGICAL_PROC_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <Button size="sm" className="h-7 text-xs text-white" style={{ background: ACCENT }} onClick={() => savePEdit(p.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelPEdit}><X className="h-3.5 w-3.5" /></Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-slate-700">{p.name}</span>
                      <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">{p.category}</Badge>
                    </div>
                    <button onClick={() => startEdit(p)} className="text-slate-400 hover:text-slate-700"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => removeProc(p.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </>
                )}
              </div>
            ))}
            {visibleProcs.length === 0 && !pAdding && (
              <div className="text-center py-16 text-slate-400 text-sm">No procedures found.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Complications panel ── */}
      {subTab === "complications" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input value={cSearch} onChange={e => setCSearch(e.target.value)} placeholder="Search complications…" className="pl-8 h-8 text-xs" />
            </div>
            <Button size="sm" onClick={() => setCAdding(true)} style={{ background: ACCENT }} className="text-white text-xs gap-1 ml-auto">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5">
            {cAdding && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <Input value={newComp} onChange={e => setNewComp(e.target.value)} placeholder="Complication name" className="h-7 text-xs flex-1" autoFocus
                  onKeyDown={e => e.key === "Enter" && addComp()} />
                <Button size="sm" className="h-7 text-xs text-white" style={{ background: ACCENT }} onClick={addComp}>Add</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCAdding(false)}><X className="h-3.5 w-3.5" /></Button>
              </div>
            )}
            {visibleComps.map((c, idx) => {
              const realIdx = comps.indexOf(c);
              return (
                <div key={idx} className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  {editCId === realIdx ? (
                    <>
                      <Input value={editCName} onChange={e => setEditCName(e.target.value)} className="h-7 text-xs flex-1" autoFocus
                        onKeyDown={e => e.key === "Enter" && saveCompEdit(realIdx)} />
                      <Button size="sm" className="h-7 text-xs text-white" style={{ background: ACCENT }} onClick={() => saveCompEdit(realIdx)}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditCId(null)}><X className="h-3.5 w-3.5" /></Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-slate-700">{c}</span>
                      <button onClick={() => { setEditCId(realIdx); setEditCName(c); }} className="text-slate-400 hover:text-slate-700"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => removeComp(realIdx)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </>
                  )}
                </div>
              );
            })}
            {visibleComps.length === 0 && !cAdding && (
              <div className="text-center py-16 text-slate-400 text-sm">No complications found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "goals",               label: "Patient Goals",        icon: <Target   className="h-3.5 w-3.5" /> },
  { key: "referral-dest",       label: "Referral Destinations",icon: <MapPin   className="h-3.5 w-3.5" /> },
  { key: "comorbidities",       label: "Comorbidities",        icon: <Heart    className="h-3.5 w-3.5" /> },
  { key: "surgical-procedures", label: "Surgical Procedures",  icon: <Scissors className="h-3.5 w-3.5" /> },
];

const TAB_META_GOALS: Record<TabKey, { title: string; sub: string }> = {
  "goals":               { title: "Patient Goals",         sub: "Define goal templates and associated actions for patient care plans." },
  "referral-dest":       { title: "Referral Destinations", sub: "Manage the list of referral destinations available in the SOAP note." },
  "comorbidities":       { title: "Comorbidities",         sub: "Manage the comorbidity list used when documenting patient conditions." },
  "surgical-procedures": { title: "Surgical Procedures",   sub: "Manage the surgical procedure list used in patient surgical history." },
};

interface Props { initialTab?: TabKey; standalone?: boolean; }

export function ClinicalGoalsLibraryModule({ initialTab = "goals", standalone }: Props) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const currentMeta = TAB_META_GOALS[tab];

  const tabContent = (
    <>
      {tab === "goals"               && <GoalsTab />}
      {tab === "referral-dest"       && <ReferralDestTab />}
      {tab === "comorbidities"       && <ComorbiditiesTab />}
      {tab === "surgical-procedures" && <SurgicalProceduresTab />}
    </>
  );

  if (standalone) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex-none">
          <h2 className="text-lg font-black text-slate-800">{currentMeta.title}</h2>
          <p className="text-sm text-slate-400 mt-0.5">{currentMeta.sub}</p>
        </div>
        <div className="flex-1 overflow-hidden">{tabContent}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" style={{ color: ACCENT }} />
          Care Plan, Goals & Referrals
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage admin-level clinical content libraries</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
            style={tab === t.key ? { borderColor: ACCENT, color: ACCENT } : {}}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">{tabContent}</div>
    </div>
  );
}
