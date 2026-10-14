"use client";

// ============================================================
// AuthForm — вход и регистрация через Supabase Auth.
// Email/Password + OAuth (Google/GitHub). Стили macOS:
// glass-карточка, крупные скруглённые поля, тонкие разделители.
// ============================================================
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Mail } from "lucide-react";

type Mode = "login" | "register";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const supabase = createClient();

  /** Email-пароль flow */
  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push("/"), router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setInfo("Проверьте почту для подтверждения адреса");
    }
    setBusy(false);
  }

  /** OAuth flow — редирект провайдера, возврат на /auth/callback */
  async function oauth(provider: "google" | "github") {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setBusy(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass mx-auto mt-16 w-full max-w-sm rounded-[14px] p-6"
    >
      {/* Переключатель режимов как сегменты в System Settings */}
      <div className="mb-5 flex rounded-full border border-border-subtle p-0.5 text-sm">
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); setInfo(null); }}
            className={`flex-1 rounded-full py-1.5 font-medium transition-colors
              ${mode === m ? "bg-hover text-foreground" : "text-muted"}`}
          >
            {m === "login" ? "Вход" : "Регистрация"}
          </button>
        ))}
      </div>

      <form onSubmit={submitEmail} className="space-y-3">
        <input
          type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-[10px] border border-border-subtle bg-card-solid/60 px-3.5 py-2.5
                     text-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
        />
        <input
          type="password" required minLength={6} placeholder="Пароль (мин. 6 символов)" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-[10px] border border-border-subtle bg-card-solid/60 px-3.5 py-2.5
                     text-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
        />

        {error && <p className="text-xs text-foreground/80 underline decoration-dotted">{error}</p>}
        {info && <p className="text-xs text-muted">{info}</p>}

        <button
          type="submit" disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-foreground
                     py-2.5 text-sm font-medium text-background transition-transform
                     active:scale-[0.98] disabled:opacity-50"
        >
          <Mail size={14} strokeWidth={1.5} />
          {mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>
      </form>

      {/* Разделитель "или" */}
      <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-border-subtle" /> или <span className="h-px flex-1 bg-border-subtle" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => oauth("google")} disabled={busy}
                className="flex items-center justify-center gap-2 rounded-[10px] border border-border-subtle
                           py-2 text-sm font-medium transition-colors hover:bg-hover disabled:opacity-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3.6c1.7 0 3.1.6 4.2 1.7l-2 1.9A3.6 3.6 0 0 0 12 8.4c-2 0-3.6 1.3-4.2 3.1l-2.1-1.6A6.3 6.3 0 0 1 12 5.6z"/></svg>
          Google
        </button>
        <button onClick={() => oauth("github")} disabled={busy}
                className="flex items-center justify-center gap-2 rounded-[10px] border border-border-subtle
                           py-2 text-sm font-medium transition-colors hover:bg-hover disabled:opacity-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3z"/></svg> GitHub
        </button>
      </div>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-muted">
        Продолжая, вы принимаете{" "}
        <Link href="/terms" className="underline decoration-dotted">условия использования</Link>
        {" "}и дисклеймер о происхождении данных (HLTV.org).
      </p>
    </motion.div>
  );
}
