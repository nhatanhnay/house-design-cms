--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12 (Ubuntu 15.12-1.pgdg20.04+1)
-- Dumped by pg_dump version 15.12 (Ubuntu 15.12-1.pgdg20.04+1)

-- Started on 2025-10-03 19:01:23 +07

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
-- TOC entry 3390 (class 1262 OID 131090)
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
-- TOC entry 3391 (class 0 OID 0)
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
-- TOC entry 3392 (class 0 OID 0)
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
-- TOC entry 3393 (class 0 OID 0)
-- Dependencies: 216
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


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
-- TOC entry 3394 (class 0 OID 0)
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
-- TOC entry 3395 (class 0 OID 0)
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
-- TOC entry 3396 (class 0 OID 0)
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
-- TOC entry 3397 (class 0 OID 0)
-- Dependencies: 218
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- TOC entry 3175 (class 2604 OID 131095)
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- TOC entry 3200 (class 2604 OID 131208)
-- Name: articles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles ALTER COLUMN id SET DEFAULT nextval('public.articles_id_seq'::regclass);


--
-- TOC entry 3176 (class 2604 OID 131106)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 3195 (class 2604 OID 131194)
-- Name: footer_content id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.footer_content ALTER COLUMN id SET DEFAULT nextval('public.footer_content_id_seq'::regclass);


--
-- TOC entry 3192 (class 2604 OID 131181)
-- Name: global_seo_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.global_seo_settings ALTER COLUMN id SET DEFAULT nextval('public.global_seo_settings_id_seq'::regclass);


--
-- TOC entry 3189 (class 2604 OID 131170)
-- Name: home_content id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_content ALTER COLUMN id SET DEFAULT nextval('public.home_content_id_seq'::regclass);


--
-- TOC entry 3184 (class 2604 OID 131153)
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- TOC entry 3372 (class 0 OID 131092)
-- Dependencies: 215
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin (id, username, password) FROM stdin;
1	admin	$2a$10$ckAcDox.pvuap8zjxm2z4uzMONDQxcvgHEvVnLiPkMFvMs4p0bS/C
\.


--
-- TOC entry 3384 (class 0 OID 131205)
-- Dependencies: 227
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.articles (id, title, content, summary, featured_image_url, category_id, published, tags, meta_title, meta_description, slug, author_id, view_count, created_at, updated_at, focus_keywords, og_image_url, canonical_url) FROM stdin;
\.


--
-- TOC entry 3374 (class 0 OID 131103)
-- Dependencies: 217
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, slug, description, thumbnail_url, category_type, parent_id, level, order_index, is_active, created_at, updated_at, display_order, meta_title, meta_description, meta_keywords, og_image_url) FROM stdin;
3	Dự án thực tế	du-an-thuc-te	Dự án thực tế	/data/uploads/images/b870b6db-0ade-42f5-8c56-829f92923593.jpg	parent	\N	0	3	t	2025-10-03 10:11:16.248993	2025-10-03 14:40:45.006807	3				
4	Tin tức	tin-tuc	Tin tức về kiến trúc	http://localhost:8080/data/uploads/images/61a79245-5755-4c0c-8ffa-285a4aeca01b.jpg	regular	\N	0	4	t	2025-10-03 10:11:16.249899	2025-10-03 14:41:19.679521	4				
5	Nhà phố	du-an-thuc-te-nha-pho			parent	3	1	1	t	2025-10-03 14:41:39.48347	2025-10-03 14:42:35.911368	5				
9	Nhà hiện đại	mau-thiet-ke-nha-hien-dai			parent	1	1	2	t	2025-10-03 14:43:04.60937	2025-10-03 14:43:04.60937	9				
8	Nhà phố	mau-thiet-ke-nha-pho			parent	1	1	1	t	2025-10-03 14:42:53.623806	2025-10-03 14:43:10.296655	8				
7	Nhà sang trọng	du-an-thuc-te-nha-sang-trong			parent	3	1	3	t	2025-10-03 14:42:19.251109	2025-10-03 14:43:16.061713	7				
6	Nhà hiện đại	du-an-thuc-te-nha-hien-dai			parent	3	1	2	t	2025-10-03 14:41:52.178555	2025-10-03 14:46:06.47194	6				
10	Nhà sang trọng	mau-thiet-ke-nha-sang-trong			parent	1	1	3	t	2025-10-03 14:43:25.269525	2025-10-03 14:46:16.987662	10				
1	Mẫu Thiết Kế	mau-thiet-ke	Các mẫu thiết kế nhà hiện đại	/data/uploads/images/a0c85d04-43f0-491d-9742-18b959f6af98.jpg	parent	\N	0	1	t	2025-10-03 10:11:16.246996	2025-10-03 14:39:03.07388	1	test 2	test		
\.


