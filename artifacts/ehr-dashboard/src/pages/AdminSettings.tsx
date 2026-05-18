import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  Activity,
  AlertCircle,
  Banknote,
  Bell,
  FileText,
  FlaskConical,
  Sliders,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Edit2,
  GitBranch,
  Globe,
  Heart,
  Layers,
  LayoutGrid,
  Lock,
  MapPin,
  Monitor,
  Package,
  Pill,
  Plus,
  Receipt,
  ScanLine,
  Search,
  Settings,
  Shield,
  Sparkles,
  Stethoscope,
  Store,
  Tag,
  Target,
  Ticket,
  Truck,
  Trash2,
  UserRound,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { DoctorsModule, Doctor, INITIAL_DOCTORS } from "@/pages/DoctorsModule";
import { SpecialtiesModule } from "@/pages/SpecialtiesModule";
import { FeesModule } from "@/pages/FeesModule";
import type { FeeRow } from "@/pages/FeesModule";
import { ServiceTypesModule } from "@/pages/ServiceTypesModule";
import { ServicePricingModule } from "@/pages/ServicePricingModule";
import { CorporatePricingModule } from "@/pages/CorporatePricingModule";
import { InsurancePricingModule } from "@/pages/InsurancePricingModule";
import { PackagesModule } from "@/pages/PackagesModule";
import { BranchModule } from "@/pages/BranchModule";
import { SoapConfigModule } from "@/pages/SoapConfigModule";
import { HpiTemplatesModule } from "@/pages/HpiTemplatesModule";
import { PhysicalExamBuilderModule } from "@/pages/PhysicalExamBuilderModule";
import { TemplateManagerModule } from "@/pages/TemplateManagerModule";
import { ClinicalLibrariesModule } from "@/pages/ClinicalLibrariesModule";
import { ClinicalGoalsLibraryModule } from "@/pages/ClinicalGoalsLibraryModule";
import { PermissionsModule } from "@/pages/PermissionsModule";
import { FormularyManagementModule } from "@/pages/FormularyManagementModule";
import { FormularyPartnersModule, FORMULARY_SEED_PARTNERS } from "@/pages/FormularyPartnersModule";
import type { FormularyPartner } from "@/pages/FormularyPartnersModule";
import { ImagingCatalogModule } from "@/pages/ImagingCatalogModule";
import type { ImagingPartner } from "@/pages/ImagingCatalogModule";
import { ConsumablesModule, CONSUMABLE_SEED_PROVIDERS } from "@/pages/ConsumablesModule";
import type { ConsumableProvider } from "@/pages/ConsumablesModule";
import { LabCatalogModule, SEED_SECTIONS as LAB_SEED_SECTIONS, SEED_PROVIDERS as LAB_SEED_PROVIDERS, type LabSection, type LabProvider } from "@/pages/LabCatalogModule";
import { LabResultTemplatesModule } from "@/pages/LabResultTemplatesModule";
import { ProcedureCatalogModule, INITIAL_PROC_SECTIONS, INITIAL_PROC_PARTNERS, type ProcedureSection, type ProcedurePartner } from "@/pages/ProcedureCatalogModule";
import { QueueModule } from "@/pages/QueueModule";
import type { QueueSection } from "@/pages/QueueModule";
import { NursingConfigModule } from "@/pages/NursingConfigModule";
import type { NursingSectionId } from "@/pages/NursingConfigModule";
import { PatientRegistrationModule } from "@/pages/PatientRegistrationModule";
import type { PatRegSection } from "@/pages/PatientRegistrationModule";
import { OrderSetsModule } from "@/pages/OrderSetsModule";
import { UsersManagementModule } from "@/pages/UsersManagementModule";
import { RoutingRulesModule } from "@/pages/RoutingRulesModule";
import { INITIAL_SERVICE_TYPES, INITIAL_SERVICES } from "@/pages/BillingTypes";
import { HomeNavButton, QueueNavDropdown, AppointmentsNavDropdown, ReportsNavDropdown } from "@/pages/QueuePageLayout";
import type { ServiceType, Service } from "@/pages/BillingTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";

export type Specialty = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

export type SubDepartment = {
  id: string;
  name: string;
  active: boolean;
  specialties: Specialty[];
};

export type Department = {
  id: string;
  name: string;
  active: boolean;
  subDepartments: SubDepartment[];
  specialties: Specialty[];
};

const INITIAL_DATA: Department[] = [
  {
    id: "d1",
    name: "Cardiology",
    active: true,
    subDepartments: [
      { id: "sd1-1", name: "Outpatient", active: true, specialties: [] },
      { id: "sd1-4", name: "Inpatient", active: false, specialties: [] },
    ],
    specialties: [
      { id: "sp1-1", name: "Interventional Cardiology", description: "Diagnosis and treatment of heart conditions using catheter-based procedures such as angioplasty and stenting.", active: true },
      { id: "sp1-2", name: "Electrophysiology", description: "Management of heart rhythm disorders, arrhythmias, and electrical system abnormalities.", active: true },
      { id: "sp1-3", name: "Heart Failure & Transplant", description: "Comprehensive care for advanced heart failure including transplant evaluation and support.", active: false },
    ],
  },
  {
    id: "d2",
    name: "Orthopedics",
    active: true,
    subDepartments: [
      { id: "sd2-1", name: "Outpatient", active: true, specialties: [] },
      { id: "sd2-4", name: "Inpatient", active: false, specialties: [] },
    ],
    specialties: [
      { id: "sp2-1", name: "Joint Replacement", description: "Hip, knee, and shoulder replacement surgeries for arthritis and injury-related joint damage.", active: true },
      { id: "sp2-2", name: "Sports Medicine", description: "Treatment of sports-related injuries including ligament tears, fractures, and muscle conditions.", active: true },
    ],
  },
  {
    id: "d3",
    name: "Neurology",
    active: true,
    subDepartments: [
      { id: "sd3-1", name: "Outpatient", active: true, specialties: [] },
      { id: "sd3-4", name: "Inpatient", active: false, specialties: [] },
    ],
    specialties: [
      { id: "sp3-1", name: "Stroke & Cerebrovascular", description: "Emergency and long-term management of stroke, TIA, and cerebrovascular disease.", active: true },
      { id: "sp3-2", name: "Epilepsy", description: "Diagnosis and management of seizure disorders using EEG, medications, and surgical options.", active: false },
    ],
  },
  {
    id: "d-immuno",
    name: "Immunology",
    active: true,
    subDepartments: [
      { id: "sd-immuno-1", name: "Outpatient", active: true, specialties: [] },
    ],
    specialties: [
      { id: "sp-immuno-1", name: "General Immunology", description: "Diagnosis and management of immune system disorders, allergies, and autoimmune conditions.", active: true },
      { id: "sp-immuno-2", name: "Clinical Allergy", description: "Evaluation and treatment of allergic diseases including asthma, rhinitis, and anaphylaxis.", active: true },
    ],
  },
];

