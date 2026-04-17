import { useState, useMemo } from "react";
import {
  Plus, Edit2, Trash2, Check, X, AlertCircle, GripVertical,
  ChevronUp, ChevronDown, Info,
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

type DisplaySettings = {
  showLastNTokens: number; displayFormat: "token-counter" | "token-only"; soundAlert: boolean;
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

const SEED_DISPLAY: DisplaySettings = { showLastNTokens: 5, displayFormat: "token-counter", soundAlert: true };

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
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(SEED_DISPLAY);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: string } | null>(null);

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

  if (section === "token-settings") return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Token Settings" desc="Configure how tokens are generated, displayed, and reset." />
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
        <SettingRow label="Token Prefix" desc="Letter(s) prepended to every token number.">
          <Input value={tokenSettings.prefix} onChange={e => setTokenSettings(p => ({ ...p, prefix: e.target.value.toUpperCase().slice(0, 2) }))} className="h-9 w-20 text-sm text-center font-mono font-bold" />
        </SettingRow>
        <SettingRow label="Starting Number" desc="First number issued when tokens are reset.">
          <Input type="number" min="1" value={tokenSettings.startingNumber} onChange={e => setTokenSettings(p => ({ ...p, startingNumber: parseInt(e.target.value) || 1 }))} className="h-9 w-24 text-sm text-center" />
        </SettingRow>
        <SettingRow label="Reset Frequency" desc="How often token numbering resets to the starting number.">
          <Select value={tokenSettings.resetFrequency} onValueChange={(v: "daily" | "manual") => setTokenSettings(p => ({ ...p, resetFrequency: v }))}>
            <SelectTrigger className="h-9 w-32 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="manual">Manual</SelectItem></SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Display Format" desc="How the token number is shown on displays.">
          <div className="flex gap-2 items-center">
            <Select value={tokenSettings.displayFormat} onValueChange={(v: "padded" | "plain") => setTokenSettings(p => ({ ...p, displayFormat: v }))}>
              <SelectTrigger className="h-9 w-32 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="padded">C001 (padded)</SelectItem><SelectItem value="plain">C1 (plain)</SelectItem></SelectContent>
            </Select>
            <span className="font-mono text-sm font-bold text-[#4982CF] bg-[#4982CF]/8 px-2 py-1 rounded">
              {tokenSettings.prefix}{tokenSettings.displayFormat === "padded" ? "001" : "1"}
            </span>
          </div>
        </SettingRow>
        <ToggleRow label="Allow Manual Token Entry" desc="Staff can manually enter a token number at registration." value={tokenSettings.allowManualEntry} onChange={v => setTokenSettings(p => ({ ...p, allowManualEntry: v }))} />
      </div>
    </div>
  );

  if (section === "queue-behavior") return (
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
    </div>
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

  if (section === "display-settings") return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Display Settings" desc="Configure what is shown on patient-facing token display screens." />
      {/* Preview */}
      <div className="rounded-xl border border-slate-200 bg-slate-900 p-6 text-center shadow-sm">
        <p className="text-xs text-slate-400 mb-3 uppercase tracking-widest">Display Preview</p>
        <div className="text-5xl font-black text-white tracking-wider font-mono">C{String(42).padStart(displaySettings.displayFormat === "token-counter" ? 3 : 0, "0")}</div>
        {displaySettings.displayFormat === "token-counter" && <p className="text-lg font-bold text-[#4982CF] mt-2">Counter 3</p>}
        <div className="flex justify-center gap-3 mt-4 text-sm text-slate-500">
          {Array.from({ length: Math.min(displaySettings.showLastNTokens, 5) }, (_, i) => (
            <span key={i} className="font-mono text-slate-400">C{String(40 - i).padStart(3, "0")}</span>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 px-5">
        <SettingRow label="Show Last N Tokens" desc="Number of recently called tokens displayed on screen.">
          <Input type="number" min="1" max="20" value={displaySettings.showLastNTokens} onChange={e => setDisplaySettings(p => ({ ...p, showLastNTokens: parseInt(e.target.value) || 1 }))} className="h-9 w-20 text-sm text-center" />
        </SettingRow>
        <SettingRow label="Display Format" desc="What information is shown alongside the token number.">
          <Select value={displaySettings.displayFormat} onValueChange={(v: "token-counter" | "token-only") => setDisplaySettings(p => ({ ...p, displayFormat: v }))}>
            <SelectTrigger className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="token-counter">Token + Counter</SelectItem><SelectItem value="token-only">Token Only</SelectItem></SelectContent>
          </Select>
        </SettingRow>
        <ToggleRow label="Sound Alert" desc="Play an audio chime when a new token is called." value={displaySettings.soundAlert} onChange={v => setDisplaySettings(p => ({ ...p, soundAlert: v }))} />
      </div>
    </div>
  );

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
