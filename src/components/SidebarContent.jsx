import { m } from "framer-motion";
import { useStore, fmt } from "../store/quizStore.js";
import { useGameStore } from "../useGameStore.js";
import { IconBrain, IconFlame, IconArrowLeft } from "@tabler/icons-react";

export function SidebarContent({ onClose }) {
  const { preguntaActual, respuestas, tiempoRestante, modo, clase, preguntas } = useStore();
  const streak = useGameStore((s) => s.streak);
  const urgente = tiempoRestante < 120;
  const correctasHasta = Object.entries(respuestas).filter(([i, r]) => preguntas[+i]?.correcta === r).length;

  return (
    <div className="flex flex-col p-5 gap-4 h-full overflow-y-auto">
      <div className="hidden md:flex items-center gap-2 mb-1">
        <button type="button" onClick={() => useStore.getState().reiniciar()} className="flex items-center gap-2 bg-transparent border-0 p-0 hover:opacity-80 transition-opacity">
          <img src="/logo_new.png" alt="Maneja" className="w-7 h-7 object-contain" style={{ filter: "drop-shadow(0 2px 6px rgba(60,120,255,0.4))" }} />
        </button>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${modo === "examen" ? "bg-blue-500/20 text-blue-400" : modo === "inteligente" ? "bg-pink-500/20 text-pink-400" : "bg-amber-500/20 text-amber-400"}`}>
          {modo === "examen" ? "Examen" : modo === "inteligente" ? <IconBrain size={14} /> : "Estudio"}
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${clase === "C" ? "bg-orange-500/20 text-orange-400" : "bg-slate-700/60 text-slate-400"}`}>
          {clase === "C" ? "C" : "B"}
        </span>
      </div>
      {modo !== "inteligente" && (
      <div className={`hidden md:block rounded-2xl border p-4 text-center ${urgente ? "border-red-500/40 bg-red-500/5" : "border-slate-700/60 bg-slate-800/40"}`}>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Tiempo restante</p>
        <m.p animate={{ color: urgente ? "#f87171" : "#ffffff" }} className="text-3xl font-black font-mono">
          {fmt(tiempoRestante)}
        </m.p>
        {urgente && <p className="text-xs text-red-400 mt-1 font-medium">¡Apúrate!</p>}
      </div>
      )}

      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>Progreso</span>
          <div className="flex items-center gap-2">
            {streak >= 2 && (
              <span className="flex items-center gap-0.5 font-black" style={{ color: "#fb923c" }}>
                <m.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ filter: "drop-shadow(0 0 4px #f97316)", color: "#f97316" }}><IconFlame size={14} /></m.span>
                <span style={{ fontSize: "12px" }}>{streak}</span>
              </span>
            )}
            <span>{preguntaActual + 1} / {preguntas.length}</span>
          </div>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
          <m.div
            className={`h-full w-full rounded-full ${modo === "examen" ? "bg-blue-500" : modo === "inteligente" ? "bg-pink-500" : "bg-amber-500"}`}
            style={{ transformOrigin: "left" }}
            animate={{ scaleX: (preguntaActual + 1) / preguntas.length }}
            transition={{ duration: 0.4 }}
          />
        </div>
        {(modo === "estudio" || modo === "inteligente") && (
          <div className="flex justify-between text-xs">
            <span className="text-emerald-400 font-semibold">{correctasHasta} correctas</span>
            <span className="text-red-400 font-semibold">{Object.keys(respuestas).length - correctasHasta} incorrectas</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Preguntas</p>
        <div className={`grid gap-1 ${modo === "inteligente" ? "grid-cols-10" : "grid-cols-7 gap-1.5"}`}>
          {preguntas.map((p, i) => {
            const resp = respuestas[i];
            const esActual = i === preguntaActual;
            const respondida = resp !== undefined;
            const correcta = (modo === "estudio" || modo === "inteligente") && resp === preguntas[i]?.correcta;
            const incorrecta = (modo === "estudio" || modo === "inteligente") && respondida && resp !== preguntas[i]?.correcta;
            return (
              <button type="button" key={p.id ?? i}
                onClick={() => { if (modo === "estudio" || modo === "inteligente") { useStore.setState({ preguntaActual: i }); if (onClose) onClose(); } }}
                className={`${modo === "inteligente" ? "w-5 h-5 rounded text-[9px]" : "w-7 h-7 rounded-lg text-xs"} font-bold transition-all flex items-center justify-center ${
                  esActual ? (modo === "examen" ? "bg-blue-500 text-white scale-110" : modo === "inteligente" ? "bg-pink-500 text-white" : "bg-amber-500 text-white scale-110") :
                  correcta ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" :
                  incorrecta ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                  respondida ? "bg-slate-600/40 text-slate-400 border border-slate-600/40" :
                  "bg-slate-800 text-slate-500 border border-slate-700"
                } ${modo === "examen" ? "cursor-default" : "hover:border-slate-500"}`}>
                {modo === "inteligente" ? "" : i + 1}
              </button>
            );
          })}
        </div>
        {modo === "examen" && <p className="text-xs text-slate-600 mt-3">No puedes navegar entre preguntas en modo examen.</p>}
      </div>

      <button type="button" onClick={() => useStore.getState().reiniciar()}
        className="md:hidden mt-4 border border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300 text-sm font-semibold py-2.5 rounded-xl transition-all bg-transparent outline-none">
        <IconArrowLeft size={14} className="inline -mt-0.5 mr-1" /> Salir al inicio
      </button>
    </div>
  );
}

