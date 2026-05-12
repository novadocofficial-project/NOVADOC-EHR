import { useState, useRef, useEffect } from "react";
import { Workflow, CheckCircle2, Clock, RefreshCw, Search, UserPlus, ChevronRight, X, ArrowRight, LayoutGrid, List, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  QueueAppHeader, Patient, VisitType,
  SEED_BRANCHES, SEED_VISIT_TYPES,
  padToken, timeAgo, uid, TokenSlipModal, TokenSlipData,
} from "@/pages/QueuePageLayout";
import { useMultiStepQueue, MultiEntry } from "@/hooks/useMultiStepQueue";
import { useRegConfig } from "@/hooks/useRegConfig";
import { usePatients } from "@/hooks/usePatients";

// ─── Component ────────────────────────────────────────────────────────────────

export function QueueTokenMultiStep() {
  const {
    queue, nextNums, setNextNums,
    callEntry, completeStep, addEntry,
  } = useMultiStepQueue();
  const [branch, setBranch]         = useState(SEED_BRANCHES[0].id);
  const [selectedVT, setSelectedVT] = useState<VisitType>(SEED_VISIT_TYPES[0]);
  const [selectedPat, setSelectedPat] = useState<Patient | null>(null);
  const [search, setSearch]         = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState<string | null>(null);
  const [filterStep, setFilterStep] = useState<number | "all">("all");
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [vtView, setVtView] = useState<"list" | "cards">("list");
  const [walkIn, setWalkIn] = useState(false);
  const { config: regConfig } = useRegConfig();
  const { patients, addPatient } = usePatients();
  const [quickFormValues, setQuickFormValues] = useState<Record<string, string>>({});
  const [quickGender, setQuickGender] = useState<"M" | "F">("M");
  const [tokenSlip, setTokenSlip] = useState<TokenSlipData | null>(null);
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

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.mrn.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  const nextNum   = nextNums[selectedVT.id] ?? 1;
  const nextToken = padToken(nextNum, selectedVT.prefix);
  const canGenerate = selectedPat !== null || walkIn;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function generateToken() {
    if (!canGenerate || loading) return;
    setLoading(true);
    const snapToken   = nextToken;
    const snapVT      = selectedVT;
    const snapPat     = walkIn ? null : selectedPat;
    const snapWalkIn  = walkIn;
    const snapBranch  = SEED_BRANCHES.find(b => b.id === branch)?.name ?? branch;
    const snapAt      = new Date();
    setTimeout(() => {
      const entry: MultiEntry = {
        id: uid(), tokenNumber: snapToken, displayNum: nextNum,
        status: "waiting", step: 1, totalSteps: snapVT.steps.length,
        stepLabel: snapVT.steps[0], patient: snapPat,
        visitTypeId: snapVT.id, createdAt: snapAt,
        callCount: 0, skipped: false, billingCompleted: false, callTimestamp: null, pendingLab: false, pendingPharmacy: false, labResultsReady: false, labRoundCount: 0,
      };
      addEntry(entry);
      setNextNums(prev => ({ ...prev, [snapVT.id]: (prev[snapVT.id] ?? 1) + 1 }));
      setLoading(false);
      showToast(snapWalkIn ? `Token ${snapToken} generated (Walk-in)` : `Token ${snapToken} generated for ${snapPat!.name}`);
      setTokenSlip({
        tokenNumber: snapToken,
        color: snapVT.color,
        queueLabel: snapVT.name,
        queueSub: `Step 1 of ${snapVT.steps.length} · ${snapVT.steps[0]}`,
        patientName: snapPat?.name,
        patientMrn: snapPat?.mrn,
        branch: snapBranch,
        issuedAt: snapAt,
        steps: snapVT.steps,
      });
      setSelectedPat(null);
      setSearch("");
    }, 700);
  }

  const called    = queue.filter(e => e.status === "called"    && !e.skipped);
  const waiting   = queue.filter(e => e.status === "waiting"   && !e.skipped);
  const completed = queue.filter(e => e.status === "completed" && !e.skipped);
  const skipped   = queue.filter(e => e.skipped);

  const visibleQueue = filterStep === "all"
    ? queue.filter(e => e.status !== "completed" && !e.skipped)
    : queue.filter(e => e.status !== "completed" && !e.skipped && e.step === filterStep);

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
            <p className="text-xs text-slate-400">Clinic OPD · Token follows patient through every step</p>
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

      {/* Token Slip Modal */}
      {tokenSlip && <TokenSlipModal data={tokenSlip} onClose={() => setTokenSlip(null)} />}

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

          {/* TOP — Fixed compact token */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 bg-white">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Next Token</p>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border-2 px-5 py-2 text-center flex-shrink-0"
                style={{ borderColor: selectedVT.color + "60", backgroundColor: selectedVT.color + "0C" }}>
                <p className="font-black tracking-widest font-mono text-4xl leading-none" style={{ color: selectedVT.color }}>{nextToken}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 leading-tight">{selectedVT.name}</p>
                <p className="text-xs leading-tight" style={{ color: selectedVT.color + "CC" }}>
                  Step 1 of {selectedVT.steps.length} · {selectedVT.steps[0]}
                </p>
              </div>
            </div>
          </div>

          {/* FIXED — Patient section */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 bg-white">
            {/* Header row: label + walk-in toggle + add new */}
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex-1">Patient</p>
              {/* Walk-in toggle */}
              <button
                onClick={() => { setWalkIn(w => !w); setSelectedPat(null); setSearch(""); }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold transition-all ${
                  walkIn
                    ? "bg-amber-50 border-amber-300 text-amber-700"
                    : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                }`}
              >
                <UserX className="h-3 w-3" />
                Walk-in
              </button>
              {!walkIn && (
                <Button variant="ghost" size="sm" className="h-5 gap-1 text-[10px] text-[#4982CF] hover:bg-[#4982CF]/10 px-2"
                  onClick={() => setShowAddPatient(true)}>
                  <UserPlus className="h-3 w-3" />Add New
                </Button>
              )}
            </div>

            {walkIn ? (
              /* Walk-in mode — no patient required */
              <div className="flex items-center gap-2.5 rounded-xl border-2 border-amber-200 bg-amber-50 px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0">
                  <UserX className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-amber-800 leading-tight">Walk-in / Anonymous</p>
                  <p className="text-[10px] text-amber-600 leading-tight">No patient info required</p>
                </div>
                <button onClick={() => setWalkIn(false)} className="text-amber-400 hover:text-amber-700 transition-colors flex-shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : selectedPat ? (
              <div className="flex items-center gap-2.5 rounded-xl border-2 border-[#4982CF] bg-[#4982CF]/5 px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-[#4982CF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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
                    className="h-9 pl-9 text-sm border-slate-200 focus-visible:ring-[#4982CF]"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
                    onFocus={() => setShowSearch(true)}
                  />
                </div>
                {showSearch && (
                  <div className="absolute top-10 left-0 right-0 z-30 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                    {filteredPatients.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-5 text-slate-400">
                        <Search className="h-4 w-4 opacity-40" />
                        <p className="text-xs font-medium">No patients found</p>
                        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setShowAddPatient(true)}>
                          <UserPlus className="h-3.5 w-3.5" />Register New Patient
                        </Button>
                      </div>
                    ) : (
                      <div className="max-h-44 overflow-y-auto divide-y divide-slate-100">
                        {filteredPatients.map(p => (
                          <button key={p.id} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#4982CF]/5 text-left transition-colors"
                            onClick={() => { setSelectedPat(p); setSearch(""); setShowSearch(false); }}>
                            <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                              {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-900 leading-tight">{p.name}</p>
                              <p className="text-[10px] text-slate-400 leading-tight">{p.mrn} · {p.gender === "M" ? "Male" : "Female"}</p>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MIDDLE — Scrollable visit type only */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">

            {/* Visit Type header + toggle */}
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Visit Type</p>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setVtView("list")}
                  className={`px-2 py-1 flex items-center transition-colors ${vtView === "list" ? "bg-[#4982CF] text-white" : "bg-white text-slate-400 hover:bg-slate-50"}`}
                  title="List view">
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setVtView("cards")}
                  className={`px-2 py-1 flex items-center border-l border-slate-200 transition-colors ${vtView === "cards" ? "bg-[#4982CF] text-white" : "bg-white text-slate-400 hover:bg-slate-50"}`}
                  title="Card view">
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {vtView === "list" ? (
              <div className="space-y-1.5">
                {SEED_VISIT_TYPES.map(vt => {
                  const isSelected = vt.id === selectedVT.id;
                  return (
                    <button key={vt.id} onClick={() => setSelectedVT(vt)}
                      className={`w-full rounded-xl border-2 p-2.5 text-left transition-all ${isSelected ? "shadow-sm" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                      style={isSelected ? { borderColor: vt.color, backgroundColor: vt.color + "0A" } : undefined}>
                      <div className="flex items-center gap-2.5">
                        <div className="h-3.5 w-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          style={{ borderColor: isSelected ? vt.color : "#CBD5E1", backgroundColor: isSelected ? vt.color : "white" }}>
                          {isSelected && <div className="h-1 w-1 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 leading-tight">{vt.name}</p>
                          <div className="flex items-center gap-0.5 mt-1 flex-wrap">
                            {vt.steps.map((s, i) => (
                              <span key={i} className="flex items-center gap-0.5">
                                <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 rounded px-1 py-0.5">
                                  {s.split(/[\s/&]+/)[0].slice(0, 3)}
                                </span>
                                {i < vt.steps.length - 1 && <ArrowRight className="h-2 w-2 text-slate-300" />}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {SEED_VISIT_TYPES.map(vt => {
                  const isSelected = vt.id === selectedVT.id;
                  return (
                    <button key={vt.id} onClick={() => setSelectedVT(vt)}
                      className={`rounded-xl border-2 p-2.5 text-left transition-all ${isSelected ? "shadow-sm" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                      style={isSelected ? { borderColor: vt.color, backgroundColor: vt.color + "0A" } : undefined}>
                      <p className="text-xs font-bold text-slate-900 leading-tight mb-2">{vt.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {vt.steps.map((s, i) => (
                          <span key={i} className="text-[9px] font-bold rounded px-1.5 py-0.5"
                            style={{ backgroundColor: vt.color + "18", color: vt.color }}>
                            {s.split(/[\s/&]+/)[0].slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
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
            {!selectedPat && !walkIn && (
              <p className="text-center text-xs text-slate-400 -mt-2">Select a patient or use Walk-in mode</p>
            )}
          </div>
        </div>

        {/* RIGHT — Live Queue */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Summary stats bar */}
          <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-3 flex-shrink-0">
            {[
              { label: "In Progress", value: called.length,    color: "text-[#4982CF]",  bg: "bg-blue-50   border-blue-200"   },
              { label: "Waiting",     value: waiting.length,   color: "text-amber-700",  bg: "bg-amber-50  border-amber-200"  },
              { label: "Completed",   value: completed.length, color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200"},
              { label: "Skipped",     value: skipped.length,   color: "text-red-600",    bg: "bg-red-50    border-red-200"    },
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

          {/* Queue entries — sectioned */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {visibleQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <Workflow className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">No active tokens</p>
                <p className="text-xs">Generate a token to get started</p>
              </div>
            ) : (() => {
              const calledQ  = visibleQueue.filter(e => e.status === "called");
              const waitingQ = visibleQueue.filter(e => e.status === "waiting");

              const renderEntry = (entry: typeof visibleQueue[0]) => {
                const vt       = SEED_VISIT_TYPES.find(v => v.id === entry.visitTypeId) ?? SEED_VISIT_TYPES[0];
                const isCalled = entry.status === "called";
                const stepColor = stepColors[(entry.step - 1) % stepColors.length];
                return (
                  <div key={entry.id}
                    className={`rounded-2xl border overflow-hidden shadow-sm transition-all ${isCalled ? "border-[#4982CF]/40 bg-white ring-1 ring-[#4982CF]/10" : "border-slate-200 bg-white"}`}>
                    {/* Blue accent stripe for called entries */}
                    {isCalled && <div className="h-1 w-full" style={{ backgroundColor: vt.color }} />}
                    <div className="flex items-center gap-4 px-5 py-4">

                      {/* Token */}
                      <div className="flex-shrink-0">
                        <div className="rounded-xl border-2 px-4 py-2 text-center min-w-[5rem]"
                          style={{ borderColor: vt.color + (isCalled ? "90" : "60"), backgroundColor: vt.color + (isCalled ? "12" : "08") }}>
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
                              <div className={`h-5 rounded flex items-center justify-center text-[9px] font-bold transition-all px-1.5 relative ${
                                i + 1 < entry.step  ? "bg-emerald-500 text-white" :
                                i + 1 === entry.step && isCalled ? "text-white" :
                                i + 1 === entry.step ? "text-white" :
                                "bg-slate-100 text-slate-400"
                              }`} style={i + 1 === entry.step ? { backgroundColor: stepColors[i] } : undefined}>
                                {i + 1 < entry.step ? "✓" : vt.steps[i].split(" ")[0].slice(0, 3)}
                                {i + 1 === entry.step && isCalled && (
                                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-white border-2 border-[#4982CF] animate-pulse" />
                                )}
                              </div>
                              {i < entry.totalSteps - 1 && <div className={`h-0.5 w-2 ${i + 1 < entry.step ? "bg-emerald-400" : "bg-slate-200"}`} />}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs font-semibold" style={{ color: isCalled ? "#4982CF" : stepColor }}>
                          {isCalled ? "▶ " : ""}Step {entry.step}/{entry.totalSteps} · {entry.stepLabel}
                        </p>
                      </div>

                      {/* Status + actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isCalled ? (
                          <>
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#4982CF]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#4982CF] animate-pulse" />At Counter
                            </span>
                            <Button size="sm"
                              className="h-7 px-3 text-xs font-semibold gap-1 text-white"
                              style={{ backgroundColor: vt.color }}
                              onClick={() => completeStep(entry.id)}>
                              {entry.step >= entry.totalSteps ? "Complete Visit" : "Next Step"}
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Waiting
                            </span>
                            <Button variant="outline" size="sm"
                              className="h-7 px-3 text-xs font-semibold gap-1 border-[#4982CF]/30 text-[#4982CF] hover:bg-blue-50"
                              onClick={() => callEntry(entry.id)}>
                              Call
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {calledQ.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#4982CF] animate-pulse" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4982CF]">
                          Currently In Progress · {calledQ.length}
                        </p>
                      </div>
                      <div className="space-y-3">{calledQ.map(renderEntry)}</div>
                    </div>
                  )}
                  {waitingQ.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 mt-1">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                          Waiting · {waitingQ.length}
                        </p>
                      </div>
                      <div className="space-y-3">{waitingQ.map(renderEntry)}</div>
                    </div>
                  )}
                </>
              );
            })()}

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
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-[#4982CF]" />
                  <h2 className="text-base font-bold text-slate-900">Register New Patient</h2>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => { setShowAddPatient(false); setQuickFormValues({}); setQuickGender("M"); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {(() => {
                const qKey = `multi-step:${selectedVT.id}`;
                const resolvedProfileId =
                  regConfig.queueProfileMap[qKey] ??
                  regConfig.queueProfileMap["multi-step"];
                const resolvedProfile = resolvedProfileId
                  ? regConfig.quickProfiles.find(p => p.id === resolvedProfileId)
                  : regConfig.quickProfiles[0];
                const profileName = resolvedProfile?.name ?? "Default Profile";
                return (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedVT.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{selectedVT.name}</span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="text-[10px] font-semibold text-[#4982CF]">Profile: {profileName}</span>
                  </div>
                );
              })()}
            </div>
            {(() => {
              // Queue-aware profile resolution: multi-step:<vtId> → multi-step → quickProfiles[0] → Name+Phone fallback
              const qKey = `multi-step:${selectedVT.id}`;
              const assignedProfileId =
                regConfig.queueProfileMap[qKey] ??
                regConfig.queueProfileMap["multi-step"];
              const assignedProfile = assignedProfileId
                ? regConfig.quickProfiles.find(p => p.id === assignedProfileId)
                : null;
              const profile = assignedProfile ?? regConfig.quickProfiles[0] ?? null;
              const DEFAULT_QUICK_FALLBACK = [
                { fieldId: "name",  label: "Name",  visible: true, required: true,  isBuiltIn: true as const, fieldType: "text" as const, placeholder: "Full name", options: [] as string[] },
                { fieldId: "phone", label: "Phone", visible: true, required: true,  isBuiltIn: true as const, fieldType: "text" as const, placeholder: "+92 …",     options: [] as string[] },
              ];
              const visFields = profile
                ? profile.fields.filter(f => f.visible)
                : DEFAULT_QUICK_FALLBACK;

              // Render the appropriate input control for each field type
              const renderControl = (f: typeof visFields[0]) => {
                const ft = f.fieldType ?? "text";
                const ph = f.placeholder ?? f.label;
                const val = quickFormValues[f.fieldId] ?? "";
                const onChange = (v: string) => setQuickFormValues(prev => ({ ...prev, [f.fieldId]: v }));

                if (ft === "dropdown" && f.options?.length) {
                  return (
                    <Select value={val} onValueChange={onChange}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={ph} /></SelectTrigger>
                      <SelectContent>
                        {f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  );
                }
                if (ft === "textarea") {
                  return (
                    <textarea
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-ring h-16"
                      placeholder={ph} value={val}
                      onChange={e => onChange(e.target.value)}
                    />
                  );
                }
                const inputType = f.fieldId === "phone" ? "tel" : ft === "date" ? "date" : ft === "number" ? "number" : "text";
                return (
                  <Input className="h-9 text-sm" type={inputType} placeholder={ph}
                    value={val} onChange={e => onChange(e.target.value)} />
                );
              };

              const rows: React.ReactNode[] = [];
              let i = 0;
              while (i < visFields.length) {
                const f = visFields[i];
                const next = visFields[i + 1];
                if (next) {
                  rows.push(
                    <div key={`gr-${i}`} className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{f.label}{f.required && " *"}</label>
                        {renderControl(f)}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{next.label}{next.required && " *"}</label>
                        {renderControl(next)}
                      </div>
                    </div>
                  );
                  i += 2;
                } else {
                  rows.push(
                    <div key={`sr-${i}`}>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{f.label}{f.required && " *"}</label>
                      {renderControl(f)}
                    </div>
                  );
                  i++;
                }
              }
              return (
                <div className="p-6 space-y-4">
                  {rows}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Gender</label>
                    <Select value={quickGender} onValueChange={v => setQuickGender(v as "M" | "F")}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })()}
            <div className="flex gap-3 px-6 pb-6">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAddPatient(false); setQuickFormValues({}); setQuickGender("M"); }}>Cancel</Button>
              <Button className="flex-1 bg-[#4982CF] hover:bg-[#3D73BC] text-white" onClick={() => {
                const qKey2 = `multi-step:${selectedVT.id}`;
                const assignedProfileId =
                  regConfig.queueProfileMap[qKey2] ??
                  regConfig.queueProfileMap["multi-step"];
                const assignedProfile = assignedProfileId ? regConfig.quickProfiles.find(p => p.id === assignedProfileId) : null;
                const profile = assignedProfile ?? regConfig.quickProfiles[0] ?? null;
                const DEFAULT_QUICK_FALLBACK = [
                  { fieldId: "name" as const, label: "Name", visible: true, required: true },
                  { fieldId: "phone" as const, label: "Phone", visible: true, required: true },
                ];
                const visFields = profile ? profile.fields.filter(f => f.visible) : DEFAULT_QUICK_FALLBACK;
                const requiredFieldIds = visFields.filter(f => f.required).map(f => f.fieldId);
                const canSubmitQuick = requiredFieldIds.every(id => !!(quickFormValues[id]?.trim()));
                if (!canSubmitQuick) return;
                const name  = quickFormValues["name"]  ?? "";
                const phone = quickFormValues["phone"] ?? "";
                const dob   = quickFormValues["dob"]   ?? "";
                const newPatient: Patient = {
                  id: uid(),
                  mrn: "MR-" + Math.floor(45000 + Math.random() * 5000),
                  name: name.trim() || "Patient",
                  phone, dob, gender: quickGender,
                };
                addPatient(newPatient);
                setSelectedPat(newPatient);
                setQuickFormValues({});
                setQuickGender("M");
                setShowAddPatient(false);
                showToast(`Patient registered — ${newPatient.name}`);
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
