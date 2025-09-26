--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12 (Ubuntu 15.12-1.pgdg20.04+1)
-- Dumped by pg_dump version 15.12 (Ubuntu 15.12-1.pgdg20.04+1)

-- Started on 2025-09-26 15:48:46 +07

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS house_design;
--
-- TOC entry 3365 (class 1262 OID 65541)
-- Name: house_design; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE house_design WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C.UTF-8';


ALTER DATABASE house_design OWNER TO postgres;

\connect house_design

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- TOC entry 215 (class 1259 OID 65544)
-- Name: admin; Type: TABLE; Schema: public; Owner: house_user
--

CREATE TABLE public.admin (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL
);


ALTER TABLE public.admin OWNER TO house_user;

--
-- TOC entry 214 (class 1259 OID 65543)
-- Name: admin_id_seq; Type: SEQUENCE; Schema: public; Owner: house_user
--

CREATE SEQUENCE public.admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.admin_id_seq OWNER TO house_user;

--
-- TOC entry 3368 (class 0 OID 0)
-- Dependencies: 214
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: house_user
--

ALTER SEQUENCE public.admin_id_seq OWNED BY public.admin.id;


--
-- TOC entry 221 (class 1259 OID 73734)
-- Name: articles; Type: TABLE; Schema: public; Owner: house_user
--

CREATE TABLE public.articles (
    id integer NOT NULL,
    title character varying(500) NOT NULL,
    content text NOT NULL,
    summary text,
    featured_image_url character varying(500),
    category_id integer NOT NULL,
    published boolean DEFAULT false,
    tags character varying(1000),
    meta_title character varying(255),
    meta_description text,
    slug character varying(500) NOT NULL,
    author_id integer,
    view_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.articles OWNER TO house_user;

--
-- TOC entry 220 (class 1259 OID 73733)
-- Name: articles_id_seq; Type: SEQUENCE; Schema: public; Owner: house_user
--

CREATE SEQUENCE public.articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.articles_id_seq OWNER TO house_user;

--
-- TOC entry 3369 (class 0 OID 0)
-- Dependencies: 220
-- Name: articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: house_user
--

ALTER SEQUENCE public.articles_id_seq OWNED BY public.articles.id;


--
-- TOC entry 217 (class 1259 OID 65555)
-- Name: categories; Type: TABLE; Schema: public; Owner: house_user
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    parent_id integer,
    level integer DEFAULT 0,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    thumbnail_url character varying(500),
    category_type character varying(50) DEFAULT 'product'::character varying
);


ALTER TABLE public.categories OWNER TO house_user;

--
-- TOC entry 216 (class 1259 OID 65554)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: house_user
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO house_user;

--
-- TOC entry 3370 (class 0 OID 0)
-- Dependencies: 216
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: house_user
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 225 (class 1259 OID 122886)
-- Name: footer_content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.footer_content (
    id integer NOT NULL,
    company_name character varying(500) NOT NULL,
    address text,
    phone character varying(50),
    email character varying(255),
    facebook_url character varying(500),
    instagram_url character varying(500),
    youtube_url character varying(500),
    linkedin_url character varying(500),
    copyright_text character varying(500),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    services text DEFAULT '[]'::text,
    social_media text DEFAULT '[]'::text
);


ALTER TABLE public.footer_content OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 122885)
-- Name: footer_content_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.footer_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.footer_content_id_seq OWNER TO postgres;

--
-- TOC entry 3371 (class 0 OID 0)
-- Dependencies: 224
-- Name: footer_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.footer_content_id_seq OWNED BY public.footer_content.id;


--
-- TOC entry 223 (class 1259 OID 106502)
-- Name: home_content; Type: TABLE; Schema: public; Owner: house_user
--

