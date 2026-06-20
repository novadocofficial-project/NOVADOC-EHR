export interface PediDosingRule {
  id:           string;
  medicineId:   string;
  medicineName: string;
  ageLabel:     string;
  minAgeMonths: number;
  route:        string;
  doseRange:    string;
  frequency:    string;
  maxDose:      string;
  notes:        string;
  enabled:      boolean;
}

export const PEDI_DOSING_KEY = "ehr-pedi-dosing-v1";

export const SEED_PEDI_RULES: PediDosingRule[] = [
  // ── Paracetamol ──
  { id: "pedi-para-0", enabled: true, medicineId: "paracetamol", medicineName: "Paracetamol",
    ageLabel: "Neonate (0–28 days)", minAgeMonths: 0, route: "Oral / IV",
    doseRange: "10–15 mg/kg/dose", frequency: "6–8 hourly", maxDose: "60 mg/kg/day",
    notes: "IV route for neonates unable to take orally." },
  { id: "pedi-para-1", enabled: true, medicineId: "paracetamol", medicineName: "Paracetamol",
    ageLabel: "1 month – 1 year", minAgeMonths: 1, route: "Oral",
    doseRange: "15 mg/kg/dose", frequency: "6 hourly", maxDose: "90 mg/kg/day",
    notes: "Max 4 doses in 24 hours." },
  { id: "pedi-para-2", enabled: true, medicineId: "paracetamol", medicineName: "Paracetamol",
    ageLabel: "1–5 years", minAgeMonths: 12, route: "Oral",
    doseRange: "120–250 mg/dose", frequency: "4–6 hourly", maxDose: "1 g/dose",
    notes: "Do not exceed 5 doses in 24 hours." },
  { id: "pedi-para-3", enabled: true, medicineId: "paracetamol", medicineName: "Paracetamol",
    ageLabel: "6–12 years", minAgeMonths: 72, route: "Oral",
    doseRange: "250–500 mg/dose", frequency: "4–6 hourly", maxDose: "1 g/dose",
    notes: "Do not exceed 5 doses in 24 hours." },

  // ── Ibuprofen ──
  { id: "pedi-ibu-0", enabled: true, medicineId: "ibuprofen", medicineName: "Ibuprofen",
    ageLabel: "3 months – 1 year", minAgeMonths: 3, route: "Oral",
    doseRange: "5 mg/kg/dose", frequency: "6–8 hourly", maxDose: "30 mg/kg/day",
    notes: "Not recommended under 3 months. Use with food." },
  { id: "pedi-ibu-1", enabled: true, medicineId: "ibuprofen", medicineName: "Ibuprofen",
    ageLabel: "1–5 years", minAgeMonths: 12, route: "Oral",
    doseRange: "5–10 mg/kg/dose", frequency: "6–8 hourly", maxDose: "40 mg/kg/day",
    notes: "Use lowest effective dose. Take with food." },
  { id: "pedi-ibu-2", enabled: true, medicineId: "ibuprofen", medicineName: "Ibuprofen",
    ageLabel: "6–12 years", minAgeMonths: 72, route: "Oral",
    doseRange: "200–400 mg/dose", frequency: "6–8 hourly", maxDose: "2.4 g/day",
    notes: "" },

  // ── Amoxicillin ──
  { id: "pedi-amox-0", enabled: true, medicineId: "amoxicillin", medicineName: "Amoxicillin",
    ageLabel: "1 month – 1 year", minAgeMonths: 1, route: "Oral",
    doseRange: "20–30 mg/kg/day ÷ 3 doses", frequency: "TDS", maxDose: "30 mg/kg/day",
    notes: "Standard infections. Double dose for severe infection." },
  { id: "pedi-amox-1", enabled: true, medicineId: "amoxicillin", medicineName: "Amoxicillin",
    ageLabel: "1–5 years", minAgeMonths: 12, route: "Oral",
    doseRange: "125–250 mg/dose", frequency: "TDS", maxDose: "750 mg/day",
    notes: "" },
  { id: "pedi-amox-2", enabled: true, medicineId: "amoxicillin", medicineName: "Amoxicillin",
    ageLabel: "6–12 years", minAgeMonths: 72, route: "Oral",
    doseRange: "250–500 mg/dose", frequency: "TDS", maxDose: "1.5 g/day",
    notes: "" },

  // ── Azithromycin ──
  { id: "pedi-azithro-0", enabled: true, medicineId: "azithromycin", medicineName: "Azithromycin",
    ageLabel: "6 months – 12 years", minAgeMonths: 6, route: "Oral",
    doseRange: "10 mg/kg on Day 1, then 5 mg/kg Days 2–5", frequency: "Once daily", maxDose: "500 mg/dose",
    notes: "5-day course. Take 1 hour before or 2 hours after food." },

  // ── Metronidazole ──
  { id: "pedi-metro-0", enabled: true, medicineId: "metronidazole", medicineName: "Metronidazole",
    ageLabel: "1–3 months", minAgeMonths: 1, route: "Oral",
    doseRange: "15 mg/kg/day ÷ 3 doses", frequency: "TDS", maxDose: "50 mg/kg/day",
    notes: "Use with caution; limited data in young infants." },
  { id: "pedi-metro-1", enabled: true, medicineId: "metronidazole", medicineName: "Metronidazole",
    ageLabel: "3 months – 12 years", minAgeMonths: 3, route: "Oral",
    doseRange: "7.5 mg/kg/dose", frequency: "TDS", maxDose: "400 mg/dose",
    notes: "Duration: 5–7 days for infections; 7–10 days for amoebic colitis." },

  // ── Ciprofloxacin ──
  { id: "pedi-cipro-0", enabled: true, medicineId: "ciprofloxacin", medicineName: "Ciprofloxacin",
    ageLabel: "1–5 years", minAgeMonths: 12, route: "Oral",
    doseRange: "10–15 mg/kg/dose", frequency: "BD", maxDose: "750 mg/day",
    notes: "Reserve for specific indications only. Avoid routine use — risk of tendinopathy." },
  { id: "pedi-cipro-1", enabled: true, medicineId: "ciprofloxacin", medicineName: "Ciprofloxacin",
    ageLabel: "6–12 years", minAgeMonths: 72, route: "Oral",
    doseRange: "250–500 mg/dose", frequency: "BD", maxDose: "1 g/day",
    notes: "Reserve for specific indications only. Avoid routine use — risk of tendinopathy." },

  // ── Cetirizine ──
  { id: "pedi-cetiri-0", enabled: true, medicineId: "cetirizine", medicineName: "Cetirizine",
    ageLabel: "2–5 years", minAgeMonths: 24, route: "Oral",
    doseRange: "2.5 mg/dose", frequency: "Once or twice daily", maxDose: "5 mg/day",
    notes: "" },
  { id: "pedi-cetiri-1", enabled: true, medicineId: "cetirizine", medicineName: "Cetirizine",
    ageLabel: "6–12 years", minAgeMonths: 72, route: "Oral",
    doseRange: "5 mg/dose", frequency: "Once daily", maxDose: "10 mg/day",
    notes: "May cause sedation — caution if school-age." },

  // ── Salbutamol ──
  { id: "pedi-salb-0", enabled: true, medicineId: "salbutamol", medicineName: "Salbutamol (Albuterol)",
    ageLabel: "0–1 year", minAgeMonths: 0, route: "Nebulised",
    doseRange: "0.15 mg/kg/dose (min 1.25 mg)", frequency: "4–6 hourly", maxDose: "5 mg/dose",
    notes: "Dilute to 2.5–3 mL with normal saline." },
  { id: "pedi-salb-1", enabled: true, medicineId: "salbutamol", medicineName: "Salbutamol (Albuterol)",
    ageLabel: "1–5 years", minAgeMonths: 12, route: "Nebulised",
    doseRange: "2.5 mg/dose", frequency: "4–6 hourly", maxDose: "10 mg/day",
    notes: "Continuous nebulisation may be used in severe acute asthma under monitoring." },
  { id: "pedi-salb-2", enabled: true, medicineId: "salbutamol", medicineName: "Salbutamol (Albuterol)",
    ageLabel: "6–12 years", minAgeMonths: 72, route: "Nebulised",
    doseRange: "2.5–5 mg/dose", frequency: "4–6 hourly", maxDose: "10 mg/day",
    notes: "" },

  // ── Prednisolone ──
  { id: "pedi-pred-0", enabled: true, medicineId: "prednisolone", medicineName: "Prednisolone",
    ageLabel: "1 month – 5 years", minAgeMonths: 1, route: "Oral",
    doseRange: "1–2 mg/kg/day", frequency: "Once daily (morning)", maxDose: "40 mg/day",
    notes: "Short course 3–5 days for croup/asthma. Taper if > 5 days." },
  { id: "pedi-pred-1", enabled: true, medicineId: "prednisolone", medicineName: "Prednisolone",
    ageLabel: "6–12 years", minAgeMonths: 72, route: "Oral",
    doseRange: "1–2 mg/kg/day", frequency: "Once daily (morning)", maxDose: "40 mg/day",
    notes: "Taper if course > 5 days. Monitor blood glucose in diabetic patients." },

  // ── Ondansetron ──
  { id: "pedi-onda-0", enabled: true, medicineId: "ondansetron", medicineName: "Ondansetron",
    ageLabel: "6 months – 12 years", minAgeMonths: 6, route: "Oral / IV",
    doseRange: "0.15 mg/kg/dose", frequency: "8 hourly (max 3 doses/day)", maxDose: "4 mg/dose",
    notes: "Avoid in hepatic impairment. QT-prolonging — check other medications." },

  // ── Omeprazole ──
  { id: "pedi-ome-0", enabled: true, medicineId: "omeprazole", medicineName: "Omeprazole",
    ageLabel: "1–2 years", minAgeMonths: 12, route: "Oral",
    doseRange: "0.5–1 mg/kg/day", frequency: "Once daily", maxDose: "20 mg/day",
    notes: "Take 30–60 min before meals." },
  { id: "pedi-ome-1", enabled: true, medicineId: "omeprazole", medicineName: "Omeprazole",
    ageLabel: "2–12 years", minAgeMonths: 24, route: "Oral",
    doseRange: "10–20 mg/day", frequency: "Once daily", maxDose: "20 mg/day",
    notes: "Take 30–60 min before meals. Reassess after 4–8 weeks." },

  // ── Furosemide ──
  { id: "pedi-furo-0", enabled: true, medicineId: "furosemide", medicineName: "Furosemide",
    ageLabel: "Neonate (0–28 days)", minAgeMonths: 0, route: "Oral / IV",
    doseRange: "0.5–1 mg/kg/dose", frequency: "12–24 hourly", maxDose: "2 mg/kg/day",
    notes: "Monitor electrolytes closely. Use with caution — risk of ototoxicity." },
  { id: "pedi-furo-1", enabled: true, medicineId: "furosemide", medicineName: "Furosemide",
    ageLabel: "1 month – 12 years", minAgeMonths: 1, route: "Oral",
    doseRange: "0.5–2 mg/kg/dose", frequency: "6–12 hourly", maxDose: "6 mg/kg/day",
    notes: "Monitor electrolytes (K⁺, Na⁺). Supplement potassium if prolonged use." },
];

export function loadPediRules(): PediDosingRule[] {
  try {
    const raw = localStorage.getItem(PEDI_DOSING_KEY);
    if (raw) return JSON.parse(raw) as PediDosingRule[];
  } catch { /**/ }
  return SEED_PEDI_RULES;
}

export function savePediRules(rules: PediDosingRule[]): void {
  try { localStorage.setItem(PEDI_DOSING_KEY, JSON.stringify(rules)); } catch { /**/ }
}

export function getPediRulesForMedicine(medicineId: string, rules: PediDosingRule[]): PediDosingRule[] {
  return rules
    .filter(r => r.enabled && r.medicineId === medicineId)
    .sort((a, b) => a.minAgeMonths - b.minAgeMonths);
}
