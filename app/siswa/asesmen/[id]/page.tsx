// app/siswa/asesmen/[id]/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, LayoutGrid, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import { showConfirm } from "@/lib/dialog";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";

interface OpsiSoal {
  id: string;
  teks: string;
  urutan: number;
}
interface Soal {
  id: string;
  urutan: number;
  tipe: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan: string;
  gambar: string | null;
  opsi: OpsiSoal[];
}
interface JawabanTersimpan {
  soalId: string;
  opsiIds: string[];
  jawabanEssay: string | null;
  raguRagu: boolean;
}
interface AsesmenDetail {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  durasiMenit: number | null;
  mapel: { nama: string } | null;
  soal: Soal[];
  submissionId: string;
  submissionStatus: "BELUM" | "SUDAH";
  tabSwitchCount: number;
  mulaiPada: string;
  jawabanTersimpan: JawabanTersimpan[];
}
interface JawabanLokal {
  opsiIds: string[];
  jawabanEssay: string;
  raguRagu: boolean;
}

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const iconBtn =
  `inline-flex size-10 cursor-pointer items-center justify-center rounded-md border bg-background text-foreground transition-colors duration-150 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 sm:size-9 ${focusRing}`;

const fieldCls =
  "rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors duration-150 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function SiswaAsesmenKerjakanPage() {
  const router = useRouter();
  const params = useParams();
  const asesmenId = params.id as string;

  const [asesmen, setAsesmen] = useState<AsesmenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [search, setSearch] = useState("");

  const [jawabanMap, setJawabanMap] = useState<Record<string, JawabanLokal>>({});

  const [sisaDetik, setSisaDetik] = useState(0);
  const [pelanggaranModal, setPelanggaranModal] = useState<{ violationCount: number; jumlahDireset: number } | null>(null);
  const keluarAsesmenRef = useRef(false);
  const mencatatPelanggaranRef = useRef(false);

  const [selesaiLoading, setSelesaiLoading] = useState(false);
  const [sudahSelesai, setSudahSelesai] = useState(false);

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
      const detail: AsesmenDetail = data.data;
      setAsesmen(detail);
      setSudahSelesai(detail.submissionStatus === "SUDAH");

      const map: Record<string, JawabanLokal> = {};
      for (const s of detail.soal) {
        const tersimpan = detail.jawabanTersimpan.find((j) => j.soalId === s.id);
        map[s.id] = {
          opsiIds: tersimpan?.opsiIds ?? [],
          jawabanEssay: tersimpan?.jawabanEssay ?? "",
          raguRagu: tersimpan?.raguRagu ?? false,
        };
      }
      setJawabanMap(map);

      if (detail.durasiMenit) {
        const deadline = new Date(detail.mulaiPada).getTime() + detail.durasiMenit * 60000;
        setSisaDetik(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
      }
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  // ---- timer countdown, dihitung ulang tiap detik dari deadline server-truth ----
  useEffect(() => {
    if (!asesmen || sudahSelesai || !asesmen.durasiMenit) return;
    const deadline = new Date(asesmen.mulaiPada).getTime() + asesmen.durasiMenit * 60000;

    const interval = setInterval(() => {
      const sisa = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setSisaDetik(sisa);
      if (sisa <= 0) {
        clearInterval(interval);
        handleSelesai(true);
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmen, sudahSelesai]);

  // ---- anti-cheat: catat pelanggaran saat siswa kembali ke asesmen ----
  useEffect(() => {
    if (!asesmen || sudahSelesai) return;

    async function catatPelanggaran() {
      if (mencatatPelanggaranRef.current) return;
      mencatatPelanggaranRef.current = true;
      try {
        const res = await fetch(`/api/asesmen/${asesmenId}/pelanggaran`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) return;

        setPelanggaranModal({
          violationCount: data.violationCount ?? 1,
          jumlahDireset: data.jumlahDireset ?? 0,
        });
        await loadAsesmen();
      } catch {
      } finally {
        mencatatPelanggaranRef.current = false;
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        keluarAsesmenRef.current = true;
      } else if (keluarAsesmenRef.current) {
        keluarAsesmenRef.current = false;
        void catatPelanggaran();
      }
    }

    function handleExitRequest() {
      void catatPelanggaran();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("assessment-exit-request", handleExitRequest);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("assessment-exit-request", handleExitRequest);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmen, sudahSelesai, asesmenId]);

  const soalTerfilter = asesmen ? asesmen.soal.filter((s) => s.pertanyaan.toLowerCase().includes(search.toLowerCase())) : [];
  const currentSoal = soalTerfilter[activeIndex] ?? null;
  const jawabanSaatIni = currentSoal ? jawabanMap[currentSoal.id] : null;
  const isKuis = asesmen?.tipe === "KUIS";

  async function simpanJawaban(soalId: string, patch: Partial<JawabanLokal>) {
    setJawabanMap((prev) => ({ ...prev, [soalId]: { ...prev[soalId], ...patch } }));
    const body: { soalId: string; opsiIds?: string[]; jawabanEssay?: string; raguRagu?: boolean } = { soalId };
    if (patch.opsiIds !== undefined) body.opsiIds = patch.opsiIds;
    if (patch.jawabanEssay !== undefined) body.jawabanEssay = patch.jawabanEssay;
    if (patch.raguRagu !== undefined) body.raguRagu = patch.raguRagu;
    await fetch(`/api/asesmen/${asesmenId}/jawab`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function handlePilihOpsiPG(soalId: string, opsiId: string) {
    simpanJawaban(soalId, { opsiIds: [opsiId] });
    if (isKuis) lanjutKeSoalBerikutnya();
  }
  function handleToggleOpsiCB(soalId: string, opsiId: string) {
    const current = jawabanMap[soalId]?.opsiIds ?? [];
    const next = current.includes(opsiId) ? current.filter((id) => id !== opsiId) : [...current, opsiId];
    simpanJawaban(soalId, { opsiIds: next });
  }
  function handleEssayChange(soalId: string, teks: string) {
    setJawabanMap((prev) => ({ ...prev, [soalId]: { ...prev[soalId], jawabanEssay: teks } }));
  }
  function handleToggleRagu(soalId: string) {
    simpanJawaban(soalId, { raguRagu: !jawabanMap[soalId]?.raguRagu });
  }

  // dipake buat Checkbox & Essay di Kuis (tombol "Lanjut" eksplisit) DAN autosave Essay/Checkbox biasa di Ujian saat pindah soal
  async function handleLanjutManual() {
    if (!currentSoal) return;
    await simpanJawaban(currentSoal.id, {
      opsiIds: jawabanMap[currentSoal.id]?.opsiIds ?? [],
      jawabanEssay: jawabanMap[currentSoal.id]?.jawabanEssay ?? "",
    });
    if (isKuis) lanjutKeSoalBerikutnya();
  }

  function lanjutKeSoalBerikutnya() {
    if (activeIndex >= soalTerfilter.length - 1) {
      handleSelesai(false);
    } else {
      setActiveIndex((i) => i + 1);
    }
  }

  async function handleSelesai(otomatis: boolean) {
    if (sudahSelesai) return;
    if (!otomatis) {
      if (!(await showConfirm("Selesaikan asesmen sekarang? Jawaban yang sudah tersimpan tidak bisa diubah lagi."))) return;
    }
    setSelesaiLoading(true);
    try {
      if (currentSoal && currentSoal.tipe !== "PILIHAN_GANDA") {
        await simpanJawaban(currentSoal.id, {
          opsiIds: jawabanMap[currentSoal.id]?.opsiIds ?? [],
          jawabanEssay: jawabanMap[currentSoal.id]?.jawabanEssay ?? "",
        });
      }
      await fetch(`/api/asesmen/${asesmenId}/selesai`, { method: "POST" });
      setSudahSelesai(true);
    } finally {
      setSelesaiLoading(false);
    }
  }

  function formatTimer(detik: number) {
    const j = Math.floor(detik / 3600);
    const m = Math.floor((detik % 3600) / 60);
    const d = detik % 60;
    return [j, m, d].map((n) => String(n).padStart(2, "0")).join(":");
  }

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Memuat asesmen">
        <div className="h-20 animate-pulse rounded-lg border bg-muted" />
        <div className="h-10 animate-pulse rounded-lg border bg-muted" />
        <div className="h-64 animate-pulse rounded-lg border bg-muted" />
      </div>
    );
  }
  if (error || !asesmen) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">{error || "Asesmen tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push("/siswa/asesmen")}>
          Kembali
        </Button>
      </div>
    );
  }

  if (sudahSelesai) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-lg border bg-card p-10 text-center text-card-foreground">
        <Badge tone="green">Sudah Dikumpulkan</Badge>
        <p className="text-lg font-semibold">{asesmen.judul}</p>
        <p className="text-sm text-muted-foreground">Jawabanmu sudah tersimpan. Nilai akan diumumkan oleh guru.</p>
        <Button onClick={() => router.push("/siswa/asesmen")}>Kembali ke Asesmen</Button>
      </div>
    );
  }

  const waktuHampirHabis = sisaDetik <= 300;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 text-card-foreground">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">{asesmen.judul}</h1>
            <Badge tone="amber">Sedang Mengerjakan {isKuis ? "Kuis" : "Ujian Online"}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">Mapel - {asesmen.mapel?.nama ?? "-"}</p>
        </div>
        {asesmen.durasiMenit && (
          <div
            role="timer"
            className={`rounded-md border px-4 py-2 text-right ${waktuHampirHabis ? "border-danger" : ""}`}
          >
            <p className="text-xs text-muted-foreground">Sisa Waktu</p>
            <p className={`font-mono text-lg font-semibold tabular-nums ${waktuHampirHabis ? "text-danger" : ""}`}>
              {formatTimer(sisaDetik)}
            </p>
            {waktuHampirHabis && <p className="text-xs font-medium text-danger">Waktu hampir habis!</p>}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[140px] flex-1">
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
            className={`${fieldCls} h-10 w-full pl-9 sm:h-9`}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Soal sebelumnya"
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            disabled={activeIndex === 0}
            className={iconBtn}
          >
            <ChevronLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <span className="min-w-12 px-1 text-center text-sm tabular-nums text-muted-foreground">
            {soalTerfilter.length === 0 ? "0/0" : `${activeIndex + 1}/${soalTerfilter.length}`}
          </span>
          <button
            aria-label="Soal berikutnya"
            onClick={() => setActiveIndex((i) => Math.min(soalTerfilter.length - 1, i + 1))}
            disabled={activeIndex >= soalTerfilter.length - 1}
            className={iconBtn}
          >
            <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            onClick={() => setShowGrid((v) => !v)}
            aria-pressed={showGrid}
            title={showGrid ? "Tutup daftar soal" : "Buka daftar soal"}
            aria-label={showGrid ? "Tutup daftar soal" : "Buka daftar soal"}
            className={`${iconBtn} ${showGrid ? "border-brand bg-brand-subtle" : ""}`}
          >
            <LayoutGrid className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      {showGrid && (
        <div className="mt-2 rounded-lg border bg-card p-3 text-card-foreground">
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
            {soalTerfilter.map((s, i) => {
              const dijawab = (jawabanMap[s.id]?.opsiIds.length ?? 0) > 0 || !!jawabanMap[s.id]?.jawabanEssay;
              const ragu = jawabanMap[s.id]?.raguRagu;
              const state =
                i === activeIndex
                  ? "border-brand bg-brand text-brand-foreground"
                  : ragu
                  ? "border-dashed border-foreground/60 bg-accent"
                  : dijawab
                  ? "border-brand bg-brand-subtle"
                  : "text-muted-foreground";
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveIndex(i);
                    setShowGrid(false);
                  }}
                  aria-label={`Soal ${i + 1}${ragu ? ", ragu-ragu" : dijawab ? ", sudah dijawab" : ", belum dijawab"}`}
                  aria-current={i === activeIndex ? "true" : undefined}
                  className={`flex size-10 cursor-pointer items-center justify-center rounded-md border text-sm font-medium tabular-nums transition-colors duration-150 ${focusRing} ${state}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-3 rounded-sm border border-brand bg-brand-subtle" />
              Dijawab
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-3 rounded-sm border border-dashed border-foreground/60 bg-accent" />
              Ragu-ragu
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-3 rounded-sm border" />
              Belum dijawab
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 min-h-[280px] rounded-lg border bg-card p-5 text-card-foreground">
        {!currentSoal ? (
          <p className="text-sm text-muted-foreground">Belum ada soal.</p>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-2">
              <Badge tone="gray">
                {currentSoal.tipe === "PILIHAN_GANDA" ? "Pilihan Ganda" : currentSoal.tipe === "CHECKBOX" ? "Checkbox" : "Essay"}
              </Badge>
              {!isKuis && (
                <button
                  type="button"
                  aria-pressed={!!jawabanSaatIni?.raguRagu}
                  onClick={() => handleToggleRagu(currentSoal.id)}
                  className={`inline-flex h-10 cursor-pointer items-center rounded-md border px-3 text-sm font-medium transition-colors duration-150 sm:h-9 ${focusRing} ${
                    jawabanSaatIni?.raguRagu ? "border-dashed border-foreground/60 bg-accent" : "hover:bg-accent"
                  }`}
                >
                  Ragu-ragu
                </button>
              )}
            </div>

            <p className="mt-4 text-base font-semibold leading-relaxed">
              {activeIndex + 1}. {currentSoal.pertanyaan}
            </p>

            {currentSoal.gambar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentSoal.gambar} alt="Gambar soal" className="mt-3 max-h-64 rounded-lg border object-contain" />
            )}

            {currentSoal.tipe === "ESSAY" ? (
              <textarea
                value={jawabanSaatIni?.jawabanEssay ?? ""}
                onChange={(e) => handleEssayChange(currentSoal.id, e.target.value)}
                onBlur={() => !isKuis && simpanJawaban(currentSoal.id, { jawabanEssay: jawabanMap[currentSoal.id]?.jawabanEssay ?? "" })}
                rows={5}
                aria-label="Jawaban essay"
                placeholder="Tulis jawabanmu di sini..."
                className={`${fieldCls} mt-4 w-full py-2`}
              />
            ) : (
              <div className="mt-4 space-y-2">
                {currentSoal.opsi.map((o) => {
                  const dipilih = jawabanSaatIni?.opsiIds.includes(o.id) ?? false;
                  return (
                    <label
                      key={o.id}
                      className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-4 py-2.5 text-sm transition-colors duration-150 ${
                        dipilih ? "border-brand bg-brand-subtle" : "hover:bg-accent"
                      }`}
                    >
                      <input
                        type={currentSoal.tipe === "PILIHAN_GANDA" ? "radio" : "checkbox"}
                        checked={dipilih}
                        onChange={() =>
                          currentSoal.tipe === "PILIHAN_GANDA"
                            ? handlePilihOpsiPG(currentSoal.id, o.id)
                            : handleToggleOpsiCB(currentSoal.id, o.id)
                        }
                        className="size-4 accent-brand"
                      />
                      <span>{o.teks}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* tombol Lanjut eksplisit -- cuma di Kuis, cuma buat Checkbox & Essay (PG udah auto-lanjut) */}
            {isKuis && currentSoal.tipe !== "PILIHAN_GANDA" && (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleLanjutManual}>Lanjut</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {!isKuis && (
        <div className="mt-4 flex justify-end">
          <Button loading={selesaiLoading} onClick={() => handleSelesai(false)}>
            Selesai Ujian
          </Button>
        </div>
      )}

      {isKuis && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Jawab soal untuk otomatis lanjut ke soal berikutnya. Kamu tidak bisa kembali ke soal sebelumnya.
        </p>
      )}

      <Modal
        open={!!pelanggaranModal}
        onClose={() => {}}
        dismissible={false}
        title="Peringatan Asesmen"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6">
            Kamu keluar dari tab atau halaman asesmen. Klik <strong>Lanjut Asesmen</strong> untuk kembali mengerjakan.
          </p>
          {pelanggaranModal && pelanggaranModal.jumlahDireset > 0 ? (
            <p className="rounded-md border border-danger p-3 text-sm text-danger">
              Pelanggaran ke-{pelanggaranModal.violationCount}: {pelanggaranModal.jumlahDireset} jawaban pilihan ganda/checkbox direset. Jawaban essay tetap aman.
            </p>
          ) : pelanggaranModal && (
            <p className="rounded-md border bg-muted p-3 text-sm">
              Pelanggaran ke-{pelanggaranModal.violationCount} tercatat. Reset berikutnya terjadi pada pelanggaran ke-{pelanggaranModal.violationCount + (3 - (pelanggaranModal.violationCount % 3 || 3))}. Jawaban essay tetap aman.
            </p>
          )}
          <Button className="w-full" onClick={() => setPelanggaranModal(null)}>
            Lanjut Asesmen
          </Button>
        </div>
      </Modal>
    </div>
  );
}