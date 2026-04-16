import { useState, useMemo } from "react";
import {
  Plus, Printer, Download, Search, Edit2, Trash2,
  ClipboardList, X, FileSpreadsheet, FileText, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ServiceType, Service } from "@/pages/BillingTypes";
import type { Department } from "@/pages/AdminSettings";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtCurrency(n: number) {
  return `Rs. ${n.toLocaleString()}`;
}

function exportToCSV(services: Service[], serviceTypes: ServiceType[], departments: Department[]) {
  const getSTName = (id: string) => serviceTypes.find(st => st.id === id)?.name ?? id;
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name ?? id;
  const getSubDeptName = (deptId: string, subId: string) =>
    departments.find(d => d.id === deptId)?.subDepartments.find(s => s.id === subId)?.name ?? subId;

  const rows = [
    ["Service Name", "Service Type", "Department", "Sub-Department", "Base Price (Rs.)", "Taxable", "Status", "Created"],
    ...services.map(s => [
      s.name,
      getSTName(s.serviceTypeId),
      getDeptName(s.departmentId),
      getSubDeptName(s.departmentId, s.subDepartmentId),
      s.basePrice,
      s.taxable ? "Yes" : "No",
      s.active ? "Active" : "Inactive",
      fmtDate(s.createdAt),
    ]),
  ];
  const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "service_pricing.csv"; a.click();
  URL.revokeObjectURL(url);
}

