import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { ids } = await req.json();
  if (!Array.isArray(ids) || !ids.length) return new NextResponse('ids required', { status: 400 });

  // 학생 삭제 → attend/notify는 onDelete cascade 아님. 참조 정리
  await prisma.attendSession.deleteMany({ where: { studentId: { in: ids } } });
  await prisma.notifyLog.deleteMany({ where: { studentId: { in: ids } } });
  await prisma.student.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ ok:true, count: ids.length });
}
