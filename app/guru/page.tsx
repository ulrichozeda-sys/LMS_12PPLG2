"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  LoadingBlock,
  PageTitle,
  Panel,
  StatCell,
  StatGrid,
  StatusDot,
} from "@/components/shared/data-display";

interface GuruDashboardData {
  statistik: { totalKelas: number; totalSiswa: number; totalAsesmen: number; totalTugas: number; submissionDinilai: number; essayBelumDinilai: number; tugasDikumpulkan: number };
  kelas: { id: string; judul: string; _count: { siswa: number } }[];
  asesmenTerbaru: { id: string; judul: string; tipe: "KUIS" | "UJIAN"; status: "PROSES" | "SELESAI"; updatedAt: string }[];
  tugasTerbaru: { id: string; judul: string; createdAt: string; _count: { submission: number } }[];
}

const textLink =
  "text-xs font-medium text-foreground underline underline-offset-4 hover:no-underline dark:text-brand " +
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function GuruDashboardPage() {
  const [data, setData] = useState<GuruDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/guru/dashboard")
      .then((res) => res.json())
      .then((result) => setData(result.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (!data) return <p role="alert" className="text-sm font-medium text-danger">Dashboard guru gagal dimuat.</p>;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Selamat Datang di Ruang Mengajar"
        description="Pantau kelas, asesmen, tugas, dan pekerjaan penilaianmu dari satu tempat."
      />

      <StatGrid>
        <StatCell label="Kelas Diampu" value={data.statistik.totalKelas} caption="Kelas yang kamu ajar" />
        <StatCell label="Total Siswa" value={data.statistik.totalSiswa} caption="Siswa di kelasmu" />
        <StatCell label="Asesmen" value={data.statistik.totalAsesmen} caption="Kuis dan ujian" />
        <StatCell label="Tugas" value={data.statistik.totalTugas} caption="Tugas yang dibuat" />
      </StatGrid>

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="Perlu Ditangani">
          <ul className="-my-3 divide-y">
            <li className="flex items-center justify-between gap-3 py-3">
              <StatusDot tone={data.statistik.essayBelumDinilai > 0 ? "brand" : "muted"}>
                Essay belum dinilai
              </StatusDot>
              <strong className="text-base font-semibold tabular-nums">{data.statistik.essayBelumDinilai}</strong>
            </li>
            <li className="flex items-center justify-between gap-3 py-3">
              <StatusDot tone="muted">Tugas sudah dikumpulkan</StatusDot>
              <strong className="text-base font-semibold tabular-nums">{data.statistik.tugasDikumpulkan}</strong>
            </li>
          </ul>
        </Panel>

        <Panel title="Aksi Cepat">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/guru/asesmen"><Button className="w-full" size="sm">Buat Asesmen</Button></Link>
            <Link href="/guru/tugas"><Button className="w-full" size="sm" variant="outline">Buat Tugas</Button></Link>
            <Link href="/guru/kelas"><Button className="w-full" size="sm" variant="outline">Lihat Kelas</Button></Link>
            <Link href="/guru/asesmen"><Button className="w-full" size="sm" variant="outline">Nilai Asesmen</Button></Link>
          </div>
        </Panel>
      </div>

      <Panel
        title="Kelas yang Diampu"
        description="Ringkasan jumlah siswa per kelas."
        actions={<Link href="/guru/kelas" className={textLink}>Lihat semua</Link>}
      >
        {data.kelas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada kelas yang diampu.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.kelas.map((kelas) => (
              <Link
                key={kelas.id}
                href={`/guru/kelas/${kelas.id}`}
                className="rounded-md border p-4 transition-colors duration-150 hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="text-sm font-medium">{kelas.judul}</p>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">{kelas._count.siswa} siswa</p>
              </Link>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Asesmen Terbaru">
          {data.asesmenTerbaru.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada asesmen.</p>
          ) : (
            <ul className="-my-3 divide-y">
              {data.asesmenTerbaru.map((asesmen) => (
                <li key={asesmen.id}>
                  <Link
                    href={`/guru/asesmen/${asesmen.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-colors duration-100 hover:bg-accent"
                  >
                    <span className="min-w-0 truncate text-sm font-medium">{asesmen.judul}</span>
                    <span className="shrink-0">
                      <StatusDot tone={asesmen.status === "SELESAI" ? "brand" : "muted"}>
                        {asesmen.tipe === "KUIS" ? "Kuis" : "Ujian"} · {asesmen.status === "SELESAI" ? "Selesai" : "Proses"}
                      </StatusDot>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Tugas Terbaru">
          {data.tugasTerbaru.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada tugas.</p>
          ) : (
            <ul className="-my-3 divide-y">
              {data.tugasTerbaru.map((tugas) => (
                <li key={tugas.id}>
                  <Link
                    href="/guru/tugas"
                    className="flex items-center justify-between gap-3 py-3 transition-colors duration-100 hover:bg-accent"
                  >
                    <span className="min-w-0 truncate text-sm font-medium">{tugas.judul}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {tugas._count.submission} terkumpul
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}