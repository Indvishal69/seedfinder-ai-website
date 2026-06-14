import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Source = {
  title?: string;
  url?: string;
  website?: string;
  evidence?: string;
};

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    groundingMetadata?: {
      groundingChunks?: Array<{
        web?: { title?: string; uri?: string };
      }>;
      searchEntryPoint?: unknown;
    };
  }>;
  error?: { message?: string; status?: string };
};

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

type SerperResult = {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
};

type SerperResponse = {
  organic?: SerperResult[];
  error?: string;
};

type WebSearchSource = Source & {
  snippet?: string;
  content?: string;
};

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const MAX_CACHE_ITEMS = 100;

type CachedPayload = {
  expiresAt: number;
  payload: unknown;
};

const globalForCache = globalThis as typeof globalThis & {
  seedFinderResponseCache?: Map<string, CachedPayload>;
};

const responseCache = globalForCache.seedFinderResponseCache ?? new Map<string, CachedPayload>();
globalForCache.seedFinderResponseCache = responseCache;

function splitKeys(value?: string) {
  return (value || '')
    .split(/[\n,]+/)
    .map((key) => key.trim())
    .filter(Boolean);
}

function getApiKeys() {
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
  ].filter((key): key is string => Boolean(key && key.trim()));

  return Array.from(new Set(keys.map((key) => key.trim())));
}

function getGroqApiKeys() {
  const keys = [
    ...splitKeys(process.env.GROQ_API_KEYS),
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3
  ].filter((key): key is string => Boolean(key && key.trim()));

  return Array.from(new Set(keys.map((key) => key.trim())));
}

function getSerperApiKey() {
  return (process.env.SERPER_API_KEY || process.env.SERPER_DEV_API_KEY || '').trim();
}

function isQuotaLikeError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('resource_exhausted') ||
    message.includes('high demand')
  );
}

function shortKeyLabel(index: number) {
  return `key ${index + 1}`;
}

function getCandidateCount(requestedCount: number) {
  // Ask providers for more candidates because strict verification removes weak/dead-source results.
  return Math.min(Math.max(requestedCount * 4, 12), 20);
}

function makeCacheKey(query: string, edition: string, version: string, count: number, providerMode: string) {
  return JSON.stringify({
    query: query.toLowerCase().replace(/\s+/g, ' ').trim(),
    edition: edition.toLowerCase().trim(),
    version: version.toLowerCase().trim(),
    count,
    providerMode
  });
}

function getCachedPayload(cacheKey: string) {
  const cached = responseCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    responseCache.delete(cacheKey);
    return null;
  }

  return cached.payload;
}

function setCachedPayload(cacheKey: string, payload: unknown) {
  if (responseCache.size >= MAX_CACHE_ITEMS) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }

  responseCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    payload
  });
}

function cleanJsonText(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function sliceJsonObject(text: string) {
  const cleaned = cleanJsonText(text);
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');

  if (first >= 0 && last > first) {
    return cleaned.slice(first, last + 1);
  }

  return cleaned;
}

function removeTrailingCommas(jsonText: string) {
  let output = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonText.length; i += 1) {
    const char = jsonText[i];

    if (escaped) {
      output += char;
      escaped = false;
      continue;
    }

    if (char === '\\' && inString) {
      output += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      output += char;
      continue;
    }

    if (!inString && char === ',') {
      let j = i + 1;
      while (j < jsonText.length && /\s/.test(jsonText[j])) j += 1;
      if (jsonText[j] === '}' || jsonText[j] === ']') {
        continue;
      }
    }

    output += char;
  }

  return output;
}

function repairLikelyJson(text: string) {
  let repaired = sliceJsonObject(text)
    .replace(/^\uFEFF/, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\bundefined\b/g, 'null')
    .replace(/\bNaN\b/g, 'null');

  repaired = removeTrailingCommas(repaired);

  // Repair rare LLM output like: { query: "..." } -> { "query": "..." }
  repaired = repaired.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$-]*)(\s*:)/g, '$1"$2"$3');

  return removeTrailingCommas(repaired);
}

function extractJson(text: string) {
  const candidates = [sliceJsonObject(text), repairLikelyJson(text)];
  const errors: string[] = [];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(
    `AI returned malformed JSON and automatic repair failed. Please try again. Parse errors: ${errors.slice(-2).join(' | ')}`
  );
}

