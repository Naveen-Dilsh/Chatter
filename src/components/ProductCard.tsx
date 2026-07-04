'use client';

import { useState } from 'react';
import { formatPrice, type Product, type ProductDetail } from '@/lib/products';

export function ProductCard({
  product,
  onSelect,
}: {
  product: Product;
  onSelect?: (text: string) => void;
}) {
  const [imgOk, setImgOk] = useState(true);
  const discounted =
    product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice : null;

  const tellMore = () => onSelect?.(`Tell me more about "${product.name}"`);

  return (
    // div (not button): the card holds real buttons/links inside it
    <div
      role="button"
      tabIndex={0}
      onClick={tellMore}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tellMore();
        }
      }}
      className="animate-kapuru-pop sticker sticker-lift group flex w-48 shrink-0 snap-start cursor-pointer flex-col overflow-hidden rounded-[20px] bg-white text-left sm:w-60"
    >
      <div className="relative aspect-square overflow-hidden border-b-[2.5px] border-ink bg-paper">
        {imgOk && product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImgOk(false)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">🎁</div>
        )}
        {!product.inStock && (
          <span className="absolute left-2 top-2 rounded-full bg-coral-deep px-2 py-0.5 text-[11px] font-extrabold text-white sticker-sm">
            sold out
          </span>
        )}
        {product.inStock && product.stockLevel === 'low' && (
          <span className="absolute left-2 top-2 rounded-full bg-sunny px-2 py-0.5 text-[11px] font-extrabold text-ink sticker-sm">
            only a few!
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <span className="rounded-full bg-green-deep px-2.5 py-1 text-xs font-extrabold text-white sticker-sm">
            {formatPrice(product.price, product.currency)}
          </span>
          {discounted && (
            <span className="text-xs font-bold text-ink/40 line-through">
              {formatPrice(discounted, product.currency)}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <button
            type="button"
            disabled={!product.inStock}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(`Add "${product.name}" to my cart`);
            }}
            className="sticker-sm sticker-lift flex-1 rounded-full bg-green-deep px-2 py-1.5 text-xs font-extrabold text-white disabled:opacity-40"
          >
            Add 🛒
          </button>
          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              title="View on Kapruka"
              aria-label={`View ${product.name} on Kapruka`}
              onClick={(e) => e.stopPropagation()}
              className="sticker-sm sticker-lift rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-ink"
            >
              ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductDetailCard({
  product,
  onSelect,
}: {
  product: ProductDetail;
  onSelect?: (text: string) => void;
}) {
  const images = product.images.length
    ? product.images
    : product.imageUrl
      ? [product.imageUrl]
      : [];
  const [imgIdx, setImgIdx] = useState(0);
  const [imgOk, setImgOk] = useState(true);
  const discounted =
    product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice : null;
  const blurb = product.description ?? product.summary;

  return (
    <div className="animate-kapuru-pop sticker my-2 max-w-xl overflow-hidden rounded-[22px] bg-white sm:flex">
      {/* Gallery */}
      <div className="shrink-0 border-b-[2.5px] border-ink bg-paper sm:w-56 sm:border-b-0 sm:border-r-[2.5px]">
        <div className="relative aspect-square overflow-hidden">
          {imgOk && images[imgIdx] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[imgIdx]}
              alt={product.name}
              onError={() => setImgOk(false)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl">🎁</div>
          )}
          {!product.inStock && (
            <span className="absolute left-2 top-2 rounded-full bg-coral-deep px-2 py-0.5 text-[11px] font-extrabold text-white sticker-sm">
              sold out
            </span>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-1.5 p-2">
            {images.slice(0, 4).map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Photo ${i + 1}`}
                onClick={() => {
                  setImgIdx(i);
                  setImgOk(true);
                }}
                className={`h-10 w-10 overflow-hidden rounded-[8px] border-2 ${
                  i === imgIdx ? 'border-ink' : 'border-ink/20'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {product.categoryName && (
            <span className="rounded-full bg-grape/25 px-2.5 py-0.5 text-[11px] font-extrabold text-ink">
              {product.categoryName}
            </span>
          )}
          {product.shipsInternationally && (
            <span className="rounded-full bg-sky/30 px-2.5 py-0.5 text-[11px] font-extrabold text-ink">
              🌍 ships worldwide
            </span>
          )}
        </div>

        <h3 className="font-display text-lg font-bold leading-snug text-ink">{product.name}</h3>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-green-deep px-3 py-1 text-sm font-extrabold text-white sticker-sm">
            {formatPrice(product.price, product.currency)}
          </span>
          {discounted && (
            <span className="text-sm font-bold text-ink/40 line-through">
              {formatPrice(discounted, product.currency)}
            </span>
          )}
          {product.inStock ? (
            <span className="text-xs font-extrabold text-green-deep">
              {product.stockLevel === 'low' ? 'only a few left!' : 'in stock ✓'}
            </span>
          ) : (
            <span className="text-xs font-extrabold text-coral-deep">out of stock</span>
          )}
        </div>

        {blurb && (
          <p className="line-clamp-4 text-sm font-semibold leading-relaxed text-ink/70">{blurb}</p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-2">
          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => onSelect?.(`Add "${product.name}" to my cart`)}
            className="sticker-sm sticker-lift flex-1 rounded-full bg-green-deep px-4 py-2 text-sm font-extrabold text-white disabled:opacity-40"
          >
            Add to cart 🛒
          </button>
          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sticker-sm sticker-lift rounded-full bg-white px-4 py-2 text-sm font-extrabold text-ink"
            >
              View on Kapruka ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
