"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChartColumn,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  School,
  Users,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PengumumanCard from "@/components/PengumumanCard";
import TugasCard from "@/components/TugasCard";
import MateriCard, { MateriData } from "@/components/MateriCard";
import FeedCategoryFilter, { FeedCategory } from "@/components/FeedCategoryFilter";
import { ClassDetailOverview, ClassDirectoryNavigation } from "@/components/ClassDetailOverview";
import { cn } from "@/lib/utils";
import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell";
import { Avatar } from "@/components/shared/avatar";
import { EmptyState, LoadingBlock } from "@/components/shared/data-display";

interface SiswaDiKelas {
  siswaId: string;
  siswa: { id: string; nama: string; nis: string | null; fotoProfil: string | null; kelasReferensi: { label: string } | null };
}
interface GuruDiKelas {
  id: string;
  guru: { id: string; nama: string; nik: string | null; fotoProfil: string | null };
  mapel: { id: string; nama: string };
}
interface FeedItem {
  tipe: "PENGUMUMAN" | "ASESMEN" | "TUGAS" | "MATERI";
  timestamp: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}
interface KelasDetail {
  id: string;
  judul: string;
  deskripsi: string | null;
  siswa: SiswaDiKelas[];
  guruMapel: GuruDiKelas[];
  feed: FeedItem[];
}

const NAV: { key: string; label: string; href: string; icon: NavItem["icon"] }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/kepsek", icon: LayoutDashboard },
  { key: "KELAS", label: "Kelas", href: "/kepsek?tab=KELAS", icon: School },
  { key: "SISWA", label: "Daftar Siswa", href: "/kepsek?tab=SISWA", icon: GraduationCap },
  { key: "GURU", label: "Daftar Guru", href: "/kepsek?tab=GURU", icon: Users },
  { key: "ASESMEN", label: "Asesmen", href: "/kepsek?tab=ASESMEN", icon: ClipboardCheck },
  { key: "PERFORMA", label: "Performa Akademik", href: "/kepsek?tab=PERFORMA", icon: ChartColumn },
];

