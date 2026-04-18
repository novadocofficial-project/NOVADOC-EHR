import { useState, useMemo, useEffect } from "react";
import {
  Plus, Edit2, Trash2, Check, X, AlertCircle, GripVertical,
  ChevronUp, ChevronDown, Info, Eye, Monitor, Volume2, VolumeX, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QueueSection =
  | "visit-types" | "workflow-config" | "counter-types" | "counters"
  | "token-settings" | "queue-behavior" | "locking-settings"
  | "display-settings" | "doctor-partitions";

type VisitType = {
  id: string; name: string; code: string; tokenPrefix: string;
  color: string; queueMode: "single" | "partitioned"; partitionBy: "none" | "doctor";
  status: "active" | "inactive";
};

type WorkflowStep = {
  id: string; visitTypeId: string; stepName: string; stepOrder: number;
  counterTypeId: string; isMandatory: boolean; allowSkip: boolean; avgServiceMinutes: number;
};

type CounterType = { id: string; name: string; description: string; maxParallel: number };

type Counter = {
  id: string; name: string; counterTypeId: string; branchId: string;
  allowMultiUser: boolean; status: "active" | "inactive";
};

type DoctorPartition = { doctorId: string; doctorName: string; specialty: string; counterId: string; };

type TokenSettings = {
  prefix: string; startingNumber: number; resetFrequency: "daily" | "manual";
  displayFormat: "padded" | "plain"; allowManualEntry: boolean;
};

type QueueBehavior = {
  autoMoveNext: boolean; requireManualCompletion: boolean; allowSkip: boolean;
  allowRecall: boolean; maxRecallAttempts: number; tokenExpiryMinutes: number;
};

type LockingSettings = { lockTimeoutSeconds: number; autoReleaseLock: boolean; allowForceTakeover: boolean; };

type ScreenTheme = "dark" | "light" | "branded";
type ScreenType  = "main-lobby" | "counter" | "doctor";

type ScreenConfig = {
  id: string;
  name: string;
  screenType: ScreenType;
  associatedCounterId: string;
  theme: ScreenTheme;
  showCurrentToken: boolean;
  showCounterName: boolean;
  showLastNTokens: number;
  showQueueCount: boolean;
  tokenDisplayFormat: "token-counter" | "token-only";
  soundAlert: boolean;
  showClock: boolean;
  tickerText: string;
  active: boolean;
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_VISIT_TYPES: VisitType[] = [
  { id: "vt-1", name: "Normal Consultation", code: "NORM", tokenPrefix: "C", color: "#4982CF", queueMode: "partitioned", partitionBy: "doctor", status: "active" },
  { id: "vt-2", name: "Urgent / Emergency", code: "EMER", tokenPrefix: "U", color: "#ef4444", queueMode: "single", partitionBy: "none", status: "active" },
  { id: "vt-3", name: "Follow-up Visit", code: "FLUP", tokenPrefix: "F", color: "#10b981", queueMode: "single", partitionBy: "none", status: "inactive" },
];

const SEED_COUNTER_TYPES: CounterType[] = [
  { id: "ct-1", name: "Registration Counter", description: "Initial patient registration and token issuance.", maxParallel: 5 },
  { id: "ct-2", name: "Doctor Room", description: "Doctor consultation room. Partitioned per doctor.", maxParallel: 10 },
  { id: "ct-3", name: "Lab Counter", description: "Sample collection and lab test processing.", maxParallel: 4 },
  { id: "ct-4", name: "Pharmacy Counter", description: "Medicine dispensing and billing.", maxParallel: 3 },
];

const SEED_COUNTERS: Counter[] = [
  { id: "ctr-1", name: "Registration Desk 1", counterTypeId: "ct-1", branchId: "br-1", allowMultiUser: false, status: "active" },
  { id: "ctr-2", name: "Registration Desk 2", counterTypeId: "ct-1", branchId: "br-1", allowMultiUser: false, status: "active" },
  { id: "ctr-3", name: "Dr. Room A", counterTypeId: "ct-2", branchId: "br-1", allowMultiUser: false, status: "active" },
  { id: "ctr-4", name: "Dr. Room B", counterTypeId: "ct-2", branchId: "br-1", allowMultiUser: false, status: "active" },
  { id: "ctr-5", name: "Lab Desk 1", counterTypeId: "ct-3", branchId: "br-1", allowMultiUser: true, status: "active" },
  { id: "ctr-6", name: "Pharmacy Desk", counterTypeId: "ct-4", branchId: "br-2", allowMultiUser: false, status: "active" },
];

const SEED_WORKFLOW: WorkflowStep[] = [
  { id: "ws-1", visitTypeId: "vt-1", stepName: "Patient Registration", stepOrder: 1, counterTypeId: "ct-1", isMandatory: true, allowSkip: false, avgServiceMinutes: 5 },
  { id: "ws-2", visitTypeId: "vt-1", stepName: "Doctor Consultation", stepOrder: 2, counterTypeId: "ct-2", isMandatory: true, allowSkip: false, avgServiceMinutes: 20 },
  { id: "ws-3", visitTypeId: "vt-1", stepName: "Lab / Sample Collection", stepOrder: 3, counterTypeId: "ct-3", isMandatory: false, allowSkip: true, avgServiceMinutes: 10 },
  { id: "ws-4", visitTypeId: "vt-1", stepName: "Pharmacy / Dispensing", stepOrder: 4, counterTypeId: "ct-4", isMandatory: false, allowSkip: true, avgServiceMinutes: 8 },
  { id: "ws-5", visitTypeId: "vt-2", stepName: "Triage & Registration", stepOrder: 1, counterTypeId: "ct-1", isMandatory: true, allowSkip: false, avgServiceMinutes: 3 },
  { id: "ws-6", visitTypeId: "vt-2", stepName: "Emergency Consultation", stepOrder: 2, counterTypeId: "ct-2", isMandatory: true, allowSkip: false, avgServiceMinutes: 30 },
];

const SEED_DOCTOR_PARTITIONS: DoctorPartition[] = [
  { doctorId: "doc-1", doctorName: "Dr. Emily Wong",   specialty: "Cardiology",   counterId: "ctr-3" },
  { doctorId: "doc-2", doctorName: "Dr. James Wilson", specialty: "Orthopedics",  counterId: "ctr-4" },
  { doctorId: "doc-3", doctorName: "Dr. Sarah Connor", specialty: "Pediatrics",   counterId: "ctr-3" },
];

const SEED_TOKEN_SETTINGS: TokenSettings = {
  prefix: "C", startingNumber: 1, resetFrequency: "daily",
  displayFormat: "padded", allowManualEntry: false,
};

const SEED_QUEUE_BEHAVIOR: QueueBehavior = {
  autoMoveNext: true, requireManualCompletion: false, allowSkip: true,
  allowRecall: true, maxRecallAttempts: 3, tokenExpiryMinutes: 120,
};

const SEED_LOCKING: LockingSettings = { lockTimeoutSeconds: 30, autoReleaseLock: true, allowForceTakeover: false };

const SEED_SCREENS: ScreenConfig[] = [
  {
    id: "scr-1", name: "Main Lobby Display",
    screenType: "main-lobby", associatedCounterId: "",
    theme: "dark", showCurrentToken: true, showCounterName: true,
    showLastNTokens: 5, showQueueCount: true,
    tokenDisplayFormat: "token-counter", soundAlert: true,
    showClock: true, tickerText: "Welcome to NovaDoc. Please wait for your token to be called.",
    active: true,
  },
  {
    id: "scr-2", name: "Dr. Room A Screen",
    screenType: "doctor", associatedCounterId: "ctr-3",
    theme: "dark", showCurrentToken: true, showCounterName: true,
    showLastNTokens: 3, showQueueCount: false,
    tokenDisplayFormat: "token-only", soundAlert: true,
    showClock: false, tickerText: "",
    active: true,
  },
  {
    id: "scr-3", name: "Registration Desk Screen",
    screenType: "counter", associatedCounterId: "ctr-1",
    theme: "light", showCurrentToken: true, showCounterName: false,
    showLastNTokens: 3, showQueueCount: true,
    tokenDisplayFormat: "token-counter", soundAlert: false,
    showClock: true, tickerText: "",
    active: true,
  },
];

const BRANCHES = [
  { id: "br-1", name: "Main Branch — Lahore" },
  { id: "br-2", name: "North Branch — Islamabad" },
];

const VISIT_TYPE_COLORS = ["#4982CF","#ef4444","#10b981","#f59e0b","#8b5cf6","#06b6d4","#f97316","#ec4899"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PageHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <SettingRow label={label} desc={desc}>
      <div className="flex items-center gap-2">
        <Switch checked={value} onCheckedChange={onChange} className="data-[state=checked]:bg-[#4982CF]" />
        <span className={`text-xs font-medium w-12 ${value ? "text-[#4982CF]" : "text-slate-400"}`}>{value ? "On" : "Off"}</span>
      </div>
    </SettingRow>
  );
}

function QueueBehaviorPanel({ queueBehavior, setQueueBehavior }: {
  queueBehavior: QueueBehavior;
  setQueueBehavior: (updater: (prev: QueueBehavior) => QueueBehavior) => void;
}) {
  const [billingOnReg, setBillingOnReg] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("ehr-billing-reg") ?? "true"); }
    catch { return true; }
  });

  function toggleBilling(v: boolean) {
    setBillingOnReg(v);
    localStorage.setItem("ehr-billing-reg", JSON.stringify(v));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Queue Behavior Settings" desc="Control how patients move through the queue workflow." />
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 px-5">
        <ToggleRow label="Auto Move to Next Step" desc="Automatically advance token to the next step upon completion." value={queueBehavior.autoMoveNext} onChange={v => setQueueBehavior(p => ({ ...p, autoMoveNext: v }))} />
        <ToggleRow label="Require Manual Completion" desc="Staff must explicitly mark each step as complete." value={queueBehavior.requireManualCompletion} onChange={v => setQueueBehavior(p => ({ ...p, requireManualCompletion: v }))} />
        <ToggleRow label="Allow Step Skip" desc="Staff can skip optional workflow steps for a token." value={queueBehavior.allowSkip} onChange={v => setQueueBehavior(p => ({ ...p, allowSkip: v }))} />
        <ToggleRow label="Allow Recall" desc="Already-called tokens can be recalled to a counter." value={queueBehavior.allowRecall} onChange={v => setQueueBehavior(p => ({ ...p, allowRecall: v }))} />
        <SettingRow label="Max Recall Attempts" desc="Maximum number of times a token can be recalled.">
          <Input type="number" min="1" max="10" value={queueBehavior.maxRecallAttempts} onChange={e => setQueueBehavior(p => ({ ...p, maxRecallAttempts: parseInt(e.target.value) || 1 }))} className="h-9 w-20 text-sm text-center" disabled={!queueBehavior.allowRecall} />
        </SettingRow>
        <SettingRow label="Token Expiry (minutes)" desc="Tokens expire and are marked no-show after this duration.">
          <Input type="number" min="0" value={queueBehavior.tokenExpiryMinutes} onChange={e => setQueueBehavior(p => ({ ...p, tokenExpiryMinutes: parseInt(e.target.value) || 0 }))} className="h-9 w-24 text-sm text-center" />
        </SettingRow>
      </div>

      {/* Billing Settings */}
      <div>
        <div className="mb-3">
          <p className="text-sm font-bold text-slate-900">Billing Settings</p>
          <p className="text-xs text-slate-400 mt-0.5">Enable billing requirements per queue counter. When enabled, payment must be completed before a token advances to the next step.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-5">
          {[
            { label: "Registration Counter", key: "reg", enabled: billingOnReg, toggle: toggleBilling,
              desc: "Patient must complete billing at registration before proceeding to next step." },
          ].map(row => (
            <div key={row.key} className="flex items-center justify-between py-4 gap-4 border-b border-slate-100 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-slate-800">{row.label}</p>
                  {row.enabled && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#4982CF]/10 text-[#4982CF] uppercase tracking-wide">Billing On</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{row.desc}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch checked={row.enabled} onCheckedChange={row.toggle} className="data-[state=checked]:bg-[#4982CF]" />
                <span className={`text-xs font-medium w-8 ${row.enabled ? "text-[#4982CF]" : "text-slate-400"}`}>{row.enabled ? "On" : "Off"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeleteDialog({ open, name, onClose, onConfirm }: { open: boolean; name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2 text-rose-600"><AlertCircle className="h-5 w-5" />Delete</DialogTitle></DialogHeader>
        <p className="text-sm text-slate-600 mt-1">Delete <strong>{name}</strong>? This cannot be undone.</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="h-8 text-sm">Cancel</Button>
          <Button onClick={onConfirm} className="bg-rose-500 hover:bg-rose-600 text-white h-8 text-sm gap-2"><Trash2 className="h-3.5 w-3.5" />Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QueueModule({ section }: { section: QueueSection }) {
  // Shared state ─────────────────────────────────────────────────────────────
  const [visitTypes, setVisitTypes] = useState<VisitType[]>(SEED_VISIT_TYPES);
  const [counterTypes, setCounterTypes] = useState<CounterType[]>(SEED_COUNTER_TYPES);
  const [counters, setCounters] = useState<Counter[]>(SEED_COUNTERS);
  const [workflow, setWorkflow] = useState<WorkflowStep[]>(SEED_WORKFLOW);
  const [doctorPartitions, setDoctorPartitions] = useState<DoctorPartition[]>(SEED_DOCTOR_PARTITIONS);
  const [tokenSettings, setTokenSettings] = useState<TokenSettings>(SEED_TOKEN_SETTINGS);
  const [queueBehavior, setQueueBehavior] = useState<QueueBehavior>(SEED_QUEUE_BEHAVIOR);
  const [lockingSettings, setLockingSettings] = useState<LockingSettings>(SEED_LOCKING);
  const [screens, setScreens] = useState<ScreenConfig[]>(SEED_SCREENS);
  const [selectedScreenId, setSelectedScreenId] = useState<string>(SEED_SCREENS[0].id);
  const [previewScreenId, setPreviewScreenId] = useState<string | null>(null);
  const [clockTime, setClockTime] = useState(new Date());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: string } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Section: Visit Types ────────────────────────────────────────────────────
  const [vtForm, setVtForm] = useState<Omit<VisitType, "id">>({ name: "", code: "", tokenPrefix: "", color: "#4982CF", queueMode: "single", partitionBy: "none", status: "active" });
  const [vtEditId, setVtEditId] = useState<string | null>(null);
  const [showVtForm, setShowVtForm] = useState(false);

  function openVtAdd() { setVtForm({ name: "", code: "", tokenPrefix: "", color: "#4982CF", queueMode: "single", partitionBy: "none", status: "active" }); setVtEditId(null); setShowVtForm(true); }
  function openVtEdit(vt: VisitType) { setVtForm({ name: vt.name, code: vt.code, tokenPrefix: vt.tokenPrefix, color: vt.color, queueMode: vt.queueMode, partitionBy: vt.partitionBy, status: vt.status }); setVtEditId(vt.id); setShowVtForm(true); }
  function saveVt() {
    if (!vtForm.name.trim() || !vtForm.tokenPrefix.trim()) return;
    if (vtEditId) setVisitTypes(p => p.map(v => v.id === vtEditId ? { ...v, ...vtForm } : v));
    else setVisitTypes(p => [...p, { ...vtForm, id: `vt-${Date.now()}` }]);
    setShowVtForm(false);
  }

  // ── Section: Workflow ────────────────────────────────────────────────────────
  const [selectedVtId, setSelectedVtId] = useState<string>("vt-1");
  const [wsForm, setWsForm] = useState<Omit<WorkflowStep, "id" | "visitTypeId">>({ stepName: "", stepOrder: 1, counterTypeId: "", isMandatory: true, allowSkip: false, avgServiceMinutes: 10 });
  const [wsEditId, setWsEditId] = useState<string | null>(null);
  const [showWsForm, setShowWsForm] = useState(false);
  const vtSteps = useMemo(() => workflow.filter(ws => ws.visitTypeId === selectedVtId).sort((a, b) => a.stepOrder - b.stepOrder), [workflow, selectedVtId]);

  function openWsAdd() {
    const maxOrder = Math.max(0, ...vtSteps.map(s => s.stepOrder));
    setWsForm({ stepName: "", stepOrder: maxOrder + 1, counterTypeId: counterTypes[0]?.id ?? "", isMandatory: true, allowSkip: false, avgServiceMinutes: 10 });
    setWsEditId(null); setShowWsForm(true);
  }
  function openWsEdit(ws: WorkflowStep) { setWsForm({ stepName: ws.stepName, stepOrder: ws.stepOrder, counterTypeId: ws.counterTypeId, isMandatory: ws.isMandatory, allowSkip: ws.allowSkip, avgServiceMinutes: ws.avgServiceMinutes }); setWsEditId(ws.id); setShowWsForm(true); }
  function saveWs() {
    if (!wsForm.stepName.trim() || !wsForm.counterTypeId) return;
    if (wsEditId) setWorkflow(p => p.map(w => w.id === wsEditId ? { ...w, ...wsForm } : w));
    else setWorkflow(p => [...p, { ...wsForm, id: `ws-${Date.now()}`, visitTypeId: selectedVtId }]);
    setShowWsForm(false);
  }
  function moveStep(id: string, dir: -1 | 1) {
    setWorkflow(prev => {
      const steps = prev.filter(w => w.visitTypeId === selectedVtId).sort((a, b) => a.stepOrder - b.stepOrder);
      const idx = steps.findIndex(s => s.id === id);
      const swap = steps[idx + dir];
      if (!swap) return prev;
      return prev.map(w => w.id === id ? { ...w, stepOrder: swap.stepOrder } : w.id === swap.id ? { ...w, stepOrder: steps[idx].stepOrder } : w);
    });
  }

  // ── Section: Counter Types ───────────────────────────────────────────────────
  const [ctForm, setCtForm] = useState<Omit<CounterType, "id">>({ name: "", description: "", maxParallel: 1 });
  const [ctEditId, setCtEditId] = useState<string | null>(null);
  const [showCtForm, setShowCtForm] = useState(false);
  function openCtAdd() { setCtForm({ name: "", description: "", maxParallel: 1 }); setCtEditId(null); setShowCtForm(true); }
  function openCtEdit(ct: CounterType) { setCtForm({ name: ct.name, description: ct.description, maxParallel: ct.maxParallel }); setCtEditId(ct.id); setShowCtForm(true); }
  function saveCt() {
    if (!ctForm.name.trim()) return;
    if (ctEditId) setCounterTypes(p => p.map(c => c.id === ctEditId ? { ...c, ...ctForm } : c));
    else setCounterTypes(p => [...p, { ...ctForm, id: `ct-${Date.now()}` }]);
    setShowCtForm(false);
  }

  // ── Section: Counters ────────────────────────────────────────────────────────
  const [ctrForm, setCtrForm] = useState<Omit<Counter, "id">>({ name: "", counterTypeId: "", branchId: "", allowMultiUser: false, status: "active" });
  const [ctrEditId, setCtrEditId] = useState<string | null>(null);
  const [showCtrForm, setShowCtrForm] = useState(false);
  function openCtrAdd() { setCtrForm({ name: "", counterTypeId: counterTypes[0]?.id ?? "", branchId: BRANCHES[0]?.id ?? "", allowMultiUser: false, status: "active" }); setCtrEditId(null); setShowCtrForm(true); }
  function openCtrEdit(c: Counter) { setCtrForm({ name: c.name, counterTypeId: c.counterTypeId, branchId: c.branchId, allowMultiUser: c.allowMultiUser, status: c.status }); setCtrEditId(c.id); setShowCtrForm(true); }
  function saveCtr() {
    if (!ctrForm.name.trim()) return;
    if (ctrEditId) setCounters(p => p.map(c => c.id === ctrEditId ? { ...c, ...ctrForm } : c));
    else setCounters(p => [...p, { ...ctrForm, id: `ctr-${Date.now()}` }]);
    setShowCtrForm(false);
  }

  // ── Delete handler ──────────────────────────────────────────────────────────
  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "vt") setVisitTypes(p => p.filter(v => v.id !== deleteTarget.id));
    if (deleteTarget.type === "ws") setWorkflow(p => p.filter(w => w.id !== deleteTarget.id));
    if (deleteTarget.type === "ct") setCounterTypes(p => p.filter(c => c.id !== deleteTarget.id));
    if (deleteTarget.type === "ctr") setCounters(p => p.filter(c => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const getCounterTypeName = (id: string) => counterTypes.find(ct => ct.id === id)?.name ?? "—";
  const getBranchName = (id: string) => BRANCHES.find(b => b.id === id)?.name ?? "—";

  // ── Renders ─────────────────────────────────────────────────────────────────

  if (section === "visit-types") return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Visit Type Management" desc="Define visit types, token prefixes, and queue partitioning rules." />
        <Button onClick={openVtAdd} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2"><Plus className="h-4 w-4" />Add Visit Type</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visitTypes.map(vt => (
          <div key={vt.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: vt.color }}>{vt.tokenPrefix}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{vt.name}</p>
                  <p className="text-[10px] font-mono text-slate-400">{vt.code}</p>
                </div>
              </div>
              <Badge variant="outline" className={`text-[10px] ${vt.status === "active" ? "border-emerald-300 text-emerald-600 bg-emerald-50" : "border-slate-200 text-slate-400"}`}>
                {vt.status}
              </Badge>
            </div>
            <div className="space-y-1 text-xs text-slate-500">
              <p>Queue: <span className="font-medium text-slate-700">{vt.queueMode === "single" ? "Single Queue" : "Partitioned Queue"}</span></p>
              {vt.partitionBy !== "none" && <p>Partition by: <span className="font-medium text-slate-700 capitalize">{vt.partitionBy}</span></p>}
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <Switch checked={vt.status === "active"} onCheckedChange={v => setVisitTypes(p => p.map(x => x.id === vt.id ? { ...x, status: v ? "active" : "inactive" } : x))} className="data-[state=checked]:bg-emerald-500 scale-75" />
              <div className="flex-1" />
              <button onClick={() => openVtEdit(vt)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => setDeleteTarget({ id: vt.id, name: vt.name, type: "vt" })} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showVtForm} onOpenChange={v => !v && setShowVtForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{vtEditId ? "Edit Visit Type" : "Add Visit Type"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Visit Type Name *</Label>
                <Input value={vtForm.name} onChange={e => setVtForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Normal Consultation" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Code *</Label>
                <Input value={vtForm.code} onChange={e => setVtForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="NORM" className="h-9 text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Token Prefix *</Label>
                <Input value={vtForm.tokenPrefix} onChange={e => setVtForm(p => ({ ...p, tokenPrefix: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="C" className="h-9 text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Color</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {VISIT_TYPE_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setVtForm(p => ({ ...p, color: c }))}
                      className={`h-6 w-6 rounded-full border-2 transition-all ${vtForm.color === c ? "border-slate-700 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Queue Mode</Label>
                <Select value={vtForm.queueMode} onValueChange={(v: "single" | "partitioned") => setVtForm(p => ({ ...p, queueMode: v, partitionBy: v === "single" ? "none" : p.partitionBy }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Queue</SelectItem>
                    <SelectItem value="partitioned">Partitioned Queue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {vtForm.queueMode === "partitioned" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Partition By</Label>
                  <Select value={vtForm.partitionBy} onValueChange={(v: "none" | "doctor") => setVtForm(p => ({ ...p, partitionBy: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="col-span-2 flex items-center gap-2">
                <Switch checked={vtForm.status === "active"} onCheckedChange={v => setVtForm(p => ({ ...p, status: v ? "active" : "inactive" }))} className="data-[state=checked]:bg-emerald-500" />
                <span className="text-sm text-slate-600">Active</span>
              </div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowVtForm(false)} className="h-9 text-sm">Cancel</Button><Button onClick={saveVt} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white h-9 text-sm gap-2"><Check className="h-4 w-4" />Save</Button></div>
          </div>
        </DialogContent>
      </Dialog>
      <DeleteDialog open={!!deleteTarget && deleteTarget.type === "vt"} name={deleteTarget?.name ?? ""} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  );

  if (section === "workflow-config") return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Workflow Configuration" desc="Define the ordered steps a patient follows for each visit type." />
      <div className="flex items-center gap-3">
        <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Visit Type:</Label>
        <Select value={selectedVtId} onValueChange={setSelectedVtId}>
          <SelectTrigger className="h-9 text-sm max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{visitTypes.map(vt => <SelectItem key={vt.id} value={vt.id}>{vt.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex-1" />
        <Button onClick={openWsAdd} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 h-9 text-sm"><Plus className="h-4 w-4" />Add Step</Button>
      </div>
      {vtSteps.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-slate-400">
          <p className="text-sm font-medium text-slate-500">No steps configured for this visit type.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vtSteps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm group">
              <GripVertical className="h-4 w-4 text-slate-300" />
              <div className="h-7 w-7 rounded-full bg-[#4982CF]/10 text-[#4982CF] flex items-center justify-center text-xs font-bold">{step.stepOrder}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{step.stepName}</p>
                <p className="text-xs text-slate-400">{getCounterTypeName(step.counterTypeId)} · {step.avgServiceMinutes} min avg</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {step.isMandatory && <Badge variant="outline" className="border-[#4982CF]/30 text-[#4982CF] text-[10px]">Mandatory</Badge>}
                {step.allowSkip && <Badge variant="outline" className="border-amber-300 text-amber-600 text-[10px]">Skippable</Badge>}
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => moveStep(step.id, -1)} disabled={idx === 0} className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => moveStep(step.id, 1)} disabled={idx === vtSteps.length - 1} className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                <button onClick={() => openWsEdit(step)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleteTarget({ id: step.id, name: step.stepName, type: "ws" })} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={showWsForm} onOpenChange={v => !v && setShowWsForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{wsEditId ? "Edit Step" : "Add Workflow Step"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Step Name *</Label>
                <Input value={wsForm.stepName} onChange={e => setWsForm(p => ({ ...p, stepName: e.target.value }))} placeholder="e.g. Doctor Consultation" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Step Order</Label>
                <Input type="number" min="1" value={wsForm.stepOrder} onChange={e => setWsForm(p => ({ ...p, stepOrder: parseInt(e.target.value) || 1 }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Counter Type *</Label>
                <Select value={wsForm.counterTypeId} onValueChange={v => setWsForm(p => ({ ...p, counterTypeId: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{counterTypes.map(ct => <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Avg Service Time (min)</Label>
                <Input type="number" min="1" value={wsForm.avgServiceMinutes} onChange={e => setWsForm(p => ({ ...p, avgServiceMinutes: parseInt(e.target.value) || 1 }))} className="h-9 text-sm" />
              </div>
              <div className="col-span-2 flex gap-6">
                <div className="flex items-center gap-2"><Switch checked={wsForm.isMandatory} onCheckedChange={v => setWsForm(p => ({ ...p, isMandatory: v }))} className="data-[state=checked]:bg-[#4982CF]" /><span className="text-sm text-slate-600">Mandatory</span></div>
                <div className="flex items-center gap-2"><Switch checked={wsForm.allowSkip} onCheckedChange={v => setWsForm(p => ({ ...p, allowSkip: v }))} className="data-[state=checked]:bg-amber-500" /><span className="text-sm text-slate-600">Allow Skip</span></div>
              </div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowWsForm(false)} className="h-9 text-sm">Cancel</Button><Button onClick={saveWs} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white h-9 text-sm gap-2"><Check className="h-4 w-4" />Save</Button></div>
          </div>
        </DialogContent>
      </Dialog>
      <DeleteDialog open={!!deleteTarget && deleteTarget.type === "ws"} name={deleteTarget?.name ?? ""} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  );

  if (section === "counter-types") return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Counter Types" desc="Define logical counter categories used in workflow steps and station configuration." />
        <Button onClick={openCtAdd} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2"><Plus className="h-4 w-4" />Add Counter Type</Button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="grid border-b border-slate-100 bg-slate-50/80 px-5 py-2.5" style={{ gridTemplateColumns: "1fr 2fr 100px 80px" }}>
          {["Name", "Description", "Max Parallel", ""].map(h => <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>)}
        </div>
        {counterTypes.map(ct => (
          <div key={ct.id} className="grid items-center px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 group" style={{ gridTemplateColumns: "1fr 2fr 100px 80px" }}>
            <span className="text-sm font-semibold text-slate-800">{ct.name}</span>
            <span className="text-xs text-slate-500">{ct.description || "—"}</span>
            <span className="text-sm font-semibold text-slate-700">{ct.maxParallel}</span>
            <div className="flex gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openCtEdit(ct)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => setDeleteTarget({ id: ct.id, name: ct.name, type: "ct" })} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={showCtForm} onOpenChange={v => !v && setShowCtForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{ctEditId ? "Edit Counter Type" : "Add Counter Type"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Name *</Label><Input value={ctForm.name} onChange={e => setCtForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Doctor Room" className="h-9 text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Description</Label><Textarea value={ctForm.description} onChange={e => setCtForm(p => ({ ...p, description: e.target.value }))} className="text-sm resize-none" rows={2} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Max Parallel Counters</Label><Input type="number" min="1" value={ctForm.maxParallel} onChange={e => setCtForm(p => ({ ...p, maxParallel: parseInt(e.target.value) || 1 }))} className="h-9 text-sm" /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowCtForm(false)} className="h-9 text-sm">Cancel</Button><Button onClick={saveCt} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white h-9 text-sm gap-2"><Check className="h-4 w-4" />Save</Button></div>
          </div>
        </DialogContent>
      </Dialog>
      <DeleteDialog open={!!deleteTarget && deleteTarget.type === "ct"} name={deleteTarget?.name ?? ""} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  );

  if (section === "counters") return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Counters (Stations)" desc="Physical or virtual service stations where patients are attended." />
        <Button onClick={openCtrAdd} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2"><Plus className="h-4 w-4" />Add Counter</Button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="grid border-b border-slate-100 bg-slate-50/80 px-5 py-2.5" style={{ gridTemplateColumns: "1fr 160px 200px 110px 100px 80px" }}>
          {["Counter Name", "Type", "Branch", "Multi-User", "Status", ""].map(h => <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>)}
        </div>
        {counters.map(c => (
          <div key={c.id} className="grid items-center px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 group" style={{ gridTemplateColumns: "1fr 160px 200px 110px 100px 80px" }}>
            <span className="text-sm font-semibold text-slate-800">{c.name}</span>
            <span className="text-xs text-slate-600">{getCounterTypeName(c.counterTypeId)}</span>
            <span className="text-xs text-slate-500 truncate">{getBranchName(c.branchId)}</span>
            <span className={`text-xs font-medium ${c.allowMultiUser ? "text-purple-600" : "text-slate-400"}`}>{c.allowMultiUser ? "Yes" : "No"}</span>
            <div className="flex items-center gap-1.5">
              <Switch checked={c.status === "active"} onCheckedChange={v => setCounters(p => p.map(x => x.id === c.id ? { ...x, status: v ? "active" : "inactive" } : x))} className="data-[state=checked]:bg-emerald-500 scale-75" />
              <span className={`text-xs font-medium ${c.status === "active" ? "text-emerald-600" : "text-slate-400"}`}>{c.status === "active" ? "Active" : "Inactive"}</span>
            </div>
            <div className="flex gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openCtrEdit(c)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => setDeleteTarget({ id: c.id, name: c.name, type: "ctr" })} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={showCtrForm} onOpenChange={v => !v && setShowCtrForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{ctrEditId ? "Edit Counter" : "Add Counter"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Counter Name *</Label><Input value={ctrForm.name} onChange={e => setCtrForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Dr. Room A" className="h-9 text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Counter Type *</Label><Select value={ctrForm.counterTypeId} onValueChange={v => setCtrForm(p => ({ ...p, counterTypeId: v }))}><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent>{counterTypes.map(ct => <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Branch *</Label><Select value={ctrForm.branchId} onValueChange={v => setCtrForm(p => ({ ...p, branchId: v }))}><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent>{BRANCHES.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={ctrForm.allowMultiUser} onCheckedChange={v => setCtrForm(p => ({ ...p, allowMultiUser: v }))} className="data-[state=checked]:bg-purple-500" /><span className="text-sm text-slate-600">Allow Multi-User</span></div>
              <div className="flex items-center gap-2"><Switch checked={ctrForm.status === "active"} onCheckedChange={v => setCtrForm(p => ({ ...p, status: v ? "active" : "inactive" }))} className="data-[state=checked]:bg-emerald-500" /><span className="text-sm text-slate-600">Active</span></div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowCtrForm(false)} className="h-9 text-sm">Cancel</Button><Button onClick={saveCtr} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white h-9 text-sm gap-2"><Check className="h-4 w-4" />Save</Button></div>
          </div>
        </DialogContent>
      </Dialog>
      <DeleteDialog open={!!deleteTarget && deleteTarget.type === "ctr"} name={deleteTarget?.name ?? ""} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  );

  if (section === "token-settings") {
    const previewNum = tokenSettings.displayFormat === "padded"
      ? String(tokenSettings.startingNumber).padStart(3, "0")
      : String(tokenSettings.startingNumber);
    const previewToken = `${tokenSettings.prefix}${previewNum}`;

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader title="Token Settings" desc="Configure how tokens are generated, formatted, and reset." />

        {/* Live preview card */}
        <div className="rounded-xl border border-[#4982CF]/20 bg-gradient-to-br from-[#4982CF]/5 to-[#4982CF]/10 p-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#4982CF] mb-1">Live Preview</p>
            <p className="text-xs text-slate-500">How tokens will appear at the counter display</p>
          </div>
          <div className="text-right">
            <div className="inline-block bg-white border-2 border-[#4982CF]/30 rounded-2xl px-8 py-4 shadow-sm">
              <p className="text-4xl font-black font-mono tracking-widest text-[#4982CF]">{previewToken}</p>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Next: {tokenSettings.prefix}{tokenSettings.displayFormat === "padded" ? String(tokenSettings.startingNumber + 1).padStart(3, "0") : tokenSettings.startingNumber + 1}</p>
          </div>
        </div>

        {/* Settings form */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 gap-0 divide-x divide-slate-100">
            {/* Left column */}
            <div className="p-5 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Token Prefix</Label>
                <p className="text-[11px] text-slate-400">Letter(s) prepended to every token number (max 2).</p>
                <Input
                  value={tokenSettings.prefix}
                  onChange={e => setTokenSettings(p => ({ ...p, prefix: e.target.value.toUpperCase().slice(0, 2) }))}
                  className="h-10 w-24 text-center font-mono font-black text-xl tracking-widest"
                  maxLength={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Starting Number</Label>
                <p className="text-[11px] text-slate-400">First number issued when tokens reset.</p>
                <Input
                  type="number"
                  min="1"
                  value={tokenSettings.startingNumber}
                  onChange={e => setTokenSettings(p => ({ ...p, startingNumber: parseInt(e.target.value) || 1 }))}
                  className="h-10 w-28 text-center text-lg font-bold"
                />
              </div>
            </div>

            {/* Right column */}
            <div className="p-5 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Reset Frequency</Label>
                <p className="text-[11px] text-slate-400">How often token numbering resets.</p>
                <div className="flex gap-2">
                  {(["daily", "manual"] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setTokenSettings(p => ({ ...p, resetFrequency: f }))}
                      className={`flex-1 rounded-lg border-2 py-2 text-sm font-semibold capitalize transition-all
                        ${tokenSettings.resetFrequency === f
                          ? "border-[#4982CF] bg-[#4982CF]/5 text-[#4982CF]"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                    >
                      {f === "daily" ? "Daily" : "Manual"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Display Format</Label>
                <p className="text-[11px] text-slate-400">How the number appears alongside the prefix.</p>
                <div className="flex gap-2">
                  {([
                    { val: "padded" as const, label: "Padded", example: `${tokenSettings.prefix}001` },
                    { val: "plain"  as const, label: "Plain",  example: `${tokenSettings.prefix}1`   },
                  ]).map(({ val, label, example }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTokenSettings(p => ({ ...p, displayFormat: val }))}
                      className={`flex-1 rounded-lg border-2 py-2 px-3 text-left transition-all
                        ${tokenSettings.displayFormat === val
                          ? "border-[#4982CF] bg-[#4982CF]/5"
                          : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <p className={`text-xs font-semibold ${tokenSettings.displayFormat === val ? "text-[#4982CF]" : "text-slate-600"}`}>{label}</p>
                      <p className="font-mono text-base font-black text-slate-700 mt-0.5">{example}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer toggle */}
          <div className="border-t border-slate-100 px-5 py-4 flex items-center justify-between bg-slate-50/50">
            <div>
              <p className="text-sm font-semibold text-slate-700">Allow Manual Token Entry</p>
              <p className="text-xs text-slate-400 mt-0.5">Staff can manually type a token number at registration instead of auto-generating.</p>
            </div>
            <div className="flex items-center gap-2 ml-6 flex-shrink-0">
              <Switch
                checked={tokenSettings.allowManualEntry}
                onCheckedChange={v => setTokenSettings(p => ({ ...p, allowManualEntry: v }))}
                className="data-[state=checked]:bg-[#4982CF]"
              />
              <span className={`text-xs font-semibold w-7 ${tokenSettings.allowManualEntry ? "text-[#4982CF]" : "text-slate-400"}`}>
                {tokenSettings.allowManualEntry ? "On" : "Off"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === "queue-behavior") return (
    <QueueBehaviorPanel
      queueBehavior={queueBehavior}
      setQueueBehavior={setQueueBehavior}
    />
  );

  if (section === "locking-settings") return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Locking Settings" desc="Prevent simultaneous editing conflicts on tokens and counters." />
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 px-5">
        <SettingRow label="Lock Timeout (seconds)" desc="Duration before an unattended lock is automatically released.">
          <Input type="number" min="5" value={lockingSettings.lockTimeoutSeconds} onChange={e => setLockingSettings(p => ({ ...p, lockTimeoutSeconds: parseInt(e.target.value) || 5 }))} className="h-9 w-24 text-sm text-center" />
        </SettingRow>
        <ToggleRow label="Auto Release Lock" desc="Locks are released automatically after the timeout period." value={lockingSettings.autoReleaseLock} onChange={v => setLockingSettings(p => ({ ...p, autoReleaseLock: v }))} />
        <ToggleRow label="Allow Force Takeover (Admin Only)" desc="Admins can forcefully take over a locked counter or token." value={lockingSettings.allowForceTakeover} onChange={v => setLockingSettings(p => ({ ...p, allowForceTakeover: v }))} />
      </div>
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
        <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-600">Force Takeover should only be enabled for administrators. Enabling it for general users can cause data conflicts in high-traffic scenarios.</p>
      </div>
    </div>
  );

  if (section === "display-settings") {
    const BLANK_SCREEN: Omit<ScreenConfig, "id"> = {
      name: "", screenType: "main-lobby", associatedCounterId: "",
      theme: "dark", showCurrentToken: true, showCounterName: true,
      showLastNTokens: 5, showQueueCount: false,
      tokenDisplayFormat: "token-counter", soundAlert: true,
      showClock: true, tickerText: "", active: true,
    };

    const selected = screens.find(s => s.id === selectedScreenId) ?? screens[0];
    const previewScreen = previewScreenId ? screens.find(s => s.id === previewScreenId) : null;

    const updateSelected = (patch: Partial<ScreenConfig>) =>
      setScreens(p => p.map(s => s.id === selectedScreenId ? { ...s, ...patch } : s));

    const addScreen = () => {
      const newS: ScreenConfig = { ...BLANK_SCREEN, id: `scr-${Date.now()}`, name: "New Screen" };
      setScreens(p => [...p, newS]);
      setSelectedScreenId(newS.id);
    };

    const deleteScreen = (id: string) => {
      setScreens(p => p.filter(s => s.id !== id));
      if (selectedScreenId === id) setSelectedScreenId(screens.find(s => s.id !== id)?.id ?? "");
    };

    const SCREEN_TYPE_LABELS: Record<ScreenType, string> = {
      "main-lobby": "Main Lobby",
      "counter": "Counter",
      "doctor": "Doctor Room",
    };
    const THEME_LABELS: Record<ScreenTheme, string> = { dark: "Dark", light: "Light", branded: "Branded" };
    const THEME_COLORS: Record<ScreenTheme, string> = {
      dark: "bg-slate-900",
      light: "bg-white",
      branded: "bg-[#4982CF]",
    };

    const getCounterName = (id: string) => {
      if (!id) return "All Counters";
      return counters.find(c => c.id === id)?.name ?? "—";
    };

    // ── Preview rendering helper ──────────────────────────────────────────
    function ScreenPreview({ cfg }: { cfg: ScreenConfig }) {
      const isDark = cfg.theme === "dark";
      const isBranded = cfg.theme === "branded";
      const bg = isDark ? "bg-slate-950" : isBranded ? "bg-[#4982CF]" : "bg-slate-100";
      const textMain = isDark || isBranded ? "text-white" : "text-slate-900";
      const textSub = isDark ? "text-[#4982CF]" : isBranded ? "text-blue-100" : "text-[#4982CF]";
      const textMuted = isDark ? "text-slate-400" : isBranded ? "text-blue-200" : "text-slate-500";
      const tokenBg = isDark ? "bg-slate-900 border-slate-700" : isBranded ? "bg-white/10 border-white/30" : "bg-white border-slate-300";
      const histBg = isDark ? "bg-slate-800 border-slate-700" : isBranded ? "bg-white/10 border-white/20" : "bg-white border-slate-200";
      const histText = isDark || isBranded ? "text-slate-300" : "text-slate-600";
      const clockText = isDark ? "text-slate-500" : isBranded ? "text-blue-200" : "text-slate-400";

      const now = clockTime;
      const fmtTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

      const mockToken = cfg.tokenDisplayFormat === "token-counter"
        ? { num: "C042", counter: getCounterName(cfg.associatedCounterId) || "Counter 3" }
        : { num: "C042", counter: "" };

      const histTokens = Array.from({ length: Math.min(cfg.showLastNTokens, 6) }, (_, i) => `C0${41 - i}`);

      return (
        <div className={`relative w-full h-full flex flex-col ${bg} rounded-xl overflow-hidden font-mono select-none`}>
          {/* Top bar */}
          <div className={`flex items-center justify-between px-6 py-3 border-b ${isDark ? "border-slate-800" : isBranded ? "border-white/20" : "border-slate-200"}`}>
            <p className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>{cfg.name}</p>
            <div className="flex items-center gap-3">
              {cfg.soundAlert && (isDark || isBranded ? <Volume2 className={`h-3.5 w-3.5 ${textMuted}`} /> : <Volume2 className="h-3.5 w-3.5 text-slate-400" />)}
              {cfg.showClock && <span className={`text-xs font-bold ${clockText}`}>{fmtTime}</span>}
            </div>
          </div>

          {/* Main token area */}
          {cfg.showCurrentToken && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-4">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Now Serving</p>
              <div className={`border-2 rounded-2xl px-10 py-5 text-center ${tokenBg}`}>
                <p className={`text-6xl font-black tracking-widest ${isDark || isBranded ? "text-white" : "text-slate-900"}`}>{mockToken.num}</p>
                {cfg.showCounterName && cfg.tokenDisplayFormat === "token-counter" && (
                  <p className={`text-lg font-bold mt-1 ${textSub}`}>{mockToken.counter}</p>
                )}
              </div>
              {cfg.showQueueCount && (
                <p className={`text-xs font-semibold ${textMuted}`}>12 patients in queue</p>
              )}
            </div>
          )}

          {/* Recent tokens */}
          {cfg.showLastNTokens > 0 && (
            <div className={`px-6 py-3 border-t ${isDark ? "border-slate-800" : isBranded ? "border-white/20" : "border-slate-200"}`}>
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Recently Called</p>
              <div className="flex flex-wrap gap-1.5">
                {histTokens.map((t, i) => (
                  <span key={i} className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${histBg} ${histText}`}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Ticker */}
          {cfg.tickerText && (
            <div className={`px-4 py-2 border-t ${isDark ? "border-slate-800 bg-slate-900" : isBranded ? "border-white/20 bg-white/10" : "border-slate-200 bg-slate-50"}`}>
              <p className={`text-[10px] font-medium truncate ${textMuted}`}>📢 {cfg.tickerText}</p>
            </div>
          )}
        </div>
      );
    }

    const ToggleField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
      <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
        <span className="text-sm text-slate-600">{label}</span>
        <Switch checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-[#4982CF]" />
      </div>
    );

    return (
      <div className="flex flex-col h-full overflow-hidden p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <PageHeader title="Display Settings" desc="Design and configure patient-facing display screens for counters, lobbies, and doctor rooms." />
          <Button onClick={addScreen} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 h-9 text-sm">
            <Plus className="h-4 w-4" />New Screen
          </Button>
        </div>

        {/* Two-panel layout */}
        <div className="flex gap-5 flex-1 min-h-0">

          {/* LEFT — screen list */}
          <div className="w-60 flex-shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
            {screens.map(scr => (
              <div
                key={scr.id}
                onClick={() => setSelectedScreenId(scr.id)}
                className={`rounded-xl border cursor-pointer transition-all p-3 group relative
                  ${selectedScreenId === scr.id
                    ? "border-[#4982CF] bg-[#4982CF]/5 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                {/* Mini preview thumbnail */}
                <div className={`rounded-lg h-16 mb-2 overflow-hidden ${THEME_COLORS[scr.theme]}`}>
                  <div className="h-full flex items-center justify-center">
                    <span className={`font-mono font-black text-lg ${scr.theme !== "light" ? "text-white" : "text-slate-800"}`}>C042</span>
                  </div>
                </div>
                <p className={`text-xs font-bold truncate ${selectedScreenId === scr.id ? "text-[#4982CF]" : "text-slate-700"}`}>{scr.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${selectedScreenId === scr.id ? "border-[#4982CF]/30 text-[#4982CF]" : "border-slate-200 text-slate-400"}`}>
                    {SCREEN_TYPE_LABELS[scr.screenType]}
                  </Badge>
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${scr.active ? "border-emerald-300 text-emerald-600" : "border-slate-200 text-slate-400"}`}>
                    {scr.active ? "Active" : "Off"}
                  </Badge>
                </div>
                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setPreviewScreenId(scr.id)} className="p-1 rounded bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-[#4982CF]"><Eye className="h-3 w-3" /></button>
                  <button onClick={() => deleteScreen(scr.id)} className="p-1 rounded bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT — config + mini preview */}
          {selected && (
            <div className="flex-1 min-h-0 flex gap-5 overflow-hidden">
              {/* Config panel */}
              <div className="w-72 flex-shrink-0 overflow-y-auto">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {/* Screen name */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Screen Identity</p>
                    <Input
                      value={selected.name}
                      onChange={e => updateSelected({ name: e.target.value })}
                      className="h-9 text-sm font-semibold"
                      placeholder="Screen name"
                    />
                  </div>

                  {/* Type + counter */}
                  <div className="px-4 py-3 border-b border-slate-100 space-y-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Screen Type</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["main-lobby", "counter", "doctor"] as ScreenType[]).map(t => (
                        <button key={t} type="button" onClick={() => updateSelected({ screenType: t })}
                          className={`rounded-lg border py-1.5 text-center text-[10px] font-bold transition-all
                            ${selected.screenType === t ? "border-[#4982CF] bg-[#4982CF]/8 text-[#4982CF]" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                          {SCREEN_TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Associated Counter</Label>
                      <Select value={selected.associatedCounterId || "all"} onValueChange={v => updateSelected({ associatedCounterId: v === "all" ? "" : v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Counters</SelectItem>
                          {counters.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="px-4 py-3 border-b border-slate-100 space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Theme</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["dark", "light", "branded"] as ScreenTheme[]).map(t => (
                        <button key={t} type="button" onClick={() => updateSelected({ theme: t })}
                          className={`rounded-lg border py-2 text-[10px] font-bold transition-all relative overflow-hidden
                            ${selected.theme === t ? "border-[#4982CF] ring-1 ring-[#4982CF]/30" : "border-slate-200 hover:border-slate-300"}`}>
                          <span className={`inline-block w-4 h-4 rounded-full mb-1 border ${t === "dark" ? "bg-slate-900 border-slate-700" : t === "light" ? "bg-white border-slate-300" : "bg-[#4982CF] border-[#4982CF]"}`} />
                          <p className="text-slate-600">{THEME_LABELS[t]}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Display elements */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Display Elements</p>
                    <ToggleField label="Current Token" checked={selected.showCurrentToken} onChange={v => updateSelected({ showCurrentToken: v })} />
                    <ToggleField label="Counter Name" checked={selected.showCounterName} onChange={v => updateSelected({ showCounterName: v })} />
                    <ToggleField label="Queue Count" checked={selected.showQueueCount} onChange={v => updateSelected({ showQueueCount: v })} />
                    <ToggleField label="Sound Alert" checked={selected.soundAlert} onChange={v => updateSelected({ soundAlert: v })} />
                    <ToggleField label="Show Clock" checked={selected.showClock} onChange={v => updateSelected({ showClock: v })} />
                  </div>

                  {/* Token display format + history */}
                  <div className="px-4 py-3 border-b border-slate-100 space-y-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Token Format</p>
                    <div className="flex gap-1.5">
                      {([
                        { val: "token-counter" as const, label: "Token + Counter" },
                        { val: "token-only" as const, label: "Token Only" },
                      ]).map(opt => (
                        <button key={opt.val} type="button" onClick={() => updateSelected({ tokenDisplayFormat: opt.val })}
                          className={`flex-1 rounded-lg border py-1.5 text-[10px] font-bold transition-all
                            ${selected.tokenDisplayFormat === opt.val ? "border-[#4982CF] bg-[#4982CF]/8 text-[#4982CF]" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Show Last</Label>
                      <Input type="number" min="0" max="10" value={selected.showLastNTokens}
                        onChange={e => updateSelected({ showLastNTokens: parseInt(e.target.value) || 0 })}
                        className="h-8 w-16 text-sm text-center" />
                      <span className="text-xs text-slate-400 whitespace-nowrap">tokens</span>
                    </div>
                  </div>

                  {/* Ticker */}
                  <div className="px-4 py-3 border-b border-slate-100 space-y-2">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Ticker / Announcement</Label>
                    <Input value={selected.tickerText}
                      onChange={e => updateSelected({ tickerText: e.target.value })}
                      placeholder="Leave blank to disable…" className="h-9 text-sm" />
                  </div>

                  {/* Active + Preview */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={selected.active} onCheckedChange={v => updateSelected({ active: v })} className="data-[state=checked]:bg-emerald-500" />
                      <span className="text-sm text-slate-600">Active</span>
                    </div>
                    <Button onClick={() => setPreviewScreenId(selected.id)} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 h-8 text-xs">
                      <Eye className="h-3.5 w-3.5" />Preview
                    </Button>
                  </div>
                </div>
              </div>

              {/* Live mini preview */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Live Preview — {selected.name}</p>
                  <button onClick={() => setPreviewScreenId(selected.id)} className="flex items-center gap-1 text-[10px] font-semibold text-[#4982CF] hover:underline">
                    <Monitor className="h-3 w-3" />Full Preview
                  </button>
                </div>
                <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <ScreenPreview cfg={selected} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Preview Modal ── */}
        <Dialog open={!!previewScreen} onOpenChange={v => !v && setPreviewScreenId(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-0 shadow-2xl">
            <div className="sr-only">
              <DialogHeader><DialogTitle>Screen Preview — {previewScreen?.name}</DialogTitle></DialogHeader>
            </div>
            {previewScreen && (
              <div className="relative rounded-2xl overflow-hidden" style={{ height: "520px" }}>
                <ScreenPreview cfg={previewScreen} />
                <button
                  onClick={() => setPreviewScreenId(null)}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-1.5">
                    <span className={`h-2 w-2 rounded-full ${previewScreen.active ? "bg-emerald-400" : "bg-slate-400"}`} />
                    <span className="text-white text-xs font-semibold">{previewScreen.name}</span>
                    <Badge variant="outline" className="border-white/30 text-white text-[9px] px-1.5 py-0">{SCREEN_TYPE_LABELS[previewScreen.screenType]}</Badge>
                  </div>
                  <div className="flex gap-1">
                    {previewScreen.soundAlert && <div className="bg-black/40 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"><Volume2 className="h-3 w-3 text-white" /><span className="text-white text-[10px] font-semibold">Sound On</span></div>}
                    {!previewScreen.soundAlert && <div className="bg-black/40 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"><VolumeX className="h-3 w-3 text-slate-400" /><span className="text-slate-400 text-[10px] font-semibold">Muted</span></div>}
                    {previewScreen.showClock && <div className="bg-black/40 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"><Clock className="h-3 w-3 text-white" /><span className="text-white text-[10px] font-semibold">Clock On</span></div>}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (section === "doctor-partitions") return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Doctor / Partition Configuration" desc="Map doctors to counters for partitioned queues. Used when Queue Mode = Partitioned by Doctor." />
      <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
        <Info className="h-4 w-4 text-[#4982CF] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-600">This mapping is active when a visit type has <strong>Queue Mode = Partitioned</strong> and <strong>Partition By = Doctor</strong>. Each token generated will carry a <code className="bg-white border border-slate-200 rounded px-1 text-[10px]">doctor_id</code> and be routed to the mapped counter.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="grid border-b border-slate-100 bg-slate-50/80 px-5 py-2.5" style={{ gridTemplateColumns: "1fr 160px 1fr" }}>
          {["Doctor", "Specialty", "Assigned Counter"].map(h => <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>)}
        </div>
        {doctorPartitions.map(dp => (
          <div key={dp.doctorId} className="grid items-center px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50" style={{ gridTemplateColumns: "1fr 160px 1fr" }}>
            <span className="text-sm font-semibold text-slate-800">{dp.doctorName}</span>
            <span className="text-xs text-slate-500">{dp.specialty}</span>
            <Select value={dp.counterId} onValueChange={v => setDoctorPartitions(p => p.map(x => x.doctorId === dp.doctorId ? { ...x, counterId: v } : x))}>
              <SelectTrigger className="h-9 text-sm max-w-xs">
                <SelectValue placeholder="Assign counter…" />
              </SelectTrigger>
              <SelectContent>
                {counters.filter(c => counterTypes.find(ct => ct.id === c.counterTypeId)?.name.toLowerCase().includes("doctor")).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );

  return null;
}
