import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Logo } from "@/components/site/Logo";

type AuthSearch = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const value = search["redirect"];
    const safe = typeof value === "string" && value.startsWith("/") && !value.startsWith("//");
    return { redirect: safe ? (value as string) : undefined };
  },
  head: () => ({
    meta: [
      { title: "Sign in — SWAMY TEX" },
      {
        name: "description",
        content: "Sign in or create your SWAMY TEX account to shop, track orders and save favourites.",
      },
      { property: "og:title", content: "Sign in — SWAMY TEX" },
      { property: "og:description", content: "Access your SWAMY TEX account securely." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: redirect ?? "/", replace: true });
  }, [loading, user, redirect, navigate]);

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-5 py-16">
      <div className="mb-10 text-center">
        <Logo />
      </div>

      <Tabs defaultValue="signin">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Create account</TabsTrigger>
        </TabsList>
        <TabsContent value="signin" className="pt-6">
          <SignInForm redirect={redirect} />
        </TabsContent>
        <TabsContent value="signup" className="pt-6">
          <SignUpForm />
        </TabsContent>
      </Tabs>

      <div className="my-8 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton />

      <p className="mt-8 text-center text-xs text-muted-foreground">
        By continuing you agree to our terms of service and privacy policy. We never store card details.
      </p>
    </div>
  );
}

function GoogleButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="lg"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
        if (result.error) {
          setBusy(false);
          toast.error("Google sign-in failed. Please try again.");
          return;
        }
        if (result.redirected) return;
        window.location.replace("/");
      }}
    >
      Continue with Google
    </Button>
  );
}

function SignInForm({ redirect }: { redirect?: string | undefined }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setBusy(false);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Welcome back");
        navigate({ to: redirect ?? "/", replace: true });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [stage, setStage] = useState<"details" | "otp">("details");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  if (stage === "otp") {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display text-2xl">Verify your email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a 6-digit code to {form.email}. Enter it to activate your account.
          </p>
        </div>
        <InputOTP maxLength={6} value={otp} onChange={setOtp} aria-label="Verification code">
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <Button
          variant="gold"
          size="lg"
          className="w-full"
          disabled={busy || otp.length !== 6}
          onClick={async () => {
            setBusy(true);
            const { error } = await supabase.auth.verifyOtp({
              email: form.email,
              token: otp,
              type: "email",
            });
            setBusy(false);
            if (error) {
              toast.error(error.message);
              return;
            }
            toast.success("Account verified. Welcome to SWAMY TEX.");
          }}
        >
          {busy ? "Verifying…" : "Verify & continue"}
        </Button>
        <button
          type="button"
          className="w-full text-xs text-muted-foreground underline"
          onClick={async () => {
            const { error } = await supabase.auth.resend({ type: "signup", email: form.email });
            toast[error ? "error" : "success"](error ? error.message : "Code sent again");
          }}
        >
          Resend code
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (form.password.length < 8) {
          toast.error("Use at least 8 characters for your password.");
          return;
        }
        setBusy(true);
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: form.name, phone: form.phone },
          },
        });
        setBusy(false);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Verification code sent to your email");
        setStage("otp");
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full name</Label>
        <Input
          id="signup-name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-phone">Mobile number</Label>
        <Input
          id="signup-phone"
          inputMode="numeric"
          pattern="[6-9][0-9]{9}"
          placeholder="10 digit mobile"
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
      </div>
      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
