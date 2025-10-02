import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// ---------- KST 유틸 ----------
const KST = 'Asia/Seoul';

// 날짜를 KST 기준 요일 인덱스로 변환 (일=0 ... 토=6)
function getDayKST(date: Date) {
  const short = new Intl.DateTimeFormat('en-US', {
    timeZone: KST,
    weekday: 'short',
  }).format(date); // 'Sun' | 'Mon' ...
  const map: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  return map[short];
}

// KST 기준 YYYY-MM-DD 키 생성 (그룹핑용)
function ymdKST(date: Date) {
  const y = new Intl.DateTimeFormat('en-CA', { timeZone: KST, year: 'numeric' }).format(date);      // 2025
  const m = new Intl.DateTimeFormat('en-CA', { timeZone: KST, month: '2-digit' }).format(date);     // 01
  const d = new Intl.DateTimeFormat('en-CA', { timeZone: KST, day: '2-digit' }).format(date);       // 31
  return `${y}-${m}-${d}`;
}

// KST 시각 포맷 (HH:MM)
function timeHMKST(date?: Date | null) {
  if (!date) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// 해당 월의 KST 기준 첫날 00:00의 요일을 구해 선행 공백 칸 수 계산
function getMonthRange(yyyymm?: string) {
  const base = yyyymm ?? new Date().toISOString().slice(0,7); // "YYYY-MM"
  const [y,m] = base.split('-').map(Number);
  // 달력 계산용 anchor (로컬타임 생성 후 요일은 KST로 판정)
  const first = new Date(y, m-1, 1);
  const lastDate = new Date(y, m, 0).getDate(); // 해당 월의 일 수
  const padStart = getDayKST(first);            // 일=0 기준으로 선행 공백
  return { base, y, m, first, lastDate, padStart };
}

export default async function MemberDetail({ params, searchParams }:{
  params:{ id:string }, searchParams:{ m?:string }
}) {
  const s = await prisma.student.findUnique({ where:{ id: params.id } });
  if (!s) return notFound();

  const { base, y, m, lastDate, padStart } = getMonthRange(searchParams.m);

  // 해당 월 KST 범위 계산 (포함/제외 경계는 서버타임과 무관하게 KST 날짜 텍스트 비교로 필터링)
  // 먼저 해당 월 전체 레코드를 대~충 가져오고, 아래에서 KST yyyy-mm-dd로 다시 걸러도 됨.
  const fromApprox = new Date(y, m-1, 1);
  const toApprox   = new Date(y, m, 1);

  const sessions = await prisma.attendSession.findMany({
    where: { studentId: s.id, checkInAt: { gte: fromApprox, lt: toApprox } },
    orderBy: [{ checkInAt: 'asc' }]
  });

  // 🔴 날짜별(KST) 묶기
  const byDay = new Map<string, {in?:Date; out?:Date}[]>();
  sessions.forEach(ss=>{
    const key = ymdKST(ss.checkInAt); // ✅ KST 기준으로 그룹핑
    const arr = byDay.get(key) ?? [];
    arr.push({ in: ss.checkInAt, out: ss.checkOutAt ?? undefined });
    byDay.set(key, arr);
  });

  // 달력 셀 구성 (일월화수목금토 + 선행 공백 padStart)
  const cells = Array.from({length: padStart + lastDate}, (_,i)=>{
    const day = i - padStart + 1;
    if (day < 1) return { label:'', date:null as Date|null, dow:-1 };
    const d = new Date(y, m-1, day);
    return { label:String(day), date:d, dow:getDayKST(d) };
  });

  const weekDays = ['일','월','화','수','목','금','토'];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-4">
        <Link href="/admin" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border hover:bg-slate-50">
          ⬅︎ 홈
        </Link>
      </div>
      <div className="flex items-end justify-between mb-4">
        <h1 className="text-xl font-bold">{s.name}</h1>
        <div className="flex items-center gap-2">
          <Link className="px-2 py-1 rounded border" href={`?m=${new Date(y, m-2, 1).toISOString().slice(0,7)}`}>◀︎</Link>
          <div className="font-semibold">{base}</div>
          <Link className="px-2 py-1 rounded border" href={`?m=${new Date(y, m, 1).toISOString().slice(0,7)}`}>▶︎</Link>
        </div>
      </div>

      {/* 요일 헤더: 일월화수목금토 + 색상 */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((d,idx)=>(
          <div
            key={d}
            className={
              'text-center text-sm font-semibold ' +
              (idx===0 ? 'text-red-600' : idx===6 ? 'text-blue-600' : 'text-gray-800')
            }
          >
            {d}
          </div>
        ))}

        {/* 날짜 셀 */}
        {cells.map((c,idx)=>{
          const key = c.date ? ymdKST(c.date) : `blank-${idx}`;
          const items = c.date ? (byDay.get(key) ?? []) : [];

          // 일/토 색상 (박스 전체에 적용)
          const colorBox =
            c.dow === 0 ? 'text-red-700 border-red-300'
          : c.dow === 6 ? 'text-blue-700 border-blue-300'
          : 'text-gray-900 border-slate-200';

          return (
            <div key={key} className={`min-h-24 border rounded-xl p-2 ${colorBox}`}>
              <div className="text-sm font-semibold">{c.label}</div>

              {/* 출결 뱃지도 KST 기준 시간 포맷으로 */}
              {items.map((it, i)=>(
                <div key={i} className="mt-1 text-xs">
                  <div className="inline-block bg-blue-100 text-blue-800 rounded px-1">
                    등원: {timeHMKST(it.in)}
                  </div>
                  {it.out && (
                    <div className="inline-block bg-blue-200 text-blue-900 rounded px-1 ml-1">
                      하원: {timeHMKST(it.out)}
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
