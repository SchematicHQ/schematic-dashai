import { SchematicClient } from "@schematichq/schematic-typescript-node";

import { Invoices } from "@/components/invoices";
import { PaymentMethod } from "@/components/payment-method";
import { getCheckoutApi } from "@/lib/checkout";
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
  const [companyResponse, checkoutApi] = await Promise.all([
    schematic.companies.lookupCompany({ keys: COMPANY_LOOKUP }),
    getCheckoutApi(),
  ]);
  const { data: invoices } = await checkoutApi.listInvoices();

  const company = companyResponse.data;
  const defaultPaymentMethod =
    company.billingSubscription?.paymentMethod ?? company.defaultPaymentMethod;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col gap-4 max-w-xl pt-16">
          <PaymentMethod
            paymentMethod={defaultPaymentMethod}
            paymentMethods={company.paymentMethods}
          />

          <Invoices invoices={invoices} />
        </div>
      </div>
    </div>
  );
}
