import Link from 'next/link';
export const dynamic = 'force-dynamic';

export default function AdminHome() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold mb-6">관리자</h1>
      <div className="flex gap-3 mb-6">
        <Link href="/admin/new" className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold">새 멤버 입력</Link>
        <Link href="/admin/delete" className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold">기존 멤버 삭제</Link>
      </div>

      <div className="mt-8">
        <h2 className="font-bold mb-3">멤버 목록</h2>
        <Link href="/admin/members" className="underline text-slate-700">전체 보기</Link>
      </div>
    </div>
  );
}
