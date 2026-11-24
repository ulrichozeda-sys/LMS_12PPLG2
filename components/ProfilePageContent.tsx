"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpen,
  ChartColumn,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  School,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ModalEditProfil from "@/components/ModalEditProfil";
import { Avatar } from "@/components/shared/avatar";
import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell";
import { LoadingBlock, PageTitle, Panel } from "@/components/shared/data-display";
import { showAlert } from "@/lib/dialog";

type Role = "ADMIN" | "KEPSEK" | "KURIKULUM" | "GURU" | "SISWA" | "SUPER_ADMIN";

interface ProfilData {
  id: string;
  nama: string;
  role: Role;
  fotoProfil: string | null;
  deskripsi: string | null;
  jenisKelamin: string | null;
  rombel: string | null;
  jurusan: string | null;
  mapel: string[];
  nis: string | null;
  nik: string | null;
  isSelf: boolean;
}

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  KEPSEK: "Kepsek",
  KURIKULUM: "Kurikulum",
  GURU: "Guru",
  SISWA: "Siswa",
  SUPER_ADMIN: "Super Admin",
};

function navItem(
  key: string,
  label: string,
  href: string,
  icon: LucideIcon,
  active = false,
): NavItem {
  return { key, label, href, icon, active };
}

function getNavigation(role: Role, userId: string): NavItem[] {
  if (role === "ADMIN") {
    return [
      navItem("DASHBOARD", "Dashboard", "/admin", LayoutDashboard),
      navItem("KELAS", "Buat Kelas", "/admin?tab=KELAS", School),
      navItem("AKUN", "Daftar Akun", "/admin?tab=AKUN", Users, true),
      navItem("PERFORMA", "Performa Akademik", "/admin?tab=PERFORMA", ChartColumn),
    ];
  }

  if (role === "KEPSEK" || role === "KURIKULUM") {
    const basePath = role === "KEPSEK" ? "/kepsek" : "/kurikulum";
    return [
      navItem("DASHBOARD", "Dashboard", basePath, LayoutDashboard),
      navItem("KELAS", "Kelas", `${basePath}?tab=KELAS`, School),
      navItem("AKUN", "Daftar Akun", `${basePath}?tab=AKUN`, Users, true),
      navItem("ASESMEN", "Asesmen", `${basePath}?tab=ASESMEN`, ClipboardCheck),
      navItem("PERFORMA", "Performa Akademik", `${basePath}?tab=PERFORMA`, ChartColumn),
    ];
  }

  if (role === "SUPER_ADMIN") {
    return [
      navItem("DASHBOARD", "Dashboard", "/super-admin", LayoutDashboard),
      navItem("KELAS", "Kelas", "/super-admin/kelas", School),
      navItem("AKUN", "Daftar Akun", "/super-admin?tab=AKUN", Users, true),
      navItem("PERFORMA", "Performa Akademik", "/super-admin?tab=PERFORMA", ChartColumn),
      navItem("ASESMEN", "Asesmen", "/super-admin/asesmen", ClipboardCheck),
      navItem("TUGAS", "Tugas", "/super-admin/tugas", ClipboardList),
      navItem("MATERI", "Materi", "/super-admin/materi", BookOpen),
    ];
  }

  const isTeacher = role === "GURU";
  const basePath = isTeacher ? "/guru" : "/siswa";
  return [
    navItem("DASHBOARD", "Dashboard", basePath, LayoutDashboard),
    navItem("KELAS", "Kelas", `${basePath}/kelas`, School),
    navItem("ASESMEN", "Asesmen", `${basePath}/asesmen`, isTeacher ? ClipboardCheck : ListChecks),
    navItem("TUGAS", "Tugas", `${basePath}/tugas`, ClipboardList),
    navItem("MATERI", "Materi", `${basePath}/materi`, BookOpen),
    navItem("PERFORMA", "Performa Akademik", `${basePath}/performa-akademik`, ChartColumn),
    navItem("PROFILE", "Profil", `/profil/${userId}`, User, true),
  ];
}

function ProfileField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border bg-background p-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

