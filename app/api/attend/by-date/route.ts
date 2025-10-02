import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// YYYY-MM-DD → KST(Asia/Seoul) 00:00~24:00 구간을 UTC 타임스탬프로 산출
function kstRange(dateStr: string) {
  // "+09:00"으로 고정해 KST 기준 경계 생성
  const start = new Date(`${dateStr}T00:00:00+09:00`);
  const end = new Date(`${dateStr}T00:00:00+09:00`);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date');
    if (!date) {
      return new Response(JSON.stringify({ ok: false, error: 'missing date (YYYY-MM-DD)' }), { status: 400 });
    }

    const { start, end } = kstRange(date);

    // 해당 날짜 KST 범위의 모든 세션(등원/하원)
    const rows = await prisma.attendSession.findMany({
      where: { checkInAt: { gte: start, lt: end } },
      select: { studentId: true, checkInAt: true, checkOutAt: true },
      orderBy: [{ checkInAt: 'asc' }],
    });

    // 학생별 요약: 첫 등원시간, 마지막 하원시간
    const byStudent = new Map<string, { in?: Date; out?: Date }>();
    for (const r of rows) {
      const cur = byStudent.get(r.studentId) ?? {};
      if (!cur.in || r.checkInAt < cur.in) cur.in = r.checkInAt;
      if (r.checkOutAt && (!cur.out || r.checkOutAt > cur.out)) cur.out = r.checkOutAt;
      byStudent.set(r.studentId, cur);
    }

    const data: Record<string, { in?: string; out?: string }> = {};
    byStudent.forEach((v, k) => {
      data[k] = {
        in: v.in ? v.in.toISOString() : undefined,
        out: v.out ? v.out.toISOString() : undefined,
      };
    });

    return new Response(JSON.stringify({ ok: true, data }), { status: 200 });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'server';
      return new Response(JSON.stringify({ ok: false, error: message }), { status: 500 });
    }

}
