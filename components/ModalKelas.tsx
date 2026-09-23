"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Textarea } from "./ui/Input";
import Button from "./ui/Button";
import { KelasData } from "./KelasCard";

interface ModalKelasProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  initialData?: KelasData | null;
}

export default function ModalKelas({ open, onClose, onSuccess, mode, initialData }: ModalKelasProps) {
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setJudul(initialData?.judul ?? "");
    setDeskripsi(initialData?.deskripsi ?? "");
    setError("");
  }, [open, initialData]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const isEdit = mode === "edit";
      const response = await fetch(isEdit ? `/api/kelas/${initialData?.id}` : "/api/kelas", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul, deskripsi: deskripsi || null }),
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
    <Modal open={open} onClose={onClose} title={mode === "create" ? "Buat Kelas" : "Edit Kelas"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nama Kelas" value={judul} onChange={(event) => setJudul(event.target.value)} required />
        <Textarea label="Deskripsi (opsional)" value={deskripsi} onChange={(event) => setDeskripsi(event.target.value)} />
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          {mode === "create" ? "Buat Kelas" : "Simpan Perubahan"}
        </Button>
      </form>
    </Modal>
  );
}
