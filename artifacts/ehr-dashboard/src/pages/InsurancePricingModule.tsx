import { CorporatePricingModule } from "@/pages/CorporatePricingModule";
import type { ServiceType, Service } from "@/pages/BillingTypes";

export function InsurancePricingModule({
  serviceTypes,
  services,
}: {
  serviceTypes: ServiceType[];
  services: Service[];
}) {
  return (
    <CorporatePricingModule
      serviceTypes={serviceTypes}
      services={services}
      entityLabel="Insurance"
    />
  );
}
