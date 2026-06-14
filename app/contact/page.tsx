import Link from 'next/link';

export const metadata = {
  title: 'Contact | AI Minecraft Seed Finder',
  description: 'Contact page for AI Minecraft Seed Finder.'
};

export default function ContactPage() {
  return (
    <main className="shell policy-shell">
      <section className="policy-card">
        <Link className="back-link" href="/">← Back to Seed Finder</Link>
        <h1>Contact</h1>
        <p>
          For questions, feedback, takedown requests, privacy questions, or advertising issues, contact the site owner.
        </p>
        <div className="contact-box">
          <strong>Owner email:</strong>
          <span>replace-this-email@example.com</span>
        </div>
        <p className="notice">
          Before launching your production site, replace this email in <code>app/contact/page.tsx</code> with your real
          support email.
        </p>
      </section>
    </main>
  );
}