function hostFromUrl(url?: string) {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function uniqueSources(sources: Source[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.url || `${source.title || ''}-${source.website || ''}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function groundingSources(data: GeminiResponse): Source[] {
  const chunks = data.candidates?.flatMap((candidate) => candidate.groundingMetadata?.groundingChunks || []) || [];
  return uniqueSources(
    chunks
      .map((chunk) => ({
        title: chunk.web?.title,
        url: chunk.web?.uri,
        website: hostFromUrl(chunk.web?.uri),
        evidence: 'Google Search grounding source'
      }))
      .filter((source) => source.url || source.title)
  );
}

function hasBadPlaceholder(value: unknown) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return true;

  return [
    'unknown',
    'not provided',
    'not shown',
    'not listed',
    'not available',
    'unavailable',
    'unspecified',
    'n/a',
    'none',
    'no seed'
  ].some((bad) => text === bad || text.includes(bad));
}

function hasRealSeedValue(value: unknown) {
  const text = String(value || '').trim();
  return text.length > 0 && !hasBadPlaceholder(text);
}

function hasRealEdition(value: unknown) {
  if (hasBadPlaceholder(value)) return false;
  const text = String(value).toLowerCase();
  return text.includes('java') || text.includes('bedrock') || text.includes('both');
}

function hasRealVersion(value: unknown) {
  if (hasBadPlaceholder(value)) return false;
  return /\d/.test(String(value));
}

function normalizeSourceUrl(url?: string) {
  if (!url) return undefined;

  let value = String(url).trim().replace(/^<|>$/g, '').replace(/[\])}.,]+$/g, '');

  try {
    const parsed = new URL(value);

    // Unwrap common Google redirect URLs if the model returns them.
    const nested = parsed.searchParams.get('url') || parsed.searchParams.get('q');
    if (nested && /^https?:\/\//i.test(nested) && parsed.hostname.includes('google.')) {
      value = nested;
    }
  } catch {
    return undefined;
  }

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return undefined;
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function canonicalUrlKey(url?: string) {
  const normalized = normalizeSourceUrl(url);
  if (!normalized) return undefined;

  try {
    const parsed = new URL(normalized);
    parsed.hash = '';

    for (const key of Array.from(parsed.searchParams.keys())) {
      if (/^(utm_|fbclid|gclid|mc_cid|mc_eid)/i.test(key)) {
        parsed.searchParams.delete(key);
      }
    }

    return parsed.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return normalized.replace(/\/$/, '').toLowerCase();
  }
}

function hasSourceUrl(seed: Record<string, unknown>) {
  const sources = Array.isArray(seed.sources) ? (seed.sources as Source[]) : [];
  return sources.some((source) => Boolean(normalizeSourceUrl(source.url)));
}

async function checkUrlStatus(url: string): Promise<'ok' | 'not-found' | 'unknown'> {
  const normalized = normalizeSourceUrl(url);
  if (!normalized) return 'not-found';

  const headers = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'User-Agent':
      'Mozilla/5.0 (compatible; AI-Minecraft-Seed-Finder/1.0; +https://seedfinder-ai-website.vercel.app)'
  };

  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const response = await fetchWithTimeout(
        normalized,
        {
          method,
          redirect: 'follow',
          headers
        },
        7000
      );

      if (response.status === 404 || response.status === 410) return 'not-found';
      if ((response.status >= 200 && response.status < 400) || [401, 403, 429].includes(response.status)) return 'ok';
      if (response.status === 405 && method === 'HEAD') continue;
      if (response.status >= 500) return 'unknown';
      if (response.status >= 400) return 'not-found';
    } catch {
      // Some websites block server-side checks. If this came from a trusted search result we can still keep it.
      return 'unknown';
    }
  }

  return 'unknown';
}

async function filterVerifiedSources(sources: Source[], trustedUrlKeys: Set<string>, statusCache: Map<string, Promise<'ok' | 'not-found' | 'unknown'>>) {
  const verified: Source[] = [];

  for (const source of sources) {
    const normalizedUrl = normalizeSourceUrl(source.url);
    if (!normalizedUrl) continue;

    const key = canonicalUrlKey(normalizedUrl);
    if (!key) continue;

    let statusPromise = statusCache.get(key);
    if (!statusPromise) {
      statusPromise = checkUrlStatus(normalizedUrl);
      statusCache.set(key, statusPromise);
    }

    const status = await statusPromise;
    const trusted = trustedUrlKeys.has(key);

    if (status === 'ok' || (status === 'unknown' && trusted)) {
      verified.push({
        ...source,
        url: normalizedUrl,
        website: source.website || hostFromUrl(normalizedUrl)
      });
    }
  }

  return uniqueSources(verified);
}

async function sanitizeSeedResults(rawSeeds: unknown[], count: number, trustedSources: Source[] = []) {
  const rejected: string[] = [];
  const validSeeds: Record<string, unknown>[] = [];
  const trustedUrlKeys = new Set(
    trustedSources
      .map((source) => canonicalUrlKey(source.url))
      .filter((key): key is string => Boolean(key))
  );
  const statusCache = new Map<string, Promise<'ok' | 'not-found' | 'unknown'>>();

  for (const rawSeed of rawSeeds) {
    if (!rawSeed || typeof rawSeed !== 'object') {
      rejected.push('Invalid seed object');
      continue;
    }

    const seed = rawSeed as Record<string, unknown>;
    const title = String(seed.title || seed.seed || 'Untitled seed');
    const reasons: string[] = [];

    if (!hasRealSeedValue(seed.seed)) reasons.push('missing exact seed number/string');
    if (!hasRealEdition(seed.edition)) reasons.push('missing Java/Bedrock edition');
    if (!hasRealVersion(seed.version)) reasons.push('missing specific Minecraft version');
    if (!hasSourceUrl(seed)) reasons.push('missing source URL');

    const rawSources = Array.isArray(seed.sources) ? (seed.sources as Source[]) : [];
    const cleanedSources = reasons.length ? [] : await filterVerifiedSources(rawSources, trustedUrlKeys, statusCache);

    if (!cleanedSources.length) reasons.push('source URL is dead, 404, or not verified');

    if (reasons.length) {
      rejected.push(`${title}: ${reasons.join(', ')}`);
      continue;
    }

    validSeeds.push({
      ...seed,
      seed: String(seed.seed).trim(),
      edition: String(seed.edition).trim(),
      version: String(seed.version).trim(),
      confidence: hasBadPlaceholder(seed.confidence) ? 'Medium' : seed.confidence,
      sources: cleanedSources
    });

    if (validSeeds.length >= count) break;
  }

  return { validSeeds, rejected };
}

function buildPrompt(query: string, edition: string, version: string, count: number) {
  return `You are a careful Minecraft seed research assistant.

Task: Search the public web for REAL Minecraft seeds that match this user request.

User request: ${query}
Preferred edition: ${edition}
Preferred version: ${version}
Number of seed results to return: ${count}

Strict rules:
- Return only seeds that are published on public websites, articles, forums, wikis, Reddit posts, or seed databases.
- Do not invent seed numbers, coordinates, websites, editions, or versions.
- Every returned seed MUST have an exact seed number/string in the "seed" field. If the source does not show the exact seed, OMIT that result.
- Every returned seed MUST have Java/Bedrock/Both edition and a specific Minecraft version from the source. If edition or version is unknown, OMIT that result.
- Every seed must include at least one source URL where the exact seed was found.
- Do not include collection pages, Reddit threads, or YouTube videos unless the accessible source text/snippet contains the exact seed number/string.
- Prefer recent and version-specific results.
- If the exact request has no perfect match, return close matches, but only if they still have exact seed + edition + version + source URL.
- Include both Java/Bedrock compatibility information when the source gives it.
- Include exact coordinates for structures/biomes when the source gives them. If exact coordinates are not available, say "not provided by source".
- Keep the response in English.

Return ONLY valid JSON. No markdown. Use this exact shape:
{
  "query": "short summary of the user request",
  "generatedAt": "ISO date string",
  "disclaimer": "short reminder to verify seeds in the listed Minecraft version",
  "websitesUsed": [
    { "title": "source page title", "website": "domain", "url": "https://...", "evidence": "what information was taken from this website" }
  ],
  "seeds": [
    {
      "title": "short descriptive seed title",
      "seed": "seed number/string exactly as source shows it",
      "edition": "Java / Bedrock / Both / Unknown",
      "version": "Minecraft version(s) listed by source",
      "spawn": "spawn description or coordinates if known",
      "confidence": "High / Medium / Low",
      "whyMatches": "why it matches the request",
      "features": [
        { "name": "structure or biome name", "type": "Village / Ancient City / Biome / etc", "coordinates": "X Y Z or X Z or not provided by source", "description": "what is there" }
      ],
      "sources": [
        { "title": "source page title", "website": "domain", "url": "https://...", "evidence": "seed / coordinates / version found here" }
      ],
      "notes": "compatibility warnings, missing coordinate note, or source caveat"
    }
  ]
}`;
}

async function callGemini(apiKey: string, model: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: 0.25,
      topP: 0.9,
      maxOutputTokens: 8192
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(body)
  });

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    const message = data.error?.message || `Google AI request failed with status ${response.status}`;
    throw new Error(message);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim();
  if (!text) {
    throw new Error('Google AI returned an empty response. Please try again.');
  }

  return { text, data };
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function readSourceWithJina(url: string) {
  try {
    const response = await fetchWithTimeout(`https://r.jina.ai/${url}`, {
      headers: {
        Accept: 'text/plain',
        'User-Agent': 'AI-Minecraft-Seed-Finder/1.0'
      }
    }, 10000);

    if (!response.ok) return '';
    const text = await response.text();
    return text.replace(/\s+/g, ' ').slice(0, 2400);
  } catch {
    return '';
  }
}

