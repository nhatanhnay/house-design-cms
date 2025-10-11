--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12 (Ubuntu 15.12-1.pgdg20.04+1)
-- Dumped by pg_dump version 15.12 (Ubuntu 15.12-1.pgdg20.04+1)

-- Started on 2025-10-11 10:09:43 +07

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
-- TOC entry 3467 (class 1262 OID 131090)
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

--
-- TOC entry 238 (class 1255 OID 139312)
-- Name: update_products_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_products_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_products_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 131092)
-- Name: admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL
);


ALTER TABLE public.admin OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 131091)
-- Name: admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.admin_id_seq OWNER TO postgres;

--
-- TOC entry 3468 (class 0 OID 0)
-- Dependencies: 214
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_id_seq OWNED BY public.admin.id;


--
-- TOC entry 227 (class 1259 OID 131205)
-- Name: articles; Type: TABLE; Schema: public; Owner: postgres
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    focus_keywords text,
    og_image_url character varying(500),
    canonical_url character varying(500)
);


ALTER TABLE public.articles OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 131204)
-- Name: articles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.articles_id_seq OWNER TO postgres;

--
-- TOC entry 3469 (class 0 OID 0)
-- Dependencies: 226
-- Name: articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.articles_id_seq OWNED BY public.articles.id;


--
-- TOC entry 217 (class 1259 OID 131103)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    thumbnail_url character varying(500),
    category_type character varying(50) DEFAULT 'product'::character varying,
    parent_id integer,
    level integer DEFAULT 0,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    display_order integer DEFAULT 0,
    meta_title character varying(255),
    meta_description text,
    meta_keywords text,
    og_image_url character varying(500)
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 131102)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO postgres;

--
-- TOC entry 3470 (class 0 OID 0)
-- Dependencies: 216
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 233 (class 1259 OID 147462)
-- Name: consultations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(255),
    details text,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.consultations OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 147461)
-- Name: consultations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.consultations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.consultations_id_seq OWNER TO postgres;

--
-- TOC entry 3471 (class 0 OID 0)
-- Dependencies: 232
-- Name: consultations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.consultations_id_seq OWNED BY public.consultations.id;


--
-- TOC entry 235 (class 1259 OID 147476)
-- Name: visitors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visitors (
    id integer NOT NULL,
    ip_address character varying(45) NOT NULL,
    user_agent text,
    page_url text,
    referrer text,
    visit_date date DEFAULT CURRENT_DATE,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.visitors OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 147488)
-- Name: daily_unique_visitors; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.daily_unique_visitors AS
 SELECT visitors.visit_date,
    count(DISTINCT visitors.ip_address) AS unique_visitors,
    count(*) AS total_visits
   FROM public.visitors
  GROUP BY visitors.visit_date
  ORDER BY visitors.visit_date DESC;


ALTER TABLE public.daily_unique_visitors OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 131191)
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
    services text DEFAULT '[]'::text,
    social_media text DEFAULT '[]'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.footer_content OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 131190)
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
-- TOC entry 3472 (class 0 OID 0)
-- Dependencies: 224
-- Name: footer_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.footer_content_id_seq OWNED BY public.footer_content.id;


--
-- TOC entry 223 (class 1259 OID 131178)
-- Name: global_seo_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.global_seo_settings (
    id integer NOT NULL,
    site_name character varying(255) NOT NULL,
    default_meta_title character varying(255) NOT NULL,
    default_meta_description text NOT NULL,
    default_og_image_url character varying(500),
    google_analytics_id character varying(255),
    google_search_console_id character varying(255),
    facebook_app_id character varying(255),
    twitter_handle character varying(255),
    company_name character varying(255) NOT NULL,
    company_description text,
    company_address text,
    company_phone character varying(50),
    company_email character varying(255),
    company_logo_url character varying(500),
    business_hours character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.global_seo_settings OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 131177)
-- Name: global_seo_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.global_seo_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.global_seo_settings_id_seq OWNER TO postgres;

--
-- TOC entry 3473 (class 0 OID 0)
-- Dependencies: 222
-- Name: global_seo_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.global_seo_settings_id_seq OWNED BY public.global_seo_settings.id;


--
-- TOC entry 221 (class 1259 OID 131167)
-- Name: home_content; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.home_content OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 131166)
-- Name: home_content_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.home_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.home_content_id_seq OWNER TO postgres;

--
-- TOC entry 3474 (class 0 OID 0)
-- Dependencies: 220
-- Name: home_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.home_content_id_seq OWNED BY public.home_content.id;


