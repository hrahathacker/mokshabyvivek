import * as THREE from 'three';
import { ProceduralTexturePack } from './textures';
import { RitualItemId } from './types';

export interface GhostRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  hairGroup: THREE.Group;
  sareeMaterial: THREE.MeshStandardMaterial;
  skinMaterial: THREE.MeshStandardMaterial;
  hairMaterial: THREE.MeshStandardMaterial;
  faceMaterial: THREE.MeshStandardMaterial;
  shantiHalo: THREE.Mesh;
  shantiParticles: THREE.Points;
  shantiVelocities: Float32Array;
  setDissolve: (t: number) => void;
}

export interface HavanKundRig {
  root: THREE.Group;
  fireGroup: THREE.Group;
  fireLight: THREE.PointLight;
  shantiBeam: THREE.Mesh;
  cornerFlames: THREE.Mesh[];
  itemSlots: Record<RitualItemId, THREE.Group>;
  auraRing: THREE.Mesh;
  update: (time: number, climaxActive: boolean, shantiProgress: number, hintActive: boolean) => void;
}

export interface AlmirahRig {
  id: string;
  room: string;
  root: THREE.Group;
  leftDoorPivot: THREE.Group;
  rightDoorPivot: THREE.Group;
  insidePos: THREE.Vector3;
  exitPos: THREE.Vector3;
  facingYaw: number;
  doorOpenAmount: number;
}

export interface FlashlightRig {
  viewGroup: THREE.Group;
  spotLight: THREE.SpotLight;
  beamMesh: THREE.Mesh;
  lensMat: THREE.MeshStandardMaterial;
}

function addContactShadow(parent: THREE.Object3D, shadowTex: THREE.CanvasTexture, radius: number, y = 0.012): void {
  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = y;
  parent.add(mesh);
}

/**
 * Terrifying 3D Indian female ghost matching the reference images:
 * tattered dark maroon saree with tarnished gold zari border, long messy black hair,
 * pale gaunt face with hollow dark eyes, barefoot with silver payal anklets.
 */
