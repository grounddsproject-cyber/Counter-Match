// ============================================================

// Блокирующий рендер на каждый запрос: персональные данные (cookies) + live-статистика.
export const instant = false
// Страница матча — /matches/[id]
// Server Component (SSR) + клиентский MatchLive с Realtime:
// любое изменение matches/map_stats/player_map_stats от парсера
// мгновенно рефетчит данные без перезагрузки страницы.
// ============================================================
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MatchLive } from "@/components/match/MatchLive";
import type { MatchFull } from "@/types";


async function getMatch(id: number): Promise<MatchFull | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(`
      *,
      event:events(*),
      team1:teams!matches_team1_id_fkey(*),
      team2:teams!matches_team2_id_fkey(*),
      map_stats(
        *,
        player_map_stats(
          *,
          player:players(*)
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  // Карты по порядку; внутри карты — игроки по рейтингу (лучшие сверху)
  const m = data as unknown as MatchFull;
  m.map_stats = (m.map_stats ?? [])
    .sort((a, b) => a.map_order - b.map_order)
    .map((ms) => ({
      ...ms,
      player_map_stats: (ms.player_map_stats ?? []).sort(
        (a, b) => Number(b.rating) - Number(a.rating),
      ),
    }));
  return m;
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatch(Number(id));
  if (!match) notFound();

  return <MatchLive initialMatch={match} />;
}
