import { useState, useMemo } from "react";
import {
  Plus, Building, Edit2, Trash2, ChevronRight, Search,
  CreditCard, Upload, X, Info,
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

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function computeAdjustedPrice(basePrice: number, rule: PricingRule | undefined): number {
  if (!rule || rule.value === 0) return basePrice;
  if (rule.type === "percentage") return Math.round(basePrice * (1 + rule.value / 100));
  return Math.round(basePrice + rule.value);
}

type EntityFormState = {
  name: string;
  contactPerson: string;
  contactPhone: string;
  email: string;
  mouFileName: string;
  creditEnabled: boolean;
  creditLimit: string;
  useBaseForNew: boolean;
};

function blankEntityForm(): EntityFormState {
  return { name: "", contactPerson: "", contactPhone: "", email: "", mouFileName: "", creditEnabled: false, creditLimit: "", useBaseForNew: false };
}

type BulkRuleState = {
  scope: "all" | string; // serviceTypeId or "all"
  type: "percentage" | "fixed";
  value: string;
};

export function CorporatePricingModule({
  serviceTypes,
  services,
  entityLabel = "Corporate",
}: {
  serviceTypes: ServiceType[];
  services: Service[];
  entityLabel?: string;
}) {
  const [entities, setEntities] = useState<BillingEntity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [entityForm, setEntityForm] = useState<EntityFormState>(blankEntityForm);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkRule, setBulkRule] = useState<BulkRuleState>({ scope: "all", type: "percentage", value: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pricingRuleForm, setPricingRuleForm] = useState<Record<string, { type: "percentage" | "fixed"; value: string }>>({});

  const selectedEntity = entities.find(e => e.id === selectedId) ?? null;

  function buildEntityServices(entity: BillingEntity): EntityService[] {
    return services.map(s => {
      const existing = entity.entityServices.find(es => es.serviceId === s.id);
      if (existing) return existing;
      const rule = entity.pricingRules[s.serviceTypeId];
      return { serviceId: s.id, price: computeAdjustedPrice(s.basePrice, rule), overridden: false };
    });
  }

  const openAddEntity = () => {
    setEntityForm(blankEntityForm());
    setEditingEntityId(null);
    setShowEntityForm(true);
  };

  const openEditEntity = (e: BillingEntity) => {
    setEntityForm({
      name: e.name, contactPerson: e.contactPerson, contactPhone: e.contactPhone,
      email: e.email, mouFileName: e.mouFileName,
      creditEnabled: e.creditEnabled, creditLimit: String(e.creditLimit),
      useBaseForNew: e.useBaseForNew,
    });
    setEditingEntityId(e.id);
    setShowEntityForm(true);
  };

  const saveEntityForm = () => {
    const name = entityForm.name.trim();
    if (!name) return;
    if (editingEntityId) {
      setEntities(prev => prev.map(e => e.id === editingEntityId
        ? { ...e, name, contactPerson: entityForm.contactPerson, contactPhone: entityForm.contactPhone,
            email: entityForm.email, mouFileName: entityForm.mouFileName,
            creditEnabled: entityForm.creditEnabled, creditLimit: parseFloat(entityForm.creditLimit) || 0,
            useBaseForNew: entityForm.useBaseForNew }
        : e));
    } else {
      const newE: BillingEntity = {
        id: `ent-${Date.now()}`,
        name,
        contactPerson: entityForm.contactPerson,
        contactPhone: entityForm.contactPhone,
        email: entityForm.email,
        mouFileName: entityForm.mouFileName,
        creditEnabled: entityForm.creditEnabled,
        creditLimit: parseFloat(entityForm.creditLimit) || 0,
        useBaseForNew: entityForm.useBaseForNew,
        pricingRules: {},
        entityServices: [],
        createdAt: new Date().toISOString(),
      };
      setEntities(prev => [...prev, newE]);
      setSelectedId(newE.id);
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
      if (rf && rf.value) {
        newRules[st.id] = { type: rf.type, value: parseFloat(rf.value) || 0 };
      }
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
      if (exists) {
        return { ...e, entityServices: e.entityServices.map(es => es.serviceId === serviceId ? { ...es, price: p, overridden: true } : es) };
      }
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
        const newPrice = bulkRule.type === "percentage"
          ? Math.round(es.price * (1 + ruleVal / 100))
          : Math.round(es.price + ruleVal);
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

  const groupedServices = useMemo(() => {
    return serviceTypes.map(st => ({
      st,
      svcs: services.filter(s => s.serviceTypeId === st.id && s.active),
    })).filter(g => g.svcs.length > 0);
  }, [serviceTypes, services]);

  const openBulkDialog = () => {
    setBulkRule({ scope: "all", type: "percentage", value: "" });
    setShowBulkDialog(true);
  };

  // Initialize pricing rule form when entity changes
  const initPricingForm = (entity: BillingEntity) => {
    const init: Record<string, { type: "percentage" | "fixed"; value: string }> = {};
    serviceTypes.forEach(st => {
      const rule = entity.pricingRules[st.id];
      init[st.id] = { type: rule?.type ?? "percentage", value: rule ? String(rule.value) : "" };
    });
    setPricingRuleForm(init);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: entity list */}
      <aside className="flex w-72 flex-none flex-col border-r border-slate-200 bg-white">
        <div className="flex-none border-b border-slate-100 p-4">
          <Button onClick={openAddEntity} className="w-full bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 mb-3">
            <Plus className="h-4 w-4" />
            Add {entityLabel}
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
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => { setSelectedId(e.id); initPricingForm(e); }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${isSelected ? "bg-[#4982CF]/8 border-l-2 border-[#4982CF]" : "hover:bg-slate-50 border-l-2 border-transparent"}`}
              >
                <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-xs font-bold ${isSelected ? "bg-[#4982CF] text-white" : "bg-slate-100 text-slate-600"}`}>
                  {initials(e.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${isSelected ? "text-[#4982CF]" : "text-slate-700"}`}>{e.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{e.email || "No email"}</p>
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

      {/* Right: entity detail */}
      <div className="flex-1 overflow-hidden bg-slate-50/50">
        {!selectedEntity ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-400">
            <Building className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-semibold text-slate-500">Select a {entityLabel.toLowerCase()}</p>
            <p className="mt-1 text-sm">Choose from the list to view and configure pricing.</p>
          </div>
        ) : (
          <Tabs defaultValue="info" className="flex h-full flex-col">
            {/* Detail header */}
            <div className="flex-none border-b border-slate-200 bg-white px-6 pt-4 pb-0">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4982CF] text-sm font-bold text-white">
                    {initials(selectedEntity.name)}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">{selectedEntity.name}</h2>
                    <p className="text-xs text-slate-500">{selectedEntity.email || selectedEntity.contactPerson || "—"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditEntity(selectedEntity)} className="gap-1.5">
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(selectedEntity.id)} className="gap-1.5 text-rose-500 border-rose-200 hover:bg-rose-50">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
              <TabsList className="h-8 bg-transparent rounded-none border-b-0 gap-4 px-0 pb-0">
                <TabsTrigger value="info" className="h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-[#4982CF] data-[state=active]:text-[#4982CF] text-xs px-0">
                  Info & Credit
                </TabsTrigger>
                <TabsTrigger value="rules" className="h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-[#4982CF] data-[state=active]:text-[#4982CF] text-xs px-0">
                  Pricing Rules
                </TabsTrigger>
                <TabsTrigger value="services" className="h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-[#4982CF] data-[state=active]:text-[#4982CF] text-xs px-0">
                  Service Prices
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Info Tab */}
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

            {/* Pricing Rules Tab */}
            <TabsContent value="rules" className="flex-1 overflow-y-auto px-6 py-5 mt-0">
              <div className="max-w-2xl space-y-4">
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                  <Info className="mt-0.5 h-4 w-4 flex-none text-blue-500" />
                  <p className="text-xs text-blue-700">
                    Set pricing adjustments per service type. These rules auto-apply when computing prices for this {entityLabel.toLowerCase()}. Save rules to update all non-overridden service prices.
                  </p>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="grid grid-cols-[1fr_120px_1fr_100px] items-center border-b border-slate-100 bg-slate-50/80 px-5 py-2.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Service Type</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Adjustment</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Amount</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400"></span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {serviceTypes.map(st => {
                      const rf = pricingRuleForm[st.id] ?? { type: "percentage", value: "" };
                      return (
                        <div key={st.id} className="grid grid-cols-[1fr_120px_1fr_100px] items-center px-5 py-3 gap-3">
                          <span className="text-sm font-semibold text-slate-700">{st.name}</span>
                          <div className="flex overflow-hidden rounded-md border border-slate-200">
                            {(["percentage", "fixed"] as const).map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setPricingRuleForm(prev => ({ ...prev, [st.id]: { ...rf, type: t } }))}
                                className={`flex-1 px-2 py-1.5 text-[11px] font-bold transition-colors ${rf.type === t ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                              >
                                {t === "percentage" ? "%" : "Rs."}
                              </button>
                            ))}
                          </div>
                          <Input
                            type="number" min={0}
                            placeholder={rf.type === "percentage" ? "e.g. 10" : "e.g. 500"}
                            value={rf.value}
                            onChange={e => setPricingRuleForm(prev => ({ ...prev, [st.id]: { ...rf, value: e.target.value } }))}
                            className="h-8 text-sm"
                          />
                          {rf.value && (
                            <span className="text-[10px] text-slate-400">
                              Increase by {rf.type === "percentage" ? `${rf.value}%` : `Rs. ${rf.value}`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <Button onClick={savePricingRules} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white">
                  Save Pricing Rules & Recalculate
                </Button>
              </div>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="flex-1 overflow-y-auto px-6 py-5 mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{services.length} services loaded · Edit prices individually or use bulk update.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openBulkDialog}
                    className="gap-1.5 border-[#4982CF]/30 text-[#4982CF] hover:bg-[#4982CF]/5"
                    disabled={services.length === 0}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Change Price (Bulk)
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
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Service</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Base Price</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{entityLabel} Price</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {svcs.map(s => {
                            const entityPrice = entityServiceMap[s.id] ?? s.basePrice;
                            const diff = entityPrice - s.basePrice;
                            return (
                              <div key={s.id} className="grid grid-cols-[2fr_1fr_1fr] items-center px-5 py-3 hover:bg-slate-50/60 transition-colors gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                                </div>
                                <span className="text-sm text-slate-500">Rs. {s.basePrice.toLocaleString()}</span>
                                <div>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">Rs.</span>
                                    <Input
                                      type="number" min={0}
                                      value={entityPrice}
                                      onChange={e => updateServicePrice(s.id, e.target.value)}
                                      className="h-8 pl-8 text-sm"
                                    />
                                  </div>
                                  {diff !== 0 && (
                                    <span className={`text-[10px] font-medium ${diff > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                                      {diff > 0 ? "+" : ""}Rs. {diff.toLocaleString()} from base
                                    </span>
                                  )}
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

      {/* Add/Edit Entity Dialog */}
      <Dialog open={showEntityForm} onOpenChange={open => !open && setShowEntityForm(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEntityId ? `Edit ${entityLabel}` : `Add ${entityLabel}`}</DialogTitle>
          </DialogHeader>
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
            {/* MOU Upload (simulated) */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Upload MOU (PDF)</Label>
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-500 hover:border-[#4982CF]/50 hover:bg-[#4982CF]/5 transition-colors">
                  <Upload className="h-4 w-4 text-slate-400" />
                  {entityForm.mouFileName || "Choose PDF file…"}
                  <input
                    type="file" accept=".pdf" className="hidden"
                    onChange={e => setEntityForm(f => ({ ...f, mouFileName: e.target.files?.[0]?.name ?? "" }))}
                  />
                </label>
                {entityForm.mouFileName && (
                  <button type="button" onClick={() => setEntityForm(f => ({ ...f, mouFileName: "" }))} className="text-slate-400 hover:text-rose-500">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {/* Credit */}
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
            {/* New service default */}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">New services pricing</p>
                <p className="text-xs text-slate-400">When new services are added to the system</p>
              </div>
              <div className="flex overflow-hidden rounded-md border border-slate-200">
                <button type="button" onClick={() => setEntityForm(f => ({ ...f, useBaseForNew: true }))} className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors ${entityForm.useBaseForNew ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                  Base
                </button>
                <button type="button" onClick={() => setEntityForm(f => ({ ...f, useBaseForNew: false }))} className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors ${!entityForm.useBaseForNew ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                  Adjusted
                </button>
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

      {/* Bulk price update dialog */}
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

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete {entityLabel}?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">
            <strong>{entities.find(e => e.id === deleteConfirm)?.name}</strong> and all their pricing configurations will be removed.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button onClick={() => deleteEntity(deleteConfirm!)} className="bg-rose-500 hover:bg-rose-600 text-white">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
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
