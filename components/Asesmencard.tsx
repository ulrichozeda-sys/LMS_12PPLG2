"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Badge from "./ui/Badge";
import { formatTanggalIndonesia } from "@/lib/format";

export interface AsesmenData {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  status: "PROSES" | "SELESAI";
  durasiMenit: number | null;
  createdAt?: string;
  mapel?: { id?: string; nama: string } | null;
  mapelId?: string | null;
  deskripsi?: string | null;
  kelasTujuan?: { kelas: { id: string; judul: string } }[];
  _count?: { soal: number; submission: number };
  updatedAt: string;
}

interface AsesmenCardProps {
  data: AsesmenData;
  basePath?: string; // "/guru/asesmen" atau "/siswa/asesmen"
  submissionStatus?: "BELUM" | "SEDANG" | "SUDAH"; // khusus tampilan siswa
  onEdit?: (data: AsesmenData) => void;
  onSend?: (data: AsesmenData) => void;
  onDelete?: (data: AsesmenData) => void;
  onRemove?: (data: AsesmenData) => void;
}

const tipeConfig: Record<AsesmenData["tipe"], { label: string }> = {
  KUIS: { label: "Kuis" },
  UJIAN: { label: "Ujian Online" },
};

export default function AsesmenCard({ data, basePath = "/guru/asesmen", submissionStatus, onEdit, onSend, onDelete, onRemove }: AsesmenCardProps) {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);
  const tc = tipeConfig[data.tipe];

  useEffect(() => {
    if (!showOptions) return;
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Element && !target.closest("[data-options-menu]")) setShowOptions(false);
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [showOptions]);

  return (
    <div
      onClick={() => router.push(`${basePath}/${data.id}`)}
      className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-card text-card-foreground transition-colors duration-150 hover:bg-accent"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-foreground"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-5">
              <path d="M12 2l3 6 6.5.9-4.7 4.6L18 20l-6-3.4L6 20l1.2-6.5L2.5 8.9 9 8l3-6Z" />
            </svg>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            {basePath.startsWith("/siswa") ? null : (
              <Badge tone={data.status === "SELESAI" ? "green" : "amber"}>
                {data.status === "SELESAI" ? "Selesai" : "Proses"}
              </Badge>
            )}
            {(onEdit || onSend || onDelete) && (
              <div className="relative" data-options-menu>
                <button type="button" aria-label="Opsi asesmen" aria-expanded={showOptions} onClick={(event) => { event.stopPropagation(); setShowOptions((value) => !value); }} className="flex size-10 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                  </svg>
                </button>
                {showOptions && (
                  <div onClick={(event) => event.stopPropagation()} className="absolute right-0 top-10 z-20 w-36 overflow-hidden rounded-md border border-border bg-popover py-1 text-left text-popover-foreground shadow-sm dark:shadow-none">
                    {onEdit && data.status === "PROSES" && <button type="button" onClick={() => { setShowOptions(false); onEdit(data); }} className="block min-h-10 w-full cursor-pointer px-3 py-2 text-left text-sm text-foreground hover:bg-accent">Edit</button>}
                    {onSend && data.status === "SELESAI" && <button type="button" onClick={() => { setShowOptions(false); onSend(data); }} className="block min-h-10 w-full cursor-pointer px-3 py-2 text-left text-sm text-foreground hover:bg-accent">Kirim ke</button>}
                    {onDelete && <button type="button" onClick={() => { setShowOptions(false); onDelete(data); }} className="block min-h-10 w-full cursor-pointer px-3 py-2 text-left text-sm text-danger hover:bg-danger/10">Hapus</button>}
                  </div>
                )}
              </div>
            )}
            {submissionStatus && (
              <>
                <Badge tone={submissionStatus === "SUDAH" ? "green" : submissionStatus === "SEDANG" ? "amber" : "red"}>
                  {submissionStatus === "SUDAH" ? "Sudah dikerjakan" : submissionStatus === "SEDANG" ? "Sedang dikerjakan" : "Belum dikerjakan"}
                </Badge>
                {onRemove && submissionStatus !== "BELUM" && (
                  <button
                    type="button"
                    aria-label="Reset history asesmen"
                    title="Reset history asesmen"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemove(data);
                    }}
                    className="flex size-10 cursor-pointer items-center justify-center rounded-md border border-border text-lg leading-none text-muted-foreground transition-colors duration-150 hover:border-danger/30 hover:bg-danger/10 hover:text-danger outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <p className="mt-3 truncate text-sm font-semibold">{data.judul}</p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge tone="gray">{tc.label}</Badge>
          {data.mapel && <Badge tone="brand">{data.mapel.nama}</Badge>}
          {data.durasiMenit && <span className="text-xs text-muted-foreground">{data.durasiMenit} menit</span>}
        </div>

        {data.kelasTujuan && data.kelasTujuan.length > 0 && (
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {data.kelasTujuan.map((kt) => kt.kelas.judul).join(", ")}
          </p>
        )}

        {data.createdAt && (
          <p className="mt-2 truncate text-xs text-muted-foreground" title={formatTanggalIndonesia(data.createdAt)}>
            Dibuat: {formatTanggalIndonesia(data.createdAt)}
          </p>
        )}

        {data._count && (
          <div className="mt-3 flex items-center gap-3 border-t border-border pt-2.5 text-xs text-muted-foreground">
            <span>{data._count.soal} soal</span>
            <span aria-hidden="true">·</span>
            <span>{data._count.submission} pengumpulan</span>
          </div>
        )}
      </div>
    </div>
  );
}