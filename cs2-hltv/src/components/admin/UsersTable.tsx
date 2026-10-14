"use client";

// ============================================================
// UsersTable — таблица пользователей в стиле macOS List.
// Действия (роль/бан) выполняются через Edge Function admin-tools,
// которая проверяет is_admin() на сервере. После мутации — refetch.
// ============================================================
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Ban, RotateCcw, User as UserIcon, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, ProfileRole } from "@/types";
import { fmtDateTime } from "@/lib/utils";

/** Вызов команды админ-панели из Edge Function `admin-tools` */
async function runAdminCommand(action: string, payload: Record<string, unknown>) {
  const supabase = createClient();
  const { error } = await supabase.functions.invoke("admin-tools", {
    body: { action, ...payload },
  });
  if (error) throw error;
}

function RoleBadge({ role }: { role: ProfileRole }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        role === "admin"
          ? "border border-border-subtle bg-hover"
          : "text-muted"
      }`}
    >
      {role === "admin" ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
      {role}
    </span>
  );
}

export function UsersTable({ initialUsers }: { initialUsers: Profile[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Локальный мгновенный фильтр (поиск без обращения к серверу)
  const users = initialUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  );

  async function act(userId: string, command: "ban" | "unban" | "set-role", role?: ProfileRole) {
    setBusyId(userId);
    try {
      if (command === "set-role") {
        await runAdminCommand("set-role", { user_id: userId, role });
      } else {
        await runAdminCommand(command, { user_id: userId });
      }
      startTransition(() => router.refresh());
    } catch (e) {
      alert(`Ошибка: ${e instanceof Error ? e.message : "не удалось выполнить действие"}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="glass overflow-hidden">
      {/* Поиск в стиле Spotlight-строки */}
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
        <Search className="h-4 w-4 text-muted" strokeWidth={1.5} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Фильтр по имени или email…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
        {pending && <span className="text-xs text-muted">обновление…</span>}
      </div>

      <ul className="divide-y divide-border-subtle">
        {users.map((u, i) => {
          const nextRole: ProfileRole = u.role === "admin" ? "user" : "admin";
          return (
            <motion.li
              key={u.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-hover"
            >
              {/* Аватар-инициалы (монохромная заглушка) */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-hover text-xs font-semibold uppercase">
                {u.username.slice(0, 2)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {u.username}
                  {u.is_banned && (
                    <span className="ml-2 rounded-full border border-border-subtle px-1.5 py-0.5 text-[10px] text-muted">
                      забанен
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted">
                  {u.email} · с {fmtDateTime(u.created_at ?? new Date().toISOString())}
                </p>
              </div>

              <RoleBadge role={u.role} />

              {/* Действия — тонкие иконки HIG-style */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => act(u.id, "set-role", nextRole)}
                  disabled={busyId === u.id}
                  title={`Сменить роль на ${nextRole}`}
                  className="icon-btn"
                >
                  <Shield className="h-4 w-4" strokeWidth={1.5} />
                </button>
                {u.is_banned ? (
                  <button
                    onClick={() => act(u.id, "unban")}
                    disabled={busyId === u.id}
                    title="Разбанить"
                    className="icon-btn"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                ) : (
                  <button
                    onClick={() => act(u.id, "ban")}
                    disabled={busyId === u.id}
                    title="Забанить"
                    className="icon-btn hover:text-red-500"
                  >
                    <Ban className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </motion.li>
          );
        })}
        {users.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-muted">Ничего не найдено</li>
        )}
      </ul>
    </div>
  );
}
