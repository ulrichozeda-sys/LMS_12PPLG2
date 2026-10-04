"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChartColumn,
  EllipsisVertical,
  FileText,
  LayoutDashboard,
  School,
  Users,
  type LucideIcon,
} from "lucide-react";
import KelasCard, { KelasData } from "@/components/KelasCard";
import ModalKelas from "@/components/ModalKelas";
import { AkunData } from "@/components/AkunCard";
import ModalAkun from "@/components/ModalAkun";
import LaporanCard, { LaporanData } from "@/components/LaporanCard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { showConfirm } from "@/lib/dialog";
import { cn } from "@/lib/utils";
import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell";
import { Avatar } from "@/components/shared/avatar";
import {
  BarRow,
  EmptyState,
  LoadingBlock,
  PageTitle,
  Panel,
  StatCell,
  StatGrid,
  StatusDot,
  TableWrap,
} from "@/components/shared/data-display";
import {
  Field,
  SearchInput,
  SegmentedControl,
  SelectInput,
} from "@/components/shared/form-controls";

type Tab = "DASHBOARD" | "KELAS" | "AKUN" | "LAPORAN" | "PERFORMA";

interface AdminDashboardData {
  statistik: { kelas: number; siswa: number; guru: number; asesmen: number; tugas: number; mapel: number; laporanPending: number; kuis: number; ujian: number; rataRataNilai: number; submissionDinilai: number; tugasDibuat: number; tugasDikumpulkan: number };
  akunTerbaru: { id: string; nama: string; email: string; role: "SISWA" | "GURU"; createdAt: string }[];
  aktivitas: { periodeHari: number; userAktif: number; siswaAktif: number; guruAktif: number; aktivitasHarian: { tanggal: string; asesmen: number; tugas: number; submission: number; userAktif: number }[] };
}

function normalizeDashboardData(data: (Omit<AdminDashboardData, "aktivitas"> & { aktivitas?: AdminDashboardData["aktivitas"] }) | null | undefined): AdminDashboardData | null {
  if (!data) return null;
  return {
    ...data,
    aktivitas: data.aktivitas ?? {
      periodeHari: 14,
      userAktif: 0,
      siswaAktif: 0,
      guruAktif: 0,
      aktivitasHarian: [],
    },
  };
}

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "DASHBOARD", label: "Dashboard", icon: LayoutDashboard },
  { key: "KELAS", label: "Buat Kelas", icon: School },
  { key: "AKUN", label: "Daftar Akun", icon: Users },
  { key: "LAPORAN", label: "Laporan", icon: FileText },
  { key: "PERFORMA", label: "Performa Akademik", icon: ChartColumn },
];

