import { useState } from "react";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Zap, ArrowRight,
  RotateCcw, AlertCircle, GripVertical, Info, Copy, FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type TriggerEvent     = "DOCTOR_ACTION" | "REGISTRATION" | "STEP_COMPLETE" | "PAYMENT_COMPLETE";
type TriggerActionType = "ORDER_CREATED" | "ORDER_UPDATED" | "CONSULTATION_END" | "STEP_FINISHED";
type ConditionField   = "payment_type" | "patient_status" | "token_status" | "visit_type";
type ConditionOperator = "equals" | "in" | "not_in";
type RuleStatus       = "active" | "inactive" | "draft";

type Condition = {
  id: string;
  field: ConditionField;
  operator: ConditionOperator;
  values: string[];
};

type DestinationStep = {
  id: string;
  counterTypeId: string;
  label: string;
  isPaymentStep: boolean;
  autoInvoice: boolean;
  allowSkip: boolean;
};

type RecallConfig = {
  enabled: boolean;
  afterCounterTypeId: string;
  recallToCounterTypeId: string;
};

type RoutingRule = {
  id: string;
  name: string;
  description: string;
  status: RuleStatus;
  priority: number;
  triggerEvent: TriggerEvent;
  triggerActionType: TriggerActionType;
  triggerServiceTypeId: string;
  conditions: Condition[];
  conditionLogic: "AND" | "OR";
  destinations: DestinationStep[];
  recall: RecallConfig;
};

// ─── Reference Data ───────────────────────────────────────────────────────────

const COUNTER_TYPES = [
  { id: "ct-1", name: "Registration Counter" },
  { id: "ct-2", name: "Doctor Room" },
  { id: "ct-3", name: "Lab Counter" },
  { id: "ct-4", name: "Pharmacy Counter" },
  { id: "ct-5", name: "Billing Counter" },
];

const SERVICE_TYPES = [
  { id: "",     name: "Any Service Type" },
  { id: "st-1", name: "Consultation" },
  { id: "st-2", name: "Lab" },
  { id: "st-3", name: "Procedure" },
  { id: "st-4", name: "Formulary" },
  { id: "st-5", name: "Consumables" },
  { id: "st-6", name: "Imaging" },
  { id: "st-7", name: "Vaccine" },
];

const PAYMENT_TYPES    = ["cash", "corporate", "insurance", "zakat"];
const PATIENT_STATUSES = ["registered", "consulted", "lab_pending", "pharmacy_pending", "complete"];
const TOKEN_STATUSES   = ["active", "paused", "expired", "recalled"];
const VISIT_TYPES_REF  = ["Normal Consultation", "Urgent / Emergency", "Follow-up Visit"];

const TRIGGER_EVENTS: { value: TriggerEvent; label: string; desc: string }[] = [
  { value: "DOCTOR_ACTION",    label: "Doctor Action",     desc: "Doctor performs an action during consultation" },
  { value: "REGISTRATION",     label: "Registration",      desc: "Patient is registered at the front desk" },
  { value: "STEP_COMPLETE",    label: "Step Complete",     desc: "A queue step is marked as complete" },
  { value: "PAYMENT_COMPLETE", label: "Payment Complete",  desc: "A payment transaction is successful" },
];

const ACTION_TYPES_BY_EVENT: Record<TriggerEvent, { value: TriggerActionType; label: string }[]> = {
  DOCTOR_ACTION:    [
    { value: "ORDER_CREATED",    label: "Order Created" },
    { value: "ORDER_UPDATED",    label: "Order Updated" },
    { value: "CONSULTATION_END", label: "Consultation Ended" },
  ],
  REGISTRATION:     [{ value: "STEP_FINISHED", label: "Registration Done" }],
  STEP_COMPLETE:    [{ value: "STEP_FINISHED", label: "Step Finished" }],
  PAYMENT_COMPLETE: [{ value: "STEP_FINISHED", label: "Payment Confirmed" }],
};

// ─── Seed Rules ───────────────────────────────────────────────────────────────

