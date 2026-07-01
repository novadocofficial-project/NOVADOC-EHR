import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search, Plus, X, ChevronDown, ChevronLeft, PenLine,
  Stethoscope, CheckCircle2, ClipboardCheck, ShieldCheck,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT_PE = "#0ea5e9";

// ─── Body Systems ─────────────────────────────────────────────────────────────

export interface BodySystem {
  id:    string;
  label: string;
  abbr:  string;
}

export const BODY_SYSTEMS: BodySystem[] = [
  { id: "general",          label: "General",               abbr: "GEN"  },
  { id: "heent",            label: "HEENT",                 abbr: "HENT" },
  { id: "cardiovascular",   label: "Cardiovascular",        abbr: "CVS"  },
  { id: "respiratory",      label: "Respiratory",           abbr: "RESP" },
  { id: "gastrointestinal", label: "Gastrointestinal",      abbr: "GIT"  },
  { id: "genitourinary",    label: "Genitourinary",         abbr: "GUS"  },
  { id: "musculoskeletal",  label: "Musculoskeletal",       abbr: "MSK"  },
  { id: "neurological",     label: "Neurological",          abbr: "NEURO"},
  { id: "dermatology",      label: "Dermatology",           abbr: "DERM" },
  { id: "psychiatric",      label: "Psychiatric",           abbr: "PSYC" },
  { id: "endocrine",        label: "Endocrine",             abbr: "ENDO" },
  { id: "hematologic",      label: "Hematologic",           abbr: "HEME" },
  { id: "immunologic",      label: "Immunologic / Allergic",abbr: "IMM"  },
];

// ─── PE Templates (per system) ────────────────────────────────────────────────

