'use client';

type Props = { onKey: (k: string) => void };
const rows = [['1','2','3'], ['4','5','6'], ['7','8','9'], ['C','0','X']];

export default function KioskKeypad({ onKey }: Props) {
  return (
    <div className="flex flex-col gap-4 items-center mt-6">
      {rows.map((r, ri) => (
        <div key={ri} className="flex gap-4">
          {r.map((k) => (
            <button
              key={k}
              onClick={() => onKey(k)}
              className={[
                'btn-skin',                        // <- 스킨 변수 사용
                'w-28 h-20 rounded-3xl',
                'text-2xl font-bold tracking-wide',
                'active:scale-95 transition-transform',
                'relative overflow-hidden',
              ].join(' ')}
            >
              {/* 글로스 하이라이트 */}
              <span className="pointer-events-none absolute inset-x-0 -top-2 h-1/2"
                    style={{ background: 'linear-gradient(to bottom, var(--btn-gloss), transparent)' }} />
              <span className="relative z-10 drop-shadow-sm">{k}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
