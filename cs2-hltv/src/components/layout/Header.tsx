"use client";

// ============================================================
// Header — плавающая glass-панель в стиле macOS Sequoia.
// sticky + backdrop-blur, навигация тонкими текстовыми ссылками,
// справа — ThemeToggle и вход/аккаунт.
// ============================================================
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV = [
  { href: "/", label: "Матчи" },
  { href: "/teams", label: "Команды" },
  { href: "/players", label: "Игроки" },
  { href: "/ranking", label: "Рейтинг" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-3 z-40 px-3">
      <div className="glass mx-auto flex max-w-5xl items-center justify-between rounded-full px-5 py-2.5">
        {/* Лого — единственное «цветное» исключение допустимо, но держим монохром */}
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-background">
            C²
          </span>
          CS2<span className="text-muted font-normal">Stats</span>
        </Link>

        {/* Навигация */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors
                  ${active
                    ? "bg-hover font-medium text-foreground"
                    : "text-muted hover:text-foreground"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden items-center gap-1.5 rounded-full border border-border-subtle px-3.5 py-1.5
                       text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-foreground sm:flex"
          >
            <LogIn size={14} strokeWidth={1.5} />
            Войти
          </Link>
        </div>
      </div>
    </header>
  );
}
