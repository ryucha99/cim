'use client';

type Props = { onKey: (k: string) => void };
const rows = [['1','2','3'], ['4','5','6'], ['7','8','9'], ['C','0','X']];

export default function KioskKeypad({ onKey }: Props) {
  return (
    <div className="w-full max-w-[820px] mx-auto bg-keypad rounded-2xl p-4 mt-4">
      <div className="grid grid-cols-3 gap-4 place-items-center">
        {rows.flat().map((k) => (
          <button
            key={k}
            onClick={() => onKey(k)}
            className={[
              'w-10 h-10',                         // 2/3 정도로 축소
              'flex items-center justify-center',
              'text-xl font-extrabold text-readin',
              'active:scale-95 transition-transform select-none hover:opacity-80',
            ].join(' ')}
            aria-label={`키패드 ${k}`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
