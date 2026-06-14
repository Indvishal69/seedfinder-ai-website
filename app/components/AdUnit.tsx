'use client';

import { useEffect, useMemo } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdUnitProps = {
  slot?: string;
  label?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
};

const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

function isConfigured(slot?: string) {
  return Boolean(clientId && slot && /^ca-pub-/.test(clientId));
}

export default function AdUnit({ slot, label = 'Advertisement', format = 'auto', className = '' }: AdUnitProps) {
  const configured = isConfigured(slot);

  const style = useMemo(() => {
    if (format === 'horizontal') return { display: 'block', minHeight: 90 };
    if (format === 'vertical') return { display: 'block', minHeight: 280 };
    if (format === 'rectangle') return { display: 'block', minHeight: 250 };
    return { display: 'block', minHeight: 120 };
  }, [format]);

  useEffect(() => {
    if (!configured) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (error) {
      // Ad blockers or preview sandbox can block AdSense. The site should still work.
      console.warn('AdSense could not load:', error);
    }
  }, [configured, slot]);

  if (!configured) {
    return (
      <div className={`ad-unit ad-placeholder ${className}`} role="complementary" aria-label={label}>
        <span>{label}</span>
        <strong>Ad space</strong>
        <small>Add AdSense env vars on Vercel to activate this area.</small>
      </div>
    );
  }

  return (
    <div className={`ad-unit ${className}`} role="complementary" aria-label={label}>
      <span>{label}</span>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format === 'rectangle' ? 'auto' : format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
