const GAME_CONFIG = {
  player: { initialHp: 7, speed: 400, scale: 2.0 },
  game: {
    totalQuestions: 45,
    meteorStormTriggers: [],
    timeLimit: 900,
  },
  meteor: {
    spawnDelay: 800,
    stormSpawnDelay: 250,
    minSpeed: -400,
    maxSpeed: -900,
    stormMinSpeed: -350,
    stormMaxSpeed: -500,
    maxCount: 12,
  },
  items: {
    rewardSpawnDelay: 8000,
    quizSpawnDelay: 4000,
    magnetRadius: 250,
  },
};

const REWARD_TABLE = [
  { limit: 0.3, type: "hp", sprite: "item-apple", scale: 1.5, tint: 0xffffff },
  {
    limit: 0.6,
    type: "shield",
    sprite: "item-shield",
    scale: 4.0,
    tint: 0xffffff,
  },
  { limit: 0.8, type: "bomb", sprite: "item-bomb", scale: 1.5, tint: 0xfffa65 },
  {
    limit: 1.0,
    type: "magnet",
    sprite: "item-magnet",
    scale: 1.5,
    tint: 0xffff00,
  },
];

function pickByRand(r, table) {
  return table.find((t) => r < t.limit) || table[table.length - 1];
}
