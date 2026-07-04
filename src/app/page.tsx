'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import type { UIMessage } from 'ai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolPart } from '@/components/ToolPart';
import { DetailsFormCard, OrderSummaryCard } from '@/components/CheckoutCards';
import { deriveCart, cartTotal, cartCount, type CartItem } from '@/lib/cart';
import type { CollectDetailsInput, OrderSummaryInput } from '@/lib/checkout';
import { formatPrice } from '@/lib/products';

const STORAGE_KEY = 'kapuru-chat-v1';

type Chip = { label: string; text: string };

/** Contextual quick replies under Kapruu's latest message, derived from
 *  what just happened — deterministic, no model involvement. */
function quickRepliesFor(messages: UIMessage[], cartItems: number): Chip[] {
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'assistant') return [];

  // An order summary or details form awaiting the customer is the CTA —
  // no competing chips.
  if (
    last.parts.some((p) => {
      const t = (p as { type?: string }).type;
      return t === 'tool-show_order_summary' || t === 'tool-collect_details';
    })
  ) {
    return [];
  }

  let context: 'search' | 'delivery' | 'order' | null = null;
  for (const p of last.parts) {
    const part = p as unknown as {
      type: string;
      toolName?: string;
      state?: string;
      output?: { products?: unknown[] };
    };
    if (part.type !== 'dynamic-tool' || part.state !== 'output-available') continue;
    if (part.toolName === 'kapruka_create_order') context = 'order';
    else if (part.toolName === 'kapruka_check_delivery' && context !== 'order') {
      context = 'delivery';
    } else if (
      part.toolName === 'kapruka_search_products' &&
      !context &&
      (part.output?.products?.length ?? 0) > 0
    ) {
      context = 'search';
    }
  }

  if (context === 'order') {
    return [
      { label: 'Track my order 📦', text: 'Can you track my order?' },
      { label: 'Send another gift 🎁', text: 'I want to send another gift!' },
    ];
  }

  const chips: Chip[] = [];
  if (context === 'delivery') {
    chips.push(
      { label: 'Sounds good ✅', text: 'Sounds good — let’s continue!' },
      { label: 'Another date 📅', text: 'Can we try a different delivery date?' },
    );
  }
  if (context === 'search') {
    chips.push(
      { label: 'Cheaper options 💸', text: 'Show me some cheaper options please' },
      { label: 'Show me more 🔄', text: 'Show me a few more options' },
      { label: 'Check delivery 🚚', text: 'Can you check delivery for me?' },
    );
  }
  if (cartItems > 0) {
    chips.push({ label: 'Check out 🛒', text: "Let's check out my cart 🛒" });
  }
  return chips;
}

const SUGGESTIONS = [
  { label: 'Birthday flowers', emoji: '💐', bg: 'bg-coral' },
  { label: 'Chocolate gifts', emoji: '🍫', bg: 'bg-sunny' },
  { label: 'A gift for my mom', emoji: '🎁', bg: 'bg-grape' },
  { label: 'Red roses', emoji: '🌹', bg: 'bg-sky' },
];

