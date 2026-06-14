'use client';

import { Fragment, FormEvent, useEffect, useMemo, useState } from 'react';
import { AdsterraBannerAd, AdsterraNativeBannerAd, AdsterraSocialBar } from './components/AdsterraAds';

type Feature = {
  name?: string;
  type?: string;
  coordinates?: string;
  description?: string;
};

type Source = {
  title?: string;
  url?: string;
  website?: string;
  evidence?: string;
};

type SeedResult = {
  title?: string;
  seed?: string;
  edition?: string;
  version?: string;
  spawn?: string;
  confidence?: string;
  tags?: string[];
  whyMatches?: string;
  features?: Feature[];
  sources?: Source[];
  notes?: string;
};

type ApiResult = {
  query: string;
  generatedAt: string;
  disclaimer?: string;
  seeds: SeedResult[];
  websitesUsed?: Source[];
  rawGroundingSources?: Source[];
  provider?: string;
  providerMode?: string;
  cached?: boolean;
  requestedResults?: number;
};

const examples = [
  'Java 1.21 seed with a village near spawn, trial chamber nearby, and a beautiful mountain valley',
  'Bedrock seed for survival island with ocean monument, shipwreck, and village not too far away',
  'Java seed with ancient city under spawn and cherry grove near mountains',
  'Speedrun style seed with ruined portal, village, and stronghold coordinates'
];

const SAVED_SEARCHES_KEY = 'seedfinder:saved-searches:v1';
const SAVED_SEEDS_KEY = 'seedfinder:saved-seeds:v1';

