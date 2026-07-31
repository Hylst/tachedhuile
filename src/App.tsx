import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RotateCcw,
  Undo2,
  Lightbulb,
  Music,
  Volume2,
  VolumeX,
  Trophy,
  Skull,
  Star,
  Zap,
  Maximize,
  Minimize,
  Map,
  Gamepad2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  COLORS,
  SIZE_OPTIONS,
  generateBoard,
  generateLevelBoard,
  floodFill,
  isFlooded,
  ownedFraction,
  bestNextColor,
  computeStars,
  computeScore,
  getRegion,
  previewGain,
} from "./game/flood";
import { CAMPAIGN_LEVELS, type Level } from "./game/levels";
import { audio } from "./game/audio";
import { cn } from "./utils/cn";
import Confetti from "./components/Confetti";
import StartOverlay from "./components/StartOverlay";
import { AnimatedNumber } from "./components/AnimatedNumber";
import { ParticleBurstRenderer, useParticleBursts } from "./components/ParticleBurst";
import { FloatingGainRenderer, useFloatingGains } from "./components/FloatingGain";
import { LevelSelect } from "./components/LevelSelect";

type Status = "playing" | "won" | "lost";
type GameMode = "adventure" | "free";
type AdventureState = "select" | "playing";

const BEST_KEY = "tdh-best-v2";
const SCORES_KEY = "tdh-scores-v2";
const UNLOCKED_KEY = "tdh-unlocked-level";
const LEVEL_STARS_KEY = "tdh-level-stars";
const LEVEL_SCORES_KEY = "tdh-level-scores";

function loadJSON(key: string, def: any) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(def));
  } catch {
    return def;
  }
}

