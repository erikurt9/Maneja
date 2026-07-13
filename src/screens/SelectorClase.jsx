import { useState } from "react";
import { m } from "framer-motion";

const SELECTOR_CLASE_COLORS = {
  blue:    { badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",    btn: "bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20",    btnActive: "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30" },
  amber:   { badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",  btn: "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20",  btnActive: "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30" },
  emerald: { badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", btn: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20", btnActive: "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30" },
};
const OPCIONES_PREGUNTAS = [10, 15, 25, 35];

// Contenido interno reutilizable para mobile/desktop. Se declara fuera de
// SelectorClase (a nivel de módulo) para que no se vuelva a crear en cada
// render — si se define adentro, React trata cada render como un
// componente "nuevo" y sus hijos pierden el estado/las animaciones.
function SelectorClaseContenido({ small, soloEstudio, numPreguntas, setNumPreguntas, c, clasePreseleccionada, onSeleccionar, modo }) {
  return (
    <>
      {/* Selector de cantidad — SOLO para modo estudio */}
      {soloEstudio && (
        <div className={`${small ? "mb-4" : "mb-5"} rounded-xl border border-slate-700/60 p-3`} style={{ background: "rgba(255,255,255,0.02)" }}>
          <p className={`text-slate-400 font-semibold mb-2.5 ${small ? "text-xs" : "text-sm"}`}>¿Cuántas preguntas?</p>
          <div className="flex gap-2">
            {OPCIONES_PREGUNTAS.map(n => (
              <button type="button" key={n} onClick={() => setNumPreguntas(n)}
                className={`flex-1 ${small ? "py-2 text-sm" : "py-2.5 text-base"} font-black rounded-xl border-2 transition-all outline-none ${numPreguntas === n ? c.btnActive : c.btn}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Si clase ya está definida: solo botón Comenzar */}
      {clasePreseleccionada ? (
        <button type="button" onClick={() => onSeleccionar(modo, clasePreseleccionada, soloEstudio ? numPreguntas : 35)}
          className={`w-full ${small ? "py-3 text-base" : "py-3.5 text-lg"} rounded-2xl font-black text-white transition-all outline-none ${c.btnActive}`}>
          Comenzar →
        </button>
      ) : (
        /* Sin clase: mostrar selector de clase */
        <div className="flex flex-col gap-3">
          <button type="button" onClick={() => onSeleccionar(modo, "B", soloEstudio ? numPreguntas : 35)}
            className="text-left p-4 rounded-2xl border-2 transition-all active:scale-98 outline-none border-blue-500/30 hover:border-blue-500"
            style={{ background: "rgba(59,130,246,0.06)" }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-2xl flex-shrink-0">🚗</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white font-black">Clase B</span>
                  <span className="text-xs font-semibold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Automóvil</span>
                </div>
                <p className="text-slate-400 text-xs leading-snug">Vehículos de hasta 9 pasajeros y 3.500 kg.</p>
              </div>
            </div>
          </button>
          <button type="button" onClick={() => onSeleccionar(modo, "C", soloEstudio ? numPreguntas : 35)}
            className="text-left p-4 rounded-2xl border-2 transition-all active:scale-98 outline-none border-orange-500/30 hover:border-orange-500"
            style={{ background: "rgba(249,115,22,0.06)" }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-2xl flex-shrink-0">🏍️</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white font-black">Clase C</span>
                  <span className="text-xs font-semibold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">Motocicleta</span>
                </div>
                <p className="text-slate-400 text-xs leading-snug">Motocicletas y motonetas.</p>
              </div>
            </div>
          </button>
          <p className="text-xs text-slate-600 text-center mt-1">Preguntas basadas en el Manual del Conductor · Chile</p>
        </div>
      )}
    </>
  );
}

export default function SelectorClase({ modo, clasePreseleccionada, onSeleccionar, onCancelar }) {
  const [numPreguntas, setNumPreguntas] = useState(35);
  const soloEstudio = modo === "estudio";
  const nombreModo = modo === "examen" ? "Modo Examen" : modo === "estudio" ? "Modo Estudio" : "Modo Inteligente";
  const colorModo = modo === "examen" ? "blue" : modo === "estudio" ? "amber" : "emerald";
  const c = SELECTOR_CLASE_COLORS[colorModo];

  const titulo = clasePreseleccionada
    ? (soloEstudio ? "¿Cuántas preguntas?" : "¿Listo para empezar?")
    : "¿Qué licencia quieres practicar?";

  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:px-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={onCancelar}>

      {/* Mobile bottom sheet */}
      <m.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 35 }}
        drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_, info) => { if (info.offset.y > 80) onCancelar(); }}
        className="md:hidden relative w-full rounded-t-3xl border-t border-slate-700/60 px-5 pt-4 pb-10 overflow-y-auto"
        style={{ background: "#0d1626", maxHeight: "92vh" }}
        onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 rounded-full bg-slate-600 mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${c.badge} uppercase tracking-widest`}>{nombreModo}</span>
            <h2 className="text-xl font-black text-white mt-2">{titulo}</h2>
          </div>
          <button type="button" onClick={onCancelar} aria-label="Cerrar" className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border-0 outline-none transition-colors flex-shrink-0 ml-3">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <SelectorClaseContenido small={true} soloEstudio={soloEstudio} numPreguntas={numPreguntas}
          setNumPreguntas={setNumPreguntas} c={c} clasePreseleccionada={clasePreseleccionada}
          onSeleccionar={onSeleccionar} modo={modo} />
      </m.div>

      {/* Desktop modal */}
      <m.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="hidden md:block w-full max-w-md rounded-3xl border border-slate-700/60 p-8"
        style={{ background: "#0d1626" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${c.badge} uppercase tracking-widest`}>{nombreModo}</span>
            <h2 className="text-2xl font-black text-white mt-3">{titulo}</h2>
          </div>
          <button type="button" onClick={onCancelar} aria-label="Cerrar" className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border-0 outline-none transition-colors flex-shrink-0 ml-4">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <SelectorClaseContenido small={false} soloEstudio={soloEstudio} numPreguntas={numPreguntas}
          setNumPreguntas={setNumPreguntas} c={c} clasePreseleccionada={clasePreseleccionada}
          onSeleccionar={onSeleccionar} modo={modo} />
      </m.div>
    </m.div>
  );
}

