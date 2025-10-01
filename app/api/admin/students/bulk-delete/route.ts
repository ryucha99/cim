import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BulkDeleteBody = { ids: string[] };

function errorJson(status: number, err: unknown) {
  const message = err instanceof Error ? err.message : 'server';
  return NextResponse.json({ error: 'SERVER_ERROR', message }, { status });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<BulkDeleteBody>;
    const ids = Array.isArray(body.ids) ? body.ids : [];
    if (!ids.length) {
      return NextResponse.json({ error: 'INVALID_INPUT', message: 'ids required' }, { status: 400 });
    }

    await prisma.attendSession.deleteMany({ where: { studentId: { in: ids } } });
    await prisma.notifyLog.deleteMany({ where: { studentId: { in: ids } } });
    await prisma.student.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({ ok: true, count: ids.length });
  } catch (e: unknown) {
    console.error('[POST /students/bulk-delete]', e);
    return errorJson(500, e);
  }
}
