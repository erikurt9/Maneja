import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  IconX, IconMail, IconLock, IconEye, IconEyeOff, IconHistory,
  IconChartBar, IconDeviceMobile, IconShieldCheck, IconArrowLeft,
} from "@tabler/icons-react";

const BENEFICIOS = [
  { Icon: IconHistory, titulo: "Historial de exámenes", texto: "Revisa cada simulación y sesión de estudio que completes." },
  { Icon: IconChartBar, titulo: "Estadísticas por categoría", texto: "Descubre en qué temas necesitas practicar más." },
  { Icon: IconDeviceMobile, titulo: "Retoma donde quedaste", texto: "Continúa tu estudio desde cualquier dispositivo." },
];

const TEXTOS = {
  login:     { titulo: "Inicia sesión",       sub: "Inicia sesión para guardar tu progreso y estadísticas del examen teórico." },
  registro:  { titulo: "Crea tu cuenta",      sub: "Es gratis. Guarda tu progreso y tus estadísticas del examen teórico." },
  recuperar: { titulo: "Recupera tu acceso",  sub: "Te enviaremos un enlace a tu correo para crear una contraseña nueva." },
  nueva:     { titulo: "Nueva contraseña",    sub: "Elige una contraseña nueva para tu cuenta." },
};

function traducirError(err) {
  const msg = err?.message || "";
  if (msg.includes("already registered")) return "Ya existe una cuenta con ese correo.";
  if (msg.includes("Invalid login")) return "Correo o contraseña incorrectos.";
  if (msg.includes("Email not confirmed")) return "Confirma tu correo antes de ingresar. Revisa tu bandeja de entrada.";
  if (msg.includes("at least")) return "La contraseña debe tener al menos 6 caracteres.";
  if (msg.includes("same password") || msg.includes("different from the old")) return "La contraseña nueva debe ser distinta a la anterior.";
  if (msg.includes("rate limit") || msg.includes("too many")) return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  return msg || "Ocurrió un error. Inténtalo de nuevo.";
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const inputWrap = "flex items-center gap-3 rounded-xl px-3.5 border border-slate-700/60 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all";
const inputBase = "flex-1 min-w-0 bg-transparent py-3 text-white placeholder-slate-500 text-sm outline-none";

export function AuthModal({
  onSuccess, onGoogle, onRecuperar, onNuevaPassword, onClose, modoInicial = "registro",
}) {
  const [modo, setModo] = useState(modoInicial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const t = TEXTOS[modo];
  const ocupado = loading || loadingGoogle;
  const pideEmail = modo !== "nueva";
  const pidePassword = modo === "login" || modo === "registro" || modo === "nueva";

  const cambiarModo = (nuevo) => { setModo(nuevo); setError(""); setAviso(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setAviso(""); setLoading(true);
    try {
      if (modo === "recuperar") {
        await onRecuperar(email);
        setAviso("Listo. Si el correo está registrado, recibirás un enlace para crear una contraseña nueva.");
      } else if (modo === "nueva") {
        await onNuevaPassword(password);
      } else {
        await onSuccess(modo, email, password);
      }
    } catch (err) {
      setError(traducirError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(""); setAviso(""); setLoadingGoogle(true);
    try {
      await onGoogle();
    } catch (err) {
      setError(traducirError(err));
    } finally {
      // En web la página se redirige a Google; en Android se abre una pestaña
      // aparte y el modal se cierra solo cuando vuelve la sesión.
      setLoadingGoogle(false);
    }
  };

  const textoBoton = loading ? "Cargando..." :
    modo === "login" ? "Ingresar" :
    modo === "registro" ? "Crear cuenta" :
    modo === "recuperar" ? "Enviar enlace" : "Guardar contraseña";

  return (
    <m.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      role="dialog" aria-modal="true" aria-labelledby="auth-titulo"
    >
      <m.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-4xl max-h-[94vh] overflow-y-auto md:overflow-hidden rounded-3xl border border-slate-700/60 grid md:grid-cols-2"
        style={{ background: "#0b1322", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}
      >
        {/* ── Panel izquierdo (solo desktop) ─────────────────────────── */}
        <aside
          className="hidden md:flex flex-col p-9 border-r border-slate-700/40"
          style={{ background: "linear-gradient(160deg, #16305c 0%, #0f1f3d 55%, #0b1630 100%)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <img src="/logo_new.png" alt="" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-white font-bold text-lg">Maneja</span>
          </div>

          <h3 className="text-white text-2xl font-extrabold leading-snug mt-10">
            Tu preparación para el examen teórico, siempre contigo
          </h3>

          <ul className="flex flex-col gap-5 mt-8">
            {BENEFICIOS.map(({ Icon, titulo, texto }) => (
              <li key={titulo} className="flex items-start gap-3.5">
                <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-sky-300" stroke={1.8} />
                </span>
                <span>
                  <span className="block text-slate-100 text-sm font-semibold">{titulo}</span>
                  <span className="block text-slate-400 text-sm leading-relaxed">{texto}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-auto pt-8 flex items-center gap-2 text-xs text-slate-400">
            <IconShieldCheck size={15} stroke={1.8} />
            Solo tú puedes ver tu historial y tus estadísticas.
          </p>
        </aside>

        {/* ── Panel derecho (formulario) ─────────────────────────────── */}
        <section className="p-6 sm:p-9 flex flex-col justify-center">
          <button
            type="button" onClick={onClose} aria-label="Cerrar"
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors bg-transparent border-0 outline-none"
          >
            <IconX size={18} />
          </button>

          {/* Marca compacta: el panel izquierdo no se muestra en móvil */}
          <div className="flex md:hidden items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <img src="/logo_new.png" alt="" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-white font-bold">Maneja</span>
          </div>

          {(modo === "recuperar") && (
            <button type="button" onClick={() => cambiarModo("login")}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-3 bg-transparent border-0 p-0 cursor-pointer self-start transition-colors">
              <IconArrowLeft size={15} /> Volver
            </button>
          )}

          <h2 id="auth-titulo" className="text-2xl font-extrabold text-white">{t.titulo}</h2>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">{t.sub}</p>

          {(modo === "login" || modo === "registro") && (
            <>
              <button
                type="button" onClick={handleGoogle} disabled={ocupado}
                className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-semibold text-white border border-slate-700/60 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <GoogleLogo />
                {loadingGoogle ? "Conectando con Google..." : "Continuar con Google"}
              </button>

              <div className="flex items-center gap-3 my-5 text-[11px] tracking-widest text-slate-500">
                <span className="flex-1 h-px bg-slate-700/60" />
                O CON TU CORREO
                <span className="flex-1 h-px bg-slate-700/60" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className={`flex flex-col gap-6 ${modo === "login" || modo === "registro" ? "" : "mt-6"}`}>
            {pideEmail && (
              <div>
                <label htmlFor="auth-email" className="text-sm font-semibold text-slate-100 mb-2 block">Correo electrónico</label>
                <div className={inputWrap} style={{ background: "rgba(255,255,255,0.04)" }}>
                  <IconMail size={18} className="text-slate-400 flex-shrink-0" stroke={1.6} />
                  <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    required autoComplete="email" placeholder="tu@correo.com" className={inputBase} />
                </div>
              </div>
            )}

            {pidePassword && (
              <div>
                <label htmlFor="auth-password" className="text-sm font-semibold text-slate-100 mb-2 block">
                  {modo === "nueva" ? "Contraseña nueva" : "Contraseña"}
                </label>
                <div className={inputWrap} style={{ background: "rgba(255,255,255,0.04)" }}>
                  <IconLock size={18} className="text-slate-400 flex-shrink-0" stroke={1.6} />
                  <input id="auth-password" type={verPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} required minLength={6}
                    autoComplete={modo === "login" ? "current-password" : "new-password"}
                    placeholder={modo === "login" ? "Tu contraseña" : "Mínimo 6 caracteres"} className={inputBase} />
                  <button type="button" onClick={() => setVerPassword((v) => !v)}
                    aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="text-slate-400 hover:text-white bg-transparent border-0 p-1 cursor-pointer flex-shrink-0 transition-colors">
                    {verPassword ? <IconEyeOff size={18} stroke={1.6} /> : <IconEye size={18} stroke={1.6} />}
                  </button>
                </div>
              </div>
            )}

            {modo === "login" && (
              <button type="button" onClick={() => cambiarModo("recuperar")}
                className="self-end text-sm font-semibold text-slate-200 hover:text-white bg-transparent border-0 p-0 cursor-pointer transition-colors -mt-3">
                ¿Olvidaste tu contraseña?
              </button>
            )}

            <AnimatePresence>
              {error && (
                <m.p key="err" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                  {error}
                </m.p>
              )}
              {aviso && (
                <m.p key="ok" role="status" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-emerald-300 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
                  {aviso}
                </m.p>
              )}
            </AnimatePresence>

            <button type="submit" disabled={ocupado}
              className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
              style={{ boxShadow: "0 8px 24px rgba(59,130,246,0.25)" }}>
              {textoBoton}
            </button>
          </form>

          {(modo === "login" || modo === "registro") && (
            <p className="text-center text-slate-400 text-sm mt-5">
              {modo === "registro" ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
              <button type="button" onClick={() => cambiarModo(modo === "registro" ? "login" : "registro")}
                className="font-semibold text-slate-100 hover:text-white bg-transparent border-0 p-0 cursor-pointer transition-colors">
                {modo === "registro" ? "Inicia sesión" : "Regístrate"}
              </button>
            </p>
          )}
        </section>
      </m.div>
    </m.div>
  );
}