import { useState, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { PREGUNTAS } from "../preguntas.js";
import { PREGUNTAS_MOTO } from "../preguntas_moto.js";
import { PREGUNTAS_PROFESIONAL } from "../preguntas_profesional.js";
import QuestionIcon from "../components/QuestionIcon";
import { IconArrowLeft, IconBook2, IconCheck, IconBulb } from "@tabler/icons-react";

const CLASES_PROFESIONALES = ["A1", "A2", "D", "E"];

export default function BancoPreguntas({ onVolver, clase = "B" }) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [expandida, setExpandida] = useState(null);
  const scrollRef = useRef(null);

  const banco = CLASES_PROFESIONALES.includes(clase)
    ? PREGUNTAS_PROFESIONAL.filter(p => p.clases.includes(clase))
    : clase === "C" ? PREGUNTAS_MOTO : PREGUNTAS;

  const categorias = ["Todas", ...Array.from(new Set(banco.map(p => p.categoria))).sort()];

  const filtradas = busqueda.trim() === "" && categoriaFiltro === "Todas"
    ? banco
    : banco.filter(p => {
        const matchCat = categoriaFiltro === "Todas" || p.categoria === categoriaFiltro;
        const matchBusq = busqueda.trim() === "" || p.pregunta.toLowerCase().includes(busqueda.toLowerCase()) || p.opciones.some(o => o.toLowerCase().includes(busqueda.toLowerCase()));
        return matchCat && matchBusq;
      });

  const handleBusqueda = (val) => {
    setBusqueda(val);
    setExpandida(null);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const handleCategoria = (cat) => {
    setCategoriaFiltro(cat);
    setExpandida(null);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Sidebar filtros desktop */}
      <div className="hidden md:flex w-60 flex-shrink-0 border-r border-slate-800 flex-col overflow-hidden">
        {/* Header sidebar */}
        <div className="p-5 pb-3 flex-shrink-0">
          <button type="button" onClick={onVolver}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-semibold mb-5 bg-transparent border-0 outline-none p-0">
            <IconArrowLeft size={15} className="inline -mt-0.5 mr-1" /> Volver
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo_new.png" alt="Maneja" className="w-7 h-7 object-contain" style={{ filter: "drop-shadow(0 2px 6px rgba(60,120,255,0.4))" }} />
          </div>
        </div>

        {/* Categorías con scroll propio */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <p className="text-xs text-slate-500 uppercase tracking-widest px-2 mb-2">Categorías</p>
          <div className="flex flex-col gap-0.5">
            {categorias.map(cat => (
              <button type="button" key={cat} onClick={() => handleCategoria(cat)}
                className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors font-medium flex items-center justify-between border-0 outline-none ${categoriaFiltro === cat ? "bg-blue-500/20 text-blue-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 bg-transparent"}`}>
                <span className="truncate">{cat}</span>
                {cat !== "Todas" && (
                  <span className="text-xs text-slate-600 flex-shrink-0 ml-2">
                    {banco.filter(p => p.categoria === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contador */}
        <div className="p-3 border-t border-slate-800 flex-shrink-0 text-center">
          <span className="text-lg font-black text-white">{filtradas.length}</span>
          <span className="text-xs text-slate-500 ml-1.5">preguntas</span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 flex-shrink-0">
          <button type="button" onClick={onVolver} className="md:hidden text-slate-300 hover:text-white transition-colors font-semibold text-sm bg-transparent border-0 outline-none p-0"><IconArrowLeft size={15} className="inline -mt-0.5 mr-1" /> Volver</button>
          <h2 className="text-white font-black text-base flex-1 flex items-center gap-2"><IconBook2 size={17} /> Banco de Preguntas</h2>
          <input value={busqueda} onChange={e => handleBusqueda(e.target.value)}
            placeholder="Buscar pregunta..."
            className="hidden md:block w-64 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-600 border border-slate-700/60 focus:outline-none focus:border-blue-500 transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>

        {/* Búsqueda móvil */}
        <div className="md:hidden px-4 py-3 border-b border-slate-800 flex-shrink-0">
          <input value={busqueda} onChange={e => handleBusqueda(e.target.value)}
            placeholder="Buscar pregunta..."
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 border border-slate-700/60 focus:outline-none focus:border-blue-500 transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>

        {/* Filtro categoría móvil */}
        <div className="md:hidden flex gap-2 px-4 py-3 overflow-x-auto flex-shrink-0 border-b border-slate-800">
          {categorias.map(cat => (
            <button type="button" key={cat} onClick={() => handleCategoria(cat)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all border outline-none ${categoriaFiltro === cat ? "bg-blue-500/20 text-blue-400 border-blue-500/40" : "text-slate-500 border-slate-700/60 bg-transparent"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Lista preguntas */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-5">
          <div className="max-w-3xl mx-auto flex flex-col gap-2.5">
            {filtradas.length === 0 ? (
              <div className="text-center py-20 text-slate-600">No se encontraron preguntas.</div>
            ) : filtradas.map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-700/50 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <button type="button" className="w-full text-left px-5 py-4 flex items-start gap-4 bg-transparent border-0 outline-none"
                  onClick={() => setExpandida(expandida === p.id ? null : p.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1"><QuestionIcon name={p.icono} className="w-3.5 h-3.5" /> {p.categoria}</span>
                      <span className="flex gap-0.5">{[1,2,3,4,5].map(n => <span key={n} className={`w-1.5 h-1.5 rounded-full ${n <= p.dificultad ? "bg-amber-400/70" : "bg-slate-700"}`}/>)}</span>
                    </div>
                    <p className="text-slate-200 text-sm font-medium leading-snug">{p.pregunta}</p>
                  </div>
                  <span className={`text-slate-500 transition-transform flex-shrink-0 mt-1 ${expandida === p.id ? "rotate-180" : ""}`}>▾</span>
                </button>
                <AnimatePresence>
                  {expandida === p.id && (
                    <m.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden">
                      <div className="px-5 pb-5 border-t border-slate-700/40 pt-4">
                        {p.imagen && (
                          <div className="mb-4 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-800/40 flex items-center justify-center">
                            <img src={p.imagen} alt="" className="max-h-40 object-contain p-3" />
                          </div>
                        )}
                        <div className="flex flex-col gap-2 mb-4">
                          {p.opciones.map((op, j) => (
                            <div key={j} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium ${j === p.correcta ? "border-emerald-500/50 text-emerald-300" : "border-slate-700/40 text-slate-500"}`}
                              style={{ background: j === p.correcta ? "rgba(16,185,129,0.06)" : "transparent" }}>
                              <span className={`w-6 h-6 rounded-lg border-2 border-current flex items-center justify-center flex-shrink-0 text-xs font-black ${j === p.correcta ? "bg-emerald-500/20" : ""}`}>
                                {j === p.correcta ? <IconCheck size={14} /> : String.fromCharCode(65 + j)}
                              </span>
                              <span className="flex-1">{op}</span>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-xl border border-slate-700/40 px-4 py-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><IconBulb size={12} /> Explicación</p>
                          <p className="text-slate-300 text-sm leading-relaxed">{p.explicacion}</p>
                        </div>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

