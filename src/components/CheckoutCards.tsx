'use client';

import { useState } from 'react';
import {
  parseDeliveryText,
  parseOrderOutput,
  type CollectDetailsInput,
  type DetailsField,
  type OrderSummaryInput,
} from '@/lib/checkout';
import { formatPrice } from '@/lib/products';

const FIELD_META: Record<DetailsField, { label: string; placeholder: string; msgLabel: string }> = {
  recipient_name: { label: "Recipient's name 🎁", placeholder: 'e.g. Nadeesha Perera', msgLabel: 'Recipient' },
  recipient_phone: { label: 'Their phone 📞', placeholder: 'e.g. 0771234567', msgLabel: 'Phone' },
  recipient_address: { label: 'Delivery address 🏠', placeholder: 'street & house number', msgLabel: 'Address' },
  city: { label: 'City 📍', placeholder: 'e.g. Colombo 03, Kandy', msgLabel: 'City' },
  delivery_date: { label: 'Delivery date 📅', placeholder: '', msgLabel: 'Delivery date' },
  sender_name: { label: 'Your name ✍️', placeholder: "so they know who it's from!", msgLabel: 'From' },
  gift_message: { label: 'Gift message 💌 (optional)', placeholder: 'a few words from the heart…', msgLabel: 'Gift message' },
};

/** Inline checkout form — one friendly card instead of a wall of questions. */
export function DetailsFormCard({
  form,
  active,
  onSubmit,
}: {
  form: CollectDetailsInput;
  /** Editable only while it's the newest message; older ones stay as a record. */
  active: boolean;
  onSubmit: (text: string) => void;
}) {
  const fields = form.fields.filter((f) => FIELD_META[f]);
  const [values, setValues] = useState<Partial<Record<DetailsField, string>>>(
    () => ({ ...form.prefill }),
  );

  const ready = fields
    .filter((f) => f !== 'gift_message')
    .every((f) => (values[f] ?? '').trim().length > 0);

  function submit() {
    const lines = fields
      .map((f) => {
        const v = (values[f] ?? '').trim();
        return v ? `${FIELD_META[f].msgLabel}: ${v}` : null;
      })
      .filter(Boolean);
    onSubmit(`Here are the details 📝\n${lines.join('\n')}`);
  }

  return (
    <div className="animate-kapuru-pop my-2 w-full max-w-md overflow-hidden rounded-[20px] bg-white sticker">
      <div className="flex items-center gap-2 border-b-[2.5px] border-ink bg-grape/30 px-4 py-2.5">
        <span className="text-lg">📮</span>
        <span className="text-sm font-extrabold text-ink">Just fill this in</span>
      </div>
      <div className="space-y-3 px-4 py-3">
        {form.note && (
          <p className="rounded-[12px] bg-sunny/40 px-3 py-2 text-xs font-bold text-ink sticker-sm">
            💡 {form.note}
          </p>
        )}
        {fields.map((f) => (
          <label key={f} className="block">
            <span className="mb-1 block text-xs font-extrabold text-ink/70">
              {FIELD_META[f].label}
            </span>
            {f === 'gift_message' ? (
              <textarea
                value={values[f] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))}
                disabled={!active}
                rows={2}
                placeholder={FIELD_META[f].placeholder}
                className="w-full resize-none rounded-[14px] border-2 border-ink/80 bg-paper px-3 py-2 text-sm font-semibold text-ink outline-none placeholder:text-ink/35 focus:border-green disabled:opacity-60"
              />
            ) : (
              <input
                type={f === 'delivery_date' ? 'date' : f === 'recipient_phone' ? 'tel' : 'text'}
                value={values[f] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))}
                disabled={!active}
                placeholder={FIELD_META[f].placeholder}
                className="w-full rounded-[14px] border-2 border-ink/80 bg-paper px-3 py-2 text-sm font-semibold text-ink outline-none placeholder:text-ink/35 focus:border-green disabled:opacity-60"
              />
            )}
          </label>
        ))}
      </div>
      {active && (
        <div className="px-4 pb-4">
          <button
            onClick={submit}
            disabled={!ready}
            className="sticker-sm sticker-lift w-full rounded-full bg-green-deep py-2.5 text-sm font-extrabold text-white disabled:opacity-40"
          >
            Done ✅
          </button>
        </div>
      )}
    </div>
  );
}

