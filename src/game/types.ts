export type GamePhase =
  | 'title'
  | 'story'
  | 'briefing'
  | 'playing'
  | 'paused'
  | 'note'
  | 'climax'
  | 'chapter_complete'
  | 'victory'
  | 'jumpscare'
  | 'gameover';

export type ChapterNumber = 1 | 2 | 3 | 4 | 5;

export type Difficulty = 'normal' | 'nightmare' | 'speedrun';

export type GraphicsQuality = 'high' | 'low';

export type RitualItemId = 'kalash' | 'chunri' | 'diya' | 'samagri';

export type GhostAIState = 'patrol' | 'investigate' | 'chase' | 'search' | 'shanti';

export interface ChapterConfig {
  id: ChapterNumber;
  title: string;
  hindiTitle: string;
  shortTask: string;
  taskLabel: string;
  targetCount: number;
  ghostSpeedMult: number;
  briefingIntro: string;
  steps: Array<{ heading: string; detail: string }>;
  completionText: string;
}

export const CHAPTER_CONFIGS: Record<ChapterNumber, ChapterConfig> = {
  1: {
    id: 1,
    title: 'Andhere Ki Shuruwat',
    hindiTitle: 'अंधेरे की शुरुआत',
    shortTask: 'Light all 5 extinguished Shrine Diyas across the Haveli',
    taskLabel: 'Shrine Diyas Lit',
    targetCount: 5,
    ghostSpeedMult: 0.84,
    briefingIntro:
      'Haveli ke 5 pavitra mitti ke diye aatma ne bujha diye hain. Un sabhi ko dobara jalakar andhere ka parda todein.',
    steps: [
      {
        heading: '01. FIND 5 UNLIT SHRINE DIYAS',
        detail:
          'Aangan, Pooja Room, Master Bedroom, Old Kitchen aur Storeroom mein 5 bujhe diye rakhe hain. Map par peele (amber) nishan dekhein.',
      },
      {
        heading: '02. PRESS E TO LIGHT EACH DIYA',
        detail:
          'Har bujhe diye ke paas jaakar E dabayein. Sabhi 5 diye jalte hi Chapter 1 poora ho jayega.',
      },
      {
        heading: '03. TRACK THE GHOST ON THE MAP',
        detail:
          'Screen par bane Haveli Map mein laal (red) nishan bhoot ki asli location dikhata hai. Usse door rahkar aage badhein.',
      },
      {
        heading: '04. HIDE IN ALMIRAHS WHEN CLOSE',
        detail:
          'Agar payal ki aawaz paas aaye toh Torch band (F) karein aur lakdi ki Almirah mein E dabakar chhup jayein.',
      },
    ],
    completionText: 'Paanchon diye jal uthe hain... ab haveli ke 1984 ke purane raaz saamne aane lage hain.',
  },
  2: {
    id: 2,
    title: '1984 Ka Raaz',
    hindiTitle: '1984 का राज़',
    shortTask: 'Inspect 4 hidden 1984 Diary Clues, then decode at Havan Kund',
    taskLabel: 'Clues & Mantra',
    targetCount: 5,
    ghostSpeedMult: 0.94,
    briefingIntro:
      'Is shraap ko samajhne ke liye 1984 ke 4 chhupe hue khat (clues) padhein, phir Havan Kund par aakar Pandit ji ka mantra suljhayein.',
    steps: [
      {
        heading: '01. READ ALL 4 1984 LORE NOTES',
        detail:
          'Veranda, Pooja Room, Master Bedroom aur Old Kitchen mein chamakte hue 4 purane kagaz rakhe hain. E dabakar sabhi padhein.',
      },
      {
        heading: '02. BEWARE: READING ALERTS HER',
        detail:
          'Har purana khat padhte hi aatma us kamre ki taraf ghoomne aati hai. Map par uski location dekhkar surakshit rasta chunein.',
      },
      {
        heading: '03. DECODE MANTRA AT HAVAN KUND',
        detail:
          'Chaaron notes padhne ke baad beech wale Central Aangan ke Havan Kund par aakar E dabayein.',
      },
      {
        heading: '04. USE ALMIRAHS & CORRIDOR LOOPS',
        detail:
          'Haveli ke charon konon mein arched corridors hain — bhoot se bachne ke liye unse ghoomkar nikal sakte hain.',
      },
    ],
    completionText: '1984 ka poora sach samajh aa gaya... ab mandir ki ghantiyon se aatma ka krodh shaant karna hoga.',
  },
  3: {
    id: 3,
    title: 'Mandir Ki Ghantiyan',
    hindiTitle: 'मंदिर की घंटियाँ',
    shortTask: 'Ring 4 Hanging Temple Bells in exact sacred sequence (N → W → E → S)',
    taskLabel: 'Sacred Bells Rung',
    targetCount: 4,
    ghostSpeedMult: 1.0,
    briefingIntro:
      'Chaar pavitra peetal ki ghantiyan sahi kram (Pooja → Bedroom → Kitchen → Storeroom) mein bajani hain. Har ghanti ki goonj bhoot ko bula legi!',
    steps: [
      {
        heading: '01. FOLLOW THE EXACT SEQUENCE',
        detail:
          'Pehle Pooja Room (1), phir Master Bedroom (2), phir Old Kitchen (3), aur aakhir mein Storeroom (4) ki latakti ghanti bajayein.',
      },
      {
        heading: '02. RING & ESCAPE IMMEDIATELY',
        detail:
          'Ghanti bajate hi uski tez aawaz sunke aatma seedha usi kamre ki taraf daudegi! Turant almirah mein chhupein ya doosre corridor se bhaagein.',
      },
      {
        heading: '03. WATCH THE ACTIVE GOLD TARGET',
        detail:
          'Haveli Map par agli sahi ghanti chamak rahi hogi, aur kamre mein uske neeche sunehra ghera dikhega.',
      },
      {
        heading: '04. KEEP TORCH OFF WHILE HIDING',
        detail:
          'Almirah ke andar jaate hi Torch band (F) kar dein warna aatma roshni dekh legi.',
      },
    ],
    completionText: 'Chaaron ghantiyon ki pavitra goonj haveli mein fail gayi hai... ab kaale jaadu ke bandhan todne ka waqt hai.',
  },
  4: {
    id: 4,
    title: 'Bandhan Todna',
    hindiTitle: 'बंधन तोड़ना',
    shortTask: 'Find & shatter 4 Cursed Crimson Tantrik Seals binding the spirit',
    taskLabel: 'Cursed Seals Broken',
    targetCount: 4,
    ghostSpeedMult: 1.06,
    briefingIntro:
      'Chaar laal tantrik bandhan (Cursed Seals) dulhan ki aatma ko is haveli mein qaid kiye hue hain. Un sabhi ko dhoondh kar E se tod dein.',
    steps: [
      {
        heading: '01. LOCATE 4 CRIMSON SEALS',
        detail:
          'Pooja Room, Master Bedroom, Old Kitchen aur Storeroom ke konon mein laal chamakte tantrik seals lage hain.',
      },
      {
        heading: '02. SHATTER EACH SEAL WITH E',
        detail:
          'Har cursed seal ke paas jaakar E dabayein. Seal tootne par tez dhamaka hoga aur aatma bhadak uthegi!',
      },
      {
        heading: '03. OUTSMART THE ENRAGED SPIRIT',
        detail:
          'Seal todne ke baad live Ghost Map dekhein aur jab aatma us taraf aaye toh ulte raste se agle kamre mein jayein.',
      },
      {
        heading: '04. PREPARE FOR THE FINAL RITUAL',
        detail:
          'Chaaron bandhan toot-te hi Chapter 5 (Aakhiri Havan — MOKSHA) ka dwar khul jayega.',
      },
    ],
    completionText: 'Sabhi kaale bandhan toot chuke hain! Ab sirf Aakhiri Havan hi dulhan ki aatma ko Moksha dila sakta hai.',
  },
  5: {
    id: 5,
    title: 'Aakhiri Havan — MOKSHA',
    hindiTitle: 'आखिरी हवन — मोक्ष',
    shortTask: 'Offer 4 Sacred Ritual Items at Havan Kund & survive the Final Havan',
    taskLabel: 'Ritual Offerings',
    targetCount: 4,
    ghostSpeedMult: 1.1,
    briefingIntro:
      'Aakhiri adhyay! Chaaron pavitra samagri (Kalash, Chunri, Diya, Samagri) Havan Kund mein arpit karein aur aakhiri havan poora hone tak khud ko bachayein.',
    steps: [
      {
        heading: '01. COLLECT 4 SACRED OFFERINGS',
        detail:
          'Brass Kalash, Red Chunri, Glowing Brass Diya aur Havan Samagri Bowl chaaron kamron ke tables par rakhe hain. Ek baar mein ek uthayein (E).',
      },
      {
        heading: '02. OFFER AT CENTRAL HAVAN KUND',
        detail:
          'Har samagri ko Central Aangan ke Havan Kund par laakar E se arpit karein.',
      },
      {
        heading: '03. SURVIVE THE FINAL CLIMAX',
        detail:
          'Chauthi samagri rakhte hi Havan Kund jal uthega aur aatma aakhiri hamla karegi! Countdown khatam hone tak zinda rahein.',
      },
      {
        heading: '04. WITNESS MOKSHA & VICTORY SONG',
        detail:
          'Countdown poora hote hi sunehri roshni mein aatma ko shanti milegi aur game ka original Moksha Geet chalega!',
      },
    ],
    completionText: 'Aakhiri Havan sampann hua! Dulhan ki aatma ko sada ke liye Moksha aur Shanti mil gayi.',
  },
};

