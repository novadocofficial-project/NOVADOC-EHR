import { useState, useEffect } from "react";
import {
  Plus, Edit2, Trash2, Copy, Eye,
  ChevronLeft, FileText, GripVertical,
  AlignLeft, CheckSquare, ToggleLeft, Hash, Calendar,
  Layers, Users, X, Check, BookOpen, Send, ArrowUp, ArrowDown,
  ChevronDown, ListChecks, Star, Clock, ToggleRight,
  AlertCircle, Stethoscope, FlaskConical, Tag, Pill, Scan, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Doctor } from "@/pages/DoctorsModule";

const ACCENT = "#4982CF";
const LS_KEY = "ehr-specialty-forms-v1";

// ── Types ─────────────────────────────────────────────────────────────────────

export type FieldType =
  | "textarea" | "text" | "checkbox-group" | "radio-group" | "number" | "date"
  | "dropdown" | "multiselect" | "rating" | "yes-no" | "time";

export type FormField = {
  id: string;
  label: string;
  type: FieldType;
  placeholder: string;
  options: string[];
  ratingMin?: number;
  ratingMax?: number;
  allowOther?: boolean;
  selectionStyle?: "ranked" | "simple";
};

export type FormSection = {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  globalOrder: number;
};

export type SystemComponentEntry = { id: string; order: number };

export type SpecialtyForm = {
  id: string;
  name: string;
  status: "draft" | "published";
  sections: FormSection[];
  assignedDoctorIds: string[];
  systemComponents: SystemComponentEntry[];
  createdAt: string;
  updatedAt: string;
};

// ── Storage helpers ───────────────────────────────────────────────────────────

const CHIEF_COMPLAINT_OPTIONS = [
  "Sneezing and Runny Nose", "Itchy and Watery Eyes", "Skin Rash",
  "Urticaria and Hives", "Swelling of the Skin", "Cough and Wheezing",
  "Chest Congestion", "Difficulty in Breathing", "Frequent Sore Throat",
  "Dry Cough", "Cough with Clear Sputum", "Postnasal Drip and Sinus Congestion",
  "Eczematous Rashes", "Allergy to Food", "Allergy to Medicine",
  "Nasal Polyps", "Repeated Ear Infection", "Plugged Ears", "Snoring and Sleep Apnea",
];

