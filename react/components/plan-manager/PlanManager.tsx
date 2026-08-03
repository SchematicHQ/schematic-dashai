import type { ReactNode } from "react";
import Link from "next/link";

import type {
  CompanyDetailResponseData,
  ComponentDisplaySettings,
  CreditCompanyGrantView,
  FeatureUsageResponseData,
} from "@/components/api/checkoutexternal";
import {
  formatCurrency,
  getAutoTopupAmount,
  getAutoTopupThresholdCredits,
  getFeatureName,
  getSubscriptionPeriod,
  isAutoTopupEnabled,
  isSelfServiceAutoTopupAvailable,
  shortenPeriod,
  toPrettyDate,
} from "@/components/utils";
import { AddOn } from "./AddOn";
import { Notice } from "./Notice";
import { UsageDetails } from "./UsageDetails";
import {
  getCustomPlanBilling,
  getTrialEnd,
  groupCreditsByReason,
} from "./utils";

interface PlanManagerProps {
  company: CompanyDetailResponseData;
  featureUsage?: FeatureUsageResponseData[];
  creditGrants?: CreditCompanyGrantView[];
  displaySettings?: Partial<ComponentDisplaySettings>;
  // trial copy, which describes the plan group rather than the company
  trialPaymentMethodRequired?: boolean;
  postTrialPlanName?: string;
  // where "change plan" and the auto top-up controls send the company
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
  const scheduledDowngrade = company.scheduledDowngrade;

  const {
    showCredits = true,
    showHardLimit = true,
    showZeroPriceAsFree = true,
  } = displaySettings;

  const usageBasedEntitlements = featureUsage.filter(
    (usage) => typeof usage.priceBehavior === "string",
  );
  const creditGroups = groupCreditsByReason(creditGrants);

  const subscriptionInterval =
    getSubscriptionPeriod(billingSubscription) ?? billingSubscription?.interval;
  const subscriptionCurrency = billingSubscription?.currency;
  const currentPlanPeriod =
    getSubscriptionPeriod(billingSubscription) ??
    currentPlan?.planPeriod ??
    undefined;
  const planPeriodLabel = currentPlanPeriod
    ? shortenPeriod(currentPlanPeriod)
    : undefined;

  const isTrialSubscription = billingSubscription?.status === "trialing";
  const willSubscriptionCancel =
    typeof billingSubscription?.cancelAt === "number" &&
    billingSubscription.cancelAtPeriodEnd;

  // a free plan whose value comes from metered entitlements is priced by usage
  // rather than by the plan itself
  const isFreePlan = currentPlan?.planPrice === 0;
  const isUsageBasedPlan = isFreePlan && usageBasedEntitlements.length > 0;

  const trialEnd = getTrialEnd(billingSubscription);
  const customPlanBilling = getCustomPlanBilling(company);
  const selfServiceAutoTopupGrants = (
    currentPlan?.includedCreditGrants ?? []
  ).filter((grant) => grant.credit && isSelfServiceAutoTopupAvailable(grant));

