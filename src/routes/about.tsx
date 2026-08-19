import { createFileRoute, Link } from "@tanstack/react-router";
import storyImage from "@/assets/story.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — SWAMY TEX, Tirunelveli" },
      {
        name: "description",
        content:
          "Four generations of Tamil textile craft. Learn how SWAMY TEX weaves Kanchipuram silks and couture in Tirunelveli.",
      },
      { property: "og:title", content: "Our Story — SWAMY TEX" },
      { property: "og:description", content: "Four generations of Tamil textile craft in Tirunelveli." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div>
      <section className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8">
        <p className="eyebrow text-gold">Est. 1978 · Tirunelveli</p>
        <h1 className="mt-5 font-display text-5xl sm:text-6xl">
          A house built on the <span className="text-gold-shine">handloom</span>
        </h1>
        <p className="mt-6 text-muted-foreground">
          SWAMY TEX began as a single loom on South Bazaar Street, weaving cotton for the families of
          Tirunelveli. Today the maison dresses celebrations across India — but every drape still begins
          with a weaver, a warp and a story.
        </p>
      </section>

      <img
        src={storyImage}
        alt="Artisan weaving gold zari thread on a traditional handloom"
        className="mx-auto aspect-[21/9] w-full max-w-6xl object-cover px-5 sm:px-8"
        loading="lazy"
      />

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-3">
        {[
          {
            title: "The weavers",
            copy: "We work directly with 60 weaving families across Tamil Nadu. No middlemen, fair wages, and silk-mark certification on every saree.",
          },
          {
            title: "The atelier",
            copy: "Blouses, gowns and sherwanis are finished in-house. Each piece is pressed, inspected and photographed by our own team before dispatch.",
          },
          {
            title: "The promise",
            copy: "Authentic fabrics, honest pricing and a 7-day return window. If a drape doesn't feel right, we make it right.",
          },
        ].map((block) => (
          <article key={block.title}>
            <h2 className="font-display text-2xl">{block.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{block.copy}</p>
          </article>
        ))}
      </section>

      <section className="border-y border-border">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8">
          <h2 className="font-display text-4xl">Visit the flagship</h2>
          <p className="mt-3 text-muted-foreground">
            42 South Bazaar Street, Tirunelveli — open daily, 10am to 9pm.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="gold" size="xl" asChild>
              <Link to="/shop">Shop online</Link>
            </Button>
            <Button variant="couture" size="xl" asChild>
              <Link to="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
