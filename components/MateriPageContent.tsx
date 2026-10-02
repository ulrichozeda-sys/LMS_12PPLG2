"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import MateriCard, { MateriData } from "@/components/MateriCard";
import ModalMateri from "@/components/Modalmateri";
import { showAlert, showConfirm } from "@/lib/dialog";

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
        <h2 className="mb-3 text-sm font-bold text-[#111827]">{title}</h2>
        {items.length === 0 ? (
          <p className="border-t border-[#E2E8F0] py-4 text-sm text-[#64748B]">{emptyText}</p>
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
      <header className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-xl font-bold text-[#111827]">Materi</h1>
        <p className="mt-1 text-sm text-[#64748B]">{role === "GURU" ? "Kelola materi untuk kelas yang Anda ajar." : "Materi dari kelas yang Anda ikuti."}</p>
      </header>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {role === "GURU" && <Button onClick={() => { setEditingMateri(null); setModalOpen(true); }}>+ Buat Materi</Button>}
        <label className="flex w-full flex-col gap-1 text-xs font-semibold text-[#475569] sm:ml-auto sm:max-w-xs">
          Filter kelas
          <select className="min-h-10 w-full border border-[#CBD5E1] bg-white px-3 text-sm" value={kelasId} onChange={(event) => setKelasId(event.target.value)}>
            <option value="">Semua Kelas</option>
            {kelasOptions.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.label}</option>)}
          </select>
        </label>
      </div>

      {loading ? <p className="mt-5 text-sm text-[#64748B]">Memuat materi...</p> : error ? <p role="alert" className="mt-5 text-sm text-red-700">{error}</p> : (
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