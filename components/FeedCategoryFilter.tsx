export type FeedCategory = "SEMUA" | "PENGUMUMAN" | "MATERI" | "TUGAS" | "ASESMEN";

const CATEGORIES: { value: FeedCategory; label: string }[] = [
  { value: "SEMUA", label: "Semua" },
  { value: "PENGUMUMAN", label: "Pengumuman" },
  { value: "MATERI", label: "Materi" },
  { value: "TUGAS", label: "Tugas" },
  { value: "ASESMEN", label: "Asesmen" },
];

export default function FeedCategoryFilter({ value, onChange }: { value: FeedCategory; onChange: (value: FeedCategory) => void }) {
  return (
    <div role="group" className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" aria-label="Filter aktivitas kelas">
      {CATEGORIES.map((category) => (
        <button
          key={category.value}
          type="button"
          aria-pressed={value === category.value}
          onClick={() => onChange(category.value)}
          className={`min-h-10 rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-center ${
            value === category.value
              ? "border-transparent bg-brand text-brand-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}