const ALLERGY_FORM_SECTIONS: FormSection[] = [
  {
    id: "s1", title: "Main Reason for Allergy Consultation", description: "", globalOrder: 0,
    fields: [
      { id: "f1-quick", label: "Chief Complaint", type: "multiselect", placeholder: "", allowOther: true, options: CHIEF_COMPLAINT_OPTIONS },
      { id: "f1-text", label: "Main Reason (Additional Details)", type: "textarea", placeholder: "Describe the main reason for this allergy consultation…", options: [] },
    ],
  },
  {
    id: "s-nasal", title: "Main Symptoms — Nasal / Eyes / Sinus / Throat", description: "", globalOrder: 100,
    fields: [{ id: "f-nasal", label: "Nasal / Eyes / Sinus / Throat Symptoms", type: "checkbox-group", placeholder: "", options: [
      "Runny nose", "Sneezing", "Blocked nose — Right", "Blocked nose — Left", "Blocked nose — Bilateral",
      "Itchy and watery eyes", "Red eyes", "Sinus congestion / pressure", "Postnasal drip",
      "Irritated throat with cough", "Frequent sore throats", "Nasal polyps", "Choking / tongue swelling",
      "Headache", "Sinus infections / positive X-ray", "Deviated nasal septum",
      "Enlarged turbinates", "History of nasal trauma",
    ] }],
  },
  {
    id: "s-chest-sx", title: "Main Symptoms — Chest", description: "", globalOrder: 200,
    fields: [{ id: "f-chest-sx", label: "Chest Symptoms", type: "checkbox-group", placeholder: "", options: [
      "Cough — dry", "Cough — with sputum", "Chest congestion", "Wheezing", "Difficulty breathing",
      "Chest tightness", "Difficulty breathing in", "Dyspnea on exertion", "Pain on breathing in",
      "Leg swelling — Left", "Leg swelling — Right", "Leg swelling — Bilateral",
      "Acid reflux / acidity", "Anxiety / panic attacks", "Waking up at night",
      "Fever — high grade", "Fever — low grade", "Weight loss", "H/O pneumonia",
      "Use of ACE inhibitors / BCPs", "Exposure to smoke", "Environmental risks",
    ] }],
  },
  {
    id: "s-skin-sx", title: "Main Symptoms — Skin", description: "", globalOrder: 300,
    fields: [{ id: "f-skin-sx", label: "Skin Symptoms / Details", type: "textarea", placeholder: "Describe skin symptoms, rash type, distribution, triggers…", options: [] }],
  },
  {
    id: "s-food-sx", title: "Main Symptoms — Food Allergies", description: "", globalOrder: 400,
    fields: [{ id: "f-food-sx", label: "Food Allergy Details", type: "textarea", placeholder: "Foods causing reactions, type of reaction, severity…", options: [] }],
  },
  {
    id: "s-drug-sx", title: "Main Symptoms — Drug Allergies", description: "", globalOrder: 500,
    fields: [{ id: "f-drug-sx", label: "Drug Allergy Details", type: "textarea", placeholder: "Drugs causing reactions, type of reaction, severity…", options: [] }],
  },
  {
    id: "s-immuno-sx", title: "Main Symptoms — Immunodeficiency", description: "", globalOrder: 600,
    fields: [{ id: "f-immuno-sx", label: "Immunodeficiency Details", type: "textarea", placeholder: "Recurrent infections, immune deficiency history…", options: [] }],
  },
  {
    id: "s-anaphylaxis", title: "Main Symptoms — Anaphylaxis / HAE", description: "", globalOrder: 700,
    fields: [{ id: "f-anaphylaxis", label: "Anaphylaxis / HAE Details", type: "textarea", placeholder: "Episodes of anaphylaxis or hereditary angioedema, triggers, treatment…", options: [] }],
  },
  {
    id: "s-other-sx", title: "Main Symptoms — Other", description: "", globalOrder: 800,
    fields: [
      { id: "f-other-sx-check", label: "Other Symptoms", type: "checkbox-group", placeholder: "", options: ["H/O pneumonia / sinus infection"] },
      { id: "f-other-sx-text", label: "Other Symptoms Details", type: "textarea", placeholder: "Other symptoms and relevant details…", options: [] },
    ],
  },
  {
    id: "s-duration", title: "Duration & Pattern of Symptoms", description: "", globalOrder: 900,
    fields: [
      { id: "f-duration", label: "Duration of Symptoms", type: "text", placeholder: "e.g. 3 weeks, 6 months, 2 years…", options: [] },
      { id: "f-worse-duration", label: "Symptoms Worse For", type: "text", placeholder: "e.g. last 2 weeks, past month…", options: [] },
    ],
  },
  {
    id: "s-assoc-sx", title: "Associated Symptoms", description: "", globalOrder: 1000,
    fields: [{ id: "f-assoc-sx", label: "Associated Symptoms", type: "checkbox-group", placeholder: "", options: [
      "Cough / chest congestion", "Frequent sore throat", "Post-nasal drip", "Sinus congestion",
      "Cough — dry", "Cough — productive", "Cough — with blood", "Migraine headache",
      "Wheezing", "Shortness of breath", "Chest tightness", "Chest congestion", "Chest pain",
      "Difficulty breathing", "Skin rash", "Acid reflux", "Choking of the throat",
      "Edema of the tongue", "Headache", "Anxiety / stress", "H/O eczema / dry skin",
      "H/O pneumonia / sinus infection", "Food allergies",
    ] }],
  },
  {
    id: "s-aggravating", title: "Aggravating Factors", description: "", globalOrder: 1100,
    fields: [{ id: "f-aggravating", label: "Aggravating Factors", type: "checkbox-group", placeholder: "", options: [
      "House dust", "Animals — cats", "Animals — dogs", "Animals — birds", "Animals — other",
      "URTIs", "Seasons — summer", "Seasons — winter", "All year / season changes",
      "Indoor", "Outdoors", "Cities / locations", "Home", "Work", "Perfumes",
      "Kitchen environment", "Foods", "Moisture / molds / leaks", "Biomass exposure",
      "Chemicals / hobby materials", "Other",
    ] }],
  },
  {
    id: "s-relieving", title: "Relieving Factors", description: "", globalOrder: 1200,
    fields: [{ id: "f-relieving", label: "Relieving Factors", type: "checkbox-group", placeholder: "", options: [
      "Seasons", "Cities / locations", "Indoors", "Outdoors", "Triggers avoidance",
      "Home", "Work", "Air conditioning", "Air purifier", "Masks", "Protective gear", "Other",
    ] }],
  },
  {
    id: "s4", title: "Current Medications", description: "Name, dose/form, frequency, duration", globalOrder: 1300,
    fields: [{ id: "f4", label: "Current Medications", type: "multiselect", placeholder: "Select medications…", allowOther: true, selectionStyle: "simple", options: [
      "Rigix (Cetirizine)", "Telfast (Fexofenadine)", "Kestine (Ebastine)", "Myteka (Montelukast)",
      "Hivate (Mometesone)", "Flixonose (Fluticasone)", "Nebulized Treatment", "Ventolin Inhaler",
      "Foster Inhaler", "Seretide Inhaler", "Combivair", "T-Day 5mg", "T-Day 10mg",
    ] }],
  },
  {
    id: "s-past-meds", title: "Past Medicines", description: "Categories previously used", globalOrder: 1400,
    fields: [{ id: "f-past-meds", label: "Past Medication Categories", type: "checkbox-group", placeholder: "", options: [
      "Allergy tablets / syrups", "Nasal sprays", "Inhalers — controllers", "Inhalers — relievers",
      "Nebulizer medicines", "Oral steroids", "Injectable steroids", "Creams", "Antibiotics",
      "Biological medicines", "Allergy vaccine — oral (SLIT)", "Allergy vaccine — subcutaneous (SCIT)",
      "Immunizations", "Hakimi", "Homeopathy", "Natural therapies", "Other",
    ] }],
  },
  {
    id: "s-med-allergy", title: "Medicine Allergies", description: "Generic name and type of reaction", globalOrder: 1500,
    fields: [{ id: "f-med-allergy", label: "Medicine Allergy Details", type: "textarea", placeholder: "e.g. Penicillin — anaphylaxis; Aspirin — urticaria…", options: [] }],
  },
  {
    id: "s-medical-cond", title: "Current & Past Medical Conditions", description: "", globalOrder: 1600,
    fields: [{ id: "f-medical-cond", label: "Medical Conditions", type: "checkbox-group", placeholder: "", options: [
      "Hypertension", "Diabetes", "PUD / GERD", "Arthritis / back pain", "Heart disease",
      "Kidney / prostate", "Tuberculosis (T.B.)", "Liver disease", "COPD", "Obesity",
      "Anxiety / panic disorder", "Lipid disorder", "Hepatitis / jaundice", "Ulcers", "Other",
    ] }],
  },
  {
    id: "s-surgical", title: "Past Surgical History", description: "", globalOrder: 1700,
    fields: [{ id: "f-surgical", label: "Surgeries / Procedures", type: "checkbox-group", placeholder: "", options: [
      "Sinus / nasal polyp surgery", "Tonsillectomy", "Adenoidectomy", "Ear surgeries",
      "Appendectomy", "Hernia repair", "Cataract / eye surgery", "Joint surgery", "Other",
    ] }],
  },
  {
    id: "s-emergency", title: "Past Emergency Visits, Hospitalizations & Procedures", description: "", globalOrder: 1800,
    fields: [
      { id: "f-emergency", label: "Emergency Visit Details", type: "textarea", placeholder: "Date: ___  Reason: ___\nDate: ___  Reason: ___", options: [] },
      { id: "f-hospitalization", label: "Hospitalization Details", type: "textarea", placeholder: "Date: ___  Reason: ___\nDate: ___  Reason: ___", options: [] },
      { id: "f-procedures", label: "Procedures (date, reason)", type: "textarea", placeholder: "Date: ___  Reason: ___\nDate: ___  Reason: ___", options: [] },
    ],
  },
  {
    id: "s-recent-tests", title: "Recent Diagnostic Tests", description: "", globalOrder: 1900,
    fields: [
      { id: "f-allergy-tests", label: "Allergy Related Tests", type: "checkbox-group", placeholder: "", options: [
        "CBC", "IgE", "Allergy blood tests", "Allergy skin tests", "PFTs / peak flow",
        "Sinus X-ray", "CT sinus", "Chest X-ray", "Other",
      ] },
      { id: "f-general-tests", label: "General Tests", type: "checkbox-group", placeholder: "", options: [
        "TSH", "LFTs", "Vitamin B12", "Ultrasounds", "Urine", "ECG", "Other",
      ] },
    ],
  },
  {
    id: "s-family-hx", title: "Family History", description: "", globalOrder: 2000,
    fields: [
      { id: "f-family-allergy", label: "Allergy Related Conditions", type: "checkbox-group", placeholder: "", options: [
        "Sinus / nasal congestion", "Asthma", "Skin rash", "Food allergy", "Drug allergy", "Immunodeficiency",
      ] },
      { id: "f-family-general", label: "Non-Allergy Related Conditions", type: "checkbox-group", placeholder: "", options: [
        "Diabetes", "Hypertension", "Thyroid disease", "Arthritis / back pain", "Overweight", "Mental illness",
      ] },
    ],
  },
  {
    id: "s-social", title: "Social History", description: "", globalOrder: 2100,
    fields: [{ id: "f-social", label: "Social History", type: "checkbox-group", placeholder: "", options: [
      "Smoker — current", "Smoker — past", "Vape / e-cigarette", "Oral tobacco",
      "Tea", "Coffee", "Alcohol", "Exercise / gym", "Exposure in hobbies", "Cold beverages",
    ] }],
  },
  {
    id: "s-ros", title: "Review of Systems", description: "", globalOrder: 2200,
    fields: [{ id: "f-ros", label: "Systems Review", type: "checkbox-group", placeholder: "", options: [
      "Stomach / intestines", "Thyroid", "Heart", "Lungs", "Skin", "Arthritis / morning stiffness",
      "Anxiety", "Ears / hearing", "Insomnia", "Fatigue / weakness", "Weight gain", "Weight loss",
      "Bladder / kidney", "Liver disease", "Other",
    ] }],
  },
  {
    id: "s-home-env", title: "Home / Area Environment", description: "", globalOrder: 2300,
    fields: [
      { id: "f-home-type", label: "Residence Type", type: "checkbox-group", placeholder: "", options: [
        "Urban", "Rural", "House", "Apartment",
      ] },
      { id: "f-home-area", label: "Area Characteristics", type: "checkbox-group", placeholder: "", options: [
        "Heavy traffic / pollution", "Garden / open space", "Industrial area / waste",
        "Surrounding greenery", "Other",
      ] },
    ],
  },
  {
    id: "s-indoor-env", title: "Indoor Environment", description: "", globalOrder: 2400,
    fields: [{ id: "f-indoor", label: "Indoor Environment Features", type: "checkbox-group", placeholder: "", options: [
      "Indoor pets", "Smokers in home", "Air conditioning", "Cooler",
      "Full carpet floor", "Rug floor", "Tiles floor", "Mosaic floor", "Wood floor", "Marble floor",
      "Moldy walls / floors", "Air cleaner", "Ventilation", "Humidifier", "Other",
    ] }],
  },
  {
    id: "s-bedroom-env", title: "Bedroom Environment", description: "", globalOrder: 2500,
    fields: [{ id: "f-bedroom", label: "Bedroom Environment Features", type: "checkbox-group", placeholder: "", options: [
      "Full carpet / rug", "Laminate", "Tile", "Mosaic", "Cement floor", "Dust collectors",
      "Pets in bedroom", "Stuffed toys", "Charpai", "Foam mattress", "Spring mattress",
      "Air purifier", "Air cleaner", "History of leaks / flooding", "Humidifier",
      "Heavy curtains", "Dust mopping routine", "Other",
    ] }],
  },
  {
    id: "s-work-env", title: "Work Environment", description: "", globalOrder: 2600,
    fields: [
      { id: "f-work-text", label: "Present Occupation & Years at Job", type: "text", placeholder: "e.g. Teacher, 5 years…", options: [] },
      { id: "f-work-features", label: "Work Environment Features", type: "checkbox-group", placeholder: "", options: [
        "Outdoor work", "Indoor work", "Clean environment", "Dusty environment",
        "Ventilation compliance", "Hazardous exposure", "Protection equipment used",
      ] },
    ],
  },
  {
    id: "s5", title: "Physical Examination", description: "", globalOrder: 2700,
    fields: [{ id: "f5", label: "Physical Examination Findings", type: "multiselect", placeholder: "Select examination findings…", allowOther: true, selectionStyle: "simple", options: [
      "The Physical Examination is normal", "Bilateral Crackles", "Bilateral Wheezing",
      "Clear Nasal Discharge", "Dry Skin in General", "Eczematous Rashes",
      "Erythematous Conjunctiva", "Erythematous Throat with Post Nasal Drip",
      "Nasal Congestion", "Post Nasal Drip", "Swelling of Lips and Face",
      "Urticarial Rashes", "Wheezing on the Left Side", "Wheezing on the Right",
    ] }],
  },
  {
    id: "s7", title: "Provisional Diagnosis", description: "", globalOrder: 2800,
    fields: [{ id: "f8", label: "Diagnosis", type: "multiselect", placeholder: "Select diagnosis…", allowOther: true, selectionStyle: "simple", options: [
      "Airway Disease (Unspecified) — J98.9", "Allergic Conjunctivitis — H10.13",
      "Allergic Rhinitis — J30.9", "Anaphylactic Reaction — T78.2XXA", "Angioedema — T78.3XXA",
      "Anxiety — F41.9", "Anxiety and Depression — F41.8", "Asthma — J45.909",
      "Atopic Dermatitis — L20.9", "Bronchitis — J40", "Chronic Sinusitis — J32.9",
      "Chronic Urticaria — L50.8", "Contact Dermatitis — L25.9", "Drug Allergy — Z88.9",
      "Dry Skin — L85.3", "Food Allergy — Z91.018", "Fungal Skin Infection — B36.9",
      "Gluten Allergy — K90.41", "Hair Color Allergy — L23.4", "Hereditary Angioedema — D84.1",
      "Immune Deficiency — D84.9", "NSAID Allergy — Z88.6", "Postnasal Drip — R09.82",
      "Reactive Airway Disease — J45.909", "Recurrent Sore Throats — J31.2",
    ] }],
  },
  {
    id: "s8", title: "Diagnostic Tests Ordered", description: "", globalOrder: 2900,
    fields: [{ id: "f9", label: "Tests Ordered", type: "checkbox-group", placeholder: "", options: [
      "CBC", "PFT", "CRP", "Food allergy blood test", "Oral drug challenge",
      "IgA / IgG levels", "C4 level", "IgE", "Chest X-ray", "TSH",
      "C1 esterase inhibitor level", "Environmental allergy skin tests", "HRCT chest",
      "Thyroid antibodies", "Anti-transglutaminase IgA / IgG", "Sinus X-ray",
      "Tryptase level", "Environmental allergy blood tests", "Peak flow meter reading",
      "Vitamin B12", "Food diary", "Food allergy panel", "Asthma assessment test",
      "Vitamin D", "Oral food challenge", "Limited CT sinus", "ANA",
      "Sputum for eosinophils", "Patch skin testing", "Skin biopsy",
    ] }],
  },
  {
    id: "s10", title: "Treatment Plan", description: "", globalOrder: 3000,
    fields: [{ id: "f11", label: "Treatment Plan", type: "checkbox-group", placeholder: "", options: [
      "Antihistamines", "Nasal spray", "Inhalers", "LK inhibitors",
      "Oral steroids", "Injectable steroids", "Allergy vaccination — SLIT",
      "Allergy vaccination — SCIT", "Biologics",
    ] }],
  },
  {
    id: "s-education", title: "Patient Education", description: "", globalOrder: 3100,
    fields: [{ id: "f-education", label: "Patient Education Notes", type: "textarea", placeholder: "Allergen avoidance, inhaler technique, nasal spray technique, lifestyle modifications, websites…", options: [] }],
  },
  {
    id: "s11", title: "Specialist Referrals", description: "", globalOrder: 3200,
    fields: [{ id: "f12", label: "Referrals", type: "checkbox-group", placeholder: "", options: [
      "ENT", "Primary care physician", "Pulmonary", "Nutritionist",
      "Clinical psychologist", "Psychiatrist", "Other",
    ] }],
  },
  {
    id: "s6", title: "Red Flags", description: "Check all red flag signs that are present", globalOrder: 3300,
    fields: [{ id: "f7", label: "Red Flag Signs", type: "checkbox-group", placeholder: "", options: [
      "Anaphylaxis", "Severe dyspnea", "Angioedema", "Hypotension",
      "Loss of consciousness", "High-grade fever (> 39°C)",
    ] }],
  },
  {
    id: "s9", title: "General Measures", description: "", globalOrder: 3400,
    fields: [{ id: "f10", label: "General Management", type: "textarea", placeholder: "Diet, lifestyle modifications, allergen avoidance…", options: [] }],
  },
  {
    id: "s12", title: "Others", description: "", globalOrder: 3500,
    fields: [{ id: "f13", label: "Additional Notes", type: "textarea", placeholder: "Any other observations, instructions, or follow-up plan…", options: [] }],
  },
  {
    id: "s13", title: "Follow-Up Visit", description: "", globalOrder: 3600,
    fields: [
      { id: "f13-when", label: "Follow-Up Timeframe", type: "radio-group", placeholder: "", options: ["Days", "Weeks", "Months", "Years", "As needed"] },
      { id: "f14", label: "Follow-Up Date", type: "date", placeholder: "", options: [] },
    ],
  },
];

