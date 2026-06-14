import type { MetadataRoute } from 'next';
import { seedGuides, siteUrl } from './seo/seedGuides';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ['', '/seed-guides', '/about', '/privacy', '/terms', '/contact'];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: now,
      changeFrequency: route === '' ? ('daily' as const) : ('monthly' as const),
      priority: route === '' ? 1 : route === '/seed-guides' ? 0.9 : 0.4
    })),
    ...seedGuides.map((guide) => ({
      url: `${siteUrl}/seed-guides/${guide.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.82
    }))
  ];
}
