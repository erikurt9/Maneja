import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { generarExamenAdaptativo, obtenerPreguntasDebiles } from "./adaptativo.js";
import { useAuth } from "./useAuth.js";
import { InicioCompleto } from "./iniciocompleto.jsx";
import { AuthModal } from "./AuthModal.jsx";
import { Dashboard } from "./Dashboard.jsx";
import { useGameStore } from "./useGameStore.js";
import {
  NoLivesModal,
  InteligenteLockedModal,
  DevPanel,
} from "./FreemiumUI.jsx";

import { useStore } from "./store/quizStore.js";
import ModoExamen from "./screens/ModoExamen.jsx";
import ModoInteligente from "./screens/ModoInteligente.jsx";
import ModoEstudio from "./screens/ModoEstudio.jsx";
import BancoPreguntas from "./screens/BancoPreguntas.jsx";
import LibroConductor from "./screens/LibroConductor.jsx";
import ResultadoInteligente from "./screens/ResultadoInteligente.jsx";
import Resultado from "./screens/Resultado.jsx";
import SelectorClase from "./screens/SelectorClase.jsx";
import { OnboardingDiagnostico } from "./screens/OnboardingDiagnostico.jsx";
import { CarruselModos } from "./screens/CarruselModos.jsx";
import { tieneExamenesPrevios } from "./db.js";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import {
  inicializarNotificaciones,
  programarNotificacionVidaLista,
  programarRecordatorioRacha,
} from "./Notificaciones.js";

