import { useState, useEffect } from "react";
import { Edit2, List, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  type PediDosingRule,
  loadPediRules, savePediRules,
} from "@/pages/pediDosingUtils";
import { getActiveMedicines } from "@/pages/FormularySection";

const ACCENT = "#4982CF";

const ROUTES = ["Oral", "IV", "Oral / IV", "Nebulised", "Topical", "IM", "Rectal", "Intranasal"];
const FREQUENCIES = ["Once daily", "BD", "TDS", "QDS", "4 hourly", "6 hourly", "6–8 hourly", "8 hourly", "12 hourly", "24 hourly", "4–6 hourly", "PRN"];

export function PediDosingTab() {
  const [rules, setRules]               = useState<PediDosingRule[]>(loadPediRules);
  const [editorOpen, setEditorOpen]     = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterMed, setFilterMed]       = useState("");

  const [draftMedId,    setDraftMedId]    = useState("");
  const [draftAgeLabel, setDraftAgeLabel] = useState("");
  const [draftMinAge,   setDraftMinAge]   = useState(0);
  const [draftRoute,    setDraftRoute]    = useState("Oral");
  const [draftDose,     setDraftDose]     = useState("");
  const [draftFreq,     setDraftFreq]     = useState("TDS");
  const [draftMaxDose,  setDraftMaxDose]  = useState("");
  const [draftNotes,    setDraftNotes]    = useState("");

  useEffect(() => { savePediRules(rules); }, [rules]);

  const medicines = getActiveMedicines();

  function openAdd() {
    setEditingId(null);
    setDraftMedId(""); setDraftAgeLabel(""); setDraftMinAge(0);
    setDraftRoute("Oral"); setDraftDose(""); setDraftFreq("TDS");
    setDraftMaxDose(""); setDraftNotes("");
    setEditorOpen(true);
  }

  function openEdit(r: PediDosingRule) {
    setEditingId(r.id);
    setDraftMedId(r.medicineId); setDraftAgeLabel(r.ageLabel); setDraftMinAge(r.minAgeMonths);
    setDraftRoute(r.route); setDraftDose(r.doseRange); setDraftFreq(r.frequency);
    setDraftMaxDose(r.maxDose); setDraftNotes(r.notes);
    setEditorOpen(true);
  }

  function saveRule() {
    if (!draftMedId || !draftAgeLabel.trim() || !draftDose.trim()) return;
    const med = medicines.find(m => m.id === draftMedId);
    if (!med) return;

    if (editingId) {
      setRules(prev => prev.map(r => r.id === editingId
        ? { ...r, medicineId: draftMedId, medicineName: med.generic, ageLabel: draftAgeLabel.trim(),
            minAgeMonths: draftMinAge, route: draftRoute, doseRange: draftDose.trim(),
            frequency: draftFreq, maxDose: draftMaxDose.trim(), notes: draftNotes.trim() }
        : r
      ));
    } else {
      setRules(prev => [...prev, {
        id: `pedi-${Date.now()}`,
        medicineId: draftMedId, medicineName: med.generic, ageLabel: draftAgeLabel.trim(),
        minAgeMonths: draftMinAge, route: draftRoute, doseRange: draftDose.trim(),
        frequency: draftFreq, maxDose: draftMaxDose.trim(), notes: draftNotes.trim(),
        enabled: true,
      }]);
    }
    setEditorOpen(false);
  }

  function toggleEnabled(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  function deleteRule(id: string) {
    setRules(prev => prev.filter(r => r.id !== id));
    setDeleteConfirm(null);
    if (editingId === id) setEditorOpen(false);
  }

  const filtered = filterMed
    ? rules.filter(r => r.medicineId === filterMed)
    : rules;

  const sortedFiltered = [...filtered].sort((a, b) => {
    if (a.medicineName < b.medicineName) return -1;
    if (a.medicineName > b.medicineName) return 1;
    return a.minAgeMonths - b.minAgeMonths;
  });

  const canSave = draftMedId && draftAgeLabel.trim() && draftDose.trim();

  const uniqueMedIds = [...new Set(rules.map(r => r.medicineId))];

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Rule List ── */}
      <div className={`flex flex-col border-r border-slate-200 bg-white overflow-hidden transition-all duration-200 ${editorOpen ? "w-[48%]" : "w-full"}`}>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <select value={filterMed} onChange={e => setFilterMed(e.target.value)}
              className="w-full appearance-none text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-6 outline-none focus:border-[#4982CF]/40 transition-colors">
              <option value="">All medicines ({rules.length} rules)</option>
              {uniqueMedIds.map(id => {
                const name = rules.find(r => r.medicineId === id)?.medicineName ?? id;
                const count = rules.filter(r => r.medicineId === id).length;
                return <option key={id} value={id}>{name} ({count})</option>;
              })}
            </select>
          </div>
          <Button size="sm" onClick={openAdd} style={{ background: ACCENT }}
            className="text-white text-xs gap-1.5 h-8 flex-shrink-0">
            <Plus className="h-3.5 w-3.5" /> New Rule
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {sortedFiltered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
              <List className="h-8 w-8 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-400">No dosing rules</p>
              <p className="text-xs text-slate-400 mt-1">Add pediatric dosing guidelines per medicine and age group</p>
            </div>
          )}
          {sortedFiltered.map(rule => (
            <div key={rule.id}
              className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${editingId === rule.id && editorOpen ? "bg-teal-50/40" : ""} ${!rule.enabled ? "opacity-50" : ""}`}>
              {deleteConfirm === rule.id ? (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-700 flex-1">Remove <strong>{rule.medicineName} · {rule.ageLabel}</strong>?</p>
                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => deleteRule(rule.id)}>Remove</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleEnabled(rule.id)} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-teal-700 uppercase tracking-wide">{rule.ageLabel}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-600 border border-teal-200 font-bold">{rule.route}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{rule.medicineName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-teal-700 font-bold">{rule.doseRange}</span>
                      <span className="text-[10px] text-slate-500">{rule.frequency}</span>
                      {rule.maxDose && <span className="text-[10px] text-orange-600 font-bold">max {rule.maxDose}</span>}
                    </div>
                    {rule.notes && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic">{rule.notes}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(rule)}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(rule.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Editor Panel ── */}
      {editorOpen && (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex-shrink-0">
            <button onClick={() => setEditorOpen(false)}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors">
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-slate-800 flex-1">{editingId ? "Edit Rule" : "New Dosing Rule"}</p>
            <Button size="sm" onClick={saveRule} disabled={!canSave}
              style={canSave ? { background: ACCENT } : {}}
              className="text-white text-xs gap-1.5 h-8 disabled:opacity-40">
              <Save className="h-3.5 w-3.5" />
              {editingId ? "Save Changes" : "Add Rule"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* Medicine */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Medicine *</label>
              <select value={draftMedId} onChange={e => setDraftMedId(e.target.value)}
                className="w-full appearance-none text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 transition-colors">
                <option value="">Select medicine…</option>
                {medicines.map(m => <option key={m.id} value={m.id}>{m.generic}</option>)}
              </select>
            </div>

            {/* Age label + min age */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Age Group Label *</label>
                <input value={draftAgeLabel} onChange={e => setDraftAgeLabel(e.target.value)}
                  placeholder="e.g. 1–5 years"
                  className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 transition-colors placeholder:text-slate-300" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Min Age (months)</label>
                <input type="number" min={0} value={draftMinAge} onChange={e => setDraftMinAge(+e.target.value)}
                  placeholder="0"
                  className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 transition-colors" />
              </div>
            </div>

            {/* Route + Frequency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Route *</label>
                <select value={draftRoute} onChange={e => setDraftRoute(e.target.value)}
                  className="w-full appearance-none text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 transition-colors">
                  {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Frequency *</label>
                <select value={draftFreq} onChange={e => setDraftFreq(e.target.value)}
                  className="w-full appearance-none text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 transition-colors">
                  {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            {/* Dose range */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Dose Range *</label>
              <input value={draftDose} onChange={e => setDraftDose(e.target.value)}
                placeholder="e.g. 10–15 mg/kg/dose or 125–250 mg/dose"
                className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 transition-colors placeholder:text-slate-300" />
            </div>

            {/* Max dose */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Max Dose</label>
              <input value={draftMaxDose} onChange={e => setDraftMaxDose(e.target.value)}
                placeholder="e.g. 1 g/dose or 40 mg/kg/day"
                className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 transition-colors placeholder:text-slate-300" />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Clinical Notes</label>
              <textarea value={draftNotes} onChange={e => setDraftNotes(e.target.value)}
                rows={3} placeholder="Cautions, administration tips, special instructions…"
                className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 transition-all resize-none placeholder:text-slate-300" />
            </div>

            {/* Preview */}
            {draftMedId && draftAgeLabel.trim() && draftDose.trim() && (
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Preview</label>
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                  <p className="text-[10px] font-black text-teal-700 uppercase tracking-wide">{draftAgeLabel}</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{medicines.find(m => m.id === draftMedId)?.generic}</p>
                  <div className="flex gap-3 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-teal-700 font-bold">{draftDose}</span>
                    <span className="text-[10px] text-slate-500">{draftFreq}</span>
                    <span className="text-[10px] text-slate-400">{draftRoute}</span>
                    {draftMaxDose && <span className="text-[10px] text-orange-600 font-bold">max {draftMaxDose}</span>}
                  </div>
                  {draftNotes && <p className="text-[10px] text-slate-500 mt-1.5 italic">{draftNotes}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
