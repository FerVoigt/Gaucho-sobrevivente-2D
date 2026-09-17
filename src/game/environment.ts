import * as THREE from 'three';
import { createToonMaterial } from './models';

export interface FloatingIsland {
  mesh: THREE.Group;
  center: THREE.Vector3;
  radius: number;
}

export function buildZuWorld(scene: THREE.Scene): {
  islands: FloatingIsland[];
  petalsSystem: THREE.Points;
  lanterns: THREE.Group[];
  spiritWisps: THREE.Points;
  cloudsGroup: THREE.Group;
} {
  const islands: FloatingIsland[] = [];
  const lanterns: THREE.Group[] = [];

  // ==================== SKY & ATMOSPHERIC FOG ====================
  scene.background = new THREE.Color(0x0a0f1d); // Deep celestial indigo night sky
  scene.fog = new THREE.FogExp2(0x161c32, 0.0095); // Ethereal fantasy mist

  // ==================== CELESTIAL LIGHTING ====================
  // 1. Hemisphere Light: Upper sky soft azure, lower ground rich deep violet
  const hemiLight = new THREE.HemisphereLight(0xa5b4fc, 0x1e1b4b, 0.85);
  scene.add(hemiLight);

  // 2. Main Heavenly Sun Light (Warm Daoist Gold)
  const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
  sunLight.position.set(45, 75, 35);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 180;
  sunLight.shadow.bias = -0.0005;
  const d = 60;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  scene.add(sunLight);

  // 3. Ethereal Rim & Fill Light (Cyan Celestial Chi)
  const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
  fillLight.position.set(-45, 35, -45);
  scene.add(fillLight);

  // 4. Ambient ground bounce
  const ambientLight = new THREE.AmbientLight(0x818cf8, 0.4);
  scene.add(ambientLight);

  // ==================== SEA OF CELESTIAL CLOUDS (蜀山云海) ====================
  const cloudsGroup = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xe0e7ff,
    roughness: 0.9,
    metalness: 0.1,
    transparent: true,
    opacity: 0.55,
    flatShading: true,
  });

  // Create fluffy clusters of cloud puffs floating beneath and around the islands
  const cloudCount = 35;
  for (let i = 0; i < cloudCount; i++) {
    const cloudCluster = new THREE.Group();
    const clusterPuffs = 4 + Math.floor(Math.random() * 4);
    for (let p = 0; p < clusterPuffs; p++) {
      const puffGeo = new THREE.SphereGeometry(6 + Math.random() * 5, 7, 7);
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 14
      );
      puff.scale.set(1.4, 0.6, 1.2);
      cloudCluster.add(puff);
    }

    const angle = (i / cloudCount) * Math.PI * 2;
    const dist = 30 + Math.random() * 70;
    cloudCluster.position.set(
      Math.cos(angle) * dist,
      -14 - Math.random() * 12,
      Math.sin(angle) * dist
    );
    cloudsGroup.add(cloudCluster);
  }
  scene.add(cloudsGroup);

  // ==================== ISLAND 1: MAIN CELESTIAL SHRINE ====================
  const mainIsland = createIslandMesh(28, 14, 0x15803d, 0x334155, true);
  mainIsland.position.set(0, 0, 0);
  scene.add(mainIsland);
  islands.push({ mesh: mainIsland, center: new THREE.Vector3(0, 0, 0), radius: 28 });

  // Main Island Pagoda
  const pagoda = createPagodaMesh();
  pagoda.position.set(0, 0, -10);
  scene.add(pagoda);

  // Paifang Celestial Gate
  const gate = createPaifangGate();
  gate.position.set(0, 0, 16);
  scene.add(gate);

  // Cherry Blossom Trees
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const dist = 15 + Math.sin(i * 3) * 5;
    const treeX = Math.cos(angle) * dist;
    const treeZ = Math.sin(angle) * dist;
    const tree = createCherryTree();
    tree.position.set(treeX, 0, treeZ);
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);
  }

  // Mystic Stone Pillars with Glowing Glyphs
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const pillar = createRunicPillar();
    pillar.position.set(Math.cos(angle) * 21, 0, Math.sin(angle) * 21);
    scene.add(pillar);
  }

  // Floating Lanterns with point lights
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const lantern = createFloatingLantern();
    lantern.position.set(Math.cos(angle) * 12, 2.8 + Math.random() * 1.5, Math.sin(angle) * 12);
    scene.add(lantern);
    lanterns.push(lantern);
  }

  // ==================== ISLAND 2: DEMON CAVE / BEAST GROVE ====================
  const demonIsland = createIslandMesh(24, 12, 0x374151, 0x1e293b, false);
  demonIsland.position.set(55, -2, 25);
  scene.add(demonIsland);
  islands.push({ mesh: demonIsland, center: new THREE.Vector3(55, -2, 25), radius: 24 });

  // Demon Obelisk
  const demonObelisk = createDemonSpire();
  demonObelisk.position.set(55, -2, 25);
  scene.add(demonObelisk);

  // ==================== ISLAND 3: BOSS INFERNAL PEAK ====================
  const bossIsland = createIslandMesh(26, 16, 0x450a0a, 0x1c1917, false);
  bossIsland.position.set(-60, 4, -35);
  scene.add(bossIsland);
  islands.push({ mesh: bossIsland, center: new THREE.Vector3(-60, 4, -35), radius: 26 });

  // Lava Altar
  const lavaAltar = createLavaAltar();
  lavaAltar.position.set(-60, 4, -35);
  scene.add(lavaAltar);

  // ==================== ISLAND 4: SOULFIGHT ARENA (ALTAR SOULFIGHT / 斗魂台) ====================
  // Dedicated PvP dueling ground for high-level immortals (Zu Online Nv. 187 vs Nv. 230)
  const soulfightIsland = createIslandMesh(22, 14, 0x1e293b, 0x0f172a, false);
  soulfightIsland.position.set(0, 12, -78);
  scene.add(soulfightIsland);
  islands.push({ mesh: soulfightIsland, center: new THREE.Vector3(0, 12, -78), radius: 22 });

  // Soulfight Arena Structure (Battle Ring, Runic Pillars & Floating Spirit Swords)
  const soulfightArena = createSoulfightArena();
  soulfightArena.position.set(0, 12, -78);
  scene.add(soulfightArena);

  // ==================== FLOATING MYSTIC BRIDGES ====================
  const bridge1 = createFloatingBridge(new THREE.Vector3(20, 0, 10), new THREE.Vector3(42, -1.5, 20));
  scene.add(bridge1);

  const bridge2 = createFloatingBridge(new THREE.Vector3(-18, 0, -12), new THREE.Vector3(-45, 2.8, -25));
  scene.add(bridge2);

  // Grand Celestial Bridge to Soulfight Altar
  const bridgeSoulfight = createFloatingBridge(new THREE.Vector3(0, 0, -24), new THREE.Vector3(0, 12, -62));
  scene.add(bridgeSoulfight);

  // ==================== PARTICLES: FALLING SAKURA PETALS ====================
  const petalCount = 500;
  const petalGeo = new THREE.BufferGeometry();
  const petalPositions = new Float32Array(petalCount * 3);
  for (let i = 0; i < petalCount; i++) {
    petalPositions[i * 3] = (Math.random() - 0.5) * 130;
    petalPositions[i * 3 + 1] = Math.random() * 35;
    petalPositions[i * 3 + 2] = (Math.random() - 0.5) * 130;
  }
  petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPositions, 3));

  const petalMat = new THREE.PointsMaterial({
    color: 0xf472b6,
    size: 0.38,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });
  const petalsSystem = new THREE.Points(petalGeo, petalMat);
  scene.add(petalsSystem);

  // ==================== PARTICLES: CELESTIAL SPIRIT QI FIREFLIES ====================
  const wispCount = 180;
  const wispGeo = new THREE.BufferGeometry();
  const wispPositions = new Float32Array(wispCount * 3);
  for (let i = 0; i < wispCount; i++) {
    wispPositions[i * 3] = (Math.random() - 0.5) * 80;
    wispPositions[i * 3 + 1] = 1.0 + Math.random() * 12;
    wispPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }
  wispGeo.setAttribute('position', new THREE.BufferAttribute(wispPositions, 3));

  const wispMat = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.28,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const spiritWisps = new THREE.Points(wispGeo, wispMat);
  scene.add(spiritWisps);

  // ==================== DISTANT FLOATING MINI-ISLANDS ====================
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const dist = 110 + Math.random() * 45;
    const miniIsland = createIslandMesh(7 + Math.random() * 6, 8, 0x166534, 0x334155, false);
    miniIsland.position.set(Math.cos(angle) * dist, 8 + Math.random() * 22, Math.sin(angle) * dist);
    scene.add(miniIsland);
  }

  return { islands, petalsSystem, lanterns, spiritWisps, cloudsGroup };
}

