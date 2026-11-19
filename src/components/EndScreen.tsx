import React, { useMemo, useState } from 'react';
import {
  Download,
  Share2,
  RotateCcw,
  Home,
  Check,
  Copy,
  Music,
  Play,
  Pause,
} from 'lucide-react';
import {
  ReportCardStats,
  buildWhatsAppChallengeText,
  formatTime,
  generateReportCardDataUrl,
  getIndianRankTitle,
} from '../game/reportCard';
import { VictorySongData } from '../game/types';

interface EndScreenProps {
  stats: ReportCardStats;
  victorySong?: VictorySongData | null;
  songPlaying?: boolean;
  activeLyricIndex?: number;
  onToggleSong?: () => void;
  onReplaySong?: () => void;
  onPlayAgain: () => void;
  onReturnTitle: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({
  stats,
  victorySong = null,
  songPlaying = false,
  activeLyricIndex = 0,
  onToggleSong,
  onReplaySong,
  onPlayAgain,
  onReturnTitle,
}) => {
  const [copied, setCopied] = useState(false);

  const rank = useMemo(() => getIndianRankTitle(stats), [stats]);
  const cardDataUrl = useMemo(() => generateReportCardDataUrl(stats), [stats]);
  const whatsappUrl = useMemo(() => {
    const text = buildWhatsAppChallengeText(stats);
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [stats]);

  const activeLyric = victorySong?.lyrics[activeLyricIndex] ?? victorySong?.lyrics[0] ?? null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = cardDataUrl;
    a.download = `moksha-ritual-${stats.victory ? 'victory' : 'caught'}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyChallenge = async () => {
    try {
      await navigator.clipboard.writeText(buildWhatsAppChallengeText(stats));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard blocked fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center safe-pad p-2.5 sm:p-4 overflow-y-auto pointer-events-auto"
      style={{
        backgroundColor: stats.victory ? 'rgba(10, 12, 8, 0.86)' : 'rgba(12, 4, 6, 0.92)',
      }}
    >
      <div
        className="w-full max-w-4xl max-h-[94dvh] overflow-y-auto rounded-sm border p-4 sm:p-6 my-auto grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center"
        style={{
          backgroundColor: '#091114',
          borderColor: stats.victory ? 'rgba(234, 179, 84, 0.45)' : 'rgba(205, 58, 62, 0.45)',
        }}
      >
        {/* Left Column: Outcome, Instant Built-In Moksha Geet, Stats & Viral Actions */}
        <div className="sm:col-span-8 space-y-3">
          <div className="space-y-1">
            <p
              className="text-[10px] sm:text-xs tracking-[0.22em] uppercase font-semibold"
              style={{ color: stats.victory ? '#eab354' : '#e0585c' }}
            >
              {stats.victory
                ? 'Chapter 5 Finale Complete · Moksha Achieved'
                : `Game Over · Chapter ${stats.chapter ?? 1} of 5`}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#f5efe2] tracking-wide">
              {stats.victory ? 'Atma Ko Shanti Mili' : 'Haveli Ne Nigal Liya'}
            </h2>
            <p className="text-xs sm:text-sm text-[#a8b8ba] italic">
              {stats.victory
                ? '“Dhanyavaad... ab mujhe shanti mili...”'
                : '“Bhaag ke kahan jaoge...?”'}
            </p>
          </div>

          {/* Instant Built-In Victory Ghost Song Player ("Moksha Geet") */}
          {stats.victory && victorySong && (
            <div
              className="p-3 rounded-sm border space-y-2"
              style={{
                backgroundColor: 'rgba(18, 15, 10, 0.92)',
                borderColor: 'rgba(234, 179, 84, 0.42)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Music className="w-4 h-4 text-[#eab354] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-[#cfa256] truncate">
                      Moksha Geet · Raga Bhairavi → Yaman
                    </div>
                    <div className="font-display text-sm sm:text-base font-bold text-[#f8eed9] truncate">
                      {victorySong.title}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={onToggleSong}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-[#d99738] hover:bg-[#eaab49] text-[#140e06] text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {songPlaying ? (
                      <>
                        <Pause className="w-3 h-3 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onReplaySong}
                    className="inline-flex items-center justify-center p-1.5 rounded-sm border border-[#eab354]/40 text-[#e7cf9d] hover:text-white hover:border-[#eab354] transition-colors cursor-pointer"
                    aria-label="Replay ghost song"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {activeLyric && (
                <div className="pt-1.5 border-t border-[#eab354]/20 space-y-0.5">
                  <p className="text-[11px] text-[#e0c286] leading-snug">{activeLyric.hindi}</p>
                  <p className="font-display italic text-xs sm:text-sm text-[#fbf2e0] leading-snug">
                    “{activeLyric.hinglish}”
                  </p>
                  <div className="pt-1 flex items-center gap-1">
                    {victorySong.lyrics.map((l, idx) => (
                      <div
                        key={`${l.timeSec}-${idx}`}
                        className="h-1 flex-1 transition-colors"
                        style={{
                          backgroundColor:
                            idx === activeLyricIndex
                              ? '#eab354'
                              : idx < activeLyricIndex
                                ? 'rgba(234, 179, 84, 0.45)'
                                : 'rgba(255, 255, 255, 0.14)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Earned Indian Rank + 4-Column Metrics Row */}
          <div className="grid grid-cols-12 gap-2">
            <div
              className="col-span-12 sm:col-span-5 p-2.5 rounded-sm border flex flex-col justify-center"
              style={{
                backgroundColor: 'rgba(14, 23, 26, 0.9)',
                borderColor: stats.victory ? 'rgba(234, 179, 84, 0.35)' : 'rgba(205, 58, 62, 0.35)',
              }}
            >
              <span className="text-[9px] tracking-[0.18em] uppercase text-[#8ea4a6]">
                Survivor Rank
              </span>
              <div className="font-display text-lg font-bold text-[#f7f0e2] leading-tight">
                {rank.title}
              </div>
            </div>

            <div className="col-span-12 sm:col-span-7 grid grid-cols-4 gap-1.5">
              <div className="p-2 rounded-sm bg-[#0d171a] border border-white/10">
                <div className="text-[9px] uppercase tracking-wider text-[#889d9f]">Time</div>
                <div className="font-mono-tabular text-sm font-bold text-[#f3ece0] mt-0.5">
                  {formatTime(stats.elapsedSeconds)}
                </div>
              </div>
              <div className="p-2 rounded-sm bg-[#0d171a] border border-white/10">
                <div className="text-[9px] uppercase tracking-wider text-[#889d9f]">Mode</div>
                <div className="font-mono-tabular text-sm font-bold text-[#f3ece0] mt-0.5 capitalize truncate">
                  {stats.difficulty}
                </div>
              </div>
              <div className="p-2 rounded-sm bg-[#0d171a] border border-white/10">
                <div className="text-[9px] uppercase tracking-wider text-[#889d9f]">BPM</div>
                <div
                  className="font-mono-tabular text-sm font-bold mt-0.5"
                  style={{ color: stats.maxBpm >= 145 ? '#f06262' : '#eab354' }}
                >
                  {stats.maxBpm}
                </div>
              </div>
              <div className="p-2 rounded-sm bg-[#0d171a] border border-white/10">
                <div className="text-[9px] uppercase tracking-wider text-[#889d9f]">Escapes</div>
                <div className="font-mono-tabular text-sm font-bold text-[#f3ece0] mt-0.5">
                  {stats.jumpscaresSurvived}
                </div>
              </div>
            </div>
          </div>

          {/* Actions Row */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm bg-[#d99738] hover:bg-[#eaab49] text-[#140e06] text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Score Card PNG</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm bg-[#1f7a4c] hover:bg-[#26935c] text-[#f3fbf6] text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span>WhatsApp Share</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPlayAgain}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm bg-[#b8322b] hover:bg-[#cf3c34] text-[#faf3e8] text-xs font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Again</span>
              </button>

              <button
                type="button"
                onClick={handleCopyChallenge}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-sm border border-white/15 bg-[#0f1a1e] hover:border-white/30 text-[#d3dede] text-xs font-medium transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#74d19a]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={onReturnTitle}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-sm border border-white/10 hover:border-white/25 text-[#9eb2b4] hover:text-[#f0ebe1] text-xs transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Title</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Survivor Report Card Preview (side-by-side on landscape phones!) */}
        <div className="sm:col-span-4 flex flex-col items-center">
          <div className="w-full max-w-[160px] sm:max-w-[195px] rounded-sm overflow-hidden border border-white/15 shadow-2xl bg-[#05090a]">
            <img
              src={cardDataUrl}
              alt="Survivor Report Card preview for Instagram Story"
              className="w-full h-auto block"
            />
          </div>
          <span className="mt-1.5 text-[10px] text-[#7f9496]">
            9:16 Story Card (1080×1920)
          </span>
        </div>
      </div>
    </div>
  );
};