--
-- TOC entry 219 (class 1259 OID 131150)
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    views integer DEFAULT 0,
    meta_title character varying(255),
    meta_description text,
    focus_keywords text,
    og_image_url character varying(500),
    slug character varying(255)
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 131149)
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.posts_id_seq OWNER TO postgres;

--
-- TOC entry 3475 (class 0 OID 0)
-- Dependencies: 218
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- TOC entry 231 (class 1259 OID 139291)
-- Name: product_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_images (
    id integer NOT NULL,
    product_id integer NOT NULL,
    image_url character varying(500) NOT NULL,
    display_order integer DEFAULT 0,
    alt_text character varying(255),
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_images OWNER TO postgres;

--
-- TOC entry 3476 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE product_images; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.product_images IS 'Image gallery for products (similar to Shopee product images)';


--
-- TOC entry 230 (class 1259 OID 139290)
-- Name: product_images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_images_id_seq OWNER TO postgres;

--
-- TOC entry 3477 (class 0 OID 0)
-- Dependencies: 230
-- Name: product_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_images_id_seq OWNED BY public.product_images.id;


--
-- TOC entry 229 (class 1259 OID 139270)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text,
    summary text,
    thumbnail_url character varying(500),
    category_id integer NOT NULL,
    published boolean DEFAULT true,
    views integer DEFAULT 0,
    meta_title character varying(255),
    meta_description text,
    focus_keywords character varying(255),
    og_image_url character varying(500),
    slug character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 3478 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE products; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.products IS 'Product catalog for house designs and construction services';


--
-- TOC entry 228 (class 1259 OID 139269)
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO postgres;

--
-- TOC entry 3479 (class 0 OID 0)
-- Dependencies: 228
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- TOC entry 237 (class 1259 OID 147492)
-- Name: visitor_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.visitor_stats AS
 SELECT count(DISTINCT visitors.ip_address) AS total_unique_visitors,
    count(*) AS total_visits,
    count(DISTINCT visitors.visit_date) AS total_days
   FROM public.visitors;


ALTER TABLE public.visitor_stats OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 147475)
-- Name: visitors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visitors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.visitors_id_seq OWNER TO postgres;

--
-- TOC entry 3480 (class 0 OID 0)
-- Dependencies: 234
-- Name: visitors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visitors_id_seq OWNED BY public.visitors.id;


--
-- TOC entry 3204 (class 2604 OID 131095)
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- TOC entry 3229 (class 2604 OID 131208)
-- Name: articles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles ALTER COLUMN id SET DEFAULT nextval('public.articles_id_seq'::regclass);


--
-- TOC entry 3205 (class 2604 OID 131106)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 3243 (class 2604 OID 147465)
-- Name: consultations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations ALTER COLUMN id SET DEFAULT nextval('public.consultations_id_seq'::regclass);


--
-- TOC entry 3224 (class 2604 OID 131194)
-- Name: footer_content id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.footer_content ALTER COLUMN id SET DEFAULT nextval('public.footer_content_id_seq'::regclass);


--
-- TOC entry 3221 (class 2604 OID 131181)
-- Name: global_seo_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.global_seo_settings ALTER COLUMN id SET DEFAULT nextval('public.global_seo_settings_id_seq'::regclass);


--
-- TOC entry 3218 (class 2604 OID 131170)
-- Name: home_content id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_content ALTER COLUMN id SET DEFAULT nextval('public.home_content_id_seq'::regclass);


--
-- TOC entry 3213 (class 2604 OID 131153)
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- TOC entry 3239 (class 2604 OID 139294)
-- Name: product_images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images ALTER COLUMN id SET DEFAULT nextval('public.product_images_id_seq'::regclass);


--
-- TOC entry 3234 (class 2604 OID 139273)
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- TOC entry 3247 (class 2604 OID 147479)
-- Name: visitors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visitors ALTER COLUMN id SET DEFAULT nextval('public.visitors_id_seq'::regclass);


--
-- TOC entry 3441 (class 0 OID 131092)
-- Dependencies: 215
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin (id, username, password) FROM stdin;
1	admin	$2a$10$ckAcDox.pvuap8zjxm2z4uzMONDQxcvgHEvVnLiPkMFvMs4p0bS/C
\.


--
-- TOC entry 3453 (class 0 OID 131205)
-- Dependencies: 227
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.articles (id, title, content, summary, featured_image_url, category_id, published, tags, meta_title, meta_description, slug, author_id, view_count, created_at, updated_at, focus_keywords, og_image_url, canonical_url) FROM stdin;
\.


