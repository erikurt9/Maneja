import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "./supabase";

// Deep link al que Google/Supabase devuelve al usuario en la app Android.
// Debe coincidir con: capacitor.config.json (appId), AndroidManifest.xml
// (intent-filter) y la lista de "Redirect URLs" en Supabase.
const REDIRECT_NATIVO = "cl.maneja.app://auth-callback";
// Los correos (recuperar contraseña) se abren en el navegador, no en la app.
const URL_WEB = "https://maneja-mu.vercel.app";

async function registrar(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

async function logout() {
  await supabase.auth.signOut();
}

// ── Google ───────────────────────────────────────────────────────────────────
// Web: redirige a Google y vuelve al mismo origen (Supabase detecta la sesión).
// Android: abre Google en una Custom Tab (Google bloquea login dentro de un
// WebView) y la sesión vuelve por el deep link REDIRECT_NATIVO.
async function loginConGoogle() {
  const nativo = Capacitor.isNativePlatform();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: nativo ? REDIRECT_NATIVO : window.location.origin,
      skipBrowserRedirect: nativo,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
  if (nativo && data?.url) await Browser.open({ url: data.url });
}

async function procesarUrlAuth(url) {
  if (!url || !url.startsWith(REDIRECT_NATIVO)) return;
  const u = new URL(url);
  const hash = new URLSearchParams(u.hash.replace(/^#/, ""));
  const get = (k) => u.searchParams.get(k) ?? hash.get(k);

  try { await Browser.close(); } catch { /* en Android no hay close(): se ignora */ }

  const err = get("error_description") || get("error");
  if (err) { console.error("Google auth:", err); return; }

  const code = get("code");
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    return;
  }
  const access_token = get("access_token");
  const refresh_token = get("refresh_token");
  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
  }
}

// ── Recuperar contraseña ─────────────────────────────────────────────────────
async function recuperarPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: Capacitor.isNativePlatform() ? URL_WEB : window.location.origin,
  });
  if (error) throw error;
}

async function actualizarPassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // true cuando el usuario llega desde el link del correo de recuperación
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, session) => {
      setUser(session?.user ?? null);
      if (evento === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Deep link de vuelta desde Google (solo Android)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapacitorApp.addListener("appUrlOpen", ({ url }) => {
      procesarUrlAuth(url).catch((e) => console.error("Deep link auth:", e));
    });
    return () => { listener.then((l) => l.remove()); };
  }, []);

  const cerrarRecovery = () => setRecovery(false);

  return {
    user, loading, recovery, cerrarRecovery,
    registrar, login, logout,
    loginConGoogle, recuperarPassword, actualizarPassword,
  };
}