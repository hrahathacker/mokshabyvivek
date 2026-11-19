import * as THREE from 'three';

export interface ProceduralTexturePack {
  plasterColor: THREE.CanvasTexture;
  plasterBump: THREE.CanvasTexture;
  stoneColor: THREE.CanvasTexture;
  stoneBump: THREE.CanvasTexture;
  woodColor: THREE.CanvasTexture;
  woodBump: THREE.CanvasTexture;
  jaliColor: THREE.CanvasTexture;
  jaliAlpha: THREE.CanvasTexture;
  tapestryColor: THREE.CanvasTexture;
  grillColor: THREE.CanvasTexture;
  grillAlpha: THREE.CanvasTexture;
  sareeColor: THREE.CanvasTexture;
  sareeBump: THREE.CanvasTexture;
  ghostFaceColor: THREE.CanvasTexture;
  parchmentColor: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

// Deterministic pseudo-random generator for reproducible gritty textures
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
  return tex;
}

function generatePeelingPlaster(anisotropy: number): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const size = 512;
  const rand = mulberry32(1984);
  const [cCanvas, ctx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  // Underlying damp red-brown haveli brick layer
  ctx.fillStyle = '#3b241d';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#303030';
  bCtx.fillRect(0, 0, size, size);

  // Draw weathered thin Nanakshahi/Lakhori haveli bricks
  const brickH = 22;
  const brickW = 64;
  for (let row = 0; row < size / brickH + 1; row++) {
    const offset = (row % 2) * (brickW * 0.5);
    for (let col = -1; col < size / brickW + 2; col++) {
      const x = col * brickW + offset;
      const y = row * brickH;
      const tone = Math.floor(42 + rand() * 32);
      ctx.fillStyle = `rgb(${tone + 26}, ${Math.floor(tone * 0.7)}, ${Math.floor(tone * 0.52)})`;
      ctx.fillRect(x + 2, y + 2, brickW - 4, brickH - 4);
      bCtx.fillStyle = `rgb(${75 + Math.floor(rand() * 35)}, ${75 + Math.floor(rand() * 35)}, ${75 + Math.floor(rand() * 35)})`;
      bCtx.fillRect(x + 2, y + 2, brickW - 4, brickH - 4);
    }
  }

  // Aged lime plaster coat over most of the wall
  const plasterCanvas = document.createElement('canvas');
  plasterCanvas.width = size;
  plasterCanvas.height = size;
  const pCtx = plasterCanvas.getContext('2d')!;

  const grad = pCtx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#5a5a52');
  grad.addColorStop(0.5, '#726c5e');
  grad.addColorStop(0.85, '#4b493f');
  grad.addColorStop(1, '#2d312a');
  pCtx.fillStyle = grad;
  pCtx.fillRect(0, 0, size, size);

  // Grime, damp patches, and lime mottling
  for (let i = 0; i < 420; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 8 + rand() * 44;
    const dark = rand() > 0.45;
    pCtx.fillStyle = dark
      ? `rgba(22, 27, 24, ${0.06 + rand() * 0.14})`
      : `rgba(148, 138, 118, ${0.05 + rand() * 0.1})`;
    pCtx.beginPath();
    pCtx.arc(x, y, r, 0, Math.PI * 2);
    pCtx.fill();
  }

  // Punch irregular flaking holes to expose bricks beneath
  pCtx.globalCompositeOperation = 'destination-out';
  const peelCenters: Array<[number, number, number]> = [];
  for (let i = 0; i < 9; i++) {
    peelCenters.push([rand() * size, 90 + rand() * (size - 150), 26 + rand() * 58]);
  }
  for (const [cx, cy, radius] of peelCenters) {
    pCtx.beginPath();
    const steps = 18;
    for (let s = 0; s <= steps; s++) {
      const a = (s / steps) * Math.PI * 2;
      const rr = radius * (0.55 + rand() * 0.65);
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr * 0.82;
      if (s === 0) pCtx.moveTo(px, py);
      else pCtx.lineTo(px, py);
    }
    pCtx.closePath();
    pCtx.fillStyle = 'rgba(0,0,0,1)';
    pCtx.fill();
  }
  pCtx.globalCompositeOperation = 'source-over';

  // Draw plaster onto color canvas and high bump onto bump canvas
  ctx.drawImage(plasterCanvas, 0, 0);

  // Add subtle peeled-edge shadows around patches
  bCtx.save();
  bCtx.globalAlpha = 0.85;
  bCtx.fillStyle = '#cfcfcf';
  bCtx.fillRect(0, 0, size, size);
  bCtx.globalCompositeOperation = 'destination-out';
  for (const [cx, cy, radius] of peelCenters) {
    bCtx.beginPath();
    bCtx.arc(cx, cy, radius * 0.78, 0, Math.PI * 2);
    bCtx.fill();
  }
  bCtx.restore();

  // Cracks & vertical damp water streaks
  ctx.strokeStyle = 'rgba(18, 22, 20, 0.55)';
  bCtx.strokeStyle = 'rgba(20, 20, 20, 0.8)';
  for (let i = 0; i < 24; i++) {
    let x = rand() * size;
    let y = rand() * size;
    ctx.lineWidth = 0.8 + rand() * 1.4;
    bCtx.lineWidth = ctx.lineWidth;
    ctx.beginPath();
    bCtx.beginPath();
    ctx.moveTo(x, y);
    bCtx.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      x += (rand() - 0.5) * 32;
      y += rand() * 28;
      ctx.lineTo(x, y);
      bCtx.lineTo(x, y);
    }
    ctx.stroke();
    bCtx.stroke();
  }

  // Lower damp moss / moisture stain gradient
  const damp = ctx.createLinearGradient(0, size * 0.7, 0, size);
  damp.addColorStop(0, 'rgba(12, 20, 16, 0)');
  damp.addColorStop(1, 'rgba(10, 18, 14, 0.65)');
  ctx.fillStyle = damp;
  ctx.fillRect(0, size * 0.7, size, size * 0.3);

  return [
    finalizeTexture(cCanvas, true, anisotropy),
    finalizeTexture(bCanvas, false, anisotropy),
  ];
}

