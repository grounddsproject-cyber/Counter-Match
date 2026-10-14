-- ============================================================
-- CS2 Stats (HLTV-аналог) — Схема базы данных Supabase
-- Запускать в Supabase SQL Editor или через `supabase db push`
-- ============================================================

-- ---------- Расширения ----------
create extension if not exists "pgcrypto";

-- ---------- ENUM типы ----------
create type public_role as enum ('user', 'admin');
create type match_status as enum ('scheduled', 'live', 'finished', 'canceled');
create type follow_target as enum ('team', 'player');

-- ============================================================
-- 1. PROFILES — расширение auth.users (роль, бан, ник)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  email       text unique not null,
  role        public_role not null default 'user',
  is_banned   boolean not null default false,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Триггер: автосоздание профиля при регистрации.
-- Пользователь с email из settings app.admin_email получает роль admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, email, role)
  values (
    new.id,
    coalesce(split_part(new.email, '@', 1), 'player_' || substr(new.id::text, 1, 8)),
    new.email,
    case when new.email = current_setting('app.admin_email', true) then 'admin' else 'user' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Проверка: является ли текущий юзер админом (используется в RLS)
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_banned = false
  );
$$;

-- ============================================================
-- 2. TEAMS — команды
-- ============================================================
create table public.teams (
  id            bigint primary key generated always as identity,
  hltv_id       bigint unique,               -- внешний ID в HLTV (для синхронизации)
  name          text not null,
  tag           text,                        -- например "NAVI", "FaZe"
  country_code  char(2),                     -- "ua", "ru", "us"…
  logo_url      text,                        -- ссылка на Supabase Storage
  ranking       integer default 9999,        -- мировой рейтинг
  is_active     boolean not null default true,
  synced_at     timestamptz default now(),   -- когда последний раз парсер обновлял
  created_at    timestamptz not null default now()
);

create index teams_ranking_idx on public.teams (ranking);

-- ============================================================
-- 3. PLAYERS — игроки
-- ============================================================
create table public.players (
  id            bigint primary key generated always as identity,
  hltv_id       bigint unique,
  team_id       bigint references public.teams(id) on delete set null,
  name          text not null,               -- игровой ник
  real_name     text,
  country_code  char(2),
  photo_url     text,
  age           integer,
  rating_hltv   numeric(4,2) default 0,      -- HLTV rating 2.1
  adr           numeric(6,2) default 0,      -- avg damage per round
  kast          numeric(5,2) default 0,      -- % K/A/S/T
  hs_percent    numeric(5,2) default 0,
  is_pro        boolean not null default true,
  synced_at     timestamptz default now(),
  created_at    timestamptz not null default now()
);

create index players_team_idx   on public.players (team_id);
create index players_rating_idx on public.players (rating_hltv desc);

-- ============================================================
-- 4. EVENTS — турниры (для группировки матчей)
-- ============================================================
create table public.events (
  id          bigint primary key generated always as identity,
  hltv_id     bigint unique,
  name        text not null,
  prize_pool  text,                          -- "$1,000,000"
  start_date  date,
  end_date    date,
  logo_url    text,
  tier        text default 'S'               -- S / A / B / C
);

-- ============================================================
-- 5. MATCHES — матчи
-- ============================================================
create table public.matches (
  id             bigint primary key generated always as identity,
  hltv_id        bigint unique,
  event_id       bigint references public.events(id) on delete set null,
  team1_id       bigint not null references public.teams(id),
  team2_id       bigint not null references public.teams(id),
  status         match_status not null default 'scheduled',
  scheduled_at   timestamptz not null,
  format         text default 'bo3',         -- bo1 / bo2 / bo3 / bo5
  score_team1    integer default 0,
  score_team2    integer default 0,
  winner_team_id bigint references public.teams(id),
  stream_url     text,
  venue          text,
  synced_at      timestamptz default now(),
  created_at     timestamptz not null default now(),

  constraint no_self_match check (team1_id <> team2_id)
);

create index matches_status_idx    on public.matches (status);
create index matches_scheduled_idx on public.matches (scheduled_at desc);

-- ============================================================
-- 6. MAP_STATS — карты внутри матча
-- ============================================================
create table public.map_stats (
  id             bigint primary key generated always as identity,
  match_id       bigint not null references public.matches(id) on delete cascade,
  map_name       text not null,              -- mirage / inferno / ancient…
  map_order      smallint not null default 1,-- порядок в серии
  score_team1    integer not null default 0,
  score_team2    integer not null default 0,
  winner_team_id bigint references public.teams(id),
  picked_by      bigint references public.teams(id), -- команда, выбравшая карту
  duration_min   integer,
  unique (match_id, map_order)
);

