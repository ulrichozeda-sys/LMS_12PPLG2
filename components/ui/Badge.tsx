"use client";

import { ReactNode } from "react";

type Tone = "brand" | "gray" | "green" | "red" | "amber";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  brand: "border-transparent bg-brand text-brand-foreground",
  gray: "border-border bg-muted text-muted-foreground",
  green: "border-transparent bg-brand-subtle text-foreground",
  red: "border-danger/30 bg-danger/10 text-danger",
  amber: "border-border bg-muted text-foreground",
};

export default function Badge({ children, tone = "brand", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-xs font-medium leading-4 ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}