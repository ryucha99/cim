import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await prisma.student.findMany({
      orderBy: [{ name: 'asc' }],
      select: { id: true, name: true, grade: true, className: true }
    });
    return NextResponse.json(list);
  } catch (e:any) {
    console.error('[GET /api/admin/students]', e);
    return NextResponse.json({ error: 'SERVER_ERROR', message: e?.message || 'server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, grade, className, guardianName, phoneFull } = body || {};

    if (!name || !guardianName || !phoneFull) {
      return NextResponse.json({ error: 'INVALID_INPUT', message: '필수값 누락' }, { status: 400 });
    }

    const digits = String(phoneFull).replace(/\D/g, '');
    if (digits.length < 4) {
      return NextResponse.json({ error: 'INVALID_PHONE', message: '전화번호는 숫자 4자리 이상이어야 합니다.' }, { status: 400 });
    }
    const last4 = digits.slice(-4);

    // upsert: phoneFull이 @unique여야 타입 OK (안되면 find/update 분기로 변경)
    const existing = await prisma.guardian.findFirst({ where: { phoneFull } });
    const guardian = existing
      ? await prisma.guardian.update({
          where: { id: existing.id },
          data: { name: guardianName, phoneLast4: last4 },
        })
      : await prisma.guardian.create({
          data: { name: guardianName, phoneFull, phoneLast4: last4 },
        });

    const student = await prisma.student.create({
      data: {
        name,
        grade: grade ? Number(grade) : null,
        className: className || null,
        guardians: { connect: { id: guardian.id } }
      }
    });

    return NextResponse.json({ ok: true, studentId: student.id });
  } catch (e:any) {
    console.error('[POST /api/admin/students]', e);
    return NextResponse.json({ error: 'SERVER_ERROR', message: e?.message || 'server' }, { status: 500 });
  }
}
