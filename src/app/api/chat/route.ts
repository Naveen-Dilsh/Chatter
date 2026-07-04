import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  tool,
  type UIMessage,
} from 'ai';
import { z } from 'zod';
import { createKaprukaMCP } from '@/lib/mcp';
import { model } from '@/lib/model';
import { SYSTEM_PROMPT } from '@/lib/prompt';

// Local tool: syncs the cart chip shown in the chat header. No side effects —
// the UI reads the latest call's input to render the visible cart.
const updateCart = tool({
  description:
    'Sync the shopping cart shown in the chat UI header. Call with the FULL current cart every time it changes (item added/removed, quantity changed). Pass an empty items array to clear the cart after an order is placed.',
  inputSchema: z.object({
    items: z.array(
      z.object({
        product_id: z.string(),
        name: z.string().describe('Exact product name as returned by search'),
        quantity: z.number().int().min(1),
        unit_price: z.number().describe('Price per unit, as shown to the customer'),
        currency: z.string().default('LKR'),
      }),
    ),
  }),
  execute: async ({ items }) => ({
    ok: true,
    count: items.length,
    total: items.reduce((s, i) => s + i.quantity * i.unit_price, 0),
  }),
});

// Local tool: renders the pre-checkout order-summary card with a
// "Place order" confirm button. No side effects — display only.
const showOrderSummary = tool({
  description:
    'Show the customer a visual order-summary card with a "Place order" confirm button. Call this BEFORE kapruka_create_order, once you know the cart, delivery and recipient details. The card renders in the chat, so keep your own text to one short line.',
  inputSchema: z.object({
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.number().int().min(1),
        unit_price: z.number(),
        icing_text: z.string().optional(),
      }),
    ),
    currency: z.string().default('LKR'),
    delivery: z
      .object({
        city: z.string().optional(),
        date: z.string().optional(),
        fee: z.number().optional().describe('Delivery fee from kapruka_check_delivery'),
      })
      .optional(),
    recipient: z
      .object({
        name: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
      })
      .optional(),
    sender: z
      .object({ name: z.string().optional(), contact: z.string().optional() })
      .optional(),
    gift_message: z.string().optional(),
  }),
  execute: async () => ({ ok: true, shown: true }),
});

// Local tool: renders a friendly inline form so the customer can fill several
// checkout details at once instead of answering a wall of questions.
// No side effects — display only; the form composes a chat message on submit.
const collectDetails = tool({
  description:
    'Show the customer a small friendly form in the chat to collect checkout details (recipient, address, city, delivery date, sender, gift message). ALWAYS use this instead of asking 3+ questions in text. Only include fields you still need; prefill anything you already know. Keep your own text to ONE short warm line.',
  inputSchema: z.object({
    fields: z
      .array(
        z.enum([
          'recipient_name',
          'recipient_phone',
          'recipient_address',
          'city',
          'delivery_date',
          'sender_name',
          'gift_message',
        ]),
      )
      .min(1)
      .describe('Which fields to show, in order'),
    prefill: z
      .object({
        recipient_name: z.string().optional(),
        recipient_phone: z.string().optional(),
        recipient_address: z.string().optional(),
        city: z.string().optional(),
        delivery_date: z.string().optional().describe('YYYY-MM-DD'),
        sender_name: z.string().optional(),
        gift_message: z.string().optional(),
      })
      .optional()
      .describe('Values you already know — shown pre-filled so the customer can just confirm'),
    note: z
      .string()
      .optional()
      .describe('Optional one-line helper shown above the form, e.g. a suggested gift message'),
  }),
  execute: async () => ({ ok: true, shown: true }),
});

// Allow agentic multi-step tool loops to take their time.
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const { client, tools } = await createKaprukaMCP();

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      ...tools,
      update_cart: updateCart,
      show_order_summary: showOrderSummary,
      collect_details: collectDetails,
    },
    // Let the model search -> read -> answer in one turn (multiple tool steps).
    stopWhen: stepCountIs(10),
    onFinish: async () => {
      await client.close();
    },
    onError: async (err) => {
      console.error('[chat streamText error]', err);
      await client.close();
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (err) => {
      console.error('[chat stream error]', err);
      return err instanceof Error ? err.message : String(err);
    },
  });
}
