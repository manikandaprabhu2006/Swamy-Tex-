import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string | null;
  price: number;
  compare_at_price: number | null;
  fabric: string | null;
  color: string | null;
  occasion: string | null;
  sizes: string[];
  stock: number;
  images: string[];
  rating: number;
  is_featured: boolean;
  is_active: boolean;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("id,slug,name,description,image_url,sort_order")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as Category[];
  },
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Product[];
  },
});

export function productQuery(slug: string) {
  return queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return (data as unknown as Product) ?? null;
    },
  });
}

export function cartQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["cart", userId ?? "anon"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id,quantity,size,product_id,products(*)")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        id: string;
        quantity: number;
        size: string;
        product_id: string;
        products: Product | null;
      }>;
    },
  });
}

export function wishlistQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["wishlist", userId ?? "anon"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id,product_id,products(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Array<{ id: string; product_id: string; products: Product | null }>;
    },
  });
}

export function ordersQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["orders", userId ?? "anon"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function addressesQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["addresses", userId ?? "anon"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("addresses").select("*").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}
