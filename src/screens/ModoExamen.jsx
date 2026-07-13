import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useStore } from "../store/quizStore.js";
import { ProgressTopBar, TopBar } from "../components/ExamHeader.jsx";
import { SidebarContent } from "../components/SidebarContent.jsx";
import { ImagenPregunta } from "../components/QuizQuestionUI.jsx";

export default function ModoExamen() {
  const { preguntaActual, respuestas, tick, preguntas } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { const t = setInterval(tick, 1000); return () => clearInterval(t); }, [tick]);

  const pregunta = preguntas[preguntaActual];
  if (!pregunta) return null;
  const respuestaGuardada = respuestas[preguntaActual];
  const yaRespondida = respuestaGuardada !== undefined;

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
              className="md:hidden border-b border-slate-800 overflow-y-auto bg-slate-900/98 flex-shrink-0 backdrop-blur-xl"
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
                  {pregunta.opciones.map((op, i) => (
                    <m.button key={`${pregunta.id}-${i}`}
                      onClick={() => !yaRespondida && useStore.getState().responder(i)}
                      disabled={yaRespondida}
                      whileTap={!yaRespondida ? { scale: 0.98 } : {}}
                      whileHover={!yaRespondida ? { scale: 1.01 } : {}}
                      className={`text-left px-5 md:px-7 py-4 rounded-2xl border-2 transition-all duration-150 text-base font-medium ${
                        yaRespondida && i === respuestaGuardada ? "border-blue-500 bg-blue-500/10 text-blue-200" :
                        yaRespondida ? "border-slate-700/30 bg-slate-800/20 text-slate-500 cursor-default" :
                        "border-slate-700/60 bg-slate-800/40 text-slate-200 hover:border-blue-400 hover:bg-slate-700/60 hover:shadow-lg hover:shadow-blue-500/10"
                      }`}>
                      <span className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-xl border-2 border-current flex items-center justify-center flex-shrink-0 font-black text-sm ${yaRespondida && i === respuestaGuardada ? "bg-blue-500/20" : ""}`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1">{op}</span>
                      </span>
                    </m.button>
                  ))}
                </div>
                <AnimatePresence>
                  {yaRespondida && (
                    <m.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-slate-500 text-sm flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Respuesta registrada · Pasando a la siguiente pregunta...
                    </m.p>
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

