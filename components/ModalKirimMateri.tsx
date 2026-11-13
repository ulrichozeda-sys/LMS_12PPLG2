"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import { MateriData } from "./MateriCard";

interface ModalKirimMateriProps {
  materi: MateriData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalKirimMateri({ materi, onClose, onSuccess }: ModalKirimMateriProps) {
  const [kelasList, setKelasList] = useState<{ id: string; judul: string }[]>([]);
  const [existingKelasIds, setExistingKelasIds] = useState<string[]>([]);
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!materi) return;
    let active = true;
    setSelectedKelasIds([]);
    setError("");

    Promise.all([fetch("/api/kelas"), fetch(`/api/materi/${materi.id}`)])
      .then(async ([classesResponse, materialResponse]) => {
        const [classesPayload, materialPayload] = await Promise.all([classesResponse.json(), materialResponse.json()]);
        if (!classesResponse.ok) throw new Error(classesPayload.error ?? "Daftar kelas gagal dimuat.");
        if (!materialResponse.ok) throw new Error(materialPayload.error ?? "Materi gagal dimuat.");
        if (active) {
          setKelasList(classesPayload.data ?? []);
          setExistingKelasIds((materialPayload.data.kelasTujuan ?? []).map(({ kelas }: { kelas: { id: string } }) => kelas.id));
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Daftar kelas gagal dimuat.");
      });

    return () => {
      active = false;
    };
  }, [materi]);

  function toggleKelas(id: string) {
    setSelectedKelasIds((current) => current.includes(id)
      ? current.filter((kelasId) => kelasId !== id)
      : [...current, id]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!materi) return;
    if (selectedKelasIds.length === 0) {
      setError("Pilih minimal 1 kelas tujuan.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/materi/${materi.id}/kirim-ke-kelas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelasIds: selectedKelasIds }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Materi gagal dikirim.");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Materi gagal dikirim.");
    } finally {
      setLoading(false);
    }
  }

  const existingIds = new Set(existingKelasIds);
  const availableClasses = kelasList.filter((kelas) => !existingIds.has(kelas.id));

  return (
    <Modal open={Boolean(materi)} onClose={onClose} title="Kirim Materi ke Kelas" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Pilih kelas tambahan untuk membagikan materi <span className="font-medium text-foreground">{materi?.judul}</span>.
        </p>
        {existingKelasIds.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Sudah dibagikan ke</p>
            <div className="flex flex-wrap gap-2">
              {existingKelasIds.map((id) => (
                <Badge key={id} tone="gray">{kelasList.find((kelas) => kelas.id === id)?.judul ?? id}</Badge>
              ))}
            </div>
          </div>
        )}
        <div>
          <label htmlFor="materi-kelas-tujuan" className="mb-1.5 block text-xs font-semibold text-foreground">
            Pilih kelas tambahan
          </label>
          <select
            id="materi-kelas-tujuan"
            className="w-full min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            value=""
            onChange={(event) => {
              if (event.target.value) toggleKelas(event.target.value);
            }}
          >
            <option value="">+ Tambah kelas</option>
            {availableClasses
              .filter((kelas) => !selectedKelasIds.includes(kelas.id))
              .map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.judul}</option>)}
          </select>
          {selectedKelasIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedKelasIds.map((id) => {
                const kelas = kelasList.find((item) => item.id === id);
                return (
                  <Badge key={id} tone="brand" className="flex items-center gap-1">
                    {kelas?.judul}
                    <button type="button" onClick={() => toggleKelas(id)} aria-label={`Hapus ${kelas?.judul}`} className="cursor-pointer hover:text-danger">
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
          {availableClasses.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">Materi sudah dibagikan ke semua kelas yang tersedia.</p>
          )}
        </div>
        {error && <p role="alert" className="text-xs font-medium text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Batal</Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!materi || (availableClasses.length === 0 && selectedKelasIds.length === 0)}
            className="flex-1"
          >
            Kirim Materi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
