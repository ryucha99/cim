'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewMemberPage() {
  const r = useRouter();
  const [form, setForm] = useState({
    name: '', grade: '', className: '',
    guardianName: '', phoneFull: ''
  });
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/students', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(form)
    });
    if (res.ok) { setMsg('등록 완료'); setTimeout(()=>r.push('/admin'), 800); }
    else { const t = await res.text(); setMsg('실패: '+t); }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">새 멤버 입력</h1>
      <form onSubmit={submit} className="grid gap-3">
        <input className="border rounded-xl px-4 py-3" placeholder="학생 이름"
               value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
        <div className="flex gap-3">
          <input className="border rounded-xl px-4 py-3 w-1/2" placeholder="학년(숫자)"
                 value={form.grade} onChange={e=>setForm(f=>({...f,grade:e.target.value}))}/>
          <input className="border rounded-xl px-4 py-3 w-1/2" placeholder="반(예: A반)"
                 value={form.className} onChange={e=>setForm(f=>({...f,className:e.target.value}))}/>
        </div>
        <input className="border rounded-xl px-4 py-3" placeholder="보호자 이름"
               value={form.guardianName} onChange={e=>setForm(f=>({...f,guardianName:e.target.value}))}/>
        <input className="border rounded-xl px-4 py-3" placeholder="보호자 휴대폰 (예: 010-1234-5678)"
               value={form.phoneFull} onChange={e=>setForm(f=>({...f,phoneFull:e.target.value}))}/>
        <button className="mt-2 rounded-xl bg-slate-900 text-white py-3 font-bold">확정</button>
        {msg && <p className="text-sm mt-1">{msg}</p>}
      </form>
    </div>
  );
}
