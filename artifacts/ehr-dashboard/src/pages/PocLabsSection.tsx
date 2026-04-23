import { useState, useRef, useEffect } from "react";
import { Check, X, FlaskConical, Search, Plus, ChevronDown, AlertCircle, SendHorizonal } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

export const POC_TESTS = [
  {
    category: "Metabolic / Blood Chemistry",
    tests: [
      { id: "fingerstick-glucose",  name: "Fingerstick Glucose (Blood glucose)" },
      { id: "bmp-electrolytes",     name: "Basic Metabolic Panel (BMP) / Electrolytes" },
      { id: "hba1c",                name: "Hemoglobin A1c (HbA1c)" },
      { id: "blood-gases",          name: "Blood Gases (ABG/VBG)" },
    ],
  },
  {
    category: "Infectious Disease",
    tests: [
      { id: "rapid-strep",  name: "Rapid Strep Test" },
      { id: "rapid-flu",    name: "Rapid Flu Test (Influenza A/B)" },
      { id: "rapid-covid",  name: "Rapid COVID-19 Antigen Test" },
      { id: "rapid-hiv",    name: "Rapid HIV Screen" },
    ],
  },
  {
    category: "Urine & Stool Tests",
    tests: [
      { id: "urinalysis",       name: "Urinalysis (UA) — Dipstick" },
      { id: "urine-pregnancy",  name: "Urine Pregnancy Test (hCG)" },
      { id: "fobt",             name: "Fecal Occult Blood Test" },
    ],
  },
  {
    category: "Hematology / Coagulation",
    tests: [
      { id: "hgb-hct",    name: "Hemoglobin / Hematocrit (H&H)" },
      { id: "coag-inr-pt", name: "Rapid Coagulation Testing (INR/PT)" },
    ],
  },
  {
    category: "Cardiac Markers",
    tests: [
      { id: "cardiac-troponin", name: "Rapid Cardiac Markers (e.g., Troponin)" },
    ],
  },
  {
    category: "Other",
    tests: [
      { id: "drugs-abuse",  name: "Drugs of Abuse Screening" },
      { id: "peak-flow",    name: "Peak Flow (Respiratory)" },
    ],
  },
];

// ─── Category meta (short label + color) ─────────────────────────────────────

