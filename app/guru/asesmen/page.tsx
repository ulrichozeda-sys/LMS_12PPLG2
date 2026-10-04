"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import AsesmenCard, { AsesmenData } from "@/components/Asesmencard";
import ModalBuatAsesmen from "@/components/Modalbuatasesmen";
import ModalEditAsesmen from "@/components/ModalEditAsesmen";
import { showAlert, showConfirm } from "@/lib/dialog";

type StatusFilter = "SEMUA" | "PROSES" | "SELESAI";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "SEMUA", label: "Semua" },
  { value: "PROSES", label: "Proses" },
  { value: "SELESAI", label: "Selesai" },
];

export default function GuruAsesmenPage() {
  const router = useRouter();
  const [asesmenList, setAsesmenList] = useState<AsesmenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("SEMUA");
  const [showModal, setShowModal] = useState(false);
  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({
    "hari-ini": true,
    "tiga-bulan": true,
    history: true,
  });
  const [editingAsesmen, setEditingAsesmen] = useState<AsesmenData | null>(null);
  const [sendingAsesmen, setSendingAsesmen] = useState<AsesmenData | null>(null);

  useEffect(() => {
    loadAsesmen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function loadAsesmen() {
    setLoading(true);
    try {
      const qs = statusFilter !== "SEMUA" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/asesmen${qs}`);
      const data = await res.json();
      setAsesmenList(data.data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function handleSuccess(asesmenId: string) {
    router.push(`/guru/asesmen/${asesmenId}`);
  }

  function handleSendSuccess() {
    setSendingAsesmen(null);
    loadAsesmen();
  }

  async function handleDeleteAsesmen(asesmen: AsesmenData) {
    if (!(await showConfirm(`Hapus asesmen "${asesmen.judul}"? Data soal dan pengumpulan juga akan dihapus.`))) return;

    const res = await fetch(`/api/asesmen/${asesmen.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      await showAlert(data?.error ?? "Asesmen gagal dihapus.");
      return;
    }

    loadAsesmen();
  }

  const sekarang = new Date();
  const awalPeriodeSekarang = new Date(sekarang);
  awalPeriodeSekarang.setMonth(awalPeriodeSekarang.getMonth() - 3);
  const awalPeriodeSebelumnya = new Date(sekarang);
  awalPeriodeSebelumnya.setMonth(awalPeriodeSebelumnya.getMonth() - 6);
  const tanggalAsesmen = (asesmen: AsesmenData) => new Date(asesmen.createdAt ?? asesmen.updatedAt);
  const kelompok = [
    {
      key: "hari-ini",
      judul: "Asesmen Hari Ini",
      data: asesmenList.filter((asesmen) => tanggalAsesmen(asesmen) >= awalPeriodeSekarang),
    },
    {
      key: "tiga-bulan",
      judul: "3 Bulan Terakhir",
      data: asesmenList.filter((asesmen) => {
        const tanggal = tanggalAsesmen(asesmen);
        return tanggal >= awalPeriodeSebelumnya && tanggal < awalPeriodeSekarang;
      }),
    },
    {
      key: "history",
      judul: "History Asesmen",
      data: asesmenList.filter((asesmen) => tanggalAsesmen(asesmen) < awalPeriodeSebelumnya),
    },
  ];

  function renderAsesmenCards(data: AsesmenData[]) {
    const kelompokTipe = [
      { judul: "Kuis", data: data.filter((asesmen) => asesmen.tipe === "KUIS") },
      { judul: "Ujian Online", data: data.filter((asesmen) => asesmen.tipe === "UJIAN") },
    ];
    return (
      <div className="space-y-6">
        {kelompokTipe.map((group) => group.data.length > 0 && (
          <div key={group.judul}>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-medium">{group.judul}</h3>
              <span className="rounded-sm border px-1.5 text-xs tabular-nums text-muted-foreground">
                {group.data.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.data.map((asesmen) => (
                <AsesmenCard key={asesmen.id} data={asesmen} basePath="/guru/asesmen" onEdit={setEditingAsesmen} onSend={setSendingAsesmen} onDelete={handleDeleteAsesmen} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter status asesmen"
          className="inline-flex rounded-md border bg-muted p-0.5"
        >
          {FILTERS.map(({ value, label }) => {
            const active = statusFilter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(value)}
                className={`h-10 cursor-pointer rounded-sm px-3 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-8 ${
                  active
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Buat Asesmen
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3" role="status" aria-label="Memuat asesmen">
          <div className="h-12 animate-pulse rounded-lg border bg-muted" />
          <div className="h-12 animate-pulse rounded-lg border bg-muted" />
          <div className="h-12 animate-pulse rounded-lg border bg-muted" />
        </div>
      ) : asesmenList.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed px-4 py-10 text-center">
          <p className="text-sm font-medium">Belum ada asesmen</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Klik &quot;Buat Asesmen&quot; untuk membuat kuis atau ujian pertama.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {kelompok.map((group) => group.data.length > 0 && (
            <section key={group.key} className="rounded-lg border bg-card text-card-foreground">
              <button
                type="button"
                aria-expanded={!!visibleGroups[group.key]}
                onClick={() => setVisibleGroups((current) => ({ ...current, [group.key]: !current[group.key] }))}
                className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-4 text-left outline-none transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{group.judul}</span>
                  <span className="rounded-sm border px-1.5 text-xs tabular-nums text-muted-foreground">
                    {group.data.length}
                  </span>
                </span>
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform duration-150 ${visibleGroups[group.key] ? "rotate-180" : ""}`}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </button>
              {visibleGroups[group.key] && (
                <div className="border-t p-4">{renderAsesmenCards(group.data)}</div>
              )}
            </section>
          ))}
        </div>
      )}

      <ModalBuatAsesmen open={showModal} onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
      <ModalEditAsesmen
        open={!!editingAsesmen}
        onClose={() => setEditingAsesmen(null)}
        onSuccess={loadAsesmen}
        initialData={editingAsesmen ? { ...editingAsesmen, mapelId: editingAsesmen.mapelId ?? editingAsesmen.mapel?.id ?? null } : null}
      />
      <ModalBuatAsesmen
        open={!!sendingAsesmen}
        onClose={() => setSendingAsesmen(null)}
        onSuccess={handleSendSuccess}
        initialSumber="EXISTING"
        initialAsesmenId={sendingAsesmen?.id}
      />
    </div>
  );
}