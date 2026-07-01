import { useState } from "react";
import {
  Plus, X, GripVertical, ChevronDown, ChevronRight, Save,
  CheckCircle2, Edit2, Stethoscope, Settings, ShieldCheck,
} from "lucide-react";
import {
  BODY_SYSTEMS, PE_TEMPLATES,
  PE_BUILDER_KEY, PeItemCfg,
  loadPeBuilderConfig, savePeBuilderConfig,
} from "@/pages/RosPeSection";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const ACCENT = "#4982CF";

const SPECIALTIES = [
  "General / All", "Internal Medicine", "Cardiology", "Pulmonology",
  "Gastroenterology", "Neurology", "Orthopaedics", "Paediatrics",
  "Gynaecology", "ENT", "Ophthalmology", "Dermatology", "Psychiatry",
];

const PE_SYSTEMS_KEY = "ehr-pe-systems-v1";

function loadSystemsEnabled(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PE_SYSTEMS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch { /**/ }
  return {};
}

function saveSystemsEnabled(v: Record<string, boolean>) {
  try { localStorage.setItem(PE_SYSTEMS_KEY, JSON.stringify(v)); } catch { /**/ }
}

export function PhysicalExamBuilderModule() {
  const [specialty,       setSpecialty]       = useState("General / All");
  const [expandedSys,     setExpandedSys]     = useState<string | null>(null);
  const [expandedSec,     setExpandedSec]     = useState<string | null>(null);
  const [saved,           setSaved]           = useState(false);

  const [systemsEnabled,  setSystemsEnabled]  = useState<Record<string, boolean>>(() => loadSystemsEnabled());
  const [itemConfig,      setItemConfig]      = useState<Record<string, PeItemCfg>>(() => loadPeBuilderConfig());

  const [editingOpt, setEditingOpt]   = useState<{ cfgKey: string; optIdx: number } | null>(null);
  const [editingText, setEditingText] = useState("");
  const [addText,    setAddText]      = useState<Record<string, string>>({});

  function isEnabled(sysId: string) {
    return systemsEnabled[sysId] !== false;
  }

  function toggleSystem(sysId: string) {
    const next = { ...systemsEnabled, [sysId]: !isEnabled(sysId) };
    setSystemsEnabled(next);
    saveSystemsEnabled(next);
  }

  function getItemCfg(cfgKey: string): PeItemCfg {
    return itemConfig[cfgKey] ?? { normalText: "Normal", abnormalOptions: [] };
  }

  function patchItemCfg(cfgKey: string, patch: Partial<PeItemCfg>) {
    setItemConfig(prev => {
      const next = { ...prev, [cfgKey]: { ...getItemCfg(cfgKey), ...patch } };
      savePeBuilderConfig(next);
      return next;
    });
  }

  function addOption(cfgKey: string) {
    const text = (addText[cfgKey] ?? "").trim();
    if (!text) return;
    const cfg = getItemCfg(cfgKey);
    patchItemCfg(cfgKey, { abnormalOptions: [...cfg.abnormalOptions, text] });
    setAddText(prev => ({ ...prev, [cfgKey]: "" }));
  }

  function removeOption(cfgKey: string, idx: number) {
    const cfg = getItemCfg(cfgKey);
    patchItemCfg(cfgKey, { abnormalOptions: cfg.abnormalOptions.filter((_, i) => i !== idx) });
  }

  function saveEditingOpt() {
    if (!editingOpt) return;
    const { cfgKey, optIdx } = editingOpt;
    const cfg = getItemCfg(cfgKey);
    const next = cfg.abnormalOptions.map((o, i) => i === optIdx ? editingText : o);
    patchItemCfg(cfgKey, { abnormalOptions: next });
    setEditingOpt(null);
    setEditingText("");
  }

  function handleSave() {
    saveSystemsEnabled(systemsEnabled);
    savePeBuilderConfig(itemConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const enabledCount = BODY_SYSTEMS.filter(s => isEnabled(s.id)).length;

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
            {enabledCount} of {BODY_SYSTEMS.length} systems enabled · configure abnormal options per finding
          </p>
        </div>
        <Button size="sm" onClick={handleSave} style={{ background: ACCENT }}
          className="text-white text-xs gap-1.5">
          {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      {/* Specialty selector */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3 flex-shrink-0">
        <Settings className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        <span className="text-xs font-medium text-slate-600 flex-shrink-0">Specialty:</span>
        <div className="flex flex-wrap gap-1.5">
          {SPECIALTIES.map(sp => (
            <button key={sp}
              onClick={() => { setSpecialty(sp); setExpandedSys(null); setExpandedSec(null); }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                specialty === sp ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
              style={specialty === sp ? { background: ACCENT, borderColor: ACCENT } : {}}>
              {sp}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-2 border-b border-slate-100 bg-amber-50/60 flex items-center gap-3">
        <ShieldCheck className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
        <p className="text-[10px] text-amber-700">
          Expand a body system → then expand a section → configure each finding's abnormal options.
          Doctors see these as clickable pills in the examination drawer.
        </p>
      </div>

      {/* Body Systems list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {BODY_SYSTEMS.map((sys) => {
          const isExpanded = expandedSys === sys.id;
          const tplSections = PE_TEMPLATES[sys.id] ?? [];
          const enabled = isEnabled(sys.id);
          const totalOpts = tplSections.reduce((acc, sec) =>
            acc + sec.items.reduce((a2, item) =>
              a2 + (itemConfig[`${sys.id}__${sec.section}__${item}`]?.abnormalOptions.length ?? 0), 0), 0);

          return (
            <div key={sys.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              {/* System header */}
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <GripVertical className="h-4 w-4 text-slate-300 cursor-grab flex-shrink-0" />
                <button
                  className="flex-1 flex items-center gap-2 text-left min-w-0"
                  onClick={() => { setExpandedSys(isExpanded ? null : sys.id); setExpandedSec(null); }}>
                  <span className="font-medium text-sm text-slate-700 truncate">{sys.label}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono flex-shrink-0">{sys.abbr}</Badge>
                  {!enabled && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">Disabled</Badge>}
                  {totalOpts > 0 && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>
                      {totalOpts} options
                    </span>
                  )}
                  <span className="ml-auto text-xs text-slate-400 flex-shrink-0">{tplSections.length} section{tplSections.length !== 1 ? "s" : ""}</span>
                  {isExpanded
                    ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    : <ChevronRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />}
                </button>
                <Switch
                  checked={enabled}
                  onCheckedChange={() => toggleSystem(sys.id)}
                  className="data-[state=checked]:bg-[#4982CF] flex-shrink-0"
                />
              </div>

              {/* Expanded: sections */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-3 space-y-2">
                  {tplSections.map(sec => {
                    const secKey = `${sys.id}__${sec.section}`;
                    const isSecExp = expandedSec === secKey;
                    const secOpts = sec.items.reduce((acc, item) =>
                      acc + (itemConfig[`${sys.id}__${sec.section}__${item}`]?.abnormalOptions.length ?? 0), 0);

                    return (
                      <div key={sec.section} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        {/* Section header */}
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                          onClick={() => setExpandedSec(isSecExp ? null : secKey)}>
                          <span className="text-xs font-semibold text-slate-700 flex-1">{sec.section}</span>
                          {secOpts > 0 && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
                              {secOpts} options
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">{sec.items.length} item{sec.items.length !== 1 ? "s" : ""}</span>
                          {isSecExp
                            ? <ChevronDown className="h-3 w-3 text-slate-400" />
                            : <ChevronRight className="h-3 w-3 text-slate-400" />}
                        </button>

                        {/* Expanded: items */}
                        {isSecExp && (
                          <div className="border-t border-slate-100 bg-slate-50/40 p-3 space-y-3">
                            {sec.items.map(item => {
                              const cfgKey = `${sys.id}__${sec.section}__${item}`;
                              const cfg = getItemCfg(cfgKey);

                              return (
                                <div key={item} className="bg-white border border-slate-100 rounded-lg p-3 space-y-2">
                                  {/* Item label */}
                                  <p className="text-[10px] font-bold text-slate-700">{item}</p>

                                  {/* Normal text */}
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex-shrink-0">Normal text</label>
                                    <input
                                      value={cfg.normalText}
                                      onChange={e => patchItemCfg(cfgKey, { normalText: e.target.value })}
                                      className="flex-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 focus:outline-none focus:border-emerald-400"
                                      placeholder="Normal"
                                    />
                                  </div>

                                  {/* Abnormal options */}
                                  <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Abnormal options</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {cfg.abnormalOptions.map((opt, optIdx) => (
                                        <div key={optIdx}
                                          className="group flex items-center gap-1 bg-red-50 border border-red-100 rounded-full px-2.5 py-0.5">
                                          {editingOpt?.cfgKey === cfgKey && editingOpt?.optIdx === optIdx ? (
                                            <>
                                              <input
                                                className="text-[10px] bg-transparent outline-none w-32 text-red-700"
                                                value={editingText}
                                                onChange={e => setEditingText(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && saveEditingOpt()}
                                                onBlur={saveEditingOpt}
                                                autoFocus
                                              />
                                              <button onClick={saveEditingOpt}>
                                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <span className="text-[10px] text-red-700">{opt}</span>
                                              <button
                                                onClick={() => { setEditingOpt({ cfgKey, optIdx }); setEditingText(opt); }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Edit2 className="h-2.5 w-2.5 text-slate-400" />
                                              </button>
                                              <button
                                                onClick={() => removeOption(cfgKey, optIdx)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="h-2.5 w-2.5 text-red-400" />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      ))}
                                      {/* Add new option */}
                                      <div className="flex items-center gap-1">
                                        <input
                                          className="text-[10px] border border-dashed border-slate-300 rounded-full px-2.5 py-0.5 outline-none focus:border-red-400 w-32 placeholder:text-slate-400"
                                          placeholder="+ Add option"
                                          value={addText[cfgKey] ?? ""}
                                          onChange={e => setAddText(prev => ({ ...prev, [cfgKey]: e.target.value }))}
                                          onKeyDown={e => e.key === "Enter" && addOption(cfgKey)}
                                        />
                                        {(addText[cfgKey] ?? "").trim() && (
                                          <button
                                            onClick={() => addOption(cfgKey)}
                                            className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                                            Add
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    {cfg.abnormalOptions.length === 0 && (
                                      <p className="text-[9px] text-slate-300 mt-1 italic">No options yet — type above to add</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