// Procedural Floating Island with rocky undercut & courtyard runic circle
function createIslandMesh(
  radius: number,
  depth: number,
  grassColor: number,
  rockColor: number,
  isShrine: boolean = false
): THREE.Group {
  const group = new THREE.Group();

  // Top surface plate
  const topGeo = new THREE.CylinderGeometry(radius, radius * 0.92, 1.4, 24);
  const grassMat = createToonMaterial(grassColor);
  const top = new THREE.Mesh(topGeo, grassMat);
  top.position.y = 0;
  top.receiveShadow = true;
  group.add(top);

  // Rock underside cone (typical floating island aesthetic)
  const underGeo = new THREE.ConeGeometry(radius * 0.92, depth, 16);
  const rockMat = createToonMaterial(rockColor);
  const under = new THREE.Mesh(underGeo, rockMat);
  under.rotation.x = Math.PI;
  under.position.y = -depth / 2;
  group.add(under);

  // Courtyard runic circle if shrine
  if (isShrine) {
    // Outer golden trigram ring
    const ringGeo = new THREE.RingGeometry(radius * 0.65, radius * 0.72, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const runeRing = new THREE.Mesh(ringGeo, ringMat);
    runeRing.position.y = 0.71;
    group.add(runeRing);

    // Inner sacred circle
    const innerGeo = new THREE.RingGeometry(radius * 0.35, radius * 0.38, 24);
    innerGeo.rotateX(-Math.PI / 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const innerRing = new THREE.Mesh(innerGeo, innerMat);
    innerRing.position.y = 0.71;
    group.add(innerRing);
  }

  return group;
}

// Ancient Xianxia Pagoda Shrine
function createPagodaMesh(): THREE.Group {
  const pagoda = new THREE.Group();
  const woodMat = createToonMaterial(0x881337); // Vermilion imperial lacquer
  const roofMat = createToonMaterial(0x065f46); // Jade glazed tiles
  const goldMat = createToonMaterial(0xf59e0b, 0xd97706);

  // 3 Tiers
  for (let tier = 0; tier < 3; tier++) {
    const tierY = tier * 3.5;
    const tierScale = 1 - tier * 0.2;

    // Walls
    const wallGeo = new THREE.BoxGeometry(4.5 * tierScale, 2.5, 4.5 * tierScale);
    const wall = new THREE.Mesh(wallGeo, woodMat);
    wall.position.y = tierY + 1.25;
    wall.castShadow = true;
    pagoda.add(wall);

    // Eaves / Flared Roof
    const roofGeo = new THREE.ConeGeometry(4.8 * tierScale, 1.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = tierY + 3.1;
    roof.castShadow = true;
    pagoda.add(roof);
  }

  // Pagoda Spire
  const spireGeo = new THREE.ConeGeometry(0.3, 2.5, 6);
  const spire = new THREE.Mesh(spireGeo, goldMat);
  spire.position.y = 11.5;
  pagoda.add(spire);

  return pagoda;
}

// Paifang Celestial Gate
function createPaifangGate(): THREE.Group {
  const gate = new THREE.Group();
  const redMat = createToonMaterial(0x991b1b);
  const roofMat = createToonMaterial(0x065f46);
  const goldMat = createToonMaterial(0xf59e0b);

  // 2 Pillars
  const pillarGeo = new THREE.CylinderGeometry(0.35, 0.35, 5, 8);
  const pL = new THREE.Mesh(pillarGeo, redMat);
  pL.position.set(-3.5, 2.5, 0);
  pL.castShadow = true;
  gate.add(pL);

  const pR = new THREE.Mesh(pillarGeo, redMat);
  pR.position.set(3.5, 2.5, 0);
  pR.castShadow = true;
  gate.add(pR);

  // Crossbeam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.6, 0.8), redMat);
  beam.position.set(0, 4.8, 0);
  gate.add(beam);

  // Roof on gate
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 1.0, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 5.7, 0);
  gate.add(roof);

  // Plaque
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 0.1), goldMat);
  plaque.position.set(0, 4.1, 0.45);
  gate.add(plaque);

  return gate;
}

