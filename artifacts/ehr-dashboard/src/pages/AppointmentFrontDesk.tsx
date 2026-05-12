import React, { useState, useMemo, useRef } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, ChevronDown, Plus, Printer,
  Maximize2, Minimize2, X, Search, User, Phone, AlertCircle,
  CheckCircle2, Clock, Edit2, Eye, FileText, Stethoscope,
  Repeat, AlertTriangle, LayoutGrid, Columns2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { QueueAppHeader } from "@/pages/QueuePageLayout";
import { useAppointmentDoctors } from "@/hooks/useAppointmentDoctors";
import { useAppointments, type Appointment, type ApptStatus } from "@/hooks/useAppointments";
import { usePatients } from "@/hooks/usePatients";
import { useToast } from "@/hooks/use-toast";
import type { Doctor } from "@/pages/DoctorsModule";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

function todayStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function getDayName(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
}

function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateFull(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function getWeekDays(dateStr: string): string[] {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = dt.getDay(); // 0 = Sun
  const monday = new Date(y, m - 1, d - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  });
}

function getMonthDays(dateStr: string): string[] {
  const [y, m] = dateStr.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const last  = new Date(y, m, 0).getDate();
  const startDow = first.getDay(); // 0=Sun, need Mon-start grid
  const offset = startDow === 0 ? 6 : startDow - 1;
  const cells: string[] = [];
  for (let i = -offset; i < last; i++) {
    const dt = new Date(y, m - 1, 1 + i);
    cells.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    cells.push(addDays(last, 1));
  }
  return cells;
}

interface SlotBlock {
  timingId: string;
  start: string;
  end: string;
  allowMultiple: boolean;
}

