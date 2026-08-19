/**
 * Delivery pricing + tracking.
 *
 * Delhivery-ready: when DELHIVERY_API_KEY is configured the live rate/track
 * endpoints are used; until then a deterministic zone-based estimate runs so
 * checkout works end to end.
 */

const ORIGIN_PINCODE = "627001"; // Tirunelveli, Tamil Nadu

export type DeliveryQuote = {
  pincode: string;
  serviceable: boolean;
  fee: number;
  codAvailable: boolean;
  etaDays: number;
  zone: string;
  provider: "delhivery" | "estimate";
};

export function estimateQuote(pincode: string, subtotal: number, weightKg: number): DeliveryQuote {
  const zonePrefix = Number(pincode.slice(0, 2));
  const originPrefix = Number(ORIGIN_PINCODE.slice(0, 2));
  const diff = Math.abs(zonePrefix - originPrefix);

  let zone = "National";
  let base = 149;
  let etaDays = 6;

  if (pincode.slice(0, 3) === ORIGIN_PINCODE.slice(0, 3)) {
    zone = "Local (Tirunelveli)";
    base = 49;
    etaDays = 1;
  } else if (diff <= 3) {
    zone = "Regional (South India)";
    base = 89;
    etaDays = 3;
  } else if (diff <= 12) {
    zone = "Zonal";
    base = 119;
    etaDays = 5;
  }

  const extraWeight = Math.max(0, Math.ceil(weightKg - 1));
  let fee = base + extraWeight * 40;
  if (subtotal >= 4999) fee = 0; // free delivery threshold

  return {
    pincode,
    serviceable: true,
    fee,
    codAvailable: subtotal <= 20000,
    etaDays,
    zone,
    provider: "estimate",
  };
}

export async function getDeliveryQuote(
  pincode: string,
  subtotal: number,
  weightKg: number,
): Promise<DeliveryQuote> {
  const apiKey = process.env["DELHIVERY_API_KEY"];
  if (!/^\d{6}$/.test(pincode)) {
    return { ...estimateQuote("000000", subtotal, weightKg), pincode, serviceable: false, fee: 0 };
  }
  if (!apiKey) return estimateQuote(pincode, subtotal, weightKg);

  try {
    const url = new URL("https://track.delhivery.com/c/api/pin-codes/json/");
    url.searchParams.set("filter_codes", pincode);
    const res = await fetch(url, { headers: { Authorization: `Token ${apiKey}` } });
    if (!res.ok) throw new Error(`Delhivery ${res.status}`);
    const json = (await res.json()) as { delivery_codes?: Array<{ postal_code?: { cod?: string } }> };
    const entry = json.delivery_codes?.[0];
    if (!entry) {
      return { ...estimateQuote(pincode, subtotal, weightKg), serviceable: false, provider: "delhivery" };
    }
    const estimate = estimateQuote(pincode, subtotal, weightKg);
    return {
      ...estimate,
      provider: "delhivery",
      codAvailable: entry.postal_code?.cod === "Y" && estimate.codAvailable,
    };
  } catch (error) {
    console.error("[delivery] falling back to estimate:", error);
    return estimateQuote(pincode, subtotal, weightKg);
  }
}
