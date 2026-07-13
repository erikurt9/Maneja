-- ============================================================
-- ManejaCL — Bloqueo del campo de autoridad `is_premium`
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- ============================================================
--
-- POR QUÉ ESTE CAMBIO ES NECESARIO:
-- La política actual de RLS en `profiles` es "for all using (auth.uid() = id)".
-- Eso permite que un usuario autenticado actualice CUALQUIER columna de su
-- propia fila, incluyendo `is_premium`. Como el cliente (la app en el
-- navegador o el teléfono) corre con la anon key + el JWT del propio
-- usuario, cualquier persona puede abrir las herramientas de desarrollador
-- y ejecutar algo como:
--
--   supabase.from('profiles').update({ is_premium: true }).eq('id', miPropioId)
--
-- ...y darse premium gratis, sin pagar, sin pasar por RevenueCat.
-- Esto no depende de cómo esté escrito App.jsx: aunque el código de la app
-- nunca mande ese campo, el ataque funciona igual llamando a Supabase
-- directamente. El bloqueo tiene que vivir en la base de datos.
--
-- 1. Revocar el privilegio de UPDATE columna-por-columna sobre is_premium
--    para los roles que usa la app (authenticated = usuarios logueados,
--    anon = no logueados). Esto no afecta lecturas (select) ni al resto
--    de columnas, que el usuario sigue pudiendo actualizar normalmente.
revoke update (is_premium) on profiles from authenticated;
revoke update (is_premium) on profiles from anon;

-- 2. `is_premium` solo puede cambiarlo el service_role (la clave secreta que
--    NUNCA debe ir al navegador), típicamente desde una Supabase Edge
--    Function que reciba el webhook de RevenueCat y confirme la compra.
grant update (is_premium) on profiles to service_role;

-- 3. Verificación rápida (ejecuta esto después y confirma que falla):
--    Con la anon key + tu propia sesión, intenta:
--      supabase.from('profiles').update({ is_premium: true }).eq('id', TU_ID)
--    Debe devolver un error de permisos, no un upsert exitoso.
