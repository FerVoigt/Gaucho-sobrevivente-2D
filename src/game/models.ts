import * as THREE from 'three';
import { SummonType, MonsterType, ItemRarity } from '../types';

// Helper to create toon/cel-shaded materials with Zu Online vibrant aesthetic
export function createToonMaterial(color: number, emissive: number = 0x000000, roughness: number = 0.4): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: emissive > 0 ? 0.35 : 0,
    roughness,
    metalness: 0.1,
  });
}

// ==================== SUMMONER CHARACTER ====================
export interface PlayerMeshGroup extends THREE.Group {
  userData: {
    leftLeg?: THREE.Mesh;
    rightLeg?: THREE.Mesh;
    leftArm?: THREE.Mesh;
    rightArm?: THREE.Mesh;
    body?: THREE.Mesh;
    halo?: THREE.Group;
    flyingSwordsGroup?: THREE.Group;
    swordMount?: THREE.Group;
    talismans?: THREE.Group;
  };
}

export function createSummonerMesh(): PlayerMeshGroup {
  const group = new THREE.Group() as PlayerMeshGroup;

  // Materials
  const robeMat = createToonMaterial(0x1e3a8a); // Mystic Deep Blue
  const trimMat = createToonMaterial(0xd97706, 0xb45309); // Golden Trim
  const innerRobeMat = createToonMaterial(0xf8fafc); // Pure Silk White
  const skinMat = createToonMaterial(0xfde047); // Light peach
  const hairMat = createToonMaterial(0x0f172a); // Dark Ebony
  const jadeMat = createToonMaterial(0x10b981, 0x059669); // Imperial Jade

  // Body / Torso (Taoist Robes)
  const bodyGeo = new THREE.CylinderGeometry(0.35, 0.5, 1.1, 8);
  const body = new THREE.Mesh(bodyGeo, robeMat);
  body.position.y = 1.1;
  body.castShadow = true;
  group.add(body);

  // Sash / Belt with Jade Pendant
  const beltGeo = new THREE.CylinderGeometry(0.36, 0.42, 0.2, 8);
  const belt = new THREE.Mesh(beltGeo, trimMat);
  belt.position.y = 1.05;
  group.add(belt);

  const pendantGeo = new THREE.OctahedronGeometry(0.12);
  const pendant = new THREE.Mesh(pendantGeo, jadeMat);
  pendant.position.set(0, 0.95, 0.42);
  group.add(pendant);

  // Flowing Robe Skirt (Lower Body)
  const skirtGeo = new THREE.ConeGeometry(0.65, 0.9, 8);
  const skirt = new THREE.Mesh(skirtGeo, innerRobeMat);
  skirt.position.y = 0.5;
  skirt.castShadow = true;
  group.add(skirt);

  // Head
  const headGeo = new THREE.SphereGeometry(0.28, 12, 12);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.85;
  head.castShadow = true;
  group.add(head);

  // Hair & Topknot Bun with Jade Pin
  const hairGeo = new THREE.SphereGeometry(0.29, 12, 12);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 1.9, -0.05);
  hair.scale.set(1.02, 1.05, 1.02);
  group.add(hair);

  const bunGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.22, 8);
  const bun = new THREE.Mesh(bunGeo, hairMat);
  bun.position.set(0, 2.15, -0.05);
  group.add(bun);

  const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6);
  pinGeo.rotateZ(Math.PI / 2);
  const pin = new THREE.Mesh(pinGeo, jadeMat);
  pin.position.set(0, 2.15, -0.05);
  group.add(pin);

  // Arms (Flowing Taoist Sleeves)
  const sleeveGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.7, 8);
  
  const leftArm = new THREE.Mesh(sleeveGeo, robeMat);
  leftArm.position.set(-0.45, 1.3, 0);
  leftArm.rotation.z = 0.2;
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(sleeveGeo, robeMat);
  rightArm.position.set(0.45, 1.3, 0);
  rightArm.rotation.z = -0.2;
  rightArm.castShadow = true;
  group.add(rightArm);

  // Legs (under skirt for walking animation)
  const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.6, 6);
  const leftLeg = new THREE.Mesh(legGeo, robeMat);
  leftLeg.position.set(-0.2, 0.3, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, robeMat);
  rightLeg.position.set(0.2, 0.3, 0);
  group.add(rightLeg);

  // Floating Daoist Bagua Cultivation Halo (Spinning on back)
  const haloGroup = new THREE.Group();
  const ringGeo = new THREE.TorusGeometry(0.65, 0.03, 8, 24);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.85,
  });
  const haloRing = new THREE.Mesh(ringGeo, ringMat);
  haloGroup.add(haloRing);

  // 8 Trigram symbols orbs on the ring
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const orbGeo = new THREE.OctahedronGeometry(0.06);
    const orbMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(Math.cos(angle) * 0.65, Math.sin(angle) * 0.65, 0);
    haloGroup.add(orb);
  }
  haloGroup.position.set(0, 1.4, -0.4);
  group.add(haloGroup);

  // Floating paper Talismans orbiting the summoner
  const talismansGroup = new THREE.Group();
  const paperGeo = new THREE.PlaneGeometry(0.12, 0.28);
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xeab308,
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 4; i++) {
    const paper = new THREE.Mesh(paperGeo, paperMat);
    const angle = (i / 4) * Math.PI * 2;
    paper.position.set(Math.cos(angle) * 0.75, 1.2, Math.sin(angle) * 0.75);
    paper.rotation.y = -angle;
    talismansGroup.add(paper);
  }
  group.add(talismansGroup);

  // Celestial Flying Sword (Mounted when flying)
  const swordMount = new THREE.Group();
  const bladeGeo = new THREE.BoxGeometry(0.2, 0.04, 2.2);
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.7,
    metalness: 0.8,
    roughness: 0.2,
  });
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  swordMount.add(blade);

  const guardGeo = new THREE.BoxGeometry(0.5, 0.06, 0.15);
  const guardMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
  const guard = new THREE.Mesh(guardGeo, guardMat);
  guard.position.z = -0.7;
  swordMount.add(guard);

  const hiltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4);
  hiltGeo.rotateX(Math.PI / 2);
  const hilt = new THREE.Mesh(hiltGeo, createToonMaterial(0x78350f));
  hilt.position.z = -0.9;
  swordMount.add(hilt);

  swordMount.position.set(0, -0.05, 0);
  swordMount.visible = false; // toggled on flying mode
  group.add(swordMount);

  // Attach metadata
  group.userData = {
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    body,
    halo: haloGroup,
    swordMount,
    talismans: talismansGroup,
  };

  return group;
}

