import React from "react";
import { m } from "framer-motion";
import { fadeUp } from "../utils/motion";

// ── getHeroConfig ────────────────────────────────────────────────────────────
// Antes vivía como un objeto literal recreado en cada render dentro de
// HeroProgreso. Es lógica pura (no usa hooks ni JSX), así que se saca del
// componente: más fácil de leer, de testear y de encontrar cuando hay que
// tocar los textos o colores de un nivel.
function getHeroConfig(nivel, adaptativo) {
  return {
    sinDatos: {
      modo: "examen",
      titulo: "¡Bienvenido!\nEmpecemos.",
      desc1: "Aún no tienes datos de estudio.",
      desc2: null,
      label: null,
      ringColor: "#3b82f6",
      ringGlow: "rgba(71,85,105,0.4)",
      ctaBg: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
      ctaShadow: "0 6px 24px rgba(30,41,59,0.45)",
      cardBg: "linear-gradient(145deg, rgba(15,20,30,0.99) 0%, rgba(10,15,22,0.99) 100%)",
      borderColor: "rgba(71,85,105,0.25)",
      glowColor: "rgba(71,85,105,0.06)",
      accentLine: "linear-gradient(90deg, rgba(71,85,105,0.5), rgba(71,85,105,0.1), transparent)",
      isCritical: false,
      btnLabel: "Hacer un examen de prueba",
    },
    bajo: {
      modo: "estudio",
      modoEmoji: "📖",
      modoLabel: "Modo Estudio",
      titulo: "⚡ RECOMENDADO PARA TI",
      desc1: "Tema crítico detectado — trabájalo hoy.",
      desc2: adaptativo?.topDebiles?.[0] ? `Fallaste preguntas de ${adaptativo.topDebiles[0].categoria} recientemente.` : null,
      label: "CRÍTICO",
      ringColor: "#f59e0b",
      ringGlow: "rgba(245,158,11,0.65)",
      ctaBg: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
      ctaShadow: "0 6px 24px rgba(245,158,11,0.45)",
      cardBg: "linear-gradient(145deg, rgba(24,16,4,0.99) 0%, rgba(16,10,2,0.99) 100%)",
      borderColor: "rgba(245,158,11,0.45)",
      glowColor: "rgba(245,158,11,0.18)",
      accentLine: "linear-gradient(90deg, rgba(245,158,11,0.8), rgba(245,158,11,0.2), transparent)",
      isCritical: true,
      btnLabel: "Estudiar ahora",
    },
    medio: {
      modo: "inteligente",
      titulo: adaptativo?.topDebiles?.[0]
        ? `Vas bien. Corrige\n${adaptativo.topDebiles[0].categoria.toLowerCase()}`
        : "Vas bien. Sigue\npracticando.",
      desc1: adaptativo?.topDebiles?.[0]
        ? "Buen ritmo — hay un punto débil claro que trabajar."
        : "Buen ritmo, sigue mejorando.",
      desc2: adaptativo?.topDebiles?.[0]
        ? `Has fallado preguntas de ${adaptativo.topDebiles[0].categoria} recientemente.`
        : null,
      label: "Progreso medio",
      ringColor: "#a855f7",
      ringGlow: "rgba(168,85,247,0.65)",
      ctaBg: "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)",
      ctaShadow: "0 6px 24px rgba(168,85,247,0.40)",
      cardBg: "linear-gradient(145deg, rgba(18,8,30,0.98) 0%, rgba(12,4,22,0.98) 100%)",
      borderColor: "rgba(168,85,247,0.30)",
      glowColor: "rgba(168,85,247,0.12)",
      accentLine: "linear-gradient(90deg, rgba(168,85,247,0.6), rgba(168,85,247,0.1), transparent)",
      isCritical: false,
      btnLabel: "🧠 Practicar inteligente",
    },
    alto: {
      modo: "examen",
      titulo: "¡Estás listo\npara rendir!",
      desc1: "Excelente preparación.",
      desc2: "Simula el examen real para confirmar tu nivel.",
      label: "Listo para el examen",
      ringColor: "#10b981",
      ringGlow: "rgba(16,185,129,0.65)",
      ctaBg: "linear-gradient(135deg, #059669 0%, #047857 100%)",
      ctaShadow: "0 6px 24px rgba(16,185,129,0.35)",
      cardBg: "linear-gradient(145deg, rgba(4,20,14,0.98) 0%, rgba(2,14,10,0.98) 100%)",
      borderColor: "rgba(16,185,129,0.25)",
      glowColor: "rgba(16,185,129,0.09)",
      accentLine: "linear-gradient(90deg, rgba(16,185,129,0.6), rgba(16,185,129,0.1), transparent)",
      isCritical: false,
      btnLabel: "Simular examen",
    },
  }[nivel];
}

