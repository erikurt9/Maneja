import { m, AnimatePresence } from "framer-motion";
import QuestionIcon from "./QuestionIcon";
import { IconCheck, IconX } from "@tabler/icons-react";

export function InfoPanel({ pregunta, respuestaGuardada, yaRespondida, correctasHasta, preguntas, respuestas }) {
  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        <m.div key={`cat-${pregunta.pregunta}`}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Categoría</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <QuestionIcon name={pregunta.icono} className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{pregunta.categoria}</p>
              <div className="flex gap-1 mt-1.5">
                {[1,2,3,4,5].map((n) => <div key={n} className={`h-1.5 w-4 rounded-full ${n <= pregunta.dificultad ? "bg-amber-400" : "bg-slate-700"}`} />)}
              </div>
            </div>
          </div>
        </m.div>
      </AnimatePresence>

      <AnimatePresence>
        {yaRespondida ? (
          <m.div key="feedback" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`rounded-2xl border p-4 ${respuestaGuardada === pregunta.correcta ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${respuestaGuardada === pregunta.correcta ? "text-emerald-400" : "text-red-400"}`}>
              {respuestaGuardada === pregunta.correcta ? <><IconCheck size={13} className="inline -mt-0.5" /> Correcto</> : <><IconX size={13} className="inline -mt-0.5" /> Incorrecto</>}
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">{pregunta.explicacion}</p>
          </m.div>
        ) : (
          <m.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-slate-700/40 bg-slate-800/20 p-5 flex flex-col items-center justify-center text-center gap-3 min-h-36">
            <div className="w-10 h-10 rounded-full border-2 border-slate-700 flex items-center justify-center text-slate-600 text-xl">?</div>
            <p className="text-slate-600 text-sm">Responde para ver la explicación</p>
          </m.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Rendimiento</p>
        <div className="space-y-3">
          {[
            { label: "Respondidas", valor: Object.keys(respuestas).length, color: "bg-blue-500" },
            { label: "Correctas", valor: correctasHasta, color: "bg-emerald-500" },
            { label: "Incorrectas", valor: Object.keys(respuestas).length - correctasHasta, color: "bg-red-500" },
          ].map(({ label, valor, color }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-300 font-semibold">{valor}/{preguntas.length}</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <m.div className={`h-full w-full ${color} rounded-full`} style={{ transformOrigin: "left" }} animate={{ scaleX: valor / preguntas.length }} transition={{ duration: 0.5 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ImagenPregunta({ src }) {
  if (!src) return null;
  return (
    <m.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="mb-6 rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-800/40 flex items-center justify-center">
      <img src={src} alt="Imagen de la pregunta" className="max-h-56 w-auto object-contain p-4" />
    </m.div>
  );
}

