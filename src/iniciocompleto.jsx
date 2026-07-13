import { useEffect, useRef, useState, useCallback } from "react";
import { m, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import "./iniciocompleto.css";

// Objeto estable para el valor por defecto de `options`: si se recreara un
// literal `{}` en cada render, agregarlo a las deps del efecto causaría que
// el observer se recree en cada render (identidad nueva cada vez).
const EMPTY_VIEW_OPTIONS = {};

// ─── HOOK: INTERSECTION OBSERVER ─────────────────────────────────────────────
function useInView(options = EMPTY_VIEW_OPTIONS) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);
  return [ref, inView];
}

// ─── FONDO AUTOPISTA ─────────────────────────────────────────────────────────
// frozenProgress: 0 = animación normal, 1 = completamente congelada
function HighwayBackground({ mouseX, mouseY, frozenProgress = 0 }) {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const frozenRef = useRef(0);

  useEffect(() => { frozenRef.current = frozenProgress; }, [frozenProgress]);

  useEffect(() => {
    const unsub1 = mouseX.on("change", v => { mouse.current.x = (v + 1) / 2; });
    const unsub2 = mouseY.on("change", v => { mouse.current.y = (v + 1) / 2; });
    return () => { unsub1(); unsub2(); };
  }, [mouseX, mouseY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId, W, H;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const makeStreak = (progress = null) => {
      const side = Math.random() < 0.5 ? "left" : "right";
      const angle = side === "left" ? Math.PI + Math.random() * 0.6 : -Math.random() * 0.6;
      const isYellow = Math.random() < 0.6;
      return {
        angle,
        baseSpeed: 0.003 + Math.random() * 0.009,
        length: 0.05 + Math.random() * 0.2,
        color: isYellow ? `rgba(255,${200 + Math.floor(Math.random() * 55)},60,` : `rgba(200,220,255,`,
        opacity: 0.3 + Math.random() * 0.55,
        progress: progress !== null ? progress : Math.random(),
      };
    };

    const streaks = Array.from({ length: 45 }, () => makeStreak());
    const bokeh = Array.from({ length: 28 }, () => ({
      x: Math.random(), y: 0.05 + Math.random() * 0.55,
      r: 1 + Math.random() * 3.5,
      opacity: 0.04 + Math.random() * 0.15,
      baseSpeed: 0.0001 + Math.random() * 0.00025,
      color: Math.random() < 0.5 ? "255,210,80" : "160,200,255",
    }));

    const draw = () => {
      const speedMult = 1 - frozenRef.current;

      ctx.clearRect(0, 0, W, H);
      const ox = (mouse.current.x - 0.5) * 60;
      const oy = (mouse.current.y - 0.5) * 30;
      const vx = W * 0.5 + ox * 0.4;
      const vy = H * 0.36 + oy * 0.3;

      const bg = ctx.createRadialGradient(vx, vy, 0, vx, vy, H);
      bg.addColorStop(0, "#0e1d35"); bg.addColorStop(0.35, "#060e1c"); bg.addColorStop(1, "#020407");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      const glow = ctx.createRadialGradient(vx, vy, 0, vx, vy, H * 0.5);
      glow.addColorStop(0, "rgba(30,70,160,0.25)"); glow.addColorStop(0.4, "rgba(10,40,100,0.10)"); glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

      bokeh.forEach(b => {
        b.x -= b.baseSpeed * speedMult;
        if (b.x < -0.05) b.x = 1.05;
        const bx = b.x * W + ox * 0.15, by = b.y * H + oy * 0.1;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, b.r * 5);
        g.addColorStop(0, `rgba(${b.color},${b.opacity})`); g.addColorStop(1, `rgba(${b.color},0)`);
        ctx.beginPath(); ctx.arc(bx, by, b.r * 5, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      });

      streaks.forEach(s => {
        s.progress += s.baseSpeed * speedMult;
        if (s.progress > 1) Object.assign(s, makeStreak(0));
        const maxDist = Math.sqrt(W * W + H * H);
        const t0 = s.progress, t1 = Math.min(1, s.progress + s.length);
        const x0 = vx + Math.cos(s.angle) * t0 * maxDist, y0 = vy + Math.sin(s.angle) * t0 * maxDist;
        const x1 = vx + Math.cos(s.angle) * t1 * maxDist, y1 = vy + Math.sin(s.angle) * t1 * maxDist;
        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        const opacityMult = 0.3 + speedMult * 0.7;
        grad.addColorStop(0, s.color + "0)");
        grad.addColorStop(0.3, s.color + (s.opacity * opacityMult) + ")");
        grad.addColorStop(1, s.color + "0)");
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.strokeStyle = grad; ctx.lineWidth = 0.6 + t1 * 2.8; ctx.lineCap = "round"; ctx.stroke();
      });

      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H);
      vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(0,0,0,0.78)");
      ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />;
}

// ─── ICONOS SVG ───────────────────────────────────────────────────────────────
const IconExamen = ({ color = "#10b981" }) => (
  <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
    <rect x="5" y="2" width="17" height="23" rx="2.5" stroke={color} strokeWidth="1.8" fill="none" opacity="0.9"/>
    <line x1="9" y1="9" x2="18" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="13" x2="18" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="17" x2="14" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="21" cy="22" r="5.5" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.4"/>
    <polyline points="18.5,22 20.2,23.8 23.5,20.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);
const IconEstudio = ({ color = "#f59e0b" }) => (
  <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
    <circle cx="15" cy="11.5" r="6.5" stroke={color} strokeWidth="1.8" fill="none" opacity="0.9"/>
    <line x1="15" y1="18" x2="15" y2="22" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="11.5" y1="25.5" x2="18.5" y2="25.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="15" y1="6" x2="15" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="10" y1="7.8" x2="8.5" y2="6.3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="20" y1="7.8" x2="21.5" y2="6.3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconInteligente = ({ color = "#ec4899" }) => (
  <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
    <path d="M15 4C10 4 6 8 6 12.8C6 16.5 8.2 19.2 11.5 20.8V24C11.5 24.6 12 25 12.5 25H17.5C18 25 18.5 24.6 18.5 24V20.8C21.8 19.2 24 16.5 24 12.8C24 8 20 4 15 4Z" stroke={color} strokeWidth="1.8" fill="none" opacity="0.9"/>
    <line x1="12" y1="28" x2="18" y2="28" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="15" y1="10" x2="15" y2="16.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="11.5" y1="13.5" x2="18.5" y2="13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconBanco = ({ color = "#94a3b8" }) => (
  <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
    <rect x="3" y="7" width="15" height="19" rx="2" stroke={color} strokeWidth="1.8" fill="none" opacity="0.9"/>
    <rect x="8" y="3" width="15" height="19" rx="2" stroke={color} strokeWidth="1.8" fill="none" opacity="0.55"/>
    <line x1="7" y1="12" x2="14" y2="12" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="7" y1="15.5" x2="14" y2="15.5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="7" y1="19" x2="11" y2="19" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

// ─── DASH CARD ────────────────────────────────────────────────────────────────
function DashCard({ icon, title, subtitle, accent, badge, badgeColor, onClick, locked, lockText, cta, ctaFull, delay = 0, primary = false, banner = false }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  // Layout horizontal (primary/banner) tiene menos alto -> el rotateX se nota poco.
  // Compensamos con un multiplicador de tilt mayor para que "respiren" igual que las verticales.
  const isHorizontal = primary || banner;
  const tiltMultiplier = isHorizontal ? 1.7 : 1;

  // Antes dependía de `tiltMultiplier`, una variable derivada de
  // primary/banner recalculada en cada render: en la práctica ya
  // capturaba los cambios correctamente, pero el análisis estático de
  // exhaustive-deps no puede seguir esa derivación y marcaba `primary` y
  // `banner` como dependencias "perdidas". Se recalcula el multiplicador
  // dentro del callback y se depende directo de los props primitivos,
  // así el arreglo de deps queda inequívoco.
  const handleMouseMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tiltMultiplier = (primary || banner) ? 1.7 : 1;
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: cy * -14 * tiltMultiplier, y: cx * 14 * tiltMultiplier });
  }, [primary, banner]);
  const handleMouseLeave = useCallback(() => { setTilt({ x: 0, y: 0 }); setHovered(false); }, []);
  const accentRgb = accent;

  return (
    <m.div
      ref={cardRef}
      initial={{ opacity: 0, y: 36, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={locked ? undefined : onClick}
      style={{ perspective: "900px", cursor: locked ? "not-allowed" : "pointer", height: "100%" }}
    >
      <m.div
        animate={{ rotateX: tilt.x, rotateY: tilt.y, scale: hovered && !locked ? 1.035 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`dashcard-inner ${primary ? "dashcard-inner--primary" : banner ? "dashcard-inner--banner" : "dashcard-inner--vertical"}`}
        style={{
          "--accent": accentRgb,
          background: locked
            ? "rgba(10,15,26,0.72)"
            : primary
              ? `linear-gradient(135deg, rgba(${accentRgb},0.16) 0%, rgba(6,10,22,0.92) 60%)`
              : banner
                ? `rgba(8,12,22,0.70)`
                : `linear-gradient(148deg, rgba(${accentRgb},0.11) 0%, rgba(6,10,22,0.90) 100%)`,
          border: primary
            ? `1px solid rgba(${accentRgb},${hovered ? 0.65 : 0.38})`
            : `1px solid rgba(${accentRgb},${hovered && !locked ? 0.5 : 0.22})`,
          boxShadow: primary && hovered
            ? `0 0 60px rgba(${accentRgb},0.22), 0 16px 48px rgba(0,0,10,0.55), inset 0 1px 0 rgba(255,255,255,0.10)`
            : hovered && !locked
              ? `0 0 40px rgba(${accentRgb},0.18), 0 12px 40px rgba(0,0,10,0.5), inset 0 1px 0 rgba(255,255,255,0.09)`
              : `0 4px 24px rgba(0,0,10,0.35), inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: `linear-gradient(90deg, transparent, rgba(${accentRgb},${locked ? 0.18 : 0.6}), transparent)` }} />
        {hovered && !locked && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: "absolute", top: "-50%", left: "-25%", width: "70%", height: "70%", background: `radial-gradient(ellipse, rgba(${accentRgb},0.13), transparent 70%)`, pointerEvents: "none" }} />
        )}
        {locked && <div style={{ position: "absolute", top: "13px", right: "13px", fontSize: "13px", opacity: 0.6 }}>Bloqueado</div>}

        {/* Ícono */}
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: primary ? "56px" : "48px", height: primary ? "56px" : "48px", borderRadius: "14px", background: `rgba(${accentRgb},${locked ? 0.04 : 0.10})`, border: `1px solid rgba(${accentRgb},${locked ? 0.10 : 0.22})`, marginBottom: isHorizontal ? 0 : "14px", filter: locked ? "grayscale(0.85) opacity(0.4)" : "none", flexShrink: 0 }}>
          {icon}
        </div>

        {/* Contenido de texto */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: isHorizontal ? "center" : undefined }}>
          {badge && (
            <div className="dashcard-badge" style={{ "--badge-color": badgeColor || accentRgb }}>
              {badge}
            </div>
          )}
          <p style={{ color: locked ? "rgba(120,140,170,0.45)" : "rgba(238,245,255,0.97)", fontWeight: 800, fontSize: primary ? "18px" : "16px", marginBottom: "5px", letterSpacing: "0.01em", lineHeight: 1.2 }}>
            {title}
          </p>
          <p style={{ color: locked ? "rgba(100,120,150,0.45)" : "rgba(160,180,215,0.72)", fontSize: banner ? "12px" : "12.5px", lineHeight: 1.6, marginBottom: isHorizontal ? "10px" : "18px", flexGrow: isHorizontal ? 0 : 1 }}>
            {subtitle}
          </p>
          <div>
            {locked ? (
              <span style={{ display: "inline-block", fontSize: "12px", fontWeight: 600, color: "rgba(80,100,130,0.55)", letterSpacing: "0.03em" }}>{lockText}</span>
            ) : ctaFull ? (
              <m.div
                animate={{ backgroundColor: hovered ? `rgba(${accentRgb},0.95)` : `rgba(${accentRgb},0.82)` }}
                className={`dashcard-cta-full${primary ? " dashcard-cta-full--primary" : ""}`}
                style={{ boxShadow: hovered ? `0 4px 20px rgba(${accentRgb},0.45)` : `0 2px 12px rgba(${accentRgb},0.25)` }}
              >
                {cta}
                <m.span animate={{ x: hovered ? 3 : 0 }} transition={{ type: "spring", stiffness: 400 }}>→</m.span>
              </m.div>
            ) : (
              <m.span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12.5px", fontWeight: 700, color: `rgba(${accentRgb},${accentRgb === "148,163,184" ? 1.0 : 0.92})`, letterSpacing: "0.04em" }}>
                {cta}
                <m.span animate={{ x: hovered ? 4 : 0 }} transition={{ type: "spring", stiffness: 400 }}>→</m.span>
              </m.span>
            )}
          </div>
        </div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.022, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 4px)" }} />
      </m.div>
    </m.div>
  );
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function ManejaLogo({ size = 148 }) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", width: size * 1.5, height: size * 1.5, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(28,80,200,0.18) 0%, rgba(14,50,140,0.08) 40%, transparent 70%)", filter: "blur(10px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: size * 1.05, height: size * 1.05, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(50,110,255,0.14) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: size * 0.95, height: size * 0.95, borderRadius: "50%", border: "1px solid rgba(80,140,255,0.10)", pointerEvents: "none" }} />
      <m.img src="/logo_new.png" alt="Maneja" width={size} height={size}
        style={{ objectFit: "contain", filter: "drop-shadow(0 0 22px rgba(60,120,255,0.52)) drop-shadow(0 4px 14px rgba(0,0,0,0.7)) brightness(1.08) contrast(1.05)", position: "relative", zIndex: 1 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// ─── STATS BADGE ──────────────────────────────────────────────────────────────
function StatsBadge() {
  return (
    <m.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5 }}
      className="stats-badge"
    >
      {[
        { val: "Clase B", label: "automóvil" },
        { val: "Clase C", label: "moto" },
        { val: "+160", label: "preguntas" },
      ].map((s, i) => (
        <div key={s.val ?? i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ textAlign: "center", display: "flex", alignItems: "center", gap: "5px" }}>
            <div>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(200,220,255,0.92)", letterSpacing: "0.02em" }}>{s.val}</span>
              <span style={{ fontSize: "12px", color: "rgba(120,145,190,0.62)", marginLeft: "4px" }}>{s.label}</span>
            </div>
          </div>
          {i < 2 && <div style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.10)", marginLeft: "16px" }} />}
        </div>
      ))}
    </m.div>
  );
}

// ─── SCROLL INDICATOR ─────────────────────────────────────────────────────────
function ScrollIndicator({ onClick }) {
  return (
    <m.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1, duration: 0.6 }}
      whileHover={{ scale: 1.1 }}
      className="scroll-indicator-btn"
    >
      <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(120,150,200,0.55)" }}>
        Preguntas frecuentes
      </span>
      <m.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}
      >
        <div style={{ width: "1px", height: "18px", background: "linear-gradient(to bottom, transparent, rgba(100,150,255,0.5))" }} />
        <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
          <path d="M1 1L6 6L11 1" stroke="rgba(100,150,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </m.div>
    </m.button>
  );
}

// ─── FAQ DATA ─────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "¿Maneja es completamente gratis?",
    a: "Sí. El Modo Examen, Modo Estudio y el Banco de Preguntas son 100% gratis y no requieren registro. El Modo Inteligente (adaptativo) está disponible una vez al día gratis, o ilimitado con cuenta Premium.",
  },
  {
    q: "¿Las preguntas son las mismas del examen real?",
    a: "Las preguntas están basadas en el Manual del Conductor Chileno oficial y cubren las mismas categorías que evalúa CONASET: señales de tránsito, normas de conducción, velocidades, prioridad de paso y más. No podemos garantizar que sean idénticas al examen del día, pero sí que son representativas.",
  },
  {
    q: "¿Cuántas preguntas tiene el banco?",
    a: "Más de 160 preguntas únicas, organizadas por categoría y dificultad. Cubren tanto Clase B (automóvil) como Clase C (motocicleta). En el examen real se usan 35 preguntas seleccionadas aleatoriamente.",
  },
  {
    q: "¿Qué diferencia hay entre Clase B y Clase C?",
    a: "Clase B es para vehículos particulares de hasta 9 pasajeros y 3.500 kg (autos, camionetas). Clase C es para motocicletas y motonetas. Cada clase tiene su propio banco de preguntas con énfasis en las normas específicas de cada tipo de vehículo.",
  },
  {
    q: "¿Cómo funciona el Modo Inteligente?",
    a: "El Modo Inteligente analiza tus respuestas anteriores y genera un examen personalizado con las preguntas donde más has fallado. Las preguntas que no dominas vuelven a aparecer hasta que las respondes correctamente — como un sistema de repetición espaciada.",
  },
  {
    q: "¿Necesito crear una cuenta para usar Maneja?",
    a: "No. Puedes practicar sin registrarte. Crear una cuenta (gratis) te permite guardar tu historial, ver tu progreso por categoría, mantener tu racha de días y acceder al Banco de Preguntas completo.",
  },
  {
    q: "¿Cuántas preguntas necesito responder bien para aprobar?",
    a: "El examen real de CONASET tiene 35 preguntas. Para aprobar necesitas al menos 33 puntos sobre 42 posibles (algunas preguntas valen 2 puntos). En Maneja puedes ver tu puntaje exacto al terminar cada examen.",
  },
  {
    q: "¿Funciona en el celular?",
    a: "Sí, Maneja está optimizado para móvil. También puedes instalarlo como app desde el navegador (PWA) para acceder sin conexión o desde la pantalla de inicio de tu teléfono.",
  },
];

// ─── FAQ ITEM (Acordeón) ──────────────────────────────────────────────────────
function FaqItem({ item, index, isOpen, onToggle }) {
  const [ref, inView] = useInView();

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      style={{ borderRadius: "14px", overflow: "hidden", border: `1px solid ${isOpen ? "rgba(80,130,255,0.35)" : "rgba(255,255,255,0.07)"}`, transition: "border-color 0.3s", background: isOpen ? "rgba(30,60,140,0.08)" : "rgba(255,255,255,0.025)" }}
    >
      <button type="button"
        onClick={onToggle}
        className="faq-item-btn"
      >
        <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(80,120,200,0.55)", letterSpacing: "0.08em", flexShrink: 0, minWidth: "22px" }}>
          {String(index + 1).padStart(2, "0")}
        </span>

        <span style={{ fontSize: "14px", fontWeight: 700, color: isOpen ? "rgba(210,230,255,0.97)" : "rgba(185,205,240,0.82)", flex: 1, lineHeight: 1.4, transition: "color 0.2s" }}>
          {item.q}
        </span>

        <m.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ flexShrink: 0, color: isOpen ? "rgba(100,160,255,0.9)" : "rgba(100,120,160,0.5)" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </m.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <m.div
            key="answer"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 20px 20px 56px" }}>
              <div style={{ height: "1px", background: "linear-gradient(90deg, rgba(60,100,220,0.3), transparent)", marginBottom: "14px" }} />
              <p style={{ fontSize: "13.5px", color: "rgba(150,175,220,0.78)", lineHeight: 1.75, margin: 0 }}>
                {item.a}
              </p>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

// ─── SECCIÓN FAQ ──────────────────────────────────────────────────────────────
function FaqSection({ faqRef }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [titleRef, titleInView] = useInView();

  const toggle = (i) => setOpenIndex(prev => prev === i ? null : i);

  return (
    <section
      ref={faqRef}
      style={{
        minHeight: "100vh",
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "100px 24px 80px",
      }}
    >
      <div className="faq-top-fade" />
      <div className="faq-radial-glow" />

      <div style={{ width: "100%", maxWidth: "720px", position: "relative", zIndex: 1 }}>

        <m.div
          ref={titleRef}
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          animate={titleInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", marginBottom: "52px" }}
        >
          <div className="faq-eyebrow">
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(100,160,255,0.8)", boxShadow: "0 0 8px rgba(100,160,255,0.6)" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(140,180,255,0.85)" }}>
              Preguntas frecuentes
            </span>
          </div>

          <h2 className="faq-title">
            TODO LO QUE NECESITAS SABER
          </h2>

          <p style={{ fontSize: "14px", color: "rgba(140,165,210,0.70)", margin: 0, lineHeight: 1.6 }}>
            Respuestas directas sobre cómo funciona Maneja y el examen teórico chileno.
          </p>
        </m.div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={item.q}
              item={item}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ marginTop: "52px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}
        >
          <div style={{ height: "1px", width: "100%", maxWidth: "320px", background: "linear-gradient(90deg, transparent, rgba(60,100,220,0.3), transparent)" }} />
          <p style={{ fontSize: "13px", color: "rgba(120,150,200,0.60)", margin: 0 }}>
            ¿Listo para practicar? Es gratis y sin registro.
          </p>
        </m.div>

      </div>
    </section>
  );
}

// ─── PANTALLA INICIO COMPLETA ─────────────────────────────────────────────────
export function InicioCompleto({ onIniciar, onLoginClick, onLegalClick, useGameStore }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sceneX = useTransform(mouseX, [-1, 1], [-12, 12]);
  const sceneY = useTransform(mouseY, [-1, 1], [-6, 6]);

  const scrollRef = useRef(null);
  const faqRef = useRef(null);

  // ─── PARALLAX UNIFICADO: mouse (desktop) + giroscopio (mobile) ──────────────
  useEffect(() => {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (!isMobile) {
      // Desktop: seguir el mouse
      const onMouse = (e) => {
        mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
        mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
      };
      window.addEventListener("mousemove", onMouse);
      return () => window.removeEventListener("mousemove", onMouse);
    } else {
      // Mobile: giroscopio
      // gamma = inclinación izq/der (-90° a 90°)
      // beta  = inclinación fwd/back (-180° a 180°), se centra en 45° (ángulo natural de uso)
      const onOrientation = (e) => {
        mouseX.set(clamp(e.gamma / 30, -1, 1));
        mouseY.set(clamp((e.beta - 45) / 30, -1, 1));
      };

      const activar = async () => {
        // iOS 13+ requiere permiso explícito via gesto del usuario
        if (typeof DeviceOrientationEvent.requestPermission === "function") {
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm !== "granted") return;
        }
        window.addEventListener("deviceorientation", onOrientation);
      };

      // Se activa en el primer touch (satisface el requisito de gesto de usuario en iOS)
      window.addEventListener("touchstart", activar, { once: true, passive: true });

      return () => {
        // Antes solo se removía "deviceorientation": si el componente se
        // desmonta ANTES de que el usuario haga el primer touch (p. ej.
        // navega rápido a otra pantalla), el listener de "touchstart"
        // seguía vivo en `window` apuntando a un closure de un componente
        // ya desmontado — una fuga real, aunque `{ once: true }` lo
        // hubiera limpiado solo eventualmente si el touch llegaba a
        // ocurrir.
        window.removeEventListener("touchstart", activar);
        window.removeEventListener("deviceorientation", onOrientation);
      };
    }
  }, [mouseX, mouseY]);
  // ────────────────────────────────────────────────────────────────────────────

  // NOTA: useGameStore siempre viene como prop desde App.jsx (nunca es
  // undefined en este árbol), así que se llama sin condicional — llamarlo
  // detrás de un ternario violaba las Rules of Hooks (orden de hooks
  // inconsistente entre renders si la prop cambiara).
  const canUseInteligente = useGameStore(s => s.canUseInteligente?.() ?? true);
  const isPremium = useGameStore(s => s.isPremium ?? false);
  const locked = !canUseInteligente && !isPremium;

  const [navHover, setNavHover] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  // 0 = autopista viva, 1 = congelada/disuelta (se actualiza con el scroll)
  const [frozenProgress, setFrozenProgress] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const sy = el.scrollTop;
      setScrollY(sy);
      // Empieza a congelar cuando el scroll supera el 70% del viewport
      // y está completamente congelado al llegar al FAQ (100vh)
      const vh = window.innerHeight;
      const start = vh * 0.7;
      const end = vh * 1.05;
      const p = Math.min(1, Math.max(0, (sy - start) / (end - start)));
      setFrozenProgress(p);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToFaq = useCallback(() => {
    faqRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    // onMouseMove removido — ahora se maneja en el useEffect de arriba
    <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
      <HighwayBackground mouseX={mouseX} mouseY={mouseY} frozenProgress={frozenProgress} />

      {/* ── Overlay de dissolve: aparece al scrollear hacia el FAQ ── */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 40%, rgba(8,18,50,0.85) 0%, rgba(2,4,12,0.97) 100%)",
          opacity: frozenProgress,
          transition: "opacity 0.1s linear",
        }}
      />

      <div
        ref={scrollRef}
        style={{ position: "relative", zIndex: 2, width: "100%", height: "100%", overflowY: "auto", overflowX: "hidden", scrollBehavior: "smooth" }}
      >
        <nav className={`hero-nav${scrollY > 40 ? " hero-nav--scrolled" : ""}`}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src="/logo_new.png" alt="Maneja" style={{ width: "32px", height: "32px", objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(60,120,255,0.4))" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button type="button" onClick={scrollToFaq} className="hero-faq-link">
              FAQ
            </button>
            <button type="button"
              onClick={onLoginClick}
              onMouseEnter={() => setNavHover(true)}
              onMouseLeave={() => setNavHover(false)}
              style={{ background: navHover ? "rgba(60,120,255,0.15)" : "none", border: `1px solid ${navHover ? "rgba(100,160,255,0.55)" : "rgba(255,255,255,0.15)"}`, cursor: "pointer", color: navHover ? "rgba(180,210,255,0.95)" : "rgba(255,255,255,0.75)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", padding: "6px 16px", borderRadius: "12px", transition: "background 0.2s ease, border-color 0.2s ease, color 0.2s ease" }}
            >
              Iniciar sesión
            </button>
          </div>
        </nav>

        <m.div style={{ x: sceneX, y: sceneY }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "32px 24px 32px", gap: 0 }}>

            <m.div
              initial={{ opacity: 0, scale: 0.87, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}
            >
              <ManejaLogo size={96} />
              <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ textAlign: "center", marginTop: "8px" }}>
                <h1 className="hero-title">
                  MANEJA
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", margin: "10px 0 0" }}>
                  <div style={{ height: "1px", width: "48px", background: "linear-gradient(90deg, transparent, rgba(100,160,255,0.6))" }} />
                  <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.22em", color: "rgba(190,215,255,0.88)", textTransform: "uppercase", margin: 0, textShadow: "0 0 20px rgba(100,160,255,0.35)" }}>
                    Aprueba el examen más rápido
                  </p>
                  <div style={{ height: "1px", width: "48px", background: "linear-gradient(90deg, rgba(100,160,255,0.6), transparent)" }} />
                </div>
                <StatsBadge />
              </m.div>
            </m.div>

            <div style={{ width: "100%", maxWidth: "920px" }}>
              {/* ── Card primaria: Modo Examen (full-width) ── */}
              <div style={{ marginBottom: "10px" }}>
                <DashCard icon={<IconExamen color="#10b981" />} title="Modo Examen" subtitle="Simula el examen real de CONASET con 35 preguntas y tiempo límite." accent="16,185,129" badge="Empieza aquí" badgeColor="16,185,129" cta="Iniciar" ctaFull={true} onClick={() => onIniciar("examen")} delay={0.38} primary={true} />
              </div>

              {/* ── Grid 2 columnas: Estudio + Inteligente ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px", marginBottom: "10px" }}>
                <DashCard icon={<IconEstudio color="#f59e0b" />} title="Modo Estudio" subtitle="Aprende con explicaciones detalladas después de cada respuesta." accent="245,158,11" cta="Estudiar" onClick={() => onIniciar("estudio")} delay={0.46} />
                <DashCard icon={<IconInteligente color="#ec4899" />} title="Modo Inteligente" subtitle="Repasa solo tus preguntas débiles con análisis adaptativo." accent="236,72,153" cta="Repasar" onClick={() => locked ? null : onIniciar("inteligente")} locked={locked} lockText="Sesión usada · Vuelve mañana" delay={0.54} />
              </div>

              {/* ── Banner: Banco de Preguntas (full-width, tono secundario) ── */}
              <DashCard icon={<IconBanco color="#94a3b8" />} title="Banco de Preguntas" subtitle="Revisa todas las preguntas con respuestas y explicaciones." accent="148,163,184" cta="Regístrate gratis" onClick={onLoginClick} delay={0.62} banner={true} />
            </div>

            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} style={{ marginTop: "18px", textAlign: "center" }}>
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "4px" }}>
                {["Privacidad", "Términos", "Contacto"].map((item) => (
                  <button type="button" key={item} onClick={() => onLegalClick?.(item.toLowerCase())} className="legal-link">
                    {item}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: "12px", color: "rgba(50,70,100,0.45)", marginBottom: 0 }}>
                Maneja no está afiliada ni representada por CONASET, SEMUC ni ningún organismo gubernamental.
              </p>
            </m.div>

            <ScrollIndicator onClick={scrollToFaq} />

          </div>
        </m.div>

        <FaqSection faqRef={faqRef} />

      </div>
    </div>
  );
}