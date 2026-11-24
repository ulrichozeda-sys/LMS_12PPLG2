"use client";

import { useEffect, useState } from "react";
import KelasCard, { type KelasData } from "@/components/KelasCard";
import { EmptyState, LoadingBlock, PageTitle } from "@/components/shared/data-display";

export default function GuruKelasPage() {
  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadKelas() {
      try {
        const response = await fetch("/api/kelas");
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Gagal memuat daftar kelas.");
        }
        setKelasList(payload.data ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat daftar kelas.");
      } finally {
        setLoading(false);
      }
    }

    void loadKelas();
  }, []);

  return (
    <div className="space-y-4">
      <PageTitle
        title="Kelas yang Diampu"
        description="Daftar kelas yang ditugaskan kepadamu."
      />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <p role="alert" className="rounded-md border border-danger p-4 text-sm text-danger">
          {error}
        </p>
      ) : kelasList.length === 0 ? (
        <EmptyState>Belum ada kelas yang diampu.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kelasList.map((kelas) => (
            <KelasCard
              key={kelas.id}
              data={kelas}
              isEditable={false}
              basePath="/guru/kelas"
            />
          ))}
        </div>
      )}
    </div>
  );
}
