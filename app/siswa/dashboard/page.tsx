"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import MateriCard, { MateriData } from "@/components/MateriCard";
import PengumumanCard, { PengumumanData } from "@/components/PengumumanCard";

type DashboardData = {
  siswa: {
    id: string;
    nama: string;
    kelasJurusan: string;
  };
  statistik: {
    totalKelas: number;
    totalAsesmen: number;
    asesmenSudah: number;
    asesmenSedang: number;
    asesmenBelum: number;
    totalTugas: number;
    tugasSudah: number;
    tugasBelum: number;
    rataRataNilai: number | null;
  };
  asesmenTerbaru: Array<{
    id: string;
    judul: string;
    tipe: "KUIS" | "UJIAN";
    statusSubmission: "BELUM" | "SEDANG" | "SUDAH";
    createdAt: string;
    mapel?: { nama: string } | null;
  }>;
  tugasTerbaru: Array<{
    id: string;
    judul: string;
    statusSubmission: "BELUM" | "SUDAH";
    createdAt: string;
    mapel?: { nama: string } | null;
  }>;
  tugasBelumDikumpulkan: Array<{
    id: string;
    judul: string;
    statusSubmission: "BELUM" | "SUDAH";
    createdAt: string;
    mapel?: { nama: string } | null;
  }>;
  asesmenSedangDikerjakan: Array<{
    id: string;
    judul: string;
    tipe: "KUIS" | "UJIAN";
    statusSubmission: "BELUM" | "SEDANG" | "SUDAH";
    createdAt: string;
    mapel?: { nama: string } | null;
  }>;
  nilaiTerbaru: Array<{
    id: string;
    judul: string;
    tipe: "KUIS" | "UJIAN";
    nilai: number | null;
    mapel: string;
    submittedAt: string | null;
  }>;
  pengumumanKelas: Array<PengumumanData & { kelas: { id: string; judul: string } }>;
  materiHariIni: MateriData[];
};

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const rowLink = `block rounded-md border p-3 transition-colors duration-150 hover:bg-accent ${focusRing}`;

function Stat({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4 text-card-foreground">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function SectionHead({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <Link href={href} className={`rounded-sm text-sm underline underline-offset-2 ${focusRing}`}>
        {linkLabel}
      </Link>
    </div>
  );
}

