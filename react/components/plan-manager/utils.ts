import {
  BillingCreditGrantReason,
  CustomPlanActivationStrategy,
  CustomPlanBillingStatus,
  type BillingSubscriptionView,
  type CompanyDetailResponseData,
  type CreditCompanyGrantView,
  type CustomPlanBillingResponseData,
} from "@/components/api/checkoutexternal";
import type { CreditWithCompanyContext } from "@/components/types";
import { groupCreditGrants, modifyDate, pluralize } from "@/components/utils";

const SECONDS_IN_MS = 1000;
const MINUTES_IN_MS = 60 * SECONDS_IN_MS;
const HOURS_IN_MS = 60 * MINUTES_IN_MS;
const DAYS_IN_MS = 24 * HOURS_IN_MS;

export interface TrialEnd {
  endDate?: Date;
  amount?: number;
  units?: string;
}

/**
 * Counts down to the end of a trial in whichever unit still reads naturally —
 * days until the last day, then hours, then minutes.
 */
export function getTrialEnd(
  billingSubscription?: BillingSubscriptionView,
): TrialEnd {
  if (typeof billingSubscription?.trialEnd !== "number") {
    return {};
  }

  const endDate = new Date(billingSubscription.trialEnd * 1000);
  const difference = endDate.getTime() - Date.now();

  let amount: number;
  let unit: string;

  if (difference >= DAYS_IN_MS) {
    amount = Math.floor(difference / DAYS_IN_MS);
    unit = "day";
  } else if (difference >= HOURS_IN_MS) {
    amount = Math.floor(difference / HOURS_IN_MS);
    unit = "hour";
  } else if (difference >= MINUTES_IN_MS) {
    amount = Math.floor(difference / MINUTES_IN_MS);
    unit = "minute";
  } else {
    amount = Math.floor(difference / SECONDS_IN_MS);
    unit = "second";
  }

  return { endDate, amount, units: pluralize(unit, amount) };
}

export interface CustomPlanBilling {
  billing: CustomPlanBillingResponseData;
  planName?: string;
  deadline: Date;
  isAwaitingActivation: boolean;
  isAwaitingPayment: boolean;
}

/**
 * The most recent unpaid custom plan invoice, if there is one. Whether the plan
 * is already active or only starts on payment depends on its activation
 * strategy, which changes what the company needs to be told.
 */
export function getCustomPlanBilling(
  company?: CompanyDetailResponseData,
): CustomPlanBilling | undefined {
  const [billing] = (company?.customPlanBillings ?? [])
    .filter(({ status }) => status === CustomPlanBillingStatus.Pending)
    .sort((a, b) => +b.createdAt - +a.createdAt);

  if (!billing) {
    return undefined;
  }

  const currentPlan = company?.plan;
  const planName =
    currentPlan?.id === billing.planId
      ? currentPlan.name
      : company?.plans.find(({ id }) => id === billing.planId)?.name;

  return {
    billing,
    planName,
    deadline: modifyDate(
      billing.publishedAt ?? billing.createdAt,
      billing.daysUntilDue,
    ),
    isAwaitingActivation:
      billing.activationStrategy === CustomPlanActivationStrategy.Payment,
    isAwaitingPayment:
      billing.activationStrategy === CustomPlanActivationStrategy.Publish,
  };
}

export interface CreditGroups {
  plan: CreditWithCompanyContext[];
  bundles: CreditWithCompanyContext[];
  promotional: CreditWithCompanyContext[];
}

/**
 * Credits are listed under the reason they were granted, since a plan
 * allowance, a purchased bundle and a promotional grant each read differently.
 */
export function groupCreditsByReason(
  creditGrants: CreditCompanyGrantView[] = [],
): CreditGroups {
  return groupCreditGrants(creditGrants, {
    groupBy: "bundle",
  }).reduce<CreditGroups>(
    (acc, grant) => {
      switch (grant.grantReason) {
        case BillingCreditGrantReason.Plan:
          acc.plan.push(grant);
          break;
        case BillingCreditGrantReason.Purchased:
          acc.bundles.push(grant);
          break;
        case BillingCreditGrantReason.Free:
          acc.promotional.push(grant);
      }

      return acc;
    },
    { plan: [], bundles: [], promotional: [] },
  );
}
