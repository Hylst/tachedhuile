import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef({ from: value, to: value, start: 0 });

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = display;
    startRef.current = { from, to: value, start: performance.now() };

    const duration = 500;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - startRef.current.start;
      const progress = Math.min(1, elapsed / duration);
      const current = Math.round(from + (value - from) * ease(progress));
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return <span className={className}>{display}</span>;
}
