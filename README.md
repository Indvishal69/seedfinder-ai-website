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
