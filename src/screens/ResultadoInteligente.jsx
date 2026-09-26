import { useEffect, useRef } from "react";
import { m } from "framer-motion";
import { guardarSesionAdaptativa } from "../adaptativo.js";
import { useStore } from "../store/quizStore.js";
import { IconRocket, IconTarget, IconArrowRight, IconRefresh } from "@tabler/icons-react";

export default function ResultadoInteligente({ user, onReintentar, onVolver, onIniciarExamen }) {
  const { preguntas, clase, tiemposRespuesta } = useStore();
  const guardadoRef = useRef(false);

  // Al llegar aquí todas las preguntas fueron dominadas — 100% siempre
  const total = preguntas.length;
  const pct = 100;
  const listoParaExamen = true;

  // Guardar sesión adaptativa al montar (una sola vez).
  // NOTA sobre las deps: a diferencia de Resultado.jsx, esta pantalla no
  // tiene un AuthModal propio, así que `user` ya está resuelto cuando este
  // componente monta (no puede cambiar de no-autenticado a autenticado
  // mientras está en pantalla). `guardadoRef` además bloquea reejecuciones.
  // Por eso las deps se dejan vacías a propósito.
  useEffect(() => {
    if (user && !guardadoRef.current && preguntas.length > 0) {
      guardadoRef.current = true;
      // Guardar cada pregunta como correcta (todas dominadas)
      const respuestasCorrectas = Object.fromEntries(preguntas.map((p, i) => [i, p.correcta]));
      // BUG: guardarSesionAdaptativa ya no recibe `userId` como primer
      // parámetro (ver adaptativo.js — ahora lo resuelve internamente con
      // getAuthenticatedUserId() por seguridad). Esta llamada seguía
      // pasando `user.id` como primer argumento, así que en la práctica
      // `preguntas` recibía el user.id, `respuestas` recibía `preguntas`,
      // `clase` recibía `respuestasCorrectas`, y `tiempos` recibía `clase`
      // — el objeto real de tiempos se descartaba y la sesión adaptativa
      // nunca se guardaba bien (el .catch(() => {}) silenciaba el error).
      guardarSesionAdaptativa(preguntas, respuestasCorrectas, clase, tiemposRespuesta ?? {}).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mensajeCerebro = () =>
    `¡Dominaste las ${total} preguntas débiles! Tu memoria adaptativa fue actualizada. Ahora estás listo para el examen real.`;

  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center w-full h-full px-6 py-10 relative overflow-y-auto"
      style={{ background: "#0a0f1a" }}>

      {/* Glow de fondo */}
      <m.div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.12) 0%, transparent 70%)" }} />

      {/* Emoji flotante */}
      <m.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mb-6 relative z-10 flex justify-center text-emerald-400" style={{ transform: "scale(3)" }}>
        <IconRocket />
      </m.div>

      {/* Puntaje */}
      <m.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        className="relative z-10 w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center mb-6"
        style={{ borderColor: "#10b981", boxShadow: "0 0 40px rgba(16,185,129,0.3), 0 0 80px rgba(16,185,129,0.15)" }}>
        <span className="text-4xl font-black text-white">100%</span>
        <span className="text-xs text-slate-500 mt-1">{total} / {total}</span>
      </m.div>

      {/* Mensaje */}
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 max-w-sm text-center mb-8 px-5 py-4 rounded-2xl border"
        style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.3)" }}>
        <p className="text-sm font-semibold leading-relaxed" style={{ color: "#6ee7b7" }}>
          {mensajeCerebro()}
        </p>
      </m.div>

      {/* Botones */}
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 flex flex-col gap-2.5 w-full max-w-xs">
        <button type="button" onClick={onIniciarExamen}
          className="w-full py-3.5 rounded-2xl font-black text-white border-0 outline-none"
          style={{ background: "linear-gradient(135deg, #059669, #047857)", boxShadow: "0 4px 20px rgba(5,150,105,0.4)" }}>
          <IconTarget size={16} className="inline -mt-0.5 mr-1" /> Ir al Examen Real <IconArrowRight size={16} className="inline -mt-0.5" />
        </button>
        <button type="button" onClick={onReintentar}
          className="w-full py-3 rounded-2xl font-semibold text-purple-400 border border-purple-500/30 bg-transparent outline-none">
          <IconRefresh size={15} className="inline -mt-0.5 mr-1" /> Seguir repasando
        </button>
        <button type="button" onClick={onVolver}
          className="w-full py-3 rounded-2xl font-semibold text-slate-400 border border-slate-700 bg-transparent outline-none">
          Volver al inicio
        </button>
      </m.div>
    </m.div>
  );
}