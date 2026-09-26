import { useState, useEffect, useReducer, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useStore } from "../store/quizStore.js";
import { ProgressTopBar, TopBar } from "../components/ExamHeader.jsx";
import { ImagenPregunta } from "../components/QuizQuestionUI.jsx";
import QuestionIcon from "../components/QuestionIcon";
import {
  IconBrain, IconArrowRight, IconArrowLeft, IconRefresh, IconFlame, IconBulb,
  IconCheck, IconX, IconCircleCheckFilled, IconCircleX, IconBook2, IconConfetti,
} from "@tabler/icons-react";

const OPCION_ESTILOS = {
  neutro: "border-purple-700/40 bg-slate-800/40 text-slate-200 hover:border-purple-400/60 hover:bg-slate-700/50 cursor-pointer",
  correcta: "border-emerald-500 bg-emerald-500/10 text-emerald-300 cursor-default",
  incorrecta: "border-red-500 bg-red-500/10 text-red-300 cursor-default",
  deshabilitado: "border-slate-700/30 bg-slate-800/20 text-slate-500 cursor-default",
};

const CONSEJO_POR_CATEGORIA = {
  "Señales de Tránsito": "Las señales se memorizan mejor por forma + color. Roja = prohibición, amarilla = advertencia, azul = información.",
  "Normas de Tránsito": "Recuerda: la ley del tránsito chilena prioriza siempre la seguridad del peatón.",
  "Prioridad de paso": "Regla clave: quien llega primero o viene por la derecha tiene prioridad en intersecciones sin señales.",
  "Velocidad": "En Chile: zonas urbanas 50 km/h, escuelas 30 km/h, autopistas hasta 120 km/h.",
  "Alcohol y Drogas": "Límite legal en Chile: 0,3 g/L en sangre. Conductores novatos y transporte público: 0,0 g/L.",
  "Semáforos": "Verde parpadeo = prepárate para detenerte. Flecha verde = solo en esa dirección.",
  "Conducta Vial": "Siempre circula por la derecha de la calzada y mantén distancia de seguimiento.",
  "Mecánica Básica": "Prioriza conocer los sistemas de seguridad: frenos, dirección, neumáticos.",
};

// hintVisible, respuestaActual y animSalida son las 3 piezas de estado de UI
// "de la pregunta actual": siempre se reinician juntas cuando cambia la
// pregunta (ver el useEffect más abajo), así que viven en un solo
// useReducer en vez de 3 useState reiniciados con 3 setState seguidos.
function questionUIReducer(state, action) {
  switch (action.type) {
    case "RESET_PREGUNTA":
      return { hintVisible: false, respuestaActual: null, animSalida: null };
    case "RESPONDER":
      return { ...state, respuestaActual: action.payload };
    case "MOSTRAR_HINT":
      return { ...state, hintVisible: true };
    case "SET_ANIM_SALIDA":
      return { ...state, animSalida: action.payload };
    default:
      return state;
  }
}

