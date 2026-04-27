import { useState, useEffect } from "react";
import {
  PhoneCall, X, ChevronRight, Maximize2, Minimize2,
  Clock, User, AlertCircle, Heart, FlaskConical,
  SkipForward, RotateCcw, CheckCircle2, TestTube2,
  FileText, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueueAppHeader, timeAgo } from "@/pages/QueuePageLayout";
import { useMultiStepQueue, MultiEntry } from "@/hooks/useMultiStepQueue";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT        = "#4982CF";
const CALL_WINDOW_SECS = 30;
const MAX_CALLS     = 3;

function getSecsLeft(ts: number | null): number {
  if (!ts) return 0;
  return Math.max(0, CALL_WINDOW_SECS - Math.floor((Date.now() - ts) / 1000));
}

// ─── Seed lab orders for display in the Lab Panel ────────────────────────────

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
      { id: "lt1", serial: 1, name: "Complete Blood Count (CBC)",       lab: "CityPath Diagnostics", status: "pending",   updatedAt: "" },
      { id: "lt2", serial: 2, name: "C-Reactive Protein (CRP)",         lab: "CityPath Diagnostics", status: "pending",   updatedAt: "" },
      { id: "lt3", serial: 3, name: "Throat Swab Culture & Sensitivity", lab: "ABC Lab",             status: "pending",   updatedAt: "" },
    ],
  },
  {
    id: "lo-2",
    orderedBy: "Dr. Emily Wong",
    orderDate: "09 Dec 2024",
    tests: [
      { id: "lt4", serial: 1, name: "Fasting Blood Sugar",   lab: "Hashmani Laboratories", status: "completed", updatedAt: "09 Dec 2024, 10:30 AM" },
      { id: "lt5", serial: 2, name: "Lipid Profile",         lab: "Hashmani Laboratories", status: "completed", updatedAt: "09 Dec 2024, 11:00 AM" },
    ],
  },
];

// ─── Lab Panel (fullscreen) ───────────────────────────────────────────────────

type LabTab = "lab-orders";