// Cherry Blossom / Spirit Tree
function createCherryTree(): THREE.Group {
  const tree = new THREE.Group();
  const trunkMat = createToonMaterial(0x451a03);
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: 0xdb2777,
    emissiveIntensity: 0.35,
    roughness: 0.5,
  });

  // Gnarled Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3.5, 6);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.75;
  trunk.rotation.z = 0.08;
  trunk.castShadow = true;
  tree.add(trunk);

  // Foliage puffs
  const puffGeo = new THREE.SphereGeometry(1.4, 8, 8);
  const puff1 = new THREE.Mesh(puffGeo, leafMat);
  puff1.position.set(0, 3.8, 0);
  puff1.castShadow = true;
  tree.add(puff1);

  const puff2 = new THREE.Mesh(puffGeo, leafMat);
  puff2.position.set(0.9, 3.2, 0.4);
  puff2.scale.set(0.8, 0.8, 0.8);
  tree.add(puff2);

  const puff3 = new THREE.Mesh(puffGeo, leafMat);
  puff3.position.set(-0.8, 3.3, -0.4);
  puff3.scale.set(0.85, 0.85, 0.85);
  tree.add(puff3);

  return tree;
}

// Ancient Runic Pillar
function createRunicPillar(): THREE.Group {
  const pillar = new THREE.Group();
  const stoneMat = createToonMaterial(0x334155);
  const runeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.0,
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 5, 8), stoneMat);
  body.position.y = 2.5;
  pillar.add(body);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.2, 8), stoneMat);
  cap.position.y = 5.6;
  pillar.add(cap);

  // Glowing rune bands
  const bandGeo = new THREE.TorusGeometry(0.66, 0.05, 6, 16);
  bandGeo.rotateX(Math.PI / 2);
  const b1 = new THREE.Mesh(bandGeo, runeMat);
  b1.position.y = 2.0;
  pillar.add(b1);

  const b2 = new THREE.Mesh(bandGeo, runeMat);
  b2.position.y = 3.6;
  pillar.add(b2);

  return pillar;
}

