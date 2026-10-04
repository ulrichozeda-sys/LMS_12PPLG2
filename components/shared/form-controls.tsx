import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-md border border-input bg-background px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground transition-colors duration-150 outline-none " +
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:opacity-60 aria-invalid:border-danger";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

export function TextInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controlBase, "h-10", className)} {...props} />;
}

export function SelectInput({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(controlBase, "h-10", className)}
      {...props}
    />
  );
}

export function SearchInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <span className="relative block">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        className={cn(controlBase, "h-10 pl-9", className)}
        {...props}
      />
    </span>
  );
}

export function SegmentedControl<Value extends string>({
  ariaLabel,
  value,
  onChange,
  options,
  className,
}: {
  ariaLabel: string;
  value: Value;
  onChange: (value: Value) => void;
  options: { value: Value; label: string }[];
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("inline-flex rounded-md border bg-muted p-1", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-9 rounded-sm px-3 text-sm font-medium transition-colors duration-150",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === option.value
              ? "bg-brand text-brand-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlBase, "resize-none py-2.5", className)}
      {...props}
    />
  );
}

export function PrimaryButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground",
        "transition-colors duration-150 hover:bg-brand/90",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function InlineButton({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"button"> & { tone?: "default" | "muted" }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-10 cursor-pointer items-center text-xs underline underline-offset-4 transition-colors duration-150 hover:no-underline",
        "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
        tone === "default"
          ? "font-medium text-foreground dark:text-brand"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function FormError({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p role="alert" className={cn("text-xs font-medium text-danger", className)}>
      {children}
    </p>
  );
}