type ActiveModule =
  | "departments" | "specialties" | "doctors" | "fees"
  | "service-types" | "service-pricing" | "corporate-pricing" | "insurance-pricing" | "packages"
  | "branches"
  | "visit-types" | "workflow-config" | "counter-types" | "counters"
  | "token-settings" | "queue-behavior" | "locking-settings" | "display-settings" | "doctor-partitions" | "routing-rules"
  | "soap-note-structure" | "soap-vitals-config" | "hpi-templates" | "pe-builder" | "template-manager"
  | "nursing-triage" | "nursing-history" | "nursing-vitals"
  | "nursing-procedures"
  | "clinical-complaints" | "clinical-icd10" | "clinical-poc" | "clinical-ros"
  | "clinical-allergies" | "clinical-med-surgical" | "clinical-family" | "clinical-social"
  | "care-plan-library" | "goals-library" | "referral-destinations" | "comorbidities"
  | "lab-master" | "lab-providers" | "lab-result-templates"
  | "proc-master" | "proc-partners"
  | "permissions" | "signing-rules"
  | "formulary-catalogue" | "formulary-defaults" | "formulary-partners"
  | "imaging-tests" | "imaging-reasons" | "imaging-partners"
  | "consumables-master" | "consumables-providers"
  | "lab-order-sets" | "imaging-order-sets"
  | "users-counters"
  | "reg-basic-info" | "reg-patient-types" | "reg-welfare-forms"
  | "reg-demographics" | "reg-custom-sections" | "reg-workflow" | "reg-quick";

