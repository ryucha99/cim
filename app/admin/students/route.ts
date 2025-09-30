import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const list = await prisma.student.findMany({
    orderBy: [{ name: 'asc' }],
    select: { id:true, name:true, grade:true, className:true }
  });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, grade, className, guardianName, phoneFull } = body || {};
  if (!name || !guardianName || !phoneFull) return new NextResponse('필수값 누락', { status: 400 });

  const digits = String(phoneFull).replace(/\D/g,'');
  const last4 = digits.slice(-4);
  const guardian = await prisma.guardian.upsert({
    where: { phoneFull },
    update: { name: guardianName, phoneLast4: last4 },
    create: { name: guardianName, phoneFull, phoneLast4: last4 }
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
}
