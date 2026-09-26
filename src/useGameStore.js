import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, getAuthenticatedUserId } from "./supabase";

// ─── STORE ───────────────────────────────────────────────────────────────────
export const useGameStore = create(
  persist(
    (set, get) => ({
      // isPremium sigue existiendo: controla el límite de 1 sesión diaria de
      // Modo Inteligente. Ya NO controla Modo Estudio (libre para todos) ni
      // ningún sistema de vidas/XP/divisiones (eliminados).
      // En modo review (VITE_FORCE_PREMIUM=true) arranca siempre como premium
      isPremium: import.meta.env.VITE_FORCE_PREMIUM === "true",
      streak: 0,

      // Inteligente: controla 1 sesión gratuita por día
      lastInteligenteDate: null, // "YYYY-MM-DD"
      intelligenteUsedToday: false,

      // ── Setters directos (útiles para pruebas / sync con Supabase) ──────────
      setIsPremium: (v) => set({ isPremium: v }),
      setStreak: (v) => set({ streak: v }),

      // ── Toggle para localhost ────────────────────────────────────────────────
      togglePremium: () => set((s) => ({ isPremium: !s.isPremium })),

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
            .select("is_premium, streak")
            .maybeSingle();
          if (data) {
            set({
              // En modo review ignorar el valor de Supabase y forzar premium
              isPremium: import.meta.env.VITE_FORCE_PREMIUM === "true" ? true : (data.is_premium ?? false),
              streak: data.streak ?? 0,
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
        const { streak } = get();
        try {
          const userId = await getAuthenticatedUserId();
          await supabase.from("profiles")
            .update({ streak })
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
        streak: s.streak,
        lastInteligenteDate: s.lastInteligenteDate,
        intelligenteUsedToday: s.intelligenteUsedToday,
      }),
    }
  )
);
