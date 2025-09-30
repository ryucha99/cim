'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// (선택) 프리렌더 이슈 피하려면 주석 해제
// export const dynamic = 'force-dynamic';

function LoginInner() {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') ?? '/admin';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === '1717') {
      await fetch('/api/admin/login', { method: 'POST' });
      router.push(next);
    } else {
      setErr('비밀번호가 올바르지 않습니다.');
      setPin('');
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-xs bg-white rounded-2xl border p-5">
        <h1 className="text-xl font-bold mb-4 text-center">관리자 로그인</h1>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full border rounded-xl px-4 py-3 text-center text-2xl tracking-widest"
          placeholder="••••"
        />
        {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
        <button className="mt-4 w-full rounded-xl bg-slate-900 text-white py-3 font-bold">
          입장
        </button>
      </form>
    </div>
  );
}

export default function AdminLogin() {
  // ✅ useSearchParams()를 쓰는 컴포넌트를 Suspense로 감싼다
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center">로딩…</div>}>
      <LoginInner />
    </Suspense>
  );
}