// ==================== SUMMON 1: CELESTIAL NINE-TAILED FOX ====================
export function createFoxMesh(): THREE.Group {
  const group = new THREE.Group();

  const furMat = createToonMaterial(0xef4444, 0xb91c1c); // Crimson flame
  const whiteFurMat = createToonMaterial(0xfffbeb, 0xfef08a); // Golden pearl
  const goldMat = createToonMaterial(0xf59e0b, 0xd97706);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // Body
  const bodyGeo = new THREE.CylinderGeometry(0.3, 0.38, 1.2, 8);
  bodyGeo.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, furMat);
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);

  // White chest belly fur
  const chestGeo = new THREE.SphereGeometry(0.32, 8, 8);
  const chest = new THREE.Mesh(chestGeo, whiteFurMat);
  chest.position.set(0, 0.65, 0.35);
  group.add(chest);

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.95, 0.65);

  const headGeo = new THREE.ConeGeometry(0.26, 0.55, 6);
  headGeo.rotateX(-Math.PI / 2);
  const head = new THREE.Mesh(headGeo, furMat);
  headGroup.add(head);

  // Snout tip
  const noseGeo = new THREE.SphereGeometry(0.06, 6, 6);
  const nose = new THREE.Mesh(noseGeo, createToonMaterial(0x0f172a));
  nose.position.set(0, 0, 0.32);
  headGroup.add(nose);

  // Fox Ears
  const earGeo = new THREE.ConeGeometry(0.12, 0.35, 4);
  const earL = new THREE.Mesh(earGeo, furMat);
  earL.position.set(-0.16, 0.28, -0.05);
  earL.rotation.z = -0.25;
  headGroup.add(earL);

  const earR = new THREE.Mesh(earGeo, furMat);
  earR.position.set(0.16, 0.28, -0.05);
  earR.rotation.z = 0.25;
  headGroup.add(earR);

  // Glowing eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
  eyeL.position.set(-0.11, 0.08, 0.16);
  headGroup.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
  eyeR.position.set(0.11, 0.08, 0.16);
  headGroup.add(eyeR);

  group.add(headGroup);

  // Legs (4 paws)
  const legGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.6, 6);
  const positions = [
    [-0.24, 0.3, 0.4],
    [0.24, 0.3, 0.4],
    [-0.24, 0.3, -0.4],
    [0.24, 0.3, -0.4],
  ];
  positions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, whiteFurMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    group.add(leg);
  });

  // Nine Flaming Tails
  const tailsGroup = new THREE.Group();
  tailsGroup.position.set(0, 0.7, -0.55);
  const tailMeshes: THREE.Mesh[] = [];

  for (let i = 0; i < 9; i++) {
    const angle = ((i - 4) / 4) * (Math.PI / 3);
    const tailCurve = new THREE.CylinderGeometry(0.04, 0.16, 1.1, 6);
    const tail = new THREE.Mesh(tailCurve, furMat);
    tail.position.set(Math.sin(angle) * 0.45, 0.45 + Math.abs(Math.cos(angle)) * 0.25, -0.2);
    tail.rotation.x = -0.6;
    tail.rotation.z = -angle * 0.8;
    tailsGroup.add(tail);
    tailMeshes.push(tail);

    // Tip flame
    const tipGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const tip = new THREE.Mesh(tipGeo, goldMat);
    tip.position.set(0, 0.55, 0);
    tail.add(tip);
  }
  group.add(tailsGroup);

  // Orbiting Foxfire Orbs
  const orbsGroup = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 0.9,
      })
    );
    const angle = (i / 3) * Math.PI * 2;
    orb.position.set(Math.cos(angle) * 1.1, 0.9, Math.sin(angle) * 1.1);
    orbsGroup.add(orb);
  }
  group.add(orbsGroup);

  group.userData = { tailsGroup, tailMeshes, orbsGroup };
  group.scale.set(1.15, 1.15, 1.15);
  return group;
}