export function createGhostModel(textures: ProceduralTexturePack): GhostRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const sareeMaterial = new THREE.MeshStandardMaterial({
    map: textures.sareeColor,
    bumpMap: textures.sareeBump,
    bumpScale: 0.035,
    roughness: 0.88,
    metalness: 0.08,
    transparent: true,
    opacity: 1,
  });

  const zariGoldMat = new THREE.MeshStandardMaterial({
    color: 0x9b7a38,
    roughness: 0.42,
    metalness: 0.72,
    transparent: true,
    opacity: 1,
  });

  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0x8d9596,
    roughness: 0.72,
    metalness: 0.04,
    transparent: true,
    opacity: 1,
  });

  const faceMaterial = new THREE.MeshStandardMaterial({
    map: textures.ghostFaceColor,
    roughness: 0.65,
    metalness: 0.05,
    emissive: 0x10181a,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 1,
  });

  const hairMaterial = new THREE.MeshStandardMaterial({
    color: 0x090a0c,
    roughness: 0.94,
    metalness: 0.05,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
  });

  const silverPayalMat = new THREE.MeshStandardMaterial({
    color: 0xd0d8dd,
    roughness: 0.22,
    metalness: 0.92,
  });

  // 1. Draped maroon saree lower skirt (LatheGeometry with subtle flaring hem)
  const skirtPoints = [
    new THREE.Vector2(0.31, 0.14),
    new THREE.Vector2(0.28, 0.42),
    new THREE.Vector2(0.23, 0.76),
    new THREE.Vector2(0.18, 1.02),
    new THREE.Vector2(0.21, 1.24),
    new THREE.Vector2(0.16, 1.38),
  ];
  const skirtGeo = new THREE.LatheGeometry(skirtPoints, 20);
  // Add gentle vertical pleat ripples around circumference
  const sPos = skirtGeo.attributes.position;
  for (let i = 0; i < sPos.count; i++) {
    const x = sPos.getX(i);
    const y = sPos.getY(i);
    const z = sPos.getZ(i);
    const angle = Math.atan2(z, x);
    const pleat = 1 + Math.sin(angle * 9) * 0.06 * (1 - y / 1.45);
    sPos.setXYZ(i, x * pleat, y, z * pleat);
  }
  skirtGeo.computeVertexNormals();
  const skirtMesh = new THREE.Mesh(skirtGeo, sareeMaterial);
  skirtMesh.castShadow = true;
  bodyGroup.add(skirtMesh);

  // Diagonal draped saree pallu across chest & left shoulder
  const palluGeo = new THREE.CylinderGeometry(0.19, 0.24, 0.56, 12, 1, true, -0.7, 2.3);
  const palluMesh = new THREE.Mesh(palluGeo, sareeMaterial);
  palluMesh.position.set(-0.02, 1.17, 0.02);
  palluMesh.rotation.z = 0.22;
  bodyGroup.add(palluMesh);

  // Gold zari border sash strip along shoulder drape
  const sashGeo = new THREE.BoxGeometry(0.055, 0.58, 0.28);
  const sashMesh = new THREE.Mesh(sashGeo, zariGoldMat);
  sashMesh.position.set(-0.14, 1.18, 0.02);
  sashMesh.rotation.z = -0.34;
  bodyGroup.add(sashMesh);

  // Tattered trailing pallu cloth hanging down left back/side
  const trailGeo = new THREE.PlaneGeometry(0.24, 0.72, 4, 8);
  const tPos = trailGeo.attributes.position;
  for (let i = 0; i < tPos.count; i++) {
    const ty = tPos.getY(i);
    tPos.setZ(i, Math.sin(ty * 6) * 0.04);
  }
  trailGeo.computeVertexNormals();
  const trailMesh = new THREE.Mesh(trailGeo, sareeMaterial);
  trailMesh.position.set(-0.21, 0.88, -0.08);
  trailMesh.rotation.y = -0.5;
  bodyGroup.add(trailMesh);

  // 2. Bare pale ankles, feet & silver payal anklets (matching Reference 3)
  [-0.085, 0.085].forEach((fx) => {
    const ankle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.03, 0.16, 10), skinMaterial);
    ankle.position.set(fx, 0.09, 0.01);
    bodyGroup.add(ankle);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.036, 0.16), skinMaterial);
    foot.position.set(fx, 0.02, 0.045);
    bodyGroup.add(foot);

    // Metallic silver payal ring + tiny ghungroo beads
    const payal = new THREE.Mesh(new THREE.TorusGeometry(0.039, 0.008, 8, 16), silverPayalMat);
    payal.rotation.x = Math.PI / 2;
    payal.position.set(fx, 0.055, 0.01);
    bodyGroup.add(payal);

    for (let b = 0; b < 5; b++) {
      const a = (b / 5) * Math.PI * 2;
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 6), silverPayalMat);
      bead.position.set(fx + Math.cos(a) * 0.042, 0.046, 0.01 + Math.sin(a) * 0.042);
      bodyGroup.add(bead);
    }
  });

  // 3. Pale gaunt arms
  const buildArm = (side: -1 | 1): THREE.Group => {
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.21, 1.35, 0);

    // Maroon short blouse sleeve
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.048, 0.15, 10), sareeMaterial);
    sleeve.position.y = -0.06;
    armGroup.add(sleeve);

    // Gaunt upper & lower arm
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.28, 8), skinMaterial);
    upper.position.y = -0.22;
    armGroup.add(upper);

    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.024, 0.27, 8), skinMaterial);
    fore.position.set(0, -0.45, 0.04);
    fore.rotation.x = -0.22;
    armGroup.add(fore);

    // Pale bony hand
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.11, 0.028), skinMaterial);
    hand.position.set(0, -0.61, 0.08);
    armGroup.add(hand);

    return armGroup;
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);
  bodyGroup.add(leftArm, rightArm);

  // 4. Neck, sculpted pale face & dense cascading messy black hair
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.058, 0.12, 10), skinMaterial);
  neck.position.set(0, 1.43, 0.01);
  bodyGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.54, 0.02);
  bodyGroup.add(headGroup);

  // Head oval with gaunt face mapped to front (+Z)
  const headGeo = new THREE.SphereGeometry(0.125, 18, 16);
  headGeo.scale(0.86, 1.08, 0.94);
  const headMesh = new THREE.Mesh(headGeo, skinMaterial);
  headGroup.add(headMesh);

  // Front face mask curved cleanly onto front of head
  const faceGeo = new THREE.SphereGeometry(0.127, 16, 14, -Math.PI * 0.34, Math.PI * 0.68, Math.PI * 0.2, Math.PI * 0.65);
  faceGeo.scale(0.86, 1.08, 0.94);
  faceGeo.rotateY(Math.PI / 2); // Align face normal to +Z
  const faceMesh = new THREE.Mesh(faceGeo, faceMaterial);
  headGroup.add(faceMesh);

  // Long tangled cascading black hair framing face and back
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  // Crown mass
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.142, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.64), hairMaterial);
  crown.scale.set(0.95, 1.08, 1.06);
  crown.position.set(0, 0.02, -0.015);
  hairGroup.add(crown);

  // 14 messy hanging locks enveloping sides, back, and partially shadowing forehead
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const angle = -Math.PI * 0.85 + t * Math.PI * 1.7;
    const isFrontSide = Math.abs(angle) > Math.PI * 0.56;
    const lockLen = isFrontSide ? 0.52 + (i % 3) * 0.09 : 0.68 + (i % 3) * 0.08;
    const lockW = isFrontSide ? 0.075 : 0.11;
    const geo = new THREE.PlaneGeometry(lockW, lockLen, 2, 5);
    const gp = geo.attributes.position;
    for (let v = 0; v < gp.count; v++) {
      const vy = gp.getY(v);
      gp.setZ(v, Math.sin(vy * 8 + i) * 0.025);
    }
    geo.computeVertexNormals();
    const lock = new THREE.Mesh(geo, hairMaterial);
    const rad = 0.125;
    lock.position.set(
      Math.sin(angle) * rad,
      0.06 - lockLen * 0.45,
      -Math.cos(angle) * rad
    );
    lock.rotation.y = angle + Math.PI;
    lock.rotation.z = (Math.sin(i * 2.1) * 0.12);
    hairGroup.add(lock);
  }

  // Subtle dark contact shadow beneath feet
  addContactShadow(root, textures.contactShadow, 0.42, 0.01);

  // 5. Sacred Golden Divine Halo behind head (illuminates during Moksha finale)
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xffe49e,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const shantiHalo = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.44, 32), haloMat);
  shantiHalo.position.set(0, 1.56, -0.14);
  shantiHalo.visible = false;
  root.add(shantiHalo);

  // 6. Radiant 480-particle Golden-White Shanti Ascension System
  const particleCount = 480;
  const pPositions = new Float32Array(particleCount * 3);
  const pVelocities = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const ang = Math.random() * Math.PI * 2;
    const rad = 0.06 + Math.random() * 0.42;
    pPositions[i * 3] = Math.cos(ang) * rad;
    pPositions[i * 3 + 1] = Math.random() * 1.72;
    pPositions[i * 3 + 2] = Math.sin(ang) * rad;

    pVelocities[i * 3] = (Math.random() - 0.5) * 0.65;
    pVelocities[i * 3 + 1] = 0.75 + Math.random() * 1.65;
    pVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.65;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xffe8a8,
    size: 0.095,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const shantiParticles = new THREE.Points(pGeo, pMat);
  shantiParticles.visible = false;
  root.add(shantiParticles);

  const warmGold = new THREE.Color(0xffcf6e);
  const horrorFaceEmissive = new THREE.Color(0x10181a);
  const blackEmissive = new THREE.Color(0x000000);

  const setDissolve = (t: number) => {
    const clamped = Math.max(0, Math.min(1, t));

    if (clamped <= 0.005) {
      // Restore full horror appearance
      sareeMaterial.opacity = 1;
      sareeMaterial.emissive.copy(blackEmissive);
      sareeMaterial.emissiveIntensity = 0;
      zariGoldMat.opacity = 1;
      skinMaterial.opacity = 1;
      skinMaterial.emissive.copy(blackEmissive);
      skinMaterial.emissiveIntensity = 0;
      faceMaterial.opacity = 1;
      faceMaterial.emissive.copy(horrorFaceEmissive);
      faceMaterial.emissiveIntensity = 0.35;
      hairMaterial.opacity = 1;
      bodyGroup.visible = true;
      shantiHalo.visible = false;
      haloMat.opacity = 0;
      shantiParticles.visible = false;
      pMat.opacity = 0;
      return;
    }

    // Phase A (0 -> 0.45): Transform from horror figure into radiant golden-white celestial light!
    const glowPhase = Math.min(1, clamped / 0.42);
    sareeMaterial.emissive.copy(warmGold);
    sareeMaterial.emissiveIntensity = glowPhase * 1.65;
    skinMaterial.emissive.copy(warmGold);
    skinMaterial.emissiveIntensity = glowPhase * 1.85;
    faceMaterial.emissive.copy(warmGold);
    faceMaterial.emissiveIntensity = 0.35 + glowPhase * 1.75;

    // Sacred Halo blooms behind her head then fades with ascension
    shantiHalo.visible = true;
    const haloScale = 0.75 + glowPhase * 0.85 + Math.max(0, clamped - 0.5) * 1.2;
    shantiHalo.scale.setScalar(haloScale);
    haloMat.opacity = Math.sin(Math.min(1, clamped) * Math.PI) * 0.82;

    // Phase B (0.42 -> 0.88): Body gracefully dissolves into 480 ascending golden sparks
    const fadeStart = 0.42;
    const bodyAlpha =
      clamped < fadeStart ? 1 : Math.max(0, 1 - (clamped - fadeStart) / 0.42);
    sareeMaterial.opacity = bodyAlpha;
    zariGoldMat.opacity = bodyAlpha;
    skinMaterial.opacity = bodyAlpha;
    faceMaterial.opacity = bodyAlpha;
    hairMaterial.opacity = bodyAlpha;
    bodyGroup.visible = bodyAlpha > 0.02;

    shantiParticles.visible = true;
    pMat.opacity = clamped < 0.25 ? (clamped / 0.25) * 0.92 : Math.sin(Math.min(1, clamped) * Math.PI) * 1.0;
  };

  return {
    root,
    bodyGroup,
    headGroup,
    leftArm,
    rightArm,
    hairGroup,
    sareeMaterial,
    skinMaterial,
    hairMaterial,
    faceMaterial,
    shantiHalo,
    shantiParticles,
    shantiVelocities: pVelocities,
    setDissolve,
  };
}