create index map_stats_match_idx on public.map_stats (match_id);

-- ============================================================
-- 7. PLAYER_MAP_STATS — статистика игрока на конкретной карте
-- ============================================================
create table public.player_map_stats (
  id          bigint primary key generated always as identity,
  map_stat_id bigint not null references public.map_stats(id) on delete cascade,
  player_id   bigint not null references public.players(id) on delete cascade,
  team_id     bigint not null references public.teams(id),
  kills       integer default 0,
  deaths      integer default 0,
  assists     integer default 0,
  hs_percent  numeric(5,2) default 0,
  adr         numeric(6,2) default 0,
  kast        numeric(5,2) default 0,
  impact      numeric(4,2) default 0,
  rating      numeric(4,2) default 0,
  unique (map_stat_id, player_id)
);

create index pms_player_idx on public.player_map_stats (player_id);

-- ============================================================
-- 8. FOLLOWS — избранное пользователя (команды/игроки)
-- ============================================================
create table public.follows (
  id         bigint primary key generated always as identity,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  target     follow_target not null,
  team_id    bigint references public.teams(id) on delete cascade,
  player_id  bigint references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),

  -- либо team, либо player — не оба сразу и не пусто
  constraint follow_one_target check (
    (target = 'team'   and team_id is not null   and player_id is null) or
    (target = 'player' and player_id is not null and team_id is null)
  )
);

create unique index follows_unique_idx
  on public.follows (user_id, target, coalesce(team_id, -1), coalesce(player_id, -1));

-- ============================================================
-- 9. SCRAPER_LOGS — журнал работы парсера (для дашборда админа)
-- ============================================================
create table public.scraper_logs (
  id           bigint primary key generated always as identity,
  job_name     text not null,                -- 'sync-matches', 'sync-teams'…
  status       text not null,                -- 'ok' | 'error' | 'partial'
  items_synced integer default 0,
  duration_ms  integer,
  message      text,
  created_at   timestamptz not null default now()
);

create index scraper_logs_time_idx on public.scraper_logs (created_at desc);

-- ============================================================
-- REALTIME — мгновенные обновления UI (WebSockets)
-- ============================================================
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.map_stats;
alter publication supabase_realtime add table public.player_map_stats;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles         enable row level security;
alter table public.teams            enable row level security;
alter table public.players          enable row level security;
alter table public.events           enable row level security;
alter table public.matches          enable row level security;
alter table public.map_stats        enable row level security;
alter table public.player_map_stats enable row level security;
alter table public.follows          enable row level security;
alter table public.scraper_logs     enable row level security;

-- Профили: читать может каждый, менять себя — владелец, роль/бан — админ.
create policy "profiles: read all"    on public.profiles for select using (true);
create policy "profiles: update self" on public.profiles for update using (auth.uid() = id);
create policy "profiles: admin all"   on public.profiles for all using (public.is_admin());

-- Публичные данные: чтение всем. Запись возможна только через
-- service_role (Edge Functions обходят RLS) — политик INSERT нет.
create policy "teams: read all"   on public.teams            for select using (true);
create policy "players: read all" on public.players          for select using (true);
create policy "events: read all"  on public.events           for select using (true);
create policy "matches: read all" on public.matches          for select using (true);
create policy "maps: read all"    on public.map_stats        for select using (true);
create policy "pms: read all"     on public.player_map_stats for select using (true);

-- Админ может руками править каталог команд/игроков
create policy "teams: admin write"   on public.teams   for all using (public.is_admin()) with check (public.is_admin());
create policy "players: admin write" on public.players for all using (public.is_admin()) with check (public.is_admin());

-- Follows: пользователь управляет только своими подписками
create policy "follows: own read"   on public.follows for select using (auth.uid() = user_id);
create policy "follows: own insert" on public.follows for insert with check (auth.uid() = user_id);
create policy "follows: own delete" on public.follows for delete using (auth.uid() = user_id);

-- Scraper logs: читает только админ (пишет service_role)
create policy "logs: admin read" on public.scraper_logs for select using (public.is_admin());

-- ВАЖНО: Edge Function использует service_role ключ — он полностью обходит RLS,
-- поэтому парсер может писать в любые таблицы без дополнительных политик.
