"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Браузерный клиент Supabase (анон-ключ публичный — это нормально, RLS защищает данные) */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
