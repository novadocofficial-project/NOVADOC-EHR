export interface BundleItem {
  medicineId:  string;
  brandId:     string;
  brand:       string;
  strength:    string;
  genericName: string;
  dose:        string;
  unit:        string;
  route:       string;
  frequency:   string;
  duration:    string;
}

export interface FormularyBundle {
  id:          string;
  name:        string;
  description: string;
  enabled:     boolean;
  items:       BundleItem[];
}

export const BUNDLES_KEY = "ehr-formulary-bundles-v1";

export const SEED_BUNDLES: FormularyBundle[] = [
  {
    id: "bundle-htn",
    name: "Hypertension Bundle",
    description: "First-line antihypertensive + statin regimen",
    enabled: true,
    items: [
      { medicineId: "amlodipine",   brandId: "norvasc-5",  brand: "Norvasc",  strength: "5mg",  genericName: "Amlodipine",   dose: "1", unit: "tablet(s)",  route: "Oral", frequency: "Once daily (OD)", duration: "Ongoing" },
      { medicineId: "lisinopril",   brandId: "zestril-10", brand: "Zestril",  strength: "10mg", genericName: "Lisinopril",   dose: "1", unit: "tablet(s)",  route: "Oral", frequency: "Once daily (OD)", duration: "Ongoing" },
      { medicineId: "atorvastatin", brandId: "lipitor-20", brand: "Lipitor",  strength: "20mg", genericName: "Atorvastatin", dose: "1", unit: "tablet(s)",  route: "Oral", frequency: "Once daily (OD)", duration: "Ongoing" },
    ],
  },
  {
    id: "bundle-uri",
    name: "Upper Respiratory Infection",
    description: "Antibiotic + antipyretic + antihistamine for URI",
    enabled: true,
    items: [
      { medicineId: "amoxicillin", brandId: "amoxil-500",  brand: "Amoxil",  strength: "500mg", genericName: "Amoxicillin", dose: "1", unit: "capsule(s)", route: "Oral", frequency: "Three times daily (TID)", duration: "7 days" },
      { medicineId: "paracetamol", brandId: "panadol-500", brand: "Panadol", strength: "500mg", genericName: "Paracetamol", dose: "2", unit: "tablet(s)",  route: "Oral", frequency: "Three times daily (TID)", duration: "5 days" },
      { medicineId: "cetirizine",  brandId: "zyrtec-10",   brand: "Zyrtec",  strength: "10mg",  genericName: "Cetirizine",  dose: "1", unit: "tablet(s)",  route: "Oral", frequency: "Once daily (OD)",       duration: "5 days" },
    ],
  },
  {
    id: "bundle-gastritis",
    name: "Gastritis / GERD Bundle",
    description: "PPI + antiemetic cover for acute gastritis",
    enabled: true,
    items: [
      { medicineId: "omeprazole",    brandId: "losec-20",   brand: "Losec",  strength: "20mg",  genericName: "Omeprazole",    dose: "1", unit: "capsule(s)", route: "Oral", frequency: "Twice daily (BID)",        duration: "14 days" },
      { medicineId: "ondansetron",   brandId: "zofran-4",   brand: "Zofran", strength: "4mg",   genericName: "Ondansetron",   dose: "1", unit: "tablet(s)",  route: "Oral", frequency: "Three times daily (TID)",  duration: "5 days"  },
      { medicineId: "metronidazole", brandId: "flagyl-400", brand: "Flagyl", strength: "400mg", genericName: "Metronidazole", dose: "1", unit: "tablet(s)",  route: "Oral", frequency: "Three times daily (TID)",  duration: "7 days"  },
    ],
  },
];

export function loadBundles(): FormularyBundle[] {
  try {
    const raw = localStorage.getItem(BUNDLES_KEY);
    if (raw) return JSON.parse(raw) as FormularyBundle[];
  } catch { /**/ }
  return SEED_BUNDLES;
}

export function saveBundles(bundles: FormularyBundle[]): void {
  try { localStorage.setItem(BUNDLES_KEY, JSON.stringify(bundles)); } catch { /**/ }
}

export function loadEnabledBundles(): FormularyBundle[] {
  return loadBundles().filter(b => b.enabled);
}
