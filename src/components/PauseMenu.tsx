import React from 'react';
import {
  Play,
  RotateCcw,
  Home,
  Volume2,
  VolumeX,
  BookOpen,
  Maximize,
  Minimize,
} from 'lucide-react';
import { GameSettings, GraphicsQuality } from '../game/types';

interface PauseMenuProps {
  settings: GameSettings;
  isFullscreen?: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenGuide: () => void;
  onQuit: () => void;
  onChangeVolume: (v: number) => void;
  onToggleMute: () => void;
  onChangeQuality: (q: GraphicsQuality) => void;
  onToggleFullscreen?: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  settings,
  isFullscreen = false,
  onResume,
  onRestart,
  onOpenGuide,
  onQuit,
  onChangeVolume,
  onToggleMute,
  onChangeQuality,
  onToggleFullscreen,
}) => {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center safe-pad p-3 sm:p-5 overflow-y-auto pointer-events-auto"
      style={{ backgroundColor: 'rgba(4, 9, 11, 0.88)' }}
    >
      <div
        className="w-full max-w-xl max-h-[94dvh] overflow-y-auto rounded-sm border border-white/15 p-4 sm:p-6 space-y-4"
        style={{ backgroundColor: '#0a1215' }}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div>
            <p className="text-[10px] tracking-[0.24em] uppercase text-[#d59d4a]">Ritual Paused</p>
            <h2 className="font-display text-2xl font-bold tracking-[0.1em] text-[#f3ece0]">
              MOKSHA
            </h2>
          </div>
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-white/15 text-xs text-[#d6e0e0] hover:border-[#e5a94c]/60 cursor-pointer"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
            </button>
          )}
        </div>

        {/* 2-Column Landscape Layout (zero scroll on 360px phone!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          {/* Left: Primary Actions */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={onResume}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm bg-[#b8322b] hover:bg-[#cf3c34] text-[#faf3e8] text-xs font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume</span>
            </button>

            <button
              type="button"
              onClick={onOpenGuide}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-sm border border-[#e5a94c]/35 bg-[#121c1e] hover:border-[#e5a94c]/70 text-[#f1dfc0] text-xs font-medium transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#e5a94c]" />
              <span>Mission Guide</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onRestart}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm border border-white/15 bg-[#101c20] hover:border-white/30 text-[#e2dcd0] text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>

              <button
                type="button"
                onClick={onQuit}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm border border-white/10 hover:border-white/25 text-[#9eb2b4] hover:text-[#f0ebe1] text-xs transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Title</span>
              </button>
            </div>
          </div>

          {/* Right: Audio & Graphics Settings */}
          <div className="space-y-3 sm:pl-3 sm:border-l sm:border-white/10">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#91a5a8]">
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="flex items-center gap-1.5 hover:text-[#f0c06d] cursor-pointer"
                >
                  {settings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{settings.muted ? 'Muted' : 'Audio Volume'}</span>
                </button>
                <span className="font-mono-tabular text-[#d7e0e0]">
                  {settings.muted ? '0%' : `${Math.round(settings.volume * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.muted ? 0 : settings.volume}
                onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                className="w-full accent-[#e5a94c] cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs text-[#91a5a8]">Graphics Quality</span>
              <div className="grid grid-cols-2 gap-2">
                {(['high', 'low'] as GraphicsQuality[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onChangeQuality(q)}
                    className={`py-2 px-3 text-xs font-medium rounded-sm border transition-colors cursor-pointer ${
                      settings.quality === q
                        ? 'bg-[#2a4a52]/40 border-[#6ea8b5]/70 text-[#e8f4f6]'
                        : 'bg-[#070d10] border-white/10 text-[#91a5a8] hover:border-white/25'
                    }`}
                  >
                    {q === 'high' ? 'High' : 'Low FPS+'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