// Floating Chinese Lantern
function createFloatingLantern(): THREE.Group {
  const lantern = new THREE.Group();
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 0.9,
  });
  const capMat = createToonMaterial(0xd97706);

  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), paperMat);
  globe.scale.set(1, 1.3, 1);
  lantern.add(globe);

  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 8), capMat);
  topCap.position.y = 0.45;
  lantern.add(topCap);

  const bottomCap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 8), capMat);
  bottomCap.position.y = -0.45;
  lantern.add(bottomCap);

  // Soft light
  const light = new THREE.PointLight(0xf97316, 1.8, 8);
  lantern.add(light);

  return lantern;
}

// Demon Spire
function createDemonSpire(): THREE.Group {
  const group = new THREE.Group();
  const obsidianMat = createToonMaterial(0x0f172a);
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0x9333ea,
    emissiveIntensity: 1.2,
  });

  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.5, 9, 6), obsidianMat);
  spire.position.y = 4.5;
  group.add(spire);

  const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), glowMat);
  eye.position.set(0, 9.5, 0);
  group.add(eye);

  return group;
}

// Lava Altar
function createLavaAltar(): THREE.Group {
  const group = new THREE.Group();
  const rockMat = createToonMaterial(0x27272a);
  const lavaMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 1.2,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 1.5, 8), rockMat);
  base.position.y = 0.75;
  group.add(base);

  const lavaPool = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.2, 8), lavaMat);
  lavaPool.position.y = 1.55;
  group.add(lavaPool);

  const flameLight = new THREE.PointLight(0xef4444, 3.5, 22);
  flameLight.position.set(0, 3, 0);
  group.add(flameLight);

  return group;
}

// Floating Stone Bridge
function createFloatingBridge(from: THREE.Vector3, to: THREE.Vector3): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = createToonMaterial(0x475569);

  const count = 7;
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const pos = new THREE.Vector3().lerpVectors(from, to, t);
    pos.y += Math.sin(t * Math.PI) * 1.5;

    const step = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.35, 1.8), stoneMat);
    step.position.copy(pos);
    step.lookAt(to);
    step.castShadow = true;
    group.add(step);
  }

  return group;
}

