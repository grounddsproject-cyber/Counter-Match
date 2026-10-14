// ============================================================
// Supabase Edge Function: admin-tools
// Бэкенд для терминала и Spotlight в админ-панели.
// Принимает JWT пользователя, проверяет роль admin через SQL
// функцию is_admin(), затем исполняет команду.
//
// Команды терминала:
//   refresh matches | refresh teams | clear cache | stats | ban <email> | unban <email>
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  // --- Проверка: залогинен и является админом ---
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return json({ error: "Forbidden: not an admin" }, 403);

  const body = await req.json();
  // Два режима вызова:
  // 1) Терминал: { command: "stats" | "refresh matches" | "ban x@y.z" ... }
  // 2) UI-кнопки (Spotlight/UsersTable): { action: "set_role"|"ban", user_id, role }
  if (body.action) {
    return await runAction(supabase, user, body);
  }

  const [verb, ...args] = String(body.command ?? "").trim().split(/\s+/);

  let output = "";

  switch (verb) {
    case "refresh": {
      // Принудительный запуск синхронизации через internal fetch
      const target = args[0] ?? "matches";
      const res = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-hltv`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
        },
      );
      output = `sync-${target}: ${JSON.stringify(await res.json())}`;
      break;
    }

    case "clear": {
      // Удаляем устаревшие строки журнала (пример массово операции)
      const { count } = await supabase
        .from("scraper_logs")
        .delete({ count: "exact" })
        .lt("created_at", new Date(Date.now() - 7 * 864e5).toISOString());
      output = `Cleared ${count ?? 0} old scraper logs (>7 days)`;
      break;
    }

    case "stats": {
      const [{ count: matches }, { count: teams }, { count: players }, { count: users }] =
        await Promise.all([
          supabase.from("matches").select("*", { count: "exact", head: true }),
          supabase.from("teams").select("*", { count: "exact", head: true }),
          supabase.from("players").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
        ]);
      output = `matches=${matches} teams=${teams} players=${players} users=${users}`;
      break;
    }

    case "ban":
    case "unban": {
      const email = args[0];
      if (!email) { output = "usage: ban <email>"; break; }
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: verb === "ban" })
        .eq("email", email);
      output = error ? `ERROR: ${error.message}` : `${email} ${verb === "ban" ? "banned" : "unbanned"}`;
      break;
    }

    default:
      output = `Unknown command: '${verb}'. Try: refresh | clear | stats | ban | unban`;
  }

  // Логируем действие админа в историю
  await supabase.from("scraper_logs").insert({
    job_name: `admin:${verb}`,
    status: "ok",
    message: `${user.email} ran "${verb}"`,
  });

  return json({ output });

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================
// UI-действия (Spotlight / UsersTable): смена роли, бан/анбан по user_id.
// Все проверки are_admin уже пройдены в основном обработчике.
// ============================================================
async function runAction(supabase: any, admin: any, body: any) {
  const corsH = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };
  const reply = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: corsH });

  switch (body.action) {
    case "set_role": {
      if (!body.user_id || !["user", "admin"].includes(body.role))
        return reply({ error: "usage: set_role {user_id, role}" }, 400);
      // Защита: нельзя понизить последнего админа
      const { data: admins } = await supabase
        .from("profiles").select("id").eq("role", "admin");
      if (body.role === "user" && (admins?.length ?? 0) <= 1)
        return reply({ error: "Cannot demote the last admin" }, 400);

      const { error } = await supabase
        .from("profiles").update({ role: body.role }).eq("id", body.user_id);
      return error ? reply({ error: error.message }, 500) : reply({ ok: true });
    }

    case "ban":
    case "unban": {
      if (!body.user_id) return reply({ error: "usage: ban {user_id}" }, 400);
      if (body.user_id === admin.id)
        return reply({ error: "Cannot ban yourself" }, 400);
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: body.action === "ban" })
        .eq("id", body.user_id);
      return error ? reply({ error: error.message }, 500) : reply({ ok: true });
    }

    default:
      return reply({ error: `Unknown action: ${body.action}` }, 400);
  }
}
