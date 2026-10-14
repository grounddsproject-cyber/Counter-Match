// ============================================================
// PlayersTable — клиентская таблица игроков с мгновенным поиском.
// Фильтрация идёт по уже загруженному SSR-массиву (200 строк),
// поэтому не требует round-trip к серверу — как Spotlight в macOS.
// ============================================================
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { PlayerWithTeam } from "@/types";
import { flag } from "@/lib/utils";

export function PlayersTable({ initialPlayers }: { initialPlayers: PlayerWithTeam[] }) {
  const [query, setQuery] = useState("");

  // Мемоизируем фильтрацию: поиск по нику, реальному имени или тегу команды
  const players = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialPlayers;
    return initialPlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.real_name ?? "").toLowerCase().includes(q) ||
        (p.team?.tag ?? "").toLowerCase().includes(q),
    );
  }, [query, initialPlayers]);

  return (
    <div className="space-y-4">
      {/* Поиск в стиле macOS: лупа внутри скруглённого glass-инпута */}
      <label className="glass flex items-center gap-2 rounded-full px-4 py-2.5
                       focus-within:ring-2 focus-within:ring-border-subtle transition-all">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск игрока или команды…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
        {query && (
          <button onClick={() => setQuery("")}
                  className="text-xs text-muted hover:text-foreground">Сброс</button>
        )}
      </label>

      <div className="glass overflow-hidden rounded-[14px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-[11px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 text-left font-medium">#</th>
              <th className="px-2 py-2.5 text-left font-medium">Игрок</th>
              <th className="px-2 py-2.5 text-left font-medium">Команда</th>
              <th className="px-2 py-2.5 text-right font-medium tabular-nums">Rating</th>
              <th className="px-2 py-2.5 text-right font-medium tabular-nums">ADR</th>
              <th className="px-2 py-2.5 text-right font-medium tabular-nums">KAST</th>
              <th className="px-4 py-2.5 text-right font-medium tabular-nums">HS%</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p.id}
                  className="border-b border-border-subtle/50 last:border-0
                             transition-colors hover:bg-hover">
                <td className="px-4 py-3 tabular-nums text-muted">{i + 1}</td>
                <td className="px-2 py-3">
                  <Link href={`/players/${p.id}`} className="group flex items-center gap-3">
                    {/* Аватар: фото игрока (цветное) или инициалы */}
                    {p.photo_url ? (
                      <img src={p.photo_url} alt=""
                           className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full
                                       border border-border-subtle bg-hover text-[10px] font-bold">
                        {p.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span>
                      <span className="font-medium group-hover:underline">{p.name}</span>
                      <span className="ml-1.5">{flag(p.country_code)}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-2 py-3">
                  {p.team ? (
                    <Link href={`/teams/${p.team.id}`}
                          className="text-xs font-semibold text-muted hover:text-foreground">
                      {p.team.tag ?? p.team.name}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted">FA</span>
                  )}
                </td>
                <td className="px-2 py-3 text-right font-semibold tabular-nums">
                  {Number(p.rating_hltv).toFixed(2)}
                </td>
                <td className="px-2 py-3 text-right tabular-nums">{Number(p.adr).toFixed(1)}</td>
                <td className="px-2 py-3 text-right tabular-nums text-muted">{Number(p.kast).toFixed(1)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted">{Number(p.hs_percent).toFixed(1)}</td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Ничего не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
