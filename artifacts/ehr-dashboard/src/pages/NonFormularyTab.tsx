import { useState, useEffect } from "react";
import { Edit2, FileMinus, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { loadNFSettings, saveNFSettings } from "@/pages/nonFormularyUtils";
import type { NonFormularySettings } from "@/pages/nonFormularyUtils";

const ACCENT = "#4982CF";

export function NonFormularyTab() {
  const [settings, setSettings] = useState<NonFormularySettings>(loadNFSettings);
  const [newReason, setNewReason] = useState("");
  const [editIdx,   setEditIdx]   = useState<number | null>(null);
  const [editVal,   setEditVal]   = useState("");

  useEffect(() => { saveNFSettings(settings); }, [settings]);

  function patch(partial: Partial<NonFormularySettings>) {
    setSettings(prev => ({ ...prev, ...partial }));
  }

  function addReason() {
    const v = newReason.trim();
    if (!v) return;
    patch({ presetReasons: [...settings.presetReasons, v] });
    setNewReason("");
  }

  function deleteReason(idx: number) {
    patch({ presetReasons: settings.presetReasons.filter((_, i) => i !== idx) });
    if (editIdx === idx) setEditIdx(null);
  }

  function saveEdit(idx: number) {
    const v = editVal.trim();
    if (!v) return;
    patch({ presetReasons: settings.presetReasons.map((r, i) => i === idx ? v : r) });
    setEditIdx(null);
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7 max-w-2xl">

      {/* ── Allow NF prescribing ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-800">Non-Formulary Prescribing</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            When enabled, clinicians can add prescriptions for drugs not in the approved formulary.
            These are flagged with an <span className="font-bold text-amber-600">NF</span> badge in the prescription list.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 py-3 border-t border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-700">Allow non-formulary prescriptions</p>
            <p className="text-xs text-slate-400">Clinicians can prescribe drugs outside the formulary catalogue</p>
          </div>
          <Switch checked={settings.enabled} onCheckedChange={v => patch({ enabled: v })} />
        </div>

        {settings.enabled && (
          <div className="flex items-center justify-between gap-4 py-3 border-t border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-700">Require justification</p>
              <p className="text-xs text-slate-400">
                Clinician must provide a reason before adding a non-formulary prescription
              </p>
            </div>
            <Switch checked={settings.requireJustification} onCheckedChange={v => patch({ requireJustification: v })} />
          </div>
        )}
      </div>

      {/* ── Preset Reasons ── */}
      {settings.enabled && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-800">Preset Justification Reasons</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clinicians can pick from these options (or enter custom text) when providing a justification.
            </p>
          </div>

          <div className="space-y-2">
            {settings.presetReasons.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-3">No preset reasons. Add one below.</p>
            )}
            {settings.presetReasons.map((reason, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {editIdx === idx ? (
                  <>
                    <input
                      value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(idx); if (e.key === "Escape") setEditIdx(null); }}
                      autoFocus
                      className="flex-1 text-xs text-slate-700 border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20"
                    />
                    <button onClick={() => saveEdit(idx)}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-blue-50 text-blue-500 transition-colors">
                      <Save className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditIdx(null)}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                      {reason}
                    </span>
                    <button onClick={() => { setEditIdx(idx); setEditVal(reason); }}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteReason(idx)}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add new reason */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <input
              value={newReason}
              onChange={e => setNewReason(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addReason(); }}
              placeholder="Add a preset reason…"
              className="flex-1 text-xs text-slate-700 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#4982CF]/50 focus:ring-1 focus:ring-[#4982CF]/20 placeholder:text-slate-300"
            />
            <Button size="sm" onClick={addReason} disabled={!newReason.trim()}
              style={newReason.trim() ? { background: ACCENT } : {}}
              className="text-white text-xs gap-1.5 h-8 disabled:opacity-40">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </div>
      )}

      {/* ── Info box ── */}
      {settings.enabled && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-amber-50 border border-amber-200">
          <FileMinus className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-700">How non-formulary prescribing works</p>
            <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">
              In the prescription drawer, clinicians will see a <strong>Formulary / Non-Formulary</strong> toggle.
              Switching to Non-Formulary replaces the medicine search with free-text fields for drug name, brand, and strength.
              Non-formulary items appear with an <strong>NF</strong> badge in the prescription list.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
