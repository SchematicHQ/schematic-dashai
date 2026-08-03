import type { CreditWithCompanyContext } from "@/components/types";
import { getFeatureName } from "@/components/utils";
import { Row } from "./layout";
import type { AutoTopupNotice } from "./utils";

interface CreditGroupRowProps {
  group: CreditWithCompanyContext;
  /** the interval the allowance renews on, when it renews */
  per?: string;
  /** surfaces how many grants were merged into the group */
  showGrantCount?: boolean;
  autoTopup?: AutoTopupNotice;
}

export function CreditGroupRow({
  group,
  per,
  showGrantCount = false,
  autoTopup,
}: CreditGroupRowProps) {
  const { value, used } = group.total;

  return (
    <Row
      label={
        <>
          {showGrantCount && group.grants.length > 1 && (
            <span className="text-muted-foreground">
              ({group.grants.length}){" "}
            </span>
          )}
          {value} {getFeatureName(group, value)}
          {per && <> per {per}</>}
        </>
      }
    >
      {used > 0 && (
        <span
          className="text-sm text-muted-foreground"
          title={
            autoTopup
              ? `When credit balance reaches ${autoTopup.thresholdCredits} remaining, an auto top-up of ${autoTopup.amount} credits will be processed.`
              : undefined
          }
        >
          {used} used{autoTopup && " (auto top-up on)"}
        </span>
      )}
    </Row>
  );
}
