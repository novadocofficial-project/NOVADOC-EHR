import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  Activity,
  Banknote,
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  CreditCard,
  Edit2,
  GitBranch,
  Layers,
  LayoutGrid,
  Package,
  Plus,
  Receipt,
  Search,
  Settings,
  Shield,
  Sparkles,
  Stethoscope,
  Tag,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { DoctorsModule, Doctor, INITIAL_DOCTORS } from "@/pages/DoctorsModule";
import { SpecialtiesModule } from "@/pages/SpecialtiesModule";
import { FeesModule } from "@/pages/FeesModule";
import { ServiceTypesModule } from "@/pages/ServiceTypesModule";
import { ServicePricingModule } from "@/pages/ServicePricingModule";
import { CorporatePricingModule } from "@/pages/CorporatePricingModule";
import { InsurancePricingModule } from "@/pages/InsurancePricingModule";
import { PackagesModule } from "@/pages/PackagesModule";
import { INITIAL_SERVICE_TYPES, INITIAL_SERVICES } from "@/pages/BillingTypes";
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
      { id: "sd1-1", name: "Outpatient", active: true },
      { id: "sd1-2", name: "Inpatient", active: false },
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
      { id: "sd2-1", name: "Surgery", active: true },
      { id: "sd2-2", name: "Rehabilitation", active: true },
    ],
    specialties: [
      { id: "sp2-1", name: "Joint Replacement", description: "Hip, knee, and shoulder replacement surgeries for arthritis and injury-related joint damage.", active: true },
      { id: "sp2-2", name: "Sports Medicine", description: "Treatment of sports-related injuries including ligament tears, fractures, and muscle conditions.", active: true },
    ],
  },
  {
    id: "d3",
    name: "Neurology",
    active: false,
    subDepartments: [
      { id: "sd3-1", name: "Consultation", active: true },
    ],
    specialties: [
      { id: "sp3-1", name: "Stroke & Cerebrovascular", description: "Emergency and long-term management of stroke, TIA, and cerebrovascular disease.", active: true },
      { id: "sp3-2", name: "Epilepsy", description: "Diagnosis and management of seizure disorders using EEG, medications, and surgical options.", active: false },
    ],
  },
  {
    id: "d4",
    name: "Pediatrics",
    active: true,
    subDepartments: [
      { id: "sd4-1", name: "Vaccination", active: true },
      { id: "sd4-2", name: "ICU", active: false },
    ],
    specialties: [
      { id: "sp4-1", name: "Neonatology", description: "Specialized care for newborns, especially premature or critically ill infants in the NICU.", active: true },
      { id: "sp4-2", name: "Pediatric Oncology", description: "Diagnosis and treatment of cancers in children including leukemia and solid tumors.", active: true },
    ],
  },
];

type ActiveModule =
  | "departments" | "specialties" | "doctors" | "fees"
  | "service-types" | "service-pricing" | "corporate-pricing" | "insurance-pricing" | "packages";

export function AdminSettings() {
  const [, setLocation] = useLocation();
  const [activeModule, setActiveModule] = useState<ActiveModule>("departments");
  const [navExpanded, setNavExpanded] = useState({ departments: true, doctors: true, billing: true });
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DATA);

  const toggleNav = (key: keyof typeof navExpanded) =>
    setNavExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(INITIAL_SERVICE_TYPES);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);

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
        ? { ...d, subDepartments: [...d.subDepartments, { id: `sd-${Date.now()}-${d.id}`, name, active: true }] }
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
      className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${activeModule === module ? "bg-[#4982CF]/10 text-[#4982CF]" : "text-slate-600 hover:bg-slate-100"}`}
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
            <Link href="/" className="flex items-center h-9 px-3 hover:bg-slate-100 rounded-md">Transactions</Link>
            <Button variant="ghost" className="h-9 px-3 hover:bg-slate-100">Reports</Button>
            <Button variant="ghost" className="h-9 px-3 hover:bg-slate-100">Claims</Button>
            <Button variant="ghost" className="h-9 px-3 hover:bg-slate-100">Settlements</Button>
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
              <span className="flex-1 text-left">Departments</span>
              {navExpanded.departments
                ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {navExpanded.departments && (
              <div className="ml-3 space-y-0.5 border-l-2 border-slate-100 pl-3">
                {subNavItem("departments", <LayoutGrid className="h-3.5 w-3.5" />, "Sub-Departments")}
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

            {/* Soon items */}
            <button type="button" disabled className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-300 cursor-default">
              <Layers className="h-4 w-4" />
              <span className="flex-1 text-left">Services</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Soon</span>
            </button>
            <button type="button" disabled className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-300 cursor-default">
              <GitBranch className="h-4 w-4" />
              <span className="flex-1 text-left">Branches</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Soon</span>
            </button>
          </nav>
        </aside>

        {/* Right Content */}
        <main className={`flex-1 bg-slate-50/50 ${["fees","service-pricing","corporate-pricing","insurance-pricing","packages"].includes(activeModule) ? "overflow-hidden" : "overflow-y-auto p-6"}`}>
          {activeModule === "doctors" && (
            <DoctorsModule departments={departments} doctors={doctors} setDoctors={setDoctors} />
          )}
          {activeModule === "specialties" && (
            <SpecialtiesModule departments={departments} setDepartments={setDepartments} />
          )}
          {activeModule === "fees" && (
            <FeesModule departments={departments} doctors={doctors} services={services} serviceTypes={serviceTypes} />
          )}
          {activeModule === "service-types" && (
            <ServiceTypesModule serviceTypes={serviceTypes} setServiceTypes={setServiceTypes} />
          )}
          {activeModule === "service-pricing" && (
            <ServicePricingModule serviceTypes={serviceTypes} services={services} setServices={setServices} departments={departments} />
          )}
          {activeModule === "corporate-pricing" && (
            <CorporatePricingModule serviceTypes={serviceTypes} services={services} />
          )}
          {activeModule === "insurance-pricing" && (
            <InsurancePricingModule serviceTypes={serviceTypes} services={services} />
          )}
          {activeModule === "packages" && (
            <PackagesModule services={services} serviceTypes={serviceTypes} />
          )}

          {activeModule === "departments" && (
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Departments & Sub-Departments</h1>
                  <p className="mt-1 text-sm text-slate-500">Manage hospital departments and their active status for billing.</p>
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
