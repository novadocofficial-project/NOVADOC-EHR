import { useLocation, Link } from "wouter";
import {
  Bell, Search, Ticket, ChevronDown, Zap, Users, Workflow, BarChart2, Receipt,
  X, Printer, ArrowRight, Heart, Stethoscope, FlaskConical, LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QueueStatus = "waiting" | "called" | "completed";

export type QueueEntry = {
  id: string;
  tokenNumber: string;
  displayNum: number;
  patientName?: string;
  patientMrn?: string;
  patient?: Patient | null;
  status: QueueStatus;
  doctorId?: string;
  doctorName?: string;
  step: number;
  totalSteps: number;
  stepLabel?: string;
  createdAt: Date;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  counter: string;
  prefix: string;
  color: string;
  initials: string;
};

export type Patient = {
  id: string;
  mrn: string;
  name: string;
  phone: string;
  dob: string;
  gender: "M" | "F";
};

export type VisitType = {
  id: string;
  name: string;
  steps: string[];
  prefix: string;
  color: string;
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const SEED_BRANCHES = [
  { id: "br-1", name: "Main Branch — Lahore" },
  { id: "br-2", name: "North Branch — Islamabad" },
];

export const SEED_DOCTORS: Doctor[] = [
  { id: "doc-1", name: "Dr. Emily Wong",   specialty: "Cardiologist",       counter: "Room A", prefix: "C", color: "#4982CF", initials: "EW" },
  { id: "doc-2", name: "Dr. James Wilson", specialty: "Orthopedic Surgeon", counter: "Room B", prefix: "C", color: "#10b981", initials: "JW" },
  { id: "doc-3", name: "Dr. Sarah Connor", specialty: "Pediatrician",       counter: "Room C", prefix: "C", color: "#f59e0b", initials: "SC" },
];

export const SEED_PATIENTS: Patient[] = [
  { id: "p-1", mrn: "MR-40291", name: "Sarah Jenkins",    phone: "+92 300 234-9182", dob: "1985-03-12", gender: "F" },
  { id: "p-2", mrn: "MR-39102", name: "Michael Chang",    phone: "+92 311 882-1023", dob: "1990-07-22", gender: "M" },
  { id: "p-3", mrn: "MR-38201", name: "Aisha Patel",      phone: "+92 321 441-2903", dob: "1978-11-05", gender: "F" },
  { id: "p-4", mrn: "MR-41103", name: "Carlos Rivera",    phone: "+92 333 763-0018", dob: "2001-08-19", gender: "M" },
  { id: "p-5", mrn: "MR-42210", name: "Emma Thompson",    phone: "+92 345 301-4782", dob: "1965-02-28", gender: "F" },
  { id: "p-6", mrn: "MR-43001", name: "Raj Sharma",       phone: "+92 300 529-7201", dob: "1993-06-14", gender: "M" },
  { id: "p-7", mrn: "MR-44120", name: "Fatima Al-Hassan", phone: "+92 312 917-3340", dob: "1982-09-30", gender: "F" },
  { id: "p-8", mrn: "MR-45000", name: "David Okonkwo",    phone: "+92 321 643-8827", dob: "1977-12-01", gender: "M" },
];

export const SEED_VISIT_TYPES: VisitType[] = [
  { id: "vt-1", name: "Normal Consultation (OPD)", steps: ["Registration", "Vitals", "Doctor Consultation", "Lab / Sample", "Pharmacy"], prefix: "C", color: "#4982CF" },
  { id: "vt-2", name: "Urgent / Emergency",        steps: ["Triage & Registration", "Emergency Consultation"],                 prefix: "U", color: "#ef4444" },
  { id: "vt-3", name: "Follow-up Visit",           steps: ["Registration", "Doctor Consultation"],                              prefix: "F", color: "#10b981" },
];

// ─── Token Slip ───────────────────────────────────────────────────────────────

export type TokenSlipData = {
  tokenNumber: string;
  color: string;
  queueLabel: string;
  queueSub?: string;
  patientName?: string;
  patientMrn?: string;
  branch: string;
  issuedAt: Date;
  steps?: string[];
};

export function TokenSlipModal({ data, onClose }: { data: TokenSlipData; onClose: () => void }) {
  const dateStr = data.issuedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = data.issuedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative" onClick={e => e.stopPropagation()}>
        {/* Floating close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 h-7 w-7 rounded-full bg-slate-700 text-white hover:bg-slate-600 flex items-center justify-center shadow-xl transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Receipt card */}
        <div className="w-80 bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header band */}
          <div className="px-6 pt-5 pb-7 text-white text-center"
            style={{ background: `linear-gradient(160deg, ${data.color}, ${data.color}CC)` }}>
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <Ticket className="h-4 w-4 text-white/80" />
              <span className="text-lg font-black tracking-tight">NovaDoc</span>
            </div>
            <p className="text-[9px] text-white/70 uppercase tracking-widest">Smart Healthcare Queue System</p>
          </div>

          {/* Perforated top edge */}
          <div className="relative -mt-3 h-4 bg-white"
            style={{ backgroundImage: `radial-gradient(circle at 50% 0, ${data.color}22 12px, white 0)`, backgroundSize: "24px 100%", backgroundRepeat: "repeat-x" }} />

          {/* Body */}
          <div className="bg-white px-6 pb-4">

            {/* Queue label */}
            <div className="text-center mb-3">
              <p className="text-xs font-bold text-slate-700 leading-tight">{data.queueLabel}</p>
              {data.queueSub && <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{data.queueSub}</p>}
            </div>

            {/* Token number */}
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl border-2 px-8 py-3 text-center shadow-sm"
                style={{ borderColor: data.color + "60", backgroundColor: data.color + "0C" }}>
                <p className="font-black tracking-widest font-mono text-6xl leading-none"
                  style={{ color: data.color }}>{data.tokenNumber}</p>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 my-3" />

            {/* Visit steps */}
            {data.steps && data.steps.length > 1 && (
              <div className="mb-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Visit Steps</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {data.steps.map((s, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-[9px] font-semibold rounded px-1.5 py-0.5"
                        style={{ backgroundColor: data.color + "15", color: data.color }}>
                        {s}
                      </span>
                      {i < data.steps!.length - 1 && <ArrowRight className="h-2.5 w-2.5 text-slate-300 flex-shrink-0" />}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Patient */}
            <div className="mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Patient</p>
              {data.patientName ? (
                <div>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{data.patientName}</p>
                  {data.patientMrn && <p className="text-xs text-slate-400">{data.patientMrn}</p>}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Walk-in / Anonymous</p>
              )}
            </div>

            <div className="border-t border-dashed border-slate-200 my-3" />

            {/* Branch + date */}
            <div className="flex items-start justify-between text-[10px]">
              <div>
                <p className="font-semibold text-slate-700 leading-tight">{data.branch}</p>
                <p className="text-slate-400 leading-tight">{dateStr} · {timeStr}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-black text-slate-500 leading-tight">{data.tokenNumber}</p>
                <p className="text-slate-400 leading-tight">Please keep this slip</p>
              </div>
            </div>
          </div>

          {/* Perforated bottom edge */}
          <div className="h-4 bg-slate-50"
            style={{ backgroundImage: `radial-gradient(circle at 50% 100%, white 12px, #f8fafc 0)`, backgroundSize: "24px 100%", backgroundRepeat: "repeat-x" }} />

          {/* Footer */}
          <div className="bg-slate-50 px-5 pb-5 pt-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mb-3">
              <Printer className="h-3.5 w-3.5 flex-shrink-0" />
              <span>In production this slip would be printed and handed to the patient.</span>
            </div>
            <button
              onClick={onClose}
              className="w-full h-9 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow"
              style={{ backgroundColor: data.color }}
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function padToken(n: number, prefix: string = "", len: number = 3) {
  return `${prefix}${String(n).padStart(len, "0")}`;
}

export function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

export function uid() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Home Nav Button (shared across all headers) ──────────────────────────────

export function HomeNavButton() {
  const [location, setLocation] = useLocation();
  return (
    <Button
      variant="ghost"
      onClick={() => setLocation("/")}
      className={`h-9 px-3 gap-1.5 text-sm font-medium ${
        location === "/"
          ? "bg-[#4982CF]/10 text-[#4982CF] hover:bg-[#4982CF]/15"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <LayoutDashboard className="h-4 w-4" />
      Home
    </Button>
  );
}

// ─── Queue Nav Dropdown (shared across all headers) ───────────────────────────

export function QueueNavDropdown() {
  const [location, setLocation] = useLocation();
  const isActive = (path: string) => location === path;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`h-9 px-3 gap-1.5 text-sm font-medium
            ${location.startsWith("/queue")
              ? "bg-[#4982CF]/10 text-[#4982CF] hover:bg-[#4982CF]/15"
              : "text-slate-600 hover:bg-slate-100"}`}
        >
          <Ticket className="h-4 w-4" />
          Queue
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-2">
          Token Generation
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => setLocation("/queue/token/single")}
          className={`gap-3 cursor-pointer py-2.5 ${isActive("/queue/token/single") ? "bg-[#4982CF]/8 text-[#4982CF]" : ""}`}
        >
          <span className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Zap className="h-3.5 w-3.5 text-emerald-600" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">Single Queue</p>
            <p className="text-[10px] text-slate-400 leading-tight">Camp / Walk-in mode</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setLocation("/queue/token/partitioned")}
          className={`gap-3 cursor-pointer py-2.5 ${isActive("/queue/token/partitioned") ? "bg-[#4982CF]/8 text-[#4982CF]" : ""}`}
        >
          <span className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Users className="h-3.5 w-3.5 text-[#4982CF]" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">Partitioned Queue</p>
            <p className="text-[10px] text-slate-400 leading-tight">Multi-doctor clinic</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setLocation("/queue/token/multistep")}
          className={`gap-3 cursor-pointer py-2.5 ${isActive("/queue/token/multistep") ? "bg-[#4982CF]/8 text-[#4982CF]" : ""}`}
        >
          <span className="h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Workflow className="h-3.5 w-3.5 text-violet-600" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">Multi-Step Visit</p>
            <p className="text-[10px] text-slate-400 leading-tight">Clinic OPD</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-2">
          Queue Users
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => setLocation("/queue/frontdesk")}
          className={`gap-3 cursor-pointer py-2.5 ${isActive("/queue/frontdesk") ? "bg-[#4982CF]/8 text-[#4982CF]" : ""}`}
        >
          <span className="h-7 w-7 rounded-full bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-3.5 w-3.5 text-[#4982CF]" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">Front Desk User</p>
            <p className="text-[10px] text-slate-400 leading-tight">Registration · Billing counter</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setLocation("/queue/nursing")}
          className={`gap-3 cursor-pointer py-2.5 ${isActive("/queue/nursing") ? "bg-[#4982CF]/8 text-[#4982CF]" : ""}`}
        >
          <span className="h-7 w-7 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
            <Heart className="h-3.5 w-3.5 text-rose-600" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">Nursing</p>
            <p className="text-[10px] text-slate-400 leading-tight">Vitals · Patient assessment</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setLocation("/queue/doctor")}
          className={`gap-3 cursor-pointer py-2.5 ${isActive("/queue/doctor") ? "bg-[#4982CF]/8 text-[#4982CF]" : ""}`}
        >
          <span className="h-7 w-7 rounded-full bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="h-3.5 w-3.5 text-[#4982CF]" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">Doctor</p>
            <p className="text-[10px] text-slate-400 leading-tight">Consultation · Step 3</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setLocation("/queue/lab")}
          className={`gap-3 cursor-pointer py-2.5 ${isActive("/queue/lab") ? "bg-[#4982CF]/8 text-[#4982CF]" : ""}`}
        >
          <span className="h-7 w-7 rounded-full bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="h-3.5 w-3.5 text-[#4982CF]" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">Lab</p>
            <p className="text-[10px] text-slate-400 leading-tight">Sample collection · Step 4</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Reports Nav Dropdown (Transactions lives here) ──────────────────────────

export function ReportsNavDropdown() {
  const [location, setLocation] = useLocation();
  const isActive = location.startsWith("/reports");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`h-9 px-3 gap-1.5 text-sm font-medium
            ${isActive
              ? "bg-[#4982CF]/10 text-[#4982CF] hover:bg-[#4982CF]/15"
              : "text-slate-600 hover:bg-slate-100"}`}
        >
          <BarChart2 className="h-4 w-4" />
          Reports
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-2">
          Financial
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setLocation("/reports")}
          className={`gap-3 cursor-pointer py-2 ${location === "/reports" ? "bg-[#4982CF]/8 text-[#4982CF]" : ""}`}
        >
          <span className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Receipt className="h-3.5 w-3.5 text-[#4982CF]" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">Transactions</p>
            <p className="text-[10px] text-slate-400 leading-tight">All financial records</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Full App Header for Queue pages ─────────────────────────────────────────

export function QueueAppHeader() {
  const [location, setLocation] = useLocation();

  return (
    <header className="z-20 flex h-14 flex-none items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center">
          <img src="/novadoc-logo.png" alt="NovaDoc" className="h-8 w-auto" />
        </div>
        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex">
          <HomeNavButton />
          <QueueNavDropdown />
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
  );
}
