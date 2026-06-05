import { useState, useEffect, useRef } from "react";
import { Zap, CheckCircle2, Clock, Users, RefreshCw, Printer, UserPlus, UserX, Search, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  QueueAppHeader, QueueEntry, QueueStatus, Patient, SEED_BRANCHES,
  padToken, timeAgo, uid, TokenSlipModal, TokenSlipData,
} from "@/pages/QueuePageLayout";
import { useRegConfig } from "@/hooks/useRegConfig";
import { usePatients } from "@/hooks/usePatients";

// ─── Seed queue ───────────────────────────────────────────────────────────────

const now = new Date();
const SEED_QUEUE: QueueEntry[] = [
  { id: "e-0", tokenNumber: "U005", displayNum: 5, status: "completed", step: 1, totalSteps: 1, createdAt: new Date(now.getTime() - 18 * 60000) },
  { id: "e-1", tokenNumber: "U006", displayNum: 6, status: "completed", step: 1, totalSteps: 1, createdAt: new Date(now.getTime() - 12 * 60000) },
  { id: "e-2", tokenNumber: "U007", displayNum: 7, status: "called",    step: 1, totalSteps: 1, createdAt: new Date(now.getTime() - 4 * 60000) },
  { id: "e-3", tokenNumber: "U008", displayNum: 8, status: "waiting",   step: 1, totalSteps: 1, createdAt: new Date(now.getTime() - 2 * 60000) },
  { id: "e-4", tokenNumber: "U009", displayNum: 9, status: "waiting",   step: 1, totalSteps: 1, createdAt: new Date(now.getTime() - 60000) },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function QueueTokenSingle() {
  const [branch, setBranch]   = useState(SEED_BRANCHES[0].id);
  const [queue, setQueue]     = useState<QueueEntry[]>(SEED_QUEUE);
  const [nextNum, setNextNum] = useState(10);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState<string | null>(null);
  const [tick, setTick]       = useState(0);
  const [tokenSlip, setTokenSlip] = useState<TokenSlipData | null>(null);

  // Patient quick-add
  const { config: regConfig } = useRegConfig();
  const { patients, addPatient } = usePatients();
  const [selectedPat, setSelectedPat]       = useState<Patient | null>(null);
  const [walkIn, setWalkIn]                 = useState(false);
  const [search, setSearch]                 = useState("");
  const [showSearch, setShowSearch]         = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [quickFormValues, setQuickFormValues] = useState<Record<string, string>>({});
  const [quickGender, setQuickGender]       = useState<"M" | "F">("M");
  const searchRef = useRef<HTMLDivElement>(null);

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

  const called    = queue.filter(e => e.status === "called");
  const waiting   = queue.filter(e => e.status === "waiting");
  const completed = queue.filter(e => e.status === "completed");
  const nextToken = padToken(nextNum, "U");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function generateToken() {
    if (loading) return;
    setLoading(true);
    const snapToken   = nextToken;
    const snapPat     = walkIn ? null : selectedPat;
    const snapWalkIn  = walkIn;
    const snapBranch  = SEED_BRANCHES.find(b => b.id === branch)?.name ?? branch;
    const snapAt      = new Date();
    setTimeout(() => {
      const entry: QueueEntry = {
        id: uid(), tokenNumber: snapToken, displayNum: nextNum,
        status: "waiting", step: 1, totalSteps: 1, createdAt: snapAt,
        patient: snapPat ?? undefined,
      };
      setQueue(p => [...p, entry]);
      setNextNum(p => p + 1);
      setLoading(false);
      showToast(
        snapWalkIn ? `Token ${snapToken} generated (Walk-in)` :
        snapPat    ? `Token ${snapToken} generated for ${snapPat.name}` :
                    `Token ${snapToken} generated successfully`
      );
      setTokenSlip({
        tokenNumber: snapToken,
        color: "#10b981",
        queueLabel: "Single Queue",
        queueSub: "Camp / Walk-in Mode · Zero input required",
        patientName: snapPat?.name,
        patientMrn: snapPat?.mrn,
        branch: snapBranch,
        issuedAt: snapAt,
      });
      setSelectedPat(null);
      setSearch("");
    }, 600);
  }

  function callNext() {
    setQueue(prev => {
      const updated = [...prev];
      const calledIdx = updated.findIndex(e => e.status === "called");
      if (calledIdx >= 0) updated[calledIdx] = { ...updated[calledIdx], status: "completed" };
      const waitingIdx = updated.findIndex(e => e.status === "waiting");
      if (waitingIdx >= 0) updated[waitingIdx] = { ...updated[waitingIdx], status: "called" };
      return updated;
    });
  }

  // Quick-add modal helpers
  const queueKey = "single";
  const resolvedProfileId = regConfig.queueProfileMap[queueKey];
  const resolvedProfile   = resolvedProfileId
    ? regConfig.quickProfiles.find(p => p.id === resolvedProfileId)
    : regConfig.quickProfiles[0];
  const profileName = resolvedProfile?.name ?? "Default Profile";

  const DEFAULT_QUICK_FALLBACK = [
    { fieldId: "name" as const, label: "Name", visible: true, required: true },
    { fieldId: "phone" as const, label: "Phone", visible: true, required: true },
  ];
  const visFields = resolvedProfile
    ? resolvedProfile.fields.filter(f => f.visible)
    : DEFAULT_QUICK_FALLBACK;
  const INPUT_TYPE: Record<string, string>    = { dob: "date", phone: "tel" };
  const PLACEHOLDER: Record<string, string>   = { phone: "+92 …", name: "Full name", cnic: "00000-0000000-0" };
  const requiredFieldIds = visFields.filter(f => f.required).map(f => f.fieldId);
  const canSubmitQuick   = requiredFieldIds.every(id => !!(quickFormValues[id]?.trim()));

  function submitQuickReg() {
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
  }

  const statusDot = (s: QueueStatus) =>
    s === "called"    ? "bg-[#4982CF] animate-pulse" :
    s === "waiting"   ? "bg-amber-400" :
    "bg-slate-300";

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      <QueueAppHeader />

      {/* Page sub-header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
            <Zap className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Single Queue</h1>
            <p className="text-xs text-slate-400">Camp / Walk-in mode · Zero input required</p>
          </div>
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]">Active</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger className="h-8 w-52 text-xs border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEED_BRANCHES.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
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

      {/* Main content */}
      <div className="flex flex-1 gap-0 overflow-hidden">

        {/* LEFT — Token Generation Panel */}
        <div className="flex w-96 flex-shrink-0 flex-col border-r border-slate-200 bg-white overflow-hidden">

          {/* TOP — Fixed compact token display */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 bg-white">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Next Token</p>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-5 py-2 text-center flex-shrink-0">
                <p className="font-black tracking-widest font-mono text-4xl text-emerald-600 leading-none">{nextToken}</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">Auto-increments<br/>after each generation</p>
            </div>
          </div>

          {/* Patient section */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex-1">Patient</p>
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
                              <p className="text-[10px] text-slate-400 leading-tight">{p.mrn} · {p.gender === "M" ? "Male" : p.gender === "O" ? "Other" : "Female"}</p>
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

          {/* MIDDLE — Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            {/* Stats mini row */}
            <div className="flex w-full gap-3">
              {[
                { label: "Waiting",    value: waiting.length,   color: "text-amber-700",  bg: "bg-amber-50  border-amber-200"  },
                { label: "At Counter", value: called.length,   color: "text-[#4982CF]",  bg: "bg-blue-50   border-blue-200"   },
                { label: "Done",       value: completed.length, color: "text-slate-600",  bg: "bg-slate-50  border-slate-200"  },
              ].map(s => (
                <div key={s.label} className={`flex-1 rounded-xl border px-3 py-2.5 text-center ${s.bg}`}>
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-slate-400 leading-relaxed">
              One queue for all — patient selection optional.<br />
              Fastest token generation mode.
            </p>
          </div>

          {/* BOTTOM — Fixed footer: Generate + Call Next */}
          <div className="flex-shrink-0 border-t border-slate-100 p-4 space-y-2">
            <Button
              size="lg"
              onClick={generateToken}
              disabled={loading}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold rounded-xl shadow-md gap-2"
            >
              {loading
                ? <><RefreshCw className="h-5 w-5 animate-spin" />Generating…</>
                : <><Zap className="h-5 w-5" />Generate Token</>}
            </Button>
            <Button variant="outline" className="w-full h-10 gap-2 text-sm font-semibold text-slate-600" onClick={callNext} disabled={waiting.length === 0}>
              <Users className="h-4 w-4" />Call Next Token
            </Button>
          </div>
        </div>

        {/* RIGHT — Live Queue Preview */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Now Serving */}
          <div className="flex-shrink-0 border-b border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Now Serving</p>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-600">Live</span>
              </div>
            </div>

            {called.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="rounded-2xl border-2 border-[#4982CF]/40 bg-[#4982CF]/06 px-10 py-5 text-center shadow-sm">
                  <p className="font-black tracking-widest font-mono text-5xl text-[#4982CF]">{called[0].tokenNumber}</p>
                </div>
                <div className="space-y-1">
                  <Badge className="bg-blue-100 text-[#4982CF] border-blue-200 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4982CF] animate-pulse" />At Counter
                  </Badge>
                  {called[0].patient ? (
                    <p className="text-sm font-semibold text-slate-700">{called[0].patient.name}</p>
                  ) : (
                    <p className="text-sm font-semibold text-slate-700">Single Queue — All Visitors</p>
                  )}
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />Called {timeAgo(called[0].createdAt)}
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => {}}>
                    <Printer className="h-3.5 w-3.5" />Print
                  </Button>
                  <Button size="sm" className="bg-[#4982CF] hover:bg-[#3D73BC] text-white gap-1.5 text-xs" onClick={callNext}>
                    Complete & Call Next
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 p-6">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">No active token</p>
                  <p className="text-xs text-slate-400">Generate a token and call it to begin serving</p>
                </div>
              </div>
            )}
          </div>

          {/* Waiting List */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 flex-shrink-0">
              <p className="text-xs font-bold text-slate-500">Waiting Queue <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-700 text-[10px] font-bold">{waiting.length}</span></p>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-400 hover:text-slate-600">
                <RefreshCw className="h-3 w-3" />Refresh
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {waiting.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <Clock className="h-8 w-8 opacity-30" />
                  <p className="text-sm font-medium">No patients waiting</p>
                  <p className="text-xs">Generate a token to add to queue</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {waiting.map((entry, i) => (
                    <div key={entry.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/80 transition-colors">
                      <span className="w-5 text-xs font-bold text-slate-300 text-center">{i + 1}</span>
                      <div className={`h-2 w-2 rounded-full ${statusDot(entry.status)}`} />
                      <span className="font-mono text-base font-black text-slate-800 w-16">{entry.tokenNumber}</span>
                      <span className="flex-1 text-sm text-slate-500">
                        {entry.patient ? entry.patient.name : "Walk-in Patient"}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />{timeAgo(entry.createdAt)}
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 px-3 text-xs text-[#4982CF] hover:bg-[#4982CF]/10" onClick={callNext}>
                        Call Now
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed section */}
            {completed.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                <div className="px-6 py-2 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-400">{completed.length} completed today</p>
                  <div className="flex gap-1 ml-2">
                    {completed.slice(-5).map(e => (
                      <span key={e.id} className="font-mono text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 line-through">{e.tokenNumber}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick-add patient modal */}
      {showAddPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-[#4982CF]" />
                  <h2 className="text-base font-bold text-slate-900">Register New Patient</h2>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"
                  onClick={() => { setShowAddPatient(false); setQuickFormValues({}); setQuickGender("M"); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Single Queue</span>
                <span className="text-[10px] text-slate-300">·</span>
                <span className="text-[10px] font-semibold text-[#4982CF]">Profile: {profileName}</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const rows: React.ReactNode[] = [];
                let i = 0;
                while (i < visFields.length) {
                  const f    = visFields[i];
                  const next = visFields[i + 1];
                  if (next) {
                    rows.push(
                      <div key={`gr-${i}`} className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{f.label}{f.required && " *"}</label>
                          <Input className="h-9 text-sm" type={INPUT_TYPE[f.fieldId] ?? "text"} placeholder={PLACEHOLDER[f.fieldId] ?? f.label}
                            value={quickFormValues[f.fieldId] ?? ""}
                            onChange={e => setQuickFormValues(prev => ({ ...prev, [f.fieldId]: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{next.label}{next.required && " *"}</label>
                          <Input className="h-9 text-sm" type={INPUT_TYPE[next.fieldId] ?? "text"} placeholder={PLACEHOLDER[next.fieldId] ?? next.label}
                            value={quickFormValues[next.fieldId] ?? ""}
                            onChange={e => setQuickFormValues(prev => ({ ...prev, [next.fieldId]: e.target.value }))} />
                        </div>
                      </div>
                    );
                    i += 2;
                  } else {
                    rows.push(
                      <div key={`sr-${i}`}>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{f.label}{f.required && " *"}</label>
                        <Input className="h-9 text-sm" type={INPUT_TYPE[f.fieldId] ?? "text"} placeholder={PLACEHOLDER[f.fieldId] ?? f.label}
                          value={quickFormValues[f.fieldId] ?? ""}
                          onChange={e => setQuickFormValues(prev => ({ ...prev, [f.fieldId]: e.target.value }))} />
                      </div>
                    );
                    i++;
                  }
                }
                return rows;
              })()}
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
            <div className="flex gap-3 px-6 pb-6">
              <Button variant="outline" className="flex-1"
                onClick={() => { setShowAddPatient(false); setQuickFormValues({}); setQuickGender("M"); }}>
                Cancel
              </Button>
              <Button className="flex-1 bg-[#4982CF] hover:bg-[#3D73BC] text-white" disabled={!canSubmitQuick} onClick={submitQuickReg}>
                Register & Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
