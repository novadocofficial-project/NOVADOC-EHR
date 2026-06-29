import { useState, useMemo } from "react";
import {
  Plus, Heart, Edit2, Trash2, ChevronRight, Search,
  HandHeart, ClipboardList, ShieldCheck, Banknote,
  Users, CheckCircle2, AlertCircle, Clock, ArrowDownCircle,
  BadgeCheck, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = "ehr-welfare-schemes-v1";

export type WelfareSchemeType = "govt" | "hospital" | "ngo" | "zakat" | "corporate";

export type ServiceCoverageRule = {
  enabled: boolean;
  coveragePct: number;
  coPay: number;
};

export type WelfareLedgerEntry = {
  id: string;
  date: string;
  type: "deposit" | "disbursement";
  amount: number;
  reference: string;
  notes: string;
  balance: number;
};

export type WelfareScheme = {
  id: string;
  name: string;
  schemeType: WelfareSchemeType;
  sponsor: string;
  description: string;
  active: boolean;
  deleted: boolean;
  maxMonthlyIncome: number;
  maxHouseholdMembers: number;
  requiredDocuments: string[];
  ageGroups: string[];
  disabilityInclusion: boolean;
  eligibilityNotes: string;
  coverage: Record<string, ServiceCoverageRule>;
  annualCreditLimit: number;
  maxOpdVisitsPerYear: number;
  maxInpatientDaysPerYear: number;
  renewalPeriod: "6m" | "1y" | "2y";
  gracePeriodDays: number;
  ledger: WelfareLedgerEntry[];
  createdAt: string;
};

const SERVICE_TYPES = [
  { id: "st-1", name: "Consultation" },
  { id: "st-2", name: "Lab" },
  { id: "st-3", name: "Nursing Procedures" },
  { id: "st-4", name: "Pharmacy" },
  { id: "st-5", name: "Consumables" },
  { id: "st-6", name: "Imaging" },
  { id: "st-7", name: "Vaccine" },
];

const DOCUMENT_OPTIONS = [
  "CNIC",
  "B-Form (Child)",
  "Income Certificate",
  "BISP Card",
  "Disability Certificate",
  "Death Certificate",
  "Employment Letter",
  "Zakat Certificate",
  "EOBI Card",
  "Widow Certificate",
];

const AGE_GROUPS = [
  { id: "paediatric", label: "Paediatric (0–12 yrs)" },
  { id: "adult", label: "Adult (13–59 yrs)" },
  { id: "senior", label: "Senior (60+ yrs)" },
];

const SCHEME_TYPE_LABELS: Record<WelfareSchemeType, string> = {
  govt: "Government",
  hospital: "Hospital",
  ngo: "NGO",
  zakat: "Zakat / Religious",
  corporate: "Corporate Welfare",
};

const SCHEME_TYPE_COLORS: Record<WelfareSchemeType, string> = {
  govt: "bg-blue-500/10 text-blue-700 border-blue-200",
  hospital: "bg-violet-500/10 text-violet-700 border-violet-200",
  ngo: "bg-teal-500/10 text-teal-700 border-teal-200",
  zakat: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  corporate: "bg-amber-500/10 text-amber-700 border-amber-200",
};

function defaultCoverage(): Record<string, ServiceCoverageRule> {
  return Object.fromEntries(
    SERVICE_TYPES.map(st => [st.id, { enabled: true, coveragePct: 100, coPay: 0 }])
  );
}

function buildLedger(entries: Omit<WelfareLedgerEntry, "balance">[]): WelfareLedgerEntry[] {
  let bal = 0;
  return entries.map(e => {
    const delta = e.type === "deposit" ? e.amount : -e.amount;
    bal += delta;
    return { ...e, balance: bal };
  });
}

function rebuildBalances(entries: WelfareLedgerEntry[]): WelfareLedgerEntry[] {
  let bal = 0;
  return entries.map(e => {
    const delta = e.type === "deposit" ? e.amount : -e.amount;
    bal += delta;
    return { ...e, balance: bal };
  });
}

function buildSeedSchemes(): WelfareScheme[] {
  return [
    {
      id: "ws-1",
      name: "Sehat Sahulat Programme",
      schemeType: "govt",
      sponsor: "Punjab Health Initiative — Government of Punjab",
      description: "A provincial government health insurance scheme providing cashless medical treatment to low-income and vulnerable families registered under BISP or earning below the poverty threshold.",
      active: true,
      deleted: false,
      maxMonthlyIncome: 25000,
      maxHouseholdMembers: 8,
      requiredDocuments: ["CNIC", "Income Certificate", "BISP Card"],
      ageGroups: ["paediatric", "adult", "senior"],
      disabilityInclusion: true,
      eligibilityNotes: "Beneficiary must be a Punjab domicile holder. Family unit includes spouse and dependent children under 18.",
      coverage: {
        "st-1": { enabled: true, coveragePct: 100, coPay: 0 },
        "st-2": { enabled: true, coveragePct: 80, coPay: 20 },
        "st-3": { enabled: true, coveragePct: 100, coPay: 0 },
        "st-4": { enabled: true, coveragePct: 50, coPay: 50 },
        "st-5": { enabled: true, coveragePct: 50, coPay: 50 },
        "st-6": { enabled: true, coveragePct: 80, coPay: 20 },
        "st-7": { enabled: true, coveragePct: 100, coPay: 0 },
      },
      annualCreditLimit: 720000,
      maxOpdVisitsPerYear: 24,
      maxInpatientDaysPerYear: 30,
      renewalPeriod: "1y",
      gracePeriodDays: 30,
      ledger: buildLedger([
        { id: "wl-1-1", date: "2024-07-01", type: "deposit", amount: 300000, reference: "PHI-Q3-2024", notes: "Q3 government fund release" },
        { id: "wl-1-2", date: "2024-08-15", type: "disbursement", amount: 87450, reference: "DISB-AUG-001", notes: "12 patient claims settled — Aug batch" },
        { id: "wl-1-3", date: "2024-10-01", type: "deposit", amount: 250000, reference: "PHI-Q4-2024", notes: "Q4 government fund release" },
      ]),
      createdAt: "2024-01-15T00:00:00.000Z",
    },
    {
      id: "ws-2",
      name: "Hospital Charity Fund",
      schemeType: "hospital",
      sponsor: "NovaDoc Hospital — Social Welfare Department",
      description: "Internal charity fund administered by the hospital's social welfare officer. Provides subsidised or free care to destitute patients on a case-by-case basis after means testing.",
      active: true,
      deleted: false,
      maxMonthlyIncome: 15000,
      maxHouseholdMembers: 10,
      requiredDocuments: ["CNIC", "Income Certificate"],
      ageGroups: ["paediatric", "adult", "senior"],
      disabilityInclusion: true,
      eligibilityNotes: "Approval required from Social Welfare Officer. Priority given to widows, orphans, and persons with disability.",
      coverage: {
        "st-1": { enabled: true, coveragePct: 100, coPay: 0 },
        "st-2": { enabled: true, coveragePct: 50, coPay: 50 },
        "st-3": { enabled: true, coveragePct: 100, coPay: 0 },
        "st-4": { enabled: true, coveragePct: 30, coPay: 70 },
        "st-5": { enabled: true, coveragePct: 30, coPay: 70 },
        "st-6": { enabled: true, coveragePct: 50, coPay: 50 },
        "st-7": { enabled: true, coveragePct: 50, coPay: 50 },
      },
      annualCreditLimit: 50000,
      maxOpdVisitsPerYear: 12,
      maxInpatientDaysPerYear: 7,
      renewalPeriod: "1y",
      gracePeriodDays: 15,
      ledger: buildLedger([
        { id: "wl-2-1", date: "2024-01-01", type: "deposit", amount: 200000, reference: "HCF-ANNUAL-2024", notes: "Annual hospital charity budget allocation" },
        { id: "wl-2-2", date: "2024-09-30", type: "disbursement", amount: 63200, reference: "DISB-HCF-Q3", notes: "Q3 claims — 18 patients" },
      ]),
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "ws-3",
      name: "Zakat Aid Programme",
      schemeType: "zakat",
      sponsor: "Shaukat Khanum Memorial Cancer Hospital & Research Centre",
      description: "Zakat-funded healthcare assistance for deserving cancer and chronic disease patients. Full coverage for investigation and treatment upon Zakat committee approval.",
      active: true,
      deleted: false,
      maxMonthlyIncome: 30000,
      maxHouseholdMembers: 12,
      requiredDocuments: ["CNIC", "Zakat Certificate", "Income Certificate"],
      ageGroups: ["paediatric", "adult", "senior"],
      disabilityInclusion: true,
      eligibilityNotes: "Patient must be a Sahib-e-Nisab zakat recipient. Zakat committee meets monthly. Non-Muslims may apply via alternative charity classification.",
      coverage: {
        "st-1": { enabled: true, coveragePct: 100, coPay: 0 },
        "st-2": { enabled: true, coveragePct: 100, coPay: 0 },
        "st-3": { enabled: true, coveragePct: 100, coPay: 0 },
        "st-4": { enabled: true, coveragePct: 100, coPay: 0 },
        "st-5": { enabled: true, coveragePct: 70, coPay: 30 },
        "st-6": { enabled: true, coveragePct: 80, coPay: 20 },
        "st-7": { enabled: true, coveragePct: 100, coPay: 0 },
      },
      annualCreditLimit: 200000,
      maxOpdVisitsPerYear: 36,
      maxInpatientDaysPerYear: 60,
      renewalPeriod: "1y",
      gracePeriodDays: 60,
      ledger: buildLedger([
        { id: "wl-3-1", date: "2024-04-10", type: "deposit", amount: 500000, reference: "ZAK-RAMADAN-2024", notes: "Ramadan Zakat collection disbursement" },
        { id: "wl-3-2", date: "2024-06-30", type: "disbursement", amount: 145000, reference: "DISB-ZAK-H1", notes: "H1 patient claims — 22 patients" },
        { id: "wl-3-3", date: "2024-09-15", type: "deposit", amount: 150000, reference: "ZAK-Q3-2024", notes: "Quarterly Zakat supplemental fund" },
      ]),
      createdAt: "2024-04-01T00:00:00.000Z",
    },
    {
      id: "ws-4",
      name: "EOBI Workers Welfare",
      schemeType: "govt",
      sponsor: "Employees Old-Age Benefits Institution — Government of Pakistan",
      description: "Healthcare benefit scheme for registered workers and their dependents under EOBI. Covers OPD, lab, and pharmacy services with co-payment for imaging and procedures.",
      active: true,
      deleted: false,
      maxMonthlyIncome: 0,
      maxHouseholdMembers: 0,
      requiredDocuments: ["CNIC", "Employment Letter", "EOBI Card"],
      ageGroups: ["adult", "senior"],
      disabilityInclusion: true,
      eligibilityNotes: "Worker must be registered with EOBI and employer must be contributing. Dependants include spouse and children under 18.",
      coverage: {
        "st-1": { enabled: true, coveragePct: 100, coPay: 0 },
        "st-2": { enabled: true, coveragePct: 80, coPay: 20 },
        "st-3": { enabled: true, coveragePct: 80, coPay: 20 },
        "st-4": { enabled: true, coveragePct: 70, coPay: 30 },
        "st-5": { enabled: false, coveragePct: 0, coPay: 100 },
        "st-6": { enabled: true, coveragePct: 70, coPay: 30 },
        "st-7": { enabled: true, coveragePct: 80, coPay: 20 },
      },
      annualCreditLimit: 300000,
      maxOpdVisitsPerYear: 18,
      maxInpatientDaysPerYear: 14,
      renewalPeriod: "1y",
      gracePeriodDays: 30,
      ledger: buildLedger([
        { id: "wl-4-1", date: "2024-01-15", type: "deposit", amount: 400000, reference: "EOBI-ANN-2024", notes: "Annual EOBI welfare fund allocation" },
        { id: "wl-4-2", date: "2024-07-31", type: "disbursement", amount: 112000, reference: "DISB-EOBI-H1", notes: "H1 worker claims — 28 patients" },
      ]),
      createdAt: "2024-01-15T00:00:00.000Z",
    },
  ];
}

function loadSchemes(): WelfareScheme[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as WelfareScheme[];
  } catch { /**/ }
  return buildSeedSchemes();
}

