import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: 'INVALID_INPUT', message: 'ids required' }, { status: 400 });
    }
    await prisma.attendSession.deleteMany({ where: { studentId: { in: ids } } });
    await prisma.notifyLog.deleteMany({ where: { studentId: { in: ids } } });
    await prisma.student.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ ok: true, count: ids.length });
  } catch (e:any) {
    console.error('[POST /students/bulk-delete]', e);
    return NextResponse.json({ error: 'SERVER_ERROR', message: e?.message || 'server' }, { status: 500 });
  }
}
