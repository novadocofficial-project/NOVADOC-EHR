import { useState } from "react";
import {
  ChevronLeft, X, Search, CheckCircle2, ClipboardCheck,
  FlaskConical, Plus, Layers, ListChecks, AlertCircle, Clock,
} from "lucide-react";

// ─── Accent ───────────────────────────────────────────────────────────────────

const ACCENT_LAB = "#f59e0b";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LabTestEntry {
  id:              string;
  name:            string;
  category:        string;
  fastingRequired: boolean;
  sampleType:      string;
}

export interface LabOrder {
  id:               string;  // always present; assigned by ClinicalNoteDrawer on first save
  tests:            LabTestEntry[];
  patientCondition: string;
  instructions:     string;
  orderSetName:     string | null;
  sentAt?:          string;
  voided?:          boolean;
  voidedAt?:        string;
  voidReason?:      string;
  returnedFromLab?: boolean; // set when Cancel Lab Queue is used; marks the order that triggered the lab visit
}

// ─── Lab Categories ───────────────────────────────────────────────────────────

export const LAB_CATEGORIES = [
  "Hematology",
  "Blood Chemistry",
  "Liver Function",
  "Kidney Function",
  "Lipids",
  "Cardiac Markers",
  "Inflammatory Markers",
  "Coagulation",
  "Hormones & Endocrinology",
  "Microbiology",
  "Immunology & Serology",
  "Urinalysis",
];

// ─── Patient Conditions ───────────────────────────────────────────────────────

export const PATIENT_CONDITIONS = [
  "Random",
  "Fasting (8 hours)",
  "Fasting (12 hours)",
  "2-hour postprandial",
  "Early morning (first void)",
  "Post-medication",
];

// ─── Lab Tests Database ───────────────────────────────────────────────────────

