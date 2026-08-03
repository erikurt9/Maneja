import { m } from "framer-motion";
import { IconTarget, IconClock, IconChartBar, IconArrowRight } from "@tabler/icons-react";

// ─── ONBOARDING: DIAGNÓSTICO INICIAL ───────────────────────────────────────
// Se muestra una sola vez, la primera vez que un usuario nuevo llega a
// "Inicio" sin exámenes registrados (ver check en App.jsx vía
// tieneExamenesPrevios()). Reemplaza el Hero genérico "¡Bienvenido! Empecemos"
// por un mini-examen de 8 preguntas que alimenta con datos reales el mismo
// motor de probabilidad/adaptativo que ya usa el Dashboard — así el usuario
// ve una recomendación personalizada desde su primera sesión, en vez de un
// estado vacío. No es un examen distinto: reutiliza useStore.iniciar() con
// numPreguntas=8, así que hereda corrección, guardado y resultado gratis.
const ITEMS = [
  { icon: IconClock, texto: "8 preguntas · 3 minutos" },
  { icon: IconTarget, texto: "No cuenta como reprobado" },
  { icon: IconChartBar, texto: "Personaliza tu plan de estudio" },
];

export function OnboardingDiagnostico({ clase, onComenzar, onOmitir }) {
  return (
    <m.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="w-full h-full flex items-center justify-center p-6"
    >
      <m.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md rounded-3xl p-7 flex flex-col items-center text-center gap-5"
        style={{
          background: "linear-gradient(145deg, rgba(15,20,30,0.98) 0%, rgba(10,15,22,0.99) 100%)",
          border: "1px solid rgba(59,130,246,0.25)",
        }}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}>
          <IconTarget size={26} className="text-blue-400" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-white font-black text-xl leading-tight">
            Antes de empezar,<br />un diagnóstico rápido
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Con 8 preguntas armamos tu plan de estudio personalizado — sabrás exactamente qué te falta reforzar.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 w-full">
          {ITEMS.map(({ icon: Icon, texto }) => (
            <div key={texto} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Icon size={16} className="text-blue-400 flex-shrink-0" />
              <span className="text-slate-300 text-xs font-medium text-left">{texto}</span>
            </div>
          ))}
        </div>

        <m.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ filter: "brightness(1.1)" }}
          onClick={onComenzar}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm text-white outline-none border-0 mt-1"
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
            boxShadow: "0 4px 20px rgba(29,78,216,0.40)",
          }}
        >
          Comenzar diagnóstico
          <IconArrowRight size={16} />
        </m.button>

        <button type="button" onClick={onOmitir}
          className="text-slate-500 text-xs font-medium bg-transparent border-0 outline-none hover:text-slate-400 transition-colors">
          Omitir por ahora
        </button>
      </m.div>
    </m.div>
  );
}