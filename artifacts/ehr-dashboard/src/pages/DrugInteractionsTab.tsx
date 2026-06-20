import { useState, useEffect } from "react";
import { AlertTriangle, Edit2, Plus, Save, ShieldAlert, Trash2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  type DrugInteraction, type InteractionSeverity,
  loadInteractions, saveInteractions,
} from "@/pages/drugInteractionUtils";
import { getActiveMedicines } from "@/pages/FormularySection";

const ACCENT = "#4982CF";

const SEVERITIES: InteractionSeverity[] = ["Contraindicated", "Major", "Moderate", "Minor"];

const SEV_STYLES: Record<InteractionSeverity, { badge: string; dot: string; label: string }> = {
  Contraindicated: { badge: "bg-red-100 text-red-700 border-red-200",    dot: "bg-red-500",    label: "Contraindicated" },
  Major:           { badge: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500", label: "Major" },
  Moderate:        { badge: "bg-amber-100 text-amber-700 border-amber-200",  dot: "bg-amber-500",  label: "Moderate" },
  Minor:           { badge: "bg-blue-100 text-blue-700 border-blue-200",   dot: "bg-blue-400",   label: "Minor" },
};

export function DrugInteractionsTab() {
  const [interactions, setInteractions] = useState<DrugInteraction[]>(loadInteractions);
  const [editorOpen, setEditorOpen]     = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter]             = useState<InteractionSeverity | "All">("All");

  const [draftMedA, setDraftMedA]   = useState("");
  const [draftMedB, setDraftMedB]   = useState("");
  const [draftSev, setDraftSev]     = useState<InteractionSeverity>("Moderate");
  const [draftNote, setDraftNote]   = useState("");

  useEffect(() => { saveInteractions(interactions); }, [interactions]);

  const medicines = getActiveMedicines();

  function openAdd() {
    setEditingId(null);
    setDraftMedA(""); setDraftMedB(""); setDraftSev("Moderate"); setDraftNote("");
    setEditorOpen(true);
  }

  function openEdit(i: DrugInteraction) {
    setEditingId(i.id);
    setDraftMedA(i.medicineIdA); setDraftMedB(i.medicineIdB);
    setDraftSev(i.severity); setDraftNote(i.note);
    setEditorOpen(true);
  }

  function saveRule() {
    if (!draftMedA || !draftMedB || draftMedA === draftMedB || !draftNote.trim()) return;
    const medA = medicines.find(m => m.id === draftMedA);
    const medB = medicines.find(m => m.id === draftMedB);
    if (!medA || !medB) return;

    if (editingId) {
      setInteractions(prev => prev.map(i => i.id === editingId
        ? { ...i, medicineIdA: draftMedA, medicineNameA: medA.generic, medicineIdB: draftMedB, medicineNameB: medB.generic, severity: draftSev, note: draftNote.trim() }
        : i
      ));
    } else {
      setInteractions(prev => [...prev, {
        id: `ddi-${Date.now()}`,
        medicineIdA: draftMedA, medicineNameA: medA.generic,
        medicineIdB: draftMedB, medicineNameB: medB.generic,
        severity: draftSev, note: draftNote.trim(), enabled: true,
      }]);
    }
    setEditorOpen(false);
  }

  function toggleEnabled(id: string) {
    setInteractions(prev => prev.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  }

  function deleteRule(id: string) {
    setInteractions(prev => prev.filter(i => i.id !== id));
    setDeleteConfirm(null);
    if (editingId === id) setEditorOpen(false);
  }

  const filtered = filter === "All" ? interactions : interactions.filter(i => i.severity === filter);
  const counts = { All: interactions.length, ...Object.fromEntries(SEVERITIES.map(s => [s, interactions.filter(i => i.severity === s).length])) } as Record<string, number>;
  const canSave = draftMedA && draftMedB && draftMedA !== draftMedB && draftNote.trim();

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Interaction List ── */}
      <div className={`flex flex-col border-r border-slate-200 bg-white overflow-hidden transition-all duration-200 ${editorOpen ? "w-[48%]" : "w-full"}`}>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex gap-1 flex-wrap">
            {(["All", ...SEVERITIES] as (InteractionSeverity | "All")[]).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${filter === s
                  ? s === "All" ? "bg-slate-700 text-white border-slate-700" : `${SEV_STYLES[s as InteractionSeverity].badge} border font-black`
                  : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"
                }`}>
                {s} {counts[s] > 0 && <span className="ml-0.5 opacity-60">{counts[s]}</span>}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <Button size="sm" onClick={openAdd} style={{ background: ACCENT }}
            className="text-white text-xs gap-1.5 h-8 flex-shrink-0">
            <Plus className="h-3.5 w-3.5" /> New Rule
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
              <ShieldAlert className="h-8 w-8 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-400">No interaction rules</p>
              <p className="text-xs text-slate-400 mt-1">Add drug-drug interaction rules to alert prescribers</p>
            </div>
          )}
          {filtered.map(rule => {
            const sty = SEV_STYLES[rule.severity];
            return (
              <div key={rule.id}
                className={`px-5 py-3.5 border-b border-slate-100 hover:bg-slate-50 transition-colors ${editingId === rule.id && editorOpen ? "bg-blue-50/50" : ""} ${!rule.enabled ? "opacity-50" : ""}`}>
                {deleteConfirm === rule.id ? (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-700 flex-1">Remove <strong>{rule.medicineNameA} ↔ {rule.medicineNameB}</strong>?</p>
                    <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => deleteRule(rule.id)}>Remove</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <Switch checked={rule.enabled} onCheckedChange={() => toggleEnabled(rule.id)} className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{rule.medicineNameA}</span>
                        <Zap className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-slate-800">{rule.medicineNameB}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${sty.badge}`}>{rule.severity}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{rule.note}</p>
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
            );
          })}
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
            <p className="text-sm font-semibold text-slate-800 flex-1">{editingId ? "Edit Interaction Rule" : "New Interaction Rule"}</p>
            <Button size="sm" onClick={saveRule} disabled={!canSave}
              style={canSave ? { background: ACCENT } : {}}
              className="text-white text-xs gap-1.5 h-8 disabled:opacity-40">
              <Save className="h-3.5 w-3.5" />
              {editingId ? "Save Changes" : "Add Rule"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* Severity */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Severity *</label>
              <div className="flex gap-2 flex-wrap">
                {SEVERITIES.map(s => {
                  const sty = SEV_STYLES[s];
                  return (
                    <button key={s} onClick={() => setDraftSev(s)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                        draftSev === s ? `${sty.badge} border-current` : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"
                      }`}>
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${sty.dot}`} />
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Medicine A */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Medicine A *</label>
              <div className="relative">
                <select value={draftMedA} onChange={e => setDraftMedA(e.target.value)}
                  className="w-full appearance-none text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 pr-8 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 transition-colors">
                  <option value="">Select medicine…</option>
                  {medicines.map(m => (
                    <option key={m.id} value={m.id} disabled={m.id === draftMedB}>{m.generic}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Medicine B */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Medicine B *</label>
              <div className="relative">
                <select value={draftMedB} onChange={e => setDraftMedB(e.target.value)}
                  className="w-full appearance-none text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 pr-8 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 transition-colors">
                  <option value="">Select medicine…</option>
                  {medicines.map(m => (
                    <option key={m.id} value={m.id} disabled={m.id === draftMedA}>{m.generic}</option>
                  ))}
                </select>
              </div>
              {draftMedA && draftMedB && draftMedA === draftMedB && (
                <p className="text-[10px] text-red-500 mt-1">Medicine A and B must be different.</p>
              )}
            </div>

            {/* Clinical note */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">Clinical Note *</label>
              <textarea value={draftNote} onChange={e => setDraftNote(e.target.value)}
                rows={3}
                placeholder="Describe the interaction mechanism and clinical risk…"
                className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 transition-all resize-none placeholder:text-slate-300" />
            </div>

            {/* Preview */}
            {draftMedA && draftMedB && draftMedA !== draftMedB && (
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Preview</label>
                <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border ${SEV_STYLES[draftSev].badge}`}>
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide">
                      {SEV_STYLES[draftSev].label} Interaction
                    </p>
                    <p className="text-[11px] mt-0.5 font-medium">
                      {medicines.find(m => m.id === draftMedA)?.generic} ↔ {medicines.find(m => m.id === draftMedB)?.generic}
                    </p>
                    {draftNote.trim() && <p className="text-[10px] mt-0.5 opacity-80">{draftNote}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
