import type { ReactNode } from "react";

interface NoticeProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function Notice({ title, description, children }: NoticeProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-center text-white border border-border bg-border/40 rounded-xl p-6">
      <h3 className="text-lg font-semibold leading-none">{title}</h3>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {children}
    </div>
  );
}