--
-- TOC entry 3443 (class 0 OID 131103)
-- Dependencies: 217
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, slug, description, thumbnail_url, category_type, parent_id, level, order_index, is_active, created_at, updated_at, display_order, meta_title, meta_description, meta_keywords, og_image_url) FROM stdin;
3	Dự án thực tế	du-an-thuc-te	Dự án thực tế	/data/uploads/images/b870b6db-0ade-42f5-8c56-829f92923593.jpg	parent	\N	0	3	t	2025-10-03 10:11:16.248993	2025-10-03 14:40:45.006807	3				
4	Tin tức	tin-tuc	Tin tức về kiến trúc	http://localhost:8080/data/uploads/images/61a79245-5755-4c0c-8ffa-285a4aeca01b.jpg	regular	\N	0	4	t	2025-10-03 10:11:16.249899	2025-10-03 14:41:19.679521	4				
9	Nhà hiện đại	mau-thiet-ke-nha-hien-dai		http://localhost:8080/data/uploads/images/4490f952-4299-4407-8907-3d46eac9c57d.jpg	parent	1	1	2	t	2025-10-03 14:43:04.60937	2025-10-06 21:08:46.593516	9				
1	Mẫu Thiết Kế	mau-thiet-ke	Các mẫu thiết kế nhà hiện đại	/data/uploads/images/a0c85d04-43f0-491d-9742-18b959f6af98.jpg	parent	\N	0	1	t	2025-10-03 10:11:16.246996	2025-10-03 14:39:03.07388	1	test 2	test		
10	Nhà sang trọng	mau-thiet-ke-nha-sang-trong		http://localhost:8080/data/uploads/images/a4730b5c-c246-40ca-800d-ff72ff38645b.jpg	parent	1	1	3	t	2025-10-03 14:43:25.269525	2025-10-06 21:08:53.044835	10				
8	Nhà phố	mau-thiet-ke-nha-pho	Các mẫu thiết kế nhà phố	/data/uploads/images/449d2a1f-6407-4f84-9ad5-51052ef6c44e.jpg	parent	1	1	1	t	2025-10-03 14:42:53.623806	2025-10-06 21:09:30.172758	8				
5	Nhà phố	du-an-thuc-te-nha-pho		http://localhost:8080/data/uploads/images/68d4f547-2eb3-4768-8aa3-b41bc795891f.jpg	parent	3	1	1	t	2025-10-03 14:41:39.48347	2025-10-08 15:20:45.568967	5				
6	Nhà hiện đại	du-an-thuc-te-nha-hien-dai		http://localhost:8080/data/uploads/images/10c3840c-82ad-45a8-b91f-782994151140.jpg	parent	3	1	2	t	2025-10-03 14:41:52.178555	2025-10-08 15:20:56.093386	6				
7	Nhà sang trọng	du-an-thuc-te-nha-sang-trong		http://localhost:8080/data/uploads/images/20681721-d7b6-4bfe-81b0-4b85e6597d88.jpg	parent	3	1	3	t	2025-10-03 14:42:19.251109	2025-10-08 15:21:03.723065	7				
\.


--
-- TOC entry 3459 (class 0 OID 147462)
-- Dependencies: 233
-- Data for Name: consultations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consultations (id, name, phone, email, details, status, created_at, updated_at) FROM stdin;
5	Lê Công Nhật Anh	0868248919	lecongnhatanh@gmail.com	Hehehsadfi hsaifhasudhflauisdhfasdasdfasdfsadfawer qưefasdf ádfa sfsd ádfarw3 àdsadgqwrwae	pending	2025-10-10 09:07:20.262179	2025-10-10 09:07:20.262179
\.


--
-- TOC entry 3451 (class 0 OID 131191)
-- Dependencies: 225
-- Data for Name: footer_content; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.footer_content (id, company_name, address, phone, email, facebook_url, instagram_url, youtube_url, linkedin_url, copyright_text, description, services, social_media, created_at, updated_at) FROM stdin;
1	MMA Architectural Design	123 Đường ABC, Phường XYZ, Quận 1, TP.HCM	0123 456 789	contact@mmadesign.com	https://facebook.com/mmadesign	https://instagram.com/mmadesign	https://youtube.com/mmadesign	https://linkedin.com/company/mmadesign	© 2024 MMA Architectural Design. All rights reserved.	Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo. Đội ngũ kiến trúc sư giàu kinh nghiệm, cam kết mang đến những công trình chất lượng cao.	["Thiết kế kiến trúc","Thi công xây dựng","Nội thất cao cấp","Tư vấn phong thủy"]	[{"name":"Facebook","url":"https://facebook.com/mmadesign","icon":"facebook"},{"name":"Instagram","url":"https://instagram.com/mmadesign","icon":"photo_camera"},{"name":"YouTube","url":"https://youtube.com/mmadesign","icon":"play_circle"},{"name":"LinkedIn","url":"https://linkedin.com/company/mmadesign","icon":"business"}]	2025-10-03 10:11:16.252209	2025-10-09 14:10:28.98596
\.