export function AdminSettings() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initSection = searchParams.get("section") as ActiveModule | null;
  const queueSections: ActiveModule[] = ["visit-types","workflow-config","counter-types","counters","token-settings","queue-behavior","locking-settings","display-settings","doctor-partitions","routing-rules"];
  const [activeModule, setActiveModule] = useState<ActiveModule>(initSection ?? "departments");
  const regSections: ActiveModule[] = ["reg-basic-info","reg-patient-types","reg-welfare-forms","reg-demographics","reg-custom-sections","reg-workflow","reg-quick"];
  const [navExpanded, setNavExpanded] = useState({
    departments: false,
    doctors: false,
    billing: false,
    branches: false,
    patientReg: !!initSection && regSections.includes(initSection as ActiveModule),
    queue: !!initSection && queueSections.includes(initSection as ActiveModule),
    soapConfig: false,
    nursing: false,
    clinicalLibraries: false,
    labCatalog: false,
    procedureCatalog: false,
    formulary: false,
    imagingCatalog: false,
    consumables: false,
    permissions: false,
    users: false,
  });
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DATA);

  const toggleNav = (key: keyof typeof navExpanded) =>
    setNavExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    try {
      const raw = localStorage.getItem("ehr-doctors-v1");
      if (raw) return JSON.parse(raw) as Doctor[];
    } catch {}
    return INITIAL_DOCTORS;
  });
  useEffect(() => {
    try { localStorage.setItem("ehr-doctors-v1", JSON.stringify(doctors)); } catch {}
  }, [doctors]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(INITIAL_SERVICE_TYPES);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [labSections, setLabSections] = useState<LabSection[]>(() => {
    try { const r = localStorage.getItem("ehr-lab-sections-v1"); if (r) return JSON.parse(r) as LabSection[]; } catch { /**/ }
    return LAB_SEED_SECTIONS;
  });
  const [labProviders, setLabProviders] = useState<LabProvider[]>(() => {
    try { const r = localStorage.getItem("ehr-lab-providers-v1"); if (r) return JSON.parse(r) as LabProvider[]; } catch { /**/ }
    return LAB_SEED_PROVIDERS;
  });
  const [procSections, setProcSections] = useState<ProcedureSection[]>(() => {
    try { const r = localStorage.getItem("ehr-procedure-sections-v1"); if (r) return JSON.parse(r) as ProcedureSection[]; } catch { /**/ }
    return INITIAL_PROC_SECTIONS;
  });
  const [procPartners, setProcPartners] = useState<ProcedurePartner[]>(() => {
    try { const r = localStorage.getItem("ehr-procedure-partners-v1"); if (r) return JSON.parse(r) as ProcedurePartner[]; } catch { /**/ }
    return INITIAL_PROC_PARTNERS;
  });
  const [imagingPartners, setImagingPartners] = useState<ImagingPartner[]>(() => {
    try {
      const raw = localStorage.getItem("ehr-imaging-partners-v1");
      if (raw) return JSON.parse(raw) as ImagingPartner[];
    } catch { /**/ }
    const seed: ImagingPartner[] = [
      {
        id: "ip1", name: "In-House Radiology", type: "Internal Radiology", contact: "", active: true,
        selectedTests: ["xray-chest","xray-abdomen","xray-knee","us-abdomen","us-thyroid","echo-2d"],
        pricing: { "xray-chest": "800", "xray-abdomen": "900", "xray-knee": "700", "us-abdomen": "1500", "us-thyroid": "1200", "echo-2d": "3500" },
      },
      {
        id: "ip2", name: "City Diagnostics Centre", type: "External Centre", contact: "0300-9876543", active: true,
        selectedTests: ["ct-brain","ct-chest","ct-abdo-pelvis","mri-brain","mri-knee","nuc-pet-ct"],
        pricing: { "ct-brain": "7000", "ct-chest": "8000", "ct-abdo-pelvis": "9000", "mri-brain": "12000", "mri-knee": "10000", "nuc-pet-ct": "35000" },
      },
    ];
    return seed;
  });

  const [consumableProviders] = useState<ConsumableProvider[]>(() => {
    try {
      const raw = localStorage.getItem("ehr-consumables-providers-v1");
      if (raw) return JSON.parse(raw) as ConsumableProvider[];
    } catch { /**/ }
    return CONSUMABLE_SEED_PROVIDERS;
  });

  const [pharmacyPartners] = useState<FormularyPartner[]>(() => {
    try {
      const raw = localStorage.getItem("ehr-formulary-partners-v1");
      if (raw) return JSON.parse(raw) as FormularyPartner[];
    } catch { /**/ }
    return FORMULARY_SEED_PARTNERS;
  });

  const [doctorFees, setDoctorFees] = useState<Record<string, FeeRow[]>>(() => {
    try { const r = localStorage.getItem("ehr-doctor-fees-v1"); if (r) return JSON.parse(r) as Record<string, FeeRow[]>; } catch { /**/ }
    const fee = (
      deptId: string, subDeptId: string,
      consultationFee: string, shareType: "value" | "percentage", shareAmount: string,
      followUpFee: string, followUpShareType: "value" | "percentage", followUpShareAmount: string,
      emergencyFee: string, emergencyShareType: "value" | "percentage", emergencyShareAmount: string,
      teleFee: string, teleShareType: "value" | "percentage", teleShareAmount: string,
    ): FeeRow => ({
      deptId, subDeptId,
      consultationFee, shareType, shareAmount,
      followUpFee, followUpShareType, followUpShareAmount,
      emergencyFee, emergencyShareType, emergencyShareAmount,
      teleFee, teleShareType, teleShareAmount,
    });
    return {
      // Dr. Emily Wong — Cardiology (Outpatient) + Orthopedics (Outpatient)
      "doc-1": [
        fee("d1", "sd1-1", "2000", "percentage", "70", "1000", "percentage", "70", "3000", "percentage", "60", "1500", "percentage", "70"),
        fee("d2", "sd2-1", "2500", "percentage", "65", "1200", "percentage", "65", "3500", "percentage", "55", "1800", "percentage", "65"),
      ],
      // Dr. James Wilson — Orthopedics (Outpatient)
      "doc-2": [
        fee("d2", "sd2-1", "3000", "percentage", "70", "1500", "percentage", "70", "4000", "percentage", "60", "2000", "percentage", "70"),
      ],
      // Dr. Sarah Connor — Neurology (Outpatient)
      "doc-3": [
        fee("d3", "sd3-1", "2500", "percentage", "65", "1200", "percentage", "65", "3500", "percentage", "55", "1500", "percentage", "65"),
      ],
    };
  });

  useEffect(() => { try { localStorage.setItem("ehr-lab-sections-v1",       JSON.stringify(labSections));  } catch { /**/ } }, [labSections]);
  useEffect(() => { try { localStorage.setItem("ehr-lab-providers-v1",      JSON.stringify(labProviders)); } catch { /**/ } }, [labProviders]);
  useEffect(() => { try { localStorage.setItem("ehr-procedure-sections-v1", JSON.stringify(procSections)); } catch { /**/ } }, [procSections]);
  useEffect(() => { try { localStorage.setItem("ehr-procedure-partners-v1", JSON.stringify(procPartners)); } catch { /**/ } }, [procPartners]);
  useEffect(() => { try { localStorage.setItem("ehr-doctor-fees-v1",        JSON.stringify(doctorFees));   } catch { /**/ } }, [doctorFees]);

  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({
    d1: true, d2: true, d3: false, d4: true,
  });

  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [editingSubDept, setEditingSubDept] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [addingDept, setAddingDept] = useState(false);
  const [addValue, setAddValue] = useState("");

  // Bulk sub-department dialog state
  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkSubDeptName, setBulkSubDeptName] = useState("");
  const [bulkSelectedDepts, setBulkSelectedDepts] = useState<string[]>([]);

  const openBulkDialog = (preSelectDeptId?: string) => {
    setBulkSubDeptName("");
    setBulkSelectedDepts(preSelectDeptId ? [preSelectDeptId] : []);
    setBulkDialog(true);
  };

  const closeBulkDialog = () => {
    setBulkDialog(false);
    setBulkSubDeptName("");
    setBulkSelectedDepts([]);
  };

  const allDeptIds = departments.map(d => d.id);
  const allSelected = bulkSelectedDepts.length === departments.length;
  const someSelected = bulkSelectedDepts.length > 0 && !allSelected;

  const toggleBulkSelectAll = () => {
    setBulkSelectedDepts(allSelected ? [] : allDeptIds);
  };

  const toggleBulkDept = (id: string) => {
    setBulkSelectedDepts(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const saveBulkSubDept = () => {
    const name = bulkSubDeptName.trim();
    if (!name || bulkSelectedDepts.length === 0) return;
    setDepartments(prev => prev.map(d =>
      bulkSelectedDepts.includes(d.id)
        ? { ...d, subDepartments: [...d.subDepartments, { id: `sd-${Date.now()}-${d.id}`, name, active: true, specialties: [] }] }
        : d
    ));
    closeBulkDialog();
  };

  const toggleDeptCollapse = (id: string) =>
    setExpandedDepts(prev => ({ ...prev, [id]: !prev[id] }));

  const handleToggleDeptActive = (id: string) =>
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, active: !d.active } : d));

  const handleToggleSubDeptActive = (deptId: string, subId: string) =>
    setDepartments(prev => prev.map(d =>
      d.id === deptId
        ? { ...d, subDepartments: d.subDepartments.map(sd => sd.id === subId ? { ...sd, active: !sd.active } : sd) }
        : d
    ));

  const handleDeleteDept = (id: string) =>
    setDepartments(prev => prev.filter(d => d.id !== id));

  const handleDeleteSubDept = (deptId: string, subId: string) =>
    setDepartments(prev => prev.map(d =>
      d.id === deptId ? { ...d, subDepartments: d.subDepartments.filter(sd => sd.id !== subId) } : d
    ));

  const saveDeptEdit = (id: string) => {
    if (editValue.trim())
      setDepartments(prev => prev.map(d => d.id === id ? { ...d, name: editValue.trim() } : d));
    setEditingDept(null);
  };

  const saveSubDeptEdit = (deptId: string, subId: string) => {
    if (editValue.trim())
      setDepartments(prev => prev.map(d =>
        d.id === deptId
          ? { ...d, subDepartments: d.subDepartments.map(sd => sd.id === subId ? { ...sd, name: editValue.trim() } : sd) }
          : d
      ));
    setEditingSubDept(null);
  };

  const saveNewDept = () => {
    if (addValue.trim()) {
      const newDept: Department = {
        id: `d-${Date.now()}`, name: addValue.trim(), active: true, subDepartments: [], specialties: [],
      };
      setDepartments(prev => [...prev, newDept]);
      setExpandedDepts(prev => ({ ...prev, [newDept.id]: true }));
    }
    setAddingDept(false);
    setAddValue("");
  };

  const subNavItem = (module: ActiveModule, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setActiveModule(module)}
      className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-left transition-colors ${activeModule === module ? "bg-[#4982CF]/10 text-[#4982CF]" : "text-slate-600 hover:bg-slate-100"}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Top Navbar */}
      <header className="z-20 flex h-14 flex-none items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center">
            <img src="/novadoc-logo.png" alt="NovaDoc" className="h-8 w-auto" />
          </div>
          <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex">
            <HomeNavButton />
            <QueueNavDropdown />
            <AppointmentsNavDropdown />
            <ReportsNavDropdown />
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Search MRN, Name..." className="h-9 w-64 border-slate-200 bg-slate-50 pl-9 text-sm focus-visible:ring-[#4982CF]" />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-700">
            <Bell className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full border border-slate-200 p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://i.pravatar.cc/150?u=finance" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Jane Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">Finance Manager</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation("/admin")}>Admin Settings</DropdownMenuItem>
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sub-Navbar */}
        <aside className="flex w-60 flex-none flex-col border-r border-slate-200 bg-white overflow-hidden">
          <div className="flex h-14 flex-none items-center gap-2 border-b border-slate-100 px-4 text-sm font-bold text-slate-800">
            <Settings className="h-4 w-4 text-[#4982CF]" />
            Admin Settings
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {/* Departments Group */}
            <button
              type="button"
              onClick={() => toggleNav("departments")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Building2 className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Care Structure</span>
              {navExpanded.departments
                ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.departments && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("departments", <LayoutGrid className="h-3.5 w-3.5" />, "Departments & Sub")}
                {subNavItem("specialties", <Sparkles className="h-3.5 w-3.5" />, "Specialties")}
              </div>
            )}

            {/* Doctors Group */}
            <button
              type="button"
              onClick={() => toggleNav("doctors")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Stethoscope className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Doctors</span>
              {navExpanded.doctors
                ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.doctors && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("doctors", <UserRound className="h-3.5 w-3.5" />, "Doctor Profiles")}
                {subNavItem("fees", <Banknote className="h-3.5 w-3.5" />, "Fees & Shares")}
              </div>
            )}

            {/* Billing & Pricing Group */}
            <button
              type="button"
              onClick={() => toggleNav("billing")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Receipt className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Billing & Pricing</span>
              {navExpanded.billing
                ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.billing && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("service-types", <Tag className="h-3.5 w-3.5" />, "Service Types")}
                {subNavItem("service-pricing", <ClipboardList className="h-3.5 w-3.5" />, "Service Pricing")}
                {subNavItem("corporate-pricing", <CreditCard className="h-3.5 w-3.5" />, "Corporate Pricing")}
                {subNavItem("insurance-pricing", <Shield className="h-3.5 w-3.5" />, "Insurance Pricing")}
                {subNavItem("packages", <Package className="h-3.5 w-3.5" />, "Packages / Bundles")}
              </div>
            )}


            {/* ── Branch Management Group ── */}
            <button
              type="button"
              onClick={() => toggleNav("branches")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <GitBranch className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Branches</span>
              {navExpanded.branches ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.branches && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("branches", <Building2 className="h-3.5 w-3.5" />, "Branch List")}
              </div>
            )}

            {/* ── Patient Registration Group ── */}
            <button
              type="button"
              onClick={() => toggleNav("patientReg")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ClipboardList className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Patient Registration</span>
              {navExpanded.patientReg ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.patientReg && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("reg-basic-info",      <UserRound className="h-3.5 w-3.5" />,     "Basic Info")}
                {subNavItem("reg-patient-types",   <Users className="h-3.5 w-3.5" />,         "Patient Types")}
                {subNavItem("reg-welfare-forms",   <Heart className="h-3.5 w-3.5" />,         "Welfare Forms")}
                {subNavItem("reg-demographics",    <Globe className="h-3.5 w-3.5" />,         "Demographics")}
                {subNavItem("reg-custom-sections", <Layers className="h-3.5 w-3.5" />,        "Custom Sections")}
                {subNavItem("reg-workflow",        <Workflow className="h-3.5 w-3.5" />,      "Workflow Builder")}
                {subNavItem("reg-quick",           <Zap className="h-3.5 w-3.5" />,           "Quick Registration")}
              </div>
            )}

            {/* ── Queue Management Group ── */}
            <button
              type="button"
              onClick={() => toggleNav("queue")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Ticket className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Queue Setup</span>
              {navExpanded.queue ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.queue && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("visit-types",       <Activity className="h-3.5 w-3.5" />,   "Visit Types")}
                {subNavItem("workflow-config",    <Workflow className="h-3.5 w-3.5" />,   "Workflow Config")}
                {subNavItem("counter-types",      <Layers className="h-3.5 w-3.5" />,     "Counter Types")}
                {subNavItem("counters",           <LayoutGrid className="h-3.5 w-3.5" />, "Counters")}
                {subNavItem("token-settings",     <Tag className="h-3.5 w-3.5" />,        "Token Settings")}
                {subNavItem("queue-behavior",     <Settings className="h-3.5 w-3.5" />,   "Queue Behavior")}
                {subNavItem("locking-settings",   <Lock className="h-3.5 w-3.5" />,       "Locking")}
                {subNavItem("display-settings",   <Monitor className="h-3.5 w-3.5" />,    "Display")}
                {subNavItem("doctor-partitions",  <Stethoscope className="h-3.5 w-3.5" />,"Doctor / Partition")}
                {subNavItem("routing-rules",      <Zap className="h-3.5 w-3.5" />,        "Routing Rules")}
              </div>
            )}

            {/* ── SOAP Configuration Group ── */}
            <button
              type="button"
              onClick={() => toggleNav("soapConfig")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ClipboardList className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">SOAP Configuration</span>
              {navExpanded.soapConfig ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.soapConfig && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("soap-note-structure",   <FileText className="h-3.5 w-3.5" />,      "Note Structure")}
                {subNavItem("clinical-complaints",   <Activity className="h-3.5 w-3.5" />,      "Chief Complaints")}
                {subNavItem("hpi-templates",         <ClipboardList className="h-3.5 w-3.5" />, "HPI Templates")}
                {subNavItem("clinical-allergies",    <Bell className="h-3.5 w-3.5" />,          "Allergies")}
                {subNavItem("clinical-med-surgical", <Stethoscope className="h-3.5 w-3.5" />,   "Med/Surgical History")}
                {subNavItem("clinical-family",       <Users className="h-3.5 w-3.5" />,         "Family History")}
                {subNavItem("clinical-social",       <UserRound className="h-3.5 w-3.5" />,     "Social History")}
                {subNavItem("clinical-ros",          <ClipboardList className="h-3.5 w-3.5" />, "ROS Config")}
                {subNavItem("pe-builder",            <Stethoscope className="h-3.5 w-3.5" />,   "PE Builder")}
                {subNavItem("clinical-poc",          <FlaskConical className="h-3.5 w-3.5" />,  "POC Tests")}
                {subNavItem("clinical-icd10",        <FileText className="h-3.5 w-3.5" />,      "ICD-10 Codes")}
                {subNavItem("comorbidities",         <Heart className="h-3.5 w-3.5" />,         "Comorbidities")}
                {subNavItem("care-plan-library",     <ClipboardCheck className="h-3.5 w-3.5" />,"Care Plan Tasks")}
                {subNavItem("goals-library",         <Target className="h-3.5 w-3.5" />,        "Patient Goals")}
                {subNavItem("referral-destinations", <MapPin className="h-3.5 w-3.5" />,        "Referral Destinations")}
                {subNavItem("template-manager",      <FileText className="h-3.5 w-3.5" />,      "Template Manager")}
              </div>
            )}

            {/* ── Nursing Group ── */}
            <button
              type="button"
              onClick={() => toggleNav("nursing")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Heart className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Nursing</span>
              {navExpanded.nursing ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.nursing && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("nursing-triage",     <AlertCircle className="h-3.5 w-3.5" />,  "Triage")}
                {subNavItem("nursing-history",    <ClipboardList className="h-3.5 w-3.5" />, "History")}
                {subNavItem("nursing-vitals",     <Sliders className="h-3.5 w-3.5" />,       "Vital Signs")}
                {subNavItem("nursing-procedures", <Stethoscope className="h-3.5 w-3.5" />,   "Nursing Procedures")}
              </div>
            )}

            {/* ── Lab Catalog Group ── */}
            <button
              type="button"
              onClick={() => toggleNav("labCatalog")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <FlaskConical className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Lab Catalog</span>
              {navExpanded.labCatalog ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.labCatalog && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("lab-master",           <FileText className="h-3.5 w-3.5" />,     "Lab Test Master List")}
                {subNavItem("lab-providers",        <FlaskConical className="h-3.5 w-3.5" />, "Lab Providers")}
                {subNavItem("lab-result-templates", <FileText className="h-3.5 w-3.5" />,     "Result Templates")}
                {subNavItem("lab-order-sets",       <Layers className="h-3.5 w-3.5" />,       "Lab Order Sets")}
              </div>
            )}

            {/* ── Procedure Catalog Group ── */}
            <button
              type="button"
              onClick={() => toggleNav("procedureCatalog")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Stethoscope className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Procedure Catalog</span>
              {navExpanded.procedureCatalog ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.procedureCatalog && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("proc-master",   <FileText className="h-3.5 w-3.5" />, "Procedure Master List")}
                {subNavItem("proc-partners", <Stethoscope className="h-3.5 w-3.5" />, "Procedure Partners")}
              </div>
            )}

            {/* ── Formulary Management Group ── */}
            <button
              type="button"
              onClick={() => toggleNav("formulary")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Pill className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Formulary</span>
              {navExpanded.formulary ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.formulary && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("formulary-catalogue", <Pill className="h-3.5 w-3.5" />, "Medicine Catalogue")}
                {subNavItem("formulary-defaults",  <Tag className="h-3.5 w-3.5" />,  "Prescription Defaults")}
                {subNavItem("formulary-partners",  <Store className="h-3.5 w-3.5" />, "Pharmacy Partners")}
              </div>
            )}

            {/* ── Imaging Catalog Group ── */}
            <button
              type="button"
              onClick={() => toggleNav("imagingCatalog")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ScanLine className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Imaging Catalog</span>
              {navExpanded.imagingCatalog ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.imagingCatalog && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("imaging-tests",    <ScanLine className="h-3.5 w-3.5" />,  "Imaging Test List")}
                {subNavItem("imaging-reasons",  <FileText className="h-3.5 w-3.5" />,  "Reason Templates")}
                {subNavItem("imaging-partners", <Building2 className="h-3.5 w-3.5" />, "Imaging Partners")}
                {subNavItem("imaging-order-sets", <Layers className="h-3.5 w-3.5" />,  "Imaging Order Sets")}
              </div>
            )}

            {/* ── Consumables Group ── */}
            <button
              type="button"
              onClick={() => toggleNav("consumables")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Package className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Consumables</span>
              {navExpanded.consumables ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.consumables && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("consumables-master",    <Package className="h-3.5 w-3.5" />, "Consumable Items")}
                {subNavItem("consumables-providers", <Truck className="h-3.5 w-3.5" />,   "Consumable Providers")}
              </div>
            )}

            {/* ── Users Management Group ── */}
            <button
              type="button"
              onClick={() => toggleNav("users")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Users className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Users</span>
              {navExpanded.users ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.users && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("users-counters", <UserRound className="h-3.5 w-3.5" />, "Users & Counters")}
                {subNavItem("permissions",    <Shield className="h-3.5 w-3.5" />, "Security")}
              </div>
            )}
          </nav>
        </aside>

        {/* Right Content */}
        <main className={`flex-1 bg-slate-50/50 ${["fees","service-pricing","corporate-pricing","insurance-pricing","packages","display-settings","routing-rules","pe-builder","template-manager","care-plan-library","goals-library","referral-destinations","comorbidities","permissions","signing-rules","formulary-catalogue","formulary-defaults","formulary-partners","imaging-tests","imaging-reasons","imaging-partners","consumables-master","consumables-providers","lab-order-sets","imaging-order-sets","nursing-triage"].includes(activeModule) ? "overflow-hidden" : "overflow-y-auto p-6"}`}>

          {activeModule === "doctors" && (
            <DoctorsModule departments={departments} doctors={doctors} setDoctors={setDoctors} />
          )}
          {activeModule === "specialties" && (
            <SpecialtiesModule departments={departments} setDepartments={setDepartments} />
          )}
          {activeModule === "fees" && (
            <FeesModule departments={departments} doctors={doctors} services={services} serviceTypes={serviceTypes} doctorFees={doctorFees} setDoctorFees={setDoctorFees} />
          )}
          {activeModule === "service-types" && (
            <ServiceTypesModule serviceTypes={serviceTypes} setServiceTypes={setServiceTypes} />
          )}
          {activeModule === "service-pricing" && (
            <ServicePricingModule
              serviceTypes={serviceTypes}
              services={services}
              setServices={setServices}
              departments={departments}
              labProviders={labProviders}
              imagingPartners={imagingPartners}
              pharmacyPartners={pharmacyPartners}
              consumableProviders={consumableProviders}
              procPartners={procPartners}
              doctors={doctors}
              doctorFees={doctorFees}
            />
          )}
          {activeModule === "corporate-pricing" && (
            <CorporatePricingModule
              serviceTypes={serviceTypes}
              services={services}
              pharmacyPartners={pharmacyPartners}
              labProviders={labProviders}
              labSections={labSections}
              consumableProviders={consumableProviders}
              procPartners={procPartners}
              procSections={procSections}
              imagingPartners={imagingPartners}
              doctors={doctors}
              doctorFees={doctorFees}
              departments={departments}
            />
          )}
          {activeModule === "insurance-pricing" && (
            <InsurancePricingModule serviceTypes={serviceTypes} services={services} />
          )}
          {activeModule === "packages" && (
            <PackagesModule services={services} serviceTypes={serviceTypes} />
          )}

          {activeModule === "branches" && (
            <BranchModule
              labProviders={labProviders}
              labSections={labSections}
              procPartners={procPartners}
              procSections={procSections}
              imagingPartners={imagingPartners}
              consumableProviders={consumableProviders}
              pharmacyPartners={pharmacyPartners}
              onNavigate={(section) => setActiveModule(section as Parameters<typeof setActiveModule>[0])}
            />
          )}

          {(["visit-types","workflow-config","counter-types","counters","token-settings","queue-behavior","locking-settings","display-settings","doctor-partitions"] as const).map(s =>
            activeModule === s ? <QueueModule key={s} section={s as QueueSection} /> : null
          )}

          {(["reg-basic-info","reg-patient-types","reg-welfare-forms","reg-demographics","reg-custom-sections","reg-workflow","reg-quick"] as const).map(s =>
            activeModule === s ? <PatientRegistrationModule key={s} section={s as PatRegSection} /> : null
          )}

          {activeModule === "routing-rules" && <RoutingRulesModule />}

          {activeModule === "users-counters" && <UsersManagementModule />}

          {(activeModule === "soap-note-structure" || activeModule === "soap-vitals-config") && (
            <SoapConfigModule
              activeSubModule={activeModule === "soap-note-structure" ? "note-structure" : "vitals-config"}
              departments={departments}
            />
          )}

          {(["nursing-triage","nursing-history","nursing-vitals","nursing-procedures"] as const).map(s =>
            activeModule === s ? <NursingConfigModule key={s} section={s as NursingSectionId} /> : null
          )}

          {activeModule === "hpi-templates" && <HpiTemplatesModule />}

          {(activeModule === "clinical-complaints"
            || activeModule === "clinical-icd10"
            || activeModule === "clinical-poc"
            || activeModule === "clinical-ros"
            || activeModule === "clinical-allergies"
            || activeModule === "clinical-med-surgical"
            || activeModule === "clinical-family"
            || activeModule === "clinical-social") && (
            <ClinicalLibrariesModule
              key={activeModule}
              standalone
              initialTab={
                activeModule === "clinical-complaints"   ? "complaints"
                : activeModule === "clinical-icd10"      ? "icd10"
                : activeModule === "clinical-poc"        ? "poc"
                : activeModule === "clinical-ros"        ? "ros"
                : activeModule === "clinical-allergies"  ? "allergies"
                : activeModule === "clinical-med-surgical"? "med-surgical"
                : activeModule === "clinical-family"     ? "family-history"
                : "social-history"
              }
            />
          )}

          {(activeModule === "lab-master" || activeModule === "lab-providers") && (
            <LabCatalogModule
              key={activeModule}
              sections={labSections}
              setSections={setLabSections}
              providers={labProviders}
              setProviders={setLabProviders}
              initialView={activeModule === "lab-providers" ? "providers" : "master"}
            />
          )}

          {activeModule === "lab-result-templates" && (
            <LabResultTemplatesModule />
          )}

          {(activeModule === "proc-master" || activeModule === "proc-partners") && (
            <ProcedureCatalogModule
              key={activeModule}
              sections={procSections}
              setSections={setProcSections}
              partners={procPartners}
              setPartners={setProcPartners}
              initialView={activeModule === "proc-partners" ? "partners" : "master"}
            />
          )}

          {activeModule === "pe-builder" && <PhysicalExamBuilderModule />}
          {activeModule === "template-manager" && <TemplateManagerModule />}

          {(activeModule === "care-plan-library"
            || activeModule === "goals-library"
            || activeModule === "referral-destinations"
            || activeModule === "comorbidities") && (
            <ClinicalGoalsLibraryModule
              key={activeModule}
              standalone
              initialTab={
                activeModule === "care-plan-library"     ? "care-plan"
                : activeModule === "goals-library"       ? "goals"
                : activeModule === "referral-destinations"? "referral-dest"
                : "comorbidities"
              }
            />
          )}

          {(activeModule === "permissions" || activeModule === "signing-rules") && (
            <PermissionsModule initialTab={activeModule === "signing-rules" ? "signing-rules" : "role-access"} />
          )}

          {(activeModule === "formulary-catalogue" || activeModule === "formulary-defaults") && (
            <FormularyManagementModule initialTab={activeModule === "formulary-defaults" ? "defaults" : "catalogue"} />
          )}

          {activeModule === "formulary-partners" && (
            <FormularyPartnersModule />
          )}

          {(activeModule === "imaging-tests" || activeModule === "imaging-reasons" || activeModule === "imaging-partners") && (
            <ImagingCatalogModule initialTab={activeModule === "imaging-reasons" ? "reasons" : activeModule === "imaging-partners" ? "partners" : "tests"} />
          )}

          {(activeModule === "consumables-master" || activeModule === "consumables-providers") && (
            <ConsumablesModule initialTab={activeModule === "consumables-providers" ? "providers" : "items"} />
          )}

          {activeModule === "lab-order-sets" && (
            <OrderSetsModule setType="lab" labSections={labSections} procSections={procSections} />
          )}
          {activeModule === "imaging-order-sets" && (
            <OrderSetsModule setType="imaging" labSections={labSections} procSections={procSections} />
          )}

          {activeModule === "departments" && (
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Departments & Sub-Departments</h1>
                  <p className="mt-1 text-sm text-slate-500">Manage clinic departments and their active status for billing.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-[#4982CF]/30 text-[#4982CF] hover:bg-[#4982CF]/5"
                    onClick={() => openBulkDialog()}
                    data-testid="btn-bulk-add-subdept"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Sub-Department
                  </Button>
                  <Button className="bg-[#4982CF] text-white hover:bg-[#3D73BC]" onClick={() => { setAddingDept(true); setAddValue(""); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Department
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {departments.map((dept) => (
                  <Collapsible key={dept.id} open={expandedDepts[dept.id]} onOpenChange={() => toggleDeptCollapse(dept.id)} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all">
                    <div className="flex items-center gap-4 border-b border-slate-100 p-4">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600">
                          {expandedDepts[dept.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>

                      <div className="flex-1">
                        {editingDept === dept.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              autoFocus
                              className="h-8 w-64 font-medium"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && saveDeptEdit(dept.id)}
                              onBlur={() => saveDeptEdit(dept.id)}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-800">{dept.name}</span>
                            <Badge className={dept.active ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200" : "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-200"}>
                              {dept.active ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-xs text-slate-400">{dept.subDepartments.length} sub-dept{dept.subDepartments.length !== 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                          <span className="text-xs font-medium text-slate-500">Status</span>
                          <Switch checked={dept.active} onCheckedChange={() => handleToggleDeptActive(dept.id)} />
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-[#4982CF]/10 hover:text-[#4982CF]" onClick={() => { setEditingDept(dept.id); setEditValue(dept.name); }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => handleDeleteDept(dept.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <CollapsibleContent>
                      <div className="bg-slate-50 p-4">
                        <div className="rounded-lg border border-slate-200 bg-white">
                          {dept.subDepartments.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">No sub-departments found.</div>
                          ) : (
                            <div className="divide-y divide-slate-100">
                              {dept.subDepartments.map(sub => (
                                <div key={sub.id} className="flex items-center gap-4 p-3 pl-10 hover:bg-slate-50/50">
                                  <LayoutGrid className="h-4 w-4 text-slate-300" />
                                  <div className="flex-1">
                                    {editingSubDept === sub.id ? (
                                      <Input
                                        autoFocus
                                        className="h-8 w-56 text-sm"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && saveSubDeptEdit(dept.id, sub.id)}
                                        onBlur={() => saveSubDeptEdit(dept.id, sub.id)}
                                      />
                                    ) : (
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-slate-700">{sub.name}</span>
                                        <Badge variant="outline" className={sub.active ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-amber-600 border-amber-200 bg-amber-50"}>
                                          {sub.active ? "Active" : "Inactive"}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Switch className="scale-75" checked={sub.active} onCheckedChange={() => handleToggleSubDeptActive(dept.id, sub.id)} />
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#4982CF]" onClick={() => { setEditingSubDept(sub.id); setEditValue(sub.name); }}>
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={() => handleDeleteSubDept(dept.id, sub.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 border-dashed border-slate-300 bg-transparent text-[#4982CF] hover:bg-[#4982CF]/5 hover:border-[#4982CF]/50"
                          onClick={() => openBulkDialog(dept.id)}
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Add Sub-Department
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}

                {addingDept && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-4">
                    <div className="flex h-6 w-6 items-center justify-center">
                      <Building2 className="h-4 w-4 text-[#4982CF]" />
                    </div>
                    <Input
                      autoFocus
                      placeholder="New Department Name"
                      className="h-9 max-w-sm font-medium"
                      value={addValue}
                      onChange={(e) => setAddValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveNewDept()}
                    />
                    <div className="ml-auto flex gap-2">
                      <Button variant="outline" className="border-slate-200" onClick={() => { setAddingDept(false); setAddValue(""); }}>Cancel</Button>
                      <Button className="bg-[#4982CF] text-white hover:bg-[#3D73BC]" onClick={saveNewDept}>Save Department</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bulk Add Sub-Department Dialog */}
      <Dialog open={bulkDialog} onOpenChange={open => !open && closeBulkDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Add Sub-Department</DialogTitle>
            <p className="text-xs text-slate-500">Enter a name and select which departments to add it to.</p>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Sub-dept name input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Sub-Department Name <span className="text-rose-500">*</span></label>
              <Input
                autoFocus
                placeholder="e.g. Outpatient, ICU, Surgery..."
                value={bulkSubDeptName}
                onChange={e => setBulkSubDeptName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveBulkSubDept()}
                className="h-9"
                data-testid="input-bulk-subdept-name"
              />
            </div>

            {/* Department selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Add to Departments <span className="text-rose-500">*</span></label>

              {/* Select All */}
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleBulkSelectAll}
                  className="data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
                  data-testid="checkbox-select-all-depts"
                />
                <span className="text-sm font-bold text-slate-700">Select All Departments</span>
                <span className="ml-auto text-xs text-slate-400">{departments.length} total</span>
              </label>

              {/* Separator */}
              <div className="border-t border-slate-100" />

              {/* Individual departments */}
              <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
                {departments.map(dept => {
                  const isSelected = bulkSelectedDepts.includes(dept.id);
                  return (
                    <label
                      key={dept.id}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-all ${isSelected ? "border-[#4982CF]/30 bg-[#4982CF]/5" : "border-transparent hover:bg-slate-50"}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleBulkDept(dept.id)}
                        className="data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
                      />
                      <span className={`text-sm font-medium ${isSelected ? "text-[#4982CF]" : "text-slate-700"}`}>{dept.name}</span>
                      {!dept.active && (
                        <Badge variant="outline" className="ml-auto text-[10px] text-amber-600 border-amber-200">Inactive</Badge>
                      )}
                      <span className="ml-auto text-[10px] text-slate-400">{dept.subDepartments.length} sub-dept{dept.subDepartments.length !== 1 ? "s" : ""}</span>
                    </label>
                  );
                })}
              </div>

              {bulkSelectedDepts.length > 0 && (
                <p className="text-xs font-medium text-[#4982CF]">
                  {bulkSelectedDepts.length} department{bulkSelectedDepts.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" className="border-slate-200" onClick={closeBulkDialog}>Cancel</Button>
              <Button
                className="bg-[#4982CF] text-white hover:bg-[#3D73BC]"
                disabled={!bulkSubDeptName.trim() || bulkSelectedDepts.length === 0}
                onClick={saveBulkSubDept}
                data-testid="btn-save-bulk-subdept"
              >
                Add to {bulkSelectedDepts.length > 0 ? `${bulkSelectedDepts.length} Department${bulkSelectedDepts.length !== 1 ? "s" : ""}` : "Departments"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
