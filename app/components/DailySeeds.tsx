'use client';

import { useState, useEffect } from 'react';

type DailySeed = {
  title: string;
  seed: string;
  edition: string;
  version: string;
  spawn: string;
  highlight: string;
  category: string;
  icon: string;
};

const DAILY_SEEDS_POOL: DailySeed[][] = [
  [
    { title: 'Sunrise Village Valley', seed: '-6538244134311383951', edition: 'Java', version: '1.21', spawn: 'Desert near village', highlight: 'Quick trial chamber access near village', category: 'Starter', icon: '🌅' },
    { title: 'Ocean Monument Haven', seed: '-2621657933082943030', edition: 'Java', version: '1.21', spawn: 'Near ocean', highlight: 'Multiple villages and ocean monument', category: 'Exploration', icon: '🌊' },
    { title: 'Cherry Blossom Fields', seed: '7850875', edition: 'Java/Bedrock', version: '1.20+', spawn: 'Twin islands', highlight: 'Badlands and jungle islands at spawn', category: 'Scenic', icon: '🌸' },
  ],
  [
    { title: 'Ancient City Depths', seed: '2422215857861955386', edition: 'Java', version: '1.21', spawn: 'Underground spawn', highlight: 'Village in ancient city spawn', category: 'Adventure', icon: '🏛️' },
    { title: 'Structure Paradise', seed: '-767300786513247025', edition: 'Java', version: '1.21', spawn: 'Near structures', highlight: 'Villages, ancient cities, mansion nearby', category: 'Survival', icon: '🏰' },
    { title: 'Village Hub Central', seed: '9137002542963915989', edition: 'Java/Bedrock', version: '1.21', spawn: 'Plains village', highlight: 'Trial chambers and ancient city accessible', category: 'Multiplayer', icon: '🏘️' },
  ],
  [
    { title: 'Frozen Peak Stronghold', seed: '-6538244134311383951', edition: 'Java', version: '1.21', spawn: 'Snowy peaks', highlight: 'Stronghold under spawn with village', category: 'Speedrun', icon: '🏔️' },
    { title: 'Mushroom Island Retreat', seed: '7850875', edition: 'Java/Bedrock', version: '1.20+', spawn: 'Near mushroom island', highlight: 'Safe from hostile mobs', category: 'Peaceful', icon: '🍄' },
    { title: 'Ravine Explorer', seed: '2422215857861955386', edition: 'Java', version: '1.21', spawn: 'Exposed ravine', highlight: 'Diamonds visible from surface', category: 'Mining', icon: '💎' },
  ],
  [
    { title: 'Woodland Mansion Spawn', seed: '-767300786513247025', edition: 'Java', version: '1.21', spawn: 'Near forest', highlight: 'Mansion within 1000 blocks', category: 'Boss Fight', icon: '⚔️' },
    { title: 'Desert Temple Cluster', seed: '-2621657933082943030', edition: 'Java', version: '1.21', spawn: 'Desert biome', highlight: 'Multiple temples near spawn', category: 'Loot', icon: '🏺' },
    { title: 'Bamboo Jungle Base', seed: '9137002542963915989', edition: 'Java/Bedrock', version: '1.21', spawn: 'Jungle edge', highlight: 'Panda habitat with village nearby', category: 'Building', icon: '🎍' },
  ],
  [
    { title: 'Shipwreck Shore', seed: '-6538244134311383951', edition: 'Java', version: '1.21', spawn: 'Beach spawn', highlight: 'Shipwreck and buried treasure', category: 'Treasure', icon: '🚢' },
    { title: 'Savanna Skylands', seed: '2422215857861955386', edition: 'Java', version: '1.21', spawn: 'Savanna plateau', highlight: 'Extreme terrain generation', category: 'Creative', icon: '🌄' },
    { title: 'Coral Reef Paradise', seed: '7850875', edition: 'Java/Bedrock', version: '1.20+', spawn: 'Warm ocean', highlight: 'Beautiful coral reefs at spawn', category: 'Underwater', icon: '🐠' },
  ],
  [
    { title: 'Trial Chamber Rush', seed: '-767300786513247025', edition: 'Java', version: '1.21', spawn: 'Near village', highlight: 'Quick access to trial chambers', category: 'Challenge', icon: '🧱' },
    { title: 'Lush Cave Explorer', seed: '-2621657933082943030', edition: 'Java', version: '1.21', spawn: 'Above lush cave', highlight: 'Massive lush cave system', category: 'Caving', icon: '🌿' },
    { title: 'Plains Kingdom', seed: '9137002542963915989', edition: 'Java/Bedrock', version: '1.21', spawn: 'Open plains', highlight: 'Multiple villages forming a kingdom', category: 'Empire', icon: '👑' },
  ],
  [
    { title: 'Mangrove Swamp Start', seed: '-6538244134311383951', edition: 'Java', version: '1.21', spawn: 'Mangrove swamp', highlight: 'Unique swamp village nearby', category: 'Nature', icon: '🌳' },
    { title: 'Mesa Mining Dream', seed: '2422215857861955386', edition: 'Java', version: '1.21', spawn: 'Badlands biome', highlight: 'Exposed gold and mineshafts', category: 'Resources', icon: '⛏️' },
    { title: 'Island Archipelago', seed: '7850875', edition: 'Java/Bedrock', version: '1.20+', spawn: 'Island chain', highlight: 'Multiple small islands to explore', category: 'Survival Island', icon: '🏝️' },
  ],
];

function getDayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % DAILY_SEEDS_POOL.length;
}

function getTimeUntilReset() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export default function DailySeeds({ onCopySeed }: { onCopySeed: (seed: string) => void }) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilReset());
  const [copiedSeed, setCopiedSeed] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeUntilReset()), 60000);
    return () => clearInterval(interval);
  }, []);

  const todaySeeds = DAILY_SEEDS_POOL[getDayIndex()];

  async function copy(seed: string) {
    await navigator.clipboard.writeText(seed);
    setCopiedSeed(seed);
    onCopySeed(seed);
    setTimeout(() => setCopiedSeed(''), 1500);
  }

  return (
    <section className="daily-seeds-section">
      <div className="daily-header">
        <div className="daily-title-row">
          <div className="daily-icon-badge">🎯</div>
          <div>
            <h2>Daily Picks</h2>
            <p>Fresh seeds every day — hand-picked for your next adventure</p>
          </div>
        </div>
        <div className="daily-timer">
          <span className="timer-label">Resets in</span>
          <span className="timer-value">{timeLeft}</span>
        </div>
      </div>

      <div className="daily-grid">
        {todaySeeds.map((seed) => (
          <article className="daily-card" key={seed.seed + seed.category}>
            <div className="daily-card-top">
              <span className="daily-card-icon">{seed.icon}</span>
              <span className="daily-category">{seed.category}</span>
            </div>
            <h3>{seed.title}</h3>
            <p className="daily-highlight">{seed.highlight}</p>
            <div className="daily-meta">
              <span className="meta">{seed.edition}</span>
              <span className="meta">{seed.version}</span>
            </div>
            <div className="daily-seed-box">
              <code>{seed.seed}</code>
              <button
                type="button"
                className="copy-btn"
                onClick={() => copy(seed.seed)}
              >
                {copiedSeed === seed.seed ? '✓' : '📋'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
