"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "./ui/Badge";

export interface AkunData {
  id: string;
  nama: string;
  email: string;
  nis?: string | null;
  nik?: string | null;
  fotoProfil?: string | null;
  deskripsi?: string | null;
  role: "SISWA" | "GURU";
  kelasReferensi?: { id?: string; label: string; jenjang?: string; tingkat?: number | null; jurusan?: { nama: string } | null } | null; // rombel referensi siswa
  kelasSiswa?: { kelas: { id?: string; judul: string } }[];
  kelasGuruMapel?: { kelas: { id?: string; judul: string }; mapel: { nama: string } }[]; // buat guru
}

interface AkunCardProps {
  data: AkunData;
  isEditable?: boolean;
  onEdit?: (akun: AkunData) => void;
  onDelete?: (id: string) => void;
}

export default function AkunCard({ data, isEditable = false, onEdit, onDelete }: AkunCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const subInfo =
    data.role === "SISWA"
      ? data.kelasReferensi?.label ?? "Belum ada kelas"
      : data.kelasGuruMapel && data.kelasGuruMapel.length > 0
      ? `${data.kelasGuruMapel[0].mapel.nama} · ${data.kelasGuruMapel.length} kelas`
      : "Belum ada kelas";

  return (
    <div
      onClick={() => router.push(`/profil/${data.id}`)}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          router.push(`/profil/${data.id}`);
        }
      }}
      role="link"
      tabIndex={0}
      className="group relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-lg border border-border bg-card p-4 text-card-foreground transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-sm font-semibold">
        {data.fotoProfil ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.fotoProfil} alt={data.nama} className="h-full w-full object-cover" />
        ) : (
          data.nama.charAt(0).toUpperCase()
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 truncate text-sm font-semibold">{data.nama}</p>
          <Badge tone="gray">
            {data.role === "SISWA" ? "Siswa" : "Guru"}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">{data.email}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {data.role === "SISWA" ? "NIS" : "NIK"}: {data.role === "SISWA" ? data.nis || "—" : data.nik || "—"}
        </p>
        <p className="mt-1 truncate text-xs font-medium">{subInfo}</p>
        {data.deskripsi && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">&quot;{data.deskripsi}&quot;</p>}
      </div>

      {isEditable && (
        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            aria-label={`Opsi akun ${data.nama}`}
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
            <div className="absolute right-0 top-10 z-20 w-32 overflow-hidden rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-sm dark:shadow-none">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.(data);
                }}
                className="block min-h-10 w-full cursor-pointer px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(data.id);
                }}
                className="block min-h-10 w-full cursor-pointer px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}