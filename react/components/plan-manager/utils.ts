import {
  BillingCreditGrantReason,
  CustomPlanActivationStrategy,
  CustomPlanBillingStatus,
  type BillingSubscriptionView,
  type CompanyDetailResponseData,
  type CompanyPlanCreditGrantView,
  type CreditCompanyGrantView,
  type CustomPlanBillingResponseData,
} from "@/components/api/checkoutexternal";
import type { CreditWithCompanyContext } from "@/components/types";
import {
  getAutoTopupAmount,
  getAutoTopupThresholdCredits,
  groupCreditGrants,
  isAutoTopupEnabled,
  modifyDate,
  pluralize,
} from "@/components/utils";

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
  company?: Pick<
    CompanyDetailResponseData,
    "customPlanBillings" | "plan" | "plans"
  >,
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

export interface AutoTopupNotice {
  thresholdCredits: number;
  amount: number;
}

/**
 * The auto top-up terms to mention alongside a credit allowance, but only when
 * top-up is actually on and fully configured — a partially configured grant has
 * nothing meaningful to say.
 */
export function getAutoTopupNotice(
  grant?: CompanyPlanCreditGrantView,
): AutoTopupNotice | undefined {
  const thresholdCredits = getAutoTopupThresholdCredits(grant);
  const amount = getAutoTopupAmount(grant);

  if (
    !isAutoTopupEnabled(grant) ||
    typeof thresholdCredits !== "number" ||
    typeof amount !== "number"
  ) {
    return undefined;
  }

  return { thresholdCredits, amount };
}

export interface CreditGroups {
  plan: CreditWithCompanyContext[];
  bundles: CreditWithCompanyContext[];
  promotional: CreditWithCompanyContext[];
}

/**
 * Credits are listed under the reason they were granted, since a plan
 * allowance, a purchased bundle and a promotional grant each read differently.
 * Grants are partitioned by reason before being grouped, because grouping mixes
 * grants together and a group only keeps one of their reasons.
 */
export function groupCreditsByReason(
  creditGrants: CreditCompanyGrantView[] = [],
): CreditGroups {
  const byReason = creditGrants.reduce<
    Record<string, CreditCompanyGrantView[]>
  >(
    (acc, creditGrant) => {
      switch (creditGrant.grantReason) {
        case BillingCreditGrantReason.Plan:
          acc.plan.push(creditGrant);
          break;
        case BillingCreditGrantReason.Purchased:
          acc.bundles.push(creditGrant);
          break;
        case BillingCreditGrantReason.Free:
          acc.promotional.push(creditGrant);
      }

      return acc;
    },
    { plan: [], bundles: [], promotional: [] },
  );

  return {
    plan: groupCreditGrants(byReason.plan, { groupBy: "credit" }),
    bundles: groupCreditGrants(byReason.bundles, { groupBy: "credit" }),
    promotional: groupCreditGrants(byReason.promotional, {
      groupBy: "credit",
    }),
  };
}
