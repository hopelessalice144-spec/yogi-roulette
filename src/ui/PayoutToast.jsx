import { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext.jsx';

let toastSeq = 0;

/**
 * Spring-physics payout toasts — celebratory float burst on win.
 */
export function PayoutToast() {
  const { lastWin, particleBurst } = useGame();
  const [toasts, setToasts] = useState([]);
  const lastBurst = useRef(0);

  useEffect(() => {
    if (!particleBurst || particleBurst === lastBurst.current) return;
    lastBurst.current = particleBurst;

    if (lastWin <= 0) return;

    const id = ++toastSeq;
    const x = 36 + Math.random() * 28;
    const big = lastWin >= 500;

    setToasts((prev) => [
      ...prev.slice(-4),
      {
        id,
        amount: lastWin,
        x,
        big,
        label: `+$${lastWin.toLocaleString()}`,
        sub: big ? 'JACKPOT' : 'WINNER',
      },
    ]);

    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, big ? 4200 : 3600);

    return () => window.clearTimeout(timer);
  }, [particleBurst, lastWin]);

  if (toasts.length === 0) return null;

  return (
    <div className="payout-toast-layer" aria-live="polite">
      {toasts.map((t, i) => (
        <div
          key={t.id}
          className={`payout-toast ${t.big ? 'payout-toast-jackpot' : ''}`}
          style={{
            left: `${t.x}%`,
            animationDelay: `${i * 0.06}s`,
          }}
        >
          <span className="payout-toast-spark" aria-hidden />
          <span className="payout-toast-coins" aria-hidden>
            {[0, 1, 2, 3, 4].map((c) => (
              <i key={c} style={{ '--coin-i': c }} />
            ))}
          </span>
          <span className="payout-toast-sub">{t.sub}</span>
          <span className="payout-toast-amount">{t.label}</span>
        </div>
      ))}
    </div>
  );
}
