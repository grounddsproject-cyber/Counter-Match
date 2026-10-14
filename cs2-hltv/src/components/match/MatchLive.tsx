// ============================================================
// MatchLive — клиентская оболочка страницы матча.
// Получает SSR-данные, подписывается на Realtime (useMatchData)
// и рендерит: шапку команд со счётом, вкладки карт и таблицу статов.
// Монохром: победитель выделен жирным, LIVE — пульсирующей точкой.
// ============================================================
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Radio } from "lucide-react";
import { useMatchData } from "@/hooks/useMatchData";
import type { MatchFull, MapStat, PlayerMapStat, Team } from "@/types";
import { fmtFormat, fmtDateTime, flag } from "@/lib/utils";

/* ---------- Мелкие переиспользуемые части ---------- */

function TeamLogo({ team, size = 56 }: { team: Team; size?: number }) {
  return team.logo_url ? (
    <img src={team.logo_url} alt={team.tag ?? team.name}
         style={{ width: size, height: size }}
         className="object-contain" draggable={false} />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full border border-border-subtle
                 bg-hover text-xs font-bold tracking-tight"
    >
      {team.tag?.slice(0, 4) ?? "?"}
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full
                       bg-current opacity-40" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
    </span>
  );
}

/** Одна строка «команда» в шапке матча */
function HeaderTeam({ team, score, won, align }: {
  team: Team; score: number; won: boolean; align: "left" | "right";
}) {
  return (
    <div className={`flex flex-1 items-center gap-4 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <Link href={`/teams/${team.id}`} className="group shrink-0">
        <TeamLogo team={team} />
      </Link>
      <div className={align === "right" ? "text-right" : ""}>
        <p className={`text-lg leading-tight tracking-tight ${won ? "font-semibold" : "font-medium"}
                      group-hover:underline`}>
          <Link href={`/teams/${team.id}`}>{team.name}</Link>
        </p>
        <p className="text-xs text-muted">
          {flag(team.country_code)} #{team.ranking} в мире
        </p>
      </div>
      {/* Счёт — крупная моноширинная цифра, как в macOS Widget */}
      {(score > 0 || won) && (
        <p className={`text-3xl font-semibold tabular-nums tracking-tight ${won ? "" : "text-muted"}`}>
          {score}
        </p>
      )}
    </div>
  );
}

/* ---------- Таблица статистики игроков на карте ---------- */

const STAT_COLS = ["K", "D", "A", "HS%", "ADR", "KAST", "IMP", "RATING"] as const;

function MapStatsTable({ ms, match }: { ms: MapStat & { player_map_stats: PlayerMapStat[] }; match: MatchFull }) {
  // Группируем игроков по командам: сначала победители карты
  const t1players = ms.player_map_stats.filter((p) => p.team_id === match.team1.id);
  const t2players = ms.player_map_stats.filter((p) => p.team_id === match.team2.id);
  const groups = ms.winner_team_id === match.team1.id ? [t1players, t2players] : [t2players, t1players];
  const teams = ms.winner_team_id === match.team1.id ? [match.team1, match.team2] : [match.team2, match.team1];

  return (
    <div className="space-y-6">
      {groups.map((players, gi) => (
        <div key={gi}>
          <div className="mb-2 flex items-center gap-2">
            <TeamLogo team={teams[gi]} size={20} />
            <span className="text-sm font-semibold">{teams[gi].name}</span>
            <span className="ml-auto text-sm tabular-nums text-muted">
              {gi === 0
                ? `${ms.winner_team_id === match.team1.id ? ms.score_team1 : ms.score_team2}`
                : `${ms.winner_team_id === match.team1.id ? ms.score_team2 : ms.score_team1}`}
            </span>
          </div>

          <div className="glass overflow-hidden rounded-[14px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 text-left font-medium">Игрок</th>
                  {STAT_COLS.map((c) => (
                    <th key={c} className="px-2 py-2.5 text-right font-medium tabular-nums">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-3 text-center text-muted">Нет данных</td></tr>
                )}
                {players.map((p) => (
                  <tr key={p.id} className="border-b border-border-subtle/50 last:border-0
                                            transition-colors hover:bg-hover">
                    <td className="px-4 py-2.5">
                      <Link href={`/players/${p.player?.id ?? ""}`}
                            className="font-medium hover:underline">
                        {p.player?.name ?? "—"}
                      </Link>
                      <span className="ml-1.5 text-xs text-muted">{flag(p.player?.country_code)}</span>
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{p.kills}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-muted">{p.deaths}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-muted">{p.assists}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-muted">{Number(p.hs_percent).toFixed(1)}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{Number(p.adr).toFixed(1)}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-muted">{Number(p.kast).toFixed(1)}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-muted">{Number(p.impact).toFixed(2)}</td>
                    {/* Rating 2.1 — главный показатель, выделяем жирным */}
                    <td className="px-2 py-2.5 text-right font-semibold tabular-nums">
                      {Number(p.rating).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Основной компонент ---------- */

export function MatchLive({ initialMatch }: { initialMatch: MatchFull }) {
  const match = useMatchData(initialMatch);
  const [activeMap, setActiveMap] = useState<number>(
    // По умолчанию открываем последнюю сыгранную/идущую карту
    match.map_stats.length ? match.map_stats[match.map_stats.length - 1].map_order : 1,
  );

  const isLive = match.status === "live";
  const isDone = match.status === "finished";
  const current = match.map_stats.find((m) => m.map_order === activeMap);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Хлебные крошки */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted
                                transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Все матчи
      </Link>

      {/* ---------- Шапка матча (glass-карточка) ---------- */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-[18px] p-6 shadow-lg"
      >
        <header className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {isLive && (
            <span className="flex items-center gap-1.5 font-semibold">
              <Radio className="h-3.5 w-3.5" /><LiveDot /> LIVE
            </span>
          )}
          {match.event && <span>{match.event.name}</span>}
          <span>{fmtFormat(match.format)}</span>
          <span>{fmtDateTime(match.scheduled_at)}</span>
          {match.venue && <span>{match.venue}</span>}
        </header>

        <div className="flex items-center gap-4">
          <HeaderTeam team={match.team1} score={match.score_team1}
                      won={match.winner_team_id === match.team1.id} align="left" />
          <span className="shrink-0 text-sm text-muted">vs</span>
          <HeaderTeam team={match.team2} score={match.score_team2}
                      won={match.winner_team_id === match.team2.id} align="right" />
        </div>

        {!isDone && !isLive && (
          <p className="mt-4 text-center text-sm text-muted">
            Матч ещё не начался · начало {fmtDateTime(match.scheduled_at)}
          </p>
        )}
      </motion.section>

      {/* ---------- Вкладки карт ---------- */}
      {match.map_stats.length > 0 && (
        <>
          <nav className="glass inline-flex items-center gap-1 rounded-full p-1">
            {match.map_stats.map((ms) => {
              const isActive = ms.map_order === activeMap;
              return (
                <button
                  key={ms.id}
                  onClick={() => setActiveMap(ms.map_order)}
                  className={`relative rounded-full px-4 py-1.5 text-sm transition-colors
                              ${isActive ? "font-medium" : "text-muted hover:text-foreground"}`}
                >
                  {isActive && (
                    <motion.span layoutId="map-tab"
                      className="absolute inset-0 rounded-full border border-border-subtle bg-hover"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
                  )}
                  <span className="relative capitalize">{ms.map_name}</span>
                  {(ms.score_team1 > 0 || ms.score_team2 > 0) && (
                    <span className="relative ml-2 tabular-nums text-xs text-muted">
                      {ms.score_team1}-{ms.score_team2}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ---------- Статистика выбранной карты ---------- */}
          {current && (
            current.player_map_stats.length > 0 ? (
              <MapStatsTable ms={current} match={match} />
            ) : (
              <div className="glass rounded-[14px] p-8 text-center text-sm text-muted">
                {isLive ? "Раунд идёт — статистика появится чуть позже…" : "Статистика по этой карте недоступна"}
              </div>
            )
          )}
        </>
      )}

      {match.stream_url && (
        <a href={match.stream_url} target="_blank" rel="noreferrer"
           className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm
                      transition-colors hover:bg-hover">
          Смотреть трансляцию ↗
        </a>
      )}
    </div>
  );
}
