import * as THREE from 'three';
import {
  SummonType,
  SummonData,
  MonsterType,
  MonsterData,
  PlayerStats,
  FloatingDamage,
  Quest,
  InventoryItem,
  EquippedItems,
  SummonerSkillId,
  ItemRarity,
  DuelState,
} from '../types';
import {
  createSummonerMesh,
  createFoxMesh,
  createXuanwuMesh,
  createDragonMesh,
  createBatMonsterMesh,
  createGargoyleMonsterMesh,
  createWraithMonsterMesh,
  createBossMonsterMesh,
  createGoblinMonsterMesh,
  createOrcMonsterMesh,
  createSkeletonArcherMesh,
  createSpiderMonsterMesh,
  createStoneGolemMesh,
  createGroundLootMesh,
  createKaiseteSwordsmanMesh,
  createFlyingSwordModel,
  PlayerMeshGroup,
} from './models';
import { buildZuWorld, FloatingIsland } from './environment';
import { SpellEngine } from './spells';
import { soundManager } from '../audio/soundManager';

export interface MonsterEntity {
  data: MonsterData;
  mesh: THREE.Group;
  attackCooldown: number;
  respawnTime: number;
  skillCooldowns?: {
    multiSword: number;
    swordBeam: number;
    disablingSword: number;
    bladeShield: number;
    elixir: number;
  };
}

export interface SummonEntity {
  type: SummonType;
  mesh: THREE.Group;
  attackCooldown: number;
  specialCooldown: number;
  followOffset: THREE.Vector3;
}

