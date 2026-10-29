import { MeteredFeatures } from "@/components/schematic/metered-features";
import { useFeatureUsage } from "@schematichq/schematic-react";
import { Retry, Skeleton } from "@/components/billing/status";
import { useBillingNav } from "@/lib/billing";

export function MeteredFeaturesSection() {
  const { openAddMore } = useBillingNav();
  const { data, error, refetch } = useFeatureUsage();

  if (data === undefined) {
    return error ? <Retry onClick={refetch} error={error} /> : <Skeleton className="h-40" />;
  }
  return (
    <MeteredFeatures
      features={data}
      onAddMore={(feature) => openAddMore(feature.featureId)}
    />
  );
}
