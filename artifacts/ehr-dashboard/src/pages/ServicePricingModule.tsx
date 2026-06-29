import { useState, useMemo, useRef, useEffect } from "react";
import {
  Printer, Search, Edit2,
  ClipboardList, FileSpreadsheet, LayoutGrid, Columns, Banknote, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ServiceType, Service } from "@/pages/BillingTypes";
import type { Department } from "@/pages/AdminSettings";
import type { Doctor } from "@/pages/DoctorsModule";
import type { FeeRow } from "@/pages/FeesModule";
import type { LabProvider } from "@/pages/LabCatalogModule";
import type { ImagingPartner } from "@/pages/ImagingCatalogModule";
import type { FormularyPartner } from "@/pages/FormularyPartnersModule";
import type { ConsumableProvider } from "@/pages/ConsumablesModule";
import type { ProcedurePartner } from "@/pages/ProcedureCatalogModule";
import type { VaccinePartner } from "@/pages/VaccineCatalogModule";

// ── Generic provider shape used internally ─────────────────────────────────
interface Provider { id: string; name: string; active: boolean; }

// ── Service-type ID → provider category ───────────────────────────────────
const PROVIDER_ST_IDS = new Set(["st-2", "st-3", "st-4", "st-5", "st-6", "st-7"]);

// ── Consultation service → FeeRow field mapping ────────────────────────────
const CONSULT_SERVICES_LIST = ["Consultation", "FollowUp", "Emergency", "Tele-consultation"] as const;
type ConsultService = typeof CONSULT_SERVICES_LIST[number];

const CONSULT_FEE_MAP: Record<ConsultService, {
  feeKey: keyof FeeRow; stKey: keyof FeeRow; saKey: keyof FeeRow;
  label: string; color: string; badgeColor: string;
}> = {
  "Consultation":      { feeKey: "consultationFee", stKey: "shareType",          saKey: "shareAmount",          label: "Consultation",    color: "text-slate-700", badgeColor: "bg-slate-100 text-slate-600 border-slate-200" },
  "FollowUp":          { feeKey: "followUpFee",      stKey: "followUpShareType",  saKey: "followUpShareAmount",  label: "Follow-up",       color: "text-slate-500", badgeColor: "bg-slate-50 text-slate-500 border-slate-200"  },
  "Emergency":         { feeKey: "emergencyFee",     stKey: "emergencyShareType", saKey: "emergencyShareAmount", label: "Emergency",       color: "text-rose-600",  badgeColor: "bg-rose-50 text-rose-600 border-rose-200"     },
  "Tele-consultation": { feeKey: "teleFee",          stKey: "teleShareType",      saKey: "teleShareAmount",      label: "Tele-consultation",color: "text-sky-600",  badgeColor: "bg-sky-50 text-sky-600 border-sky-200"       },
};

