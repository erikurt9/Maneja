import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, getAuthenticatedUserId } from "./supabase";

// ─── VIDAS ───────────────────────────────────────────────────────────────────
// Horas que toma regenerar 1 vida. Única fuente de verdad: usar esta constante
// en cualquier lugar de la UI que muestre el tiempo de regeneración.
export const LIFE_REGEN_HOURS = 2;
export const MAX_LIVES = 5;

// ─── DIVISIONES ──────────────────────────────────────────────────────────────
export const DIVISIONES = [
  { id: "bronce", label: "Bronce", emoji: "medal", minXP: 0,    maxXP: 500,  color: "#cd7f32" },
  { id: "plata",  label: "Plata",  emoji: "medal", minXP: 500,  maxXP: 1500, color: "#94a3b8" },
  { id: "oro",    label: "Oro",    emoji: "medal", minXP: 1500, maxXP: 9999, color: "#f59e0b" },
];

export function getDivision(xp) {
  return DIVISIONES.findLast(d => xp >= d.minXP) ?? DIVISIONES[0];
}

export function getXPProgress(xp) {
  const div = getDivision(xp);
  const next = DIVISIONES[DIVISIONES.indexOf(div) + 1];
  if (!next) return { division: div, pct: 100, xpInLevel: xp - div.minXP, xpNeeded: 0 };
  const xpInLevel = xp - div.minXP;
  const xpNeeded = next.minXP - div.minXP;
  return { division: div, next, pct: Math.round((xpInLevel / xpNeeded) * 100), xpInLevel, xpNeeded };
}