--
-- TOC entry 3449 (class 0 OID 131178)
-- Dependencies: 223
-- Data for Name: global_seo_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.global_seo_settings (id, site_name, default_meta_title, default_meta_description, default_og_image_url, google_analytics_id, google_search_console_id, facebook_app_id, twitter_handle, company_name, company_description, company_address, company_phone, company_email, company_logo_url, business_hours, created_at, updated_at) FROM stdin;
1	MMA Architectural Design	MMA Architectural Design - Thiết Kế & Thi Công Biệt Thự	Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo. Uy tín tại 37 tỉnh thành, hơn 500 dự án hoàn thành.						MMA Architectural Design	Công ty chuyên thiết kế và thi công biệt thự, nhà ở cao cấp	123 Đường ABC, Quận XYZ, TP.HCM	0123 456 789	contact@mma-design.com		Mo-Fr 08:00-17:00, Sa 08:00-12:00	2025-10-03 10:11:16.192344	2025-10-03 10:11:16.192344
\.


--
-- TOC entry 3447 (class 0 OID 131167)
-- Dependencies: 221
-- Data for Name: home_content; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.home_content (id, hero_title, hero_description, hero_stat1_number, hero_stat1_label, hero_stat2_number, hero_stat2_label, created_at, updated_at, features_title, features_description, features_logo_url, feature1_icon, feature1_title, feature1_description, feature2_icon, feature2_title, feature2_description, feature3_icon, feature3_title, feature3_description, feature4_icon, feature4_title, feature4_description) FROM stdin;
1	MMA Architectural Design	Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo	37	Tỉnh Thành Phủ Sóng	500+	Dự Án Biệt Thự/Nhà Ở Chuyên Nghiệp	2025-10-03 10:11:16.251057	2025-10-03 10:11:16.251057	Ưu Thế MMA Architectural Design			architecture	Thiết Kế Kiến Trúc Độc Đáo	Chuyên gia kiến trúc sư với hơn 10 năm kinh nghiệm, tạo ra những công trình biệt thự và nhà ở đẳng cấp.	engineering	Thi Công Chất Lượng Cao	Đội ngũ kỹ sư và công nhân tay nghề cao, sử dụng công nghệ hiện đại trong thi công.	business	Dịch Vụ Toàn Diện	Từ thiết kế kiến trúc, nội thất đến giám sát thi công và bàn giao hoàn thiện.	verified	Uy Tín 37 Tỉnh Thành	Đã hoàn thành hơn 500 dự án biệt thự và nhà ở trên toàn quốc, được khách hàng tin tưởng.
\.


