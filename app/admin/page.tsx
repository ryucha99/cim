// app/admin/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function removeStudent(id: string) {
  'use server';
  // 서버 액션: 직접 API 호출 대신 서버에서 바로 처리해도 OK
  await prisma.attendSession.deleteMany({ where: { studentId: id } });
  await prisma.notifyLog.deleteMany({ where: { studentId: id } });
  await prisma.student.delete({ where: { id } });
}

export default async function AdminHome() {
  const rows = await prisma.student.findMany({
    orderBy: [{ name: 'asc' }],
    select: { id:true, name:true, grade:true, className:true }
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold mb-6">관리자</h1>

      <div className="flex gap-3 mb-6">
        <Link href="/admin/new" className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold">새 멤버 입력</Link>
      </div>

      <h2 className="font-bold mb-3">멤버 목록</h2>
      <table className="w-full text-left border">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-2">이름</th>
            <th className="p-2">학년</th>
            <th className="p-2">반</th>
            <th className="p-2 w-32">관리</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(s=>(
            <tr key={s.id} className="border-t">
              <td className="p-2">
                <Link className="underline text-slate-700" href={`/admin/members/${s.id}`}>
                  {s.name}
                </Link>
              </td>
              <td className="p-2">{s.grade ?? '-'}</td>
              <td className="p-2">{s.className ?? '-'}</td>
              <td className="p-2">
                <div className="flex gap-3">
                  <Link href={`/admin/members/${s.id}/edit`} className="text-blue-600 underline">수정</Link>
                  <form action={async () => { 'use server'; await removeStudent(s.id); }}>
                    <button className="text-red-600 underline" type="submit">삭제</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr><td className="p-3 opacity-60" colSpan={4}>등록된 멤버가 없습니다.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
