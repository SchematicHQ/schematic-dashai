import type { ReactNode } from "react";

/** A titled group of rows within the plan card. */
export function Section({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted-foreground leading-none">{label}</span>

      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

/**
 * A line item: what the company has on the left, what it costs or how much of
 * it is used on the right. Children are styled by the caller, since the trailing
 * detail is muted in some rows and a price in others.
 */
export function Row({
  label,
  children,
}: {
  label: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex justify-between items-center flex-wrap gap-2">
      <span className="font-medium">{label}</span>

      {children}
    </div>
  );
}