function generateStoneTiles(anisotropy: number): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const size = 512;
  const rand = mulberry32(4211);
  const [cCanvas, ctx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  // Dark mossy grout
  ctx.fillStyle = '#141a18';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#181818';
  bCtx.fillRect(0, 0, size, size);

  const grid = 4;
  const cell = size / grid;
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      const jitterX = (gy % 2) * (cell * 0.25);
      const x = ((gx * cell + jitterX) % size);
      const y = gy * cell;
      const base = 46 + Math.floor(rand() * 24);
      const r = base - 4 + Math.floor(rand() * 10);
      const g = base + 2 + Math.floor(rand() * 8);
      const b = base + 4 + Math.floor(rand() * 10);

      const drawTile = (ox: number) => {
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(ox + 3, y + 3, cell - 6, cell - 6);
        bCtx.fillStyle = `rgb(${155 + Math.floor(rand() * 45)}, ${155 + Math.floor(rand() * 45)}, ${155 + Math.floor(rand() * 45)})`;
        bCtx.fillRect(ox + 3, y + 3, cell - 6, cell - 6);

        // Stone grain speckles
        for (let i = 0; i < 65; i++) {
          const sx = ox + 4 + rand() * (cell - 8);
          const sy = y + 4 + rand() * (cell - 8);
          const sr = 1 + rand() * 5;
          ctx.fillStyle = rand() > 0.5 ? 'rgba(15, 22, 20, 0.24)' : 'rgba(130, 145, 140, 0.12)';
          ctx.fillRect(sx, sy, sr, sr);
        }
      };

      drawTile(x);
      if (x + cell > size) drawTile(x - size);
    }
  }

  // Damp moss creeping in cracks & wet puddles
  for (let i = 0; i < 70; i++) {
    const mx = rand() * size;
    const my = rand() * size;
    const mr = 6 + rand() * 22;
    ctx.fillStyle = `rgba(34, 52, 32, ${0.14 + rand() * 0.22})`;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
  }

  return [
    finalizeTexture(cCanvas, true, anisotropy),
    finalizeTexture(bCanvas, false, anisotropy),
  ];
}

