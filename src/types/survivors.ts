// Type definitions for 2D Vampire Survivors engine

export type WeaponId =
  | 'whip'
  | 'bloody_tear'
  | 'flying_swords'
  | 'thousand_swords'
  | 'garlic'
  | 'soul_eater'
  | 'magic_wand'
  | 'holy_wand'
  | 'lightning_ring'
  | 'thunder_loop'
  | 'holy_water'
  | 'la_borra'
  | 'daggers'
  | 'thousand_blades'
  | 'king_bible'
  | 'unholy_vespers'
  | 'cusco'
  | 'cusco_supremo'
  | 'espeto_corrido'
  | 'espeto_supremo'
  | 'garrucha'
  | 'trabuco_farrapo';

export type PassiveId =
  | 'spinach'
  | 'empty_tome'
  | 'duplicator'
  | 'candelabrador'
  | 'wings'
  | 'attractorb'
  | 'crown'
  | 'armor'
  | 'pummarola'
  | 'clover';

export type PickupType =
  | 'gem_blue'
  | 'gem_green'
  | 'gem_red'
  | 'gem_purple'
  | 'coin'
  | 'coin_bag'
  | 'chicken'
  | 'magnet'
  | 'rosary'
  | 'freeze'
  | 'chest'
  | 'vela_negrinho';

export type MonsterTier = 'mob' | 'swarm' | 'elite' | 'boss';

export type StatusEffectType = 'slowed' | 'frozen' | 'burned';

export interface EnemyStatusEffect {
  type: StatusEffectType;
  duration: number; // remaining duration in seconds
  maxDuration: number;
  tickTimer?: number; // for burned DoT
  tickDamage?: number;
  slowFactor?: number; // for slowed, e.g. 0.5 = 50% speed
  potency?: number;
}

export type GameThemePalette = 'morning' | 'dusk' | 'midnight';

export interface MonsterKillRewardMilestone {
  kills: number;
  bonusPercent: number;
  title: string;
}

export type StageId =
  | 'mad_forest'
  | 'inlaid_library'
  | 'blood_crypt'
  | 'frost_peaks'
  | 'churrascaria_shopping'
  | 'lagoa_patos'
  | 'aparados_serra';

export type WeatherType = 'clear' | 'rain' | 'blizzard' | 'blood_moon' | 'ember_storm';

export type MonsterSpriteShape =
  | 'bat'
  | 'skeleton'
  | 'ghoul'
  | 'wolf'
  | 'wraith'
  | 'golem'
  | 'gaucho_apartamento'
  | 'saci'
  | 'curupira'
  | 'mula_sem_cabeca'
  | 'boss_king'
  | 'vampire_lord'
  | 'boss_boitata'
  | 'boss_teiniagua'
  | 'boss_negrinho'
  | 'reaper';

export interface StageConfig {
  id: StageId;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  difficultyMultiplier: number;
  bgPalette: {
    base: string;
    tileA: string;
    tileB: string;
    border: string;
    accent: string;
    lightTint: string;
  };
  allowedWeather: WeatherType[];
  weatherPool?: WeatherType[];
  defaultWeather: WeatherType;
  props?: ('torch' | 'urn' | 'crystal' | 'coffin')[];
  allowedMonsters?: MonsterSpriteShape[];
  unlocked: boolean;
  cost: number;
}

export interface BreakableProp {
  id: number;
  x: number;
  y: number;
  type: 'torch' | 'urn' | 'crystal' | 'coffin';
  propType?: 'torch' | 'urn' | 'crystal' | 'coffin';
  hp: number;
  maxHp: number;
  radius: number;
  dropType?: PickupType;
  dropTable?: PickupType[];
  hurtTimer?: number;
}

export interface WeatherState {
  type: WeatherType;
  name: string;
  description: string;
  icon: string;
  timer: number;
  duration: number;
  intensity: number;
  bonusText: string;
  effectModifier?: number;
}

export interface BestiaryMilestone {
  kills: number;
  rank: number;
  title: string;
  bonusDesc: string;
  bonusStat?: keyof PlayerStats;
  bonusValue?: number;
}

export interface BestiaryEntry {
  id: string;
  name: string;
  tier: MonsterTier;
  spriteShape: MonsterSpriteShape;
  description: string;
  lore: string;
  color: string;
  secondaryColor: string;
  baseHp: number;
  baseDamage: number;
  baseSpeed: number;
  xpValue: number;
  weakness: string;
  milestones: BestiaryMilestone[];
}

export interface CharacterConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  avatarColor: string;
  accentColor: string;
  startingWeapon: WeaponId;
  bonusStats: Partial<PlayerStats>;
  unlocked: boolean;
  cost: number;
}

export interface PlayerStats {
  maxHp: number;
  hp: number;
  hpRegen: number; // HP/s
  might: number; // multiplier, 1.0 default
  armor: number; // flat damage reduction
  moveSpeed: number; // px per second
  area: number; // multiplier, 1.0 default
  projectileSpeed: number; // multiplier, 1.0 default
  duration: number; // multiplier, 1.0 default
  amount: number; // bonus projectiles
  cooldownReduction: number; // 0 to 0.5 (max 50% CDR)
  luck: number; // critical & drop chance
  growth: number; // XP multiplier, 1.0 default
  magnet: number; // pickup radius in pixels
  revives: number;
  rerolls: number;
  skips: number;
}

