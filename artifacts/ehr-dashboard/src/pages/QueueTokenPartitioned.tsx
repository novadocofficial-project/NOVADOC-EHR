import { useState, useEffect } from "react";
import { Users, CheckCircle2, Clock, RefreshCw, Printer, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  QueueAppHeader, QueueEntry, Doctor, SEED_BRANCHES, SEED_DOCTORS,
  padToken, timeAgo, uid,
} from "@/pages/QueuePageLayout";

// ─── Per-doctor seed queues ───────────────────────────────────────────────────

type DoctorQueue = {
  doctor: Doctor;
  entries: QueueEntry[];
  nextNum: number;
};

const now = new Date();

function makeSeed(doctor: Doctor, entries: Array<{ num: number; status: "serving" | "waiting" | "completed"; minsAgo: number }>): DoctorQueue {
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
    { num: 42, status: "serving",   minsAgo: 5  },
    { num: 43, status: "waiting",   minsAgo: 2  },
    { num: 44, status: "waiting",   minsAgo: 1  },
  ]),
  makeSeed(SEED_DOCTORS[1], [
    { num: 16, status: "completed", minsAgo: 30 },
    { num: 17, status: "serving",   minsAgo: 8  },
    { num: 18, status: "waiting",   minsAgo: 3  },
  ]),
  makeSeed(SEED_DOCTORS[2], [
    { num: 27, status: "completed", minsAgo: 20 },
    { num: 28, status: "serving",   minsAgo: 6  },
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

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 10000);
    return () => clearInterval(t);
  }, []);

  const selectedDQ  = doctorQueues.find(d => d.doctor.id === selectedDoc)!;
  const nextToken   = padToken(selectedDQ.nextNum, selectedDQ.doctor.prefix);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function generateToken() {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setDQ(prev => prev.map(dq => {
        if (dq.doctor.id !== selectedDoc) return dq;
        const entry: QueueEntry = {
          id: uid(), tokenNumber: padToken(dq.nextNum, dq.doctor.prefix),
          displayNum: dq.nextNum, status: "waiting",
          doctorId: dq.doctor.id, doctorName: dq.doctor.name,
          step: 1, totalSteps: 1, createdAt: new Date(),
        };
        return { ...dq, entries: [...dq.entries, entry], nextNum: dq.nextNum + 1 };
      }));
      setLoading(false);
      showToast(`Token ${nextToken} generated for ${selectedDQ.doctor.name.replace("Dr. ", "Dr. ")}`);
    }, 600);
  }

  function callNext(doctorId: string) {
    setDQ(prev => prev.map(dq => {
      if (dq.doctor.id !== doctorId) return dq;
      const entries = [...dq.entries];
      const si = entries.findIndex(e => e.status === "serving");
      if (si >= 0) entries[si] = { ...entries[si], status: "completed" };
      const wi = entries.findIndex(e => e.status === "waiting");
      if (wi >= 0) entries[wi] = { ...entries[wi], status: "serving" };
      return { ...dq, entries };
    }));
  }

  const visibleDQs = filterDoc === "all"
    ? doctorQueues
    : doctorQueues.filter(d => d.doctor.id === filterDoc);

  const totalWaiting = doctorQueues.reduce((acc, dq) => acc + dq.entries.filter(e => e.status === "waiting").length, 0);

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

          {/* MIDDLE — Scrollable doctor selection */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Doctor</p>
              <div className="space-y-2">
                {doctorQueues.map(dq => {
                  const isSelected = dq.doctor.id === selectedDoc;
                  const waiting = dq.entries.filter(e => e.status === "waiting").length;
                  const serving = dq.entries.filter(e => e.status === "serving");
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
                          {serving.length > 0 && (
                            <span className="font-mono text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1.5">{serving[0].tokenNumber}</span>
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
              const serving   = dq.entries.filter(e => e.status === "serving");
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
                      {serving.length > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Serving {serving[0].tokenNumber}
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

                  {/* Serving + waiting tokens */}
                  <div className="p-4">
                    {serving.length === 0 && waiting.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-2">No active tokens</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {serving.map(e => (
                          <div key={e.id} className="flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5"
                            style={{ borderColor: dq.doctor.color, backgroundColor: dq.doctor.color + "0C" }}>
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-mono font-black text-sm" style={{ color: dq.doctor.color }}>{e.tokenNumber}</span>
                            <Badge className="text-[9px] bg-emerald-100 text-emerald-700 border-emerald-200 px-1">Serving</Badge>
                          </div>
                        ))}
                        {waiting.map((e, i) => (
                          <div key={e.id} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                            <span className="text-[10px] text-slate-400 font-bold w-3">{i + 1}</span>
                            <span className="font-mono font-black text-sm text-slate-700">{e.tokenNumber}</span>
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
    </div>
  );
}
