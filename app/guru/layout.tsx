"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  BookOpen,
  ChartColumn,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  School,
  User,
  type LucideIcon,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell";

type NavKey = "DASHBOARD" | "KELAS" | "ASESMEN" | "TUGAS" | "MATERI" | "PERFORMA" | "PROFILE";

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<{ id: string; nama: string; role: string; fotoProfil: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  const NAV_ITEMS: { key: NavKey; label: string; href: string; icon: LucideIcon }[] = [
    { key: "DASHBOARD", label: "Dashboard", href: "/guru", icon: LayoutDashboard },
    { key: "KELAS", label: "Kelas", href: "/guru/kelas", icon: School },
    { key: "ASESMEN", label: "Asesmen", href: "/guru/asesmen", icon: ClipboardCheck },
    { key: "TUGAS", label: "Tugas", href: "/guru/tugas", icon: ClipboardList },
    { key: "MATERI", label: "Materi", href: "/guru/materi", icon: BookOpen },
    { key: "PERFORMA", label: "Performa Akademik", href: "/guru/performa-akademik", icon: ChartColumn },
    { key: "PROFILE", label: "Profile", href: me ? `/profil/${me.id}` : "#", icon: User },
  ];

  function isActive(href: string) {
    if (href === "/guru") return pathname === "/guru";
    return pathname.startsWith(href);
  }

  const navItems: NavItem[] = NAV_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    href: item.href,
    icon: item.icon,
    active: isActive(item.href),
  }));

  return (
    <DashboardShell
      roleLabel="Dashboard Guru"
      sectionLabel={NAV_ITEMS.find((n) => isActive(n.href))?.label ?? "Kelas"}
      navItems={navItems}
      me={me}
      onLogout={handleLogout}
      maxWidth="max-w-5xl"
    >
      {children}
    </DashboardShell>
  );
}