--
-- TOC entry 3445 (class 0 OID 131150)
-- Dependencies: 219
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, title, content, summary, image_url, category_id, published, created_at, updated_at, views, meta_title, meta_description, focus_keywords, og_image_url, slug) FROM stdin;
2	Nhà phố 3 tầng phong cách Nhật Bản	<h2>Phong cách Nhật Bản cho nhà phố</h2><p>Nhà phố 3 tầng theo phong cách Nhật Bản mang đến sự hài hòa giữa truyền thống và hiện đại.</p><p>Đặc trưng thiết kế:</p><ul><li>Không gian mở, thông thoáng</li><li>Sử dụng gỗ tự nhiên</li><li>Vườn mini trong nhà</li><li>Ánh sáng tự nhiên tối đa</li></ul>	Nhà phố 3 tầng phong cách Nhật Bản với thiết kế tinh tế, tối ưu không gian, mang đến sự yên bình và thoải mái.	/data/uploads/images/b870b6db-0ade-42f5-8c56-829f92923593.jpg	4	t	2025-10-03 15:28:37.048548	2025-10-03 15:39:42.01262	0	Nhà phố 3 tầng phong cách Nhật Bản - Tinh tế & Hiện đại	Mẫu nhà phố 3 tầng phong cách Nhật Bản đẹp, tối ưu không gian. Thiết kế tinh tế, hài hòa giữa truyền thống và hiện đại.	nhà phố Nhật Bản, thiết kế 3 tầng, phong cách Nhật		nha-pho-3-tang-phong-cach-nhat-ban
3	Biệt thự sân vườn 1 tầng tại Đà Nẵng	<h2>Dự án biệt thự sân vườn tại Đà Nẵng</h2><p>Dự án biệt thự sân vườn 1 tầng rộng 500m2 tại khu đô thị mới Đà Nẵng vừa hoàn thành.</p><p>Thông tin dự án:</p><ul><li>Diện tích: 500m2</li><li>Phong cách: Tropical Modern</li><li>Thời gian thi công: 8 tháng</li><li>Chi phí: 5.2 tỷ VNĐ</li></ul>	Dự án biệt thự sân vườn 1 tầng tại Đà Nẵng với phong cách Tropical Modern, diện tích 500m2, hoàn thành sau 8 tháng thi công.	/data/uploads/images/962d09d0-46ce-480c-a458-6e94ecb3bc35.jpg	4	t	2025-10-03 15:28:37.048548	2025-10-03 15:39:47.328082	0	Biệt thú sân vườn 1 tầng Đà Nẵng - Dự án hoàn thành 2024	Dự án biệt thự sân vườn 1 tầng tại Đà Nẵng, diện tích 500m2, phong cách Tropical Modern. Xem ảnh thực tế và chi phí thi công.	biệt thự Đà Nẵng, sân vườn 1 tầng, dự án hoàn thành		biet-thu-san-vuon-1-tang-da-nang
4	Xu hướng nội thất năm 2024	<h2>Top 5 xu hướng nội thất 2024</h2><p>Năm 2024 đánh dấu sự trở lại của các phong cách thiết kế bền vững và thân thiện với môi trường.</p><h3>1. Minimalism 2.0</h3><p>Tối giản nhưng ấm áp hơn với việc sử dụng gỗ tự nhiên.</p><h3>2. Sustainable Design</h3><p>Sử dụng vật liệu tái chế, thân thiện môi trường.</p>	Cập nhật 5 xu hướng nội thất nổi bật năm 2024: Minimalism 2.0, Thiết kế bền vững, Màu sắc trung tính và nhiều hơn nữa.	/data/uploads/images/61a79245-5755-4c0c-8ffa-285a4aeca01b.jpg	4	t	2025-10-03 15:28:37.048548	2025-10-03 15:40:01.251936	0	Top 5 xu hướng nội thất năm 2024 - Cập nhật mới nhất	Khám phá 5 xu hướng nội thất hot nhất năm 2024: Minimalism, Sustainable Design, màu sắc trung tính. Cập nhật xu hướng mới nhất.	xu hướng nội thất 2024, thiết kế bền vững, nội thất hiện đại		xu-huong-noi-that-2024
5	Nhà cấp 4 mái thái 150m2	<h2>Thiết kế nhà cấp 4 mái thái hiện đại</h2><p>Mẫu nhà cấp 4 mái thái diện tích 150m2 phù hợp với gia đình 4-5 người, tiết kiệm chi phí xây dựng.</p><p>Ưu điểm:</p><ul><li>Chi phí xây dựng thấp</li><li>Thi công nhanh chóng</li><li>Không gian thoáng mát</li><li>Dễ dàng mở rộng sau này</li></ul><p>Bố trí: 3 phòng ngủ, 2 WC, phòng khách, bếp ăn.</p>	Mẫu nhà cấp 4 mái thái 150m2 đẹp, hiện đại, tiết kiệm chi phí. Thiết kế 3 phòng ngủ, phù hợp gia đình 4-5 người.	/data/uploads/images/c2cee6f9-4f80-47c7-be31-c5f8a61befa5.jpg	4	t	2025-10-03 15:28:37.048548	2025-10-03 15:40:04.611125	0	Nhà cấp 4 mái thái 150m2 - Đẹp, tiết kiệm, hiện đại	Thiết kế nhà cấp 4 mái thái 150m2, 3 phòng ngủ đẹp hiện đại. Chi phí thi công thấp, phù hợp gia đình 4-5 người. Xem thiết kế chi tiết.	nhà cấp 4 mái thái, thiết kế 150m2, nhà 3 phòng ngủ		nha-cap-4-mai-thai-150m2
6	Test	<p>TEst</p><figure class="image"><img style="aspect-ratio:2659/984;" src="/data/uploads/images/2f8beaf3-65cc-4fcb-b781-da0f64a00cf1.png" width="2659" height="984"></figure>	Test	/data/uploads/images/d05b2e8d-f2a8-489e-86c8-d769ec078d49.jpg	4	t	2025-10-08 09:40:36.472293	2025-10-09 16:36:33.6967	0					
1	Thiết kế biệt thự hiện đại 2 tầng	<h2>Xu hướng thiết kế biệt thự hiện đại</h2><p>Biệt thự hiện đại 2 tầng đang là xu hướng được nhiều gia đình lựa chọn. Với không gian rộng rãi, thoáng mát và thiết kế tối ưu.</p><p>Các đặc điểm nổi bật:</p><ul><li>Mặt tiền rộng 10-15m</li><li>Diện tích từ 200-300m2</li><li>Phong cách tối giản, hiện đại</li><li>Sử dụng vật liệu cao cấp</li></ul>	Thiết kế biệt thự hiện đại 2 tầng với phong cách tối giản, sử dụng vật liệu cao cấp, tạo không gian sống lý tưởng cho gia đình.	/data/uploads/images/a0c85d04-43f0-491d-9742-18b959f6af98.jpg	4	t	2025-10-03 15:28:37.048548	2025-10-03 15:39:33.905431	1	Thiết kế biệt thự hiện đại 2 tầng - Xu hướng 2024	Khám phá mẫu thiết kế biệt thự hiện đại 2 tầng đẹp, sang trọng với phong cách tối giản. Tư vấn miễn phí, báo giá chi tiết.	biệt thự hiện đại, thiết kế 2 tầng, nhà đẹp		thiet-ke-biet-thu-hien-dai-2-tang
\.


