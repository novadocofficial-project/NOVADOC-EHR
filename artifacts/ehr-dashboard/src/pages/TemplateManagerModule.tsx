import { useState } from "react";
import {
  Plus, Trash2, Copy, Edit2, Eye, X, Save, CheckCircle2,
  FileText, Star, StarOff, Search, ChevronRight, ChevronDown,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { SoapTemplate, TemplateSectionKey } from "@/pages/SoapNoteTemplates";

const ACCENT = "#4982CF";

const ALL_SECTION_KEYS: TemplateSectionKey[] = [
  "chiefComplaints","hpi","ros","formulary","imaging",
  "carePlan","procedureOrders","healthEd","patientGoals",
  "referrals","otherOrders","visitNote",
];

const SECTION_META: Record<TemplateSectionKey, { label: string; color: string }> = {
  chiefComplaints: { label: "Chief Complaint",    color: "#4982CF" },
  hpi:             { label: "HPI",                 color: "#8b5cf6" },
  ros:             { label: "Review of Systems",   color: "#0ea5e9" },
  formulary:       { label: "Medications",         color: "#7c3aed" },
  imaging:         { label: "Imaging",             color: "#0369a1" },
  carePlan:        { label: "Care Plan",           color: "#10b981" },
  procedureOrders: { label: "Procedures",          color: "#0d9488" },
  healthEd:        { label: "Health Education",    color: "#f97316" },
  patientGoals:    { label: "Patient Goals",       color: "#ec4899" },
  referrals:       { label: "Referrals",           color: "#6366f1" },
  otherOrders:     { label: "Other Orders",        color: "#f59e0b" },
  visitNote:       { label: "Visit Note",          color: "#64748b" },
};

const SPECIALTIES = [
  "All Specialties","Internal Medicine","Cardiology","Pulmonology",
  "Gastroenterology","Neurology","Paediatrics","Gynaecology","ENT","Orthopaedics",
];

const DEPARTMENTS = [
  "OPD General","OPD Cardiology","OPD Pulmonology","OPD Neurology",
  "Paediatrics","Gynaecology","Emergency","ICU","Surgery",
];

interface AdminTemplate {
  id:          string;
  name:        string;
  description: string;
  specialty:   string;
  departments: string[];
  sections:    TemplateSectionKey[];
  isDefault:   boolean;
  isSystem:    boolean;
  createdAt:   string;
}

const SEED: AdminTemplate[] = [
  {
    id: "tpl-urti", name: "URTI Standard", description: "Upper respiratory tract infection",
    specialty: "Internal Medicine", departments: ["OPD General"], isDefault: true, isSystem: true,
    sections: ["chiefComplaints","hpi","ros","carePlan"],
    createdAt: "2025-01-10",
  },
  {
    id: "tpl-dm", name: "DM Follow-Up", description: "Diabetes mellitus routine follow-up",
    specialty: "Internal Medicine", departments: ["OPD General","OPD Cardiology"], isDefault: false, isSystem: true,
    sections: ["chiefComplaints","hpi","formulary","carePlan","patientGoals"],
    createdAt: "2025-01-12",
  },
  {
    id: "tpl-card", name: "Cardiology Consult", description: "Cardiac evaluation note",
    specialty: "Cardiology", departments: ["OPD Cardiology"], isDefault: true, isSystem: true,
    sections: ["chiefComplaints","hpi","ros","formulary","imaging","carePlan"],
    createdAt: "2025-02-01",
  },
];

function uid() { return `tpl-${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }

type DrawerMode = "view" | "edit" | "new";

interface DrawerState {
  mode:     DrawerMode;
  template: AdminTemplate;
}

export function TemplateManagerModule() {
  const [templates, setTemplates] = useState<AdminTemplate[]>(SEED);
  const [search, setSearch]       = useState("");
  const [filterSp, setFilterSp]   = useState("All Specialties");
  const [drawer, setDrawer]       = useState<DrawerState | null>(null);
  const [saved, setSaved]         = useState(false);

  const filtered = templates.filter(t =>
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())) &&
    (filterSp === "All Specialties" || t.specialty === filterSp)
  );

  function openNew() {
    setDrawer({
      mode: "new",
      template: {
        id: uid(), name: "", description: "", specialty: "All Specialties",
        departments: [], sections: ["chiefComplaints","hpi"], isDefault: false, isSystem: false,
        createdAt: new Date().toISOString().slice(0,10),
      },
    });
  }

  function openEdit(t: AdminTemplate) {
    setDrawer({ mode: "edit", template: { ...t } });
  }

  function openView(t: AdminTemplate) {
    setDrawer({ mode: "view", template: t });
  }

  function cloneTemplate(t: AdminTemplate) {
    const clone: AdminTemplate = { ...t, id: uid(), name: `${t.name} (Copy)`, isDefault: false, isSystem: false };
    setTemplates(prev => [clone, ...prev]);
  }

  function deleteTemplate(id: string) {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }

  function toggleDefault(id: string) {
    setTemplates(prev => {
      const tpl = prev.find(t => t.id === id);
      if (!tpl) return prev;
      return prev.map(t =>
        t.specialty === tpl.specialty
          ? { ...t, isDefault: t.id === id ? !t.isDefault : false }
          : t
      );
    });
  }

  function saveDrawer() {
    if (!drawer) return;
    if (drawer.mode === "new") {
      setTemplates(prev => [drawer.template, ...prev]);
    } else {
      setTemplates(prev => prev.map(t => t.id === drawer.template.id ? drawer.template : t));
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setDrawer(null); }, 900);
  }

  function updateDraft(fn: (t: AdminTemplate) => AdminTemplate) {
    setDrawer(prev => prev ? { ...prev, template: fn(prev.template) } : prev);
  }

  function toggleSection(key: TemplateSectionKey) {
    updateDraft(t => ({
      ...t,
      sections: t.sections.includes(key) ? t.sections.filter(s => s !== key) : [...t.sections, key],
    }));
  }

  function toggleDept(dept: string) {
    updateDraft(t => ({
      ...t,
      departments: t.departments.includes(dept) ? t.departments.filter(d => d !== dept) : [...t.departments, dept],
    }));
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main panel */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5" style={{ color: ACCENT }} />
              Template Manager
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{templates.length} templates — {templates.filter(t => t.isDefault).length} set as default</p>
          </div>
          <Button size="sm" onClick={openNew} style={{ background: ACCENT }} className="text-white text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Template
          </Button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search templates…" className="pl-8 h-8 text-xs" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["All Specialties", ...SPECIALTIES.slice(1)].map(sp => (
              <button key={sp} onClick={() => setFilterSp(sp)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filterSp === sp ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
                style={filterSp === sp ? { background: ACCENT } : {}}>
                {sp}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400 text-sm">No templates match your search.</div>
          )}
          {filtered.map(t => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-slate-800">{t.name}</span>
                  {t.isSystem && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">System</Badge>}
                  {t.isDefault && (
                    <Badge className="text-[10px] px-1.5 py-0 text-white" style={{ background: "#10b981" }}>Default</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{t.description}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t.specialty}</Badge>
                  {t.sections.map(s => (
                    <span key={s} className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium text-white"
                      style={{ background: SECTION_META[s].color }}>
                      {SECTION_META[s].label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleDefault(t.id)} title="Set as default"
                  className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${t.isDefault ? "text-amber-500" : "text-slate-400"}`}>
                  {t.isDefault ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openView(t)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
                <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => cloneTemplate(t)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
                {!t.isSystem && (
                  <button onClick={() => deleteTemplate(t.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drawer */}
      {drawer && (
        <div className="w-[420px] border-l border-slate-200 bg-white flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800 text-sm">
              {drawer.mode === "new" ? "New Template" : drawer.mode === "edit" ? "Edit Template" : "Preview"}
            </h3>
            <button onClick={() => setDrawer(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {drawer.mode === "view" ? (
              /* Preview mode */
              <>
                <div>
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{drawer.template.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Description</p>
                  <p className="text-sm text-slate-700 mt-0.5">{drawer.template.description || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Specialty</p>
                  <Badge variant="outline" className="mt-1 text-xs">{drawer.template.specialty}</Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Departments</p>
                  <div className="flex flex-wrap gap-1.5">
                    {drawer.template.departments.length
                      ? drawer.template.departments.map(d => <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>)
                      : <span className="text-xs text-slate-400">All departments</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">Sections included ({drawer.template.sections.length})</p>
                  <div className="space-y-1.5">
                    {ALL_SECTION_KEYS.map(key => {
                      const included = drawer.template.sections.includes(key);
                      return (
                        <div key={key} className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs ${
                          included ? "bg-blue-50 text-blue-800" : "bg-slate-50 text-slate-400"
                        }`}>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: included ? SECTION_META[key].color : "#cbd5e1" }} />
                          {SECTION_META[key].label}
                          {included && <CheckCircle2 className="h-3 w-3 ml-auto text-blue-500" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* Edit / New mode */
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Template Name *</label>
                  <Input value={drawer.template.name}
                    onChange={e => updateDraft(t => ({ ...t, name: e.target.value }))}
                    placeholder="e.g. URTI Standard" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Description</label>
                  <Input value={drawer.template.description}
                    onChange={e => updateDraft(t => ({ ...t, description: e.target.value }))}
                    placeholder="Brief description" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Specialty</label>
                  <select value={drawer.template.specialty}
                    onChange={e => updateDraft(t => ({ ...t, specialty: e.target.value }))}
                    className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white">
                    {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Assign to Departments</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {DEPARTMENTS.map(d => {
                      const sel = drawer.template.departments.includes(d);
                      return (
                        <button key={d} onClick={() => toggleDept(d)}
                          className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                            sel ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                          style={sel ? { background: ACCENT } : {}}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                  {drawer.template.departments.length === 0 && (
                    <p className="text-[10px] text-slate-400">No selection = available to all departments</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Sections</label>
                  <div className="space-y-1">
                    {ALL_SECTION_KEYS.map(key => {
                      const sel = drawer.template.sections.includes(key);
                      return (
                        <button key={key} onClick={() => toggleSection(key)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs border transition-all ${
                            sel ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SECTION_META[key].color }} />
                          {SECTION_META[key].label}
                          {sel && <CheckCircle2 className="h-3 w-3 ml-auto text-blue-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isDefault" checked={drawer.template.isDefault}
                    onChange={e => updateDraft(t => ({ ...t, isDefault: e.target.checked }))}
                    className="rounded" />
                  <label htmlFor="isDefault" className="text-xs text-slate-600">Set as default for selected specialty</label>
                </div>
              </>
            )}
          </div>

          {drawer.mode !== "view" && (
            <div className="px-5 py-4 border-t border-slate-200">
              <Button onClick={saveDrawer} size="sm" className="w-full text-xs gap-1.5 text-white"
                style={{ background: ACCENT }} disabled={!drawer.template.name.trim()}>
                {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {saved ? "Saved!" : drawer.mode === "new" ? "Create Template" : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