function saveSchemes(schemes: WelfareScheme[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(schemes)); } catch { /**/ }
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

function today() { return new Date().toISOString().slice(0, 10); }

function coverageLabel(pct: number): { label: string; color: string } {
  if (pct >= 100) return { label: "Full", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" };
  if (pct >= 50)  return { label: "Partial", color: "bg-amber-500/10 text-amber-700 border-amber-200" };
  if (pct > 0)    return { label: "Limited", color: "bg-orange-500/10 text-orange-700 border-orange-200" };
  return { label: "None", color: "bg-slate-100 text-slate-500 border-slate-200" };
}

function schemeBalance(scheme: WelfareScheme): number {
  if (!scheme.ledger.length) return 0;
  return scheme.ledger[scheme.ledger.length - 1].balance;
}

function schemeDisbursed(scheme: WelfareScheme): number {
  return scheme.ledger.filter(e => e.type === "disbursement").reduce((s, e) => s + e.amount, 0);
}

type BlankForm = {
  name: string; schemeType: WelfareSchemeType;
  sponsor: string; description: string;
};
function blankForm(): BlankForm {
  return { name: "", schemeType: "govt", sponsor: "", description: "" };
}

export function WelfareSchemesModule() {
  const [schemes, setSchemes] = useState<WelfareScheme[]>(loadSchemes);
  const [selectedId, setSelectedId] = useState<string | null>(schemes[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlankForm>(blankForm());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [depositForm, setDepositForm] = useState({ amount: "", reference: "", notes: "", date: today() });

  function persist(next: WelfareScheme[]) {
    setSchemes(next);
    saveSchemes(next);
  }

  const selected = schemes.find(s => s.id === selectedId) ?? null;
  const activeBeneficiaries = useMemo(() => {
    if (!selected) return 0;
    try {
      const raw = localStorage.getItem("ehr-patients-v1");
      if (!raw) return 0;
      const pts = JSON.parse(raw) as Array<{ welfareEnrollment?: { schemeId: string; status: string } }>;
      return pts.filter(p => p.welfareEnrollment?.schemeId === selected.id && p.welfareEnrollment?.status === "active").length;
    } catch { return 0; }
  }, [selected?.id, schemes]);
  const visibleSchemes = useMemo(
    () => schemes.filter(s => !s.deleted && s.name.toLowerCase().includes(search.toLowerCase())),
    [schemes, search]
  );

  function openAdd() { setForm(blankForm()); setEditingId(null); setShowForm(true); }
  function openEdit(s: WelfareScheme) {
    setForm({ name: s.name, schemeType: s.schemeType, sponsor: s.sponsor, description: s.description });
    setEditingId(s.id); setShowForm(true);
  }

  function saveForm() {
    if (!form.name.trim()) return;
    if (editingId) {
      persist(schemes.map(s => s.id === editingId
        ? { ...s, name: form.name.trim(), schemeType: form.schemeType, sponsor: form.sponsor, description: form.description }
        : s
      ));
    } else {
      const id = `ws-${Date.now()}`;
      const next: WelfareScheme = {
        id, name: form.name.trim(), schemeType: form.schemeType,
        sponsor: form.sponsor, description: form.description,
        active: true, deleted: false,
        maxMonthlyIncome: 0, maxHouseholdMembers: 0,
        requiredDocuments: ["CNIC"], ageGroups: ["adult"],
        disabilityInclusion: false, eligibilityNotes: "",
        coverage: defaultCoverage(),
        annualCreditLimit: 0, maxOpdVisitsPerYear: 0,
        maxInpatientDaysPerYear: 0, renewalPeriod: "1y", gracePeriodDays: 30,
        ledger: [], createdAt: new Date().toISOString(),
      };
      persist([...schemes, next]);
      setSelectedId(id);
    }
    setShowForm(false);
  }

  function toggleActive(id: string) {
    persist(schemes.map(s => s.id === id ? { ...s, active: !s.active } : s));
  }
  function deleteScheme(id: string) {
    persist(schemes.map(s => s.id === id ? { ...s, deleted: true } : s));
    if (selectedId === id) setSelectedId(visibleSchemes.find(s => s.id !== id)?.id ?? null);
    setDeleteConfirm(null);
  }

  function updateScheme(id: string, patch: Partial<WelfareScheme>) {
    persist(schemes.map(s => s.id === id ? { ...s, ...patch } : s));
  }

  function addDeposit() {
    if (!selectedId || !depositForm.amount) return;
    const amt = parseFloat(depositForm.amount);
    if (isNaN(amt) || amt <= 0) return;
    const entry: WelfareLedgerEntry = {
      id: `wle-${Date.now()}`, date: depositForm.date,
      type: "deposit", amount: amt,
      reference: depositForm.reference || `DEP-${Date.now().toString().slice(-6)}`,
      notes: depositForm.notes, balance: 0,
    };
    updateScheme(selectedId, {
      ledger: rebuildBalances([...(selected?.ledger ?? []), entry]),
    });
    setDepositForm({ amount: "", reference: "", notes: "", date: today() });
    setShowDepositDialog(false);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="flex w-72 flex-none flex-col border-r border-slate-200 bg-white">
        {/* Header */}
        <div className="flex-none border-b border-slate-100 p-4 pb-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Welfare Schemes</h2>
            <Button size="sm" onClick={openAdd} className="h-7 gap-1.5 bg-[#4982CF] text-xs hover:bg-[#3a6ab5] text-white px-2">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search schemes…" className="pl-8 h-8 text-xs" />
          </div>
        </div>

        {/* Scheme list */}
        <div className="flex-1 overflow-y-auto">
          {visibleSchemes.length === 0 && (
            <p className="px-4 py-8 text-center text-xs text-slate-400">No schemes found.</p>
          )}
          {visibleSchemes.map(s => {
            const bal = schemeBalance(s);
            const isSelected = s.id === selectedId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                className={`w-full border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${isSelected ? "bg-blue-50 border-l-2 border-l-[#4982CF]" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{s.name}</p>
                    <Badge className={`mt-1 text-[9px] px-1.5 py-0 ${SCHEME_TYPE_COLORS[s.schemeType]}`}>
                      {SCHEME_TYPE_LABELS[s.schemeType]}
                    </Badge>
                  </div>
                  <span className={`mt-1 h-2 w-2 flex-none rounded-full ${s.active ? "bg-emerald-500" : "bg-slate-300"}`} />
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="text-[10px] text-slate-400">
                    Bal: <span className="font-medium text-slate-600">Rs. {bal.toLocaleString()}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Right Content ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
            <Heart className="h-12 w-12 opacity-20" />
            <p className="font-medium text-sm">Select a scheme to configure</p>
          </div>
        ) : (
          <>
            {/* Scheme header */}
            <div className="flex-none border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">{selected.name}</h2>
                    <Badge className={`text-[9px] px-1.5 ${SCHEME_TYPE_COLORS[selected.schemeType]}`}>
                      {SCHEME_TYPE_LABELS[selected.schemeType]}
                    </Badge>
                    {!selected.active && <Badge className="text-[9px] px-1.5 bg-slate-100 text-slate-500 border-slate-200">Inactive</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{selected.sponsor || "No sponsor specified"}</p>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  <Switch
                    checked={selected.active}
                    onCheckedChange={() => toggleActive(selected.id)}
                    className="data-[state=checked]:bg-[#4982CF]"
                  />
                  <span className="text-xs text-slate-500">{selected.active ? "Active" : "Inactive"}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(selected)}>
                    <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                    onClick={() => setDeleteConfirm(selected.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs — keyed by scheme.id so all tab sub-components remount on scheme switch */}
            <Tabs key={selected.id} defaultValue="overview" className="flex flex-1 flex-col overflow-hidden">
              <TabsList className="flex-none mx-6 mt-4 w-fit bg-slate-100/80">
                <TabsTrigger value="overview" className="text-xs gap-1.5"><HandHeart className="h-3.5 w-3.5" />Overview</TabsTrigger>
                <TabsTrigger value="eligibility" className="text-xs gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Eligibility</TabsTrigger>
                <TabsTrigger value="coverage" className="text-xs gap-1.5"><ClipboardList className="h-3.5 w-3.5" />Coverage</TabsTrigger>
                <TabsTrigger value="limits" className="text-xs gap-1.5"><BadgeCheck className="h-3.5 w-3.5" />Limits & Co-pay</TabsTrigger>
                <TabsTrigger value="ledger" className="text-xs gap-1.5"><Banknote className="h-3.5 w-3.5" />Ledger</TabsTrigger>
              </TabsList>

              {/* ── OVERVIEW ── */}
              <TabsContent value="overview" className="flex-1 overflow-y-auto p-6 mt-0 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Active Beneficiaries", value: String(activeBeneficiaries), icon: <Users className="h-4 w-4 text-blue-500" />, sub: activeBeneficiaries === 1 ? "enrolled patient" : "enrolled patients" },
                    { label: "Total Disbursed", value: `Rs. ${schemeDisbursed(selected).toLocaleString()}`, icon: <ArrowDownCircle className="h-4 w-4 text-rose-500" />, sub: "all time" },
                    { label: "Fund Balance", value: `Rs. ${schemeBalance(selected).toLocaleString()}`, icon: <Banknote className="h-4 w-4 text-emerald-500" />, sub: "current" },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">{stat.icon}<span className="text-xs text-slate-500">{stat.label}</span></div>
                      <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Details */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Scheme Details</h3>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(selected)}>
                      <Edit2 className="h-3 w-3" /> Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {[
                      { label: "Scheme Type", value: SCHEME_TYPE_LABELS[selected.schemeType] },
                      { label: "Sponsor / Administrator", value: selected.sponsor || "—" },
                      { label: "Renewal Period", value: selected.renewalPeriod === "6m" ? "Every 6 Months" : selected.renewalPeriod === "1y" ? "Annual" : "Every 2 Years" },
                      { label: "Created", value: fmtDate(selected.createdAt) },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
                        <p className="mt-0.5 font-medium text-slate-700">{value}</p>
                      </div>
                    ))}
                    <div className="col-span-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Description</p>
                      <p className="mt-0.5 text-slate-600 leading-relaxed">{selected.description || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Coverage quick-view */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Coverage Summary</h3>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_TYPES.map(st => {
                      const rule = selected.coverage[st.id];
                      if (!rule?.enabled) return (
                        <div key={st.id} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                          <span className="text-xs text-slate-400 line-through">{st.name}</span>
                        </div>
                      );
                      const { label, color } = coverageLabel(rule.coveragePct);
                      return (
                        <div key={st.id} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1">
                          <span className="text-xs font-medium text-slate-700">{st.name}</span>
                          <Badge className={`text-[9px] px-1 ${color}`}>{label} {rule.coveragePct}%</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* ── ELIGIBILITY ── */}
              <TabsContent value="eligibility" className="flex-1 overflow-y-auto p-6 mt-0">
                <EligibilityTab scheme={selected} onUpdate={patch => updateScheme(selected.id, patch)} />
              </TabsContent>

              {/* ── COVERAGE ── */}
              <TabsContent value="coverage" className="flex-1 overflow-y-auto p-6 mt-0">
                <CoverageTab scheme={selected} onUpdate={patch => updateScheme(selected.id, patch)} />
              </TabsContent>

              {/* ── LIMITS ── */}
              <TabsContent value="limits" className="flex-1 overflow-y-auto p-6 mt-0">
                <LimitsTab scheme={selected} onUpdate={patch => updateScheme(selected.id, patch)} />
              </TabsContent>

              {/* ── LEDGER ── */}
              <TabsContent value="ledger" className="flex-1 overflow-y-auto p-6 mt-0">
                <LedgerTab
                  scheme={selected}
                  onAddDeposit={() => setShowDepositDialog(true)}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* ── Add / Edit Dialog ────────────────────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={open => !open && setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Scheme" : "Add Welfare Scheme"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">Scheme Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sehat Sahulat Programme" className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Scheme Type</Label>
              <Select value={form.schemeType} onValueChange={v => setForm(f => ({ ...f, schemeType: v as WelfareSchemeType }))}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SCHEME_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-sm">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Sponsor / Administrator</Label>
              <Input value={form.sponsor} onChange={e => setForm(f => ({ ...f, sponsor: e.target.value }))} placeholder="e.g. Government of Punjab" className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the scheme's purpose and scope…" className="mt-1 text-sm resize-none" rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={saveForm} disabled={!form.name.trim()} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white">
                {editingId ? "Save Changes" : "Create Scheme"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Fund Deposit Dialog ───────────────────────────────────────────── */}
      <Dialog open={showDepositDialog} onOpenChange={open => !open && setShowDepositDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Fund Deposit</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Amount (Rs.) *</Label>
              <Input type="number" value={depositForm.amount} onChange={e => setDepositForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={depositForm.date} onChange={e => setDepositForm(f => ({ ...f, date: e.target.value }))} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Reference</Label>
              <Input value={depositForm.reference} onChange={e => setDepositForm(f => ({ ...f, reference: e.target.value }))} placeholder="e.g. PHI-Q1-2025" className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input value={depositForm.notes} onChange={e => setDepositForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" className="mt-1 h-8 text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setShowDepositDialog(false)}>Cancel</Button>
              <Button size="sm" onClick={addDeposit} disabled={!depositForm.amount} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white">Add Deposit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 max-w-sm w-full mx-4">
            <p className="font-semibold text-slate-800 mb-1">Remove this scheme?</p>
            <p className="text-sm text-slate-500 mb-4">This will hide <strong>{schemes.find(s => s.id === deleteConfirm)?.name}</strong> from the list. This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button size="sm" onClick={() => deleteScheme(deleteConfirm)} className="bg-rose-600 hover:bg-rose-700 text-white">Remove</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Eligibility Tab ───────────────────────────────────────────────────────── */
function EligibilityTab({ scheme, onUpdate }: { scheme: WelfareScheme; onUpdate: (p: Partial<WelfareScheme>) => void }) {
  const [local, setLocal] = useState({ ...scheme });
  const [saved, setSaved] = useState(false);

  function save() {
    onUpdate({
      maxMonthlyIncome: local.maxMonthlyIncome,
      maxHouseholdMembers: local.maxHouseholdMembers,
      requiredDocuments: local.requiredDocuments,
      ageGroups: local.ageGroups,
      disabilityInclusion: local.disabilityInclusion,
      eligibilityNotes: local.eligibilityNotes,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleDoc(doc: string) {
    setLocal(l => ({
      ...l,
      requiredDocuments: l.requiredDocuments.includes(doc)
        ? l.requiredDocuments.filter(d => d !== doc)
        : [...l.requiredDocuments, doc],
    }));
  }
  function toggleAge(age: string) {
    setLocal(l => ({
      ...l,
      ageGroups: l.ageGroups.includes(age)
        ? l.ageGroups.filter(a => a !== age)
        : [...l.ageGroups, age],
    }));
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Income & Household</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Max Monthly Income (Rs.)</Label>
            <p className="text-[10px] text-slate-400 mb-1">Set 0 for no income restriction</p>
            <Input type="number" value={local.maxMonthlyIncome || ""} onChange={e => setLocal(l => ({ ...l, maxMonthlyIncome: parseInt(e.target.value) || 0 }))} placeholder="e.g. 25000" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Max Household Members</Label>
            <p className="text-[10px] text-slate-400 mb-1">Set 0 for no restriction</p>
            <Input type="number" value={local.maxHouseholdMembers || ""} onChange={e => setLocal(l => ({ ...l, maxHouseholdMembers: parseInt(e.target.value) || 0 }))} placeholder="e.g. 8" className="h-8 text-sm" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Required Documents</h3>
        <div className="grid grid-cols-2 gap-2">
          {DOCUMENT_OPTIONS.map(doc => (
            <label key={doc} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50 transition-colors">
              <Checkbox
                checked={local.requiredDocuments.includes(doc)}
                onCheckedChange={() => toggleDoc(doc)}
                className="data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
              />
              <span className="text-sm text-slate-700">{doc}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Age Groups & Inclusion</h3>
        <div className="flex gap-3">
          {AGE_GROUPS.map(ag => (
            <label key={ag.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50 transition-colors">
              <Checkbox
                checked={local.ageGroups.includes(ag.id)}
                onCheckedChange={() => toggleAge(ag.id)}
                className="data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
              />
              <span className="text-sm text-slate-700">{ag.label}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={local.disabilityInclusion}
            onCheckedChange={v => setLocal(l => ({ ...l, disabilityInclusion: v }))}
            className="data-[state=checked]:bg-[#4982CF]"
          />
          <span className="text-sm text-slate-700">Include persons with disability (PWD)</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Additional Notes</h3>
        <Textarea
          value={local.eligibilityNotes}
          onChange={e => setLocal(l => ({ ...l, eligibilityNotes: e.target.value }))}
          placeholder="Any additional eligibility conditions, committee approval requirements, etc."
          className="text-sm resize-none"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white" size="sm">Save Eligibility</Button>
        {saved && <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Saved</span>}
      </div>
    </div>
  );
}

/* ── Coverage Tab ──────────────────────────────────────────────────────────── */
function CoverageTab({ scheme, onUpdate }: { scheme: WelfareScheme; onUpdate: (p: Partial<WelfareScheme>) => void }) {
  const [local, setLocal] = useState<Record<string, ServiceCoverageRule>>({ ...scheme.coverage });
  const [saved, setSaved] = useState(false);

  function save() {
    onUpdate({ coverage: local });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function patchRule(stId: string, patch: Partial<ServiceCoverageRule>) {
    setLocal(l => ({ ...l, [stId]: { ...l[stId], ...patch } }));
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-2.5 grid grid-cols-[1fr_80px_120px_120px] gap-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Service Type</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Covered</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Coverage %</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</span>
        </div>
        {SERVICE_TYPES.map(st => {
          const rule = local[st.id] ?? { enabled: false, coveragePct: 0, coPay: 100 };
          const { label, color } = coverageLabel(rule.enabled ? rule.coveragePct : 0);
          return (
            <div key={st.id} className="grid grid-cols-[1fr_80px_120px_120px] gap-4 items-center border-b border-slate-100 px-5 py-3 last:border-b-0">
              <span className="text-sm font-medium text-slate-700">{st.name}</span>
              <Switch
                checked={rule.enabled}
                onCheckedChange={v => patchRule(st.id, { enabled: v, coveragePct: v ? (rule.coveragePct || 100) : 0 })}
                className="data-[state=checked]:bg-[#4982CF]"
              />
              <Input
                type="number" min={0} max={100}
                value={rule.coveragePct}
                disabled={!rule.enabled}
                onChange={e => patchRule(st.id, { coveragePct: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                className="h-7 text-xs w-24"
              />
              <Badge className={`text-[9px] px-2 w-fit ${color}`}>{rule.enabled ? `${label} ${rule.coveragePct}%` : "Not Covered"}</Badge>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white" size="sm">Save Coverage</Button>
        {saved && <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Saved</span>}
      </div>
    </div>
  );
}

/* ── Limits Tab ────────────────────────────────────────────────────────────── */
function LimitsTab({ scheme, onUpdate }: { scheme: WelfareScheme; onUpdate: (p: Partial<WelfareScheme>) => void }) {
  const [local, setLocal] = useState({
    annualCreditLimit: scheme.annualCreditLimit,
    maxOpdVisitsPerYear: scheme.maxOpdVisitsPerYear,
    maxInpatientDaysPerYear: scheme.maxInpatientDaysPerYear,
    renewalPeriod: scheme.renewalPeriod,
    gracePeriodDays: scheme.gracePeriodDays,
  });
  // co-pay % per service type — independently editable from coverage %
  const [localCoPay, setLocalCoPay] = useState<Record<string, number>>(() =>
    Object.fromEntries(SERVICE_TYPES.map(st => [st.id, scheme.coverage[st.id]?.coPay ?? 0]))
  );
  const [saved, setSaved] = useState(false);

  function save() {
    // Merge updated coPay back into coverage (keep enabled & coveragePct unchanged)
    const updatedCoverage: Record<string, ServiceCoverageRule> = { ...scheme.coverage };
    SERVICE_TYPES.forEach(st => {
      const existing = updatedCoverage[st.id] ?? { enabled: false, coveragePct: 0, coPay: 100 };
      updatedCoverage[st.id] = { ...existing, coPay: localCoPay[st.id] ?? existing.coPay };
    });
    onUpdate({
      annualCreditLimit: local.annualCreditLimit,
      maxOpdVisitsPerYear: local.maxOpdVisitsPerYear,
      maxInpatientDaysPerYear: local.maxInpatientDaysPerYear,
      renewalPeriod: local.renewalPeriod,
      gracePeriodDays: local.gracePeriodDays,
      coverage: updatedCoverage,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Financial Limits</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Annual Credit Limit (Rs.)</Label>
            <p className="text-[10px] text-slate-400 mb-1">Set 0 for unlimited</p>
            <Input type="number" value={local.annualCreditLimit || ""} onChange={e => setLocal(l => ({ ...l, annualCreditLimit: parseInt(e.target.value) || 0 }))} placeholder="e.g. 720000" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Max OPD Visits / Year</Label>
            <p className="text-[10px] text-slate-400 mb-1">Set 0 for unlimited</p>
            <Input type="number" value={local.maxOpdVisitsPerYear || ""} onChange={e => setLocal(l => ({ ...l, maxOpdVisitsPerYear: parseInt(e.target.value) || 0 }))} placeholder="e.g. 24" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Max Inpatient Days / Year</Label>
            <p className="text-[10px] text-slate-400 mb-1">Set 0 for not applicable</p>
            <Input type="number" value={local.maxInpatientDaysPerYear || ""} onChange={e => setLocal(l => ({ ...l, maxInpatientDaysPerYear: parseInt(e.target.value) || 0 }))} placeholder="e.g. 30" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Grace Period (days)</Label>
            <p className="text-[10px] text-slate-400 mb-1">After renewal expiry</p>
            <Input type="number" value={local.gracePeriodDays || ""} onChange={e => setLocal(l => ({ ...l, gracePeriodDays: parseInt(e.target.value) || 0 }))} placeholder="e.g. 30" className="h-8 text-sm" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Renewal Period</Label>
          <Select value={local.renewalPeriod} onValueChange={v => setLocal(l => ({ ...l, renewalPeriod: v as WelfareScheme["renewalPeriod"] }))}>
            <SelectTrigger className="mt-1 h-8 text-sm w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="6m" className="text-sm">Every 6 Months</SelectItem>
              <SelectItem value="1y" className="text-sm">Annual (1 Year)</SelectItem>
              <SelectItem value="2y" className="text-sm">Every 2 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Co-pay % per service type — editable */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-2.5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Co-pay % by Service Type</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">The portion of cost the patient pays out-of-pocket. Independent from the coverage % set on the Coverage tab.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {SERVICE_TYPES.map(st => {
            const rule = scheme.coverage[st.id];
            const isEnabled = rule?.enabled ?? false;
            const co = localCoPay[st.id] ?? 0;
            return (
              <div key={st.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full flex-none ${isEnabled ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <span className={`text-sm font-medium ${isEnabled ? "text-slate-700" : "text-slate-400"}`}>{st.name}</span>
                  {!isEnabled && <span className="text-[10px] text-slate-400">(not covered)</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min={0} max={100}
                    value={co}
                    disabled={!isEnabled}
                    onChange={e => setLocalCoPay(prev => ({
                      ...prev,
                      [st.id]: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                    }))}
                    className="h-7 text-xs w-20 text-right"
                  />
                  <span className="text-xs text-slate-400 w-4">%</span>
                  <Badge className={`w-20 justify-center text-[9px] ${co === 0 ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : co >= 50 ? "bg-amber-500/10 text-amber-700 border-amber-200" : "bg-blue-500/10 text-blue-700 border-blue-200"}`}>
                    {co === 0 ? "No co-pay" : co >= 100 ? "Full co-pay" : `${co}% co-pay`}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white" size="sm">Save Limits & Co-pay</Button>
        {saved && <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Saved</span>}
      </div>
    </div>
  );
}

/* ── Ledger Tab ────────────────────────────────────────────────────────────── */
function LedgerTab({ scheme, onAddDeposit }: { scheme: WelfareScheme; onAddDeposit: () => void }) {
  const totalDeposits = scheme.ledger.filter(e => e.type === "deposit").reduce((s, e) => s + e.amount, 0);
  const totalDisbursed = scheme.ledger.filter(e => e.type === "disbursement").reduce((s, e) => s + e.amount, 0);
  const balance = schemeBalance(scheme);

  return (
    <div className="max-w-3xl space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Deposits", value: `Rs. ${totalDeposits.toLocaleString()}`, color: "text-emerald-600", icon: <ArrowDownCircle className="h-4 w-4 text-emerald-500 rotate-180" /> },
          { label: "Total Disbursed", value: `Rs. ${totalDisbursed.toLocaleString()}`, color: "text-rose-600", icon: <ArrowDownCircle className="h-4 w-4 text-rose-500" /> },
          { label: "Fund Balance", value: `Rs. ${balance.toLocaleString()}`, color: balance >= 0 ? "text-slate-800" : "text-rose-700", icon: <Banknote className="h-4 w-4 text-blue-500" /> },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {s.icon}
            <div>
              <p className="text-[10px] text-slate-400">{s.label}</p>
              <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add deposit button */}
      <div className="flex justify-end">
        <Button onClick={onAddDeposit} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 h-8 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Fund Deposit
        </Button>
      </div>

      {/* Ledger table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {scheme.ledger.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <BookOpen className="mb-3 h-8 w-8 opacity-30" />
            <p className="text-sm font-medium">No ledger entries yet</p>
            <p className="text-xs mt-1">Add a fund deposit to get started.</p>
          </div>
        ) : (
          <>
            <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-2.5 grid grid-cols-[90px_80px_1fr_100px_100px_100px] gap-3">
              {["Date", "Type", "Reference / Notes", "Amount", "Balance", ""].map(h => (
                <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
              ))}
            </div>
            {[...scheme.ledger].reverse().map(entry => (
              <div key={entry.id} className="grid grid-cols-[90px_80px_1fr_100px_100px_100px] gap-3 items-center border-b border-slate-100 px-5 py-3 last:border-b-0 hover:bg-slate-50/50">
                <span className="text-xs text-slate-500">{fmtDate(entry.date)}</span>
                {entry.type === "deposit" ? (
                  <Badge className="w-fit text-[9px] bg-emerald-500/10 text-emerald-700 border-emerald-200 gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" />Deposit
                  </Badge>
                ) : (
                  <Badge className="w-fit text-[9px] bg-rose-500/10 text-rose-700 border-rose-200 gap-1">
                    <ArrowDownCircle className="h-2.5 w-2.5" />Disbursed
                  </Badge>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{entry.reference}</p>
                  {entry.notes && <p className="text-[10px] text-slate-400 truncate">{entry.notes}</p>}
                </div>
                <span className={`text-sm font-semibold ${entry.type === "deposit" ? "text-emerald-600" : "text-rose-600"}`}>
                  {entry.type === "deposit" ? "+" : "–"} Rs. {entry.amount.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-slate-700">Rs. {entry.balance.toLocaleString()}</span>
                <span />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
