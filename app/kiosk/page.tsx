// app/kiosk/page.tsx
'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import CodeBoxes from '@/components/CodeBoxes';
import KioskKeypad from '@/components/KioskKeypad';

const BRANCH = process.env.NEXT_PUBLIC_ACADEMY_BRANCH || '동탄 왕배초점';

export default function Page() {
  // clock
  const [now, setNow] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); },[]);
  const pad = (n:number)=>String(n).padStart(2,'0');
  const clock = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // input
  const [digits, setDigits] = useState('');
  const [overlay, setOverlay] = useState<{name:string; type:'IN'|'OUT'|'ERR'}|null>(null);
  const onKey = (k:string)=>{
    if (k==='C') setDigits(d=>d.slice(0,-1));
    else if (k==='X') setDigits('');
    else if (/^\d$/.test(k)) setDigits(d=> d.length<4 ? d+k : d);
  };
  useEffect(()=>{
    const submit = async ()=>{
      const res = await fetch('/api/attend',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ last4: digits })});
      if (!res.ok) { setOverlay({ name:'미등록 번호', type:'ERR' }); setTimeout(()=>{ setOverlay(null); setDigits(''); },2000); return; }
      const data = await res.json();
      setOverlay({ name: `${data.student.name} 학생, 반가워요!!!`, type: data.type });
      setTimeout(()=>{ setOverlay(null); setDigits(''); },5000);
    };
    if (digits.length===4) submit();
  }, [digits]);

  return (
    <div className="min-h-dvh bg-white text-readin relative">
      {/* 우측 상단 일러스트 (반응형 크기) */}
      <Image
        src="/readin-hero.jpg"
        alt="READIN"
        width={320} height={320} priority
        className="absolute top-4 right-4 w-40 sm:w-48 md:w-56 lg:w-64 h-auto pointer-events-none select-none"
      />

      {/* 컨텐츠 래퍼: 오른쪽 여백으로 겹침 방지 (반응형) */}
      <div className="w-full max-w-[920px] mx-auto px-6 py-5 pr-44 sm:pr-56 md:pr-64 lg:pr-72">
        {/* 헤더: 로고 + 지점명 */}
        <header className="flex items-center gap-3 mb-5">
          <Image src="/readin-logo.jpg" alt="READIN" width={112} height={32} className="h-8 w-auto" />
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight">{BRANCH}</span>
        </header>

        {/* 본문 */}
        <div className="flex flex-col items-center">
          <div className="text-xl sm:text-2xl font-bold">{clock}</div>
          <div className="mt-3 text-lg font-semibold opacity-90">출결코드</div>
          <CodeBoxes digits={digits}/>
          {/* 키패드 축소판 (대략 2/3 높이) */}
          <KioskKeypad onKey={onKey} />
        </div>
      </div>

      {/* 오버레이 */}
      {overlay && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-3xl px-8 py-6 text-center shadow-xl">
            <div className="text-2xl font-extrabold text-readin">{overlay.name}</div>
          </div>
        </div>
      )}
    </div>
  );
}
