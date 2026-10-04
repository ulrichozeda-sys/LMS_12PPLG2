"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import MateriCard, { MateriData } from "@/components/MateriCard";
import ModalMateri from "@/components/Modalmateri";
import { showAlert, showConfirm } from "@/lib/dialog";
import { EmptyState, LoadingBlock, PageTitle } from "@/components/shared/data-display";
import { Field, SelectInput } from "@/components/shared/form-controls";

type MateriRole = "GURU" | "SISWA";
type KelasOption = { id: string; label: string };

export default function MateriPageContent({ role }: { role: MateriRole }) {
  const [materiList, setMateriList] = useState<MateriData[]>([]);
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [kelasId, setKelasId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMateri, setEditingMateri] = useState<MateriData | null>(null);

  useEffect(() => {
    fetch("/api/kelas")
      .then((response) => response.json())
      .then((payload) => setKelasOptions((payload.data ?? []).map((kelas: { id: string; judul: string }) => ({ id: kelas.id, label: kelas.judul }))))
      .catch(() => {});
    fetch("/api/me")
      .then((response) => response.json())
      .then((payload) => setMe(payload.data ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const query = kelasId ? `?kelasId=${encodeURIComponent(kelasId)}` : "";
    setLoading(true);
    setError("");
    fetch(`/api/materi${query}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Gagal memuat materi.");
        if (active) setMateriList(payload.data ?? []);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Gagal memuat materi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [kelasId, reloadKey]);

  async function handleDelete(id: string) {
    if (!(await showConfirm("Hapus materi ini?"))) return;
    const response = await fetch(`/api/materi/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      await showAlert(payload?.error ?? "Materi gagal dihapus.");
      return;
    }
    setReloadKey((value) => value + 1);
  }

  const today = new Date().toDateString();
  const todayMateri = materiList.filter((materi) => new Date(materi.createdAt).toDateString() === today);
  const historyMateri = materiList.filter((materi) => new Date(materi.createdAt).toDateString() !== today);

  function renderSection(title: string, items: MateriData[], emptyText: string) {
    return (
      <section className="mt-7">
        <h2 className="mb-3 text-base font-semibold tracking-tight">{title}</h2>
        {items.length === 0 ? (
          <EmptyState>{emptyText}</EmptyState>
        ) : (
          <div className="space-y-3">
            {items.map((materi) => (
              <MateriCard
                key={materi.id}
                data={materi}
                isEditable={role === "GURU" && materi.guru?.id === me?.id}
                onEdit={setEditingMateri}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <div>
      <PageTitle
        title="Materi"
        description={role === "GURU" ? "Kelola materi untuk kelas yang Anda ajar." : "Materi dari kelas yang Anda ikuti."}
      />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {role === "GURU" && (
          <Button onClick={() => { setEditingMateri(null); setModalOpen(true); }}>+ Buat Materi</Button>
        )}
        <div className="w-full sm:ml-auto sm:max-w-xs">
          <Field label="Filter kelas">
            <SelectInput value={kelasId} onChange={(event) => setKelasId(event.target.value)}>
              <option value="">Semua Kelas</option>
              {kelasOptions.map((kelas) => (
                <option key={kelas.id} value={kelas.id}>{kelas.label}</option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </div>

      {loading ? (
        <div className="mt-5"><LoadingBlock /></div>
      ) : error ? (
        <p role="alert" className="mt-5 text-sm font-medium text-danger">{error}</p>
      ) : (
        <>
          {renderSection("Materi Hari Ini", todayMateri, "Belum ada materi hari ini.")}
          {renderSection("History", historyMateri, "Belum ada riwayat materi.")}
        </>
      )}

      {role === "GURU" && (
        <ModalMateri
          open={modalOpen || !!editingMateri}
          onClose={() => { setModalOpen(false); setEditingMateri(null); }}
          onSuccess={() => setReloadKey((value) => value + 1)}
          mode={editingMateri ? "edit" : "create"}
          initialData={editingMateri}
        />
      )}
    </div>
  );
}