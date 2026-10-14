// ============================================================
// Хук данных матча с подпиской на Realtime.
// Парсер (Edge Function) пишет в matches/map_stats/player_map_stats —
// postgres_changes долетает сюда по WebSocket, и мы рефетчим страницу
// через серверный route handler (нужны join-данные: команды, карты, статы).
// Небольшая debounce-задержка группирует частые live-обновления.
// ============================================================
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import type { MatchFull } from "@/types";

export function useMatchData(initial: MatchFull): MatchFull {
  const [match, setMatch] = useState<MatchFull>(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Первичное состояние всегда из SSR; синхронизируем при смене id
  useEffect(() => setMatch(initial), [initial.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${initial.id}`);
      if (!res.ok) return;
      const data = (await res.json()) as MatchFull;
      setMatch(data);
    } catch {
      /* сеть моргнула — следующее событие Realtime повторит попытку */
    }
  }, [initial.id]);

  /** Debounce: live-матч может обновляться каждые несколько секунд */
  const scheduleRefetch = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(refetch, 800);
  }, [refetch]);

  useRealtime({ table: "matches", filter: `id=eq.${initial.id}`, onChange: scheduleRefetch });
  useRealtime({ table: "map_stats", filter: `match_id=eq.${initial.id}`, onChange: scheduleRefetch });
  useRealtime({ table: "player_map_stats", onChange: scheduleRefetch });

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return match;
}
