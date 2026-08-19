import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { productsQuery } from "@/lib/shop";
import { formatINR, orderStatusLabel, ORDER_STATUSES } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — SWAMY TEX" },
      { name: "description", content: "Internal dashboard for SWAMY TEX inventory and orders." },
      { property: "og:title", content: "Admin dashboard — SWAMY TEX" },
      { property: "og:description", content: "Internal operations dashboard." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const products = useQuery(productsQuery);

  const orders = useQuery({
    queryKey: ["admin-orders"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (loading) return <p className="px-5 py-24 text-center text-sm text-muted-foreground">Loading…</p>;

  if (!user || !isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-5 py-32 text-center">
        <h1 className="font-display text-4xl">Restricted area</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This dashboard is available to SWAMY TEX staff accounts only.
        </p>
        <Button variant="gold" size="xl" className="mt-8" asChild>
          <Link to="/">Back to the store</Link>
        </Button>
      </div>
    );
  }

  const allOrders = (orders.data ?? []) as any[];
  const revenue = allOrders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.total), 0);
  const lowStock = (products.data ?? []).filter((p) => p.stock <= 3);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <header>
        <p className="eyebrow text-gold">Operations</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">Admin dashboard</h1>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Paid revenue" value={formatINR(revenue)} />
        <Stat label="Orders" value={String(allOrders.length)} />
        <Stat label="Products" value={String((products.data ?? []).length)} />
        <Stat label="Low stock" value={String(lowStock.length)} />
      </div>

      <Tabs defaultValue="orders" className="mt-10">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="pt-6">
          {allOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="space-y-4">
              {allOrders.map((order) => (
                <li key={order.id} className="border border-border p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="eyebrow text-gold">{order.order_number}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString("en-IN")} ·{" "}
                        {order.shipping_address?.city} {order.shipping_address?.pincode} ·{" "}
                        {order.payment_status}
                      </p>
                    </div>
                    <p className="font-display text-xl">{formatINR(order.total)}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Select
                      value={order.status}
                      onValueChange={async (status) => {
                        const { error } = await supabase
                          .from("orders")
                          .update({ status })
                          .eq("id", order.id);
                        if (error) {
                          toast.error(error.message);
                          return;
                        }
                        await supabase.from("order_events").insert({ order_id: order.id, status });
                        toast.success(`Order marked ${orderStatusLabel(status)}`);
                        qc.invalidateQueries({ queryKey: ["admin-orders"] });
                      }}
                    >
                      <SelectTrigger className="w-52" aria-label="Order status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {orderStatusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      defaultValue={order.tracking_number ?? ""}
                      placeholder="Delhivery AWB"
                      className="w-52"
                      aria-label="Tracking number"
                      onBlur={async (event) => {
                        const value = event.target.value.trim();
                        if (value === (order.tracking_number ?? "")) return;
                        const { error } = await supabase
                          .from("orders")
                          .update({ tracking_number: value || null })
                          .eq("id", order.id);
                        toast[error ? "error" : "success"](error ? error.message : "Tracking saved");
                        qc.invalidateQueries({ queryKey: ["admin-orders"] });
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="pt-6">
          <ul className="divide-y divide-border border-y border-border">
            {(products.data ?? []).map((product) => (
              <li key={product.id} className="flex flex-wrap items-center gap-4 py-4">
                <img src={product.images[0] ?? ""} alt="" className="h-16 w-12 object-cover" />
                <div className="min-w-40 flex-1">
                  <p className="text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatINR(product.price)} · {product.fabric ?? "—"}
                  </p>
                </div>
                <Input
                  type="number"
                  min={0}
                  defaultValue={product.stock}
                  className="w-28"
                  aria-label={`Stock for ${product.name}`}
                  onBlur={async (event) => {
                    const stock = Number(event.target.value);
                    if (!Number.isFinite(stock) || stock === product.stock) return;
                    const { error } = await supabase
                      .from("products")
                      .update({ stock })
                      .eq("id", product.id);
                    toast[error ? "error" : "success"](error ? error.message : "Stock updated");
                    qc.invalidateQueries({ queryKey: ["products"] });
                  }}
                />
                <span
                  className={`eyebrow ${product.stock === 0 ? "text-destructive" : product.stock <= 3 ? "text-gold" : "text-muted-foreground"}`}
                >
                  {product.stock === 0 ? "Sold out" : product.stock <= 3 ? "Low" : "In stock"}
                </span>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border p-5">
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}
