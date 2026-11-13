"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import KelasCard, { type KelasData } from "@/components/KelasCard";
import ModalKelas from "@/components/ModalKelas";
import { EmptyState, LoadingBlock, PageTitle } from "@/components/shared/data-display";
import { showAlert, showConfirm } from "@/lib/dialog";

export default function SuperAdminKelasPage() {
  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<KelasData | null>(null);

  const loadKelas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/kelas");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Gagal memuat kelas.");
      setKelasList(payload.data ?? []);
    } catch (error) {
      await showAlert(error instanceof Error ? error.message : "Gagal memuat kelas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKelas();
  }, [loadKelas]);

  async function handleDelete(id: string) {
    const kelas = kelasList.find((item) => item.id === id);
    if (!kelas || !(await showConfirm(`Hapus kelas "${kelas.judul}"?`))) return;
    try {
      const response = await fetch(`/api/kelas/${id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Kelas gagal dihapus.");
      await loadKelas();
    } catch (error) {
      await showAlert(error instanceof Error ? error.message : "Kelas gagal dihapus.");
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Kelas" description="Kelola kelas dan lihat aktivitas pembelajaran setiap kelas." />
      <div className="flex justify-end">
        <Button onClick={() => { setEditingKelas(null); setModalOpen(true); }}>+ Buat Kelas</Button>
      </div>
      {loading ? (
        <LoadingBlock />
      ) : kelasList.length === 0 ? (
        <EmptyState>Belum ada kelas.</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kelasList.map((kelas) => (
            <KelasCard
              key={kelas.id}
              data={kelas}
              isEditable
              basePath="/super-admin/kelas"
              onEdit={(data) => { setEditingKelas(data); setModalOpen(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
      <ModalKelas
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadKelas}
        mode={editingKelas ? "edit" : "create"}
        initialData={editingKelas}
      />
    </div>
  );
}