// ─── SIDEBAR DESKTOP: progreso + cola visual ────────────────────────────────
// Extraída de ModoInteligente (el componente completo pasaba de 300 líneas).
// Puramente presentacional: recibe todo lo que necesita mostrar por props.
function SidebarProgresoCola({ clase, dominadas, totalOriginal, pctDominadas, cola }) {
  return (
    <div className="hidden md:flex w-72 flex-shrink-0 border-r border-slate-800 flex-col">
      <div className="flex flex-col p-5 gap-4 h-full overflow-y-auto">
        {/* Logo */}
        <div className="hidden md:flex items-center gap-2 mb-1">
          <button type="button" onClick={() => useStore.getState().reiniciar()} className="flex items-center gap-2 bg-transparent border-0 p-0 hover:opacity-80 transition-opacity">
            <img src="/logo_new.png" alt="Maneja" className="w-7 h-7 object-contain" style={{ filter: "drop-shadow(0 2px 6px rgba(60,120,255,0.4))" }} />
          </button>
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 inline-flex"><IconBrain size={13} /></span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${clase === "C" ? "bg-orange-500/20 text-orange-400" : "bg-slate-700/60 text-slate-400"}`}>{clase}</span>
        </div>

        {/* Progreso de la cola */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Progreso</p>
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-2xl font-black text-white">{Math.min(dominadas.length, totalOriginal)}</span>
              <span className="text-slate-500 text-sm ml-1">/ {totalOriginal}</span>
            </div>
            <span className="text-xs font-bold text-pink-400">{pctDominadas}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <m.div className="h-full w-full rounded-full"
              animate={{ scaleX: pctDominadas / 100 }}
              transition={{ duration: 0.5 }}
              style={{ background: "linear-gradient(90deg, #a855f7, #ec4899)", transformOrigin: "left" }} />
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-emerald-400">{Math.min(dominadas.length, totalOriginal)} dominadas</span>
            <span className="text-pink-400">{cola.length} restantes</span>
          </div>
        </div>

        {/* Cola visual de preguntas restantes */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Cola</p>
          <div className="flex flex-wrap gap-1">
            {cola.map((p, i) => (
              <div key={`${p.id}-${i}`}
                className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold ${i === 0 ? "bg-pink-500 text-white" : p._intentos > 0 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-slate-800 text-slate-500 border border-slate-700"}`}>
                {i === 0 ? <IconArrowRight size={11} className="mx-auto" /> : p._intentos > 0 ? "!" : "·"}
              </div>
            ))}
          </div>
          {cola.some(p => p._intentos > 0) && (
            <p className="text-xs text-red-400/70 mt-2">! = pregunta fallada que vuelve</p>
          )}
        </div>

        <button type="button" onClick={() => useStore.getState().reiniciar()}
          className="mt-auto border border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300 text-sm font-semibold py-2.5 rounded-xl transition-all bg-transparent outline-none">
          <IconArrowLeft size={14} className="inline -mt-0.5 mr-1" /> Salir al inicio
        </button>
      </div>
    </div>
  );
}

// ─── TARJETA DE PREGUNTA + FOOTER ────────────────────────────────────────────
// Extraída de ModoInteligente junto con SidebarProgresoCola. Agrupa la
// flashcard animada (pregunta, pista, opciones, feedback) y el botón
// "Siguiente" del footer, que juntos eran la mitad del componente gigante.
function TarjetaPregunta({
  pregunta, totalOriginal, dominadas, racha, flashRacha, hintVisible, yaRespondida, esCorrecta,
  animSalida, estadoOpcion, consejo, generarHint, hintUsadoRef, dispatchQuestionUI,
  handleResponder, handleSiguiente, cola,
}) {
  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 md:px-10 flex flex-col pt-6 max-w-3xl mx-auto w-full pb-4">
            <AnimatePresence mode="wait">
              <m.div
                key={pregunta.id + (pregunta._intentos ?? 0)}
                initial={{ opacity: 0, x: animSalida === "correct" ? -40 : animSalida === "wrong" ? 40 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: animSalida === "correct" ? -60 : 60, scale: 0.95 }}
                transition={{ duration: 0.25 }}>

                {/* Header de la tarjeta */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1">
                      <IconBrain size={13} /> {dominadas.length + 1} / {totalOriginal}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${pregunta.dificultad <= 2 ? "border-emerald-500/30 text-emerald-400" : pregunta.dificultad <= 3 ? "border-amber-500/30 text-amber-400" : "border-red-500/30 text-red-400"}`}>
                      {pregunta.dificultad <= 2 ? "Fácil" : pregunta.dificultad <= 3 ? "Media" : "Difícil"}
                    </span>
                    {(pregunta._intentos ?? 0) > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full border border-red-500/30 text-red-400 bg-red-500/5">
                        <IconRefresh size={12} className="inline -mt-0.5 mr-1" /> Reintento {pregunta._intentos}
                      </span>
                    )}
                  </div>
                  <AnimatePresence>
                    {racha >= 2 && (
                      <m.div
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: flashRacha ? [1, 1.3, 1] : 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30">
                        <span className="text-sm"><IconFlame size={15} /></span>
                        <span className="text-xs font-black text-orange-300">{racha} racha</span>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Categoría */}
                <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl border border-purple-500/20"
                  style={{ background: "rgba(168,85,247,0.06)" }}>
                  <QuestionIcon name={pregunta.icono} className="w-4.5 h-4.5 text-purple-300 flex-shrink-0" />
                  <span className="text-purple-300 text-xs font-semibold">{pregunta.categoria}</span>
                </m.div>

                <ImagenPregunta src={pregunta.imagen} />
                <h2 className="text-xl md:text-2xl font-bold text-white leading-snug max-w-2xl mb-5 tracking-tight">{pregunta.pregunta}</h2>

                {/* Pista */}
                <AnimatePresence>
                  {!yaRespondida && (
                    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4">
                      {!hintVisible ? (
                        <button type="button" onClick={() => { dispatchQuestionUI({ type: "MOSTRAR_HINT" }); hintUsadoRef.current = true; }}
                          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-purple-400 transition-colors bg-transparent border-0 outline-none cursor-pointer">
                          <IconBulb size={13} /> Ver pista
                        </button>
                      ) : (
                        <m.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-purple-500/20 mb-1"
                          style={{ background: "rgba(168,85,247,0.06)" }}>
                          <span className="text-purple-400 flex-shrink-0 mt-0.5"><IconBulb size={14} /></span>
                          <p className="text-purple-200 text-xs leading-relaxed">{generarHint()}</p>
                        </m.div>
                      )}
                    </m.div>
                  )}
                </AnimatePresence>

                {/* Opciones */}
                <div className="flex flex-col gap-2.5">
                  {pregunta.opciones.map((op, i) => {
                    const estado = estadoOpcion(i);
                    return (
                      <m.button whileTap={{ scale: 0.985 }} key={`${pregunta.id}-${i}`}
                        onClick={() => handleResponder(i)}
                        disabled={yaRespondida}
                        className={`text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200 text-base font-medium ${yaRespondida && estado === "neutro" ? OPCION_ESTILOS.deshabilitado : OPCION_ESTILOS[estado]}`}
                        animate={estado === "correcta" ? { scale: [1, 1.015, 1] } : estado === "incorrecta" ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                        transition={{ duration: 0.3 }}>
                        <span className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-xl border-2 border-current flex items-center justify-center flex-shrink-0 font-black text-sm ${estado === "correcta" ? "bg-emerald-500/20" : estado === "incorrecta" ? "bg-red-500/20" : ""}`}>
                            {estado === "correcta" ? <IconCheck size={16} /> : estado === "incorrecta" ? <IconX size={16} /> : String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{op}</span>
                        </span>
                      </m.button>
                    );
                  })}
                </div>

                {/* Feedback post-respuesta */}
                <AnimatePresence>
                  {yaRespondida && (
                    <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="mt-5 flex flex-col gap-3">
                      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${esCorrecta ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"}`}>
                        <m.span initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.1 }} className="text-2xl flex-shrink-0">
                          {esCorrecta ? <IconCircleCheckFilled className="text-emerald-400" /> : <IconCircleX className="text-red-400" />}
                        </m.span>
                        <div>
                          <p className={`text-sm font-black ${esCorrecta ? "text-emerald-400" : "text-red-400"}`}>
                            {esCorrecta
                              ? racha >= 3 ? <>¡{racha} seguidas! <IconFlame size={14} className="inline -mt-1" /></> : "¡Correcto! Pregunta dominada"
                              : "Incorrecto — volverá al final"}
                          </p>
                          {!esCorrecta && (
                            <p className="text-slate-500 text-xs mt-0.5">
                              Respuesta correcta: <span className="text-emerald-400 font-semibold">{pregunta.opciones[pregunta.correcta]}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="px-4 py-3.5 rounded-2xl border border-slate-700/50" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><IconBook2 size={12} /> Explicación</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{pregunta.explicacion}</p>
                      </div>
                      {!esCorrecta && (
                        <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                          className="px-4 py-3.5 rounded-2xl border border-purple-500/25"
                          style={{ background: "rgba(168,85,247,0.06)" }}>
                          <p className="text-xs text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1"><IconBrain size={12} /> Consejo para recordar</p>
                          <p className="text-purple-200 text-sm leading-relaxed">{consejo}</p>
                        </m.div>
                      )}
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer con botón siguiente */}
        <div className="flex items-center justify-end px-5 md:px-10 py-4 border-t border-slate-800 flex-shrink-0">
          <AnimatePresence>
            {yaRespondida && (
              <m.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                onClick={handleSiguiente}
                className="px-8 py-2.5 font-bold rounded-xl transition-all text-sm text-white border-0 outline-none"
                style={{ background: esCorrecta ? "linear-gradient(135deg, #059669, #047857)" : "linear-gradient(135deg, #a855f7, #ec4899)", boxShadow: esCorrecta ? "0 4px 20px rgba(5,150,105,0.3)" : "0 4px 20px rgba(168,85,247,0.3)" }}>
                {esCorrecta
                  ? cola.length === 1 ? <><IconConfetti size={15} className="inline -mt-0.5 mr-1" /> ¡Terminé!</> : <>Siguiente <IconArrowRight size={15} className="inline -mt-0.5" /></>
                  : <>Entendido, siguiente <IconArrowRight size={15} className="inline -mt-0.5" /></>}
              </m.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function ModoInteligente() {
  const { preguntas: preguntasIniciales, clase } = useStore();

  // ── Cola dinámica de flashcards ──────────────────────────────────────────────
  const [cola, setCola] = useState(() => preguntasIniciales.map(p => ({ ...p, _intentos: 0 })));
  const [dominadas, setDominadas] = useState([]);
  const [questionUI, dispatchQuestionUI] = useReducer(questionUIReducer, {
    hintVisible: false,
    respuestaActual: null, // índice elegido
    animSalida: null, // "correct" | "wrong"
  });
  const { hintVisible, respuestaActual, animSalida } = questionUI;
  // Nunca se lee en el render (solo se marca para lógica futura), así
    // que no necesita disparar re-render: useRef en vez de useState.
  const hintUsadoRef = useRef(false);
  const [racha, setRacha] = useState(0);
  // rachaMax nunca se muestra en pantalla (solo se escribe), así que no
  // necesita disparar un re-render: useRef en vez de useState.
  const rachaMaxRef = useRef(0);
  const [flashRacha, setFlashRacha] = useState(false);

  const totalOriginal = preguntasIniciales.length;
  const pregunta = cola[0] ?? null;
  const yaRespondida = respuestaActual !== null;
  const esCorrecta = yaRespondida && respuestaActual === pregunta?.correcta;

  // Reset del estado de UI de la pregunta (hint, respuesta, animación de
  // salida) al cambiar de pregunta — un solo dispatch en vez de 3 setState.
  useEffect(() => {
    dispatchQuestionUI({ type: "RESET_PREGUNTA" });
    hintUsadoRef.current = false;
  }, [pregunta?.id]);

  const handleResponder = (i) => {
    if (yaRespondida) return;
    dispatchQuestionUI({ type: "RESPONDER", payload: i });
    const correcto = i === pregunta.correcta;
    if (correcto) {
      // El updater de setRacha antes calculaba la nueva racha Y de paso
      // escribía rachaMaxRef, encendía flashRacha y armaba un setTimeout:
      // si React llega a invocar el callback más de una vez (p. ej. en
      // Strict Mode, o en una futura concurrent feature), esos efectos
      // secundarios se hubieran repetido. Ahora la racha se calcula una
      // sola vez aquí (en el event handler, no en el updater) y el
      // updater de setRacha se limita a devolver el próximo estado.
      const nuevaRacha = racha + 1;
      setRacha(nuevaRacha);
      rachaMaxRef.current = Math.max(rachaMaxRef.current, nuevaRacha);
      setFlashRacha(true);
      setTimeout(() => setFlashRacha(false), 800);
    } else {
      setRacha(0);
    }
  };

  const handleSiguiente = () => {
    if (!yaRespondida) return;
    dispatchQuestionUI({ type: "SET_ANIM_SALIDA", payload: esCorrecta ? "correct" : "wrong" });
    setTimeout(() => {
      // Antes el updater de setCola calculaba la nueva cola Y, anidado
      // adentro, llamaba a setDominadas(...) y useStore.setState(...) como
      // efectos secundarios. Si React reejecuta un updater, esas llamadas
      // se hubieran duplicado. Ahora el updater es puro (solo calcula la
      // cola) y las actualizaciones de estado/navegación relacionadas se
      // hacen aquí, en el callback del timer, una sola vez cada una.
      const [actual, ...resto] = cola;
      if (esCorrecta) {
        const nuevasDominadas = [...dominadas, actual];
        if (resto.length === 0) {
          // Última pregunta dominada — navegar a resultado de forma directa
          const respuestasFinales = Object.fromEntries(nuevasDominadas.map((p, i) => [i, p.correcta]));
          useStore.setState({
            pantalla: "resultado",
            preguntas: nuevasDominadas,
            respuestas: respuestasFinales,
          });
          return;
        }
        setDominadas(nuevasDominadas);
        setCola(resto);
      } else {
        setCola([...resto, { ...actual, _intentos: (actual._intentos || 0) + 1 }]);
      }
    }, 280);
  };

  // ── Terminado: todas dominadas, o no había preguntas ────────────────────────
  if (cola.length === 0 && (dominadas.length > 0 || totalOriginal === 0)) {
    const preguntasFinales = dominadas.length > 0 ? dominadas : preguntasIniciales;
    const respuestasFinales = Object.fromEntries(preguntasFinales.map((p, i) => [i, p.correcta]));
    useStore.setState({
      pantalla: "resultado",
      preguntas: preguntasFinales,
      respuestas: respuestasFinales,
    });
    return null;
  }

  const estadoOpcion = (i) => {
    if (!yaRespondida) return "neutro";
    if (i === pregunta.correcta) return "correcta";
    if (i === respuestaActual) return "incorrecta";
    return "neutro";
  };

  const consejo = CONSEJO_POR_CATEGORIA[pregunta.categoria] ?? "Analiza cada opción descartando las claramente incorrectas primero.";

  const generarHint = () => {
    const opCorrecta = pregunta.opciones[pregunta.correcta];
    const palabrasClave = opCorrecta.split(" ").filter(w => w.length > 4).slice(0, 2).join(" y ");
    return palabrasClave
      ? `Piensa en conceptos relacionados con: ${palabrasClave.toLowerCase()}.`
      : "Lee con atención cada opción antes de responder.";
  };

  const pctDominadas = Math.min(100, Math.round((dominadas.length / totalOriginal) * 100));

  return (
    <div className="flex w-full h-full overflow-hidden relative">
      <ProgressTopBar />
      {/* Sidebar desktop */}
      <SidebarProgresoCola clase={clase} dominadas={dominadas} totalOriginal={totalOriginal} pctDominadas={pctDominadas} cola={cola} />

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />

        {/* Header de progreso móvil */}
        <div className="md:hidden px-4 py-2 border-b border-slate-800 flex items-center gap-3 flex-shrink-0">
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <m.div className="h-full w-full rounded-full"
              style={{ background: "linear-gradient(90deg, #a855f7, #ec4899)", transformOrigin: "left" }}
              animate={{ scaleX: pctDominadas / 100 }}
              transition={{ duration: 0.5 }} />
          </div>
          <span className="text-xs font-bold text-pink-400 flex-shrink-0">{Math.min(dominadas.length, totalOriginal)}/{totalOriginal}</span>
          <span className="text-xs text-slate-600 flex-shrink-0">{cola.length} restantes</span>
        </div>

        <TarjetaPregunta
          pregunta={pregunta} totalOriginal={totalOriginal} dominadas={dominadas} racha={racha} flashRacha={flashRacha}
          hintVisible={hintVisible} yaRespondida={yaRespondida} esCorrecta={esCorrecta} animSalida={animSalida}
          estadoOpcion={estadoOpcion} consejo={consejo} generarHint={generarHint} hintUsadoRef={hintUsadoRef}
          dispatchQuestionUI={dispatchQuestionUI} handleResponder={handleResponder} handleSiguiente={handleSiguiente} cola={cola}
        />
      </div>
    </div>
  );
}


// NOTA: PanelInteligente no está siendo usado en ningún lado (ni aquí ni en
// otras pantallas). Lo dejo tal cual estaba en App.jsx para no cambiar
// comportamiento en esta pasada — es candidato a eliminar en un cleanup
// de "código muerto" aparte.
function PanelInteligente({ pregunta, correctasHasta, preguntas, respuestas }) {
  const respondidas = Object.keys(respuestas).length;
  const pctAcierto = respondidas > 0 ? Math.round((correctasHasta / respondidas) * 100) : null;
  const fallosPorCat = {};
  Object.entries(respuestas).forEach(([i, r]) => {
    const p = preguntas[+i];
    if (!p || r === p.correcta) return;
    fallosPorCat[p.categoria] = (fallosPorCat[p.categoria] || 0) + 1;
  });
  const topFallos = Object.entries(fallosPorCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const faciles = preguntas.filter(p => p.dificultad <= 2).length;
  const medias = preguntas.filter(p => p.dificultad === 3).length;
  const dificiles = preguntas.filter(p => p.dificultad >= 4).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-slate-700/50 p-4" style={{ background: "rgba(168,85,247,0.04)" }}>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Esta pregunta</p>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-500/20" style={{ background: "rgba(168,85,247,0.1)" }}><QuestionIcon name={pregunta.icono} className="w-5 h-5 text-purple-300" /></div>
          <div>
            <p className="text-white font-bold text-sm">{pregunta.categoria}</p>
            <div className="flex gap-1 mt-1">{[1,2,3,4,5].map(n => <div key={n} className={`h-1.5 w-4 rounded-full ${n <= pregunta.dificultad ? "bg-purple-400" : "bg-slate-700"}`} />)}</div>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">Distribución del examen: esta categor\u00eda representa hasta el <span className="text-purple-400 font-semibold">{pregunta.categoria === "Se\u00f1ales de Tr\u00e1nsito" ? "20" : pregunta.categoria === "Normas de Tr\u00e1nsito" ? "18" : pregunta.categoria === "Conducta Vial" ? "12" : "~8"}%</span> del examen real.</p>
      </div>
      <div className="rounded-2xl border border-slate-700/50 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Sesi\u00f3n actual</p>
        <div className="space-y-3">
          {[
            { label: "Respondidas", valor: respondidas, total: preguntas.length, color: "bg-blue-500" },
            { label: "Correctas", valor: correctasHasta, total: preguntas.length, color: "bg-emerald-500" },
            { label: "Errores", valor: respondidas - correctasHasta, total: preguntas.length, color: "bg-red-500" },
          ].map(({ label, valor, total, color }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-300 font-semibold">{valor}<span className="text-slate-600">/{total}</span></span>
              </div>
              <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <m.div className={`h-full w-full ${color} rounded-full`} style={{ transformOrigin: "left" }} animate={{ scaleX: total > 0 ? valor / total : 0 }} transition={{ duration: 0.5 }} />
              </div>
            </div>
          ))}
        </div>
        {pctAcierto !== null && (
          <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-center justify-between">
            <span className="text-xs text-slate-500">Tasa de acierto</span>
            <span className={`text-sm font-black ${pctAcierto >= 70 ? "text-emerald-400" : pctAcierto >= 50 ? "text-amber-400" : "text-red-400"}`}>{pctAcierto}%</span>
          </div>
        )}
      </div>
      {topFallos.length > 0 && (
        <div className="rounded-2xl border border-red-500/20 p-4" style={{ background: "rgba(239,68,68,0.04)" }}>
          <p className="text-xs text-red-400/70 uppercase tracking-widest mb-3">{"\u26A0"} Puntos d\u00e9biles hoy</p>
          <div className="flex flex-col gap-2">
            {topFallos.map(([cat, n]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-slate-400 text-xs truncate pr-2">{cat}</span>
                <span className="text-red-400 text-xs font-bold flex-shrink-0">{n} {n === 1 ? "error" : "errores"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-2xl border border-slate-700/50 p-4" style={{ background: "rgba(255,255,255,0.015)" }}>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Mix de dificultad</p>
        <div className="flex gap-2">
          {[
            { label: "F\u00e1cil", n: faciles, color: "bg-emerald-500" },
            { label: "Media", n: medias, color: "bg-amber-500" },
            { label: "Dif\u00edcil", n: dificiles, color: "bg-red-500" },
          ].map(({ label, n, color }) => (
            <div key={label} className="flex-1 text-center">
              <div className={`h-1.5 rounded-full mb-1.5 ${color}`} style={{ opacity: n > 0 ? 0.8 : 0.2 }} />
              <p className="text-white font-black text-sm">{n}</p>
              <p className="text-slate-600 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}