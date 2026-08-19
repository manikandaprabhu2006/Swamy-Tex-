import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/site/ProductCard";
import { categoriesQuery, productsQuery } from "@/lib/shop";
import { useWishlist, useWishlistActions } from "@/hooks/useShop";
import { formatINR } from "@/lib/format";

type ShopSearch = { q?: string | undefined; category?: string | undefined; sort?: string | undefined };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    q: typeof search["q"] === "string" && search["q"] ? search["q"] : undefined,
    category:
      typeof search["category"] === "string" && search["category"] ? search["category"] : undefined,
    sort: typeof search["sort"] === "string" ? search["sort"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Collections — SWAMY TEX" },
      {
        name: "description",
        content:
          "Browse silk sarees, lehengas, gowns, menswear and kidswear from SWAMY TEX. Filter by fabric, colour, occasion and price.",
      },
      { property: "og:title", content: "Shop Collections — SWAMY TEX" },
      {
        property: "og:description",
        content: "Filter premium Indian fashion by fabric, colour, occasion and price.",
      },
    ],
  }),
  component: Shop,
});

const MAX_PRICE = 60000;

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const products = useQuery(productsQuery);
  const categories = useQuery(categoriesQuery);
  const { ids } = useWishlist();
  const { toggle } = useWishlistActions();

  const [fabrics, setFabrics] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [price, setPrice] = useState<number[]>([0, MAX_PRICE]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [term, setTerm] = useState(search.q ?? "");

  const all = products.data ?? [];
  const categoryId = categories.data?.find((c) => c.slug === search.category)?.id;

  const fabricOptions = useMemo(
    () => Array.from(new Set(all.map((p) => p.fabric).filter(Boolean) as string[])).sort(),
    [all],
  );
  const colorOptions = useMemo(
    () => Array.from(new Set(all.map((p) => p.color).filter(Boolean) as string[])).sort(),
    [all],
  );

  const results = useMemo(() => {
    const q = (search.q ?? "").toLowerCase();
    let list = all.filter((p) => p.is_active);
    if (categoryId) list = list.filter((p) => p.category_id === categoryId);
    if (q) {
      list = list.filter((p) =>
        [p.name, p.fabric, p.color, p.occasion, p.description]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q)),
      );
    }
    if (fabrics.length) list = list.filter((p) => p.fabric && fabrics.includes(p.fabric));
    if (colors.length) list = list.filter((p) => p.color && colors.includes(p.color));
    list = list.filter((p) => Number(p.price) >= price[0]! && Number(p.price) <= price[1]!);
    if (inStockOnly) list = list.filter((p) => p.stock > 0);

    switch (search.sort) {
      case "price-asc":
        return [...list].sort((a, b) => Number(a.price) - Number(b.price));
      case "price-desc":
        return [...list].sort((a, b) => Number(b.price) - Number(a.price));
      case "rating":
        return [...list].sort((a, b) => Number(b.rating) - Number(a.rating));
      default:
        return list;
    }
  }, [all, categoryId, search.q, search.sort, fabrics, colors, price, inStockOnly]);

  const activeCategory = categories.data?.find((c) => c.slug === search.category);

  const filters = (
    <div className="space-y-8">
      <div>
        <h2 className="eyebrow mb-3 text-gold">Categories</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <button
              className={!search.category ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
              onClick={() => navigate({ search: (prev) => ({ ...prev, category: undefined }) })}
            >
              All pieces
            </button>
          </li>
          {(categories.data ?? []).map((category) => (
            <li key={category.id}>
              <button
                className={
                  search.category === category.slug
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }
                onClick={() => navigate({ search: (prev) => ({ ...prev, category: category.slug }) })}
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="eyebrow mb-3 text-gold">Price</h2>
        <Slider
          value={price}
          onValueChange={setPrice}
          min={0}
          max={MAX_PRICE}
          step={500}
          aria-label="Price range"
        />
        <p className="mt-3 text-xs text-muted-foreground">
          {formatINR(price[0]!)} – {formatINR(price[1]!)}
        </p>
      </div>

      {fabricOptions.length > 0 && (
        <div>
          <h2 className="eyebrow mb-3 text-gold">Fabric</h2>
          <div className="space-y-2">
            {fabricOptions.map((fabric) => (
              <label key={fabric} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={fabrics.includes(fabric)}
                  onCheckedChange={(checked) =>
                    setFabrics((prev) =>
                      checked ? [...prev, fabric] : prev.filter((f) => f !== fabric),
                    )
                  }
                />
                {fabric}
              </label>
            ))}
          </div>
        </div>
      )}

      {colorOptions.length > 0 && (
        <div>
          <h2 className="eyebrow mb-3 text-gold">Colour</h2>
          <div className="space-y-2">
            {colorOptions.map((color) => (
              <label key={color} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={colors.includes(color)}
                  onCheckedChange={(checked) =>
                    setColors((prev) => (checked ? [...prev, color] : prev.filter((c) => c !== color)))
                  }
                />
                {color}
              </label>
            ))}
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={inStockOnly} onCheckedChange={(v) => setInStockOnly(Boolean(v))} />
        In stock only
      </label>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <header className="mb-10">
        <p className="eyebrow text-gold">{activeCategory ? "Collection" : "The maison"}</p>
        <h1 className="mt-3 font-display text-4xl sm:text-6xl">
          {activeCategory?.name ?? (search.q ? `Results for “${search.q}”` : "All collections")}
        </h1>
        {activeCategory?.description && (
          <p className="mt-4 max-w-2xl text-muted-foreground">{activeCategory.description}</p>
        )}
      </header>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <form
          className="flex-1 min-w-[200px]"
          onSubmit={(event) => {
            event.preventDefault();
            navigate({ search: (prev) => ({ ...prev, q: term.trim() || undefined }) });
          }}
        >
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search within collections"
            aria-label="Search within collections"
          />
        </form>

        <Select
          value={search.sort ?? "new"}
          onValueChange={(value) => navigate({ search: (prev) => ({ ...prev, sort: value }) })}
        >
          <SelectTrigger className="w-44" aria-label="Sort products">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Newest first</SelectItem>
            <SelectItem value="price-asc">Price: low to high</SelectItem>
            <SelectItem value="price-desc">Price: high to low</SelectItem>
            <SelectItem value="rating">Top rated</SelectItem>
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden">
              <SlidersHorizontal /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm overflow-y-auto p-6">
            <SheetTitle className="font-display text-2xl">Filters</SheetTitle>
            <div className="mt-6">{filters}</div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>

        <div>
          {products.isLoading ? (
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse bg-card-elevated" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="py-24 text-center">
              <h2 className="font-display text-2xl">No pieces match those filters</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try widening the price range or clearing a filter.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-6 text-xs text-muted-foreground">{results.length} pieces</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3">
                {results.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 3}
                    wishlisted={ids.has(product.id)}
                    onWishlist={(p) => toggle.mutate(p)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
