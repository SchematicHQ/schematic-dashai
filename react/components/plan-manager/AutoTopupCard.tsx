import Link from "next/link";

import { type CompanyPlanCreditGrantView } from "@/components/api/checkoutexternal";
import {
  getAutoTopupAmount,
  getAutoTopupThresholdCredits,
  getFeatureName,
  isSelfServiceAutoTopupAvailable,
} from "@/components/utils";

interface AutoTopupCardProps {
  grants: CompanyPlanCreditGrantView[];
  editHref: string;
}

export function AutoTopupCard({ grants, editHref }: AutoTopupCardProps) {
  const selfServiceGrants = grants.filter(
    (grant) => grant.credit && isSelfServiceAutoTopupAvailable(grant),
  );

  if (selfServiceGrants.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-between items-center gap-2 rounded-lg bg-border/40 p-6">
      <div className="flex flex-col gap-2">
        <span className="font-medium">Auto top-up</span>

        {selfServiceGrants.map((grant) => (
          <GrantSummary key={grant.id} grant={grant} />
        ))}
      </div>

      <Link
        href={editHref}
        className="font-medium leading-none text-accent transition-all hover:underline"
      >
        Edit
      </Link>
    </div>
  );
}

function GrantSummary({ grant }: { grant: CompanyPlanCreditGrantView }) {
  const credit = grant.credit;
  if (!credit) {
    return null;
  }

  if (!grant.companyAutoTopupEnabled) {
    return (
      <span className="text-sm text-muted-foreground">
        Auto top-up disabled for {getFeatureName(credit, 1)}
      </span>
    );
  }

  const thresholdCredits = getAutoTopupThresholdCredits(grant);
  const amount = getAutoTopupAmount(grant);

  if (typeof thresholdCredits !== "number" || typeof amount !== "number") {
    return null;
  }

  return (
    <span className="text-sm text-muted-foreground">
      Adds {amount} {getFeatureName(credit, amount)} when {thresholdCredits}{" "}
      remaining in balance
    </span>
  );
}
