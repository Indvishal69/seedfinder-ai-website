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

function makeCacheKey(query: string, edition: string, version: string, count: number) {
  return JSON.stringify({
    query: query.toLowerCase().replace(/\s+/g, ' ').trim(),
    edition: edition.toLowerCase().trim(),
    version: version.toLowerCase().trim(),
    count
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

function extractJson(text: string) {
  const cleaned = cleanJsonText(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) {
      return JSON.parse(cleaned.slice(first, last + 1));
    }
    throw new Error('Google AI did not return valid JSON. Please try again with a clearer seed request.');
  }
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
- Every seed must include at least one source URL where the seed was found.
- Prefer recent and version-specific results.
- If the exact request has no perfect match, return close matches and explain the difference in notes.
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

async function searchWithSerper(apiKey: string, query: string, edition: string, version: string): Promise<WebSearchSource[]> {
  const searchQuery = `${query} Minecraft seed ${edition} ${version} seed coordinates source`;
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

  const results = (data.organic || [])
    .filter((result) => result.link && result.title)
    .slice(0, 8)
    .map((result) => ({
      title: result.title,
      url: result.link,
      website: hostFromUrl(result.link),
      evidence: result.snippet || 'Search result from Serper',
      snippet: result.snippet || ''
    }));

  const unique = uniqueSources(results) as WebSearchSource[];
  const enriched = await Promise.all(
    unique.slice(0, 5).map(async (source) => ({
      ...source,
      content: source.url ? await readSourceWithJina(source.url) : ''
    }))
  );

  return [...enriched, ...unique.slice(5)];
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
If the provided search results do not contain enough information for a seed, do not invent it.
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
    const apiKeys = getApiKeys();
    if (!apiKeys.length) {
      return NextResponse.json(
        {
          error: 'Missing Google AI API key. Add GOOGLE_AI_API_KEY or GOOGLE_AI_API_KEYS in Vercel Environment Variables or .env.local for local testing.'
        },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const query = String(body.query || '').trim();
    const edition = String(body.edition || 'Any').trim();
    const version = String(body.version || 'Latest stable').trim();
    const count = Math.min(Math.max(Number(body.count) || 5, 1), 8);

    if (query.length < 8) {
      return NextResponse.json({ error: 'Please describe the seed you want in more detail.' }, { status: 400 });
    }

    const cacheKey = makeCacheKey(query, edition, version, count);
    const cachedPayload = getCachedPayload(cacheKey);
    if (cachedPayload) {
      return NextResponse.json({ ...(cachedPayload as Record<string, unknown>), cached: true });
    }

    const prompt = buildPrompt(query, edition, version, count);
    let text = '';
    let rawGroundingSources: Source[] = [];
    let provider = 'google-grounding';

    try {
      const googleResult = await searchSeeds(apiKeys, prompt);
      text = googleResult.text;
      rawGroundingSources = groundingSources(googleResult.data);
    } catch (googleError) {
      const serperApiKey = getSerperApiKey();
      const groqKeys = getGroqApiKeys();

      if (!serperApiKey || !groqKeys.length) {
        throw new Error(
          `${googleError instanceof Error ? googleError.message : String(googleError)} ` +
            `Groq fallback needs both SERPER_API_KEY for web search and GROQ_API_KEY / GROQ_API_KEY_2 for JSON formatting. Groq or local LLM alone cannot search the live web.`
        );
      }

      if (!isQuotaLikeError(googleError)) {
        // Still try the fallback once; many model/tool errors can be recovered with Serper + Groq.
      }

      const serperSources = await searchWithSerper(serperApiKey, query, edition, version);
      if (!serperSources.length) {
        throw new Error('Google AI failed and Serper returned no web results for this seed request.');
      }

      const groqPrompt = buildSearchResultPrompt(query, edition, version, count, serperSources);
      const groqResult = await searchSeedsWithGroq(groqKeys, groqPrompt);
      text = groqResult.text;
      rawGroundingSources = serperSources;
      provider = 'serper-groq';
    }

    const parsed = extractJson(text);

    const websitesUsed = uniqueSources([...(parsed.websitesUsed || []), ...rawGroundingSources]);
    const seeds = Array.isArray(parsed.seeds) ? parsed.seeds.slice(0, count) : [];

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