--
-- TOC entry 3457 (class 0 OID 139291)
-- Dependencies: 231
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_images (id, product_id, image_url, display_order, alt_text, is_primary, created_at) FROM stdin;
3	2	http://localhost:8080/data/uploads/images/a9d3ba92-46a0-4dde-b1f5-5e793ce04387.jpg	1		f	2025-10-08 09:51:40.029679
4	1	http://localhost:8080/data/uploads/images/c5e715e6-f80d-424b-a6d1-5adba0e527b3.jpg	0		t	2025-10-08 13:43:08.99601
5	1	http://localhost:8080/data/uploads/images/5d231ff6-9995-447c-a95d-d89fd953c461.jpg	1		f	2025-10-08 13:43:09.240015
6	1	http://localhost:8080/data/uploads/images/684ba26d-a268-4b7e-a1d5-f2512508e995.jpg	2		f	2025-10-08 13:43:09.314533
\.


--
-- TOC entry 3455 (class 0 OID 139270)
-- Dependencies: 229
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, title, content, summary, thumbnail_url, category_id, published, views, meta_title, meta_description, focus_keywords, og_image_url, slug, created_at, updated_at) FROM stdin;
1	Thiết kế biệt thự hiện đại 2 tầng	<h2>Mô tả sản phẩm</h2><p>Thiết kế biệt thự hiện đại 2 tầng với phong cách tối giản, sử dụng vật liệu cao cấp.</p>	Thiết kế biệt thự hiện đại 2 tầng với phong cách tối giản	/data/uploads/images/327d9b72-c1c1-4a12-b37c-20fedcbe40f0.jpg	6	t	0	Thiết kế biệt thự hiện đại 2 tầng - Cao cấp	Thiết kế biệt thự hiện đại 2 tầng với phong cách tối giản, sử dụng vật liệu cao cấp, giá ưu đãi	biệt thự hiện đại, thiết kế 2 tầng, nhà đẹp		thiet-ke-biet-thu-hien-dai-2-tang	2025-10-06 09:38:58.915168	2025-10-08 13:43:08.666956
3	Mẫu nhà hiện đại 2 tầng mái bằng	<h2>Thiết kế nhà hiện đại 2 tầng</h2><p>Mẫu nhà 2 tầng mái bằng với thiết kế hiện đại, tối giản. Diện tích xây dựng 8x15m, phù hợp đất hẹp.</p><h3>Đặc điểm nổi bật</h3><ul><li>Mặt tiền rộng 8m, chiều sâu 15m</li><li>Thiết kế mái bằng hiện đại</li><li>3 phòng ngủ, 2 WC</li><li>Phòng khách thông tầng</li><li>Sân thượng rộng rãi</li></ul>	Mẫu nhà 2 tầng mái bằng hiện đại, diện tích 8x15m, thiết kế tối giản với 3 phòng ngủ, phù hợp đất hẹp.	/data/uploads/images/a0c85d04-43f0-491d-9742-18b959f6af98.jpg	9	t	157	Mẫu nhà hiện đại 2 tầng mái bằng 8x15m - Thiết kế tối giản	Mẫu nhà 2 tầng mái bằng hiện đại 8x15m, 3 phòng ngủ, thiết kế tối giản đẹp. Tư vấn miễn phí, báo giá chi tiết.	nhà 2 tầng mái bằng, nhà hiện đại, thiết kế 8x15m		mau-nha-hien-dai-2-tang-mai-bang	2025-10-08 16:00:38.659941	2025-10-10 22:48:19.952566
2	Test	<p>test</p>	test	/data/uploads/images/9928c99f-5adb-4a96-a710-712e52fd1c91.jpg	6	t	0						2025-10-08 09:51:39.394027	2025-10-08 15:15:24.248748
5	Nhà sang trọng 2 tầng tân cổ điển	<h2>Biệt thự tân cổ điển sang trọng</h2><p>Mẫu nhà 2 tầng phong cách tân cổ điển với kiến trúc uy nghi, sang trọng. Diện tích 10x18m.</p><h3>Điểm nhấn kiến trúc</h3><ul><li>Cột trụ La Mã uy nghi</li><li>Hoa văn chạm khắc tinh xảo</li><li>4 phòng ngủ rộng rãi</li><li>Phòng khách cao 2 tầng</li><li>Ban công Pháp lãng mạn</li></ul><p>Nội thất cao cấp, gỗ tự nhiên, đá marble nhập khẩu.</p>	Nhà 2 tầng tân cổ điển 10x18m sang trọng, kiến trúc La Mã uy nghi, 4 phòng ngủ, nội thất cao cấp.	http://localhost:8080/data/uploads/images/962d09d0-46ce-480c-a458-6e94ecb3bc35.jpg	10	t	289	Nhà 2 tầng tân cổ điển 10x18m - Sang trọng uy nghi	Thiết kế nhà 2 tầng tân cổ điển 10x18m sang trọng, cột La Mã uy nghi, 4 phòng ngủ. Nội thất cao cấp, đá marble.	nhà tân cổ điển, nhà sang trọng, thiết kế 10x18m	\N	nha-sang-trong-2-tang-tan-co-dien	2025-10-08 16:00:38.659941	2025-10-08 16:00:38.659941
4	Thiết kế nhà phố 3 tầng hiện đại	<h2>Nhà phố 3 tầng phong cách hiện đại</h2><p>Thiết kế nhà phố 3 tầng hiện đại với không gian mở, tận dụng tối đa ánh sáng tự nhiên. Diện tích 5x20m.</p><h3>Bố trí không gian</h3><figure class="image"><img style="aspect-ratio:2000/1127;" src="/data/uploads/images/7982c1ea-0efe-4002-a46f-a4a864db74ff.jpg" width="2000" height="1127"></figure><ul><li>Tầng 1: Gara xe, phòng khách, bếp</li><li>Tầng 2: 2 phòng ngủ master</li><li>Tầng 3: Phòng thờ, phòng đa năng</li><li>Sân thượng: Khu vực thư giãn</li></ul><p>Mặt tiền sử dụng kính và nhôm kính cao cấp, tạo vẻ sang trọng.</p>	Nhà phố 3 tầng 5x20m thiết kế hiện đại, tối ưu không gian, 2 phòng ngủ master, phòng thờ, sân thượng.	/data/uploads/images/b870b6db-0ade-42f5-8c56-829f92923593.jpg	8	t	203	Nhà phố 3 tầng hiện đại 5x20m - Thiết kế tối ưu ánh sáng	Thiết kế nhà phố 3 tầng hiện đại 5x20m, tối ưu ánh sáng tự nhiên. Mặt tiền kính sang trọng, bố trí khoa học.	nhà phố 3 tầng, thiết kế hiện đại, nhà 5x20m		thiet-ke-nha-pho-3-tang-hien-dai	2025-10-08 16:00:38.659941	2025-10-09 15:38:11.767389
\.


