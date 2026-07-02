import { dynamicTool, jsonSchema, type ToolSet } from 'ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { parseSearchJson, parseProductJson } from './products';

export const KAPRUKA_MCP_URL = 'https://mcp.kapruka.com/mcp';
const SEARCH_TOOL = 'kapruka_search_products';
const ORDER_TOOL = 'kapruka_create_order';
const DETAIL_TOOL = 'kapruka_get_product';

/**
 * Opens a fresh connection to the Kapruka MCP server (Streamable HTTP, no auth),
 * lists its tools, and wraps each one as an AI SDK dynamic tool the model can call.
 *
 * AI SDK v6 dropped the built-in MCP client, so we drive the official MCP SDK
 * directly and convert tools ourselves — which also gives us full control over
 * how each tool result comes back (handy for rich rendering later).
 *
 * Caller MUST close the client when the request finishes (see route.ts).
 */
export async function createKaprukaMCP() {
  const client = new Client({ name: 'kapuru', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(KAPRUKA_MCP_URL)));

  const { tools: mcpTools } = await client.listTools();

  const tools: ToolSet = {};
  for (const t of mcpTools) {
    tools[t.name] = dynamicTool({
      description: t.description ?? '',
      inputSchema: jsonSchema(t.inputSchema as Record<string, unknown>),
      execute: async (rawArgs) => {
        const args = (rawArgs ?? {}) as { params?: Record<string, unknown> };

        // For search, product detail & create_order: force JSON output so we
        // get structured fields (images for cards, pay link for the order card).
        if (t.name === SEARCH_TOOL || t.name === ORDER_TOOL || t.name === DETAIL_TOOL) {
          args.params = { response_format: 'json', ...(args.params ?? {}) };
        }

        const res = await client.callTool({
          name: t.name,
          arguments: args as Record<string, unknown>,
        });

        const content = (res.content ?? []) as Array<{ type: string; text?: string }>;
        const text = content
          .filter((c) => c.type === 'text' && c.text)
          .map((c) => c.text)
          .join('\n');

        if (t.name === SEARCH_TOOL) {
          const parsed = parseSearchJson(text);
          if (parsed) return parsed; // structured -> drives product cards
          return text; // e.g. "No products found ..." -> model retries
        }

        if (t.name === DETAIL_TOOL) {
          const parsed = parseProductJson(text);
          if (parsed) return parsed; // structured -> drives the detail card
          return text; // e.g. "Product not found"
        }

        if (t.name === ORDER_TOOL) {
          try {
            return { kind: 'order', data: JSON.parse(text) };
          } catch {
            return { kind: 'order', text };
          }
        }

        if (res.structuredContent) return { text, data: res.structuredContent };
        return text || content;
      },
    });
  }

  return { client, tools };
}
