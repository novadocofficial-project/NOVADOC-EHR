import { useState } from "react";
import {
  Plus, Edit2, Trash2, GitBranch, Clock, Globe, Search, AlertCircle, Check,
  FlaskConical, Stethoscope, ChevronDown, ChevronRight, ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LabProvider, LabSection } from "@/pages/LabCatalogModule";
import type { ProcedurePartner, ProcedureSection } from "@/pages/ProcedureCatalogModule";
import type { ImagingPartner } from "@/pages/ImagingCatalogModule";

type Branch = {
  id: string;
  name: string;
  code: string;
  timezone: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  tokenResetTime: string;
  status: "active" | "inactive";
  createdAt: string;
};

const TIMEZONES = [
  "Asia/Karachi", "Asia/Dubai", "Asia/Kolkata", "Asia/Dhaka",
  "Asia/Riyadh", "Europe/London", "America/New_York", "America/Chicago",
];

const BLANK: Omit<Branch, "id" | "createdAt"> = {
  name: "", code: "", timezone: "Asia/Karachi",
  workingHoursStart: "08:00", workingHoursEnd: "22:00",
  tokenResetTime: "00:00", status: "active",
};

const SEED: Branch[] = [
  {
    id: "br-1", name: "Main Branch — Lahore", code: "LHR-MAIN",
    timezone: "Asia/Karachi", workingHoursStart: "08:00", workingHoursEnd: "22:00",
    tokenResetTime: "00:00", status: "active", createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "br-2", name: "North Branch — Islamabad", code: "ISB-NORTH",
    timezone: "Asia/Karachi", workingHoursStart: "09:00", workingHoursEnd: "20:00",
    tokenResetTime: "00:00", status: "active", createdAt: "2024-06-15T00:00:00.000Z",
  },
  {
    id: "br-3", name: "East Branch — Karachi", code: "KHI-EAST",
    timezone: "Asia/Karachi", workingHoursStart: "07:30", workingHoursEnd: "21:00",
    tokenResetTime: "00:00", status: "inactive", createdAt: "2024-09-01T00:00:00.000Z",
  },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}
function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ─── Lab Assignment Tab ────────────────────────────────────────────────────────

