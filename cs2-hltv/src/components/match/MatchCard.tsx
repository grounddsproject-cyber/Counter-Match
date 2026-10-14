"use client";

// ============================================================
// MatchCard — карточка матча в стиле macOS glassmorphism.
// Монохром: статус LIVE передается пульсирующей точкой и текстом,
// победитель — жирностью. Цвета только в логотипах команд.
// ============================================================
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import type { MatchWithRelations } from "@/types";
import { fmtDateTime } from "@/lib/utils";

/** Компактная метка времени для карточки */
function formatWhen(iso: string, status: string): string {
  const d = new Date(iso);
  const diffH = (d.getTime() - Date.now()) / 36e5;

  if (status === "live") return "Сейчас";
  if (status === "finished") return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  if (diffH > 0 && diffH < 24) return `через ${Math.max(1, Math.round(diffH))} ч`;
  return fmtDateTime(iso);
}

function TeamSide({ team, won, align }: {
  team: MatchWithRelations["team1"];
  won: boolean;
  align: "left" | "right";
}) {
  return (
    <div className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse" : ""}`}>
      {/* Логотип команды — единственное цветное пятно на карточке */}
      {team.logo_url ? (
        <img src={team.logo_url} alt={team.tag ?? team.name}
             className="h-9 w-9 shrink-0 object-contain" draggable={false} />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                      border border-border-subtle bg-hover text-[10px] font-bold tracking-tight">
          {team.tag?.slice(0, 3) ?? "?"}
        </div>
      )}
      <div className={align === "right" ? "text-right" : "text-left"}>
        <p className={`truncate text-sm leading-tight ${won ? "font-semibold" : "font-medium"}`}>
          {team.name}
        </p>
        {team.ranking != null && team.ranking < 100 && (
          <p className="text-[11px] text-muted">#{team.ranking} в мире</p>
        )}
      </div>
    </div>
  );
}

export function MatchCard({ match }: { match: MatchWithRelations }) {
  const isLive = match.status === "live";
  const isDone = match.status === "finished";
  const showScore = isLive || isDone;
  const t1won = match.winner_team_id === match.team1.id;
  const t2won = match.winner_team_id === match.team2.id;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2 }}
      className="glass rounded-[14px] p-4 transition-shadow hover:shadow-lg"
    >
      {/* Шапка и карты — кликабельная ссылка на страницу матча;
          команды остаются обычным текстом, чтобы не было вложенных <a> */}
      <Link href={`/matches/${match.id}`} className="group block">
        {/* ---- Шапка: турнир · формат · время/статус ---- */}
        <header className="mb-3 flex items-center justify-between text-[11px] text-muted">
          <div className="flex items-center gap-2 truncate">
            {match.event && (
              <span className="truncate font-medium group-hover:text-foreground">
                {match.event.name}
              </span>
            )}
            <span className="uppercase tracking-wide">{match.format}</span>
          </div>

          {isLive ? (
            <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
              <span className="live-dot inline-block h-2 w-2 rounded-full bg-foreground" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 tabular-nums">
              <Clock size={12} strokeWidth={1.5} />
              {formatWhen(match.scheduled_at, match.status)}
            </span>
          )}
        </header>

      {/* ---- Команды + счёт ---- */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamSide team={match.team1} won={t1won} align="left" />

        <div className="flex flex-col items-center px-1">
          {showScore ? (
            <p className={`rounded-lg border border-border-subtle px-2.5 py-1 text-lg font-semibold tabular-nums
                          ${isLive ? "bg-hover" : ""}`}>
              {match.score_team1}
              <span className="mx-1 text-muted font-normal">:</span>
              {match.score_team2}
            </p>
          ) : (
            <span className="text-xs font-medium text-muted">vs</span>
          )}
        </div>

        <TeamSide team={match.team2} won={t2won} align="right" />
      </div>

      {/* ---- Карты (для live/finished bo-series) ---- */}
      {showScore && match.map_stats && match.map_stats.length > 0 && (
        <footer className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border-subtle pt-3">
          <MapPin size={12} strokeWidth={1.5} className="text-muted" />
          {match.map_stats.map((m) => (
            <span key={m.id}
                  className="rounded-md border border-border-subtle px-2 py-0.5 text-[11px] tabular-nums
                             text-muted capitalize">
              {m.map_name} {m.score_team1}:{m.score_team2}
            </span>
          ))}
        </footer>
      )}
      </Link>
    </motion.article>
  );
}
