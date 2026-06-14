import type { Metadata } from 'next';
import Link from 'next/link';
import { AdsterraBannerAd, AdsterraNativeBannerAd, AdsterraSocialBar } from '../components/AdsterraAds';
import { seedGuides, siteUrl } from '../seo/seedGuides';

export const metadata: Metadata = {
  title: 'Minecraft Seed Guides | AI Minecraft Seed Finder',
  description:
    'Browse Minecraft seed guides for Java, Bedrock, villages, trial chambers, ancient cities, survival islands, cherry groves, and more.',
  alternates: {
    canonical: `${siteUrl}/seed-guides`
  },
  openGraph: {
    title: 'Minecraft Seed Guides',
    description: 'Find useful Minecraft seed search guides and prompts for AI Minecraft Seed Finder.',
    url: `${siteUrl}/seed-guides`,
    type: 'website'
  }
};

export default function SeedGuidesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Minecraft Seed Guides',
    description: metadata.description,
    url: `${siteUrl}/seed-guides`,
    hasPart: seedGuides.map((guide) => ({
      '@type': 'Article',
      headline: guide.title,
      url: `${siteUrl}/seed-guides/${guide.slug}`
    }))
  };

  return (
    <main className="shell guide-shell">
      <AdsterraSocialBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="guide-hero">
        <Link className="back-link" href="/">← Open AI Seed Finder</Link>
        <h1>Minecraft Seed Guides</h1>
        <p>
          Use these guides to search for real Minecraft seeds with source websites, edition/version details,
          and coordinates. Pick a topic, copy a prompt idea, and verify results in-game.
        </p>
      </section>

      <div className="responsive-ad-stack top-ad">
        <AdsterraBannerAd size="728x90" label="Advertisement" className="desktop-ad" />
        <AdsterraBannerAd size="320x50" label="Advertisement" className="mobile-ad" />
      </div>

      <section className="guide-grid">
        {seedGuides.map((guide) => (
          <Link className="guide-card" href={`/seed-guides/${guide.slug}`} key={guide.slug}>
            <span className="guide-emoji">{guide.heroEmoji}</span>
            <span className="meta-row guide-meta">
              <span className="meta">{guide.edition}</span>
              <span className="meta">{guide.version}</span>
            </span>
            <h2>{guide.shortTitle}</h2>
            <p>{guide.description}</p>
          </Link>
        ))}
      </section>

      <AdsterraNativeBannerAd label="Sponsored" className="results-ad" />
    </main>
  );
}
