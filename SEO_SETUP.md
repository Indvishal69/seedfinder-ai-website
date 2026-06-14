# SEO + Google Search Console setup

SEO pages, `sitemap.xml`, and `robots.txt` have been added.

## New SEO URLs

- `/seed-guides`
- `/seed-guides/best-minecraft-1-21-seeds`
- `/seed-guides/minecraft-java-village-seeds`
- `/seed-guides/minecraft-bedrock-survival-island-seeds`
- `/seed-guides/ancient-city-seeds`
- `/seed-guides/trial-chamber-seeds`
- `/seed-guides/cherry-grove-seeds`
- `/seed-guides/woodland-mansion-seeds`
- `/seed-guides/speedrun-seeds`
- `/sitemap.xml`
- `/robots.txt`

## Vercel environment variable

Add this in Vercel Project Settings > Environment Variables:

```env
NEXT_PUBLIC_SITE_URL=https://seedfinder-ai-website.vercel.app
```

If you add a custom domain later, change it to your custom domain.

## Google Search Console

1. Open https://search.google.com/search-console
2. Add your website as a URL prefix property.
3. Verify with HTML tag.
4. Copy only the content value from Google's meta tag.
5. Add it in Vercel:

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_verification_code_here
```

6. Redeploy.
7. In Search Console, submit sitemap:

```text
https://seedfinder-ai-website.vercel.app/sitemap.xml
```

## After publishing

- Share guide pages on social media.
- Add more original seed guides over time.
- Do not copy other websites' seed lists word-for-word.
