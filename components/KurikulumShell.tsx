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

type KurikulumTab = "DASHBOARD" | "KELAS" | "SISWA" | "GURU" | "ASESMEN" | "PERFORMA";

const TABS: { key: KurikulumTab; label: string; href: string; icon: LucideIcon }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/kurikulum", icon: LayoutDashboard },
  { key: "KELAS", label: "Kelas", href: "/kurikulum?tab=KELAS", icon: School },
  { key: "SISWA", label: "Daftar Siswa", href: "/kurikulum?tab=SISWA", icon: GraduationCap },
  { key: "GURU", label: "Daftar Guru", href: "/kurikulum?tab=GURU", icon: Users },
  { key: "ASESMEN", label: "Asesmen", href: "/kurikulum?tab=ASESMEN", icon: ClipboardCheck },
  { key: "PERFORMA", label: "Performa Akademik", href: "/kurikulum?tab=PERFORMA", icon: ChartColumn },
];

export default function KurikulumShell({
  children,
  activeTab = "KELAS",
}: {
  children: ReactNode;
  activeTab?: KurikulumTab;
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

  const shellUser: ShellUser | null = me ? { nama: me.nama, role: "KURIKULUM", fotoProfil: me.fotoProfil } : null;

  const navItems: NavItem[] = TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    icon: tab.icon,
    href: tab.href,
    active: activeTab === tab.key,
  }));

  return (
    <DashboardShell
      roleLabel="Dashboard Kurikulum"
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