import { Lock, Play, Sparkles, Star, Trophy } from "lucide-react";
import { CAMPAIGN_LEVELS, type Level } from "../game/levels";
import { cn } from "../utils/cn";

interface LevelSelectProps {
  unlockedLevel: number;
  levelStars: Record<number, number>;
  levelScores: Record<number, number>;
  onSelectLevel: (level: Level) => void;
  onResetProgress: () => void;
}

export function LevelSelect({
  unlockedLevel,
  levelStars,
  levelScores,
  onSelectLevel,
  onResetProgress,
}: LevelSelectProps) {
  const totalStars = Object.values(levelStars).reduce((a, b) => a + b, 0);
  const totalMaxStars = CAMPAIGN_LEVELS.length * 3;

  // Group levels by theme
  const chapters = [
    { theme: "L'Éveil Chromatique", levels: CAMPAIGN_LEVELS.slice(0, 6), color: "from-rose-500 to-amber-500" },
    { theme: "Les Labyrinthes de Cristal", levels: CAMPAIGN_LEVELS.slice(6, 12), color: "from-amber-500 to-emerald-500" },
    { theme: "Le Gouffre des Nuances", levels: CAMPAIGN_LEVELS.slice(12, 18), color: "from-indigo-500 to-violet-500" },
    { theme: "L'Ascension des Maîtres", levels: CAMPAIGN_LEVELS.slice(18, 24), color: "from-cyan-500 to-blue-600" },
  ];

  return (
    <div className="z-10 w-full max-w-4xl px-4 py-6">
      {/* Campaign Header & Summary */}
      <div className="mb-8 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-800/80 p-6 sm:p-8 ring-1 ring-white/10 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300 ring-1 ring-indigo-500/20 mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Progression Aventure
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Mode Niveaux</h2>
          <p className="mt-2 text-slate-300 text-sm max-w-md">
            Parcours les 4 mondes chromatiques. Gagne des étoiles pour prouver ta maîtrise de l'inondation stratégique.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 w-full sm:w-auto">
          <div className="rounded-2xl bg-slate-950/60 p-4 ring-1 ring-white/10 text-center min-w-[120px]">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1">
              <Star className="h-3 w-3 fill-current" /> Étoiles
            </div>
            <div className="mt-1 text-2xl font-black text-white tabular-nums">
              {totalStars} <span className="text-sm font-bold text-slate-500">/ {totalMaxStars}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950/60 p-4 ring-1 ring-white/10 text-center min-w-[120px]">
            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center justify-center gap-1">
              <Trophy className="h-3 w-3" /> Prog.
            </div>
            <div className="mt-1 text-2xl font-black text-white tabular-nums">
              {Math.round((Object.keys(levelStars).length / CAMPAIGN_LEVELS.length) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Chapters list */}
      <div className="space-y-12">
        {chapters.map((chap, chapIdx) => (
          <div key={chap.theme} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br font-black text-white text-sm shadow-lg", chap.color)}>
                {chapIdx + 1}
              </span>
              <h3 className="text-xl font-black text-white tracking-tight">{chap.theme}</h3>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent ml-2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {chap.levels.map((lvl) => {
                const isUnlocked = lvl.id <= unlockedLevel;
                const starsEarned = levelStars[lvl.id] || 0;
                const bestScore = levelScores[lvl.id];

                return (
                  <button
                    key={lvl.id}
                    onClick={() => onSelectLevel(lvl)}
                    disabled={!isUnlocked}
                    className={cn(
                      "group relative text-left rounded-2xl p-5 transition-all duration-200 ring-1 flex flex-col justify-between overflow-hidden min-h-[140px]",
                      isUnlocked
                        ? "bg-slate-900/70 hover:bg-slate-800/90 ring-white/10 hover:ring-indigo-500/50 hover:scale-[1.02] shadow-xl cursor-pointer"
                        : "bg-slate-950/40 ring-white/5 opacity-50 cursor-not-allowed"
                    )}
                  >
                    {/* Top detail */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-400 group-hover:text-white transition-colors">
                            #{lvl.id}
                          </span>
                          <h4 className="text-base font-black text-white">{lvl.name}</h4>
                        </div>
                        <p className="mt-1 text-xs text-slate-400 line-clamp-2">{lvl.description}</p>
                      </div>

                      {isUnlocked ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500 text-indigo-400 group-hover:text-white transition-all shadow">
                          <Play className="h-4 w-4 fill-current ml-0.5" />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/80 text-slate-500">
                          <Lock className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Bottom detail / stars */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <div className="text-slate-400 font-semibold flex items-center gap-2">
                        <span>{lvl.size}×{lvl.size}</span>
                        <span>•</span>
                        <span>{lvl.colorCount} coul.</span>
                      </div>

                      {isUnlocked && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 3 }, (_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-4 w-4",
                                i < starsEarned
                                  ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                                  : "text-slate-700 fill-slate-800/80"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Badge si record */}
                    {bestScore && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500/20 to-transparent px-3 py-0.5 text-[10px] font-bold text-amber-300 rounded-bl-lg">
                        {bestScore} pts
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Reset footer */}
      <div className="mt-16 text-center">
        <button
          onClick={onResetProgress}
          className="text-xs text-rose-500/70 hover:text-rose-400 underline transition-colors cursor-pointer"
        >
          Réinitialiser la progression Aventure
        </button>
      </div>
    </div>
  );
}