export const PE_TEMPLATES: Record<string, { section: string; items: string[] }[]> = {
  general: [
    { section: "General Appearance",   items: ["Level of alertness / distress", "Build & nutritional status", "Hygiene & grooming"] },
    { section: "Vital Signs",          items: ["Blood Pressure (mmHg)", "Heart Rate (bpm)", "Respiratory Rate (/min)", "Temperature (°C)", "SpO₂ (%)"] },
    { section: "Anthropometrics",      items: ["Weight (kg)", "Height (cm)", "BMI"] },
  ],
  heent: [
    { section: "Head & Scalp",         items: ["Head shape", "Scalp inspection", "Facial symmetry"] },
    { section: "Eyes",                 items: ["Pupils (size / reactivity / symmetry)", "Extraocular movements", "Conjunctiva & sclera", "Fundoscopy (if done)"] },
    { section: "Ears",                 items: ["External canal", "Tympanic membranes", "Hearing (gross test)"] },
    { section: "Nose",                 items: ["Mucosa / septum", "Turbinates", "Discharge / polyps"] },
    { section: "Throat & Mouth",       items: ["Lips & oral mucosa", "Tonsils & pharynx", "Uvula & palate", "Tongue & teeth"] },
  ],
  cardiovascular: [
    { section: "Inspection",           items: ["Precordial bulge / pulsations", "Peripheral cyanosis / clubbing"] },
    { section: "Palpation",            items: ["Apex beat (location)", "Heaves / thrills"] },
    { section: "Auscultation",         items: ["Heart rate & rhythm", "S1 / S2 quality", "Extra sounds (S3 / S4)", "Murmurs (grade / location / radiation)"] },
    { section: "Peripheral",           items: ["JVP estimation", "Peripheral pulses (radial / carotid / femoral / pedal)", "Capillary refill time", "Pedal / peripheral edema"] },
  ],
  respiratory: [
    { section: "Inspection",           items: ["Respiratory rate & pattern", "Chest shape / symmetry", "Use of accessory muscles", "Intercostal recession"] },
    { section: "Palpation",            items: ["Tracheal position", "Chest expansion (bilateral)", "Vocal fremitus"] },
    { section: "Percussion",           items: ["Right lung fields", "Left lung fields", "Diaphragm level"] },
    { section: "Auscultation",         items: ["Breath sounds (bilateral)", "Adventitious sounds (crackles / wheeze / rub)", "Air entry (upper / lower zones)"] },
  ],
  gastrointestinal: [
    { section: "Inspection",           items: ["Abdominal contour (flat / distended / scaphoid)", "Soft / Non-tender", "Visible peristalsis / pulsations", "Scars / caput medusae / other"] },
    { section: "Auscultation",         items: ["Bowel sounds (character)", "Bruits"] },
    { section: "Palpation",            items: ["Tenderness (site / severity)", "Guarding", "Rebound tenderness", "Mass", "Liver (size / edge / tenderness)", "Spleen palpation", "Kidneys / other masses", "CVA tenderness — Right", "CVA tenderness — Left"] },
    { section: "Percussion",           items: ["Liver dullness span", "Splenic dullness", "Shifting dullness / fluid thrill"] },
    { section: "Other",                items: ["Hernia orifices", "PR examination (if applicable)"] },
  ],
  genitourinary: [
    { section: "Bladder",              items: ["Suprapubic fullness / tenderness", "Bladder percussion"] },
    { section: "Kidneys",              items: ["Renal angle (CVA) tenderness — Right", "Renal angle (CVA) tenderness — Left", "Ballotable kidneys"] },
    { section: "External Genitalia",   items: ["External inspection (if applicable)", "Scrotal / penile / vulvar findings"] },
  ],
  musculoskeletal: [
    { section: "Gait & Posture",       items: ["Gait pattern", "Posture & stance", "Station (Romberg)"] },
    { section: "Joints",               items: ["Swelling / warmth / erythema", "Deformity / malalignment", "Tenderness on palpation"] },
    { section: "Range of Motion",      items: ["Upper limbs (shoulder / elbow / wrist / fingers)", "Lower limbs (hip / knee / ankle / toes)", "Spine (flexion / extension / lateral)"] },
    { section: "Muscle Strength",      items: ["Upper limb grip strength", "Lower limb power", "Muscle bulk / atrophy / fasciculations"] },
  ],
  neurological: [
    { section: "Consciousness",        items: ["GCS (E / V / M)", "Orientation (person / place / time)"] },
    { section: "Cranial Nerves",       items: ["CN I–II (smell / vision / fields)", "CN III–VI (pupils / EOMs / ptosis)", "CN VII (facial symmetry)", "CN VIII (hearing / balance)", "CN IX–X (gag / palate)", "CN XI–XII (SCM / tongue)"] },
    { section: "Motor",                items: ["Tone (upper / lower)", "Power (upper / lower limbs)", "Abnormal movements (tremor / chorea)"] },
    { section: "Sensory",              items: ["Light touch", "Pain (pinprick)", "Vibration sense", "Proprioception"] },
    { section: "Reflexes",             items: ["Biceps / triceps / supinator", "Knee / ankle jerk", "Plantar reflex (Babinski)"] },
    { section: "Cerebellar",           items: ["Finger-nose test", "Heel-shin test", "Dysdiadochokinesia", "Nystagmus"] },
  ],
  dermatology: [
    { section: "Skin",                 items: ["Color (pallor / jaundice / cyanosis / erythema)", "Texture & turgor", "Moisture (dry / sweaty)"] },
    { section: "Lesions",              items: ["Type (macule / papule / plaque / vesicle / etc.)", "Distribution & pattern", "Color & borders"] },
    { section: "Nails & Hair",         items: ["Nail changes (clubbing / pitting / onycholysis)", "Hair distribution & texture", "Alopecia"] },
    { section: "Mucous Membranes",     items: ["Oral mucosa hydration", "Conjunctival pallor"] },
  ],
  psychiatric: [
    { section: "Appearance & Behavior",items: ["Appearance & personal hygiene", "Behavior & attitude", "Psychomotor activity (agitation / retardation)"] },
    { section: "Speech",               items: ["Rate / volume / tone", "Fluency & coherence"] },
    { section: "Mood & Affect",        items: ["Subjective mood (patient's report)", "Objective affect (examiner's observation)", "Affect range & appropriateness"] },
    { section: "Thought",              items: ["Thought form (logical / tangential / flight of ideas)", "Thought content (delusions / obsessions / SI/HI)"] },
    { section: "Cognition & Insight",  items: ["Orientation", "Memory (recent / remote)", "Insight into illness", "Judgment"] },
  ],
  endocrine: [
    { section: "Thyroid",              items: ["Inspection (size / symmetry / swelling)", "Palpation (nodules / goitre grade)", "Auscultation for bruit"] },
    { section: "Metabolic Signs",      items: ["Skin changes (acanthosis / diabetic dermopathy)", "Body habitus (truncal obesity / Cushingoid)", "Hair & nail changes"] },
    { section: "Peripheral",           items: ["Peripheral neuropathy signs", "Foot inspection (diabetic foot)", "Retinal changes (if fundoscopy done)"] },
  ],
  hematologic: [
    { section: "Lymph Nodes",          items: ["Cervical / submandibular", "Axillary", "Inguinal", "Epitrochlear / popliteal"] },
    { section: "Organomegaly",         items: ["Spleen size (enlarged / just palpable / massive)", "Liver (if relevant)", "Testicular masses (if applicable)"] },
    { section: "Signs of Anemia / Bleeding", items: ["Pallor (conjunctival / palmar)", "Jaundice / icterus", "Purpura / petechiae / ecchymoses"] },
  ],
  immunologic: [
    { section: "Allergic Signs",       items: ["Allergic facies (shiners / salute crease)", "Conjunctival injection / tearing", "Nasal polyps / pale turbinates"] },
    { section: "Skin Manifestations",  items: ["Urticaria / angioedema", "Eczema / dermatitis pattern", "Dermographism"] },
    { section: "Respiratory",          items: ["Audible wheeze / stridor", "Prolonged expiration", "Accessory muscle use"] },
  ],
};

// ─── PE Builder Config (admin-configured abnormal options per item) ───────────

export interface PeItemCfg {
  normalText: string;
  abnormalOptions: string[];
}

export const PE_BUILDER_KEY = "ehr-pe-builder-v1";

