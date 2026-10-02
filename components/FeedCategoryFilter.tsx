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
    <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" aria-label="Filter aktivitas kelas">
      {CATEGORIES.map((category) => (
        <button
          key={category.value}
          type="button"
          aria-pressed={value === category.value}
          onClick={() => onChange(category.value)}
          className={`min-h-10 border px-3 py-2 text-left text-xs font-semibold sm:text-center ${
            value === category.value
              ? "border-[#008C91] bg-[#E6FAFA] text-[#006F73]"
              : "border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}