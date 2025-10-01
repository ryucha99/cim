import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nowKST, fmtKST } from '@/lib/time';
import { sendNotify } from '@/lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // ✅ 중복 선언 방지: body → last4로 한 번만 추출
    const body = (await req.json()) as { last4?: string };
    const last4 = body?.last4 ?? '';

    if (!/^\d{4}$/.test(last4)) {
      return NextResponse.json({ error: 'INVALID_LAST4' }, { status: 400 });
    }

    // 보호자 → 학생 매칭 (1차: 첫 학생 사용)
    const guardian = await prisma.guardian.findFirst({
      where: {
        phoneLast4: last4,
        students: { some: {} },      // ✅ 최소 1명 연결된 가디언만
      },
      include: { students: true },
    });
    if (!guardian || guardian.students.length === 0) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    const student = guardian.students[0];

    // 오늘(KST) 범위
    const now = nowKST().toDate();
    const dayStart = nowKST().startOf('day').toDate();
    const dayEnd = nowKST().endOf('day').toDate();

    // 오늘 세션 조회
    const todaySessions = await prisma.attendSession.findMany({
      where: { studentId: student.id, checkInAt: { gte: dayStart, lte: dayEnd } },
      orderBy: { checkInAt: 'asc' },
    });

    let type: 'IN' | 'OUT';
    let sessionId: string;

    if (todaySessions.length === 0) {
      // 첫 입력 → 등원
      const created = await prisma.attendSession.create({
        data: { studentId: student.id, checkInAt: now },
      });
      type = 'IN';
      sessionId = created.id;
    } else if (todaySessions.length === 1 && !todaySessions[0].checkOutAt) {
      // 두 번째 입력 → 하원
      const updated = await prisma.attendSession.update({
        where: { id: todaySessions[0].id },
        data: { checkOutAt: now },
      });
      type = 'OUT';
      sessionId = updated.id;
    } else {
      // 세 번째부터 → 이미 하원
      return NextResponse.json(
        { error: 'ALREADY_CHECKED_OUT', message: '이미 하원하였습니다.' },
        { status: 409 }
      );
    }

    // 알림 발송 (실패해도 출결은 성공 처리)
    const whenText = fmtKST(now, 'YYYY-MM-DD HH:mm');
    try {
      await sendNotify({
        studentId: student.id,
        studentName: student.name,
        toPhone: guardian.phoneFull,
        type,
        whenText,
      });
    } catch (e) {
      console.error('[notify error]', e);
    }

    return NextResponse.json({
      ok: true,
      type,
      sessionId,
      student: { id: student.id, name: student.name },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
