--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 17.4

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

--
-- Name: create_index_if_not_exists(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_index_if_not_exists(table_name text, index_name text, index_def text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = index_name AND n.nspname = 'public') THEN
    EXECUTE 'CREATE INDEX ' || quote_ident(index_name) || ' ON ' || quote_ident(table_name) || ' ' || index_def;
  END IF;
END;
$$;


ALTER FUNCTION public.create_index_if_not_exists(table_name text, index_name text, index_def text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: dishes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dishes (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    price double precision NOT NULL,
    category text NOT NULL,
    menu_id integer,
    image_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.dishes OWNER TO postgres;

--
-- Name: dishes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dishes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dishes_id_seq OWNER TO postgres;

--
-- Name: dishes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dishes_id_seq OWNED BY public.dishes.id;


--
-- Name: event_menus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_menus (
    event_id integer NOT NULL,
    menu_id integer NOT NULL
);


ALTER TABLE public.event_menus OWNER TO postgres;

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    image_url text NOT NULL,
    location text,
    event_type text NOT NULL,
    menu_options integer DEFAULT 2 NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_id_seq OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: menu_dishes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_dishes (
    menu_id integer NOT NULL,
    dish_id integer NOT NULL
);


ALTER TABLE public.menu_dishes OWNER TO postgres;

--
-- Name: menus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menus (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    price double precision NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    image_url text
);


ALTER TABLE public.menus OWNER TO postgres;

--
-- Name: menus_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.menus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menus_id_seq OWNER TO postgres;

--
-- Name: menus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.menus_id_seq OWNED BY public.menus.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer NOT NULL,
    event_id integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    date timestamp without time zone NOT NULL,
    guest_count integer NOT NULL,
    menu_selection text,
    total_amount double precision NOT NULL,
    additional_info text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    admin_notes text,
    venue_id integer,
    room_id integer,
    waiter_fee double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rooms (
    id integer NOT NULL,
    venue_id integer NOT NULL,
    name text NOT NULL,
    capacity integer NOT NULL,
    description text,
    status text DEFAULT 'available'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rooms OWNER TO postgres;

--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rooms_id_seq OWNER TO postgres;

--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    version character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO postgres;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    key text NOT NULL,
    value text NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'client'::text NOT NULL,
    phone text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
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
-- Name: venues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.venues (
    id integer NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    capacity integer NOT NULL,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.venues OWNER TO postgres;

--
-- Name: venues_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.venues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.venues_id_seq OWNER TO postgres;

--
-- Name: venues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.venues_id_seq OWNED BY public.venues.id;


--
-- Name: dishes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes ALTER COLUMN id SET DEFAULT nextval('public.dishes_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: menus id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menus ALTER COLUMN id SET DEFAULT nextval('public.menus_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: venues id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venues ALTER COLUMN id SET DEFAULT nextval('public.venues_id_seq'::regclass);


--
-- Data for Name: dishes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dishes (id, name, description, price, category, menu_id, image_url, created_at) FROM stdin;
1	Café	Café 100% arábica, torrado e moído na hora	5	BEBIDAS	1	\N	2025-04-16 17:25:22.027199
2	Leite	Leite integral ou desnatado quente	4	BEBIDAS	1	\N	2025-04-16 17:25:22.027199
3	Chocolate quente	Chocolate quente cremoso com chocolate belga	6	BEBIDAS	1	\N	2025-04-16 17:25:22.027199
4	Suco de laranja	Suco de laranja natural espremido na hora	5	BEBIDAS	1	\N	2025-04-16 17:25:22.027199
5	Água mineral com e sem gás	Água mineral natural ou com gás em garrafas individuais	3	BEBIDAS	1	\N	2025-04-16 17:25:22.027199
6	Mini croissant	Mini croissant folhado e crocante	4.5	SNACKS	1	\N	2025-04-16 17:25:22.027199
7	Mini pão de queijo	Mini pão de queijo quentinho e macio	3.5	SNACKS	1	\N	2025-04-16 17:25:22.027199
8	Mini folhado de frango	Mini folhado recheado com frango cremoso	5	SNACKS	1	\N	2025-04-16 17:25:22.027199
9	Mini sanduíche de peito de peru	Mini sanduíche com peito de peru, queijo e alface	6	MINI SANDUICHES	1	\N	2025-04-16 17:25:22.027199
10	Mini sanduíche de presunto e queijo	Mini sanduíche com presunto, queijo e tomate	5	MINI SANDUICHES	1	\N	2025-04-16 17:25:22.027199
11	Bolo de chocolate	Bolo de chocolate fofinho com cobertura de ganache	7	BOLOS	1	\N	2025-04-16 17:25:22.027199
12	Bolo de laranja	Bolo de laranja com calda cítrica	6	BOLOS	1	\N	2025-04-16 17:25:22.027199
13	Mini brownie	Mini brownie de chocolate meio amargo	4	SOBREMESAS	1	\N	2025-04-16 17:25:22.027199
14	Petit four doce	Variedade de petit fours doces artesanais	3.5	SOBREMESAS	1	\N	2025-04-16 17:25:22.027199
15	Café	Café 100% arábica	4	BEBIDAS	2	\N	2025-04-16 17:25:22.027199
16	Leite	Leite integral ou desnatado quente	3	BEBIDAS	2	\N	2025-04-16 17:25:22.027199
17	Chocolate quente	Chocolate quente cremoso	5	BEBIDAS	2	\N	2025-04-16 17:25:22.027199
18	Suco de laranja	Suco de laranja natural	4	BEBIDAS	2	\N	2025-04-16 17:25:22.027199
19	Água mineral com e sem gás	Água mineral natural ou com gás	2.5	BEBIDAS	2	\N	2025-04-16 17:25:22.027199
20	Mini pão de queijo	Mini pão de queijo tradicional	3	SNACKS	2	\N	2025-04-16 17:25:22.027199
21	Mini folhado de frango	Mini folhado com recheio de frango	4	SNACKS	2	\N	2025-04-16 17:25:22.027199
22	Mini sanduíche de presunto e queijo	Mini sanduíche tradicional de presunto e queijo	4.5	MINI SANDUICHES	2	\N	2025-04-16 17:25:22.027199
23	Bolo de chocolate	Bolo de chocolate com cobertura	6	BOLOS	2	\N	2025-04-16 17:25:22.027199
24	Bolo de laranja	Bolo de laranja tradicional	5	BOLOS	2	\N	2025-04-16 17:25:22.027199
25	Mini brownie	Mini brownie de chocolate	3.5	SOBREMESAS	2	\N	2025-04-16 17:25:22.027199
26	Café	Café tradicional	3	BEBIDAS	3	\N	2025-04-16 17:25:22.027199
27	Leite	Leite quente	2.5	BEBIDAS	3	\N	2025-04-16 17:25:22.027199
28	Água mineral com e sem gás	Água mineral	2	BEBIDAS	3	\N	2025-04-16 17:25:22.027199
29	Mini pão de queijo	Mini pão de queijo	2.5	SNACKS	3	\N	2025-04-16 17:25:22.027199
30	Mini sanduíche de presunto e queijo	Mini sanduíche simples	4	MINI SANDUICHES	3	\N	2025-04-16 17:25:22.027199
31	Bolo de chocolate	Bolo de chocolate simples	5	BOLOS	3	\N	2025-04-16 17:25:22.027199
32	Café Gourmet	Café gourmet especial, torrado e moído na hora	7	BEBIDAS	4	\N	2025-04-16 17:25:22.682035
33	Leite Integral/Desnatado	Leite orgânico quente	5	BEBIDAS	4	\N	2025-04-16 17:25:22.682035
34	Chocolate Belga	Chocolate quente premium com chocolate belga	8	BEBIDAS	4	\N	2025-04-16 17:25:22.682035
35	Suco de Laranja Natural	Suco de laranja orgânica espremido na hora	6	BEBIDAS	4	\N	2025-04-16 17:25:22.682035
36	Água Mineral Premium	Água mineral premium com e sem gás	4	BEBIDAS	4	\N	2025-04-16 17:25:22.682035
37	Croissant Especial	Croissant folhado artesanal	6.5	SNACKS	4	\N	2025-04-16 17:25:22.682035
38	Pão de Queijo Recheado	Pão de queijo gourmet com recheios especiais	5.5	SNACKS	4	\N	2025-04-16 17:25:22.682035
39	Mini Quiche Lorraine	Mini quiche com bacon e queijo gruyère	7	SNACKS	4	\N	2025-04-16 17:25:22.682035
40	Wrap de Salmão	Wrap com salmão defumado e cream cheese	8	MINI SANDUICHES	4	\N	2025-04-16 17:25:22.682035
41	Mini Sanduíche Gourmet	Mini sanduíche com presunto parma e brie	7.5	MINI SANDUICHES	4	\N	2025-04-16 17:25:22.682035
42	Bolo Red Velvet	Bolo red velvet com cobertura de cream cheese	9	BOLOS	4	\N	2025-04-16 17:25:22.682035
43	Bolo de Frutas Secas	Bolo artesanal com mix de frutas secas	8	BOLOS	4	\N	2025-04-16 17:25:22.682035
44	Macarons	Macarons franceses sortidos	6	SOBREMESAS	4	\N	2025-04-16 17:25:22.682035
45	Trufas Belgas	Trufas de chocolate belga	5.5	SOBREMESAS	4	\N	2025-04-16 17:25:22.682035
46	Café	Café 100% arábica	4	BEBIDAS	5	\N	2025-04-16 17:25:22.682035
47	Leite	Leite integral ou desnatado	3	BEBIDAS	5	\N	2025-04-16 17:25:22.682035
48	Suco de Laranja	Suco de laranja natural	4	BEBIDAS	5	\N	2025-04-16 17:25:22.682035
49	Pão Francês	Pão francês fresquinho	2	PAES	5	\N	2025-04-16 17:25:22.682035
50	Pão de Forma	Pão de forma tradicional	2.5	PAES	5	\N	2025-04-16 17:25:22.682035
51	Manteiga	Manteiga com ou sem sal	1.5	FRIOS	5	\N	2025-04-16 17:25:22.682035
52	Queijo Minas	Queijo minas frescal	3	FRIOS	5	\N	2025-04-16 17:25:22.682035
53	Presunto	Presunto cozido	3.5	FRIOS	5	\N	2025-04-16 17:25:22.682035
54	Bolo Simples	Bolo caseiro	4	BOLOS	5	\N	2025-04-16 17:25:22.682035
55	Frutas da Estação	Mix de frutas frescas	3	FRUTAS	5	\N	2025-04-16 17:25:22.682035
56	Café Gourmet	Café gourmet especial	6	BEBIDAS	6	\N	2025-04-16 17:25:22.682035
57	Leite Orgânico	Leite orgânico integral ou desnatado	5	BEBIDAS	6	\N	2025-04-16 17:25:22.682035
58	Suco de Laranja Natural	Suco de laranja orgânica	5	BEBIDAS	6	\N	2025-04-16 17:25:22.682035
59	Pão Integral	Pão integral artesanal	3.5	PAES	6	\N	2025-04-16 17:25:22.682035
60	Croissant	Croissant folhado	4.5	PAES	6	\N	2025-04-16 17:25:22.682035
61	Manteiga Especial	Manteiga francesa	3	FRIOS	6	\N	2025-04-16 17:25:22.682035
62	Queijo Brie	Queijo brie importado	6	FRIOS	6	\N	2025-04-16 17:25:22.682035
63	Presunto Parma	Presunto parma italiano	7	FRIOS	6	\N	2025-04-16 17:25:22.682035
64	Bolo Gourmet	Bolo gourmet do dia	6	BOLOS	6	\N	2025-04-16 17:25:22.682035
65	Salada de Frutas Especial	Salada de frutas com frutas nobres	5	FRUTAS	6	\N	2025-04-16 17:25:22.682035
66	Iogurte Natural	Iogurte natural orgânico	4	LATICINIOS	6	\N	2025-04-16 17:25:22.682035
67	Granola Artesanal	Mix de granola artesanal	4.5	CEREAIS	6	\N	2025-04-16 17:25:22.682035
68	Arroz Branco	Arroz branco soltinho	3	ACOMPANHAMENTOS	7	\N	2025-04-16 17:25:22.682035
69	Feijão Carioca	Feijão carioca temperado	3.5	ACOMPANHAMENTOS	7	\N	2025-04-16 17:25:22.682035
70	Farofa	Farofa tradicional	2.5	ACOMPANHAMENTOS	7	\N	2025-04-16 17:25:22.682035
71	Salada Verde	Mix de folhas verdes	4	SALADAS	7	\N	2025-04-16 17:25:22.682035
72	Salada de Tomate	Salada de tomate com cebola	3.5	SALADAS	7	\N	2025-04-16 17:25:22.682035
73	Frango Grelhado	Filé de frango grelhado	8	CARNES	7	\N	2025-04-16 17:25:22.682035
74	Carne Assada	Carne assada ao molho	10	CARNES	7	\N	2025-04-16 17:25:22.682035
75	Peixe ao Molho	Filé de peixe ao molho de ervas	9	PEIXES	7	\N	2025-04-16 17:25:22.682035
76	Legumes Salteados	Mix de legumes salteados	4	LEGUMES	7	\N	2025-04-16 17:25:22.682035
77	Pudim de Leite	Pudim de leite tradicional	5	SOBREMESAS	7	\N	2025-04-16 17:25:22.682035
78	Arroz Branco e Integral	Arroz branco e integral premium	4	ACOMPANHAMENTOS	8	\N	2025-04-16 17:25:22.682035
79	Feijão Especial	Feijão premium com bacon	4.5	ACOMPANHAMENTOS	8	\N	2025-04-16 17:25:22.682035
80	Farofa Gourmet	Farofa especial com bacon e amêndoas	3.5	ACOMPANHAMENTOS	8	\N	2025-04-16 17:25:22.682035
82	Salada Caprese	Tomate, mozzarella de búfala e manjericão	7	SALADAS	8	\N	2025-04-16 17:25:22.682035
83	Salmão Grelhado	Salmão grelhado com ervas finas	15	PEIXES	8	\N	2025-04-16 17:25:22.682035
84	Filé Mignon	Filé mignon ao molho madeira	18	CARNES	8	\N	2025-04-16 17:25:22.682035
85	Legumes Grelhados	Mix de legumes grelhados com azeite	5	LEGUMES	8	\N	2025-04-16 17:25:22.682035
86	Petit Gateau	Petit gateau de chocolate com sorvete	12	SOBREMESAS	8	\N	2025-04-16 17:25:22.682035
87	Cheesecake	Cheesecake com calda de frutas vermelhas	10	SOBREMESAS	8	\N	2025-04-16 17:25:22.682035
88	Risoto de Funghi	Risoto cremoso de funghi secchi	12	MASSAS	9	\N	2025-04-16 17:25:22.682035
89	Nhoque ao Pomodoro	Nhoque de batata ao molho pomodoro	10	MASSAS	9	\N	2025-04-16 17:25:22.682035
90	Salada Waldorf	Salada waldorf tradicional	8	SALADAS	9	\N	2025-04-16 17:25:22.682035
91	Carpaccio	Carpaccio de filé mignon com rúcula	9	ENTRADAS	9	\N	2025-04-16 17:25:22.682035
92	Medalhão de Filé	Medalhão de filé ao molho de vinho	20	CARNES	9	\N	2025-04-16 17:25:22.682035
93	Bacalhau Gratinado	Bacalhau gratinado com batatas	22	PEIXES	9	\N	2025-04-16 17:25:22.682035
94	Legumes Orgânicos	Mix de legumes orgânicos grelhados	6	LEGUMES	9	\N	2025-04-16 17:25:22.682035
95	Tiramisù	Tiramisù italiano tradicional	12	SOBREMESAS	9	\N	2025-04-16 17:25:22.682035
96	Crème Brûlée	Crème brûlée de baunilha	10	SOBREMESAS	9	\N	2025-04-16 17:25:22.682035
97	Salada Caesar	Salada caesar com frango grelhado	8	ENTRADA	10	\N	2025-04-16 17:25:22.682035
98	Filé ao Molho Madeira	Filé mignon ao molho madeira com risoto	25	PRATO PRINCIPAL	10	\N	2025-04-16 17:25:22.682035
99	Mousse de Chocolate	Mousse de chocolate belga	8	SOBREMESA	10	\N	2025-04-16 17:25:22.682035
100	Sopa de Cogumelos	Creme de cogumelos frescos	10	ENTRADA	11	\N	2025-04-16 17:25:22.682035
101	Salada Gourmet	Mix de folhas com queijo de cabra	12	SALADA	11	\N	2025-04-16 17:25:22.682035
102	Filé Wellington	Filé wellington com purê trufado	35	PRATO PRINCIPAL	11	\N	2025-04-16 17:25:22.682035
103	Petit Gateau	Petit gateau com sorvete de baunilha	15	SOBREMESA	11	\N	2025-04-16 17:25:22.682035
104	Ovos Benedict	Ovos pochê com molho hollandaise	12	OVOS	12	\N	2025-04-16 17:25:22.682035
105	Waffles	Waffles belgas com frutas frescas	10	PADARIA	12	\N	2025-04-16 17:25:22.682035
106	Salmão Defumado	Salmão defumado com cream cheese	15	FRIOS	12	\N	2025-04-16 17:25:22.682035
107	Iogurte Grego	Iogurte grego com mel e granola	8	LATICINIOS	12	\N	2025-04-16 17:25:22.682035
108	Pães Artesanais	Seleção de pães artesanais	6	PADARIA	12	\N	2025-04-16 17:25:22.682035
109	Queijos Finos	Tábua de queijos importados	18	FRIOS	12	\N	2025-04-16 17:25:22.682035
110	Frutas Nobres	Seleção de frutas nobres	10	FRUTAS	12	\N	2025-04-16 17:25:22.682035
111	Ovos Mexidos	Ovos mexidos com ervas	8	OVOS	13	\N	2025-04-16 17:25:22.682035
112	Panquecas Integrais	Panquecas integrais com mel	7	PADARIA	13	\N	2025-04-16 17:25:22.682035
113	Iogurte Natural	Iogurte natural com granola	6	LATICINIOS	13	\N	2025-04-16 17:25:22.682035
114	Pão Integral	Pão integral caseiro	4	PADARIA	13	\N	2025-04-16 17:25:22.682035
115	Queijo Branco	Queijo branco light	5	FRIOS	13	\N	2025-04-16 17:25:22.682035
116	Mix de Frutas	Salada de frutas da estação	6	FRUTAS	13	\N	2025-04-16 17:25:22.682035
117	Massa ao Vivo	Massa preparada na hora	12	MASSAS	14	\N	2025-04-16 17:25:22.682035
118	Risotos	Risotos variados	10	RISOTOS	14	\N	2025-04-16 17:25:22.682035
119	Carnes Grelhadas	Carnes grelhadas na hora	15	CARNES	14	\N	2025-04-16 17:25:22.682035
120	Molhos Especiais	Seleção de molhos	3	MOLHOS	14	\N	2025-04-16 17:25:22.682035
121	Sushi e Sashimi	Sushi e sashimi preparados na hora	20	JAPONESA	15	\N	2025-04-16 17:25:22.682035
122	Massa Trufada	Massa fresca com trufa	18	MASSAS	15	\N	2025-04-16 17:25:22.682035
123	Carnes Premium	Cortes nobres grelhados	25	CARNES	15	\N	2025-04-16 17:25:22.682035
124	Risoto de Lagosta	Risoto cremoso de lagosta	22	RISOTOS	15	\N	2025-04-16 17:25:22.682035
125	Molhos Gourmet	Seleção de molhos especiais	5	MOLHOS	15	\N	2025-04-16 17:25:22.682035
126	Canapés Variados	Seleção de canapés	5	FINGER FOOD	16	\N	2025-04-16 17:25:22.682035
127	Mini Quiches	Mini quiches sortidas	4	FINGER FOOD	16	\N	2025-04-16 17:25:22.682035
128	Bolinho de Bacalhau	Bolinhos de bacalhau	6	FRITOS	16	\N	2025-04-16 17:25:22.682035
129	Mini Sanduíches	Variedade de mini sanduíches	5	SANDUICHES	16	\N	2025-04-16 17:25:22.682035
130	Canapés Gourmet	Canapés com ingredientes premium	8	FINGER FOOD	17	\N	2025-04-16 17:25:22.682035
131	Casquinha de Siri	Casquinha de siri gratinada	10	FRUTOS DO MAR	17	\N	2025-04-16 17:25:22.682035
132	Mini Hambúrguer	Mini hambúrguer gourmet	9	FINGER FOOD	17	\N	2025-04-16 17:25:22.682035
133	Camarão Empanado	Camarão empanado com molho especial	12	FRUTOS DO MAR	17	\N	2025-04-16 17:25:22.682035
\.


--
-- Data for Name: event_menus; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_menus (event_id, menu_id) FROM stdin;
1	1
1	2
1	3
1	4
2	1
2	2
2	3
2	4
3	5
3	6
4	5
4	6
5	7
5	8
5	9
5	10
5	11
6	7
6	8
6	9
6	10
6	11
7	12
7	13
8	12
8	13
9	14
9	15
10	14
10	15
11	16
11	17
12	16
12	17
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, title, description, image_url, location, event_type, menu_options, status, created_at) FROM stdin;
9	Festival Gastronômico	Evento com diversas ilhas gastronômicas e experiências culinárias.	https://images.unsplash.com/photo-1555244162-803834f70033	\N	festival	2	available	2025-04-16 17:25:23.257035
1	Coffee Break Empresarial	Serviço de coffee break completo para eventos corporativos, reuniões e conferências.	https://images.unsplash.com/photo-1517048676732-d65bc937f952		lunch	4	available	2025-04-16 17:25:23.257035
3	Café da Manhã Executivo	Café da manhã completo para reuniões matinais e eventos corporativos.	https://images.unsplash.com/photo-1533089860892-a7c6f0a88666		coffee	2	available	2025-04-16 17:25:23.257035
4	Café da Manhã para Eventos	Serviço de café da manhã para eventos especiais e celebrações.	https://images.unsplash.com/photo-1550547660-d9450f859349		cocktail	2	available	2025-04-16 17:25:23.257035
5	Almoço Corporativo	Almoço executivo para empresas, com opções de buffet e pratos empratados.	https://images.unsplash.com/photo-1507537297725-24a1c029d3ca		lunch	3	available	2025-04-16 17:25:23.257035
6	Almoço para Eventos Sociais	Serviço de almoço para eventos sociais e celebrações.	https://images.unsplash.com/photo-1530062845289-9109b2c9c868		lunch	3	available	2025-04-16 17:25:23.257035
7	Brunch Especial	Brunch completo para eventos sociais e corporativos.	https://images.unsplash.com/photo-1550547660-d9450f859349		brunch	2	available	2025-04-16 17:25:23.257035
8	Brunch Celebration	Brunch premium para celebrações e eventos especiais.	https://images.unsplash.com/photo-1550547660-d9450f859349		brunch	1	available	2025-04-16 17:25:23.257035
10	Estações Gastronômicas	Evento com estações gastronômicas temáticas.	https://images.unsplash.com/photo-1555244162-803834f70033		festival	1	available	2025-04-16 17:25:23.257035
11	Coquetel Corporativo	Serviço de coquetel para eventos empresariais.	https://images.unsplash.com/photo-1578474846511-04ba529f0b88		cocktail	2	available	2025-04-16 17:25:23.257035
12	Coquetel para Festas	Coquetel premium para festas e celebrações.	https://images.unsplash.com/photo-1578474846511-04ba529f0b88		cocktail	1	available	2025-04-16 17:25:23.257035
2	Coffee Break para Treinamentos	Coffee break personalizado para treinamentos e workshops empresariais.	https://images.unsplash.com/photo-1552581234-26160f608093		coffee	3	available	2025-04-16 17:25:23.257035
\.


--
-- Data for Name: menu_dishes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.menu_dishes (menu_id, dish_id) FROM stdin;
1	1
1	2
1	3
1	4
1	5
1	6
1	7
1	8
1	9
1	10
1	11
1	12
1	13
1	14
2	15
2	16
2	17
2	18
2	19
2	20
2	21
2	22
2	23
2	24
2	25
3	26
3	27
3	28
3	29
3	30
3	31
4	32
4	33
4	34
4	35
4	36
4	37
4	38
4	39
4	40
4	41
4	42
4	43
4	44
4	45
5	46
5	47
5	48
5	49
5	50
5	51
5	52
5	53
5	54
5	55
6	56
6	57
6	58
6	59
6	60
6	61
6	62
6	63
6	64
6	65
6	66
6	67
7	68
7	69
7	70
7	71
7	72
7	73
7	74
7	75
7	76
7	77
8	78
8	79
8	80
8	82
8	83
8	84
8	85
8	86
8	87
9	88
9	89
9	90
9	91
9	92
9	93
9	94
9	95
9	96
10	97
10	98
10	99
11	100
11	101
11	102
11	103
12	104
12	105
12	106
12	107
12	108
12	109
12	110
13	111
13	112
13	113
13	114
13	115
13	116
14	117
14	118
14	119
14	120
15	121
15	122
15	123
15	124
15	125
16	126
16	127
16	128
16	129
17	130
17	131
17	132
17	133
\.


--
-- Data for Name: menus; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.menus (id, name, description, price, created_at, image_url) FROM stdin;
1	COFFEE BREAK PREMIUM	Serviço de coffee break com opções premium	50	2025-04-16 17:25:21.492501	\N
2	COFFEE BREAK STANDARD	Serviço de coffee break padrão	35	2025-04-16 17:25:21.492501	\N
3	COFFEE BREAK BÁSICO	Serviço de coffee break básico	25	2025-04-16 17:25:21.492501	\N
4	COFFEE BREAK VIP	Serviço de coffee break VIP	65	2025-04-16 17:25:21.492501	\N
5	CAFÉ DA MANHÃ STANDARD	Serviço de café da manhã padrão	40	2025-04-16 17:25:21.492501	\N
6	CAFÉ DA MANHÃ PREMIUM	Serviço de café da manhã premium	55	2025-04-16 17:25:21.492501	\N
7	ALMOÇO BUFFET STANDARD	Serviço de almoço buffet padrão	60	2025-04-16 17:25:21.492501	\N
8	ALMOÇO BUFFET VIP	Serviço de almoço buffet VIP	85	2025-04-16 17:25:21.492501	\N
9	ALMOÇO BUFFET PREMIUM	Serviço de almoço buffet premium	100	2025-04-16 17:25:21.492501	\N
10	ALMOÇO EMPRATADO 3 TEMPOS	Serviço de almoço empratado com 3 tempos	75	2025-04-16 17:25:21.492501	\N
11	ALMOÇO EMPRATADO 4 TEMPOS	Serviço de almoço empratado com 4 tempos	90	2025-04-16 17:25:21.492501	\N
12	BRUNCH PREMIUM	Serviço de brunch premium	70	2025-04-16 17:25:21.492501	\N
13	BRUNCH LIGHT	Serviço de brunch light	45	2025-04-16 17:25:21.492501	\N
14	ILHA GASTRONÔMICA STANDARD	Serviço de ilha gastronômica padrão	80	2025-04-16 17:25:21.492501	\N
15	ILHA GASTRONÔMICA VIP	Serviço de ilha gastronômica VIP	110	2025-04-16 17:25:21.492501	\N
16	COQUETEL STANDARD	Serviço de coquetel padrão	65	2025-04-16 17:25:21.492501	\N
17	COQUETEL VIP	Serviço de coquetel VIP	95	2025-04-16 17:25:21.492501	\N
18	SERVIÇOS ADICIONAIS	Serviços adicionais diversos	0	2025-04-16 17:25:21.492501	\N
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, user_id, event_id, status, date, guest_count, menu_selection, total_amount, additional_info, created_at, updated_at, admin_notes, venue_id, room_id, waiter_fee) FROM stdin;
1	9	1	completed	2003-12-12 22:00:00	1	COFFEE BREAK PREMIUM	50	{"quantity":1,"imageUrl":"https://images.unsplash.com/photo-1517048676732-d65bc937f952","selectedItems":{"entradas":["Bruschetta","Salada Caprese"],"pratosPrincipais":["Salmão Grelhado","Filé Mignon","Risoto de Cogumelos"],"sobremesas":["Tiramisu","Cheesecake"]}}	2025-04-22 16:48:55.798553	2025-04-22 18:03:59.944131	\N	\N	\N	0
9	9	7	completed	2025-04-25 15:00:00	21	BRUNCH PREMIUM	1470	{"quantity":1,"imageUrl":"https://images.unsplash.com/photo-1550547660-d9450f859349","selectedItems":{"FRIOS":["Queijos Finos"],"FRUTAS":["Frutas Nobres"],"LATICINIOS":["Iogurte Grego"],"OVOS":["Ovos Benedict"],"PADARIA":["Pães Artesanais"]}}	2025-04-24 20:56:42.162051	2025-04-24 20:56:42.162051	\N	\N	\N	0
11	9	9	pending	2025-06-16 12:00:00	20	ILHA GASTRONÔMICA VIP	2200	{"quantity":1,"imageUrl":"https://images.unsplash.com/photo-1555244162-803834f70033","selectedItems":{"CARNES":["Carnes Premium"],"JAPONESA":["Sushi e Sashimi"],"MASSAS":["Massa Trufada"],"MOLHOS":["Molhos Gourmet"],"RISOTOS":["Risoto de Lagosta"]}}	2025-04-29 11:04:30.502216	2025-04-29 11:04:30.502216	\N	\N	\N	0
2	9	2	pending	2222-02-11 21:00:00	20	COFFEE BREAK PREMIUM	1000	{"quantity":1,"imageUrl":"https://images.unsplash.com/photo-1552581234-26160f608093","selectedItems":{"entradas":["Salada Caprese","Bruschetta"],"pratosPrincipais":["Salmão Grelhado","Filé Mignon","Risoto de Cogumelos"],"sobremesas":["Tiramisu","Cheesecake"]}}	2025-04-22 16:48:56.276733	2025-04-22 18:03:59.944131	\N	\N	\N	0
3	9	5	pending	2025-04-23 17:00:00	39	ALMOÇO BUFFET PREMIUM	3900	{"quantity":1,"imageUrl":"https://images.unsplash.com/photo-1507537297725-24a1c029d3ca","selectedItems":{"entradas":["Carpaccio","Salada Waldorf"],"pratosPrincipais":["Medalhão de Filé","Risoto de Funghi","Bacalhau Gratinado"],"sobremesas":["Crème Brûlée","Tiramisù"]}}	2025-04-23 11:17:06.145577	2025-04-23 11:17:06.145577	\N	\N	\N	0
4	9	1	confirmed	2025-09-06 12:00:00	188	COFFEE BREAK PREMIUM	9400	{"quantity":1,"imageUrl":"https://images.unsplash.com/photo-1517048676732-d65bc937f952","selectedItems":{"entradas":["Água mineral com e sem gás","Bolo de chocolate"],"pratosPrincipais":["Café","Bolo de laranja","Chocolate quente"],"sobremesas":["Leite","Mini brownie"]}}	2025-04-23 11:22:56.10961	2025-04-23 11:22:56.10961	\N	\N	\N	0
5	9	1	confirmed	2025-04-23 12:00:00	20	COFFEE BREAK VIP	1300	{"quantity":1,"imageUrl":"https://images.unsplash.com/photo-1517048676732-d65bc937f952","selectedItems":{"BEBIDAS":["Suco de Laranja Natural"],"BOLOS":["Bolo Red Velvet"],"MINI SANDUICHES":["Mini Sanduíche Gourmet"],"SNACKS":["Pão de Queijo Recheado","Mini Quiche Lorraine"],"SOBREMESAS":["Macarons"]}}	2025-04-23 12:51:08.129723	2025-04-23 12:51:08.129723	\N	\N	\N	0
6	9	11	confirmed	2025-05-20 12:00:00	1691111	COQUETEL VIP	160655545	{"quantity":1,"imageUrl":"https://images.unsplash.com/photo-1578474846511-04ba529f0b88","selectedItems":{"FINGER FOOD":["Bruschetta Premium","Canapés Gourmet","Mini Hambúrguer"],"FRUTOS DO MAR":["Camarão Empanado","Casquinha de Siri"]}}	2025-04-23 15:06:57.530322	2025-04-23 15:06:57.530322	\N	\N	\N	0
10	7	9	pending	2025-04-26 17:40:00	50	ILHA GASTRONÔMICA VIP	5500	{"quantity":1,"imageUrl":"https://images.unsplash.com/photo-1555244162-803834f70033","selectedItems":{"CARNES":["Carnes Premium"],"JAPONESA":["Sushi e Sashimi"],"MASSAS":["Massa Trufada"],"MOLHOS":["Molhos Gourmet"],"RISOTOS":["Risoto de Lagosta"]}}	2025-04-25 11:20:29.396391	2025-04-28 18:05:52.24	1231221	\N	\N	0
7	9	9	pending	2025-12-13 12:00:00	8000	ILHA GASTRONÔMICA VIP	880000	{"quantity":1,"imageUrl":"https://images.unsplash.com/photo-1555244162-803834f70033","selectedItems":{"CARNES":["Carnes Premium"],"JAPONESA":["Sushi e Sashimi"],"MASSAS":["Massa Trufada"],"MOLHOS":["Molhos Gourmet"],"RISOTOS":["Risoto de Lagosta"]}}	2025-04-23 18:52:06.311861	2025-04-28 19:13:24.375	esse cara vai falir 134121321212121	\N	\N	0
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rooms (id, venue_id, name, capacity, description, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_migrations (version, applied_at) FROM stdin;
001_create_users_table.sql	2025-04-16 17:25:20.230061+00
002_refactor_menus_dishes.sql	2025-04-16 17:25:20.75243+00
003_insert_menus.sql	2025-04-16 17:25:21.492501+00
004_insert_dishes.sql	2025-04-16 17:25:22.027199+00
005_insert_remaining_dishes.sql	2025-04-16 17:25:22.682035+00
006_insert_events.sql	2025-04-16 17:25:23.257035+00
007_fix_event_menus.sql	2025-04-16 17:25:23.873527+00
0003_add_menu_image.sql	2025-04-22 16:37:26.926713+00
008_add_missing_updated_at.sql	2025-04-22 18:03:59.944131+00
009_create_menu_dishes.sql	2025-04-24 20:12:34.683119+00
010_create_settings_table.sql	2025-04-29 12:39:44.578029+00
011_create_venues_and_rooms.sql	2025-04-29 12:39:45.812377+00
003_add_venue_room_to_orders.sql	2025-04-29 13:13:59.645186+00
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session (sid, sess, expire) FROM stdin;
UdxAuEof5r-wntx2eUXGiqSOirET9cT9	{"cookie":{"originalMaxAge":86400000,"expires":"2025-04-30T19:28:03.312Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":7}}	2025-05-01 13:50:44
DKR0Wx1HYeMmHdjcc22R5MLFBhBHgZuZ	{"cookie":{"originalMaxAge":86400000,"expires":"2025-04-30T18:37:54.350Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":9}}	2025-04-30 19:24:27
Hv2DjWCbSpRxmH9TeAV0i68wONOUXJ5g	{"cookie":{"originalMaxAge":86400000,"expires":"2025-04-29T16:36:04.864Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":9}}	2025-04-30 16:20:01
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (key, value) FROM stdin;
garcom_price	260
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password, name, role, phone, created_at, updated_at) FROM stdin;
12	admin	admin@example.com	dc387beb6d63499de7c9f5bd472e1469e6bcc9b05b66f80e0b69ba3d62ef1638a9f3707a31c5ae6ca5e9ec2dd64dd348aeceeead9a288617c1f717976a327711.27e5c52bd7f5f73264940ef66c108dc0	Administrador	admin	(11) 99999-9999	2025-04-23 18:01:21.437017	2025-04-23 18:01:21.437017
9	Márcio	t.i@rojogastronomia.com	366a647ac2f184d2d26117f6677c37f3dedbcd251953a6d03a9789c99e4e9e94c5ae4b039321cc00927a5069e46773160d2edae16823c6d0176f4a4ecf825639.76c025bc03aff738366eefe90bd7b794	Márcio	Administrador	(11) 96465-2080	2025-04-22 13:04:19.760191	2025-04-22 18:03:59.944131
10	Leo	delivery@rojogastronomia.com	ea7a7c7b1a8a06dd8e9d34ea765df99a3e3d772318bed9c796da6f1affb5c0e0f6384b2cc5bbc16f0fe0645402d1460c7370586c7080a1b80841325fe261f108.aa697f98ee77541c9078c1399be05092	Leonardo	Administrador	(11) 96665-8539	2025-04-22 13:32:36.957468	2025-04-22 18:03:59.944131
7	Felipe	suporte@rojogastronomia.com	74792c3f820c127fd0e01bed3628bb3da2ca15c864bd273dcd8ab7ac4437d3935f33c5762e12ceab744ccbde520aca51adab0f8283bc3474c53f10d67d7ea4c4.c8cdd04e7a9f78d3f1f34f0900d82a13	Felipe	Administrador	(11) 95127-0455	2025-04-22 12:36:16.654712	2025-04-22 18:03:59.944131
11	Cria	t.i@rojogastronomia.com.br	a43a6609d5f9c792f51aa58055078a957ce46e0f351a6f360a1e9ccf49f834c0251d543317e8bc5b14cb745021067f15c0eb4c1a8254110a4f5fc5b2c95d2b8a.b7beecb9c3ce2edbf3500d3e76d29a75	Teste de cria	client	\N	2025-04-22 19:49:57.091141	2025-04-22 19:49:57.091141
\.


--
-- Data for Name: venues; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.venues (id, name, address, capacity, description, status, created_at, updated_at) FROM stdin;
\.


--
-- Name: dishes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dishes_id_seq', 134, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_id_seq', 12, true);


--
-- Name: menus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.menus_id_seq', 18, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 11, true);


--
-- Name: rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rooms_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 13, true);


--
-- Name: venues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.venues_id_seq', 1, false);


--
-- Name: dishes dishes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_pkey PRIMARY KEY (id);


--
-- Name: event_menus event_menus_event_id_menu_id_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_menus
    ADD CONSTRAINT event_menus_event_id_menu_id_pk PRIMARY KEY (event_id, menu_id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: menu_dishes menu_dishes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_dishes
    ADD CONSTRAINT menu_dishes_pkey PRIMARY KEY (menu_id, dish_id);


--
-- Name: menus menus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_dishes_menu_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dishes_menu_id ON public.dishes USING btree (menu_id);


--
-- Name: idx_event_menus_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_menus_event_id ON public.event_menus USING btree (event_id);


--
-- Name: idx_event_menus_menu_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_menus_menu_id ON public.event_menus USING btree (menu_id);


--
-- Name: idx_menu_dishes_dish_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menu_dishes_dish_id ON public.menu_dishes USING btree (dish_id);


--
-- Name: idx_menu_dishes_menu_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menu_dishes_menu_id ON public.menu_dishes USING btree (menu_id);


--
-- Name: idx_orders_room_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_room_id ON public.orders USING btree (room_id);


--
-- Name: idx_orders_venue_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_venue_id ON public.orders USING btree (venue_id);


--
-- Name: idx_rooms_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rooms_status ON public.rooms USING btree (status);


--
-- Name: idx_rooms_venue_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rooms_venue_id ON public.rooms USING btree (venue_id);


--
-- Name: idx_venues_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_venues_status ON public.venues USING btree (status);


--
-- Name: event_menus event_menus_event_id_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_menus
    ADD CONSTRAINT event_menus_event_id_events_id_fk FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_menus event_menus_menu_id_menus_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_menus
    ADD CONSTRAINT event_menus_menu_id_menus_id_fk FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON DELETE CASCADE;


--
-- Name: dishes fk_menu; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT fk_menu FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON DELETE SET NULL;


--
-- Name: menu_dishes menu_dishes_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_dishes
    ADD CONSTRAINT menu_dishes_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE;


--
-- Name: menu_dishes menu_dishes_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_dishes
    ADD CONSTRAINT menu_dishes_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON DELETE CASCADE;


--
-- Name: orders orders_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id);


--
-- Name: orders orders_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id);


--
-- Name: rooms rooms_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

