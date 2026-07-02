import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { wrapLanguageModel, type LanguageModelMiddleware } from 'ai';

const MODEL_ID = 'gemini-3.1-flash-lite';

// Keys come from GOOGLE_GENERATIVE_AI_API_KEYS (comma-separated, tried in
// order) or the classic single-key GOOGLE_GENERATIVE_AI_API_KEY.
// NOTE: free-tier quota is per Google Cloud PROJECT — keys only add quota
// if they come from different projects/accounts.
const apiKeys = (
  process.env.GOOGLE_GENERATIVE_AI_API_KEYS ??
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
  ''
)
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

const models = apiKeys.map((apiKey) =>
  createGoogleGenerativeAI({ apiKey })(MODEL_ID),
);

function isAbort(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

// On any API error (rate limit, quota, outage) retry the same call with the
// next key. The SDK's own maxRetries already handles transient blips per key.
const keyFallback: LanguageModelMiddleware = {
  specificationVersion: 'v3',
  wrapGenerate: async ({ doGenerate, params }) => {
    let lastError: unknown;
    try {
      return await doGenerate();
    } catch (err) {
      if (isAbort(err)) throw err;
      lastError = err;
    }
    for (let i = 1; i < models.length; i++) {
      console.warn(`[model] key ${i} of ${models.length}: retrying after`, lastError);
      try {
        return await models[i].doGenerate(params);
      } catch (err) {
        if (isAbort(err)) throw err;
        lastError = err;
      }
    }
    throw lastError;
  },
  wrapStream: async ({ doStream, params }) => {
    let lastError: unknown;
    try {
      return await doStream();
    } catch (err) {
      if (isAbort(err)) throw err;
      lastError = err;
    }
    for (let i = 1; i < models.length; i++) {
      console.warn(`[model] key ${i} of ${models.length}: retrying after`, lastError);
      try {
        return await models[i].doStream(params);
      } catch (err) {
        if (isAbort(err)) throw err;
        lastError = err;
      }
    }
    throw lastError;
  },
};

export const model =
  models.length > 1
    ? wrapLanguageModel({ model: models[0], middleware: keyFallback })
    : models[0];
