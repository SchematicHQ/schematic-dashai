const CARD =
  "rounded-xl border bg-card text-card-foreground shadow-sm";

export function Retry({ onClick, error }) {
  return (
    <div
      role="alert"
      className={`flex flex-wrap items-center justify-between gap-4 px-6 py-8 md:px-9 ${CARD}`}
    >
      <p className="text-sm text-destructive">
        Something went wrong loading this.
        {error?.message && <span className="block text-xs opacity-80">{error.message}</span>}
      </p>
      <button
        onClick={onClick}
        className="inline-flex cursor-pointer items-center rounded-xl border px-3.5 py-1.5 text-sm font-semibold transition-colors hover:bg-muted"
      >
        Try again
      </button>
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return (
    <div
      aria-busy="true"
      role="status"
      className={`animate-pulse space-y-3 px-6 py-8 md:px-9 ${CARD} ${className}`}
    >
      <div className="h-4 w-28 rounded bg-muted" />
      <div className="h-4 w-48 rounded bg-muted" />
    </div>
  );
}
