// High-fidelity 2D Canvas Renderer for Vampire Survivors

import {
  AreaZone,
  BloodDecal,
  BossHazardZone,
  BreakableProp,
  Companion,
  Enemy,
  FloatingText,
  Particle,
  Pickup,
  PlayerStats,
  Projectile,
  StageConfig,
  WeaponState,
  WeatherState,
} from '../types/survivors';

export interface RenderState {
  cameraX: number;
  cameraY: number;
  screenShake: number;
  stage: StageConfig;
  weather: WeatherState;
  breakableProps: BreakableProp[];
  bloodDecals?: BloodDecal[];
  player: {
    x: number;
    y: number;
    radius: number;
    facingLeft: boolean;
    isMoving: boolean;
    walkAnim: number;
    invulnerableTimer: number;
    charColor: string;
    accentColor: string;
    charId: string;
  };
  companions?: Companion[];
  stats: PlayerStats;
  weapons: WeaponState[];
  enemies: Enemy[];
  bossHazardZones?: BossHazardZone[];
  projectiles: Projectile[];
  areaZones: AreaZone[];
  pickups: Pickup[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  timeAlive: number;
  rosaryFlash: number;
  goldFeverActive?: boolean;
  goldFeverTimer?: number;
  goldFeverMultiplier?: number;
  themePalette?: 'morning' | 'dusk' | 'midnight';
}

export class SurvivorsRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = context;
    this.resize();
  }

  public resize() {
    if (!this.canvas) return;
    this.width = Math.max(1, this.canvas.clientWidth || window.innerWidth || 800);
    this.height = Math.max(1, this.canvas.clientHeight || window.innerHeight || 600);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    if (this.ctx) {
      this.ctx.resetTransform();
      this.ctx.scale(dpr, dpr);
    }
  }

  public destroy() {
    this.width = 0;
    this.height = 0;
    try {
      if (this.ctx && this.canvas) {
        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    } catch {
      // Safe no-op on destruction
    }
  }

  public render(state: RenderState) {
    if (!this.canvas || this.width <= 0 || this.height <= 0) return;
    const { ctx, width, height } = this;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.save();
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (state.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * state.screenShake * 12;
      shakeY = (Math.random() - 0.5) * state.screenShake * 12;
    }

    // Camera offset: Center player on screen
    const offsetX = width / 2 - state.cameraX + shakeX;
    const offsetY = height / 2 - state.cameraY + shakeY;

    // Viewport frustum bounds in world coordinates (+ safety margin) for high-performance culling
    const pad = 110;
    const viewMinX = state.cameraX - width / 2 - pad;
    const viewMaxX = state.cameraX + width / 2 + pad;
    const viewMinY = state.cameraY - height / 2 - pad;
    const viewMaxY = state.cameraY + height / 2 + pad;

    // Filter visible items for ultra-smooth 60 FPS
    const visibleEnemies = state.enemies.filter(
      (e) => e.x >= viewMinX && e.x <= viewMaxX && e.y >= viewMinY && e.y <= viewMaxY
    );
    const visiblePickups = state.pickups.filter(
      (p) => p.x >= viewMinX && p.x <= viewMaxX && p.y >= viewMinY && p.y <= viewMaxY
    );
    const visibleProps = state.breakableProps.filter(
      (p) => p.x >= viewMinX && p.x <= viewMaxX && p.y >= viewMinY && p.y <= viewMaxY
    );
    const visibleParticles = state.particles.filter(
      (p) => p.x >= viewMinX && p.x <= viewMaxX && p.y >= viewMinY && p.y <= viewMaxY
    );
    const visibleBloodDecals = (state.bloodDecals || []).filter(
      (d) => d.x >= viewMinX - 45 && d.x <= viewMaxX + 45 && d.y >= viewMinY - 45 && d.y <= viewMaxY + 45
    );

    // 1. Draw Infinite Gothic Floor Tile Grid
    this.drawBackground(offsetX, offsetY, state.timeAlive, state.stage, state.weather);

    // Apply Camera Transform for World Objects
    ctx.save();
    ctx.translate(offsetX, offsetY);

    // 1b. Draw Blood Decals / Respingos de Sangue Gaúcho directly on the map ground
    if (visibleBloodDecals.length > 0) {
      this.drawBloodDecals(visibleBloodDecals);
    }

    // 2. Draw Area Zones (Holy Water flames, persistent holy circles)
    this.drawAreaZones(state.areaZones, state.timeAlive);

    // 2b. Draw Boss Hazard Zones (Telegraphed Candle Circles, Consecration Rings)
    if (state.bossHazardZones && state.bossHazardZones.length > 0) {
      this.drawBossHazards(state.bossHazardZones, state.timeAlive);
    }

    // 3. Draw Pickups (XP Gems, Chests, Food, Coins) - Culled
    this.drawPickups(visiblePickups, state.timeAlive);

    // 4. Draw Shadows beneath entities - Culled
    this.drawShadows(state, visibleEnemies);

    // 5. Draw Breakable World Props (Torches, Urns, Crystals, Coffins) - Culled
    this.drawBreakableProps(visibleProps, state.timeAlive);

    // 6. Draw Enemies (sorted by Y for natural 2.5D overlap with status effects & HUD) - Culled
    this.drawEnemies(visibleEnemies, state.timeAlive);

    // 7. Draw Player Character
    this.drawPlayer(state);

    // 7b. Draw Companions (Cusco Caramelo & Matilha Sagrada)
    if (state.companions && state.companions.length > 0) {
      this.drawCompanions(state.companions, state.timeAlive);
    }

    // 8. Draw Projectiles & Special FX (Additive blending for glowing magic)
    this.drawProjectiles(state.projectiles, state.timeAlive);

    // 9. Draw Particles (sparks, blood, embers) - Culled
    this.drawParticles(visibleParticles);

    // 10. Draw Floating Combat Text
    this.drawFloatingTexts(state.floatingTexts);

    ctx.restore(); // restore camera transform

    // 11. Dynamic Weather Atmosphere (Rain, Blizzard, Blood Moon, Ember Storm)
    this.drawWeatherEffects(state.weather, state.timeAlive);

    // 11b. Dynamic Time-of-Day Theme Atmosphere (Morning / Dusk / Midnight tint)
    this.drawThemeAtmosphere(state.themePalette, state.timeAlive);

    // 12. Post-processing: Vignette & Torch ambiance
    this.drawLightingAndVignette(width / 2 + shakeX, height / 2 + shakeY, state.stats, state.stage, state.weather);

    // 13. Fullscreen Flash (Rosary nuke or big impact)
    if (state.rosaryFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, state.rosaryFlash)})`;
      ctx.fillRect(0, 0, width, height);
    }

    // 14. Gold Fever (Frenesi do Pila) golden borders and particle aura
    this.drawGoldFeverEffects(state.goldFeverActive, state.goldFeverTimer, state.timeAlive);

    ctx.restore();
  }

  // Draw rich gothic stone tile arena adapted to stage & weather
  private drawBackground(
    offsetX: number,
    offsetY: number,
    time: number,
    stage: StageConfig,
    weather: WeatherState
  ) {
    const { ctx, width, height } = this;
    const tileSize = 120;
    const palette = stage.bgPalette;

    // Base background tone
    ctx.fillStyle = palette.base;
    ctx.fillRect(0, 0, width, height);

    const startCol = Math.floor(-offsetX / tileSize) - 1;
    const endCol = Math.ceil((width - offsetX) / tileSize) + 1;
    const startRow = Math.floor(-offsetY / tileSize) - 1;
    const endRow = Math.ceil((height - offsetY) / tileSize) + 1;

    for (let c = startCol; c <= endCol; c++) {
      for (let r = startRow; r <= endRow; r++) {
        const tileWorldX = c * tileSize;
        const tileWorldY = r * tileSize;
        const screenX = tileWorldX + offsetX;
        const screenY = tileWorldY + offsetY;

        // Deterministic pseudo-random based on grid coordinates
        const hash = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
        const rand = hash - Math.floor(hash);

        // Tile base alternating color
        const isAlt = (Math.abs(c) + Math.abs(r)) % 2 === 0;
        ctx.fillStyle = isAlt ? palette.tileA : palette.tileB;
        ctx.fillRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);

        // Tile border bevel
        ctx.strokeStyle = palette.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, screenY, tileSize, tileSize);

        // Stage specific ground textures
        if (stage.id === 'mad_forest') {
          // Moss & roots
          if (rand > 0.6) {
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(screenX + 15, screenY + 20);
            ctx.quadraticCurveTo(screenX + 45, screenY + 60, screenX + 70, screenY + 40);
            ctx.stroke();
          }
          // Ancient Occult Rune Circles every 6x6 tiles
          if ((c % 6 === 0 && r % 6 === 0) || (c % 6 === 3 && r % 6 === 3)) {
            this.drawOccultRuneCircle(screenX + tileSize / 2, screenY + tileSize / 2, tileSize, 'rgba(16, 185, 129, 0.2)');
          }
        } else if (stage.id === 'inlaid_library') {
          // Polished marble gold inlay borders
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.18)';
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX + 10, screenY + 10, tileSize - 20, tileSize - 20);

          // Diamond inlay
          ctx.beginPath();
          ctx.moveTo(screenX + tileSize / 2, screenY + 14);
          ctx.lineTo(screenX + tileSize - 14, screenY + tileSize / 2);
          ctx.lineTo(screenX + tileSize / 2, screenY + tileSize - 14);
          ctx.lineTo(screenX + 14, screenY + tileSize / 2);
          ctx.closePath();
          ctx.stroke();

          // Bookshelf monuments at interval columns
          if (c % 7 === 0 && r % 5 === 0) {
            this.drawBookshelfProp(screenX + 25, screenY + 25, time);
          }
        } else if (stage.id === 'blood_crypt') {
          // Obsidian volcanic cracks with glowing crimson lava/blood
          if (rand > 0.5) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX + 20, screenY + 10);
            ctx.lineTo(screenX + 50, screenY + 55);
            ctx.lineTo(screenX + 80, screenY + 40);
            ctx.stroke();
          }
          // Skull Altar circles every 6x6 tiles
          if (c % 6 === 0 && r % 6 === 0) {
            this.drawOccultRuneCircle(screenX + tileSize / 2, screenY + tileSize / 2, tileSize, 'rgba(239, 68, 68, 0.35)');
          }
        } else if (stage.id === 'frost_peaks') {
          // Glacial ice fissures
          if (rand > 0.5) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(screenX + 10, screenY + 30);
            ctx.lineTo(screenX + 55, screenY + 45);
            ctx.lineTo(screenX + 90, screenY + 80);
            ctx.stroke();
          }
          // Frost snowflake mandala
          if (c % 6 === 0 && r % 6 === 0) {
            this.drawOccultRuneCircle(screenX + tileSize / 2, screenY + tileSize / 2, tileSize, 'rgba(56, 189, 248, 0.25)');
          }
        } else if (stage.id === 'churrascaria_shopping') {
          // Polished shopping mall tiles with warm food court ambiance
          if (rand > 0.6) {
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.22)';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX + 16, screenY + 16, tileSize - 32, tileSize - 32);
          }
          // Grill smoke vents every 5x5 tiles
          if ((c % 5 === 0 && r % 5 === 0)) {
            ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
            ctx.fillRect(screenX + tileSize / 2 - 12, screenY + tileSize / 2 - 12, 24, 24);
            ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
            ctx.strokeRect(screenX + tileSize / 2 - 12, screenY + tileSize / 2 - 12, 24, 24);
          }
        } else if (stage.id === 'lagoa_patos') {
          // Water ripples and wet shore sand lines
          if (rand > 0.4) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(screenX + 10, screenY + 25);
            ctx.quadraticCurveTo(screenX + 45, screenY + 15, screenX + 80, screenY + 28);
            ctx.stroke();
          }
          // Reed wetlands cluster
          if (c % 6 === 0 && r % 4 === 0) {
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX + 30, screenY + 45);
            ctx.lineTo(screenX + 28, screenY + 18);
            ctx.moveTo(screenX + 36, screenY + 45);
            ctx.lineTo(screenX + 40, screenY + 15);
            ctx.stroke();
          }
        } else if (stage.id === 'aparados_serra') {
          // Canyon basalt fissures & misty cliff cracks
          if (rand > 0.4) {
            ctx.strokeStyle = 'rgba(180, 83, 9, 0.28)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX + 15, screenY + 10);
            ctx.lineTo(screenX + 40, screenY + 65);
            ctx.lineTo(screenX + 75, screenY + 50);
            ctx.stroke();
          }
          // Araucaria pine silhouette motif
          if (c % 7 === 0 && r % 7 === 0) {
            ctx.fillStyle = 'rgba(5, 150, 105, 0.2)';
            ctx.beginPath();
            ctx.arc(screenX + tileSize / 2, screenY + tileSize / 2 - 8, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(120, 53, 15, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(screenX + tileSize / 2, screenY + tileSize / 2 + 18);
            ctx.lineTo(screenX + tileSize / 2, screenY + tileSize / 2 - 4);
            ctx.stroke();
          }
        }

        // Braziers / Torches with flickering fire at select intersections
        if (c % 8 === 0 && r % 8 === 0) {
          const flameColor = stage.id === 'blood_crypt' ? '#ef4444' : stage.id === 'frost_peaks' ? '#38bdf8' : '#f59e0b';
          this.drawBrazier(screenX + 20, screenY + 20, time + rand * 10, flameColor);
        }
      }
    }
  }

  // Draw occult rune circle
  private drawOccultRuneCircle(centerX: number, centerY: number, tileSize: number, strokeColor: string) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, tileSize * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, tileSize * 0.25, 0, Math.PI * 2);
    ctx.stroke();

    const s = tileSize * 0.25;
    ctx.strokeRect(centerX - s, centerY - s, s * 2, s * 2);
    ctx.restore();
  }

  // Draw ancient bookshelf prop for Inlaid Library
  private drawBookshelfProp(x: number, y: number, time: number) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = '#27170c';
    ctx.fillRect(x, y, 70, 36);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, 70, 36);

    // Book spines
    const bookColors = ['#ef4444', '#3b82f6', '#10b981', '#a855f7', '#eab308'];
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = bookColors[i % bookColors.length];
      ctx.fillRect(x + 5 + i * 7.5, y + 6, 6, 24);
    }
    ctx.restore();
  }

  // Draw atmospheric ground torch / brazier
  private drawBrazier(x: number, y: number, time: number, flameColor: string = '#f59e0b') {
    const { ctx } = this;
    // Stone pedestal
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brazier bowl
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI, false);
    ctx.fill();

    // Flickering fire glow
    const flicker = Math.sin(time * 8) * 2;
    const grad = ctx.createRadialGradient(x, y - 5, 2, x, y - 5, 32 + flicker);
    grad.addColorStop(0, flameColor === '#ef4444' ? 'rgba(239, 68, 68, 0.45)' : flameColor === '#38bdf8' ? 'rgba(56, 189, 248, 0.45)' : 'rgba(245, 158, 11, 0.45)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y - 5, 32 + flicker, 0, Math.PI * 2);
    ctx.fill();

    // Flame core
    ctx.fillStyle = flameColor === '#ef4444' ? '#fca5a5' : flameColor === '#38bdf8' ? '#bae6fd' : '#fef08a';
    ctx.beginPath();
    ctx.arc(x + (Math.random() - 0.5) * 2, y - 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Procedural Breakable Props (Torches, Urns, Crystals, Coffins)
  private drawBreakableProps(props: BreakableProp[], time: number) {
    if (!props || props.length === 0) return;
    const { ctx } = this;

    for (const p of props) {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Hit shake
      if (p.hurtTimer && p.hurtTimer > 0) {
        ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
      }

      const pType = p.type || p.propType;

      if (pType === 'torch') {
        // Wooden post
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-3, -8, 6, 16);
        // Iron ring
        ctx.fillStyle = '#475569';
        ctx.fillRect(-5, -6, 10, 3);
        // Flickering fire top
        const f = Math.sin(time * 10 + p.x) * 2;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, -12 + f, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, -12 + f, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (pType === 'urn') {
        // Clay antique vase
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Rim
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-6, -11, 12, 3);
      } else if (pType === 'crystal') {
        // Glowing cyan ice crystal
        const pulse = Math.sin(time * 4 + p.y) * 2;
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -14 - pulse);
        ctx.lineTo(8, -2);
        ctx.lineTo(5, 10);
        ctx.lineTo(-5, 10);
        ctx.lineTo(-8, -2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Inner gleam
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(-2, -6, 4, 8);
      } else if (pType === 'coffin') {
        // Gothic stone coffin
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-9, -15);
        ctx.lineTo(9, -15);
        ctx.lineTo(12, 0);
        ctx.lineTo(8, 15);
        ctx.lineTo(-8, 15);
        ctx.lineTo(-12, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Cross on lid
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-2, -10, 4, 18);
        ctx.fillRect(-6, -6, 12, 3);
      }

      // Mini Health bar if damaged
      if (p.hp < p.maxHp) {
        const hpPercent = Math.max(0, p.hp / p.maxHp);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-12, -p.radius - 8, 24, 3);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-12, -p.radius - 8, 24 * hpPercent, 3);
      }

      ctx.restore();
    }
  }

  // Draw Area zones (Holy Water pools, Holy aura, etc.)
  private drawAreaZones(zones: AreaZone[], time: number) {
    const { ctx } = this;
    ctx.save();
    for (const z of zones) {
      const pulse = 1 + Math.sin(time * 6 + z.id) * 0.06;
      const currentRadius = z.radius * pulse;

      // Outer fire/holy glow
      const grad = ctx.createRadialGradient(z.x, z.y, currentRadius * 0.2, z.x, z.y, currentRadius);
      if (z.weaponId === 'holy_water' || z.weaponId === 'la_borra') {
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        grad.addColorStop(0.6, 'rgba(14, 165, 233, 0.25)');
        grad.addColorStop(1, 'rgba(2, 132, 199, 0)');
      } else {
        grad.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
        grad.addColorStop(0.7, 'rgba(245, 158, 11, 0.2)');
        grad.addColorStop(1, 'rgba(217, 119, 6, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(z.x, z.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();

      // Flame swirls / runes in zone
      ctx.strokeStyle = z.weaponId === 'la_borra' ? 'rgba(186, 230, 253, 0.5)' : 'rgba(254, 240, 138, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(z.x, z.y, currentRadius * 0.7, time * 2, time * 2 + Math.PI * 1.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Draw Pickups (Gems, Coins, Chests, Chicken, Vacuum, Rosary)
  private drawPickups(pickups: Pickup[], time: number) {
    const { ctx } = this;
    ctx.save();

    for (const p of pickups) {
      const bobY = Math.sin(time * 4 + p.bobOffset) * 3;
      const drawY = p.y + bobY;

      // Soft shadow beneath pickup
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 7, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gem glow
      ctx.save();
      if (p.type === 'gem_blue') {
        this.drawDiamondGem(p.x, drawY, '#38bdf8', '#0284c7', 6);
      } else if (p.type === 'gem_green') {
        this.drawDiamondGem(p.x, drawY, '#4ade80', '#16a34a', 7);
      } else if (p.type === 'gem_red') {
        this.drawDiamondGem(p.x, drawY, '#f87171', '#dc2626', 8);
      } else if (p.type === 'gem_purple') {
        this.drawDiamondGem(p.x, drawY, '#c084fc', '#9333ea', 9);
      } else if (p.type === 'coin') {
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, drawY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.type === 'chest') {
        this.drawTreasureChest(p.x, drawY, time);
      } else if (p.type === 'chicken') {
        // Roast chicken item
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍗', p.x, drawY);
      } else if (p.type === 'magnet') {
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧲', p.x, drawY);
      } else if (p.type === 'rosary') {
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📿', p.x, drawY);
      } else if (p.type === 'freeze') {
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⏱️', p.x, drawY);
      } else if (p.type === 'vela_negrinho') {
        this.drawVelaNegrinho(p.x, drawY, time);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // Draw faceted diamond gems
  private drawDiamondGem(x: number, y: number, colorLight: string, colorDark: string, size: number) {
    const { ctx } = this;
    // Ambient gem halo
    const glow = ctx.createRadialGradient(x, y, 1, x, y, size * 2.2);
    glow.addColorStop(0, colorLight);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, size * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Diamond polygon
    ctx.fillStyle = colorLight;
    ctx.strokeStyle = colorDark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.8, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.8, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top highlight facet
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.3, y - size * 0.3);
    ctx.lineTo(x, y);
    ctx.lineTo(x - size * 0.3, y - size * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  // Draw glowing golden treasure chest dropped by bosses
  private drawTreasureChest(x: number, y: number, time: number) {
    const { ctx } = this;
    // Golden beacon glow
    const pulse = 1 + Math.sin(time * 5) * 0.15;
    const grad = ctx.createRadialGradient(x, y, 4, x, y, 30 * pulse);
    grad.addColorStop(0, 'rgba(245, 158, 11, 0.7)');
    grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 30 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Chest box
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.fillRect(x - 12, y - 8, 24, 16);
    ctx.strokeRect(x - 12, y - 8, 24, 16);

    // Gold trim and lock
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x - 3, y - 2, 6, 6);
    ctx.fillRect(x - 10, y - 8, 3, 16);
    ctx.fillRect(x + 7, y - 8, 3, 16);
  }

  // Draw soft entity shadows
  private drawShadows(state: RenderState, visibleEnemies: Enemy[]) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';

    // Player shadow
    ctx.beginPath();
    ctx.ellipse(state.player.x, state.player.y + 14, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Companions shadow
    if (state.companions) {
      for (const comp of state.companions) {
        ctx.beginPath();
        ctx.ellipse(comp.x, comp.y + 10, comp.isSupreme ? 14 : 10, comp.isSupreme ? 6 : 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Enemy shadows (culled to visible enemies only)
    for (const e of visibleEnemies) {
      const sx = Math.max(1, e.radius * 0.9);
      const sy = Math.max(1, e.radius * 0.45);
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + e.radius * 0.85, sx, sy, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Draw all enemy swarms with animations, status overlays, and HUD debuff bars
  private drawEnemies(enemies: Enemy[], time: number) {
    const { ctx } = this;
    // Sort by Y coordinate for proper overlapping depth
    const sorted = [...enemies].sort((a, b) => a.y - b.y);

    for (const e of sorted) {
      ctx.save();
      ctx.translate(e.x, e.y);

      // Flash white on hit
      const isWhiteFlash = e.hurtTimer > 0;

      // Check active status effects
      const hasFrozen = e.statusEffects?.some((s) => s.type === 'frozen');
      const hasBurned = e.statusEffects?.some((s) => s.type === 'burned');
      const hasSlowed = e.statusEffects?.some((s) => s.type === 'slowed');

      // Facing direction
      if (e.facingLeft) {
        ctx.scale(-1, 1);
      }

      // Draw specialized monster sprite
      if (e.spriteShape === 'bat') {
        this.drawBatMonster(e, isWhiteFlash);
      } else if (e.spriteShape === 'skeleton') {
        this.drawSkeletonMonster(e, isWhiteFlash);
      } else if (e.spriteShape === 'ghoul') {
        this.drawGhoulMonster(e, isWhiteFlash);
      } else if (e.spriteShape === 'wolf') {
        this.drawWolfMonster(e, isWhiteFlash);
      } else if (e.spriteShape === 'wraith') {
        this.drawWraithMonster(e, isWhiteFlash);
      } else if (e.spriteShape === 'golem') {
        this.drawGolemMonster(e, isWhiteFlash);
      } else if (e.spriteShape === 'gaucho_apartamento') {
        this.drawGauchoApartamento(e, isWhiteFlash);
      } else if (e.spriteShape === 'saci') {
        this.drawSaciMonster(e, isWhiteFlash);
      } else if (e.spriteShape === 'curupira') {
        this.drawCurupiraMonster(e, isWhiteFlash);
      } else if (e.spriteShape === 'mula_sem_cabeca') {
        this.drawMulaSemCabeca(e, isWhiteFlash);
      } else if (e.spriteShape === 'boss_boitata') {
        this.drawBossBoitata(e, isWhiteFlash);
      } else if (e.spriteShape === 'boss_teiniagua') {
        this.drawBossTeiniagua(e, isWhiteFlash);
      } else if (e.spriteShape === 'boss_negrinho') {
        this.drawBossNegrinho(e, isWhiteFlash);
      } else if (e.spriteShape === 'boss_king') {
        this.drawBossKing(e, isWhiteFlash);
      } else if (e.spriteShape === 'vampire_lord') {
        this.drawVampireLord(e, isWhiteFlash);
      } else if (e.spriteShape === 'reaper') {
        this.drawReaper(e, isWhiteFlash);
      } else {
        // Fallback round mob
        ctx.fillStyle = isWhiteFlash ? '#ffffff' : e.color;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Visual status overlay: Burned (flames wrapping monster)
      if (hasBurned) {
        ctx.save();
        const fBob = Math.sin(time * 12 + e.x) * 3;
        ctx.fillStyle = 'rgba(249, 115, 22, 0.4)';
        ctx.beginPath();
        ctx.arc(0, -e.radius * 0.4, e.radius * 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Dancing flame tongues
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(-e.radius * 0.6, e.radius * 0.3);
        ctx.lineTo(-e.radius * 0.3, -e.radius * 1.3 + fBob);
        ctx.lineTo(0, -e.radius * 0.4);
        ctx.lineTo(e.radius * 0.3, -e.radius * 1.4 - fBob);
        ctx.lineTo(e.radius * 0.6, e.radius * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Visual status overlay: Slowed (sluggish cyan droplets)
      if (hasSlowed) {
        ctx.save();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(-e.radius * 0.5, e.radius * 0.7, 2.5, 0, Math.PI * 2);
        ctx.arc(e.radius * 0.4, e.radius * 0.8, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Visual status overlay: Frozen (ice crystal carapace shell)
      if (hasFrozen) {
        ctx.save();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.5;
        const r = e.radius * 1.15;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.8, -r * 0.4);
        ctx.lineTo(r * 0.7, r * 0.6);
        ctx.lineTo(0, r);
        ctx.lineTo(-r * 0.7, r * 0.6);
        ctx.lineTo(-r * 0.8, -r * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner ice highlight facet
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(-r * 0.3, -r * 0.6);
        ctx.lineTo(r * 0.3, -r * 0.2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();

      // Draw Monster Health Bar & Active Debuffs HUD
      this.drawMonsterStatusAndHealth(e, time);
    }
  }

  // Draw Bat Monster
  private drawBatMonster(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    const wingFlap = Math.sin(e.animFrame * 12) * 10;

    ctx.fillStyle = isWhite ? '#ffffff' : '#3b0764';
    ctx.strokeStyle = isWhite ? '#ffffff' : '#581c87';
    ctx.lineWidth = 1.5;

    // Wings
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-10, -12 - wingFlap, -22, -2 + wingFlap);
    ctx.quadraticCurveTo(-14, 6, 0, 4);
    ctx.quadraticCurveTo(14, 6, 22, -2 + wingFlap);
    ctx.quadraticCurveTo(10, -12 - wingFlap, 0, 0);
    ctx.fill();
    ctx.stroke();

    // Body & ears
    ctx.fillStyle = isWhite ? '#ffffff' : '#1e1b4b';
    ctx.beginPath();
    ctx.ellipse(0, 2, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red eyes
    if (!isWhite) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-3, 0, 2, 2);
      ctx.fillRect(1, 0, 2, 2);
    }
  }

  // Draw Skeleton Monster
  private drawSkeletonMonster(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    const legBob = Math.sin(e.animFrame * 8) * 3;

    ctx.fillStyle = isWhite ? '#ffffff' : '#e2e8f0';
    ctx.strokeStyle = isWhite ? '#ffffff' : '#94a3b8';
    ctx.lineWidth = 2;

    // Ribcage & spine
    ctx.fillRect(-4, -6, 8, 12);

    // Skull
    ctx.beginPath();
    ctx.arc(0, -14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye sockets
    if (!isWhite) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-3, -16, 2, 3);
      ctx.fillRect(1, -16, 2, 3);
    }

    // Legs
    ctx.strokeStyle = isWhite ? '#ffffff' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(-3, 6);
    ctx.lineTo(-4, 14 + legBob);
    ctx.moveTo(3, 6);
    ctx.lineTo(4, 14 - legBob);
    ctx.stroke();

    // Bone blade in right hand
    ctx.strokeStyle = isWhite ? '#ffffff' : '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(14, -8);
    ctx.stroke();
  }

  // Draw Ghoul Monster
  private drawGhoulMonster(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    const bob = Math.sin(e.animFrame * 6) * 2;

    // Hunched decaying body
    ctx.fillStyle = isWhite ? '#ffffff' : '#334155';
    ctx.beginPath();
    ctx.ellipse(0, 0 + bob, 9, 13, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = isWhite ? '#ffffff' : '#475569';
    ctx.beginPath();
    ctx.arc(4, -13 + bob, 7, 0, Math.PI * 2);
    ctx.fill();

    // Yellow glowing eyes
    if (!isWhite) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(4, -14 + bob, 2, 2);
      ctx.fillRect(7, -14 + bob, 2, 2);
    }

    // Dripping claws
    ctx.strokeStyle = isWhite ? '#ffffff' : '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, -2);
    ctx.lineTo(14, 4);
    ctx.stroke();
  }

  // Draw Cursed Wolf
  private drawWolfMonster(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    const legBob = Math.sin(e.animFrame * 10) * 4;

    ctx.fillStyle = isWhite ? '#ffffff' : '#1c1917';
    // Wolf body
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wolf snout & ears
    ctx.beginPath();
    ctx.moveTo(12, -4);
    ctx.lineTo(20, -1);
    ctx.lineTo(12, 4);
    ctx.closePath();
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.moveTo(8, -5);
    ctx.lineTo(11, -12);
    ctx.lineTo(14, -5);
    ctx.fill();

    // Red predatory eye
    if (!isWhite) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(11, -4, 2, 2);
    }

    // Legs
    ctx.strokeStyle = isWhite ? '#ffffff' : '#292524';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, 4);
    ctx.lineTo(-10, 12 + legBob);
    ctx.moveTo(8, 4);
    ctx.lineTo(10, 12 - legBob);
    ctx.stroke();
  }

  // Draw Spectral Wraith (Ghost)
  private drawWraithMonster(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    const wave = Math.sin(e.animFrame * 5) * 4;

    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = isWhite ? '#ffffff' : '#0891b2';

    // Hood and ethereal cowl
    ctx.beginPath();
    ctx.arc(0, -10, 9, Math.PI, 0);
    ctx.lineTo(10, 8 + wave);
    ctx.quadraticCurveTo(0, 15, -10, 8 - wave);
    ctx.closePath();
    ctx.fill();

    // Cyan glowing phantom eyes
    if (!isWhite) {
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(-3, -11, 2, 4);
      ctx.fillRect(2, -11, 2, 4);
    }
    ctx.restore();
  }

  // Draw Stone Golem
  private drawGolemMonster(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    ctx.fillStyle = isWhite ? '#ffffff' : '#52525b';
    ctx.strokeStyle = isWhite ? '#ffffff' : '#27272a';
    ctx.lineWidth = 3;

    // Chunky stone torso
    ctx.fillRect(-14, -14, 28, 28);
    ctx.strokeRect(-14, -14, 28, 28);

    // Stone head
    ctx.fillStyle = isWhite ? '#ffffff' : '#3f3f46';
    ctx.fillRect(-8, -24, 16, 10);
    ctx.strokeRect(-8, -24, 16, 10);

    // Magma fissure chest
    if (!isWhite) {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-6, -4, 12, 4);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-4, -19, 3, 3);
      ctx.fillRect(2, -19, 3, 3);
    }
  }

  // Boss: Giant Skeletal King (Minute 3 / 5)
  private drawBossKing(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    // Scale up for boss
    ctx.scale(1.7, 1.7);
    this.drawSkeletonMonster(e, isWhite);

    // Golden King's Crown
    if (!isWhite) {
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-8, -21);
      ctx.lineTo(-8, -27);
      ctx.lineTo(-4, -23);
      ctx.lineTo(0, -28);
      ctx.lineTo(4, -23);
      ctx.lineTo(8, -27);
      ctx.lineTo(8, -21);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Royal crimson mantle
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-10, -8, 4, 22);
      ctx.fillRect(6, -8, 4, 22);
    }
  }

  // Boss: Vampire Lord
  private drawVampireLord(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    ctx.scale(1.5, 1.5);
    const wave = Math.sin(e.animFrame * 6) * 3;

    // Crimson cape with high collar
    ctx.fillStyle = isWhite ? '#ffffff' : '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-16, -14);
    ctx.lineTo(-14, 16 + wave);
    ctx.lineTo(14, 16 - wave);
    ctx.lineTo(16, -14);
    ctx.closePath();
    ctx.fill();

    // Dark noble vest
    ctx.fillStyle = isWhite ? '#ffffff' : '#0f172a';
    ctx.fillRect(-6, -8, 12, 18);

    // Pale face
    ctx.fillStyle = isWhite ? '#ffffff' : '#f1f5f9';
    ctx.beginPath();
    ctx.arc(0, -12, 6, 0, Math.PI * 2);
    ctx.fill();

    // Vampire fangs & glowing eyes
    if (!isWhite) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-2, -13, 2, 2);
      ctx.fillRect(1, -13, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -9, 1, 2);
      ctx.fillRect(1, -9, 1, 2);
    }
  }

  // Boss: The Red Death (Grim Reaper)
  private drawReaper(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    ctx.scale(1.8, 1.8);
    const floatBob = Math.sin(e.animFrame * 4) * 4;

    // Dark shadowy cloak
    ctx.fillStyle = isWhite ? '#ffffff' : '#09090b';
    ctx.beginPath();
    ctx.moveTo(0, -16 + floatBob);
    ctx.lineTo(-14, 18 + floatBob);
    ctx.quadraticCurveTo(0, 24 + floatBob, 14, 18 + floatBob);
    ctx.closePath();
    ctx.fill();

    // Glowing red eyes inside hood
    if (!isWhite) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-3, -12 + floatBob, 2, 3);
      ctx.fillRect(2, -12 + floatBob, 2, 3);

      // Colossal Gleaming Scythe
      ctx.strokeStyle = '#71717a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, 16 + floatBob);
      ctx.lineTo(-12, -26 + floatBob);
      ctx.stroke();

      // Scythe crescent blade
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(-22, -24 + floatBob, 14, -0.8, 1.8);
      ctx.stroke();
    }
  }

  // Monster: Gaúcho de Apartamento
  private drawGauchoApartamento(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    const runBob = Math.sin(e.animFrame * 10) * 2.5;

    // Stylish pastel T-shirt
    ctx.fillStyle = isWhite ? '#ffffff' : '#f43f5e';
    ctx.fillRect(-6, -7 + runBob, 12, 14);

    // Bermuda shorts
    ctx.fillStyle = isWhite ? '#ffffff' : '#0284c7';
    ctx.fillRect(-6, 7 + runBob, 12, 6);

    // Pale head & trendy styled hair
    ctx.fillStyle = isWhite ? '#ffffff' : '#fde68a';
    ctx.beginPath();
    ctx.arc(0, -12 + runBob, 6, 0, Math.PI * 2);
    ctx.fill();

    // Dark gelled hair & sunglasses on top of head
    if (!isWhite) {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, -15 + runBob, 6, Math.PI, Math.PI * 2);
      ctx.fill();

      // Sunglasses
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, -14 + runBob, 3, 2);
      ctx.fillRect(1, -14 + runBob, 3, 2);
    }

    // Modern White Sneakers
    ctx.fillStyle = isWhite ? '#ffffff' : '#ffffff';
    ctx.fillRect(-5, 13 + runBob, 4, 3);
    ctx.fillRect(1, 13 - runBob, 4, 3);

    // Holding stainless steel thermal tumbler (Copo Stanley) in hand
    if (!isWhite) {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(6, -2 + runBob, 4, 8);
      ctx.fillStyle = '#22c55e'; // green straw / lid
      ctx.fillRect(7, -5 + runBob, 2, 3);
    }
  }

  // Monster: Saci Pererê
  private drawSaciMonster(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    // Energetic hopping bob with spring compression
    const hop = Math.abs(Math.sin(e.animFrame * 8)) * 6;
    const squish = 1 + (hop > 4 ? -0.15 : 0.1);

    // Mini whirlwind base at bottom
    ctx.fillStyle = 'rgba(217, 119, 6, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 8 + hop * 0.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark acrobatic body
    ctx.fillStyle = isWhite ? '#ffffff' : '#1c1917';
    ctx.beginPath();
    ctx.ellipse(0, 0 - hop, 6 * squish, 9 / squish, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(0, -11 - hop, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Single leg with bent knee hopping
    ctx.strokeStyle = isWhite ? '#ffffff' : '#1c1917';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 7 - hop);
    ctx.lineTo(hop > 3 ? 3 : -2, 11 - hop * 0.5);
    ctx.lineTo(0, 14);
    ctx.stroke();

    // Iconic Red Carapuça (Cap)
    ctx.fillStyle = isWhite ? '#ffffff' : '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-5, -13 - hop);
    ctx.lineTo(5, -13 - hop);
    ctx.lineTo(7, -22 - hop);
    ctx.closePath();
    ctx.fill();

    // Clay pipe (Cachimbo) with smoking wisps
    if (!isWhite) {
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(3, -9 - hop);
      ctx.lineTo(9, -7 - hop);
      ctx.stroke();

      ctx.fillStyle = '#ea580c';
      ctx.fillRect(8, -10 - hop, 3, 3); // ember

      // Smoke puff
      ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
      ctx.beginPath();
      ctx.arc(12, -12 - hop, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Monster: Curupira
  private drawCurupiraMonster(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    const runBob = Math.sin(e.animFrame * 11) * 3;

    // Small agile forest body
    ctx.fillStyle = isWhite ? '#ffffff' : '#15803d';
    ctx.fillRect(-5, -5 + runBob, 10, 12);

    // Head
    ctx.fillStyle = isWhite ? '#ffffff' : '#b45309';
    ctx.beginPath();
    ctx.arc(0, -10 + runBob, 6, 0, Math.PI * 2);
    ctx.fill();

    // Fiery wild blazing hair standing up!
    ctx.fillStyle = isWhite ? '#ffffff' : '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-7, -13 + runBob);
    ctx.lineTo(-4, -23 + runBob);
    ctx.lineTo(-1, -15 + runBob);
    ctx.lineTo(2, -25 + runBob);
    ctx.lineTo(5, -14 + runBob);
    ctx.lineTo(8, -21 + runBob);
    ctx.lineTo(6, -11 + runBob);
    ctx.closePath();
    ctx.fill();

    // Backward-facing feet (Pés virados para trás!)
    ctx.fillStyle = isWhite ? '#ffffff' : '#78350f';
    // Left foot pointing back
    ctx.fillRect(-8, 8 + runBob, 5, 3);
    // Right foot pointing back
    ctx.fillRect(-2, 8 - runBob, 5, 3);

    // Glowing forest animal eyes
    if (!isWhite) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(1, -11 + runBob, 2, 2);
    }
  }

  // Monster: Mula Sem Cabeça
  private drawMulaSemCabeca(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    const gallop = Math.sin(e.animFrame * 12) * 3;
    const legSwing = Math.sin(e.animFrame * 12) * 6;

    // Muscular dark equine torso
    ctx.fillStyle = isWhite ? '#ffffff' : '#312e81';
    ctx.beginPath();
    ctx.ellipse(0, 0 + gallop, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rump & horse tail
    ctx.strokeStyle = isWhite ? '#ffffff' : '#1e1b4b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-15, -2 + gallop);
    ctx.quadraticCurveTo(-22, 5 + gallop, -20, 14 + gallop);
    ctx.stroke();

    // Strong galloping horse legs
    ctx.strokeStyle = isWhite ? '#ffffff' : '#1e1b4b';
    ctx.lineWidth = 3;
    // Front legs
    ctx.beginPath();
    ctx.moveTo(8, 6 + gallop);
    ctx.lineTo(12 + legSwing, 16);
    ctx.stroke();
    // Back legs
    ctx.beginPath();
    ctx.moveTo(-8, 6 + gallop);
    ctx.lineTo(-12 - legSwing, 16);
    ctx.stroke();

    // Silver iron horse shoes
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(10 + legSwing, 15, 4, 3);
    ctx.fillRect(-14 - legSwing, 15, 4, 3);

    // Roaring pillar of flame pouring from neck (instead of a head!)
    const fPulse = Math.sin(e.animFrame * 16) * 3;
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(8, -4 + gallop);
    ctx.lineTo(14, -22 + gallop + fPulse);
    ctx.lineTo(19, -4 + gallop);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(10, -5 + gallop);
    ctx.lineTo(14, -18 + gallop + fPulse * 0.7);
    ctx.lineTo(17, -5 + gallop);
    ctx.closePath();
    ctx.fill();
  }

  // Boss: Boitatá (Cobra de Fogo dos Pampas)
  private drawBossBoitata(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    ctx.scale(1.8, 1.8);
    const wave = Math.sin(e.animFrame * 5);

    // Undulating serpentine body segments with fiery glow
    for (let i = 4; i >= 1; i--) {
      const segX = -i * 11;
      const segY = Math.sin(e.animFrame * 5 - i * 0.8) * 8;
      const r = Math.max(5, 14 - i * 1.8);

      ctx.fillStyle = isWhite ? '#ffffff' : i % 2 === 0 ? '#dc2626' : '#ea580c';
      ctx.beginPath();
      ctx.arc(segX, segY, r, 0, Math.PI * 2);
      ctx.fill();

      // Flame core inside segment
      if (!isWhite) {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(segX, segY, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Great Serpent Head
    ctx.fillStyle = isWhite ? '#ffffff' : '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(4, wave * 3, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Horn crests
    ctx.fillStyle = isWhite ? '#ffffff' : '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(0, -6 + wave * 3);
    ctx.lineTo(-4, -16 + wave * 3);
    ctx.lineTo(4, -8 + wave * 3);
    ctx.fill();

    // Blinding Incandescent Fire Eyes
    if (!isWhite) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, -5 + wave * 3, 4, 3);
      ctx.fillRect(8, 2 + wave * 3, 4, 3);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(10, -4 + wave * 3, 2, 2);
      ctx.fillRect(10, 3 + wave * 3, 2, 2);

      // Forked flame tongue
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, wave * 3);
      ctx.lineTo(24, wave * 3);
      ctx.lineTo(28, wave * 3 - 3);
      ctx.moveTo(24, wave * 3);
      ctx.lineTo(28, wave * 3 + 3);
      ctx.stroke();
    }
  }

  // Boss: Teiniaguá (Princesa Moura Encantada)
  private drawBossTeiniagua(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    ctx.scale(1.7, 1.7);
    const crawl = Math.sin(e.animFrame * 6) * 2;

    // Emerald lizard body with royal crest
    ctx.fillStyle = isWhite ? '#ffffff' : '#047857';
    ctx.beginPath();
    ctx.ellipse(0, crawl, 18, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Scaled crest spines along spine
    ctx.fillStyle = isWhite ? '#ffffff' : '#fbbf24';
    for (let s = -12; s <= 8; s += 5) {
      ctx.beginPath();
      ctx.moveTo(s, -10 + crawl);
      ctx.lineTo(s + 2, -15 + crawl);
      ctx.lineTo(s + 4, -10 + crawl);
      ctx.fill();
    }

    // Long lizard tail swishing
    ctx.strokeStyle = isWhite ? '#ffffff' : '#065f46';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-16, crawl);
    ctx.quadraticCurveTo(-26, crawl + Math.sin(e.animFrame * 8) * 8, -32, crawl);
    ctx.stroke();

    // Four creeping claws
    ctx.strokeStyle = isWhite ? '#ffffff' : '#059669';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(6, -8 + crawl);
    ctx.lineTo(12, -14);
    ctx.moveTo(6, 8 + crawl);
    ctx.lineTo(12, 14);
    ctx.moveTo(-8, -8 + crawl);
    ctx.lineTo(-12, -14);
    ctx.moveTo(-8, 8 + crawl);
    ctx.lineTo(-12, 14);
    ctx.stroke();

    // Regal head
    ctx.fillStyle = isWhite ? '#ffffff' : '#10b981';
    ctx.beginPath();
    ctx.arc(14, crawl, 9, 0, Math.PI * 2);
    ctx.fill();

    // Legendary glowing Carbuncle Ruby Gem on forehead (Pedra de Fogo da Teiniaguá)
    if (!isWhite) {
      const pulse = 1 + Math.sin(e.animFrame * 8) * 0.2;
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(16, crawl - 3, 3.5 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(16, crawl - 4, 1.5, 1.5);
    }
  }

  // Boss Lendário: O Negrinho do Pastoreio (15 Minutos)
  private drawBossNegrinho(e: Enemy, isWhite: boolean) {
    const { ctx } = this;
    ctx.scale(1.75, 1.75);

    const gallop = Math.sin(e.animFrame * 8) * 3;
    const legSwing = Math.sin(e.animFrame * 8) * 6;
    const isCharging = e.teleportState === 'charging';

    // Golden Holy Light Aura surrounding horse and rider
    const auraPulse = 1 + Math.sin(e.animFrame * 10) * (isCharging ? 0.35 : 0.15);
    const grad = ctx.createRadialGradient(0, -6 + gallop, 4, 0, -6 + gallop, 34 * auraPulse);
    grad.addColorStop(0, isCharging ? 'rgba(255, 255, 255, 0.8)' : 'rgba(254, 240, 138, 0.6)');
    grad.addColorStop(0.6, 'rgba(250, 204, 21, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -6 + gallop, 34 * auraPulse, 0, Math.PI * 2);
    ctx.fill();

    // ================= 1. CAVALO BAIO SAGRADO =================
    // Horse Body (Rich warm bay coat)
    ctx.fillStyle = isWhite ? '#ffffff' : '#854d0e';
    ctx.beginPath();
    ctx.ellipse(0, 2 + gallop, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Horse Chest & Neck rising up
    ctx.beginPath();
    ctx.moveTo(8, 2 + gallop);
    ctx.lineTo(14, -12 + gallop);
    ctx.lineTo(8, -12 + gallop);
    ctx.lineTo(2, 2 + gallop);
    ctx.closePath();
    ctx.fill();

    // Horse Head
    ctx.beginPath();
    ctx.ellipse(14, -12 + gallop, 6.5, 4.5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Horse Ears
    ctx.beginPath();
    ctx.moveTo(11, -16 + gallop);
    ctx.lineTo(13, -21 + gallop);
    ctx.lineTo(15, -16 + gallop);
    ctx.fill();

    // Flowing Dark Mane
    ctx.fillStyle = isWhite ? '#ffffff' : '#1c1917';
    for (let m = 0; m < 3; m++) {
      ctx.beginPath();
      ctx.moveTo(10 - m * 3, -14 + gallop + m * 3);
      ctx.lineTo(5 - m * 3, -19 + gallop + m * 3);
      ctx.lineTo(7 - m * 3, -12 + gallop + m * 3);
      ctx.fill();
    }

    // Horse Tail (Flowing dark hair)
    ctx.strokeStyle = isWhite ? '#ffffff' : '#1c1917';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-15, 0 + gallop);
    ctx.quadraticCurveTo(-24, 6 + gallop + Math.sin(e.animFrame * 10) * 4, -26, 16 + gallop);
    ctx.stroke();

    // Horse Legs (Four galloping legs)
    ctx.strokeStyle = isWhite ? '#ffffff' : '#713f12';
    ctx.lineWidth = 2.5;
    // Front Legs
    ctx.beginPath();
    ctx.moveTo(9, 6 + gallop);
    ctx.lineTo(13 + legSwing, 17);
    ctx.moveTo(6, 6 + gallop);
    ctx.lineTo(9 - legSwing, 17);
    // Hind Legs
    ctx.moveTo(-7, 6 + gallop);
    ctx.lineTo(-11 - legSwing, 17);
    ctx.moveTo(-10, 6 + gallop);
    ctx.lineTo(-13 + legSwing, 17);
    ctx.stroke();

    // Golden Hooves (Ferraduras de ouro bento)
    ctx.fillStyle = '#facc15';
    ctx.fillRect(11 + legSwing, 16, 4, 3);
    ctx.fillRect(7 - legSwing, 16, 4, 3);
    ctx.fillRect(-13 - legSwing, 16, 4, 3);
    ctx.fillRect(-15 + legSwing, 16, 4, 3);

    // ================= 2. O NEGRINHO DO PASTOREIO (RIDER) =================
    // Saddle
    ctx.fillStyle = isWhite ? '#ffffff' : '#451a03';
    ctx.fillRect(-6, -4 + gallop, 12, 4);

    // Negrinho's Body / White Shirt
    ctx.fillStyle = isWhite ? '#ffffff' : '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(0, -11 + gallop, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red Lenço Gaúcho around neck
    ctx.fillStyle = isWhite ? '#ffffff' : '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-3, -15 + gallop);
    ctx.lineTo(3, -15 + gallop);
    ctx.lineTo(0, -10 + gallop);
    ctx.closePath();
    ctx.fill();

    // Negrinho's Head (Dark skin, radiant serene face)
    ctx.fillStyle = isWhite ? '#ffffff' : '#3b2314';
    ctx.beginPath();
    ctx.arc(0, -20 + gallop, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Divine Celestial Halo behind head
    if (!isWhite) {
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, -20 + gallop, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Peaceful smiling eyes
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-2, -21 + gallop, 1.5, 1.5);
      ctx.fillRect(1, -21 + gallop, 1.5, 1.5);
    }

    // Right Arm holding up the Lit Candle (Toco de Vela Benta)
    ctx.strokeStyle = isWhite ? '#ffffff' : '#3b2314';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(3, -13 + gallop);
    ctx.lineTo(10, -18 + gallop);
    ctx.lineTo(11, -24 + gallop);
    ctx.stroke();

    // Wax Candle in Hand
    ctx.fillStyle = isWhite ? '#ffffff' : '#ffffff';
    ctx.fillRect(9, -28 + gallop, 4, 8);

    // Candle flame (Chama sagrada que nunca se apaga)
    if (!isWhite) {
      const fWobble = Math.sin(e.animFrame * 16) * 1.5;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(9, -28 + gallop);
      ctx.quadraticCurveTo(8, -34 + gallop, 11 + fWobble, -37 + gallop);
      ctx.quadraticCurveTo(14, -34 + gallop, 13, -28 + gallop);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(10, -28 + gallop);
      ctx.quadraticCurveTo(9, -32 + gallop, 11 + fWobble * 0.5, -34 + gallop);
      ctx.quadraticCurveTo(13, -32 + gallop, 12, -28 + gallop);
      ctx.closePath();
      ctx.fill();
    }

    // 3 Floating Orbiting Candles in circle around Negrinho
    if (!isWhite) {
      for (let c = 0; c < 3; c++) {
        const cAngle = e.animFrame * 4 + (c * Math.PI * 2) / 3;
        const cx = Math.cos(cAngle) * 22;
        const cy = -6 + gallop + Math.sin(cAngle) * 12;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 1.5, cy - 3, 3, 6);

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(cx, cy - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw Boss AoE Hazards & Telegraphed Consecration Circles
  private drawBossHazards(hazards: BossHazardZone[], time: number) {
    const { ctx } = this;
    ctx.save();

    for (const h of hazards) {
      if (!h.detonated) {
        // Telegraphing phase (Charging AoE with glowing runes and countdown)
        const progress = Math.max(0, Math.min(1, 1 - (h.timer / (h.maxTimer || 1))));
        const pulse = 1 + Math.sin(time * 14) * 0.08;

        // Warning ground zone glow
        const grad = ctx.createRadialGradient(h.x, h.y, 2, h.x, h.y, h.radius * pulse);
        grad.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
        grad.addColorStop(0.7, 'rgba(245, 158, 11, 0.25)');
        grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Expanding warning boundary circle
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Shrinking/expanding progress meter ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius * progress, 0, Math.PI * 2);
        ctx.stroke();

        // Sacred Cross / Sun Symbol in center
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(h.x - 14, h.y);
        ctx.lineTo(h.x + 14, h.y);
        ctx.moveTo(h.x, h.y - 14);
        ctx.lineTo(h.x, h.y + 14);
        ctx.stroke();

        // Telegraphed candles around perimeter
        const candleCount = h.type === 'teleport_arrival' ? 6 : 4;
        for (let c = 0; c < candleCount; c++) {
          const cAng = (c / candleCount) * Math.PI * 2 + time * 2;
          const cx = h.x + Math.cos(cAng) * (h.radius - 4);
          const cy = h.y + Math.sin(cAng) * (h.radius - 4);

          // Little glowing candle dot
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Label above hazard
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fef08a';
        const label = h.type === 'teleport_arrival' ? '⚠️ TELETRANSPORTE DO NEGRINHO!' : '⚠️ CONSAGRAÇÃO BENTA!';
        ctx.fillText(label, h.x, h.y - h.radius - 8);
      } else {
        // Detonated / Lingering Holy Flame Phase
        const lifeRatio = Math.max(0, h.duration / 1.5);
        const fPulse = Math.sin(time * 18 + h.id) * 4;

        // Blinding holy eruption
        const grad = ctx.createRadialGradient(h.x, h.y, 4, h.x, h.y, h.radius * 1.1);
        grad.addColorStop(0, `rgba(255, 255, 255, ${0.7 * lifeRatio})`);
        grad.addColorStop(0.3, `rgba(254, 240, 138, ${0.6 * lifeRatio})`);
        grad.addColorStop(0.7, `rgba(245, 158, 11, ${0.4 * lifeRatio})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius * 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Dancing holy flame tongues
        ctx.fillStyle = `rgba(250, 204, 21, ${0.8 * lifeRatio})`;
        for (let f = 0; f < 6; f++) {
          const fAng = (f / 6) * Math.PI * 2 + time * 3;
          const fx = h.x + Math.cos(fAng) * (h.radius * 0.6);
          const fy = h.y + Math.sin(fAng) * (h.radius * 0.6);
          ctx.beginPath();
          ctx.arc(fx, fy + fPulse * 0.5, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  // Recompensa Lendária: A Vela Benta d'O Negrinho do Pastoreio
  private drawVelaNegrinho(x: number, y: number, time: number) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);

    // Divine pulsating celestial halo
    const pulse = 1 + Math.sin(time * 6) * 0.2;
    const grad = ctx.createRadialGradient(0, -6, 2, 0, -6, 32 * pulse);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
    grad.addColorStop(0.4, 'rgba(250, 204, 21, 0.5)');
    grad.addColorStop(0.7, 'rgba(234, 179, 8, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -6, 32 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Sacred vertical light ray beam reaching to heaven
    const beamGrad = ctx.createLinearGradient(0, -60, 0, 10);
    beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    beamGrad.addColorStop(0.6, 'rgba(254, 240, 138, 0.35)');
    beamGrad.addColorStop(1, 'rgba(250, 204, 21, 0.6)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(-6, -60, 12, 70);

    // Golden / wooden saucer (pratinho de barro/ouro da vela)
    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 7, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // White wax candle column (toco de vela benta)
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(-4, -8, 8, 15);
    ctx.fill();
    ctx.stroke();

    // Wax drippings
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3, -2, 2, 5);
    ctx.fillRect(2, 0, 2, 4);

    // Candle wick
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, -12);
    ctx.stroke();

    // Miraculous dancing golden holy flame
    const fWobble = Math.sin(time * 16) * 1.5;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-3, -12);
    ctx.quadraticCurveTo(-4, -18, fWobble, -23);
    ctx.quadraticCurveTo(4, -18, 3, -12);
    ctx.closePath();
    ctx.fill();

    // Flame bright inner core
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-1.5, -12);
    ctx.quadraticCurveTo(-2, -16, fWobble * 0.5, -19);
    ctx.quadraticCurveTo(2, -16, 1.5, -12);
    ctx.closePath();
    ctx.fill();

    // Floating sacred sparks
    for (let s = 0; s < 4; s++) {
      const spAng = time * 3 + (s * Math.PI) / 2;
      const spDist = 14 + Math.sin(time * 5 + s) * 4;
      const spX = Math.cos(spAng) * spDist;
      const spY = -8 + Math.sin(spAng) * spDist * 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(spX, spY, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Health bar & Active Debuff HUD above monsters
  private drawMonsterStatusAndHealth(e: Enemy, time: number) {
    const hasDebuffs = e.statusEffects && e.statusEffects.length > 0;
    const isDamaged = e.hp < e.maxHp;
    const isEliteOrBoss = e.tier === 'elite' || e.tier === 'boss';

    // Only render HUD if damaged, elite/boss, or afflicted with debuffs
    if (!isEliteOrBoss && !isDamaged && !hasDebuffs) return;

    const { ctx } = this;
    const barW = e.tier === 'boss' ? 52 : e.tier === 'elite' ? 34 : 24;
    const barH = e.tier === 'boss' ? 6 : 4;
    const barX = e.x - barW / 2;
    const barY = e.y - e.radius - 12;

    const hpPercent = Math.max(0, Math.min(1, e.hp / e.maxHp));

    // Health Bar Container
    ctx.fillStyle = '#020617';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // HP Fill
    ctx.fillStyle = e.tier === 'boss' ? '#dc2626' : e.tier === 'elite' ? '#f59e0b' : '#22c55e';
    ctx.fillRect(barX, barY, barW * hpPercent, barH);

    // Boss Crown / Title
    if (e.tier === 'boss') {
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('👑 ' + e.name.toUpperCase(), e.x, barY - 4);
    }

    // ================= ACTIVE DEBUFFS HUD =================
    // Displays active status effects (Frozen, Burned, Slowed) with remaining duration meters
    if (hasDebuffs) {
      const badgeSpacing = 16;
      const totalWidth = e.statusEffects!.length * badgeSpacing;
      const startX = e.x - totalWidth / 2 + badgeSpacing / 2;
      const debuffY = barY - (e.tier === 'boss' ? 17 : 9);

      e.statusEffects!.forEach((eff, idx) => {
        const bx = startX + idx * badgeSpacing;
        const durRatio = Math.max(0, Math.min(1, eff.duration / eff.maxDuration));

        ctx.save();
        // Mini badge background
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = eff.type === 'frozen' ? '#38bdf8' : eff.type === 'burned' ? '#ea580c' : '#0284c7';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(bx - 7, debuffY - 7, 14, 14, 3) : ctx.rect(bx - 7, debuffY - 7, 14, 14);
        ctx.fill();
        ctx.stroke();

        // Icon
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icon = eff.type === 'frozen' ? '❄️' : eff.type === 'burned' ? '🔥' : '🐌';
        ctx.fillText(icon, bx, debuffY - 1);

        // Duration meter strip under badge
        ctx.fillStyle = eff.type === 'frozen' ? '#38bdf8' : eff.type === 'burned' ? '#f97316' : '#38bdf8';
        ctx.fillRect(bx - 6, debuffY + 4, 12 * durRatio, 2);

        ctx.restore();
      });
    }
  }

  // Draw Player Character with detailed 2D model
  private drawPlayer(state: RenderState) {
    const { ctx } = this;
    const { player, stats, weapons } = state;

    ctx.save();
    ctx.translate(player.x, player.y);

    // Facing direction flip
    if (player.facingLeft) {
      ctx.scale(-1, 1);
    }

    // Walking animation cycle
    const walkBob = player.isMoving ? Math.sin(player.walkAnim * 12) * 3 : 0;
    const legOffset = player.isMoving ? Math.sin(player.walkAnim * 12) * 6 : 0;

    // Flash white if invulnerable
    const isInvulnerable = player.invulnerableTimer > 0;
    if (isInvulnerable && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Flowing cape on hero back
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(-4, -10 + walkBob);
    ctx.lineTo(-14 - (player.isMoving ? 4 : 0), 12);
    ctx.lineTo(0, 14);
    ctx.closePath();
    ctx.fill();

    // Boots / Legs
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, 8 + legOffset, 4, 8);
    ctx.fillRect(2, 8 - legOffset, 4, 8);

    // Tunic Body
    ctx.fillStyle = player.charColor || '#dc2626';
    ctx.fillRect(-7, -8 + walkBob, 14, 16);

    // Belt with gold buckle
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-8, 3 + walkBob, 16, 3);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-2, 3 + walkBob, 4, 3);

    // Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, -14 + walkBob, 7, 0, Math.PI * 2);
    ctx.fill();

    // Hair / Headband
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(0, -17 + walkBob, 7, Math.PI, Math.PI * 2);
    ctx.fill();

    // Determined Hero Eye
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -15 + walkBob, 2, 2);

    // Equipped weapon representation (Whip coiled or Sword hilt)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(6, -4 + walkBob, 3, 12);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(5, -6 + walkBob, 5, 2);

    ctx.restore();

    // Garlic / Soul Eater Aura around player
    const garlicWeapon = weapons.find((w) => w.id === 'garlic' || w.id === 'soul_eater');
    if (garlicWeapon) {
      const isEvo = garlicWeapon.id === 'soul_eater';
      const auraRadius = (isEvo ? 140 : 75) * stats.area;
      const pulse = 1 + Math.sin(state.timeAlive * 5) * 0.05;

      ctx.save();
      const grad = ctx.createRadialGradient(player.x, player.y, auraRadius * 0.4, player.x, player.y, auraRadius * pulse);
      if (isEvo) {
        grad.addColorStop(0, 'rgba(147, 51, 234, 0.3)');
        grad.addColorStop(0.7, 'rgba(239, 68, 68, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        grad.addColorStop(0, 'rgba(251, 191, 36, 0.25)');
        grad.addColorStop(0.8, 'rgba(245, 158, 11, 0.1)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(player.x, player.y, auraRadius * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Rotating sacred ring
      ctx.strokeStyle = isEvo ? 'rgba(244, 63, 94, 0.5)' : 'rgba(253, 224, 71, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, auraRadius * pulse * 0.9, state.timeAlive * 2, state.timeAlive * 2 + Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Draw Companions (Cusco Caramelo & Matilha Sagrada)
  private drawCompanions(companions: Companion[], time: number) {
    const { ctx } = this;

    for (const c of companions) {
      ctx.save();
      ctx.translate(c.x, c.y);

      // Facing direction
      if (c.facingLeft) {
        ctx.scale(-1, 1);
      }

      const legBob = c.state === 'run' ? Math.sin(c.animFrame * 14) * 3 : 0;
      const tailWag = Math.sin(time * 14 + c.id) * 0.35;

      // Golden supreme aura if evolved
      if (c.isSupreme) {
        const auraPulse = 1 + Math.sin(time * 8 + c.id) * 0.15;
        const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 24 * auraPulse);
        grad.addColorStop(0, 'rgba(251, 191, 36, 0.5)');
        grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 24 * auraPulse, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cusco fur colors (caramel golden brown)
      const furColor = c.isSupreme ? '#fbbf24' : '#d97706';
      const underFur = c.isSupreme ? '#fef08a' : '#fcd34d';
      const earColor = c.isSupreme ? '#f59e0b' : '#b45309';

      // Wagging Tail
      ctx.save();
      ctx.translate(-11, -1);
      ctx.rotate(-0.5 + tailWag);
      ctx.strokeStyle = furColor;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-7, -4, -11, 2);
      ctx.stroke();
      ctx.restore();

      // Dog Torso
      ctx.fillStyle = furColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lighter chest / belly fur
      ctx.fillStyle = underFur;
      ctx.beginPath();
      ctx.ellipse(3, 2, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dog Paws / Legs
      ctx.strokeStyle = furColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      // Front legs
      ctx.beginPath();
      ctx.moveTo(6, 4);
      ctx.lineTo(8, 12 + legBob);
      ctx.moveTo(4, 4);
      ctx.lineTo(3, 12 - legBob);
      // Back legs
      ctx.moveTo(-6, 4);
      ctx.lineTo(-4, 12 - legBob);
      ctx.moveTo(-8, 4);
      ctx.lineTo(-9, 12 + legBob);
      ctx.stroke();

      // Red Lenço Gaúcho / Bandana around neck!
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(4, -3);
      ctx.lineTo(10, -3);
      ctx.lineTo(7, 3);
      ctx.closePath();
      ctx.fill();
      // Lenço knot ends
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(6, 3, 2, 3);
      ctx.fillRect(8, 3, 2, 2);

      // Dog Head
      ctx.fillStyle = furColor;
      ctx.beginPath();
      ctx.arc(8, -6, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Snout
      ctx.fillStyle = underFur;
      ctx.beginPath();
      ctx.ellipse(13, -5, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Black cute nose
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(16, -6, 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Friendly alert eye
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(9, -8, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(9.5, -8.5, 1, 1);

      // Floppy ear
      ctx.fillStyle = earColor;
      ctx.beginPath();
      ctx.moveTo(5, -11);
      ctx.lineTo(9, -11);
      ctx.lineTo(7, -3);
      ctx.closePath();
      ctx.fill();

      // Barking visual mouth/sound lines if state === 'bark'
      if (c.state === 'bark') {
        ctx.strokeStyle = c.isSupreme ? '#fbbf24' : '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(17, -5, 5, -0.6, 0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(17, -5, 9, -0.7, 0.7);
        ctx.stroke();
      }

      // Supreme mini crown / golden laurel if supreme
      if (c.isSupreme) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(5, -12);
        ctx.lineTo(5, -16);
        ctx.lineTo(7, -13);
        ctx.lineTo(9, -17);
        ctx.lineTo(11, -13);
        ctx.lineTo(13, -16);
        ctx.lineTo(13, -12);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // Draw Projectiles & Spell FX
  private drawProjectiles(projectiles: Projectile[], time: number) {
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; // Luminous glowing spell effects

    for (const p of projectiles) {
      if (p.weaponId === 'flying_swords' || p.weaponId === 'thousand_swords') {
        // Glowing cyan/golden orbiting swords
        this.drawOrbitingSword(p, time);
      } else if (p.weaponId === 'whip' || p.weaponId === 'bloody_tear') {
        // Lacerating crescent slash
        this.drawWhipSlash(p);
      } else if (p.weaponId === 'magic_wand' || p.weaponId === 'holy_wand') {
        // Tracking blue/holy magic missile
        this.drawMagicMissile(p);
      } else if (p.weaponId === 'daggers' || p.weaponId === 'thousand_blades') {
        // Fast flying knife
        this.drawDagger(p);
      } else if (p.weaponId === 'lightning_ring' || p.weaponId === 'thunder_loop') {
        // Jagged electric lightning strike
        this.drawLightningBolt(p);
      } else if (p.weaponId === 'king_bible' || p.weaponId === 'unholy_vespers') {
        // Sacred orbiting scriptures
        this.drawBible(p, time);
      } else if (p.weaponId === 'holy_water') {
        // Flying lobbed holy water bottle
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.weaponId === 'espeto_corrido' || p.weaponId === 'espeto_supremo') {
        // Sizzling barbecue skewer in flight
        this.drawEspetoCorrido(p, time);
      } else if (p.weaponId === 'garrucha' || p.weaponId === 'trabuco_farrapo') {
        // High-velocity musket/shotgun lead blast
        this.drawGarruchaBullet(p, time);
      } else if (p.extra?.isDogBark) {
        // Acoustic dog bark shockwave
        this.drawDogBarkWave(p, time);
      }
    }

    ctx.restore();
  }

  // Draw Espeto Corrido (Skewers of churrasco em brasa)
  private drawEspetoCorrido(p: Projectile, time: number) {
    const { ctx } = this;
    const angle = Math.atan2(p.vy, p.vx);
    const isSupreme = p.weaponId === 'espeto_supremo';

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);

    // Glowing brasa trail
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
    grad.addColorStop(0, isSupreme ? 'rgba(251, 191, 36, 0.7)' : 'rgba(249, 115, 22, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    // Long stainless steel skewer blade
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = isSupreme ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();

    // Sharp skewer tip
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(16, -3);
    ctx.lineTo(22, 0);
    ctx.lineTo(16, 3);
    ctx.closePath();
    ctx.fill();

    // Wooden handle at the back
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-22, -3, 6, 6);

    // Meat cuts loaded on skewer (Picanha / Costela)
    const cuts = isSupreme ? [-10, -3, 4, 11] : [-8, 0, 8];
    for (const cx of cuts) {
      // Meat base
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(cx - 3, -5, 6, 10);
      // Fat cap / caramelized crust
      ctx.fillStyle = isSupreme ? '#fde047' : '#f59e0b';
      ctx.fillRect(cx - 3, -6, 6, 2);
      // Grill lines
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - 1, -5, 2, 10);
    }

    ctx.restore();
  }

  // Draw Garrucha Bullet & Muzzle blast
  private drawGarruchaBullet(p: Projectile, time: number) {
    const { ctx } = this;
    const isTrabuco = p.weaponId === 'trabuco_farrapo';

    ctx.save();
    ctx.translate(p.x, p.y);

    // Glowing explosive spark halo
    const haloR = isTrabuco ? 14 : 9;
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, haloR);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, isTrabuco ? '#facc15' : '#f97316');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();

    // Lead shot core
    ctx.fillStyle = isTrabuco ? '#fbbf24' : '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, 0, isTrabuco ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw Dog Bark Shockwave Wave
  private drawDogBarkWave(p: Projectile, time: number) {
    const { ctx } = this;
    const progress = 1 - (p.duration / (p.maxDuration || 0.22));
    const r = p.radius * Math.max(0.2, progress);

    ctx.save();
    ctx.translate(p.x, p.y);

    // Expanding sonic ring
    ctx.strokeStyle = p.color || '#f59e0b';
    ctx.lineWidth = Math.max(1, (1 - progress) * 4);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner sonic ripple
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Draw Orbiting Sword
  private drawOrbitingSword(p: Projectile, time: number) {
    const { ctx } = this;
    const angle = p.extra?.orbitAngle || 0;
    const isEvo = p.weaponId === 'thousand_swords';

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle + Math.PI / 2);

    // Glowing blade
    ctx.fillStyle = isEvo ? '#fef08a' : '#67e8f9';
    ctx.strokeStyle = isEvo ? '#f59e0b' : '#0284c7';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(4, 0);
    ctx.lineTo(2, 10);
    ctx.lineTo(-2, 10);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crossguard and hilt
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-7, 2, 14, 3);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2, 5, 4, 7);

    ctx.restore();
  }

  // Draw Whip Slash Arc
  private drawWhipSlash(p: Projectile) {
    const { ctx } = this;
    const isEvo = p.weaponId === 'bloody_tear';
    const lifeRatio = p.duration / p.maxDuration;

    ctx.save();
    ctx.strokeStyle = isEvo ? `rgba(239, 68, 68, ${lifeRatio})` : `rgba(254, 240, 138, ${lifeRatio})`;
    ctx.lineWidth = isEvo ? 8 : 5;
    ctx.lineCap = 'round';

    const arcLength = p.radius * 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, -0.6, 0.6);
    ctx.stroke();

    // Inner bright core
    ctx.strokeStyle = `rgba(255, 255, 255, ${lifeRatio})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  // Draw Magic Wand Missile
  private drawMagicMissile(p: Projectile) {
    const { ctx } = this;
    const isEvo = p.weaponId === 'holy_wand';

    // Glowing comet halo
    const glow = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.radius * 2);
    glow.addColorStop(0, isEvo ? '#fef08a' : '#a5f3fc');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Bright missile core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Dagger
  private drawDagger(p: Projectile) {
    const { ctx } = this;
    const angle = Math.atan2(p.vy, p.vx);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);

    ctx.fillStyle = p.weaponId === 'thousand_blades' ? '#fde047' : '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -4);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-6, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Draw Lightning Strike connecting from top to target
  private drawLightningBolt(p: Projectile) {
    const { ctx } = this;
    const isEvo = p.weaponId === 'thunder_loop';

    ctx.save();
    ctx.strokeStyle = isEvo ? '#facc15' : '#38bdf8';
    ctx.lineWidth = isEvo ? 5 : 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    let currentX = p.x + (Math.random() - 0.5) * 40;
    let currentY = p.y - 450;
    ctx.moveTo(currentX, currentY);

    const segments = 10;
    const stepY = 450 / segments;
    for (let i = 1; i <= segments; i++) {
      const targetY = currentY + stepY;
      const targetX = i === segments ? p.x : p.x + (Math.random() - 0.5) * 60;
      ctx.lineTo(targetX, targetY);
      currentX = targetX;
      currentY = targetY;
    }
    ctx.stroke();

    // White core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ground impact splash
    ctx.fillStyle = isEvo ? 'rgba(250, 204, 21, 0.6)' : 'rgba(56, 189, 248, 0.6)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw Orbiting Bible
  private drawBible(p: Projectile, time: number) {
    const { ctx } = this;
    const isEvo = p.weaponId === 'unholy_vespers';

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(time * 6);

    ctx.fillStyle = isEvo ? '#7f1d1d' : '#1e3a8a';
    ctx.strokeStyle = isEvo ? '#ef4444' : '#60a5fa';
    ctx.lineWidth = 2;

    ctx.fillRect(-10, -12, 20, 24);
    ctx.strokeRect(-10, -12, 20, 24);

    // Golden cross / seal
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-2, -8, 4, 16);
    ctx.fillRect(-6, -4, 12, 4);

    ctx.restore();
  }

  // Draw Blood Decals / Respingos e Poças de Sangue Gaúcho on the map ground
  private drawBloodDecals(decals: BloodDecal[]) {
    const { ctx } = this;

    for (const d of decals) {
      if (d.alpha <= 0.01) continue;

      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      ctx.globalAlpha = d.alpha * 0.85;

      const steps = 8;

      // 1. Dark outer stain soaked into the ground
      ctx.fillStyle = 'rgba(20, 2, 2, 0.42)';
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const th = (s / steps) * Math.PI * 2;
        const wobble = 1 + Math.sin(th * 3 + d.id * 1.7) * 0.22 + Math.cos(th * 2 + d.id * 2.3) * 0.15;
        const r = (d.radius + 3) * wobble;
        const px = Math.cos(th) * r;
        const py = Math.sin(th) * r * 0.85; // subtle perspective angle
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // 2. Main blood puddle / splatter body
      ctx.fillStyle = d.color;
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const th = (s / steps) * Math.PI * 2;
        const wobble = 1 + Math.sin(th * 3 + d.id * 1.7) * 0.22 + Math.cos(th * 2 + d.id * 2.3) * 0.15;
        const r = d.radius * wobble;
        const px = Math.cos(th) * r;
        const py = Math.sin(th) * r * 0.85;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // 3. Thick coagulated darker center pool
      ctx.fillStyle = d.darkColor;
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const th = (s / steps) * Math.PI * 2;
        const wobble = 1 + Math.sin(th * 4 + d.id * 2.1) * 0.26;
        const r = d.radius * 0.52 * wobble;
        const px = Math.cos(th) * r;
        const py = Math.sin(th) * r * 0.85;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // 4. Satellite droplets and directional streaks
      if (d.points && d.points.length > 0) {
        for (const pt of d.points) {
          ctx.save();
          ctx.translate(pt.dx, pt.dy * 0.85);
          const ptAngle = Math.atan2(pt.dy, pt.dx);
          ctx.rotate(ptAngle);

          // Droplet shadow
          ctx.fillStyle = 'rgba(20, 2, 2, 0.35)';
          ctx.beginPath();
          ctx.ellipse(0, 0, pt.r * 1.35, pt.r * 0.85, 0, 0, Math.PI * 2);
          ctx.fill();

          // Droplet body
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, pt.r * 1.2, pt.r * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();

          // Dark core speck
          ctx.fillStyle = d.darkColor;
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(0.5, pt.r * 0.45), 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      ctx.restore();
    }
  }

  // Draw Particles (Blood, Weapon Impact Sparks, XP and Gold Stars, Shockwave Rings)
  private drawParticles(particles: Particle[]) {
    const { ctx } = this;
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      if (alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.shape === 'blood_drop') {
        // High-viscosity blood droplet flying through air
        const speed = Math.hypot(p.vx, p.vy);
        const angle = Math.atan2(p.vy, p.vx);
        const length = Math.max(p.size * 1.3, Math.min(18, p.size + speed * 0.055));
        const thickness = Math.max(1, p.size * 0.72);

        ctx.translate(p.x, p.y);
        ctx.rotate(angle);

        // Dark clotted rim
        ctx.fillStyle = '#450a0a';
        ctx.beginPath();
        ctx.ellipse(0, 0, length + 0.6, thickness + 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main droplet body
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, length, thickness, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wet glistening specular shine
        ctx.fillStyle = 'rgba(254, 202, 202, 0.65)';
        ctx.beginPath();
        ctx.ellipse(-length * 0.25, -thickness * 0.2, length * 0.35, thickness * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'spark') {
        // Oriented spark streak based on velocity for satisfying slash/impact feedback
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const angle = Math.atan2(p.vy, p.vx);
        const length = Math.max(1.5, Math.max(p.size * 2.2, speed * 0.09));
        const thickness = Math.max(0.8, p.size * 0.7);

        ctx.translate(p.x, p.y);
        ctx.rotate(angle);

        // Core streak
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, length, thickness, 0, 0, Math.PI * 2);
        ctx.fill();

        // White hot center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(1, length * 0.45), Math.max(0.5, thickness * 0.5), 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'star') {
        // 4-pointed gleam star for XP gem collection and critical strikes
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        const s = Math.max(1, p.size);
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.6);
        ctx.lineTo(s * 0.35, -s * 0.35);
        ctx.lineTo(s * 1.6, 0);
        ctx.lineTo(s * 0.35, s * 0.35);
        ctx.lineTo(0, s * 1.6);
        ctx.lineTo(-s * 0.35, s * 0.35);
        ctx.lineTo(-s * 1.6, 0);
        ctx.lineTo(-s * 0.35, -s * 0.35);
        ctx.closePath();
        ctx.fill();

        // Star center highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.5, s * 0.35), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'ring') {
        // Expanding shockwave ring
        const progress = Math.max(0, Math.min(1, 1 - (p.life / p.maxLife)));
        const currentRadius = Math.max(1, p.size + progress * 26);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, (1 - progress) * 3);
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Smooth circle with radial glow
        const radius = Math.max(0.5, p.size);
        if (p.glow) {
          const glowRadius = Math.max(1, radius * 2.5);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
          grad.addColorStop(0, p.color);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // Draw Gold Fever (Frenesi do Pila) golden screen borders, ember aura, and festive glow
  private drawGoldFeverEffects(active: boolean | undefined, timer: number | undefined, time: number) {
    if (!active) return;
    const { ctx, width, height } = this;
    ctx.save();

    // Pulsing golden vignette at screen edge
    const pulse = 0.6 + Math.sin(time * 9) * 0.3;
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.32,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.72
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.7, `rgba(245, 158, 11, ${0.22 * pulse})`);
    grad.addColorStop(1, `rgba(234, 179, 8, ${0.48 * pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Glowing golden outer border
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.75 * pulse})`;
    ctx.lineWidth = 5;
    ctx.strokeRect(3, 3, width - 6, height - 6);

    // Floating gold sparks drifting across the viewport
    const sparkCount = 24;
    for (let i = 0; i < sparkCount; i++) {
      const sx = (Math.sin(i * 47 + time * 2.5) * 0.5 + 0.5) * width;
      const sy = height - ((i * 37 + time * 160) % height);
      const sz = 1.8 + Math.sin(i + time * 8) * 1.2;
      ctx.globalAlpha = 0.55 * pulse;
      ctx.fillStyle = i % 2 === 0 ? '#fef08a' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(sx, sy, sz, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Floating Damage Numbers & Combat Text
  private drawFloatingTexts(texts: FloatingText[]) {
    const { ctx } = this;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const t of texts) {
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.font = t.isCrit ? `bold ${t.size}px 'Cinzel', serif` : `bold ${t.size}px 'Plus Jakarta Sans', sans-serif`;

      // Text outline for high contrast
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = t.isCrit ? 4 : 2.5;
      ctx.strokeText(t.text, t.x, t.y);

      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }

  // Draw Dynamic Weather Atmosphere (Rain, Blizzard, Blood Moon, Ember Storm)
  private drawWeatherEffects(weather: WeatherState, time: number) {
    if (!weather || weather.type === 'clear') return;
    const { ctx, width, height } = this;

    ctx.save();

    if (weather.type === 'rain') {
      // Slanted silver rain streaks
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const dropCount = 70;
      for (let i = 0; i < dropCount; i++) {
        const rx = (Math.sin(i * 99 + time * 15) * 0.5 + 0.5) * width;
        const ry = ((i * 37 + time * 600) % height);
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 8, ry + 16);
      }
      ctx.stroke();

      // Atmospheric rain mist
      ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
      ctx.fillRect(0, 0, width, height);
    } else if (weather.type === 'blizzard') {
      // Swirling snowflakes
      ctx.fillStyle = 'rgba(240, 249, 255, 0.65)';
      const flakeCount = 65;
      for (let i = 0; i < flakeCount; i++) {
        const rx = ((i * 53 + Math.sin(time * 3 + i) * 80 + time * 120) % width);
        const ry = ((i * 31 + time * 180) % height);
        const size = (i % 3) + 1.5;
        ctx.beginPath();
        ctx.arc(rx, ry, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Frosty cold tint vignette
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fillRect(0, 0, width, height);
    } else if (weather.type === 'blood_moon') {
      // Sinister blood mist overlay
      ctx.fillStyle = 'rgba(220, 38, 38, 0.12)';
      ctx.fillRect(0, 0, width, height);

      // Crimson floating soul orbs
      ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
      for (let i = 0; i < 20; i++) {
        const ox = (Math.sin(i * 13 + time * 1.5) * 0.5 + 0.5) * width;
        const oy = height - ((i * 45 + time * 40) % height);
        ctx.beginPath();
        ctx.arc(ox, oy, 2.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (weather.type === 'ember_storm') {
      // Ascending burning fire sparks
      ctx.fillStyle = 'rgba(249, 115, 22, 0.7)';
      for (let i = 0; i < 40; i++) {
        const ox = ((i * 41 + Math.sin(time * 4 + i) * 40) % width);
        const oy = height - ((i * 29 + time * 90) % height);
        ctx.beginPath();
        ctx.arc(ox, oy, 2 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }

      // Amber heat haze tint
      ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  // Dynamic Time-of-Day Theme Atmosphere (Morning / Dusk / Midnight)
  private drawThemeAtmosphere(themePalette?: 'morning' | 'dusk' | 'midnight', time: number = 0) {
    if (!themePalette) return;
    const { ctx, width, height } = this;
    if (width <= 0 || height <= 0) return;
    ctx.save();

    if (themePalette === 'morning') {
      // Golden dawn warmth rising from the horizon
      const dawnGrad = ctx.createLinearGradient(0, height, 0, 0);
      dawnGrad.addColorStop(0, 'rgba(245, 158, 11, 0.08)');
      dawnGrad.addColorStop(0.4, 'rgba(251, 191, 36, 0.04)');
      dawnGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = dawnGrad;
      ctx.fillRect(0, 0, width, height);
    } else if (themePalette === 'dusk') {
      // Fiery crimson & purple twilight wash
      const duskGrad = ctx.createLinearGradient(0, 0, width, height);
      duskGrad.addColorStop(0, 'rgba(234, 88, 12, 0.09)');
      duskGrad.addColorStop(0.5, 'rgba(194, 65, 12, 0.05)');
      duskGrad.addColorStop(1, 'rgba(112, 26, 117, 0.07)');
      ctx.fillStyle = duskGrad;
      ctx.fillRect(0, 0, width, height);
    } else if (themePalette === 'midnight') {
      // Deep lunar starlight blue coldness
      const nightGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.2,
        Math.max(10, width * 0.1),
        width * 0.5,
        height * 0.5,
        Math.max(50, Math.max(width, height) * 0.7)
      );
      nightGrad.addColorStop(0, 'rgba(56, 189, 248, 0.05)');
      nightGrad.addColorStop(1, 'rgba(2, 6, 23, 0.12)');
      ctx.fillStyle = nightGrad;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  // Lighting, dynamic radial player torch & vignette
  private drawLightingAndVignette(
    playerScreenX: number,
    playerScreenY: number,
    stats: PlayerStats,
    stage?: StageConfig,
    weather?: WeatherState
  ) {
    const { ctx, width, height } = this;
    if (width <= 0 || height <= 0) return;
    ctx.save();

    // Dark gothic vignette around the screen with safe radii
    const maxRadius = Math.max(200, Math.max(width, height) * 0.8);
    const innerRadius = Math.min(180, maxRadius * 0.4);
    const vignette = ctx.createRadialGradient(
      playerScreenX,
      playerScreenY,
      innerRadius,
      playerScreenX,
      playerScreenY,
      maxRadius
    );

    if (weather?.type === 'blood_moon') {
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.7, 'rgba(69, 10, 10, 0.45)');
      vignette.addColorStop(1, 'rgba(24, 4, 4, 0.9)');
    } else {
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.7, 'rgba(3, 7, 18, 0.45)');
      vignette.addColorStop(1, 'rgba(2, 6, 23, 0.85)');
    }

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // Warm torchlight centered on player
    ctx.globalCompositeOperation = 'lighter';
    const torch = ctx.createRadialGradient(
      playerScreenX,
      playerScreenY,
      10,
      playerScreenX,
      playerScreenY,
      240
    );
    const torchColor = stage?.id === 'frost_peaks' ? 'rgba(56, 189, 248, 0.15)' :
                       stage?.id === 'blood_crypt' ? 'rgba(239, 68, 68, 0.15)' :
                       'rgba(251, 191, 36, 0.12)';
    torch.addColorStop(0, torchColor);
    torch.addColorStop(0.6, 'rgba(217, 119, 6, 0.04)');
    torch.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = torch;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, 240, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
