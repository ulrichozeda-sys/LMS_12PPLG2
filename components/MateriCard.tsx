"use client";

import { useState } from "react";
import Badge from "./ui/Badge";

export interface MateriData {
  id: string;
  judul: string;
  tipe: "PDF" | "LINK" | "FILE" | "FOTO";
  url: string;
  deskripsi: string | null;
  createdAt: string;
  guru?: { id: string; nama: string };
  kelasTujuan?: { kelas: { id: string; judul: string } }[];
}

interface MateriCardProps {
  data: MateriData;
  isEditable?: boolean;
  onEdit?: (materi: MateriData) => void;
  onDelete?: (id: string) => void;
}

export default function MateriCard({ data, isEditable = false, onEdit, onDelete }: MateriCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const fileName = data.url.split("/").pop()?.replace(/^[0-9a-f-]{36}-/i, "") ?? data.url;
  const sourceLabel = data.tipe === "LINK" ? "Link" : data.tipe === "PDF" ? "PDF" : data.tipe === "FOTO" ? "Foto" : "File";
  const isExternalLink = data.tipe === "LINK";
  const isPhoto = data.tipe === "FOTO";

  return (
    <article className="min-w-0 border border-border bg-card p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">Materi</Badge>
            <Badge tone={data.tipe === "PDF" ? "red" : "gray"}>{sourceLabel}</Badge>
          </div>
          <h3 className="mt-2 break-words text-sm font-bold text-foreground">{data.judul}</h3>
          {data.deskripsi && <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground">{data.deskripsi}</p>}
          <p className="mt-2 text-[11px] text-muted-foreground">
            {data.guru ? `oleh ${data.guru.nama}` : "Materi kelas"} · {new Date(data.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>

      {isEditable && (
        <div className="relative flex-shrink-0" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            aria-label="Opsi materi"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center text-lg font-bold text-muted-foreground hover:bg-muted"
          >
            ⋯
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-28 overflow-hidden border border-border bg-card py-1 shadow-sm dark:shadow-none">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.(data);
                }}
                className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-accent"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(data.id);
                }}
                className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-danger hover:bg-danger/10"
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      <div className="mt-3 flex min-w-0 items-stretch border border-border">
              {isPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.url} alt={data.judul} className="h-16 w-16 flex-shrink-0 object-cover" />
              ) : (
                <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center bg-muted text-muted-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                    {isExternalLink ? <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /> : <path d="M6 3h8l5 5v13H6zM14 3v5h5M9 13h6M9 17h4" />}
                  </svg>
                </span>
              )}
              <div className="flex min-w-0 flex-1 items-center px-3 py-2">
                <p className="min-w-0 break-all text-xs font-medium text-foreground">{isExternalLink ? data.url : fileName}</p>
              </div>
              <a href={data.url} target={isExternalLink || isPhoto ? "_blank" : undefined} rel={isExternalLink || isPhoto ? "noopener noreferrer" : undefined} download={!isExternalLink && !isPhoto ? fileName : undefined} className="flex flex-shrink-0 items-center border-l border-border px-3 text-xs font-semibold text-foreground hover:bg-accent">
                {isExternalLink || isPhoto ? "Buka" : "Unduh"}
              </a>
      </div>
    </article>
  );
}
