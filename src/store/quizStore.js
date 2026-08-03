import { create } from "zustand";
import { hapticCorrecto, hapticIncorrecto, hapticTap } from "../haptics.js";
import { generarExamen, PREGUNTAS } from "../preguntas.js";
import { generarExamenMoto, PREGUNTAS_MOTO } from "../preguntas_moto.js";
import { generarExamenProfesional, PREGUNTAS_PROFESIONAL, COMPOSICION_PROFESIONAL } from "../preguntas_profesional.js";

const CLASES_PROFESIONALES = ["A1", "A2", "D", "E"];

// ─── STORE del examen en curso (pantalla, preguntas, respuestas, timer) ───────
export const useStore = create((set, get) => ({
  pantalla: "inicio",
  modo: "examen",
  clase: "B",
  preguntaActual: 0,
  respuestas: {},
  tiemposRespuesta: {},
  tiempoInicioPregunta: Date.now(),
  tiempoRestante: 45 * 60,
  preguntas: [],

  iniciar: (modo, clase = "B", preguntasAdaptativas = null, numPreguntas = 35) => {
    const esProfesional = CLASES_PROFESIONALES.includes(clase);
    const banco = esProfesional
      ? PREGUNTAS_PROFESIONAL.filter((p) => p.clases.includes(clase))
      : clase === "C" ? PREGUNTAS_MOTO : PREGUNTAS;
    const generarFn = esProfesional
      ? () => generarExamenProfesional(clase)
      : clase === "C" ? generarExamenMoto : generarExamen;

    // En clases profesionales el examen oficial tiene un total fijo por ley
    // (20 para A1/A2, 12 para D, 10 para E) y respeta cuotas por contenido —
    // no se ajusta con el selector de cantidad, sólo el modo estudio la usa.
    const totalOficial = esProfesional ? COMPOSICION_PROFESIONAL[clase].total : numPreguntas;

    const preguntas = preguntasAdaptativas
      ? preguntasAdaptativas.toSorted(() => Math.random() - 0.5).slice(0, numPreguntas)
      : modo === "inteligente" || (modo === "estudio" && esProfesional)
        ? banco.toSorted(() => Math.random() - 0.5).slice(0, numPreguntas)
        : modo === "examen" && esProfesional
          ? generarFn()
          : generarFn(numPreguntas);

    set({
      pantalla: "examen",
      modo,
      clase,
      preguntaActual: 0,
      respuestas: {},
      tiemposRespuesta: {},
      tiempoInicioPregunta: Date.now(),
      tiempoRestante: modo === "inteligente" ? Infinity : (esProfesional && modo === "examen" ? totalOficial * 60 : 35 * 60),
      preguntas,
    });
  },

  reiniciar: () => set((state) => ({ pantalla: "inicio", clase: state.clase, preguntaActual: 0, respuestas: {}, tiemposRespuesta: {}, tiempoInicioPregunta: Date.now(), tiempoRestante: 35 * 60, preguntas: [] })),

  responder: (i) => {
    const { preguntaActual, respuestas, tiemposRespuesta, tiempoInicioPregunta, modo, preguntas } = get();
    if (respuestas[preguntaActual] !== undefined) return;
    const segundos = Math.round((Date.now() - tiempoInicioPregunta) / 1000);
    const nuevas = { ...respuestas, [preguntaActual]: i };
    const nuevosTiempos = { ...tiemposRespuesta, [preguntaActual]: segundos };
    set({ respuestas: nuevas, tiemposRespuesta: nuevosTiempos, tiempoInicioPregunta: Date.now() });

    // Feedback háptico: en Examen no se revela si acertaste (así se diseñó
    // la UX: "sin retroalimentación"), así que solo se confirma el toque.
    // En Estudio/Inteligente sí se distingue correcto/incorrecto — refuerza
    // el mismo feedback visual inmediato que ya muestran esas pantallas.
    const pregunta = preguntas[preguntaActual];
    if (modo === "examen") hapticTap();
    else if (pregunta && i === pregunta.correcta) hapticCorrecto();
    else hapticIncorrecto();

    if (modo === "examen") {
      setTimeout(() => {
        const { preguntaActual: pa } = get();
        if (pa < preguntas.length - 1) set({ preguntaActual: pa + 1 });
        else set({ pantalla: "resultado" });
      }, 500);
    }
  },

  siguiente: () => {
    const { preguntaActual, preguntas } = get();
    if (preguntaActual < preguntas.length - 1) set({ preguntaActual: preguntaActual + 1 });
    else set({ pantalla: "resultado" });
  },

  tick: () => {
    const { tiempoRestante, modo } = get();
    if (modo === "inteligente") return;
    if (tiempoRestante <= 1) set({ pantalla: "resultado" });
    else set({ tiempoRestante: tiempoRestante - 1 });
  },
}));

export const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;