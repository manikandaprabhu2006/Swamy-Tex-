import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const shippingSchema = z.object({
  full_name: z.string().min(2).max(80),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit Indian mobile number"),
  line1: z.string().min(4).max(160),
  line2: z.string().max(160).optional(),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  pincode: z.string().regex(/^\d{6}$/),
});

export const quoteDelivery = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ pincode: z.string().min(6).max(6), subtotal: z.number().min(0), units: z.number().min(1).max(50) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { getDeliveryQuote } = await import("./delivery.server");
    return getDeliveryQuote(data.pincode, data.subtotal, data.units * 0.6);
  });

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ shipping: shippingSchema, paymentProvider: z.enum(["razorpay", "cod"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { createOrderForUser, createRazorpayOrder } = await import("./orders.server");
    const { order } = await createOrderForUser(
      context.supabase,
      context.userId,
      data.shipping,
      data.paymentProvider,
    );

    if (data.paymentProvider === "cod") {
      return { orderId: order.id, orderNumber: order.order_number, total: Number(order.total), payment: null };
    }

    const payment = await createRazorpayOrder(Number(order.total), order.order_number);
    return { orderId: order.id, orderNumber: order.order_number, total: Number(order.total), payment };
  });

export const confirmPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        razorpayOrderId: z.string().optional(),
        razorpayPaymentId: z.string().optional(),
        razorpaySignature: z.string().optional(),
        simulate: z.enum(["success", "failure"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { verifyRazorpaySignature } = await import("./orders.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,user_id,payment_status,order_number,total")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || order.user_id !== context.userId) throw new Error("Order not found.");
    if (order.payment_status === "paid") return { status: "paid" as const };

    let paid = false;
    let reference: string | null = null;

    if (data.razorpayPaymentId && data.razorpayOrderId && data.razorpaySignature) {
      paid = await verifyRazorpaySignature(data.razorpayOrderId, data.razorpayPaymentId, data.razorpaySignature);
      reference = data.razorpayPaymentId;
    } else if (data.simulate) {
      // Used only while live payment keys are not configured.
      const keysConfigured = Boolean(process.env["RAZORPAY_KEY_ID"] && process.env["RAZORPAY_KEY_SECRET"]);
      if (keysConfigured) throw new Error("Invalid payment confirmation.");
      paid = data.simulate === "success";
      reference = paid ? `sim_${order.order_number}` : null;
    }

    if (!paid) {
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "failed", status: "pending" })
        .eq("id", order.id);
      await supabaseAdmin.from("order_events").insert({
        order_id: order.id,
        status: "payment_failed",
        note: "Payment could not be verified.",
      });
      return { status: "failed" as const };
    }

    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid", status: "confirmed", payment_reference: reference })
      .eq("id", order.id);
    await supabaseAdmin.from("order_events").insert([
      { order_id: order.id, status: "confirmed", note: "Payment received. Order confirmed." },
    ]);

    // Reduce stock and clear the cart.
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("product_id,quantity")
      .eq("order_id", order.id);
    for (const item of items ?? []) {
      if (!item.product_id) continue;
      const { data: product } = await supabaseAdmin
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .maybeSingle();
      if (product) {
        await supabaseAdmin
          .from("products")
          .update({ stock: Math.max(0, product.stock - item.quantity) })
          .eq("id", item.product_id);
      }
    }
    await supabaseAdmin.from("cart_items").delete().eq("user_id", context.userId);
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "order_paid",
      entity: "orders",
      entity_id: order.id,
      metadata: { total: order.total },
    });

    return { status: "paid" as const };
  });

export const askFashionAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        messages: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1000) }))
          .min(1)
          .max(20),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { askStylist } = await import("./stylist.server");
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: products } = await supabase
      .from("products")
      .select("name,price,fabric,color,occasion,sizes,stock,slug")
      .eq("is_active", true)
      .limit(40);

    const catalogue = (products ?? [])
      .map(
        (p: any) =>
          `- ${p.name} | Rs ${p.price} | ${p.fabric ?? "-"} | ${p.color ?? "-"} | ${p.occasion ?? "-"} | sizes: ${(p.sizes ?? []).join(", ")} | ${p.stock > 0 ? "in stock" : "sold out"} | /product/${p.slug}`,
      )
      .join("\n");

    const reply = await askStylist(data.messages, catalogue || "No products available.");
    return { reply };
  });