--
-- TOC entry 3382 (class 0 OID 131191)
-- Dependencies: 225
-- Data for Name: footer_content; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.footer_content (id, company_name, address, phone, email, facebook_url, instagram_url, youtube_url, linkedin_url, copyright_text, description, services, social_media, created_at, updated_at) FROM stdin;
1	MMA Architectural Design	123 Đường ABC, Phường XYZ, Quận 1, TP.HCM	0123 456 789	contact@mmadesign.com	https://facebook.com/mmadesign	https://instagram.com/mmadesign	https://youtube.com/mmadesign	https://linkedin.com/company/mmadesign	© 2024 MMA Architectural Design. All rights reserved.	Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo. Đội ngũ kiến trúc sư giàu kinh nghiệm, cam kết mang đến những công trình chất lượng cao.	["Thiết kế kiến trúc", "Thi công xây dựng", "Nội thất cao cấp", "Tư vấn phong thủy"]	[{"name":"Facebook","url":"https://facebook.com/mmadesign","icon":"facebook"},{"name":"Instagram","url":"https://instagram.com/mmadesign","icon":"photo_camera"},{"name":"YouTube","url":"https://youtube.com/mmadesign","icon":"play_circle"},{"name":"LinkedIn","url":"https://linkedin.com/company/mmadesign","icon":"business"}]	2025-10-03 10:11:16.252209	2025-10-03 10:11:16.252209
\.


--
-- TOC entry 3380 (class 0 OID 131178)
-- Dependencies: 223
-- Data for Name: global_seo_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.global_seo_settings (id, site_name, default_meta_title, default_meta_description, default_og_image_url, google_analytics_id, google_search_console_id, facebook_app_id, twitter_handle, company_name, company_description, company_address, company_phone, company_email, company_logo_url, business_hours, created_at, updated_at) FROM stdin;
1	MMA Architectural Design	MMA Architectural Design - Thiết Kế & Thi Công Biệt Thự	Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo. Uy tín tại 37 tỉnh thành, hơn 500 dự án hoàn thành.						MMA Architectural Design	Công ty chuyên thiết kế và thi công biệt thự, nhà ở cao cấp	123 Đường ABC, Quận XYZ, TP.HCM	0123 456 789	contact@mma-design.com		Mo-Fr 08:00-17:00, Sa 08:00-12:00	2025-10-03 10:11:16.192344	2025-10-03 10:11:16.192344
\.


--
-- TOC entry 3378 (class 0 OID 131167)
-- Dependencies: 221
-- Data for Name: home_content; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.home_content (id, hero_title, hero_description, hero_stat1_number, hero_stat1_label, hero_stat2_number, hero_stat2_label, created_at, updated_at, features_title, features_description, features_logo_url, feature1_icon, feature1_title, feature1_description, feature2_icon, feature2_title, feature2_description, feature3_icon, feature3_title, feature3_description, feature4_icon, feature4_title, feature4_description) FROM stdin;
1	MMA Architectural Design	Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo	37	Tỉnh Thành Phủ Sóng	500+	Dự Án Biệt Thự/Nhà Ở Chuyên Nghiệp	2025-10-03 10:11:16.251057	2025-10-03 10:11:16.251057	Ưu Thế MMA Architectural Design			architecture	Thiết Kế Kiến Trúc Độc Đáo	Chuyên gia kiến trúc sư với hơn 10 năm kinh nghiệm, tạo ra những công trình biệt thự và nhà ở đẳng cấp.	engineering	Thi Công Chất Lượng Cao	Đội ngũ kỹ sư và công nhân tay nghề cao, sử dụng công nghệ hiện đại trong thi công.	business	Dịch Vụ Toàn Diện	Từ thiết kế kiến trúc, nội thất đến giám sát thi công và bàn giao hoàn thiện.	verified	Uy Tín 37 Tỉnh Thành	Đã hoàn thành hơn 500 dự án biệt thự và nhà ở trên toàn quốc, được khách hàng tin tưởng.
\.


