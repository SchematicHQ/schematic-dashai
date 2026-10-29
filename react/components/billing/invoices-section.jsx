import { Invoices } from "@/components/schematic/invoices";
import { useInvoices } from "@schematichq/schematic-react";
import { Retry, Skeleton } from "@/components/billing/status";

export function InvoicesSection() {
  const { data, error, refetch, isPending, loadMore } = useInvoices({
    includePending: true,
  });

  if (data === undefined) {
    return error ? <Retry onClick={refetch} error={error} /> : <Skeleton className="h-40" />;
  }
  return (
    <Invoices
      page={data}
      onLoadMore={loadMore}
      loadingMore={isPending}
      error={error}
    />
  );
}