--
-- TOC entry 3461 (class 0 OID 147476)
-- Dependencies: 235
-- Data for Name: visitors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visitors (id, ip_address, user_agent, page_url, referrer, visit_date, created_at) FROM stdin;
\.


--
-- TOC entry 3481 (class 0 OID 0)
-- Dependencies: 214
-- Name: admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_id_seq', 1, true);


--
-- TOC entry 3482 (class 0 OID 0)
-- Dependencies: 226
-- Name: articles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.articles_id_seq', 1, false);


--
-- TOC entry 3483 (class 0 OID 0)
-- Dependencies: 216
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 10, true);


--
-- TOC entry 3484 (class 0 OID 0)
-- Dependencies: 232
-- Name: consultations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.consultations_id_seq', 5, true);


--
-- TOC entry 3485 (class 0 OID 0)
-- Dependencies: 224
-- Name: footer_content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.footer_content_id_seq', 1, true);


--
-- TOC entry 3486 (class 0 OID 0)
-- Dependencies: 222
-- Name: global_seo_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.global_seo_settings_id_seq', 1, true);


--
-- TOC entry 3487 (class 0 OID 0)
-- Dependencies: 220
-- Name: home_content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.home_content_id_seq', 1, true);


--
-- TOC entry 3488 (class 0 OID 0)
-- Dependencies: 218
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.posts_id_seq', 6, true);


