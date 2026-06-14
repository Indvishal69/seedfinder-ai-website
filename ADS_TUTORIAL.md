# Step-by-step: Add ads and start earning

This project now supports Google AdSense ad spaces.

## Reality check

You cannot earn money just by adding random ad code. For Google AdSense you need:

1. A real published website.
2. Original/useful content, a working UI, and basic pages like About, Contact, Privacy Policy, and Terms.
3. Approval from Google AdSense.
4. Real visitors.
5. Policy-safe placement. Do not click your own ads and do not ask users to click ads.

## Files added/changed

- `app/components/AdUnit.tsx` - reusable AdSense ad component.
- `app/layout.tsx` - loads AdSense script safely.
- `app/page.tsx` - added top, sidebar, and results ad areas.
- `.env.example` - added AdSense environment variable names.
- `app/about`, `app/contact`, `app/privacy`, `app/terms` - basic pages that help with ad-network approval.

## Step 1: Deploy the website first

Deploy the project on Vercel with your Google AI key:

```env
GOOGLE_AI_API_KEY=your_google_ai_key
```

Your site should open correctly and show seed finder functionality. Also update `app/contact/page.tsx` with your real email before production launch.

## Step 2: Apply for AdSense

1. Go to `https://www.google.com/adsense/`.
2. Sign in with your Google account.
3. Add your Vercel custom domain or production URL.
4. Complete your payment/profile details.
5. Wait for AdSense approval.

Tip: A custom domain looks more professional than a default `vercel.app` URL.

## Step 3: Create ad units in AdSense

After approval:

1. Open AdSense dashboard.
2. Go to **Ads**.
3. Create display ad units for:
   - Top banner
   - Sidebar rectangle
   - Results banner
4. Copy your publisher/client ID and each ad slot ID.

Your publisher ID looks like:

```text
ca-pub-1234567890123456
```

Your slot IDs look like:

```text
1234567890
```

## Step 4: Add AdSense env vars in Vercel

Go to:

**Vercel Project > Settings > Environment Variables**

Add these variables:

```env
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADSENSE_TOP_SLOT=1234567890
NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT=1234567891
NEXT_PUBLIC_ADSENSE_RESULTS_SLOT=1234567892
```

These `NEXT_PUBLIC_` values are public by design. That is normal for AdSense.

## Step 5: Redeploy

After adding env vars:

1. Go to **Deployments** in Vercel.
2. Click **Redeploy**.
3. Open your site after deployment.

Ads may take some time to appear. If you use an ad blocker, disable it for testing.

## Step 6: Policy-safe earning tips

Do:

- Add helpful Minecraft content around the tool.
- Use clear ad labels.
- Keep ads away from buttons to avoid accidental clicks.
- Build traffic with SEO pages like “Best Minecraft 1.21 Java Seeds”.

Do not:

- Click your own ads.
- Ask friends/users to click ads.
- Place ads in a way that tricks users.
- Use copyrighted content without permission.

## Optional: other ad networks

If AdSense rejects the site, you can later add other networks like Adsterra, Monetag, or Ezoic. Their scripts are different, so replace or extend `AdUnit.tsx` based on their code.
