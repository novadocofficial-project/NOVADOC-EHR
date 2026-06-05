import { useState, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  UserCircle,
  Clock,
  CalendarDays,
  Stethoscope,
  HelpCircle,
  GraduationCap,
  Wrench,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SubDept = { id: string; name: string; active: boolean };
type DeptSpecialty = { id: string; name: string; description: string; active: boolean };
type Dept = { id: string; name: string; active: boolean; subDepartments: SubDept[]; specialties: DeptSpecialty[] };

type Qualification = { id: string; name: string; startYear: string; completionYear: string };
type Timing = { id: string; day: string; startTime: string; endTime: string; slotDuration: number; allowMultiple: boolean };
type FAQ = { id: string; question: string; answer: string };

type Professional = {
  awards: string; expertise: string; memberships: string;
  languages: string; experience: string; degreeCompletion: string; pmdcNumber: string;
};

export type Doctor = {
  id: string;
  name: string;
  gender: string;
  phone: string;
  email: string;
  shift: string;
  departments: string[];
  subDepartments: Record<string, string[]>;
  specialties: string[];
  doctorType: "token" | "appointment";
  hasProfessionalDetails: boolean;
  professional: Partial<Professional>;
  qualifications: Qualification[];
  services: string[];
  timings: Timing[];
  faqs: FAQ[];
  status: "active" | "inactive";
};

const CONSULT_SERVICES = ["Consultation", "FollowUp", "Emergency", "Tele-consultation"];
const OTHER_SERVICES   = ["Vaccinations", "Procedures", "Consumables", "Pharmacy", "Imaging", "Lab"];
const ALL_SERVICES = [...CONSULT_SERVICES, ...OTHER_SERVICES];

const SHIFTS = ["Morning", "Afternoon", "Evening", "Night"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const GENDERS = ["Male", "Female", "Other"];

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: "doc-1", name: "Dr. Emily Wong", gender: "Female",
    phone: "+1 (555) 201-3344", email: "emily.wong@medfinance.com", shift: "Morning",
    departments: ["d1", "d2"], subDepartments: { d1: ["sd1-1"], d2: ["sd2-1"] },
    specialties: ["Interventional Cardiology", "Electrophysiology"], doctorType: "appointment",
    hasProfessionalDetails: true,
    professional: { awards: "Best Cardiologist 2021", expertise: "Heart failure, Arrhythmia", memberships: "AHA, ESC", languages: "English, Mandarin", experience: "12 years", degreeCompletion: "2010", pmdcNumber: "PMDC-2010-8821" },
    qualifications: [
      { id: "q1", name: "MBBS", startYear: "2004", completionYear: "2010" },
      { id: "q2", name: "MD Cardiology", startYear: "2010", completionYear: "2013" },
    ],
    services: ["Consultation", "FollowUp"],
    timings: [
      { id: "t1", day: "Monday", startTime: "09:00", endTime: "13:00", slotDuration: 30, allowMultiple: false },
      { id: "t2", day: "Wednesday", startTime: "09:00", endTime: "13:00", slotDuration: 30, allowMultiple: false },
    ],
    faqs: [{ id: "f1", question: "What conditions do you treat?", answer: "I specialize in heart conditions, arrhythmias, and preventive cardiology." }],
    status: "active",
  },
  {
    id: "doc-2", name: "Dr. James Wilson", gender: "Male",
    phone: "+1 (555) 302-5511", email: "james.wilson@medfinance.com", shift: "Afternoon",
    departments: ["d2"], subDepartments: { d2: ["sd2-1"] },
    specialties: ["Joint Replacement"], doctorType: "token",
    hasProfessionalDetails: false, professional: {},
    qualifications: [{ id: "q3", name: "MBBS", startYear: "2005", completionYear: "2011" }],
    services: ["Consultation", "Procedures"],
    timings: [{ id: "t3", day: "Tuesday", startTime: "13:00", endTime: "18:00", slotDuration: 20, allowMultiple: true }],
    faqs: [], status: "active",
  },
  {
    id: "doc-3", name: "Dr. Sarah Connor", gender: "Female",
    phone: "+1 (555) 410-7720", email: "sarah.connor@medfinance.com", shift: "Morning",
    departments: ["d3"], subDepartments: { d3: ["sd3-1"] },
    specialties: ["Stroke & Cerebrovascular"], doctorType: "appointment",
    hasProfessionalDetails: false, professional: {},
    qualifications: [{ id: "q4", name: "MBBS", startYear: "2006", completionYear: "2012" }, { id: "q5", name: "MD Neurology", startYear: "2012", completionYear: "2015" }],
    services: ["Consultation", "FollowUp", "Tele-consultation"],
    timings: [{ id: "t4", day: "Thursday", startTime: "10:00", endTime: "15:00", slotDuration: 45, allowMultiple: false }],
    faqs: [], status: "inactive",
  },
  {
    id: "doc-asif", name: "Dr. Asif Imam", gender: "Male",
    phone: "03001239424", email: "", shift: "Morning",
    departments: ["d-immuno"], subDepartments: { "d-immuno": ["sd-immuno-1"] },
    specialties: ["General Immunology"], doctorType: "appointment",
    hasProfessionalDetails: false, professional: {},
    qualifications: [],
    services: ["Consultation", "FollowUp", "Tele-consultation", "Procedures"],
    timings: [
      { id: "asif-t1", day: "Monday",    startTime: "10:00", endTime: "18:00", slotDuration: 30, allowMultiple: false },
      { id: "asif-t3", day: "Wednesday", startTime: "10:00", endTime: "18:00", slotDuration: 30, allowMultiple: false },
      { id: "asif-t4", day: "Thursday",  startTime: "10:00", endTime: "18:00", slotDuration: 30, allowMultiple: false },
      { id: "asif-t6", day: "Friday",    startTime: "10:00", endTime: "18:00", slotDuration: 30, allowMultiple: false },
      { id: "asif-t5", day: "Saturday",  startTime: "10:00", endTime: "16:00", slotDuration: 30, allowMultiple: false },
    ],
    faqs: [], status: "active",
  },
];

