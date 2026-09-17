import * as THREE from 'three';

export interface Projectile {
  id: string;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetPos: THREE.Vector3;
  targetId: string;
  damage: number;
  color: string;
  isCrit: boolean;
  type: 'talisman' | 'foxfire' | 'lightning' | 'wraith_orb' | 'shockwave' | 'bone_arrow' | 'venom_spit' | 'flying_sword' | 'sword_beam';
  lifeTime: number;
  source: 'player' | 'summon' | 'monster';
  trailTimer?: number;
}

export interface GroundVFX {
  mesh: THREE.Object3D;
  maxLife: number;
  currentLife: number;
  scaleGrowth: number;
  fade: boolean;
  rotationSpeed?: number;
}

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  maxLife: number;
  currentLife: number;
  gravity: number;
  drag: number;
  fade: boolean;
  shrink: boolean;
  startScale: number;
}

export interface SoulOrb {
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  maxLife: number;
  currentLife: number;
}

export class SpellEngine {
  public projectiles: Projectile[] = [];
  public groundVFXs: GroundVFX[] = [];
  public particles: Particle[] = [];
  public soulOrbs: SoulOrb[] = [];
  public targetReticle: THREE.Group | null = null;
  private scene: THREE.Scene;

  // Shared reusable geometries & materials for high-performance rendering
  private sparkGeo: THREE.SphereGeometry;
  private sparkMatCache: Map<number, THREE.MeshBasicMaterial> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.sparkGeo = new THREE.SphereGeometry(0.1, 4, 4);
    this.initTargetReticle();
  }

  private getSparkMat(color: number): THREE.MeshBasicMaterial {
    let mat = this.sparkMatCache.get(color);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
      });
      this.sparkMatCache.set(color, mat);
    }
    return mat;
  }

  // ==================== 3D TARGETING RETICLE ====================
  private initTargetReticle() {
    this.targetReticle = new THREE.Group();
    this.targetReticle.visible = false;

    // Outer rotating trigram rune ring
    const outerGeo = new THREE.RingGeometry(1.6, 1.85, 32);
    outerGeo.rotateX(-Math.PI / 2);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const outerRing = new THREE.Mesh(outerGeo, outerMat);
    this.targetReticle.add(outerRing);

    // 4 cardinal pointer arrows
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const arrowGeo = new THREE.ConeGeometry(0.2, 0.45, 3);
      arrowGeo.rotateX(-Math.PI / 2);
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.position.set(Math.cos(angle) * 2.1, 0.05, Math.sin(angle) * 2.1);
      arrow.rotation.y = -angle + Math.PI / 2;
      this.targetReticle.add(arrow);
    }

    // Inner pulsing ring
    const innerGeo = new THREE.RingGeometry(0.9, 1.05, 24);
    innerGeo.rotateX(-Math.PI / 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const innerRing = new THREE.Mesh(innerGeo, innerMat);
    this.targetReticle.add(innerRing);

    this.scene.add(this.targetReticle);
  }

  public updateTargetReticle(targetPos: THREE.Vector3 | null, delta: number, isBoss: boolean = false) {
    if (!this.targetReticle) return;
    if (!targetPos) {
      this.targetReticle.visible = false;
      return;
    }

    this.targetReticle.visible = true;
    this.targetReticle.position.set(targetPos.x, targetPos.y + 0.12, targetPos.z);

    // Rotate rings
    this.targetReticle.children[0].rotation.z += delta * 1.8;
    if (this.targetReticle.children[5]) {
      this.targetReticle.children[5].rotation.z -= delta * 2.4;
    }

    // Pulse size
    const pulse = 1.0 + Math.sin(Date.now() * 0.006) * 0.08;
    const baseScale = isBoss ? 1.6 : 1.0;
    this.targetReticle.scale.set(baseScale * pulse, 1, baseScale * pulse);
  }

  // ==================== PARTICLE BURSTS ====================
  public spawnSparks(
    center: THREE.Vector3,
    color: number = 0xfacc15,
    count: number = 16,
    speed: number = 6,
    gravity: number = 2.0,
    size: number = 0.14
  ) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(size * (0.6 + Math.random() * 0.8), 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(center);

      // Random spherical velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const v = speed * (0.5 + Math.random() * 0.8);
      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * v,
        Math.cos(phi) * v + 1.5,
        Math.sin(phi) * Math.sin(theta) * v
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        maxLife: 0.6 + Math.random() * 0.5,
        currentLife: 0.6 + Math.random() * 0.5,
        gravity,
        drag: 0.94,
        fade: true,
        shrink: true,
        startScale: 1,
      });
    }
  }

  // ==================== MONSTER DEATH EFFECT ====================
  public spawnMonsterDeathVFX(
    center: THREE.Vector3,
    color: number = 0xfacc15,
    isBoss: boolean = false
  ) {
    // 1. Spiritual purification lotus burst on ground
    const ringGeo = new THREE.RingGeometry(0.8, 1.8, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: isBoss ? 0xf43f5e : color,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(center.x, center.y + 0.1, center.z);
    this.scene.add(ring);

    this.groundVFXs.push({
      mesh: ring,
      maxLife: 1.2,
      currentLife: 1.2,
      scaleGrowth: isBoss ? 5.5 : 3.2,
      fade: true,
      rotationSpeed: 2.0,
    });

    // 2. Ascending Celestial Soul Orb
    const soulGroup = new THREE.Group();
    // Inner glowing core
    const coreGeo = new THREE.SphereGeometry(isBoss ? 0.6 : 0.35, 10, 10);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: isBoss ? 0xff4444 : color,
      emissiveIntensity: 1.8,
    });
    const soulCore = new THREE.Mesh(coreGeo, coreMat);
    soulGroup.add(soulCore);

    // Ethereal halo
    const haloGeo = new THREE.RingGeometry(isBoss ? 0.8 : 0.45, isBoss ? 1.1 : 0.65, 16);
    haloGeo.rotateX(-Math.PI / 2);
    const haloMat = new THREE.MeshBasicMaterial({
      color: isBoss ? 0xfbbf24 : 0x38bdf8,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    soulGroup.add(halo);

    soulGroup.position.copy(center);
    soulGroup.position.y += 0.8;
    this.scene.add(soulGroup);

    this.soulOrbs.push({
      mesh: soulGroup,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        isBoss ? 4.5 : 3.2,
        (Math.random() - 0.5) * 0.4
      ),
      maxLife: 2.2,
      currentLife: 2.2,
    });

    // 3. Scattering spiritual embers & soul fragments
    this.spawnSparks(center, isBoss ? 0xff6b00 : color, isBoss ? 40 : 25, isBoss ? 9 : 6, 1.2, isBoss ? 0.22 : 0.15);
  }

  // ==================== SUMMONER: PAPER TALISMAN THROW ====================
  public spawnTalisman(from: THREE.Vector3, to: THREE.Vector3, targetId: string, damage: number, isCrit: boolean) {
    const talismanGroup = new THREE.Group();

    // Parchment paper
    const paperGeo = new THREE.PlaneGeometry(0.35, 0.7);
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xd97706,
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
    });
    const paper = new THREE.Mesh(paperGeo, paperMat);
    talismanGroup.add(paper);

    // Glowing cinnabar rune in the center of paper
    const runeGeo = new THREE.PlaneGeometry(0.18, 0.45);
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      side: THREE.DoubleSide,
    });
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.position.z = 0.01;
    talismanGroup.add(rune);

    // Surrounding spiritual Qi orb
    const aura = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 })
    );
    talismanGroup.add(aura);

    talismanGroup.position.copy(from);
    talismanGroup.position.y += 1.3;

    const dir = new THREE.Vector3().subVectors(to, talismanGroup.position).normalize();
    talismanGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

    this.scene.add(talismanGroup);
    this.projectiles.push({
      id: Math.random().toString(),
      mesh: talismanGroup,
      position: talismanGroup.position.clone(),
      velocity: dir.multiplyScalar(36),
      targetPos: to.clone(),
      targetId,
      damage,
      color: '#facc15',
      isCrit,
      type: 'talisman',
      lifeTime: 2.2,
      source: 'player',
      trailTimer: 0,
    });
  }

  // ==================== FOX: FOXFIRE FLAMING ORB ====================
  public spawnFoxfire(from: THREE.Vector3, to: THREE.Vector3, targetId: string, damage: number) {
    const fireGroup = new THREE.Group();

    // Core blazing sphere
    const coreGeo = new THREE.SphereGeometry(0.38, 10, 10);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xef4444,
      emissiveIntensity: 1.8,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    fireGroup.add(core);

    // Outer flame corona
    const coronaGeo = new THREE.SphereGeometry(0.55, 8, 8);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.6,
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    fireGroup.add(corona);

    fireGroup.position.copy(from);
    fireGroup.position.y += 1.0;

    const dir = new THREE.Vector3().subVectors(to, fireGroup.position).normalize();
    this.scene.add(fireGroup);

    this.projectiles.push({
      id: Math.random().toString(),
      mesh: fireGroup,
      position: fireGroup.position.clone(),
      velocity: dir.multiplyScalar(30),
      targetPos: to.clone(),
      targetId,
      damage,
      color: '#ef4444',
      isCrit: Math.random() > 0.5,
      type: 'foxfire',
      lifeTime: 2.0,
      source: 'summon',
      trailTimer: 0,
    });
  }

  // ==================== AZURE DRAGON: LIGHTNING BOLT ====================
  public spawnLightning(from: THREE.Vector3, to: THREE.Vector3, targetId: string, damage: number) {
    const start = from.clone().add(new THREE.Vector3(0, 2.0, 0));
    const end = to.clone().add(new THREE.Vector3(0, 1.2, 0));

    // Generate jagged lightning path
    const points: THREE.Vector3[] = [];
    const segments = 8;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pt = new THREE.Vector3().lerpVectors(start, end, t);
      if (i > 0 && i < segments) {
        pt.x += (Math.random() - 0.5) * 1.5;
        pt.y += (Math.random() - 0.5) * 1.5;
        pt.z += (Math.random() - 0.5) * 1.5;
      }
      points.push(pt);
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, 20, 0.16, 5, false);
    const mat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);

    this.groundVFXs.push({
      mesh,
      maxLife: 0.28,
      currentLife: 0.28,
      scaleGrowth: 1.0,
      fade: true,
    });

    // Thunder impact
    this.spawnShockwave(to, 0x38bdf8, 4.5);
    this.spawnSparks(end, 0x38bdf8, 20, 8, 1.5, 0.16);

    return { damage, isCrit: true };
  }

  // ==================== XUANWU / IMPACT SHOCKWAVE ====================
  public spawnShockwave(pos: THREE.Vector3, color: number = 0x10b981, maxScale: number = 5.0) {
    const group = new THREE.Group();

    // Primary shock ring
    const ringGeo = new THREE.RingGeometry(0.5, 1.3, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    // Inner highlight ripple
    const innerGeo = new THREE.RingGeometry(0.2, 0.45, 24);
    innerGeo.rotateX(-Math.PI / 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    group.add(inner);

    group.position.set(pos.x, pos.y + 0.1, pos.z);
    this.scene.add(group);

    this.groundVFXs.push({
      mesh: group,
      maxLife: 0.75,
      currentLife: 0.75,
      scaleGrowth: maxScale,
      fade: true,
    });
  }

  // ==================== SUMMONER: BAGUA FORMATION (HOTKEY E) ====================
  public spawnBaguaArray(center: THREE.Vector3) {
    const group = new THREE.Group();

    // 1. Outer Trigram Circle
    const ringGeo = new THREE.RingGeometry(3.6, 4.2, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    // 2. 8 Trigram symbols placed symmetrically around the circumference
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const glyphGeo = new THREE.BoxGeometry(0.3, 0.05, 0.7);
      const glyphMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const glyph = new THREE.Mesh(glyphGeo, glyphMat);
      glyph.position.set(Math.cos(angle) * 3.9, 0.02, Math.sin(angle) * 3.9);
      glyph.rotation.y = -angle;
      group.add(glyph);
    }

    // 3. Central glowing Yin-Yang pool
    const poolGeo = new THREE.CircleGeometry(2.0, 32);
    poolGeo.rotateX(-Math.PI / 2);
    const poolMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    group.add(pool);

    // 4. Vertical Celestial Qi Light Pillar
    const pillarGeo = new THREE.CylinderGeometry(1.2, 2.2, 14, 16, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 7.0;
    group.add(pillar);

    group.position.set(center.x, center.y + 0.12, center.z);
    this.scene.add(group);

    this.groundVFXs.push({
      mesh: group,
      maxLife: 1.6,
      currentLife: 1.6,
      scaleGrowth: 1.8,
      fade: true,
      rotationSpeed: 1.5,
    });

    // Expanding shockwave & rising sparks
    this.spawnShockwave(center, 0x0284c7, 7.5);
    this.spawnSparks(center, 0x38bdf8, 30, 8, -0.5, 0.18);
  }

  // ==================== MONSTER: WRAITH DARK FIRE ====================
  public spawnWraithOrb(from: THREE.Vector3, to: THREE.Vector3, targetId: string, damage: number) {
    const orbGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x581c87,
      emissive: 0xa855f7,
      emissiveIntensity: 1.5,
    });
    const mesh = new THREE.Mesh(orbGeo, orbMat);
    mesh.position.copy(from);
    mesh.position.y += 1.0;

    const dir = new THREE.Vector3().subVectors(to, mesh.position).normalize();
    this.scene.add(mesh);

    this.projectiles.push({
      id: Math.random().toString(),
      mesh,
      position: mesh.position.clone(),
      velocity: dir.multiplyScalar(22),
      targetPos: to.clone(),
      targetId,
      damage,
      color: '#c084fc',
      isCrit: false,
      type: 'wraith_orb',
      lifeTime: 3.0,
      source: 'monster',
      trailTimer: 0,
    });
  }

  // ==================== MONSTER: SKELETON BONE ARROW ====================
  public spawnBoneArrow(from: THREE.Vector3, to: THREE.Vector3, targetId: string, damage: number) {
    const group = new THREE.Group();

    // Spectral shaft
    const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6);
    shaftGeo.rotateX(Math.PI / 2);
    const shaftMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    group.add(shaft);

    // Glowing arrowhead
    const headGeo = new THREE.ConeGeometry(0.12, 0.35, 4);
    headGeo.rotateX(Math.PI / 2);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.z = 0.6;
    group.add(head);

    group.position.copy(from);
    group.position.y += 1.4;

    const dir = new THREE.Vector3().subVectors(to, group.position).normalize();
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    this.scene.add(group);

    this.projectiles.push({
      id: Math.random().toString(),
      mesh: group,
      position: group.position.clone(),
      velocity: dir.multiplyScalar(28),
      targetPos: to.clone(),
      targetId,
      damage,
      color: '#38bdf8',
      isCrit: false,
      type: 'bone_arrow',
      lifeTime: 2.5,
      source: 'monster',
      trailTimer: 0,
    });
  }

  // ==================== MONSTER: SPIDER VENOM SPIT ====================
  public spawnVenomSpit(from: THREE.Vector3, to: THREE.Vector3, targetId: string, damage: number) {
    const venomGeo = new THREE.SphereGeometry(0.32, 8, 8);
    const venomMat = new THREE.MeshStandardMaterial({
      color: 0x14532d,
      emissive: 0x22c55e,
      emissiveIntensity: 1.6,
    });
    const mesh = new THREE.Mesh(venomGeo, venomMat);
    mesh.position.copy(from);
    mesh.position.y += 0.9;

    const dir = new THREE.Vector3().subVectors(to, mesh.position).normalize();
    this.scene.add(mesh);

    this.projectiles.push({
      id: Math.random().toString(),
      mesh,
      position: mesh.position.clone(),
      velocity: dir.multiplyScalar(24),
      targetPos: to.clone(),
      targetId,
      damage,
      color: '#22c55e',
      isCrit: false,
      type: 'venom_spit',
      lifeTime: 2.5,
      source: 'monster',
      trailTimer: 0,
    });
  }

  // ==================== QINGGONG DASH WIND AURA ====================
  public spawnQinggongDash(from: THREE.Vector3, dir: THREE.Vector3) {
    const dashRingGeo = new THREE.RingGeometry(0.6, 1.4, 16);
    const dashRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(dashRingGeo, dashRingMat);
    ring.position.copy(from);
    ring.position.y += 0.6;
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    this.scene.add(ring);

    this.groundVFXs.push({
      mesh: ring,
      maxLife: 0.4,
      currentLife: 0.4,
      scaleGrowth: 2.0,
      fade: true,
    });

    this.spawnSparks(from, 0x67e8f9, 14, 5, 0.5, 0.12);
  }

  // ==================== ZU ONLINE: FLYING SWORD PROJECTILE (CHUVA DE ESPADAS / MULTI SWORD STRIKE) ====================
  public spawnFlyingSword(
    from: THREE.Vector3,
    to: THREE.Vector3,
    targetId: string,
    damage: number,
    isCrit: boolean,
    source: 'player' | 'monster' = 'player',
    colorHex: number = 0xf59e0b,
    speed: number = 42
  ) {
    const swordGroup = new THREE.Group();

    // 3D Sword Blade
    const bladeGeo = new THREE.BoxGeometry(0.1, 0.03, 1.6);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.9,
      metalness: 0.9,
      roughness: 0.2,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    swordGroup.add(blade);

    // Tip
    const tipGeo = new THREE.ConeGeometry(0.09, 0.35, 4);
    tipGeo.rotateX(-Math.PI / 2);
    const tip = new THREE.Mesh(tipGeo, bladeMat);
    tip.position.z = 0.95;
    swordGroup.add(tip);

    // Crossguard
    const guardGeo = new THREE.BoxGeometry(0.3, 0.05, 0.07);
    const guardMat = new THREE.MeshStandardMaterial({ color: 0xfde047 });
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.z = -0.75;
    swordGroup.add(guard);

    // Aura Glow around blade
    const auraGeo = new THREE.BoxGeometry(0.16, 0.06, 1.8);
    const auraMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    swordGroup.add(aura);

    swordGroup.position.copy(from);
    swordGroup.position.y += 1.2;

    const dir = new THREE.Vector3().subVectors(to, swordGroup.position).normalize();
    swordGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

    this.scene.add(swordGroup);
    this.projectiles.push({
      id: Math.random().toString(),
      mesh: swordGroup,
      position: swordGroup.position.clone(),
      velocity: dir.multiplyScalar(speed),
      targetPos: to.clone(),
      targetId,
      damage,
      color: colorHex === 0xf59e0b ? '#f59e0b' : '#ef4444',
      isCrit,
      type: 'flying_sword',
      lifeTime: 2.5,
      source,
      trailTimer: 0,
    });
  }

  // ==================== ZU ONLINE: SWORD BEAM / AIR EXPLOSION (破空斩) ====================
  public spawnSwordBeam(
    from: THREE.Vector3,
    to: THREE.Vector3,
    targetId: string,
    damage: number,
    isCrit: boolean,
    source: 'player' | 'monster' = 'player',
    colorHex: number = 0xef4444
  ) {
    const beamGroup = new THREE.Group();

    // Crescent Arc Wave Geometry
    const arcGeo = new THREE.TorusGeometry(1.4, 0.12, 8, 24, Math.PI * 0.7);
    const arcMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const arc = new THREE.Mesh(arcGeo, arcMat);
    arc.rotation.z = -Math.PI * 0.35;
    arc.rotation.y = Math.PI / 2;
    beamGroup.add(arc);

    beamGroup.position.copy(from);
    beamGroup.position.y += 1.3;

    const dir = new THREE.Vector3().subVectors(to, beamGroup.position).normalize();
    beamGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

    this.scene.add(beamGroup);
    this.projectiles.push({
      id: Math.random().toString(),
      mesh: beamGroup,
      position: beamGroup.position.clone(),
      velocity: dir.multiplyScalar(38),
      targetPos: to.clone(),
      targetId,
      damage,
      color: '#ef4444',
      isCrit,
      type: 'sword_beam',
      lifeTime: 2.2,
      source,
      trailTimer: 0,
    });
  }

  // ==================== ZU ONLINE: SWIRLING BLADE SHIELD (ESCUDO DE ESPADAS) ====================
  public spawnSwirlingBladeShield(center: THREE.Vector3, duration: number = 5.0) {
    const shieldGroup = new THREE.Group();

    // 6 Orbiting Spirit Swords
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const bladeGeo = new THREE.BoxGeometry(0.08, 0.02, 1.2);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 1.0,
      });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(Math.cos(angle) * 1.8, 1.1, Math.sin(angle) * 1.8);
      blade.rotation.x = Math.PI / 2;
      blade.rotation.z = angle + Math.PI / 2;
      shieldGroup.add(blade);
    }

    // Forcefield Sphere
    const sphereGeo = new THREE.SphereGeometry(2.0, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.y = 1.1;
    shieldGroup.add(sphere);

    shieldGroup.position.copy(center);
    this.scene.add(shieldGroup);

    this.groundVFXs.push({
      mesh: shieldGroup,
      maxLife: duration,
      currentLife: duration,
      scaleGrowth: 0,
      fade: true,
      rotationSpeed: 3.5,
    });
  }

  // ==================== ZU ONLINE: SLASH BURST / DISABLING SWORD (GARROTE) ====================
  public spawnSlashBurst(pos: THREE.Vector3, colorHex: number = 0xf59e0b) {
    for (let i = 0; i < 3; i++) {
      const slashGeo = new THREE.PlaneGeometry(0.12, 2.5);
      const slashMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const slash = new THREE.Mesh(slashGeo, slashMat);
      slash.position.copy(pos);
      slash.position.y += 1.2;
      slash.rotation.set(
        (Math.random() - 0.5) * Math.PI,
        Math.random() * Math.PI,
        (i - 1) * 0.6
      );
      this.scene.add(slash);

      this.groundVFXs.push({
        mesh: slash,
        maxLife: 0.28,
        currentLife: 0.28,
        scaleGrowth: 1.5,
        fade: true,
      });
    }

    this.spawnSparks(pos, colorHex, 20, 7, 0.6, 0.16);
  }

  // ==================== UPDATE MAIN LOOP ====================
  public update(delta: number, onHit: (proj: Projectile) => void) {
    // 1. Update Projectiles & their particle trails
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifeTime -= delta;

      // Move toward target
      p.position.addScaledVector(p.velocity, delta);
      p.mesh.position.copy(p.position);
      p.mesh.rotation.y += delta * 6;
      p.mesh.rotation.z += delta * 4;

      // Spawn subtle particle trail behind projectile
      p.trailTimer = (p.trailTimer || 0) + delta;
      if (p.trailTimer >= 0.04) {
        p.trailTimer = 0;
        const trailColor =
          p.type === 'talisman'
            ? 0xfde047
            : p.type === 'foxfire'
            ? 0xf97316
            : p.type === 'venom_spit'
            ? 0x22c55e
            : p.type === 'wraith_orb'
            ? 0xa855f7
            : p.type === 'flying_sword'
            ? 0xf59e0b
            : p.type === 'sword_beam'
            ? 0xef4444
            : 0x38bdf8;
        this.spawnSparks(p.position, trailColor, 2, 1.2, 0, 0.09);
      }

      const dist = p.position.distanceTo(p.targetPos);
      if (dist < 1.6 || p.lifeTime <= 0) {
        // Hit target!
        onHit(p);

        // Spawn hit impact effects
        if (p.type === 'talisman') {
          this.spawnShockwave(p.position, 0xfacc15, 2.5);
          this.spawnSparks(p.position, 0xfacc15, 12, 6, 2.0, 0.14);
        } else if (p.type === 'flying_sword') {
          this.spawnShockwave(p.position, 0xf59e0b, 3.0);
          this.spawnSparks(p.position, 0xfbbf24, 18, 8, 1.5, 0.16);
        } else if (p.type === 'sword_beam') {
          this.spawnShockwave(p.position, 0xef4444, 4.2);
          this.spawnSparks(p.position, 0xf97316, 22, 9, 2.0, 0.18);
        } else if (p.type === 'foxfire') {
          this.spawnShockwave(p.position, 0xef4444, 3.2);
          this.spawnSparks(p.position, 0xf97316, 16, 7, 1.8, 0.16);
        } else if (p.type === 'venom_spit') {
          this.spawnShockwave(p.position, 0x22c55e, 2.8);
          this.spawnSparks(p.position, 0x16a34a, 12, 5, 2.5, 0.13);
        } else if (p.type === 'bone_arrow') {
          this.spawnShockwave(p.position, 0x38bdf8, 2.0);
          this.spawnSparks(p.position, 0xe0f2fe, 10, 5, 2.0, 0.12);
        } else if (p.type === 'wraith_orb') {
          this.spawnShockwave(p.position, 0xa855f7, 2.8);
          this.spawnSparks(p.position, 0x9333ea, 14, 6, 2.0, 0.14);
        }

        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // 2. Update Ground VFX
    for (let i = this.groundVFXs.length - 1; i >= 0; i--) {
      const vfx = this.groundVFXs[i];
      vfx.currentLife -= delta;
      const progress = 1 - vfx.currentLife / vfx.maxLife;

      const scale = 1 + progress * vfx.scaleGrowth;
      vfx.mesh.scale.set(scale, 1, scale);

      if (vfx.rotationSpeed) {
        vfx.mesh.rotation.y += delta * vfx.rotationSpeed;
      }

      if (vfx.fade) {
        vfx.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material as THREE.MeshBasicMaterial;
            if (mat.opacity !== undefined) {
              mat.opacity = (1 - progress) * 0.9;
            }
          }
        });
      }

      if (vfx.currentLife <= 0) {
        this.scene.remove(vfx.mesh);
        this.groundVFXs.splice(i, 1);
      }
    }

    // 3. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.currentLife -= delta;
      const progress = 1 - pt.currentLife / pt.maxLife;

      // Physics
      pt.velocity.y -= pt.gravity * delta;
      pt.velocity.multiplyScalar(Math.pow(pt.drag, delta * 60));
      pt.mesh.position.addScaledVector(pt.velocity, delta);

      if (pt.fade && pt.mesh.material) {
        (pt.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
      }
      if (pt.shrink) {
        const s = Math.max(0.01, (1 - progress) * pt.startScale);
        pt.mesh.scale.set(s, s, s);
      }

      if (pt.currentLife <= 0) {
        this.scene.remove(pt.mesh);
        pt.mesh.geometry.dispose();
        this.particles.splice(i, 1);
      }
    }

    // 4. Update Ascending Soul Orbs
    for (let i = this.soulOrbs.length - 1; i >= 0; i--) {
      const soul = this.soulOrbs[i];
      soul.currentLife -= delta;
      const progress = 1 - soul.currentLife / soul.maxLife;

      // Ascend to the heavens with gentle swirl
      soul.mesh.position.y += soul.velocity.y * delta;
      soul.mesh.position.x += Math.sin(Date.now() * 0.005 + i) * 0.02;
      soul.mesh.position.z += Math.cos(Date.now() * 0.005 + i) * 0.02;
      soul.mesh.rotation.y += delta * 3;

      // Fade out
      soul.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.opacity !== undefined) {
            mat.transparent = true;
            mat.opacity = 1 - progress;
          }
        }
      });

      if (soul.currentLife <= 0) {
        this.scene.remove(soul.mesh);
        this.soulOrbs.splice(i, 1);
      }
    }
  }

  public cleanup() {
    this.projectiles.forEach((p) => this.scene.remove(p.mesh));
    this.groundVFXs.forEach((v) => this.scene.remove(v.mesh));
    this.particles.forEach((pt) => this.scene.remove(pt.mesh));
    this.soulOrbs.forEach((s) => this.scene.remove(s.mesh));
    if (this.targetReticle) {
      this.scene.remove(this.targetReticle);
    }
    this.projectiles = [];
    this.groundVFXs = [];
    this.particles = [];
    this.soulOrbs = [];
  }
}
