import Link from 'next/link';

export const metadata = {
  title: 'About | AI Minecraft Seed Finder',
  description: 'About AI Minecraft Seed Finder.'
};

export default function AboutPage() {
  return (
    <main className="shell policy-shell">
      <section className="policy-card">
        <Link className="back-link" href="/">← Back to Seed Finder</Link>
        <h1>About AI Minecraft Seed Finder</h1>
        <p>
          AI Minecraft Seed Finder is a web tool for players who want to discover Minecraft seeds that match a specific
          idea, such as villages near spawn, ancient cities, survival islands, cherry groves, mountains, trial chambers,
          or speedrun-style worlds.
        </p>
        <p>
          The tool uses a server-side AI endpoint to research published web sources and return seed details, including
          edition, version, coordinates, features, and source websites when available.
        </p>
        <h2>Our goal</h2>
        <p>
          Help Minecraft players find useful seed ideas faster while clearly showing where the information came from.
        </p>
        <h2>Important note</h2>
        <p>
          Always verify seeds in-game because coordinates and terrain can vary by Minecraft edition and version.
        </p>
      </section>
    </main>
  );
}
