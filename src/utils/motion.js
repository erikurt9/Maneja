// Animación estándar de "fade + subir" usada en varias tarjetas del dashboard.
// Vive acá (en vez de duplicada en cada archivo) para que Dashboard.jsx y los
// componentes extraídos de HeroProgreso compartan exactamente la misma curva.
export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});
