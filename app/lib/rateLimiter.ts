type KeyUsage = {
  count: number;
  windowStart: number;
};

const globalForLimiter = globalThis as typeof globalThis & {
  rateLimiterState?: {
    keyUsage: Map<string, KeyUsage>;
    ipUsage: Map<string, KeyUsage>;
    currentKeyIndex: number;
  };
};

const state = globalForLimiter.rateLimiterState ?? {
  keyUsage: new Map<string, KeyUsage>(),
  ipUsage: new Map<string, KeyUsage>(),
  currentKeyIndex: 0
};
globalForLimiter.rateLimiterState = state;

// Limits
const KEY_REQUESTS_PER_MINUTE = 14;
const KEY_WINDOW_MS = 60_000;
export const IP_REQUESTS_PER_MINUTE = 5;
export const IP_WINDOW_MS = 60_000;

function splitKeys(value?: string) {
  return (value || '')
    .split(/[\n,]+/)
    .map((k) => k.trim())
    .filter(Boolean);
}

export function getAllApiKeys() {
  const keys = [
    ...splitKeys(process.env.GOOGLE_AI_API_KEYS),
    ...splitKeys(process.env.GEMINI_API_KEYS),
    process.env.GOOGLE_AI_API_KEY,
    process.env.GOOGLE_AI_API_KEY_1,
    process.env.GOOGLE_AI_API_KEY_2,
    process.env.GOOGLE_AI_API_KEY_3,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GOOGLE_API_KEY
  ].filter((k): k is string => Boolean(k?.trim()));

  return Array.from(new Set(keys.map((k) => k.trim())));
}

export function checkRateLimit(key: string, limit: number, windowMs: number, usageMap: Map<string, KeyUsage>): boolean {
  const now = Date.now();
  const usage = usageMap.get(key);

  if (!usage || now - usage.windowStart > windowMs) {
    usageMap.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (usage.count < limit) {
    usage.count++;
    return true;
  }

  return false;
}

export function getNextAvailableKey(): { key: string; index: number } | null {
  const keys = getAllApiKeys();
  if (!keys.length) return null;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const index = (state.currentKeyIndex + attempt) % keys.length;
    const key = keys[index];

    if (checkRateLimit(key, KEY_REQUESTS_PER_MINUTE, KEY_WINDOW_MS, state.keyUsage)) {
      state.currentKeyIndex = (index + 1) % keys.length;
      return { key, index };
    }
  }

  return null;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

export { state as rateLimiterState };
