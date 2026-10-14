// ============================================================
// Zustand store: тема (Light / Dark / System) + persist в localStorage
// ============================================================
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

/** Применяет класс .dark к <html>; для system слушает media query */
export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");

  const update = () => {
    const dark = mode === "dark" || (mode === "system" && mq.matches);
    root.classList.toggle("dark", dark);
  };

  mq.removeEventListener("change", update);
  if (mode === "system") mq.addEventListener("change", update);
  update();
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => {
        set({ mode });
        applyTheme(mode);
      },
    }),
    { name: "cs2-theme" },
  ),
);
