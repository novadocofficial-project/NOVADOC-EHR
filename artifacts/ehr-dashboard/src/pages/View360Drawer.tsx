import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Eye, Activity, Heart, Thermometer, Droplets, User,
  Stethoscope, ClipboardList, FileText, FlaskConical,
  FolderOpen, CalendarDays, X, Maximize2, Minimize2,
  ChevronDown, BarChart2,
} from "lucide-react";
import { SOAP_DUMMY } from "@/data/soapDummy";
import { MultiEntry } from "@/hooks/useMultiStepQueue";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ─── Accent ───────────────────────────────────────────────────────────────────

const ACCENT = "#4982CF";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBP(bp: string) {
  const [s, d] = bp.split("/").map(Number);
  return { systolic: s || 0, diastolic: d || 0 };
}
function longDate(signedAt: string)  { return signedAt.split(",")[0]; }
function shortDate(signedAt: string) { return signedAt.split(",")[0].split(" ").slice(0, 2).join(" "); }
function visitTime(signedAt: string) { return signedAt.split(", ")[1] ?? ""; }

// ─── Data derived from SOAP_DUMMY ─────────────────────────────────────────────

const VITALS_TREND = [...SOAP_DUMMY].reverse().map(r => {
  const { systolic, diastolic } = parseBP(r.vitals.bp);
  return { date: shortDate(r.signedAt), systolic, diastolic, pulse: Number(r.vitals.pulse), o2: Number(r.vitals.spo2) };
});

const _v = SOAP_DUMMY[0].vitals;
const VITALS_TODAY = [
  { label: "BP",     value: _v.bp,                       unit: "mmHg", icon: Activity,    color: "#4982CF" },
  { label: "Pulse",  value: _v.pulse,                    unit: "bpm",  icon: Heart,       color: "#ef4444" },
  { label: "Temp",   value: _v.temp,                     unit: "°C",   icon: Thermometer, color: "#f59e0b" },
  { label: "O₂ Sat", value: _v.spo2 + "%",               unit: "SpO₂", icon: Droplets,    color: "#10b981" },
  { label: "Weight", value: _v.weight.replace(" kg", ""), unit: "kg",   icon: User,        color: "#8b5cf6" },
];

const PRESENTING_COMPLAINTS = SOAP_DUMMY.map(r => ({
  date:      longDate(r.signedAt),
  time:      visitTime(r.signedAt),
  complaint: r.cc.join(", "),
  by:        r.signedBy,
}));

const PHYSICAL_EXAMS = SOAP_DUMMY.map(r => ({
  date:   longDate(r.signedAt),
  time:   visitTime(r.signedAt),
  doctor: r.signedBy,
  notes:  r.pe[0] ?? "",
}));

const DIAGNOSES = SOAP_DUMMY.map(r => {
  const top   = r.diagnoses[0];
  const parts = longDate(r.signedAt).split(" ");
  return {
    date:    longDate(r.signedAt),
    code:    top.code,
    problem: top.name.replace(/ —.*$/, ""),
    start:   parts.slice(1).join(" "),
  };
});

const INVESTIGATIONS = SOAP_DUMMY
  .filter(r => r.labs.length > 0)
  .map(r => ({ date: longDate(r.signedAt), type: r.labs[0], advisor: r.signedBy }));

const DOCUMENTS = [
  { date: longDate(SOAP_DUMMY[0].signedAt), folder: "Lab Results",   desc: "CBC, CRP/ESR, Throat swab C&S" },
  { date: longDate(SOAP_DUMMY[1].signedAt), folder: "Cardiology",    desc: "ECG strip & ABPM report"       },
  { date: longDate(SOAP_DUMMY[2].signedAt), folder: "Ophthalmology", desc: "Fundus photography report"     },
];

const PREVIOUS_VISITS = SOAP_DUMMY.map(r => ({
  type:   r.cc.slice(0, 2).join(", "),
  doctor: r.signedBy,
  date:   longDate(r.signedAt),
}));

const MED_CATEGORY_DATA = [
  { name: "Hypertension", value: 2, color: "#4982CF" },
  { name: "Diabetes",     value: 2, color: "#ef4444" },
  { name: "Supplements",  value: 1, color: "#10b981" },
];

// ─── Visit data for Presenting Complaints sub-drawer ─────────────────────────

interface VisitRecord {
  date:       string;
  time:       string;
  doctor:     string;
  visitType:  string;
  hpi:        string;
  complaints: { name: string; priority: number }[];
}

const VISIT_COMPLAINTS: VisitRecord[] = SOAP_DUMMY.map(r => {
  const [datePart, timePart] = r.signedAt.split(", ");
  return {
    date:       datePart ?? "",
    time:       timePart ?? "",
    doctor:     r.signedBy,
    visitType:  "OPD",
    hpi:        r.hpi,
    complaints: r.cc.map((name, i) => ({ name, priority: i + 1 })),
  };
});

// ─── Presenting Complaints sub-drawer (portal) ────────────────────────────────

