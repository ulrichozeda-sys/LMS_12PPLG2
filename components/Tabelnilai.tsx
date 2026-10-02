"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import Modal from "./ui/Modal";
import { showAlert } from "@/lib/dialog";

interface NilaiRow {
  submissionId: string;
  nama: string;
  nis: string;
  kelasReferensi: string;
  nilaiObjektif: number;
  nilaiAkhir: number | null;
  nilaiSementara: number;
  totalSoalTerjawab: number;
}

interface TabelNilaiProps {
  asesmenId: string;
  judulAsesmen: string;
  nilaiList: NilaiRow[];
  onReset?: () => void;
  readOnly?: boolean;
  basePath?: string;
  kelasId?: string;
  namaKelas?: string;
  tipeAsesmen?: "KUIS" | "UJIAN";
  namaMapel?: string;
}

export default function TabelNilai({ asesmenId, judulAsesmen, nilaiList, onReset, readOnly = false, basePath = "/guru/asesmen", kelasId, namaKelas = "-", tipeAsesmen, namaMapel = "-" }: TabelNilaiProps) {
  const router = useRouter();
  const printRootRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [resettingSubmissionId, setResettingSubmissionId] = useState<string | null>(null);
  const [resetRequest, setResetRequest] = useState<{
    type: "asesmen" | "nilai";
    submissionId: string;
    nama: string;
  } | null>(null);

  async function handleDownload() {
    setDownloading(true);
    try {
      const query = new URLSearchParams({ format: "xlsx" });
      if (kelasId) query.set("kelasId", kelasId);
      const res = await fetch(`/api/asesmen/${asesmenId}/nilai?${query.toString()}`);
      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nilai-${judulAsesmen.replace(/\s+/g, "-")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      await showAlert("Gagal mengunduh nilai. Coba lagi.");
    } finally {
      setDownloading(false);
    }
  }

  function handlePrintPdf() {
    const printRoot = printRootRef.current;
    if (!printRoot) return;

    const changedElements: HTMLElement[] = [];
    let current: HTMLElement | null = printRoot;
    while (current && current !== document.body) {
      current.classList.add("score-print-context");
      changedElements.push(current);
      const parent: HTMLElement | null = current.parentElement;
      if (parent) {
        for (const sibling of Array.from(parent.children)) {
          if (sibling !== current && sibling instanceof HTMLElement) {
            sibling.classList.add("score-print-hidden");
            changedElements.push(sibling);
          }
        }
      }
      current = parent;
    }

    document.body.classList.add("score-report-printing");
    const cleanup = () => {
      document.body.classList.remove("score-report-printing");
      changedElements.forEach((element) => {
        element.classList.remove("score-print-context", "score-print-hidden");
      });
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    setShowExportModal(false);
    window.print();
  }

  async function handleResetSubmission(submissionId: string) {
    setResettingSubmissionId(submissionId);
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/nilai/${submissionId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        await showAlert(data.error ?? "Gagal mereset asesmen siswa.");
        return;
      }
      onReset?.();
    } catch {
      await showAlert("Gagal mereset asesmen siswa.");
    } finally {
      setResettingSubmissionId(null);
    }
  }

  async function handleResetNilai(submissionId: string) {
    setResettingSubmissionId(submissionId);
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/nilai/${submissionId}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        await showAlert(data.error ?? "Gagal mereset nilai.");
        return;
      }
      onReset?.();
    } catch {
      await showAlert("Gagal mereset nilai.");
    } finally {
      setResettingSubmissionId(null);
    }
  }

  function closeResetModal() {
    if (!resettingSubmissionId) setResetRequest(null);
  }

  async function confirmReset() {
    if (!resetRequest) return;
    const request = resetRequest;
    setResetRequest(null);
    if (request.type === "asesmen") {
      await handleResetSubmission(request.submissionId);
    } else {
      await handleResetNilai(request.submissionId);
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-[#FFFFFF] p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#111827]">Nilai Siswa</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowExportModal(true)}>
            Generate Nilai
          </Button>
        </div>
      </div>

      {nilaiList.length === 0 ? (
        <p className="mt-6 text-center text-xs text-[#9CA3AF]">Belum ada siswa yang mengumpulkan.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs text-[#9CA3AF]">
                <th className="pb-2 font-semibold">Nama</th>
                <th className="pb-2 font-semibold">NIS</th>
                <th className="pb-2 font-semibold">Kelas/Jurusan</th>
                <th className="pb-2 font-semibold">Soal Terjawab</th>
                <th className="pb-2 text-right font-semibold">Nilai Objektif</th>
                <th className="pb-2 text-right font-semibold">Nilai Akhir</th>
                <th className="pb-2 text-right font-semibold">{readOnly ? "Detail" : "Aksi"}</th>
              </tr>
            </thead>
            <tbody>
              {nilaiList.map((row) => (
                <tr
                  key={row.submissionId}
                  onClick={() => router.push(`${basePath}/${asesmenId}/jawaban/${row.submissionId}`)}
                  className="cursor-pointer border-b border-black/5 transition-colors hover:bg-[#F8FAFC] last:border-0"
                >
                  <td className="py-2.5 font-medium text-[#111827]">{row.nama}</td>
                  <td className="py-2.5 text-xs text-[#6B7280]">{row.nis}</td>
                  <td className="py-2.5 text-xs text-[#6B7280]">{row.kelasReferensi}</td>
                  <td className="py-2.5 text-xs text-[#6B7280]">{row.totalSoalTerjawab}</td>
                  <td className="py-2.5 text-right">
                    <Badge tone={row.nilaiObjektif >= 75 ? "green" : row.nilaiObjektif >= 50 ? "amber" : "red"}>
                      {row.nilaiObjektif}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-right">
                    <Badge tone={(row.nilaiAkhir ?? row.nilaiObjektif) >= 75 ? "green" : (row.nilaiAkhir ?? row.nilaiObjektif) >= 50 ? "amber" : "red"}>
                      {row.nilaiAkhir ?? "-"}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-right">
                    {!readOnly && <Button
                      size="sm"
                      variant="outline"
                      loading={resettingSubmissionId === row.submissionId}
                      onClick={(event) => {
                        event.stopPropagation();
                        setResetRequest({ type: "asesmen", submissionId: row.submissionId, nama: row.nama });
                      }}
                    >
                      Reset Asesmen
                    </Button>}
                    {!readOnly && <Button
                      size="sm"
                      variant="outline"
                      loading={resettingSubmissionId === row.submissionId}
                      onClick={(event) => {
                        event.stopPropagation();
                        setResetRequest({ type: "nilai", submissionId: row.submissionId, nama: row.nama });
                      }}
                    >
                      Reset Nilai
                    </Button>}
                    {readOnly && <span className="text-xs font-semibold text-[#00D2D9]">Lihat jawaban</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={resetRequest !== null}
        onClose={closeResetModal}
        title={resetRequest?.type === "asesmen" ? "Reset Asesmen Siswa" : "Reset Nilai Siswa"}
      >
        {resetRequest?.type === "asesmen" ? (
          <p className="text-sm leading-6 text-[#475569]">
            Semua jawaban <strong>{resetRequest.nama}</strong> akan dihapus dan siswa dapat mengerjakan asesmen ini dari awal.
          </p>
        ) : (
          <p className="text-sm leading-6 text-[#475569]">
            Nilai akhir <strong>{resetRequest?.nama}</strong> akan dikosongkan. Jawaban siswa tetap tersimpan.
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={closeResetModal}>
            Batal
          </Button>
          <Button
            size="sm"
            variant={resetRequest?.type === "asesmen" ? "danger" : "primary"}
            onClick={() => void confirmReset()}
          >
            {resetRequest?.type === "asesmen" ? "Reset Asesmen" : "Reset Nilai"}
          </Button>
        </div>
      </Modal>

      <Modal open={showExportModal} onClose={() => setShowExportModal(false)} title="Generate Nilai">
        <p className="text-sm text-[#475569]">Pilih format ekspor untuk kelas {namaKelas}.</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button loading={downloading} onClick={() => { setShowExportModal(false); void handleDownload(); }}>
            Excel (.xlsx)
          </Button>
          <Button variant="outline" onClick={handlePrintPdf}>
            PDF
          </Button>
        </div>
      </Modal>

      <div ref={printRootRef} className="score-print-root" aria-hidden="true">
        <header className="score-print-header">
          <h1>Rekap Nilai</h1>
          <p className="score-print-assessment">{judulAsesmen}</p>
          <p>{tipeAsesmen === "KUIS" ? "Kuis" : tipeAsesmen === "UJIAN" ? "Ujian Online" : "Asesmen"}</p>
          <dl>
            <div><dt>Mata Pelajaran</dt><dd>{namaMapel}</dd></div>
            <div><dt>Kelas</dt><dd>{namaKelas}</dd></div>
            <div><dt>Tanggal Cetak</dt><dd>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</dd></div>
          </dl>
        </header>
        <table className="score-print-table">
          <thead>
            <tr>
              <th>No</th><th>Nama Siswa</th><th>NIS</th><th>Kelas/Jurusan</th><th>Soal Terjawab</th><th>Nilai Objektif</th><th>Nilai Akhir</th>
            </tr>
          </thead>
          <tbody>
            {nilaiList.map((row, index) => (
              <tr key={row.submissionId}>
                <td>{index + 1}</td><td>{row.nama}</td><td>{row.nis}</td><td>{row.kelasReferensi}</td><td>{row.totalSoalTerjawab}</td><td>{row.nilaiObjektif}</td><td>{row.nilaiAkhir ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="score-print-signatures">
          <div><p>Kepala Sekolah</p><span /></div>
          <div><p>Wakil Kepala Sekolah Bidang Kurikulum</p><span /></div>
        </div>
      </div>
    </div>
  );
}