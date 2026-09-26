import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { guardarResultado } from "../db.js";
import { IconArrowLeft } from "@tabler/icons-react";
import { guardarSesionAdaptativa } from "../adaptativo.js";
import { useStore } from "../store/quizStore.js";
import { useGameStore } from "../useGameStore.js";
import { AuthModal } from "../AuthModal.jsx";
import { RevisionContent } from "../components/Revision.jsx";
import { ScorePanel } from "../components/ScorePanel.jsx";
import { COMPOSICION_PROFESIONAL, evaluarExamenProfesional } from "../preguntas_profesional.js";

const CLASES_PROFESIONALES = ["A1", "A2", "D", "E"];

export default function Resultado({ user, onAuthSuccess }) {
  const { respuestas, tiemposRespuesta, reiniciar, modo, clase, iniciar, preguntas } = useStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const guardadoRef = useRef(false); // Ref para evitar guardados duplicados entre re-renders/StrictMode
  const [vistaMovil, setVistaMovil] = useState("score");

  const correctas = Object.entries(respuestas).filter(([i, r]) => preguntas[+i]?.correcta === r).length;
  const total = preguntas.length;
  const pct = Math.round((correctas / total) * 100);
  const puntajeObtenido = Object.entries(respuestas).reduce((acc, [i, r]) => {
    const p = preguntas[+i]; if (!p) return acc;
    return acc + (p.correcta === r ? (p.puntaje ?? 1) : 0);
  }, 0);
  const puntajeMaximo = preguntas.reduce((acc, p) => acc + (p.puntaje ?? 1), 0);

  const esProfesional = CLASES_PROFESIONALES.includes(clase);
  const evalProfesional = esProfesional ? evaluarExamenProfesional(clase, preguntas, respuestas) : null;
  const aprobado = esProfesional ? evalProfesional.aprobado : puntajeObtenido >= 33;
  const minimo = esProfesional ? COMPOSICION_PROFESIONAL[clase].minCorrectas : 33;

  // NOTA sobre las deps: este efecto debe dispararse una sola vez, cuando
  // `user` pasa a estar disponible (login), y usa `guardadoRef` para
  // bloquear guardados duplicados. Agregar `respuestas`, `preguntas`, `modo`,
  // `clase`, etc. a las deps NO cambiaría el comportamiento (el guard ya
  // bloquea reejecuciones), pero sería engañoso: sugeriría que el efecto
  // reacciona a esos cambios cuando en realidad solo le interesa el momento
  // en que aparece `user`. Se deja `[user]` a propósito.
  useEffect(() => {
    if (user && !guardadoRef.current) {
      guardadoRef.current = true; // Bloquear inmediatamente antes del await
      setGuardando(true);
      if (modo === "inteligente") useGameStore.getState().useInteligenteSession();
      Promise.allSettled([
        guardarResultado({ preguntas, respuestas, modo, clase, puntajeObtenido, puntajeMaximo }),
        guardarSesionAdaptativa(preguntas, respuestas, clase, tiemposRespuesta ?? {}),
      ])
        .then(() => setGuardado(true))
        .finally(() => setGuardando(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAuthSuccess = async (modoAuth, email, password) => {
    const u = await onAuthSuccess(modoAuth, email, password);
    setShowAuthModal(false);
    if (!guardadoRef.current) {
      guardadoRef.current = true;
      setGuardando(true);
      await guardarResultado({ preguntas, respuestas, modo, clase, puntajeObtenido, puntajeMaximo });
      setGuardando(false);
      setGuardado(true);
    }
    return u;
  };

  return (
    <>
      <AnimatePresence>
        {showAuthModal && <AuthModal onSuccess={handleAuthSuccess} onClose={() => setShowAuthModal(false)} />}
      </AnimatePresence>

      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="flex w-full h-full overflow-hidden flex-col md:flex-row">

        {/* Wrapper móvil con AnimatePresence para slide entre vistas */}
        <div className="md:contents">
          <div className="md:hidden absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
            <AnimatePresence mode="wait" initial={false}>
              {vistaMovil === "score" ? (
                <m.div key="score-mobile"
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "-100%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute inset-0 flex flex-col items-center justify-center px-6 py-8 overflow-hidden"
                  style={{ background: "#0a0f1a" }}>

                  {/* Panel de puntaje — compartido con la versión desktop */}
                  <ScorePanel
                    compact
                    aprobado={aprobado}
                    puntajeObtenido={puntajeObtenido}
                    puntajeMaximo={puntajeMaximo}
                    pct={pct}
                    correctas={correctas}
                    total={total}
                    minimo={minimo}
                    onRevisar={() => setVistaMovil("revision")}
                    onReintentar={() => iniciar(modo, clase)}
                    onReiniciar={reiniciar}
                  />
                  {esProfesional && (
                    <p className="text-xs text-slate-500 text-center mt-3 px-4">
                      Además, no se puede reprobar con más de {evalProfesional.maxErroresLegal} errores en "Conocimientos Legales" ({evalProfesional.erroresLegal} {evalProfesional.erroresLegal === 1 ? "error" : "errores"} en tu examen).
                    </p>
                  )}
                </m.div>
              ) : (
                <m.div key="revision-mobile"
                  initial={{ x: "100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "100%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute inset-0 flex flex-col overflow-hidden"
                  style={{ background: "#0a0f1a" }}>
                  {/* Header fijo */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 flex-shrink-0"
                    style={{ background: "rgba(10,15,26,0.99)" }}>
                    <m.button whileTap={{ scale: 0.9 }} onClick={() => setVistaMovil("score")}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 border-0 outline-none flex-shrink-0">
                      <IconArrowLeft size={16} />
                    </m.button>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-sm leading-none">Revisión de respuestas</p>
                      <p className="text-slate-500 text-xs mt-0.5">{correctas} correctas · {total - correctas} incorrectas</p>
                    </div>
                  </div>
                  {/* Contenido real de revisión */}
                  <RevisionContent
                    preguntas={preguntas} respuestas={respuestas}
                    user={user} guardado={guardado} guardando={guardando}
                    onShowAuth={() => setShowAuthModal(true)}
                    mobile={true}
                  />
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Score panel — SOLO DESKTOP */}
        <div className={`md:w-96 flex-shrink-0 md:border-r border-slate-800 flex-col items-center justify-center px-6 py-8 md:p-10 hidden md:flex relative overflow-hidden`}>

          {/* Panel de puntaje — compartido con la versión mobile */}
          <ScorePanel
            aprobado={aprobado}
            puntajeObtenido={puntajeObtenido}
            puntajeMaximo={puntajeMaximo}
            pct={pct}
            correctas={correctas}
            total={total}
            minimo={minimo}
            onRevisar={() => setVistaMovil("revision")}
            onReintentar={() => iniciar(modo, clase)}
            onReiniciar={reiniciar}
          />
          {esProfesional && (
            <p className="text-xs text-slate-500 text-center mt-4 px-6 relative z-10">
              Además, no se puede reprobar con más de {evalProfesional.maxErroresLegal} errores en "Conocimientos Legales" ({evalProfesional.erroresLegal} {evalProfesional.erroresLegal === 1 ? "error" : "errores"} en tu examen).
            </p>
          )}
        </div>

        {/* Revisión — SOLO DESKTOP */}
        <div className="flex-1 hidden md:flex flex-col overflow-y-auto">
          <div className="px-16 pt-10 pb-2">
            <h3 className="text-3xl font-black text-white mb-8">Revisión de respuestas</h3>
          </div>
          <RevisionContent
            preguntas={preguntas} respuestas={respuestas}
            user={user} guardado={guardado} guardando={guardando}
            onShowAuth={() => setShowAuthModal(true)}
          />
        </div>
      </m.div>
    </>
  );
}