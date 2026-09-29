// Comprehensive list of 120+ authentic Minecraft community, biome, structure, and gameplay tags

export type TagCategory = {
  name: string;
  icon: string;
  tags: string[];
};

export const MINECRAFT_TAG_CATEGORIES: TagCategory[] = [
  {
    name: "Featured & Community",
    icon: "🌟",
    tags: [
      "MinecraftHub",
      "MinecraftPost",
      "DailyMinecraft",
      "SMPHub",
      "SurvivalHub",
      "CreatorTools",
      "MinecraftCommunity",
      "JavaCommunity",
      "BedrockCommunity",
      "BuildersHub",
      "RedstoneEngineers",
      "MinecraftLife",
      "PixelArtShowcase",
      "SurvivalStories",
      "SeedShowcase",
      "MinecraftClips",
      "MinecraftMemes"
    ]
  },
  {
    name: "Biomes & Terrain",
    icon: "🌲",
    tags: [
      "CherryGrove",
      "MushroomIsland",
      "DeepDark",
      "LushCaves",
      "Badlands",
      "IceSpikes",
      "MangroveSwamp",
      "DripstoneCaves",
      "OldGrowthTaiga",
      "SavannaPlateau",
      "WarmOcean",
      "FrozenOcean",
      "BasaltDeltas",
      "CrimsonForest",
      "WarpedForest",
      "SoulSandValley",
      "MeadowBiome",
      "StonyPeaks",
      "SunflowerPlains",
      "BambooJungle",
      "ErodedBadlands",
      "WindsweptHills",
      "JaggedPeaks",
      "FrozenPeaks",
      "SparseJungle",
      "DarkForest",
      "WoodedBadlands",
      "SwampBiome",
      "DesertBiome",
      "PlainsBiome"
    ]
  },
  {
    name: "Structures & Dungeons",
    icon: "🏰",
    tags: [
      "TrialChambers",
      "WoodlandMansion",
      "AncientCity",
      "VillageAtSpawn",
      "DesertTemple",
      "WitchHut",
      "OceanMonument",
      "NetherFortress",
      "BastionRemnant",
      "Stronghold",
      "RuinedPortal",
      "PillagerOutpost",
      "Shipwreck",
      "BuriedTreasure",
      "EndCity",
      "IglooBasement",
      "Mineshaft",
      "DesertWell",
      "FossilStructure",
      "JunglePyramid",
      "NetherFossil",
      "SwampHut",
      "TrailRuins",
      "OceanRuin",
      "DesertVillage",
      "PlainsVillage",
      "TaigaVillage",
      "SavannaVillage",
      "SnowyVillage"
    ]
  },
  {
    name: "Speedrun & Rare Seeds",
    icon: "⚡",
    tags: [
      "SpeedrunSeed",
      "GodSeed",
      "12EyePortal",
      "QuadWitchHut",
      "TripleBlacksmith",
      "OneBlock",
      "SurvivalIsland",
      "SpawnChunks",
      "AllBiomesSpawn",
      "GlitchSeed",
      "RareSpawn",
      "NetherSpawn",
      "FastStronghold",
      "ExposedMineshaft",
      "SurfaceSpawner",
      "EndGateway",
      "DoubleDungeon",
      "TripleVillage",
      "HugeCanyon",
      "SinkholeVillage"
    ]
  },
  {
    name: "Building & Redstone",
    icon: "🛠️",
    tags: [
      "MedievalBuild",
      "ModernHouse",
      "RedstoneContraption",
      "IronFarm",
      "MobGrinder",
      "GoldFarm",
      "RaidFarm",
      "VillagerTrading",
      "NetherHub",
      "UndergroundBase",
      "TreehouseBuild",
      "CastleBuild",
      "FantasyWorld",
      "Terraforming",
      "CreativeMode",
      "SurvivalBuild",
      "LoreWorld",
      "AdventureMap",
      "MegabaseSpot",
      "AutomatedStorage",
      "SortingSystem",
      "PistonDoor"
    ]
  },
  {
    name: "Versions & Platforms",
    icon: "🎮",
    tags: [
      "Minecraft121",
      "TrickyTrials",
      "Minecraft120",
      "TrailsAndTales",
      "Minecraft119",
      "JavaEdition",
      "BedrockEdition",
      "PocketEdition",
      "CrossplaySeeds",
      "VanillaMinecraft",
      "ModdedMinecraft",
      "FabricMC",
      "ForgeMC",
      "Datapacks",
      "ResourcePacks",
      "ShaderPacks",
      "OptiFine",
      "Sodium",
      "HardcoreSurvival",
      "PeacefulMode"
    ]
  }
];

// Flat list of all 120+ tags
export const ALL_MINECRAFT_TAGS: string[] = Array.from(
  new Set(MINECRAFT_TAG_CATEGORIES.flatMap(c => c.tags))
);

// High-priority popular tags for quick pill selectors
export const POPULAR_TAGS: string[] = [
  "MinecraftHub",
  "MinecraftPost",
  "TrialChambers",
  "CherryGrove",
  "VillageAtSpawn",
  "AncientCity",
  "WoodlandMansion",
  "SpeedrunSeed",
  "GodSeed",
  "SurvivalIsland",
  "MushroomIsland",
  "DeepDark",
  "JavaEdition",
  "BedrockEdition",
  "Minecraft121",
  "HardcoreSurvival",
  "BuildersHub",
  "RedstoneContraption"
];

export function searchTags(query: string, limit = 15): string[] {
  const clean = query.trim().toLowerCase().replace(/^#/, '');
  if (!clean) return POPULAR_TAGS.slice(0, limit);
  return ALL_MINECRAFT_TAGS.filter(t => t.toLowerCase().includes(clean)).slice(0, limit);
}
