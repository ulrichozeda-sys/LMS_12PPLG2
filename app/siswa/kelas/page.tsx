"use client";

import { useEffect, useState } from "react";
import KelasCard, { KelasData } from "@/components/KelasCard";

export default function SiswaKelasPage() {
  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKelas();
  }, []);

  async function loadKelas() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/kelas");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Gagal memuat daftar kelas.");
      }

      setKelasList(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat daftar kelas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Daftar Kelas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Kelas yang sudah ditugaskan untukmu oleh admin.</p>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Memuat kelas">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-danger p-4 text-sm text-danger">{error}</div>
      )}

      {!loading && !error && kelasList.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-base font-semibold">Belum ada kelas</p>
          <p className="mt-1 text-sm text-muted-foreground">Kamu belum tergabung di kelas yang dibuat admin.</p>
        </div>
      )}

      {!loading && !error && kelasList.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kelasList.map((kelas) => (
            <KelasCard key={kelas.id} data={kelas} isEditable={false} basePath="/siswa/kelas" />
          ))}
        </div>
      )}
    </div>
  );
}