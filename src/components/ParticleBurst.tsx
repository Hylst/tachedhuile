import { useEffect, useState } from "react";
import { COLORS } from "../game/flood";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

interface Burst {
  id: number;
  originX: number;
  originY: number;
  colorIndex: number;
}

let burstId = 0;

export function useParticleBursts() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  const spawn = (originX: number, originY: number, colorIndex: number) => {
    setBursts((prev) => [...prev, { id: ++burstId, originX, originY, colorIndex }]);
  };

  const remove = (id: number) => {
    setBursts((prev) => prev.filter((b) => b.id !== id));
  };

  return { bursts, spawn, remove };
}

export function ParticleBurstRenderer({
  bursts,
  onDone,
}: {
  bursts: { id: number; originX: number; originY: number; colorIndex: number }[];
  onDone: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {bursts.map((b) => (
        <BurstParticles key={b.id} burst={b} onDone={() => onDone(b.id)} />
      ))}
    </div>
  );
}

function BurstParticles({
  burst,
  onDone,
}: {
  burst: { originX: number; originY: number; colorIndex: number };
  onDone: () => void;
}) {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 22 }, (_, i) => {
      const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 60 + Math.random() * 110;
      return {
        id: i,
        x: burst.originX,
        y: burst.originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        color: COLORS[burst.colorIndex].hex,
        size: 4 + Math.random() * 5,
        life: 1,
      };
    })
  );

  useEffect(() => {
    const timer = setTimeout(onDone, 700);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <>
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle-burst absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 12px ${p.color}`,
            ["--vx" as string]: `${p.vx}px`,
            ["--vy" as string]: `${p.vy}px`,
          }}
        />
      ))}
    </>
  );
}
