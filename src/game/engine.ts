import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HorrorAudioManager } from './audio';
import { GhostAIController } from './ghostAI';
import { HaveliWorld, buildHaveliWorld } from './haveliMap';
import {
  AlmirahRig,
  FlashlightRig,
  GhostRig,
  createFlashlightViewModel,
  createGhostModel,
} from './models';
import { ProceduralTexturePack, createProceduralTextures } from './textures';
import {
  CHAPTER_CONFIGS,
  ChapterNumber,
  DIFFICULTY_CONFIGS,
  Difficulty,
  DifficultyConfig,
  GamePhase,
  GraphicsQuality,
  HudSnapshot,
  LoreNoteData,
  MinimapData,
  MinimapObjective,
  RITUAL_ITEMS,
  RitualItemId,
  SubtitleState,
} from './types';

const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');

export interface TouchInputState {
  moveX: number;
  moveY: number;
  sprint: boolean;
}

export class MokshaGameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;

  private textures: ProceduralTexturePack;
  private world: HaveliWorld;
  private ghostRig: GhostRig;
  private ghostAI: GhostAIController;
  private flashlight: FlashlightRig;
  public readonly audio: HorrorAudioManager;

  private moonLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private dustParticles: THREE.Points;

  private phase: GamePhase = 'title';
  private difficulty: Difficulty = 'normal';
  private quality: GraphicsQuality = 'high';
  private currentChapter: ChapterNumber = 1;
  private chapter2Decoded = false;
  private chapter3NextBellIndex = 0;

  private playerPos = new THREE.Vector3(0, 1.65, 11.4);
  private playerYaw = 0;
  private playerPitch = 0;
  private walkBobPhase = 0;
  private footstepCooldown = 0;
  private breathTimer = 1.6;

  private stamina = 100;
  private battery = 100;
  private flashlightOn = true;
  private bpm = 72;
  private maxBpm = 72;
  private heartbeatTimer = 0.8;

  private holdingItem: RitualItemId | null = null;
  private placedItems: RitualItemId[] = [];
  private hidingAlmirah: AlmirahRig | null = null;
  private activeNote: LoreNoteData | null = null;

  private elapsedSeconds = 0;
  private timeSinceProgress = 0;
  private hintActive = false;
  private climaxRemaining = 10;
  private jumpscareTimer = 0;
  private shantiProgress = 0;
  private jumpscaresSurvived = 0;
  private templeBellTimer = 19;
  private proximityIntensity = 0;
  private subtitle: SubtitleState | null = null;
  private pointerLocked = false;
  private disposed = false;

  private keys = new Set<string>();
  public touchInput: TouchInputState = { moveX: 0, moveY: 0, sprint: false };

  private frameId = 0;
  private lastTimestamp = 0;
  private hudThrottle = 0;
  private onHudUpdate: (snapshot: HudSnapshot) => void;
  private envRT: THREE.WebGLRenderTarget | null = null;

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundBlur: () => void;
  private boundResize: () => void;
  private boundOrientationChange: () => void;
  private boundVisibilityChange: () => void;
  private boundPointerLockChange: () => void;
  private boundContextLost: (e: Event) => void;
  private boundContextRestored: () => void;

  constructor(
    container: HTMLElement,
    initialDifficulty: Difficulty,
    initialQuality: GraphicsQuality,
    onHudUpdate: (snapshot: HudSnapshot) => void
  ) {
    this.container = container;
    this.difficulty = initialDifficulty;
    this.quality = initialQuality;
    this.onHudUpdate = onHudUpdate;

    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && initialQuality === 'high',
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && initialQuality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.applyQualityPixelRatio();
    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );

    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x061013);
    this.scene.fog = new THREE.FogExp2(0x061013, initialQuality === 'low' ? 0.082 : 0.072);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = 0.24;
    pmrem.dispose();

    const aspect =
      (container.clientWidth || window.innerWidth) /
      Math.max(1, container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.08, 48);
    this.scene.add(this.camera);

    this.flashlight = createFlashlightViewModel();
    this.camera.add(this.flashlight.viewGroup);
    this.camera.add(this.flashlight.spotLight);
    this.camera.add(this.flashlight.spotLight.target);

    this.hemiLight = new THREE.HemisphereLight(0x285662, 0x1a1410, 0.65);
    this.scene.add(this.hemiLight);

    this.moonLight = new THREE.DirectionalLight(0x63a8b8, 1.35);
    this.moonLight.position.set(7, 16, -6);
    this.moonLight.castShadow = !this.isSoftwareGl && initialQuality === 'high';
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.moonLight.shadow.camera.near = 1;
    this.moonLight.shadow.camera.far = 34;
    const d = 14;
    this.moonLight.shadow.camera.left = -d;
    this.moonLight.shadow.camera.right = d;
    this.moonLight.shadow.camera.top = d;
    this.moonLight.shadow.camera.bottom = -d;
    this.moonLight.shadow.bias = -0.0005;
    this.moonLight.shadow.normalBias = 0.02;
    this.scene.add(this.moonLight);

    this.textures = createProceduralTextures(this.renderer);
    this.world = buildHaveliWorld(this.textures, initialQuality === 'low');
    this.scene.add(this.world.root);

    this.ghostRig = createGhostModel(this.textures);
    this.scene.add(this.ghostRig.root);

    this.audio = new HorrorAudioManager((sub) => {
      this.subtitle = sub;
      this.emitHud();
    });

    this.ghostAI = new GhostAIController(this.ghostRig, this.world, this.audio);

    this.dustParticles = this.createDustMotes(initialQuality === 'low' ? 90 : 220);
    this.scene.add(this.dustParticles);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundBlur = this.onWindowBlur.bind(this);
    this.boundResize = this.onResize.bind(this);
    this.boundOrientationChange = () => {
      window.setTimeout(() => this.onResize(), 120);
      window.setTimeout(() => this.onResize(), 320);
    };
    this.boundVisibilityChange = () => {
      if (document.hidden && (this.phase === 'playing' || this.phase === 'climax')) {
        this.pauseGame();
      }
    };
    this.boundPointerLockChange = this.onPointerLockChange.bind(this);
    this.boundContextLost = (e: Event) => e.preventDefault();
    this.boundContextRestored = () => this.applyQualityPixelRatio();

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('blur', this.boundBlur);
    window.addEventListener('resize', this.boundResize);
    window.addEventListener('orientationchange', this.boundOrientationChange);
    window.visualViewport?.addEventListener('resize', this.boundResize);
    document.addEventListener('visibilitychange', this.boundVisibilityChange);
    document.addEventListener('pointerlockchange', this.boundPointerLockChange);
    canvas.addEventListener('webglcontextlost', this.boundContextLost);
    canvas.addEventListener('webglcontextrestored', this.boundContextRestored);

    this.lastTimestamp = performance.now();
    this.emitHud();
    this.scheduleNextFrame();
  }

  private createDustMotes(count: number): THREE.Points {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = 0.4 + Math.random() * 4.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xa9cfd6,
      size: 0.045,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });
    return new THREE.Points(geo, mat);
  }

  private applyQualityPixelRatio(): void {
    if (this.isSoftwareGl) {
      this.renderer.setPixelRatio(1);
    } else {
      const isMobile =
        typeof window !== 'undefined' &&
        (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
      const cap =
        this.quality === 'low'
          ? isMobile
            ? 1.0
            : 1.15
          : isMobile
            ? 1.5
            : 2;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    }
  }

  public setGraphicsQuality(quality: GraphicsQuality): void {
    this.quality = quality;
    this.applyQualityPixelRatio();
    const shadows = !this.isSoftwareGl && quality === 'high';
    this.renderer.shadowMap.enabled = shadows;
    this.moonLight.castShadow = shadows;
    this.dustParticles.visible = quality === 'high';
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = quality === 'low' ? 0.084 : 0.072;
    }
  }

  public setDifficulty(diff: Difficulty): void {
    this.difficulty = diff;
  }

  public requestPointerLock(): void {
    if (this.phase !== 'playing' && this.phase !== 'climax') return;
    try {
      const canvas = this.renderer.domElement;
      if (canvas.requestPointerLock && document.pointerLockElement !== canvas) {
        const res = canvas.requestPointerLock() as unknown as Promise<void> | undefined;
        if (res && typeof res.catch === 'function') {
          res.catch(() => {});
        }
      }
    } catch {
      // ignore if sandbox/mobile blocks pointer lock
    }
  }

  public releasePointerLock(): void {
    try {
      if (document.pointerLockElement && document.exitPointerLock) {
        document.exitPointerLock();
      }
    } catch {
      // ignore
    }
  }

  private getChapterScaledConfig(): DifficultyConfig {
    const base = DIFFICULTY_CONFIGS[this.difficulty];
    const mult = CHAPTER_CONFIGS[this.currentChapter].ghostSpeedMult;
    return {
      ...base,
      patrolSpeed: base.patrolSpeed * mult,
      investigateSpeed: base.investigateSpeed * mult,
      chaseSpeed: base.chaseSpeed * mult,
      climaxSpeed: base.climaxSpeed * mult,
    };
  }

  private completeNonFinalChapter(): void {
    this.phase = 'chapter_complete';
    this.hidingAlmirah = null;
    this.activeNote = null;
    this.keys.clear();
    this.releasePointerLock();
    this.audio.setTension(0, false);
    this.audio.playShantiChord();
    this.emitHud();
  }

  private resetRunState(difficulty: Difficulty, chapter: ChapterNumber): void {
    this.difficulty = difficulty;
    this.currentChapter = chapter;
    this.chapter2Decoded = false;
    this.chapter3NextBellIndex = 0;
    this.world.configureForChapter(chapter);
    this.ghostAI.reset();

    // Restore nocturnal moonlight atmosphere in case previous run ended in golden Shanti victory
    this.hemiLight.color.setHex(0x285662);
    this.hemiLight.intensity = 0.65;
    this.moonLight.color.setHex(0x63a8b8);
    this.moonLight.intensity = 1.35;
    this.scene.background = new THREE.Color(0x061013);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(0x061013);
      this.scene.fog.density = this.quality === 'low' ? 0.084 : 0.072;
    }

    this.playerPos.set(0, 1.65, 11.4);
    this.playerYaw = 0;
    this.playerPitch = 0;
    this.stamina = 100;
    this.battery = 100;
    this.flashlightOn = true;
    this.bpm = 72;
    this.maxBpm = 72;
    this.breathTimer = 2.0;
    this.holdingItem = null;
    this.placedItems = [];
    this.hidingAlmirah = null;
    this.activeNote = null;
    this.elapsedSeconds = 0;
    this.timeSinceProgress = 0;
    this.hintActive = false;
    this.climaxRemaining = DIFFICULTY_CONFIGS[difficulty].climaxDuration;
    this.jumpscareTimer = 0;
    this.shantiProgress = 0;
    this.jumpscaresSurvived = 0;
    this.proximityIntensity = 0;
    this.subtitle = null;
    this.keys.clear();

    this.world.almirahs.forEach((a) => {
      a.doorOpenAmount = 0;
      a.leftDoorPivot.rotation.y = 0;
      a.rightDoorPivot.rotation.y = 0;
    });
  }

  /**
   * Begins full cinematic flow: Title -> AI Story -> Unhurried Mission Briefing -> Playing
   */
  public startNewGame(
    difficulty: Difficulty,
    skipStoryAndBriefing = false,
    chapter: ChapterNumber = 1
  ): void {
    this.audio.unlock();
    this.audio.stopVictorySong();
    this.audio.stopStoryNarration();
    this.audio.prewarmGhostVoices();
    this.resetRunState(difficulty, chapter);

    this.phase = skipStoryAndBriefing ? 'playing' : 'story';
    this.audio.playTempleBell(0.6);
    this.emitHud();
  }

  public startChapterDirect(
    difficulty: Difficulty,
    chapter: ChapterNumber,
    showBriefing = true
  ): void {
    this.audio.unlock();
    this.audio.stopVictorySong();
    this.audio.stopStoryNarration();
    this.audio.prewarmGhostVoices();
    this.resetRunState(difficulty, chapter);

    this.phase = showBriefing ? 'briefing' : 'playing';
    this.audio.playTempleBell(0.62);
    this.emitHud();
    if (!showBriefing) {
      this.requestPointerLock();
    }
  }

  public advanceStoryToBriefing(): void {
    if (this.phase !== 'story') return;
    this.audio.stopStoryNarration();
    this.phase = 'briefing';
    this.emitHud();
  }

  public enterHaveliFromBriefing(): void {
    if (this.phase !== 'briefing') return;
    this.audio.unlock();
    this.audio.stopStoryNarration();
    this.phase = 'playing';
    this.audio.playTempleBell(0.7);
    this.emitHud();
    this.requestPointerLock();
  }

  public pauseGame(): void {
    if (this.phase === 'playing' || this.phase === 'climax') {
      this.phase = 'paused';
      this.keys.clear();
      this.releasePointerLock();
      this.emitHud();
    }
  }

  public resumeGame(): void {
    if (this.phase === 'paused' || this.phase === 'note') {
      this.activeNote = null;
      this.phase = this.placedItems.length >= 4 && this.climaxRemaining > 0 ? 'climax' : 'playing';
      this.emitHud();
      this.requestPointerLock();
    }
  }

  public skipVictoryCutscene(): void {
    if (this.phase !== 'victory') return;
    this.shantiProgress = 1;
    this.emitHud();
  }

  public returnToTitle(): void {
    this.audio.stopStoryNarration();
    this.audio.stopVictorySong();
    this.phase = 'title';
    this.activeNote = null;
    this.hidingAlmirah = null;
    this.keys.clear();
    this.releasePointerLock();
    this.hemiLight.color.setHex(0x285662);
    this.hemiLight.intensity = 0.65;
    this.moonLight.color.setHex(0x63a8b8);
    this.moonLight.intensity = 1.35;
    this.scene.background = new THREE.Color(0x061013);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(0x061013);
      this.scene.fog.density = this.quality === 'low' ? 0.084 : 0.072;
    }
    this.audio.setTension(0, false);
    this.emitHud();
  }

  public toggleFlashlight(): void {
    if (this.phase !== 'playing' && this.phase !== 'climax') return;
    this.audio.unlock();
    if (this.battery <= 0.5 && !this.flashlightOn) return;
    this.flashlightOn = !this.flashlightOn;
    this.audio.playFlashlightClick();
    this.emitHud();
  }

  public applyLookDelta(dx: number, dy: number): void {
    if (this.phase !== 'playing' && this.phase !== 'climax') return;
    const sens = 0.0024;
    this.playerYaw -= dx * sens;
    this.playerPitch = Math.max(-1.15, Math.min(1.15, this.playerPitch - dy * sens));

    if (this.hidingAlmirah) {
      const centerYaw = this.hidingAlmirah.facingYaw + Math.PI;
      let diff = this.playerYaw - centerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      diff = Math.max(-0.52, Math.min(0.52, diff));
      this.playerYaw = centerYaw + diff;
    }
  }

  public triggerInteract(): void {
    this.audio.unlock();
    if (this.phase === 'note') {
      this.resumeGame();
      return;
    }
    if (this.phase !== 'playing' && this.phase !== 'climax') return;

    // 1. Exit almirah
    if (this.hidingAlmirah) {
      this.playerPos.set(this.hidingAlmirah.exitPos.x, 1.65, this.hidingAlmirah.exitPos.z);
      this.hidingAlmirah = null;
      this.audio.playWoodCreak();
      this.ghostAI.notifyNoise(this.playerPos, 7.5);
      this.emitHud();
      return;
    }

    // 2. CHAPTER-SPECIFIC INTERACTIONS
    const distToKund = Math.hypot(this.playerPos.x, this.playerPos.z);

    // --- CHAPTER 1: LIGHT 5 SHRINE DIYAS ---
    if (this.currentChapter === 1) {
      for (const diya of this.world.shrineDiyas) {
        if (diya.lit) continue;
        const d = Math.hypot(this.playerPos.x - diya.position.x, this.playerPos.z - diya.position.z);
        if (d < 2.45) {
          diya.lit = true;
          diya.flameMesh.visible = true;
          if (diya.light) diya.light.intensity = 1.9;
          this.timeSinceProgress = 0;
          this.hintActive = false;
          this.audio.playHavanPlace(false);

          const litCount = this.world.shrineDiyas.filter((x) => x.lit).length;
          if (litCount === 3) {
            this.audio.speakGhostLine('patrol', true);
          }
          if (litCount >= this.world.shrineDiyas.length) {
            this.completeNonFinalChapter();
          } else {
            this.emitHud();
          }
          return;
        }
      }
    }

    // --- CHAPTER 2: DECODE MANTRA AT HAVAN KUND AFTER READING ALL 4 CLUES ---
    if (this.currentChapter === 2) {
      const readCount = this.world.notes.filter((n) => n.read).length;
      if (readCount >= this.world.notes.length && !this.chapter2Decoded && distToKund < 3.2) {
        this.chapter2Decoded = true;
        this.audio.playHavanPlace(true);
        this.completeNonFinalChapter();
        return;
      }
    }

    // --- CHAPTER 3: RING 4 HANGING TEMPLE BELLS IN EXACT ORDER ---
    if (this.currentChapter === 3) {
      for (const bell of this.world.chapterBells) {
        if (bell.rung) continue;
        const d = Math.hypot(this.playerPos.x - bell.position.x, this.playerPos.z - bell.position.z);
        if (d < 2.65) {
          if (bell.orderIndex === this.chapter3NextBellIndex) {
            bell.rung = true;
            bell.swingVelocity = 4.2;
            this.chapter3NextBellIndex += 1;
            this.timeSinceProgress = 0;
            this.hintActive = false;
            this.audio.playTempleBell(1.0);
            // Loud bell draws the ghost toward this room — ring & escape!
            this.ghostAI.notifyNoise(bell.position, 24);
            if (this.chapter3NextBellIndex === 2) {
              this.audio.speakGhostLine('near', true);
            }
            if (this.chapter3NextBellIndex >= this.world.chapterBells.length) {
              this.completeNonFinalChapter();
            } else {
              this.emitHud();
            }
            return;
          } else {
            // Wrong order: gentle dull chime so player sees the prompt hint
            this.audio.playFlashlightClick();
            this.emitHud();
            return;
          }
        }
      }
    }

    // --- CHAPTER 4: SHATTER 4 CURSED CRIMSON TANTRIK SEALS ---
    if (this.currentChapter === 4) {
      for (const seal of this.world.cursedSeals) {
        if (seal.broken) continue;
        const d = Math.hypot(this.playerPos.x - seal.position.x, this.playerPos.z - seal.position.z);
        if (d < 2.55) {
          seal.broken = true;
          seal.talismanMesh.visible = false;
          if (seal.light) seal.light.intensity = 0;
          this.timeSinceProgress = 0;
          this.hintActive = false;
          this.audio.playHavanPlace(true);
          this.audio.speakGhostLine('ritual', true);
          this.ghostAI.notifyNoise(seal.position, 26);

          const brokenCount = this.world.cursedSeals.filter((x) => x.broken).length;
          if (brokenCount >= this.world.cursedSeals.length) {
            this.completeNonFinalChapter();
          } else {
            this.emitHud();
          }
          return;
        }
      }
    }

    // --- CHAPTER 5: OFFER HELD SACRED ITEM AT HAVAN KUND OR COLLECT ITEM ---
    if (this.currentChapter === 5) {
      if (this.holdingItem && distToKund < 3.1) {
        const id = this.holdingItem;
        this.holdingItem = null;
        this.placedItems.push(id);
        const worldItem = this.world.ritualItems.find((r) => r.id === id);
        if (worldItem) worldItem.placed = true;
        this.world.havanKund.itemSlots[id].visible = true;
        this.timeSinceProgress = 0;
        this.hintActive = false;

        const isFinal = this.placedItems.length >= 4;
        this.audio.playHavanPlace(isFinal);

        if (isFinal) {
          this.phase = 'climax';
          this.climaxRemaining = DIFFICULTY_CONFIGS[this.difficulty].climaxDuration;
          this.audio.playPlayerReaction('climax');
        } else if (this.placedItems.length === 2) {
          this.audio.speakGhostLine('ritual');
        }
        this.emitHud();
        return;
      }

      if (!this.holdingItem) {
        for (const item of this.world.ritualItems) {
          if (item.collected) continue;
          const d = Math.hypot(this.playerPos.x - item.position.x, this.playerPos.z - item.position.z);
          if (d < 2.35) {
            item.collected = true;
            item.group.visible = false;
            this.holdingItem = item.id;
            this.timeSinceProgress = 0;
            this.hintActive = false;
            this.audio.playItemPickup();
            this.emitHud();
            return;
          }
        }
      }
    }

    // 4. Climb into nearby wooden Almirah
    for (const alm of this.world.almirahs) {
      const d = Math.hypot(this.playerPos.x - alm.exitPos.x, this.playerPos.z - alm.exitPos.z);
      if (d < 1.95) {
        this.hidingAlmirah = alm;
        this.playerPos.set(alm.insidePos.x, 1.56, alm.insidePos.z);
        this.playerYaw = alm.facingYaw + Math.PI;
        this.playerPitch = 0;
        this.audio.playWoodCreak();
        if (this.proximityIntensity > 0.35) {
          this.audio.playPlayerReaction('hide');
        }
        this.ghostAI.notifyPlayerEnteredAlmirah(this.playerPos);
        this.emitHud();
        return;
      }
    }

    // 5. Read nearby Hinglish Lore Note (also tracks Chapter 2 progress!)
    for (const note of this.world.notes) {
      const d = Math.hypot(this.playerPos.x - note.position.x, this.playerPos.z - note.position.z);
      if (d < 2.2) {
        const wasUnread = !note.read;
        note.read = true;
        if (this.currentChapter === 2 && wasUnread) {
          this.timeSinceProgress = 0;
          this.hintActive = false;
          this.ghostAI.notifyNoise(note.position, 14);
        }
        this.activeNote = note.data;
        this.phase = 'note';
        this.keys.clear();
        this.releasePointerLock();
        this.audio.playItemPickup();
        this.emitHud();
        return;
      }
    }
  }

  private getCurrentPrompt(): { text: string | null; key: string } {
    if (this.phase !== 'playing' && this.phase !== 'climax') {
      return { text: null, key: 'E' };
    }
    if (this.hidingAlmirah) {
      return { text: 'Exit Almirah', key: 'E' };
    }

    const distToKund = Math.hypot(this.playerPos.x, this.playerPos.z);

    if (this.currentChapter === 1) {
      for (const diya of this.world.shrineDiyas) {
        if (diya.lit) continue;
        if (Math.hypot(this.playerPos.x - diya.position.x, this.playerPos.z - diya.position.z) < 2.45) {
          return { text: `Light Shrine Diya (${diya.room})`, key: 'E' };
        }
      }
    } else if (this.currentChapter === 2) {
      const readCount = this.world.notes.filter((n) => n.read).length;
      if (distToKund < 3.2) {
        if (readCount >= this.world.notes.length) {
          return { text: 'Decode 1984 Mantra at Havan Kund', key: 'E' };
        }
        return { text: `Read all 4 1984 Clues first (${readCount}/4 Read)`, key: '' };
      }
    } else if (this.currentChapter === 3) {
      for (const bell of this.world.chapterBells) {
        if (bell.rung) continue;
        if (Math.hypot(this.playerPos.x - bell.position.x, this.playerPos.z - bell.position.z) < 2.65) {
          if (bell.orderIndex === this.chapter3NextBellIndex) {
            return { text: `Ring ${bell.label}`, key: 'E' };
          }
          const nextBell = this.world.chapterBells[this.chapter3NextBellIndex];
          return {
            text: `Wrong order — Ring ${nextBell?.label ?? 'next bell'} first!`,
            key: '',
          };
        }
      }
    } else if (this.currentChapter === 4) {
      for (const seal of this.world.cursedSeals) {
        if (seal.broken) continue;
        if (Math.hypot(this.playerPos.x - seal.position.x, this.playerPos.z - seal.position.z) < 2.55) {
          return { text: `Shatter Cursed Tantrik Seal (${seal.room})`, key: 'E' };
        }
      }
    } else if (this.currentChapter === 5) {
      if (distToKund < 3.1) {
        if (this.holdingItem) {
          return { text: `Offer ${RITUAL_ITEMS[this.holdingItem].name} to Havan Kund`, key: 'E' };
        }
        if (this.placedItems.length < 4) {
          return { text: `Havan Kund (${this.placedItems.length}/4 Sacred Items Placed)`, key: '' };
        }
      }

      for (const item of this.world.ritualItems) {
        if (item.collected) continue;
        if (Math.hypot(this.playerPos.x - item.position.x, this.playerPos.z - item.position.z) < 2.35) {
          if (this.holdingItem) {
            return { text: 'Offer held item to the Courtyard Havan Kund first', key: '' };
          }
          return { text: `Collect ${RITUAL_ITEMS[item.id].name}`, key: 'E' };
        }
      }
    }

    for (const alm of this.world.almirahs) {
      if (Math.hypot(this.playerPos.x - alm.exitPos.x, this.playerPos.z - alm.exitPos.z) < 1.95) {
        return { text: 'Hide inside Wooden Almirah', key: 'E' };
      }
    }

    for (const note of this.world.notes) {
      if (Math.hypot(this.playerPos.x - note.position.x, this.playerPos.z - note.position.z) < 2.2) {
        const badge = this.currentChapter === 2 && !note.read ? ' [CLUE]' : '';
        return { text: `Read Note${badge}: ${note.data.title}`, key: 'E' };
      }
    }

    return { text: null, key: 'E' };
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Escape') {
      if (this.phase === 'note') {
        this.resumeGame();
      } else if (this.phase === 'playing' || this.phase === 'climax') {
        this.pauseGame();
      } else if (this.phase === 'paused') {
        this.resumeGame();
      }
      return;
    }

    if (e.repeat) return;
    this.keys.add(e.code);

    if (e.code === 'KeyF') {
      this.toggleFlashlight();
    } else if (e.code === 'KeyE') {
      this.triggerInteract();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.pointerLocked) return;
    this.applyLookDelta(e.movementX, e.movementY);
  }

  private onWindowBlur(): void {
    this.keys.clear();
    this.touchInput.moveX = 0;
    this.touchInput.moveY = 0;
    this.touchInput.sprint = false;
  }

  private onPointerLockChange(): void {
    this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
    this.emitHud();
  }

  private onResize(): void {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.visualViewport?.width || window.innerWidth;
    const h = Math.max(
      1,
      this.container.clientHeight || window.visualViewport?.height || window.innerHeight
    );
    const aspect = w / h;
    this.camera.aspect = aspect;
    // Keep wide 20:9 Android landscape phones crisp and distortion-free
    this.camera.fov = aspect > 1.9 ? 66 : aspect < 1 ? 76 : 70;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.applyQualityPixelRatio();
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private tick = (): void => {
    if (this.disposed) return;
    const now = performance.now();
    const rawDt = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
    const timeSec = now * 0.001;

    this.updateScene(dt, timeSec);
    this.renderer.render(this.scene, this.camera);
    this.scheduleNextFrame();
  };

  private updateScene(dt: number, timeSec: number): void {
    for (let i = 0; i < this.world.flickerLights.length; i++) {
      const fl = this.world.flickerLights[i];
      const f =
        0.85 + Math.sin(timeSec * 12.5 + fl.phase) * 0.12 + Math.sin(timeSec * 23 + fl.phase) * 0.06;
      fl.light.intensity = fl.baseIntensity * f;
      if (fl.flame) fl.flame.scale.set(1, f, 1);
    }

    if (this.dustParticles.visible) {
      const pos = this.dustParticles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + dt * 0.08;
        if (y > 5.2) y = 0.35;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    for (const alm of this.world.almirahs) {
      const targetOpen = this.hidingAlmirah === alm ? 0.08 : 0;
      alm.doorOpenAmount = THREE.MathUtils.damp(alm.doorOpenAmount, targetOpen, 8, dt);
      alm.leftDoorPivot.rotation.y = -alm.doorOpenAmount;
      alm.rightDoorPivot.rotation.y = alm.doorOpenAmount;
    }

    // Live 3D courtyard atmospheric camera pan during Title, Story & Briefing modals
    if (this.phase === 'title' || this.phase === 'story' || this.phase === 'briefing') {
      const angle = 0.52 + Math.sin(timeSec * 0.17) * 0.34;
      this.camera.position.set(
        Math.sin(angle) * 6.4,
        1.85 + Math.sin(timeSec * 0.4) * 0.08,
        Math.cos(angle) * 6.4
      );
      this.camera.lookAt(-1.1, 1.18, -1.2);
      this.ghostAI.setTitleShowcasePose(timeSec);
      this.flashlight.viewGroup.visible = true;
      this.flashlight.spotLight.intensity = 6.2 + Math.sin(timeSec * 7.2) * 0.4;
      this.flashlight.beamMesh.visible = true;
      this.world.havanKund.update(timeSec, false, 0, false);
      return;
    }

    // Jumpscare close-up sequence
    if (this.phase === 'jumpscare') {
      this.jumpscareTimer += dt;
      _fwd.set(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
      this.ghostRig.root.position.copy(this.camera.position).addScaledVector(_fwd, 0.7);
      this.ghostRig.root.position.y = this.camera.position.y - 1.5 + (Math.random() - 0.5) * 0.09;
      this.ghostRig.root.lookAt(
        this.camera.position.x,
        this.ghostRig.root.position.y,
        this.camera.position.z
      );
      this.ghostRig.headGroup.rotation.z = (Math.random() - 0.5) * 0.78;
      this.flashlight.spotLight.intensity = Math.random() > 0.35 ? 16 : 0.8;

      if (this.jumpscareTimer >= 1.4) {
        this.phase = 'gameover';
        this.releasePointerLock();
        this.audio.setTension(0, false);
        this.emitHud();
      } else {
        this.hudThrottle += dt;
        if (this.hudThrottle > 0.05) {
          this.hudThrottle = 0;
          this.emitHud();
        }
      }
      return;
    }

    // Movie-Like 8.5s Victory Shanti Cinematic Sequence (Sweeping Orbit + Sunrise Gold + Ascension)
    if (this.phase === 'victory') {
      this.shantiProgress = Math.min(1, this.shantiProgress + dt / 8.5);
      const p = this.shantiProgress;

      this.ghostAI.update(
        dt,
        timeSec,
        this.playerPos,
        this.camera.quaternion,
        false,
        false,
        false,
        false,
        DIFFICULTY_CONFIGS[this.difficulty]
      );
      this.world.havanKund.update(timeSec, false, p, false);

      // Transform the cold cursed night into a radiant golden dawn across the entire haveli!
      this.hemiLight.color.lerp(new THREE.Color(0xffe09c), dt * 0.75);
      this.hemiLight.intensity = THREE.MathUtils.damp(this.hemiLight.intensity, 1.85, 1.4, dt);
      this.moonLight.color.lerp(new THREE.Color(0xffd478), dt * 0.75);
      this.moonLight.intensity = THREE.MathUtils.damp(this.moonLight.intensity, 2.3, 1.4, dt);
      if (this.scene.background instanceof THREE.Color) {
        this.scene.background.lerp(new THREE.Color(0x281a0c), dt * 0.55);
      }
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.lerp(new THREE.Color(0x2c1d0d), dt * 0.6);
        this.scene.fog.density = THREE.MathUtils.damp(this.scene.fog.density, 0.028, 1.1, dt);
      }

      // Sweeping 135-degree cinematic crane dolly orbit tracking the bride's peaceful ascent!
      const orbitAngle = -0.35 + p * 2.25;
      const radius = 4.6 + Math.sin(p * Math.PI * 0.85) * 2.1;
      const camY = 1.45 + p * 2.15;
      this.camera.position.set(
        Math.sin(orbitAngle) * radius,
        camY,
        Math.cos(orbitAngle) * radius
      );
      const targetLookY = 1.35 + Math.pow(p, 1.25) * 3.1;
      this.camera.lookAt(0, targetLookY, 0);

      this.flashlight.viewGroup.visible = false;
      this.flashlight.spotLight.intensity = 0;
      this.hudThrottle += dt;
      if (this.hudThrottle > 0.08) {
        this.hudThrottle = 0;
        this.emitHud();
      }
      return;
    }

    if (this.phase !== 'playing' && this.phase !== 'climax') {
      this.world.havanKund.update(timeSec, false, 0, false);
      return;
    }

    // =========================================================
    // ACTIVE GAMEPLAY & CLIMAX SIMULATION
    // =========================================================
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    this.elapsedSeconds += dt;
    this.timeSinceProgress += dt;
    const inGracePeriod = this.elapsedSeconds < config.spawnGracePeriod && this.phase === 'playing';

    this.templeBellTimer -= dt;
    if (this.templeBellTimer <= 0) {
      this.audio.playTempleBell(0.36);
      this.templeBellTimer = 24 + Math.random() * 18;
    }

    if (!this.hintActive && this.phase === 'playing' && this.timeSinceProgress >= config.hintDelay) {
      this.hintActive = true;
      this.audio.playTempleBell(0.75);
    }

    // Update Chapter-specific 3D animations & aura rings
    if (this.currentChapter === 1) {
      for (const diya of this.world.shrineDiyas) {
        const mat = diya.auraRing.material as THREE.MeshBasicMaterial;
        if (diya.lit) {
          mat.opacity = 0;
          const flick = 0.85 + Math.sin(timeSec * 15 + diya.position.x) * 0.2;
          diya.flameMesh.scale.set(1, flick, 1);
          if (diya.light) diya.light.intensity = 1.8 * flick;
        } else {
          mat.opacity = 0.26 + Math.sin(timeSec * 3.8 + diya.position.z) * 0.14;
        }
      }
    } else if (this.currentChapter === 2) {
      for (const note of this.world.notes) {
        const mat = note.auraRing.material as THREE.MeshBasicMaterial;
        mat.opacity = note.read ? 0 : 0.28 + Math.sin(timeSec * 4.2 + note.position.x) * 0.14;
      }
    } else if (this.currentChapter === 3) {
      for (const bell of this.world.chapterBells) {
        if (Math.abs(bell.swingVelocity) > 0.01 || Math.abs(bell.swingAngle) > 0.005) {
          bell.swingVelocity -= bell.swingAngle * 14 * dt;
          bell.swingVelocity *= Math.pow(0.28, dt);
          bell.swingAngle += bell.swingVelocity * dt;
          bell.bellPivot.rotation.z = bell.swingAngle;
        }
        const mat = bell.auraRing.material as THREE.MeshBasicMaterial;
        if (bell.rung) {
          mat.opacity = 0;
        } else if (bell.orderIndex === this.chapter3NextBellIndex) {
          mat.color.setHex(0xffc857);
          mat.opacity = 0.42 + Math.sin(timeSec * 5.2) * 0.18;
        } else {
          mat.color.setHex(0x6c8c94);
          mat.opacity = 0.12;
        }
      }
    } else if (this.currentChapter === 4) {
      for (const seal of this.world.cursedSeals) {
        const mat = seal.auraRing.material as THREE.MeshBasicMaterial;
        if (seal.broken) {
          mat.opacity = 0;
        } else {
          seal.talismanMesh.rotation.y = timeSec * 1.8;
          seal.talismanMesh.position.y = 1.62 + Math.sin(timeSec * 3.2 + seal.position.x) * 0.08;
          mat.opacity = 0.32 + Math.sin(timeSec * 4.8) * 0.16;
          if (seal.light) {
            seal.light.intensity = 1.55 + Math.sin(timeSec * 7 + seal.position.z) * 0.35;
          }
        }
      }
    } else if (this.currentChapter === 5) {
      let nearestUncollectedId: RitualItemId | null = null;
      let nearestUncollectedDist = Infinity;
      for (const item of this.world.ritualItems) {
        if (item.flameMesh) {
          const s = 0.85 + Math.sin(timeSec * 16) * 0.18;
          item.flameMesh.scale.set(1, s, 1);
        }
        if (!item.collected) {
          const d = Math.hypot(this.playerPos.x - item.position.x, this.playerPos.z - item.position.z);
          if (d < nearestUncollectedDist) {
            nearestUncollectedDist = d;
            nearestUncollectedId = item.id;
          }
        }
      }
      for (const item of this.world.ritualItems) {
        const mat = item.auraRing.material as THREE.MeshBasicMaterial;
        const shouldGlow =
          !item.collected &&
          ((this.hintActive && item.id === nearestUncollectedId) ||
            nearestUncollectedDist < 4.5 ||
            this.difficulty === 'normal');
        const baseOp = this.hintActive && item.id === nearestUncollectedId ? 0.36 : 0.14;
        mat.opacity = shouldGlow ? baseOp + Math.sin(timeSec * 3.8) * 0.12 : 0;
      }
    }

    // Movement + Stamina
    let moveForward = 0;
    let moveRight = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveForward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveForward -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveRight += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveRight -= 1;

    moveForward += this.touchInput.moveY;
    moveRight += this.touchInput.moveX;

    const wantsSprint =
      (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchInput.sprint) &&
      (Math.abs(moveForward) > 0.1 || Math.abs(moveRight) > 0.1) &&
      !this.hidingAlmirah;

    const isSprinting = wantsSprint && this.stamina > 2;
    if (isSprinting) {
      this.stamina = Math.max(0, this.stamina - config.staminaDrainPerSec * dt);
    } else {
      this.stamina = Math.min(100, this.stamina + config.staminaRegenPerSec * dt);
    }

    let isMoving = false;
    const roomNow = this.world.getRoomName(this.playerPos.x, this.playerPos.z);
    if (!this.hidingAlmirah) {
      const mag = Math.hypot(moveForward, moveRight);
      if (mag > 0.05) {
        isMoving = true;
        const clampedMag = Math.min(1, mag);
        const nf = (moveForward / mag) * clampedMag;
        const nr = (moveRight / mag) * clampedMag;

        _fwd.set(-Math.sin(this.playerYaw), 0, -Math.cos(this.playerYaw));
        _right.set(Math.cos(this.playerYaw), 0, -Math.sin(this.playerYaw));
        _move.set(0, 0, 0).addScaledVector(_fwd, nf).addScaledVector(_right, nr);

        const speed = isSprinting ? config.playerSprintSpeed : config.playerWalkSpeed;
        this.playerPos.addScaledVector(_move, speed * dt);
        this.world.resolvePlayerCollision(this.playerPos, 0.34);

        this.walkBobPhase += dt * (isSprinting ? 13.5 : 8.5);
        this.footstepCooldown -= dt;
        if (this.footstepCooldown <= 0) {
          this.audio.playFootstep(isSprinting, roomNow === 'Central Aangan');
          this.footstepCooldown = isSprinting ? 0.3 : 0.46;
          if (isSprinting && !inGracePeriod) {
            this.ghostAI.notifyNoise(this.playerPos, config.hearingRange);
          }
        }
      }
    }

    // Dynamic Player Breathing & Panicked Panting Audio
    this.breathTimer -= dt;
    if (this.breathTimer <= 0) {
      const panic = Math.max(this.proximityIntensity, (100 - this.stamina) / 110);
      if (panic > 0.22 || isSprinting || this.hidingAlmirah) {
        this.audio.playPlayerBreath(panic, isSprinting || this.stamina < 30, this.hidingAlmirah !== null);
      }
      this.breathTimer = isSprinting || panic > 0.65 ? 0.62 : this.hidingAlmirah ? 1.15 : 1.75;
    }

    const bobY = isMoving
      ? Math.sin(this.walkBobPhase) * (isSprinting ? 0.055 : 0.03)
      : Math.sin(timeSec * 1.8) * 0.006;
    const baseHeight = this.hidingAlmirah ? 1.54 : 1.65;
    this.camera.position.set(this.playerPos.x, baseHeight + bobY, this.playerPos.z);

    const shakeAmp = this.proximityIntensity > 0.55 ? (this.proximityIntensity - 0.55) * 0.025 : 0;
    _euler.set(
      this.playerPitch + (Math.random() - 0.5) * shakeAmp,
      this.playerYaw + (Math.random() - 0.5) * shakeAmp,
      isMoving ? Math.cos(this.walkBobPhase * 0.5) * 0.012 : 0,
      'YXZ'
    );
    this.camera.quaternion.setFromEuler(_euler);

    // Flashlight battery & proximity flickering
    if (this.flashlightOn) {
      this.battery = Math.max(0, this.battery - config.batteryDrainPerSec * dt);
      if (this.battery <= 0) {
        this.flashlightOn = false;
        this.audio.playFlashlightClick();
      }
    } else {
      this.battery = Math.min(100, this.battery + 0.65 * dt);
    }

    this.flashlight.viewGroup.visible = !this.hidingAlmirah;
    this.flashlight.viewGroup.position.set(
      0.28 + (isMoving ? Math.cos(this.walkBobPhase * 0.5) * 0.014 : 0),
      -0.22 + (isMoving ? Math.abs(Math.sin(this.walkBobPhase * 0.5)) * 0.016 : 0),
      -0.44
    );

    if (this.flashlightOn && !this.hidingAlmirah) {
      let flicker = 1.0;
      if (this.proximityIntensity > 0.34) {
        const harsh = Math.sin(timeSec * 48) * Math.sin(timeSec * 17.3);
        const cutoutChance = (this.proximityIntensity - 0.34) * 0.62;
        flicker = Math.random() < cutoutChance ? 0.1 : 0.58 + Math.abs(harsh) * 0.55;
      }
      const lowBatFactor = this.battery < 18 ? 0.55 + (this.battery / 18) * 0.45 : 1;
      this.flashlight.spotLight.intensity = 8.0 * flicker * lowBatFactor;
      this.flashlight.beamMesh.visible = flicker > 0.25;
      this.flashlight.lensMat.emissiveIntensity = 1.5 * flicker;
    } else {
      this.flashlight.spotLight.intensity = 0;
      this.flashlight.beamMesh.visible = false;
      this.flashlight.lensMat.emissiveIntensity = 0.05;
    }

    // Update Ghost AI (scaled by current Chapter intensity)
    const climaxActive = this.phase === 'climax';
    const chapterConfig = this.getChapterScaledConfig();
    const ghostRes = this.ghostAI.update(
      dt,
      timeSec,
      this.playerPos,
      this.camera.quaternion,
      this.flashlightOn && !this.hidingAlmirah,
      this.hidingAlmirah !== null,
      climaxActive,
      inGracePeriod,
      chapterConfig
    );

    this.proximityIntensity = THREE.MathUtils.damp(
      this.proximityIntensity,
      ghostRes.proximityIntensity,
      4.5,
      dt
    );

    if (ghostRes.justStartedChase && !climaxActive) {
      this.audio.playPlayerGasp();
    }

    if (ghostRes.escapedChase) {
      this.jumpscaresSurvived += 1;
      this.audio.playPlayerReaction('escape');
    }

    // Heartbeat BPM (72 -> 180)
    const targetBpm =
      72 +
      Math.round(this.proximityIntensity * 96) +
      (climaxActive ? 14 : 0) +
      (isSprinting ? 8 : 0);
    this.bpm = THREE.MathUtils.damp(this.bpm, Math.min(180, targetBpm), 3.2, dt);
    const roundedBpm = Math.round(this.bpm);
    if (roundedBpm > this.maxBpm) this.maxBpm = roundedBpm;

    this.heartbeatTimer -= dt;
    if (this.heartbeatTimer <= 0 && this.proximityIntensity > 0.14) {
      this.audio.playHeartbeat(this.proximityIntensity);
      this.heartbeatTimer = 60 / Math.max(72, this.bpm);
    }

    this.audio.setTension(this.proximityIntensity, climaxActive);

    const kundBeacon =
      (this.currentChapter === 5 &&
        (this.holdingItem !== null || (this.hintActive && this.placedItems.length < 4))) ||
      (this.currentChapter === 2 &&
        this.world.notes.every((n) => n.read) &&
        !this.chapter2Decoded);
    this.world.havanKund.update(timeSec, climaxActive, 0, kundBeacon);

    // Catch check -> Jumpscare!
    if (ghostRes.caughtPlayer) {
      this.phase = 'jumpscare';
      this.jumpscareTimer = 0;
      this.maxBpm = Math.max(this.maxBpm, 180);
      this.bpm = 180;
      this.audio.playJumpscare();
      this.emitHud();
      return;
    }

    // Final Ritual Climax Countdown
    if (climaxActive) {
      this.climaxRemaining = Math.max(0, this.climaxRemaining - dt);
      if (this.climaxRemaining <= 0) {
        this.phase = 'victory';
        this.shantiProgress = 0;
        this.hidingAlmirah = null;
        this.releasePointerLock();
        this.ghostAI.position.set(0, 0, 0);
        this.ghostRig.root.position.set(0, 0.7, 0);
        this.playerPos.set(0, 1.65, 5.2);
        this.camera.position.copy(this.playerPos);
        this.ghostAI.triggerShanti();
        this.audio.setTension(0, false);
        this.emitHud();
        return;
      }
    }

    this.hudThrottle += dt;
    if (this.hudThrottle >= 0.065) {
      this.hudThrottle = 0;
      this.emitHud();
    }
  }

  private getChapterProgress(): number {
    if (this.currentChapter === 1) {
      return this.world.shrineDiyas.filter((d) => d.lit).length;
    }
    if (this.currentChapter === 2) {
      return this.world.notes.filter((n) => n.read).length + (this.chapter2Decoded ? 1 : 0);
    }
    if (this.currentChapter === 3) {
      return this.chapter3NextBellIndex;
    }
    if (this.currentChapter === 4) {
      return this.world.cursedSeals.filter((s) => s.broken).length;
    }
    return this.placedItems.length;
  }

  private buildObjectiveText(): string {
    if (this.phase === 'climax') {
      return `Survive the Final Havan (${Math.ceil(this.climaxRemaining)}s)`;
    }
    if (this.currentChapter === 1) {
      const lit = this.world.shrineDiyas.filter((d) => d.lit).length;
      const rem = this.world.shrineDiyas.length - lit;
      return `Light ${rem} Extinguished Shrine ${rem === 1 ? 'Diya' : 'Diyas'} (${lit}/5)`;
    }
    if (this.currentChapter === 2) {
      const read = this.world.notes.filter((n) => n.read).length;
      if (read < this.world.notes.length) {
        return `Inspect 1984 Diary Clues across the Haveli (${read}/4 Read)`;
      }
      return 'Return to Central Havan Kund to decode Pandit ji’s Mantra';
    }
    if (this.currentChapter === 3) {
      const nextBell = this.world.chapterBells[this.chapter3NextBellIndex];
      return nextBell
        ? `Ring ${nextBell.label} (${this.chapter3NextBellIndex}/4)`
        : 'All Sacred Bells Rung!';
    }
    if (this.currentChapter === 4) {
      const broken = this.world.cursedSeals.filter((s) => s.broken).length;
      return `Find & Shatter Crimson Cursed Seals (${broken}/4 Broken)`;
    }
    if (this.holdingItem) {
      return `Offer ${RITUAL_ITEMS[this.holdingItem].name} to the Courtyard Havan Kund`;
    }
    const remaining = 4 - this.placedItems.length;
    return `Find ${remaining} Sacred Ritual ${remaining === 1 ? 'Item' : 'Items'} (${this.placedItems.length}/4 Placed)`;
  }

  private buildHintMessage(): string | null {
    if (!this.hintActive || this.phase !== 'playing') return null;
    if (this.currentChapter === 1) {
      const nextDiya = this.world.shrineDiyas.find((d) => !d.lit);
      return nextDiya ? `An unlit Shrine Diya awaits in the ${nextDiya.room}...` : null;
    }
    if (this.currentChapter === 2) {
      const nextNote = this.world.notes.find((n) => !n.read);
      if (nextNote) return `An unread 1984 clue lies in the ${nextNote.data.room}...`;
      return 'All 4 clues found — return to the Central Aangan Havan Kund!';
    }
    if (this.currentChapter === 3) {
      const nextBell = this.world.chapterBells[this.chapter3NextBellIndex];
      return nextBell ? `Ring the next hanging brass bell in the ${nextBell.room}...` : null;
    }
    if (this.currentChapter === 4) {
      const nextSeal = this.world.cursedSeals.find((s) => !s.broken);
      return nextSeal ? `A crimson Tantrik seal pulses inside the ${nextSeal.room}...` : null;
    }
    if (this.holdingItem) {
      return 'Temple bell echoes from the Central Aangan — return to the Havan Kund.';
    }
    const uncollected = this.world.ritualItems.find((r) => !r.collected);
    if (!uncollected) return null;
    return `A faint temple bell chimes from the ${uncollected.room}...`;
  }

  private buildMinimapData(): MinimapData {
    const objectives: MinimapObjective[] = [];

    if (this.currentChapter === 1) {
      for (const d of this.world.shrineDiyas) {
        if (!d.lit) {
          objectives.push({ id: d.id, x: d.position.x, z: d.position.z, label: 'Diya', kind: 'diya' });
        }
      }
    } else if (this.currentChapter === 2) {
      const unread = this.world.notes.filter((n) => !n.read);
      if (unread.length > 0) {
        for (const n of unread) {
          objectives.push({
            id: n.data.id,
            x: n.position.x,
            z: n.position.z,
            label: 'Clue',
            kind: 'note',
          });
        }
      } else if (!this.chapter2Decoded) {
        objectives.push({
          id: 'kund_decode',
          x: 0,
          z: 0,
          label: 'Havan Kund',
          kind: 'kund',
          urgent: true,
        });
      }
    } else if (this.currentChapter === 3) {
      const nextBell = this.world.chapterBells[this.chapter3NextBellIndex];
      if (nextBell) {
        objectives.push({
          id: nextBell.id,
          x: nextBell.position.x,
          z: nextBell.position.z,
          label: `Bell ${nextBell.orderIndex + 1}`,
          kind: 'bell',
          urgent: true,
        });
      }
    } else if (this.currentChapter === 4) {
      for (const s of this.world.cursedSeals) {
        if (!s.broken) {
          objectives.push({
            id: s.id,
            x: s.position.x,
            z: s.position.z,
            label: 'Seal',
            kind: 'seal',
            urgent: true,
          });
        }
      }
    } else if (this.currentChapter === 5) {
      if (this.holdingItem) {
        objectives.push({
          id: 'kund_offer',
          x: 0,
          z: 0,
          label: 'Havan Kund',
          kind: 'kund',
          urgent: true,
        });
      } else {
        for (const item of this.world.ritualItems) {
          if (!item.collected) {
            objectives.push({
              id: item.id,
              x: item.position.x,
              z: item.position.z,
              label: RITUAL_ITEMS[item.id].name,
              kind: 'item',
            });
          }
        }
      }
    }

    const ghostDist = Math.hypot(
      this.playerPos.x - this.ghostAI.position.x,
      this.playerPos.z - this.ghostAI.position.z
    );

    return {
      playerX: this.playerPos.x,
      playerZ: this.playerPos.z,
      playerYaw: this.playerYaw,
      ghostX: this.ghostAI.position.x,
      ghostZ: this.ghostAI.position.z,
      ghostYaw: this.ghostAI.yaw,
      ghostRoom: this.world.getRoomName(this.ghostAI.position.x, this.ghostAI.position.z),
      ghostDistance: Math.round(ghostDist),
      objectives,
      almirahs: this.world.almirahs.map((a) => ({
        id: a.id,
        x: a.root.position.x,
        z: a.root.position.z,
      })),
    };
  }

  public emitHud(): void {
    const prompt = this.getCurrentPrompt();
    const collectedCount = this.world.ritualItems.filter((r) => r.collected).length;
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    const chapterMeta = CHAPTER_CONFIGS[this.currentChapter];
    const graceRemaining =
      this.phase === 'playing'
        ? Math.max(0, Math.ceil(config.spawnGracePeriod - this.elapsedSeconds))
        : 0;

    this.onHudUpdate({
      phase: this.phase,
      chapter: this.currentChapter,
      chapterProgress: this.getChapterProgress(),
      chapterTarget: chapterMeta.targetCount,
      chapterTaskLabel: chapterMeta.taskLabel,
      itemsCollectedCount: collectedCount,
      itemsPlacedCount: this.placedItems.length,
      placedItems: [...this.placedItems],
      holdingItem: this.holdingItem ? RITUAL_ITEMS[this.holdingItem] : null,
      stamina: Math.round(this.stamina),
      battery: Math.round(this.battery),
      flashlightOn: this.flashlightOn,
      bpm: Math.round(this.bpm),
      maxBpm: this.maxBpm,
      isHiding: this.hidingAlmirah !== null,
      nearPrompt: prompt.text,
      promptKey: prompt.key,
      roomName: this.world.getRoomName(this.playerPos.x, this.playerPos.z),
      climaxRemaining: this.climaxRemaining,
      elapsedSeconds: this.elapsedSeconds,
      jumpscaresSurvived: this.jumpscaresSurvived,
      hintMessage: this.buildHintMessage(),
      proximityIntensity: this.proximityIntensity,
      subtitle: this.subtitle,
      activeNote: this.activeNote,
      pointerLocked: this.pointerLocked,
      ghostState: this.ghostAI.state,
      jumpscareFlash: this.phase === 'jumpscare' ? Math.max(0, 1 - this.jumpscareTimer * 0.85) : 0,
      shantiProgress: this.shantiProgress,
      objectiveText: this.buildObjectiveText(),
      graceRemaining,
      mapData: this.buildMinimapData(),
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);

    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('blur', this.boundBlur);
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('orientationchange', this.boundOrientationChange);
    window.visualViewport?.removeEventListener('resize', this.boundResize);
    document.removeEventListener('visibilitychange', this.boundVisibilityChange);
    document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.boundContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.boundContextRestored);

    this.releasePointerLock();
    this.audio.dispose();
    this.textures.dispose();
    if (this.envRT) this.envRT.dispose();

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
