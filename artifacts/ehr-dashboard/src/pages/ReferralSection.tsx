import { useState } from "react";
import {
  ChevronLeft, X, Search, CheckCircle2, ClipboardCheck,
  Plus, Pencil, AlertCircle, Users, Trash2,
  ArrowRight, Pill, Download,
} from "lucide-react";
import type { AllergyEntry } from "@/pages/AllergySelector";
import { MEDICINES } from "@/pages/FormularySection";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReferralType   = "Internal" | "External";
export type ReferralTarget = "Consultant" | "Procedure" | "ER" | "Custom";

export interface ReferralMed {
  id:        string;
  brand:     string;
  generic:   string;
  strength:  string;
  frequency: string;
  duration:  string;
  qty:       number;
}

export interface ReferralEntry {
  id:               string;
  referralType:     ReferralType;
  referralTarget:   ReferralTarget;
  customTarget:     string;
  // Consultant target
  speciality:       string;
  consultantName:   string;
  // Procedure target
  procedureName:    string;
  procedureCategory:string;
  // ER target
  facilityName:     string;
  erService:        string;
  // shared
  comorbidities:    string[];
  medications:      ReferralMed[];
  allergies:        AllergyEntry[];
  reason:           string;
  summary:          string;
}

export interface ReferralData {
  referrals: ReferralEntry[];
}

export const EMPTY_REFERRAL_DATA: ReferralData = { referrals: [] };

// keep as named export so vite Fast Refresh is satisfied by adjacent component exports

// ─── Speciality → Consultant Map ──────────────────────────────────────────────

interface ConsultantDef {
  name:      string;
  qualifier: string;
}

const SPECIALITY_MAP: Record<string, ConsultantDef[]> = {
  Cardiology: [
    { name: "Dr. Aisha Al-Mansoori",  qualifier: "MD, FACC"      },
    { name: "Dr. Khalid Farooq",      qualifier: "MB ChB, MRCP"  },
    { name: "Dr. Priya Nair",         qualifier: "MD, DM Cardio"  },
    { name: "Dr. Omar Al-Rashidi",    qualifier: "FRCPC"          },
  ],
  Neurology: [
    { name: "Dr. Fatima Al-Hashimi",  qualifier: "MD, FRCPC"      },
    { name: "Dr. Rajesh Venkataraman",qualifier: "DM Neurology"   },
    { name: "Dr. Yusuf Saleh",        qualifier: "MD, MRCP"       },
    { name: "Dr. Sarah Okafor",       qualifier: "MB BCh, MRCP"   },
  ],
  Orthopedics: [
    { name: "Dr. Ahmed Al-Mutawa",    qualifier: "FRCS Ortho"     },
    { name: "Dr. Lina Haddad",        qualifier: "MD, FAAOS"      },
    { name: "Dr. James Obi",          qualifier: "MB BS, FRCS"    },
    { name: "Dr. Vikram Sharma",      qualifier: "MS Ortho"       },
  ],
  Gastroenterology: [
    { name: "Dr. Nadia Kassem",       qualifier: "MD, FACG"       },
    { name: "Dr. Tariq Al-Ansari",    qualifier: "MRCP, DM Gastro"},
    { name: "Dr. Mei-Ling Chen",      qualifier: "MD, AGAF"       },
  ],
  Pulmonology: [
    { name: "Dr. Bassam Al-Rashed",   qualifier: "MRCP, EDIC"     },
    { name: "Dr. Anya Krishnamurthy", qualifier: "MD, FCCP"       },
    { name: "Dr. Paul Adeyemi",       qualifier: "MB BS, FRCP"    },
  ],
  Endocrinology: [
    { name: "Dr. Maryam Al-Suwaidi",  qualifier: "MD, FACP"       },
    { name: "Dr. Sunil Mathur",       qualifier: "DM Endocrinology"},
    { name: "Dr. Hana Al-Jaber",      qualifier: "MRCP, FACE"     },
  ],
  Psychiatry: [
    { name: "Dr. Layla Al-Zaabi",     qualifier: "MRCPsych"       },
    { name: "Dr. Ravi Menon",         qualifier: "MD Psychiatry"   },
    { name: "Dr. Chioma Eze",         qualifier: "MB BCh, MRCPsych"},
  ],
  Dermatology: [
    { name: "Dr. Sara Bin Ali",       qualifier: "MD, FAAD"       },
    { name: "Dr. Arun Patel",         qualifier: "MD, DDV"        },
    { name: "Dr. Nicole Boateng",     qualifier: "MB ChB, FRCP"   },
  ],
  Nephrology: [
    { name: "Dr. Jassem Al-Kuwari",   qualifier: "FRCP, FASN"     },
    { name: "Dr. Amita Gupta",        qualifier: "MD, DM Nephro"  },
    { name: "Dr. Emeka Okonkwo",      qualifier: "MRCP, EDTNA"    },
  ],
  Ophthalmology: [
    { name: "Dr. Mariam Al-Shehabi",  qualifier: "MD, FRCS Ed"    },
    { name: "Dr. Dinesh Kumar",        qualifier: "MS Ophtha"      },
    { name: "Dr. Chidinma Nwosu",     qualifier: "FRCSC"          },
  ],
  Physiotherapy: [
    { name: "Ms. Rima Al-Otaibi",     qualifier: "BSc PT, MSc"    },
    { name: "Mr. David Eze",          qualifier: "BSc PT, MCSP"   },
    { name: "Ms. Kavya Srinivasan",   qualifier: "MPT"            },
  ],
  Oncology: [
    { name: "Dr. Hassan Al-Ali",      qualifier: "MD, FRCP, FASCO" },
    { name: "Dr. Preethi Ramachandran",qualifier: "DM Oncology"   },
    { name: "Dr. Kofi Mensah",        qualifier: "MRCP, FRCR"     },
  ],
  "ENT (Otolaryngology)": [
    { name: "Dr. Abdulrahman Khalil", qualifier: "FRCS ORL-HNS"   },
    { name: "Dr. Anitha Mohan",       qualifier: "MS ENT"         },
    { name: "Dr. Charles Agbaje",     qualifier: "MB ChB, FRCS"   },
  ],
  Urology: [
    { name: "Dr. Saad Al-Hammadi",    qualifier: "FRCS Urol"      },
    { name: "Dr. Vijay Krishnan",     qualifier: "MCh Urology"    },
    { name: "Dr. Emmanuel Osei",      qualifier: "MB BS, FRCS"    },
  ],
};

