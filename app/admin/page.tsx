// app/admin/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// ───────────── KST 유틸 ─────────────
const KST = 'Asia/Seoul';

function todayKSTParts() {
  const y = Number(new Intl.DateTimeFormat('en-CA', { timeZone: KST, year: 'numeric' }).format(new Date()));
  const m = Number(new Intl.DateTimeFormat('en-CA', { timeZone: KST, month: '2-digit' }).format(new Date()));
  const d = Number(new Intl.DateTimeFormat('en-CA', { timeZone: KST, day: '2-digit' }).format(new Date()));
  return { y, m, d };
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`;

// YYYY-MM-DD(KST) → 해당 일 00:00~24:00의 UTC 경계
function kstRange(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00+09:00`);
  const end = new Date(`${dateStr}T00:00:00+09:00`);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function timeHMKST(dt?: Date | null) {
  if (!dt) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    hour: '2-digit',
    minute: '2-digit',
  }).format(dt);
}

// 서버 액션: 행 단위 삭제 + 즉시 갱신
async function removeStudent(id: string) {
  'use server';
  await prisma.attendSession.deleteMany({ where: { studentId: id } });
  await prisma.notifyLog.deleteMany({ where: { studentId: id } });
  await prisma.student.delete({ where: { id } });
  revalidatePath('/admin');
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams?: { y?: string; m?: string; d?: string };
}) {
  // 1) 기본값: 오늘(KST)
  const today = todayKSTParts();
  const selY = Number(searchParams?.y ?? today.y);
  const selM = Number(searchParams?.m ?? today.m);
  const selD = Number(searchParams?.d ?? today.d);
  const dateStr = toDateStr(selY, selM, selD);

  // 2) 학생 목록
  const rows = await prisma.student.findMany({
    orderBy: [{ name: 'asc' }],
    select: { id: true, name: true, grade: true, className: true },
  });

  // 3) 선택 날짜의 출결 요약(학생별 첫 등원/마지막 하원)
  const { start, end } = kstRange(dateStr);
  const sessions = await prisma.attendSession.findMany({
    where: { checkInAt: { gte: start, lt: end } },
    select: { studentId: true, checkInAt: true, checkOutAt: true },
    orderBy: [{ checkInAt: 'asc' }],
  });

  const byStudent = new Map<string, { in?: Date; out?: Date }>();
  for (const r of sessions) {
    const cur = byStudent.get(r.studentId) ?? {};
    if (!cur.in || r.checkInAt < cur.in) cur.in = r.checkInAt;
    if (r.checkOutAt && (!cur.out || r.checkOutAt > cur.out)) cur.out = r.checkOutAt;
    byStudent.set(r.studentId, cur);
  }

  // 4) 셀렉트 옵션
  const years = Array.from({ length: 6 }, (_, i) => today.y - 2 + i); // 올해±2년
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(selY, selM, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">관리자</h1>
        <Link
          href="/admin/new"
          className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold"
        >
          새 멤버 입력
        </Link>
      </header>

      {/* ───── 날짜 선택 바 (기본값: 오늘) ───── */}
      <form method="get" action="/admin" className="flex flex-wrap items-center gap-2 mb-4" id="dateForm">
        <select name="y" defaultValue={String(selY)} className="border rounded px-2 py-1">
          {years.map((yy) => (
            <option key={yy} value={yy}>{yy}년</option>
          ))}
        </select>
        <select name="m" defaultValue={String(selM)} className="border rounded px-2 py-1">
          {months.map((mm) => (
            <option key={mm} value={mm}>{mm}월</option>
          ))}
        </select>
        <select name="d" defaultValue={String(Math.min(selD, daysInMonth))} className="border rounded px-2 py-1">
          {days.map((dd) => (
            <option key={dd} value={dd}>{dd}일</option>
          ))}
        </select>
        <button type="submit" className="px-3 py-1.5 rounded border">조회</button>
        <span className="text-sm text-slate-500 ml-2">선택 날짜: {dateStr}</span>
      </form>

      {/* 자동 제출(선택 변경 시) - 클라이언트 스크립트 없이도 동작하도록 조회 버튼 제공 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              var f = document.getElementById('dateForm');
              if(!f) return;
              f.querySelectorAll('select').forEach(function(sel){
                sel.addEventListener('change', function(){ f.requestSubmit(); });
              });
            })();
          `,
        }}
      />

      <section>
        <h2 className="font-bold mb-3">멤버 목록</h2>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-3">이름</th>
                <th className="p-3">학년</th>
                <th className="p-3">반</th>
                <th className="p-3">등원</th>
                <th className="p-3">하원</th>
                <th className="p-3 w-40">관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const att = byStudent.get(s.id);
                return (
                  <tr key={s.id} className="border-t">
                    <td className="p-3">
                      {/* 달력/상세 페이지 경로: members 로 통일 */}
                      <Link
                        href={`/admin/members/${s.id}`}
                        className="underline text-slate-800"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td className="p-3">{s.grade ?? '-'}</td>
                    <td className="p-3">{s.className ?? '-'}</td>
                    <td className="p-3">{timeHMKST(att?.in)}</td>
                    <td className="p-3">{timeHMKST(att?.out)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/admin/members/${s.id}/edit`}
                          className="text-blue-600 underline"
                        >
                          수정
                        </Link>
                        <form
                          action={async () => {
                            'use server';
                            await removeStudent(s.id);
                          }}
                        >
                          <button type="submit" className="text-red-600 underline">
                            삭제
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={6}>
                    등록된 멤버가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
