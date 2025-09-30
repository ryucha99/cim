'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function AdminLogin() {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') ?? '/admin';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // 요구사항: 비밀번호는 1717 (표시하지 않음)
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
          type="password" inputMode="numeric" autoFocus
          value={pin} onChange={e=>setPin(e.target.value)}
          className="w-full border rounded-xl px-4 py-3 text-center text-2xl tracking-widest"
          placeholder="••••"
        />
        {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
        <button className="mt-4 w-full rounded-xl bg-slate-900 text-white py-3 font-bold">입장</button>
      </form>
    </div>
  );
}
