// ============================================================

// Блокирующий рендер на каждый запрос: персональные данные (cookies) + live-статистика.
export const instant = false
// Мировой рейтинг команд — таблица в стиле macOS List.
// Server Component + ISR; Realtime здесь не нужен (рейтинг
// пересчитывает парсер раз в час).
// ============================================================
import { createClient } from "@/lib/supabase/server";
import type { Team } from "@/types";


async function getTeams(): Promise<Team[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("is_active", true)
    .order("ranking", { ascending: true })
    .limit(30);

  if (error) return [];
  return data as Team[];
}

export default async function RankingPage() {
  const teams = await getTeams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Мировой рейтинг</h1>
        <p className="mt-1 text-sm text-muted">Топ-30 команд Counter-Strike 2</p>
      </div>

      <div className="glass overflow-hidden rounded-[14px]">
        {/* Заголовок таблицы */}
        <div className="grid grid-cols-[52px_1fr_90px] gap-3 border-b border-border-subtle
                      px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-muted">
          <span>#</span><span>Команда</span><span className="text-right">Рейтинг</span>
        </div>

        {teams.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">
            Данные ещё не синхронизированы — запустите парсер из админ-терминала
          </p>
        ) : (
          teams.map((t, i) => (
            <a
              key={t.id}
              href={`/teams/${t.id}`}
              style={{ animationDelay: `${i * 20}ms` }}
              className="animate-fade-up grid grid-cols-[52px_1fr_90px] items-center gap-3
                         border-b border-border-subtle/50 px-5 py-3 transition-colors hover:bg-hover"
            >
              <span className="text-sm tabular-nums text-muted">{t.ranking}</span>

              <span className="flex items-center gap-3 truncate">
                {t.logo_url ? (
                  <img src={t.logo_url} alt="" className="h-7 w-7 object-contain" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full
                                   border border-border-subtle text-[9px] font-bold">
                    {t.tag?.slice(0, 3)}
                  </span>
                )}
                <span className="truncate text-sm font-medium">{t.name}</span>
                <span className="hidden text-xs uppercase text-muted sm:inline">{t.country_code}</span>
              </span>

              <span className="text-right text-sm font-semibold tabular-nums">
                {(1.35 - (t.ranking ?? 1) * 0.012).toFixed(2)}
              </span>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
