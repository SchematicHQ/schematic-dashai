import { SchematicClient } from "@schematichq/schematic-typescript-node";

import { Invoices } from "@/components/invoices";
import { PaymentMethod } from "@/components/payment-method";
import { PlanManager } from "@/components/plan-manager";
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
  const [companyResponse, usageResponse, planGroupResponse] = await Promise.all(
    [
      schematic.companies.lookupCompany({ keys: COMPANY_LOOKUP }),
      schematic.entitlements.getFeatureUsageByCompany({ keys: COMPANY_LOOKUP }),
      schematic.plangroups.getPlanGroup(),
    ],
  );

  const company = companyResponse.data;
  // invoices are listed per subscription, so there is nothing to fetch until
  // the company has one.
  const subscription = company.billingSubscription;
  const [{ data: creditGrants }, invoicesResponse] = await Promise.all([
    schematic.credits.listCompanyGrants({ companyId: company.id }),
    subscription &&
      schematic.billing.listInvoices({
        companyId: company.id,
        customerExternalId: subscription.customerExternalId,
        subscriptionExternalId: subscription.subscriptionExternalId,
      }),
  ]);
  const invoices = invoicesResponse ? invoicesResponse.data : undefined;

  const defaultPaymentMethod =
    subscription?.paymentMethod ?? company.defaultPaymentMethod;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col gap-4 max-w-xl pt-16">
          <PlanManager
            company={company}
            featureUsage={usageResponse.data.features}
            creditGrants={creditGrants}
            displaySettings={planGroupResponse.data.componentSettings}
            trialPaymentMethodRequired={
              planGroupResponse.data.trialPaymentMethodRequired
            }
            postTrialPlanName={planGroupResponse.data.trialExpiryPlan?.name}
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
