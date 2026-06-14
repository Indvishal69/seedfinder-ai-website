import type { Metadata } from 'next';
import Script from 'next/script';
import './styles.css';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seedfinder-ai-website.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'AI Minecraft Seed Finder',
    template: '%s | AI Minecraft Seed Finder'
  },
  description: 'Find real Minecraft seeds with Google AI, source websites, edition/version details, and coordinates.',
  keywords: ['Minecraft seed finder', 'Minecraft seeds', 'Java seeds', 'Bedrock seeds', 'Minecraft 1.21 seeds'],
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'AI Minecraft Seed Finder',
    description: 'Find real Minecraft seeds with Google AI and web sources.',
    url: baseUrl,
    siteName: 'AI Minecraft Seed Finder',
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'AI Minecraft Seed Finder',
    description: 'Find real Minecraft seeds with Google AI and web sources.'
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adSenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  return (
    <html lang="en">
      <body>
        {children}
        {adSenseClient ? (
          <Script
            id="adsense-script"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClient}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </body>
    </html>
  );
}
