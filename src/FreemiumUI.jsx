import { m } from "framer-motion";
import { useGameStore } from "./useGameStore";
import { useState } from "react";
import { supabase, getAuthenticatedUserId } from "./supabase";
import {
  IconFlame, IconBrain, IconBolt, IconBarbell, IconRocket,
  IconLock, IconStar, IconTool,
  IconCheck, IconX, IconArrowsShuffle, IconPencil, IconHourglass, IconDice, IconTrash, IconEraser,
} from "@tabler/icons-react";

// ─── DISPLAY DE RACHA ─────────────────────────────────────────────────────────
export function StreakDisplay() {
  const streak = useGameStore((s) => s.streak);
  if (streak === 0) return null;
  return (
    <div className="flex items-center gap-1">
      <m.span
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ filter: "drop-shadow(0 0 6px #f97316)" }}
        className="text-base"
      >
        <IconFlame size={16} />
      </m.span>
      <span className="text-sm font-black" style={{ color: "#fb923c", textShadow: "0 0 8px rgba(249,115,22,0.6)" }}>
        {streak}
      </span>
    </div>
  );
}

// ─── MODAL: INTELIGENTE BLOQUEADO ─────────────────────────────────────────────
export function InteligenteLockedModal({ onClose, onPremium }) {
  return (
    <m.div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}
    >
      <m.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="w-full max-w-sm rounded-3xl p-8 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f0a20 0%, #0d1626 60%, #1a0e2e 100%)",
          border: "1px solid rgba(168,85,247,0.35)",
          boxShadow: "0 0 60px rgba(168,85,247,0.2)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.15) 0%, transparent 60%)",
        }} />
        <div className="mb-4 flex justify-center" style={{ transform: "scale(3)" }}><IconLock /></div>
        <h2 className="text-2xl font-black text-white mb-2">Sesión diaria usada</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          El plan gratuito incluye <strong className="text-white">1 sesión de Modo Inteligente por día</strong>.<br />
          Vuelve mañana o desbloquea sesiones ilimitadas con Pro.
        </p>

        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)" }}>
          <p className="text-xs text-purple-400 font-semibold mb-1 flex items-center gap-1.5"><IconBrain size={13} /> Plan Gratuito</p>
          <p className="text-slate-300 text-sm">1 sesión inteligente / día</p>
          <div className="h-px my-3" style={{ background: "rgba(168,85,247,0.15)" }} />
          <p className="text-xs text-purple-300 font-semibold mb-1 flex items-center gap-1.5"><IconStar size={13} /> Plan Pro</p>
          <p className="text-slate-300 text-sm">Sesiones ilimitadas de Modo Inteligente</p>
        </div>

        <m.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onPremium}
          className="w-full py-3.5 rounded-2xl font-black text-white text-sm mb-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #9333ea, #a855f7)",
            boxShadow: "0 0 30px rgba(139,92,246,0.4)",
          }}
        >
          <m.div
            className="absolute inset-0"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            style={{ width: "60%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
          />
          <IconStar size={15} className="inline -mt-0.5 mr-1" /> Desbloquear Pro
        </m.button>

        <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl text-slate-500 text-sm hover:text-slate-300 transition-colors bg-transparent border-0">
          Volver al inicio
        </button>
      </m.div>
    </m.div>
  );
}

// ─── DEV PANEL (solo localhost) ───────────────────────────────────────────────
// ─── CATEGORÍAS para el generador ────────────────────────────────────────────
const CATEGORIAS_GEN = [
  "Señales de Tránsito", "Normas de Tránsito", "Conducta Vial",
  "Conducción segura", "Prioridad de paso", "Velocidad",
  "Alcohol y Drogas", "Semáforos", "Demarcación",
  "Mecánica Básica", "Convivencia Vial",
];

