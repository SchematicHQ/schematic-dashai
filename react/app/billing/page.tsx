import { Invoices } from "@/components/invoices";
import { PaymentMethod } from "@/components/payment-method";
import { PlanManager } from "@/components/plan-manager";
import { getCheckoutApi } from "@/lib/checkout";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!process.env.SCHEMATIC_SECRET_KEY) {
    return (
      <div className="min-h-screen bg-background text-white p-6">
        No Schematic key
      </div>
    );
  }

  const checkoutApi = await getCheckoutApi();
  const [{ data: hydrated }, { data: invoices }] = await Promise.all([
    checkoutApi.hydrate(),
    checkoutApi.listInvoices(),
  ]);

  const company = hydrated.company;
  if (!company) {
    return (
      <div className="min-h-screen bg-background text-white p-6">
        No company
      </div>
    );
  }

  const defaultPaymentMethod =
    company.billingSubscription?.paymentMethod ?? company.defaultPaymentMethod;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col gap-4 max-w-xl pt-16">
          <PlanManager
            company={company}
            featureUsage={hydrated.featureUsage?.features}
            creditGrants={hydrated.creditGrants}
            displaySettings={hydrated.displaySettings}
            trialPaymentMethodRequired={
              hydrated.trialPaymentMethodRequired ?? false
            }
            postTrialPlanName={hydrated.postTrialPlan?.name}
          />

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
