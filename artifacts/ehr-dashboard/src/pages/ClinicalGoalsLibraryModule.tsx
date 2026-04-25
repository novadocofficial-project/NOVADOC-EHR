import { useState } from "react";
import {
  Plus, Trash2, Edit2, Save, X, CheckCircle2, Search, Star,
  ClipboardCheck, Target, MapPin, Heart, ChevronDown, ChevronRight,
  GripVertical, Tag, ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const ACCENT = "#4982CF";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CareTask {
  id:        string;
  title:     string;
  category:  string;
  favourite: boolean;
}

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

const CARE_TASK_SEED: CareTask[] = [
  { id: "ct1",  title: "Guide patient for nasal drops",          category: "Patient Education",  favourite: true  },
  { id: "ct2",  title: "Inhaler technique demonstration",        category: "Patient Education",  favourite: false },
  { id: "ct3",  title: "Dietary counseling session",             category: "Patient Education",  favourite: true  },
  { id: "ct4",  title: "Wound dressing instructions",            category: "Wound & Procedure",  favourite: false },
  { id: "ct5",  title: "Suture/staple removal follow-up",        category: "Wound & Procedure",  favourite: false },
  { id: "ct6",  title: "Physiotherapy guidance",                 category: "Rehabilitation",     favourite: true  },
  { id: "ct7",  title: "Medication adherence counseling",        category: "Medication",         favourite: false },
  { id: "ct8",  title: "Insulin injection teaching",             category: "Medication",         favourite: true  },
  { id: "ct9",  title: "Blood glucose monitoring schedule",      category: "Monitoring",         favourite: false },
  { id: "ct10", title: "Schedule next clinic visit",             category: "Monitoring",         favourite: true  },
  { id: "ct11", title: "Social worker referral",                 category: "Social & Support",   favourite: false },
  { id: "ct12", title: "Caregiver/family education",             category: "Social & Support",   favourite: false },
];

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

const CARE_CATEGORIES = ["Patient Education","Wound & Procedure","Rehabilitation","Medication","Monitoring","Social & Support"];
const DEST_CATEGORIES: ReferralDest["category"][] = ["Hospital","Clinic","Diagnostic Lab","Pharmacy","Rehab Centre","Other"];
const COMORBIDITY_CATEGORIES = ["Cardiovascular","Endocrine","Respiratory","Renal","Neurological","Musculoskeletal","Gastroenterology","Haematology","Other"];

type TabKey = "care-plan" | "goals" | "referral-dest" | "comorbidities";

function uid() { return `x-${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }

// ─── Care Plan Tab ────────────────────────────────────────────────────────────

function CarePlanTab() {
  const [tasks, setTasks]   = useState<CareTask[]>(CARE_TASK_SEED);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"alpha" | "fav">("alpha");
  const [filterCat, setFilterCat] = useState("All");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCat, setEditCat]   = useState("");
  const [adding, setAdding]     = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat]     = useState(CARE_CATEGORIES[0]);

  const visible = tasks
    .filter(t =>
      (filterCat === "All" || t.category === filterCat) &&
      t.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "fav") return Number(b.favourite) - Number(a.favourite);
      return a.title.localeCompare(b.title);
    });

  function startEdit(t: CareTask) { setEditId(t.id); setEditTitle(t.title); setEditCat(t.category); }
  function cancelEdit() { setEditId(null); }
  function saveEdit(id: string) {
    if (!editTitle.trim()) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: editTitle.trim(), category: editCat } : t));
    setEditId(null);
  }
  function toggleFav(id: string) { setTasks(prev => prev.map(t => t.id === id ? { ...t, favourite: !t.favourite } : t)); }
  function remove(id: string) { setTasks(prev => prev.filter(t => t.id !== id)); }
  function addTask() {
    if (!newTitle.trim()) return;
    setTasks(prev => [...prev, { id: uid(), title: newTitle.trim(), category: newCat, favourite: false }]);
    setNewTitle(""); setAdding(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…" className="pl-8 h-8 text-xs" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...CARE_CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterCat === c ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
              style={filterCat === c ? { background: ACCENT } : {}}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={() => setSortBy(s => s === "alpha" ? "fav" : "alpha")}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 bg-white px-2.5 py-1 rounded-md transition-colors">
          <ArrowUpDown className="h-3 w-3" />
          {sortBy === "alpha" ? "A–Z" : "Favourites"}
        </button>
        <Button size="sm" onClick={() => setAdding(true)} style={{ background: ACCENT }} className="text-white text-xs gap-1">
          <Plus className="h-3.5 w-3.5" /> Add Task
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5">
        {adding && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
            <GripVertical className="h-4 w-4 text-slate-300" />
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()}
              placeholder="Task title" className="h-7 text-xs flex-1" autoFocus />
            <select value={newCat} onChange={e => setNewCat(e.target.value)}
              className="h-7 text-xs border border-slate-200 rounded px-1.5 bg-white">
              {CARE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <Button size="sm" className="h-7 text-xs text-white" style={{ background: ACCENT }} onClick={addTask}>Add</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /></Button>
          </div>
        )}
        {visible.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
            <GripVertical className="h-4 w-4 text-slate-300 cursor-grab" />
            {editId === t.id ? (
              <>
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit(t.id)}
                  className="h-7 text-xs flex-1" autoFocus />
                <select value={editCat} onChange={e => setEditCat(e.target.value)}
                  className="h-7 text-xs border border-slate-200 rounded px-1.5 bg-white">
                  {CARE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <Button size="sm" className="h-7 text-xs text-white" style={{ background: ACCENT }} onClick={() => saveEdit(t.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}><X className="h-3.5 w-3.5" /></Button>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-700">{t.title}</span>
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">{t.category}</Badge>
                </div>
                <button onClick={() => toggleFav(t.id)} className={t.favourite ? "text-amber-400" : "text-slate-300 hover:text-amber-400 transition-colors"}>
                  <Star className="h-4 w-4 fill-current" />
                </button>
                <button onClick={() => startEdit(t)} className="text-slate-400 hover:text-slate-700 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </>
            )}
          </div>
        ))}
        {visible.length === 0 && !adding && (
          <div className="text-center py-16 text-slate-400 text-sm">No tasks found.</div>
        )}
      </div>
    </div>
  );
}

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

function ReferralDestTab() {
  const [dests, setDests]   = useState<ReferralDest[]>(DEST_SEED);
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
    if (isNew) setDests(prev => [...prev, drawer]);
    else setDests(prev => prev.map(d => d.id === drawer!.id ? drawer! : d));
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
              <button onClick={() => setDests(prev => prev.filter(x => x.id !== d.id))}
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

function ComorbiditiesTab() {
  const [items, setItems]   = useState<Comorbidity[]>(COMORBIDITY_SEED);
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

// ─── Main Module ──────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "care-plan",     label: "Care Plan Tasks",      icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
  { key: "goals",         label: "Patient Goals",        icon: <Target className="h-3.5 w-3.5" /> },
  { key: "referral-dest", label: "Referral Destinations",icon: <MapPin className="h-3.5 w-3.5" /> },
  { key: "comorbidities", label: "Comorbidities",        icon: <Heart className="h-3.5 w-3.5" /> },
];

interface Props { initialTab?: TabKey; }

export function ClinicalGoalsLibraryModule({ initialTab = "care-plan" }: Props) {
  const [tab, setTab] = useState<TabKey>(initialTab);

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
      <div className="flex-1 overflow-hidden">
        {tab === "care-plan"     && <CarePlanTab />}
        {tab === "goals"         && <GoalsTab />}
        {tab === "referral-dest" && <ReferralDestTab />}
        {tab === "comorbidities" && <ComorbiditiesTab />}
      </div>
    </div>
  );
}
