import { useState, useEffect, useRef } from "react";
import { Users, CheckCircle2, Clock, RefreshCw, Printer, ChevronRight, UserPlus, UserX, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  QueueAppHeader, QueueEntry, Doctor, Patient, SEED_BRANCHES, SEED_DOCTORS,
  padToken, timeAgo, uid, TokenSlipModal, TokenSlipData,
} from "@/pages/QueuePageLayout";
import { useRegConfig } from "@/hooks/useRegConfig";
import { usePatients } from "@/hooks/usePatients";

// ─── Per-doctor seed queues ───────────────────────────────────────────────────

type DoctorQueue = {
  doctor: Doctor;
  entries: QueueEntry[];
  nextNum: number;
};

const now = new Date();

function makeSeed(doctor: Doctor, entries: Array<{ num: number; status: "called" | "waiting" | "completed"; minsAgo: number }>): DoctorQueue {
  return {
    doctor,
    nextNum: Math.max(...entries.map(e => e.num)) + 1,
    entries: entries.map(e => ({
      id: uid(),
      tokenNumber: padToken(e.num, doctor.prefix),
      displayNum: e.num,
      status: e.status,
      doctorId: doctor.id,
      doctorName: doctor.name,
      step: 1, totalSteps: 1,
      createdAt: new Date(now.getTime() - e.minsAgo * 60000),
    })),
  };
}

const INITIAL_DQ: DoctorQueue[] = [
  makeSeed(SEED_DOCTORS[0], [
    { num: 40, status: "completed", minsAgo: 25 },
    { num: 41, status: "completed", minsAgo: 14 },
    { num: 42, status: "called",    minsAgo: 5  },
    { num: 43, status: "waiting",   minsAgo: 2  },
    { num: 44, status: "waiting",   minsAgo: 1  },
  ]),
  makeSeed(SEED_DOCTORS[1], [
    { num: 16, status: "completed", minsAgo: 30 },
    { num: 17, status: "called",    minsAgo: 8  },
    { num: 18, status: "waiting",   minsAgo: 3  },
  ]),
  makeSeed(SEED_DOCTORS[2], [
    { num: 27, status: "completed", minsAgo: 20 },
    { num: 28, status: "called",    minsAgo: 6  },
    { num: 29, status: "waiting",   minsAgo: 4  },
    { num: 30, status: "waiting",   minsAgo: 2  },
  ]),
];

// ─── Component ────────────────────────────────────────────────────────────────

