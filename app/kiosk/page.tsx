'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import CodeBoxes from '@/components/CodeBoxes';
import KioskKeypad from '@/components/KioskKeypad';

const BRANCH = process.env.NEXT_PUBLIC_ACADEMY_BRANCH || '동탄 왕배초점';

export default function Page() {
  const [now, setNow] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); },[]);
  const pad = (n:number)=>String(n).padStart(2,'0');
  const clock = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const [digits, setDigits] = useState('');
  const [overlay, setOverlay] = useState<{name:string; type:'IN'|'OUT'|'ERR'}|null>(null);

  const onKey = (k:string)=>{
    if (k==='C') setDigits(d=>d.slice(0,-1));
    else if (k==='X') setDigits('');
    else if (/^\d$/.test(k)) setDigits(d=> d.length<4 ? d+k : d);
  };

  useEffect(()=>{
    const submit = async ()=>{
      const res = await fetch('/api/attend',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ last4: digits })
      });
      if (!res.ok) {
        setOverlay({ name:'미등록 번호', type:'ERR' });
        setTimeout(()=>{ setOverlay(null); setDigits(''); },2000);
        return;
      }
      const data = await res.json();
      setOverlay({ name: `${data.student.name} 학생, 반가워요!!!`, type: data.type });
      setTimeout(()=>{ setOverlay(null); setDigits(''); },5000);
    };
    if (digits.length===4) submit();
  }, [digits]);

  return (
    <div className="min-h-dvh bg-white text-readin">
      <div className="w-full max-w-[920px] mx-auto px-6 py-5">
        {/* 헤더: 로고 + 지점명 */}
        <header className="flex items-center gap-3 mb-4">
          <Image src="/readin-logo.jpg" alt="READIN" width={112} height={32} className="h-8 w-auto" priority/>
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight">{BRANCH}</span>
        </header>

        {/* 본문 */}
        <div className="flex flex-col items-center">
          <div className="text-xl sm:text-2xl font-bold">{clock}</div>

          {/* 입력칸 (1.5배) */}
          <CodeBoxes digits={digits} />

          {/* 키패드 (20% 업) */}
          <KioskKeypad onKey={onKey} />

          {/* 그림: 중앙 정렬, 반응형 크기 */}
          <div className="mt-6 w-full flex justify-center">
            <Image
              src="/readin-hero.jpg"   // public/readin-hero.jpg
              alt="READIN"
              width={380}
              height={380}
              className="w-48 sm:w-56 md:w-64 lg:w-72 h-auto"
              priority
            />
          </div>
        </div>
      </div>

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
