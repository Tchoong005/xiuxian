-- 修仙游戏 2.0 终极数据库修复脚本

-- =========================
-- 0) 启用扩展
-- =========================
create extension if not exists pgcrypto;

-- =========================
-- A) users 表（账号系统）
-- =========================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz null
);

-- 列名统一检查逻辑
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='users' and column_name='pass_hash'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='users' and column_name='password_hash'
  ) then
    alter table public.users rename column pass_hash to password_hash;
  end if;
end $$;

-- =========================
-- B) saves 表（存档系统）
-- =========================
create table if not exists public.saves (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('guest','user')),
  owner_id text not null, -- guest: session.guest_id; user: users.id
  slot int not null default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(owner_type, owner_id, slot)
);

create index if not exists idx_saves_owner on public.saves(owner_type, owner_id);
create index if not exists idx_saves_updated on public.saves(updated_at desc);

-- 自动更新 updated_at
create or replace function public.update_modified_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_saves_modtime on public.saves;
create trigger update_saves_modtime
before update on public.saves
for each row execute procedure public.update_modified_column();

-- =========================
-- C) RLS（暂时禁用以确保连接畅通，后期如需可开启）
-- =========================
alter table public.users disable row level security;
alter table public.saves disable row level security;
