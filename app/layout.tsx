import type { Metadata } from 'next';
import Script from 'next/script';
import './styles.css';

export const metadata: Metadata = {
  title: 'AI Minecraft Seed Finder',
  description: 'Find real Minecraft seeds with Google AI and web sources.'
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