function generateSlots(timing: Doctor["timings"][number], dateStr: string): SlotBlock[] {
  if (getDayName(dateStr) !== timing.day) return [];
  const slots: SlotBlock[] = [];
  const [eh, em] = timing.endTime.split(":").map(Number);
  const endTotal = eh * 60 + em;
  let curr = timing.startTime.split(":").map(Number).reduce((a, b, i) => i === 0 ? b * 60 : a + b, 0);
  while (curr < endTotal) {
    const slotEnd = Math.min(curr + timing.slotDuration, endTotal);
    slots.push({
      timingId: timing.id,
      start: `${String(Math.floor(curr / 60)).padStart(2, "0")}:${String(curr % 60).padStart(2, "0")}`,
      end:   `${String(Math.floor(slotEnd / 60)).padStart(2, "0")}:${String(slotEnd % 60).padStart(2, "0")}`,
      allowMultiple: timing.allowMultiple,
    });
    curr += timing.slotDuration;
  }
  return slots;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ApptStatus, { label: string; text: string; bg: string; dot: string }> = {
  booked:      { label: "Booked",      text: "text-slate-700",   bg: "bg-slate-100 border-slate-400",    dot: "bg-slate-500"    },
  confirmed:   { label: "Confirmed",   text: "text-emerald-800", bg: "bg-emerald-100 border-emerald-500", dot: "bg-emerald-500"  },
  checked_in:  { label: "Checked In",  text: "text-blue-800",    bg: "bg-blue-100 border-blue-500",      dot: "bg-blue-500"     },
  cancelled:   { label: "Cancelled",   text: "text-red-700",     bg: "bg-red-100 border-red-500",        dot: "bg-red-500"      },
  no_show:     { label: "No Show",     text: "text-orange-700",  bg: "bg-orange-100 border-orange-500",  dot: "bg-orange-500"   },
  rescheduled: { label: "Rescheduled", text: "text-purple-800",  bg: "bg-purple-100 border-purple-500",  dot: "bg-purple-500"   },
  checked_out: { label: "Checked Out", text: "text-slate-800",   bg: "bg-slate-200 border-slate-500",    dot: "bg-slate-600"    },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as ApptStatus[];

const PRIORITY_CONFIG = {
  normal:    { label: "Normal",    text: "text-slate-600",  bg: "bg-slate-100"   },
  urgent:    { label: "Urgent",    text: "text-amber-700",  bg: "bg-amber-50"    },
  emergency: { label: "Emergency", text: "text-red-700",    bg: "bg-red-50"      },
};

// ─── Right Drawer Shell ───────────────────────────────────────────────────────

interface RightDrawerProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function RightDrawer({ title, subtitle, onClose, children, footer }: RightDrawerProps) {
  const [fs, setFs] = useState(false);
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col border-l border-slate-200 transition-all duration-300 ${fs ? "w-full" : "w-[42%] min-w-[520px]"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900">{title}</p>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setFs(p => !p)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
              {fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex-shrink-0 border-t border-slate-100 px-5 py-4">{footer}</div>}
      </div>
    </>
  );
}

// ─── Booking Form State ───────────────────────────────────────────────────────

interface BookingForm {
  doctorId: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  patientName: string;
  patientMrn: string;
  patientPhone: string;
  type: string;
  specialty: string;
  priority: "normal" | "urgent" | "emergency";
  contagious: boolean;
  contagiousNote: string;
  repeat: boolean;
  repeatType: "daily" | "weekly" | "monthly" | "custom";
  repeatNote: string;
  comments: string;
}

function emptyForm(init?: Partial<BookingForm>): BookingForm {
  return {
    doctorId: "", date: todayStr(), slotStart: "", slotEnd: "",
    patientName: "", patientMrn: "", patientPhone: "",
    type: "", specialty: "", priority: "normal",
    contagious: false, contagiousNote: "",
    repeat: false, repeatType: "weekly", repeatNote: "",
    comments: "", ...init,
  };
}

// ─── Booking Drawer ───────────────────────────────────────────────────────────

interface BookingDrawerProps {
  doctors: Doctor[];
  init: Partial<BookingForm>;
  editAppt?: Appointment | null;
  onSave: (form: BookingForm) => void;
  onClose: () => void;
}

function BookingDrawer({ doctors, init, editAppt, onSave, onClose }: BookingDrawerProps) {
  const { patients } = usePatients();
  const [form, setForm] = useState<BookingForm>(() => emptyForm(editAppt ? {
    doctorId: editAppt.doctorId, date: editAppt.date,
    slotStart: editAppt.slotStart, slotEnd: editAppt.slotEnd,
    patientName: editAppt.patientName, patientMrn: editAppt.patientMrn,
    patientPhone: editAppt.patientPhone, type: editAppt.type,
    specialty: editAppt.specialty, priority: editAppt.priority,
    contagious: editAppt.contagious, contagiousNote: editAppt.contagiousNote,
    repeat: editAppt.repeat, repeatType: editAppt.repeatType || "weekly",
    repeatNote: editAppt.repeatNote, comments: editAppt.comments,
  } : init));
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const set = (k: keyof BookingForm, v: BookingForm[typeof k]) =>
    setForm(p => ({ ...p, [k]: v }));

  const doctor = doctors.find(d => d.id === form.doctorId);

  const slotsForDay = useMemo(() => {
    if (!doctor || !form.date) return [];
    return doctor.timings.flatMap(t => generateSlots(t, form.date));
  }, [doctor, form.date]);

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.phone.includes(q)
    ).slice(0, 6);
  }, [patients, search]);

  function selectPatient(p: (typeof patients)[number]) {
    set("patientName", p.name);
    set("patientMrn", p.mrn);
    set("patientPhone", p.phone);
    setSearch(p.name);
    setSearchFocused(false);
  }

  const canSave = form.doctorId && form.date && form.slotStart && form.patientName;

  const title = editAppt ? "Edit Appointment" : "Book Appointment";
  const subtitle = editAppt ? `Editing ${editAppt.patientName}` : "Fill in the details below";

  return (
    <RightDrawer
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">Cancel</Button>
          <Button
            disabled={!canSave}
            onClick={() => onSave(form)}
            className="flex-1 h-9 bg-[#4982CF] hover:bg-[#3D73BC] text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {editAppt ? "Save Changes" : "Book Appointment"}
          </Button>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-5">

        {/* Patient Search */}
        <section>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Patient</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search by name, MRN, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              className="pl-9 h-9 text-sm"
            />
            {searchFocused && filteredPatients.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {filteredPatients.map(p => (
                  <button
                    key={p.id}
                    onMouseDown={() => selectPatient(p)}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                  >
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.mrn} · {p.phone}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {(form.patientName || form.patientMrn || form.patientPhone) && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Full Name</label>
                <Input value={form.patientName} onChange={e => set("patientName", e.target.value)} className="h-8 text-xs" placeholder="Name..." />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">MR Number</label>
                <Input value={form.patientMrn} onChange={e => set("patientMrn", e.target.value)} className="h-8 text-xs" placeholder="MR-XXXXX" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Phone</label>
                <Input value={form.patientPhone} onChange={e => set("patientPhone", e.target.value)} className="h-8 text-xs" placeholder="+92..." />
              </div>
            </div>
          )}
          {!form.patientName && (
            <button
              onClick={() => { set("patientName", " "); set("patientMrn", ""); set("patientPhone", ""); setSearch(""); }}
              className="mt-1.5 text-xs text-[#4982CF] hover:opacity-70 flex items-center gap-1"
            >
              <User className="h-3 w-3" /> Enter manually
            </button>
          )}
        </section>

        <div className="h-px bg-slate-100" />

        {/* Doctor, Date, Slot */}
        <section>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Appointment Details</label>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Doctor</label>
              <Select value={form.doctorId} onValueChange={v => { set("doctorId", v); set("slotStart", ""); set("slotEnd", ""); const doc = doctors.find(d => d.id === v); set("specialty", doc?.specialties[0] ?? ""); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select doctor..." /></SelectTrigger>
                <SelectContent>
                  {doctors.filter(d => d.doctorType === "appointment" && d.status === "active").map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Date</label>
                <Input type="date" value={form.date} onChange={e => { set("date", e.target.value); set("slotStart", ""); set("slotEnd", ""); }} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Specialty</label>
                <Input value={form.specialty} onChange={e => set("specialty", e.target.value)} className="h-9 text-sm" placeholder="Specialty..." />
              </div>
            </div>

            {/* Time Slot blocks */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Time Slot</label>
              {slotsForDay.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No slots configured for {getDayName(form.date)}.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {slotsForDay.map(slot => {
                    const active = form.slotStart === slot.start;
                    return (
                      <button
                        key={slot.start}
                        onClick={() => { set("slotStart", slot.start); set("slotEnd", slot.end); }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${active ? "bg-[#4982CF] text-white border-[#4982CF]" : "bg-white text-slate-600 border-slate-200 hover:border-[#4982CF] hover:text-[#4982CF]"}`}
                      >
                        {slot.start}
                        {slot.allowMultiple && <span className="ml-1 opacity-60">+</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Appointment Type */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Appointment Type</label>
              <Select value={form.type} onValueChange={v => set("type", v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {(doctor?.services ?? ["Consultation", "FollowUp", "Emergency", "Tele-consultation"]).map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <div className="h-px bg-slate-100" />

        {/* Priority */}
        <section>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Priority</label>
          <div className="flex gap-2">
            {(["normal", "urgent", "emergency"] as const).map(p => (
              <button
                key={p}
                onClick={() => set("priority", p)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${form.priority === p ? (p === "normal" ? "bg-slate-600 text-white border-slate-600" : p === "urgent" ? "bg-amber-500 text-white border-amber-500" : "bg-red-500 text-white border-red-500") : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
              >
                {p === "emergency" && <AlertCircle className="h-3 w-3 inline mr-1" />}
                {p === "urgent" && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                {PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>
        </section>

        {/* Contagious Disease */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contagious Disease</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{form.contagious ? "Yes" : "No"}</span>
              <Switch
                checked={form.contagious}
                onCheckedChange={v => { set("contagious", v); if (!v) set("contagiousNote", ""); }}
                className="data-[state=checked]:bg-red-500"
              />
            </div>
          </div>
          {form.contagious && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 font-semibold">Select disease(s):</p>
              <div className="flex flex-wrap gap-1.5">
                {CONTAGIOUS_OPTIONS.map(opt => {
                  const notes = form.contagiousNote.split(",").map(s => s.trim()).filter(Boolean);
                  const isOther = opt === "Other";
                  const selected = isOther
                    ? notes.some(n => !CONTAGIOUS_OPTIONS.slice(0, -1).includes(n))
                    : notes.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const current = form.contagiousNote.split(",").map(s => s.trim()).filter(Boolean);
                        if (isOther) return;
                        const next = selected ? current.filter(n => n !== opt) : [...current, opt];
                        set("contagiousNote", next.join(", "));
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${selected ? "bg-red-500 text-white border-red-500" : "bg-white text-slate-500 border-slate-200 hover:border-red-300"}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <Input
                value={(() => {
                  const known = new Set(CONTAGIOUS_OPTIONS.slice(0, -1));
                  return form.contagiousNote.split(",").map(s => s.trim()).filter(n => n && !known.has(n)).join(", ");
                })()}
                onChange={e => {
                  const known = new Set(CONTAGIOUS_OPTIONS.slice(0, -1));
                  const chips = form.contagiousNote.split(",").map(s => s.trim()).filter(n => n && known.has(n));
                  const custom = e.target.value.trim();
                  set("contagiousNote", [...chips, ...(custom ? [custom] : [])].join(", "));
                }}
                placeholder='Other (specify)...'
                className="h-8 text-xs"
              />
            </div>
          )}
        </section>

        {/* Repeat Appointment */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Repeat Appointment</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{form.repeat ? "Yes" : "No"}</span>
              <Switch
                checked={form.repeat}
                onCheckedChange={v => set("repeat", v)}
                className="data-[state=checked]:bg-[#4982CF]"
              />
            </div>
          </div>
          {form.repeat && (
            <div className="space-y-2">
              <div className="flex gap-1.5">
                {(["daily", "weekly", "monthly", "custom"] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => set("repeatType", r)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${form.repeatType === r ? "bg-[#4982CF] text-white border-[#4982CF]" : "bg-white text-slate-500 border-slate-200 hover:border-[#4982CF]"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {form.repeatType === "custom" && (
                <Input
                  value={form.repeatNote}
                  onChange={e => set("repeatNote", e.target.value)}
                  placeholder="Describe repeat schedule..."
                  className="h-9 text-sm"
                />
              )}
            </div>
          )}
        </section>

        {/* Comments */}
        <section>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Comments</label>
          <textarea
            value={form.comments}
            onChange={e => set("comments", e.target.value)}
            placeholder="Any additional notes..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-[#4982CF]"
          />
        </section>
      </div>
    </RightDrawer>
  );
}

// ─── Contagious Disease Options ───────────────────────────────────────────────

const CONTAGIOUS_OPTIONS = [
  "COVID-19", "Tuberculosis (TB)", "Influenza", "Hepatitis A/B/C",
  "MRSA", "Chickenpox", "Measles", "Other",
];

// ─── View Drawer (read-only appointment details) ──────────────────────────────

interface ViewDrawerProps {
  appt: Appointment;
  doctorName: string;
  onClose: () => void;
  onEdit: () => void;
}

function ViewDrawer({ appt, doctorName, onClose, onEdit }: ViewDrawerProps) {
  const sc = STATUS_CONFIG[appt.status];
  const pc = PRIORITY_CONFIG[appt.priority];

  function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0 gap-4">
        <span className="text-xs font-semibold text-slate-400 flex-shrink-0 w-28">{label}</span>
        <span className="text-xs text-slate-800 text-right flex-1 min-w-0">{children}</span>
      </div>
    );
  }

  return (
    <RightDrawer
      title="Appointment Details"
      subtitle={`${appt.patientName} — ${formatDateShort(appt.date)}`}
      onClose={onClose}
      footer={
        <Button
          onClick={onEdit}
          className="w-full h-9 bg-[#4982CF] hover:bg-[#3D73BC] text-white gap-2"
        >
          <Edit2 className="h-4 w-4" /> Edit Appointment
        </Button>
      }
    >
      <div className="px-5 py-4">
        {/* Status badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-5 ${sc.bg} ${sc.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
          {sc.label}
        </div>

        {/* Patient */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Patient</p>
          <p className="font-bold text-slate-900">{appt.patientName}</p>
          {appt.patientMrn && <p className="text-xs text-slate-500 mt-0.5">{appt.patientMrn}</p>}
          {appt.patientPhone && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Phone className="h-3 w-3" /> {appt.patientPhone}
            </p>
          )}
        </div>

        {/* Details */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-1 mb-4">
          <Row label="Doctor">{doctorName}</Row>
          <Row label="Date">{formatDateFull(appt.date)}</Row>
          <Row label="Time Slot">{appt.slotStart} – {appt.slotEnd}</Row>
          {appt.type && <Row label="Type">{appt.type}</Row>}
          {appt.specialty && <Row label="Specialty">{appt.specialty}</Row>}
          <Row label="Priority">
            <span className={`font-bold capitalize ${pc.text}`}>{appt.priority}</span>
          </Row>
        </div>

        {/* Flags */}
        {(appt.contagious || appt.repeat) && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-1 mb-4">
            {appt.contagious && (
              <Row label="Contagious Disease">
                <span className="text-red-600 font-semibold">
                  Yes{appt.contagiousNote ? ` — ${appt.contagiousNote}` : ""}
                </span>
              </Row>
            )}
            {appt.repeat && (
              <Row label="Repeat">
                <span className="text-[#4982CF] font-semibold capitalize">
                  {appt.repeatType}{appt.repeatNote ? ` — ${appt.repeatNote}` : ""}
                </span>
              </Row>
            )}
          </div>
        )}

        {/* Comments */}
        {appt.comments && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Comments</p>
            <p className="text-sm text-slate-700 italic">"{appt.comments}"</p>
          </div>
        )}

        {/* Meta */}
        <p className="text-[10px] text-slate-300 text-center mt-2">
          Booked {new Date(appt.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>
    </RightDrawer>
  );
}

// ─── Appointment Chip ─────────────────────────────────────────────────────────

interface ChipProps {
  appt: Appointment;
  onClick: (appt: Appointment, e: React.MouseEvent) => void;
}

function ApptChip({ appt, onClick }: ChipProps) {
  const sc = STATUS_CONFIG[appt.status];
  const pc = PRIORITY_CONFIG[appt.priority];
  return (
    <button
      onClick={e => onClick(appt, e)}
      className={`w-full text-left px-3 py-2 rounded-lg border-2 mb-1.5 hover:brightness-95 transition-all ${sc.bg}`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${sc.dot}`} />
        <span className={`text-sm font-bold truncate leading-tight ${sc.text}`}>{appt.patientName}</span>
        {appt.priority !== "normal" && (
          <span className={`ml-auto text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${pc.bg} ${pc.text}`}>
            {appt.priority === "urgent" ? "URG" : "EMR"}
          </span>
        )}
      </div>
      <div className="ml-4 mt-0.5 flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-mono font-semibold ${sc.text} opacity-75`}>{appt.slotStart}</span>
        {appt.patientMrn && <span className={`text-xs font-medium ${sc.text} opacity-60`}>{appt.patientMrn}</span>}
        {appt.patientPhone && <span className={`text-xs ${sc.text} opacity-50`}>{appt.patientPhone}</span>}
      </div>
    </button>
  );
}

// ─── Appointment Card Popup ───────────────────────────────────────────────────

interface CardState {
  appt: Appointment;
  x: number;
  y: number;
}

interface ApptCardProps {
  state: CardState;
  onClose: () => void;
  onView: (appt: Appointment) => void;
  onEdit: (appt: Appointment) => void;
  onStatusChange: (id: string, status: ApptStatus) => void;
  onInvoice: () => void;
}

function AppointmentCard({ state, onClose, onView, onEdit, onStatusChange, onInvoice }: ApptCardProps) {
  const { appt, x, y } = state;
  const sc = STATUS_CONFIG[appt.status];

  const nextStatuses: ApptStatus[] = (() => {
    if (appt.status === "booked")      return ["confirmed", "checked_in", "rescheduled", "cancelled", "no_show"];
    if (appt.status === "confirmed")   return ["checked_in", "rescheduled", "cancelled", "no_show"];
    if (appt.status === "checked_in")  return ["checked_out", "rescheduled", "cancelled"];
    if (appt.status === "rescheduled") return ["booked", "confirmed", "cancelled"];
    return [];
  })();

  const adjustedX = Math.min(x, window.innerWidth - 340);
  const adjustedY = Math.min(y, window.innerHeight - 380);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
        style={{ left: adjustedX, top: adjustedY }}
      >
        {/* Header */}
        <div className={`px-4 py-3 border-b border-slate-100 ${sc.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${sc.text}`}>{sc.label}</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <p className="font-bold text-slate-900 mt-1">{appt.patientName}</p>
          <p className="text-xs text-slate-500">{appt.patientMrn} {appt.patientPhone && `· ${appt.patientPhone}`}</p>
        </div>

        {/* Info */}
        <div className="px-4 py-3 space-y-1.5 border-b border-slate-100">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Date & Time</span>
            <span className="text-slate-700 font-semibold">{formatDateShort(appt.date)} · {appt.slotStart}–{appt.slotEnd}</span>
          </div>
          {appt.type && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Type</span>
              <span className="text-slate-700 font-semibold">{appt.type}</span>
            </div>
          )}
          {appt.specialty && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Specialty</span>
              <span className="text-slate-700 font-semibold">{appt.specialty}</span>
            </div>
          )}
          {appt.priority !== "normal" && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Priority</span>
              <span className={`font-bold capitalize ${PRIORITY_CONFIG[appt.priority].text}`}>{appt.priority}</span>
            </div>
          )}
          {appt.contagious && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Contagious</span>
              <span className="text-red-600 font-semibold">Yes {appt.contagiousNote && `— ${appt.contagiousNote}`}</span>
            </div>
          )}
          {appt.repeat && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Repeat</span>
              <span className="text-[#4982CF] font-semibold capitalize">{appt.repeatType}</span>
            </div>
          )}
          {appt.comments && (
            <div className="text-xs text-slate-500 pt-1 italic">"{appt.comments}"</div>
          )}
        </div>

        {/* Status change */}
        {nextStatuses.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Change Status</p>
            <div className="flex flex-wrap gap-1.5">
              {nextStatuses.map(s => {
                const c = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(appt.id, s); onClose(); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${c.bg} ${c.text} hover:opacity-80`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { onView(appt); onClose(); }} className="flex-1 h-8 text-xs gap-1.5">
            <Eye className="h-3 w-3" /> View
          </Button>
          <Button size="sm" variant="outline" onClick={() => { onEdit(appt); onClose(); }} className="flex-1 h-8 text-xs gap-1.5">
            <Edit2 className="h-3 w-3" /> Edit
          </Button>
          <Button size="sm" variant="outline" onClick={onInvoice} className="flex-1 h-8 text-xs gap-1.5">
            <FileText className="h-3 w-3" /> Invoice
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Slot Row (Day / Doctor View) ─────────────────────────────────────────────

interface SlotRowProps {
  slot: SlotBlock;
  appts: Appointment[];
  filterTypes: string[];
  onClickEmpty: () => void;
  onClickAppt: (appt: Appointment, e: React.MouseEvent) => void;
}

function SlotRow({ slot, appts, filterTypes, onClickEmpty, onClickAppt }: SlotRowProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = filterTypes.length > 0 ? appts.filter(a => filterTypes.includes(a.type)) : appts;
  const shown = expanded ? visible : visible.slice(0, 2);
  // Use ALL appts (not filtered) for booking eligibility so type filters can't bypass capacity
  const canBook = appts.length === 0 || slot.allowMultiple;

  return (
    <div className="flex items-start gap-3 px-4 py-4 border-b border-slate-200 group hover:bg-slate-50 transition-colors">
      <div className="w-24 flex-shrink-0 text-sm font-mono text-slate-600 font-semibold pt-1">
        {slot.start}
        <div className="text-xs text-slate-400 font-normal">{slot.end}</div>
        {slot.allowMultiple && <span className="text-[10px] text-indigo-500 font-bold">MULTI</span>}
      </div>
      <div className="flex-1 min-w-0">
        {shown.map(a => <ApptChip key={a.id} appt={a} onClick={onClickAppt} />)}
        {visible.length > 2 && (
          <button onClick={() => setExpanded(p => !p)} className="text-[11px] text-[#4982CF] font-semibold flex items-center gap-0.5 mb-1">
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Show less" : `+${visible.length - 2} more`}
          </button>
        )}
        {canBook && (
          <button
            onClick={onClickEmpty}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-[#4982CF] font-semibold hover:bg-[#4982CF]/8 px-2 py-1 rounded-lg mt-0.5"
          >
            <Plus className="h-3 w-3" /> Book Slot
          </button>
        )}
        {!canBook && visible.length > 0 && (
          <p className="text-[10px] text-slate-300 mt-0.5 px-0.5">Single booking only</p>
        )}
      </div>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────

interface DayViewProps {
  doctor: Doctor;
  date: string;
  appointments: Appointment[];
  filterTypes: string[];
  onClickSlot: (slot: SlotBlock) => void;
  onClickAppt: (appt: Appointment, e: React.MouseEvent) => void;
}

function DayView({ doctor, date, appointments, filterTypes, onClickSlot, onClickAppt }: DayViewProps) {
  const slots = useMemo(
    () => doctor.timings.flatMap(t => generateSlots(t, date)),
    [doctor, date]
  );

  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{doctor.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{formatDateFull(date)}</p>
        </div>
        <div className="py-20 text-center">
          <Calendar className="h-8 w-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-medium">No schedule on {getDayName(date)}</p>
          <p className="text-xs text-slate-300 mt-1">This doctor has no timings configured for this day.</p>
        </div>
      </div>
    );
  }

  const dayAppts = appointments.filter(a => a.doctorId === doctor.id && a.date === date);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">{doctor.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{formatDateFull(date)} · {slots.length} slot{slots.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#4982CF]">{dayAppts.length}</p>
          <p className="text-[10px] text-slate-400">booked</p>
        </div>
      </div>
      <div>
        {slots.map(slot => {
          const slotAppts = dayAppts.filter(a => a.slotStart === slot.start);
          return (
            <SlotRow
              key={slot.timingId + slot.start}
              slot={slot}
              appts={slotAppts}
              filterTypes={filterTypes}
              onClickEmpty={() => onClickSlot(slot)}
              onClickAppt={onClickAppt}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

interface WeekSlotCellProps {
  date: string;
  slot: SlotBlock;
  appointments: Appointment[];
  filterTypes: string[];
  doctorId: string;
  onClickSlot: (date: string, slot: SlotBlock) => void;
  onClickAppt: (appt: Appointment, e: React.MouseEvent) => void;
}

function WeekSlotCell({ date, slot, appointments, filterTypes, doctorId, onClickSlot, onClickAppt }: WeekSlotCellProps) {
  const [expanded, setExpanded] = useState(false);
  const slotAppts = appointments.filter(
    a => a.doctorId === doctorId && a.date === date && a.slotStart === slot.start,
  );
  const visible = filterTypes.length > 0 ? slotAppts.filter(a => filterTypes.includes(a.type)) : slotAppts;
  const shown = expanded ? visible : visible.slice(0, 2);
  // capacity check uses ALL slot appts, not filtered subset
  const canBook = slotAppts.length === 0 || slot.allowMultiple;

  return (
    <div className="group h-full px-2 py-3 hover:bg-slate-50 transition-colors">
      {shown.map(a => <ApptChip key={a.id} appt={a} onClick={onClickAppt} />)}
      {visible.length > 2 && (
        <button
          onClick={() => setExpanded(p => !p)}
          className="text-xs text-[#4982CF] font-semibold block mt-0.5"
        >
          {expanded ? "▲ less" : `+${visible.length - 2} more`}
        </button>
      )}
      {canBook && (
        <button
          onClick={() => onClickSlot(date, slot)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#4982CF] font-semibold flex items-center gap-0.5 mt-1 hover:underline"
        >
          <Plus className="h-3 w-3" /> Book
        </button>
      )}
      {!canBook && slotAppts.length > 0 && (
        <p className="text-[10px] text-slate-400 mt-0.5">Single booking only</p>
      )}
    </div>
  );
}

interface WeekViewProps {
  doctor: Doctor;
  weekDays: string[];
  appointments: Appointment[];
  filterTypes: string[];
  onClickSlot: (date: string, slot: SlotBlock) => void;
  onClickAppt: (appt: Appointment, e: React.MouseEvent) => void;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function WeekView({ doctor, weekDays, appointments, filterTypes, onClickSlot, onClickAppt }: WeekViewProps) {
  const today = todayStr();

  const dayData = weekDays.map(d => ({
    date: d,
    slots: doctor.timings.flatMap(t => generateSlots(t, d)),
    isToday: d === today,
  }));

  // Union of all slot start times across the week, sorted — forms the time-axis rows
  const allTimes = Array.from(
    new Set(dayData.flatMap(({ slots }) => slots.map(s => s.start))),
  ).sort();

  // Current-time indicator: static at mount (no live tick needed for v1)
  const nowMinutes = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);
  const isCurrentWeek = weekDays.includes(today);

  // Find the row whose time slot straddles "now": rowStart <= now < nextRowStart
  const currentTimeRow = useMemo(() => {
    if (!isCurrentWeek) return null;
    for (let i = 0; i < allTimes.length; i++) {
      const rowStart = timeToMinutes(allTimes[i]);
      const rowEnd = i + 1 < allTimes.length ? timeToMinutes(allTimes[i + 1]) : rowStart + 30;
      if (nowMinutes >= rowStart && nowMinutes < rowEnd) return allTimes[i];
    }
    return null;
  }, [allTimes, nowMinutes, isCurrentWeek]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* ── Header row (sticky) ────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-300 bg-slate-50 sticky top-0 z-10">
        {/* Ruler stub — same width as the time-label column below */}
        <div className="w-16 flex-shrink-0 border-r border-slate-200" />
        {dayData.map(({ date, slots, isToday }) => {
          const dateNum = parseInt(date.split("-")[2]);
          const dayName = getDayName(date).slice(0, 3).toUpperCase();
          const hasSlots = slots.length > 0;
          return (
            <div
              key={date}
              className={`flex-1 min-w-0 border-r border-slate-200 last:border-0 px-2 py-3 text-center ${isToday ? "border-t-2 border-t-[#4982CF] bg-[#4982CF]/5" : ""}`}
            >
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dayName}</p>
              <p className={`text-2xl font-bold mt-0.5 leading-none ${isToday ? "text-[#4982CF]" : hasSlots ? "text-slate-800" : "text-slate-300"}`}>
                {dateNum}
              </p>
              <p className="text-xs mt-1 font-medium">
                {hasSlots
                  ? <span className="text-slate-500">{slots.length} slot{slots.length !== 1 ? "s" : ""}</span>
                  : <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-400">Off</span>
                }
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Time-aligned grid body ─────────────────────────────────────────── */}
      <div className="overflow-y-auto max-h-[640px]">
        {allTimes.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">No slots this week</p>
            <p className="text-xs text-slate-300 mt-1">This doctor has no timings configured for any day this week.</p>
          </div>
        ) : (
          allTimes.map(time => {
            const isNowRow = currentTimeRow === time;
            return (
              <div key={time} className={`flex border-b border-slate-200 last:border-0 relative ${isNowRow ? "z-[1]" : ""}`}>
                {/* Current-time indicator — red bar across full row width */}
                {isNowRow && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-red-500 z-10 pointer-events-none" />
                )}

                {/* ── Time-axis label ── */}
                <div className={`w-16 flex-shrink-0 border-r border-slate-200 px-2 py-3 flex items-center justify-end ${isNowRow ? "bg-red-50" : ""}`}>
                  <span className={`text-xs font-semibold font-mono leading-none ${isNowRow ? "text-red-500" : "text-slate-500"}`}>{time}</span>
                </div>

                {/* ── Day cells for this time row ── */}
                {dayData.map(({ date, slots, isToday }) => {
                  const slot = slots.find(s => s.start === time);
                  if (!slot) {
                    // This day has no slot at this time — grey band (off / outside schedule)
                    return (
                      <div
                        key={date}
                        className={`flex-1 min-w-0 min-h-[68px] border-r border-slate-200 last:border-0 ${isToday ? "bg-[#4982CF]/[0.04]" : "bg-slate-100/60"}`}
                      />
                    );
                  }
                  return (
                    <div
                      key={date}
                      className={`flex-1 min-w-0 border-r border-slate-200 last:border-0 min-h-[68px] ${isToday ? "bg-[#4982CF]/[0.05]" : ""}`}
                    >
                      <WeekSlotCell
                        date={date}
                        slot={slot}
                        appointments={appointments}
                        filterTypes={filterTypes}
                        doctorId={doctor.id}
                        onClickSlot={onClickSlot}
                        onClickAppt={onClickAppt}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

interface MonthViewProps {
  date: string;
  doctor: Doctor;
  appointments: Appointment[];
  filterTypes: string[];
  selectedDate: string;
  onSelectDate: (d: string) => void;
}

function MonthView({ date, doctor, appointments, filterTypes, selectedDate, onSelectDate }: MonthViewProps) {
  const cells = useMemo(() => getMonthDays(date), [date]);
  const [y, m] = date.split("-").map(Number);
  const today = todayStr();
  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {DAY_LABELS.map(l => (
          <div key={l} className="py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100 last:border-0">{l}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const inMonth = parseInt(d.split("-")[1]) === m;
          const isToday = d === today;
          const isSelected = d === selectedDate;
          const dayAppts = appointments.filter(a =>
            a.doctorId === doctor.id && a.date === d &&
            (filterTypes.length === 0 || filterTypes.includes(a.type))
          );
          const hasSlots = doctor.timings.some(t => getDayName(d) === t.day);
          return (
            <div
              key={i}
              onClick={() => inMonth && hasSlots && onSelectDate(d)}
              className={`min-h-[80px] border-r border-b border-slate-100 last-of-row:border-r-0 px-2 py-1.5 transition-colors ${!inMonth ? "bg-slate-50/50" : hasSlots ? "cursor-pointer hover:bg-slate-50" : ""} ${isSelected ? "bg-[#4982CF]/5" : ""}`}
            >
              <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-[#4982CF] text-white" : inMonth ? "text-slate-700" : "text-slate-300"}`}>
                {parseInt(d.split("-")[2])}
              </div>
              {inMonth && dayAppts.slice(0, 2).map(a => {
                const sc = STATUS_CONFIG[a.status];
                return (
                  <div key={a.id} className={`text-[9px] font-semibold px-1 py-0.5 rounded mb-0.5 truncate ${sc.bg} ${sc.text}`}>
                    {a.patientName}
                  </div>
                );
              })}
              {inMonth && dayAppts.length > 2 && (
                <div className="text-[9px] text-[#4982CF] font-bold">+{dayAppts.length - 2}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Doctor View (multi-column) ───────────────────────────────────────────────

interface DoctorViewProps {
  doctors: Doctor[];
  date: string;
  appointments: Appointment[];
  filterTypes: string[];
  onClickSlot: (doctorId: string, slot: SlotBlock) => void;
  onClickAppt: (appt: Appointment, e: React.MouseEvent) => void;
}

function DoctorViewPanel({ doctors, date, appointments, filterTypes, onClickSlot, onClickAppt }: DoctorViewProps) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(doctors.length, 4)}, minmax(0, 1fr))` }}>
      {doctors.map(doc => {
        const slots = doc.timings.flatMap(t => generateSlots(t, date));
        const docAppts = appointments.filter(a => a.doctorId === doc.id && a.date === date);
        return (
          <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="font-bold text-slate-900 text-sm">{doc.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{doc.specialties[0] ?? "—"}</p>
              <p className="text-[10px] font-bold text-[#4982CF] mt-0.5">{docAppts.length} booked · {slots.length} slots</p>
            </div>
            {slots.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-300">No schedule today</div>
            ) : (
              slots.map(slot => {
                const slotAppts = docAppts.filter(a => a.slotStart === slot.start);
                return (
                  <SlotRow
                    key={slot.timingId + slot.start}
                    slot={slot}
                    appts={slotAppts}
                    filterTypes={filterTypes}
                    onClickEmpty={() => onClickSlot(doc.id, slot)}
                    onClickAppt={onClickAppt}
                  />
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ViewMode = "day" | "week" | "month";
type LayoutMode = "calendar" | "doctor";

export function AppointmentFrontDesk() {
  const { appointmentDoctors } = useAppointmentDoctors();
  const { appointments, addAppointment, updateAppointment } = useAppointments();
  const { toast } = useToast();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(() => appointmentDoctors[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("calendar");
  const [filterTypes, setFilterTypes] = useState<string[]>([]);

  // Booking drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInitForm, setDrawerInitForm] = useState<Partial<BookingForm>>({});
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);

  // Appointment card
  const [cardState, setCardState] = useState<CardState | null>(null);

  // View drawer (read-only)
  const [viewAppt, setViewAppt] = useState<Appointment | null>(null);

  const selectedDoctor = appointmentDoctors.find(d => d.id === selectedDoctorId) ?? appointmentDoctors[0] ?? null;

  // Appointment type filter chips — scoped to the active doctor in calendar mode,
  // or the union of all doctors' services in doctor-layout mode.
  const allTypes = useMemo(() => {
    const types = new Set<string>();
    if (layoutMode === "doctor") {
      appointmentDoctors.forEach(d => d.services.forEach(s => types.add(s)));
    } else {
      const activeDoc = appointmentDoctors.find(d => d.id === selectedDoctorId);
      (activeDoc?.services ?? []).forEach(s => types.add(s));
    }
    return Array.from(types);
  }, [appointmentDoctors, layoutMode, selectedDoctorId]);

  // Stats
  const stats = useMemo(() => {
    const dayAppts = appointments.filter(a =>
      (layoutMode === "doctor" || a.doctorId === selectedDoctorId) &&
      a.date === selectedDate
    );
    const counts: Record<ApptStatus, number> = {
      booked: 0, confirmed: 0, checked_in: 0, cancelled: 0,
      no_show: 0, rescheduled: 0, checked_out: 0,
    };
    dayAppts.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return { total: dayAppts.length, counts };
  }, [appointments, selectedDoctorId, selectedDate, layoutMode]);

  // Week days (for week view)
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  function navigate(dir: -1 | 1) {
    if (viewMode === "day")   setSelectedDate(d => addDays(d, dir));
    if (viewMode === "week")  setSelectedDate(d => addDays(d, dir * 7));
    if (viewMode === "month") {
      const [y, m] = selectedDate.split("-").map(Number);
      const next = new Date(y, m - 1 + dir, 1);
      setSelectedDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`);
    }
  }

  function openBooking(init: Partial<BookingForm>, edit?: Appointment) {
    setDrawerInitForm(init);
    setEditAppt(edit ?? null);
    setDrawerOpen(true);
  }

  function handleSave(form: BookingForm) {
    // ── Slot-capacity enforcement ──────────────────────────────────────────────
    // Look up allowMultiple from the doctor's timing configuration (source of truth).
    const doctor = appointmentDoctors.find(d => d.id === form.doctorId);
    if (doctor) {
      const slots = doctor.timings.flatMap(t => generateSlots(t, form.date));
      const matchSlot = slots.find(s => s.start === form.slotStart);
      if (matchSlot && !matchSlot.allowMultiple) {
        // Count existing, non-cancelled appointments in this slot (exclude the one being edited).
        const conflict = appointments.filter(a =>
          a.doctorId === form.doctorId &&
          a.date     === form.date &&
          a.slotStart === form.slotStart &&
          a.status !== "cancelled" &&
          a.status !== "no_show" &&
          (!editAppt || a.id !== editAppt.id)
        );
        if (conflict.length > 0) {
          toast({
            title: "Slot unavailable",
            description: "This slot only allows one booking. Please choose a different time.",
            variant: "destructive",
          });
          return;
        }
      }
    }
    // ── Persist ───────────────────────────────────────────────────────────────
    if (editAppt) {
      updateAppointment(editAppt.id, { ...form });
      toast({ title: "Appointment updated", description: `${form.patientName} — ${form.slotStart}` });
    } else {
      const appt: Appointment = {
        id: uid(),
        ...form,
        status: "booked",
        createdAt: new Date().toISOString(),
      };
      addAppointment(appt);
      toast({ title: "Appointment booked", description: `${form.patientName} — ${form.slotStart}` });
    }
    setDrawerOpen(false);
    setEditAppt(null);
  }

  function handleApptClick(appt: Appointment, e: React.MouseEvent) {
    e.stopPropagation();
    setCardState({ appt, x: e.clientX + 10, y: e.clientY - 10 });
  }

  function dateLabel() {
    if (viewMode === "day")   return formatDateFull(selectedDate);
    if (viewMode === "week") {
      const [first, last] = [weekDays[0], weekDays[6]];
      return `${formatDateShort(first)} – ${formatDateShort(last)}`;
    }
    const [y, m] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function toggleType(t: string) {
    setFilterTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  const STAT_ITEMS: { key: ApptStatus; short: string }[] = [
    { key: "booked",      short: "Booked"      },
    { key: "confirmed",   short: "Confirmed"   },
    { key: "checked_in",  short: "Checked In"  },
    { key: "cancelled",   short: "Cancelled"   },
    { key: "no_show",     short: "No Show"     },
    { key: "checked_out", short: "Checked Out" },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <QueueAppHeader />

      {/* Control Bar */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3 flex-wrap shadow-sm">
        {/* Doctor selector (only in calendar mode) */}
        {layoutMode === "calendar" && (
          <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
            <SelectTrigger className="h-9 w-52 text-sm border-slate-200">
              <Stethoscope className="h-3.5 w-3.5 text-[#4982CF] mr-1.5 flex-shrink-0" />
              <SelectValue placeholder="Select doctor..." />
            </SelectTrigger>
            <SelectContent>
              {appointmentDoctors.length === 0 && (
                <SelectItem value="__none" disabled>No appointment doctors</SelectItem>
              )}
              {appointmentDoctors.map(d => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date navigation */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-3 py-2 text-sm font-semibold text-slate-700 min-w-[220px] text-center">
            {dateLabel()}
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs font-semibold text-slate-500 hover:text-slate-700"
            onClick={() => setSelectedDate(todayStr())}
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Today
          </Button>
        </div>

        {/* View mode */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {(["day", "week", "month"] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 text-xs font-bold capitalize transition-colors border-r border-slate-200 last:border-0 ${viewMode === v ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Layout mode */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            onClick={() => setLayoutMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-r border-slate-200 transition-colors ${layoutMode === "calendar" ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <Calendar className="h-3.5 w-3.5" /> Calendar
          </button>
          <button
            onClick={() => setLayoutMode("doctor")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${layoutMode === "doctor" ? "bg-[#4982CF] text-white" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <Columns2 className="h-3.5 w-3.5" /> Doctor
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-slate-500 hover:text-slate-700"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            className="h-9 bg-[#4982CF] hover:bg-[#3D73BC] text-white text-sm gap-2"
            onClick={() => openBooking({ doctorId: selectedDoctorId, date: selectedDate })}
          >
            <Plus className="h-4 w-4" /> Quick Add
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-slate-100 px-5 py-2.5 flex items-center gap-1 flex-wrap">
        <div className="flex items-center gap-1.5 mr-3">
          <div className="h-7 w-7 rounded-full bg-[#4982CF]/10 flex items-center justify-center">
            <Calendar className="h-3.5 w-3.5 text-[#4982CF]" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400 ml-1">Total</span>
          </div>
        </div>
        <div className="h-4 w-px bg-slate-200 mr-3" />
        {STAT_ITEMS.map(({ key, short }) => {
          const sc = STATUS_CONFIG[key];
          const count = stats.counts[key];
          return (
            <div key={key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${sc.bg} ${count > 0 ? sc.text : "opacity-40"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
              {count} {short}
            </div>
          );
        })}
      </div>

      {/* Filter Chips */}
      {allTypes.length > 0 && (
        <div className="bg-white border-b border-slate-100 px-5 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
          {allTypes.map(t => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${filterTypes.includes(t) ? "bg-[#4982CF] text-white border-[#4982CF]" : "bg-white text-slate-500 border-slate-200 hover:border-[#4982CF]"}`}
            >
              {t}
            </button>
          ))}
          {filterTypes.length > 0 && (
            <button onClick={() => setFilterTypes([])} className="text-xs text-slate-400 hover:text-slate-600 ml-1 flex items-center gap-0.5">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto px-5 py-5">
        {appointmentDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Stethoscope className="h-12 w-12 text-slate-200 mb-4" />
            <p className="text-lg font-bold text-slate-400">No appointment doctors configured</p>
            <p className="text-sm text-slate-300 mt-1">Go to Admin → Doctors and add doctors with type "Appointment".</p>
          </div>
        ) : layoutMode === "doctor" ? (
          <DoctorViewPanel
            doctors={appointmentDoctors}
            date={selectedDate}
            appointments={appointments}
            filterTypes={filterTypes}
            onClickSlot={(doctorId, slot) => openBooking({ doctorId, date: selectedDate, slotStart: slot.start, slotEnd: slot.end })}
            onClickAppt={handleApptClick}
          />
        ) : !selectedDoctor ? (
          <div className="text-center py-20 text-slate-400">Select a doctor to view their calendar.</div>
        ) : viewMode === "day" ? (
          <DayView
            doctor={selectedDoctor}
            date={selectedDate}
            appointments={appointments}
            filterTypes={filterTypes}
            onClickSlot={slot => openBooking({ doctorId: selectedDoctor.id, date: selectedDate, slotStart: slot.start, slotEnd: slot.end })}
            onClickAppt={handleApptClick}
          />
        ) : viewMode === "week" ? (
          <WeekView
            doctor={selectedDoctor}
            weekDays={weekDays}
            appointments={appointments}
            filterTypes={filterTypes}
            onClickSlot={(date, slot) => {
              setSelectedDate(date);
              openBooking({ doctorId: selectedDoctor.id, date, slotStart: slot.start, slotEnd: slot.end });
            }}
            onClickAppt={handleApptClick}
          />
        ) : (
          <MonthView
            date={selectedDate}
            doctor={selectedDoctor}
            appointments={appointments}
            filterTypes={filterTypes}
            selectedDate={selectedDate}
            onSelectDate={d => { setSelectedDate(d); setViewMode("day"); }}
          />
        )}
      </div>

      {/* Booking Drawer */}
      {drawerOpen && (
        <BookingDrawer
          doctors={appointmentDoctors}
          init={drawerInitForm}
          editAppt={editAppt}
          onSave={handleSave}
          onClose={() => { setDrawerOpen(false); setEditAppt(null); }}
        />
      )}

      {/* Appointment Card */}
      {cardState && (
        <AppointmentCard
          state={cardState}
          onClose={() => setCardState(null)}
          onView={appt => setViewAppt(appt)}
          onEdit={appt => openBooking({}, appt)}
          onStatusChange={(id, status) => {
            updateAppointment(id, { status });
            toast({ title: "Status updated", description: STATUS_CONFIG[status].label });
          }}
          onInvoice={() => {
            setCardState(null);
            toast({ title: "Invoice", description: "Invoice generation coming soon." });
          }}
        />
      )}

      {/* View Drawer (read-only) */}
      {viewAppt && (
        <ViewDrawer
          appt={viewAppt}
          doctorName={appointmentDoctors.find(d => d.id === viewAppt.doctorId)?.name ?? "Unknown Doctor"}
          onClose={() => setViewAppt(null)}
          onEdit={() => { openBooking({}, viewAppt); setViewAppt(null); }}
        />
      )}
    </div>
  );
}
