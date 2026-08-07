"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  /** Wrap the message in a Card, for pages that render errors inline with other cards. */
  card?: boolean;
}

/** A failed fetch, with the retry that goes with it. */
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
