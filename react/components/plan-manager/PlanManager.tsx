import Link from "next/link";

import {
  type CompanyDetailResponseData,
  type ComponentDisplaySettings,
  type CreditCompanyGrantView,
  type FeatureUsageResponseData,
} from "@/components/api/checkoutexternal";
import {
  formatCurrency,
  getSubscriptionPeriod,
  shortenPeriod,
} from "@/components/utils";
import { Section } from "./layout";
import { AddOn } from "./AddOn";
import { AutoTopupCard } from "./AutoTopupCard";
import { CreditGroupRow } from "./CreditGroupRow";
import { StatusNotice } from "./StatusNotice";
import { UsageDetails } from "./UsageDetails";
import {
  getAutoTopupNotice,
  getCustomPlanBilling,
  groupCreditsByReason,
} from "./utils";

interface PlanManagerProps {
  company: CompanyDetailResponseData;
  featureUsage?: FeatureUsageResponseData[];
  creditGrants?: CreditCompanyGrantView[];
  displaySettings?: Partial<ComponentDisplaySettings>;
  trialPaymentMethodRequired?: boolean;
  postTrialPlanName?: string;
  changePlanHref?: string;
}

export function PlanManager({
  company,
  featureUsage = [],
  creditGrants = [],
  displaySettings = {},
  trialPaymentMethodRequired = false,
  postTrialPlanName,
  changePlanHref = "/pricing",
}: PlanManagerProps) {
  const currentPlan = company.plan;
  const addOns = company.addOns;
  const billingSubscription = company.billingSubscription;

  const {
    showCredits = true,
    showHardLimit = true,
    showZeroPriceAsFree = true,
  } = displaySettings;

  const usageBasedEntitlements = featureUsage.filter(
    (usage) => typeof usage.priceBehavior === "string",
  );
  const creditGroups = groupCreditsByReason(creditGrants);

  const subscriptionCurrency = billingSubscription?.currency;

  const subscriptionPeriod = getSubscriptionPeriod(billingSubscription);
  const currentPlanPeriod =
    subscriptionPeriod ?? currentPlan?.planPeriod ?? undefined;
  const planPeriodLabel = currentPlanPeriod
    ? shortenPeriod(currentPlanPeriod)
    : undefined;

  const isFreePlan = currentPlan?.planPrice === 0;
  const isUsageBasedPlan = isFreePlan && usageBasedEntitlements.length > 0;

  const customPlanBilling = getCustomPlanBilling(company);

  return (
    <div className="flex flex-col gap-4">
      <StatusNotice
        company={company}
        customPlanBilling={customPlanBilling}
        trialPaymentMethodRequired={trialPaymentMethodRequired}
        postTrialPlanName={postTrialPlanName}
      />

      <div className="flex flex-col gap-8 text-white border border-border bg-card rounded-xl p-6 shadow-2xl">
        {currentPlan && (
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-bold leading-none tracking-tight">
                {currentPlan.name}
              </h2>

              {currentPlan.description && (
                <p className="text-muted-foreground">
                  {currentPlan.description}
                </p>
              )}
            </div>

            {typeof currentPlan.planPrice === "number" && (
              <div className="text-2xl font-semibold tracking-tight text-nowrap">
                {isUsageBasedPlan
                  ? "Usage-based"
                  : isFreePlan && showZeroPriceAsFree
                    ? "Free"
                    : formatCurrency(
                        currentPlan.planPrice,
                        subscriptionCurrency,
                      )}

                {!isFreePlan && planPeriodLabel && (
                  <sub className="text-base font-normal text-muted-foreground">
                    /{planPeriodLabel}
                  </sub>
                )}
              </div>
            )}
          </div>
        )}

        {addOns.length > 0 && (
          <Section label="Add-ons">
            {addOns.map((addOn) => (
              <AddOn
                key={addOn.id}
                addOn={addOn}
                currency={subscriptionCurrency}
                period={currentPlanPeriod}
              />
            ))}
          </Section>
        )}

        {usageBasedEntitlements.length > 0 && (
          <Section label="Usage-based">
            {usageBasedEntitlements.map((entitlement, index) => (
              <UsageDetails
                key={entitlement.feature?.id ?? index}
                entitlement={entitlement}
                period={currentPlanPeriod || "month"}
                currency={subscriptionCurrency}
                showCredits={showCredits}
                showHardLimit={showHardLimit}
              />
            ))}
          </Section>
        )}

        {showCredits && creditGroups.plan.length > 0 && (
          <Section label="Credits in plan">
            {creditGroups.plan.map((group) => (
              <CreditGroupRow
                key={group.id}
                group={group}
                per={subscriptionPeriod}
                autoTopup={getAutoTopupNotice(
                  currentPlan?.includedCreditGrants.find(
                    ({ creditId }) => creditId === group.id,
                  ),
                )}
              />
            ))}

            <AutoTopupCard
              grants={currentPlan?.includedCreditGrants ?? []}
              editHref={changePlanHref}
            />
          </Section>
        )}

        {creditGroups.bundles.length > 0 && (
          <Section label="Credit bundles">
            {creditGroups.bundles.map((group) => (
              <CreditGroupRow key={group.id} group={group} showGrantCount />
            ))}
          </Section>
        )}

        {creditGroups.promotional.length > 0 && (
          <Section label="Promotional credits">
            {creditGroups.promotional.map((group) => (
              <CreditGroupRow key={group.id} group={group} />
            ))}
          </Section>
        )}

        {!customPlanBilling?.isAwaitingActivation && (
          <Link
            href={changePlanHref}
            className="flex justify-center w-full p-4 text-lg font-medium leading-none text-white bg-accent border border-accent rounded-lg transition-all"
          >
            Change plan
          </Link>
        )}
      </div>
    </div>
  );
}
