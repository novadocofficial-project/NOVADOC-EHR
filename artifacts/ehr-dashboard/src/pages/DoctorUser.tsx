import { useState, useEffect } from "react";
import {
  PhoneCall, SkipForward, RotateCcw,
  ChevronUp, Clock, AlertCircle, X,
  CheckCircle2, Stethoscope, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueueAppHeader, timeAgo } from "@/pages/QueuePageLayout";
import { useMultiStepQueue, MultiEntry } from "@/hooks/useMultiStepQueue";
import { useToast } from "@/hooks/use-toast";
import { PatientFaceSheet } from "@/pages/PatientFaceSheet";

// ─── Constants ────────────────────────────────────────────────────────────────

const CALL_WINDOW_SECS = 30;
const MAX_CALLS = 3;
const ACCENT = "#4982CF";

function getSecsLeft(ts: number | null): number {
  if (!ts) return 0;
  return Math.max(0, CALL_WINDOW_SECS - Math.floor((Date.now() - ts) / 1000));
}

// ─── Doctor User Page ─────────────────────────────────────────────────────────

export function DoctorUser() {
  const {
    queue,
    docCall, docTimerExpire, docAtCounter, docCompleteConsultation, docSkip, docRecall,
  } = useMultiStepQueue();

  const { toast } = useToast();
  const [tick, setTick] = useState(0);
  const [showSkipped, setShowSkipped] = useState(false);
  const [faceSheetEntry, setFaceSheetEntry] = useState<MultiEntry | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Expire call timers
  useEffect(() => {
    queue.forEach(e => {
      if (!e.callTimestamp) return;
      if (Date.now() - e.callTimestamp >= CALL_WINDOW_SECS * 1000) {
        docTimerExpire(e.id);
        if (e.callCount >= MAX_CALLS) {
          toast({ title: `Token ${e.tokenNumber} auto-skipped after ${MAX_CALLS} calls` });
        }
      }
    });
  }, [tick]);

  // Filter to Doctor Consultation step (step 3)
  const docQueue = queue
    .filter(e => e.step === 3 && e.status !== "completed" && !e.skipped)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const skippedQueue   = queue.filter(e => e.step === 3 && e.skipped);
  const atCounterEntry = docQueue.find(e => e.status === "called") ?? null;
  const activeCallEntry = docQueue.find(e => e.callTimestamp !== null && getSecsLeft(e.callTimestamp) > 0) ?? null;
  const waitingTokens  = docQueue.filter(e => e.status === "waiting" && !e.callTimestamp);

  const secsLeft = getSecsLeft(activeCallEntry?.callTimestamp ?? null);
  const timerPct = (secsLeft / CALL_WINDOW_SECS) * 100;

  function handleCall(id: string) {
    docCall(id);
    toast({ title: "Token called — 30 second window started" });
  }

  function handleConsultation(entry: MultiEntry) {
    docAtCounter(entry.id);
    setFaceSheetEntry(entry);
    toast({ title: `${entry.tokenNumber} is now with the doctor` });
  }

  function handleCompleteConsultation(id: string, tokenNum: string) {
    docCompleteConsultation(id);
    setFaceSheetEntry(null);
    toast({ title: `Consultation complete — ${tokenNum} advanced to next step` });
  }

  function handleOpenFaceSheet(entry: MultiEntry) {
    setFaceSheetEntry(entry);
  }

  function handleFaceSheetComplete(id: string) {
    const entry = queue.find(e => e.id === id);
    handleCompleteConsultation(id, entry?.tokenNumber ?? id);
  }

  function handleSkip(id: string) {
    docSkip(id);
    toast({ title: "Token skipped" });
  }

  function handleRecall(id: string, tokenNum: string) {
    docRecall(id);
    toast({ title: `Token ${tokenNum} recalled to queue` });
  }

  // ── Face Sheet full-page view ─────────────────────────────────────────────
  if (faceSheetEntry) {
    const liveEntry = queue.find(e => e.id === faceSheetEntry.id) ?? faceSheetEntry;
    return (
      <PatientFaceSheet
        entry={liveEntry}
        onBack={() => setFaceSheetEntry(null)}
        onCompleteConsultation={handleFaceSheetComplete}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      <QueueAppHeader />

      {/* Blue status bar */}
      <div className="flex items-center gap-3 px-6 py-2.5 flex-shrink-0" style={{ backgroundColor: ACCENT }}>
        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
        <p className="text-xs font-bold text-white/90 uppercase tracking-widest">
          Doctor Consultation · Main Branch — Lahore
        </p>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-white/70">Step:</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
            Doctor Consultation · 3 of 5
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Queue Stats</p>
            {[
              { label: "At Counter", value: docQueue.filter(e => e.status === "called").length, style: { color: ACCENT }, bg: "bg-blue-50 border-blue-200" },
              { label: "Waiting",    value: waitingTokens.length, style: { color: "#b45309" }, bg: "bg-amber-50 border-amber-200" },
              { label: "Skipped",    value: skippedQueue.length,  style: { color: "#dc2626" }, bg: "bg-red-50 border-red-200"     },
            ].map(s => (
              <div key={s.label} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 mb-2 ${s.bg}`}>
                <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                <span className="text-lg font-black" style={s.style}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Assigned Queues</p>
            <div className="rounded-xl border px-4 py-3" style={{ borderColor: `${ACCENT}4D`, backgroundColor: `${ACCENT}0A` }}>
              <div className="flex items-center gap-2 mb-1">
                <Stethoscope className="h-4 w-4" style={{ color: ACCENT }} />
                <p className="text-sm font-bold" style={{ color: ACCENT }}>Consultation Queue</p>
              </div>
              <p className="text-xs text-slate-500">Step 3 tokens · No billing</p>
            </div>
          </div>
        </div>

        {/* ── MAIN AREA ─────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* AT COUNTER */}
            {atCounterEntry && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                    Now In Consultation
                  </p>
                </div>
                <div className="rounded-2xl border-2 bg-white shadow-sm overflow-hidden" style={{ borderColor: `${ACCENT}4D` }}>
                  <div className="h-1 w-full" style={{ backgroundColor: ACCENT }} />
                  <div className="flex items-center gap-5 px-6 py-5">
                    <div className="flex-shrink-0 text-center">
                      <div className="rounded-2xl border-2 px-6 py-3" style={{ borderColor: `${ACCENT}80`, backgroundColor: `${ACCENT}0D` }}>
                        <p className="font-mono font-black text-2xl" style={{ color: ACCENT }}>{atCounterEntry.tokenNumber}</p>
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
                        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />
                        <span className="text-xs font-semibold" style={{ color: ACCENT }}>In Consultation</span>
                        <span className="text-slate-300">·</span>
                        <Clock className="h-3 w-3 text-slate-300" />
                        <span className="text-xs text-slate-400">{timeAgo(atCounterEntry.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        className="h-10 px-5 text-sm font-bold gap-2 text-white"
                        style={{ backgroundColor: ACCENT }}
                        onClick={() => handleOpenFaceSheet(atCounterEntry)}>
                        <FileText className="h-4 w-4" /> Open Face Sheet
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="h-8 px-3 text-xs border-slate-200 hover:border-[#4982CF] hover:text-[#4982CF] gap-1.5"
                        onClick={() => handleCompleteConsultation(atCounterEntry.id, atCounterEntry.tokenNumber)}>
                        <CheckCircle2 className="h-3 w-3" /> Complete
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="border-red-200 text-red-500 hover:bg-red-50 text-xs"
                        onClick={() => handleSkip(atCounterEntry.id)}>
                        <SkipForward className="h-3 w-3 mr-1" /> Skip
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVE CALL WINDOW */}
            {activeCallEntry && !atCounterEntry && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Call Window Active</p>
                </div>
                <div className="rounded-2xl border-2 border-amber-200 bg-white shadow-sm overflow-hidden">
                  <div className="h-1.5 w-full bg-slate-100 relative">
                    <div
                      className="h-full transition-all duration-1000"
                      style={{ width: `${timerPct}%`, backgroundColor: secsLeft < 10 ? "#ef4444" : "#f59e0b" }}
                    />
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
                        style={{ backgroundColor: ACCENT }}
                        onClick={() => handleConsultation(activeCallEntry)}>
                        <Stethoscope className="h-4 w-4" /> Consultation
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="border-red-200 text-red-500 hover:bg-red-50 text-xs"
                        onClick={() => handleSkip(activeCallEntry.id)}>
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
                  <Stethoscope className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">Queue is empty</p>
                  <p className="text-xs">No patients waiting for consultation</p>
                </div>
              )}
              <div className="space-y-2">
                {waitingTokens.map((entry, idx) => {
                  const isFirst = idx === 0 && !atCounterEntry && !activeCallEntry;
                  const isCalled = entry.callTimestamp !== null && getSecsLeft(entry.callTimestamp) > 0;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-4 rounded-xl border px-4 py-3 bg-white transition-all ${isFirst ? "border-slate-300 shadow-sm" : "border-slate-100 opacity-70"}`}>
                      <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-black bg-slate-100 text-slate-500">
                        {idx + 1}
                      </div>
                      <div className="font-mono font-black text-sm text-slate-700 flex-shrink-0">{entry.tokenNumber}</div>
                      <div className="flex-1 min-w-0">
                        {entry.patient
                          ? <p className="text-sm font-bold text-slate-800 truncate">{entry.patient.name}<span className="ml-2 text-xs font-normal text-slate-400">{entry.patient.mrn}</span></p>
                          : <p className="text-sm font-bold text-slate-500">Walk-in Patient</p>
                        }
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(entry.createdAt)}</span>
                      {isFirst ? (
                        isCalled ? (
                          <Button
                            size="sm"
                            className="h-8 px-4 text-xs font-bold flex-shrink-0 gap-1.5 text-white"
                            style={{ backgroundColor: ACCENT }}
                            onClick={() => handleConsultation(entry)}>
                            <Stethoscope className="h-3.5 w-3.5" /> Consultation
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="h-8 px-4 text-xs font-bold flex-shrink-0 gap-1.5 text-white"
                            style={{ backgroundColor: ACCENT }}
                            onClick={() => handleCall(entry.id)}>
                            <PhoneCall className="h-3.5 w-3.5" /> Call
                          </Button>
                        )
                      ) : (
                        <div className="h-8 px-4 flex items-center text-[10px] font-semibold text-slate-400 flex-shrink-0">Locked</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SKIPPED PANEL */}
          {skippedQueue.length > 0 && (
            <>
              <button
                onClick={() => setShowSkipped(v => !v)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-red-200 bg-white shadow-lg px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-all z-10">
                <AlertCircle className="h-3.5 w-3.5" />
                Skipped Tokens ({skippedQueue.length})
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
                  <div className="overflow-y-auto flex-1 p-4 space-y-2">
                    {skippedQueue.map(entry => (
                      <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                        <div className="font-mono font-black text-sm text-red-700 flex-shrink-0">{entry.tokenNumber}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {entry.patient?.name ?? "Walk-in Patient"}
                          </p>
                          <p className="text-xs text-slate-400">Skipped after {entry.callCount} call{entry.callCount !== 1 ? "s" : ""}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs border-slate-200 gap-1.5 hover:border-[#4982CF] hover:text-[#4982CF]"
                          onClick={() => handleRecall(entry.id, entry.tokenNumber)}>
                          <RotateCcw className="h-3 w-3" /> Recall
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
    </div>
  );
}