--
-- TOC entry 3376 (class 0 OID 131150)
-- Dependencies: 219
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, title, content, summary, image_url, category_id, published, created_at, updated_at, views, meta_title, meta_description, focus_keywords, og_image_url, slug) FROM stdin;
1	Thiết kế biệt thự hiện đại 2 tầng	<h2>Xu hướng thiết kế biệt thự hiện đại</h2><p>Biệt thự hiện đại 2 tầng đang là xu hướng được nhiều gia đình lựa chọn. Với không gian rộng rãi, thoáng mát và thiết kế tối ưu.</p><p>Các đặc điểm nổi bật:</p><ul><li>Mặt tiền rộng 10-15m</li><li>Diện tích từ 200-300m2</li><li>Phong cách tối giản, hiện đại</li><li>Sử dụng vật liệu cao cấp</li></ul>	Thiết kế biệt thự hiện đại 2 tầng với phong cách tối giản, sử dụng vật liệu cao cấp, tạo không gian sống lý tưởng cho gia đình.	/data/uploads/images/a0c85d04-43f0-491d-9742-18b959f6af98.jpg	4	t	2025-10-03 15:28:37.048548	2025-10-03 15:39:33.905431	0	Thiết kế biệt thự hiện đại 2 tầng - Xu hướng 2024	Khám phá mẫu thiết kế biệt thự hiện đại 2 tầng đẹp, sang trọng với phong cách tối giản. Tư vấn miễn phí, báo giá chi tiết.	biệt thự hiện đại, thiết kế 2 tầng, nhà đẹp		thiet-ke-biet-thu-hien-dai-2-tang
2	Nhà phố 3 tầng phong cách Nhật Bản	<h2>Phong cách Nhật Bản cho nhà phố</h2><p>Nhà phố 3 tầng theo phong cách Nhật Bản mang đến sự hài hòa giữa truyền thống và hiện đại.</p><p>Đặc trưng thiết kế:</p><ul><li>Không gian mở, thông thoáng</li><li>Sử dụng gỗ tự nhiên</li><li>Vườn mini trong nhà</li><li>Ánh sáng tự nhiên tối đa</li></ul>	Nhà phố 3 tầng phong cách Nhật Bản với thiết kế tinh tế, tối ưu không gian, mang đến sự yên bình và thoải mái.	/data/uploads/images/b870b6db-0ade-42f5-8c56-829f92923593.jpg	4	t	2025-10-03 15:28:37.048548	2025-10-03 15:39:42.01262	0	Nhà phố 3 tầng phong cách Nhật Bản - Tinh tế & Hiện đại	Mẫu nhà phố 3 tầng phong cách Nhật Bản đẹp, tối ưu không gian. Thiết kế tinh tế, hài hòa giữa truyền thống và hiện đại.	nhà phố Nhật Bản, thiết kế 3 tầng, phong cách Nhật		nha-pho-3-tang-phong-cach-nhat-ban
3	Biệt thự sân vườn 1 tầng tại Đà Nẵng	<h2>Dự án biệt thự sân vườn tại Đà Nẵng</h2><p>Dự án biệt thự sân vườn 1 tầng rộng 500m2 tại khu đô thị mới Đà Nẵng vừa hoàn thành.</p><p>Thông tin dự án:</p><ul><li>Diện tích: 500m2</li><li>Phong cách: Tropical Modern</li><li>Thời gian thi công: 8 tháng</li><li>Chi phí: 5.2 tỷ VNĐ</li></ul>	Dự án biệt thự sân vườn 1 tầng tại Đà Nẵng với phong cách Tropical Modern, diện tích 500m2, hoàn thành sau 8 tháng thi công.	/data/uploads/images/962d09d0-46ce-480c-a458-6e94ecb3bc35.jpg	4	t	2025-10-03 15:28:37.048548	2025-10-03 15:39:47.328082	0	Biệt thú sân vườn 1 tầng Đà Nẵng - Dự án hoàn thành 2024	Dự án biệt thự sân vườn 1 tầng tại Đà Nẵng, diện tích 500m2, phong cách Tropical Modern. Xem ảnh thực tế và chi phí thi công.	biệt thự Đà Nẵng, sân vườn 1 tầng, dự án hoàn thành		biet-thu-san-vuon-1-tang-da-nang
4	Xu hướng nội thất năm 2024	<h2>Top 5 xu hướng nội thất 2024</h2><p>Năm 2024 đánh dấu sự trở lại của các phong cách thiết kế bền vững và thân thiện với môi trường.</p><h3>1. Minimalism 2.0</h3><p>Tối giản nhưng ấm áp hơn với việc sử dụng gỗ tự nhiên.</p><h3>2. Sustainable Design</h3><p>Sử dụng vật liệu tái chế, thân thiện môi trường.</p>	Cập nhật 5 xu hướng nội thất nổi bật năm 2024: Minimalism 2.0, Thiết kế bền vững, Màu sắc trung tính và nhiều hơn nữa.	/data/uploads/images/61a79245-5755-4c0c-8ffa-285a4aeca01b.jpg	4	t	2025-10-03 15:28:37.048548	2025-10-03 15:40:01.251936	0	Top 5 xu hướng nội thất năm 2024 - Cập nhật mới nhất	Khám phá 5 xu hướng nội thất hot nhất năm 2024: Minimalism, Sustainable Design, màu sắc trung tính. Cập nhật xu hướng mới nhất.	xu hướng nội thất 2024, thiết kế bền vững, nội thất hiện đại		xu-huong-noi-that-2024
5	Nhà cấp 4 mái thái 150m2	<h2>Thiết kế nhà cấp 4 mái thái hiện đại</h2><p>Mẫu nhà cấp 4 mái thái diện tích 150m2 phù hợp với gia đình 4-5 người, tiết kiệm chi phí xây dựng.</p><p>Ưu điểm:</p><ul><li>Chi phí xây dựng thấp</li><li>Thi công nhanh chóng</li><li>Không gian thoáng mát</li><li>Dễ dàng mở rộng sau này</li></ul><p>Bố trí: 3 phòng ngủ, 2 WC, phòng khách, bếp ăn.</p>	Mẫu nhà cấp 4 mái thái 150m2 đẹp, hiện đại, tiết kiệm chi phí. Thiết kế 3 phòng ngủ, phù hợp gia đình 4-5 người.	/data/uploads/images/c2cee6f9-4f80-47c7-be31-c5f8a61befa5.jpg	4	t	2025-10-03 15:28:37.048548	2025-10-03 15:40:04.611125	0	Nhà cấp 4 mái thái 150m2 - Đẹp, tiết kiệm, hiện đại	Thiết kế nhà cấp 4 mái thái 150m2, 3 phòng ngủ đẹp hiện đại. Chi phí thi công thấp, phù hợp gia đình 4-5 người. Xem thiết kế chi tiết.	nhà cấp 4 mái thái, thiết kế 150m2, nhà 3 phòng ngủ		nha-cap-4-mai-thai-150m2
\.


