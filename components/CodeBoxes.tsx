'use client';

export default function CodeBoxes({ digits }: { digits: string }) {
  const arr = [0,1,2,3].map(i => digits[i] ?? '');
  return (
    <div className="flex gap-4 justify-center my-3">
      {arr.map((ch,i)=>(
        <div
          key={i}
          className="rounded-2xl border-2 border-readin flex items-center justify-center text-2xl font-extrabold text-readin bg-white"
          style={{ width: 72, height: 72 }} // 48px → 72px (1.5배)
        >
          {ch}
        </div>
      ))}
    </div>
  );
}
