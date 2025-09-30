'use client';
export default function CodeBoxes({ digits }: { digits: string }) {
  const arr = [0,1,2,3].map(i => digits[i] ?? '');
  return (
    <div className="flex gap-4 justify-center my-4">
      {arr.map((ch,i)=>(
        <div key={i}
             className="btn-skin w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold">
          {ch}
        </div>
      ))}
    </div>
  );
}
