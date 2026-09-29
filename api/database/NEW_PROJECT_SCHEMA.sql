-- Fuji Card: baseline for a NEW, EMPTY Supabase project only.
-- Review before running in SQL Editor. Do not also run the legacy SQL files.
-- The Express API uses a server-only Supabase secret key; browser roles need
-- no direct access to these tables. Revisit grants and policies if that changes.
BEGIN;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Bundled catalog IDs are strings such as "op09_box_v1".
CREATE TABLE public.products (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL UNIQUE,
  description text,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  original_price numeric(12,2),
  image_url text,
  category_id uuid REFERENCES public.categories(id),
  card_type text,
  set_name text,
  rarity text,
  condition text DEFAULT 'Mint',
  language text DEFAULT 'English',
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  featured boolean NOT NULL DEFAULT false,
  promo boolean NOT NULL DEFAULT false,
  discount integer NOT NULL DEFAULT 0,
  graded boolean NOT NULL DEFAULT false,
  grading_company text,
  grade numeric(3,1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Authentication is currently handled by the Express API, not Supabase Auth.
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  first_name text,
  last_name text,
  address text,
  city text,
  postcode text,
  country text,
  phone text,
  is_banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  session_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cart_id, product_id)
);

CREATE TABLE public.shipping_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  first_name text,
  last_name text,
  address text,
  city text,
  postcode text,
  country text,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  session_id text,
  order_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(12,2) NOT NULL,
  shipping_cost numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'GBP',
  shipping_address_id uuid REFERENCES public.shipping_addresses(id),
  payment_method text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  price numeric(12,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.products(category_id);
CREATE INDEX ON public.cart_items(cart_id);
CREATE INDEX ON public.orders(user_id);
CREATE INDEX ON public.orders(session_id);
CREATE INDEX ON public.order_items(order_id);

INSERT INTO public.categories (name, description) VALUES
  ('pokemon', 'Pokemon cards and sealed products'),
  ('yugioh', 'Yu-Gi-Oh! cards and sealed products'),
  ('onepiece', 'One Piece cards and sealed products'),
  ('newarrivals', 'New arrivals'),
  ('specialrare', 'Rare and graded cards'),
  ('promo', 'Promotional products'),
  ('sealed', 'Sealed products'),
  ('accessories', 'Accessories'),
  ('other', 'Other products');

-- Newly created public tables may inherit grants. Remove them explicitly.
REVOKE ALL ON TABLE public.categories, public.products, public.users,
  public.carts, public.cart_items, public.shipping_addresses, public.orders,
  public.order_items, public.admin_settings FROM anon, authenticated;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories, public.products,
  public.users, public.carts, public.cart_items, public.shipping_addresses,
  public.orders, public.order_items, public.admin_settings TO service_role;

COMMIT;