export function loadForms(): SpecialtyForm[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const forms = JSON.parse(raw) as SpecialtyForm[];
      // Migration: ensure all forms have systemComponents array
      forms.forEach(f => { if (!f.systemComponents) f.systemComponents = []; });
      // Migration v2: replace sf-asif-immuno sections with comprehensive allergy form
      const asif = forms.find(f => f.id === "sf-asif-immuno");
      if (asif && !asif.sections.find(s => s.id === "s-nasal")) {
        asif.sections = ALLERGY_FORM_SECTIONS.map(s => ({ ...s }));
      }
      // Migration: backfill globalOrder on sections for ALL forms; remap SC orders into unified space
      forms.forEach(f => {
        const missesGlobalOrder = f.sections.some(s => (s as FormSection & { globalOrder?: number }).globalOrder == null);
        if (missesGlobalOrder) {
          f.sections.forEach((s, i) => {
            if ((s as FormSection & { globalOrder?: number }).globalOrder == null)
              (s as FormSection).globalOrder = i * 100;
          });
          const maxSectionOrder = f.sections.reduce((m, s) => Math.max(m, s.globalOrder ?? 0), 0);
          const sortedScs = [...f.systemComponents].sort((a, b) => a.order - b.order);
          sortedScs.forEach((sc, i) => { sc.order = maxSectionOrder + (i + 1) * 100; });
          f.systemComponents = sortedScs;
        }
        // Ensure migration-added s13 has a valid globalOrder (use nullish, not falsy, to allow 0)
        const s13 = f.sections.find(s => s.id === "s13");
        if (s13 && (s13 as FormSection & { globalOrder?: number }).globalOrder == null)
          s13.globalOrder = f.sections.length * 100;
      });
      localStorage.setItem(LS_KEY, JSON.stringify(forms));
      return forms;
    }
  } catch { /**/ }
  return SEED_FORMS;
}

