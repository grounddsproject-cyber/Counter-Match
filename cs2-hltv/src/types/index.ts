// ============================================================
// Типы, зеркаляющие схему БД (supabase/migrations/0001_schema.sql)
// ============================================================

export type MatchStatus = "scheduled" | "live" | "finished" | "canceled";
export type FollowTarget = "team" | "player";
export type ProfileRole = "user" | "admin";

export interface Team {
  id: number;
  hltv_id: number | null;
  name: string;
  tag: string | null;
  country_code: string | null;
  logo_url: string | null;
  ranking: number | null;
  is_active: boolean;
}

export interface Player {
  id: number;
  hltv_id: number | null;
  team_id: number | null;
  name: string;
  real_name: string | null;
  country_code: string | null;
  photo_url: string | null;
  age: number | null;
  rating_hltv: number;
  adr: number;
  kast: number;
  hs_percent: number;
}

export interface EventRow {
  id: number;
  name: string;
  prize_pool: string | null;
  tier: string;
}

export interface MapStat {
  id: number;
  match_id: number;
  map_name: string;
  map_order: number;
  score_team1: number;
  score_team2: number;
  winner_team_id: number | null;
}

/** Матч с вложенными командами/турниром — результат join-запроса */
export interface MatchWithRelations {
  id: number;
  status: MatchStatus;
  scheduled_at: string;
  format: string;
  score_team1: number;
  score_team2: number;
  winner_team_id: number | null;
  event: EventRow | null;
  team1: Team;
  team2: Team;
  map_stats?: MapStat[];
}

export interface Profile {
  id: string;
  username: string;
  email: string;
  role: ProfileRole;
  is_banned: boolean;
  created_at?: string;
}

/** Игрок с вложенной командой — результат join-запроса */
export interface PlayerWithTeam extends Player {
  team: Pick<Team, "id" | "name" | "tag" | "logo_url"> | null;
}

/** Статистика игрока на конкретной карте */
export interface PlayerMapStat {
  id: number;
  map_stat_id: number;
  player_id: number;
  team_id: number | null;
  kills: number;
  deaths: number;
  assists: number;
  hs_percent: number;
  adr: number;
  kast: number;
  impact: number;
  rating: number;
  player?: Player | null;
}

/** Полный матч (страница /matches/[id]) — со статистикой по картам */
export interface MatchFull extends MatchWithRelations {
  stream_url?: string | null;
  venue?: string | null;
  map_stats: (MapStat & { player_map_stats: PlayerMapStat[] })[];
}