const SPECIALITIES = Object.keys(SPECIALITY_MAP).sort();

// ─── Admin-wired specialty / consultant loader ─────────────────────────────────

function loadSpecialtyMap(): Record<string, ConsultantDef[]> {
  try {
    const raw = localStorage.getItem("ehr-doctors-v1");
    if (raw) {
      const docs = JSON.parse(raw) as {
        name: string; status: string;
        specialties: string[];
        qualifications: { id: string; name: string }[];
      }[];
      const active = docs.filter(d => d.status === "active" && d.specialties.length > 0);
      if (active.length > 0) {
        const map: Record<string, ConsultantDef[]> = {};
        for (const doc of active) {
          const qualifier = doc.qualifications.map(q => q.name).filter(Boolean).join(", ");
          for (const sp of doc.specialties) {
            if (!map[sp]) map[sp] = [];
            map[sp].push({ name: doc.name, qualifier });
          }
        }
        if (Object.keys(map).length > 0) return map;
      }
    }
  } catch { /**/ }
  return SPECIALITY_MAP;
}

// ─── Procedure List ────────────────────────────────────────────────────────────

interface ProcedureDef { id: string; name: string; category: string; cpt: string; }

const PROCEDURES: ProcedureDef[] = [
  // Surgical
  { id: "appendectomy",       name: "Appendectomy",                       category: "Surgical",       cpt: "44950"  },
  { id: "cholecystectomy",    name: "Laparoscopic Cholecystectomy",       category: "Surgical",       cpt: "47562"  },
  { id: "hernia-repair",      name: "Inguinal Hernia Repair",             category: "Surgical",       cpt: "49505"  },
  { id: "thyroidectomy",      name: "Thyroidectomy",                      category: "Surgical",       cpt: "60240"  },
  { id: "tonsillectomy",      name: "Tonsillectomy & Adenoidectomy",      category: "Surgical",       cpt: "42820"  },
  { id: "mastectomy",         name: "Mastectomy",                         category: "Surgical",       cpt: "19303"  },
  { id: "colostomy",          name: "Colostomy",                          category: "Surgical",       cpt: "44320"  },
  { id: "bypass-surgery",     name: "Coronary Artery Bypass Grafting",    category: "Surgical",       cpt: "33533"  },
  { id: "hip-replacement",    name: "Total Hip Replacement",              category: "Surgical",       cpt: "27130"  },
  { id: "knee-replacement",   name: "Total Knee Replacement",             category: "Surgical",       cpt: "27447"  },
  { id: "spinal-fusion",      name: "Spinal Fusion",                      category: "Surgical",       cpt: "22612"  },
  // Diagnostic
  { id: "echo",               name: "Echocardiogram",                     category: "Diagnostic",     cpt: "93306"  },
  { id: "stress-test",        name: "Cardiac Stress Test",                category: "Diagnostic",     cpt: "93015"  },
  { id: "spirometry",         name: "Spirometry / PFT",                   category: "Diagnostic",     cpt: "94010"  },
  { id: "eeg",                name: "Electroencephalogram (EEG)",          category: "Diagnostic",     cpt: "95816"  },
  { id: "emg",                name: "Electromyography (EMG)",              category: "Diagnostic",     cpt: "95860"  },
  { id: "sleep-study",        name: "Polysomnography (Sleep Study)",      category: "Diagnostic",     cpt: "95810"  },
  { id: "bone-density",       name: "Bone Density Scan (DEXA)",           category: "Diagnostic",     cpt: "77080"  },
  { id: "audiometry",         name: "Audiometry",                         category: "Diagnostic",     cpt: "92557"  },
  // Endoscopic
  { id: "colonoscopy",        name: "Colonoscopy",                        category: "Endoscopic",     cpt: "45378"  },
  { id: "gastroscopy",        name: "Upper GI Endoscopy (Gastroscopy)",   category: "Endoscopic",     cpt: "43239"  },
  { id: "bronchoscopy",       name: "Bronchoscopy",                       category: "Endoscopic",     cpt: "31622"  },
  { id: "ercp",               name: "ERCP",                               category: "Endoscopic",     cpt: "43260"  },
  { id: "cystoscopy",         name: "Cystoscopy",                         category: "Endoscopic",     cpt: "52000"  },
  // Interventional
  { id: "angioplasty",        name: "Percutaneous Coronary Angioplasty",  category: "Interventional", cpt: "92982"  },
  { id: "pacemaker",          name: "Pacemaker Implantation",             category: "Interventional", cpt: "33206"  },
  { id: "ablation",           name: "Cardiac Ablation",                   category: "Interventional", cpt: "93656"  },
  { id: "dialysis",           name: "Hemodialysis",                       category: "Interventional", cpt: "90935"  },
  { id: "lumbar-puncture",    name: "Lumbar Puncture",                    category: "Interventional", cpt: "62270"  },
  { id: "joint-injection",    name: "Joint Injection / Aspiration",       category: "Interventional", cpt: "20600"  },
  { id: "biopsy",             name: "Tissue Biopsy",                      category: "Interventional", cpt: "20200"  },
  { id: "iv-therapy",         name: "IV Therapy / Infusion",              category: "Interventional", cpt: "96365"  },
  // OB/GYN
  { id: "colposcopy",         name: "Colposcopy",                         category: "OB/GYN",         cpt: "57454"  },
  { id: "hysteroscopy",       name: "Hysteroscopy",                       category: "OB/GYN",         cpt: "58558"  },
  { id: "caesarean",          name: "Caesarean Section",                  category: "OB/GYN",         cpt: "59510"  },
  { id: "amniocentesis",      name: "Amniocentesis",                      category: "OB/GYN",         cpt: "59000"  },
  // Ophthalmology
  { id: "lasik",              name: "LASIK / Refractive Surgery",         category: "Ophthalmology",  cpt: "65771"  },
  { id: "cataract-surgery",   name: "Cataract Surgery",                   category: "Ophthalmology",  cpt: "66984"  },
  { id: "retinal-laser",      name: "Retinal Laser Photocoagulation",     category: "Ophthalmology",  cpt: "67228"  },
];

