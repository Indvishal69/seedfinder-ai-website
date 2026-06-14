export type SeedGuide = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  keyword: string;
  edition: string;
  version: string;
  heroEmoji: string;
  intro: string[];
  searchPrompts: string[];
  features: string[];
  tips: string[];
  faqs: Array<{ question: string; answer: string }>;
};

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://seedfinder-ai-website.vercel.app').replace(/\/$/, '');

export const seedGuides: SeedGuide[] = [
  {
    slug: 'best-minecraft-1-21-seeds',
    title: 'Best Minecraft 1.21 Seeds to Search With AI',
    shortTitle: 'Minecraft 1.21 Seeds',
    description:
      'Find Minecraft 1.21 seeds with villages, trial chambers, ancient cities, mountains, cherry groves, and strong survival starts.',
    keyword: 'best Minecraft 1.21 seeds',
    edition: 'Java and Bedrock',
    version: '1.21+',
    heroEmoji: '⛏️',
    intro: [
      'Minecraft 1.21 added new reasons to look for fresh seeds, especially if you want trial chambers, updated structures, and strong survival starts near spawn.',
      'Use this guide as a search plan: paste one of the prompts into the AI seed finder, then check the source links, edition, version, and coordinates before starting a long-term world.'
    ],
    searchPrompts: [
      'Minecraft 1.21 Java seed with village near spawn, trial chamber nearby, and a mountain valley base location',
      'Minecraft 1.21 Bedrock seed with trial chamber, village, ruined portal, and cherry grove within 1000 blocks',
      'Best Minecraft 1.21 survival seed with easy food, blacksmith village, cave access, and strong early-game loot',
      'Minecraft 1.21 seed with ancient city, trial chamber, and snowy mountains close to spawn'
    ],
    features: [
      'Trial chamber coordinates and distance from spawn',
      'Village type, blacksmith availability, and nearby food sources',
      'Biome variety for building: cherry grove, plains, mountains, desert, or jungle',
      'Fast access to caves, mineshafts, ancient cities, and stronghold routes'
    ],
    tips: [
      'Use the exact edition and version shown by the source; Java and Bedrock can generate differently.',
      'Check coordinates in a copy of the world before inviting friends or starting a server.',
      'If the seed is from an older 1.21 snapshot, verify it again in the latest stable release.'
    ],
    faqs: [
      {
        question: 'Do Minecraft 1.21 seeds work on both Java and Bedrock?',
        answer:
          'Some terrain may match across editions, but structures and exact coordinates can differ. Always check whether the source lists Java, Bedrock, or both.'
      },
      {
        question: 'What is the best 1.21 structure to search for?',
        answer:
          'Trial chambers are one of the best 1.21 targets because they provide combat, loot, and exploration goals near spawn.'
      }
    ]
  },
  {
    slug: 'minecraft-java-village-seeds',
    title: 'Minecraft Java Village Seeds Near Spawn',
    shortTitle: 'Java Village Seeds',
    description:
      'Search for Minecraft Java village seeds with blacksmiths, ruined portals, strongholds, farms, and survival-friendly spawn locations.',
    keyword: 'Minecraft Java village seeds',
    edition: 'Java Edition',
    version: '1.20 - 1.21+',
    heroEmoji: '🏘️',
    intro: [
      'Village seeds are perfect for survival because they give food, beds, trading, iron golems, and a safe place to begin the world.',
      'For Java Edition, always ask for the exact version. Structure placement can change between major updates, so source links and coordinates matter.'
    ],
    searchPrompts: [
      'Minecraft Java 1.21 village seed near spawn with blacksmith, ruined portal, and trial chamber coordinates',
      'Java seed with plains village at spawn, stronghold nearby, and good starter caves',
      'Minecraft Java village seed with cherry grove and mountain base location close to spawn',
      'Java 1.20 or 1.21 seed with double village, desert temple, and easy nether access'
    ],
    features: [
      'Village distance from spawn',
      'Blacksmith chest loot and nearby ruined portals',
      'Trading potential: librarians, farmers, armorers, and toolsmiths',
      'Nearby structures such as strongholds, mineshafts, or trial chambers'
    ],
    tips: [
      'A seed with two villages close together is usually better for trading halls and farms.',
      'Look for plains or savanna villages if you want flat building space.',
      'Ask the AI finder to include coordinates for every listed structure.'
    ],
    faqs: [
      {
        question: 'Why are village seeds popular?',
        answer:
          'They provide food, beds, protection, trading, and early resources, making the first Minecraft days much easier.'
      },
      {
        question: 'Can a village seed have a stronghold nearby?',
        answer:
          'Yes. Some published seeds include villages close to strongholds or stronghold routes, but you should verify the coordinates in-game.'
      }
    ]
  },
  {
    slug: 'minecraft-bedrock-survival-island-seeds',
    title: 'Minecraft Bedrock Survival Island Seeds',
    shortTitle: 'Bedrock Survival Islands',
    description:
      'Find Bedrock survival island seeds with shipwrecks, ocean monuments, villages, buried treasure, and challenging island starts.',
    keyword: 'Minecraft Bedrock survival island seeds',
    edition: 'Bedrock Edition',
    version: '1.20 - 1.21+',
    heroEmoji: '🏝️',
    intro: [
      'Survival island seeds are great for players who want a slower, more challenging start with limited resources and ocean exploration.',
      'Bedrock island seeds can include shipwrecks, ocean ruins, buried treasure, monuments, and nearby mainland routes if you search with the right details.'
    ],
    searchPrompts: [
      'Minecraft Bedrock 1.21 survival island seed with shipwreck, buried treasure, and village not too far away',
      'Bedrock survival island seed with ocean monument, mushroom island, and ruined portal coordinates',
      'Minecraft Bedrock island spawn seed with trees, nearby coral reef, and easy starter loot',
      'Bedrock 1.20 or 1.21 seed for hardcore-style island survival with source links and coordinates'
    ],
    features: [
      'Trees or nearby wood source',
      'Shipwreck and buried treasure coordinates',
      'Distance to mainland, village, or mushroom island',
      'Ocean monument and ocean ruin locations'
    ],
    tips: [
      'Make sure the seed is specifically marked Bedrock if you want reliable structure placement.',
      'Check whether the island has at least one tree or an accessible shipwreck for wood.',
      'Use chunkbase-style verification only after confirming the edition and version.'
    ],
    faqs: [
      {
        question: 'Are survival island seeds good for beginners?',
        answer:
          'They can be challenging. Beginners should choose island seeds with trees, shipwrecks, or a village nearby.'
      },
      {
        question: 'Do Java island seeds work on Bedrock?',
        answer:
          'Not reliably for structures. Terrain may sometimes look similar, but Bedrock-specific sources are better for island challenges.'
      }
    ]
  },
  {
    slug: 'ancient-city-seeds',
    title: 'Minecraft Ancient City Seeds and Deep Dark Starts',
    shortTitle: 'Ancient City Seeds',
    description:
      'Search for ancient city seeds with deep dark biomes, mountain spawn areas, nearby villages, and Warden-ready exploration routes.',
    keyword: 'Minecraft ancient city seeds',
    edition: 'Java and Bedrock',
    version: '1.19+',
    heroEmoji: '🌌',
    intro: [
      'Ancient city seeds are useful for players who want deep dark exploration, rare loot, and a dangerous Warden challenge early in the world.',
      'The best ancient city seeds usually include a safe spawn area, a village or mountain base, and exact coordinates for the deep dark entrance.'
    ],
    searchPrompts: [
      'Minecraft Java 1.21 seed with ancient city under spawn, village nearby, and mountain biome coordinates',
      'Minecraft Bedrock ancient city seed near spawn with deep dark, ruined portal, and safe starter village',
      'Ancient city seed with cherry grove mountains above, mineshaft nearby, and exact coordinates',
      'Minecraft seed with multiple ancient cities within 1500 blocks and source websites listed'
    ],
    features: [
      'Ancient city coordinates and Y-level hints',
      'Safe surface base location above the deep dark',
      'Nearby village, mineshaft, or ruined portal',
      'Mountain, cherry grove, or snowy biome for scenic builds'
    ],
    tips: [
      'Bring wool to reduce vibrations before entering an ancient city.',
      'Ask for the Y coordinate or cave entrance if the source provides it.',
      'Verify the same version because underground structure placement is update-sensitive.'
    ],
    faqs: [
      {
        question: 'What version added ancient cities?',
        answer:
          'Ancient cities were introduced in The Wild Update era. For best results, search seeds for 1.19 or newer versions.'
      },
      {
        question: 'Can ancient cities spawn under mountains?',
        answer:
          'Yes, many deep dark and ancient city seeds are found under large mountain ranges.'
      }
    ]
  },
  {
    slug: 'trial-chamber-seeds',
    title: 'Minecraft Trial Chamber Seeds for 1.21',
    shortTitle: 'Trial Chamber Seeds',
    description:
      'Find Minecraft 1.21 trial chamber seeds with nearby villages, caves, mountains, starter loot, and coordinates for quick exploration.',
    keyword: 'Minecraft trial chamber seeds',
    edition: 'Java and Bedrock',
    version: '1.21+',
    heroEmoji: '🧱',
    intro: [
      'Trial chambers are one of the main reasons to search for Minecraft 1.21 seeds. A good trial chamber seed gives you action and loot without traveling thousands of blocks.',
      'Use the prompts below to find published seeds that list the chamber coordinates, edition, version, and nearby survival resources.'
    ],
    searchPrompts: [
      'Minecraft 1.21 Java trial chamber seed near spawn with village and ruined portal coordinates',
      'Minecraft 1.21 Bedrock seed with trial chamber under spawn and starter village nearby',
      'Trial chamber seed with mountain base, cave entrance, and exact X Y Z coordinates',
      'Best Minecraft 1.21 trial chamber seeds with source links and what is near spawn'
    ],
    features: [
      'Trial chamber X/Y/Z coordinates',
      'Surface entrance or cave route if available',
      'Nearby village, ruined portal, or mineshaft',
      'Biome around spawn for building and resources'
    ],
    tips: [
      'Ask for “1.21 stable release” if you do not want snapshot-only results.',
      'Bring food, blocks, shield, and spare tools before entering a chamber.',
      'Prefer seeds where the source gives coordinates instead of just screenshots.'
    ],
    faqs: [
      {
        question: 'What Minecraft version has trial chambers?',
        answer:
          'Trial chambers are associated with Minecraft 1.21. Search for 1.21-specific seeds for best reliability.'
      },
      {
        question: 'Can trial chambers be near spawn?',
        answer:
          'Yes, some published seeds include trial chambers near spawn, under villages, or near cave systems.'
      }
    ]
  },
  {
    slug: 'cherry-grove-seeds',
    title: 'Minecraft Cherry Grove Seeds for Beautiful Builds',
    shortTitle: 'Cherry Grove Seeds',
    description:
      'Search for cherry grove seeds with mountains, villages, lakes, valleys, ancient cities, and scenic building locations.',
    keyword: 'Minecraft cherry grove seeds',
    edition: 'Java and Bedrock',
    version: '1.20+',
    heroEmoji: '🌸',
    intro: [
      'Cherry grove seeds are ideal for builders who want pink trees, mountain valleys, lakes, and cozy base locations near spawn.',
      'The best cherry grove seeds combine scenery with survival usefulness: nearby villages, caves, ancient cities, or trial chambers.'
    ],
    searchPrompts: [
      'Minecraft 1.21 cherry grove seed with village near spawn, mountain valley, and lake base location',
      'Java cherry grove seed with ancient city under mountains and exact coordinates',
      'Bedrock cherry grove seed near spawn with village, ruined portal, and scenic cliff views',
      'Minecraft seed with huge cherry grove biome, snowy mountains, and survival-friendly structures'
    ],
    features: [
      'Cherry grove distance from spawn',
      'Nearby valley, lake, or mountain ring for building',
      'Village and cave access',
      'Ancient city or trial chamber below mountain areas'
    ],
    tips: [
      'Ask for screenshots/source links if you want a very specific scenic look.',
      'Use Java/Bedrock filters because biome boundaries and structures may differ.',
      'Look for a nearby plains village if you want easy trading and farms.'
    ],
    faqs: [
      {
        question: 'What version added cherry grove biomes?',
        answer:
          'Cherry groves were added in Minecraft 1.20. Search for 1.20 or newer seeds.'
      },
      {
        question: 'Are cherry grove seeds good for survival?',
        answer:
          'Yes, especially when the cherry grove is near a village, cave, or mountain resource area.'
      }
    ]
  },
  {
    slug: 'woodland-mansion-seeds',
    title: 'Minecraft Woodland Mansion Seeds Near Spawn',
    shortTitle: 'Woodland Mansion Seeds',
    description:
      'Find woodland mansion seeds with villages, dark forests, ruined portals, and coordinates for Java or Bedrock mansion exploration.',
    keyword: 'Minecraft woodland mansion seeds',
    edition: 'Java and Bedrock',
    version: '1.20 - 1.21+',
    heroEmoji: '🏚️',
    intro: [
      'Woodland mansion seeds are exciting because mansions are rare, dangerous, and packed with exploration potential.',
      'A strong mansion seed should include the mansion coordinates, nearby safe resources, and a route from spawn.'
    ],
    searchPrompts: [
      'Minecraft Java 1.21 woodland mansion seed near spawn with village and ruined portal coordinates',
      'Minecraft Bedrock mansion seed with village at spawn and dark forest nearby',
      'Woodland mansion seed with trial chamber nearby and exact Java coordinates',
      'Minecraft seed with mansion, pillager outpost, and strong survival start near spawn'
    ],
    features: [
      'Mansion distance and exact coordinates',
      'Nearby village for gear and trading',
      'Dark forest biome size and safe base location',
      'Additional structures like outposts, portals, or trial chambers'
    ],
    tips: [
      'Bring good armor, food, and a shield before entering a mansion.',
      'Check whether the source says Java or Bedrock; mansion locations can differ.',
      'A mansion close to a village is usually easier to prepare for.'
    ],
    faqs: [
      {
        question: 'Are woodland mansions rare?',
        answer:
          'Yes. That is why exact source links and coordinates are important when choosing a mansion seed.'
      },
      {
        question: 'Can a mansion spawn near a village?',
        answer:
          'Yes, some published seeds have mansions close to villages, which makes survival preparation much easier.'
      }
    ]
  },
  {
    slug: 'speedrun-seeds',
    title: 'Minecraft Speedrun Seeds With Villages and Portals',
    shortTitle: 'Speedrun Seeds',
    description:
      'Search for Minecraft speedrun-style seeds with villages, ruined portals, nether access, blaze routes, and stronghold coordinates.',
    keyword: 'Minecraft speedrun seeds',
    edition: 'Java and Bedrock',
    version: 'Version-specific',
    heroEmoji: '⚡',
    intro: [
      'Speedrun-style seeds focus on fast resources, quick Nether access, and a realistic path to the stronghold or End portal.',
      'For fair runs, use the rules of your speedrun category. For casual practice, published seeds with villages and ruined portals are great for learning routes.'
    ],
    searchPrompts: [
      'Minecraft Java speedrun seed with village, ruined portal, fortress route, and stronghold coordinates',
      'Minecraft Bedrock speedrun seed with blacksmith village, lava pool, and stronghold nearby',
      'Practice speedrun seed with ruined portal at spawn and exact nether fortress route',
      'Minecraft 1.21 speedrun-style seed with village, portal, blaze access, and source links'
    ],
    features: [
      'Village and blacksmith coordinates',
      'Ruined portal or lava pool near spawn',
      'Nether fortress or bastion route information',
      'Stronghold coordinates or travel direction'
    ],
    tips: [
      'Always match the seed to the exact Minecraft version used by the source.',
      'Practice routing in a copy before trying a timed run.',
      'If the source does not include a fortress or stronghold route, ask the finder for close alternatives.'
    ],
    faqs: [
      {
        question: 'What makes a seed good for speedrunning?',
        answer:
          'Fast food, iron, lava or ruined portal access, Nether route, blaze rods, and a reachable stronghold all matter.'
      },
      {
        question: 'Do speedrun seeds work after updates?',
        answer:
          'They may change. Speedrun seeds are very version-sensitive, so always use the exact version shown by the source.'
      }
    ]
  }
];

export function getSeedGuide(slug: string) {
  return seedGuides.find((guide) => guide.slug === slug);
}
