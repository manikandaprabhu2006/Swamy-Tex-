-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- UPDATED AT HELPER
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price numeric(10,2),
  fabric text,
  color text,
  occasion text,
  sizes text[] NOT NULL DEFAULT ARRAY['Free Size'],
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  images text[] NOT NULL DEFAULT '{}',
  rating numeric(2,1) NOT NULL DEFAULT 4.7,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read products" ON public.products FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "admins read all products" ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX products_category_idx ON public.products(category_id);

-- ADDRESSES
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own addresses" ON public.addresses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- CART
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL DEFAULT 'Free Size',
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id, size)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart" ON public.cart_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- WISHLIST
CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wishlist" ON public.wishlist_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_provider text NOT NULL DEFAULT 'razorpay',
  payment_reference text,
  subtotal numeric(10,2) NOT NULL,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL,
  shipping_address jsonb NOT NULL,
  courier text,
  tracking_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders read" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  size text NOT NULL DEFAULT 'Free Size',
  unit_price numeric(10,2) NOT NULL,
  quantity int NOT NULL,
  image_url text
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "own order items insert" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

CREATE TABLE public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_events TO authenticated;
GRANT ALL ON public.order_events TO service_role;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own order events read" ON public.order_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "admins insert order events" ON public.order_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- AUDIT LOG
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- SEED
INSERT INTO public.categories (slug, name, description, image_url, sort_order) VALUES
('sarees','Sarees','Handwoven silk and designer sarees','/__l5e/assets-v1/e47df2cd-cf3f-4f40-8808-d3385ec907cd/p1.jpg',1),
('gowns','Gowns & Anarkalis','Occasion couture for celebrations','/__l5e/assets-v1/fde7f807-a9a7-4bde-871f-a3acbb2609cf/p2.jpg',2),
('menswear','Menswear','Kurtas, shirts and festive wear','/__l5e/assets-v1/c14f03e1-f74c-454f-a8e7-fb2b06e27e11/p3.jpg',3),
('lehengas','Lehengas','Bridal and festive lehengas','/__l5e/assets-v1/2efd9a8d-e5c6-4ae6-ad64-29d6fc1d77e1/p4.jpg',4),
('kids','Kids','Little celebration outfits','/__l5e/assets-v1/d387a4e1-0606-45e4-9b6b-df02232ee2fb/p6.jpg',5);

INSERT INTO public.products (slug,name,description,category_id,price,compare_at_price,fabric,color,occasion,sizes,stock,images,rating,is_featured)
SELECT 'royal-blue-kanchipuram-silk-saree','Royal Blue Kanchipuram Silk Saree','A pure mulberry silk Kanchipuram saree with a hand-woven gold zari border and temple motif pallu. Woven in Tamil Nadu by master weavers.',id,18999,24999,'Pure Mulberry Silk','Royal Blue','Wedding',ARRAY['Free Size'],12,ARRAY['/__l5e/assets-v1/e47df2cd-cf3f-4f40-8808-d3385ec907cd/p1.jpg'],4.9,true FROM public.categories WHERE slug='sarees';
INSERT INTO public.products (slug,name,description,category_id,price,compare_at_price,fabric,color,occasion,sizes,stock,images,rating,is_featured)
SELECT 'ivory-gold-embroidered-anarkali','Ivory Gold Embroidered Anarkali','Floor-length ivory anarkali with dense zardozi gold embroidery and a soft net dupatta. Cut for a fluid, regal silhouette.',id,14499,18999,'Georgette & Net','Ivory','Reception',ARRAY['XS','S','M','L','XL'],20,ARRAY['/__l5e/assets-v1/fde7f807-a9a7-4bde-871f-a3acbb2609cf/p2.jpg'],4.8,true FROM public.categories WHERE slug='gowns';
INSERT INTO public.products (slug,name,description,category_id,price,compare_at_price,fabric,color,occasion,sizes,stock,images,rating,is_featured)
SELECT 'maroon-silk-kurta','Maroon Silk Kurta','Tailored maroon raw-silk kurta with antique gold buttons and a mandarin collar. A modern festive staple.',id,5499,6999,'Raw Silk','Maroon','Festive',ARRAY['S','M','L','XL','XXL'],30,ARRAY['/__l5e/assets-v1/c14f03e1-f74c-454f-a8e7-fb2b06e27e11/p3.jpg'],4.7,true FROM public.categories WHERE slug='menswear';
INSERT INTO public.products (slug,name,description,category_id,price,compare_at_price,fabric,color,occasion,sizes,stock,images,rating,is_featured)
SELECT 'blush-pink-georgette-lehenga','Blush Pink Georgette Lehenga','Blush georgette lehenga with silver thread work, a sequinned blouse and featherlight flare.',id,22999,29999,'Georgette','Blush Pink','Bridal',ARRAY['XS','S','M','L'],8,ARRAY['/__l5e/assets-v1/2efd9a8d-e5c6-4ae6-ad64-29d6fc1d77e1/p4.jpg'],4.9,true FROM public.categories WHERE slug='lehengas';
INSERT INTO public.products (slug,name,description,category_id,price,compare_at_price,fabric,color,occasion,sizes,stock,images,rating,is_featured)
SELECT 'white-linen-formal-shirt','White Linen Formal Shirt','Breathable pure linen shirt with mother-of-pearl buttons. Built for Tirunelveli heat and boardroom polish.',id,2499,3199,'Pure Linen','White','Formal',ARRAY['S','M','L','XL','XXL'],45,ARRAY['/__l5e/assets-v1/6698e3df-6ae3-43cd-ba7d-040221e8b01e/p5.jpg'],4.6,false FROM public.categories WHERE slug='menswear';
INSERT INTO public.products (slug,name,description,category_id,price,compare_at_price,fabric,color,occasion,sizes,stock,images,rating,is_featured)
SELECT 'black-gold-kids-festive-set','Black & Gold Kids Festive Set','Miniature festive set in black silk with woven gold borders and a matching dupatta.',id,3299,4299,'Art Silk','Black','Festive',ARRAY['2-3Y','4-5Y','6-7Y','8-9Y'],18,ARRAY['/__l5e/assets-v1/d387a4e1-0606-45e4-9b6b-df02232ee2fb/p6.jpg'],4.8,false FROM public.categories WHERE slug='kids';