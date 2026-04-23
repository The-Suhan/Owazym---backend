--
-- PostgreSQL database dump
--

\restrict rJtSnMNvYfF3e5cNKkYRpqNn5SAOzj4pIsNrIFXvJgq2zyMSADfrgeESujhIJ48

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: artists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.artists (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    photo_path character varying(255),
    is_popular boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.artists OWNER TO postgres;

--
-- Name: artists_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.artists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.artists_id_seq OWNER TO postgres;

--
-- Name: artists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.artists_id_seq OWNED BY public.artists.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: home_banners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.home_banners (
    id bigint NOT NULL,
    title character varying(80) NOT NULL,
    subtitle character varying(160),
    url character varying(255),
    image_url character varying(255),
    image_path character varying(255),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.home_banners OWNER TO postgres;

--
-- Name: home_banners_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.home_banners_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.home_banners_id_seq OWNER TO postgres;

--
-- Name: home_banners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.home_banners_id_seq OWNED BY public.home_banners.id;


--
-- Name: languages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.languages (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.languages OWNER TO postgres;

--
-- Name: languages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.languages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.languages_id_seq OWNER TO postgres;

--
-- Name: languages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.languages_id_seq OWNED BY public.languages.id;


--
-- Name: music; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.music (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    artist_id bigint,
    year_id bigint NOT NULL,
    language_id bigint NOT NULL,
    category_id bigint NOT NULL,
    plays bigint DEFAULT 0 NOT NULL,
    is_popular boolean DEFAULT false NOT NULL,
    audio_path character varying(255),
    cover_path character varying(255),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.music OWNER TO postgres;

--
-- Name: music_artist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.music_artist (
    id bigint NOT NULL,
    music_id bigint NOT NULL,
    artist_id bigint NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.music_artist OWNER TO postgres;

--
-- Name: music_artist_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.music_artist_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.music_artist_id_seq OWNER TO postgres;

--
-- Name: music_artist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.music_artist_id_seq OWNED BY public.music_artist.id;


--
-- Name: music_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.music_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.music_id_seq OWNER TO postgres;

--
-- Name: music_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.music_id_seq OWNED BY public.music.id;


--
-- Name: playlist_tracks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.playlist_tracks (
    id bigint NOT NULL,
    playlist_id bigint,
    music_id bigint,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.playlist_tracks OWNER TO postgres;

--
-- Name: playlist_tracks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.playlist_tracks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.playlist_tracks_id_seq OWNER TO postgres;

--
-- Name: playlist_tracks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.playlist_tracks_id_seq OWNED BY public.playlist_tracks.id;


--
-- Name: playlists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.playlists (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    user_id bigint NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.playlists OWNER TO postgres;

--
-- Name: playlists_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.playlists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.playlists_id_seq OWNER TO postgres;

--
-- Name: playlists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.playlists_id_seq OWNED BY public.playlists.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(191) NOT NULL,
    subscribes boolean DEFAULT false NOT NULL,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    subscription_plan character varying(20) DEFAULT 'free'::character varying NOT NULL,
    downloads_used_month integer DEFAULT 0 NOT NULL,
    downloads_month_starts_at date,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: years; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.years (
    id bigint NOT NULL,
    date integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.years OWNER TO postgres;

--
-- Name: years_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.years_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.years_id_seq OWNER TO postgres;

--
-- Name: years_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.years_id_seq OWNED BY public.years.id;


--
-- Name: artists id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artists ALTER COLUMN id SET DEFAULT nextval('public.artists_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: home_banners id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_banners ALTER COLUMN id SET DEFAULT nextval('public.home_banners_id_seq'::regclass);


--
-- Name: languages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.languages ALTER COLUMN id SET DEFAULT nextval('public.languages_id_seq'::regclass);


--
-- Name: music id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music ALTER COLUMN id SET DEFAULT nextval('public.music_id_seq'::regclass);


--
-- Name: music_artist id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music_artist ALTER COLUMN id SET DEFAULT nextval('public.music_artist_id_seq'::regclass);


--
-- Name: playlist_tracks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.playlist_tracks ALTER COLUMN id SET DEFAULT nextval('public.playlist_tracks_id_seq'::regclass);


--
-- Name: playlists id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.playlists ALTER COLUMN id SET DEFAULT nextval('public.playlists_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: years id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.years ALTER COLUMN id SET DEFAULT nextval('public.years_id_seq'::regclass);


--
-- Data for Name: artists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.artists (id, name, photo_path, is_popular, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: home_banners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.home_banners (id, title, subtitle, url, image_url, image_path, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: languages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.languages (id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: music; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.music (id, name, artist_id, year_id, language_id, category_id, plays, is_popular, audio_path, cover_path, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: music_artist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.music_artist (id, music_id, artist_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: playlist_tracks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.playlist_tracks (id, playlist_id, music_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: playlists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.playlists (id, name, user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, subscribes, password, remember_token, subscription_plan, downloads_used_month, downloads_month_starts_at, created_at, updated_at) FROM stdin;
1	Suhan	f	$2a$12$aIMv8Svo811Ma7t6pRpNUe3os1npTBjJR7axPzF7m7zd5BYGbdv6m 	\N	free	0	\N	2026-03-10 16:33:26.347	2026-03-10 16:33:26.347
\.


--
-- Data for Name: years; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.years (id, date, created_at, updated_at) FROM stdin;
\.


--
-- Name: artists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.artists_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 1, false);


--
-- Name: home_banners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.home_banners_id_seq', 1, false);


--
-- Name: languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.languages_id_seq', 1, false);


--
-- Name: music_artist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.music_artist_id_seq', 1, false);


--
-- Name: music_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.music_id_seq', 1, false);


--
-- Name: playlist_tracks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.playlist_tracks_id_seq', 1, false);


--
-- Name: playlists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.playlists_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: years_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.years_id_seq', 1, false);


--
-- Name: artists artists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artists
    ADD CONSTRAINT artists_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: home_banners home_banners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_banners
    ADD CONSTRAINT home_banners_pkey PRIMARY KEY (id);


--
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (id);


--
-- Name: music_artist music_artist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music_artist
    ADD CONSTRAINT music_artist_pkey PRIMARY KEY (id);


--
-- Name: music music_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music
    ADD CONSTRAINT music_pkey PRIMARY KEY (id);


--
-- Name: playlist_tracks playlist_tracks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.playlist_tracks
    ADD CONSTRAINT playlist_tracks_pkey PRIMARY KEY (id);


--
-- Name: playlists playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: years years_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.years
    ADD CONSTRAINT years_pkey PRIMARY KEY (id);


--
-- Name: music_artist_music_id_artist_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX music_artist_music_id_artist_id_key ON public.music_artist USING btree (music_id, artist_id);


--
-- Name: playlist_tracks_playlist_music_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX playlist_tracks_playlist_music_unique ON public.playlist_tracks USING btree (playlist_id, music_id);


--
-- Name: users_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_name_key ON public.users USING btree (name);


--
-- Name: music_artist music_artist_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music_artist
    ADD CONSTRAINT music_artist_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: music_artist music_artist_music_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music_artist
    ADD CONSTRAINT music_artist_music_id_fkey FOREIGN KEY (music_id) REFERENCES public.music(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: music music_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music
    ADD CONSTRAINT music_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: music music_language_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music
    ADD CONSTRAINT music_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: music music_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.music
    ADD CONSTRAINT music_year_id_fkey FOREIGN KEY (year_id) REFERENCES public.years(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: playlist_tracks playlist_tracks_music_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.playlist_tracks
    ADD CONSTRAINT playlist_tracks_music_id_fkey FOREIGN KEY (music_id) REFERENCES public.music(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: playlist_tracks playlist_tracks_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.playlist_tracks
    ADD CONSTRAINT playlist_tracks_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: playlists playlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict rJtSnMNvYfF3e5cNKkYRpqNn5SAOzj4pIsNrIFXvJgq2zyMSADfrgeESujhIJ48

