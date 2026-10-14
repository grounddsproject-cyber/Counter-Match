"use client";

// ============================================================
// Хук подписки на Supabase Realtime.
// Любое изменение строк таблицы (UPDATE/INSERT от Edge Function-парсера)
// мгновенно приходит клиентам по WebSocket — без перезагрузки страницы.
// ============================================================
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeOptions {
  /** имя таблицы, например "matches" */
  table: string;
  /** фильтр по колонке: { status: "live" } — слушать только live-матчи */
  filter?: string;
  /** вызывается при любом изменении — обычно refetch() или setState */
  onChange: (payload: any) => void;
}

export function useRealtime({ table, filter, onChange }: UseRealtimeOptions) {
  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    const config: any = {
      event: "postgres_changes",
      schema: "public",
      table,
    };
    if (filter) config.filter = filter;

    channel = supabase
      .channel(`rt:${table}:${filter ?? "all"}`)
      .on("postgres_changes", config, (payload) => onChange(payload))
      .subscribe();

    // Cleanup при unmount — обязательно, иначе утечки сокетов
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, onChange]);
}
