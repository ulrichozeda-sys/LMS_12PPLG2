import * as React from "react";
import { cn } from "@/lib/utils";

export function PageTitle({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border bg-card text-card-foreground", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold tracking-tight">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Grid statistik: sel dipisah garis tipis, bukan kartu terpisah. */
export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCell({
  label,
  value,
  caption,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  caption?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {caption && <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="cursor-pointer bg-card p-4 text-left transition-colors duration-150 hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {body}
      </button>
    );
  }
  return <div className="bg-card p-4">{body}</div>;
}

const BAR_TONES = {
  1: "bg-chart-1",
  2: "bg-chart-2",
  3: "bg-chart-3",
  4: "bg-chart-4",
  5: "bg-chart-5",
} as const;

export function BarRow({
  label,
  value,
  max,
  tone = 1,
}: {
  label: string;
  value: number;
  max: number;
  tone?: keyof typeof BAR_TONES;
}) {
  const width = `${Math.min((value / (max || 1)) * 100, 100)}%`;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 rounded-sm bg-foreground/10">
        <div className={cn("h-2 rounded-sm", BAR_TONES[tone])} style={{ width }} />
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function StatusDot({
  tone = "brand",
  children,
}: {
  tone?: "brand" | "muted";
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", tone === "brand" ? "bg-brand" : "bg-foreground/30")}
      />
      {children}
    </span>
  );
}

export function LoadingBlock() {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">Memuat...</span>
      <div className="h-6 w-48 animate-pulse rounded-md bg-foreground/10" />
      <div className="h-24 animate-pulse rounded-lg bg-foreground/10" />
      <div className="h-24 animate-pulse rounded-lg bg-foreground/10" />
    </div>
  );
}

/** Tabel lebar scroll di dalam container sendiri. */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-md border">{children}</div>;
}