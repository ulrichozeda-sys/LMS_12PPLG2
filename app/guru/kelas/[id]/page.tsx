"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronDown, Ellipsis } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PengumumanCard, { PengumumanData } from "@/components/PengumumanCard";
import TugasCard, { TugasData } from "@/components/TugasCard";
import ModalPengumuman from "@/components/ModalPengumuman";
import MateriCard, { MateriData } from "@/components/MateriCard";
import FeedCategoryFilter, { FeedCategory } from "@/components/FeedCategoryFilter";
import { ClassDetailOverview, ClassDirectoryNavigation } from "@/components/ClassDetailOverview";
import ModalMateri from "@/components/Modalmateri";
import Modal from "@/components/ui/Modal";
import ModalBuatAsesmen from "@/components/Modalbuatasesmen";
import ModalEditAsesmen from "@/components/ModalEditAsesmen";
import ModalTugas from "@/components/ModalTugas";
import ModalKirimTugas from "@/components/ModalKirimTugas";
import ModalKirimAsesmen from "@/components/ModalKirimAsesmen";
import ModalKirimPengumuman from "@/components/ModalKirimPengumuman";
import type { AsesmenData } from "@/components/Asesmencard";
import { showAlert, showConfirm } from "@/lib/dialog";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/shared/avatar";
import { EmptyState, LoadingBlock } from "@/components/shared/data-display";

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
  data: any;
}
interface KelasDetail {
  id: string;
  judul: string;
  deskripsi: string | null;
  inviteToken: string;
  siswa: SiswaDiKelas[];
  guruMapel: GuruDiKelas[];
  feed: FeedItem[];
}

const menuItem =
  "block h-10 w-full cursor-pointer px-3 text-left text-sm transition-colors duration-100 hover:bg-accent";

