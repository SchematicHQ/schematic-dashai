import { type CompanyDetailResponseData } from "@/components/api/checkoutexternal";
import { toPrettyDate } from "@/components/utils";
import { getTrialEnd, type CustomPlanBilling } from "./utils";

interface NoticeProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function Notice({ title, description, children }: NoticeProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-center text-white border border-border bg-border/40 rounded-xl p-6">
      <h3 className="text-lg font-semibold leading-none">{title}</h3>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {children}
    </div>
  );
}

interface StatusNoticeProps {
  company: CompanyDetailResponseData;
  customPlanBilling?: CustomPlanBilling;
  trialPaymentMethodRequired?: boolean;
  postTrialPlanName?: string;
}

export function StatusNotice({
  company,
  customPlanBilling,
  trialPaymentMethodRequired = false,
  postTrialPlanName,
}: StatusNoticeProps) {
  const {
    plan: currentPlan,
    billingSubscription,
    scheduledDowngrade,
  } = company;

  const willSubscriptionCancel =
    typeof billingSubscription?.cancelAt === "number" &&
    billingSubscription.cancelAtPeriodEnd;

  if (billingSubscription?.status === "trialing" && !willSubscriptionCancel) {
    const { amount, units } = getTrialEnd(billingSubscription);

    return (
      <Notice
        title={
          typeof amount === "number"
            ? `Trial ends in ${amount} ${units}`
            : "Trial in progress"
        }
        description={
          trialPaymentMethodRequired
            ? "After the trial, subscription starts and you will be billed."
            : postTrialPlanName
              ? `After the trial, you will be downgraded to the ${postTrialPlanName} plan and your subscription will be cancelled. You will not be charged unless you subscribe to a paid plan during the trial.`
              : currentPlan
                ? `After the trial, you will lose access to the ${currentPlan.name} plan and your subscription will be cancelled. You will not be charged unless you subscribe to a paid plan during the trial.`
                : undefined
        }
      />
    );
  }

  if (willSubscriptionCancel) {
    return (
      <Notice
        title="Subscription canceled"
        description={
          typeof billingSubscription?.cancelAt === "number"
            ? `Access to ${currentPlan?.name || "plan"} will end on ${toPrettyDate(
                new Date(billingSubscription.cancelAt * 1000),
                { month: "numeric" },
              )}.`
            : undefined
        }
      />
    );
  }

  if (customPlanBilling) {
    const { billing, planName = "your plan", deadline } = customPlanBilling;
    const dueDate = toPrettyDate(deadline, { month: "numeric" });

    return (
      <Notice
        title={
          customPlanBilling.isAwaitingActivation
            ? `Pay to activate ${planName}`
            : `Pay by ${dueDate} to keep ${planName}`
        }
        description={
          customPlanBilling.isAwaitingActivation
            ? `Pay the invoice to activate your custom plan. Due by ${dueDate}.`
            : `Access to ${planName} will end on ${dueDate} unless the invoice is paid.`
        }
      >
        {billing.stripeInvoiceUrl && (
          <a
            href={billing.stripeInvoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium leading-none text-accent transition-all hover:underline"
          >
            Pay now
          </a>
        )}
      </Notice>
    );
  }

  if (scheduledDowngrade?.toPlanName) {
    return (
      <Notice
        title={`Downgrade to ${scheduledDowngrade.toPlanName} scheduled`}
        description={
          typeof billingSubscription?.periodEnd === "number"
            ? `Access to ${scheduledDowngrade.fromPlanName} will end on ${toPrettyDate(
                new Date(billingSubscription.periodEnd * 1000),
                { month: "numeric" },
              )}.`
            : undefined
        }
      />
    );
  }

  return null;
}
