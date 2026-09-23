"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Select, Textarea } from "./ui/Input";
import Button from "./ui/Button";
import { AsesmenData } from "./Asesmencard";

interface ModalEditAsesmenProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: (AsesmenData & { mapelId?: string | null }) | null;
}

export default function ModalEditAsesmen({ open, onClose, onSuccess, initialData }: ModalEditAsesmenProps) {
  const [judul, setJudul] = useState("");
  const [tipe, setTipe] = useState<AsesmenData["tipe"]>("KUIS");
  const [mapelId, setMapelId] = useState("");
  const [durasiMenit, setDurasiMenit] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [mapelList, setMapelList] = useState<{ id: string; nama: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !initialData) return;
    setJudul(initialData.judul);
    setTipe(initialData.tipe);
    setMapelId(initialData.mapelId ?? initialData.mapel?.id ?? "");
    setDurasiMenit(initialData.durasiMenit?.toString() ?? "");
    setDeskripsi(initialData.deskripsi ?? "");
    setError("");
    fetch("/api/mapel")
      .then((response) => response.json())
      .then((data) => setMapelList(data.data ?? []))
      .catch(() => {});
  }, [open, initialData]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!initialData) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/asesmen/${initialData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul,
          tipe,
          mapelId: mapelId || null,
          durasiMenit: durasiMenit ? Number(durasiMenit) : null,
          deskripsi: deskripsi || null,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "Terjadi kesalahan.");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Asesmen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Judul Asesmen" value={judul} onChange={(event) => setJudul(event.target.value)} required />
        <Select label="Tipe" value={tipe} onChange={(event) => setTipe(event.target.value as AsesmenData["tipe"])}>
          <option value="KUIS">Kuis</option>
          <option value="UJIAN">Ujian Online</option>
        </Select>
        <Select label="Mapel (opsional)" value={mapelId} onChange={(event) => setMapelId(event.target.value)}>
          <option value="">Tanpa mapel</option>
          {mapelList.map((mapel) => <option key={mapel.id} value={mapel.id}>{mapel.nama}</option>)}
        </Select>
        <Input label="Durasi (menit)" type="number" min={1} value={durasiMenit} onChange={(event) => setDurasiMenit(event.target.value)} />
        <Textarea label="Deskripsi (opsional)" value={deskripsi} onChange={(event) => setDeskripsi(event.target.value)} />
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">Simpan Perubahan</Button>
      </form>
    </Modal>
  );
}