function LabAssignmentTab({ branches, labProviders, labSections, onNavigate }: { branches: Branch[]; labProviders: LabProvider[]; labSections: LabSection[]; onNavigate?: (section: string) => void }) {
  const activeProviders = labProviders.filter(p => p.active);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "br-1": true });
  const [enabled, setEnabled]   = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    branches.forEach(b => { init[b.id] = new Set(activeProviders.map(p => p.id)); });
    return init;
  });
  const [primary, setPrimary] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    branches.forEach(b => { init[b.id] = activeProviders[0]?.id ?? null; });
    return init;
  });
  const [viewPricingKey, setViewPricingKey] = useState<string | null>(null);

  const allTests = labSections.flatMap(s => s.tests);

  if (activeProviders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-300">
        <FlaskConical className="h-12 w-12 mb-3" />
        <p className="text-sm font-semibold text-slate-400">No lab providers configured yet</p>
        <p className="text-xs text-slate-400 mt-1 mb-3">Add active providers in the Lab Catalog first.</p>
        {onNavigate && (
          <Button variant="outline" className="text-xs h-8 gap-1.5 text-[#4982CF] border-[#4982CF]/30" onClick={() => onNavigate("lab-providers")}>
            <FlaskConical className="h-3.5 w-3.5" /> Go to Lab Providers
          </Button>
        )}
      </div>
    );
  }

  function toggleEnabled(branchId: string, providerId: string) {
    setEnabled(e => {
      const next = new Set(e[branchId]);
      if (next.has(providerId)) {
        next.delete(providerId);
        if (primary[branchId] === providerId) setPrimary(p => ({ ...p, [branchId]: [...next][0] ?? null }));
      } else {
        next.add(providerId);
      }
      return { ...e, [branchId]: next };
    });
  }

  return (
    <div className="space-y-3">
      {branches.map(branch => {
        const isExpanded = expanded[branch.id];
        const enabledSet = enabled[branch.id] ?? new Set();
        const prim = primary[branch.id];
        return (
          <div key={branch.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={() => setExpanded(e => ({ ...e, [branch.id]: !e[branch.id] }))}
              className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50/50">
              <div className="h-8 w-8 rounded-xl bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
                <GitBranch className="h-4 w-4 text-[#4982CF]" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-800">{branch.name}</p>
                <p className="text-[10px] text-slate-400">
                  {enabledSet.size} of {activeProviders.length} providers enabled
                  {prim && ` · Primary: ${labProviders.find(p => p.id === prim)?.name ?? "—"}`}
                </p>
              </div>
              <Badge variant="outline" className={`text-[9px] ${branch.status === "active" ? "text-emerald-600 border-emerald-200" : "text-slate-400 border-slate-200"}`}>
                {branch.status}
              </Badge>
              {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100">
                <div className="grid grid-cols-[1fr_80px_80px] text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <span>Provider</span><span className="text-center">Enabled</span><span className="text-center">Primary</span>
                </div>
                {activeProviders.map(prov => {
                  const isEnabled = enabledSet.has(prov.id);
                  const isPrimary = primary[branch.id] === prov.id;
                  const pricingKey = `${branch.id}:${prov.id}`;
                  const showPricing = viewPricingKey === pricingKey;
                  const pricedTests = prov.selectedTests.filter(tid => prov.pricing[tid]);
                  return (
                    <div key={prov.id} className="border-b border-slate-50 last:border-0">
                      <div className="grid grid-cols-[1fr_80px_80px] items-center px-4 py-2.5">
                        <div>
                          <p className="text-xs font-medium text-slate-700">{prov.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {prov.selectedTests.length > 0 && (
                              <button onClick={() => setViewPricingKey(showPricing ? null : pricingKey)}
                                className="text-[9px] font-bold text-[#4982CF] hover:opacity-70 flex items-center gap-0.5">
                                {showPricing ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
                                View Pricing ({pricedTests.length} priced)
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <Switch checked={isEnabled} onCheckedChange={() => toggleEnabled(branch.id, prov.id)} className="data-[state=checked]:bg-[#4982CF]" />
                        </div>
                        <div className="flex justify-center">
                          <input type="radio" name={`lab-primary-${branch.id}`} disabled={!isEnabled}
                            checked={isPrimary && isEnabled}
                            onChange={() => setPrimary(p => ({ ...p, [branch.id]: prov.id }))}
                            className="accent-[#4982CF] h-4 w-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40" />
                        </div>
                      </div>
                      {showPricing && (
                        <div className="mx-4 mb-3 rounded-xl border border-[#4982CF]/20 overflow-hidden bg-blue-50/30">
                          <div className="grid grid-cols-[1fr_100px] text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 py-1.5 bg-slate-50/80 border-b border-slate-100">
                            <span>Test</span><span className="text-right">Price (PKR)</span>
                          </div>
                          {prov.selectedTests.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-3">No tests selected</p>
                          ) : (
                            prov.selectedTests.map(tid => {
                              const test = allTests.find(t => t.id === tid);
                              return (
                                <div key={tid} className="grid grid-cols-[1fr_100px] items-center px-3 py-1.5 border-b border-slate-50 last:border-0">
                                  <span className="text-xs text-slate-700">{test?.name ?? tid}</span>
                                  <span className="text-xs text-right font-mono text-slate-600">{prov.pricing[tid] ? `PKR ${prov.pricing[tid]}` : <span className="text-slate-300">—</span>}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Procedure Partners Tab ───────────────────────────────────────────────────

function ProcedurePartnersTab({ branches, procPartners, procSections, onNavigate }: { branches: Branch[]; procPartners: ProcedurePartner[]; procSections: ProcedureSection[]; onNavigate?: (section: string) => void }) {
  const activePartners = procPartners.filter(p => p.active);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "br-1": true });
  const [enabled, setEnabled]   = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    branches.forEach(b => { init[b.id] = new Set(activePartners.map(p => p.id)); });
    return init;
  });
  const [primary, setPrimary] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    branches.forEach(b => { init[b.id] = activePartners[0]?.id ?? null; });
    return init;
  });
  const [viewPricingKey, setViewPricingKey] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const allProcs = procSections.flatMap(s => s.procedures);

  if (activePartners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-300">
        <Stethoscope className="h-12 w-12 mb-3" />
        <p className="text-sm font-semibold text-slate-400">No procedure partners configured yet</p>
        <p className="text-xs text-slate-400 mt-1 mb-3">Add active partners in the Procedure Catalog first.</p>
        {onNavigate && (
          <Button variant="outline" className="text-xs h-8 gap-1.5 text-[#4982CF] border-[#4982CF]/30" onClick={() => onNavigate("proc-partners")}>
            <Stethoscope className="h-3.5 w-3.5" /> Go to Procedure Partners
          </Button>
        )}
      </div>
    );
  }

  function toggleEnabled(branchId: string, partnerId: string) {
    setEnabled(e => {
      const next = new Set(e[branchId]);
      if (next.has(partnerId)) {
        next.delete(partnerId);
        if (primary[branchId] === partnerId) setPrimary(p => ({ ...p, [branchId]: [...next][0] ?? null }));
      } else {
        next.add(partnerId);
      }
      return { ...e, [branchId]: next };
    });
  }

  const TYPE_COLORS: Record<string, string> = {
    "Internal Clinic":  "text-blue-600 border-blue-200",
    "External Provider":"text-amber-600 border-amber-200",
  };

  return (
    <div className="space-y-3">
      {branches.map(branch => {
        const isExpanded = expanded[branch.id];
        const enabledSet = enabled[branch.id] ?? new Set();
        const prim = primary[branch.id];
        return (
          <div key={branch.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={() => setExpanded(e => ({ ...e, [branch.id]: !e[branch.id] }))}
              className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50/50">
              <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <GitBranch className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-800">{branch.name}</p>
                <p className="text-[10px] text-slate-400">
                  {enabledSet.size} of {activePartners.length} partners enabled
                  {prim && ` · Primary: ${procPartners.find(p => p.id === prim)?.name ?? "—"}`}
                </p>
              </div>
              <Badge variant="outline" className={`text-[9px] ${branch.status === "active" ? "text-emerald-600 border-emerald-200" : "text-slate-400 border-slate-200"}`}>
                {branch.status}
              </Badge>
              {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100">
                <div className="grid grid-cols-[1fr_110px_80px_80px] text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <span>Partner</span><span>Type</span><span className="text-center">Enabled</span><span className="text-center">Primary</span>
                </div>
                {activePartners.map(partner => {
                  const isEnabled = enabledSet.has(partner.id);
                  const isPrimary = primary[branch.id] === partner.id;
                  const pricingKey = `${branch.id}:${partner.id}`;
                  const showPricing = viewPricingKey === pricingKey;
                  const noteKey = `${branch.id}:${partner.id}`;
                  const pricedProcs = partner.selectedProcedures.filter(pid => partner.pricing[pid]);
                  return (
                    <div key={partner.id} className="border-b border-slate-50 last:border-0">
                      <div className="grid grid-cols-[1fr_110px_80px_80px] items-center px-4 py-2.5">
                        <div>
                          <p className="text-xs font-medium text-slate-700">{partner.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {partner.selectedProcedures.length > 0 && (
                              <button onClick={() => setViewPricingKey(showPricing ? null : pricingKey)}
                                className="text-[9px] font-bold text-[#4982CF] hover:opacity-70 flex items-center gap-0.5">
                                {showPricing ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
                                View Pricing ({pricedProcs.length} priced)
                              </button>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 w-fit ${TYPE_COLORS[partner.type] ?? ""}`}>{partner.type}</Badge>
                        <div className="flex justify-center">
                          <Switch checked={isEnabled} onCheckedChange={() => toggleEnabled(branch.id, partner.id)} className="data-[state=checked]:bg-[#4982CF]" />
                        </div>
                        <div className="flex justify-center">
                          <input type="radio" name={`proc-primary-${branch.id}`} disabled={!isEnabled}
                            checked={isPrimary && isEnabled}
                            onChange={() => setPrimary(p => ({ ...p, [branch.id]: partner.id }))}
                            className="accent-[#4982CF] h-4 w-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40" />
                        </div>
                      </div>
                      {partner.type === "External Provider" && (
                        <div className="mx-4 mb-2">
                          <input
                            value={notes[noteKey] ?? ""}
                            onChange={e => setNotes(n => ({ ...n, [noteKey]: e.target.value }))}
                            placeholder="Contract reference / note (optional)"
                            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4982CF] bg-amber-50/30"
                          />
                        </div>
                      )}
                      {showPricing && (
                        <div className="mx-4 mb-3 rounded-xl border border-[#4982CF]/20 overflow-hidden bg-blue-50/30">
                          <div className="grid grid-cols-[1fr_90px_90px] text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 py-1.5 bg-slate-50/80 border-b border-slate-100">
                            <span>Procedure</span><span className="text-right">Price (PKR)</span><span className="text-right">Doctor Rate</span>
                          </div>
                          {partner.selectedProcedures.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-3">No procedures selected</p>
                          ) : (
                            partner.selectedProcedures.map(pid => {
                              const proc = allProcs.find(p => p.id === pid);
                              return (
                                <div key={pid} className="grid grid-cols-[1fr_90px_90px] items-center px-3 py-1.5 border-b border-slate-50 last:border-0">
                                  <div>
                                    <span className="text-xs text-slate-700">{proc?.name ?? pid}</span>
                                    {proc?.cptCode && <span className="ml-1.5 text-[9px] text-slate-400 font-mono">{proc.cptCode}</span>}
                                  </div>
                                  <span className="text-xs text-right font-mono text-slate-600">{partner.pricing[pid] ? `PKR ${partner.pricing[pid]}` : <span className="text-slate-300">—</span>}</span>
                                  <span className="text-xs text-right font-mono text-slate-500">{partner.doctorRate[pid] ? `PKR ${partner.doctorRate[pid]}` : <span className="text-slate-300">—</span>}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Imaging Partners Tab ─────────────────────────────────────────────────────

const IMAGING_CATALOGUE_KEY = "ehr-imaging-catalogue-v1";

function loadImagingTests(): { id: string; name: string }[] {
  try {
    const raw = localStorage.getItem(IMAGING_CATALOGUE_KEY);
    if (raw) return JSON.parse(raw) as { id: string; name: string }[];
  } catch { /**/ }
  return [];
}

function ImagingPartnersTab({ branches, imagingPartners, onNavigate }: { branches: Branch[]; imagingPartners: ImagingPartner[]; onNavigate?: (section: string) => void }) {
  const activePartners = imagingPartners.filter(p => p.active);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "br-1": true });
  const [enabled, setEnabled] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    branches.forEach(b => { init[b.id] = new Set(activePartners.map(p => p.id)); });
    return init;
  });
  const [primary, setPrimary] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    branches.forEach(b => { init[b.id] = activePartners[0]?.id ?? null; });
    return init;
  });
  const [viewPricingKey, setViewPricingKey] = useState<string | null>(null);

  const allTests = loadImagingTests();

  if (activePartners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-300">
        <ScanLine className="h-12 w-12 mb-3" />
        <p className="text-sm font-semibold text-slate-400">No imaging partners configured yet</p>
        <p className="text-xs text-slate-400 mt-1 mb-3">Add active partners in the Imaging Catalog first.</p>
        {onNavigate && (
          <Button variant="outline" className="text-xs h-8 gap-1.5 text-[#4982CF] border-[#4982CF]/30" onClick={() => onNavigate("imaging-partners")}>
            <ScanLine className="h-3.5 w-3.5" /> Go to Imaging Partners
          </Button>
        )}
      </div>
    );
  }

  function toggleEnabled(branchId: string, partnerId: string) {
    setEnabled(e => {
      const next = new Set(e[branchId]);
      if (next.has(partnerId)) {
        next.delete(partnerId);
        if (primary[branchId] === partnerId) setPrimary(p => ({ ...p, [branchId]: [...next][0] ?? null }));
      } else {
        next.add(partnerId);
      }
      return { ...e, [branchId]: next };
    });
  }

  const TYPE_COLORS: Record<string, string> = {
    "Internal Radiology": "text-blue-600 border-blue-200",
    "External Centre":    "text-amber-600 border-amber-200",
  };

  return (
    <div className="space-y-3">
      {branches.map(branch => {
        const isExpanded = expanded[branch.id];
        const enabledSet = enabled[branch.id] ?? new Set();
        const prim = primary[branch.id];
        return (
          <div key={branch.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={() => setExpanded(e => ({ ...e, [branch.id]: !e[branch.id] }))}
              className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50/50">
              <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <GitBranch className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-800">{branch.name}</p>
                <p className="text-[10px] text-slate-400">
                  {enabledSet.size} of {activePartners.length} partners enabled
                  {prim && ` · Primary: ${imagingPartners.find(p => p.id === prim)?.name ?? "—"}`}
                </p>
              </div>
              <Badge variant="outline" className={`text-[9px] ${branch.status === "active" ? "text-emerald-600 border-emerald-200" : "text-slate-400 border-slate-200"}`}>
                {branch.status}
              </Badge>
              {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100">
                <div className="grid grid-cols-[1fr_120px_80px_80px] text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <span>Partner</span><span>Type</span><span className="text-center">Enabled</span><span className="text-center">Primary</span>
                </div>
                {activePartners.map(partner => {
                  const isEnabled = enabledSet.has(partner.id);
                  const isPrimary = primary[branch.id] === partner.id;
                  const pricingKey = `${branch.id}:${partner.id}`;
                  const showPricing = viewPricingKey === pricingKey;
                  const pricedTests = partner.selectedTests.filter(tid => partner.pricing[tid]);
                  return (
                    <div key={partner.id} className="border-b border-slate-50 last:border-0">
                      <div className="grid grid-cols-[1fr_120px_80px_80px] items-center px-4 py-2.5">
                        <div>
                          <p className="text-xs font-medium text-slate-700">{partner.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {partner.contact && (
                              <span className="text-[9px] text-slate-400 font-mono">{partner.contact}</span>
                            )}
                            {partner.selectedTests.length > 0 && (
                              <button onClick={() => setViewPricingKey(showPricing ? null : pricingKey)}
                                className="text-[9px] font-bold text-[#4982CF] hover:opacity-70 flex items-center gap-0.5">
                                {showPricing ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
                                View Pricing ({pricedTests.length} priced)
                              </button>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 w-fit ${TYPE_COLORS[partner.type] ?? ""}`}>{partner.type}</Badge>
                        <div className="flex justify-center">
                          <Switch checked={isEnabled} onCheckedChange={() => toggleEnabled(branch.id, partner.id)} className="data-[state=checked]:bg-[#4982CF]" />
                        </div>
                        <div className="flex justify-center">
                          <input type="radio" name={`img-primary-${branch.id}`} disabled={!isEnabled}
                            checked={isPrimary && isEnabled}
                            onChange={() => setPrimary(p => ({ ...p, [branch.id]: partner.id }))}
                            className="accent-[#4982CF] h-4 w-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40" />
                        </div>
                      </div>
                      {showPricing && (
                        <div className="mx-4 mb-3 rounded-xl border border-[#4982CF]/20 overflow-hidden bg-blue-50/30">
                          <div className="grid grid-cols-[1fr_90px_90px] text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 py-1.5 bg-slate-50/80 border-b border-slate-100">
                            <span>Imaging Test</span><span className="text-right">Price (PKR)</span><span className="text-right">Doctor Rate</span>
                          </div>
                          {partner.selectedTests.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-3">No tests selected</p>
                          ) : (
                            partner.selectedTests.map(tid => {
                              const test = allTests.find(t => t.id === tid);
                              return (
                                <div key={tid} className="grid grid-cols-[1fr_90px_90px] items-center px-3 py-1.5 border-b border-slate-50 last:border-0">
                                  <span className="text-xs text-slate-700">{test?.name ?? tid}</span>
                                  <span className="text-xs text-right font-mono text-slate-600">{partner.pricing[tid] ? `PKR ${partner.pricing[tid]}` : <span className="text-slate-300">—</span>}</span>
                                  <span className="text-xs text-right font-mono text-slate-500">{partner.doctorRate[tid] ? `PKR ${partner.doctorRate[tid]}` : <span className="text-slate-300">—</span>}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── BranchModule ─────────────────────────────────────────────────────────────

type TabKey = "branches" | "lab-assignment" | "proc-partners" | "imaging-partners";

interface BranchModuleProps {
  labProviders?: LabProvider[];
  labSections?: LabSection[];
  procPartners?: ProcedurePartner[];
  procSections?: ProcedureSection[];
  imagingPartners?: ImagingPartner[];
  onNavigate?: (section: string) => void;
}

export function BranchModule({ labProviders = [], labSections = [], procPartners = [], procSections = [], imagingPartners = [], onNavigate }: BranchModuleProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("branches");
  const [branches, setBranches] = useState<Branch[]>(SEED);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Branch, "id" | "createdAt">>(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = branches.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.code.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setForm(BLANK); setErrors({}); setEditingId(null); setShowForm(true); }
  function openEdit(b: Branch) {
    setForm({ name: b.name, code: b.code, timezone: b.timezone,
      workingHoursStart: b.workingHoursStart, workingHoursEnd: b.workingHoursEnd,
      tokenResetTime: b.tokenResetTime, status: b.status });
    setErrors({}); setEditingId(b.id); setShowForm(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Branch name is required.";
    if (!form.code.trim()) errs.code = "Branch code is required.";
    else {
      const dup = branches.find(b => b.code === form.code.trim().toUpperCase() && b.id !== editingId);
      if (dup) errs.code = "Code must be unique.";
    }
    if (!form.workingHoursStart || !form.workingHoursEnd) errs.hours = "Working hours are required.";
    return errs;
  }

  function save() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const payload = { ...form, code: form.code.trim().toUpperCase() };
    if (editingId) {
      setBranches(p => p.map(b => b.id === editingId ? { ...b, ...payload } : b));
    } else {
      setBranches(p => [...p, { ...payload, id: `br-${Date.now()}`, createdAt: new Date().toISOString() }]);
    }
    setShowForm(false);
  }

  const field = (key: string) => ({
    value: (form as Record<string, string>)[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
  });

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "branches",          label: "Branches",           icon: <GitBranch className="h-3.5 w-3.5" /> },
    { key: "lab-assignment",    label: "Lab Assignment",     icon: <FlaskConical className="h-3.5 w-3.5" /> },
    { key: "proc-partners",     label: "Procedure Partners", icon: <Stethoscope className="h-3.5 w-3.5" /> },
    { key: "imaging-partners",  label: "Imaging Partners",   icon: <ScanLine className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Branch Management</h1>
          <p className="mt-1 text-sm text-slate-500">Configure clinic branches, working hours, and service assignments.</p>
        </div>
        {activeTab === "branches" && (
          <Button onClick={openAdd} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2">
            <Plus className="h-4 w-4" />Add Branch
          </Button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === t.key ? "bg-white text-[#4982CF] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Branches tab ── */}
      {activeTab === "branches" && (
        <>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search branches…" className="pl-9" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="grid border-b border-slate-100 bg-slate-50/80 px-5 py-3"
              style={{ gridTemplateColumns: "1fr 110px 160px 120px 120px 90px 110px" }}>
              {["Branch Name", "Code", "Timezone", "Working Hours", "Token Reset", "Status", "Created"].map(h => (
                <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <GitBranch className="h-8 w-8 opacity-20 mb-2" />
                <p className="text-sm text-slate-500 font-medium">No branches found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map(b => (
                  <div key={b.id} className="grid items-center px-5 py-4 hover:bg-slate-50 group transition-colors"
                    style={{ gridTemplateColumns: "1fr 110px 160px 120px 120px 90px 110px" }}>
                    <div><p className="text-sm font-semibold text-slate-800">{b.name}</p></div>
                    <span className="font-mono text-xs font-bold text-[#4982CF] bg-[#4982CF]/8 px-2 py-0.5 rounded w-fit">{b.code}</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500"><Globe className="h-3 w-3" />{b.timezone}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="h-3 w-3 text-slate-400" />{fmt12(b.workingHoursStart)} – {fmt12(b.workingHoursEnd)}
                    </div>
                    <span className="text-xs text-slate-600 font-mono">{fmt12(b.tokenResetTime)}</span>
                    <div className="flex items-center gap-1.5">
                      <Switch checked={b.status === "active"}
                        onCheckedChange={v => setBranches(p => p.map(br => br.id === b.id ? { ...br, status: v ? "active" : "inactive" } : br))}
                        className="data-[state=checked]:bg-emerald-500 scale-75" />
                      <span className={`text-xs font-medium ${b.status === "active" ? "text-emerald-600" : "text-slate-400"}`}>
                        {b.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{fmtDate(b.createdAt)}</span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(b)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteId(b.id)} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Lab Assignment tab ── */}
      {activeTab === "lab-assignment" && (
        <LabAssignmentTab branches={branches} labProviders={labProviders} labSections={labSections} onNavigate={onNavigate} />
      )}

      {/* ── Procedure Partners tab ── */}
      {activeTab === "proc-partners" && (
        <ProcedurePartnersTab branches={branches} procPartners={procPartners} procSections={procSections} onNavigate={onNavigate} />
      )}

      {/* ── Imaging Partners tab ── */}
      {activeTab === "imaging-partners" && (
        <ImagingPartnersTab branches={branches} imagingPartners={imagingPartners} onNavigate={onNavigate} />
      )}

      {/* Add / Edit dialog */}
      <Dialog open={showForm} onOpenChange={v => !v && setShowForm(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Branch" : "Add Branch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Branch Name <span className="text-rose-500">*</span></Label>
                <Input {...field("name")} placeholder="e.g. Main Branch — Lahore" className="h-9 text-sm" />
                {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Branch Code <span className="text-rose-500">*</span></Label>
                <Input {...field("code")} placeholder="e.g. LHR-MAIN" className="h-9 text-sm font-mono" />
                {errors.code && <p className="text-xs text-rose-500">{errors.code}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Timezone</Label>
                <Select value={form.timezone} onValueChange={v => setForm(p => ({ ...p, timezone: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Working Hours — Start <span className="text-rose-500">*</span></Label>
                <Input type="time" {...field("workingHoursStart")} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Working Hours — End <span className="text-rose-500">*</span></Label>
                <Input type="time" {...field("workingHoursEnd")} className="h-9 text-sm" />
                {errors.hours && <p className="text-xs text-rose-500 col-span-2">{errors.hours}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Token Reset Time</Label>
                <Input type="time" {...field("tokenResetTime")} className="h-9 text-sm" />
                <p className="text-[10px] text-slate-400">Tokens reset daily at this time.</p>
              </div>
              <div className="space-y-1.5 flex flex-col justify-center">
                <Label className="text-xs font-semibold text-slate-600">Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Switch checked={form.status === "active"} onCheckedChange={v => setForm(p => ({ ...p, status: v ? "active" : "inactive" }))} className="data-[state=checked]:bg-emerald-500" />
                  <span className="text-sm text-slate-600">{form.status === "active" ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="h-9 text-sm">Cancel</Button>
              <Button onClick={save} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white h-9 text-sm gap-2">
                <Check className="h-4 w-4" />{editingId ? "Save Changes" : "Add Branch"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-rose-600"><AlertCircle className="h-5 w-5" />Delete Branch</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 mt-1">Are you sure you want to delete <strong>{branches.find(b => b.id === deleteId)?.name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="h-8 text-sm">Cancel</Button>
            <Button onClick={() => { setBranches(p => p.filter(b => b.id !== deleteId)); setDeleteId(null); }} className="bg-rose-500 hover:bg-rose-600 text-white h-8 text-sm gap-2"><Trash2 className="h-3.5 w-3.5" />Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
