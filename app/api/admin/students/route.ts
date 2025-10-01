import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type StudentCreateBody = {
  name: string;
  grade?: number | string | null;
  className?: string | null;
  guardianName: string;
  phoneFull: string;
};

function errorJson(status: number, err: unknown) {
  const message = err instanceof Error ? err.message : 'server';
  return NextResponse.json({ error: 'SERVER_ERROR', message }, { status });
}

export async function GET() {
  try {
    const list = await prisma.student.findMany({
      orderBy: [{ name: 'asc' }],
      select: { id: true, name: true, grade: true, className: true },
    });
    return NextResponse.json(list);
  } catch (e: unknown) {
    console.error('[GET /api/admin/students]', e);
    return errorJson(500, e);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<StudentCreateBody>;
    const { name, grade, className, guardianName, phoneFull } = body;

    if (!name || !guardianName || !phoneFull) {
      return NextResponse.json({ error: 'INVALID_INPUT', message: '필수값 누락' }, { status: 400 });
    }

    // POST 내부
    const raw = String(phoneFull);
    const digitsOnly = raw.replace(/\D/g, '');     // 숫자만
    if (digitsOnly.length < 10) {
      return NextResponse.json({ error:'INVALID_PHONE', message:'휴대폰 번호를 정확히 입력해주세요.' }, { status:400 });
    }
    const normalizedFull = digitsOnly;             // 저장은 숫자만
    const last4 = normalizedFull.slice(-4);

    // guardian 고유키는 phoneFull(숫자만)로 통일
    const existing = await prisma.guardian.findFirst({ where: { phoneFull: normalizedFull } });
    const guardian = existing
      ? await prisma.guardian.update({
          where: { id: existing.id },
          data: { name: guardianName, phoneLast4: last4 },
        })
      : await prisma.guardian.create({
          data: { name: guardianName, phoneFull: normalizedFull, phoneLast4: last4 },
        });

    const student = await prisma.student.create({
      data: {
        name,
        grade: grade == null || grade === '' ? null : Number(grade),
        className: className ?? null,
        guardians: { connect: { id: guardian.id } }
      }
    });


    return NextResponse.json({ ok: true, studentId: student.id });
  } catch (e: unknown) {
    console.error('[POST /api/admin/students]', e);
    return errorJson(500, e);
  }
}
