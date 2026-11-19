import * as THREE from 'three';
import { HorrorAudioManager } from './audio';
import { HaveliWorld, WaypointNode } from './haveliMap';
import { GhostRig } from './models';
import { DifficultyConfig, GhostAIState } from './types';

const _toPlayer = new THREE.Vector3();
const _ghostFwd = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _cameraRight = new THREE.Vector3();

export interface GhostTickResult {
  distanceToPlayer: number;
  state: GhostAIState;
  caughtPlayer: boolean;
  escapedChase: boolean;
  justStartedChase: boolean;
  proximityIntensity: number; // 0..1
}

export class GhostAIController {
  public state: GhostAIState = 'patrol';
  public readonly position = new THREE.Vector3(0, 0, -11.5);
  public yaw = 0;

  private readonly rig: GhostRig;
  private readonly world: HaveliWorld;
  private readonly audio: HorrorAudioManager;

  private path: number[] = [];
  private currentWaypointId = 8; // Start in far North Pooja Room
  private investigateTarget = new THREE.Vector3();
  private stateTimer = 0;
  private loseSightTimer = 0;
  private payalTimer = 0;
  private patrolVoiceTimer = 11;
  private wailTimer = 16;
  private knockTimer = 25;
  private nearVoiceCooldown = 0;
  private headTwitchTimer = 2.4;
  private headTwitchPulse = 0;
  private sawPlayerHide = false;
  private wasChasing = false;
  private shantiTime = 0;

  constructor(rig: GhostRig, world: HaveliWorld, audio: HorrorAudioManager) {
    this.rig = rig;
    this.world = world;
    this.audio = audio;
    this.reset();
  }

