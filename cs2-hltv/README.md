# CS2Stats — аналог HLTV.org в стиле macOS

Минималистичный монохромный сайт статистики CS2: расписание, LIVE-матчи,
результаты по картам, рейтинги команд, профили игроков и команд, избранное,
админ-панель «Control Center» (Spotlight ⌘K + Терминал).

**Стек:** Next.js 16 (App Router) · Tailwind CSS v4 · Framer Motion · Zustand ·
Supabase (PostgreSQL + Auth + Realtime + Edge Functions).

> **Дисклеймер:** данные о матчах, командах и игроках предоставлены HLTV.org.
> Сайт не является официальным представителем HLTV и используется исключительно
> в образовательных/статистических целях. Все права на оригинальные данные
> принадлежат их владельцам.

---

## Архитектура потока данных

```
HLTV.org ──(парсинг только с сервера!)──▶ Edge Function sync-hltv
                                              │ upsert по hltv_id + журнал scraper_logs
                                              ▼
                                     Supabase PostgreSQL
                                              │ Realtime (postgres_changes)
                                              ▼
                              Next.js Server Components (первичные данные)
                                              │
                                              ▼
                         Client Components + хук useRealtime (live-обновления)
```

Фронтенд **никогда** не обращается к HLTV напрямую — только к Supabase.
Это защищает IP от банов и держит UI мгновенным через WebSockets.

---

## Быстрый старт

### 1. Supabase
1. Создайте проект на [supabase.com](https://supabase.com).
2. В **SQL Editor** выполните миграции по порядку:
   - `supabase/migrations/0001_schema.sql` — таблицы, RLS, триггеры;
   - `supabase/migrations/0002_seed.sql` — топ-30 команд, ростеры, турниры, матчи;
   - `supabase/migrations/0003_extras.sql` — демо-аккаунты + доп. триггеры Realtime.
3. **Authentication → Providers**: включите Email, Google, GitHub
   (для OAuth добавьте callback `http://localhost:3000/auth/callback`).
4. Скопируйте ключи из **Settings → API**.

### 2. Окружение
```bash
cp .env.local.example .env.local   # и заполните значениями из Supabase
```

### 3. Edge Functions (парсер + админ-команды)
Требуется Supabase CLI (`npm i -g supabase && supabase login`):
```bash
supabase link --project-ref YOUR_REF
supabase functions deploy sync-hltv    # парсер (мок, каркас под реальный скрапер)
supabase functions deploy admin-tools  # команды админ-терминала
```
Задайте секреты функций: `SUPABASE_SERVICE_ROLE_KEY`, `SYNC_SECRET`.

### 4. Cron-синхронизация
В **Supabase Dashboard → Scheduler** создайте job каждые 5 минут:
```
POST https://YOUR_REF.functions.supabase.co/sync-hltv
Header: Authorization: Bearer <SYNC_SECRET>
```
(или Vercel Cron, если хостинг на Vercel).

### 5. Запуск
```bash
npm install
npm run dev        # http://localhost:3000
```

**Демо-аккаунты** (из 0003_extras.sql, пароль `demo1234`):
| Роль  | Email                    |
|-------|--------------------------|
| Admin | admin@cs2stats.local     |
| User  | fan@cs2stats.local       |

Админом также становится любой аккаунт, зарегистрированный на `ADMIN_EMAIL`
(триггер `on_auth_user_created` в схеме).

---

## Структура проекта

```
src/
├── app/
│   ├── page.tsx                 # Лента матчей (Все / Live / Расписание / Результаты)
│   ├── ranking/                 # Мировой рейтинг команд
│   ├── teams/ , players/        # Списки + динамические профили /[id]
│   ├── matches/[id]/            # Страница матча: карты, раунды, статистика игроков
│   ├── profile/                 # Аккаунт + избранное (Follows)
│   ├── login/                   # Auth (Email + Google/GitHub)
│   ├── auth/                    # callback (OAuth) и logout (route handler)
│   └── admin/                   # Control Center: dashboard, users (Spotlight), terminal
├── components/
│   ├── ui/                      # ThemeToggle, FollowButton, ThemeBootstrap
│   ├── match/                   # MatchCard, MatchesFeed, MatchLive (Realtime)
│   ├── layout/                  # Header, Footer, DisclaimerModal
│   └── admin/                   # SpotlightSearch, AdminTerminal, UsersTable
├── hooks/                       # useRealtime, useMatchData
├── lib/supabase/                # SSR/браузерные клиенты
├── store/theme.ts               # Zustand + persist (system/light/dark)
└── middleware.ts                # Обновление токенов + защита /admin (role=admin)

supabase/
├── migrations/                  # 0001 schema+RLS · 0002 seed · 0003 extras
└── functions/
    ├── sync-hltv/               # Парсер HLTV (идемпотентный upsert, журнал)
    └── admin-tools/             # refresh | clear | stats | ban | unban
```

---

## Дизайн-система

- **Монохром**: `#f5f5f7` (light) / `#0a0a0b` (dark), акцент только в логотипах команд.
- **Glassmorphism**: `backdrop-blur-xl`, границы `1px solid rgba(128,128,128,.2)`,
  мягкие тени, радиусы 14px (macOS Sonoma/Sequoia).
- **Типографика**: SF Pro → Inter fallback.
- **Темы**: плавные CSS-переходы + сегментированный переключатель
  Auto/Light/Dark; модалка-дисклеймер при первом визите (localStorage).

## Безопасность

- RLS: чтение публичных данных — всем; запись — только `service_role` (Edge Functions).
- `/admin` доступен исключительно при `profiles.role = 'admin'` (middleware + RLS + проверка в функции).
- Анонимный ключ безопасен на клиенте благодаря RLS; service-role ключ живёт только в секретах функций.

## Деплой

1. Push в GitHub → импорт в [Vercel](https://vercel.com).
2. Пропишите переменные окружения из `.env.local.example`.
3. Настройте домен OAuth-callback в Supabase (prod URL).
4. Проверьте, что обе Edge Function задеплоены и Cron активен.
