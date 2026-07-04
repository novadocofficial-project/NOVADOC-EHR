import { useState } from "react";
import {
  GripVertical, Save, Plus, X, CheckCircle2,
  FlaskConical, ClipboardList, Activity, Stethoscope,
  FileText, Pill, Image, Heart, BookOpen, Target,
  BookMarked, Users, RotateCcw, ChevronDown, Microscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Department } from "@/pages/AdminSettings";

// ─── Types ────────────────────────────────────────────────────────────────────

type Visibility = "required" | "optional" | "hidden";

export interface SoapSection {
  id:           string;
  label:        string;
  defaultLabel: string;
  icon:         React.ElementType;
  visibility:   Visibility;
  active:       boolean;
}

export interface VitalConfig {
  id:      string;
  name:    string;
  unit:    string;
  custom:  boolean;
  opd:     "required" | "optional" | "skip";
  consult: "required" | "optional" | "skip";
  followup:"required" | "optional" | "skip";
  emergency:"required"| "optional" | "skip";
  refMin:  string;
  refMax:  string;
  color:   string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const DEFAULT_SECTIONS: Omit<SoapSection, "visibility" | "active">[] = [
  { id: "chief-complaints", label: "Chief Complaints",  defaultLabel: "Chief Complaints",  icon: ClipboardList  },
  { id: "hpi",              label: "History of Present Illness", defaultLabel: "History of Present Illness", icon: BookOpen },
  { id: "allergies",        label: "Allergies",          defaultLabel: "Allergies",          icon: Heart          },
  { id: "medical-history",  label: "Medical History",    defaultLabel: "Medical History",    icon: FileText       },
  { id: "ros",              label: "Review of Systems",  defaultLabel: "Review of Systems",  icon: ClipboardList  },
  { id: "vitals",           label: "Vitals",             defaultLabel: "Vitals",             icon: Activity       },
  { id: "physical-exam",   label: "Physical Examination",defaultLabel: "Physical Examination",icon: Stethoscope   },
  { id: "poc-labs",         label: "POC Labs",           defaultLabel: "POC Labs",           icon: FlaskConical   },
  { id: "diagnosis",        label: "Diagnosis",          defaultLabel: "Diagnosis",          icon: Microscope     },
  { id: "labs",             label: "Labs",               defaultLabel: "Labs",               icon: FlaskConical   },
  { id: "imaging",          label: "Imaging",            defaultLabel: "Imaging",            icon: Image          },
  { id: "formulary",        label: "Formulary",          defaultLabel: "Formulary",          icon: Pill           },
  { id: "procedures",       label: "Procedures",         defaultLabel: "Procedures",         icon: Stethoscope    },
  { id: "care-plan",        label: "Care Plan",          defaultLabel: "Care Plan",          icon: BookMarked     },
  { id: "referrals",        label: "Referrals",          defaultLabel: "Referrals",          icon: Users          },
  { id: "patient-goals",   label: "Patient Goals",       defaultLabel: "Patient Goals",      icon: Target         },
  { id: "health-ed",        label: "Health Education",   defaultLabel: "Health Education",   icon: BookOpen       },
];

function makeDefaultSections(): SoapSection[] {
  return DEFAULT_SECTIONS.map(s => ({
    ...s,
    visibility: s.id === "vitals" || s.id === "chief-complaints" || s.id === "hpi" ? "required" : "optional",
    active: true,
  }));
}

const SECTION_ICON_MAP = new Map(DEFAULT_SECTIONS.map(s => [s.id, s.icon]));

/** JSON cannot serialize functions; restore icon refs after parsing from localStorage. */
function hydrateIcons(secs: SoapSection[]): SoapSection[] {
  return secs.map(s => ({
    ...s,
    icon: (typeof s.icon === "function" ? s.icon : null) ?? SECTION_ICON_MAP.get(s.id) ?? FileText,
  }));
}

const DEFAULT_VITALS: VitalConfig[] = [
  { id: "bp",     name: "Blood Pressure", unit: "mmHg",  custom: false, opd: "required", consult: "required", followup: "required",  emergency: "required",  refMin: "90/60",  refMax: "140/90", color: "#4982CF" },
  { id: "pulse",  name: "Pulse",          unit: "bpm",   custom: false, opd: "required", consult: "required", followup: "required",  emergency: "required",  refMin: "60",     refMax: "100",    color: "#ef4444" },
  { id: "temp",   name: "Temperature",    unit: "°F",    custom: false, opd: "required", consult: "optional", followup: "optional",  emergency: "required",  refMin: "97.0",   refMax: "99.0",   color: "#f59e0b" },
  { id: "spo2",   name: "SpO₂",           unit: "%",     custom: false, opd: "required", consult: "optional", followup: "optional",  emergency: "required",  refMin: "95",     refMax: "100",    color: "#10b981" },
  { id: "weight", name: "Weight",         unit: "kg",    custom: false, opd: "optional", consult: "optional", followup: "optional",  emergency: "optional",  refMin: "",       refMax: "",       color: "#8b5cf6" },
  { id: "height", name: "Height",         unit: "cm",    custom: false, opd: "optional", consult: "optional", followup: "skip",      emergency: "skip",      refMin: "",       refMax: "",       color: "#64748b" },
  { id: "bmi",    name: "BMI",            unit: "kg/m²", custom: false, opd: "optional", consult: "optional", followup: "optional",  emergency: "skip",      refMin: "18.5",   refMax: "24.9",   color: "#0ea5e9" },
  { id: "pain",   name: "Pain Score",     unit: "/10",   custom: false, opd: "optional", consult: "optional", followup: "optional",  emergency: "required",  refMin: "0",      refMax: "3",      color: "#f43f5e" },
];

export const VITALS_STORAGE_KEY    = "ehr-vitals-config-v1";
export const NOTE_STRUCTURE_KEY    = "ehr-note-structure-v1";

export function loadNoteStructure(specialty = "general"): SoapSection[] {
  try {
    const raw = localStorage.getItem(NOTE_STRUCTURE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, SoapSection[]>;
      const secs = parsed[specialty] ?? parsed["general"];
      if (Array.isArray(secs) && secs.length > 0) return hydrateIcons(secs);
    }
  } catch { /**/ }
  return makeDefaultSections();
}

export function loadVitalsConfig(): VitalConfig[] {
  try {
    const raw = localStorage.getItem(VITALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VitalConfig[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /**/ }
  return DEFAULT_VITALS;
}

const VISIT_TYPES = [
  { key: "opd" as const,       label: "OPD"       },
  { key: "consult" as const,   label: "Consult"   },
  { key: "followup" as const,  label: "Follow-up" },
  { key: "emergency" as const, label: "Emergency" },
];

const VIS_OPTIONS: { value: Visibility; label: string; color: string }[] = [
  { value: "required", label: "Required", color: "bg-blue-100 text-blue-700 border-blue-200"  },
  { value: "optional", label: "Optional", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "hidden",   label: "Hidden",   color: "bg-red-50 text-red-500 border-red-200"      },
];

const REQ_OPTIONS: { value: "required" | "optional" | "skip"; label: string; color: string }[] = [
  { value: "required", label: "Required", color: "text-blue-700 bg-blue-50"  },
  { value: "optional", label: "Optional", color: "text-slate-600 bg-slate-100" },
  { value: "skip",     label: "Skip",     color: "text-slate-400 bg-slate-50"  },
];

const PALETTE = [
  "#4982CF","#ef4444","#f59e0b","#10b981","#8b5cf6",
  "#64748b","#0ea5e9","#f43f5e","#06b6d4","#84cc16",
];

// ─── Helper components ────────────────────────────────────────────────────────

function VisBadge({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  const [open, setOpen] = useState(false);
  const current = VIS_OPTIONS.find(o => o.value === value)!;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${current.color} transition-colors`}>
        {current.label} <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden min-w-[110px]">
          {VIS_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[11px] font-bold hover:bg-slate-50 transition-colors ${o.value === value ? "bg-slate-50" : ""}`}>
              <span className={`px-1.5 py-0.5 rounded-full border text-[10px] ${o.color}`}>{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReqCell({
  value, onChange,
}: {
  value: "required" | "optional" | "skip";
  onChange: (v: "required" | "optional" | "skip") => void;
}) {
  const opts = REQ_OPTIONS;
  const idx   = opts.findIndex(o => o.value === value);
  const next  = opts[(idx + 1) % opts.length];
  const cur   = opts[idx];
  return (
    <button
      onClick={() => onChange(next.value)}
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors w-full ${cur.color}`}>
      {cur.label}
    </button>
  );
}

// ─── Note Structure Panel ─────────────────────────────────────────────────────

interface NoteStructurePanelProps {
  departments: Department[];
}

function NoteStructurePanel({ departments }: NoteStructurePanelProps) {
  const allSpecialties = [
    { id: "general", name: "General (All)" },
    ...departments.flatMap(d => d.specialties.map(s => ({ id: s.id, name: s.name }))),
  ];

  const [selectedSpecialty, setSelectedSpecialty] = useState("general");
  const [configMap, setConfigMap] = useState<Record<string, SoapSection[]>>(() => {
    try {
      const raw = localStorage.getItem(NOTE_STRUCTURE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, SoapSection[]>;
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          for (const key of Object.keys(parsed)) {
            parsed[key] = hydrateIcons(parsed[key]);
          }
          if (!parsed.general) parsed.general = makeDefaultSections();
          return parsed;
        }
      }
    } catch { /**/ }
    return { general: makeDefaultSections() };
  });
  const [saved, setSaved] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const sections = configMap[selectedSpecialty] ?? makeDefaultSections();

  function setSections(next: SoapSection[]) {
    setConfigMap(m => ({ ...m, [selectedSpecialty]: next }));
    setSaved(false);
  }

  function updateSection(idx: number, patch: Partial<SoapSection>) {
    const next = sections.map((s, i) => i === idx ? { ...s, ...patch } : s);
    setSections(next);
  }

  function resetSection(idx: number) {
    const s = sections[idx];
    updateSection(idx, { label: s.defaultLabel });
  }

  function handleDragStart(i: number) { setDragIndex(i); }
  function handleDragOver(e: React.DragEvent, i: number) { e.preventDefault(); setDropIndex(i); }
  function handleDrop() {
    if (dragIndex === null || dropIndex === null || dragIndex === dropIndex) {
      setDragIndex(null); setDropIndex(null); return;
    }
    const next = [...sections];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, moved);
    setSections(next);
    setDragIndex(null); setDropIndex(null);
  }

  function handleSpecialtyChange(id: string) {
    setSelectedSpecialty(id);
    if (!configMap[id]) {
      setConfigMap(m => ({ ...m, [id]: makeDefaultSections() }));
    }
    setSaved(false);
  }

  function handleSave() {
    try { localStorage.setItem(NOTE_STRUCTURE_KEY, JSON.stringify(configMap)); } catch { /**/ }
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      {/* Specialty selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Configure for</label>
        <select
          value={selectedSpecialty}
          onChange={e => handleSpecialtyChange(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#4982CF]/30 text-slate-700">
          {allSpecialties.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400">
          {selectedSpecialty === "general" ? "Changes apply to all specialties unless overridden" : "Overrides the general config for this specialty"}
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><GripVertical className="h-3 w-3" /> Drag to reorder</span>
        <span className="w-px h-3 bg-slate-200" />
        <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-bold">Required</span>
        <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold">Optional</span>
        <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200 font-bold">Hidden</span>
      </div>

      {/* Section rows */}
      <div className="space-y-1.5">
        {sections.map((sec, i) => {
          const Icon = sec.icon;
          const isDragOver = dropIndex === i && dragIndex !== i;
          return (
            <div
              key={sec.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={e => handleDragOver(e, i)}
              onDrop={handleDrop}
              onDragEnd={() => { setDragIndex(null); setDropIndex(null); }}
              className={[
                "flex items-center gap-3 bg-white rounded-xl border px-3 py-2.5 shadow-sm transition-all",
                isDragOver ? "border-[#4982CF] border-dashed ring-1 ring-[#4982CF]/30" : "border-slate-100",
                dragIndex === i ? "opacity-40" : "",
              ].join(" ")}>
              {/* Drag handle */}
              <GripVertical className="h-4 w-4 text-slate-300 flex-shrink-0 cursor-grab active:cursor-grabbing" />

              {/* Number */}
              <span className="text-[10px] font-black text-slate-300 w-4 text-center flex-shrink-0">{i + 1}</span>

              {/* Icon */}
              <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                <Icon className="h-3.5 w-3.5 text-slate-400" />
              </div>

              {/* Label input */}
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <input
                  type="text"
                  value={sec.label}
                  onChange={e => updateSection(i, { label: e.target.value })}
                  className="flex-1 text-xs font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#4982CF] focus:outline-none py-0.5 transition-colors min-w-0"
                />
                {sec.label !== sec.defaultLabel && (
                  <button
                    onClick={() => resetSection(i)}
                    title="Reset to default"
                    className="p-0.5 rounded text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0">
                    <RotateCcw className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Visibility */}
              <VisBadge
                value={sec.visibility}
                onChange={v => updateSection(i, { visibility: v })}
              />

              {/* Active toggle */}
              <Switch
                checked={sec.active}
                onCheckedChange={v => updateSection(i, { active: v })}
                className="data-[state=checked]:bg-[#4982CF] flex-shrink-0"
              />
            </div>
          );
        })}
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between pt-2">
        {saved ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Configuration saved
          </span>
        ) : <span />}
        <Button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-[#4982CF] hover:bg-[#3b6bb5] text-white text-sm">
          <Save className="h-3.5 w-3.5" /> Save Configuration
        </Button>
      </div>
    </div>
  );
}

// ─── Vitals Configuration Panel ───────────────────────────────────────────────

export function VitalsConfigPanel() {
  const [vitals, setVitals] = useState<VitalConfig[]>(() => loadVitalsConfig());
  const [saved, setSaved]   = useState(false);

  function updateVital(id: string, patch: Partial<VitalConfig>) {
    setVitals(vs => vs.map(v => v.id === id ? { ...v, ...patch } : v));
    setSaved(false);
  }

  function handleSave() {
    try { localStorage.setItem(VITALS_STORAGE_KEY, JSON.stringify(vitals)); } catch { /**/ }
    setSaved(true);
  }

  function addCustomVital() {
    const id = `custom-${Date.now()}`;
    setVitals(vs => [...vs, {
      id, name: "New Vital", unit: "", custom: true,
      opd: "optional", consult: "optional", followup: "optional", emergency: "optional",
      refMin: "", refMax: "", color: PALETTE[vs.length % PALETTE.length],
    }]);
    setSaved(false);
  }

  function removeVital(id: string) {
    setVitals(vs => vs.filter(v => v.id !== id));
    setSaved(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Set each vital as Required, Optional, or Skip per visit type. Enter normal reference ranges — readings outside these limits will be highlighted in the note.
      </p>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400 w-8"></th>
              <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Vital</th>
              <th className="text-center px-2 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Unit</th>
              {VISIT_TYPES.map(vt => (
                <th key={vt.key} className="text-center px-3 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">{vt.label}</th>
              ))}
              <th className="text-center px-3 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Ref Min</th>
              <th className="text-center px-3 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Ref Max</th>
              <th className="text-center px-3 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Colour</th>
              <th className="w-8 px-2 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {vitals.map(v => (
              <tr key={v.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                {/* Color dot */}
                <td className="px-4 py-2.5">
                  <span className="h-3 w-3 rounded-full block" style={{ backgroundColor: v.color }} />
                </td>
                {/* Name */}
                <td className="px-4 py-2.5">
                  {v.custom ? (
                    <input
                      type="text"
                      value={v.name}
                      onChange={e => updateVital(v.id, { name: e.target.value })}
                      className="text-xs font-semibold text-slate-800 bg-transparent border-b border-slate-200 focus:border-[#4982CF] focus:outline-none py-0.5 w-full"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-slate-800">{v.name}</span>
                  )}
                </td>
                {/* Unit */}
                <td className="px-2 py-2.5 text-center">
                  {v.custom ? (
                    <input
                      type="text"
                      value={v.unit}
                      placeholder="unit"
                      onChange={e => updateVital(v.id, { unit: e.target.value })}
                      className="text-[10px] text-center text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none w-16"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">{v.unit}</span>
                  )}
                </td>
                {/* Visit type toggles */}
                {VISIT_TYPES.map(vt => (
                  <td key={vt.key} className="px-3 py-2.5 text-center">
                    <ReqCell
                      value={v[vt.key]}
                      onChange={val => updateVital(v.id, { [vt.key]: val })}
                    />
                  </td>
                ))}
                {/* Ref min */}
                <td className="px-3 py-2.5 text-center">
                  <input
                    type="text"
                    value={v.refMin}
                    placeholder="—"
                    onChange={e => updateVital(v.id, { refMin: e.target.value })}
                    className="text-[10px] text-center text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none w-16"
                  />
                </td>
                {/* Ref max */}
                <td className="px-3 py-2.5 text-center">
                  <input
                    type="text"
                    value={v.refMax}
                    placeholder="—"
                    onChange={e => updateVital(v.id, { refMax: e.target.value })}
                    className="text-[10px] text-center text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none w-16"
                  />
                </td>
                {/* Colour picker */}
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 flex-wrap max-w-[80px] mx-auto">
                    {PALETTE.map(c => (
                      <button
                        key={c}
                        onClick={() => updateVital(v.id, { color: c })}
                        className={`h-3.5 w-3.5 rounded-full border-2 transition-all ${v.color === c ? "border-slate-800 scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </td>
                {/* Delete (custom only) */}
                <td className="px-2 py-2.5 text-center">
                  {v.custom && (
                    <button
                      onClick={() => removeVital(v.id)}
                      className="p-1 rounded text-slate-300 hover:text-red-400 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add custom vital */}
      <button
        onClick={addCustomVital}
        className="flex items-center gap-2 text-xs font-bold text-[#4982CF] hover:text-[#3b6bb5] transition-colors px-1">
        <Plus className="h-4 w-4" /> Add Custom Vital
      </button>

      {/* Cycle legend */}
      <div className="flex items-center gap-4 text-[10px] text-slate-500 flex-wrap">
        <span className="font-bold text-slate-600">Visit type status:</span>
        <span className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded-full text-blue-700 bg-blue-50 font-bold border border-blue-100">Required</span>
          must always be captured
        </span>
        <span className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded-full text-slate-600 bg-slate-100 font-bold border border-slate-200">Optional</span>
          captured if available
        </span>
        <span className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded-full text-slate-400 bg-slate-50 font-bold border border-slate-100">Skip</span>
          not shown
        </span>
        <span className="text-slate-400 italic">Click any cell to cycle through states</span>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between pt-2">
        {saved ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Configuration saved
          </span>
        ) : <span />}
        <Button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-[#4982CF] hover:bg-[#3b6bb5] text-white text-sm">
          <Save className="h-3.5 w-3.5" /> Save Configuration
        </Button>
      </div>
    </div>
  );
}

// ─── SoapConfigModule ─────────────────────────────────────────────────────────

type SoapSubModule = "note-structure" | "vitals-config";

interface SoapConfigModuleProps {
  activeSubModule: SoapSubModule;
  departments: Department[];
}

export function SoapConfigModule({ activeSubModule, departments }: SoapConfigModuleProps) {
  const heading = activeSubModule === "note-structure"
    ? { title: "Note Structure", sub: "Control which SOAP sections appear, their order, and visibility per specialty." }
    : { title: "Vitals Configuration", sub: "Set which vitals are required per visit type and configure normal reference ranges." };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-lg font-black text-slate-800">{heading.title}</h2>
        <p className="text-sm text-slate-400 mt-0.5">{heading.sub}</p>
      </div>

      {activeSubModule === "note-structure" && (
        <NoteStructurePanel departments={departments} />
      )}
      {activeSubModule === "vitals-config" && (
        <VitalsConfigPanel />
      )}
    </div>
  );
}