  public reset(): void {
    this.state = 'patrol';
    this.position.set(0, 0, -11.5);
    this.yaw = 0;
    this.currentWaypointId = 8;
    this.path = [];
    this.stateTimer = 0;
    this.loseSightTimer = 0;
    this.payalTimer = 0.8;
    this.patrolVoiceTimer = 10;
    this.wailTimer = 14;
    this.knockTimer = 22;
    this.nearVoiceCooldown = 0;
    this.sawPlayerHide = false;
    this.wasChasing = false;
    this.shantiTime = 0;

    const posAttr = this.rig.shantiParticles.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      const ang = (i * 2.39996) % (Math.PI * 2);
      const rad = 0.08 + (((i * 17) % 100) / 100) * 0.36;
      posAttr.setXYZ(i, Math.cos(ang) * rad, (((i * 31) % 100) / 100) * 1.65, Math.sin(ang) * rad);
    }
    posAttr.needsUpdate = true;
    this.rig.setDissolve(0);
    this.rig.root.position.copy(this.position);
    this.rig.root.rotation.y = this.yaw;
  }

  public setTitleShowcasePose(elapsed: number): void {
    this.rig.setDissolve(0);
    this.rig.root.position.set(-4.55, 0.04 + Math.sin(elapsed * 1.6) * 0.03, -4.65);
    this.rig.root.rotation.y = 0.72;
    this.rig.headGroup.rotation.set(
      0.06,
      Math.sin(elapsed * 0.8) * 0.14,
      Math.sin(elapsed * 2.3) > 0.94 ? 0.34 : 0.08
    );
    this.rig.leftArm.rotation.set(-0.5, 0, 0.2);
    this.rig.rightArm.rotation.set(-0.25, 0, -0.08);
  }

  public notifyNoise(sourcePos: THREE.Vector3, range: number): void {
    if (this.state === 'shanti' || this.state === 'chase') return;
    const dist = this.position.distanceTo(sourcePos);
    if (dist <= range) {
      this.state = 'investigate';
      this.investigateTarget.copy(sourcePos);
      this.stateTimer = 6.5;
      this.planPathTo(sourcePos);
    }
  }

  public notifyPlayerEnteredAlmirah(playerPos: THREE.Vector3): void {
    const dist = this.position.distanceTo(playerPos);
    const hasLos = this.world.hasLineOfSight(this.position, playerPos);
    // Fairer stealth rule: only caught if she was literally right behind you (< 5.2m) watching you climb in
    this.sawPlayerHide = this.state === 'chase' && hasLos && dist < 5.2;
    if (!this.sawPlayerHide && dist < 10) {
      this.notifyNoise(playerPos, 10);
    }
  }

  public triggerShanti(): void {
    this.state = 'shanti';
    this.shantiTime = 0;
    this.audio.speakGhostLine('victory', true);
    this.audio.playShantiChord();
  }

  private findNearestWaypoint(pos: THREE.Vector3): number {
    let bestId = 0;
    let bestDistSq = Infinity;
    for (let i = 0; i < this.world.waypoints.length; i++) {
      const wp = this.world.waypoints[i];
      const dx = wp.pos.x - pos.x;
      const dz = wp.pos.z - pos.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        bestId = wp.id;
      }
    }
    return bestId;
  }

  private planPathTo(targetPos: THREE.Vector3): void {
    const startId = this.findNearestWaypoint(this.position);
    const goalId = this.findNearestWaypoint(targetPos);
    if (startId === goalId) {
      this.path = [goalId];
      return;
    }

    const queue: number[] = [startId];
    const visited = new Set<number>([startId]);
    const parent = new Map<number, number>();

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === goalId) break;
      const node: WaypointNode = this.world.waypoints[curr];
      for (let i = 0; i < node.neighbors.length; i++) {
        const next = node.neighbors[i];
        if (!visited.has(next)) {
          visited.add(next);
          parent.set(next, curr);
          queue.push(next);
        }
      }
    }

    const rev: number[] = [];
    let step: number | undefined = goalId;
    while (step !== undefined && step !== startId) {
      rev.push(step);
      step = parent.get(step);
    }
    rev.reverse();
    this.path = rev.length > 0 ? rev : [goalId];
  }

  private pickNextPatrolWaypoint(): void {
    const curr = this.world.waypoints[this.currentWaypointId];
    const targetId = Math.floor(Math.random() * this.world.waypoints.length);
    if (targetId === curr.id) {
      const fallback = curr.neighbors[Math.floor(Math.random() * curr.neighbors.length)];
      this.path = [fallback];
    } else {
      this.planPathTo(this.world.waypoints[targetId].pos);
    }
  }

  public update(
    dt: number,
    elapsed: number,
    playerPos: THREE.Vector3,
    cameraQuaternion: THREE.Quaternion,
    flashlightOn: boolean,
    isHiding: boolean,
    climaxActive: boolean,
    inGracePeriod: boolean,
    config: DifficultyConfig
  ): GhostTickResult {
    // 1. Movie-Like 4-Act Victory Shanti Ascension & Stardust Dissolution (8.4s)
    if (this.state === 'shanti') {
      this.shantiTime += dt;
      const progress = Math.min(1, this.shantiTime / 8.4);

      // Act 1 (0..0.25): Hover softly above blazing Havan Kund, twitching ceases
      // Act 2 (0.25..0.55): Tilt head peacefully skyward, arms open gracefully in surrender
      // Act 3 (0.55..1.0): Ascend gracefully toward the golden night sky while spinning slowly
      const lift =
        progress < 0.25
          ? 0.45 + (progress / 0.25) * 0.35
          : 0.8 + Math.pow((progress - 0.25) / 0.75, 1.45) * 3.85;

      this.rig.root.position.set(0, lift, 0);
      this.rig.root.rotation.y = progress * Math.PI * 1.15;

      // Head slowly lifts toward the heavens
      const skyTilt = -0.05 - Math.min(1, progress * 1.8) * 0.36;
      this.rig.headGroup.rotation.set(skyTilt, Math.sin(this.shantiTime * 0.7) * 0.06, 0);

      // Arms gracefully open outward & slightly upward in serene peaceful surrender
      const armSpread = Math.min(1, progress * 2.1);
      this.rig.leftArm.rotation.set(-0.35 - armSpread * 0.45, 0, 0.22 + armSpread * 0.58);
      this.rig.rightArm.rotation.set(-0.35 - armSpread * 0.45, 0, -0.22 - armSpread * 0.58);
      this.rig.hairGroup.rotation.z = Math.sin(this.shantiTime * 1.6) * 0.03;
      this.rig.shantiHalo.rotation.z = this.shantiTime * 0.75;

      this.rig.setDissolve(progress);

      // Swirling helical upward spiral motion for all 480 golden-white particles
      const posAttr = this.rig.shantiParticles.geometry.attributes.position as THREE.BufferAttribute;
      const vels = this.rig.shantiVelocities;
      const swirlRate = 1.6 + progress * 2.4;
      for (let i = 0; i < posAttr.count; i++) {
        let px = posAttr.getX(i);
        let py = posAttr.getY(i);
        let pz = posAttr.getZ(i);

        const c = Math.cos(swirlRate * dt);
        const s = Math.sin(swirlRate * dt);
        const nx = px * c - pz * s;
        const nz = px * s + pz * c;

        const expand = progress > 0.38 ? 1 + dt * 0.55 : 1 + dt * 0.12;
        px = nx * expand + vels[i * 3] * dt * 0.35;
        py = py + vels[i * 3 + 1] * dt * (0.45 + progress * 1.35);
        pz = nz * expand + vels[i * 3 + 2] * dt * 0.35;

        posAttr.setXYZ(i, px, py, pz);
      }
      posAttr.needsUpdate = true;

      return {
        distanceToPlayer: this.position.distanceTo(playerPos),
        state: 'shanti',
        caughtPlayer: false,
        escapedChase: false,
        justStartedChase: false,
        proximityIntensity: 0,
      };
    }

    let escapedChase = false;
    let justStartedChase = false;

    _toPlayer.subVectors(playerPos, this.position);
    _toPlayer.y = 0;
    const dist = _toPlayer.length();
    const hasLos = this.world.hasLineOfSight(this.position, playerPos);

    // Stereo pan for spatial horror SFX
    _cameraRight.set(1, 0, 0).applyQuaternion(cameraQuaternion);
    const pan =
      dist > 0.2
        ? (_cameraRight.x * _toPlayer.x * -1 + _cameraRight.z * _toPlayer.z * -1) / dist
        : 0;

    // During opening grace period on Normal, ghost lingers eerily in the north wing without attacking
    const visionRange = flashlightOn ? config.visionRangeLit : config.visionRangeDark;
    _ghostFwd.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const facingDot = dist > 0.01 ? _ghostFwd.dot(_toPlayer) / dist : 1;
    const inVisionCone = facingDot > 0.22 || dist < 3.4;

    const canSeePlayer =
      !inGracePeriod &&
      hasLos &&
      dist < visionRange &&
      inVisionCone &&
      (!isHiding || flashlightOn || this.sawPlayerHide);

    if (climaxActive) {
      if (this.state !== 'chase') {
        this.state = 'chase';
        justStartedChase = true;
        this.audio.playChaseSting();
        this.audio.speakGhostLine('ritual', true);
      }
      if (!isHiding || flashlightOn) {
        this.investigateTarget.copy(playerPos);
      } else {
        this.investigateTarget.set(
          Math.cos(elapsed * 0.7) * 3.4,
          0,
          Math.sin(elapsed * 0.7) * 3.4
        );
      }
    } else if (canSeePlayer) {
      if (this.state !== 'chase') {
        this.state = 'chase';
        this.wasChasing = true;
        justStartedChase = true;
        this.audio.playChaseSting();
        this.audio.speakGhostLine('spot');
      }
      this.loseSightTimer = 2.8;
      this.investigateTarget.copy(playerPos);
    } else if (this.state === 'chase') {
      this.loseSightTimer -= dt;
      if (isHiding && !flashlightOn && !this.sawPlayerHide) {
        this.loseSightTimer -= dt * 2.2;
      }
      if (this.loseSightTimer <= 0) {
        this.state = 'search';
        this.stateTimer = 3.6;
        this.audio.speakGhostLine('near');
        if (this.wasChasing) {
          escapedChase = true;
          this.wasChasing = false;
        }
      }
    } else if (this.state === 'search') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'patrol';
        this.sawPlayerHide = false;
        this.pickNextPatrolWaypoint();
      }
    } else if (this.state === 'investigate') {
      this.stateTimer -= dt;
      if (this.position.distanceTo(this.investigateTarget) < 1.15 || this.stateTimer <= 0) {
        this.state = 'search';
        this.stateTimer = 2.6;
      }
    }

    // Periodic eerie ghost vocals, corridor weeping wails, and hollow knocks
    this.patrolVoiceTimer -= dt;
    if (this.state === 'patrol' && this.patrolVoiceTimer <= 0 && dist < 18) {
      this.audio.speakGhostLine('patrol');
      this.patrolVoiceTimer = 13 + Math.random() * 8;
    }

    this.wailTimer -= dt;
    if (this.wailTimer <= 0 && dist > 4.5 && dist < 22) {
      this.audio.playGhostWail(dist, pan);
      this.wailTimer = 15 + Math.random() * 12;
    }

    this.knockTimer -= dt;
    if (this.knockTimer <= 0 && this.state !== 'chase') {
      this.audio.playDistantKnock();
      this.knockTimer = 24 + Math.random() * 16;
    }

    this.nearVoiceCooldown -= dt;
    if (!inGracePeriod && dist < 5.5 && this.nearVoiceCooldown <= 0 && this.state !== 'chase') {
      this.audio.speakGhostLine('near');
      this.nearVoiceCooldown = 14;
    }

    // Determine movement speed & target
    let speed = inGracePeriod ? config.patrolSpeed * 0.45 : config.patrolSpeed;
    let moveGoal: THREE.Vector3 | null = null;

    if (inGracePeriod) {
      // Gently hover around North Pooja Room during start grace period
      moveGoal = this.world.waypoints[8].pos;
      if (this.position.distanceTo(moveGoal) < 0.8) speed = 0;
    } else if (this.state === 'chase') {
      speed = climaxActive ? config.climaxSpeed : config.chaseSpeed;
      if (hasLos && dist < 11) {
        moveGoal = this.investigateTarget;
      } else {
        if (this.path.length === 0 || Math.random() < dt * 2.2) {
          this.planPathTo(this.investigateTarget);
        }
        if (this.path.length > 0) {
          moveGoal = this.world.waypoints[this.path[0]].pos;
        }
      }
    } else if (this.state === 'investigate') {
      speed = config.investigateSpeed;
      if (this.path.length > 0) {
        moveGoal = this.world.waypoints[this.path[0]].pos;
      } else {
        moveGoal = this.investigateTarget;
      }
    } else if (this.state === 'patrol') {
      speed = config.patrolSpeed;
      if (this.path.length === 0) {
        this.pickNextPatrolWaypoint();
      }
      if (this.path.length > 0) {
        moveGoal = this.world.waypoints[this.path[0]].pos;
      }
    } else {
      speed = 0;
      this.yaw += Math.sin(elapsed * 2.1) * dt * 1.5;
    }

    if (moveGoal && speed > 0) {
      _moveDir.subVectors(moveGoal, this.position);
      _moveDir.y = 0;
      const rem = _moveDir.length();
      if (rem < 0.65 && this.path.length > 0) {
        this.currentWaypointId = this.path.shift()!;
      } else if (rem > 0.05) {
        _moveDir.divideScalar(rem);
        this.position.addScaledVector(_moveDir, speed * dt);
        this.world.resolvePlayerCollision(this.position, 0.36);

        const targetYaw = Math.atan2(_moveDir.x, _moveDir.z);
        let diff = targetYaw - this.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.yaw += diff * Math.min(1, dt * 6.5);
      }
    }

    // Eerie floating glide, head-twitch & reaching arm animations
    const hoverY = 0.06 + Math.sin(elapsed * (this.state === 'chase' ? 5.2 : 2.4)) * 0.045;
    this.rig.root.position.set(this.position.x, hoverY, this.position.z);
    this.rig.root.rotation.y = this.yaw;

    this.headTwitchTimer -= dt;
    if (this.headTwitchTimer <= 0) {
      this.headTwitchPulse = 0.24 + Math.random() * 0.22;
      this.headTwitchTimer =
        this.state === 'chase' ? 0.55 + Math.random() * 0.9 : 1.8 + Math.random() * 2.8;
    }
    if (this.headTwitchPulse > 0) {
      this.headTwitchPulse -= dt;
      this.rig.headGroup.rotation.z = (Math.random() > 0.5 ? 1 : -1) * 0.42;
      this.rig.headGroup.rotation.y = (Math.random() - 0.5) * 0.45;
    } else {
      this.rig.headGroup.rotation.z = THREE.MathUtils.damp(
        this.rig.headGroup.rotation.z,
        Math.sin(elapsed * 1.4) * 0.1,
        8,
        dt
      );
      this.rig.headGroup.rotation.y = THREE.MathUtils.damp(
        this.rig.headGroup.rotation.y,
        0,
        8,
        dt
      );
    }

    const targetArmX =
      this.state === 'chase'
        ? -1.18 + Math.sin(elapsed * 7) * 0.12
        : -0.08 + Math.sin(elapsed * 2) * 0.05;
    this.rig.leftArm.rotation.x = THREE.MathUtils.damp(this.rig.leftArm.rotation.x, targetArmX, 6, dt);
    this.rig.rightArm.rotation.x = THREE.MathUtils.damp(
      this.rig.rightArm.rotation.x,
      targetArmX * 0.92,
      6,
      dt
    );
    this.rig.hairGroup.rotation.z = Math.sin(elapsed * 3.1) * 0.04;

    // Spatial distance-attenuated silver payal / ghungroo anklet chimes
    this.payalTimer -= dt;
    if (this.payalTimer <= 0 && speed > 0) {
      this.audio.playPayalChime(dist, pan);
      this.payalTimer = this.state === 'chase' ? 0.42 : 0.88;
    }

    const distFactor = Math.max(0, Math.min(1, 1 - (dist - 1.5) / 13.5));
    const proximityIntensity = inGracePeriod
      ? distFactor * 0.25
      : Math.min(1, distFactor * (this.state === 'chase' ? 1.25 : 0.82) + (climaxActive ? 0.28 : 0));

    const canCatch = !inGracePeriod && (!isHiding || flashlightOn || this.sawPlayerHide);
    const caughtPlayer = canCatch && dist < 1.05;

    return {
      distanceToPlayer: dist,
      state: this.state,
      caughtPlayer,
      escapedChase,
      justStartedChase,
      proximityIntensity,
    };
  }
}
