export type ServiceType = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
};

export type Service = {
  id: string;
  name: string;
  serviceTypeId: string;
  basePrice: number;
  departmentId: string;
  subDepartmentId: string;
  active: boolean;
  taxable: boolean;
  createdAt: string;
};

export type PricingRule = {
  type: "percentage" | "fixed";
  value: number;
};

export type EntityService = {
  serviceId: string;
  price: number;
  overridden: boolean;
};

export type BillingEntity = {
  id: string;
  name: string;
  contactPerson: string;
  contactPhone: string;
  email: string;
  mouFileName: string;
  creditEnabled: boolean;
  creditLimit: number;
  useBaseForNew: boolean;
  pricingRules: Record<string, PricingRule>;
  entityServices: EntityService[];
  createdAt: string;
};

const D = "2024-01-01T00:00:00.000Z";

export const INITIAL_SERVICE_TYPES: ServiceType[] = [
  { id: "st-1", name: "Consultation",        active: true, createdAt: D },
  { id: "st-2", name: "Lab",                 active: true, createdAt: D },
  { id: "st-3", name: "Nursing Procedures",  active: true, createdAt: D },
  { id: "st-4", name: "Pharmacy",            active: true, createdAt: D },
  { id: "st-5", name: "Consumables",         active: true, createdAt: D },
  { id: "st-6", name: "Imaging",             active: true, createdAt: D },
];