export default function ProfilePageContent({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [me, setMe] = useState<{ id: string; nama: string; role: Role; fotoProfil: string | null } | null>(null);
  const [profil, setProfil] = useState<ProfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Gagal memuat akun.");
        setMe(payload.data);
      })
      .catch(() => setMe(null));
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/profil/${encodeURIComponent(userId)}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Gagal memuat profil.");
      }
      setProfil(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth", { method: "DELETE" });
      if (!response.ok) throw new Error("Gagal keluar dari akun.");
      router.push("/login");
      router.refresh();
    } catch (logoutError) {
      await showAlert(logoutError instanceof Error ? logoutError.message : "Gagal keluar dari akun.");
    }
  }

  const viewerRole = me?.role ?? "ADMIN";
  const navItems = me ? getNavigation(viewerRole, me.id) : [];
  const roleTitle = me ? `Dashboard ${ROLE_LABEL[viewerRole]}` : "Dashboard";
  const isStudent = profil?.role === "SISWA";
  const isTeacher = profil?.role === "GURU";
  const identityLabel = isStudent ? "NIS" : "NIK";
  const identityValue = isStudent ? profil?.nis : profil?.nik;

  const pageContent = (
    <div className="profile-print-area mx-auto w-full max-w-3xl space-y-5">
      <div className="no-print">
        <PageTitle
          title={profil?.isSelf ? "Profil Saya" : profil ? `Profil ${ROLE_LABEL[profil.role]}` : "Profil Pengguna"}
          description="Informasi akun dan identitas pengguna."
        />
      </div>

      {loading ? (
        <div className="no-print">
          <LoadingBlock />
        </div>
      ) : error || !profil ? (
        <div role="alert" className="no-print rounded-md border border-danger p-4 text-sm text-danger">
          {error || "Profil tidak ditemukan."}
        </div>
      ) : (
        <>
          <section className="profile-card overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-wrap items-center gap-4 border-b bg-muted/40 p-5 sm:p-6">
              <Avatar name={profil.nama} src={profil.fotoProfil} className="size-20 text-2xl" />
              <div className="min-w-0 flex-1">
                <Badge tone={profil.role === "GURU" ? "brand" : "gray"}>{ROLE_LABEL[profil.role]}</Badge>
                <h2 className="mt-2 truncate text-xl font-semibold tracking-tight">{profil.nama}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profil.isSelf ? "Profil akun yang sedang digunakan." : "Informasi profil pengguna."}
                </p>
              </div>
              <div className="no-print flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  Cetak Profil
                </Button>
                {profil.isSelf && (
                  <Button size="sm" onClick={() => setShowEdit(true)}>
                    Edit Profil
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:p-6">
              <Panel title="Informasi Akun">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <ProfileField label="Nama" value={profil.nama} />
                  <ProfileField label="Role" value={ROLE_LABEL[profil.role]} />
                  {profil.isSelf && (isStudent || isTeacher) && (
                    <ProfileField label={identityLabel} value={identityValue || "-"} />
                  )}
                  {profil.rombel && <ProfileField label="Kelas / Rombel" value={profil.rombel} />}
                  {isStudent && <ProfileField label="Jurusan" value={profil.jurusan || "-"} />}
                  {isTeacher && (
                    <ProfileField label="Mata Pelajaran" value={profil.mapel.length ? profil.mapel.join(", ") : "-"} />
                  )}
                  <ProfileField label="Jenis Kelamin" value={profil.jenisKelamin || "-"} />
                </dl>
              </Panel>

              <Panel title="Tentang">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {profil.deskripsi || "Belum ada deskripsi."}
                </p>
              </Panel>
            </div>
          </section>

          <div className="print-only-card">
            <div className="print-card-identity">
              <span className="print-card-label">MYCLASS · PROFIL {ROLE_LABEL[profil.role].toUpperCase()}</span>
              <div className="print-card-photo">
                {profil.fotoProfil ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profil.fotoProfil} alt={profil.nama} />
                ) : (
                  <span>{profil.nama.charAt(0)}</span>
                )}
              </div>
              <p className="print-card-title">{profil.nama}</p>
            </div>
            <div className="print-card-information">
              <p className="print-card-eyebrow">KARTU PROFIL</p>
              <p className="print-card-title">{profil.nama}</p>
              <div className="print-card-fields">
                {(isStudent || isTeacher) && (
                  <div>
                    <span>{identityLabel}</span>
                    <strong>{profil.isSelf ? identityValue || "-" : "Tidak ditampilkan"}</strong>
                  </div>
                )}
                <div>
                  <span>Role</span>
                  <strong>{ROLE_LABEL[profil.role]}</strong>
                </div>
                {(isStudent || isTeacher) && (
                  <div>
                    <span>{isStudent ? "Kelas / Jurusan" : "Mata Pelajaran"}</span>
                    <strong>{isStudent ? [profil.rombel, profil.jurusan].filter(Boolean).join(" / ") || "-" : profil.mapel.join(", ") || "-"}</strong>
                  </div>
                )}
                <div>
                  <span>Jenis Kelamin</span>
                  <strong>{profil.jenisKelamin || "-"}</strong>
                </div>
              </div>
              <div className="print-card-description">
                <span>Deskripsi</span>
                <strong>{profil.deskripsi || "-"}</strong>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {embedded ? (
        pageContent
      ) : (
        <DashboardShell
          roleLabel={roleTitle}
          sectionLabel="Profil"
          navItems={navItems}
          me={me}
          onLogout={handleLogout}
          maxWidth="max-w-6xl"
          className="profile-shell"
        >
          {pageContent}
        </DashboardShell>
      )}

      {profil?.isSelf && (
        <ModalEditProfil
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSuccess={loadProfile}
          userId={profil.id}
          initialNama={profil.nama}
          initialFoto={profil.fotoProfil}
          initialDeskripsi={profil.deskripsi}
        />
      )}
    </>
  );
}
