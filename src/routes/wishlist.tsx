import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/ProductCard";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist, useWishlistActions } from "@/hooks/useShop";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — SWAMY TEX" },
      { name: "description", content: "The SWAMY TEX pieces you have saved for later." },
      { property: "og:title", content: "Wishlist — SWAMY TEX" },
      { property: "og:description", content: "Your saved couture pieces." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user, loading } = useAuth();
  const { items } = useWishlist();
  const { toggle } = useWishlistActions();

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-lg px-5 py-32 text-center">
        <h1 className="font-display text-4xl">Sign in to see your wishlist</h1>
        <Button variant="gold" size="xl" className="mt-8" asChild>
          <Link to="/auth" search={{ redirect: "/wishlist" }}>Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-4xl sm:text-5xl">Wishlist</h1>
      {items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-muted-foreground">Nothing saved yet.</p>
          <Button variant="couture" size="lg" className="mt-6" asChild>
            <Link to="/shop">Browse collections</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {items.map((item) =>
            item.products ? (
              <ProductCard
                key={item.id}
                product={item.products}
                wishlisted
                onWishlist={(p) => toggle.mutate(p)}
              />
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