export const INITIAL_SERVICES: Service[] = [
  // ── Consultation ──────────────────────────────────────────────────────────
  { id: "svc-1",  name: "General Consultation",       serviceTypeId: "st-1", basePrice: 500,   departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-2",  name: "Specialist Consultation",    serviceTypeId: "st-1", basePrice: 1200,  departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-3",  name: "Follow-up Consultation",     serviceTypeId: "st-1", basePrice: 300,   departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-4",  name: "Emergency Consultation",     serviceTypeId: "st-1", basePrice: 2000,  departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-5",  name: "Tele-Consultation",          serviceTypeId: "st-1", basePrice: 400,   departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-6",  name: "Pediatric Consultation",     serviceTypeId: "st-1", basePrice: 800,   departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-7",  name: "Psychiatric Consultation",   serviceTypeId: "st-1", basePrice: 1500,  departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },

  // ── Lab ───────────────────────────────────────────────────────────────────
  { id: "svc-10", name: "Complete Blood Count (CBC)", serviceTypeId: "st-2", basePrice: 450,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-11", name: "Liver Function Test (LFT)",  serviceTypeId: "st-2", basePrice: 800,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-12", name: "Blood Glucose (Fasting)",    serviceTypeId: "st-2", basePrice: 200,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-13", name: "Thyroid Function Test (TFT)",serviceTypeId: "st-2", basePrice: 1200,  departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-14", name: "HbA1c (Glycated Hb)",        serviceTypeId: "st-2", basePrice: 950,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-15", name: "Lipid Profile",               serviceTypeId: "st-2", basePrice: 700,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-16", name: "Urine Complete Examination",  serviceTypeId: "st-2", basePrice: 300,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-17", name: "Serology (HBsAg / Anti-HCV)",serviceTypeId: "st-2", basePrice: 600,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-18", name: "Renal Function Test (RFT)",   serviceTypeId: "st-2", basePrice: 650,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-19", name: "Blood Culture & Sensitivity", serviceTypeId: "st-2", basePrice: 1500,  departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },

  // ── Nursing Procedures ────────────────────────────────────────────────────
  { id: "svc-30", name: "Echocardiogram",              serviceTypeId: "st-3", basePrice: 3500,  departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-32", name: "Knee Arthroscopy",            serviceTypeId: "st-3", basePrice: 25000, departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-36", name: "Upper GI Endoscopy",          serviceTypeId: "st-3", basePrice: 6000,  departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-37", name: "Wound Dressing (Minor)",      serviceTypeId: "st-3", basePrice: 500,   departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-38", name: "ECG (12-lead)",               serviceTypeId: "st-3", basePrice: 700,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-39", name: "Spirometry",                  serviceTypeId: "st-3", basePrice: 1500,  departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-41", name: "IV Infusion (per hour)",      serviceTypeId: "st-3", basePrice: 800,   departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-42", name: "Nebulisation",                serviceTypeId: "st-3", basePrice: 350,   departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-43", name: "Suture Removal",              serviceTypeId: "st-3", basePrice: 400,   departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },

  // ── Imaging ───────────────────────────────────────────────────────────────
  { id: "svc-31", name: "X-Ray Chest (PA View)",               serviceTypeId: "st-6", basePrice: 900,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-33", name: "Ultrasound Abdomen & Pelvis",         serviceTypeId: "st-6", basePrice: 2000,  departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-34", name: "MRI Brain (with contrast)",           serviceTypeId: "st-6", basePrice: 12000, departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-35", name: "CT Chest (with contrast)",            serviceTypeId: "st-6", basePrice: 8500,  departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-60", name: "Mammography (bilateral)",             serviceTypeId: "st-6", basePrice: 3500,  departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-61", name: "Bone Densitometry (DEXA)",            serviceTypeId: "st-6", basePrice: 4000,  departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-62", name: "PET-CT Scan (whole body)",            serviceTypeId: "st-6", basePrice: 45000, departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-63", name: "Doppler Ultrasound (lower limb)",     serviceTypeId: "st-6", basePrice: 3000,  departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-64", name: "Fluoroscopy (barium swallow)",        serviceTypeId: "st-6", basePrice: 5500,  departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-65", name: "MRI Spine (Lumbar)",                  serviceTypeId: "st-6", basePrice: 10000, departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-66", name: "CT Abdomen & Pelvis (plain)",         serviceTypeId: "st-6", basePrice: 7000,  departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },

  // ── Pharmacy ──────────────────────────────────────────────────────────────
  { id: "svc-50", name: "Paracetamol 500mg (strip)",  serviceTypeId: "st-4", basePrice: 50,    departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-51", name: "Amoxicillin 250mg (strip)",  serviceTypeId: "st-4", basePrice: 120,   departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-52", name: "Metformin 500mg (strip)",    serviceTypeId: "st-4", basePrice: 80,    departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-53", name: "Omeprazole 20mg (strip)",    serviceTypeId: "st-4", basePrice: 95,    departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-54", name: "Azithromycin 500mg (strip)", serviceTypeId: "st-4", basePrice: 180,   departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-55", name: "Atorvastatin 20mg (strip)",  serviceTypeId: "st-4", basePrice: 150,   departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-56", name: "Ibuprofen 400mg (strip)",    serviceTypeId: "st-4", basePrice: 70,    departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-57", name: "Amlodipine 5mg (strip)",     serviceTypeId: "st-4", basePrice: 110,   departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },
  { id: "svc-58", name: "Cefixime 400mg (strip)",     serviceTypeId: "st-4", basePrice: 220,   departmentId: "", subDepartmentId: "", active: true,  taxable: false, createdAt: D },

  // ── Consumables ───────────────────────────────────────────────────────────
  { id: "svc-70", name: "Surgical Gloves (pair)",     serviceTypeId: "st-5", basePrice: 80,    departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-71", name: "IV Cannula (18G)",           serviceTypeId: "st-5", basePrice: 150,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-72", name: "Syringe 5ml",               serviceTypeId: "st-5", basePrice: 25,    departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-73", name: "Bandage Roll (4-inch)",      serviceTypeId: "st-5", basePrice: 60,    departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-74", name: "Nebulizer Mask (adult)",     serviceTypeId: "st-5", basePrice: 180,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-75", name: "Face Mask N95",              serviceTypeId: "st-5", basePrice: 120,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-76", name: "Urinary Catheter (Fr16)",    serviceTypeId: "st-5", basePrice: 350,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-77", name: "Nasogastric Tube (Fr16)",    serviceTypeId: "st-5", basePrice: 280,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
  { id: "svc-78", name: "Oxygen Mask (simple)",       serviceTypeId: "st-5", basePrice: 200,   departmentId: "", subDepartmentId: "", active: true,  taxable: true,  createdAt: D },
];
