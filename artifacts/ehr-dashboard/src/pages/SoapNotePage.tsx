import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, RefreshCw, ChevronDown, MoreHorizontal, ChevronRight, ChevronUp,
  AlertTriangle, Activity, Heart, Thermometer, User, Ruler, Zap,
  Edit3, FileText, CheckCircle2, Clock, X, Maximize2, Minimize2,
  BarChart2, Calendar, Pill, FlaskConical, Stethoscope, PenLine,
  ClipboardList, Users, FileBarChart, ScanLine, TrendingUp,
  Microscope, Eye, BookOpen, Target,
  ShieldAlert, Scissors, Send, BookMarked, ListChecks, MessageSquare,
  TestTube, HeartPulse, UserCheck, Home,
  Printer, FilePenLine, GitBranch,
} from "lucide-react";
import { MultiEntry } from "@/hooks/useMultiStepQueue";
import { Button } from "@/components/ui/button";
import { ClinicalNoteDrawer } from "@/pages/ClinicalNoteDrawer";
import type { NoteState } from "@/pages/ClinicalNoteDrawer";
import { EMPTY_FORMULARY } from "@/pages/FormularySection";
import { EMPTY_IMAGING } from "@/pages/ImagingSection";
import { EMPTY_CARE_PLAN } from "@/pages/CarePlanSection";
import { EMPTY_HEALTH_ED } from "@/pages/HealthEdSection";
import { EMPTY_REFERRAL_DATA } from "@/pages/ReferralSection";
import { EMPTY_PROCEDURE_ORDERS } from "@/pages/ProcedureOrdersSection";
import { EMPTY_PATIENT_GOALS } from "@/pages/PatientGoalsSection";
import { EMPTY_SOCIAL_HISTORY } from "@/pages/MedicalHistorySection";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#4982CF";

// ─── Static mock data ─────────────────────────────────────────────────────────

const VITALS = [
  { label: "BP",     value: "121/77", unit: "mmHg",  Icon: Activity,    color: "#4982CF" },
  { label: "Pulse",  value: "76",     unit: "bpm",   Icon: Heart,       color: "#ef4444" },
  { label: "Temp",   value: "37.0",   unit: "°C",    Icon: Thermometer, color: "#f59e0b" },
  { label: "Weight", value: "72",     unit: "kg",    Icon: User,        color: "#8b5cf6" },
  { label: "Height", value: "168",    unit: "cm",    Icon: Ruler,       color: "#10b981" },
  { label: "Pain",   value: "5/10",   unit: "score", Icon: Zap,         color: "#ec4899" },
];

const CONDITIONS = [
  { name: "Hypertension",    code: "I10",   color: "#f97316" },
  { name: "Type 2 Diabetes", code: "E11.9", color: "#ef4444" },
];

const ALLERGIES_LIST = [
  { name: "Penicillin",   severity: "Severe"   },
  { name: "NSAIDs",       severity: "Moderate" },
  { name: "Sulfonamides", severity: "Moderate" },
  { name: "Latex",        severity: "Mild"      },
];

const NAV_TABS: { label: string; Icon: React.ElementType }[] = [
  { label: "360 View",          Icon: BarChart2     },
  { label: "Visits",            Icon: Calendar      },
  { label: "Medicines",         Icon: Pill          },
  { label: "Diagnostics",       Icon: FlaskConical  },
  { label: "Nursing",           Icon: Stethoscope   },
  { label: "Prescription",      Icon: ClipboardList },
  { label: "Staff",             Icon: Users         },
  { label: "Reports",           Icon: FileBarChart  },
  { label: "Scanned Documents", Icon: ScanLine      },
  { label: "Data Analytics",    Icon: TrendingUp    },
];

const NOTE_HISTORY = [
  {
    date: "Dec 10, 2024", day: "Tuesday",   time: "10:55",
    type: "Comprehensive Note", doctor: "Dr. Asif Imam", selected: false, signed: false,
  },
  {
    date: "Nov 10, 2024", day: "Monday",    time: "08:10",
    type: "Comprehensive Note", doctor: "Dr. Abc",       selected: true, signed: false,
  },
  {
    date: "Sep 25, 2024", day: "Wednesday", time: "05:20",
    type: "Comprehensive Note", doctor: "Dr. Xyz",       selected: false, signed: false,
  },
];

export interface SignedRecord {
  date: string;
  day: string;
  time: string;
  type: string;
  doctor: string;
  signed: true;
}

export interface AddendumRow {
  date: string;
  day: string;
  time: string;
  type: string;
  doctor: string;
  selected: false;
  isNew: true;
  isAddendum: true;
  amendedFromDate: string;
}

function soapDummyToNoteState(dummy: SoapDummyNote): NoteState {
  return {
    chiefComplaints: dummy.cc,
    hpi: dummy.hpi,
    allergies: dummy.allergies.map((a, i) => ({
      id: `allergy-${i}`,
      name: a.name,
      allergenType: "Drug",
      date: "",
      reaction: a.reaction,
      onset: "",
      severity: a.severity.toLowerCase() as "severe" | "moderate" | "mild",
    })),
    pmhActive:       dummy.medicalHistory,
    pmhResolved:     [],
    surgicalRows:    [],
    fhRows:          dummy.familyHistory.map((h, i) => ({ id: `fh-${i}`, condition: h, relation: "" })),
    fhGenetic:       [],
    socialHistory:   EMPTY_SOCIAL_HISTORY,
    ros:             dummy.ros,
    pocTests:        [],
    formulary:       EMPTY_FORMULARY,
    imaging:         EMPTY_IMAGING,
    carePlan:        EMPTY_CARE_PLAN,
    healthEd:        EMPTY_HEALTH_ED,
    referrals:       EMPTY_REFERRAL_DATA,
    procedureOrders: EMPTY_PROCEDURE_ORDERS,
    patientGoals:    EMPTY_PATIENT_GOALS,
    otherOrders:     dummy.otherOrders.join("\n"),
    visitNote:       dummy.visitDescription,
    followUpDate:    dummy.followUp,
    planTags:        [],
  };
}

