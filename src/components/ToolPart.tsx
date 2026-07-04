'use client';

import { ProductCard, ProductDetailCard } from './ProductCard';
import { DeliveryCard, OrderCard } from './CheckoutCards';
import type { Product, ProductDetailResult, SearchResult } from '@/lib/products';

type DynamicToolPart = {
  type: 'dynamic-tool';
  toolName: string;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

const LABELS: Record<string, string> = {
  kapruka_search_products: 'Searching the catalog',
  kapruka_get_product: 'Getting product details',
  kapruka_list_categories: 'Browsing categories',
  kapruka_list_delivery_cities: 'Finding delivery cities',
  kapruka_check_delivery: 'Checking delivery',
  kapruka_create_order: 'Creating your order',
  kapruka_track_order: 'Tracking your order',
};

function isSearchResult(o: unknown): o is SearchResult {
  return !!o && typeof o === 'object' && (o as SearchResult).kind === 'search';
}

function isProductDetail(o: unknown): o is ProductDetailResult {
  return !!o && typeof o === 'object' && (o as ProductDetailResult).kind === 'product';
}

export function ToolPart({
  part,
  onSelect,
}: {
  part: DynamicToolPart;
  onSelect?: (text: string) => void;
}) {
  const running = part.state === 'input-streaming' || part.state === 'input-available';
  const label = LABELS[part.toolName] ?? 'Working';

  // A failed tool call → visible, friendly chip (the agent sees the error
  // and speaks next; without this the user just sees silence).
  if (part.state === 'output-error') {
    return <ErrorChip />;
  }

  // SEARCH → product carousel (the visual centrepiece)
  if (part.toolName === 'kapruka_search_products') {
    if (running) return <SearchSkeleton />;
    if (part.state === 'output-available' && isSearchResult(part.output)) {
      const products = part.output.products as Product[];
      if (products.length === 0) return null; // model will speak / retry
      return <ProductCarousel products={products} onSelect={onSelect} />;
    }
    return null;
  }

  // PRODUCT DETAIL → rich detail card (gallery + blurb + add-to-cart)
  if (part.toolName === 'kapruka_get_product') {
    if (running) return <DetailSkeleton />;
    if (part.state === 'output-available' && isProductDetail(part.output)) {
      return <ProductDetailCard product={part.output.product} onSelect={onSelect} />;
    }
    return null; // e.g. "Product not found" -> the agent speaks
  }

  // CHECK DELIVERY → delivery quote card
  if (part.toolName === 'kapruka_check_delivery') {
    if (running) return <Chip label="Checking delivery" />;
    if (part.state === 'output-available') {
      return <DeliveryCard text={outputText(part.output)} />;
    }
    return null;
  }

  // CREATE ORDER → celebratory pay-link card (the climax)
  if (part.toolName === 'kapruka_create_order') {
    if (running) return <Chip label="Placing your order" />;
    if (part.state === 'output-available') {
      const out = part.output as { kind?: string; data?: unknown; text?: string } | string;
      const payload =
        typeof out === 'object' && out && 'data' in out ? out.data : (out as { text?: string })?.text ?? out;
      return <OrderCard output={payload} />;
    }
    return null;
  }

  // Other tools (categories, cities, product detail, tracking) →
  // a small status chip while running; the agent speaks the result.
  if (running) return <Chip label={label} />;
  return null;
}

function ErrorChip() {
  return (
    <div className="my-1 inline-flex items-center gap-2 rounded-full bg-sunny px-3 py-1 text-xs font-bold text-ink sticker-sm">
      ⚠️ Hmm, that didn&apos;t work — let me try another way…
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <div className="my-1 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-ink sticker-sm">
      <Spinner /> {label}…
    </div>
  );
}

/** Best-effort extraction of the markdown text from a tool's output. */
function outputText(output: unknown): string {
  if (typeof output === 'string') return output;
  if (output && typeof output === 'object') {
    const o = output as { text?: string; data?: { result?: string }; result?: string };
    return o.text ?? o.data?.result ?? o.result ?? JSON.stringify(output);
  }
  return String(output ?? '');
}

function ProductCarousel({
  products,
  onSelect,
}: {
  products: Product[];
  onSelect?: (text: string) => void;
}) {
  return (
    <div className="-mx-1 my-2 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onSelect={onSelect} />
      ))}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="my-2 flex gap-3 overflow-hidden">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-48 shrink-0 overflow-hidden rounded-[20px] bg-white sticker sm:w-60"
        >
          <div className="aspect-square animate-pulse border-b-[2.5px] border-ink bg-paper" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-paper" />
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-paper" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="my-2 max-w-xl overflow-hidden rounded-[22px] bg-white sticker sm:flex">
      <div className="aspect-square w-full shrink-0 animate-pulse border-b-[2.5px] border-ink bg-paper sm:w-56 sm:border-b-0 sm:border-r-[2.5px]" />
      <div className="flex-1 space-y-2.5 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-paper" />
        <div className="h-4 w-1/3 animate-pulse rounded-full bg-paper" />
        <div className="h-3 w-full animate-pulse rounded-full bg-paper" />
        <div className="h-3 w-5/6 animate-pulse rounded-full bg-paper" />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-ink/20 border-t-green" />
  );
}
