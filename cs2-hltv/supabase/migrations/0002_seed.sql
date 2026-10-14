-- ============================================================
-- Сид: топ-команды CS2 (рейтинг ~октябрь 2026), ростеры, турниры
-- и демонстрационные матчи (scheduled / live / finished)
-- Запускать ПОСЛЕ 0001_schema.sql
-- ============================================================

-- ---------- EVENTS ----------
insert into public.events (hltv_id, name, prize_pool, start_date, end_date, tier) values
(1001, 'BLAST Premier World Final 2026',   '$1,000,000', '2026-10-10', '2026-10-19', 'S'),
(1002, 'ESL Pro League Season 22',         '$850,000',   '2026-09-01', '2026-09-28', 'S'),
(1003, 'IEM Kraków 2026',                  '$1,000,000', '2026-11-04', '2026-11-15', 'S'),
(1004, 'PGL Astana 2026',                  '$1,250,000', '2026-06-01', '2026-06-14', 'S'),
(1005, 'CCT Season 3 Europe',              '$200,000',   '2026-10-01', '2026-10-31', 'A');

-- ---------- TEAMS (top-30 по HLTV-подобному рейтингу) ----------
insert into public.teams (hltv_id, name, tag, country_code, ranking) values
(1 , 'Team Spirit',           'SPR',  'ru', 1),
(2 , 'Natus Vincere',         'NAVI', 'ua', 2),
(3 , 'Vitality',              'VIT',  'fr', 3),
(4 , 'The MongolZ',           'MGZ',  'mn', 4),
(5 , 'FURIA',                 'FUR',  'br', 5),
(6 , 'FaZe Clan',             'FAZE', 'us', 6),
(7 , 'G2 Esports',            'G2',   'de', 7),
(8 , 'MOUZ',                  'MOUZ', 'gb', 8),
(9 , 'Team Liquid',           'TL',   'us', 9),
(10, 'Aurora Gaming',         'AUR',  'tr', 10),
(11, 'Astralis',              'AST',  'dk', 11),
(12, 'paiN Gaming',           'PAIN', 'br', 12),
(13, ' Complexity',           'COL',  'ca', 13),
(14, 'TYLOO',                 'TYL',  'cn', 14),
(15, ' GamerLegion',          'GL',   'gb', 15),
(16, '3DMAX',                 '3D',   'fr', 16),
(17, 'PARIVISION',            'PAR',  'kz', 17),
(18, 'Fnatic',                'FNC',  'se', 18),
(19, 'ENCE',                  'ENCE', 'fi', 19),
(20, 'Heroic',                'HER',  'dk', 20),
(21, 'FlyQuest',              'FQ',   'us', 21),
(22, 'MIBR',                  'MIBR', 'br', 22),
(23, 'Eternal Fire',          'EF',   'tr', 23),
(24, 'Legacy',                'LEG',  'br', 24),
(25, 'NRG',                   'NRG',  'us', 25),
(26, 'BIG',                   'BIG',  'de', 26),
(27, 'SAW',                   'SAW',  'pt', 27),
(28, 'Wildcard',              'WC',   'us', 28),
(29, 'B8',                    'B8',   'ua', 29),
(30, 'Spirit Academy',        'SPRA', 'ru', 30);

