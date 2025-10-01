import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string }}) {
  try {
    const s = await prisma.student.findUnique({ where: { id: params.id } });
    if (!s) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json(s);
  } catch (e:any) {
    console.error('[GET /students/:id]', e);
    return NextResponse.json({ error: 'SERVER_ERROR', message: e?.message || 'server' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string }}) {
  try {
    const body = await req.json();
    const { name, grade, className } = body || {};
    const s = await prisma.student.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(grade !== undefined ? { grade: grade === null ? null : Number(grade) } : {}),
        ...(className !== undefined ? { className } : {}),
      }
    });
    return NextResponse.json({ ok: true, student: { id: s.id } });
  } catch (e:any) {
    console.error('[PATCH /students/:id]', e);
    return NextResponse.json({ error: 'SERVER_ERROR', message: e?.message || 'server' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string }}) {
  try {
    await prisma.attendSession.deleteMany({ where: { studentId: params.id } });
    await prisma.notifyLog.deleteMany({ where: { studentId: params.id } });
    await prisma.student.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    console.error('[DELETE /students/:id]', e);
    return NextResponse.json({ error: 'SERVER_ERROR', message: e?.message || 'server' }, { status: 500 });
  }
}
