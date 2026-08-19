import type { SupabaseClient } from "@supabase/supabase-js";
import { getDeliveryQuote } from "./delivery.server";

type AnyClient = SupabaseClient<any, any, any>;

export type ShippingInput = {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | undefined;
  city: string;
  state: string;
  pincode: string;
};

export function generateOrderNumber(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ST-${stamp}-${rand}`;
}

/**
 * Builds the order from server-side cart + product rows. Prices are NEVER taken
 * from the client — they are re-read from the products table.
 */
export async function createOrderForUser(
  supabase: AnyClient,
  userId: string,
  shipping: ShippingInput,
  paymentProvider: "razorpay" | "cod",
) {
  const { data: cart, error: cartError } = await supabase
    .from("cart_items")
    .select("id,quantity,size,product_id,products(id,name,price,images,stock,is_active)");
  if (cartError) throw new Error(cartError.message);
  if (!cart || cart.length === 0) throw new Error("Your cart is empty.");

  let subtotal = 0;
  const items = cart.map((row: any) => {
    const product = row.products;
    if (!product || !product.is_active) throw new Error("A product in your cart is no longer available.");
    if (product.stock < row.quantity) throw new Error(`${product.name} does not have enough stock.`);
    const unitPrice = Number(product.price);
    subtotal += unitPrice * row.quantity;
    return {
      product_id: product.id,
      name: product.name,
      size: row.size,
      unit_price: unitPrice,
      quantity: row.quantity,
      image_url: product.images?.[0] ?? null,
    };
  });

  const quote = await getDeliveryQuote(shipping.pincode, subtotal, cart.length * 0.6);
  if (!quote.serviceable) throw new Error("We do not deliver to that pincode yet.");
  if (paymentProvider === "cod" && !quote.codAvailable) {
    throw new Error("Cash on delivery is not available for this order.");
  }

  const total = subtotal + quote.fee;
  const orderNumber = generateOrderNumber();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: userId,
      status: "pending",
      payment_status: paymentProvider === "cod" ? "cod_pending" : "pending",
      payment_provider: paymentProvider,
      subtotal,
      delivery_fee: quote.fee,
      total,
      shipping_address: shipping,
    })
    .select("*")
    .single();
  if (orderError) throw new Error(orderError.message);

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(items.map((item) => ({ ...item, order_id: order.id })));
  if (itemsError) throw new Error(itemsError.message);

  return { order, items, quote };
}

export type RazorpayOrder = {
  provider: "razorpay" | "simulated";
  keyId: string | null;
  providerOrderId: string;
  amountPaise: number;
  currency: "INR";
};

export async function createRazorpayOrder(
  amount: number,
  receipt: string,
): Promise<RazorpayOrder> {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  const amountPaise = Math.round(amount * 100);

  if (!keyId || !keySecret) {
    // Keys not imported yet — return a simulated order so checkout is testable.
    return {
      provider: "simulated",
      keyId: null,
      providerOrderId: `sim_${receipt}`,
      amountPaise,
      currency: "INR",
    };
  }

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
    },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed (${res.status})`);
  const json = (await res.json()) as { id: string };
  return { provider: "razorpay", keyId, providerOrderId: json.id, amountPaise, currency: "INR" };
}

/** HMAC-SHA256 verification of the Razorpay checkout signature. */
export async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<boolean> {
  const secret = process.env["RAZORPAY_KEY_SECRET"];
  if (!secret) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${orderId}|${paymentId}`));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === signature;
}
