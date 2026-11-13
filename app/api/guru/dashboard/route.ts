import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, TEACHER_TIER } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await getSession();
    requireRole(session, TEACHER_TIER);
    const guruId = session!.userId;
    const guruFilter = session!.role === "SUPER_ADMIN" ? undefined : guruId;

    const [kelas, asesmen, tugas, submissionDinilai, essayBelumDinilai, tugasDikumpulkan, asesmenTerbaru, tugasTerbaru] = await Promise.all([
      db.kelas.findMany({
        where: guruFilter ? { guruMapel: { some: { guruId } } } : undefined,
        select: { id: true, judul: true, _count: { select: { siswa: true } } },
        orderBy: { createdAt: "asc" },
      }),
      db.asesmen.count({ where: { guruId: guruFilter } }),
      db.tugas.count({ where: { guruId: guruFilter } }),
      db.submission.count({ where: { asesmen: { guruId: guruFilter }, status: "SUDAH", nilaiAkhir: { not: null }, ...(session!.role === "SUPER_ADMIN" ? {} : { siswa: { role: { not: "SUPER_ADMIN" } } }) } }),
      db.jawabanSiswa.count({ where: { soal: { asesmen: { guruId: guruFilter }, tipe: "ESSAY" }, nilaiSoal: null, submission: { status: "SUDAH", ...(session!.role === "SUPER_ADMIN" ? {} : { siswa: { role: { not: "SUPER_ADMIN" } } }) } } }),
      db.tugasSubmission.count({ where: { tugas: { guruId: guruFilter }, status: "SUDAH", ...(session!.role === "SUPER_ADMIN" ? {} : { siswa: { role: { not: "SUPER_ADMIN" } } }) } }),
      db.asesmen.findMany({ where: { guruId: guruFilter }, select: { id: true, judul: true, tipe: true, status: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 5 }),
      db.tugas.findMany({ where: { guruId: guruFilter }, select: { id: true, judul: true, createdAt: true, _count: { select: { submission: session!.role === "SUPER_ADMIN" ? true : { where: { siswa: { role: { not: "SUPER_ADMIN" } } } } } } }, orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

    const siswaIds = await db.kelasSiswa.findMany({
      where: { kelasId: { in: kelas.map((item) => item.id) } },
      select: { siswaId: true },
      distinct: ["siswaId"],
    });

    return NextResponse.json({ data: {
      statistik: { totalKelas: kelas.length, totalSiswa: siswaIds.length, totalAsesmen: asesmen, totalTugas: tugas, submissionDinilai, essayBelumDinilai, tugasDikumpulkan },
      kelas,
      asesmenTerbaru,
      tugasTerbaru,
    } });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
