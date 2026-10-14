import { DISCLAIMER_TEXT } from "./DisclaimerModal";
import { ClientYear } from "./ClientYear";

// ============================================================
// Footer — минималистичный, с обязательным дисклеймером.
// Никаких новостей/форумов/беттинга — только юр. текст и навигация.
// Год рендерится на клиенте (ClientYear): при prerender-сборке
// new Date() считается "unstable value" в Next.js Cache Components.
// ============================================================
export function Footer() {
  return (
    <footer className="mt-16 border-t border-border-subtle px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
        <p className="max-w-2xl text-[11px] leading-relaxed text-muted">
          {DISCLAIMER_TEXT}
        </p>
        <p className="text-[11px] text-muted">
          © <ClientYear /> CS2Stats · Образовательный проект · Не является официальным сайтом HLTV
        </p>
      </div>
    </footer>
  );
}
