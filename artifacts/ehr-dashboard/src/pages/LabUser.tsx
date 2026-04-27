import { useState, useEffect } from "react";
import {
  PhoneCall, SkipForward, RotateCcw,
  ChevronUp, Clock, AlertCircle, X,
  CheckCircle2, FlaskConical, User, Heart,
  ChevronRight, Maximize2, Minimize2, TestTube2, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueueAppHeader, timeAgo } from "@/pages/QueuePageLayout";
import { useMultiStepQueue, MultiEntry } from "@/hooks/useMultiStepQueue";

// ─── Constants ────────────────────────────────────────────────────────────────

const LAB_ACCENT = "#4982CF";
const CALL_WINDOW_SECS = 30;
const MAX_CALLS        = 3;

function getSecsLeft(ts: number | null): number {
  if (!ts) return 0;
  return Math.max(0, CALL_WINDOW_SECS - Math.floor((Date.now() - ts) / 1000));
}

// ─── Seed lab orders ──────────────────────────────────────────────────────────

interface LabTest {
  id: string;
  serial: number;
  name: string;
  lab: string;
  status: "pending" | "completed";
  updatedAt: string;
}

interface LabOrder {
  id: string;
  orderedBy: string;
  orderDate: string;
  tests: LabTest[];
}

const SEED_LAB_ORDERS: LabOrder[] = [
  {
    id: "lo-1",
    orderedBy: "Dr. Asif Imam",
    orderDate: "10 Dec 2024",
    tests: [
      { id: "lt1", serial: 1, name: "Complete Blood Count (CBC)",        lab: "CityPath Diagnostics", status: "pending",   updatedAt: "" },
      { id: "lt2", serial: 2, name: "C-Reactive Protein (CRP)",          lab: "CityPath Diagnostics", status: "pending",   updatedAt: "" },
      { id: "lt3", serial: 3, name: "Throat Swab Culture & Sensitivity", lab: "ABC Lab",              status: "pending",   updatedAt: "" },
    ],
  },
  {
    id: "lo-2",
    orderedBy: "Dr. Emily Wong",
    orderDate: "09 Dec 2024",
    tests: [
      { id: "lt4", serial: 1, name: "Fasting Blood Sugar", lab: "Hashmani Laboratories", status: "completed", updatedAt: "09 Dec 2024, 10:30 AM" },
      { id: "lt5", serial: 2, name: "Lipid Profile",       lab: "Hashmani Laboratories", status: "completed", updatedAt: "09 Dec 2024, 11:00 AM" },
    ],
  },
];

// ─── Lab Panel (fullscreen slide-over) ───────────────────────────────────────

