"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  BarRow,
  EmptyState,
  PageTitle,
  Panel,
  StatCell,
  StatGrid,
  StatusDot,
} from "@/components/shared/data-display";
import { SegmentedControl } from "@/components/shared/form-controls";

type RangeKey = "semua" | "minggu" | "bulan" | "3bulan" | "tahun";

type PendingStudentItem = {
  type: "TUGAS" | "ESSAY";
  label: string;
  submittedAt: string | null;
};

type PendingStudent = {
  id: string;
  nama: string;
  kelas: string;
  items: PendingStudentItem[];
};

type PerformanceSummary = {
  totalKuis: number;
  totalUjian: number;
  rataRataNilaiKuis: number;
  rataRataNilaiUjian: number;
  rataRataNilaiSeluruhAsesmen: number;
  totalTugasDibuat: number;
  totalTugasDikumpulkan: number;
  persentasePengumpulanTugas: number;
  essayBelumDinilai: number;
  rataRataNilaiPerKelas: Array<{ kelas: string; rataRata: number }>;
  rataRataNilaiPerMapel: Array<{ mapel: string; rataRata: number }>;
  siswaBelumDinilai: PendingStudent[];
};

type PerformanceData = {
  range: RangeKey;
  summary: PerformanceSummary;
};

const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "minggu", label: "Minggu ini" },
  { value: "bulan", label: "Bulan ini" },
  { value: "3bulan", label: "3 Bulan Terakhir" },
  { value: "tahun", label: "Tahun ini" },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatPercent(value: number): string {
  return `${Number(value).toFixed(1)}%`;
}

function formatAverage(value: number): string {
  return `${Number(value).toFixed(1)}`;
}

