// Shared product types + parsing helpers used by both the server (mcp.ts)
// and the client (product cards).

export type Product = {
  id: string;
  name: string;
  summary?: string;
  price: number;
  currency: string;
  compareAtPrice?: number | null;
  inStock: boolean;
  stockLevel?: string | null;
  imageUrl?: string | null;
  url: string;
  shipsInternationally?: boolean;
};

export type SearchResult = {
  kind: 'search';
  query?: string;
  count: number;
  products: Product[];
  nextCursor?: string | null;
};

export type ProductDetail = Product & {
  description?: string;
  images: string[];
  categoryName?: string;
};

export type ProductDetailResult = { kind: 'product'; product: ProductDetail };

/** Decode HTML entities (numeric + common named) found in Kapruka product names. */
export function decodeEntities(input: string): string {
  if (!input) return input;
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeFromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeFromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function safeFromCodePoint(code: number): string {
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

/** Format a price the Sri Lankan way: "LKR 5,210". */
export function formatPrice(amount: number, currency = 'LKR'): string {
  const n = Math.round(amount).toLocaleString('en-LK');
  return `${currency} ${n}`;
}

type RawProduct = {
  id?: string;
  name?: string;
  summary?: string;
  price?: { amount?: number; currency?: string };
  compare_at_price?: number | null;
  in_stock?: boolean;
  stock_level?: string | null;
  image_url?: string | null;
  url?: string;
  ships_internationally?: boolean;
};

/** Parse the JSON text returned by kapruka_search_products (response_format:"json"). */
export function parseSearchJson(jsonText: string): SearchResult | null {
  let data: { results?: RawProduct[]; next_cursor?: string; applied_filters?: { q?: string } };
  try {
    data = JSON.parse(jsonText);
  } catch {
    return null;
  }
  if (!data || !Array.isArray(data.results)) return null;

  const products: Product[] = data.results.map((r) => ({
    id: r.id ?? '',
    name: decodeEntities(r.name ?? ''),
    summary: r.summary ? decodeEntities(r.summary) : undefined,
    price: r.price?.amount ?? 0,
    currency: r.price?.currency ?? 'LKR',
    compareAtPrice: r.compare_at_price ?? null,
    inStock: r.in_stock ?? true,
    stockLevel: r.stock_level ?? null,
    imageUrl: r.image_url ?? null,
    url: r.url ?? '',
    shipsInternationally: r.ships_internationally,
  }));

  return {
    kind: 'search',
    query: data.applied_filters?.q,
    count: products.length,
    products,
    nextCursor: data.next_cursor ?? null,
  };
}

type RawDetail = RawProduct & {
  description?: string;
  images?: string[];
  category?: { name?: string };
  shipping?: { ships_internationally?: boolean };
};

/** Parse the JSON text returned by kapruka_get_product (response_format:"json"). */
export function parseProductJson(jsonText: string): ProductDetailResult | null {
  let data: RawDetail;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return null;
  }
  if (!data || !data.id) return null;

  const images = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
  // Descriptions come back with mojibake gaps + runs of spaces — tidy them.
  const clean = (s?: string) =>
    s ? decodeEntities(s).replace(/\s{2,}/g, ' ').trim() : undefined;

  return {
    kind: 'product',
    product: {
      id: data.id,
      name: decodeEntities(data.name ?? ''),
      summary: clean(data.summary),
      description: clean(data.description),
      price: data.price?.amount ?? 0,
      currency: data.price?.currency ?? 'LKR',
      compareAtPrice: data.compare_at_price ?? null,
      inStock: data.in_stock ?? true,
      stockLevel: data.stock_level ?? null,
      imageUrl: images[0] ?? data.image_url ?? null,
      images,
      url: data.url ?? '',
      shipsInternationally: data.shipping?.ships_internationally,
      categoryName: data.category?.name,
    },
  };
}