export default function SiswaDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/siswa/dashboard");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Gagal memuat dashboard siswa.");
        }

        if (!ignore) {
          setData(payload.data ?? null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal memuat dashboard siswa.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Memuat dashboard">
        <div className="h-16 w-72 animate-pulse rounded-md bg-muted" />
        <div className="h-40 animate-pulse rounded-lg border bg-muted" />
        <div className="h-48 animate-pulse rounded-lg border bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-danger p-5">
        <p className="text-base font-semibold text-danger">Gagal memuat dashboard</p>
        <p className="mt-1 text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-base font-semibold">Belum ada data</p>
        <p className="mt-1 text-sm text-muted-foreground">Belum ada aktivitas kelas, tugas, atau asesmen untuk akun Anda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Selamat Datang, {data.siswa.nama}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{data.siswa.kelasJurusan}</p>
      </div>

      <section>
        <SectionHead title="Pengumuman Kelas" href="/siswa/kelas" linkLabel="Lihat kelas" />
        {data.pengumumanKelas.length === 0 ? (
          <p className="border-t py-4 text-sm text-muted-foreground">Belum ada pengumuman dari kelas yang diikuti.</p>
        ) : (
          <div className="space-y-3">
            {data.pengumumanKelas.map((item) => (
              <div key={item.id}>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{item.kelas.judul}</p>
                <PengumumanCard data={item} currentUserId={data.siswa.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHead title="Materi Hari Ini" href="/siswa/materi" linkLabel="Lihat semua materi" />
        {data.materiHariIni.length === 0 ? (
          <p className="border-t py-4 text-sm text-muted-foreground">Belum ada materi baru hari ini.</p>
        ) : (
          <div className="space-y-3">
            {data.materiHariIni.map((materi) => <MateriCard key={materi.id} data={materi} />)}
          </div>
        )}
      </section>

      <section aria-label="Ringkasan">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border xl:grid-cols-4">
          <Stat label="Total Kelas" value={String(data.statistik.totalKelas)} helper="Kelas yang diikuti" />
          <Stat label="Total Asesmen" value={String(data.statistik.totalAsesmen)} helper="Kuis & ujian" />
          <Stat label="Asesmen Selesai" value={String(data.statistik.asesmenSudah)} helper="Sudah dikerjakan" />
          <Stat label="Asesmen Sedang" value={String(data.statistik.asesmenSedang)} helper="Dikerjakan saat ini" />
          <Stat label="Asesmen Belum" value={String(data.statistik.asesmenBelum)} helper="Belum dikerjakan" />
          <Stat label="Total Tugas" value={String(data.statistik.totalTugas)} helper="Tugas yang tersedia" />
          <Stat label="Tugas Sudah" value={String(data.statistik.tugasSudah)} helper="Sudah dikumpulkan" />
          <Stat label="Tugas Belum" value={String(data.statistik.tugasBelum)} helper="Belum dikumpulkan" />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
          <p className="text-sm font-medium">Rata-rata Nilai Asesmen</p>
          <Badge tone={data.statistik.rataRataNilai !== null ? "green" : "gray"}>
            {data.statistik.rataRataNilai !== null ? `${data.statistik.rataRataNilai}` : "Belum ada nilai"}
          </Badge>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Aksi Cepat">
          <div className="grid gap-2 sm:grid-cols-3">
            <Link href="/siswa/asesmen">
              <Button className="w-full" size="sm">Kerjakan Asesmen</Button>
            </Link>
            <Link href="/siswa/tugas">
              <Button className="w-full" size="sm" variant="outline">Lihat Tugas</Button>
            </Link>
            <Link href="/siswa/kelas">
              <Button className="w-full" size="sm" variant="outline">Lihat Kelas</Button>
            </Link>
          </div>
        </Panel>

        <Panel title="Nilai Terbaru">
          {data.nilaiTerbaru.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada nilai yang tersedia.</p>
          ) : (
            data.nilaiTerbaru.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.judul}</p>
                  <p className="text-xs text-muted-foreground">{item.mapel}</p>
                </div>
                <Badge tone={item.nilai !== null && item.nilai >= 75 ? "green" : item.nilai !== null ? "amber" : "gray"}>
                  {item.nilai !== null ? `${item.nilai}` : "-"}
                </Badge>
              </div>
            ))
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Asesmen Terbaru">
          {data.asesmenTerbaru.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada asesmen.</p>
          ) : (
            data.asesmenTerbaru.map((item) => (
              <Link key={item.id} href={`/siswa/asesmen/${item.id}`} className={rowLink}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.judul}</p>
                    <p className="text-xs text-muted-foreground">{item.mapel?.nama ?? "Umum"}</p>
                  </div>
                  <Badge tone={item.statusSubmission === "SUDAH" ? "green" : item.statusSubmission === "SEDANG" ? "amber" : "red"}>
                    {item.statusSubmission === "SUDAH" ? "Selesai" : item.statusSubmission === "SEDANG" ? "Sedang" : "Belum"}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </Panel>

        <Panel title="Tugas Terbaru">
          {data.tugasTerbaru.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada tugas.</p>
          ) : (
            data.tugasTerbaru.map((item) => (
              <Link key={item.id} href="/siswa/tugas" className={rowLink}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.judul}</p>
                    <p className="text-xs text-muted-foreground">{item.mapel?.nama ?? "Umum"}</p>
                  </div>
                  <Badge tone={item.statusSubmission === "SUDAH" ? "green" : "red"}>
                    {item.statusSubmission === "SUDAH" ? "Sudah" : "Belum"}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Tugas yang Belum Dikumpulkan">
          {data.tugasBelumDikumpulkan.length === 0 ? (
            <p className="text-sm text-muted-foreground">Semua tugas sudah dikumpulkan.</p>
          ) : (
            data.tugasBelumDikumpulkan.map((item) => (
              <Link key={item.id} href="/siswa/tugas" className={rowLink}>
                <p className="text-sm font-medium">{item.judul}</p>
                <p className="text-xs text-muted-foreground">{item.mapel?.nama ?? "Umum"}</p>
              </Link>
            ))
          )}
        </Panel>

        <Panel title="Asesmen yang Sedang Dikerjakan">
          {data.asesmenSedangDikerjakan.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada asesmen yang sedang dikerjakan.</p>
          ) : (
            data.asesmenSedangDikerjakan.map((item) => (
              <Link key={item.id} href={`/siswa/asesmen/${item.id}`} className={rowLink}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.judul}</p>
                    <p className="text-xs text-muted-foreground">{item.mapel?.nama ?? "Umum"}</p>
                  </div>
                  <Badge tone="amber">Sedang</Badge>
                </div>
              </Link>
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}