// ==================== SUMMON 2: XUANWU BLACK TORTOISE ====================
export function createXuanwuMesh(): THREE.Group {
  const group = new THREE.Group();

  const shellMat = createToonMaterial(0x1e293b, 0x0f172a); // Black obsidian stone
  const runeMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.8,
  }); // Emerald jade glow
  const skinMat = createToonMaterial(0x334155);
  const snakeMat = createToonMaterial(0x065f46, 0x047857);

  // Shell Carapace (Large domed hexagon)
  const shellGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.7, 8);
  const shell = new THREE.Mesh(shellGeo, shellMat);
  shell.position.y = 0.8;
  shell.castShadow = true;
  group.add(shell);

  // Shell Runic Plates & Spikes
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const spikeGeo = new THREE.ConeGeometry(0.18, 0.5, 4);
    const spike = new THREE.Mesh(spikeGeo, runeMat);
    spike.position.set(Math.cos(angle) * 0.9, 1.25, Math.sin(angle) * 0.9);
    spike.rotation.x = Math.sin(angle) * 0.3;
    spike.rotation.z = -Math.cos(angle) * 0.3;
    group.add(spike);
  }
  // Center mystic crest
  const centerSpike = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 6), runeMat);
  centerSpike.position.set(0, 1.4, 0);
  group.add(centerSpike);

  // Tortoise Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.7, 1.5);
  const headGeo = new THREE.BoxGeometry(0.6, 0.45, 0.8);
  const head = new THREE.Mesh(headGeo, skinMat);
  headGroup.add(head);

  // Horns
  const hornGeo = new THREE.ConeGeometry(0.1, 0.4, 4);
  const hornL = new THREE.Mesh(hornGeo, runeMat);
  hornL.position.set(-0.25, 0.35, -0.1);
  headGroup.add(hornL);
  const hornR = new THREE.Mesh(hornGeo, runeMat);
  hornR.position.set(0.25, 0.35, -0.1);
  headGroup.add(hornR);

  // Glowing eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), eyeMat);
  eyeL.position.set(-0.31, 0.1, 0.2);
  headGroup.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), eyeMat);
  eyeR.position.set(0.31, 0.1, 0.2);
  headGroup.add(eyeR);

  group.add(headGroup);

  // 4 Massive Pillar Legs
  const legGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.7, 6);
  const legPositions = [
    [-1.0, 0.35, 0.9],
    [1.0, 0.35, 0.9],
    [-1.0, 0.35, -0.9],
    [1.0, 0.35, -0.9],
  ];
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, skinMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    group.add(leg);
  });

  // Coiled Xuanwu Spirit Serpent (coiled over the shell)
  const snakeGroup = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.6, -1.3),
    new THREE.Vector3(0.8, 1.2, -0.5),
    new THREE.Vector3(0.5, 1.4, 0.5),
    new THREE.Vector3(-0.6, 1.5, 0.2),
    new THREE.Vector3(-0.3, 1.9, 1.0),
  ]);
  const snakeGeo = new THREE.TubeGeometry(curve, 20, 0.12, 6, false);
  const snake = new THREE.Mesh(snakeGeo, snakeMat);
  snakeGroup.add(snake);

  // Snake head looking forward
  const snakeHeadGeo = new THREE.ConeGeometry(0.2, 0.45, 5);
  snakeHeadGeo.rotateX(Math.PI / 2);
  const snakeHead = new THREE.Mesh(snakeHeadGeo, snakeMat);
  snakeHead.position.set(-0.3, 1.95, 1.2);
  snakeGroup.add(snakeHead);

  const snakeEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), eyeMat);
  snakeEye.position.set(-0.22, 2.02, 1.2);
  snakeGroup.add(snakeEye);

  group.add(snakeGroup);

  group.userData = { headGroup, snakeGroup };
  group.scale.set(1.1, 1.1, 1.1);
  return group;
}

// ==================== SUMMON 3: AZURE CELESTIAL DRAGON ====================
export function createDragonMesh(): THREE.Group {
  const group = new THREE.Group();

  const scaleMat = createToonMaterial(0x0284c7, 0x0369a1); // Azure blue
  const bellyMat = createToonMaterial(0xfef08a, 0xf59e0b); // Golden belly
  const maneMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.8,
  });
  const antlerMat = createToonMaterial(0xd97706);

  // Segmented Serpentine Dragon Body
  const segments: THREE.Mesh[] = [];
  const numSegments = 12;

  for (let i = 0; i < numSegments; i++) {
    const radius = Math.sin((i / numSegments) * Math.PI) * 0.35 + 0.15;
    const segGeo = new THREE.SphereGeometry(radius, 8, 8);
    const seg = new THREE.Mesh(segGeo, i % 2 === 0 ? scaleMat : maneMat);
    seg.position.set(0, 1.8 + Math.sin(i * 0.5) * 0.3, -i * 0.45);
    group.add(seg);
    segments.push(seg);

    // Spine dorsal fin / mane
    const finGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
    const fin = new THREE.Mesh(finGeo, maneMat);
    fin.position.set(0, radius + 0.1, 0);
    seg.add(fin);
  }

  // Dragon Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.9, 0.4);

  const snoutGeo = new THREE.BoxGeometry(0.5, 0.4, 0.8);
  const snout = new THREE.Mesh(snoutGeo, scaleMat);
  headGroup.add(snout);

  const chinGeo = new THREE.BoxGeometry(0.4, 0.2, 0.6);
  const chin = new THREE.Mesh(chinGeo, bellyMat);
  chin.position.set(0, -0.2, 0.1);
  headGroup.add(chin);

  // Majestic Antlers
  const antlerGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.7, 5);
  const antlerL = new THREE.Mesh(antlerGeo, antlerMat);
  antlerL.position.set(-0.25, 0.45, -0.2);
  antlerL.rotation.z = -0.5;
  antlerL.rotation.x = -0.4;
  headGroup.add(antlerL);

  const antlerR = new THREE.Mesh(antlerGeo, antlerMat);
  antlerR.position.set(0.25, 0.45, -0.2);
  antlerR.rotation.z = 0.5;
  antlerR.rotation.x = -0.4;
  headGroup.add(antlerR);

  // Whiskers
  const whiskerGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4);
  whiskerGeo.rotateX(Math.PI / 3);
  const whiskerL = new THREE.Mesh(whiskerGeo, maneMat);
  whiskerL.position.set(-0.28, -0.05, 0.3);
  whiskerL.rotation.y = -0.4;
  headGroup.add(whiskerL);

  const whiskerR = new THREE.Mesh(whiskerGeo, maneMat);
  whiskerR.position.set(0.28, -0.05, 0.3);
  whiskerR.rotation.y = 0.4;
  headGroup.add(whiskerR);

  // Glowing Dragon Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
  eyeL.position.set(-0.26, 0.15, 0.15);
  headGroup.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
  eyeR.position.set(0.26, 0.15, 0.15);
  headGroup.add(eyeR);

  group.add(headGroup);

  // Floating Claws / Paws
  const clawGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.5, 4);
  const clawMat = createToonMaterial(0xf59e0b);
  const clawL = new THREE.Mesh(clawGeo, clawMat);
  clawL.position.set(-0.6, 1.4, -0.5);
  clawL.rotation.z = 0.5;
  group.add(clawL);

  const clawR = new THREE.Mesh(clawGeo, clawMat);
  clawR.position.set(0.6, 1.4, -0.5);
  clawR.rotation.z = -0.5;
  group.add(clawR);

  group.userData = { segments, headGroup, whiskerL, whiskerR };
  group.scale.set(1.2, 1.2, 1.2);
  return group;
}

// ==================== MONSTERS ====================

