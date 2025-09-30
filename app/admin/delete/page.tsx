'use client';
import { useEffect, useState } from 'react';

type Row = { id:string; name:string; grade:number|null; className:string|null };

export default function DeleteMembersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [sel, setSel] = useState<Record<string, boolean>>({});

  useEffect(()=>{ (async()=>{
    const r = await fetch('/api/admin/students');
    const j = await r.json();
    setRows(j);
  })(); }, []);

  async function onDelete() {
    const ids = Object.keys(sel).filter(k=>sel[k]);
    if (!ids.length) return;
    const res = await fetch('/api/admin/students/bulk-delete', {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ids })
    });
    if (res.ok) {
      const s = new Set(ids);
      setRows(rows.filter(r=>!s.has(r.id)));
      setSel({});
      alert('삭제 완료');
    } else {
      alert('삭제 실패');
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">기존 멤버 삭제</h1>
      <table className="w-full text-left border">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-2 w-10">선택</th>
            <th className="p-2">이름</th>
            <th className="p-2">학년</th>
            <th className="p-2">반</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id} className="border-t">
              <td className="p-2">
                <input type="checkbox" checked={!!sel[r.id]}
                       onChange={e=>setSel(s=>({...s,[r.id]:e.target.checked}))}/>
              </td>
              <td className="p-2">{r.name}</td>
              <td className="p-2">{r.grade ?? '-'}</td>
              <td className="p-2">{r.className ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onDelete} className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white font-bold">
        선택 삭제
      </button>
    </div>
  );
}
