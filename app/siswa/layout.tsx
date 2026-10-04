"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  BookOpen,
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  School,
  User,
  type LucideIcon,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell";
import { showConfirm } from "@/lib/dialog";

type NavKey = "DASHBOARD" | "KELAS" | "ASESMEN" | "TUGAS" | "MATERI" | "PERFORMA" | "PROFILE";

const NAV_ICONS: Record<NavKey, LucideIcon> = {
  DASHBOARD: LayoutDashboard,
  KELAS: School,
  ASESMEN: ListChecks,
  TUGAS: ClipboardList,
  MATERI: BookOpen,
  PERFORMA: ChartColumn,
  PROFILE: User,
};

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
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
    if (isAssessmentPage()) {
      const lanjut = await showConfirm("Kamu sedang mengerjakan asesmen. Keluar dari asesmen?");
      if (!lanjut) return;
      await reportAssessmentExit();
    }
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function isAssessmentPage() {
    return pathname.startsWith("/siswa/asesmen/");
  }

  async function reportAssessmentExit() {
    const match = pathname.match(/^\/siswa\/asesmen\/([^/]+)/);
    if (!match) return;
    await fetch(`/api/asesmen/${encodeURIComponent(match[1])}/pelanggaran`, { method: "POST" });
  }

  async function handleNavClick(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (!isAssessmentPage() || href.startsWith("/siswa/asesmen/")) return;
    event.preventDefault();
    const lanjut = await showConfirm("Kamu sedang mengerjakan asesmen. Keluar dari asesmen?");
    if (!lanjut) return;
    await reportAssessmentExit();
    router.push(href);
  }

  const NAV_ITEMS: { key: NavKey; label: string; href: string; icon: LucideIcon }[] = [
    { key: "DASHBOARD", label: "Dashboard", href: "/siswa", icon: LayoutDashboard },
    { key: "KELAS", label: "Kelas", href: "/siswa/kelas", icon: School },
    { key: "ASESMEN", label: "Asesmen", href: "/siswa/asesmen", icon: ListChecks },
    { key: "TUGAS", label: "Tugas", href: "/siswa/tugas", icon: ClipboardList },
    { key: "MATERI", label: "Materi", href: "/siswa/materi", icon: BookOpen },
    { key: "PERFORMA", label: "Performa Akademik", href: "/siswa/performa-akademik", icon: ChartColumn },
    { key: "PROFILE", label: "Profile", href: me ? `/profil/${me.id}` : "#", icon: User },
  ];

  function isActive(href: string) {
    if (href === "/siswa") return pathname === "/siswa";
    return pathname.startsWith(href);
  }

  const navItems: NavItem[] = NAV_ITEMS.map((item) => ({
    ...item,
    active: isActive(item.href),
  }));

  return (
    <DashboardShell
      roleLabel="Dashboard Siswa"
      sectionLabel={NAV_ITEMS.find((item) => isActive(item.href))?.label ?? "Kelas"}
      navItems={navItems}
      me={me}
      onLogout={handleLogout}
      onNavigate={handleNavClick}
      onMenuOpen={() => {
        if (isAssessmentPage()) {
          window.dispatchEvent(new Event("assessment-exit-request"));
        }
      }}
      maxWidth="max-w-5xl"
    >
      {children}
    </DashboardShell>
  );
}