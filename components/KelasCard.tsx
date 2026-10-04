"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "./ui/Badge";

export interface KelasData {
  id: string;
  judul: string;
  deskripsi: string | null;
  inviteToken: string;
  _count?: { siswa: number };
}

interface KelasCardProps {
  data: KelasData;
  isEditable?: boolean;
  onEdit?: (kelas: KelasData) => void;
  onDelete?: (kelasId: string) => void;
  basePath?: string;
}

export default function KelasCard({
  data,
  isEditable = false,
  onEdit,
  onDelete,
  basePath = "/admin/kelas",
}: KelasCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const label = data.judul || "Tanpa Judul";

  function handleCopyInvite(e: React.MouseEvent) {
    e.stopPropagation();
    const link = `${window.location.origin}/join/${data.inviteToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      onClick={() => router.push(`${basePath}/${data.id}`)}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          router.push(`${basePath}/${data.id}`);
        }
      }}
      role="link"
      tabIndex={0}
      className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-card text-card-foreground transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 truncate text-sm font-semibold">{label}</p>
          <Badge tone="brand">{data._count?.siswa ?? 0} Siswa</Badge>
        </div>

        {isEditable && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label={`Opsi kelas ${label}`}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex size-10 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 z-20 w-36 overflow-hidden rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-sm dark:shadow-none">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(data);
                  }}
                  className="block min-h-10 w-full cursor-pointer px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
                >
                  Edit Kelas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(data.id);
                  }}
                  className="block min-h-10 w-full cursor-pointer px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
                >
                  Hapus Kelas
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {data.deskripsi ? `"${data.deskripsi}"` : "Belum ada deskripsi."}
        </p>
      </div>

      {isEditable && (
        <div className="flex min-h-12 items-center gap-1 border-t border-border px-4 py-1">
          <button
            type="button"
            onClick={handleCopyInvite}
            className="flex min-h-10 cursor-pointer items-center gap-2 rounded-sm px-2 text-xs font-medium text-muted-foreground underline underline-offset-4 transition-colors duration-150 hover:text-foreground hover:no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4" aria-hidden="true">
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
            {copied ? "Tersalin!" : "Salin Link Undangan"}
          </button>
        </div>
      )}
    </div>
  );
}