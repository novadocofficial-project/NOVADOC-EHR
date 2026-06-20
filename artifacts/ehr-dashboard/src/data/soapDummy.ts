import type { LabOrder } from "../pages/LabDrawer";

// ─── SOAP Dummy Note Interface ────────────────────────────────────────────────

export interface SoapDummyNote {
  cc:               string[];
  hpi:              string;
  vitals:           { bp: string; pulse: string; temp: string; spo2: string; weight: string };
  allergies:        { name: string; reaction: string; severity: "Severe" | "Moderate" | "Mild" }[];
  medicalHistory:   string[];
  surgicalHistory:  string[];
  familyHistory:    string[];
  socialHistory:    string[];
  ros:              string[];
  pe:               string[];
  pocLabs:          { test: string; result: string; unit: string; status: "Normal" | "Abnormal" }[];
  diagnoses:        { code: string; name: string; severity: "Low" | "Moderate" | "High" }[];
  labs:             string[];
  labOrders?:       LabOrder[];
  prescriptions:    { drug: string; sig: string; qty: number }[];
  imaging:          string[];
  carePlan:         string;
  procedureOrders:  string[];
  referrals:        { specialty: string; reason: string }[];
  patientGoals:     string[];
  healthEducation:  string[];
  otherOrders:      string[];
  visitDescription: string;
  followUp:         string;
  signedBy:         string;
  signedAt:         string;
}

