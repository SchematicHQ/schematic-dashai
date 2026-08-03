import type { ReactNode } from "react";

interface NoticeProps {
  title: string;
  children?: ReactNode;
}

export function Notice({ title, children }: NoticeProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-center text-white border border-border bg-border/40 rounded-xl p-6">
      <h3 className="text-lg font-semibold leading-none">{title}</h3>
      {children}
    </div>
  );
}
