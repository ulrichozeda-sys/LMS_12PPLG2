"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { showAlert } from "@/lib/dialog";

interface OpsiSoal {
  id: string;
  teks: string;
  urutan: number;
  isBenar: boolean;
}
type StatusSoal = "BENAR" | "SALAH" | "SEBAGIAN_BENAR" | "BELUM_DIJAWAB" | "BELUM_DINILAI" | "SUDAH_DINILAI";
interface SoalDetail {
  id: string;
  urutan: number;
  tipe: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan: string;
  gambar: string | null;
  opsi: OpsiSoal[];
  jawabanSiswa: { id: string; jawabanEssay: string | null; nilaiSoal: number | null; raguRagu: boolean; opsiDipilihIds: string[] } | null;
  status: StatusSoal;
}
interface DetailResponse {
  submissionId: string;
  siswa: { nama: string; nis: string; kelasJurusan: string };
  asesmen: { judul: string; mapel: string | null };
  kelas: string;
  mulaiPada: string;
  submittedAt: string | null;
  nilaiAkhir: number | null;
  rekap: {
    totalBenar: number;
    totalSalah: number;
    totalKosong: number;
    totalEssay: number;
    totalEssayBelumDinilai: number;
    totalObjektif: number;
    totalObjektifDijawab: number;
    totalEssayDijawab: number;
    totalRaguRagu: number;
    nilaiObjektif: number;
  };
  soal: SoalDetail[];
}

const STATUS_BADGE: Record<StatusSoal, { label: string; tone: "green" | "red" | "amber" | "gray" }> = {
  BENAR: { label: "Benar", tone: "green" },
  SALAH: { label: "Salah", tone: "red" },
  SEBAGIAN_BENAR: { label: "Sebagian Benar", tone: "amber" },
  BELUM_DIJAWAB: { label: "Belum Dijawab", tone: "gray" },
  BELUM_DINILAI: { label: "Belum Dinilai", tone: "amber" },
  SUDAH_DINILAI: { label: "Sudah Dinilai", tone: "green" },
};

