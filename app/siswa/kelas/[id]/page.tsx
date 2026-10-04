// app/siswa/kelas/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PengumumanCard from "@/components/PengumumanCard";
import TugasCard from "@/components/TugasCard";
import MateriCard, { MateriData } from "@/components/MateriCard";
import FeedCategoryFilter, { FeedCategory } from "@/components/FeedCategoryFilter";
import { ClassDetailOverview, ClassDirectoryNavigation } from "@/components/ClassDetailOverview";

interface SiswaDiKelas {
  siswaId: string;
  siswa: { id: string; nama: string; nis: string | null; fotoProfil: string | null; kelasReferensi: { label: string } | null };
}
interface GuruDiKelas {
  id: string;
  guru: { id: string; nama: string; nik: string | null; fotoProfil: string | null };
  mapel: { id: string; nama: string };
}
interface FeedItem {
  tipe: "PENGUMUMAN" | "ASESMEN" | "TUGAS" | "MATERI";
  timestamp: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}
interface KelasDetail {
  id: string;
  judul: string;
  deskripsi: string | null;
  siswa: SiswaDiKelas[];
  guruMapel: GuruDiKelas[];
  feed: FeedItem[];
}

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const personRow =
  `flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-md border p-3 text-left transition-colors duration-150 hover:bg-accent ${focusRing}`;

function Avatar({ src, name }: { src: string | null; name: string }) {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-xs font-medium text-muted-foreground">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.charAt(0)
      )}
    </div>
  );
}

export default function SiswaKelasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const kelasId = params.id as string;

  const [kelas, setKelas] = useState<KelasDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [error, setError] = useState("");
  const [feedCategory, setFeedCategory] = useState<FeedCategory>("SEMUA");

  const [section, setSection] = useState<"SISWA" | "GURU" | null>(null);
  const [expandedRombel, setExpandedRombel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadKelas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasId]);

  async function loadKelas() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/kelas/${kelasId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat kelas.");
        setLoading(false);
        return;
      }
      setKelas(data.data);
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Memuat kelas">
        <div className="h-28 animate-pulse rounded-lg border bg-muted" />
        <div className="h-12 animate-pulse rounded-lg border bg-muted" />
        <div className="h-24 animate-pulse rounded-lg border bg-muted" />
      </div>
    );
  }

  if (error || !kelas) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">{error || "Kelas tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push("/siswa")}>
          Kembali
        </Button>
      </div>
    );
  }

  const siswaGrouped = kelas.siswa.reduce((acc: Record<string, SiswaDiKelas[]>, ks) => {
    const label = ks.siswa.kelasReferensi?.label ?? "Belum Ada Kelas";
    if (!acc[label]) acc[label] = [];
    acc[label].push(ks);
    return acc;
  }, {});

  const guruGrouped = kelas.guruMapel.reduce((acc: Record<string, GuruDiKelas[]>, gm) => {
    const label = gm.mapel.nama;
    if (!acc[label]) acc[label] = [];
    acc[label].push(gm);
    return acc;
  }, {});
  const visibleFeed = kelas.feed.filter((item) => feedCategory === "SEMUA" || item.tipe === feedCategory);

  return (
    <div>
      <ClassDetailOverview title={kelas.judul} description={kelas.deskripsi} studentCount={kelas.siswa.length} teacherCount={kelas.guruMapel.length} />
      <ClassDirectoryNavigation section={section} onChange={setSection} studentCount={kelas.siswa.length} teacherCount={kelas.guruMapel.length} />

      {section === "SISWA" && (
        <div className="mt-4 space-y-3">
          {Object.keys(siswaGrouped).length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada siswa di kelas ini.</p>
          ) : (
            Object.entries(siswaGrouped).map(([label, list]) => {
              const isOpen = expandedRombel === label;
              return (
                <div key={label} className="overflow-hidden rounded-lg border bg-card text-card-foreground">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpandedRombel(isOpen ? null : label)}
                    className={`flex min-h-12 w-full cursor-pointer items-center justify-between px-4 text-left transition-colors duration-150 hover:bg-accent ${focusRing}`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{label}</p>
                      <Badge tone="brand">{list.length} Siswa</Badge>
                    </div>
                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t p-3">
                      {list.map((ks) => (
                        <button key={ks.siswaId} onClick={() => router.push(`/profil/${ks.siswa.id}`)} className={personRow}>
                          <Avatar src={ks.siswa.fotoProfil} name={ks.siswa.nama} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{ks.siswa.nama}</p>
                            <p className="text-xs text-muted-foreground">
                              NIS: <span className="font-mono">{ks.siswa.nis}</span>
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {section === "GURU" && (
        <div className="mt-4">
          {Object.keys(guruGrouped).length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada guru mengajar di kelas ini.</p>
          ) : (
            Object.entries(guruGrouped).map(([mapel, list]) => (
              <div key={mapel} className="mb-5">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">{mapel}</h3>
                <div className="space-y-2">
                  {list.map((gm) => (
                    <button key={gm.id} onClick={() => router.push(`/profil/${gm.guru.id}`)} className={`${personRow} bg-card`}>
                      <Avatar src={gm.guru.fotoProfil} name={gm.guru.nama} />
                      <p className="text-sm font-medium">{gm.guru.nama}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {section === null && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold">Aktivitas Kelas</h2>
          <FeedCategoryFilter value={feedCategory} onChange={setFeedCategory} />
          <div className="space-y-3">
            {kelas.feed.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada aktivitas di kelas ini.</p>
            ) : visibleFeed.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada aktivitas untuk filter ini.</p>
            ) : (
              visibleFeed.map((item, i) => {
                if (item.tipe === "PENGUMUMAN") {
                  // gak dikasih onEdit/onDelete -> tombol itu otomatis gak muncul buat siswa
                  return <PengumumanCard key={`p-${i}`} data={item.data} currentUserId={me?.id ?? ""} />;
                }
                if (item.tipe === "TUGAS") {
                  return <TugasCard key={`t-${i}`} data={item.data} currentUserId={me?.id ?? ""} role="SISWA" />;
                }
                if (item.tipe === "MATERI") return <MateriCard key={`m-${item.data.id}`} data={item.data as MateriData} />;
                // ASESMEN: murni tampilan, gak diklik dari feed -- siswa ngerjain dari tab Asesmen
                const a = item.data;
                const sudah = a.statusSubmission === "SUDAH";
                return (
                  <div key={`a-${i}`} className="rounded-lg border bg-card p-4 text-card-foreground">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone="brand">{a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
                        {a.mapel && <Badge tone="gray">{a.mapel.nama}</Badge>}
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(`/siswa/asesmen/${a.id}`)}
                        className={`inline-flex h-10 shrink-0 cursor-pointer items-center rounded-md px-3 text-sm font-medium transition-colors duration-150 sm:h-9 ${focusRing} ${
                          sudah ? "border bg-background hover:bg-accent" : "bg-brand text-brand-foreground hover:bg-brand/90"
                        }`}
                      >
                        {sudah ? "Sudah Dikerjakan" : "Kerjakan"}
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{a.judul}</p>
                    <p className="mt-1 text-xs text-muted-foreground">oleh {a.guru?.nama}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}