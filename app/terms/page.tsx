import Link from 'next/link';

export const metadata = {
  title: 'Terms | AI Minecraft Seed Finder',
  description: 'Terms of use for AI Minecraft Seed Finder.'
};

export default function TermsPage() {
  return (
    <main className="shell policy-shell">
      <section className="policy-card">
        <Link className="back-link" href="/">← Back to Seed Finder</Link>
        <h1>Terms of Use</h1>
        <p>Last updated: June 14, 2026</p>

        <h2>Use of the website</h2>
        <p>
          You may use this website to search for Minecraft seed information. Do not misuse the service, overload it,
          scrape it aggressively, or attempt to access server secrets.
        </p>

        <h2>Seed accuracy</h2>
        <p>
          Minecraft world generation can change between editions and versions. Results may be incomplete or outdated.
          Always verify seeds in the exact Minecraft edition and version listed by the source website.
        </p>

        <h2>Third-party sources</h2>
        <p>
          Results may include links to third-party websites. We are not responsible for the content, accuracy, or policies
          of those external websites.
        </p>

        <h2>Ads</h2>
        <p>
          Ads may be shown on this website. Do not click ads fraudulently or encourage invalid traffic.
        </p>

        <h2>No official affiliation</h2>
        <p>
          This website is not affiliated with Mojang, Microsoft, Minecraft, Google, or any listed seed source website.
        </p>
      </section>
    </main>
  );
}
