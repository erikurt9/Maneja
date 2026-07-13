-- ============================================================
-- ManejaCL — Bloqueo de autoridad en `pregunta_stats`
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- ============================================================
--
-- POR QUÉ ESTE CAMBIO ES NECESARIO:
-- A diferencia de `examenes`, `respuestas_detalle`, `rachas` y `profiles`
-- (que sí tienen su política de RLS en supabase_setup.sql /
-- freemium_migration.sql), la tabla `pregunta_stats` no tiene ninguna
-- política de Row Level Security registrada en el repositorio.
--
-- El código del cliente (src/adaptativo.js) hace select/upsert/update
-- directamente sobre `pregunta_stats` filtrando por `user_id`, confiando
-- en que ESE user_id venga del propio usuario. Si Row Level Security no
-- está habilitado en esta tabla, cualquier persona con la anon key (que
-- va en el bundle de la app, es pública por diseño) puede:
--
--   supabase.from('pregunta_stats').select('*')
--
-- ...y leer o modificar los datos de estudio de TODOS los usuarios, no
-- solo los propios, simplemente cambiando el `user_id` en la consulta.
-- Esto no es un dato tan sensible como una contraseña, pero sí es
-- información personal (qué preguntas te cuestan, tu progreso) que no
-- debería ser pública ni editable por terceros.
--
-- 1. Habilitar RLS en la tabla (si la tabla no existe todavía, créala
--    primero — ajusta esto si tu tabla real tiene columnas distintas).
create table if not exists pregunta_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  pregunta_id int not null,
  clase text,
  veces_vista int not null default 0,
  veces_correcta int not null default 0,
  intervalo_dias int not null default 0,
  factor_ease numeric not null default 2.5,
  proxima_vez timestamptz,
  ultima_vez timestamptz,
  unique (user_id, pregunta_id)
);

alter table pregunta_stats enable row level security;

drop policy if exists "usuarios ven sus stats" on pregunta_stats;
create policy "usuarios ven sus stats" on pregunta_stats
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Índice útil para los lookups por usuario/clase que hace adaptativo.js
create index if not exists pregunta_stats_user_clase_idx
  on pregunta_stats(user_id, clase);

-- 3. Verificación rápida (ejecuta esto después, logueado como un usuario
--    de prueba, y confirma que NO devuelve filas de otros user_id):
--      supabase.from('pregunta_stats').select('user_id').neq('user_id', TU_ID)
--    Debe devolver un array vacío, no las filas de otros usuarios.
