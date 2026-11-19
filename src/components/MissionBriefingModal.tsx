import React from 'react';
import { ShieldCheck, Play, X, Map as MapIcon } from 'lucide-react';
import {
  CHAPTER_CONFIGS,
  ChapterNumber,
  DIFFICULTY_CONFIGS,
  Difficulty,
} from '../game/types';

interface MissionBriefingModalProps {
  mode: 'pregame' | 'guide';
  chapter: ChapterNumber;
  difficulty: Difficulty;
  isTouchDevice: boolean;
  onConfirm: () => void;
}

export const MissionBriefingModal: React.FC<MissionBriefingModalProps> = ({
  mode,
  chapter,
  difficulty,
  isTouchDevice,
  onConfirm,
}) => {
  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const chapterMeta = CHAPTER_CONFIGS[chapter];
  const allChapters = ([1, 2, 3, 4, 5] as ChapterNumber[]).map((n) => CHAPTER_CONFIGS[n]);

  return (
    <div
      className="fixed inset-0 z-35 flex items-center justify-center safe-pad p-2.5 sm:p-4 overflow-y-auto pointer-events-auto"
      style={{ backgroundColor: 'rgba(4, 8, 10, 0.92)' }}
    >
      <div
        className="w-full max-w-3xl max-h-[94dvh] flex flex-col rounded-sm border border-[#e5a94c]/40 my-auto"
        style={{ backgroundColor: '#091114' }}
      >
        {/* Scrollable Inner Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5 sm:space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2.5">
            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-[#e5a94c] font-medium">
                Chapter {chapter} of 5 · {diffConfig.label}
              </p>
              <h2 className="font-display text-lg sm:text-2xl font-bold text-[#f4ede0] tracking-wide">
                {chapterMeta.title}{' '}
                <span className="text-xs sm:text-base font-normal text-[#c5a779]">
                  ({chapterMeta.hindiTitle})
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[#c6d1d2] leading-snug">
                {chapterMeta.briefingIntro}
              </p>
            </div>
            {mode === 'guide' && (
              <button
                type="button"
                onClick={onConfirm}
                className="p-1.5 text-[#9eb2b4] hover:text-white cursor-pointer shrink-0"
                aria-label="Close How to Play guide"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 4 Chapter-Specific Steps (2x2 compact grid in landscape) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {chapterMeta.steps.map((step) => (
              <div
                key={step.heading}
                className="p-2.5 sm:p-3 rounded-sm border border-white/10 bg-[#0d171a] space-y-1"
              >
                <div className="text-[11px] font-mono-tabular text-[#e5a94c]">{step.heading}</div>
                <p className="text-xs sm:text-sm text-[#e6dfd2] leading-snug">{step.detail}</p>
              </div>
            ))}
          </div>

          {/* 5-Chapter Campaign Roadmap Strip */}
          <div className="grid grid-cols-5 gap-1.5">
            {allChapters.map((ch) => {
              const active = ch.id === chapter;
              return (
                <div
                  key={ch.id}
                  className="p-2 rounded-sm border space-y-0.5"
                  style={{
                    backgroundColor: active ? 'rgba(184, 50, 43, 0.22)' : '#0b1417',
                    borderColor: active ? 'rgba(229, 169, 76, 0.65)' : 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="text-[9px] sm:text-[10px] font-mono-tabular uppercase text-[#e5a94c]">
                    Ch {ch.id}
                  </div>
                  <div className="text-[10px] sm:text-xs font-semibold text-[#f3e6cc] leading-tight truncate">
                    {ch.title}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Map & Controls Strip */}
          <div className="p-2.5 rounded-sm border border-[#6ea8b5]/25 bg-[#0c191d] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#b8ccce]">
            <div className="flex items-center gap-1.5">
              <MapIcon className="w-3.5 h-3.5 text-[#ff6b6b] shrink-0" />
              <span>Red diamond = Ghost · Amber dot = Task · Tap Radar to expand</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#7cc2cd]">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono-tabular text-[#e5c27b] whitespace-nowrap">
                {isTouchDevice ? 'Joystick · Swipe · Use · Torch' : 'WASD · Mouse · E · F · M'}
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Footer CTA so Enter button is ALWAYS reachable on short landscape phones */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-t border-white/10 bg-[#070e11] flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-[#8ea4a6] hidden sm:inline">
            Aaram se padh lijiye — button dabate hi Chapter {chapter} shuru hoga.
          </span>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-sm bg-[#b8322b] hover:bg-[#cf3c34] text-[#faf3e8] text-xs font-semibold uppercase tracking-[0.16em] transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {mode === 'pregame' ? `Enter Chapter ${chapter}` : 'Close Guide'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
