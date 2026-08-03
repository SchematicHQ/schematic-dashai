export function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted-foreground leading-none">{label}</span>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

export function Row({
  label,
  children,
}: {
  label: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center flex-wrap gap-2">
      <span className="font-medium">{label}</span>
      {children}
    </div>
  );
}
