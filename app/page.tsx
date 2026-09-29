'use client';

import { Fragment, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AdsterraBannerAd, AdsterraNativeBannerAd, AdsterraSocialBar } from './components/AdsterraAds';
import { AuthProvider, useAuth } from './components/AuthContext';
import AuthModal from './components/AuthModal';
import UserMenu from './components/UserMenu';
import DailySeeds from './components/DailySeeds';
import { saveUserFavorite, getUserFavorites, removeUserFavorite, saveSearchHistory } from './lib/firebase';
import { POPULAR_TAGS } from './lib/tags';

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
  id?: string;
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
  'Speedrun style seed with ruined portal, village, and stronghold coordinates',
  'Minecraft 1.21 seed with cherry grove, village, and trial chamber all within 500 blocks',
  'Best Java seed for building a medieval kingdom with nearby plains and river',
  'Bedrock 1.21 seed with mushroom island near spawn',
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

function HomeContent() {
  const { user } = useAuth();
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
  const [activePageTab, setActivePageTab] = useState<'finder' | 'daily' | 'favorites' | 'other'>('finder');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [favorites, setFavorites] = useState<SeedResult[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const resultsRef = useRef<HTMLElement | null>(null);

  const allSources = useMemo(() => {
    const fromSeeds = result?.seeds?.flatMap((seed) => seed.sources || []) || [];
    return normalizeSources([...(result?.websitesUsed || []), ...fromSeeds, ...(result?.rawGroundingSources || [])]);
  }, [result]);

  const resultOptions = ['5', '10', '15', '20'];
  const librarySeeds = useMemo(() => uniqueSeeds([...PRELOADED_SEEDS, ...globalSeeds, ...savedSeeds]), [globalSeeds, savedSeeds]);
  const aiSavedSeeds = useMemo(() => uniqueSeeds([...globalSeeds, ...savedSeeds]), [globalSeeds, savedSeeds]);
  const activeLibrarySeeds = activeSeedTab === 'preloaded' ? PRELOADED_SEEDS : aiSavedSeeds;

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 2500);
  }

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

  // Load favorites when user logs in
  useEffect(() => {
    if (user) {
      getUserFavorites(user.uid)
        .then((favs) => setFavorites(favs as SeedResult[]))
        .catch(() => setFavorites([]));
    } else {
      setFavorites([]);
    }
  }, [user]);

  function openFinder() {
    setActivePageTab('finder');
    setMobileMenuOpen(false);
    window.setTimeout(() => document.getElementById('finder')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function openDaily() {
    setActivePageTab('daily');
    setMobileMenuOpen(false);
    window.setTimeout(() => document.getElementById('daily-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function openFavorites() {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setActivePageTab('favorites');
    setMobileMenuOpen(false);
  }

  function openOtherSeeds() {
    setActivePageTab('other');
    setMobileMenuOpen(false);
    window.setTimeout(() => document.getElementById('seed-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function openResults() {
    setActivePageTab('finder');
    setMobileMenuOpen(false);
    scrollToResults();
  }

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

  function findLibraryMatches(minMatches = 1) {
    const terms = query
      .toLowerCase()
      .replace(/[^a-z0-9\s.-]/g, ' ')
      .split(/\s+/)
      .filter((term) => term.length >= 3);

    const scored = librarySeeds
      .map((seed) => {
        const haystack = [
          seed.seed,
          seed.title,
          seed.edition,
          seed.version,
          seed.spawn,
          seed.whyMatches,
          seed.notes,
          ...(seed.tags || []),
          ...(seed.features || []).flatMap((feature) => [feature.name, feature.type, feature.description, feature.coordinates])
        ]
          .join(' ')
          .toLowerCase();

        const exactSeedMatch = seed.seed && query.toLowerCase().includes(String(seed.seed).toLowerCase());
        const score = (exactSeedMatch ? 100 : 0) + terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
        return { seed, score };
      })
      .filter((item) => item.score >= minMatches)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.seed);

    return scored.slice(0, Number(count) || 5);
  }

  function scrollToResults() {
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  async function addToFavorites(seed: SeedResult) {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      await saveUserFavorite(user.uid, seed as Record<string, unknown>);
      const updated = await getUserFavorites(user.uid);
      setFavorites(updated as SeedResult[]);
      showToast('❤️ Added to favorites!');
    } catch {
      showToast('Failed to save favorite');
    }
  }

  async function removeFromFavorites(favoriteId: string) {
    if (!user) return;
    try {
      await removeUserFavorite(user.uid, favoriteId);
      const updated = await getUserFavorites(user.uid);
      setFavorites(updated as SeedResult[]);
      showToast('Removed from favorites');
    } catch {
      showToast('Failed to remove favorite');
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (query.trim().length < 8) {
      setError('Please describe the seed you want in a little more detail.');
      return;
    }

    setActivePageTab('finder');

    // Save search history for logged-in users
    if (user) {
      saveSearchHistory(user.uid, query).catch(() => {});
    }

    const searchKey = makeLocalSearchKey(query, edition, version, count);
    const savedSearch = loadSavedSearch(searchKey);
    if (savedSearch) {
      setResult({ ...savedSearch, cached: true, provider: 'saved-browser-library' });
      scrollToResults();
      return;
    }

    const exactLibraryMatches = findLibraryMatches(2);
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
      scrollToResults();
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
      scrollToResults();
    } catch (err) {
      const fallbackSeeds = findLibraryMatches(1);
      const message = err instanceof Error ? err.message : 'Something went wrong while searching.';

      if (fallbackSeeds.length) {
        setResult({
          query,
          generatedAt: new Date().toISOString(),
          disclaimer: 'Google AI is busy, so these matching seeds are shown from Other Seeds. Try AI search again in a few seconds.',
          seeds: fallbackSeeds,
          websitesUsed: normalizeSources(fallbackSeeds.flatMap((seed) => seed.sources || [])),
          rawGroundingSources: [],
          provider: 'other-seeds-fallback',
          cached: true
        });
        setError('');
        scrollToResults();
      } else {
        setError(message.includes('quota') || message.includes('busy') ? 'Google AI is busy right now. Try again in 30 seconds or open Other Seeds.' : message);
      }
    } finally {
      setLoading(false);
    }
  }


  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'SeedFinder AI — Minecraft Seed Finder',
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    description: 'Find real Minecraft seeds with AI, source websites, Java/Bedrock edition details, versions, and coordinates.',
    url: 'https://seedfinder-ai-website.vercel.app',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  };

  async function copySeed(seed?: string) {
    if (!seed) return;
    await navigator.clipboard.writeText(seed);
    setCopiedSeed(seed);
    showToast('📋 Seed copied!');
    setTimeout(() => setCopiedSeed(''), 1400);
  }

  return (
    <main className="shell">
      <AdsterraSocialBar />

      {/* Toast notification */}
      {toastMessage && (
        <div className="toast-notification">
          {toastMessage}
        </div>
      )}

      {/* Auth modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {/* Modern Nav */}
      <nav className="top-nav" aria-label="Main navigation">
        <a className="brand-lockup" href="#finder">
          <img src="/favicon.png" alt="SeedFinder AI Logo" style={{ width: 34, height: 34, borderRadius: 6, imageRendering: 'pixelated', border: '1px solid var(--mc-text-blue)' }} />
          <span>SeedFinder<span className="brand-ai">AI</span></span>
        </a>

        <button
          className="mobile-menu-btn"
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`} />
        </button>

        <div className={`nav-links ${mobileMenuOpen ? 'nav-open' : ''}`}>
          <button className={activePageTab === 'finder' ? 'active' : ''} type="button" onClick={openFinder}>
            <span className="nav-icon">🔍</span> AI Finder
          </button>
          <button className={activePageTab === 'daily' ? 'active' : ''} type="button" onClick={openDaily}>
            <span className="nav-icon">🎯</span> Daily
          </button>
          <a href="/feed">
            <span className="nav-icon">🌍</span> Feed
          </a>
          <button 
            type="button" 
            className="nav-create-post-btn"
            onClick={() => {
              if (!user) {
                showToast('🔑 Please sign in to create your first post!');
                setShowAuthModal(true);
              } else {
                window.location.href = '/feed?create=1';
              }
            }}
          >
            <span>➕</span> Create Post
          </button>
          <button type="button" onClick={openResults}>
            <span className="nav-icon">📊</span> Results
          </button>
          <button className={activePageTab === 'favorites' ? 'active' : ''} type="button" onClick={openFavorites}>
            <span className="nav-icon">❤️</span> Favorites
          </button>
          <button className={activePageTab === 'other' ? 'active' : ''} type="button" onClick={openOtherSeeds}>
            <span className="nav-icon">💾</span> Library
          </button>
          <a href="/seed-guides">
            <span className="nav-icon">📖</span> Guides
          </a>
          
          <div style={{ position: 'relative', margin: '4px 0', width: '100%', maxWidth: '220px' }}>
            <input 
              type="text" 
              placeholder="🔍 Search Users..." 
              style={{ background: '#1e1e1e', color: '#fff', border: '2px solid #555', padding: '6px 12px', fontSize: '0.9rem', fontFamily: 'var(--font-sans)', width: '100%', borderRadius: '4px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim() !== '') {
                  window.location.href = `/u/${(e.target as HTMLInputElement).value.trim()}`;
                }
              }}
            />
          </div>
        </div>

        <UserMenu onOpenAuth={() => setShowAuthModal(true)} />
      </nav>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="badge-row">
              <span className="badge">🌐 Web sourced</span>
              <span className="badge">🔐 Server-side API key</span>
              <span className="badge">⛏️ Java + Bedrock</span>
              <span className="badge badge-new">✨ Daily Seeds</span>
            </div>
            <h1>
              AI Minecraft <span>Seed Finder</span>
            </h1>
            <p>
              Find real Minecraft seeds with source links, Java/Bedrock details, version info, and coordinates.
              Sign in to save favorites, get daily picks, and track your search history.
            </p>
            <div className="hero-cta-row">
              <button className="hero-cta" type="button" onClick={openFinder}>
                Start Finding Seeds
              </button>
              <button
                className="hero-cta-post"
                type="button"
                onClick={() => {
                  if (!user) {
                    showToast('🔑 Please sign in to create your first post!');
                    setShowAuthModal(true);
                  } else {
                    window.location.href = '/feed?create=1';
                  }
                }}
              >
                ✨ Create Your First Post
              </button>
              {!user && (
                <button className="hero-cta-secondary" type="button" onClick={() => setShowAuthModal(true)}>
                  Sign Up Free
                </button>
              )}
            </div>
          </div>

          <div className="process-card" aria-label="How the seed finder works">
            <div className="process-card-head">
              <span>Live workflow</span>
              <strong>Verified seed search</strong>
            </div>
            <ol className="process-list">
              <li><span>1</span><div><strong>Describe</strong><p>Write the world style, edition, version, and structures.</p></div></li>
              <li><span>2</span><div><strong>AI Searches</strong><p>Gemini checks public web with Google Search grounding.</p></div></li>
              <li><span>3</span><div><strong>Save & Reuse</strong><p>Save seeds to favorites and access them anytime.</p></div></li>
            </ol>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="pro-stats" aria-label="Website features">
        <div><strong>🔍 AI Search</strong><span>Gemini grounded sources</span></div>
        <div><strong>✅ Verified</strong><span>404/dead sources filtered</span></div>
        <div><strong>🎯 Daily Picks</strong><span>Fresh seeds every day</span></div>
        <div><strong>❤️ Favorites</strong><span>Save with your account</span></div>
      </section>

      {/* Community "Create Your First Post" Showcase Banner */}
      <section className="community-create-banner" aria-label="Create your first post">
        <div className="community-banner-content">
          <div className="community-banner-left">
            <div className="community-badge-tag">
              <span className="live-dot" /> 🎮 MINECRAFT COMMUNITY HUB
            </div>
            <h2>Share Your World — <span>Create Your First Post!</span></h2>
            <p>
              Found an incredible seed, discovered a rare structure, or built an epic SMP base?
              Share your screenshots, coordinates, and adventure with fellow Minecrafters.
              Get likes, comments, and followers!
            </p>
            <div className="community-perks">
              <span>📸 Post Screenshots</span>
              <span>🗺️ Attach Coordinates</span>
              <span>🏷️ 100+ Minecraft Tags</span>
              <span>💬 Live Comments</span>
              <span>🔴 Follow Creators</span>
            </div>
          </div>
          <div className="community-banner-actions">
            <button
              className="btn-create-post-large"
              type="button"
              onClick={() => {
                if (!user) {
                  showToast('🔑 Please sign in to create your first post!');
                  setShowAuthModal(true);
                } else {
                  window.location.href = '/feed?create=1';
                }
              }}
            >
              ➕ CREATE YOUR FIRST POST
            </button>
            <a href="/feed" className="btn-browse-feed-large">
              🌍 Browse Community Feed
            </a>
          </div>
        </div>
      </section>

      {/* Daily Seeds Section */}
      {activePageTab === 'daily' && (
        <div id="daily-section">
          <DailySeeds onCopySeed={(seed) => showToast(`📋 Seed ${seed} copied!`)} />
        </div>
      )}

      {/* Favorites Section */}
      {activePageTab === 'favorites' && user && (
        <section className="favorites-section" id="favorites">
          <div className="seo-section-head">
            <span className="badge">❤️ My Favorites</span>
            <h2>Saved Seeds</h2>
            <p>Your personal collection of favorite Minecraft seeds. Sign in on any device to access them.</p>
          </div>

          {favorites.length > 0 ? (
            <div className="seed-grid">
              {favorites.map((seed, index) => (
                <article className="seed-card" key={`fav-${seed.id || index}`}>
                  <div className="seed-top">
                    <h3>{seed.title || `Seed ${index + 1}`}</h3>
                    <button
                      className="fav-remove-btn"
                      type="button"
                      onClick={() => seed.id && removeFromFavorites(seed.id)}
                      title="Remove from favorites"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="meta-row">
                    <span className="meta">{seed.edition || 'Edition unknown'}</span>
                    <span className="meta">{seed.version || 'Version unknown'}</span>
                  </div>
                  <div className="seed-box">
                    <div className="seed-value">{seed.seed || 'No seed'}</div>
                    <button className="copy-btn" type="button" onClick={() => copySeed(seed.seed)}>
                      {copiedSeed === seed.seed ? '✓' : '📋'}
                    </button>
                    {seed.seed && (
                      <a
                        href={`/feed?shareSeed=${encodeURIComponent(seed.seed)}&title=${encodeURIComponent(seed.title || 'Minecraft Favorite Seed')}&desc=${encodeURIComponent(seed.whyMatches || '')}`}
                        className="copy-btn"
                        style={{ textDecoration: 'none', background: '#1c2833', color: '#4dedf4', border: '1px solid var(--mc-text-blue)' }}
                        title="Share seed to Minecraft Hub Feed"
                      >
                        📤 Share
                      </a>
                    )}
                  </div>
                  {seed.whyMatches && <p className="fav-description">{seed.whyMatches}</p>}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-card">
              No favorites yet! Search for seeds and tap ❤️ to save them here.
            </div>
          )}
        </section>
      )}

      {/* AI Finder Section */}
      {activePageTab === 'finder' && (
        <>
      <div className="responsive-ad-stack top-ad">
        <AdsterraBannerAd size="728x90" label="Top advertisement" className="desktop-ad" />
        <AdsterraBannerAd size="320x50" label="Top advertisement" className="mobile-ad" />
      </div>

      <section className="search-panel" id="finder">
        <form className="form-card" onSubmit={submit}>
          <label htmlFor="query">Step 1 — Describe your Minecraft seed</label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Example: Java 1.21 village near spawn with trial chamber, cherry grove, and coordinates..."
          />

          {/* Quick 100+ Minecraft Tags */}
          <div style={{ margin: '8px 0 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--mc-text-yellow)', fontWeight: 'bold' }}>🔥 100+ Tags:</span>
              <span style={{ fontSize: '0.85rem', color: '#888' }}>Click any tag to auto-add to your seed search:</span>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '6px', 
              overflowX: 'auto', 
              paddingBottom: '8px', 
              scrollbarWidth: 'thin' 
            }}>
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const tagDesc = tag.replace(/([A-Z])/g, ' $1').trim();
                    setQuery((prev) => {
                      if (!prev.trim()) return `Minecraft seed with ${tagDesc}`;
                      if (prev.toLowerCase().includes(tagDesc.toLowerCase())) return prev;
                      return `${prev.trim()}, ${tagDesc}`;
                    });
                    showToast(`Added #${tag} to search!`);
                  }}
                  style={{
                    background: '#202020',
                    color: '#4dedf4',
                    border: '1px solid #3d3d3d',
                    padding: '4px 10px',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-pixel-read)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s'
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

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
              <small>Fewer results = faster + less API usage.</small>
            </div>
          </div>

          <div className="action-row">
            <button className="primary-btn" disabled={loading} type="submit">
              {loading ? <><span className="loader" /> Searching real seeds...</> : '⚡ Find Real Seeds'}
            </button>
            <button
              className="secondary-btn"
              disabled={loading}
              type="button"
              onClick={() => setQuery(examples[Math.floor(Math.random() * examples.length)])}
            >
              🎲 Try example
            </button>
            <span className="helper-text">For fastest results choose 5 seeds. If AI is busy, matching Other Seeds will appear instantly.</span>
          </div>
        </form>

        <div className="mobile-search-ad">
          <AdsterraBannerAd size="320x50" label="Mobile advertisement" />
        </div>

        <aside className="tips-card">
          <AdsterraBannerAd size="300x250" label="Sidebar advertisement" className="sidebar-ad" />

          <h2>💡 Tips for better results</h2>
          <ul>
            <li>Choose Java, Bedrock, or Any.</li>
            <li>Write the Minecraft version if you know it.</li>
            <li>Add must-have places like village, mansion, trial chamber, or island.</li>
            <li>Sign in to save favorites and access them from any device.</li>
            <li>Check Daily Picks for fresh seeds without using API.</li>
          </ul>
          <div className="status-strip">
            <strong>🟢 System Status</strong><br/>
            Gemini Google Search active. Seeds are cached for instant re-use. API keys auto-rotate when rate limited.
          </div>
        </aside>
      </section>

      <section className="results-wrap" id="results" ref={resultsRef} aria-live="polite">
        {error && <div className="error-card">⚠️ {error}</div>}

        {!error && !result && !loading && (
          <div className="empty-card">
            <div className="empty-illustration">🌎</div>
            <h3>Ready to explore</h3>
            <p>Results will appear here with seed numbers, edition, version, coordinates, and the website each seed came from.</p>
          </div>
        )}

        {result && (
          <div className="results-card">
            <div className="results-header">
              <div>
                <h2>🎉 Found seeds</h2>
                <div className="query-pill" title={result.query}>Query: {result.query}</div>
              </div>
              <div className="results-header-pills">
                <div className="query-pill">{result.cached ? '💾 Cached' : '🤖 AI Generated'}</div>
                <div className="query-pill">📅 {new Date(result.generatedAt).toLocaleString()}</div>
              </div>
            </div>

            {result.disclaimer && <p className="notice">{result.disclaimer}</p>}

            <AdsterraNativeBannerAd label="Sponsored Minecraft picks" className="results-ad" />

            <div className="seed-grid">
              {result.seeds?.map((seed, index) => (
                <article className="seed-card" key={`${seed.seed || 'seed'}-${index}`}>
                  <div className="seed-top">
                    <h3>{seed.title || `Seed ${index + 1}`}</h3>
                    <div className="seed-top-actions">
                      <button
                        className="fav-btn"
                        type="button"
                        onClick={() => addToFavorites(seed)}
                        title="Add to favorites"
                      >
                        ❤️
                      </button>
                      <span className="confidence">{seed.confidence || 'Check source'}</span>
                    </div>
                  </div>

                  <div className="meta-row">
                    <span className="meta">{seed.edition || 'Edition unknown'}</span>
                    <span className="meta">{seed.version || 'Version unknown'}</span>
                    {seed.spawn && <span className="meta">📍 {seed.spawn}</span>}
                  </div>

                  {!!seedTags(seed).length && (
                    <div className="tag-row">
                      {seedTags(seed).map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}
                    </div>
                  )}

                  <div className="seed-box">
                    <div className="seed-value">{seed.seed || 'Seed not shown by source'}</div>
                    <button className="copy-btn" type="button" onClick={() => copySeed(seed.seed)}>
                      {copiedSeed === seed.seed ? '✓ Copied' : '📋 Copy'}
                    </button>
                    {seed.seed && (
                      <a
                        href={`/feed?shareSeed=${encodeURIComponent(seed.seed)}&title=${encodeURIComponent(seed.title || 'Discovered Minecraft Seed')}&desc=${encodeURIComponent(seed.whyMatches || seed.spawn || '')}`}
                        className="copy-btn"
                        style={{ textDecoration: 'none', background: '#1c2833', color: '#4dedf4', border: '1px solid var(--mc-text-blue)' }}
                        title="Share this seed to Minecraft Hub Social Feed"
                      >
                        📤 Share to Feed
                      </a>
                    )}
                  </div>

                  {seed.whyMatches && (
                    <div className="card-section">
                      <h4>💡 Why this matches</h4>
                      <p>{seed.whyMatches}</p>
                    </div>
                  )}

                  {!!seed.features?.length && (
                    <div className="card-section">
                      <h4>📍 What is where</h4>
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
                      <h4>🔗 Seed source</h4>
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
                      <h4>📝 Notes</h4>
                      <p>{seed.notes}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {!!allSources.length && (
              <div className="all-sources">
                <h3>🌐 Websites used</h3>
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

        </>
      )}

      {activePageTab === 'other' && (
      <section className="seed-library-section seed-tabs-section" id="seed-library">
        <div className="seo-section-head">
          <span className="badge">💾 Seed library</span>
          <h2>Seed Library</h2>
          <p>
            Use the tabs below: Other Seeds shows seeds discovered from searches, and Built-in Seeds shows ready-to-copy starter picks.
            {globalLibraryReady ? ' Global database is connected, so other players can see newly found seeds too.' : ' Global database is not connected yet, so this browser saves local seeds only.'}
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
            🌍 Other Seeds <span>{aiSavedSeeds.length}</span>
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
          <AdsterraNativeBannerAd label="Other seeds advertisement" className="results-ad library-ad" />
        )}

        {activeLibrarySeeds.length ? (
          <div className="library-grid detailed-library-grid">
            {activeLibrarySeeds.slice(0, 12).map((seed, index) => (
              <Fragment key={`${activeSeedTab}-${seed.seed}-${index}`}>
                <article className="library-card detailed-library-card">
                  <div className="seed-top">
                    <h3>{seed.title || (activeSeedTab === 'saved' ? 'Saved seed' : 'Preloaded seed')}</h3>
                    <div className="seed-top-actions">
                      <button className="fav-btn" type="button" onClick={() => addToFavorites(seed)} title="Add to favorites">❤️</button>
                      <span className="confidence">{seed.confidence || (activeSeedTab === 'saved' ? 'Saved' : 'Preloaded')}</span>
                    </div>
                  </div>
                  <div className="seed-value small">{seed.seed}</div>
                  <div className="meta-row">
                    <span className="meta">{seed.edition}</span>
                    <span className="meta">{seed.version}</span>
                    {seed.spawn && <span className="meta">📍 {seed.spawn}</span>}
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

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="secondary-btn library-copy" style={{ flex: 1, margin: 0 }} type="button" onClick={() => copySeed(seed.seed)}>
                      {copiedSeed === seed.seed ? '✓ Copied' : '📋 Copy seed'}
                    </button>
                    {seed.seed && (
                      <a
                        href={`/feed?shareSeed=${encodeURIComponent(seed.seed)}&title=${encodeURIComponent(seed.title || 'Minecraft Library Seed')}&desc=${encodeURIComponent(seed.whyMatches || seed.spawn || '')}`}
                        className="secondary-btn"
                        style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', background: '#1c2833', color: '#4dedf4', border: '1px solid var(--mc-text-blue)' }}
                        title="Share this seed to Feed"
                      >
                        📤 Share
                      </a>
                    )}
                  </div>
                </article>

                {activeSeedTab === 'saved' && (index + 1) % 3 === 0 && (
                  <div className="library-inline-ad">
                    <AdsterraNativeBannerAd label="Other seeds in-feed advertisement" className="results-ad library-ad" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        ) : (
          <div className="empty-card library-empty">
            No other seeds yet. Run a search; verified results will appear in this tab automatically.
          </div>
        )}
      </section>

      )}

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
        <div className="footer-brand">
          <span>⛏️</span> SeedFinder AI
        </div>
        <p>Built with ❤️ for Minecraft players. Powered by Google Gemini AI.</p>
        <nav className="footer-links" aria-label="Footer links">
          <a href="#seed-library" onClick={(e) => { e.preventDefault(); openOtherSeeds(); }}>Library</a>
          <a href="/seed-guides">Guides</a>
          <a href="/about">About</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/contact">Contact</a>
        </nav>
        <small className="footer-copy">© {new Date().getFullYear()} SeedFinder AI. Not affiliated with Mojang or Microsoft.</small>
      </footer>
    </main>
  );
}

export default function Home() {
  return <HomeContent />;
}
