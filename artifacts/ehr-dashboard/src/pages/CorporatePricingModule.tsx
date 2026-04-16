import { useState, useMemo } from "react";
import {
  Plus, Building, Edit2, Trash2, ChevronRight, Search,
  CreditCard, Upload, X, Info, Banknote, ClipboardList,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  Clock, Receipt, WalletCards, ArrowDownCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import type { ServiceType, Service, BillingEntity, PricingRule, EntityService } from "@/pages/BillingTypes";

// ─── Additional Types ─────────────────────────────────────────────────────────

type LedgerEntry = {
  id: string;
  date: string;
  type: "advance" | "claim" | "tax";
  amount: number; // positive = credit, negative = debit
  taxDeducted: number;
  balance: number;
  remarks: string;
  reference: string;
};

type PatientInvoice = {
  id: string;
  patientName: string;
  mrn: string;
  serviceDate: string;
  services: string[];
  totalAmount: number;
  paidAmount: number;
  taxDeducted: number;
  status: "unpaid" | "partial" | "paid";
  claimDate: string;
  paymentDate: string;
  reference: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function computeAdjustedPrice(basePrice: number, rule: PricingRule | undefined): number {
  if (!rule || rule.value === 0) return basePrice;
  if (rule.type === "percentage") return Math.round(basePrice * (1 + rule.value / 100));
  return Math.round(basePrice + rule.value);
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function generateMockInvoices(entityId: string): PatientInvoice[] {
  const base = Date.now();
  const d = (offset: number) => new Date(base - offset * 86400000).toISOString().slice(0, 10);
  return [
    { id: `inv-${entityId}-1`, patientName: "Ahmed Khan", mrn: "MR-10123", serviceDate: d(20), services: ["General Consultation", "CBC"], totalAmount: 950, paidAmount: 0, taxDeducted: 0, status: "unpaid", claimDate: d(18), paymentDate: "", reference: "" },
    { id: `inv-${entityId}-2`, patientName: "Sana Malik", mrn: "MR-10456", serviceDate: d(15), services: ["Specialist Consultation", "X-Ray Chest"], totalAmount: 2100, paidAmount: 1000, taxDeducted: 0, status: "partial", claimDate: d(13), paymentDate: "", reference: "" },
    { id: `inv-${entityId}-3`, patientName: "Usman Ali", mrn: "MR-10789", serviceDate: d(10), services: ["Echocardiogram"], totalAmount: 3500, paidAmount: 0, taxDeducted: 0, status: "unpaid", claimDate: d(8), paymentDate: "", reference: "" },
    { id: `inv-${entityId}-4`, patientName: "Fatima Hassan", mrn: "MR-11001", serviceDate: d(30), services: ["Blood Glucose (Fasting)", "Liver Function Test"], totalAmount: 1000, paidAmount: 1000, taxDeducted: 50, status: "paid", claimDate: d(28), paymentDate: d(5), reference: "TXN-8811" },
    { id: `inv-${entityId}-5`, patientName: "Bilal Ahmed", mrn: "MR-11234", serviceDate: d(5), services: ["Follow-up Consultation"], totalAmount: 300, paidAmount: 0, taxDeducted: 0, status: "unpaid", claimDate: d(3), paymentDate: "", reference: "" },
    { id: `inv-${entityId}-6`, patientName: "Nadia Rehan", mrn: "MR-11450", serviceDate: d(7), services: ["Specialist Consultation", "Echocardiogram"], totalAmount: 4700, paidAmount: 2000, taxDeducted: 0, status: "partial", claimDate: d(5), paymentDate: "", reference: "" },
  ];
}

type EntityFormState = {
  name: string; contactPerson: string; contactPhone: string;
  email: string; mouFileName: string;
  creditEnabled: boolean; creditLimit: string; useBaseForNew: boolean;
};
function blankEntityForm(): EntityFormState {
  return { name: "", contactPerson: "", contactPhone: "", email: "", mouFileName: "", creditEnabled: false, creditLimit: "", useBaseForNew: false };
}

type BulkRuleState = { scope: "all" | string; type: "percentage" | "fixed"; value: string; };

// ─── Status helpers ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PatientInvoice["status"] }) {
  if (status === "paid") return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[10px]"><CheckCircle2 className="h-2.5 w-2.5 mr-1" />Paid</Badge>;
  if (status === "partial") return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 text-[10px]"><Clock className="h-2.5 w-2.5 mr-1" />Partial</Badge>;
  return <Badge className="bg-rose-500/10 text-rose-700 border-rose-200 text-[10px]"><AlertCircle className="h-2.5 w-2.5 mr-1" />Unpaid</Badge>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_ENTITIES: BillingEntity[] = [
  { id: "corp-2", name: "Sui Northern Gas (SNGPL)", contactPerson: "Nadia Baig", contactPhone: "0321-9876543", email: "welfare@sngpl.com.pk", mouFileName: "SNGPL_MOU_2024.pdf", creditEnabled: true, creditLimit: 750000, useBaseForNew: false, pricingRules: {}, entityServices: [], createdAt: "2024-02-10T00:00:00.000Z" },
  { id: "corp-4", name: "Packages Limited", contactPerson: "Sana Tariq", contactPhone: "0301-4567890", email: "hr@packages.com.pk", mouFileName: "", creditEnabled: false, creditLimit: 0, useBaseForNew: true, pricingRules: {}, entityServices: [], createdAt: "2024-04-20T00:00:00.000Z" },
];

function buildSeedLedgers(): Record<string, LedgerEntry[]> {
  function make(id: string, date: string, type: LedgerEntry["type"], amount: number, tax: number, remarks: string, ref: string): LedgerEntry {
    return { id, date, type, amount, taxDeducted: tax, balance: 0, remarks, reference: ref };
  }
  function bal(entries: LedgerEntry[]): LedgerEntry[] {
    let b = 0; return entries.map(e => { b += e.amount; return { ...e, balance: b }; });
  }
  return {
    "corp-2": bal([
      make("l2-1", "2024-09-15", "advance", 100000, 0,    "Annual advance Q4",              "ADV-C2-001"),
      make("l2-2", "2024-10-20", "claim",   -67500, 0,    "Invoice batch Oct (8 patients)", "CLM-C2-001"),
      make("l2-3", "2024-10-20", "tax",      4725,  4725, "WHT 7% on CLM-C2-001",           "CLM-C2-001"),
    ]),
    "corp-4": bal([]),
  };
}

function buildSeedInvoices(): Record<string, PatientInvoice[]> {
  return {
    "corp-2": generateMockInvoices("corp-2"),
    "corp-4": generateMockInvoices("corp-4"),
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CorporatePricingModule({
  serviceTypes, services, entityLabel = "Corporate",
}: {
  serviceTypes: ServiceType[];
  services: Service[];
  entityLabel?: string;
}) {
  // ── Core state (existing) ──
  const [entities, setEntities] = useState<BillingEntity[]>(() => SEED_ENTITIES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [entityForm, setEntityForm] = useState<EntityFormState>(blankEntityForm());
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkRule, setBulkRule] = useState<BulkRuleState>({ scope: "all", type: "percentage", value: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pricingRuleForm, setPricingRuleForm] = useState<Record<string, { type: "percentage" | "fixed"; value: string }>>({});

  // ── New state: ledger, invoices ──
  const [ledgers, setLedgers] = useState<Record<string, LedgerEntry[]>>(() => buildSeedLedgers());
  const [entityInvoices, setEntityInvoices] = useState<Record<string, PatientInvoice[]>>(() => buildSeedInvoices());

  // ── Advance payment dialog ──
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ amount: "", remarks: "", date: today() });

  // ── Claims / payment processing ──
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<"all" | "unpaid" | "partial" | "paid">("all");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    receivedAmount: "", taxMode: "transaction" as "transaction" | "per-invoice",
    taxAmount: "", taxRate: "", paymentMethod: "", transactionRef: "", date: today(),
  });

  // ── Derived ──
  const selectedEntity = entities.find(e => e.id === selectedId) ?? null;
  const currentLedger = selectedId ? (ledgers[selectedId] ?? []) : [];
  const currentInvoices = selectedId ? (entityInvoices[selectedId] ?? []) : [];

  // Running balance from ledger
  function rebuildBalances(entries: LedgerEntry[]): LedgerEntry[] {
    let bal = 0;
    return entries.map(e => { bal += e.amount; return { ...e, balance: bal }; });
  }

  // Financial summary
  const summary = useMemo(() => {
    const totalAdvance = currentLedger.filter(e => e.type === "advance").reduce((s, e) => s + e.amount, 0);
    const totalConsumed = currentInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
    const totalPaid = currentInvoices.reduce((s, inv) => s + inv.paidAmount, 0);
    const totalTax = currentInvoices.reduce((s, inv) => s + inv.taxDeducted, 0);
    // Raw invoice-level outstanding (not yet settled via claim)
    const invoicePending = totalConsumed - totalPaid;
    // Ledger running balance = all advances minus all claim debits ± tax adjustments
    const ledgerBalance = currentLedger.reduce((s, e) => s + e.amount, 0);
    // True receivable = only the portion of invoice-pending that EXCEEDS the available advance balance.
    // If ledger balance covers all outstanding invoices, there is nothing to collect — it will be
    // settled on the next claim run.
    const trueReceivable = Math.max(0, invoicePending - Math.max(0, ledgerBalance));
    const advanceCovered = invoicePending - trueReceivable;
    return { totalAdvance, totalConsumed, totalPaid, totalTax, invoicePending, ledgerBalance, trueReceivable, advanceCovered };
  }, [currentLedger, currentInvoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return currentInvoices.filter(inv => {
      const matchStatus = invoiceStatusFilter === "all" || inv.status === invoiceStatusFilter;
      const matchSearch = !invoiceSearch || inv.patientName.toLowerCase().includes(invoiceSearch.toLowerCase()) || inv.mrn.toLowerCase().includes(invoiceSearch.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [currentInvoices, invoiceStatusFilter, invoiceSearch]);

  // Patient-level pending summary (group invoices by patient)
  const patientSummary = useMemo(() => {
    const map: Record<string, { name: string; mrn: string; total: number; paid: number; invoices: number }> = {};
    currentInvoices.forEach(inv => {
      if (!map[inv.mrn]) map[inv.mrn] = { name: inv.patientName, mrn: inv.mrn, total: 0, paid: 0, invoices: 0 };
      map[inv.mrn].total += inv.totalAmount;
      map[inv.mrn].paid += inv.paidAmount;
      map[inv.mrn].invoices += 1;
    });
    return Object.values(map);
  }, [currentInvoices]);

  // ── Entity management (existing) ──
  function buildEntityServices(entity: BillingEntity): EntityService[] {
    return services.map(s => {
      const existing = entity.entityServices.find(es => es.serviceId === s.id);
      if (existing) return existing;
      const rule = entity.pricingRules[s.serviceTypeId];
      return { serviceId: s.id, price: computeAdjustedPrice(s.basePrice, rule), overridden: false };
    });
  }

  const openAddEntity = () => { setEntityForm(blankEntityForm()); setEditingEntityId(null); setShowEntityForm(true); };
  const openEditEntity = (e: BillingEntity) => {
    setEntityForm({ name: e.name, contactPerson: e.contactPerson, contactPhone: e.contactPhone, email: e.email, mouFileName: e.mouFileName, creditEnabled: e.creditEnabled, creditLimit: String(e.creditLimit), useBaseForNew: e.useBaseForNew });
    setEditingEntityId(e.id); setShowEntityForm(true);
  };

  const saveEntityForm = () => {
    const name = entityForm.name.trim();
    if (!name) return;
    if (editingEntityId) {
      setEntities(prev => prev.map(e => e.id === editingEntityId ? { ...e, name, contactPerson: entityForm.contactPerson, contactPhone: entityForm.contactPhone, email: entityForm.email, mouFileName: entityForm.mouFileName, creditEnabled: entityForm.creditEnabled, creditLimit: parseFloat(entityForm.creditLimit) || 0, useBaseForNew: entityForm.useBaseForNew } : e));
    } else {
      const id = `ent-${Date.now()}`;
      const newE: BillingEntity = { id, name, contactPerson: entityForm.contactPerson, contactPhone: entityForm.contactPhone, email: entityForm.email, mouFileName: entityForm.mouFileName, creditEnabled: entityForm.creditEnabled, creditLimit: parseFloat(entityForm.creditLimit) || 0, useBaseForNew: entityForm.useBaseForNew, pricingRules: {}, entityServices: [], createdAt: new Date().toISOString() };
      setEntities(prev => [...prev, newE]);
      setEntityInvoices(prev => ({ ...prev, [id]: generateMockInvoices(id) }));
      setLedgers(prev => ({ ...prev, [id]: [] }));
      setSelectedId(id);
    }
    setShowEntityForm(false);
  };

  const deleteEntity = (id: string) => {
    setEntities(prev => prev.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
    setDeleteConfirm(null);
  };

  const savePricingRules = () => {
    if (!selectedId) return;
    const newRules: Record<string, PricingRule> = {};
    serviceTypes.forEach(st => {
      const rf = pricingRuleForm[st.id];
      if (rf && rf.value) newRules[st.id] = { type: rf.type, value: parseFloat(rf.value) || 0 };
    });
    setEntities(prev => prev.map(e => {
      if (e.id !== selectedId) return e;
      const updatedEntityServices = services.map(s => {
        const existing = e.entityServices.find(es => es.serviceId === s.id);
        if (existing?.overridden) return existing;
        const rule = newRules[s.serviceTypeId];
        return { serviceId: s.id, price: computeAdjustedPrice(s.basePrice, rule), overridden: false };
      });
      return { ...e, pricingRules: newRules, entityServices: updatedEntityServices };
    }));
  };

  const updateServicePrice = (serviceId: string, price: string) => {
    if (!selectedId) return;
    setEntities(prev => prev.map(e => {
      if (e.id !== selectedId) return e;
      const exists = e.entityServices.find(es => es.serviceId === serviceId);
      const p = parseFloat(price) || 0;
      if (exists) return { ...e, entityServices: e.entityServices.map(es => es.serviceId === serviceId ? { ...es, price: p, overridden: true } : es) };
      return { ...e, entityServices: [...e.entityServices, { serviceId, price: p, overridden: true }] };
    }));
  };

  const applyBulkRule = () => {
    if (!selectedId || !bulkRule.value) return;
    const ruleVal = parseFloat(bulkRule.value);
    if (isNaN(ruleVal)) return;
    setEntities(prev => prev.map(e => {
      if (e.id !== selectedId) return e;
      const updatedEntityServices = buildEntityServices(e).map(es => {
        const svc = services.find(s => s.id === es.serviceId);
        if (!svc) return es;
        if (bulkRule.scope !== "all" && svc.serviceTypeId !== bulkRule.scope) return es;
        const newPrice = bulkRule.type === "percentage" ? Math.round(es.price * (1 + ruleVal / 100)) : Math.round(es.price + ruleVal);
        return { ...es, price: Math.max(0, newPrice), overridden: true };
      });
      return { ...e, entityServices: updatedEntityServices };
    }));
    setShowBulkDialog(false);
    setBulkRule({ scope: "all", type: "percentage", value: "" });
  };

  const filteredEntities = entities.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
  const entityServiceMap = useMemo(() => {
    if (!selectedEntity) return {};
    const esMap: Record<string, number> = {};
    buildEntityServices(selectedEntity).forEach(es => { esMap[es.serviceId] = es.price; });
    return esMap;
  }, [selectedEntity, services]);
  const groupedServices = useMemo(() => serviceTypes.map(st => ({ st, svcs: services.filter(s => s.serviceTypeId === st.id && s.active) })).filter(g => g.svcs.length > 0), [serviceTypes, services]);

  const initPricingForm = (entity: BillingEntity) => {
    const init: Record<string, { type: "percentage" | "fixed"; value: string }> = {};
    serviceTypes.forEach(st => { const rule = entity.pricingRules[st.id]; init[st.id] = { type: rule?.type ?? "percentage", value: rule ? String(rule.value) : "" }; });
    setPricingRuleForm(init);
  };

  // ── Advance Payment ──
  const addAdvancePayment = () => {
    if (!selectedId || !advanceForm.amount) return;
    const amt = parseFloat(advanceForm.amount);
    if (isNaN(amt) || amt <= 0) return;
    const ref = `ADV-${Date.now()}`;
    setLedgers(prev => {
      const existing = prev[selectedId] ?? [];
      const newEntry: LedgerEntry = { id: ref, date: advanceForm.date, type: "advance", amount: amt, taxDeducted: 0, balance: 0, remarks: advanceForm.remarks, reference: ref };
      const updated = rebuildBalances([...existing, newEntry]);
      return { ...prev, [selectedId]: updated };
    });
    setAdvanceForm({ amount: "", remarks: "", date: today() });
    setShowAdvanceDialog(false);
  };

  // ── Payment Processing ──
  const openPaymentDialog = () => {
    if (selectedInvoiceIds.size === 0) return;
    setPaymentForm({ receivedAmount: "", taxMode: "transaction", taxAmount: "", taxRate: "", paymentMethod: "", transactionRef: `TXN-${Date.now().toString().slice(-6)}`, date: today() });
    setShowPaymentDialog(true);
  };

  const processPayment = () => {
    if (!selectedId || !paymentForm.receivedAmount) return;
    const totalReceived = parseFloat(paymentForm.receivedAmount);
    if (isNaN(totalReceived) || totalReceived <= 0) return;

    // Get selected unpaid/partial invoices sorted by claim date
    const toSettle = currentInvoices.filter(inv => selectedInvoiceIds.has(inv.id) && inv.status !== "paid").sort((a, b) => a.claimDate.localeCompare(b.claimDate));

    let remaining = totalReceived;

    // Calculate total tax
    let totalTax = 0;
    if (paymentForm.taxMode === "transaction") {
      totalTax = paymentForm.taxAmount ? parseFloat(paymentForm.taxAmount) || 0 : (paymentForm.taxRate ? (totalReceived * parseFloat(paymentForm.taxRate)) / 100 : 0);
      remaining = totalReceived - totalTax;
    }

    const updatedInvoices = [...currentInvoices];

    toSettle.forEach(inv => {
      if (remaining <= 0) return;
      const idx = updatedInvoices.findIndex(i => i.id === inv.id);
      if (idx < 0) return;
      const outstanding = inv.totalAmount - inv.paidAmount;

      // Per-invoice tax
      let invTax = 0;
      if (paymentForm.taxMode === "per-invoice") {
        invTax = paymentForm.taxRate ? Math.round((Math.min(remaining, outstanding) * parseFloat(paymentForm.taxRate)) / 100) : 0;
        totalTax += invTax;
      }

      const payment = Math.min(remaining, outstanding);
      const newPaid = inv.paidAmount + payment;
      remaining -= payment;
      const newStatus: PatientInvoice["status"] = newPaid >= inv.totalAmount ? "paid" : newPaid > 0 ? "partial" : "unpaid";
      updatedInvoices[idx] = { ...updatedInvoices[idx], paidAmount: newPaid, status: newStatus, taxDeducted: updatedInvoices[idx].taxDeducted + invTax, paymentDate: paymentForm.date, reference: paymentForm.transactionRef };
    });

    setEntityInvoices(prev => ({ ...prev, [selectedId]: updatedInvoices }));

    // Add claim debit ledger entry
    const claimed = totalReceived - (remaining < 0 ? 0 : remaining < totalReceived ? remaining : 0);
    setLedgers(prev => {
      const existing = prev[selectedId] ?? [];
      const entries: LedgerEntry[] = [];
      entries.push({ id: paymentForm.transactionRef, date: paymentForm.date, type: "claim", amount: -(totalReceived), taxDeducted: totalTax, balance: 0, remarks: `Payment via ${paymentForm.paymentMethod || "—"} | ${toSettle.length} invoice(s) settled`, reference: paymentForm.transactionRef });
      if (totalTax > 0) {
        entries.push({ id: `${paymentForm.transactionRef}-tax`, date: paymentForm.date, type: "tax", amount: totalTax, taxDeducted: totalTax, balance: 0, remarks: "Tax deduction credit", reference: paymentForm.transactionRef });
      }
      const updated = rebuildBalances([...existing, ...entries]);
      return { ...prev, [selectedId]: updated };
    });

    setSelectedInvoiceIds(new Set());
    setShowPaymentDialog(false);
  };

  const pendingInvoicesCount = currentInvoices.filter(i => i.status !== "paid").length;
  const selectedPendingCount = [...selectedInvoiceIds].filter(id => {
    const inv = currentInvoices.find(i => i.id === id);
    return inv && inv.status !== "paid";
  }).length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: entity list ── */}
      <aside className="flex w-72 flex-none flex-col border-r border-slate-200 bg-white">
        <div className="flex-none border-b border-slate-100 p-4">
          <Button onClick={openAddEntity} className="w-full bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 mb-3">
            <Plus className="h-4 w-4" />Add {entityLabel}
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input placeholder={`Search ${entityLabel.toLowerCase()}s…`} value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredEntities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 px-4">
              <Building className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-xs text-center">{search ? "No results found" : `No ${entityLabel.toLowerCase()}s yet. Click "Add ${entityLabel}" to start.`}</p>
            </div>
          ) : filteredEntities.map(e => {
            const isSelected = selectedId === e.id;
            const invs = entityInvoices[e.id] ?? [];
            const pendingCount = invs.filter(i => i.status !== "paid").length;
            return (
              <button key={e.id} type="button"
                onClick={() => { setSelectedId(e.id); initPricingForm(e); setSelectedInvoiceIds(new Set()); }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${isSelected ? "bg-[#4982CF]/8 border-l-2 border-[#4982CF]" : "hover:bg-slate-50 border-l-2 border-transparent"}`}>
                <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-xs font-bold ${isSelected ? "bg-[#4982CF] text-white" : "bg-slate-100 text-slate-600"}`}>
                  {initials(e.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${isSelected ? "text-[#4982CF]" : "text-slate-700"}`}>{e.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-slate-400 truncate">{e.email || "No email"}</p>
                    {pendingCount > 0 && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-200 rounded px-1">{pendingCount} pending</span>}
                  </div>
                </div>
                {isSelected && <ChevronRight className="h-3.5 w-3.5 flex-none text-[#4982CF]" />}
              </button>
            );
          })}
        </div>
        <div className="flex-none border-t border-slate-100 px-4 py-2.5">
          <p className="text-[10px] text-slate-400">{entities.length} {entityLabel.toLowerCase()}{entities.length !== 1 ? "s" : ""}</p>
        </div>
      </aside>

      {/* ── Right: entity detail ── */}
      <div className="flex-1 overflow-hidden bg-slate-50/50">
        {!selectedEntity ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-400">
            <Building className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-semibold text-slate-500">Select a {entityLabel.toLowerCase()}</p>
            <p className="mt-1 text-sm">Choose from the list to view and configure pricing.</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="flex h-full flex-col">
            {/* Header */}
            <div className="flex-none border-b border-slate-200 bg-white px-6 pt-4 pb-0">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4982CF] text-sm font-bold text-white">{initials(selectedEntity.name)}</div>
                  <div>
                    <h2 className="font-bold text-slate-900">{selectedEntity.name}</h2>
                    <p className="text-xs text-slate-500">{selectedEntity.email || selectedEntity.contactPerson || "—"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditEntity(selectedEntity)} className="gap-1.5"><Edit2 className="h-3.5 w-3.5" />Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(selectedEntity.id)} className="gap-1.5 text-rose-500 border-rose-200 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" />Delete</Button>
                </div>
              </div>
              <TabsList className="h-8 bg-transparent rounded-none border-b-0 gap-4 px-0 pb-0 overflow-x-auto w-full">
                {[
                  { value: "overview", label: "Overview" },
                  { value: "ledger", label: "Ledger" },
                  { value: "claims", label: `Claims${pendingInvoicesCount > 0 ? ` (${pendingInvoicesCount})` : ""}` },
                  { value: "info", label: "Info & Credit" },
                  { value: "rules", label: "Pricing Rules" },
                  { value: "services", label: "Service Prices" },
                ].map(t => (
                  <TabsTrigger key={t.value} value={t.value} className="h-8 flex-none rounded-none border-b-2 border-transparent data-[state=active]:border-[#4982CF] data-[state=active]:text-[#4982CF] text-xs px-0 mr-4">
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ── OVERVIEW TAB ── */}
            <TabsContent value="overview" className="flex-1 overflow-y-auto px-6 py-5 mt-0 space-y-5">
              {/* Stats cards */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Credit Limit" value={selectedEntity.creditEnabled ? `Rs. ${selectedEntity.creditLimit.toLocaleString()}` : "N/A"} icon={<WalletCards className="h-4 w-4" />} color="blue" />
                <StatCard
                  label="Advance Balance"
                  value={`Rs. ${Math.max(0, summary.ledgerBalance).toLocaleString()}`}
                  icon={<ArrowDownCircle className="h-4 w-4" />}
                  color={summary.ledgerBalance >= 0 ? "emerald" : "rose"}
                  sub={`Total paid: Rs. ${summary.totalAdvance.toLocaleString()}`}
                />
                <StatCard
                  label="Unclaimed (Invoices)"
                  value={`Rs. ${summary.invoicePending.toLocaleString()}`}
                  icon={<TrendingUp className="h-4 w-4" />}
                  color="amber"
                  sub={summary.advanceCovered > 0 ? `Rs. ${summary.advanceCovered.toLocaleString()} covered by advance` : "No advance cover"}
                />
                <StatCard
                  label="Pending Receivable"
                  value={`Rs. ${summary.trueReceivable.toLocaleString()}`}
                  icon={<TrendingDown className="h-4 w-4" />}
                  color={summary.trueReceivable > 0 ? "rose" : "emerald"}
                  sub={summary.trueReceivable === 0 ? "Fully covered by advance" : "Exceeds advance — collect separately"}
                />
              </div>

              {/* Credit utilization bar */}
              {selectedEntity.creditEnabled && selectedEntity.creditLimit > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-600">Credit Utilization</p>
                    <span className="text-xs text-slate-400">{Math.min(100, Math.round((summary.totalConsumed / selectedEntity.creditLimit) * 100))}% used</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${summary.totalConsumed / selectedEntity.creditLimit > 0.85 ? "bg-rose-500" : summary.totalConsumed / selectedEntity.creditLimit > 0.6 ? "bg-amber-400" : "bg-[#4982CF]"}`}
                      style={{ width: `${Math.min(100, (summary.totalConsumed / selectedEntity.creditLimit) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
                    <span>Rs. {summary.totalConsumed.toLocaleString()} consumed</span>
                    <span>Limit: Rs. {selectedEntity.creditLimit.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Patient-level pending */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-2.5">
                  <span className="font-bold text-slate-800">Patient Pending Summary</span>
                  <span className="text-xs text-slate-400">{patientSummary.length} patients</span>
                </div>
                <div className="grid grid-cols-[1fr_1fr_1fr_1fr_100px] items-center border-b border-slate-100 bg-slate-50/40 px-5 py-2">
                  {["Patient", "Services", "Total Amount", "Pending", "Status"].map(h => (
                    <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
                  ))}
                </div>
                {patientSummary.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400">No patient invoices found.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {patientSummary.map(ps => {
                      const pending = ps.total - ps.paid;
                      const status: PatientInvoice["status"] = pending <= 0 ? "paid" : ps.paid > 0 ? "partial" : "unpaid";
                      return (
                        <div key={ps.mrn} className="grid grid-cols-[1fr_1fr_1fr_1fr_100px] items-center px-5 py-3 hover:bg-slate-50/60 transition-colors">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{ps.name}</p>
                            <p className="text-[10px] text-slate-400">{ps.mrn}</p>
                          </div>
                          <span className="text-xs text-slate-500">{ps.invoices} invoice{ps.invoices !== 1 ? "s" : ""}</span>
                          <span className="text-sm font-semibold text-slate-700">Rs. {ps.total.toLocaleString()}</span>
                          <span className={`text-sm font-bold ${pending > 0 ? "text-rose-500" : "text-emerald-600"}`}>
                            Rs. {Math.max(0, pending).toLocaleString()}
                          </span>
                          <StatusBadge status={status} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── LEDGER TAB ── */}
            <TabsContent value="ledger" className="flex-1 overflow-y-auto px-6 py-5 mt-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Financial Ledger</p>
                  <p className="text-xs text-slate-400">Running balance of all transactions for this {entityLabel.toLowerCase()}.</p>
                </div>
                <Button onClick={() => { setAdvanceForm({ amount: "", remarks: "", date: today() }); setShowAdvanceDialog(true); }}
                  className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 h-8 text-xs">
                  <Plus className="h-3.5 w-3.5" />Add Advance Payment
                </Button>
              </div>

              {/* Running balance chip */}
              {currentLedger.length > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 w-fit">
                  <span className="text-xs text-slate-500">Current Balance:</span>
                  <span className={`font-bold text-base ${(currentLedger[currentLedger.length - 1]?.balance ?? 0) >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    Rs. {(currentLedger[currentLedger.length - 1]?.balance ?? 0).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="grid items-center border-b border-slate-100 bg-slate-50/80 px-5 py-2.5"
                  style={{ gridTemplateColumns: "110px 130px 1fr 1fr 1fr 1fr 160px" }}>
                  {["Date", "Type", "Amount", "Tax Deducted", "Balance", "Reference", "Remarks"].map(h => (
                    <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
                  ))}
                </div>
                {currentLedger.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                    <ClipboardList className="mb-3 h-8 w-8 opacity-30" />
                    <p className="text-sm font-medium text-slate-500">No transactions yet</p>
                    <p className="text-xs mt-1">Add an advance payment or process a claim to create ledger entries.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {[...currentLedger].reverse().map(entry => (
                      <div key={entry.id} className="grid items-center px-5 py-3 hover:bg-slate-50/60 transition-colors"
                        style={{ gridTemplateColumns: "110px 130px 1fr 1fr 1fr 1fr 160px" }}>
                        <span className="text-xs text-slate-500">{fmtDate(entry.date)}</span>
                        <div>
                          {entry.type === "advance" && <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[9px]"><ArrowDownCircle className="h-2.5 w-2.5 mr-1" />Advance</Badge>}
                          {entry.type === "claim" && <Badge className="bg-rose-500/10 text-rose-700 border-rose-200 text-[9px]"><Receipt className="h-2.5 w-2.5 mr-1" />Claim Debit</Badge>}
                          {entry.type === "tax" && <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 text-[9px]">Tax Credit</Badge>}
                        </div>
                        <span className={`text-sm font-bold ${entry.amount > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {entry.amount > 0 ? "+" : ""}Rs. {Math.abs(entry.amount).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500">{entry.taxDeducted > 0 ? `Rs. ${entry.taxDeducted.toLocaleString()}` : "—"}</span>
                        <span className={`text-sm font-bold ${entry.balance >= 0 ? "text-slate-700" : "text-rose-500"}`}>
                          Rs. {entry.balance.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{entry.reference}</span>
                        <span className="text-xs text-slate-500 truncate">{entry.remarks || "—"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── CLAIMS TAB ── */}
            <TabsContent value="claims" className="flex-1 overflow-hidden flex flex-col px-6 py-5 mt-0 gap-4">
              {/* Toolbar */}
              <div className="flex-none flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input placeholder="Search patient, MRN…" value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} className="h-8 pl-8 text-xs" />
                </div>
                <Select value={invoiceStatusFilter} onValueChange={v => setInvoiceStatusFilter(v as typeof invoiceStatusFilter)}>
                  <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
                {selectedPendingCount > 0 && (
                  <Button onClick={openPaymentDialog} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 h-8 text-xs ml-auto">
                    <CreditCard className="h-3.5 w-3.5" />
                    Process Payment ({selectedPendingCount} selected)
                  </Button>
                )}
              </div>

              {/* Summary chips */}
              <div className="flex-none flex gap-3 flex-wrap">
                {(["unpaid", "partial", "paid"] as const).map(s => {
                  const count = currentInvoices.filter(i => i.status === s).length;
                  const total = currentInvoices.filter(i => i.status === s).reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0);
                  return (
                    <button key={s} type="button" onClick={() => setInvoiceStatusFilter(invoiceStatusFilter === s ? "all" : s)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${invoiceStatusFilter === s ? "border-[#4982CF] bg-[#4982CF]/5" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                      <StatusBadge status={s} />
                      <span className="font-semibold text-slate-700">{count}</span>
                      {s !== "paid" && <span className="text-slate-400">· Rs. {total.toLocaleString()} pending</span>}
                    </button>
                  );
                })}
              </div>

              {/* Invoices table */}
              <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="grid items-center border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 sticky top-0"
                  style={{ gridTemplateColumns: "28px 1.5fr 100px 1fr 1fr 1fr 1fr 110px 120px" }}>
                  <Checkbox
                    checked={filteredInvoices.filter(i => i.status !== "paid").length > 0 && filteredInvoices.filter(i => i.status !== "paid").every(i => selectedInvoiceIds.has(i.id))}
                    onCheckedChange={v => {
                      if (v) setSelectedInvoiceIds(prev => { const n = new Set(prev); filteredInvoices.filter(i => i.status !== "paid").forEach(i => n.add(i.id)); return n; });
                      else setSelectedInvoiceIds(prev => { const n = new Set(prev); filteredInvoices.forEach(i => n.delete(i.id)); return n; });
                    }}
                    className="data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
                  />
                  {["Patient", "MRN", "Services", "Claim Date", "Total", "Paid", "Pending", "Tax", "Status"].map(h => (
                    <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
                  ))}
                </div>
                {filteredInvoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                    <Receipt className="mb-3 h-8 w-8 opacity-30" />
                    <p className="text-sm text-slate-500">No invoices found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredInvoices.map(inv => {
                      const pending = inv.totalAmount - inv.paidAmount;
                      const isChecked = selectedInvoiceIds.has(inv.id);
                      return (
                        <div key={inv.id} className={`grid items-center gap-2 px-4 py-3 transition-colors cursor-pointer ${isChecked ? "bg-[#4982CF]/4" : "hover:bg-slate-50/60"}`}
                          style={{ gridTemplateColumns: "28px 1.5fr 100px 1fr 1fr 1fr 1fr 110px 120px" }}
                          onClick={() => {
                            if (inv.status === "paid") return;
                            setSelectedInvoiceIds(prev => { const n = new Set(prev); n.has(inv.id) ? n.delete(inv.id) : n.add(inv.id); return n; });
                          }}>
                          <Checkbox
                            checked={isChecked}
                            disabled={inv.status === "paid"}
                            onCheckedChange={v => { setSelectedInvoiceIds(prev => { const n = new Set(prev); v ? n.add(inv.id) : n.delete(inv.id); return n; }); }}
                            className="data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
                            onClick={e => e.stopPropagation()}
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{inv.patientName}</p>
                            <p className="text-[10px] text-slate-400">{fmtDate(inv.serviceDate)}</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{inv.mrn}</span>
                          <span className="text-[10px] text-slate-500 leading-tight">{inv.services.join(", ")}</span>
                          <span className="text-[10px] text-slate-500">{fmtDate(inv.claimDate)}</span>
                          <span className="text-sm font-semibold text-slate-700">Rs. {inv.totalAmount.toLocaleString()}</span>
                          <span className="text-sm font-semibold text-emerald-600">Rs. {inv.paidAmount.toLocaleString()}</span>
                          <span className={`text-sm font-bold ${pending > 0 ? "text-rose-500" : "text-slate-300"}`}>Rs. {pending.toLocaleString()}</span>
                          <span className="text-xs text-slate-400">{inv.taxDeducted > 0 ? `Rs. ${inv.taxDeducted}` : "—"}</span>
                          <StatusBadge status={inv.status} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── INFO TAB (existing) ── */}
            <TabsContent value="info" className="flex-1 overflow-y-auto px-6 py-5 mt-0">
              <div className="max-w-xl space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Contact Person" value={selectedEntity.contactPerson || "—"} />
                  <InfoField label="Phone" value={selectedEntity.contactPhone || "—"} />
                  <InfoField label="Email" value={selectedEntity.email || "—"} />
                  <InfoField label="MOU Document" value={selectedEntity.mouFileName || "Not uploaded"} />
                </div>
                <Separator />
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <p className="text-sm font-bold text-slate-700">Credit Settings</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Credit Allowance</span>
                    <Badge className={selectedEntity.creditEnabled ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}>
                      {selectedEntity.creditEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  {selectedEntity.creditEnabled && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Credit Limit</span>
                      <span className="font-bold text-slate-800">Rs. {selectedEntity.creditLimit.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">New services pricing</span>
                    <span className="text-sm font-semibold text-[#4982CF]">{selectedEntity.useBaseForNew ? "Use Base Price" : "Use Adjusted Price"}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── PRICING RULES TAB (existing) ── */}
            <TabsContent value="rules" className="flex-1 overflow-y-auto px-6 py-5 mt-0">
              <div className="max-w-2xl space-y-4">
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                  <Info className="mt-0.5 h-4 w-4 flex-none text-blue-500" />
                  <p className="text-xs text-blue-700">Set pricing adjustments per service type. Save rules to update all non-overridden service prices.</p>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="grid grid-cols-[1fr_120px_1fr_100px] items-center border-b border-slate-100 bg-slate-50/80 px-5 py-2.5">
                    {["Service Type", "Adjustment", "Amount", ""].map(h => <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>)}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {serviceTypes.map(st => {
                      const rf = pricingRuleForm[st.id] ?? { type: "percentage", value: "" };
                      return (
                        <div key={st.id} className="grid grid-cols-[1fr_120px_1fr_100px] items-center px-5 py-3 gap-3">
                          <span className="text-sm font-semibold text-slate-700">{st.name}</span>
                          <div className="flex overflow-hidden rounded-md border border-slate-200">
                            {(["percentage", "fixed"] as const).map(t => (
                              <button key={t} type="button" onClick={() => setPricingRuleForm(prev => ({ ...prev, [st.id]: { ...rf, type: t } }))}
                                className={`flex-1 px-2 py-1.5 text-[11px] font-bold transition-colors ${rf.type === t ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                                {t === "percentage" ? "%" : "Rs."}
                              </button>
                            ))}
                          </div>
                          <Input type="number" min={0} placeholder={rf.type === "percentage" ? "e.g. 10" : "e.g. 500"} value={rf.value}
                            onChange={e => setPricingRuleForm(prev => ({ ...prev, [st.id]: { ...rf, value: e.target.value } }))} className="h-8 text-sm" />
                          {rf.value && <span className="text-[10px] text-slate-400">Increase by {rf.type === "percentage" ? `${rf.value}%` : `Rs. ${rf.value}`}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <Button onClick={savePricingRules} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white">Save Pricing Rules & Recalculate</Button>
              </div>
            </TabsContent>

            {/* ── SERVICE PRICES TAB (existing) ── */}
            <TabsContent value="services" className="flex-1 overflow-y-auto px-6 py-5 mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{services.length} services loaded · Edit prices individually or use bulk update.</p>
                  <Button variant="outline" size="sm" onClick={() => { setBulkRule({ scope: "all", type: "percentage", value: "" }); setShowBulkDialog(true); }}
                    className="gap-1.5 border-[#4982CF]/30 text-[#4982CF] hover:bg-[#4982CF]/5" disabled={services.length === 0}>
                    <CreditCard className="h-3.5 w-3.5" />Change Price (Bulk)
                  </Button>
                </div>
                {services.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-14 text-slate-400">
                    <p className="text-sm">No services in system yet. Add services in Service Pricing first.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedServices.map(({ st, svcs }) => (
                      <div key={st.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-2.5">
                          <span className="font-bold text-slate-800">{st.name}</span>
                          <span className="text-xs text-slate-400">{svcs.length} service{svcs.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="grid grid-cols-[2fr_1fr_1fr] items-center border-b border-slate-100 bg-slate-50/40 px-5 py-2">
                          {["Service", "Base Price", `${entityLabel} Price`].map(h => <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>)}
                        </div>
                        <div className="divide-y divide-slate-100">
                          {svcs.map(s => {
                            const entityPrice = entityServiceMap[s.id] ?? s.basePrice;
                            const diff = entityPrice - s.basePrice;
                            return (
                              <div key={s.id} className="grid grid-cols-[2fr_1fr_1fr] items-center px-5 py-3 hover:bg-slate-50/60 transition-colors gap-3">
                                <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                                <span className="text-sm text-slate-500">Rs. {s.basePrice.toLocaleString()}</span>
                                <div>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">Rs.</span>
                                    <Input type="number" min={0} value={entityPrice} onChange={e => updateServicePrice(s.id, e.target.value)} className="h-8 pl-8 text-sm" />
                                  </div>
                                  {diff !== 0 && <span className={`text-[10px] font-medium ${diff > 0 ? "text-emerald-600" : "text-rose-500"}`}>{diff > 0 ? "+" : ""}Rs. {diff.toLocaleString()} from base</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* ── Add/Edit Entity Dialog ── */}
      <Dialog open={showEntityForm} onOpenChange={open => !open && setShowEntityForm(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingEntityId ? `Edit ${entityLabel}` : `Add ${entityLabel}`}</DialogTitle></DialogHeader>
          <div className="grid gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">{entityLabel} Name <span className="text-rose-500">*</span></Label>
              <Input placeholder={`${entityLabel} name…`} value={entityForm.name} onChange={e => setEntityForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-600">Contact Person</Label>
                <Input placeholder="Full name" value={entityForm.contactPerson} onChange={e => setEntityForm(f => ({ ...f, contactPerson: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-600">Phone</Label>
                <Input placeholder="+92 300…" value={entityForm.contactPhone} onChange={e => setEntityForm(f => ({ ...f, contactPhone: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Official Email</Label>
              <Input type="email" placeholder="contact@company.com" value={entityForm.email} onChange={e => setEntityForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Upload MOU (PDF)</Label>
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-500 hover:border-[#4982CF]/50 hover:bg-[#4982CF]/5 transition-colors">
                  <Upload className="h-4 w-4 text-slate-400" />
                  {entityForm.mouFileName || "Choose PDF file…"}
                  <input type="file" accept=".pdf" className="hidden" onChange={e => setEntityForm(f => ({ ...f, mouFileName: e.target.files?.[0]?.name ?? "" }))} />
                </label>
                {entityForm.mouFileName && <button type="button" onClick={() => setEntityForm(f => ({ ...f, mouFileName: "" }))} className="text-slate-400 hover:text-rose-500"><X className="h-4 w-4" /></button>}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-slate-700">Credit Allowance</Label>
                <Switch checked={entityForm.creditEnabled} onCheckedChange={v => setEntityForm(f => ({ ...f, creditEnabled: v }))} className="data-[state=checked]:bg-[#4982CF]" />
              </div>
              {entityForm.creditEnabled && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Credit Limit (Rs.)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">Rs.</span>
                    <Input type="number" min={0} placeholder="0" value={entityForm.creditLimit} onChange={e => setEntityForm(f => ({ ...f, creditLimit: e.target.value }))} className="pl-10" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">New services pricing</p>
                <p className="text-xs text-slate-400">When new services are added to the system</p>
              </div>
              <div className="flex overflow-hidden rounded-md border border-slate-200">
                {(["Base", "Adjusted"] as const).map((label, i) => (
                  <button key={label} type="button" onClick={() => setEntityForm(f => ({ ...f, useBaseForNew: i === 0 }))}
                    className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors ${(i === 0) === entityForm.useBaseForNew ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowEntityForm(false)}>Cancel</Button>
              <Button onClick={saveEntityForm} disabled={!entityForm.name.trim()} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white">
                {editingEntityId ? "Save Changes" : `Add ${entityLabel}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Price Dialog (existing) ── */}
      <Dialog open={showBulkDialog} onOpenChange={open => !open && setShowBulkDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Bulk Price Change</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Apply To</Label>
              <Select value={bulkRule.scope} onValueChange={v => setBulkRule(r => ({ ...r, scope: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Service Types</SelectItem>
                  {serviceTypes.map(st => <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Increase By</Label>
              <div className="flex gap-2 items-center">
                <div className="flex overflow-hidden rounded-md border border-slate-200">
                  {(["percentage", "fixed"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setBulkRule(r => ({ ...r, type: t }))}
                      className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${bulkRule.type === t ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                      {t === "percentage" ? "%" : "Rs."}
                    </button>
                  ))}
                </div>
                <Input type="number" min={0} placeholder="Amount" value={bulkRule.value} onChange={e => setBulkRule(r => ({ ...r, value: e.target.value }))} className="flex-1 h-8" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
              <Button onClick={applyBulkRule} disabled={!bulkRule.value} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white">Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Advance Payment Dialog ── */}
      <Dialog open={showAdvanceDialog} onOpenChange={open => !open && setShowAdvanceDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Advance Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Amount (Rs.) <span className="text-rose-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">Rs.</span>
                <Input type="number" min={0} placeholder="0" value={advanceForm.amount} onChange={e => setAdvanceForm(f => ({ ...f, amount: e.target.value }))} className="pl-10" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Date</Label>
              <Input type="date" value={advanceForm.date} onChange={e => setAdvanceForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Remarks / Notes</Label>
              <Input placeholder="e.g. Cheque #1234, Monthly advance…" value={advanceForm.remarks} onChange={e => setAdvanceForm(f => ({ ...f, remarks: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowAdvanceDialog(false)}>Cancel</Button>
              <Button onClick={addAdvancePayment} disabled={!advanceForm.amount} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white">Add Payment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Process Payment Dialog ── */}
      <Dialog open={showPaymentDialog} onOpenChange={open => !open && setShowPaymentDialog(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Process Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Selected invoices summary */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-slate-600">Settling {selectedPendingCount} invoice(s):</p>
              {currentInvoices.filter(i => selectedInvoiceIds.has(i.id) && i.status !== "paid").map(inv => (
                <div key={inv.id} className="flex justify-between text-xs">
                  <span className="text-slate-600">{inv.patientName} ({inv.mrn})</span>
                  <span className="font-semibold text-rose-600">Rs. {(inv.totalAmount - inv.paidAmount).toLocaleString()} pending</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-xs font-bold">
                <span>Total Pending</span>
                <span className="text-rose-600">
                  Rs. {currentInvoices.filter(i => selectedInvoiceIds.has(i.id) && i.status !== "paid").reduce((s, i) => s + i.totalAmount - i.paidAmount, 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Amount Received (Rs.) <span className="text-rose-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">Rs.</span>
                <Input type="number" min={0} placeholder="0" value={paymentForm.receivedAmount} onChange={e => setPaymentForm(f => ({ ...f, receivedAmount: e.target.value }))} className="pl-10" />
              </div>
            </div>

            {/* Tax handling */}
            <div className="rounded-lg border border-slate-200 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">Tax Deduction</p>
                <div className="flex overflow-hidden rounded border border-slate-200">
                  {(["transaction", "per-invoice"] as const).map(m => (
                    <button key={m} type="button" onClick={() => setPaymentForm(f => ({ ...f, taxMode: m }))}
                      className={`px-2.5 py-1 text-[10px] font-bold transition-colors ${paymentForm.taxMode === m ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                      {m === "transaction" ? "Per Transaction" : "Per Invoice"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <Label className="text-[10px] text-slate-500">Tax Amount (Rs.)</Label>
                  <Input type="number" min={0} placeholder="0" value={paymentForm.taxAmount} onChange={e => setPaymentForm(f => ({ ...f, taxAmount: e.target.value, taxRate: "" }))} className="h-8 text-xs" />
                </div>
                <div className="flex items-end pb-0.5 text-xs text-slate-400">OR</div>
                <div className="flex-1 flex flex-col gap-1">
                  <Label className="text-[10px] text-slate-500">Tax Rate (%)</Label>
                  <Input type="number" min={0} max={100} placeholder="e.g. 7" value={paymentForm.taxRate} onChange={e => setPaymentForm(f => ({ ...f, taxRate: e.target.value, taxAmount: "" }))} className="h-8 text-xs" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-600">Payment Method</Label>
                <Select value={paymentForm.paymentMethod} onValueChange={v => setPaymentForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {["Bank Transfer", "Cheque", "Cash", "Online Transfer", "Draft"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-600">Transaction / Instrument #</Label>
                <Input placeholder="e.g. CHQ-1234" value={paymentForm.transactionRef} onChange={e => setPaymentForm(f => ({ ...f, transactionRef: e.target.value }))} className="h-8 text-xs" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Payment Date</Label>
              <Input type="date" value={paymentForm.date} onChange={e => setPaymentForm(f => ({ ...f, date: e.target.value }))} className="h-8 text-xs" />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
              <Button onClick={processPayment} disabled={!paymentForm.receivedAmount} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white">
                Process Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete {entityLabel}?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600"><strong>{entities.find(e => e.id === deleteConfirm)?.name}</strong> and all their pricing configurations will be removed.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button onClick={() => deleteEntity(deleteConfirm!)} className="bg-rose-500 hover:bg-rose-600 text-white">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, sub }: { label: string; value: string; icon: React.ReactNode; color: "blue" | "emerald" | "amber" | "rose"; sub?: string }) {
  const colors = {
    blue: "bg-[#4982CF]/8 text-[#4982CF]",
    emerald: "bg-emerald-500/8 text-emerald-600",
    amber: "bg-amber-500/8 text-amber-600",
    rose: "bg-rose-500/8 text-rose-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <div className={`rounded-lg p-1.5 ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1 leading-tight">{sub}</p>}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}
