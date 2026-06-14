'use client';

import { FormEvent, useMemo, useState } from 'react';
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
  providerMode?: 'gemini' | 'groq';
  cached?: boolean;
  requestedResults?: number;
};

const examples = [
  'Java 1.21 seed with a village near spawn, trial chamber nearby, and a beautiful mountain valley',
  'Bedrock seed for survival island with ocean monument, shipwreck, and village not too far away',
  'Java seed with ancient city under spawn and cherry grove near mountains',
  'Speedrun style seed with ruined portal, village, and stronghold coordinates'
];

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
  const [providerMode, setProviderMode] = useState<'gemini' | 'groq'>('gemini');
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState('');

  const allSources = useMemo(() => {
    const fromSeeds = result?.seeds?.flatMap((seed) => seed.sources || []) || [];
    return normalizeSources([...(result?.websitesUsed || []), ...fromSeeds, ...(result?.rawGroundingSources || [])]);
  }, [result]);

  const resultOptions = providerMode === 'gemini' ? ['5'] : ['10', '15'];

  function changeProviderMode(mode: 'gemini' | 'groq') {
    setProviderMode(mode);
    setCount(mode === 'gemini' ? '5' : '10');
    setResult(null);
    setError('');
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (query.trim().length < 8) {
      setError('Please describe the seed you want in a little more detail.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/find-seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, edition, version, count: Number(count), providerMode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Something went wrong while searching.');
      }

      setResult(data);
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
              Describe the Minecraft world you want. Choose Gemini Google Search mode or Groq + Serper mode. The server finds real published seeds,
              lists source websites, and shows what is located where.
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
              <label htmlFor="providerMode">Mode</label>
              <select
                id="providerMode"
                value={providerMode}
                onChange={(e) => changeProviderMode(e.target.value === 'groq' ? 'groq' : 'gemini')}
              >
                <option value="gemini">Gemini Google Search</option>
                <option value="groq">Groq + Serper Search</option>
              </select>
              <small>
                {providerMode === 'gemini'
                  ? 'Uses Google Search grounding only. Serper is not used.'
                  : 'Uses Serper for web search and Groq for JSON results.'}
              </small>
            </div>

            <div className="field">
              <label htmlFor="count">Results</label>
              <select id="count" value={count} onChange={(e) => setCount(e.target.value)}>
                {resultOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <small>
                {providerMode === 'gemini'
                  ? 'Gemini mode is capped at 5 verified seeds.'
                  : 'Groq mode can request 10 or 15 verified seeds.'}
              </small>
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
            <span className="helper-text">Current mode: {providerMode === 'gemini' ? 'Gemini Google Search, max 5 seeds' : 'Groq + Serper, 10/15 seeds'}.</span>
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
            Gemini mode uses Google Search only. Groq mode uses Serper search. Every result is filtered for exact seed, edition, version, and working source URL.
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
              <div className="query-pill">Mode: {result.providerMode === 'groq' ? 'Groq + Serper' : 'Gemini Google Search'}{result.cached ? ' • cached' : ''}</div>
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