function saveForms(forms: SpecialtyForm[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(forms)); } catch { /**/ }
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_FORMS: SpecialtyForm[] = [
  {
    id: "sf-asif-immuno",
    name: "Dr. Asif Imam — Immunology Consultation",
    status: "published",
    assignedDoctorIds: ["doc-asif"],
    systemComponents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: ALLERGY_FORM_SECTIONS,
  },
];

// ── Field type metadata ───────────────────────────────────────────────────────

const FIELD_TYPES: { value: FieldType; label: string; icon: React.ReactNode }[] = [
  { value: "textarea",       label: "Text Area",             icon: <AlignLeft   className="h-3.5 w-3.5" /> },
  { value: "text",           label: "Text Input",            icon: <FileText    className="h-3.5 w-3.5" /> },
  { value: "checkbox-group", label: "Checkbox Group",        icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { value: "radio-group",    label: "Radio Group",           icon: <ToggleLeft  className="h-3.5 w-3.5" /> },
  { value: "dropdown",       label: "Dropdown",              icon: <ChevronDown className="h-3.5 w-3.5" /> },
  { value: "multiselect",    label: "Multi-select Dropdown", icon: <ListChecks  className="h-3.5 w-3.5" /> },
  { value: "number",         label: "Number",                icon: <Hash        className="h-3.5 w-3.5" /> },
  { value: "rating",         label: "Rating Scale",          icon: <Star        className="h-3.5 w-3.5" /> },
  { value: "yes-no",         label: "Yes / No",              icon: <ToggleRight className="h-3.5 w-3.5" /> },
  { value: "date",           label: "Date",                  icon: <Calendar    className="h-3.5 w-3.5" /> },
  { value: "time",           label: "Time",                  icon: <Clock       className="h-3.5 w-3.5" /> },
];

function fieldTypeLabel(t: FieldType) {
  return FIELD_TYPES.find(f => f.value === t)?.label ?? t;
}

// ── System Component catalog ──────────────────────────────────────────────────

export const SYSTEM_COMPONENTS: {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { id: "chief-complaint", label: "Chief Complaint",                     icon: FileText,     color: "#4982CF" },
  { id: "hpi",             label: "History of Present Illness",           icon: BookOpen,     color: "#8b5cf6" },
  { id: "allergies",       label: "Allergies",                            icon: AlertCircle,  color: "#ef4444" },
  { id: "medical-history", label: "Medical, Surgical & Family History",   icon: Users,        color: "#10b981" },
  { id: "ros",             label: "Review of Systems",                    icon: ListChecks,   color: "#0ea5e9" },
  { id: "physical-exam",   label: "Physical Examination",                 icon: Stethoscope,  color: "#06b6d4" },
  { id: "poc-labs",        label: "Point of Care Labs",                   icon: FlaskConical, color: "#f59e0b" },
  { id: "diagnosis",       label: "Diagnosis",                            icon: Tag,          color: "#6366f1" },
  { id: "lab-orders",      label: "Lab Orders",                           icon: FlaskConical, color: "#f59e0b" },
  { id: "formulary",       label: "Prescriptions / Formulary",            icon: Pill,         color: "#8b5cf6" },
  { id: "imaging",         label: "Imaging",                              icon: Scan,         color: "#0ea5e9" },
  { id: "care-plan",       label: "Care Plan",                            icon: ClipboardList, color: "#10b981" },
  { id: "referrals",       label: "Referrals",                            icon: Users,        color: "#6366f1" },
  { id: "patient-goals",   label: "Patient Goals",                        icon: CheckSquare,  color: "#ec4899" },
];

// ── Factory helpers ───────────────────────────────────────────────────────────

function makeForm(): SpecialtyForm {
  return {
    id: `sf-${Date.now()}`,
    name: "Untitled Form",
    status: "draft",
    sections: [],
    assignedDoctorIds: [],
    systemComponents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeSection(globalOrder = 0): FormSection {
  return { id: `sec-${Date.now()}`, title: "New Section", description: "", fields: [], globalOrder };
}

function makeField(): FormField {
  return { id: `fld-${Date.now()}`, label: "New Field", type: "textarea", placeholder: "", options: [] };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Module
// ═══════════════════════════════════════════════════════════════════════════════

export function SpecialtyFormsModule({ doctors }: { doctors: Doctor[] }) {
  const [forms, setForms] = useState<SpecialtyForm[]>(loadForms);
  const [view, setView]   = useState<"listing" | "builder">("listing");
  const [editingForm, setEditingForm] = useState<SpecialtyForm | null>(null);
  const [deleteId, setDeleteId]       = useState<string | null>(null);

  useEffect(() => { saveForms(forms); }, [forms]);

  const openCreate = () => {
    setEditingForm(makeForm());
    setView("builder");
  };

  const openEdit = (form: SpecialtyForm) => {
    setEditingForm(JSON.parse(JSON.stringify(form)) as SpecialtyForm);
    setView("builder");
  };

  const duplicate = (form: SpecialtyForm) => {
    const copy: SpecialtyForm = {
      ...(JSON.parse(JSON.stringify(form)) as SpecialtyForm),
      id:               `sf-${Date.now()}`,
      name:             `${form.name} (Copy)`,
      status:           "draft",
      assignedDoctorIds: [],
      createdAt:        new Date().toISOString(),
      updatedAt:        new Date().toISOString(),
    };
    setForms(prev => [...prev, copy]);
  };

  const handleSave = (updated: SpecialtyForm) => {
    const stamped = { ...updated, updatedAt: new Date().toISOString() };
    setForms(prev => {
      const idx = prev.findIndex(f => f.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = stamped;
        return next;
      }
      return [...prev, stamped];
    });
    setView("listing");
    setEditingForm(null);
  };

  const confirmDelete = () => {
    if (deleteId) setForms(prev => prev.filter(f => f.id !== deleteId));
    setDeleteId(null);
  };

  // ── Builder view ────────────────────────────────────────────────────────────

  if (view === "builder" && editingForm) {
    return (
      <FormBuilder
        form={editingForm}
        doctors={doctors}
        onSave={handleSave}
        onBack={() => { setView("listing"); setEditingForm(null); }}
      />
    );
  }

  // ── Listing view ────────────────────────────────────────────────────────────

  const published = forms.filter(f => f.status === "published").length;
  const drafts    = forms.filter(f => f.status === "draft").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Specialty Forms</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create custom clinical forms for doctors as an alternative to the standard SOAP Note.
          </p>
        </div>
        <Button className="bg-[#4982CF] text-white hover:bg-[#3D73BC]" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />New Form
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Forms", value: forms.length, color: "text-slate-700" },
          { label: "Published",   value: published,    color: "text-emerald-700" },
          { label: "Drafts",      value: drafts,       color: "text-amber-700" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={`mt-1 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Form list */}
      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-slate-400">
          <Layers className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">No specialty forms yet</p>
          <p className="mt-1 text-xs">Click "New Form" to create your first custom clinical form</p>
          <Button className="mt-4 bg-[#4982CF] text-white hover:bg-[#3D73BC]" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />New Form
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map(form => {
            const assignedDoctors = doctors.filter(d => form.assignedDoctorIds.includes(d.id));
            const totalFields     = form.sections.reduce((a, s) => a + s.fields.length, 0);
            return (
              <div
                key={form.id}
                className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm hover:border-[#4982CF]/30 transition-colors"
              >
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[#4982CF]/10">
                  <BookOpen className="h-5 w-5 text-[#4982CF]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800 truncate">{form.name}</p>
                    <Badge className={
                      form.status === "published"
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20"
                        : "bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20"
                    }>
                      {form.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span>{form.sections.length} section{form.sections.length !== 1 ? "s" : ""}</span>
                    <span className="text-slate-300">·</span>
                    <span>{totalFields} field{totalFields !== 1 ? "s" : ""}</span>
                    <span className="text-slate-300">·</span>
                    {assignedDoctors.length > 0 ? (
                      <span className="font-medium" style={{ color: ACCENT }}>
                        {assignedDoctors.slice(0, 2).map(d => d.name).join(", ")}
                        {assignedDoctors.length > 2 && ` +${assignedDoctors.length - 2} more`}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">No doctors assigned</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-none items-center gap-1">
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-slate-400 hover:bg-[#4982CF]/10 hover:text-[#4982CF]"
                    onClick={() => openEdit(form)} title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-slate-400 hover:bg-slate-100"
                    onClick={() => duplicate(form)} title="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => setDeleteId(form.id)} title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the specialty form, all its sections and fields, and its
              doctor assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              Delete Form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Form Builder
// ═══════════════════════════════════════════════════════════════════════════════

function FormBuilder({
  form: initialForm,
  doctors,
  onSave,
  onBack,
}: {
  form: SpecialtyForm;
  doctors: Doctor[];
  onSave: (form: SpecialtyForm) => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState<SpecialtyForm>(initialForm);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialForm.sections[0]?.id ?? null,
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"fields" | "assignments" | "system-components">("fields");

  const selectedSection = form.sections.find(s => s.id === selectedSectionId) ?? null;

  // ── Section mutations ──────────────────────────────────────────────────────

  const addSection = () => {
    const allPositions = [
      ...form.sections.map(s => s.globalOrder),
      ...form.systemComponents.map(c => c.order),
    ];
    const nextPos = allPositions.length > 0 ? Math.max(...allPositions) + 100 : 0;
    const sec = makeSection(nextPos);
    setForm(f => ({ ...f, sections: [...f.sections, sec] }));
    setSelectedSectionId(sec.id);
    setActiveTab("fields");
  };

  const updateSectionTitle = (id: string, title: string) =>
    setForm(f => ({ ...f, sections: f.sections.map(s => s.id === id ? { ...s, title } : s) }));

  const updateSectionDesc = (id: string, description: string) =>
    setForm(f => ({ ...f, sections: f.sections.map(s => s.id === id ? { ...s, description } : s) }));

  const deleteSection = (id: string) => {
    const remaining = form.sections.filter(s => s.id !== id);
    setForm(f => ({ ...f, sections: remaining }));
    if (selectedSectionId === id) setSelectedSectionId(remaining[0]?.id ?? null);
  };

  const moveSection = (id: string, dir: -1 | 1) => {
    setForm(f => {
      const arr = [...f.sections];
      const idx = arr.findIndex(s => s.id === id);
      const to  = idx + dir;
      if (idx < 0 || to < 0 || to >= arr.length) return f;
      const goA = arr[idx].globalOrder;
      const goB = arr[to].globalOrder;
      [arr[idx], arr[to]] = [arr[to], arr[idx]];
      arr[idx] = { ...arr[idx], globalOrder: goA };
      arr[to]  = { ...arr[to],  globalOrder: goB };
      return { ...f, sections: arr };
    });
  };

  // ── Field mutations ────────────────────────────────────────────────────────

  const addField = (sectionId: string) => {
    const fld = makeField();
    setForm(f => ({
      ...f,
      sections: f.sections.map(s =>
        s.id === sectionId ? { ...s, fields: [...s.fields, fld] } : s,
      ),
    }));
  };

  const updateField = (sectionId: string, fieldId: string, patch: Partial<FormField>) =>
    setForm(f => ({
      ...f,
      sections: f.sections.map(s =>
        s.id !== sectionId ? s
          : { ...s, fields: s.fields.map(fld => fld.id === fieldId ? { ...fld, ...patch } : fld) },
      ),
    }));

  const deleteField = (sectionId: string, fieldId: string) =>
    setForm(f => ({
      ...f,
      sections: f.sections.map(s =>
        s.id !== sectionId ? s : { ...s, fields: s.fields.filter(fld => fld.id !== fieldId) },
      ),
    }));

  const duplicateField = (sectionId: string, fieldId: string) =>
    setForm(f => ({
      ...f,
      sections: f.sections.map(s => {
        if (s.id !== sectionId) return s;
        const idx = s.fields.findIndex(fld => fld.id === fieldId);
        if (idx < 0) return s;
        const copy = { ...s.fields[idx], id: `fld-${Date.now()}` };
        const arr  = [...s.fields];
        arr.splice(idx + 1, 0, copy);
        return { ...s, fields: arr };
      }),
    }));

  const moveField = (sectionId: string, fieldId: string, dir: -1 | 1) =>
    setForm(f => ({
      ...f,
      sections: f.sections.map(s => {
        if (s.id !== sectionId) return s;
        const arr = [...s.fields];
        const idx = arr.findIndex(fld => fld.id === fieldId);
        const to  = idx + dir;
        if (idx < 0 || to < 0 || to >= arr.length) return s;
        [arr[idx], arr[to]] = [arr[to], arr[idx]];
        return { ...s, fields: arr };
      }),
    }));

  // ── Doctor assignment ──────────────────────────────────────────────────────

  const toggleDoctor = (docId: string) =>
    setForm(f => ({
      ...f,
      assignedDoctorIds: f.assignedDoctorIds.includes(docId)
        ? f.assignedDoctorIds.filter(id => id !== docId)
        : [...f.assignedDoctorIds, docId],
    }));

  // ── System component mutations ─────────────────────────────────────────────

  const toggleSystemComponent = (id: string) =>
    setForm(f => {
      const current = f.systemComponents ?? [];
      const exists = current.some(c => c.id === id);
      if (exists) return { ...f, systemComponents: current.filter(c => c.id !== id) };
      const allPositions = [
        ...f.sections.map(s => s.globalOrder),
        ...current.map(c => c.order),
      ];
      const nextOrder = allPositions.length > 0 ? Math.max(...allPositions) + 100 : 100;
      return { ...f, systemComponents: [...current, { id, order: nextOrder }] };
    });

  const moveInLayout = (itemId: string, itemType: "section" | "sc", dir: -1 | 1) =>
    setForm(f => {
      const unified = [
        ...f.sections.map(s => ({ type: "section" as const, id: s.id, pos: s.globalOrder })),
        ...f.systemComponents.map(sc => ({ type: "sc" as const, id: sc.id, pos: sc.order })),
      ].sort((a, b) => a.pos - b.pos);
      const idx = unified.findIndex(item => item.id === itemId && item.type === itemType);
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= unified.length) return f;
      const posA = unified[idx].pos;
      const posB = unified[to].pos;
      unified[idx] = { ...unified[idx], pos: posB };
      unified[to]  = { ...unified[to],  pos: posA };
      const newSections = f.sections.map(s => {
        const u = unified.find(x => x.type === "section" && x.id === s.id);
        return u ? { ...s, globalOrder: u.pos } : s;
      });
      const newSCs = f.systemComponents.map(sc => {
        const u = unified.find(x => x.type === "sc" && x.id === sc.id);
        return u ? { ...sc, order: u.pos } : sc;
      });
      return { ...f, sections: newSections, systemComponents: newSCs };
    });

  // ── Preview ────────────────────────────────────────────────────────────────

  if (previewMode) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex flex-none items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
          <Button variant="ghost" size="sm" onClick={() => setPreviewMode(false)} className="text-slate-600">
            <ChevronLeft className="mr-1 h-4 w-4" />Back to Builder
          </Button>
          <div className="w-px h-4 bg-slate-200" />
          <span className="text-sm font-bold text-slate-800 truncate">{form.name || "Untitled Form"}</span>
          <Badge className="bg-[#4982CF]/10 border-[#4982CF]/20 text-[#4982CF]">Preview</Badge>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl space-y-5">
            <h1 className="text-xl font-bold text-slate-900">{form.name || "Untitled Form"}</h1>
            {form.sections.length === 0 ? (
              <p className="text-sm italic text-slate-400">No sections added yet.</p>
            ) : form.sections.map((sec, idx) => (
              <div key={sec.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <p className="font-bold text-slate-800">{idx + 1}. {sec.title}</p>
                  {sec.description && <p className="mt-0.5 text-xs text-slate-500">{sec.description}</p>}
                </div>
                <div className="space-y-4 px-5 py-4">
                  {sec.fields.length === 0 ? (
                    <p className="text-xs italic text-slate-400">No fields in this section.</p>
                  ) : sec.fields.map(fld => (
                    <PreviewField key={fld.id} field={fld} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Builder ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-none items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 text-slate-600">
          <ChevronLeft className="mr-1 h-4 w-4" />Forms
        </Button>
        <div className="w-px h-4 shrink-0 bg-slate-200" />
        <Input
          className="h-8 max-w-xs border-0 bg-transparent px-0 text-sm font-bold text-slate-800 focus-visible:ring-0 placeholder:font-normal placeholder:text-slate-400"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Form name..."
        />
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => setPreviewMode(true)}>
          <Eye className="mr-1.5 h-3.5 w-3.5" />Preview
        </Button>
        <Button
          variant="outline" size="sm" className="shrink-0"
          onClick={() => onSave({ ...form, status: "draft" })}
        >
          Save Draft
        </Button>
        <Button
          size="sm"
          className="shrink-0 text-white hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
          onClick={() => onSave({ ...form, status: "published" })}
        >
          <Send className="mr-1.5 h-3.5 w-3.5" />Publish
        </Button>
      </div>

      {/* Body: three-panel layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Section list ── */}
        <div className="flex w-52 flex-none flex-col border-r border-slate-200 bg-slate-50 overflow-hidden">
          <div className="flex flex-none items-center justify-between border-b border-slate-200 px-3 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Layout</span>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 hover:bg-[#4982CF]/10"
              style={{ color: ACCENT }}
              onClick={addSection}
              title="Add section"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {(() => {
              const enabledSCs = form.systemComponents ?? [];
              const unified = [
                ...form.sections.map(s => ({ type: "section" as const, id: s.id, pos: s.globalOrder })),
                ...enabledSCs.map(sc => ({ type: "sc" as const, id: sc.id, pos: sc.order })),
              ].sort((a, b) => a.pos - b.pos);
              const sectionNumbers = Object.fromEntries(
                [...form.sections].sort((a, b) => a.globalOrder - b.globalOrder).map((s, i) => [s.id, i + 1])
              );
              if (unified.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <p className="text-center text-[11px]">No sections yet.<br />Click + to add one.</p>
                  </div>
                );
              }
              return unified.map((item, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === unified.length - 1;
                if (item.type === "section") {
                  const sec = form.sections.find(s => s.id === item.id)!;
                  return (
                    <div
                      key={sec.id}
                      onClick={() => { setSelectedSectionId(sec.id); setActiveTab("fields"); }}
                      className={`group flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-2 transition-colors ${selectedSectionId === sec.id ? "border-[#4982CF]/25 bg-[#4982CF]/10" : "border-transparent hover:border-slate-200 hover:bg-white"}`}
                    >
                      <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                      <span className={`flex-1 truncate text-xs font-medium ${selectedSectionId === sec.id ? "text-[#4982CF]" : "text-slate-700"}`}>
                        {sectionNumbers[sec.id]}. {sec.title}
                      </span>
                      <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                        <button onClick={e => { e.stopPropagation(); moveInLayout(sec.id, "section", -1); }} className="text-slate-400 hover:text-slate-600 disabled:opacity-30" disabled={isFirst}><ArrowUp className="h-3 w-3" /></button>
                        <button onClick={e => { e.stopPropagation(); moveInLayout(sec.id, "section", 1); }} className="text-slate-400 hover:text-slate-600 disabled:opacity-30" disabled={isLast}><ArrowDown className="h-3 w-3" /></button>
                        <button onClick={e => { e.stopPropagation(); deleteSection(sec.id); }} className="text-slate-400 hover:text-rose-600"><X className="h-3 w-3" /></button>
                      </div>
                    </div>
                  );
                } else {
                  const comp = SYSTEM_COMPONENTS.find(c => c.id === item.id);
                  if (!comp) return null;
                  return (
                    <div
                      key={`sc-${item.id}`}
                      onClick={() => setActiveTab("system-components")}
                      className="group flex cursor-pointer items-center gap-1.5 rounded-lg border border-l-2 border-transparent px-2.5 py-2 transition-colors hover:bg-white"
                      style={{ borderLeftColor: `${comp.color}60` }}
                    >
                      <div className="h-3.5 w-3.5 flex-shrink-0 flex items-center justify-center">
                        <comp.icon className="h-3 w-3" style={{ color: comp.color }} />
                      </div>
                      <span className="flex-1 truncate text-xs font-medium text-slate-500">{comp.label}</span>
                      <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                        <button onClick={e => { e.stopPropagation(); moveInLayout(item.id, "sc", -1); }} className="text-slate-400 hover:text-slate-600 disabled:opacity-30" disabled={isFirst}><ArrowUp className="h-3 w-3" /></button>
                        <button onClick={e => { e.stopPropagation(); moveInLayout(item.id, "sc", 1); }} className="text-slate-400 hover:text-slate-600 disabled:opacity-30" disabled={isLast}><ArrowDown className="h-3 w-3" /></button>
                        <button onClick={e => { e.stopPropagation(); toggleSystemComponent(item.id); }} className="text-slate-400 hover:text-rose-500"><X className="h-3 w-3" /></button>
                      </div>
                    </div>
                  );
                }
              });
            })()}
          </div>

          <div className="flex-none border-t border-slate-200 p-2">
            <Button
              variant="outline" size="sm"
              className="w-full border-dashed border-slate-300 text-xs text-slate-500 hover:border-[#4982CF]/50 hover:text-[#4982CF]"
              onClick={addSection}
            >
              <Plus className="mr-1 h-3 w-3" />Add Section
            </Button>
          </div>
        </div>

        {/* ── Center/Right: Fields + Assignments ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tab strip */}
          <div className="flex flex-none border-b border-slate-200 bg-white">
            <button
              onClick={() => setActiveTab("fields")}
              className={`flex items-center gap-1.5 border-b-2 px-5 py-2.5 text-xs font-semibold transition-colors ${activeTab === "fields" ? "border-[#4982CF] text-[#4982CF]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              <Layers className="h-3.5 w-3.5" />Fields
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`flex items-center gap-1.5 border-b-2 px-5 py-2.5 text-xs font-semibold transition-colors ${activeTab === "assignments" ? "border-[#4982CF] text-[#4982CF]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              <Users className="h-3.5 w-3.5" />Doctor Assignments
              {form.assignedDoctorIds.length > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {form.assignedDoctorIds.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("system-components")}
              className={`flex items-center gap-1.5 border-b-2 px-5 py-2.5 text-xs font-semibold transition-colors ${activeTab === "system-components" ? "border-[#4982CF] text-[#4982CF]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              <Layers className="h-3.5 w-3.5" />System Components
              {(form.systemComponents ?? []).length > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {form.systemComponents.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "system-components" ? (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="max-w-2xl space-y-5">
                {/* Header */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">System Components</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Enable standard clinical components and arrange them anywhere between this form's custom sections.
                  </p>
                </div>

                {/* All components — toggle grid */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">All Components</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SYSTEM_COMPONENTS.map(comp => {
                      const enabled = (form.systemComponents ?? []).some(c => c.id === comp.id);
                      return (
                        <button
                          key={comp.id}
                          onClick={() => toggleSystemComponent(comp.id)}
                          className={[
                            "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                            enabled
                              ? "border-[#4982CF]/30 bg-[#4982CF]/8 shadow-sm"
                              : "border-slate-200 bg-white hover:border-[#4982CF]/30 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <div className="h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${comp.color}18` }}>
                            <comp.icon className="h-3.5 w-3.5" style={{ color: comp.color }} />
                          </div>
                          <span className={`flex-1 text-xs font-semibold ${enabled ? "text-[#4982CF]" : "text-slate-700"}`}>{comp.label}</span>
                          {enabled
                            ? <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: ACCENT }} />
                            : <Plus className="h-3 w-3 text-slate-300 flex-shrink-0" />
                          }
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Enabled components appear in the sidebar on the left — reorder them there alongside your sections.
                </p>
              </div>
            </div>
          ) : activeTab === "fields" ? (
            <div className="flex-1 overflow-y-auto p-5">
              {!selectedSection ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-400">
                  <Layers className="mb-3 h-8 w-8 opacity-30" />
                  <p className="text-sm">
                    {form.sections.length === 0
                      ? "Add a section from the left panel to start building."
                      : "Select a section from the left to edit its fields."}
                  </p>
                </div>
              ) : (
                <div className="max-w-2xl space-y-5">
                  {/* Section meta */}
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Section Details</p>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Section Title</Label>
                      <Input
                        className="h-9"
                        value={selectedSection.title}
                        onChange={e => updateSectionTitle(selectedSection.id, e.target.value)}
                        placeholder="Section title..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">
                        Description / Instructions{" "}
                        <span className="font-normal text-slate-400">(optional)</span>
                      </Label>
                      <Textarea
                        className="min-h-[52px] resize-none text-sm"
                        value={selectedSection.description}
                        onChange={e => updateSectionDesc(selectedSection.id, e.target.value)}
                        placeholder="Instructions visible to the doctor during consultation..."
                      />
                    </div>
                  </div>

                  {/* Fields header */}
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Fields{" "}
                      <span className="text-slate-300">({selectedSection.fields.length})</span>
                    </p>
                    <Button
                      size="sm" variant="outline"
                      className="h-7 border-dashed border-[#4982CF]/40 text-xs text-[#4982CF] hover:bg-[#4982CF]/5"
                      onClick={() => addField(selectedSection.id)}
                    >
                      <Plus className="mr-1 h-3 w-3" />Add Field
                    </Button>
                  </div>

                  {/* Fields list */}
                  {selectedSection.fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-10 text-slate-400">
                      <p className="text-sm">No fields in this section</p>
                      <Button
                        size="sm"
                        className="mt-3 text-white hover:opacity-90"
                        style={{ backgroundColor: ACCENT }}
                        onClick={() => addField(selectedSection.id)}
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />Add First Field
                      </Button>
                    </div>
                  ) : selectedSection.fields.map((fld, fIdx) => (
                    <FieldEditor
                      key={fld.id}
                      field={fld}
                      index={fIdx}
                      total={selectedSection.fields.length}
                      onChange={patch => updateField(selectedSection.id, fld.id, patch)}
                      onDelete={()    => deleteField(selectedSection.id, fld.id)}
                      onDuplicate={()  => duplicateField(selectedSection.id, fld.id)}
                      onMoveUp={()    => moveField(selectedSection.id, fld.id, -1)}
                      onMoveDown={()  => moveField(selectedSection.id, fld.id, 1)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5">
              <DoctorAssignmentPanel
                doctors={doctors}
                assignedIds={form.assignedDoctorIds}
                onToggle={toggleDoctor}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Field Editor
// ═══════════════════════════════════════════════════════════════════════════════

function FieldEditor({
  field, index, total, onChange, onDelete, onDuplicate, onMoveUp, onMoveDown,
}: {
  field: FormField;
  index: number;
  total: number;
  onChange: (patch: Partial<FormField>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const needsOptions = field.type === "checkbox-group" || field.type === "radio-group"
    || field.type === "dropdown" || field.type === "multiselect";
  const needsRatingConfig = field.type === "rating";

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#4982CF]/25">
      {/* Row header */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400">#{index + 1}</span>
        <GripVertical className="h-3.5 w-3.5 text-slate-300" />
        <span className="flex-1 truncate text-xs font-semibold text-slate-600">
          {field.label || "Untitled Field"}
        </span>
        <Badge variant="outline" className="shrink-0 border-slate-200 text-[10px] text-slate-500">
          {fieldTypeLabel(field.type)}
        </Badge>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={onMoveUp}    disabled={index === 0}><ArrowUp    className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={onMoveDown}  disabled={index === total - 1}><ArrowDown  className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={onDuplicate}><Copy      className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-rose-600"  onClick={onDelete}   ><Trash2    className="h-3 w-3" /></Button>
        </div>
      </div>

      {/* Row body */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-slate-500">Label</Label>
          <Input
            className="h-8 text-sm"
            value={field.label}
            onChange={e => onChange({ label: e.target.value })}
            placeholder="Field label..."
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-slate-500">Field Type</Label>
          <Select value={field.type} onValueChange={v => onChange({ type: v as FieldType, options: [] })}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map(ft => (
                <SelectItem key={ft.value} value={ft.value}>
                  <div className="flex items-center gap-2">{ft.icon}<span>{ft.label}</span></div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(!needsOptions || field.type === "multiselect") && !needsRatingConfig && field.type !== "yes-no" && field.type !== "time" && (
          <div className="col-span-2 space-y-1.5">
            <Label className="text-[11px] font-semibold text-slate-500">
              Placeholder / Hint{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </Label>
            <Input
              className="h-8 text-sm"
              value={field.placeholder}
              onChange={e => onChange({ placeholder: e.target.value })}
              placeholder="Hint text shown inside the field..."
            />
          </div>
        )}

        {needsOptions && (
          <div className="col-span-2 space-y-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-500">
                Options{" "}
                <span className="font-normal text-slate-400">(one per line)</span>
              </Label>
              <Textarea
                className="min-h-[80px] resize-none font-mono text-sm"
                value={field.options.join("\n")}
                onChange={e => onChange({ options: e.target.value.split("\n") })}
                placeholder={"Option 1\nOption 2\nOption 3"}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={!!field.allowOther}
                onCheckedChange={v => onChange({ allowOther: !!v })}
                className="data-[state=checked]:bg-[#4982CF] data-[state=checked]:border-[#4982CF]"
              />
              <span className="text-[11px] font-semibold text-slate-500">
                Allow "Other" — free-text entry if no option matches
              </span>
            </label>
            {field.type === "multiselect" && (
              <div className="space-y-1.5 pt-0.5">
                <Label className="text-[11px] font-semibold text-slate-500">Selection Style</Label>
                <div className="flex gap-2">
                  {(["ranked", "simple"] as const).map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => onChange({ selectionStyle: style })}
                      className={`flex-1 rounded-lg border py-1.5 text-[11px] font-semibold transition-all ${
                        (field.selectionStyle ?? "ranked") === style
                          ? "bg-[#4982CF] border-[#4982CF] text-white"
                          : "border-slate-200 text-slate-500 hover:border-[#4982CF]/40"
                      }`}>
                      {style === "ranked" ? "Ranked (primary + reorder)" : "Simple tags"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {needsRatingConfig && (
          <div className="col-span-2 grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-500">Min Value</Label>
              <Input
                type="number"
                className="h-8 text-sm"
                value={field.ratingMin ?? 1}
                onChange={e => onChange({ ratingMin: Number(e.target.value) })}
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-500">Max Value</Label>
              <Input
                type="number"
                className="h-8 text-sm"
                value={field.ratingMax ?? 10}
                onChange={e => onChange({ ratingMax: Number(e.target.value) })}
                min={1}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Preview Field (read-only render)
// ═══════════════════════════════════════════════════════════════════════════════

function PreviewField({ field }: { field: FormField }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-slate-700">{field.label}</Label>
      {field.type === "textarea" && (
        <Textarea disabled className="min-h-[72px] bg-slate-50 text-sm" placeholder={field.placeholder || "—"} />
      )}
      {field.type === "text" && (
        <Input disabled className="h-9 bg-slate-50 text-sm" placeholder={field.placeholder || "—"} />
      )}
      {field.type === "number" && (
        <Input type="number" disabled className="h-9 w-40 bg-slate-50 text-sm" placeholder={field.placeholder || "0"} />
      )}
      {field.type === "date" && (
        <Input type="date" disabled className="h-9 w-48 bg-slate-50 text-sm" />
      )}
      {field.type === "checkbox-group" && (
        <div className="space-y-1.5">
          {(field.options.filter(Boolean).length ? field.options.filter(Boolean) : ["Option 1", "Option 2"]).map(opt => (
            <label key={opt} className="flex cursor-not-allowed items-center gap-2 text-sm text-slate-600">
              <Checkbox disabled />
              {opt}
            </label>
          ))}
          {field.allowOther && (
            <div className="pt-1 border-t border-slate-100 mt-1">
              <label className="flex cursor-not-allowed items-center gap-2 text-sm text-slate-500 mb-1.5">
                <Checkbox disabled />
                <span className="italic">Other</span>
              </label>
              <Input disabled className="h-8 bg-slate-50 text-sm ml-6" placeholder="Specify…" />
            </div>
          )}
        </div>
      )}
      {field.type === "radio-group" && (
        <div className="space-y-1.5">
          {(field.options.filter(Boolean).length ? field.options.filter(Boolean) : ["Option 1", "Option 2"]).map(opt => (
            <label key={opt} className="flex cursor-not-allowed items-center gap-2 text-sm text-slate-600">
              <input type="radio" disabled className="accent-[#4982CF]" readOnly />
              {opt}
            </label>
          ))}
        </div>
      )}
      {field.type === "dropdown" && (
        <div className="relative w-full">
          <select
            disabled
            className="w-full appearance-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-sm text-slate-400 cursor-not-allowed"
          >
            <option>{field.placeholder || "Select an option…"}</option>
            {field.options.filter(Boolean).map(opt => <option key={opt}>{opt}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      )}
      {field.type === "multiselect" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-not-allowed opacity-70">
            <span className="text-xs text-slate-300 flex-1">{field.placeholder || "Select options…"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Opens a searchable dropdown with checkboxes.
            {field.allowOther && ' Includes an \u201cAdd custom\u2026\u201d entry for free-text values.'}
          </p>
        </div>
      )}
      {field.type === "rating" && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from(
            { length: Math.max(1, (field.ratingMax ?? 10) - (field.ratingMin ?? 1) + 1) },
            (_, i) => (field.ratingMin ?? 1) + i
          ).map(n => (
            <button
              key={n}
              type="button"
              disabled
              className="h-8 w-8 rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-400 cursor-not-allowed"
            >
              {n}
            </button>
          ))}
        </div>
      )}
      {field.type === "yes-no" && (
        <div className="flex gap-2">
          <button type="button" disabled className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-semibold text-slate-400 cursor-not-allowed">
            <Check className="h-3.5 w-3.5" /> Yes
          </button>
          <button type="button" disabled className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-semibold text-slate-400 cursor-not-allowed">
            <X className="h-3.5 w-3.5" /> No
          </button>
        </div>
      )}
      {field.type === "time" && (
        <Input type="time" disabled className="h-9 w-40 bg-slate-50 text-sm" />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Doctor Assignment Panel
// ═══════════════════════════════════════════════════════════════════════════════

function DoctorAssignmentPanel({
  doctors,
  assignedIds,
  onToggle,
}: {
  doctors: Doctor[];
  assignedIds: string[];
  onToggle: (id: string) => void;
}) {
  const activeDocs   = doctors.filter(d => d.status === "active");
  const inactiveDocs = doctors.filter(d => d.status !== "active");

  function DoctorRow({ doc }: { doc: Doctor }) {
    const assigned = assignedIds.includes(doc.id);
    return (
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${assigned ? "border-[#4982CF]/30 bg-[#4982CF]/5" : "border-transparent hover:bg-slate-50"}`}
      >
        <Checkbox
          checked={assigned}
          onCheckedChange={() => onToggle(doc.id)}
          className="data-[state=checked]:border-[#4982CF] data-[state=checked]:bg-[#4982CF]"
        />
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
          style={{ background: `${ACCENT}18`, color: ACCENT }}
        >
          {doc.name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("")}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-medium ${assigned ? "text-[#4982CF]" : "text-slate-700"}`}>
            {doc.name}
          </p>
          <p className="truncate text-[10px] text-slate-400">
            {doc.specialties.slice(0, 2).join(", ") || "No specialties assigned"}
          </p>
        </div>
        {assigned && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />}
      </label>
    );
  }

  return (
    <div className="max-w-md space-y-5">
      <div>
        <h3 className="font-bold text-slate-800">Doctor Assignment</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Select which doctors will have access to this specialty form during consultations.
        </p>
      </div>

      {assignedIds.length > 0 && (
        <div className="rounded-lg border px-4 py-3" style={{ borderColor: `${ACCENT}33`, background: `${ACCENT}0D` }}>
          <p className="text-xs font-semibold" style={{ color: ACCENT }}>
            {assignedIds.length} doctor{assignedIds.length !== 1 ? "s" : ""} assigned to this form
          </p>
        </div>
      )}

      {activeDocs.length > 0 && (
        <div className="space-y-1">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Doctors</p>
          <div className="space-y-1">
            {activeDocs.map(doc => <DoctorRow key={doc.id} doc={doc} />)}
          </div>
        </div>
      )}

      {inactiveDocs.length > 0 && (
        <div className="space-y-1 opacity-60">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Inactive Doctors</p>
          <div className="space-y-1">
            {inactiveDocs.map(doc => <DoctorRow key={doc.id} doc={doc} />)}
          </div>
        </div>
      )}

      {doctors.length === 0 && (
        <p className="text-sm italic text-slate-400">
          No doctors found. Add doctors in the Doctors module first.
        </p>
      )}
    </div>
  );
}
