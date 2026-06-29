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
  providerPrices: Record<string, number>;
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

export type RateList = {
  pharmacyPartnerId:   string | null;
  labProviderId:       string | null;
  consumableProviderId: string | null;
  procedurePartnerId:  string | null;
  imagingPartnerId:    string | null;
  vaccinePartnerId:    string | null;
  doctorIds:           string[];
};

export function blankRateList(): RateList {
  return { pharmacyPartnerId: null, labProviderId: null, consumableProviderId: null, procedurePartnerId: null, imagingPartnerId: null, vaccinePartnerId: null, doctorIds: [] };
}

export type ItemOverride = {
  priceOverride: string;
  active: boolean;
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
  rateList: RateList;
  itemOverrides?: Record<string, ItemOverride>;
  createdAt: string;
};

const D = "2024-01-01T00:00:00.000Z";

export const INITIAL_SERVICE_TYPES: ServiceType[] = [
  { id: "st-1", name: "Consultation",        active: true, createdAt: D },
  { id: "st-2", name: "Lab",                 active: true, createdAt: D },
  { id: "st-3", name: "Procedure",  active: true, createdAt: D },
  { id: "st-4", name: "Formulary",           active: true, createdAt: D },
  { id: "st-5", name: "Consumables",         active: true, createdAt: D },
  { id: "st-6", name: "Imaging",             active: true, createdAt: D },
  { id: "st-7", name: "Vaccine",             active: true, createdAt: D },
];

export const INITIAL_SERVICES: Service[] = [];
