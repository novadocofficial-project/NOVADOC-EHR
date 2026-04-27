import { useState, useEffect, useMemo } from "react";
import {
  Banknote, Info, UserRound, ChevronRight, Search,
  Plus, X, Layers, CreditCard, SlidersHorizontal, CheckSquare, Square,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import type { Department } from "@/pages/AdminSettings";
import type { Doctor } from "@/pages/DoctorsModule";
import type { Service, ServiceType } from "@/pages/BillingTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubShareType = "value" | "percentage";

type FeeRow = {
  deptId: string;
  subDeptId: string;
  consultationFee: string;
  shareType: SubShareType;
  shareAmount: string;
  followUpFee: string;
  followUpShareType: SubShareType;
  followUpShareAmount: string;
  emergencyFee: string;
  emergencyShareType: SubShareType;
  emergencyShareAmount: string;
  teleFee: string;
  teleShareType: SubShareType;
  teleShareAmount: string;
};

type DocServiceRow = {
  serviceId: string;
  useBasePrice: boolean;
  adjustedPrice: string;
  shareType: "percentage" | "fixed";
  shareValue: string;
  selected: boolean; // for bulk ops
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFeeRows(doctor: Doctor): FeeRow[] {
  const rows: FeeRow[] = [];
  doctor.departments.forEach(deptId => {
    (doctor.subDepartments[deptId] ?? []).forEach(subDeptId => {
      rows.push({
        deptId, subDeptId,
        consultationFee: "", shareType: "percentage", shareAmount: "",
        followUpFee: "", followUpShareType: "percentage", followUpShareAmount: "",
        emergencyFee: "", emergencyShareType: "percentage", emergencyShareAmount: "",
        teleFee: "", teleShareType: "percentage", teleShareAmount: "",
      });
    });
  });
  return rows;
}

function computeEquiv(fee: string, shareType: SubShareType, shareAmt: string): string {
  const f = parseFloat(fee), s = parseFloat(shareAmt);
  if (isNaN(f) || isNaN(s) || f <= 0 || s < 0) return "";
  if (shareType === "percentage") return `= Rs. ${((f * s) / 100).toFixed(0)}`;
  return `= ${((s / f) * 100).toFixed(1)}%`;
}

function calcShares(row: DocServiceRow, service: Service): { doctor: number; clinic: number } | null {
  const price = row.useBasePrice ? service.basePrice : parseFloat(row.adjustedPrice);
  const share = parseFloat(row.shareValue);
  if (isNaN(price) || isNaN(share) || price < 0 || share < 0) return null;
  const doctorAmt = row.shareType === "percentage" ? (price * share) / 100 : share;
  const clinicAmt = price - doctorAmt;
  return { doctor: Math.round(doctorAmt * 100) / 100, clinic: Math.round(clinicAmt * 100) / 100 };
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function SubShareToggle({ value, onChange }: { value: SubShareType; onChange: (v: SubShareType) => void }) {
  return (
    <div className="flex overflow-hidden rounded-md border border-slate-200">
      {(["value", "percentage"] as SubShareType[]).map(t => (
        <button key={t} type="button" onClick={() => onChange(t)}
          className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors ${value === t ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
          {t === "value" ? "Rs." : "%"}
        </button>
      ))}
    </div>
  );
}

// ─── Fee type definitions (drives Consultation Fees tab rows) ─────────────────

type FeeTypeDef = {
  label: string;
  badge?: string;
  badgeColor?: string;
  feeKey: keyof FeeRow;
  stKey: keyof FeeRow;
  saKey: keyof FeeRow;
  labelColor: string;
};

const FEE_TYPE_DEFS: FeeTypeDef[] = [
  { label: "Consultation",  feeKey: "consultationFee",  stKey: "shareType",          saKey: "shareAmount",          labelColor: "text-slate-700" },
  { label: "Follow-up",     feeKey: "followUpFee",      stKey: "followUpShareType",  saKey: "followUpShareAmount",  labelColor: "text-slate-500" },
  { label: "Emergency",     feeKey: "emergencyFee",     stKey: "emergencyShareType", saKey: "emergencyShareAmount", labelColor: "text-rose-600",  badge: "Emergency",  badgeColor: "bg-rose-50 text-rose-600 border-rose-200" },
  { label: "Tele-Consult",  feeKey: "teleFee",          stKey: "teleShareType",      saKey: "teleShareAmount",      labelColor: "text-sky-600",   badge: "Tele",       badgeColor: "bg-sky-50 text-sky-600 border-sky-200" },
];

// ─── Seed Data ────────────────────────────────────────────────────────────────

function buildSeedDocServices(): Record<string, DocServiceRow[]> {
  const row = (serviceId: string, adjustedPrice: string, shareType: "percentage" | "fixed", shareValue: string): DocServiceRow => ({
    serviceId, useBasePrice: false, adjustedPrice, shareType, shareValue, selected: false,
  });
  return {
    // Dr. Emily Wong — General Consult, Emergency Consult, CBC, Ultrasound
    "doc-1": [
      row("svc-1",  "500",   "percentage", "30"),
      row("svc-4",  "2000",  "percentage", "40"),
      row("svc-10", "450",   "percentage", "20"),
      row("svc-33", "2000",  "percentage", "25"),
    ],
    // Dr. James Wilson — Specialist Consult, Echocardiogram, CBC, MRI Brain
    "doc-2": [
      row("svc-2",  "1200",  "percentage", "40"),
      row("svc-30", "3500",  "fixed",      "1500"),
      row("svc-10", "450",   "percentage", "25"),
      row("svc-34", "12000", "fixed",      "3500"),
    ],
    // Dr. Sarah Connor — Follow-up Consult, Pediatric Consult, LFT, X-Ray
    "doc-3": [
      row("svc-3",  "300",  "percentage", "25"),
      row("svc-6",  "800",  "percentage", "35"),
      row("svc-11", "800",  "percentage", "20"),
      row("svc-31", "900",  "percentage", "15"),
    ],
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FeesModule({
  departments,
  doctors,
  services = [],
  serviceTypes = [],
}: {
  departments: Department[];
  doctors: Doctor[];
  services?: Service[];
  serviceTypes?: ServiceType[];
}) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Sub-dept fees state (existing)
  const [fees, setFees] = useState<Record<string, FeeRow[]>>({});

  // Service-level pricing state (new)
  const [docServices, setDocServices] = useState<Record<string, DocServiceRow[]>>(() => buildSeedDocServices());

  // Dialogs
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [pendingServiceIds, setPendingServiceIds] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkScope, setBulkScope] = useState<"all" | "type" | "selected">("all");
  const [bulkTypeId, setBulkTypeId] = useState("");
  const [bulkShareType, setBulkShareType] = useState<"percentage" | "fixed">("percentage");
  const [bulkShareValue, setBulkShareValue] = useState("");
  const [bulkAdjustPrice, setBulkAdjustPrice] = useState(false);
  const [bulkPriceType, setBulkPriceType] = useState<"percentage" | "fixed">("percentage");
  const [bulkPriceValue, setBulkPriceValue] = useState("");

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) ?? null;

  // Init fee rows when doctor selected
  useEffect(() => {
    if (!selectedDoctorId || fees[selectedDoctorId]) return;
    const doctor = doctors.find(d => d.id === selectedDoctorId);
    if (doctor) setFees(prev => ({ ...prev, [selectedDoctorId]: buildFeeRows(doctor) }));
  }, [selectedDoctorId, doctors, fees]);

  // Helpers
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name ?? id;
  const getSubDeptName = (deptId: string, subId: string) =>
    departments.find(d => d.id === deptId)?.subDepartments.find(s => s.id === subId)?.name ?? subId;
  const getServiceTypeName = (id: string) => serviceTypes.find(st => st.id === id)?.name ?? "—";

  const filteredDoctors = doctors.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const doctorRows = selectedDoctorId ? (fees[selectedDoctorId] ?? []) : [];
  const doctorServiceRows = selectedDoctorId ? (docServices[selectedDoctorId] ?? []) : [];

  const configuredCount = doctorRows.filter(r =>
    r.consultationFee.trim() !== "" || r.emergencyFee.trim() !== "" || r.teleFee.trim() !== "" || r.followUpFee.trim() !== ""
  ).length;
  const servicesConfigured = doctorServiceRows.filter(r => r.shareValue.trim() !== "").length;

  const groupedFeeRows = selectedDoctor
    ? selectedDoctor.departments.map(deptId => ({
        deptId,
        deptName: getDeptName(deptId),
        rows: doctorRows.filter(r => r.deptId === deptId),
      })).filter(g => g.rows.length > 0)
    : [];

  // ── Sub-dept fee updater ──
  const updateFee = (doctorId: string, deptId: string, subDeptId: string, key: keyof FeeRow, val: string | SubShareType) => {
    setFees(prev => ({
      ...prev,
      [doctorId]: (prev[doctorId] ?? []).map(r =>
        r.deptId === deptId && r.subDeptId === subDeptId ? { ...r, [key]: val } : r
      ),
    }));
  };

  // ── Service row updater ──
  const updateServiceRow = (doctorId: string, serviceId: string, key: keyof DocServiceRow, val: string | boolean) => {
    setDocServices(prev => ({
      ...prev,
      [doctorId]: (prev[doctorId] ?? []).map(r => r.serviceId === serviceId ? { ...r, [key]: val } : r),
    }));
  };

  // ── Assign services dialog ──
  const openAssignDialog = () => {
    setPendingServiceIds(doctorServiceRows.map(r => r.serviceId));
    setAssignSearch("");
    setShowAssignDialog(true);
  };

  const confirmAssign = () => {
    if (!selectedDoctorId) return;
    const existing = docServices[selectedDoctorId] ?? [];
    const existingIds = existing.map(r => r.serviceId);
    const toAdd = pendingServiceIds.filter(id => !existingIds.includes(id));
    const toRemove = existingIds.filter(id => !pendingServiceIds.includes(id));
    const newRows: DocServiceRow[] = [
      ...existing.filter(r => !toRemove.includes(r.serviceId)),
      ...toAdd.map(id => {
        const svc = services.find(s => s.id === id)!;
        return { serviceId: id, useBasePrice: true, adjustedPrice: String(svc.basePrice), shareType: "percentage" as const, shareValue: "", selected: false };
      }),
    ];
    setDocServices(prev => ({ ...prev, [selectedDoctorId]: newRows }));
    setShowAssignDialog(false);
  };

  const removeService = (serviceId: string) => {
    if (!selectedDoctorId) return;
    setDocServices(prev => ({
      ...prev,
      [selectedDoctorId]: (prev[selectedDoctorId] ?? []).filter(r => r.serviceId !== serviceId),
    }));
  };

  // ── Bulk update ──
  const applyBulk = () => {
    if (!selectedDoctorId) return;
    setDocServices(prev => {
      const rows = prev[selectedDoctorId] ?? [];
      const updated = rows.map(r => {
        const svc = services.find(s => s.id === r.serviceId);
        if (!svc) return r;
        // Filter by scope
        if (bulkScope === "type" && svc.serviceTypeId !== bulkTypeId) return r;
        if (bulkScope === "selected" && !r.selected) return r;
        let newRow = { ...r };
        // Apply share
        if (bulkShareValue.trim()) {
          newRow.shareType = bulkShareType;
          newRow.shareValue = bulkShareValue;
        }
        // Apply price adjustment
        if (bulkAdjustPrice && bulkPriceValue.trim()) {
          const base = r.useBasePrice ? svc.basePrice : parseFloat(r.adjustedPrice) || svc.basePrice;
          const pv = parseFloat(bulkPriceValue);
          const newPrice = bulkPriceType === "percentage" ? base * (1 + pv / 100) : base + pv;
          newRow.useBasePrice = false;
          newRow.adjustedPrice = Math.max(0, Math.round(newPrice)).toString();
        }
        return newRow;
      });
      return { ...prev, [selectedDoctorId]: updated };
    });
    setShowBulkDialog(false);
    setBulkShareValue(""); setBulkPriceValue(""); setBulkAdjustPrice(false);
  };

  const toggleSelectAll = () => {
    if (!selectedDoctorId) return;
    const rows = docServices[selectedDoctorId] ?? [];
    const allSelected = rows.every(r => r.selected);
    setDocServices(prev => ({
      ...prev,
      [selectedDoctorId]: rows.map(r => ({ ...r, selected: !allSelected })),
    }));
  };

  const selectedCount = doctorServiceRows.filter(r => r.selected).length;

  const assignableServices = useMemo(() =>
    services.filter(s => s.active && s.name.toLowerCase().includes(assignSearch.toLowerCase())),
    [services, assignSearch]
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex-none mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Fees & Shares</h1>
        <p className="mt-1 text-sm text-slate-500">
          Select a doctor to configure consultation fees and per-service pricing with revenue shares.
        </p>
      </div>

      <div className="flex flex-1 gap-5 overflow-hidden">
        {/* ── Doctor List ── */}
        <aside className="flex w-64 flex-none flex-col gap-2 overflow-hidden">
          <div className="relative flex-none">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input placeholder="Search doctors…" value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
          </div>
          <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {filteredDoctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <UserRound className="mb-2 h-7 w-7 opacity-40" />
                <p className="text-xs">No doctors found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredDoctors.map(doc => {
                  const isSelected = selectedDoctorId === doc.id;
                  const svcCount = (docServices[doc.id] ?? []).length;
                  return (
                    <button key={doc.id} type="button" onClick={() => setSelectedDoctorId(doc.id)}
                      className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${isSelected ? "bg-[#4982CF]/8 border-l-2 border-[#4982CF]" : "hover:bg-slate-50 border-l-2 border-transparent"}`}>
                      <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-xs font-bold ${isSelected ? "bg-[#4982CF] text-white" : "bg-slate-100 text-slate-600"}`}>
                        {initials(doc.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-semibold ${isSelected ? "text-[#4982CF]" : "text-slate-700"}`}>{doc.name}</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${doc.status === "active" ? "bg-emerald-500" : "bg-amber-400"}`} />
                          <span className="text-[10px] text-slate-400 capitalize">{doc.status}</span>
                          {svcCount > 0 && <span className="text-[10px] text-[#4982CF] font-medium">· {svcCount} svc{svcCount !== 1 ? "s" : ""}</span>}
                        </div>
                      </div>
                      {isSelected && <ChevronRight className="h-3.5 w-3.5 flex-none text-[#4982CF]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ── Right Panel ── */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
          {!selectedDoctor ? (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-slate-400">
              <Banknote className="mb-3 h-12 w-12 opacity-30" />
              <p className="text-base font-semibold text-slate-500">Select a doctor</p>
              <p className="mt-1 text-sm">Choose a doctor from the list to configure their fees.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 h-full overflow-hidden">
              {/* Doctor summary bar */}
              <div className="flex-none flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#4982CF] text-sm font-bold text-white">
                  {initials(selectedDoctor.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800">{selectedDoctor.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {selectedDoctor.departments.map(getDeptName).join(", ")} · {selectedDoctor.shift} shift
                  </p>
                </div>
                <Badge className={selectedDoctor.status === "active" ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : "bg-amber-500/10 text-amber-700 border-amber-200"}>
                  {selectedDoctor.status}
                </Badge>
                <div className="flex items-center gap-2 text-xs text-slate-400 flex-none">
                  <span className="font-medium text-[#4982CF]">{servicesConfigured}</span>/{doctorServiceRows.length} services configured
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="consult-fees" className="flex flex-col flex-1 overflow-hidden">
                <TabsList className="flex-none h-9 bg-slate-100 w-fit">
                  <TabsTrigger value="consult-fees" className="text-xs gap-1.5">
                    <Banknote className="h-3.5 w-3.5" /> Consultation Fees
                    {configuredCount > 0 && (
                      <span className="ml-1 rounded bg-[#4982CF]/15 px-1.5 text-[10px] font-bold text-[#4982CF]">{configuredCount}</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="service-pricing" className="text-xs gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" /> Service Pricing
                    {doctorServiceRows.length > 0 && (
                      <span className="ml-1 rounded bg-[#4982CF]/15 px-1.5 text-[10px] font-bold text-[#4982CF]">{doctorServiceRows.length}</span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* ── SERVICE PRICING TAB ── */}
                <TabsContent value="service-pricing" className="flex-1 overflow-y-auto mt-3 space-y-3">
                  {/* Toolbar */}
                  <div className="flex items-center gap-2">
                    <Button onClick={openAssignDialog} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 h-8 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      Assign Services
                    </Button>
                    {doctorServiceRows.length > 0 && (
                      <Button variant="outline" size="sm" onClick={() => setShowBulkDialog(true)}
                        className="gap-1.5 border-[#4982CF]/30 text-[#4982CF] hover:bg-[#4982CF]/5 h-8 text-xs">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Bulk Update {selectedCount > 0 ? `(${selectedCount} selected)` : ""}
                      </Button>
                    )}
                    {doctorServiceRows.length > 0 && (
                      <span className="text-xs text-slate-400 ml-auto">{doctorServiceRows.length} service{doctorServiceRows.length !== 1 ? "s" : ""} assigned</span>
                    )}
                  </div>

                  {doctorServiceRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-slate-400">
                      <Layers className="mb-3 h-10 w-10 opacity-30" />
                      <p className="font-semibold text-slate-500">No services assigned</p>
                      <p className="mt-1 text-sm">Click "Assign Services" to add services from the system.</p>
                      {services.length === 0 && (
                        <p className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
                          No services found. Add services in Service Pricing first.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      {/* Column headers */}
                      <div className="grid items-center border-b border-slate-100 bg-slate-50/80 px-4 py-2.5"
                        style={{ gridTemplateColumns: "28px 1.8fr 1fr 1fr 110px 1fr 100px 1fr 1fr 36px" }}>
                        <button type="button" onClick={toggleSelectAll} className="flex items-center justify-center text-slate-400 hover:text-[#4982CF]">
                          {selectedCount === doctorServiceRows.length && selectedCount > 0
                            ? <CheckSquare className="h-3.5 w-3.5 text-[#4982CF]" />
                            : <Square className="h-3.5 w-3.5" />}
                        </button>
                        {["Service", "Type", "Base Price", "Adjusted Price", "Use Base", "Share Type", "Share Val.", "Dr. Share", "Clinic Share", ""].map(h => (
                          <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
                        ))}
                      </div>

                      <div className="divide-y divide-slate-100">
                        {doctorServiceRows.map(row => {
                          const svc = services.find(s => s.id === row.serviceId);
                          if (!svc) return null;
                          const effectivePrice = row.useBasePrice ? svc.basePrice : (parseFloat(row.adjustedPrice) || 0);
                          const shares = calcShares(row, svc);
                          const shareError = shares && shares.doctor > effectivePrice;
                          const shareNegative = shares && (shares.doctor < 0 || shares.clinic < 0);

                          return (
                            <div key={row.serviceId} className="grid items-center gap-2 px-4 py-3 hover:bg-slate-50/60 transition-colors"
                              style={{ gridTemplateColumns: "28px 1.8fr 1fr 1fr 110px 1fr 100px 1fr 1fr 36px" }}>

                              {/* Checkbox */}
                              <Checkbox
                                checked={row.selected}
                                onCheckedChange={v => updateServiceRow(selectedDoctorId!, row.serviceId, "selected", !!v)}
                                className="data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
                              />

                              {/* Service Name */}
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-slate-800">{svc.name}</p>
                              </div>

                              {/* Service Type */}
                              <Badge variant="outline" className="w-fit text-[9px] font-semibold text-[#4982CF] border-[#4982CF]/30 bg-[#4982CF]/5 truncate">
                                {getServiceTypeName(svc.serviceTypeId)}
                              </Badge>

                              {/* Base Price */}
                              <span className="text-xs font-semibold text-slate-500">Rs. {svc.basePrice.toLocaleString()}</span>

                              {/* Adjusted Price */}
                              <div>
                                {row.useBasePrice ? (
                                  <span className="text-xs font-bold text-slate-700">Rs. {svc.basePrice.toLocaleString()}</span>
                                ) : (
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">Rs.</span>
                                    <Input
                                      type="number" min={0}
                                      value={row.adjustedPrice}
                                      onChange={e => updateServiceRow(selectedDoctorId!, row.serviceId, "adjustedPrice", e.target.value)}
                                      className="h-7 pl-7 text-xs"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Use Base Price toggle */}
                              <div className="flex items-center gap-1.5">
                                <Switch
                                  checked={row.useBasePrice}
                                  onCheckedChange={v => updateServiceRow(selectedDoctorId!, row.serviceId, "useBasePrice", v)}
                                  className="data-[state=checked]:bg-[#4982CF] scale-75 origin-left"
                                />
                                <span className="text-[10px] text-slate-400">{row.useBasePrice ? "Base" : "Custom"}</span>
                              </div>

                              {/* Share Type */}
                              <div className="flex overflow-hidden rounded border border-slate-200">
                                <button type="button" onClick={() => updateServiceRow(selectedDoctorId!, row.serviceId, "shareType", "percentage")}
                                  className={`flex-1 px-2 py-1 text-[10px] font-bold transition-colors ${row.shareType === "percentage" ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                                  %
                                </button>
                                <button type="button" onClick={() => updateServiceRow(selectedDoctorId!, row.serviceId, "shareType", "fixed")}
                                  className={`flex-1 px-2 py-1 text-[10px] font-bold transition-colors ${row.shareType === "fixed" ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                                  Rs.
                                </button>
                              </div>

                              {/* Share Value */}
                              <div>
                                <Input
                                  type="number" min={0}
                                  max={row.shareType === "percentage" ? 100 : undefined}
                                  placeholder={row.shareType === "percentage" ? "%" : "Rs."}
                                  value={row.shareValue}
                                  onChange={e => updateServiceRow(selectedDoctorId!, row.serviceId, "shareValue", e.target.value)}
                                  className={`h-7 text-xs ${shareError || shareNegative ? "border-rose-400" : ""}`}
                                />
                              </div>

                              {/* Doctor Share */}
                              <div>
                                {shares ? (
                                  <div>
                                    <p className={`text-xs font-bold ${shareError || shares.doctor < 0 ? "text-rose-500" : "text-emerald-600"}`}>
                                      Rs. {shares.doctor.toFixed(0)}
                                    </p>
                                    {row.shareType === "fixed" && effectivePrice > 0 && (
                                      <p className="text-[9px] text-slate-400">
                                        {((shares.doctor / effectivePrice) * 100).toFixed(1)}%
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-300">—</span>
                                )}
                              </div>

                              {/* Clinic Share */}
                              <div>
                                {shares ? (
                                  <div>
                                    <p className={`text-xs font-bold ${shares.clinic < 0 ? "text-rose-500" : "text-[#4982CF]"}`}>
                                      Rs. {shares.clinic.toFixed(0)}
                                    </p>
                                    {row.shareType === "percentage" && effectivePrice > 0 && (
                                      <p className="text-[9px] text-slate-400">
                                        {(100 - parseFloat(row.shareValue || "0")).toFixed(1)}%
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-300">—</span>
                                )}
                              </div>

                              {/* Remove */}
                              <button type="button" onClick={() => removeService(row.serviceId)}
                                className="flex items-center justify-center rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-400 transition-colors">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary footer */}
                      {doctorServiceRows.some(r => r.shareValue) && (
                        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
                          <div className="flex flex-wrap gap-6">
                            {(() => {
                              let totalDr = 0, totalClinic = 0, count = 0;
                              doctorServiceRows.forEach(r => {
                                const svc = services.find(s => s.id === r.serviceId);
                                if (!svc) return;
                                const sh = calcShares(r, svc);
                                if (sh) { totalDr += sh.doctor; totalClinic += sh.clinic; count++; }
                              });
                              return count > 0 ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500">Total Dr. Share ({count} svcs):</span>
                                    <span className="text-sm font-bold text-emerald-600">Rs. {Math.round(totalDr).toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500">Total Clinic Share:</span>
                                    <span className="text-sm font-bold text-[#4982CF]">Rs. {Math.round(totalClinic).toLocaleString()}</span>
                                  </div>
                                </>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* ── CONSULTATION FEES TAB ── */}
                <TabsContent value="consult-fees" className="flex-1 overflow-y-auto mt-3 space-y-3">
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
                    <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-600" />
                    <p className="text-xs text-amber-700">
                      Set fees and doctor share per consultation type, per sub-department.
                      Toggle <strong>Rs.</strong> for a fixed share or <strong>%</strong> for a percentage.
                    </p>
                  </div>

                  {groupedFeeRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-12 text-slate-400">
                      <p className="text-sm font-medium">No sub-departments assigned</p>
                      <p className="mt-1 text-xs">Assign sub-departments from Doctor Profiles first.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupedFeeRows.map(({ deptId, deptName, rows }) => (
                        <div key={deptId} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                          {/* Dept header */}
                          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-2.5">
                            <span className="font-bold text-slate-800">{deptName}</span>
                            <span className="ml-auto text-xs text-slate-400">{rows.length} sub-dept{rows.length !== 1 ? "s" : ""}</span>
                          </div>

                          {/* Per sub-dept blocks */}
                          <div className="divide-y divide-slate-100">
                            {rows.map((row, rowIdx) => (
                              <div key={row.subDeptId}>
                                {/* Sub-dept label row */}
                                <div className="flex items-center gap-3 bg-slate-50/50 px-5 py-2 border-b border-slate-100">
                                  <span className="text-sm font-semibold text-slate-700">{getSubDeptName(row.deptId, row.subDeptId)}</span>
                                  {/* Column headers inline on first sub-dept */}
                                  {rowIdx === 0 && (
                                    <div className="ml-auto grid items-center gap-3 text-right"
                                      style={{ gridTemplateColumns: "1fr 106px 1fr" }}>
                                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Fee Amount</span>
                                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Share</span>
                                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Dr. Share Amt</span>
                                    </div>
                                  )}
                                </div>

                                {/* 4 fee type rows */}
                                {FEE_TYPE_DEFS.map((ft, ftIdx) => {
                                  const feeVal = String(row[ft.feeKey] ?? "");
                                  const stVal = (row[ft.stKey] ?? "percentage") as SubShareType;
                                  const saVal = String(row[ft.saKey] ?? "");
                                  const equiv = computeEquiv(feeVal, stVal, saVal);
                                  const isLast = ftIdx === FEE_TYPE_DEFS.length - 1;
                                  return (
                                    <div key={ft.label}
                                      className={`grid items-center gap-3 px-5 py-2.5 hover:bg-slate-50/60 transition-colors ${!isLast ? "border-b border-slate-50" : ""}`}
                                      style={{ gridTemplateColumns: "140px 1fr 106px 1fr" }}>

                                      {/* Fee type label */}
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold ${ft.labelColor}`}>{ft.label}</span>
                                        {ft.badge && (
                                          <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-bold ${ft.badgeColor}`}>
                                            {ft.badge}
                                          </span>
                                        )}
                                      </div>

                                      {/* Fee amount input */}
                                      <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">Rs.</span>
                                        <Input type="number" min={0} placeholder="0" value={feeVal}
                                          onChange={e => updateFee(selectedDoctorId!, deptId, row.subDeptId, ft.feeKey, e.target.value)}
                                          className="h-8 pl-8 text-sm" />
                                      </div>

                                      {/* Share toggle */}
                                      <SubShareToggle value={stVal}
                                        onChange={v => updateFee(selectedDoctorId!, deptId, row.subDeptId, ft.stKey, v)} />

                                      {/* Share amount */}
                                      <div>
                                        <Input type="number" min={0} max={stVal === "percentage" ? 100 : undefined}
                                          placeholder={stVal === "percentage" ? "e.g. 30" : "e.g. 500"} value={saVal}
                                          onChange={e => updateFee(selectedDoctorId!, deptId, row.subDeptId, ft.saKey, e.target.value)}
                                          className="h-8 text-sm" />
                                        {equiv && <span className="mt-0.5 block text-[10px] font-medium text-[#4982CF]">{equiv}</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>

                          {/* Summary footer — show configured fees */}
                          {rows.some(r => r.consultationFee || r.emergencyFee || r.teleFee || r.followUpFee) && (
                            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-2.5">
                              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                                {rows.map(r => {
                                  const entries: { type: string; fee: string; color: string }[] = [];
                                  if (r.consultationFee)  entries.push({ type: "Consult",   fee: r.consultationFee,  color: "text-slate-700" });
                                  if (r.followUpFee)      entries.push({ type: "Follow-up", fee: r.followUpFee,      color: "text-slate-500" });
                                  if (r.emergencyFee)     entries.push({ type: "Emergency", fee: r.emergencyFee,     color: "text-rose-600"  });
                                  if (r.teleFee)          entries.push({ type: "Tele",      fee: r.teleFee,          color: "text-sky-600"   });
                                  if (entries.length === 0) return null;
                                  return (
                                    <div key={r.subDeptId} className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-semibold text-slate-400">{getSubDeptName(r.deptId, r.subDeptId)}:</span>
                                      {entries.map(e => (
                                        <span key={e.type} className={`text-[10px] font-bold ${e.color}`}>
                                          {e.type} Rs.{e.fee}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* ── Assign Services Dialog ── */}
      <Dialog open={showAssignDialog} onOpenChange={open => !open && setShowAssignDialog(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Assign Services to {selectedDoctor?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input placeholder="Search services…" value={assignSearch} onChange={e => setAssignSearch(e.target.value)} className="pl-8 h-8 text-xs" />
            </div>
            {services.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">No services in system. Add services in Service Pricing first.</p>
            ) : (
              <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {assignableServices.map(svc => {
                  const checked = pendingServiceIds.includes(svc.id);
                  return (
                    <label key={svc.id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={v => setPendingServiceIds(prev => v ? [...prev, svc.id] : prev.filter(id => id !== svc.id))}
                        className="data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{svc.name}</p>
                        <p className="text-[10px] text-slate-400">{getServiceTypeName(svc.serviceTypeId)} · Rs. {svc.basePrice.toLocaleString()}</p>
                      </div>
                      <Badge className={svc.active ? "text-[9px] bg-emerald-500/10 text-emerald-700 border-emerald-200" : "text-[9px] bg-slate-100 text-slate-500 border-slate-200"}>
                        {svc.active ? "Active" : "Inactive"}
                      </Badge>
                    </label>
                  );
                })}
                {assignableServices.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-400">No services match.</p>}
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">{pendingServiceIds.length} selected</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
                <Button size="sm" onClick={confirmAssign} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white">Confirm</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Update Dialog ── */}
      <Dialog open={showBulkDialog} onOpenChange={open => !open && setShowBulkDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Bulk Update Services</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Scope */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Apply To</Label>
              <Select value={bulkScope} onValueChange={v => setBulkScope(v as typeof bulkScope)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assigned Services</SelectItem>
                  <SelectItem value="type">By Service Type</SelectItem>
                  <SelectItem value="selected" disabled={selectedCount === 0}>
                    Selected Only ({selectedCount})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {bulkScope === "type" && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-600">Service Type</Label>
                <Select value={bulkTypeId} onValueChange={setBulkTypeId}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select type…" /></SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map(st => <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Share */}
            <div className="rounded-lg border border-slate-200 p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-600">Set Doctor Share</p>
              <div className="flex gap-2 items-center">
                <div className="flex overflow-hidden rounded border border-slate-200">
                  {(["percentage", "fixed"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setBulkShareType(t)}
                      className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${bulkShareType === t ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                      {t === "percentage" ? "%" : "Rs."}
                    </button>
                  ))}
                </div>
                <Input type="number" min={0} placeholder="Amount" value={bulkShareValue} onChange={e => setBulkShareValue(e.target.value)} className="flex-1 h-8 text-sm" />
              </div>
            </div>

            {/* Price adjustment */}
            <div className="rounded-lg border border-slate-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">Adjust Prices</p>
                <Switch checked={bulkAdjustPrice} onCheckedChange={setBulkAdjustPrice} className="data-[state=checked]:bg-[#4982CF] scale-75" />
              </div>
              {bulkAdjustPrice && (
                <div className="flex gap-2 items-center">
                  <div className="flex overflow-hidden rounded border border-slate-200">
                    {(["percentage", "fixed"] as const).map(t => (
                      <button key={t} type="button" onClick={() => setBulkPriceType(t)}
                        className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${bulkPriceType === t ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                        {t === "percentage" ? "% increase" : "Rs. increase"}
                      </button>
                    ))}
                  </div>
                  <Input type="number" min={0} placeholder="Value" value={bulkPriceValue} onChange={e => setBulkPriceValue(e.target.value)} className="flex-1 h-8 text-sm" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
              <Button onClick={applyBulk} disabled={!bulkShareValue && !bulkPriceValue} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white">
                Apply Bulk Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
