import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const sectionLabel = "text-xs uppercase tracking-wide text-muted-foreground";

/** The small uppercase label that heads a billing section or one of its groups. */
function SectionLabel({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn(sectionLabel, className)} {...props} />;
}

export interface SectionCardProps {
  title: React.ReactNode;
  /** Applied to the card body; overrides the default row spacing. */
  className?: string;
  children: React.ReactNode;
}

/** A titled billing section: uppercase label in the header, rows in the body. */
function SectionCard({ title, className, children }: SectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={sectionLabel}>{title}</CardTitle>
      </CardHeader>

      <CardContent className={cn("space-y-4", className)}>
        {children}
      </CardContent>
    </Card>
  );
}

export { SectionCard, SectionLabel };
