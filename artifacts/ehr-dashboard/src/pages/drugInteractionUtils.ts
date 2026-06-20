export type InteractionSeverity = "Contraindicated" | "Major" | "Moderate" | "Minor";

export interface DrugInteraction {
  id:            string;
  medicineIdA:   string;
  medicineNameA: string;
  medicineIdB:   string;
  medicineNameB: string;
  severity:      InteractionSeverity;
  note:          string;
  enabled:       boolean;
}

export interface InteractionAlert {
  severity:      InteractionSeverity;
  note:          string;
  medicineNameA: string;
  medicineNameB: string;
}

export const INTERACTIONS_KEY = "ehr-drug-interactions-v1";

export const SEED_INTERACTIONS: DrugInteraction[] = [
  // ── Contraindicated ──
  {
    id: "ddi-cipro-ondansetron", enabled: true, severity: "Contraindicated",
    medicineIdA: "ciprofloxacin",  medicineNameA: "Ciprofloxacin",
    medicineIdB: "ondansetron",    medicineNameB: "Ondansetron",
    note: "Both prolong the QT interval — risk of fatal arrhythmia (Torsades de Pointes).",
  },
  {
    id: "ddi-azithro-ondansetron", enabled: true, severity: "Contraindicated",
    medicineIdA: "azithromycin",   medicineNameA: "Azithromycin",
    medicineIdB: "ondansetron",    medicineNameB: "Ondansetron",
    note: "Both prolong the QT interval — risk of fatal arrhythmia (Torsades de Pointes).",
  },
  // ── Major ──
  {
    id: "ddi-aspirin-ibuprofen", enabled: true, severity: "Major",
    medicineIdA: "aspirin",        medicineNameA: "Aspirin (ASA)",
    medicineIdB: "ibuprofen",      medicineNameB: "Ibuprofen",
    note: "Ibuprofen competitively inhibits aspirin's antiplatelet effect; concurrent use increases GI bleed risk.",
  },
  {
    id: "ddi-aspirin-diclofenac", enabled: true, severity: "Major",
    medicineIdA: "aspirin",        medicineNameA: "Aspirin (ASA)",
    medicineIdB: "diclofenac",     medicineNameB: "Diclofenac",
    note: "Concurrent NSAIDs increase GI bleed risk and reduce aspirin's antiplatelet efficacy.",
  },
  {
    id: "ddi-pred-ibuprofen", enabled: true, severity: "Major",
    medicineIdA: "prednisolone",   medicineNameA: "Prednisolone",
    medicineIdB: "ibuprofen",      medicineNameB: "Ibuprofen",
    note: "Corticosteroid + NSAID combination significantly increases risk of GI ulceration and bleeding.",
  },
  {
    id: "ddi-pred-aspirin", enabled: true, severity: "Major",
    medicineIdA: "prednisolone",   medicineNameA: "Prednisolone",
    medicineIdB: "aspirin",        medicineNameB: "Aspirin (ASA)",
    note: "Corticosteroid + NSAID combination significantly increases risk of GI ulceration and bleeding.",
  },
  {
    id: "ddi-tramadol-metronidazole", enabled: true, severity: "Major",
    medicineIdA: "tramadol",       medicineNameA: "Tramadol",
    medicineIdB: "metronidazole",  medicineNameB: "Metronidazole",
    note: "Metronidazole lowers seizure threshold; combined with tramadol significantly increases seizure risk.",
  },
  {
    id: "ddi-tramadol-ondansetron", enabled: true, severity: "Major",
    medicineIdA: "tramadol",       medicineNameA: "Tramadol",
    medicineIdB: "ondansetron",    medicineNameB: "Ondansetron",
    note: "Ondansetron (5-HT3 antagonist) reduces tramadol's analgesic efficacy via serotonergic mechanism.",
  },
  // ── Moderate ──
  {
    id: "ddi-ibuprofen-lisinopril", enabled: true, severity: "Moderate",
    medicineIdA: "ibuprofen",      medicineNameA: "Ibuprofen",
    medicineIdB: "lisinopril",     medicineNameB: "Lisinopril",
    note: "NSAIDs blunt ACE inhibitor antihypertensive effect and increase risk of acute kidney injury.",
  },
  {
    id: "ddi-diclofenac-lisinopril", enabled: true, severity: "Moderate",
    medicineIdA: "diclofenac",     medicineNameA: "Diclofenac",
    medicineIdB: "lisinopril",     medicineNameB: "Lisinopril",
    note: "NSAIDs blunt ACE inhibitor antihypertensive effect and increase risk of acute kidney injury.",
  },
  {
    id: "ddi-metoprolol-amlodipine", enabled: true, severity: "Moderate",
    medicineIdA: "metoprolol",     medicineNameA: "Metoprolol",
    medicineIdB: "amlodipine",     medicineNameB: "Amlodipine",
    note: "Additive negative chronotropic and inotropic effect; monitor for bradycardia and heart block.",
  },
  {
    id: "ddi-pred-metformin", enabled: true, severity: "Moderate",
    medicineIdA: "prednisolone",   medicineNameA: "Prednisolone",
    medicineIdB: "metformin",      medicineNameB: "Metformin",
    note: "Corticosteroids cause hyperglycemia, counteracting metformin's glucose-lowering effect; monitor blood glucose.",
  },
  {
    id: "ddi-tramadol-metoprolol", enabled: true, severity: "Moderate",
    medicineIdA: "tramadol",       medicineNameA: "Tramadol",
    medicineIdB: "metoprolol",     medicineNameB: "Metoprolol",
    note: "Tramadol inhibits CYP2D6, increasing metoprolol plasma levels; risk of bradycardia and hypotension.",
  },
  {
    id: "ddi-cipro-metformin", enabled: true, severity: "Moderate",
    medicineIdA: "ciprofloxacin",  medicineNameA: "Ciprofloxacin",
    medicineIdB: "metformin",      medicineNameB: "Metformin",
    note: "Ciprofloxacin inhibits renal tubular secretion of metformin, increasing exposure and hypoglycemia risk.",
  },
  {
    id: "ddi-ibuprofen-furosemide", enabled: true, severity: "Moderate",
    medicineIdA: "ibuprofen",      medicineNameA: "Ibuprofen",
    medicineIdB: "furosemide",     medicineNameB: "Furosemide",
    note: "NSAIDs reduce diuretic efficacy and may worsen fluid retention in cardiac patients.",
  },
  {
    id: "ddi-aspirin-furosemide", enabled: true, severity: "Moderate",
    medicineIdA: "aspirin",        medicineNameA: "Aspirin (ASA)",
    medicineIdB: "furosemide",     medicineNameB: "Furosemide",
    note: "High-dose aspirin antagonises the natriuretic effect of furosemide.",
  },
  {
    id: "ddi-metformin-glibenclamide", enabled: true, severity: "Moderate",
    medicineIdA: "metformin",      medicineNameA: "Metformin",
    medicineIdB: "glibenclamide",  medicineNameB: "Glibenclamide (Glyburide)",
    note: "Additive hypoglycemia risk; combination is common but requires blood glucose monitoring.",
  },
  // ── Minor ──
  {
    id: "ddi-atorvastatin-amlodipine", enabled: true, severity: "Minor",
    medicineIdA: "atorvastatin",   medicineNameA: "Atorvastatin",
    medicineIdB: "amlodipine",     medicineNameB: "Amlodipine",
    note: "Amlodipine weakly inhibits CYP3A4; slightly increases atorvastatin exposure (usually clinically insignificant).",
  },
  {
    id: "ddi-furosemide-lisinopril", enabled: true, severity: "Minor",
    medicineIdA: "furosemide",     medicineNameA: "Furosemide",
    medicineIdB: "lisinopril",     medicineNameB: "Lisinopril",
    note: "Additive hypotension; may cause first-dose hypotension, especially in volume-depleted patients.",
  },
];

export function loadInteractions(): DrugInteraction[] {
  try {
    const raw = localStorage.getItem(INTERACTIONS_KEY);
    if (raw) return JSON.parse(raw) as DrugInteraction[];
  } catch { /**/ }
  return SEED_INTERACTIONS;
}

export function saveInteractions(interactions: DrugInteraction[]): void {
  try { localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(interactions)); } catch { /**/ }
}

export function checkInteractions(
  newMedicineId: string,
  existingMedicineIds: string[],
  interactions: DrugInteraction[],
): InteractionAlert[] {
  const alerts: InteractionAlert[] = [];
  const active = interactions.filter(i => i.enabled);
  for (const existing of existingMedicineIds) {
    if (existing === newMedicineId) continue;
    const hit = active.find(i =>
      (i.medicineIdA === newMedicineId && i.medicineIdB === existing) ||
      (i.medicineIdB === newMedicineId && i.medicineIdA === existing)
    );
    if (hit) {
      alerts.push({
        severity:      hit.severity,
        note:          hit.note,
        medicineNameA: hit.medicineNameA,
        medicineNameB: hit.medicineNameB,
      });
    }
  }
  alerts.sort((a, b) => {
    const order: Record<InteractionSeverity, number> = { Contraindicated: 0, Major: 1, Moderate: 2, Minor: 3 };
    return order[a.severity] - order[b.severity];
  });
  return alerts;
}
