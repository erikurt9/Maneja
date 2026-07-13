import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── getAuthenticatedUserId ───────────────────────────────────────────────────
// Devuelve el id del usuario logueado tomándolo de la sesión de Supabase,
// NUNCA de un parámetro que venga de quien llama a la función. Úsalo en
// cualquier insert/update/upsert que escriba `user_id`: así ese campo nunca
// puede terminar siendo otro id que no sea el del propio usuario, sin
// depender únicamente de que la política RLS lo bloquee del lado servidor.
export async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("No hay sesión activa");
  return data.user.id;
}
