import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LogOut, Menu, Search, ShoppingBag, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useCart, useWishlist } from "@/hooks/useShop";

const NAV = [
  { label: "Sarees", category: "sarees" },
  { label: "Lehengas", category: "lehengas" },
  { label: "Gowns", category: "gowns" },
  { label: "Menswear", category: "menswear" },
  { label: "Kids", category: "kids" },
] as const;

export function Header() {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const { items: wishlistItems } = useWishlist();
  const [term, setTerm] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate({ to: "/shop", search: { q: term.trim() || undefined } });
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:h-20 sm:px-8">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm bg-background p-6">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Logo />
            <form onSubmit={submitSearch} className="mt-6">
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search silks, gowns, kurtas…"
                aria-label="Search products"
              />
            </form>
            <nav className="mt-8 space-y-4">
              <Link to="/shop" onClick={() => setMobileOpen(false)} className="block font-display text-2xl">
                All collections
              </Link>
              {NAV.map((item) => (
                <Link
                  key={item.category}
                  to="/shop"
                  search={{ category: item.category }}
                  onClick={() => setMobileOpen(false)}
                  className="block font-display text-2xl"
                >
                  {item.label}
                </Link>
              ))}
              <Link to="/about" onClick={() => setMobileOpen(false)} className="block font-display text-2xl">
                Our story
              </Link>
              <Link to="/contact" onClick={() => setMobileOpen(false)} className="block font-display text-2xl">
                Contact
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <Logo compact />

        <nav className="ml-8 hidden items-center gap-7 lg:flex" aria-label="Main">
          <Link to="/shop" className="eyebrow text-muted-foreground transition-colors hover:text-gold">
            All
          </Link>
          {NAV.map((item) => (
            <Link
              key={item.category}
              to="/shop"
              search={{ category: item.category }}
              className="eyebrow text-muted-foreground transition-colors hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
          <Link to="/about" className="eyebrow text-muted-foreground transition-colors hover:text-gold">
            Story
          </Link>
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 items-center md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search the maison"
              aria-label="Search products"
              className="pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild aria-label="Wishlist">
            <Link to="/wishlist" className="relative">
              <Heart />
              {wishlistItems.length > 0 && <Dot value={wishlistItems.length} />}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="Shopping bag">
            <Link to="/cart" className="relative">
              <ShoppingBag />
              {count > 0 && <Dot value={count} />}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <User2 />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link to="/account">My account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders">My orders</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Admin dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="couture" size="sm" asChild className="ml-1 hidden sm:inline-flex">
              <Link to="/auth" search={{ redirect: undefined }}>Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function Dot({ value }: { value: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold-gradient px-1 text-[0.6rem] font-semibold text-[oklch(0.16_0_0)]">
      {value}
    </span>
  );
}
