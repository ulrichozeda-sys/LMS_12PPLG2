"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Badge from "@/components/ui/Badge";
import TabelNilai from "@/components/Tabelnilai";

interface NilaiRow {
  submissionId: string;
  nama: string;
  nis: string;
  kelasReferensi: string;
  kelas: { id: string; judul: string }[];
  nilaiObjektif: number;
  nilaiAkhir: number | null;
  nilaiSementara: number;
  totalSoalTerjawab: number;
}

interface KelasTujuan {
  kelas: { id: string; judul: string };
}

interface NilaiResponse {
  asesmen: { judul: string; tipe: "KUIS" | "UJIAN"; mapel?: string };
  kelas: string[];
  nilai: NilaiRow[];
}

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function GuruJawabanPage() {
  const params = useParams();
  const asesmenId = params.id as string;
  const [hasil, setHasil] = useState<NilaiResponse | null>(null);
  const [kelasTujuan, setKelasTujuan] = useState<KelasTujuan[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [nilaiRes, asesmenRes] = await Promise.all([
        fetch(`/api/asesmen/${asesmenId}/nilai`),
        fetch(`/api/asesmen/${asesmenId}`),
      ]);
      const nilaiData = await nilaiRes.json();
      const asesmenData = await asesmenRes.json();
      if (!nilaiRes.ok) {
        setError(nilaiData.error ?? "Gagal memuat jawaban.");
        return;
      }
      setHasil(nilaiData.data);
      setKelasTujuan(asesmenData.data?.kelasTujuan ?? []);
    } catch {
      setError("Gagal memuat jawaban.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmenId]);

  const selectedRows = useMemo(
    () => hasil?.nilai.filter((row) => row.kelas.some((kelas) => kelas.id === selectedKelasId)) ?? [],
    [hasil, selectedKelasId]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-3" role="status" aria-label="Memuat jawaban">
        <div className="h-24 animate-pulse rounded-lg border bg-muted" />
        <div className="h-20 animate-pulse rounded-lg border bg-muted" />
      </div>
    );
  }
  if (!hasil) return <p className="text-sm text-danger">{error || "Jawaban tidak ditemukan."}</p>;

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <Link
        href={`/guru/asesmen/${asesmenId}`}
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground ${focusRing}`}
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
        Kembali ke Asesmen
      </Link>

      <div className="mt-3 rounded-lg border bg-card p-5 text-card-foreground">
        <p className="text-xs text-muted-foreground">Jawaban Siswa</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{hasil.asesmen.judul}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="brand">{hasil.asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
          {hasil.asesmen.mapel && <Badge tone="gray">{hasil.asesmen.mapel}</Badge>}
          <Badge tone="green">{hasil.nilai.length} sudah mengumpulkan</Badge>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold">Daftar Perkelas</h2>
        {kelasTujuan.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">Belum ada kelas tujuan.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {kelasTujuan.map(({ kelas }) => {
              const count = hasil.nilai.filter((row) => row.kelas.some((item) => item.id === kelas.id)).length;
              const active = selectedKelasId === kelas.id;
              return (
                <button
                  key={kelas.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedKelasId(active ? null : kelas.id)}
                  className={`flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-lg border bg-card p-4 text-left text-card-foreground transition-colors duration-150 hover:bg-accent ${focusRing} ${
                    active ? "border-brand bg-brand-subtle hover:bg-brand-subtle" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{kelas.judul}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">siswa mengumpulkan jawaban</span>
                  </span>
                  <span className="shrink-0 text-xl font-semibold tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedKelasId && (
        <div className="mt-6">
          <TabelNilai
            asesmenId={asesmenId}
            judulAsesmen={hasil.asesmen.judul}
            nilaiList={selectedRows}
            onReset={loadData}
            kelasId={selectedKelasId}
            namaKelas={kelasTujuan.find(({ kelas }) => kelas.id === selectedKelasId)?.kelas.judul}
            tipeAsesmen={hasil.asesmen.tipe}
            namaMapel={hasil.asesmen.mapel ?? "-"}
          />
        </div>
      )}
    </div>
  );
}