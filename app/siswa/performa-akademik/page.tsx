"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";

type RangeKey = "semua" | "bulan" | "3bulan" | "tahun";
type AssessmentItem = {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  nilai: number;
  mapel: string;
  tanggal: string;
};
type PerformanceData = {
  summary: {
    rataRataSemua: number | null;
    rataRataKuis: number | null;
    rataRataUjian: number | null;
    asesmenSudah: number;
    asesmenBelum: number;
    asesmenSedang: number;
    tugasSudah: number;
    tugasBelum: number;
    essaySudahDinilai: number;
    essayBelumDinilai: number;
  };
  perkembanganNilai: AssessmentItem[];
  perbandinganTipe: Array<{ label: string; nilai: number | null }>;
  progressTugas: { sudah: number; belum: number };
  nilaiPerMapel: Array<{ mapel: string; nilai: number | null }>;
  nilaiTerbaru: AssessmentItem[];
  nilaiTertinggi: AssessmentItem[];
  asesmenBelumDikerjakan: Array<{ id: string; judul: string; tipe: "KUIS" | "UJIAN"; mapel: string }>;
  tugasBelumDikumpulkan: Array<{ id: string; judul: string; mapel: string }>;
};

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "semua", label: "Semua" },
  { key: "bulan", label: "Bulan Ini" },
  { key: "3bulan", label: "3 Bulan Terakhir" },
  { key: "tahun", label: "Tahun Ini" },
];

