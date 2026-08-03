import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

// ─── MICRO-FEEDBACK HÁPTICO ─────────────────────────────────────────────────
// Tres sensaciones distintas para que la mano confirme lo que el ojo ya vio:
// un patrón "success" corto en respuesta correcta, uno "error" más marcado en
// incorrecta, y un impacto liviano en Modo Examen (que no revela si acertaste,
// así que solo confirma que el toque se registró). Igual que el resto de los
// módulos nativos del proyecto (notificaciones.js): no-op silencioso fuera
// de una plataforma nativa, para no romper `npm run dev` en el navegador.
function nativoDisponible() {
  return Capacitor.isNativePlatform();
}

export async function hapticCorrecto() {
  if (!nativoDisponible()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (e) {
    console.warn("Haptics no disponible:", e.message);
  }
}

export async function hapticIncorrecto() {
  if (!nativoDisponible()) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (e) {
    console.warn("Haptics no disponible:", e.message);
  }
}

export async function hapticTap() {
  if (!nativoDisponible()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (e) {
    console.warn("Haptics no disponible:", e.message);
  }
}