export const LAB_TESTS: LabTestEntry[] = [
  // Hematology
  { id: "cbc",        name: "Complete Blood Count (CBC)",        category: "Hematology",               fastingRequired: false, sampleType: "Blood"  },
  { id: "esr",        name: "Erythrocyte Sedimentation Rate (ESR)", category: "Hematology",            fastingRequired: false, sampleType: "Blood"  },
  { id: "pbf",        name: "Peripheral Blood Film",             category: "Hematology",               fastingRequired: false, sampleType: "Blood"  },
  { id: "reticulocyte",name: "Reticulocyte Count",               category: "Hematology",               fastingRequired: false, sampleType: "Blood"  },
  { id: "blood_group",name: "Blood Group & Screen",              category: "Hematology",               fastingRequired: false, sampleType: "Blood"  },
  { id: "sickle",     name: "Sickle Cell Screen",                category: "Hematology",               fastingRequired: false, sampleType: "Blood"  },

  // Blood Chemistry
  { id: "glucose_f",  name: "Glucose (Fasting)",                 category: "Blood Chemistry",          fastingRequired: true,  sampleType: "Blood"  },
  { id: "glucose_r",  name: "Glucose (Random)",                  category: "Blood Chemistry",          fastingRequired: false, sampleType: "Blood"  },
  { id: "glucose_2h", name: "Glucose (2-hr postprandial)",       category: "Blood Chemistry",          fastingRequired: false, sampleType: "Blood"  },
  { id: "hba1c",      name: "HbA1c (Glycated Haemoglobin)",      category: "Blood Chemistry",          fastingRequired: false, sampleType: "Blood"  },
  { id: "bun",        name: "Blood Urea Nitrogen (BUN)",         category: "Blood Chemistry",          fastingRequired: false, sampleType: "Blood"  },
  { id: "uric_acid",  name: "Uric Acid",                         category: "Blood Chemistry",          fastingRequired: true,  sampleType: "Blood"  },
  { id: "sodium",     name: "Sodium (Na⁺)",                      category: "Blood Chemistry",          fastingRequired: false, sampleType: "Blood"  },
  { id: "potassium",  name: "Potassium (K⁺)",                    category: "Blood Chemistry",          fastingRequired: false, sampleType: "Blood"  },
  { id: "chloride",   name: "Chloride (Cl⁻)",                    category: "Blood Chemistry",          fastingRequired: false, sampleType: "Blood"  },
  { id: "calcium",    name: "Calcium (Total)",                   category: "Blood Chemistry",          fastingRequired: true,  sampleType: "Blood"  },
  { id: "phosphate",  name: "Phosphate (Inorganic)",             category: "Blood Chemistry",          fastingRequired: true,  sampleType: "Blood"  },
  { id: "magnesium",  name: "Magnesium",                         category: "Blood Chemistry",          fastingRequired: true,  sampleType: "Blood"  },

  // Liver Function
  { id: "alt",        name: "ALT (Alanine Aminotransferase)",    category: "Liver Function",           fastingRequired: false, sampleType: "Blood"  },
  { id: "ast",        name: "AST (Aspartate Aminotransferase)",  category: "Liver Function",           fastingRequired: false, sampleType: "Blood"  },
  { id: "alp",        name: "ALP (Alkaline Phosphatase)",        category: "Liver Function",           fastingRequired: false, sampleType: "Blood"  },
  { id: "ggt",        name: "GGT (Gamma-Glutamyl Transferase)",  category: "Liver Function",           fastingRequired: false, sampleType: "Blood"  },
  { id: "bilirubin_t",name: "Total Bilirubin",                   category: "Liver Function",           fastingRequired: false, sampleType: "Blood"  },
  { id: "bilirubin_d",name: "Direct Bilirubin",                  category: "Liver Function",           fastingRequired: false, sampleType: "Blood"  },
  { id: "albumin",    name: "Albumin",                           category: "Liver Function",           fastingRequired: false, sampleType: "Blood"  },
  { id: "total_protein",name: "Total Protein",                   category: "Liver Function",           fastingRequired: false, sampleType: "Blood"  },

  // Kidney Function
  { id: "creatinine", name: "Creatinine (Serum)",                category: "Kidney Function",          fastingRequired: false, sampleType: "Blood"  },
  { id: "egfr",       name: "eGFR (Estimated Glomerular Rate)",  category: "Kidney Function",          fastingRequired: false, sampleType: "Blood"  },
  { id: "cystatin_c", name: "Cystatin C",                        category: "Kidney Function",          fastingRequired: false, sampleType: "Blood"  },

  // Lipids
  { id: "cholesterol",name: "Total Cholesterol",                 category: "Lipids",                   fastingRequired: true,  sampleType: "Blood"  },
  { id: "ldl",        name: "LDL Cholesterol",                   category: "Lipids",                   fastingRequired: true,  sampleType: "Blood"  },
  { id: "hdl",        name: "HDL Cholesterol",                   category: "Lipids",                   fastingRequired: true,  sampleType: "Blood"  },
  { id: "tg",         name: "Triglycerides",                     category: "Lipids",                   fastingRequired: true,  sampleType: "Blood"  },
  { id: "non_hdl",    name: "Non-HDL Cholesterol",               category: "Lipids",                   fastingRequired: true,  sampleType: "Blood"  },
  { id: "lp_a",       name: "Lipoprotein (a)",                   category: "Lipids",                   fastingRequired: true,  sampleType: "Blood"  },

  // Cardiac Markers
  { id: "troponin_i", name: "Troponin I (High-Sensitivity)",     category: "Cardiac Markers",          fastingRequired: false, sampleType: "Blood"  },
  { id: "ck_mb",      name: "CK-MB (Creatine Kinase-MB)",        category: "Cardiac Markers",          fastingRequired: false, sampleType: "Blood"  },
  { id: "bnp",        name: "BNP (Brain Natriuretic Peptide)",   category: "Cardiac Markers",          fastingRequired: false, sampleType: "Blood"  },
  { id: "nt_pro_bnp", name: "NT-proBNP",                         category: "Cardiac Markers",          fastingRequired: false, sampleType: "Blood"  },
  { id: "myoglobin",  name: "Myoglobin",                         category: "Cardiac Markers",          fastingRequired: false, sampleType: "Blood"  },

  // Inflammatory Markers
  { id: "crp",        name: "C-Reactive Protein (CRP)",          category: "Inflammatory Markers",     fastingRequired: false, sampleType: "Blood"  },
  { id: "crp_hs",     name: "High-Sensitivity CRP (hsCRP)",      category: "Inflammatory Markers",     fastingRequired: false, sampleType: "Blood"  },
  { id: "pct",        name: "Procalcitonin (PCT)",                category: "Inflammatory Markers",     fastingRequired: false, sampleType: "Blood"  },
  { id: "ferritin",   name: "Ferritin",                           category: "Inflammatory Markers",     fastingRequired: false, sampleType: "Blood"  },
  { id: "il6",        name: "Interleukin-6 (IL-6)",               category: "Inflammatory Markers",     fastingRequired: false, sampleType: "Blood"  },
  { id: "ldh",        name: "LDH (Lactate Dehydrogenase)",        category: "Inflammatory Markers",     fastingRequired: false, sampleType: "Blood"  },

  // Coagulation
  { id: "pt_inr",     name: "PT / INR",                          category: "Coagulation",              fastingRequired: false, sampleType: "Blood"  },
  { id: "aptt",       name: "APTT (Activated Partial Thromboplastin Time)", category: "Coagulation",   fastingRequired: false, sampleType: "Blood"  },
  { id: "fibrinogen", name: "Fibrinogen",                         category: "Coagulation",              fastingRequired: false, sampleType: "Blood"  },
  { id: "d_dimer",    name: "D-Dimer",                            category: "Coagulation",              fastingRequired: false, sampleType: "Blood"  },
  { id: "bleeding_time",name: "Bleeding Time / Clotting Time",   category: "Coagulation",              fastingRequired: false, sampleType: "Blood"  },

  // Hormones & Endocrinology
  { id: "tsh",        name: "TSH (Thyroid Stimulating Hormone)", category: "Hormones & Endocrinology", fastingRequired: true,  sampleType: "Blood"  },
  { id: "ft4",        name: "Free T4 (Free Thyroxine)",          category: "Hormones & Endocrinology", fastingRequired: true,  sampleType: "Blood"  },
  { id: "ft3",        name: "Free T3 (Free Triiodothyronine)",   category: "Hormones & Endocrinology", fastingRequired: true,  sampleType: "Blood"  },
  { id: "insulin",    name: "Insulin (Fasting)",                  category: "Hormones & Endocrinology", fastingRequired: true,  sampleType: "Blood"  },
  { id: "cortisol",   name: "Cortisol (8 AM)",                   category: "Hormones & Endocrinology", fastingRequired: false, sampleType: "Blood"  },
  { id: "fsh",        name: "FSH (Follicle-Stimulating Hormone)", category: "Hormones & Endocrinology",fastingRequired: false, sampleType: "Blood"  },
  { id: "lh",         name: "LH (Luteinizing Hormone)",           category: "Hormones & Endocrinology",fastingRequired: false, sampleType: "Blood"  },
  { id: "testosterone",name: "Testosterone (Total)",              category: "Hormones & Endocrinology",fastingRequired: false, sampleType: "Blood"  },
  { id: "prolactin",  name: "Prolactin",                          category: "Hormones & Endocrinology",fastingRequired: false, sampleType: "Blood"  },
  { id: "vitamin_d",  name: "25-OH Vitamin D",                   category: "Hormones & Endocrinology", fastingRequired: false, sampleType: "Blood"  },
  { id: "vitamin_b12",name: "Vitamin B12 (Cobalamin)",           category: "Hormones & Endocrinology", fastingRequired: false, sampleType: "Blood"  },
  { id: "folate",     name: "Folate (Serum)",                    category: "Hormones & Endocrinology", fastingRequired: true,  sampleType: "Blood"  },

  // Microbiology
  { id: "blood_cx",   name: "Blood Culture × 2",                 category: "Microbiology",             fastingRequired: false, sampleType: "Blood"  },
  { id: "urine_cx",   name: "Urine Culture & Sensitivity",       category: "Microbiology",             fastingRequired: false, sampleType: "Urine"  },
  { id: "sputum_cs",  name: "Sputum Culture & Sensitivity",      category: "Microbiology",             fastingRequired: false, sampleType: "Sputum" },
  { id: "stool_cs",   name: "Stool Culture & Sensitivity",       category: "Microbiology",             fastingRequired: false, sampleType: "Stool"  },
  { id: "throat_sw",  name: "Throat Swab C&S",                   category: "Microbiology",             fastingRequired: false, sampleType: "Swab"   },

  // Immunology & Serology
  { id: "hbsag",      name: "HBsAg (Hepatitis B Surface Antigen)",category: "Immunology & Serology",   fastingRequired: false, sampleType: "Blood"  },
  { id: "anti_hcv",   name: "Anti-HCV (Hepatitis C Antibody)",   category: "Immunology & Serology",   fastingRequired: false, sampleType: "Blood"  },
  { id: "hiv",        name: "HIV 1 & 2 Antibody Screen",         category: "Immunology & Serology",   fastingRequired: false, sampleType: "Blood"  },
  { id: "vdrl",       name: "VDRL / RPR (Syphilis)",             category: "Immunology & Serology",   fastingRequired: false, sampleType: "Blood"  },
  { id: "rf",         name: "Rheumatoid Factor (RF)",            category: "Immunology & Serology",   fastingRequired: false, sampleType: "Blood"  },
  { id: "ana",        name: "ANA (Anti-Nuclear Antibody)",        category: "Immunology & Serology",   fastingRequired: false, sampleType: "Blood"  },
  { id: "aso",        name: "ASO Titre (Anti-Streptolysin O)",   category: "Immunology & Serology",   fastingRequired: false, sampleType: "Blood"  },
  { id: "widal",      name: "Widal Test (Typhoid)",               category: "Immunology & Serology",   fastingRequired: false, sampleType: "Blood"  },

  // Urinalysis
  { id: "urine_re",   name: "Urine Routine Examination (R/E)",   category: "Urinalysis",               fastingRequired: false, sampleType: "Urine"  },
  { id: "urine_alb",  name: "Urine Microalbumin (Spot)",         category: "Urinalysis",               fastingRequired: false, sampleType: "Urine"  },
  { id: "upcr",       name: "Urine Protein:Creatinine Ratio",    category: "Urinalysis",               fastingRequired: false, sampleType: "Urine"  },
  { id: "urine_24h",  name: "24-Hour Urine Protein",             category: "Urinalysis",               fastingRequired: false, sampleType: "Urine (24h)" },
];