function generateWeatheredWood(anisotropy: number): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const size = 512;
  const rand = mulberry32(9001);
  const [cCanvas, ctx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  ctx.fillStyle = '#2a1c14';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Plank seams
  const planks = 6;
  const pw = size / planks;
  for (let p = 0; p < planks; p++) {
    const px = p * pw;
    const shade = Math.floor(rand() * 14);
    ctx.fillStyle = `rgb(${38 + shade}, ${25 + Math.floor(shade * 0.7)}, ${17 + Math.floor(shade * 0.5)})`;
    ctx.fillRect(px + 1, 0, pw - 2, size);

    // Fine vertical wood grain fibers
    for (let i = 0; i < 90; i++) {
      const gx = px + 2 + rand() * (pw - 4);
      const dark = rand() > 0.38;
      ctx.fillStyle = dark ? 'rgba(14, 8, 5, 0.35)' : 'rgba(92, 64, 42, 0.22)';
      ctx.fillRect(gx, 0, 1 + rand() * 2, size);
      bCtx.fillStyle = dark ? 'rgba(40, 40, 40, 0.4)' : 'rgba(210, 210, 210, 0.35)';
      bCtx.fillRect(gx, 0, 1 + rand() * 1.5, size);
    }

    // Dark plank divider groove
    ctx.fillStyle = '#120b08';
    ctx.fillRect(px, 0, 2, size);
    bCtx.fillStyle = '#151515';
    bCtx.fillRect(px, 0, 3, size);
  }

  // Aged dust & water stain blotches
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(18, 22, 20, ${0.08 + rand() * 0.14})`;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 12 + rand() * 34, 0, Math.PI * 2);
    ctx.fill();
  }

  return [
    finalizeTexture(cCanvas, true, anisotropy),
    finalizeTexture(bCanvas, false, anisotropy),
  ];
}

function generateCarvedJali(anisotropy: number): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const size = 256;
  const [cCanvas, ctx] = makeCanvas(size, size);
  const [aCanvas, aCtx] = makeCanvas(size, size);

  ctx.fillStyle = '#4c463d';
  ctx.fillRect(0, 0, size, size);
  aCtx.fillStyle = '#ffffff';
  aCtx.fillRect(0, 0, size, size);

  // Outer carved frame
  ctx.strokeStyle = '#686053';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, size - 14, size - 14);

  // Lattice cutouts (diamond + Mughal arch grid)
  aCtx.fillStyle = '#000000';
  const cols = 4;
  const rows = 3;
  const cw = (size - 36) / cols;
  const ch = (size - 36) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = 18 + (c + 0.5) * cw;
      const cy = 18 + (r + 0.5) * ch;
      aCtx.beginPath();
      aCtx.moveTo(cx, cy - ch * 0.34);
      aCtx.lineTo(cx + cw * 0.32, cy);
      aCtx.lineTo(cx, cy + ch * 0.34);
      aCtx.lineTo(cx - cw * 0.32, cy);
      aCtx.closePath();
      aCtx.fill();

      ctx.strokeStyle = '#2d2924';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy - ch * 0.34);
      ctx.lineTo(cx + cw * 0.32, cy);
      ctx.lineTo(cx, cy + ch * 0.34);
      ctx.lineTo(cx - cw * 0.32, cy);
      ctx.closePath();
      ctx.stroke();
    }
  }

  return [
    finalizeTexture(cCanvas, true, anisotropy),
    finalizeTexture(aCanvas, false, anisotropy),
  ];
}

function generateFadedTapestry(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const rand = mulberry32(7711);
  const [canvas, ctx] = makeCanvas(size, size);

  ctx.fillStyle = '#3e2324';
  ctx.fillRect(0, 0, size, size);

  // Ornamental worn gold border
  ctx.strokeStyle = '#8b6d3b';
  ctx.lineWidth = 16;
  ctx.strokeRect(18, 18, size - 36, size - 36);
  ctx.strokeStyle = '#5c3f22';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, size - 72, size - 72);

  // Faded central mandala lotus motif
  ctx.save();
  ctx.translate(size / 2, size / 2);
  for (let ring = 0; ring < 3; ring++) {
    const petals = 12 + ring * 4;
    const rad = 52 + ring * 48;
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = ring % 2 === 0 ? 'rgba(155, 114, 58, 0.35)' : 'rgba(128, 42, 42, 0.45)';
      ctx.beginPath();
      ctx.ellipse(rad, 0, 22, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();

  // Age stains & damp wear
  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = `rgba(18, 14, 14, ${0.12 + rand() * 0.2})`;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 8 + rand() * 28, 0, Math.PI * 2);
    ctx.fill();
  }

  return finalizeTexture(canvas, true, anisotropy);
}

function generateRustedGrill(anisotropy: number): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const size = 256;
  const rand = mulberry32(3141);
  const [cCanvas, ctx] = makeCanvas(size, size);
  const [aCanvas, aCtx] = makeCanvas(size, size);

  ctx.fillStyle = '#2a2220';
  ctx.fillRect(0, 0, size, size);
  aCtx.fillStyle = '#000000';
  aCtx.fillRect(0, 0, size, size);

  // Outer frame + vertical/horizontal rusted iron bars
  aCtx.fillStyle = '#ffffff';
  aCtx.fillRect(0, 0, size, 16);
  aCtx.fillRect(0, size - 16, size, 16);
  aCtx.fillRect(0, 0, 16, size);
  aCtx.fillRect(size - 16, 0, 16, size);

  for (let i = 1; i <= 5; i++) {
    const x = (i / 6) * size - 5;
    aCtx.fillRect(x, 0, 10, size);
  }
  aCtx.fillRect(0, size * 0.5 - 6, size, 12);

  // Rust speckles on color map
  for (let i = 0; i < 250; i++) {
    ctx.fillStyle = rand() > 0.4 ? 'rgba(92, 42, 22, 0.55)' : 'rgba(26, 26, 28, 0.6)';
    ctx.fillRect(rand() * size, rand() * size, 4 + rand() * 14, 4 + rand() * 14);
  }

  return [
    finalizeTexture(cCanvas, true, anisotropy),
    finalizeTexture(aCanvas, false, anisotropy),
  ];
}

function generateMaroonSaree(anisotropy: number): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const size = 512;
  const rand = mulberry32(19840);
  const [cCanvas, ctx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  // Deep blood-maroon woven fabric matching reference images
  ctx.fillStyle = '#3d1016';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Vertical fabric folds & cloth weave
  for (let x = 0; x < size; x += 2) {
    const fold = Math.sin((x / size) * Math.PI * 18) * 18;
    const tone = Math.max(0, Math.min(255, Math.floor(128 + fold * 3)));
    bCtx.fillStyle = `rgb(${tone}, ${tone}, ${tone})`;
    bCtx.fillRect(x, 0, 2, size);

    ctx.fillStyle = fold > 0 ? `rgba(115, 28, 38, ${fold / 90})` : `rgba(16, 4, 6, ${-fold / 55})`;
    ctx.fillRect(x, 0, 2, size);
  }

  // Tarnished gold zari border along bottom hem
  const borderY = size - 88;
  ctx.fillStyle = '#7c622e';
  ctx.fillRect(0, borderY, size, 52);
  ctx.fillStyle = '#47151b';
  ctx.fillRect(0, borderY + 8, size, 36);
  ctx.fillStyle = '#9a7b3a';
  for (let x = 0; x < size; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x + 9, borderY + 12);
    ctx.lineTo(x + 16, borderY + 26);
    ctx.lineTo(x + 9, borderY + 40);
    ctx.lineTo(x + 2, borderY + 26);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#a28341';
  ctx.fillRect(0, borderY + 54, size, 6);

  // Grime, mud, and tattered discoloration near hem
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(14, 10, 10, ${0.15 + rand() * 0.28})`;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 8 + rand() * 30, 0, Math.PI * 2);
    ctx.fill();
  }

  return [
    finalizeTexture(cCanvas, true, anisotropy),
    finalizeTexture(bCanvas, false, anisotropy),
  ];
}