export function QueueTokenPartitioned() {
  const [branch, setBranch]       = useState(SEED_BRANCHES[0].id);
  const [doctorQueues, setDQ]     = useState<DoctorQueue[]>(INITIAL_DQ);
  const [selectedDoc, setSelected] = useState<string>(SEED_DOCTORS[0].id);
  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState<string | null>(null);
  const [filterDoc, setFilterDoc] = useState<string | "all">("all");
  const [tick, setTick]           = useState(0);
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

  const selectedDQ  = doctorQueues.find(d => d.doctor.id === selectedDoc)!;
  const nextToken   = padToken(selectedDQ.nextNum, selectedDQ.doctor.prefix);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function generateToken() {
    if (loading) return;
    setLoading(true);
    const snapToken   = nextToken;
    const snapDoctor  = selectedDQ.doctor;
    const snapPat     = selectedPat;
    const snapBranch  = SEED_BRANCHES.find(b => b.id === branch)?.name ?? branch;
    const snapAt      = new Date();
    setTimeout(() => {
      setDQ(prev => prev.map(dq => {
        if (dq.doctor.id !== selectedDoc) return dq;
        const entry: QueueEntry = {
          id: uid(), tokenNumber: padToken(dq.nextNum, dq.doctor.prefix),
          displayNum: dq.nextNum, status: "waiting",
          doctorId: dq.doctor.id, doctorName: dq.doctor.name,
          step: 1, totalSteps: 1, createdAt: snapAt,
          patient: snapPat ?? undefined,
        };
        return { ...dq, entries: [...dq.entries, entry], nextNum: dq.nextNum + 1 };
      }));
      setLoading(false);
      showToast(snapPat
        ? `Token ${snapToken} generated for ${snapPat.name} · ${snapDoctor.name}`
        : `Token ${snapToken} generated for ${snapDoctor.name}`);
      setTokenSlip({
        tokenNumber: snapToken,
        color: snapDoctor.color,
        queueLabel: snapDoctor.name,
        queueSub: `${snapDoctor.specialty} · ${snapDoctor.counter}`,
        patientName: snapPat?.name,
        patientMrn: snapPat?.mrn,
        branch: snapBranch,
        issuedAt: snapAt,
      });
      setSelectedPat(null);
      setSearch("");
    }, 600);
  }

  function callNext(doctorId: string) {
    setDQ(prev => prev.map(dq => {
      if (dq.doctor.id !== doctorId) return dq;
      const entries = [...dq.entries];
      const ci = entries.findIndex(e => e.status === "called");
      if (ci >= 0) entries[ci] = { ...entries[ci], status: "completed" };
      const wi = entries.findIndex(e => e.status === "waiting");
      if (wi >= 0) entries[wi] = { ...entries[wi], status: "called" };
      return { ...dq, entries };
    }));
  }

  const visibleDQs = filterDoc === "all"
    ? doctorQueues
    : doctorQueues.filter(d => d.doctor.id === filterDoc);

  const totalWaiting = doctorQueues.reduce((acc, dq) => acc + dq.entries.filter(e => e.status === "waiting").length, 0);

  // Quick-add modal helpers
  const queueKey = "partitioned";
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
  const INPUT_TYPE: Record<string, string>  = { dob: "date", phone: "tel" };
  const PLACEHOLDER: Record<string, string> = { phone: "+92 …", name: "Full name", cnic: "00000-0000000-0" };
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

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      <QueueAppHeader />

      {/* Sub-header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <Users className="h-4 w-4 text-[#4982CF]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Partitioned Queue</h1>
            <p className="text-xs text-slate-400">Multi-doctor clinic · Separate queue per doctor</p>
          </div>
          <Badge className="border-blue-200 bg-blue-50 text-[#4982CF] text-[10px]">{SEED_DOCTORS.length} Doctors</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger className="h-8 w-52 text-xs border-slate-200"><SelectValue /></SelectTrigger>
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

      <div className="flex flex-1 gap-0 overflow-hidden">

        {/* LEFT */}
        <div className="flex w-96 flex-shrink-0 flex-col border-r border-slate-200 bg-white overflow-hidden">

          {/* TOP — Fixed compact token display */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 bg-white">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Next Token</p>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border-2 px-5 py-2 text-center flex-shrink-0"
                style={{ borderColor: selectedDQ.doctor.color + "60", backgroundColor: selectedDQ.doctor.color + "0C" }}>
                <p className="font-black tracking-widest font-mono text-4xl leading-none" style={{ color: selectedDQ.doctor.color }}>{nextToken}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 leading-tight">{selectedDQ.doctor.name}</p>
                <p className="text-xs text-slate-400 leading-tight">{selectedDQ.doctor.counter}</p>
              </div>
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

          {/* MIDDLE — Scrollable doctor selection */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Doctor</p>
              <div className="space-y-2">
                {doctorQueues.map(dq => {
                  const isSelected = dq.doctor.id === selectedDoc;
                  const waiting = dq.entries.filter(e => e.status === "waiting").length;
                  const called  = dq.entries.filter(e => e.status === "called");
                  return (
                    <button
                      key={dq.doctor.id}
                      onClick={() => setSelected(dq.doctor.id)}
                      className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                        isSelected
                          ? "shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                      }`}
                      style={isSelected ? {
                        borderColor: dq.doctor.color,
                        backgroundColor: dq.doctor.color + "0A",
                      } : undefined}
                    >
                      <div className="flex items-center gap-3">
                        {/* Radio dot */}
                        <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all`}
                          style={{
                            borderColor: isSelected ? dq.doctor.color : "#CBD5E1",
                            backgroundColor: isSelected ? dq.doctor.color : "white",
                          }}>
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        {/* Avatar */}
                        <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: dq.doctor.color }}>
                          {dq.doctor.initials}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 leading-tight">{dq.doctor.name}</p>
                          <p className="text-xs text-slate-500 leading-tight">{dq.doctor.specialty}</p>
                        </div>
                        {/* Queue stats */}
                        <div className="flex flex-col items-end gap-0.5">
                          {called.length > 0 && (
                            <span className="font-mono text-[10px] font-black text-[#4982CF] bg-blue-50 border border-blue-200 rounded px-1.5 flex items-center gap-1">
                              <span className="h-1 w-1 rounded-full bg-[#4982CF] animate-pulse" />{called[0].tokenNumber}
                            </span>
                          )}
                          {waiting > 0 && (
                            <span className="text-[10px] font-semibold text-amber-600">{waiting} waiting</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
          </div>

          {/* BOTTOM — Fixed generate button */}
          <div className="flex-shrink-0 border-t border-slate-100 p-4">
            <Button
              size="lg"
              onClick={generateToken}
              disabled={loading}
              className="w-full h-14 text-white text-base font-bold rounded-xl shadow-md gap-2"
              style={{ backgroundColor: selectedDQ.doctor.color }}
            >
              {loading
                ? <><RefreshCw className="h-5 w-5 animate-spin" />Generating…</>
                : <><Users className="h-5 w-5" />Generate Token</>}
            </Button>
          </div>
        </div>

        {/* RIGHT — Live Queue */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Filter bar */}
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-6 py-3 flex-shrink-0">
            <p className="text-xs font-bold text-slate-400 mr-2">View:</p>
            <button
              onClick={() => setFilterDoc("all")}
              className={`h-7 px-3 rounded-full text-xs font-semibold transition-all ${filterDoc === "all" ? "bg-[#4982CF] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              All Doctors
            </button>
            {doctorQueues.map(dq => (
              <button
                key={dq.doctor.id}
                onClick={() => setFilterDoc(dq.doctor.id)}
                className={`h-7 px-3 rounded-full text-xs font-semibold transition-all ${filterDoc === dq.doctor.id ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                style={filterDoc === dq.doctor.id ? { backgroundColor: dq.doctor.color } : undefined}
              >
                {dq.doctor.name.replace("Dr. ", "")}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-400">{totalWaiting} total waiting</span>
          </div>

          {/* Doctor queue panels */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {visibleDQs.map(dq => {
              const called    = dq.entries.filter(e => e.status === "called");
              const waiting   = dq.entries.filter(e => e.status === "waiting");
              const completed = dq.entries.filter(e => e.status === "completed");
              return (
                <div key={dq.doctor.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Doctor header */}
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100"
                    style={{ backgroundColor: dq.doctor.color + "08" }}>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: dq.doctor.color }}>
                      {dq.doctor.initials}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{dq.doctor.name}</p>
                      <p className="text-xs text-slate-500">{dq.doctor.specialty} · {dq.doctor.counter}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {called.length > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#4982CF]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#4982CF] animate-pulse" />
                          At Counter: {called[0].tokenNumber}
                          {called[0].patient && <span className="text-slate-400 font-normal">· {called[0].patient.name.split(" ")[0]}</span>}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        {waiting.length} waiting
                      </span>
                      <Button variant="outline" size="sm" className="h-7 px-3 text-xs font-semibold gap-1"
                        style={{ borderColor: dq.doctor.color + "60", color: dq.doctor.color }}
                        onClick={() => callNext(dq.doctor.id)} disabled={waiting.length === 0}>
                        Call Next <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Called + waiting tokens */}
                  <div className="p-4">
                    {called.length === 0 && waiting.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-2">No active tokens</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {called.map(e => (
                          <div key={e.id} className="flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5"
                            style={{ borderColor: dq.doctor.color, backgroundColor: dq.doctor.color + "0C" }}>
                            <span className="h-2 w-2 rounded-full bg-[#4982CF] animate-pulse" />
                            <span className="font-mono font-black text-sm" style={{ color: dq.doctor.color }}>{e.tokenNumber}</span>
                            {e.patient && <span className="text-[10px] text-slate-500 font-semibold">{e.patient.name.split(" ")[0]}</span>}
                            <Badge className="text-[9px] bg-blue-100 text-[#4982CF] border-blue-200 px-1">At Counter</Badge>
                          </div>
                        ))}
                        {waiting.map((e, i) => (
                          <div key={e.id} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                            <span className="text-[10px] text-slate-400 font-bold w-3">{i + 1}</span>
                            <span className="font-mono font-black text-sm text-slate-700">{e.tokenNumber}</span>
                            {e.patient && <span className="text-[10px] text-slate-500 font-semibold">{e.patient.name.split(" ")[0]}</span>}
                            <span className="text-[9px] text-slate-400">{timeAgo(e.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {completed.length > 0 && (
                      <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />{completed.length} completed
                        <span className="ml-1">{completed.slice(-3).map(e => e.tokenNumber).join(", ")}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
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
                <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedDQ.doctor.color }} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Partitioned Queue · {selectedDQ.doctor.name}</span>
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
