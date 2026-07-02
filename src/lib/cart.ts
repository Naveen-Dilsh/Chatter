// Visible-cart state, synced by the agent via the `update_cart` tool.
// The UI's cart = the input of the LAST update_cart call in the conversation,
// so it persists with the messages in localStorage for free.

import type { UIMessage } from 'ai';

export type CartItem = {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  currency?: string;
};

export function deriveCart(messages: UIMessage[]): CartItem[] {
  let cart: CartItem[] = [];
  for (const m of messages) {
    if (m.role !== 'assistant') continue;
    for (const p of m.parts) {
      const part = p as unknown as {
        type: string;
        state?: string;
        input?: { items?: CartItem[] };
      };
      if (
        part.type === 'tool-update_cart' &&
        (part.state === 'input-available' || part.state === 'output-available') &&
        Array.isArray(part.input?.items)
      ) {
        cart = part.input.items;
      }
    }
  }
  return cart;
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
