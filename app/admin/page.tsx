import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';          // ✅ 추가

export const dynamic = 'force-dynamic';

async function removeStudent(id: string) {
  'use server';
  await prisma.attendSession.deleteMany({ where: { studentId: id } });
  await prisma.notifyLog.deleteMany({ where: { studentId: id } });
  await prisma.student.delete({ where: { id } });
  revalidatePath('/admin');                           // ✅ 반영 즉시 갱신
}

export default async function AdminHome() {
  const rows = await prisma.student.findMany({
    orderBy: [{ name: 'asc' }],
    select: { id:true, name:true, grade:true, className:true }
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ... 생략 ... */}
      <table className="w-full text-left border">
        {/* ... thead ... */}
        <tbody>
          {rows.map(s=>(
            <tr key={s.id} className="border-t">
              {/* ... 이름/학년/반 ... */}
              <td className="p-2">
                <div className="flex gap-3">
                  <Link href={`/admin/members/${s.id}/edit`} className="text-blue-600 underline">수정</Link>
                  {/* ✅ 삭제 버튼 (서버 액션) */}
                  <form action={async () => { 'use server'; await removeStudent(s.id); }}>
                    <button type="submit" className="text-red-600 underline">삭제</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {!rows.length && <tr><td className="p-3 opacity-60" colSpan={4}>등록된 멤버가 없습니다.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
