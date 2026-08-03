import { useState, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { IconArrowRight, IconCheck, IconX, IconStar, IconBulb } from "@tabler/icons-react";

function QuestionNavBar({ preguntas, respuestas, activoIdx, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5 p-3">
      {preguntas.map((p, i) => {
        const ok = respuestas[i] === p.correcta;
        const esActivo = i === activoIdx;
        return (
          <button type="button"
            key={p.id ?? i}
            onClick={() => onSelect(i)}
            className={`w-8 h-8 rounded-lg text-xs font-black transition-all border-2 outline-none flex-shrink-0 ${
              esActivo
                ? ok
                  ? "bg-emerald-500 border-emerald-400 text-white scale-110 shadow-lg shadow-emerald-500/30"
                  : "bg-red-500 border-red-400 text-white scale-110 shadow-lg shadow-red-500/30"
                : ok
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/40"
                  : "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/40"
            }`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
export function RevisionContent({ preguntas, respuestas, user, guardado, guardando, onShowAuth }) {
  const [activoIdx, setActivoIdx] = useState(0);
  const preguntaRefs = useRef([]);

  const scrollToQuestion = (i) => {
    setActivoIdx(i);
    preguntaRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-0 py-5 md:py-0">
      <div className="w-full max-w-4xl md:mx-auto">
        <AnimatePresence>
          {!user && !guardado && (
            <m.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 rounded-2xl border border-blue-500/30 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              style={{ background: "rgba(59,130,246,0.06)" }}>
              <div className="flex-1">
                <p className="text-white font-bold text-sm mb-1">¿Quieres guardar tu progreso?</p>
                <p className="text-slate-400 text-xs leading-relaxed">Crea una cuenta gratis para llevar historial, racha de días y ver tus errores por categoría.</p>
              </div>
              <button type="button" onClick={onShowAuth}
                className="flex-shrink-0 bg-blue-500 hover:bg-blue-400 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm outline-none border-0">
                Registrarse gratis <IconArrowRight size={14} className="inline -mt-0.5" />
              </button>
            </m.div>
          )}
          {guardando && (
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mb-4 rounded-2xl border border-slate-700/40 bg-slate-800/40 p-3 text-slate-500 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" /> Guardando resultado...
            </m.div>
          )}
        </AnimatePresence>

        {/* Barra navegadora de preguntas */}
        <div className="mb-6 rounded-2xl border border-slate-700/50 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="px-4 pt-3 pb-0 flex items-center gap-3">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Navegar</span>
            <div className="flex items-center gap-3 ml-auto">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50 inline-block" />
                {preguntas.filter((p, i) => respuestas[i] === p.correcta).length} correctas
              </span>
              <span className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50 inline-block" />
                {preguntas.filter((p, i) => respuestas[i] !== p.correcta).length} incorrectas
              </span>
            </div>
          </div>
          <QuestionNavBar preguntas={preguntas} respuestas={respuestas} activoIdx={activoIdx} onSelect={scrollToQuestion} />
        </div>

        <div className="space-y-4 md:space-y-6">
          {preguntas.map((p, i) => {
            const ok = respuestas[i] === p.correcta;
            return (
              <m.div key={p.id ?? i} ref={el => preguntaRefs.current[i] = el} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                onClick={() => setActivoIdx(i)}
                className={`rounded-2xl border cursor-pointer ${ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"} ${activoIdx === i ? ok ? "ring-2 ring-emerald-500/40" : "ring-2 ring-red-500/40" : ""}`}>
                <div className="px-4 md:px-8 pt-5 md:pt-8 pb-4 md:pb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-sm font-bold uppercase tracking-widest ${ok ? "text-emerald-400" : "text-red-400"}`}>
                      {ok ? <><IconCheck size={13} className="inline -mt-0.5" /> Correcta</> : <><IconX size={13} className="inline -mt-0.5" /> Incorrecta</>} · Pregunta {i + 1}
                    </span>
                    {p.puntaje === 2 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1"><IconStar size={11} /> 2 pts</span>
                    )}
                  </div>
                  <p className="text-white font-black text-lg md:text-2xl leading-snug mb-4">{p.pregunta}</p>
                  {p.imagen && (
                    <div className="mb-4 rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-800/40 flex items-center justify-center">
                      <img src={p.imagen} alt="" className="max-h-48 w-auto object-contain p-3" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 md:gap-3 px-4 md:px-8 pb-4 md:pb-6">
                  {p.opciones.map((op, j) => {
                    const esCorrecta = j === p.correcta;
                    const esRespuesta = j === respuestas[i];
                    const esIncorrecta = esRespuesta && !esCorrecta;
                    return (
                      <div key={j} className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-2xl border-2 text-sm md:text-base font-medium ${
                        esCorrecta ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" :
                        esIncorrecta ? "border-red-500 bg-red-500/10 text-red-300" :
                        "border-slate-700/40 bg-slate-800/20 text-slate-500"
                      }`}>
                        <span className={`w-7 h-7 md:w-8 md:h-8 rounded-xl border-2 border-current flex items-center justify-center flex-shrink-0 font-black text-xs ${
                          esCorrecta ? "bg-emerald-500/20" : esIncorrecta ? "bg-red-500/20" : ""
                        }`}>
                          {esCorrecta ? <IconCheck size={14} /> : esIncorrecta ? <IconX size={14} /> : String.fromCharCode(65 + j)}
                        </span>
                        <span className="flex-1">{op}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mx-4 md:mx-8 mb-5 md:mb-8 px-4 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-800/60 border border-slate-700/40">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><IconBulb size={12} /> Explicación</p>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed">{p.explicacion}</p>
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