/**
 * 4 distinct composite sacred ritual item models matching Reference Image 2.
 */
export function createRitualItemModel(
  id: RitualItemId,
  textures: ProceduralTexturePack
): { group: THREE.Group; auraRing: THREE.Mesh; flameMesh?: THREE.Mesh } {
  const group = new THREE.Group();

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb99142,
    roughness: 0.28,
    metalness: 0.86,
  });

  let flameMesh: THREE.Mesh | undefined;

  if (id === 'kalash') {
    // Lathe-turned antique hammered brass pot
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.09, 0.0),
      new THREE.Vector2(0.145, 0.08),
      new THREE.Vector2(0.155, 0.16),
      new THREE.Vector2(0.085, 0.24),
      new THREE.Vector2(0.115, 0.28),
      new THREE.Vector2(0.1, 0.29),
    ];
    const pot = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), brassMat);
    pot.castShadow = true;
    group.add(pot);

    // 5 curved mango leaves tucked into neck
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x2a4a24,
      roughness: 0.62,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.16, 4), leafMat);
      leaf.scale.set(1, 1, 0.25);
      leaf.position.set(Math.cos(a) * 0.08, 0.31, Math.sin(a) * 0.08);
      leaf.rotation.y = -a + Math.PI / 2;
      leaf.rotation.x = 0.68;
      group.add(leaf);
    }

    // Fibrous brown coconut seated on top
    const cocoMat = new THREE.MeshStandardMaterial({
      color: 0x563924,
      roughness: 0.94,
      metalness: 0.02,
    });
    const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.072, 14, 12), cocoMat);
    coconut.scale.set(0.88, 1.18, 0.88);
    coconut.position.y = 0.33;
    group.add(coconut);
  } else if (id === 'chunri') {
    // Draped crimson sacred cloth folds with tarnished gold zari border
    const clothMat = new THREE.MeshStandardMaterial({
      color: 0x8f1a22,
      bumpMap: textures.sareeBump,
      bumpScale: 0.02,
      roughness: 0.82,
      metalness: 0.06,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4a446,
      roughness: 0.34,
      metalness: 0.78,
    });

    const baseFold = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.24), clothMat);
    baseFold.position.y = 0.03;
    baseFold.rotation.y = 0.2;
    group.add(baseFold);

    const midFold = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.05, 0.2), clothMat);
    midFold.position.set(0.02, 0.07, -0.01);
    midFold.rotation.set(0.06, -0.18, 0.08);
    group.add(midFold);

    const topFold = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.045, 0.16), clothMat);
    topFold.position.set(-0.02, 0.105, 0.01);
    topFold.rotation.set(-0.08, 0.35, -0.05);
    group.add(topFold);

    // Gold zari border accent ribbons
    const trim1 = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.016, 0.035), goldMat);
    trim1.position.set(0, 0.056, 0.11);
    trim1.rotation.y = 0.2;
    group.add(trim1);

    const trim2 = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.014, 0.028), goldMat);
    trim2.position.set(-0.02, 0.128, 0.07);
    trim2.rotation.y = 0.35;
    group.add(trim2);
  } else if (id === 'diya') {
    // Pedestal brass oil lamp matching Reference 2
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.075, 0.0),
      new THREE.Vector2(0.03, 0.035),
      new THREE.Vector2(0.022, 0.09),
      new THREE.Vector2(0.095, 0.135),
      new THREE.Vector2(0.11, 0.155),
      new THREE.Vector2(0.085, 0.145),
    ];
    const lamp = new THREE.Mesh(new THREE.LatheGeometry(pts, 18), brassMat);
    lamp.castShadow = true;
    group.add(lamp);

    // Glowing teardrop flame
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffc65c });
    flameMesh = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.1, 8), flameMat);
    flameMesh.position.set(0, 0.2, 0);
    group.add(flameMesh);

    // Soft warm local point light for the glowing diya
    const light = new THREE.PointLight(0xff9a38, 1.35, 3.6, 2);
    light.position.set(0, 0.24, 0);
    group.add(light);
  } else {
    // Havan Samagri stone bowl heaped with dark herbs & marigold petals
    const bowlMat = new THREE.MeshStandardMaterial({
      color: 0x3b3530,
      roughness: 0.9,
      metalness: 0.08,
    });
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.09, 0.0),
      new THREE.Vector2(0.145, 0.07),
      new THREE.Vector2(0.17, 0.13),
      new THREE.Vector2(0.15, 0.13),
      new THREE.Vector2(0.11, 0.05),
      new THREE.Vector2(0.0, 0.04),
    ];
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 18), bowlMat);
    bowl.castShadow = true;
    group.add(bowl);

    // Heaped herbal samagri mound
    const herbMat = new THREE.MeshStandardMaterial({
      color: 0x4b3522,
      roughness: 0.96,
      metalness: 0.02,
    });
    const mound = new THREE.Mesh(new THREE.SphereGeometry(0.125, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), herbMat);
    mound.scale.set(1, 0.58, 1);
    mound.position.y = 0.08;
    group.add(mound);

    // Marigold petal flecks & camphor chunks on top
    const marigoldMat = new THREE.MeshStandardMaterial({ color: 0xe67a1e, roughness: 0.78 });
    const camphorMat = new THREE.MeshStandardMaterial({ color: 0xe6e0d0, roughness: 0.45 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const speck = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.018, 0),
        i % 2 === 0 ? marigoldMat : camphorMat
      );
      speck.position.set(Math.cos(a) * 0.06, 0.135, Math.sin(a) * 0.06);
      group.add(speck);
    }
  }

  // Subtle golden hint aura ring (only visible when 60s hint triggers or gentle proximity shimmer)
  const auraGeo = new THREE.RingGeometry(0.22, 0.3, 24);
  auraGeo.rotateX(-Math.PI / 2);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0xffb84d,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const auraRing = new THREE.Mesh(auraGeo, auraMat);
  auraRing.position.y = 0.015;
  group.add(auraRing);

  addContactShadow(group, textures.contactShadow, 0.24, 0.008);

  return { group, auraRing, flameMesh };
}