export interface WeaponDefinition {
  id: WeaponId;
  name: string;
  description: string;
  icon: string;
  isEvolution: boolean;
  baseWeapon?: WeaponId;
  evolutionPair?: PassiveId;
  maxLevel: number;
  baseDamage: number;
  baseCooldown: number; // in seconds
  baseArea: number;
  baseSpeed: number;
  baseDuration: number;
  baseAmount: number;
  damageType: 'melee' | 'projectile' | 'aura' | 'aoe' | 'strike';
  upgradeDescriptions: string[];
}

export interface PassiveDefinition {
  id: PassiveId;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  statEffects: {
    stat: keyof PlayerStats;
    valuePerLevel: number;
    isMultiplier?: boolean;
  }[];
  upgradeDescriptions: string[];
}

export interface WeaponState {
  id: WeaponId;
  level: number;
  cooldownTimer: number;
  totalDamageDealt: number;
  hitsCount: number;
}

export interface PassiveState {
  id: PassiveId;
  level: number;
}

export interface DpsSample {
  second: number;
  dps: number;
  formattedTime: string;
}

export interface Companion {
  id: number;
  type: 'cusco' | 'cusco_supremo';
  name?: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  radius: number;
  targetX?: number;
  targetY?: number;
  facingLeft: boolean;
  animFrame: number;
  state: 'idle' | 'run' | 'follow' | 'attack' | 'bark';
  attackCooldown: number;
  barkCooldown?: number;
  attackTimer?: number;
  damage: number;
  speed: number;
  level?: number;
  isSupreme: boolean;
  targetEnemyId?: number | null;
  targetTimer?: number;
  isPackMember?: boolean;
  packDuration?: number;
  packMaxDuration?: number;
}

export interface Enemy {
  id: number;
  type: string;
  name: string;
  tier: MonsterTier;
  x: number;
  y: number;
  radius: number;
  speed: number;
  maxHp: number;
  hp: number;
  damage: number;
  xpValue: number;
  goldChance: number;
  color: string;
  secondaryColor: string;
  spriteShape: MonsterSpriteShape;
  facingLeft: boolean;
  hurtTimer: number; // flash white
  knockbackX: number;
  knockbackY: number;
  animFrame: number;
  animSpeed: number;
  statusEffects?: EnemyStatusEffect[];
  bossAttackTimer?: number;
  teleportTimer?: number;
  teleportState?: 'idle' | 'charging' | 'teleporting';
  teleportTargetX?: number;
  teleportTargetY?: number;
  specialAoeTimer?: number;
  candleRingTimer?: number;
}

export interface BossHazardZone {
  id: number;
  x: number;
  y: number;
  radius: number;
  damage: number;
  timer: number; // telegraph countdown in seconds (e.g. 0.8s)
  maxTimer: number;
  duration: number; // active damaging flame duration in seconds
  detonated: boolean;
  type: 'candle_circle' | 'holy_consecration' | 'teleport_arrival';
}

export interface Projectile {
  id: number;
  weaponId: WeaponId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isCrit: boolean;
  pierce: number;
  hitEnemies: Set<number>;
  duration: number;
  maxDuration: number;
  color: string;
  extra?: {
    orbitAngle?: number;
    orbitDist?: number;
    targetEnemyId?: number;
    splashRadius?: number;
    isDogBark?: boolean;
    isSonicBarkShockwave?: boolean;
    trail?: { x: number; y: number; alpha: number }[];
  };
}

export interface AreaZone {
  id: number;
  weaponId: WeaponId;
  x: number;
  y: number;
  radius: number;
  damage: number;
  duration: number;
  maxDuration: number;
  tickTimer: number;
  color: string;
}

export interface Pickup {
  id: number;
  type: PickupType;
  x: number;
  y: number;
  value: number;
  radius: number;
  magnetized: boolean;
  vx: number;
  vy: number;
  bobOffset: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  isCrit?: boolean;
}

export interface BloodDecalPoint {
  dx: number;
  dy: number;
  r: number;
}

export interface BloodDecal {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  darkColor: string;
  alpha: number;
  duration: number;
  maxDuration: number;
  angle: number;
  points: BloodDecalPoint[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'spark' | 'star' | 'smoke' | 'ring' | 'blood_drop';
  glow?: boolean;
  gravity?: number;
  drag?: number;
}

export interface UpgradeOption {
  type: 'weapon' | 'passive' | 'consumable';
  id: WeaponId | PassiveId | 'max_level_heal' | 'max_level_gold' | string;
  name: string;
  icon: string;
  currentLevel: number;
  nextLevel: number;
  description: string;
  isNew: boolean;
  isEvolution: boolean;
  isFusion?: boolean;
  consumableType?: 'heal' | 'gold';
  fusionRecipe?: {
    baseWeaponName: string;
    partnerName?: string;
    supremeName: string;
  };
}

export interface ChestReward {
  upgrades: UpgradeOption[];
  gold: number;
  tier: 1 | 3 | 5;
}

export interface GameSummary {
  survivalTime: number;
  levelReached: number;
  killsCount: number;
  goldEarned: number;
  characterName: string;
  damageBreakdown: { weaponName: string; damage: number; dps: number; percentage: number }[];
  survived: boolean;
}

export interface MetaUpgrade {
  id: keyof PlayerStats;
  name: string;
  description: string;
  icon: string;
  currentRank: number;
  maxRank: number;
  costPerRank: number;
  bonusPerRank: number;
}
