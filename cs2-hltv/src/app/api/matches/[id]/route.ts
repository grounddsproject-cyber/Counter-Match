// ============================================================
// Route handler для Realtime-refetch страницы матча.
// Возвращает те же join-данные, что и SSR (см. app/matches/[id]/page.tsx).
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("matches")
    .select(`
      *,
      event:events(*),
      team1:teams!matches_team1_id_fkey(*),
      team2:teams!matches_team2_id_fkey(*),
      map_stats(
        *,
        player_map_stats(
          *,
          player:players(*)
        )
      )
    `)
    .eq("id", Number(id))
    .single();

  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Нормализация порядка — как на серверной странице
  data.map_stats = (data.map_stats ?? [])
    .sort((a: any, b: any) => a.map_order - b.map_order)
    .map((ms: any) => ({
      ...ms,
      player_map_stats: (ms.player_map_stats ?? []).sort(
        (a: any, b: any) => Number(b.rating) - Number(a.rating),
      ),
    }));

  return NextResponse.json(data);
}