const PE_BUILDER_SEEDS: Record<string, PeItemCfg> = {
  // General — Vital Signs
  "general__Vital Signs__Blood Pressure (mmHg)":              { normalText: "Normal", abnormalOptions: ["Hypertensive (>140/90 mmHg)", "Hypotensive (<90/60 mmHg)", "Stage 2 HTN (>160/100 mmHg)"] },
  "general__Vital Signs__Heart Rate (bpm)":                   { normalText: "Normal", abnormalOptions: ["Tachycardia (>100 bpm)", "Bradycardia (<60 bpm)", "Irregular rate"] },
  "general__Vital Signs__Respiratory Rate (/min)":            { normalText: "Normal", abnormalOptions: ["Tachypnoea (>20/min)", "Bradypnoea (<12/min)"] },
  "general__Vital Signs__SpO₂ (%)":                          { normalText: "Normal", abnormalOptions: ["Hypoxic (<94%)", "Severely hypoxic (<88%)", "On supplemental O₂"] },
  "general__General Appearance__Level of alertness / distress": { normalText: "Normal", abnormalOptions: ["Drowsy / obtunded", "Acute distress", "Confused / disoriented"] },
  // Cardiovascular
  "cardiovascular__Auscultation__Heart rate & rhythm":        { normalText: "Normal", abnormalOptions: ["Tachycardia", "Bradycardia", "Irregularly irregular rhythm", "Regularly irregular rhythm"] },
  "cardiovascular__Auscultation__S1 / S2 quality":            { normalText: "Normal", abnormalOptions: ["Soft S1", "Loud P2 / S2", "Widely split S2"] },
  "cardiovascular__Auscultation__Murmurs (grade / location / radiation)": { normalText: "No murmur", abnormalOptions: ["Systolic murmur", "Diastolic murmur", "Ejection systolic murmur (aortic area)", "Pan-systolic murmur (mitral)"] },
  "cardiovascular__Peripheral__Pedal / peripheral edema":     { normalText: "No oedema", abnormalOptions: ["Bilateral pitting oedema", "Unilateral pitting oedema", "Non-pitting oedema"] },
  // Respiratory
  "respiratory__Auscultation__Breath sounds (bilateral)":     { normalText: "Normal", abnormalOptions: ["Reduced air entry bilateral", "Reduced air entry right", "Reduced air entry left", "Bilateral wheeze"] },
  "respiratory__Auscultation__Adventitious sounds (crackles / wheeze / rub)": { normalText: "None", abnormalOptions: ["Fine crepitations", "Coarse crepitations", "Expiratory wheeze", "Inspiratory stridor", "Pleural friction rub"] },
  "respiratory__Inspection__Use of accessory muscles":        { normalText: "None", abnormalOptions: ["Accessory muscle use present", "Intercostal recession", "Nasal flaring"] },
  // Gastrointestinal
  "gastrointestinal__Inspection__Abdominal contour (flat / distended / scaphoid)": { normalText: "Flat / Scaphoid", abnormalOptions: ["Distended", "Gaseous distension", "Ascites"] },
  "gastrointestinal__Palpation__Tenderness (site / severity)": { normalText: "Non-tender", abnormalOptions: ["Localised tenderness", "Generalised tenderness", "Tenderness with guarding"] },
  "gastrointestinal__Palpation__Guarding":                    { normalText: "Absent", abnormalOptions: ["Voluntary guarding", "Involuntary guarding / rigidity"] },
  "gastrointestinal__Palpation__Rebound tenderness":          { normalText: "Absent", abnormalOptions: ["Rebound tenderness positive", "Peritonism present"] },
  "gastrointestinal__Palpation__Liver (size / edge / tenderness)": { normalText: "Not palpable", abnormalOptions: ["Hepatomegaly (2 cm below costal margin)", "Tender hepatomegaly", "Nodular liver edge"] },
  // Neurological
  "neurological__Motor__Tone (upper / lower)":                { normalText: "Normal tone", abnormalOptions: ["Increased tone (spasticity)", "Increased tone (rigidity)", "Decreased tone (flaccidity)"] },
  "neurological__Motor__Power (upper / lower limbs)":         { normalText: "5/5 bilaterally", abnormalOptions: ["Proximal weakness upper limbs", "Distal weakness lower limbs", "Hemiparesis", "Paraparesis"] },
  "neurological__Reflexes__Plantar reflex (Babinski)":        { normalText: "Flexor bilaterally", abnormalOptions: ["Extensor plantar response (Babinski +ve)", "Absent plantar response", "Equivocal"] },
  // Dermatology
  "dermatology__Skin__Color (pallor / jaundice / cyanosis / erythema)": { normalText: "Normal", abnormalOptions: ["Pallor", "Jaundice / icterus", "Peripheral cyanosis", "Central cyanosis"] },
  // Hematologic
  "hematologic__Signs of Anemia / Bleeding__Pallor (conjunctival / palmar)": { normalText: "No pallor", abnormalOptions: ["Conjunctival pallor", "Palmar pallor", "Severe pallor"] },
};

export function loadPeBuilderConfig(): Record<string, PeItemCfg> {
  try {
    const raw = localStorage.getItem(PE_BUILDER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, PeItemCfg>;
      return { ...PE_BUILDER_SEEDS, ...parsed };
    }
  } catch { /**/ }
  return { ...PE_BUILDER_SEEDS };
}

export function savePeBuilderConfig(cfg: Record<string, PeItemCfg>): void {
  try { localStorage.setItem(PE_BUILDER_KEY, JSON.stringify(cfg)); } catch { /**/ }
}

// ─── PE Summary card ──────────────────────────────────────────────────────────