const PROCEDURE_CATEGORIES = [...new Set(PROCEDURES.map(p => p.category))];

// ─── ER Facilities ─────────────────────────────────────────────────────────────

interface ErService { id: string; name: string; }
type ErFacilityCategory = "Hospital" | "Clinic" | "Diagnostic Lab" | "Pharmacy" | "Rehab Centre" | "Other";
interface ErFacility { name: string; type: ErFacilityCategory; services: ErService[]; }

const FACILITY_BADGE: Record<ErFacilityCategory, string> = {
  "Hospital":       "bg-red-100 text-red-600",
  "Clinic":         "bg-orange-100 text-orange-600",
  "Diagnostic Lab": "bg-purple-100 text-purple-600",
  "Pharmacy":       "bg-green-100 text-green-600",
  "Rehab Centre":   "bg-blue-100 text-blue-600",
  "Other":          "bg-slate-100 text-slate-600",
};

const ER_FACILITIES: ErFacility[] = [
  {
    name: "Hamad General Hospital", type: "Hospital",
    services: [
      { id: "hgh-er",       name: "Emergency Department (Adult)"       },
      { id: "hgh-trauma",   name: "Trauma & Critical Care Unit"        },
      { id: "hgh-cardiac",  name: "Cardiac Emergency (STEMI Network)"  },
      { id: "hgh-stroke",   name: "Stroke Response Unit"               },
      { id: "hgh-burn",     name: "Burns Emergency Unit"               },
      { id: "hgh-tox",      name: "Toxicology & Overdose Services"     },
    ],
  },
  {
    name: "Al Wakra Hospital", type: "Hospital",
    services: [
      { id: "awh-er",       name: "Emergency Department"               },
      { id: "awh-ped",      name: "Pediatric Emergency"                },
      { id: "awh-obs",      name: "Obstetric Emergency"                },
      { id: "awh-trauma",   name: "Trauma Services"                    },
      { id: "awh-cardiac",  name: "Cardiac Emergency"                  },
    ],
  },
  {
    name: "Al Khor Hospital", type: "Hospital",
    services: [
      { id: "akh-er",       name: "Emergency Department"               },
      { id: "akh-ped",      name: "Pediatric Emergency"                },
      { id: "akh-trauma",   name: "Minor Trauma & Fracture Clinic"     },
      { id: "akh-obs",      name: "Obstetric Emergency"                },
    ],
  },
  {
    name: "The Cuban Hospital", type: "Hospital",
    services: [
      { id: "cub-er",       name: "Emergency Department"               },
      { id: "cub-ped",      name: "Pediatric Emergency"                },
      { id: "cub-obs",      name: "Obstetric & Maternity Emergency"    },
    ],
  },
  {
    name: "Sidra Medicine", type: "Hospital",
    services: [
      { id: "sid-ped-er",   name: "Pediatric Emergency Department"     },
      { id: "sid-nicu",     name: "Neonatal Intensive Care (NICU)"     },
      { id: "sid-obs",      name: "Obstetric Emergency & Labour"       },
      { id: "sid-trauma",   name: "Pediatric Trauma Unit"              },
    ],
  },
  {
    name: "Aster Medical Centre", type: "Clinic",
    services: [
      { id: "ast-uc",       name: "Urgent Care"                        },
      { id: "ast-minor",    name: "Minor Injuries & Wound Care"        },
      { id: "ast-iv",       name: "IV Drip & Infusion Therapy"         },
    ],
  },
  {
    name: "Medicover Clinic", type: "Clinic",
    services: [
      { id: "med-uc",       name: "Urgent Care Walk-In"                },
      { id: "med-minor",    name: "Minor Procedures & Laceration Repair"},
      { id: "med-obs",      name: "Occupational Health Emergency"      },
    ],
  },
  {
    name: "Prime Medical Centre", type: "Clinic",
    services: [
      { id: "prime-uc",     name: "Urgent Care"                        },
      { id: "prime-minor",  name: "Minor Injuries"                     },
      { id: "prime-iv",     name: "IV Therapy"                         },
      { id: "prime-peds",   name: "Pediatric Urgent Care"              },
    ],
  },
  {
    name: "Qatar Medical Centre", type: "Clinic",
    services: [
      { id: "qmc-uc",       name: "24-Hour Urgent Care"                },
      { id: "qmc-trauma",   name: "Minor Trauma & X-Ray Services"      },
      { id: "qmc-iv",       name: "IV Hydration & Infusion"            },
    ],
  },
];

// ─── Admin-wired ER facility loader ───────────────────────────────────────────

const REFERRAL_DEST_KEY = "ehr-referral-destinations-v1";

function loadErFacilities(): ErFacility[] {
  try {
    const raw = localStorage.getItem(REFERRAL_DEST_KEY);
    if (raw) {
      const items = JSON.parse(raw) as {
        id: string; name: string;
        category: string; services: string[]; active: boolean;
      }[];
      const active = items.filter(d => d.active && d.services.length > 0);
      if (active.length > 0) {
        return active.map(d => ({
          name: d.name,
          type: d.category as ErFacilityCategory,
          services: d.services.map((s, i) => ({ id: `${d.id}-${i}`, name: s })),
        }));
      }
    }
  } catch { /**/ }
  return ER_FACILITIES;
}

