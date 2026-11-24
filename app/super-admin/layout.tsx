"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  School,
  Users,
  type LucideIcon,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell";
import { showAlert } from "@/lib/dialog";

const NAV_ITEMS: { key: string; label: string; href: string; icon: LucideIcon; tab?: string }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/super-admin", icon: LayoutDashboard, tab: "DASHBOARD" },
  { key: "KELAS", label: "Kelas", href: "/super-admin/kelas", icon: School, tab: "KELAS" },
  { key: "AKUN", label: "Daftar Akun", href: "/super-admin?tab=AKUN", icon: Users, tab: "AKUN" },
  { key: "PERFORMA", label: "Performa Akademik", href: "/super-admin?tab=PERFORMA", icon: ClipboardCheck, tab: "PERFORMA" },
  { key: "ASESMEN", label: "Asesmen", href: "/super-admin/asesmen", icon: ClipboardCheck },
  { key: "TUGAS", label: "Tugas", href: "/super-admin/tugas", icon: ClipboardList },
  { key: "MATERI", label: "Materi", href: "/super-admin/materi", icon: BookOpen },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <SuperAdminShell>{children}</SuperAdminShell>
    </Suspense>
  );
}

function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [me, setMe] = useState<{ id: string; nama: string; role: string; fotoProfil: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Gagal memuat akun.");
        setMe(payload.data);
      })
      .catch(() => setMe(null));
  }, []);

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth", { method: "DELETE" });
      if (!response.ok) throw new Error("Gagal keluar dari akun.");
      router.push("/login");
      router.refresh();
    } catch (error) {
      await showAlert(error instanceof Error ? error.message : "Gagal keluar dari akun.");
    }
  }

  const navItems: NavItem[] = NAV_ITEMS.map((item) => {
    const active = item.key === "KELAS"
      ? pathname.startsWith(item.href) || pathname === "/super-admin" && searchParams.get("tab") === "KELAS"
      : item.key === "AKUN" && pathname.startsWith("/super-admin/profil/")
        ? true
        : item.tab
          ? pathname === "/super-admin" && (searchParams.get("tab") ?? "DASHBOARD") === item.tab
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
    return { ...item, active };
  });

  const activeItem = NAV_ITEMS.find((item) => navItems.find((nav) => nav.key === item.key)?.active);

  return (
    <DashboardShell
      roleLabel="Super Admin"
      sectionLabel={activeItem?.label ?? "Dashboard"}
      navItems={navItems}
      me={me}
      onLogout={handleLogout}
      maxWidth="max-w-7xl"
    >
      {children}
    </DashboardShell>
  );
}