export function PeSummary({ systemId, savedData }: { systemId: string; savedData: Record<string, string> }) {
  const template = PE_TEMPLATES[systemId] ?? [];

  const filledGroups = template
    .map(group => ({
      section: group.section,
      items: group.items
        .map(item => ({ item, value: (savedData[`${group.section}__${item}`] ?? "").trim() }))
        .filter(({ value }) => value !== ""),
    }))
    .filter(g => g.items.length > 0);

  if (filledGroups.length === 0) return null;

  return (
    <div className="mt-2 rounded-xl border border-cyan-100 bg-cyan-50/40 px-3 py-2.5 space-y-2">
      {filledGroups.map(g => (
        <div key={g.section}>
          <p className="text-[9px] font-black uppercase tracking-wider text-cyan-500 mb-1">{g.section}</p>
          <div className="space-y-0.5">
            {g.items.map(({ item, value }) => (
              <div key={item} className="flex gap-1.5 items-baseline">
                <span className="text-[10px] font-bold text-slate-500 flex-shrink-0">{item}:</span>
                <span className="text-[10px] text-slate-700 leading-relaxed">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ROS Symptom Data ─────────────────────────────────────────────────────────

interface RosSystem {
  id:       string;
  label:    string;
  symptoms: string[];
}

export const ROS_SYSTEMS: RosSystem[] = [
  {
    id: "skin", label: "Skin",
    symptoms: ["Rashes", "Itching", "Change in hair or nails"],
  },
  {
    id: "head", label: "Head",
    symptoms: ["Headaches", "Head injury"],
  },
  {
    id: "eyes", label: "Eyes",
    symptoms: ["Glasses or contacts", "Change in vision", "Eye pain", "Double vision", "Flashing lights", "Glaucoma/Cataracts", "Last eye exam"],
  },
  {
    id: "ears", label: "Ears",
    symptoms: ["Change in hearing", "Ear pain", "Ear discharge", "Ringing", "Dizziness"],
  },
  {
    id: "nose_sinuses", label: "Nose/Sinuses",
    symptoms: ["Nose bleeds", "Nasal stuffiness", "Frequent colds"],
  },
  {
    id: "allergies_ros", label: "Allergies",
    symptoms: ["Hives", "Swelling of lips or tongue", "Hay fever", "Asthma", "Eczema/Sensitive", "Sensitivity to drugs, food, pollens, or dander"],
  },
  {
    id: "mouth_throat", label: "Mouth/Throat",
    symptoms: ["Bleeding gums", "Sore tongue", "Sore throat", "Hoarseness"],
  },
  {
    id: "neck", label: "Neck",
    symptoms: ["Lumps", "Swollen glands", "Goiter", "Stiffness"],
  },
  {
    id: "breast", label: "Breast",
    symptoms: ["Lumps", "Pain", "Nipple discharge", "BSE"],
  },
  {
    id: "respiratory_cardiac", label: "Respiratory/Cardiac",
    symptoms: [
      "Shortness of breath", "Cough", "Production of phlegm, color", "Wheezing",
      "Coughing up blood", "Chest pain", "Fever", "Night sweats",
      "Swelling in hands/feet", "Blue fingers/toes", "High blood pressure",
      "Skipping heart beats", "Heart murmur", "HX of heart medication",
      "Bronchitis/emphysema", "Rheumatic heart disease",
    ],
  },
  {
    id: "gastrointestinal", label: "Gastrointestinal",
    symptoms: [
      "Change of appetite or weight", "Problems swallowing", "Nausea", "Heartburn",
      "Vomiting", "Vomiting blood", "Constipation", "Diarrhea", "Change in bowel habits",
      "Abdominal pain", "Excessive belching", "Excessive flatus",
      "Yellow color of skin (jaundice/hepatitis)", "Food intolerance", "Rectal bleeding/Hemorrhoids",
    ],
  },
  {
    id: "urinary", label: "Urinary",
    symptoms: [
      "Difficulty in urination", "Pain or burning on urination", "Frequent urination at night",
      "Urgent need to urinate", "Incontinence of urine", "Dribbling",
      "Decreased urine stream", "Blood in urine", "UTI/stones/prostate infection",
    ],
  },
  {
    id: "peripheral_vascular", label: "Peripheral Vascular",
    symptoms: ["Leg cramps", "Varicose veins", "Clots in veins"],
  },
  {
    id: "musculoskeletal", label: "Musculoskeletal",
    symptoms: ["Pain", "Swelling", "Stiffness", "Decreased joint motion", "Broken bone", "Serious sprains", "Arthritis", "Gout"],
  },
  {
    id: "neurologic", label: "Neurologic",
    symptoms: [
      "Headaches", "Seizures", "Loss of consciousness/fainting", "Paralysis", "Weakness",
      "Loss of muscle size", "Muscle spasm", "Tremor", "Involuntary movement",
      "Incoordination", "Numbness", "Feeling of pins and needles/tingles",
    ],
  },
  {
    id: "hematologic", label: "Hematologic",
    symptoms: ["Anemia", "Easy bruising/bleeding", "Past transfusions"],
  },
  {
    id: "endocrine", label: "Endocrine",
    symptoms: [
      "Abnormal growth", "Increased appetite", "Increased thirst", "Increased urine production",
      "Thyroid trouble", "Heat/cold intolerance", "Excessive sweating", "Diabetes",
    ],
  },
  {
    id: "psychiatric", label: "Psychiatric",
    symptoms: [
      "Tension/Anxiety", "Depression/suicide ideation", "Memory problems", "Unusual problems",
      "Sleep problems", "Past treatment with psychiatrist",
      "Change in mood/change in attitude towards family/friends",
    ],
  },
];

// ─── ROS Config (admin-configurable) ─────────────────────────────────────────

export interface RosConfigSystem {
  id:       string;
  name:     string;
  abbr:     string;
  active:   boolean;
  symptoms: string[];
}

export const ROS_CONFIG_KEY = "ehr-ros-config-v1";

function isValidRosConfig(v: unknown): v is RosConfigSystem[] {
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.every(s =>
    s !== null && typeof s === "object" &&
    typeof (s as RosConfigSystem).id === "string" && (s as RosConfigSystem).id.length > 0 &&
    typeof (s as RosConfigSystem).name === "string" &&
    typeof (s as RosConfigSystem).abbr === "string" &&
    typeof (s as RosConfigSystem).active === "boolean" &&
    Array.isArray((s as RosConfigSystem).symptoms) &&
    ((s as RosConfigSystem).symptoms as unknown[]).every(x => typeof x === "string")
  );
}

export function loadRosConfig(): RosConfigSystem[] {
  try {
    const raw = localStorage.getItem(ROS_CONFIG_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidRosConfig(parsed)) return parsed;
    }
  } catch { /**/ }
  return ROS_SYSTEMS.map(s => ({
    id:       s.id,
    name:     s.label,
    abbr:     s.id.toUpperCase().replace(/_/g, "").slice(0, 6),
    active:   true,
    symptoms: s.symptoms,
  }));
}

// ─── ROS Symptom Checklist ─────────────────────────────────────────────────────

interface RosSymptomChecklistProps {
  checked:  Record<string, string[]>;
  onChange: (v: Record<string, string[]>) => void;
  systems?: RosConfigSystem[];
}

export function RosSymptomChecklist({ checked, onChange, systems: systemsProp }: RosSymptomChecklistProps) {
  const [activeSystems] = useState<RosConfigSystem[]>(() => systemsProp ?? loadRosConfig().filter(s => s.active));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleSystem(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleSymptom(sysId: string, symptom: string) {
    const current = checked[sysId] ?? [];
    const next = current.includes(symptom)
      ? current.filter(s => s !== symptom)
      : [...current, symptom];
    onChange({ ...checked, [sysId]: next });
  }

  function clearSystem(sysId: string) {
    const next = { ...checked };
    delete next[sysId];
    onChange(next);
  }

  const totalChecked = Object.values(checked).reduce((acc, arr) => acc + (arr?.length ?? 0), 0);

  return (
    <div className="space-y-1">
      {totalChecked > 0 && (
        <p className="text-[10px] font-bold text-sky-600 mb-2">
          {totalChecked} symptom{totalChecked !== 1 ? "s" : ""} reported across {Object.keys(checked).filter(k => (checked[k]?.length ?? 0) > 0).length} system{Object.keys(checked).filter(k => (checked[k]?.length ?? 0) > 0).length !== 1 ? "s" : ""}
        </p>
      )}
      {activeSystems.map(sys => {
        const checkedSymptoms = checked[sys.id] ?? [];
        const count = checkedSymptoms.length;
        const isExpanded = expanded[sys.id] ?? false;

        return (
          <div key={sys.id} className="rounded-xl border border-slate-100 overflow-hidden">
            {/* System header row */}
            <button
              onClick={() => toggleSystem(sys.id)}
              className={[
                "w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
                count > 0
                  ? "bg-sky-50 hover:bg-sky-100/70"
                  : "bg-white hover:bg-slate-50",
              ].join(" ")}>
              {/* Chevron */}
              {isExpanded
                ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                : <ChevronDown className="h-3.5 w-3.5 text-slate-300 flex-shrink-0 -rotate-90" />
              }
              {/* System name */}
              <span className={`text-xs font-bold flex-1 ${count > 0 ? "text-sky-700" : "text-slate-600"}`}>
                {sys.name}
              </span>
              {/* Count badge */}
              {count > 0 && (
                <>
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `${ACCENT_PE}18`, color: ACCENT_PE }}>
                    {count} reported
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); clearSystem(sys.id); }}
                    className="ml-0.5 p-0.5 rounded text-sky-400 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
                    <X className="h-3 w-3" />
                  </button>
                </>
              )}
              <span className="text-[9px] text-slate-300 flex-shrink-0">{sys.symptoms.length} items</span>
            </button>

            {/* Symptom grid (expanded) */}
            {isExpanded && (
              <div className="px-3 py-3 bg-slate-50/60 border-t border-slate-100">
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {sys.symptoms.map(symptom => {
                    const isChecked = checkedSymptoms.includes(symptom);
                    return (
                      <label
                        key={symptom}
                        className="flex items-center gap-1.5 cursor-pointer group min-w-[140px]">
                        <div
                          onClick={() => toggleSymptom(sys.id, symptom)}
                          className={[
                            "h-3.5 w-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer",
                            isChecked
                              ? "border-sky-500 bg-sky-500"
                              : "border-slate-300 group-hover:border-sky-400",
                          ].join(" ")}>
                          {isChecked && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <span
                          onClick={() => toggleSymptom(sys.id, symptom)}
                          className={`text-[11px] leading-tight select-none ${isChecked ? "text-sky-700 font-semibold" : "text-slate-600"}`}>
                          {symptom}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── ROS Summary (compact view for main drawer) ───────────────────────────────

interface RosSummaryProps {
  checked:  Record<string, string[]>;
  onEdit:   () => void;
  systems?: RosConfigSystem[];
}

export function RosSummary({ checked, onEdit, systems: systemsProp }: RosSummaryProps) {
  const allSystems = systemsProp ?? loadRosConfig();
  const filledSystems = allSystems.filter(sys => sys.active && (checked[sys.id]?.length ?? 0) > 0);

  if (filledSystems.length === 0) {
    return (
      <button
        onClick={onEdit}
        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-all group">
        <Stethoscope className="h-4 w-4 text-slate-300 group-hover:text-sky-400 flex-shrink-0 transition-colors" />
        <p className="text-xs text-slate-400 group-hover:text-sky-500 transition-colors text-left">
          Tap to review systems and record reported symptoms…
        </p>
        <Plus className="h-3.5 w-3.5 text-slate-300 group-hover:text-sky-400 ml-auto flex-shrink-0 transition-colors" />
      </button>
    );
  }

  const totalSymptoms = filledSystems.reduce((acc, sys) => acc + (checked[sys.id]?.length ?? 0), 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-sky-600">
          {totalSymptoms} symptom{totalSymptoms !== 1 ? "s" : ""} across {filledSystems.length} system{filledSystems.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-sky-200 text-sky-600 bg-sky-50 hover:bg-sky-100 transition-colors">
          <PenLine className="h-3 w-3" /> Edit ROS
        </button>
      </div>
      <div className="space-y-1.5">
        {filledSystems.map(sys => {
          const symptoms = checked[sys.id] ?? [];
          return (
            <div key={sys.id} className="rounded-lg bg-sky-50/60 border border-sky-100 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-wider text-sky-500 mb-1.5">{sys.name}</p>
              <div className="flex flex-wrap gap-1">
                {symptoms.map(s => (
                  <span
                    key={s}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${ACCENT_PE}18`, color: ACCENT_PE }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ROS Drawer (full checklist in sub-drawer) ────────────────────────────────

interface RosDrawerProps {
  checked:  Record<string, string[]>;
  onChange: (v: Record<string, string[]>) => void;
  onClose:  () => void;
  systems?: RosConfigSystem[];
}

export function RosDrawer({ checked, onChange, onClose, systems }: RosDrawerProps) {
  const totalChecked = Object.values(checked).reduce((acc, arr) => acc + (arr?.length ?? 0), 0);
  const systemsWithSymptoms = Object.keys(checked).filter(k => (checked[k]?.length ?? 0) > 0).length;

  return (
    <div className="absolute inset-y-0 right-0 w-[88%] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-20">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">SOAP Note</p>
          <p className="text-sm font-black text-slate-800">Review of Systems</p>
        </div>
        {totalChecked > 0 && (
          <span
            className="text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ backgroundColor: `${ACCENT_PE}18`, color: ACCENT_PE }}>
            {totalChecked} symptom{totalChecked !== 1 ? "s" : ""} · {systemsWithSymptoms} system{systemsWithSymptoms !== 1 ? "s" : ""}
          </span>
        )}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90 flex-shrink-0"
          style={{ backgroundColor: ACCENT_PE }}>
          <CheckCircle2 className="h-3.5 w-3.5" /> Done
        </button>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable checklist */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <RosSymptomChecklist checked={checked} onChange={onChange} systems={systems} />
      </div>
    </div>
  );
}

// ─── PE System Selector (independent — not linked to ROS) ─────────────────────

interface PeSelectorProps {
  selected: string[];
  onChange: (systems: string[]) => void;
}

export function PeSystemSelector({ selected, onChange }: PeSelectorProps) {
  const [open,    setOpen]    = useState(false);
  const [search,  setSearch]  = useState("");
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function openDrop() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 280) });
    }
    setOpen(true);
    setSearch("");
  }

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  }

  function remove(id: string) {
    onChange(selected.filter(s => s !== id));
  }

  const filtered = BODY_SYSTEMS.filter(
    s => s.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {BODY_SYSTEMS.filter(s => selected.includes(s.id)).map(sys => (
            <div
              key={sys.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold"
              style={{ backgroundColor: `${ACCENT_PE}12`, borderColor: `${ACCENT_PE}35`, color: ACCENT_PE }}>
              <span className="text-[9px] font-black px-1 py-0.5 rounded bg-sky-100 text-sky-600">{sys.abbr}</span>
              {sys.label}
              <button onClick={() => remove(sys.id)} className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={openDrop}
        className="flex items-center justify-between gap-2 w-full text-xs font-bold px-3 py-2.5 rounded-xl border-2 border-dashed border-sky-200 text-sky-500 hover:border-sky-400 hover:bg-sky-50/60 transition-all">
        <div className="flex items-center gap-2">
          <Plus className="h-3.5 w-3.5" />
          {selected.length === 0 ? "Select systems to examine…" : `${selected.length} system${selected.length > 1 ? "s" : ""} selected — add more`}
        </div>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>

      {/* Dropdown portal */}
      {open && dropPos && createPortal(
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[999] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width, maxHeight: 320 }}>
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 flex-shrink-0">
              <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search systems…"
                className="flex-1 text-xs outline-none text-slate-700 placeholder-slate-300"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.map(sys => {
                const isSelected = selected.includes(sys.id);
                return (
                  <button
                    key={sys.id}
                    onClick={() => toggle(sys.id)}
                    className={[
                      "w-full text-left px-4 py-2.5 flex items-center gap-3 text-xs transition-colors border-b border-slate-50 last:border-0",
                      isSelected ? "bg-sky-50 text-sky-700" : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}>
                    <div className={[
                      "h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      isSelected ? "border-sky-500 bg-sky-500" : "border-slate-300",
                    ].join(" ")}>
                      {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 flex-shrink-0">{sys.abbr}</span>
                    <span className="font-medium">{sys.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/60 flex-shrink-0">
              <span className="text-[10px] text-slate-400">{selected.length} selected</span>
              <button
                onClick={() => setOpen(false)}
                className="text-[11px] font-bold px-3 py-1 rounded-lg text-white"
                style={{ backgroundColor: ACCENT_PE }}>
                Done
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ─── PE System Drawer ─────────────────────────────────────────────────────────

interface PeSystemDrawerProps {
  systemId:  string;
  isDone:    boolean;
  savedData: Record<string, string>;
  onSave:    (findings: Record<string, string>) => void;
  onClose:   () => void;
}

export function PeSystemDrawer({ systemId, isDone, savedData, onSave, onClose }: PeSystemDrawerProps) {
  const sys        = BODY_SYSTEMS.find(s => s.id === systemId);
  const template   = PE_TEMPLATES[systemId] ?? [];

  const [findings,     setFindings]     = useState<Record<string, string>>(() => savedData);
  const [openAbnormal, setOpenAbnormal] = useState<string | null>(null);
  const [peConfig]                      = useState<Record<string, PeItemCfg>>(() => loadPeBuilderConfig());

  const isDirty = isDone && JSON.stringify(findings) !== JSON.stringify(savedData);

  const totalItems  = template.reduce((acc, s) => acc + s.items.length, 0);
  const filledItems = Object.values(findings).filter(v => v.trim()).length;
  const pct         = totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;

  function setFinding(key: string, val: string) {
    setFindings(prev => ({ ...prev, [key]: val }));
  }

  function handleSave() { onSave(findings); }

  function handleMarkAllNormal() {
    const allNormal: Record<string, string> = {};
    for (const group of template) {
      for (const item of group.items) {
        const cfgKey = `${systemId}__${group.section}__${item}`;
        allNormal[`${group.section}__${item}`] = peConfig[cfgKey]?.normalText ?? "Normal";
      }
    }
    setFindings(allNormal);
  }

  function handleSectionNormal(section: string, items: string[]) {
    setFindings(prev => {
      const next = { ...prev };
      for (const item of items) {
        const cfgKey = `${systemId}__${section}__${item}`;
        next[`${section}__${item}`] = peConfig[cfgKey]?.normalText ?? "Normal";
      }
      return next;
    });
  }

  function toggleAbnormalOption(key: string, opt: string, itemNormalText: string) {
    const current = (findings[key] ?? "").split(", ").map(s => s.trim()).filter(Boolean);
    const strippable = new Set(
      [itemNormalText.trim(), "Normal"].map(s => s.toLowerCase())
    );
    const withoutNormal = current.filter(s => !strippable.has(s.toLowerCase()));
    const idx = withoutNormal.findIndex(s => s === opt);
    const next = idx >= 0
      ? withoutNormal.filter((_, i) => i !== idx)
      : [...withoutNormal, opt];
    setFinding(key, next.join(", "));
    if (next.length === 0) setOpenAbnormal(null);
  }

  return (
    <div className="absolute inset-y-0 right-0 w-[65%] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-20">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Physical Examination</p>
          <p className="text-sm font-black text-slate-800 truncate">{sys?.label}</p>
        </div>
        <button onClick={handleMarkAllNormal}
          className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors flex-shrink-0">
          <ShieldCheck className="h-3.5 w-3.5" /> All Normal
        </button>
        {isDone && !isDirty ? (
          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        ) : isDirty ? (
          <button onClick={handleSave}
            className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90 flex-shrink-0"
            style={{ backgroundColor: "#f59e0b" }}>
            <ClipboardCheck className="h-3.5 w-3.5" /> Update
          </button>
        ) : (
          <button onClick={handleSave}
            className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90 flex-shrink-0"
            style={{ backgroundColor: ACCENT_PE }}>
            <ClipboardCheck className="h-3.5 w-3.5" /> Mark Done
          </button>
        )}
        <button onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* System badge + progress */}
      <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0 bg-slate-50/60">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT_PE}15` }}>
            <Stethoscope className="h-3.5 w-3.5" style={{ color: ACCENT_PE }} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-slate-400 font-medium">Physical Examination</p>
            <p className="text-xs font-black text-slate-800">{sys?.label}</p>
          </div>
          <span className="text-[10px] font-black text-slate-400">{filledItems}/{totalItems} items</span>
          {isDirty && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: pct < 33 ? "#f59e0b" : pct < 66 ? ACCENT_PE : "#10b981" }} />
        </div>
      </div>

      {/* Scrollable template body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {template.map(group => {
          const sectionAllNormal = group.items.every(item => {
            const cfgKey = `${systemId}__${group.section}__${item}`;
            const nText = peConfig[cfgKey]?.normalText ?? "Normal";
            return (findings[`${group.section}__${item}`] ?? "").trim() === nText;
          });
          return (
            <div key={group.section}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="h-px flex-1 bg-slate-100" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  {group.section}
                </p>
                <button
                  onClick={() => handleSectionNormal(group.section, group.items)}
                  className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border transition-colors flex-shrink-0 ${
                    sectionAllNormal
                      ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                      : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                  }`}>
                  <ShieldCheck className="h-2.5 w-2.5" /> Normal
                </button>
                <span className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="space-y-3">
                {group.items.map(item => {
                  const key     = `${group.section}__${item}`;
                  const cfgKey  = `${systemId}__${group.section}__${item}`;
                  const cfg     = peConfig[cfgKey];
                  const normalText = cfg?.normalText ?? "Normal";
                  const val     = findings[key] ?? "";
                  const isNormal   = val.trim() === normalText;
                  const parts   = val.split(", ").map(s => s.trim()).filter(Boolean);
                  const selectedAbnormals = cfg?.abnormalOptions
                    ? parts.filter(p => cfg.abnormalOptions.includes(p))
                    : [];
                  const isAbnormal = !isNormal && val.trim().length > 0;
                  const isDropOpen = openAbnormal === key;

                  return (
                    <div key={item} className="rounded-xl border border-slate-100 bg-slate-50/40 p-2.5">
                      {/* Label */}
                      <p className="text-[10px] font-bold text-slate-600 mb-2">{item}</p>

                      {/* Normal / Abnormal toggle buttons */}
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => { setFinding(key, normalText); setOpenAbnormal(null); }}
                          className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all ${
                            isNormal
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "bg-white border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-700"
                          }`}>
                          <ShieldCheck className="h-3 w-3" /> Normal
                        </button>

                        {cfg?.abnormalOptions && cfg.abnormalOptions.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setOpenAbnormal(isDropOpen ? null : key)}
                            className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all ${
                              isAbnormal
                                ? "bg-red-500 border-red-500 text-white"
                                : isDropOpen
                                  ? "bg-orange-100 border-orange-400 text-orange-700"
                                  : "bg-white border-slate-200 text-slate-500 hover:border-orange-400 hover:text-orange-700"
                            }`}>
                            <ChevronDown className={`h-3 w-3 transition-transform ${isDropOpen ? "rotate-180" : ""}`} />
                            Abnormal{selectedAbnormals.length > 0 ? ` (${selectedAbnormals.length})` : ""}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setFinding(key, ""); setOpenAbnormal(null); }}
                            className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all ${
                              isAbnormal
                                ? "bg-red-500 border-red-500 text-white"
                                : "bg-white border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-600"
                            }`}>
                            Abnormal
                          </button>
                        )}

                        {val && (
                          <button
                            type="button"
                            onClick={() => { setFinding(key, ""); setOpenAbnormal(null); }}
                            className="ml-auto p-0.5 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* Abnormal options dropdown */}
                      {isDropOpen && cfg?.abnormalOptions && (
                        <div className="mb-2 p-2 bg-white rounded-xl border border-orange-100 shadow-sm">
                          <p className="text-[9px] font-black uppercase tracking-widest text-orange-400 mb-1.5">Select abnormal findings</p>
                          <div className="flex flex-wrap gap-1.5">
                            {cfg.abnormalOptions.map(opt => {
                              const isSelected = selectedAbnormals.includes(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => toggleAbnormalOption(key, opt, normalText)}
                                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                                    isSelected
                                      ? "bg-red-500 border-red-500 text-white"
                                      : "bg-white border-slate-200 text-slate-600 hover:border-red-400 hover:bg-red-50"
                                  }`}>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Free-text input */}
                      <input
                        value={val}
                        onChange={e => setFinding(key, e.target.value)}
                        placeholder={isNormal ? normalText : "Type custom finding or use buttons above…"}
                        className={`w-full text-xs placeholder-slate-300 border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          isNormal
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : isAbnormal
                              ? "bg-red-50 border-red-200 text-red-800"
                              : "bg-white border-slate-200 text-slate-700"
                        }`}
                        style={{ "--tw-ring-color": ACCENT_PE } as React.CSSProperties}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PE Chips Panel (auto-synced from ROS) ────────────────────────────────────

interface PeChipsPanelProps {
  systems:       string[];
  doneSystemIds: string[];
  savedDataMap:  Record<string, Record<string, string>>;
  onOpenSystem:  (id: string) => void;
  openSystemId:  string | null;
}

export function PeChipsPanel({ systems, doneSystemIds = [], savedDataMap = {}, onOpenSystem, openSystemId }: PeChipsPanelProps) {
  if (systems.length === 0) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100">
        <Stethoscope className="h-4 w-4 text-slate-300 flex-shrink-0" />
        <p className="text-xs text-slate-400">
          Select examination systems using the selector above — each will appear here for assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        Click a system to open its examination template
      </p>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {BODY_SYSTEMS.filter(s => systems.includes(s.id)).map(sys => {
          const isOpen = openSystemId === sys.id;
          const isDone = doneSystemIds.includes(sys.id);
          return (
            <button
              key={sys.id}
              onClick={() => onOpenSystem(sys.id)}
              className={[
                "flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-all",
                isOpen
                  ? "text-white shadow-md"
                  : isDone
                    ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                    : "text-slate-600 border-slate-200 bg-white",
              ].join(" ")}
              style={isOpen
                ? { backgroundColor: ACCENT_PE, borderColor: ACCENT_PE }
                : isDone
                  ? {}
                  : { borderColor: `${ACCENT_PE}50` }}>
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
                style={isOpen
                  ? { backgroundColor: "rgba(255,255,255,0.25)", color: "white" }
                  : isDone
                    ? { backgroundColor: "#d1fae5", color: "#065f46" }
                    : { backgroundColor: `${ACCENT_PE}15`, color: ACCENT_PE }}>
                {sys.abbr}
              </span>
              {sys.label}
              {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Summary cards for done systems */}
      {BODY_SYSTEMS.filter(s => systems.includes(s.id) && doneSystemIds.includes(s.id)).map(sys => {
        const saved = savedDataMap[sys.id];
        if (!saved) return null;
        return (
          <div key={`summary-${sys.id}`}>
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-3 mb-1">
              {sys.label} — Examination Summary
            </p>
            <PeSummary systemId={sys.id} savedData={saved} />
          </div>
        );
      })}

      {doneSystemIds.filter(id => systems.includes(id)).length > 0 && (
        <p className="text-[10px] text-slate-400 mt-1">
          {doneSystemIds.filter(id => systems.includes(id)).length}/{systems.length} systems examined
        </p>
      )}
    </div>
  );
}
