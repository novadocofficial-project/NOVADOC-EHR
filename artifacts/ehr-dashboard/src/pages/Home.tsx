import { Link } from "wouter";
import {
  Activity,
  AlertOctagon,
  ArrowUpRight,
  BarChart2,
  Brain,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Dna,
  FileSearch,
  Globe,
  GraduationCap,
  Headphones,
  Home as HomeIcon,
  LayoutDashboard,
  MapPin,
  MonitorPlay,
  ShieldCheck,
  Stethoscope,
  Ticket,
  UserCheck,
  Users,
  Video,
} from "lucide-react";
import { QueueAppHeader } from "@/pages/QueuePageLayout";

type Mod = {
  id: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  active: true;
  href: string;
  desc: string;
} | {
  id: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  active: false;
};

const MODULES: Mod[] = [
  { id: "appointments",     label: "Appointments",                   icon: Calendar,     iconColor: "#6366f1", iconBg: "#ede9fe", active: true,  href: "/appointments/frontdesk", desc: "Schedule & manage patient appointments" },
  { id: "patient-queue",    label: "Patient Queue",                  icon: Ticket,       iconColor: "#4982CF", iconBg: "#dbeafe", active: true,  href: "/queue/token/single", desc: "Token management & live queue" },
  { id: "primary-hc",       label: "Primary Healthcare",             icon: Stethoscope,  iconColor: "#059669", iconBg: "#d1fae5", active: true,  href: "/queue/token/multistep", desc: "OPD multi-step visit workflow" },
  { id: "ncd-clinic",       label: "NCD Clinic",                     icon: Activity,     iconColor: "#d97706", iconBg: "#fef3c7", active: false },
  { id: "specialist-care",  label: "Specialist Care Modules",        icon: ClipboardList,iconColor: "#7c3aed", iconBg: "#ede9fe", active: true,  href: "/admin?section=specialty-forms", desc: "Manage specialty consultation forms" },
  { id: "care-manager",     label: "Care Manager",                   icon: UserCheck,    iconColor: "#0891b2", iconBg: "#cffafe", active: true,  href: "/appointments/nursing?section=care-plan", desc: "Patient care plans & nursing care management" },
  { id: "social-det",       label: "Social Determinants",            icon: Globe,        iconColor: "#2563eb", iconBg: "#dbeafe", active: true,  href: "/admin?section=reg-demographics", desc: "Patient registration & demographics" },
  { id: "preventive-hp",    label: "Preventive Health Protocol",     icon: ShieldCheck,  iconColor: "#059669", iconBg: "#d1fae5", active: false },
  { id: "home-hc",          label: "Home Healthcare",                icon: HomeIcon,     iconColor: "#ea580c", iconBg: "#ffedd5", active: false },
  { id: "tele-clinic",      label: "Tele-Clinic",                    icon: Video,        iconColor: "#0d9488", iconBg: "#ccfbf1", active: false },
  { id: "urgent-care",      label: "Urgent Care & Emergency Clinic", icon: AlertOctagon, iconColor: "#dc2626", iconBg: "#fee2e2", active: true,  href: "/appointments/nursing?section=triage", desc: "Emergency triage" },
  { id: "genetic-disease",  label: "Genetic Disease Diabetes",       icon: Dna,          iconColor: "#7c3aed", iconBg: "#ede9fe", active: false },
  { id: "mental-health",    label: "Mental Health",                  icon: Brain,        iconColor: "#db2777", iconBg: "#fce7f3", active: true,  href: "/appointments/nursing?section=vitals", desc: "Mental health assessments & vital monitoring" },
  { id: "support-staff",    label: "Support Staff",                  icon: Headphones,   iconColor: "#6366f1", iconBg: "#ede9fe", active: false },
  { id: "rural-hc",         label: "Rural Healthcare",               icon: MapPin,       iconColor: "#65a30d", iconBg: "#ecfccb", active: false },
  { id: "physician-asst",   label: "Physician Assistant",            icon: MonitorPlay,  iconColor: "#0284c7", iconBg: "#e0f2fe", active: false },
  { id: "data-analytics",   label: "Data Analytics",                 icon: BarChart2,    iconColor: "#4982CF", iconBg: "#dbeafe", active: true,  href: "/reports", desc: "Financial records & transactions" },
  { id: "population-hc",    label: "Population Healthcare",          icon: Users,        iconColor: "#b45309", iconBg: "#fef3c7", active: false },
  { id: "research-docs",    label: "Research Documents",             icon: FileSearch,   iconColor: "#6366f1", iconBg: "#ede9fe", active: false },
  { id: "quality-assurance",label: "Quality Assurance",              icon: CheckCircle2, iconColor: "#059669", iconBg: "#d1fae5", active: false },
  { id: "lms",              label: "Learning Management System",     icon: GraduationCap,iconColor: "#7c3aed", iconBg: "#ede9fe", active: false },
];

