import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdsterraBannerAd, AdsterraNativeBannerAd, AdsterraSocialBar } from '../../components/AdsterraAds';
import { getSeedGuide, seedGuides, siteUrl } from '../../seo/seedGuides';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return seedGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getSeedGuide(slug);

  if (!guide) {
    return {
      title: 'Minecraft Seed Guide Not Found'
    };
  }

  return {
    title: `${guide.shortTitle} | AI Minecraft Seed Finder`,
    description: guide.description,
    keywords: [guide.keyword, 'Minecraft seeds', 'Minecraft seed finder', guide.edition, guide.version],
    alternates: {
      canonical: `${siteUrl}/seed-guides/${guide.slug}`
    },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `${siteUrl}/seed-guides/${guide.slug}`,
      type: 'article'
    },
    twitter: {
      card: 'summary',
      title: guide.title,
      description: guide.description
    }
  };
}

export default async function SeedGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getSeedGuide(slug);

  if (!guide) notFound();

  const related = seedGuides.filter((item) => item.slug !== guide.slug).slice(0, 4);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    url: `${siteUrl}/seed-guides/${guide.slug}`,
    mainEntityOfPage: `${siteUrl}/seed-guides/${guide.slug}`,
    about: guide.keyword,
    dateModified: '2026-06-14',
    datePublished: '2026-06-14',
    author: {
      '@type': 'Organization',
      name: 'AI Minecraft Seed Finder'
    },
    mainEntity: guide.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return (
    <main className="shell guide-shell">
      <AdsterraSocialBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="guide-hero">
        <Link className="back-link" href="/seed-guides">← All seed guides</Link>
        <div className="guide-emoji large">{guide.heroEmoji}</div>
        <h1>{guide.title}</h1>
        <p>{guide.description}</p>
        <div className="meta-row guide-meta hero-tags">
          <span className="meta">Edition: {guide.edition}</span>
          <span className="meta">Version: {guide.version}</span>
          <span className="meta">Keyword: {guide.keyword}</span>
        </div>
      </section>

      <div className="responsive-ad-stack top-ad">
        <AdsterraBannerAd size="728x90" label="Advertisement" className="desktop-ad" />
        <AdsterraBannerAd size="320x50" label="Advertisement" className="mobile-ad" />
      </div>

      <div className="guide-layout">
        <article className="guide-article">
          {guide.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <section>
            <h2>Best AI search prompts</h2>
            <p>
              Copy one prompt idea, open the seed finder, and ask for real seed numbers with source links,
              Java/Bedrock edition, version, and coordinates.
            </p>
            <div className="prompt-list">
              {guide.searchPrompts.map((prompt, index) => (
                <div className="prompt-card" key={prompt}>
                  <strong>Prompt {index + 1}</strong>
                  <p>{prompt}</p>
                </div>
              ))}
            </div>
            <Link className="primary-btn guide-button" href="/#finder">
              Open AI Seed Finder
            </Link>
          </section>

          <section>
            <h2>What to check before using a seed</h2>
            <ul className="check-list">
              {guide.features.map((feature) => (
                <li key={feature}>✅ {feature}</li>
              ))}
            </ul>
          </section>

          <AdsterraNativeBannerAd label="Sponsored Minecraft picks" className="results-ad" />

          <section>
            <h2>Tips for better seed results</h2>
            <ul className="check-list">
              {guide.tips.map((tip) => (
                <li key={tip}>💡 {tip}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>FAQ</h2>
            <div className="faq-list">
              {guide.faqs.map((faq) => (
                <div className="faq-item" key={faq.question}>
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </article>

        <aside className="guide-sidebar">
          <AdsterraBannerAd size="300x250" label="Advertisement" className="sidebar-ad" />
          <div className="related-card">
            <h2>Related guides</h2>
            <ul>
              {related.map((item) => (
                <li key={item.slug}>
                  <Link href={`/seed-guides/${item.slug}`}>{item.heroEmoji} {item.shortTitle}</Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
