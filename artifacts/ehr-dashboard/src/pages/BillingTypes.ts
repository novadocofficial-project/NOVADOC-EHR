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

export const INITIAL_SERVICE_TYPES: ServiceType[] = [
  { id: "st-1", name: "Consultation", active: true, createdAt: new Date().toISOString() },
  { id: "st-2", name: "Lab", active: true, createdAt: new Date().toISOString() },
  { id: "st-3", name: "Procedures", active: true, createdAt: new Date().toISOString() },
  { id: "st-4", name: "Medicines", active: true, createdAt: new Date().toISOString() },
  { id: "st-5", name: "Consumables", active: true, createdAt: new Date().toISOString() },
];

export const INITIAL_SERVICES: Service[] = [
  { id: "svc-1", name: "General Consultation", serviceTypeId: "st-1", basePrice: 500, departmentId: "", subDepartmentId: "", active: true, taxable: false, createdAt: new Date().toISOString() },
  { id: "svc-2", name: "Specialist Consultation", serviceTypeId: "st-1", basePrice: 1200, departmentId: "", subDepartmentId: "", active: true, taxable: false, createdAt: new Date().toISOString() },
  { id: "svc-3", name: "Follow-up Consultation", serviceTypeId: "st-1", basePrice: 300, departmentId: "", subDepartmentId: "", active: true, taxable: false, createdAt: new Date().toISOString() },
  { id: "svc-4", name: "Complete Blood Count (CBC)", serviceTypeId: "st-2", basePrice: 450, departmentId: "", subDepartmentId: "", active: true, taxable: true, createdAt: new Date().toISOString() },
  { id: "svc-5", name: "Liver Function Test", serviceTypeId: "st-2", basePrice: 800, departmentId: "", subDepartmentId: "", active: true, taxable: true, createdAt: new Date().toISOString() },
  { id: "svc-6", name: "Blood Glucose (Fasting)", serviceTypeId: "st-2", basePrice: 200, departmentId: "", subDepartmentId: "", active: true, taxable: true, createdAt: new Date().toISOString() },
  { id: "svc-7", name: "Echocardiogram", serviceTypeId: "st-3", basePrice: 3500, departmentId: "", subDepartmentId: "", active: true, taxable: true, createdAt: new Date().toISOString() },
  { id: "svc-8", name: "X-Ray Chest", serviceTypeId: "st-3", basePrice: 900, departmentId: "", subDepartmentId: "", active: true, taxable: true, createdAt: new Date().toISOString() },
  { id: "svc-9", name: "Knee Arthroscopy", serviceTypeId: "st-3", basePrice: 25000, departmentId: "", subDepartmentId: "", active: true, taxable: true, createdAt: new Date().toISOString() },
  { id: "svc-10", name: "Paracetamol 500mg", serviceTypeId: "st-4", basePrice: 50, departmentId: "", subDepartmentId: "", active: true, taxable: false, createdAt: new Date().toISOString() },
  { id: "svc-11", name: "Amoxicillin 250mg", serviceTypeId: "st-4", basePrice: 120, departmentId: "", subDepartmentId: "", active: true, taxable: false, createdAt: new Date().toISOString() },
  { id: "svc-12", name: "Surgical Gloves (pair)", serviceTypeId: "st-5", basePrice: 80, departmentId: "", subDepartmentId: "", active: true, taxable: true, createdAt: new Date().toISOString() },
  { id: "svc-13", name: "IV Cannula", serviceTypeId: "st-5", basePrice: 150, departmentId: "", subDepartmentId: "", active: true, taxable: true, createdAt: new Date().toISOString() },
];
