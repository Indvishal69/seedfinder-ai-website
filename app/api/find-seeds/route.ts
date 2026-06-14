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

const DEFAULT_MODEL = 'gemini-3.5-flash';

function getApiKey() {
  return process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
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

async function searchSeeds(apiKey: string, prompt: string) {
  const requestedModel = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
  const fallbackModels = [requestedModel, DEFAULT_MODEL, 'gemini-2.5-flash', 'gemini-2.0-flash'];
  const models = Array.from(new Set(fallbackModels.filter(Boolean)));
  const errors: string[] = [];

  for (const model of models) {
    try {
      return await callGemini(apiKey, model, prompt);
    } catch (error) {
      errors.push(`${model}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(
    `Google AI web search failed. Make sure GOOGLE_AI_API_KEY is a real Gemini API key from Google AI Studio and set GEMINI_MODEL to ${DEFAULT_MODEL} or leave it empty. ` +
      `Recent errors: ${errors.slice(-4).join(' | ')}`
  );
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Missing Google AI API key. Add GOOGLE_AI_API_KEY in Vercel Environment Variables or .env.local for local testing.'
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

    const prompt = buildPrompt(query, edition, version, count);
    const { text, data } = await searchSeeds(apiKey, prompt);
    const parsed = extractJson(text);
    const rawGroundingSources = groundingSources(data);

    const websitesUsed = uniqueSources([...(parsed.websitesUsed || []), ...rawGroundingSources]);
    const seeds = Array.isArray(parsed.seeds) ? parsed.seeds.slice(0, count) : [];

    return NextResponse.json({
      query: parsed.query || query,
      generatedAt: parsed.generatedAt || new Date().toISOString(),
      disclaimer:
        parsed.disclaimer ||
        'Minecraft terrain generation can change between versions. Verify each seed in the edition and version listed by the source.',
      websitesUsed,
      rawGroundingSources,
      seeds
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown server error while searching seeds.'
      },
      { status: 500 }
    );
  }
}
