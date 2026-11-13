import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = requireRole(await getSession(), ["GURU", "SUPER_ADMIN"]);
    const { id: materiId } = await params;
    const body = await req.json().catch(() => null);
    const kelasIdSet = new Set<string>();
    if (Array.isArray(body?.kelasIds)) {
      for (const kelasId of body.kelasIds) {
        if (typeof kelasId === "string" && kelasId.length > 0) kelasIdSet.add(kelasId);
      }
    }
    const kelasIds = [...kelasIdSet];

    if (kelasIds.length === 0) {
      return NextResponse.json({ error: "Pilih minimal 1 kelas tujuan." }, { status: 400 });
    }

    const materi = await db.materi.findUnique({
      where: { id: materiId },
      select: { id: true, guruId: true },
    });
    if (!materi) return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    if (session.role === "GURU" && materi.guruId !== session.userId) {
      return NextResponse.json({ error: "Bukan materi milik anda." }, { status: 403 });
    }

    const kelasValid = await db.kelas.findMany({
      where: { id: { in: kelasIds } },
      select: { id: true },
    });
    if (kelasValid.length !== kelasIds.length) {
      return NextResponse.json({ error: "Satu atau lebih kelas tidak ditemukan." }, { status: 400 });
    }

    if (session.role === "GURU") {
      const kelasDiampu = await db.kelasGuruMapel.findMany({
        where: { guruId: session.userId, kelasId: { in: kelasIds } },
        select: { kelasId: true },
      });
      if (kelasDiampu.length !== kelasIds.length) {
        return NextResponse.json({ error: "Materi hanya dapat dikirim ke kelas yang Anda ajar." }, { status: 403 });
      }
    }

    const existing = await db.materiKelas.findMany({
      where: { materiId, kelasId: { in: kelasIds } },
      select: { kelasId: true },
    });
    const existingIds = new Set(existing.map((item) => item.kelasId));
    const newKelasIds = kelasIds.filter((id: string) => !existingIds.has(id));
    const result = newKelasIds.length > 0
      ? await db.materiKelas.createMany({
          data: newKelasIds.map((kelasId: string) => ({ materiId, kelasId })),
          skipDuplicates: true,
        })
      : { count: 0 };

    return NextResponse.json({
      message: result.count > 0 ? "Materi berhasil dikirim ke kelas." : "Materi sudah dibagikan ke kelas yang dipilih.",
      data: { added: result.count },
    });
  } catch (error: unknown) {
    const name = error instanceof Error ? error.name : "";
    const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
