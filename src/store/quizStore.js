import { create } from "zustand";
import { generarExamen, PREGUNTAS } from "../preguntas.js";
import { generarExamenMoto, PREGUNTAS_MOTO } from "../preguntas_moto.js";

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
    const banco = clase === "C" ? PREGUNTAS_MOTO : PREGUNTAS;
    const generarFn = clase === "C" ? generarExamenMoto : generarExamen;
    const preguntas = preguntasAdaptativas
      ? preguntasAdaptativas.toSorted(() => Math.random() - 0.5).slice(0, numPreguntas)
      : modo === "inteligente"
        ? banco.toSorted(() => Math.random() - 0.5).slice(0, numPreguntas)
        : generarFn(numPreguntas);
    set({
      pantalla: "examen",
      modo,
      clase,
      preguntaActual: 0,
      respuestas: {},
      tiemposRespuesta: {},
      tiempoInicioPregunta: Date.now(),
      tiempoRestante: modo === "inteligente" ? Infinity : 35 * 60,
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
