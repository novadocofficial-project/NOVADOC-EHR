import { useState } from "react";
import {
  ChevronLeft, X, Search, CheckCircle2, ClipboardCheck,
  FlaskConical, Plus, AlertCircle, Check, SendHorizonal,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

export const POC_TESTS = [
  {
    category: "Metabolic / Blood Chemistry",
    tests: [
      { id: "poc-fingerstick-glucose",  name: "Fingerstick Glucose (Blood glucose)" },
      { id: "poc-bmp-electrolytes",     name: "Basic Metabolic Panel (BMP) / Electrolytes" },
      { id: "poc-hba1c",                name: "Hemoglobin A1c (HbA1c)" },
      { id: "poc-blood-gases",          name: "Blood Gases (ABG/VBG)" },
    ],
  },
  {
    category: "Infectious Disease",
    tests: [
      { id: "poc-rapid-strep",  name: "Rapid Strep Test" },
      { id: "poc-rapid-flu",    name: "Rapid Flu Test (Influenza A/B)" },
      { id: "poc-rapid-covid",  name: "Rapid COVID-19 Antigen Test" },
      { id: "poc-rapid-hiv",    name: "Rapid HIV Screen" },
    ],
  },
  {
    category: "Urine & Stool Tests",
    tests: [
      { id: "poc-urinalysis",      name: "Urinalysis (UA) — Dipstick" },
      { id: "poc-urine-pregnancy", name: "Urine Pregnancy Test (hCG)" },
      { id: "poc-fobt",            name: "Fecal Occult Blood Test" },
    ],
  },
  {
    category: "Hematology / Coagulation",
    tests: [
      { id: "poc-hgb-hct",     name: "Hemoglobin / Hematocrit (H&H)" },
      { id: "poc-coag-inr-pt", name: "Rapid Coagulation Testing (INR/PT)" },
    ],
  },
  {
    category: "Cardiac Markers",
    tests: [
      { id: "poc-cardiac-troponin", name: "Rapid Cardiac Markers (e.g., Troponin)" },
    ],
  },
  {
    category: "Other",
    tests: [
      { id: "poc-drugs-abuse", name: "Drugs of Abuse Screening" },
      { id: "poc-peak-flow",   name: "Peak Flow (Respiratory)" },
    ],
  },
];

// ─── Category meta ────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { short: string; color: string; bg: string; border: string }> = {
  "Metabolic / Blood Chemistry": { short: "Metabolic",   color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
  "Infectious Disease":          { short: "Infectious",  color: "#b91c1c", bg: "#fee2e2", border: "#fecaca" },
  "Urine & Stool Tests":         { short: "Urine/Stool", color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" },
  "Hematology / Coagulation":    { short: "Hematology",  color: "#6d28d9", bg: "#ede9fe", border: "#ddd6fe" },
  "Cardiac Markers":             { short: "Cardiac",     color: "#be185d", bg: "#fce7f3", border: "#fbcfe8" },
  "Other":                       { short: "Other",       color: "#475569", bg: "#f1f5f9", border: "#e2e8f0" },
};

const STATUS_STYLE = {
  negative:    { bg: "#f0fdf4", border: "#86efac", color: "#15803d", label: "NEG" },
  positive:    { bg: "#fff5f5", border: "#fca5a5", color: "#dc2626", label: "POS" },
  sent_to_lab: { bg: "#eff6ff", border: "#93c5fd", color: "#1d4ed8", label: "LAB" },
  pending:     { bg: "#f8fafc", border: "#e2e8f0", color: "#94a3b8", label: ""    },
};

// ─── Type ─────────────────────────────────────────────────────────────────────

export interface PocTestResult {
  id: string;
  name: string;
  category: string;
  status: "pending" | "positive" | "negative" | "sent_to_lab";
}

// ─── Chips Panel (shown in SOAP note section) ─────────────────────────────────

export function PocLabsChipsPanel({
  tests,
  onOpen,
}: {
  tests: PocTestResult[];
  onOpen: () => void;
}) {
  if (tests.length === 0) {
    return (
      <button
        onClick={onOpen}
        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl bg-amber-50/60 border-2 border-dashed border-amber-200 text-amber-600 font-bold text-xs hover:border-amber-400 hover:bg-amber-50 transition-all">
        <Plus className="h-4 w-4 flex-shrink-0" />
        Add POC tests…
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {/* Test chips */}
      <div className="flex flex-wrap gap-1.5">
        {tests.map(test => {
          const ss = STATUS_STYLE[test.status];
          return (
            <div
              key={test.id}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold"
              style={{ backgroundColor: ss.bg, borderColor: ss.border, color: ss.color }}>
              <FlaskConical className="h-2.5 w-2.5 flex-shrink-0" />
              {test.name}
              {test.status !== "pending" && (
                <span
                  className="text-[8px] font-black px-1 py-0.5 rounded ml-0.5"
                  style={{ backgroundColor: ss.border }}>
                  {ss.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit button */}
      <button
        onClick={onOpen}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl border border-amber-200 text-amber-600 text-xs font-bold hover:bg-amber-50 transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Edit POC tests ({tests.length} test{tests.length !== 1 ? "s" : ""})
      </button>
    </div>
  );
}

// ─── Result Buttons Row ───────────────────────────────────────────────────────

function ResultButtons({
  test,
  onStatusChange,
  onRemove,
  compact = false,
}: {
  test: PocTestResult;
  onStatusChange: (id: string, s: PocTestResult["status"]) => void;
  onRemove: (id: string) => void;
  compact?: boolean;
}) {
  const meta = CATEGORY_META[test.category] ?? CATEGORY_META["Other"];
  const isSentToLab = test.status === "sent_to_lab";
  const px = compact ? "px-2 py-1" : "px-2.5 py-1.5";
  const fontSize = compact ? "text-[10px]" : "text-[11px]";

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-2 rounded-xl border bg-white transition-all"
      style={{
        borderColor:
          isSentToLab
            ? "#93c5fd"
            : test.status === "positive"
            ? "#fca5a5"
            : test.status === "negative"
            ? "#86efac"
            : "#e2e8f0",
      }}>
      {/* Category chip */}
      <span
        className="flex-shrink-0 text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full border"
        style={{ backgroundColor: meta.bg, color: meta.color, borderColor: meta.border }}>
        {meta.short}
      </span>

      {/* Name */}
      <span className="flex-1 text-xs font-medium text-slate-700 truncate min-w-0">{test.name}</span>

      {/* Result buttons — hidden when sent to lab */}
      {!isSentToLab && (
        <>
          <button
            onClick={() => onStatusChange(test.id, "negative")}
            className={`flex items-center gap-1 ${fontSize} font-bold ${px} rounded-lg border transition-all flex-shrink-0`}
            style={
              test.status === "negative"
                ? { backgroundColor: "#22c55e", color: "white", borderColor: "#22c55e" }
                : { backgroundColor: "white", color: "#64748b", borderColor: "#e2e8f0" }
            }>
            <Check className="h-3 w-3" />
            Negative
          </button>
          <button
            onClick={() => onStatusChange(test.id, "positive")}
            className={`flex items-center gap-1 ${fontSize} font-bold ${px} rounded-lg border transition-all flex-shrink-0`}
            style={
              test.status === "positive"
                ? { backgroundColor: "#ef4444", color: "white", borderColor: "#ef4444" }
                : { backgroundColor: "white", color: "#64748b", borderColor: "#e2e8f0" }
            }>
            <AlertCircle className="h-3 w-3" />
            Positive
          </button>
        </>
      )}

      {/* Send to Lab */}
      {isSentToLab ? (
        <button
          onClick={() => onStatusChange(test.id, "sent_to_lab")}
          title="Click to undo"
          className={`flex items-center gap-1.5 ${fontSize} font-bold ${px} rounded-lg border flex-shrink-0 transition-all`}
          style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", borderColor: "#93c5fd" }}>
          <FlaskConical className="h-3 w-3" />
          Sent to Lab
        </button>
      ) : (
        <button
          onClick={() => onStatusChange(test.id, "sent_to_lab")}
          className={`flex items-center gap-1.5 ${fontSize} font-bold ${px} rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex-shrink-0`}>
          <SendHorizonal className="h-3 w-3" />
          Send to Lab
        </button>
      )}

      {/* Remove */}
      <button
        onClick={() => onRemove(test.id)}
        className="h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-lg border border-transparent hover:border-red-100 hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── POC Labs Drawer ──────────────────────────────────────────────────────────

interface PocLabsDrawerProps {
  savedTests: PocTestResult[];
  onSave:     (tests: PocTestResult[]) => void;
  onClose:    () => void;
}

export function PocLabsDrawer({ savedTests, onSave, onClose }: PocLabsDrawerProps) {
  const [localTests,        setLocalTests]        = useState<PocTestResult[]>(savedTests);
  const [selectedCategory,  setSelectedCategory]  = useState(POC_TESTS[0].category);
  const [search,            setSearch]            = useState("");

  const selectedIds = localTests.map(t => t.id);
  const allResulted = localTests.length > 0 && localTests.every(t => t.status !== "pending");

  function toggleTest(test: { id: string; name: string }, category: string) {
    if (selectedIds.includes(test.id)) {
      setLocalTests(prev => prev.filter(t => t.id !== test.id));
    } else {
      setLocalTests(prev => [...prev, { id: test.id, name: test.name, category, status: "pending" }]);
    }
  }

  function updateStatus(id: string, status: PocTestResult["status"]) {
    setLocalTests(prev =>
      prev.map(t => t.id === id ? { ...t, status: t.status === status ? "pending" : status } : t)
    );
  }

  function removeTest(id: string) {
    setLocalTests(prev => prev.filter(t => t.id !== id));
  }

  const displayGroups = search.trim()
    ? POC_TESTS.map(g => ({
        ...g,
        tests: g.tests.filter(t => t.name.toLowerCase().includes(search.toLowerCase())),
      })).filter(g => g.tests.length > 0)
    : POC_TESTS.filter(g => g.category === selectedCategory);

  const pendingCount = localTests.filter(t => t.status === "pending").length;
  const negCount     = localTests.filter(t => t.status === "negative").length;
  const posCount     = localTests.filter(t => t.status === "positive").length;
  const labCount     = localTests.filter(t => t.status === "sent_to_lab").length;

  return (
    <div className="absolute inset-y-0 right-0 w-[68%] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-20">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Clinical Note</p>
          <p className="text-sm font-black text-slate-800">Point of Care Labs</p>
        </div>
        {allResulted ? (
          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        ) : (
          <button
            onClick={() => { onSave(localTests); onClose(); }}
            className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg bg-[#f59e0b] text-white hover:bg-amber-500 transition-colors flex-shrink-0">
            <ClipboardCheck className="h-3.5 w-3.5" /> Save
          </button>
        )}
      </div>

      {/* ── Search bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 flex-shrink-0">
        <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search POC tests…"
          className="flex-1 text-xs outline-none text-slate-700 placeholder:text-slate-400"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Body: sidebar + test list ── */}
      <div className="flex flex-1 min-h-0">

        {/* Category sidebar — hidden when searching */}
        {!search.trim() && (
          <div className="w-28 flex-shrink-0 border-r border-slate-100 overflow-y-auto py-2">
            {POC_TESTS.map(g => {
              const meta    = CATEGORY_META[g.category] ?? CATEGORY_META["Other"];
              const active  = selectedCategory === g.category;
              const count   = localTests.filter(t => t.category === g.category).length;
              return (
                <button
                  key={g.category}
                  onClick={() => setSelectedCategory(g.category)}
                  className="w-full text-left px-3 py-2.5 text-[10px] font-bold transition-colors leading-tight relative"
                  style={{
                    backgroundColor: active ? meta.bg : "transparent",
                    color:           active ? meta.color : "#64748b",
                    borderRight:     active ? `2px solid ${meta.color}` : "2px solid transparent",
                  }}>
                  {meta.short}
                  {count > 0 && (
                    <span
                      className="absolute top-1.5 right-2 text-[8px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full"
                      style={{ backgroundColor: meta.color, color: "white" }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Test list */}
        <div className="flex-1 overflow-y-auto">
          {search.trim() && displayGroups.length === 0 && (
            <p className="px-4 py-8 text-xs text-slate-400 italic text-center">No tests match "{search}"</p>
          )}
          {displayGroups.map(group => (
            <div key={group.category}>
              {search.trim() && (
                <p
                  className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest"
                  style={{ color: CATEGORY_META[group.category]?.color ?? "#64748b" }}>
                  {group.category}
                </p>
              )}
              {group.tests.map(test => {
                const isSelected = selectedIds.includes(test.id);
                return (
                  <button
                    key={test.id}
                    onClick={() => toggleTest(test, group.category)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                        isSelected ? "bg-[#f59e0b] border-[#f59e0b]" : "border-slate-300 bg-white"
                      }`}>
                      {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <span className="text-xs text-slate-700 font-medium flex-1">{test.name}</span>
                    {isSelected && (
                      <span className="text-[9px] font-black text-amber-500 flex-shrink-0">Selected</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Selected Tests Panel ── */}
      {localTests.length > 0 && (
        <div className="border-t-2 border-slate-100 flex-shrink-0 flex flex-col" style={{ maxHeight: "50%" }}>

          {/* Panel header with summary */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-wide">
                Selected ({localTests.length})
              </p>
              {negCount > 0 && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {negCount} NEG
                </span>
              )}
              {posCount > 0 && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                  {posCount} POS
                </span>
              )}
              {labCount > 0 && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {labCount} LAB
                </span>
              )}
              {pendingCount > 0 && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  {pendingCount} PENDING
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-400 italic">Mark result or send to lab</span>
          </div>

          {/* Test rows */}
          <div className="overflow-y-auto flex-1 px-3 py-2 space-y-1.5">
            {localTests.map(test => (
              <ResultButtons
                key={test.id}
                test={test}
                onStatusChange={updateStatus}
                onRemove={removeTest}
                compact
              />
            ))}
          </div>

          {/* Footer buttons */}
          <div className="px-3 pb-3 pt-2 border-t border-slate-100 flex gap-2 flex-shrink-0">
            <button
              onClick={() => onSave(localTests)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-black hover:bg-amber-100 transition-colors">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Save Draft
            </button>
            <button
              onClick={() => { onSave(localTests); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f59e0b] text-white text-xs font-black hover:bg-amber-500 transition-colors">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Done
            </button>
          </div>
        </div>
      )}

      {localTests.length === 0 && (
        <div className="border-t border-slate-100 px-4 py-3 flex-shrink-0">
          <p className="text-xs text-slate-400 text-center italic">Select tests above to get started</p>
        </div>
      )}

    </div>
  );
}
