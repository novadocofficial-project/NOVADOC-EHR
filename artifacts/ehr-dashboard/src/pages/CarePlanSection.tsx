import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, X, Search, CheckCircle2, ClipboardCheck,
  Plus, Star, Pencil, AlertCircle, ClipboardList,
} from "lucide-react";

// ─── Predefined Task Database ─────────────────────────────────────────────────

interface TaskDef {
  id:       string;
  title:    string;
  category: string;
}

const TASK_DEFS: TaskDef[] = [
  // Patient Education
  { id: "nasal-drops",       title: "Guide patient for nasal drops",            category: "Patient Education" },
  { id: "inhaler-technique", title: "Inhaler technique demonstration",           category: "Patient Education" },
  { id: "diet-counseling",   title: "Dietary counseling session",                category: "Patient Education" },
  { id: "diabetes-edu",      title: "Diabetes self-management education",        category: "Patient Education" },
  { id: "bp-monitoring",     title: "Home blood pressure monitoring guidance",   category: "Patient Education" },
  { id: "weight-log",        title: "Daily weight monitoring instruction",       category: "Patient Education" },
  // Wound & Procedure Care
  { id: "wound-dressing",    title: "Wound dressing instructions",               category: "Wound & Procedure Care" },
  { id: "suture-removal",    title: "Suture/staple removal follow-up",           category: "Wound & Procedure Care" },
  { id: "drain-care",        title: "Drain/tube care instructions",              category: "Wound & Procedure Care" },
  { id: "stoma-care",        title: "Stoma care and management",                 category: "Wound & Procedure Care" },
  { id: "catheter-care",     title: "Urinary catheter care",                     category: "Wound & Procedure Care" },
  // Rehabilitation
  { id: "physio-guidance",   title: "Physiotherapy guidance",                    category: "Rehabilitation" },
  { id: "occ-therapy",       title: "Occupational therapy referral",             category: "Rehabilitation" },
  { id: "speech-therapy",    title: "Speech and language therapy",               category: "Rehabilitation" },
  { id: "gait-training",     title: "Gait training and mobility exercises",      category: "Rehabilitation" },
  { id: "respiratory-rehab", title: "Respiratory rehabilitation exercises",      category: "Rehabilitation" },
  // Medication & Pharmacy
  { id: "med-adherence",     title: "Medication adherence counseling",           category: "Medication & Pharmacy" },
  { id: "pill-organizer",    title: "Pill organizer and schedule setup",         category: "Medication & Pharmacy" },
  { id: "insulin-teaching",  title: "Insulin injection teaching",               category: "Medication & Pharmacy" },
  { id: "anticoag-monitor",  title: "Anticoagulation monitoring plan",           category: "Medication & Pharmacy" },
  // Monitoring & Follow-up
  { id: "vitals-check",      title: "Vital signs monitoring",                    category: "Monitoring & Follow-up" },
  { id: "glucose-monitoring",title: "Blood glucose monitoring schedule",         category: "Monitoring & Follow-up" },
  { id: "ecg-monitoring",    title: "Cardiac rhythm monitoring",                 category: "Monitoring & Follow-up" },
  { id: "spo2-monitoring",   title: "Oxygen saturation monitoring",              category: "Monitoring & Follow-up" },
  { id: "followup-call",     title: "Telephone follow-up call",                  category: "Monitoring & Follow-up" },
  { id: "next-visit-sched",  title: "Schedule next clinic visit",                category: "Monitoring & Follow-up" },
  // Social & Support
  { id: "social-work",       title: "Social worker referral",                    category: "Social & Support" },
  { id: "transport-arrange",  title: "Patient transport arrangement",            category: "Social & Support" },
  { id: "caregiver-edu",     title: "Caregiver/family education",               category: "Social & Support" },
  { id: "mental-health-ref", title: "Mental health referral",                    category: "Social & Support" },
];

// ─── Staff List ───────────────────────────────────────────────────────────────

interface StaffMember {
  id:   string;
  name: string;
  role: string;
}

