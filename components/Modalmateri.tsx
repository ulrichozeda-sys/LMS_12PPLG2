"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Select, Textarea } from "./ui/Input";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import { MateriData } from "./MateriCard";

interface KelasOption {
  id: string;
  label: string;
}

type MateriType = "LINK" | "PDF" | "FILE" | "FOTO";

interface ModalMateriProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  initialData?: MateriData | null;
  defaultKelasId?: string;
}

export default function ModalMateri({ open, onClose, onSuccess, mode, initialData, defaultKelasId }: ModalMateriProps) {
  const [judul, setJudul] = useState("");
  const [tipe, setTipe] = useState<MateriType>("LINK");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    fetch("/api/kelas")
      .then((res) => res.json())
      .then((data) =>
        setKelasList((data.data ?? []).map((k: any) => ({ id: k.id, label: k.judul || "Tanpa Judul", })))
      )
      .catch(() => {});

    if (mode === "edit" && initialData) {
      setJudul(initialData.judul);
      setTipe(initialData.tipe);
      setUrl(initialData.url);
      setFileName(initialData.url.split("/").pop()?.replace(/^[0-9a-f-]{36}-/i, "") ?? "");
      setDeskripsi(initialData.deskripsi ?? "");
      setSelectedKelasIds((initialData.kelasTujuan ?? []).map((kt: any) => kt.kelas.id).filter(Boolean));
    } else {
      setJudul("");
      setTipe("LINK");
      setUrl("");
      setFileName("");
      setDeskripsi("");
      setSelectedKelasIds(defaultKelasId ? [defaultKelasId] : []);
    }
    setError("");
  }, [open, mode, initialData, defaultKelasId]);

  function toggleKelas(id: string) {
    setSelectedKelasIds((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload?kategori=materi", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "File gagal diunggah.");
        return;
      }
      setUrl(payload.url);
      setFileName(file.name);
      setTipe(file.type === "application/pdf" ? "PDF" : file.type.startsWith("image/") ? "FOTO" : "FILE");
    } catch {
      setError("File gagal diunggah.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const destinationIds = defaultKelasId && mode === "create" ? [defaultKelasId] : selectedKelasIds;
    if (destinationIds.length === 0 && !(defaultKelasId && mode === "edit")) {
      setError("Pilih minimal 1 kelas tujuan.");
      return;
    }

    setLoading(true);
    try {
      const isEdit = mode === "edit";
      const urlEndpoint = isEdit ? `/api/materi/${initialData?.id}` : "/api/materi";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(urlEndpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul,
          tipe,
          url,
          deskripsi: deskripsi || null,
          ...(defaultKelasId && mode === "edit" ? {} : { kelasIds: destinationIds }),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan.");
        setLoading(false);
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
    <Modal open={open} onClose={onClose} title={mode === "create" ? "Upload Materi" : "Edit Materi"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Judul Materi" value={judul} onChange={(e) => setJudul(e.target.value)} required />

        <Select label="Tipe sumber" value={tipe} onChange={(e) => { setTipe(e.target.value as MateriType); setUrl(""); setFileName(""); }}>
          <option value="LINK">Link</option>
          <option value="PDF">PDF</option>
          <option value="FILE">File</option>
          <option value="FOTO">Foto</option>
        </Select>

        {tipe === "LINK" ? (
          <Input label="Tautan Materi" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} required />
        ) : (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Lampiran</label>
            <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#374151] hover:bg-black/5">
              {uploading ? "Mengunggah..." : fileName ? "Ganti File" : "Pilih File"}
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleUpload(file); event.target.value = ""; }} />
            </label>
            {fileName && <p className="mt-2 break-all text-xs text-[#64748B]">{fileName}</p>}
          </div>
        )}

        <Textarea label="Deskripsi (opsional)" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />

        {!defaultKelasId && <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Kelas Tujuan</label>
          <select
            className="w-full rounded-lg border border-[#D1D5DB] px-3.5 py-2.5 text-sm outline-none focus:border-[#00D2D9]"
            value=""
            onChange={(e) => e.target.value && toggleKelas(e.target.value)}
          >
            <option value="">+ Tambah kelas</option>
            {kelasList
              .filter((k) => !selectedKelasIds.includes(k.id))
              .map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
          </select>

          {selectedKelasIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedKelasIds.map((id) => {
                const k = kelasList.find((kk) => kk.id === id);
                return (
                  <Badge key={id} tone="brand" className="flex items-center gap-1">
                    {k?.label}
                    <button type="button" onClick={() => toggleKelas(id)} className="cursor-pointer hover:text-red-500">
                      Ã—
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>}

        {error && <p className="text-xs font-medium text-red-500">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          {mode === "create" ? "Upload Materi" : "Simpan Perubahan"}
        </Button>
      </form>
    </Modal>
  );
}