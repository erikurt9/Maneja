import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { IconClipboardCheck, IconBulb, IconBrain, IconArrowRight, IconX } from "@tabler/icons-react";

// ─── CARRUSEL: "¿QUÉ MODO USO?" ─────────────────────────────────────────────
// Se muestra una sola vez por usuario, la primera vez que llega al Dashboard
// (después del onboarding de diagnóstico, o directo si ya tenía exámenes —
// ver el flag en App.jsx). Examen / Estudio / Inteligente no es una
// diferenciación obvia para alguien nuevo, y elegir mal el primer modo suele
// terminar en frustración ("¿por qué no me explica las respuestas?"). Tres
// slides, cada uno con su propio color de acento (mismo código de color que
// usan las cards de esos modos en el resto de la app, para que la asociación
// visual quede grabada desde el primer momento).
const SLIDES = [
  {
    icon: IconClipboardCheck,
    titulo: "Modo Examen",
    color: "#60a5fa",
    bg: "rgba(37,99,235,0.15)",
    border: "rgba(59,130,246,0.3)",
    texto: "Simula el examen real: 35 preguntas, sin ayuda ni corrección hasta el final. Úsalo para medir tu nivel real, como si rindieras hoy.",
  },
  {
    icon: IconBulb,
    titulo: "Modo Estudio",
    color: "#fbbf24",
    bg: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.3)",
    texto: "Te explica cada respuesta al momento, sin límite de tiempo. Ideal para aprender de tus errores. Usa vidas — se regeneran solas cada 2 horas.",
  },
  {
    icon: IconBrain,
    titulo: "Modo Inteligente",
    color: "#c084fc",
    bg: "rgba(168,85,247,0.15)",
    border: "rgba(168,85,247,0.3)",
    texto: "Detecta tus categorías más débiles y arma una sesión corta enfocada solo en eso. Se pone mejor mientras más practiques.",
  },
];

export function CarruselModos({ onFinalizar }) {
  const [idx, setIdx] = useState(0);
  const esUltimo = idx === SLIDES.length - 1;
  const slide = SLIDES[idx];
  const Icon = slide.icon;

  return (
    <m.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <m.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center gap-5"
        style={{ background: "linear-gradient(145deg, rgba(15,20,30,0.98) 0%, rgba(10,15,22,0.99) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <button type="button" onClick={onFinalizar}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-0 outline-none">
          <IconX size={16} />
        </button>

        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 self-start">
          ¿Qué modo uso?
        </span>

        <AnimatePresence mode="wait">
          <m.div key={idx}
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: slide.bg, border: `1px solid ${slide.border}` }}>
              <Icon size={30} style={{ color: slide.color }} />
            </div>
            <h2 className="text-white font-black text-lg">{slide.titulo}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{slide.texto}</p>
          </m.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)}
              className="rounded-full border-0 outline-none p-0 transition-all"
              style={{ width: i === idx ? 18 : 6, height: 6, background: i === idx ? slide.color : "rgba(255,255,255,0.15)" }}
              aria-label={`Ir al slide ${i + 1}`} />
          ))}
        </div>

        <m.button
          whileTap={{ scale: 0.97 }}
          onClick={() => (esUltimo ? onFinalizar() : setIdx(idx + 1))}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm text-white outline-none border-0"
          style={{ background: slide.color, boxShadow: `0 4px 20px ${slide.color}55` }}
        >
          {esUltimo ? "Entendido, empezar" : "Siguiente"}
          {!esUltimo && <IconArrowRight size={16} />}
        </m.button>
      </m.div>
    </m.div>
  );
}