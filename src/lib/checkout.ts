// Parsing helpers for delivery quotes and created orders.

/** Input of the agent's show_order_summary tool — drives OrderSummaryCard. */
export type OrderSummaryInput = {
  items: { name: string; quantity: number; unit_price: number; icing_text?: string }[];
  currency?: string;
  delivery?: { city?: string; date?: string; fee?: number };
  recipient?: { name?: string; address?: string; phone?: string };
  sender?: { name?: string; contact?: string };
  gift_message?: string;
};

export type DeliveryInfo = {
  city?: string;
  date?: string;
  available: boolean;
  rate?: number;
  currency?: string;
  warning?: string;
  error?: string;
};

/** Parse the markdown from kapruka_check_delivery into a structured quote. */
export function parseDeliveryText(text: string): DeliveryInfo {
  const errMatch = text.match(/Error\s*\(([^)]+)\)\s*:?\s*(.*)/i);
  if (errMatch) {
    return { available: false, error: errMatch[2]?.trim() || errMatch[1] };
  }

  const head = text.match(/Delivery to (.+?) on (\S+)/i);
  const rateMatch = text.match(/([A-Z]{3})\s*([\d,]+)/);
  const notAvailable = /not\s+available|unavailable|cannot\s+deliver/i.test(text);

  // perishable / any warning-ish line
  const warnLine = text
    .split('\n')
    .map((l) => l.replace(/^[>*\-\s]+/, '').trim())
    .find((l) => /perishable|warning|note:|same.?day|cut.?off/i.test(l));

  return {
    city: head?.[1]?.trim(),
    date: head?.[2]?.trim(),
    available: !notAvailable && /available/i.test(text),
    currency: rateMatch?.[1],
    rate: rateMatch ? Number(rateMatch[2].replace(/,/g, '')) : undefined,
    warning: warnLine,
  };
}

export type OrderResult = {
  payUrl?: string;
  orderNumber?: string;
  total?: string;
  raw: string;
};

const PAY_KEYS = ['pay_url', 'payment_url', 'checkout_url', 'pay_link', 'url', 'link'];
const ORDER_KEYS = ['order_number', 'order_no', 'order_id', 'ordernumber', 'reference'];
const TOTAL_KEYS = ['total', 'total_amount', 'grand_total', 'amount', 'amount_due'];

/** Pull the pay link / order number / total out of create_order output (object or text). */
export function parseOrderOutput(output: unknown): OrderResult {
  if (output && typeof output === 'object') {
    const obj = flatten(output as Record<string, unknown>);
    const payUrl = firstString(obj, PAY_KEYS) ?? firstUrl(JSON.stringify(output));
    const orderNumber = firstString(obj, ORDER_KEYS);
    const total = firstScalar(obj, TOTAL_KEYS);
    return { payUrl, orderNumber, total, raw: JSON.stringify(output) };
  }
  const raw = String(output ?? '');
  return {
    payUrl: firstUrl(raw),
    orderNumber: raw.match(/order\s*(?:number|no|#)?[:\s#]*([A-Z0-9-]{4,})/i)?.[1],
    total: raw.match(/([A-Z]{3}\s*[\d,]+)/)?.[1],
    raw,
  };
}

function flatten(obj: Record<string, unknown>, out: Record<string, unknown> = {}): Record<string, unknown> {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v as Record<string, unknown>, out);
    else out[k.toLowerCase()] = v;
  }
  return out;
}

function firstString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
}

function firstScalar(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' || typeof v === 'number') return String(v);
  }
  return undefined;
}

function firstUrl(text: string): string | undefined {
  return text.match(/https?:\/\/[^\s"'<>)]+/)?.[0];
}
