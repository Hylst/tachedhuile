import { useMemo } from "react";
import { COLORS } from "../game/flood";

interface Piece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  width: number;
  height: number;
  drift: number;
  spin: number;
  round: boolean;
  z: number;
}

export default function Confetti({ count = 180 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 2.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)].hex,
        width: 5 + Math.random() * 8,
        height: 8 + Math.random() * 12,
        drift: (Math.random() - 0.5) * 260,
        spin: 360 + Math.random() * 1080,
        round: Math.random() > 0.65,
        z: Math.floor(Math.random() * 3),
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-0"
          style={
            {
              left: `${p.left}%`,
              width: p.width,
              height: p.round ? p.width : p.height,
              backgroundColor: p.color,
              borderRadius: p.round ? "9999px" : "2px",
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              zIndex: p.z,
              "--drift": `${p.drift}px`,
              "--spin": `${p.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
