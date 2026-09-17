export type SummonType = 'fox' | 'xuanwu' | 'dragon';

export interface SummonData {
  id: SummonType;
  name: string;
  title: string;
  element: 'Fogo' | 'Terra' | 'Trovão';
  role: 'DPS Mágico À Distância' | 'Tanque Protetor' | 'DPS Celeste / Cura';
  description: string;
  icon: string;
  color: string;
  glowColor: number;
  maxHp: number;
  currentHp: number;
  attackPower: number;
  defense: number;
  attackRange: number;
  specialSkillName: string;
  specialSkillDesc: string;
  specialCooldown: number;
  currentCooldown: number;
}

export type MonsterType =
  | 'bat'
  | 'gargoyle'
  | 'wraith'
  | 'boss'
  | 'goblin'
  | 'orc'
  | 'skeleton'
  | 'spider'
  | 'golem'
  | 'pvp_rival';

export interface MonsterData {
  id: string;
  type: MonsterType;
  name: string;
  level: number;
  maxHp: number;
  currentHp: number;
  attackPower: number;
  defense: number;
  speed: number;
  expReward: number;
  spiritStonesReward: number;
  position: [number, number, number];
  isAggro: boolean;
  targetId?: string; // 'player' or summon id
  attackPatternDesc?: string;
  isRanged?: boolean;
  isPvPOpponent?: boolean;
  pvpSkillName?: string;
  shield?: number;
  maxShield?: number;
  pvpClass?: 'Espadachim Wu' | 'Guerreiro Sol' | 'Invocador Tai';
}

export type CultivationRealm = 
  | 'Refino de Qi (Camada 1)'
  | 'Refino de Qi (Camada 9)'
  | 'Estabelecimento de Fundação'
  | 'Núcleo Dourado'
  | 'Alma Nascente Celeste';

export type ItemRarity = 'comum' | 'incomum' | 'raro' | 'lendario';
export type ItemType = 'consumable' | 'weapon' | 'summon_relic';

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  effectText: string;
  quantity: number;
  icon: string;
  stats?: {
    attack?: number;
    defense?: number;
    hp?: number;
    mp?: number;
    critBonus?: number;
  };
}

export interface EquippedItems {
  weapon: InventoryItem | null;
  summonRelic: InventoryItem | null;
}

export type SummonerSkillId = 'ancestral_pact' | 'qi_resonance' | 'divine_surge';

export interface SummonerSkill {
  id: SummonerSkillId;
  name: string;
  type: 'passive' | 'active';
  hotkey?: string;
  level: number;
  maxLevel: number;
  icon: string;
  description: string;
  effectPerLevel: string;
  currentBonusText: string;
  cooldown?: number;
  currentCooldown?: number;
  mpCost?: number;
}

export interface PlayerStats {
  name: string;
  title: string;
  realm: CultivationRealm;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  exp: number;
  maxExp: number;
  spiritStones: number;
  skillPoints: number;
  isFlying: boolean;
  isMeditating: boolean;
  killsCount: number;
  equippedItems: EquippedItems;
  skills: Record<SummonerSkillId, number>;
  divineSurgeTimer: number;
  inventory?: InventoryItem[];
  // PvP Soulfight stats
  isPvPMode?: boolean;
  pvpHonor?: number;
  pvpWins?: number;
  pvpLosses?: number;
  pvpClass?: 'Invocador' | 'Espadachim' | 'Espadachim Tai';
}

export interface DuelState {
  isActive: boolean;
  state: 'idle' | 'countdown' | 'fighting' | 'victory' | 'defeat';
  countdown: number;
  timer: number;
  playerHp: number;
  playerMaxHp: number;
  opponentName: string;
  opponentLevel: number;
  opponentClass: string;
  opponentHp: number;
  opponentMaxHp: number;
  opponentShield: number;
  opponentSkillName?: string;
  comboCount: number;
  maxCombo: number;
  honorEarned?: number;
}

export interface FloatingDamage {
  id: string;
  text: string;
  color: string;
  isCrit: boolean;
  x: number;
  y: number;
  opacity: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  reward: string;
}

export interface GroundLootInfo {
  id: string;
  item: InventoryItem;
  position: [number, number, number];
}