/**
 * Ancient stepped stone Havan Kund in the center of the Aangan (matching Reference 1).
 */
export function createHavanKund(textures: ProceduralTexturePack): HavanKundRig {
  const root = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stoneColor,
    bumpMap: textures.stoneBump,
    bumpScale: 0.04,
    roughness: 0.88,
    metalness: 0.06,
    color: 0x776f65,
  });

  // 3 stepped sandstone tiers
  const tier1 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.22, 2.5), stoneMat);
  tier1.position.y = 0.11;
  tier1.receiveShadow = true;
  tier1.castShadow = true;
  root.add(tier1);

  const tier2 = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.22, 1.95), stoneMat);
  tier2.position.y = 0.33;
  tier2.receiveShadow = true;
  tier2.castShadow = true;
  root.add(tier2);

  // Outer stone rim framing recessed ash pit
  const rimParts: Array<[number, number, number, number, number, number]> = [
    [1.46, 0.2, 0.24, 0, 0.54, 0.61],
    [1.46, 0.2, 0.24, 0, 0.54, -0.61],
    [0.24, 0.2, 0.98, 0.61, 0.54, 0],
    [0.24, 0.2, 0.98, -0.61, 0.54, 0],
  ];
  rimParts.forEach(([w, h, d, x, y, z]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stoneMat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
  });

  // Ash bed & crossed dried ritual firewood inside pit
  const ashMat = new THREE.MeshStandardMaterial({ color: 0x1e1d1c, roughness: 0.98 });
  const ashBed = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.08, 0.98), ashMat);
  ashBed.position.y = 0.45;
  root.add(ashBed);

  const logMat = new THREE.MeshStandardMaterial({
    map: textures.woodColor,
    roughness: 0.92,
    color: 0x453022,
  });
  for (let i = 0; i < 6; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.72, 7), logMat);
    const a = (i / 6) * Math.PI * 2;
    log.position.set(Math.cos(a) * 0.14, 0.53 + (i % 2) * 0.05, Math.sin(a) * 0.14);
    log.rotation.z = Math.PI / 2 - 0.28;
    log.rotation.y = a;
    root.add(log);
  }

  // 4 corner earthen diyas flickering warmly (matching Reference 1)
  const cornerFlames: THREE.Mesh[] = [];
  const clayMat = new THREE.MeshStandardMaterial({ color: 0x7c452b, roughness: 0.85 });
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffa838 });
  const corners = [
    [-0.74, -0.74],
    [0.74, -0.74],
    [-0.74, 0.74],
    [0.74, 0.74],
  ];
  corners.forEach(([cx, cz]) => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.045, 0.045, 10), clayMat);
    cup.position.set(cx, 0.46, cz);
    root.add(cup);

    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.11, 7), flameMat);
    fl.position.set(cx, 0.53, cz);
    root.add(fl);
    cornerFlames.push(fl);
  });

  // 4 item placement slots around the Havan Kund edge
  const slotPositions: Record<RitualItemId, [number, number, number]> = {
    kalash: [-0.92, 0.22, 0],
    chunri: [0.92, 0.22, 0],
    diya: [0, 0.22, 0.92],
    samagri: [0, 0.22, -0.92],
  };
  const itemSlots = {} as Record<RitualItemId, THREE.Group>;
  (Object.keys(slotPositions) as RitualItemId[]).forEach((id) => {
    const slot = new THREE.Group();
    const [sx, sy, sz] = slotPositions[id];
    slot.position.set(sx, sy, sz);
    const model = createRitualItemModel(id, textures).group;
    model.scale.setScalar(0.88);
    slot.add(model);
    slot.visible = false;
    root.add(slot);
    itemSlots[id] = slot;
  });

  // Scattered marigold petals around the Kund (InstancedMesh!)
  const petalCount = 110;
  const petalGeo = new THREE.DodecahedronGeometry(0.048, 0);
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xe66f14,
    roughness: 0.78,
    metalness: 0.02,
  });
  const petals = new THREE.InstancedMesh(petalGeo, petalMat, petalCount);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  for (let i = 0; i < petalCount; i++) {
    const a = (i * 2.39996) % (Math.PI * 2);
    const r = 1.35 + ((i * 37) % 100) / 100 * 1.45;
    dummy.position.set(Math.cos(a) * r, 0.028, Math.sin(a) * r);
    dummy.rotation.set(i * 0.4, i * 1.1, i * 0.3);
    const sc = 0.65 + ((i * 19) % 10) * 0.07;
    dummy.scale.set(sc, sc * 0.52, sc);
    dummy.updateMatrix();
    petals.setMatrixAt(i, dummy.matrix);
    tint.setHSL(0.07 + ((i % 5) * 0.012), 0.9, 0.46 + (i % 3) * 0.06);
    petals.setColorAt(i, tint);
  }
  petals.instanceMatrix.needsUpdate = true;
  if (petals.instanceColor) petals.instanceColor.needsUpdate = true;
  petals.computeBoundingSphere();
  root.add(petals);

  // Broken clay pots near base (matching Reference 1)
  const potPositions: Array<[number, number, number]> = [
    [-1.48, 0.14, 0.85],
    [1.45, 0.13, -0.78],
    [1.22, 0.13, 1.32],
  ];
  potPositions.forEach(([px, py, pz], i) => {
    const matka = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), clayMat);
    matka.position.set(px, py, pz);
    matka.rotation.z = 0.8 + i * 0.5;
    matka.scale.set(1, 0.85, 1);
    root.add(matka);
  });

  // Roaring Final Ritual Fire Group
  const fireGroup = new THREE.Group();
  fireGroup.position.set(0, 0.55, 0);
  fireGroup.visible = false;
  root.add(fireGroup);

  const outerFireMat = new THREE.MeshBasicMaterial({
    color: 0xff6b1a,
    transparent: true,
    opacity: 0.85,
  });
  const innerFireMat = new THREE.MeshBasicMaterial({
    color: 0xffe48c,
    transparent: true,
    opacity: 0.94,
  });
  for (let i = 0; i < 5; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.28 - i * 0.03, 0.95 + (i % 2) * 0.25, 7),
      i < 3 ? outerFireMat : innerFireMat
    );
    const a = (i / 5) * Math.PI * 2;
    cone.position.set(Math.cos(a) * 0.12, 0.42, Math.sin(a) * 0.12);
    fireGroup.add(cone);
  }

  // Warm central fire point light (starts as soft diya glow, intensifies massively in climax/ending)
  const fireLight = new THREE.PointLight(0xff9234, 2.2, 11, 1.7);
  fireLight.position.set(0, 1.05, 0);
  root.add(fireLight);

  // Dual-Layer Towering Heavenly Moksha Pillar of Light (Core + Volumetric Outer Beam)
  const beamGeo = new THREE.CylinderGeometry(0.65, 1.35, 16.0, 24, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfff1c2,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const shantiBeam = new THREE.Mesh(beamGeo, beamMat);
  shantiBeam.position.y = 8.1;
  shantiBeam.visible = false;
  root.add(shantiBeam);

  const outerBeamGeo = new THREE.CylinderGeometry(1.45, 2.75, 16.5, 24, 1, true);
  const outerBeamMat = new THREE.MeshBasicMaterial({
    color: 0xffb84d,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const shantiOuterBeam = new THREE.Mesh(outerBeamGeo, outerBeamMat);
  shantiOuterBeam.position.y = 8.2;
  shantiOuterBeam.visible = false;
  root.add(shantiOuterBeam);

  // 3 Expanding Golden Courtyard Shockwave Rings (movie-style purifying waves!)
  const shockwaveRings: Array<{ mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; phaseOffset: number }> =
    [0, 0.33, 0.66].map((phaseOffset) => {
      const rGeo = new THREE.RingGeometry(0.85, 1.15, 40);
      rGeo.rotateX(-Math.PI / 2);
      const rMat = new THREE.MeshBasicMaterial({
        color: 0xffd275,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(rGeo, rMat);
      mesh.position.y = 0.12;
      mesh.visible = false;
      root.add(mesh);
      return { mesh, mat: rMat, phaseOffset };
    });

  // 180 Swirling Golden Marigold & Ember Vortex Particles rising around the Havan Kund
  const vortexCount = 180;
  const vortexAngles = new Float32Array(vortexCount);
  const vortexRadii = new Float32Array(vortexCount);
  const vortexHeights = new Float32Array(vortexCount);
  const vortexPositions = new Float32Array(vortexCount * 3);
  for (let i = 0; i < vortexCount; i++) {
    vortexAngles[i] = (i / vortexCount) * Math.PI * 10;
    vortexRadii[i] = 1.05 + (i % 15) * 0.16;
    vortexHeights[i] = (i / vortexCount) * 7.5;
    vortexPositions[i * 3] = Math.cos(vortexAngles[i]) * vortexRadii[i];
    vortexPositions[i * 3 + 1] = vortexHeights[i];
    vortexPositions[i * 3 + 2] = Math.sin(vortexAngles[i]) * vortexRadii[i];
  }
  const vortexGeo = new THREE.BufferGeometry();
  vortexGeo.setAttribute('position', new THREE.BufferAttribute(vortexPositions, 3));
  const vortexMat = new THREE.PointsMaterial({
    color: 0xffc65c,
    size: 0.11,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const vortexPoints = new THREE.Points(vortexGeo, vortexMat);
  vortexPoints.visible = false;
  root.add(vortexPoints);

  // Subtle guidance ring when player holds an item or hint triggers
  const auraGeo = new THREE.RingGeometry(1.55, 1.74, 32);
  auraGeo.rotateX(-Math.PI / 2);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0xffbd4a,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const auraRing = new THREE.Mesh(auraGeo, auraMat);
  auraRing.position.y = 0.03;
  root.add(auraRing);

  const update = (time: number, climaxActive: boolean, shantiProgress: number, hintActive: boolean) => {
    const flick = 0.88 + Math.sin(time * 13.7) * 0.08 + Math.sin(time * 27.3) * 0.05;
    cornerFlames.forEach((f, idx) => {
      const s = 0.85 + Math.sin(time * 15 + idx * 1.9) * 0.16;
      f.scale.set(1, s, 1);
    });

    if (shantiProgress > 0.005) {
      fireGroup.visible = true;
      shantiBeam.visible = true;
      shantiOuterBeam.visible = true;
      vortexPoints.visible = true;

      const beamCurve = Math.sin(Math.min(1, shantiProgress) * Math.PI);
      const beamPulse = 0.92 + Math.sin(time * 6.5) * 0.08;
      beamMat.opacity = Math.min(0.55, (0.2 + beamCurve * 0.45) * beamPulse);
      outerBeamMat.opacity = Math.min(0.28, (0.1 + beamCurve * 0.22) * beamPulse);
      shantiBeam.scale.set(0.85 + shantiProgress * 0.55, 1, 0.85 + shantiProgress * 0.55);
      shantiOuterBeam.scale.set(0.8 + shantiProgress * 0.7, 1, 0.8 + shantiProgress * 0.7);
      shantiOuterBeam.rotation.y = time * 0.35;

      // Animate 3 expanding courtyard lotus shockwaves
      shockwaveRings.forEach((ring) => {
        ring.mesh.visible = true;
        const cycle = (shantiProgress * 2.4 + ring.phaseOffset) % 1;
        const sc = 1.0 + cycle * 9.5;
        ring.mesh.scale.setScalar(sc);
        ring.mat.opacity = Math.sin(cycle * Math.PI) * 0.48 * (1 - shantiProgress * 0.35);
      });

      // Animate swirling upward golden ember vortex
      const posAttr = vortexGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < vortexCount; i++) {
        const y = (vortexHeights[i] + time * 1.65) % 8.2;
        const ang = vortexAngles[i] + time * 1.45 + y * 0.45;
        const r = vortexRadii[i] * (0.75 + y * 0.12);
        posAttr.setXYZ(i, Math.cos(ang) * r, 0.35 + y, Math.sin(ang) * r);
      }
      posAttr.needsUpdate = true;
      vortexMat.opacity = Math.min(0.95, 0.25 + beamCurve * 0.75);

      fireLight.color.setHex(0xffdf8e);
      fireLight.intensity = 9.0 + beamCurve * 16;
      fireLight.distance = 32;
      fireGroup.scale.setScalar(1.35 + Math.sin(time * 9) * 0.12 + shantiProgress * 0.45);
    } else if (climaxActive) {
      fireGroup.visible = true;
      shantiBeam.visible = false;
      shantiOuterBeam.visible = false;
      vortexPoints.visible = false;
      shockwaveRings.forEach((r) => (r.mesh.visible = false));
      fireGroup.children.forEach((child, idx) => {
        const s = 0.85 + Math.sin(time * 18 + idx * 2.1) * 0.25;
        child.scale.set(1, s, 1);
      });
      fireLight.color.setHex(0xff8424);
      fireLight.intensity = (6.8 + Math.sin(time * 19) * 1.6) * flick;
      fireLight.distance = 22;
    } else {
      fireGroup.visible = false;
      shantiBeam.visible = false;
      shantiOuterBeam.visible = false;
      vortexPoints.visible = false;
      shockwaveRings.forEach((r) => (r.mesh.visible = false));
      fireLight.color.setHex(0xff8f32);
      fireLight.intensity = 2.4 * flick;
      fireLight.distance = 12;
    }

    auraMat.opacity = hintActive ? 0.22 + Math.sin(time * 3.5) * 0.14 : 0;
  };

  return {
    root,
    fireGroup,
    fireLight,
    shantiBeam,
    cornerFlames,
    itemSlots,
    auraRing,
    update,
  };
}

/**
 * Climb-in 1980s North Indian carved wooden almirah (wardrobe) for hiding.
 */
export function createAlmirah(
  id: string,
  room: string,
  pos: THREE.Vector3,
  facingYaw: number,
  textures: ProceduralTexturePack
): AlmirahRig {
  const root = new THREE.Group();
  root.position.copy(pos);
  root.rotation.y = facingYaw;

  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodColor,
    bumpMap: textures.woodBump,
    bumpScale: 0.03,
    roughness: 0.78,
    metalness: 0.06,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x24160e,
    roughness: 0.65,
    metalness: 0.12,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xaa853c,
    roughness: 0.3,
    metalness: 0.85,
  });

  const w = 1.28;
  const h = 2.28;
  const d = 0.96;

  // Back, left, right, top, bottom panels leaving front interior hollow
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), woodMat);
  back.position.set(0, h / 2, -d / 2 + 0.04);
  back.castShadow = true;
  back.receiveShadow = true;
  root.add(back);

  const leftSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, h, d), woodMat);
  leftSide.position.set(-w / 2 + 0.04, h / 2, 0);
  leftSide.castShadow = true;
  root.add(leftSide);

  const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, h, d), woodMat);
  rightSide.position.set(w / 2 - 0.04, h / 2, 0);
  rightSide.castShadow = true;
  root.add(rightSide);

  const topCrown = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.14, d + 0.12), trimMat);
  topCrown.position.set(0, h + 0.04, 0.02);
  root.add(topCrown);

  const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.12, d + 0.04), trimMat);
  basePlinth.position.set(0, 0.06, 0);
  root.add(basePlinth);

  // Articulated double doors with louvered eye-level peek slats
  const doorW = (w - 0.18) / 2;
  const doorH = h - 0.2;

  const buildDoor = (isLeft: boolean): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(isLeft ? -w / 2 + 0.08 : w / 2 - 0.08, 0.12, d / 2 - 0.04);
    const xOff = isLeft ? doorW / 2 : -doorW / 2;

    // Lower solid door panel
    const lower = new THREE.Mesh(new THREE.BoxGeometry(doorW - 0.015, doorH * 0.62, 0.05), woodMat);
    lower.position.set(xOff, doorH * 0.31, 0);
    lower.castShadow = true;
    pivot.add(lower);

    // Upper side stiles flanking eye-level peek louver slats
    const leftStile = new THREE.Mesh(new THREE.BoxGeometry(0.07, doorH * 0.38, 0.05), trimMat);
    leftStile.position.set(xOff - doorW / 2 + 0.035, doorH * 0.81, 0);
    pivot.add(leftStile);

    const rightStile = new THREE.Mesh(new THREE.BoxGeometry(0.07, doorH * 0.38, 0.05), trimMat);
    rightStile.position.set(xOff + doorW / 2 - 0.035, doorH * 0.81, 0);
    pivot.add(rightStile);

    const topRail = new THREE.Mesh(new THREE.BoxGeometry(doorW, 0.09, 0.05), trimMat);
    topRail.position.set(xOff, doorH - 0.045, 0);
    pivot.add(topRail);

    // Horizontal spaced louver slats so player can see outside while hiding
    for (let s = 0; s < 5; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(doorW - 0.12, 0.04, 0.04), woodMat);
      slat.position.set(xOff, doorH * 0.65 + s * 0.12, 0);
      slat.rotation.x = 0.25;
      pivot.add(slat);
    }

    // Antique brass handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8), brassMat);
    handle.position.set(isLeft ? doorW - 0.065 : -doorW + 0.065, doorH * 0.5, 0.045);
    pivot.add(handle);

    return pivot;
  };

  const leftDoorPivot = buildDoor(true);
  const rightDoorPivot = buildDoor(false);
  root.add(leftDoorPivot, rightDoorPivot);

  addContactShadow(root, textures.contactShadow, 0.82, 0.01);

  const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw);
  const insidePos = pos.clone().addScaledVector(forward, 0.04);
  const exitPos = pos.clone().addScaledVector(forward, 1.15);

  return {
    id,
    room,
    root,
    leftDoorPivot,
    rightDoorPivot,
    insidePos,
    exitPos,
    facingYaw,
    doorOpenAmount: 0,
  };
}

