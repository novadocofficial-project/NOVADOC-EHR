import React, { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, User, Phone, Calendar, Hash, Edit2,
  FileText, Folder, FlaskConical, Scan, Users, Receipt,
  AlertCircle, Activity, Pill, Maximize2, Minimize2, X,
  Printer, Upload, History, CalendarPlus, Ticket, Mail,
  ChevronRight, GitBranch, ClipboardList, BookOpen, Heart,
  Stethoscope, Microscope, ScanLine, BookMarked, Target,
} from "lucide-react";
import { loadNoteStructure } from "@/pages/SoapConfigModule";
import { PatientFilesExplorer, loadPatientFilesLatest, formatFileSize } from "@/pages/PatientFilesExplorer";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { usePatientProfile } from "@/hooks/usePatientProfile";
import type { VitalEntry } from "@/hooks/usePatientProfile";
import type { AllergyEntry } from "@/pages/AllergySelector";
import type { FamilyRow } from "@/pages/MedicalHistorySection";
import type { MedicineEntry } from "@/pages/FormularySection";
import type { LabOrder } from "@/pages/LabDrawer";
import type { ImagingOrder } from "@/pages/ImagingSection";
import { usePatients } from "@/hooks/usePatients";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueueAppHeader } from "@/pages/QueuePageLayout";
import type { Patient } from "@/pages/QueuePageLayout";
import type { ReceiptInfo } from "@/pages/FrontDeskUser";
import { usePatientSoapData } from "@/hooks/usePatientSoapData";
import { loadSocConfig } from "@/pages/ClinicalLibrariesModule";

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

