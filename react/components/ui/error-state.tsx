"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  card?: boolean;
}

export function ErrorState({
  message,
  onRetry,
  card = false,
}: ErrorStateProps) {
  const body = (
    <>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </>
  );

  if (card) {
    return (
      <Card>
        <CardContent className="space-y-3 text-center">{body}</CardContent>
      </Card>
    );
  }

  return <div className="space-y-3 text-center">{body}</div>;
}
