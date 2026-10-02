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
    <section className="border-b border-[#DCE3E8] pb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-[#64748B]">Ruang kelas</p>
          <h1 className="mt-1 break-words text-2xl font-bold text-[#111827]">{title}</h1>
          {description && <p className="mt-2 max-w-2xl whitespace-pre-wrap break-words text-sm leading-6 text-[#475569]">{description}</p>}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {inviteToken && onCopyInvite && (
            <div className="min-w-0 border border-[#DCE3E8] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase text-[#64748B]">Kode kelas</p>
              <p className="break-all text-sm font-bold text-[#111827]">{inviteToken}</p>
              <button type="button" onClick={onCopyInvite} className="mt-1 text-xs font-semibold text-[#008C91] hover:underline">
                {copied ? "Tersalin" : "Salin link undangan"}
              </button>
            </div>
          )}
          {onEdit && <Button size="sm" variant="outline" onClick={onEdit}>Edit kelas</Button>}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="border-l-2 border-[#00A6AB] pl-3">
          <p className="text-lg font-bold text-[#111827]">{studentCount}</p>
          <p className="text-xs text-[#64748B]">Siswa terdaftar</p>
        </div>
        <div className="border-l-2 border-[#7B8794] pl-3">
          <p className="text-lg font-bold text-[#111827]">{teacherCount}</p>
          <p className="text-xs text-[#64748B]">Guru pengajar</p>
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
          className={`flex min-h-12 min-w-0 items-center justify-between gap-2 border px-3 py-2 text-left text-sm font-semibold ${
            section === item.key ? "border-[#008C91] bg-[#E6FAFA] text-[#006F73]" : "border-[#DCE3E8] bg-white text-[#334155] hover:bg-[#F8FAFC]"
          }`}
        >
          <span>{item.label}</span>
          <span className="shrink-0 text-xs">{item.count}</span>
        </button>
      ))}
    </nav>
  );
}