export default function App() {
  const { pantalla, modo } = useStore();
  const { user, loading, registrar, login, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalModo, setAuthModalModo] = useState("login");
  const [pantallaExtra, setPantallaExtra] = useState(null);
  const [claseExtra, setClaseExtra] = useState("B");
  const [claseGlobal, setClaseGlobal] = useState("B");
  // claseSeleccionada nunca se lee en el render (solo se escribe), así que
  // no necesita disparar un re-render del componente: useRef en vez de useState.
  const claseSeleccionadaRef = useRef("B");
  const handleClaseChange = (c) => {
    setClaseGlobal(c);
    claseSeleccionadaRef.current = c;
    // Persist en el store para que reiniciar() vuelva a la misma clase
    useStore.setState({ clase: c });
  };
  // Al volver de un modo, leer la clase del store para pasarla al Dashboard
  const claseDelStore = useStore((s) => s.clase);
  const [legalTipo, setLegalTipo] = useState(null);
  const [selectorClase, setSelectorClase] = useState(null);
  const [claseParaSelector, setClaseParaSelector] = useState(null);
  const [showNoLivesModal, setShowNoLivesModal] = useState(false);
  const [showInteligenteModal, setShowInteligenteModal] = useState(false);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  // "cargando" evita el parpadeo Dashboard→Onboarding mientras se resuelve
  // el check; "mostrar" solo puede ocurrir una vez por usuario (se marca en
  // localStorage apenas se decide, sea porque completó o porque omitió).
  const [onboardingEstado, setOnboardingEstado] = useState("cargando");

  useEffect(() => {
    if (!user) { setOnboardingEstado("cargando"); return; }
    const key = `maneja_onboarding_visto_${user.id}`;
    if (localStorage.getItem(key)) { setOnboardingEstado("oculto"); return; }
    let cancelado = false;
    tieneExamenesPrevios()
      .then((tiene) => {
        if (cancelado) return;
        if (tiene) { localStorage.setItem(key, "1"); setOnboardingEstado("oculto"); }
        else setOnboardingEstado("mostrar");
      })
      .catch(() => { if (!cancelado) setOnboardingEstado("oculto"); }); // ante cualquier error, no bloquear el acceso al dashboard
    return () => { cancelado = true; };
  }, [user]);

  const marcarOnboardingVisto = () => {
    if (user) localStorage.setItem(`maneja_onboarding_visto_${user.id}`, "1");
    setOnboardingEstado("oculto");
  };

  // Carrusel "¿qué modo uso?" — independiente del onboarding de diagnóstico:
  // se muestra una sola vez apenas el Dashboard es visible, sin importar si
  // el usuario es nuevo o ya tenía exámenes (mucha gente nunca entendió la
  // diferencia entre Examen/Estudio/Inteligente). Flag propio en localStorage
  // para no volver a interrumpir una vez visto u omitido.
  const [showCarruselModos, setShowCarruselModos] = useState(false);
  useEffect(() => {
    if (!user) return;
    const key = `maneja_modos_visto_${user.id}`;
    if (!localStorage.getItem(key)) setShowCarruselModos(true);
  }, [user]);
  const cerrarCarruselModos = () => {
    if (user) localStorage.setItem(`maneja_modos_visto_${user.id}`, "1");
    setShowCarruselModos(false);
  };

  // Cuando se vuelve al inicio desde modo inteligente, recargar dashboard.
  // Antes se mutaba prevPantallaRef.current durante el render (patrón
  // "Adjusting state when a prop changes"), pero React puede descartar o
  // repetir un render sin commitear, dejando la ref desincronizada del
  // estado real. Se mueve a un useEffect: sigue disparándose antes de que
  // el usuario vea el dashboard viejo (los efectos corren antes del paint
  // del navegador), pero ahora la escritura de la ref solo ocurre para
  // renders que React efectivamente confirma.
  const prevPantallaRef = useRef(pantalla);
  useEffect(() => {
    if (prevPantallaRef.current !== pantalla) {
      prevPantallaRef.current = pantalla;
      if (pantalla === "inicio" && user) {
        setDashboardRefreshKey(k => k + 1);
      }
    }
  }, [pantalla, user]);

  useEffect(() => {
    window.__showNoLivesModal = () => setShowNoLivesModal(true);
    return () => { delete window.__showNoLivesModal; };
  }, []);

  // Sync from Supabase on login
  useEffect(() => {
    if (user) useGameStore.getState().syncFromProfile();
  }, [user]);

  // Notificaciones locales de re-enganche: el recordatorio de racha se agenda
  // una sola vez por sesión iniciada (Capacitor lo repite solo cada día a la
  // misma hora, no hace falta reprogramarlo). La de "vida lista" se maneja
  // en un efecto aparte más abajo porque depende de lives/lastLifeLoss.
  useEffect(() => {
    if (!user) return;
    inicializarNotificaciones().then(() => programarRecordatorioRacha());
  }, [user]);

  // Vida lista: cada vez que cambian lives/lastLifeLoss/isPremium se
  // recalcula getNextLifeRegenAt() y se reprograma (o cancela, si llegó al
  // máximo o es premium) la notificación — programarNotificacionVidaLista
  // ya cancela la anterior antes de agendar la nueva, así que nunca quedan
  // duplicadas.
  const lives = useGameStore((s) => s.lives);
  const lastLifeLoss = useGameStore((s) => s.lastLifeLoss);
  const isPremium = useGameStore((s) => s.isPremium);
  useEffect(() => {
    if (!user) return;
    if (isPremium) { programarNotificacionVidaLista(null); return; }
    programarNotificacionVidaLista(useGameStore.getState().getNextLifeRegenAt());
  }, [user, lives, lastLifeLoss, isPremium]);

  // Check regen every minute
  useEffect(() => {
    useGameStore.getState().checkLifeRegen();
    useGameStore.getState().checkInteligenteReset();
    const t = setInterval(() => {
      useGameStore.getState().checkLifeRegen();
      useGameStore.getState().checkInteligenteReset();
    }, 60000);
    return () => clearInterval(t);
  }, []);

  // ── Botón/gesto atrás nativo de Android ─────────────────────────────────
  // Sin esto, el botón atrás del sistema simplemente cierra la app desde
  // cualquier pantalla — la queja más común en reviews de Play Store de apps
  // mal portadas. El orden importa: se cierra siempre el elemento visible de
  // MAYOR prioridad (modales antes que pantallas), nunca más de uno por
  // toque. Solo se llega a "salir de la app" cuando ya se está en Inicio sin
  // nada más abierto — el mismo comportamiento que espera cualquier usuario
  // de Android en la pantalla raíz.
  //
  // Se usa un ref (en vez de agregar cada estado a las deps del effect) para
  // no tener que des-registrar y volver a registrar el listener nativo en
  // cada cambio de pantalla — se registra una sola vez y siempre lee el
  // estado más reciente a través de backStateRef.current.
  const backStateRef = useRef();
  backStateRef.current = {
    showAuthModal, legalTipo, selectorClase, showNoLivesModal,
    showInteligenteModal, showCarruselModos, pantallaExtra, pantalla,
  };
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listenerPromise = CapacitorApp.addListener("backButton", () => {
      const s = backStateRef.current;
      if (s.showAuthModal) return setShowAuthModal(false);
      if (s.legalTipo) return setLegalTipo(null);
      if (s.selectorClase) return setSelectorClase(null);
      if (s.showNoLivesModal) { setShowNoLivesModal(false); return useStore.getState().reiniciar(); }
      if (s.showInteligenteModal) return setShowInteligenteModal(false);
      if (s.showCarruselModos) return cerrarCarruselModos();
      if (s.pantallaExtra) return setPantallaExtra(null);
      // "Salir al inicio" — mismo botón que ya existe en el sidebar del quiz.
      if (s.pantalla === "examen" || s.pantalla === "resultado") return useStore.getState().reiniciar();
      // Ya en Inicio, sin nada abierto: comportamiento nativo esperado.
      CapacitorApp.exitApp();
    });
    return () => { listenerPromise.then((l) => l.remove()); };
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: "#0a0f1a" }}>
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleIniciar = (modo, clase) => {
    if (modo === "inteligente") {
      const { canUseInteligente, isPremium } = useGameStore.getState();
      if (!canUseInteligente() && !isPremium) {
        setShowInteligenteModal(true);
        return;
      }
    }
    if (modo === "estudio") {
      const { lives, isPremium } = useGameStore.getState();
      if (!isPremium && lives === 0) {
        setShowNoLivesModal(true);
        return; // bloqueado — sin vidas, se muestra el modal con countdown
      }
    }
    if (modo === "examen" || modo === "inteligente") {
      // Examen e inteligente: no piden cantidad, van directo
      if (clase) {
        handleIniciarConClase(modo, clase, 35);
      } else {
        setClaseParaSelector(null);
        setSelectorClase(modo);
      }
    } else {
      // Solo modo estudio pide cantidad de preguntas
      if (clase) {
        setClaseParaSelector(clase);
      } else {
        setClaseParaSelector(null);
      }
      setSelectorClase(modo);
    }
  };