// 1. Morcego Demônio Sombrio (Shadow Fiend Bat)
export function createBatMonsterMesh(): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = createToonMaterial(0x4c1d95, 0x3b0764); // Dark purple
  const wingMat = createToonMaterial(0x2e1065);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  // Body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), bodyMat);
  body.position.y = 1.2;
  body.scale.set(1, 1.2, 0.8);
  group.add(body);

  // Head & Fangs
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 6), bodyMat);
  head.rotation.x = -Math.PI / 2;
  head.position.set(0, 1.3, 0.35);
  group.add(head);

  // Eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), eyeMat);
  eyeL.position.set(-0.12, 1.4, 0.35);
  group.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), eyeMat);
  eyeR.position.set(0.12, 1.4, 0.35);
  group.add(eyeR);

  // Wings (Flapping)
  const wingGeo = new THREE.PlaneGeometry(1.0, 0.6);
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-0.7, 1.3, 0);
  group.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(0.7, 1.3, 0);
  group.add(rightWing);

  group.userData = { leftWing, rightWing, hoverHeight: 1.5 };
  return group;
}

// 2. Gárgula de Jade Demoníaca (Jade Corrupted Beast)
export function createGargoyleMonsterMesh(): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = createToonMaterial(0x064e3b, 0x022c22); // Dark jade
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.8,
  });

  // Torso
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.7), stoneMat);
  body.position.y = 1.0;
  body.castShadow = true;
  group.add(body);

  // Runic core in chest
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), glowMat);
  core.position.set(0, 1.0, 0.38);
  group.add(core);

  // Head with horns
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), stoneMat);
  head.position.set(0, 1.7, 0.1);
  group.add(head);

  const hornGeo = new THREE.ConeGeometry(0.1, 0.4, 4);
  const hornL = new THREE.Mesh(hornGeo, glowMat);
  hornL.position.set(-0.25, 2.05, 0);
  hornL.rotation.z = -0.3;
  group.add(hornL);

  const hornR = new THREE.Mesh(hornGeo, glowMat);
  hornR.position.set(0.25, 2.05, 0);
  hornR.rotation.z = 0.3;
  group.add(hornR);

  // Arms & Claws
  const armGeo = new THREE.BoxGeometry(0.25, 0.8, 0.3);
  const armL = new THREE.Mesh(armGeo, stoneMat);
  armL.position.set(-0.65, 0.9, 0.2);
  group.add(armL);

  const armR = new THREE.Mesh(armGeo, stoneMat);
  armR.position.set(0.65, 0.9, 0.2);
  group.add(armR);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.3, 0.5, 0.4);
  const legL = new THREE.Mesh(legGeo, stoneMat);
  legL.position.set(-0.3, 0.25, 0);
  group.add(legL);

  const legR = new THREE.Mesh(legGeo, stoneMat);
  legR.position.set(0.3, 0.25, 0);
  group.add(legR);

  return group;
}

// 3. Espectro da Chama Negra (Void Wraith / Revenant)
export function createWraithMonsterMesh(): THREE.Group {
  const group = new THREE.Group();
  const clothMat = createToonMaterial(0x18181b); // Shadow Black
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0x9333ea,
    emissiveIntensity: 0.9,
  });

  // Floating robe body
  const bodyGeo = new THREE.ConeGeometry(0.5, 1.4, 7);
  const body = new THREE.Mesh(bodyGeo, clothMat);
  body.position.y = 1.0;
  group.add(body);

  // Dark Hood
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), clothMat);
  hood.position.set(0, 1.8, 0);
  group.add(hood);

  // Glowing void eyes inside hood
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), glowMat);
  eyeL.position.set(-0.1, 1.8, 0.26);
  group.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), glowMat);
  eyeR.position.set(0.1, 1.8, 0.26);
  group.add(eyeR);

  // Floating ghostly hands with dark fire orbs
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), glowMat);
  handL.position.set(-0.6, 1.2, 0.4);
  group.add(handL);

  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), glowMat);
  handR.position.set(0.6, 1.2, 0.4);
  group.add(handR);

  group.userData = { handL, handR, hoverHeight: 0.8 };
  return group;
}

// 4. CHEFE: Rei Demônio de Lava (Infernal Minotaur Boss)
export function createBossMonsterMesh(): THREE.Group {
  const group = new THREE.Group();
  const armorMat = createToonMaterial(0x451a03);
  const skinMat = createToonMaterial(0x7f1d1d, 0x450a0a); // Lava crimson
  const lavaMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 0.95,
  });

  // Massive Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.0, 1.3), skinMat);
  torso.position.y = 2.4;
  torso.castShadow = true;
  group.add(torso);

  // Chest Armor with glowing lava cracks
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.2, 1.4), armorMat);
  chestPlate.position.y = 2.6;
  group.add(chestPlate);

  const lavaHeart = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), lavaMat);
  lavaHeart.position.set(0, 2.6, 0.75);
  group.add(lavaHeart);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), skinMat);
  head.position.set(0, 3.8, 0.2);
  group.add(head);

  // Colossal Curved Horns
  const hornGeo = new THREE.ConeGeometry(0.2, 1.2, 6);
  const hornL = new THREE.Mesh(hornGeo, lavaMat);
  hornL.position.set(-0.7, 4.3, 0);
  hornL.rotation.z = -0.8;
  hornL.rotation.x = -0.3;
  group.add(hornL);

  const hornR = new THREE.Mesh(hornGeo, lavaMat);
  hornR.position.set(0.7, 4.3, 0);
  hornR.rotation.z = 0.8;
  hornR.rotation.x = -0.3;
  group.add(hornR);

  // Giant Shoulders
  const pauldronGeo = new THREE.SphereGeometry(0.65, 8, 8);
  const pauldronL = new THREE.Mesh(pauldronGeo, armorMat);
  pauldronL.position.set(-1.4, 3.2, 0);
  group.add(pauldronL);

  const pauldronR = new THREE.Mesh(pauldronGeo, armorMat);
  pauldronR.position.set(1.4, 3.2, 0);
  group.add(pauldronR);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.6, 8);
  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-1.4, 1.8, 0);
  group.add(armL);

  const armR = new THREE.Mesh(armGeo, skinMat);
  armR.position.set(1.4, 1.8, 0);
  group.add(armR);

  // Giant Boss Great-Club / Axe in Right Arm
  const weaponGroup = new THREE.Group();
  weaponGroup.position.set(1.4, 1.0, 0.4);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.8), armorMat);
  weaponGroup.add(handle);
  const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.3), lavaMat);
  axeHead.position.set(0, 1.1, 0);
  weaponGroup.add(axeHead);
  group.add(weaponGroup);

  // Pillar Legs
  const legGeo = new THREE.CylinderGeometry(0.45, 0.5, 1.5, 8);
  const legL = new THREE.Mesh(legGeo, armorMat);
  legL.position.set(-0.6, 0.75, 0);
  legL.castShadow = true;
  group.add(legL);

  const legR = new THREE.Mesh(legGeo, armorMat);
  legR.position.set(0.6, 0.75, 0);
  legR.castShadow = true;
  group.add(legR);

  group.userData = { weaponGroup, isBoss: true };
  group.scale.set(1.6, 1.6, 1.6);
  return group;
}