function calcSlots(startTime: string, endTime: string, slotDuration: number): number {
  if (!startTime || !endTime || !slotDuration) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const totalMins = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMins <= 0) return 0;
  return Math.floor(totalMins / slotDuration);
}

function newForm(): Omit<Doctor, "id" | "status"> {
  return {
    name: "", gender: "", phone: "", email: "", shift: "",
    departments: [], subDepartments: {}, specialties: [], doctorType: "appointment",
    hasProfessionalDetails: false,
    professional: { awards: "", expertise: "", memberships: "", languages: "", experience: "", degreeCompletion: "", pmdcNumber: "" },
    qualifications: [], services: [], timings: [], faqs: [],
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">{children}</p>;
}

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold text-slate-600">{label}{required && <span className="ml-1 text-rose-500">*</span>}</Label>
      {children}
    </div>
  );
}

type AssignedForm = { id: string; name: string; sections: { id: string }[]; assignedDoctorIds: string[]; status: string };

export function DoctorsModule({
  departments,
  doctors,
  setDoctors,
  onNavigateToForms,
}: {
  departments: Dept[];
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  onNavigateToForms?: () => void;
}) {
  const [specialtyForms] = useState<AssignedForm[]>(() => {
    try {
      const raw = localStorage.getItem("ehr-specialty-forms-v1");
      if (raw) return JSON.parse(raw) as AssignedForm[];
    } catch {}
    return [];
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("biography");
  const [form, setForm] = useState<Omit<Doctor, "id" | "status">>(newForm);

  const openAdd = () => {
    setForm(newForm());
    setEditingId(null);
    setActiveTab("biography");
    setShowForm(true);
  };

  const openEdit = (doc: Doctor) => {
    const { id, status, ...rest } = doc;
    setForm({ ...rest });
    setEditingId(id);
    setActiveTab("biography");
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const saveForm = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      setDoctors(prev => prev.map(d => d.id === editingId ? { ...form, id: editingId, status: d.status } : d));
    } else {
      setDoctors(prev => [...prev, { ...form, id: `doc-${Date.now()}`, status: "active" }]);
    }
    closeForm();
  };

  const deleteDoctor = (id: string) => setDoctors(prev => prev.filter(d => d.id !== id));
  const toggleStatus = (id: string) => setDoctors(prev => prev.map(d => d.id === id ? { ...d, status: d.status === "active" ? "inactive" : "active" } : d));

  const setField = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const setProfField = (key: keyof Professional, value: string) =>
    setForm(f => ({ ...f, professional: { ...f.professional, [key]: value } }));

  const toggleDept = (deptId: string) => {
    const isSelected = form.departments.includes(deptId);
    if (isSelected) {
      const dept = departments.find(d => d.id === deptId);
      const removedSpecialtyNames = (dept?.specialties ?? []).map(s => s.name);
      const newSubDepts = { ...form.subDepartments };
      delete newSubDepts[deptId];
      setForm(f => ({
        ...f,
        departments: f.departments.filter(d => d !== deptId),
        subDepartments: newSubDepts,
        specialties: f.specialties.filter(s => !removedSpecialtyNames.includes(s)),
      }));
    } else {
      setForm(f => ({ ...f, departments: [...f.departments, deptId], subDepartments: { ...f.subDepartments, [deptId]: [] } }));
    }
  };

  const availableSpecialties = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; name: string; deptId: string; deptName: string }[] = [];
    form.departments.forEach(deptId => {
      const dept = departments.find(d => d.id === deptId);
      if (dept) {
        dept.specialties.forEach(spec => {
          if (!seen.has(spec.id)) {
            seen.add(spec.id);
            result.push({ id: spec.id, name: spec.name, deptId: dept.id, deptName: dept.name });
          }
        });
      }
    });
    return result;
  }, [form.departments, departments]);

  const toggleSubDept = (deptId: string, subId: string) => {
    const current = form.subDepartments[deptId] ?? [];
    const updated = current.includes(subId) ? current.filter(s => s !== subId) : [...current, subId];
    setForm(f => ({ ...f, subDepartments: { ...f.subDepartments, [deptId]: updated } }));
  };

  const toggleSpecialty = (s: string) =>
    setField("specialties", form.specialties.includes(s) ? form.specialties.filter(x => x !== s) : [...form.specialties, s]);

  const toggleService = (s: string) =>
    setField("services", form.services.includes(s) ? form.services.filter(x => x !== s) : [...form.services, s]);

  const addQualification = () =>
    setField("qualifications", [...form.qualifications, { id: `q-${Date.now()}`, name: "", startYear: "", completionYear: "" }]);

  const updateQualification = (id: string, key: keyof Qualification, val: string) =>
    setField("qualifications", form.qualifications.map(q => q.id === id ? { ...q, [key]: val } : q));

  const removeQualification = (id: string) =>
    setField("qualifications", form.qualifications.filter(q => q.id !== id));

  const addTiming = () =>
    setField("timings", [...form.timings, { id: `t-${Date.now()}`, day: "Monday", startTime: "09:00", endTime: "13:00", slotDuration: 30, allowMultiple: false }]);

  const updateTiming = (id: string, key: keyof Timing, val: string | number | boolean) =>
    setField("timings", form.timings.map(t => t.id === id ? { ...t, [key]: val } : t));

  const removeTiming = (id: string) =>
    setField("timings", form.timings.filter(t => t.id !== id));

  const addFaq = () =>
    setField("faqs", [...form.faqs, { id: `f-${Date.now()}`, question: "", answer: "" }]);

  const updateFaq = (id: string, key: keyof FAQ, val: string) =>
    setField("faqs", form.faqs.map(f => f.id === id ? { ...f, [key]: val } : f));

  const removeFaq = (id: string) =>
    setField("faqs", form.faqs.filter(f => f.id !== id));

  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name ?? id;
  const getSubDeptName = (deptId: string, subId: string) =>
    departments.find(d => d.id === deptId)?.subDepartments.find(s => s.id === subId)?.name ?? subId;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage doctors, their schedules, and availability.</p>
        </div>
        <Button className="bg-[#4982CF] text-white hover:bg-[#3D73BC]" onClick={openAdd} data-testid="btn-add-doctor">
          <Plus className="mr-2 h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      {/* Doctor List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="grid grid-cols-12 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <div className="col-span-4">Doctor</div>
            <div className="col-span-3">Departments / Specialties</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
        </div>

        {doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <UserCircle className="mb-3 h-10 w-10" />
            <p className="text-sm font-medium">No doctors added yet</p>
            <p className="mt-1 text-xs">Click "Add Doctor" to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {doctors.map(doc => (
              <div key={doc.id} className="grid grid-cols-12 items-center gap-2 px-5 py-4 hover:bg-slate-50/60 transition-colors" data-testid={`doctor-row-${doc.id}`}>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#4982CF]/10 text-sm font-bold text-[#4982CF]">
                    {doc.name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{doc.name}</p>
                    <p className="truncate text-xs text-slate-500">{doc.shift} Shift · {doc.email}</p>
                  </div>
                </div>

                <div className="col-span-3 min-w-0">
                  {doc.departments.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {doc.departments.slice(0, 2).map(dId => (
                        <span key={dId} className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{getDeptName(dId)}</span>
                      ))}
                      {doc.departments.length > 2 && (
                        <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">+{doc.departments.length - 2}</span>
                      )}
                    </div>
                  ) : <span className="text-xs text-slate-400">—</span>}
                  {doc.specialties.length > 0 && (
                    <p className="mt-1 truncate text-[10px] text-slate-500">{doc.specialties.slice(0, 2).join(", ")}{doc.specialties.length > 2 ? ` +${doc.specialties.length - 2}` : ""}</p>
                  )}
                  {(() => {
                    const docForms = specialtyForms.filter(f => f.assignedDoctorIds.includes(doc.id));
                    if (!docForms.length) return null;
                    return (
                      <button
                        type="button"
                        onClick={onNavigateToForms}
                        className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#4982CF] hover:underline"
                      >
                        <BookOpen className="h-2.5 w-2.5 shrink-0" />
                        {docForms.length === 1 ? docForms[0].name : `${docForms.length} specialty forms`}
                      </button>
                    );
                  })()}
                </div>

                <div className="col-span-2">
                  <Badge variant="outline" className="border-[#4982CF]/25 bg-[#4982CF]/10 text-[#4982CF] capitalize">
                    {doc.doctorType === "token" ? "Token-based" : "Appointment"}
                  </Badge>
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <Switch
                    checked={doc.status === "active"}
                    onCheckedChange={() => toggleStatus(doc.id)}
                    data-testid={`toggle-status-${doc.id}`}
                  />
                  <Badge className={doc.status === "active" ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20"}>
                    {doc.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="col-span-1 flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-[#4982CF]/10 hover:text-[#4982CF]" onClick={() => openEdit(doc)} data-testid={`btn-edit-${doc.id}`}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => deleteDoctor(doc.id)} data-testid={`btn-delete-${doc.id}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={open => !open && closeForm()}>
        <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="flex-none border-b border-slate-100 px-6 py-4">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingId ? "Edit Doctor" : "Add Doctor"}
            </DialogTitle>
            <p className="text-xs text-slate-500">Fill in the details across all sections and save when done.</p>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
            <TabsList className="flex h-auto w-full flex-none justify-start gap-0 rounded-none border-b border-slate-100 bg-white px-6 pb-0 pt-2">
              {[
                { value: "biography", icon: UserCircle, label: "Biography" },
                { value: "qualifications", icon: GraduationCap, label: "Qualifications" },
                { value: "services", icon: Wrench, label: "Services" },
                { value: "timings", icon: Clock, label: "Timings" },
                { value: "faqs", icon: HelpCircle, label: "FAQs" },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-4 pb-3 pt-1 text-xs font-semibold text-slate-500 data-[state=active]:border-[#4982CF] data-[state=active]:text-[#4982CF]"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              {/* ── TAB 1: Biography ── */}
              <TabsContent value="biography" className="m-0 p-6 space-y-6">
                <div>
                  <SectionLabel>Basic Information</SectionLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Full Name" required>
                      <Input placeholder="Dr. Full Name" value={form.name} onChange={e => setField("name", e.target.value)} className="h-9" data-testid="input-name" />
                    </FormField>
                    <FormField label="Gender" required>
                      <Select value={form.gender} onValueChange={v => setField("gender", v)}>
                        <SelectTrigger className="h-9" data-testid="select-gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Phone">
                      <Input placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => setField("phone", e.target.value)} className="h-9" />
                    </FormField>
                    <FormField label="Email">
                      <Input type="email" placeholder="doctor@clinic.com" value={form.email} onChange={e => setField("email", e.target.value)} className="h-9" />
                    </FormField>
                    <FormField label="Password">
                      <Input type="password" placeholder="Set initial password" className="h-9" />
                    </FormField>
                    <FormField label="Shift" required>
                      <Select value={form.shift} onValueChange={v => setField("shift", v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select shift" /></SelectTrigger>
                        <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormField>
                  </div>
                </div>

                <Separator />

                <div>
                  <SectionLabel>Doctor Type</SectionLabel>
                  <div className="flex gap-4">
                    {(["appointment", "token"] as const).map(type => (
                      <label key={type} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${form.doctorType === type ? "border-[#4982CF] bg-[#4982CF]/5" : "border-slate-200 hover:border-slate-300"}`}>
                        <input
                          type="radio"
                          className="accent-[#4982CF]"
                          checked={form.doctorType === type}
                          onChange={() => setField("doctorType", type)}
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-700 capitalize">{type === "token" ? "Token-based" : "Appointment-based"}</p>
                          <p className="text-xs text-slate-500">{type === "token" ? "Walk-in queue tokens" : "Pre-booked appointments"}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <SectionLabel>Department & Sub-Department Mapping</SectionLabel>
                  {departments.length === 0 ? (
                    <p className="text-xs text-slate-400">No departments found. Add departments first in the Departments module.</p>
                  ) : (
                    <div className="space-y-3">
                      {departments.map(dept => {
                        const isSelected = form.departments.includes(dept.id);
                        return (
                          <div key={dept.id} className={`rounded-lg border p-3 transition-all ${isSelected ? "border-[#4982CF]/30 bg-[#4982CF]/5" : "border-slate-200"}`}>
                            <label className="flex cursor-pointer items-center gap-2">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleDept(dept.id)}
                                className="data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
                              />
                              <span className="text-sm font-semibold text-slate-700">{dept.name}</span>
                              {!dept.active && <Badge variant="outline" className="ml-1 text-[10px] text-amber-600 border-amber-200">Inactive</Badge>}
                            </label>
                            {isSelected && dept.subDepartments.length > 0 && (
                              <div className="mt-2 ml-6 flex flex-wrap gap-2">
                                {dept.subDepartments.map(sub => {
                                  const isSubSelected = (form.subDepartments[dept.id] ?? []).includes(sub.id);
                                  return (
                                    <label key={sub.id} className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-all ${isSubSelected ? "border-[#4982CF]/40 bg-[#4982CF]/10 text-[#4982CF] font-semibold" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                                      <Checkbox
                                        checked={isSubSelected}
                                        onCheckedChange={() => toggleSubDept(dept.id, sub.id)}
                                        className="h-3 w-3 data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
                                      />
                                      {sub.name}
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                            {isSelected && dept.subDepartments.length === 0 && (
                              <p className="mt-1 ml-6 text-xs text-slate-400">No sub-departments in this department.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <SectionLabel>Specialties</SectionLabel>
                  {form.departments.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                      <p className="text-xs text-slate-400">Select departments above to see their available specialties.</p>
                    </div>
                  ) : availableSpecialties.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                      <p className="text-xs text-slate-400">No specialties are configured for the selected departments.</p>
                      <p className="mt-1 text-[11px] text-slate-400">Add specialties in Admin Settings → Specialties.</p>
                    </div>
                  ) : (
                    <TooltipProvider delayDuration={200}>
                      <div className="space-y-4">
                        {form.departments.map(deptId => {
                          const dept = departments.find(d => d.id === deptId);
                          if (!dept || dept.specialties.length === 0) return null;
                          return (
                            <div key={deptId}>
                              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">{dept.name}</p>
                              <div className="flex flex-wrap gap-2">
                                {dept.specialties.map(spec => {
                                  const selected = form.specialties.includes(spec.name);
                                  return (
                                    <Tooltip key={spec.id}>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() => toggleSpecialty(spec.name)}
                                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${selected ? "border-[#4982CF] bg-[#4982CF] text-white" : "border-slate-200 text-slate-600 hover:border-[#4982CF]/50 hover:text-[#4982CF]"}`}
                                        >
                                          {spec.name}
                                        </button>
                                      </TooltipTrigger>
                                      {spec.description && (
                                        <TooltipContent side="top" className="max-w-56 text-center leading-relaxed">
                                          {spec.description}
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </TooltipProvider>
                  )}
                </div>

                <Separator />

                <div>
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <Checkbox
                      checked={form.hasProfessionalDetails}
                      onCheckedChange={v => setField("hasProfessionalDetails", !!v)}
                      className="data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
                    />
                    <span className="text-sm font-semibold text-slate-700">Add Professional Statement</span>
                  </label>

                  {form.hasProfessionalDetails && (
                    <div className="mt-4 rounded-lg border border-[#4982CF]/20 bg-[#4982CF]/5 p-4 space-y-4">
                      <SectionLabel>Professional Details</SectionLabel>
                      <div className="grid grid-cols-2 gap-4">
                        {([
                          ["pmdcNumber", "PMDC Number"],
                          ["experience", "Years of Experience"],
                          ["languages", "Languages Spoken"],
                        ] as [keyof Professional, string][]).map(([key, label]) => (
                          <FormField key={key} label={label}>
                            <Input
                              placeholder={label}
                              value={(form.professional[key] as string) ?? ""}
                              onChange={e => setProfField(key, e.target.value)}
                              className="h-9 bg-white"
                            />
                          </FormField>
                        ))}
                        {([
                          ["awards", "Awards & Recognition"],
                          ["expertise", "Areas of Expertise"],
                          ["memberships", "Professional Memberships"],
                        ] as [keyof Professional, string][]).map(([key, label]) => (
                          <FormField key={key} label={label}>
                            <Textarea
                              placeholder={label}
                              value={(form.professional[key] as string) ?? ""}
                              onChange={e => setProfField(key, e.target.value)}
                              rows={2}
                              className="bg-white text-sm resize-none"
                            />
                          </FormField>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Separator />

                <div>
                  <SectionLabel>Specialty Forms</SectionLabel>
                  {(() => {
                    const docForms = editingId
                      ? specialtyForms.filter(f => f.assignedDoctorIds.includes(editingId))
                      : [];
                    if (!editingId) {
                      return (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center">
                          <p className="text-xs text-slate-400">Save the doctor first, then assign specialty forms in the Specialty Forms module.</p>
                        </div>
                      );
                    }
                    if (docForms.length === 0) {
                      return (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center">
                          <p className="text-xs text-slate-400">No specialty forms assigned to this doctor.</p>
                          {onNavigateToForms && (
                            <button type="button" onClick={onNavigateToForms} className="mt-1.5 text-xs font-semibold text-[#4982CF] hover:underline">
                              Manage in Specialty Forms →
                            </button>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-2">
                        {docForms.map(f => (
                          <div key={f.id} className="flex items-center gap-3 rounded-lg border border-[#4982CF]/20 bg-[#4982CF]/5 px-4 py-2.5">
                            <BookOpen className="h-4 w-4 shrink-0 text-[#4982CF]" />
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">{f.name}</p>
                              <p className="text-[10px] text-slate-500">{f.sections.length} section{f.sections.length !== 1 ? "s" : ""} · {f.status === "published" ? "Published" : "Draft"}</p>
                            </div>
                          </div>
                        ))}
                        {onNavigateToForms && (
                          <button type="button" onClick={onNavigateToForms} className="text-xs font-semibold text-[#4982CF] hover:underline">
                            Manage in Specialty Forms →
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </TabsContent>

              {/* ── TAB 2: Qualifications ── */}
              <TabsContent value="qualifications" className="m-0 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <SectionLabel>Academic Qualifications</SectionLabel>
                    <p className="text-xs text-slate-500">Add all degrees and certifications.</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-dashed border-[#4982CF]/40 text-[#4982CF] hover:bg-[#4982CF]/5" onClick={addQualification}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Qualification
                  </Button>
                </div>

                {form.qualifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-10 text-slate-400">
                    <GraduationCap className="mb-2 h-8 w-8" />
                    <p className="text-sm">No qualifications added yet</p>
                    <Button variant="ghost" size="sm" className="mt-2 text-[#4982CF]" onClick={addQualification}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add first qualification
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.qualifications.map((q, i) => (
                      <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4982CF]/15 text-xs font-bold text-[#4982CF]">{i + 1}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => removeQualification(q.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-3">
                            <FormField label="Qualification Name">
                              <Input placeholder="e.g. MBBS, MD Cardiology, FRCS" value={q.name} onChange={e => updateQualification(q.id, "name", e.target.value)} className="h-9" />
                            </FormField>
                          </div>
                          <FormField label="Start Year">
                            <Input placeholder="2004" value={q.startYear} onChange={e => updateQualification(q.id, "startYear", e.target.value)} className="h-9" maxLength={4} />
                          </FormField>
                          <FormField label="Completion Year">
                            <Input placeholder="2010" value={q.completionYear} onChange={e => updateQualification(q.id, "completionYear", e.target.value)} className="h-9" maxLength={4} />
                          </FormField>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── TAB 3: Services ── */}
              <TabsContent value="services" className="m-0 p-6 space-y-5">

                {/* ── Consultation Services ── */}
                <div className="overflow-hidden rounded-xl border border-[#4982CF]/20 bg-white shadow-sm">
                  <div className="flex items-start gap-3 border-b border-[#4982CF]/10 bg-[#4982CF]/5 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#4982CF]">Consultation Services</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Enabled services here will be available across <span className="font-semibold text-slate-600">all sub-departments</span> assigned to this doctor.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-4">
                    {CONSULT_SERVICES.map(svc => {
                      const selected = form.services.includes(svc);
                      return (
                        <label key={svc} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${selected ? "border-[#4982CF]/40 bg-[#4982CF]/5" : "border-slate-200 hover:border-slate-300"}`}>
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleService(svc)}
                            className="data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
                          />
                          <span className={`text-sm font-medium ${selected ? "text-[#4982CF]" : "text-slate-700"}`}>{svc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* ── Other Services ── */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700">Other Services</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Additional services offered by this doctor outside of consultation types.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-4">
                    {OTHER_SERVICES.map(svc => {
                      const selected = form.services.includes(svc);
                      return (
                        <label key={svc} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${selected ? "border-[#4982CF]/40 bg-[#4982CF]/5" : "border-slate-200 hover:border-slate-300"}`}>
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleService(svc)}
                            className="data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
                          />
                          <span className={`text-sm font-medium ${selected ? "text-[#4982CF]" : "text-slate-700"}`}>{svc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* ── Selected summary ── */}
                {form.services.length > 0 && (
                  <div className="rounded-lg border border-[#4982CF]/20 bg-[#4982CF]/5 p-3">
                    <p className="mb-2 text-xs font-semibold text-[#4982CF]">{form.services.length} service{form.services.length !== 1 ? "s" : ""} selected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.services.map(s => (
                        <span key={s} className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${CONSULT_SERVICES.includes(s) ? "bg-[#4982CF]" : "bg-slate-500"}`}>
                          {s}
                          <button type="button" onClick={() => toggleService(s)} className="ml-0.5 hover:opacity-75"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── TAB 4: Timings ── */}
              <TabsContent value="timings" className="m-0 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <SectionLabel>Availability & Schedule</SectionLabel>
                    <p className="text-xs text-slate-500">Set working hours and slot configuration per day.</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-dashed border-[#4982CF]/40 text-[#4982CF] hover:bg-[#4982CF]/5" onClick={addTiming}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Day
                  </Button>
                </div>

                {form.timings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-10 text-slate-400">
                    <CalendarDays className="mb-2 h-8 w-8" />
                    <p className="text-sm">No schedule set</p>
                    <Button variant="ghost" size="sm" className="mt-2 text-[#4982CF]" onClick={addTiming}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add first day
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.timings.map((t, i) => {
                      const slots = calcSlots(t.startTime, t.endTime, t.slotDuration);
                      return (
                        <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4982CF]/15 text-xs font-bold text-[#4982CF]">{i + 1}</span>
                              <span className="text-xs font-semibold text-slate-600">Day schedule</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => removeTiming(t.id)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-4 gap-3">
                            <FormField label="Day">
                              <Select value={t.day} onValueChange={v => updateTiming(t.id, "day", v)}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                              </Select>
                            </FormField>
                            <FormField label="Start Time">
                              <Input type="time" value={t.startTime} onChange={e => updateTiming(t.id, "startTime", e.target.value)} className="h-9" />
                            </FormField>
                            <FormField label="End Time">
                              <Input type="time" value={t.endTime} onChange={e => updateTiming(t.id, "endTime", e.target.value)} className="h-9" />
                            </FormField>
                            <FormField label="Slot (mins)">
                              <Input
                                type="number"
                                min={5}
                                max={120}
                                step={5}
                                value={t.slotDuration}
                                onChange={e => updateTiming(t.id, "slotDuration", Number(e.target.value) || 30)}
                                className="h-9"
                              />
                            </FormField>
                          </div>

                          <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                            <div className="flex items-center gap-2">
                              {slots > 0 ? (
                                <span className="text-xs font-semibold text-slate-700">
                                  <span className="text-[#4982CF]">{slots}</span> slot{slots !== 1 ? "s" : ""} available
                                  <span className="ml-1 font-normal text-slate-500">({t.startTime} – {t.endTime}, {t.slotDuration} min each)</span>
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">Configure times above to see slot preview</span>
                              )}
                            </div>
                            <label className="flex cursor-pointer items-center gap-2">
                              <Checkbox
                                checked={t.allowMultiple}
                                onCheckedChange={v => updateTiming(t.id, "allowMultiple", !!v)}
                                className="data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
                              />
                              <span className="text-xs text-slate-600">Allow multiple bookings per slot</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* ── TAB 5: FAQs ── */}
              <TabsContent value="faqs" className="m-0 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <SectionLabel>Frequently Asked Questions</SectionLabel>
                    <p className="text-xs text-slate-500">Add FAQs patients can read before booking.</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-dashed border-[#4982CF]/40 text-[#4982CF] hover:bg-[#4982CF]/5" onClick={addFaq}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add FAQ
                  </Button>
                </div>

                {form.faqs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-10 text-slate-400">
                    <HelpCircle className="mb-2 h-8 w-8" />
                    <p className="text-sm">No FAQs added yet</p>
                    <Button variant="ghost" size="sm" className="mt-2 text-[#4982CF]" onClick={addFaq}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add first FAQ
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.faqs.map((faq, i) => (
                      <div key={faq.id} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4982CF]/15 text-xs font-bold text-[#4982CF]">{i + 1}</span>
                            <span className="text-xs font-semibold text-slate-600">Q&A pair</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => removeFaq(faq.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <FormField label="Question">
                            <Input placeholder="e.g. What conditions do you treat?" value={faq.question} onChange={e => updateFaq(faq.id, "question", e.target.value)} className="h-9" />
                          </FormField>
                          <FormField label="Answer">
                            <Textarea placeholder="Write a clear, helpful answer..." value={faq.answer} onChange={e => updateFaq(faq.id, "answer", e.target.value)} rows={3} className="text-sm resize-none" />
                          </FormField>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          {/* Dialog Footer */}
          <div className="flex flex-none items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
            <div className="flex gap-2">
              {["biography", "qualifications", "services", "timings", "faqs"].map((tab, i, arr) => (
                <div key={tab} className={`h-1.5 w-6 rounded-full transition-all ${activeTab === tab ? "bg-[#4982CF]" : "bg-slate-200"}`} />
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-slate-200" onClick={closeForm}>Cancel</Button>
              <Button
                className="bg-[#4982CF] text-white hover:bg-[#3D73BC]"
                onClick={saveForm}
                disabled={!form.name.trim()}
                data-testid="btn-save-doctor"
              >
                {editingId ? "Save Changes" : "Add Doctor"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