export default function App() {
  // Navigation & Mode
  const [gameMode, setGameMode] = useState<GameMode>("adventure");
  const [adventureState, setAdventureState] = useState<AdventureState>("select");
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);

  // Adventure progression
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() =>
    loadJSON(UNLOCKED_KEY, 1)
  );
  const [levelStars, setLevelStars] = useState<Record<number, number>>(() =>
    loadJSON(LEVEL_STARS_KEY, {})
  );
  const [levelScores, setLevelScores] = useState<Record<number, number>>(() =>
    loadJSON(LEVEL_SCORES_KEY, {})
  );

  // Free play options
  const [sizeIdx, setSizeIdx] = useState(1);

  // Active game parameters
  const size = gameMode === "adventure" && currentLevel ? currentLevel.size : SIZE_OPTIONS[sizeIdx].size;
  const limit = gameMode === "adventure" && currentLevel ? currentLevel.limit : SIZE_OPTIONS[sizeIdx].limit;
  const colorCount = gameMode === "adventure" && currentLevel ? currentLevel.colorCount : COLORS.length;

  // Game state
  const [board, setBoard] = useState<number[]>(() => generateBoard(SIZE_OPTIONS[1].size));
  const [history, setHistory] = useState<number[][]>([]);
  const [moves, setMoves] = useState(0);
  const [status, setStatus] = useState<Status>("playing");
  const [bestFreeMoves, setBestFreeMoves] = useState<Record<number, number>>(() => loadJSON(BEST_KEY, {}));
  const [, setBestFreeScore] = useState<Record<number, number>>(() => loadJSON(SCORES_KEY, {}));
  const [score, setScore] = useState(0);
  const [hintColor, setHintColor] = useState<number | null>(null);
  const [shake, setShake] = useState(false);

  // Audio & UI FX
  const [audioStarted, setAudioStarted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { bursts, spawn, remove } = useParticleBursts();
  const { gains, spawn: spawnGain } = useFloatingGains();
  const boardRef = useRef<HTMLDivElement>(null);

  // États UI avancés
  const [hoverColor, setHoverColor] = useState<number | null>(null);
  const [newCells, setNewCells] = useState<Set<number>>(new Set());
  const [combo, setCombo] = useState(0);
  const [bigGainFlash, setBigGainFlash] = useState(false);

  const cornerColor = board[0];
  const owned = useMemo(() => ownedFraction(board, size), [board, size]);
  const region = useMemo(() => getRegion(board, size), [board, size]);
  const previewCells = useMemo(() => {
    if (hoverColor === null || hoverColor === cornerColor || status !== "playing") return new Set<number>();
    return previewGain(board, size, hoverColor);
  }, [board, size, hoverColor, cornerColor, status]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  const startAudio = () => {
    audio.init();
    audio.setMusicEnabled(musicOn);
    audio.setSfxEnabled(sfxOn);
    audio.startMusic();
    setAudioStarted(true);
  };

  const resetGameState = () => {
    setHistory([]);
    setMoves(0);
    setStatus("playing");
    setScore(0);
    setHintColor(null);
    setShake(false);
    setCombo(0);
    setNewCells(new Set());
    setHoverColor(null);
    setBigGainFlash(false);
  };

  // Start specific Free play game
  const startFreeGame = useCallback((idx: number) => {
    const opt = SIZE_OPTIONS[idx];
    setSizeIdx(idx);
    setBoard(generateBoard(opt.size));
    resetGameState();
  }, []);

  // Start specific Adventure level
  const startAdventureLevel = useCallback((level: Level) => {
    setCurrentLevel(level);
    setAdventureState("playing");
    setBoard(generateLevelBoard(level));
    resetGameState();
  }, []);

  // Switch mode
  const switchMode = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === "free") {
      startFreeGame(sizeIdx);
    } else {
      setAdventureState("select");
    }
  };

  // Reset Campaign Progress
  const resetAdventureProgress = () => {
    if (window.confirm("Es-tu sûr de vouloir réinitialiser toute ta progression Aventure ?")) {
      setUnlockedLevel(1);
      setLevelStars({});
      setLevelScores({});
      localStorage.setItem(UNLOCKED_KEY, "1");
      localStorage.setItem(LEVEL_STARS_KEY, JSON.stringify({}));
      localStorage.setItem(LEVEL_SCORES_KEY, JSON.stringify({}));
    }
  };

  const triggerBurst = (colorIndex: number) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const sizeRect = Math.min(rect.width, rect.height);
    const cell = sizeRect / size;
    const cornerRect = boardRef.current.querySelector("[data-cell='0']")?.getBoundingClientRect();
    const x = cornerRect ? cornerRect.left + cornerRect.width / 2 : rect.left + cell / 2;
    const y = cornerRect ? cornerRect.top + cornerRect.height / 2 : rect.top + cell / 2;
    spawn(x, y, colorIndex);
  };

  const pickColor = (colorIndex: number) => {
    if (status !== "playing" || colorIndex >= colorCount) {
      if (sfxOn) audio.playInvalid();
      return;
    }
    if (colorIndex === cornerColor) {
      if (sfxOn) audio.playInvalid();
      // Petit shake visuel sur la palette pour signaler que c'est invalide
      return;
    }

    // Calcul des gains AVANT mutation pour les effets visuels
    const before = getRegion(board, size);
    const next = floodFill(board, size, colorIndex);
    const after = getRegion(next, size);
    const gained = new Set<number>();
    for (const idx of after) if (!before.has(idx)) gained.add(idx);
    const gainCount = gained.size;

    // Combo : si on gagne au moins 4 cellules, on incrémente le combo
    let nextCombo = combo;
    if (gainCount >= 4) {
      nextCombo = combo + 1;
      setCombo(nextCombo);
      if (sfxOn) audio.playCombo(nextCombo);
    } else {
      nextCombo = 0;
      setCombo(0);
    }

    // Flash spécial pour gros gains
    if (gainCount >= 10) {
      setBigGainFlash(true);
      setTimeout(() => setBigGainFlash(false), 500);
    }

    setHistory((h) => [...h, board]);
    const nextMoves = moves + 1;
    setBoard(next);
    setMoves(nextMoves);
    setNewCells(gained);
    setTimeout(() => setNewCells(new Set()), 600);

    if (sfxOn) audio.playPick(colorIndex);
    triggerBurst(colorIndex);

    // Indicateur flottant "+N"
    if (gainCount > 0 && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      spawnGain(
        gainCount,
        rect.left + rect.width / 2,
        rect.top + rect.height / 2 - 20,
        COLORS[colorIndex].hex
      );
    }

    if (isFlooded(next)) {
      const finalScore = computeScore(size, nextMoves, limit);
      const starsEarned = computeStars(nextMoves, limit);
      setScore(finalScore);
      setStatus("won");
      if (sfxOn) setTimeout(() => audio.playWin(), 250);

      if (gameMode === "adventure" && currentLevel) {
        // Save adventure records
        const lvlId = currentLevel.id;
        const nextUnlock = Math.max(unlockedLevel, lvlId + 1);
        setUnlockedLevel(nextUnlock);
        localStorage.setItem(UNLOCKED_KEY, JSON.stringify(nextUnlock));

        setLevelStars((prev) => {
          const cur = prev[lvlId] || 0;
          if (starsEarned > cur) {
            const upd = { ...prev, [lvlId]: starsEarned };
            localStorage.setItem(LEVEL_STARS_KEY, JSON.stringify(upd));
            return upd;
          }
          return prev;
        });

        setLevelScores((prev) => {
          const cur = prev[lvlId] || 0;
          if (finalScore > cur) {
            const upd = { ...prev, [lvlId]: finalScore };
            localStorage.setItem(LEVEL_SCORES_KEY, JSON.stringify(upd));
            return upd;
          }
          return prev;
        });
      } else {
        // Save free records
        setBestFreeMoves((prev) => {
          const cur = prev[size];
          if (cur === undefined || nextMoves < cur) {
            const updated = { ...prev, [size]: nextMoves };
            localStorage.setItem(BEST_KEY, JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
        setBestFreeScore((prev) => {
          const cur = prev[size];
          if (cur === undefined || finalScore > cur) {
            const updated = { ...prev, [size]: finalScore };
            localStorage.setItem(SCORES_KEY, JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }
    } else if (nextMoves >= limit) {
      setStatus("lost");
      if (sfxOn) setTimeout(() => audio.playLose(), 250);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  const undo = () => {
    if (status !== "playing" || history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setBoard(prev);
    setMoves((m) => Math.max(0, m - 1));
    setHintColor(null);
    setNewCells(new Set());
    setCombo(0);
    if (sfxOn) audio.playUndo();
  };

  const showHint = () => {
    if (status !== "playing") return;
    const c = bestNextColor(board, size);
    setHintColor(c);
    setTimeout(() => setHintColor(null), 1200);
  };

  // Sur l'ecran de selection des niveaux le plateau n'est pas affiche : sans ce garde,
  // les touches 1-6 jouaient quand meme des coups (et leurs sons) sur un plateau invisible.
  const boardVisible = gameMode === "free" || adventureState === "playing";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!boardVisible) return;
      if (!audioStarted && e.key >= "1" && e.key <= "6") {
        startAudio();
      }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= colorCount) pickColor(n - 1);
      if (e.key === "Backspace" || e.key === "z" || e.key === "Z") undo();
      if (e.key === "r" || e.key === "R") {
        if (gameMode === "adventure" && currentLevel) {
          startAdventureLevel(currentLevel);
        } else if (gameMode === "free") {
          startFreeGame(sizeIdx);
        }
      }
      if (e.key === "h" || e.key === "H") showHint();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  useEffect(() => {
    audio.setMusicEnabled(musicOn);
  }, [musicOn]);

  useEffect(() => {
    audio.setSfxEnabled(sfxOn);
  }, [sfxOn]);

  const movesLeft = limit - moves;
  const dangerZone = status === "playing" && movesLeft <= 4;
  const starsEarned = status === "won" ? computeStars(moves, limit) : 0;
  const nextCampaignLevel = currentLevel
    ? CAMPAIGN_LEVELS.find((l) => l.id === currentLevel.id + 1)
    : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-6">
      {!audioStarted && <StartOverlay onStart={startAudio} />}
      {status === "won" && <Confetti />}
      <ParticleBurstRenderer bursts={bursts} onDone={remove} />
      <FloatingGainRenderer gains={gains} />

      {/* Flash de fond pour gros gains */}
      {bigGainFlash && (
        <div className="pointer-events-none fixed inset-0 z-30 bg-white/10 animate-pulse" />
      )}

      {/* Animated blobs background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="blob blob-1 absolute -top-[20%] -left-[10%] h-[60vh] w-[60vh] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="blob blob-2 absolute top-[40%] -right-[10%] h-[50vh] w-[50vh] rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="blob blob-3 absolute -bottom-[10%] left-[20%] h-[55vh] w-[55vh] rounded-full bg-cyan-600/15 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950/80 to-slate-950" />
      </div>

      {/* Top Navbar: Mode Switcher & Fullscreen */}
      <div className="z-10 w-full max-w-4xl flex items-center justify-between gap-4 mb-6">
        {/* Game Mode Selector */}
        <div className="flex items-center rounded-2xl bg-slate-900/80 p-1.5 ring-1 ring-white/10 shadow-lg backdrop-blur-md">
          <button
            onClick={() => switchMode("adventure")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer",
              gameMode === "adventure"
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Map className="h-4 w-4" />
            <span>Aventure</span>
            {unlockedLevel > 1 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-black text-white">
                {unlockedLevel - 1}
              </span>
            )}
          </button>

          <button
            onClick={() => switchMode("free")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer",
              gameMode === "free"
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Gamepad2 className="h-4 w-4" />
            <span>Mode Libre</span>
          </button>
        </div>

        {/* Audio / Fullscreen Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMusicOn((v) => !v)}
            className={cn(
              "flex items-center justify-center h-10 w-10 rounded-xl ring-1 transition-all cursor-pointer",
              musicOn ? "bg-indigo-500/20 text-indigo-300 ring-indigo-500/30" : "bg-slate-900/60 text-slate-500 ring-white/10"
            )}
            title={musicOn ? "Couper la musique" : "Activer la musique"}
          >
            <Music className="h-4 w-4" />
          </button>

          <button
            onClick={() => setSfxOn((v) => !v)}
            className={cn(
              "flex items-center justify-center h-10 w-10 rounded-xl ring-1 transition-all cursor-pointer",
              sfxOn ? "bg-cyan-500/20 text-cyan-300 ring-cyan-500/30" : "bg-slate-900/60 text-slate-500 ring-white/10"
            )}
            title={sfxOn ? "Couper les effets sonores" : "Activer les effets sonores"}
          >
            {sfxOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white ring-1 ring-white/10 transition-all cursor-pointer shadow-lg"
            title={isFullscreen ? "Quitter le plein écran" : "Passer en plein écran"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mode Aventure : Écran de sélection des niveaux */}
      {gameMode === "adventure" && adventureState === "select" && (
        <LevelSelect
          unlockedLevel={unlockedLevel}
          levelStars={levelStars}
          levelScores={levelScores}
          onSelectLevel={startAdventureLevel}
          onResetProgress={resetAdventureProgress}
        />
      )}

      {/* Mode Jeu (Aventure ou Libre) */}
      {((gameMode === "adventure" && adventureState === "playing") || gameMode === "free") && (
        <div className="w-full max-w-[540px] flex flex-col items-center">
          {/* Back button for adventure mode */}
          {gameMode === "adventure" && currentLevel && (
            <div className="w-full flex items-center justify-between mb-4">
              <button
                onClick={() => setAdventureState("select")}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900/60 px-3 py-1.5 rounded-xl ring-1 ring-white/10 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Niveaux
              </button>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span className="text-indigo-400">#{currentLevel.id}</span>
                <span>{currentLevel.name}</span>
              </div>
              <div className="text-xs text-slate-400">
                {currentLevel.size}×{currentLevel.size}
              </div>
            </div>
          )}

          {/* Header instructions */}
          <header className="text-center mb-5 z-10 w-full">
            {gameMode === "free" && (
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
                <span className="bg-gradient-to-r from-rose-400 via-amber-400 via-40% to-cyan-400 bg-clip-text text-transparent">
                  Mode Libre
                </span>
              </h1>
            )}
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
              {gameMode === "adventure" && currentLevel ? (
                <span>{currentLevel.description}</span>
              ) : (
                <span>
                  Choisis les couleurs pour inonder le plateau à partir du{" "}
                  <span className="text-white font-semibold">coin supérieur gauche</span>.
                </span>
              )}
            </p>
          </header>

          {/* Free Play Size Selector */}
          {gameMode === "free" && (
            <div className="z-10 flex flex-wrap items-center justify-center gap-2 mb-4">
              {SIZE_OPTIONS.map((opt, i) => (
                <button
                  key={opt.label}
                  onClick={() => startFreeGame(i)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ring-1",
                    i === sizeIdx
                      ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30 scale-105 ring-white/20"
                      : "bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 ring-white/10"
                  )}
                >
                  {opt.label}
                  <span className="ml-1 opacity-70">
                    {opt.size}×{opt.size}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Game Controls Bar */}
          <div className="z-10 flex items-center justify-center gap-2 sm:gap-3 mb-4 w-full">
            <button
              onClick={() => {
                if (gameMode === "adventure" && currentLevel) startAdventureLevel(currentLevel);
                else startFreeGame(sizeIdx);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 ring-1 ring-white/10 transition-all cursor-pointer hover:text-white"
              title="Recommencer (R)"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Recommencer
            </button>

            <button
              onClick={undo}
              disabled={status !== "playing" || history.length === 0}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold ring-1 transition-all",
                status === "playing" && history.length > 0
                  ? "bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 hover:text-white ring-white/10 cursor-pointer"
                  : "bg-slate-900/30 text-slate-600 ring-white/5 cursor-not-allowed"
              )}
              title="Annuler (Z)"
            >
              <Undo2 className="h-3.5 w-3.5" /> Annuler
            </button>

            <button
              onClick={showHint}
              disabled={status !== "playing"}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold ring-1 transition-all",
                status === "playing"
                  ? "bg-slate-900/60 text-amber-300 hover:bg-slate-800/80 hover:text-amber-200 ring-amber-500/20 cursor-pointer"
                  : "bg-slate-900/30 text-slate-600 ring-white/5 cursor-not-allowed"
              )}
              title="Indice (H)"
            >
              <Lightbulb className="h-3.5 w-3.5" /> Indice
            </button>
          </div>

          {/* Badge Combo */}
          {combo >= 2 && status === "playing" && (
            <div className="z-10 mb-3 combo-pop">
              <div
                key={combo}
                className={cn(
                  "combo-shake inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-black shadow-xl ring-2 ring-white/30 text-sm",
                  combo >= 5
                    ? "bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400 text-white"
                    : combo >= 3
                      ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                      : "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white"
                )}
              >
                <span className="text-base">🔥</span>
                <span>COMBO ×{combo}</span>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="z-10 w-full mb-4 rounded-2xl bg-slate-900/50 p-4 ring-1 ring-white/10 backdrop-blur-md">
            <div className="flex items-end justify-between mb-2 text-sm">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Coups</div>
                <div className={cn("text-2xl font-black tabular-nums leading-none", dangerZone ? "text-rose-400" : "text-white")}>
                  <AnimatedNumber value={moves} />
                  <span className="text-base text-slate-500 font-semibold">/{limit}</span>
                </div>
              </div>

              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Restants</div>
                <div
                  className={cn(
                    "text-2xl font-black tabular-nums leading-none",
                    movesLeft <= 3 ? "text-rose-400" : movesLeft <= 6 ? "text-amber-400" : "text-emerald-400"
                  )}
                >
                  <AnimatedNumber value={movesLeft} />
                </div>
              </div>

              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Inondé</div>
                <div className="text-2xl font-black text-white tabular-nums leading-none">
                  <AnimatedNumber value={Math.round(owned * 100)} />%
                </div>
              </div>

              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Record</div>
                <div className="text-2xl font-black text-amber-300 tabular-nums leading-none">
                  {gameMode === "adventure" && currentLevel ? (
                    <span>{levelStars[currentLevel.id] !== undefined ? `${levelStars[currentLevel.id]} ★` : "—"}</span>
                  ) : (
                    <span>{bestFreeMoves[size] !== undefined ? `${bestFreeMoves[size]}` : "—"}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress moves */}
            <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden ring-1 ring-white/5">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  dangerZone ? "bg-gradient-to-r from-rose-500 to-orange-400" : "bg-gradient-to-r from-indigo-500 to-cyan-400"
                )}
                style={{ width: `${Math.min(100, (moves / limit) * 100)}%` }}
              />
            </div>

            {/* Progress flooded */}
            <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden ring-1 ring-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all duration-700 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                style={{ width: `${owned * 100}%` }}
              />
            </div>
          </div>

          {/* Main Board */}
          <div
            ref={boardRef}
            className={cn(
              "relative z-10 w-full aspect-square rounded-[2rem] p-2 sm:p-3 bg-slate-900/60 ring-1 ring-white/10 shadow-[0_0_60px_-15px_rgba(99,102,241,0.35)] backdrop-blur-sm transition-transform",
              shake && "board-shake"
            )}
          >
            <div
              className="grid h-full w-full gap-[2px] sm:gap-[3px] rounded-2xl overflow-hidden bg-slate-950/60 p-1 sm:p-1.5"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            >
              {board.map((cellVal, idx) => {
                const r = Math.floor(idx / size);
                const c = idx % size;
                const isCorner = idx === 0;
                const isRock = cellVal === -1;
                const isFloodedCell = region.has(idx);
                const isPreview = previewCells.has(idx);
                const isNew = newCells.has(idx);

                // Délai de propagation basé sur la position (effet vague depuis le coin)
                const diag = r + c;
                const colorTransitionDelay = isNew ? Math.min(diag * 18, 280) : 0;

                return (
                  <div
                    key={idx}
                    data-cell={idx}
                    className={cn(
                      "tile rounded-[3px] sm:rounded-[4px] flex items-center justify-center select-none",
                      status === "won" && !isRock && "cell-victory",
                      isCorner && !isRock && "cell-corner",
                      isRock && "tile-rock",
                      !isRock && isFloodedCell && !isCorner && status === "playing" && "tile-flooded",
                      isPreview && "tile-preview",
                      isNew && "tile-new"
                    )}
                    style={{
                      backgroundColor: isRock ? undefined : COLORS[cellVal]?.hex,
                      transitionDelay: `${colorTransitionDelay}ms`,
                      animationDelay:
                        status === "won"
                          ? `${diag * 30}ms`
                          : isNew
                            ? `${colorTransitionDelay}ms`
                            : undefined,
                    }}
                  >
                    {isRock && (
                      <span className="relative z-10 text-[10px] sm:text-xs opacity-80 select-none">🪨</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Corner symbol badge */}
            <div className="absolute -top-2.5 -left-2.5 h-8 w-8 rounded-full bg-gradient-to-br from-white to-slate-200 text-slate-900 text-sm font-black flex items-center justify-center shadow-lg shadow-white/20 ring-2 ring-slate-950">
              <Zap className="h-4 w-4 fill-current text-indigo-600" />
            </div>

            {/* End of game banners */}
            {status !== "playing" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[2rem] bg-slate-950/85 backdrop-blur-sm p-4">
                <div className="banner-in text-center w-full max-w-xs rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-7 ring-1 ring-white/15 shadow-2xl">
                  {status === "won" ? (
                    <>
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900 shadow-lg shadow-amber-500/30 trophy-pulse">
                        <Trophy className="h-8 w-8" />
                      </div>
                      <h2 className="mt-4 text-2xl font-black bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                        Victoire !
                      </h2>
                      <p className="mt-1 text-sm text-slate-300">
                        Inondé en <span className="font-bold text-white">{moves}</span> coups sur {limit}
                      </p>

                      <div className="mt-3 flex items-center justify-center gap-1">
                        {Array.from({ length: 3 }, (_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-7 w-7 transition-all duration-500",
                              i < starsEarned
                                ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                                : "text-slate-700 fill-slate-800"
                            )}
                          />
                        ))}
                      </div>

                      <div className="mt-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Score</div>
                        <div className="text-3xl font-black text-white tabular-nums">
                          <AnimatedNumber value={score} />
                        </div>
                      </div>

                      {/* Button next adventure level */}
                      {gameMode === "adventure" && nextCampaignLevel ? (
                        <div className="mt-5 space-y-2">
                          <button
                            onClick={() => startAdventureLevel(nextCampaignLevel)}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                          >
                            <span>Niveau Suivant</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (currentLevel) startAdventureLevel(currentLevel);
                            }}
                            className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            Rejouer ce niveau
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (gameMode === "adventure" && currentLevel) startAdventureLevel(currentLevel);
                            else startFreeGame(sizeIdx);
                          }}
                          className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                        >
                          Rejouer
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30">
                        <Skull className="h-8 w-8" />
                      </div>
                      <h2 className="mt-4 text-2xl font-black text-rose-400">À sec !</h2>
                      <p className="mt-1 text-sm text-slate-300">
                        Tu as inondé <span className="font-bold text-white">{Math.round(owned * 100)}%</span> du plateau
                      </p>
                      <p className="mt-2 text-xs text-slate-500">Essaye une stratégie différente.</p>

                      <button
                        onClick={() => {
                          if (gameMode === "adventure" && currentLevel) startAdventureLevel(currentLevel);
                          else startFreeGame(sizeIdx);
                        }}
                        className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                      >
                        Réessayer
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Color Active Palette */}
          <div className="z-10 mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
            {COLORS.slice(0, colorCount).map((c, i) => {
              const isCurrent = c.id === cornerColor;
              const disabled = status !== "playing" || isCurrent;
              const highlighted = hintColor === c.id;
              const isHovered = hoverColor === c.id;
              const previewSize = isHovered ? previewCells.size : 0;

              return (
                <button
                  key={c.id}
                  onClick={() => pickColor(c.id)}
                  onMouseEnter={() => {
                    if (status === "playing" && !isCurrent) {
                      setHoverColor(c.id);
                      if (sfxOn) audio.playHover(i);
                    }
                  }}
                  onMouseLeave={() => setHoverColor(null)}
                  disabled={disabled}
                  title={`${c.name} (touche ${i + 1})`}
                  className={cn(
                    "color-btn group relative h-12 w-12 sm:h-16 sm:w-16 rounded-2xl transition-all duration-200 ring-offset-2 ring-offset-slate-950 select-none",
                    isCurrent
                      ? "ring-2 ring-white scale-90 opacity-60 cursor-default"
                      : disabled
                        ? "opacity-40 cursor-default"
                        : "hover:scale-110 hover:-translate-y-1.5 active:scale-95 cursor-pointer",
                    highlighted && "ring-4 ring-amber-400 scale-110 animate-bounce-short",
                    isHovered && !isCurrent && "ring-2 ring-white scale-110 -translate-y-1.5"
                  )}
                  style={{
                    backgroundColor: c.hex,
                    boxShadow: !disabled
                      ? isHovered
                        ? `0 16px 36px -8px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.35), 0 0 0 4px ${c.glow}`
                        : `0 10px 28px -8px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`
                      : undefined,
                  }}
                >
                  <span className="absolute bottom-1 right-1.5 z-10 text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                    {i + 1}
                  </span>
                  {isCurrent && (
                    <span className="absolute inset-0 z-10 flex items-center justify-center text-white font-black drop-shadow text-lg">
                      ✓
                    </span>
                  )}
                  {highlighted && (
                    <span className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-900 text-[10px] font-black shadow-lg">
                      ?
                    </span>
                  )}
                  {/* Aperçu du gain au survol */}
                  {isHovered && previewSize > 0 && (
                    <span
                      className="combo-pop absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 rounded-full bg-white/95 text-slate-900 px-2 py-0.5 text-[10px] font-black shadow-xl whitespace-nowrap"
                    >
                      +{previewSize}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="z-10 mt-4 text-center text-[11px] text-slate-500">
            Astuce : touches <span className="font-semibold text-slate-300">1–{colorCount}</span> pour choisir,{" "}
            <span className="font-semibold text-slate-300">Z</span> annuler,{" "}
            <span className="font-semibold text-slate-300">H</span> indice.
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="z-10 mt-auto pt-10 pb-4 text-center text-[11px] text-slate-600">
        <p>
          Créé avec passion par <span className="font-semibold text-slate-400">Hylst - Geoffroy</span> avec l'aide d'une IA.
        </p>
        <p className="mt-1">© {new Date().getFullYear()} Tache d’Huile. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
