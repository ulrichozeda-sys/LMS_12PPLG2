"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileText,
  School,
  User,
  Users,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Select } from "@/components/ui/Input";
import ModalKelas from "@/components/ModalKelas";
import PengumumanCard from "@/components/PengumumanCard";
import TugasCard from "@/components/TugasCard";
import MateriCard, { MateriData } from "@/components/MateriCard";
import FeedCategoryFilter, { FeedCategory } from "@/components/FeedCategoryFilter";
import { ClassDetailOverview, ClassDirectoryNavigation } from "@/components/ClassDetailOverview";
import { showAlert, showConfirm } from "@/lib/dialog";
import { cn } from "@/lib/utils";
import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell";
import { Avatar } from "@/components/shared/avatar";
import { EmptyState, LoadingBlock } from "@/components/shared/data-display";

type AdminTab = "KELAS" | "AKUN" | "LAPORAN";

const ADMIN_TABS: { key: AdminTab; label: string; icon: NavItem["icon"] }[] = [
  { key: "KELAS", label: "Buat Kelas", icon: School },
  { key: "AKUN", label: "Daftar Akun", icon: Users },
  { key: "LAPORAN", label: "Laporan", icon: FileText },
];

interface SiswaDiKelas {
  siswaId: string;
  siswa: {
    id: string;
    nama: string;
    nis: string | null;
    fotoProfil: string | null;
    deskripsi: string | null;
    kelasReferensi: { id: string; label: string } | null;
  };
}
interface GuruDiKelas {
  id: string;
  guru: { id: string; nama: string; nik: string | null; fotoProfil: string | null; deskripsi: string | null };
  mapel: { id: string; nama: string };
}
interface FeedItem {
  tipe: "PENGUMUMAN" | "ASESMEN" | "TUGAS" | "MATERI";
  timestamp: string;
  data: any;
}
interface KelasDetail {
  id: string;
  judul: string;
  deskripsi: string | null;
  inviteToken: string;
  siswa: SiswaDiKelas[];
  guruMapel: GuruDiKelas[];
  feed: FeedItem[];
}

const dangerTextButton =
  "inline-flex min-h-10 cursor-pointer items-center rounded-md px-2 text-xs font-medium text-danger " +
  "transition-colors duration-150 hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring";