function exportToPrint(services: Service[], serviceTypes: ServiceType[], departments: Department[]) {
  const getSTName = (id: string) => serviceTypes.find(st => st.id === id)?.name ?? id;
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name ?? id;
  const getSubDeptName = (deptId: string, subId: string) =>
    departments.find(d => d.id === deptId)?.subDepartments.find(s => s.id === subId)?.name ?? subId;

  const rows = services.map(s => `
    <tr>
      <td>${s.name}</td><td>${getSTName(s.serviceTypeId)}</td>
      <td>${getDeptName(s.departmentId)} / ${getSubDeptName(s.departmentId, s.subDepartmentId)}</td>
      <td>${fmtCurrency(s.basePrice)}</td><td>${s.taxable ? "Yes" : "No"}</td>
      <td>${s.active ? "Active" : "Inactive"}</td><td>${fmtDate(s.createdAt)}</td>
    </tr>`).join("");

  const html = `<html><head><title>Service Pricing</title>
    <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ddd;padding:8px;font-size:12px}th{background:#f1f5f9;font-weight:bold}
    h1{font-size:18px;margin-bottom:16px}</style></head>
    <body><h1>Service Pricing Report</h1>
    <table><thead><tr><th>Service Name</th><th>Service Type</th><th>Dept/Sub-Dept</th>
    <th>Base Price</th><th>Taxable</th><th>Status</th><th>Created</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

type FormState = {
  name: string;
  serviceTypeId: string;
  basePrice: string;
  departmentId: string;
  subDepartmentId: string;
  active: boolean;
  taxable: boolean;
};

function blankForm(): FormState {
  return { name: "", serviceTypeId: "", basePrice: "", departmentId: "", subDepartmentId: "", active: true, taxable: false };
}

export function ServicePricingModule({
  serviceTypes,
  services,
  setServices,
  departments,
}: {
  serviceTypes: ServiceType[];
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  departments: Department[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const activeServiceTypes = serviceTypes.filter(st => st.active);

  const openAdd = () => { setForm(blankForm()); setEditingId(null); setShowForm(true); };
  const openEdit = (s: Service) => {
    setForm({
      name: s.name, serviceTypeId: s.serviceTypeId, basePrice: String(s.basePrice),
      departmentId: s.departmentId, subDepartmentId: s.subDepartmentId, active: s.active, taxable: s.taxable,
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const saveForm = () => {
    const name = form.name.trim();
    const basePrice = parseFloat(form.basePrice);
    if (!name || !form.serviceTypeId || isNaN(basePrice) || !form.departmentId) return;

    if (editingId) {
      setServices(prev => prev.map(s => s.id === editingId
        ? { ...s, name, serviceTypeId: form.serviceTypeId, basePrice, departmentId: form.departmentId, subDepartmentId: form.subDepartmentId, active: form.active, taxable: form.taxable }
        : s));
    } else {
      const newS: Service = {
        id: `svc-${Date.now()}`, name, serviceTypeId: form.serviceTypeId, basePrice,
        departmentId: form.departmentId, subDepartmentId: form.subDepartmentId,
        active: form.active, taxable: form.taxable, createdAt: new Date().toISOString(),
      };
      setServices(prev => [...prev, newS]);
    }
    setShowForm(false);
  };

  const toggleActive = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    setDeleteConfirm(null);
  };

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

  const selectedDept = departments.find(d => d.id === form.departmentId);

  const isFormValid = form.name.trim() && form.serviceTypeId && form.basePrice && form.departmentId;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top toolbar */}
      <div className="flex-none border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Service Pricing</h1>
            <p className="mt-0.5 text-sm text-slate-500">Manage all billable services and their base prices.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-slate-600"
              onClick={() => exportToPrint(visibleServices, serviceTypes, departments)}
              disabled={visibleServices.length === 0}
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-slate-600"
              onClick={() => exportToCSV(visibleServices, serviceTypes, departments)}
              disabled={visibleServices.length === 0}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export Excel
            </Button>
            <Button
              onClick={openAdd}
              className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 ml-2"
              data-testid="btn-add-service"
            >
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Tabs + search */}
        <div className="mt-4 flex items-center gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="h-8 bg-slate-100">
              <TabsTrigger value="all" className="h-7 text-xs">
                All <span className="ml-1.5 rounded bg-slate-200 px-1.5 text-[10px] font-bold">{services.length}</span>
              </TabsTrigger>
              {activeServiceTypes.map(st => {
                const count = services.filter(s => s.serviceTypeId === st.id).length;
                return (
                  <TabsTrigger key={st.id} value={st.id} className="h-7 text-xs">
                    {st.name}
                    {count > 0 && <span className="ml-1.5 rounded bg-slate-200 px-1.5 text-[10px] font-bold">{count}</span>}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          <div className="relative w-56 flex-none">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search services…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 px-6 pb-6 pt-4">
        {visibleServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-20 text-slate-400">
            <ClipboardList className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-semibold text-slate-500">{search ? "No services match your search" : "No services yet"}</p>
            <p className="mt-1 text-sm">{search ? "Try a different keyword." : 'Click "Add Service" to create your first service.'}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Column headers */}
            <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_80px_100px_140px_80px] items-center border-b border-slate-100 bg-slate-50/80 px-5 py-2.5">
              {["Service Name", "Service Type", "Dept / Sub-Dept", "Base Price", "Taxable", "Status", "Created", ""].map(h => (
                <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {visibleServices.map(s => (
                <div key={s.id} className="grid grid-cols-[2fr_1fr_1.5fr_1fr_80px_100px_140px_80px] items-center px-5 py-3 hover:bg-slate-50/60 transition-colors">
                  <span className="font-semibold text-slate-800 truncate pr-2">{s.name}</span>
                  <Badge variant="outline" className="w-fit text-[10px] font-semibold text-[#4982CF] border-[#4982CF]/30 bg-[#4982CF]/5">
                    {getSTName(s.serviceTypeId)}
                  </Badge>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-700">{getDeptName(s.departmentId)}</p>
                    {s.subDepartmentId && <p className="truncate text-[10px] text-slate-400">{getSubDeptName(s.departmentId, s.subDepartmentId)}</p>}
                  </div>
                  <span className="text-sm font-bold text-slate-800">Rs. {s.basePrice.toLocaleString()}</span>
                  <Badge className={s.taxable ? "bg-amber-500/10 text-amber-700 border-amber-200 text-[10px] w-fit" : "bg-slate-100 text-slate-500 border-slate-200 text-[10px] w-fit"}>
                    {s.taxable ? "Yes" : "No"}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={s.active}
                      onCheckedChange={() => toggleActive(s.id)}
                      className="data-[state=checked]:bg-[#4982CF]"
                    />
                    <Badge className={s.active ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[10px]" : "bg-slate-100 text-slate-500 border-slate-200 text-[10px]"}>
                      {s.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400">{fmtDate(s.createdAt)}</span>
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => openEdit(s)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#4982CF] transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setDeleteConfirm(s.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={open => !open && setShowForm(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Service" : "Add Service"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 pt-2">
            {/* Service Name */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Service Name <span className="text-rose-500">*</span></Label>
              <Input placeholder="e.g. Blood Test — CBC" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            {/* Service Type */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Service Type <span className="text-rose-500">*</span></Label>
              <Select value={form.serviceTypeId} onValueChange={v => setForm(f => ({ ...f, serviceTypeId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type…" />
                </SelectTrigger>
                <SelectContent>
                  {activeServiceTypes.map(st => (
                    <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Base Price */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Base Price (Rs.) <span className="text-rose-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">Rs.</span>
                <Input
                  type="number" min={0} placeholder="0"
                  value={form.basePrice}
                  onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Department */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-600">Department <span className="text-rose-500">*</span></Label>
                <Select value={form.departmentId} onValueChange={v => setForm(f => ({ ...f, departmentId: v, subDepartmentId: "" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dept…" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-dept…" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedDept?.subDepartments.map(sd => (
                      <SelectItem key={sd.id} value={sd.id}>{sd.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Toggles */}
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
              <Button onClick={saveForm} disabled={!isFormValid} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white">
                {editingId ? "Save Changes" : "Add Service"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Service?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">
            <strong>{services.find(s => s.id === deleteConfirm)?.name}</strong> will be permanently removed.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button onClick={() => deleteService(deleteConfirm!)} className="bg-rose-500 hover:bg-rose-600 text-white">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
