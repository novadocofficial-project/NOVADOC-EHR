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

export const INITIAL_SERVICES: Service[] = [];
