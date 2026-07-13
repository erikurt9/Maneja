-- ============================================================
-- ManejaCL — Cierre del hueco de RLS en campos de autoría (user_id / id)
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- ============================================================
--
-- POR QUÉ ESTE CAMBIO ES NECESARIO:
-- Las políticas actuales en `examenes`, `respuestas_detalle`, `rachas` y
-- `profiles` son "for all using (auth.uid() = user_id)" (o "= id" en
-- profiles), SIN "with check". En PostgreSQL/Supabase, la cláusula
-- `USING` solo se evalúa para SELECT/UPDATE/DELETE sobre filas que YA
-- existen. Para INSERT, la única cláusula que se evalúa es `WITH CHECK`.
-- Como estas 4 políticas no la tienen, un INSERT con Row Level Security
-- activo NO estaba siendo validado — solo pasaba "por casualidad" porque
-- el código del cliente mandaba el user_id correcto, no porque la base de
-- datos lo estuviera obligando. Alguien con la anon key (pública, va en
-- el bundle de la app) podía, en teoría, insertar un examen con el
-- user_id de otra persona sin que RLS lo bloqueara.
--
-- Este script agrega dos capas de defensa:
--   1) `default auth.uid()` en la columna: aunque el cliente no mande el
--      campo, la fila igual queda con el dueño correcto.
--   2) `with check (auth.uid() = user_id)`: aunque alguien intente forzar
--      un valor distinto (saltándose el default), la base de datos
--      rechaza el insert/update.
-- Con esto, el código del cliente ya NO necesita (ni debe) escribir estos
-- campos — ver los cambios en db.js, adaptativo.js, FreemiumUI.jsx y
-- useGameStore.js.

-- 1. examenes
alter table examenes alter column user_id set default auth.uid();
drop policy if exists "usuarios ven sus examenes" on examenes;
create policy "usuarios ven sus examenes" on examenes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. respuestas_detalle
alter table respuestas_detalle alter column user_id set default auth.uid();
drop policy if exists "usuarios ven sus respuestas" on respuestas_detalle;
create policy "usuarios ven sus respuestas" on respuestas_detalle
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. rachas
alter table rachas alter column user_id set default auth.uid();
drop policy if exists "usuarios ven su racha" on rachas;
create policy "usuarios ven su racha" on rachas
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. profiles
-- (id también sirve de default por si en algún momento vuelve a hacer
-- falta un insert directo desde el cliente; hoy syncToProfile ya usa
-- `update` en vez de `upsert`, así que id nunca viaja en el body)
alter table profiles alter column id set default auth.uid();
drop policy if exists "usuarios ven su perfil" on profiles;
create policy "usuarios ven su perfil" on profiles
  for all using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5. pregunta_stats
-- Ya tenía "with check" (ver secure_pregunta_stats_rls.sql), pero le
-- faltaba el default: ahora que adaptativo.js ya no manda user_id en el
-- upsert, la columna necesita rellenarlo sola.
alter table pregunta_stats alter column user_id set default auth.uid();

-- 6. Verificación rápida (ejecuta esto después, logueado como un usuario
--    de prueba, y confirma que TODAS fallan con error de RLS):
--      supabase.from('examenes').insert({ user_id: 'uuid-de-otra-persona', modo:'estudio', ... })
--      supabase.from('profiles').update({ ... }).eq('id', 'uuid-de-otra-persona')
--    Y confirma que esta SÍ funciona (sin mandar user_id/id):
--      supabase.from('examenes').insert({ modo:'estudio', clase:'B', ... })