const COMORBIDITY_OPTIONS = [
  "Hypertension", "Type 2 Diabetes", "Type 1 Diabetes", "Hyperlipidaemia",
  "Asthma", "COPD", "Chronic Kidney Disease", "Heart Failure",
  "Atrial Fibrillation", "Coronary Artery Disease", "Stroke / TIA",
  "Hypothyroidism", "Hyperthyroidism", "Obesity", "Depression", "Anxiety",
  "Epilepsy", "Osteoporosis", "Rheumatoid Arthritis", "Gout",
  "GERD", "Irritable Bowel Syndrome", "Chronic Liver Disease",
];

const FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "Four times daily",
  "Every 8 hours", "Every 12 hours", "As needed", "At night", "With meals"];
const DURATIONS   = ["3 days", "5 days", "7 days", "10 days", "14 days",
  "1 month", "2 months", "3 months", "6 months", "Ongoing"];

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  severe:    { label: "Severe",    color: "#ef4444" },
  moderate:  { label: "Moderate",  color: "#f97316" },
  mild:      { label: "Mild",      color: "#eab308" },
  very_mild: { label: "Very Mild", color: "#22c55e" },
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function blankEntry(): ReferralEntry {
  return {
    id: uid(), referralType: "Internal", referralTarget: "Consultant",
    customTarget: "", speciality: "", consultantName: "",
    procedureName: "", procedureCategory: "",
    facilityName: "", erService: "",
    comorbidities: [], medications: [], allergies: [],
    reason: "", summary: "",
  };
}

// ─── Medication Mini-Form ─────────────────────────────────────────────────────

interface MedFormProps {
  onAdd:    (m: ReferralMed) => void;
  onCancel: () => void;
}

