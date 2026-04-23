\set ON_ERROR_STOP on

TRUNCATE TABLE
  playlist_tracks,
  playlists,
  music_artist,
  music,
  home_banners,
  artists,
  categories,
  languages,
  years,
  users
RESTART IDENTITY CASCADE;

\copy users (id,name,subscribes,password,remember_token,subscription_plan,downloads_used_month,downloads_month_starts_at,created_at,updated_at) FROM 'd:/PROGG/Desktop/Elleme Suna/Owazym/backend/restore_tmp/users_import.tsv' WITH (FORMAT text, DELIMITER E'\t', NULL 'NULL');
\copy artists (id,name,photo_path,is_popular,created_at,updated_at) FROM 'd:/PROGG/Desktop/Elleme Suna/Owazym/backend/restore_tmp/artists.tsv' WITH (FORMAT text, DELIMITER E'\t', NULL 'NULL');
\copy categories (id,name,created_at,updated_at) FROM 'd:/PROGG/Desktop/Elleme Suna/Owazym/backend/restore_tmp/categories.tsv' WITH (FORMAT text, DELIMITER E'\t', NULL 'NULL');
\copy years (id,date,created_at,updated_at) FROM 'd:/PROGG/Desktop/Elleme Suna/Owazym/backend/restore_tmp/years.tsv' WITH (FORMAT text, DELIMITER E'\t', NULL 'NULL');
\copy languages (id,name,created_at,updated_at) FROM 'd:/PROGG/Desktop/Elleme Suna/Owazym/backend/restore_tmp/languages.tsv' WITH (FORMAT text, DELIMITER E'\t', NULL 'NULL');
\copy music (id,name,artist_id,year_id,language_id,category_id,plays,is_popular,audio_path,cover_path,created_at,updated_at) FROM 'd:/PROGG/Desktop/Elleme Suna/Owazym/backend/restore_tmp/music.tsv' WITH (FORMAT text, DELIMITER E'\t', NULL 'NULL');
\copy music_artist (id,music_id,artist_id,created_at,updated_at) FROM 'd:/PROGG/Desktop/Elleme Suna/Owazym/backend/restore_tmp/music_artist.tsv' WITH (FORMAT text, DELIMITER E'\t', NULL 'NULL');
\copy playlists (id,name,user_id,created_at,updated_at) FROM 'd:/PROGG/Desktop/Elleme Suna/Owazym/backend/restore_tmp/playlists.tsv' WITH (FORMAT text, DELIMITER E'\t', NULL 'NULL');
\copy playlist_tracks (id,playlist_id,music_id,created_at,updated_at) FROM 'd:/PROGG/Desktop/Elleme Suna/Owazym/backend/restore_tmp/playlist_tracks.tsv' WITH (FORMAT text, DELIMITER E'\t', NULL 'NULL');
\copy home_banners (id,title,subtitle,url,image_url,image_path,created_at,updated_at) FROM 'd:/PROGG/Desktop/Elleme Suna/Owazym/backend/restore_tmp/home_banners.tsv' WITH (FORMAT text, DELIMITER E'\t', NULL 'NULL');

SELECT setval(pg_get_serial_sequence('users','id'), COALESCE((SELECT MAX(id) FROM users), 1), true);
SELECT setval(pg_get_serial_sequence('artists','id'), COALESCE((SELECT MAX(id) FROM artists), 1), true);
SELECT setval(pg_get_serial_sequence('categories','id'), COALESCE((SELECT MAX(id) FROM categories), 1), true);
SELECT setval(pg_get_serial_sequence('years','id'), COALESCE((SELECT MAX(id) FROM years), 1), true);
SELECT setval(pg_get_serial_sequence('languages','id'), COALESCE((SELECT MAX(id) FROM languages), 1), true);
SELECT setval(pg_get_serial_sequence('music','id'), COALESCE((SELECT MAX(id) FROM music), 1), true);
SELECT setval(pg_get_serial_sequence('music_artist','id'), COALESCE((SELECT MAX(id) FROM music_artist), 1), true);
SELECT setval(pg_get_serial_sequence('playlists','id'), COALESCE((SELECT MAX(id) FROM playlists), 1), true);
SELECT setval(pg_get_serial_sequence('playlist_tracks','id'), COALESCE((SELECT MAX(id) FROM playlist_tracks), 1), true);
SELECT setval(pg_get_serial_sequence('home_banners','id'), COALESCE((SELECT MAX(id) FROM home_banners), 1), true);
