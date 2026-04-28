import { useState, useEffect, useMemo } from "react";
import {
  PhoneCall, SkipForward, RotateCcw,
  ChevronUp, Clock, AlertCircle, X,
  CheckCircle2, Stethoscope, FileText, FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueueAppHeader, timeAgo } from "@/pages/QueuePageLayout";
import { useMultiStepQueue, MultiEntry } from "@/hooks/useMultiStepQueue";
import { clearSoapDraft, hasSoapDraft } from "@/hooks/useSoapNoteDraft";
import { useToast } from "@/hooks/use-toast";
import type { SignedRecord } from "@/pages/SoapNotePage";
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
    docCall, docTimerExpire, docAtCounter,
    docCompleteConsultation, docMarkComplete, docSkip, docRecall, docSendToLab, docCancelLab,
  } = useMultiStepQueue();

  const { toast } = useToast();
  const [tick, setTick] = useState(0);
  const [showSkipped, setShowSkipped] = useState(false);
  const [showPendingLab, setShowPendingLab] = useState(false);
  const [faceSheetEntry, setFaceSheetEntry] = useState<MultiEntry | null>(null);

  // Tracks which token IDs had SOAP Note clicked this session (in-memory bridge
  // for the ~800ms before the first debounced draft hits localStorage).
  const [soapNoteDoneSession, setSoapNoteDoneSession] = useState<Set<string>>(new Set());

  // Tracks doctor-signed notes per entry
  const [signedRecordsMap, setSignedRecordsMap] = useState<Map<string, SignedRecord[]>>(new Map());

  // Skip-reason modal state
  const [skipModalId,    setSkipModalId]    = useState<string | null>(null);
  const [skipReason,     setSkipReason]     = useState("");
  const [skipOtherText,  setSkipOtherText]  = useState("");

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
    .filter(e => e.step === 3 && e.status !== "completed" && !e.skipped && !e.pendingLab)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Derived: set of entry IDs the queue should treat as "has SOAP note".
  // Three sources, in order of authority:
  //   (a) entries with a persisted draft on disk (survives page navigation)
  //   (b) entries with at least one signed record in this session
  //   (c) short-lived session bridge for the ~800ms before the first
  //       debounced draft save lands in localStorage
  // Re-evaluated each tick (1s) so freshly-saved drafts surface promptly.
  const soapNoteDone = useMemo(() => {
    const merged = new Set<string>();
    queue.forEach(e => { if (hasSoapDraft(e.id)) merged.add(e.id); });
    signedRecordsMap.forEach((records, id) => {
      if (records.length > 0) merged.add(id);
    });
    soapNoteDoneSession.forEach(id => merged.add(id));
    return merged;
  }, [soapNoteDoneSession, queue, tick, signedRecordsMap]);

  const skippedQueue   = queue.filter(e => e.step === 3 && e.skipped);
  const pendingLabQueue = queue.filter(e => e.step === 3 && e.pendingLab && !e.skipped && e.status !== "completed");

  // Lab queue (step 4) counts — reactive via shared useMultiStepQueue
  // Entries advance to step 5 when lab is done, so "completed" at step 4 tracks
  // those that have passed through; "at counter" are being actively processed.
  const labWaiting   = queue.filter(e => e.step === 4 && e.status === "waiting" && !e.skipped).length;
  const labAtCounter = queue.filter(e => e.step === 4 && e.status === "called").length;
  const labDone      = queue.filter(e => e.step > 4 || (e.step === 4 && e.status === "completed")).length;
  const atCounterEntry = docQueue.find(e => e.status === "called") ?? null;
  const activeCallEntry = docQueue.find(e => e.callTimestamp !== null && getSecsLeft(e.callTimestamp) > 0) ?? null;
  const waitingTokens  = docQueue.filter(e => e.status === "waiting" && !e.callTimestamp);

  const secsLeft = getSecsLeft(activeCallEntry?.callTimestamp ?? null);
  const timerPct = (secsLeft / CALL_WINDOW_SECS) * 100;

  function handleCall(id: string) {
    docCall(id);
    toast({ title: "Token called — 30 second window started" });
  }

  function handleSoapNoteClick(id: string) {
    setSoapNoteDoneSession(prev => new Set([...prev, id]));
    toast({ title: "SOAP Note marked as created" });
  }

  // Drop the session-bridge entry for an id whenever the underlying draft is
  // (or about to be) cleared. After this runs, `soapNoteDone` is driven solely
  // by the authoritative sources (persisted draft + signed records).
  function pruneSoapNoteSession(id: string) {
    setSoapNoteDoneSession(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleConsultation(entry: MultiEntry) {
    docAtCounter(entry.id);
    setFaceSheetEntry(entry);
    toast({ title: `${entry.tokenNumber} is now with the doctor` });
  }

  function handleOpenFaceSheet(entry: MultiEntry) {
    setFaceSheetEntry(entry);
  }

  // With SOAP note — advance to next step
  function handleFaceSheetComplete(id: string) {
    const entry = queue.find(e => e.id === id);
    docCompleteConsultation(id);
    clearSoapDraft(id);
    pruneSoapNoteSession(id);
    setFaceSheetEntry(null);
    toast({ title: `Consultation complete — ${entry?.tokenNumber ?? id} advanced to next step` });
  }

  // Without SOAP note — mark as complete, don't advance
  function handleCompleteWithoutSoap(id: string, reason: string, nextAppt: string) {
    const entry = queue.find(e => e.id === id);
    docMarkComplete(id);
    clearSoapDraft(id);
    pruneSoapNoteSession(id);
    setFaceSheetEntry(null);
    toast({ title: `${entry?.tokenNumber ?? id} marked complete · Next appt: ${nextAppt}` });
  }

  function handleSkipClick(id: string) {
    // If no SOAP note for this token, require a reason via modal
    if (!soapNoteDone.has(id)) {
      setSkipReason("");
      setSkipOtherText("");
      setSkipModalId(id);
    } else {
      docSkip(id);
      toast({ title: "Token skipped" });
    }
  }

  function confirmSkip() {
    if (!skipModalId) return;
    const reasonText = skipReason === "Other" ? skipOtherText.trim() : skipReason;
    if (!reasonText) return;
    docMarkComplete(skipModalId);
    clearSoapDraft(skipModalId);
    pruneSoapNoteSession(skipModalId);
    const entry = queue.find(e => e.id === skipModalId);
    setSkipModalId(null);
    toast({ title: `${entry?.tokenNumber ?? skipModalId} marked complete (skipped — no SOAP note)` });
  }

  function handleRecall(id: string, tokenNum: string) {
    docRecall(id);
    toast({ title: `Token ${tokenNum} recalled to queue` });
  }

  function handleSendToLab(id: string) {
    const entry = queue.find(e => e.id === id);
    docSendToLab(id);
    toast({ title: `Lab order sent — ${entry?.tokenNumber ?? id} moved to Lab Queue` });
  }

  function handleCancelLab(id: string) {
    docCancelLab(id);
  }

  function handleDoctorSign(id: string) {
    const now = new Date();
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const record: SignedRecord = {
      date: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      day:  days[now.getDay()],
      time: `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`,
      type: "Consultation Note",
      doctor: "Dr. Emily Wong",
      signed: true,
    };
    setSignedRecordsMap(prev => {
      const next = new Map(prev);
      next.set(id, [...(next.get(id) ?? []), record]);
      return next;
    });
    // Sign also triggers clearDraft() inside SoapNotePage, so drop the
    // session-bridge entry — the signed record itself now drives soapNoteDone.
    pruneSoapNoteSession(id);
  }

  const skipReasonFilled =
    skipReason !== "" &&
    (skipReason !== "Other" || skipOtherText.trim() !== "");

  // ── Face Sheet full-page view ─────────────────────────────────────────────
  if (faceSheetEntry) {
    const liveEntry = queue.find(e => e.id === faceSheetEntry.id) ?? faceSheetEntry;
    return (
      <PatientFaceSheet
        entry={liveEntry}
        soapNoteCreated={soapNoteDone.has(liveEntry.id)}
        onBack={() => setFaceSheetEntry(null)}
        onSoapNoteClick={handleSoapNoteClick}
        onCompleteConsultation={handleFaceSheetComplete}
        onCompleteWithoutSoap={handleCompleteWithoutSoap}
        onSendToLab={handleSendToLab}
        onDiscardLab={handleCancelLab}
        onSaveAndClose={() => setFaceSheetEntry(null)}
        doctorSigned={(signedRecordsMap.get(liveEntry.id)?.length ?? 0) > 0}
        signedRecords={signedRecordsMap.get(liveEntry.id) ?? []}
        onDoctorSign={() => handleDoctorSign(liveEntry.id)}
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
              { label: "At Counter",  value: docQueue.filter(e => e.status === "called").length, style: { color: ACCENT }, bg: "bg-blue-50 border-blue-200"   },
              { label: "Waiting",     value: waitingTokens.length,    style: { color: "#b45309" }, bg: "bg-amber-50 border-amber-200" },
              { label: "Pending Lab", value: pendingLabQueue.length,   style: { color: "#0284c7" }, bg: "bg-sky-50 border-sky-200"     },
              { label: "Skipped",     value: skippedQueue.length,      style: { color: "#dc2626" }, bg: "bg-red-50 border-red-200"     },
            ].map(s => (
              <div key={s.label} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 mb-2 ${s.bg}`}>
                <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                <span className="text-lg font-black" style={s.style}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Assigned Queues</p>
              <div className="rounded-xl border px-4 py-3" style={{ borderColor: `${ACCENT}4D`, backgroundColor: `${ACCENT}0A` }}>
                <div className="flex items-center gap-2 mb-1">
                  <Stethoscope className="h-4 w-4" style={{ color: ACCENT }} />
                  <p className="text-sm font-bold" style={{ color: ACCENT }}>Consultation Queue</p>
                </div>
                <p className="text-xs text-slate-500">Step 3 tokens · No billing</p>
              </div>
            </div>

            {/* Lab Queue live counts */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Lab Queue · Step 4</p>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-bold text-emerald-700">Lab / Sample</p>
                  <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Waiting</span>
                  <span className={`text-base font-black ${labWaiting > 0 ? "text-amber-600" : "text-slate-400"}`}>
                    {labWaiting}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">At Counter</span>
                  <span className={`text-base font-black ${labAtCounter > 0 ? "text-blue-600" : "text-slate-400"}`}>
                    {labAtCounter}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Done Today</span>
                  <span className={`text-base font-black ${labDone > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                    {labDone}
                  </span>
                </div>
                {labWaiting === 0 && labAtCounter === 0 ? (
                  <div className="flex items-center gap-1 pt-1 border-t border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-semibold text-emerald-600">Lab queue clear</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 pt-1 border-t border-emerald-200">
                    <Clock className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-semibold text-amber-600">
                      {labWaiting + labAtCounter} sample{labWaiting + labAtCounter !== 1 ? "s" : ""} in progress
                    </span>
                  </div>
                )}
              </div>
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
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />
                        <span className="text-xs font-semibold" style={{ color: ACCENT }}>In Consultation</span>
                        <span className="text-slate-300">·</span>
                        <Clock className="h-3 w-3 text-slate-300" />
                        <span className="text-xs text-slate-400">{timeAgo(atCounterEntry.createdAt)}</span>
                      </div>
                      {soapNoteDone.has(atCounterEntry.id) && (
                        (signedRecordsMap.get(atCounterEntry.id)?.length ?? 0) > 0 ? (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            <span className="text-[11px] font-semibold text-emerald-600">SOAP Note Signed</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-amber-500" />
                            <span className="text-[11px] font-semibold text-amber-600">SOAP Note In Progress</span>
                          </div>
                        )
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        className="h-10 px-5 text-sm font-bold gap-2 text-white"
                        style={{ backgroundColor: ACCENT }}
                        onClick={() => handleOpenFaceSheet(atCounterEntry)}>
                        <FileText className="h-4 w-4" /> Open Face Sheet
                      </Button>
                      {!soapNoteDone.has(atCounterEntry.id) && (
                        <Button
                          variant="outline" size="sm"
                          className="border-red-200 text-red-500 hover:bg-red-50 text-xs"
                          onClick={() => handleSkipClick(atCounterEntry.id)}>
                          <SkipForward className="h-3 w-3 mr-1" /> Skip
                        </Button>
                      )}
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
                      {!soapNoteDone.has(activeCallEntry.id) && (
                        <Button
                          variant="outline" size="sm"
                          className="border-red-200 text-red-500 hover:bg-red-50 text-xs"
                          onClick={() => handleSkipClick(activeCallEntry.id)}>
                          <SkipForward className="h-3 w-3 mr-1" /> Skip Token
                        </Button>
                      )}
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
                      className={`flex items-center gap-4 rounded-xl border px-4 py-3 bg-white transition-all ${entry.labResultsReady ? "border-emerald-400 bg-emerald-50/40 shadow-sm" : isFirst ? "border-slate-300 shadow-sm" : "border-slate-100 opacity-70"}`}>
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-black ${entry.labResultsReady ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {idx + 1}
                      </div>
                      <div className="font-mono font-black text-sm text-slate-700 flex-shrink-0">{entry.tokenNumber}</div>
                      <div className="flex-1 min-w-0">
                        {entry.patient
                          ? <p className="text-sm font-bold text-slate-800 truncate">{entry.patient.name}<span className="ml-2 text-xs font-normal text-slate-400">{entry.patient.mrn}</span></p>
                          : <p className="text-sm font-bold text-slate-500">Walk-in Patient</p>
                        }
                        {entry.labResultsReady && (
                          <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                            <FlaskConical className="h-3 w-3" /> Lab Results Ready
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(entry.createdAt)}</span>
                      {(isFirst || entry.labResultsReady) ? (
                        isCalled ? (
                          <Button
                            size="sm"
                            className="h-8 px-4 text-xs font-bold flex-shrink-0 gap-1.5 text-white"
                            style={{ backgroundColor: entry.labResultsReady ? "#059669" : ACCENT }}
                            onClick={() => handleConsultation(entry)}>
                            <Stethoscope className="h-3.5 w-3.5" /> {entry.labResultsReady ? "Review" : "Consultation"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="h-8 px-4 text-xs font-bold flex-shrink-0 gap-1.5 text-white"
                            style={{ backgroundColor: entry.labResultsReady ? "#059669" : ACCENT }}
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

          {/* PENDING LAB PANEL */}
          {pendingLabQueue.length > 0 && (
            <>
              <button
                onClick={() => setShowPendingLab(v => !v)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-sky-200 bg-white shadow-lg px-4 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 transition-all z-10"
                style={{ marginBottom: skippedQueue.length > 0 ? "2.5rem" : undefined }}>
                <FlaskConical className="h-3.5 w-3.5" />
                Pending Lab Results ({pendingLabQueue.length})
                <ChevronUp className={`h-3.5 w-3.5 transition-transform ${showPendingLab ? "rotate-180" : ""}`} />
              </button>
              {showPendingLab && (
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-sky-200 rounded-t-3xl shadow-2xl z-20 max-h-72 flex flex-col">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-sky-500" />
                      <p className="text-sm font-bold text-slate-900">Pending Lab Results</p>
                    </div>
                    <button onClick={() => setShowPendingLab(false)} className="h-7 w-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto flex-1 p-4 space-y-2">
                    {pendingLabQueue.map(entry => (
                      <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
                        <div className="font-mono font-black text-sm text-sky-700 flex-shrink-0">{entry.tokenNumber}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {entry.patient?.name ?? "Walk-in Patient"}
                          </p>
                          <p className="text-xs text-sky-600 flex items-center gap-1">
                            <FlaskConical className="h-3 w-3" /> Awaiting lab results
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs border-sky-200 text-sky-700 gap-1.5 hover:border-sky-400 hover:bg-sky-50"
                          onClick={() => { setFaceSheetEntry(entry); setShowPendingLab(false); }}>
                          Open Face Sheet
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

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
      {/* ── Skip-Reason Modal ────────────────────────────────────────────────── */}
      {skipModalId && (() => {
        const skipEntry = queue.find(e => e.id === skipModalId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="text-base font-black text-slate-900">Skip Token — Reason Required</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {skipEntry?.tokenNumber} · {skipEntry?.patient?.name ?? "Walk-in Patient"} · No SOAP note created
                  </p>
                </div>
                <button onClick={() => setSkipModalId(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reason for skipping <span className="text-red-500">*</span>
                </label>
                <select
                  value={skipReason}
                  onChange={e => { setSkipReason(e.target.value); setSkipOtherText(""); }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4982CF] focus:border-transparent">
                  <option value="">Select a reason…</option>
                  <option>Patient came without any complaint</option>
                  <option>Follow-up visit, no new findings</option>
                  <option>Patient refused consultation</option>
                  <option>Other</option>
                </select>
                {skipReason === "Other" && (
                  <textarea
                    value={skipOtherText}
                    onChange={e => setSkipOtherText(e.target.value)}
                    placeholder="Describe the reason…"
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#4982CF] focus:border-transparent"
                  />
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
                <Button variant="outline" className="h-9 px-4 text-sm" onClick={() => setSkipModalId(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={!skipReasonFilled}
                  className="h-9 px-5 text-sm font-bold text-white gap-2 disabled:opacity-40 bg-red-500 hover:bg-red-600"
                  onClick={confirmSkip}>
                  <SkipForward className="h-4 w-4" /> Confirm Skip
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