function MedMiniForm({ onAdd, onCancel }: MedFormProps) {
  const [search,    setSearch]    = useState("");
  const [selMed,    setSelMed]    = useState<typeof MEDICINES[0] | null>(null);
  const [brandId,   setBrandId]   = useState("");
  const [freq,      setFreq]      = useState(FREQUENCIES[0]);
  const [dur,       setDur]       = useState(DURATIONS[0]);
  const [qty,       setQty]       = useState(1);
  const [showList,  setShowList]  = useState(false);

  const filtered = MEDICINES.filter(m =>
    m.generic.toLowerCase().includes(search.toLowerCase()) ||
    m.brands.some(b => b.brand.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 12);

  const selBrand = selMed?.brands.find(b => b.id === brandId) ?? selMed?.brands[0];

  function handleSave() {
    if (!selMed || !selBrand) return;
    onAdd({
      id: uid(), brand: selBrand.brand, generic: selMed.generic,
      strength: selBrand.strength, frequency: freq, duration: dur, qty,
    });
  }

  return (
    <div className="rounded-xl border-2 border-violet-100 bg-violet-50/40 p-3 space-y-3 mt-1">
      <p className="text-[10px] font-black text-violet-600 uppercase tracking-wide flex items-center gap-1">
        <Pill className="h-3 w-3" /> Add Medication
      </p>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
        <input
          className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-violet-300"
          placeholder="Search generic or brand…"
          value={search}
          onChange={e => { setSearch(e.target.value); setShowList(true); setSelMed(null); }}
          onFocus={() => setShowList(true)}
        />
        {showList && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            {filtered.map(m => (
              <button key={m.id} className="w-full text-left px-3 py-2 text-xs hover:bg-violet-50 border-b border-slate-50 last:border-0"
                onClick={() => { setSelMed(m); setBrandId(m.brands[0]?.id ?? ""); setSearch(m.generic); setShowList(false); }}>
                <span className="font-bold text-slate-700">{m.generic}</span>
                <span className="text-slate-400 ml-1">— {m.brands.map(b => b.brand).join(", ")}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {selMed && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Brand / Strength</p>
            <select className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
              value={brandId} onChange={e => setBrandId(e.target.value)}>
              {selMed.brands.map(b => (
                <option key={b.id} value={b.id}>{b.brand} {b.strength}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Frequency</p>
            <select className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
              value={freq} onChange={e => setFreq(e.target.value)}>
              {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Duration</p>
            <select className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
              value={dur} onChange={e => setDur(e.target.value)}>
              {DURATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Qty</p>
            <input type="number" min={1} max={999} value={qty}
              onChange={e => setQty(Math.max(1, Number(e.target.value)))}
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none" />
          </div>
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <button className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
          onClick={onCancel}>Cancel</button>
        <button disabled={!selMed}
          className="text-xs font-bold text-white px-4 py-1.5 rounded-lg disabled:opacity-40"
          style={{ background: "#8b5cf6" }} onClick={handleSave}>
          Add Medication
        </button>
      </div>
    </div>
  );
}

// ─── Allergy Mini-Form ────────────────────────────────────────────────────────

interface AllergyFormProps {
  onAdd:    (a: AllergyEntry) => void;
  onCancel: () => void;
}

const ALLERGEN_OPTIONS = ["Penicillin", "Aspirin", "Ibuprofen", "Sulfonamides",
  "Codeine", "Contrast Dye", "Latex", "Peanuts", "Shellfish", "Dairy",
  "Eggs", "Wheat", "Pollen", "Dustmite", "Bee Sting", "Other"];
const REACTIONS        = ["Rash/Hives", "Anaphylaxis", "Angioedema", "Bronchospasm",
  "Nausea/Vomiting", "Rhinitis", "Skin Irritation", "Other"];
const SEVERITIES       = ["severe", "moderate", "mild", "very_mild"] as const;

function AllergyMiniForm({ onAdd, onCancel }: AllergyFormProps) {
  const [name,     setName]     = useState("");
  const [reaction, setReaction] = useState(REACTIONS[0]);
  const [severity, setSeverity] = useState<typeof SEVERITIES[number]>("moderate");

  function handleSave() {
    if (!name.trim()) return;
    onAdd({
      id: uid(), name: name.trim(), allergenType: "Drug",
      date: new Date().toISOString().slice(0, 10),
      reaction, onset: "Immediate (< 1 hour)", severity,
    });
  }

  return (
    <div className="rounded-xl border-2 border-red-100 bg-red-50/40 p-3 space-y-3 mt-1">
      <p className="text-[10px] font-black text-red-600 uppercase tracking-wide flex items-center gap-1">
        <AlertCircle className="h-3 w-3" /> Add Allergy
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Allergen</p>
          <input list="allergen-list-ref" className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
            placeholder="Type or select…" value={name} onChange={e => setName(e.target.value)} />
          <datalist id="allergen-list-ref">
            {ALLERGEN_OPTIONS.map(a => <option key={a} value={a} />)}
          </datalist>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Reaction</p>
          <select className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
            value={reaction} onChange={e => setReaction(e.target.value)}>
            {REACTIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Severity</p>
          <select className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
            value={severity} onChange={e => setSeverity(e.target.value as typeof SEVERITIES[number])}>
            {SEVERITIES.map(s => <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="text-xs text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200 bg-white" onClick={onCancel}>Cancel</button>
        <button disabled={!name.trim()} className="text-xs font-bold text-white px-4 py-1.5 rounded-lg disabled:opacity-40"
          style={{ background: "#ef4444" }} onClick={handleSave}>Add Allergy</button>
      </div>
    </div>
  );
}

// ─── Referral Edit Form (inside drawer) ───────────────────────────────────────

interface ReferralFormProps {
  entry:            ReferralEntry;
  patientAllergies: AllergyEntry[];
  patientMeds:      ReferralMed[];
  onChange:         (e: ReferralEntry) => void;
  onSave:           () => void;
  onCancel:         () => void;
}

function ReferralForm({ entry, patientAllergies, patientMeds, onChange, onSave, onCancel }: ReferralFormProps) {
  const [showMedForm,     setShowMedForm]     = useState(false);
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [comorbInput,     setComorbInput]     = useState("");
  const [showComorbList,  setShowComorbList]  = useState(false);

  const [erFacilities]  = useState<ErFacility[]>(loadErFacilities);
  const [specialtyMap]  = useState<Record<string, ConsultantDef[]>>(loadSpecialtyMap);
  const specialities    = Object.keys(specialtyMap).sort();

  const set = (k: keyof ReferralEntry, v: unknown) => onChange({ ...entry, [k]: v } as ReferralEntry);

  const consultants       = entry.speciality ? (specialtyMap[entry.speciality] ?? []) : [];
  const erFacility        = erFacilities.find(f => f.name === entry.facilityName);
  const erServices        = erFacility?.services ?? [];
  const [procSearch,      setProcSearch]      = useState("");
  const [procCategory,    setProcCategory]    = useState("");

  const filteredProcs = PROCEDURES.filter(p =>
    (procCategory ? p.category === procCategory : true) &&
    (procSearch   ? p.name.toLowerCase().includes(procSearch.toLowerCase()) : true)
  );

  const filteredComorbidities = COMORBIDITY_OPTIONS.filter(c =>
    c.toLowerCase().includes(comorbInput.toLowerCase()) && !entry.comorbidities.includes(c)
  );

  function addComorb(c: string) {
    set("comorbidities", [...entry.comorbidities, c]);
    setComorbInput("");
    setShowComorbList(false);
  }

  function importAllergies() {
    const existing = entry.allergies.map(a => a.name);
    const toAdd    = patientAllergies.filter(a => !existing.includes(a.name));
    set("allergies", [...entry.allergies, ...toAdd]);
  }

  function importMeds() {
    const existing = entry.medications.map(m => m.id);
    const toAdd    = patientMeds.filter(m => !existing.includes(m.id));
    set("medications", [...entry.medications, ...toAdd]);
  }

  const isValid = (() => {
    if (!entry.reason.trim()) return false;
    if (entry.referralTarget === "Consultant") return !!(entry.speciality && entry.consultantName);
    if (entry.referralTarget === "Procedure")  return !!entry.procedureName;
    if (entry.referralTarget === "ER")         return !!(entry.facilityName && entry.erService);
    if (entry.referralTarget === "Custom")     return !!entry.customTarget.trim();
    return true;
  })();

  return (
    <div className="space-y-5">

      {/* Referral Type */}
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Referral Type</p>
        <div className="flex gap-2">
          {(["Internal", "External"] as ReferralType[]).map(t => (
            <button key={t}
              onClick={() => {
                const internalOnly = ["Consultant", "Procedure"] as ReferralTarget[];
                const nextTarget = t === "Internal" && !internalOnly.includes(entry.referralTarget)
                  ? "Consultant" : entry.referralTarget;
                onChange({ ...entry, referralType: t, referralTarget: nextTarget });
              }}
              className="flex-1 text-xs font-bold py-2 rounded-xl border-2 transition-all"
              style={entry.referralType === t
                ? { background: "#6366f1", color: "white", borderColor: "#6366f1" }
                : { background: "#f1f5f9", color: "#64748b", borderColor: "#e2e8f0" }}>
              {t} Referral
            </button>
          ))}
        </div>
      </div>

      {/* Referral Target */}
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Refer To</p>
        <div className="flex gap-2 flex-wrap">
          {(entry.referralType === "Internal"
            ? (["Consultant", "Procedure"] as ReferralTarget[])
            : (["Consultant", "Procedure", "ER", "Custom"] as ReferralTarget[])
          ).map(t => (
            <button key={t} onClick={() => set("referralTarget", t)}
              className="text-xs font-bold px-4 py-1.5 rounded-xl border-2 transition-all"
              style={entry.referralTarget === t
                ? { background: "#6366f1", color: "white", borderColor: "#6366f1" }
                : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }}>
              {t}
            </button>
          ))}
        </div>
        {entry.referralTarget === "Custom" && (
          <input className="mt-2 w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
            placeholder="Specify target…"
            value={entry.customTarget}
            onChange={e => set("customTarget", e.target.value)} />
        )}
      </div>

      {/* ── Consultant fields ── */}
      {entry.referralTarget === "Consultant" && (<>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Speciality</p>
          <select className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
            value={entry.speciality}
            onChange={e => onChange({ ...entry, speciality: e.target.value, consultantName: "" })}>
            <option value="">— Select speciality —</option>
            {specialities.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {entry.speciality && (
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Consultant Name</p>
            <select className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
              value={entry.consultantName}
              onChange={e => set("consultantName", e.target.value)}>
              <option value="">— Select consultant —</option>
              {consultants.map(c => (
                <option key={c.name} value={c.name}>{c.name} — {c.qualifier}</option>
              ))}
            </select>
          </div>
        )}
      </>)}

      {/* ── Procedure picker ── */}
      {entry.referralTarget === "Procedure" && (
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Procedure</p>
          {entry.procedureName && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-teal-50 border border-teal-100">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" />
              <span className="text-xs font-bold text-teal-700 flex-1">{entry.procedureName}</span>
              <span className="text-[9px] text-teal-500 bg-teal-100 px-2 py-0.5 rounded-full">{entry.procedureCategory}</span>
              <button className="text-slate-300 hover:text-red-400 ml-1"
                onClick={() => onChange({ ...entry, procedureName: "", procedureCategory: "" })}>
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap mb-2">
            <button onClick={() => setProcCategory("")}
              className="text-[9px] font-bold px-2 py-1 rounded-full border transition-all"
              style={procCategory === "" ? { background: "#6366f1", color: "white", borderColor: "#6366f1" } : { borderColor: "#e2e8f0", color: "#64748b" }}>
              All
            </button>
            {PROCEDURE_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setProcCategory(cat === procCategory ? "" : cat)}
                className="text-[9px] font-bold px-2 py-1 rounded-full border transition-all"
                style={procCategory === cat ? { background: "#6366f1", color: "white", borderColor: "#6366f1" } : { borderColor: "#e2e8f0", color: "#64748b" }}>
                {cat}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <input className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none"
              placeholder="Search procedure…" value={procSearch}
              onChange={e => setProcSearch(e.target.value)} />
          </div>
          {/* List */}
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 divide-y divide-slate-100">
            {filteredProcs.map(p => (
              <button key={p.id}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-all"
                style={entry.procedureName === p.name
                  ? { background: "#6366f110", color: "#4f46e5" }
                  : { color: "#334155" }}
                onClick={() => onChange({ ...entry, procedureName: p.name, procedureCategory: p.category })}>
                <span className="flex-1 font-medium">{p.name}</span>
                <span className="text-[9px] text-indigo-500 font-mono flex-shrink-0 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">CPT {p.cpt}</span>
                {entry.procedureName === p.name && <CheckCircle2 className="h-3 w-3 text-indigo-500 flex-shrink-0" />}
              </button>
            ))}
            {filteredProcs.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No procedures match</p>
            )}
          </div>
        </div>
      )}

      {/* ── ER: Facility → Services ── */}
      {entry.referralTarget === "ER" && (<>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Facility</p>
          <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
            {erFacilities.map(f => (
              <button key={f.name}
                className="w-full text-left px-3 py-2 rounded-xl border-2 text-xs flex items-center gap-2 transition-all"
                style={entry.facilityName === f.name
                  ? { borderColor: "#ef4444", background: "#fef2f2", color: "#dc2626" }
                  : { borderColor: "#e2e8f0", background: "#f8fafc",  color: "#475569" }}
                onClick={() => onChange({ ...entry, facilityName: f.name, erService: "" })}>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${FACILITY_BADGE[f.type] ?? "bg-slate-100 text-slate-600"}`}>
                  {f.type}
                </span>
                <span className="font-bold flex-1">{f.name}</span>
                {entry.facilityName === f.name && <CheckCircle2 className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
        {entry.facilityName && (
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">
              ER / Urgent Care Service
              <span className="text-slate-400 font-normal ml-1">— {entry.facilityName}</span>
            </p>
            <div className="space-y-1.5">
              {erServices.map(s => (
                <button key={s.id}
                  className="w-full text-left px-3 py-2 rounded-xl border-2 text-xs flex items-center gap-2 transition-all"
                  style={entry.erService === s.name
                    ? { borderColor: "#ef4444", background: "#fef2f2", color: "#dc2626" }
                    : { borderColor: "#e2e8f0", background: "#f8fafc",  color: "#475569" }}
                  onClick={() => set("erService", s.name)}>
                  <span className="flex-1 font-medium">{s.name}</span>
                  {entry.erService === s.name && <CheckCircle2 className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </>)}

      {/* Co-morbidities */}
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Co-morbidities</p>
        {entry.comorbidities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {entry.comorbidities.map(c => (
              <span key={c} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                {c}
                <button className="hover:text-red-500" onClick={() => set("comorbidities", entry.comorbidities.filter(x => x !== c))}>
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
          <input className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none"
            placeholder="Search or type comorbidity…"
            value={comorbInput}
            onChange={e => { setComorbInput(e.target.value); setShowComorbList(true); }}
            onFocus={() => setShowComorbList(true)}
            onKeyDown={e => {
              if (e.key === "Enter" && comorbInput.trim() && !entry.comorbidities.includes(comorbInput.trim()))
                addComorb(comorbInput.trim());
            }}
          />
          {showComorbList && (comorbInput || filteredComorbidities.length > 0) && (
            <div className="absolute z-50 mt-1 w-full max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
              {filteredComorbidities.slice(0, 8).map(c => (
                <button key={c} className="w-full text-left px-3 py-1.5 text-xs hover:bg-amber-50 border-b border-slate-50 last:border-0"
                  onClick={() => addComorb(c)}>{c}</button>
              ))}
              {comorbInput.trim() && !COMORBIDITY_OPTIONS.includes(comorbInput.trim()) && (
                <button className="w-full text-left px-3 py-1.5 text-xs text-amber-600 font-bold hover:bg-amber-50"
                  onClick={() => addComorb(comorbInput.trim())}>
                  + Add "{comorbInput.trim()}"
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Current Medications */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Current Medications</p>
          <button className="text-[9px] font-bold text-violet-600 hover:text-violet-700 flex items-center gap-0.5 ml-auto"
            onClick={() => { setShowMedForm(true); setShowAllergyForm(false); }}>
            <Plus className="h-2.5 w-2.5" /> Add
          </button>
          {patientMeds.length > 0 && (
            <button className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              onClick={importMeds}>
              <Download className="h-2.5 w-2.5" /> Import
            </button>
          )}
        </div>
        {entry.medications.map(m => (
          <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-violet-50 border border-violet-100 mb-1.5 text-xs">
            <div>
              <span className="font-bold text-violet-700">{m.brand}</span>
              <span className="text-slate-500 ml-1">{m.strength}</span>
              <span className="text-slate-400 mx-1">·</span>
              <span className="text-slate-500">{m.frequency}</span>
              <span className="text-slate-400 mx-1">·</span>
              <span className="text-slate-400">{m.duration}</span>
            </div>
            <button className="text-slate-300 hover:text-red-400"
              onClick={() => set("medications", entry.medications.filter(x => x.id !== m.id))}>
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {showMedForm && (
          <MedMiniForm
            onAdd={m => { set("medications", [...entry.medications, m]); setShowMedForm(false); }}
            onCancel={() => setShowMedForm(false)}
          />
        )}
      </div>

      {/* Drug Allergies */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Drug Allergies</p>
          <button className="text-[9px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 ml-auto"
            onClick={() => { setShowAllergyForm(true); setShowMedForm(false); }}>
            <Plus className="h-2.5 w-2.5" /> Add
          </button>
          {patientAllergies.length > 0 && (
            <button className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              onClick={importAllergies}>
              <Download className="h-2.5 w-2.5" /> Import
            </button>
          )}
        </div>
        {entry.allergies.map(a => (
          <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-50 border border-red-100 mb-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                style={{ background: SEVERITY_CONFIG[a.severity]?.color ?? "#94a3b8" }} />
              <span className="font-bold text-red-700">{a.name}</span>
              {a.reaction && <span className="text-slate-400">{a.reaction}</span>}
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: `${SEVERITY_CONFIG[a.severity]?.color ?? "#94a3b8"}18`, color: SEVERITY_CONFIG[a.severity]?.color ?? "#94a3b8" }}>
                {SEVERITY_CONFIG[a.severity]?.label ?? a.severity}
              </span>
            </div>
            <button className="text-slate-300 hover:text-red-400"
              onClick={() => set("allergies", entry.allergies.filter(x => x.id !== a.id))}>
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {showAllergyForm && (
          <AllergyMiniForm
            onAdd={a => { set("allergies", [...entry.allergies, a]); setShowAllergyForm(false); }}
            onCancel={() => setShowAllergyForm(false)}
          />
        )}
      </div>

      {/* Reason for Referral */}
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
          Reason for Referral <span className="text-red-400">*</span>
        </p>
        <input className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
          placeholder="e.g. Uncontrolled hypertension, further cardiac evaluation…"
          value={entry.reason}
          onChange={e => set("reason", e.target.value)} />
      </div>

      {/* Clinical Summary */}
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">Clinical Summary</p>
        <textarea rows={3}
          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
          placeholder="Brief context for the receiving clinician…"
          value={entry.summary}
          onChange={e => set("summary", e.target.value)} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        <button className="text-xs text-slate-500 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
          onClick={onCancel}>Cancel</button>
        <button disabled={!isValid}
          className="text-xs font-black text-white px-5 py-2 rounded-xl disabled:opacity-40 flex items-center gap-1.5"
          style={{ background: "#6366f1" }}
          onClick={onSave}>
          <ClipboardCheck className="h-3.5 w-3.5" /> Save Referral
        </button>
      </div>
    </div>
  );
}

// ─── Referral Card ────────────────────────────────────────────────────────────

interface ReferralCardProps {
  entry:    ReferralEntry;
  onEdit:   () => void;
  onDelete: () => void;
}

function ReferralCard({ entry, onEdit, onDelete }: ReferralCardProps) {
  const typeColor = entry.referralType === "Internal" ? "#6366f1" : "#0ea5e9";
  return (
    <div className="rounded-xl border-2 bg-white p-3 space-y-2" style={{ borderColor: `${typeColor}30` }}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
              style={{ background: typeColor }}>
              {entry.referralType}
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {entry.referralTarget === "Custom" ? entry.customTarget : entry.referralTarget}
            </span>
            {entry.referralTarget === "Consultant" && entry.speciality && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                {entry.speciality}
              </span>
            )}
            {entry.referralTarget === "Procedure" && entry.procedureCategory && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">
                {entry.procedureCategory}
              </span>
            )}
            {entry.referralTarget === "ER" && entry.facilityName && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                {entry.facilityName}
              </span>
            )}
          </div>
          {entry.referralTarget === "Consultant" && entry.consultantName && (
            <p className="text-xs font-bold text-slate-700 mt-1.5 flex items-center gap-1">
              <Users className="h-3 w-3 text-indigo-400" />
              {entry.consultantName}
            </p>
          )}
          {entry.referralTarget === "Procedure" && entry.procedureName && (
            <p className="text-xs font-bold text-teal-700 mt-1.5">{entry.procedureName}</p>
          )}
          {entry.referralTarget === "ER" && entry.erService && (
            <p className="text-xs font-bold text-red-700 mt-1.5">{entry.erService}</p>
          )}
          {entry.reason && (
            <p className="text-[10px] text-slate-500 mt-1 italic truncate">{entry.reason}</p>
          )}
          <div className="flex gap-3 mt-1.5 text-[9px] text-slate-400">
            {entry.medications.length > 0 && (
              <span className="flex items-center gap-0.5">
                <Pill className="h-2.5 w-2.5" /> {entry.medications.length} med{entry.medications.length !== 1 ? "s" : ""}
              </span>
            )}
            {entry.allergies.length > 0 && (
              <span className="flex items-center gap-0.5 text-red-400">
                <AlertCircle className="h-2.5 w-2.5" /> {entry.allergies.length} allerg{entry.allergies.length !== 1 ? "ies" : "y"}
              </span>
            )}
            {entry.comorbidities.length > 0 && (
              <span>{entry.comorbidities.length} comorbidities</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button className="text-slate-300 hover:text-indigo-500 transition-colors" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button className="text-slate-300 hover:text-red-500 transition-colors" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Referral Drawer ──────────────────────────────────────────────────────────

interface ReferralDrawerProps {
  savedData:        ReferralData;
  patientAllergies: AllergyEntry[];
  patientMeds:      ReferralMed[];
  onSave:           (d: ReferralData) => void;
  onClose:          () => void;
}

export function ReferralDrawer({ savedData, patientAllergies, patientMeds, onSave, onClose }: ReferralDrawerProps) {
  const [referrals, setReferrals] = useState<ReferralEntry[]>(savedData.referrals);
  const [editingId, setEditingId]  = useState<string | null>(null);
  const [draftEntry, setDraftEntry]= useState<ReferralEntry | null>(null);

  function startNew() {
    const e = blankEntry();
    setDraftEntry(e);
    setEditingId(e.id);
  }

  function startEdit(id: string) {
    const e = referrals.find(r => r.id === id);
    if (e) { setDraftEntry({ ...e }); setEditingId(id); }
  }

  function handleSave() {
    if (!draftEntry) return;
    const exists = referrals.some(r => r.id === draftEntry.id);
    if (exists) setReferrals(prev => prev.map(r => r.id === draftEntry.id ? draftEntry : r));
    else         setReferrals(prev => [...prev, draftEntry]);
    setEditingId(null); setDraftEntry(null);
  }

  function handleCancel() { setEditingId(null); setDraftEntry(null); }

  function handleDelete(id: string) { setReferrals(prev => prev.filter(r => r.id !== id)); }

  function handleCommit() {
    onSave({ referrals });
    onClose();
  }

  const isEditing = !!(editingId && draftEntry);

  return (
    <div className="absolute inset-y-0 right-0 w-[68%] z-20 flex flex-col bg-white border-l border-slate-200 shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #6366f110 0%, #8b5cf610 100%)" }}>
        {!isEditing && (
          <button className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0" onClick={onClose}>
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#6366f1" }}>
          <Users className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-800">Patient Referrals</p>
          <p className="text-[10px] text-slate-500">Internal &amp; External Referrals</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleCommit}
            className="flex items-center gap-1.5 text-xs font-black text-white px-4 py-2 rounded-xl flex-shrink-0 hover:opacity-90 transition-opacity"
            style={{ background: "#6366f1" }}>
            <ClipboardCheck className="h-3.5 w-3.5" />
            {savedData.referrals.length > 0 ? "Update Referrals" : "Mark Done"}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {isEditing ? (
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wide mb-3">
              {referrals.some(r => r.id === editingId) ? "Edit Referral" : "New Referral"}
            </p>
            <ReferralForm
              entry={draftEntry}
              patientAllergies={patientAllergies}
              patientMeds={patientMeds}
              onChange={setDraftEntry}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <>
            {/* Existing cards */}
            {referrals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-indigo-300" />
                </div>
                <p className="text-sm font-bold text-slate-400">No referrals yet</p>
                <p className="text-xs text-slate-300 mt-1">Tap "Add Referral" to create one</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map(r => (
                  <ReferralCard
                    key={r.id}
                    entry={r}
                    onEdit={() => startEdit(r.id)}
                    onDelete={() => handleDelete(r.id)}
                  />
                ))}
              </div>
            )}
            {/* Add button */}
            <button
              className="w-full text-xs font-bold border-2 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 transition-all hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
              style={{ borderColor: "#c7d2fe", color: "#6366f1" }}
              onClick={startNew}>
              <Plus className="h-3.5 w-3.5" /> Add Referral
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Chips Panel (shown in the Assessment & Plan section) ─────────────────────

interface ReferralChipsPanelProps {
  data:   ReferralData;
  onOpen: () => void;
}

export function ReferralChipsPanel({ data, onOpen }: ReferralChipsPanelProps) {
  if (data.referrals.length === 0) {
    return (
      <button
        onClick={onOpen}
        className="text-xs font-bold border-2 border-dashed rounded-xl px-4 py-2.5 flex items-center gap-2 transition-all hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 w-full"
        style={{ borderColor: "#c7d2fe", color: "#6366f1" }}>
        <Plus className="h-3.5 w-3.5" />
        Add patient referral…
      </button>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {data.referrals.map(r => {
        const typeColor = r.referralType === "Internal" ? "#6366f1" : "#0ea5e9";
        const label = r.referralTarget === "Consultant"
          ? (r.speciality || "Consultant")
          : r.referralTarget === "Procedure"
          ? (r.procedureName || "Procedure")
          : r.referralTarget === "ER"
          ? (r.erService || r.facilityName || "ER")
          : (r.customTarget || "Custom");
        return (
          <button key={r.id} onClick={onOpen}
            className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl border-2 transition-all hover:opacity-80"
            style={{ background: `${typeColor}10`, color: typeColor, borderColor: `${typeColor}30` }}>
            <Users className="h-3 w-3" />
            <span>{r.referralType}</span>
            <ArrowRight className="h-2.5 w-2.5 opacity-50" />
            <span className="truncate max-w-[140px]">{label}</span>
          </button>
        );
      })}
      <button onClick={onOpen}
        className="text-[10px] font-bold px-3 py-1.5 rounded-xl border-2 border-dashed transition-all hover:border-indigo-300 hover:bg-indigo-50"
        style={{ borderColor: "#c7d2fe", color: "#6366f1" }}>
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
