import type {
  BillingCreditBundleView,
  CompanyDetailResponseData,
  CompanySubscriptionResponseData,
  ComponentDisplaySettings,
  ComponentHydrateResponseData,
  CreditCompanyGrantView,
  FeatureUsageResponseData,
  InvoiceResponseData,
  PlanDetailResponseData,
  ScheduledDowngradeResponseData,
} from "./api/checkoutexternal";

/** The company-billing slice of the hydrate response, as exposed by useBilling. */
export interface Billing {
  company?: CompanyDetailResponseData;
  subscription?: CompanySubscriptionResponseData;
  upcomingInvoice?: InvoiceResponseData;
  features: FeatureUsageResponseData[];
  creditGrants: CreditCompanyGrantView[];
  creditBundles: BillingCreditBundleView[];
  defaultPlan?: PlanDetailResponseData;
  postTrialPlan?: PlanDetailResponseData;
  trialPaymentMethodRequired: boolean;
  scheduledDowngrade?: ScheduledDowngradeResponseData;
  displaySettings: ComponentDisplaySettings;
}

export function toBilling(data: ComponentHydrateResponseData): Billing {
  return {
    company: data.company,
    subscription: data.subscription,
    upcomingInvoice: data.upcomingInvoice,
    features: data.featureUsage?.features ?? [],
    creditGrants: data.creditGrants,
    creditBundles: data.creditBundles,
    defaultPlan: data.defaultPlan,
    postTrialPlan: data.postTrialPlan,
    trialPaymentMethodRequired: data.trialPaymentMethodRequired ?? false,
    scheduledDowngrade: data.scheduledDowngrade,
    displaySettings: data.displaySettings,
  };
}
