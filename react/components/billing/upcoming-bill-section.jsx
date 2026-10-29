import { UpcomingBill } from "@/components/schematic/upcoming-bill";
import { useUpcomingInvoice } from "@schematichq/schematic-react";
import { Retry, Skeleton } from "@/components/billing/status";

export function UpcomingBillSection() {
  const { data, error, refetch } = useUpcomingInvoice();

  if (data === undefined) {
    return error ? <Retry onClick={refetch} error={error} /> : <Skeleton className="h-40" />;
  }
  return <UpcomingBill invoice={data} error={error} />;
}
