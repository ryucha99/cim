// app/admin/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// 서버 액션: 행 단위 삭제 + 즉시 갱신
async function removeStudent(id: string) {
  'use server';
  await prisma.attendSession.deleteMany({ where: { studentId: id } });
  await prisma.notifyLog.deleteMany({ where: { studentId: id } });
  await prisma.student.delete({ where: { id } });
  revalidatePath('/admin');
}

export default async function AdminHome() {
  const rows = await prisma.student.findMany({
    orderBy: [{ name: 'asc' }],
    select: { id: true, name: true, grade: true, className: true },
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">관리자</h1>
        <Link
          href="/admin/new"
          className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold"
        >
          새 멤버 입력
        </Link>
      </header>

      <section>
        <h2 className="font-bold mb-3">멤버 목록</h2>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-3">이름</th>
                <th className="p-3">학년</th>
                <th className="p-3">반</th>
                <th className="p-3 w-32">관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
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
              ))}
              {!rows.length && (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={4}>
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