const th = "px-3 py-2.5 font-medium";
const td = "px-3 py-2.5";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("DASHBOARD");
  const [accountRole, setAccountRole] = useState<"SISWA" | "GURU">("SISWA");
  const [me, setMe] = useState<{ nama: string; role: string; fotoProfil: string | null } | null>(null);

  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [siswaList, setSiswaList] = useState<AkunData[]>([]);
  const [guruList, setGuruList] = useState<AkunData[]>([]);
  const [mapelList, setMapelList] = useState<{ id: string; nama: string }[]>([]);
  const [kelasReferensiList, setKelasReferensiList] = useState<{ id: string; label: string; jenjang: string; tingkat: number | null; jurusan: { nama: string } | null }[]>([]);
  const [laporanList, setLaporanList] = useState<LaporanData[]>([]);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const [openAkunMenuId, setOpenAkunMenuId] = useState<string | null>(null);
  const [jurusanFilter, setJurusanFilter] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [rombelFilter, setRombelFilter] = useState("");
  const [siswaSearch, setSiswaSearch] = useState("");
  const [bulkTargetClassId, setBulkTargetClassId] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [mapelFilter, setMapelFilter] = useState("");
  const [guruSearch, setGuruSearch] = useState("");

  const [showModalKelas, setShowModalKelas] = useState(false);
  const [editingKelas, setEditingKelas] = useState<KelasData | null>(null);
  const [deletingKelas, setDeletingKelas] = useState<KelasData | null>(null);

  const [showModalAkun, setShowModalAkun] = useState(false);
  const [akunMode, setAkunMode] = useState<"create" | "edit">("create");
  const [akunDefaultRole, setAkunDefaultRole] = useState<"SISWA" | "GURU">("SISWA");
  const [editingAkun, setEditingAkun] = useState<any>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "SISWA" || requestedTab === "GURU") {
      setAccountRole(requestedTab);
      setActiveTab("AKUN");
    } else if (TABS.some((tab) => tab.key === requestedTab)) {
      setActiveTab(requestedTab as Tab);
    }
  }, []);

  useEffect(() => {
    loadTabData(activeTab, accountRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, accountRole]);

  async function loadTabData(tab: Tab, selectedRole: "SISWA" | "GURU" = accountRole) {
    setLoading(true);
    try {
      if (tab === "DASHBOARD") {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        setDashboardData(normalizeDashboardData(data.data));
      } else if (tab === "KELAS") {
        const res = await fetch("/api/kelas");
        const data = await res.json();
        setKelasList(data.data ?? []);
      } else if (tab === "AKUN" && selectedRole === "SISWA") {
        const [res, referensiRes, kelasRes] = await Promise.all([fetch("/api/akun?role=SISWA"), fetch("/api/kelas-referensi"), fetch("/api/kelas")]);
        const [data, referensiData, kelasData] = await Promise.all([res.json(), referensiRes.json(), kelasRes.json()]);
        setSiswaList(data.data ?? []);
        setKelasReferensiList(referensiData.data ?? []);
        setKelasList(kelasData.data ?? []);
      } else if (tab === "AKUN" && selectedRole === "GURU") {
        const [res, mapelRes] = await Promise.all([fetch("/api/akun?role=GURU"), fetch("/api/mapel")]);
        const [data, mapelData] = await Promise.all([res.json(), mapelRes.json()]);
        setGuruList(data.data ?? []);
        setMapelList(data.data ? mapelData.data ?? [] : []);
      } else if (tab === "LAPORAN") {
        const res = await fetch("/api/lupa-password");
        const data = await res.json();
        setLaporanList(data.data ?? []);
      } else if (tab === "PERFORMA") {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        setDashboardData(normalizeDashboardData(data.data));
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function openBuatKelas() {
    setEditingKelas(null);
    setShowModalKelas(true);
  }
  function openEditKelas(kelas: KelasData) {
    setEditingKelas(kelas);
    setShowModalKelas(true);
  }
  async function handleDeleteKelas() {
    if (!deletingKelas) return;
    const res = await fetch(`/api/kelas/${deletingKelas.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeletingKelas(null);
      loadTabData("KELAS");
    }
  }

  function openBuatAkun(role: "SISWA" | "GURU") {
    setAkunMode("create");
    setAkunDefaultRole(role);
    setEditingAkun(null);
    setShowModalAkun(true);
  }
  function openEditAkun(akun: AkunData) {
    setAkunMode("edit");
    setAkunDefaultRole(akun.role);

    const a = akun as any;
    setEditingAkun({
      id: akun.id,
      role: akun.role,
      email: akun.email,
      nama: akun.nama,
      nis: akun.nis,
      nik: akun.nik,
      deskripsi: akun.deskripsi,
      fotoProfil: akun.fotoProfil,
      tanggalLahir: a.tanggalLahir,
      jenisKelamin: a.jenisKelamin,
      kelasReferensiId: a.kelasReferensi?.id,
      mapelId: a.kelasGuruMapel?.[0]?.mapel?.id,
      kelasIds:
        akun.role === "SISWA"
          ? (a.kelasSiswa ?? []).map((ks: any) => ks.kelas.id)
          : (a.kelasGuruMapel ?? []).map((kg: any) => kg.kelas.id),
      // walasKelasId dihapus -- fitur walas gak ada lagi
    });
    setShowModalAkun(true);
  }
  async function handleDeleteAkun(id: string, tab: "SISWA" | "GURU") {
    if (!(await showConfirm("Hapus akun ini?"))) return;
    const res = await fetch(`/api/akun/${id}`, { method: "DELETE" });
    if (res.ok) loadTabData("AKUN", tab);
  }

  function toggleAkunMenu(id: string) {
    setOpenAkunMenuId((current) => (current === id ? null : id));
  }

  const jurusanOptions = Array.from(new Set(kelasReferensiList.map((kelas) => kelas.jurusan?.nama).filter(Boolean))) as string[];
  const kelasOptions = ["SMP", "SMA", "10", "11", "12"];
  const filteredRombelOptions = kelasReferensiList.filter((referensi) => {
    const level = referensi.jenjang === "SMP" || referensi.jenjang === "SMA" ? referensi.jenjang : referensi.tingkat?.toString() ?? "";
    return (!jurusanFilter || referensi.jurusan?.nama === jurusanFilter) && (!kelasFilter || level === kelasFilter);
  });
  const filteredSiswaList = siswaList.filter((siswa) => {
    const jurusan = siswa.kelasReferensi?.jurusan?.nama ?? "";
    const tingkat = siswa.kelasReferensi?.jenjang === "SMP" || siswa.kelasReferensi?.jenjang === "SMA"
      ? siswa.kelasReferensi.jenjang
      : siswa.kelasReferensi?.tingkat?.toString() ?? "";
    const query = siswaSearch.trim().toLowerCase();
    const cocokJurusan = !jurusanFilter || jurusan === jurusanFilter;
    const cocokKelas = !kelasFilter || tingkat === kelasFilter;
    const cocokRombel = !rombelFilter || siswa.kelasReferensi?.id === rombelFilter;
    const cocokSearch = !query || [siswa.nama, siswa.email, siswa.nis ?? ""].some((value) => value.toLowerCase().includes(query));
    return cocokJurusan && cocokKelas && cocokRombel && cocokSearch;
  });
  const hasStudentFilter = Boolean(jurusanFilter || kelasFilter || rombelFilter || siswaSearch.trim());
  const mapelOptions = mapelList.map((mapel) => mapel.nama);
  const filteredGuruList = guruList.filter((guru) => {
    const mapel = guru.kelasGuruMapel?.map((item) => item.mapel.nama) ?? [];
    const query = guruSearch.trim().toLowerCase();
    const cocokMapel = !mapelFilter || mapel.includes(mapelFilter);
    const cocokSearch = !query || [guru.nama, guru.email, guru.nik ?? ""].some((value) => value.toLowerCase().includes(query));
    return cocokMapel && cocokSearch;
  });

  async function handleSendFilteredStudents() {
    const targetClass = kelasList.find((kelas) => kelas.id === bulkTargetClassId);
    if (!targetClass || filteredSiswaList.length === 0) return;
    const confirmed = await showConfirm(`Kirim ${filteredSiswaList.length} siswa hasil filter ke kelas ${targetClass.judul}? Siswa yang sudah menjadi anggota kelas tujuan akan dilewati.`);
    if (!confirmed) return;

    setBulkSending(true);
    setBulkResult(null);
    try {
      const response = await fetch(`/api/kelas/${encodeURIComponent(targetClass.id)}/siswa/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jurusan: jurusanFilter || undefined,
          kelas: kelasFilter || undefined,
          rombelId: rombelFilter || undefined,
          search: siswaSearch.trim() || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setBulkResult({ type: "error", text: payload.error ?? "Pengiriman siswa gagal." });
        return;
      }
      setBulkResult({
        type: "success",
        text: `${payload.data.ditambahkan} siswa ditambahkan ke ${payload.data.kelas}; ${payload.data.dilewati} siswa dilewati karena sudah tergabung.`,
      });
      await loadTabData("AKUN", "SISWA");
    } catch {
      setBulkResult({ type: "error", text: "Pengiriman siswa gagal. Coba lagi." });
    } finally {
      setBulkSending(false);
    }
  }

  function openAdminTab(tab: Tab) {
    setActiveTab(tab);
  }

  function openAccount(role: "SISWA" | "GURU") {
    setAccountRole(role);
    openAdminTab("AKUN");
  }

  function handleStatClick(tab: Tab | "SISWA" | "GURU") {
    if (tab === "SISWA") openAccount("SISWA");
    else if (tab === "GURU") openAccount("GURU");
    else openAdminTab(tab);
  }

  const navItems: NavItem[] = TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    icon: tab.icon,
    active: activeTab === tab.key,
    onSelect: () => setActiveTab(tab.key),
  }));

  const statCards: { label: string; value: number; caption: string; tab: Tab | "SISWA" | "GURU" }[] = dashboardData
    ? [
        { label: "Kelas", value: dashboardData.statistik.kelas, caption: "Kelola kelas", tab: "KELAS" },
        { label: "Siswa", value: dashboardData.statistik.siswa, caption: "Daftar siswa", tab: "SISWA" },
        { label: "Guru", value: dashboardData.statistik.guru, caption: "Daftar guru", tab: "GURU" },
        { label: "Asesmen", value: dashboardData.statistik.asesmen, caption: "Kuis dan ujian", tab: "KELAS" },
        { label: "Tugas", value: dashboardData.statistik.tugas, caption: "Tugas dibuat", tab: "KELAS" },
        { label: "Mata Pelajaran", value: dashboardData.statistik.mapel, caption: "Mapel tersedia", tab: "GURU" },
        { label: "Laporan Pending", value: dashboardData.statistik.laporanPending, caption: "Perlu ditinjau", tab: "LAPORAN" },
        { label: "Rata-rata Nilai", value: dashboardData.statistik.rataRataNilai, caption: "Dari asesmen dinilai", tab: "PERFORMA" },
      ]
    : [];

  return (
    <>
      <DashboardShell
        roleLabel="Dashboard Admin"
        sectionLabel={TABS.find((t) => t.key === activeTab)?.label}
        navItems={navItems}
        me={me}
        onLogout={handleLogout}
        maxWidth="max-w-7xl"
      >
        {loading && <LoadingBlock />}

        {/* ============ DASHBOARD ============ */}
        {!loading && activeTab === "DASHBOARD" && dashboardData && (
          <div className="space-y-6">
            <PageTitle
              title={`Selamat Datang, ${me?.nama ?? "Admin"}`}
              description="Kelola akun, kelas, dan aktivitas pembelajaran MyClass dari satu tempat."
            />

            <StatGrid>
              {statCards.map((card) => (
                <StatCell
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  caption={card.caption}
                  onClick={() => handleStatClick(card.tab)}
                />
              ))}
            </StatGrid>

            <Panel
              title="Akun Terbaru"
              description="Lima akun siswa dan guru terakhir dibuat."
              actions={
                <Button size="sm" variant="outline" onClick={() => openAccount("SISWA")}>
                  Kelola Akun
                </Button>
              }
            >
              {dashboardData.akunTerbaru.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada akun.</p>
              ) : (
                <ul className="-my-2 divide-y">
                  {dashboardData.akunTerbaru.map((akun) => (
                    <li key={akun.id}>
                      <button
                        type="button"
                        onClick={() => router.push(`/profil/${akun.id}`)}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 py-3 text-left transition-colors duration-100 hover:bg-accent"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{akun.nama}</span>
                          <span className="block truncate text-xs text-muted-foreground">{akun.email}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <Badge tone={akun.role === "GURU" ? "brand" : "gray"}>
                            {akun.role === "GURU" ? "Guru" : "Siswa"}
                          </Badge>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {new Date(akun.createdAt).toLocaleDateString("id-ID")}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        )}

        {/* ============ PERFORMA ============ */}
        {!loading && activeTab === "PERFORMA" && dashboardData && (
          <div className="space-y-6">
            <PageTitle
              title="Performa Akademik & Data"
              description="Pantau nilai, aktivitas pembelajaran, dan pengguna aktif berdasarkan data nyata sistem."
            />

            <StatGrid>
              <StatCell label="Rata-rata Nilai" value={dashboardData.statistik.rataRataNilai} caption="Nilai asesmen dinilai" />
              <StatCell label="Asesmen Dinilai" value={dashboardData.statistik.submissionDinilai} caption="Submission dengan nilai" />
              <StatCell label="Tugas Dibuat" value={dashboardData.statistik.tugasDibuat} caption="Total tugas guru" />
              <StatCell label="Tugas Dikumpulkan" value={dashboardData.statistik.tugasDikumpulkan} caption="Submission siswa" />
            </StatGrid>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Kuis dan Ujian">
                <div className="space-y-4">
                  {(() => {
                    const max = Math.max(dashboardData.statistik.kuis, dashboardData.statistik.ujian, 1);
                    return (
                      <>
                        <BarRow label="Kuis" value={dashboardData.statistik.kuis} max={max} tone={1} />
                        <BarRow label="Ujian Online" value={dashboardData.statistik.ujian} max={max} tone={3} />
                      </>
                    );
                  })()}
                </div>
              </Panel>
              <Panel title="Tugas Dibuat vs Dikumpulkan">
                <div className="space-y-4">
                  {(() => {
                    const max = Math.max(dashboardData.statistik.tugasDibuat, dashboardData.statistik.tugasDikumpulkan, 1);
                    return (
                      <>
                        <BarRow label="Tugas dibuat" value={dashboardData.statistik.tugasDibuat} max={max} tone={1} />
                        <BarRow label="Dikumpulkan siswa" value={dashboardData.statistik.tugasDikumpulkan} max={max} tone={3} />
                      </>
                    );
                  })()}
                </div>
              </Panel>
            </div>

            <StatGrid>
              <StatCell label="User aktif 14 hari" value={dashboardData.aktivitas.userAktif} caption="User dengan aktivitas nyata" />
              <StatCell label="Siswa aktif" value={dashboardData.aktivitas.siswaAktif} caption="Mengerjakan atau mengumpulkan" />
              <StatCell label="Guru aktif" value={dashboardData.aktivitas.guruAktif} caption="Membuat asesmen atau tugas" />
              <StatCell label="Total user" value={dashboardData.statistik.siswa + dashboardData.statistik.guru} caption="Siswa dan guru terdaftar" />
            </StatGrid>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Grafik Linear User Aktif" description="Jumlah user yang melakukan aktivitas nyata setiap hari.">
                <ActiveUsersLineChart items={dashboardData.aktivitas.aktivitasHarian} />
              </Panel>
              <Panel title="Grafik Batang Distribusi Data" description="Perbandingan data utama yang tersimpan di sistem.">
                <div className="space-y-3">
                  {(() => {
                    const s = dashboardData.statistik;
                    const max = Math.max(s.siswa, s.guru, s.kelas, s.asesmen, s.tugas, 1);
                    return (
                      <>
                        <BarRow label="Siswa" value={s.siswa} max={max} tone={1} />
                        <BarRow label="Guru" value={s.guru} max={max} tone={2} />
                        <BarRow label="Kelas" value={s.kelas} max={max} tone={3} />
                        <BarRow label="Asesmen" value={s.asesmen} max={max} tone={4} />
                        <BarRow label="Tugas" value={s.tugas} max={max} tone={5} />
                      </>
                    );
                  })()}
                </div>
              </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Rincian Data Sistem">
                <ul className="-my-3 divide-y">
                  {[
                    ["Mata pelajaran", dashboardData.statistik.mapel, "Mapel tersedia"],
                    ["Kuis", dashboardData.statistik.kuis, "Asesmen tipe kuis"],
                    ["Ujian online", dashboardData.statistik.ujian, "Asesmen tipe ujian"],
                    ["Submission dinilai", dashboardData.statistik.submissionDinilai, "Memiliki nilai akhir"],
                    ["Tugas dikumpulkan", dashboardData.statistik.tugasDikumpulkan, "Status submission sudah"],
                  ].map(([label, value, detail]) => (
                    <li key={label as string} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{detail}</p>
                      </div>
                      <strong className="text-base font-semibold tabular-nums">{value}</strong>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Definisi User Aktif">
                <p className="text-sm leading-6 text-muted-foreground">
                  User aktif bukan dihitung dari login karena sistem belum menyimpan log login. Angka ini menghitung siswa yang mengerjakan asesmen atau mengumpulkan tugas, serta guru yang membuat asesmen atau tugas dalam 14 hari terakhir.
                </p>
                <div className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  <p>
                    <strong className="font-medium text-foreground">Periode:</strong> 14 hari terakhir
                  </p>
                  <p className="mt-2">
                    <strong className="font-medium text-foreground">Sumber:</strong> asesmen, tugas, submission asesmen, dan submission tugas
                  </p>
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* ============ KELAS ============ */}
        {!loading && activeTab === "KELAS" && (
          <div className="space-y-4">
            <PageTitle
              title="Kelas"
              description="Buat dan kelola kelas di MyClass."
              actions={<Button onClick={openBuatKelas}>Buat Kelas</Button>}
            />

            {kelasList.length === 0 ? (
              <EmptyState>Belum ada kelas dibuat.</EmptyState>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {kelasList.map((k) => (
                  <KelasCard
                    key={k.id}
                    data={k}
                    isEditable
                    basePath="/admin/kelas"
                    onEdit={openEditKelas}
                    onDelete={() => setDeletingKelas(k)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ AKUN ============ */}
        {!loading && activeTab === "AKUN" && (
          <div className="space-y-4">
            <SegmentedControl
              ariaLabel="Jenis akun"
              value={accountRole}
              onChange={setAccountRole}
              options={[
                { value: "SISWA", label: "Siswa" },
                { value: "GURU", label: "Guru" },
              ]}
            />

            {accountRole === "SISWA" && (
              <Panel
                title="Daftar Siswa"
                description="Kelola akun dan kelas siswa."
                actions={
                  <Button size="sm" onClick={() => openBuatAkun("SISWA")}>
                    + Buat Akun
                  </Button>
                }
              >
                <div className="mb-4 grid gap-3 rounded-md border bg-muted p-3 sm:grid-cols-2 xl:grid-cols-[180px_180px_220px_minmax(220px,1fr)_auto] xl:items-end">
                  <Field label="Jurusan">
                    <SelectInput
                      value={jurusanFilter}
                      onChange={(event) => {
                        setJurusanFilter(event.target.value);
                        setRombelFilter("");
                        setBulkResult(null);
                      }}
                    >
                      <option value="">Semua Jurusan</option>
                      {jurusanOptions.map((jurusan) => (
                        <option key={jurusan} value={jurusan}>{jurusan}</option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Kelas">
                    <SelectInput
                      value={kelasFilter}
                      onChange={(event) => {
                        setKelasFilter(event.target.value);
                        setRombelFilter("");
                        setBulkResult(null);
                      }}
                    >
                      <option value="">Semua Kelas</option>
                      {kelasOptions.map((kelas) => (
                        <option key={kelas} value={kelas}>{kelas}</option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Rombel">
                    <SelectInput
                      value={rombelFilter}
                      onChange={(event) => {
                        setRombelFilter(event.target.value);
                        setBulkResult(null);
                      }}
                    >
                      <option value="">Semua Rombel</option>
                      {filteredRombelOptions.map((referensi) => (
                        <option key={referensi.id} value={referensi.id}>{referensi.label}</option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Pencarian">
                    <SearchInput
                      value={siswaSearch}
                      onChange={(event) => {
                        setSiswaSearch(event.target.value);
                        setBulkResult(null);
                      }}
                      placeholder="Nama, email, atau NIS..."
                    />
                  </Field>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setJurusanFilter("");
                      setKelasFilter("");
                      setRombelFilter("");
                      setSiswaSearch("");
                      setBulkResult(null);
                    }}
                  >
                    Reset
                  </Button>
                </div>

                {hasStudentFilter && filteredSiswaList.length > 0 && (
                  <section className="mb-4 rounded-md border p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-semibold">Kirim hasil filter ke kelas</h3>
                      <p className="text-xs tabular-nums text-muted-foreground">{filteredSiswaList.length} siswa cocok</p>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <SelectInput
                        aria-label="Kelas tujuan"
                        value={bulkTargetClassId}
                        onChange={(event) => setBulkTargetClassId(event.target.value)}
                        className="min-w-0 flex-1"
                      >
                        <option value="">Pilih kelas tujuan</option>
                        {kelasList.map((kelas) => (
                          <option key={kelas.id} value={kelas.id}>{kelas.judul}</option>
                        ))}
                      </SelectInput>
                      <Button
                        size="sm"
                        loading={bulkSending}
                        disabled={!bulkTargetClassId || bulkSending}
                        onClick={() => void handleSendFilteredStudents()}
                      >
                        Kirim ke Kelas
                      </Button>
                    </div>
                    {bulkResult && (
                      <p
                        role={bulkResult.type === "error" ? "alert" : "status"}
                        className={cn(
                          "mt-3 text-sm",
                          bulkResult.type === "error" ? "font-medium text-danger" : "text-foreground",
                        )}
                      >
                        {bulkResult.text}
                      </p>
                    )}
                  </section>
                )}

                {filteredSiswaList.length === 0 ? (
                  <EmptyState>Belum ada siswa terdaftar.</EmptyState>
                ) : (
                  <TableWrap>
                    <table className="w-full min-w-[820px] text-left text-sm">
                      <thead className="bg-muted text-xs text-muted-foreground">
                        <tr>
                          <th className={th}>No</th>
                          <th className={th}>Nama</th>
                          <th className={th}>Email</th>
                          <th className={th}>NIS</th>
                          <th className={th}>Status Siswa</th>
                          <th className={th}>Kelas/Rombel</th>
                          <th className={th}>Jurusan</th>
                          <th className={cn(th, "text-right")}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredSiswaList.map((s, index) => (
                          <tr
                            key={s.id}
                            onClick={() => router.push(`/profil/${s.id}`)}
                            className="cursor-pointer transition-colors duration-100 hover:bg-accent"
                          >
                            <td className={cn(td, "tabular-nums text-muted-foreground")}>{index + 1}</td>
                            <td className={td}>
                              <div className="flex items-center gap-2.5">
                                <Avatar name={s.nama} src={s.fotoProfil} />
                                <span className="font-medium">{s.nama}</span>
                              </div>
                            </td>
                            <td className={cn(td, "text-xs text-muted-foreground")}>{s.email}</td>
                            <td className={cn(td, "font-mono text-xs text-muted-foreground")}>{s.nis ?? "-"}</td>
                            <td className={td}><StatusDot>Aktif</StatusDot></td>
                            <td
                              className={cn(td, "text-xs tabular-nums text-muted-foreground")}
                              title={s.kelasSiswa?.map((item) => item.kelas.judul).join(", ") || "Belum ada kelas"}
                            >
                              {s.kelasSiswa?.length ?? 0} Kelas
                            </td>
                            <td className={cn(td, "text-xs text-muted-foreground")}>{s.kelasReferensi?.label ?? "-"}</td>
                            <AkunRowActions
                              open={openAkunMenuId === s.id}
                              onToggle={() => toggleAkunMenu(s.id)}
                              onEdit={() => {
                                setOpenAkunMenuId(null);
                                openEditAkun(s);
                              }}
                              onDelete={() => {
                                setOpenAkunMenuId(null);
                                void handleDeleteAkun(s.id, "SISWA");
                              }}
                            />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableWrap>
                )}
              </Panel>
            )}

            {accountRole === "GURU" && (
              <Panel
                title="Daftar Guru"
                description="Kelola akun guru dan mapel yang diampu."
                actions={
                  <Button size="sm" onClick={() => openBuatAkun("GURU")}>
                    + Tambah Guru
                  </Button>
                }
              >
                <div className="mb-4 grid gap-3 rounded-md border bg-muted p-3 md:grid-cols-[240px_minmax(220px,1fr)_auto] md:items-end">
                  <Field label="Mapel">
                    <SelectInput value={mapelFilter} onChange={(event) => setMapelFilter(event.target.value)}>
                      <option value="">Semua Mapel</option>
                      {mapelOptions.map((mapel) => (
                        <option key={mapel} value={mapel}>{mapel}</option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Pencarian">
                    <SearchInput
                      value={guruSearch}
                      onChange={(event) => setGuruSearch(event.target.value)}
                      placeholder="Nama, email, atau NIK..."
                    />
                  </Field>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMapelFilter("");
                      setGuruSearch("");
                    }}
                  >
                    Reset
                  </Button>
                </div>

                {filteredGuruList.length === 0 ? (
                  <EmptyState>Belum ada guru terdaftar.</EmptyState>
                ) : (
                  <TableWrap>
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-muted text-xs text-muted-foreground">
                        <tr>
                          <th className={th}>No</th>
                          <th className={th}>Nama</th>
                          <th className={th}>Email</th>
                          <th className={th}>NIK</th>
                          <th className={th}>Status Guru</th>
                          <th className={th}>Mapel</th>
                          <th className={cn(th, "text-right")}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredGuruList.map((g, index) => (
                          <tr
                            key={g.id}
                            onClick={() => router.push(`/profil/${g.id}`)}
                            className="cursor-pointer transition-colors duration-100 hover:bg-accent"
                          >
                            <td className={cn(td, "tabular-nums text-muted-foreground")}>{index + 1}</td>
                            <td className={td}>
                              <div className="flex items-center gap-2.5">
                                <Avatar name={g.nama} src={g.fotoProfil} />
                                <span className="font-medium">{g.nama}</span>
                              </div>
                            </td>
                            <td className={cn(td, "text-xs text-muted-foreground")}>{g.email}</td>
                            <td className={cn(td, "font-mono text-xs text-muted-foreground")}>{g.nik ?? "-"}</td>
                            <td className={td}><StatusDot>Aktif</StatusDot></td>
                            <td className={cn(td, "text-xs text-muted-foreground")}>
                              {Array.from(new Set(g.kelasGuruMapel?.map((item) => item.mapel.nama) ?? [])).join(", ") || "Belum ada mapel"}
                            </td>
                            <AkunRowActions
                              open={openAkunMenuId === g.id}
                              onToggle={() => toggleAkunMenu(g.id)}
                              onEdit={() => {
                                setOpenAkunMenuId(null);
                                openEditAkun(g);
                              }}
                              onDelete={() => {
                                setOpenAkunMenuId(null);
                                void handleDeleteAkun(g.id, "GURU");
                              }}
                            />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableWrap>
                )}
              </Panel>
            )}
          </div>
        )}

        {/* ============ LAPORAN ============ */}
        {!loading && activeTab === "LAPORAN" && (
          <div className="space-y-4">
            <PageTitle
              title="Laporan"
              description="Laporan lupa password dari siswa dan petugas."
            />
            {laporanList.length === 0 ? (
              <EmptyState>Tidak ada laporan lupa password saat ini.</EmptyState>
            ) : (
              <div className="space-y-3">
                {laporanList.map((l) => (
                  <LaporanCard key={l.id} data={l} onUpdated={() => loadTabData("LAPORAN")} />
                ))}
              </div>
            )}
          </div>
        )}
      </DashboardShell>

      <ModalKelas
        open={showModalKelas}
        onClose={() => setShowModalKelas(false)}
        onSuccess={() => loadTabData("KELAS")}
        mode={editingKelas ? "edit" : "create"}
        initialData={editingKelas}
      />

      <Modal
        open={Boolean(deletingKelas)}
        onClose={() => setDeletingKelas(null)}
        title="Hapus Kelas"
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          <div className="rounded-md border border-danger/30 bg-danger/10 p-4">
            <p className="text-sm font-semibold text-danger">Hapus kelas {deletingKelas?.judul}?</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Data hubungan siswa dan guru dengan kelas ini akan ikut terlepas. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingKelas(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={() => void handleDeleteKelas()}>
              Hapus Kelas
            </Button>
          </div>
        </div>
      </Modal>

      <ModalAkun
        open={showModalAkun}
        onClose={() => setShowModalAkun(false)}
        onSuccess={() => loadTabData("AKUN", akunDefaultRole)}
        mode={akunMode}
        defaultRole={akunDefaultRole}
        initialData={editingAkun}
      />
    </>
  );
}

function AkunRowActions({
  open,
  onToggle,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <td className="relative whitespace-nowrap px-3 py-1 text-right">
      <button
        type="button"
        aria-label="Menu aksi"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className="inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <EllipsisVertical className="size-4" strokeWidth={1.75} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-2 top-11 z-20 w-32 overflow-hidden rounded-md border bg-popover py-1 text-left text-popover-foreground shadow-sm dark:shadow-none"
        >
          <button
            type="button"
            role="menuitem"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            className="block h-10 w-full cursor-pointer px-3 text-left text-sm transition-colors duration-100 hover:bg-accent"
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="block h-10 w-full cursor-pointer px-3 text-left text-sm text-danger transition-colors duration-100 hover:bg-accent"
          >
            Hapus
          </button>
        </div>
      )}
    </td>
  );
}

type ActivityDay = AdminDashboardData["aktivitas"]["aktivitasHarian"][number];

function ActiveUsersLineChart({ items }: { items: ActivityDay[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Data user aktif belum tersedia.</p>;
  }

  const width = 640;
  const height = 250;
  const left = 48;
  const right = 16;
  const top = 16;
  const bottom = 42;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maximum = Math.max(Math.ceil(Math.max(...items.map((item) => item.userAktif), 0) / 100) * 100, 1000);
  const xFor = (index: number) => left + (items.length === 1 ? chartWidth / 2 : (index / (items.length - 1)) * chartWidth);
  const yFor = (value: number) => top + chartHeight - (value / maximum) * chartHeight;
  const points = items.map((item, index) => `${xFor(index)},${yFor(item.userAktif)}`).join(" ");
  const gridValues = [0, 250, 500, 750, 1000].filter((value) => value <= maximum);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[560px]" role="img" aria-label="Jumlah user aktif per hari">
        {gridValues.map((value) => (
          <g key={value}>
            <line x1={left} x2={width - right} y1={yFor(value)} y2={yFor(value)} className="stroke-border" strokeDasharray="4 4" />
            <text x={left - 8} y={yFor(value) + 4} textAnchor="end" fontSize="11" className="fill-muted-foreground">{value}</text>
          </g>
        ))}
        <polyline points={points} fill="none" className="stroke-brand" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {items.map((item, index) => (
          <g key={item.tanggal}>
            <circle cx={xFor(index)} cy={yFor(item.userAktif)} r="4" className="fill-background stroke-brand" strokeWidth="2">
              <title>{`${item.tanggal}: ${item.userAktif} user aktif`}</title>
            </circle>
            <text x={xFor(index)} y={height - 14} textAnchor="middle" fontSize="10" className="fill-muted-foreground">{item.tanggal.slice(5)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}