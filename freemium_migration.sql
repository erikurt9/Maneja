-- ============================================================
-- ManejaCL — Migración Freemium: tabla profiles
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- 1. Crear tabla profiles si no existe
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_premium boolean not null default false,
  lives integer not null default 5 check (lives >= 0 and lives <= 5),
  last_life_loss timestamptz,
  streak integer not null default 0,
  xp_points integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Si la tabla ya existe, añade las columnas faltantes
alter table profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists lives integer not null default 5,
  add column if not exists last_life_loss timestamptz,
  add column if not exists streak integer not null default 0,
  add column if not exists xp_points integer not null default 0,
  add column if not exists updated_at timestamptz default now();

-- 3. Constraint: vidas entre 0 y 5
alter table profiles
  drop constraint if exists lives_range;
alter table profiles
  add constraint lives_range check (lives >= 0 and lives <= 5);

-- 4. Row Level Security
alter table profiles enable row level security;

drop policy if exists "usuarios ven su perfil" on profiles;
create policy "usuarios ven su perfil" on profiles
  for all using (auth.uid() = id);

-- 5. Trigger: actualizar updated_at automáticamente
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- 6. Función: crear profile al registrarse
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, is_premium, lives, streak, xp_points)
  values (new.id, new.email, false, 5, 0, 0)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 7. Índice útil para lookup rápido
create index if not exists profiles_id_idx on profiles(id);

-- 8. Insertar perfiles faltantes para usuarios ya existentes
insert into profiles (id, email, is_premium, lives, streak, xp_points)
select id, email, false, 5, 0, 0
from auth.users
on conflict (id) do nothing;

-- ✅ Listo. Ejecuta el bloque completo de una sola vez.