const closeButton =
  "inline-flex size-10 cursor-pointer items-center justify-center rounded-md border text-muted-foreground " +
  "transition-colors duration-150 hover:bg-accent hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function AdminKelasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const kelasId = params.id as string;

  const [kelas, setKelas] = useState<KelasDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string; nama: string; role: string; fotoProfil: string | null } | null>(null);

  const [section, setSection] = useState<"SISWA" | "GURU" | null>(null);
  const [expandedRombel, setExpandedRombel] = useState<string | null>(null);
  const [feedCategory, setFeedCategory] = useState<FeedCategory>("SEMUA");

  const [showEditKelas, setShowEditKelas] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showTambahSiswa, setShowTambahSiswa] = useState(false);
  const [showTambahGuru, setShowTambahGuru] = useState(false);
  const canManageClass = me?.role === "ADMIN";

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadKelas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasId]);

  async function loadKelas() {
    setLoading(true);
    try {
      const res = await fetch(`/api/kelas/${kelasId}`);
      const data = await res.json();
      if (res.ok) setKelas(data.data);
    } catch {}
    setLoading(false);
  }

  function handleCopyInvite() {
    if (!kelas) return;
    const link = `${window.location.origin}/join/${kelas.inviteToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function navigateToAdminTab(tab: AdminTab) {
    router.push(`/admin?tab=${tab}`);
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  async function handleHapusSiswa(siswaId: string, kelasIdsLama: string[]) {
    if (!(await showConfirm("Keluarkan siswa ini dari kelas?"))) return;
    await fetch(`/api/akun/${siswaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kelasIds: kelasIdsLama.filter((id) => id !== kelasId) }),
    });
    loadKelas();
  }

  async function handleHapusGuru(guruId: string, mapelId: string, kelasIdsLama: string[]) {
    if (!(await showConfirm("Keluarkan guru ini dari kelas?"))) return;
    await fetch(`/api/akun/${guruId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kelasIds: kelasIdsLama.filter((id) => id !== kelasId), mapelId }),
    });
    loadKelas();
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

  if (!kelas) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-4 text-foreground">
        <p className="text-sm text-muted-foreground">Kelas tidak ditemukan.</p>
        <Button variant="outline" onClick={() => router.push("/admin")}>
          Kembali
        </Button>
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

  const navItems: NavItem[] = canManageClass
    ? ADMIN_TABS.map((tab) => ({
        key: tab.key,
        label: tab.label,
        icon: tab.icon,
        active: tab.key === "KELAS",
        onSelect: () => navigateToAdminTab(tab.key),
      }))
    : [
        { key: "KELAS", label: "Kelas", icon: School, href: "/guru", active: true },
        { key: "ASESMEN", label: "Asesmen", icon: ClipboardCheck, href: "/guru/asesmen" },
        { key: "TUGAS", label: "Tugas", icon: ClipboardList, href: "/guru/tugas" },
        { key: "PROFILE", label: "Profile", icon: User, href: me ? `/profil/${me.id}` : "#" },
      ];

  return (
    <>
      <DashboardShell
        roleLabel={canManageClass ? "Dashboard Admin" : "Dashboard Guru"}
        sectionLabel={canManageClass ? "Detail Kelas" : "Kelas"}
        navItems={navItems}
        me={me}
        onLogout={handleLogout}
        headerActions={
          <Button size="sm" variant="outline" onClick={() => router.push(canManageClass ? "/admin" : "/guru")}>
            Kembali
          </Button>
        }
      >
        <ClassDetailOverview title={kelas.judul} description={kelas.deskripsi} studentCount={kelas.siswa.length} teacherCount={kelas.guruMapel.length} inviteToken={kelas.inviteToken} copied={copied} onCopyInvite={handleCopyInvite} onEdit={canManageClass ? () => setShowEditKelas(true) : undefined} />
        <ClassDirectoryNavigation section={section} onChange={setSection} studentCount={kelas.siswa.length} teacherCount={kelas.guruMapel.length} />

        {/* ============ DERETAN SISWA ============ */}
        {section === "SISWA" && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-tight">Deretan Siswa</h2>
              <div className="flex items-center gap-2">
                {canManageClass && (
                  <Button size="sm" onClick={() => setShowTambahSiswa(true)}>
                    + Tambah Siswa
                  </Button>
                )}
                <button
                  type="button"
                  aria-label="Tutup deretan siswa"
                  onClick={() => setSection(null)}
                  className={closeButton}
                >
                  <X className="size-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {Object.keys(siswaGrouped).length === 0 ? (
              <EmptyState>Belum ada siswa di kelas ini.</EmptyState>
            ) : (
              <div className="space-y-3">
                {Object.entries(siswaGrouped).map(([label, list]) => {
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
                        <ul className="divide-y border-t">
                          {list.map((ks) => (
                            <li key={ks.siswaId} className="flex items-center gap-3 px-4 py-2.5">
                              <Avatar name={ks.siswa.nama} src={ks.siswa.fotoProfil} className="size-9" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{ks.siswa.nama}</p>
                                <p className="text-xs text-muted-foreground">
                                  NIS: <span className="font-mono">{ks.siswa.nis}</span>
                                </p>
                              </div>
                              {canManageClass && (
                                <button
                                  type="button"
                                  onClick={() => handleHapusSiswa(ks.siswa.id, [kelasId])}
                                  className={dangerTextButton}
                                >
                                  Hapus
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============ DERETAN GURU ============ */}
        {section === "GURU" && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-tight">Deretan Guru</h2>
              <div className="flex items-center gap-2">
                {canManageClass && (
                  <Button size="sm" onClick={() => setShowTambahGuru(true)}>
                    + Tambah Guru
                  </Button>
                )}
                <button
                  type="button"
                  aria-label="Tutup deretan guru"
                  onClick={() => setSection(null)}
                  className={closeButton}
                >
                  <X className="size-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {Object.keys(guruGrouped).length === 0 ? (
              <EmptyState>Belum ada guru mengajar di kelas ini.</EmptyState>
            ) : (
              Object.entries(guruGrouped).map(([mapel, list]) => (
                <div key={mapel} className="mb-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{mapel}</p>
                  <ul className="divide-y overflow-hidden rounded-lg border bg-card text-card-foreground">
                    {list.map((gm) => (
                      <li key={gm.id} className="flex items-center gap-3 px-4 py-2.5">
                        <Avatar name={gm.guru.nama} src={gm.guru.fotoProfil} className="size-9" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{gm.guru.nama}</p>
                          <p className="text-xs text-muted-foreground">
                            NIK: <span className="font-mono">{gm.guru.nik}</span>
                          </p>
                        </div>
                        {canManageClass && (
                          <button
                            type="button"
                            onClick={() => handleHapusGuru(gm.guru.id, gm.mapel.id, [kelasId])}
                            className={dangerTextButton}
                          >
                            Hapus
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}

        {/* ============ FEED ============ */}
        {section === null && (
          <div className="mt-8">
            <h2 className="mb-3 text-base font-semibold tracking-tight">Aktivitas Hari Ini</h2>
            <FeedCategoryFilter value={feedCategory} onChange={setFeedCategory} />
            <div className="space-y-3">
              {kelas.feed.length === 0 ? (
                <EmptyState>Belum ada aktivitas di kelas ini.</EmptyState>
              ) : visibleFeed.length === 0 ? (
                <EmptyState>Tidak ada aktivitas untuk filter ini.</EmptyState>
              ) : (
                visibleFeed.map((item, i) => {
                  if (item.tipe === "PENGUMUMAN") {
                    return <PengumumanCard key={`p-${i}`} data={item.data} currentUserId={me?.id ?? ""} />;
                  }
                  if (item.tipe === "TUGAS") {
                    return <TugasCard key={`t-${i}`} data={item.data} currentUserId={me?.id ?? ""} role="ADMIN" />;
                  }
                  if (item.tipe === "MATERI") return <MateriCard key={`m-${item.data.id}`} data={item.data as MateriData} />;
                  const a = item.data;
                  return (
                    <div key={`a-${i}`} className="rounded-lg border bg-card p-4 text-card-foreground">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="brand">{a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
                        {a.mapel && <Badge tone="gray">{a.mapel.nama}</Badge>}
                      </div>
                      <p className="mt-2 text-sm font-semibold">{a.judul}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="tabular-nums">{a._count?.soal ?? 0}</span> soal · oleh {a.guru?.nama}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </DashboardShell>

      {canManageClass && <ModalKelas open={showEditKelas} onClose={() => setShowEditKelas(false)} onSuccess={loadKelas} mode="edit" initialData={kelas} />}

      {canManageClass && (
        <ModalTambahSiswa
          open={showTambahSiswa}
          onClose={() => setShowTambahSiswa(false)}
          onSuccess={loadKelas}
          kelasId={kelasId}
          kelasName={kelas.judul}
          siswaSudahAda={kelas.siswa.map((ks) => ks.siswaId)}
        />
      )}

      {canManageClass && (
        <ModalTambahGuru
          open={showTambahGuru}
          onClose={() => setShowTambahGuru(false)}
          onSuccess={loadKelas}
          kelasId={kelasId}
          guruSudahAda={kelas.guruMapel.map((gm) => gm.guru.id)}
        />
      )}
    </>
  );
}

function ModalTambahSiswa({
  open,
  onClose,
  onSuccess,
  kelasId,
  kelasName,
  siswaSudahAda,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kelasId: string;
  kelasName: string;
  siswaSudahAda: string[];
}) {
  const [rombelList, setRombelList] = useState<{ id: string; label: string }[]>([]);
  const [rombelId, setRombelId] = useState("");
  const [kandidat, setKandidat] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState("");

  useEffect(() => {
    if (!open) return;
    setRombelId("");
    setKandidat([]);
    setSelectedIds([]);
    setBulkError("");
    fetch("/api/kelas-referensi")
      .then((res) => res.json())
      .then((data) => setRombelList(data.data ?? []))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!rombelId) {
      setKandidat([]);
      return;
    }
    setLoading(true);
    fetch("/api/akun?role=SISWA")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.data ?? []).filter(
          (s: any) => s.kelasReferensi?.id === rombelId && !siswaSudahAda.includes(s.id)
        );
        setKandidat(list);
      })
      .finally(() => setLoading(false));
  }, [rombelId, siswaSudahAda]);

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleAddAllRombel() {
    const rombel = rombelList.find((item) => item.id === rombelId);
    if (!rombel || kandidat.length === 0) return;
    if (!(await showConfirm(`Tambahkan semua ${kandidat.length} siswa yang belum tergabung dari rombel ${rombel.label} ke kelas ${kelasName}? Siswa yang sudah ada akan dilewati.`))) return;

    setSubmitting(true);
    setBulkError("");
    try {
      const response = await fetch(`/api/kelas/${encodeURIComponent(kelasId)}/siswa/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rombelId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setBulkError(payload.error ?? "Siswa rombel gagal ditambahkan.");
        return;
      }
      await showAlert(`${payload.data.ditambahkan} siswa ditambahkan; ${payload.data.dilewati} siswa dilewati karena sudah tergabung di ${payload.data.kelas}.`);
      onSuccess();
      onClose();
    } catch {
      setBulkError("Siswa rombel gagal ditambahkan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await Promise.all(
        selectedIds.map((siswaId) => {
          const siswa = kandidat.find((k) => k.id === siswaId);
          const kelasIdsLama = (siswa?.kelasSiswa ?? []).map((ks: any) => ks.kelas.id);
          return fetch(`/api/akun/${siswaId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kelasIds: [...kelasIdsLama, kelasId] }),
          });
        })
      );
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Siswa">
      <div className="space-y-4">
        <Select label="Pilih Kelas/Rombel" placeholder="Pilih rombel dulu" value={rombelId} onChange={(e) => setRombelId(e.target.value)}>
          {rombelList.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </Select>

        <Button className="w-full" variant="outline" loading={submitting} disabled={!rombelId || kandidat.length === 0 || loading || submitting} onClick={() => void handleAddAllRombel()}>
          Tambah semua siswa rombel{kandidat.length > 0 ? ` (${kandidat.length})` : ""}
        </Button>
        {bulkError && <p role="alert" className="text-sm font-medium text-danger">{bulkError}</p>}

        {loading && <p className="text-xs text-muted-foreground">Memuat...</p>}

        {!loading && rombelId && kandidat.length === 0 && (
          <p className="text-xs text-muted-foreground">Semua siswa di rombel ini sudah ada di kelas.</p>
        )}

        {kandidat.length > 0 && (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {kandidat.map((s) => (
              <label key={s.id} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 transition-colors duration-100 hover:bg-accent">
                <input type="checkbox" className="size-4 accent-brand" checked={selectedIds.includes(s.id)} onChange={() => toggle(s.id)} />
                <span className="text-sm">{s.nama}</span>
                <span className="font-mono text-xs text-muted-foreground">{s.nis}</span>
              </label>
            ))}
          </div>
        )}

        <Button className="w-full" loading={submitting} disabled={selectedIds.length === 0} onClick={handleSubmit}>
          Tambah {selectedIds.length > 0 ? `(${selectedIds.length})` : ""} Siswa
        </Button>
      </div>
    </Modal>
  );
}

function ModalTambahGuru({
  open,
  onClose,
  onSuccess,
  kelasId,
  guruSudahAda,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kelasId: string;
  guruSudahAda: string[];
}) {
  const [guruList, setGuruList] = useState<any[]>([]);
  const [mapelList, setMapelList] = useState<{ id: string; nama: string }[]>([]);
  const [guruId, setGuruId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setGuruId("");
    setMapelId("");
    fetch("/api/akun?role=GURU")
      .then((res) => res.json())
      .then((data) => setGuruList((data.data ?? []).filter((g: any) => !guruSudahAda.includes(g.id))))
      .catch(() => {});
    fetch("/api/mapel")
      .then((res) => res.json())
      .then((data) => setMapelList(data.data ?? []))
      .catch(() => {});
  }, [open, guruSudahAda]);

  useEffect(() => {
    const guru = guruList.find((g) => g.id === guruId);
    const mapelExisting = guru?.kelasGuruMapel?.[0]?.mapel?.id;
    if (mapelExisting) setMapelId(mapelExisting);
  }, [guruId, guruList]);

  async function handleSubmit() {
    if (!guruId || !mapelId) return;
    setSubmitting(true);
    try {
      const guru = guruList.find((g) => g.id === guruId);
      const kelasIdsLama = (guru?.kelasGuruMapel ?? []).map((kg: any) => kg.kelas.id);
      await fetch(`/api/akun/${guruId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelasIds: [...kelasIdsLama, kelasId], mapelId }),
      });
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Guru">
      <div className="space-y-4">
        <Select label="Pilih Guru" placeholder="Pilih guru" value={guruId} onChange={(e) => setGuruId(e.target.value)}>
          {guruList.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
            </option>
          ))}
        </Select>

        <Select label="Mapel" placeholder="Pilih mapel" value={mapelId} onChange={(e) => setMapelId(e.target.value)}>
          {mapelList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama}
            </option>
          ))}
        </Select>

        <Button className="w-full" loading={submitting} disabled={!guruId || !mapelId} onClick={handleSubmit}>
          Tambah Guru
        </Button>
      </div>
    </Modal>
  );
}