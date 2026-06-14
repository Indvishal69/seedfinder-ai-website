# AI Minecraft Seed Finder

A Vercel-ready Next.js website that uses Google AI on the server to find real Minecraft seeds from the web, then displays:

- Seed number/string
- Minecraft edition: Java / Bedrock / Both
- Version information
- Spawn details
- Structures, biomes, and coordinates
- Source websites used for each seed
- A combined "Websites used" list

## Important: API key safety

Do **not** put your Google AI API key in frontend code. This project reads the key only on the server from an environment variable:

```bash
GOOGLE_AI_API_KEY=your_key_here
```

`.env.local` is already ignored by Git, so local keys do not get committed.

## Local setup

```bash
npm install
cp .env.example .env.local
# Open .env.local and paste your Google AI Studio key
npm run dev
```

Then open `http://localhost:3000`.

## Deploy on Vercel

1. Upload/import this project to Vercel.
2. Go to **Project Settings > Environment Variables**.
3. Add:
   - Name: `GOOGLE_AI_API_KEY`
   - Value: your Google AI Studio API key
4. Redeploy.

Optional environment variable:

```bash
GEMINI_MODEL=gemini-3.5-flash
```

Use a model that supports Google Search grounding. The API route tries search-enabled Gemini models and returns an error instead of guessing if web search grounding is unavailable.

## How it works

- The browser sends your seed request to `/api/find-seeds`.
- The API route runs server-side only.
- The server calls Google AI with Google Search grounding enabled.
- The response is converted into JSON and rendered as seed cards.

## Notes

Minecraft world generation can change between versions. Always verify a seed in the exact Minecraft edition/version shown by the source website.

## Multiple Google AI keys / quota failover

The API route supports multiple legitimate Gemini API keys for failover:

```env
GOOGLE_AI_API_KEYS=key_1,key_2,key_3
```

or:

```env
GOOGLE_AI_API_KEY=primary_key
GOOGLE_AI_API_KEY_2=second_key
GOOGLE_AI_API_KEY_3=third_key
```

Important: do not use multiple keys/accounts to bypass provider limits. Keys from the same Google Cloud / AI Studio project usually share the same quota. For public traffic, enable billing or request higher quota.

The route also includes a small 6-hour in-memory cache for identical searches to reduce repeated API calls.

## Local LLM note

A local LLM cannot run inside a normal Vercel serverless project. You can run Ollama on your own PC/VPS and expose a secure API endpoint, but that requires the machine to stay online and it still needs a search API for live web results.

## Current AI mode

The live app uses Gemini API keys with Google Search grounding only. Serper and Groq are not used by the active seed search route.

Supported Gemini key variables:

```env
GOOGLE_AI_API_KEY=first_key
GOOGLE_AI_API_KEY_2=second_key
```

or:

```env
GOOGLE_AI_API_KEYS=key_1,key_2
```

The homepage also includes a browser-based seed library. Preloaded seeds are shown by default, and verified AI results are saved in the visitor's browser so repeated searches can be returned without another API call. For global saved seeds across all users, add a database such as Vercel KV, Upstash Redis, or Supabase.

## Global saved seed library

The site supports a global saved seed database with Upstash Redis. When Gemini returns verified seeds, the server saves:

- the full search result for repeated same searches
- each seed card in the global seed library

Add these Vercel environment variables:

```env
UPSTASH_REDIS_REST_URL=https://your-upstash-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
```

If these variables are missing, the site still works and uses the visitor's browser storage only.

The seed library section also includes an Adsterra native ad placement.

## JSON repair + separate saved section

If Gemini returns malformed JSON, the API route now tries an automatic Gemini JSON repair pass without Google Search before failing. The homepage seed library is split into two sections:

- Built-in preloaded seeds
- AI saved seeds, with its own Adsterra ad placement

## Seed tags + stronger JSON stability

Seed cards now support short tags such as `Village`, `Java`, `1.21`, and `Trial Chamber`.

To reduce malformed JSON errors from Gemini Search grounding, the route now uses a safer two-step flow:

1. Gemini + Google Search returns compact research notes.
2. Gemini without search converts the notes into strict JSON using `responseMimeType: application/json`.

This avoids most errors like `Bad control character in string literal` and `Expected ':' after property name`.

## Saved seeds tab

The homepage seed library is now a tabbed section with:

- **AI Saved Seeds** tab
- **Built-in Seeds** tab

The Saved Seeds tab includes its own ad placement and is linked from the footer.

## Saved tab in-feed ads + seed details

The Saved Seeds tab now shows full seed details on each card:

- Why this seed
- What is where / coordinates
- Source links and evidence
- Notes
- Tags

It also adds in-feed Adsterra native ads inside the Saved Seeds tab after every 3 saved seed cards.

## Professional polish + auto-scroll

The homepage now includes a sticky professional navigation bar, feature stats, and smooth auto-scroll to the results area as soon as seeds are returned from AI, cache, or the saved library.
