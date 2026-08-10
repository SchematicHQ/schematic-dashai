import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const sectionLabel = "text-xs uppercase tracking-wide text-muted-foreground";

function SectionLabel({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn(sectionLabel, className)} {...props} />;
}

export interface SectionCardProps {
  title: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

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
