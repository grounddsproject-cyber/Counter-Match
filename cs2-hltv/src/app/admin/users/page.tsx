// ============================================================

// Блокирующий рендер на каждый запрос: персональные данные (cookies) + live-статистика.
export const instant = false
// Админ: список пользователей с быстрыми действиями (роль/бан).
// Server Component для списка + клиентские кнопки через API-роут.
// ============================================================
import { createClient } from "@/lib/supabase/server";
import { UsersTable } from "@/components/admin/UsersTable";
import type { Profile } from "@/types";


async function getUsers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return [];
  return data as Profile[];
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Пользователи</h2>
        <p className="mt-1 text-sm text-muted">{users.length} аккаунтов · ⌘K — быстрый поиск</p>
      </div>

      <UsersTable initialUsers={users} />
    </div>
  );
}