const STAFF: StaffMember[] = [
  { id: "cm-1",  name: "Sarah Mitchell",    role: "Care Manager"  },
  { id: "cm-2",  name: "James Thompson",    role: "Care Manager"  },
  { id: "cm-3",  name: "Priya Nair",        role: "Care Manager"  },
  { id: "ns-1",  name: "Emily Rodriguez",   role: "Nurse"         },
  { id: "ns-2",  name: "Michael Chen",      role: "Nurse"         },
  { id: "ns-3",  name: "Fatima Al-Hassan",  role: "Nurse"         },
  { id: "ns-4",  name: "David Okafor",      role: "Nurse"         },
  { id: "ss-1",  name: "Patricia Brown",    role: "Support Staff" },
  { id: "ss-2",  name: "Robert Kim",        role: "Support Staff" },
  { id: "ph-1",  name: "Amanda Singh",      role: "Pharmacist"    },
  { id: "pt-1",  name: "Carlos Mendes",     role: "Physiotherapist"},
];

// ─── Favourites (localStorage) ────────────────────────────────────────────────

const FAVS_KEY = "careplan_fav_taskIds";
function loadFavs(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(FAVS_KEY) ?? "[]")); } catch { return new Set(); }
}
function persistFavs(s: Set<string>) {
  localStorage.setItem(FAVS_KEY, JSON.stringify([...s]));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CarePlanTask {
  uid:      string;
  taskId:   string;
  title:    string;
  assignee: string;
  dueDate:  string;
  priority: "Normal" | "Urgent";
  notes:    string;
}

export interface CarePlanData {
  tasks: CarePlanTask[];
  instructions?: string;
}

export const EMPTY_CARE_PLAN: CarePlanData = { tasks: [], instructions: "" };

// ─── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ p }: { p: "Normal" | "Urgent" }) {
  return (
    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${
      p === "Urgent" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
    }`}>{p}</span>
  );
}

// ─── Task Search Dropdown ─────────────────────────────────────────────────────

function TaskSearch({
  favs, onToggleFav, onSelect,
}: {
  favs: Set<string>;
  onToggleFav: (id: string, fav: boolean) => void;
  onSelect: (task: TaskDef | { id: "custom"; title: string }) => void;
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

  const favTasks = TASK_DEFS.filter(t => favs.has(t.id));
  const matched  = q
    ? TASK_DEFS.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    : TASK_DEFS;

  const grouped = matched.reduce<Record<string, TaskDef[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  function pick(t: TaskDef) {
    onSelect(t);
    setQuery("");
    setOpen(false);
  }

  function pickCustom() {
    onSelect({ id: "custom", title: query.trim() });
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl focus-within:border-emerald-400/50 focus-within:ring-1 focus-within:ring-emerald-400/20 transition-all">
        <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search task or type a custom task…"
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

          {/* Custom task row (when query typed) */}
          {q && (
            <div>
              <button onClick={pickCustom}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-emerald-50 transition-colors border-b border-slate-100 text-left">
                <Plus className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wide">Add custom task</p>
                  <p className="text-xs font-semibold text-slate-700">"{query.trim()}"</p>
                </div>
              </button>
            </div>
          )}

          {/* Favourites */}
          {!q && favTasks.length > 0 && (
            <div>
              <p className="px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Favourites
              </p>
              {favTasks.map(t => (
                <TaskRow key={t.id} task={t} favs={favs} onToggleFav={onToggleFav} onPick={() => pick(t)} />
              ))}
              <div className="border-t border-slate-100 mx-3 my-1" />
            </div>
          )}

          {/* Grouped by category */}
          {Object.entries(grouped).map(([cat, tasks]) => (
            <div key={cat}>
              <p className="px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest text-emerald-500">{cat}</p>
              {tasks.map(t => (
                <TaskRow key={t.id} task={t} favs={favs} onToggleFav={onToggleFav} onPick={() => pick(t)} />
              ))}
            </div>
          ))}

          {Object.keys(grouped).length === 0 && !q && (
            <p className="px-4 py-4 text-xs text-slate-400 italic text-center">No task found</p>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, favs, onToggleFav, onPick }: {
  task: TaskDef;
  favs: Set<string>;
  onToggleFav: (id: string, fav: boolean) => void;
  onPick: () => void;
}) {
  const isFav = favs.has(task.id);
  return (
    <div className="flex items-center gap-1 px-3 hover:bg-emerald-50 transition-colors group border-b border-slate-50 last:border-0">
      <button onClick={e => { e.stopPropagation(); onToggleFav(task.id, !isFav); }} className="p-1 flex-shrink-0">
        <Star className={`h-3 w-3 transition-colors ${isFav ? "fill-amber-400 text-amber-400" : "text-slate-200 group-hover:text-slate-300"}`} />
      </button>
      <button onClick={onPick} className="flex-1 py-2 text-left">
        <p className="text-xs font-semibold text-slate-800">{task.title}</p>
      </button>
    </div>
  );
}

// ─── Chips Panel ──────────────────────────────────────────────────────────────

export function CarePlanChipsPanel({ data, onOpen }: { data: CarePlanData; onOpen: () => void }) {
  if (data.tasks.length === 0) {
    return (
      <button onClick={onOpen}
        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl bg-emerald-50/60 border-2 border-dashed border-emerald-200 text-emerald-600 font-bold text-xs hover:border-emerald-400 hover:bg-emerald-50 transition-all">
        <Plus className="h-4 w-4 flex-shrink-0" />
        Assign care tasks…
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {data.tasks.map(t => (
        <div key={t.uid} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40">
          <ClipboardList className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[11px] font-black text-emerald-800">{t.title}</p>
              <PriorityBadge p={t.priority} />
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {t.assignee && <><span className="font-medium">{t.assignee}</span> · </>}{t.dueDate || "No due date"}
            </p>
            {t.notes && <p className="text-[9px] text-slate-400 mt-0.5 italic truncate">{t.notes}</p>}
          </div>
        </div>
      ))}
      <button onClick={onOpen}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl border border-emerald-200 text-emerald-600 text-xs font-bold hover:bg-emerald-50 transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Edit care plan ({data.tasks.length} task{data.tasks.length !== 1 ? "s" : ""})
      </button>
    </div>
  );
}

// ─── Small Select ─────────────────────────────────────────────────────────────

function Sel({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 pr-7 outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 transition-colors">
        {children}
      </select>
      <svg className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

// ─── Care Plan Drawer ─────────────────────────────────────────────────────────

const EMPTY_FORM: { title: string; taskId: string; assignee: string; dueDate: string; priority: "Normal" | "Urgent"; notes: string } = { title: "", taskId: "", assignee: "", dueDate: "", priority: "Normal", notes: "" };

interface CarePlanDrawerProps {
  savedData: CarePlanData;
  onSave:    (data: CarePlanData) => void;
  onClose:   () => void;
}

export function CarePlanDrawer({ savedData, onSave, onClose }: CarePlanDrawerProps) {
  const [tasks,      setTasks]      = useState<CarePlanTask[]>(savedData.tasks);
  const [favs,       setFavs]       = useState<Set<string>>(loadFavs);
  const [selTask,    setSelTask]     = useState<{ id: string; title: string } | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editingUid, setEditingUid] = useState<string | null>(null);

  const canAdd = selTask !== null && form.assignee !== "" && form.dueDate !== "";

  function setF<K extends keyof typeof EMPTY_FORM>(k: K, v: typeof EMPTY_FORM[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function toggleFav(id: string, fav: boolean) {
    setFavs(prev => {
      const next = new Set(prev);
      fav ? next.add(id) : next.delete(id);
      persistFavs(next);
      return next;
    });
  }

  function selectTask(t: TaskDef | { id: "custom"; title: string }) {
    setSelTask({ id: t.id, title: t.title });
    setForm({ ...EMPTY_FORM, title: t.title, taskId: t.id });
    setEditingUid(null);
  }

  function handleAdd() {
    if (!selTask || !canAdd) return;
    const entry: CarePlanTask = {
      uid:      editingUid ?? `cp-${Date.now()}`,
      taskId:   form.taskId,
      title:    form.title || selTask.title,
      assignee: form.assignee,
      dueDate:  form.dueDate,
      priority: form.priority,
      notes:    form.notes,
    };
    setTasks(prev => editingUid ? prev.map(t => t.uid === editingUid ? entry : t) : [...prev, entry]);
    setSelTask(null); setForm(EMPTY_FORM); setEditingUid(null);
  }

  function startEdit(t: CarePlanTask) {
    setSelTask({ id: t.taskId, title: t.title });
    setForm({ title: t.title, taskId: t.taskId, assignee: t.assignee, dueDate: t.dueDate, priority: t.priority, notes: t.notes });
    setEditingUid(t.uid);
  }

  function removeTask(uid: string) {
    setTasks(prev => prev.filter(t => t.uid !== uid));
    if (editingUid === uid) { setSelTask(null); setForm(EMPTY_FORM); setEditingUid(null); }
  }

  function saveAndClose() {
    onSave({ tasks });
    onClose();
  }

  // Group staff by role for the assignee dropdown
  const staffByRole = STAFF.reduce<Record<string, StaffMember[]>>((acc, s) => {
    (acc[s.role] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="absolute inset-y-0 right-0 w-[68%] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-20">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button onClick={saveAndClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Assessment &amp; Plan</p>
          <p className="text-sm font-black text-slate-800">Care Plan</p>
        </div>
        {tasks.length > 0 ? (
          <button onClick={saveAndClose}
            className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0 hover:bg-emerald-100 transition-colors">
            <CheckCircle2 className="h-3 w-3" /> Done
          </button>
        ) : (
          <button onClick={saveAndClose}
            className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex-shrink-0">
            <ClipboardCheck className="h-3.5 w-3.5" /> Save
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Add / Edit form */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5">
            {editingUid ? "Edit Task" : "Add Task"}
          </p>

          <TaskSearch favs={favs} onToggleFav={toggleFav} onSelect={selectTask} />

          {selTask && (
            <div className="mt-3 border border-emerald-100 rounded-xl bg-emerald-50/30 p-3 space-y-3">
              {/* Task title */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Task</label>
                  <input
                    value={form.title}
                    onChange={e => setF("title", e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                  />
                </div>
                <button onClick={() => { setSelTask(null); setForm(EMPTY_FORM); setEditingUid(null); }}
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 mt-4">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Row: Assignee + Due Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">
                    Assign To <span className="text-red-400">*</span>
                  </label>
                  <Sel value={form.assignee} onChange={v => setF("assignee", v)}>
                    <option value="">Select staff…</option>
                    {Object.entries(staffByRole).map(([role, members]) => (
                      <optgroup key={role} label={role}>
                        {members.map(m => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </Sel>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">
                    Due Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setF("dueDate", e.target.value)}
                    className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                  />
                </div>
              </div>

              {/* Priority toggle */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Priority</label>
                <div className="flex gap-2">
                  {(["Normal", "Urgent"] as const).map(p => (
                    <button key={p} onClick={() => setF("priority", p)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all"
                      style={form.priority === p
                        ? p === "Urgent"
                          ? { background: "#ef4444", color: "#fff", borderColor: "#ef4444" }
                          : { background: "#64748b", color: "#fff", borderColor: "#64748b" }
                        : p === "Urgent"
                          ? { background: "#fef2f2", color: "#ef4444", borderColor: "#fecaca" }
                          : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
                      }>
                      {p === "Urgent" && <AlertCircle className="h-3 w-3" />}
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Notes / Instructions</label>
                <textarea
                  value={form.notes}
                  onChange={e => setF("notes", e.target.value)}
                  rows={2}
                  placeholder="Any specific instructions for the assignee…"
                  className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 transition-all resize-none placeholder:text-slate-300"
                />
              </div>

              {/* Add button */}
              <div className="flex justify-end">
                <button onClick={handleAdd} disabled={!canAdd}
                  className="flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                  {editingUid ? "Update Task" : "Add Task"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tasks list */}
        {tasks.length > 0 && (
          <>
            <div className="border-t border-slate-100 mx-4" />
            <div className="px-4 pt-3 pb-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5">
                Care Tasks ({tasks.length})
              </p>
              <div className="space-y-2">
                {tasks.map(t => {
                  const isEditing = editingUid === t.uid;
                  return (
                    <div key={t.uid}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all"
                      style={{ borderColor: isEditing ? "#6ee7b7" : "#a7f3d0", backgroundColor: isEditing ? "#ecfdf5" : "#f0fdf4" }}>
                      <ClipboardList className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[11px] font-black text-slate-800">{t.title}</p>
                          <PriorityBadge p={t.priority} />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {t.assignee && <><span className="font-medium">{t.assignee}</span> · </>}
                          {t.dueDate ? new Date(t.dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "No due date"}
                        </p>
                        {t.notes && <p className="text-[9px] text-slate-400 mt-0.5 italic">{t.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => startEdit(t)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg border border-transparent hover:border-emerald-100 hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 transition-colors">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button onClick={() => removeTask(t.uid)}
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
      </div>
    </div>
  );
}