export interface GroundLootEntity {
  id: string;
  item: InventoryItem;
  mesh: THREE.Group;
  position: THREE.Vector3;
}

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public spellEngine: SpellEngine;

  // Environment
  public islands: FloatingIsland[] = [];
  public petalsSystem: THREE.Points | null = null;
  public spiritWisps: THREE.Points | null = null;
  public cloudsGroup: THREE.Group | null = null;
  public lanterns: THREE.Group[] = [];

  // Player
  public playerMesh: PlayerMeshGroup;
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 8);
  public playerVelocity: THREE.Vector3 = new THREE.Vector3();
  public playerAngle: number = 0;
  public isGrounded: boolean = true;
  public playerStats: PlayerStats;

  // Inventory & Ground Loot
  public inventory: InventoryItem[] = [];
  public groundLoots: GroundLootEntity[] = [];

  // Active Summon
  public activeSummonType: SummonType = 'fox';
  public summonEntity: SummonEntity | null = null;
  public summonDataMap: Record<SummonType, SummonData>;

  // Monsters
  public monsters: MonsterEntity[] = [];
  public targetMonster: MonsterEntity | null = null;

  // Camera settings & mouse interaction
  public cameraDistance: number = 8.5;
  public cameraPitch: number = 0.38; // radians up
  public cameraYaw: number = 0; // horizontal angle
  public isRightMouseDown: boolean = false;
  public isLeftMouseDown: boolean = false;
  public hasMouseMovedWhileDown: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  // Input states
  public keys: Record<string, boolean> = {};

  // UI callbacks
  public onStatsUpdate?: (stats: PlayerStats) => void;
  public onSummonUpdate?: (data: SummonData) => void;
  public onTargetUpdate?: (monster: MonsterData | null) => void;
  public onDamagePopup?: (popup: FloatingDamage) => void;
  public onQuestUpdate?: (quests: Quest[]) => void;
  public onCombatLog?: (message: string, type?: 'system' | 'damage' | 'summon' | 'loot') => void;
  public onInventoryUpdate?: (items: InventoryItem[], equipped: EquippedItems) => void;
  public onOpenInventory?: () => void;
  public onOpenSkills?: () => void;
  public onDuelUpdate?: (duel: DuelState) => void;

  // PvP Duel State
  public duelState: DuelState;
  public kaiseteEntity: MonsterEntity | null = null;
  public playerOrbitingSwords: THREE.Group | null = null;
  private pvpComboTimer: number = 0;
  private savedNonPvPStats: Partial<PlayerStats> | null = null;

  // Quests
  public quests: Quest[] = [
    {
      id: 'q1',
      title: 'O Despertar do Invocador',
      description: 'Experimente invocar os 3 tipos de espíritos (Teclas 2, 3 e 4)',
      progress: 1,
      maxProgress: 3,
      completed: false,
      reward: '500 EXP + 100 Pedras Espirituais',
    },
    {
      id: 'q2',
      title: 'Purificação das Ilhas Celestes',
      description: 'Derrote 5 monstros que corrompem o Qi espiritual',
      progress: 0,
      maxProgress: 5,
      completed: false,
      reward: '1200 EXP + Pílula de Fundação',
    },
    {
      id: 'q3',
      title: 'Desafio do Rei Demônio',
      description: 'Voe até o Pico Infernal e derrote o Rei Demônio de Lava',
      progress: 0,
      maxProgress: 1,
      completed: false,
      reward: 'Reino: Núcleo Dourado + Espada Celestial',
    },
    {
      id: 'q4',
      title: 'Duelo de Imortais no Altar Soulfight',
      description: 'Desafie o Grão-Mestre Kaisete (Nv. 230) na Arena Flutuante',
      progress: 0,
      maxProgress: 1,
      completed: false,
      reward: '500 Honra PvP + Título Imortal Sagrado',
    },
  ];
  private summonedTypesSet = new Set<SummonType>(['fox']);

  // Animation clock
  private clock = new THREE.Clock();
  private animTimer = 0;
  private isRunning = false;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 400);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Build World
    const env = buildZuWorld(this.scene);
    this.islands = env.islands;
    this.petalsSystem = env.petalsSystem;
    this.lanterns = env.lanterns;
    this.spiritWisps = env.spiritWisps;
    this.cloudsGroup = env.cloudsGroup;

    // Spell engine
    this.spellEngine = new SpellEngine(this.scene);

    // Summoner player
    this.playerMesh = createSummonerMesh();
    this.playerMesh.position.copy(this.playerPos);
    this.scene.add(this.playerMesh);

    // Initial stats
    this.playerStats = {
      name: 'Mestre Taoista',
      title: 'Discípulo Celestial',
      realm: 'Refino de Qi (Camada 1)',
      level: 1,
      hp: 850,
      maxHp: 850,
      mp: 600,
      maxMp: 600,
      exp: 0,
      maxExp: 100,
      spiritStones: 50,
      skillPoints: 1,
      isFlying: false,
      isMeditating: false,
      killsCount: 0,
      equippedItems: {
        weapon: null,
        summonRelic: null,
      },
      skills: {
        ancestral_pact: 0,
        qi_resonance: 0,
        divine_surge: 0,
      },
      divineSurgeTimer: 0,
      isPvPMode: false,
      pvpHonor: 0,
      pvpWins: 0,
      pvpLosses: 0,
      pvpClass: 'Invocador',
    };

    // Initialize PvP Duel State
    this.duelState = {
      isActive: false,
      state: 'idle',
      countdown: 0,
      timer: 0,
      playerHp: 48000,
      playerMaxHp: 48000,
      opponentName: 'Kaisete',
      opponentLevel: 230,
      opponentClass: 'Espadachim Wu',
      opponentHp: 85000,
      opponentMaxHp: 85000,
      opponentShield: 15000,
      comboCount: 0,
      maxCombo: 0,
      honorEarned: 0,
    };

    // Initial starter inventory with healing potions
    this.inventory = [
      {
        id: 'starter-potion',
        name: 'Poção de Cura',
        type: 'consumable',
        rarity: 'comum',
        description:
          'Frasco alquímico refinado com orvalho de lótus milenar das montanhas de Zu. Restaura instantaneamente o Qi vital e fecha feridas profundas.',
        effectText: 'Restaura +350 HP de Vitalidade instantaneamente ao ser consumida (Atalho rápido: [Q]).',
        quantity: 2,
        icon: 'FlaskConical',
        stats: { hp: 350 },
      },
    ];

    // Initialize the 3 Summons Data
    this.summonDataMap = {
      fox: {
        id: 'fox',
        name: 'Raposa Celestial das 9 Chamas',
        title: 'Espírito Mítico de Fogo',
        element: 'Fogo',
        role: 'DPS Mágico À Distância',
        description: 'Lança orbes de fogo místico e explode em 9 chamas divinas que carbonizam o Qi dos demônios.',
        icon: 'Flame',
        color: '#ef4444',
        glowColor: 0xef4444,
        maxHp: 700,
        currentHp: 700,
        attackPower: 85,
        defense: 30,
        attackRange: 16,
        specialSkillName: 'Dança das 9 Chamas',
        specialSkillDesc: 'Lança uma rajada massiva de orbes flamejantes causando dano em área.',
        specialCooldown: 10,
        currentCooldown: 0,
      },
      xuanwu: {
        id: 'xuanwu',
        name: 'Tartaruga Negra Xuanwu',
        title: 'Besta Guardiã Divina',
        element: 'Terra',
        role: 'Tanque Protetor',
        description: 'Possui armadura impenetrável de jade e causa tremores de terra que atraem a atenção dos demônios.',
        icon: 'Shield',
        color: '#10b981',
        glowColor: 0x10b981,
        maxHp: 1800,
        currentHp: 1800,
        attackPower: 55,
        defense: 95,
        attackRange: 4,
        specialSkillName: 'Bastião Sagrado e Provocação',
        specialSkillDesc: 'Pisa no solo criando um terremoto que atrai todos os monstros e concede escudo ao Invocador.',
        specialCooldown: 12,
        currentCooldown: 0,
      },
      dragon: {
        id: 'dragon',
        name: 'Dragão Celeste dos Raios',
        title: 'Soberano das Nuvens e Relâmpagos',
        element: 'Trovão',
        role: 'DPS Celeste / Cura',
        description: 'Ondula no céu disparando relâmpagos em cadeia e curando as feridas de seu mestre com chuva de Qi.',
        icon: 'Zap',
        color: '#38bdf8',
        glowColor: 0x38bdf8,
        maxHp: 1100,
        currentHp: 1100,
        attackPower: 95,
        defense: 45,
        attackRange: 14,
        specialSkillName: 'Bênção da Chuva Celestial',
        specialSkillDesc: 'Invoca tempestade que atordoa os inimigos com eletricidade e restaura 250 HP do Invocador.',
        specialCooldown: 14,
        currentCooldown: 0,
      },
    };

    // Instantiate default summon (Fox)
    this.spawnSummon('fox');

    // Spawn Monsters
    this.initMonsters();

    // Event listeners
    this.setupListeners();

    // Start loop
    this.isRunning = true;
    this.clock.start();
    this.animate();

    if (this.onCombatLog) {
      this.onCombatLog('Bem-vindo a Zu Online! Você é o Mestre Invocador.', 'system');
      this.onCombatLog('Dica: Use WASD para mover, Botão Direito para girar a câmera, 1 para Talismã, 2/3/4 para Invocações, V para Voar.', 'system');
    }
  }

  // ==================== SUMMON MANAGEMENT ====================
  public switchSummon(type: SummonType) {
    if (this.activeSummonType === type && this.summonEntity) return;
    this.spawnSummon(type);
    soundManager.playSummonChime();

    // Update quest progress for calling 3 summons
    this.summonedTypesSet.add(type);
    const q1 = this.quests.find((q) => q.id === 'q1');
    if (q1 && !q1.completed) {
      q1.progress = this.summonedTypesSet.size;
      if (q1.progress >= q1.maxProgress) {
        q1.completed = true;
        this.addExp(500);
        this.playerStats.spiritStones += 100;
        this.onCombatLog?.('Missão Cumprida: O Despertar do Invocador! Recompensa recebida.', 'system');
        soundManager.playLevelUp();
      }
      this.onQuestUpdate?.([...this.quests]);
    }

    this.onCombatLog?.(`Espírito Invocado: ${this.summonDataMap[type].name}!`, 'summon');
  }

  private spawnSummon(type: SummonType) {
    if (this.summonEntity) {
      this.scene.remove(this.summonEntity.mesh);
      this.summonEntity = null;
    }

    this.activeSummonType = type;
    let mesh: THREE.Group;
    let offset: THREE.Vector3;

    if (type === 'fox') {
      mesh = createFoxMesh();
      offset = new THREE.Vector3(-2.2, 0, -1.8);
    } else if (type === 'xuanwu') {
      mesh = createXuanwuMesh();
      offset = new THREE.Vector3(2.5, 0, -1.5);
    } else {
      mesh = createDragonMesh();
      offset = new THREE.Vector3(-2.0, 1.8, -2.5);
    }

    const spawnPos = this.playerPos.clone().add(offset);
    mesh.position.copy(spawnPos);
    this.scene.add(mesh);

    this.summonEntity = {
      type,
      mesh,
      attackCooldown: 0.5,
      specialCooldown: 0,
      followOffset: offset,
    };

    // Spell effect at spawn
    this.spellEngine.spawnShockwave(spawnPos, this.summonDataMap[type].glowColor, 4.0);

    this.onSummonUpdate?.(this.summonDataMap[type]);
  }

  // Summon Special Skill
  public triggerSummonSpecial() {
    if (!this.summonEntity) return;
    const summonData = this.summonDataMap[this.activeSummonType];
    if (summonData.currentCooldown > 0) {
      this.onCombatLog?.(`${summonData.specialSkillName} em recarga! (${Math.ceil(summonData.currentCooldown)}s)`, 'system');
      return;
    }

    summonData.currentCooldown = summonData.specialCooldown;
    const sPos = this.summonEntity.mesh.position;

    if (this.activeSummonType === 'fox') {
      // 9 Flames AoE
      soundManager.playFoxfire();
      this.spellEngine.spawnShockwave(sPos, 0xef4444, 8);
      // Shoot flames at all nearby monsters
      this.monsters.forEach((m) => {
        if (m.data.currentHp > 0 && m.mesh.position.distanceTo(sPos) < 16) {
          const dmg = summonData.attackPower * 2.2;
          this.spellEngine.spawnFoxfire(sPos, m.mesh.position, m.data.id, dmg);
        }
      });
      this.onCombatLog?.(`${summonData.name} conjurou Dança das 9 Chamas!`, 'summon');
    } else if (this.activeSummonType === 'xuanwu') {
      // Earth Taunt + Bastion
      soundManager.playEarthSlam();
      this.spellEngine.spawnShockwave(sPos, 0x10b981, 10);
      // Taunt all monsters around to target Xuanwu
      this.monsters.forEach((m) => {
        if (m.data.currentHp > 0 && m.mesh.position.distanceTo(sPos) < 18) {
          m.data.isAggro = true;
          m.data.targetId = 'summon';
          this.applyDamageToMonster(m, summonData.attackPower * 1.5, false, 'summon');
        }
      });
      // Give Summoner shield
      this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + 200);
      this.onStatsUpdate?.({ ...this.playerStats });
      this.onCombatLog?.(`${summonData.name} executou Provocação Sísmica e protegeu o Invocador!`, 'summon');
    } else if (this.activeSummonType === 'dragon') {
      // Celestial Rain & Thunderstorm
      soundManager.playDragonThunder();
      this.spellEngine.spawnShockwave(this.playerPos, 0x38bdf8, 8);
      // Heal Summoner
      this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + 300);
      this.playerStats.mp = Math.min(this.playerStats.maxMp, this.playerStats.mp + 150);
      this.onStatsUpdate?.({ ...this.playerStats });
      // Lightning strike target or nearby monsters
      this.monsters.forEach((m) => {
        if (m.data.currentHp > 0 && m.mesh.position.distanceTo(sPos) < 18) {
          const dmg = summonData.attackPower * 2.5;
          this.spellEngine.spawnLightning(sPos, m.mesh.position, m.data.id, dmg);
          this.applyDamageToMonster(m, dmg, true, 'summon');
        }
      });
      this.onCombatLog?.(`${summonData.name} invocou Bênção da Chuva Celestial (+300 HP)!`, 'summon');
    }

    this.onSummonUpdate?.(summonData);
  }

  // ==================== MONSTERS SETUP ====================
  private initMonsters() {
    // 1. Shadow Fiend Bats on Main Island periphery
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + 0.3;
      const x = Math.cos(angle) * 18;
      const z = Math.sin(angle) * 18;
      this.spawnMonster(
        'bat',
        'Morcego Demônio Sombrio',
        3,
        280,
        28,
        10,
        4.2,
        45,
        12,
        [x, 1.2, z],
        'Voo Errático & Rasante Sombrio: ataca em mergulho rápido com asas cortantes.'
      );
    }

    // 2. NEW MONSTER 1: Goblin Errante (Nv. 2) - Fast daggers
    const goblinCoords: [number, number, number][] = [
      [12, 0, -8],
      [16, 0, -14],
      [9, 0, -18],
      [20, 0, -9],
    ];
    goblinCoords.forEach((pos, idx) => {
      this.spawnMonster(
        'goblin',
        `Goblin Errante #${idx + 1}`,
        2,
        220,
        24,
        8,
        4.8,
        35,
        15,
        pos,
        'Avanço Errante Rápido: persegue velozmente e desfere cortes rápidos de adaga.'
      );
    });

    // 3. NEW MONSTER 2: Esqueleto Arqueiro (Nv. 4) - Ranged bone arrows
    const skeletonCoords: [number, number, number][] = [
      [24, 0, -22],
      [30, 0, -18],
      [22, 0, -28],
    ];
    skeletonCoords.forEach((pos, idx) => {
      this.spawnMonster(
        'skeleton',
        `Esqueleto Arqueiro #${idx + 1}`,
        4,
        340,
        38,
        12,
        2.8,
        75,
        22,
        pos,
        'Disparo Espectral de Longa Distância: atira flechas ósseas mortais de até 22m.',
        true
      );
    });

    // 4. Jade Corrupted Beasts on Main Island
    for (let i = 0; i < 2; i++) {
      const angle = (i / 2) * Math.PI * 2 + 1.2;
      const x = Math.cos(angle) * 24;
      const z = Math.sin(angle) * 24;
      this.spawnMonster(
        'gargoyle',
        `Gárgula de Jade Demônio #${i + 1}`,
        5,
        550,
        45,
        20,
        3.2,
        90,
        25,
        [x, 0, z],
        'Garras Petrificadas: investida média com impacto de jade corrompida.'
      );
    }

    // 5. NEW MONSTER 3: Orc Guerreiro (Nv. 6) - Heavy war club
    const orcCoords: [number, number, number][] = [
      [-16, 0, 14],
      [-22, 0, 18],
      [-26, 0, 12],
    ];
    orcCoords.forEach((pos, idx) => {
      this.spawnMonster(
        'orc',
        `Orc Guerreiro #${idx + 1}`,
        6,
        680,
        56,
        28,
        3.2,
        120,
        35,
        pos,
        'Pancada Brutal de Clava: golpe pesado de concussão no solo que causa atordoamento.'
      );
    });

    // 6. NEW MONSTER 4: Aranha Venenosa (Nv. 7) - Venom spit & web attack
    const spiderCoords: [number, number, number][] = [
      [36, 0, 16],
      [42, 0, 22],
      [38, 0, 28],
    ];
    spiderCoords.forEach((pos, idx) => {
      this.spawnMonster(
        'spider',
        `Aranha Venenosa #${idx + 1}`,
        7,
        720,
        62,
        24,
        4.0,
        150,
        40,
        pos,
        'Cuspe Corrosivo de Veneno: lança jatos ácidos esverdeados que corroem o Qi.',
        true
      );
    });

    // 7. Void Wraiths on Demon Island (around x: 55, z: 25)
    for (let i = 0; i < 3; i++) {
      const ox = (Math.random() - 0.5) * 15;
      const oz = (Math.random() - 0.5) * 15;
      this.spawnMonster(
        'wraith',
        `Espectro da Chama Negra #${i + 1}`,
        8,
        820,
        68,
        25,
        3.8,
        180,
        50,
        [55 + ox, -2, 25 + oz],
        'Magia Espiritual Sombria: canaliza orbes de fogo fantasma e drena Qi.',
        true
      );
    }

    // 8. NEW MONSTER 5: Golem de Pedra (Nv. 12) - Colossal boulder fists & earth shockwaves
    const golemCoords: [number, number, number][] = [
      [-36, 0, -16],
      [-44, 0, -24],
    ];
    golemCoords.forEach((pos, idx) => {
      this.spawnMonster(
        'golem',
        `Golem de Pedra Guardião #${idx + 1}`,
        12,
        1950,
        96,
        58,
        2.2,
        380,
        120,
        pos,
        'Impacto Esmagador Terrestre: socos telúricos maciços de granito que estremecem a terra.'
      );
    });

    // 9. BOSS: Rei Demônio de Lava on Infernal Peak Island (around x: -60, z: -35)
    this.spawnMonster(
      'boss',
      'Rei Demônio de Lava [CHEFE]',
      20,
      4800,
      140,
      60,
      3.0,
      1500,
      500,
      [-60, 4, -35],
      'Fúria do Inferno: tempestade de machados de magma incandescente e ondas de choque gigantescas.'
    );

    // 10. PVP RIVAL: Grão-Mestre Kaisete (Nv. 230 - Espadachim Wu) on Soulfight Arena (x: 0, y: 13.2, z: -78)
    this.spawnMonster(
      'pvp_rival',
      'Kaisete [Nv. 230 - Espadachim Wu]',
      230,
      85000,
      2200,
      750,
      5.2,
      25000,
      5000,
      [0, 13.2, -78],
      'Sete Espadas Celestes: Chuva de Espadas Voadoras, Garrote Veloz, Lâminas de Qi e Escudo Espiritual.',
      true
    );
  }

  private spawnMonster(
    type: MonsterType,
    name: string,
    level: number,
    maxHp: number,
    attackPower: number,
    defense: number,
    speed: number,
    expReward: number,
    spiritStonesReward: number,
    pos: [number, number, number],
    attackPatternDesc: string = '',
    isRanged: boolean = false
  ) {
    let mesh: THREE.Group;
    if (type === 'bat') {
      mesh = createBatMonsterMesh();
    } else if (type === 'goblin') {
      mesh = createGoblinMonsterMesh();
    } else if (type === 'orc') {
      mesh = createOrcMonsterMesh();
    } else if (type === 'skeleton') {
      mesh = createSkeletonArcherMesh();
    } else if (type === 'spider') {
      mesh = createSpiderMonsterMesh();
    } else if (type === 'golem') {
      mesh = createStoneGolemMesh();
    } else if (type === 'gargoyle') {
      mesh = createGargoyleMonsterMesh();
    } else if (type === 'wraith') {
      mesh = createWraithMonsterMesh();
    } else if (type === 'pvp_rival') {
      mesh = createKaiseteSwordsmanMesh();
    } else {
      mesh = createBossMonsterMesh();
    }

    mesh.position.set(pos[0], pos[1], pos[2]);
    this.scene.add(mesh);

    const data: MonsterData = {
      id: Math.random().toString(),
      type,
      name,
      level,
      maxHp,
      currentHp: maxHp,
      attackPower,
      defense,
      speed,
      expReward,
      spiritStonesReward,
      position: pos,
      isAggro: false,
      attackPatternDesc,
      isRanged,
      isPvPOpponent: type === 'pvp_rival',
      pvpClass: type === 'pvp_rival' ? 'Espadachim Wu' : undefined,
      shield: type === 'pvp_rival' ? 15000 : 0,
      maxShield: type === 'pvp_rival' ? 15000 : 0,
      pvpSkillName: type === 'pvp_rival' ? 'Postura das Sete Espadas' : undefined,
    };

    const entity: MonsterEntity = {
      data,
      mesh,
      attackCooldown: 1.0,
      respawnTime: 0,
      skillCooldowns:
        type === 'pvp_rival'
          ? {
              multiSword: 3.5,
              swordBeam: 2.0,
              disablingSword: 4.0,
              bladeShield: 12.0,
              elixir: 50.0,
            }
          : undefined,
    };

    if (type === 'pvp_rival') {
      this.kaiseteEntity = entity;
    }

    this.monsters.push(entity);
  }

  // ==================== COMBAT ACTIONS ====================

  // Summoner Skill 1: Talisman Toss (Hotkey 1 / Left Click on target)
  public castTalismanAttack() {
    if (this.playerStats.mp < 25) {
      this.onCombatLog?.('Qi/Mana insuficiente para lançar talismã!', 'system');
      return;
    }

    let target = this.targetMonster;
    if (!target || target.data.currentHp <= 0) {
      target = this.findNearestMonster();
      if (target) {
        this.setTarget(target);
      }
    }

    if (!target) {
      this.onCombatLog?.('Nenhum alvo ao alcance para atacar!', 'system');
      return;
    }

    const dist = this.playerPos.distanceTo(target.mesh.position);
    if (dist > 25) {
      this.onCombatLog?.('Alvo muito longe para o talismã!', 'system');
      return;
    }

    this.playerStats.mp -= 25;
    this.onStatsUpdate?.({ ...this.playerStats });

    // Animate summoner cast
    if (this.playerMesh.userData.rightArm) {
      this.playerMesh.userData.rightArm.rotation.x = -1.2;
      setTimeout(() => {
        if (this.playerMesh.userData.rightArm) {
          this.playerMesh.userData.rightArm.rotation.x = 0;
        }
      }, 200);
    }

    soundManager.playTalismanToss();

    // Damage calc
    const isCrit = Math.random() > 0.7;
    const baseDmg = 90 + this.playerStats.level * 18;
    const finalDmg = isCrit ? Math.floor(baseDmg * 1.7) : baseDmg;

    this.spellEngine.spawnTalisman(this.playerPos, target.mesh.position, target.data.id, finalDmg, isCrit);

    // Make active summon attack this target too
    target.data.isAggro = true;
  }

  // Summoner Skill: Bagua Array Explosion (Hotkey E)
  public castBaguaExplosion() {
    if (this.playerStats.mp < 70) {
      this.onCombatLog?.('Qi insuficiente para a Formação Bagua!', 'system');
      return;
    }

    this.playerStats.mp -= 70;
    this.onStatsUpdate?.({ ...this.playerStats });

    soundManager.playChiBurst();
    this.spellEngine.spawnBaguaArray(this.playerPos);

    // Damage all enemies within 8 units
    let hitCount = 0;
    this.monsters.forEach((m) => {
      if (m.data.currentHp > 0) {
        const dist = this.playerPos.distanceTo(m.mesh.position);
        if (dist < 8) {
          const dmg = 150 + this.playerStats.level * 30;
          this.applyDamageToMonster(m, dmg, true, 'player');
          // Knockback
          const pushDir = new THREE.Vector3().subVectors(m.mesh.position, this.playerPos).normalize();
          m.mesh.position.addScaledVector(pushDir, 3.5);
          hitCount++;
        }
      }
    });

    this.onCombatLog?.(`Formação Bagua detonada! (${hitCount} monstros atingidos)`, 'system');
  }

  // ==================== ZU ONLINE PVP & CELESTIAL SWORD COMBAT ====================

  // Zu Online Skill 1: Multi Sword Strike (万剑诀 - Chuva de Espadas Voadoras)
  public castMultiSwordStrike() {
    const isPvP = this.playerStats.isPvPMode || false;
    const mpCost = isPvP ? 400 : 45;
    if (this.playerStats.mp < mpCost) {
      this.onCombatLog?.('Qi insuficiente para a Chuva de Espadas Voadoras!', 'system');
      return;
    }

    let target = this.targetMonster;
    if (!target || target.data.currentHp <= 0) {
      target = this.findNearestMonster();
      if (target) this.setTarget(target);
    }

    if (!target) {
      this.onCombatLog?.('Selecione um alvo para a Chuva de Espadas!', 'system');
      return;
    }

    this.playerStats.mp -= mpCost;
    this.onStatsUpdate?.({ ...this.playerStats });

    // Animate arm casting gesture
    if (this.playerMesh.userData.rightArm) {
      this.playerMesh.userData.rightArm.rotation.x = -1.4;
      setTimeout(() => {
        if (this.playerMesh.userData.rightArm) {
          this.playerMesh.userData.rightArm.rotation.x = 0;
        }
      }, 300);
    }

    soundManager.playSwordBeam();

    // In PvP Mode, damage matches Lv 187 high level values (2,200 - 3,200 each sword!)
    const swordCount = isPvP ? 6 : 4;
    const baseDamage = isPvP ? 2600 : 90 + this.playerStats.level * 22;

    for (let i = 0; i < swordCount; i++) {
      setTimeout(() => {
        if (!target || target.data.currentHp <= 0) return;
        const isCrit = Math.random() > 0.65;
        const dmg = Math.floor(baseDamage * (isCrit ? 1.6 : (0.9 + Math.random() * 0.2)));
        this.spellEngine.spawnFlyingSword(
          this.playerPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.5, 1.2 + i * 0.3, (Math.random() - 0.5) * 1.5)),
          target.mesh.position,
          target.data.id,
          dmg,
          isCrit
        );
        if (i % 2 === 0) soundManager.playSwordBeam();
      }, i * 90);
    }

    this.onCombatLog?.(
      `万剑诀! ${swordCount} Espadas Voadoras Celestes disparadas contra ${target.data.name}!`,
      'damage'
    );
  }

  // Zu Online Skill 2: Air Explosion / Qi Blade Crescent (破空斩 - Lâmina Cortante de Qi)
  public castAirExplosion() {
    const isPvP = this.playerStats.isPvPMode || false;
    const mpCost = isPvP ? 600 : 60;
    if (this.playerStats.mp < mpCost) {
      this.onCombatLog?.('Qi insuficiente para a Lâmina Cortante de Qi!', 'system');
      return;
    }

    let target = this.targetMonster;
    if (!target || target.data.currentHp <= 0) {
      target = this.findNearestMonster();
      if (target) this.setTarget(target);
    }

    if (!target) {
      this.onCombatLog?.('Nenhum alvo para desferir a Lâmina Cortante!', 'system');
      return;
    }

    this.playerStats.mp -= mpCost;
    this.onStatsUpdate?.({ ...this.playerStats });

    soundManager.playSwordSlash();

    const isCrit = Math.random() > 0.6;
    const baseDamage = isPvP ? 5200 : 280 + this.playerStats.level * 45;
    const finalDmg = isCrit ? Math.floor(baseDamage * 1.7) : baseDamage;

    this.spellEngine.spawnSwordBeam(
      this.playerPos.clone().add(new THREE.Vector3(0, 1.0, 0)),
      target.mesh.position,
      target.data.id,
      finalDmg,
      isCrit
    );

    this.onCombatLog?.(
      `破空斩! Lâmina Cortante de Qi liberada em alta velocidade contra ${target.data.name}!`,
      'damage'
    );
  }

  // Zu Online Skill 3: Disabling Sword / Celestial Garrote Dash (绝命剑 - Garrote Veloz)
  public castDisablingSword() {
    const isPvP = this.playerStats.isPvPMode || false;
    const mpCost = isPvP ? 450 : 50;
    if (this.playerStats.mp < mpCost) {
      this.onCombatLog?.('Qi insuficiente para o Garrote Celestial!', 'system');
      return;
    }

    this.playerStats.mp -= mpCost;
    this.onStatsUpdate?.({ ...this.playerStats });

    soundManager.playSwordSlash();

    // Dash forward 8 units
    const dashDir = new THREE.Vector3(Math.sin(this.playerAngle), 0, Math.cos(this.playerAngle));
    this.playerPos.addScaledVector(dashDir, 8);
    this.playerMesh.position.copy(this.playerPos);

    this.spellEngine.spawnSlashBurst(this.playerPos, 0x38bdf8);
    this.spellEngine.spawnShockwave(this.playerPos, 0x38bdf8, 4.5);

    // Damage enemies near the dash arrival
    const baseDamage = isPvP ? 4800 : 240 + this.playerStats.level * 35;
    this.monsters.forEach((m) => {
      if (m.data.currentHp > 0) {
        const dist = this.playerPos.distanceTo(m.mesh.position);
        if (dist < 6.5) {
          const isCrit = Math.random() > 0.7;
          const dmg = isCrit ? Math.floor(baseDamage * 1.6) : baseDamage;
          this.applyDamageToMonster(m, dmg, isCrit, 'player');
        }
      }
    });

    this.onCombatLog?.('绝命剑! Garrote Celestial executado com investida relâmpago!', 'damage');
  }

  // Toggle or Set PvP Mode (Lv 187 Max Power)
  public togglePvPMode(forceState?: boolean) {
    const nextState = forceState !== undefined ? forceState : !this.playerStats.isPvPMode;
    this.playerStats.isPvPMode = nextState;

    if (nextState) {
      // Save current non-PvP stats for restoring later
      this.savedNonPvPStats = {
        level: this.playerStats.level,
        realm: this.playerStats.realm,
        title: this.playerStats.title,
        hp: this.playerStats.hp,
        maxHp: this.playerStats.maxHp,
        mp: this.playerStats.mp,
        maxMp: this.playerStats.maxMp,
      };

      // Set Lv. 187 Celestial Realm
      this.playerStats.level = 187;
      this.playerStats.realm = 'Alma Nascente Celeste';
      this.playerStats.title = 'Cultivador Sagrado Nv. 187';
      this.playerStats.maxHp = 48000;
      this.playerStats.hp = 48000;
      this.playerStats.maxMp = 18000;
      this.playerStats.mp = 18000;
      this.playerStats.pvpClass = 'Espadachim Tai';

      // Create 4 floating orbiting swords around player
      if (!this.playerOrbitingSwords) {
        this.playerOrbitingSwords = new THREE.Group();
        for (let i = 0; i < 4; i++) {
          const sword = createFlyingSwordModel();
          const angle = (i / 4) * Math.PI * 2;
          sword.position.set(Math.cos(angle) * 1.3, 1.2, Math.sin(angle) * 1.3);
          sword.scale.set(0.65, 0.65, 0.65);
          sword.rotation.x = Math.PI / 2;
          this.playerOrbitingSwords.add(sword);
        }
        this.playerMesh.add(this.playerOrbitingSwords);
      }
      this.playerOrbitingSwords.visible = true;

      soundManager.playDuelGong();
      this.spellEngine.spawnShockwave(this.playerPos, 0xf59e0b, 8);
      this.onCombatLog?.(
        '⚔️ MODO DUELO ÉPICO ATIVADO! Nível 187 (Alma Nascente) e Espadas Celestes liberados!',
        'system'
      );
    } else {
      // Restore non-PvP stats
      if (this.savedNonPvPStats) {
        Object.assign(this.playerStats, this.savedNonPvPStats);
      }
      if (this.playerOrbitingSwords) {
        this.playerOrbitingSwords.visible = false;
      }
      this.onCombatLog?.('Modo Duelo Épico desativado. Retornou ao Cultivo Padrão.', 'system');
    }

    this.onStatsUpdate?.({ ...this.playerStats });
  }

  // Teleport to Soulfight Arena (Island 4)
  public teleportToSoulfightArena() {
    this.playerPos.set(0, 13.5, -64);
    this.playerMesh.position.copy(this.playerPos);
    this.playerAngle = Math.PI; // Face North towards altar center
    this.spellEngine.spawnShockwave(this.playerPos, 0xf59e0b, 7);
    soundManager.playQinggongDash();

    if (this.kaiseteEntity) {
      this.setTarget(this.kaiseteEntity);
    }

    this.onCombatLog?.(
      '🌀 Teleportado para a Arena Soulfight das Montanhas de Zu! O Grão-Mestre Kaisete o aguarda.',
      'system'
    );
  }

  // Teleport back to Main Island
  public teleportToMainIsland() {
    this.playerPos.set(0, 0, 8);
    this.playerMesh.position.copy(this.playerPos);
    this.playerAngle = 0;
    this.spellEngine.spawnShockwave(this.playerPos, 0x38bdf8, 6);
    soundManager.playQinggongDash();
    this.onCombatLog?.('🌀 Teleportado de volta para a Ilha Principal de Shushan.', 'system');
  }

  // Start / Reset Duel with Kaisete
  public startDuelWithKaisete() {
    // Ensure PvP Mode Lv. 187 is active
    if (!this.playerStats.isPvPMode) {
      this.togglePvPMode(true);
    }

    // Teleport player to duel stance
    this.playerPos.set(0, 13.5, -64);
    this.playerMesh.position.copy(this.playerPos);
    this.playerAngle = Math.PI;

    // Reset Kaisete
    if (this.kaiseteEntity) {
      this.kaiseteEntity.data.currentHp = this.kaiseteEntity.data.maxHp;
      this.kaiseteEntity.data.shield = this.kaiseteEntity.data.maxShield || 15000;
      this.kaiseteEntity.mesh.position.set(0, 13.2, -88);
      this.kaiseteEntity.mesh.visible = true;
      this.kaiseteEntity.mesh.userData.deathTimer = 0;
      this.kaiseteEntity.mesh.userData.isDying = false;
      this.kaiseteEntity.data.isAggro = true;
      this.kaiseteEntity.attackCooldown = 1.0;
      if (this.kaiseteEntity.skillCooldowns) {
        this.kaiseteEntity.skillCooldowns.multiSword = 2.0;
        this.kaiseteEntity.skillCooldowns.swordBeam = 3.0;
        this.kaiseteEntity.skillCooldowns.disablingSword = 4.0;
        this.kaiseteEntity.skillCooldowns.bladeShield = 10.0;
        this.kaiseteEntity.skillCooldowns.elixir = 45.0;
      }
      this.setTarget(this.kaiseteEntity);
    }

    // Initialize Duel State with 3-second countdown
    this.duelState = {
      isActive: true,
      state: 'countdown',
      countdown: 3,
      timer: 0,
      playerHp: this.playerStats.hp,
      playerMaxHp: this.playerStats.maxHp,
      opponentName: 'Kaisete',
      opponentLevel: 230,
      opponentClass: 'Espadachim Wu',
      opponentHp: this.kaiseteEntity?.data.currentHp || 85000,
      opponentMaxHp: this.kaiseteEntity?.data.maxHp || 85000,
      opponentShield: this.kaiseteEntity?.data.shield || 15000,
      comboCount: 0,
      maxCombo: 0,
      honorEarned: 0,
    };

    soundManager.playDuelGong();
    this.spellEngine.spawnShockwave(new THREE.Vector3(0, 13.2, -76), 0xf59e0b, 12);

    this.onCombatLog?.(
      '⚔️ DUELO DE IMORTAIS: Nv. 187 (Tai) vs Grão-Mestre Kaisete Nv. 230 (Wu)! 3... 2... 1... LUTA!',
      'system'
    );

    this.onDuelUpdate?.({ ...this.duelState });
  }

  // Toggle Flying Sword Mode (Hotkey V)
  public toggleFlyingSword() {
    this.playerStats.isFlying = !this.playerStats.isFlying;
    if (this.playerMesh.userData.swordMount) {
      this.playerMesh.userData.swordMount.visible = this.playerStats.isFlying;
    }
    soundManager.playFlyingSword();
    if (this.playerStats.isFlying) {
      this.playerStats.isMeditating = false;
      this.onCombatLog?.('Montou a Espada Voadora Celestial! Velocidade de movimento aumentada no ar.', 'system');
    } else {
      this.onCombatLog?.('Desmontou da Espada Voadora.', 'system');
    }
    this.onStatsUpdate?.({ ...this.playerStats });
  }

  // Toggle Cultivation Meditation Mode (Hotkey B)
  public toggleMeditation() {
    this.playerStats.isMeditating = !this.playerStats.isMeditating;
    if (this.playerStats.isMeditating) {
      this.playerStats.isFlying = false;
      if (this.playerMesh.userData.swordMount) {
        this.playerMesh.userData.swordMount.visible = false;
      }
      this.onCombatLog?.('Entrou em Meditação de Cultivo! Regenerando Qi e Vitalidade rapidamente.', 'system');
    } else {
      this.onCombatLog?.('Saiu da Meditação.', 'system');
    }
    this.onStatsUpdate?.({ ...this.playerStats });
  }

  // Cultivation Realm Breakthrough when EXP is full
  public attemptBreakthrough() {
    if (this.playerStats.exp < this.playerStats.maxExp) {
      this.onCombatLog?.('Cultivo insuficiente para o avanço de Reino!', 'system');
      return;
    }

    this.playerStats.exp -= this.playerStats.maxExp;
    this.playerStats.level += 1;
    this.playerStats.maxExp = Math.floor(this.playerStats.maxExp * 1.6);
    this.playerStats.maxHp += 200;
    this.playerStats.hp = this.playerStats.maxHp;
    this.playerStats.maxMp += 150;
    this.playerStats.mp = this.playerStats.maxMp;

    // Advance realm titles
    if (this.playerStats.level >= 10) {
      this.playerStats.realm = 'Alma Nascente Celeste';
      this.playerStats.title = 'Imortal Ascendente';
    } else if (this.playerStats.level >= 6) {
      this.playerStats.realm = 'Núcleo Dourado';
      this.playerStats.title = 'Sábio do Núcleo';
    } else if (this.playerStats.level >= 3) {
      this.playerStats.realm = 'Estabelecimento de Fundação';
      this.playerStats.title = 'Invocador Veterano';
    } else {
      this.playerStats.realm = 'Refino de Qi (Camada 9)';
      this.playerStats.title = 'Adepto Taoista';
    }

    // Progression: Give 1 skill point on breakthrough
    this.playerStats.skillPoints += 1;

    // Visual & sound breakthrough
    soundManager.playLevelUp();
    this.spellEngine.spawnShockwave(this.playerPos, 0xfef08a, 10);
    this.onCombatLog?.(
      `✨ AVANÇO DE CULTIVO! Nível ${this.playerStats.level} (${this.playerStats.realm})! +1 Ponto de Técnica recebido!`,
      'system'
    );
    this.onStatsUpdate?.({ ...this.playerStats });
  }

  private addExp(amount: number) {
    this.playerStats.exp += amount;
    if (this.playerStats.exp >= this.playerStats.maxExp) {
      this.attemptBreakthrough();
    } else {
      this.onStatsUpdate?.({ ...this.playerStats });
    }
  }

  // ==================== INVENTORY, LOOT & SKILLS LOGIC ====================

  public spawnGroundLoot(item: InventoryItem, worldPos: THREE.Vector3) {
    const mesh = createGroundLootMesh(item.rarity);
    // Add small random offset around monster
    const ox = (Math.random() - 0.5) * 1.5;
    const oz = (Math.random() - 0.5) * 1.5;
    mesh.position.set(worldPos.x + ox, worldPos.y, worldPos.z + oz);
    this.scene.add(mesh);

    const groundLoot: GroundLootEntity = {
      id: Math.random().toString(),
      item,
      mesh,
      position: mesh.position.clone(),
    };

    this.groundLoots.push(groundLoot);
    soundManager.playItemDrop();

    this.onCombatLog?.(
      `✨ Espólio Caído: [${item.name}] (${item.rarity.toUpperCase()}) apareceu no solo!`,
      'loot'
    );
  }

  public pickupGroundLoot(lootId: string) {
    const idx = this.groundLoots.findIndex((l) => l.id === lootId);
    if (idx === -1) return;

    const loot = this.groundLoots[idx];
    this.scene.remove(loot.mesh);
    this.groundLoots.splice(idx, 1);

    // Add to inventory
    const existing = this.inventory.find(
      (i) => i.name === loot.item.name && i.type === 'consumable'
    );
    if (existing) {
      existing.quantity += loot.item.quantity || 1;
    } else {
      this.inventory.push({ ...loot.item, id: Math.random().toString() });
    }

    soundManager.playItemPickup();
    this.onCombatLog?.(`📦 Você recolheu: [${loot.item.name}] (${loot.item.rarity})!`, 'loot');
    this.onInventoryUpdate?.([...this.inventory], this.playerStats.equippedItems);
  }

  public equipItem(item: InventoryItem) {
    if (item.type === 'weapon') {
      this.playerStats.equippedItems.weapon = item;
      this.onCombatLog?.(`Arma equipada: ${item.name}! (+45 Poder de Ataque, +8% Crítico)`, 'system');
    } else if (item.type === 'summon_relic') {
      this.playerStats.equippedItems.summonRelic = item;
      this.onCombatLog?.(
        `Relíquia de Invocação equipada: ${item.name}! (+300 HP e +35 Defesa aos Summons)`,
        'system'
      );
    }
    soundManager.playItemPickup();
    this.onStatsUpdate?.({ ...this.playerStats });
    this.onInventoryUpdate?.([...this.inventory], this.playerStats.equippedItems);
  }

  public unequipItem(slot: 'weapon' | 'summonRelic') {
    if (slot === 'weapon' && this.playerStats.equippedItems.weapon) {
      const name = this.playerStats.equippedItems.weapon.name;
      this.playerStats.equippedItems.weapon = null;
      this.onCombatLog?.(`Desequipou: ${name}.`, 'system');
    } else if (slot === 'summonRelic' && this.playerStats.equippedItems.summonRelic) {
      const name = this.playerStats.equippedItems.summonRelic.name;
      this.playerStats.equippedItems.summonRelic = null;
      this.onCombatLog?.(`Desequipou: ${name}.`, 'system');
    }
    this.onStatsUpdate?.({ ...this.playerStats });
    this.onInventoryUpdate?.([...this.inventory], this.playerStats.equippedItems);
  }

  public useItem(item: InventoryItem) {
    if (item.type === 'consumable') {
      // Heal player
      const healAmount = item.stats?.hp || 350;
      this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + healAmount);
      soundManager.playPotionDrink();
      this.spellEngine.spawnShockwave(this.playerPos, 0x22c55e, 3);
      this.onCombatLog?.(`Bebeu ${item.name}! Restaurou +${healAmount} HP de Vitalidade!`, 'system');

      item.quantity -= 1;
      if (item.quantity <= 0) {
        this.inventory = this.inventory.filter((i) => i.id !== item.id);
      }
      this.onStatsUpdate?.({ ...this.playerStats });
      this.onInventoryUpdate?.([...this.inventory], this.playerStats.equippedItems);
    }
  }

  public useQuickPotion() {
    const potion = this.inventory.find(
      (i) => i.type === 'consumable' && i.quantity > 0
    );
    if (!potion) {
      this.onCombatLog?.('Você não tem nenhuma Poção de Cura no inventário!', 'system');
      return;
    }
    this.useItem(potion);
  }

  public upgradeSkill(skillId: SummonerSkillId) {
    if (this.playerStats.skillPoints <= 0) {
      this.onCombatLog?.('Pontos de Técnica insuficientes para aprimorar habilidade!', 'system');
      return;
    }

    const currentLvl = this.playerStats.skills[skillId] || 0;
    if (currentLvl >= 5) {
      this.onCombatLog?.('Esta habilidade já alcançou o nível máximo!', 'system');
      return;
    }

    this.playerStats.skillPoints -= 1;
    this.playerStats.skills[skillId] = currentLvl + 1;
    soundManager.playSkillUpgrade();

    let skillName = 'Pacto Ancestral Espiritual';
    if (skillId === 'qi_resonance') skillName = 'Ressonância de Qi Celestial';
    if (skillId === 'divine_surge') skillName = 'Sobrecarga Espiritual Divina';

    this.onCombatLog?.(
      `Habilidade aprimorada: [${skillName}] agora está no Nível ${this.playerStats.skills[skillId]}!`,
      'system'
    );
    this.onStatsUpdate?.({ ...this.playerStats });
  }

  // Active Skill [Hotkey R]: Sobrecarga Espiritual Divina
  public castDivineSurge() {
    const surgeLvl = this.playerStats.skills.divine_surge || 0;
    if (surgeLvl === 0) {
      this.onCombatLog?.('Aprenda a Sobrecarga Espiritual Divina no menu de habilidades primeiro!', 'system');
      return;
    }

    if (this.playerStats.divineSurgeTimer > 0) {
      this.onCombatLog?.(`Sobrecarga Espiritual já está ativa! (${Math.ceil(this.playerStats.divineSurgeTimer)}s restantes)`, 'system');
      return;
    }

    if (this.playerStats.mp < 45) {
      this.onCombatLog?.('Qi insuficiente para a Sobrecarga Espiritual Divina! (Custo: 45 Qi)', 'system');
      return;
    }

    this.playerStats.mp -= 45;
    this.playerStats.divineSurgeTimer = 12.0; // 12 seconds duration
    soundManager.playSurgeBuff();
    this.spellEngine.spawnShockwave(this.playerPos, 0xfacc15, 6);
    if (this.summonEntity) {
      this.spellEngine.spawnShockwave(this.summonEntity.mesh.position, 0xfacc15, 6);
    }
    this.onCombatLog?.(
      `⚡ SOBRECARGA ESPIRITUAL ATIVADA! Velocidade e poder divino imbuídos no Summon por 12s!`,
      'summon'
    );
    this.onStatsUpdate?.({ ...this.playerStats });
  }

  public applyDamageToMonster(monster: MonsterEntity, damage: number, isCrit: boolean, source: 'player' | 'summon') {
    if (monster.data.currentHp <= 0) return;

    // Apply weapon bonus if equipped
    let finalDmg = damage;
    if (source === 'player' && this.playerStats.equippedItems.weapon) {
      finalDmg += 45;
    }

    // Apply skill passive: Pacto Ancestral Espiritual (+15% per lvl on summon)
    if (source === 'summon' && this.playerStats.skills.ancestral_pact > 0) {
      finalDmg = Math.floor(finalDmg * (1 + this.playerStats.skills.ancestral_pact * 0.15));
    }

    // Apply skill active: Sobrecarga Espiritual Divina (+25 per lvl extra holy dmg)
    if (source === 'summon' && this.playerStats.divineSurgeTimer > 0) {
      const surgeBonus = (this.playerStats.skills.divine_surge || 1) * 25;
      finalDmg += surgeBonus;
      this.spellEngine.spawnShockwave(monster.mesh.position, 0xfacc15, 2.5);
    }

    // Defense reduction
    let effectiveDmg = Math.max(12, Math.floor(finalDmg - monster.data.defense * 0.35));

    // Shield absorption (Swirling Blade Shield)
    if (monster.data.shield && monster.data.shield > 0) {
      if (monster.data.shield >= effectiveDmg) {
        monster.data.shield -= effectiveDmg;
        soundManager.playShieldActivate();
        this.createDamagePopup(monster.mesh.position, effectiveDmg, false, '#f59e0b');
        effectiveDmg = 0;
      } else {
        effectiveDmg -= monster.data.shield;
        monster.data.shield = 0;
        soundManager.playShieldActivate();
      }
    }

    if (effectiveDmg > 0) {
      monster.data.currentHp = Math.max(0, monster.data.currentHp - effectiveDmg);
      monster.data.isAggro = true;

      // Combo & Duel State tracking
      if (monster.data.type === 'pvp_rival') {
        this.duelState.comboCount += 1;
        this.duelState.maxCombo = Math.max(this.duelState.maxCombo, this.duelState.comboCount);
        this.pvpComboTimer = 3.5;
        this.duelState.opponentHp = monster.data.currentHp;
        this.duelState.opponentShield = monster.data.shield || 0;
        this.onDuelUpdate?.({ ...this.duelState });
      }
    }

    // Qi Resonance passive: Recover Qi on hit
    if (source === 'summon' && this.playerStats.skills.qi_resonance > 0) {
      const recoveredQi = this.playerStats.skills.qi_resonance * 6;
      this.playerStats.mp = Math.min(this.playerStats.maxMp, this.playerStats.mp + recoveredQi);
      this.onStatsUpdate?.({ ...this.playerStats });
    }

    // Sound
    soundManager.playTalismanHit();

    // Damage popup projection
    this.createDamagePopup(monster.mesh.position, effectiveDmg, isCrit, source === 'summon' ? '#38bdf8' : '#facc15');

    // Combat log
    this.onCombatLog?.(
      `${source === 'summon' ? this.summonDataMap[this.activeSummonType].name : 'Invocador'} causou ${effectiveDmg}${isCrit ? ' (CRÍTICO!)' : ''} em ${monster.data.name}`,
      'damage'
    );

    // If target is selected, update UI
    if (this.targetMonster && this.targetMonster.data.id === monster.data.id) {
      this.onTargetUpdate?.({ ...monster.data });
    }

    // Monster Defeated
    if (monster.data.currentHp <= 0) {
      this.handleMonsterDefeated(monster);
    }
  }

  private handleMonsterDefeated(monster: MonsterEntity) {
    soundManager.playMonsterDeath();
    monster.mesh.userData.deathTimer = 0.6;
    monster.mesh.userData.isDying = true;
    monster.respawnTime = monster.data.type === 'boss' ? 30 : monster.data.type === 'pvp_rival' ? 25 : 10; // respawn timer

    const deathColor =
      monster.data.type === 'pvp_rival'
        ? 0xf59e0b
        : monster.data.type === 'boss'
        ? 0xef4444
        : monster.data.type === 'golem'
        ? 0xf59e0b
        : monster.data.type === 'wraith'
        ? 0xa855f7
        : monster.data.type === 'spider'
        ? 0x22c55e
        : 0x38bdf8;

    this.spellEngine.spawnMonsterDeathVFX(
      monster.mesh.position,
      deathColor,
      monster.data.type === 'boss' || monster.data.type === 'pvp_rival'
    );

    // If PvP rival defeated in Duel
    if (monster.data.type === 'pvp_rival') {
      soundManager.playDuelVictory();
      this.duelState.state = 'victory';
      this.duelState.opponentHp = 0;
      this.duelState.honorEarned = 500;
      this.playerStats.pvpWins = (this.playerStats.pvpWins || 0) + 1;
      this.playerStats.pvpHonor = (this.playerStats.pvpHonor || 0) + 500;
      this.onCombatLog?.(
        `🏆 VITÓRIA ÉPICA NO DUELO DE IMORTAIS! Kaisete reverencia sua maestria com as Espadas Celestes! (+500 Honra PvP, +25.000 EXP)`,
        'system'
      );
      // Advance Quest 4
      const q4 = this.quests.find((q) => q.id === 'q4');
      if (q4 && !q4.completed) {
        q4.progress = 1;
        q4.completed = true;
        this.onQuestUpdate?.([...this.quests]);
      }
      this.onDuelUpdate?.({ ...this.duelState });
      this.onStatsUpdate?.({ ...this.playerStats });
    }

    this.playerStats.killsCount += 1;
    this.playerStats.spiritStones += monster.data.spiritStonesReward;
    this.addExp(monster.data.expReward);

    this.onCombatLog?.(
      `Derrotou ${monster.data.name}! Ganhou +${monster.data.expReward} EXP e +${monster.data.spiritStonesReward} Pedras Espirituais!`,
      'loot'
    );

    // ==================== LOOT DROP CHANCE SYSTEM ====================
    // Item 1: Poção de Cura (Comum) ~ 65% chance
    if (Math.random() < 0.65 || monster.data.type === 'boss') {
      this.spawnGroundLoot(
        {
          id: Math.random().toString(),
          name: 'Poção de Cura',
          type: 'consumable',
          rarity: 'comum',
          description:
            'Frasco alquímico refinado com orvalho de lótus milenar das montanhas de Zu. Restaura instantaneamente o Qi vital e fecha feridas profundas.',
          effectText: 'Restaura +350 HP de Vitalidade instantaneamente ao ser consumida (Atalho rápido: [Q]).',
          quantity: 1,
          icon: 'FlaskConical',
          stats: { hp: 350 },
        },
        monster.mesh.position
      );
    }

    // Item 2: Espada Enferrujada (Incomum - Equipamento do Summoner) ~ 35% chance
    if (Math.random() < 0.35 || monster.data.type === 'boss') {
      this.spawnGroundLoot(
        {
          id: Math.random().toString(),
          name: 'Espada Enferrujada',
          type: 'weapon',
          rarity: 'incomum',
          description:
            'Uma antiga lâmina de ferro taoista desgastada pelos séculos, com inscrições trigramáticas que canalizam o fluxo espiritual do usuário.',
          effectText: '+45 de Poder de Ataque em todos os Talismãs do Invocador e +8% de Chance de Dano Crítico.',
          quantity: 1,
          icon: 'Sword',
          stats: { attack: 45, critBonus: 8 },
        },
        monster.mesh.position
      );
    }

    // Item 3: Amuleto de Proteção (Raro - Equipamento para Invocações) ~ 25% chance (or 100% on Boss / Golem)
    if (
      Math.random() < 0.25 ||
      monster.data.type === 'boss' ||
      monster.data.type === 'golem'
    ) {
      this.spawnGroundLoot(
        {
          id: Math.random().toString(),
          name: 'Amuleto de Proteção',
          type: 'summon_relic',
          rarity: 'raro',
          description:
            'Amuleto entalhado em jade pura abençoada pelas Quatro Bestas Sagradas. Irradia uma aura protetora que envolve o espírito invocado.',
          effectText: '+35 Defesa, +300 HP Máximo e reduz em -20% o dano recebido por todas as invocações ativas.',
          quantity: 1,
          icon: 'ShieldAlert',
          stats: { defense: 35, hp: 300 },
        },
        monster.mesh.position
      );
    }

    // Update quests
    const q2 = this.quests.find((q) => q.id === 'q2');
    if (q2 && !q2.completed) {
      q2.progress = Math.min(q2.maxProgress, q2.progress + 1);
      if (q2.progress >= q2.maxProgress) {
        q2.completed = true;
        this.addExp(1200);
        soundManager.playLevelUp();
        this.onCombatLog?.('Missão Cumprida: Purificação das Ilhas Celestes!', 'system');
      }
      this.onQuestUpdate?.([...this.quests]);
    }

    if (monster.data.type === 'boss') {
      const q3 = this.quests.find((q) => q.id === 'q3');
      if (q3 && !q3.completed) {
        q3.progress = 1;
        q3.completed = true;
        this.addExp(3000);
        this.playerStats.spiritStones += 500;
        soundManager.playLevelUp();
        this.onCombatLog?.('GLÓRIA IMORTAL! Você derrotou o lendário Rei Demônio de Lava!', 'system');
        this.onQuestUpdate?.([...this.quests]);
      }
    }

    if (this.targetMonster?.data.id === monster.data.id) {
      this.setTarget(null);
    }
  }

  private createDamagePopup(worldPos: THREE.Vector3, damage: number, isCrit: boolean, color: string) {
    const screenPos = worldPos.clone().add(new THREE.Vector3(0, 2.0, 0));
    screenPos.project(this.camera);

    const x = ((screenPos.x + 1) / 2) * this.container.clientWidth;
    const y = ((-screenPos.y + 1) / 2) * this.container.clientHeight;

    if (this.onDamagePopup) {
      this.onDamagePopup({
        id: Math.random().toString(),
        text: damage.toString(),
        color,
        isCrit,
        x,
        y,
        opacity: 1,
      });
    }
  }

  public setTarget(monster: MonsterEntity | null) {
    this.targetMonster = monster;
    this.onTargetUpdate?.(monster ? { ...monster.data } : null);
  }

  public findNearestMonster(): MonsterEntity | null {
    let nearest: MonsterEntity | null = null;
    let minDist = Infinity;
    this.monsters.forEach((m) => {
      if (m.data.currentHp > 0 && m.mesh.visible) {
        const dist = this.playerPos.distanceTo(m.mesh.position);
        if (dist < minDist) {
          minDist = dist;
          nearest = m;
        }
      }
    });
    return nearest;
  }

  // Qinggong Spirit Leap or Dash (Space key)
  public castQinggongDashOrJump() {
    if (!this.isGrounded && !this.playerStats.isFlying) return;

    const forward = new THREE.Vector3(
      Math.sin(this.cameraYaw),
      0,
      Math.cos(this.cameraYaw)
    ).normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.add(forward);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.sub(forward);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.add(right);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.sub(right);

    if (moveDir.lengthSq() > 0.001) {
      // Qinggong Spirit Dash in movement direction!
      moveDir.normalize();
      this.playerPos.addScaledVector(moveDir, 5.2);
      this.playerVelocity.y = 5.5;
      this.isGrounded = false;
      this.spellEngine.spawnQinggongDash(this.playerPos, moveDir);
      soundManager.playTalismanToss();
      this.onCombatLog?.('Avanço Qinggong Espiritual!', 'system');
    } else {
      // Qinggong High Leap
      this.playerVelocity.y = 11.5;
      this.isGrounded = false;
      this.spellEngine.spawnSparks(this.playerPos, 0x38bdf8, 14, 4, 1.0, 0.14);
      soundManager.playTalismanToss();
    }
  }
  private updatePlayer(delta: number) {
    // Meditation regeneration
    if (this.playerStats.isMeditating) {
      this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + delta * 60);
      this.playerStats.mp = Math.min(this.playerStats.maxMp, this.playerStats.mp + delta * 80);
      this.onStatsUpdate?.({ ...this.playerStats });
      // Gentle float & spin
      this.playerMesh.position.y = 1.0 + Math.sin(this.animTimer * 2) * 0.2;
      return;
    }

    // Movement calculation relative to camera viewpoint (strictly fixes inverted controls!)
    const forward = new THREE.Vector3(
      Math.sin(this.cameraYaw),
      0,
      Math.cos(this.cameraYaw)
    ).normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.add(forward);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.sub(forward);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.add(right);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.sub(right);

    const isMoving = moveDir.lengthSq() > 0.001;
    if (isMoving) {
      moveDir.normalize();

      // Speed (faster if flying)
      const speed = this.playerStats.isFlying ? 18 : 9;
      this.playerPos.addScaledVector(moveDir, speed * delta);

      // Rotate player to face movement direction smoothly
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      this.playerAngle = THREE.MathUtils.lerp(this.playerAngle, targetAngle, delta * 14);
      this.playerMesh.rotation.y = this.playerAngle;

      // Leg running animation
      if (this.playerMesh.userData.leftLeg && this.playerMesh.userData.rightLeg) {
        const stride = Math.sin(this.animTimer * 12) * 0.4;
        this.playerMesh.userData.leftLeg.rotation.x = stride;
        this.playerMesh.userData.rightLeg.rotation.x = -stride;
      }
    } else {
      if (this.playerMesh.userData.leftLeg && this.playerMesh.userData.rightLeg) {
        this.playerMesh.userData.leftLeg.rotation.x = 0;
        this.playerMesh.userData.rightLeg.rotation.x = 0;
      }
    }

    // Jump & Gravity (unless flying)
    if (this.playerStats.isFlying) {
      this.playerPos.y = 3.5 + Math.sin(this.animTimer * 2) * 0.3;
    } else {
      this.playerVelocity.y -= 25 * delta;
      this.playerPos.y += this.playerVelocity.y * delta;

      if (this.playerPos.y <= 0) {
        this.playerPos.y = 0;
        this.playerVelocity.y = 0;
        this.isGrounded = true;
      }
    }

    this.playerMesh.position.copy(this.playerPos);

    // Daoist Halo & Talismans animations
    if (this.playerMesh.userData.halo) {
      this.playerMesh.userData.halo.rotation.z += delta * 1.5;
    }
    if (this.playerMesh.userData.talismans) {
      this.playerMesh.userData.talismans.rotation.y += delta * 2.5;
    }

    // Passive MP & HP regen
    this.playerStats.mp = Math.min(this.playerStats.maxMp, this.playerStats.mp + delta * 8);
    this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + delta * 2);

    // Sobrecarga Espiritual Divina Timer
    if (this.playerStats.divineSurgeTimer > 0) {
      this.playerStats.divineSurgeTimer = Math.max(0, this.playerStats.divineSurgeTimer - delta);
    }

    // Ground Loots: animate floating/rotating and check auto-pickup proximity (< 2.8 units)
    for (let i = this.groundLoots.length - 1; i >= 0; i--) {
      const loot = this.groundLoots[i];
      loot.mesh.rotation.y += delta * 2.2;
      loot.mesh.position.y = loot.position.y + 0.35 + Math.sin(this.animTimer * 4 + i) * 0.15;
      if (this.playerPos.distanceTo(loot.mesh.position) < 2.8) {
        this.pickupGroundLoot(loot.id);
      }
    }

    this.onStatsUpdate?.({ ...this.playerStats });
  }

  private updateSummon(delta: number) {
    if (!this.summonEntity) return;

    const summonData = this.summonDataMap[this.activeSummonType];
    // Update cooldown
    if (summonData.currentCooldown > 0) {
      summonData.currentCooldown = Math.max(0, summonData.currentCooldown - delta);
      this.onSummonUpdate?.({ ...summonData });
    }

    const mesh = this.summonEntity.mesh;

    // Desired follow position relative to player
    const offset = this.summonEntity.followOffset.clone();
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerAngle);
    const targetPos = this.playerPos.clone().add(offset);

    // Fox animation: tails swaying & orbs rotating
    if (this.activeSummonType === 'fox') {
      const uData = mesh.userData;
      if (uData.tailMeshes) {
        uData.tailMeshes.forEach((t: THREE.Mesh, idx: number) => {
          t.rotation.z = Math.sin(this.animTimer * 4 + idx * 0.5) * 0.3 - ((idx - 4) / 4) * 0.5;
        });
      }
      if (uData.orbsGroup) {
        uData.orbsGroup.rotation.y += delta * 3;
      }
    }

    // Dragon animation: undulating serpentine wave
    if (this.activeSummonType === 'dragon') {
      const uData = mesh.userData;
      if (uData.segments) {
        uData.segments.forEach((seg: THREE.Mesh, idx: number) => {
          seg.position.y = 1.8 + Math.sin(this.animTimer * 3 + idx * 0.4) * 0.4;
          seg.position.x = Math.sin(this.animTimer * 2 + idx * 0.5) * 0.3;
        });
      }
    }

    // Target to attack
    let target = this.targetMonster;
    if (!target || target.data.currentHp <= 0) {
      target = this.findNearestMonster();
    }

    if (target && target.data.currentHp > 0) {
      const distToTarget = mesh.position.distanceTo(target.mesh.position);
      const attackRange = summonData.attackRange;

      if (distToTarget <= attackRange) {
        // Look at monster
        mesh.lookAt(target.mesh.position.x, mesh.position.y, target.mesh.position.z);

        // Attack cooldown (faster during divine surge)
        this.summonEntity.attackCooldown -= delta;
        if (this.summonEntity.attackCooldown <= 0) {
          this.summonEntity.attackCooldown = this.playerStats.divineSurgeTimer > 0 ? 0.9 : 1.6;

          // Trigger summon attack
          if (this.activeSummonType === 'fox') {
            soundManager.playFoxfire();
            this.spellEngine.spawnFoxfire(mesh.position, target.mesh.position, target.data.id, summonData.attackPower);
          } else if (this.activeSummonType === 'xuanwu') {
            soundManager.playEarthSlam();
            this.spellEngine.spawnShockwave(target.mesh.position, 0x10b981, 3.5);
            this.applyDamageToMonster(target, summonData.attackPower, false, 'summon');
          } else if (this.activeSummonType === 'dragon') {
            soundManager.playDragonThunder();
            this.spellEngine.spawnLightning(mesh.position, target.mesh.position, target.data.id, summonData.attackPower);
            this.applyDamageToMonster(target, summonData.attackPower, true, 'summon');
          }
        }
      } else {
        // Move towards monster
        const dir = new THREE.Vector3().subVectors(target.mesh.position, mesh.position).normalize();
        mesh.position.addScaledVector(dir, 8 * delta);
        mesh.lookAt(target.mesh.position.x, mesh.position.y, target.mesh.position.z);
      }
    } else {
      // Return and follow player smoothly
      mesh.position.lerp(targetPos, delta * 5);
      const lookTarget = this.playerPos.clone().add(new THREE.Vector3(0, 0, 5));
      mesh.lookAt(lookTarget.x, mesh.position.y, lookTarget.z);
    }
  }

  private updateMonsters(delta: number) {
    this.monsters.forEach((m) => {
      // Handle death animation & respawn timer
      if (m.data.currentHp <= 0) {
        if (m.mesh.userData.deathTimer > 0) {
          m.mesh.userData.deathTimer -= delta;
          const t = m.mesh.userData.deathTimer / 0.6;
          // Stagger backward, tilt, shrink into spirit particles
          m.mesh.position.y = Math.max(0, m.mesh.position.y - delta * 1.5);
          m.mesh.rotation.x += delta * 2.8;
          const s = Math.max(0.05, t);
          m.mesh.scale.set(s, s, s);

          if (m.mesh.userData.deathTimer <= 0) {
            m.mesh.visible = false;
            m.mesh.scale.set(1, 1, 1);
            m.mesh.rotation.set(0, 0, 0);
          }
          return;
        }

        if (m.respawnTime > 0) {
          m.respawnTime -= delta;
          if (m.respawnTime <= 0) {
            // Respawn
            m.data.currentHp = m.data.maxHp;
            m.mesh.position.set(m.data.position[0], m.data.position[1], m.data.position[2]);
            m.mesh.scale.set(1, 1, 1);
            m.mesh.rotation.set(0, 0, 0);
            m.mesh.visible = true;
            m.mesh.userData.deathTimer = 0;
            m.mesh.userData.isDying = false;
            m.data.isAggro = false;
            this.spellEngine.spawnShockwave(m.mesh.position, 0xa855f7, 4);
            this.spellEngine.spawnSparks(m.mesh.position, 0xa855f7, 18, 4, 1.0, 0.15);
          }
        }
        return;
      }

      const u = m.mesh.userData;

      // Flying bat wing flap
      if (m.data.type === 'bat') {
        if (u.leftWing && u.rightWing) {
          const flap = Math.sin(this.animTimer * 16) * 0.6;
          u.leftWing.rotation.z = flap;
          u.rightWing.rotation.z = -flap;
        }
        m.mesh.position.y = 1.5 + Math.sin(this.animTimer * 3 + parseFloat(m.data.id)) * 0.4;
      }

      // Goblin run & dagger animation
      if (m.data.type === 'goblin' && u.armRGroup) {
        u.armRGroup.rotation.x = Math.sin(this.animTimer * 12) * 0.4;
      }

      // Spider leg motion & pulsating venom sac
      if (m.data.type === 'spider' && u.legs) {
        u.legs.forEach((leg: THREE.Group, lIdx: number) => {
          leg.rotation.z = Math.sin(this.animTimer * 8 + lIdx) * 0.25;
        });
      }

      // Stone Golem heavy rock breathing & crystal pulse
      if (m.data.type === 'golem') {
        if (u.body) {
          u.body.position.y = 1.8 + Math.sin(this.animTimer * 1.5) * 0.1;
        }
      }

      // Wraith floating hover
      if (m.data.type === 'wraith') {
        m.mesh.position.y = (m.data.position[1] || 0) + 1.0 + Math.sin(this.animTimer * 2 + parseFloat(m.data.id)) * 0.3;
      }

      // PvP Rival (Kaisete) orbiting swords & celestial halo animation
      if (m.data.type === 'pvp_rival') {
        if (u.flyingSwordsGroup) {
          u.flyingSwordsGroup.rotation.y += delta * 3.8;
        }
        if (u.halo) {
          u.halo.rotation.z += delta * 2.2;
        }
        // Walking leg stride
        if (u.leftLeg && u.rightLeg && m.data.isAggro) {
          const stride = Math.sin(this.animTimer * 10) * 0.45;
          u.leftLeg.rotation.x = stride;
          u.rightLeg.rotation.x = -stride;
        }
      }

      // Decrement PvP skill cooldowns
      if (m.skillCooldowns) {
        m.skillCooldowns.multiSword = Math.max(0, m.skillCooldowns.multiSword - delta);
        m.skillCooldowns.swordBeam = Math.max(0, m.skillCooldowns.swordBeam - delta);
        m.skillCooldowns.disablingSword = Math.max(0, m.skillCooldowns.disablingSword - delta);
        m.skillCooldowns.bladeShield = Math.max(0, m.skillCooldowns.bladeShield - delta);
        m.skillCooldowns.elixir = Math.max(0, m.skillCooldowns.elixir - delta);
      }

      // Kaisete AI 1: Swirling Blade Shield (Defensive reflex when low shield)
      if (
        m.data.type === 'pvp_rival' &&
        m.skillCooldowns &&
        m.skillCooldowns.bladeShield <= 0 &&
        (!m.data.shield || m.data.shield <= 0) &&
        m.data.currentHp < m.data.maxHp * 0.88
      ) {
        m.skillCooldowns.bladeShield = 18.0;
        m.data.shield = 15000;
        m.data.maxShield = 15000;
        soundManager.playShieldActivate();
        this.spellEngine.spawnSwirlingBladeShield(m.mesh.position, 6.0);
        this.onCombatLog?.('Kaisete ativou o Escudo de Espadas Giratórias! Absorvendo 15.000 de dano.', 'damage');
        if (this.duelState.isActive) {
          this.duelState.opponentShield = 15000;
          this.onDuelUpdate?.({ ...this.duelState });
        }
      }

      // Kaisete AI 2: Nine Transformations Golden Elixir (Emergency Healing)
      if (
        m.data.type === 'pvp_rival' &&
        m.skillCooldowns &&
        m.skillCooldowns.elixir <= 0 &&
        m.data.currentHp < m.data.maxHp * 0.35
      ) {
        m.skillCooldowns.elixir = 55.0;
        const heal = 22000;
        m.data.currentHp = Math.min(m.data.maxHp, m.data.currentHp + heal);
        this.createDamagePopup(m.mesh.position, heal, true, '#22c55e');
        soundManager.playLevelUp();
        this.spellEngine.spawnShockwave(m.mesh.position, 0xfef08a, 6.5);
        this.onCombatLog?.('Kaisete consumiu a Pílula Dourada das Nove Transmutações (+22.000 HP)!', 'damage');
        if (this.duelState.isActive) {
          this.duelState.opponentHp = m.data.currentHp;
          this.onDuelUpdate?.({ ...this.duelState });
        }
      }

      // AI: Target either Player or Xuanwu summon (if taunted)
      let combatTargetPos = this.playerPos;
      if (m.data.targetId === 'summon' && this.summonEntity) {
        combatTargetPos = this.summonEntity.mesh.position;
      }

      const dist = m.mesh.position.distanceTo(combatTargetPos);

      // Aggro check
      if (dist < 22 || m.data.isAggro) {
        m.data.isAggro = true;
        // Look at combat target
        m.mesh.lookAt(combatTargetPos.x, m.mesh.position.y, combatTargetPos.z);

        // Distance threshold: ranged monsters stop at 12-16 units; melee monsters approach within 3.0 units; Kaisete keeps 5-10 units
        const desiredMinDist = m.data.type === 'pvp_rival' ? 6.5 : m.data.isRanged ? 12.0 : 3.0;

        if (dist > desiredMinDist) {
          const dir = new THREE.Vector3().subVectors(combatTargetPos, m.mesh.position).normalize();
          m.mesh.position.addScaledVector(dir, m.data.speed * delta);
        } else {
          // Attack target
          m.attackCooldown -= delta;
          if (m.attackCooldown <= 0) {
            m.attackCooldown = m.data.type === 'goblin' ? 1.4 : m.data.type === 'pvp_rival' ? 1.2 : 2.2;

            // PVP RIVAL: KAISTE COMBAT SKILLS
            if (m.data.type === 'pvp_rival') {
              // Priority 1: Multi Sword Strike (Ranged sword barrage)
              if (dist > 7 && m.skillCooldowns && m.skillCooldowns.multiSword <= 0) {
                m.skillCooldowns.multiSword = 4.0;
                soundManager.playSwordBeam();
                this.onCombatLog?.('Kaisete: 万剑诀 (Chuva de Espadas Voadoras)!', 'damage');
                for (let k = 0; k < 5; k++) {
                  setTimeout(() => {
                    if (m.data.currentHp <= 0) return;
                    this.spellEngine.spawnFlyingSword(
                      m.mesh.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.5, 1.4 + k * 0.2, (Math.random() - 0.5) * 1.5)),
                      combatTargetPos,
                      m.data.targetId || 'player',
                      820,
                      Math.random() > 0.65
                    );
                    if (k % 2 === 0) soundManager.playSwordBeam();
                  }, k * 110);
                }
                return;
              }

              // Priority 2: Air Explosion / Sword Beam (Mid-range crescent)
              if (dist >= 4 && m.skillCooldowns && m.skillCooldowns.swordBeam <= 0) {
                m.skillCooldowns.swordBeam = 3.2;
                soundManager.playSwordSlash();
                this.spellEngine.spawnSwordBeam(
                  m.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
                  combatTargetPos,
                  m.data.targetId || 'player',
                  2400,
                  Math.random() > 0.6
                );
                this.onCombatLog?.('Kaisete: 破空斩 (Lâmina Cortante de Qi)!', 'damage');
                return;
              }

              // Priority 3: Disabling Sword / Garrote Rush (Close-range dash burst)
              if (dist < 9 && m.skillCooldowns && m.skillCooldowns.disablingSword <= 0) {
                m.skillCooldowns.disablingSword = 4.5;
                soundManager.playSwordSlash();
                m.mesh.position.lerp(combatTargetPos, 0.5);
                this.spellEngine.spawnSlashBurst(combatTargetPos, 0xf59e0b);
                this.applyDamageToPlayer(2900, true, 'Garrote Celestial de Kaisete');
                this.onCombatLog?.('Kaisete: 绝命剑 (Garrote Celestial)!', 'damage');
                return;
              }
            }

            // RANGED MONSTER 1: Esqueleto Arqueiro fires spectral arrow
            if (m.data.type === 'skeleton') {
              soundManager.playArrowShot();
              this.spellEngine.spawnBoneArrow(m.mesh.position, combatTargetPos, m.data.targetId || 'player', m.data.attackPower);
              this.onCombatLog?.(`${m.data.name} disparou uma Flecha Óssea Espectral!`, 'damage');
              return;
            }

            // RANGED MONSTER 2: Aranha Venenosa spits corrosive venom
            if (m.data.type === 'spider') {
              soundManager.playSpiderSpit();
              this.spellEngine.spawnVenomSpit(m.mesh.position, combatTargetPos, m.data.targetId || 'player', m.data.attackPower);
              this.onCombatLog?.(`${m.data.name} cuspiu uma Rajada Corrosiva de Veneno!`, 'damage');
              return;
            }

            // MELEE MONSTER 1: Orc club slam
            if (m.data.type === 'orc') {
              soundManager.playHeavySlam();
              this.spellEngine.spawnShockwave(m.mesh.position, 0xef4444, 2.5);
              if (u.weaponGroup) {
                u.weaponGroup.rotation.x = -1.5;
                setTimeout(() => {
                  if (u.weaponGroup) u.weaponGroup.rotation.x = 0;
                }, 250);
              }
            }

            // MELEE MONSTER 2: Stone Golem colossal boulder punch
            if (m.data.type === 'golem') {
              soundManager.playHeavySlam();
              this.spellEngine.spawnShockwave(m.mesh.position, 0xd97706, 4.0);
              if (u.armRGroup) {
                u.armRGroup.rotation.x = -1.8;
                setTimeout(() => {
                  if (u.armRGroup) u.armRGroup.rotation.x = 0;
                }, 300);
              }
            }

            if (m.data.targetId === 'summon' && this.summonEntity) {
              // Attack summon
              const summonData = this.summonDataMap[this.activeSummonType];
              let dmg = Math.max(8, m.data.attackPower - summonData.defense * 0.4);

              // Amuleto de Proteção: reduces summon damage taken by 20%
              if (this.playerStats.equippedItems.summonRelic) {
                dmg = Math.max(5, Math.floor(dmg * 0.8));
              }

              summonData.currentHp = Math.max(0, summonData.currentHp - dmg);
              this.createDamagePopup(this.summonEntity.mesh.position, dmg, false, '#ef4444');
              this.onSummonUpdate?.({ ...summonData });
            } else {
              // Attack player using generalized damage handler
              const baseDmg = Math.max(10, m.data.attackPower - this.playerStats.level * 3);
              this.applyDamageToPlayer(baseDmg, false, m.data.name);
            }
          }
        }
      }
    });
  }

  // Damage applied directly to the player character
  public applyDamageToPlayer(damage: number, isCrit: boolean, sourceName: string) {
    if (this.playerStats.hp <= 0) return;

    let finalDmg = damage;
    if (this.playerStats.isMeditating) {
      this.toggleMeditation();
    }

    const defReduction = this.playerStats.isPvPMode ? 350 : this.playerStats.level * 4;
    finalDmg = Math.max(15, Math.floor(finalDmg - defReduction));

    this.playerStats.hp = Math.max(0, this.playerStats.hp - finalDmg);
    this.createDamagePopup(this.playerPos, finalDmg, isCrit, '#ef4444');
    soundManager.playTalismanHit();
    this.onStatsUpdate?.({ ...this.playerStats });

    if (this.duelState.isActive) {
      this.duelState.playerHp = this.playerStats.hp;
      this.onDuelUpdate?.({ ...this.duelState });
    }

    this.onCombatLog?.(`${sourceName} causou ${finalDmg}${isCrit ? ' (CRÍTICO!)' : ''} no Cultivador!`, 'damage');

    // Player Defeated
    if (this.playerStats.hp <= 0) {
      if (this.duelState.isActive) {
        this.duelState.state = 'defeat';
        this.playerStats.pvpLosses = (this.playerStats.pvpLosses || 0) + 1;
        soundManager.playDuelDefeat();
        this.onCombatLog?.('💀 DERROTA NO DUELO DE IMORTAIS! Kaisete venceu o combate. Recupere suas energias e tente a revanche!', 'system');
        this.onDuelUpdate?.({ ...this.duelState });
        setTimeout(() => {
          this.playerStats.hp = this.playerStats.maxHp;
          this.playerStats.mp = this.playerStats.maxMp;
          this.playerPos.set(0, 13.5, -64);
          this.playerMesh.position.copy(this.playerPos);
          this.onStatsUpdate?.({ ...this.playerStats });
        }, 1500);
      } else {
        this.onCombatLog?.('Você sucumbiu aos ferimentos! Meditando para restaurar Qi...', 'system');
        this.playerStats.hp = this.playerStats.maxHp;
        this.playerStats.mp = this.playerStats.maxMp;
        this.playerPos.set(0, 0, 8);
        this.playerMesh.position.copy(this.playerPos);
        this.onStatsUpdate?.({ ...this.playerStats });
      }
    }
  }

  private updateCamera() {
    // Spherical coordinates from player
    const horizontalDist = this.cameraDistance * Math.cos(this.cameraPitch);
    const verticalDist = this.cameraDistance * Math.sin(this.cameraPitch);

    const camX = this.playerPos.x - horizontalDist * Math.sin(this.cameraYaw);
    const camZ = this.playerPos.z - horizontalDist * Math.cos(this.cameraYaw);
    const camY = this.playerPos.y + verticalDist + 1.8;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(this.playerPos.x, this.playerPos.y + 1.4, this.playerPos.z);
  }

  // ==================== ANIMATION TICK ====================
  private animate = () => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.animTimer += delta;

    // Update Player & Summons & Monsters
    this.updatePlayer(delta);
    this.updateSummon(delta);
    this.updateMonsters(delta);

    // Rotate player orbiting swords in PvP mode
    if (this.playerOrbitingSwords && this.playerOrbitingSwords.visible) {
      this.playerOrbitingSwords.rotation.y += delta * 3.5;
    }

    // Duel State Machine Update
    if (this.duelState.isActive) {
      if (this.duelState.state === 'countdown') {
        const prevCd = this.duelState.countdown;
        this.duelState.countdown = Math.max(0, this.duelState.countdown - delta);
        if (Math.ceil(prevCd) !== Math.ceil(this.duelState.countdown) && Math.ceil(this.duelState.countdown) > 0) {
          soundManager.playDuelGong();
        }
        if (this.duelState.countdown <= 0) {
          this.duelState.state = 'fighting';
          soundManager.playDuelGong();
          this.onCombatLog?.('⚔️ A BATALHA COMEÇOU! Liberte suas Espadas Celestes!', 'system');
        }
        this.onDuelUpdate?.({ ...this.duelState });
      } else if (this.duelState.state === 'fighting') {
        this.duelState.timer += delta;
        // Combo timeout decay
        if (this.pvpComboTimer > 0) {
          this.pvpComboTimer -= delta;
          if (this.pvpComboTimer <= 0) {
            this.duelState.comboCount = 0;
            this.onDuelUpdate?.({ ...this.duelState });
          }
        }
        // Keep stats in sync
        this.duelState.playerHp = this.playerStats.hp;
        if (this.kaiseteEntity) {
          this.duelState.opponentHp = this.kaiseteEntity.data.currentHp;
          this.duelState.opponentShield = this.kaiseteEntity.data.shield || 0;
        }
      }
    }

    // Update Projectiles & Spells
    this.spellEngine.update(delta, (proj) => {
      if (proj.targetId === 'player') {
        const sourceName =
          proj.type === 'flying_sword'
            ? 'Espada Voadora de Kaisete'
            : proj.type === 'sword_beam'
            ? 'Lâmina de Qi de Kaisete'
            : 'Projétil Inimigo';
        this.applyDamageToPlayer(proj.damage, proj.isCrit, sourceName);
      } else {
        // Find target monster
        const m = this.monsters.find((mon) => mon.data.id === proj.targetId);
        if (m && m.data.currentHp > 0) {
          this.applyDamageToMonster(m, proj.damage, proj.isCrit, proj.source as 'player' | 'summon');
        }
      }
    });

    // Update 3D Target Reticle
    this.spellEngine.updateTargetReticle(
      this.targetMonster && this.targetMonster.data.currentHp > 0 && this.targetMonster.mesh.visible
        ? this.targetMonster.mesh.position
        : null,
      delta,
      this.targetMonster?.data.type === 'boss'
    );

    // Animate falling sakura petals
    if (this.petalsSystem) {
      const positions = this.petalsSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= delta * 3.5;
        if (positions[i] < -5) {
          positions[i] = 30;
        }
      }
      this.petalsSystem.geometry.attributes.position.needsUpdate = true;
    }

    // Animate drifting celestial spirit wisps (Chi fireflies)
    if (this.spiritWisps) {
      const wispPositions = this.spiritWisps.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < wispPositions.length; i += 3) {
        wispPositions[i + 1] += Math.sin(this.animTimer * 2 + i) * delta * 0.4;
        wispPositions[i] += Math.cos(this.animTimer * 0.8 + i) * delta * 0.5;
        wispPositions[i + 2] += Math.sin(this.animTimer * 0.9 + i) * delta * 0.5;
      }
      this.spiritWisps.geometry.attributes.position.needsUpdate = true;
    }

    // Gentle cloud sea drift
    if (this.cloudsGroup) {
      this.cloudsGroup.rotation.y += delta * 0.015;
    }

    // Gentle lantern floating bob
    this.lanterns.forEach((lan, idx) => {
      lan.position.y += Math.sin(this.animTimer * 2 + idx) * 0.003;
    });

    // Update Camera
    this.updateCamera();

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  };

  // ==================== LISTENERS & RESIZE ====================
  private setupListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    const el = this.renderer.domElement;
    el.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    el.addEventListener('wheel', this.handleWheel, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    // Hotkeys
    if (e.code === 'Digit1') {
      if (this.playerStats.isPvPMode || this.duelState.isActive) {
        this.castMultiSwordStrike();
      } else {
        this.castTalismanAttack();
      }
    } else if (e.code === 'Digit2') {
      this.switchSummon('fox');
    } else if (e.code === 'Digit3') {
      this.switchSummon('xuanwu');
    } else if (e.code === 'Digit4') {
      this.switchSummon('dragon');
    } else if (e.code === 'Digit5' || e.code === 'KeyZ') {
      this.castAirExplosion();
    } else if (e.code === 'Digit6' || e.code === 'KeyX') {
      this.castDisablingSword();
    } else if (e.code === 'KeyE') {
      this.castBaguaExplosion();
    } else if (e.code === 'KeyF') {
      this.triggerSummonSpecial();
    } else if (e.code === 'KeyQ') {
      this.useQuickPotion();
    } else if (e.code === 'KeyR') {
      this.castDivineSurge();
    } else if (e.code === 'KeyP') {
      this.togglePvPMode();
    } else if (e.code === 'KeyG') {
      this.startDuelWithKaisete();
    } else if (e.code === 'KeyI') {
      this.onOpenInventory?.();
    } else if (e.code === 'KeyK' || e.code === 'KeyC') {
      this.onOpenSkills?.();
    } else if (e.code === 'KeyV') {
      this.toggleFlyingSword();
    } else if (e.code === 'KeyB') {
      this.toggleMeditation();
    } else if (e.code === 'Space') {
      e.preventDefault();
      this.castQinggongDashOrJump();
    } else if (e.code === 'Tab') {
      e.preventDefault();
      this.cycleTarget();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 2) {
      // Right click orbit
      this.isRightMouseDown = true;
      this.hasMouseMovedWhileDown = false;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    } else if (e.button === 0) {
      // Left click (prepare for click or drag orbit)
      this.isLeftMouseDown = true;
      this.hasMouseMovedWhileDown = false;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 2) {
      this.isRightMouseDown = false;
    } else if (e.button === 0) {
      this.isLeftMouseDown = false;
      // If the mouse didn't drag, treat as a target selection / attack / loot click
      if (!this.hasMouseMovedWhileDown) {
        this.handleRaycastClick(e);
      }
    }
    this.hasMouseMovedWhileDown = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (this.isRightMouseDown || this.isLeftMouseDown) {
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        this.hasMouseMovedWhileDown = true;
      }

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      // Camera horizontal orbit (Yaw)
      this.cameraYaw -= deltaX * 0.005;

      // Camera vertical pitch: moving mouse UP tilts camera down / bird's eye view; moving DOWN lowers camera towards horizon
      this.cameraPitch = Math.max(0.08, Math.min(Math.PI / 2.3, this.cameraPitch - deltaY * 0.004));
    }
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.cameraDistance = Math.max(3.5, Math.min(20, this.cameraDistance + e.deltaY * 0.015));
  };

  private handleRaycastClick(e: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    // 1. Check if clicking on ground loot to pick it up
    if (this.groundLoots.length > 0) {
      const lootMeshes = this.groundLoots.map((l) => l.mesh);
      const lootHits = raycaster.intersectObjects(lootMeshes, true);
      if (lootHits.length > 0) {
        let topObj: THREE.Object3D | null = lootHits[0].object;
        while (topObj && topObj.parent && topObj.parent !== this.scene) {
          topObj = topObj.parent;
        }
        const matchedLoot = this.groundLoots.find((l) => l.mesh === topObj);
        if (matchedLoot) {
          this.pickupGroundLoot(matchedLoot.id);
          return;
        }
      }
    }

    // 2. Check monster hit
    const monsterMeshes = this.monsters.filter((m) => m.data.currentHp > 0 && m.mesh.visible).map((m) => m.mesh);
    const intersects = raycaster.intersectObjects(monsterMeshes, true);

    if (intersects.length > 0) {
      // Find matching monster
      let topObj: THREE.Object3D | null = intersects[0].object;
      while (topObj && topObj.parent && topObj.parent !== this.scene) {
        topObj = topObj.parent;
      }
      const matched = this.monsters.find((m) => m.mesh === topObj);
      if (matched) {
        this.setTarget(matched);
        this.castTalismanAttack();
      }
    }
  }

  private cycleTarget() {
    const living = this.monsters.filter((m) => m.data.currentHp > 0 && m.mesh.visible);
    if (living.length === 0) return;

    // Sort by proximity so Tab prioritizes the nearest active monsters!
    living.sort(
      (a, b) => this.playerPos.distanceTo(a.mesh.position) - this.playerPos.distanceTo(b.mesh.position)
    );

    if (!this.targetMonster) {
      this.setTarget(living[0]);
    } else {
      const idx = living.findIndex((m) => m.data.id === this.targetMonster?.data.id);
      const nextIdx = (idx + 1) % living.length;
      this.setTarget(living[nextIdx]);
    }
  }

  public resize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);

    this.spellEngine.cleanup();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
