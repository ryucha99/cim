'use client';
export default function CodeBoxes({ digits }: { digits: string }) {
  const arr = [0,1,2,3].map(i => digits[i] ?? '');
  return (
    <div className="flex gap-3 justify-center my-4">
      {arr.map((ch,i)=>(
        <div key={i} className="w-16 h-16 border-2 rounded-2xl flex items-center justify-center text-2xl font-bold">
          {ch}
        </div>
      ))}
    </div>
  );
}
