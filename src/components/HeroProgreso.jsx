import React from "react";
import { m } from "framer-motion";
import { fadeUp } from "../utils/motion";
import { SESION_TEMA } from "../adaptativo";
import { IconBrain, IconArrowRight, IconAlertTriangle, IconSparkles, IconTarget, IconClipboardCheck } from "@tabler/icons-react";

// ── decidirModo ──────────────────────────────────────────────────────────────
// Una sola recomendación, nunca dos compitiendo. La regla de negocio:
//  - Sin exámenes rendidos todavía             → Examen (para tener datos reales)
//  - Probabilidad baja (<50%) CON tema débil   → Inteligente (ataca ese tema; también explica cada respuesta)
//  - Probabilidad baja (<50%) sin tema débil   → Estudio (reforzar lo básico)
//  - Probabilidad media/alta CON un fallo       → Inteligente (ataca esa falla puntual)
//    puntual recurrente detectado
//  - Probabilidad media/alta SIN fallos claros  → Examen (confirma tu nivel real)
function decidirModo(nivel, catDebil, esNuevo) {
  if (esNuevo) return "examen";
  if (nivel === "bajo") return catDebil ? "inteligente" : "estudio";
  if (catDebil) return "inteligente";
  return "examen";
}

// ── getHeroConfig ────────────────────────────────────────────────────────────
// El "nivel" (sinDatos/bajo/medio/alto) define la paleta y el tono del
// mensaje según qué tan preparado está el usuario. El "modo" (qué botón
// hace qué) se decide aparte con decidirModo — así nunca se desalinean.
function getHeroConfig(nivel, modo, adaptativo) {
  const catDebil = adaptativo?.topDebiles?.[0]?.categoria ?? null;

  const base = {
    sinDatos: {
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
      modoLabel: modo === "inteligente" ? "Modo Inteligente" : "Modo Estudio",
      titulo: catDebil ? `Refuerza\n${catDebil}` : "Hay temas\npor reforzar",
      desc1: "Es el tema donde más puedes mejorar hoy.",
      desc2: catDebil ? `Fallaste preguntas de ${catDebil} recientemente.` : null,
      label: "Por mejorar",
      ringColor: "#f59e0b",
      ringGlow: "rgba(245,158,11,0.65)",
      ctaBg: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
      ctaShadow: "0 6px 24px rgba(245,158,11,0.45)",
      cardBg: "linear-gradient(145deg, rgba(24,16,4,0.99) 0%, rgba(16,10,2,0.99) 100%)",
      borderColor: "rgba(245,158,11,0.45)",
      glowColor: "rgba(245,158,11,0.18)",
      accentLine: "linear-gradient(90deg, rgba(245,158,11,0.8), rgba(245,158,11,0.2), transparent)",
      isCritical: true,
      btnLabel: modo === "inteligente" ? "Reforzar ahora" : "Estudiar ahora",
    },
    medio_inteligente: {
      titulo: catDebil ? `Vas bien. Corrige\n${catDebil.toLowerCase()}` : "Vas bien. Sigue\npracticando.",
      desc1: "Buen ritmo — hay un punto débil claro que trabajar.",
      desc2: catDebil ? `Has fallado preguntas de ${catDebil} recientemente.` : null,
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
      btnLabel: "Practicar inteligente",
    },
    medio_examen: {
      titulo: "Vas bien.\nSigue así.",
      desc1: "Buen ritmo y sin fallas puntuales que corregir ahora.",
      desc2: "Simula un examen para confirmar tu nivel real.",
      label: "Progreso medio",
      ringColor: "#3b82f6",
      ringGlow: "rgba(59,130,246,0.55)",
      ctaBg: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
      ctaShadow: "0 6px 24px rgba(29,78,216,0.40)",
      cardBg: "linear-gradient(145deg, rgba(6,12,28,0.98) 0%, rgba(4,8,20,0.98) 100%)",
      borderColor: "rgba(59,130,246,0.28)",
      glowColor: "rgba(59,130,246,0.10)",
      accentLine: "linear-gradient(90deg, rgba(59,130,246,0.6), rgba(59,130,246,0.1), transparent)",
      isCritical: false,
      btnLabel: "Simular examen",
    },
    alto_inteligente: {
      titulo: `Casi listo. Corrige\n${catDebil ? catDebil.toLowerCase() : "tu último punto débil"}`,
      desc1: "Tu preparación general es excelente.",
      desc2: catDebil ? `Sigues fallando preguntas de ${catDebil} — corrígelo antes del examen.` : null,
      label: "Casi listo",
      ringColor: "#a855f7",
      ringGlow: "rgba(168,85,247,0.65)",
      ctaBg: "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)",
      ctaShadow: "0 6px 24px rgba(168,85,247,0.40)",
      cardBg: "linear-gradient(145deg, rgba(18,8,30,0.98) 0%, rgba(12,4,22,0.98) 100%)",
      borderColor: "rgba(168,85,247,0.30)",
      glowColor: "rgba(168,85,247,0.12)",
      accentLine: "linear-gradient(90deg, rgba(168,85,247,0.6), rgba(168,85,247,0.1), transparent)",
      isCritical: false,
      btnLabel: "Practicar inteligente",
    },
    alto_examen: {
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
  };

  const key = nivel === "sinDatos" || nivel === "bajo" ? nivel : `${nivel}_${modo}`;
  return { ...base[key], modo };
}

// ── HeroProgresoSkeleton ─────────────────────────────────────────────────────
function HeroProgresoSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-10 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="h-56 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
    </div>
  );
}