  return (
    <div className="flex flex-col gap-4">
      {isTrialSubscription && !willSubscriptionCancel ? (
        <Notice
          title={
            typeof trialEnd.amount === "number"
              ? `Trial ends in ${trialEnd.amount} ${trialEnd.units}`
              : "Trial in progress"
          }
        >
          {trialPaymentMethodRequired ? (
            <p className="text-sm text-muted-foreground">
              After the trial, subscription starts and you will be billed.
            </p>
          ) : postTrialPlanName ? (
            <p className="text-sm text-muted-foreground">
              After the trial, you will be downgraded to the {postTrialPlanName}{" "}
              plan and your subscription will be cancelled. You will not be
              charged unless you subscribe to a paid plan during the trial.
            </p>
          ) : (
            currentPlan && (
              <p className="text-sm text-muted-foreground">
                After the trial, you will lose access to the {currentPlan.name}{" "}
                plan and your subscription will be cancelled. You will not be
                charged unless you subscribe to a paid plan during the trial.
              </p>
            )
          )}
        </Notice>
      ) : willSubscriptionCancel ? (
        <Notice title="Subscription canceled">
          {typeof billingSubscription?.cancelAt === "number" && (
            <p className="text-sm text-muted-foreground">
              Access to {currentPlan?.name || "plan"} will end on{" "}
              {toPrettyDate(new Date(billingSubscription.cancelAt * 1000), {
                month: "numeric",
              })}
              .
            </p>
          )}
        </Notice>
      ) : customPlanBilling ? (
        <Notice
          title={
            customPlanBilling.isAwaitingActivation
              ? `Pay to activate ${customPlanBilling.planName ?? "your plan"}`
              : `Pay by ${toPrettyDate(customPlanBilling.deadline, { month: "numeric" })} to keep ${customPlanBilling.planName ?? "your plan"}`
          }
        >
          <p className="text-sm text-muted-foreground">
            {customPlanBilling.isAwaitingActivation
              ? `Pay the invoice to activate your custom plan. Due by ${toPrettyDate(customPlanBilling.deadline, { month: "numeric" })}.`
              : `Access to ${customPlanBilling.planName ?? "your plan"} will end on ${toPrettyDate(customPlanBilling.deadline, { month: "numeric" })} unless the invoice is paid.`}
          </p>

          {customPlanBilling.billing.stripeInvoiceUrl && (
            <a
              href={customPlanBilling.billing.stripeInvoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium leading-none text-accent transition-all hover:underline"
            >
              Pay now
            </a>
          )}
        </Notice>
      ) : (
        scheduledDowngrade?.toPlanName && (
          <Notice
            title={`Downgrade to ${scheduledDowngrade.toPlanName} scheduled`}
          >
            {typeof billingSubscription?.periodEnd === "number" && (
              <p className="text-sm text-muted-foreground">
                Access to {scheduledDowngrade.fromPlanName} will end on{" "}
                {toPrettyDate(new Date(billingSubscription.periodEnd * 1000), {
                  month: "numeric",
                })}
                .
              </p>
            )}
          </Notice>
        )
      )}

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
            {creditGroups.plan.map((group) => {
              const grant = currentPlan?.includedCreditGrants.find(
                ({ creditId }) => creditId === group.id,
              );
              const thresholdCredits = getAutoTopupThresholdCredits(grant);
              const topupAmount = getAutoTopupAmount(grant);
              const hasAutoTopupNotice =
                isAutoTopupEnabled(grant) &&
                typeof thresholdCredits === "number" &&
                typeof topupAmount === "number";

              return (
                <div
                  key={group.id}
                  className="flex justify-between items-baseline flex-wrap gap-2"
                >
                  <span className="font-medium">
                    {group.total.value}{" "}
                    {getFeatureName(group, group.total.value)}
                    {subscriptionInterval && <> per {subscriptionInterval}</>}
                  </span>

                  {group.total.used > 0 && (
                    <span
                      className="text-sm text-muted-foreground"
                      title={
                        hasAutoTopupNotice
                          ? `When credit balance reaches ${thresholdCredits} remaining, an auto top-up of ${topupAmount} credits will be processed.`
                          : undefined
                      }
                    >
                      {group.total.used} used
                      {hasAutoTopupNotice && " (auto top-up on)"}
                    </span>
                  )}
                </div>
              );
            })}

            {selfServiceAutoTopupGrants.length > 0 && (
              <div className="flex justify-between items-center gap-2 rounded-lg bg-border/40 p-6">
                <div className="flex flex-col gap-2">
                  <span className="font-medium">Auto top-up</span>

                  {selfServiceAutoTopupGrants.map((grant) => {
                    const credit = grant.credit;
                    if (!credit) {
                      return null;
                    }

                    const thresholdCredits =
                      getAutoTopupThresholdCredits(grant);
                    const topupAmount = getAutoTopupAmount(grant);

                    if (!grant.companyAutoTopupEnabled) {
                      return (
                        <span
                          key={grant.id}
                          className="text-sm text-muted-foreground"
                        >
                          Auto top-up disabled for {getFeatureName(credit, 1)}
                        </span>
                      );
                    }

                    if (
                      typeof thresholdCredits !== "number" ||
                      typeof topupAmount !== "number"
                    ) {
                      return null;
                    }

                    return (
                      <span
                        key={grant.id}
                        className="text-sm text-muted-foreground"
                      >
                        Adds {topupAmount} {getFeatureName(credit, topupAmount)}{" "}
                        when {thresholdCredits} remaining in balance
                      </span>
                    );
                  })}
                </div>

                <Link
                  href={changePlanHref}
                  className="font-medium leading-none text-accent transition-all hover:underline"
                >
                  Edit
                </Link>
              </div>
            )}
          </Section>
        )}

        {creditGroups.bundles.length > 0 && (
          <Section label="Credit bundles">
            {creditGroups.bundles.map((group) => (
              <div
                key={group.id}
                className="flex justify-between items-center flex-wrap gap-2"
              >
                <span className="font-medium">
                  {group.grants.length > 1 && (
                    <span className="text-muted-foreground">
                      ({group.grants.length}){" "}
                    </span>
                  )}
                  {group.total.value} {getFeatureName(group, group.total.value)}
                </span>

                {group.total.used > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {group.total.used} used
                  </span>
                )}
              </div>
            ))}
          </Section>
        )}

        {creditGroups.promotional.length > 0 && (
          <Section label="Promotional credits">
            {creditGroups.promotional.map((group) => (
              <div
                key={group.id}
                className="flex justify-between items-center flex-wrap gap-2"
              >
                <span className="font-medium">
                  {group.total.value} {getFeatureName(group, group.total.value)}
                </span>

                {group.total.used > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {group.total.used} used
                  </span>
                )}
              </div>
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

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted-foreground leading-none">{label}</span>

      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