function generateGhostFace(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = makeCanvas(size, size);

  // Pale ash-grey gaunt corpse-like complexion
  const rad = ctx.createRadialGradient(128, 122, 18, 128, 128, 130);
  rad.addColorStop(0, '#a7afb0');
  rad.addColorStop(0.55, '#7e888a');
  rad.addColorStop(1, '#363f42');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, size, size);

  // Cheekbone hollow shadows
  ctx.fillStyle = 'rgba(18, 24, 28, 0.55)';
  ctx.beginPath();
  ctx.ellipse(82, 152, 22, 34, 0.35, 0, Math.PI * 2);
  ctx.ellipse(174, 152, 22, 34, -0.35, 0, Math.PI * 2);
  ctx.fill();

  // Deep sunken dark eye sockets (matching Reference 1)
  const drawSocket = (ex: number, ey: number) => {
    const g = ctx.createRadialGradient(ex, ey, 3, ex, ey, 24);
    g.addColorStop(0, '#040507');
    g.addColorStop(0.55, '#0e1114');
    g.addColorStop(1, 'rgba(20, 24, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 24, 19, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eerie pale pinpoint pupil reflection inside dark hollow eye
    ctx.fillStyle = 'rgba(220, 238, 240, 0.72)';
    ctx.beginPath();
    ctx.arc(ex, ey, 2.6, 0, Math.PI * 2);
    ctx.fill();
  };
  drawSocket(96, 108);
  drawSocket(160, 108);

  // Faint faded dark red bindi smudge on forehead
  ctx.fillStyle = 'rgba(110, 16, 22, 0.65)';
  ctx.beginPath();
  ctx.arc(128, 84, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Nose bridge shadow & nostrils
  ctx.strokeStyle = 'rgba(24, 28, 32, 0.65)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(124, 112);
  ctx.lineTo(121, 140);
  ctx.moveTo(132, 112);
  ctx.lineTo(135, 140);
  ctx.stroke();

  // Gaunt cracked dry lips
  ctx.fillStyle = '#251a1d';
  ctx.beginPath();
  ctx.ellipse(128, 174, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#080608';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(106, 174);
  ctx.quadraticCurveTo(128, 170, 150, 174);
  ctx.stroke();

  // Subtle dark forehead hair wisps
  ctx.strokeStyle = 'rgba(8, 8, 10, 0.78)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    const hx = 40 + i * 7.5;
    ctx.beginPath();
    ctx.moveTo(hx, 0);
    ctx.quadraticCurveTo(hx + (i % 2 === 0 ? -8 : 8), 38, hx + (i % 3 === 0 ? 5 : -5), 68 + (i % 4) * 8);
    ctx.stroke();
  }

  return finalizeTexture(canvas, true, anisotropy);
}

function generateParchment(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const rand = mulberry32(19841);
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.fillStyle = '#b9a37e';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(92, 68, 40, ${0.06 + rand() * 0.14})`;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 6 + rand() * 26, 0, Math.PI * 2);
    ctx.fill();
  }

  // Faint handwritten ink lines
  ctx.strokeStyle = 'rgba(42, 24, 18, 0.65)';
  ctx.lineWidth = 2;
  for (let row = 0; row < 8; row++) {
    const y = 38 + row * 24;
    ctx.beginPath();
    ctx.moveTo(24, y);
    for (let x = 28; x < size - 28; x += 12) {
      ctx.lineTo(x, y + (rand() - 0.5) * 4);
    }
    ctx.stroke();
  }

  return finalizeTexture(canvas, true, anisotropy);
}

function generateContactShadow(): THREE.CanvasTexture {
  const size = 128;
  const [canvas, ctx] = makeCanvas(size, size);
  const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  g.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  g.addColorStop(0.55, 'rgba(0, 0, 0, 0.34)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(renderer: THREE.WebGLRenderer): ProceduralTexturePack {
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const [plasterColor, plasterBump] = generatePeelingPlaster(aniso);
  const [stoneColor, stoneBump] = generateStoneTiles(aniso);
  const [woodColor, woodBump] = generateWeatheredWood(aniso);
  const [jaliColor, jaliAlpha] = generateCarvedJali(aniso);
  const tapestryColor = generateFadedTapestry(aniso);
  const [grillColor, grillAlpha] = generateRustedGrill(aniso);
  const [sareeColor, sareeBump] = generateMaroonSaree(aniso);
  const ghostFaceColor = generateGhostFace(aniso);
  const parchmentColor = generateParchment(aniso);
  const contactShadow = generateContactShadow();

  const all = [
    plasterColor,
    plasterBump,
    stoneColor,
    stoneBump,
    woodColor,
    woodBump,
    jaliColor,
    jaliAlpha,
    tapestryColor,
    grillColor,
    grillAlpha,
    sareeColor,
    sareeBump,
    ghostFaceColor,
    parchmentColor,
    contactShadow,
  ];

  return {
    plasterColor,
    plasterBump,
    stoneColor,
    stoneBump,
    woodColor,
    woodBump,
    jaliColor,
    jaliAlpha,
    tapestryColor,
    grillColor,
    grillAlpha,
    sareeColor,
    sareeBump,
    ghostFaceColor,
    parchmentColor,
    contactShadow,
    dispose: () => {
      all.forEach((t) => t.dispose());
    },
  };
}
