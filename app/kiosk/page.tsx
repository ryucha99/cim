'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import CodeBoxes from '@/components/CodeBoxes';
import KioskKeypad from '@/components/KioskKeypad';


const SKIN = process.env.NEXT_PUBLIC_SKIN || 'glass'; // 'glass' | 'neon' | 'kids' | (기본)
const BRANCH = process.env.NEXT_PUBLIC_ACADEMY_BRANCH || '동탄 왕배초점';


function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); },[]);
  const pad = (n:number)=>String(n).padStart(2,'0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

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
      const res = await fetch('/api/attend',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ last4: digits })});
      if (!res.ok) { setOverlay({ name:'미등록 번호', type:'ERR' }); setTimeout(()=>{ setOverlay(null); setDigits(''); },2000); return; }
      const data = await res.json();
      setOverlay({ name: `${data.student.name} 학생, 반가워요!!!`, type: data.type });
      setTimeout(()=>{ setOverlay(null); setDigits(''); },5000);
    };
    if (digits.length===4) submit();
  }, [digits]);

  return (
    <div data-skin={SKIN} className="min-h-dvh flex flex-col items-center p-6 select-none">
      {/* 헤더 */}
      <header className="w-full max-w-[820px] mx-auto flex items-center gap-3 mb-4">
        <Image
          src="/readin-logo.jpg"
          alt="READIN 로고"
          width={120}
          height={36}
          priority
          className="h-9 w-auto"
        />
        <span className="text-xl sm:text-2xl font-extrabold tracking-tight">{BRANCH}</span>
      </header>

      {/* 본문 */}
      <div className="w-full max-w-[820px] mx-auto flex flex-col items-center">
        <div className="text-2xl font-bold mt-2">{clock}</div>
        <div className="mt-2 text-lg opacity-70">출결코드 입력</div>
        <CodeBoxes digits={digits}/>
        <KioskKeypad onKey={onKey}/>
      </div>

      {overlay && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl">
            <div className="text-2xl font-extrabold">{overlay.name}</div>
          </div>
        </div>
      )}
    </div>
  );
}