// ── HeroCardPrincipal ─────────────────────────────────────────────────────────
// La única tarjeta de recomendación. Cuando el modo decidido es "inteligente"
// integra el detalle del plan (antes vivía en una tarjeta morada aparte).
function HeroCardPrincipal({ config, nivel, ringColor, ringGlow, dashoffset, topicPct, hitoActual, esNuevo, R, CIRC, onIniciar, clase, catDebil, cantDebiles, pregsCat, pregsMix, tiempoEst, probabilidad, meta }) {
  const esInteligente = config.modo === "inteligente";

  return (
    <m.div
      className="relative rounded-2xl border overflow-hidden"
      style={{ borderColor: config.borderColor, background: config.cardBg }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Fondo glow radial */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 70% 60% at 100% 100%, ${config.glowColor}, transparent 70%)` }} />
      {/* Línea top accent */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: config.accentLine }} />

      <div className="relative flex items-start gap-4 p-6">

        {/* ── Círculo de progreso ───────────────────────────────────── */}
        <div className="relative flex-shrink-0 flex flex-col items-center gap-2">
          <div className="relative">
            <svg width="116" height="116" viewBox="0 0 116 116">
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
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {/* Etiqueta RECOMENDADO */}
          {nivel !== "sinDatos" && (
            <span className="text-[10px] font-black uppercase tracking-[0.15em]"
              style={{ color: "rgba(251,191,36,0.9)" }}>
              <IconSparkles size={11} className="inline -mt-0.5 mr-1" /> Recomendado para ti
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
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                    style={{ background: "rgba(245,158,11,0.15)", color: "rgba(251,191,36,0.95)", border: "1px solid rgba(245,158,11,0.25)" }}>
                    {config.modoLabel}
                  </span>
                </div>
                <p className="text-slate-400 text-xs leading-snug">{config.desc1}</p>
              </>
            ) : (
              <p className="text-slate-400 text-xs leading-snug">{config.desc1}</p>
            )}
            {config.desc2 && !esInteligente && (
              <p className="text-xs leading-snug font-medium" style={{ color: nivel === "bajo" ? "rgba(251,191,36,0.8)" : "rgba(196,181,253,0.7)" }}>
                {config.desc2}
              </p>
            )}
          </div>

          {/* Dónde estás vs. la meta real: probabilidad de aprobar + lo que exige el examen */}
          {!esNuevo && probabilidad != null && (
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] font-semibold px-2 py-1 rounded-lg text-slate-200"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Probabilidad de aprobar: <span className="font-black text-white">{Math.round(probabilidad)}%</span>
              </span>
              <span className="text-[11px] font-semibold px-2 py-1 rounded-lg text-slate-300"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                Examen real: {(meta ?? { min: 33, total: 35 }).min} de {(meta ?? { min: 33, total: 35 }).total} correctas
              </span>
            </div>
          )}

          {/* Detalle del plan — solo cuando el modo recomendado es Inteligente */}
          {esInteligente && catDebil && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.18)" }}>
                <IconAlertTriangle size={15} className="text-purple-300 flex-shrink-0" />
                <div className="flex flex-col gap-0 min-w-0">
                  <span className="text-xs text-slate-400">Tu punto débil principal</span>
                  <span className="text-sm font-bold truncate" style={{ color: "#d8b4fe" }}>{catDebil}</span>
                </div>
                {cantDebiles > 0 && (
                  <span className="ml-auto flex-shrink-0 text-xs font-black px-2 py-1 rounded-lg"
                    style={{ background: "rgba(248,113,113,0.15)", color: "#fca5a5" }}>
                    {cantDebiles} {cantDebiles === 1 ? "débil" : "débiles"}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-slate-500 font-medium">Podemos mejorarlo hoy:</p>
                <p className="text-xs text-slate-300">• {pregsCat} {pregsCat === 1 ? "pregunta" : "preguntas"} de {catDebil}</p>
                {pregsMix > 0 && <p className="text-xs text-slate-400">• {pregsMix} preguntas de repaso general</p>}
                <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  Tiempo estimado: {tiempoEst} min
                </p>
              </div>
            </div>
          )}

          {/* Botón CTA */}
          <m.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ filter: "brightness(1.1)" }}
            onClick={() =>
              esInteligente && catDebil
                ? onIniciar("inteligente", clase, catDebil)
                : onIniciar(config.modo)
            }
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm text-white outline-none border-0 w-full mt-1"
            style={{ background: config.ctaBg, boxShadow: config.ctaShadow }}
          >
            {esInteligente ? <IconBrain size={16} /> : config.modo === "examen" ? <IconClipboardCheck size={16} /> : null}
            {config.btnLabel}
            <m.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}><IconArrowRight size={16} /></m.span>
          </m.button>
        </div>
      </div>
    </m.div>
  );
}

// ── HeroProgreso ──────────────────────────────────────────────────────────────
// Calcula en qué nivel está el usuario, decide qué modo recomendar (una sola
// vez, sin tarjetas duplicadas) y arma la config visual de esa combinación.
export function HeroProgreso({ probabilidad, adaptativo, datos, onIniciar, loading, clase, tresHitos, meta }) {
  const esNuevo = !datos || datos.examenes.length === 0;
  const pct = probabilidad ?? 0;
  const nivel = esNuevo ? "sinDatos" : pct < 50 ? "bajo" : pct < 80 ? "medio" : "alto";

  const catDebil = adaptativo?.topDebiles?.[0]?.categoria ?? null;
  const modo = decidirModo(nivel, catDebil, esNuevo);
  const config = getHeroConfig(nivel, modo, adaptativo);

  // Círculo de progreso — muestra el hito del modo recomendado
  const R = 48;
  const CIRC = 2 * Math.PI * R;

  // Cada nivel mapea al hito correspondiente
  const hitoMap = {
    sinDatos: { data: null,               sublabel: "sin datos",       ringColorOverride: null },
    bajo:     { data: tresHitos?.hito1,   sublabel: "banco visto",  ringColorOverride: "#f59e0b" },
    medio:    { data: tresHitos?.hito2,   sublabel: "refuerzo",        ringColorOverride: modo === "inteligente" ? "#a855f7" : "#3b82f6" },
    alto:     { data: tresHitos?.hito3,   sublabel: "prob. examen",    ringColorOverride: modo === "inteligente" ? "#a855f7" : "#10b981" },
  };
  const hitoActual = hitoMap[nivel];
  const topicPct = esNuevo ? 0 : (hitoActual.data?.activo ? hitoActual.data.pct : 0);
  const ringColor = hitoActual.ringColorOverride ?? config.ringColor;
  const ringGlow  = esNuevo ? config.ringGlow : ringColor + "aa";
  const dashoffset = CIRC * (1 - topicPct / 100);

  // Detalle del plan inteligente — solo se calcula/usa si el modo lo requiere
  const cantDebiles = adaptativo?.debiles ?? 0;
  // Mismos números que entrega la sesión por tema (SESION_TEMA en adaptativo.js).
  const pregsCat = SESION_TEMA.cantidadCat;
  const pregsMix = SESION_TEMA.cantidadMix;
  const tiempoEst = Math.round((pregsCat + pregsMix) * 0.4);

  if (loading) return <HeroProgresoSkeleton />;

  return (
    <m.div {...fadeUp(0.1)} className="flex flex-col gap-4">

      {/* ── Título sección ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-0.5">
        <span className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-1.5"><IconTarget size={14} /> Tu Plan Personalizado</span>
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
        cantDebiles={cantDebiles}
        pregsCat={pregsCat}
        pregsMix={pregsMix}
        tiempoEst={tiempoEst}
        probabilidad={probabilidad}
        meta={meta}
      />
    </m.div>
  );
}