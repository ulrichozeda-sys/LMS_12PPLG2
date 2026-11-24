"use client";

import { useCallback, useEffect, useState } from "react";
import TugasCard, { type TugasData } from "@/components/TugasCard";
import { EmptyState, LoadingBlock, PageTitle } from "@/components/shared/data-display";

export default function SiswaTugasPage() {
  const [tugasList, setTugasList] = useState<TugasData[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTugas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [tugasResponse, meResponse] = await Promise.all([
        fetch("/api/tugas"),
        fetch("/api/me"),
      ]);
      const [tugasPayload, mePayload] = await Promise.all([
        tugasResponse.json(),
        meResponse.json(),
      ]);

      if (!tugasResponse.ok) {
        throw new Error(tugasPayload.error ?? "Gagal memuat daftar tugas.");
      }
      if (!meResponse.ok || !mePayload.data?.id) {
        throw new Error(mePayload.error ?? "Gagal memuat data akun.");
      }

      setTugasList(Array.isArray(tugasPayload.data) ? tugasPayload.data : []);
      setCurrentUserId(mePayload.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat daftar tugas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTugas();
  }, [loadTugas]);

  return (
    <div className="space-y-6">
      <PageTitle title="Tugas" description="Lihat dan kumpulkan tugas dari kelas yang kamu ikuti." />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <div role="alert" className="rounded-lg border border-danger p-5">
          <p className="text-sm font-semibold text-danger">Gagal memuat tugas</p>
          <p className="mt-1 text-sm text-danger">{error}</p>
          <button
            type="button"
            onClick={() => void loadTugas()}
            className="mt-3 cursor-pointer text-sm font-medium underline underline-offset-2"
          >
            Coba lagi
          </button>
        </div>
      ) : tugasList.length === 0 ? (
        <EmptyState>Belum ada tugas yang dibagikan ke kelasmu.</EmptyState>
      ) : (
        <div className="space-y-3">
          {tugasList.map((tugas) => (
            <TugasCard
              key={tugas.id}
              data={tugas}
              currentUserId={currentUserId}
              role="SISWA"
              onSubmissionChanged={() => void loadTugas()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
