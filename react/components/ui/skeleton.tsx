import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent/30 animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export interface SkeletonListProps {
  count?: number;
  className?: string;
  itemClassName?: string;
}

function SkeletonList({
  count = 4,
  className,
  itemClassName,
}: SkeletonListProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={itemClassName} />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonList };
