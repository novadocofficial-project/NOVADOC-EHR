import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, X, Search, CheckCircle2, ClipboardCheck,
  Plus, Star, Pencil, Stethoscope, Trash2, Clock, CalendarDays,
  AlertCircle, RefreshCw,
} from "lucide-react";

// ─── Procedure Database ───────────────────────────────────────────────────────

interface ProcDef {
  id:       string;
  name:     string;
  cpt:      string;
  category: string;
}

const PROC_DEFS: ProcDef[] = [
  // Respiratory
  { id: "nebulization",       name: "Nebulization",                         cpt: "94640", category: "Respiratory"       },
  { id: "oxygen-therapy",     name: "Oxygen Therapy",                       cpt: "94002", category: "Respiratory"       },
  { id: "peak-flow",          name: "Peak Flow Measurement",                cpt: "94150", category: "Respiratory"       },
  { id: "suction",            name: "Airway Suctioning",                    cpt: "31500", category: "Respiratory"       },
  // Vascular Access
  { id: "iv-cannulation",     name: "IV Cannulation",                       cpt: "36000", category: "Vascular Access"   },
  { id: "iv-drip",            name: "IV Drip Setup & Administration",       cpt: "96360", category: "Vascular Access"   },
  { id: "iv-push",            name: "IV Push Injection",                    cpt: "96374", category: "Vascular Access"   },
  { id: "im-injection",       name: "Intramuscular Injection",              cpt: "96372", category: "Vascular Access"   },
  { id: "blood-draw",         name: "Blood Draw / Venipuncture",            cpt: "36415", category: "Vascular Access"   },
  { id: "central-line",       name: "Central Line Care & Flush",            cpt: "36556", category: "Vascular Access"   },
  // Wound Care
  { id: "wound-dressing",     name: "Wound Dressing & Care",                cpt: "97602", category: "Wound Care"        },
  { id: "suturing",           name: "Wound Suturing / Laceration Repair",   cpt: "12001", category: "Wound Care"        },
  { id: "staple-removal",     name: "Staple Removal",                       cpt: "99024", category: "Wound Care"        },
  { id: "suture-removal",     name: "Suture Removal",                       cpt: "99024", category: "Wound Care"        },
  { id: "debridement",        name: "Wound Debridement",                    cpt: "97597", category: "Wound Care"        },
  { id: "packing",            name: "Wound Packing",                        cpt: "10160", category: "Wound Care"        },
  // Urinary
  { id: "catheterization",    name: "Urinary Catheterization",              cpt: "51701", category: "Urinary"           },
  { id: "catheter-care",      name: "Catheter Care & Irrigation",           cpt: "51700", category: "Urinary"           },
  { id: "catheter-removal",   name: "Urinary Catheter Removal",             cpt: "51702", category: "Urinary"           },
  { id: "bladder-scan",       name: "Bladder Scan (Ultrasound)",            cpt: "51798", category: "Urinary"           },
  // GI / Enteral
  { id: "ng-tube",            name: "Nasogastric Tube Insertion",           cpt: "43752", category: "GI / Enteral"      },
  { id: "ng-feeding",         name: "Nasogastric Tube Feeding",             cpt: "43753", category: "GI / Enteral"      },
  { id: "enema",              name: "Enema Administration",                 cpt: "45399", category: "GI / Enteral"      },
  // Monitoring
  { id: "ecg",                name: "12-Lead ECG",                          cpt: "93000", category: "Monitoring"        },
  { id: "vitals",             name: "Vital Signs Monitoring",               cpt: "99213", category: "Monitoring"        },
  { id: "blood-glucose",      name: "Blood Glucose Monitoring",             cpt: "82947", category: "Monitoring"        },
  { id: "orthostatic-bp",     name: "Orthostatic Blood Pressure",           cpt: "93784", category: "Monitoring"        },
  { id: "spo2",               name: "Oxygen Saturation (SpO₂) Monitoring", cpt: "94760", category: "Monitoring"        },
  // Orthopaedic / Immobilisation
  { id: "splinting",          name: "Splinting / Immobilisation",           cpt: "29125", category: "Orthopaedic"       },
  { id: "plaster",            name: "Plaster Cast Application",             cpt: "29405", category: "Orthopaedic"       },
  { id: "cast-removal",       name: "Cast Removal",                         cpt: "29700", category: "Orthopaedic"       },
  // ENT
  { id: "ear-syringing",      name: "Ear Syringing / Irrigation",           cpt: "69209", category: "ENT"               },
  { id: "nasal-packing",      name: "Nasal Packing",                        cpt: "30901", category: "ENT"               },
  // Other
  { id: "sc-injection",       name: "Subcutaneous Injection",               cpt: "96372", category: "Other"             },
  { id: "id-injection",       name: "Intradermal Injection",                cpt: "96372", category: "Other"             },
  { id: "proctoscopy",        name: "Proctoscopy",                          cpt: "46600", category: "Other"             },
];

