import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cartQuery, wishlistQuery, type Product } from "@/lib/shop";

export function useCart() {
  const { user } = useAuth();
  const query = useQuery(cartQuery(user?.id));
  const items = query.data ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.products?.price ?? 0) * item.quantity,
    0,
  );
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return { ...query, items, subtotal, count };
}

export function useWishlist() {
  const { user } = useAuth();
  const query = useQuery(wishlistQuery(user?.id));
  const items = query.data ?? [];
  return { ...query, items, ids: new Set(items.map((i) => i.product_id)) };
}

export function useCartActions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["cart"] });

  const requireLogin = () => {
    if (user) return false;
    toast.info("Please sign in to continue", { description: "An account is needed to shop." });
    navigate({ to: "/auth", search: { redirect: window.location.pathname } });
    return true;
  };

  const add = useMutation({
    mutationFn: async ({ product, size, quantity = 1 }: { product: Product; size: string; quantity?: number }) => {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id,quantity")
        .eq("product_id", product.id)
        .eq("size", size)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: Math.min(10, existing.quantity + quantity) })
          .eq("id", existing.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("cart_items")
        .insert({ user_id: user!.id, product_id: product.id, size, quantity });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Added to your bag");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setQuantity = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Removed from your bag");
    },
  });

  return { add, setQuantity, remove, requireLogin };
}

export function useWishlistActions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const toggle = useMutation({
    mutationFn: async (product: Product) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      const { data: existing } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("product_id", product.id)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from("wishlist_items").delete().eq("id", existing.id);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase
        .from("wishlist_items")
        .insert({ user_id: user.id, product_id: product.id });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(result === "added" ? "Saved to wishlist" : "Removed from wishlist");
    },
    onError: (error: Error) => {
      if (error.message === "AUTH_REQUIRED") {
        toast.info("Sign in to save favourites");
        navigate({ to: "/auth", search: { redirect: window.location.pathname } });
        return;
      }
      toast.error(error.message);
    },
  });

  return { toggle };
}
