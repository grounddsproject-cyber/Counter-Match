"use client";

// ============================================================
// ThemeBootstrap — маленький клиентский компонент, который при
// монтировании читает тему из Zustand-persist и вешает класс
// .dark на <html>. Без него SSR отдаёт light и виден flash.
// ============================================================
import { useEffect } from "react";
import { useThemeStore, applyTheme } from "@/store/theme";

export function ThemeBootstrap() {
  useEffect(() => {
    // hydrate persist-стор, затем применить
    void useThemeStore.persist.rehydrate();
    applyTheme(useThemeStore.getState().mode);
  }, []);

  return null;
}