// 5. Goblin Errante (Wandering Goblin - Nv. 2)
export function createGoblinMonsterMesh(): THREE.Group {
  const group = new THREE.Group();
  const skinMat = createToonMaterial(0x22c55e, 0x15803d); // Vibrant goblin green
  const leatherMat = createToonMaterial(0x78350f); // Tattered brown leather
  const metalMat = createToonMaterial(0x94a3b8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Yellow sinister eyes

  // Torso
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.35), leatherMat);
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), skinMat);
  head.position.set(0, 1.05, 0.05);
  group.add(head);

  // Big Pointed Goblin Ears
  const earGeo = new THREE.ConeGeometry(0.1, 0.35, 4);
  const earL = new THREE.Mesh(earGeo, skinMat);
  earL.position.set(-0.32, 1.15, 0);
  earL.rotation.z = 1.1;
  earL.rotation.x = -0.2;
  group.add(earL);

  const earR = new THREE.Mesh(earGeo, skinMat);
  earR.position.set(0.32, 1.15, 0);
  earR.rotation.z = -1.1;
  earR.rotation.x = -0.2;
  group.add(earR);

  // Sinister Eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), eyeMat);
  eyeL.position.set(-0.1, 1.1, 0.22);
  group.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), eyeMat);
  eyeR.position.set(0.1, 1.1, 0.22);
  group.add(eyeR);

  // Arms with Jagged Iron Dagger
  const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);
  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-0.35, 0.65, 0);
  armL.rotation.z = 0.3;
  group.add(armL);

  const armRGroup = new THREE.Group();
  armRGroup.position.set(0.35, 0.65, 0);
  const armR = new THREE.Mesh(armGeo, skinMat);
  armRGroup.add(armR);

  // Dagger in right hand
  const daggerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25), leatherMat);
  daggerHandle.position.set(0, -0.25, 0.1);
  armRGroup.add(daggerHandle);

  const daggerBlade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 4), metalMat);
  daggerBlade.position.set(0, -0.25, 0.38);
  daggerBlade.rotation.x = Math.PI / 2;
  armRGroup.add(daggerBlade);

  group.add(armRGroup);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.16, 0.38, 0.18);
  const legL = new THREE.Mesh(legGeo, leatherMat);
  legL.position.set(-0.16, 0.19, 0);
  group.add(legL);

  const legR = new THREE.Mesh(legGeo, leatherMat);
  legR.position.set(0.16, 0.19, 0);
  group.add(legR);

  group.userData = { armRGroup, legL, legR };
  group.scale.set(0.9, 0.9, 0.9);
  return group;
}

// 6. Orc Guerreiro (Orc Warrior - Nv. 6)
export function createOrcMonsterMesh(): THREE.Group {
  const group = new THREE.Group();
  const skinMat = createToonMaterial(0x166534, 0x14532d); // Dark brute green
  const leatherMat = createToonMaterial(0x451a03);
  const woodMat = createToonMaterial(0x522e1b);
  const metalMat = createToonMaterial(0x64748b);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  // Muscular Torso with Leather Straps
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.7), skinMat);
  torso.position.y = 1.3;
  torso.castShadow = true;
  group.add(torso);

  const harness = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.25, 0.74), leatherMat);
  harness.position.y = 1.4;
  group.add(harness);

  // Spiked Pauldrons (Shoulder guards)
  const pauldronGeo = new THREE.BoxGeometry(0.45, 0.35, 0.5);
  const pL = new THREE.Mesh(pauldronGeo, metalMat);
  pL.position.set(-0.75, 1.8, 0);
  group.add(pL);
  const pR = new THREE.Mesh(pauldronGeo, metalMat);
  pR.position.set(0.75, 1.8, 0);
  group.add(pR);

  // Orc Head & Protruding Tusks
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.6), skinMat);
  head.position.set(0, 2.05, 0.1);
  group.add(head);

  // Crimson Eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), eyeMat);
  eyeL.position.set(-0.16, 2.15, 0.4);
  group.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), eyeMat);
  eyeR.position.set(0.16, 2.15, 0.4);
  group.add(eyeR);

  // Tusks
  const tuskGeo = new THREE.ConeGeometry(0.06, 0.28, 4);
  const tuskL = new THREE.Mesh(tuskGeo, metalMat);
  tuskL.position.set(-0.18, 1.95, 0.42);
  tuskL.rotation.x = -0.4;
  group.add(tuskL);

  const tuskR = new THREE.Mesh(tuskGeo, metalMat);
  tuskR.position.set(0.18, 1.95, 0.42);
  tuskR.rotation.x = -0.4;
  group.add(tuskR);

  // Arms & Massive Spiked War Club
  const armGeo = new THREE.CylinderGeometry(0.2, 0.18, 1.0, 6);
  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-0.75, 1.1, 0.1);
  group.add(armL);

  const weaponGroup = new THREE.Group();
  weaponGroup.position.set(0.75, 1.2, 0.1);
  const armR = new THREE.Mesh(armGeo, skinMat);
  weaponGroup.add(armR);

  // War Club
  const clubHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6), woodMat);
  clubHandle.position.set(0, -0.2, 0.35);
  clubHandle.rotation.x = 0.5;
  weaponGroup.add(clubHandle);

  const clubHead = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.14, 0.7, 6), metalMat);
  clubHead.position.set(0, 0.4, 0.65);
  clubHead.rotation.x = 0.5;
  weaponGroup.add(clubHead);

  group.add(weaponGroup);

  // Sturdy Legs
  const legGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.8, 6);
  const legL = new THREE.Mesh(legGeo, leatherMat);
  legL.position.set(-0.35, 0.4, 0);
  group.add(legL);

  const legR = new THREE.Mesh(legGeo, leatherMat);
  legR.position.set(0.35, 0.4, 0);
  group.add(legR);

  group.userData = { weaponGroup };
  group.scale.set(1.15, 1.15, 1.15);
  return group;
}

