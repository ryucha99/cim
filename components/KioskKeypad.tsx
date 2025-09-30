'use client';
export default function KioskKeypad({ onKey }: { onKey: (k:string)=>void }) {
  const rows = [['1','2','3'], ['4','5','6'], ['7','8','9'], ['C','0','X']];
  return (
    <div className="flex flex-col gap-3 items-center mt-6">
      {rows.map((r,ri)=>(
        <div key={ri} className="flex gap-3">
          {r.map(k=>(
            <button key={k} onClick={()=>onKey(k)}
              className="w-24 h-16 rounded-2xl border text-xl font-semibold active:scale-95">{k}</button>
          ))}
        </div>
      ))}
    </div>
  );
}
