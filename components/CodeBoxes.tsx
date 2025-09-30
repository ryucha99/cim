'use client';

export default function CodeBoxes({ digits }: { digits: string }) {
  const arr = [0,1,2,3].map(i => digits[i] ?? '');
  return (
    <div className="flex gap-3 justify-center my-3">
      {arr.map((ch,i)=>(
        <div
          key={i}
          className="w-12 h-12 rounded-xl border-2 border-readin flex items-center justify-center text-xl font-extrabold text-readin bg-white"
        >
          {ch}
        </div>
      ))}
    </div>
  );
}