const personRow =
  "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-md border p-3 text-left transition-colors duration-150 hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function KepsekKelasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const kelasId = params.id as string;

  const [kelas, setKelas] = useState<KelasDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string; nama: string; role: string; fotoProfil: string | null } | null>(null);
  const [section, setSection] = useState<"SISWA" | "GURU" | null>(null);
  const [expandedRombel, setExpandedRombel] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [feedCategory, setFeedCategory] = useState<FeedCategory>("SEMUA");

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadKelas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasId]);

  async function loadKelas() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/kelas/${kelasId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat kelas.");
        setLoading(false);
        return;
      }
      setKelas(data.data);
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-background p-6 text-foreground">
        <div className="mx-auto max-w-6xl">
          <LoadingBlock />
        </div>
      </div>
    );
  }
  if (error || !kelas) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-4 text-foreground">
        <p className="text-sm text-muted-foreground">{error || "Kelas tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push("/kepsek")}>Kembali</Button>
      </div>
    );
  }

  const siswaGrouped = kelas.siswa.reduce((acc: Record<string, SiswaDiKelas[]>, ks) => {
    const label = ks.siswa.kelasReferensi?.label ?? "Belum Ada Kelas";
    if (!acc[label]) acc[label] = [];
    acc[label].push(ks);
    return acc;
  }, {});
  const guruGrouped = kelas.guruMapel.reduce((acc: Record<string, GuruDiKelas[]>, gm) => {
    const label = gm.mapel.nama;
    if (!acc[label]) acc[label] = [];
    acc[label].push(gm);
    return acc;
  }, {});
  const visibleFeed = kelas.feed.filter((item) => feedCategory === "SEMUA" || item.tipe === feedCategory);

  const navItems: NavItem[] = NAV.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    href: item.href,
    active: item.key === "KELAS",
  }));

  return (
    <DashboardShell
      roleLabel="Dashboard Kepsek"
      sectionLabel="Detail Kelas"
      navItems={navItems}
      me={me}
      onLogout={handleLogout}
      maxWidth="max-w-6xl"
      headerActions={
        <Button size="sm" variant="outline" onClick={() => router.push("/kepsek")}>
          Back
        </Button>
      }
    >
      <ClassDetailOverview title={kelas.judul} description={kelas.deskripsi} studentCount={kelas.siswa.length} teacherCount={kelas.guruMapel.length} />
      <ClassDirectoryNavigation section={section} onChange={setSection} studentCount={kelas.siswa.length} teacherCount={kelas.guruMapel.length} />

      {section === "SISWA" && (
        <div className="mt-4 space-y-3">
          {Object.keys(siswaGrouped).length === 0 ? (
            <EmptyState>Belum ada siswa di kelas ini.</EmptyState>
          ) : (
            Object.entries(siswaGrouped).map(([label, list]) => {
              const isOpen = expandedRombel === label;
              return (
                <div key={label} className="overflow-hidden rounded-lg border bg-card text-card-foreground">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpandedRombel(isOpen ? null : label)}
                    className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{label}</p>
                      <Badge tone="brand">{list.length} Siswa</Badge>
                    </div>
                    <ChevronDown
                      aria-hidden="true"
                      strokeWidth={1.75}
                      className={cn("size-4 text-muted-foreground transition-transform duration-150", isOpen && "rotate-180")}
                    />
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t p-3">
                      {list.map((ks) => (
                        <button key={ks.siswaId} onClick={() => router.push(`/profil/${ks.siswa.id}`)} className={personRow}>
                          <Avatar name={ks.siswa.nama} src={ks.siswa.fotoProfil} className="size-9" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{ks.siswa.nama}</p>
                            <p className="text-xs text-muted-foreground">
                              NIS: <span className="font-mono">{ks.siswa.nis}</span>
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {section === "GURU" && (
        <div className="mt-4">
          {Object.keys(guruGrouped).length === 0 ? (
            <EmptyState>Belum ada guru mengajar di kelas ini.</EmptyState>
          ) : (
            Object.entries(guruGrouped).map(([mapel, list]) => (
              <div key={mapel} className="mb-5">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">{mapel}</h3>
                <div className="space-y-2">
                  {list.map((gm) => (
                    <button key={gm.id} onClick={() => router.push(`/profil/${gm.guru.id}`)} className={cn(personRow, "bg-card")}>
                      <Avatar name={gm.guru.nama} src={gm.guru.fotoProfil} className="size-9" />
                      <p className="text-sm font-medium">{gm.guru.nama}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {section === null && (
        <div className="mt-6">
          <h2 className="mb-3 text-base font-semibold tracking-tight">Aktivitas Kelas</h2>
          <FeedCategoryFilter value={feedCategory} onChange={setFeedCategory} />
          <div className="space-y-3">
            {kelas.feed.length === 0 ? (
              <EmptyState>Belum ada aktivitas di kelas ini.</EmptyState>
            ) : visibleFeed.length === 0 ? (
              <EmptyState>Tidak ada aktivitas untuk filter ini.</EmptyState>
            ) : (
              visibleFeed.map((item, i) => {
                if (item.tipe === "PENGUMUMAN") return <PengumumanCard key={`p-${i}`} data={item.data} currentUserId={me?.id ?? ""} />;
                if (item.tipe === "TUGAS") return <TugasCard key={`t-${i}`} data={item.data} currentUserId={me?.id ?? ""} role="KEPSEK" />;
                if (item.tipe === "MATERI") return <MateriCard key={`m-${item.data.id}`} data={item.data as MateriData} />;
                if (item.tipe !== "ASESMEN") return null;
                const a = item.data;
                return (
                  <button
                    key={`a-${i}`}
                    onClick={() => router.push(`/kepsek/asesmen/${a.id}`)}
                    className="block w-full cursor-pointer rounded-lg border bg-card p-4 text-left text-card-foreground transition-colors duration-150 hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand">{a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
                      {a.mapel && <Badge tone="gray">{a.mapel.nama}</Badge>}
                    </div>
                    <p className="mt-2 text-sm font-semibold">{a.judul}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="tabular-nums">{a._count?.soal ?? 0}</span> soal · oleh {a.guru?.nama} — lihat ujian & jawaban siswa
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}