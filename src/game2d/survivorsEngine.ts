// Core 2D Game Simulation Engine for Vampire Survivors

import { survivorsAudio } from '../audio/survivorsAudio';
import {
  AreaZone,
  BloodDecal,
  BloodDecalPoint,
  BossHazardZone,
  BreakableProp,
  CharacterConfig,
  ChestReward,
  Companion,
  Enemy,
  FloatingText,
  MonsterTier,
  Particle,
  PassiveId,
  PassiveState,
  Pickup,
  PickupType,
  PlayerStats,
  Projectile,
  StageConfig,
  StatusEffectType,
  UpgradeOption,
  WeaponId,
  WeaponState,
  WeatherState,
  GameThemePalette,
  DpsSample,
} from '../types/survivors';
import { CHARACTERS, PASSIVE_DEFS, STAGES_CONFIG, WEAPON_DEFS, WEATHER_DEFS, getMonsterSpeciesDamageMultiplier } from './constants';
import { RenderState, SurvivorsRenderer } from './renderer';

export class SurvivorsEngine {
  private canvas: HTMLCanvasElement;
  private renderer: SurvivorsRenderer;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Game state
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public isGameOver: boolean = false;
  public isVictory: boolean = false;

  // Player position & movement
  public playerX: number = 0;
  public playerY: number = 0;
  public playerVx: number = 0;
  public playerVy: number = 0;
  public facingLeft: boolean = false;
  public isMoving: boolean = false;
  public walkAnim: number = 0;
  public invulnerableTimer: number = 0;

  // Stats & Progression
  public selectedCharacter: CharacterConfig;
  public stats: PlayerStats;
  public currentXp: number = 0;
  public nextLevelXp: number = 10;
  public currentLevel: number = 1;
  public killsCount: number = 0;
  public coinsEarned: number = 0;
  public timeAlive: number = 0; // in seconds

  // Monster species tracking & kill rewards
  public initialBestiaryKills: Record<string, number> = {};
  public inRunKillsBySpecies: Record<string, number> = {};

  // Active Time-of-Day theme palette ('morning' | 'dusk' | 'midnight')
  public activeThemePalette: GameThemePalette = 'morning';

  // Gold Fever (Frenesi de Ouro / Frenesi do Pila)
  public goldFeverActive: boolean = false;
  public goldFeverTimer: number = 0;
  public goldFeverMultiplier: number = 1;

  // Equipment
  public activeWeapons: WeaponState[] = [];
  public activePassives: PassiveState[] = [];

  // Entities
  public companions: Companion[] = [];
  public enemies: Enemy[] = [];
  public bossHazardZones: BossHazardZone[] = [];
  public projectiles: Projectile[] = [];
  public areaZones: AreaZone[] = [];
  public pickups: Pickup[] = [];
  public particles: Particle[] = [];
  public bloodDecals: BloodDecal[] = [];
  public floatingTexts: FloatingText[] = [];

  // Spawner & Timeline
  private nextCompanionId: number = 1;
  private nextEnemyId: number = 1;
  private nextHazardId: number = 1;
  private nextProjId: number = 1;
  private nextZoneId: number = 1;
  private nextPickupId: number = 1;
  private nextDecalId: number = 1;
  private nextTextId: number = 1;
  private spawnTimer: number = 0;
  private waveDifficulty: number = 1;
  private freezeTimer: number = 0;
  private rosaryFlash: number = 0;
  private screenShake: number = 0;

  // Performance & DPS tracking over run duration
  public dpsHistory: DpsSample[] = [];
  public dpsTimer: number = 0;
  public currentSecondDamage: number = 0;

  // Special Ability (Invocar Matilha de Cuscos Caramelos)
  public specialCooldownTimer: number = 0;
  public specialMaxCooldown: number = 20;

  // Environment & Procedural World
  public stage: StageConfig;
  public weather: WeatherState;
  public breakableProps: BreakableProp[] = [];
  public weatherTimer: number = 45;
  private nextPropId: number = 1;

  // Key controls
  private keys: Record<string, boolean> = {};
  public joystickX: number = 0;
  public joystickY: number = 0;

  // Callbacks to React UI
  public onLevelUpCallback?: (options: UpgradeOption[]) => void;
  public onChestOpenCallback?: (reward: ChestReward) => void;
  public onGameOverCallback?: (victory: boolean) => void;
  public onEnemyKilledCallback?: (enemyType: string) => void;
  public onWeatherChangeCallback?: (weather: WeatherState) => void;

  constructor(
    canvas: HTMLCanvasElement,
    character: CharacterConfig,
    metaBonuses?: Partial<PlayerStats>,
    stageConfig?: StageConfig,
    startingPerk?: string,
    initialBestiaryKills: Record<string, number> = {},
    activeTheme: GameThemePalette = 'morning'
  ) {
    this.canvas = canvas;
    this.renderer = new SurvivorsRenderer(canvas);
    this.selectedCharacter = character;
    this.stage = stageConfig || STAGES_CONFIG.mad_forest;
    this.initialBestiaryKills = { ...initialBestiaryKills };
    this.activeThemePalette = activeTheme;

    // Initialize starting weather
    const initWeatherType = this.stage.allowedWeather[0] || 'clear';
    const weatherDef = WEATHER_DEFS[initWeatherType];
    this.weather = {
      type: initWeatherType,
      timer: 45,
      duration: 45,
      name: weatherDef?.name || 'Tempo Firme',
      icon: weatherDef?.icon || '☀️',
      description: weatherDef?.description || 'Clima estável.',
      bonusText: weatherDef?.bonusText || '',
      intensity: 1.0,
    };

    // Stage difficulty baseline
    this.waveDifficulty = this.stage.difficultyMultiplier || 1.0;

    // Base default stats
    this.stats = {
      maxHp: 100,
      hp: 100,
      hpRegen: 0,
      might: 1.0,
      armor: 0,
      moveSpeed: 180,
      area: 1.0,
      projectileSpeed: 1.0,
      duration: 1.0,
      amount: 0,
      cooldownReduction: 0,
      luck: 1.0,
      growth: 1.0,
      magnet: 70,
      revives: 0,
      rerolls: 2,
      skips: 1,
      ...character.bonusStats,
    };

    // Apply permanent Meta Shop bonuses if any
    if (metaBonuses) {
      if (metaBonuses.might) this.stats.might += metaBonuses.might;
      if (metaBonuses.armor) this.stats.armor += metaBonuses.armor;
      if (metaBonuses.maxHp) {
        this.stats.maxHp += metaBonuses.maxHp;
        this.stats.hp += metaBonuses.maxHp;
      }
      if (metaBonuses.hpRegen) this.stats.hpRegen += metaBonuses.hpRegen;
      if (metaBonuses.cooldownReduction) this.stats.cooldownReduction += metaBonuses.cooldownReduction;
      if (metaBonuses.moveSpeed) this.stats.moveSpeed += metaBonuses.moveSpeed;
      if (metaBonuses.magnet) this.stats.magnet += metaBonuses.magnet;
      if (metaBonuses.growth) this.stats.growth += metaBonuses.growth;
      if (metaBonuses.revives) this.stats.revives += metaBonuses.revives;
    }

    // Add starting weapon
    this.addWeapon(character.startingWeapon);

    // Apply Daily Login starting perk if active
    if (startingPerk === 'chicken') {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 30);
      this.pickups.push({
        id: this.nextPickupId++,
        type: 'chicken',
        x: this.playerX + 35,
        y: this.playerY + 20,
        value: 30,
        radius: 12,
        magnetized: false,
        vx: 0,
        vy: 0,
        bobOffset: 0,
      });
    } else if (startingPerk === 'magnet') {
      setTimeout(() => this.triggerVacuumMagnet(), 400);
    } else if (startingPerk === 'rosary') {
      this.pickups.push({
        id: this.nextPickupId++,
        type: 'rosary',
        x: this.playerX + 45,
        y: this.playerY,
        value: 1,
        radius: 12,
        magnetized: false,
        vx: 0,
        vy: 0,
        bobOffset: 0,
      });
    }

