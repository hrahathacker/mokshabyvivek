import React from 'react';
import {
  Pause,
  Flashlight,
  FlashlightOff,
  Flame,
  Activity,
  ShieldCheck,
  Music,
  Maximize,
  Minimize,
} from 'lucide-react';
import {
  CHAPTER_CONFIGS,
  DIFFICULTY_CONFIGS,
  Difficulty,
  HudSnapshot,
  VictorySongLyric,
} from '../game/types';
import { formatTime } from '../game/reportCard';
import { HaveliMinimap } from './HaveliMinimap';

interface GameHudProps {
  hud: HudSnapshot;
  difficulty: Difficulty;
  isTouchDevice: boolean;
  isFullscreen?: boolean;
  mapExpanded: boolean;
  victoryLyric?: VictorySongLyric | null;
  onPause: () => void;
  onRequestLock: () => void;
  onToggleMap: () => void;
  onToggleFullscreen?: () => void;
  onSkipVictoryCutscene?: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  difficulty,
  isTouchDevice,
  isFullscreen = false,
  mapExpanded,
  victoryLyric = null,
  onPause,
  onRequestLock,
  onToggleMap,
  onToggleFullscreen,
  onSkipVictoryCutscene,
}) => {
  const climaxTotal = DIFFICULTY_CONFIGS[difficulty].climaxDuration;
  const chapterMeta = CHAPTER_CONFIGS[hud.chapter];
  const isDanger = hud.bpm >= 125 || hud.phase === 'climax';
  const isCritical = hud.bpm >= 150 || hud.proximityIntensity > 0.68;

  const vignetteAlpha = Math.min(0.82, hud.proximityIntensity * 0.72);
  const chromaticOffset =
    hud.proximityIntensity > 0.35 ? Math.round((hud.proximityIntensity - 0.35) * 9) : 0;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none select-none overflow-hidden">
      {/* 1. Proximity Terror Crimson Vignette */}
      {vignetteAlpha > 0.04 && (
        <div
          className="absolute inset-0 transition-opacity duration-150"
          style={{
            opacity: vignetteAlpha,
            background:
              'radial-gradient(circle at center, transparent 42%, rgba(138, 12, 20, 0.58) 82%, rgba(86, 4, 10, 0.92) 100%)',
          }}
        />
      )}

      {/* 2. Subtle Chromatic Aberration Edge Frame during intense proximity */}
      {chromaticOffset > 0 && (
        <div
          className="absolute inset-0"
          style={{
            boxShadow: `inset ${chromaticOffset}px 0 26px rgba(220, 38, 38, 0.28), inset -${chromaticOffset}px 0 26px rgba(34, 211, 238, 0.22)`,
          }}
        />
      )}

      {/* 3. Wooden Almirah Slatted Peek Frame when hiding */}
      {hud.isHiding && (
        <div className="absolute inset-0 flex flex-col justify-between">
          <div className="h-[20%] bg-[#070504]/95 border-b border-[#2c1c12]" />
          <div className="flex-1 flex flex-col justify-around py-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-4 sm:h-6 bg-[#0c0806]/92 border-y border-[#2a1b12]/70" />
            ))}
          </div>
          <div className="h-[20%] bg-[#070504]/95 border-t border-[#2c1c12]" />
          <div className="absolute inset-y-0 left-0 w-[8%] bg-[#070504]/95 border-r border-[#2c1c12]" />
          <div className="absolute inset-y-0 right-0 w-[8%] bg-[#070504]/95 border-l border-[#2c1c12]" />
        </div>
      )}

      {/* 4. Jumpscare Distorted Strobe Flash */}
      {hud.phase === 'jumpscare' && (
        <div
          className="absolute inset-0 animate-jumpscare"
          style={{
            background:
              hud.jumpscareFlash > 0.5
                ? 'radial-gradient(circle, rgba(255,220,210,0.45) 0%, rgba(160,12,20,0.85) 100%)'
                : 'radial-gradient(circle, transparent 20%, rgba(120,6,12,0.8) 100%)',
          }}
        />
      )}

      {/* 5. Movie-Like Shanti Golden Sunrise & Widescreen Letterbox Cutscene */}
      {hud.phase === 'victory' && hud.shantiProgress < 0.98 && (
        <>
          <div
            className="absolute inset-0 transition-opacity duration-700"
            style={{
              opacity: Math.min(0.62, 0.14 + hud.shantiProgress * 0.52),
              background:
                'radial-gradient(circle at 50% 44%, rgba(255, 232, 160, 0.52) 0%, rgba(235, 165, 58, 0.18) 54%, rgba(16, 10, 4, 0.5) 100%)',
            }}
          />

          <div
            className="absolute top-0 inset-x-0 bg-[#050403] transition-all duration-700"
            style={{ height: hud.shantiProgress > 0.04 ? '8.5dvh' : '0dvh' }}
          />
          <div
            className="absolute bottom-0 inset-x-0 bg-[#050403] transition-all duration-700"
            style={{ height: hud.shantiProgress > 0.04 ? '10.5dvh' : '0dvh' }}
          />

          {hud.shantiProgress >= 0.48 && (
            <div className="absolute inset-x-0 top-[11dvh] flex flex-col items-center text-center px-6">
              <p className="text-[10px] sm:text-xs tracking-[0.32em] uppercase text-[#f4c974] font-medium">
                1984 Curse Broken · Moksha Achieved
              </p>
              <h2
                className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-[0.14em] text-[#fff6df] mt-1"
                style={{ textShadow: '0 4px 28px rgba(242, 176, 62, 0.55)' }}
              >
                आत्मा को शांति मिली
              </h2>
              <p className="font-display italic text-xs sm:text-base text-[#f1d39b] mt-0.5">
                “Atma Ko Shanti Mili”
              </p>
            </div>
          )}

          {onSkipVictoryCutscene && (
            <button
              type="button"
              onClick={onSkipVictoryCutscene}
              className="pointer-events-auto absolute z-20 px-3 py-1 rounded-sm border border-[#e5a94c]/45 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#e7cf9d] hover:text-white hover:border-[#e5a94c] transition-colors cursor-pointer"
              style={{
                bottom: 'max(8px, var(--sab))',
                right: 'max(14px, var(--sar))',
                backgroundColor: 'rgba(12, 10, 6, 0.88)',
              }}
            >
              Continue →
            </button>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* TOP BAR HUD: OBJECTIVE (LEFT) · CLIMAX (CENTER) · BPM (RIGHT) */}
      {/* ======================================================== */}
      {(hud.phase === 'playing' || hud.phase === 'climax') && (
        <>
          <div
            className="absolute flex items-start justify-between gap-2"
            style={{
              top: 'max(8px, var(--sat))',
              left: 'max(10px, var(--sal))',
              right: 'max(10px, var(--sar))',
            }}
          >
            {/* Top-Left: Chapter, Task Progress & Inline Stamina/Torch on Mobile Landscape */}
            <div
              className={`rounded-sm border border-white/10 ${
                isTouchDevice
                  ? 'px-2.5 py-1.5 max-w-[218px]'
                  : 'px-3.5 py-2.5 max-w-xs sm:max-w-sm'
              }`}
              style={{ backgroundColor: 'rgba(6, 12, 14, 0.8)' }}
            >
              <div className="flex items-center justify-between gap-2 text-[9px] sm:text-[10px] tracking-[0.14em] text-[#e5a94c] uppercase font-medium">
                <span className="truncate">
                  Ch {hud.chapter}/5 · {chapterMeta.title}
                </span>
                <span className="font-mono-tabular text-[#b8c6c7] shrink-0">
                  {formatTime(hud.elapsedSeconds)}
                </span>
              </div>

              <div className="mt-0.5 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#e5a94c] shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-[#f3ece0] font-mono-tabular truncate">
                  {hud.chapterTaskLabel}: {hud.chapterProgress}/{hud.chapterTarget}
                </span>
              </div>

              <p className="mt-0.5 text-[10px] sm:text-xs text-[#c7bdb0] leading-tight line-clamp-2">
                {hud.holdingItem
                  ? `Carrying: ${hud.holdingItem.name} → Havan Kund`
                  : hud.objectiveText}
              </p>

              {/* Compact inline Stamina & Torch bars on Android landscape (zero overlap with Left Joystick!) */}
              {isTouchDevice && (
                <div className="mt-1.5 pt-1.5 border-t border-white/10 grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[9px] text-[#9ab0b2]">
                      <span>Stamina</span>
                      <span className="font-mono-tabular text-[#d7e0e0]">{hud.stamina}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/12 overflow-hidden">
                      <div
                        className="h-full bg-[#74b0b8] transition-transform duration-75 origin-left"
                        style={{ transform: `scaleX(${hud.stamina / 100})` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[9px] text-[#9ab0b2]">
                      <span>Torch</span>
                      <span className="font-mono-tabular text-[#d7e0e0]">{hud.battery}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/12 overflow-hidden">
                      <div
                        className="h-full transition-transform duration-75 origin-left"
                        style={{
                          backgroundColor: hud.battery < 20 ? '#d94d4d' : '#e5a94c',
                          transform: `scaleX(${hud.battery / 100})`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isTouchDevice && (
                <div className="mt-1 text-[10px] tracking-[0.14em] text-[#8ea5a8] uppercase">
                  {hud.roomName}
                </div>
              )}

              {hud.graceRemaining > 0 && hud.phase === 'playing' && (
                <div className="mt-1 pt-1 border-t border-white/10 flex items-center gap-1 text-[10px] text-[#7cc6d1] font-mono-tabular">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>Safe start: {Math.ceil(hud.graceRemaining)}s</span>
                </div>
              )}

              {hud.hintMessage && (
                <p className="mt-1 pt-1 border-t border-white/10 text-[10px] sm:text-xs italic text-[#f2c46d] leading-snug">
                  {hud.hintMessage}
                </p>
              )}
            </div>

            {/* Top-Right: Heartbeat BPM Panic Meter + Fullscreen + Pause */}
            <div className="flex items-start gap-1.5 sm:gap-2">
              <div
                className={`${
                  isTouchDevice ? 'px-2.5 py-1.5 gap-2' : 'px-3.5 py-2 gap-3'
                } rounded-sm border flex items-center`}
                style={{
                  backgroundColor: 'rgba(6, 12, 14, 0.82)',
                  borderColor: isCritical
                    ? 'rgba(225, 68, 68, 0.65)'
                    : isDanger
                      ? 'rgba(232, 162, 60, 0.45)'
                      : 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <Activity
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"
                  style={{
                    color: isCritical ? '#ef5350' : isDanger ? '#f0a944' : '#8cb3b8',
                  }}
                />
                <div className="text-right">
                  <div
                    className={`font-mono-tabular font-bold leading-none ${
                      isTouchDevice ? 'text-sm' : 'text-lg sm:text-xl'
                    }`}
                    style={{
                      color: isCritical ? '#ff6b6b' : isDanger ? '#f5b95b' : '#ebe4d6',
                    }}
                  >
                    {hud.bpm}{' '}
                    <span className="text-[9px] sm:text-[11px] font-normal tracking-wider text-[#8fa4a6]">
                      BPM
                    </span>
                  </div>
                  <div className="text-[8px] sm:text-[10px] tracking-[0.12em] uppercase text-[#889d9f] mt-0.5">
                    {hud.isHiding
                      ? hud.flashlightOn
                        ? 'TORCH OFF!'
                        : 'HIDDEN'
                      : isCritical
                        ? 'SHE IS NEAR'
                        : isDanger
                          ? 'PULSE UP'
                          : 'HEART'}
                  </div>
                </div>
              </div>

              {onToggleFullscreen && (
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  className={`pointer-events-auto ${
                    isTouchDevice ? 'w-9 h-9' : 'w-11 h-11'
                  } rounded-sm border border-white/15 flex items-center justify-center text-[#dce3e3] hover:text-[#f4c66c] hover:border-[#e5a94c]/60 transition-colors cursor-pointer`}
                  style={{ backgroundColor: 'rgba(6, 12, 14, 0.82)' }}
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen landscape'}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Landscape'}
                >
                  {isFullscreen ? (
                    <Minimize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onPause}
                className={`pointer-events-auto ${
                  isTouchDevice ? 'w-9 h-9' : 'w-11 h-11'
                } rounded-sm border border-white/15 flex items-center justify-center text-[#dce3e3] hover:text-[#f4c66c] hover:border-[#e5a94c]/60 transition-colors cursor-pointer`}
                style={{ backgroundColor: 'rgba(6, 12, 14, 0.82)' }}
                aria-label="Pause game"
              >
                <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* TOP-CENTER: FINAL RITUAL COUNTDOWN */}
          {hud.phase === 'climax' && (
            <div
              className={`absolute left-1/2 -translate-x-1/2 rounded-sm border border-[#e5a94c]/70 text-center ${
                isTouchDevice ? 'px-3.5 py-1.5 min-w-[168px]' : 'px-5 py-2.5 min-w-[230px]'
              }`}
              style={{
                top: 'max(8px, var(--sat))',
                backgroundColor: 'rgba(24, 10, 6, 0.88)',
              }}
            >
              <div className="text-[9px] sm:text-[11px] tracking-[0.2em] uppercase text-[#f3bd60] font-semibold">
                Final Ritual · Survive
              </div>
              <div className="font-mono-tabular text-xl sm:text-3xl font-bold text-[#fff1d0] leading-tight">
                {hud.climaxRemaining.toFixed(1)}s
              </div>
              <div className="mt-1 h-1.5 w-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-[#f0a236] transition-transform duration-75 origin-left"
                  style={{
                    transform: `scaleX(${Math.max(0, Math.min(1, hud.climaxRemaining / Math.max(1, climaxTotal)))})`,
                  }}
                />
              </div>
            </div>
          )}

          {/* CENTER CROSSHAIR & INTERACTION PROMPT */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {!hud.isHiding && (
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: hud.nearPrompt ? '#f3bd60' : 'rgba(232, 226, 213, 0.55)',
                  boxShadow: hud.nearPrompt ? '0 0 10px rgba(243,189,96,0.9)' : 'none',
                }}
              />
            )}

            {hud.nearPrompt && (
              <div
                className="mt-4 px-3.5 py-1.5 rounded-sm border border-[#e5a94c]/55 text-xs sm:text-sm text-[#f7efe2] flex items-center gap-2 max-w-[60vw]"
                style={{ backgroundColor: 'rgba(8, 14, 16, 0.86)' }}
              >
                {hud.promptKey && (
                  <span className="font-mono-tabular font-bold text-[#f3bd60] px-1.5 py-0.5 border border-[#e5a94c]/50 text-[11px]">
                    {isTouchDevice ? 'USE' : hud.promptKey}
                  </span>
                )}
                <span className="truncate">{hud.nearPrompt}</span>
              </div>
            )}

            {!isTouchDevice && !hud.pointerLocked && (
              <button
                type="button"
                onClick={onRequestLock}
                className="pointer-events-auto mt-10 px-4 py-2 rounded-sm border border-white/20 text-xs tracking-wider uppercase text-[#d8e0e0] hover:border-[#e5a94c]/60 hover:text-[#f5cb78] transition-colors cursor-pointer"
                style={{ backgroundColor: 'rgba(6, 12, 14, 0.84)' }}
              >
                Click anywhere to lock mouse & look around
              </button>
            )}
          </div>

          {/* DESKTOP BOTTOM-LEFT: STAMINA & FLASHLIGHT STATUS (touch devices have inline bars in top-left card) */}
          {!isTouchDevice && (
            <div
              className="absolute bottom-5 left-5 px-3.5 py-2.5 rounded-sm border border-white/10 space-y-2 w-56"
              style={{ backgroundColor: 'rgba(6, 12, 14, 0.78)' }}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#9ab0b2]">
                  <span>Stamina</span>
                  <span className="font-mono-tabular text-[#d7e0e0]">{hud.stamina}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#74b0b8] transition-transform duration-75 origin-left"
                    style={{ transform: `scaleX(${hud.stamina / 100})` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#9ab0b2]">
                  <span className="flex items-center gap-1.5">
                    {hud.flashlightOn ? (
                      <Flashlight className="w-3.5 h-3.5 text-[#f2be63]" />
                    ) : (
                      <FlashlightOff className="w-3.5 h-3.5 text-[#7c8e90]" />
                    )}
                    <span>Torch {hud.flashlightOn ? 'ON' : 'OFF'}</span>
                  </span>
                  <span className="font-mono-tabular text-[#d7e0e0]">{hud.battery}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full transition-transform duration-75 origin-left"
                    style={{
                      backgroundColor: hud.battery < 20 ? '#d94d4d' : '#e5a94c',
                      transform: `scaleX(${hud.battery / 100})`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* LIVE HAVELI SPIRIT MAP */}
          <HaveliMinimap
            mapData={hud.mapData}
            ghostState={hud.ghostState}
            isTouchDevice={isTouchDevice}
            expanded={mapExpanded}
            onToggleExpanded={onToggleMap}
          />
        </>
      )}

      {/* ======================================================== */}
      {/* ATMOSPHERIC HINDI / HINGLISH GHOST & PLAYER SUBTITLES    */}
      {/* ======================================================== */}
      {hud.subtitle && (hud.phase === 'playing' || hud.phase === 'climax') && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 text-center ${
            isTouchDevice ? 'bottom-3 max-w-[48vw] px-2' : 'bottom-10 max-w-md w-[90vw] px-5'
          }`}
        >
          <div
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-sm border"
            style={{
              backgroundColor: 'rgba(6, 10, 12, 0.86)',
              borderColor:
                hud.subtitle.speaker === 'player'
                  ? 'rgba(116, 184, 196, 0.35)'
                  : 'rgba(198, 72, 76, 0.35)',
            }}
          >
            {hud.subtitle.speaker === 'player' && (
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#7cc4cf] mb-0.5">
                You Whispered
              </p>
            )}
            <p
              className="text-[10px] sm:text-xs tracking-wide"
              style={{
                color: hud.subtitle.speaker === 'player' ? '#9bc2c8' : '#c78b8e',
              }}
            >
              {hud.subtitle.hindi}
            </p>
            <p className="font-display italic text-xs sm:text-lg text-[#f5efe4] mt-0.5 leading-snug">
              “{hud.subtitle.hinglish}”
            </p>
          </div>
        </div>
      )}

      {/* LIVE MOVIE SUBTITLES & MOKSHA GEET LYRICS DURING GOLDEN SHANTI CUTSCENE */}
      {hud.phase === 'victory' && hud.shantiProgress < 0.98 && (
        <div className="absolute bottom-[12dvh] left-1/2 -translate-x-1/2 px-4 text-center max-w-lg w-[84vw]">
          <div
            className="px-4 py-2 sm:px-5 sm:py-3 rounded-sm border border-[#eab354]/45"
            style={{ backgroundColor: 'rgba(12, 10, 6, 0.88)' }}
          >
            <div className="flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-[#e8b458] mb-0.5">
              <Music className="w-3 h-3" />
              <span>
                {hud.shantiProgress < 0.25
                  ? 'Act I · Agni Ka Tej'
                  : hud.shantiProgress < 0.55
                    ? 'Act II · Shraap Se Mukti'
                    : 'Moksha Geet · Swarg Ki Aur'}
              </span>
            </div>
            {hud.shantiProgress < 0.25 ? (
              <>
                <p className="text-[11px] sm:text-sm text-[#e7cf9d]">
                  अग्नि का तेज फैला... 1984 के सारे बंधन टूट रहे हैं...
                </p>
                <p className="font-display italic text-xs sm:text-lg text-[#fff4de] mt-0.5">
                  “Agni ka tej faila... 1984 ke saare bandhan toot rahe hain...”
                </p>
              </>
            ) : hud.shantiProgress < 0.52 ? (
              <>
                <p className="text-[11px] sm:text-sm text-[#e7cf9d]">
                  धन्यवाद... अब मुझे शांति मिली... मेरी पायल अब थम गई...
                </p>
                <p className="font-display italic text-xs sm:text-lg text-[#fff4de] mt-0.5">
                  “Dhanyavaad... ab mujhe shanti mili... meri payal ab tham gayi...”
                </p>
              </>
            ) : victoryLyric ? (
              <>
                <p className="text-[11px] sm:text-sm text-[#e7cf9d]">{victoryLyric.hindi}</p>
                <p className="font-display italic text-xs sm:text-lg text-[#fff4de] mt-0.5">
                  “{victoryLyric.hinglish}”
                </p>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
