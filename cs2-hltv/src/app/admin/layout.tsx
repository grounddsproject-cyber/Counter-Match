// ============================================================
// Layout админ-панели "System Preferences / Control Center".
// Боковое меню с иконками слева (как System Settings), контент справа.
// Доступ защищён в src/middleware.ts: пускает только role=admin.
// ============================================================
import Link from "next/link";
import { LayoutDashboard, Users, TerminalSquare, ArrowLeft } from "lucide-react";
import { SpotlightSearch } from "@/components/admin/SpotlightSearch";

const MENU = [
  { href: "/admin", icon: LayoutDashboard, label: "Обзор" },
  { href: "/admin/users", icon: Users, label: "Пользователи" },
  { href: "/admin/terminal", icon: TerminalSquare, label: "Терминал" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass mt-4 flex min-h-[70vh] gap-2 rounded-[18px] p-2">
      {/* ---- Боковая панель (sidebar) ---- */}
      <aside className="w-52 shrink-0 border-r border-border-subtle p-3">
        <p className="px-2 pb-3 pt-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Control Center
        </p>

        <nav className="space-y-0.5">
          {MENU.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-sm
                         text-muted transition-colors hover:bg-hover hover:text-foreground"
            >
              <Icon size={15} strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="mt-6 flex items-center gap-2 rounded-[9px] px-2.5 py-2 text-xs text-muted
                     transition-colors hover:bg-hover hover:text-foreground"
        >
          <ArrowLeft size={13} strokeWidth={1.5} /> На сайт
        </Link>
      </aside>

      {/* ---- Контент ---- */}
      <div className="min-w-0 flex-1 p-4">
        {/* Глобальный Spotlight доступен на всех вкладках (⌘K) */}
        <div className="mb-5 flex justify-end">
          <SpotlightSearch />
        </div>
        {children}
      </div>
    </div>
  );
}