    // Seed procedural breakable props across the arena
    this.initBreakableProps();

    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
    this.onLevelUpCallback = undefined;
    this.onChestOpenCallback = undefined;
    this.onGameOverCallback = undefined;
    this.onEnemyKilledCallback = undefined;
    this.onWeatherChangeCallback = undefined;
    this.renderer.destroy();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  private handleResize = () => {
    this.renderer.resize();
  };

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    survivorsAudio.startMusic();
    this.loop(performance.now());
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning || this.isGameOver) return;

    const delta = Math.min((timestamp - this.lastTime) / 1000, 0.1); // cap max delta
    this.lastTime = timestamp;

    if (!this.isPaused && !this.isGameOver) {
      this.update(delta);
    }

    if (!this.isRunning || this.isGameOver) return;

    this.render();

    if (!this.isRunning || this.isGameOver) return;

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  public recordDamage(amount: number) {
    if (amount <= 0) return;
    this.currentSecondDamage += amount;
  }

  private update(dt: number) {
    this.timeAlive += dt;

    // Sample DPS graph every 1.0 second
    this.dpsTimer += dt;
    if (this.dpsTimer >= 1.0) {
      this.dpsTimer -= 1.0;
      const currentSecond = Math.floor(this.timeAlive);
      const mins = Math.floor(currentSecond / 60);
      const secs = currentSecond % 60;
      const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`;
      this.dpsHistory.push({
        second: currentSecond,
        dps: Math.round(this.currentSecondDamage),
        formattedTime,
      });
      this.currentSecondDamage = 0;
    }

    // Special Cooldown Timer
    if (this.specialCooldownTimer > 0) {
      this.specialCooldownTimer = Math.max(0, this.specialCooldownTimer - dt);
    }

    // HP Regeneration
    if (this.stats.hpRegen > 0 && this.stats.hp < this.stats.maxHp) {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + this.stats.hpRegen * dt);
    }

    // Decay timers
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 2.5);
    if (this.rosaryFlash > 0) this.rosaryFlash = Math.max(0, this.rosaryFlash - dt * 2);
    if (this.freezeTimer > 0) this.freezeTimer = Math.max(0, this.freezeTimer - dt);

    // Gold Fever timer
    if (this.goldFeverTimer > 0) {
      this.goldFeverTimer -= dt;
      if (this.goldFeverTimer <= 0) {
        this.goldFeverActive = false;
        this.goldFeverMultiplier = 1;
        this.spawnFloatingText('Fim do Frenesi', this.playerX, this.playerY - 25, '#94a3b8', 13);
      }
    }

    // 1. Player Movement & Input
    let inputX = 0;
    let inputY = 0;

    if (this.keys['w'] || this.keys['arrowup']) inputY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) inputY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) inputX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) inputX += 1;

    // Merge virtual joystick if used
    if (Math.abs(this.joystickX) > 0.1 || Math.abs(this.joystickY) > 0.1) {
      inputX += this.joystickX;
      inputY += this.joystickY;
    }

    const len = Math.hypot(inputX, inputY);
    if (len > 0) {
      const normX = inputX / Math.max(1, len);
      const normY = inputY / Math.max(1, len);
      // Rain increases movement speed by 15%
      const speedModifier = this.weather.type === 'rain' ? 1.15 : 1.0;
      this.playerX += normX * this.stats.moveSpeed * speedModifier * dt;
      this.playerY += normY * this.stats.moveSpeed * speedModifier * dt;
      this.isMoving = true;
      this.walkAnim += dt;
      if (inputX < 0) this.facingLeft = true;
      if (inputX > 0) this.facingLeft = false;
    } else {
      this.isMoving = false;
    }

    // 2. Weapons Auto-firing
    this.updateWeapons(dt);

    // 3. Projectiles & Orbiting Spells
    this.updateProjectiles(dt);

    // 3b. Companions (Cusco Caramelo & Matilha Sagrada)
    this.updateCompanions(dt);

    // 4. Area Zones (Holy Water puddles, etc.)
    this.updateAreaZones(dt);

    // 4b. Boss AoE Hazards (Telegraphed Candle Circles, Consecration Rings)
    this.updateBossHazards(dt);

    // 5. Enemy Spawning Timeline
    this.updateSpawner(dt);

    // 6. Enemy Movement & Collisions
    this.updateEnemies(dt);
    if (this.isGameOver || !this.isRunning) return;

    // 6b. Procedural Breakable Props (Torches, Urns, Coffins)
    this.updateBreakableProps(dt);

    // 6c. Dynamic Weather Progression & Ambient Hazards
    this.updateWeather(dt);

    // 7. Pickups & Magnetic Attraction
    this.updatePickups(dt);

    // 8. Particles & Floating Text
    this.updateParticlesAndText(dt);

    // 9. Blood Decals (Respingos e Marcas de Sangue Gaúcho no chão)
    this.updateBloodDecals(dt);
  }

  // Calculate species damage multiplier based on accumulated kills
  public getSpeciesDamageMultiplier(species: string): number {
    const totalKills = (this.initialBestiaryKills[species] || 0) + (this.inRunKillsBySpecies[species] || 0);
    return getMonsterSpeciesDamageMultiplier(species, totalKills);
  }

  // Update weapon cooldowns and trigger automatic attacks
  private updateWeapons(dt: number) {
    for (const weapon of this.activeWeapons) {
      const def = WEAPON_DEFS[weapon.id];
      if (!def) continue;

      weapon.cooldownTimer -= dt;

      if (weapon.cooldownTimer <= 0) {
        // Cooldown finished: fire weapon!
        this.fireWeapon(weapon, def);
        const actualCooldown = Math.max(0.08, def.baseCooldown * (1 - this.stats.cooldownReduction));
        weapon.cooldownTimer = actualCooldown;
      }
    }
  }

  // Fire specific weapon behavior
  private fireWeapon(weapon: WeaponState, defInput?: (typeof WEAPON_DEFS)[string]) {
    const def = defInput || WEAPON_DEFS[weapon.id];
    if (!def) return;
    const totalAmount = def.baseAmount + (weapon.level - 1) + this.stats.amount;
    const damage = Math.ceil((def.baseDamage + (weapon.level - 1) * 6) * this.stats.might);
    const isCrit = Math.random() < 0.1 * this.stats.luck;
    const finalDamage = isCrit ? damage * 2 : damage;

    if (weapon.id === 'whip' || weapon.id === 'bloody_tear') {
      // Relho Gaúcho com estalo característico orientado ao alvo mais próximo
      survivorsAudio.playRelho();
      const isEvo = weapon.id === 'bloody_tear';
      const range = (isEvo ? 130 : 85) * this.stats.area;
      const nearest = this.getClosestEnemies(1, 280)[0];
      const strikeLeft = nearest ? nearest.x < this.playerX : this.facingLeft;

      const p1: Projectile = {
        id: this.nextProjId++,
        weaponId: weapon.id,
        x: this.playerX + (strikeLeft ? -range * 0.6 : range * 0.6),
        y: this.playerY - 2,
        vx: 0,
        vy: 0,
        radius: range,
        damage: finalDamage,
        isCrit,
        pierce: 999,
        hitEnemies: new Set(),
        duration: 0.2,
        maxDuration: 0.2,
        color: isEvo ? '#ef4444' : '#fef08a',
      };
      this.projectiles.push(p1);

      // Higher levels or evo whip also strike behind
      if (weapon.level >= 3 || isEvo) {
        const p2: Projectile = {
          ...p1,
          id: this.nextProjId++,
          x: this.playerX + (strikeLeft ? range * 0.6 : -range * 0.6),
        };
        this.projectiles.push(p2);
      }
    } else if (weapon.id === 'flying_swords' || weapon.id === 'thousand_swords') {
      // Orbiting blades around player - Facão Crioulo
      survivorsAudio.playFacao();
      const count = weapon.id === 'thousand_swords' ? 10 : Math.min(8, 2 + weapon.level + this.stats.amount);

      // Remove existing orbiting swords for this weapon to refresh
      this.projectiles = this.projectiles.filter((p) => p.weaponId !== weapon.id);

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const orbitDist = 65 * this.stats.area;
        this.projectiles.push({
          id: this.nextProjId++,
          weaponId: weapon.id,
          x: this.playerX + Math.cos(angle) * orbitDist,
          y: this.playerY + Math.sin(angle) * orbitDist,
          vx: 0,
          vy: 0,
          radius: 14,
          damage: finalDamage,
          isCrit,
          pierce: 999,
          hitEnemies: new Set(),
          duration: def.baseDuration,
          maxDuration: def.baseDuration,
          color: weapon.id === 'thousand_swords' ? '#f59e0b' : '#38bdf8',
          extra: {
            orbitAngle: angle,
            orbitDist,
          },
        });
      }
    } else if (weapon.id === 'garlic' || weapon.id === 'soul_eater') {
      // Garlic deals damage ticks via area check directly in update - Roda de Chimarrão
      survivorsAudio.playChimarrao();
      const auraRadius = (weapon.id === 'soul_eater' ? 140 : 75) * this.stats.area;
      let healedHp = 0;

      // Hit monsters & inflict debuffs
      for (const e of this.enemies) {
        const dist = Math.hypot(e.x - this.playerX, e.y - this.playerY);
        if (dist <= auraRadius + e.radius) {
          const speciesKey = e.spriteShape || e.type || 'skeleton';
          const speciesBonus = this.getSpeciesDamageMultiplier(speciesKey);
          const actualDamage = Math.round(finalDamage * (1 + speciesBonus));

          e.hp -= actualDamage;
          this.recordDamage(actualDamage);
          e.hurtTimer = 0.08;
          weapon.totalDamageDealt += actualDamage;
          weapon.hitsCount++;
          const textCol = isCrit ? '#facc15' : (speciesBonus > 0 ? '#38bdf8' : '#fde047');
          this.spawnFloatingText(actualDamage.toString(), e.x, e.y - 10, textCol, 13, isCrit);

          // Apply Slow status effect
          this.applyStatusEffect(e, 'slowed', 1.8, 0.45);

          // Soul Eater also applies Burn status effect
          if (weapon.id === 'soul_eater') {
            this.applyStatusEffect(e, 'burned', 2.0, 12);
          }

          // Knockback away from player
          const angle = Math.atan2(e.y - this.playerY, e.x - this.playerX);
          e.knockbackX = Math.cos(angle) * 120;
          e.knockbackY = Math.sin(angle) * 120;

          if (weapon.id === 'soul_eater' && e.hp <= 0) {
            healedHp += 1;
          }
        }
      }

      // Hit nearby breakable props
      for (const prop of this.breakableProps) {
        const dist = Math.hypot(prop.x - this.playerX, prop.y - this.playerY);
        if (dist <= auraRadius + prop.radius) {
          prop.hp -= finalDamage;
          prop.hurtTimer = 0.08;
          this.spawnHitParticles(prop.x, prop.y, '#fef08a');
        }
      }

      if (healedHp > 0 && this.stats.hp < this.stats.maxHp) {
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + healedHp);
        this.spawnFloatingText(`+${healedHp}`, this.playerX, this.playerY - 20, '#4ade80', 14);
      }
    } else if (weapon.id === 'magic_wand' || weapon.id === 'holy_wand') {
      // Boleadeira Campeira teleguiada
      survivorsAudio.playBoleadeira();
      const closestEnemies = this.getClosestEnemies(totalAmount);
      for (const target of closestEnemies) {
        const angle = Math.atan2(target.y - this.playerY, target.x - this.playerX);
        const speed = def.baseSpeed * this.stats.projectileSpeed;
        this.projectiles.push({
          id: this.nextProjId++,
          weaponId: weapon.id,
          x: this.playerX,
          y: this.playerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 6,
          damage: finalDamage,
          isCrit,
          pierce: weapon.id === 'holy_wand' ? 3 : 1,
          hitEnemies: new Set(),
          duration: def.baseDuration,
          maxDuration: def.baseDuration,
          color: weapon.id === 'holy_wand' ? '#fef08a' : '#38bdf8',
          extra: { targetEnemyId: target.id },
        });
      }
    } else if (weapon.id === 'lightning_ring' || weapon.id === 'thunder_loop') {
      // Calls thunderbolts from the sky on random enemies
      survivorsAudio.playLightning();
      this.screenShake = Math.max(this.screenShake, 0.4);
      const targets = this.getRandomEnemies(totalAmount);

      for (const target of targets) {
        const splashR = def.baseArea * this.stats.area;
        this.projectiles.push({
          id: this.nextProjId++,
          weaponId: weapon.id,
          x: target.x,
          y: target.y,
          vx: 0,
          vy: 0,
          radius: splashR,
          damage: finalDamage,
          isCrit,
          pierce: 999,
          hitEnemies: new Set(),
          duration: 0.25,
          maxDuration: 0.25,
          color: weapon.id === 'thunder_loop' ? '#facc15' : '#38bdf8',
        });
      }
    } else if (weapon.id === 'holy_water' || weapon.id === 'la_borra') {
      // Lobbed flasks creating persistent ground flames near closest enemies
      survivorsAudio.playHolyWater();
      const closestEnemies = this.getClosestEnemies(totalAmount, 320);
      for (let i = 0; i < totalAmount; i++) {
        const target = closestEnemies[i % Math.max(1, closestEnemies.length)];
        const rx = target ? target.x + (Math.random() - 0.5) * 40 : this.playerX + (Math.random() - 0.5) * 220;
        const ry = target ? target.y + (Math.random() - 0.5) * 40 : this.playerY + (Math.random() - 0.5) * 220;
        this.areaZones.push({
          id: this.nextZoneId++,
          weaponId: weapon.id,
          x: rx,
          y: ry,
          radius: def.baseArea * this.stats.area,
          damage: finalDamage,
          duration: def.baseDuration * this.stats.duration,
          maxDuration: def.baseDuration * this.stats.duration,
          tickTimer: 0.2,
          color: weapon.id === 'la_borra' ? '#38bdf8' : '#f59e0b',
        });
      }
    } else if (weapon.id === 'daggers' || weapon.id === 'thousand_blades') {
      // Stream of piercing daggers targeting nearest enemy in ANY 360° direction
      survivorsAudio.playDagger();
      const closestEnemies = this.getClosestEnemies(totalAmount);
      const primaryTarget = closestEnemies[0];
      const defaultAngle = this.facingLeft ? Math.PI : 0;
      const speed = def.baseSpeed * this.stats.projectileSpeed;

      for (let i = 0; i < totalAmount; i++) {
        const target = closestEnemies[i % Math.max(1, closestEnemies.length)] || primaryTarget;
        const baseAngle = target
          ? Math.atan2(target.y - this.playerY, target.x - this.playerX)
          : defaultAngle;
        const spread = (closestEnemies.length > 1 && target !== primaryTarget)
          ? 0
          : (i - (totalAmount - 1) / 2) * 0.12;
        const angle = baseAngle + spread;
        this.projectiles.push({
          id: this.nextProjId++,
          weaponId: weapon.id,
          x: this.playerX,
          y: this.playerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 5,
          damage: finalDamage,
          isCrit,
          pierce: weapon.id === 'thousand_blades' ? 99 : 2,
          hitEnemies: new Set(),
          duration: def.baseDuration,
          maxDuration: def.baseDuration,
          color: weapon.id === 'thousand_blades' ? '#fde047' : '#e2e8f0',
        });
      }
    } else if (weapon.id === 'king_bible' || weapon.id === 'unholy_vespers') {
      // Rotating protective scriptures - Gaitaço Campeiro / Versos do Martin Fierro
      survivorsAudio.playGaitaChord();
      const count = weapon.id === 'unholy_vespers' ? 6 : Math.min(6, 1 + weapon.level);
      this.projectiles = this.projectiles.filter((p) => p.weaponId !== weapon.id);

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const dist = 70 * this.stats.area;
        this.projectiles.push({
          id: this.nextProjId++,
          weaponId: weapon.id,
          x: this.playerX + Math.cos(angle) * dist,
          y: this.playerY + Math.sin(angle) * dist,
          vx: 0,
          vy: 0,
          radius: 12,
          damage: finalDamage,
          isCrit,
          pierce: 999,
          hitEnemies: new Set(),
          duration: def.baseDuration,
          maxDuration: def.baseDuration,
          color: weapon.id === 'unholy_vespers' ? '#ef4444' : '#60a5fa',
          extra: { orbitAngle: angle, orbitDist: dist },
        });
      }
    } else if (weapon.id === 'espeto_corrido' || weapon.id === 'espeto_supremo') {
      // Espeto corrido de churrasco em brasa
      survivorsAudio.playFacao();
      const isSupreme = weapon.id === 'espeto_supremo';
      const speed = (def.baseSpeed || 280) * this.stats.projectileSpeed;
      const count = isSupreme ? totalAmount + 2 : totalAmount;

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
        this.projectiles.push({
          id: this.nextProjId++,
          weaponId: weapon.id,
          x: this.playerX,
          y: this.playerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: (def.baseArea || 14) * this.stats.area,
          damage: finalDamage,
          isCrit,
          pierce: isSupreme ? 99 : 4,
          hitEnemies: new Set(),
          duration: def.baseDuration * this.stats.duration,
          maxDuration: def.baseDuration * this.stats.duration,
          color: isSupreme ? '#fbbf24' : '#f97316',
        });
      }
    } else if (weapon.id === 'garrucha' || weapon.id === 'trabuco_farrapo') {
      // Disparo de garrucha/trabuco farrapo com som e recuo disparando contra o alvo mais próximo
      survivorsAudio.playGunshot();
      this.screenShake = Math.max(this.screenShake, weapon.id === 'trabuco_farrapo' ? 0.35 : 0.2);
      const isTrabuco = weapon.id === 'trabuco_farrapo';
      const nearest = this.getClosestEnemies(1)[0];
      const baseAngle = nearest
        ? Math.atan2(nearest.y - this.playerY, nearest.x - this.playerX)
        : (this.facingLeft ? Math.PI : 0);
      const speed = (def.baseSpeed || 420) * this.stats.projectileSpeed;
      const pellets = isTrabuco ? totalAmount * 3 : totalAmount * 2;

      for (let i = 0; i < pellets; i++) {
        const spread = (Math.random() - 0.5) * (isTrabuco ? 0.85 : 0.55);
        const shotSpeed = speed * (0.85 + Math.random() * 0.3);
        const angle = baseAngle + spread;
        this.projectiles.push({
          id: this.nextProjId++,
          weaponId: weapon.id,
          x: this.playerX + Math.cos(baseAngle) * 12,
          y: this.playerY + Math.sin(baseAngle) * 12,
          vx: Math.cos(angle) * shotSpeed,
          vy: Math.sin(angle) * shotSpeed,
          radius: isTrabuco ? 7 : 5,
          damage: Math.round(finalDamage * (isTrabuco ? 0.8 : 0.65)),
          isCrit,
          pierce: isTrabuco ? 5 : 2,
          hitEnemies: new Set(),
          duration: 0.45 * this.stats.duration,
          maxDuration: 0.45 * this.stats.duration,
          color: isTrabuco ? '#fbbf24' : '#e2e8f0',
        });
      }
    } else if (weapon.id === 'cusco' || weapon.id === 'cusco_supremo') {
      // Invocação do Cusco Caramelo (Cachorro companheiro fiel)
      const isSupreme = weapon.id === 'cusco_supremo';
      const targetCount = isSupreme ? 3 + weapon.level : Math.min(4, 1 + Math.floor(weapon.level / 2));

      let newlySpawned = false;
      // Garante que o cusco está invocado no campo
      while (this.companions.length < targetCount) {
        const compId = this.nextCompanionId++;
        this.companions.push({
          id: compId,
          type: 'cusco',
          name: isSupreme ? 'Matilha Sagrada Farroupilha' : 'Cusco Caramelo',
          x: this.playerX + (Math.random() - 0.5) * 30,
          y: this.playerY + (Math.random() - 0.5) * 30,
          radius: isSupreme ? 16 : 12,
          speed: isSupreme ? 200 : 160,
          damage: finalDamage,
          attackCooldown: isSupreme ? 0.4 : 0.65,
          attackTimer: 0,
          targetEnemyId: null,
          facingLeft: this.facingLeft,
          animFrame: Math.random() * 5,
          state: 'idle',
          isSupreme,
        });
        newlySpawned = true;
      }

      // Sincroniza atributos com os cachorros
      for (const comp of this.companions) {
        comp.damage = finalDamage;
        comp.isSupreme = isSupreme;
        comp.speed = (isSupreme ? 210 : 165) * this.stats.moveSpeed;
        comp.radius = (isSupreme ? 16 : 12) * this.stats.area;
      }

      // Latido alegre apenas ao invocar novo cusco
      if (newlySpawned) {
        survivorsAudio.playDogBark();
      }
    }
  }

  // Update projectiles physics & collisions
  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.duration -= dt;

      if (p.duration <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Handle Orbiting weapons (swords, bibles)
      if (p.extra?.orbitAngle !== undefined && p.extra?.orbitDist !== undefined) {
        const rotSpeed = p.weaponId === 'thousand_swords' ? 5.5 : 3.2;
        p.extra.orbitAngle += rotSpeed * dt;
        p.x = this.playerX + Math.cos(p.extra.orbitAngle) * p.extra.orbitDist;
        p.y = this.playerY + Math.sin(p.extra.orbitAngle) * p.extra.orbitDist;
      } else {
        // Homing steering for targeted projectiles (Boleadeiras)
        if (p.extra?.targetEnemyId) {
          const target = this.enemies.find((e) => e.id === p.extra!.targetEnemyId && e.hp > 0);
          if (target) {
            const desiredAngle = Math.atan2(target.y - p.y, target.x - p.x);
            const currentSpeed = Math.hypot(p.vx, p.vy);
            const currentAngle = Math.atan2(p.vy, p.vx);
            let angleDiff = desiredAngle - currentAngle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            const turnRate = 7.5 * dt;
            const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnRate);
            p.vx = Math.cos(newAngle) * currentSpeed;
            p.vy = Math.sin(newAngle) * currentSpeed;
          }
        }

        // Standard projectile motion
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      // Check collision with all active enemies
      for (const e of this.enemies) {
        if (p.hitEnemies.has(e.id)) continue;

        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist <= p.radius + e.radius) {
          // Hit enemy with species bonus!
          const speciesKey = e.spriteShape || e.type || 'skeleton';
          const speciesBonus = this.getSpeciesDamageMultiplier(speciesKey);
          const actualDamage = Math.round(p.damage * (1 + speciesBonus));

          e.hp -= actualDamage;
          this.recordDamage(actualDamage);
          e.hurtTimer = 0.08;
          p.hitEnemies.add(e.id);
          p.pierce--;

          // Status Effect Procs based on weapon type
          if (p.weaponId === 'holy_water' || p.weaponId === 'la_borra' || p.weaponId === 'espeto_corrido' || p.weaponId === 'espeto_supremo') {
            this.applyStatusEffect(e, 'burned', 3.0, p.weaponId === 'espeto_supremo' ? 25 : 15);
          } else if (p.weaponId === 'flying_swords' || p.weaponId === 'thousand_swords') {
            this.applyStatusEffect(e, 'slowed', 2.0, 0.45);
          } else if (p.weaponId === 'lightning_ring' || p.weaponId === 'thunder_loop') {
            this.applyStatusEffect(e, 'slowed', 1.5, 0.4);
            if (Math.random() < 0.25) {
              this.applyStatusEffect(e, 'frozen', 1.2, 1.0);
            }
          }

          // Track damage stats
          const weapon = this.activeWeapons.find((w) => w.id === p.weaponId);
          if (weapon) {
            weapon.totalDamageDealt += actualDamage;
            weapon.hitsCount++;
          }

          // Spawn floating damage number
          const textCol = p.isCrit ? '#facc15' : (speciesBonus > 0 ? '#38bdf8' : '#ffffff');
          this.spawnFloatingText(actualDamage.toString(), e.x, e.y - 12, textCol, p.isCrit ? 16 : 13, p.isCrit);

          // Knockback velocity
          const knockAngle = Math.atan2(e.y - p.y, e.x - p.x);
          const knockForce = (p.weaponId === 'garrucha' || p.weaponId === 'trabuco_farrapo') ? 160 : 80;
          e.knockbackX = Math.cos(knockAngle) * knockForce;
          e.knockbackY = Math.sin(knockAngle) * knockForce;

          // Blood / hit sparks
          this.spawnHitParticles(e.x, e.y, p.color);

          if (p.pierce <= 0) {
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }

      // Check collision with breakable props
      for (const prop of this.breakableProps) {
        const pdist = Math.hypot(prop.x - p.x, prop.y - p.y);
        if (pdist <= p.radius + prop.radius) {
          prop.hp -= p.damage;
          prop.hurtTimer = 0.1;
          this.spawnHitParticles(prop.x, prop.y, p.color);
          p.pierce--;
          if (p.pierce <= 0) {
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  // Update Animal Companions & Matilha with Solid Physics, No Teleporting, and 360 AoE Combat
  private updateCompanions(dt: number) {
    if (this.companions.length === 0) return;

    // 1. Pack member lifespans and cleanup
    for (let i = this.companions.length - 1; i >= 0; i--) {
      const comp = this.companions[i];
      if (comp.isPackMember && comp.packDuration !== undefined) {
        comp.packDuration -= dt;
        if (comp.packDuration <= 0) {
          // Despawn pack dog with golden smoke particles
          this.spawnHitParticles(comp.x, comp.y, '#f59e0b', true);
          this.companions.splice(i, 1);
        }
      }
    }

    const totalComps = this.companions.length;
    if (totalComps === 0) return;

    for (let i = 0; i < totalComps; i++) {
      const comp = this.companions[i];
      comp.vx = comp.vx || 0;
      comp.vy = comp.vy || 0;

      if (comp.attackTimer && comp.attackTimer > 0) {
        comp.attackTimer -= dt;
      }
      if (comp.targetTimer && comp.targetTimer > 0) {
        comp.targetTimer -= dt;
      }

      const distToPlayer = Math.hypot(comp.x - this.playerX, comp.y - this.playerY);

      // Verify or acquire living enemy target
      let currentTarget: Enemy | null = null;
      if (comp.targetEnemyId !== null && comp.targetEnemyId !== undefined) {
        currentTarget = this.enemies.find((e) => e.id === comp.targetEnemyId && e.hp > 0) || null;
        if (currentTarget) {
          const dComp = Math.hypot(currentTarget.x - comp.x, currentTarget.y - comp.y);
          if (dComp > 340 || (comp.targetTimer && comp.targetTimer <= 0)) {
            currentTarget = null;
            comp.targetEnemyId = null;
          }
        } else {
          comp.targetEnemyId = null;
        }
      }

      // If no current target, search for closest monster around Cusco or Player (threat radius)
      if (!currentTarget) {
        let bestEnemy: Enemy | null = null;
        let bestDist = comp.isPackMember ? 360 : 250;

        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          const dComp = Math.hypot(e.x - comp.x, e.y - comp.y);
          if (dComp < bestDist) {
            bestDist = dComp;
            bestEnemy = e;
          }
        }

        if (bestEnemy) {
          currentTarget = bestEnemy;
          comp.targetEnemyId = bestEnemy.id;
          comp.targetTimer = comp.isPackMember ? 2.5 : 1.6;
        }
      }

      // Movement & Combat steering
      if (currentTarget) {
        const dx = currentTarget.x - comp.x;
        const dy = currentTarget.y - comp.y;
        const dEnemy = Math.hypot(dx, dy);
        const biteRange = comp.radius + currentTarget.radius + 12;
        const angle = Math.atan2(dy, dx);

        if (dEnemy > biteRange) {
          // Sprint towards target
          comp.state = 'run';
          comp.animFrame += dt * 10;
          comp.facingLeft = Math.cos(angle) < 0;

          const speed = comp.speed * (comp.isPackMember ? 1.25 : 1.1);
          const desiredVx = Math.cos(angle) * speed;
          const desiredVy = Math.sin(angle) * speed;

          comp.vx += (desiredVx - comp.vx) * 0.18;
          comp.vy += (desiredVy - comp.vy) * 0.18;
        } else {
          // Within melee bite range: attack primary target and splash surrounding enemies!
          comp.state = 'bark';
          comp.facingLeft = Math.cos(angle) < 0;

          if (!comp.attackTimer || comp.attackTimer <= 0) {
            comp.attackTimer = comp.attackCooldown;
            if (Math.random() < 0.6) {
              survivorsAudio.playDogBite();
            } else {
              survivorsAudio.playDogBark();
            }

            // Damage primary target with species bonus
            const speciesKey = currentTarget.spriteShape || currentTarget.type || 'skeleton';
            const speciesBonus = this.getSpeciesDamageMultiplier(speciesKey);
            const biteDamage = Math.round(comp.damage * (1 + speciesBonus));

            currentTarget.hp -= biteDamage;
            currentTarget.hurtTimer = 0.12;
            this.recordDamage(biteDamage);

            // Solid physical bite knockback
            const knockForce = comp.isSupreme ? 140 : 90;
            currentTarget.knockbackX = Math.cos(angle) * knockForce;
            currentTarget.knockbackY = Math.sin(angle) * knockForce;

            const textCol = comp.isSupreme ? '#fbbf24' : '#f59e0b';
            this.spawnFloatingText(`🐾 ${biteDamage}`, currentTarget.x, currentTarget.y - 14, textCol, comp.isSupreme ? 15 : 12, comp.isSupreme);
            this.spawnHitParticles(currentTarget.x, currentTarget.y, textCol);

            // Track stats in weapon
            const cuscoWeapon = this.activeWeapons.find((w) => w.id === 'cusco' || w.id === 'cusco_supremo');
            if (cuscoWeapon) {
              cuscoWeapon.totalDamageDealt += biteDamage;
              cuscoWeapon.hitsCount++;
            }

            // Splash damage to ALL other enemies surrounding Cusco (360 degrees, radius 60px)
            const splashRadius = comp.radius + 40;
            for (const otherEnemy of this.enemies) {
              if (otherEnemy.hp <= 0 || otherEnemy.id === currentTarget.id) continue;
              const dSplash = Math.hypot(otherEnemy.x - comp.x, otherEnemy.y - comp.y);
              if (dSplash <= splashRadius + otherEnemy.radius) {
                const splashDmg = Math.round(biteDamage * 0.5);
                otherEnemy.hp -= splashDmg;
                otherEnemy.hurtTimer = 0.1;
                this.recordDamage(splashDmg);

                const aPush = Math.atan2(otherEnemy.y - comp.y, otherEnemy.x - comp.x);
                otherEnemy.knockbackX = Math.cos(aPush) * 70;
                otherEnemy.knockbackY = Math.sin(aPush) * 70;

                if (cuscoWeapon) {
                  cuscoWeapon.totalDamageDealt += splashDmg;
                  cuscoWeapon.hitsCount++;
                }
              }
            }

            // Bark shockwave projectile
            this.projectiles.push({
              id: this.nextProjId++,
              weaponId: comp.isSupreme ? 'cusco_supremo' : 'cusco',
              x: comp.x + Math.cos(angle) * 10,
              y: comp.y + Math.sin(angle) * 10,
              vx: Math.cos(angle) * 80,
              vy: Math.sin(angle) * 80,
              radius: comp.isSupreme ? 48 : 32,
              damage: Math.round(biteDamage * 0.45),
              isCrit: comp.isSupreme,
              pierce: 99,
              hitEnemies: new Set([currentTarget.id]),
              duration: 0.25,
              maxDuration: 0.25,
              color: comp.isSupreme ? '#fde047' : '#f59e0b',
              extra: { isDogBark: true },
            });

            if (currentTarget.hp <= 0) {
              comp.targetEnemyId = null;
              currentTarget = null;
            }
          }
        }
      } else {
        // Follow Master (Steering physics - strictly NO teleporting)
        let slotAngle: number;
        let slotDist = 45;
        const backAngle = this.facingLeft ? 0 : Math.PI;

        if (totalComps === 1) {
          slotAngle = backAngle + 0.35;
          slotDist = 45;
        } else {
          const spread = Math.PI * 0.9;
          slotAngle = backAngle - spread / 2 + (spread / (totalComps - 1 || 1)) * i;
          slotDist = 40 + (i % 3) * 18;
        }

        const targetX = this.playerX + Math.cos(slotAngle) * slotDist;
        const targetY = this.playerY + Math.sin(slotAngle) * slotDist;
        const distToSlot = Math.hypot(targetX - comp.x, targetY - comp.y);

        if (distToSlot > 16) {
          const moveAngle = Math.atan2(targetY - comp.y, targetX - comp.x);
          comp.facingLeft = Math.cos(moveAngle) < 0;
          comp.state = 'run';
          comp.animFrame += dt * 8;

          // Catch-up acceleration if master runs fast
          const catchUpMult = distToPlayer > 300 ? 2.5 : (distToPlayer > 180 ? 1.6 : 1.0);
          const desiredVx = Math.cos(moveAngle) * comp.speed * catchUpMult;
          const desiredVy = Math.sin(moveAngle) * comp.speed * catchUpMult;

          comp.vx += (desiredVx - comp.vx) * 0.2;
          comp.vy += (desiredVy - comp.vy) * 0.2;
        } else {
          comp.state = 'idle';
          comp.facingLeft = this.facingLeft;
          comp.vx *= 0.6;
          comp.vy *= 0.6;
        }
      }

      // 2. SOLID COLLISION: Companion vs Enemies (Solid body push resolution)
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        const edx = enemy.x - comp.x;
        const edy = enemy.y - comp.y;
        const eDist = Math.hypot(edx, edy);
        const minDist = comp.radius + enemy.radius;

        if (eDist < minDist && eDist > 0.001) {
          const overlap = minDist - eDist;
          const nx = edx / eDist;
          const ny = edy / eDist;

          // Cusco is solid! Pushes enemy away, resists pushing back
          enemy.x += nx * overlap * 0.7;
          enemy.y += ny * overlap * 0.7;
          comp.x -= nx * overlap * 0.3;
          comp.y -= ny * overlap * 0.3;
        }
      }

      // 3. SOLID COLLISION: Companion vs Companion (Flocking separation)
      for (let j = i + 1; j < totalComps; j++) {
        const otherComp = this.companions[j];
        const cdx = otherComp.x - comp.x;
        const cdy = otherComp.y - comp.y;
        const cDist = Math.hypot(cdx, cdy);
        const minSep = comp.radius + otherComp.radius + 6;

        if (cDist < minSep && cDist > 0.001) {
          const overlap = (minSep - cDist) * 0.5;
          const nx = cdx / cDist;
          const ny = cdy / cDist;

          comp.x -= nx * overlap;
          comp.y -= ny * overlap;
          otherComp.x += nx * overlap;
          otherComp.y += ny * overlap;
        }
      }

      // Integrate continuous position from velocity
      comp.x += comp.vx * dt;
      comp.y += comp.vy * dt;

      // Friction / Velocity damping
      comp.vx *= 0.88;
      comp.vy *= 0.88;
    }
  }

  // Trigger Special Ability: Invocar Matilha de Cuscos Caramelos dos Pampas
  public triggerSpecialAbility(): boolean {
    if (this.specialCooldownTimer > 0 || this.isGameOver || this.isPaused) {
      return false;
    }

    // Cooldown reduction calculation
    const cdr = Math.min(0.65, this.stats.cooldownReduction || 0);
    this.specialMaxCooldown = Math.max(8, 20 * (1 - cdr));
    this.specialCooldownTimer = this.specialMaxCooldown;

    // Audio: Legendary Howl + Gaita flourish
    survivorsAudio.playDogHowl();
    survivorsAudio.playGaitaRiff();

    // Screen Shake
    this.screenShake = 16;

    // Golden shockwave projectile from player
    this.projectiles.push({
      id: this.nextProjId++,
      weaponId: 'cusco_supremo',
      x: this.playerX,
      y: this.playerY,
      vx: 0,
      vy: 0,
      radius: 130 * this.stats.area,
      damage: Math.round(95 * this.stats.might),
      isCrit: true,
      pierce: 999,
      hitEnemies: new Set(),
      duration: 0.4,
      maxDuration: 0.4,
      color: '#fbbf24',
      extra: { isSonicBarkShockwave: true },
    });

    this.spawnFloatingText('🐺 MATILHA DOS PAMPAS!', this.playerX, this.playerY - 45, '#fbbf24', 20, true);

    // Summon 7 loyal caramel dog companions forming the Matilha!
    const packCount = 7;
    const packDuration = 10; // 10 seconds of ferocious pack hunting frenzy

    for (let i = 0; i < packCount; i++) {
      const angle = (Math.PI * 2 / packCount) * i + (Math.random() - 0.5) * 0.3;
      const spawnDist = 45 + Math.random() * 35;
      const compId = this.nextCompanionId++;

      this.companions.push({
        id: compId,
        type: 'cusco',
        name: `Cusco Caramelo #${i + 1}`,
        x: this.playerX + Math.cos(angle) * spawnDist,
        y: this.playerY + Math.sin(angle) * spawnDist,
        vx: Math.cos(angle) * 140,
        vy: Math.sin(angle) * 140,
        radius: 15 * this.stats.area,
        damage: Math.round(75 * this.stats.might),
        speed: 260 * this.stats.moveSpeed,
        isSupreme: true,
        facingLeft: Math.cos(angle) < 0,
        animFrame: Math.random() * 5,
        state: 'run',
        attackCooldown: 0.3,
        attackTimer: Math.random() * 0.15,
        isPackMember: true,
        packDuration,
        packMaxDuration: packDuration,
      });

      this.spawnHitParticles(this.playerX + Math.cos(angle) * spawnDist, this.playerY + Math.sin(angle) * spawnDist, '#fbbf24', true);
    }

    return true;
  }

  // Update Area of Effect Zones (Holy Water puddles, etc.)
  private updateAreaZones(dt: number) {
    for (let i = this.areaZones.length - 1; i >= 0; i--) {
      const z = this.areaZones[i];
      z.duration -= dt;
      z.tickTimer -= dt;

      if (z.duration <= 0) {
        this.areaZones.splice(i, 1);
        continue;
      }

      // If La Borra, slowly drift toward player
      if (z.weaponId === 'la_borra') {
        const angle = Math.atan2(this.playerY - z.y, this.playerX - z.x);
        z.x += Math.cos(angle) * 50 * dt;
        z.y += Math.sin(angle) * 50 * dt;
      }

      // Damage tick
      if (z.tickTimer <= 0) {
        z.tickTimer = 0.25;
        for (const e of this.enemies) {
          const dist = Math.hypot(e.x - z.x, e.y - z.y);
          if (dist <= z.radius + e.radius) {
            const speciesKey = e.spriteShape || e.type || 'skeleton';
            const speciesBonus = this.getSpeciesDamageMultiplier(speciesKey);
            const actualDamage = Math.round(z.damage * (1 + speciesBonus));

            e.hp -= actualDamage;
            this.recordDamage(actualDamage);
            e.hurtTimer = 0.08;
            this.spawnFloatingText(actualDamage.toString(), e.x, e.y - 8, speciesBonus > 0 ? '#38bdf8' : '#67e8f9', 12);

            // Holy Water & La Borra ignite enemies in the holy flame pool
            this.applyStatusEffect(e, 'burned', 2.5, 12);

            const weapon = this.activeWeapons.find((w) => w.id === z.weaponId);
            if (weapon) {
              weapon.totalDamageDealt += actualDamage;
              weapon.hitsCount++;
            }
          }
        }

        // Damage breakable props in ground pool
        for (const prop of this.breakableProps) {
          const dist = Math.hypot(prop.x - z.x, prop.y - z.y);
          if (dist <= z.radius + prop.radius) {
            prop.hp -= z.damage;
            prop.hurtTimer = 0.08;
            this.spawnHitParticles(prop.x, prop.y, '#38bdf8');
          }
        }
      }
    }
  }

  // Dynamic wave spawner based on survival time
  private updateSpawner(dt: number) {
    this.spawnTimer -= dt;
    this.waveDifficulty = 1 + this.timeAlive / 60; // ramps up every minute

    // Performance optimization: prevent extreme swarms that choke framerate
    if (this.enemies.length >= 220) {
      this.spawnTimer = 0.4;
      return;
    }

    if (this.spawnTimer <= 0) {
      // Spawn batch of monsters based on current minute
      const spawnInterval = Math.max(0.15, 0.9 - this.timeAlive / 240);
      this.spawnTimer = spawnInterval;

      const batchCount = Math.min(8, Math.floor(2 + this.timeAlive / 45));
      for (let i = 0; i < batchCount; i++) {
        this.spawnRandomEnemy();
      }
    }

    // Special Boss Spawns
    const minute = Math.floor(this.timeAlive / 60);
    // 2nd minute boss: Boitatá (Cobra de Fogo)
    if (this.timeAlive >= 120 && !this.enemies.some((e) => e.spriteShape === 'boss_boitata') && minute === 2) {
      this.spawnBoss('boss_boitata');
    }
    // 3rd minute boss: Giant Skeletal King
    if (this.timeAlive >= 180 && !this.enemies.some((e) => e.spriteShape === 'boss_king') && minute === 3) {
      this.spawnBoss('boss_king');
    }
    // 4th minute boss: Teiniaguá (A Princesa Encantada)
    if (this.timeAlive >= 240 && !this.enemies.some((e) => e.spriteShape === 'boss_teiniagua') && minute === 4) {
      this.spawnBoss('boss_teiniagua');
    }
    // 5th minute boss: Vampire Lord
    if (this.timeAlive >= 300 && !this.enemies.some((e) => e.spriteShape === 'vampire_lord') && minute === 5) {
      this.spawnBoss('vampire_lord');
    }
    // 10th minute boss: The Red Death
    if (this.timeAlive >= 600 && !this.enemies.some((e) => e.spriteShape === 'reaper') && minute === 10) {
      this.spawnBoss('reaper');
    }
    // 15th minute legendary boss: O Negrinho do Pastoreio
    if (this.timeAlive >= 900 && !this.enemies.some((e) => e.spriteShape === 'boss_negrinho') && minute === 15) {
      this.spawnBoss('boss_negrinho');
    }
  }

  // Spawn enemy in ring just outside the screen
  private spawnRandomEnemy() {
    const spawnDist = 650 + Math.random() * 100;
    const angle = Math.random() * Math.PI * 2;
    const x = this.playerX + Math.cos(angle) * spawnDist;
    const y = this.playerY + Math.sin(angle) * spawnDist;

    // Pick monster type based on elapsed time & stage
    const t = this.timeAlive;
    let shape: Enemy['spriteShape'] = 'bat';
    let hp = 18 * this.waveDifficulty;
    let speed = 80;
    let damage = 6;
    let xpValue = 1;
    let radius = 10;
    let color = '#3b0764';
    let goldChance = 0.15;

    // Stage affinity boosts
    const isChurrascaria = this.stage.id === 'churrascaria_shopping';
    const isLagoa = this.stage.id === 'lagoa_patos';
    const isAparados = this.stage.id === 'aparados_serra';

    if (t < 40) {
      // Minute 0: Bats, Lone Skeletons, and Gaúcho de Apartamento
      const roll = Math.random();
      if (roll < (isChurrascaria ? 0.45 : 0.25)) {
        shape = 'gaucho_apartamento';
        speed = 125;
        hp = 32 * this.waveDifficulty;
        radius = 11;
        damage = 7;
        goldChance = 0.45;
        color = '#f43f5e';
      } else if (roll < 0.65) {
        shape = 'bat';
        speed = 110;
        hp = 14;
        radius = 9;
        color = '#3b0764';
      } else {
        shape = 'skeleton';
        speed = 70;
        hp = 25;
        radius = 12;
        color = '#e2e8f0';
      }
    } else if (t < 120) {
      // Minute 1-2: Skeletons, Ghouls, Wolves, Saci Pererê & Gaúcho de Apartamento
      const roll = Math.random();
      if (roll < 0.25) {
        shape = 'saci';
        speed = 145;
        hp = 42 * this.waveDifficulty;
        radius = 11;
        damage = 9;
        color = '#dc2626';
        if (Math.random() < 0.3) survivorsAudio.playSaciWhirlwind();
      } else if (roll < 0.5) {
        shape = 'gaucho_apartamento';
        speed = 135;
        hp = 48 * this.waveDifficulty;
        radius = 11;
        damage = 8;
        goldChance = 0.4;
        color = '#f43f5e';
      } else if (roll < 0.75) {
        shape = 'ghoul';
        speed = 85;
        hp = 45 * this.waveDifficulty;
        radius = 13;
        color = '#065f46';
      } else {
        shape = 'wolf';
        speed = 140;
        hp = 35 * this.waveDifficulty;
        radius = 14;
        color = '#334155';
      }
    } else if (t < 240) {
      // Minute 2-4: Wolves, Wraiths, Curupira, Mula sem Cabeça, Saci
      const roll = Math.random();
      if (roll < 0.25) {
        shape = 'curupira';
        speed = 155;
        hp = 65 * this.waveDifficulty;
        radius = 12;
        damage = 13;
        color = '#15803d';
      } else if (roll < 0.45) {
        shape = 'saci';
        speed = 150;
        hp = 55 * this.waveDifficulty;
        radius = 11;
        damage = 11;
        color = '#dc2626';
      } else if (roll < 0.65) {
        shape = 'mula_sem_cabeca';
        speed = 135;
        hp = 160 * this.waveDifficulty;
        radius = 17;
        damage = 20;
        color = '#312e81';
      } else if (roll < 0.85) {
        shape = 'wraith';
        speed = 95;
        hp = 70 * this.waveDifficulty;
        radius = 12;
        color = '#6b21a8';
      } else {
        shape = 'golem';
        speed = 50;
        hp = 180 * this.waveDifficulty;
        radius = 18;
        color = '#78716c';
      }
    } else {
      // Minute 4+: Heavy Swarms & Elites (Mula, Curupira, Saci, Golem)
      const roll = Math.random();
      if (roll < 0.25) {
        shape = 'mula_sem_cabeca';
        speed = 140;
        hp = 240 * this.waveDifficulty;
        radius = 18;
        damage = 24;
        color = '#312e81';
      } else if (roll < 0.5) {
        shape = 'curupira';
        speed = 160;
        hp = 95 * this.waveDifficulty;
        radius = 12;
        damage = 15;
        color = '#15803d';
      } else if (roll < 0.7) {
        shape = 'gaucho_apartamento';
        speed = 145;
        hp = 90 * this.waveDifficulty;
        radius = 11;
        damage = 12;
        goldChance = 0.5;
        color = '#f43f5e';
      } else if (roll < 0.85) {
        shape = 'saci';
        speed = 155;
        hp = 85 * this.waveDifficulty;
        radius = 11;
        damage = 14;
        color = '#dc2626';
      } else {
        shape = 'golem';
        speed = 60;
        hp = 300 * this.waveDifficulty;
        radius = 18;
        color = '#78716c';
      }
    }

    this.enemies.push({
      id: this.nextEnemyId++,
      type: shape,
      name: shape.toUpperCase(),
      tier: 'mob',
      x,
      y,
      radius,
      speed,
      maxHp: hp,
      hp,
      damage,
      xpValue,
      goldChance,
      color,
      secondaryColor: '#ffffff',
      spriteShape: shape,
      facingLeft: x > this.playerX,
      hurtTimer: 0,
      knockbackX: 0,
      knockbackY: 0,
      animFrame: Math.random() * 10,
      animSpeed: 1,
    });
  }

  // Spawn Elite Boss
  public spawnBoss(shape: 'boss_king' | 'vampire_lord' | 'reaper' | 'boss_boitata' | 'boss_teiniagua' | 'boss_negrinho') {
    const angle = Math.random() * Math.PI * 2;
    const dist = 550;
    const x = this.playerX + Math.cos(angle) * dist;
    const y = this.playerY + Math.sin(angle) * dist;

    let hp = 1500;
    let speed = 75;
    let damage = 25;
    let radius = 24;
    let bossName = 'Rei Esqueleto';
    let bossColor = '#dc2626';

    if (shape === 'boss_boitata') {
      hp = 2200;
      speed = 85;
      damage = 30;
      radius = 28;
      bossName = 'Boitatá, Cobra de Fogo';
      bossColor = '#ea580c';
    } else if (shape === 'boss_teiniagua') {
      hp = 3000;
      speed = 80;
      damage = 32;
      radius = 26;
      bossName = 'Teiniaguá, Princesa Moura';
      bossColor = '#d97706';
    } else if (shape === 'boss_negrinho') {
      hp = Math.round(9500 * Math.max(1, this.waveDifficulty));
      speed = 105;
      damage = 42;
      radius = 28;
      bossName = 'O Negrinho do Pastoreio';
      bossColor = '#facc15';
    } else if (shape === 'vampire_lord') {
      hp = 3500;
      speed = 90;
      damage = 35;
      radius = 26;
      bossName = 'Lorde Vampiro';
      bossColor = '#b91c1c';
    } else if (shape === 'reaper') {
      hp = 99999;
      speed = 120;
      damage = 999;
      radius = 30;
      bossName = 'A Morte Rubra';
      bossColor = '#450a0a';
    }

    this.spawnFloatingText(`⚠️ CHEFÃO: ${bossName.toUpperCase()}!`, this.playerX, this.playerY - 45, '#ef4444', 18, true);
    this.screenShake = 0.4;

    this.enemies.push({
      id: this.nextEnemyId++,
      type: shape,
      name: bossName,
      tier: 'boss',
      x,
      y,
      radius,
      speed,
      maxHp: hp,
      hp,
      damage,
      xpValue: shape === 'boss_negrinho' ? 120 : 50,
      goldChance: 1.0,
      color: bossColor,
      secondaryColor: '#f59e0b',
      spriteShape: shape,
      facingLeft: x > this.playerX,
      hurtTimer: 0,
      knockbackX: 0,
      knockbackY: 0,
      animFrame: 0,
      animSpeed: 1,
      teleportTimer: 5.0,
      teleportState: 'idle',
      specialAoeTimer: 3.5,
      bossAttackTimer: 2.0,
    });
  }

  // Debug & shortcut to invoke O Negrinho do Pastoreio directly
  public spawnNegrinhoBoss() {
    this.spawnBoss('boss_negrinho');
  }

  // Update enemies movement, status effects, player collisions & death drops
  private updateEnemies(dt: number) {
    const isGloballyFrozen = this.freezeTimer > 0;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // White hurt flash decay
      if (e.hurtTimer > 0) e.hurtTimer -= dt;

      // Knockback decay
      e.x += e.knockbackX * dt;
      e.y += e.knockbackY * dt;
      e.knockbackX *= 0.82;
      e.knockbackY *= 0.82;

      // ================= PROCESS STATUS EFFECTS =================
      let speedMultiplier = 1.0;
      let isEnemyFrozen = isGloballyFrozen;

      if (e.statusEffects && e.statusEffects.length > 0) {
        for (let sIdx = e.statusEffects.length - 1; sIdx >= 0; sIdx--) {
          const eff = e.statusEffects[sIdx];
          eff.duration -= dt;

          if (eff.type === 'frozen') {
            isEnemyFrozen = true;
            speedMultiplier = 0;
          } else if (eff.type === 'slowed') {
            speedMultiplier *= Math.max(0.2, 1.0 - (eff.potency || 0.45));
          } else if (eff.type === 'burned') {
            eff.tickTimer = (eff.tickTimer || 0) + dt;
            if (eff.tickTimer >= 0.5) {
              eff.tickTimer = 0;
              const burnDamage = Math.max(1, Math.round((eff.potency || 10) * (0.8 + this.stats.might * 0.3)));
              e.hp -= burnDamage;
              this.recordDamage(burnDamage);
              e.hurtTimer = 0.08;
              this.spawnFloatingText(burnDamage.toString(), e.x + (Math.random() - 0.5) * 8, e.y - 10, '#f97316', 11);
              this.spawnHitParticles(e.x, e.y, '#ea580c');
            }
          }

          if (eff.duration <= 0) {
            e.statusEffects.splice(sIdx, 1);
          }
        }
      }

      // Blizzard weather slows all enemies by 20%
      if (this.weather?.type === 'blizzard') {
        speedMultiplier *= 0.8;
      }

      // Animation frame
      e.animFrame += dt * (isEnemyFrozen ? 0 : 4);

      // Check Enemy Death
      if (e.hp <= 0) {
        this.handleEnemyDeath(e);
        this.enemies.splice(i, 1);
        continue;
      }

      // Performance optimization: recycle enemies that wander too far away (> 1400px)
      const distToPlayer = Math.hypot(this.playerX - e.x, this.playerY - e.y);
      if (distToPlayer > 1400 && e.tier !== 'boss') {
        const spawnDist = 650 + Math.random() * 80;
        const angle = Math.random() * Math.PI * 2;
        e.x = this.playerX + Math.cos(angle) * spawnDist;
        e.y = this.playerY + Math.sin(angle) * spawnDist;
        continue;
      }

      // Don't advance if frozen by Stopwatch or Ice debuff
      if (isEnemyFrozen) continue;

      // Specialized Boss AI: O Negrinho do Pastoreio (Teleport & Holy AoE Hazards)
      if (e.spriteShape === 'boss_negrinho') {
        this.updateBossNegrinho(e, dt, isEnemyFrozen);
        if (e.teleportState === 'charging') {
          // Stationary while focusing celestial light for teleport jump
          continue;
        }
      }

      // Move toward player
      const angle = Math.atan2(this.playerY - e.y, this.playerX - e.x);
      e.x += Math.cos(angle) * e.speed * speedMultiplier * dt;
      e.y += Math.sin(angle) * e.speed * speedMultiplier * dt;
      e.facingLeft = e.x > this.playerX;

      // Collision with player
      if (distToPlayer <= e.radius + 14) {
        if (this.invulnerableTimer <= 0) {
          // Blood moon enhances enemy damage by 25%
          const weatherDmgMult = this.weather?.type === 'blood_moon' ? 1.25 : 1.0;
          const actualDamage = Math.max(1, Math.round(e.damage * weatherDmgMult - this.stats.armor));
          this.stats.hp -= actualDamage;
          this.invulnerableTimer = 0.45;
          this.screenShake = 0.35;
          survivorsAudio.playPlayerHurt();
          this.spawnFloatingText(`-${actualDamage}`, this.playerX, this.playerY - 20, '#ef4444', 16, true);

          // Check Player Death / Revive
          if (this.stats.hp <= 0) {
            if (this.stats.revives > 0) {
              this.stats.revives--;
              this.stats.hp = this.stats.maxHp * 0.5;
              this.invulnerableTimer = 2.0;
              this.triggerRosaryNuke(); // clears screen on revive
              this.spawnFloatingText('RESSURREIÇÃO!', this.playerX, this.playerY - 30, '#38bdf8', 20, true);
            } else {
              this.handleGameOver(false);
              return;
            }
          }
        }
      }
    }
  }

  // Specialized AI & Attack Patterns for O Negrinho do Pastoreio (15-min Boss)
  private updateBossNegrinho(e: Enemy, dt: number, isFrozen: boolean) {
    if (isFrozen) return;

    // Golden divine aura sparks radiating from the sacred steed
    if (Math.random() < 0.2) {
      this.particles.push({
        x: e.x + (Math.random() - 0.5) * 20,
        y: e.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 30,
        vy: -20 - Math.random() * 30,
        size: 2.5,
        color: '#fef08a',
        alpha: 0.9,
        life: 0.45,
        maxLife: 0.45,
        shape: 'spark',
        glow: true,
      });
    }

    // ================= 1. TELETRANSPORTE SAGRADO =================
    e.teleportTimer = (e.teleportTimer || 5.0) - dt;

    if (e.teleportState === 'charging') {
      // Golden light converging toward the destination beacon
      if (e.teleportTargetX !== undefined && e.teleportTargetY !== undefined && Math.random() < 0.4) {
        const ringAng = Math.random() * Math.PI * 2;
        const ringDist = 40 + Math.random() * 40;
        this.particles.push({
          x: e.teleportTargetX + Math.cos(ringAng) * ringDist,
          y: e.teleportTargetY + Math.sin(ringAng) * ringDist,
          vx: -Math.cos(ringAng) * 60,
          vy: -Math.sin(ringAng) * 60,
          size: 3,
          color: '#facc15',
          alpha: 1,
          life: 0.35,
          maxLife: 0.35,
          shape: 'spark',
          glow: true,
        });
      }

      if (e.teleportTimer <= 0) {
        // Complete the holy teleport jump!
        survivorsAudio.playNegrinhoTeleport();

        // Flash of light at previous position
        for (let p = 0; p < 12; p++) {
          const pAng = (p * Math.PI * 2) / 12;
          this.particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(pAng) * 80,
            vy: Math.sin(pAng) * 80,
            size: 3.5,
            color: '#fef08a',
            alpha: 1,
            life: 0.5,
            maxLife: 0.5,
            shape: 'spark',
            glow: true,
          });
        }

        // Instant repositioning
        e.x = e.teleportTargetX || e.x;
        e.y = e.teleportTargetY || e.y;
        e.teleportState = 'idle';
        e.teleportTimer = 6.0 + Math.random() * 2.0;

        // Sacred arrival blast
        this.screenShake = 0.35;
        this.spawnFloatingText('⚡ SALTO CELESTIAL!', e.x, e.y - 35, '#fef08a', 16, true);

        // Flash of light at landing spot
        for (let p = 0; p < 16; p++) {
          const pAng = (p * Math.PI * 2) / 16;
          this.particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(pAng) * 110,
            vy: Math.sin(pAng) * 110,
            size: 4,
            color: '#ffffff',
            alpha: 1,
            life: 0.6,
            maxLife: 0.6,
            shape: 'spark',
            glow: true,
          });
        }
      }
    } else {
      // Idle / galloping state: check if it's time to start telegraphing a teleport
      if (e.teleportTimer <= 0) {
        e.teleportState = 'charging';
        e.teleportTimer = 1.3; // 1.3 seconds telegraphed charge

        // Choose strategic landing location near player (110 - 140px away)
        const angle = Math.random() * Math.PI * 2;
        const dist = 110 + Math.random() * 30;
        const targetX = this.playerX + Math.cos(angle) * dist;
        const targetY = this.playerY + Math.sin(angle) * dist;
        e.teleportTargetX = targetX;
        e.teleportTargetY = targetY;

        // Create telegraphed arrival hazard zone on ground
        this.bossHazardZones.push({
          id: this.nextHazardId++,
          x: targetX,
          y: targetY,
          radius: 90,
          damage: 38,
          timer: 1.3,
          maxTimer: 1.3,
          duration: 0.9,
          detonated: false,
          type: 'teleport_arrival',
        });

        this.spawnFloatingText('⚠️ O NEGRINHO PREPARA O SALTO!', e.x, e.y - 30, '#fde047', 15, true);
      }
    }

    // ================= 2. DANO DE ÁREA: CÍRCULOS DE VELAS BENTAS =================
    e.specialAoeTimer = (e.specialAoeTimer || 4.0) - dt;
    if (e.specialAoeTimer <= 0) {
      e.specialAoeTimer = 4.8 + Math.random() * 2.0;

      survivorsAudio.playNegrinhoAoe();
      this.spawnFloatingText('🕯️ CONSAGRAÇÃO BENTA!', e.x, e.y - 36, '#facc15', 17, true);

      // Spawn 3 Sacred Candle circles:
      // 1 at current player location
      this.bossHazardZones.push({
        id: this.nextHazardId++,
        x: this.playerX,
        y: this.playerY,
        radius: 72,
        damage: 32,
        timer: 1.1,
        maxTimer: 1.1,
        duration: 1.5,
        detonated: false,
        type: 'candle_circle',
      });

      // 2 around the player at varying offsets to force movement
      const offsetAng = Math.random() * Math.PI * 2;
      for (let c = 1; c <= 2; c++) {
        const cAng = offsetAng + (c * Math.PI * 2) / 3;
        const cDist = 115 + Math.random() * 25;
        this.bossHazardZones.push({
          id: this.nextHazardId++,
          x: this.playerX + Math.cos(cAng) * cDist,
          y: this.playerY + Math.sin(cAng) * cDist,
          radius: 68,
          damage: 30,
          timer: 1.25,
          maxTimer: 1.25,
          duration: 1.5,
          detonated: false,
          type: 'candle_circle',
        });
      }
    }
  }

  // Update Boss AoE hazards (Telegraphing, Detonation & Lingering Damage)
  private updateBossHazards(dt: number) {
    if (this.bossHazardZones.length === 0) return;

    for (let i = this.bossHazardZones.length - 1; i >= 0; i--) {
      const h = this.bossHazardZones[i];

      if (!h.detonated) {
        h.timer -= dt;

        if (h.timer <= 0) {
          h.detonated = true;
          survivorsAudio.playNegrinhoAoe();
          this.screenShake = 0.25;

          // Detonation golden spark eruption
          for (let p = 0; p < 14; p++) {
            const pAng = (p * Math.PI * 2) / 14;
            this.particles.push({
              x: h.x,
              y: h.y,
              vx: Math.cos(pAng) * 95,
              vy: Math.sin(pAng) * 95,
              size: 3.5,
              color: '#fef08a',
              alpha: 1,
              life: 0.5,
              maxLife: 0.5,
              shape: 'spark',
              glow: true,
            });
          }

          // Initial burst damage to player
          const distToPlayer = Math.hypot(this.playerX - h.x, this.playerY - h.y);
          if (distToPlayer <= h.radius) {
            if (this.invulnerableTimer <= 0) {
              const actualDamage = Math.max(1, Math.round(h.damage - this.stats.armor));
              this.stats.hp -= actualDamage;
              this.invulnerableTimer = 0.45;
              this.screenShake = 0.35;
              survivorsAudio.playPlayerHurt();
              this.spawnFloatingText(`-${actualDamage} DANO SAGRADO!`, this.playerX, this.playerY - 22, '#f59e0b', 16, true);

              if (this.stats.hp <= 0) {
                if (this.stats.revives > 0) {
                  this.stats.revives--;
                  this.stats.hp = this.stats.maxHp * 0.5;
                  this.invulnerableTimer = 2.0;
                  this.triggerRosaryNuke();
                  this.spawnFloatingText('RESSURREIÇÃO!', this.playerX, this.playerY - 30, '#38bdf8', 20, true);
                } else {
                  this.handleGameOver(false);
                  return;
                }
              }
            }
          }
        }
      } else {
        // Detonated state: lingering consecrated fire
        h.duration -= dt;

        // Lingering burn if player stands inside flame
        const distToPlayer = Math.hypot(this.playerX - h.x, this.playerY - h.y);
        if (distToPlayer <= h.radius && this.invulnerableTimer <= 0) {
          const burnTick = Math.max(1, Math.round(7 - this.stats.armor));
          this.stats.hp -= burnTick;
          this.invulnerableTimer = 0.35;
          survivorsAudio.playPlayerHurt();
          this.spawnFloatingText(`-${burnTick}`, this.playerX, this.playerY - 18, '#ea580c', 12);

          if (this.stats.hp <= 0) {
            if (this.stats.revives > 0) {
              this.stats.revives--;
              this.stats.hp = this.stats.maxHp * 0.5;
              this.invulnerableTimer = 2.0;
              this.triggerRosaryNuke();
              this.spawnFloatingText('RESSURREIÇÃO!', this.playerX, this.playerY - 30, '#38bdf8', 20, true);
            } else {
              this.handleGameOver(false);
              return;
            }
          }
        }

        if (h.duration <= 0) {
          this.bossHazardZones.splice(i, 1);
        }
      }
    }
  }

  // Handle enemy death & drop items
  private handleEnemyDeath(e: Enemy) {
    this.killsCount++;
    survivorsAudio.playMonsterDeath();

    // Sistema de partículas e marcas de respingos de sangue gaúcho
    this.spawnBloodSplatter(e.x, e.y, e);

    const species = e.spriteShape || e.type || 'skeleton';
    const prevKills = (this.initialBestiaryKills[species] || 0) + (this.inRunKillsBySpecies[species] || 0);
    this.inRunKillsBySpecies[species] = (this.inRunKillsBySpecies[species] || 0) + 1;
    const currentKills = prevKills + 1;

    // Trigger enemy catalog bestiary tracking callback
    if (this.onEnemyKilledCallback) {
      this.onEnemyKilledCallback(species);
    }

    // Milestone announcement for monster damage bonus!
    if (currentKills === 100 || currentKills === 500 || currentKills === 1500 || currentKills === 3000) {
      const bonusPct = Math.round(getMonsterSpeciesDamageMultiplier(species, currentKills) * 100);
      this.spawnFloatingText(
        `🏆 MARCO DE CAÇADOR: +${bonusPct}% DANO!`,
        e.x,
        e.y - 28,
        '#f59e0b',
        17,
        true
      );
      this.spawnHitParticles(e.x, e.y, '#fbbf24', true);
    }

    // Elites/Bosses always drop a Treasure Chest!
    if (e.tier === 'boss' || e.tier === 'elite') {
      // Recompensa Lendária do Boss d'O Negrinho do Pastoreio!
      if (e.spriteShape === 'boss_negrinho') {
        this.pickups.push({
          id: this.nextPickupId++,
          type: 'vela_negrinho',
          x: e.x + 22,
          y: e.y - 10,
          value: 1,
          radius: 18,
          magnetized: false,
          vx: 0,
          vy: 0,
          bobOffset: 0,
        });
        this.spawnFloatingText('🕯️ A VELA BENTA DO NEGRINHO SURGIU NO CHÃO! 🕯️', e.x, e.y - 35, '#fef08a', 18, true);
        this.screenShake = 0.5;
      }

      this.pickups.push({
        id: this.nextPickupId++,
        type: 'chest',
        x: e.x,
        y: e.y,
        value: 1,
        radius: 14,
        magnetized: false,
        vx: 0,
        vy: 0,
        bobOffset: Math.random() * 5,
      });
      return;
    }

    // Rare special drops: Food (Chicken), Magnet, Rosary, Freeze
    const rareRoll = Math.random();
    if (rareRoll < 0.008) {
      this.pickups.push({
        id: this.nextPickupId++,
        type: 'chicken',
        x: e.x,
        y: e.y,
        value: 30,
        radius: 12,
        magnetized: false,
        vx: 0,
        vy: 0,
        bobOffset: Math.random() * 5,
      });
    } else if (rareRoll < 0.012) {
      this.pickups.push({
        id: this.nextPickupId++,
        type: 'magnet',
        x: e.x,
        y: e.y,
        value: 1,
        radius: 12,
        magnetized: false,
        vx: 0,
        vy: 0,
        bobOffset: Math.random() * 5,
      });
    } else if (rareRoll < 0.015) {
      this.pickups.push({
        id: this.nextPickupId++,
        type: 'rosary',
        x: e.x,
        y: e.y,
        value: 1,
        radius: 12,
        magnetized: false,
        vx: 0,
        vy: 0,
        bobOffset: Math.random() * 5,
      });
    } else if (rareRoll < 0.018) {
      this.pickups.push({
        id: this.nextPickupId++,
        type: 'freeze',
        x: e.x,
        y: e.y,
        value: 5,
        radius: 12,
        magnetized: false,
        vx: 0,
        vy: 0,
        bobOffset: Math.random() * 5,
      });
    } else if (Math.random() < e.goldChance) {
      const coinVal = this.weather?.type === 'blood_moon' ? 2 : 1;
      this.pickups.push({
        id: this.nextPickupId++,
        type: 'coin',
        x: e.x,
        y: e.y,
        value: coinVal,
        radius: 8,
        magnetized: false,
        vx: 0,
        vy: 0,
        bobOffset: Math.random() * 5,
      });
    } else {
      // XP Gem Drop
      let gemType: PickupType = 'gem_blue';
      let gemVal = 1;

      if (e.xpValue >= 25) {
        gemType = 'gem_purple';
        gemVal = 25;
      } else if (e.xpValue >= 5) {
        gemType = 'gem_red';
        gemVal = 10;
      } else if (Math.random() < 0.15) {
        gemType = 'gem_green';
        gemVal = 5;
      }

      // Blood moon grants 30% XP bonus
      if (this.weather?.type === 'blood_moon') {
        gemVal = Math.round(gemVal * 1.3);
      }

      this.pickups.push({
        id: this.nextPickupId++,
        type: gemType,
        x: e.x,
        y: e.y,
        value: gemVal,
        radius: 8,
        magnetized: false,
        vx: 0,
        vy: 0,
        bobOffset: Math.random() * 5,
      });
    }
  }

  // Update Pickups: Magnet attraction and collection
  private updatePickups(dt: number) {
    const pickupRadius = this.stats.magnet;

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      const dist = Math.hypot(this.playerX - p.x, this.playerY - p.y);

      // Magnet attraction
      if (dist <= pickupRadius || p.magnetized) {
        p.magnetized = true;
        const angle = Math.atan2(this.playerY - p.y, this.playerX - p.x);
        const speed = 400 + Math.max(0, (500 - dist) * 1.5);
        p.x += Math.cos(angle) * speed * dt;
        p.y += Math.sin(angle) * speed * dt;
      }

      // Collect item
      if (dist <= 18) {
        this.collectPickup(p);
        this.pickups.splice(i, 1);
      }
    }
  }

  // Handle pickup collection effects
  private collectPickup(p: Pickup) {
    // Spawn satisfying XP / pickup collection particle burst
    const pColor = p.type === 'gem_purple' ? '#a855f7' :
                   p.type === 'gem_red' ? '#ef4444' :
                   p.type === 'gem_green' ? '#22c55e' :
                   p.type === 'coin' ? '#fbbf24' :
                   p.type === 'chicken' ? '#4ade80' :
                   p.type === 'magnet' ? '#c084fc' :
                   p.type === 'rosary' ? '#fef08a' :
                   p.type === 'freeze' ? '#38bdf8' : '#60a5fa';
    this.spawnPickupCollectionParticles(p.x, p.y, pColor);

    if (p.type.startsWith('gem_')) {
      survivorsAudio.playGemPickup();
      const gainedXp = p.value * this.stats.growth;
      this.currentXp += gainedXp;

      // Check level up
      if (this.currentXp >= this.nextLevelXp) {
        this.handleLevelUp();
      }
    } else if (p.type === 'coin' || p.type === 'coin_bag') {
      survivorsAudio.playGemPickup();
      const mult = this.goldFeverActive ? 3 : 1;
      const baseCoinVal = p.type === 'coin_bag' ? 50 : p.value * 5;
      const val = baseCoinVal * mult;
      this.coinsEarned += val;
      this.spawnFloatingText(`+${val} Pilas`, p.x, p.y - 12, '#fbbf24', 12, this.goldFeverActive);

      // Trigger or extend Gold Fever (Frenesi de Ouro)
      if (p.type === 'coin_bag' || Math.random() < 0.12) {
        if (!this.goldFeverActive) {
          this.triggerGoldFever(12);
        } else {
          this.goldFeverTimer = Math.min(25, this.goldFeverTimer + 6);
          this.spawnFloatingText('+6s FRENESI!', this.playerX, this.playerY - 35, '#facc15', 14, true);
        }
      }
    } else if (p.type === 'chicken') {
      survivorsAudio.playGemPickup();
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + p.value);
      this.spawnFloatingText(`+${p.value} HP`, this.playerX, this.playerY - 20, '#4ade80', 14);
    } else if (p.type === 'magnet') {
      this.triggerVacuumMagnet();
      this.spawnFloatingText('VÁCUO TOTAL!', this.playerX, this.playerY - 25, '#c084fc', 16, true);
    } else if (p.type === 'rosary') {
      this.triggerRosaryNuke();
    } else if (p.type === 'freeze') {
      this.freezeTimer = 6.0;
      for (const e of this.enemies) {
        this.applyStatusEffect(e, 'frozen', 6.0, 1);
      }
      this.spawnFloatingText('CONGELAMENTO TOTAL!', this.playerX, this.playerY - 25, '#38bdf8', 16, true);
    } else if (p.type === 'chest') {
      this.handleTreasureChest();
    } else if (p.type === 'vela_negrinho') {
      survivorsAudio.playNegrinhoMiracle();
      // O Milagre do Negrinho do Pastoreio:
      // 1. +1 Reza Forte (Revive extra)
      this.stats.revives = (this.stats.revives || 0) + 1;
      // 2. Restaura 100% da vida
      this.stats.hp = this.stats.maxHp;
      // 3. +35% de Sorte permanente na run
      this.stats.luck = Number(((this.stats.luck || 1.0) + 0.35).toFixed(2));
      // 4. +350 Pilas de ouro abençoadas
      this.coinsEarned += 350;
      // 5. Ativa o vácuo sagrado de todos os itens do chão
      this.triggerVacuumMagnet();
      // 6. Elimina os monstros comuns da tela com luz celestial
      this.triggerRosaryNuke();
      // 7. Efeitos visuais divinos
      this.rosaryFlash = 1.0;
      this.screenShake = 0.55;
      this.spawnFloatingText('✨ MILAGRE DO NEGRINHO DO PASTOREIO! ✨', this.playerX, this.playerY - 50, '#fef08a', 22, true);
      this.spawnFloatingText('+1 REZA FORTE | 100% VIDA | +35% SORTE | +350 PILAS', this.playerX, this.playerY - 26, '#38bdf8', 15, true);

      // Cascata de partículas celestiais
      for (let i = 0; i < 30; i++) {
        const ang = (Math.PI * 2 * i) / 30;
        this.particles.push({
          x: this.playerX,
          y: this.playerY,
          vx: Math.cos(ang) * (80 + Math.random() * 100),
          vy: Math.sin(ang) * (80 + Math.random() * 100),
          size: 4 + Math.random() * 3,
          color: i % 2 === 0 ? '#fef08a' : '#ffffff',
          alpha: 1,
          life: 1.0,
          maxLife: 1.0,
          shape: 'spark',
          glow: true,
        });
      }
    }
  }

  // Trigger Gold Fever (Modo Frenesi de Ouro / Pilas)
  public triggerGoldFever(duration: number = 12) {
    this.goldFeverActive = true;
    this.goldFeverTimer = duration;
    this.goldFeverMultiplier = 3;
    survivorsAudio.playGoldFever();
    this.spawnFloatingText('FRENESI DO PILA! (3x OURO)', this.playerX, this.playerY - 45, '#fbbf24', 20, true);
    this.screenShake = 0.4;

    // Burst of festive golden sparks
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      this.particles.push({
        x: this.playerX,
        y: this.playerY,
        vx: Math.cos(angle) * (70 + Math.random() * 90),
        vy: Math.sin(angle) * (70 + Math.random() * 90),
        size: 3.5 + Math.random() * 3,
        color: '#fef08a',
        alpha: 1,
        life: 0.75,
        maxLife: 0.75,
        shape: 'spark',
        glow: true,
      });
    }
  }

  // Vacuum Magnet triggered by item or daily perk
  public triggerVacuumMagnet() {
    survivorsAudio.playGemPickup();
    for (const item of this.pickups) {
      item.magnetized = true;
    }
  }

  // Screen Nuke by Rosary
  public triggerRosaryNuke() {
    survivorsAudio.playRosary();
    this.rosaryFlash = 1.0;
    this.screenShake = 0.6;

    for (const e of this.enemies) {
      if (e.tier !== 'boss') {
        this.recordDamage(e.hp);
        e.hp = 0;
      } else {
        this.recordDamage(800);
        e.hp -= 800;
      }
    }
    this.spawnFloatingText('JULGAMENTO SAGRADO!', this.playerX, this.playerY - 30, '#fef08a', 20, true);
  }

  // Level up trigger
  private handleLevelUp() {
    this.currentLevel++;
    this.currentXp -= this.nextLevelXp;
    this.nextLevelXp = Math.floor(10 + this.currentLevel * 8 + Math.pow(this.currentLevel, 1.4) * 4);

    survivorsAudio.playLevelUp();
    this.pause();

    // Generate 3-4 upgrade cards
    const options = this.generateUpgradeChoices();
    if (this.onLevelUpCallback) {
      this.onLevelUpCallback(options);
    }
  }

  // Treasure chest opening trigger
  private handleTreasureChest() {
    survivorsAudio.playChestOpen();
    this.pause();

    const tierRoll = Math.random();
    const tier: 1 | 3 | 5 = tierRoll < 0.65 ? 1 : tierRoll < 0.9 ? 3 : 5;
    const upgrades = this.generateUpgradeChoices().slice(0, tier);
    const gold = 50 * tier;
    this.coinsEarned += gold;

    if (this.onChestOpenCallback) {
      this.onChestOpenCallback({ upgrades, gold, tier });
    }
  }

  // Generate valid upgrade cards based on current inventory
  public generateUpgradeChoices(): UpgradeOption[] {
    const choices: UpgradeOption[] = [];

    // 1. Supreme Skill Fusion when skill reaches level 6 (Quando a habilidade chegar ao nível 6, dar a opção de fundir skills para criar uma skill suprema)
    for (const weapon of this.activeWeapons) {
      const def = WEAPON_DEFS[weapon.id];
      if (!def || def.isEvolution) continue;

      if (weapon.level >= 6) {
        // Find corresponding supreme evolution weapon
        const evoWeaponDef = Object.values(WEAPON_DEFS).find((w) => w.baseWeapon === weapon.id);
        if (evoWeaponDef && !this.activeWeapons.some((w) => w.id === evoWeaponDef.id)) {
          const partnerDef = def.evolutionPair ? PASSIVE_DEFS[def.evolutionPair] : null;
          choices.push({
            type: 'weapon',
            id: evoWeaponDef.id,
            name: evoWeaponDef.name,
            icon: evoWeaponDef.icon,
            currentLevel: 0,
            nextLevel: 1,
            description: `⚡ FUSÃO SUPREMA (Nv. 6): Funde ${def.name}${partnerDef ? ` + ${partnerDef.name}` : ''}! ${evoWeaponDef.description}`,
            isNew: true,
            isEvolution: true,
            isFusion: true,
            fusionRecipe: {
              baseWeaponName: def.name,
              partnerName: partnerDef ? partnerDef.name : undefined,
              supremeName: evoWeaponDef.name,
            },
          });
        }
      }
    }

    // 2. Existing Weapons upgrades
    for (const weapon of this.activeWeapons) {
      const def = WEAPON_DEFS[weapon.id];
      if (def && weapon.level < def.maxLevel) {
        choices.push({
          type: 'weapon',
          id: weapon.id,
          name: def.name,
          icon: def.icon,
          currentLevel: weapon.level,
          nextLevel: weapon.level + 1,
          description: def.upgradeDescriptions[weapon.level] || 'Melhora atributos da arma.',
          isNew: false,
          isEvolution: false,
        });
      }
    }

    // 3. Existing Passives upgrades
    for (const passive of this.activePassives) {
      const def = PASSIVE_DEFS[passive.id];
      if (def && passive.level < def.maxLevel) {
        choices.push({
          type: 'passive',
          id: passive.id,
          name: def.name,
          icon: def.icon,
          currentLevel: passive.level,
          nextLevel: passive.level + 1,
          description: def.upgradeDescriptions[passive.level] || 'Melhora atributos passivos.',
          isNew: false,
          isEvolution: false,
        });
      }
    }

    // 4. New Weapons (if player has < 6 weapon slots)
    if (this.activeWeapons.length < 6) {
      for (const def of Object.values(WEAPON_DEFS)) {
        const hasEvolvedVersion = this.activeWeapons.some((w) => WEAPON_DEFS[w.id]?.baseWeapon === def.id);
        if (!def.isEvolution && !this.activeWeapons.some((w) => w.id === def.id) && !hasEvolvedVersion) {
          choices.push({
            type: 'weapon',
            id: def.id,
            name: def.name,
            icon: def.icon,
            currentLevel: 0,
            nextLevel: 1,
            description: def.description,
            isNew: true,
            isEvolution: false,
          });
        }
      }
    }

    // 5. New Passives (if player has < 6 passive slots)
    if (this.activePassives.length < 6) {
      for (const def of Object.values(PASSIVE_DEFS)) {
        if (!this.activePassives.some((p) => p.id === def.id)) {
          choices.push({
            type: 'passive',
            id: def.id,
            name: def.name,
            icon: def.icon,
            currentLevel: 0,
            nextLevel: 1,
            description: def.description,
            isNew: true,
            isEvolution: false,
          });
        }
      }
    }

    // Consumable rewards for max level (quando chegar no lvl máximo ou não houver mais skills para aprimorar)
    const consumableHeal: UpgradeOption = {
      type: 'consumable',
      id: 'max_level_heal',
      name: 'Costelão Campeiro (+25% Vida)',
      icon: '🍖',
      currentLevel: 0,
      nextLevel: 0,
      description: 'Recupera 25% da sua Vida Máxima imediatamente.',
      isNew: false,
      isEvolution: false,
      consumableType: 'heal',
    };

    const consumableGold: UpgradeOption = {
      type: 'consumable',
      id: 'max_level_gold',
      name: 'Saco de Pilas (+50 Ouro)',
      icon: '💰',
      currentLevel: 0,
      nextLevel: 0,
      description: 'Adiciona 50 Pilas ao seu tesouro da partida.',
      isNew: false,
      isEvolution: false,
      consumableType: 'gold',
    };

    // If no weapon or passive upgrades remain (all max level or full inventory with max level),
    // always provide the requested 25% health and 50 gold options so the game never freezes!
    if (choices.length === 0) {
      return [consumableHeal, consumableGold];
    }

    // If slots are full and fewer than 2 skill upgrades remain, supplement with consumable options
    if (choices.length < 2 && (this.activeWeapons.length >= 6 || this.activePassives.length >= 6)) {
      choices.push(consumableHeal, consumableGold);
    }

    // Shuffle and pick 3 or 4 choices
    const shuffled = choices.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }

  // Apply player selection
  public applyUpgrade(choice: UpgradeOption) {
    if (choice.type === 'consumable' || choice.id === 'max_level_heal' || choice.id === 'max_level_gold') {
      if (choice.id === 'max_level_heal' || choice.consumableType === 'heal') {
        const healAmount = Math.max(1, Math.round(this.stats.maxHp * 0.25));
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + healAmount);
        survivorsAudio.playGemPickup();
        this.spawnFloatingText(`+${healAmount} HP (25%)`, this.playerX, this.playerY - 25, '#4ade80', 17, true);
        this.spawnPickupCollectionParticles(this.playerX, this.playerY, '#4ade80');
      } else {
        const mult = this.goldFeverActive ? this.goldFeverMultiplier : 1;
        const goldGain = 50 * mult;
        this.coinsEarned += goldGain;
        survivorsAudio.playGemPickup();
        this.spawnFloatingText(`+${goldGain} Pilas`, this.playerX, this.playerY - 25, '#fbbf24', 17, true);
        this.spawnPickupCollectionParticles(this.playerX, this.playerY, '#fbbf24');
      }
      this.resume();
      if (this.currentXp >= this.nextLevelXp) {
        setTimeout(() => {
          if (!this.isGameOver && this.isRunning) {
            this.handleLevelUp();
          }
        }, 120);
      }
      return;
    }

    if (choice.type === 'weapon') {
      if (choice.isEvolution || choice.isFusion) {
        // Replace base weapon with supreme evolved weapon
        const evoDef = WEAPON_DEFS[choice.id];
        let replaced = false;
        if (evoDef && evoDef.baseWeapon) {
          const index = this.activeWeapons.findIndex((w) => w.id === evoDef.baseWeapon);
          if (index !== -1) {
            this.activeWeapons[index] = {
              id: choice.id as WeaponId,
              level: 1,
              cooldownTimer: 0,
              totalDamageDealt: this.activeWeapons[index].totalDamageDealt,
              hitsCount: this.activeWeapons[index].hitsCount,
            };
            if (choice.id === 'cusco_supremo') {
              for (const c of this.companions) {
                c.isSupreme = true;
                c.name = 'Matilha Sagrada Farroupilha';
              }
              this.fireWeapon(this.activeWeapons[index]);
            }
            replaced = true;
          }
        }
        if (!replaced) {
          this.addWeapon(choice.id as WeaponId);
        }

        // Celebratory supreme fanfare & shockwaves
        survivorsAudio.playSupremeFusion();
        this.spawnFloatingText(`FUSÃO SUPREMA ATIVADA!`, this.playerX, this.playerY - 50, '#f59e0b', 22, true);
        this.rosaryFlash = 0.5;
        this.screenShake = 0.6;
        for (let i = 0; i < 24; i++) {
          const angle = (Math.PI * 2 * i) / 24;
          const speed = 90 + Math.random() * 110;
          this.particles.push({
            x: this.playerX,
            y: this.playerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 4 + Math.random() * 4,
            color: '#fbbf24',
            alpha: 1,
            life: 0.8,
            maxLife: 0.8,
            shape: 'star',
            glow: true,
          });
        }
      } else {
        const existing = this.activeWeapons.find((w) => w.id === choice.id);
        if (existing) {
          const maxLvl = WEAPON_DEFS[existing.id]?.maxLevel || 8;
          existing.level = Math.min(maxLvl, existing.level + 1);
        } else {
          this.addWeapon(choice.id as WeaponId);
        }
      }
    } else if (choice.type === 'passive') {
      const existing = this.activePassives.find((p) => p.id === choice.id);
      if (existing) {
        const maxLvl = PASSIVE_DEFS[existing.id]?.maxLevel || 5;
        existing.level = Math.min(maxLvl, existing.level + 1);
      } else {
        this.activePassives.push({ id: choice.id as PassiveId, level: 1 });
      }
      this.recalculatePassiveStats();
    }

    this.resume();
    if (this.currentXp >= this.nextLevelXp) {
      setTimeout(() => {
        if (!this.isGameOver && this.isRunning) {
          this.handleLevelUp();
        }
      }, 120);
    }
  }

  public addWeapon(id: WeaponId) {
    if (this.activeWeapons.some((w) => w.id === id)) return;
    const newWeapon: WeaponState = {
      id,
      level: 1,
      cooldownTimer: 0,
      totalDamageDealt: 0,
      hitsCount: 0,
    };
    this.activeWeapons.push(newWeapon);
    if (id === 'cusco' || id === 'cusco_supremo') {
      this.fireWeapon(newWeapon);
    }
  }

  // Recalculate stats influenced by active passives
  private recalculatePassiveStats() {
    // Reset to base + character bonuses
    this.stats.might = this.selectedCharacter.bonusStats.might || 1.0;
    this.stats.area = this.selectedCharacter.bonusStats.area || 1.0;
    this.stats.cooldownReduction = this.selectedCharacter.bonusStats.cooldownReduction || 0;
    this.stats.moveSpeed = this.selectedCharacter.bonusStats.moveSpeed || 180;
    this.stats.amount = this.selectedCharacter.bonusStats.amount || 0;
    this.stats.magnet = (this.selectedCharacter.bonusStats.magnet || 70);
    this.stats.hpRegen = this.selectedCharacter.bonusStats.hpRegen || 0;
    this.stats.armor = this.selectedCharacter.bonusStats.armor || 0;

    for (const passive of this.activePassives) {
      const def = PASSIVE_DEFS[passive.id];
      if (!def) continue;

      for (const effect of def.statEffects) {
        const totalBonus = effect.valuePerLevel * passive.level;
        if (effect.isMultiplier) {
          (this.stats[effect.stat] as number) += totalBonus;
        } else {
          (this.stats[effect.stat] as number) += totalBonus;
        }
      }
    }
  }

  // Helpers to target enemies
  private getClosestEnemies(count: number, maxDist: number = Infinity): Enemy[] {
    return this.enemies
      .filter((e) => e.hp > 0 && Math.hypot(e.x - this.playerX, e.y - this.playerY) <= maxDist)
      .sort((a, b) => {
        const da = Math.hypot(a.x - this.playerX, a.y - this.playerY);
        const db = Math.hypot(b.x - this.playerX, b.y - this.playerY);
        return da - db;
      })
      .slice(0, count);
  }

  private getRandomEnemies(count: number): Enemy[] {
    const living = this.enemies.filter((e) => e.hp > 0);
    const shuffled = [...living].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Floating text
  public spawnFloatingText(text: string, x: number, y: number, color: string, size: number = 13, isCrit: boolean = false) {
    this.floatingTexts.push({
      id: this.nextTextId++,
      text,
      x,
      y,
      vy: -35,
      alpha: 1.0,
      color,
      size,
      isCrit,
    });
  }

  // Hit sparks and blood particles with Canvas API
  public spawnHitParticles(x: number, y: number, color: string, isCrit = false) {
    const count = isCrit ? 8 : 4;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isCrit ? 90 : 50) + Math.random() * 110;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: isCrit ? 3.5 : 2.2,
        color,
        alpha: 1,
        life: 0.3,
        maxLife: 0.3,
        shape: isCrit ? 'star' : 'spark',
        glow: isCrit,
      });
    }
    if (isCrit) {
      this.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        size: 14,
        color: '#facc15',
        alpha: 1,
        life: 0.22,
        maxLife: 0.22,
        shape: 'ring',
      });
    }
  }

  // Particle emission when XP gems, coins or food are collected
  public spawnPickupCollectionParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 45 + Math.random() * 65;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.6,
        color,
        alpha: 1,
        life: 0.35,
        maxLife: 0.35,
        shape: 'star',
        glow: true,
      });
    }
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 12,
      color,
      alpha: 1,
      life: 0.2,
      maxLife: 0.2,
      shape: 'ring',
    });
  }

  // Spawn authentic "Sangue Gaúcho" particle splatter & temporary ground blood stains
  public spawnBloodSplatter(x: number, y: number, enemy: Enemy) {
    survivorsAudio.playBloodSplatter();

    // Determine thematic blood palette based on monster archetype
    let palette = ['#b91c1c', '#991b1b', '#dc2626', '#7f1d1d', '#881337'];
    let darkColor = '#450a0a';

    const shape = enemy.spriteShape || enemy.type || '';
    if (shape === 'boss_negrinho') {
      // O Negrinho do Pastoreio: sacred consecrated crimson & holy golden ember sparkles
      palette = ['#e11d48', '#be123c', '#991b1b', '#fbbf24', '#f59e0b'];
      darkColor = '#4c0519';
    } else if (shape.includes('boitata') || shape.includes('fire') || shape.includes('flame')) {
      // Fiery cursed blood & molten droplets
      palette = ['#ea580c', '#c2410c', '#b91c1c', '#991b1b', '#7f1d1d'];
      darkColor = '#431407';
    } else if (shape.includes('ghost') || shape.includes('specter') || shape.includes('phantom') || shape.includes('banshee')) {
      // Ectoplasmic cursed dark violet-crimson
      palette = ['#701a75', '#831843', '#4c0519', '#581c87'];
      darkColor = '#2e1065';
    }

    const isBoss = enemy.tier === 'boss';
    const isElite = enemy.tier === 'elite';

    // 1. High-velocity visceral flying blood droplet particles
    const dropletCount = isBoss ? 42 : (isElite ? 24 : 14);
    for (let i = 0; i < dropletCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isBoss ? 80 : (isElite ? 60 : 40)) + Math.random() * (isBoss ? 160 : 110);
      const color = palette[Math.floor(Math.random() * palette.length)];
      const size = (isBoss ? 3.4 : (isElite ? 2.8 : 2.2)) + Math.random() * 2.0;

      this.particles.push({
        x: x + (Math.random() - 0.5) * (enemy.radius * 0.5),
        y: y + (Math.random() - 0.5) * (enemy.radius * 0.5),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (20 + Math.random() * 40), // Upward spray arc
        size,
        color,
        alpha: 1,
        life: 0.35 + Math.random() * 0.35,
        maxLife: 0.7,
        shape: 'blood_drop',
        gravity: 180 + Math.random() * 80,
        drag: 0.92,
      });
    }

    // 2. Ground Blood Decals / Stains (Temporary marks on the map floor)
    const stainCount = isBoss ? 4 : (isElite ? 2 : 1);
    for (let s = 0; s < stainCount; s++) {
      const isPrimary = s === 0;
      const offDist = isPrimary ? Math.random() * 6 : 10 + Math.random() * 26;
      const offAngle = Math.random() * Math.PI * 2;
      const stainX = x + Math.cos(offAngle) * offDist;
      const stainY = y + Math.sin(offAngle) * offDist;

      const baseRadius = isPrimary
        ? (isBoss ? 24 : (isElite ? 17 : 11)) + Math.random() * 4
        : (6 + Math.random() * 7);

      // Generate organic splatter specks & satellite droplets
      const points: BloodDecalPoint[] = [];
      const ptCount = 4 + Math.floor(Math.random() * 4);
      for (let p = 0; p < ptCount; p++) {
        const pAng = Math.random() * Math.PI * 2;
        const pDist = baseRadius * (1.1 + Math.random() * 1.5);
        points.push({
          dx: Math.cos(pAng) * pDist,
          dy: Math.sin(pAng) * pDist,
          r: 1.5 + Math.random() * 2.8,
        });
      }

      // Duration: 12 to 18 seconds before drying & fading away
      const duration = 12 + Math.random() * 6;

      this.bloodDecals.push({
        id: this.nextDecalId++,
        x: stainX,
        y: stainY,
        radius: baseRadius,
        color: palette[Math.floor(Math.random() * palette.length)],
        darkColor,
        alpha: 1,
        duration,
        maxDuration: duration,
        angle: Math.random() * Math.PI * 2,
        points,
      });
    }

    // Cap decals at 160 to ensure consistent 60 FPS
    if (this.bloodDecals.length > 160) {
      this.bloodDecals.splice(0, this.bloodDecals.length - 160);
    }
  }

  // Update blood decal stains drying and fading on the floor
  private updateBloodDecals(dt: number) {
    for (let i = this.bloodDecals.length - 1; i >= 0; i--) {
      const d = this.bloodDecals[i];
      d.duration -= dt;
      if (d.duration <= 0) {
        this.bloodDecals.splice(i, 1);
        continue;
      }
      // Fades out smoothly during the last 25% of lifetime
      const fadeThreshold = d.maxDuration * 0.25;
      if (d.duration < fadeThreshold) {
        d.alpha = Math.max(0, d.duration / fadeThreshold);
      } else {
        d.alpha = 1;
      }
    }
  }

  // Update particles & floating texts
  private updateParticlesAndText(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.shape === 'blood_drop') {
        const drag = p.drag ?? 0.92;
        const gravity = p.gravity ?? 180;
        p.vx *= drag;
        p.vy = (p.vy + gravity * dt) * drag;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy * dt;
      t.alpha -= dt * 1.5;
      if (t.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // Game Over handling
  private handleGameOver(victory: boolean) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.isVictory = victory;
    this.stop();
    survivorsAudio.stopMusic();
    if (victory) {
      survivorsAudio.playVictory();
    } else {
      survivorsAudio.playGameOver();
    }

    if (this.onGameOverCallback) {
      this.onGameOverCallback(victory);
    }
  }

  // Status Effects: Apply, refresh or extend debuffs on enemies
  public applyStatusEffect(enemy: Enemy, type: StatusEffectType, duration: number, potency = 1) {
    if (!enemy.statusEffects) {
      enemy.statusEffects = [];
    }
    const existing = enemy.statusEffects.find((s) => s.type === type);
    if (existing) {
      existing.duration = Math.max(existing.duration, duration);
      existing.maxDuration = Math.max(existing.maxDuration, duration);
      existing.potency = Math.max(existing.potency || 0, potency);
    } else {
      enemy.statusEffects.push({
        type,
        duration,
        maxDuration: duration,
        potency,
        tickTimer: 0,
      });
    }
  }

  // Initialize procedural breakable objects on the map
  private initBreakableProps() {
    this.breakableProps = [];
    const propTypes = this.stage?.props || ['torch', 'urn'];
    const count = 75; // Initial batch of procedural breakable props
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 2200;
      const type = propTypes[Math.floor(Math.random() * propTypes.length)];
      this.breakableProps.push({
        id: this.nextPropId++,
        type,
        x: Math.round(Math.cos(angle) * dist),
        y: Math.round(Math.sin(angle) * dist),
        radius: type === 'coffin' ? 18 : 12,
        maxHp: type === 'coffin' ? 40 : 15,
        hp: type === 'coffin' ? 40 : 15,
        hurtTimer: 0,
        dropTable: ['coin', 'chicken', 'coin', 'gem_green', 'coin'],
      });
    }
  }

  // Update breakable props and sustain procedural density around player
  private updateBreakableProps(dt: number) {
    for (let i = this.breakableProps.length - 1; i >= 0; i--) {
      const prop = this.breakableProps[i];
      if (prop.hurtTimer > 0) prop.hurtTimer -= dt;

      if (prop.hp <= 0) {
        this.handlePropDestruction(prop);
        this.breakableProps.splice(i, 1);
      }
    }

    // Procedurally spawn props as player navigates the endless map
    if (this.breakableProps.length < 50) {
      const propTypes = this.stage?.props || ['torch', 'urn'];
      const angle = Math.random() * Math.PI * 2;
      const dist = 650 + Math.random() * 500;
      const type = propTypes[Math.floor(Math.random() * propTypes.length)];
      this.breakableProps.push({
        id: this.nextPropId++,
        type,
        x: Math.round(this.playerX + Math.cos(angle) * dist),
        y: Math.round(this.playerY + Math.sin(angle) * dist),
        radius: type === 'coffin' ? 18 : 12,
        maxHp: type === 'coffin' ? 40 : 15,
        hp: type === 'coffin' ? 40 : 15,
        hurtTimer: 0,
        dropTable: ['coin', 'chicken', 'coin', 'gem_green', 'coin'],
      });
    }
  }

  // Handle destruction of a breakable prop & reward drops
  private handlePropDestruction(prop: BreakableProp) {
    survivorsAudio.playBreakProp();
    this.spawnHitParticles(prop.x, prop.y, '#f59e0b');

    const roll = Math.random();
    if (roll < 0.15) {
      // Roast Chicken (Heal 30)
      this.pickups.push({
        id: this.nextPickupId++,
        type: 'chicken',
        x: prop.x,
        y: prop.y,
        value: 30,
        radius: 12,
        magnetized: false,
        vx: 0,
        vy: 0,
        bobOffset: Math.random() * 5,
      });
    } else if (roll < 0.55) {
      // Gold Coin
      this.pickups.push({
        id: this.nextPickupId++,
        type: 'coin',
        x: prop.x,
        y: prop.y,
        value: Math.random() < 0.3 ? 3 : 1,
        radius: 8,
        magnetized: false,
        vx: 0,
        vy: 0,
        bobOffset: Math.random() * 5,
      });
    } else if (roll < 0.70) {
      // Rare utility: freeze or rosary
      this.pickups.push({
        id: this.nextPickupId++,
        type: Math.random() < 0.5 ? 'freeze' : 'rosary',
        x: prop.x,
        y: prop.y,
        value: 1,
        radius: 12,
        magnetized: false,
        vx: 0,
        vy: 0,
        bobOffset: Math.random() * 5,
      });
    } else {
      // XP Gems
      this.pickups.push({
        id: this.nextPickupId++,
        type: Math.random() < 0.3 ? 'gem_red' : 'gem_green',
        x: prop.x,
        y: prop.y,
        value: 8,
        radius: 8,
        magnetized: false,
        vx: 0,
        vy: 0,
        bobOffset: Math.random() * 5,
      });
    }
  }

  // Dynamic Weather Progression
  private updateWeather(dt: number) {
    if (!this.weather) return;
    this.weather.duration -= dt;

    if (this.weather.duration <= 0) {
      // Cycle to a new weather condition from stage's weather pool
      const stageWeathers = this.stage?.weatherPool || ['clear', 'rain', 'blood_moon'];
      const candidates = stageWeathers.filter((w) => w !== this.weather.type);
      const nextType =
        candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : stageWeathers[0];

      const weatherDef = WEATHER_DEFS[nextType] || WEATHER_DEFS.clear;
      const duration = 45 + Math.random() * 45; // 45-90 seconds per weather pattern
      this.weather = {
        type: nextType,
        name: weatherDef.name,
        description: weatherDef.description,
        icon: weatherDef.icon,
        bonusText: weatherDef.bonusText,
        timer: duration,
        duration,
        intensity: 1.0,
      };

      if (this.onWeatherChangeCallback) {
        this.onWeatherChangeCallback(this.weather);
      }

      this.spawnFloatingText(`CLIMA: ${weatherDef.name.toUpperCase()}!`, this.playerX, this.playerY - 40, '#f59e0b', 18, true);
    }
  }

  // Call Renderer
  private render() {
    const renderState: RenderState = {
      cameraX: this.playerX,
      cameraY: this.playerY,
      screenShake: this.screenShake,
      player: {
        x: this.playerX,
        y: this.playerY,
        radius: 14,
        facingLeft: this.facingLeft,
        isMoving: this.isMoving,
        walkAnim: this.walkAnim,
        invulnerableTimer: this.invulnerableTimer,
        charColor: this.selectedCharacter.avatarColor,
        accentColor: this.selectedCharacter.accentColor,
        charId: this.selectedCharacter.id,
      },
      companions: this.companions,
      stats: this.stats,
      weapons: this.activeWeapons,
      enemies: this.enemies,
      bossHazardZones: this.bossHazardZones,
      projectiles: this.projectiles,
      areaZones: this.areaZones,
      pickups: this.pickups,
      particles: this.particles,
      bloodDecals: this.bloodDecals,
      floatingTexts: this.floatingTexts,
      timeAlive: this.timeAlive,
      rosaryFlash: this.rosaryFlash,
      stage: this.stage,
      weather: this.weather,
      breakableProps: this.breakableProps,
      themePalette: this.activeThemePalette,
      goldFeverActive: this.goldFeverActive,
      goldFeverTimer: this.goldFeverTimer,
    };

    this.renderer.render(renderState);
  }
}