function AllergiesContent({ allergies }: { allergies: AllergyEntry[] }) {
  return (
    <div className="space-y-3">
      {allergies.length === 0
        ? <p className="text-sm text-slate-400 text-center py-8">No allergies recorded.</p>
        : allergies.map((a, i) => (
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

function MedicationsContent({ medicines }: { medicines: MedicineEntry[] }) {
  return (
    <div className="space-y-3">
      {medicines.length === 0
        ? <p className="text-sm text-slate-400 text-center py-8">No medications prescribed yet.</p>
        : medicines.map((m, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-50">
              <Pill className="h-3.5 w-3.5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">{m.genericName}</p>
              <p className="text-xs text-slate-500">{m.brand}{m.strength ? ` · ${m.strength}` : ""}{m.frequency ? ` · ${m.frequency}` : ""}</p>
            </div>
            <span className="text-[11px] font-bold text-slate-400 flex-shrink-0">{m.route || ""}</span>
          </div>
        ))
      }
    </div>
  );
}

function LabReportsContent({ labOrders }: { labOrders: LabOrder[] }) {
  const active = labOrders.filter(lo => !lo.voided);
  return (
    <div className="space-y-4">
      {active.length === 0
        ? <p className="text-sm text-slate-400 text-center py-8">No laboratory orders on file.</p>
        : active.map((lo, i) => (
          <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order</p>
                <p className="text-xs font-bold text-slate-700">{lo.orderSetName ?? "Lab Order"}</p>
              </div>
              {lo.sentAt && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Sent</span>}
            </div>
            <div className="px-4 py-3 space-y-2">
              {lo.tests.map((t, j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <p className="text-xs text-slate-700">{t.name}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      }
    </div>
  );
}

function RadiologyContent({ imagingOrders }: { imagingOrders: ImagingOrder[] }) {
  return (
    <div className="space-y-3">
      {imagingOrders.length === 0
        ? <p className="text-sm text-slate-400 text-center py-8">No radiology orders on file.</p>
        : imagingOrders.map((io, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white">
            <Scan className="h-4 w-4 text-sky-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">{io.modality} → {io.bodyPart}</p>
              <p className="text-xs text-slate-500">{io.protocol}{io.specialInstructions ? ` · ${io.specialInstructions}` : ""}</p>
            </div>
          </div>
        ))
      }
    </div>
  );
}

function FamilyHistoryContent({ fhRows }: { fhRows: FamilyRow[] }) {
  const filled = fhRows.filter(r => r.condition || r.relation);
  return (
    <div className="space-y-2.5">
      {filled.length === 0
        ? <p className="text-sm text-slate-400 text-center py-8">No family history recorded.</p>
        : filled.map((row, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white">
            <Users className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{row.condition || "—"}</p>
              {row.relation && <p className="text-xs text-slate-500">{row.relation}</p>}
            </div>
          </div>
        ))
      }
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

function VitalsContent({ vitals }: { vitals: VitalEntry[] }) {
  if (vitals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <Activity className="h-5 w-5 text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-500">No vital trends recorded yet.</p>
        <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed">
          BP, pulse, SpO₂, and temperature will appear here as trend charts after consultations are signed.
        </p>
      </div>
    );
  }

  const chartData = vitals.map(v => ({
    date:       v.date,
    Systolic:   v.bpSystolic,
    Diastolic:  v.bpDiastolic,
    Pulse:      v.pulse,
    "SpO₂":    v.spo2,
    Temp:       v.temp,
  }));

  return (
    <div className="space-y-6 py-2">
      {/* BP Trend */}
      <div>
        <p className="text-xs font-bold text-slate-600 mb-2">Blood Pressure (mmHg)</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[50, 200]} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="Systolic"  stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="Diastolic" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pulse & SpO₂ */}
      <div>
        <p className="text-xs font-bold text-slate-600 mb-2">Pulse (bpm) &amp; SpO₂ (%)</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="Pulse" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="SpO₂"  stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Temperature */}
      {vitals.some(v => v.temp !== undefined) && (
        <div>
          <p className="text-xs font-bold text-slate-600 mb-2">Temperature (°C)</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[35, 42]} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Temp" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
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

// ─── SOAP Tab ─────────────────────────────────────────────────────────────────

const SOAP_SECTION_META: Record<string, { icon: React.ElementType; color: string }> = {
  "chief-complaints": { icon: ClipboardList, color: "#4982CF"  },
  "hpi":              { icon: BookOpen,      color: "#6366f1"  },
  "allergies":        { icon: Heart,         color: "#ef4444"  },
  "medical-history":  { icon: FileText,      color: "#10b981"  },
  "ros":              { icon: ClipboardList, color: "#0ea5e9"  },
  "physical-exam":    { icon: Stethoscope,   color: "#06b6d4"  },
  "poc-labs":         { icon: FlaskConical,  color: "#f59e0b"  },
  "diagnosis":        { icon: Microscope,    color: "#6366f1"  },
  "labs":             { icon: FlaskConical,  color: "#f59e0b"  },
  "imaging":          { icon: ScanLine,      color: "#06b6d4"  },
  "formulary":        { icon: Pill,          color: "#8b5cf6"  },
  "procedures":       { icon: Stethoscope,   color: "#14b8a6"  },
  "care-plan":        { icon: BookMarked,    color: "#10b981"  },
  "referrals":        { icon: Users,         color: "#6366f1"  },
  "patient-goals":    { icon: Target,        color: "#ec4899"  },
  "health-ed":        { icon: BookOpen,      color: "#8b5cf6"  },
};

function SoapTabContent({ mrn }: { mrn: string }) {
  const sections = useMemo(
    () => loadNoteStructure().filter(
      s => s.id !== "vitals" && s.active !== false && s.visibility !== "hidden",
    ),
    [],
  );
  const [activeId, setActiveId] = useState<string>(() => sections[0]?.id ?? "");
  const { data: repo } = usePatientSoapData(mrn);

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-500">No SOAP sections visible</p>
        <p className="text-xs text-slate-400 max-w-xs">
          Enable sections in Admin › Soap Note › Note Structure to see them here.
        </p>
      </div>
    );
  }

  const current = sections.find(s => s.id === activeId) ?? sections[0];
  const meta = SOAP_SECTION_META[current.id] ?? { icon: FileText, color: "#4982CF" };
  const Icon = meta.icon;

  const SEV_COLOR: Record<string, string> = {
    Severe: "#ef4444", Moderate: "#f97316", Mild: "#eab308",
  };
  const POC_STATUS: Record<string, { label: string; color: string }> = {
    pending:     { label: "Pending",     color: "#94a3b8" },
    positive:    { label: "Positive",    color: "#ef4444" },
    negative:    { label: "Negative",    color: "#10b981" },
    sent_to_lab: { label: "Sent to Lab", color: "#f59e0b" },
  };

  function renderContent(): React.ReactNode {
    const id = current.id;
    switch (id) {

      case "chief-complaints": {
        if (!repo.chiefComplaints.length) return null;
        return (
          <div className="flex flex-wrap gap-2">
            {repo.chiefComplaints.map((c, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">{c}</span>
            ))}
          </div>
        );
      }

      case "hpi": {
        const hpiEntries = (Array.isArray(repo.hpi) ? repo.hpi : repo.hpi ? [repo.hpi as unknown as string] : []).filter(Boolean);
        if (!hpiEntries.length) return null;
        return (
          <div className="space-y-3 max-w-2xl">
            {hpiEntries.map((entry, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                {hpiEntries.length > 1 && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">
                    Entry {i + 1}
                  </p>
                )}
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{entry}</p>
              </div>
            ))}
          </div>
        );
      }

      case "allergies": {
        if (!repo.allergies.length) return null;
        return (
          <div className="space-y-2 max-w-xl">
            {repo.allergies.map((a, i) => {
              const c = SEV_COLOR[a.severity] ?? "#94a3b8";
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white">
                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">{a.name}</p>
                    {a.reaction && <p className="text-[10px] text-slate-400">{a.reaction}</p>}
                  </div>
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0"
                    style={{ color: c, backgroundColor: `${c}15`, borderColor: `${c}40` }}
                  >{a.severity}</span>
                </div>
              );
            })}
          </div>
        );
      }

      case "medical-history": {
        const filledFh = repo.fhRows.filter(r => r.condition || r.relation);
        const socQuestions = loadSocConfig().filter(q => q.active && repo.socialHistory[q.id]);
        if (!repo.pmhActive.length && !repo.pmhResolved.length && !repo.surgicalRows.length && !filledFh.length && !socQuestions.length) return null;
        return (
          <div className="space-y-5 max-w-xl">
            {repo.pmhActive.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Active Conditions</p>
                <div className="space-y-1.5">
                  {repo.pmhActive.map((c, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                      <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                      <p className="text-xs font-semibold text-red-800">{c}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {repo.pmhResolved.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Resolved</p>
                <div className="space-y-1.5">
                  {repo.pmhResolved.map((c, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="h-2 w-2 rounded-full bg-slate-300 flex-shrink-0" />
                      <p className="text-xs text-slate-600">{c}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {repo.surgicalRows.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Surgical History</p>
                <div className="space-y-1.5">
                  {repo.surgicalRows.map((r, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800">{r.procedure || "—"}</p>
                        {r.date && <p className="text-[10px] text-amber-500">{r.date}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {filledFh.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Family History</p>
                <div className="space-y-1.5">
                  {filledFh.map((row, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-pink-50 border border-pink-100">
                      <Users className="h-3 w-3 text-pink-400 flex-shrink-0" />
                      <p className="text-xs font-semibold text-pink-800">{row.condition || "—"}</p>
                      {row.relation && <span className="ml-auto text-[10px] text-pink-500">{row.relation}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {socQuestions.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Social History</p>
                <div className="space-y-1.5">
                  {socQuestions.map(q => {
                    const ans = repo.socialHistory[q.id];
                    const main = Array.isArray(ans?.main)
                      ? (ans.main as string[]).filter(Boolean).join(", ")
                      : (ans?.main as string | undefined) ?? "";
                    if (!main) return null;
                    return (
                      <div key={q.id} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-violet-50 border border-violet-100">
                        <div className="h-2 w-2 rounded-full bg-violet-400 flex-shrink-0 mt-1" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-violet-500 uppercase tracking-wide">{q.name}</p>
                          <p className="text-xs font-semibold text-violet-900">{main}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      }

      case "ros": {
        const entries = Object.entries(repo.ros).filter(([, f]) => f.length > 0);
        if (!entries.length) return null;
        return (
          <div className="space-y-3 max-w-2xl">
            {entries.map(([sys, findings]) => (
              <div key={sys} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-700">{sys}</p>
                </div>
                <div className="px-4 py-2.5 flex flex-wrap gap-1.5">
                  {findings.map((f, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 text-[10px] font-bold">{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      }

      case "physical-exam": {
        if (!repo.peSystems.length) return null;
        return (
          <div className="space-y-2 max-w-xl">
            {repo.peSystems.map((sys, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white">
                <Stethoscope className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-slate-700">{sys}</p>
              </div>
            ))}
          </div>
        );
      }

      case "poc-labs": {
        if (!repo.pocTests.length) return null;
        return (
          <div className="space-y-2 max-w-xl">
            {repo.pocTests.map((t, i) => {
              const st = POC_STATUS[t.status] ?? { label: t.status, color: "#94a3b8" };
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white">
                  <FlaskConical className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">{t.name}</p>
                    <p className="text-[10px] text-slate-400">{t.category}</p>
                  </div>
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0"
                    style={{ color: st.color, backgroundColor: `${st.color}15`, borderColor: `${st.color}40` }}
                  >{st.label}</span>
                </div>
              );
            })}
          </div>
        );
      }

      case "diagnosis": {
        if (!repo.diagnoses.length) return null;
        return (
          <div className="space-y-3 max-w-xl">
            {repo.diagnoses.map((dx, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white">
                <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Microscope className="h-3.5 w-3.5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800">{dx.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {dx.code}{dx.specialty ? ` · ${dx.specialty}` : ""}
                  </p>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0 ${
                  dx.isFinal
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-amber-50 text-amber-600 border-amber-200"
                }`}>
                  {dx.isFinal ? "Final" : "Provisional"}
                </span>
              </div>
            ))}
          </div>
        );
      }

      case "labs": {
        const active = repo.labOrders.filter(lo => !lo.voided);
        if (!active.length) return null;
        return (
          <div className="space-y-4 max-w-2xl">
            {active.map((lo, i) => (
              <div key={i} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-xs font-black text-slate-700">{lo.orderSetName ?? "Lab Order"}</p>
                  {lo.sentAt && (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Sent</span>
                  )}
                </div>
                <div className="px-4 py-3 flex flex-wrap gap-1.5">
                  {lo.tests.map((t, j) => (
                    <span key={j} className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold">{t.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      }

      case "imaging": {
        if (!repo.imagingOrders.length) return null;
        return (
          <div className="space-y-3 max-w-xl">
            {repo.imagingOrders.map((io, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white">
                <ScanLine className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800">{io.modality} — {io.bodyPart}</p>
                  {io.protocol && <p className="text-[10px] text-slate-500 mt-0.5">{io.protocol}</p>}
                  {io.specialInstructions && (
                    <p className="text-[10px] text-slate-400 italic mt-0.5">{io.specialInstructions}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      }

      case "formulary": {
        if (!repo.medicines.length) return null;
        return (
          <div className="space-y-3 max-w-xl">
            {repo.medicines.map((m, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-indigo-100 bg-indigo-50/30">
                <Pill className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-black text-indigo-800">{m.brand} {m.strength}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {[m.dose && `${m.dose} ${m.unit}`, m.route, m.frequency, m.duration].filter(Boolean).join(" · ")}
                  </p>
                  {m.genericName && <p className="text-[9px] text-slate-400 italic mt-0.5">{m.genericName}</p>}
                </div>
              </div>
            ))}
          </div>
        );
      }

      case "procedures": {
        type ProcOrd = { orders?: { uid: string; name: string; cpt?: string; category?: string }[]; instructions?: string };
        const d = repo.procedureOrders as ProcOrd | null;
        if (!d?.orders?.length) return null;
        return (
          <div className="space-y-2 max-w-xl">
            {d.orders.map((o, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-teal-100 bg-teal-50/30">
                <Stethoscope className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-teal-800">{o.name}</p>
                  {o.cpt && <p className="text-[9px] text-teal-500">CPT {o.cpt}{o.category ? ` · ${o.category}` : ""}</p>}
                </div>
              </div>
            ))}
            {d.instructions && (
              <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 mt-1">
                <p className="text-[10px] text-amber-700">{d.instructions}</p>
              </div>
            )}
          </div>
        );
      }

      case "care-plan": {
        type CPlan = { tasks?: { uid: string; title: string; priority?: string; dueDate?: string; notes?: string }[]; instructions?: string };
        const d = repo.carePlan as CPlan | null;
        if (!d?.tasks?.length) return null;
        return (
          <div className="space-y-2 max-w-xl">
            {d.tasks.map((t, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5 rounded-xl border border-emerald-100 bg-emerald-50/30">
                <BookMarked className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-800">{t.title}</p>
                  {t.dueDate && <p className="text-[10px] text-emerald-600">Due {t.dueDate}</p>}
                  {t.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">{t.notes}</p>}
                </div>
                {t.priority && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${t.priority === "Urgent" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                    {t.priority}
                  </span>
                )}
              </div>
            ))}
            {d.instructions && (
              <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 mt-1">
                <p className="text-[10px] text-amber-700">{d.instructions}</p>
              </div>
            )}
          </div>
        );
      }

      case "referrals": {
        type Ref = { referrals?: { id: string; speciality?: string; consultantName?: string; reason?: string }[] };
        const d = repo.referrals as Ref | null;
        if (!d?.referrals?.length) return null;
        return (
          <div className="space-y-3 max-w-xl">
            {d.referrals.map((r, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-indigo-100 bg-white">
                <Users className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800">{r.speciality ?? "—"}</p>
                  {r.consultantName && <p className="text-[10px] text-slate-500 mt-0.5">{r.consultantName}</p>}
                  {r.reason && <p className="text-[10px] text-slate-400 italic mt-0.5">{r.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        );
      }

      case "patient-goals": {
        type GoalD = { goals?: { uid: string; title: string; priority?: string; targetDate?: string }[] };
        const d = repo.patientGoals as GoalD | null;
        if (!d?.goals?.length) return null;
        const P_COLORS: Record<string, { bg: string; text: string; border: string }> = {
          High:   { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
          Normal: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
          Low:    { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
        };
        return (
          <div className="space-y-2 max-w-xl">
            {d.goals.map((g, i) => {
              const cs = P_COLORS[g.priority ?? "Normal"] ?? P_COLORS.Normal;
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white">
                  <Target className="h-3.5 w-3.5 text-pink-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">{g.title}</p>
                    {g.targetDate && <p className="text-[10px] text-slate-400">Target: {g.targetDate}</p>}
                  </div>
                  {g.priority && (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: cs.bg, color: cs.text, border: `1px solid ${cs.border}` }}
                    >{g.priority}</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      }

      case "health-ed": {
        const d = repo.healthEd as { docIds?: string[] } | null;
        if (!d?.docIds?.length) return null;
        return (
          <div className="space-y-2 max-w-xl">
            {d.docIds.map((docId, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-purple-100 bg-purple-50/30">
                <BookOpen className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-purple-800">{docId}</p>
              </div>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  }

  const content = renderContent();

  return (
    <div className="flex h-full overflow-hidden">

      {/* Left sub-nav */}
      <div className="w-52 flex-none border-r border-slate-200 bg-white overflow-y-auto py-3">
        <p className="px-4 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Sections</p>
        {sections.map(s => {
          const m = SOAP_SECTION_META[s.id] ?? { icon: FileText, color: "#4982CF" };
          const SIcon = m.icon;
          const isActive = s.id === current.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-colors text-left ${
                isActive ? "text-[#4982CF] bg-[#4982CF]/[0.07]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <SIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: m.color }} />
              <span className="flex-1 truncate">{s.label}</span>
              {isActive && <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />}
            </button>
          );
        })}
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${meta.color}15` }}
          >
            <Icon className="h-4 w-4" style={{ color: meta.color }} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800">{current.label}</h2>
            <p className="text-xs text-slate-400">Patient SOAP record</p>
          </div>
        </div>

        {content ? (
          <div className="flex-1">{content}</div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${meta.color}12` }}
            >
              <Icon className="h-6 w-6" style={{ color: meta.color }} />
            </div>
            <p className="text-sm font-semibold text-slate-500">{current.label}</p>
            <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed">
              {current.label} data will appear here once it has been recorded and signed in a SOAP note.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type TabId =
  | "overview" | "health" | "labs" | "radiology" | "files"
  | "medications" | "allergies" | "vitals" | "family" | "family-tree" | "invoices"
  | "soap";

export function PatientProfile() {
  const { id }        = useParams<{ id: string }>();
  const [, navigate]  = useLocation();
  const { patients, updatePatient } = usePatients();
  const { toast }     = useToast();

  const patient = patients.find(p => p.id === (id ?? "")) ?? null;

  const {
    appointments, invoices, visits,
    allergies, medicines, labOrders, imagingOrders, fhRows, vitals,
  } = usePatientProfile(patient?.mrn ?? "");

  const [activeTab,  setActiveTab]  = useState<TabId>("overview");
  const [showEdit,   setShowEdit]   = useState(false);
  const [printMode,  setPrintMode]  = useState<"registration" | "family" | null>(null);

  useEffect(() => {
    if (!printMode || !patient) return;
    const t = setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 80);
    return () => clearTimeout(t);
  }, [printMode, patient]);

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
            <p className="text-xs text-slate-400 mt-1">Patient ID: {id}</p>
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

  const age           = calcAge(patient.dob);
  const inits         = initials(patient.name);
  const bg            = avatarColor(patient.name);
  const labCount      = labOrders.filter(lo => !lo.voided).reduce((s, lo) => s + lo.tests.length, 0);
  const radCount      = imagingOrders.length;
  const invoiceCount  = appointments.filter(a => invoices[a.id]).length;
  const visitCount    = visits.reduce((s, v) => s + v.signedRecords.length, 0) + appointments.length;
  const filledFh      = fhRows.filter(r => r.condition || r.relation);

  const allDates = [
    ...visits.flatMap(v => v.signedRecords.map(sr => sr.date)),
    ...appointments.map(a => a.date),
  ].filter(Boolean).sort().reverse();
  const lastVisitDate = allDates[0] ?? null;

  type ActivityEvent = { title: string; subtitle: string; date: string; icon: React.ElementType; color: string };
  const recentActivity: ActivityEvent[] = [
    ...visits.flatMap(v => v.signedRecords.map(sr => ({
      title: sr.type || "Clinical Visit", subtitle: sr.doctor || "", date: sr.date,
      icon: FileText, color: "#4982CF",
    }))),
    ...appointments.map(a => ({
      title: a.type || a.specialty || "Appointment",
      subtitle: ({ checked_out: "Completed", booked: "Booked", confirmed: "Confirmed", checked_in: "In Progress", cancelled: "Cancelled", no_show: "No Show", rescheduled: "Rescheduled" } as Record<string, string>)[a.status] ?? a.status,
      date: a.date, icon: CalendarPlus, color: "#f59e0b",
    })),
    ...labOrders.filter(lo => !lo.voided && lo.sentAt).map(lo => ({
      title: lo.orderSetName ?? "Lab Order", subtitle: `${lo.tests.length} test${lo.tests.length !== 1 ? "s" : ""}`,
      date: lo.sentAt!, icon: FlaskConical, color: "#f59e0b",
    })),
    ...appointments.filter(a => invoices[a.id]).map(a => {
      const r = invoices[a.id] as ReceiptInfo;
      return { title: `Invoice #${r.invNo}`, subtitle: `PKR ${r.total?.toLocaleString()}`, date: a.date, icon: Receipt, color: "#10b981" };
    }),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);

  const TABS: { id: TabId; label: string; icon: React.ElementType; color: string; count?: number }[] = [
    { id: "overview",    label: "Overview",       icon: FileText,     color: "#4982CF" },
    { id: "soap",        label: "SOAP",           icon: ClipboardList,color: "#4982CF" },
    { id: "health",      label: "Appointments",   icon: FileText,     color: "#4982CF", count: visitCount   || undefined },
    { id: "labs",        label: "Lab Reports",    icon: FlaskConical, color: "#f59e0b", count: labCount     || undefined },
    { id: "radiology",   label: "Radiology",      icon: Scan,         color: "#0ea5e9", count: radCount     || undefined },
    { id: "files",       label: "Files",          icon: Folder,       color: "#f59e0b" },
    { id: "medications", label: "Medications",    icon: Pill,         color: "#8b5cf6", count: medicines.length || undefined },
    { id: "allergies",   label: "Allergies",      icon: AlertCircle,  color: "#ef4444", count: allergies.length || undefined },
    { id: "vitals",      label: "Vitals",         icon: Activity,     color: "#8b5cf6", count: vitals.length   || undefined },
    { id: "family",       label: "Family History", icon: Users,       color: "#ec4899", count: filledFh.length || undefined },
    { id: "family-tree",  label: "Family Tree",    icon: GitBranch,   color: "#8b5cf6" },
    { id: "invoices",     label: "Invoices",       icon: Receipt,     color: "#10b981", count: invoiceCount || undefined },
  ];

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex-none bg-white border-b border-slate-200 shadow-sm z-20">
        <QueueAppHeader />
      </div>

      {/* ── Body: two-panel ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ────────────────────────────────────────────────── */}
        <div className="w-56 flex-none flex flex-col border-r border-slate-200 bg-white overflow-hidden">

          {/* ── Fixed top: identity + demographics + print cards ── */}
          <div className="flex-none">
            {/* Back button */}
            <div className="px-4 pt-3 pb-1">
              <button
                onClick={() => history.back()}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>

            {/* Avatar + identity */}
            <div className="flex flex-col items-center px-5 pt-3 pb-4">
              <div
                className="h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-sm"
                style={{ backgroundColor: bg }}
              >
                {inits}
              </div>
              <p className="mt-3 text-sm font-black text-slate-900 text-center leading-tight">{patient.name}</p>
              <span
                className="mt-1.5 text-xs font-black px-2.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: ACCENT }}
              >
                {patient.mrn}
              </span>
            </div>

            {/* Demographics */}
            <div className="px-4 pb-4 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-600">{patient.gender === "M" ? "Male" : patient.gender === "O" ? "Other" : "Female"} · {age}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-600 truncate">{patient.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-600">{patient.dob || "—"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Hash className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-400 truncate">{patient.id}</span>
              </div>
            </div>

            {/* Print cards — fixed */}
            <div className="px-4 py-3 space-y-2 border-t border-slate-100">
              <button
                onClick={() => setPrintMode("registration")}
                className="w-full flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Printer className="h-3.5 w-3.5 flex-shrink-0" />Registration Card
              </button>
              <button
                onClick={() => setPrintMode("family")}
                className="w-full flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Printer className="h-3.5 w-3.5 flex-shrink-0" />Family Card
              </button>
            </div>
          </div>

          {/* ── Scrollable bottom: action buttons ── */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 border-t border-slate-200">
            <button
              onClick={() => setShowEdit(true)}
              className="w-full flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: ACCENT }} />Edit Profile
            </button>
            <button
              onClick={() => comingSoon("Add Invoice")}
              className="w-full flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Receipt className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />Add Invoice
            </button>
            <button
              onClick={() => comingSoon("Add Appointment")}
              className="w-full flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <CalendarPlus className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />Add Appointment
            </button>
            <button
              onClick={() => comingSoon("Add Token")}
              className="w-full flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Ticket className="h-3.5 w-3.5 flex-shrink-0 text-purple-500" />Add Token
            </button>
            <button
              onClick={() => comingSoon("Add File")}
              className="w-full flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Upload className="h-3.5 w-3.5 flex-shrink-0 text-cyan-500" />Add File
            </button>
            <button
              onClick={() => comingSoon("Add History")}
              className="w-full flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <History className="h-3.5 w-3.5 flex-shrink-0 text-pink-500" />Add History
            </button>
            <button
              onClick={() => comingSoon("Email Profile")}
              className="w-full flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Mail className="h-3.5 w-3.5 flex-shrink-0 text-sky-500" />Email Profile
            </button>
          </div>
        </div>

        {/* ── Right area ──────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Tab strip */}
          <div className="flex-none overflow-x-auto bg-white border-b border-slate-200 pt-2">
            <div className="flex min-w-max">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-5 py-4 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-[#4982CF] text-[#4982CF]"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white leading-none"
                      style={{ backgroundColor: tab.color }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden bg-slate-50">

            {/* Overview — two-column: 9-card grid + Recent Activity panel */}
            {activeTab === "overview" && (
              <div className="flex h-full overflow-hidden">

                {/* Card grid */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                    <SectionCard title="Appointments" icon={FileText} color="#4982CF" count={visitCount || undefined} onViewAll={() => setActiveTab("health")}>
                      {appointments.slice(0, 3).map((a, i) => (
                        <div key={i} className="flex items-center gap-2 py-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#4982CF] flex-shrink-0" />
                          <p className="text-xs text-slate-600 truncate flex-1">{a.type || a.specialty || "Visit"}</p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">{a.date}</span>
                        </div>
                      ))}
                      {visitCount === 0 && <p className="text-xs text-slate-400 text-center py-3">No records yet</p>}
                    </SectionCard>

                    <SectionCard title="Recent Files" icon={Folder} color="#f59e0b" onViewAll={() => setActiveTab("files")}>
                      {(() => {
                        const recentFiles = loadPatientFilesLatest(id ?? "", 3);
                        if (recentFiles.length === 0) return <p className="text-xs text-slate-400 text-center py-3">No files uploaded</p>;
                        return recentFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 py-0.5">
                            <Folder className="h-3 w-3 text-amber-400 flex-shrink-0" />
                            <p className="text-xs text-slate-600 truncate flex-1">{f.name}</p>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">{formatFileSize(f.size)}</span>
                          </div>
                        ));
                      })()}
                    </SectionCard>

                    <SectionCard title="Laboratory Reports" icon={FlaskConical} color="#f59e0b" count={labCount || undefined} onViewAll={() => setActiveTab("labs")}>
                      {labCount === 0
                        ? <p className="text-xs text-slate-400 text-center py-3">No lab orders yet</p>
                        : labOrders.filter(lo => !lo.voided)[0]?.tests.slice(0, 3).map((t, i) => (
                          <div key={i} className="flex items-center gap-2 py-0.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                            <p className="text-xs text-slate-600 truncate">{t.name}</p>
                          </div>
                        ))
                      }
                    </SectionCard>

                    <SectionCard title="Radiology Reports" icon={Scan} color="#0ea5e9" count={radCount || undefined} onViewAll={() => setActiveTab("radiology")}>
                      {imagingOrders.length === 0
                        ? <p className="text-xs text-slate-400 text-center py-3">No reports yet</p>
                        : imagingOrders.slice(0, 3).map((io, i) => (
                          <div key={i} className="flex items-center gap-2 py-0.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                            <p className="text-xs text-slate-600 truncate">{io.modality} → {io.bodyPart}</p>
                          </div>
                        ))
                      }
                    </SectionCard>

                    <SectionCard title="Family History" icon={Users} color="#ec4899" count={filledFh.length || undefined} onViewAll={() => setActiveTab("family")}>
                      {filledFh.length === 0
                        ? <p className="text-xs text-slate-400 text-center py-3">No family history</p>
                        : filledFh.slice(0, 3).map((row, i) => (
                          <div key={i} className="flex items-start gap-2 py-0.5">
                            <Users className="h-3 w-3 text-rose-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-600 leading-snug line-clamp-1">{row.condition}{row.relation ? ` · ${row.relation}` : ""}</p>
                          </div>
                        ))
                      }
                    </SectionCard>

                    <SectionCard title="Invoices" icon={Receipt} color="#10b981" count={invoiceCount || undefined} onViewAll={() => setActiveTab("invoices")}>
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

                    <SectionCard title="Allergies" icon={AlertCircle} color="#ef4444" count={allergies.length || undefined} onViewAll={() => setActiveTab("allergies")}>
                      {allergies.length === 0
                        ? <p className="text-xs text-slate-400 text-center py-3">No allergies recorded</p>
                        : allergies.slice(0, 3).map((a, i) => (
                          <div key={i} className="flex items-center gap-2 py-0.5">
                            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: SEV_COLOR[a.severity] ?? "#94a3b8" }} />
                            <p className="text-xs text-slate-700 truncate flex-1 font-medium">{(a as { name?: string }).name ?? "—"}</p>
                            <span className="text-[9px] font-black flex-shrink-0" style={{ color: SEV_COLOR[a.severity] ?? "#94a3b8" }}>
                              {a.severity}
                            </span>
                          </div>
                        ))
                      }
                    </SectionCard>

                    <SectionCard title="Vital Trends" icon={Activity} color="#8b5cf6" count={vitals.length || undefined} onViewAll={() => setActiveTab("vitals")}>
                      {vitals.length === 0
                        ? <p className="text-xs text-slate-400 text-center py-3">No vitals recorded yet</p>
                        : vitals.slice(-3).reverse().map((v, i) => (
                          <div key={i} className="flex items-center gap-2 py-0.5 text-xs">
                            <span className="text-slate-400 w-16 flex-shrink-0">{v.date}</span>
                            {v.bpSystolic && <span className="text-red-600 font-semibold">{v.bpSystolic}/{v.bpDiastolic} mmHg</span>}
                            {v.pulse && <span className="text-purple-600 font-semibold ml-1">{v.pulse} bpm</span>}
                          </div>
                        ))
                      }
                    </SectionCard>

                    <SectionCard title="Patient Medications" icon={Pill} color="#8b5cf6" count={medicines.length || undefined} onViewAll={() => setActiveTab("medications")}>
                      {medicines.length === 0
                        ? <p className="text-xs text-slate-400 text-center py-3">No medications prescribed</p>
                        : medicines.slice(0, 3).map((m, i) => (
                          <div key={i} className="flex items-center gap-2 py-0.5">
                            <Pill className="h-3 w-3 text-purple-400 flex-shrink-0" />
                            <p className="text-xs text-slate-700 truncate flex-1">{m.genericName}</p>
                          </div>
                        ))
                      }
                    </SectionCard>

                  </div>
                </div>

                {/* Recent Activity panel */}
                <div className="w-60 flex-none border-l border-slate-200 bg-white flex flex-col overflow-hidden">
                  <div className="flex-none px-4 py-4 border-b border-slate-100">
                    <p className="text-sm font-black text-slate-800">Recent Activity</p>
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 py-3">
                    {recentActivity.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Activity className="h-4 w-4 text-slate-300" />
                        </div>
                        <p className="text-xs text-slate-400 text-center">No activity recorded yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {recentActivity.map((event, i) => (
                          <div key={i} className="flex items-start gap-2.5 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                            <div
                              className="h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: `${event.color}15` }}
                            >
                              <event.icon className="h-3 w-3" style={{ color: event.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-700 leading-snug truncate">{event.title}</p>
                              {event.subtitle && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{event.subtitle}</p>}
                              <p className="text-[10px] text-slate-400 mt-0.5">{event.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {activeTab === "soap" && <SoapTabContent mrn={patient.mrn} />}

            {activeTab === "health" && (
              <div className="h-full overflow-y-auto p-6 max-w-2xl">
                <HealthRecordsContent appointments={appointments} visits={visits} />
              </div>
            )}
            {activeTab === "labs" && (
              <div className="h-full overflow-y-auto p-6 max-w-2xl">
                <LabReportsContent labOrders={labOrders} />
              </div>
            )}
            {activeTab === "radiology" && (
              <div className="h-full overflow-y-auto p-6 max-w-2xl">
                <RadiologyContent imagingOrders={imagingOrders} />
              </div>
            )}
            {activeTab === "files" && (
              <div className="h-full p-4">
                <PatientFilesExplorer patientId={id ?? ""} />
              </div>
            )}
            {activeTab === "medications" && (
              <div className="h-full overflow-y-auto p-6 max-w-2xl">
                <MedicationsContent medicines={medicines} />
              </div>
            )}
            {activeTab === "allergies" && (
              <div className="h-full overflow-y-auto p-6 max-w-2xl">
                <AllergiesContent allergies={allergies} />
              </div>
            )}
            {activeTab === "vitals" && (
              <div className="h-full overflow-y-auto p-6">
                <VitalsContent vitals={vitals} />
              </div>
            )}
            {activeTab === "family" && (
              <div className="h-full overflow-y-auto p-6 max-w-2xl">
                <FamilyHistoryContent fhRows={fhRows} />
              </div>
            )}
            {activeTab === "family-tree" && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
                  <GitBranch className="h-7 w-7 text-violet-400" />
                </div>
                <p className="text-base font-semibold text-slate-700">Family Tree</p>
                <p className="text-sm text-slate-400 max-w-xs">This feature is coming soon. You'll be able to visualise multi-generation family health relationships here.</p>
                <span className="mt-1 px-3 py-1 rounded-full bg-violet-100 text-violet-500 text-xs font-semibold tracking-wide">Coming Soon</span>
              </div>
            )}
            {activeTab === "invoices" && (
              <div className="h-full overflow-y-auto p-6 max-w-2xl">
                <InvoicesContent appointments={appointments} invoices={invoices} />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit Profile */}
      {showEdit && (
        <EditProfileDrawer
          patient={patient}
          onClose={() => setShowEdit(false)}
          onSave={handleSave}
        />
      )}

      {/* ── Print cards ─────────────────────────────────────────────────────── */}
      {printMode && patient && (
        <>
          <style>{`
            @media print {
              body > *:not(#patient-print-root) { display: none !important; }
              #patient-print-root { display: block !important; }
              .no-print { display: none !important; }
            }
          `}</style>
          <div id="patient-print-root" style={{ display: "none" }}
            className="print:block font-sans p-8 max-w-lg mx-auto text-slate-900">
            <div className="border-2 border-slate-300 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <div>
                  <h1 className="text-lg font-black">
                    {printMode === "registration" ? "Registration Card" : "Family History Card"}
                  </h1>
                  <p className="text-xs text-slate-500">NovaDoc EHR</p>
                </div>
                <p className="text-xs text-slate-400">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="space-y-1.5 mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</p>
                <p className="text-base font-black">{patient.name}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-700">
                  <span><span className="font-semibold">MRN:</span> {patient.mrn}</span>
                  <span><span className="font-semibold">DOB:</span> {patient.dob}</span>
                  <span><span className="font-semibold">Gender:</span> {patient.gender}</span>
                  <span><span className="font-semibold">Phone:</span> {patient.phone}</span>
                </div>
              </div>
              {printMode === "registration" && allergies.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Allergies</p>
                  <div className="space-y-1">
                    {allergies.map((a, i) => (
                      <p key={i} className="text-sm">{(a as { name?: string }).name ?? "—"}</p>
                    ))}
                  </div>
                </div>
              )}
              {printMode === "family" && fhRows.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Family History</p>
                  <div className="space-y-1">
                    {fhRows.map((row, i) => (
                      <p key={i} className="text-sm">
                        {(row as { relation?: string; condition?: string }).relation ?? "—"}
                        {" — "}
                        {(row as { condition?: string }).condition ?? ""}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {printMode === "family" && fhRows.length === 0 && (
                <p className="text-xs text-slate-400 mt-3">No family history recorded.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
