import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nowKST, fmtKST } from '@/lib/time';
import { sendNotify } from '@/lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { last4 } = (await req.json()) as { last4?: string };
    if (!last4 || !/^\d{4}$/.test(last4)) {
      return NextResponse.json({ error: 'INVALID_LAST4' }, { status: 400 });
    }

    // 1) 보호자 → 학생 매칭 (1차 버전: 첫 학생 고정)
    const guardian = await prisma.guardian.findFirst({
      where: { phoneLast4: last4 },
      include: { students: true },
    });
    if (!guardian || guardian.students.length === 0) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    const student = guardian.students[0];

    // 2) 오늘 범위(KST)
    const now = nowKST().toDate();
    const dayStart = nowKST().startOf('day').toDate();
    const dayEnd = nowKST().endOf('day').toDate();

    // 3) 오늘 세션 조회 (가장 이른 것 1개만 봐도 되지만, 명시적으로 정렬)
    const todaySessions = await prisma.attendSession.findMany({
      where: {
        studentId: student.id,
        checkInAt: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { checkInAt: 'asc' },
    });

    let type: 'IN' | 'OUT';
    let sessionId: string | undefined;

    if (todaySessions.length === 0) {
      // 첫 입력 → 등원
      const created = await prisma.attendSession.create({
        data: { studentId: student.id, checkInAt: now },
      });
      type = 'IN';
      sessionId = created.id;
    } else if (todaySessions.length === 1 && !todaySessions[0].checkOutAt) {
      // 두 번째 입력 → 하원 (첫 세션의 checkOutAt 채움)
      const updated = await prisma.attendSession.update({
        where: { id: todaySessions[0].id },
        data: { checkOutAt: now },
      });
      type = 'OUT';
      sessionId = updated.id;
    } else {
      // 세 번째부터 또는 이미 하원까지 완료된 상태에서 또 입력 → 에러
      return NextResponse.json(
        { error: 'ALREADY_CHECKED_OUT', type: 'ERR', message: '이미 하원하였습니다.' },
        { status: 409 },
      );
    }

    // 4) 알림 발송 (알림톡 → 실패 시 SMS 폴백)
    const whenText = fmtKST(now, 'YYYY-MM-DD HH:mm');
    try {
      await sendNotify({
        studentId: student.id,
        studentName: student.name,
        toPhone: guardian.phoneFull, // 보호자 번호로 발송
        type,
        whenText,
      });
    } catch (e) {
      // 알림 실패해도 출결은 성공 처리. 필요 시 로깅 유지
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