async function searchWithSerper(
  apiKey: string,
  query: string,
  edition: string,
  version: string,
  candidateCount = 12
): Promise<WebSearchSource[]> {
  const searchQueries = Array.from(
    new Set([
      `${query} Minecraft seed ${edition} ${version} exact seed coordinates`,
      `${query} Minecraft ${version} ${edition} seed number source`,
      `best Minecraft ${version} ${edition} seeds ${query} seed`
    ])
  ).slice(0, Math.min(Math.max(Math.ceil(candidateCount / 8), 2), 3));

  const allResults: WebSearchSource[] = [];

  for (const searchQuery of searchQueries) {
    const response = await fetchWithTimeout('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 10,
        gl: 'us',
        hl: 'en'
      })
    }, 12000);

    const data = (await response.json().catch(() => ({}))) as SerperResponse;

    if (!response.ok) {
      throw new Error(data.error || `Serper search failed with status ${response.status}`);
    }

    allResults.push(
      ...(data.organic || [])
        .filter((result) => result.link && result.title)
        .map((result) => ({
          title: result.title,
          url: result.link,
          website: hostFromUrl(result.link),
          evidence: result.snippet || 'Search result from Serper',
          snippet: result.snippet || ''
        }))
    );
  }

  const unique = uniqueSources(allResults).slice(0, Math.max(candidateCount, 12)) as WebSearchSource[];
  const enriched = await Promise.all(
    unique.slice(0, Math.min(unique.length, 10)).map(async (source) => ({
      ...source,
      content: source.url ? await readSourceWithJina(source.url) : ''
    }))
  );

  return [...enriched, ...unique.slice(enriched.length)];
}

