import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Handpicked silks, couture gowns and everyday elegance — crafted and curated in Tirunelveli,
            Tamil Nadu.
          </p>
        </div>

        <nav aria-label="Shop" className="space-y-3 text-sm">
          <h2 className="eyebrow text-gold">Shop</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/shop" className="hover:text-foreground">All collections</Link></li>
            <li><Link to="/shop" search={{ category: "sarees" }} className="hover:text-foreground">Sarees</Link></li>
            <li><Link to="/shop" search={{ category: "lehengas" }} className="hover:text-foreground">Lehengas</Link></li>
            <li><Link to="/shop" search={{ category: "menswear" }} className="hover:text-foreground">Menswear</Link></li>
          </ul>
        </nav>

        <nav aria-label="Customer care" className="space-y-3 text-sm">
          <h2 className="eyebrow text-gold">Customer care</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/orders" className="hover:text-foreground">Track my order</Link></li>
            <li><Link to="/account" className="hover:text-foreground">My account</Link></li>
            <li><Link to="/about" className="hover:text-foreground">Our story</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact & stores</Link></li>
          </ul>
        </nav>

        <address className="space-y-3 text-sm not-italic text-muted-foreground">
          <h2 className="eyebrow text-gold">Visit us</h2>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            42 South Bazaar Street, Tirunelveli, Tamil Nadu 627001
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gold" /> +91 90000 12345
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gold" /> care@swamytex.in
          </p>
          <p className="flex items-center gap-2">
            <Instagram className="h-4 w-4 text-gold" /> @swamytex
          </p>
        </address>
      </div>

      <div className="border-t border-border px-5 py-6 text-center text-xs text-muted-foreground sm:px-8">
        © {new Date().getFullYear()} SWAMY TEX. All rights reserved. Secure payments · Pan-India delivery.
      </div>
    </footer>
  );
}
