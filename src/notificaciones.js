import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

// ─── NOTIFICACIONES LOCALES DE RE-ENGANCHE ─────────────────────────────────
// "No pierdas tu racha" — recordatorio diario a hora fija, 100% local (no
// requiere backend ni push server). Corre detrás de un check de plataforma
// nativa: en el navegador (dev con `npm run dev`) estas funciones son no-ops
// silenciosos en vez de tirar error, porque LocalNotifications requiere el
// bridge nativo de Capacitor.
const ID_RACHA = 9002;

function nativoDisponible() {
  return Capacitor.isNativePlatform();
}

// Pide permiso una sola vez — llamar apenas hay sesión iniciada. Si el
// usuario ya lo negó antes, Capacitor simplemente no vuelve a preguntar
// (comportamiento nativo de Android/iOS, no hay nada que hacer acá).
export async function inicializarNotificaciones() {
  if (!nativoDisponible()) return;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== "granted") await LocalNotifications.requestPermissions();
  } catch (e) {
    console.warn("No se pudo inicializar notificaciones:", e.message);
  }
}

// Recordatorio diario a las 20:00 hora local del dispositivo. Se agenda una
// sola vez con `schedule.on: { hour, minute }`, que Capacitor repite todos
// los días de forma nativa — no hace falta reprogramarlo cada día.
// LIMITACIÓN CONOCIDA: no valida si el usuario ya practicó hoy antes de
// disparar (eso requeriría un chequeo en segundo plano, no disponible con
// solo LocalNotifications). El usuario que ya cumplió su racha hoy puede
// recibir el aviso igual — molestia menor, aceptable para una v1.
export async function programarRecordatorioRacha() {
  if (!nativoDisponible()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: ID_RACHA }] });
    await LocalNotifications.schedule({
      notifications: [{
        id: ID_RACHA,
        title: "No pierdas tu racha",
        body: "Todavía puedes practicar hoy en Maneja.",
        schedule: { on: { hour: 20, minute: 0 }, allowWhileIdle: true },
      }],
    });
  } catch (e) {
    console.warn("No se pudo programar recordatorio de racha:", e.message);
  }
}

export async function cancelarRecordatorioRacha() {
  if (!nativoDisponible()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: ID_RACHA }] });
  } catch (e) {
    console.warn("No se pudo cancelar recordatorio de racha:", e.message);
  }
}