"use client";

// ============================================================
// ClientYear — год в футере вычисляется на клиенте после mount
// (useEffect), чтобы не нарушать правила prerender-стабильности
// Next.js Cache Components (new Date() — "unstable value").
// ============================================================
import { useEffect, useState } from "react";

export function ClientYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  // До гидрации рендерим пустую строку фиксированной ширины — без jump layout.
  return <span>{year ?? "\u2013\u2013\u2013\u2013"}</span>;
}
