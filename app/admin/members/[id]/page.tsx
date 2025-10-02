import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// ---------- KST 유틸 ----------
const KST = 'Asia/Seoul';

// 요일 인덱스(KST): 일=0 ... 토=6
function getDayKST(date: Date) {
  const short = new Intl.DateTimeFormat('en-US', {
    timeZone: KST,
    weekday: 'short',
  }).format(date); // 'Sun'|'Mon'|...
  const map: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  return map[short];
}

// KST YYYY-MM-DD
function ymdKST(date: Date) {
  const y = new Intl.DateTimeFormat('en-CA', { timeZone: KST, year: 'numeric' }).format(date);
  const m = new Intl.DateTimeFormat('en-CA', { timeZone: KST, month: '2-digit' }).format(date);
  const d = new Intl.DateTimeFormat('en-CA', { timeZone: KST, day: '2-digit' }).format(date);
  return `${y}-${m}-${d}`;
}

// KST 시각 HH:MM
function timeHMKST(date?: Date | null) {
  if (!date) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// KST 날짜 YYYY-MM-DD (요일)
function dateYMDWeekKST(date?: Date | null) {
  if (!date) return '-';
  const y = new Intl.DateTimeFormat('en-CA', { timeZone: KST, year: 'numeric' }).format(date);
  const m = new Intl.DateTimeFormat('en-CA', { timeZone: KST, month: '2-digit' }).format(date);
  const d = new Intl.DateTimeFormat('en-CA', { timeZone: KST, day: '2-digit' }).format(date);
  const weekday = new Intl.DateTimeFormat('ko-KR', { timeZone: KST, weekday: 'short' }).format(date); // (일)~(토)
  return `${y}-${m}-${d} (${weekday})`;
}

// ms → "H시간 M분" 또는 "M분"
function fmtDuration(ms: number) {
  if (!ms || ms < 0) return '-';
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

// 해당 월 달력 계산(일월화수목금토)
function getMonthRange(yyyymm?: string) {
  const base = yyyymm ?? new Date().toISOString().slice(0,7); // "YYYY-MM"
  const [y,m] = base.split('-').map(Number);
  const firstLocal = new Date(y, m-1, 1);
  const lastDate = new Date(y, m, 0).getDate();
  const padStart = getDayKST(firstLocal); // 일=0 기준
  return { base, y, m, lastDate, padStart };
}

export default async function MemberDetail({ params, searchParams }:{
  params:{ id:string }, searchParams:{ m?:string }
}) {
  const s = await prisma.student.findUnique({ where:{ id: params.id } });
  if (!s) return notFound();

  const { base, y, m, lastDate, padStart } = getMonthRange(searchParams.m);

  // 이번 달(KST) 대략 범위로 쿼리 후, KST 기준으로 그룹핑/포맷
  const fromApprox = new Date(y, m-1, 1);
  const toApprox   = new Date(y, m, 1);

  const sessions = await prisma.attendSession.findMany({
    where: { studentId: s.id, checkInAt: { gte: fromApprox, lt: toApprox } },
    orderBy: [{ checkInAt: 'asc' }]
  });

  // 🔴 날짜별(KST) 묶기
  const byDay = new Map<string, {in?:Date; out?:Date}[]>();
  sessions.forEach(ss=>{
    const key = ymdKST(ss.checkInAt);
    const arr = byDay.get(key) ?? [];
    arr.push({ in: ss.checkInAt, out: ss.checkOutAt ?? undefined });
    byDay.set(key, arr);
  });

  // 달력 셀
  const cells = Array.from({length: padStart + lastDate}, (_,i)=>{
    const day = i - padStart + 1;
    if (day < 1) return { label:'', date:null as Date|null, dow:-1 };
    const d = new Date(y, m-1, day);
    return { label:String(day), date:d, dow:getDayKST(d) };
  });

  const weekDays = ['일','월','화','수','목','금','토'];

  // ────────── 통계 계산 (월간) ──────────
  // 1) 월간 출석일수(출석 기록이 있는 'KST 날짜'의 개수)
  const monthlyDays = Array.from(byDay.keys());
  const monthlyAttendanceDays = monthlyDays.filter(k => (byDay.get(k) ?? []).length > 0).length;

  // 2) 월간 총 출석시간(ms) = 같은 날 여러 번 입퇴실도 모두 합산
  let monthlyTotalMs = 0;
  // 2-1) 최다 출석 요일 계산(일0~토6)
  const dowCount = new Array(7).fill(0) as number[];
  for (const [k, items] of byDay.entries()) {
    // 요일 카운트는 '그 날짜에 출석이 있으면 +1'
    if (items.length > 0) {
      const [yyyy,mm,dd] = k.split('-').map(Number);
      const d = new Date(yyyy, mm-1, dd);
      dowCount[getDayKST(d)]++;
    }
    for (const it of items) {
      if (it.in && it.out && it.out > it.in) {
        monthlyTotalMs += (it.out.getTime() - it.in.getTime());
      }
    }
  }
  const monthlyAvgMsPerDay = monthlyAttendanceDays ? Math.floor(monthlyTotalMs / monthlyAttendanceDays) : 0;
  const monthlyVisitCount = sessions.length; // 체크인 건수

  const dowName = ['일','월','화','수','목','금','토'];
  let mostDowLabel = '-';
  if (dowCount.some(c=>c>0)) {
    const idx = dowCount.indexOf(Math.max(...dowCount));
    mostDowLabel = dowName[idx];
  }

  // ────────── 통계 계산 (전체 누적) ──────────
  const firstSession = await prisma.attendSession.findFirst({
    where: { studentId: s.id },
    orderBy: { checkInAt: 'asc' },
    select: { checkInAt: true }
  });
  const lastSession = await prisma.attendSession.findFirst({
    where: { studentId: s.id },
    orderBy: { checkInAt: 'desc' },
    select: { checkInAt: true }
  });

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

              {/* 출결 뱃지: KST HH:MM */}
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

      {/* ───────────── 통계 섹션 ───────────── */}
      <div className="mt-6 space-y-4">
        <h2 className="text-lg font-bold">통계</h2>

        {/* 이번 달 요약 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-slate-500">이번 달 총 출석일수</div>
            <div className="text-2xl font-extrabold">{monthlyAttendanceDays}일</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-slate-500">이번 달 총 출석시간</div>
            <div className="text-2xl font-extrabold">{fmtDuration(monthlyTotalMs)}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-slate-500">이번 달 평균 출석시간/일</div>
            <div className="text-2xl font-extrabold">
              {monthlyAttendanceDays ? fmtDuration(monthlyAvgMsPerDay) : '-'}
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-slate-500">이번 달 방문(체크인) 횟수</div>
            <div className="text-2xl font-extrabold">{monthlyVisitCount}회</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-slate-500">최다 출석 요일(이번 달)</div>
            <div className="text-2xl font-extrabold">{mostDowLabel}</div>
          </div>
        </div>

        {/* 전체(누적) 요약 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-slate-500">첫 출석일자(누적)</div>
            <div className="text-xl font-bold">{dateYMDWeekKST(firstSession?.checkInAt)}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-slate-500">최근 출석일자(누적)</div>
            <div className="text-xl font-bold">{dateYMDWeekKST(lastSession?.checkInAt)}</div>
          </div>
        </div>

        {/* 추가 아이디어: 아래 항목도 원하면 곧바로 넣어줄 수 있어요.
            - 누적 총 출석일수/총 시간
            - 월별 트렌드 차트(막대) (출석일수/총시간)
            - 평균 입실·퇴실 시각 (이번 달)
            - 가장 자주 온 시간대 (히트맵)
        */}
      </div>
    </div>
  );
}
