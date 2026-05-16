import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, User, Phone, Calendar, Hash, Edit2,
  FileText, Folder, FlaskConical, Scan, Users, Receipt,
  AlertCircle, Activity, Pill, Maximize2, Minimize2, X,
  Printer, Upload, History, CalendarPlus, Ticket,
  ChevronRight,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { SOAP_DUMMY } from "@/data/soapDummy";
import { usePatientProfile } from "@/hooks/usePatientProfile";
import { usePatients } from "@/hooks/usePatients";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueueAppHeader } from "@/pages/QueuePageLayout";
import type { Patient } from "@/pages/QueuePageLayout";
import type { ReceiptInfo } from "@/pages/FrontDeskUser";

const ACCENT = "#4982CF";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAge(dob: string): string {
  if (!dob) return "—";
  const ms  = Date.now() - new Date(dob).getTime();
  const age = Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} yrs`;
}

function initials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["#4982CF","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];
function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

// ─── Static demo data (SOAP_DUMMY — same pattern as PatientFaceSheet) ─────────

const DEMO_ALLERGIES = Array.from(
  new Map(
    SOAP_DUMMY.flatMap(r => r.allergies)
      .filter(a => !a.name.toLowerCase().startsWith("no known"))
      .map(a => [a.name, a]),
  ).values(),
);

const DEMO_MEDS = Array.from(
  new Map(SOAP_DUMMY.flatMap(r => r.prescriptions).map(rx => [rx.drug, rx])).values(),
);

const DEMO_LABS = SOAP_DUMMY.filter(r => r.labs.length > 0).map(r => ({
  date:   r.signedAt,
  doctor: r.signedBy,
  tests:  r.labs,
}));

const DEMO_RADIOLOGY = SOAP_DUMMY.filter(r => r.imaging.length > 0).map(r => ({
  date:  r.signedAt,
  doc:   r.signedBy,
  scans: r.imaging,
}));

const DEMO_FAMILY_HX = Array.from(new Set(SOAP_DUMMY.flatMap(r => r.familyHistory)));

const DEMO_VITALS = [...SOAP_DUMMY].reverse().map(r => ({
  date:      r.signedAt.split(",")[0],
  systolic:  parseInt(r.vitals.bp.split("/")[0], 10),
  diastolic: parseInt(r.vitals.bp.split("/")[1], 10),
  pulse:     parseInt(r.vitals.pulse, 10),
  spo2:      parseInt(r.vitals.spo2, 10),
}));

const SEV_COLOR: Record<string, string> = {
  Severe:   "#ef4444",
  Moderate: "#f97316",
  Mild:     "#eab308",
};

// ─── SectionDrawer ────────────────────────────────────────────────────────────

function SectionDrawer({
  title, icon: Icon, color, onClose, children,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [full, setFull] = useState(false);
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div
        className={[
          "fixed inset-y-0 right-0 bg-white shadow-2xl flex flex-col z-50 transition-all duration-300",
          full ? "w-full" : "w-[40%]",
        ].join(" ")}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <p className="text-sm font-black text-slate-800 flex-1">{title}</p>
          <button
            onClick={() => setFull(f => !f)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </>
  );
}

// ─── Drawer contents ──────────────────────────────────────────────────────────

function AllergiesContent() {
  return (
    <div className="space-y-3">
      {DEMO_ALLERGIES.length === 0
        ? <p className="text-sm text-slate-400 text-center py-8">No allergies recorded.</p>
        : DEMO_ALLERGIES.map((a, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white">
            <div className="h-3 w-3 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: SEV_COLOR[a.severity] ?? "#94a3b8" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">{a.name}</p>
              <p className="text-xs text-slate-500">{a.reaction}</p>
            </div>
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0"
              style={{ color: SEV_COLOR[a.severity] ?? "#94a3b8", backgroundColor: `${SEV_COLOR[a.severity] ?? "#94a3b8"}12`, borderColor: `${SEV_COLOR[a.severity] ?? "#94a3b8"}35` }}
            >
              {a.severity}
            </span>
          </div>
        ))
      }
    </div>
  );
}

function MedicationsContent() {
  return (
    <div className="space-y-3">
      {DEMO_MEDS.map((m, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-50">
            <Pill className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">{m.drug}</p>
            <p className="text-xs text-slate-500">{m.sig}</p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 flex-shrink-0">Qty: {m.qty}</span>
        </div>
      ))}
    </div>
  );
}

function LabReportsContent() {
  return (
    <div className="space-y-4">
      {DEMO_LABS.map((lab, i) => (
        <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visit</p>
              <p className="text-xs font-bold text-slate-700">{lab.date}</p>
            </div>
            <p className="text-xs text-slate-500">{lab.doctor}</p>
          </div>
          <div className="px-4 py-3 space-y-2">
            {lab.tests.map((t, j) => (
              <div key={j} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <p className="text-xs text-slate-700">{t}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RadiologyContent() {
  return (
    <div className="space-y-4">
      {DEMO_RADIOLOGY.length === 0
        ? <p className="text-sm text-slate-400 text-center py-8">No radiology reports recorded.</p>
        : DEMO_RADIOLOGY.map((r, i) => (
          <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visit</p>
                <p className="text-xs font-bold text-slate-700">{r.date}</p>
              </div>
              <p className="text-xs text-slate-500">{r.doc}</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              {r.scans.map((s, j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                  <p className="text-xs text-slate-700">{s}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      }
    </div>
  );
}

function FamilyHistoryContent() {
  return (
    <div className="space-y-2.5">
      {DEMO_FAMILY_HX.map((entry, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white">
          <Users className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700">{entry}</p>
        </div>
      ))}
    </div>
  );
}

function HealthRecordsContent({
  appointments, visits,
}: {
  appointments: { date: string; type: string; specialty: string; status: string }[];
  visits: { entryId: string; signedRecords: { date: string; time: string; type: string; doctor: string }[] }[];
}) {
  const STATUS_COLOR: Record<string, string> = {
    checked_out: "#10b981", booked: ACCENT, confirmed: ACCENT,
    checked_in: "#f59e0b", cancelled: "#ef4444", no_show: "#94a3b8", rescheduled: "#f97316",
  };
  const STATUS_LABEL: Record<string, string> = {
    checked_out: "Completed", booked: "Booked", confirmed: "Confirmed",
    checked_in: "In Progress", cancelled: "Cancelled", no_show: "No Show", rescheduled: "Rescheduled",
  };

  const allSigned = visits.flatMap(v => v.signedRecords);
  const hasData   = appointments.length > 0 || allSigned.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <FileText className="h-5 w-5 text-slate-300" />
        </div>
        <p className="text-sm text-slate-400">No health records yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allSigned.map((sr, i) => (
        <div key={i} className="rounded-xl border border-slate-200 px-4 py-3 bg-white">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-slate-700">{sr.type || "Clinical Visit"}</p>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              Signed
            </span>
          </div>
          <p className="text-xs text-slate-500">{sr.doctor}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{sr.date} · {sr.time}</p>
        </div>
      ))}
      {appointments.map((a, i) => {
        const color = STATUS_COLOR[a.status] ?? "#94a3b8";
        return (
          <div key={i} className="rounded-xl border border-slate-200 px-4 py-3 bg-white">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-700">{a.type || a.specialty || "Appointment"}</p>
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full border"
                style={{ color, backgroundColor: `${color}12`, borderColor: `${color}35` }}
              >
                {STATUS_LABEL[a.status] ?? a.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{a.date}</p>
          </div>
        );
      })}
    </div>
  );
}

function InvoicesContent({
  appointments, invoices,
}: {
  appointments: { id: string; date: string; slotStart: string }[];
  invoices: Record<string, unknown>;
}) {
  const paid = appointments
    .filter(a => invoices[a.id])
    .map(a => ({ appt: a, receipt: invoices[a.id] as ReceiptInfo }));

  if (paid.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <Receipt className="h-5 w-5 text-slate-300" />
        </div>
        <p className="text-sm text-slate-400">No invoices found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paid.map(({ appt, receipt }, i) => (
        <div key={i} className="rounded-xl border border-slate-200 px-4 py-3 bg-white">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-slate-700">Invoice #{receipt.invNo}</p>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              Paid
            </span>
          </div>
          <p className="text-[11px] text-slate-400">{appt.date} · {appt.slotStart}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500 capitalize">{receipt.payType}</span>
            <span className="text-sm font-black text-emerald-600">PKR {receipt.total?.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function VitalsContent() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Blood Pressure (mmHg)</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={DEMO_VITALS}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={[60, 180]} />
            <Tooltip />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="systolic"  stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Systolic"  />
            <Line type="monotone" dataKey="diastolic" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Pulse & SpO₂</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={DEMO_VITALS}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="pulse" stroke={ACCENT}   strokeWidth={2} dot={{ r: 3 }} name="Pulse (bpm)" />
            <Line type="monotone" dataKey="spo2"  stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="SpO₂ (%)"    />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DEMO_VITALS.map((v, i) => (
          <div key={i} className="rounded-xl border border-slate-200 px-4 py-3 bg-white">
            <p className="text-[10px] text-slate-400 font-medium mb-1.5">{v.date}</p>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-700">BP: <span className="text-red-600">{v.systolic}/{v.diastolic}</span></p>
              <p className="text-xs font-semibold text-slate-700">Pulse: <span style={{ color: ACCENT }}>{v.pulse} bpm</span></p>
              <p className="text-xs font-semibold text-slate-700">SpO₂: <span className="text-emerald-600">{v.spo2}%</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilesContent() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
        <Folder className="h-5 w-5 text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-500">No files uploaded yet.</p>
      <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed">
        Patient documents, consent forms, and attachments will appear here.
      </p>
      <button className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-[#4982CF]/50 hover:text-[#4982CF] transition-all mt-2">
        <Upload className="h-3.5 w-3.5" /> Upload File
      </button>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title, icon: Icon, color, count, onViewAll, children,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  count?: number;
  onViewAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <p className="text-xs font-black text-slate-800 flex-1">{title}</p>
        {count !== undefined && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
            {count}
          </span>
        )}
      </div>
      <div className="flex-1 px-4 py-3 space-y-1.5 min-h-[96px]">{children}</div>
      <div className="px-4 py-2.5 border-t border-slate-100">
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-[11px] font-bold transition-colors hover:opacity-70"
          style={{ color }}
        >
          View All <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Edit Profile Drawer ──────────────────────────────────────────────────────

function EditProfileDrawer({
  patient, onClose, onSave,
}: {
  patient: Patient;
  onClose: () => void;
  onSave: (patch: Partial<Patient>) => void;
}) {
  const [form, setForm] = useState({
    name:   patient.name,
    phone:  patient.phone,
    dob:    patient.dob,
    gender: patient.gender,
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-[380px] bg-white shadow-2xl flex flex-col z-50">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-blue-50">
            <Edit2 className="h-4 w-4" style={{ color: ACCENT }} />
          </div>
          <p className="text-sm font-black text-slate-800 flex-1">Edit Patient Profile</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-white text-lg font-black flex-shrink-0"
              style={{ backgroundColor: avatarColor(patient.name) }}
            >
              {initials(patient.name)}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">MR Number</p>
              <p className="text-sm font-black text-slate-800">{patient.mrn}</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Full Name</label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} className="h-9 text-sm" placeholder="Patient full name" />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Phone</label>
            <Input value={form.phone} onChange={e => set("phone", e.target.value)} className="h-9 text-sm" placeholder="+92 300 000 0000" />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Date of Birth</label>
            <Input type="date" value={form.dob} onChange={e => set("dob", e.target.value)} className="h-9 text-sm" />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {(["M", "F"] as const).map(g => (
                <button
                  key={g}
                  onClick={() => set("gender", g)}
                  className="py-2.5 rounded-xl border-2 text-xs font-bold transition-all"
                  style={form.gender === g
                    ? { backgroundColor: ACCENT, borderColor: ACCENT, color: "white" }
                    : { borderColor: "#e2e8f0", color: "#64748b" }}
                >
                  {g === "M" ? "Male" : "Female"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancel</Button>
          <Button
            onClick={() => { onSave(form); onClose(); }}
            disabled={!form.name.trim()}
            className="flex-1 h-9 text-white"
            style={{ backgroundColor: ACCENT }}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Quick Actions ─────────────────────────────────────────────────────────────

function QuickActions({ onEdit, onComingSoon }: { onEdit: () => void; onComingSoon: (label: string) => void }) {
  const actions = [
    { label: "Edit Profile",    icon: Edit2,        action: onEdit,                               color: ACCENT     },
    { label: "Add Invoice",     icon: Receipt,      action: () => onComingSoon("Add Invoice"),     color: "#10b981"  },
    { label: "Add Appointment", icon: CalendarPlus, action: () => onComingSoon("Add Appointment"), color: "#f59e0b"  },
    { label: "Add Token",       icon: Ticket,       action: () => onComingSoon("Add Token"),       color: "#8b5cf6"  },
    { label: "Add File",        icon: Upload,       action: () => onComingSoon("Add File"),        color: "#06b6d4"  },
    { label: "Add History",     icon: History,      action: () => onComingSoon("Add History"),     color: "#ec4899"  },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {actions.map(({ label, icon: Icon, action, color }) => (
        <button
          key={label}
          onClick={action}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all text-xs font-bold text-slate-600 hover:text-slate-900 group"
        >
          <Icon className="h-3.5 w-3.5" style={{ color }} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type DrawerKey =
  | "health" | "files" | "labs" | "radiology"
  | "family" | "invoices" | "allergies" | "vitals" | "meds"
  | null;

export function PatientProfile() {
  const { mrn }       = useParams<{ mrn: string }>();
  const [, navigate]  = useLocation();
  const { patients, updatePatient } = usePatients();
  const { toast }     = useToast();

  const { appointments, invoices, visits }        = usePatientProfile(mrn ?? "");

  const patient = patients.find(p => p.mrn === (mrn ?? "")) ?? null;

  const [openDrawer, setOpenDrawer] = useState<DrawerKey>(null);
  const [showEdit,   setShowEdit]   = useState(false);

  function handleSave(patch: Partial<Patient>) {
    if (!patient) return;
    updatePatient(patient.id, patch);
    toast({ title: "Profile updated", description: "Patient details saved successfully." });
  }

  function comingSoon(label: string) {
    toast({ title: label, description: "This feature is coming soon." });
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <QueueAppHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <User className="h-7 w-7 text-slate-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-600">Patient not found</p>
            <p className="text-xs text-slate-400 mt-1">MR# {mrn}</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const age          = calcAge(patient.dob);
  const inits        = initials(patient.name);
  const bg           = avatarColor(patient.name);
  const labCount     = DEMO_LABS.reduce((s, l) => s + l.tests.length, 0);
  const radCount     = DEMO_RADIOLOGY.reduce((s, r) => s + r.scans.length, 0);
  const invoiceCount = appointments.filter(a => invoices[a.id]).length;
  const visitCount   = visits.reduce((s, v) => s + v.signedRecords.length, 0) + appointments.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <QueueAppHeader />

      <div className="flex-1 px-6 py-5 space-y-5 max-w-7xl mx-auto w-full">

        {/* Breadcrumb + Print */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => history.back()}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div className="flex-1" />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Print Registration Card
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Print Family Card
          </button>
        </div>

        {/* Patient info card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5">
          <div className="flex items-start gap-5">
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black flex-shrink-0 shadow-sm"
              style={{ backgroundColor: bg }}
            >
              {inits}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xl font-black text-slate-900 leading-tight">{patient.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {patient.gender === "M" ? "Male" : "Female"} · {age}
                  </p>
                </div>
                <span
                  className="text-xs font-black px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {patient.mrn}
                </span>
              </div>

              <div className="flex flex-wrap gap-5 mt-3">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm text-slate-600">{patient.phone || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm text-slate-600">DOB: {patient.dob || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm text-slate-400">{patient.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <QuickActions onEdit={() => setShowEdit(true)} onComingSoon={comingSoon} />

        {/* 9 Section cards — 3×3 grid */}
        <div className="grid grid-cols-3 gap-4">

          {/* 1. Health Records */}
          <SectionCard title="Health Records" icon={FileText} color="#4982CF" count={visitCount || undefined} onViewAll={() => setOpenDrawer("health")}>
            {appointments.slice(0, 3).map((a, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#4982CF] flex-shrink-0" />
                <p className="text-xs text-slate-600 truncate flex-1">{a.type || a.specialty || "Visit"}</p>
                <span className="text-[10px] text-slate-400 flex-shrink-0">{a.date}</span>
              </div>
            ))}
            {visitCount === 0 && <p className="text-xs text-slate-400 text-center py-3">No records yet</p>}
          </SectionCard>

          {/* 2. Recent Files */}
          <SectionCard title="Recent Files" icon={Folder} color="#f59e0b" onViewAll={() => setOpenDrawer("files")}>
            <p className="text-xs text-slate-400 text-center py-3">No files uploaded</p>
          </SectionCard>

          {/* 3. Laboratory Reports */}
          <SectionCard title="Laboratory Reports" icon={FlaskConical} color="#f59e0b" count={labCount} onViewAll={() => setOpenDrawer("labs")}>
            {DEMO_LABS[0]?.tests.slice(0, 3).map((t, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <p className="text-xs text-slate-600 truncate">{t}</p>
              </div>
            ))}
          </SectionCard>

          {/* 4. Radiology Reports */}
          <SectionCard title="Radiology Reports" icon={Scan} color="#0ea5e9" count={radCount || undefined} onViewAll={() => setOpenDrawer("radiology")}>
            {DEMO_RADIOLOGY[0]?.scans.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                <p className="text-xs text-slate-600 truncate">{s}</p>
              </div>
            )) ?? <p className="text-xs text-slate-400 text-center py-3">No reports yet</p>}
          </SectionCard>

          {/* 5. Family History */}
          <SectionCard title="Family History" icon={Users} color="#ec4899" count={DEMO_FAMILY_HX.length} onViewAll={() => setOpenDrawer("family")}>
            {DEMO_FAMILY_HX.slice(0, 3).map((entry, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5">
                <Users className="h-3 w-3 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-snug line-clamp-1">{entry}</p>
              </div>
            ))}
          </SectionCard>

          {/* 6. Invoices */}
          <SectionCard title="Invoices" icon={Receipt} color="#10b981" count={invoiceCount || undefined} onViewAll={() => setOpenDrawer("invoices")}>
            {invoiceCount === 0
              ? <p className="text-xs text-slate-400 text-center py-3">No invoices yet</p>
              : appointments.filter(a => invoices[a.id]).slice(0, 3).map((a, i) => {
                const r = invoices[a.id] as ReceiptInfo;
                return (
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <p className="text-xs text-slate-600 flex-1 truncate">#{r.invNo}</p>
                    <span className="text-[11px] font-bold text-emerald-600">PKR {r.total?.toLocaleString()}</span>
                  </div>
                );
              })
            }
          </SectionCard>

          {/* 7. Allergies */}
          <SectionCard title="Allergies" icon={AlertCircle} color="#ef4444" count={DEMO_ALLERGIES.length} onViewAll={() => setOpenDrawer("allergies")}>
            {DEMO_ALLERGIES.slice(0, 3).map((a, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: SEV_COLOR[a.severity] ?? "#94a3b8" }} />
                <p className="text-xs text-slate-700 truncate flex-1 font-medium">{a.name}</p>
                <span className="text-[9px] font-black flex-shrink-0" style={{ color: SEV_COLOR[a.severity] ?? "#94a3b8" }}>
                  {a.severity}
                </span>
              </div>
            ))}
          </SectionCard>

          {/* 8. Vital Trends */}
          <SectionCard title="Vital Trends" icon={Activity} color="#8b5cf6" onViewAll={() => setOpenDrawer("vitals")}>
            <ResponsiveContainer width="100%" height={70}>
              <LineChart data={DEMO_VITALS} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="pulse"    stroke={ACCENT}  strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-3">
              <div className="flex items-center gap-1"><div className="h-2 w-4 rounded-full bg-red-400" /><span className="text-[9px] text-slate-400">BP</span></div>
              <div className="flex items-center gap-1"><div className="h-2 w-4 rounded-full" style={{ backgroundColor: ACCENT }} /><span className="text-[9px] text-slate-400">Pulse</span></div>
            </div>
          </SectionCard>

          {/* 9. Medications */}
          <SectionCard title="Patient Medications" icon={Pill} color="#8b5cf6" count={DEMO_MEDS.length} onViewAll={() => setOpenDrawer("meds")}>
            {DEMO_MEDS.slice(0, 3).map((m, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <Pill className="h-3 w-3 text-purple-400 flex-shrink-0" />
                <p className="text-xs text-slate-700 truncate flex-1">{m.drug}</p>
              </div>
            ))}
          </SectionCard>

        </div>
      </div>

      {/* Section drawers */}
      {openDrawer === "health" && (
        <SectionDrawer title="Health Records" icon={FileText} color="#4982CF" onClose={() => setOpenDrawer(null)}>
          <HealthRecordsContent appointments={appointments} visits={visits} />
        </SectionDrawer>
      )}
      {openDrawer === "files" && (
        <SectionDrawer title="Recent Files" icon={Folder} color="#f59e0b" onClose={() => setOpenDrawer(null)}>
          <FilesContent />
        </SectionDrawer>
      )}
      {openDrawer === "labs" && (
        <SectionDrawer title="Laboratory Reports" icon={FlaskConical} color="#f59e0b" onClose={() => setOpenDrawer(null)}>
          <LabReportsContent />
        </SectionDrawer>
      )}
      {openDrawer === "radiology" && (
        <SectionDrawer title="Radiology Reports" icon={Scan} color="#0ea5e9" onClose={() => setOpenDrawer(null)}>
          <RadiologyContent />
        </SectionDrawer>
      )}
      {openDrawer === "family" && (
        <SectionDrawer title="Family History" icon={Users} color="#ec4899" onClose={() => setOpenDrawer(null)}>
          <FamilyHistoryContent />
        </SectionDrawer>
      )}
      {openDrawer === "invoices" && (
        <SectionDrawer title="Invoices" icon={Receipt} color="#10b981" onClose={() => setOpenDrawer(null)}>
          <InvoicesContent appointments={appointments} invoices={invoices} />
        </SectionDrawer>
      )}
      {openDrawer === "allergies" && (
        <SectionDrawer title="Allergies" icon={AlertCircle} color="#ef4444" onClose={() => setOpenDrawer(null)}>
          <AllergiesContent />
        </SectionDrawer>
      )}
      {openDrawer === "vitals" && (
        <SectionDrawer title="Vital Trends" icon={Activity} color="#8b5cf6" onClose={() => setOpenDrawer(null)}>
          <VitalsContent />
        </SectionDrawer>
      )}
      {openDrawer === "meds" && (
        <SectionDrawer title="Patient Medications" icon={Pill} color="#8b5cf6" onClose={() => setOpenDrawer(null)}>
          <MedicationsContent />
        </SectionDrawer>
      )}

      {/* Edit Profile */}
      {showEdit && (
        <EditProfileDrawer
          patient={patient}
          onClose={() => setShowEdit(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
