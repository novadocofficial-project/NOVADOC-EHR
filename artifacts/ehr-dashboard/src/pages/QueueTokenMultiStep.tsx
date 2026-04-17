import { useState, useRef, useEffect } from "react";
import { Workflow, CheckCircle2, Clock, RefreshCw, Search, UserPlus, ChevronRight, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  QueueAppHeader, QueueEntry, Patient, VisitType,
  SEED_BRANCHES, SEED_PATIENTS, SEED_VISIT_TYPES,
  padToken, timeAgo, uid,
} from "@/pages/QueuePageLayout";

// ─── Seed queue ───────────────────────────────────────────────────────────────

const now = new Date();

type MultiEntry = QueueEntry & {
  patient: Patient | null;
  visitTypeId: string;
};

const SEED_QUEUE: MultiEntry[] = [
  {
    id: "m-1", tokenNumber: "C103", displayNum: 103, status: "completed",
    step: 4, totalSteps: 4, stepLabel: "Pharmacy",
    patient: SEED_PATIENTS[4], visitTypeId: "vt-1",
    createdAt: new Date(now.getTime() - 90 * 60000),
  },
  {
    id: "m-2", tokenNumber: "C104", displayNum: 104, status: "completed",
    step: 3, totalSteps: 4, stepLabel: "Lab / Sample",
    patient: SEED_PATIENTS[5], visitTypeId: "vt-1",
    createdAt: new Date(now.getTime() - 55 * 60000),
  },
  {
    id: "m-3", tokenNumber: "C105", displayNum: 105, status: "serving",
    step: 2, totalSteps: 4, stepLabel: "Doctor Consultation",
    patient: SEED_PATIENTS[0], visitTypeId: "vt-1",
    createdAt: new Date(now.getTime() - 30 * 60000),
  },
  {
    id: "m-4", tokenNumber: "C106", displayNum: 106, status: "waiting",
    step: 1, totalSteps: 4, stepLabel: "Registration",
    patient: SEED_PATIENTS[1], visitTypeId: "vt-1",
    createdAt: new Date(now.getTime() - 12 * 60000),
  },
  {
    id: "m-5", tokenNumber: "C107", displayNum: 107, status: "waiting",
    step: 1, totalSteps: 4, stepLabel: "Registration",
    patient: SEED_PATIENTS[2], visitTypeId: "vt-1",
    createdAt: new Date(now.getTime() - 6 * 60000),
  },
  {
    id: "m-6", tokenNumber: "U001", displayNum: 1, status: "serving",
    step: 1, totalSteps: 2, stepLabel: "Triage & Registration",
    patient: SEED_PATIENTS[3], visitTypeId: "vt-2",
    createdAt: new Date(now.getTime() - 8 * 60000),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function QueueTokenMultiStep() {
  const [branch, setBranch]         = useState(SEED_BRANCHES[0].id);
  const [queue, setQueue]           = useState<MultiEntry[]>(SEED_QUEUE);
  const [nextNums, setNextNums]     = useState<Record<string, number>>({ "vt-1": 108, "vt-2": 2, "vt-3": 1 });
  const [selectedVT, setSelectedVT] = useState<VisitType>(SEED_VISIT_TYPES[0]);
  const [selectedPat, setSelectedPat] = useState<Patient | null>(null);
  const [search, setSearch]         = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState<string | null>(null);
  const [filterStep, setFilterStep] = useState<number | "all">("all");
  const [showAddPatient, setShowAddPatient] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filteredPatients = SEED_PATIENTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.mrn.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  const nextNum   = nextNums[selectedVT.id] ?? 1;
  const nextToken = padToken(nextNum, selectedVT.prefix);
  const canGenerate = selectedPat !== null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function generateToken() {
    if (!canGenerate || loading) return;
    setLoading(true);
    setTimeout(() => {
      const entry: MultiEntry = {
        id: uid(), tokenNumber: nextToken, displayNum: nextNum,
        status: "waiting", step: 1, totalSteps: selectedVT.steps.length,
        stepLabel: selectedVT.steps[0], patient: selectedPat,
        visitTypeId: selectedVT.id, createdAt: new Date(),
      };
      setQueue(p => [...p, entry]);
      setNextNums(prev => ({ ...prev, [selectedVT.id]: (prev[selectedVT.id] ?? 1) + 1 }));
      setLoading(false);
      showToast(`Token ${nextToken} generated for ${selectedPat!.name}`);
      setSelectedPat(null);
      setSearch("");
    }, 700);
  }

  function advanceStep(entryId: string) {
    setQueue(prev => prev.map(e => {
      if (e.id !== entryId) return e;
      const vt = SEED_VISIT_TYPES.find(v => v.id === e.visitTypeId) ?? SEED_VISIT_TYPES[0];
      const nextStep = e.step + 1;
      if (nextStep > e.totalSteps) return { ...e, status: "completed" };
      return {
        ...e,
        step: nextStep,
        stepLabel: vt.steps[nextStep - 1],
        status: nextStep === e.totalSteps ? "serving" : "waiting",
      };
    }));
  }

  const serving   = queue.filter(e => e.status === "serving");
  const waiting   = queue.filter(e => e.status === "waiting");
  const completed = queue.filter(e => e.status === "completed");

  const visibleQueue = filterStep === "all"
    ? queue.filter(e => e.status !== "completed")
    : queue.filter(e => e.status !== "completed" && e.step === filterStep);

  const stepColors = ["#4982CF", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      <QueueAppHeader />

      {/* Sub-header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100">
            <Workflow className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Multi-Step Visit</h1>
            <p className="text-xs text-slate-400">Hospital OPD · Token follows patient through every step</p>
          </div>
          <Badge className="border-violet-200 bg-violet-50 text-violet-700 text-[10px]">OPD Active</Badge>
        </div>
        <Select value={branch} onValueChange={setBranch}>
          <SelectTrigger className="h-8 w-52 text-xs border-slate-200"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SEED_BRANCHES.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-white shadow-xl text-sm font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}

      <div className="flex flex-1 gap-0 overflow-hidden">

        {/* LEFT */}
        <div className="flex w-[400px] flex-shrink-0 flex-col border-r border-slate-200 bg-white overflow-hidden">

          {/* TOP — Fixed token display */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2 px-6 pt-6 pb-5 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Next Token</p>
            <div className="rounded-3xl border-2 px-14 py-7 text-center shadow-sm w-full"
              style={{ borderColor: selectedVT.color + "60", backgroundColor: selectedVT.color + "0C" }}>
              <p className="font-black tracking-widest font-mono text-7xl" style={{ color: selectedVT.color }}>{nextToken}</p>
              <p className="mt-1 text-xs font-semibold" style={{ color: selectedVT.color + "AA" }}>
                Step 1 of {selectedVT.steps.length} · {selectedVT.steps[0]}
              </p>
            </div>
          </div>

          {/* MIDDLE — Scrollable: patient + visit type */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

            {/* Patient Search */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient</p>
                <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-[#4982CF] hover:bg-[#4982CF]/10 px-2"
                  onClick={() => setShowAddPatient(true)}>
                  <UserPlus className="h-3 w-3" />Add New
                </Button>
              </div>

              {selectedPat ? (
                <div className="flex items-center gap-3 rounded-xl border-2 border-[#4982CF] bg-[#4982CF]/5 p-3">
                  <div className="h-9 w-9 rounded-full bg-[#4982CF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {selectedPat.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 leading-tight">{selectedPat.name}</p>
                    <p className="text-xs text-slate-500 leading-tight">{selectedPat.mrn} · {selectedPat.phone}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 flex-shrink-0"
                    onClick={() => { setSelectedPat(null); setSearch(""); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div ref={searchRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search name, MRN, or phone…"
                      className="h-10 pl-9 text-sm border-slate-200 focus-visible:ring-[#4982CF]"
                      value={search}
                      onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
                      onFocus={() => setShowSearch(true)}
                    />
                  </div>

                  {showSearch && (
                    <div className="absolute top-11 left-0 right-0 z-30 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                      {filteredPatients.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                          <Search className="h-5 w-5 opacity-40" />
                          <p className="text-xs font-medium">No patients found</p>
                          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs mt-1" onClick={() => setShowAddPatient(true)}>
                            <UserPlus className="h-3.5 w-3.5" />Register New Patient
                          </Button>
                        </div>
                      ) : (
                        <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                          {filteredPatients.map(p => (
                            <button key={p.id} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#4982CF]/5 text-left transition-colors"
                              onClick={() => { setSelectedPat(p); setSearch(""); setShowSearch(false); }}>
                              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                                {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 leading-tight">{p.name}</p>
                                <p className="text-xs text-slate-400 leading-tight">{p.mrn} · {p.gender === "M" ? "Male" : "Female"}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Visit Type */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Visit Type</p>
              <div className="space-y-2">
                {SEED_VISIT_TYPES.map(vt => {
                  const isSelected = vt.id === selectedVT.id;
                  return (
                    <button key={vt.id} onClick={() => setSelectedVT(vt)}
                      className={`w-full rounded-xl border-2 p-3 text-left transition-all ${isSelected ? "shadow-sm" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                      style={isSelected ? { borderColor: vt.color, backgroundColor: vt.color + "0A" } : undefined}>
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          style={{ borderColor: isSelected ? vt.color : "#CBD5E1", backgroundColor: isSelected ? vt.color : "white" }}>
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 leading-tight">{vt.name}</p>
                          <div className="flex items-center gap-0.5 mt-1 flex-wrap">
                            {vt.steps.map((s, i) => (
                              <span key={i} className="flex items-center gap-0.5">
                                <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">{s}</span>
                                {i < vt.steps.length - 1 && <ArrowRight className="h-2.5 w-2.5 text-slate-300" />}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* BOTTOM — Fixed generate button */}
          <div className="flex-shrink-0 border-t border-slate-100 p-4 space-y-2">
            <Button size="lg" onClick={generateToken} disabled={!canGenerate || loading}
              className="w-full h-14 text-white text-base font-bold rounded-xl shadow-md gap-2"
              style={{ backgroundColor: canGenerate ? selectedVT.color : undefined }}>
              {loading
                ? <><RefreshCw className="h-5 w-5 animate-spin" />Generating…</>
                : <><Workflow className="h-5 w-5" />Generate Token</>}
            </Button>
            {!selectedPat && (
              <p className="text-center text-xs text-slate-400 -mt-2">Select a patient to enable token generation</p>
            )}
          </div>
        </div>

        {/* RIGHT — Live Queue */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Summary stats bar */}
          <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-3 flex-shrink-0">
            {[
              { label: "Serving",   value: serving.length,   color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
              { label: "Waiting",   value: waiting.length,   color: "text-amber-700",   bg: "bg-amber-50   border-amber-200"   },
              { label: "Completed", value: completed.length, color: "text-slate-600",   bg: "bg-slate-50   border-slate-200"   },
            ].map(s => (
              <div key={s.label} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${s.bg}`}>
                <span className={`text-base font-black ${s.color}`}>{s.value}</span>
                <span className="text-xs font-semibold text-slate-400">{s.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 ml-auto">
              <p className="text-xs text-slate-400 font-medium">Filter by step:</p>
              <button onClick={() => setFilterStep("all")}
                className={`h-6 px-2.5 rounded-full text-[10px] font-bold transition-all ${filterStep === "all" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                All
              </button>
              {selectedVT.steps.map((s, i) => (
                <button key={i} onClick={() => setFilterStep(i + 1)}
                  className={`h-6 px-2.5 rounded-full text-[10px] font-bold transition-all ${filterStep === i + 1 ? "text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  style={filterStep === i + 1 ? { backgroundColor: stepColors[i] } : undefined}>
                  {i + 1}. {s.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Queue entries */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {visibleQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <Workflow className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">No active tokens</p>
                <p className="text-xs">Generate a token to get started</p>
              </div>
            ) : (
              visibleQueue.map(entry => {
                const vt = SEED_VISIT_TYPES.find(v => v.id === entry.visitTypeId) ?? SEED_VISIT_TYPES[0];
                const isServing  = entry.status === "serving";
                const stepColor  = stepColors[(entry.step - 1) % stepColors.length];
                return (
                  <div key={entry.id}
                    className={`rounded-2xl border overflow-hidden shadow-sm transition-all ${isServing ? "border-emerald-300 bg-white" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-center gap-4 px-5 py-4">
                      {/* Token */}
                      <div className="flex-shrink-0">
                        <div className="rounded-xl border-2 px-4 py-2 text-center min-w-[5rem]"
                          style={{ borderColor: vt.color + "60", backgroundColor: vt.color + "08" }}>
                          <p className="font-mono font-black text-xl" style={{ color: vt.color }}>{entry.tokenNumber}</p>
                        </div>
                      </div>

                      {/* Patient info */}
                      <div className="flex-1 min-w-0">
                        {entry.patient ? (
                          <>
                            <p className="text-sm font-bold text-slate-900 leading-tight">{entry.patient.name}</p>
                            <p className="text-xs text-slate-400 leading-tight">{entry.patient.mrn}</p>
                          </>
                        ) : (
                          <p className="text-sm font-bold text-slate-500">Walk-in Patient</p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-slate-300" />
                          <span className="text-[10px] text-slate-400">{timeAgo(entry.createdAt)}</span>
                        </div>
                      </div>

                      {/* Step progress */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-0.5 mb-1.5">
                          {Array.from({ length: entry.totalSteps }).map((_, i) => (
                            <div key={i} className="flex items-center gap-0.5">
                              <div className={`h-5 rounded flex items-center justify-center text-[9px] font-bold transition-all ${
                                i + 1 < entry.step ? "bg-emerald-500 text-white px-1.5" :
                                i + 1 === entry.step ? "text-white px-1.5" :
                                "bg-slate-100 text-slate-400 px-1.5"
                              }`}
                                style={i + 1 === entry.step ? { backgroundColor: stepColors[i] } : undefined}>
                                {i + 1 < entry.step ? "✓" : vt.steps[i].split(" ")[0].slice(0, 3)}
                              </div>
                              {i < entry.totalSteps - 1 && <div className={`h-0.5 w-2 ${i + 1 < entry.step ? "bg-emerald-400" : "bg-slate-200"}`} />}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs font-semibold" style={{ color: stepColor }}>
                          Step {entry.step}/{entry.totalSteps} · {entry.stepLabel}
                        </p>
                      </div>

                      {/* Status + action */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isServing ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Serving
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Waiting
                          </span>
                        )}
                        <Button variant="outline" size="sm" className="h-7 px-3 text-xs font-semibold gap-1 border-slate-200 text-slate-600"
                          onClick={() => advanceStep(entry.id)}
                          disabled={entry.step >= entry.totalSteps && entry.status === "completed"}>
                          {entry.step >= entry.totalSteps ? "Complete" : "Next Step"}
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {completed.length > 0 && filterStep === "all" && (
              <div className="rounded-xl border border-dashed border-slate-200 p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />{completed.length} Completed Today
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {completed.map(e => (
                    <div key={e.id} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1">
                      <span className="font-mono text-xs font-black text-slate-400 line-through">{e.tokenNumber}</span>
                      {e.patient && <span className="text-[10px] text-slate-400">{e.patient.name.split(" ")[0]}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Patient modal (simplified) */}
      {showAddPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#4982CF]" />
                <h2 className="text-base font-bold text-slate-900">Register New Patient</h2>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => setShowAddPatient(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">First Name *</label>
                  <Input className="h-9 text-sm" placeholder="First name" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Last Name *</label>
                  <Input className="h-9 text-sm" placeholder="Last name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Phone *</label>
                  <Input className="h-9 text-sm" placeholder="+92 …" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Date of Birth</label>
                  <Input className="h-9 text-sm" type="date" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Gender</label>
                <Select defaultValue="M">
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddPatient(false)}>Cancel</Button>
              <Button className="flex-1 bg-[#4982CF] hover:bg-[#3D73BC] text-white" onClick={() => {
                showToast("Patient registered. Select them from search to continue.");
                setShowAddPatient(false);
              }}>
                Register & Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