const PRELOADED_SEEDS: SeedResult[] = [
  {
    title: 'Quick Minecraft 1.21 Beginning',
    seed: '-6538244134311383951',
    edition: 'Java',
    version: '1.21',
    spawn: 'Desert spawn with a village nearby.',
    confidence: 'Preloaded',
    whyMatches: 'A strong starter seed with a village and quick trial chamber access.',
    features: [
      { name: 'Desert Village', type: 'Village', coordinates: 'X: 160 Z: 50', description: 'Village close to spawn.' },
      { name: 'Trial Chamber', type: 'Trial Chamber', coordinates: 'below/near village', description: 'Source describes quick trial chamber access.' }
    ],
    sources: [
      {
        title: '25 Best Minecraft 1.21 Seeds to Try (Java & Bedrock) - Beebom',
        website: 'beebom.com',
        url: 'https://beebom.com/best-minecraft-1-21-seeds/',
        evidence: 'Source lists Seed Code -6538244134311383951 for Java 1.21 with village coordinates.'
      }
    ],
    notes: 'Preloaded library seed. Verify in the listed version before long-term play.'
  },
  {
    title: 'Village in Ancient City Spawn',
    seed: '2422215857861955386',
    edition: 'Java',
    version: '1.20 - 1.21.11',
    spawn: 'Spawn coordinates around X: 19 Y: -50 Z: -7.',
    confidence: 'Preloaded',
    whyMatches: 'Village-focused Java seed with ancient city and multiple nearby structures listed by source.',
    features: [
      { name: 'Village #1', type: 'Village', coordinates: '179, -720', description: 'Plains village.' },
      { name: 'Village #2', type: 'Village', coordinates: '784, -272', description: 'Plains village.' },
      { name: 'Woodland Mansion', type: 'Mansion', coordinates: '495, 843', description: 'Mansion listed by source.' }
    ],
    sources: [
      {
        title: 'Village in ancient city spawn - WiseHosting',
        website: 'wisehosting.com',
        url: 'https://wisehosting.com/minecraft-seeds/village-in-ancient-city-spawn',
        evidence: 'Source lists Java seed 2422215857861955386 with 1.20-1.21.11 compatibility and coordinates.'
      }
    ],
    notes: 'Preloaded library seed. Verify coordinates in your exact version.'
  },
  {
    title: 'Isolated Village on an Ocean',
    seed: '-2621657933082943030',
    edition: 'Java',
    version: '1.20 - 1.21.11',
    spawn: 'Spawn coordinates around X: 5 Y: 63 Z: 3.',
    confidence: 'Preloaded',
    whyMatches: 'A Java ocean/village seed with multiple villages and stronghold details listed by source.',
    features: [
      { name: 'Taiga Village', type: 'Village', coordinates: '847, 97', description: 'Village listed by source.' },
      { name: 'Plains Village', type: 'Village', coordinates: '1184, 592', description: 'Village listed by source.' },
      { name: 'Stronghold', type: 'Stronghold', coordinates: '1636, -428', description: 'Stronghold listed by source.' }
    ],
    sources: [
      {
        title: 'Isolated village on an ocean - WiseHosting',
        website: 'wisehosting.com',
        url: 'https://wisehosting.com/minecraft-seeds/isolated-village-on-an-ocean',
        evidence: 'Source lists Java seed -2621657933082943030 with version compatibility and coordinates.'
      }
    ],
    notes: 'Preloaded library seed. Good for ocean/village searches.'
  },
  {
    title: 'Multiple Structures Spawn',
    seed: '-767300786513247025',
    edition: 'Java',
    version: '1.20 - 1.21.11',
    spawn: 'Spawn coordinates around X: 10 Y: 95 Z: 2.',
    confidence: 'Preloaded',
    whyMatches: 'A structure-heavy Java seed with villages, ancient cities, stronghold, and mansion.',
    features: [
      { name: 'Village #1', type: 'Village', coordinates: '79, 639', description: 'Plains village.' },
      { name: 'Ancient City #1', type: 'Ancient City', coordinates: '-232, -136', description: 'Ancient city listed by source.' },
      { name: 'Woodland Mansion', type: 'Mansion', coordinates: '-863, 1520', description: 'Mansion listed by source.' }
    ],
    sources: [
      {
        title: 'Multiple structures spawn - WiseHosting',
        website: 'wisehosting.com',
        url: 'https://wisehosting.com/minecraft-seeds/multiple-structures-spawn',
        evidence: 'Source lists Java seed -767300786513247025 with multiple structures and coordinates.'
      }
    ],
    notes: 'Preloaded library seed. Useful for structure-heavy searches.'
  },
  {
    title: 'Twin Islands: Badlands and Jungle',
    seed: '7850875',
    edition: 'Java / Bedrock terrain',
    version: '1.20',
    spawn: 'Large vertical islands around spawn.',
    confidence: 'Preloaded',
    whyMatches: 'Island seed with badlands and jungle island features listed by source.',
    features: [
      { name: 'Badlands Island', type: 'Biome / Island', coordinates: 'near spawn', description: 'Small badlands island topped with trees.' },
      { name: 'Jungle Island', type: 'Biome / Island', coordinates: 'near spawn', description: 'Larger jungle island near spawn.' }
    ],
    sources: [
      {
        title: 'The best Minecraft seeds in 2026 - PC Gamer',
        website: 'pcgamer.com',
        url: 'https://www.pcgamer.com/best-minecraft-seeds/',
        evidence: 'Source lists Seed 7850875 with version 1.20 and twin-island description.'
      }
    ],
    notes: 'Preloaded library seed. Verify exact structure placement in your edition.'
  },
  {
    title: 'Java & Bedrock Plains Village Hub',
    seed: '9137002542963915989',
    edition: 'Java / Bedrock',
    version: '1.21',
    spawn: 'Plains village near spawn.',
    confidence: 'Preloaded',
    whyMatches: 'Village-focused 1.21 seed listed for both Java and Bedrock.',
    features: [
      { name: 'Plains Village', type: 'Village', coordinates: 'near spawn', description: 'Village close to spawn according to source.' },
      { name: 'Trial Chambers', type: 'Trial Chamber', coordinates: 'nearby', description: 'Accessible trial chambers listed by source.' },
      { name: 'Ancient City', type: 'Ancient City', coordinates: 'nearby', description: 'Ancient city listed by source.' }
    ],
    sources: [
      {
        title: 'Minecraft Village Seeds - ExitLag',
        website: 'exitlag.com',
        url: 'https://www.exitlag.com/blog/minecraft-village-seeds/',
        evidence: 'Source lists Seed 9137002542963915989 for Java & Bedrock 1.21.'
      }
    ],
    notes: 'Preloaded library seed. Verify in-game before long-term play.'
  }
];

