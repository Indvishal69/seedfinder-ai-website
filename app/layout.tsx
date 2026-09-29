import type { Metadata } from 'next';
import Script from 'next/script';
import './styles.css';
import { AuthProvider } from './components/AuthContext';
import Navbar from './components/Navbar';
import RateSiteWidget from './components/RateSiteWidget';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seedfinder-ai-website.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'SeedFinder AI — Minecraft Seed Finder with AI',
    template: '%s | SeedFinder AI'
  },
  description: 'Find real Minecraft seeds with AI. Google-powered search, verified sources, Java/Bedrock support, daily picks, favorites, and coordinates. Free and open.',
  keywords: ['Minecraft seed finder', 'Minecraft seeds', 'Java seeds', 'Bedrock seeds', 'Minecraft 1.21 seeds', 'AI seed finder', 'daily minecraft seeds'],
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'SeedFinder AI — Minecraft Seed Finder',
    description: 'AI-powered Minecraft seed finder with verified sources, daily picks, favorites, and more.',
    url: baseUrl,
    siteName: 'SeedFinder AI',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SeedFinder AI — Minecraft Seed Finder',
    description: 'AI-powered Minecraft seed finder with verified sources, daily picks, favorites, and more.'
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon.png' },
    ],
    shortcut: '/favicon.ico',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adSenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Silkscreen:wght@400;700&family=VT323&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          <RateSiteWidget />
        </AuthProvider>
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
