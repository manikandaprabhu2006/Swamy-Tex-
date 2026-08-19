import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ordersQuery } from "@/lib/shop";
import { formatINR, orderStatusLabel } from "@/lib/format";

const TIMELINE = ["confirmed", "packed", "shipped", "out_for_delivery", "delivered"] as const;

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My orders — SWAMY TEX" },
      { name: "description", content: "Track your SWAMY TEX orders and delivery status." },
      { property: "og:title", content: "My orders — SWAMY TEX" },
      { property: "og:description", content: "Track your orders and delivery status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Orders,
});

function Orders() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery(ordersQuery(user?.id));

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-lg px-5 py-32 text-center">
        <h1 className="font-display text-4xl">Sign in to track orders</h1>
        <Button variant="gold" size="xl" className="mt-8" asChild>
          <Link to="/auth" search={{ redirect: "/orders" }}>Sign in</Link>
        </Button>
      </div>
    );
  }

  const orders = (data ?? []) as any[];

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-4xl sm:text-5xl">My orders</h1>

      {isLoading ? (
        <p className="py-16 text-sm text-muted-foreground">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-muted-foreground">You haven't placed an order yet.</p>
          <Button variant="couture" size="lg" className="mt-6" asChild>
            <Link to="/shop">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-10 space-y-8">
          {orders.map((order) => {
            const stageIndex = TIMELINE.indexOf(order.status);
            return (
              <li key={order.id} className="border border-border p-6">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow text-gold">{order.order_number}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Placed {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      {" · "}
                      {order.payment_status === "paid" ? "Paid" : orderStatusLabel(order.payment_status)}
                    </p>
                  </div>
                  <p className="font-display text-2xl">{formatINR(order.total)}</p>
                </header>

                <ul className="mt-5 space-y-3">
                  {(order.order_items ?? []).map((item: any) => (
                    <li key={item.id} className="flex items-center gap-3 text-sm">
                      <img src={item.image_url ?? ""} alt="" className="h-16 w-12 object-cover" />
                      <div className="flex-1">
                        <p>{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Size {item.size} · Qty {item.quantity}
                        </p>
                      </div>
                      <p>{formatINR(Number(item.unit_price) * item.quantity)}</p>
                    </li>
                  ))}
                </ul>

                {order.status !== "cancelled" ? (
                  <ol className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5 text-xs">
                    {TIMELINE.map((stage, index) => (
                      <li
                        key={stage}
                        className={`flex items-center gap-1.5 ${index <= stageIndex ? "text-gold" : "text-muted-foreground"}`}
                      >
                        {index <= stageIndex ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}
                        {orderStatusLabel(stage)}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-6 border-t border-border pt-5 text-xs text-destructive">
                    This order was cancelled.
                  </p>
                )}

                {order.tracking_number && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Delhivery tracking: <span className="text-foreground">{order.tracking_number}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
