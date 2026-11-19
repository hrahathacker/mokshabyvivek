import { CHAPTER_CONFIGS, ChapterNumber, Difficulty } from './types';

export interface ReportCardStats {
  victory: boolean;
  chapter?: ChapterNumber;
  chapterProgress?: number;
  chapterTarget?: number;
  chapterTaskLabel?: string;
  elapsedSeconds: number;
  difficulty: Difficulty;
  maxBpm: number;
  jumpscaresSurvived: number;
  itemsPlacedCount: number;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function getIndianRankTitle(stats: ReportCardStats): {
  title: string;
  tagline: string;
} {
  if (!stats.victory) {
    if (stats.elapsedSeconds < 45 || stats.itemsPlacedCount === 0) {
      return {
        title: 'Pehli Cheekh Mein Out',
        tagline: 'Payal ki aawaz sunte hi dil baith gaya...',
      };
    }
    if (stats.itemsPlacedCount >= 3) {
      return {
        title: 'Moksha Ke Kareeb',
        tagline: 'Bas ek kadam door the aakhiri havan se!',
      };
    }
    return {
      title: 'Haveli Ka Mehmaan',
      tagline: 'Andhere baramde mein torch jalana bhaari pad gaya.',
    };
  }

  if (stats.difficulty === 'nightmare') {
    return {
      title: 'Maha Tantrik',
      tagline: 'Nightmare mein bhi aatma ko shanti de di!',
    };
  }
  if (stats.elapsedSeconds < 140) {
    return {
      title: 'Asli Tantrik',
      tagline: 'Bina dare tezi se poora kiya aakhiri havan.',
    };
  }
  if (stats.jumpscaresSurvived >= 2) {
    return {
      title: 'Almirah Champion',
      tagline: 'Maut ko paas se chhukar wapas aaye!',
    };
  }
  return {
    title: 'Haveli Survivor',
    tagline: '1984 ki raat ko zinda paar kar liya.',
  };
}

export function buildWhatsAppChallengeText(stats: ReportCardStats): string {
  const rank = getIndianRankTitle(stats);
  const ch = stats.chapter ?? 5;
  const chName = CHAPTER_CONFIGS[ch].title;
  const progress = stats.chapterProgress ?? stats.itemsPlacedCount;
  const target = stats.chapterTarget ?? 4;
  const status = stats.victory
    ? `I completed all 5 chapters of MOKSHA: The Last Ritual in ${formatTime(stats.elapsedSeconds)} (${stats.difficulty.toUpperCase()})!`
    : `The haveli spirit caught me in Chapter ${ch} (${chName}) after ${formatTime(stats.elapsedSeconds)} (${progress}/${target})!`;

  return `${status}\nRank: ${rank.title}\nMax Heartbeat: ${stats.maxBpm} BPM\nClose Calls Survived: ${stats.jumpscaresSurvived}\n\nCan you survive the 1984 Indian Haveli and beat my score? Play MOKSHA: The Last Ritual!`;
}

/**
 * Renders a crisp 1080x1920 (Insta Story 9:16) Survivor Report Card onto an offscreen canvas
 * and returns a PNG data URL.
 */
export function generateReportCardDataUrl(stats: ReportCardStats): string {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const rank = getIndianRankTitle(stats);

  // Deep atmospheric moonlight teal to shadow charcoal background
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  if (stats.victory) {
    bg.addColorStop(0, '#071316');
    bg.addColorStop(0.5, '#0c181a');
    bg.addColorStop(1, '#1b1208');
  } else {
    bg.addColorStop(0, '#070e10');
    bg.addColorStop(0.55, '#130b0d');
    bg.addColorStop(1, '#26080b');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle diya glow halo in upper-middle
  const glow = ctx.createRadialGradient(width / 2, 540, 30, width / 2, 540, 480);
  if (stats.victory) {
    glow.addColorStop(0, 'rgba(245, 166, 52, 0.34)');
    glow.addColorStop(0.55, 'rgba(205, 120, 34, 0.1)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    glow.addColorStop(0, 'rgba(175, 24, 34, 0.36)');
    glow.addColorStop(0.55, 'rgba(110, 14, 24, 0.12)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Double ornamental temple border
  ctx.strokeStyle = stats.victory ? 'rgba(230, 178, 92, 0.55)' : 'rgba(195, 58, 62, 0.5)';
  ctx.lineWidth = 4;
  ctx.strokeRect(56, 56, width - 112, height - 112);
  ctx.strokeStyle = 'rgba(232, 226, 213, 0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(76, 76, width - 152, height - 152);

  // Corner brass flourishes
  const corners = [
    [76, 76],
    [width - 76, 76],
    [76, height - 76],
    [width - 76, height - 76],
  ];
  ctx.fillStyle = stats.victory ? '#e6b25c' : '#c83e42';
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Top Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9aa8a6';
  ctx.font = '600 28px "DM Sans", sans-serif';
  ctx.fillText('1984 HAVELI ARCHIVE  ·  SURVIVOR REPORT CARD', width / 2, 168);

  // Game Title
  ctx.fillStyle = '#f3ece0';
  ctx.font = '700 112px "Cinzel", Georgia, serif';
  ctx.fillText('MOKSHA', width / 2, 310);

  ctx.fillStyle = stats.victory ? '#eab354' : '#d84f53';
  ctx.font = '600 34px "Cinzel", Georgia, serif';
  ctx.fillText('THE LAST RITUAL', width / 2, 368);

  // Divider with small diya icon
  ctx.strokeStyle = 'rgba(232, 226, 213, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(190, 430);
  ctx.lineTo(485, 430);
  ctx.moveTo(595, 430);
  ctx.lineTo(890, 430);
  ctx.stroke();

  // Diya flame vector icon at center
  ctx.fillStyle = stats.victory ? '#ffbe4d' : '#df4848';
  ctx.beginPath();
  ctx.moveTo(540, 396);
  ctx.quadraticCurveTo(564, 428, 540, 446);
  ctx.quadraticCurveTo(516, 428, 540, 396);
  ctx.fill();

  // Outcome Heading
  ctx.fillStyle = stats.victory ? '#ffd584' : '#f16c70';
  ctx.font = '700 54px "Cinzel", Georgia, serif';
  ctx.fillText(
    stats.victory ? 'ATMA KO SHANTI MILI' : 'HAVELI NE NIGAL LIYA',
    width / 2,
    545
  );

  // Rank Showcase Box
  ctx.fillStyle = 'rgba(10, 16, 18, 0.72)';
  ctx.fillRect(128, 620, width - 256, 250);
  ctx.strokeStyle = stats.victory ? 'rgba(234, 179, 84, 0.45)' : 'rgba(216, 79, 83, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(128, 620, width - 256, 250);

  ctx.fillStyle = '#9aa8a6';
  ctx.font = '600 26px "DM Sans", sans-serif';
  ctx.fillText('TITLE EARNED', width / 2, 682);

  ctx.fillStyle = '#f8f2e4';
  ctx.font = '700 66px "Cinzel", Georgia, serif';
  ctx.fillText(rank.title, width / 2, 766);

  ctx.fillStyle = '#c4beb2';
  ctx.font = 'italic 30px "DM Sans", sans-serif';
  ctx.fillText(`"${rank.tagline}"`, width / 2, 830);

  // 2x2 Stats Grid
  const statRows: Array<{ label: string; value: string; accent?: string }> = [
    { label: 'COMPLETION TIME', value: formatTime(stats.elapsedSeconds) },
    { label: 'DIFFICULTY', value: stats.difficulty.toUpperCase() },
    {
      label: 'PEAK HEARTBEAT',
      value: `${stats.maxBpm} BPM`,
      accent: stats.maxBpm >= 145 ? '#ef5a5a' : '#eab354',
    },
    { label: 'CLOSE CALLS SURVIVED', value: `${stats.jumpscaresSurvived}` },
  ];

  const cardW = 392;
  const cardH = 215;
  const startX = 128;
  const startY = 940;
  const gap = 40;

  statRows.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = startX + col * (cardW + gap);
    const y = startY + row * (cardH + gap);

    ctx.fillStyle = 'rgba(13, 21, 24, 0.85)';
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = 'rgba(232, 226, 213, 0.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardW, cardH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#8e9e9c';
    ctx.font = '600 24px "DM Sans", sans-serif';
    ctx.fillText(item.label, x + cardW / 2, y + 66);

    ctx.fillStyle = item.accent ?? '#f3ece0';
    ctx.font = '700 62px "JetBrains Mono", monospace';
    ctx.fillText(item.value, x + cardW / 2, y + 150);
  });

  // Chapter & Task Progress Strip
  const chNum = stats.chapter ?? 5;
  const chTitle = CHAPTER_CONFIGS[chNum].title.toUpperCase();
  const prog = stats.chapterProgress ?? stats.itemsPlacedCount;
  const targ = stats.chapterTarget ?? 4;
  const taskLbl = (stats.chapterTaskLabel ?? 'RITUAL ITEMS').toUpperCase();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9aa8a6';
  ctx.font = '600 26px "DM Sans", sans-serif';
  ctx.fillText(`CH ${chNum}/5 · ${chTitle} · ${taskLbl}: ${prog}/${targ}`, width / 2, 1510);

  // Decorative ECG heartbeat line across bottom section
  ctx.strokeStyle = stats.victory ? 'rgba(234, 179, 84, 0.55)' : 'rgba(224, 72, 72, 0.65)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  const ecgY = 1615;
  ctx.moveTo(140, ecgY);
  ctx.lineTo(380, ecgY);
  ctx.lineTo(415, ecgY - 22);
  ctx.lineTo(445, ecgY + 18);
  ctx.lineTo(480, ecgY - 92);
  ctx.lineTo(520, ecgY + 66);
  ctx.lineTo(558, ecgY - 30);
  ctx.lineTo(592, ecgY);
  ctx.lineTo(940, ecgY);
  ctx.stroke();

  // Footer viral challenge line
  ctx.fillStyle = '#e8e2d5';
  ctx.font = '600 32px "DM Sans", sans-serif';
  ctx.fillText('Can you survive the 1984 Indian Haveli?', width / 2, 1745);

  ctx.fillStyle = '#7e8f8d';
  ctx.font = '500 24px "JetBrains Mono", monospace';
  ctx.fillText('#MokshaTheLastRitual  ·  #IndianHorrorGame', width / 2, 1805);

  return canvas.toDataURL('image/png');
}