export interface MinimapObjective {
  id: string;
  x: number;
  z: number;
  label: string;
  kind: 'diya' | 'note' | 'bell' | 'seal' | 'item' | 'kund';
  urgent?: boolean;
}

export interface MinimapData {
  playerX: number;
  playerZ: number;
  playerYaw: number;
  ghostX: number;
  ghostZ: number;
  ghostYaw: number;
  ghostRoom: string;
  ghostDistance: number;
  objectives: MinimapObjective[];
  almirahs: Array<{ id: string; x: number; z: number }>;
}

export interface RitualItemMeta {
  id: RitualItemId;
  name: string;
  hindiName: string;
  description: string;
}

export interface LoreNoteData {
  id: string;
  title: string;
  date: string;
  body: string;
  room: string;
}

export interface SubtitleState {
  hindi: string;
  hinglish: string;
  speaker?: 'ghost' | 'player' | 'song';
  id: number;
}

export interface StoryChapter {
  heading: string;
  hindiQuote: string;
  narration: string;
  moodCue: string;
}

export interface AIStoryPayload {
  title: string;
  year: string;
  chapters: StoryChapter[];
}

export interface VictorySongLyric {
  timeSec: number;
  hindi: string;
  hinglish: string;
}

export interface VictorySongData {
  title: string;
  subtitle: string;
  lyrics: VictorySongLyric[];
  vocalAudioBase64?: string;
}