// ==================== ZU ONLINE SOULFIGHT ARENA (斗魂台) ====================
function createSoulfightArena(): THREE.Group {
  const group = new THREE.Group();

  // Materials
  const marbleMat = createToonMaterial(0x0f172a, 0x0284c7); // Dark Celestial Stone with Azure glow
  const goldRingMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.8,
    metalness: 0.9,
    roughness: 0.2,
  });
  const yinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
  const yangMat = new THREE.MeshStandardMaterial({
    color: 0xfffbeb,
    emissive: 0xfef08a,
    emissiveIntensity: 0.4,
    roughness: 0.3,
  });

  // 1. Grand Circular Duel Platform (Radius 18)
  const ringPlatformGeo = new THREE.CylinderGeometry(18, 19, 1.2, 32);
  const platform = new THREE.Mesh(ringPlatformGeo, marbleMat);
  platform.position.y = 0.6;
  platform.receiveShadow = true;
  group.add(platform);

  // 2. Concentric Gold Inscriptions & Bagua Rings
  const outerGoldRing = new THREE.Mesh(new THREE.RingGeometry(15.5, 16.5, 32), goldRingMat);
  outerGoldRing.rotation.x = -Math.PI / 2;
  outerGoldRing.position.y = 1.22;
  group.add(outerGoldRing);

  const innerGoldRing = new THREE.Mesh(new THREE.RingGeometry(7.5, 8.2, 32), goldRingMat);
  innerGoldRing.rotation.x = -Math.PI / 2;
  innerGoldRing.position.y = 1.23;
  group.add(innerGoldRing);

  // Center Yin-Yang Taiji Disc (Radius 6)
  const yinDisc = new THREE.Mesh(new THREE.CircleGeometry(6, 32, 0, Math.PI), yinMat);
  yinDisc.rotation.x = -Math.PI / 2;
  yinDisc.position.y = 1.24;
  group.add(yinDisc);

  const yangDisc = new THREE.Mesh(new THREE.CircleGeometry(6, 32, Math.PI, Math.PI), yangMat);
  yangDisc.rotation.x = -Math.PI / 2;
  yangDisc.position.y = 1.24;
  group.add(yangDisc);

  // 3. Glowing Golden Forcefield Boundary Ring (Soulfight Barrier)
  const barrierGeo = new THREE.CylinderGeometry(17.8, 17.8, 6.0, 32, 1, true);
  const barrierMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const barrier = new THREE.Mesh(barrierGeo, barrierMat);
  barrier.position.y = 3.6;
  group.add(barrier);

  // 4. Eight Surrounding Runic Obelisks with floating crystals
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const px = Math.cos(angle) * 17.5;
    const pz = Math.sin(angle) * 17.5;

    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(px, 0.6, pz);

    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.8, 4.5, 6);
    const pillarMat = createToonMaterial(0x334155, 0x1e293b);
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 2.25;
    pillarGroup.add(pillar);

    // Floating Rune Crystal atop pillar
    const crystalGeo = new THREE.OctahedronGeometry(0.45, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2,
      roughness: 0.1,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 5.0;
    pillarGroup.add(crystal);

    // Light
    const pl = new THREE.PointLight(0x38bdf8, 1.2, 14);
    pl.position.y = 5.0;
    pillarGroup.add(pl);

    group.add(pillarGroup);
  }

  // 5. Giant Ethereal Flying Swords hovering in circle pointing down
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const px = Math.cos(angle) * 14.5;
    const pz = Math.sin(angle) * 14.5;

    const sword = new THREE.Group();
    sword.position.set(px, 7.5, pz);
    sword.rotation.x = Math.PI; // point downwards

    const bladeGeo = new THREE.BoxGeometry(0.35, 0.08, 4.2);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.85,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    sword.add(blade);

    group.add(sword);
  }

  // 6. Two Faction Banners: Tai Sect (Blue) & Wu Sect (Crimson)
  const taiBanner = createFactionBanner(0x0284c7);
  taiBanner.position.set(-14, 0.6, 0);
  taiBanner.rotation.y = Math.PI / 2;
  group.add(taiBanner);

  const wuBanner = createFactionBanner(0x881337);
  wuBanner.position.set(14, 0.6, 0);
  wuBanner.rotation.y = -Math.PI / 2;
  group.add(wuBanner);

  return group;
}

function createFactionBanner(color: number): THREE.Group {
  const group = new THREE.Group();
  const poleMat = createToonMaterial(0x475569);
  const clothMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.3,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  // Flagpole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 7, 8), poleMat);
  pole.position.y = 3.5;
  group.add(pole);

  // Crossbar
  const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8), poleMat);
  cross.rotation.z = Math.PI / 2;
  cross.position.set(0.9, 6.6, 0);
  group.add(cross);

  // Flowing Banner cloth
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 4.5), clothMat);
  banner.position.set(0.9, 4.2, 0);
  group.add(banner);

  return group;
}
