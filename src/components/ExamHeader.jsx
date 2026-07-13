import { m } from "framer-motion";
import { useStore, fmt } from "../store/quizStore.js";
import { LivesDisplay } from "../FreemiumUI.jsx";

const PROGRESS_BAR_COLOR_MAP = {
  examen:     { bar: "#3b82f6", glow: "rgba(59,130,246,0.7)",  shimmer: "rgba(147,197,253,0.9)" },
  estudio:    { bar: "#f59e0b", glow: "rgba(245,158,11,0.7)",  shimmer: "rgba(253,230,138,0.9)" },
  inteligente:{ bar: "#ec4899", glow: "rgba(236,72,153,0.7)",  shimmer: "rgba(249,168,212,0.9)" },
};

export function ProgressTopBar() {
  const { preguntaActual, preguntas, modo } = useStore();
  const pct = preguntas.length > 0 ? ((preguntaActual + 1) / preguntas.length) * 100 : 0;
  const col = PROGRESS_BAR_COLOR_MAP[modo] || PROGRESS_BAR_COLOR_MAP.examen;

  return (
    <div className="absolute top-0 left-0 right-0 z-50" style={{ height: "3px", pointerEvents: "none" }}>
      <div className="w-full h-full" style={{ background: "rgba(255,255,255,0.06)" }} />
      <m.div
        className="absolute top-0 left-0 h-full w-full"
        animate={{ scaleX: pct / 100 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          background: col.bar,
          boxShadow: `0 0 12px 3px ${col.glow}`,
          borderRadius: "0 2px 2px 0",
          overflow: "hidden",
          transformOrigin: "left",
        }}
      >
        <m.div
          className="absolute inset-0"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
          style={{
            width: "45%",
            background: `linear-gradient(90deg, transparent, ${col.shimmer}, transparent)`,
          }}
        />
      </m.div>
    </div>
  );
}

function ClaseBadgeMobile() {
  const { clase } = useStore();
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${clase === "C" ? "bg-orange-500/20 text-orange-400 border-orange-500/20" : "bg-slate-700/60 text-slate-400 border-slate-600/30"}`}>
      {clase}
    </span>
  );
}

export function TopBar({ onMenuToggle, showMenu }) {
  const { tiempoRestante, modo } = useStore();
  const urgente = tiempoRestante < 120;
  const esExamen = modo === "examen";
  return (
    <div
      className="flex items-center justify-between px-4 border-b border-white/5 flex-shrink-0 md:hidden"
      style={{
        minHeight: 56,
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
        paddingLeft: "calc(env(safe-area-inset-left, 0px) + 16px)",
        paddingRight: "calc(env(safe-area-inset-right, 0px) + 16px)",
        background: "rgba(10,15,26,0.85)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {/* LOGO — siempre clickeable para volver al menú */}
      <button type="button"
        onClick={() => useStore.getState().reiniciar()}
        className="flex items-center gap-2.5 bg-transparent border-0 p-0 hover:opacity-80 transition-opacity flex-shrink-0"
      >
        <img src="/logo_new.png" alt="Maneja" className="w-7 h-7 object-contain" style={{ filter: "drop-shadow(0 2px 6px rgba(60,120,255,0.4))" }} />
      </button>

      {/* Timer: siempre visible en examen, badge + info en otros */}
      <div className="flex items-center gap-2">
        {esExamen && (
          <m.span
            animate={urgente ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
            className={`font-mono font-black text-sm ${urgente ? "text-red-400" : "text-blue-300"}`}>
            ⏱ {fmt(tiempoRestante)}
          </m.span>
        )}
        {!esExamen && modo !== "inteligente" && urgente && (
          <m.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
            className="font-mono font-black text-sm text-red-400">
            {fmt(tiempoRestante)}
          </m.span>
        )}
        {/* Corazones solo en estudio */}
        {modo === "estudio" && (
          <LivesDisplay size="sm" />
        )}
        {/* Modo inteligente: mostrar badge modo + clase */}
        {modo === "inteligente" && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/20">
              🧠 Inteligente
            </span>
            <ClaseBadgeMobile />
          </div>
        )}
        {/* Estudio sin urgencia: badge modo */}
        {modo === "estudio" && !urgente && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
            Estudio
          </span>
        )}
      </div>
    </div>
  );
}