const handleIniciarConClase = async (modo, clase, numPreguntas = 35) => {
  setSelectorClase(null);
  setPantallaExtra(null);
  if (user && modo === "inteligente") {
    // Register daily session for free users
    useGameStore.getState().useInteligenteSession();
    try {
      const debiles = await obtenerPreguntasDebiles(clase);
      if (debiles.length > 0) {
        useStore.getState().iniciar(modo, clase, debiles, numPreguntas);
      } else {
        useStore.getState().iniciar(modo, clase, null, numPreguntas);
      }
    } catch {
      useStore.getState().iniciar(modo, clase, null, numPreguntas);
    }
  } else if (user && modo !== "inteligente") {
    try {
      const preguntasAdaptativas = await generarExamenAdaptativo(clase);
      useStore.getState().iniciar(modo, clase, preguntasAdaptativas, numPreguntas);
    } catch {
      useStore.getState().iniciar(modo, clase, null, numPreguntas);
    }
  } else {
    useStore.getState().iniciar(modo, clase, null, numPreguntas);
  }
};
  const handleCancelarSelector = () => { setSelectorClase(null); };

  const handleAuthSuccess = async (modoAuth, email, password) => {
    if (modoAuth === "registro") return await registrar(email, password);
    return await login(email, password);
  };

  const handleLogout = async () => {
    await logout();
    setPantallaExtra(null);
    useStore.getState().reiniciar();
  };

  const handleLoginClick = () => { setAuthModalModo("login"); setShowAuthModal(true); };
  const handleLegal = (tipo) => setLegalTipo(tipo);
  const mostrarOnboarding = user && pantalla === "inicio" && !pantallaExtra && onboardingEstado === "mostrar";
  const mostrarDashboard = user && pantalla === "inicio" && !pantallaExtra && onboardingEstado === "oculto";

  const handleComenzarDiagnostico = () => {
    marcarOnboardingVisto();
    handleIniciarConClase("examen", claseGlobal, 8);
  };

  return (
    <m.div
      animate={{ background: claseGlobal === "C" ? "#0f0b08" : "#0a0f1a" }}
      transition={{ duration: 0.6 }}
      className="w-screen h-screen overflow-hidden flex flex-col">
      <m.div
        animate={{
          background: claseGlobal === "C"
            ? "radial-gradient(ellipse at 0% 100%, rgba(100,45,0,0.12) 0%, transparent 35%)"
            : "radial-gradient(ellipse at 15% 50%, #0f2040 0%, transparent 55%), radial-gradient(ellipse at 85% 10%, #0d1f3c 0%, transparent 50%)"
        }}
        transition={{ duration: 0.6 }}
        style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
      />
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal modoInicial={authModalModo} onSuccess={async (m, e, p) => { const u = await handleAuthSuccess(m, e, p); setShowAuthModal(false); return u; }} onClose={() => setShowAuthModal(false)} />
        )}
        {selectorClase && (
          <SelectorClase modo={selectorClase} clasePreseleccionada={claseParaSelector} onSeleccionar={handleIniciarConClase} onCancelar={handleCancelarSelector} user={user} />
        )}
        {legalTipo && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={() => setLegalTipo(null)}>
            <m.div initial={{ scale: 0.94, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-slate-700/60 p-8"
              style={{ background: "#0d1626" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black text-white capitalize">{legalTipo}</h2>
                <button type="button" onClick={() => setLegalTipo(null)} className="w-6 h-6 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-colors ml-4 flex-shrink-0 bg-slate-700 hover:bg-slate-600 border-0 outline-none text-sm">
                  X
                </button>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                {legalTipo === "privacidad" && "Maneja no recopila ni vende datos personales. Tu email se usa únicamente para identificar tu cuenta y guardar tu progreso. No enviamos spam."}
                {legalTipo === "terminos" && "Maneja es una herramienta de estudio sin fines de lucro. Las preguntas están basadas en el Manual del Conductor Chileno de acceso público. Maneja no está afiliada ni representada por CONASET, SEMUC ni ningún organismo gubernamental. No garantizamos resultados en el examen real."}
                {legalTipo === "contacto" && "¿Tienes dudas, errores o sugerencias? Escríbenos a contacto@maneja.cl y te respondemos a la brevedad."}
              </p>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
      <div className="relative z-10 flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {pantallaExtra === "banco" && user && (
            <m.div key="banco" className="flex w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BancoPreguntas onVolver={() => setPantallaExtra(null)} clase={claseExtra} />
            </m.div>
          )}
          {pantallaExtra === "libro" && user && (
            <m.div key="libro" className="flex w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LibroConductor onVolver={() => setPantallaExtra(null)} />
            </m.div>
          )}
          {user && pantalla === "inicio" && !pantallaExtra && onboardingEstado === "cargando" && (
            <m.div key="onboarding-check" className="flex w-full h-full items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </m.div>
          )}
          {mostrarOnboarding && (
            <m.div key="onboarding" className="flex w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OnboardingDiagnostico
                clase={claseGlobal}
                onComenzar={handleComenzarDiagnostico}
                onOmitir={marcarOnboardingVisto}
              />
            </m.div>
          )}
          {mostrarDashboard && !pantallaExtra && (
            <m.div key="dashboard" className="flex w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard user={user} onIniciar={handleIniciar} onLogout={handleLogout}
                onBanco={(c) => { setClaseExtra(c || "B"); setPantallaExtra("banco"); }}
                onLibro={() => setPantallaExtra("libro")}
                onLegal={handleLegal}
                initialClase={claseDelStore}
                onClaseChange={handleClaseChange}
                refreshKey={dashboardRefreshKey} />
            </m.div>
          )}
          {!user && pantalla === "inicio" && !pantallaExtra && (
            <InicioCompleto key="inicio" onIniciar={handleIniciar} onLoginClick={handleLoginClick} onLegalClick={handleLegal} useGameStore={useGameStore} />
          )}
          {pantalla === "examen" && !pantallaExtra && (
            <m.div key="examen" className="flex w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {modo === "examen" ? <ModoExamen /> : modo === "inteligente" ? <ModoInteligente /> : <ModoEstudio />}
            </m.div>
          )}
{pantalla === "resultado" && !pantallaExtra && (
  modo === "inteligente"
    ? <ResultadoInteligente key="resultado-int"
        user={user}
        onReintentar={() => handleIniciarConClase("inteligente", useStore.getState().clase)}
        onVolver={() => useStore.getState().reiniciar()}
        onIniciarExamen={() => handleIniciar("examen", useStore.getState().clase)} />
    : <Resultado key="resultado" user={user} onAuthSuccess={handleAuthSuccess} />
)}
        </AnimatePresence>
      </div>
      {/* ── FREEMIUM OVERLAYS ── */}
      <AnimatePresence>
        {showNoLivesModal && (
          <NoLivesModal
            onClose={() => { setShowNoLivesModal(false); useStore.getState().reiniciar(); }}
            onContinue={() => setShowNoLivesModal(false)}
            onPremium={async () => {
              setShowNoLivesModal(false);
              const { getOfferings, purchasePro } = await import('./Usebilling');
              const offering = await getOfferings();
              const pkg = offering?.availablePackages[0];
              if (pkg) { const ok = await purchasePro(pkg); if (ok) useStore.getState().reiniciar(); }
}}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showInteligenteModal && (
          <InteligenteLockedModal
            onClose={() => setShowInteligenteModal(false)}
            onPremium={async () => {
              setShowInteligenteModal(false);
              const { getOfferings, purchasePro } = await import('./Usebilling');
              const offering = await getOfferings();
              const pkg = offering?.availablePackages[0];
              if (pkg) await purchasePro(pkg);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {mostrarDashboard && showCarruselModos && (
          <CarruselModos onFinalizar={cerrarCarruselModos} />
        )}
      </AnimatePresence>
      {import.meta.env.DEV && <DevPanel />}
    </m.div>
  );
}