// ── HeroProgresoSkeleton ─────────────────────────────────────────────────────
// El placeholder animado que se muestra mientras cargan los datos del
// dashboard. Antes era un `if (loading) return (...)` en medio del
// componente grande; ahora es su propia pieza, reutilizable si otra pantalla
// necesita el mismo skeleton.
function HeroProgresoSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-10 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="h-56 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="h-36 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
    </div>
  );
}

// ── HeroCardPrincipal ─────────────────────────────────────────────────────────
// La tarjeta grande con el anillo de progreso, el título y el botón CTA.
// Es la sección visual más pesada del componente original, así que vive
// sola con solo los datos que necesita (nada de recalcularlos acá).
function HeroCardPrincipal({ config, nivel, ringColor, ringGlow, dashoffset, topicPct, hitoActual, esNuevo, R, CIRC, onIniciar, clase, catDebil }) {
  return (
    <m.div
      className="relative rounded-2xl border overflow-hidden"
      style={{ borderColor: config.borderColor, background: config.cardBg }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Badge CRÍTICO flotante */}
      {config.isCritical && (
        <m.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(217,119,6,0.95)",
            border: "1px solid rgba(251,191,36,0.4)",
            boxShadow: "0 0 16px rgba(245,158,11,0.6)",
          }}
        >
          <m.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0"
          />
          <span className="text-white text-[10px] font-black uppercase tracking-wider">Estado Crítico</span>
        </m.div>
      )}

      {/* Fondo glow radial */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 70% 60% at 100% 100%, ${config.glowColor}, transparent 70%)` }} />
      {/* Línea top accent */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: config.accentLine }} />

      <div className="relative flex items-center gap-4 p-5 pt-10">

        {/* ── Círculo de progreso ───────────────────────────────────── */}
        <div className="relative flex-shrink-0 flex flex-col items-center gap-2">
          <div className="relative">
            <svg width="116" height="116" viewBox="0 0 116 116">
              {/* Halo exterior animado (solo crítico) */}
              {config.isCritical && (
                <m.circle cx="58" cy="58" r={R + 6}
                  fill="none" stroke="rgba(245,158,11,0.18)" strokeWidth="1"
                  strokeDasharray="4 5"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  style={{ transformOrigin: "58px 58px", transform: "rotate(0deg)" }}
                />
              )}
              {/* Track */}
              <circle cx="58" cy="58" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
              {/* Arco progreso */}
              <m.circle
                cx="58" cy="58" r={R} fill="none"
                stroke={ringColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: CIRC }}
                animate={{ strokeDashoffset: dashoffset }}
                transition={{ duration: 1.4, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  transformOrigin: "58px 58px", transform: "rotate(-90deg)",
                  filter: `drop-shadow(0 0 10px ${ringGlow})`,
                }}
              />
              {/* Porcentaje */}
              <text x="58" y="53" textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize="22" fontWeight="900" fontFamily="inherit" letterSpacing="-1">
                {esNuevo ? "—" : `${Math.round(topicPct)}%`}
              </text>
              {/* Sub-label dentro del ring */}
              <text x="58" y="68" textAnchor="middle" dominantBaseline="middle"
                fill={ringColor} fontSize="8" fontWeight="700" fontFamily="inherit" letterSpacing="0.5">
                {esNuevo ? "sin datos" : hitoActual.sublabel}
              </text>
            </svg>
          </div>
          {/* Label badge debajo */}
          {config.label && (
            <m.span
              animate={config.isCritical ? { boxShadow: ["0 0 6px rgba(245,158,11,0.4)", "0 0 14px rgba(245,158,11,0.7)", "0 0 6px rgba(245,158,11,0.4)"] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-wider uppercase"
              style={{
                background: `${config.ringColor}25`,
                color: config.ringColor,
                border: `1px solid ${config.ringColor}50`,
              }}
            >
              {config.label}
            </m.span>
          )}
        </div>

        {/* ── Bloque de texto ──────────────────────────────────────── */}
        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          {/* Etiqueta RECOMENDADO */}
          {config.isCritical && (
            <span className="text-[10px] font-black uppercase tracking-[0.15em]"
              style={{ color: "rgba(251,191,36,0.9)" }}>
              ✨ Recomendado para ti
            </span>
          )}
          {/* Título */}
          <h3 className="text-white font-black text-lg leading-tight" style={{ letterSpacing: "-0.3px" }}>
            {config.titulo.split("\n").map((line, i) => (
              <React.Fragment key={i}>{line}{i < config.titulo.split("\n").length - 1 && <br />}</React.Fragment>
            ))}
          </h3>
          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            {nivel === "bajo" ? (
              <>
                {/* Chip modo recomendado */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                    style={{ background: "rgba(245,158,11,0.15)", color: "rgba(251,191,36,0.7)", border: "1px solid rgba(245,158,11,0.25)" }}>
                    {config.modoLabel}
                  </span>
                </div>
                <p className="text-slate-400 text-xs leading-snug">{config.desc1}</p>
              </>
            ) : (
              <p className="text-slate-400 text-xs leading-snug">{config.desc1}</p>
            )}
            {config.desc2 && (
              <p className="text-xs leading-snug font-medium" style={{ color: nivel === "bajo" ? "rgba(251,191,36,0.8)" : "rgba(196,181,253,0.7)" }}>
                {config.desc2}
              </p>
            )}
          </div>
          {/* Botón CTA */}
          <m.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ filter: "brightness(1.1)" }}
            onClick={() =>
              nivel === "medio" && catDebil
                ? onIniciar("inteligente", clase, catDebil)
                : onIniciar(config.modo)
            }
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-sm text-white outline-none border-0 w-full mt-0.5"
            style={{ background: config.ctaBg, boxShadow: config.ctaShadow }}
          >
            {config.btnLabel}
            <m.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>→</m.span>
          </m.button>
        </div>
      </div>
    </m.div>
  );
}

// ── PlanInteligenteHoy ────────────────────────────────────────────────────────
// La tarjeta violeta con el plan de estudio sugerido para hoy. Solo aparece
// cuando hay debilidades detectadas, así que es un buen corte de
// responsabilidad propio.
function PlanInteligenteHoy({ cantDebiles, catDebil, pregsCat, pregsMix, tiempoEst, onIniciar, clase }) {
  return (
    <m.div
      className="relative rounded-2xl border overflow-hidden"
      style={{
        borderColor: "rgba(168,85,247,0.30)",
        background: "linear-gradient(145deg, rgba(22,10,38,0.98) 0%, rgba(14,6,26,0.98) 100%)",
      }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Glow violeta radial */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 75% 70% at 0% 50%, rgba(168,85,247,0.13), transparent 65%)" }} />
      {/* Línea superior accent */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, rgba(168,85,247,0.6), rgba(168,85,247,0.1), transparent)" }} />

      <div className="relative p-4 pt-5">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "rgba(168,85,247,0.18)", border: "1px solid rgba(168,85,247,0.35)" }}>
            🧠
          </div>
          <div className="flex flex-col">
            <p className="text-white text-sm font-bold leading-tight">Plan inteligente de hoy</p>
            <p className="text-purple-400 text-xs font-medium" style={{ opacity: 0.8 }}>Basado en tus debilidades</p>
          </div>
          <div className="ml-auto flex-shrink-0">
            <div className="flex flex-col items-center">
              <m.span
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-2xl font-black leading-none tabular-nums"
                style={{
                  background: "linear-gradient(135deg, #f87171, #fbbf24)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 8px rgba(248,113,113,0.5))",
                  letterSpacing: "-1px",
                }}
              >
                {cantDebiles}
              </m.span>
              <span className="text-[8px] font-black uppercase tracking-wide"
                style={{ color: "rgba(251,191,36,0.7)" }}>
                {cantDebiles === 1 ? "débil" : "débiles"}
              </span>
            </div>
          </div>
        </div>

        {/* Punto débil */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3"
          style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.18)" }}>
          <span className="text-sm">⚠️</span>
          <div className="flex flex-col gap-0">
            <span className="text-xs text-slate-400">Tu punto débil principal</span>
            <span className="text-sm font-bold" style={{ color: "#d8b4fe" }}>{catDebil}</span>
          </div>
        </div>

        {/* Bullets del plan + botón */}
        <div className="flex items-end gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Podemos mejorarlo hoy:</p>
            <p className="text-xs text-slate-300">• {pregsCat} {pregsCat === 1 ? "pregunta" : "preguntas"} de {catDebil}</p>
            {pregsMix > 0 && <p className="text-xs text-slate-400">• {pregsMix} preguntas de repaso general</p>}
            <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Tiempo estimado: {tiempoEst} min
            </p>
          </div>
          <m.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ filter: "brightness(1.1)" }}
            onClick={() => onIniciar("inteligente", clase, catDebil)}
            className="flex-shrink-0 flex items-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-sm text-white outline-none border-0"
            style={{
              background: "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)",
              boxShadow: "0 4px 18px rgba(168,85,247,0.40)",
              whiteSpace: "nowrap",
            }}
          >
            Empezar ahora
            <m.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>→</m.span>
          </m.button>
        </div>
      </div>
    </m.div>
  );
}

// ── HeroProgreso ──────────────────────────────────────────────────────────────
// Orquesta las tres piezas de arriba: calcula en qué nivel está el usuario,
// arma el objeto de configuración de ese nivel y el estado del anillo de
// progreso, y decide si mostrar la tarjeta del plan inteligente. La lógica
// de cálculo se queda acá porque varias piezas la necesitan (config, nivel,
// ring); solo el JSX pesado se movió a los subcomponentes de arriba.
export function HeroProgreso({ probabilidad, adaptativo, datos, onIniciar, loading, clase, tresHitos }) {
  const esNuevo = !datos || datos.examenes.length === 0;
  const pct = probabilidad ?? 0;
  const nivel = esNuevo ? "sinDatos" : pct < 50 ? "bajo" : pct < 80 ? "medio" : "alto";
  const config = getHeroConfig(nivel, adaptativo);

  // Círculo de progreso — muestra el hito del modo recomendado
  const R = 48;
  const CIRC = 2 * Math.PI * R;

  // Cada nivel mapea al hito correspondiente
  const hitoMap = {
    sinDatos: { data: null,               sublabel: "sin datos",       ringColorOverride: null },
    bajo:     { data: tresHitos?.hito1,   sublabel: "dominio manual",  ringColorOverride: "#f59e0b" },
    medio:    { data: tresHitos?.hito2,   sublabel: "refuerzo",        ringColorOverride: "#a855f7" },
    alto:     { data: tresHitos?.hito3,   sublabel: "prob. examen",    ringColorOverride: "#10b981" },
  };
  const hitoActual = hitoMap[nivel];
  const topicPct = esNuevo ? 0 : (hitoActual.data?.activo ? hitoActual.data.pct : 0);
  const ringColor = hitoActual.ringColorOverride ?? config.ringColor;
  const ringGlow  = esNuevo ? config.ringGlow : ringColor + "aa";
  const dashoffset = CIRC * (1 - topicPct / 100);

  // Plan inteligente — solo si hay datos reales de debilidades
  const cantDebiles = adaptativo?.debiles ?? 0;
  const catDebil = adaptativo?.topDebiles?.[0]?.categoria ?? null;
  const pregsCat = cantDebiles > 0 ? Math.min(cantDebiles, 10) : 5;
  const pregsMix = cantDebiles >= 10 ? 5 : Math.max(0, 10 - pregsCat);
  const tiempoEst = Math.round((pregsCat + pregsMix) * 0.4);

  if (loading) return <HeroProgresoSkeleton />;

  return (
    <m.div {...fadeUp(0.1)} className="flex flex-col gap-4">

      {/* ── Título sección 1 ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-0.5">
        <span className="text-sm font-black uppercase tracking-widest text-white">🎯 Tu Plan Personalizado</span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
      </div>

      <HeroCardPrincipal
        config={config}
        nivel={nivel}
        ringColor={ringColor}
        ringGlow={ringGlow}
        dashoffset={dashoffset}
        topicPct={topicPct}
        hitoActual={hitoActual}
        esNuevo={esNuevo}
        R={R}
        CIRC={CIRC}
        onIniciar={onIniciar}
        clase={clase}
        catDebil={catDebil}
      />

      {/* ── Plan inteligente de hoy — solo si hay debilidades reales ─────── */}
      {!esNuevo && cantDebiles > 0 && catDebil && (
        <PlanInteligenteHoy
          cantDebiles={cantDebiles}
          catDebil={catDebil}
          pregsCat={pregsCat}
          pregsMix={pregsMix}
          tiempoEst={tiempoEst}
          onIniciar={onIniciar}
          clase={clase}
        />
      )}
    </m.div>
  );
}
