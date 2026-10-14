// ============================================================

// Блокирующий рендер на каждый запрос: персональные данные (cookies) + live-статистика.
export const instant = false
// Профиль пользователя — /profile
// Server Component: аккаунт + избранное (команды/игроки).
// Выход через action-роут (серверный signOut, очистка cookie).
// ============================================================
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, ShieldCheck, Users, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Player, Team } from "@/types";


async function getData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: follows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    // RLS отдаёт только строки текущего пользователя
    supabase
      .from("follows")
      .select("target, team:teams(*), player:players(*, team:teams(id, name, tag))")
      .order("created_at", { ascending: false }),
  ]);

  return { profile: profile as any, follows: follows ?? [] };
}

/** Компактная карточка отслеживаемой команды */
function FollowedTeamCard({ team }: { team: Team }) {
  return (
    <Link href={`/teams/${team.id}`}
          className="glass flex items-center gap-3 rounded-[14px] p-3
                     transition-transform hover:-translate-y-0.5">
      {team.logo_url ? (
        <img src={team.logo_url} alt="" className="h-9 w-9 object-contain" />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full
                         border border-border-subtle bg-hover text-[10px] font-bold">
          {team.tag?.slice(0, 3)}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{team.name}</p>
        <p className="text-xs text-muted">#{team.ranking} в мире</p>
      </div>
    </Link>
  );
}

/** Компактная карточка отслеживаемого игрока */
function FollowedPlayerCard({ player }: { player: Player & { team?: Pick<Team, "id" | "name" | "tag"> | null } }) {
  return (
    <Link href={`/players/${player.id}`}
          className="glass flex items-center gap-3 rounded-[14px] p-3
                     transition-transform hover:-translate-y-0.5">
      {player.photo_url ? (
        <img src={player.photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full
                         border border-border-subtle bg-hover text-[10px] font-bold">
          {player.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{player.name}</p>
        <p className="text-xs text-muted">{player.team?.tag ?? "FA"} · {Number(player.rating_hltv).toFixed(2)}</p>
      </div>
    </Link>
  );
}

export default async function ProfilePage() {
  const { profile, follows } = await getData();

  const teams = follows.filter((f: any) => f.target === "team" && f.team).map((f: any) => f.team);
  const players = follows.filter((f: any) => f.target === "player" && f.player).map((f: any) => f.player);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ---------- Аккаунт ---------- */}
      <section className="glass-strong flex items-center gap-5 rounded-[18px] p-6 shadow-lg">
        <div className="flex h-16 w-16 items-center justify-center rounded-full
                        border border-border-subtle bg-hover">
          <UserRound className="h-7 w-7 text-muted" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            {profile.username}
            {profile.role === "admin" && (
              <span className="inline-flex items-center gap-1 rounded-full border
                               border-border-subtle px-2 py-0.5 text-[11px] font-medium">
                <ShieldCheck className="h-3 w-3" /> admin
              </span>
            )}
          </h1>
          <p className="mt-0.5 truncate text-sm text-muted">{profile.email}</p>
        </div>
        <div className="flex flex-col gap-2">
          {profile.role === "admin" && (
            <Link href="/admin"
                  className="glass inline-flex items-center gap-2 rounded-full px-4 py-2
                             text-sm transition-colors hover:bg-hover">
              Control Center
            </Link>
          )}
          <form action="/auth/logout" method="post">
            <button type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full
                               border border-border-subtle px-4 py-2 text-sm text-muted
                               transition-colors hover:bg-hover hover:text-foreground">
              <LogOut className="h-4 w-4" /> Выйти
            </button>
          </form>
        </div>
      </section>

      {/* ---------- Избранные команды ---------- */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
          <Users className="h-4 w-4" /> Команды ({teams.length})
        </h2>
        {teams.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {teams.map((t: Team) => <FollowedTeamCard key={t.id} team={t} />)}
          </div>
        ) : (
          <p className="glass rounded-[14px] p-6 text-center text-sm text-muted">
            Отслеживайте команды — и их матчи будут всегда под рукой.
          </p>
        )}
      </section>

      {/* ---------- Избранные игроки ---------- */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
          <UserRound className="h-4 w-4" /> Игроки ({players.length})
        </h2>
        {players.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {players.map((p: any) => <FollowedPlayerCard key={p.id} player={p} />)}
          </div>
        ) : (
          <p className="glass rounded-[14px] p-6 text-center text-sm text-muted">
            Пока никого. Нажмите «Отслеживать» на странице игрока.
          </p>
        )}
      </section>
    </div>
  );
}