// ─── SOAP Dummy Data ──────────────────────────────────────────────────────────

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
      { test: "Rapid Strep Test",     result: "Negative", unit: "",       status: "Normal"   },
      { test: "CRP",                  result: "48",        unit: "mg/L",   status: "Abnormal" },
      { test: "Finger-prick Glucose", result: "98",        unit: "mg/dL",  status: "Normal"   },
    ],
    diagnoses: [
      { code: "J06.9", name: "Acute Upper Respiratory Infection", severity: "Moderate" },
      { code: "J20.9", name: "Acute Bronchitis, unspecified",     severity: "Low"      },
    ],
    labs: ["CBC with Differential", "CRP / ESR", "Throat swab C&S"],
    prescriptions: [
      { drug: "Azithromycin 500 mg",        sig: "Once daily × 5 days",         qty: 5  },
      { drug: "Paracetamol 500 mg",         sig: "TID × 3 days PRN fever",      qty: 9  },
      { drug: "Salbutamol Inhaler 100 mcg", sig: "2 puffs TID",                 qty: 1  },
    ],
    imaging: [],
    carePlan: "Patient advised steam inhalation three times daily for 3 days and to maintain oral fluid intake of at least 2 litres per day. Complete rest is recommended and exertion should be avoided for the next 48 hours. Patient should return promptly if fever persists beyond 48 hours, worsens, or if shortness of breath develops. Full antibiotic course must be completed. Isolate from immunocompromised household contacts.",
    procedureOrders: ["Nebulization with Salbutamol 2.5 mg — stat dose"],
    referrals: [
      { specialty: "ENT", reason: "Persistent sore throat not responding to empiric therapy" },
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
      { name: "Sulfonamides", reaction: "Skin rash / urticaria", severity: "Moderate" },
      { name: "Latex",        reaction: "Contact dermatitis",    severity: "Mild"     },
    ],
    medicalHistory: ["Essential hypertension — diagnosed 2018", "Dyslipidemia — diagnosed 2021, on Rosuvastatin"],
    surgicalHistory: ["No prior surgeries"],
    familyHistory: ["Father — hypertension and stroke at 65", "Brother — coronary artery disease, MI at 58"],
    socialHistory: ["Ex-smoker — quit 2020 (15 pack-year history)", "No alcohol", "Sedentary desk job", "Married"],
    ros: ["Headache — frontal, morning predominance", "Visual disturbance — absent", "Chest pain — absent", "Palpitations — absent", "Ankle swelling — mild bilateral"],
    pe: ["General: Alert, well-oriented, mildly distressed from headache", "CVS: S1 S2 heard, no S3; BP 158/98 both arms", "Neuro: No focal neurological deficit", "Extremities: Mild pitting oedema +1 bilaterally"],
    pocLabs: [
      { test: "Point-of-care Glucose",    result: "112",   unit: "mg/dL", status: "Normal"   },
      { test: "Urine Dipstick — Protein", result: "Trace", unit: "",      status: "Abnormal" },
    ],
    diagnoses: [
      { code: "I10", name: "Essential Hypertension — Stage 2",         severity: "High"     },
      { code: "R51", name: "Headache (secondary to uncontrolled HTN)", severity: "Moderate" },
    ],
    labs: ["Electrolytes panel (Na / K / Cl)", "Renal function test (BUN / Creatinine)", "12-lead ECG"],
    prescriptions: [
      { drug: "Amlodipine 10 mg",         sig: "Once daily (dose increased from 5 mg)", qty: 30 },
      { drug: "Hydrochlorothiazide 25 mg", sig: "Once daily — new addition",             qty: 30 },
    ],
    imaging: ["Chest X-ray (PA view) — cardiac silhouette assessment"],
    carePlan: "Patient counselled on strict low-sodium diet with daily salt intake restricted to less than 2 g NaCl. Advised to maintain a daily home blood pressure log and bring it to the next visit; target BP below 130/80 mmHg. Caffeine and alcohol to be reduced or eliminated. Moderate aerobic exercise of at least 30 minutes per day encouraged on most days of the week. Daily weight monitoring recommended to track fluid retention and ankle oedema. Medication regimen intensified — strict adherence to both new agents essential.",
    procedureOrders: ["12-lead ECG — in clinic", "24-hour ambulatory BP monitoring (ABPM) — arranged"],
    referrals: [
      { specialty: "Cardiology", reason: "Uncontrolled Stage 2 hypertension with end-organ risk" },
      { specialty: "Dietitian",  reason: "Structured low-sodium diet counselling"                },
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
      { test: "Fasting Glucose", result: "188",      unit: "mg/dL", status: "Abnormal" },
      { test: "HbA1c (POC)",     result: "8.4",      unit: "%",     status: "Abnormal" },
      { test: "Urine Ketones",   result: "Negative", unit: "",      status: "Normal"   },
    ],
    diagnoses: [
      { code: "E11.9",  name: "Type 2 Diabetes Mellitus — Poorly Controlled", severity: "High"     },
      { code: "E11.36", name: "Diabetic Retinopathy — Background Stage",       severity: "Moderate" },
      { code: "E11.40", name: "Diabetic Peripheral Neuropathy",                severity: "Low"      },
    ],
    labs: ["HbA1c", "Fasting lipid panel", "Urine microalbumin / creatinine ratio", "Renal function test", "LFTs"],
    prescriptions: [
      { drug: "Metformin 1000 mg",           sig: "BD with meals (dose doubled)", qty: 60 },
      { drug: "Sitagliptin 100 mg",          sig: "Once daily — new addition",    qty: 30 },
      { drug: "Omega-3 Fatty Acids 1000 mg", sig: "Once daily with meal",         qty: 30 },
    ],
    imaging: ["Fundus photography — diabetic retinopathy grading"],
    carePlan: "Patient advised to follow a low-carbohydrate, low-GI diabetic diet and reduce portion sizes. Target HbA1c below 7% — medication regimen intensified to support this goal. Daily foot inspection at home is essential: patient to check for wounds, redness, swelling, or changes in sensation and report immediately. Referral placed to diabetic educator for structured self-management training and dietary coaching. Ophthalmology referral initiated for background retinopathy grading and ongoing management. Review appointment scheduled in 4 weeks to assess glucose response to the new regimen.",
    procedureOrders: ["Foot examination with 10 g monofilament sensory test", "Ankle-brachial index (ABI) measurement"],
    referrals: [
      { specialty: "Ophthalmology",     reason: "Background diabetic retinopathy — grading and management" },
      { specialty: "Diabetic Educator", reason: "Self-management training and diet counselling"            },
      { specialty: "Podiatry",          reason: "Peripheral neuropathy foot care programme"               },
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