CREATE TABLE public.home_content (
    id integer NOT NULL,
    hero_title character varying(500) NOT NULL,
    hero_description text,
    hero_stat1_number character varying(50),
    hero_stat1_label character varying(255),
    hero_stat2_number character varying(50),
    hero_stat2_label character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    features_title character varying(500),
    features_description text,
    features_logo_url character varying(500),
    feature1_icon character varying(500),
    feature1_title character varying(500),
    feature1_description text,
    feature2_icon character varying(500),
    feature2_title character varying(500),
    feature2_description text,
    feature3_icon character varying(500),
    feature3_title character varying(500),
    feature3_description text,
    feature4_icon character varying(500),
    feature4_title character varying(500),
    feature4_description text
);


ALTER TABLE public.home_content OWNER TO house_user;

--
-- TOC entry 222 (class 1259 OID 106501)
-- Name: home_content_id_seq; Type: SEQUENCE; Schema: public; Owner: house_user
--

CREATE SEQUENCE public.home_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.home_content_id_seq OWNER TO house_user;

--
-- TOC entry 3372 (class 0 OID 0)
-- Dependencies: 222
-- Name: home_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: house_user
--

ALTER SEQUENCE public.home_content_id_seq OWNED BY public.home_content.id;


--
-- TOC entry 219 (class 1259 OID 65568)
-- Name: posts; Type: TABLE; Schema: public; Owner: house_user
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    title character varying(500) NOT NULL,
    content text,
    summary text,
    image_url character varying(500),
    category_id integer NOT NULL,
    published boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.posts OWNER TO house_user;

--
-- TOC entry 218 (class 1259 OID 65567)
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: house_user
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.posts_id_seq OWNER TO house_user;

--
-- TOC entry 3373 (class 0 OID 0)
-- Dependencies: 218
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: house_user
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- TOC entry 3170 (class 2604 OID 65547)
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- TOC entry 3183 (class 2604 OID 73737)
-- Name: articles id; Type: DEFAULT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.articles ALTER COLUMN id SET DEFAULT nextval('public.articles_id_seq'::regclass);


--
-- TOC entry 3171 (class 2604 OID 65558)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 3191 (class 2604 OID 122889)
-- Name: footer_content id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.footer_content ALTER COLUMN id SET DEFAULT nextval('public.footer_content_id_seq'::regclass);


--
-- TOC entry 3188 (class 2604 OID 106505)
-- Name: home_content id; Type: DEFAULT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.home_content ALTER COLUMN id SET DEFAULT nextval('public.home_content_id_seq'::regclass);


--
-- TOC entry 3179 (class 2604 OID 65571)
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- TOC entry 3197 (class 2606 OID 65551)
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- TOC entry 3199 (class 2606 OID 65553)
-- Name: admin admin_username_key; Type: CONSTRAINT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_username_key UNIQUE (username);


--
-- TOC entry 3207 (class 2606 OID 73745)
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- TOC entry 3209 (class 2606 OID 73747)
-- Name: articles articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_slug_key UNIQUE (slug);


--
-- TOC entry 3201 (class 2606 OID 65564)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3203 (class 2606 OID 65566)
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- TOC entry 3213 (class 2606 OID 122895)
-- Name: footer_content footer_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.footer_content
    ADD CONSTRAINT footer_content_pkey PRIMARY KEY (id);


--
-- TOC entry 3211 (class 2606 OID 106511)
-- Name: home_content home_content_pkey; Type: CONSTRAINT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.home_content
    ADD CONSTRAINT home_content_pkey PRIMARY KEY (id);


--
-- TOC entry 3205 (class 2606 OID 65578)
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- TOC entry 3216 (class 2606 OID 73748)
-- Name: articles articles_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.admin(id);


--
-- TOC entry 3217 (class 2606 OID 73753)
-- Name: articles articles_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- TOC entry 3214 (class 2606 OID 81928)
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- TOC entry 3215 (class 2606 OID 65579)
-- Name: posts posts_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: house_user
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- TOC entry 3366 (class 0 OID 0)
-- Dependencies: 3365
-- Name: DATABASE house_design; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON DATABASE house_design TO house_user;


--
-- TOC entry 3367 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO house_user;


-- Completed on 2025-09-26 15:48:53 +07

--
-- PostgreSQL database dump complete
--