function StatGroup({ title, items }: { title: string; items: Array<{ label: string; value: number | null }> }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="bg-card p-4">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{item.value === null ? "-" : item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4 text-card-foreground">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function LineChart({ items }: { items: AssessmentItem[] }) {
  if (!items.length) return <Empty>Belum ada nilai untuk menampilkan perkembangan.</Empty>;
  const step = 100 / Math.max(items.length - 1, 1);
  const points = items.map((item, index) => `${index * step},${100 - item.nilai}`).join(" ");
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[420px]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 w-full overflow-visible" role="img" aria-label="Grafik perkembangan nilai">
          <line x1="0" y1="50" x2="100" y2="50" className="stroke-border" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <polyline points={points} fill="none" className="stroke-brand" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {items.map((item, index) => (
            <circle key={item.id} cx={index * step} cy={100 - item.nilai} r="2" className="fill-brand" vectorEffect="non-scaling-stroke">
              <title>{`${item.judul}: ${item.nilai}`}</title>
            </circle>
          ))}
        </svg>
        <div className="mt-2 flex justify-between gap-2">
          {items.map((item) => (
            <span key={item.id} className="max-w-16 truncate text-xs text-muted-foreground">
              {item.judul}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HorizontalBars({ items }: { items: Array<{ label: string; value: number | null }> }) {
  const available = items.filter((item): item is { label: string; value: number } => item.value !== null);
  if (!available.length) return <Empty>Belum ada nilai berdasarkan mata pelajaran.</Empty>;
  return (
    <div className="space-y-4">
      {available.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="font-medium tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 rounded-sm bg-foreground/10">
            <div className="h-full rounded-sm bg-brand" style={{ width: `${Math.min(Math.max(item.value, 0), 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AssessmentList({ items, empty }: { items: AssessmentItem[]; empty: string }) {
  if (!items.length) return <Empty>{empty}</Empty>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-muted p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.judul}</p>
            <p className="text-xs text-muted-foreground">
              {item.mapel} · {item.tipe}
            </p>
          </div>
          <Badge tone={item.nilai >= 75 ? "green" : "amber"}>{item.nilai}</Badge>
        </div>
      ))}
    </div>
  );
}

export default function SiswaPerformaAkademikPage() {
  const [range, setRange] = useState<RangeKey>("semua");
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/siswa/performa?range=${range}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Gagal memuat performa akademik.");
        if (!ignore) setData(payload.data ?? null);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Gagal memuat performa akademik.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [range]);

  const comparisonMax = useMemo(
    () => Math.max(...(data?.perbandinganTipe.map((item) => item.nilai ?? 0) ?? [1]), 1),
    [data]
  );

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Performa Akademik</h1>
        <p className="mt-1 text-sm text-muted-foreground">Perkembangan belajarmu</p>
      </div>
      <div role="group" aria-label="Rentang waktu" className="flex flex-wrap gap-0.5 rounded-md border bg-muted p-0.5">
        {RANGES.map((item) => {
          const active = range === item.key;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => setRange(item.key)}
              className={`h-10 cursor-pointer rounded-sm px-3 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-8 ${
                active ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Memuat performa akademik">
        {header}
        <div className="h-28 animate-pulse rounded-lg border bg-muted" />
        <div className="h-28 animate-pulse rounded-lg border bg-muted" />
        <div className="h-56 animate-pulse rounded-lg border bg-muted" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-lg border border-danger p-5">
          <p className="font-semibold text-danger">Gagal memuat performa akademik</p>
          <p className="mt-1 text-sm text-danger">{error}</p>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="font-medium">Belum ada data performa akademik.</p>
        </div>
      </div>
    );
  }

  const s = data.summary;
  const hasActivity =
    data.perkembanganNilai.length > 0 ||
    data.summary.asesmenBelum > 0 ||
    data.summary.asesmenSedang > 0 ||
    data.progressTugas.sudah > 0 ||
    data.progressTugas.belum > 0;
  const totalTugas = data.progressTugas.sudah + data.progressTugas.belum;

  return (
    <div className="space-y-6">
      {header}

      {!hasActivity && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="font-medium">Belum ada nilai atau aktivitas akademik.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nilai dan grafik akan muncul setelah kamu mengerjakan asesmen atau mengumpulkan tugas.
          </p>
        </div>
      )}

      <StatGroup
        title="Nilai"
        items={[
          { label: "Rata-rata seluruh asesmen", value: s.rataRataSemua },
          { label: "Rata-rata kuis", value: s.rataRataKuis },
          { label: "Rata-rata ujian online", value: s.rataRataUjian },
          { label: "Asesmen sudah dikerjakan", value: s.asesmenSudah },
        ]}
      />
      <StatGroup
        title="Status"
        items={[
          { label: "Asesmen belum dikerjakan", value: s.asesmenBelum },
          { label: "Asesmen sedang dikerjakan", value: s.asesmenSedang },
          { label: "Tugas sudah dikumpulkan", value: s.tugasSudah },
          { label: "Tugas belum dikumpulkan", value: s.tugasBelum },
        ]}
      />
      <StatGroup
        title="Essay"
        items={[
          { label: "Essay sudah dinilai", value: s.essaySudahDinilai },
          { label: "Essay belum dinilai", value: s.essayBelumDinilai },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Perkembangan Nilai Berdasarkan Asesmen">
          <LineChart items={data.perkembanganNilai} />
        </Panel>

        <Panel title="Perbandingan Nilai Kuis dan Ujian">
          <div className="flex h-48 items-end justify-center gap-10">
            {data.perbandinganTipe.map((item, index) => (
              <div key={item.label} className="flex h-full w-20 flex-col items-center justify-end gap-2">
                <span className="text-sm font-medium tabular-nums">{item.nilai === null ? "-" : item.nilai}</span>
                <div
                  className={`w-12 rounded-t-md ${index === 0 ? "bg-brand" : "bg-brand/50"}`}
                  style={{ height: `${item.nilai === null ? 0 : Math.max((item.nilai / comparisonMax) * 80, 5)}%` }}
                />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Progress Tugas">
          <div className="space-y-4">
            {(
              [
                ["Sudah dikumpulkan", data.progressTugas.sudah, "bg-brand"],
                ["Belum dikumpulkan", data.progressTugas.belum, "bg-foreground/30"],
              ] as const
            ).map(([label, value, fill]) => (
              <div key={label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="font-medium tabular-nums">{value}</span>
                </div>
                <div className="h-2 rounded-sm bg-foreground/10">
                  <div className={`h-full rounded-sm ${fill}`} style={{ width: `${totalTugas ? (value / totalTugas) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Nilai Berdasarkan Mata Pelajaran">
          <HorizontalBars items={data.nilaiPerMapel.map((item) => ({ label: item.mapel, value: item.nilai }))} />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Nilai Terbaru">
          <AssessmentList items={data.nilaiTerbaru} empty="Belum ada nilai." />
        </Panel>
        <Panel title="Asesmen dengan Nilai Tertinggi">
          <AssessmentList items={data.nilaiTertinggi} empty="Belum ada nilai." />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Asesmen Belum Dikerjakan">
          {data.asesmenBelumDikerjakan.length ? (
            <div className="space-y-2">
              {data.asesmenBelumDikerjakan.map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <p className="text-sm font-medium">{item.judul}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.mapel} · {item.tipe}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Tidak ada asesmen yang tertunda.</Empty>
          )}
        </Panel>

        <Panel title="Tugas Belum Dikumpulkan">
          {data.tugasBelumDikumpulkan.length ? (
            <div className="space-y-2">
              {data.tugasBelumDikumpulkan.map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <p className="text-sm font-medium">{item.judul}</p>
                  <p className="text-xs text-muted-foreground">{item.mapel}</p>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Semua tugas sudah dikumpulkan.</Empty>
          )}
        </Panel>
      </div>
    </div>
  );
}