export default function Home() {
  const { messages, setMessages, sendMessage, status, regenerate, stop } = useChat();
  const [input, setInput] = useState('');
  const [restored, setRestored] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cart = deriveCart(messages);
  const quickChips = quickRepliesFor(messages, cart.length);
  const endRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  // Follow the stream only while the user is at the bottom; scrolling up
  // to browse a carousel unsticks, scrolling back down re-sticks.
  const stickToBottom = useRef(true);
  const lastScrollTop = useRef(0);

  function handleScroll() {
    const el = mainRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (el.scrollTop < lastScrollTop.current) {
      stickToBottom.current = false; // user scrolled up
    } else if (nearBottom) {
      stickToBottom.current = true;
    }
    lastScrollTop.current = el.scrollTop;
  }

  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          // Drop tool parts frozen mid-run (saved while streaming) — they'd
          // render spinner chips that never resolve.
          const cleaned = (parsed as UIMessage[]).map((m) => ({
            ...m,
            parts: (m.parts ?? []).filter((p) => {
              const part = p as unknown as { type?: string; state?: string };
              const isTool =
                part.type === 'dynamic-tool' || (part.type ?? '').startsWith('tool-');
              return !(
                isTool &&
                (part.state === 'input-streaming' || part.state === 'input-available')
              );
            }),
          }));
          setMessages(cleaned);
        }
      }
    } catch {
      /* ignore */
    }
    setRestored(true);
  }, [setMessages]);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages, restored]);

  useEffect(() => {
    if (!stickToBottom.current) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    endRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [messages, busy]);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    stickToBottom.current = true; // sending always snaps back to the bottom
    sendMessage({ text: t });
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
  }

  // "new chat" needs a second tap — one mis-click would wipe the chat AND the
  // in-progress cart (which lives in the conversation). Auto-cancels after 4s.
  const [confirmNew, setConfirmNew] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  function askNewChat() {
    setConfirmNew(true);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirmNew(false), 4000);
  }

  function cancelNewChat() {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirmNew(false);
  }

  function newChat() {
    cancelNewChat();
    setCartOpen(false);
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden text-ink">
      {/* Chat header — shows only while chatting */}
      {/* Always rendered (invisible on welcome) so the layout doesn't jump on first send */}
      <header className={`relative z-20 px-4 pt-4 ${messages.length === 0 ? 'invisible' : ''}`}>
          <div className="sticker relative mx-auto max-w-4xl rounded-[20px] bg-white/85 px-3 py-2.5 backdrop-blur-md sm:px-4">
            <span
              aria-hidden
              className="absolute -left-2.5 -top-3 -rotate-12 text-2xl drop-shadow-sm"
            >
              🌺
            </span>
            <span
              aria-hidden
              className="animate-kapuru-twinkle absolute -right-1.5 -top-2 text-lg"
            >
              ✨
            </span>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/header-avatar.svg"
                alt="Kapruu"
                className="animate-kapuru-bounce h-9 w-9 shrink-0 sm:h-11 sm:w-11"
              />
              <div className="min-w-0 leading-tight">
                <h1 className="font-display text-base font-bold text-ink sm:text-lg">
                  Kapruu <span className="text-sm">🌴</span>
                </h1>
                <p className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-extrabold text-green-deep">
                  <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-green" />
                  online<span className="hidden sm:inline"> · your gift genie 🎁</span>
                </p>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
                {cart.length > 0 && (
                  <button
                    key={`${cartCount(cart)}-${cartTotal(cart)}`}
                    onClick={() => setCartOpen((o) => !o)}
                    title="Your cart"
                    className="animate-kapuru-pop sticker-sm sticker-lift whitespace-nowrap rounded-full bg-sky px-2.5 py-1.5 text-xs font-extrabold text-ink sm:px-3.5"
                  >
                    🛒 {cartCount(cart)}
                    <span className="hidden min-[430px]:inline">
                      {' '}
                      · {formatPrice(cartTotal(cart), cart[0]?.currency ?? 'LKR')}
                    </span>
                  </button>
                )}
                {confirmNew ? (
                  <div className="animate-kapuru-pop flex items-center gap-1.5 sm:gap-2">
                    <span className="hidden text-xs font-extrabold text-ink/60 md:inline">
                      clear chat{cart.length > 0 ? ' + cart' : ''}?
                    </span>
                    <button
                      onClick={newChat}
                      className="sticker-sm sticker-lift whitespace-nowrap rounded-full bg-coral-deep px-2.5 py-1.5 text-xs font-extrabold text-white sm:px-3.5"
                    >
                      <span className="sm:hidden">clear ✓</span>
                      <span className="hidden sm:inline">yes, clear</span>
                    </button>
                    <button
                      onClick={cancelNewChat}
                      className="sticker-sm sticker-lift whitespace-nowrap rounded-full bg-white px-2.5 py-1.5 text-xs font-extrabold text-ink sm:px-3.5"
                    >
                      <span className="sm:hidden">✕</span>
                      <span className="hidden sm:inline">keep it</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={askNewChat}
                    title="Start a new chat"
                    className="sticker-sm sticker-lift whitespace-nowrap rounded-full bg-sunny px-2.5 py-1.5 text-xs font-extrabold text-ink sm:px-3.5"
                  >
                    new<span className="hidden min-[380px]:inline"> chat</span>
                  </button>
                )}
              </div>
            </div>
            {cartOpen && cart.length > 0 && (
              <CartPanel
                items={cart}
                onCheckout={() => {
                  setCartOpen(false);
                  send("Let's check out my cart 🛒");
                }}
              />
            )}
          </div>
        </header>

      {/* Messages */}
      <main ref={mainRef} onScroll={handleScroll} className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-2 py-4 sm:px-4 sm:py-8">
          {messages.length === 0 ? (
            <Welcome onPick={send} />
          ) : (
            <div role="log" aria-live="polite" className="glass space-y-5 rounded-[20px] p-3 sm:space-y-7 sm:rounded-[28px] sm:p-8">
              {messages.map((m, mi) =>
                m.role === 'user' ? (
                  <div key={m.id} className="animate-kapuru-pop flex justify-end">
                    <div className="max-w-[88%] whitespace-pre-wrap rounded-[22px] rounded-br-md bg-green-deep px-4 py-2.5 text-sm font-bold text-white sticker sm:max-w-[78%] sm:px-5 sm:py-3">
                      {m.parts.map((p, i) => (p.type === 'text' ? <span key={i}>{p.text}</span> : null))}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="animate-kapuru-pop flex gap-1.5 sm:gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/chatbot-animation.svg"
                      alt="Kapruu"
                      className="mt-0.5 h-8 w-8 shrink-0 sm:h-10 sm:w-10"
                    />
                    <div className="min-w-0 max-w-[88%] flex-1 space-y-1.5 sm:max-w-[85%]">
                      {m.parts.map((p, i) => {
                        if (p.type === 'text') {
                          return p.text ? (
                            <div
                              key={i}
                              className="prose prose-sm w-fit max-w-full rounded-[22px] rounded-tl-md bg-white px-4 py-2.5 font-semibold text-ink sticker prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0 prose-headings:my-2 prose-a:text-green-deep prose-strong:text-ink sm:px-5 sm:py-3"
                            >
                              <Markdown remarkPlugins={[remarkGfm]}>{p.text}</Markdown>
                            </div>
                          ) : null;
                        }
                        if (p.type === 'dynamic-tool') {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          return <ToolPart key={i} part={p as any} onSelect={send} />;
                        }
                        if (p.type === 'tool-show_order_summary') {
                          const part = p as unknown as {
                            state?: string;
                            input?: OrderSummaryInput;
                          };
                          if (
                            (part.state === 'input-available' ||
                              part.state === 'output-available') &&
                            part.input?.items?.length
                          ) {
                            return (
                              <OrderSummaryCard
                                key={i}
                                summary={part.input}
                                active={mi === messages.length - 1 && !busy}
                                onConfirm={() => send('Yes, place my order! ✅')}
                                onEdit={() => send('I want to change something first ✏️')}
                              />
                            );
                          }
                          return null;
                        }
                        if (p.type === 'tool-collect_details') {
                          const part = p as unknown as {
                            state?: string;
                            input?: CollectDetailsInput;
                          };
                          if (
                            (part.state === 'input-available' ||
                              part.state === 'output-available') &&
                            part.input?.fields?.length
                          ) {
                            return (
                              <DetailsFormCard
                                key={i}
                                form={part.input}
                                active={mi === messages.length - 1 && !busy}
                                onSubmit={send}
                              />
                            );
                          }
                          return null;
                        }
                        return null;
                      })}
                    </div>
                  </div>
                ),
              )}
              {busy && <Thinking />}
              {status === 'error' && <ErrorBubble onRetry={() => regenerate()} />}
              {!busy && status !== 'error' && quickChips.length > 0 && (
                <QuickReplies chips={quickChips} onPick={send} />
              )}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </main>

      {/* Composer — chunky sticker bar */}
      <footer className="relative z-10 px-2 pb-3 pt-2 sm:px-4 sm:pb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto flex max-w-4xl items-center gap-2 rounded-[24px] border-[1.5px] border-white/70 bg-white/70 p-2 shadow-sm"
        >
          <textarea
            ref={inputRef}
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter = newline; never send mid-IME-composition
              // (matters for Sinhala input methods).
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="say hi to Kapruu… 🌸"
            className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm font-semibold text-ink outline-none placeholder:text-ink/40"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => stop()}
              className="sticker-sm sticker-lift rounded-full bg-coral-deep px-4 py-2.5 text-sm font-extrabold text-white sm:px-5"
            >
              Stop ◼
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="sticker-sm sticker-lift rounded-full bg-green-deep px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-40 sm:px-5"
            >
              Send →
            </button>
          )}
        </form>
      </footer>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="flex flex-col items-center px-2 py-4 text-center sm:py-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hello.svg"
        alt="Kapruu says hello"
        className="animate-kapuru-float h-40 w-auto drop-shadow-xl sm:h-56"
      />
      <div className="animate-kapuru-wobble mt-5 inline-block rounded-[22px] bg-sunny px-4 py-2 sticker sm:mt-6 sm:px-5">
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
          Ayubowan! I&apos;m Kapruu 👋
        </h2>
      </div>
      <p className="mt-4 max-w-md text-sm font-semibold text-ink/70 sm:mt-5">
        Tell me who you&apos;re shopping for and I&apos;ll dig up the perfect gift from Kapruka —
        flowers, cakes, chocolates &amp; more, delivered all over Sri Lanka. 🇱🇰
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5 sm:mt-8 sm:gap-3">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s.label}
            onClick={() => onPick(`${s.label} ${s.emoji}`)}
            className={`sticker sticker-lift rounded-[18px] ${s.bg} px-4 py-2.5 text-sm font-extrabold text-ink ${
              i % 2 ? 'tilt-r' : 'tilt-l'
            }`}
          >
            <span className="mr-1">{s.emoji}</span>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuickReplies({ chips, onPick }: { chips: Chip[]; onPick: (t: string) => void }) {
  const colors = ['bg-sunny', 'bg-sky', 'bg-grape'];
  return (
    <div className="flex flex-wrap gap-2 pl-0 sm:pl-[50px]">
      {chips.map((c, i) => (
        <button
          key={c.label}
          onClick={() => onPick(c.text)}
          className={`animate-kapuru-pop sticker-sm sticker-lift rounded-full ${
            colors[i % colors.length]
          } px-3.5 py-1.5 text-xs font-extrabold text-ink ${i % 2 ? 'tilt-r' : 'tilt-l'}`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

function CartPanel({ items, onCheckout }: { items: CartItem[]; onCheckout: () => void }) {
  const currency = items[0]?.currency ?? 'LKR';
  return (
    <div className="animate-kapuru-pop mt-2.5 border-t-2 border-dashed border-ink/15 pt-2.5">
      <ul className="space-y-1.5 text-sm">
        {items.map((i) => (
          <li key={i.product_id} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate font-bold text-ink">
              {i.quantity} × {i.name}
            </span>
            <span className="shrink-0 font-extrabold text-ink/70">
              {formatPrice(i.quantity * i.unit_price, i.currency ?? currency)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-sm font-extrabold text-ink">
          Total <span className="text-green-deep">{formatPrice(cartTotal(items), currency)}</span>
        </span>
        <button
          onClick={onCheckout}
          className="sticker-sm sticker-lift rounded-full bg-green-deep px-4 py-1.5 text-xs font-extrabold text-white"
        >
          Checkout →
        </button>
      </div>
    </div>
  );
}

function ErrorBubble({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="animate-kapuru-pop flex gap-1.5 sm:gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/chatbot-animation.svg" alt="Kapruu" className="mt-0.5 h-8 w-8 shrink-0 sm:h-10 sm:w-10" />
      <div className="flex flex-wrap items-center gap-3 rounded-[22px] rounded-tl-md bg-white px-4 py-2.5 sticker sm:px-5 sm:py-3">
        <p className="text-sm font-bold text-ink">
          Aiyo, I tripped over something! 🙈 Give me another go?
        </p>
        <button
          onClick={onRetry}
          className="sticker-sm sticker-lift rounded-full bg-coral-deep px-3.5 py-1.5 text-xs font-extrabold text-white"
        >
          Try again ↻
        </button>
      </div>
    </div>
  );
}

const THINKING_LINES = [
  'thinking… 💭',
  'digging through the catalog… 🌺',
  'picking the prettiest ones… 🌸',
  'asking the delivery uncle… 🛵',
  'wrapping it up… 🎀',
];

function Thinking() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % THINKING_LINES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex gap-1.5 sm:gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/chatbot-animation.svg" alt="Kapruu" className="mt-0.5 h-8 w-8 shrink-0 sm:h-10 sm:w-10" />
      <div className="flex items-center gap-2 rounded-[20px] rounded-tl-md bg-white px-4 py-3 sticker">
        <span className="flex items-center gap-1.5">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </span>
        <span key={idx} className="animate-kapuru-pop text-xs font-bold text-ink/60">
          {THINKING_LINES[idx]}
        </span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2.5 w-2.5 animate-bounce rounded-full bg-green"
      style={{ animationDelay: delay }}
    />
  );
}