// Warna kotak nomor soal (hanya brand, danger, dan netral)
const GRID_TONE: Record<StatusSoal, string> = {
  BENAR: "border-brand bg-brand-subtle",
  SUDAH_DINILAI: "border-brand bg-brand-subtle",
  SALAH: "border-danger bg-danger/10 text-danger",
  SEBAGIAN_BENAR: "border-dashed border-foreground/50",
  BELUM_DINILAI: "border-dashed border-foreground/50",
  BELUM_DIJAWAB: "text-muted-foreground",
};

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const inputCls =
  "h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors duration-150 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const iconBtn =
  `inline-flex size-10 cursor-pointer items-center justify-center rounded-md border bg-background text-foreground transition-colors duration-150 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

function formatTanggal(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function DetailJawabanSiswaPage() {
  const params = useParams();
  const router = useRouter();
  const asesmenId = params.id as string;
  const submissionId = params.submissionId as string;

  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [urutanSiswa, setUrutanSiswa] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);

  const [nilaiEssayInput, setNilaiEssayInput] = useState("");
  const [savingEssay, setSavingEssay] = useState(false);

  async function loadDetail() {
    setLoading(true);
    setError("");
    try {
      const [detailRes, nilaiRes] = await Promise.all([
        fetch(`/api/asesmen/${asesmenId}/jawaban/${submissionId}`),
        fetch(`/api/asesmen/${asesmenId}/nilai`),
      ]);
      const detailData = await detailRes.json();
      if (!detailRes.ok) {
        setError(detailData.error ?? "Gagal memuat jawaban siswa.");
        return;
      }
      setDetail(detailData.data);
      setActiveIndex(0);

      if (nilaiRes.ok) {
        const nilaiData = await nilaiRes.json();
        setUrutanSiswa((nilaiData.data?.nilai ?? []).map((r: { submissionId: string }) => r.submissionId));
      }
    } catch {
      setError("Terjadi kesalahan saat memuat jawaban siswa.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmenId, submissionId]);

  const currentSoal = detail?.soal[activeIndex] ?? null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNilaiEssayInput(currentSoal?.jawabanSiswa?.nilaiSoal?.toString() ?? "");
  }, [currentSoal?.id, currentSoal?.jawabanSiswa?.nilaiSoal]);

  const { prevSiswaId, nextSiswaId } = useMemo(() => {
    const idx = urutanSiswa.indexOf(submissionId);
    return {
      prevSiswaId: idx > 0 ? urutanSiswa[idx - 1] : null,
      nextSiswaId: idx >= 0 && idx < urutanSiswa.length - 1 ? urutanSiswa[idx + 1] : null,
    };
  }, [urutanSiswa, submissionId]);

  async function handleSimpanEssay() {
    if (!currentSoal?.jawabanSiswa) return;
    const nilai = Number(nilaiEssayInput);
    if (Number.isNaN(nilai) || nilai < 0 || nilai > 100) {
      await showAlert("Nilai essay harus angka 0-100.");
      return;
    }
    setSavingEssay(true);
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/jawaban/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jawabanSiswaId: currentSoal.jawabanSiswa.id, nilaiSoal: nilai }),
      });
      const data = await res.json();
      if (!res.ok) {
        await showAlert(data.error ?? "Gagal menyimpan nilai essay.");
        return;
      }
      await loadDetail();
    } catch {
      await showAlert("Gagal menyimpan nilai essay.");
    } finally {
      setSavingEssay(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-3" role="status" aria-label="Memuat jawaban siswa">
        <div className="h-24 animate-pulse rounded-lg border bg-muted" />
        <div className="h-40 animate-pulse rounded-lg border bg-muted" />
        <div className="h-72 animate-pulse rounded-lg border bg-muted" />
      </div>
    );
  }
  if (error || !detail) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center">
        <p className="text-sm text-danger">{error || "Jawaban siswa tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push(`/guru/asesmen/${asesmenId}/jawaban`)}>
          Kembali
        </Button>
      </div>
    );
  }

  const { rekap } = detail;

  const summaryRows: { label: string; value: string }[] = [
    { label: "Mulai", value: formatTanggal(detail.mulaiPada) },
    { label: "Dikumpulkan", value: formatTanggal(detail.submittedAt) },
    { label: "Pilihan Ganda Dikerjakan", value: `${rekap.totalObjektifDijawab}/${rekap.totalObjektif}` },
    { label: "Essay Dikerjakan", value: `${rekap.totalEssayDijawab}/${rekap.totalEssay}` },
    { label: "Jumlah Ragu-ragu", value: String(rekap.totalRaguRagu) },
  ];

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <Link
        href={`/guru/asesmen/${asesmenId}/jawaban`}
        className={`mb-3 inline-flex min-h-10 items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground ${focusRing}`}
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
        Kembali ke Daftar Jawaban
      </Link>

      <div className="rounded-lg border bg-card p-5 text-card-foreground">
        <p className="text-xs text-muted-foreground">Jawaban Siswa</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{detail.siswa.nama}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge tone="gray">
            NIS <span className="font-mono">{detail.siswa.nis}</span>
          </Badge>
          <Badge tone="gray">{detail.siswa.kelasJurusan}</Badge>
          <Badge tone="gray">{detail.kelas}</Badge>
          {detail.asesmen.mapel && <Badge tone="brand">{detail.asesmen.mapel}</Badge>}
        </div>
        <p className="mt-3 text-sm font-medium">{detail.asesmen.judul}</p>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border bg-card text-card-foreground">
        <div className="grid lg:grid-cols-[1fr_220px]">
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Ringkasan</th>
                  <th className="pb-2 text-right font-medium">Hasil</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summaryRows.map((row) => (
                  <tr key={row.label}>
                    <td className="py-2.5 text-muted-foreground">{row.label}</td>
                    <td className="py-2.5 text-right font-medium tabular-nums">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="order-first grid grid-cols-2 border-b bg-muted lg:order-last lg:grid-cols-1 lg:border-b-0 lg:border-l">
            <div className="p-4 text-center lg:border-b">
              <p className="text-xs text-muted-foreground">Nilai Objektif</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{rekap.nilaiObjektif}</p>
            </div>
            <div className="border-l p-4 text-center lg:border-l-0">
              <p className="text-xs text-muted-foreground">Nilai Akhir</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{detail.nilaiAkhir ?? "-"}</p>
              <span aria-hidden="true" className="mx-auto mt-2 block h-0.5 w-8 rounded-sm bg-brand" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={!prevSiswaId} onClick={() => prevSiswaId && router.push(`/guru/asesmen/${asesmenId}/jawaban/${prevSiswaId}`)}>
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Siswa Sebelumnya
        </Button>
        <Button size="sm" variant="outline" disabled={!nextSiswaId} onClick={() => nextSiswaId && router.push(`/guru/asesmen/${asesmenId}/jawaban/${nextSiswaId}`)}>
          Siswa Berikutnya
          <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <button
            aria-label="Soal sebelumnya"
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            disabled={activeIndex === 0}
            className={iconBtn}
          >
            <ChevronLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <span className="min-w-14 px-1 text-center text-sm tabular-nums text-muted-foreground">
            {detail.soal.length === 0 ? "0/0" : `${activeIndex + 1}/${detail.soal.length}`}
          </span>
          <button
            aria-label="Soal berikutnya"
            onClick={() => setActiveIndex((i) => Math.min(detail.soal.length - 1, i + 1))}
            disabled={activeIndex >= detail.soal.length - 1}
            className={iconBtn}
          >
            <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            onClick={() => setShowGrid((v) => !v)}
            aria-pressed={showGrid}
            className={`${iconBtn} ${showGrid ? "bg-accent" : ""}`}
            title="Daftar Nomor Soal"
            aria-label="Daftar Nomor Soal"
          >
            <LayoutGrid className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      {showGrid && (
        <div className="mt-3 rounded-lg border bg-card p-3 text-card-foreground">
          <p className="mb-3 text-sm font-medium">Daftar Soal</p>
          {detail.soal.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada soal.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {detail.soal.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveIndex(i);
                    setShowGrid(false);
                  }}
                  title={STATUS_BADGE[s.status].label}
                  aria-label={`Soal ${i + 1}, ${STATUS_BADGE[s.status].label}`}
                  className={`flex size-10 cursor-pointer items-center justify-center rounded-md border text-sm font-medium tabular-nums transition-colors duration-150 ${focusRing} ${
                    i === activeIndex ? "border-brand bg-brand text-brand-foreground" : GRID_TONE[s.status]
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 min-h-[300px] rounded-lg border bg-card p-5 text-card-foreground sm:p-6">
        {detail.soal.length === 0 ? (
          <p className="text-sm text-muted-foreground">Siswa ini belum menjawab soal apapun.</p>
        ) : currentSoal ? (
          <div>
            <div className="flex items-start justify-between gap-2">
              <Badge tone="gray">
                {currentSoal.tipe === "PILIHAN_GANDA" ? "Pilihan Ganda" : currentSoal.tipe === "CHECKBOX" ? "Checkbox" : "Essay"}
              </Badge>
              <Badge tone={STATUS_BADGE[currentSoal.status].tone}>{STATUS_BADGE[currentSoal.status].label}</Badge>
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
                {currentSoal.opsi.map((o) => {
                  const dipilihSiswa = currentSoal.jawabanSiswa?.opsiDipilihIds.includes(o.id) ?? false;
                  const tone =
                    o.isBenar && dipilihSiswa
                      ? "border-brand bg-brand-subtle"
                      : o.isBenar
                      ? "border-brand"
                      : dipilihSiswa
                      ? "border-danger bg-danger/5"
                      : "";

                  return (
                    <div key={o.id} className={`flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-md border px-4 py-2.5 text-sm ${tone}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type={currentSoal.tipe === "PILIHAN_GANDA" ? "radio" : "checkbox"}
                          checked={dipilihSiswa}
                          readOnly
                          className="size-4 accent-brand"
                        />
                        <span>{o.teks}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {dipilihSiswa && <Badge tone="brand">Dipilih Siswa</Badge>}
                        {o.isBenar && <Badge tone="green">Kunci Jawaban</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-md border bg-muted p-4 text-sm">
                  {currentSoal.jawabanSiswa?.jawabanEssay || <span className="text-muted-foreground">Siswa belum menjawab.</span>}
                </div>

                {currentSoal.jawabanSiswa && (
                  <div className="flex flex-wrap items-end gap-2">
                    <div>
                      <label htmlFor="nilai-essay" className="mb-1 block text-xs text-muted-foreground">
                        Nilai Essay (0-100)
                      </label>
                      <input
                        id="nilai-essay"
                        type="number"
                        min={0}
                        max={100}
                        value={nilaiEssayInput}
                        onChange={(e) => setNilaiEssayInput(e.target.value)}
                        className={`${inputCls} w-28 tabular-nums`}
                      />
                    </div>
                    <Button size="sm" loading={savingEssay} onClick={handleSimpanEssay}>
                      Simpan Nilai
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}