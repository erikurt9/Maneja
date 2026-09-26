import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { IconArrowRight, IconConfetti } from "@tabler/icons-react";
import { useStore } from "../store/quizStore.js";
import { ProgressTopBar, TopBar } from "../components/ExamHeader.jsx";
import { SidebarContent } from "../components/SidebarContent.jsx";
import { ImagenPregunta, InfoPanel } from "../components/QuizQuestionUI.jsx";

export default function ModoEstudio() {
  const { preguntaActual, respuestas, tick, preguntas } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { const t = setInterval(tick, 1000); return () => clearInterval(t); }, [tick]);

  const pregunta = preguntas[preguntaActual];
  if (!pregunta) return null;
  const respuestaGuardada = respuestas[preguntaActual];
  const yaRespondida = respuestaGuardada !== undefined;
  const esUltima = preguntaActual === preguntas.length - 1;
  const correctasHasta = Object.entries(respuestas).filter(([i, r]) => preguntas[+i]?.correcta === r).length;

  return (
    <div className="flex w-full h-full overflow-hidden relative">
      <ProgressTopBar />
      {/* Sidebar desktop */}
      <div className="hidden md:flex w-72 flex-shrink-0 border-r border-slate-800 flex-col"><SidebarContent /></div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar solo móvil */}
        <TopBar onMenuToggle={() => setMenuOpen(!menuOpen)} showMenu={menuOpen} />
        <AnimatePresence>
          {menuOpen && (
            <m.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden border-b border-slate-800 overflow-y-auto bg-slate-900/98 flex-shrink-0"
              style={{ maxHeight: "82vh" }}>
              <SidebarContent onClose={() => setMenuOpen(false)} />
            </m.div>
          )}
        </AnimatePresence>
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 md:px-12 flex flex-col justify-start pt-8 md:pt-12 max-w-3xl mx-auto w-full pb-10">
            <AnimatePresence mode="wait">
              <m.div key={preguntaActual} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <span className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-4 block">
                  Pregunta {preguntaActual + 1} de {preguntas.length}
                </span>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-8">
                  <m.div className="h-full w-full bg-blue-400" style={{ transformOrigin: "left" }} initial={false} animate={{ scaleX: (preguntaActual + 1) / preguntas.length }} transition={{ duration: 0.35, ease: "easeOut" }} />
                </div>
                <ImagenPregunta src={pregunta.imagen} />
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug max-w-2xl mb-8 tracking-tight">{pregunta.pregunta}</h2>
                <div className="flex flex-col gap-3">
                  {pregunta.opciones.map((op, i) => {
                    const esCorrecta = i === pregunta.correcta;
                    const esElegida = i === respuestaGuardada;
                    const estilo = !yaRespondida
                      ? "border-slate-700/60 bg-slate-800/40 text-slate-200 hover:border-amber-400 hover:bg-slate-700/60 hover:shadow-lg hover:shadow-amber-500/10"
                      : esCorrecta
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                        : esElegida
                          ? "border-red-500 bg-red-500/10 text-red-300"
                          : "border-slate-700/30 bg-slate-800/20 text-slate-500 cursor-default";
                    return (
                      <m.button key={`${pregunta.id}-${i}`}
                        onClick={() => !yaRespondida && useStore.getState().responder(i)}
                        disabled={yaRespondida}
                        whileTap={!yaRespondida ? { scale: 0.98 } : {}}
                        whileHover={!yaRespondida ? { scale: 1.01 } : {}}
                        animate={yaRespondida && esElegida && !esCorrecta ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                        transition={{ duration: 0.3 }}
                        className={`text-left px-5 md:px-7 py-4 rounded-2xl border-2 transition-all duration-150 text-base font-medium ${estilo}`}>
                        <span className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-xl border-2 border-current flex items-center justify-center flex-shrink-0 font-black text-sm ${yaRespondida && (esCorrecta || esElegida) ? (esCorrecta ? "bg-emerald-500/20" : "bg-red-500/20") : ""}`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{op}</span>
                        </span>
                      </m.button>
                    );
                  })}
                </div>
                <AnimatePresence>
                  {yaRespondida && (
                    <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">
                      <InfoPanel
                        pregunta={pregunta}
                        respuestaGuardada={respuestaGuardada}
                        yaRespondida={yaRespondida}
                        correctasHasta={correctasHasta}
                        preguntas={preguntas}
                        respuestas={respuestas}
                      />
                      <m.button
                        onClick={() => useStore.getState().siguiente()}
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="mt-6 w-full md:w-auto px-8 py-3 font-bold rounded-xl transition-all text-sm text-white border-0 outline-none"
                        style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}>
                        {esUltima
                          ? <><IconConfetti size={15} className="inline -mt-0.5 mr-1" /> Ver resultados</>
                          : <>Siguiente <IconArrowRight size={15} className="inline -mt-0.5" /></>}
                      </m.button>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}