export function OrderSummaryCard({
  summary,
  active,
  onConfirm,
  onEdit,
}: {
  summary: OrderSummaryInput;
  /** Buttons only on the newest summary — older ones stay as a record. */
  active: boolean;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  const currency = summary.currency ?? 'LKR';
  const itemsTotal = summary.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const fee = summary.delivery?.fee;
  const total = itemsTotal + (fee ?? 0);
  const r = summary.recipient;
  const d = summary.delivery;

  return (
    <div className="animate-kapuru-pop my-2 max-w-md overflow-hidden rounded-[20px] bg-white sticker">
      <div className="flex items-center gap-2 border-b-[2.5px] border-ink bg-grape/30 px-4 py-2.5">
        <span className="text-lg">📋</span>
        <span className="text-sm font-extrabold text-ink">Order summary</span>
      </div>

      <div className="space-y-1.5 px-4 py-3 text-sm">
        {summary.items.map((it, idx) => (
          <div key={idx} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 font-bold text-ink">
              {it.quantity} × {it.name}
              {it.icing_text && (
                <span className="block text-xs font-semibold text-ink/55">
                  🎂 &ldquo;{it.icing_text}&rdquo;
                </span>
              )}
            </span>
            <span className="shrink-0 font-extrabold text-ink/70">
              {formatPrice(it.quantity * it.unit_price, currency)}
            </span>
          </div>
        ))}
        {fee != null && (
          <Row label="Delivery">
            <span className="font-extrabold text-ink/70">{formatPrice(fee, currency)}</span>
          </Row>
        )}
        <div className="flex items-center justify-between border-t-2 border-dashed border-ink/15 pt-2">
          <span className="font-extrabold text-ink">{fee != null ? 'Total' : 'Items total'}</span>
          <span className="font-extrabold text-green-deep">{formatPrice(total, currency)}</span>
        </div>

        {(r?.name || d?.city || d?.date) && (
          <p className="mt-2 rounded-[12px] bg-paper px-3 py-2 text-xs font-semibold leading-relaxed text-ink/70">
            📦 To <span className="font-extrabold text-ink">{r?.name ?? 'recipient'}</span>
            {r?.address && `, ${r.address}`}
            {d?.city && `, ${d.city}`}
            {d?.date && <> · 📅 {d.date}</>}
            {r?.phone && <> · 📞 {r.phone}</>}
          </p>
        )}
        {summary.gift_message && (
          <p className="rounded-[12px] bg-sunny/40 px-3 py-2 text-xs font-bold text-ink">
            🎁 &ldquo;{summary.gift_message}&rdquo;
          </p>
        )}
      </div>

      {active && (
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={onConfirm}
            className="sticker-sm sticker-lift flex-1 rounded-full bg-green-deep px-4 py-2.5 text-sm font-extrabold text-white"
          >
            Place order ✅
          </button>
          <button
            onClick={onEdit}
            className="sticker-sm sticker-lift rounded-full bg-white px-4 py-2.5 text-sm font-extrabold text-ink"
          >
            Edit ✏️
          </button>
        </div>
      )}
    </div>
  );
}

export function DeliveryCard({ text }: { text: string }) {
  const d = parseDeliveryText(text);

  if (d.error) {
    return (
      <div className="animate-kapuru-pop my-2 max-w-md rounded-[18px] bg-sunny p-3 text-sm font-bold text-ink sticker">
        🚚 Couldn&apos;t quote delivery: {d.error}
      </div>
    );
  }

  return (
    <div className="animate-kapuru-pop my-2 max-w-md overflow-hidden rounded-[18px] bg-white sticker">
      <div className="flex items-center gap-2 border-b-[2.5px] border-ink bg-sky/40 px-4 py-2.5">
        <span className="text-lg">🚚</span>
        <span className="text-sm font-extrabold text-ink">Delivery quote</span>
        <span
          className={
            'ml-auto rounded-full px-2.5 py-0.5 text-xs font-extrabold sticker-sm ' +
            (d.available ? 'bg-green-deep text-white' : 'bg-coral-deep text-white')
          }
        >
          {d.available ? 'Available' : 'Not available'}
        </span>
      </div>
      <div className="space-y-1.5 px-4 py-3 text-sm">
        {d.city && (
          <Row label="To">
            <span className="font-bold text-ink">{d.city}</span>
          </Row>
        )}
        {d.date && (
          <Row label="On">
            <span className="font-bold text-ink">{d.date}</span>
          </Row>
        )}
        {d.rate != null && (
          <Row label="Delivery fee">
            <span className="font-extrabold text-green-deep">{formatPrice(d.rate, d.currency)}</span>
          </Row>
        )}
        {d.warning && (
          <p className="mt-2 rounded-[12px] bg-sunny/40 px-3 py-2 text-xs font-bold text-ink sticker-sm">
            ⚠️ {d.warning}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-semibold text-ink/55">{label}</span>
      {children}
    </div>
  );
}

export function OrderCard({ output }: { output: unknown }) {
  const o = parseOrderOutput(output);

  return (
    <div className="animate-kapuru-pop my-2 max-w-md overflow-hidden rounded-[20px] bg-white sticker">
      <div className="relative px-5 pt-5 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Confetti.svg"
          alt=""
          aria-hidden
          className="animate-kapuru-float pointer-events-none absolute inset-x-0 top-0 h-28 w-full object-contain"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/success.svg"
          alt="Order placed successfully"
          className="relative mx-auto h-28 w-28"
        />
        <h3 className="mt-2 font-display text-lg font-bold text-ink">Order ready!</h3>
        <p className="text-xs font-bold text-ink/55">
          {o.orderNumber ? `Order ${o.orderNumber} · ` : ''}Prices locked for 60 minutes
        </p>
      </div>

      <div className="space-y-1.5 px-5 py-3 text-sm">
        {o.total && (
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ink/55">Total</span>
            <span className="font-extrabold text-green-deep">{o.total}</span>
          </div>
        )}
      </div>

      <div className="px-5 pb-5">
        {o.payUrl ? (
          <a
            href={o.payUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sticker sticker-lift block w-full rounded-full bg-green-deep py-3 text-center text-sm font-extrabold text-white"
          >
            Pay now 🔒
          </a>
        ) : (
          <p className="rounded-[12px] bg-paper px-3 py-2 text-center text-xs font-bold text-ink/55 sticker-sm">
            Pay link is in the message above.
          </p>
        )}
      </div>
    </div>
  );
}
