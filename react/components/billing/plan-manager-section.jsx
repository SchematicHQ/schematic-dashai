import { PlanManager } from "@/components/schematic/plan-manager";
import {
  useCompany,
  useCreditBalances,
  useFeatureUsage,
} from "@schematichq/schematic-react";
import { Retry, Skeleton } from "@/components/billing/status";
import { useBillingNav } from "@/lib/billing";

export function PlanManagerSection() {
  const { openPricing, openAutoTopup } = useBillingNav();
  const company = useCompany();
  const usage = useFeatureUsage();
  const credits = useCreditBalances();
  const handles = [company, usage, credits];

  const missing = handles.filter((h) => h.data === undefined);
  if (missing.length > 0) {
    const failed = missing.filter((h) => h.error);
    return failed.length > 0 ? (
      <Retry onClick={() => failed.forEach((h) => h.refetch())} />
    ) : (
      <Skeleton className="h-40" />
    );
  }
  return (
    <PlanManager
      company={company.data}
      usage={usage.data}
      credits={credits.data}
      onChangePlan={openPricing}
      onEditAutoTopup={openAutoTopup}
    />
  );
}
