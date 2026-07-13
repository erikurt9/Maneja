import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useStore } from "../store/quizStore.js";
import { useGameStore } from "../useGameStore.js";
import { ProgressTopBar, TopBar } from "../components/ExamHeader.jsx";
import { SidebarContent } from "../components/SidebarContent.jsx";
import { ImagenPregunta, InfoPanel } from "../components/QuizQuestionUI.jsx";

const OPCION_ESTILOS = {
  neutro: "border-slate-700/60 bg-slate-800/40 text-slate-200 hover:border-amber-400 hover:bg-slate-700/60 cursor-pointer",
  correcta: "border-emerald-500 bg-emerald-500/10 text-emerald-300 cursor-default",
  incorrecta: "border-red-500 bg-red-500/10 text-red-300 cursor-default",
  deshabilitado: "border-slate-700/30 bg-slate-800/20 text-slate-500 cursor-default",
};

export default function ModoEstudio() {
  const { preguntaActual, respuestas, tick, siguiente, preguntas } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { const t = setInterval(tick, 1000); return () => clearInterval(t); }, [tick]);

  const pregunta = preguntas[preguntaActual];
  if (!pregunta) return null;
  const respuestaGuardada = respuestas[preguntaActual];
  const yaRespondida = respuestaGuardada !== undefined;
  const correctasHasta = Object.entries(respuestas).filter(([i, r]) => preguntas[+i]?.correcta === r).length;

  const estadoOpcion = (i) => {
    if (!yaRespondida) return "neutro";
    if (i === pregunta.correcta) return "correcta";
    if (i === respuestaGuardada) return "incorrecta";
    return "neutro";
  };

  return (
    <div className="flex w-full h-full overflow-hidden relative">
      <ProgressTopBar />
      {/* Sidebar desktop */}
      <div className="hidden md:flex w-72 flex-shrink-0 border-r border-slate-800 flex-col"><SidebarContent /></div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuToggle={() => setMenuOpen(!menuOpen)} showMenu={menuOpen} />
        <AnimatePresence>
          {menuOpen && (
            <m.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden border-b border-slate-800 overflow-y-auto bg-slate-900/98 flex-shrink-0 backdrop-blur-xl"
              style={{ maxHeight: "82vh" }}>
              <SidebarContent onClose={() => setMenuOpen(false)} />
            </m.div>
          )}
        </AnimatePresence>
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Columna principal pregunta */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 md:px-12 flex flex-col pt-8 max-w-3xl mx-auto w-full pb-4">
                <AnimatePresence mode="wait">
                  <m.div key={preguntaActual} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                    <span className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-4 block">
                      Pregunta {preguntaActual + 1} de {preguntas.length}
                    </span>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-8">
                      <m.div className="h-full w-full bg-amber-400" style={{ transformOrigin: "left" }} animate={{ scaleX: (preguntaActual + 1) / preguntas.length }} transition={{ duration: 0.35, ease: "easeOut" }} initial={false} />
                    </div>
                    <ImagenPregunta src={pregunta.imagen} />
                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug max-w-2xl mb-8 tracking-tight">{pregunta.pregunta}</h2>
                    <div className="flex flex-col gap-3">
                      {pregunta.opciones.map((op, i) => {
                        const estado = estadoOpcion(i);
                        return (
                          <m.button whileTap={{ scale: 0.98 }} key={`${pregunta.id}-${i}`}
                            onClick={() => { if (!yaRespondida) { const prev = respuestaGuardada; useStore.getState().responder(i); setTimeout(() => { const r = useStore.getState().respuestas[preguntaActual]; if (r !== undefined && r !== pregunta.correcta) { const { dead } = useGameStore.getState().loseLife(); if (dead) window.__showNoLivesModal?.(); } }, 50); } }}
                            disabled={yaRespondida}
                            className={`text-left px-5 md:px-7 py-4 rounded-2xl border-2 transition-all duration-200 text-base font-medium ${yaRespondida && estado === "neutro" ? OPCION_ESTILOS.deshabilitado : OPCION_ESTILOS[estado]}`}
                            animate={estado === "correcta" ? { scale: [1, 1.015, 1] } : estado === "incorrecta" ? { x: [0, -8, 8, -5, 5, 0] } : {}}
                            whileHover={!yaRespondida ? { scale: 1.01 } : {}}
                            transition={{ duration: 0.35 }}>
                            <span className="flex items-center gap-4">
                              <span className={`w-8 h-8 rounded-xl border-2 border-current flex items-center justify-center flex-shrink-0 font-black text-sm ${estado === "correcta" ? "bg-emerald-500/20" : estado === "incorrecta" ? "bg-red-500/20" : ""}`}>
                                {estado === "correcta" ? "✓" : estado === "incorrecta" ? "✗" : String.fromCharCode(65 + i)}
                              </span>
                              <span className="flex-1">{op}</span>
                            </span>
                          </m.button>
                        );
                      })}
                    </div>
                    {/* Info panel solo en móvil/tablet */}
                    <div className="lg:hidden mt-6 mb-4">
                      <InfoPanel pregunta={pregunta} respuestaGuardada={respuestaGuardada} yaRespondida={yaRespondida} correctasHasta={correctasHasta} preguntas={preguntas} respuestas={respuestas} />
                    </div>
                  </m.div>
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 md:px-12 py-4 border-t border-slate-800 flex-shrink-0">
              <button type="button" onClick={() => useStore.setState({ preguntaActual: Math.max(0, preguntaActual - 1) })} disabled={preguntaActual === 0}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold text-sm bg-transparent outline-none">
                ← Anterior
              </button>
              <AnimatePresence>
                {yaRespondida && (
                  <m.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} onClick={siguiente}
                    className="px-8 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 text-sm">
                    {preguntaActual < preguntas.length - 1 ? "Siguiente →" : "Ver resultado"}
                  </m.button>
                )}
              </AnimatePresence>
            </div>
          </div>
          {/* Panel info solo en desktop grande */}
          <div className="hidden lg:flex w-80 flex-shrink-0 flex-col gap-4 p-6 overflow-y-auto border-l border-slate-800/60">
            <InfoPanel pregunta={pregunta} respuestaGuardada={respuestaGuardada} yaRespondida={yaRespondida} correctasHasta={correctasHasta} preguntas={preguntas} respuestas={respuestas} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INICIO ───────────────────────────────────────────────────────────────────
