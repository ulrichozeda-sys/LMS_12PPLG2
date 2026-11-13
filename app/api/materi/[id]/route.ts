import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, TEACHER_TIER } from "@/lib/rbac";

const TIPE_MATERI = ["LINK", "FILE"] as const;
const LEGACY_TIPE_MATERI = ["PDF", "FOTO"] as const;

function isValidUrlForType(tipe: string, url: string) {
  if (tipe === "LINK") {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  return url.startsWith("/uploads/materi/");
}

function parseKelasIds(value: unknown) {
  const ids: string[] = [];
  if (Array.isArray(value)) {
    for (const kelasId of value) {
      if (typeof kelasId === "string") ids.push(kelasId);
    }
  }
  return [...new Set(ids)];
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = requireRole(await getSession(), ["GURU", "SUPER_ADMIN"]);
    const { id } = await params;
    const materi = await db.materi.findUnique({
      where: { id },
      include: { kelasTujuan: { include: { kelas: { select: { id: true, judul: true } } } } },
    });
    if (!materi) return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    if (session.role === "GURU" && materi.guruId !== session.userId) {
      return NextResponse.json({ error: "Bukan materi milik anda." }, { status: 403 });
    }
    return NextResponse.json({ data: materi });
  } catch (error: unknown) {
    const name = error instanceof Error ? error.name : "";
    const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// PATCH /api/materi/[id] -> edit materi
// body: { judul?, url?, deskripsi?, kelasIds? } -> kelasIds kalau dikirim, replace semua assignment lama
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = requireRole(await getSession(), TEACHER_TIER);

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const judul = typeof body?.judul === "string" ? body.judul.trim() : undefined;
    const url = typeof body?.url === "string" ? body.url.trim() : undefined;
    const deskripsi = body?.deskripsi;
    const tipe = typeof body?.tipe === "string" ? body.tipe : undefined;
    const kelasIds = Array.isArray(body?.kelasIds) ? parseKelasIds(body.kelasIds) : undefined;

    const existing = await db.materi.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    if (session.role === "GURU" && existing.guruId !== session.userId) {
      return NextResponse.json({ error: "Bukan materi milik anda." }, { status: 403 });
    }

    const nextTipe = tipe ?? existing.tipe;
    const nextUrl = url ?? existing.url;
    const typeValid = tipe
      ? TIPE_MATERI.includes(nextTipe as (typeof TIPE_MATERI)[number])
      : TIPE_MATERI.includes(nextTipe as (typeof TIPE_MATERI)[number]) ||
        LEGACY_TIPE_MATERI.includes(nextTipe as (typeof LEGACY_TIPE_MATERI)[number]);
    if (!typeValid || !isValidUrlForType(nextTipe, nextUrl)) {
      return NextResponse.json({ error: "Tipe atau URL sumber materi tidak valid." }, { status: 400 });
    }
    if (kelasIds && session.role === "GURU") {
      const kelasDiampu = kelasIds.length === 0 ? [] : await db.kelasGuruMapel.findMany({
        where: { guruId: session.userId, kelasId: { in: kelasIds } },
        select: { kelasId: true },
      });
      if (kelasDiampu.length !== kelasIds.length) {
        return NextResponse.json({ error: "Materi hanya dapat dibagikan ke kelas yang Anda ajar." }, { status: 403 });
      }
    }

    const updated = await db.$transaction(async (tx) => {
      const materi = await tx.materi.update({
        where: { id },
        data: {
          judul: judul || undefined,
          tipe: tipe || undefined,
          url: url || undefined,
          deskripsi: deskripsi !== undefined ? deskripsi || null : undefined,
        },
      });

      if (kelasIds) {
        await tx.materiKelas.deleteMany({ where: { materiId: id } });
        if (kelasIds.length > 0) {
          await tx.materiKelas.createMany({
            data: kelasIds.map((kelasId: string) => ({ materiId: id, kelasId })),
          });
        }
      }

      return materi;
    });

    return NextResponse.json({ message: "Materi berhasil diperbarui.", data: updated });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

// DELETE /api/materi/[id] -> hapus materi
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = requireRole(await getSession(), TEACHER_TIER);

    const { id } = await params;
    const existing = await db.materi.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    if (session.role === "GURU" && existing.guruId !== session.userId) {
      return NextResponse.json({ error: "Bukan materi milik anda." }, { status: 403 });
    }

    await db.$transaction([
      db.materiKelas.deleteMany({ where: { materiId: id } }),
      db.materi.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Materi berhasil dihapus." });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}