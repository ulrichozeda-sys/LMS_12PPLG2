import Link from "next/link";
import {
  ChartColumn,
  BookOpen,
  ClipboardCheck,
  ListChecks,
  Megaphone,
  Users,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SiteFooter } from "@/components/shared/site-footer";

const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";

const primaryLink =
  "inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground " +
  "transition-colors duration-150 hover:bg-brand/90 outline-none " +
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const outlineLink =
  "inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium " +
  "transition-colors duration-150 hover:bg-accent outline-none " +
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const FEATURES = [
  {
    Icon: BookOpen,
    title: "Kelas dan materi",
    text: "Guru membagikan materi, siswa membukanya kapan saja dari kelas masing-masing.",
  },
  {
    Icon: Megaphone,
    title: "Pengumuman",
    text: "Informasi penting kelas sampai ke siswa lewat satu tempat yang sama.",
  },
  {
    Icon: ClipboardCheck,
    title: "Tugas",
    text: "Guru memberi tugas, siswa mengumpulkan jawaban, lalu guru menilainya.",
  },
  {
    Icon: ListChecks,
    title: "Kuis dan ujian",
    text: "Asesmen dikerjakan online dan hasilnya langsung bisa dinilai oleh guru.",
  },
  {
    Icon: ChartColumn,
    title: "Nilai dan performa",
    text: "Siswa memantau performa akademiknya, guru melihat rekap nilai kelas.",
  },
  {
    Icon: Users,
    title: "Akun dan peran",
    text: "Setiap pengguna mendapat akses sesuai perannya di sekolah.",
  },
];

const ROLES = [
  {
    name: "Guru",
    text: "Mengelola kelas, membagikan materi dan pengumuman, memberi tugas atau kuis/ujian, lalu menilai jawaban.",
  },
  {
    name: "Siswa",
    text: "Melihat materi, mengerjakan asesmen, mengumpulkan tugas, dan memantau performa akademik.",
  },
  { name: "Admin", text: "Mengelola akun pengguna di sekolah." },
  {
    name: "Kepala sekolah",
    text: "Memantau kelas dan hasil belajar sesuai perannya.",
  },
  {
    name: "Kurikulum",
    text: "Memantau kelas dan hasil belajar sesuai perannya.",
  },
];

function Dot({ tone }: { tone: "brand" | "muted" }) {
  return (
    <span
      aria-hidden="true"
      className={`size-1.5 rounded-full ${tone === "brand" ? "bg-brand" : "bg-foreground/30"}`}
    />
  );
}

function ProductPreview() {
  const rows = [
    { type: "Tugas", title: "Laporan Praktikum Gerak Lurus", status: "Dikumpulkan", tone: "brand" as const },
    { type: "Kuis", title: "Kuis Hukum Newton", status: "Berlangsung", tone: "brand" as const },
    { type: "Ujian", title: "Ujian Tengah Semester", status: "Terjadwal", tone: "muted" as const },
  ];

  return (
    <div
      aria-hidden="true"
      className="select-none rounded-lg border bg-card text-card-foreground"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-medium">Fisika XI IPA 2</p>
          <p className="text-xs text-muted-foreground">Contoh tampilan kelas</p>
        </div>
        <span className="rounded-sm border px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
          FIS-XI2
        </span>
      </div>

      <ul className="divide-y">
        {rows.map((r) => (
          <li
            key={r.title}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{r.type}</p>
              <p className="truncate text-sm font-medium">{r.title}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs">
              <Dot tone={r.tone} />
              {r.status}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-t bg-muted px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Jawaban dinilai</span>
          <span className="font-medium tabular-nums">18 / 24</span>
        </div>
        <div className="mt-2 h-1.5 rounded-sm bg-foreground/10">
          <div className="h-full w-3/4 rounded-sm bg-brand" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className={`${container} flex h-14 items-center justify-between`}>
          <Link
            href="/"
            aria-label="MyClass, beranda"
            className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Logo />
          </Link>

          <nav aria-label="Navigasi utama" className="hidden items-center gap-6 md:flex">
            <Link href="#tentang" className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground">
              Tentang
            </Link>
            <Link href="#fitur" className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground">
              Fitur
            </Link>
            <Link href="#peran" className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground">
              Peran
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className={primaryLink}>
              Login
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className={`${container} grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20`}>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs text-muted-foreground">
              <Dot tone="brand" />
              Learning Management System untuk sekolah
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Ayo Belajar Lebih Cerdas Bersama MyClass
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground">
              Platform pembelajaran digital yang membantu guru dan siswa belajar,
              mengajar, dan berkembang dalam satu tempat.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className={primaryLink}>
                Login
              </Link>
              <Link href="#tentang" className={outlineLink}>
                Pelajari MyClass
              </Link>
            </div>
          </div>

          <ProductPreview />
        </section>

        {/* TENTANG */}
        <section id="tentang" className="scroll-mt-14 border-t">
          <div className={`${container} grid gap-6 py-12 lg:grid-cols-[1fr_2fr] lg:gap-10`}>
            <h2 className="text-xl font-semibold tracking-tight">Apa itu MyClass?</h2>
            <div className="max-w-2xl space-y-3 text-sm text-muted-foreground">
              <p>
                MyClass adalah website Learning Management System (LMS) untuk
                mengatur kegiatan belajar sekolah secara online. Guru dan siswa
                mengelola kelas dan kegiatan belajar dalam satu platform.
              </p>
              <p>
                MyClass bukan sekadar tempat video call. Fokusnya ada pada
                pengelolaan kelas, tugas, asesmen, dan nilai.
              </p>
            </div>
          </div>
        </section>

        {/* FITUR */}
        <section id="fitur" className="scroll-mt-14 border-t">
          <div className={`${container} py-12`}>
            <h2 className="text-xl font-semibold tracking-tight">
              Yang bisa dilakukan di MyClass
            </h2>
            <div className="mt-6 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ Icon, title, text }) => (
                <div key={title} className="bg-background p-5">
                  <Icon className="size-4 text-foreground" strokeWidth={1.75} aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PERAN */}
        <section id="peran" className="scroll-mt-14 border-t">
          <div className={`${container} grid gap-6 py-12 lg:grid-cols-[1fr_2fr] lg:gap-10`}>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Satu platform, lima peran
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Akses disesuaikan dengan peran masing-masing pengguna.
              </p>
            </div>
            <dl className="divide-y rounded-lg border">
              {ROLES.map((r) => (
                <div key={r.name} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                  <dt className="text-sm font-medium">{r.name}</dt>
                  <dd className="text-sm text-muted-foreground">{r.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t">
          <div className={`${container} flex flex-col gap-4 py-12 sm:flex-row sm:items-center sm:justify-between`}>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Sudah punya akun?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Masuk dengan akun yang diberikan sekolah.
              </p>
            </div>
            <Link href="/login" className={primaryLink}>
              Login
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}