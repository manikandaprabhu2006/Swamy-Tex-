import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useShop";
import { formatINR } from "@/lib/format";
import { placeOrder, confirmPayment, quoteDelivery } from "@/lib/shop.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure checkout — SWAMY TEX" },
      { name: "description", content: "Complete your SWAMY TEX order with encrypted payment." },
      { property: "og:title", content: "Secure checkout — SWAMY TEX" },
      { property: "og:description", content: "Encrypted checkout with pan-India delivery." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

type Quote = { fee: number; etaDays: number; zone: string; serviceable: boolean; codAvailable: boolean };

function Checkout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useAuth();
  const { items, subtotal } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [method, setMethod] = useState<"razorpay" | "cod">("razorpay");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
  });

  const getQuote = useServerFn(quoteDelivery);
  const submitOrder = useServerFn(placeOrder);
  const confirm = useServerFn(confirmPayment);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/checkout" }, replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!/^\d{6}$/.test(form.pincode) || items.length === 0) {
      setQuote(null);
      return;
    }
    let active = true;
    getQuote({ data: { pincode: form.pincode, subtotal, units: items.length } })
      .then((result) => active && setQuote(result))
      .catch(() => active && setQuote(null));
    return () => {
      active = false;
    };
  }, [form.pincode, subtotal, items.length, getQuote]);

  const pay = useMutation({
    mutationFn: async () => {
      const { line2, ...rest } = form;
      const created = await submitOrder({
        data: {
          shipping: line2 ? { ...rest, line2 } : rest,
          paymentProvider: method,
        },
      });

      if (method === "cod") return { orderNumber: created.orderNumber, status: "placed" as const };

      const payment = created.payment!;
      if (payment.provider === "simulated") {
        const result = await confirm({ data: { orderId: created.orderId, simulate: "success" } });
        return { orderNumber: created.orderNumber, status: result.status };
      }

      await loadRazorpay();
      const response = await new Promise<any>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: payment.keyId,
          order_id: payment.providerOrderId,
          amount: payment.amountPaise,
          currency: payment.currency,
          name: "SWAMY TEX",
          description: created.orderNumber,
          prefill: { name: form.full_name, contact: form.phone, email: user?.email },
          theme: { color: "#c8a24a" },
          handler: resolve,
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        rzp.open();
      });

      const result = await confirm({
        data: {
          orderId: created.orderId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        },
      });
      return { orderNumber: created.orderNumber, status: result.status };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      if (result.status === "failed") {
        toast.error("Payment could not be verified. Please try again.");
        return;
      }
      toast.success(`Order ${result.orderNumber} confirmed`);
      navigate({ to: "/orders" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-5 py-32 text-center">
        <h1 className="font-display text-4xl">Nothing to check out</h1>
        <Button variant="gold" size="xl" className="mt-8" asChild>
          <Link to="/shop">Browse collections</Link>
        </Button>
      </div>
    );
  }

  const deliveryFee = quote?.fee ?? (subtotal >= 4999 ? 0 : 149);
  const total = subtotal + deliveryFee;
  const canPay =
    /^\d{6}$/.test(form.pincode) &&
    /^[6-9]\d{9}$/.test(form.phone) &&
    form.full_name.length > 1 &&
    form.line1.length > 3 &&
    form.city.length > 1 &&
    quote?.serviceable !== false;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-4xl sm:text-5xl">Checkout</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            pay.mutate();
          }}
        >
          <section className="space-y-4">
            <h2 className="eyebrow text-gold">Delivery address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="full_name" label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
              <Field id="phone" label="Mobile number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} inputMode="numeric" />
            </div>
            <Field id="line1" label="Address line 1" value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} />
            <Field id="line2" label="Address line 2 (optional)" value={form.line2} onChange={(v) => setForm({ ...form, line2: v })} required={false} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="city" label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <Field id="state" label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
              <Field id="pincode" label="Pincode" value={form.pincode} onChange={(v) => setForm({ ...form, pincode: v })} inputMode="numeric" />
            </div>
            {quote && (
              <p className="text-xs text-muted-foreground">
                {quote.serviceable
                  ? `${quote.zone} · arrives in ~${quote.etaDays} working day${quote.etaDays > 1 ? "s" : ""} · ${quote.fee === 0 ? "free delivery" : formatINR(quote.fee)}`
                  : "We don't deliver to this pincode yet."}
              </p>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="eyebrow text-gold">Payment</h2>
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as "razorpay" | "cod")} className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 border border-border p-4">
                <RadioGroupItem value="razorpay" id="pay-online" className="mt-1" />
                <span>
                  <span className="block text-sm font-medium">Pay online</span>
                  <span className="block text-xs text-muted-foreground">
                    UPI, cards, netbanking and wallets via encrypted Razorpay checkout.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 border border-border p-4">
                <RadioGroupItem value="cod" id="pay-cod" className="mt-1" disabled={quote?.codAvailable === false} />
                <span>
                  <span className="block text-sm font-medium">Cash on delivery</span>
                  <span className="block text-xs text-muted-foreground">
                    Available on eligible pincodes and orders up to ₹20,000.
                  </span>
                </span>
              </label>
            </RadioGroup>
          </section>

          <Button type="submit" variant="gold" size="xl" className="w-full" disabled={!canPay || pay.isPending}>
            {pay.isPending ? <Loader2 className="animate-spin" /> : <Lock />}
            {pay.isPending ? "Processing…" : `Pay ${formatINR(total)}`}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Card details are handled entirely by our payment provider — never by SWAMY TEX.
          </p>
        </form>

        <aside className="h-fit border border-border p-6">
          <h2 className="eyebrow text-gold">Your order</h2>
          <ul className="mt-5 space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3 text-sm">
                <img src={item.products?.images?.[0] ?? ""} alt="" className="h-16 w-12 object-cover" />
                <div className="flex-1">
                  <p>{item.products?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Size {item.size} · Qty {item.quantity}
                  </p>
                </div>
                <p>{formatINR(Number(item.products?.price ?? 0) * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>{deliveryFee === 0 ? "Free" : formatINR(deliveryFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-display text-xl">
              <dt>Total</dt>
              <dd>{formatINR(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  inputMode,
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "numeric";
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        required={required}
        {...(inputMode ? { inputMode } : {})}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function loadRazorpay(): Promise<void> {
  if ((window as any).Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment gateway."));
    document.body.appendChild(script);
  });
}
