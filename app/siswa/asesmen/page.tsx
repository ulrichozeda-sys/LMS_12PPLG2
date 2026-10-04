// app/siswa/asesmen/page.tsx
"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import AsesmenCard, { AsesmenData } from "@/components/Asesmencard";
import { showConfirm } from "@/lib/dialog";

export default function SiswaAsesmenPage() {
  const [asesmenList, setAsesmenList] = useState<(AsesmenData & { statusSubmission?: "BELUM" | "SEDANG" | "SUDAH" })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({
    "hari-ini": true,
    "tiga-bulan": true,
    history: true,
  });

  useEffect(() => {
    fetch("/api/asesmen")
      .then((res) => res.json())
      .then((data) => setAsesmenList(data.data ?? []))
      .catch(() => setAsesmenList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        const userId = data.data?.id;
        if (!userId) return;
        const stored = window.localStorage.getItem(`myclass:siswa:removed-asesmen:${userId}`);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setDismissedIds(parsed.filter((id): id is string => typeof id === "string"));
      })
      .catch(() => {});
  }, []);

  async function removeHistory(asesmen: AsesmenData) {
    const confirmed = await showConfirm(`Hapus kartu "${asesmen.judul}" dari tampilan history? Jawaban, nilai, dan submission tetap aman.`);
    if (!confirmed) return;

    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        const userId = data.data?.id;
        if (!userId) return;
        setDismissedIds((current) => {
          const next = current.includes(asesmen.id) ? current : [...current, asesmen.id];
          window.localStorage.setItem(`myclass:siswa:removed-asesmen:${userId}`, JSON.stringify(next));
          return next;
        });
      })
      .catch(() => {});
  }

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Memuat asesmen">
        <div className="h-12 animate-pulse rounded-lg border bg-muted" />
        <div className="h-12 animate-pulse rounded-lg border bg-muted" />
        <div className="h-12 animate-pulse rounded-lg border bg-muted" />
      </div>
    );
  }

  const visibleAsesmenList = asesmenList.filter((asesmen) => !dismissedIds.includes(asesmen.id));
  const sekarang = new Date();
  const awalPeriodeSekarang = new Date(sekarang);
  awalPeriodeSekarang.setMonth(awalPeriodeSekarang.getMonth() - 3);
  const awalPeriodeSebelumnya = new Date(sekarang);
  awalPeriodeSebelumnya.setMonth(awalPeriodeSebelumnya.getMonth() - 6);
  const tanggalAsesmen = (asesmen: AsesmenData) => new Date(asesmen.createdAt ?? asesmen.updatedAt);
  const asesmenHariIni = visibleAsesmenList.filter((asesmen) => tanggalAsesmen(asesmen) >= awalPeriodeSekarang);
  const asesmenTigaBulan = visibleAsesmenList.filter((asesmen) => {
    const tanggal = tanggalAsesmen(asesmen);
    return tanggal >= awalPeriodeSebelumnya && tanggal < awalPeriodeSekarang;
  });
  const historyAsesmen = visibleAsesmenList.filter((asesmen) => tanggalAsesmen(asesmen) < awalPeriodeSebelumnya);

  const kelompok = [
    { key: "hari-ini", judul: "Asesmen Hari Ini", data: asesmenHariIni },
    { key: "tiga-bulan", judul: "3 Bulan Terakhir", data: asesmenTigaBulan },
    { key: "history", judul: "History Asesmen", data: historyAsesmen },
  ];

  function renderAsesmenCards(data: typeof asesmenList) {
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
              <span className="rounded-sm border px-1.5 text-xs tabular-nums text-muted-foreground">{group.data.length}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.data.map((asesmen) => (
                <AsesmenCard key={asesmen.id} data={asesmen} basePath="/siswa/asesmen" submissionStatus={asesmen.statusSubmission} onRemove={removeHistory} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {visibleAsesmenList.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-10 text-center">
          <p className="text-sm font-medium">Belum ada asesmen yang ditampilkan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Data asesmen yang sudah kamu hapus dari tampilan tetap tersimpan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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
                  <span className="rounded-sm border px-1.5 text-xs tabular-nums text-muted-foreground">{group.data.length}</span>
                </span>
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform duration-150 ${visibleGroups[group.key] ? "rotate-180" : ""}`}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </button>
              {visibleGroups[group.key] && <div className="border-t p-4">{renderAsesmenCards(group.data)}</div>}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}