function ChartBar({ label, value, max, toneClass }: { label: string; value: number; max: number; toneClass: string }) {
  const height = max > 0 ? Math.max((value / max) * 100, 8) : 8;

  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <div className="flex h-36 w-full items-end justify-center rounded-md border bg-muted p-3">
        <div
          className={cn("w-14 rounded-t-sm transition-all duration-150", toneClass)}
          style={{ height: `${height}%` }}
          title={`${label}: ${value}`}
        />
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function HorizontalBars({ items, suffix = "" }: { items: Array<{ label: string; value: number }>; suffix?: string }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada data untuk ditampilkan.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium">{item.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {item.value}
              {suffix}
            </span>
          </div>
          <div className="h-2 w-full rounded-sm bg-foreground/10">
            <div
              className="h-2 rounded-sm bg-chart-1"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GuruPerformaAkademikPage() {
  const [selectedRange, setSelectedRange] = useState<RangeKey>("bulan");
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/guru/performa?range=${selectedRange}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Gagal memuat performa akademik.");
        }

        if (!ignore) {
          setData(payload.data ?? null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal memuat performa akademik.");
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
  }, [selectedRange]);

  const comparisonMax = useMemo(
    () => Math.max(data?.summary.totalKuis ?? 0, data?.summary.totalUjian ?? 0, 1),
    [data],
  );

  const classChart = useMemo(
    () =>
      (data?.summary.rataRataNilaiPerKelas ?? []).map((item) => ({
        label: item.kelas,
        value: item.rataRata,
      })),
    [data],
  );

  const mapelChart = useMemo(
    () =>
      (data?.summary.rataRataNilaiPerMapel ?? []).map((item) => ({
        label: item.mapel,
        value: item.rataRata,
      })),
    [data],
  );

  const hasData = Boolean(
    data &&
      (data.summary.totalKuis > 0 ||
        data.summary.totalUjian > 0 ||
        data.summary.totalTugasDibuat > 0 ||
        data.summary.totalTugasDikumpulkan > 0 ||
        data.summary.rataRataNilaiPerKelas.length > 0 ||
        data.summary.rataRataNilaiPerMapel.length > 0 ||
        data.summary.siswaBelumDinilai.length > 0),
  );

  if (loading) {
    return (
      <div role="status" className="space-y-6">
        <span className="sr-only">Memuat...</span>
        <div className="h-7 w-56 animate-pulse rounded-md bg-foreground/10" />
        <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-foreground/10" />
        <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-5">
        <p className="text-base font-semibold text-danger">Gagal memuat data performa akademik</p>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-4" size="sm" onClick={() => setSelectedRange((current) => current)}>
          Coba lagi
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState>
        <p className="text-base font-semibold text-foreground">Belum ada data performa</p>
        <p className="mt-2">Data akan muncul setelah Anda membuat dan mengirim asesmen atau tugas.</p>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Performa Akademik"
        description="Ringkasan evaluasi kelas dan tugas."
      />

      <div className="max-w-full overflow-x-auto">
        <SegmentedControl
          ariaLabel="Rentang waktu"
          value={selectedRange}
          onChange={setSelectedRange}
          options={RANGE_OPTIONS}
          className="whitespace-nowrap"
        />
      </div>

      <StatGrid>
        <StatCell label="Total Kuis" value={formatNumber(data.summary.totalKuis)} caption="Kuis yang dibuat" />
        <StatCell label="Total Ujian" value={formatNumber(data.summary.totalUjian)} caption="Ujian online" />
        <StatCell label="Rata-rata Nilai Kuis" value={formatAverage(data.summary.rataRataNilaiKuis)} caption="Nilai kuis" />
        <StatCell label="Rata-rata Nilai Ujian" value={formatAverage(data.summary.rataRataNilaiUjian)} caption="Nilai ujian" />
      </StatGrid>

      <StatGrid>
        <StatCell label="Rata-rata Seluruh Asesmen" value={formatAverage(data.summary.rataRataNilaiSeluruhAsesmen)} caption="Semua nilai asesmen" />
        <StatCell label="Total Tugas Dibuat" value={formatNumber(data.summary.totalTugasDibuat)} caption="Tugas yang dibuat" />
        <StatCell label="Tugas Dikumpulkan" value={formatNumber(data.summary.totalTugasDikumpulkan)} caption="Submission siswa" />
        <StatCell label="Persentase Pengumpulan" value={formatPercent(data.summary.persentasePengumpulanTugas)} caption="Dari tugas yang dibuat" />
      </StatGrid>

      {!hasData ? (
        <EmptyState>
          <p className="text-base font-semibold text-foreground">Belum ada data pada rentang waktu ini.</p>
          <p className="mt-2">Buat kuis, ujian, atau tugas untuk melihat performa akademik di sini.</p>
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Perbandingan Kuis & Ujian">
              <div className="flex items-end gap-6">
                <ChartBar label="Kuis" value={data.summary.totalKuis} max={comparisonMax} toneClass="bg-chart-1" />
                <ChartBar label="Ujian" value={data.summary.totalUjian} max={comparisonMax} toneClass="bg-chart-3" />
              </div>
            </Panel>

            <Panel title="Progress Tugas Dibuat vs Dikumpulkan">
              <div className="space-y-4">
                <BarRow
                  label="Tugas dibuat"
                  value={data.summary.totalTugasDibuat}
                  max={data.summary.totalTugasDibuat}
                  tone={1}
                />
                <BarRow
                  label="Tugas dikumpulkan"
                  value={data.summary.totalTugasDikumpulkan}
                  max={data.summary.totalTugasDibuat}
                  tone={3}
                />
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2">
                  <StatusDot>Pengumpulan: {formatPercent(data.summary.persentasePengumpulanTugas)}</StatusDot>
                  <StatusDot tone="muted">Essay belum dinilai: {data.summary.essayBelumDinilai}</StatusDot>
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Rata-rata Nilai per Kelas">
              <HorizontalBars items={classChart} suffix="" />
            </Panel>

            <Panel title="Rata-rata Nilai per Mata Pelajaran">
              <HorizontalBars items={mapelChart} suffix="" />
            </Panel>
          </div>

          <Panel
            title="Siswa dengan tugas atau essay belum dinilai"
            actions={
              <StatusDot tone="muted">
                <span className="tabular-nums">{data.summary.siswaBelumDinilai.length}</span> siswa
              </StatusDot>
            }
          >
            {data.summary.siswaBelumDinilai.length === 0 ? (
              <div className="rounded-md border border-dashed bg-muted p-4 text-sm text-muted-foreground">
                Tidak ada siswa dengan tugas atau essay yang menunggu penilaian.
              </div>
            ) : (
              <div className="space-y-3">
                {data.summary.siswaBelumDinilai.map((student) => (
                  <div key={student.id} className="rounded-md border bg-muted p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">{student.nama}</p>
                        <p className="text-xs text-muted-foreground">{student.kelas}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {student.items.map((item, index) => (
                          <Badge key={`${student.id}-${index}`} tone={item.type === "ESSAY" ? "gray" : "brand"}>
                            {item.type === "ESSAY" ? "Essay" : "Tugas"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm">
                      {student.items.map((item, index) => (
                        <li
                          key={`${student.id}-${index}`}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card px-3 py-2"
                        >
                          <span>{item.label}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {item.type === "TUGAS" && item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("id-ID") : "Essay menunggu review"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}