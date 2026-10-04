// app/guru/tugas/page.tsx
"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import TugasCard, { TugasData } from "@/components/TugasCard";
import ModalTugas from "@/components/ModalTugas";
import ModalKirimTugas from "@/components/ModalKirimTugas";
import { showConfirm } from "@/lib/dialog";
import { EmptyState, LoadingBlock, PageTitle } from "@/components/shared/data-display";
import { SelectInput } from "@/components/shared/form-controls";

export default function GuruTugasPage() {
  const [tugasList, setTugasList] = useState<TugasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTugas, setEditingTugas] = useState<TugasData | null>(null);
  const [sendingTugas, setSendingTugas] = useState<TugasData | null>(null);
  const [filterKelasId, setFilterKelasId] = useState("");
  const [kelasOptions, setKelasOptions] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.data)).catch(() => {});
    fetch("/api/kelas")
      .then((r) => r.json())
      .then((d) => setKelasOptions((d.data ?? []).map((k: any) => ({ id: k.id, label: k.judul }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadTugas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKelasId]);

  async function loadTugas() {
    setLoading(true);
    try {
      const qs = filterKelasId ? `?kelasId=${filterKelasId}` : "";
      const res = await fetch(`/api/tugas${qs}`);
      const data = await res.json();
      setTugasList(data.data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function openBuat() {
    setEditingTugas(null);
    setShowModal(true);
  }
  function openEdit(t: TugasData) {
    setEditingTugas(t);
    setShowModal(true);
  }
  function handleSendSuccess() {
    setSendingTugas(null);
    loadTugas();
  }
  async function handleDelete(id: string) {
    if (!(await showConfirm("Hapus tugas ini?"))) return;
    await fetch(`/api/tugas/${id}`, { method: "DELETE" });
    loadTugas();
  }

  const todayStr = new Date().toDateString();
  const hariIni = tugasList.filter((t) => new Date(t.createdAt).toDateString() === todayStr);
  const history = tugasList.filter((t) => new Date(t.createdAt).toDateString() !== todayStr);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Tugas"
        description="Buat tugas, lalu kirim ke suatu kelas untuk memulai tugas."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button onClick={openBuat}>+ Buat Tugas</Button>
        <SelectInput
          aria-label="Filter kelas"
          className="w-full sm:w-56"
          value={filterKelasId}
          onChange={(e) => setFilterKelasId(e.target.value)}
        >
          <option value="">Semua Kelas</option>
          {kelasOptions.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </SelectInput>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-base font-semibold tracking-tight">Tugas Hari Ini</h2>
            {hariIni.length === 0 ? (
              <EmptyState>Belum ada tugas dibuat hari ini.</EmptyState>
            ) : (
              <div className="space-y-3">
                {hariIni.map((t) => (
                  <TugasCard key={t.id} data={t} currentUserId={me?.id ?? ""} role="GURU" onEdit={openEdit} onDelete={handleDelete} onSend={setSendingTugas} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold tracking-tight">History</h2>
            {history.length === 0 ? (
              <EmptyState>Belum ada riwayat tugas.</EmptyState>
            ) : (
              <div className="space-y-3">
                {history.map((t) => (
                  <TugasCard key={t.id} data={t} currentUserId={me?.id ?? ""} role="GURU" onEdit={openEdit} onDelete={handleDelete} onSend={setSendingTugas} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <ModalTugas
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadTugas}
        mode={editingTugas ? "edit" : "create"}
        initialData={editingTugas}
      />
      <ModalKirimTugas
        open={!!sendingTugas}
        tugasId={sendingTugas?.id ?? null}
        onClose={() => setSendingTugas(null)}
        onSuccess={handleSendSuccess}
      />
    </div>
  );
}