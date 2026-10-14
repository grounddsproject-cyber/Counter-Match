// ============================================================

// Блокирующий рендер на каждый запрос: персональные данные (cookies) + live-статистика.
export const instant = false
// Профиль игрока — /players/[id]
// Шапка (фото, ник, команда), карточки-виджеты средних показателей,
// кривая рейтинга по последним картам и кнопка Follow.
// ============================================================
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FollowButton } from "@/components/ui/FollowButton";
import type { Player, Team } from "@/types";


async function getData(id: number) {
  const supabase = await createClient();

  const [{ data: player }, { data: recent }, { data: session }] = await Promise.all([
    supabase.from("players").select("*, team:teams(*)").eq("id", id).single(),
    // Последние сыгранные карты игрока — для мини-графика rating
    supabase
      .from("player_map_stats")
      .select("rating, kills, deaths, adr, map:map_stats(map_name, match_id)")
      .eq("player_id", id)
      .order("id", { ascending: false })
      .limit(12),
    supabase.auth.getUser(),
  ]);

  if (!player) notFound();

  let following = false;
  if (session.user) {
    const { data: f } = await supabase
      .from("follows").select("id").eq("target", "player").eq("player_id", id).maybeSingle();
    following = !!f;
  }

  return {
    player: player as unknown as Player & { team: Team | null },
    recent: recent ?? [],
    userId: session.user?.id ?? null,
    following,
  };
}

/** Виджет-плитка показателя (как Widget в macOS Dashboard) */
function StatWidget({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="glass rounded-[14px] p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Мини-график рейтинга по последним картам: вертикальные штрихи в духе HIG sparkline */
function RatingSparkline({ ratings }: { ratings: number[] }) {
  if (ratings.length === 0) return null;
  const max = Math.max(...ratings, 1.5);
  return (
    <div className="flex h-16 items-end gap-1.5" aria-hidden>
      {ratings.map((r, i) => (
        <div key={i} className="group relative flex-1">
          <div
            className="w-full rounded-sm bg-foreground/70 transition-colors group-hover:bg-foreground"
            style={{ height: `${Math.max(6, (r / max) * 64)}px` }}
          />
          <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2
                           text-[10px] tabular-nums text-muted opacity-0 transition-opacity
                           group-hover:opacity-100">
            {r.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { player, recent, userId, following } = await getData(Number(id));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ---------- Шапка ---------- */}
      <section className="glass-strong flex flex-wrap items-center gap-6 rounded-[18px] p-6 shadow-lg">
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name}
               className="h-24 w-24 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full
                          border border-border-subtle bg-hover text-xl font-bold">
            {player.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {player.name}
            <span className="ml-2">{player.country_code}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {player.real_name} · {player.age ?? "?"} лет ·{" "}
            {player.team ? (
              <Link href={`/teams/${player.team.id}`} className="font-medium hover:underline">
                {player.team.name}
              </Link>
            ) : "свободный агент"}
          </p>
        </div>
        <FollowButton target="player" targetId={player.id}
                      initialFollowing={following} isAuthed={!!userId} />
      </section>

      {/* ---------- Виджеты средних показателей ---------- */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatWidget label="Rating 2.1" value={Number(player.rating_hltv).toFixed(2)} hint="за 3 месяца" />
        <StatWidget label="ADR" value={Number(player.adr).toFixed(1)} hint="урон за раунд" />
        <StatWidget label="KAST" value={`${Number(player.kast).toFixed(1)}%`} hint="эффективность" />
        <StatWidget label="HS%" value={`${Number(player.hs_percent).toFixed(1)}%`} hint="через голову" />
      </section>

      {/* ---------- Форма (последние карты) ---------- */}
      {recent.length > 0 && (
        <section className="glass rounded-[18px] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Форма · последние {recent.length} карт
          </h2>
          <RatingSparkline ratings={recent.map((r: any) => Number(r.rating)).reverse()} />
          <div className="mt-4 space-y-1.5">
            {recent.slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="capitalize text-muted">{r.map?.map_name ?? "—"}</span>
                <span className="tabular-nums">{r.kills}:{r.deaths}</span>
                <span className="tabular-nums text-muted">ADR {Number(r.adr).toFixed(1)}</span>
                <span className="ml-auto font-semibold tabular-nums">{Number(r.rating).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
