// app/api/admin/students/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ParamCtx = { params: Promise<{ id: string }> };

type StudentPatchBody = {
  name?: string;
  grade?: number | string | null;
  className?: string | null;
  guardianName?: string;
  phoneFull?: string;
};

function errorJson(status: number, err: unknown) {
  const message = err instanceof Error ? err.message : 'server';
  return NextResponse.json({ error: 'SERVER_ERROR', message }, { status });
}

export async function GET(_req: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = await params;
    const s = await prisma.student.findUnique({ where: { id } });
    if (!s) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json(s);
  } catch (e: unknown) {
    console.error('[GET /api/admin/students/:id]', e);
    return errorJson(500, e);
  }
}

export async function PATCH(req: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = await params;
    const body = (await req.json()) as Partial<StudentPatchBody>;

    // 1) 학생 기본 정보 수정
    await prisma.student.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.grade !== undefined
          ? { grade: body.grade === null || body.grade === '' ? null : Number(body.grade) }
          : {}),
        ...(body.className !== undefined ? { className: body.className } : {}),
      },
    });

    // 2) 보호자 정보 수정 (옵션)
    if (body.guardianName !== undefined || body.phoneFull !== undefined) {
      const stu = await prisma.student.findUnique({
        where: { id },
        include: { guardians: true },
      });

      const targetGuardian = stu?.guardians?.[0]; // 1차 버전: 첫 보호자만 관리
      const raw = String(body.phoneFull ?? (targetGuardian?.phoneFull ?? ''));
      const digitsOnly = raw.replace(/\D/g, '');
      const normalizedFull = digitsOnly;
      const last4 = normalizedFull ? normalizedFull.slice(-4) : targetGuardian?.phoneLast4 ?? '';

      if (targetGuardian) {
        // 직접 업데이트 (전화번호 유니크 충돌 시, 해당 번호의 guardian으로 재연결)
        try {
          await prisma.guardian.update({
            where: { id: targetGuardian.id },
            data: {
              ...(body.guardianName !== undefined ? { name: body.guardianName } : {}),
              ...(body.phoneFull !== undefined ? { phoneFull: normalizedFull, phoneLast4: last4 } : {}),
            },
          });
        } catch (e: unknown) {
          // 고유키 충돌(P2002) → 이미 그 번호의 보호자가 존재하면 그 보호자로 연결
          const exist = await prisma.guardian.findFirst({ where: { phoneFull: normalizedFull } });
          if (exist) {
            await prisma.student.update({
              where: { id },
              data: {
                guardians: {
                  disconnect: { id: targetGuardian.id },
                  connect: { id: exist.id },
                },
              },
            });
            // (선택) 기존 guardian이 더 이상 참조되지 않으면 삭제할 수도 있음
          } else {
            throw e;
          }
        }
      } else {
        // 보호자가 없었으면 새로 만들고 연결
        const g = await prisma.guardian.upsert({
          where: { phoneFull: normalizedFull },
          update: { name: body.guardianName ?? '' , phoneLast4: last4 },
          create: { name: body.guardianName ?? '', phoneFull: normalizedFull, phoneLast4: last4 },
        });
        await prisma.student.update({
          where: { id },
          data: { guardians: { connect: { id: g.id } } },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error('[PATCH /students/:id]', e);
    return errorJson(500, e);
  }
}

export async function DELETE(_req: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = await params;

    // 학생 관련 레코드 정리 후 학생 삭제
    await prisma.attendSession.deleteMany({ where: { studentId: id } });
    await prisma.notifyLog.deleteMany({ where: { studentId: id } });
    await prisma.student.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error('[DELETE /api/admin/students/:id]', e);
    return errorJson(500, e);
  }
}
