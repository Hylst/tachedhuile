export const COLORS = [
  { id: 0, hex: "#f43f5e", name: "Rouge", glow: "rgba(244,63,94,0.55)" },
  { id: 1, hex: "#f59e0b", name: "Orange", glow: "rgba(245,158,11,0.55)" },
  { id: 2, hex: "#10b981", name: "Vert", glow: "rgba(16,185,129,0.55)" },
  { id: 3, hex: "#3b82f6", name: "Bleu", glow: "rgba(59,130,246,0.55)" },
  { id: 4, hex: "#8b5cf6", name: "Violet", glow: "rgba(139,92,246,0.55)" },
  { id: 5, hex: "#06b6d4", name: "Cyan", glow: "rgba(6,182,212,0.55)" },
] as const;

export interface SizeOption {
  label: string;
  size: number;
  limit: number;
}

export const SIZE_OPTIONS: SizeOption[] = [
  { label: "Petit", size: 8, limit: 14 },
  { label: "Moyen", size: 12, limit: 22 },
  { label: "Grand", size: 16, limit: 30 },
];

import type { Level } from "./levels";

export function generateBoard(size: number, colorCount = COLORS.length): number[] {
  let board: number[];
  let attempts = 0;
  do {
    board = Array.from({ length: size * size }, () =>
      Math.floor(Math.random() * colorCount)
    );
    attempts++;
  } while ((isFlooded(board) || distinctColors(board) < 3) && attempts < 200);
  return board;
}

export function generateLevelBoard(level: Level): number[] {
  const { size, colorCount, obstaclePattern, obstacleDensity } = level;
  const numCells = size * size;

  let board: number[];
  let attempts = 0;

  do {
    board = Array.from({ length: numCells }, () =>
      Math.floor(Math.random() * colorCount)
    );

    if (obstaclePattern !== "none" && obstacleDensity > 0) {
      const targetObstacles = Math.floor(numCells * obstacleDensity);
      let placed = 0;

      // Map coordinates for symmetrical patterns
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const idx = r * size + c;
          if (idx === 0) continue; // Never block origin

          let placeStone = false;

          if (obstaclePattern === "center") {
            const dr = Math.abs(r - size / 2);
            const dc = Math.abs(c - size / 2);
            if (dr < size * 0.22 && dc < size * 0.22 && Math.random() > 0.2) {
              placeStone = true;
            }
          } else if (obstaclePattern === "corners") {
            const inTopRight = r < size * 0.25 && c > size * 0.75;
            const inBottomLeft = r > size * 0.75 && c < size * 0.25;
            const inBottomRight = r > size * 0.75 && c > size * 0.75;
            if ((inTopRight || inBottomLeft || inBottomRight) && Math.random() > 0.2) {
              placeStone = true;
            }
          } else if (obstaclePattern === "cross") {
            const isMidRow = Math.abs(r - Math.floor(size / 2)) <= 0.5;
            const isMidCol = Math.abs(c - Math.floor(size / 2)) <= 0.5;
            if ((isMidRow || isMidCol) && Math.random() < 0.6) {
              placeStone = true;
            }
          } else if (obstaclePattern === "maze") {
            if (r % 2 === 1 && c % 2 === 1 && Math.random() < 0.8) {
              placeStone = true;
            } else if ((r % 2 === 1 || c % 2 === 1) && Math.random() < 0.3) {
              placeStone = true;
            }
          } else if (obstaclePattern === "dots") {
            if (Math.random() < obstacleDensity) {
              placeStone = true;
            }
          }

          if (placeStone && placed < targetObstacles) {
            board[idx] = -1;
            placed++;
          }
        }
      }

      // Fill remaining target random obstacles if needed
      if (obstaclePattern === "random") {
        while (placed < targetObstacles) {
          const idx = Math.floor(Math.random() * numCells);
          if (idx !== 0 && board[idx] !== -1) {
            board[idx] = -1;
            placed++;
          }
        }
      }
    }

    attempts++;
  } while (
    (isFlooded(board) || distinctColors(board) < 2 || !isBoardFullyReachable(board, size)) &&
    attempts < 200
  );

  // Filet de securite : la boucle ci-dessus abandonne au bout de 200 essais et rend
  // alors le dernier plateau tire, meme s'il isole des cases. Certains motifs le font
  // quasi systematiquement (le motif "corners" du niveau 21 murait un coin dans 56 %
  // des tirages) : ces cases ne peuvent jamais etre inondees, donc le niveau devenait
  // mathematiquement impossible a terminer. On les transforme en rochers.
  return sealUnreachable(board, size);
}

