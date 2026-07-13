import { m } from "framer-motion";

/**
 * Panel de resultado del examen: fondo glow, emoji, título, círculo de
 * puntaje, stats y botones de acción.
 *
 * Antes esta sección estaba escrita DOS VECES dentro de Resultado.jsx
 * (una para la vista mobile con slide, otra para el panel fijo de
 * desktop) con JSX casi idéntico — eso era la causa real de que el
 * componente pasara las 300 líneas, no que le faltara "dividir en
 * secciones" de forma arbitraria.
 *
 * `compact` = true  -> variante mobile (tamaños fijos, sin hover, sin
 *                       "transition-all" porque se anima solo por Motion).
 * `compact` = false -> variante desktop (tamaños responsive `md:`, con
 *                       estados hover ya que ahí sí hay mouse).
 */
export function ScorePanel({
  aprobado,
  puntajeObtenido,
  puntajeMaximo,
  pct,
  correctas,
  total,
  onRevisar,
  onReintentar,
  onReiniciar,
  compact = false,
}) {
  const stats = [
    { val: `${puntajeObtenido}/${puntajeMaximo}`, label: "Puntaje", color: "text-emerald-400", delay: 0.55 },
    { val: 33, label: "Mínimo", color: "text-blue-400", delay: 0.65 },
    {
      val: total - correctas,
      label: `Errores (máx. ${puntajeMaximo - 33})`,
      color: (total - correctas) <= (puntajeMaximo - 33) ? "text-emerald-400" : "text-red-400",
      delay: 0.75,
    },
  ];

  return (
    <>
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 1 }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: aprobado
          ? "radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.12) 0%, transparent 70%)"
          : "radial-gradient(ellipse at 50% 30%, rgba(239,68,68,0.10) 0%, transparent 70%)" }} />

      <m.div initial={{ scale: 0.95, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.1 }}
        className={compact ? "text-6xl mb-4 relative z-10" : "text-6xl md:text-8xl mb-4 md:mb-5 relative z-10"}>
        {aprobado ? "🎉" : "📚"}
      </m.div>

      <m.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
        className={`${compact ? "text-3xl" : "text-3xl md:text-4xl"} font-black mb-1.5 relative z-10 ${aprobado ? "text-emerald-400" : "text-red-400"}`}>
        {aprobado ? "¡Aprobaste!" : "No aprobaste"}
      </m.h2>

      <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className={`text-slate-500 text-center text-sm ${compact ? "mb-6" : "mb-6 md:mb-8"} leading-relaxed relative z-10`}>
        {aprobado ? "Excelente. Estás listo para el examen real." : "Sigue practicando, ya casi lo logras."}
      </m.p>

      <div className={`relative ${compact ? "mb-6" : "mb-6 md:mb-8"} z-10`}>
        <m.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 140, damping: 12 }}
          className={`${compact ? "w-40 h-40" : "w-36 h-36 md:w-44 md:h-44"} rounded-full border-4 flex flex-col items-center justify-center ${aprobado ? "border-emerald-500" : "border-red-500"}${compact ? "" : " shadow-2xl"}`}
          style={{ boxShadow: aprobado ? "0 0 40px rgba(16,185,129,0.25), 0 0 80px rgba(16,185,129,0.1)" : "0 0 40px rgba(239,68,68,0.2), 0 0 80px rgba(239,68,68,0.08)" }}>
          <m.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55, type: "spring", stiffness: 200 }}
            className={`${compact ? "text-6xl" : "text-5xl md:text-6xl"} font-black text-white leading-none`}>
            {puntajeObtenido}
          </m.span>
          <m.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.62 }}
            className="text-xs font-bold text-slate-400 tracking-widest uppercase -mt-1">
            pts
          </m.span>
          <m.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className={compact ? "text-xs text-slate-500 mt-1" : "text-xs md:text-sm text-slate-500 mt-1"}>
            {pct}% · {correctas}/{total}
          </m.span>
        </m.div>
        <m.div initial={{ scale: 0.8, opacity: 0.6 }} animate={{ scale: 1.3, opacity: 0 }}
          transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
          className={`absolute inset-0 rounded-full border-4 ${aprobado ? "border-emerald-500" : "border-red-500"}`} />
      </div>

      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className={`flex ${compact ? "gap-8 mb-6" : "gap-6 md:gap-10 mb-6 md:mb-8"} relative z-10`}>
        {stats.map(({ val, label, color, delay }) => (
          <div key={label} className="text-center">
            <m.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay, type: "spring", stiffness: 220, damping: 12 }}
              className={`${compact ? "text-2xl" : "text-2xl md:text-3xl"} font-black ${color} tabular-nums`}>
              {val}
            </m.div>
            <div className={`text-xs text-slate-500 mt-1.5 leading-tight${compact ? "" : " text-center"}`}>{label}</div>
          </div>
        ))}
      </m.div>

      <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, type: "spring", stiffness: 180 }}
        className={`flex flex-col gap-2.5 w-full ${compact ? "" : "max-w-xs md:max-w-none "}relative z-10`}>
        <m.button whileTap={{ scale: 0.96 }} {...(compact ? {} : { whileHover: { scale: 1.02 } })}
          onClick={onRevisar}
          className={compact
            ? "w-full border-2 border-blue-500/50 text-blue-400 font-bold py-3.5 rounded-2xl bg-transparent outline-none"
            : "md:hidden w-full border-2 border-blue-500/50 text-blue-400 font-bold py-3.5 rounded-2xl transition-all bg-transparent outline-none"}>
          📋 Revisar respuestas
        </m.button>
        <m.button whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}
          onClick={onReintentar}
          className={compact
            ? "w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20"
            : "w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-500/20"}>
          Intentar de nuevo
        </m.button>
        <m.button whileTap={{ scale: 0.96 }}
          onClick={onReiniciar}
          className={compact
            ? "w-full border border-slate-700 text-slate-400 font-semibold py-3.5 rounded-2xl bg-transparent outline-none"
            : "w-full border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 font-semibold py-3.5 rounded-2xl transition-all bg-transparent outline-none"}>
          Volver a inicio
        </m.button>
      </m.div>
    </>
  );
}