// 7. Esqueleto Arqueiro (Skeleton Archer - Nv. 4)
export function createSkeletonArcherMesh(): THREE.Group {
  const group = new THREE.Group();
  const boneMat = createToonMaterial(0xf1f5f9, 0xe2e8f0);
  const darkMat = createToonMaterial(0x334155);
  const bowMat = createToonMaterial(0xb45309);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 }); // Spectral Cyan eyes

  // Exposed Spine & Ribcage
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6), boneMat);
  spine.position.y = 1.0;
  group.add(spine);

  // Ribs
  for (let r = 0; r < 3; r++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.26 - r * 0.03, 0.04, 4, 8, Math.PI), boneMat);
    rib.position.set(0, 1.15 - r * 0.18, 0);
    rib.rotation.x = Math.PI / 2;
    group.add(rib);
  }

  // Skull
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.42), boneMat);
  skull.position.set(0, 1.7, 0.05);
  group.add(skull);

  // Spectral Cyan Eyes Inside Sockets
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), eyeMat);
  eyeL.position.set(-0.11, 1.72, 0.25);
  group.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), eyeMat);
  eyeR.position.set(0.11, 1.72, 0.25);
  group.add(eyeR);

  // Left Arm Holding Recurve Bone Bow
  const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 4);
  const armLGroup = new THREE.Group();
  armLGroup.position.set(-0.4, 1.3, 0.2);
  const armL = new THREE.Mesh(armGeo, boneMat);
  armL.rotation.x = -Math.PI / 3;
  armLGroup.add(armL);

  // Bone Bow
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 4, 12, Math.PI * 0.8), bowMat);
  bow.position.set(0, -0.1, 0.4);
  bow.rotation.y = Math.PI / 2;
  armLGroup.add(bow);
  group.add(armLGroup);

  // Right Arm Drawing Bowstring
  const armRGroup = new THREE.Group();
  armRGroup.position.set(0.35, 1.3, 0);
  const armR = new THREE.Mesh(armGeo, boneMat);
  armR.rotation.x = -Math.PI / 4;
  armRGroup.add(armR);
  group.add(armRGroup);

  // Bone Quiver on Back
  const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.7, 6), darkMat);
  quiver.position.set(0.15, 1.25, -0.22);
  quiver.rotation.z = -0.4;
  group.add(quiver);

  // Skeletal Legs
  const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.8, 4);
  const legL = new THREE.Mesh(legGeo, boneMat);
  legL.position.set(-0.18, 0.4, 0);
  group.add(legL);

  const legR = new THREE.Mesh(legGeo, boneMat);
  legR.position.set(0.18, 0.4, 0);
  group.add(legR);

  group.userData = { armLGroup, armRGroup, isRanged: true };
  group.scale.set(1.0, 1.0, 1.0);
  return group;
}

// 8. Aranha Venenosa (Poisonous Spider - Nv. 7)
export function createSpiderMonsterMesh(): THREE.Group {
  const group = new THREE.Group();
  const carapaceMat = createToonMaterial(0x18181b, 0x09090b); // Glossy shadow black
  const venomMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x16a34a,
    emissiveIntensity: 0.8,
  }); // Glowing toxic green
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  // Cephalothorax (Front body)
  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), carapaceMat);
  thorax.position.set(0, 0.5, 0.2);
  thorax.scale.set(1.1, 0.8, 1.2);
  thorax.castShadow = true;
  group.add(thorax);

  // Large Bulbous Abdomen
  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 10), carapaceMat);
  abdomen.position.set(0, 0.75, -0.85);
  abdomen.scale.set(1.0, 0.9, 1.3);
  abdomen.castShadow = true;
  group.add(abdomen);

  // Venomous glowing markings on abdomen
  for (let s = 0; s < 3; s++) {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.14 - s * 0.02, 6, 6), venomMat);
    spot.position.set(0, 1.35 - s * 0.15, -0.6 - s * 0.3);
    group.add(spot);
  }

  // Chelicerae / Venom Fangs
  const fangGeo = new THREE.ConeGeometry(0.08, 0.35, 4);
  const fangL = new THREE.Mesh(fangGeo, venomMat);
  fangL.position.set(-0.16, 0.3, 0.8);
  fangL.rotation.x = Math.PI * 0.6;
  group.add(fangL);

  const fangR = new THREE.Mesh(fangGeo, venomMat);
  fangR.position.set(0.16, 0.3, 0.8);
  fangR.rotation.x = Math.PI * 0.6;
  group.add(fangR);

  // 6 Glowing Spider Eyes
  for (let e = -1; e <= 1; e += 2) {
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eyeMat);
    eye1.position.set(e * 0.12, 0.65, 0.72);
    group.add(eye1);

    const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), eyeMat);
    eye2.position.set(e * 0.22, 0.6, 0.68);
    group.add(eye2);
  }

  // 8 Arched Spider Legs (4 on each side)
  const legs: THREE.Group[] = [];
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 4; i++) {
      const legGroup = new THREE.Group();
      legGroup.position.set(side * 0.4, 0.45, 0.4 - i * 0.35);

      // Upper joint
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.8, 4), carapaceMat);
      upper.position.set(side * 0.35, 0.3, 0);
      upper.rotation.z = side * -0.9;
      upper.rotation.y = (i - 1.5) * 0.2;
      legGroup.add(upper);

      // Lower joint down to ground
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.8, 4), carapaceMat);
      lower.position.set(side * 0.7, -0.15, 0);
      lower.rotation.z = side * 0.6;
      legGroup.add(lower);

      group.add(legGroup);
      legs.push(legGroup);
    }
  }

  group.userData = { legs };
  group.scale.set(1.2, 1.2, 1.2);
  return group;
}

