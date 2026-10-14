// ============================================================
// Supabase SSR-клиенты (@supabase/ssr)
// - server.ts  : для Server Components / Server Actions / Route Handlers
// - client.ts  : для Client Components (автоматически синхронизирует сессию)
// - middleware.ts: обновляет токены и защищает /admin
// Ключи только из env — никогда не хардкодим.
// ============================================================
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          // В Server Components куки read-only — молча игнорируем
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
}