// ─── Pre-built Order Sets ─────────────────────────────────────────────────────

interface OrderSet {
  id:          string;
  name:        string;
  description: string;
  testIds:     string[];
  color:       string;
}

const ORDER_SETS: OrderSet[] = [
  {
    id:          "fever",
    name:        "Fever Workup",
    description: "Standard fever investigation panel",
    testIds:     ["cbc", "crp", "esr", "pct", "blood_cx", "urine_re", "glucose_r"],
    color:       "#ef4444",
  },
  {
    id:          "pneumonia",
    name:        "Pneumonia Panel",
    description: "Community-acquired / clinic-acquired pneumonia",
    testIds:     ["cbc", "crp", "pct", "ldh", "blood_cx", "sputum_cs"],
    color:       "#f97316",
  },
  {
    id:          "diabetes",
    name:        "Diabetes Monitoring",
    description: "Routine diabetes follow-up & monitoring",
    testIds:     ["hba1c", "glucose_f", "insulin", "cholesterol", "ldl", "hdl", "tg", "urine_alb", "creatinine"],
    color:       "#8b5cf6",
  },
  {
    id:          "liver",
    name:        "Liver Function Panel",
    description: "Full hepatic workup",
    testIds:     ["alt", "ast", "alp", "ggt", "bilirubin_t", "bilirubin_d", "albumin", "total_protein", "pt_inr"],
    color:       "#f59e0b",
  },
  {
    id:          "kidney",
    name:        "Kidney Function Panel",
    description: "Comprehensive renal assessment",
    testIds:     ["creatinine", "bun", "uric_acid", "egfr", "sodium", "potassium", "urine_re", "urine_alb", "upcr"],
    color:       "#0ea5e9",
  },
  {
    id:          "cardiac",
    name:        "Cardiac Workup",
    description: "Acute chest pain / cardiac event evaluation",
    testIds:     ["troponin_i", "ck_mb", "bnp", "nt_pro_bnp", "cbc", "cholesterol", "ldl", "pt_inr"],
    color:       "#ef4444",
  },
  {
    id:          "thyroid",
    name:        "Thyroid Panel",
    description: "Full thyroid function assessment",
    testIds:     ["tsh", "ft4", "ft3"],
    color:       "#10b981",
  },
  {
    id:          "preop",
    name:        "Pre-operative Panel",
    description: "Routine pre-surgery screen",
    testIds:     ["cbc", "creatinine", "glucose_r", "pt_inr", "aptt", "blood_group", "urine_re"],
    color:       "#6366f1",
  },
];

