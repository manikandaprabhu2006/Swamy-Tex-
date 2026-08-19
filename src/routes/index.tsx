import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Gem, ShieldCheck, Truck, Undo2 } from "lucide-react";

import heroImage from "@/assets/hero.jpg";
import storyImage from "@/assets/story.jpg";

import p1Image from "@/assets/p1.jpg";
import p2Image from "@/assets/p2.jpg";
import p3Image from "@/assets/p3.jpg";
import p4Image from "@/assets/p4.jpg";
import p6Image from "@/assets/p6.jpg";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/ProductCard";
import { categoriesQuery, productsQuery } from "@/lib/shop";
import { useWishlist, useWishlistActions } from "@/hooks/useShop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "SWAMY TEX — Premium Silk Sarees & Couture, Tirunelveli",
      },
      {
        name: "description",
        content:
          "Discover handwoven Kanchipuram silks, couture gowns, lehengas and tailored menswear at SWAMY TEX Tirunelveli. Free delivery above ₹4,999.",
      },
      {
        property: "og:title",
        content: "SWAMY TEX — Premium Silk Sarees & Couture",
      },
      {
        property: "og:description",
        content:
          "Handwoven silks, couture gowns and tailored menswear from Tirunelveli.",
      },
    ],
  }),
  component: Home,
});

function getCategoryImage(category: {
  name: string;
  slug: string;
}) {
  const value = `${category.slug} ${category.name}`.toLowerCase();

  // Sarees → p1.jpg
  if (
    value.includes("saree") ||
    value.includes("sari") ||
    value.includes("silk")
  ) {
    return p1Image;
  }

  // Gowns & Anarkalis → p2.jpg
  if (
    value.includes("gown") ||
    value.includes("anarkali")
  ) {
    return p2Image;
  }

  // Menswear → p3.jpg
  if (
    value.includes("menswear") ||
    value.includes("men") ||
    value.includes("kurta") ||
    value.includes("shirt")
  ) {
    return p3Image;
  }

  // Lehengas → p4.jpg
  if (
    value.includes("lehenga") ||
    value.includes("lehenga")
  ) {
    return p4Image;
  }

  // Kids → p6.jpg
  if (
    value.includes("kids") ||
    value.includes("kid") ||
    value.includes("children")
  ) {
    return p6Image;
  }

  // Fallback
  return p1Image;
}

function Home() {
  const categories = useQuery(categoriesQuery);
  const products = useQuery(productsQuery);
  const { ids } = useWishlist();
  const { toggle } = useWishlistActions();

  const featured = (products.data ?? [])
    .filter((p) => p.is_featured)
    .slice(0, 4);

  const newest = (products.data ?? []).slice(0, 8);

  return (
    <div>
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative isolate min-h-[86vh] overflow-hidden">
        <img
          src={heroImage}
          alt="Model wearing a gold-embroidered silk saree in a candlelit heritage hall"
          className="absolute inset-0 h-full w-full object-cover"
          width={1920}
          height={1080}
        />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0_0_0/0.55),oklch(0_0_0/0.25)_45%,var(--background))]" />

        <div className="relative mx-auto flex min-h-[86vh] max-w-7xl flex-col justify-end px-5 pb-20 sm:px-8">
          <div className="animate-rise max-w-2xl">
            <p className="eyebrow text-gold">
              Autumn / Winter Couture 2026
            </p>

            <h1 className="mt-5 font-display text-5xl leading-[1.02] text-white sm:text-7xl">
              Woven in Tirunelveli.
              <span className="block text-gold-shine">
                Worn everywhere.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base text-white/80">
              Handloom Kanchipuram silks, hand-embroidered gowns and tailored
              menswear — curated by four generations of textile craftsmen.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button variant="gold" size="xl" asChild>
                <Link to="/shop">
                  Shop the collection
                </Link>
              </Button>

              <Button variant="couture" size="xl" asChild>
                <Link
                  to="/shop"
                  search={{ category: "sarees" }}
                >
                  Explore silks
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURES
      ========================================================= */}
      <section className="mx-auto grid max-w-7xl gap-6 border-y border-border px-5 py-8 sm:px-8 md:grid-cols-4">
        {[
          {
            icon: Truck,
            title: "Free delivery",
            copy: "On every order above ₹4,999",
          },
          {
            icon: ShieldCheck,
            title: "Secure payments",
            copy: "Encrypted Razorpay checkout",
          },
          {
            icon: Undo2,
            title: "7-day returns",
            copy: "Easy pickup across India",
          },
          {
            icon: Gem,
            title: "Certified weaves",
            copy: "Silk mark on every saree",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3"
          >
            <item.icon className="mt-0.5 h-5 w-5 text-gold" />

            <div>
              <p className="text-sm font-medium">
                {item.title}
              </p>

              <p className="text-xs text-muted-foreground">
                {item.copy}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* =========================================================
          CATEGORIES
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <header className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-gold">
              The wardrobe
            </p>

            <h2 className="mt-3 font-display text-4xl sm:text-5xl">
              Shop by category
            </h2>
          </div>

          <Link
            to="/shop"
            className="eyebrow hidden text-muted-foreground hover:text-gold sm:block"
          >
            View all →
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(categories.data ?? []).map((category, index) => {
            const categoryImage =
              getCategoryImage(category);

            return (
              <Link
                key={category.id}
                to="/shop"
                search={{
                  category: category.slug,
                }}
                className={`group relative overflow-hidden ${
                  index === 0
                    ? "lg:col-span-2 lg:row-span-2"
                    : ""
                }`}
              >
                <div
                  className={
                    index === 0
                      ? "aspect-[16/12]"
                      : "aspect-[16/9]"
                  }
                >
                  <img
                    src={categoryImage}
                    alt={category.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  />
                </div>

                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,oklch(0_0_0/0.75))]" />

                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="font-display text-3xl text-white">
                    {category.name}
                  </h3>

                  <p className="eyebrow mt-1 text-white/70">
                    Discover →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          FEATURED PRODUCTS
      ========================================================= */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
          <header className="mb-10">
            <p className="eyebrow text-gold">
              Editor's selection
            </p>

            <h2 className="mt-3 font-display text-4xl sm:text-5xl">
              Featured pieces
            </h2>
          </header>

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wishlisted={ids.has(product.id)}
                onWishlist={(p) =>
                  toggle.mutate(p)
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* =========================================================
          STORY
      ========================================================= */}
      <section className="relative overflow-hidden border-y border-border">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2">
          <img
            src={storyImage}
            alt="Artisan weaving gold zari on a traditional handloom"
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />

          <div>
            <p className="eyebrow text-gold">
              Since 1978
            </p>

            <h2 className="mt-4 font-display text-4xl sm:text-5xl">
              Four generations of Tamil textile craft
            </h2>

            <p className="mt-6 text-muted-foreground">
              From a single loom on South Bazaar Street to a maison dressing
              families across India, SWAMY TEX has always begun with the
              weaver. Every drape is inspected by hand, finished in our
              Tirunelveli atelier, and shipped with the silk mark of
              authenticity.
            </p>

            <Button
              variant="couture"
              size="lg"
              className="mt-8"
              asChild
            >
              <Link to="/about">
                Read our story
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* =========================================================
          NEW PRODUCTS
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <header className="mb-10">
          <p className="eyebrow text-gold">
            Just arrived
          </p>

          <h2 className="mt-3 font-display text-4xl sm:text-5xl">
            New in the maison
          </h2>
        </header>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {newest.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              wishlisted={ids.has(product.id)}
              onWishlist={(p) =>
                toggle.mutate(p)
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}