// Genera exámenes sintéticos directamente en Supabase
// NOTA DE SEGURIDAD: los inserts de abajo ya NO mandan `user_id` — lo pone
// la base de datos sola vía `default auth.uid()` en la columna, reforzado
// por RLS `auth.uid() = user_id` con WITH CHECK (ver
// migration_authz_fields.sql). `getAuthenticatedUserId()` se llama igual,
// pero solo como guardia: si no hay sesión, corta acá con un error claro
// en vez de dejar que Supabase lo rechace más abajo con un error genérico.
// Esta función solo se usa desde el DevPanel (solo localhost), pero el
// mismo patrón se aplicó en todo el código de escritura.
async function generarExamenSintetico({ clase, puntaje, modo }) {
  await getAuthenticatedUserId();
  const total = 35;
  const puntajeMax = 44;
  // Convertir puntaje (0-44) a correctas aproximadas
  const correctas = Math.round((puntaje / puntajeMax) * total);
  const incorrectas = total - correctas;

  const { data: examen, error } = await supabase
    .from("examenes")
    .insert({
      modo,
      clase,
      puntaje_obtenido: puntaje,
      puntaje_maximo: puntajeMax,
      correctas,
      incorrectas,
      total,
    })
    .select()
    .single();

  if (error) throw error;

  // Generar respuestas_detalle sintéticas con distribución por categoría
  const detalle = [];
  let correctasRestantes = correctas;
  const cats = [...CATEGORIAS_GEN];

  for (let i = 0; i < total; i++) {
    const cat = cats[i % cats.length];
    const esCorrecta = correctasRestantes > 0 && (
      correctasRestantes / (total - i) > Math.random()
    );
    if (esCorrecta) correctasRestantes--;

    detalle.push({
      examen_id: examen.id,
      pregunta_id: 1000 + i, // IDs sintéticos
      categoria: cat,
      respondida: esCorrecta ? 0 : 1,
      correcta: 0,
      es_correcta: esCorrecta,
    });
  }

  await supabase.from("respuestas_detalle").insert(detalle);
  return examen;
}

// Obtener userId del localStorage/session de Supabase
async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ─── DevPanel: subcomponentes ──────────────────────────────────────────────
// Antes estaban todos mezclados dentro de la función DevPanel (430 líneas).
// Cada uno de estos es una sección visual independiente del panel de debug:
// el header con tabs, el contenido de la pestaña "Juego" y el de "Exámenes".
// No van en src/components/ porque son 100% específicos de este panel de
// desarrollo (no se reutilizan en ningún otro lado).

function DevPanelHeader({ tab, setTab, minimized, setMinimized, onClose }) {
  return (
    <div
      className="px-3 py-2 border-b flex items-center gap-1"
      style={{ borderColor: "rgba(168,85,247,0.2)", background: "rgba(168,85,247,0.08)", cursor: "grab" }}
      onPointerDown={e => e.currentTarget.style.cursor = "grabbing"}
      onPointerUp={e => e.currentTarget.style.cursor = "grab"}
    >
      <button type="button"
        onClick={onClose}
        className="w-5 h-5 rounded-md flex items-center justify-center bg-transparent border-0 outline-none transition-colors mr-1"
        style={{ color: "#64748b" }}
        onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
        onMouseLeave={e => e.currentTarget.style.color = "#64748b"}
        title="Cerrar"
        aria-label="Cerrar"
      >
        <svg width="10" height="10" fill="none" viewBox="0 0 10 10">
          <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </button>
      <span className="text-purple-400 text-xs font-black tracking-widest uppercase mr-auto flex items-center gap-1.5">
        <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" style={{ opacity: 0.5 }}>
          <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
          <circle cx="2" cy="6" r="1.2"/><circle cx="6" cy="6" r="1.2"/>
          <circle cx="2" cy="10" r="1.2"/><circle cx="6" cy="10" r="1.2"/>
        </svg>
        <IconTool size={12} /> Dev
      </span>
      {!minimized && ["game", "exams"].map(t => (
        <button type="button" key={t} onClick={() => setTab(t)}
          className="px-2 py-0.5 rounded-md text-xs font-bold border-0 outline-none transition-all"
          style={{
            background: tab === t ? "rgba(168,85,247,0.3)" : "transparent",
            color: tab === t ? "#c084fc" : "#64748b",
          }}>
          {t === "game" ? "Juego" : "Exámenes"}
        </button>
      ))}
      <button type="button"
        onClick={() => setMinimized(m => !m)}
        className="w-5 h-5 rounded-md flex items-center justify-center bg-transparent border-0 outline-none transition-colors ml-1"
        style={{ color: "#64748b" }}
        title={minimized ? "Expandir" : "Minimizar"}
        aria-label={minimized ? "Expandir" : "Minimizar"}
      >
        {minimized
          ? <svg width="10" height="10" fill="none" viewBox="0 0 10 10"><path d="M2 7l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          : <svg width="10" height="10" fill="none" viewBox="0 0 10 10"><path d="M2 3l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        }
      </button>
    </div>
  );
}

