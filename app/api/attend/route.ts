import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nowKST, fmtKST } from '@/lib/time';
import { sendNotify } from '@/lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { last4 } = await req.json() as { last4?: string };
    if (!last4 || !/^\d{4}$/.test(last4)) {
      return NextResponse.json({ error: 'INVALID_LAST4' }, { status: 400 });
    }

    const guardian = await prisma.guardian.findFirst({
      where: { phoneLast4: last4 },
      include: { students: true }
    });
    if (!guardian || guardian.students.length === 0) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    // 1차 버전: 첫 학생으로 고정(중복 처리 UI는 추후)
    const student = guardian.students[0];

    const now = nowKST().toDate();
    const dayStart = nowKST().startOf('day').toDate();
    const dayEnd   = nowKST().endOf('day').toDate();

    const open = await prisma.attendSession.findFirst({
      where: { studentId: student.id, checkInAt: { gte: dayStart, lte: dayEnd }, checkOutAt: null },
      orderBy: { checkInAt: 'desc' }
    });

    let type: 'IN'|'OUT'; let sessionId: string;
    if (!open) {
      const created = await prisma.attendSession.create({ data: { studentId: student.id, checkInAt: now } });
      type = 'IN'; sessionId = created.id;
    } else {
      const updated = await prisma.attendSession.update({ where: { id: open.id }, data: { checkOutAt: now } });
      type = 'OUT'; sessionId = updated.id;
    }

    const whenText = fmtKST(now, 'YYYY-MM-DD HH:mm');
    await sendNotify({
      studentId: student.id,
      studentName: student.name,
      toPhone: guardian.phoneFull,
      type,
      whenText
    });

    return NextResponse.json({ ok: true, type, sessionId, student: { id: student.id, name: student.name } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
