import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

function getMonthRange(yyyymm?: string) {
  const base = yyyymm ?? new Date().toISOString().slice(0,7); // "YYYY-MM"
  const [y,m] = base.split('-').map(Number);
  const from = new Date(y, m-1, 1);
  const to = new Date(y, m, 1); // exclusive
  return { base, from, to };
}

export default async function MemberDetail({ params, searchParams }:{
  params:{ id:string }, searchParams:{ m?:string }
}) {
  const s = await prisma.student.findUnique({ where:{ id: params.id } });
  if (!s) return notFound();

  const { base, from, to } = getMonthRange(searchParams.m);
  const sessions = await prisma.attendSession.findMany({
    where: { studentId: s.id, checkInAt: { gte: from, lt: to } },
    orderBy: [{ checkInAt: 'asc' }]
  });

  // 날짜별 묶기
  const byDay = new Map<string, {in?:Date; out?:Date}[]>();
  sessions.forEach(ss=>{
    const key = ss.checkInAt.toISOString().slice(0,10); // YYYY-MM-DD
    const arr = byDay.get(key) ?? [];
    arr.push({ in: ss.checkInAt, out: ss.checkOutAt ?? undefined });
    byDay.set(key, arr);
  });

  // 달력 그리드
  const y = Number(base.slice(0,4)), m = Number(base.slice(5,7));
  const first = new Date(y, m-1, 1);
  const lastDate = new Date(y, m, 0).getDate();
  const padStart = (first.getDay()+6)%7; // 월=0 기준
  const cells = Array.from({length: padStart + lastDate}, (_,i)=>{
    const day = i - padStart + 1;
    if (day < 1) return { label:'', date:null as Date|null };
    return { label:String(day), date:new Date(y, m-1, day) };
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-end justify-between mb-4">
        <h1 className="text-xl font-bold">{s.name}</h1>
        <div className="flex items-center gap-2">
          <Link className="px-2 py-1 rounded border" href={`?m=${new Date(y, m-2, 1).toISOString().slice(0,7)}`}>◀︎</Link>
          <div className="font-semibold">{base}</div>
          <Link className="px-2 py-1 rounded border" href={`?m=${new Date(y, m, 1).toISOString().slice(0,7)}`}>▶︎</Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['월','화','수','목','금','토','일'].map(d=><div key={d} className="text-center text-sm opacity-70">{d}</div>)}
        {cells.map((c,idx)=>{
          const key = c.date ? c.date.toISOString().slice(0,10) : `blank-${idx}`;
          const items = c.date ? (byDay.get(key) ?? []) : [];
          return (
            <div key={key} className="min-h-24 border rounded-xl p-2">
              <div className="text-sm font-semibold">{c.label}</div>
              {items.map((it, i)=>(
                <div key={i} className="mt-1 text-xs">
                  <div className="inline-block bg-blue-100 text-blue-800 rounded px-1">
                    등원: {it.in?.toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'})}
                  </div>
                  {it.out && (
                    <div className="inline-block bg-blue-200 text-blue-900 rounded px-1 ml-1">
                      하원: {it.out?.toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'})}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