/**
 * First-person handheld heavy vintage metal flashlight held on bottom-right (matching Reference 1).
 */
export function createFlashlightViewModel(): FlashlightRig {
  const viewGroup = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1e22,
    roughness: 0.42,
    metalness: 0.78,
  });
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x0e1012,
    roughness: 0.88,
    metalness: 0.2,
  });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xfff4d8,
    emissive: 0xddeeff,
    emissiveIntensity: 1.5,
    roughness: 0.15,
    metalness: 0.1,
  });

  // Main barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.03, 0.28, 14), bodyMat);
  barrel.rotation.x = Math.PI / 2;
  viewGroup.add(barrel);

  // Rubber knurled grip sleeve
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.033, 0.12, 14), gripMat);
  grip.rotation.x = Math.PI / 2;
  grip.position.z = 0.04;
  viewGroup.add(grip);

  // Flared lamp head bezel
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.034, 0.075, 16), bodyMat);
  head.rotation.x = Math.PI / 2;
  head.position.z = -0.16;
  viewGroup.add(head);

  // Glowing lens cap
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.046, 14), lensMat);
  lens.position.z = -0.198;
  lens.rotation.y = Math.PI;
  viewGroup.add(lens);

  // Position in lower-right foreground of FPS camera
  viewGroup.position.set(0.28, -0.22, -0.44);
  viewGroup.rotation.set(0.06, -0.09, 0.05);

  // Volumetric-look subtle dust beam cone emerging from lens
  const beamGeo = new THREE.ConeGeometry(0.85, 5.2, 16, 1, true);
  beamGeo.translate(0, -2.6, 0);
  beamGeo.rotateX(Math.PI / 2);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xcbe8f0,
    transparent: true,
    opacity: 0.055,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const beamMesh = new THREE.Mesh(beamGeo, beamMat);
  beamMesh.position.set(0, 0, -0.22);
  viewGroup.add(beamMesh);

  // Real directional SpotLight attached to camera space
  const spotLight = new THREE.SpotLight(0xd9f0f7, 7.5, 22, Math.PI / 4.8, 0.52, 1.55);
  spotLight.position.set(0.18, -0.14, -0.25);
  spotLight.target.position.set(0, -0.05, -6);

  return {
    viewGroup,
    spotLight,
    beamMesh,
    lensMat,
  };
}

