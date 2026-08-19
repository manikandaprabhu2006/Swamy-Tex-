import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Minus, Plus, ShieldCheck, Star, Truck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProductCard } from "@/components/site/ProductCard";
import { productQuery, productsQuery } from "@/lib/shop";
import { formatINR } from "@/lib/format";
import { useCartActions, useWishlist, useWishlistActions } from "@/hooks/useShop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQuery(params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Piece unavailable — SWAMY TEX" }, { name: "robots", content: "noindex" }] };
    }
    const image = loaderData.images?.[0];
    return {
      meta: [
        { title: `${loaderData.name} — SWAMY TEX` },
        {
          name: "description",
          content:
            loaderData.description?.slice(0, 155) ??
            `${loaderData.name} from SWAMY TEX, Tirunelveli. Premium Indian fashion with pan-India delivery.`,
        },
        { property: "og:title", content: `${loaderData.name} — SWAMY TEX` },
        {
          property: "og:description",
          content: loaderData.description?.slice(0, 155) ?? "Premium Indian fashion from Tirunelveli.",
        },
        ...(image?.startsWith("https://")
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: product } = useQuery(productQuery(slug));
  const all = useQuery(productsQuery);
  const { add, requireLogin } = useCartActions();
  const { ids } = useWishlist();
  const { toggle } = useWishlistActions();

  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-32 text-center">
        <h1 className="font-display text-3xl">This piece is no longer available</h1>
        <Button variant="gold" className="mt-8" asChild>
          <Link to="/shop">Back to collections</Link>
        </Button>
      </div>
    );
  }

  const sizes = product.sizes?.length ? product.sizes : ["Free size"];
  const chosenSize = size ?? sizes[0]!;
  const soldOut = product.stock === 0;
  const related = (all.data ?? [])
    .filter((p) => p.category_id === product.category_id && p.id !== product.id)
    .slice(0, 4);

  const addToBag = () => {
    if (requireLogin()) return;
    add.mutate({ product, size: chosenSize, quantity });
  };

  const buyNow = () => {
    if (requireLogin()) return;
    add.mutate(
      { product, size: chosenSize, quantity },
      { onSuccess: () => navigate({ to: "/checkout" }) },
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <nav className="eyebrow mb-8 text-muted-foreground">
        <Link to="/" className="hover:text-gold">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-gold">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        <div className="flex gap-4">
          {product.images.length > 1 && (
            <div className="flex w-20 shrink-0 flex-col gap-3">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setActiveImage(index)}
                  className={cn(
                    "aspect-[3/4] overflow-hidden border",
                    index === activeImage ? "border-gold" : "border-transparent",
                  )}
                  aria-label={`View image ${index + 1}`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-hidden bg-card-elevated">
            <img
              src={product.images[activeImage] ?? product.images[0]}
              alt={product.name}
              width={900}
              height={1200}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div>
          <p className="eyebrow text-gold">{product.occasion ?? "Signature"}</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">{product.name}</h1>

          <div className="mt-4 flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-gold">
              <Star className="h-4 w-4 fill-current" /> {Number(product.rating).toFixed(1)}
            </span>
            <span className="text-muted-foreground">
              {soldOut ? "Sold out" : `${product.stock} in stock`}
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-3xl">{formatINR(product.price)}</span>
            {product.compare_at_price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatINR(product.compare_at_price)}
              </span>
            )}
            <span className="text-xs text-muted-foreground">Inclusive of all taxes</span>
          </div>

          <p className="mt-6 text-muted-foreground">{product.description}</p>

          <div className="mt-8">
            <p className="eyebrow mb-3">Select size</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((option) => (
                <button
                  key={option}
                  onClick={() => setSize(option)}
                  className={cn(
                    "min-w-14 border px-4 py-2 text-sm transition-colors",
                    option === chosenSize
                      ? "border-gold text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <p className="eyebrow">Quantity</p>
            <div className="flex items-center border border-border">
              <button
                className="grid h-10 w-10 place-items-center"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm">{quantity}</span>
              <button
                className="grid h-10 w-10 place-items-center"
                onClick={() => setQuantity((q) => Math.min(10, product.stock || 10, q + 1))}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="gold" size="xl" onClick={buyNow} disabled={soldOut || add.isPending}>
              Buy now
            </Button>
            <Button variant="couture" size="xl" onClick={addToBag} disabled={soldOut || add.isPending}>
              Add to bag
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggle.mutate(product)}
              aria-label="Save to wishlist"
            >
              <Heart className={cn("h-5 w-5", ids.has(product.id) && "fill-gold text-gold")} />
            </Button>
          </div>

          <div className="mt-8 grid gap-3 border-y border-border py-6 text-sm sm:grid-cols-3">
            <p className="flex items-center gap-2"><Truck className="h-4 w-4 text-gold" /> Free over ₹4,999</p>
            <p className="flex items-center gap-2"><Undo2 className="h-4 w-4 text-gold" /> 7-day returns</p>
            <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" /> Secure checkout</p>
          </div>

          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="details">
              <AccordionTrigger>Fabric & details</AccordionTrigger>
              <AccordionContent className="space-y-1 text-sm text-muted-foreground">
                <p>Fabric: {product.fabric ?? "—"}</p>
                <p>Colour: {product.color ?? "—"}</p>
                <p>Occasion: {product.occasion ?? "—"}</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger>Care instructions</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Dry clean only. Store wrapped in muslin, away from direct sunlight. Avoid perfume contact
                with zari work.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="delivery">
              <AccordionTrigger>Delivery & returns</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Dispatched from Tirunelveli within 24 hours. Delivery in 1–6 working days depending on your
                pincode. Returns accepted within 7 days of delivery for unworn pieces with tags intact.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 font-display text-3xl">You may also love</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                wishlisted={ids.has(item.id)}
                onWishlist={(p) => toggle.mutate(p)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
