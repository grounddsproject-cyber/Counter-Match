-- ============================================================
-- 0003: демо-аккаунты (admin + user), триггер Realtime для teams,
-- обновление рейтингов команд (для красивых дельт на /ranking).
-- Запускать после 0001 и 0002.
-- ============================================================

-- ---------- 1. Демо-пользователи через auth.users ----------
-- Пароль для обоих: "demo1234" (только для локальной разработки!).
-- Первый аккаунт — админ (роль выставим сразу при insert в profiles).
with new_admin as (
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                          email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                          created_at, updated_at, confirmation_token, recovery_token,
                          phone_change, email_change, is_sso_user)
  values ('alphanumeric', '00000000-0000-0000-0000-0000000000ad', 'authenticated', 'authenticated',
          'admin@cs2stats.local', crypt('demo1234', gen_salt('bf')),
          now(), '{"provider":"email","providers":["email"]}', '{"username":"admin"}',
          now(), now(), '', '', false, '', false)
  returning id
),
new_user as (
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                          email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                          created_at, updated_at, confirmation_token, recovery_token,
                          phone_change, email_change, is_sso_user)
  values ('alphanumeric', '00000000-0000-0000-0000-0000000000be', 'authenticated', 'authenticated',
          'fan@cs2stats.local', crypt('demo1234', gen_salt('bf')),
          now(), '{"provider":"email","providers":["email"]}', '{"username":"cs_fan"}',
          now(), now(), '', '', false, '', false)
  returning id
)
insert into public.profiles (id, username, email, role)
select id, case when id = '00000000-0000-0000-0000-0000000000ad'::uuid
                then 'admin' else 'cs_fan' end,
       case when id = '00000000-0000-0000-0000-0000000000ad'::uuid
            then 'admin@cs2stats.local' else 'fan@cs2stats.local' end,
       case when id = '00000000-0000-0000-0000-0000000000ad'::uuid
            then 'admin' else 'user' end
from (select id from new_admin union all select id from new_user) u;

-- Избранное у демо-юзера: NAVI и Spirit
insert into public.follows (user_id, target, team_id)
values ('00000000-0000-0000-0000-0000000000be', 'team', 1),
       ('00000000-0000-0000-0000-0000000000be', 'team', 2);

-- ---------- 2. Триггер Realtime для рейтинга команд ----------
-- Supabase Realtime (postgres_changes) не рассылает UPDATE без REPLICA IDENTITY FULL,
-- а команды меняют только ranking (PK не меняется) — включаем полную запись old/new.
alter table public.teams replica identity full;

-- Хелпер-функция, вызываемая парсером после обновления рейтинга.
-- Сама по себе update тех же значений всё равно породит WAL-событие
-- (trigger-based broadcast надёжнее, чем «виртуальные» изменения).
create or replace function public.touch_teams_realtime() returns void as $$
begin
  perform 1; -- no-op: реальные изменения делает Edge Function через service_role
end;
$$ language plpgsql;

-- ---------- 3. Обновление рейтингов (дельты для UI) ----------
-- Небольшое «движение» относительно сида из 0002, чтобы страница
-- рейтинга выглядела живой после очередного прогона парсера.
update public.teams set ranking = case id
  when 1  then 2     -- Team Spirit    (#1 -> #2)
  when 2  then 1     -- NAVI           (#2 -> #1)
  when 5  then 4     -- FURIA          (#5 -> #4)
  when 4  then 5     -- The MongolZ    (#4 -> #5)
  when 7  then 6     -- G2             (#7 -> #6)
  when 6  then 7     -- FaZe           (#6 -> #7)
  when 11 then 12    -- Astralis       (#11 -> #12)
  else ranking end
where id in (1,2,4,5,6,7,11);
