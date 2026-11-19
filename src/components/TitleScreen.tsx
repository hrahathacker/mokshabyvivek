import React, { useEffect } from 'react';
import { Volume2, VolumeX, Play, Flame, BookOpen, Check, Maximize, Minimize } from 'lucide-react';
import {
  CHAPTER_CONFIGS,
  ChapterNumber,
  DIFFICULTY_CONFIGS,
  Difficulty,
  GameSettings,
  GraphicsQuality,
} from '../game/types';
import { PWAInstallButton } from './PWAInstallButton';

interface TitleScreenProps {
  settings: GameSettings;
  selectedChapter: ChapterNumber;
  completedChapters: ChapterNumber[];
  isTouchDevice: boolean;
  isFullscreen?: boolean;
  onSelectChapter: (c: ChapterNumber) => void;
  onChangeDifficulty: (d: Difficulty) => void;
  onChangeQuality: (q: GraphicsQuality) => void;
  onChangeVolume: (v: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen?: () => void;
  onStart: () => void;
  onOpenGuide: () => void;
  keyboardDisabled?: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  settings,
  selectedChapter,
  completedChapters,
  isTouchDevice,
  isFullscreen = false,
  onSelectChapter,
  onChangeDifficulty,
  onChangeQuality,
  onChangeVolume,
  onToggleMute,
  onToggleFullscreen,
  onStart,
  onOpenGuide,
  keyboardDisabled = false,
}) => {
  useEffect(() => {
    if (keyboardDisabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart, keyboardDisabled]);

  const activeDiff = DIFFICULTY_CONFIGS[settings.difficulty];
  const activeChapter = CHAPTER_CONFIGS[selectedChapter];

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between overflow-y-auto pointer-events-auto">
      {/* Dark atmospheric gradient scrim leaving courtyard visibly haunting */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'linear-gradient(105deg, rgba(4, 9, 11, 0.9) 0%, rgba(5, 11, 13, 0.68) 52%, rgba(5, 10, 12, 0.45) 100%)',
        }}
      />

      {/* Subtle animated mist layer */}
      <div
        className="pointer-events-none fixed inset-0 animate-mist"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 72% 72%, rgba(92, 152, 162, 0.16) 0%, transparent 72%), radial-gradient(ellipse 45% 35% at 56% 62%, rgba(235, 146, 48, 0.12) 0%, transparent 70%)',
        }}
      />

      {/* Full-Viewport Landscape-Optimized Container (zero-scroll 2-column fit on Android phones!) */}
      <div className="relative z-10 flex flex-col justify-between min-h-full w-full max-w-6xl mx-auto safe-pad px-4 py-3 sm:px-6 sm:py-4 lg:px-10 lg:py-7 gap-3">
        {/* Top Utility Bar */}
        <div className="flex items-center justify-between gap-3 text-[11px] sm:text-xs tracking-[0.18em] text-[#9ab0b3] uppercase">
          <div className="flex items-center gap-2.5">
            <span>1984 · North India</span>
            <span className="hidden sm:inline text-[#607a7e]">·</span>
            <span className="hidden sm:inline text-[#d59d4a]">Offline Ready</span>
          </div>

          <div className="flex items-center gap-3">
            {onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="flex items-center gap-1.5 text-[#c8d4d4] hover:text-[#f0c06d] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen landscape'}
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleMute}
              className="flex items-center gap-1.5 text-[#c8d4d4] hover:text-[#f0c06d] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label={settings.muted ? 'Unmute audio' : 'Mute audio'}
            >
              {settings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{settings.muted ? 'Muted' : `${Math.round(settings.volume * 100)}%`}</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Landscape Grid (sm: triggers on >=640px — all landscape Android phones!) */}
        <div className="my-auto grid grid-cols-1 sm:grid-cols-12 gap-4 lg:gap-8 items-center">
          {/* LEFT COLUMN: Brand Emblem, Display Title & Primary Actions */}
          <div className="sm:col-span-6 space-y-3 lg:space-y-5">
            <div className="space-y-1.5 lg:space-y-2.5">
              <div className="flex items-center gap-2.5">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 40 40"
                  fill="none"
                  aria-hidden="true"
                  className="shrink-0 lg:w-9 lg:h-9"
                >
                  <path
                    d="M20 4C23.5 10.5 26 14.5 26 18.2C26 21.6 23.3 24 20 24C16.7 24 14 21.6 14 18.2C14 14.5 16.5 10.5 20 4Z"
                    fill="#E8A23C"
                  />
                  <path
                    d="M20 10C21.8 13.6 23 15.8 23 18C23 19.9 21.7 21.3 20 21.3C18.3 21.3 17 19.9 17 18C17 15.8 18.2 13.6 20 10Z"
                    fill="#FFF0C4"
                  />
                  <path
                    d="M7 25.5C9.2 31.2 14.1 34 20 34C25.9 34 30.8 31.2 33 25.5H7Z"
                    stroke="#C99848"
                    strokeWidth="1.8"
                    fill="rgba(201,152,72,0.16)"
                  />
                  <path d="M13 36H27" stroke="#C99848" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <span className="text-[10px] lg:text-xs tracking-[0.24em] text-[#e5a94c] font-medium uppercase">
                  3D Indian Survival Horror
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold tracking-[0.12em] text-[#f3ece0] leading-none">
                MOKSHA
              </h1>
              <p className="font-display text-sm sm:text-base lg:text-xl tracking-[0.26em] text-[#d59d4a] uppercase">
                The Last Ritual
              </p>
              <p className="text-xs lg:text-sm text-[#b4c2c4] max-w-md leading-relaxed">
                5 chapters of 1984 haveli survival horror — unique ritual tasks, live Ghost Radar
                Map, built-in Hindi backstory, and Moksha Geet finale.
              </p>
            </div>

            {/* Primary Play, Guide & Install App Buttons */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onStart}
                className="group inline-flex items-center justify-center gap-2.5 px-6 py-3 lg:px-8 lg:py-3.5 rounded-sm bg-[#b8322b] hover:bg-[#cf3c34] active:scale-[0.98] text-[#faf3e8] font-semibold tracking-[0.14em] uppercase text-xs lg:text-sm transition-all cursor-pointer border border-[#e37b68]/40 shadow-[0_0_24px_rgba(184,50,43,0.38)] whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Chapter {selectedChapter}</span>
              </button>

              <button
                type="button"
                onClick={onOpenGuide}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 lg:px-5 lg:py-3.5 rounded-sm border border-white/15 bg-[#0a1316]/85 hover:border-[#e5a94c]/60 text-[#e4ded2] hover:text-[#f5cb78] text-xs font-medium uppercase tracking-[0.12em] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>How to Play</span>
              </button>

              <PWAInstallButton compact={isTouchDevice} />
            </div>
          </div>

          {/* RIGHT COLUMN: Compact Campaign & Settings Panel */}
          <div
            className="sm:col-span-6 p-3.5 lg:p-5 rounded-sm border border-white/12 space-y-3 lg:space-y-4"
            style={{ backgroundColor: 'rgba(8, 15, 18, 0.84)' }}
          >
            {/* 5-Chapter Campaign Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] lg:text-xs text-[#8ea2a5]">
                <span>Campaign (5 Chapters)</span>
                <span className="text-[#f0c574] font-medium truncate">
                  Ch {selectedChapter}: {activeChapter.title}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {([1, 2, 3, 4, 5] as ChapterNumber[]).map((chNum) => {
                  const selected = selectedChapter === chNum;
                  const done = completedChapters.includes(chNum);
                  return (
                    <button
                      key={chNum}
                      type="button"
                      onClick={() => onSelectChapter(chNum)}
                      className={`py-1.5 lg:py-2 px-1 text-[11px] lg:text-xs font-medium rounded-sm border transition-colors cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
                        selected
                          ? 'bg-[#b8322b]/30 border-[#e06a62] text-[#fff1e2]'
                          : 'bg-[#0a1316]/85 border-white/10 text-[#9db0b2] hover:border-white/25 hover:text-[#e8e2d5]'
                      }`}
                    >
                      <span className="font-mono-tabular">Ch {chNum}</span>
                      {done && <Check className="w-3 h-3 text-[#74d19a] shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] lg:text-[11px] text-[#aebdc0] leading-snug truncate">
                Task: {activeChapter.shortTask}
              </p>
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] lg:text-xs text-[#8ea2a5]">
                <span>Difficulty</span>
                <span className="text-[#c9d4d4] truncate">{activeDiff.summary}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['normal', 'nightmare', 'speedrun'] as Difficulty[]).map((d) => {
                  const selected = settings.difficulty === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onChangeDifficulty(d)}
                      className={`py-1.5 lg:py-2 px-2 text-[11px] lg:text-xs font-medium rounded-sm border transition-colors cursor-pointer whitespace-nowrap ${
                        selected
                          ? 'bg-[#e5a94c]/18 border-[#e5a94c]/70 text-[#f8dfb0]'
                          : 'bg-[#0a1316]/80 border-white/10 text-[#9db0b2] hover:border-white/25 hover:text-[#e8e2d5]'
                      }`}
                    >
                      {DIFFICULTY_CONFIGS[d].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Graphics Quality & Volume Row */}
            <div className="grid grid-cols-2 gap-2.5 lg:gap-4">
              <div className="space-y-1">
                <span className="block text-[11px] lg:text-xs text-[#8ea2a5]">Graphics</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['high', 'low'] as GraphicsQuality[]).map((q) => {
                    const selected = settings.quality === q;
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => onChangeQuality(q)}
                        className={`py-1.5 px-2 text-[11px] font-medium rounded-sm border transition-colors cursor-pointer whitespace-nowrap ${
                          selected
                            ? 'bg-[#2a4a52]/40 border-[#6ea8b5]/70 text-[#e8f4f6]'
                            : 'bg-[#0a1316]/80 border-white/10 text-[#9db0b2] hover:border-white/25'
                        }`}
                      >
                        {q === 'high' ? 'High' : 'Low FPS+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] lg:text-xs text-[#8ea2a5]">
                  <label htmlFor="title-volume">Volume</label>
                  <span className="font-mono-tabular text-[#c9d4d4]">
                    {settings.muted ? '0%' : `${Math.round(settings.volume * 100)}%`}
                  </span>
                </div>
                <div className="flex items-center gap-2 h-[30px] lg:h-[34px] px-2.5 rounded-sm bg-[#0a1316]/80 border border-white/10">
                  <Flame className="w-3.5 h-3.5 text-[#e5a94c] shrink-0" />
                  <input
                    id="title-volume"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.muted ? 0 : settings.volume}
                    onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                    className="w-full accent-[#e5a94c] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Concise Flat Controls Footer */}
        <div className="pt-2 border-t border-white/10 text-[10px] sm:text-xs text-[#8fa3a6] flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {isTouchDevice ? (
            <>
              <span className="text-[#d7cfc2]">Left Joystick</span> Move
              <span aria-hidden="true">·</span>
              <span className="text-[#d7cfc2]">Swipe Right</span> Look
              <span aria-hidden="true">·</span>
              <span className="text-[#d7cfc2]">Use / Hide</span> Interact
              <span aria-hidden="true">·</span>
              <span className="text-[#d7cfc2]">Torch</span> Light
              <span aria-hidden="true">·</span>
              <span className="text-[#d7cfc2]">Tap Radar</span> Full Map
            </>
          ) : (
            <>
              <span className="text-[#d7cfc2]">WASD</span> Move
              <span aria-hidden="true">·</span>
              <span className="text-[#d7cfc2]">Mouse</span> Look
              <span aria-hidden="true">·</span>
              <span className="text-[#d7cfc2]">E</span> Collect / Place / Hide
              <span aria-hidden="true">·</span>
              <span className="text-[#d7cfc2]">F</span> Flashlight
              <span aria-hidden="true">·</span>
              <span className="text-[#d7cfc2]">M</span> Ghost Map
              <span aria-hidden="true">·</span>
              <span className="text-[#d7cfc2]">Shift</span> Sprint
              <span aria-hidden="true">·</span>
              <span className="text-[#d7cfc2]">Esc</span> Pause
            </>
          )}
        </div>
      </div>
    </div>
  );
};
