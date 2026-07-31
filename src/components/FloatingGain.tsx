import { useEffect, useState } from "react";

interface Gain {
  id: number;
  value: number;
  x: number;
  y: number;
  color: string;
}

let gainId = 0;

export function useFloatingGains() {
  const [gains, setGains] = useState<Gain[]>([]);

  const spawn = (value: number, x: number, y: number, color: string) => {
    const id = ++gainId;
    setGains((prev) => [...prev, { id, value, x, y, color }]);
    setTimeout(() => {
      setGains((prev) => prev.filter((g) => g.id !== id));
    }, 1400);
  };

  return { gains, spawn };
}

export function FloatingGainRenderer({ gains }: { gains: Gain[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[45]">
      {gains.map((g) => (
        <FloatingGainBubble key={g.id} gain={g} />
      ))}
    </div>
  );
}

function FloatingGainBubble({ gain }: { gain: Gain }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isBig = gain.value >= 10;
  const isHuge = gain.value >= 25;

  return (
    <div
      className="float-up absolute"
      style={{ left: gain.x, top: gain.y }}
    >
      <div
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-black tabular-nums shadow-xl ring-2 ring-white/40 whitespace-nowrap ${
          isHuge ? "text-lg" : isBig ? "text-base" : "text-sm"
        }`}
        style={{
          backgroundColor: gain.color,
          color: "#fff",
          textShadow: "0 1px 2px rgba(0,0,0,0.45)",
          boxShadow: `0 8px 24px -4px ${gain.color}, 0 0 0 2px rgba(255,255,255,0.4)`,
        }}
      >
        <span>+{gain.value}</span>
        {isHuge && <span>🔥</span>}
        {isBig && !isHuge && <span>✨</span>}
      </div>
    </div>
  );
}