function buildSearchResultPrompt(query: string, edition: string, version: string, count: number, sources: WebSearchSource[]) {
  const sourceText = sources
    .map((source, index) => {
      return `[${index + 1}] ${source.title || 'Untitled'}
Website: ${source.website || hostFromUrl(source.url)}
URL: ${source.url}
Search snippet: ${source.snippet || source.evidence || 'not provided'}
Page extract: ${source.content || 'not available'}
`;
    })
    .join('\n---\n');

  return `${buildPrompt(query, edition, version, count)}

You do not have live browsing in this step. Use ONLY the search results and page extracts below.
If the provided search results do not contain enough information for an exact seed number/string, Java/Bedrock edition, version, and source URL, omit that result.
Never output "not provided by source", "unknown", or similar text in the seed, edition, or version fields.
Every returned seed must cite one or more URLs from this provided source list.

Provided web search results:
${sourceText}`;
}

async function callGroq(apiKey: string, model: string, prompt: string) {
  const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a strict JSON extraction assistant. Return only valid JSON. Never invent Minecraft seeds, coordinates, versions, or source URLs.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.15,
      max_tokens: 6000
    })
  }, 20000);

  const data = (await response.json().catch(() => ({}))) as GroqResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || `Groq request failed with status ${response.status}`);
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('Groq returned an empty response.');
  }

  return { text, data };
}

