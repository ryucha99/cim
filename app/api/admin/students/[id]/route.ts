// app/api/admin/students/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ParamCtx = { params: Promise<{ id: string }> };

type StudentPatchBody = {
  name?: string;
  grade?: number | string | null;
  className?: string | null;
};

function errorJson(status: number, err: unknown) {
  const message = err instanceof Error ? err.message : 'server';
  return NextResponse.json({ error: 'SERVER_ERROR', message }, { status });
}

export async function GET(_req: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = await params; // ← 여기!
    const s = await prisma.student.findUnique({ where: { id } });
    if (!s) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json(s);
  } catch (e: unknown) {
    console.error('[GET /students/:id]', e);
    return errorJson(500, e);
  }
}

export async function PATCH(req: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = await params; // ← 여기!
    const body = (await req.json()) as Partial<StudentPatchBody>;
    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.grade !== undefined
          ? { grade: body.grade === null || body.grade === '' ? null : Number(body.grade) }
          : {}),
        ...(body.className !== undefined ? { className: body.className } : {}),
      },
    });
    return NextResponse.json({ ok: true, student: { id: updated.id } });
  } catch (e: unknown) {
    console.error('[PATCH /students/:id]', e);
    return errorJson(500, e);
  }
}

export async function DELETE(_req: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = await params; // ← 여기!
    await prisma.attendSession.deleteMany({ where: { studentId: id } });
    await prisma.notifyLog.deleteMany({ where: { s