// ─── SOAP Preview Dummy Data ───────────────────────────────────────────────────

export interface SoapDummyNote {
  cc: string[];
  hpi: string;
  vitals: { bp: string; pulse: string; temp: string; spo2: string; weight: string };
  allergies: { name: string; reaction: string; severity: "Severe" | "Moderate" | "Mild" }[];
  medicalHistory: string[];
  surgicalHistory: string[];
  familyHistory: string[];
  socialHistory: string[];
  ros: string[];
  pe: string[];
  pocLabs: { test: string; result: string; unit: string; status: "Normal" | "Abnormal" }[];
  diagnoses: { code: string; name: string; severity: "Low" | "Moderate" | "High" }[];
  labs: string[];
  prescriptions: { drug: string; sig: string; qty: number }[];
  imaging: string[];
  carePlan: string[];
  procedureOrders: string[];
  referrals: { specialty: string; reason: string }[];
  patientGoals: string[];
  healthEducation: string[];
  otherOrders: string[];
  visitDescription: string;
  followUp: string;
  signedBy: string;
  signedAt: string;
}

export const SOAP_DUMMY: SoapDummyNote[] = [
  {
    // ── Record 1: URTI — Dec 10, 2024 ──────────────────────────────────────
    cc: ["Productive cough", "Fever", "Sore throat"],
    hpi: "55-year-old male presents with a 4-day history of productive cough with yellowish sputum, fever peaking at 38.7 °C, and mild sore throat. Onset was gradual. No known sick contacts. Patient reports poor appetite and generalised fatigue. No chest pain or shortness of breath at rest. Tried OTC paracetamol with partial relief.",
    vitals: { bp: "128/84", pulse: "92", temp: "38.5", spo2: "97", weight: "72 kg" },
    allergies: [
      { name: "Penicillin",   reaction: "Anaphylaxis / generalised rash", severity: "Severe"   },
      { name: "NSAIDs",       reaction: "Gastrointestinal upset",          severity: "Moderate" },
    ],
    medicalHistory: ["Hypertension — diagnosed 2019, on Amlodipine", "Seasonal allergic rhinitis"],
    surgicalHistory: ["Appendectomy — 2015 (laparoscopic)", "Tonsillectomy — childhood"],
    familyHistory: ["Father — essential hypertension, stroke at 68", "Mother — Type 2 diabetes mellitus"],
    socialHistory: ["Non-smoker", "Occasional alcohol (social)", "Office worker — sedentary role", "Married, 2 children"],
    ros: ["Cough — productive, yellowish sputum", "Fever — present (38.5 °C)", "Sore throat — mild", "Shortness of breath — absent", "Chest pain — absent", "Nausea — mild"],
    pe: ["General: Ill-appearing, febrile, not in severe distress", "ENT: Mild pharyngeal erythema, no exudate, no cervical lymphadenopathy", "Chest: Bilateral coarse crackles at both bases on auscultation", "CVS: Regular rate and rhythm, no murmur, no added sounds"],
    pocLabs: [
      { test: "Rapid Strep Test",   result: "Negative", unit: "",        status: "Normal"   },
      { test: "CRP",                result: "48",        unit: "mg/L",    status: "Abnormal" },
      { test: "Finger-prick Glucose", result: "98",      unit: "mg/dL",   status: "Normal"   },
    ],
    diagnoses: [
      { code: "J06.9", name: "Acute Upper Respiratory Infection", severity: "Moderate" },
      { code: "J20.9", name: "Acute Bronchitis, unspecified",     severity: "Low"      },
    ],
    labs: ["CBC with Differential", "CRP / ESR", "Throat swab C&S"],
    prescriptions: [
      { drug: "Azithromycin 500 mg",       sig: "Once daily × 5 days",         qty: 5 },
      { drug: "Paracetamol 500 mg",        sig: "TID × 3 days PRN fever",      qty: 9 },
      { drug: "Salbutamol Inhaler 100 mcg",sig: "2 puffs TID",                 qty: 1 },
    ],
    imaging: [],
    carePlan: ["Steam inhalation TID for 3 days", "Oral fluid intake ≥ 2 L/day", "Complete rest — avoid exertion for 48 h", "Return if fever > 48 h or dyspnoea develops"],
    procedureOrders: ["Nebulization with Salbutamol 2.5 mg — stat dose"],
    referrals: [
      { specialty: "ENT",              reason: "Persistent sore throat not responding to empiric therapy" },
    ],
    patientGoals: ["Complete full antibiotic course without missing doses", "Maintain oral hydration ≥ 2 L/day", "Return immediately if shortness of breath or worsening fever"],
    healthEducation: ["Hand hygiene technique to prevent spread to household contacts", "Cough etiquette — cover mouth, dispose of tissues", "When to seek emergency care (dyspnoea, high fever > 39 °C)"],
    otherOrders: ["Medical rest note — 3 days (employer certificate provided)", "Isolate from immunocompromised household members"],
    visitDescription: "Acute respiratory illness with probable bacterial component. Initiated antibiotic therapy, symptomatic management, and nebulization. ENT referral placed. Patient educated on infection control and return precautions.",
    followUp: "14 Dec 2024",
    signedBy: "Dr. Asif Imam",
    signedAt: "10 Dec 2024, 11:20",
  },
  {
    // ── Record 2: Hypertension — Nov 10, 2024 ──────────────────────────────
    cc: ["Persistent headache", "Elevated blood pressure"],
    hpi: "55-year-old male presents for routine hypertension follow-up. Reports persistent frontal headache for the past week, worse in the mornings. Home BP readings consistently 150–160 / 95–100 mmHg. Currently on Amlodipine 5 mg once daily — compliance reported as good. No recent dietary changes. Denies chest pain, palpitations, or visual disturbances. Mild bilateral ankle swelling noted.",
    vitals: { bp: "158/98", pulse: "78", temp: "36.8", spo2: "99", weight: "75 kg" },
    allergies: [
      { name: "Sulfonamides", reaction: "Skin rash / urticaria",    severity: "Moderate" },
      { name: "Latex",        reaction: "Contact dermatitis",        severity: "Mild"     },
    ],
    medicalHistory: ["Essential hypertension — diagnosed 2018", "Dyslipidemia — diagnosed 2021, on Rosuvastatin"],
    surgicalHistory: ["No prior surgeries"],
    familyHistory: ["Father — hypertension and stroke at 65", "Brother — coronary artery disease, MI at 58"],
    socialHistory: ["Ex-smoker — quit 2020 (15 pack-year history)", "No alcohol", "Sedentary desk job", "Married"],
    ros: ["Headache — frontal, morning predominance", "Visual disturbance — absent", "Chest pain — absent", "Palpitations — absent", "Ankle swelling — mild bilateral"],
    pe: ["General: Alert, well-oriented, mildly distressed from headache", "CVS: S1 S2 heard, no S3; BP 158/98 both arms", "Neuro: No focal neurological deficit", "Extremities: Mild pitting oedema +1 bilaterally"],
    pocLabs: [
      { test: "Point-of-care Glucose", result: "112", unit: "mg/dL", status: "Normal"   },
      { test: "Urine Dipstick — Protein", result: "Trace", unit: "",  status: "Abnormal" },
    ],
    diagnoses: [
      { code: "I10", name: "Essential Hypertension — Stage 2",              severity: "High"     },
      { code: "R51", name: "Headache (secondary to uncontrolled HTN)",      severity: "Moderate" },
    ],
    labs: ["Electrolytes panel (Na / K / Cl)", "Renal function test (BUN / Creatinine)", "12-lead ECG"],
    prescriptions: [
      { drug: "Amlodipine 10 mg",         sig: "Once daily (dose increased from 5 mg)", qty: 30 },
      { drug: "Hydrochlorothiazide 25 mg", sig: "Once daily — new addition",             qty: 30 },
    ],
    imaging: ["Chest X-ray (PA view) — cardiac silhouette assessment"],
    carePlan: ["Low sodium diet — < 2 g NaCl / day", "Daily BP monitoring log — bring to next visit", "Reduce caffeine and alcohol", "Moderate aerobic exercise 30 min/day", "Daily weight monitoring for oedema"],
    procedureOrders: ["12-lead ECG — in clinic", "24-hour ambulatory BP monitoring (ABPM) — arranged"],
    referrals: [
      { specialty: "Cardiology",  reason: "Uncontrolled Stage 2 hypertension with end-organ risk" },
      { specialty: "Dietitian",   reason: "Structured low-sodium diet counselling"                },
    ],
    patientGoals: ["Achieve sustained BP < 130/80 mmHg within 8 weeks", "Reduce daily salt intake to < 2 g/day", "30 minutes moderate walking at least 5 days per week"],
    healthEducation: ["Importance of consistent medication adherence explained", "Salt restriction and food label reading demonstrated", "Home BP monitoring technique reviewed and corrected"],
    otherOrders: ["Sick leave certificate — 1 day", "Blood pressure diary booklet provided"],
    visitDescription: "Stage 2 hypertension inadequately controlled on monotherapy. Medication regimen intensified. Cardiology and dietitian referrals placed. Patient counselled on lifestyle modification and compliance.",
    followUp: "17 Nov 2024",
    signedBy: "Dr. Abc",
    signedAt: "10 Nov 2024, 08:45",
  },
  {
    // ── Record 3: Type 2 DM — Sep 25, 2024 ────────────────────────────────
    cc: ["Fatigue", "Excessive thirst", "Blurred vision"],
    hpi: "55-year-old male with known Type 2 Diabetes Mellitus presents for quarterly review. Reports increasing fatigue, polydipsia, and mild bilateral blurred vision over 3 weeks. Last HbA1c: 8.2 % (3 months ago). Home glucose: fasting 180–210 mg/dL, post-meal 240–280 mg/dL. On Metformin 500 mg BD. Compliance good. Denies polyuria or unexplained weight loss. Foot inspection reveals no active ulcer.",
    vitals: { bp: "132/82", pulse: "80", temp: "36.9", spo2: "98", weight: "78 kg" },
    allergies: [
      { name: "No known drug allergies", reaction: "—", severity: "Mild" },
    ],
    medicalHistory: ["Type 2 Diabetes Mellitus — diagnosed 2020", "Dyslipidemia — on Atorvastatin 20 mg"],
    surgicalHistory: ["Cataract surgery — right eye, 2022 (phacoemulsification)"],
    familyHistory: ["Mother — Type 2 DM and coronary artery disease", "Sister — Type 2 DM, diagnosed at 45"],
    socialHistory: ["Non-smoker", "Non-drinker", "Retired school teacher", "Sedentary lifestyle — minimal daily activity"],
    ros: ["Fatigue — present, worsening gradually", "Polydipsia — present, significant", "Polyuria — mild", "Blurred vision — bilateral, intermittent", "Tingling in toes — present (peripheral neuropathy symptom)", "Chest pain — absent"],
    pe: ["General: Overweight (BMI 29.4), no acute distress", "Fundoscopy: Early background retinopathy bilateral — dot haemorrhages noted", "Foot: Intact skin bilaterally; reduced monofilament sensation right > left; no ulcer", "CVS: Regular rate and rhythm, no murmur"],
    pocLabs: [
      { test: "Fasting Glucose",  result: "188", unit: "mg/dL", status: "Abnormal" },
      { test: "HbA1c (POC)",      result: "8.4",  unit: "%",    status: "Abnormal" },
      { test: "Urine Ketones",    result: "Negative", unit: "", status: "Normal"   },
    ],
    diagnoses: [
      { code: "E11.9",  name: "Type 2 Diabetes Mellitus — Poorly Controlled",  severity: "High"     },
      { code: "E11.36", name: "Diabetic Retinopathy — Background Stage",        severity: "Moderate" },
      { code: "E11.40", name: "Diabetic Peripheral Neuropathy",                 severity: "Low"      },
    ],
    labs: ["HbA1c", "Fasting lipid panel", "Urine microalbumin / creatinine ratio", "Renal function test", "LFTs"],
    prescriptions: [
      { drug: "Metformin 1000 mg",          sig: "BD with meals (dose doubled)",   qty: 60 },
      { drug: "Sitagliptin 100 mg",         sig: "Once daily — new addition",       qty: 30 },
      { drug: "Omega-3 Fatty Acids 1000 mg",sig: "Once daily with meal",            qty: 30 },
    ],
    imaging: ["Fundus photography — diabetic retinopathy grading"],
    carePlan: ["Diabetic diet — low carbohydrate, low GI foods", "Target HbA1c < 7 %", "Daily foot inspection at home", "Refer to diabetic educator for self-management training", "Ophthalmology referral for retinopathy management", "Review in 4 weeks for glucose response"],
    procedureOrders: ["Foot examination with 10 g monofilament sensory test", "Ankle-brachial index (ABI) measurement"],
    referrals: [
      { specialty: "Ophthalmology",      reason: "Background diabetic retinopathy — grading and management" },
      { specialty: "Diabetic Educator",  reason: "Self-management training and diet counselling"            },
      { specialty: "Podiatry",           reason: "Peripheral neuropathy foot care programme"                },
    ],
    patientGoals: ["Bring HbA1c below 7 % within 3 months", "Daily foot inspection — check for wounds, redness, swelling", "Reduce carbohydrate intake and follow low-GI meal plan"],
    healthEducation: ["Diabetic diet and portion control — handout provided", "Foot care education — daily inspection technique demonstrated", "Signs and symptoms of hypoglycaemia explained", "Home glucose monitoring technique reviewed"],
    otherOrders: ["Glucometer prescribed — with lancets and test strips", "Diabetic foot care kit provided", "Medical alert bracelet recommended"],
    visitDescription: "Poorly controlled T2DM with evidence of early microvascular complications (retinopathy, peripheral neuropathy). Medication regimen intensified. Three specialist referrals placed. Comprehensive patient education delivered. Repeat HbA1c in 3 months.",
    followUp: "05 Oct 2024",
    signedBy: "Dr. Xyz",
    signedAt: "25 Sep 2024, 05:45",
  },
];

