"use client";

// ============================================================
// Терминал — отдельная вкладка Control Center.
// ============================================================
import { AdminTerminal } from "@/components/admin/AdminTerminal";

export default function TerminalPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Терминал</h2>
        <p className="mt-1 text-sm text-muted">
          Системные команды: парсинг HLTV, очистка кэша, массовые операции
        </p>
      </div>
      <AdminTerminal />
    </div>
  );
}
