import React from 'react';
import { ArrowRight, RotateCcw, Home, CheckCircle2, Flame } from 'lucide-react';
import { CHAPTER_CONFIGS, ChapterNumber } from '../game/types';
import { formatTime } from '../game/reportCard';

interface ChapterCompleteModalProps {
  completedChapter: ChapterNumber;
  elapsedSeconds: number;
  maxBpm: number;
  jumpscaresSurvived: number;
  onNextChapter: () => void;
  onReplayChapter: () => void;
  onReturnTitle: () => void;
}

export const ChapterCompleteModal: React.FC<ChapterCompleteModalProps> = ({
  completedChapter,
  elapsedSeconds,
  maxBpm,
  jumpscaresSurvived,
  onNextChapter,
  onReplayChapter,
  onReturnTitle,
}) => {
  const finishedMeta = CHAPTER_CONFIGS[completedChapter];
  const nextNum = Math.min(5, completedChapter + 1) as ChapterNumber;
  const nextMeta = CHAPTER_CONFIGS[nextNum];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center safe-pad p-3 sm:p-5 overflow-y-auto pointer-events-auto"
      style={{ backgroundColor: 'rgba(6, 11, 10, 0.9)' }}
    >
      <div
        className="w-full max-w-3xl max-h-[94dvh] overflow-y-auto rounded-sm border border-[#e5a94c]/50 p-4 sm:p-6 my-auto space-y-4"
        style={{ backgroundColor: '#091114' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Left Column: Completed Chapter Summary & Stats */}
          <div className="sm:col-span-6 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[#eab354] font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Chapter {completedChapter} of 5 Complete</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-[#f5efe2] tracking-wide">
                {finishedMeta.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#c7bdb0] italic leading-relaxed">
                “{finishedMeta.completionText}”
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-sm bg-[#0d171a] border border-white/10">
                <div className="text-[9px] uppercase tracking-wider text-[#889d9f]">Time</div>
                <div className="font-mono-tabular text-base font-bold text-[#f3ece0] mt-0.5">
                  {formatTime(elapsedSeconds)}
                </div>
              </div>
              <div className="p-2.5 rounded-sm bg-[#0d171a] border border-white/10">
                <div className="text-[9px] uppercase tracking-wider text-[#889d9f]">Max BPM</div>
                <div
                  className="font-mono-tabular text-base font-bold mt-0.5"
                  style={{ color: maxBpm >= 145 ? '#f06262' : '#eab354' }}
                >
                  {maxBpm}
                </div>
              </div>
              <div className="p-2.5 rounded-sm bg-[#0d171a] border border-white/10">
                <div className="text-[9px] uppercase tracking-wider text-[#889d9f]">Escapes</div>
                <div className="font-mono-tabular text-base font-bold text-[#f3ece0] mt-0.5">
                  {jumpscaresSurvived}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Up Next Preview & Action Buttons */}
          <div className="sm:col-span-6 space-y-3">
            <div
              className="p-3.5 rounded-sm border space-y-1.5"
              style={{
                backgroundColor: 'rgba(16, 22, 24, 0.92)',
                borderColor: 'rgba(229, 169, 76, 0.35)',
              }}
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#e5a94c] font-semibold">
                <Flame className="w-3.5 h-3.5" />
                <span>Up Next · Chapter {nextMeta.id} of 5</span>
              </div>
              <div className="font-display text-lg font-bold text-[#f7f0e2]">
                {nextMeta.title}{' '}
                <span className="text-xs font-normal text-[#bfa47a]">({nextMeta.hindiTitle})</span>
              </div>
              <p className="text-xs text-[#cfd9da] leading-snug">{nextMeta.briefingIntro}</p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={onNextChapter}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-sm bg-[#b8322b] hover:bg-[#cf3c34] text-[#faf3e8] text-xs font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer"
              >
                <span>Start Chapter {nextMeta.id}: {nextMeta.title}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onReplayChapter}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm border border-white/15 bg-[#0f1a1e] hover:border-white/30 text-[#d3dede] text-xs font-medium transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay Ch {completedChapter}</span>
                </button>
                <button
                  type="button"
                  onClick={onReturnTitle}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm border border-white/10 hover:border-white/25 text-[#9eb2b4] hover:text-[#f0ebe1] text-xs transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Title</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
