import { cn } from "@/lib/utils";

export function Avatar({
  name,
  src,
  fallback = "A",
  className,
}: {
  name?: string | null;
  src?: string | null;
  fallback?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-xs font-semibold text-muted-foreground",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? ""} className="size-full object-cover" />
      ) : (
        (name?.charAt(0) || fallback).toUpperCase()
      )}
    </span>
  );
}