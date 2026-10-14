"use client";

// ============================================================
// DisclaimerModal — юридическое окно при ПЕРВОМ входе.
// Факт показа запоминаем в localStorage (ключ cs2-disclaimer-ok),
// чтобы не бесить постоянных пользователей.
// ============================================================
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

const STORAGE_KEY = "cs2-disclaimer-ok";

export const DISCLAIMER_TEXT =
  "Данные о матчах, командах и игроках предоставлены HLTV.org. Этот сайт не является официальным представителем HLTV и используется исключительно в образовательных/статистических целях. Все права на оригинальные данные принадлежат их владельцам.";

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Проверяем localStorage только на клиенте (SSR-safe)
    if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          {/* Окно — как системный диалог macOS: glass, радиус 14px, по центру */}
          <motion.div
            initial={{ scale: 0.94, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            role="dialog"
            aria-modal="true"
            className="glass-strong w-full max-w-md rounded-[14px] p-6 text-center"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border-subtle bg-hover">
              <ShieldAlert size={22} strokeWidth={1.5} />
            </div>

            <h2 className="mb-2 text-lg font-semibold tracking-tight">
              Дисклеймер · Disclaimer
            </h2>

            <p className="mb-6 text-sm leading-relaxed text-muted">
              {DISCLAIMER_TEXT}
            </p>

            <button
              onClick={accept}
              className="w-full rounded-[10px] bg-foreground py-2.5 text-sm font-medium text-background
                         transition-transform active:scale-[0.98] hover:opacity-90"
            >
              Мне исполнено 18 и я принимаю
            </button>

            <p className="mt-3 text-[11px] text-muted">
              Сайт не связан с betting-сервисами. Ставки не принимаются.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
