"use client";

// ============================================================
// AdminTerminal — встроенная консоль в стиле macOS Terminal.
// Каждая команда уходит в Edge Function admin-tools (там
// повторно проверяется роль админа — это главный gate, UI не доверяем).
// Поддержка: история по ↑/↓, автодополнение по Tab, "help".
// ============================================================
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Line { kind: "input" | "out" | "err"; text: string; time?: string }

const COMMANDS = ["refresh", "clear", "stats", "ban", "unban", "help", "whoami"];

export function AdminTerminal() {
  const [lines, setLines] = useState<Line[]>([
    { kind: "out", text: "CS2Stats Console — введите 'help' для списка команд." },
  ]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Автоскролл вниз при новых строках
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  /** Вызов Edge Function admin-tools с JWT текущего пользователя */
  async function runCommand(cmd: string) {
    const time = new Date().toLocaleTimeString("ru-RU", { hour12: false });
    setLines((ls) => [...ls, { kind: "input", text: cmd, time }]);

    if (cmd === "help") {
      setLines((ls) => [...ls, { kind: "out", text:
        "Доступно:\n  refresh matches|teams   — принудительный запуск парсера HLTV\n  clear cache           — очистка старых логов синхронизации\n  stats                 — счётчики таблиц БД\n  ban <email> / unban <email>\n  whoami                — текущая сессия\n  history               — последние команды" }]);
      return;
    }
    if (cmd === "whoami") {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setLines((ls) => [...ls, { kind: "out", text: user?.email ?? "не авторизован" }]);
      return;
    }
    if (cmd === "history") {
      setLines((ls) => [...ls, { kind: "out", text: history.join("\n") || "— пусто —" }]);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("admin-tools", {
        body: { command: cmd },
      });
      if (error) throw error;
      setLines((ls) => [...ls, { kind: data?.error ? "err" : "out", text: data?.output ?? data?.error ?? "ok" }]);
    } catch (e: any) {
      setLines((ls) => [...ls, { kind: "err", text: `✗ ${e.message ?? e}` }]);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cmd = value.trim();
    if (!cmd) return;
    setHistory((h) => [...h, cmd]);
    setHistIdx(-1);
    setValue("");
    runCommand(cmd);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    // История: ↑/↓ как в zsh
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const i = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(i); setValue(history[i] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < 0) return;
      const i = histIdx + 1;
      if (i >= history.length) { setHistIdx(-1); setValue(""); }
      else { setHistIdx(i); setValue(history[i]); }
    } else if (e.key === "Tab") {
      // Автодополнение первой подходящей команды
      e.preventDefault();
      const hit = COMMANDS.find((c) => c.startsWith(value));
      if (hit) setValue(hit + " ");
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="flex h-[420px] cursor-text flex-col overflow-hidden rounded-[14px]
                 border border-border-subtle bg-card-solid font-mono text-[13px] shadow-lg"
    >
      {/* ---- Title bar как у окна Terminal.app ---- */}
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
        <span className="h-3 w-3 rounded-full border border-border-subtle bg-hover" />
        <span className="h-3 w-3 rounded-full border border-border-subtle bg-hover" />
        <span className="h-3 w-3 rounded-full border border-border-subtle bg-hover" />
        <span className="ml-2 text-xs text-muted">admin@cs2stats — console</span>
      </div>

      {/* ---- Лента вывода ---- */}
      <div className="flex-1 space-y-1 overflow-y-auto p-4 leading-relaxed">
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {l.kind === "input" ? (
              <>
                <span className="text-muted">{l.time} ❯ </span>
                <span className="font-semibold">{l.text}</span>
              </>
            ) : l.kind === "err" ? (
              <span className="opacity-70 underline decoration-dotted">{l.text}</span>
            ) : (
              <span>{l.text}</span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ---- Строка ввода ---- */}
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border-subtle px-4 py-3">
        <span className="text-muted">❯</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          placeholder="refresh matches"
          className="flex-1 bg-transparent outline-none placeholder:text-muted/60"
        />
      </form>
    </div>
  );
}
