import { SchematicClient } from "@schematichq/schematic-typescript-node";

import { PaymentMethod } from "@/components/payment-method";
import { COMPANY_LOOKUP } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function Page() {
  const apiKey = process.env.SCHEMATIC_SECRET_KEY;
  if (!apiKey) {
    return (
      <div className="min-h-screen bg-background text-white p-6">
        No Schematic key
      </div>
    );
  }

  const schematic = new SchematicClient({ apiKey });
  const companyResponse = await schematic.companies.lookupCompany({
    keys: COMPANY_LOOKUP,
  });

  const company = companyResponse.data;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="max-w-xl pt-16">
          <PaymentMethod
            paymentMethod={company.defaultPaymentMethod}
            paymentMethods={company.paymentMethods}
          />
        </div>
      </div>
    </div>
  );
}