function consultInitials(name: string) {
  return name.replace(/^Dr\.\s*/i, "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

// ── Formatting helpers ─────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
// ── Export helpers ─────────────────────────────────────────────────────────
function exportToCSV(
  services: Service[],
  serviceTypes: ServiceType[],
  departments: Department[],
  providers: Provider[],
  hasPivot: boolean,
) {
  const getSTName = (id: string) => serviceTypes.find(st => st.id === id)?.name ?? id;
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name ?? id;

  if (hasPivot) {
    const headers = [
      "Service Name", "Service Type", "Dept", "Taxable", "Status",
      ...providers.map(p => `${p.name} (Rs.)`),
    ];
    const rows = services.map(s => [
      s.name,
      getSTName(s.serviceTypeId),
      getDeptName(s.departmentId),
      s.taxable ? "Yes" : "No",
      s.active ? "Active" : "Inactive",
      ...providers.map(p => s.providerPrices?.[p.id] ?? ""),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    triggerDownload(csv, "service_pricing.csv");
  } else {
    const headers = ["Service Name", "Service Type", "Dept", "Taxable", "Status", "Created"];
    const rows = services.map(s => [
      s.name, getSTName(s.serviceTypeId), getDeptName(s.departmentId),
      s.taxable ? "Yes" : "No", s.active ? "Active" : "Inactive", fmtDate(s.createdAt),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    triggerDownload(csv, "service_pricing.csv");
  }
}

function triggerDownload(csv: string, name: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function exportToPrint(
  services: Service[],
  serviceTypes: ServiceType[],
  departments: Department[],
  providers: Provider[],
  hasPivot: boolean,
) {
  const getSTName = (id: string) => serviceTypes.find(st => st.id === id)?.name ?? id;
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name ?? id;

  let thead: string;
  let tbody: string;

  if (hasPivot) {
    thead = `<tr><th>Service Name</th><th>Type</th><th>Dept</th><th>Taxable</th><th>Status</th>${
      providers.map(p => `<th>${p.name}</th>`).join("")
    }</tr>`;
    tbody = services.map(s => `<tr>
      <td>${s.name}</td><td>${getSTName(s.serviceTypeId)}</td><td>${getDeptName(s.departmentId)}</td>
      <td>${s.taxable ? "Yes" : "No"}</td><td>${s.active ? "Active" : "Inactive"}</td>
      ${providers.map(p => `<td>${s.providerPrices?.[p.id] != null ? `Rs. ${s.providerPrices[p.id].toLocaleString()}` : "—"}</td>`).join("")}
    </tr>`).join("");
  } else {
    thead = `<tr><th>Service Name</th><th>Type</th><th>Dept</th><th>Taxable</th><th>Status</th><th>Created</th></tr>`;
    tbody = services.map(s => `<tr>
      <td>${s.name}</td><td>${getSTName(s.serviceTypeId)}</td><td>${getDeptName(s.departmentId)}</td>
      <td>${s.taxable ? "Yes" : "No"}</td><td>${s.active ? "Active" : "Inactive"}</td><td>${fmtDate(s.createdAt)}</td>
    </tr>`).join("");
  }

  const html = `<html><head><title>Service Pricing</title>
    <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ddd;padding:8px;font-size:11px;text-align:left}
    th{background:#f1f5f9;font-weight:bold}h1{font-size:18px;margin-bottom:16px}</style></head>
    <body><h1>Service Pricing Report</h1>
    <table><thead>${thead}</thead><tbody>${tbody}</tbody></table></body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

// ── Inline price cell ──────────────────────────────────────────────────────
function PriceCell({
  value,
  onSave,
}: {
  value: number | undefined;
  onSave: (n: number | undefined) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(value !== undefined ? String(value) : "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commit() {
    const n = parseFloat(draft);
    onSave(isNaN(n) || draft.trim() === "" ? undefined : n);
    setEditing(false);
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className="h-6 text-xs text-right w-24 ml-auto px-2"
        placeholder="0"
      />
    );
  }

  return (
    <button
      onClick={startEdit}
      className={`text-xs text-right w-full block hover:bg-[#4982CF]/5 rounded px-2 py-0.5 transition-colors ${
        value !== undefined ? "font-semibold text-slate-800" : "text-slate-300 italic"
      }`}
    >
      {value !== undefined ? `Rs. ${value.toLocaleString()}` : "— set price"}
    </button>
  );
}

// ── Form state ─────────────────────────────────────────────────────────────
type FormState = {
  name: string;
  serviceTypeId: string;
  departmentId: string;
  subDepartmentId: string;
  active: boolean;
  taxable: boolean;
};

function blankForm(): FormState {
  return { name: "", serviceTypeId: "", departmentId: "", subDepartmentId: "", active: true, taxable: false };
}

// ── Consultation Fees read-only table ───────────────────────────────────────
type ConsultRow = {
  key: string; doctorId: string; doctorName: string;
  deptId: string; deptName: string; subDeptId: string; subDeptName: string;
  service: string; label: string; labelColor: string; badgeColor: string;
  feeAmount: string; shareType: string; shareAmount: string;
};

function ConsultationTable({ rows }: { rows: ConsultRow[] }) {
  const grouped = rows.reduce<Record<string, ConsultRow[]>>((acc, r) => {
    (acc[r.doctorId] ??= []).push(r); return acc;
  }, {});

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <Info className="h-3.5 w-3.5 text-slate-400 flex-none" />
        <p className="text-xs text-slate-500">
          Read-only view. Fee amounts are configured in <span className="font-semibold text-slate-600">Admin Settings → Doctor Fees &amp; Shares</span>.
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Doctor</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Department / Sub-Dept</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Service Type</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Fee Amount</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Doctor's Share</th>
            <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([, docRows]) => {
            const first = docRows[0];
            const initials = consultInitials(first.doctorName);
            return docRows.map((row, ri) => (
              <tr key={row.key} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                {ri === 0 && (
                  <td rowSpan={docRows.length} className="px-4 py-3 align-top border-r border-slate-50">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-[#4982CF]/10 flex items-center justify-center flex-none">
                        <span className="text-xs font-bold text-[#4982CF]">{initials}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{first.doctorName}</span>
                    </div>
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-slate-600">
                  <span className="font-medium">{row.deptName}</span>
                  <span className="mx-1 text-slate-300">/</span>
                  <span className="text-slate-500">{row.subDeptName}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${row.badgeColor}`}>
                    {row.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm">
                  {row.feeAmount
                    ? <span className="text-slate-700">Rs. {row.feeAmount}</span>
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">
                  {row.feeAmount && row.shareAmount
                    ? row.shareType === "percentage"
                      ? <span>{row.shareAmount}%</span>
                      : <span className="font-mono">Rs. {row.shareAmount}</span>
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.feeAmount
                    ? <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">Configured</span>
                    : <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600">Not set</span>}
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function ServicePricingModule({
  serviceTypes,
  services,
  setServices,
  departments,
  labProviders = [],
  imagingPartners = [],
  pharmacyPartners = [],
  consumableProviders = [],
  procPartners = [],
  vaccPartners = [],
  doctors,
  doctorFees,
}: {
  serviceTypes: ServiceType[];
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  departments: Department[];
  labProviders?: LabProvider[];
  imagingPartners?: ImagingPartner[];
  pharmacyPartners?: FormularyPartner[];
  consumableProviders?: ConsumableProvider[];
  procPartners?: ProcedurePartner[];
  vaccPartners?: VaccinePartner[];
  doctors?: Doctor[];
  doctorFees?: Record<string, FeeRow[]>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [consultSearch, setConsultSearch] = useState("");
  const tabScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const activeServiceTypes = serviceTypes.filter(st => st.active);

  // Providers indexed by service-type ID
  const providersByStId = useMemo<Record<string, Provider[]>>(() => ({
    "st-2": (labProviders as Provider[]).filter(p => p.active),
    "st-3": (procPartners as Provider[]).filter(p => p.active),
    "st-4": (pharmacyPartners as Provider[]).filter(p => p.active),
    "st-5": (consumableProviders as Provider[]).filter(p => p.active),
    "st-6": (imagingPartners as Provider[]).filter(p => p.active),
    "st-7": (vaccPartners as Provider[]).filter(p => p.active),
  }), [labProviders, procPartners, pharmacyPartners, consumableProviders, imagingPartners, vaccPartners]);

  // Whether the current tab should show the pivot table
  const hasPivot = PROVIDER_ST_IDS.has(activeTab);
  const activeProviders: Provider[] = hasPivot ? (providersByStId[activeTab] ?? []) : [];

  const filteredBySearch = useMemo(() => {
    if (!search.trim()) return services;
    const q = search.toLowerCase();
    return services.filter(s => s.name.toLowerCase().includes(q));
  }, [services, search]);

  const visibleServices = useMemo(() => {
    if (activeTab === "all") return filteredBySearch;
    return filteredBySearch.filter(s => s.serviceTypeId === activeTab);
  }, [filteredBySearch, activeTab]);

  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name ?? "—";
  const getSubDeptName = (deptId: string, subId: string) =>
    departments.find(d => d.id === deptId)?.subDepartments.find(s => s.id === subId)?.name ?? "—";
  const getSTName = (id: string) => serviceTypes.find(st => st.id === id)?.name ?? "—";

  // ── Auto-generated consultation fee rows ──
  const consultRows = useMemo(() => {
    if (!doctors || doctors.length === 0) return [];
    type ConsultRow = {
      key: string; doctorId: string; doctorName: string;
      deptId: string; deptName: string; subDeptId: string; subDeptName: string;
      service: ConsultService; label: string; labelColor: string; badgeColor: string;
      feeAmount: string; shareType: string; shareAmount: string;
    };
    const rows: ConsultRow[] = [];
    doctors.forEach(doc => {
      const consultSvcs = doc.services.filter((s): s is ConsultService =>
        CONSULT_SERVICES_LIST.includes(s as ConsultService)
      );
      if (consultSvcs.length === 0) return;
      doc.departments.forEach(deptId => {
        const dept = departments.find(d => d.id === deptId);
        if (!dept) return;
        (doc.subDepartments[deptId] ?? []).forEach(subDeptId => {
          const subDept = dept.subDepartments.find(s => s.id === subDeptId);
          if (!subDept) return;
          const feeRows = doctorFees?.[doc.id] ?? [];
          const feeRow = feeRows.find(r => r.deptId === deptId && r.subDeptId === subDeptId);
          consultSvcs.forEach(svc => {
            const m = CONSULT_FEE_MAP[svc];
            rows.push({
              key: `${doc.id}-${deptId}-${subDeptId}-${svc}`,
              doctorId: doc.id, doctorName: doc.name,
              deptId, deptName: dept.name,
              subDeptId, subDeptName: subDept.name,
              service: svc, label: m.label, labelColor: m.color, badgeColor: m.badgeColor,
              feeAmount: feeRow ? String(feeRow[m.feeKey] ?? "") : "",
              shareType: feeRow ? String(feeRow[m.stKey] ?? "percentage") : "percentage",
              shareAmount: feeRow ? String(feeRow[m.saKey] ?? "") : "",
            });
          });
        });
      });
    });
    return rows;
  }, [doctors, departments, doctorFees]);

  const filteredConsultRows = useMemo(() => {
    if (!consultSearch.trim()) return consultRows;
    const q = consultSearch.toLowerCase();
    return consultRows.filter(r =>
      r.doctorName.toLowerCase().includes(q) ||
      r.deptName.toLowerCase().includes(q) ||
      r.subDeptName.toLowerCase().includes(q) ||
      r.label.toLowerCase().includes(q)
    );
  }, [consultRows, consultSearch]);

  const isConsultTab = activeTab === "consultation-fees";

  const openEdit = (s: Service) => {
    setForm({
      name: s.name, serviceTypeId: s.serviceTypeId,
      departmentId: s.departmentId, subDepartmentId: s.subDepartmentId, active: s.active, taxable: s.taxable,
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const saveForm = () => {
    if (!editingId) return;
    setServices(prev => prev.map(s => s.id === editingId
      ? { ...s, departmentId: form.departmentId, subDepartmentId: form.subDepartmentId, active: form.active, taxable: form.taxable }
      : s));
    setShowForm(false);
  };

  const toggleActive = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const setProviderPrice = (serviceId: string, providerId: string, price: number | undefined) => {
    setServices(prev => prev.map(s => {
      if (s.id !== serviceId) return s;
      const next = { ...(s.providerPrices ?? {}) };
      if (price === undefined) delete next[providerId];
      else next[providerId] = price;
      return { ...s, providerPrices: next };
    }));
  };

  const selectedDept = departments.find(d => d.id === form.departmentId);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top toolbar */}
      <div className="flex-none border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Service Pricing</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {isConsultTab
                ? "Auto-generated from doctor profiles. Configure amounts in Doctor Fees & Shares."
                : hasPivot
                  ? "Compare provider prices side-by-side. Click any price cell to edit inline."
                  : "Manage all billable services. Switch to a service type tab to configure provider prices."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isConsultTab && (
              <>
                <Button
                  variant="outline" size="sm" className="gap-1.5 text-slate-600"
                  onClick={() => exportToPrint(visibleServices, serviceTypes, departments, activeProviders, hasPivot)}
                  disabled={visibleServices.length === 0}
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </Button>
                <Button
                  variant="outline" size="sm" className="gap-1.5 text-slate-600"
                  onClick={() => exportToCSV(visibleServices, serviceTypes, departments, activeProviders, hasPivot)}
                  disabled={visibleServices.length === 0}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs + search */}
        <div className="mt-4 flex items-center gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-w-0">
            <div ref={tabScrollRef} className="overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: "touch" }}>
              <TabsList className="h-8 bg-slate-100 inline-flex min-w-max">
                <TabsTrigger value="all" className="h-7 text-xs">
                  <LayoutGrid className="h-3 w-3 mr-1" />
                  All <span className="ml-1.5 rounded bg-slate-200 px-1.5 text-[10px] font-bold">{services.length}</span>
                </TabsTrigger>
                <TabsTrigger value="consultation-fees" className="h-7 text-xs">
                  <Banknote className="h-3 w-3 mr-1" />
                  Consult Fees
                  {consultRows.length > 0 && <span className="ml-1.5 rounded bg-slate-200 px-1.5 text-[10px] font-bold">{consultRows.length}</span>}
                </TabsTrigger>
                {activeServiceTypes.map(st => {
                  const count = services.filter(s => s.serviceTypeId === st.id).length;
                  if (count === 0) return null;
                  const isPivot = PROVIDER_ST_IDS.has(st.id);
                  return (
                    <TabsTrigger key={st.id} value={st.id} className="h-7 text-xs">
                      {isPivot && <Columns className="h-3 w-3 mr-1 opacity-60" />}
                      {st.name}
                      <span className="ml-1.5 rounded bg-slate-200 px-1.5 text-[10px] font-bold">{count}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </Tabs>
          <div className="relative w-56 flex-none">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            {isConsultTab ? (
              <Input
                placeholder="Search doctor, dept…"
                value={consultSearch}
                onChange={e => setConsultSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            ) : (
              <Input
                placeholder="Search services…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            )}
          </div>
        </div>
      </div>

      {/* Table area */}
      <div className="flex-1 overflow-auto bg-slate-50/50 px-6 pb-6 pt-4">
        {isConsultTab ? (
          filteredConsultRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-20 text-slate-400">
              <Banknote className="mb-3 h-12 w-12 opacity-30" />
              <p className="font-semibold text-slate-500">
                {consultSearch ? "No rows match your search" : "No consultation rows yet"}
              </p>
              <p className="mt-1 text-sm text-center max-w-xs">
                {consultSearch
                  ? "Try a different keyword."
                  : "Assign consultation services to a doctor and configure fees in Doctor Fees & Shares."}
              </p>
            </div>
          ) : (
            <ConsultationTable rows={filteredConsultRows} />
          )
        ) : visibleServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-20 text-slate-400">
            <ClipboardList className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-semibold text-slate-500">{search ? "No services match your search" : "No services yet"}</p>
            <p className="mt-1 text-sm">{search ? "Try a different keyword." : 'Click "Add Service" to get started.'}</p>
          </div>
        ) : hasPivot ? (
          <PivotTable
            services={visibleServices}
            providers={activeProviders}
            getSTName={getSTName}
            toggleActive={toggleActive}
            onEdit={openEdit}
            setProviderPrice={setProviderPrice}
          />
        ) : (
          <FlatTable
            services={visibleServices}
            getSTName={getSTName}
            getDeptName={getDeptName}
            getSubDeptName={getSubDeptName}
            toggleActive={toggleActive}
            onEdit={openEdit}
          />
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showForm} onOpenChange={open => !open && setShowForm(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Service Name</Label>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">{form.name}</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Service Type</Label>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">{getSTName(form.serviceTypeId)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-600">Department</Label>
                <Select value={form.departmentId} onValueChange={v => setForm(f => ({ ...f, departmentId: v, subDepartmentId: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select dept…" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-600">Sub-Department</Label>
                <Select
                  value={form.subDepartmentId}
                  onValueChange={v => setForm(f => ({ ...f, subDepartmentId: v }))}
                  disabled={!selectedDept || selectedDept.subDepartments.length === 0}
                >
                  <SelectTrigger><SelectValue placeholder="Select sub-dept…" /></SelectTrigger>
                  <SelectContent>
                    {selectedDept?.subDepartments.map(sd => <SelectItem key={sd.id} value={sd.id}>{sd.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <Label className="text-sm font-medium text-slate-700">Active</Label>
                <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} className="data-[state=checked]:bg-[#4982CF]" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <Label className="text-sm font-medium text-slate-700">Taxable</Label>
                <Switch checked={form.taxable} onCheckedChange={v => setForm(f => ({ ...f, taxable: v }))} className="data-[state=checked]:bg-amber-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={saveForm} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white">Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Flat table (All / Consultation / no-provider tabs) ─────────────────────
function FlatTable({
  services,
  getSTName,
  getDeptName,
  getSubDeptName,
  toggleActive,
  onEdit,
}: {
  services: Service[];
  getSTName: (id: string) => string;
  getDeptName: (id: string) => string;
  getSubDeptName: (deptId: string, subId: string) => string;
  toggleActive: (id: string) => void;
  onEdit: (s: Service) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[2fr_1fr_1.5fr_80px_120px_140px_80px] items-center border-b border-slate-100 bg-slate-50/80 px-5 py-2.5">
        {["Service Name", "Service Type", "Dept / Sub-Dept", "Taxable", "Status", "Created", ""].map(h => (
          <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {services.map(s => (
          <div key={s.id} className="grid grid-cols-[2fr_1fr_1.5fr_80px_120px_140px_80px] items-center px-5 py-3 hover:bg-slate-50/60 transition-colors">
            <span className="font-semibold text-slate-800 truncate pr-2">{s.name}</span>
            <Badge variant="outline" className="w-fit text-[10px] font-semibold text-[#4982CF] border-[#4982CF]/30 bg-[#4982CF]/5">
              {getSTName(s.serviceTypeId)}
            </Badge>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-700">{getDeptName(s.departmentId)}</p>
              {s.subDepartmentId && <p className="truncate text-[10px] text-slate-400">{getSubDeptName(s.departmentId, s.subDepartmentId)}</p>}
            </div>
            <Badge className={s.taxable ? "bg-amber-500/10 text-amber-700 border-amber-200 text-[10px] w-fit" : "bg-slate-100 text-slate-500 border-slate-200 text-[10px] w-fit"}>
              {s.taxable ? "Yes" : "No"}
            </Badge>
            <div className="flex items-center gap-2">
              <Switch checked={s.active} onCheckedChange={() => toggleActive(s.id)} className="data-[state=checked]:bg-[#4982CF]" />
              <Badge className={s.active ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[10px]" : "bg-slate-100 text-slate-500 border-slate-200 text-[10px]"}>
                {s.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <span className="text-xs text-slate-400">{fmtDate(s.createdAt)}</span>
            <div className="flex items-center justify-end gap-1">
              <button onClick={() => onEdit(s)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#4982CF] transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pivot table (provider-specific tabs) ───────────────────────────────────
function PivotTable({
  services,
  providers,
  getSTName,
  toggleActive,
  onEdit,
  setProviderPrice,
}: {
  services: Service[];
  providers: Provider[];
  getSTName: (id: string) => string;
  toggleActive: (id: string) => void;
  onEdit: (s: Service) => void;
  setProviderPrice: (serviceId: string, providerId: string, price: number | undefined) => void;
}) {
  if (providers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
        <Columns className="h-10 w-10 text-slate-200 mb-3" />
        <p className="font-semibold text-slate-500">No active providers configured</p>
        <p className="text-sm text-slate-400 mt-1">Add providers in the catalog settings to compare prices here.</p>
      </div>
    );
  }

  const MIN_COL_W = 120;
  const providerColsStyle = `repeat(${providers.length}, minmax(${MIN_COL_W}px, 1fr))`;
  const gridTemplate = `minmax(200px,2fr) 70px 110px ${providerColsStyle} 80px`;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div
        className="grid items-center border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 min-w-max"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Service Name</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Taxable</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Status</span>
        {providers.map(p => (
          <span key={p.id} className="text-[9px] font-bold uppercase tracking-widest text-[#4982CF] text-right truncate px-2" title={p.name}>
            {p.name}
          </span>
        ))}
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</span>
      </div>

      <div className="divide-y divide-slate-100">
        {services.map(s => (
          <div
            key={s.id}
            className="grid items-center px-4 py-2.5 hover:bg-slate-50/60 transition-colors min-w-max"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {/* Service name */}
            <div className="min-w-0 pr-3">
              <p className="font-semibold text-sm text-slate-800 truncate">{s.name}</p>
              <p className="text-[10px] text-slate-400">{getSTName(s.serviceTypeId)}</p>
            </div>

            {/* Taxable */}
            <Badge className={s.taxable ? "bg-amber-500/10 text-amber-700 border-amber-200 text-[10px] w-fit" : "bg-slate-100 text-slate-500 border-slate-200 text-[10px] w-fit"}>
              {s.taxable ? "Yes" : "No"}
            </Badge>

            {/* Status toggle */}
            <div className="flex items-center gap-1.5">
              <Switch checked={s.active} onCheckedChange={() => toggleActive(s.id)} className="data-[state=checked]:bg-[#4982CF]" />
              <Badge className={s.active ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[10px]" : "bg-slate-100 text-slate-500 border-slate-200 text-[10px]"}>
                {s.active ? "Active" : "Inactive"}
              </Badge>
            </div>

            {/* One price cell per provider */}
            {providers.map(p => (
              <div key={p.id} className="px-1">
                <PriceCell
                  value={(s.providerPrices ?? {})[p.id]}
                  onSave={price => setProviderPrice(s.id, p.id, price)}
                />
              </div>
            ))}

            {/* Actions */}
            <div className="flex items-center justify-end gap-1">
              <button onClick={() => onEdit(s)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#4982CF] transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