// ─── Lab Chips Panel ──────────────────────────────────────────────────────────

export function LabChipsPanel({ order }: { order: LabOrder | null }) {
  if (!order || order.tests.length === 0) {
    return null;
  }

  const fastingTests = order.tests.filter(t => t.fastingRequired);

  return (
    <div className="space-y-2">
      {/* Condition + Instructions summary */}
      {(order.patientCondition || order.orderSetName) && (
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {order.orderSetName && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              Set: {order.orderSetName}
            </span>
          )}
          {order.patientCondition && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {order.patientCondition}
            </span>
          )}
        </div>
      )}

      {/* Tests */}
      <div className="flex flex-wrap gap-1.5">
        {order.tests.map(test => (
          <div
            key={test.id}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold"
            style={{
              backgroundColor: test.fastingRequired ? "#fef3c7" : "#f0fdf4",
              borderColor:     test.fastingRequired ? "#fbbf24" : "#86efac",
              color:           test.fastingRequired ? "#92400e" : "#14532d",
            }}>
            <FlaskConical className="h-2.5 w-2.5 flex-shrink-0" />
            {test.name}
            {test.fastingRequired && (
              <span className="text-[8px] font-black px-1 py-0.5 rounded bg-amber-200 text-amber-800 ml-0.5">
                FAST
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Fasting notice */}
      {fastingTests.length > 0 && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700 font-medium">
            {fastingTests.length} test{fastingTests.length > 1 ? "s" : ""} require fasting. Ensure patient is prepared.
          </p>
        </div>
      )}

      {/* Instructions */}
      {order.instructions && (
        <p className="text-[10px] text-slate-500 italic px-1">Note: {order.instructions}</p>
      )}

      {/* Sent timestamp */}
      {order.sentAt && (
        <div className="flex items-center gap-1.5 px-1 pt-0.5">
          <Clock className="h-3 w-3 text-slate-400 flex-shrink-0" />
          <span className="text-[9px] text-slate-400 font-medium">
            Sent {new Date(order.sentAt).toLocaleString(undefined, {
              month: "short", day: "numeric", year: "numeric",
              hour: "numeric", minute: "2-digit",
            })}
          </span>
        </div>
      )}

    </div>
  );
}

// ─── Lab Drawer ───────────────────────────────────────────────────────────────

interface LabDrawerProps {
  mode:             "add" | "edit";   // "add" = new order; "edit" = update existing
  savedData:        LabOrder | null;  // pre-populated in edit/labResultsReady mode; null otherwise
  awaitingLab?:     boolean;          // show "awaiting lab" informational footer
  labResultsReady?: boolean;          // second-order mode: previous tests shown as Completed
  onSave:           (order: Omit<LabOrder, "id">) => void; // id assigned by parent
  onClose:          () => void;
}

export function LabDrawer({ mode, savedData, awaitingLab = false, labResultsReady = false, onSave, onClose }: LabDrawerProps) {
  const [tab,               setTab]               = useState<"sets" | "browse">("sets");
  const [search,            setSearch]            = useState("");
  const [selectedCategory,  setSelectedCategory]  = useState(LAB_CATEGORIES[0]);

  // edit mode pre-populates from savedData; add mode always starts empty
  // second-order mode (labResultsReady) also starts empty even if savedData is present
  const [selectedTestIds,   setSelectedTestIds]   = useState<string[]>(
    labResultsReady ? [] :
    mode === "edit"  ? (savedData?.tests.map(t => t.id) ?? []) :
    []
  );
  const [patientCondition,  setPatientCondition]  = useState(
    mode === "edit" ? (savedData?.patientCondition ?? "Random") : "Random"
  );
  const [instructions,      setInstructions]      = useState(
    mode === "edit" ? (savedData?.instructions ?? "") : ""
  );
  const [orderSetName,      setOrderSetName]      = useState<string | null>(
    mode === "edit" ? (savedData?.orderSetName ?? null) : null
  );

  // Previously ordered test IDs (shown as Completed badges in second-order mode only)
  const previousTestIds: string[] = labResultsReady ? (savedData?.tests.map(t => t.id) ?? []) : [];

  // Custom order set creation
  const [showCustomForm,    setShowCustomForm]    = useState(false);
  const [customSetName,     setCustomSetName]     = useState("");
  const [sessionSets,       setSessionSets]       = useState<OrderSet[]>([]);

  const allOrderSets  = [...ORDER_SETS, ...sessionSets];
  const selectedTests = LAB_TESTS.filter(t => selectedTestIds.includes(t.id));

  function buildOrder(): Omit<LabOrder, "id"> {
    return { tests: selectedTests, patientCondition, instructions, orderSetName };
  }

  function applyOrderSet(set: OrderSet) {
    const addableIds = set.testIds.filter(id => !previousTestIds.includes(id));
    const newIds = [...new Set([...selectedTestIds, ...addableIds])];
    setSelectedTestIds(newIds);
    setOrderSetName(set.name);
  }

  function removeOrderSet(set: OrderSet) {
    setSelectedTestIds(prev => prev.filter(id => !set.testIds.includes(id)));
    setOrderSetName(null);
  }

  function toggleTest(id: string) {
    if (previousTestIds.includes(id)) return;
    setSelectedTestIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setOrderSetName(null);
  }

  function saveCustomSet() {
    const name = customSetName.trim();
    if (!name || selectedTestIds.length === 0) return;
    const newSet: OrderSet = {
      id:          `custom-${Date.now()}`,
      name,
      description: "Custom order set (this session)",
      testIds:     [...selectedTestIds],
      color:       "#6366f1",
    };
    setSessionSets(prev => [...prev, newSet]);
    setOrderSetName(name);
    setCustomSetName("");
    setShowCustomForm(false);
  }

  // Browse mode filtering
  const filteredTests = (() => {
    if (search.trim()) {
      return LAB_TESTS.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return LAB_TESTS.filter(t => t.category === selectedCategory);
  })();

  return (
    <div className="absolute inset-y-0 right-0 w-[68%] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-20">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Assessment &amp; Plan</p>
          <p className="text-sm font-black text-slate-800">Lab Orders</p>
        </div>

        {/* Badge for second-order mode */}
        {labResultsReady && (
          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-sky-50 text-sky-600 border border-sky-200 flex-shrink-0">
            <FlaskConical className="h-3 w-3" /> Additional Order
          </span>
        )}
        {/* Save Order / Update Order — disabled until at least one test is selected */}
        <button
          onClick={() => { if (selectedTests.length > 0) onSave(buildOrder()); }}
          disabled={selectedTests.length === 0}
          className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg text-white flex-shrink-0 disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: mode === "edit" ? "#f59e0b" : ACCENT_LAB }}>
          <ClipboardCheck className="h-3.5 w-3.5" />
          {mode === "edit" ? "Update Order" : "Save Order"}
        </button>

        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Mode tabs ── */}
      <div className="flex border-b border-slate-100 flex-shrink-0">
        {([
          { key: "sets",   label: "Order Sets",    Icon: Layers     },
          { key: "browse", label: "Browse Tests",  Icon: ListChecks },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setSearch(""); }}
            className={[
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold border-b-2 transition-all",
              tab === key ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600",
            ].join(" ")}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* ORDER SETS TAB */}
        {tab === "sets" && (
          <div className="p-4 space-y-3">
            <p className="text-[10px] text-slate-400 font-medium">
              Click an order set to auto-select all its tests. You can modify individual tests in Browse mode.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {allOrderSets.map(set => {
                const addableIds   = set.testIds.filter(id => !previousTestIds.includes(id));
                const completedCount = set.testIds.filter(id => previousTestIds.includes(id)).length;
                const allSelected  = addableIds.length > 0
                  ? addableIds.every(id => selectedTestIds.includes(id))
                  : set.testIds.every(id => previousTestIds.includes(id));
                const someSelected = set.testIds.some(id => selectedTestIds.includes(id) || previousTestIds.includes(id));
                return (
                  <button
                    key={set.id}
                    onClick={() => allSelected ? removeOrderSet(set) : applyOrderSet(set)}
                    className={[
                      "text-left rounded-xl border-2 px-3.5 py-3 transition-all",
                      allSelected
                        ? "border-amber-400 bg-amber-50"
                        : someSelected
                          ? "border-amber-200 bg-amber-50/40"
                          : "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30",
                    ].join(" ")}>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: set.color }} />
                        <p className={`text-[11px] font-black ${allSelected ? "text-amber-800" : "text-slate-800"}`}>
                          {set.name}
                        </p>
                      </div>
                      {allSelected && <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                    </div>
                    <p className="text-[9px] text-slate-400 mb-2">{set.description}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[9px] font-bold text-slate-500">
                        {set.testIds.length} test{set.testIds.length !== 1 ? "s" : ""}
                      </p>
                      {completedCount > 0 && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          {completedCount} completed
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {set.testIds.slice(0, 4).map(id => {
                        const t = LAB_TESTS.find(lt => lt.id === id);
                        const isCompleted = previousTestIds.includes(id);
                        return t ? (
                          <span
                            key={id}
                            className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: isCompleted ? "#d1fae5" : selectedTestIds.includes(id) ? `${set.color}20` : "#f1f5f9",
                              color:           isCompleted ? "#059669" : selectedTestIds.includes(id) ? set.color : "#64748b",
                            }}>
                            {t.name.split(" ")[0]}
                          </span>
                        ) : null;
                      })}
                      {set.testIds.length > 4 && (
                        <span className="text-[8px] text-slate-400">+{set.testIds.length - 4} more</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Create custom order set */}
            {!showCustomForm ? (
              <button
                onClick={() => setShowCustomForm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-500 text-xs font-bold hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
                <Plus className="h-3.5 w-3.5" /> Create Custom Order Set
              </button>
            ) : (
              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-3.5 space-y-2.5">
                <p className="text-[11px] font-black text-indigo-700">New Custom Set</p>
                <input
                  autoFocus
                  value={customSetName}
                  onChange={e => setCustomSetName(e.target.value)}
                  placeholder="Set name (e.g. Metabolic Syndrome Panel)…"
                  className="w-full text-xs border border-indigo-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 placeholder-slate-300"
                />
                <p className="text-[9px] text-slate-400">
                  {selectedTestIds.length} test{selectedTestIds.length !== 1 ? "s" : ""} currently selected will be saved into this set.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={saveCustomSet}
                    disabled={!customSetName.trim() || selectedTestIds.length === 0}
                    className="flex-1 text-xs font-bold py-1.5 rounded-lg text-white disabled:opacity-40 transition-opacity"
                    style={{ backgroundColor: "#6366f1" }}>
                    Save Set
                  </button>
                  <button
                    onClick={() => { setShowCustomForm(false); setCustomSetName(""); }}
                    className="px-4 text-xs font-bold py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BROWSE TESTS TAB */}
        {tab === "browse" && (
          <div className="flex flex-col h-full">
            {/* Search */}
            <div className="px-4 pt-3 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-amber-400 transition-all">
                <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search tests…"
                  className="flex-1 text-xs text-slate-700 placeholder-slate-300 bg-transparent outline-none"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Category tabs */}
            {!search.trim() && (
              <div className="flex gap-1 px-4 pb-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: "none" }}>
                {LAB_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={[
                      "flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all",
                      selectedCategory === cat
                        ? "text-white border-transparent"
                        : "text-slate-500 border-slate-200 hover:border-amber-200 hover:text-amber-600",
                    ].join(" ")}
                    style={selectedCategory === cat ? { backgroundColor: ACCENT_LAB } : {}}>
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {search.trim() && (
              <p className="px-4 pb-2 text-[10px] text-slate-400 flex-shrink-0">
                Searching all categories for &ldquo;{search}&rdquo;
              </p>
            )}

            {/* Test list */}
            <div className="flex-1 overflow-y-auto border-t border-slate-100">
              {filteredTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <FlaskConical className="h-7 w-7 mb-2 opacity-30" />
                  <p className="text-xs font-bold">No tests found</p>
                </div>
              ) : (
                filteredTests.map(test => {
                  const selected  = selectedTestIds.includes(test.id);
                  const completed = previousTestIds.includes(test.id);
                  return (
                    <button
                      key={test.id}
                      onClick={() => toggleTest(test.id)}
                      disabled={completed}
                      title={completed ? "Already ordered" : undefined}
                      className={[
                        "w-full text-left px-4 py-2.5 flex items-center gap-3 border-b border-slate-50 transition-colors last:border-0",
                        completed ? "bg-emerald-50/60 cursor-not-allowed" : selected ? "bg-amber-50" : "hover:bg-slate-50",
                      ].join(" ")}>
                      <div className={[
                        "h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        completed ? "border-emerald-400 bg-emerald-400" : selected ? "border-amber-500 bg-amber-500" : "border-slate-300",
                      ].join(" ")}>
                        {(selected || completed) && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${completed ? "text-slate-400" : selected ? "font-bold text-amber-800" : "text-slate-700"}`}>
                          {test.name}
                        </p>
                        <p className="text-[9px] text-slate-400">{test.sampleType}</p>
                      </div>
                      {completed && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 flex-shrink-0 flex items-center gap-0.5">
                          ✓ Completed
                        </span>
                      )}
                      {!completed && test.fastingRequired && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 flex-shrink-0">
                          FASTING
                        </span>
                      )}
                      {search.trim() && !completed && (
                        <span className="text-[9px] text-slate-400 flex-shrink-0">{test.category}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Patient Condition + Instructions ── */}
      <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3 bg-slate-50/60 space-y-2.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">Patient Condition</label>
            <select
              value={patientCondition}
              onChange={e => setPatientCondition(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all">
              {PATIENT_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
              Selected · {selectedTests.length} test{selectedTests.length !== 1 ? "s" : ""}
            </label>
            <div className="text-[9px] text-slate-400 leading-relaxed">
              {selectedTests.filter(t => t.fastingRequired).length > 0 && (
                <span className="font-bold text-amber-600">{selectedTests.filter(t => t.fastingRequired).length} fasting required · </span>
              )}
              {selectedTests.length === 0 ? "No tests selected yet" : `${[...new Set(selectedTests.map(t => t.sampleType))].join(", ")}`}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">Lab Instructions (optional)</label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="Special instructions for the lab…"
            rows={2}
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
          />
        </div>
      </div>

      {/* ── Footer: Awaiting Lab notice (informational only) ── */}
      {awaitingLab && (
        <div className="flex-shrink-0 border-t-2 border-amber-200 px-4 py-3 bg-amber-50 flex items-center gap-3">
          <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide">Patient is currently at the lab</p>
            <p className="text-[9px] text-amber-600 mt-0.5">
              Awaiting results — you will be notified when the patient returns.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