const CATEGORY_META: Record<string, { short: string; color: string; bg: string; border: string }> = {
  "Metabolic / Blood Chemistry": { short: "Metabolic",   color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
  "Infectious Disease":          { short: "Infectious",  color: "#b91c1c", bg: "#fee2e2", border: "#fecaca" },
  "Urine & Stool Tests":         { short: "Urine/Stool", color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" },
  "Hematology / Coagulation":    { short: "Hematology",  color: "#6d28d9", bg: "#ede9fe", border: "#ddd6fe" },
  "Cardiac Markers":             { short: "Cardiac",     color: "#be185d", bg: "#fce7f3", border: "#fbcfe8" },
  "Other":                       { short: "Other",       color: "#475569", bg: "#f1f5f9", border: "#e2e8f0" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PocTestResult {
  id: string;
  name: string;
  category: string;
  status: "pending" | "positive" | "negative" | "sent_to_lab";
}

// ─── Test Selector Dropdown ───────────────────────────────────────────────────

function PocTestSelector({
  selectedIds,
  onAdd,
}: {
  selectedIds: string[];
  onAdd: (test: { id: string; name: string; category: string }) => void;
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const filteredGroups = POC_TESTS.map(g => ({
    ...g,
    tests: g.tests.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) && !selectedIds.includes(t.id),
    ),
  })).filter(g => g.tests.length > 0);

  const allDone = POC_TESTS.every(g => g.tests.every(t => selectedIds.includes(t.id)));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={allDone}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#4982CF] hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1.5 rounded-lg hover:bg-blue-50">
        <Plus className="h-3.5 w-3.5" /> Add POC Test
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-40 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
            <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search POC test…"
              className="flex-1 text-xs outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredGroups.map(group => {
              const meta = CATEGORY_META[group.category] ?? CATEGORY_META["Other"];
              return (
                <div key={group.category}>
                  <p className="px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest"
                    style={{ color: meta.color }}>
                    {group.category}
                  </p>
                  {group.tests.map(test => (
                    <button
                      key={test.id}
                      onClick={() => {
                        onAdd({ id: test.id, name: test.name, category: group.category });
                        setSearch("");
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors pl-5">
                      {test.name}
                    </button>
                  ))}
                </div>
              );
            })}
            {filteredGroups.length === 0 && (
              <p className="px-3 py-4 text-xs text-slate-400 italic text-center">
                {search ? "No tests match your search" : "All tests added"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Individual Test Row ──────────────────────────────────────────────────────

function PocTestRow({
  test, onChange, onRemove,
}: {
  test: PocTestResult;
  onChange: (t: PocTestResult) => void;
  onRemove: () => void;
}) {
  const meta = CATEGORY_META[test.category] ?? CATEGORY_META["Other"];

  function setStatus(s: PocTestResult["status"]) {
    onChange({ ...test, status: test.status === s ? "pending" : s });
  }

  const isSentToLab = test.status === "sent_to_lab";

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white transition-colors"
      style={{ borderColor: isSentToLab ? "#bfdbfe" : test.status === "positive" ? "#fecaca" : test.status === "negative" ? "#bbf7d0" : "#e2e8f0" }}>

      {/* Category chip */}
      <span
        className="flex-shrink-0 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border"
        style={{ backgroundColor: meta.bg, color: meta.color, borderColor: meta.border }}>
        {meta.short}
      </span>

      {/* Test name */}
      <span className="flex-1 text-xs font-medium text-slate-700 truncate">{test.name}</span>

      {/* Result buttons — hidden when sent to lab */}
      {!isSentToLab && (
        <>
          <button
            onClick={() => setStatus("negative")}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex-shrink-0"
            style={test.status === "negative"
              ? { backgroundColor: "#22c55e", color: "white", borderColor: "#22c55e" }
              : { backgroundColor: "white", color: "#64748b", borderColor: "#e2e8f0" }}>
            <Check className="h-3 w-3" />
            Negative
          </button>

          <button
            onClick={() => setStatus("positive")}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex-shrink-0"
            style={test.status === "positive"
              ? { backgroundColor: "#ef4444", color: "white", borderColor: "#ef4444" }
              : { backgroundColor: "white", color: "#64748b", borderColor: "#e2e8f0" }}>
            <AlertCircle className="h-3 w-3" />
            Positive
          </button>
        </>
      )}

      {/* Send to Lab */}
      {isSentToLab ? (
        <button
          onClick={() => setStatus("sent_to_lab")}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex-shrink-0 transition-all"
          style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", borderColor: "#bfdbfe" }}
          title="Click to undo">
          <FlaskConical className="h-3 w-3" />
          Sent to Lab
        </button>
      ) : (
        <button
          onClick={() => setStatus("sent_to_lab")}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-[#4982CF]/50 hover:text-[#4982CF] hover:bg-blue-50 transition-all flex-shrink-0">
          <SendHorizonal className="h-3 w-3" />
          Lab
        </button>
      )}

      {/* Remove */}
      <button
        onClick={onRemove}
        className="h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-lg border border-transparent hover:border-red-100 hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── POC Labs Panel ───────────────────────────────────────────────────────────

interface PocLabsPanelProps {
  tests: PocTestResult[];
  onChange: (tests: PocTestResult[]) => void;
}

export function PocLabsPanel({ tests, onChange }: PocLabsPanelProps) {
  function addTest(t: { id: string; name: string; category: string }) {
    if (tests.some(x => x.id === t.id)) return;
    onChange([...tests, { ...t, status: "pending" }]);
  }
  function updateTest(id: string, updated: PocTestResult) {
    onChange(tests.map(t => t.id === id ? updated : t));
  }
  function removeTest(id: string) {
    onChange(tests.filter(t => t.id !== id));
  }

  const pending  = tests.filter(t => t.status === "pending").length;
  const done     = tests.filter(t => t.status !== "pending" && t.status !== "sent_to_lab").length;
  const sentLab  = tests.filter(t => t.status === "sent_to_lab").length;

  return (
    <div className="space-y-2">
      {/* Legend / summary strip (only shown when tests selected) */}
      {tests.length > 0 && (
        <div className="flex items-center gap-3 px-1 mb-1">
          {done > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {done} result{done > 1 ? "s" : ""} recorded
            </span>
          )}
          {sentLab > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              {sentLab} sent to lab
            </span>
          )}
          {pending > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
              {pending} pending
            </span>
          )}
        </div>
      )}

      {/* Test rows */}
      {tests.map(test => (
        <PocTestRow
          key={test.id}
          test={test}
          onChange={updated => updateTest(test.id, updated)}
          onRemove={() => removeTest(test.id)}
        />
      ))}

      {/* Add button */}
      <PocTestSelector selectedIds={tests.map(t => t.id)} onAdd={addTest} />
    </div>
  );
}
