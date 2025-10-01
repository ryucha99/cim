'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditMemberPage() {
  const { id } = useParams<{id:string}>();
  const r = useRouter();
  const [form, setForm] = useState({ name:'', grade:'', className:'' });
  const [msg, setMsg] = useState('');

  useEffect(()=>{ (async()=>{
    const res = await fetch(`/api/admin/students/${id}`);
    if (!res.ok) { setMsg('불러오기 실패'); return; }
    const s = await res.json();
    setForm({
      name: s.name ?? '',
      grade: s.grade == null ? '' : String(s.grade),
      className: s.className ?? ''
    });
  })(); }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/students/${id}`, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        name: form.name,
        grade: form.grade === '' ? null : Number(form.grade),
        className: form.className,
      })
    });
    if (res.ok) {
      setMsg('수정 완료');
      setTimeout(()=>r.push('/admin'), 700);
    } else {
      try { const j = await res.json(); setMsg('실패: '+(j.message || j.error)); } catch { setMsg('실패'); }
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">멤버 수정</h1>
      <form onSubmit={submit} className="grid gap-3">
        <input className="border rounded-xl px-4 py-3" placeholder="학생 이름"
               value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
        <div className="flex gap-3">
          <input className="border rounded-xl px-4 py-3 w-1/2" placeholder="학년(숫자)"
                 value={form.grade} onChange={e=>setForm(f=>({...f,grade:e.target.value}))}/>
          <input className="border rounded-xl px-4 py-3 w-1/2" placeholder="반(예: A반)"
                 value={form.className} onChange={e=>setForm(f=>({...f,className:e.target.value}))}/>
        </div>
        <button className="mt-2 rounded-xl bg-slate-900 text-white py-3 font-bold">저장</button>
        {msg && <p className="text-sm mt-1">{msg}</p>}
      </form>
    </div>
  );
}
