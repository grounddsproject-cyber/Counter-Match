// ============================================================
// Общие утилиты (без зависимостей от react — можно использовать
// и на сервере, и на клиенте).
// ============================================================

/** Флаг страны из ISO-кода ("ua" -> 🇺🇦). Единственный «цветной» элемент — emoji. */
export function flag(code?: string | null): string {
  if (!code || code.length !== 2) return "";
  const base = 0x1f1e6;
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...upper.split("").map((c) => base + c.charCodeAt(0) - 65),
  );
}

/** "bo3" -> "BO3" */
export function fmtFormat(f?: string | null): string {
  return f ? f.toUpperCase() : "";
}

/** Компактная дата/время по-русски: "5 окт, 18:00" */
export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Только дата: "5 октября" */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

/** Статус матча -> человекочитаемая метка (монохром, без цвета) */
export const STATUS_LABEL: Record<string, string> = {
  scheduled: "Расписание",
  live: "LIVE",
  finished: "Завершён",
  canceled: "Отменён",
};