--
-- TOC entry 3489 (class 0 OID 0)
-- Dependencies: 230
-- Name: product_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_images_id_seq', 6, true);


--
-- TOC entry 3490 (class 0 OID 0)
-- Dependencies: 228
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 5, true);


--
-- TOC entry 3491 (class 0 OID 0)
-- Dependencies: 234
-- Name: visitors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visitors_id_seq', 1, false);


--
-- TOC entry 3251 (class 2606 OID 131099)
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- TOC entry 3253 (class 2606 OID 131101)
-- Name: admin admin_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_username_key UNIQUE (username);


--
-- TOC entry 3267 (class 2606 OID 131216)
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- TOC entry 3269 (class 2606 OID 131218)
-- Name: articles articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_slug_key UNIQUE (slug);


--
-- TOC entry 3255 (class 2606 OID 131116)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3257 (class 2606 OID 131118)
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- TOC entry 3282 (class 2606 OID 147472)
-- Name: consultations consultations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_pkey PRIMARY KEY (id);


--
-- TOC entry 3265 (class 2606 OID 131202)
-- Name: footer_content footer_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.footer_content
    ADD CONSTRAINT footer_content_pkey PRIMARY KEY (id);


--
-- TOC entry 3263 (class 2606 OID 131187)
-- Name: global_seo_settings global_seo_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.global_seo_settings
    ADD CONSTRAINT global_seo_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3261 (class 2606 OID 131176)
-- Name: home_content home_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_content
    ADD CONSTRAINT home_content_pkey PRIMARY KEY (id);


--
-- TOC entry 3259 (class 2606 OID 131160)
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- TOC entry 3280 (class 2606 OID 139301)
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- TOC entry 3274 (class 2606 OID 139282)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 3276 (class 2606 OID 139284)
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- TOC entry 3288 (class 2606 OID 147485)
-- Name: visitors visitors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visitors
    ADD CONSTRAINT visitors_pkey PRIMARY KEY (id);


--
-- TOC entry 3283 (class 1259 OID 147473)
-- Name: idx_consultations_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_created_at ON public.consultations USING btree (created_at DESC);


--
-- TOC entry 3284 (class 1259 OID 147474)
-- Name: idx_consultations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_status ON public.consultations USING btree (status);


--
-- TOC entry 3277 (class 1259 OID 139311)
-- Name: idx_product_images_display_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_images_display_order ON public.product_images USING btree (display_order);


--
-- TOC entry 3278 (class 1259 OID 139310)
-- Name: idx_product_images_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_images_product_id ON public.product_images USING btree (product_id);


--
-- TOC entry 3270 (class 1259 OID 139307)
-- Name: idx_products_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_category_id ON public.products USING btree (category_id);


--
-- TOC entry 3271 (class 1259 OID 139308)
-- Name: idx_products_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_published ON public.products USING btree (published);


--
-- TOC entry 3272 (class 1259 OID 139309)
-- Name: idx_products_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_slug ON public.products USING btree (slug);


--
-- TOC entry 3285 (class 1259 OID 147487)
-- Name: idx_visitors_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visitors_date ON public.visitors USING btree (visit_date);


--
-- TOC entry 3286 (class 1259 OID 147486)
-- Name: idx_visitors_ip_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visitors_ip_date ON public.visitors USING btree (ip_address, visit_date);


--
-- TOC entry 3295 (class 2620 OID 139313)
-- Name: products trigger_update_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_products_updated_at();


--
-- TOC entry 3291 (class 2606 OID 131219)
-- Name: articles articles_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.admin(id);


--
-- TOC entry 3292 (class 2606 OID 131224)
-- Name: articles articles_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- TOC entry 3289 (class 2606 OID 131119)
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- TOC entry 3290 (class 2606 OID 131161)
-- Name: posts posts_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- TOC entry 3294 (class 2606 OID 139302)
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3293 (class 2606 OID 139285)
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


-- Completed on 2025-10-11 10:09:47 +07

--
-- PostgreSQL database dump complete
--