function LabPanel({ entry, onClose, onComplete }: {
  entry: MultiEntry; onClose: () => void; onComplete: () => void;
}) {
  const p                             = entry.patient;
  const [fullscreen, setFullscreen]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const totalTests   = SEED_LAB_ORDERS.reduce((s, o) => s + o.tests.length, 0);
  const pendingCount = SEED_LAB_ORDERS.reduce((s, o) => s + o.tests.filter(t => t.status === "pending").length, 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col border-l border-slate-200 transition-all duration-200 ${fullscreen ? "w-full" : "w-[80%]"}`}>

        {/* Sub-header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FlaskConical className="h-4 w-4 text-[#4982CF]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-[#4982CF] leading-none">{entry.tokenNumber}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#4982CF] font-bold">Lab / Sample</span>
              </div>
              {p && <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{p.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-1 justify-center">
            <button className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: LAB_ACCENT }}>Lab Orders</button>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setFullscreen(f => !f)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors" title={fullscreen ? "Minimise" : "Full Screen"}>
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <Button onClick={() => setShowConfirm(true)} className="h-8 text-xs gap-1.5 text-white" style={{ background: LAB_ACCENT }}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
            </Button>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50/40">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 flex items-center gap-2">
                <TestTube2 className="h-4 w-4 text-[#4982CF]" />
                <span className="text-xs font-bold text-[#4982CF]">{totalTests} test{totalTests !== 1 ? "s" : ""} ordered</span>
              </div>
              {pendingCount > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-800">{pendingCount} pending</span>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800">All completed</span>
                </div>
              )}
            </div>

            {SEED_LAB_ORDERS.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <Package className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700">Order · {order.orderDate}</p>
                    <p className="text-[10px] text-slate-400">Ordered by {order.orderedBy}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {order.tests.filter(t => t.status === "completed").length}/{order.tests.length} done
                  </span>
                </div>
                <div className="divide-y divide-slate-50">
                  {order.tests.map(test => (
                    <div key={test.id} className="flex items-center gap-4 px-4 py-3">
                      <span className="text-[10px] font-black text-slate-400 w-5 flex-shrink-0 text-right">{test.serial}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{test.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <FlaskConical className="h-3 w-3" /> {test.lab}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {test.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        )}
                        {test.status === "completed" && test.updatedAt && (
                          <span className="text-[10px] text-slate-400">{test.updatedAt}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirm(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-80 z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-[#4982CF]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Mark Lab Complete?</p>
                  <p className="text-xs text-slate-500 mt-0.5">Token {entry.tokenNumber} will advance to the next step.</p>
                </div>
              </div>
              {pendingCount > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-3">
                  <p className="text-xs font-semibold text-amber-800">{pendingCount} test{pendingCount !== 1 ? "s" : ""} still pending</p>
                  <p className="text-[10px] text-amber-700 mt-0.5">Results can be entered after this step.</p>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Button onClick={() => setShowConfirm(false)} variant="outline" className="flex-1 h-9 text-sm">Cancel</Button>
                <Button onClick={() => { onComplete(); setShowConfirm(false); }} className="flex-1 h-9 text-sm text-white" style={{ background: LAB_ACCENT }}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Lab Drawer (patient summary) ─────────────────────────────────────────────

function LabDrawer({ entry, onClose, onComplete }: {
  entry: MultiEntry; onClose: () => void; onComplete: () => void;
}) {
  const [showPanel, setShowPanel] = useState(false);
  const p = entry.patient;

  if (showPanel) {
    return <LabPanel entry={entry} onClose={onClose} onComplete={onComplete} />;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col w-[40%] min-w-[480px] border-l border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900">Patient Details</p>
            <p className="text-xs text-slate-400 mt-0.5">Lab Station · Sample Counter</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-[#4982CF]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-mono text-lg font-black text-[#4982CF] leading-none">{entry.tokenNumber}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#4982CF] font-bold">{entry.stepLabel}</span>
                </div>
                {p ? (
                  <>
                    <p className="text-sm font-bold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.mrn} · {p.gender === "M" ? "Male" : "Female"}</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 italic">Walk-in / No MR</p>
                )}
              </div>
            </div>
            {p && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[["Height", "168 cm"], ["Weight", "72 kg"], ["Last Visit", "Feb 2025"]].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-400">{label}</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-5 py-4 border-b border-slate-100 space-y-3">
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs font-bold text-amber-800">Alerts</p>
              </div>
              <p className="text-xs text-amber-700">Diabetic patient — check blood sugar before sample collection.</p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-rose-600 flex-shrink-0" />
                <p className="text-xs font-bold text-rose-800">Allergies</p>
              </div>
              <p className="text-xs text-rose-700">Penicillin · Sulfa drugs</p>
            </div>
          </div>
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Categories</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setShowPanel(true)}
                className="rounded-xl border bg-blue-50 border-blue-200 px-4 py-3.5 text-left flex items-center gap-3 hover:shadow-sm transition-all group"
              >
                <FlaskConical className="h-5 w-5 text-[#4982CF] flex-shrink-0" />
                <span className="text-sm font-semibold text-[#4982CF] leading-tight">Lab</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 ml-auto group-hover:text-slate-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LabUser() {
  const {
    queue,
    labCall, labTimerExpire, labAtCounter, labComplete, labSkip, labRecall,
  } = useMultiStepQueue();

  const [tick, setTick]               = useState(0);
  const [drawerEntry, setDrawerEntry] = useState<MultiEntry | null>(null);
  const [showSkipped, setShowSkipped] = useState(false);
  const [toast, setToast]             = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    queue.forEach(e => {
      if (!e.callTimestamp) return;
      if (Date.now() - e.callTimestamp >= CALL_WINDOW_SECS * 1000) {
        labTimerExpire(e.id);
        if (e.callCount >= MAX_CALLS) showToastMsg(`Token ${e.tokenNumber} auto-skipped after ${MAX_CALLS} calls`);
      }
    });
  }, [tick]);

  function showToastMsg(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500); }

  // ── Derived state (mirrors Doctor/Nursing pattern exactly) ─────────────────
  const labQueue       = queue
    .filter(e => e.step === 4 && !e.skipped && e.status !== "completed")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const skippedQueue   = queue.filter(e => e.step === 4 && e.skipped);
  const completedQueue = queue.filter(e => e.step === 4 && e.status === "completed");

  const atCounterEntry  = labQueue.find(e => e.status === "called") ?? null;
  const activeCallEntry = labQueue.find(e => e.callTimestamp !== null && getSecsLeft(e.callTimestamp) > 0) ?? null;
  const waitingTokens   = labQueue.filter(e => e.status === "waiting" && !e.callTimestamp && e.id !== atCounterEntry?.id);

  const secsLeft = getSecsLeft(activeCallEntry?.callTimestamp ?? null);
  const timerPct = (secsLeft / CALL_WINDOW_SECS) * 100;

  function handleCall(id: string) { labCall(id); showToastMsg("Token called — 30 second window started"); }
  function handleLabOrders(entry: MultiEntry) { labAtCounter(entry.id); setDrawerEntry({ ...entry, status: "called" }); }
  function handleComplete(id: string) { labComplete(id); setDrawerEntry(null); }
  function handleSkip(id: string) { labSkip(id); showToastMsg("Token skipped"); }
  function handleRecall(id: string, tokenNum: string) { labRecall(id); showToastMsg(`Token ${tokenNum} recalled to queue`); }

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      <QueueAppHeader />

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 shadow-lg">
          {toast}
        </div>
      )}

      {/* Purple status bar */}
      <div className="flex items-center gap-3 px-6 py-2.5 flex-shrink-0" style={{ backgroundColor: LAB_ACCENT }}>
        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
        <p className="text-xs font-bold text-white/90 uppercase tracking-widest">Lab Counter · Main Branch — Lahore</p>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-white/70">Step:</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">Lab / Sample · 4 of 5</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Queue Stats</p>
            {[
              { label: "At Counter", value: atCounterEntry ? 1 : 0,  style: { color: LAB_ACCENT }, bg: "bg-blue-50 border-blue-200" },
              { label: "Waiting",    value: waitingTokens.length,     style: { color: "#b45309" },  bg: "bg-amber-50 border-amber-200"  },
              { label: "Skipped",    value: skippedQueue.length,      style: { color: "#dc2626" },  bg: "bg-red-50 border-red-200"      },
            ].map(s => (
              <div key={s.label} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 mb-2 ${s.bg}`}>
                <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                <span className="text-lg font-black" style={s.style}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Assigned Queues</p>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="h-4 w-4 text-[#4982CF]" />
                <p className="text-sm font-bold text-[#4982CF]">Lab Queue</p>
              </div>
              <p className="text-xs text-slate-500">Step 4 tokens · No billing</p>
            </div>
          </div>
        </div>

        {/* ── MAIN AREA ─────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* AT COUNTER */}
            {atCounterEntry && !activeCallEntry && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: LAB_ACCENT }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: LAB_ACCENT }}>Now at Lab Counter</p>
                </div>
                <div className="rounded-2xl border-2 bg-white shadow-sm overflow-hidden" style={{ borderColor: `${LAB_ACCENT}4D` }}>
                  <div className="h-1 w-full" style={{ backgroundColor: LAB_ACCENT }} />
                  <div className="flex items-center gap-5 px-6 py-5">
                    <div className="flex-shrink-0 text-center">
                      <div className="rounded-2xl border-2 px-6 py-3" style={{ borderColor: `${LAB_ACCENT}80`, backgroundColor: `${LAB_ACCENT}0D` }}>
                        <p className="font-mono font-black text-2xl" style={{ color: LAB_ACCENT }}>{atCounterEntry.tokenNumber}</p>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">Call #{atCounterEntry.callCount}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      {atCounterEntry.patient ? (
                        <>
                          <p className="text-base font-black text-slate-900 leading-tight">{atCounterEntry.patient.name}</p>
                          <p className="text-xs text-slate-400">{atCounterEntry.patient.mrn} · {atCounterEntry.patient.phone}</p>
                        </>
                      ) : (
                        <p className="text-base font-black text-slate-500">Walk-in Patient</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: LAB_ACCENT }} />
                        <span className="text-xs font-semibold" style={{ color: LAB_ACCENT }}>At Lab Counter</span>
                        <span className="text-slate-300">·</span>
                        <Clock className="h-3 w-3 text-slate-300" />
                        <span className="text-xs text-slate-400">{timeAgo(atCounterEntry.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        className="h-10 px-5 text-sm font-bold gap-2 text-white"
                        style={{ backgroundColor: LAB_ACCENT }}
                        onClick={() => setDrawerEntry(atCounterEntry)}
                      >
                        <FlaskConical className="h-4 w-4" /> Lab Orders
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CALL WINDOW ACTIVE */}
            {activeCallEntry && !atCounterEntry && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Call Window Active</p>
                </div>
                <div className="rounded-2xl border-2 border-amber-200 bg-white shadow-sm overflow-hidden">
                  <div className="h-1.5 w-full bg-slate-100 relative">
                    <div className="h-full transition-all duration-1000" style={{ width: `${timerPct}%`, backgroundColor: secsLeft < 10 ? "#ef4444" : "#f59e0b" }} />
                  </div>
                  <div className="flex items-center gap-5 px-6 py-5">
                    <div className="flex-shrink-0 text-center">
                      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-6 py-3">
                        <p className="font-mono font-black text-2xl text-amber-700">{activeCallEntry.tokenNumber}</p>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">Attempt {activeCallEntry.callCount}/{MAX_CALLS}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      {activeCallEntry.patient ? (
                        <>
                          <p className="text-base font-black text-slate-900 leading-tight">{activeCallEntry.patient.name}</p>
                          <p className="text-xs text-slate-400">{activeCallEntry.patient.mrn}</p>
                        </>
                      ) : (
                        <p className="text-base font-black text-slate-500">Walk-in Patient</p>
                      )}
                      <p className="text-sm font-semibold text-amber-600 mt-1">Window expires in {secsLeft}s</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        className="h-10 px-5 text-sm font-bold gap-2 text-white"
                        style={{ backgroundColor: LAB_ACCENT }}
                        onClick={() => handleLabOrders(activeCallEntry)}
                      >
                        <FlaskConical className="h-4 w-4" /> Lab Orders
                      </Button>
                      <Button variant="outline" size="sm" className="border-red-200 text-red-500 hover:bg-red-50 text-xs" onClick={() => handleSkip(activeCallEntry.id)}>
                        <SkipForward className="h-3 w-3 mr-1" /> Skip Token
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WAITING QUEUE */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                  Waiting in Queue · {waitingTokens.length}
                </p>
              </div>
              {waitingTokens.length === 0 && !atCounterEntry && !activeCallEntry && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <FlaskConical className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">Queue is empty</p>
                  <p className="text-xs">Patients will appear here after they reach Step 4.</p>
                </div>
              )}
              <div className="space-y-2">
                {waitingTokens.map((entry, idx) => {
                  const isFirst = idx === 0 && !atCounterEntry && !activeCallEntry;
                  return (
                    <div key={entry.id} className={`flex items-center gap-4 rounded-xl border px-4 py-3 bg-white transition-all ${isFirst ? "border-slate-300 shadow-sm" : "border-slate-100 opacity-70"}`}>
                      <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-black bg-slate-100 text-slate-500">{idx + 1}</div>
                      <div className="font-mono font-black text-sm text-slate-700 flex-shrink-0">{entry.tokenNumber}</div>
                      <div className="flex-1 min-w-0">
                        {entry.patient
                          ? <p className="text-sm font-bold text-slate-800 truncate">{entry.patient.name}<span className="ml-2 text-xs font-normal text-slate-400">{entry.patient.mrn}</span></p>
                          : <p className="text-sm font-bold text-slate-500">Walk-in Patient</p>}
                        {entry.callCount > 0 && (
                          <p className="text-[10px] text-amber-600 font-semibold">Called {entry.callCount}× — {MAX_CALLS - entry.callCount} attempt{MAX_CALLS - entry.callCount !== 1 ? "s" : ""} left</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(entry.createdAt)}</span>
                      {isFirst ? (
                        <Button size="sm" className="h-8 px-4 text-xs font-bold flex-shrink-0 gap-1.5 text-white" style={{ backgroundColor: LAB_ACCENT }} onClick={() => handleCall(entry.id)}>
                          <PhoneCall className="h-3.5 w-3.5" /> Call
                        </Button>
                      ) : (
                        <div className="h-8 px-4 flex items-center text-[10px] font-semibold text-slate-400 flex-shrink-0">Locked</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COMPLETED TODAY (compact) */}
            {completedQueue.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Completed Today</p>
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-100 rounded-full px-2 py-0.5">{completedQueue.length}</span>
                </div>
                <div className="space-y-1.5">
                  {completedQueue.map(e => (
                    <div key={e.id} className="bg-white rounded-xl border border-slate-100 px-4 py-2.5 flex items-center gap-3 opacity-60">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="font-mono text-xs font-bold text-slate-500">{e.tokenNumber}</span>
                      <span className="text-xs text-slate-500">{e.patient?.name ?? "Walk-in"}</span>
                      <span className="ml-auto text-[10px] text-emerald-600 font-bold">Done</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SKIPPED PANEL (floating at bottom — same as Doctor/Nursing) */}
          {skippedQueue.length > 0 && (
            <>
              <button
                onClick={() => setShowSkipped(v => !v)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-red-200 bg-white shadow-lg px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-all z-10"
              >
                <AlertCircle className="h-3.5 w-3.5" /> Skipped Tokens ({skippedQueue.length})
                <ChevronUp className={`h-3.5 w-3.5 transition-transform ${showSkipped ? "rotate-180" : ""}`} />
              </button>
              {showSkipped && (
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-red-200 rounded-t-3xl shadow-2xl z-20 max-h-72 flex flex-col">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-sm font-bold text-slate-900">Skipped Tokens</p>
                    </div>
                    <button onClick={() => setShowSkipped(false)} className="h-7 w-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {skippedQueue.map(entry => (
                      <div key={entry.id} className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                        <div className="font-mono font-black text-sm text-red-700 flex-shrink-0">{entry.tokenNumber}</div>
                        <div className="flex-1 min-w-0">
                          {entry.patient ? <p className="text-sm font-semibold text-slate-800">{entry.patient.name}</p> : <p className="text-sm font-semibold text-slate-500">Walk-in</p>}
                          <p className="text-[10px] text-slate-400">{timeAgo(entry.createdAt)}</p>
                        </div>
                        <span className="text-xs font-bold text-red-500 flex-shrink-0">{entry.callCount}/{MAX_CALLS} calls</span>
                        <Button variant="outline" size="sm" className="h-7 px-3 text-xs border-red-300 text-red-600 hover:bg-red-100 flex-shrink-0" onClick={() => handleRecall(entry.id, entry.tokenNumber)}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Recall
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawerEntry && (
        <LabDrawer
          entry={drawerEntry}
          onClose={() => setDrawerEntry(null)}
          onComplete={() => handleComplete(drawerEntry.id)}
        />
      )}
    </div>
  );
}