function LabPanel({
  entry, onClose, onComplete,
}: {
  entry: MultiEntry;
  onClose: () => void;
  onComplete: () => void;
}) {
  const p             = entry.patient;
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTab, setActiveTab]   = useState<LabTab>("lab-orders");
  const [showConfirm, setShowConfirm] = useState(false);

  const tabs: { id: LabTab; label: string }[] = [
    { id: "lab-orders", label: "Lab Orders" },
  ];

  const totalTests  = SEED_LAB_ORDERS.reduce((s, o) => s + o.tests.length, 0);
  const pendingCount = SEED_LAB_ORDERS.reduce((s, o) => s + o.tests.filter(t => t.status === "pending").length, 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col border-l border-slate-200 transition-all duration-200 ${fullscreen ? "w-full" : "w-[80%]"}`}
      >
        {/* Sub-header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <FlaskConical className="h-4 w-4 text-purple-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-purple-700 leading-none">{entry.tokenNumber}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">Lab / Sample</span>
              </div>
              {p && <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{p.name}</p>}
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex items-center gap-1 flex-1 justify-center">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setFullscreen(f => !f)}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              title={fullscreen ? "Minimise" : "Full Screen"}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <Button
              onClick={() => setShowConfirm(true)}
              className="h-8 text-xs gap-1.5 text-white"
              style={{ background: "#7c3aed" }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
            </Button>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50/40">
          {activeTab === "lab-orders" && (
            <div className="p-5 space-y-4">
              {/* Summary bar */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 flex items-center gap-2">
                  <TestTube2 className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-bold text-purple-800">{totalTests} test{totalTests !== 1 ? "s" : ""} ordered</span>
                </div>
                {pendingCount > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-800">{pendingCount} pending</span>
                  </div>
                )}
                {pendingCount === 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800">All completed</span>
                  </div>
                )}
              </div>

              {/* Orders */}
              {SEED_LAB_ORDERS.map(order => (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Order header */}
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

                  {/* Test rows */}
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

              {SEED_LAB_ORDERS.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <FlaskConical className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No lab orders found</p>
                  <p className="text-xs mt-1">This patient has no pending lab orders.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirm modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirm(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-80 z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
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
                <Button onClick={() => { onComplete(); setShowConfirm(false); }} className="flex-1 h-9 text-sm text-white" style={{ background: "#7c3aed" }}>
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

// ─── Lab Drawer ───────────────────────────────────────────────────────────────

type LabDrawerCategory = "lab";

function LabDrawer({
  entry, onClose, onComplete,
}: {
  entry: MultiEntry;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<LabDrawerCategory | null>(null);
  const p = entry.patient;

  if (activeCategory === "lab") {
    return <LabPanel entry={entry} onClose={onClose} onComplete={onComplete} />;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col w-[40%] min-w-[480px] border-l border-slate-200">
        {/* Header */}
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
          {/* Patient info */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-mono text-lg font-black text-purple-700 leading-none">{entry.tokenNumber}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">{entry.stepLabel}</span>
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

          {/* Alerts + Allergies */}
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

          {/* Category cards */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Categories</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveCategory("lab")}
                className="rounded-xl border bg-purple-50 border-purple-200 px-4 py-3.5 text-left flex items-center gap-3 hover:shadow-sm transition-all group"
              >
                <FlaskConical className="h-5 w-5 text-purple-700 flex-shrink-0" />
                <span className="text-sm font-semibold text-purple-700 leading-tight">Lab</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 ml-auto group-hover:text-slate-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Timer display ────────────────────────────────────────────────────────────

function CallTimer({ secsLeft }: { secsLeft: number }) {
  const pct = (secsLeft / CALL_WINDOW_SECS) * 100;
  const color = secsLeft > 15 ? "#22c55e" : secsLeft > 8 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Clock className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color }}>{secsLeft}s</span>
    </div>
  );
}

// ─── Queue Card ───────────────────────────────────────────────────────────────

function LabQueueCard({
  entry, isActive, onCall, onTimerExpire, onLabOrders, onSkip,
}: {
  entry: MultiEntry;
  isActive: boolean;
  onCall: () => void;
  onTimerExpire: () => void;
  onLabOrders: () => void;
  onSkip: () => void;
}) {
  const p = entry.patient;
  const isCalling = !!entry.callTimestamp;
  const [secsLeft, setSecsLeft] = useState(getSecsLeft(entry.callTimestamp));

  useEffect(() => {
    if (!isCalling) { setSecsLeft(0); return; }
    const iv = setInterval(() => {
      const s = getSecsLeft(entry.callTimestamp);
      setSecsLeft(s);
      if (s === 0) onTimerExpire();
    }, 500);
    return () => clearInterval(iv);
  }, [isCalling, entry.callTimestamp, onTimerExpire]);

  const callsLeft = MAX_CALLS - entry.callCount;
  const isAtCounter = entry.status === "called";

  return (
    <div className={`bg-white rounded-2xl border shadow-sm px-5 py-4 transition-all ${isActive ? "border-purple-300 shadow-purple-100 shadow-md" : "border-slate-100"}`}>
      <div className="flex items-start gap-4">
        {/* Token */}
        <div className="flex-shrink-0 text-center">
          <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <span className="font-mono text-sm font-black text-purple-700">{entry.tokenNumber}</span>
          </div>
          {isCalling && (
            <span className="mt-1 block text-[9px] font-bold text-amber-600 animate-pulse">CALLING</span>
          )}
          {isAtCounter && !isCalling && (
            <span className="mt-1 block text-[9px] font-bold text-purple-600">AT COUNTER</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            {p ? (
              <span className="text-sm font-bold text-slate-800">{p.name}</span>
            ) : (
              <span className="text-sm text-slate-400 italic">Walk-in</span>
            )}
            {p && <span className="text-xs text-slate-400">{p.mrn}</span>}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
            <span>{entry.stepLabel}</span>
            <span>·</span>
            <span>{timeAgo(entry.createdAt)}</span>
            {entry.callCount > 0 && (
              <><span>·</span><span className="text-amber-600 font-semibold">Called {entry.callCount}×</span></>
            )}
          </div>
          {isCalling && (
            <div className="mt-2">
              <CallTimer secsLeft={secsLeft} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0 min-w-[110px]">
          {!isAtCounter ? (
            <Button
              onClick={onCall}
              disabled={isCalling || entry.callCount >= MAX_CALLS}
              className="h-8 text-xs gap-1.5 w-full text-white"
              style={{ background: isCalling || entry.callCount >= MAX_CALLS ? "#94a3b8" : ACCENT }}
            >
              <PhoneCall className="h-3.5 w-3.5" />
              {isCalling ? "Calling…" : entry.callCount >= MAX_CALLS ? "Max Calls" : `Call ${entry.callCount > 0 ? `(${callsLeft} left)` : ""}`}
            </Button>
          ) : (
            <Button
              onClick={onLabOrders}
              className="h-8 text-xs gap-1.5 w-full text-white"
              style={{ background: "#7c3aed" }}
            >
              <FlaskConical className="h-3.5 w-3.5" /> Lab Orders
            </Button>
          )}

          {!isAtCounter && !isCalling && entry.callCount > 0 && entry.callCount < MAX_CALLS && (
            <Button
              onClick={onLabOrders}
              variant="outline"
              className="h-8 text-xs gap-1.5 w-full border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <FlaskConical className="h-3.5 w-3.5" /> Lab Orders
            </Button>
          )}

          <Button
            onClick={onSkip}
            variant="outline"
            className="h-7 text-[10px] gap-1 w-full text-slate-500 hover:text-rose-600 hover:border-rose-200"
          >
            <SkipForward className="h-3 w-3" /> Skip
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LabUser() {
  const {
    queue,
    labCall, labTimerExpire, labAtCounter, labComplete, labSkip, labRecall,
  } = useMultiStepQueue();

  const [drawerEntry, setDrawerEntry] = useState<MultiEntry | null>(null);

  // Filter to step 4 (Lab / Sample)
  const labQueue  = queue.filter(e => e.step === 4 && !e.skipped && e.status !== "completed");
  const skipped   = queue.filter(e => e.step === 4 && e.skipped);
  const completed = queue.filter(e => e.step === 4 && e.status === "completed");

  const waiting = labQueue.filter(e => e.status === "waiting");
  const called  = labQueue.filter(e => e.status === "called");

  function handleCall(entry: MultiEntry) {
    labCall(entry.id);
    // After a brief moment to simulate call, mark at counter so "Lab Orders" appears
    setTimeout(() => labAtCounter(entry.id), 500);
  }

  function handleLabOrders(entry: MultiEntry) {
    labAtCounter(entry.id);
    setDrawerEntry(entry);
  }

  function handleComplete(id: string) {
    labComplete(id);
    setDrawerEntry(null);
  }

  function renderSection(title: string, entries: MultiEntry[], accent?: string) {
    if (entries.length === 0) return null;
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
          <span className="text-[10px] font-bold text-slate-300 bg-slate-100 rounded-full px-2 py-0.5">{entries.length}</span>
        </div>
        <div className="space-y-3">
          {entries.map(e => (
            <LabQueueCard
              key={e.id}
              entry={e}
              isActive={drawerEntry?.id === e.id}
              onCall={() => handleCall(e)}
              onTimerExpire={() => labTimerExpire(e.id)}
              onLabOrders={() => handleLabOrders(e)}
              onSkip={() => labSkip(e.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  const totalActive = labQueue.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <QueueAppHeader />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800">Lab Queue</h1>
              <p className="text-xs text-slate-500">Sample collection · Step 4</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 shadow-sm px-3 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Active</span>
              <span className="text-sm font-black text-purple-700">{totalActive}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 shadow-sm px-3 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Skipped</span>
              <span className="text-sm font-black text-slate-600">{skipped.length}</span>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {totalActive === 0 && skipped.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No patients in the lab queue</p>
            <p className="text-xs mt-1">Patients will appear here once they reach the Lab / Sample step.</p>
          </div>
        )}

        {/* Called (at counter) */}
        {renderSection("At Counter", called)}

        {/* Waiting */}
        {renderSection("Waiting", waiting)}

        {/* Skipped */}
        {skipped.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Skipped</p>
              <span className="text-[10px] font-bold text-slate-300 bg-slate-100 rounded-full px-2 py-0.5">{skipped.length}</span>
            </div>
            <div className="space-y-3">
              {skipped.map(e => (
                <div key={e.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4 opacity-70">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-mono text-xs font-black text-slate-500">{e.tokenNumber}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{e.patient?.name ?? "Walk-in"}</p>
                    <p className="text-[10px] text-slate-400">{e.patient?.mrn ?? "—"} · Skipped after {e.callCount} call{e.callCount !== 1 ? "s" : ""}</p>
                  </div>
                  <Button
                    onClick={() => labRecall(e.id)}
                    variant="outline"
                    className="h-8 text-xs gap-1.5 flex-shrink-0 border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Recall
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed today */}
        {completed.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Completed Today</p>
              <span className="text-[10px] font-bold text-slate-300 bg-slate-100 rounded-full px-2 py-0.5">{completed.length}</span>
            </div>
            <div className="space-y-2">
              {completed.map(e => (
                <div key={e.id} className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3 opacity-60">
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

      {/* Right-side drawer */}
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
