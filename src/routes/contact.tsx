import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Stores — SWAMY TEX Tirunelveli" },
      {
        name: "description",
        content:
          "Reach the SWAMY TEX team in Tirunelveli for styling help, order support, bulk and bridal enquiries.",
      },
      { property: "og:title", content: "Contact & Stores — SWAMY TEX" },
      { property: "og:description", content: "Styling help, order support and bridal enquiries." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <header className="max-w-2xl">
        <p className="eyebrow text-gold">We're here</p>
        <h1 className="mt-4 font-display text-5xl">Contact the maison</h1>
        <p className="mt-4 text-muted-foreground">
          Styling advice, order updates, bridal appointments or bulk orders — our Tirunelveli team replies
          within one working day.
        </p>
      </header>

      <div className="mt-14 grid gap-14 lg:grid-cols-2">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
            toast.success("Message received. We'll reply within one working day.");
            (event.target as HTMLFormElement).reset();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" required maxLength={80} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile</Label>
              <Input id="phone" inputMode="numeric" pattern="[6-9][0-9]{9}" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">How can we help?</Label>
            <Textarea id="message" rows={6} required maxLength={1000} />
          </div>
          <Button type="submit" variant="gold" size="xl">
            {sent ? "Send another message" : "Send message"}
          </Button>
        </form>

        <div className="space-y-8">
          <div className="border border-border p-6">
            <h2 className="eyebrow text-gold">Flagship store</h2>
            <address className="mt-4 space-y-3 text-sm not-italic text-muted-foreground">
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-gold" />
                42 South Bazaar Street, Tirunelveli, Tamil Nadu 627001
              </p>
              <p className="flex items-center gap-3"><Phone className="h-4 w-4 text-gold" /> +91 90000 12345</p>
              <p className="flex items-center gap-3"><Mail className="h-4 w-4 text-gold" /> care@swamytex.in</p>
              <p className="flex items-center gap-3"><Clock className="h-4 w-4 text-gold" /> Open daily 10am – 9pm</p>
            </address>
          </div>

          <div className="border border-border p-6">
            <h2 className="eyebrow text-gold">Bridal appointments</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Private styling sessions with our master weaver are available on weekday mornings. Call ahead
              to reserve the bridal suite.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
