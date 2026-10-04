"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { LogOut, Menu, PanelLeft, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SiteFooter } from "@/components/shared/site-footer";
import { Avatar } from "@/components/shared/avatar";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  href?: string;
  onSelect?: () => void;
}

export interface ShellUser {
  nama: string;
  role: string;
  fotoProfil: string | null;
}

const iconButton =
  "inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-muted-foreground " +
  "transition-colors duration-150 hover:bg-accent hover:text-foreground outline-none " +
  "focus-visible:ring-2 focus-visible:ring-ring";

export function DashboardShell({
  roleLabel,
  sectionLabel,
  navItems,
  me,
  onLogout,
  onNavigate,
  onMenuOpen,
  headerActions,
  maxWidth = "max-w-6xl",
  children,
}: {
  roleLabel: string;
  sectionLabel?: string;
  navItems: NavItem[];
  me: ShellUser | null;
  onLogout: () => void;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
  onMenuOpen?: () => void;
  headerActions?: ReactNode;
  maxWidth?: string;
  children: ReactNode;
}) {
  // Dua state terpisah: mobile (drawer) vs desktop (collapse)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  const itemClass = (active?: boolean) =>
    cn(
      "flex h-10 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm transition-colors duration-150 outline-none",
      "focus-visible:ring-2 focus-visible:ring-ring",
      active
        ? "bg-brand font-medium text-brand-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-30 h-14 border-b bg-background">
        <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => {
                onMenuOpen?.();
                setSidebarOpen(true);
              }}
              className={cn(iconButton, "lg:hidden")}
            >
              <Menu className="size-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label={sidebarCollapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
              aria-expanded={!sidebarCollapsed}
              onClick={() => setSidebarCollapsed((value) => !value)}
              className={cn(iconButton, "hidden lg:inline-flex")}
            >
              <PanelLeft className="size-5" strokeWidth={1.75} />
            </button>
            <Logo />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {me && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight">{me.nama}</p>
                <p className="text-xs text-muted-foreground">{me.role}</p>
              </div>
            )}
            <Avatar
              name={me?.nama}
              src={me?.fotoProfil}
              className="hidden size-9 sm:inline-flex"
            />
            <ThemeToggle />
            {headerActions}
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-stretch">
        {/* BACKDROP (mobile saja) */}
        {sidebarOpen && (
          <div
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}

        {/* SIDEBAR: mobile = drawer, desktop = sticky non-overlay */}
        <aside
          aria-label={`Navigasi ${roleLabel}`}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto border-r bg-background transition-transform duration-150",
            "lg:sticky lg:top-14 lg:z-10 lg:h-[calc(100dvh-3.5rem)] lg:shrink-0 lg:translate-x-0 lg:self-start",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            sidebarCollapsed && "lg:hidden",
          )}
        >
          <div className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
            <Logo />
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setSidebarOpen(false)}
              className={iconButton}
            >
              <X className="size-5" strokeWidth={1.75} />
            </button>
          </div>

          <div className="px-4 pt-4">
            <p className="text-sm font-semibold">{roleLabel}</p>
            {sectionLabel && (
              <p className="mt-0.5 text-xs text-muted-foreground">{sectionLabel}</p>
            )}
          </div>

          <nav aria-label={roleLabel} className="flex flex-col gap-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <Icon className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </>
              );
              if (item.href) {
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    title={item.label}
                    aria-current={item.active ? "page" : undefined}
                    onClick={(event) => {
                      setSidebarOpen(false);
                      onNavigate?.(event, item.href!);
                    }}
                    className={itemClass(item.active)}
                  >
                    {content}
                  </Link>
                );
              }
              return (
                <button
                  key={item.key}
                  type="button"
                  title={item.label}
                  aria-current={item.active ? "page" : undefined}
                  onClick={() => {
                    setSidebarOpen(false);
                    item.onSelect?.();
                  }}
                  className={itemClass(item.active)}
                >
                  {content}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto border-t p-3">
            <button
              type="button"
              onClick={onLogout}
              className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors duration-150 hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="size-4" strokeWidth={1.75} aria-hidden="true" />
              Keluar
            </button>
          </div>
        </aside>

        {/* KONTEN */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          <div className={cn("mx-auto w-full", maxWidth)}>{children}</div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}