export interface GameSettings {
  difficulty: Difficulty;
  quality: GraphicsQuality;
  volume: number;
  muted: boolean;
}

export interface DifficultyConfig {
  label: string;
  summary: string;
  patrolSpeed: number;
  investigateSpeed: number;
  chaseSpeed: number;
  climaxSpeed: number;
  visionRangeDark: number;
  visionRangeLit: number;
  hearingRange: number;
  batteryDrainPerSec: number;
  climaxDuration: number;
  hintDelay: number;
  spawnGracePeriod: number;
  playerWalkSpeed: number;
  playerSprintSpeed: number;
  staminaDrainPerSec: number;
  staminaRegenPerSec: number;
}

export interface HudSnapshot {
  phase: GamePhase;
  chapter: ChapterNumber;
  chapterProgress: number;
  chapterTarget: number;
  chapterTaskLabel: string;
  itemsCollectedCount: number;
  itemsPlacedCount: number;
  placedItems: RitualItemId[];
  holdingItem: RitualItemMeta | null;
  stamina: number; // 0..100
  battery: number; // 0..100
  flashlightOn: boolean;
  bpm: number;
  maxBpm: number;
  isHiding: boolean;
  nearPrompt: string | null;
  promptKey: string;
  roomName: string;
  climaxRemaining: number;
  elapsedSeconds: number;
  jumpscaresSurvived: number;
  hintMessage: string | null;
  proximityIntensity: number; // 0..1
  subtitle: SubtitleState | null;
  activeNote: LoreNoteData | null;
  pointerLocked: boolean;
  ghostState: GhostAIState;
  jumpscareFlash: number; // 0..1
  shantiProgress: number; // 0..1
  objectiveText: string;
  graceRemaining: number;
  mapData: MinimapData;
}

