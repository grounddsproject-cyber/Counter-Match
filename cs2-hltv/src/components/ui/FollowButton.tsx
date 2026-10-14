// ============================================================
// FollowButton — кнопка «Отслеживать» в стиле macOS.
// Работает только с авторизованными пользователями (RLS: own insert/delete).
// Состояние синхронизируется с таблицей follows; оптимистичный UI.
// ============================================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { FollowTarget } from "@/types";

interface Props {
  target: FollowTarget;        // "team" | "player"
  targetId: number;            // id команды/игрока
  initialFollowing: boolean;   // из SSR (для залогиненных)
  isAuthed: boolean;           // если нет — ссылка на /login
}

export function FollowButton({ target, targetId, initialFollowing, isAuthed }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  if (!isAuthed) {
    return (
      <Link
        href="/login"
        className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm
                   text-muted transition-colors hover:text-foreground"
      >
        <Star className="h-4 w-4" /> Отслеживать
      </Link>
    );
  }

  async function toggle() {
    setBusy(true);
    const supabase = createClient();
    const next = !following;
    setFollowing(next); // оптимистично

    try {
      if (next) {
        const { error } = await supabase.from("follows").insert({
          user_id: (await supabase.auth.getUser()).data.user!.id,
          target,
          [`${target}_id`]: targetId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("target", target)
          .eq(`${target}_id`, targetId);
        if (error) throw error;
      }
      router.refresh(); // обновим серверные счётчики, если понадобятся
    } catch {
      setFollowing(!next); // откат при ошибке
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all
                  border border-border-subtle ${
                    following
                      ? "bg-foreground text-background font-medium"          // инверсия — «включено» как в macOS
                      : "glass hover:bg-hover"
                  } disabled:opacity-50`}
    >
      <Star className={`h-4 w-4 ${following ? "fill-current" : ""}`} />
      {following ? "Отслеживается" : "Отслеживать"}
    </button>
  );
}
