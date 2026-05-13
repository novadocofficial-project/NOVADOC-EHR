import { useState, useMemo, useEffect } from "react";
import {
  Plus, Search, Edit2, Trash2, Package,
  ChevronRight, ChevronLeft, Check, X, Info, Layers, Tag,
  Percent, DollarSign, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Service, ServiceType } from "@/pages/BillingTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

type PackageService = { serviceId: string; quantity: number };

type Bundle = {
  id: string;
  name: string;
  description: string;
  packageType: "fixed" | "recurring";
  active: boolean;
  services: PackageService[];
  pricingModel: "manual" | "auto";
  manualPrice: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  validityDays: string;
  usageLimit: string;
  createdAt: string;
};

type Step = 1 | 2 | 3;

const BLANK: Omit<Bundle, "id" | "createdAt"> = {
  name: "", description: "", packageType: "fixed", active: true,
  services: [], pricingModel: "auto", manualPrice: "",
  discountType: "percentage", discountValue: "", validityDays: "", usageLimit: "",
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_BUNDLES: Bundle[] = [
  {
    id: "pkg-1", name: "Executive Health Check-up",
    description: "Comprehensive annual screening for corporate executives — labs, imaging, and specialist consultation.",
    packageType: "fixed", active: true,
    services: [
      { serviceId: "svc-1",  quantity: 1 },
      { serviceId: "svc-10", quantity: 1 },
      { serviceId: "svc-11", quantity: 1 },
      { serviceId: "svc-13", quantity: 1 },
      { serviceId: "svc-14", quantity: 1 },
      { serviceId: "svc-15", quantity: 1 },
      { serviceId: "svc-31", quantity: 1 },
      { serviceId: "svc-33", quantity: 1 },
    ],
    pricingModel: "manual", manualPrice: "8500",
    discountType: "percentage", discountValue: "",
    validityDays: "365", usageLimit: "1",
    createdAt: "2024-03-01T00:00:00.000Z",
  },
  {
    id: "pkg-2", name: "Diabetes Care Bundle",
    description: "Quarterly monitoring for diabetic patients — labs, consultation, and follow-up visits.",
    packageType: "recurring", active: true,
    services: [
      { serviceId: "svc-3",  quantity: 2 },
      { serviceId: "svc-12", quantity: 3 },
      { serviceId: "svc-14", quantity: 1 },
      { serviceId: "svc-18", quantity: 1 },
    ],
    pricingModel: "auto", discountType: "percentage", discountValue: "15", manualPrice: "",
    validityDays: "90", usageLimit: "4",
    createdAt: "2024-04-15T00:00:00.000Z",
  },
  {
    id: "pkg-3", name: "Maternity Screening Package",
    description: "Pre-natal ultrasound, CBC, and thyroid screening for expectant mothers.",
    packageType: "fixed", active: false,
    services: [
      { serviceId: "svc-1",  quantity: 1 },
      { serviceId: "svc-10", quantity: 2 },
      { serviceId: "svc-13", quantity: 1 },
      { serviceId: "svc-33", quantity: 2 },
    ],
    pricingModel: "auto", discountType: "fixed", discountValue: "500", manualPrice: "",
    validityDays: "180", usageLimit: "0",
    createdAt: "2024-05-10T00:00:00.000Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

function calcPricing(bundle: Omit<Bundle, "id" | "createdAt"> | Bundle, services: Service[]) {
  const baseTotal = bundle.services.reduce((s, ps) => {
    const svc = services.find(sv => sv.id === ps.serviceId);
    return s + (svc ? svc.basePrice * ps.quantity : 0);
  }, 0);
  if (bundle.pricingModel === "manual") {
    const manual = parseFloat(bundle.manualPrice) || 0;
    return { baseTotal, discount: Math.max(0, baseTotal - manual), finalPrice: manual };
  }
  const dv = parseFloat(bundle.discountValue) || 0;
  const discount = bundle.discountType === "percentage" ? Math.round((baseTotal * dv) / 100) : dv;
  return { baseTotal, discount, finalPrice: Math.max(0, baseTotal - discount) };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepDot({ current, step, label }: { current: Step; step: Step; label: string }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex items-center gap-2">
      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
        ${done ? "bg-[#4982CF] border-[#4982CF] text-white" : active ? "border-[#4982CF] text-[#4982CF] bg-white" : "border-slate-200 text-slate-400 bg-white"}`}>
        {done ? <Check className="h-3.5 w-3.5" /> : step}
      </div>
      <span className={`text-xs font-semibold hidden sm:block ${active ? "text-slate-800" : done ? "text-[#4982CF]" : "text-slate-400"}`}>{label}</span>
    </div>
  );
}

function StepLine({ done }: { done: boolean }) {
  return <div className={`flex-1 h-px mx-1 transition-colors ${done ? "bg-[#4982CF]" : "bg-slate-200"}`} />;
}

function PriceBreakdown({ baseTotal, discount, finalPrice }: { baseTotal: number; discount: number; finalPrice: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Price Breakdown</p>
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Total Base Price</span>
        <span className="font-semibold text-slate-800">Rs. {baseTotal.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Discount</span>
        <span className={`font-semibold ${discount > 0 ? "text-emerald-600" : "text-slate-400"}`}>
          {discount > 0 ? `− Rs. ${discount.toLocaleString()}` : "—"}
        </span>
      </div>
      <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
        <span className="text-sm font-bold text-slate-800">Final Package Price</span>
        <span className="text-xl font-bold text-[#4982CF]">Rs. {finalPrice.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PACKAGES_KEY = "ehr-packages-v1";

export function PackagesModule({ services = [], serviceTypes = [] }: { services?: Service[]; serviceTypes?: ServiceType[] }) {
  const [bundles, setBundles] = useState<Bundle[]>(() => {
    try { const r = localStorage.getItem(PACKAGES_KEY); if (r) return JSON.parse(r) as Bundle[]; } catch { /**/ }
    return SEED_BUNDLES;
  });

  useEffect(() => {
    try { localStorage.setItem(PACKAGES_KEY, JSON.stringify(bundles)); } catch { /**/ }
  }, [bundles]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [mode, setMode] = useState<"list" | "create" | "edit" | "view">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<Omit<Bundle, "id" | "createdAt">>(BLANK);
  const [svcSearch, setSvcSearch] = useState("");
  const [svcTypeFilter, setSvcTypeFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Derived ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => bundles.filter(b => {
    const ms = !search || b.name.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "all" || (statusFilter === "active" ? b.active : !b.active);
    return ms && mf;
  }), [bundles, search, statusFilter]);

  const viewBundle = editingId ? bundles.find(b => b.id === editingId) ?? null : null;

  const availableServices = useMemo(() => services.filter(s => {
    const mt = svcTypeFilter === "all" || s.serviceTypeId === svcTypeFilter;
    const ms = !svcSearch || s.name.toLowerCase().includes(svcSearch.toLowerCase());
    return mt && ms;
  }), [services, svcSearch, svcTypeFilter]);

  const pricing = useMemo(() => calcPricing(form, services), [form, services]);
  const viewPricing = useMemo(() => viewBundle ? calcPricing(viewBundle, services) : null, [viewBundle, services]);

  const step1Valid = form.name.trim().length > 0;
  const step2Valid = form.services.length > 0;
  const step3Valid = form.pricingModel === "auto" || parseFloat(form.manualPrice) > 0;

  const getSvc = (id: string) => services.find(s => s.id === id);
  const getTypeName = (id: string) => serviceTypes.find(st => st.id === id)?.name ?? "—";

  // ── Actions ───────────────────────────────────────────────────────────────

  function openCreate() {
    setForm(BLANK); setStep(1); setEditingId(null);
    setSvcSearch(""); setSvcTypeFilter("all"); setMode("create");
  }
  function openEdit(b: Bundle) {
    setForm({ name: b.name, description: b.description, packageType: b.packageType,
      active: b.active, services: b.services, pricingModel: b.pricingModel,
      manualPrice: b.manualPrice, discountType: b.discountType,
      discountValue: b.discountValue, validityDays: b.validityDays, usageLimit: b.usageLimit });
    setStep(1); setEditingId(b.id); setSvcSearch(""); setSvcTypeFilter("all"); setMode("edit");
  }
  function openView(b: Bundle) { setEditingId(b.id); setMode("view"); }
  function backToList() { setMode("list"); setEditingId(null); }

  function saveBundle() {
    if (mode === "edit" && editingId) {
      setBundles(p => p.map(b => b.id === editingId ? { ...b, ...form } : b));
    } else {
      setBundles(p => [...p, { ...form, id: `pkg-${Date.now()}`, createdAt: new Date().toISOString() }]);
    }
    backToList();
  }

  function toggleActive(id: string) {
    setBundles(p => p.map(b => b.id === id ? { ...b, active: !b.active } : b));
  }

  function deleteBundle(id: string) {
    setBundles(p => p.filter(b => b.id !== id));
    setDeleteId(null);
    if (editingId === id) backToList();
  }

  function toggleSvc(serviceId: string) {
    setForm(p => ({
      ...p,
      services: p.services.some(ps => ps.serviceId === serviceId)
        ? p.services.filter(ps => ps.serviceId !== serviceId)
        : [...p.services, { serviceId, quantity: 1 }],
    }));
  }

  function setQty(serviceId: string, qty: number) {
    setForm(p => ({ ...p, services: p.services.map(ps => ps.serviceId === serviceId ? { ...ps, quantity: Math.max(1, qty) } : ps) }));
  }

  function removeSvc(serviceId: string) {
    setForm(p => ({ ...p, services: p.services.filter(ps => ps.serviceId !== serviceId) }));
  }

  // ── List view ─────────────────────────────────────────────────────────────

  function renderList() {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Packages & Bundles</h2>
            <p className="text-xs text-slate-400 mt-0.5">Group services into priced bundles for patients and corporates.</p>
          </div>
          <Button onClick={openCreate} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 h-9 text-sm">
            <Plus className="h-4 w-4" />New Package
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-white">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search packages…" className="pl-8 h-8 text-sm" />
          </div>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(["all", "active", "inactive"] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors
                  ${statusFilter === f ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                {f}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} package{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Package className="h-10 w-10 opacity-20 mb-3" />
              <p className="text-sm font-medium text-slate-500">No packages found</p>
              <p className="text-xs mt-1">Create your first package to get started.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="grid border-b border-slate-100 bg-slate-50/80 px-5 py-2.5"
                style={{ gridTemplateColumns: "1fr 100px 130px 100px 110px 110px" }}>
                {["Package Name", "Services", "Final Price", "Type", "Status", "Created"].map(h => (
                  <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
                ))}
              </div>
              <div className="divide-y divide-slate-100">
                {filtered.map(bundle => {
                  const { finalPrice } = calcPricing(bundle, services);
                  return (
                    <div key={bundle.id}
                      className="grid items-center px-5 py-3.5 hover:bg-slate-50/70 cursor-pointer group transition-colors"
                      style={{ gridTemplateColumns: "1fr 100px 130px 100px 110px 110px" }}
                      onClick={() => openView(bundle)}>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-[#4982CF] transition-colors">{bundle.name}</p>
                        <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{bundle.description || "—"}</p>
                      </div>
                      <span className="text-sm text-slate-600">{bundle.services.length} svc{bundle.services.length !== 1 ? "s" : ""}</span>
                      <span className="text-sm font-semibold text-slate-800">Rs. {finalPrice.toLocaleString()}</span>
                      <Badge variant="outline" className={`text-[10px] w-fit ${bundle.packageType === "recurring" ? "border-purple-300 text-purple-600 bg-purple-50" : "border-blue-300 text-blue-600 bg-blue-50"}`}>
                        {bundle.packageType === "recurring" ? "Recurring" : "Fixed"}
                      </Badge>
                      <div className="flex items-center gap-1.5" onClick={e => { e.stopPropagation(); toggleActive(bundle.id); }}>
                        <Switch checked={bundle.active} className="data-[state=checked]:bg-emerald-500 scale-75 pointer-events-none" />
                        <span className={`text-xs font-medium ${bundle.active ? "text-emerald-600" : "text-slate-400"}`}>
                          {bundle.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{fmtDate(bundle.createdAt)}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEdit(bundle)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF]">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteId(bundle.id)} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Detail / View ─────────────────────────────────────────────────────────

  function renderView() {
    if (!viewBundle || !viewPricing) return null;
    const { baseTotal, discount, finalPrice } = viewPricing;
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
          <button onClick={backToList} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-800">{viewBundle.name}</h2>
              <Badge variant="outline" className={`text-[10px] ${viewBundle.packageType === "recurring" ? "border-purple-300 text-purple-600 bg-purple-50" : "border-blue-300 text-blue-600 bg-blue-50"}`}>
                {viewBundle.packageType === "recurring" ? "Recurring" : "Fixed"}
              </Badge>
              <Badge variant="outline" className={`text-[10px] ${viewBundle.active ? "border-emerald-300 text-emerald-600 bg-emerald-50" : "border-slate-200 text-slate-400 bg-slate-50"}`}>
                {viewBundle.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {viewBundle.description && <p className="text-xs text-slate-400 mt-0.5">{viewBundle.description}</p>}
          </div>
          <Button variant="outline" onClick={() => openEdit(viewBundle)} className="gap-2 h-8 text-xs">
            <Edit2 className="h-3.5 w-3.5" />Edit
          </Button>
          <button onClick={() => setDeleteId(viewBundle.id)} className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Services", value: `${viewBundle.services.length}`, icon: <Layers className="h-4 w-4" />, hi: false },
              { label: "Base Price", value: `Rs. ${baseTotal.toLocaleString()}`, icon: <Tag className="h-4 w-4" />, hi: false },
              { label: "Discount", value: discount > 0 ? `Rs. ${discount.toLocaleString()}` : "—", icon: <Percent className="h-4 w-4" />, hi: false },
              { label: "Final Price", value: `Rs. ${finalPrice.toLocaleString()}`, icon: <DollarSign className="h-4 w-4" />, hi: true },
            ].map(c => (
              <div key={c.label} className={`rounded-xl border p-4 shadow-sm ${c.hi ? "border-[#4982CF]/30 bg-[#4982CF]/5" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500 font-medium">{c.label}</p>
                  <div className={`rounded-lg p-1.5 ${c.hi ? "bg-[#4982CF]/10 text-[#4982CF]" : "bg-slate-100 text-slate-500"}`}>{c.icon}</div>
                </div>
                <p className={`text-xl font-bold ${c.hi ? "text-[#4982CF]" : "text-slate-800"}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Services table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Included Services</p>
            </div>
            <div className="grid border-b border-slate-100 bg-slate-50/40 px-5 py-2"
              style={{ gridTemplateColumns: "1fr 130px 70px 110px 120px" }}>
              {["Service Name", "Type", "Qty", "Unit Price", "Subtotal"].map(h => (
                <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {viewBundle.services.map(ps => {
                const svc = getSvc(ps.serviceId);
                if (!svc) return null;
                return (
                  <div key={ps.serviceId} className="grid items-center px-5 py-3" style={{ gridTemplateColumns: "1fr 130px 70px 110px 120px" }}>
                    <span className="text-sm font-medium text-slate-700">{svc.name}</span>
                    <span className="text-xs text-slate-500">{getTypeName(svc.serviceTypeId)}</span>
                    <span className="text-sm font-semibold text-slate-800">× {ps.quantity}</span>
                    <span className="text-sm text-slate-600">Rs. {svc.basePrice.toLocaleString()}</span>
                    <span className="text-sm font-semibold text-slate-800">Rs. {(svc.basePrice * ps.quantity).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rules + breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Usage Rules</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Usage Limit</span>
                <span className="font-semibold text-slate-800">
                  {viewBundle.usageLimit && viewBundle.usageLimit !== "0" ? `${viewBundle.usageLimit}×` : "Unlimited"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Validity</span>
                <span className="font-semibold text-slate-800">
                  {viewBundle.validityDays ? `${viewBundle.validityDays} days` : "No expiry"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pricing Model</span>
                <span className="font-semibold text-slate-800">
                  {viewBundle.pricingModel === "manual" ? "Fixed (manual)" : "Auto-calculated"}
                </span>
              </div>
            </div>
            <PriceBreakdown baseTotal={baseTotal} discount={discount} finalPrice={finalPrice} />
          </div>
        </div>
      </div>
    );
  }

  // ── Create / Edit form ────────────────────────────────────────────────────

  function renderForm() {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
          <button onClick={backToList} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold text-slate-800">{mode === "edit" ? "Edit Package" : "New Package"}</h2>
        </div>

        {/* Stepper */}
        <div className="flex items-center px-8 py-4 border-b border-slate-100 bg-white gap-2">
          <StepDot current={step} step={1} label="Basic Info" />
          <StepLine done={step > 1} />
          <StepDot current={step} step={2} label="Add Services" />
          <StepLine done={step > 2} />
          <StepDot current={step} step={3} label="Pricing" />
        </div>

        <div className="flex-1 overflow-hidden">
          {step === 1 && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-xl mx-auto px-6 py-8 space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Package Name <span className="text-rose-500">*</span></Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Executive Health Check-up" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of what this package includes…" className="text-sm resize-none" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">Package Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {([["fixed", "Fixed Package", "One-time or fixed-term bundle"], ["recurring", "Recurring Package", "Repeatable on a schedule"]] as const).map(([val, title, desc]) => (
                      <button key={val} type="button" onClick={() => setForm(p => ({ ...p, packageType: val }))}
                        className={`rounded-xl border-2 p-4 text-left transition-all ${form.packageType === val ? "border-[#4982CF] bg-[#4982CF]/5" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                        <p className={`text-sm font-bold ${form.packageType === val ? "text-[#4982CF]" : "text-slate-700"}`}>{title}</p>
                        <p className="text-xs text-slate-400 mt-1">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))}
                    className="data-[state=checked]:bg-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold text-slate-600">Active</p>
                    <p className="text-[11px] text-slate-400">Inactive packages won't be visible for billing.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex h-full">
              {/* Left — picker */}
              <div className="flex flex-col w-1/2 border-r border-slate-200 h-full">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 space-y-2">
                  <p className="text-xs font-bold text-slate-600">Available Services</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                      <Input value={svcSearch} onChange={e => setSvcSearch(e.target.value)} placeholder="Search…" className="pl-8 h-8 text-xs" />
                    </div>
                    <Select value={svcTypeFilter} onValueChange={setSvcTypeFilter}>
                      <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All types" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {serviceTypes.map(st => <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {availableServices.length === 0
                    ? <p className="text-xs text-slate-400 text-center py-12">No services found.</p>
                    : availableServices.map(svc => {
                        const sel = form.services.some(ps => ps.serviceId === svc.id);
                        return (
                          <button key={svc.id} type="button" onClick={() => toggleSvc(svc.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${sel ? "bg-[#4982CF]/5" : ""}`}>
                            <div className={`h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                              ${sel ? "border-[#4982CF] bg-[#4982CF]" : "border-slate-300"}`}>
                              {sel && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-700 truncate">{svc.name}</p>
                              <p className="text-[10px] text-slate-400">{getTypeName(svc.serviceTypeId)} · Rs. {svc.basePrice.toLocaleString()}</p>
                            </div>
                          </button>
                        );
                      })}
                </div>
              </div>

              {/* Right — selected with quantity */}
              <div className="flex flex-col w-1/2 h-full">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-600">Selected Services</p>
                  <span className="text-[10px] text-slate-400">{form.services.length} selected</span>
                </div>
                {form.services.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Layers className="h-7 w-7 opacity-20" />
                    <p className="text-xs">Select services from the left.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                      {form.services.map(ps => {
                        const svc = getSvc(ps.serviceId);
                        if (!svc) return null;
                        return (
                          <div key={ps.serviceId} className="flex items-center gap-3 px-4 py-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-700 truncate">{svc.name}</p>
                              <p className="text-[10px] text-slate-400">
                                Rs. {svc.basePrice.toLocaleString()} × {ps.quantity} = Rs. {(svc.basePrice * ps.quantity).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setQty(ps.serviceId, ps.quantity - 1)}
                                className="h-6 w-6 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center text-sm font-bold">−</button>
                              <span className="text-xs font-bold w-5 text-center">{ps.quantity}</span>
                              <button onClick={() => setQty(ps.serviceId, ps.quantity + 1)}
                                className="h-6 w-6 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center text-sm font-bold">+</button>
                            </div>
                            <button onClick={() => removeSvc(ps.serviceId)} className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-slate-200 px-4 py-3 bg-slate-50/50 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Base Total</span>
                      <span className="text-sm font-bold text-slate-800">Rs. {pricing.baseTotal.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-xl mx-auto px-6 py-8 space-y-6">
                {/* Pricing model */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">Pricing Model</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {([["auto", "Auto-Calculated", "Sum of services with optional discount"], ["manual", "Fixed Price", "Set the final price manually"]] as const).map(([val, title, desc]) => (
                      <button key={val} type="button" onClick={() => setForm(p => ({ ...p, pricingModel: val }))}
                        className={`rounded-xl border-2 p-4 text-left transition-all ${form.pricingModel === val ? "border-[#4982CF] bg-[#4982CF]/5" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                        <p className={`text-sm font-bold ${form.pricingModel === val ? "text-[#4982CF]" : "text-slate-700"}`}>{title}</p>
                        <p className="text-xs text-slate-400 mt-1">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {form.pricingModel === "manual" ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Fixed Package Price (Rs.) <span className="text-rose-500">*</span></Label>
                    <Input value={form.manualPrice} onChange={e => setForm(p => ({ ...p, manualPrice: e.target.value }))}
                      type="number" min="0" placeholder="e.g. 8500" className="h-9 text-sm" />
                    {pricing.baseTotal > 0 && (
                      <p className="text-xs text-slate-400">Base total is Rs. {pricing.baseTotal.toLocaleString()}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Discount (optional)</Label>
                    <div className="flex gap-2">
                      <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                        {([["percentage", "%"], ["fixed", "Rs."]] as const).map(([val, lbl]) => (
                          <button key={val} type="button" onClick={() => setForm(p => ({ ...p, discountType: val }))}
                            className={`px-3 py-2 text-xs font-bold transition-colors
                              ${form.discountType === val ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                      <Input value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                        type="number" min="0" placeholder={form.discountType === "percentage" ? "e.g. 15" : "e.g. 500"}
                        className="h-9 text-sm flex-1" />
                    </div>
                  </div>
                )}

                {/* Live breakdown */}
                <PriceBreakdown baseTotal={pricing.baseTotal} discount={pricing.discount} finalPrice={pricing.finalPrice} />

                {/* Validity & Usage */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Validity (days)</Label>
                    <Input value={form.validityDays} onChange={e => setForm(p => ({ ...p, validityDays: e.target.value }))}
                      type="number" min="0" placeholder="Leave blank for no expiry" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Usage Limit</Label>
                    <Input value={form.usageLimit} onChange={e => setForm(p => ({ ...p, usageLimit: e.target.value }))}
                      type="number" min="0" placeholder="0 = unlimited" className="h-9 text-sm" />
                  </div>
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
                  <Info className="h-4 w-4 text-[#4982CF] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Doctor share for each service in this package will be calculated using the <strong>existing service-level share rules</strong> configured under Fees &amp; Shares.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3">
          <Button variant="outline" onClick={() => step === 1 ? backToList() : setStep(s => (s - 1) as Step)} className="gap-2 h-9 text-sm">
            <ChevronLeft className="h-4 w-4" />{step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button disabled={step === 1 ? !step1Valid : !step2Valid}
              onClick={() => setStep(s => (s + 1) as Step)}
              className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 h-9 text-sm">
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={!step3Valid} onClick={saveBundle}
              className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 h-9 text-sm">
              <Check className="h-4 w-4" />{mode === "edit" ? "Save Changes" : "Create Package"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Root ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {mode === "list" && renderList()}
      {(mode === "create" || mode === "edit") && renderForm()}
      {mode === "view" && renderView()}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />Delete Package
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-1">
            Are you sure you want to delete <strong>{bundles.find(b => b.id === deleteId)?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="h-8 text-sm">Cancel</Button>
            <Button onClick={() => deleteId && deleteBundle(deleteId)} className="bg-rose-500 hover:bg-rose-600 text-white h-8 text-sm gap-2">
              <Trash2 className="h-3.5 w-3.5" />Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