function LiveBadge() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Live</span>
    </div>
  );
}

function ActiveTile({ mod }: { mod: Mod & { active: true } }) {
  const Icon = mod.icon;
  return (
    <Link href={mod.href}>
      <div className="group relative flex flex-col items-center gap-3 rounded-2xl border-2 border-[#4982CF] bg-white px-4 py-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full">
        <div className="absolute top-3 left-3">
          <LiveBadge />
        </div>
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <ArrowUpRight className="h-3.5 w-3.5 text-[#4982CF]" />
        </div>
        <div className="mt-4 h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200" style={{ backgroundColor: mod.iconBg }}>
          <Icon className="h-7 w-7" style={{ color: mod.iconColor }} strokeWidth={1.75} />
        </div>
        <div className="text-center space-y-0.5">
          <p className="text-xs font-bold text-slate-800 leading-snug">{mod.label}</p>
          <p className="text-[10px] text-slate-400 leading-tight">{mod.desc}</p>
        </div>
      </div>
    </Link>
  );
}

function InactiveTile({ mod }: { mod: Mod & { active: false } }) {
  const Icon = mod.icon;
  return (
    <div
      className="relative flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-5 cursor-not-allowed select-none opacity-50 h-full"
      title="Coming soon"
    >
      <div className="absolute top-3 right-3">
        <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Soon</span>
      </div>
      <div className="mt-4 h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Icon className="h-7 w-7 text-slate-400" strokeWidth={1.75} />
      </div>
      <p className="text-xs font-semibold text-slate-500 text-center leading-snug">{mod.label}</p>
    </div>
  );
}

export function Home() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <QueueAppHeader />

      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f2544] via-[#1a3460] to-[#2d5fa8] px-8 py-10 flex-none">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4982CF, transparent 70%)" }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span className="text-emerald-400 text-xs font-semibold tracking-wide">All Systems Online</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none">
              Healthcare Management Platform
            </h1>
            <p className="text-blue-200/80 text-sm mt-2">NovaDoc EHR · Select a module to continue</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-blue-200/60 text-[10px] uppercase tracking-widest font-semibold">Today</p>
              <p className="text-white font-semibold text-sm mt-0.5">{today}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-white/70" />
            </div>
          </div>
        </div>
      </div>

      {/* Module grid */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="flex items-baseline gap-3 mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Available Modules</p>
          <span className="text-[10px] text-slate-300">—</span>
          <p className="text-[10px] text-slate-400">
            <span className="font-semibold text-emerald-600">5 active</span> · 16 coming soon
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          {MODULES.map(mod =>
            mod.active
              ? <ActiveTile key={mod.id} mod={mod} />
              : <InactiveTile key={mod.id} mod={mod} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-none border-t border-slate-200 bg-white px-8 py-3 flex items-center justify-between">
        <p className="text-xs text-slate-400">NovaDoc EHR · Healthcare Management System</p>
        <p className="text-xs text-slate-400">v1.0.0</p>
      </footer>
    </div>
  );
}