const PROC_CATEGORIES = [...new Set(PROC_DEFS.map(p => p.category))];

// ─── Staff List ───────────────────────────────────────────────────────────────

const NURSING_STAFF = [
  { id: "ns-1",  name: "Emily Rodriguez",   role: "Nurse"          },
  { id: "ns-2",  name: "Michael Chen",      role: "Nurse"          },
  { id: "ns-3",  name: "Fatima Al-Hassan",  role: "Nurse"          },
  { id: "ns-4",  name: "David Okafor",      role: "Nurse"          },
  { id: "ns-5",  name: "Layla Al-Rashidi",  role: "Nurse"          },
  { id: "cm-1",  name: "Sarah Mitchell",    role: "Care Manager"   },
  { id: "cm-2",  name: "James Thompson",    role: "Care Manager"   },
  { id: "pt-1",  name: "Carlos Mendes",     role: "Physiotherapist"},
  { id: "rt-1",  name: "Amina Yousuf",      role: "Respiratory Therapist"},
  { id: "dept-1",name: "Radiology Dept",    role: "Department"     },
  { id: "dept-2",name: "Physiotherapy Dept",role: "Department"     },
  { id: "dept-3",name: "Respiratory Dept",  role: "Department"     },
];

// ─── Favourites (localStorage) ────────────────────────────────────────────────