--
-- TOC entry 3398 (class 0 OID 0)
-- Dependencies: 214
-- Name: admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_id_seq', 1, true);


--
-- TOC entry 3399 (class 0 OID 0)
-- Dependencies: 226
-- Name: articles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.articles_id_seq', 1, false);


--
-- TOC entry 3400 (class 0 OID 0)
-- Dependencies: 216
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 10, true);


--
-- TOC entry 3401 (class 0 OID 0)
-- Dependencies: 224
-- Name: footer_content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.footer_content_id_seq', 1, true);


--
-- TOC entry 3402 (class 0 OID 0)
-- Dependencies: 222
-- Name: global_seo_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.global_seo_settings_id_seq', 1, true);


--
-- TOC entry 3403 (class 0 OID 0)
-- Dependencies: 220
-- Name: home_content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.home_content_id_seq', 1, true);


--
-- TOC entry 3404 (class 0 OID 0)
-- Dependencies: 218
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.posts_id_seq', 5, true);


--
-- TOC entry 3206 (class 2606 OID 131099)
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- TOC entry 3208 (class 2606 OID 131101)
-- Name: admin admin_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_username_key UNIQUE (username);


--
-- TOC entry 3222 (class 2606 OID 131216)
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- TOC entry 3224 (class 2606 OID 131218)
-- Name: articles articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_slug_key UNIQUE (slug);


--
-- TOC entry 3210 (class 2606 OID 131116)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3212 (class 2606 OID 131118)
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- TOC entry 3220 (class 2606 OID 131202)
-- Name: footer_content footer_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.footer_content
    ADD CONSTRAINT footer_content_pkey PRIMARY KEY (id);


--
-- TOC entry 3218 (class 2606 OID 131187)
-- Name: global_seo_settings global_seo_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.global_seo_settings
    ADD CONSTRAINT global_seo_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3216 (class 2606 OID 131176)
-- Name: home_content home_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_content
    ADD CONSTRAINT home_content_pkey PRIMARY KEY (id);


--
-- TOC entry 3214 (class 2606 OID 131160)
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- TOC entry 3227 (class 2606 OID 131219)
-- Name: articles articles_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.admin(id);


--
-- TOC entry 3228 (class 2606 OID 131224)
-- Name: articles articles_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- TOC entry 3225 (class 2606 OID 131119)
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- TOC entry 3226 (class 2606 OID 131161)
-- Name: posts posts_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


-- Completed on 2025-10-03 19:01:28 +07

--
-- PostgreSQL database dump complete
--

