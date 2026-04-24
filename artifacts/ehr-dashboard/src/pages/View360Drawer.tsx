import {
  Activity, X, Maximize2, Minimize2, BarChart2,
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
function shortDate(signedAt: string) { return signedAt.split(",")[0].split(" ").slice(0, 2).join(" "); }

// ─── Data derived from SOAP_DUMMY ─────────────────────────────────────────────

const VITALS_TREND = [...SOAP_DUMMY].reverse().map(r => {
  const { systolic, diastolic } = parseBP(r.vitals.bp);
  return { date: shortDate(r.signedAt), systolic, diastolic, pulse: Number(r.vitals.pulse), o2: Number(r.vitals.spo2) };
});

const MED_CATEGORY_DATA = [
  { name: "Hypertension", value: 2, color: "#4982CF" },
  { name: "Diabetes",     value: 2, color: "#ef4444" },
  { name: "Supplements",  value: 1, color: "#10b981" },
];

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

// ─── View360Drawer ────────────────────────────────────────────────────────────

interface View360DrawerProps {
  entry:               MultiEntry;
  fullscreen:          boolean;
  onToggleFullscreen:  () => void;
  onClose:             () => void;
}

export function View360Drawer({ entry, fullscreen, onToggleFullscreen, onClose }: View360DrawerProps) {
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

        </div>
      </div>
    </>
  );
}
