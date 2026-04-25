import { useState } from "react";
import {
  Plus, X, GripVertical, ChevronDown, ChevronRight, Save,
  CheckCircle2, Edit2, Trash2, Stethoscope, Settings,
} from "lucide-react";
import { BODY_SYSTEMS, PE_TEMPLATES } from "@/pages/RosPeSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const ACCENT = "#4982CF";

const SPECIALTIES = [
  "General / All", "Internal Medicine", "Cardiology", "Pulmonology",
  "Gastroenterology", "Neurology", "Orthopaedics", "Paediatrics",
  "Gynaecology", "ENT", "Ophthalmology", "Dermatology", "Psychiatry",
];

interface FindingOption { id: string; text: string; }

interface SystemConfig {
  systemId: string;
  enabled:  boolean;
  sections: { sectionName: string; normalText: string; abnormalOptions: FindingOption[] }[];
}

function initConfigs(): SystemConfig[] {
  return BODY_SYSTEMS.map(sys => {
    const tplSections = PE_TEMPLATES[sys.id] ?? [];
    return {
      systemId: sys.id,
      enabled:  true,
      sections: tplSections.map(sec => ({
        sectionName:      sec.section,
        normalText:       sec.items[0] ?? "",
        abnormalOptions:  sec.items.map((it, i) => ({ id: `${sys.id}-${i}`, text: it })),
      })),
    };
  });
}

type SavedState = Record<string, SystemConfig[]>;

