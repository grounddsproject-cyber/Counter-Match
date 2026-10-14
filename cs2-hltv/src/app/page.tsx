// ============================================================

// Блокирующий рендер на каждый запрос: персональные данные (cookies) + live-статистика.
export const instant = false
// Главная — лента матчей (Server Component).
// Первичные данные рендерим на сервере (быстрый FCP, SEO),
// а живые обновления догружаем на клиенте через Realtime.
// ============================================================
import { createClient } from "@/lib/supabase/server";
import type { MatchWithRelations } from "@/types";
import { MatchesFeed } from "@/components/match/MatchesFeed";


const MATCH_SELECT = `
  id, status, scheduled_at, format, score_team1, score_team2, winner_team_id,
  event:events ( id, name, prize_pool, tier ),
  team1:teams!matches_team1_id_fkey ( id, name, tag, country_code, logo_url, ranking ),
  team2:teams!matches_team2_id_fkey ( id, name, tag, country_code, logo_url, ranking ),
  map_stats ( id, map_name, map_order, score_team1, score_team2, winner_team_id )
`;

async function getMatches(): Promise<MatchWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .order("scheduled_at", { ascending: false })
    .limit(30);

  if (error) {
    // Supabase не настроен / БД недоступна — страница всё равно должна рендериться
    console.error("matches fetch:", error.message);
    return [];
  }
  return (data ?? []) as unknown as MatchWithRelations[];
}

export default async function HomePage() {
  const matches = await getMatches();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Матчи</h1>
        <p className="mt-1 text-sm text-muted">
          Расписание, LIVE и результаты — обновляются мгновенно через Supabase Realtime
        </p>
      </div>

      {/* Клиентская обёртка: initial data из SSR + подписка на realtime */}
      <MatchesFeed initialMatches={matches} />
    </div>
  );
}