const PROC_FAVS_KEY = "procorders_fav_ids";
function loadProcFavs(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(PROC_FAVS_KEY) ?? "[]")); } catch { return new Set(); }
}
function saveProcFavs(s: Set<string>) {
  localStorage.setItem(PROC_FAVS_KEY, JSON.stringify([...s]));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProcedureOrder {
  uid:          string;
  procId:       string;
  name:         string;
  cpt:          string;
  isCustom:     boolean;
  indication:   string;
  priority:     "Normal" | "Urgent";
  timing:       "Immediate" | "Scheduled";
  scheduledAt:  string;
  repeat:       boolean;
  instructions: string;
  assignedTo:   string;
}

export interface ProcedureOrdersData {
  orders: ProcedureOrder[];
}

export const EMPTY_PROCEDURE_ORDERS: ProcedureOrdersData = { orders: [] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function blankOrder(name = "", procId = "", cpt = "", isCustom = false): ProcedureOrder {
  return {
    uid: uid(), procId, name, cpt, isCustom,
    indication: "", priority: "Normal", timing: "Immediate",
    scheduledAt: "", repeat: false, instructions: "", assignedTo: "",
  };
}

// ─── Procedure Search Dropdown ────────────────────────────────────────────────

interface ProcSearchProps {
  favs:       Set<string>;
  onFav:      (id: string, f: boolean) => void;
  onSelect:   (p: ProcDef | { id: "custom"; name: string }) => void;
}

function ProcSearch({ favs, onFav, onSelect }: ProcSearchProps) {
  const [query,   setQuery]   = useState("");
  const [open,    setOpen]    = useState(false);
  const [catFilter, setCatFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (!ref.current?.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const q = query.toLowerCase().trim();
  const favProcs = PROC_DEFS.filter(p => favs.has(p.id));
  const matched  = PROC_DEFS.filter(p =>
    (catFilter ? p.category === catFilter : true) &&
    (q ? p.name.toLowerCase().includes(q) || p.cpt.includes(q) || p.category.toLowerCase().includes(q) : true)
  );

  const grouped = matched.reduce<Record<string, ProcDef[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  function pick(p: ProcDef) { onSelect(p); setQuery(""); setOpen(false); setCatFilter(""); }
  function pickCustom() {
    if (!query.trim()) return;
    onSelect({ id: "custom", name: query.trim() });
    setQuery(""); setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl focus-within:ring-1 focus-within:ring-teal-400/40 focus-within:border-teal-300 transition-all">
        <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        <input
          className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400"
          placeholder="Search or type custom procedure…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {query && (
          <button className="text-slate-300 hover:text-red-400" onClick={() => { setQuery(""); setOpen(false); }}>
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          {/* Category filter strip */}
          <div className="flex gap-1 p-2 bg-slate-50 border-b border-slate-100 overflow-x-auto scrollbar-hide">
            {["", ...PROC_CATEGORIES].map(c => (
              <button key={c}
                className="flex-shrink-0 text-[9px] font-bold px-2 py-1 rounded-full border transition-all"
                style={catFilter === c ? { background: "#0d9488", color: "white", borderColor: "#0d9488" } : { borderColor: "#e2e8f0", color: "#64748b" }}
                onClick={() => setCatFilter(c)}>
                {c || "All"}
              </button>
            ))}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {/* Favourites (only when no query) */}
            {!q && !catFilter && favProcs.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-amber-600 uppercase px-3 pt-2 pb-1 flex items-center gap-1">
                  <Star className="h-2.5 w-2.5 fill-current" /> Favourites
                </p>
                {favProcs.map(p => (
                  <button key={p.id} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-amber-50 border-b border-slate-50"
                    onClick={() => pick(p)}>
                    <span className="flex-1 font-medium text-slate-700">{p.name}</span>
                    <span className="text-[9px] text-teal-500 font-mono bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">CPT {p.cpt}</span>
                    <button className="text-amber-400 hover:text-amber-600 p-0.5"
                      onClick={e => { e.stopPropagation(); onFav(p.id, false); }}>
                      <Star className="h-3 w-3 fill-current" />
                    </button>
                  </button>
                ))}
              </div>
            )}

            {/* Grouped results */}
            {Object.entries(grouped).map(([cat, procs]) => (
              <div key={cat}>
                <p className="text-[9px] font-black text-slate-400 uppercase px-3 pt-2 pb-1 bg-slate-50">{cat}</p>
                {procs.map(p => (
                  <button key={p.id} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-teal-50 border-b border-slate-50 last:border-0"
                    onClick={() => pick(p)}>
                    <span className="flex-1 font-medium text-slate-700">{p.name}</span>
                    <span className="text-[9px] text-teal-500 font-mono bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">CPT {p.cpt}</span>
                    <button className="text-slate-200 hover:text-amber-400 p-0.5 flex-shrink-0 transition-colors"
                      onClick={e => {
                        e.stopPropagation();
                        const next = new Set(favs);
                        favs.has(p.id) ? next.delete(p.id) : next.add(p.id);
                        onFav(p.id, !favs.has(p.id));
                      }}>
                      <Star className={`h-3 w-3 ${favs.has(p.id) ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                  </button>
                ))}
              </div>
            ))}

            {/* Custom entry */}
            {query.trim() && (
              <button className="w-full text-left px-3 py-2.5 text-xs text-teal-600 font-bold hover:bg-teal-50 flex items-center gap-2 border-t border-slate-100"
                onClick={pickCustom}>
                <Plus className="h-3.5 w-3.5" />
                Add custom: "{query.trim()}"
              </button>
            )}

            {Object.keys(grouped).length === 0 && !query.trim() && (
              <p className="text-xs text-slate-400 text-center py-5">No procedures match</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Single Procedure Order Row ───────────────────────────────────────────────

interface OrderRowProps {
  order:    ProcedureOrder;
  index:    number;
  onChange: (o: ProcedureOrder) => void;
  onDelete: () => void;
}

function OrderRow({ order, index, onChange, onDelete }: OrderRowProps) {
  const [expanded, setExpanded] = useState(true);
  const set = (k: keyof ProcedureOrder, v: unknown) => onChange({ ...order, [k]: v } as ProcedureOrder);

  const urgentStyle   = { background: "#fef2f2", borderColor: "#fca5a5" };
  const normalStyle   = { background: "#f8fafc", borderColor: "#e2e8f0" };

  return (
    <div className="rounded-xl border-2 overflow-hidden transition-all"
      style={order.priority === "Urgent" ? urgentStyle : normalStyle}>

      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
        onClick={() => setExpanded(x => !x)}>
        <div className="h-5 w-5 rounded-lg bg-teal-500 text-white flex items-center justify-center text-[9px] font-black flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-700 truncate">{order.name}</p>
          {order.cpt && <p className="text-[9px] text-teal-500 font-mono">CPT {order.cpt}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${order.priority === "Urgent" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
            {order.priority}
          </span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${order.timing === "Immediate" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"}`}>
            {order.timing === "Immediate" ? <Clock className="h-2 w-2" /> : <CalendarDays className="h-2 w-2" />}
            {order.timing}
          </span>
          <button className="text-slate-300 hover:text-red-400 transition-colors p-0.5" onClick={e => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded fields */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3 bg-white/60">

          {/* Indication */}
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Indication / Reason</p>
            <input className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-300"
              placeholder="Why is this procedure needed?"
              value={order.indication}
              onChange={e => set("indication", e.target.value)} />
          </div>

          {/* Priority + Timing row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Priority</p>
              <div className="flex gap-1.5">
                {(["Normal", "Urgent"] as const).map(p => (
                  <button key={p} onClick={() => set("priority", p)}
                    className="flex-1 text-[10px] font-bold py-1 rounded-lg border-2 transition-all"
                    style={order.priority === p
                      ? p === "Urgent" ? { background: "#ef4444", color: "white", borderColor: "#ef4444" }
                                       : { background: "#6366f1", color: "white", borderColor: "#6366f1" }
                      : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Timing</p>
              <div className="flex gap-1.5">
                {(["Immediate", "Scheduled"] as const).map(t => (
                  <button key={t} onClick={() => set("timing", t)}
                    className="flex-1 text-[10px] font-bold py-1 rounded-lg border-2 transition-all"
                    style={order.timing === t
                      ? t === "Immediate" ? { background: "#f97316", color: "white", borderColor: "#f97316" }
                                          : { background: "#3b82f6", color: "white", borderColor: "#3b82f6" }
                      : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scheduled date/time (only if Scheduled) */}
          {order.timing === "Scheduled" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Date &amp; Time</p>
                <input type="datetime-local"
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
                  value={order.scheduledAt}
                  onChange={e => set("scheduledAt", e.target.value)} />
              </div>
              <div className="flex flex-col justify-end">
                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Repeat</p>
                <button onClick={() => set("repeat", !order.repeat)}
                  className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all"
                  style={order.repeat
                    ? { background: "#8b5cf6", color: "white", borderColor: "#8b5cf6" }
                    : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }}>
                  <RefreshCw className="h-3 w-3" />
                  {order.repeat ? "Repeat On" : "Once Only"}
                </button>
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Special Instructions</p>
            <textarea rows={2}
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-300 resize-none"
              placeholder="Use sterile technique, monitor vitals during procedure…"
              value={order.instructions}
              onChange={e => set("instructions", e.target.value)} />
          </div>

          {/* Assign To */}
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Assign To</p>
            <select className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
              value={order.assignedTo}
              onChange={e => set("assignedTo", e.target.value)}>
              <option value="">— Unassigned —</option>
              <optgroup label="Nurses">
                {NURSING_STAFF.filter(s => s.role === "Nurse").map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </optgroup>
              <optgroup label="Care Managers">
                {NURSING_STAFF.filter(s => s.role === "Care Manager").map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </optgroup>
              <optgroup label="Therapists &amp; Departments">
                {NURSING_STAFF.filter(s => !["Nurse","Care Manager"].includes(s.role)).map(s => (
                  <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                ))}
              </optgroup>
            </select>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Procedure Orders Drawer ──────────────────────────────────────────────────

interface ProcedureOrdersDrawerProps {
  savedData: ProcedureOrdersData;
  onSave:    (d: ProcedureOrdersData) => void;
  onClose:   () => void;
}

export function ProcedureOrdersDrawer({ savedData, onSave, onClose }: ProcedureOrdersDrawerProps) {
  const [orders, setOrders] = useState<ProcedureOrder[]>(savedData.orders);
  const [favs,   setFavs]   = useState<Set<string>>(loadProcFavs);

  function toggleFav(id: string, add: boolean) {
    setFavs(prev => {
      const next = new Set(prev);
      add ? next.add(id) : next.delete(id);
      saveProcFavs(next);
      return next;
    });
  }

  function addOrder(p: ProcDef | { id: "custom"; name: string }) {
    const cpt = (p as ProcDef).cpt ?? "";
    setOrders(prev => [...prev, blankOrder(p.name, p.id, cpt, p.id === "custom")]);
  }

  function updateOrder(uid: string, updated: ProcedureOrder) {
    setOrders(prev => prev.map(o => o.uid === uid ? updated : o));
  }

  function deleteOrder(uid: string) {
    setOrders(prev => prev.filter(o => o.uid !== uid));
  }

  function handleCommit() {
    onSave({ orders });
    onClose();
  }

  return (
    <div className="absolute inset-y-0 right-0 w-[68%] z-20 flex flex-col bg-white border-l border-slate-200 shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #0d948810 0%, #10b98110 100%)" }}>
        <button className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0" onClick={onClose}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#0d9488" }}>
          <Stethoscope className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-800">Procedure Orders</p>
          <p className="text-[10px] text-slate-500">Doctor → Nursing / Clinical Staff Instructions</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Add procedure search */}
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Add Procedure</p>
          <ProcSearch favs={favs} onFav={toggleFav} onSelect={addOrder} />
        </div>

        {/* Order list */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-3">
              <Stethoscope className="h-6 w-6 text-teal-200" />
            </div>
            <p className="text-sm font-bold text-slate-400">No procedures ordered yet</p>
            <p className="text-xs text-slate-300 mt-1">Use the search above to add a procedure</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
              {orders.length} Procedure{orders.length !== 1 ? "s" : ""} Ordered
            </p>
            {orders.map((o, i) => (
              <OrderRow
                key={o.uid}
                order={o}
                index={i}
                onChange={updated => updateOrder(o.uid, updated)}
                onDelete={() => deleteOrder(o.uid)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-100 flex-shrink-0 bg-white">
        <button
          className="flex-1 text-xs font-black text-white py-2.5 rounded-xl flex items-center justify-center gap-2"
          style={{ background: "#0d9488" }}
          onClick={handleCommit}>
          <ClipboardCheck className="h-3.5 w-3.5" />
          Save {orders.length > 0 ? `${orders.length} Order${orders.length !== 1 ? "s" : ""}` : "Orders"}
        </button>
        <button className="text-xs text-slate-400 hover:text-slate-600 px-4 py-2.5 rounded-xl border border-slate-200"
          onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Chips Panel ──────────────────────────────────────────────────────────────

interface ProcedureOrdersChipsPanelProps {
  data:   ProcedureOrdersData;
  onOpen: () => void;
}

export function ProcedureOrdersChipsPanel({ data, onOpen }: ProcedureOrdersChipsPanelProps) {
  if (data.orders.length === 0) {
    return (
      <button onClick={onOpen}
        className="text-xs font-bold border-2 border-dashed rounded-xl px-4 py-2.5 flex items-center gap-2 transition-all hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 w-full"
        style={{ borderColor: "#99f6e4", color: "#0d9488" }}>
        <Plus className="h-3.5 w-3.5" />
        Order a procedure…
      </button>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {data.orders.map(o => (
        <button key={o.uid} onClick={onOpen}
          className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl border-2 transition-all hover:opacity-80"
          style={o.priority === "Urgent"
            ? { background: "#fef2f2", color: "#ef4444", borderColor: "#fca5a5" }
            : { background: "#f0fdfa", color: "#0d9488", borderColor: "#99f6e4" }}>
          <Stethoscope className="h-3 w-3" />
          <span className="truncate max-w-[130px]">{o.name}</span>
          {o.cpt && <span className="font-mono text-[8px] opacity-60">· {o.cpt}</span>}
          {o.priority === "Urgent" && (
            <span className="text-[8px] font-black bg-red-100 text-red-600 px-1 rounded">!</span>
          )}
        </button>
      ))}
      <button onClick={onOpen}
        className="text-[10px] font-bold px-3 py-1.5 rounded-xl border-2 border-dashed transition-all hover:border-teal-300 hover:bg-teal-50"
        style={{ borderColor: "#99f6e4", color: "#0d9488" }}>
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