type SavedSearch = {
  key: string;
  result: ApiResult;
};

function makeLocalSearchKey(query: string, edition: string, version: string, count: string) {
  return JSON.stringify({
    query: query.toLowerCase().replace(/\s+/g, ' ').trim(),
    edition: edition.toLowerCase().trim(),
    version: version.toLowerCase().trim(),
    count
  });
}

function uniqueSeeds(seeds: SeedResult[]) {
  const seen = new Set<string>();
  return seeds.filter((seed) => {
    const key = `${seed.seed || seed.title}-${seed.edition || ''}-${seed.version || ''}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function seedTags(seed: SeedResult) {
  const fromSeed = Array.isArray(seed.tags) ? seed.tags : [];
  const generated = [
    seed.edition,
    seed.version,
    ...(seed.features || []).flatMap((feature) => [feature.type, feature.name])
  ];

  const seen = new Set<string>();
  return [...fromSeed, ...generated]
    .map((tag) => String(tag || '').trim())
    .filter((tag) => tag && tag.length <= 32)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

function normalizeSources(sources?: Source[]) {
  if (!sources) return [];
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.url || `${source.title}-${source.website}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function Home() {
  const [query, setQuery] = useState(examples[0]);
  const [edition, setEdition] = useState('Any');
  const [version, setVersion] = useState('Latest stable');
  const [count, setCount] = useState('5');
  const [savedSeeds, setSavedSeeds] = useState<SeedResult[]>([]);
  const [globalSeeds, setGlobalSeeds] = useState<SeedResult[]>([]);
  const [globalLibraryReady, setGlobalLibraryReady] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState('');
  const [activeSeedTab, setActiveSeedTab] = useState<'preloaded' | 'saved'>('saved');

  const allSources = useMemo(() => {
    const fromSeeds = result?.seeds?.flatMap((seed) => seed.sources || []) || [];
    return normalizeSources([...(result?.websitesUsed || []), ...fromSeeds, ...(result?.rawGroundingSources || [])]);
  }, [result]);

  const resultOptions = ['5', '10', '15', '20'];
  const librarySeeds = useMemo(() => uniqueSeeds([...PRELOADED_SEEDS, ...globalSeeds, ...savedSeeds]), [globalSeeds, savedSeeds]);
  const aiSavedSeeds = useMemo(() => uniqueSeeds([...globalSeeds, ...savedSeeds]), [globalSeeds, savedSeeds]);
  const activeLibrarySeeds = activeSeedTab === 'preloaded' ? PRELOADED_SEEDS : aiSavedSeeds;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_SEEDS_KEY) || '[]') as SeedResult[];
      if (Array.isArray(saved)) setSavedSeeds(saved);
    } catch {
      setSavedSeeds([]);
    }

    fetch('/api/seed-library')
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data?.seeds)) setGlobalSeeds(data.seeds);
        setGlobalLibraryReady(Boolean(data?.configured));
      })
      .catch(() => setGlobalLibraryReady(false));
  }, []);

  function loadSavedSearch(searchKey: string) {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || '[]') as SavedSearch[];
      return saved.find((item) => item.key === searchKey)?.result || null;
    } catch {
      return null;
    }
  }

  function saveAiResult(searchKey: string, data: ApiResult) {
    try {
      const nextSeeds = uniqueSeeds([...(data.seeds || []), ...savedSeeds]).slice(0, 80);
      setSavedSeeds(nextSeeds);
      setGlobalSeeds((current) => uniqueSeeds([...(data.seeds || []), ...current]).slice(0, 120));
      localStorage.setItem(SAVED_SEEDS_KEY, JSON.stringify(nextSeeds));

      const savedSearches = JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || '[]') as SavedSearch[];
      const nextSearches = [{ key: searchKey, result: data }, ...savedSearches.filter((item) => item.key !== searchKey)].slice(0, 40);
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(nextSearches));
    } catch {
      // Browser storage can be blocked; the app should still work.
    }
  }

  function findExactLibrarySeed() {
    const lowerQuery = query.toLowerCase();
    return librarySeeds.filter((seed) => seed.seed && lowerQuery.includes(String(seed.seed).toLowerCase())).slice(0, Number(count) || 5);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (query.trim().length < 8) {
      setError('Please describe the seed you want in a little more detail.');
      return;
    }

    const searchKey = makeLocalSearchKey(query, edition, version, count);
    const savedSearch = loadSavedSearch(searchKey);
    if (savedSearch) {
      setResult({ ...savedSearch, cached: true, provider: 'saved-browser-library' });
      return;
    }

    const exactLibraryMatches = findExactLibrarySeed();
    if (exactLibraryMatches.length) {
      setResult({
        query,
        generatedAt: new Date().toISOString(),
        disclaimer: 'Returned from your saved seed library. Verify seeds in the listed Minecraft version.',
        seeds: exactLibraryMatches,
        websitesUsed: normalizeSources(exactLibraryMatches.flatMap((seed) => seed.sources || [])),
        rawGroundingSources: [],
        provider: 'saved-seed-library',
        cached: true
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/find-seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, edition, version, count: Number(count) })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Something went wrong while searching.');
      }

      setResult(data);
      saveAiResult(searchKey, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while searching.');
    } finally {
      setLoading(false);
    }
  }


  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AI Minecraft Seed Finder',
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    description: 'Find real Minecraft seeds with source websites, Java/Bedrock edition details, versions, and coordinates.',
    url: 'https://seedfinder-ai-website.vercel.app',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  };

  async function copySeed(seed?: string) {
    if (!seed) return;
    await navigator.clipboard.writeText(seed);
    setCopiedSeed(seed);
    setTimeout(() => setCopiedSeed(''), 1400);
  }

  return (
    <main className="shell">
      <AdsterraSocialBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="badge-row">
              <span className="badge">🌐 Web sourced</span>
              <span className="badge">🔐 Server-side API key</span>
              <span className="badge">⛏️ Java + Bedrock</span>
            </div>
            <h1>
              AI Minecraft <span>Seed Finder</span>
            </h1>
            <p>
              Describe the Minecraft world you want. The server uses Gemini with Google Search to find real published seeds, list source websites,
              and show what is located where. AI results are saved in your browser seed library.
            </p>
          </div>

          <div className="pixel-card" aria-hidden="true">
            <div className="pixel-grid">
              {['grass','grass','sand','water','water','deep','grass','stone','sand','sand','water','deep','grass','grass','stone','lava','stone','deep','deep','grass','stone','stone','grass','grass','water','water','sand','grass','grass','stone','deep','water','water','sand','grass','grass'].map((block, index) => (
                <div className={`block ${block}`} key={`${block}-${index}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="responsive-ad-stack top-ad">
        <AdsterraBannerAd size="728x90" label="Top advertisement" className="desktop-ad" />
        <AdsterraBannerAd size="320x50" label="Top advertisement" className="mobile-ad" />
      </div>

      <section className="search-panel" id="finder">
        <form className="form-card" onSubmit={submit}>
          <label htmlFor="query">What kind of seed do you want?</label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Example: Java 1.21 seed with village at spawn, trial chamber, ancient city, and cherry grove nearby..."
          />

          <div className="controls">
            <div className="field">
              <label htmlFor="edition">Edition</label>
              <select id="edition" value={edition} onChange={(e) => setEdition(e.target.value)}>
                <option>Any</option>
                <option>Java</option>
                <option>Bedrock</option>
              </select>
              <small>Choose Java, Bedrock, or let AI decide.</small>
            </div>

            <div className="field">
              <label htmlFor="version">Version</label>
              <input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.21, 1.20, Latest stable..."
              />
              <small>Write exact version if needed.</small>
            </div>

            <div className="field">
              <label htmlFor="count">Results</label>
              <select id="count" value={count} onChange={(e) => setCount(e.target.value)}>
                {resultOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <small>Gemini Google Search mode. Serper and Groq are not used.</small>
            </div>
          </div>

          <div className="action-row">
            <button className="primary-btn" disabled={loading} type="submit">
              {loading ? <><span className="loader" /> Searching real seeds...</> : 'Find Real Seeds'}
            </button>
            <button
              className="secondary-btn"
              disabled={loading}
              type="button"
              onClick={() => setQuery(examples[Math.floor(Math.random() * examples.length)])}
            >
              Try example
            </button>
            <span className="helper-text">Gemini Google Search only. Same searches return from your saved library/cache.</span>
          </div>
        </form>

        <aside className="tips-card">
          <AdsterraBannerAd size="300x250" label="Sidebar advertisement" className="sidebar-ad" />

          <h2>Best prompts</h2>
          <ul>
            <li>Mention edition: Java or Bedrock.</li>
            <li>Add version: 1.21, 1.20, 1.19, etc.</li>
            <li>Ask for structures: village, ancient city, mansion, monument, trial chamber.</li>
            <li>Ask for biome style: cherry grove, snow, desert, island, mountains.</li>
          </ul>
          <div className="status-strip">
            This app uses Gemini Google Search only. Generated seeds are saved in your browser library and reused when you ask the same search again.
          </div>
        </aside>
      </section>

      <section className="results-wrap" aria-live="polite">
        {error && <div className="error-card">⚠️ {error}</div>}

        {!error && !result && !loading && (
          <div className="empty-card">
            Results will appear here with seed numbers, edition, version, coordinates, and the website each seed came from.
          </div>
        )}

        {result && (
          <div className="results-card">
            <div className="results-header">
              <div>
                <h2>Found seeds</h2>
                <div className="query-pill" title={result.query}>Query: {result.query}</div>
              </div>
              <div className="query-pill">Source: {result.cached ? 'Saved seed library/cache' : 'Gemini Google Search'}</div>
              <div className="query-pill">Generated: {new Date(result.generatedAt).toLocaleString()}</div>
            </div>

            {result.disclaimer && <p className="notice">{result.disclaimer}</p>}

            <AdsterraNativeBannerAd label="Sponsored Minecraft picks" className="results-ad" />

            <div className="seed-grid">
              {result.seeds?.map((seed, index) => (
                <article className="seed-card" key={`${seed.seed || 'seed'}-${index}`}>
                  <div className="seed-top">
                    <h3>{seed.title || `Seed ${index + 1}`}</h3>
                    <span className="confidence">{seed.confidence || 'Check source'}</span>
                  </div>

                  <div className="meta-row">
                    <span className="meta">{seed.edition || 'Edition unknown'}</span>
                    <span className="meta">{seed.version || 'Version unknown'}</span>
                    {seed.spawn && <span className="meta">Spawn: {seed.spawn}</span>}
                  </div>

                  {!!seedTags(seed).length && (
                    <div className="tag-row">
                      {seedTags(seed).map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}
                    </div>
                  )}

                  <div className="seed-box">
                    <div className="seed-value">{seed.seed || 'Seed not shown by source'}</div>
                    <button className="copy-btn" type="button" onClick={() => copySeed(seed.seed)}>
                      {copiedSeed === seed.seed ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {seed.whyMatches && (
                    <div className="card-section">
                      <h4>Why this matches</h4>
                      <p>{seed.whyMatches}</p>
                    </div>
                  )}

                  {!!seed.features?.length && (
                    <div className="card-section">
                      <h4>What is where</h4>
                      <ul className="feature-list">
                        {seed.features.map((feature, featureIndex) => (
                          <li className="feature-item" key={`${feature.name}-${featureIndex}`}>
                            <div className="feature-title">
                              <span>{feature.name || feature.type || 'Location'}</span>
                              {feature.coordinates && <span className="coords">{feature.coordinates}</span>}
                            </div>
                            {feature.description && <p>{feature.description}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!!seed.sources?.length && (
                    <div className="card-section">
                      <h4>Seed source</h4>
                      <ul className="source-list">
                        {normalizeSources(seed.sources).map((source, sourceIndex) => (
                          <li className="source-item" key={`${source.url || source.title}-${sourceIndex}`}>
                            {source.url ? (
                              <a href={source.url} target="_blank" rel="noreferrer">{source.title || source.website || source.url}</a>
                            ) : (
                              <strong>{source.title || source.website || 'Source listed by AI'}</strong>
                            )}
                            {source.evidence && <p>{source.evidence}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {seed.notes && (
                    <div className="card-section">
                      <h4>Notes</h4>
                      <p>{seed.notes}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {!!allSources.length && (
              <div className="all-sources">
                <h3>Websites used</h3>
                <ol>
                  {allSources.map((source, index) => (
                    <li key={`${source.url || source.title}-${index}`}>
                      {source.url ? (
                        <a href={source.url} target="_blank" rel="noreferrer">{source.title || source.website || source.url}</a>
                      ) : (
                        <span>{source.title || source.website || 'Unnamed source'}</span>
                      )}
                      {source.evidence ? ` — ${source.evidence}` : ''}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="seed-library-section seed-tabs-section" id="seed-library">
        <div className="seo-section-head">
          <span className="badge">💾 Seed library</span>
          <h2>Saved seeds tab</h2>
          <p>
            Use the tabs below to switch between built-in seeds and AI saved seeds.
            {globalLibraryReady ? ' Global database is connected, so saved seeds can appear for all users.' : ' Global database is not connected yet, so this browser saves local seeds only.'}
          </p>
        </div>

        <div className="seed-tabs" role="tablist" aria-label="Seed library tabs">
          <button
            className={`seed-tab ${activeSeedTab === 'saved' ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeSeedTab === 'saved'}
            onClick={() => setActiveSeedTab('saved')}
          >
            💾 AI Saved Seeds <span>{aiSavedSeeds.length}</span>
          </button>
          <button
            className={`seed-tab ${activeSeedTab === 'preloaded' ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeSeedTab === 'preloaded'}
            onClick={() => setActiveSeedTab('preloaded')}
          >
            📦 Built-in Seeds <span>{PRELOADED_SEEDS.length}</span>
          </button>
        </div>

        {activeSeedTab === 'saved' && (
          <AdsterraNativeBannerAd label="Saved seeds advertisement" className="results-ad library-ad" />
        )}

        {activeLibrarySeeds.length ? (
          <div className="library-grid detailed-library-grid">
            {activeLibrarySeeds.slice(0, 12).map((seed, index) => (
              <Fragment key={`${activeSeedTab}-${seed.seed}-${index}`}>
                <article className="library-card detailed-library-card">
                  <div className="seed-top">
                    <h3>{seed.title || (activeSeedTab === 'saved' ? 'Saved seed' : 'Preloaded seed')}</h3>
                    <span className="confidence">{seed.confidence || (activeSeedTab === 'saved' ? 'Saved' : 'Preloaded')}</span>
                  </div>
                  <div className="seed-value small">{seed.seed}</div>
                  <div className="meta-row">
                    <span className="meta">{seed.edition}</span>
                    <span className="meta">{seed.version}</span>
                    {seed.spawn && <span className="meta">Spawn: {seed.spawn}</span>}
                  </div>
                  {!!seedTags(seed).length && (
                    <div className="tag-row compact">
                      {seedTags(seed).map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}
                    </div>
                  )}

                  {seed.whyMatches && (
                    <div className="library-detail-block">
                      <h4>Why this seed</h4>
                      <p>{seed.whyMatches}</p>
                    </div>
                  )}

                  {!!seed.features?.length && (
                    <div className="library-detail-block">
                      <h4>What is where</h4>
                      <ul className="library-feature-list">
                        {seed.features.slice(0, 6).map((feature, featureIndex) => (
                          <li key={`${feature.name || feature.type}-${featureIndex}`}>
                            <strong>{feature.name || feature.type || 'Location'}</strong>
                            {feature.coordinates && <span>{feature.coordinates}</span>}
                            {feature.description && <p>{feature.description}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!!seed.sources?.length && (
                    <div className="library-detail-block">
                      <h4>Sources</h4>
                      <ul className="library-source-list">
                        {normalizeSources(seed.sources).slice(0, 3).map((source, sourceIndex) => (
                          <li key={`${source.url || source.title}-${sourceIndex}`}>
                            {source.url ? (
                              <a href={source.url} target="_blank" rel="noreferrer">
                                {source.title || source.website || 'Open source'}
                              </a>
                            ) : (
                              <strong>{source.title || source.website || 'Source'}</strong>
                            )}
                            {source.evidence && <p>{source.evidence}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {seed.notes && (
                    <div className="library-detail-block">
                      <h4>Notes</h4>
                      <p>{seed.notes}</p>
                    </div>
                  )}

                  <button className="secondary-btn library-copy" type="button" onClick={() => copySeed(seed.seed)}>
                    {copiedSeed === seed.seed ? 'Copied' : 'Copy seed'}
                  </button>
                </article>

                {activeSeedTab === 'saved' && (index + 1) % 3 === 0 && (
                  <div className="library-inline-ad">
                    <AdsterraNativeBannerAd label="Saved seeds in-feed advertisement" className="results-ad library-ad" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        ) : (
          <div className="empty-card library-empty">
            No AI-saved seeds yet. Run a Gemini search; verified results will be saved in this tab automatically.
          </div>
        )}
      </section>

      <section className="seo-section">
        <div className="seo-section-head">
          <span className="badge">📈 Minecraft seed guides</span>
          <h2>Popular seed searches</h2>
          <p>
            Explore SEO-friendly guides for Java, Bedrock, 1.21 trial chambers, villages, ancient cities,
            cherry groves, survival islands, mansions, and speedrun-style seeds.
          </p>
        </div>
        <div className="seo-link-grid">
          <a href="/seed-guides/best-minecraft-1-21-seeds">⛏️ Best Minecraft 1.21 Seeds</a>
          <a href="/seed-guides/minecraft-java-village-seeds">🏘️ Java Village Seeds</a>
          <a href="/seed-guides/minecraft-bedrock-survival-island-seeds">🏝️ Bedrock Survival Island Seeds</a>
          <a href="/seed-guides/ancient-city-seeds">🌌 Ancient City Seeds</a>
          <a href="/seed-guides/trial-chamber-seeds">🧱 Trial Chamber Seeds</a>
          <a href="/seed-guides/cherry-grove-seeds">🌸 Cherry Grove Seeds</a>
          <a href="/seed-guides/woodland-mansion-seeds">🏚️ Woodland Mansion Seeds</a>
          <a href="/seed-guides/speedrun-seeds">⚡ Speedrun Seeds</a>
        </div>
      </section>

      <footer className="footer">
        <div>Built for Vercel. Keep your Google AI key in environment variables only.</div>
        <nav className="footer-links" aria-label="Footer links">
          <a href="#seed-library">Saved Seeds</a>
          <a href="/seed-guides">Seed Guides</a>
          <a href="/about">About</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/contact">Contact</a>
        </nav>
      </footer>
    </main>
  );
}