function DevPanelGameTab({ isPremium, togglePremium, streak, setStreak, intelligenteUsedToday, onBorrarMemoria }) {
  return (
    <div className="p-3 flex flex-col gap-2.5">
      {/* Premium toggle — solo afecta Modo Inteligente (sesiones ilimitadas) */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Premium</span>
        <button type="button" onClick={togglePremium}
          className="px-3 py-1 rounded-full text-xs font-bold transition-all border-0 outline-none"
          style={{
            background: isPremium ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.06)",
            color: isPremium ? "#c084fc" : "#64748b",
            border: `1px solid ${isPremium ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.08)"}`,
          }}>
          {isPremium ? <><IconStar size={11} className="inline -mt-0.5" /> ON</> : "OFF"}
        </button>
      </div>

      {/* Racha */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400">Racha ({streak})</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setStreak(Math.max(0, streak - 1))} className="w-6 h-6 rounded-lg text-xs font-bold bg-slate-700/60 text-slate-400 border-0 outline-none">−</button>
          <button type="button" onClick={() => setStreak(streak + 1)} className="w-6 h-6 rounded-lg text-xs font-bold bg-orange-500/20 text-orange-400 border-0 outline-none">+</button>
        </div>
      </div>

      {/* Inteligente */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800">
        <span className="text-xs text-slate-500">Inteligente hoy</span>
        <button type="button"
          onClick={() => useGameStore.setState({ lastInteligenteDate: null, intelligenteUsedToday: false })}
          className="text-xs text-purple-400 hover:text-purple-300 border-0 bg-transparent outline-none">
          {intelligenteUsedToday ? <><IconLock size={11} className="inline -mt-0.5" /> Reset</> : <><IconCheck size={11} className="inline -mt-0.5" /> Libre</>}
        </button>
      </div>

      {/* Borrar memoria de perfil */}
      <button type="button"
        onClick={onBorrarMemoria}
        className="w-full py-1.5 rounded-xl text-xs font-bold border-0 outline-none transition-all mt-1"
        style={{
          background: "rgba(251,191,36,0.08)",
          color: "#fbbf24",
          border: "1px solid rgba(251,191,36,0.2)",
        }}>
        <IconEraser size={13} className="inline -mt-0.5 mr-1" /> Borrar memoria de perfil
      </button>
    </div>
  );
}

function DevPanelExamsTab({ genConfig, setGenConfig, PRESETS, generating, genResult, onGenerar, onLimpiar }) {
  return (
    <div className="p-3 flex flex-col gap-2.5">

      {/* Clase */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Clase</span>
        <div className="flex gap-1">
          {["B", "C"].map(c => (
            <button type="button" key={c} onClick={() => setGenConfig(p => ({ ...p, clase: c }))}
              className="px-2.5 py-0.5 rounded-lg text-xs font-bold border-0 outline-none transition-all"
              style={{
                background: genConfig.clase === c ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.05)",
                color: genConfig.clase === c ? "#93c5fd" : "#64748b",
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Modo */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Modo</span>
        <div className="flex gap-1">
          {["examen", "estudio"].map(m => (
            <button type="button" key={m} onClick={() => setGenConfig(p => ({ ...p, modo: m }))}
              className="px-2 py-0.5 rounded-lg text-xs font-bold border-0 outline-none transition-all capitalize"
              style={{
                background: genConfig.modo === m ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.05)",
                color: genConfig.modo === m ? "#c084fc" : "#64748b",
              }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Cantidad */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400">Cantidad ({genConfig.cantidad})</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setGenConfig(p => ({ ...p, cantidad: Math.max(1, p.cantidad - 1) }))} className="w-6 h-6 rounded-lg text-xs font-bold bg-slate-700/60 text-slate-400 border-0 outline-none">−</button>
          <button type="button" onClick={() => setGenConfig(p => ({ ...p, cantidad: Math.min(20, p.cantidad + 1) }))} className="w-6 h-6 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border-0 outline-none">+</button>
        </div>
      </div>

      {/* Preset de puntajes */}
      <div>
        <p className="text-xs text-slate-500 mb-1.5">Distribución de puntajes:</p>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(PRESETS).map(([key, { label }]) => (
            <button type="button" key={key}
              onClick={() => setGenConfig(p => ({ ...p, preset: key }))}
              className="px-1.5 py-1 rounded-lg text-[11px] font-semibold border-0 outline-none transition-all text-left"
              style={{
                background: genConfig.preset === key ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)",
                color: genConfig.preset === key ? "#67e8f9" : "#64748b",
                border: `1px solid ${genConfig.preset === key ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.06)"}`,
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Rango custom */}
      {genConfig.preset === "custom" && (
        <div className="flex flex-col gap-1.5 px-2 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Mín pts</span>
            <div className="flex gap-1 items-center">
              <button type="button" onClick={() => setGenConfig(p => ({ ...p, puntajeMin: Math.max(0, p.puntajeMin - 1) }))} className="w-5 h-5 rounded text-xs bg-slate-700/60 text-slate-400 border-0 outline-none">−</button>
              <span className="text-xs font-bold text-white w-6 text-center">{genConfig.puntajeMin}</span>
              <button type="button" onClick={() => setGenConfig(p => ({ ...p, puntajeMin: Math.min(p.puntajeMax - 1, p.puntajeMin + 1) }))} className="w-5 h-5 rounded text-xs bg-slate-700/60 text-slate-400 border-0 outline-none">+</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Máx pts</span>
            <div className="flex gap-1 items-center">
              <button type="button" onClick={() => setGenConfig(p => ({ ...p, puntajeMax: Math.max(p.puntajeMin + 1, p.puntajeMax - 1) }))} className="w-5 h-5 rounded text-xs bg-slate-700/60 text-slate-400 border-0 outline-none">−</button>
              <span className="text-xs font-bold text-white w-6 text-center">{genConfig.puntajeMax}</span>
              <button type="button" onClick={() => setGenConfig(p => ({ ...p, puntajeMax: Math.min(44, p.puntajeMax + 1) }))} className="w-5 h-5 rounded text-xs bg-slate-700/60 text-slate-400 border-0 outline-none">+</button>
            </div>
          </div>
        </div>
      )}

      {/* Info umbral */}
      <p className="text-[10px] text-slate-600 leading-tight">
        Umbral aprobación: <span className="text-emerald-500 font-bold">33 pts</span> · Máx: 44 pts
      </p>

      {/* Botón generar */}
      <button type="button"
        onClick={onGenerar}
        disabled={generating}
        className="w-full py-2 rounded-xl text-xs font-black text-white border-0 outline-none transition-all"
        style={{
          background: generating ? "rgba(34,211,238,0.1)" : "linear-gradient(135deg, #0891b2, #0e7490)",
          boxShadow: generating ? "none" : "0 4px 14px rgba(8,145,178,0.4)",
          opacity: generating ? 0.7 : 1,
        }}>
        {generating ? <><IconHourglass size={13} className="inline -mt-0.5 mr-1" /> Generando...</> : <><IconDice size={13} className="inline -mt-0.5 mr-1" /> Generar {genConfig.cantidad} examen{genConfig.cantidad > 1 ? "es" : ""}</>}
      </button>

      {/* Botón limpiar todo */}
      <button type="button"
        onClick={onLimpiar}
        disabled={generating}
        className="w-full py-1.5 rounded-xl text-xs font-bold border-0 outline-none transition-all"
        style={{
          background: "rgba(239,68,68,0.08)",
          color: "#f87171",
          border: "1px solid rgba(239,68,68,0.2)",
        }}>
        <IconTrash size={13} className="inline -mt-0.5 mr-1" /> Borrar todos los exámenes
      </button>

      {/* Resultado */}
      {genResult && (
        <m.div
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="px-3 py-2 rounded-xl text-xs font-semibold"
          style={{
            background: genResult.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            color: genResult.ok ? "#6ee7b7" : "#fca5a5",
            border: `1px solid ${genResult.ok ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
          }}>
          {genResult.ok ? (
            <span className="flex items-center gap-1.5">
              <IconCheck size={13} />
              {genResult.memMsg
                ? genResult.memMsg
                : genResult.deleted
                  ? "Todo borrado — recargando…"
                  : `${genResult.count} examen${genResult.count > 1 ? "es" : ""} creado${genResult.count > 1 ? "s" : ""} — recargando…`}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <IconX size={13} /> Error: {genResult.error}
            </span>
          )}
        </m.div>
      )}
    </div>
  );
}

export function DevPanel() {
  const { isPremium, streak, togglePremium, setStreak, intelligenteUsedToday } = useGameStore();
  const [tab, setTab] = useState("game");
  const [minimized, setMinimized] = useState(false);
  const [closed, setClosed] = useState(false);
  const [genConfig, setGenConfig] = useState({
    cantidad: 5,
    modo: "examen",
    clase: "B",
    preset: "mix",
    puntajeMin: 20,
    puntajeMax: 40,
  });
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);

  if (!import.meta.env.DEV) return null;
  if (closed) return null;

  const handleBorrarMemoria = async () => {
    // Limpiar localStorage
    localStorage.removeItem("maneja-game-store");
    localStorage.removeItem("perfil_nombre");
    localStorage.removeItem("perfil_foto");
    useGameStore.setState({
      isPremium: false,
      streak: 0,
      lastInteligenteDate: null,
      intelligenteUsedToday: false,
    });

    // Limpiar historial y stats en Supabase — sin filtrar por dueño acá:
    // RLS ya restringe examenes/respuestas_detalle/pregunta_stats a las
    // filas del usuario logueado, así que estos delete() sin .eq() solo
    // pueden tocar las propias filas de quien está logueado.
    try {
      const haySesion = await getUserId();
      if (haySesion) {
        const { data: exs } = await supabase.from("examenes").select("id");
        if (exs?.length) {
          await supabase.from("respuestas_detalle").delete().in("examen_id", exs.map(e => e.id));
          await supabase.from("examenes").delete().in("id", exs.map(e => e.id));
        }
        await supabase.from("pregunta_stats").delete().not("id", "is", null);
        setGenResult({ ok: true, count: 0, memMsg: "Memoria + historial borrados" });
        setTimeout(() => window.location.reload(), 600);
      } else {
        setGenResult({ ok: true, count: 0, memMsg: "Memoria local borrada (sin sesión)" });
      }
    } catch (err) {
      setGenResult({ ok: false, error: "Memoria local borrada, error en BD: " + err.message });
    }
  };

  const PRESETS = {
    aprobados: { label: "Solo aprobados", min: 33, max: 44 },
    reprobados: { label: "Solo reprobados", min: 10, max: 32 },
    mix:        { label: "Mix realista",    min: 22, max: 44 },
    custom:     { label: "Personalizado",   min: genConfig.puntajeMin, max: genConfig.puntajeMax },
  };

  const handleGenerar = async () => {
    setGenerating(true);
    setGenResult(null);
    try {
      const userId = await getUserId();
      if (!userId) { setGenResult({ ok: false, error: "No hay sesión activa" }); return; }

      const preset = PRESETS[genConfig.preset];

      // Cada iteración es independiente de las demás (no depende del examen
      // generado en el paso anterior), así que se lanzan todas en paralelo
      // con Promise.all en vez de esperar una por una con await en el loop.
      const generados = await Promise.all(
        Array.from({ length: genConfig.cantidad }, async (_, i) => {
          // Puntaje aleatorio dentro del rango del preset
          const puntaje = Math.round(preset.min + Math.random() * (preset.max - preset.min));
          // Dispersar fechas: cada examen 1-3 días antes del anterior
          const diasAtras = i * (1 + Math.floor(Math.random() * 3));
          const fecha = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000).toISOString();

          const ex = await generarExamenSintetico({
            clase: genConfig.clase,
            puntaje,
            modo: genConfig.modo,
          });

          // Actualizar created_at para que tengan fechas distintas
          if (diasAtras > 0) {
            await supabase.from("examenes").update({ created_at: fecha }).eq("id", ex.id);
          }
          return ex;
        })
      );

      setGenResult({ ok: true, count: generados.length });
      // Forzar recarga del dashboard
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setGenResult({ ok: false, error: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleLimpiar = async () => {
    setGenerating(true);
    try {
      const haySesion = await getUserId();
      if (!haySesion) return;
      // Borrar solo exámenes con puntaje_maximo = 44 (los sintéticos)
      const { data: exs } = await supabase.from("examenes").select("id");
      if (exs?.length) {
        await supabase.from("respuestas_detalle").delete().in("examen_id", exs.map(e => e.id));
        await supabase.from("examenes").delete().in("id", exs.map(e => e.id));
      }
      setGenResult({ ok: true, count: 0, deleted: true });
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      setGenResult({ ok: false, error: err.message });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <m.div
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-4 right-4 z-[300] rounded-2xl border overflow-hidden select-none"
      style={{
        width: 240,
        background: "rgba(8,12,24,0.97)",
        borderColor: "rgba(168,85,247,0.4)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 0 30px rgba(168,85,247,0.2)",
        cursor: "default",
      }}
    >
      <DevPanelHeader
        tab={tab} setTab={setTab}
        minimized={minimized} setMinimized={setMinimized}
        onClose={() => setClosed(true)}
      />

      {/* ── Cuerpo — oculto cuando minimized ── */}
      {!minimized && <>
        {tab === "game" && (
          <DevPanelGameTab
            isPremium={isPremium} togglePremium={togglePremium}
            streak={streak} setStreak={setStreak}
            intelligenteUsedToday={intelligenteUsedToday}
            onBorrarMemoria={handleBorrarMemoria}
          />
        )}
        {tab === "exams" && (
          <DevPanelExamsTab
            genConfig={genConfig} setGenConfig={setGenConfig}
            PRESETS={PRESETS}
            generating={generating} genResult={genResult}
            onGenerar={handleGenerar} onLimpiar={handleLimpiar}
          />
        )}
      </>}
    </m.div>
  );
}