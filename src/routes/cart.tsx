import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart, useCartActions } from "@/hooks/useShop";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your bag — SWAMY TEX" },
      { name: "description", content: "Review the pieces in your SWAMY TEX shopping bag before checkout." },
      { property: "og:title", content: "Your bag — SWAMY TEX" },
      { property: "og:description", content: "Review your selected pieces before secure checkout." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { user, loading } = useAuth();
  const { items, subtotal, isLoading } = useCart();
  const { setQuantity, remove } = useCartActions();

  if (!loading && !user) {
    return (
      <Empty
        title="Sign in to view your bag"
        copy="Your saved pieces travel with your account."
        cta={{ label: "Sign in", to: "/auth" }}
      />
    );
  }

  if (isLoading) return <div className="mx-auto max-w-3xl px-5 py-24 text-center">Loading your bag…</div>;

  if (items.length === 0) {
    return (
      <Empty
        title="Your bag is empty"
        copy="Discover handwoven silks, couture gowns and tailored menswear."
        cta={{ label: "Shop the collection", to: "/shop" }}
      />
    );
  }

  const delivery = subtotal >= 4999 ? 0 : 149;

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-4xl sm:text-5xl">Your bag</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 py-6">
              <img
                src={item.products?.images?.[0] ?? ""}
                alt={item.products?.name ?? ""}
                className="h-32 w-24 shrink-0 object-cover"
                loading="lazy"
              />
              <div className="flex-1">
                <h2 className="font-display text-xl">
                  <Link to="/product/$slug" params={{ slug: item.products?.slug ?? "" }}>
                    {item.products?.name}
                  </Link>
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Size {item.size}</p>
                <p className="mt-2 text-sm">{formatINR(item.products?.price ?? 0)}</p>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center border border-border">
                    <button
                      className="grid h-9 w-9 place-items-center"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity.mutate({ id: item.id, quantity: item.quantity - 1 })}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-9 text-center text-sm">{item.quantity}</span>
                    <button
                      className="grid h-9 w-9 place-items-center"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity.mutate({ id: item.id, quantity: item.quantity + 1 })}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => remove.mutate(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium">
                {formatINR(Number(item.products?.price ?? 0) * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="h-fit border border-border p-6">
          <h2 className="eyebrow text-gold">Order summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Estimated delivery</dt>
              <dd>{delivery === 0 ? "Free" : formatINR(delivery)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-display text-xl">
              <dt>Total</dt>
              <dd>{formatINR(subtotal + delivery)}</dd>
            </div>
          </dl>
          <Button variant="gold" size="xl" className="mt-6 w-full" asChild>
            <Link to="/checkout">Proceed to checkout</Link>
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Final delivery charges are confirmed by pincode at checkout.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Empty({
  title,
  copy,
  cta,
}: {
  title: string;
  copy: string;
  cta: { label: string; to: "/auth" | "/shop" };
}) {
  return (
    <div className="mx-auto max-w-lg px-5 py-32 text-center">
      <h1 className="font-display text-4xl">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{copy}</p>
      <Button variant="gold" size="xl" className="mt-8" asChild>
        {cta.to === "/auth" ? (
          <Link to="/auth" search={{ redirect: "/cart" }}>{cta.label}</Link>
        ) : (
          <Link to="/shop">{cta.label}</Link>
        )}
      </Button>
    </div>
  );
}
