import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { addressesQuery } from "@/lib/shop";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My account — SWAMY TEX" },
      { name: "description", content: "Manage your SWAMY TEX profile, saved addresses and preferences." },
      { property: "og:title", content: "My account — SWAMY TEX" },
      { property: "og:description", content: "Manage your profile and saved addresses." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Account,
});

function Account() {
  const { user, loading, signOut } = useAuth();
  const qc = useQueryClient();
  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const addresses = useQuery(addressesQuery(user?.id));

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name,phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({ full_name: data.full_name ?? "", phone: data.phone ?? "" });
      });
  }, [user]);

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-lg px-5 py-32 text-center">
        <h1 className="font-display text-4xl">Sign in to your account</h1>
        <Button variant="gold" size="xl" className="mt-8" asChild>
          <Link to="/auth" search={{ redirect: "/account" }}>Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-4xl sm:text-5xl">My account</h1>
      <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>

      <form
        className="mt-10 space-y-5 border border-border p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!user) return;
          setSaving(true);
          const { error } = await supabase
            .from("profiles")
            .update({ full_name: profile.full_name, phone: profile.phone })
            .eq("id", user.id);
          setSaving(false);
          toast[error ? "error" : "success"](error ? error.message : "Profile updated");
          qc.invalidateQueries({ queryKey: ["profile"] });
        }}
      >
        <h2 className="eyebrow text-gold">Profile</h2>
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Mobile number</Label>
          <Input
            id="phone"
            inputMode="numeric"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          />
        </div>
        <Button type="submit" variant="gold" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <section className="mt-8 border border-border p-6">
        <h2 className="eyebrow text-gold">Saved addresses</h2>
        {(addresses.data ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No saved addresses yet — the address you enter at checkout is used for that order.
          </p>
        ) : (
          <ul className="mt-4 space-y-4 text-sm">
            {(addresses.data as any[]).map((address) => (
              <li key={address.id} className="border-b border-border pb-3 last:border-0">
                <p className="font-medium">{address.full_name}</p>
                <p className="text-muted-foreground">
                  {address.line1}, {address.city}, {address.state} {address.pincode}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 flex gap-3">
        <Button variant="couture" asChild>
          <Link to="/orders">View my orders</Link>
        </Button>
        <Button variant="ghost" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
