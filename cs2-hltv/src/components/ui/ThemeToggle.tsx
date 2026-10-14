"use client";

// ============================================================
// ThemeToggle — сегментированный контрол в стиле macOS
// (System / Light / Dark) с glassmorphism и анимацией "пилюли"
// через Framer Motion layoutId.
// ============================================================
import { motion } from "framer-motion";
import { Monitor, Sun, Moon } from "lucide-react";
import { useThemeStore, type ThemeMode } from "@/store/theme";

const OPTIONS: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
  { mode: "system", icon: <Monitor size={13} strokeWidth={1.5} />, label: "Auto" },
  { mode: "light",  icon: <Sun    size={13} strokeWidth={1.5} />, label: "Light" },
  { mode: "dark",   icon: <Moon   size={13} strokeWidth={1.5} />, label: "Dark" },
];

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <div className="glass flex items-center gap-0.5 rounded-full p-1">
      {OPTIONS.map(({ mode: m, icon, label }) => {
        const active = m === mode;
        return (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-label={`Переключить тему: ${label}`}
            className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors
              ${active ? "text-foreground" : "text-muted hover:text-foreground"}`}
          >
            {/* Активный фон — "пилюля", плавно переезжает между кнопками */}
            {active && (
              <motion.span
                layoutId="theme-pill"
                className="absolute inset-0 rounded-full bg-hover border border-border-subtle"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{icon}</span>
            <span className="relative z-10 hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
