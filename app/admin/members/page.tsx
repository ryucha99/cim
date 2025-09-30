import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const rows = await prisma.student.findMany({ orderBy: [{ name:'asc' }] });
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">멤버 목록</h1>
      <table className="w-full text-left border">
        <thead className="bg-slate-50">
          <tr><th className="p-2">이름</th><th className="p-2">학년</th><th className="p-2">반</th></tr>
        </thead>
        <tbody>
          {rows.map(s=>(
            <tr key={s.id} className="border-t">
              <td className="p-2">
                <Link className="underline text-slate-700" href={`/admin/member/${s.id}`}>
                  {s.name}
                </Link>
              </td>
              <td className="p-2">{s.grade ?? '-'}</td>
              <td className="p-2">{s.className ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