const SEV_COLOR: Record<string, string> = {
  Low:      "bg-sky-50 text-sky-700 border-sky-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  High:     "bg-red-50 text-red-700 border-red-200",
};

const ALG_SEV: Record<string, string> = {
  Severe:   "bg-red-50 text-red-700 border-red-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Mild:     "bg-sky-50 text-sky-700 border-sky-200",
};

function SoapNotePreview({ note }: { note: SoapDummyNote }) {
  const Section = ({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <span style={{ color }}>{icon}</span>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div className="px-6 py-5 bg-slate-50 border-t border-slate-100">

      {/* ── Vitals strip ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {[
          { label: "BP",     value: note.vitals.bp,     unit: "mmHg", color: "#4982CF" },
          { label: "Pulse",  value: note.vitals.pulse,  unit: "bpm",  color: "#ef4444" },
          { label: "Temp",   value: note.vitals.temp,   unit: "°C",   color: "#f59e0b" },
          { label: "SpO₂",  value: note.vitals.spo2,   unit: "%",    color: "#10b981" },
          { label: "Weight", value: note.vitals.weight, unit: "",     color: "#8b5cf6" },
        ].map(v => (
          <div key={v.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm">
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: v.color }}>{v.label}</span>
            <span className="text-xs font-black text-slate-800">{v.value}</span>
            {v.unit && <span className="text-[9px] text-slate-400">{v.unit}</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-8">

        {/* ══ LEFT COLUMN ══════════════════════════════════════════════════════ */}
        <div>

          {/* Chief Complaint */}
          <Section icon={<ClipboardList className="h-3.5 w-3.5" />} title="Chief Complaint" color="#4982CF">
            <div className="flex flex-wrap gap-1.5">
              {note.cc.map(c => (
                <span key={c} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{c}</span>
              ))}
            </div>
          </Section>

          {/* History of Present Illness */}
          <Section icon={<FileText className="h-3.5 w-3.5" />} title="History of Present Illness" color="#6366f1">
            <p className="text-[11px] leading-relaxed text-slate-600 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5">{note.hpi}</p>
          </Section>

          {/* Allergies */}
          <Section icon={<ShieldAlert className="h-3.5 w-3.5" />} title="Allergies" color="#ef4444">
            <div className="space-y-1.5">
              {note.allergies.map((a, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${ALG_SEV[a.severity]}`}>
                  <span className="text-[10px] font-black flex-shrink-0">{a.name}</span>
                  <div className="w-px self-stretch bg-current opacity-20 flex-shrink-0" />
                  <p className="text-[10px] flex-1">{a.reaction}</p>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/60 flex-shrink-0">{a.severity}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Medical History */}
          <Section icon={<FileText className="h-3.5 w-3.5" />} title="Medical History" color="#6366f1">
            <div className="space-y-1">
              {note.medicalHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <p className="text-[11px] text-slate-600">{h}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Surgical History */}
          <Section icon={<Scissors className="h-3.5 w-3.5" />} title="Surgical History" color="#f59e0b">
            <div className="space-y-1">
              {note.surgicalHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <p className="text-[11px] text-slate-600">{h}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Family History */}
          <Section icon={<Users className="h-3.5 w-3.5" />} title="Family History" color="#ec4899">
            <div className="space-y-1">
              {note.familyHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-pink-400 flex-shrink-0" />
                  <p className="text-[11px] text-slate-600">{h}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Social History */}
          <Section icon={<Home className="h-3.5 w-3.5" />} title="Social History" color="#8b5cf6">
            <div className="flex flex-wrap gap-1.5">
              {note.socialHistory.map((h, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">{h}</span>
              ))}
            </div>
          </Section>

          {/* Review of Systems */}
          <Section icon={<Activity className="h-3.5 w-3.5" />} title="Review of Systems" color="#0ea5e9">
            <div className="space-y-1">
              {note.ros.map((r, i) => {
                const positive = r.toLowerCase().includes("present") || r.toLowerCase().includes("positive");
                const absent   = r.toLowerCase().includes("absent") || r.toLowerCase().includes("negative");
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${positive ? "bg-amber-400" : absent ? "bg-emerald-400" : "bg-slate-300"}`} />
                    <p className="text-[11px] text-slate-600">{r}</p>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Physical Examination */}
          <Section icon={<Stethoscope className="h-3.5 w-3.5" />} title="Physical Examination" color="#8b5cf6">
            <div className="space-y-1.5">
              {note.pe.map((p, i) => (
                <div key={i} className="flex items-start gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                  <p className="text-[11px] text-slate-600">{p}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Point of Care Labs */}
          {note.pocLabs.length > 0 && (
            <Section icon={<FlaskConical className="h-3.5 w-3.5" />} title="Point of Care Labs" color="#0ea5e9">
              <div className="space-y-1.5">
                {note.pocLabs.map((l, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${l.status === "Abnormal" ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                    <span className="text-[10px] font-bold flex-1 text-slate-700">{l.test}</span>
                    <span className="text-[10px] font-black text-slate-800">{l.result}{l.unit ? ` ${l.unit}` : ""}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${l.status === "Abnormal" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{l.status}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

        </div>

        {/* ══ RIGHT COLUMN ═════════════════════════════════════════════════════ */}
        <div>

          {/* Assessment & Diagnosis */}
          <Section icon={<Target className="h-3.5 w-3.5" />} title="Assessment & Diagnosis" color="#ef4444">
            <div className="space-y-2">
              {note.diagnoses.map((d, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${SEV_COLOR[d.severity]}`}>
                  <span className="text-[10px] font-black font-mono">{d.code}</span>
                  <div className="w-px self-stretch bg-current opacity-20" />
                  <p className="text-[11px] font-semibold flex-1">{d.name}</p>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/60">{d.severity}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Lab Orders */}
          {note.labs.length > 0 && (
            <Section icon={<Microscope className="h-3.5 w-3.5" />} title="Lab Orders" color="#f59e0b">
              <div className="flex flex-wrap gap-1.5">
                {note.labs.map(l => (
                  <span key={l} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{l}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Prescriptions */}
          <Section icon={<Pill className="h-3.5 w-3.5" />} title="Prescription" color="#8b5cf6">
            <div className="space-y-2">
              {note.prescriptions.map((rx, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black text-slate-800">{rx.drug}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{rx.sig}</p>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 flex-shrink-0">Qty: {rx.qty}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Order Imaging */}
          {note.imaging.length > 0 && (
            <Section icon={<Eye className="h-3.5 w-3.5" />} title="Order Imaging" color="#0ea5e9">
              <div className="space-y-1">
                {note.imaging.map(img => (
                  <div key={img} className="flex items-center gap-2 text-[11px] text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-1.5">
                    <ScanLine className="h-3 w-3 flex-shrink-0" /> {img}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Care Plan */}
          <Section icon={<BookOpen className="h-3.5 w-3.5" />} title="Care Plan" color="#10b981">
            <div className="space-y-1.5">
              {note.carePlan.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600">{c}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Procedure Orders */}
          {note.procedureOrders.length > 0 && (
            <Section icon={<ListChecks className="h-3.5 w-3.5" />} title="Procedure Orders" color="#f97316">
              <div className="space-y-1">
                {note.procedureOrders.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400 flex-shrink-0" /> {p}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Referrals */}
          {note.referrals.length > 0 && (
            <Section icon={<Send className="h-3.5 w-3.5" />} title="Referrals" color="#4982CF">
              <div className="space-y-1.5">
                {note.referrals.map((r, i) => (
                  <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-start gap-3">
                    <span className="text-[10px] font-black text-blue-700 flex-shrink-0 pt-0.5">{r.specialty}</span>
                    <div className="w-px self-stretch bg-blue-200 flex-shrink-0" />
                    <p className="text-[10px] text-blue-600">{r.reason}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Patient Goals */}
          <Section icon={<Target className="h-3.5 w-3.5" />} title="Patient Goals" color="#10b981">
            <div className="space-y-1">
              {note.patientGoals.map((g, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600">{g}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Health Education */}
          <Section icon={<BookMarked className="h-3.5 w-3.5" />} title="Health Education" color="#6366f1">
            <div className="space-y-1">
              {note.healthEducation.map((h, i) => (
                <div key={i} className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <p className="text-[11px] text-indigo-700">{h}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Other Orders */}
          {note.otherOrders.length > 0 && (
            <Section icon={<MessageSquare className="h-3.5 w-3.5" />} title="Other Orders" color="#94a3b8">
              <div className="space-y-1">
                {note.otherOrders.map((o, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                    <p className="text-[11px] text-slate-600">{o}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Visit Description */}
          <Section icon={<ClipboardList className="h-3.5 w-3.5" />} title="Visit Description" color="#4982CF">
            <p className="text-[11px] leading-relaxed text-slate-600 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 italic">{note.visitDescription}</p>
          </Section>

          {/* Footer — Follow-up + Signed by */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] text-slate-500">Follow-up Visit: <strong className="text-slate-700">{note.followUp}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
              <PenLine className="h-3 w-3 text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-700">{note.signedBy}</span>
              <span className="text-[9px] text-emerald-500">· {note.signedAt}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatToday(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Module Drawer ────────────────────────────────────────────────────────────

interface DrawerProps {
  label: string;
  Icon: React.ElementType;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

function ModuleDrawer({ label, Icon, fullscreen, onToggleFullscreen, onClose }: DrawerProps) {
  return (
    <>
      {/* Backdrop — only when NOT fullscreen so background is still visible */}
      {!fullscreen && (
        <div
          className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-30"
        />
      )}

      {/* Drawer panel */}
      <div
        className={[
          "absolute top-0 right-0 h-full bg-white shadow-2xl flex flex-col z-40 transition-all duration-300",
          fullscreen ? "inset-0 w-full" : "w-[480px] border-l border-slate-200",
        ].join(" ")}>

        {/* Drawer header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${ACCENT}15` }}>
            <Icon className="h-4 w-4" style={{ color: ACCENT }} />
          </div>
          <p className="text-sm font-black text-slate-800 flex-1">{label}</p>

          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen
              ? <Minimize2 className="h-4 w-4" />
              : <Maximize2 className="h-4 w-4" />
            }
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer body — placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${ACCENT}10` }}>
            <Icon className="h-7 w-7" style={{ color: ACCENT }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <p className="text-xs text-slate-400 mt-1">Module coming soon</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SoapNotePageProps {
  entry: MultiEntry;
  onBack: () => void;
  faceSheetOpenedAt?: number;
  onSendToLab?: () => void;
  onDiscardLab?: () => void;
  onSaveAndClose?: () => void;
  onDoctorSign?: () => void;
  signedRecords?: SignedRecord[];
}

export function SoapNotePage({ entry, onBack, faceSheetOpenedAt, onSendToLab, onDiscardLab, onSaveAndClose, onDoctorSign, signedRecords = [] }: SoapNotePageProps) {
  const [openDrawer, setOpenDrawer]             = useState<string | null>(null);
  const [drawerFullscreen, setDrawerFullscreen] = useState(false);
  const [showNoteDrawer, setShowNoteDrawer]     = useState(false);
  const [expandedIndex, setExpandedIndex]       = useState<number | null>(null);
  const [openMenuIdx, setOpenMenuIdx]           = useState<number | null>(null);
  const [editingDummyIdx, setEditingDummyIdx]   = useState<number | null>(null);
  const [addendumRows, setAddendumRows]         = useState<AddendumRow[]>([]);
  const menuRef                                 = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (openMenuIdx === null) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuIdx(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenuIdx]);

  const p       = entry.patient;
  const name    = p?.name  ?? "Walk-in Patient";
  const mrn     = p?.mrn   ?? "—";
  const dob     = p?.dob   ?? "—";
  const phone   = p?.phone ?? "—";
  const gender  = p?.gender === "F" ? "Female" : "Male";
  const address = "House 14, Street 7, DHA Phase 3, Lahore";
  const today   = formatToday();

  function openModule(label: string) {
    setOpenDrawer(label);
    setDrawerFullscreen(false);
  }

  function closeDrawer() {
    setOpenDrawer(null);
    setDrawerFullscreen(false);
  }

  const activeTabMeta = NAV_TABS.find(t => t.label === openDrawer);

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden relative">

      {/* ═══════════════════════════════════════════════════════════════════════
          FIXED HEADER
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 bg-white shadow-sm z-10">

        {/* ── Row 1: Breadcrumb nav ────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-100">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Face Sheet
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            SOAP Notes — Consultation
          </span>
          <div className="flex-1" />
          <Button
            className="h-8 px-4 text-xs font-bold gap-1.5 text-white"
            style={{ backgroundColor: ACCENT }}
            onClick={onBack}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Save & Close
          </Button>
        </div>

        {/* ── Row 2: Patient info bar ─────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100">
          <div
            className="h-11 w-11 rounded-xl flex-shrink-0 flex items-center justify-center text-lg font-black text-white shadow"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #2d5fa8)` }}>
            {name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-0.5">
              <p className="text-base font-black text-slate-900 leading-tight">{name}</p>
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: ACCENT }}>
                {mrn}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 px-2.5 py-0.5 rounded-full bg-slate-100">
                {gender}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-slate-400">
              <span>DOB: <strong className="text-slate-600">{dob}</strong></span>
              <span>Last Visit: <strong className="text-slate-600">21 Feb 2025</strong></span>
              <span>{phone}</span>
              <span>{address}</span>
            </div>
          </div>
        </div>

        {/* ── Row 3: Alerts strip ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-2 border-b border-red-100 bg-red-50">
          <div className="flex items-center gap-1.5 mr-1">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Conditions</span>
          </div>
          {CONDITIONS.map(c => (
            <span
              key={c.code}
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: c.color }}>
              {c.name}
              <span className="opacity-80">({c.code})</span>
            </span>
          ))}
          <div className="w-px h-4 bg-red-200 mx-1" />
          <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 mr-1">Allergies</span>
          {ALLERGIES_LIST.map(a => (
            <span
              key={a.name}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              {a.name} · {a.severity}
            </span>
          ))}
        </div>

        {/* ── Row 4: Vitals strip ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 overflow-x-auto">
          {VITALS.map(v => (
            <div
              key={v.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0">
              <span style={{ color: v.color }}>
                <v.Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{v.label}</p>
                <p className="text-sm font-black text-slate-800 leading-tight">
                  {v.value}&thinsp;
                  <span className="text-[9px] font-medium text-slate-400">{v.unit}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Row 5: Module nav tabs (open drawer on click) ───────────────── */}
        <div className="flex items-center overflow-x-auto scrollbar-none border-b border-slate-100">
          {NAV_TABS.map(({ label, Icon }) => {
            const active = openDrawer === label;
            return (
              <button
                key={label}
                onClick={() => active ? closeDrawer() : openModule(label)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold whitespace-nowrap border-b-2 transition-all flex-shrink-0"
                style={active
                  ? { borderBottomColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}08` }
                  : { borderBottomColor: "transparent", color: "#94a3b8" }}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN SCROLLABLE CONTENT — always visible (SOAP notes)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col gap-5">

          {/* ─── New Notes Panel ────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-slate-800">New Notes</p>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: signedRecords.length > 0 ? "#94a3b8" : ACCENT }}>
                  {signedRecords.length > 0 ? 0 : 1}
                </span>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              {/* Addendum In Progress card */}
              {editingDummyIdx !== null && (
                <div
                  className="flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"
                  style={{ borderLeftWidth: 4, borderLeftColor: "#f59e0b" }}>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow bg-amber-500">
                      <GitBranch className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-black text-slate-900">{today}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          In Progress
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Addendum · {editingDummyIdx >= 0 && editingDummyIdx < SOAP_DUMMY.length
                          ? NOTE_HISTORY[editingDummyIdx]?.date ?? ""
                          : "Signed Note"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Being edited by Dr. Asif Imam
                      </p>
                    </div>
                  </div>
                  <button
                    className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-2 rounded-xl text-white transition-opacity hover:opacity-90 bg-amber-500"
                    onClick={() => setEditingDummyIdx(null)}>
                    <X className="h-3.5 w-3.5" /> Discard
                  </button>
                </div>
              )}

              {/* Regular note card */}
              {signedRecords.length > 0 ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-400">
                  <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                  <p className="text-sm font-semibold text-slate-500">Note signed and saved to All Records</p>
                  <p className="text-xs text-slate-400">No new notes in progress</p>
                </div>
              ) : (
                <div
                  className="flex items-start justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-4"
                  style={{ borderLeftWidth: 4, borderLeftColor: ACCENT }}>
                  <div className="flex items-start gap-4">
                    <div
                      className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow"
                      style={{ backgroundColor: ACCENT }}>
                      <Edit3 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-black text-slate-900">{today}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          In Progress
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700">Comprehensive Note</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Auto-created on entry · By Dr. Asif Imam
                      </p>
                    </div>
                  </div>
                  <button
                    className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: ACCENT }}
                    onClick={() => setShowNoteDrawer(true)}>
                    <FileText className="h-3.5 w-3.5" /> Open Note
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── All Records Section ────────────────────────────────────────── */}
          {(() => {
            const allRows = [
              ...addendumRows,
              ...signedRecords.map(r => ({ ...r, selected: false, isNew: true, isAddendum: false as const })).reverse(),
              ...NOTE_HISTORY.map(r => ({ ...r, isNew: false, isAddendum: false as const })),
            ];
            return (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-slate-800">All Records</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {allRows.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                      Order by Patient Event Date
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div>
                  {allRows.map((note, i) => {
                    const isOpen   = expandedIndex === i;
                    const isAddendum = (note as AddendumRow).isAddendum === true;
                    const dummyOffset = addendumRows.length + signedRecords.length;
                    const dummyIdx = (!note.isNew && !isAddendum) ? i - dummyOffset : -1;
                    const dummy    = dummyIdx >= 0 && dummyIdx < SOAP_DUMMY.length ? SOAP_DUMMY[dummyIdx] : null;
                    const menuOpen = openMenuIdx === i;
                    return (
                    <div
                      key={i}
                      className={`transition-colors ${i < allRows.length - 1 ? "border-b border-slate-100" : ""}`}>

                      {/* ── Row header ── */}
                      <div className={`flex items-stretch ${isAddendum ? "bg-amber-50" : note.isNew ? "bg-emerald-50" : (note as {selected?: boolean}).selected ? "bg-blue-50" : isOpen ? "bg-slate-50" : "hover:bg-slate-50"}`}>
                        <div
                          className="w-1 flex-shrink-0"
                          style={{ backgroundColor: isAddendum ? "#f59e0b" : note.isNew ? "#10b981" : (note as {selected?: boolean}).selected ? ACCENT : "transparent" }}
                        />

                        <div className="flex items-center gap-5 px-5 py-4 flex-1 min-w-0">
                          <div className="w-28 flex-shrink-0">
                            <p className="text-xs font-black text-slate-800 leading-tight">
                              {note.date.split(" ").slice(0, 2).join(" ")}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {note.date.split(" ").slice(2).join(" ")}
                            </p>
                          </div>

                          <div className="w-px self-stretch bg-slate-200 flex-shrink-0" />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-xs font-black text-slate-800">{note.day}</span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {note.time}
                              </span>
                              {isAddendum && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                                  <GitBranch className="h-2.5 w-2.5" /> Addendum
                                </span>
                              )}
                              {!isAddendum && note.isNew && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Signed
                                </span>
                              )}
                              {!isAddendum && !note.isNew && (note as {selected?: boolean}).selected && (
                                <span
                                  className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                                  style={{ backgroundColor: ACCENT }}>
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-slate-600">{note.type}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">By {note.doctor}</p>
                            {isAddendum && (
                              <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
                                <GitBranch className="h-2.5 w-2.5" />
                                Addendum to: {(note as AddendumRow).amendedFromDate}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => setExpandedIndex(isOpen ? null : i)}
                              className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                                isOpen
                                  ? "border-slate-300 bg-slate-100 text-slate-700"
                                  : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800 bg-white"
                              }`}>
                              {isOpen
                                ? <><ChevronUp className="h-3 w-3" /> Collapse</>
                                : <><ChevronRight className="h-3 w-3" /> Expand</>
                              }
                            </button>
                            {/* ── 3-dot menu ── */}
                            <div className="relative" ref={menuOpen ? menuRef : undefined}>
                              <button
                                onClick={() => setOpenMenuIdx(menuOpen ? null : i)}
                                className={`p-1.5 rounded-lg border transition-colors ${menuOpen ? "border-slate-300 bg-slate-100 text-slate-700" : "border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white"}`}>
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>
                              {menuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                  <button
                                    onClick={() => { setOpenMenuIdx(null); window.open("about:blank", "_blank"); }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                    <Printer className="h-3.5 w-3.5 text-slate-400" /> Print
                                  </button>
                                  {!isAddendum && (
                                    <button
                                      onClick={() => {
                                        setOpenMenuIdx(null);
                                        setEditingDummyIdx(dummy !== null ? dummyIdx : -99);
                                        setShowNoteDrawer(false);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors border-t border-slate-100">
                                      <FilePenLine className="h-3.5 w-3.5 text-slate-400" /> Edit Note
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>{/* end row header */}

                      {/* ── Expand panel ── */}
                      {isOpen && (
                        dummy
                          ? <SoapNotePreview note={dummy} />
                          : (
                            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-3 text-center">
                              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800">Note Signed Successfully</p>
                                <p className="text-[11px] text-slate-500 mt-1">Signed by <strong>{note.doctor}</strong> on {note.date} at {note.time}</p>
                                <p className="text-[11px] text-slate-400 mt-1">This consultation note has been electronically signed and added to the patient record.</p>
                              </div>
                            </div>
                          )
                      )}
                    </div>
                  );
                  })}
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CLINICAL NOTE DRAWER (Open Note)
      ═══════════════════════════════════════════════════════════════════════ */}
      {showNoteDrawer && (
        <ClinicalNoteDrawer
          patientName={name}
          faceSheetOpenedAt={faceSheetOpenedAt}
          awaitingLab={entry.pendingLab}
          onSendToLab={onSendToLab}
          onDiscardLab={onDiscardLab}
          onSaveAndClose={onSaveAndClose}
          signed={signedRecords.length > 0}
          onDoctorSign={() => { onDoctorSign?.(); setShowNoteDrawer(false); }}
          onClose={() => setShowNoteDrawer(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          ADDENDUM DRAWER (Edit Note → Addendum mode)
      ═══════════════════════════════════════════════════════════════════════ */}
      {editingDummyIdx !== null && (() => {
        const srcDummy = editingDummyIdx >= 0 && editingDummyIdx < SOAP_DUMMY.length
          ? SOAP_DUMMY[editingDummyIdx]
          : null;
        const amendedDate = editingDummyIdx >= 0 && editingDummyIdx < NOTE_HISTORY.length
          ? NOTE_HISTORY[editingDummyIdx].date
          : today;
        return (
          <ClinicalNoteDrawer
            patientName={name}
            isAddendumMode
            initialNote={srcDummy ? soapDummyToNoteState(srcDummy) : undefined}
            onAddendum={(filledNote) => {
              const now = new Date();
              const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
              const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
              const newRow: AddendumRow = {
                date: `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
                day:  days[now.getDay()],
                time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
                type: "Addendum Note",
                doctor: "Dr. Asif Imam",
                selected: false,
                isNew: true,
                isAddendum: true,
                amendedFromDate: amendedDate,
              };
              setAddendumRows(prev => [newRow, ...prev]);
              setEditingDummyIdx(null);
              void filledNote;
            }}
            onClose={() => setEditingDummyIdx(null)}
          />
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODULE DRAWER (right-side overlay)
      ═══════════════════════════════════════════════════════════════════════ */}
      {!showNoteDrawer && openDrawer && activeTabMeta && (
        <ModuleDrawer
          label={openDrawer}
          Icon={activeTabMeta.Icon}
          fullscreen={drawerFullscreen}
          onToggleFullscreen={() => setDrawerFullscreen(f => !f)}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}
