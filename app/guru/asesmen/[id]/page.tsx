"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, LayoutGrid, Search, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ModalBuatSoal from "@/components/ModalBuatSoal";
import { showAlert, showConfirm } from "@/lib/dialog";

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
  mapel: { id: string; nama: string } | null;
  soal: Soal[];
}

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const inputCls =
  "h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors duration-150 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-9";

const iconBtn =
  `inline-flex size-10 cursor-pointer items-center justify-center rounded-md border bg-background text-foreground transition-colors duration-150 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 sm:size-9 ${focusRing}`;

export default function GuruAsesmenDetailPage() {
  const router = useRouter();
  const params = useParams();
  const asesmenId = params.id as string;

  const [asesmen, setAsesmen] = useState<AsesmenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [search, setSearch] = useState("");

  const [showModalSoal, setShowModalSoal] = useState(false);
  const [editingSoal, setEditingSoal] = useState<Soal | null>(null);

  const [editingDurasi, setEditingDurasi] = useState(false);
  const [durasiInput, setDurasiInput] = useState("");

  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
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
        setLoading(false);
        return;
      }
      setAsesmen(data.data);
      const savedPageCount = Number(window.localStorage.getItem(`asesmen-pages-${asesmenId}`) ?? 0);
      setPageCount(Math.max(data.data.soal.length, Number.isFinite(savedPageCount) ? savedPageCount : 0));
      setDurasiInput(data.data.durasiMenit?.toString() ?? "");
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const soalTerfilter = asesmen ? asesmen.soal.filter((s) => s.pertanyaan.toLowerCase().includes(search.toLowerCase())) : [];
  const halamanCount = Math.max(pageCount, soalTerfilter.length);
  const currentSoal = soalTerfilter[activeIndex] ?? null;

  function openBuatSoal() {
    setEditingSoal(currentSoal);
    setShowModalSoal(true);
  }
  function openEditSoal(soal: Soal) {
    setEditingSoal(soal);
    setShowModalSoal(true);
  }
  function handleTambahHalaman() {
    const nextIndex = Math.max(pageCount, asesmen?.soal.length ?? 0);
    const nextPageCount = nextIndex + 1;
    setPageCount(nextPageCount);
    window.localStorage.setItem(`asesmen-pages-${asesmenId}`, String(nextPageCount));
    setActiveIndex(nextIndex);
    setSearch("");
    setShowGrid(true);
    setEditingSoal(null);
  }
  async function handleHapusHalaman(index: number) {
    if (!(await showConfirm(`Hapus halaman ${index + 1}?`))) return;

    const nextPageCount = Math.max(0, halamanCount - 1);
    setPageCount(nextPageCount);
    setActiveIndex(Math.max(0, Math.min(index, nextPageCount - 1)));
    window.localStorage.setItem(`asesmen-pages-${asesmenId}`, String(nextPageCount));
    setShowGrid(true);
  }
  async function handleDeleteSoal(soalId: string) {
    if (!(await showConfirm("Hapus soal ini?"))) return;
    await fetch(`/api/asesmen/${asesmenId}/soal/${soalId}`, { method: "DELETE" });
    loadAsesmen();
  }

  async function handleSaveDurasi() {
    await fetch(`/api/asesmen/${asesmenId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durasiMenit: durasiInput ? Number(durasiInput) : null }),
    });
    setEditingDurasi(false);
    loadAsesmen();
  }

  async function handleToggleKunci(opsiId: string) {
    if (!currentSoal) return;
    let opsiBenarIds: string[];
    if (currentSoal.tipe === "CHECKBOX") {
      const sudahBenar = currentSoal.opsi.find((o) => o.id === opsiId)?.isBenar;
      const currentBenar = currentSoal.opsi.filter((o) => o.isBenar).map((o) => o.id);
      opsiBenarIds = sudahBenar ? currentBenar.filter((id) => id !== opsiId) : [...currentBenar, opsiId];
    } else {
      opsiBenarIds = [opsiId];
    }
    await fetch(`/api/asesmen/${asesmenId}/soal/${currentSoal.id}/kunci`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opsiBenarIds }),
    });
    loadAsesmen();
  }

  async function handleSelesai() {
    if (!asesmen) return;
    if (asesmen.soal.length === 0) {
      await showAlert("Tambahkan minimal 1 soal sebelum menyelesaikan asesmen.");
      return;
    }
    if (!(await showConfirm("Selesaikan asesmen? Asesmen akan langsung tampil ke siswa di kelas tujuan."))) return;
    setFinalizing(true);
    try {
      await fetch(`/api/asesmen/${asesmenId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SELESAI" }),
      });
      loadAsesmen();
    } finally {
      setFinalizing(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-3" role="status" aria-label="Memuat asesmen">
        <div className="h-24 animate-pulse rounded-lg border bg-muted" />
        <div className="h-10 animate-pulse rounded-lg border bg-muted" />
        <div className="h-72 animate-pulse rounded-lg border bg-muted" />
      </div>
    );
  }
  if (error || !asesmen) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">{error || "Asesmen tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push("/guru/asesmen")}>
          Kembali
        </Button>
      </div>
    );
  }

  const isEditable = asesmen.status === "PROSES";

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <Link
        href="/guru/asesmen"
        className={`mb-4 inline-flex min-h-10 items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground ${focusRing}`}
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
        Kembali ke Asesmen
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border bg-card p-5 text-card-foreground">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{asesmen.judul}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">{asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
            {asesmen.mapel && <Badge tone="gray">{asesmen.mapel.nama}</Badge>}
            <Badge tone={asesmen.status === "SELESAI" ? "green" : "amber"}>{asesmen.status === "SELESAI" ? "Selesai" : "Proses"}</Badge>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-xs text-muted-foreground">Durasi pengerjaan</p>
          {editingDurasi ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={durasiInput}
                onChange={(e) => setDurasiInput(e.target.value)}
                aria-label="Durasi pengerjaan (menit)"
                className={`${inputCls} w-20 tabular-nums`}
              />
              <Button size="sm" onClick={handleSaveDurasi}>Simpan</Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => isEditable && setEditingDurasi(true)}
              disabled={!isEditable}
              className={`mt-1 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-sm text-sm font-semibold tabular-nums disabled:cursor-default ${focusRing}`}
            >
              {asesmen.durasiMenit ? `${asesmen.durasiMenit} menit` : "Belum diatur"}
              {isEditable && <span className="text-xs font-normal underline underline-offset-2">Atur Durasi</span>}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isEditable && (
          <Button size="sm" onClick={openBuatSoal}>
            {currentSoal ? "Edit Soal" : "+ Buat Soal"}
          </Button>
        )}
        <Link
          href={`/guru/asesmen/${asesmenId}/jawaban`}
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
            className={`${inputCls} w-full pl-9`}
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Library Soal</p>
            {isEditable && (
              <Button size="sm" onClick={handleTambahHalaman}>
                + Tambah Halaman
              </Button>
            )}
          </div>
          {halamanCount === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada halaman soal.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: halamanCount }, (_, i) => soalTerfilter[i] ?? null).map((soal, i) => (
                <div key={soal?.id ?? `halaman-${i}`} className="group relative">
                  <button
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Halaman ${i + 1}${soal ? "" : ", kosong"}`}
                    aria-current={i === activeIndex ? "true" : undefined}
                    className={`flex size-10 cursor-pointer items-center justify-center rounded-md border text-sm font-medium tabular-nums transition-colors duration-150 ${focusRing} ${
                      i === activeIndex
                        ? "border-brand bg-brand text-brand-foreground"
                        : soal
                        ? "bg-muted hover:bg-accent"
                        : "border-dashed text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {i + 1}
                  </button>
                  {isEditable && !soal && (
                    <button
                      type="button"
                      onClick={() => handleHapusHalaman(i)}
                      aria-label={`Hapus halaman ${i + 1}`}
                      title={`Hapus halaman ${i + 1}`}
                      className="absolute -right-1.5 -top-1.5 hidden size-5 cursor-pointer items-center justify-center rounded-sm bg-danger text-white group-focus-within:flex group-hover:flex"
                    >
                      <X className="size-3" strokeWidth={2} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 min-h-[300px] rounded-lg border bg-card p-5 text-card-foreground sm:p-6">
        {halamanCount === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada soal. Klik &quot;+ Buat Soal&quot; untuk mulai.</p>
        ) : currentSoal ? (
          <div>
            <div className="flex items-start justify-between gap-2">
              <Badge tone="gray">
                {currentSoal.tipe === "PILIHAN_GANDA" ? "Pilihan Ganda" : currentSoal.tipe === "CHECKBOX" ? "Checkbox" : "Essay"}
              </Badge>
              {isEditable && (
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditSoal(currentSoal)}
                    className={`inline-flex min-h-10 cursor-pointer items-center rounded-sm px-2 text-sm font-medium underline underline-offset-2 ${focusRing}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSoal(currentSoal.id)}
                    className={`inline-flex min-h-10 cursor-pointer items-center rounded-sm px-2 text-sm font-medium text-danger hover:underline ${focusRing}`}
                  >
                    Hapus
                  </button>
                </div>
              )}
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
                  <label
                    key={o.id}
                    className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-4 py-2.5 text-sm transition-colors duration-150 ${
                      o.isBenar ? "border-brand bg-brand-subtle" : "hover:bg-accent"
                    }`}
                  >
                    <input
                      type={currentSoal.tipe === "PILIHAN_GANDA" ? "radio" : "checkbox"}
                      checked={o.isBenar}
                      disabled={!isEditable}
                      onChange={() => handleToggleKunci(o.id)}
                      className="size-4 accent-brand"
                    />
                    <span className="flex-1">{o.teks}</span>
                    {o.isBenar && <span className="text-xs font-medium">Kunci</span>}
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Soal Essay — dinilai manual setelah siswa mengumpulkan.</p>
            )}
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted px-4 text-center">
            <p className="text-sm font-medium">Halaman {activeIndex + 1} masih kosong</p>
            <p className="mt-1 text-sm text-muted-foreground">Buat soal untuk mengisi halaman ini.</p>
            {isEditable && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={openBuatSoal}>
                  + Buat Soal
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleHapusHalaman(activeIndex)}>
                  Hapus Halaman
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Kunci jawaban langsung tersimpan saat kamu klik opsi di atas.</p>
        {isEditable ? (
          <Button loading={finalizing} onClick={handleSelesai}>
            Selesaikan Asesmen
          </Button>
        ) : (
          <Badge tone="green">Sudah dipublikasikan ke kelas</Badge>
        )}
      </div>

      <ModalBuatSoal open={showModalSoal} onClose={() => setShowModalSoal(false)} onSuccess={loadAsesmen} asesmenId={asesmenId} mode={editingSoal ? "edit" : "create"} initialData={editingSoal} />
    </div>
  );
}