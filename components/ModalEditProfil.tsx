"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Textarea } from "./ui/Input";
import Button from "./ui/Button";

interface ModalEditProfilProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  initialNama: string;
  initialFoto: string | null;
  initialDeskripsi: string | null;
}

export default function ModalEditProfil({ open, onClose, onSuccess, userId, initialNama, initialFoto, initialDeskripsi }: ModalEditProfilProps) {
  const [nama, setNama] = useState(initialNama);
  const [fotoProfil, setFotoProfil] = useState(initialFoto ?? "");
  const [deskripsi, setDeskripsi] = useState(initialDeskripsi ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setNama(initialNama);
    setFotoProfil(initialFoto ?? "");
    setDeskripsi(initialDeskripsi ?? "");
    setError("");
  }, [open, initialNama, initialFoto, initialDeskripsi]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/profil/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, fotoProfil: fotoProfil || null, deskripsi: deskripsi || null }),
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
    <Modal open={open} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nama" value={nama} onChange={(event) => setNama(event.target.value)} required />
        <Input label="URL Foto Profil (opsional)" value={fotoProfil} onChange={(event) => setFotoProfil(event.target.value)} />
        <Textarea label="Deskripsi (opsional)" value={deskripsi} onChange={(event) => setDeskripsi(event.target.value)} />
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">Simpan Perubahan</Button>
      </form>
    </Modal>
  );
}
