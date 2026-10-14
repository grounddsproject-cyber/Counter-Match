"use client";

// ============================================================
// MatchesFeed — клиентская лента матчей поверх SSR-данных.
// При любом postgres_changes (парсер обновил счёт/статус) —
// делаем refetch и карточки перерисовываются без перезагрузки.
// ============================================================
import { useCallback, useState } from "react";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { MatchCard } from "./MatchCard";
import type { MatchWithRelations } from "@/types";

const SELECT = `
  id, status, scheduled_at, format, score_team1, score_team2, winner_team_id,
  event:events ( id, name, prize_pool, tier ),
  team1:teams!matches_team1_id_fkey ( id, name, tag, country_code, logo_url, ranking ),
  team2:teams!matches_team2_id_fkey ( id, name, tag, country_code, logo_url, ranking ),
  map_stats ( id, map_name, map_order, score_team1, score_team2, winner_team_id )
`;

type Tab = "all" | "live" | "upcoming" | "finished";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "live", label: "Live" },
  { id: "upcoming", label: "Расписание" },
  { id: "finished", label: "Результаты" },
];

export function MatchesFeed({ initialMatches }: { initialMatches: MatchWithRelations[] }) {
  const [matches, setMatches] = useState(initialMatches);
  const [tab, setTab] = useState<Tab>("all");
  const [flash, setFlash] = useState(false);

  /** Пере-запросить ленту (вызывается по Realtime-событию) */
  const refetch = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("matches")
      .select(SELECT)
      .order("scheduled_at", { ascending: false })
      .limit(30);
    if (data) {
      setMatches(data as unknown as MatchWithRelations[]);
      // Мягкая индикация «обновлено live»
      setFlash(true);
      setTimeout(() => setFlash(false), 1200);
    }
  }, []);

  // Подписка на таблицу matches — ядро системы реального времени
  useRealtime({ table: "matches", onChange: refetch });

  // Фильтрация по вкладке
  const visible = matches.filter((m) => {
    if (tab === "all") return true;
    if (tab === "upcoming") return m.status === "scheduled";
    return m.status === tab;
  });

  return (
    <div className="space-y-4">
      {/* Сегментированный контрол в стиле macOS */}
      <div className="flex items-center justify-between">
        <div className="glass flex gap-0.5 rounded-full p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors
                ${tab === id ? "bg-hover text-foreground border border-border-subtle" : "text-muted hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <span
          className={`flex items-center gap-1.5 text-[11px] text-muted transition-opacity duration-500
                     ${flash ? "opacity-100" : "opacity-40"}`}
        >
          <RefreshCw size={11} strokeWidth={1.5} className={flash ? "animate-spin" : ""} />
          Realtime
        </span>
      </div>

      {/* Лента */}
      {visible.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-sm text-muted">
          Матчей пока нет — парсер синхронизирует данные с HLTV каждые 5 минут
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
