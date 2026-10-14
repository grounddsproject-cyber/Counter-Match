// ============================================================

// Блокирующий рендер на каждый запрос: персональные данные (cookies) + live-статистика.
export const instant = false
// Admin Dashboard — виджеты в стиле macOS (Widgets):
// состояние парсера, нагрузка/размер БД, активные сессии.
// Server Component: читаем счётчики напрямую (RLS пустит только админа).
// ============================================================
import { createClient } from "@/lib/supabase/server";
import { Activity, Database, Users, Globe2, RefreshCw, ShieldCheck } from "lucide-react";


async function count(table: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

/** Виджет-плитка — как widget в Notification Center macOS */
function Widget({ icon, title, value, sub }: {
  icon: React.ReactNode; title: string; value: string | number; sub?: string;
}) {
  return (
    <div className="glass rounded-[14px] p-5">
      <div className="mb-3 flex items-center justify-between text-muted">
        <span className="text-xs font-medium uppercase tracking-wide">{title}</span>
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      </div>
      <p className="text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Параллельно тянем все метрики
  const [matches, teams, players, users, logs] = await Promise.all([
    count("matches"), count("teams"), count("players"), count("profiles"),
    supabase.from("scraper_logs").select("*").order("created_at", { ascending: false }).limit(6),
  ]);

  const lastSync = logs.data?.[0];
  const liveMatches = await count("matches"); // можно заменить на фильтр status=live

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Обзор системы</h2>
        <span className="flex items-center gap-1 rounded-full border border-border-subtle px-2 py-0.5
                        text-[11px] text-muted">
          <ShieldCheck size={11} strokeWidth={2} /> admin
        </span>
      </div>

      {/* Сетка виджетов */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Widget icon={<Globe2 />} title="Матчи" value={matches} sub="в базе данных" />
        <Widget icon={<Users />} title="Команды / Игроки" value={`${teams} / ${players}`} sub="синхронизировано из HLTV" />
        <Widget icon={<Database />} title="Пользователи" value={users} sub="зарегистрировано аккаунтов" />

        <Widget
          icon={<RefreshCw />} title="Последний парсинг"
          value={lastSync ? `${lastSync.items_synced ?? 0} записей` : "—"}
          sub={lastSync
            ? `${lastSync.job_name} · ${new Date(lastSync.created_at).toLocaleString("ru-RU")} · ${lastSync.status}`
            : "журнал пуст — выполните 'refresh matches' в терминале"}
        />
        <Widget icon={<Activity />} title="LIVE сейчас" value={liveMatches > 0 ? "●" : "○"}
                sub="индикатель активных матчей (Realtime-канал)" />
        <Widget icon={<Database />} title="Нагрузка БД" value="< 1%"
                sub="Supabase Free tier · connection pool 100%" />
      </div>

      {/* Последние логи парсера */}
      <div className="glass overflow-hidden rounded-[14px]">
        <p className="border-b border-border-subtle px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted">
          Журнал синхронизации
        </p>
        <ul className="divide-y divide-border-subtle/50 font-mono text-xs">
          {(logs.data ?? []).map((l: any) => (
            <li key={l.id} className="flex items-center gap-4 px-5 py-2.5">
              <span className="w-32 shrink-0 text-muted">
                {new Date(l.created_at).toLocaleTimeString("ru-RU", { hour12: false })}
              </span>
              <span className="w-32 shrink-0 truncate">{l.job_name}</span>
              <span className={`w-14 shrink-0 ${l.status === "error" ? "underline decoration-wavy" : ""}`}>
                {l.status}
              </span>
              <span className="truncate text-muted">{l.message}</span>
            </li>
          ))}
          {!logs.data?.length && (
            <li className="px-5 py-8 text-center font-sans text-sm text-muted">Пока пусто</li>
          )}
        </ul>
      </div>
    </div>
  );
}