export const RITUAL_ITEMS: Record<RitualItemId, RitualItemMeta> = {
  kalash: {
    id: 'kalash',
    name: 'Brass Kalash',
    hindiName: 'Peetal Kalash',
    description: 'Sacred brass vessel crowned with mango leaves and coconut.',
  },
  chunri: {
    id: 'chunri',
    name: 'Red Chunri',
    hindiName: 'Laal Chunri',
    description: 'Crimson ceremonial cloth edged with weathered gold zari.',
  },
  diya: {
    id: 'diya',
    name: 'Glowing Brass Diya',
    hindiName: 'Akhand Diya',
    description: 'Pedestal brass lamp burning with an unbroken flame.',
  },
  samagri: {
    id: 'samagri',
    name: 'Havan Samagri Bowl',
    hindiName: 'Havan Samagri',
    description: 'Stone bowl filled with dried herbs, camphor, and marigold.',
  },
};

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  normal: {
    label: 'Normal (Easy)',
    summary: 'Story-friendly survival horror: slower spirit, faster hints, fair escapes.',
    patrolSpeed: 1.5,
    investigateSpeed: 1.95,
    chaseSpeed: 2.85,
    climaxSpeed: 3.05,
    visionRangeDark: 5.5,
    visionRangeLit: 10.5,
    hearingRange: 7.5,
    batteryDrainPerSec: 0.16,
    climaxDuration: 10,
    hintDelay: 35,
    spawnGracePeriod: 12,
    playerWalkSpeed: 3.55,
    playerSprintSpeed: 5.9,
    staminaDrainPerSec: 15,
    staminaRegenPerSec: 22,
  },
  nightmare: {
    label: 'Nightmare',
    summary: 'Relentless spirit, razor-sharp senses, intense battery & stamina pressure.',
    patrolSpeed: 2.55,
    investigateSpeed: 3.25,
    chaseSpeed: 4.45,
    climaxSpeed: 4.65,
    visionRangeDark: 9.2,
    visionRangeLit: 17.5,
    hearingRange: 13.0,
    batteryDrainPerSec: 0.65,
    climaxDuration: 12,
    hintDelay: 70,
    spawnGracePeriod: 3,
    playerWalkSpeed: 3.35,
    playerSprintSpeed: 5.55,
    staminaDrainPerSec: 23,
    staminaRegenPerSec: 13,
  },
  speedrun: {
    label: 'Speedrun',
    summary: 'Fast sprint movement and brisk patrol tuned for record ritual times.',
    patrolSpeed: 2.25,
    investigateSpeed: 2.85,
    chaseSpeed: 4.05,
    climaxSpeed: 4.25,
    visionRangeDark: 7.8,
    visionRangeLit: 14.0,
    hearingRange: 10.5,
    batteryDrainPerSec: 0.28,
    climaxDuration: 12,
    hintDelay: 40,
    spawnGracePeriod: 4,
    playerWalkSpeed: 4.1,
    playerSprintSpeed: 6.5,
    staminaDrainPerSec: 14,
    staminaRegenPerSec: 24,
  },
};

export const LORE_NOTES: LoreNoteData[] = [
  {
    id: 'note_veranda',
    title: 'Warning — Haveli Watchman',
    date: '14 October 1984',
    room: 'Aangan Veranda',
    body: 'Raat 3 baje payal ki aawaz aaye toh torch band karke almirah mein chhup jana. Woh roshni dekh leti hai... aur daudne ki aawaz door se sun leti hai.',
  },
  {
    id: 'note_pooja',
    title: 'Pandit ji ke Aakhiri Nirdesh',
    date: '16 October 1984',
    room: 'Pooja Room',
    body: 'Is haveli ki bhatakti aatma ko bandhan se mukt karne ke liye chaaron pavitra cheezein — Brass Kalash, Red Chunri, Glowing Diya aur Havan Samagri — Aangan ke Havan Kund mein ek-ek karke arpit karni hongi.',
  },
  {
    id: 'note_bedroom',
    title: 'Torn Diary Page',
    date: '19 October 1984',
    room: 'Master Bedroom',
    body: 'Us raat dulhan ko isi kamre mein akela chhod diya gaya tha. Laal saree aur chandi ki payal... aaj bhi jab hawa rukti hai, lagta hai koi peechhe khada hai. Peechhe mat mudna.',
  },
  {
    id: 'note_kitchen',
    title: 'Scribbled Note by the Hearth',
    date: '21 October 1984',
    room: 'Old Kitchen',
    body: 'Chauthi aur aakhiri samagri rakhte hi Havan Kund mein agni bhadak uthegi. Aakhiri kuch second khud ko bacha lena... agni poori hote hi usey Moksha mil jayega.',
  },
];