// 9. Golem de Pedra (Stone Golem - Nv. 12)
export function createStoneGolemMesh(): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = createToonMaterial(0x475569, 0x1e293b, 0.7); // Dark Granite
  const runeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.9,
  }); // Glowing Amber Runes

  // Colossal Chiseled Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.2), stoneMat);
  torso.position.y = 1.9;
  torso.castShadow = true;
  group.add(torso);

  // Glowing Rune Core in Chest
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), runeMat);
  core.position.set(0, 2.0, 0.65);
  group.add(core);

  // Sunken Golem Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), stoneMat);
  head.position.set(0, 2.9, 0.1);
  group.add(head);

  // Glowing Eye Slit
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.15), runeMat);
  eye.position.set(0, 2.95, 0.45);
  group.add(eye);

  // Heavy Boulder Shoulders
  const pauldronGeo = new THREE.DodecahedronGeometry(0.55);
  const pL = new THREE.Mesh(pauldronGeo, stoneMat);
  pL.position.set(-1.25, 2.6, 0);
  group.add(pL);
  const pR = new THREE.Mesh(pauldronGeo, stoneMat);
  pR.position.set(1.25, 2.6, 0);
  group.add(pR);

  // Giant Stone Arms with Massive Fists
  const armGeo = new THREE.BoxGeometry(0.45, 1.2, 0.5);
  const fistGeo = new THREE.BoxGeometry(0.65, 0.65, 0.7);

  const armLGroup = new THREE.Group();
  armLGroup.position.set(-1.25, 1.6, 0.1);
  armLGroup.add(new THREE.Mesh(armGeo, stoneMat));
  const fistL = new THREE.Mesh(fistGeo, stoneMat);
  fistL.position.set(0, -0.7, 0.1);
  armLGroup.add(fistL);
  group.add(armLGroup);

  const armRGroup = new THREE.Group();
  armRGroup.position.set(1.25, 1.6, 0.1);
  armRGroup.add(new THREE.Mesh(armGeo, stoneMat));
  const fistR = new THREE.Mesh(fistGeo, stoneMat);
  fistR.position.set(0, -0.7, 0.1);
  armRGroup.add(fistR);
  group.add(armRGroup);

  // Pillar Stone Legs
  const legGeo = new THREE.BoxGeometry(0.55, 1.1, 0.65);
  const legL = new THREE.Mesh(legGeo, stoneMat);
  legL.position.set(-0.5, 0.55, 0);
  legL.castShadow = true;
  group.add(legL);

  const legR = new THREE.Mesh(legGeo, stoneMat);
  legR.position.set(0.5, 0.55, 0);
  legR.castShadow = true;
  group.add(legR);

  group.userData = { armLGroup, armRGroup, isHeavy: true };
  group.scale.set(1.35, 1.35, 1.35);
  return group;
}

// ==================== 3D GROUND LOOT DROP MESH ====================
export function createGroundLootMesh(rarity: ItemRarity): THREE.Group {
  const group = new THREE.Group();

  let color = 0x22c55e; // green for comum
  let emissive = 0x16a34a;
  if (rarity === 'incomum') {
    color = 0x38bdf8; // cyan
    emissive = 0x0284c7;
  } else if (rarity === 'raro') {
    color = 0xf59e0b; // amber / gold
    emissive = 0xd97706;
  } else if (rarity === 'lendario') {
    color = 0xa855f7; // purple
    emissive = 0x9333ea;
  }

  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.8,
  });

  // Floating rotating celestial gem / pouch
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), mat);
  gem.position.y = 0.65;
  group.add(gem);

  // Inner core
  const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  core.position.y = 0.65;
  group.add(core);

  // Pedestal glowing ring
  const ringGeo = new THREE.RingGeometry(0.35, 0.5, 16);
  const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;
  group.add(ring);

  // Vertical light pillar beam
  const beamGeo = new THREE.CylinderGeometry(0.15, 0.05, 3.5, 8, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = 1.75;
  group.add(beam);

  group.userData = { gem, beam, ring };
  return group;
}

// ==================== ZU ONLINE HIGH-LEVEL SWORDSMAN (KAISETE NV. 230) ====================
export function createFlyingSwordModel(color: number = 0xf59e0b, emissive: number = 0xd97706): THREE.Group {
  const group = new THREE.Group();

  // Sword Blade (Double edged Chinese Jian)
  const bladeGeo = new THREE.BoxGeometry(0.12, 0.03, 1.8);
  const bladeMat = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.8,
    metalness: 0.9,
    roughness: 0.2,
  });
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.position.z = 0.5;
  group.add(blade);

  // Tip
  const tipGeo = new THREE.ConeGeometry(0.1, 0.4, 4);
  tipGeo.rotateX(-Math.PI / 2);
  const tip = new THREE.Mesh(tipGeo, bladeMat);
  tip.position.z = 1.6;
  group.add(tip);

  // Guard (Golden Dragon Crossguard)
  const guardGeo = new THREE.BoxGeometry(0.35, 0.06, 0.08);
  const guardMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.3,
  });
  const guard = new THREE.Mesh(guardGeo, guardMat);
  guard.position.z = -0.4;
  group.add(guard);

  // Hilt
  const hiltGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.4, 6);
  hiltGeo.rotateX(Math.PI / 2);
  const hiltMat = new THREE.MeshStandardMaterial({ color: 0x881337 });
  const hilt = new THREE.Mesh(hiltGeo, hiltMat);
  hilt.position.z = -0.65;
  group.add(hilt);

  // Pommel with Red Tassel
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), guardMat);
  pommel.position.z = -0.88;
  group.add(pommel);

  // Energy Blade Aura
  const auraGeo = new THREE.BoxGeometry(0.16, 0.05, 2.0);
  const auraMat = new THREE.MeshBasicMaterial({
    color: emissive,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
  });
  const aura = new THREE.Mesh(auraGeo, auraMat);
  aura.position.z = 0.55;
  group.add(aura);

  return group;
}

