"use client";

// ============================================================
// SpotlightSearch — поиск пользователей в стиле macOS Spotlight.
// Открывается по Cmd/Ctrl+K (глобальный keydown), ищет по
// username/email мгновенно (илзи-фильтр на клиенте + ilike fallback),
// позволяет из результата: сменить роль или забанить/разбанить.
// Все мутации идут через RLS-политику "profiles: admin all".
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Shield, Ban, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export function SpotlightSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Дебаунс-поиск через Supabase (ilike — нечувствительный к регистру) */
  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .or(`username.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(8);
    setResults((data ?? []) as Profile[]);
  }, []);

  // Глобальный хоткей Cmd+K / Ctrl+K + Esc для закрытия
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Автофокус при открытии — как в настоящем Spotlight
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(""); setResults([]); }
  }, [open]);

  async function toggleRole(p: Profile) {
    const supabase = createClient();
    await supabase.from("profiles")
      .update({ role: p.role === "admin" ? "user" : "admin" })
      .eq("id", p.id);
    setResults((rs) => rs.map((r) =>
      r.id === p.id ? { ...r, role: r.role === "admin" ? "user" : "admin" } : r));
  }

  async function toggleBan(p: Profile) {
    const supabase = createClient();
    await supabase.from("profiles")
      .update({ is_banned: !p.is_banned })
      .eq("id", p.id);
    setResults((rs) => rs.map((r) =>
      r.id === p.id ? { ...r, is_banned: !r.is_banned } : r));
  }

  return (
    <>
      {/* Триггер — строка поиска как в шапке System Settings */}
      <button
        onClick={() => setOpen(true)}
        className="glass flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-muted
                   transition-colors hover:text-foreground md:w-64"
      >
        <Search size={14} strokeWidth={1.5} />
        Поиск пользователей…
        <kbd className="ml-auto rounded border border-border-subtle px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[18vh] backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: -8, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong mx-4 w-full max-w-lg overflow-hidden rounded-[14px]"
            >
              {/* Поле ввода */}
              <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
                <Search size={18} strokeWidth={1.5} className="text-muted" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
                  placeholder="Имя или email пользователя…"
                  className="w-full bg-transparent text-base outline-none placeholder:text-muted"
                />
              </div>

              {/* Результаты */}
              <ul className="max-h-72 overflow-y-auto py-2">
                {results.length === 0 && query && (
                  <li className="px-4 py-6 text-center text-sm text-muted">Ничего не найдено</li>
                )}
                {results.map((p) => (
                  <li key={p.id}
                      className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-hover">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                                     border border-border-subtle text-xs font-semibold uppercase">
                      {p.username.slice(0, 2)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {p.username}
                        {p.role === "admin" && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full border
                                           border-border-subtle px-1.5 py-0.5 text-[10px] text-muted">
                            <Shield size={9} strokeWidth={2} /> admin
                          </span>
                        )}
                        {p.is_banned && (
                          <span className="ml-2 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] text-background">
                            banned
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted">{p.email}</p>
                    </div>

                    {/* Действия — появляются на hover, как контекстные кнопки Spotlight */}
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => toggleRole(p)} title="Сменить роль"
                              className="rounded-md border border-border-subtle p-1.5 hover:bg-card-solid">
                        <CheckCircle2 size={13} strokeWidth={1.5} />
                      </button>
                      <button onClick={() => toggleBan(p)} title={p.is_banned ? "Разбанить" : "Забанить"}
                              className="rounded-md border border-border-subtle p-1.5 hover:bg-card-solid">
                        <Ban size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border-subtle px-4 py-2 text-[10px] text-muted">
                ⏎ выбрать · ⇧⇣ навигация · esc закрыть
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
