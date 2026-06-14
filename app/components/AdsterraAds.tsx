'use client';

import { useEffect, useRef } from 'react';

type BannerSize = '300x250' | '320x50' | '728x90';

const ADS = {
  '300x250': { key: 'be17d4f72a8d115fb5dd53e407d84fca', width: 300, height: 250 },
  '320x50': { key: '2a72b9e22875acd809211db676d513d7', width: 320, height: 50 },
  '728x90': { key: '062a26199a8ebab0c9f01d6d06e60b59', width: 728, height: 90 }
};

const NATIVE_KEY = 'b21f0bc7fe4546ce2792dd351e1cba84';
const SOCIAL_SRC = 'https://pl29740360.effectivecpmnetwork.com/da/24/7f/da247f3f837155a17e1a9b96a8e47935.js';

function makeSrcDoc(ad: { key: string; width: number; height: number }) {
  const end = '</scr' + 'ipt>';
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent;width:100%;height:100%}body{display:flex;align-items:center;justify-content:center}</style></head><body><script>atOptions={'key':'${ad.key}','format':'iframe','height':${ad.height},'width':${ad.width},'params':{}};${end}<script src="https://www.highperformanceformat.com/${ad.key}/invoke.js">${end}</body></html>`;
}

export function AdsterraBannerAd({
  size,
  label = 'Advertisement',
  className = ''
}: {
  size: BannerSize;
  label?: string;
  className?: string;
}) {
  const ad = ADS[size];

  return (
    <div className={`ad-unit adsterra-unit ${className}`} role="complementary" aria-label={label}>
      <span>{label}</span>
      <iframe
        className="adsterra-frame"
        title={`${label} ${size}`}
        srcDoc={makeSrcDoc(ad)}
        width={ad.width}
        height={ad.height}
        loading="lazy"
        scrolling="no"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

export function AdsterraNativeBannerAd({
  label = 'Sponsored',
  className = ''
}: {
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = `<div id="container-${NATIVE_KEY}"></div>`;

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = `https://pl29740361.effectivecpmnetwork.com/${NATIVE_KEY}/invoke.js`;
    ref.current.appendChild(script);

    return () => {
      if (ref.current) ref.current.innerHTML = '';
    };
  }, []);

  return (
    <div className={`ad-unit adsterra-native ${className}`} role="complementary" aria-label={label}>
      <span>{label}</span>
      <div ref={ref} className="native-ad-host" />
    </div>
  );
}

export function AdsterraSocialBar() {
  useEffect(() => {
    if (document.getElementById('adsterra-socialbar-script')) return;

    const script = document.createElement('script');
    script.id = 'adsterra-socialbar-script';
    script.src = SOCIAL_SRC;
    document.body.appendChild(script);
  }, []);

  return null;
}