function PresentingComplaintsDrawer({ onClose }: { onClose: () => void }) {
  const [fullscreen,  setFullscreen]  = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return createPortal(
    <>
      {!fullscreen && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-[1px] z-[9900]"
          onClick={onClose}
        />
      )}

      <div className={[
        "fixed top-0 right-0 h-full bg-white shadow-2xl flex flex-col z-[9901] transition-all duration-300",
        fullscreen ? "w-full" : "w-1/2 border-l border-slate-200",
      ].join(" ")}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f59e0b18" }}>
            <ClipboardList className="h-4 w-4" style={{ color: "#f59e0b" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Record</p>
            <p className="text-sm font-black text-slate-800">Presenting Complaints</p>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: "#f59e0b" }}>
            {VISIT_COMPLAINTS.length} visits
          </span>
          <button
            onClick={() => setFullscreen(f => !f)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sub-header */}
        <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 flex-shrink-0">
          <p className="text-[10px] text-amber-700 font-semibold">
            Sorted most recent first · Priority order preserved per visit · Click a visit to expand
          </p>
        </div>

        {/* Visit cards */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {VISIT_COMPLAINTS.map((visit, i) => {
            const isExpanded = expandedIdx === i;
            const extraCount = visit.complaints.length - 1;
            const primary    = visit.complaints[0];
            const [day, month, year] = visit.date.split(" ");

            return (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">
                  <div className="w-16 flex-shrink-0 text-center">
                    <p className="text-xs font-black text-slate-800 leading-tight">{day} {month}</p>
                    <p className="text-[10px] text-slate-400">{year}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{visit.time}</p>
                  </div>
                  <div className="w-px self-stretch bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: "#f59e0b" }}>
                        {visit.visitType}
                      </span>
                      <span className="text-[10px] text-slate-500">{visit.doctor}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {primary && <span className="text-xs font-bold text-slate-800">{primary.name}</span>}
                      {!isExpanded && extraCount > 0 && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                          +{extraCount} more
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {visit.complaints.length} complaint{visit.complaints.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-4 space-y-4">
                    <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1.5">History of Present Illness</p>
                      <p className="text-[11px] text-blue-800 leading-relaxed">{visit.hpi}</p>
                    </div>
                    <div className="space-y-2.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Complaint Priority</p>
                      {visit.complaints.map((c, j) => (
                        <div key={j} className="flex items-start gap-3 bg-white rounded-xl border border-slate-100 px-3.5 py-3 shadow-sm">
                          <span
                            className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: j === 0 ? "#f59e0b" : "#94a3b8" }}>
                            {c.priority}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800">{c.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 italic">
                              {j === 0 ? "Primary complaint — detailed in HPI above" : "Associated presenting complaint"}
                            </p>
                          </div>
                          {j === 0 && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0 self-start">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── Vitals Tooltip ───────────────────────────────────────────────────────────

function VitalsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800">{p.value}{p.dataKey === "o2" ? "%" : ""}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title, icon, badge, children, accentColor = ACCENT, onViewAll,
}: {
  title: string; icon: React.ReactNode; badge?: number;
  children: React.ReactNode; accentColor?: string; onViewAll?: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-slate-100"
        style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}>
        <div className="flex items-center gap-2">
          <span style={{ color: accentColor }}>{icon}</span>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          {badge !== undefined && (
            <span
              className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: accentColor }}>
              {badge}
            </span>
          )}
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
          <Eye className="h-3 w-3" /> View All
        </button>
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}

function ActionRow({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-slate-50 last:border-0 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 leading-tight truncate">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── View360Drawer ────────────────────────────────────────────────────────────

interface View360DrawerProps {
  entry:               MultiEntry;
  fullscreen:          boolean;
  onToggleFullscreen:  () => void;
  onClose:             () => void;
}

export function View360Drawer({ entry, fullscreen, onToggleFullscreen, onClose }: View360DrawerProps) {
  const [showComplaintsDrawer, setShowComplaintsDrawer] = useState(false);

  const name = entry.patient?.name ?? "Walk-in Patient";

  return (
    <>
      {/* Backdrop */}
      {!fullscreen && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-30" />
      )}

      {/* Drawer panel */}
      <div className={[
        "absolute top-0 right-0 h-full bg-white shadow-2xl flex flex-col z-40 transition-all duration-300",
        fullscreen ? "inset-0 w-full" : "w-1/2 border-l border-slate-200",
      ].join(" ")}>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-shrink-0 bg-white">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
            <BarChart2 className="h-4 w-4" style={{ color: ACCENT }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consultation Overview</p>
            <p className="text-sm font-black text-slate-800">360 View</p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: ACCENT }}>
            {name}
          </span>
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
            title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">

          {/* ── Vitals strip ── */}
          <div className="flex gap-2 flex-wrap">
            {VITALS_TODAY.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 shadow-sm px-3 py-2 flex-1 min-w-[90px]">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${v.color}15` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: v.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">{v.label}</p>
                    <p className="text-xs font-black text-slate-800 leading-tight">{v.value}</p>
                    <p className="text-[9px] text-slate-400">{v.unit}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Vitals trend + Medication donut ── */}
          <div className="grid grid-cols-12 gap-4">

            {/* Vitals trend — 7 cols */}
            <div className="col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div
                className="flex items-center gap-2 px-4 py-3 border-b border-slate-100"
                style={{ borderLeftColor: ACCENT, borderLeftWidth: 3 }}>
                <Activity className="h-4 w-4" style={{ color: ACCENT }} />
                <p className="text-sm font-bold text-slate-800">Vitals Trend</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: ACCENT }}>
                  3 visits
                </span>
              </div>
              <div className="p-3">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={VITALS_TREND} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} domain={[60, 170]} />
                    <Tooltip content={<VitalsTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                    <Line name="Systolic" type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                    <Line name="Diastolic" type="monotone" dataKey="diastolic" stroke="#4982CF" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                    <Line name="Pulse" type="monotone" dataKey="pulse" stroke="#10b981" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                    <Line name="O₂%" type="monotone" dataKey="o2" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2.5 }} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Medication donut — 5 cols */}
            <div className="col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div
                className="flex items-center gap-2 px-4 py-3 border-b border-slate-100"
                style={{ borderLeftColor: "#10b981", borderLeftWidth: 3 }}>
                <p className="text-sm font-bold text-slate-800">Medications</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-emerald-500">
                  by category
                </span>
              </div>
              <div className="p-3 flex flex-col items-center">
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie
                      data={MED_CATEGORY_DATA}
                      cx="50%" cy="50%"
                      innerRadius={28} outerRadius={44}
                      dataKey="value" paddingAngle={3}>
                      {MED_CATEGORY_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any, n: any) => [v, n]} contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-1 mt-1">
                  {MED_CATEGORY_DATA.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] text-slate-600 flex-1">{d.name}</span>
                      <span className="text-[10px] font-bold text-slate-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 1: Presenting Complaint + Physical Exam + Diagnosis ── */}
          <div className="grid grid-cols-3 gap-4">
            <SectionCard
              title="Presenting Complaint"
              icon={<ClipboardList className="h-4 w-4" />}
              badge={PRESENTING_COMPLAINTS.length}
              accentColor="#f59e0b"
              onViewAll={() => setShowComplaintsDrawer(true)}>
              {PRESENTING_COMPLAINTS.map((pc, i) => (
                <ActionRow key={i}
                  label={pc.complaint}
                  sub={`${pc.date} · ${pc.time} · ${pc.by}`}
                />
              ))}
            </SectionCard>

            <SectionCard
              title="Physical Examination"
              icon={<Stethoscope className="h-4 w-4" />}
              badge={PHYSICAL_EXAMS.length}>
              {PHYSICAL_EXAMS.map((pe, i) => (
                <ActionRow key={i}
                  label={pe.doctor}
                  sub={`${pe.date} · ${pe.notes.slice(0, 40)}${pe.notes.length > 40 ? "…" : ""}`}
                />
              ))}
            </SectionCard>

            <SectionCard
              title="Diagnosis"
              icon={<FileText className="h-4 w-4" />}
              badge={DIAGNOSES.length}
              accentColor="#ef4444">
              {DIAGNOSES.map((d, i) => (
                <ActionRow key={i}
                  label={d.problem}
                  sub={`${d.code} · Since ${d.start} · ${d.date}`}
                />
              ))}
            </SectionCard>
          </div>

          {/* ── Row 2: Investigations + Documents + Previous Visits ── */}
          <div className="grid grid-cols-3 gap-4">
            <SectionCard
              title="Investigations"
              icon={<FlaskConical className="h-4 w-4" />}
              badge={INVESTIGATIONS.length}
              accentColor="#06b6d4">
              {INVESTIGATIONS.map((inv, i) => (
                <ActionRow key={i}
                  label={inv.type}
                  sub={`${inv.date} · ${inv.advisor}`}
                />
              ))}
            </SectionCard>

            <SectionCard
              title="Documents"
              icon={<FolderOpen className="h-4 w-4" />}
              badge={DOCUMENTS.length}
              accentColor="#f59e0b">
              {DOCUMENTS.map((d, i) => (
                <ActionRow key={i}
                  label={d.folder}
                  sub={`${d.desc} · ${d.date}`}
                />
              ))}
            </SectionCard>

            <SectionCard
              title="Previous Visits"
              icon={<CalendarDays className="h-4 w-4" />}
              badge={PREVIOUS_VISITS.length}
              accentColor="#8b5cf6">
              {PREVIOUS_VISITS.map((v, i) => (
                <ActionRow key={i}
                  label={v.type}
                  sub={`${v.doctor} · ${v.date}`}
                />
              ))}
            </SectionCard>
          </div>

        </div>
      </div>

      {/* Presenting Complaints sub-drawer */}
      {showComplaintsDrawer && (
        <PresentingComplaintsDrawer onClose={() => setShowComplaintsDrawer(false)} />
      )}
    </>
  );
}
