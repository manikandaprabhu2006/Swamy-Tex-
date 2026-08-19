import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/shop";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

import p1Image from "@/assets/p1.jpg";
import p2Image from "@/assets/p2.jpg";
import p3Image from "@/assets/p3.jpg";
import p4Image from "@/assets/p4.jpg";
import p5Image from "@/assets/p5.jpg";
import p6Image from "@/assets/p6.jpg";

const productImages: Record<string, string> = {
  "p1.jpg": p1Image,
  "p2.jpg": p2Image,
  "p3.jpg": p3Image,
  "p4.jpg": p4Image,
  "p5.jpg": p5Image,
  "p6.jpg": p6Image,
};

export function ProductCard({
  product,
  onWishlist,
  wishlisted,
  priority = false,
}: {
  product: Product;
  onWishlist?: (product: Product) => void;
  wishlisted?: boolean;
  priority?: boolean;
}) {
  const discount =
    product.compare_at_price &&
    Number(product.compare_at_price) > Number(product.price)
      ? Math.round(
          (1 -
            Number(product.price) /
              Number(product.compare_at_price)) *
            100,
        )
      : 0;

  const imageName = product.images?.[0] ?? "";
  const imageSrc = productImages[imageName];

  return (
    <article className="group relative">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block overflow-hidden bg-card-elevated"
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              width={900}
              height={1200}
              loading={priority ? "eager" : "lazy"}
              className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
              Image unavailable
            </div>
          )}

          {discount > 0 && (
            <span className="absolute left-0 top-4 bg-gold-gradient px-3 py-1 text-[0.65rem] font-semibold tracking-[0.2em] text-[oklch(0.16_0_0)]">
              {discount}% OFF
            </span>
          )}

          {product.stock === 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/70 eyebrow">
              Sold out
            </span>
          )}
        </div>
      </Link>

      {onWishlist && (
        <button
          type="button"
          onClick={() => onWishlist(product)}
          aria-label={
            wishlisted
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name} to wishlist`
          }
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
        >
          <Heart
            className={cn(
              "h-4 w-4",
              wishlisted
                ? "fill-gold text-gold"
                : "text-foreground",
            )}
          />
        </button>
      )}

      <div className="space-y-1 pt-4">
        <p className="eyebrow text-muted-foreground">
          {product.fabric ??
            product.occasion ??
            "Couture"}
        </p>

        <h3 className="font-display text-lg leading-tight">
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="hover:text-gold"
          >
            {product.name}
          </Link>
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">
            {formatINR(product.price)}
          </span>

          {discount > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              {formatINR(product.compare_at_price!)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}