/**
 * Carved North Indian haveli wooden pillar with hanging antique brass bell (matching Reference 1).
 */
export function createCarvedPillarWithBell(
  height: number,
  textures: ProceduralTexturePack,
  withBell = true
): THREE.Group {
  const group = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodColor,
    bumpMap: textures.woodBump,
    bumpScale: 0.04,
    roughness: 0.82,
    metalness: 0.06,
  });

  const stoneBaseMat = new THREE.MeshStandardMaterial({
    map: textures.stoneColor,
    roughness: 0.9,
    metalness: 0.05,
  });

  // Stone plinth base
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.46), stoneBaseMat);
  plinth.position.y = 0.17;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Carved octagonal wooden shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, height - 0.72, 8), woodMat);
  shaft.position.y = 0.34 + (height - 0.72) / 2;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  group.add(shaft);

  // Ornamental carved collar rings
  [0.55, height - 0.75].forEach((ry) => {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.11, 8), woodMat);
    ring.position.y = ry;
    group.add(ring);
  });

  // Wide bracket capital at top
  const capital = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.28, 0.56), woodMat);
  capital.position.y = height - 0.22;
  group.add(capital);

  if (withBell) {
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0x9b7a3c,
      roughness: 0.38,
      metalness: 0.82,
    });
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 6), brassMat);
    chain.position.set(0.32, height - 0.54, 0);
    group.add(chain);

    const bellPts = [
      new THREE.Vector2(0.0, 0.18),
      new THREE.Vector2(0.045, 0.16),
      new THREE.Vector2(0.065, 0.08),
      new THREE.Vector2(0.11, 0.0),
    ];
    const bell = new THREE.Mesh(new THREE.LatheGeometry(bellPts, 12), brassMat);
    bell.position.set(0.32, height - 0.92, 0);
    group.add(bell);
  }

  return group;
}

