"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ChartColumn,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  School,
  Users,
  type LucideIcon,
} from "lucide-react";
import { DashboardShell, type NavItem, type ShellUser } from "@/components/shared/dashboard-shell";

type KepsekTab = "DASHBOARD" | "KELAS" | "SISWA" | "GURU" | "ASESMEN" | "PERFORMA";

const TABS: { key: KepsekTab; label: string; href: string; icon: LucideIcon }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/kepsek", icon: LayoutDashboard },
  { key: "KELAS", label: "Kelas", href: "/kepsek?tab=KELAS", icon: School },
  { key: "SISWA", label: "Daftar Siswa", href: "/kepsek?tab=SISWA", icon: GraduationCap },
  { key: "GURU", label: "Daftar Guru", href: "/kepsek?tab=GURU", icon: Users },
  { key: "ASESMEN", label: "Asesmen", href: "/kepsek?tab=ASESMEN", icon: ClipboardCheck },
  { key: "PERFORMA", label: "Performa Akademik", href: "/kepsek?tab=PERFORMA", icon: ChartColumn },
];

export default function KepsekShell({
  children,
  activeTab = "KELAS",
}: {
  children: ReactNode;
  activeTab?: KepsekTab;
}) {
  const router = useRouter();
  const [me, setMe] = useState<{ nama: string; fotoProfil: string | null } | null>(null);

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

  const shellUser: ShellUser | null = me ? { nama: me.nama, role: "KEPSEK", fotoProfil: me.fotoProfil } : null;

  const navItems: NavItem[] = TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    icon: tab.icon,
    href: tab.href,
    active: activeTab === tab.key,
  }));

  return (
    <DashboardShell
      roleLabel="Dashboard Kepsek"
      sectionLabel={TABS.find((tab) => tab.key === activeTab)?.label}
      navItems={navItems}
      me={shellUser}
      onLogout={handleLogout}
      maxWidth="max-w-7xl"
    >
      {children}
    </DashboardShell>
  );
}