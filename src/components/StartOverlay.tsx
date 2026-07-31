import { Volume2 } from "lucide-react";

export default function StartOverlay({ onStart }: { onStart: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-6">
      <div className="max-w-sm w-full text-center rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 ring-1 ring-white/10 shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
          <Volume2 className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-rose-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
            Tache d&rsquo;Huile
          </span>
        </h1>
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">
          Le puzzle qui se répand
        </p>
        <h2 className="mt-5 text-lg font-black text-white">Prêt à jouer ?</h2>
        <p className="mt-2 text-sm text-slate-400">
          Active le son pour profiter de la musique d'ambiance et des effets sonores générés en temps réel.
        </p>
        <button
          onClick={onStart}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          Démarrer l'expérience
        </button>
      </div>
    </div>
  );
}
