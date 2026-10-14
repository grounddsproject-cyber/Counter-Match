// ============================================================
// Supabase Edge Function: sync-hltv
// Фоновый парсер HLTV. Вызывается по Cron (pg_cron / Supabase Jobs)
// или вручную из админ-терминала ("refresh matches").
//
// ВАЖНО: фронтенд НИКОГДА не ходит в HLTV напрямую — только
// эта функция (её IP можно ротировать/проксировать), пишет в БД,
// а Realtime сам разносит изменения клиентам.
//
// Деплой: supabase functions deploy sync-hltv --no-verify-jwt
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * ЗАГЛУШКА ПАРСЕРА.
 * В боевом варианте здесь будет fetch к прокси (ScrapingBee / ZenRows)
 * с последующим парсингом HTML HLTV либо вызов внутреннего API HLTV.
 * Возвращает "сырые" данные в формате, близком к нашим таблицам.
 */
async function scrapeHltvMatches(): Promise<any[]> {
  // Пример структуры, которую вернул бы реальный скрапер:
  return [
    {
      hltv_id: 9006,
      team1_hltv_id: 4,   // The MongolZ
      team2_hltv_id: 10,  // Aurora
      status: "scheduled",
      scheduled_at: new Date(Date.now() + 3600_000).toISOString(),
      format: "bo3",
      event_hltv_id: 1001,
    },
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const start = Date.now();

  try {
    // service_role обходит RLS — может писать куда угодно
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const raw = await scrapeHltvMatches();
    let synced = 0;

    for (const m of raw) {
      // Резолвим внутренние ID команд по hltv_id
      const [{ data: t1 }, { data: t2 }] = await Promise.all([
        supabase.from("teams").select("id").eq("hltv_id", m.team1_hltv_id).single(),
        supabase.from("teams").select("id").eq("hltv_id", m.team2_hltv_id).single(),
      ]);
      if (!t1 || !t2) continue;

      const { data: ev } = await supabase
        .from("events").select("id").eq("hltv_id", m.event_hltv_id).maybeSingle();

      // Upsert по hltv_id — идемпотентная синхронизация
      const { error } = await supabase.from("matches").upsert(
        {
          hltv_id: m.hltv_id,
          event_id: ev?.id ?? null,
          team1_id: t1.id,
          team2_id: t2.id,
          status: m.status,
          scheduled_at: m.scheduled_at,
          format: m.format,
          synced_at: new Date().toISOString(),
        },
        { onConflict: "hltv_id" },
      );
      if (!error) synced++;
    }

    // Пишем журнал для дашборда админа
    await supabase.from("scraper_logs").insert({
      job_name: "sync-matches",
      status: "ok",
      items_synced: synced,
      duration_ms: Date.now() - start,
      message: `Upserted ${synced} matches`,
    });

    return new Response(JSON.stringify({ ok: true, synced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    // Ошибку тоже логируем — админ увидит её в Control Center
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await supabase.from("scraper_logs").insert({
      job_name: "sync-matches",
      status: "error",
      duration_ms: Date.now() - start,
      message: String(err),
    });

    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
