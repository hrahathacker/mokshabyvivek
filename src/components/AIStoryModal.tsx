import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { HorrorAudioManager } from '../game/audio';
import { BUILT_IN_STORY } from '../game/storyData';

interface AIStoryModalProps {
  audio: HorrorAudioManager | null;
  onContinue: () => void;
}

export const AIStoryModal: React.FC<AIStoryModalProps> = ({ audio, onContinue }) => {
  const [chapterIdx, setChapterIdx] = useState(0);
  const [voiceActive, setVoiceActive] = useState(true);

  const story = BUILT_IN_STORY;
  const currentChapter = story.chapters[chapterIdx];
  const totalChapters = story.chapters.length;
  const isLastChapter = chapterIdx >= totalChapters - 1;

  const speakCurrentChapter = useCallback(
    (idx: number) => {
      if (!audio || !voiceActive) return;
      const ch = story.chapters[idx];
      if (!ch) return;
      audio.playLocalStoryNarration(`${ch.hindiQuote} ${ch.narration}`);
    },
    [audio, voiceActive, story]
  );

  useEffect(() => {
    audio?.playTempleBell(0.32);
    speakCurrentChapter(chapterIdx);
    return () => {
      audio?.stopStoryNarration();
    };
  }, [chapterIdx, audio, speakCurrentChapter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        audio?.stopStoryNarration();
        onContinue();
      } else if (e.code === 'ArrowRight' || e.code === 'Enter') {
        if (chapterIdx < totalChapters - 1) {
          setChapterIdx((c) => c + 1);
        } else {
          audio?.stopStoryNarration();
          onContinue();
        }
      } else if (e.code === 'ArrowLeft' && chapterIdx > 0) {
        setChapterIdx((c) => c - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chapterIdx, totalChapters, audio, onContinue]);

  const handleToggleVoice = () => {
    if (voiceActive) {
      audio?.stopStoryNarration();
      setVoiceActive(false);
    } else {
      setVoiceActive(true);
      if (audio && currentChapter) {
        audio.playLocalStoryNarration(`${currentChapter.hindiQuote} ${currentChapter.narration}`);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center safe-pad p-3 sm:p-5 overflow-y-auto pointer-events-auto"
      style={{ backgroundColor: 'rgba(4, 8, 10, 0.92)' }}
    >
      <div
        className="w-full max-w-2xl max-h-[94dvh] overflow-y-auto rounded-sm border border-[#e5a94c]/35 p-4 sm:p-6 my-auto space-y-3.5 sm:space-y-5"
        style={{ backgroundColor: '#091114' }}
      >
        {/* Top Story Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5 sm:pb-3.5">
          <div className="min-w-0">
            <p className="font-mono-tabular text-[10px] sm:text-[11px] tracking-[0.22em] text-[#e5a94c] uppercase">
              {story.year} · Haveli Backstory
            </p>
            <h2 className="font-display text-lg sm:text-2xl font-bold text-[#f3ece0] tracking-wide truncate">
              {story.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              audio?.stopStoryNarration();
              onContinue();
            }}
            className="text-[11px] sm:text-xs uppercase tracking-[0.16em] text-[#96abae] hover:text-[#f3ece0] transition-colors cursor-pointer py-1.5 px-2.5 whitespace-nowrap shrink-0"
          >
            Skip Story
          </button>
        </div>

        {/* Active Story Chapter Content */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-3 text-[11px] sm:text-xs text-[#8da3a6]">
            <span className="font-mono-tabular">
              Part {chapterIdx + 1} of {totalChapters} · {currentChapter.moodCue}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => speakCurrentChapter(chapterIdx)}
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-[#e5b560] hover:text-[#f8d894] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Replay Voice</span>
              </button>
              <button
                type="button"
                onClick={handleToggleVoice}
                className="inline-flex items-center gap-1 text-xs text-[#91a7aa] hover:text-white transition-colors cursor-pointer"
                aria-label={voiceActive ? 'Mute narration' : 'Enable narration'}
              >
                {voiceActive ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[#f7f0e2] leading-snug">
              0{chapterIdx + 1}. {currentChapter.heading}
            </h3>

            <p className="font-display italic text-sm sm:text-base text-[#e09c52] py-1.5 border-y border-white/10">
              “{currentChapter.hindiQuote}”
            </p>

            <p className="text-sm sm:text-[15px] leading-relaxed text-[#d9d2c5]">
              {currentChapter.narration}
            </p>
          </div>

          {/* Progress Bar Segments */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {story.chapters.map((ch, idx) => (
              <button
                key={ch.heading}
                type="button"
                onClick={() => setChapterIdx(idx)}
                aria-label={`Read story part ${idx + 1}`}
                className="h-1.5 rounded-none transition-colors cursor-pointer"
                style={{
                  backgroundColor:
                    idx === chapterIdx
                      ? '#e5a94c'
                      : idx < chapterIdx
                        ? 'rgba(229, 169, 76, 0.45)'
                        : 'rgba(255, 255, 255, 0.12)',
                }}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={chapterIdx === 0}
              onClick={() => setChapterIdx((c) => Math.max(0, c - 1))}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm border border-white/15 text-xs font-medium uppercase tracking-wider text-[#c7d4d5] hover:border-white/30 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {!isLastChapter ? (
              <button
                type="button"
                onClick={() => setChapterIdx((c) => c + 1)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-sm bg-[#d99738] hover:bg-[#eaa948] text-[#140e06] text-xs font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer"
              >
                <span>Next Part</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  audio?.stopStoryNarration();
                  onContinue();
                }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-sm bg-[#b8322b] hover:bg-[#cf3c34] text-[#faf3e8] text-xs font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer"
              >
                <span>Read How to Survive</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
