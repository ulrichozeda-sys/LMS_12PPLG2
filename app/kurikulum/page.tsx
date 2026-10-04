// app/kurikulum/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChartColumn,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  School,
  Users,
} from "lucide-react";
import KelasCard, { KelasData } from "@/components/KelasCard";
import { AkunData } from "@/components/AkunCard";
import AsesmenCard, { AsesmenData } from "@/components/Asesmencard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
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
import { Field, SearchInput, SegmentedControl, SelectInput } from "@/components/shared/form-controls";

type Tab = "DASHBOARD" | "KELAS" | "AKUN" | "ASESMEN" | "PERFORMA";
type Tone = 1 | 2 | 3 | 4 | 5;
type KurikulumAsesmen = AsesmenData & { guru: { id: string; nama: string } };

interface AdminDashboardData {
  statistik: { kelas: number; siswa: number; guru: number; asesmen: number; tugas: number; mapel: number; laporanPending: number; kuis: number; ujian: number; rataRataNilai: number; submissionDinilai: number; tugasDibuat: number; tugasDikumpulkan: number };
  akunTerbaru: { id: string; nama: string; email: string; role: "SISWA" | "GURU"; createdAt: string }[];
  aktivitas: { periodeHari: number; userAktif: number; siswaAktif: number; guruAktif: number; aktivitasHarian: { tanggal: string; asesmen: number; tugas: number; submission: number; userAktif: number }[] };
  akademik: { trendNilai: { tanggal: string; judul: string; nilai: number | null }[]; rataRataPerKelas: { label: string; nilai: number | null }[]; rataRataPerMapel: { label: string; nilai: number | null }[] };
  aktivitasPembelajaran: { asesmenSelesai: number; asesmenBelum: number; tugasDikumpulkan: number; tugasBelum: number };
}

function normalizeDashboardData(data: (Omit<AdminDashboardData, "aktivitas"> & { aktivitas?: AdminDashboardData["aktivitas"] }) | null | undefined): AdminDashboardData | null {
  if (!data) return null;
  return {
    ...data,
    aktivitas: data.aktivitas ?? { periodeHari: 14, userAktif: 0, siswaAktif: 0, guruAktif: 0, aktivitasHarian: [] },
    akademik: data.akademik ?? { trendNilai: [], rataRataPerKelas: [], rataRataPerMapel: [] },
    aktivitasPembelajaran: data.aktivitasPembelajaran ?? { asesmenSelesai: 0, asesmenBelum: 0, tugasDikumpulkan: 0, tugasBelum: 0 },
  };
}

const TAB_LABEL: Record<Tab, string> = {
  DASHBOARD: "Dashboard",
  KELAS: "Kelas",
  AKUN: "Daftar Akun",
  ASESMEN: "Asesmen",
  PERFORMA: "Performa Akademik",
};

const th = "px-3 py-2.5 font-medium";
const td = "px-3 py-2.5";

function KurikulumDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("DASHBOARD");
  const [accountRole, setAccountRole] = useState<"SISWA" | "GURU">("SISWA");
  const [me, setMe] = useState<{ nama: string; role: string; fotoProfil: string | null } | null>(null);

  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [siswaList, setSiswaList] = useState<AkunData[]>([]);
  const [guruList, setGuruList] = useState<AkunData[]>([]);
  const [asesmenList, setAsesmenList] = useState<KurikulumAsesmen[]>([]);
  const [mapelList, setMapelList] = useState<{ id: string; nama: string }[]>([]);
  const [kelasReferensiList, setKelasReferensiList] = useState<{ label: string; jenjang: string; tingkat: number | null; jurusan: { nama: string } | null }[]>([]);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const [jurusanFilter, setJurusanFilter] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [siswaSearch, setSiswaSearch] = useState("");
  const [mapelFilter, setMapelFilter] = useState("");
  const [guruSearch, setGuruSearch] = useState("");
  const [expandedGuruId, setExpandedGuruId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "SISWA" || tab === "GURU") {
      setAccountRole(tab);
      setActiveTab("AKUN");
    } else if (tab && ["DASHBOARD", "KELAS", "AKUN", "ASESMEN", "PERFORMA"].includes(tab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tab as Tab);
    }
  }, [searchParams]);

  useEffect(() => {
    loadTabData(activeTab, accountRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, accountRole]);

  async function loadTabData(tab: Tab, selectedRole: "SISWA" | "GURU" = accountRole) {
    setLoading(true);
    try {
      if (tab === "DASHBOARD" || tab === "PERFORMA") {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        setDashboardData(normalizeDashboardData(data.data));
      } else if (tab === "KELAS") {
        const res = await fetch("/api/kelas");
        const data = await res.json();
        setKelasList(data.data ?? []);
      } else if (tab === "AKUN" && selectedRole === "SISWA") {
        const [res, referensiRes] = await Promise.all([fetch("/api/akun?role=SISWA"), fetch("/api/kelas-referensi")]);
        const [data, referensiData] = await Promise.all([res.json(), referensiRes.json()]);
        setSiswaList(data.data ?? []);
        setKelasReferensiList(referensiData.data ?? []);
      } else if (tab === "AKUN" && selectedRole === "GURU") {
        const [res, mapelRes] = await Promise.all([fetch("/api/akun?role=GURU"), fetch("/api/mapel")]);
        const [data, mapelData] = await Promise.all([res.json(), mapelRes.json()]);
        setGuruList(data.data ?? []);
        setMapelList(mapelData.data ?? []);
      } else if (tab === "ASESMEN") {
        const res = await fetch("/api/asesmen");
        const data = await res.json();
        setAsesmenList(data.data ?? []);
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

  function openTab(tab: Tab) {
    setActiveTab(tab);
  }

  function openAccount(role: "SISWA" | "GURU") {
    setAccountRole(role);
    openTab("AKUN");
  }

  const navItems: NavItem[] = [
    { key: "DASHBOARD", label: "Dashboard", icon: LayoutDashboard, active: activeTab === "DASHBOARD", onSelect: () => openTab("DASHBOARD") },
    { key: "KELAS", label: "Kelas", icon: School, active: activeTab === "KELAS", onSelect: () => openTab("KELAS") },
    { key: "SISWA", label: "Daftar Siswa", icon: GraduationCap, active: activeTab === "AKUN" && accountRole === "SISWA", onSelect: () => openAccount("SISWA") },
    { key: "GURU", label: "Daftar Guru", icon: Users, active: activeTab === "AKUN" && accountRole === "GURU", onSelect: () => openAccount("GURU") },
    { key: "ASESMEN", label: "Asesmen", icon: ClipboardCheck, active: activeTab === "ASESMEN", onSelect: () => openTab("ASESMEN") },
    { key: "PERFORMA", label: "Performa Akademik", icon: ChartColumn, active: activeTab === "PERFORMA", onSelect: () => openTab("PERFORMA") },
  ];

  const jurusanOptions = Array.from(new Set(kelasReferensiList.map((kelas) => kelas.jurusan?.nama).filter(Boolean))) as string[];
  const kelasOptions = ["SMP", "SMA", "10", "11", "12"];
  const filteredSiswaList = siswaList.filter((siswa) => {
    const jurusan = siswa.kelasReferensi?.jurusan?.nama ?? "";
    const tingkat = siswa.kelasReferensi?.jenjang === "SMP" || siswa.kelasReferensi?.jenjang === "SMA"
      ? siswa.kelasReferensi.jenjang
      : siswa.kelasReferensi?.tingkat?.toString() ?? "";
    const query = siswaSearch.trim().toLowerCase();
    const cocokJurusan = !jurusanFilter || jurusan === jurusanFilter;
    const cocokKelas = !kelasFilter || tingkat === kelasFilter;
    const cocokSearch = !query || [siswa.nama, siswa.email, siswa.nis ?? ""].some((value) => value.toLowerCase().includes(query));
    return cocokJurusan && cocokKelas && cocokSearch;
  });
  const mapelOptions = mapelList.map((mapel) => mapel.nama);
  const filteredGuruList = guruList.filter((guru) => {
    const mapel = guru.kelasGuruMapel?.map((item) => item.mapel.nama) ?? [];
    const query = guruSearch.trim().toLowerCase();
    const cocokMapel = !mapelFilter || mapel.includes(mapelFilter);
    const cocokSearch = !query || [guru.nama, guru.email, guru.nik ?? ""].some((value) => value.toLowerCase().includes(query));
    return cocokMapel && cocokSearch;
  });
  const asesmenByGuru = Array.from(asesmenList.reduce((groups, asesmen) => {
    const group = groups.get(asesmen.guru.id) ?? { guru: asesmen.guru, asesmen: [] as KurikulumAsesmen[] };
    group.asesmen.push(asesmen);
    groups.set(asesmen.guru.id, group);
    return groups;
  }, new Map<string, { guru: KurikulumAsesmen["guru"]; asesmen: KurikulumAsesmen[] }>()).values());

  const statCards: { label: string; value: number; caption: string; tab: Tab | "SISWA" | "GURU" }[] = dashboardData
    ? [
        { label: "Kelas", value: dashboardData.statistik.kelas, caption: "Lihat kelas", tab: "KELAS" },
        { label: "Siswa", value: dashboardData.statistik.siswa, caption: "Daftar siswa", tab: "SISWA" },
        { label: "Guru", value: dashboardData.statistik.guru, caption: "Daftar guru", tab: "GURU" },
        { label: "Asesmen", value: dashboardData.statistik.asesmen, caption: "Kuis dan ujian", tab: "KELAS" },
        { label: "Tugas", value: dashboardData.statistik.tugas, caption: "Tugas dibuat", tab: "KELAS" },
        { label: "Mata Pelajaran", value: dashboardData.statistik.mapel, caption: "Mapel tersedia", tab: "GURU" },
        { label: "Rata-rata Nilai", value: dashboardData.statistik.rataRataNilai, caption: "Dari asesmen dinilai", tab: "PERFORMA" },
      ]
    : [];

  return (
    <DashboardShell
      roleLabel="Dashboard Kurikulum"
      sectionLabel={TAB_LABEL[activeTab]}
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
            title={`Selamat Datang, ${me?.nama ?? "Kurikulum"}`}
            description="Pantau kelas, akun, dan performa akademik MyClass — akses lihat saja."
          />

          <StatGrid>
            {statCards.map((card) => (
              <StatCell
                key={card.label}
                label={card.label}
                value={card.value}
                caption={card.caption}
                onClick={() => (card.tab === "SISWA" ? openAccount("SISWA") : card.tab === "GURU" ? openAccount("GURU") : openTab(card.tab))}
              />
            ))}
          </StatGrid>

          <Panel
            title="Akun Terbaru"
            description="Lima akun siswa dan guru terakhir dibuat."
            actions={
              <Button size="sm" variant="outline" onClick={() => openAccount("SISWA")}>
                Lihat Akun
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
                        <Badge tone={akun.role === "GURU" ? "brand" : "gray"}>{akun.role === "GURU" ? "Guru" : "Siswa"}</Badge>
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

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Grafik Linear Tren Rata-rata Nilai Akademik Sekolah"
              description="Perubahan rata-rata nilai seluruh siswa berdasarkan periode asesmen."
            >
              <AcademicTrendChart items={dashboardData.akademik.trendNilai} />
            </Panel>
            <Panel
              title="Grafik Batang Rata-rata Nilai per Kelas"
              description="Perbandingan capaian akademik rata-rata setiap kelas."
            >
              <AcademicBarChart items={dashboardData.akademik.rataRataPerKelas} label="kelas" tone={1} />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Grafik Batang Rata-rata Nilai per Mata Pelajaran"
              description="Perbandingan rata-rata nilai untuk setiap mata pelajaran."
            >
              <AcademicBarChart items={dashboardData.akademik.rataRataPerMapel} label="mata pelajaran" tone={2} />
            </Panel>
            <Panel
              title="Grafik Progress Aktivitas Pembelajaran"
              description="Status penyelesaian asesmen dan tugas di seluruh sekolah."
            >
              <LearningProgressChart
                items={[
                  ["Asesmen sudah dikerjakan", dashboardData.aktivitasPembelajaran.asesmenSelesai, 1],
                  ["Asesmen belum dikerjakan", dashboardData.aktivitasPembelajaran.asesmenBelum, 4],
                  ["Tugas dikumpulkan", dashboardData.aktivitasPembelajaran.tugasDikumpulkan, 1],
                  ["Tugas belum dikumpulkan", dashboardData.aktivitasPembelajaran.tugasBelum, 4],
                ]}
              />
            </Panel>
          </div>
        </div>
      )}

      {/* ============ KELAS ============ */}
      {!loading && activeTab === "KELAS" && (
        <div className="space-y-4">
          <PageTitle title="Kelas" description="Lihat kelas di MyClass (akses lihat saja)." />
          {kelasList.length === 0 ? (
            <EmptyState>Belum ada kelas dibuat.</EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {kelasList.map((k) => (
                <KelasCard key={k.id} data={k} isEditable={false} basePath="/kurikulum/kelas" />
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
            <Panel title="Daftar Siswa" description="Lihat data siswa dan kelasnya (akses lihat saja).">
              <div className="mb-4 grid gap-3 rounded-md border bg-muted p-3 sm:grid-cols-2 xl:grid-cols-[180px_220px_minmax(220px,1fr)_auto] xl:items-end">
                <Field label="Jurusan">
                  <SelectInput value={jurusanFilter} onChange={(event) => setJurusanFilter(event.target.value)}>
                    <option value="">Semua Jurusan</option>
                    {jurusanOptions.map((jurusan) => (
                      <option key={jurusan} value={jurusan}>{jurusan}</option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Kelas">
                  <SelectInput value={kelasFilter} onChange={(event) => setKelasFilter(event.target.value)}>
                    <option value="">Semua Kelas</option>
                    {kelasOptions.map((kelas) => (
                      <option key={kelas} value={kelas}>{kelas}</option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Pencarian">
                  <SearchInput
                    value={siswaSearch}
                    onChange={(event) => setSiswaSearch(event.target.value)}
                    placeholder="Nama, email, atau NIS..."
                  />
                </Field>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setJurusanFilter("");
                    setKelasFilter("");
                    setSiswaSearch("");
                  }}
                >
                  Reset
                </Button>
              </div>

              {filteredSiswaList.length === 0 ? (
                <EmptyState>Belum ada siswa terdaftar.</EmptyState>
              ) : (
                <TableWrap>
                  <table className="w-full min-w-[750px] text-left text-sm">
                    <thead className="bg-muted text-xs text-muted-foreground">
                      <tr>
                        <th className={th}>No</th>
                        <th className={th}>Nama</th>
                        <th className={th}>Email</th>
                        <th className={th}>NIS</th>
                        <th className={th}>Status</th>
                        <th className={th}>Kelas/Rombel</th>
                        <th className={th}>Jurusan</th>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              )}
            </Panel>
          )}

          {accountRole === "GURU" && (
            <Panel title="Daftar Guru" description="Lihat data guru dan mapel yang diampu (akses lihat saja).">
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
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="bg-muted text-xs text-muted-foreground">
                      <tr>
                        <th className={th}>No</th>
                        <th className={th}>Nama</th>
                        <th className={th}>Email</th>
                        <th className={th}>NIK</th>
                        <th className={th}>Status</th>
                        <th className={th}>Mapel</th>
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

      {/* ============ ASESMEN ============ */}
      {!loading && activeTab === "ASESMEN" && (
        <div className="space-y-4">
          <PageTitle title="Asesmen Guru" description="Pilih guru untuk melihat seluruh asesmen yang dibuatnya." />
          {asesmenByGuru.length === 0 ? (
            <EmptyState>Belum ada asesmen yang dibuat guru.</EmptyState>
          ) : (
            <div className="space-y-3">
              {asesmenByGuru.map(({ guru, asesmen }) => {
                const expanded = expandedGuruId === guru.id;
                return (
                  <section key={guru.id} className="overflow-hidden rounded-lg border bg-card text-card-foreground">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setExpandedGuruId(expanded ? null : guru.id)}
                      className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left transition-colors duration-150 hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={guru.nama} src={null} className="size-9" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{guru.nama}</span>
                          <span className="block text-xs tabular-nums text-muted-foreground">{asesmen.length} asesmen</span>
                        </span>
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        strokeWidth={1.75}
                        className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-150", expanded && "rotate-180")}
                      />
                    </button>
                    {expanded && (
                      <div className="border-t p-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {asesmen.map((item) => (
                            <AsesmenCard key={item.id} data={item} basePath="/kurikulum/asesmen" />
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

export default function KurikulumDashboard() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <KurikulumDashboardContent />
    </Suspense>
  );
}

type AcademicTrend = AdminDashboardData["akademik"]["trendNilai"][number];
type AcademicAverage = AdminDashboardData["akademik"]["rataRataPerKelas"][number];

function AcademicTrendChart({ items }: { items: AcademicTrend[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Data tren nilai belum tersedia.</p>;
  }

  const width = 640;
  const height = 250;
  const left = 48;
  const right = 16;
  const top = 16;
  const bottom = 42;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maximum = 100;
  const xFor = (index: number) => left + (items.length === 1 ? chartWidth / 2 : (index / (items.length - 1)) * chartWidth);
  const yFor = (value: number) => top + chartHeight - (value / maximum) * chartHeight;
  const points = items.map((item, index) => `${xFor(index)},${yFor(item.nilai ?? 0)}`).join(" ");
  const gridValues = [0, 25, 50, 75, 100];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[560px]" role="img" aria-label="Tren rata-rata nilai akademik sekolah">
        {gridValues.map((value) => (
          <g key={value}>
            <line x1={left} x2={width - right} y1={yFor(value)} y2={yFor(value)} className="stroke-border" strokeDasharray="4 4" />
            <text x={left - 8} y={yFor(value) + 4} textAnchor="end" fontSize="11" className="fill-muted-foreground">{value}</text>
          </g>
        ))}
        <polyline points={points} fill="none" className="stroke-brand" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {items.map((item, index) => (
          <g key={`${item.tanggal}-${item.judul}`}>
            <circle cx={xFor(index)} cy={yFor(item.nilai ?? 0)} r="4" className="fill-background stroke-brand" strokeWidth="2">
              <title>{`${item.tanggal}: ${item.nilai ?? 0} (${item.judul})`}</title>
            </circle>
            <text x={xFor(index)} y={height - 14} textAnchor="middle" fontSize="10" className="fill-muted-foreground">{item.tanggal.slice(5)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function AcademicBarChart({ items, label, tone }: { items: AcademicAverage[]; label: string; tone: Tone }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Data nilai per {label} belum tersedia.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <BarRow key={item.label} label={item.label} value={item.nilai ?? 0} max={100} tone={tone} />
      ))}
    </div>
  );
}

function LearningProgressChart({ items }: { items: [string, number, Tone][] }) {
  const maximum = Math.max(...items.map(([, value]) => value), 1);
  return (
    <div className="space-y-4">
      {items.map(([label, value, tone]) => (
        <BarRow key={label} label={label} value={value} max={maximum} tone={tone} />
      ))}
    </div>
  );
}