/**
 * Vintage weathered wooden table for ritual items & lore notes (matching Reference 2).
 */
export function createWoodenTable(textures: ProceduralTexturePack, width = 1.25, depth = 0.78): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodColor,
    bumpMap: textures.woodBump,
    bumpScale: 0.03,
    roughness: 0.82,
    metalness: 0.05,
  });

  const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.07, depth), woodMat);
  top.position.y = 0.78;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const legGeo = new THREE.BoxGeometry(0.075, 0.76, 0.075);
  const lx = width / 2 - 0.09;
  const lz = depth / 2 - 0.09;
  [
    [-lx, -lz],
    [lx, -lz],
    [-lx, lz],
    [lx, lz],
  ].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(x, 0.38, z);
    leg.castShadow = true;
    group.add(leg);
  });

  addContactShadow(group, textures.contactShadow, Math.max(width, depth) * 0.65, 0.01);
  return group;
}

/**
 * Barred iron window with angled cold teal moonlight shaft (matching Reference 3).
 */
export function createMoonlightWindow(textures: ProceduralTexturePack): THREE.Group {
  const group = new THREE.Group();

  // Moonlit glowing frosted night backing
  const moonGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.9),
    new THREE.MeshBasicMaterial({ color: 0x3f717a })
  );
  group.add(moonGlass);

  // Rusted iron window grill overlay
  const grill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.54, 1.94),
    new THREE.MeshStandardMaterial({
      map: textures.grillColor,
      alphaMap: textures.grillAlpha,
      transparent: true,
      alphaTest: 0.45,
      roughness: 0.8,
      metalness: 0.55,
    })
  );
  grill.position.z = 0.04;
  group.add(grill);

  // Wooden window frame border
  const frameMat = new THREE.MeshStandardMaterial({ map: textures.woodColor, roughness: 0.86 });
  const topB = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.16), frameMat);
  topB.position.set(0, 0.98, 0.05);
  const botB = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.14, 0.22), frameMat);
  botB.position.set(0, -0.98, 0.06);
  group.add(topB, botB);

  // Translucent angled volumetric moonlight shaft
  const shaftGeo = new THREE.PlaneGeometry(1.55, 4.4);
  const shaftMat = new THREE.MeshBasicMaterial({
    color: 0x6ea6b0,
    transparent: true,
    opacity: 0.085,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.set(0, -0.85, 1.65);
  shaft.rotation.x = -0.95;
  group.add(shaft);

  return group;
}