-- ---------- PLAYERS (ростеры топ-команд) ----------
insert into public.players (hltv_id, team_id, name, real_name, country_code, age, rating_hltv, adr, kast, hs_percent) values
-- Team Spirit
(101, 1, 'donk',      'Danil Kryshkovets',  'ru', 19, 1.31, 92.4, 76.1, 61.2),
(102, 1, 'chopper',   'Leonid Vishnyakov',  'ru', 26, 1.02, 71.3, 68.4, 44.0),
(103, 1, 'magixx',    'Gennady Fitarsov',   'ru', 22, 1.05, 74.8, 70.2, 41.5),
(104, 1, 'zont1x',    'Myroslav Plakhtia',  'ua', 20, 1.08, 76.1, 71.0, 42.3),
(105, 1, 'tN1R',      'Timofey Akhmatov',   'ru', 21, 1.12, 79.5, 72.4, 48.7),
-- Natus Vincere
(111, 2, 'w0nderful', 'Ihor Zhdanov',       'ua', 21, 1.18, 81.2, 74.0, 47.1),
(112, 2, 'b1t',       'Valerii Vakhovskyi', 'ua', 24, 1.14, 78.6, 73.2, 50.3),
(113, 2, 'iM',        'Mihai Ivan',         'ro', 25, 1.09, 76.4, 71.8, 45.9),
(114, 2, 'Aleksib',   'Aleksi Virolainen',  'fi', 27, 0.98, 69.2, 67.5, 40.1),
(115, 2, 'jL',        'Justinas Lekavicius','lt', 25, 1.11, 77.9, 72.0, 43.8),
-- Vitality
(121, 3, 'ZywOo',     'Mathieu Herbaut',    'fr', 25, 1.33, 94.1, 77.3, 55.6),
(122, 3, 'flameZ',    'Shahar Shushan',     'il', 22, 1.10, 77.2, 72.6, 46.2),
(123, 3, 'ropz',      'Robin Kool',         'ee', 26, 1.07, 75.8, 73.1, 42.9),
(124, 3, 'mezii',     'William Merriman',   'gb', 26, 1.01, 71.5, 69.8, 41.3),
(125, 3, 'apEX',      'Dan Madesclaire',    'fr', 32, 0.94, 66.4, 65.2, 38.7),
-- The MongolZ
(131, 4, 'mzinho',    'Bilguun Enkhbat',    'mn', 20, 1.21, 84.3, 75.4, 52.1),
(132, 4, 'Techno',    'Ganhurbaatar Temuulen', 'mn', 21, 1.16, 80.7, 74.2, 49.8),
(133, 4, '910X',      'Batkhangai Myagmardorj', 'mn', 23, 1.08, 76.0, 72.9, 44.6),
(134, 4, 'Senzu',     'Erdenebayar Munkhbold',  'mn', 20, 1.13, 78.9, 73.5, 47.3),
(135, 4, 'bLitz',     'Bayarjargal n/a',    'mn', 24, 0.99, 68.7, 68.1, 39.4),
-- FURIA
(141, 5, 'yuurih',    'Yuri Santos',        'br', 25, 1.12, 78.1, 73.0, 45.5),
(142, 5, 'KSCERATO',  'Kaike Cerato',       'br', 25, 1.15, 80.4, 74.1, 48.2),
(143, 5, 'YEKINDAR',  'Mareks Galinskis',   'lv', 26, 1.09, 76.8, 71.4, 43.1),
(144, 5, 'moloy',     'Vincent Cicero',     'br', 23, 1.06, 74.9, 70.8, 46.7),
(145, 5, 'FalleN',    'Gabriel Toledo',     'br', 34, 0.95, 67.2, 66.0, 41.9),
-- FaZe Clan
(151, 6, 'frozen',    'David Cerny',        'sk', 23, 1.17, 81.6, 74.5, 44.8),
(152, 6, 'broky',     'Helvijs Saukants',   'lv', 24, 1.10, 77.0, 72.3, 42.6),
(153, 6, 'karrigan',  'Finn Andersen',      'dk', 35, 0.92, 65.1, 64.8, 37.2),
(154, 6, 'rain',      'Håvard Nygaard',     'no', 31, 1.04, 73.4, 70.1, 45.0),
(155, 6, 'EliGE',     'Jonathan Jablonowski','us', 27, 1.13, 79.0, 73.7, 47.9),
-- G2
(161, 7, 'm0NESY',    'Ilya Osipov',        'ru', 20, 1.24, 86.7, 75.9, 51.4),
(162, 7, 'NiKo',      'Nikola Kovac',       'ba', 28, 1.19, 83.2, 74.8, 49.1),
(163, 7, 'huNter-',   'Nemanja Kovac',      'ba', 32, 1.05, 74.2, 71.0, 43.5),
(164, 7, 'malbsMd',   'Mateo Samayoa',      'gt', 22, 1.08, 76.3, 71.6, 46.8),
(165, 7, 'Brollan',   'Ludvig Brolin',      'se', 23, 1.06, 74.7, 71.9, 42.1),
-- MOUZ
(171, 8, 'Jimpphat',  'Jimi Salo',          'fi', 19, 1.15, 80.1, 74.3, 45.7),
(172, 8, 'xertioN',   'Dorian Berman',      'il', 22, 1.09, 76.5, 72.1, 44.2),
(173, 8, 'Brollan8',  'Jonas Larsson',      'se', 24, 1.03, 72.8, 70.4, 41.8),
(174, 8, 'torzsi',    'Attila Szabó',       'hu', 23, 1.11, 77.6, 72.7, 48.3),
(175, 8, 'Spinx',     'Lotan Giladi',       'il', 24, 1.07, 75.2, 71.5, 43.9),
-- Team Liquid
(181, 9, 'NAF',       'Keith Markovic',     'ca', 28, 1.04, 73.5, 71.2, 42.4),
(182, 9, 'Twistzz',   'Russel Van Dulken',  'ca', 25, 1.12, 78.3, 73.4, 47.6),
(183, 9, 'ultimate',  'Joshua Sutherland',  'nz', 21, 1.06, 74.6, 71.7, 44.9),
(184, 9, 'jks',       'Justin Savage',      'au', 28, 1.02, 72.1, 70.0, 43.2),
(185, 9, 'Insania',   'Santa Lucia Climenza','br', 29, 0.97, 68.9, 67.3, 39.8);

