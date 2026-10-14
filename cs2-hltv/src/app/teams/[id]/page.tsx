// ============================================================

// Блокирующий рендер на каждый запрос: персональные данные (cookies) + live-статистика.
export const instant = false
// Страница профиля команды — /teams/[id]
// Server Component: шапка (логотип, рейтинг, регион), кнопка Follow,
// росток игроков и последние матчи команды.
// ============================================================
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FollowButton } from "@/components/ui/FollowButton";
import type { Player, Team } from "@/types";


interface Props { params: Promise<{ id: string }> }

async function getData(id: number) {
  const supabase = await createClient();

  const [{ data: team }, { data: players }, { data: matches }, { data: session }] =
    await Promise.all([
      supabase.from("teams").select("*").eq("id", id).single(),
      supabase
        .from("players")
        .select("*")
        .eq("team_id", id)
        .order("rating_hltv", { ascending: false }),
      supabase
        .from("matches")
        .select(`*, event:events(*), team1:teams!matches_team1_id_fkey(*), team2:teams!matches_team2_id_fkey(*)`)
        .or(`team1_id.eq.${id},team2_id.eq.${id}`)
        .in("status", ["live", "scheduled", "finished"])
        .order("scheduled_at", { ascending: false })
        .limit(8),
      supabase.auth.getUser(),
    ]);

  if (!team) notFound();

  // Следит ли текущий юзер за командой (RLS покажет только свои строки)
  let following = false;
  if (session.user) {
    const { data: f } = await supabase
      .from("follows")
      .select("id")
      .eq("target", "team")
      .eq("team_id", id)
      .maybeSingle();
    following = !!f;
  }

  return {
    team: team as Team,
    players: (players ?? []) as Player[],
    matches: matches ?? [],
    userId: session.user?.id ?? null,
    following,
  };
}

export default async function TeamPage({ params }: Props) {
  const { id } = await params;
  const { team, players, matches, userId, following } = await getData(Number(id));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ---------- Шапка команды ---------- */}
      <section className="glass-strong flex flex-wrap items-center gap-6 rounded-[18px] p-6 shadow-lg">
        {team.logo_url ? (
          <img src={team.logo_url} alt={team.name}
               className="h-20 w-20 shrink-0 object-contain" />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full
                          border border-border-subtle bg-hover text-lg font-bold">
            {team.tag ?? "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{team.name}</h1>
          <p className="mt-1 text-sm text-muted">
            #{team.ranking} в мире · {(team.country_code ?? "").toUpperCase()} ·{" "}
            {players.length} в ростере
          </p>
        </div>
        <FollowButton target="team" targetId={team.id}
                      initialFollowing={following} isAuthed={!!userId} />
      </section>

      {/* ---------- Ростер ---------- */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Ростер</h2>
        <div className="glass overflow-hidden rounded-[14px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-[11px] uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 text-left font-medium">Игрок</th>
                <th className="px-2 py-2.5 text-right font-medium tabular-nums">Возраст</th>
                <th className="px-2 py-2.5 text-right font-medium tabular-nums">Rating</th>
                <th className="px-2 py-2.5 text-right font-medium tabular-nums">ADR</th>
                <th className="px-2 py-2.5 text-right font-medium tabular-nums">KAST</th>
                <th className="px-4 py-2.5 text-right font-medium tabular-nums">HS%</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-b border-border-subtle/50 last:border-0
                                          transition-colors hover:bg-hover">
                  <td className="px-4 py-3">
                    <Link href={`/players/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    <span className="ml-1.5">{p.country_code}</span>
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums text-muted">{p.age ?? "—"}</td>
                  <td className="px-2 py-3 text-right font-semibold tabular-nums">
                    {Number(p.rating_hltv).toFixed(2)}
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums">{Number(p.adr).toFixed(1)}</td>
                  <td className="px-2 py-3 text-right tabular-nums text-muted">{Number(p.kast).toFixed(1)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted">{Number(p.hs_percent).toFixed(1)}</td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">Ростер пуст</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Последние матчи ---------- */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Матчи</h2>
        <div className="space-y-2">
          {matches.map((m: any) => {
            const opp = m.team1.id === team.id ? m.team2 : m.team1;
            const myScore = m.team1.id === team.id ? m.score_team1 : m.score_team2;
            const oppScore = m.team1.id === team.id ? m.score_team2 : m.score_team1;
            const won = m.winner_team_id === team.id;
            return (
              <Link key={m.id} href={`/matches/${m.id}`}
                    className="glass flex items-center gap-4 rounded-[14px] px-4 py-3
                               transition-transform hover:-translate-y-0.5">
                <span className={`w-14 text-xs ${m.status === "live" ? "font-semibold" : "text-muted"}`}>
                  {m.status === "live" ? "LIVE" : m.status === "scheduled"
                    ? new Date(m.scheduled_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
                    : won ? "Победа" : "Поражение"}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  vs <span className={won ? "font-semibold" : ""}>{opp.name}</span>
                  <span className="ml-2 text-xs text-muted">{m.event?.name}</span>
                </span>
                {(m.status !== "scheduled") && (
                  <span className={`tabular-nums text-sm ${won ? "font-semibold" : "text-muted"}`}>
                    {myScore}:{oppScore}
                  </span>
                )}
              </Link>
            );
          })}
          {matches.length === 0 && (
            <div className="glass rounded-[14px] p-6 text-center text-sm text-muted">
              Матчей пока нет
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
