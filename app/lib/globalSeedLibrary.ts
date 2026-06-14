import { createHash } from 'crypto';

export type GlobalSource = {
  title?: string;
  url?: string;
  website?: string;
  evidence?: string;
};

export type GlobalSeed = {
  title?: string;
  seed?: string;
  edition?: string;
  version?: string;
  spawn?: string;
  confidence?: string;
  whyMatches?: string;
  features?: Array<{
    name?: string;
    type?: string;
    coordinates?: string;
    description?: string;
  }>;
  sources?: GlobalSource[];
  notes?: string;
  savedAt?: string;
};

type RedisResponse<T> = {
  result?: T;
  error?: string;
};

const SEARCH_TTL_SECONDS = 60 * 60 * 24 * 14;
const LIBRARY_KEY = 'seedfinder:global:seed-library:v1';
const SEARCH_PREFIX = 'seedfinder:global:search:';
const MAX_GLOBAL_SEEDS = 250;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;
  return { url, token };
}

export function isGlobalSeedLibraryConfigured() {
  return Boolean(redisConfig());
}

async function redisCommand<T>(command: unknown[]): Promise<T | null> {
  const config = redisConfig();
  if (!config) return null;

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command),
    cache: 'no-store'
  });

  const data = (await response.json().catch(() => ({}))) as RedisResponse<T>;

  if (!response.ok || data.error) {
    throw new Error(data.error || `Upstash Redis command failed with status ${response.status}`);
  }

  return data.result ?? null;
}

function hashKey(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 32);
}

function seedKey(seed: GlobalSeed) {
  return `${seed.seed || seed.title || ''}|${seed.edition || ''}|${seed.version || ''}`.toLowerCase();
}

function cleanSeed(seed: GlobalSeed): GlobalSeed | null {
  if (!seed || !seed.seed || !seed.edition || !seed.version) return null;

  return {
    title: String(seed.title || 'Saved Minecraft seed').slice(0, 140),
    seed: String(seed.seed).trim().slice(0, 120),
    edition: String(seed.edition).trim().slice(0, 80),
    version: String(seed.version).trim().slice(0, 80),
    spawn: seed.spawn ? String(seed.spawn).slice(0, 180) : undefined,
    confidence: seed.confidence ? String(seed.confidence).slice(0, 60) : 'Saved',
    whyMatches: seed.whyMatches ? String(seed.whyMatches).slice(0, 500) : undefined,
    features: Array.isArray(seed.features) ? seed.features.slice(0, 8) : [],
    sources: Array.isArray(seed.sources)
      ? seed.sources
          .filter((source) => source.url)
          .slice(0, 4)
          .map((source) => ({
            title: source.title ? String(source.title).slice(0, 180) : undefined,
            url: source.url,
            website: source.website,
            evidence: source.evidence ? String(source.evidence).slice(0, 320) : undefined
          }))
      : [],
    notes: seed.notes ? String(seed.notes).slice(0, 260) : undefined,
    savedAt: seed.savedAt || new Date().toISOString()
  };
}

export async function getGlobalSeeds(limit = 80): Promise<GlobalSeed[]> {
  const raw = await redisCommand<string>(['GET', LIBRARY_KEY]);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as GlobalSeed[];
    return Array.isArray(parsed) ? parsed.slice(0, limit) : [];
  } catch {
    return [];
  }
}

export async function saveGlobalSeeds(seeds: GlobalSeed[]) {
  if (!isGlobalSeedLibraryConfigured()) return;

  const current = await getGlobalSeeds(MAX_GLOBAL_SEEDS);
  const map = new Map<string, GlobalSeed>();

  for (const seed of current) {
    const cleaned = cleanSeed(seed);
    if (cleaned) map.set(seedKey(cleaned), cleaned);
  }

  for (const seed of seeds) {
    const cleaned = cleanSeed({ ...seed, savedAt: new Date().toISOString() });
    if (cleaned) map.set(seedKey(cleaned), cleaned);
  }

  const next = Array.from(map.values())
    .sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || '')))
    .slice(0, MAX_GLOBAL_SEEDS);

  await redisCommand(['SET', LIBRARY_KEY, JSON.stringify(next)]);
}

export async function getGlobalSearchResult<T>(cacheKey: string): Promise<T | null> {
  const key = `${SEARCH_PREFIX}${hashKey(cacheKey)}`;
  const raw = await redisCommand<string>(['GET', key]);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function saveGlobalSearchResult(cacheKey: string, payload: unknown) {
  if (!isGlobalSeedLibraryConfigured()) return;

  const key = `${SEARCH_PREFIX}${hashKey(cacheKey)}`;
  await redisCommand(['SET', key, JSON.stringify(payload), 'EX', SEARCH_TTL_SECONDS]);
}

export async function saveGlobalSeedResult(cacheKey: string, payload: unknown, seeds: GlobalSeed[]) {
  if (!isGlobalSeedLibraryConfigured()) return;

  await Promise.all([saveGlobalSearchResult(cacheKey, payload), saveGlobalSeeds(seeds)]);
}
