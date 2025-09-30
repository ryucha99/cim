'use client';

type Props = { onKey: (k: string) => void };
const rows = [['1','2','3'], ['4','5','6'], ['7','8','9'], ['C','0','X']];

export default function KioskKeypad({ onKey }: Props) {
  return (
    <div className="w-full max-w-[820px] mx-auto bg-keypad rounded-2xl p-6 mt-8">
      <div className="grid grid-cols-3 gap-6 place-items-center">
        {rows.flat().map((k) => (
          <button
            key={k}
            onClick={() => onKey(k)}
            className={[
              'w-16 h-16',                   // 입력박스와 동일 사이즈
              'flex items-center justify-center',
              'text-3xl font-extrabold text-readin',
              'select-none',
              'active:scale-95 transition-transform',
              'hover:opacity-80',
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
