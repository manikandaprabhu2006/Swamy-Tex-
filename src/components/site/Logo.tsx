import { Link } from "@tanstack/react-router";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex flex-col leading-none" aria-label="SWAMY TEX home">
      <span
        className={`text-gold-shine font-display ${compact ? "text-xl" : "text-2xl sm:text-3xl"} tracking-[0.22em] font-semibold`}
      >
        SWAMY TEX
      </span>
      {!compact && (
        <span className="eyebrow mt-1 text-muted-foreground">Tirunelveli · Since 1978</span>
      )}
    </Link>
  );
}
