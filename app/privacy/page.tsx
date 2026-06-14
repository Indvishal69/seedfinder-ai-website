import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | AI Minecraft Seed Finder',
  description: 'Privacy policy for AI Minecraft Seed Finder.'
};

export default function PrivacyPage() {
  return (
    <main className="shell policy-shell">
      <section className="policy-card">
        <Link className="back-link" href="/">← Back to Seed Finder</Link>
        <h1>Privacy Policy</h1>
        <p>Last updated: June 14, 2026</p>

        <h2>What this site does</h2>
        <p>
          AI Minecraft Seed Finder lets users describe Minecraft seeds they want and sends that request
          to a server-side AI endpoint to return seed suggestions and web source links.
        </p>

        <h2>Information we process</h2>
        <ul>
          <li>The seed request text you submit.</li>
          <li>Basic technical data that hosting providers normally process, such as IP address, browser, and request logs.</li>
          <li>Advertising cookies or identifiers if ads are enabled and loaded by an advertising provider.</li>
        </ul>

        <h2>Google AI</h2>
        <p>
          User prompts are sent from our server to Google AI to generate seed research results. Do not type private
          personal information into the prompt box.
        </p>

        <h2>Advertising</h2>
        <p>
          This website may use Google AdSense or another advertising provider. Ad providers may use cookies and similar
          technologies to show and measure ads. You can manage ad personalization in your Google account settings.
        </p>

        <h2>Data sharing</h2>
        <p>
          We do not sell your personal information. Data may be processed by service providers used to run the website,
          such as hosting, AI, analytics, and advertising providers.
        </p>

        <h2>Contact</h2>
        <p>
          For privacy questions, update the contact email on the Contact page before launching your production site.
        </p>
      </section>
    </main>
  );
}
