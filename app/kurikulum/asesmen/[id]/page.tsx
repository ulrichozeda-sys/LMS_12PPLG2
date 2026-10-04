"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, LayoutGrid, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import KurikulumShell from "@/components/KurikulumShell";

interface OpsiJawaban {
  id: string;
  teks: string;
  isBenar: boolean;
  urutan: number;
}
interface Soal {
  id: string;
  urutan: number;
  tipe: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan: string;
  gambar: string | null;
  opsi: OpsiJawaban[];
}
interface AsesmenDetail {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  status: "PROSES" | "SELESAI";
  durasiMenit: number | null;
  deskripsi: string | null;
  mapel: { id?: string; nama: string } | null;
  guru: { nama: string };
  kelasTujuan: { kelas: { id: string; judul: string } }[];
  soal: Soal[];
}

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const inputCls =
  "h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors duration-150 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-9";

const iconBtn =
  `inline-flex size-10 cursor-pointer items-center justify-center rounded-md border bg-background text-foreground transition-colors duration-150 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 sm:size-9 ${focusRing}`;

export default function KurikulumAsesmenDetailPage() {
  const router = useRouter();
  const params = useParams();
  const asesmenId = params.id as string;

  const [asesmen, setAsesmen] = useState<AsesmenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAsesmen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmenId]);

  async function loadAsesmen() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat asesmen.");
        return;
      }
      setAsesmen(data.data);
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const soalTerfilter = asesmen ? asesmen.soal.filter((s) => s.pertanyaan.toLowerCase().includes(search.toLowerCase())) : [];
  const halamanCount = soalTerfilter.length;
  const currentSoal = soalTerfilter[activeIndex] ?? null;

  if (loading) {
    return (
      <KurikulumShell activeTab="ASESMEN">
        <div className="space-y-3" role="status" aria-label="Memuat asesmen">
          <div className="h-24 animate-pulse rounded-lg border bg-muted" />
          <div className="h-10 animate-pulse rounded-lg border bg-muted" />
          <div className="h-72 animate-pulse rounded-lg border bg-muted" />
        </div>
      </KurikulumShell>
    );
  }
  if (error || !asesmen) {
    return (
      <KurikulumShell activeTab="ASESMEN">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">{error || "Asesmen tidak ditemukan."}</p>
          <Button variant="outline" onClick={() => router.push("/kurikulum")}>Kembali</Button>
        </div>
      </KurikulumShell>
    );
  }

  return (
    <KurikulumShell activeTab="ASESMEN">
      <div className="pb-10">
        <Link
          href="/kurikulum"
          className={`mb-4 inline-flex min-h-10 items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground ${focusRing}`}
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Kembali ke Kurikulum
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border bg-card p-5 text-card-foreground">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">{asesmen.judul}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="brand">{asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
              {asesmen.mapel && <Badge tone="gray">{asesmen.mapel.nama}</Badge>}
              <Badge tone={asesmen.status === "SELESAI" ? "green" : "amber"}>{asesmen.status === "SELESAI" ? "Selesai" : "Proses"}</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Dibuat oleh {asesmen.guru.nama}</p>
            {asesmen.deskripsi && <p className="mt-1 text-sm">{asesmen.deskripsi}</p>}
            {asesmen.kelasTujuan.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {asesmen.kelasTujuan.map(({ kelas }) => (
                  <Badge key={kelas.id} tone="gray">
                    {kelas.judul}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="sm:text-right">
            <p className="text-xs text-muted-foreground">Durasi pengerjaan</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {asesmen.durasiMenit ? `${asesmen.durasiMenit} menit` : "Belum diatur"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/kurikulum/asesmen/${asesmenId}/jawaban`}
            className={`inline-flex h-10 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium transition-colors duration-150 hover:bg-accent sm:h-9 ${focusRing}`}
          >
            Jawaban
          </Link>
          <div className="relative min-w-[180px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="Cari soal..."
              aria-label="Cari soal"
              className={inputCls}
            />
          </div>
          <div className="flex items-center gap-1">
            <button aria-label="Soal sebelumnya" onClick={() => setActiveIndex((i) => Math.max(0, i - 1))} disabled={activeIndex === 0} className={iconBtn}>
              <ChevronLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <span className="min-w-12 px-1 text-center text-sm tabular-nums text-muted-foreground">
              {halamanCount === 0 ? "0/0" : `${activeIndex + 1}/${halamanCount}`}
            </span>
            <button aria-label="Soal berikutnya" onClick={() => setActiveIndex((i) => Math.min(halamanCount - 1, i + 1))} disabled={activeIndex >= halamanCount - 1} className={iconBtn}>
              <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              onClick={() => setShowGrid((v) => !v)}
              aria-pressed={showGrid}
              className={`${iconBtn} ${showGrid ? "bg-accent" : ""}`}
              title="Buka Library Soal"
              aria-label="Buka Library Soal"
            >
              <LayoutGrid className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>

        {showGrid && (
          <div className="mt-3 rounded-lg border bg-card p-3 text-card-foreground">
            <p className="mb-3 text-sm font-medium">Library Soal</p>
            {halamanCount === 0 ? (
              <p className="text-sm text-muted-foreground">{search ? "Tidak ada soal yang cocok." : "Belum ada soal."}</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {soalTerfilter.map((soal, i) => (
                  <button
                    key={soal.id}
                    onClick={() => {
                      setActiveIndex(i);
                      setShowGrid(false);
                    }}
                    aria-label={`Soal ${i + 1}`}
                    aria-current={i === activeIndex ? "true" : undefined}
                    className={`flex size-10 cursor-pointer items-center justify-center rounded-md border text-sm font-medium tabular-nums transition-colors duration-150 ${focusRing} ${
                      i === activeIndex ? "border-brand bg-brand text-brand-foreground" : "bg-muted hover:bg-accent"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 min-h-[360px] rounded-lg border bg-card p-5 text-card-foreground sm:p-6">
          {asesmen.soal.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada soal.</p>
          ) : halamanCount === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada soal yang cocok dengan pencarian.</p>
          ) : currentSoal ? (
            <div>
              <div className="flex items-start justify-between gap-2">
                <Badge tone="gray">
                  {currentSoal.tipe === "PILIHAN_GANDA" ? "Pilihan Ganda" : currentSoal.tipe === "CHECKBOX" ? "Checkbox" : "Essay"}
                </Badge>
              </div>

              <p className="mt-4 text-base font-semibold leading-relaxed">
                {activeIndex + 1}. {currentSoal.pertanyaan}
              </p>

              {currentSoal.gambar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentSoal.gambar} alt="Gambar soal" className="mt-3 max-h-64 rounded-lg border object-contain" />
              )}

              {currentSoal.tipe !== "ESSAY" ? (
                <div className="mt-4 space-y-2">
                  {currentSoal.opsi.map((o) => (
                    <div
                      key={o.id}
                      className={`flex min-h-11 items-center justify-between gap-3 rounded-md border px-4 py-2.5 text-sm ${
                        o.isBenar ? "border-brand bg-brand-subtle" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type={currentSoal.tipe === "PILIHAN_GANDA" ? "radio" : "checkbox"}
                          checked={o.isBenar}
                          readOnly
                          disabled
                          className="size-4 accent-brand"
                        />
                        <span>{o.teks}</span>
                      </div>
                      {o.isBenar && <Badge tone="green">Kunci Jawaban</Badge>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Soal Essay — dinilai manual oleh guru setelah siswa mengumpulkan.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Tampilan read-only untuk monitoring Kurikulum.</p>
          <Badge tone={asesmen.status === "SELESAI" ? "green" : "amber"}>
            {asesmen.status === "SELESAI" ? "Sudah dipublikasikan ke kelas" : "Belum dipublikasikan"}
          </Badge>
        </div>
      </div>
    </KurikulumShell>
  );
}