/** Mure les cases jouables qu'on ne peut pas atteindre depuis le coin. */
function sealUnreachable(board: number[], size: number): number[] {
  const seen = new Set<number>([0]);
  const stack = [0];
  while (stack.length) {
    const idx = stack.pop()!;
    const r = Math.floor(idx / size);
    const c = idx % size;
    const neighbors = [
      r > 0 ? idx - size : -1,
      r < size - 1 ? idx + size : -1,
      c > 0 ? idx - 1 : -1,
      c < size - 1 ? idx + 1 : -1,
    ];
    for (const n of neighbors) {
      if (n >= 0 && !seen.has(n) && board[n] !== -1) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  const out = board.slice();
  for (let i = 0; i < out.length; i++) {
    if (out[i] !== -1 && !seen.has(i)) out[i] = -1;
  }
  return out;
}

/** Check if all non-obstacle cells can be reached from cell 0 */
function isBoardFullyReachable(board: number[], size: number): boolean {
  const numPlayable = board.filter((c) => c !== -1).length;
  if (numPlayable === 0) return false;

  const seen = new Set<number>([0]);
  const stack = [0];

  while (stack.length) {
    const idx = stack.pop()!;
    const r = Math.floor(idx / size);
    const c = idx % size;
    const neighbors = [
      r > 0 ? idx - size : -1,
      r < size - 1 ? idx + size : -1,
      c > 0 ? idx - 1 : -1,
      c < size - 1 ? idx + 1 : -1,
    ];

    for (const n of neighbors) {
      if (n >= 0 && !seen.has(n) && board[n] !== -1) {
        seen.add(n);
        stack.push(n);
      }
    }
  }

  return seen.size === numPlayable;
}

function distinctColors(board: number[]): number {
  return new Set(board.filter((c) => c !== -1)).size;
}

/** Flood-fill de la région connectée au coin supérieur gauche. */
export function floodFill(board: number[], size: number, newColor: number): number[] {
  const oldColor = board[0];
  if (oldColor === newColor) return board;
  const next = board.slice();
  const stack = [0];
  next[0] = newColor;
  while (stack.length) {
    const idx = stack.pop()!;
    const r = Math.floor(idx / size);
    const c = idx % size;
    const neighbors = [
      r > 0 ? idx - size : -1,
      r < size - 1 ? idx + size : -1,
      c > 0 ? idx - 1 : -1,
      c < size - 1 ? idx + 1 : -1,
    ];
    for (const n of neighbors) {
      if (n >= 0 && next[n] === oldColor) {
        next[n] = newColor;
        stack.push(n);
      }
    }
  }
  return next;
}

/** Vrai si toutes les cases sont de la même couleur (hors rochers). */
export function isFlooded(board: number[]): boolean {
  const c = board[0];
  return board.every((v) => v === c || v === -1);
}

/** Retourne l'ensemble des indices appartenant à la région connectée au coin. */
export function getRegion(board: number[], size: number): Set<number> {
  const color = board[0];
  if (color === -1) return new Set();
  const seen = new Set<number>([0]);
  const stack = [0];
  while (stack.length) {
    const idx = stack.pop()!;
    const r = Math.floor(idx / size);
    const c = idx % size;
    const neighbors = [
      r > 0 ? idx - size : -1,
      r < size - 1 ? idx + size : -1,
      c > 0 ? idx - 1 : -1,
      c < size - 1 ? idx + 1 : -1,
    ];
    for (const n of neighbors) {
      if (n >= 0 && !seen.has(n) && board[n] === color) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return seen;
}

/** Carte de distance BFS depuis le coin (Infinity pour les rochers / inaccessibles). */
export function getDistanceMap(board: number[], size: number): number[] {
  const dist = new Array(board.length).fill(Infinity);
  if (board[0] === -1) return dist;
  dist[0] = 0;
  const queue: number[] = [0];
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const r = Math.floor(idx / size);
    const c = idx % size;
    const neighbors = [
      r > 0 ? idx - size : -1,
      r < size - 1 ? idx + size : -1,
      c > 0 ? idx - 1 : -1,
      c < size - 1 ? idx + 1 : -1,
    ];
    for (const n of neighbors) {
      if (n >= 0 && board[n] !== -1 && dist[n] === Infinity) {
        dist[n] = dist[idx] + 1;
        queue.push(n);
      }
    }
  }
  return dist;
}

/** Cellules qui seraient gagnées si on choisissait `color`. */
export function previewGain(board: number[], size: number, color: number): Set<number> {
  if (color === board[0] || color === -1) return new Set();
  const current = getRegion(board, size);
  const next = floodFill(board, size, color);
  const after = getRegion(next, size);
  const gained = new Set<number>();
  for (const idx of after) if (!current.has(idx)) gained.add(idx);
  return gained;
}

/** Pourcentage du plateau (hors rochers) contrôlé par la région du coin. */
export function ownedFraction(board: number[], size: number): number {
  const color = board[0];
  const seen = new Set<number>([0]);
  const stack = [0];
  while (stack.length) {
    const idx = stack.pop()!;
    const r = Math.floor(idx / size);
    const c = idx % size;
    const neighbors = [
      r > 0 ? idx - size : -1,
      r < size - 1 ? idx + size : -1,
      c > 0 ? idx - 1 : -1,
      c < size - 1 ? idx + 1 : -1,
    ];
    for (const n of neighbors) {
      if (n >= 0 && !seen.has(n) && board[n] === color) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  const playableCount = board.filter((v) => v !== -1).length;
  return playableCount === 0 ? 1 : seen.size / playableCount;
}

/** Calcule la couleur qui ferait le plus grand gain immédiat. */
export function bestNextColor(board: number[], size: number): number {
  let bestColor = 0;
  let bestGain = -1;
  for (let color = 0; color < COLORS.length; color++) {
    if (color === board[0]) continue;
    const next = floodFill(board, size, color);
    const gain = ownedFraction(next, size);
    if (gain > bestGain) {
      bestGain = gain;
      bestColor = color;
    }
  }
  return bestColor;
}

/** Étoiles en fonction des coups utilisés par rapport à la limite. */
export function computeStars(moves: number, limit: number): number {
  const ratio = moves / limit;
  if (ratio <= 0.5) return 3;
  if (ratio <= 0.75) return 2;
  return 1;
}

/** Score calculé : plus tu gagnes vite, plus le score est haut. */
export function computeScore(size: number, moves: number, limit: number): number {
  const base = size * size * 10;
  const bonus = Math.max(0, limit - moves) * 50;
  return Math.round(base + bonus);
}