export default function GuruKelasDetailPage() {
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
  const [copied, setCopied] = useState(false);

  const [showModalPengumuman, setShowModalPengumuman] = useState(false);
  const [editingPengumuman, setEditingPengumuman] = useState<PengumumanData | null>(null);
  const [showContentChooser, setShowContentChooser] = useState(false);
  const [showModalMateri, setShowModalMateri] = useState(false);
  const [editingMateri, setEditingMateri] = useState<MateriData | null>(null);
  const [showModalAsesmen, setShowModalAsesmen] = useState(false);
  const [asesmenFixedTipe, setAsesmenFixedTipe] = useState<"KUIS" | "UJIAN">("KUIS");
  const [editingAsesmen, setEditingAsesmen] = useState<AsesmenData | null>(null);
  const [showModalTugas, setShowModalTugas] = useState(false);
  const [editingTugas, setEditingTugas] = useState<TugasData | null>(null);
  const [sendingTugas, setSendingTugas] = useState<TugasData | null>(null);
  const [sendingAsesmen, setSendingAsesmen] = useState<AsesmenData | null>(null);
  const [sendingPengumuman, setSendingPengumuman] = useState<PengumumanData | null>(null);
  const [openAsesmenOptionsId, setOpenAsesmenOptionsId] = useState<string | null>(null);

  useEffect(() => {
    if (!openAsesmenOptionsId) return;
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Element && !target.closest("[data-options-menu]")) setOpenAsesmenOptionsId(null);
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [openAsesmenOptionsId]);

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

  function handleCopyInvite() {
    if (!kelas) return;
    navigator.clipboard.writeText(`${window.location.origin}/join/${kelas.inviteToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function openBuatQuiz() {
    setAsesmenFixedTipe("KUIS");
    setShowModalAsesmen(true);
  }
  function openBuatUjian() {
    setAsesmenFixedTipe("UJIAN");
    setShowModalAsesmen(true);
  }
  function handleAsesmenSuccess(asesmenId: string) {
    router.push(`/guru/asesmen/${asesmenId}`);
  }
  async function handleDeleteAsesmen(id: string) {
    if (!(await showConfirm("Hapus asesmen ini? Data soal dan pengumpulan juga akan dihapus."))) return;
    const res = await fetch(`/api/asesmen/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      await showAlert(data?.error ?? "Asesmen gagal dihapus.");
      return;
    }
    loadKelas();
  }

  async function handleDeleteMateri(id: string) {
    if (!(await showConfirm("Hapus materi ini?"))) return;
    const response = await fetch(`/api/materi/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      await showAlert(payload?.error ?? "Materi gagal dihapus.");
      return;
    }
    loadKelas();
  }

  function openBuatTugas() {
    setEditingTugas(null);
    setShowModalTugas(true);
  }
  function openEditTugas(tugas: TugasData) {
    setEditingTugas(tugas);
    setShowModalTugas(true);
  }
  async function handleDeleteTugas(id: string) {
    if (!(await showConfirm("Hapus tugas ini?"))) return;
    await fetch(`/api/tugas/${id}`, { method: "DELETE" });
    loadKelas();
  }

  function handleEditPengumuman(data: PengumumanData) {
    setEditingPengumuman(data);
  }
  async function handleDeletePengumuman(id: string) {
    if (!(await showConfirm("Hapus pengumuman ini?"))) return;
    await fetch(`/api/pengumuman/${id}`, { method: "DELETE" });
    loadKelas();
  }

  if (loading) return <LoadingBlock />;

  if (error || !kelas) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-sm text-muted-foreground">{error || "Kelas tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push("/guru")}>
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
      <ClassDetailOverview title={kelas.judul} description={kelas.deskripsi} studentCount={kelas.siswa.length} teacherCount={kelas.guruMapel.length} inviteToken={kelas.inviteToken} copied={copied} onCopyInvite={handleCopyInvite} />
      <ClassDirectoryNavigation section={section} onChange={setSection} studentCount={kelas.siswa.length} teacherCount={kelas.guruMapel.length} />

      {/* ============ SISWA ============ */}
      {section === "SISWA" && (
        <div className="mt-6 space-y-3">
          {Object.keys(siswaGrouped).length === 0 ? (
            <EmptyState>Belum ada siswa di kelas ini.</EmptyState>
          ) : (
            Object.entries(siswaGrouped).map(([label, list]) => {
              const isOpen = expandedRombel === label;
              return (
                <div key={label} className="overflow-hidden rounded-lg border bg-card text-card-foreground">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpandedRombel(isOpen ? null : label)}
                    className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{label}</p>
                      <Badge tone="brand">{list.length} Siswa</Badge>
                    </div>
                    <ChevronDown
                      aria-hidden="true"
                      strokeWidth={1.75}
                      className={cn("size-4 text-muted-foreground transition-transform duration-150", isOpen && "rotate-180")}
                    />
                  </button>
                  {isOpen && (
                    <ul className="divide-y border-t">
                      {list.map((ks) => (
                        <li key={ks.siswaId}>
                          <button
                            type="button"
                            onClick={() => router.push(`/profil/${ks.siswa.id}`)}
                            className="flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                          >
                            <Avatar name={ks.siswa.nama} src={ks.siswa.fotoProfil} className="size-9" />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{ks.siswa.nama}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============ GURU ============ */}
      {section === "GURU" && (
        <div className="mt-6">
          {Object.keys(guruGrouped).length === 0 ? (
            <EmptyState>Belum ada guru lain di kelas ini.</EmptyState>
          ) : (
            Object.entries(guruGrouped).map(([mapel, list]) => (
              <div key={mapel} className="mb-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">{mapel}</p>
                <ul className="divide-y overflow-hidden rounded-lg border bg-card text-card-foreground">
                  {list.map((gm) => (
                    <li key={gm.id} className="flex items-center gap-3 px-4 py-2.5">
                      <Avatar name={gm.guru.nama} src={gm.guru.fotoProfil} className="size-9" />
                      <p className="text-sm font-medium">{gm.guru.nama}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      {/* ============ FEED ============ */}
      {section === null && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button size="sm" onClick={() => setShowContentChooser(true)}>
              + Buat Konten
            </Button>
            <Button size="sm" variant="outline" onClick={openBuatQuiz}>
              + Buat Quiz
            </Button>
            <Button size="sm" variant="outline" onClick={openBuatUjian}>
              + Buat Ujian Online
            </Button>
            <Button size="sm" variant="outline" onClick={openBuatTugas}>
              + Tugas
            </Button>
          </div>

          <div className="mt-4">
            <FeedCategoryFilter value={feedCategory} onChange={setFeedCategory} />
            <div className="space-y-3">
              {kelas.feed.length === 0 ? (
                <EmptyState>Belum ada aktivitas di kelas ini.</EmptyState>
              ) : visibleFeed.length === 0 ? (
                <EmptyState>Tidak ada aktivitas untuk filter ini.</EmptyState>
              ) : (
                visibleFeed.map((item, i) => {
                  if (item.tipe === "PENGUMUMAN") {
                    return (
                      <PengumumanCard
                        key={`p-${i}`}
                        data={item.data}
                        currentUserId={me?.id ?? ""}
                        onEdit={handleEditPengumuman}
                        onDelete={handleDeletePengumuman}
                        onSend={setSendingPengumuman}
                      />
                    );
                  }
                  if (item.tipe === "TUGAS") {
                    return (
                      <TugasCard
                        key={`t-${i}`}
                        data={item.data}
                        currentUserId={me?.id ?? ""}
                        role="GURU"
                        onEdit={openEditTugas}
                        onDelete={handleDeleteTugas}
                        onSend={setSendingTugas}
                      />
                    );
                  }
                  if (item.tipe === "MATERI") {
                    return (
                      <MateriCard
                        key={`m-${item.data.id}`}
                        data={item.data as MateriData}
                        isEditable={item.data.guru?.id === me?.id}
                        onEdit={setEditingMateri}
                        onDelete={handleDeleteMateri}
                      />
                    );
                  }
                  const a = item.data;
                  return (
                    <div
                      key={`a-${i}`}
                      onClick={() => router.push(`/guru/asesmen/${a.id}`)}
                      className="block w-full cursor-pointer rounded-lg border bg-card p-4 text-left text-card-foreground transition-colors duration-150 hover:bg-accent"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="brand">{a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
                          {a.mapel && <Badge tone="gray">{a.mapel.nama}</Badge>}
                        </div>
                        {me?.id === a.guru?.id && (
                          <div className="relative" data-options-menu>
                            <button
                              type="button"
                              aria-label="Opsi asesmen"
                              aria-haspopup="menu"
                              aria-expanded={openAsesmenOptionsId === a.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenAsesmenOptionsId((value) => (value === a.id ? null : a.id));
                              }}
                              className="-m-1 inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-background hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Ellipsis className="size-4" strokeWidth={1.75} />
                            </button>
                            {openAsesmenOptionsId === a.id && (
                              <div
                                role="menu"
                                onClick={(event) => event.stopPropagation()}
                                className="absolute right-0 top-10 z-20 w-32 overflow-hidden rounded-md border bg-popover py-1 text-left text-popover-foreground shadow-sm dark:shadow-none"
                              >
                                {a.status === "PROSES" && (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      setOpenAsesmenOptionsId(null);
                                      setEditingAsesmen(a as AsesmenData);
                                    }}
                                    className={menuItem}
                                  >
                                    Edit
                                  </button>
                                )}
                                {a.status === "SELESAI" && (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      setOpenAsesmenOptionsId(null);
                                      setSendingAsesmen(a);
                                    }}
                                    className={menuItem}
                                  >
                                    Kirim ke
                                  </button>
                                )}
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenAsesmenOptionsId(null);
                                    void handleDeleteAsesmen(a.id);
                                  }}
                                  className={cn(menuItem, "text-danger")}
                                >
                                  Hapus
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-semibold">{a.judul}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="tabular-nums">{a._count?.soal ?? 0}</span> soal · oleh {a.guru?.nama}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      <ModalPengumuman
        open={showModalPengumuman || !!editingPengumuman}
        onClose={() => {
          setShowModalPengumuman(false);
          setEditingPengumuman(null);
        }}
        onSuccess={loadKelas}
        mode={editingPengumuman ? "edit" : "create"}
        initialData={editingPengumuman}
        kelasId={kelasId}
      />

      <Modal open={showContentChooser} onClose={() => setShowContentChooser(false)} title="Buat Konten">
        <p className="mb-4 text-sm text-muted-foreground">Pilih jenis konten untuk kelas ini.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setShowContentChooser(false);
              setShowModalPengumuman(true);
            }}
            className="cursor-pointer rounded-md border px-4 py-3 text-left transition-colors duration-150 hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="block text-sm font-semibold">Pengumuman</span>
            <span className="mt-1 block text-xs text-muted-foreground">Informasi dan lampiran kelas</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowContentChooser(false);
              setEditingMateri(null);
              setShowModalMateri(true);
            }}
            className="cursor-pointer rounded-md border px-4 py-3 text-left transition-colors duration-150 hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="block text-sm font-semibold">Materi</span>
            <span className="mt-1 block text-xs text-muted-foreground">Tautan atau file pembelajaran</span>
          </button>
        </div>
      </Modal>

      <ModalMateri
        open={showModalMateri || !!editingMateri}
        onClose={() => {
          setShowModalMateri(false);
          setEditingMateri(null);
        }}
        onSuccess={loadKelas}
        mode={editingMateri ? "edit" : "create"}
        initialData={editingMateri}
        defaultKelasId={kelasId}
      />

      <ModalBuatAsesmen
        open={showModalAsesmen}
        onClose={() => setShowModalAsesmen(false)}
        onSuccess={handleAsesmenSuccess}
        defaultKelasId={kelasId}
        fixedTipe={asesmenFixedTipe}
      />

      <ModalTugas
        open={showModalTugas}
        onClose={() => setShowModalTugas(false)}
        onSuccess={loadKelas}
        mode={editingTugas ? "edit" : "create"}
        initialData={editingTugas as any}
        defaultKelasId={kelasId}
      />
      <ModalEditAsesmen
        open={!!editingAsesmen}
        onClose={() => setEditingAsesmen(null)}
        onSuccess={loadKelas}
        initialData={editingAsesmen ? { ...editingAsesmen, mapelId: editingAsesmen.mapelId ?? editingAsesmen.mapel?.id ?? null } : null}
      />
      <ModalKirimTugas
        open={!!sendingTugas}
        tugasId={sendingTugas?.id ?? null}
        onClose={() => setSendingTugas(null)}
        onSuccess={() => {
          setSendingTugas(null);
          loadKelas();
        }}
      />
      <ModalKirimAsesmen
        open={!!sendingAsesmen}
        asesmenId={sendingAsesmen?.id ?? null}
        onClose={() => setSendingAsesmen(null)}
        onSuccess={() => {
          setSendingAsesmen(null);
          loadKelas();
        }}
      />
      <ModalKirimPengumuman
        open={!!sendingPengumuman}
        pengumumanId={sendingPengumuman?.id ?? null}
        onClose={() => setSendingPengumuman(null)}
        onSuccess={() => {
          setSendingPengumuman(null);
          loadKelas();
        }}
      />
    </div>
  );
}