const SEED_RULES: RoutingRule[] = [
  {
    id: "rule-1",
    name: "Doctor Orders Lab → Direct to Lab (Covered Patient)",
    description: "When a doctor creates a lab order and the patient is covered by Corporate, Insurance, or Zakat — skip billing and route the patient directly to the Lab Counter. After lab completion, recall the patient to the Doctor Room.",
    status: "active",
    priority: 1,
    triggerEvent: "DOCTOR_ACTION",
    triggerActionType: "ORDER_CREATED",
    triggerServiceTypeId: "st-2",
    conditionLogic: "AND",
    conditions: [
      { id: "c-1", field: "payment_type", operator: "in",     values: ["corporate", "insurance", "zakat"] },
      { id: "c-2", field: "token_status", operator: "equals", values: ["active"] },
    ],
    destinations: [
      { id: "d-1", counterTypeId: "ct-3", label: "Lab Counter", isPaymentStep: false, autoInvoice: false, allowSkip: false },
    ],
    recall: { enabled: true, afterCounterTypeId: "ct-3", recallToCounterTypeId: "ct-2" },
  },
  {
    id: "rule-2",
    name: "Doctor Orders Lab → Billing then Lab (Cash Patient)",
    description: "When a doctor creates a lab order and the patient is paying cash — auto-generate an invoice with the ordered lab items and their prices, route to Billing Counter for cash collection, then to the Lab Counter. Recall to Doctor Room after lab is complete.",
    status: "active",
    priority: 2,
    triggerEvent: "DOCTOR_ACTION",
    triggerActionType: "ORDER_CREATED",
    triggerServiceTypeId: "st-2",
    conditionLogic: "AND",
    conditions: [
      { id: "c-3", field: "payment_type", operator: "in",     values: ["cash"] },
      { id: "c-4", field: "token_status", operator: "equals", values: ["active"] },
    ],
    destinations: [
      { id: "d-2", counterTypeId: "ct-5", label: "Billing Counter", isPaymentStep: true,  autoInvoice: true,  allowSkip: false },
      { id: "d-3", counterTypeId: "ct-3", label: "Lab Counter",     isPaymentStep: false, autoInvoice: false, allowSkip: false },
    ],
    recall: { enabled: true, afterCounterTypeId: "ct-3", recallToCounterTypeId: "ct-2" },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RuleStatus, { label: string; cls: string; dot: string }> = {
  active:   { label: "Active",   cls: "border-emerald-200 bg-emerald-50 text-emerald-700",   dot: "bg-emerald-500" },
  inactive: { label: "Inactive", cls: "border-slate-200  bg-slate-50   text-slate-500",      dot: "bg-slate-400" },
  draft:    { label: "Draft",    cls: "border-amber-200  bg-amber-50   text-amber-700",      dot: "bg-amber-500" },
};

function uid() { return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function getValuesForField(field: ConditionField): string[] {
  if (field === "payment_type")    return PAYMENT_TYPES;
  if (field === "patient_status")  return PATIENT_STATUSES;
  if (field === "token_status")    return TOKEN_STATUSES;
  if (field === "visit_type")      return VISIT_TYPES_REF;
  return [];
}

function labelForField(f: ConditionField) {
  return { payment_type: "Payment Type", patient_status: "Patient Status", token_status: "Token Status", visit_type: "Visit Type" }[f];
}
function labelForOperator(o: ConditionOperator) {
  return { equals: "equals", in: "is one of", not_in: "is not one of" }[o];
}
function counterTypeName(id: string) {
  return COUNTER_TYPES.find(c => c.id === id)?.name ?? id;
}
function serviceTypeName(id: string) {
  return SERVICE_TYPES.find(s => s.id === id)?.name ?? "Any";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ icon, title, color, children }: {
  icon: React.ReactNode; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className={`flex items-center gap-2.5 px-5 py-3 border-b border-slate-100 ${color}`}>
        <span className="text-sm">{icon}</span>
        <span className="text-sm font-bold text-slate-700">{title}</span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function FlowSummary({ rule }: { rule: RoutingRule }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold px-2.5 py-0.5">
        <Zap className="h-3 w-3" />{rule.triggerEvent.replace("_", " ")}
      </span>
      <ArrowRight className="h-3 w-3 text-slate-300" />
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-2.5 py-0.5">
        {SERVICE_TYPES.find(s => s.id === rule.triggerServiceTypeId)?.name ?? "Any"}
      </span>
      <ArrowRight className="h-3 w-3 text-slate-300" />
      {rule.destinations.map((d, i) => (
        <span key={d.id} className="flex items-center gap-1">
          <span className={`inline-flex items-center gap-1 rounded-full border text-[10px] font-bold px-2.5 py-0.5 ${d.isPaymentStep ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
            {d.label}
          </span>
          {i < rule.destinations.length - 1 && <ArrowRight className="h-3 w-3 text-slate-300" />}
        </span>
      ))}
      {rule.recall.enabled && (
        <>
          <ArrowRight className="h-3 w-3 text-slate-300" />
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2.5 py-0.5">
            <RotateCcw className="h-2.5 w-2.5" />Recall → {counterTypeName(rule.recall.recallToCounterTypeId)}
          </span>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RoutingRulesModule() {
  const [rules, setRules]               = useState<RoutingRule[]>(SEED_RULES);
  const [selectedId, setSelectedId]     = useState<string>(SEED_RULES[0].id);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const selected = rules.find(r => r.id === selectedId) ?? rules[0];

  // ── Rule helpers ───────────────────────────────────────────────────────────
  const updateRule = (patch: Partial<RoutingRule>) =>
    setRules(p => p.map(r => r.id === selectedId ? { ...r, ...patch } : r));

  const addRule = () => {
    const newRule: RoutingRule = {
      id: uid(), name: "New Routing Rule", description: "",
      status: "draft", priority: rules.length + 1,
      triggerEvent: "DOCTOR_ACTION", triggerActionType: "ORDER_CREATED",
      triggerServiceTypeId: "",
      conditions: [], conditionLogic: "AND",
      destinations: [],
      recall: { enabled: false, afterCounterTypeId: "", recallToCounterTypeId: "" },
    };
    setRules(p => [...p, newRule]);
    setSelectedId(newRule.id);
  };

  const duplicateRule = (id: string) => {
    const src = rules.find(r => r.id === id);
    if (!src) return;
    const dup: RoutingRule = {
      ...src, id: uid(), name: `${src.name} (Copy)`,
      status: "draft", priority: rules.length + 1,
      conditions: src.conditions.map(c => ({ ...c, id: uid() })),
      destinations: src.destinations.map(d => ({ ...d, id: uid() })),
    };
    setRules(p => [...p, dup]);
    setSelectedId(dup.id);
  };

  const deleteRule = (id: string) => {
    setRules(p => p.filter(r => r.id !== id));
    const remaining = rules.filter(r => r.id !== id);
    setSelectedId(remaining[0]?.id ?? "");
    setDeleteTarget(null);
  };

  const movePriority = (id: string, dir: -1 | 1) => {
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);
    const idx = sorted.findIndex(r => r.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const p1 = sorted[idx].priority;
    const p2 = sorted[swapIdx].priority;
    setRules(prev => prev.map(r => {
      if (r.id === sorted[idx].id)    return { ...r, priority: p2 };
      if (r.id === sorted[swapIdx].id) return { ...r, priority: p1 };
      return r;
    }));
  };

  // ── Condition helpers ──────────────────────────────────────────────────────
  const addCondition = () => {
    const c: Condition = { id: uid(), field: "payment_type", operator: "in", values: [] };
    updateRule({ conditions: [...selected.conditions, c] });
  };

  const updateCondition = (cid: string, patch: Partial<Condition>) =>
    updateRule({ conditions: selected.conditions.map(c => c.id === cid ? { ...c, ...patch } : c) });

  const removeCondition = (cid: string) =>
    updateRule({ conditions: selected.conditions.filter(c => c.id !== cid) });

  const toggleConditionValue = (cid: string, val: string) => {
    const cond = selected.conditions.find(c => c.id === cid);
    if (!cond) return;
    const next = cond.values.includes(val)
      ? cond.values.filter(v => v !== val)
      : [...cond.values, val];
    updateCondition(cid, { values: next });
  };

  // ── Destination helpers ────────────────────────────────────────────────────
  const addDestination = () => {
    const d: DestinationStep = {
      id: uid(), counterTypeId: "ct-3", label: counterTypeName("ct-3"),
      isPaymentStep: false, autoInvoice: false, allowSkip: false,
    };
    updateRule({ destinations: [...selected.destinations, d] });
  };

  const updateDestination = (did: string, patch: Partial<DestinationStep>) =>
    updateRule({ destinations: selected.destinations.map(d => d.id === did ? { ...d, ...patch } : d) });

  const removeDestination = (did: string) =>
    updateRule({ destinations: selected.destinations.filter(d => d.id !== did) });

  const moveDestination = (did: string, dir: -1 | 1) => {
    const arr = [...selected.destinations];
    const idx = arr.findIndex(d => d.id === did);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= arr.length) return;
    [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
    updateRule({ destinations: arr });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  return (
    <div className="flex flex-col h-full overflow-hidden p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Queue Routing Rules</h1>
          <p className="mt-1 text-sm text-slate-500">Define trigger-based rules that automatically route patients through the correct queue path.</p>
        </div>
        <Button onClick={addRule} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 h-9 text-sm">
          <Plus className="h-4 w-4" />New Rule
        </Button>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* LEFT — rule list */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
          {sortedRules.map((rule, idx) => {
            const sc = STATUS_CONFIG[rule.status];
            const isSelected = rule.id === selectedId;
            return (
              <div
                key={rule.id}
                onClick={() => setSelectedId(rule.id)}
                className={`rounded-xl border cursor-pointer transition-all p-3.5 group relative
                  ${isSelected
                    ? "border-[#4982CF] bg-[#4982CF]/5 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                {/* Priority badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black border
                      ${isSelected ? "bg-[#4982CF] border-[#4982CF] text-white" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
                      {idx + 1}
                    </span>
                    <span className={`text-xs font-bold ${isSelected ? "text-[#4982CF]" : "text-slate-700"} line-clamp-2 leading-tight`}>
                      {rule.name}
                    </span>
                  </div>
                </div>

                {/* Status + trigger */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${sc.cls}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />{sc.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[9px] font-bold px-1.5 py-0.5">
                    <Zap className="h-2.5 w-2.5" />{rule.triggerEvent.replace("_"," ")}
                  </span>
                  {rule.triggerServiceTypeId && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-bold px-1.5 py-0.5">
                      <FlaskConical className="h-2.5 w-2.5" />{serviceTypeName(rule.triggerServiceTypeId)}
                    </span>
                  )}
                </div>

                {/* Destination flow pill row */}
                <div className="flex flex-wrap items-center gap-1 mt-2">
                  {rule.destinations.map((d, i) => (
                    <span key={d.id} className="flex items-center gap-0.5">
                      <span className={`text-[9px] font-bold rounded-full border px-1.5 py-0.5
                        ${d.isPaymentStep ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
                        {d.label}
                      </span>
                      {i < rule.destinations.length - 1 && <ArrowRight className="h-2.5 w-2.5 text-slate-300" />}
                    </span>
                  ))}
                  {rule.recall.enabled && (
                    <>
                      {rule.destinations.length > 0 && <ArrowRight className="h-2.5 w-2.5 text-slate-300" />}
                      <span className="text-[9px] font-bold rounded-full border bg-rose-50 border-rose-200 text-rose-700 px-1.5 py-0.5 flex items-center gap-0.5">
                        <RotateCcw className="h-2 w-2" />Recall
                      </span>
                    </>
                  )}
                </div>

                {/* Hover actions */}
                <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={() => movePriority(rule.id, -1)} title="Move up" className="p-1 rounded bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-[#4982CF] disabled:opacity-30">
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button onClick={() => movePriority(rule.id, 1)} title="Move down" className="p-1 rounded bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-[#4982CF]">
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <button onClick={() => duplicateRule(rule.id)} title="Duplicate" className="p-1 rounded bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-[#4982CF]">
                    <Copy className="h-3 w-3" />
                  </button>
                  <button onClick={() => setDeleteTarget(rule.id)} title="Delete" className="p-1 rounded bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-rose-500">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {rules.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
              <Zap className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-400">No rules yet</p>
              <p className="text-xs text-slate-300 mt-1">Click "New Rule" to get started</p>
            </div>
          )}
        </div>

        {/* RIGHT — rule editor */}
        {selected && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">

            {/* Rule name + meta */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-2 flex-1">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#4982CF] text-white text-[10px] font-black">
                    {sortedRules.findIndex(r => r.id === selected.id) + 1}
                  </span>
                  <Input
                    value={selected.name}
                    onChange={e => updateRule({ name: e.target.value })}
                    className="h-8 text-sm font-bold border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-slate-800 flex-1"
                    placeholder="Rule name…"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selected.status} onValueChange={(v: RuleStatus) => updateRule({ status: v })}>
                    <SelectTrigger className="h-7 w-28 text-xs border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="px-5 py-3">
                <Textarea
                  value={selected.description}
                  onChange={e => updateRule({ description: e.target.value })}
                  placeholder="Describe what this rule does and when it applies…"
                  className="text-sm text-slate-600 border-slate-200 resize-none min-h-[60px]"
                  rows={2}
                />
                <div className="mt-3">
                  <FlowSummary rule={selected} />
                </div>
              </div>
            </div>

            {/* ── 1. TRIGGER ─────────────────────────────────────────────── */}
            <SectionCard
              icon={<Zap className="h-4 w-4 text-violet-600" />}
              title="1 · Trigger"
              color="bg-violet-50/60"
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Event</Label>
                  <Select value={selected.triggerEvent} onValueChange={(v: TriggerEvent) => {
                    const firstAction = ACTION_TYPES_BY_EVENT[v][0].value;
                    updateRule({ triggerEvent: v, triggerActionType: firstAction });
                  }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRIGGER_EVENTS.map(e => (
                        <SelectItem key={e.value} value={e.value}>
                          <div>
                            <p className="font-medium">{e.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{e.desc}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Action Type</Label>
                  <Select value={selected.triggerActionType} onValueChange={(v: TriggerActionType) => updateRule({ triggerActionType: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES_BY_EVENT[selected.triggerEvent].map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Service Type (Order Type)</Label>
                  <Select value={selected.triggerServiceTypeId || "_any"} onValueChange={v => updateRule({ triggerServiceTypeId: v === "_any" ? "" : v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_any">Any Service Type</SelectItem>
                      {SERVICE_TYPES.filter(s => s.id).map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400">Matches the service type of the doctor's order. Service types are managed under Billing & Pricing → Service Types.</p>
                </div>
              </div>
            </SectionCard>

            {/* ── 2. CONDITIONS ──────────────────────────────────────────── */}
            <SectionCard
              icon={<Info className="h-4 w-4 text-blue-600" />}
              title="2 · Conditions (Optional)"
              color="bg-blue-50/60"
            >
              {/* Logic toggle */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-slate-500 font-medium">Match</span>
                <div className="flex rounded-lg overflow-hidden border border-slate-200">
                  {(["AND","OR"] as const).map(l => (
                    <button key={l} type="button" onClick={() => updateRule({ conditionLogic: l })}
                      className={`px-3 py-1 text-xs font-bold transition-all ${selected.conditionLogic === l ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                      {l}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-medium">of the following conditions</span>
              </div>

              {/* Condition rows */}
              <div className="space-y-2">
                {selected.conditions.map((cond, idx) => {
                  const opts = getValuesForField(cond.field);
                  return (
                    <div key={cond.id} className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                      {/* Logic connector */}
                      <div className="flex-shrink-0 w-8 text-center pt-2.5">
                        {idx === 0
                          ? <span className="text-[10px] font-bold text-slate-400">IF</span>
                          : <span className="text-[10px] font-bold text-[#4982CF]">{selected.conditionLogic}</span>}
                      </div>

                      {/* Field */}
                      <Select value={cond.field} onValueChange={(v: ConditionField) => updateCondition(cond.id, { field: v, values: [] })}>
                        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["payment_type","patient_status","token_status","visit_type"] as ConditionField[]).map(f => (
                            <SelectItem key={f} value={f}>{labelForField(f)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Operator */}
                      <Select value={cond.operator} onValueChange={(v: ConditionOperator) => updateCondition(cond.id, { operator: v })}>
                        <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["equals","in","not_in"] as ConditionOperator[]).map(o => (
                            <SelectItem key={o} value={o}>{labelForOperator(o)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Value chips */}
                      <div className="flex-1 flex flex-wrap gap-1 items-center min-h-[32px] p-1.5 rounded-md border border-slate-200 bg-white">
                        {opts.map(opt => (
                          <button key={opt} type="button"
                            onClick={() => toggleConditionValue(cond.id, opt)}
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize transition-all
                              ${cond.values.includes(opt)
                                ? "bg-[#4982CF] border-[#4982CF] text-white"
                                : "border-slate-200 text-slate-500 hover:border-[#4982CF]/50 hover:text-[#4982CF]"}`}>
                            {opt}
                          </button>
                        ))}
                        {cond.values.length === 0 && <span className="text-[10px] text-slate-300 pl-1">click to select values…</span>}
                      </div>

                      <button onClick={() => removeCondition(cond.id)} className="mt-1 p-1 rounded text-slate-300 hover:text-rose-500 transition-colors flex-shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <Button onClick={addCondition} variant="outline" className="mt-3 h-8 text-xs gap-1.5 border-dashed text-slate-500 hover:border-[#4982CF] hover:text-[#4982CF]">
                <Plus className="h-3.5 w-3.5" />Add Condition
              </Button>
            </SectionCard>

            {/* ── 3. DESTINATION STEPS ───────────────────────────────────── */}
            <SectionCard
              icon={<ArrowRight className="h-4 w-4 text-emerald-600" />}
              title="3 · Destination Queue Path"
              color="bg-emerald-50/60"
            >
              <p className="text-xs text-slate-400 mb-3">Define the ordered steps the patient will be routed through. Steps are executed in sequence — top to bottom.</p>

              <div className="space-y-2">
                {selected.destinations.map((dest, idx) => (
                  <div key={dest.id} className="flex items-center gap-2">
                    {/* Step indicator */}
                    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 
                        ${dest.isPaymentStep ? "border-amber-400 bg-amber-50 text-amber-700" : "border-emerald-400 bg-emerald-50 text-emerald-700"}`}>
                        {idx + 1}
                      </span>
                    </div>

                    {/* Step config card */}
                    <div className={`flex-1 rounded-lg border p-3 ${dest.isPaymentStep ? "border-amber-200 bg-amber-50/40" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Counter type */}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Route to</Label>
                          <Select value={dest.counterTypeId} onValueChange={v => {
                            const name = COUNTER_TYPES.find(c => c.id === v)?.name ?? "";
                            updateDestination(dest.id, { counterTypeId: v, label: name });
                          }}>
                            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {COUNTER_TYPES.map(ct => (
                                <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Label override */}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs font-semibold text-slate-500">Label</Label>
                          <Input value={dest.label} onChange={e => updateDestination(dest.id, { label: e.target.value })}
                            className="h-8 w-36 text-xs" placeholder="Step label" />
                        </div>

                        {/* Payment step toggle */}
                        <div className="flex items-center gap-1.5">
                          <Switch checked={dest.isPaymentStep} onCheckedChange={v => updateDestination(dest.id, { isPaymentStep: v, autoInvoice: v ? dest.autoInvoice : false })}
                            className="data-[state=checked]:bg-amber-500 scale-75" />
                          <span className="text-xs font-semibold text-slate-500">Payment Step</span>
                        </div>

                        {dest.isPaymentStep && (
                          <div className="flex items-center gap-1.5">
                            <Switch checked={dest.autoInvoice} onCheckedChange={v => updateDestination(dest.id, { autoInvoice: v })}
                              className="data-[state=checked]:bg-[#4982CF] scale-75" />
                            <span className="text-xs font-semibold text-slate-500">Auto-Generate Invoice</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          <Switch checked={dest.allowSkip} onCheckedChange={v => updateDestination(dest.id, { allowSkip: v })}
                            className="data-[state=checked]:bg-slate-500 scale-75" />
                          <span className="text-xs font-semibold text-slate-500">Allow Skip</span>
                        </div>
                      </div>

                      {dest.isPaymentStep && dest.autoInvoice && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-100 border border-amber-200 px-3 py-1.5">
                          <Info className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                          <p className="text-[10px] text-amber-700">Invoice will be auto-generated with all ordered items and their prices from Service Pricing. The billing counter agent will see the full item list for this token.</p>
                        </div>
                      )}
                    </div>

                    {/* Move + delete */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button onClick={() => moveDestination(dest.id, -1)} className="p-1 rounded border border-slate-200 bg-white text-slate-400 hover:text-[#4982CF] text-xs">
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button onClick={() => moveDestination(dest.id, 1)} className="p-1 rounded border border-slate-200 bg-white text-slate-400 hover:text-[#4982CF] text-xs">
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button onClick={() => removeDestination(dest.id)} className="p-1 rounded border border-slate-200 bg-white text-slate-400 hover:text-rose-500">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Visual connector between steps */}
              {selected.destinations.length > 1 && (
                <div className="ml-2.5 mt-1 mb-1 flex items-center gap-2 text-[10px] text-slate-400">
                  <div className="w-px h-4 bg-slate-200 ml-2.5" />
                  <span>patient moves to next step after completing previous</span>
                </div>
              )}

              <Button onClick={addDestination} variant="outline" className="mt-3 h-8 text-xs gap-1.5 border-dashed text-slate-500 hover:border-[#4982CF] hover:text-[#4982CF]">
                <Plus className="h-3.5 w-3.5" />Add Step
              </Button>
            </SectionCard>

            {/* ── 4. RECALL ──────────────────────────────────────────────── */}
            <SectionCard
              icon={<RotateCcw className="h-4 w-4 text-rose-600" />}
              title="4 · Recall After Completion"
              color="bg-rose-50/60"
            >
              <div className="flex items-center gap-3 mb-4">
                <Switch
                  checked={selected.recall.enabled}
                  onCheckedChange={v => updateRule({ recall: { ...selected.recall, enabled: v } })}
                  className="data-[state=checked]:bg-rose-500"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Enable Recall</p>
                  <p className="text-xs text-slate-400">After the final destination step completes, automatically recall the patient back to a specific counter.</p>
                </div>
              </div>

              {selected.recall.enabled && (
                <div className="grid grid-cols-2 gap-4 pl-2 border-l-2 border-rose-200">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">After This Step Completes</Label>
                    <Select
                      value={selected.recall.afterCounterTypeId || "_last"}
                      onValueChange={v => updateRule({ recall: { ...selected.recall, afterCounterTypeId: v === "_last" ? "" : v } })}
                    >
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_last">Last destination step (auto)</SelectItem>
                        {COUNTER_TYPES.map(ct => (
                          <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-400">Recall triggers when the patient finishes this counter type step.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Recall Patient To</Label>
                    <Select
                      value={selected.recall.recallToCounterTypeId || ""}
                      onValueChange={v => updateRule({ recall: { ...selected.recall, recallToCounterTypeId: v } })}
                    >
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select counter type…" /></SelectTrigger>
                      <SelectContent>
                        {COUNTER_TYPES.map(ct => (
                          <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-400">The patient's token will re-enter the queue at this counter type.</p>
                  </div>

                  {/* Recall summary banner */}
                  {selected.recall.recallToCounterTypeId && (
                    <div className="col-span-2 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5">
                      <RotateCcw className="h-4 w-4 text-rose-500 flex-shrink-0" />
                      <p className="text-xs text-rose-700">
                        After completing <strong>{counterTypeName(selected.recall.afterCounterTypeId) || "the last step"}</strong>, the patient will be automatically recalled to the <strong>{counterTypeName(selected.recall.recallToCounterTypeId)}</strong> queue — preserving their original token.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* Save bar */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
              <p className="text-xs text-slate-400">Changes are saved to local state. In production, rules are evaluated in priority order — highest priority (1) first.</p>
              <div className="flex gap-2">
                <Select value={selected.status} onValueChange={(v: RuleStatus) => updateRule({ status: v })}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Set Active</SelectItem>
                    <SelectItem value="inactive">Set Inactive</SelectItem>
                    <SelectItem value="draft">Save as Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white h-8 text-xs px-4">Save Rule</Button>
              </div>
            </div>

            <div className="h-2" /> {/* bottom breathing room */}
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />Delete Rule
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-1">
            Delete <strong>{rules.find(r => r.id === deleteTarget)?.name}</strong>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-8 text-sm">Cancel</Button>
            <Button onClick={() => deleteTarget && deleteRule(deleteTarget)} className="bg-rose-500 hover:bg-rose-600 text-white h-8 text-sm gap-2">
              <Trash2 className="h-3.5 w-3.5" />Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