export function PhysicalExamBuilderModule() {
  const [specialty, setSpecialty] = useState("General / All");
  const [configs, setConfigs] = useState<SavedState>({ "General / All": initConfigs() });
  const [expandedSys, setExpandedSys] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [addSectionFor, setAddSectionFor] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState("");

  const [editingOption, setEditingOption] = useState<{ sysId: string; secIdx: number; optId: string } | null>(null);
  const [editingOptionText, setEditingOptionText] = useState("");
  const [newOptionText, setNewOptionText] = useState<Record<string, string>>({});

  function getRows(): SystemConfig[] {
    return configs[specialty] ?? initConfigs();
  }

  function setRows(fn: (prev: SystemConfig[]) => SystemConfig[]) {
    setConfigs(prev => ({
      ...prev,
      [specialty]: fn(prev[specialty] ?? initConfigs()),
    }));
  }

  function toggleSystem(sysId: string) {
    setRows(prev => prev.map(r => r.systemId === sysId ? { ...r, enabled: !r.enabled } : r));
  }

  function addSection(sysId: string) {
    const name = newSectionName.trim();
    if (!name) return;
    setRows(prev => prev.map(r =>
      r.systemId === sysId
        ? { ...r, sections: [...r.sections, { sectionName: name, normalText: "", abnormalOptions: [] }] }
        : r
    ));
    setNewSectionName("");
    setAddSectionFor(null);
  }

  function removeSection(sysId: string, secIdx: number) {
    setRows(prev => prev.map(r =>
      r.systemId === sysId
        ? { ...r, sections: r.sections.filter((_, i) => i !== secIdx) }
        : r
    ));
  }

  function updateNormalText(sysId: string, secIdx: number, text: string) {
    setRows(prev => prev.map(r =>
      r.systemId === sysId
        ? { ...r, sections: r.sections.map((s, i) => i === secIdx ? { ...s, normalText: text } : s) }
        : r
    ));
  }

  function addOption(sysId: string, secIdx: number) {
    const key = `${sysId}-${secIdx}`;
    const text = (newOptionText[key] ?? "").trim();
    if (!text) return;
    setRows(prev => prev.map(r =>
      r.systemId === sysId
        ? {
            ...r,
            sections: r.sections.map((s, i) =>
              i === secIdx
                ? { ...s, abnormalOptions: [...s.abnormalOptions, { id: `opt-${Date.now()}`, text }] }
                : s
            ),
          }
        : r
    ));
    setNewOptionText(prev => ({ ...prev, [key]: "" }));
  }

  function removeOption(sysId: string, secIdx: number, optId: string) {
    setRows(prev => prev.map(r =>
      r.systemId === sysId
        ? {
            ...r,
            sections: r.sections.map((s, i) =>
              i === secIdx
                ? { ...s, abnormalOptions: s.abnormalOptions.filter(o => o.id !== optId) }
                : s
            ),
          }
        : r
    ));
  }

  function saveEditingOption() {
    if (!editingOption) return;
    const { sysId, secIdx, optId } = editingOption;
    setRows(prev => prev.map(r =>
      r.systemId === sysId
        ? {
            ...r,
            sections: r.sections.map((s, i) =>
              i === secIdx
                ? { ...s, abnormalOptions: s.abnormalOptions.map(o => o.id === optId ? { ...o, text: editingOptionText } : o) }
                : s
            ),
          }
        : r
    ));
    setEditingOption(null);
    setEditingOptionText("");
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const rows = getRows();
  const enabledCount = rows.filter(r => r.enabled).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Stethoscope className="h-5 w-5" style={{ color: ACCENT }} />
            Physical Exam Builder
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {enabledCount} of {BODY_SYSTEMS.length} systems enabled for <span className="font-medium">{specialty}</span>
          </p>
        </div>
        <Button size="sm" onClick={handleSave} style={{ background: ACCENT }}
          className="text-white text-xs gap-1.5">
          {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      {/* Specialty selector */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
        <Settings className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-600">Specialty:</span>
        <div className="flex flex-wrap gap-1.5">
          {SPECIALTIES.map(sp => (
            <button
              key={sp}
              onClick={() => { setSpecialty(sp); setExpandedSys(null); }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                specialty === sp
                  ? "text-white border-transparent"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
              style={specialty === sp ? { background: ACCENT, borderColor: ACCENT } : {}}
            >
              {sp}
            </button>
          ))}
        </div>
      </div>

      {/* Body Systems list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {BODY_SYSTEMS.map((sys) => {
          const row = rows.find(r => r.systemId === sys.id)!;
          const isExpanded = expandedSys === sys.id;
          return (
            <div key={sys.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              {/* System header row */}
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <GripVertical className="h-4 w-4 text-slate-300 cursor-grab" />
                <button
                  className="flex-1 flex items-center gap-2 text-left"
                  onClick={() => setExpandedSys(isExpanded ? null : sys.id)}
                >
                  <span className="font-medium text-sm text-slate-700">{sys.label}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">{sys.abbr}</Badge>
                  {!row.enabled && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Disabled</Badge>
                  )}
                  <span className="ml-auto text-xs text-slate-400">{row.sections.length} section{row.sections.length !== 1 ? "s" : ""}</span>
                  {isExpanded
                    ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                </button>
                <Switch
                  checked={row.enabled}
                  onCheckedChange={() => toggleSystem(sys.id)}
                  style={{ "--accent": ACCENT } as React.CSSProperties}
                />
              </div>

              {/* Expanded sections */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4">
                  {row.sections.map((sec, secIdx) => {
                    const optKey = `${sys.id}-${secIdx}`;
                    return (
                      <div key={secIdx} className="bg-white border border-slate-200 rounded-md p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">{sec.sectionName}</span>
                          <button onClick={() => removeSection(sys.id, secIdx)}
                            className="text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Normal text */}
                        <div>
                          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Normal finding (default text)</label>
                          <Input
                            value={sec.normalText}
                            onChange={e => updateNormalText(sys.id, secIdx, e.target.value)}
                            placeholder="e.g. Normal, no abnormality detected"
                            className="mt-1 h-7 text-xs"
                          />
                        </div>

                        {/* Abnormal options */}
                        <div>
                          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Abnormal finding options</label>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {sec.abnormalOptions.map(opt => (
                              <div key={opt.id} className="group flex items-center gap-1 bg-slate-100 rounded-full px-2.5 py-0.5">
                                {editingOption?.optId === opt.id ? (
                                  <>
                                    <input
                                      className="text-xs bg-transparent outline-none w-28"
                                      value={editingOptionText}
                                      onChange={e => setEditingOptionText(e.target.value)}
                                      onKeyDown={e => e.key === "Enter" && saveEditingOption()}
                                      autoFocus
                                    />
                                    <button onClick={saveEditingOption}><CheckCircle2 className="h-3 w-3 text-green-500" /></button>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-xs text-slate-700">{opt.text}</span>
                                    <button onClick={() => { setEditingOption({ sysId: sys.id, secIdx, optId: opt.id }); setEditingOptionText(opt.text); }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Edit2 className="h-2.5 w-2.5 text-slate-500" />
                                    </button>
                                    <button onClick={() => removeOption(sys.id, secIdx, opt.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <X className="h-2.5 w-2.5 text-red-400" />
                                    </button>
                                  </>
                                )}
                              </div>
                            ))}
                            {/* Add new option inline */}
                            <div className="flex items-center gap-1">
                              <input
                                className="text-xs border border-dashed border-slate-300 rounded-full px-2.5 py-0.5 outline-none focus:border-blue-400 w-28 placeholder:text-slate-400"
                                placeholder="+ Add option"
                                value={newOptionText[optKey] ?? ""}
                                onChange={e => setNewOptionText(prev => ({ ...prev, [optKey]: e.target.value }))}
                                onKeyDown={e => e.key === "Enter" && addOption(sys.id, secIdx)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add section */}
                  {addSectionFor === sys.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newSectionName}
                        onChange={e => setNewSectionName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addSection(sys.id)}
                        placeholder="Section name"
                        className="h-7 text-xs flex-1"
                        autoFocus
                      />
                      <Button size="sm" className="h-7 text-xs" onClick={() => addSection(sys.id)}
                        style={{ background: ACCENT }} >
                        Add
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs"
                        onClick={() => { setAddSectionFor(null); setNewSectionName(""); }}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddSectionFor(sys.id)}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Section
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
