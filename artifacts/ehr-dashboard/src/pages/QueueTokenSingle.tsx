import { useState, useEffect } from "react";
import { Zap, CheckCircle2, Clock, Users, RefreshCw, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  QueueAppHeader, QueueEntry, QueueStatus, SEED_BRANCHES,
  padToken, timeAgo, uid,
} from "@/pages/QueuePageLayout";

// ─── Seed queue ───────────────────────────────────────────────────────────────

const now = new Date();
const SEED_QUEUE: QueueEntry[] = [
  { id: "e-0", tokenNumber: "U005", displayNum: 5, status: "completed", step: 1, totalSteps: 1, createdAt: new Date(now.getTime() - 18 * 60000) },
  { id: "e-1", tokenNumber: "U006", displayNum: 6, status: "completed", step: 1, totalSteps: 1, createdAt: new Date(now.getTime() - 12 * 60000) },
  { id: "e-2", tokenNumber: "U007", displayNum: 7, status: "serving",   step: 1, totalSteps: 1, createdAt: new Date(now.getTime() - 4 * 60000) },
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

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 10000);
    return () => clearInterval(t);
  }, []);

  const serving   = queue.filter(e => e.status === "serving");
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
    setTimeout(() => {
      const entry: QueueEntry = {
        id: uid(), tokenNumber: nextToken, displayNum: nextNum,
        status: "waiting", step: 1, totalSteps: 1, createdAt: new Date(),
      };
      setQueue(p => [...p, entry]);
      setNextNum(p => p + 1);
      setLoading(false);
      showToast(`Token ${nextToken} generated successfully`);
    }, 600);
  }

  function callNext() {
    setQueue(prev => {
      const updated = [...prev];
      const servingIdx = updated.findIndex(e => e.status === "serving");
      if (servingIdx >= 0) updated[servingIdx] = { ...updated[servingIdx], status: "completed" };
      const waitingIdx = updated.findIndex(e => e.status === "waiting");
      if (waitingIdx >= 0) updated[waitingIdx] = { ...updated[waitingIdx], status: "serving" };
      return updated;
    });
  }

  const statusDot = (s: QueueStatus) =>
    s === "serving"   ? "bg-emerald-500 animate-pulse" :
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

          {/* MIDDLE — Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            {/* Stats mini row */}
            <div className="flex w-full gap-3">
              {[
                { label: "Waiting",   value: waiting.length,   color: "text-amber-700",   bg: "bg-amber-50   border-amber-200"   },
                { label: "Serving",   value: serving.length,   color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
                { label: "Done",      value: completed.length, color: "text-slate-600",   bg: "bg-slate-50   border-slate-200"   },
              ].map(s => (
                <div key={s.label} className={`flex-1 rounded-xl border px-3 py-2.5 text-center ${s.bg}`}>
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-slate-400 leading-relaxed">
              One queue for all — no selections required.<br />
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

            {serving.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-10 py-5 text-center shadow-sm">
                  <p className="font-black tracking-widest font-mono text-5xl text-emerald-700">{serving[0].tokenNumber}</p>
                </div>
                <div className="space-y-1">
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Being Served</Badge>
                  <p className="text-sm font-semibold text-slate-700">Single Queue — All Visitors</p>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />Waiting {timeAgo(serving[0].createdAt)}
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => {}}>
                    <Printer className="h-3.5 w-3.5" />Print
                  </Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs" onClick={callNext}>
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
                      <span className="flex-1 text-sm text-slate-500">Walk-in Patient</span>
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
    </div>
  );
}
