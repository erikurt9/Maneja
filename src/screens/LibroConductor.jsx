import { IconArrowLeft, IconBook2, IconExternalLink } from "@tabler/icons-react";

export default function LibroConductor({ onVolver }) {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 flex-shrink-0">
        <button type="button" onClick={onVolver} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm font-semibold">
          <IconArrowLeft size={15} /> Volver
        </button>
        <div className="w-px h-4 bg-slate-700" />
        <h2 className="text-white font-black text-lg flex items-center gap-2"><IconBook2 size={18} /> Manual del Conductor</h2>
        <a href="https://mejoresconductores.conaset.cl/assets/data/pdf/B-ESP/Libro_para_la_conduccion_en_Chile_Clase%20B_actualizacion_6_de_agosto_2024.pdf"
          target="_blank" rel="noopener noreferrer"
          className="ml-auto text-xs text-blue-400 hover:text-blue-300 font-semibold px-3 py-1.5 rounded-xl border border-blue-500/30 hover:border-blue-500/60 transition-all">
          Abrir en nueva pestaña <IconExternalLink size={13} className="inline -mt-0.5" />
        </a>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe
          src="https://mejoresconductores.conaset.cl/assets/data/pdf/B-ESP/Libro_para_la_conduccion_en_Chile_Clase%20B_actualizacion_6_de_agosto_2024.pdf"
          className="w-full h-full border-0"
          title="Manual del Conductor Chileno"
          sandbox="allow-scripts allow-popups"
        />
      </div>
    </div>
  );
}