// ─── STORE ───────────────────────────────────────────────────────────────────
export const useGameStore = create(
  persist(
    (set, get) => ({
      // En modo review (VITE_FORCE_PREMIUM=true) arranca siempre como premium
      isPremium: import.meta.env.VITE_FORCE_PREMIUM === "true",
      lives: MAX_LIVES,
      lastLifeLoss: null,
      streak: 0,
      xp: 0,

      // Inteligente: controla 1 sesión gratuita por día
      lastInteligenteDate: null, // "YYYY-MM-DD"
      intelligenteUsedToday: false,

      // ── Setters directos (útiles para pruebas / sync con Supabase) ──────────
      setIsPremium: (v) => set({ isPremium: v }),
      setLives: (v) => set({ lives: Math.max(0, Math.min(MAX_LIVES, v)) }),
      setStreak: (v) => set({ streak: v }),
      setXP: (v) => set({ xp: v }),

      // ── Toggle para localhost ────────────────────────────────────────────────
      togglePremium: () => set((s) => ({ isPremium: !s.isPremium })),

      // ── Perder 1 vida (en modo estudio) ─────────────────────────────────────
      loseLife: () => {
        const { lives, isPremium } = get();
        if (isPremium) return { dead: false };
        const next = Math.max(0, lives - 1);
        set({ lives: next, lastLifeLoss: new Date().toISOString() });
        return { dead: next === 0 };
      },

      // ── Restaurar vidas cada LIFE_REGEN_HOURS horas ──────────────────────────
      checkLifeRegen: () => {
        const { lastLifeLoss, lives } = get();
        if (!lastLifeLoss || lives >= MAX_LIVES) return;
        const lost = new Date(lastLifeLoss);
        const now = new Date();
        const horasTranscurridas = (now - lost) / (1000 * 60 * 60);
        const vidasRegeneradas = Math.floor(horasTranscurridas / LIFE_REGEN_HOURS);
        if (vidasRegeneradas > 0) {
          const nuevas = Math.min(MAX_LIVES, lives + vidasRegeneradas);
          set({ lives: nuevas });
          // Si ya llegamos al máximo, no queda nada pendiente por regenerar.
          // Si no, "reanclamos" lastLifeLoss al punto exacto donde debería
          // empezar a contar la próxima vida, para no perder el resto fraccionario.
          if (nuevas < MAX_LIVES) {
            const msPorVida = LIFE_REGEN_HOURS * 60 * 60 * 1000;
            const nuevoAncla = new Date(lost.getTime() + vidasRegeneradas * msPorVida);
            set({ lastLifeLoss: nuevoAncla.toISOString() });
          }
        }
      },

      // ── Timestamp (ms) en el que se regenerará la próxima vida ──────────────
      // Devuelve null si ya está al máximo de vidas (no hay nada pendiente).
      getNextLifeRegenAt: () => {
        const { lastLifeLoss, lives } = get();
        if (lives >= MAX_LIVES || !lastLifeLoss) return null;
        const msPorVida = LIFE_REGEN_HOURS * 60 * 60 * 1000;
        return new Date(lastLifeLoss).getTime() + msPorVida;
      },

      // ── Ganar XP ────────────────────────────────────────────────────────────
      gainXP: (points) => set((s) => ({ xp: s.xp + points })),

      // ── Registrar sesión inteligente ─────────────────────────────────────────
      useInteligenteSession: () => {
        const today = new Date().toISOString().split("T")[0];
        set({ lastInteligenteDate: today, intelligenteUsedToday: true });
      },

      canUseInteligente: () => {
        const { isPremium, lastInteligenteDate } = get();
        if (isPremium) return true;
        const today = new Date().toISOString().split("T")[0];
        return lastInteligenteDate !== today;
      },

      checkInteligenteReset: () => {
        const { lastInteligenteDate } = get();
        const today = new Date().toISOString().split("T")[0];
        if (lastInteligenteDate !== today) {
          set({ intelligenteUsedToday: false });
        }
      },

      // ── Sync con Supabase profile ────────────────────────────────────────────
      // NOTA: esto es una LECTURA (`select`), no una escritura. `is_premium`
      // solo se lee aquí para reflejar el estado local; nunca se escribe desde
      // el cliente (ver syncToProfile más abajo).
      // NOTA DE SEGURIDAD: ya no filtra por el id del perfil — no hace falta:
      // la política de acceso de `profiles` ya restringe el select a la
      // propia fila de quien está logueado, así que un select sin filtro
      // devuelve como máximo una fila (la del usuario actual).
      syncFromProfile: async () => {
        try {
          await getAuthenticatedUserId();
          const { data } = await supabase
            .from("profiles")
            .select("is_premium, lives, last_life_loss, streak, xp_points")
            .maybeSingle();
          if (data) {
            set({
              // En modo review ignorar el valor de Supabase y forzar premium
              isPremium: import.meta.env.VITE_FORCE_PREMIUM === "true" ? true : (data.is_premium ?? false),
              lives: data.lives ?? MAX_LIVES,
              lastLifeLoss: data.last_life_loss ?? null,
              streak: data.streak ?? 0,
              xp: data.xp_points ?? 0,
            });
          }
        } catch (e) {
          console.warn("No se pudo sincronizar profile:", e.message);
        }
      },

      syncToProfile: async () => {
        // NOTA DE SEGURIDAD: is_premium NUNCA se escribe desde el cliente.
        // Es un campo de autorización (controla el paywall) y el cliente
        // corre en el navegador/dispositivo del propio usuario, así que
        // cualquiera podría abrir devtools y forzarlo a `true` para obtener
        // premium gratis. La fuente de verdad de is_premium debe ser
        // exclusivamente el webhook de RevenueCat -> función server-side
        // (service_role). Ver secure_profiles_authority.sql para el
        // bloqueo a nivel de base de datos (REVOKE UPDATE (is_premium)).
        //
        // NOTA DE SEGURIDAD 2: antes esto era un `upsert` que mandaba
        // `id: userId` en el body — es decir, el cliente "escribía" el
        // campo de autoría (el dueño de la fila), aunque el valor fuera
        // correcto. El perfil siempre existe de antemano (lo crea un
        // trigger en el registro, ver freemium_migration.sql), así que acá
        // basta un `update` filtrado por `.eq("id", userId)`: `id` se usa
        // solo para decir QUÉ fila tocar, nunca se manda como valor a
        // escribir, y la política RLS (`auth.uid() = id`) igual lo
        // verifica del lado del servidor.
        const { lives, lastLifeLoss, streak, xp } = get();
        try {
          const userId = await getAuthenticatedUserId();
          await supabase.from("profiles")
            .update({ lives, last_life_loss: lastLifeLoss, streak, xp_points: xp })
            .eq("id", userId);
        } catch (e) {
          console.warn("No se pudo guardar profile:", e.message);
        }
      },
    }),
    {
      name: "maneja-game-store",
      partialize: (s) => ({
        // En modo review no persistir isPremium para que el env siempre mande
        ...(import.meta.env.VITE_FORCE_PREMIUM !== "true" && { isPremium: s.isPremium }),
        lives: s.lives,
        lastLifeLoss: s.lastLifeLoss,
        streak: s.streak,
        xp: s.xp,
        lastInteligenteDate: s.lastInteligenteDate,
        intelligenteUsedToday: s.intelligenteUsedToday,
      }),
    }
  )
);