import Button from "@/components/ui/Button";

export type ClassDirectorySection = "SISWA" | "GURU" | null;

export function ClassDetailOverview({
  title,
  description,
  studentCount,
  teacherCount,
  inviteToken,
  copied,
  onCopyInvite,
  onEdit,
}: {
  title: string;
  description: string | null;
  studentCount: number;
  teacherCount: number;
  inviteToken?: string;
  copied?: boolean;
  onCopyInvite?: () => void;
  onEdit?: () => void;
}) {
  return (
    <section className="border-b border-border pb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ruang kelas</p>
          <h1 className="mt-1 break-words text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {inviteToken && onCopyInvite && (
            <div className="min-w-0 rounded-md border border-border px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Kode kelas</p>
              <p className="break-all font-mono text-sm font-semibold">{inviteToken}</p>
              <button type="button" onClick={onCopyInvite} className="mt-1 min-h-10 text-left text-xs font-medium text-foreground underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {copied ? "Tersalin" : "Salin link undangan"}
              </button>
            </div>
          )}
          {onEdit && <Button size="sm" variant="outline" onClick={onEdit}>Edit kelas</Button>}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="border-l-2 border-brand pl-3">
          <p className="text-lg font-semibold tabular-nums">{studentCount}</p>
          <p className="text-xs text-muted-foreground">Siswa terdaftar</p>
        </div>
        <div className="border-l-2 border-border pl-3">
          <p className="text-lg font-semibold tabular-nums">{teacherCount}</p>
          <p className="text-xs text-muted-foreground">Guru pengajar</p>
        </div>
      </div>
    </section>
  );
}

export function ClassDirectoryNavigation({
  section,
  onChange,
  studentCount,
  teacherCount,
}: {
  section: ClassDirectorySection;
  onChange: (section: ClassDirectorySection) => void;
  studentCount: number;
  teacherCount: number;
}) {
  const items = [
    { key: "SISWA" as const, label: "Daftar siswa", count: studentCount },
    { key: "GURU" as const, label: "Daftar guru", count: teacherCount },
  ];

  return (
    <nav aria-label="Daftar warga kelas" className="mt-5 grid grid-cols-2 gap-2 sm:max-w-md">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          aria-pressed={section === item.key}
          onClick={() => onChange(section === item.key ? null : item.key)}
          className={`flex min-h-12 min-w-0 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            section === item.key ? "border-transparent bg-brand text-brand-foreground" : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <span>{item.label}</span>
          <span className="shrink-0 text-xs">{item.count}</span>
        </button>
      ))}
    </nav>
  );
}