async function searchSeedsWithGroq(groqKeys: string[], prompt: string) {
  const requestedModel = (process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL).trim();
  const models = Array.from(new Set([requestedModel, DEFAULT_GROQ_MODEL, 'llama-3.3-70b-versatile'].filter(Boolean)));
  const errors: string[] = [];

  for (let keyIndex = 0; keyIndex < groqKeys.length; keyIndex += 1) {
    const apiKey = groqKeys[keyIndex];

    for (const model of models) {
      try {
        return await callGroq(apiKey, model, prompt);
      } catch (error) {
        errors.push(`${shortKeyLabel(keyIndex)}/${model}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  throw new Error(`All Groq keys failed. Recent errors: ${errors.slice(-5).join(' | ')}`);
}

async function searchSeeds(apiKeys: string[], prompt: string) {
  const requestedModel = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
  const fallbackModels = [requestedModel, DEFAULT_MODEL, 'gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-2.0-flash'];
  const models = Array.from(new Set(fallbackModels.filter(Boolean)));
  const errors: string[] = [];

  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex += 1) {
    const apiKey = apiKeys[keyIndex];

    for (const model of models) {
      try {
        return await callGemini(apiKey, model, prompt);
      } catch (error) {
        errors.push(`key ${keyIndex + 1}/${model}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  throw new Error(
    `All configured Google AI keys failed or reached quota. Use legitimate Gemini API keys from your own Google AI Studio projects, add billing for production traffic, wait for quota reset, or configure SERPER_API_KEY + GROQ_API_KEY for fallback. ` +
      `Recent errors: ${errors.slice(-5).join(' | ')}`
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = String(body.query || '').trim();
    const edition = String(body.edition || 'Any').trim();
    const version = String(body.version || 'Latest stable').trim();
    const providerMode = String(body.providerMode || body.mode || 'gemini').toLowerCase() === 'groq' ? 'groq' : 'gemini';
    const defaultCount = providerMode === 'groq' ? 10 : 5;
    const maxCount = providerMode === 'groq' ? 15 : 5;
    const count = Math.min(Math.max(Number(body.count) || defaultCount, 1), maxCount);
    const candidateCount = providerMode === 'gemini' ? 5 : getCandidateCount(count);

    if (query.length < 8) {
      return NextResponse.json({ error: 'Please describe the seed you want in more detail.' }, { status: 400 });
    }

    const cacheKey = makeCacheKey(query, edition, version, count, providerMode);
    const cachedPayload = getCachedPayload(cacheKey);
    if (cachedPayload) {
      return NextResponse.json({ ...(cachedPayload as Record<string, unknown>), cached: true });
    }

    let text = '';
    let rawGroundingSources: Source[] = [];
    let provider = '';

    if (providerMode === 'gemini') {
      const apiKeys = getApiKeys();
      if (!apiKeys.length) {
        return NextResponse.json(
          {
            error: 'Gemini mode needs GOOGLE_AI_API_KEY or GOOGLE_AI_API_KEYS in Vercel Environment Variables.'
          },
          { status: 500 }
        );
      }

      const prompt = buildPrompt(query, edition, version, candidateCount);
      const googleResult = await searchSeeds(apiKeys, prompt);
      text = googleResult.text;
      rawGroundingSources = groundingSources(googleResult.data);
      provider = 'gemini-google-search';
    } else {
      const serperApiKey = getSerperApiKey();
      const groqKeys = getGroqApiKeys();

      if (!serperApiKey || !groqKeys.length) {
        return NextResponse.json(
          {
            error:
              'Groq + Serper mode needs SERPER_API_KEY plus GROQ_API_KEY / GROQ_API_KEY_2 in Vercel Environment Variables. Groq alone cannot search the live web.'
          },
          { status: 500 }
        );
      }

      const serperSources = await searchWithSerper(serperApiKey, query, edition, version, candidateCount);
      if (!serperSources.length) {
        throw new Error('Serper returned no web results for this seed request. Try a broader prompt.');
      }

      const groqPrompt = buildSearchResultPrompt(query, edition, version, candidateCount, serperSources);
      const groqResult = await searchSeedsWithGroq(groqKeys, groqPrompt);
      text = groqResult.text;
      rawGroundingSources = serperSources;
      provider = 'groq-serper';
    }

    const parsed = extractJson(text);

    const { validSeeds: seeds, rejected } = await sanitizeSeedResults(Array.isArray(parsed.seeds) ? parsed.seeds : [], count, rawGroundingSources);

    if (!seeds.length) {
      throw new Error(
        'No verified seeds found with exact seed number, Java/Bedrock edition, Minecraft version, and working source URL. Some source links returned 404 or could not be verified. Try a more specific request like "Java 1.21 village seed near spawn with coordinates", or try again later with different sources.'
      );
    }

    const websitesUsed = uniqueSources([...(parsed.websitesUsed || []), ...rawGroundingSources]);

    const payload = {
      query: parsed.query || query,
      generatedAt: parsed.generatedAt || new Date().toISOString(),
      disclaimer:
        parsed.disclaimer ||
        'Minecraft terrain generation can change between versions. Verify each seed in the edition and version listed by the source.',
      websitesUsed,
      rawGroundingSources,
      seeds,
      provider,
      providerMode,
      requestedResults: count,
      rejectedResults: rejected.slice(0, 5),
      cached: false
    };

    setCachedPayload(cacheKey, payload);

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown server error while searching seeds.'
      },
      { status: 500 }
    );
  }
}