-- ---------- DEMO MATCHES ----------
-- 1) LIVE: BLAST WF — Spirit vs NAVI (карта 2 идет)
insert into public.matches (hltv_id, event_id, team1_id, team2_id, status, scheduled_at, format, score_team1, score_team2)
values (9001, 1001, 1, 2, 'live', now() - interval '1 hour', 'bo3', 1, 1);

insert into public.map_stats (match_id, map_name, map_order, score_team1, score_team2, winner_team_id, picked_by, duration_min)
values
((select id from public.matches where hltv_id = 9001), 'mirage',  1, 13, 10, 1, 1, 38),
((select id from public.matches where hltv_id = 9001), 'inferno', 2, 8,  6,  null, 2, null);

-- Статистика игроков на mirage (завершённая карта матча 9001)
insert into public.player_map_stats (map_stat_id, player_id, team_id, kills, deaths, assists, hs_percent, adr, kast, impact, rating)
values
((select id from public.map_stats where match_id = (select id from public.matches where hltv_id=9001) and map_order=1), 101, 1, 27, 14, 3, 68.4, 104.2, 78.0, 1.45, 1.62),
((select id from public.map_stats where match_id = (select id from public.matches where hltv_id=9001) and map_order=1), 103, 1, 18, 16, 5, 44.1, 79.5, 71.2, 1.02, 1.08),
((select id from public.map_stats where match_id = (select id from public.matches where hltv_id=9001) and map_order=1), 111, 2, 20, 19, 2, 47.3, 82.1, 70.5, 1.11, 1.15),
((select id from public.map_stats where match_id = (select id from public.matches where hltv_id=9001) and map_order=1), 112, 2, 15, 18, 4, 50.2, 71.8, 69.1, 0.94, 0.96);

-- 2) FINISHED: BLAST WF — Vitality vs FURIA
insert into public.matches (hltv_id, event_id, team1_id, team2_id, status, scheduled_at, format, score_team1, score_team2, winner_team_id)
values (9002, 1001, 3, 5, 'finished', now() - interval '1 day', 'bo3', 2, 1, 3);

insert into public.map_stats (match_id, map_name, map_order, score_team1, score_team2, winner_team_id, picked_by, duration_min)
values
((select id from public.matches where hltv_id = 9002), 'ancient', 1, 13, 7,  3, 3, 32),
((select id from public.matches where hltv_id = 9002), 'dust2',   2, 9,  13, 5, 5, 35),
((select id from public.matches where hltv_id = 9002), 'nuke',    3, 13, 11, 3, null, 41);

-- 3) SCHEDULED: завтра — FaZe vs G2
insert into public.matches (hltv_id, event_id, team1_id, team2_id, status, scheduled_at, format)
values (9003, 1001, 6, 7, 'scheduled', now() + interval '1 day', 'bo3');

-- 4) SCHEDULED: через 2 часа — MOUZ vs Liquid
insert into public.matches (hltv_id, event_id, team1_id, team2_id, status, scheduled_at, format)
values (9004, 1003, 8, 9, 'scheduled', now() + interval '2 hours', 'bo1');

-- 5) FINISHED вчерашний — Astralis vs Aurora
insert into public.matches (hltv_id, event_id, team1_id, team2_id, status, scheduled_at, format, score_team1, score_team2, winner_team_id)
values (9005, 1005, 11, 10, 'finished', now() - interval '2 days', 'bo3', 2, 0, 11);

insert into public.map_stats (match_id, map_name, map_order, score_team1, score_team2, winner_team_id, picked_by, duration_min)
values
((select id from public.matches where hltv_id = 9005), 'vertigo', 1, 13, 9,  11, 11, 34),
((select id from public.matches where hltv_id = 9005), 'overpass',2, 13, 10, 11, 10, 39);
