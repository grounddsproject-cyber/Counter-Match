// ============================================================

// Блокирующий рендер на каждый запрос: персональные данные (cookies) + live-статистика.
export const instant = false
// Список команд — grid карточек в стиле macOS. Server Component.
// ============================================================
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Team } from "@/types";


async function getTeams(): Promise<Team[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("is_active", true)
    .order("ranking", { ascending: true });

  if (error) return [];
  return data as Team[];
}

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Команды</h1>
        <p className="mt-1 text-sm text-muted">{teams.length} активных коллективов</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t, i) => (
          <Link
            key={t.id}
            href={`/teams/${t.id}`}
            style={{ animationDelay: `${i * 25}ms` }}
            className="glass animate-fade-up flex items-center gap-4 rounded-[14px] p-4
                       transition-transform hover:-translate-y-0.5"
          >
            {t.logo_url ? (
              <img src={t.logo_url} alt="" className="h-12 w-12 object-contain" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full
                               border border-border-subtle bg-hover text-xs font-bold">
                {t.tag ?? "?"}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{t.name}</p>
              <p className="text-xs text-muted">
                #{t.ranking} в мире · {(t.country_code ?? "").toUpperCase()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
