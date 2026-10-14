// ============================================================

// Блокирующий рендер на каждый запрос: персональные данные (cookies) + live-статистика.
export const instant = false
// Игроки — /players
// Server Component + клиентский поиск (без обращения к серверу).
// Список в стиле macOS Settings: аватар, ник, тег команды, статы.
// ============================================================
import { createClient } from "@/lib/supabase/server";
import { PlayersTable } from "@/components/player/PlayersTable";
import type { PlayerWithTeam } from "@/types";


async function getPlayers(): Promise<PlayerWithTeam[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("*, team:teams(id, name, tag, logo_url)")
    .eq("is_pro", true)
    .order("rating_hltv", { ascending: false })
    .limit(200);
  if (error) return [];
  return data as unknown as PlayerWithTeam[];
}

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Игроки</h1>
        <p className="mt-1 text-sm text-muted">
          Топ-профессионалы CS2 по рейтингу HLTV 2.1
        </p>
      </div>

      <PlayersTable initialPlayers={players} />
    </div>
  );
}