export function createKaiseteSwordsmanMesh(): PlayerMeshGroup {
  const group = new THREE.Group() as PlayerMeshGroup;

  // Materials: Wu Sect Elite Royal Crimson, Gold & Ebony
  const robeMat = createToonMaterial(0x881337, 0x4c0519); // Deep Crimson Silk
  const goldArmorMat = createToonMaterial(0xf59e0b, 0xb45309); // Brilliant Daoist Gold
  const ebonyMat = createToonMaterial(0x0f172a); // Obsidian Underlayer
  const skinMat = createToonMaterial(0xfde047); // Light peach
  const hairMat = createToonMaterial(0x18181b); // Midnight Black
  const bladeGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
    metalness: 0.8,
    roughness: 0.2,
  });

  // Body / Torso (Swordsman Armored Robe)
  const bodyGeo = new THREE.CylinderGeometry(0.4, 0.52, 1.15, 8);
  const body = new THREE.Mesh(bodyGeo, robeMat);
  body.position.y = 1.15;
  body.castShadow = true;
  group.add(body);

  // Golden Dragon Breastplate / Chest Armor
  const chestPlateGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.6, 8, 1, false, 0, Math.PI);
  const chestPlate = new THREE.Mesh(chestPlateGeo, goldArmorMat);
  chestPlate.position.set(0, 1.35, 0.02);
  group.add(chestPlate);

  // Sash & Golden Buckle
  const beltGeo = new THREE.CylinderGeometry(0.42, 0.44, 0.2, 8);
  const belt = new THREE.Mesh(beltGeo, goldArmorMat);
  belt.position.y = 1.05;
  group.add(belt);

  // Flowing Lower Robes
  const skirtGeo = new THREE.ConeGeometry(0.68, 0.95, 8);
  const skirt = new THREE.Mesh(skirtGeo, ebonyMat);
  skirt.position.y = 0.52;
  skirt.castShadow = true;
  group.add(skirt);

  // Head
  const headGeo = new THREE.SphereGeometry(0.28, 12, 12);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.88;
  head.castShadow = true;
  group.add(head);

  // Swordsman Hair (High Topknot & Floating Ribbon)
  const hairGeo = new THREE.SphereGeometry(0.3, 12, 12);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 1.94, -0.04);
  group.add(hair);

  const bunGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.28, 8);
  const bun = new THREE.Mesh(bunGeo, hairMat);
  bun.position.set(0, 2.22, -0.04);
  group.add(bun);

  // Golden Phoenix Crown Pin
  const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6);
  pinGeo.rotateZ(Math.PI / 2);
  const pin = new THREE.Mesh(pinGeo, goldArmorMat);
  pin.position.set(0, 2.22, -0.04);
  group.add(pin);

  // Arms (Swordsman Sleeves & Bracers)
  const sleeveGeo = new THREE.CylinderGeometry(0.18, 0.26, 0.72, 8);
  const leftArm = new THREE.Mesh(sleeveGeo, robeMat);
  leftArm.position.set(-0.48, 1.32, 0);
  leftArm.rotation.z = 0.22;
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(sleeveGeo, robeMat);
  rightArm.position.set(0.48, 1.32, 0);
  rightArm.rotation.z = -0.22;
  rightArm.castShadow = true;
  group.add(rightArm);

  // Golden Dragon Pauldrons on Shoulders
  const pauldronGeo = new THREE.SphereGeometry(0.24, 8, 8);
  pauldronGeo.scale(1.2, 0.8, 1.0);
  const leftPauldron = new THREE.Mesh(pauldronGeo, goldArmorMat);
  leftPauldron.position.set(-0.55, 1.62, 0);
  group.add(leftPauldron);

  const rightPauldron = new THREE.Mesh(pauldronGeo, goldArmorMat);
  rightPauldron.position.set(0.55, 1.62, 0);
  group.add(rightPauldron);

  // Legs for running animation
  const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.62, 6);
  const leftLeg = new THREE.Mesh(legGeo, ebonyMat);
  leftLeg.position.set(-0.2, 0.32, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, ebonyMat);
  rightLeg.position.set(0.2, 0.32, 0);
  group.add(rightLeg);

  // Seven-Star Wielded Heavenly Sword in Right Hand
  const wieldedSword = createFlyingSwordModel(0xfbbf24, 0xf59e0b);
  wieldedSword.scale.set(0.85, 0.85, 0.85);
  wieldedSword.position.set(0.58, 0.88, 0.45);
  wieldedSword.rotation.set(-Math.PI / 4, 0, -Math.PI / 8);
  group.add(wieldedSword);

  // 4 Orbiting Flying Swords (The hallmark of Zu Online Lv. 200+ Swordsmen!)
  const flyingSwordsGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const sword = createFlyingSwordModel(0xf59e0b, 0xd97706);
    sword.scale.set(0.7, 0.7, 0.7);
    const angle = (i / 4) * Math.PI * 2;
    sword.position.set(Math.cos(angle) * 1.25, 1.5, Math.sin(angle) * 1.25);
    sword.rotation.x = Math.PI / 2;
    sword.rotation.z = angle + Math.PI / 2;
    flyingSwordsGroup.add(sword);
  }
  group.add(flyingSwordsGroup);

  // Golden Sun Flame Halo (Wu Sect Grandmaster Aura)
  const haloGroup = new THREE.Group();
  const ringGeo = new THREE.TorusGeometry(0.75, 0.035, 8, 24);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.85,
  });
  const haloRing = new THREE.Mesh(ringGeo, ringMat);
  haloGroup.add(haloRing);

  // 8 Fire Chi Blades on the ring
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const spikeGeo = new THREE.ConeGeometry(0.06, 0.28, 4);
    spikeGeo.rotateZ(angle - Math.PI / 2);
    const spike = new THREE.Mesh(spikeGeo, bladeGlowMat);
    spike.position.set(Math.cos(angle) * 0.78, Math.sin(angle) * 0.78, 0);
    haloGroup.add(spike);
  }
  haloGroup.position.set(0, 1.5, -0.42);
  group.add(haloGroup);

  // Large Celestial Flying Sword Mount (under feet for flying stance)
  const swordMount = createFlyingSwordModel(0xfbbf24, 0xf59e0b);
  swordMount.scale.set(1.4, 1.0, 1.4);
  swordMount.position.set(0, -0.05, 0);
  swordMount.rotation.x = Math.PI / 2;
  swordMount.visible = false;
  group.add(swordMount);

  group.userData = {
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    body,
    halo: haloGroup,
    flyingSwordsGroup,
    swordMount,
  };

  return group;
}
