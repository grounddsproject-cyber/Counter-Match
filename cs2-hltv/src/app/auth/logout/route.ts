import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /auth/logout — серверный выход: очищаем сессию Supabase
// (cookie удаляются на стороне клиента-библиотеки) и редиректим на главную.
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Возвращаем редирект с no-store, чтобы браузер не кэшировал «залогиненный» HTML.
  return NextResponse.redirect(new URL("/", request.url), {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
