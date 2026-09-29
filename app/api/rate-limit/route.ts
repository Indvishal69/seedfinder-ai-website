import { NextResponse } from 'next/server';
import {
  getAllApiKeys,
  rateLimiterState as state,
  IP_REQUESTS_PER_MINUTE,
  IP_WINDOW_MS,
  getClientIp
} from '../../lib/rateLimiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEY_REQUESTS_PER_MINUTE = 14;
const KEY_WINDOW_MS = 60_000;

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const allKeys = getAllApiKeys();

  const keyStatuses = allKeys.map((key, index) => {
    const usage = state.keyUsage.get(key);
    const now = Date.now();
    const windowActive = usage && now - usage.windowStart <= KEY_WINDOW_MS;
    return {
      key: `Key ${index + 1}`,
      requestsUsed: windowActive ? usage.count : 0,
      limitPerMinute: KEY_REQUESTS_PER_MINUTE,
      available: !windowActive || usage.count < KEY_REQUESTS_PER_MINUTE,
      windowResetMs: windowActive ? KEY_WINDOW_MS - (now - usage.windowStart) : 0
    };
  });

  const ipUsage = state.ipUsage.get(ip);
  const now = Date.now();
  const ipWindowActive = ipUsage && now - ipUsage.windowStart <= IP_WINDOW_MS;

  return NextResponse.json({
    totalKeys: allKeys.length,
    currentKeyIndex: state.currentKeyIndex,
    keyStatuses,
    yourIp: ip,
    yourUsage: {
      requestsUsed: ipWindowActive ? ipUsage.count : 0,
      limitPerMinute: IP_REQUESTS_PER_MINUTE,
      available: !ipWindowActive || ipUsage.count < IP_REQUESTS_PER_MINUTE
    },
    tips: [
      'Add multiple API keys with GOOGLE_AI_API_KEYS=key1,key2,key3 in environment variables.',
      'Keys rotate automatically using round-robin when one hits rate limit.',
      'Each IP is limited to 5 requests/minute to prevent abuse.',
      'Cached results bypass API entirely, reducing key usage.',
      'Use 5 results instead of 20 to reduce API load per search.'
    ]
  });
}
